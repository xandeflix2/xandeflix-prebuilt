import type { Movie, Series } from '../contracts/catalog.ts';
import type { LocalCatalogStorage } from '../bootstrap/storage/storage.interface.ts';
import { resolveSegmentRelativePath } from '../bootstrap/storage/segment-path-resolver.ts';
import type { CatalogReadModel } from './catalog-read-model.ts';
import type { CatalogItemViewModel } from './catalog-view-model.ts';
import type { BrowseKind } from './segmented-browse.service.ts';
import { movieToViewModel, seriesToViewModel } from './catalog-selectors.ts';
import { normalizeArtworkUri } from '../artwork/artwork-uri.ts';
import { isReleaseCategory } from './category-presentation.ts';

const LIMIT = 20, MAX_CATEGORIES = 64, MAX_BYTES = 1024 * 1024;
type Saved = { version: 2; snapshot: string; rows: Array<[string, CatalogItemViewModel[]]> };
export interface PreviewRepository { read(kind: BrowseKind): Promise<unknown>; write(kind: BrowseKind, value: Saved): Promise<void>; }
const bounded = async <T>(operation: Promise<T>): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try { return await Promise.race([operation, new Promise<never>((_, reject) => { timer = setTimeout(() => reject(Error('PREVIEW_CACHE_TIMEOUT')), 1500); })]); }
  finally { if (timer) clearTimeout(timer); }
};

/** Two optional device-private records. This cache never stores playback data. */
class IndexedPreviewRepository implements PreviewRepository {
  private database?: Promise<IDBDatabase>;
  private db() {
    return this.database ||= new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('xandeflix-category-previews-v1', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('previews');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(Error('PREVIEW_CACHE_UNAVAILABLE'));
      request.onblocked = () => reject(Error('PREVIEW_CACHE_UNAVAILABLE'));
    });
  }
  async read(kind: BrowseKind): Promise<unknown> {
    return bounded((async () => {
      const db = await this.db();
      return new Promise((resolve, reject) => {
        const request = db.transaction('previews').objectStore('previews').get(kind);
        request.onsuccess = () => resolve(request.result); request.onerror = () => reject(Error('PREVIEW_CACHE_READ'));
      });
    })());
  }
  async write(kind: BrowseKind, value: Saved): Promise<void> {
    await bounded((async () => {
      const db = await this.db();
      return new Promise<void>((resolve, reject) => {
        const tx = db.transaction('previews', 'readwrite'); tx.objectStore('previews').put(value, kind);
        tx.oncomplete = () => resolve(); tx.onerror = tx.onabort = () => reject(Error('PREVIEW_CACHE_WRITE'));
      });
    })());
  }
}

function safeItem(item: CatalogItemViewModel): CatalogItemViewModel {
  return { id: item.id, kind: item.kind, title: item.title.slice(0, 200),
    externalIds: item.externalIds?.tmdbId ? { tmdbId: item.externalIds.tmdbId } : undefined,
    yearFormatted: item.yearFormatted, posterUri: normalizeArtworkUri(item.posterUri),
    genreLabels: item.genreLabels.slice(0, 10).map(label => label.slice(0, 100)),
    categoryLabels: item.categoryLabels.slice(0, 10).map(label => label.slice(0, 100)) };
}
function persistable(item: CatalogItemViewModel): boolean {
  if (/https?:\/\/|[\r\n]/i.test(item.id)) return false;
  if (!item.posterUri) return true;
  try { const uri = new URL(item.posterUri); return !uri.search && !uri.username && !uri.password; } catch { return false; }
}

/** One cooperative scan per kind/generation replaces one scan per visible row. */
export class CategoryPreviewIndex {
  private readonly lifetime = new AbortController();
  private readonly rows = new Map<BrowseKind, Map<string, CatalogItemViewModel[]>>();
  private readonly ready = new Set<string>();
  private readonly jobs = new Map<BrowseKind, Promise<void>>();
  private readonly listeners = new Set<() => void>();
  private readonly snapshot: string;
  private readonly model: CatalogReadModel;
  private readonly storage: LocalCatalogStorage;
  private readonly repository: PreviewRepository;
  constructor(model: CatalogReadModel, storage: LocalCatalogStorage, repository: PreviewRepository = new IndexedPreviewRepository()) {
    this.model = model; this.storage = storage; this.repository = repository; this.snapshot = model.catalog.metadata.snapshotId;
  }
  dispose(): void { this.lifetime.abort(); this.rows.clear(); this.ready.clear(); this.listeners.forEach(listener => listener()); this.listeners.clear(); }
  private check(): void { if (this.lifetime.signal.aborted) throw Error('PREVIEW_CANCELLED'); }
  private async manifest() {
    this.check(); const manifest = await this.storage.readActiveManifest() as null | { snapshotId?: string; segments?: Array<{ kind?: string; fileName?: string }> };
    this.check(); if (!manifest || manifest.snapshotId !== this.snapshot) throw Error('PREVIEW_GENERATION_CHANGED'); return manifest;
  }
  private notify() { this.listeners.forEach(listener => listener()); }
  prepare(kind: BrowseKind): Promise<void> {
    const existing = this.jobs.get(kind); if (existing) return existing;
    const job = this.scan(kind).catch(error => { this.rows.delete(kind); for (const key of this.ready) if (key.startsWith(`${kind}:`)) this.ready.delete(key); this.jobs.delete(kind); this.notify(); throw error; });
    this.jobs.set(kind, job); return job;
  }
  private async scan(kind: BrowseKind): Promise<void> {
    const manifest = await this.manifest(), type = kind === 'movies' ? 'movie' : 'series';
    const categories = this.model.getCategoriesForKind(type).slice(0, MAX_CATEGORIES), allowed = new Set(categories.map(category => category.id));
    const latest = new Set(kind === 'movies' ? categories.filter(category => isReleaseCategory(category.name)).map(category => category.id) : []);
    const rows = new Map<string, CatalogItemViewModel[]>(); this.rows.set(kind, rows);
    try {
      const saved = await this.repository.read(kind) as Saved | undefined; this.check();
      if (saved?.version === 2 && saved.snapshot === this.snapshot && Array.isArray(saved.rows) && saved.rows.length <= MAX_CATEGORIES
          && JSON.stringify(saved).length * 2 <= MAX_BYTES
          && saved.rows.every(([id, items]) => allowed.has(id) && Array.isArray(items) && items.length <= LIMIT
            && items.every(item => item?.kind === type && typeof item.id === 'string' && typeof item.title === 'string'
              && Array.isArray(item.genreLabels) && Array.isArray(item.categoryLabels) && persistable(item)))) {
        await this.manifest();
        for (const [id, items] of saved.rows) { rows.set(id, items.map(safeItem)); this.ready.add(`${kind}:${id}`); }
        if (categories.every(category => rows.has(category.id))) { this.notify(); return; }
      }
    } catch { this.check(); /* Optional cache loss falls back to the active catalog. */ }
    // A partial optional cache cannot establish the tail of a release category.
    for (const id of latest) { rows.delete(id); this.ready.delete(`${kind}:${id}`); }
    let bytes = [...rows.values()].reduce((total, items) => total + JSON.stringify(items).length * 2, 0);
    // A segment is released after its bounded presentation metadata has been copied.
    for (const entry of (manifest.segments || []).filter(entry => entry.kind === kind && entry.fileName)) {
      this.check(); const raw = await this.storage.readActiveSegment?.(resolveSegmentRelativePath(entry.fileName!)); this.check();
      await this.manifest(); // Never publish records read through a newly promoted pointer.
      let records: Array<Movie | Series> = [];
      if (raw) { const parsed: unknown = JSON.parse(raw); if (!Array.isArray(parsed)) throw Error('PREVIEW_INVALID_SEGMENT'); records = parsed; }
      for (let start = 0; start < records.length; start += 200) {
        this.check();
        for (const record of records.slice(start, start + 200)) {
          if (!record || typeof record.id !== 'string' || typeof record.title !== 'string' || !Array.isArray(record.categoryIds)) continue;
          const ids = record.categoryIds.filter(id => allowed.has(id) && (latest.has(id) || (rows.get(id)?.length || 0) < LIMIT));
          if (!ids.length) continue;
          const item = safeItem(type === 'movie' ? movieToViewModel(this.model, record as Movie) : seriesToViewModel(this.model, record as Series));
          for (const id of ids) {
            const items = rows.get(id) || []; if (items.some(previous => previous.id === item.id)) continue;
            if (latest.has(id)) {
              items.unshift(item);
              const removed = items.length > LIMIT ? items.pop() : undefined;
              if (removed) bytes -= JSON.stringify(removed).length * 2;
            } else items.push(item);
            bytes += JSON.stringify(item).length * 2; if (bytes > MAX_BYTES) throw Error('PREVIEW_QUOTA');
            rows.set(id, items);
            if (!latest.has(id) && items.length === LIMIT) { this.ready.add(`${kind}:${id}`); this.notify(); }
          }
        }
        await new Promise<void>(resolve => setTimeout(resolve, 0));
      }
      await this.manifest();
      if (!latest.size && categories.every(category => (rows.get(category.id)?.length || 0) === LIMIT)) break;
    }
    await this.manifest(); this.check();
    for (const category of categories) { if (!rows.has(category.id)) rows.set(category.id, []); this.ready.add(`${kind}:${category.id}`); }
    this.notify();
    // Query-bearing artwork URLs stay in RAM and never enter this optional cache.
    const saved: Saved = { version: 2, snapshot: this.snapshot, rows: [...rows].filter(([, items]) => items.every(persistable)) };
    if (JSON.stringify(saved).length * 2 <= MAX_BYTES) await this.repository.write(kind, saved).catch(() => {});
  }
  async load(kind: BrowseKind, categoryId: string, signal?: AbortSignal): Promise<CatalogItemViewModel[]> {
    this.check(); if (signal?.aborted) throw Error('PREVIEW_CANCELLED');
    if (!this.model.getCategoriesForKind(kind === 'movies' ? 'movie' : 'series').slice(0, MAX_CATEGORIES).some(category => category.id === categoryId)) throw Error('PREVIEW_OUTSIDE_QUOTA');
    const key = `${kind}:${categoryId}`, job = this.prepare(kind);
    if (this.ready.has(key)) return [...(this.rows.get(kind)?.get(categoryId) || [])];
    return new Promise((resolve, reject) => {
      const cleanup = () => { this.listeners.delete(update); signal?.removeEventListener('abort', abort); };
      const abort = () => { cleanup(); reject(Error('PREVIEW_CANCELLED')); };
      const update = () => { if (this.lifetime.signal.aborted) return abort(); if (this.ready.has(key)) { cleanup(); resolve([...(this.rows.get(kind)?.get(categoryId) || [])]); } };
      this.listeners.add(update); signal?.addEventListener('abort', abort, { once: true });
      void job.then(update, error => { cleanup(); reject(error); }); update();
    });
  }
}

const shared = new WeakMap<LocalCatalogStorage, { snapshot: string; index: CategoryPreviewIndex }>();
export function categoryPreviewIndex(model: CatalogReadModel, storage: LocalCatalogStorage): CategoryPreviewIndex {
  const snapshot = model.catalog.metadata.snapshotId, old = shared.get(storage);
  if (old?.snapshot === snapshot) return old.index;
  old?.index.dispose(); const index = new CategoryPreviewIndex(model, storage); shared.set(storage, { snapshot, index }); return index;
}
