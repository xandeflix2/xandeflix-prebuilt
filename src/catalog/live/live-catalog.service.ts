/**
 * Serviço local do catálogo Live.
 *
 * A autoridade de um catálogo segmentado é sempre o snapshot apontado por
 * prebuilt/active.json. O arquivo root-scoped legado não é consultado.
 */

import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import type { LiveCatalog, LiveGroup, LiveChannel } from './live-tv.types.ts';
import { resolveSegmentRelativePath } from '../../bootstrap/storage/segment-path-resolver.ts';

const PREBUILT_DIR = 'prebuilt';
const ACTIVE_POINTER_FILE = `${PREBUILT_DIR}/active.json`;
const SNAPSHOTS_DIR = `${PREBUILT_DIR}/snapshots`;

interface ActivePointerRecord {
  snapshotId: string;
}

interface ActiveManifestRecord {
  segments?: Array<{ fileName?: string; kind?: string }>;
}

export interface LiveCatalogBuildOptions {
  totalChannels?: number;
  segmentFiles?: string[];
}

export type LiveSegmentRead = (fileName: string) => Promise<string | null>;

export interface LiveChannelPage {
  readonly channels: LiveChannel[];
  readonly offset: number;
  readonly totalAvailable: number;
  readonly nextOffset: number | null;
}

/** A origem do total global é o manifesto; os grupos são fallback para snapshots legados. */
export function resolveCanonicalLiveTotal(
  catalog: Pick<LiveCatalog, 'totalChannels'>,
  canonicalGroupCounts?: Record<string, number> | null,
): number {
  if (typeof catalog.totalChannels === 'number' && Number.isInteger(catalog.totalChannels) && catalog.totalChannels >= 0) {
    return catalog.totalChannels;
  }
  return Object.values(canonicalGroupCounts || {}).reduce((sum, count) => sum + (Number.isInteger(count) && count > 0 ? count : 0), 0);
}

/**
 * Extrai uma página de um grupo sem materializar o grupo inteiro. A identidade
 * canônica do canal é `id`; títulos nunca participam da deduplicação.
 */
export async function readLiveChannelPageForGroupFromSegments(
  catalog: LiveCatalog,
  groupId: string,
  segmentFiles: string[],
  readSegment: LiveSegmentRead,
  offset = 0,
  pageSize = 48,
): Promise<LiveChannelPage> {
  const safeOffset = Math.max(0, Math.floor(offset));
  const safePageSize = Math.max(1, Math.floor(pageSize));
  const channels: LiveChannel[] = [];
  const seenIds = new Set<string>();
  let totalAvailable = 0;

  for (const fileName of segmentFiles) {
    const json = await readSegment(fileName);
    if (!json) continue;
    let records: unknown;
    try {
      records = JSON.parse(json);
    } catch {
      continue;
    }
    if (!Array.isArray(records)) continue;
    for (const value of records) {
      if (!value || typeof value !== 'object') continue;
      const channel = value as LiveChannel;
      if (channel.groupId !== groupId || typeof channel.id !== 'string' || !channel.id || seenIds.has(channel.id)) continue;
      seenIds.add(channel.id);
      if (totalAvailable >= safeOffset && channels.length < safePageSize) channels.push(channel);
      totalAvailable += 1;
    }
    await Promise.resolve();
  }

  // Snapshots antigos podem conter somente o first-fold em `channelsByGroup`.
  for (const channel of catalog.channelsByGroup[groupId] || []) {
    if (typeof channel.id !== 'string' || !channel.id || seenIds.has(channel.id)) continue;
    seenIds.add(channel.id);
    if (totalAvailable >= safeOffset && channels.length < safePageSize) channels.push(channel);
    totalAvailable += 1;
  }

  const consumed = safeOffset + channels.length;
  return { channels, offset: safeOffset, totalAvailable, nextOffset: consumed < totalAvailable ? consumed : null };
}

/** Calcula totais por grupo sem reter os canais dos segmentos. */
export async function countLiveChannelsByGroupFromSegments(
  catalog: LiveCatalog,
  segmentFiles: string[],
  readSegment: LiveSegmentRead,
): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  const seenByGroup: Record<string, Set<string>> = {};
  for (const group of catalog.groups || []) {
    counts[group.id] = 0;
    seenByGroup[group.id] = new Set<string>();
  }
  for (const fileName of segmentFiles) {
    const json = await readSegment(fileName);
    if (json) {
      try {
        const records: unknown = JSON.parse(json);
        if (Array.isArray(records)) {
          for (const value of records) {
            if (!value || typeof value !== 'object') continue;
            const groupId = (value as LiveChannel).groupId;
            const id = (value as LiveChannel).id;
            if (typeof groupId === 'string' && typeof id === 'string' && id && Object.hasOwn(counts, groupId) && !seenByGroup[groupId].has(id)) {
              seenByGroup[groupId].add(id);
              counts[groupId] += 1;
            }
          }
        }
      } catch {
        // Segmento inválido não recebe um total fabricado.
      }
    }
    await Promise.resolve();
  }
  return counts;
}

/** Leitor puro de segmentos usado pelo runtime e pelos fixtures bounded. */
export async function readLiveChannelsForGroupFromSegments(
  catalog: LiveCatalog,
  groupId: string,
  segmentFiles: string[],
  readSegment: LiveSegmentRead,
): Promise<LiveChannel[]> {
  if (!groupId) return [];
  const channels: LiveChannel[] = [];
  const seen = new Set<string>();
  for (const fileName of segmentFiles) {
    const json = await readSegment(fileName);
    if (!json) continue;
    let records: unknown;
    try {
      records = JSON.parse(json);
    } catch {
      continue;
    }
    if (!Array.isArray(records)) continue;
    for (const value of records) {
      if (!value || typeof value !== 'object') continue;
      const channel = value as LiveChannel;
      if (channel.groupId !== groupId || typeof channel.id !== 'string' || seen.has(channel.id)) continue;
      seen.add(channel.id);
      channels.push(channel);
    }
  }
  for (const channel of catalog.channelsByGroup[groupId] || []) {
    if (!seen.has(channel.id)) {
      seen.add(channel.id);
      channels.push(channel);
    }
  }
  return channels;
}

export class LiveCatalogService {
  private static cachedCatalog: LiveCatalog | null = null;
  private static canonicalGroupCountsBySnapshot = new Map<string, Record<string, number>>();

  /** Persiste somente no snapshot já promovido; nunca cria arquivo root-scoped. */
  static async saveLiveCatalog(catalog: LiveCatalog): Promise<void> {
    this.cachedCatalog = catalog;
    try {
      await Filesystem.writeFile({
        path: `${SNAPSHOTS_DIR}/${catalog.snapshotId}/live_catalog.json`,
        directory: Directory.Data,
        data: JSON.stringify(catalog),
        encoding: Encoding.UTF8,
      });
    } catch {
      // A promoção canônica já grava o arquivo; falha aqui não muda a autoridade.
    }
  }

  /** Carrega o first-fold Live do snapshot atualmente ativo. */
  static async loadLiveCatalog(): Promise<LiveCatalog | null> {
    const pointer = await this.readActivePointer();
    if (!pointer?.snapshotId) return null;
    if (this.cachedCatalog?.snapshotId === pointer.snapshotId) return this.cachedCatalog;

    try {
      const file = await Filesystem.readFile({
        path: `${SNAPSHOTS_DIR}/${pointer.snapshotId}/live_catalog.json`,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });
      if (typeof file.data !== 'string' || !file.data) return null;
      const parsed = this.ensureChannelsByGroup(JSON.parse(file.data) as LiveCatalog);
      this.cachedCatalog = parsed;
      return parsed;
    } catch {
      return null;
    }
  }

  /**
   * Lê os segmentos Live um a um e devolve somente o grupo solicitado.
   * O JSON de cada segmento é descartado antes da leitura seguinte.
   */
  static async loadChannelsForGroup(groupId: string): Promise<LiveChannel[]> {
    if (!groupId) return [];
    const pointer = await this.readActivePointer();
    if (!pointer?.snapshotId) return [];
    const catalog = await this.loadLiveCatalog();
    if (!catalog || catalog.snapshotId !== pointer.snapshotId) return [];

    const segmentFiles = await this.resolveLiveSegmentFiles(pointer.snapshotId, catalog);
    return readLiveChannelsForGroupFromSegments(
      catalog,
      groupId,
      segmentFiles,
      (fileName) => this.readActiveSegment(pointer.snapshotId, fileName),
    );
  }

  /** Lê uma página do grupo selecionado; nenhum outro grupo é hidratado. */
  static async loadChannelPageForGroup(groupId: string, offset = 0, pageSize = 48): Promise<LiveChannelPage> {
    if (!groupId) return { channels: [], offset: 0, totalAvailable: 0, nextOffset: null };
    const pointer = await this.readActivePointer();
    if (!pointer?.snapshotId) return { channels: [], offset: 0, totalAvailable: 0, nextOffset: null };
    const catalog = await this.loadLiveCatalog();
    if (!catalog || catalog.snapshotId !== pointer.snapshotId) return { channels: [], offset: 0, totalAvailable: 0, nextOffset: null };
    const segmentFiles = await this.resolveLiveSegmentFiles(pointer.snapshotId, catalog);
    return readLiveChannelPageForGroupFromSegments(
      catalog,
      groupId,
      segmentFiles,
      (fileName) => this.readActiveSegment(pointer.snapshotId, fileName),
      offset,
      pageSize,
    );
  }

  /**
   * Recupera os totais canônicos dos grupos para snapshots legados que só
   * persistiram o first-fold. Lê um segmento por vez e mantém apenas números
   * em cache de memória; nenhum canal é materializado no boot.
   */
  static async loadCanonicalGroupCounts(): Promise<Record<string, number>> {
    const pointer = await this.readActivePointer();
    if (!pointer?.snapshotId) return {};
    const cached = this.canonicalGroupCountsBySnapshot.get(pointer.snapshotId);
    if (cached) return { ...cached };
    const catalog = await this.loadLiveCatalog();
    if (!catalog || catalog.snapshotId !== pointer.snapshotId) return {};

    const segmentFiles = await this.resolveLiveSegmentFiles(pointer.snapshotId, catalog);
    const counts = await countLiveChannelsByGroupFromSegments(
      catalog,
      segmentFiles,
      (fileName) => this.readActiveSegment(pointer.snapshotId, fileName),
    );
    this.canonicalGroupCountsBySnapshot.set(pointer.snapshotId, counts);
    return { ...counts };
  }

  /** Mescla um grupo lazy sem hidratar os demais grupos. */
  static mergeChannelsForGroup(
    catalog: LiveCatalog,
    groupId: string,
    channels: LiveChannel[],
  ): LiveCatalog {
    const channelsByGroup = { ...catalog.channelsByGroup };
    const byGroup = new Map((channelsByGroup[groupId] || []).map((channel) => [channel.id, channel]));
    for (const channel of channels) byGroup.set(channel.id, channel);
    channelsByGroup[groupId] = Array.from(byGroup.values());

    const byId = new Map(catalog.channels.map((channel) => [channel.id, channel]));
    for (const channel of channelsByGroup[groupId]) byId.set(channel.id, channel);
    return {
      ...catalog,
      channels: Array.from(byId.values()),
      channelsByGroup,
    };
  }

  static clearLiveCatalog(): void {
    this.cachedCatalog = null;
    this.canonicalGroupCountsBySnapshot.clear();
  }

  static buildCatalog(
    snapshotId: string,
    groups: LiveGroup[],
    channels: LiveChannel[],
    options?: LiveCatalogBuildOptions,
  ): LiveCatalog {
    const channelsByGroup: Record<string, LiveChannel[]> = {};
    for (const group of groups) channelsByGroup[group.id] = [];
    for (const channel of channels) {
      if (!channelsByGroup[channel.groupId]) channelsByGroup[channel.groupId] = [];
      channelsByGroup[channel.groupId].push(channel);
    }
    return {
      snapshotId,
      generatedAt: new Date().toISOString(),
      groups,
      channels,
      channelsByGroup,
      totalChannels: options?.totalChannels ?? channels.length,
      segmentFiles: options?.segmentFiles ? [...options.segmentFiles] : undefined,
    };
  }

  private static async readActivePointer(): Promise<ActivePointerRecord | null> {
    try {
      const file = await Filesystem.readFile({
        path: ACTIVE_POINTER_FILE,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });
      return typeof file.data === 'string' ? JSON.parse(file.data) as ActivePointerRecord : null;
    } catch {
      return null;
    }
  }

  private static async resolveLiveSegmentFiles(snapshotId: string, catalog: LiveCatalog): Promise<string[]> {
    if (Array.isArray(catalog.segmentFiles) && catalog.segmentFiles.length > 0) {
      return catalog.segmentFiles;
    }
    try {
      const file = await Filesystem.readFile({
        path: `${SNAPSHOTS_DIR}/${snapshotId}/manifest.json`,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });
      const manifest = typeof file.data === 'string'
        ? JSON.parse(file.data) as ActiveManifestRecord
        : {};
      return (manifest.segments || [])
        .filter((segment) => segment.kind === 'live' && typeof segment.fileName === 'string')
        .map((segment) => segment.fileName as string);
    } catch {
      return [];
    }
  }

  private static async readActiveSegment(snapshotId: string, fileName: string): Promise<string | null> {
    try {
      const relative = resolveSegmentRelativePath(fileName);
      const file = await Filesystem.readFile({
        path: `${SNAPSHOTS_DIR}/${snapshotId}/${relative}`,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });
      return typeof file.data === 'string' ? file.data : null;
    } catch {
      return null;
    }
  }

  private static ensureChannelsByGroup(catalog: LiveCatalog): LiveCatalog {
    if (catalog.channelsByGroup && Object.keys(catalog.channelsByGroup).length > 0) return catalog;
    const channelsByGroup: Record<string, LiveChannel[]> = {};
    for (const group of catalog.groups || []) channelsByGroup[group.id] = [];
    for (const channel of catalog.channels || []) {
      if (!channelsByGroup[channel.groupId]) channelsByGroup[channel.groupId] = [];
      channelsByGroup[channel.groupId].push(channel);
    }
    return { ...catalog, channelsByGroup };
  }
}
