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
  private readonly pending = new Map<string, Promise<Movie | Series | undefined>>();
  private readonly queue: Array<() => void> = [];
  private running = false;

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

  private resolveById<T extends Movie | Series>(kind: CanonicalItemKind, itemId: string): Promise<T | undefined> {
    if (!itemId) return Promise.resolve(undefined);
    const key = `${kind}:${itemId}`;
    const existing = this.pending.get(key);
    if (existing) return existing as Promise<T | undefined>;
    if (this.pending.size >= 32) return Promise.reject(new Error('CANONICAL_RESOLVER_BUSY'));
    let finish!: (value: T | undefined) => void, fail!: (error: unknown) => void;
    const result = new Promise<T | undefined>((resolve, reject) => { finish = resolve; fail = reject; });
    this.pending.set(key, result);
    this.queue.push(() => {
      this.running = true;
      void (async () => {
        let value: T | undefined, error: unknown, failed = false;
        try { value = await this.readById<T>(kind, itemId); }
        catch (cause) { failed = true; error = cause; }
        finally {
          this.pending.delete(key);
          this.running = false;
          this.drain();
        }
        if (failed) fail(error); else finish(value);
      })();
    });
    this.drain();
    return result;
  }

  private drain(): void {
    if (!this.running) this.queue.shift()?.();
  }

  private async readById<T extends Movie | Series>(kind: CanonicalItemKind, itemId: string): Promise<T | undefined> {
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
