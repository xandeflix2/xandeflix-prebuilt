/**
 * Leitor paginado do catálogo segmentado. Mantém somente a página solicitada
 * em memória e usa as contagens do manifest como autoridade da interface.
 */
import type { Movie, Series } from '../contracts/catalog.ts';
import type { LocalCatalogStorage } from '../bootstrap/storage/storage.interface.ts';
import { resolveSegmentRelativePath } from '../bootstrap/storage/segment-path-resolver.ts';

export type BrowseKind = 'movies' | 'series';
export interface BrowseCursor { segment: number; offset: number; }
export interface BrowsePage<T> { items: T[]; nextCursor: BrowseCursor | null; totalAvailable: number; }
type BrowseRecord = Movie | Series;

export class SegmentedBrowseService {
  private readonly storage: LocalCatalogStorage;
  private readonly categoryCountCache = new Map<string, number>();
  private readonly railCache = new Map<string, BrowseRecord[]>();

  constructor(storage: LocalCatalogStorage) {
    this.storage = storage;
  }

  /**
   * Carrega os primeiros maxItems de uma categoria com parada rápida (early-exit).
   * Interrompe a leitura de segmentos assim que atinge a cota solicitada.
   */
  async loadRailItems<T extends BrowseRecord>(
    kind: BrowseKind,
    categoryId?: string,
    maxItems = 20
  ): Promise<T[]> {
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
  ): Promise<BrowsePage<T>> {
    const manifest = await this.storage.readActiveManifest() as (null | {
      counts?: Partial<Record<BrowseKind, number>>;
      segments?: Array<{ kind?: string; fileName?: string }>;
    });
    const segments = (manifest?.segments || []).filter((entry) => entry.kind === kind && entry.fileName);
    const totalAvailable = categoryId
      ? await this.countCategory<T>(segments, categoryId)
      : Number(manifest?.counts?.[kind] || 0);

    const items: T[] = [];
    let segmentIndex = cursor.segment;
    let offset = cursor.offset;
    while (segmentIndex < segments.length && items.length < pageSize) {
      const raw = await this.storage.readActiveSegment?.(resolveSegmentRelativePath(segments[segmentIndex].fileName!));
      let records: T[] = [];
      try {
        const parsed: unknown = raw ? JSON.parse(raw) : [];
        records = Array.isArray(parsed) ? parsed as T[] : [];
      } catch { records = []; }
      let index = offset;
      while (index < records.length && items.length < pageSize) {
        const record = records[index++];
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
          items, totalAvailable,
          nextCursor: index < records.length ? { segment: segmentIndex, offset: index } : { segment: segmentIndex + 1, offset: 0 },
        };
      }
      segmentIndex++;
      offset = 0;
      await Promise.resolve();
    }
    return { items, totalAvailable, nextCursor: null };
  }

  private async countCategory<T extends BrowseRecord>(
    segments: Array<{ fileName?: string }>, categoryId: string,
  ): Promise<number> {
    const cached = this.categoryCountCache.get(categoryId);
    if (cached !== undefined) return cached;
    let count = 0;
    for (const segment of segments) {
      const raw = await this.storage.readActiveSegment?.(resolveSegmentRelativePath(segment.fileName!));
      try {
        const records: unknown = raw ? JSON.parse(raw) : [];
        if (Array.isArray(records)) {
          count += (records as T[]).filter((record) => record?.categoryIds?.includes(categoryId)).length;
        }
      } catch { /* Segmento inválido não contribui para a contagem canônica. */ }
      await Promise.resolve();
    }
    this.categoryCountCache.set(categoryId, count);
    return count;
  }
}
export const BROWSE_PAGE_SIZE = 48;
