/**
 * Resolve uma entidade do catálogo segmentado sem materializar o catálogo inteiro.
 * O identificador da rota é a única entrada; cada segmento é descartado antes do
 * próximo e a leitura termina ao encontrar o item.
 */
import type { Movie, Series } from '../contracts/catalog.ts';
import type { LocalCatalogStorage } from '../bootstrap/storage/storage.interface.ts';
import { resolveSegmentRelativePath } from '../bootstrap/storage/segment-path-resolver.ts';

export type CanonicalItemKind = 'movies' | 'series';

export class CanonicalItemResolver {
  private readonly storage: LocalCatalogStorage;
  private readonly snapshotId: string;

  constructor(
    storage: LocalCatalogStorage,
    snapshotId: string,
  ) {
    this.storage = storage;
    this.snapshotId = snapshotId;
  }

  resolveMovieById(itemId: string): Promise<Movie | undefined> {
    return this.resolveById<Movie>('movies', itemId);
  }

  resolveSeriesById(itemId: string): Promise<Series | undefined> {
    return this.resolveById<Series>('series', itemId);
  }

  private async resolveById<T extends Movie | Series>(kind: CanonicalItemKind, itemId: string): Promise<T | undefined> {
    if (!itemId) return undefined;
    const manifest = await this.storage.readActiveManifest() as (null | {
      snapshotId?: string;
      segments?: Array<{ kind?: string; fileName?: string }>;
    });
    if (!manifest || manifest.snapshotId !== this.snapshotId || !this.storage.readActiveSegment) return undefined;

    for (const segment of manifest.segments || []) {
      if (segment.kind !== kind || !segment.fileName) continue;
      const raw = await this.storage.readActiveSegment(resolveSegmentRelativePath(segment.fileName));
      if (raw) {
        try {
          const records = JSON.parse(raw) as unknown;
          if (Array.isArray(records)) {
            const match = records.find((record): record is T =>
              Boolean(record) && typeof record === 'object' && (record as { id?: unknown }).id === itemId,
            );
            if (match) return match;
          }
        } catch {
          // Um segmento inválido não autoriza substituir a entidade canônica.
        }
      }
      await Promise.resolve();
    }
    return undefined;
  }
}
