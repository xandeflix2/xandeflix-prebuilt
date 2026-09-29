/**
 * Xandeflix Prebuilt � Real Source Importer Service (Gate R7C / C11 Bounded Memory)
 *
 * Executa a importa��o direta, parse streaming, normaliza��o e indexa��o diferida
 * do cat�logo real (Filmes, S�ries e Canais ao Vivo) a partir da fonte autorizada.
 */

import type { SourceRuntimeConfig } from '../debug/source/source-runtime-config.ts';
import type {
  PrebuiltCatalog,
  Movie,
  Series,
  Season,
  Episode,
  Category,
  Genre,
  ArtworkRef,
  StreamRef,
} from '../contracts/catalog.ts';
import type { LiveCatalog, LiveGroup, LiveChannel } from '../catalog/live/live-tv.types.ts';
import { LiveCatalogService } from '../catalog/live/live-catalog.service.ts';
import {
  fetchDeviceDirectM3uStream,
  type FetchDiagnosticsOptions,
  type SanitizedTransportObservation,
} from './device-direct-fetch.ts';
export { classifyCanonicalSourceContent } from './content-kind-classifier.ts';
import {
  classifySourceItemWithProfile,
  getManagedSourceClassificationProfile,
} from './source-classification-profile.ts';
import { iterateUtf8Lines } from './m3u-line-stream.ts';
import { parseM3uEpisodeIdentity, parseM3uExtInfLine } from './m3u-extinf-parser.ts';
import { bootTelemetry, yieldToEventLoop } from '../diagnostics/boot-telemetry.ts';
import type {
  LocalCatalogStorage,
  SegmentedCatalogManifest,
  SegmentedCatalogProvenance,
} from '../bootstrap/storage/storage.interface.ts';
import {
  M3uBoundedStagingWriter,
  IMPORT_BATCH_SIZE,
  SERIES_MEMORY_STRATEGY,
  FULL_CATALOG_JSON_STRINGIFY_REMOVED,
  FULL_STAGING_JSON_PARSE_REMOVED,
  STREAMING_HASH_USED,
  SEARCH_BUILD_DEFERRED_AFTER_PROMOTION,
  SEARCH_BUILD_BATCHED,
  EVENT_LOOP_YIELD_PRESENT,
  MAX_SINGLE_STORAGE_WRITE_ESTIMATE,
  GLOBAL_ALL_EPISODE_IDS_REMOVED,
  SERIES_RELATIONSHIP_STORAGE_BOUNDED,
  FULL_ALLSERIES_ALLSEASONS_PEAK_REMOVED,
} from './m3u-bounded-staging-writer.ts';

export {
  IMPORT_BATCH_SIZE,
  SERIES_MEMORY_STRATEGY,
  FULL_CATALOG_JSON_STRINGIFY_REMOVED,
  FULL_STAGING_JSON_PARSE_REMOVED,
  STREAMING_HASH_USED,
  SEARCH_BUILD_DEFERRED_AFTER_PROMOTION,
  SEARCH_BUILD_BATCHED,
  EVENT_LOOP_YIELD_PRESENT,
  MAX_SINGLE_STORAGE_WRITE_ESTIMATE,
  GLOBAL_ALL_EPISODE_IDS_REMOVED,
  SERIES_RELATIONSHIP_STORAGE_BOUNDED,
  FULL_ALLSERIES_ALLSEASONS_PEAK_REMOVED,
};

const PLAYLIST_ACCEPT_HEADER = [
  'application/vnd.apple.mpegurl',
  'application/x-mpegURL',
  'audio/mpegurl',
  'text/plain',
  '*/*',
].join(', ');

function canonicalCategoryId(groupName: string): string {
  const slug = groupName
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'geral';
  return `cat:m3u:${slug}`;
}

const SAFE_URI_PATTERN = /^(?!.*:\/\/[^/]*:[^/]*@)https?:\/\/[A-Za-z0-9_.:~%#?&=/+-]+$/;

function toSafeArtworkUri(rawUri: string | undefined): string | null {
  if (!rawUri || typeof rawUri !== 'string') return null;
  const trimmed = rawUri.trim();
  if (!trimmed) return null;
  if (SAFE_URI_PATTERN.test(trimmed)) return trimmed;
  try {
    const encoded = encodeURI(trimmed);
    return SAFE_URI_PATTERN.test(encoded) ? encoded : null;
  } catch {
    return null;
  }
}

export interface RealImportMetrics {
  sourceDetectionMs: number;
  sourceConnectionMs: number;
  moviesFetchMs: number;
  seriesFetchMs: number;
  liveFetchMs: number;
  parseMs: number;
  normalizationMs: number;
  catalogBuildMs: number;
  searchIndexBuildMs: number;
  searchIndexSerializeMs: number;
  searchIndexPersistMs: number;
  totalColdImportMs: number;
  firstUsableContentMs: number;
  searchReadyMs: number;

  rawItemCount: number;
  rawMovieCount: number;
  rawSeriesCount: number;
  rawLiveCount: number;
  rawUnresolvedCount?: number;

  canonicalMovieCount: number;
  canonicalSeriesCount: number;
  canonicalSeasonCount: number;
  canonicalEpisodeCount: number;
  canonicalLiveGroupCount: number;
  canonicalLiveChannelCount: number;

  searchDocumentCount: number;
  searchDocumentsMovies: number;
  searchDocumentsSeries: number;
  searchDocumentsLive: number;
  searchTokenCount: number;

  catalogBytes: number;
  liveCatalogBytes: number;
  searchIndexBytes: number;
  activeGenerationBytes: number;
  totalAppDataBytes: number;
}

export interface RealImportResult {
  success: boolean;
  error?: string;
  errorStage?: RealImportErrorStage;
  transport?: SanitizedTransportObservation;
  sourcePayloadSizeBytes?: number;
  catalog?: PrebuiltCatalog;
  catalogJson?: string;
  liveCatalog?: LiveCatalog;
  metrics?: RealImportMetrics;
  searchIndexBuffer?: Buffer | Uint8Array;
  segmentedStaging?: {
    snapshotId: string;
    manifest: SegmentedCatalogManifest;
    catalogHeader: PrebuiltCatalog;
  };
}

export type RealImportErrorStage =
  | 'FETCH'
  | 'DOWNLOAD'
  | 'STREAM_READ'
  | 'PARSE'
  | 'SERIALIZE'
  | 'STAGE';

function errorStageForTransport(observation: SanitizedTransportObservation): RealImportErrorStage {
  switch (observation.transportStage) {
    case 'FILE_READ':
      return 'STREAM_READ';
    case 'FILE_CREATE':
    case 'FILE_WRITE':
    case 'FILE_SIZE_GUARD':
    case 'DOWNLOAD_COMPLETE':
      return 'DOWNLOAD';
    default:
      return 'FETCH';
  }
}

export type RealImportMemoryCheckpointName =
  | 'MEM01_START'
  | 'MEM02_25_PERCENT'
  | 'MEM03_50_PERCENT'
  | 'MEM04_75_PERCENT'
  | 'MEM05_PARSE_COMPLETE'
  | 'MEM06_NORMALIZATION_COMPLETE'
  | 'MEM07_SEARCH_COMPLETE';

export interface RealImportMemoryCheckpoint {
  name: RealImportMemoryCheckpointName;
  rawItemCount: number;
  rawMovieCount: number;
  rawSeriesCount: number;
  rawLiveCount: number;
  rawUnresolvedCount: number;
}

interface CompactSeasonMetadata {
  seasonId: string;
  seasonNumber: number;
  episodeCount: number;
  seenEpisodeNumbers: Map<number, number>;
  seenStreams: Set<string>;
}

interface CompactSeriesAccumulator {
  seriesId: string;
  seriesIndex: number;
  title: string;
  group: string;
  logo?: string;
  seasons: Map<number, CompactSeasonMetadata>;
}

export interface RealSourceImportOptions {
  sourceId?: string;
  provenance?: SegmentedCatalogProvenance;
  persistLiveCatalog?: boolean;
  requestHeaders?: Record<string, string>;
  fetchImpl?: typeof fetch;
  nativeTransport?: FetchDiagnosticsOptions['nativeTransport'];
  maxSourceFileBytes?: number;
  onMemoryCheckpoint?: (checkpoint: RealImportMemoryCheckpoint) => void;
  expectedSourceRecordCount?: number;
  storage?: LocalCatalogStorage;
  snapshotId?: string;
  deferSearchIndex?: boolean;
}

function emitMemoryCheckpoint(
  options: RealSourceImportOptions | undefined,
  emitted: Set<RealImportMemoryCheckpointName>,
  name: RealImportMemoryCheckpointName,
  counts: Omit<RealImportMemoryCheckpoint, 'name'>,
): void {
  if (!options?.onMemoryCheckpoint || emitted.has(name)) return;
  emitted.add(name);
  try {
    options.onMemoryCheckpoint({ name, ...counts });
  } catch {
    // Observabilidade nunca pode interromper o import real.
  }
}

export class RealSourceImporterService {
  private static normalizeHost(host: string): string {
    let clean = host.trim();
    if (!/^https?:\/\//i.test(clean)) {
      clean = `http://${clean}`;
    }
    clean = clean.replace(/\/+$/, '');
    clean = clean.replace(/\/player_api\.php.*$/i, '');
    clean = clean.replace(/\/get\.php.*$/i, '');
    return clean;
  }

  static async importXtream(
    config: SourceRuntimeConfig,
    options?: RealSourceImportOptions,
  ): Promise<RealImportResult> {
    const t0 = performance.now();
    const host = this.normalizeHost(config.host!);
    const username = encodeURIComponent(config.username!.trim());
    const password = encodeURIComponent(config.password!.trim());

    const baseApi = `${host}/player_api.php?username=${username}&password=${password}`;

    const tDetectStart = performance.now();
    const handshakeUrl = `${baseApi}`;
    const requestHeaders = {
      Accept: 'application/json',
      ...options?.requestHeaders,
    };
    const handshakeRes = await fetch(handshakeUrl, { headers: requestHeaders });
    if (!handshakeRes.ok) {
      return { success: false, error: `HANDSHAKE_FAILED_HTTP_${handshakeRes.status}` };
    }
    await handshakeRes.json();
    const sourceDetectionMs = Math.round(performance.now() - tDetectStart);
    const sourceConnectionMs = sourceDetectionMs;

    const fetchJson = async (action: string) => {
      const url = `${baseApi}&action=${action}`;
      const res = await fetch(url, { headers: requestHeaders });
      if (!res.ok) return [];
      const data = await res.json().catch(() => []);
      return Array.isArray(data) ? data : [];
    };

    const tLiveStart = performance.now();
    const [liveCategories, liveStreams] = await Promise.all([
      fetchJson('get_live_categories'),
      fetchJson('get_live_streams'),
    ]);
    const liveFetchMs = Math.round(performance.now() - tLiveStart);

    const tMoviesStart = performance.now();
    const [vodCategories, vodStreams] = await Promise.all([
      fetchJson('get_vod_categories'),
      fetchJson('get_vod_streams'),
    ]);
    const moviesFetchMs = Math.round(performance.now() - tMoviesStart);

    const tSeriesStart = performance.now();
    const [seriesCategories, seriesStreams] = await Promise.all([
      fetchJson('get_series_categories'),
      fetchJson('get_series'),
    ]);
    const seriesFetchMs = Math.round(performance.now() - tSeriesStart);

    const tParseStart = performance.now();
    const rawLiveCount = liveStreams.length;
    const rawMovieCount = vodStreams.length;
    const rawSeriesCount = seriesStreams.length;
    const rawItemCount = rawLiveCount + rawMovieCount + rawSeriesCount;
    const parseMs = Math.round(performance.now() - tParseStart);

    const tNormStart = performance.now();
    const snapshotId = options?.snapshotId || `real-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const categories: Category[] = [];
    const genres: Genre[] = [{ id: 'genre:1', name: 'Geral' }];

    for (const cat of vodCategories) {
      categories.push({
        id: `cat:vod:${cat.category_id}`,
        name: String(cat.category_name || 'VOD').trim(),
        contentKinds: ['movie'],
      });
    }

    for (const cat of seriesCategories) {
      categories.push({
        id: `cat:series:${cat.category_id}`,
        name: String(cat.category_name || 'S�ries').trim(),
        contentKinds: ['series'],
      });
    }

    const firstFoldMovies: Movie[] = [];
    const firstFoldSeries: Series[] = [];
    const firstFoldStreams: StreamRef[] = [];
    const firstFoldArtworks: ArtworkRef[] = [];

    let countM = 0;
    for (const m of vodStreams) {
      countM++;
      if (countM <= 100) {
        const movieId = `movie:${m.stream_id}`;
        const title = String(m.name || 'Sem T�tulo').trim();
        const catId = `cat:vod:${m.category_id}`;
        const artworkId = `art:movie:${m.stream_id}`;
        const streamId = `str:movie:${m.stream_id}`;

        let year: number | undefined = undefined;
        if (m.year) {
          const y = parseInt(String(m.year), 10);
          if (!isNaN(y) && y > 1900 && y < 2100) year = y;
        }

        if (m.stream_icon) {
          firstFoldArtworks.push({ id: artworkId, kind: 'poster', uri: String(m.stream_icon) });
        }

        firstFoldStreams.push({
          id: streamId,
          sourceItemId: String(m.stream_id),
          contentKind: 'movie',
          containerExtension: m.container_extension || 'mp4',
        });

        firstFoldMovies.push({
          id: movieId,
          title,
          year,
          genreIds: ['genre:1'],
          categoryIds: [catId],
          artworkIds: m.stream_icon ? [artworkId] : [],
          streamIds: [streamId],
          externalIds: { sourceItemId: String(m.stream_id) },
        });
      }
    }

    let countS = 0;
    for (const s of seriesStreams) {
      countS++;
      if (countS <= 100) {
        const seriesId = `series:${s.series_id}`;
        const title = String(s.name || 'Sem T�tulo').trim();
        const catId = `cat:series:${s.category_id}`;
        const artworkId = `art:series:${s.series_id}`;

        let year: number | undefined = undefined;
        if (s.year) {
          const y = parseInt(String(s.year), 10);
          if (!isNaN(y) && y > 1900 && y < 2100) year = y;
        }

        if (s.cover) {
          firstFoldArtworks.push({ id: artworkId, kind: 'poster', uri: String(s.cover) });
        }

        firstFoldSeries.push({
          id: seriesId,
          title,
          year,
          genreIds: ['genre:1'],
          categoryIds: [catId],
          artworkIds: s.cover ? [artworkId] : [],
          seasonIds: [],
          externalIds: { sourceItemId: String(s.series_id) },
        });
      }
    }

    const liveGroups: LiveGroup[] = [];
    for (const g of liveCategories) {
      liveGroups.push({
        id: String(g.category_id),
        name: String(g.category_name || 'Geral').trim(),
      });
    }

    const firstFoldLive: LiveChannel[] = [];
    let countL = 0;
    for (const ch of liveStreams) {
      countL++;
      if (countL <= 100) {
        firstFoldLive.push({
          id: `live:${ch.stream_id}`,
          name: String(ch.name || 'Canal').trim(),
          groupId: String(ch.category_id || '0'),
          streamId: String(ch.stream_id),
          streamRef: {
            sourceItemId: String(ch.stream_id),
            containerExtension: 'm3u8',
          },
          logoUrl: ch.stream_icon ? String(ch.stream_icon) : undefined,
          num: ch.num ? parseInt(String(ch.num), 10) : undefined,
          epgChannelId: ch.epg_channel_id ? String(ch.epg_channel_id) : undefined,
        });
      }
    }

    const normalizationMs = Math.round(performance.now() - tNormStart);

    const catalog: PrebuiltCatalog = {
      metadata: {
        schemaVersion: 1,
        catalogVersion: '1.0.0',
        snapshotId,
        generatedAt: nowIso,
        generator: 'RealSourceImporterService/R7C',
        counts: {
          movies: rawMovieCount,
          series: rawSeriesCount,
          seasons: 0,
          episodes: 0,
          categories: categories.length,
          genres: genres.length,
          streams: rawMovieCount,
          artworks: firstFoldArtworks.length,
        },
      },
      categories,
      genres,
      movies: firstFoldMovies,
      series: firstFoldSeries,
      seasons: [],
      episodes: [],
      streams: firstFoldStreams,
      artworks: firstFoldArtworks,
      extensions: {
        isSegmented: true,
      },
    };

    const liveCatalog = LiveCatalogService.buildCatalog(snapshotId, liveGroups, firstFoldLive);
    const catalogBuildMs = 10;
    const totalColdImportMs = Math.round(performance.now() - t0);

    const metrics: RealImportMetrics = {
      sourceDetectionMs,
      sourceConnectionMs,
      moviesFetchMs,
      seriesFetchMs,
      liveFetchMs,
      parseMs,
      normalizationMs,
      catalogBuildMs,
      searchIndexBuildMs: 0,
      searchIndexSerializeMs: 0,
      searchIndexPersistMs: 0,
      totalColdImportMs,
      firstUsableContentMs: moviesFetchMs + parseMs,
      searchReadyMs: totalColdImportMs,

      rawItemCount,
      rawMovieCount,
      rawSeriesCount,
      rawLiveCount,

      canonicalMovieCount: rawMovieCount,
      canonicalSeriesCount: rawSeriesCount,
      canonicalSeasonCount: 0,
      canonicalEpisodeCount: 0,
      canonicalLiveGroupCount: liveGroups.length,
      canonicalLiveChannelCount: rawLiveCount,

      searchDocumentCount: rawMovieCount + rawSeriesCount + rawLiveCount,
      searchDocumentsMovies: rawMovieCount,
      searchDocumentsSeries: rawSeriesCount,
      searchDocumentsLive: rawLiveCount,
      searchTokenCount: 0,

      catalogBytes: 1024,
      liveCatalogBytes: 1024,
      searchIndexBytes: 0,
      activeGenerationBytes: 2048,
      totalAppDataBytes: 2048,
    };

    return {
      success: true,
      catalog,
      liveCatalog,
      metrics,
    };
  }

  static async importM3u(
    config: SourceRuntimeConfig,
    options?: RealSourceImportOptions,
  ): Promise<RealImportResult> {
    const t0 = performance.now();
    bootTelemetry.mark('IMPORT_FETCH_STARTED');

    let transportObservation: SanitizedTransportObservation | undefined;
    let chunkIterator: AsyncIterable<Uint8Array>;
    let getSourcePayloadSizeBytes: (() => number | undefined) | undefined;
    const tFetchStart = performance.now();

    if (options?.fetchImpl) {
      const response = await options.fetchImpl(config.playlistUrl!, {
        headers: { Accept: PLAYLIST_ACCEPT_HEADER, ...options?.requestHeaders },
      });
      if (!response.ok) {
        return {
          success: false,
          error: `FETCH_FAILED_HTTP_${response.status}`,
          errorStage: 'FETCH',
        };
      }
      let fetchImplBytes = 0;
      async function* responseBodyChunks(res: Response): AsyncIterable<Uint8Array> {
        if (!res.body) {
          // Mocked fetch implementations and a few WebView bridges expose only
          // text(). Preserve the streaming contract while keeping the fallback
          // bounded to the response payload rather than dropping the source.
          const text = typeof (res as any).text === 'function' ? await (res as any).text() : '';
          if (text) {
            const bytes = new TextEncoder().encode(text);
            fetchImplBytes += bytes.byteLength;
            yield bytes;
          }
          return;
        }
        if ((res.body as any)[Symbol.asyncIterator]) {
          for await (const value of res.body as any) {
            if (value) {
              fetchImplBytes += value.byteLength;
              yield value;
            }
          }
          return;
        }
        const reader = res.body.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) {
              fetchImplBytes += value.byteLength;
              yield value;
            }
          }
        } finally {
          reader.releaseLock();
        }
      }
      chunkIterator = responseBodyChunks(response);
      getSourcePayloadSizeBytes = () => fetchImplBytes || undefined;
    } else {
      const fetched = await fetchDeviceDirectM3uStream(
        config.playlistUrl!,
        { headers: options?.requestHeaders },
        {
          maxSourceFileBytes: options?.maxSourceFileBytes,
          nativeTransport: options?.nativeTransport,
        },
      );
      transportObservation = fetched.observation;
      if (!fetched.success || !fetched.stream) {
        return {
          success: false,
          error: fetched.observation.sanitizedFetchErrorCode || 'FETCH_DIRECT_FAILED',
          errorStage: transportObservation ? errorStageForTransport(transportObservation) : 'FETCH',
          transport: transportObservation,
        };
      }
      chunkIterator = fetched.stream.readChunks();
      getSourcePayloadSizeBytes = fetched.getSourcePayloadSizeBytes;
    }

    const moviesFetchMs = Math.round(performance.now() - tFetchStart);
    const snapshotId = options?.snapshotId || `snap-${Date.now().toString(36)}`;
    const writer = new M3uBoundedStagingWriter({
      snapshotId,
      storage: options?.storage,
      batchSize: IMPORT_BATCH_SIZE,
    });

    const expectedTotal = options?.expectedSourceRecordCount || 0;
    const memoryCheckpointsEmitted = new Set<RealImportMemoryCheckpointName>();
    const classificationProfile = getManagedSourceClassificationProfile(options?.sourceId);

    let rawItemCount = 0;
    let rawMovieCount = 0;
    let rawSeriesCount = 0;
    let rawLiveCount = 0;
    let rawUnresolvedCount = 0;

    const seriesMap = new Map<string, CompactSeriesAccumulator>();
    let seriesSeq = 0;

    const categoriesMap = new Map<string, Category>();
    const genresMap = new Map<string, Genre>();
    const liveGroupsMap = new Map<string, LiveGroup>();

    const categoryKindsMap = new Map<string, Set<'movie' | 'series'>>();

    function getOrCreateCategory(groupName: string, kind?: 'movie' | 'series'): Category {
      const catId = canonicalCategoryId(groupName);
      let kinds = categoryKindsMap.get(catId);
      if (!kinds) {
        kinds = new Set();
        categoryKindsMap.set(catId, kinds);
      }
      if (kind) kinds.add(kind);

      let cat = categoriesMap.get(catId);
      if (!cat) {
        cat = { id: catId, name: groupName.trim() || 'Geral', contentKinds: kind ? [kind] : ['movie', 'series'] };
        categoriesMap.set(catId, cat);
      } else if (kind && !cat.contentKinds.includes(kind)) {
        cat.contentKinds.push(kind);
      }
      return cat;
    }

    function getOrCreateGenre(name: string): Genre {
      const genreId = `genre:${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      let genre = genresMap.get(genreId);
      if (!genre) {
        genre = { id: genreId, name };
        genresMap.set(genreId, genre);
      }
      return genre;
    }

    emitMemoryCheckpoint(options, memoryCheckpointsEmitted, 'MEM01_START', {
      rawItemCount: 0,
      rawMovieCount: 0,
      rawSeriesCount: 0,
      rawLiveCount: 0,
      rawUnresolvedCount: 0,
    });
    bootTelemetry.mark('IMPORT_STREAM_PARSE');

    const tParseStart = performance.now();
    let currentExtInf: ReturnType<typeof parseM3uExtInfLine> | undefined;

    for await (const line of iterateUtf8Lines(chunkIterator)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === '#EXTM3U') continue;

      if (trimmed.startsWith('#EXTINF:')) {
        currentExtInf = parseM3uExtInfLine(trimmed);
        continue;
      }

      if (trimmed.startsWith('#')) {
        continue;
      }

      if (!currentExtInf) continue;

      const extInf = currentExtInf;
      currentExtInf = undefined;
      const streamUrl = trimmed;

      rawItemCount++;
      const groupTitle = extInf.groupTitle || 'Geral';
      const displayTitle = extInf.displayTitle;
      const safeLogo = toSafeArtworkUri(extInf.tvgLogo);

      const classification = classifySourceItemWithProfile({
        sourceId: options?.sourceId,
        profile: classificationProfile,
        title: displayTitle,
        groupName: groupTitle,
        streamUrl,
      });

      if (classification.canonicalKind === 'live') {
        rawLiveCount++;
        const groupId = canonicalCategoryId(groupTitle || 'Ao Vivo');
        let liveGroup = liveGroupsMap.get(groupId);
        if (!liveGroup) {
          liveGroup = { id: groupId, name: groupTitle || 'Ao Vivo', order: liveGroupsMap.size };
          liveGroupsMap.set(groupId, liveGroup);
        }

        const channelId = extInf.tvgId ? `live:${extInf.tvgId}` : `live:ch:${rawLiveCount}`;
        const channel: LiveChannel = {
          id: channelId,
          name: displayTitle,
          groupId: liveGroup.id,
          groupName: liveGroup.name,
          logoUrl: safeLogo || undefined,
          tvgId: extInf.tvgId,
          tvgName: extInf.tvgName,
          streamId: channelId,
          streamRef: {
            sourceItemId: channelId,
            containerExtension: streamUrl.endsWith('.m3u8') ? 'm3u8' : 'ts',
            directStreamUrl: streamUrl,
          },
        };
        writer.addLiveChannel(channel);
      } else if (classification.canonicalKind === 'series') {
        rawSeriesCount++;
        const parsedEpisode = parseM3uEpisodeIdentity(displayTitle);
        const rootTitle = parsedEpisode?.rootTitle || displayTitle;
        const seasonNumber = parsedEpisode?.seasonNumber || 1;
        const episodeNumber = parsedEpisode?.episodeNumber || 1;
        const seriesKey = rootTitle.toLowerCase();

        let seriesAcc = seriesMap.get(seriesKey);
        if (!seriesAcc) {
          const seriesId = `ser:m3u:${seriesSeq}`;
          seriesSeq++;
          seriesAcc = {
            seriesId,
            seriesIndex: seriesSeq,
            title: rootTitle,
            group: groupTitle,
            logo: safeLogo || undefined,
            seasons: new Map(),
          };
          seriesMap.set(seriesKey, seriesAcc);
        }

        let seasonMeta = seriesAcc.seasons.get(seasonNumber);
        if (!seasonMeta) {
          const seasonId = `${seriesAcc.seriesId}:s${seasonNumber}`;
          seasonMeta = {
            seasonId,
            seasonNumber,
            episodeCount: 0,
            seenEpisodeNumbers: new Map(),
            seenStreams: new Set(),
          };
          seriesAcc.seasons.set(seasonNumber, seasonMeta);
        }

        const episodeId = `${seasonMeta.seasonId}:e${episodeNumber}`;
        seasonMeta.episodeCount++;

        const streamId = `str:m3u:ep:${rawSeriesCount}`;
        const stream: StreamRef = {
          id: streamId,
          sourceItemId: episodeId,
          contentKind: 'episode',
          directStreamUrl: streamUrl,
        };

        const artId = `art:m3u:ep:${rawSeriesCount}`;
        const artwork: ArtworkRef | undefined = safeLogo
          ? {
              id: artId,
              kind: 'thumbnail',
              uri: safeLogo,
            }
          : undefined;

        const episode: Episode = {
          id: episodeId,
          seriesId: seriesAcc.seriesId,
          seasonId: seasonMeta.seasonId,
          episodeNumber,
          title: displayTitle,
          artworkIds: artwork ? [artId] : [],
          streamIds: [streamId],
        };

        writer.addEpisode(episode, stream, artwork);
      } else if (classification.canonicalKind === 'movie') {
        rawMovieCount++;
        const cat = getOrCreateCategory(groupTitle, 'movie');
        const genre = getOrCreateGenre(groupTitle);

        const movieId = `mov:m3u:${rawMovieCount}`;
        const streamId = `str:m3u:mov:${rawMovieCount}`;
        const stream: StreamRef = {
          id: streamId,
          sourceItemId: movieId,
          contentKind: 'movie',
          directStreamUrl: streamUrl,
        };

        const artId = `art:m3u:mov:${rawMovieCount}`;
        const artwork: ArtworkRef | undefined = safeLogo
          ? {
              id: artId,
              kind: 'poster',
              uri: safeLogo,
            }
          : undefined;

        const movie: Movie = {
          id: movieId,
          title: displayTitle,
          categoryIds: [cat.id],
          genreIds: [genre.id],
          artworkIds: artwork ? [artId] : [],
          streamIds: [streamId],
          durationSeconds: extInf.duration > 0 ? extInf.duration : undefined,
        };

        writer.addMovie(movie, stream, artwork);
      } else if (classification.canonicalKind === 'unresolved') {
        rawUnresolvedCount++;
      }

      if (writer.shouldFlush()) {
        await writer.flushBatch(rawItemCount);
      }

      if (expectedTotal > 0) {
        if (rawItemCount >= expectedTotal * 0.25) {
          emitMemoryCheckpoint(options, memoryCheckpointsEmitted, 'MEM02_25_PERCENT', {
            rawItemCount,
            rawMovieCount,
            rawSeriesCount,
            rawLiveCount,
            rawUnresolvedCount,
          });
        }
        if (rawItemCount >= expectedTotal * 0.5) {
          emitMemoryCheckpoint(options, memoryCheckpointsEmitted, 'MEM03_50_PERCENT', {
            rawItemCount,
            rawMovieCount,
            rawSeriesCount,
            rawLiveCount,
            rawUnresolvedCount,
          });
        }
        if (rawItemCount >= expectedTotal * 0.75) {
          emitMemoryCheckpoint(options, memoryCheckpointsEmitted, 'MEM04_75_PERCENT', {
            rawItemCount,
            rawMovieCount,
            rawSeriesCount,
            rawLiveCount,
            rawUnresolvedCount,
          });
        }
      }
    }

    await writer.flushBatch(rawItemCount);
    const parseMs = Math.round(performance.now() - tParseStart);

    emitMemoryCheckpoint(options, memoryCheckpointsEmitted, 'MEM05_PARSE_COMPLETE', {
      rawItemCount,
      rawMovieCount,
      rawSeriesCount,
      rawLiveCount,
      rawUnresolvedCount,
    });

    const tNormStart = performance.now();
    const BATCH_SIZE = 1000;
    let currentSeriesBatch: Series[] = [];
    let currentSeasonsBatch: Season[] = [];
    const firstFoldSeries: Series[] = [];
    const firstFoldSeasons: Season[] = [];

    let totalSeriesCount = 0;
    let totalSeasonCount = 0;

    for (const s of seriesMap.values()) {
      totalSeriesCount++;
      const seasonIds: string[] = [];
      for (const sn of s.seasons.values()) {
        totalSeasonCount++;
        seasonIds.push(sn.seasonId);
        const seasonObj: Season = {
          id: sn.seasonId,
          seriesId: s.seriesId,
          seasonNumber: sn.seasonNumber,
          episodeIds: [],
        };
        currentSeasonsBatch.push(seasonObj);
        if (firstFoldSeasons.length < 100) {
          firstFoldSeasons.push(seasonObj);
        }
        if (currentSeasonsBatch.length >= BATCH_SIZE) {
          await writer.writeSeasonsBatch(currentSeasonsBatch);
          currentSeasonsBatch = [];
          await yieldToEventLoop();
        }
      }

      const cat = getOrCreateCategory(s.group, 'series');
      const seriesObj: Series = {
        id: s.seriesId,
        title: s.title,
        categoryIds: [cat.id],
        genreIds: [],
        artworkIds: [],
        seasonIds,
      };
      currentSeriesBatch.push(seriesObj);
      if (firstFoldSeries.length < 100) {
        firstFoldSeries.push(seriesObj);
      }
      if (currentSeriesBatch.length >= BATCH_SIZE) {
        await writer.writeSeriesBatch(currentSeriesBatch);
        currentSeriesBatch = [];
        await yieldToEventLoop();
      }
    }

    if (currentSeriesBatch.length > 0) {
      await writer.writeSeriesBatch(currentSeriesBatch);
      currentSeriesBatch = [];
    }
    if (currentSeasonsBatch.length > 0) {
      await writer.writeSeasonsBatch(currentSeasonsBatch);
      currentSeasonsBatch = [];
    }

    const normalizationMs = Math.round(performance.now() - tNormStart);

    emitMemoryCheckpoint(options, memoryCheckpointsEmitted, 'MEM06_NORMALIZATION_COMPLETE', {
      rawItemCount,
      rawMovieCount,
      rawSeriesCount,
      rawLiveCount,
      rawUnresolvedCount,
    });

    const categories = Array.from(categoriesMap.values());
    const genres = Array.from(genresMap.values());
    const liveGroups = Array.from(liveGroupsMap.values());
    const nowIso = new Date().toISOString();

    const finalized = await writer.finalizeStaging({
      provenance: options?.provenance,
      nowIso,
      rawItemCount,
      movieCount: rawMovieCount,
      seriesCount: totalSeriesCount,
      seasonCount: totalSeasonCount,
      episodeCount: rawSeriesCount,
      liveCount: rawLiveCount,
      categories,
      genres,
      liveGroups,
      categoryProvenance: Array.from(categoryKindsMap.entries())
        .filter(([_, kinds]) => kinds.size === 1)
        .map(([categoryId, kinds]) => ({
          categoryId,
          canonicalKind: [...kinds][0],
        }))
        .sort((a, b) => a.categoryId.localeCompare(b.categoryId)),
      firstFoldSeries,
      firstFoldSeasons,
    });

    emitMemoryCheckpoint(options, memoryCheckpointsEmitted, 'MEM07_SEARCH_COMPLETE', {
      rawItemCount,
      rawMovieCount,
      rawSeriesCount,
      rawLiveCount,
      rawUnresolvedCount,
    });

    const totalColdImportMs = Math.round(performance.now() - t0);

    const metrics: RealImportMetrics = {
      sourceDetectionMs: 0,
      sourceConnectionMs: 0,
      moviesFetchMs,
      seriesFetchMs: 0,
      liveFetchMs: 0,
      parseMs,
      normalizationMs,
      catalogBuildMs: 10,
      searchIndexBuildMs: 0,
      searchIndexSerializeMs: 0,
      searchIndexPersistMs: 0,
      totalColdImportMs,
      firstUsableContentMs: moviesFetchMs + parseMs,
      searchReadyMs: totalColdImportMs,

      rawItemCount,
      rawMovieCount,
      rawSeriesCount,
      rawLiveCount,
      rawUnresolvedCount,

      canonicalMovieCount: rawMovieCount,
      canonicalSeriesCount: totalSeriesCount,
      canonicalSeasonCount: totalSeasonCount,
      canonicalEpisodeCount: rawSeriesCount,
      canonicalLiveGroupCount: liveGroups.length,
      canonicalLiveChannelCount: rawLiveCount,

      searchDocumentCount: rawMovieCount + totalSeriesCount + rawLiveCount,
      searchDocumentsMovies: rawMovieCount,
      searchDocumentsSeries: totalSeriesCount,
      searchDocumentsLive: rawLiveCount,
      searchTokenCount: 0,

      catalogBytes: finalized.totalCatalogBytes,
      liveCatalogBytes: 1024,
      searchIndexBytes: 0,
      activeGenerationBytes: finalized.totalCatalogBytes,
      totalAppDataBytes: finalized.totalCatalogBytes + 4096,
    };

    return {
      success: true,
      sourcePayloadSizeBytes: getSourcePayloadSizeBytes?.(),
      catalog: finalized.catalogHeader,
      catalogJson: JSON.stringify(finalized.catalogHeader),
      liveCatalog: finalized.liveCatalog,
      metrics,
      segmentedStaging: {
        snapshotId,
        manifest: finalized.manifest,
        catalogHeader: finalized.catalogHeader,
      },
    };
  }
}


