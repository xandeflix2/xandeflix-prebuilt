/**
 * Leitor paginado do catálogo segmentado. Mantém somente a página solicitada
 * em memória e usa as contagens do manifest como autoridade da interface.
 */
import type { Movie, Series } from '../contracts/catalog.ts';
import type { LocalCatalogStorage } from '../bootstrap/storage/storage.interface.ts';
import { resolveSegmentRelativePath } from '../bootstrap/storage/segment-path-resolver.ts';

export type BrowseKind = 'movies' | 'series';
export type BrowseOrder = 'source' | 'source-desc';
export interface BrowseCursor { segment: number; offset: number; }
export interface BrowsePage<T> { items: T[]; nextCursor: BrowseCursor | null; totalAvailable: number; totalIsExact?: boolean; }
type BrowseRecord = Movie | Series;

export class SegmentedBrowseService {
  private readonly storage: LocalCatalogStorage;
  private readonly snapshotId?: string;
  private readonly categoryCountCache = new Map<string, number>();
  private readonly railCache = new Map<string, BrowseRecord[]>();
  private readonly pageCache = new Map<string, BrowsePage<BrowseRecord>>();
  private readonly pageJobs = new Map<string, Promise<BrowsePage<BrowseRecord>>>();
  private readonly countJobs = new Map<BrowseKind, Promise<void>>();
  private readonly completedCounts = new Set<BrowseKind>();
  private readonly categoryStarts = new Map<string, BrowseCursor>();
  private readonly lifetime = new AbortController();
  private activeReads = 0;
  private readonly waitingReads: (() => void)[] = [];

  constructor(storage: LocalCatalogStorage, snapshotId?: string) {
    this.storage = storage;
    this.snapshotId = snapshotId;
  }
  dispose(): void { this.lifetime.abort(); }
  private check(signal?: AbortSignal): void {
    if (this.lifetime.signal.aborted || signal?.aborted) throw new Error('BROWSE_CANCELLED');
  }
  private key(kind: BrowseKind, categoryId?: string): string { return `${kind}:${categoryId || 'all'}`; }
  cachedPage<T extends BrowseRecord>(kind: BrowseKind, categoryId?: string, order: BrowseOrder = 'source'): BrowsePage<T> | undefined {
    const key = `${this.key(kind, categoryId)}:${order}`, value = this.pageCache.get(key);
    if (value) { this.pageCache.delete(key); this.pageCache.set(key, value); }
    return value as BrowsePage<T> | undefined;
  }
  private async manifest(signal?: AbortSignal) {
    this.check(signal);
    const manifest = await this.storage.readActiveManifest() as null | { snapshotId?: string; counts?: Partial<Record<BrowseKind, number>>; segments?: Array<{kind?: string; fileName?: string}> };
    this.check(signal);
    if (this.snapshotId && manifest?.snapshotId && this.snapshotId !== manifest.snapshotId) throw new Error('BROWSE_GENERATION_CHANGED');
    return manifest;
  }
  private async records<T extends BrowseRecord>(fileName: string, signal?: AbortSignal): Promise<T[]> {
    if (this.activeReads >= 2) await new Promise<void>(resolve => this.waitingReads.push(resolve));
    else this.activeReads++;
    try {
      this.check(signal);
      const raw = await this.storage.readActiveSegment?.(resolveSegmentRelativePath(fileName));
      this.check(signal);
      try { const rows: unknown = raw ? JSON.parse(raw) : []; return Array.isArray(rows) ? rows as T[] : []; }
      catch { return []; }
    } finally { const next = this.waitingReads.shift(); if (next) next(); else this.activeReads--; }
  }
  async countItems(kind: BrowseKind, categoryId?: string, signal?: AbortSignal): Promise<number> {
    const manifest = await this.manifest(signal);
    if (!categoryId) return Number(manifest?.counts?.[kind] || 0);
    if (!this.completedCounts.has(kind)) {
      let job = this.countJobs.get(kind);
      if (!job) {
        job = (async () => {
          const counts = new Map<string, number>(), starts = new Map<string, BrowseCursor>();
          const segments = (manifest?.segments || []).filter(s => s.kind === kind && s.fileName);
          for (let segmentIndex = 0; segmentIndex < segments.length; segmentIndex++) {
            const segment = segments[segmentIndex];
            this.check(); const rows = await this.records(segment.fileName!);
            for (let offset = 0; offset < rows.length; offset++) for (const id of new Set(rows[offset]?.categoryIds || [])) {
              counts.set(id, (counts.get(id) || 0) + 1);
              if (!starts.has(id)) starts.set(id, { segment: segmentIndex, offset });
            }
            await new Promise<void>(resolve => setTimeout(resolve, 0));
          }
          await this.manifest();
          for (const [id, count] of counts) this.categoryCountCache.set(this.key(kind, id), count);
          for (const [id, cursor] of starts) this.categoryStarts.set(this.key(kind, id), cursor);
          this.completedCounts.add(kind);
        })();
        this.countJobs.set(kind, job);
        void job.finally(() => { if (this.countJobs.get(kind) === job) this.countJobs.delete(kind); }).catch(() => {});
      }
      await job;
    }
    this.check(signal); return this.categoryCountCache.get(this.key(kind, categoryId)) || 0;
  }

  /**
   * Carrega os primeiros maxItems de uma categoria com parada rápida (early-exit).
   * Interrompe a leitura de segmentos assim que atinge a cota solicitada.
   */
  async loadRailItems<T extends BrowseRecord>(
    kind: BrowseKind,
    categoryId?: string,
    maxItems = 20, order: BrowseOrder = 'source'
  ): Promise<T[]> {
    if (kind === 'movies' && order === 'source-desc') return (await this.loadPage<T>(kind, undefined, maxItems, categoryId, { count: false, order })).items;
    const cacheKey = `${kind}:${categoryId || 'all'}:${maxItems}`;
    const cached = this.railCache.get(cacheKey);
    if (cached) return cached as T[];

    const manifest = (await this.storage.readActiveManifest()) as (null | {
      segments?: Array<{ kind?: string; fileName?: string }>;
    });
    const segments = (manifest?.segments || []).filter((entry) => entry.kind === kind && entry.fileName);
    const items: T[] = [];
    let segmentIndex = 0;

    while (segmentIndex < segments.length && items.length < maxItems) {
      const segFileName = segments[segmentIndex].fileName!;
      const raw = await this.storage.readActiveSegment?.(
        resolveSegmentRelativePath(segFileName)
      );
      let records: T[] = [];
      try {
        const parsed: unknown = raw ? JSON.parse(raw) : [];
        records = Array.isArray(parsed) ? (parsed as T[]) : [];
      } catch {
        records = [];
      }

      for (const record of records) {
        if (!categoryId || record.categoryIds.includes(categoryId)) {
          const resolvedUri =
            (record as any).posterUri ||
            (record as any).posterUrl ||
            (record as any).logo ||
            (record as any).cover ||
            (record as any).poster ||
            (record as any).stream_icon;

          if (resolvedUri) {
            (record as any).posterUri = resolvedUri;
            (record as any).posterUrl = resolvedUri;
          }

          items.push(record);
          if (items.length >= maxItems) break;
        }
      }
      segmentIndex++;
      await Promise.resolve();
    }

    this.railCache.set(cacheKey, items);
    return items;
  }

  async loadPage<T extends BrowseRecord>(
    kind: BrowseKind, cursor: BrowseCursor = { segment: 0, offset: 0 },
    pageSize = 48, categoryId?: string,
    options: { count?: boolean; signal?: AbortSignal; order?: BrowseOrder } = {},
  ): Promise<BrowsePage<T>> {
    this.check(options.signal);
    const order = kind === 'movies' ? options.order || 'source' : 'source';
    const first = cursor.segment === 0 && cursor.offset === 0 && pageSize === BROWSE_PAGE_SIZE;
    const cached = first ? this.cachedPage<T>(kind, categoryId, order) : undefined;
    if (cached) {
      if (options.count !== false) return { ...cached, totalAvailable: await this.countItems(kind, categoryId, options.signal), totalIsExact: true };
      return cached;
    }
    const cacheKey = `${this.key(kind, categoryId)}:${order}`;
    const pending = first ? this.pageJobs.get(cacheKey) : undefined;
    if (pending) {
      const page = await pending; this.check(options.signal);
      return options.count === false ? page as BrowsePage<T> : { ...page, totalAvailable: await this.countItems(kind, categoryId, options.signal), totalIsExact: true } as BrowsePage<T>;
    }
    // The first page48 job is shared; a single caller must not cancel its peers.
    const job = this.readPage<T>(kind, cursor, pageSize, categoryId, first ? undefined : options.signal, order);
    if (first) {
      this.pageJobs.set(cacheKey, job);
      void job.then(page => {
        if (this.lifetime.signal.aborted) return;
        this.pageCache.set(cacheKey, page);
        while (this.pageCache.size > 24) this.pageCache.delete(this.pageCache.keys().next().value!);
      }).finally(() => { if (this.pageJobs.get(cacheKey) === job) this.pageJobs.delete(cacheKey); }).catch(() => {});
    }
    const page = await job; this.check(options.signal);
    return options.count === false ? page : { ...page, totalAvailable: await this.countItems(kind, categoryId, options.signal), totalIsExact: true };
  }
  private async readPage<T extends BrowseRecord>(kind: BrowseKind, cursor: BrowseCursor, pageSize: number, categoryId?: string, signal?: AbortSignal, order: BrowseOrder = 'source'): Promise<BrowsePage<T>> {
    const manifest = await this.manifest(signal);
    const segments = (manifest?.segments || []).filter((entry) => entry.kind === kind && entry.fileName);
    if (order === 'source-desc') segments.reverse();
    const exact = !categoryId || this.completedCounts.has(kind);
    const knownTotal = categoryId ? this.categoryCountCache.get(this.key(kind, categoryId)) || 0 : Number(manifest?.counts?.[kind] || 0);

    const items: T[] = [];
    const start = order === 'source' && categoryId && cursor.segment === 0 && cursor.offset === 0 ? this.categoryStarts.get(this.key(kind, categoryId)) || cursor : cursor;
    let segmentIndex = start.segment;
    let offset = start.offset;
    while (segmentIndex < segments.length && items.length < pageSize) {
      this.check(signal); const records = await this.records<T>(segments[segmentIndex].fileName!, signal);
      let index = offset;
      while (index < records.length && items.length < pageSize) {
        const record = records[order === 'source-desc' ? records.length - 1 - index++ : index++];
        if (!categoryId || record.categoryIds.includes(categoryId)) {
          const resolvedUri =
            (record as any).posterUri ||
            (record as any).posterUrl ||
            (record as any).logo ||
            (record as any).cover ||
            (record as any).poster ||
            (record as any).stream_icon;

          if (resolvedUri) {
            (record as any).posterUri = resolvedUri;
            (record as any).posterUrl = resolvedUri;
          }
          items.push(record);
        }
      }
      if (items.length >= pageSize) {
        return {
          items, totalAvailable: exact ? knownTotal : items.length, totalIsExact: exact,
          nextCursor: index < records.length ? { segment: segmentIndex, offset: index } : { segment: segmentIndex + 1, offset: 0 },
        };
      }
      segmentIndex++;
      offset = 0;
      await Promise.resolve();
    }
    return { items, totalAvailable: exact ? knownTotal : items.length, totalIsExact: exact, nextCursor: null };
  }
}
export const BROWSE_PAGE_SIZE = 48;
