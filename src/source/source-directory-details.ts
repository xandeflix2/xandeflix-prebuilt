import type { Episode, Season, StreamRef } from '../contracts/catalog.ts';
import type { SourceRuntimeConfig } from '../debug/source/source-runtime-config.ts';
import type { LocalCatalogStorage } from '../bootstrap/storage/storage.interface.ts';
import type { CatalogSeriesDetails } from '../catalog/catalog-read-model.ts';
import { CanonicalItemResolver } from '../catalog/canonical-item-resolver.ts';
import { AuthorizedSourceResolver, type ResolvedSourceResult } from '../control-plane/client/authorized-source-resolver.ts';
import { LocalSecureSourceStore, type LocalSecureSourceRecord } from '../security/local-secure-source-store.ts';
import { normalizeArtworkUri } from '../artwork/artwork-uri.ts';
import { DIRECTORY_ROOTS_MODE, buildDirectoryStreamUrl, deriveDirectoryRuntimeConfig, fetchDirectoryJson } from './source-directory-api.ts';

export const DIRECTORY_DETAILS_MAX_SERIES = 4;
export const DIRECTORY_DETAILS_MAX_EPISODES = 5000;
const MAX_SEASONS = 256;
const MAX_CACHE_BYTES = 8 * 1024 * 1024;
const CACHE_TTL_MS = 10 * 60 * 1000;

interface DirectoryDetailsOptions {
  resolveAuthorization?: () => Promise<ResolvedSourceResult>;
  secureSourceStore?: Pick<LocalSecureSourceStore, 'get'>;
  fetchImpl?: typeof fetch;
}

interface DirectoryBinding { sourceId: string; sourceVersion: number; protocol: 'M3U' | 'XTREAM'; }
interface CacheEntry { details: CatalogSeriesDetails; byteSize: number; expiresAt: number; }

function invalid(): never { throw new Error('DIRECTORY_SERIES_DETAILS_INVALID'); }
function object(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}
function integer(value: unknown, min = 0): number {
  if (typeof value !== 'number' && typeof value !== 'string') invalid();
  if (typeof value === 'string' && !/^\d+$/.test(value)) invalid();
  const result = Number(value);
  if (!Number.isSafeInteger(result) || result < min) invalid();
  return result;
}
function providerId(value: unknown): string {
  if (typeof value === 'string' && /^[1-9]\d{0,18}$/.test(value)) return value;
  if (typeof value === 'number' && Number.isSafeInteger(value) && value > 0) return String(value);
  return invalid();
}

/** Selected-series cache lives only in the device process, outside immutable snapshots. */
export class SourceDirectoryDetailsResolver {
  private readonly storage: LocalCatalogStorage;
  private readonly snapshotId: string;
  private readonly options: DirectoryDetailsOptions;
  private readonly secureStore: Pick<LocalSecureSourceStore, 'get'>;
  private readonly items: CanonicalItemResolver;
  private readonly cache = new Map<string, CacheEntry>();
  private readonly pending = new Map<string, Promise<CatalogSeriesDetails>>();
  private binding?: DirectoryBinding;

  constructor(storage: LocalCatalogStorage, snapshotId: string, options: DirectoryDetailsOptions = {}) {
    this.storage = storage;
    this.snapshotId = snapshotId;
    this.options = options;
    this.secureStore = options.secureSourceStore || new LocalSecureSourceStore();
    this.items = new CanonicalItemResolver(storage, snapshotId);
  }

  private async source(): Promise<{ config: SourceRuntimeConfig; headers?: Record<string, string> }> {
    try {
      const [pointer, manifest, catalog] = await Promise.all([
        this.storage.readActivePointer(), this.storage.readActiveManifest(), this.storage.readActiveCatalog(),
      ]);
      const metadata = object(manifest?.metadata);
      if (!pointer || pointer.snapshotId !== this.snapshotId || manifest?.snapshotId !== this.snapshotId ||
          catalog?.metadata.snapshotId !== this.snapshotId || catalog.extensions?.sourceInventoryMode !== DIRECTORY_ROOTS_MODE ||
          pointer.kind !== 'REAL' || metadata?.kind !== 'REAL' || !pointer.sourceId ||
          !Number.isSafeInteger(pointer.sourceVersion) || metadata.sourceId !== pointer.sourceId || metadata.sourceVersion !== pointer.sourceVersion) {
        throw new Error('DIRECTORY_GENERATION_CHANGED');
      }
      const authority = await (this.options.resolveAuthorization?.() || AuthorizedSourceResolver.resolve());
      if (authority.remoteAuthorityAvailable !== true ||
          !(authority.status === 'SOURCE_READY' || authority.remoteResultCode === 'SOURCE_READY') ||
          authority.sourceStatus !== 'ACTIVE' || authority.sourceId !== pointer.sourceId ||
          authority.sourceVersion !== pointer.sourceVersion || (authority.protocol !== 'M3U' && authority.protocol !== 'XTREAM')) {
        throw new Error('DIRECTORY_SOURCE_NOT_AUTHORIZED');
      }
      const record = await this.secureStore.get(pointer.sourceId);
      if (!record || record.sourceId !== pointer.sourceId || record.sourceVersion !== pointer.sourceVersion || record.protocol !== authority.protocol) {
        throw new Error('DIRECTORY_SOURCE_CONFIGURATION_MISMATCH');
      }
      const binding: DirectoryBinding = { sourceId: record.sourceId, sourceVersion: record.sourceVersion, protocol: record.protocol };
      if (this.binding && (this.binding.sourceId !== binding.sourceId || this.binding.sourceVersion !== binding.sourceVersion || this.binding.protocol !== binding.protocol)) {
        throw new Error('DIRECTORY_GENERATION_CHANGED');
      }
      this.binding = binding;
      const runtime = runtimeConfig(record);
      const config = deriveDirectoryRuntimeConfig(runtime);
      if (!config) throw new Error('DIRECTORY_SOURCE_UNSUPPORTED');
      const stillActive = await this.storage.readActivePointer();
      if (stillActive?.snapshotId !== this.snapshotId || stillActive.sourceId !== binding.sourceId || stillActive.sourceVersion !== binding.sourceVersion) {
        throw new Error('DIRECTORY_GENERATION_CHANGED');
      }
      const token = record.sourceConfig.token?.trim();
      return { config, ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}) };
    } catch (error) {
      this.cache.clear();
      const code = error instanceof Error && /^DIRECTORY_[A-Z_]+$/.test(error.message) ? error.message : 'DIRECTORY_AUTHORIZATION_UNAVAILABLE';
      throw new Error(code);
    }
  }

  async assertCurrentGeneration(): Promise<void> { await this.source(); }

  async resolveSeriesDetails(seriesId: string): Promise<CatalogSeriesDetails> {
    const match = /^series:([1-9]\d*)$/.exec(seriesId);
    if (!match) throw new Error('DIRECTORY_SERIES_ID_INVALID');
    await this.source();
    const cached = this.cache.get(seriesId);
    if (cached && cached.expiresAt > Date.now()) {
      this.cache.delete(seriesId); this.cache.set(seriesId, cached);
      return cached.details;
    }
    if (cached) this.cache.delete(seriesId);
    let request = this.pending.get(seriesId);
    if (!request) {
      if (this.pending.size >= DIRECTORY_DETAILS_MAX_SERIES) throw new Error('DIRECTORY_DETAILS_BUSY');
      request = this.load(seriesId, match[1]);
      this.pending.set(seriesId, request);
      void request.finally(() => { if (this.pending.get(seriesId) === request) this.pending.delete(seriesId); }).catch(() => {});
    }
    const details = await request;
    await this.source();
    return details;
  }

  async resolveStreamRef(streamId: string): Promise<StreamRef | undefined> {
    const match = /^str:episode:([1-9]\d*):([1-9]\d*)$/.exec(streamId);
    if (!match) return undefined;
    const details = await this.resolveSeriesDetails(`series:${match[1]}`);
    return details.streams.find(stream => stream.id === streamId);
  }

  private async load(seriesId: string, providerSeriesId: string): Promise<CatalogSeriesDetails> {
    const source = await this.source();
    const root = await this.items.resolveSeriesById(seriesId);
    if (!root || root.externalIds?.sourceItemId !== providerSeriesId) throw new Error('DIRECTORY_SERIES_NOT_FOUND');
    await this.source();
    const response = await fetchDirectoryJson(source.config, 'get_series_info', { series_id: providerSeriesId }, {
      headers: source.headers, fetchImpl: this.options.fetchImpl,
    });
    const details = normalizeDetails(response, seriesId, providerSeriesId, source.config);
    await this.source();
    const byteSize = new TextEncoder().encode(JSON.stringify(details)).byteLength;
    if (byteSize > MAX_CACHE_BYTES) throw new Error('DIRECTORY_DETAILS_LIMIT_EXCEEDED');
    this.cache.set(seriesId, { details, byteSize, expiresAt: Date.now() + CACHE_TTL_MS });
    while (this.cache.size > DIRECTORY_DETAILS_MAX_SERIES || [...this.cache.values()].reduce((n, entry) => n + entry.byteSize, 0) > MAX_CACHE_BYTES) {
      this.cache.delete(this.cache.keys().next().value!);
    }
    return details;
  }
}

function runtimeConfig(record: LocalSecureSourceRecord): SourceRuntimeConfig {
  return record.protocol === 'M3U'
    ? { type: 'M3U', playlistUrl: record.sourceConfig.playlistUrl }
    : { type: 'XTREAM', host: record.sourceConfig.endpoint, username: record.sourceConfig.username, password: record.sourceConfig.password };
}

function normalizeDetails(value: unknown, seriesId: string, providerSeriesId: string, config: SourceRuntimeConfig): CatalogSeriesDetails {
  const payload = object(value), episodeGroups = object(payload?.episodes);
  if (!payload || !episodeGroups || !Array.isArray(payload.seasons)) invalid();
  const info = object(payload.info);
  if (info?.series_id !== undefined && providerId(info.series_id) !== providerSeriesId) invalid();
  const seasonMetadata = new Map<number, Record<string, unknown>>();
  for (const entry of payload.seasons) {
    const season = object(entry);
    if (!season) invalid();
    const number = integer(season.season_number);
    if (seasonMetadata.has(number)) invalid();
    seasonMetadata.set(number, season);
  }
  const seasons: Season[] = [], episodes: Episode[] = [], streams: StreamRef[] = [];
  const episodeIds = new Set<string>();
  for (const [key, rows] of Object.entries(episodeGroups)) {
    const seasonNumber = integer(key);
    if (!Array.isArray(rows)) invalid();
    const seasonId = `${seriesId}:s${seasonNumber}`;
    const seasonEpisodes: string[] = [];
    for (const entry of rows) {
      const episode = object(entry);
      if (!episode) invalid();
      const id = providerId(episode.id);
      const episodeNumber = integer(episode.episode_num, 1);
      if (episode.season !== undefined && integer(episode.season) !== seasonNumber) invalid();
      if (episodeIds.has(id)) invalid();
      episodeIds.add(id);
      if (episodeIds.size > DIRECTORY_DETAILS_MAX_EPISODES) throw new Error('DIRECTORY_DETAILS_LIMIT_EXCEEDED');
      const extension = typeof episode.container_extension === 'string' ? episode.container_extension.replace(/^\./, '') : 'mp4';
      const episodeId = `episode:${providerSeriesId}:${id}`;
      const streamId = `str:episode:${providerSeriesId}:${id}`;
      const episodeInfo = object(episode.info);
      const artwork = normalizeArtworkUri(episodeInfo?.movie_image || episodeInfo?.cover_big || episodeInfo?.cover);
      const duration = Number(episodeInfo?.duration_secs);
      episodes.push({
        id: episodeId, seriesId, seasonId, episodeNumber,
        title: typeof episode.title === 'string' && episode.title.trim() ? episode.title.trim() : `Episódio ${episodeNumber}`,
        ...(typeof episodeInfo?.plot === 'string' ? { overview: episodeInfo.plot } : {}),
        ...(Number.isFinite(duration) && duration > 0 ? { durationSeconds: duration } : {}),
        artworkIds: [], streamIds: [streamId], externalIds: { sourceItemId: id },
        ...(artwork ? { thumbnailUri: artwork, thumbnailUrl: artwork, posterUri: artwork, posterUrl: artwork } : {}),
      });
      streams.push({ id: streamId, sourceItemId: id, contentKind: 'episode', containerExtension: extension,
        directStreamUrl: buildDirectoryStreamUrl(config, 'series', id, extension) });
      seasonEpisodes.push(episodeId);
    }
    const metadata = seasonMetadata.get(seasonNumber);
    seasons.push({ id: seasonId, seriesId, seasonNumber, episodeIds: seasonEpisodes,
      ...(typeof metadata?.name === 'string' ? { title: metadata.name } : {}) });
  }
  for (const [seasonNumber, metadata] of seasonMetadata) {
    if (!seasons.some(season => season.seasonNumber === seasonNumber)) {
      if (Number(metadata.episode_count) > 0) invalid();
      seasons.push({ id: `${seriesId}:s${seasonNumber}`, seriesId, seasonNumber, episodeIds: [],
        ...(typeof metadata.name === 'string' ? { title: metadata.name } : {}) });
    }
  }
  if (seasons.length > MAX_SEASONS) throw new Error('DIRECTORY_DETAILS_LIMIT_EXCEEDED');
  seasons.sort((a, b) => a.seasonNumber - b.seasonNumber);
  episodes.sort((a, b) => integer(a.seasonId.split(':s').at(-1)) - integer(b.seasonId.split(':s').at(-1)) || a.episodeNumber - b.episodeNumber);
  return { seasons, episodes, streams };
}
