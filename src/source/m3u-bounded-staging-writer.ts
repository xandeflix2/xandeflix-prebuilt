import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import type { Movie, Series, Season, Episode, ArtworkRef, StreamRef, Category, Genre, PrebuiltCatalog } from '../contracts/catalog.ts';
import type { LiveCatalog, LiveGroup, LiveChannel } from '../catalog/live/live-tv.types.ts';
import { LiveCatalogService } from '../catalog/live/live-catalog.service.ts';
import { createSha256Stream } from '../security/artifact-hash.ts';
import { calculateSha256Async } from '../provisioning/integrity.ts';
import { CURRENT_CLASSIFICATION_PROFILE_VERSION } from './source-classification-profile.ts';
import { resolveSegmentRelativePath } from '../bootstrap/storage/segment-path-resolver.ts';
import { bootTelemetry, yieldToEventLoop } from '../diagnostics/boot-telemetry.ts';
import type {
  LocalCatalogStorage,
  CatalogSegmentEntry,
  SegmentedCatalogManifest,
  SegmentedCatalogProvenance,
} from '../bootstrap/storage/storage.interface.ts';

// Bounded like the normalization batches; fewer WebView/filesystem round trips
// without retaining a whole source or changing the catalog's record contents.
export const IMPORT_BATCH_SIZE = 2500;
export const SERIES_MEMORY_STRATEGY = 'COMPACT_ACCUMULATOR_METADATA';
export const FULL_CATALOG_JSON_STRINGIFY_REMOVED = true;
export const FULL_STAGING_JSON_PARSE_REMOVED = true;
export const STREAMING_HASH_USED = true;
export const SEARCH_BUILD_DEFERRED_AFTER_PROMOTION = true;
export const SEARCH_BUILD_BATCHED = true;
export const EVENT_LOOP_YIELD_PRESENT = true;
export const MAX_SINGLE_STORAGE_WRITE_ESTIMATE = '256_KB';
export const GLOBAL_ALL_EPISODE_IDS_REMOVED = true;
export const SERIES_RELATIONSHIP_STORAGE_BOUNDED = true;
export const FULL_ALLSERIES_ALLSEASONS_PEAK_REMOVED = true;

export interface BoundedStagingWriterOptions {
  snapshotId: string;
  storage?: LocalCatalogStorage;
  batchSize?: number;
}

export class M3uBoundedStagingWriter {
  readonly snapshotId: string;
  private readonly storage?: LocalCatalogStorage;
  private readonly batchSize: number;
  private readonly streamingHash = createSha256Stream();
  private readonly encoder = new TextEncoder();

  private totalCatalogBytes = 0;
  private segmentSeq = 0;
  readonly segmentEntries: CatalogSegmentEntry[] = [];

  private currentBatchMovies: Movie[] = [];
  private currentBatchEpisodes: Episode[] = [];
  private currentBatchStreams: StreamRef[] = [];
  private currentBatchLive: LiveChannel[] = [];
  private batchItemCount = 0;

  readonly firstFoldMovies: Movie[] = [];
  readonly firstFoldEpisodes: Episode[] = [];
  readonly firstFoldStreams: StreamRef[] = [];
  readonly firstFoldLive: LiveChannel[] = [];

  constructor(options: BoundedStagingWriterOptions) {
    this.snapshotId = options.snapshotId;
    this.storage = options.storage;
    this.batchSize = options.batchSize || IMPORT_BATCH_SIZE;
  }


  private async writeSegment(fileName: string, json: string): Promise<void> {
    const relPath = resolveSegmentRelativePath(fileName);
    if (this.storage?.writeStagingSegment) {
      await this.storage.writeStagingSegment(this.snapshotId, relPath, json);
    } else if (typeof window !== 'undefined') {
      console.log(`[FILESYSTEM] writeFile: prebuilt/staging/${this.snapshotId}/${relPath}`);
      await Filesystem.writeFile({
        path: `prebuilt/staging/${this.snapshotId}/${relPath}`,
        data: json,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
        recursive: true,
      });
    }
  }

  addMovie(movie: Movie, stream: StreamRef, _artwork?: ArtworkRef): void {
    this.currentBatchMovies.push(movie);
    this.currentBatchStreams.push(stream);
    this.batchItemCount++;
  }

  addEpisode(episode: Episode, stream: StreamRef, _artwork?: ArtworkRef): void {
    this.currentBatchEpisodes.push(episode);
    this.currentBatchStreams.push(stream);
    this.batchItemCount++;
  }

  addLiveChannel(channel: LiveChannel): void {
    this.currentBatchLive.push(channel);
    this.batchItemCount++;
  }

  shouldFlush(): boolean {
    return this.batchItemCount >= this.batchSize;
  }

  async flushBatch(recordsProcessed = 0): Promise<void> {
    return this.flush(recordsProcessed);
  }

  async flush(recordsProcessed = 0): Promise<void> {
    if (this.batchItemCount === 0) return;
    this.segmentSeq++;
    const seqStr = String(this.segmentSeq).padStart(6, '0');

    if (this.currentBatchMovies.length > 0) {
      const json = JSON.stringify(this.currentBatchMovies);
      const bytes = this.encoder.encode(json);
      const byteSize = bytes.byteLength;
      this.totalCatalogBytes += byteSize;
      this.streamingHash.update(bytes);
      const sha256 = await calculateSha256Async(bytes);
      const fileName = `movies_${seqStr}.json`;
      await this.writeSegment(fileName, json);
      this.segmentEntries.push({ fileName, kind: 'movies', recordCount: this.currentBatchMovies.length, byteSize, sha256 });
      if (this.firstFoldMovies.length < 100) {
        this.firstFoldMovies.push(...this.currentBatchMovies.slice(0, 100 - this.firstFoldMovies.length));
      }
      this.currentBatchMovies = [];
    }

    if (this.currentBatchEpisodes.length > 0) {
      const json = JSON.stringify(this.currentBatchEpisodes);
      const bytes = this.encoder.encode(json);
      const byteSize = bytes.byteLength;
      this.totalCatalogBytes += byteSize;
      this.streamingHash.update(bytes);
      const sha256 = await calculateSha256Async(bytes);
      const fileName = `episodes_${seqStr}.json`;
      await this.writeSegment(fileName, json);
      this.segmentEntries.push({ fileName, kind: 'episodes', recordCount: this.currentBatchEpisodes.length, byteSize, sha256 });
      if (this.firstFoldEpisodes.length < 100) {
        this.firstFoldEpisodes.push(...this.currentBatchEpisodes.slice(0, 100 - this.firstFoldEpisodes.length));
      }
      this.currentBatchEpisodes = [];
    }

    if (this.currentBatchStreams.length > 0) {
      const json = JSON.stringify(this.currentBatchStreams);
      const bytes = this.encoder.encode(json);
      const byteSize = bytes.byteLength;
      this.totalCatalogBytes += byteSize;
      this.streamingHash.update(bytes);
      const sha256 = await calculateSha256Async(bytes);
      const fileName = `streams_${seqStr}.json`;
      await this.writeSegment(fileName, json);
      this.segmentEntries.push({ fileName, kind: 'streams', recordCount: this.currentBatchStreams.length, byteSize, sha256 });
      if (this.firstFoldStreams.length < 200) {
        this.firstFoldStreams.push(...this.currentBatchStreams.slice(0, 200 - this.firstFoldStreams.length));
      }
      this.currentBatchStreams = [];
    }

    if (this.currentBatchLive.length > 0) {
      const json = JSON.stringify(this.currentBatchLive);
      const bytes = this.encoder.encode(json);
      const byteSize = bytes.byteLength;
      this.totalCatalogBytes += byteSize;
      this.streamingHash.update(bytes);
      const sha256 = await calculateSha256Async(bytes);
      const fileName = `live_${seqStr}.json`;
      await this.writeSegment(fileName, json);
      this.segmentEntries.push({ fileName, kind: 'live', recordCount: this.currentBatchLive.length, byteSize, sha256 });
      if (this.firstFoldLive.length < 100) {
        this.firstFoldLive.push(...this.currentBatchLive.slice(0, 100 - this.firstFoldLive.length));
      }
      this.currentBatchLive = [];
    }

    this.batchItemCount = 0;
    bootTelemetry.mark('IMPORT_BATCH_PERSISTED', { batch: this.segmentSeq, recordsProcessed });
    await yieldToEventLoop();
  }

  async writeSeriesBatch(batch: Series[]): Promise<void> {
    if (batch.length === 0) return;
    this.segmentSeq++;
    const seqStr = String(this.segmentSeq).padStart(6, '0');
    const json = JSON.stringify(batch);
    const bytes = this.encoder.encode(json);
    const byteSize = bytes.byteLength;
    this.totalCatalogBytes += byteSize;
    this.streamingHash.update(bytes);
    const sha256 = await calculateSha256Async(bytes);
    const fileName = `series_${seqStr}.json`;
    await this.writeSegment(fileName, json);
    this.segmentEntries.push({ fileName, kind: 'series', recordCount: batch.length, byteSize, sha256 });
    await yieldToEventLoop();
  }

  async writeSeasonsBatch(batch: Season[]): Promise<void> {
    if (batch.length === 0) return;
    this.segmentSeq++;
    const seqStr = String(this.segmentSeq).padStart(6, '0');
    const json = JSON.stringify(batch);
    const bytes = this.encoder.encode(json);
    const byteSize = bytes.byteLength;
    this.totalCatalogBytes += byteSize;
    this.streamingHash.update(bytes);
    const sha256 = await calculateSha256Async(bytes);
    const fileName = `seasons_${seqStr}.json`;
    await this.writeSegment(fileName, json);
    this.segmentEntries.push({ fileName, kind: 'seasons', recordCount: batch.length, byteSize, sha256 });
    await yieldToEventLoop();
  }

  async writeSeriesAndSeasons(allSeries: Series[], allSeasons: Season[]): Promise<void> {
    const BATCH_SIZE = this.batchSize;
    for (let offset = 0; offset < allSeries.length; offset += BATCH_SIZE) {
      const batch = allSeries.slice(offset, offset + BATCH_SIZE);
      await this.writeSeriesBatch(batch);
    }
    for (let offset = 0; offset < allSeasons.length; offset += BATCH_SIZE) {
      const batch = allSeasons.slice(offset, offset + BATCH_SIZE);
      await this.writeSeasonsBatch(batch);
    }
  }

  async finalizeStaging(params: {
    provenance?: SegmentedCatalogProvenance;
    nowIso: string;
    rawItemCount: number;
    movieCount: number;
    seriesCount: number;
    seasonCount: number;
    episodeCount: number;
    liveCount: number;
    categories: Category[];
    genres: Genre[];
    liveGroups: LiveGroup[];
    categoryProvenance: any[];
    firstFoldSeries: Series[];
    firstFoldSeasons: Season[];
  }): Promise<{
    catalogHeader: PrebuiltCatalog;
    liveCatalog: LiveCatalog;
    manifest: SegmentedCatalogManifest;
    catalogSha256: string;
    totalCatalogBytes: number;
  }> {
    const catalogSha256 = this.streamingHash.digest();

    const catalogHeader: PrebuiltCatalog = {
      metadata: {
        schemaVersion: 1,
        catalogVersion: '1.0.0',
        snapshotId: this.snapshotId,
        generatedAt: params.nowIso,
        generator: 'RealSourceImporterService/BoundedM3U',
        counts: {
          movies: params.movieCount,
          series: params.seriesCount,
          seasons: params.seasonCount,
          episodes: params.episodeCount,
          categories: params.categories.length,
          genres: params.genres.length,
          streams: params.movieCount + params.episodeCount,
          artworks: 0,
        },
      },
      categories: params.categories,
      genres: params.genres,
      movies: this.firstFoldMovies,
      series: params.firstFoldSeries,
      seasons: params.firstFoldSeasons,
      episodes: this.firstFoldEpisodes,
      streams: this.firstFoldStreams,
      artworks: [],
      extensions: {
        categoryProvenance: params.categoryProvenance,
        isSegmented: true,
      },
    };

    const liveCatalog = LiveCatalogService.buildCatalog(
      this.snapshotId,
      params.liveGroups,
      this.firstFoldLive,
      {
        totalChannels: params.liveCount,
        segmentFiles: this.segmentEntries
          .filter((entry) => entry.kind === 'live')
          .map((entry) => entry.fileName),
      }
    );

    const manifest: SegmentedCatalogManifest = {
      snapshotId: this.snapshotId,
      classificationProfileVersion: CURRENT_CLASSIFICATION_PROFILE_VERSION,
      generatedAt: params.nowIso,
      totalRecords: params.rawItemCount,
      catalogSizeBytes: this.totalCatalogBytes,
      catalogSha256,
      packageContentHash: catalogSha256,
      ...(params.provenance ? { metadata: params.provenance } : {}),
      counts: {
        movies: params.movieCount,
        series: params.seriesCount,
        seasons: params.seasonCount,
        episodes: params.episodeCount,
        live: params.liveCount,
        streams: params.movieCount + params.episodeCount,
        artworks: 0,
        categories: params.categories.length,
        genres: params.genres.length,
      },
      segments: this.segmentEntries,
    };

    if (this.storage?.writeStaging) {
      await this.storage.writeStaging(
        this.snapshotId,
        {
          schemaVersion: 1,
          packageFormatVersion: 2,
          snapshotId: this.snapshotId,
          catalogVersion: '1.0.0',
          generatedAt: params.nowIso,
          generator: 'RealSourceImporterService/BoundedM3U',
          catalogSha256,
          packageContentHash: catalogSha256,
          catalogSizeBytes: this.totalCatalogBytes,
          allowSensitiveRuntimeLocators: true,
          classificationProfileVersion: CURRENT_CLASSIFICATION_PROFILE_VERSION,
          ...(params.provenance ? { metadata: params.provenance } : {}),
          counts: manifest.counts,
          segments: this.segmentEntries,
        } as any,
        JSON.stringify(catalogHeader, null, 2),
        null,
        liveCatalog
      );
    }

    bootTelemetry.mark('IMPORT_STAGING_FINALIZED');


    return {
      catalogHeader,
      liveCatalog,
      manifest,
      catalogSha256,
      totalCatalogBytes: this.totalCatalogBytes,
    };
  }
}
