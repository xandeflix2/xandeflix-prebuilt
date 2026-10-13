import type { CatalogItemViewModel } from './catalog-view-model.ts';

export interface HeroRecord {
  key: string;
  scope: string;
  year: number;
  snapshotId: string;
  kind: 'movie' | 'series';
  fresh: boolean;
  rank: number;
  bucket?: 0 | 1 | 2;
  releaseYear?: number;
  item?: CatalogItemViewModel;
  order?: (string | number)[];
}
export interface HeroGeneration { snapshotId: string; movies: number; series: number; selectionVersion?: number; }
export interface HomeHeroRepository {
  generation(scope: string, year: number): Promise<HeroGeneration | undefined>;
  readMany(keys: string[]): Promise<Map<string, HeroRecord>>;
  writeMany(records: HeroRecord[]): Promise<void>;
  commit(scope: string, year: number, snapshotId: string): Promise<HeroGeneration>;
  pick(scope: string, year: number, snapshotId: string, kind: HeroRecord['kind'], limit: number, exclude: ReadonlySet<string>, bucket?: 0 | 1 | 2): Promise<HeroRecord[]>;
  displayed(key: string, snapshotId: string): Promise<void>;
}

function ordered(record: HeroRecord): HeroRecord {
  const priority = record.bucket === 2 ? 2100 - (record.releaseYear || 0) : record.fresh ? 0 : 1;
  return { ...record, order: record.item ? [record.scope, record.year, record.snapshotId, record.kind, record.bucket || 0, priority, record.rank, record.key] : undefined };
}
const request = <T>(req: IDBRequest<T>): Promise<T> => new Promise((resolve, reject) => {
  req.onsuccess = () => resolve(req.result); req.onerror = () => reject(new Error('HERO_INDEX_REQUEST_FAILED'));
});
const finished = (tx: IDBTransaction): Promise<void> => new Promise((resolve, reject) => {
  tx.oncomplete = () => resolve(); tx.onabort = tx.onerror = () => reject(new Error('HERO_INDEX_WRITE_FAILED'));
});

/** Device-private presentation index. No stream URLs, source credentials or remote writes. */
export class IndexedDbHomeHeroRepository implements HomeHeroRepository {
  private readonly db: Promise<IDBDatabase>;
  constructor(factory: IDBFactory = indexedDB) {
    this.db = new Promise((resolve, reject) => {
      const req = factory.open('xandeflix-local-home-hero-v2', 1);
      req.onupgradeneeded = () => {
        const entries = req.result.createObjectStore('entries', { keyPath: 'key' });
        entries.createIndex('order', 'order');
        req.result.createObjectStore('generations');
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = req.onblocked = () => reject(new Error('HERO_INDEX_UNAVAILABLE'));
    });
  }
  async generation(scope: string, year: number): Promise<HeroGeneration | undefined> {
    return request((await this.db).transaction('generations').objectStore('generations').get(`${scope}:${year}`));
  }
  async readMany(keys: string[]): Promise<Map<string, HeroRecord>> {
    const store = (await this.db).transaction('entries').objectStore('entries');
    const values = await Promise.all(keys.map((key) => request<HeroRecord | undefined>(store.get(key))));
    return new Map(values.filter((v): v is HeroRecord => Boolean(v)).map((v) => [v.key, v]));
  }
  async writeMany(records: HeroRecord[]): Promise<void> {
    const tx = (await this.db).transaction('entries', 'readwrite'); const done = finished(tx);
    for (const record of records) tx.objectStore('entries').put(ordered(record));
    await done;
  }
  async commit(scope: string, year: number, snapshotId: string): Promise<HeroGeneration> {
    const db = await this.db;
    const index = db.transaction('entries').objectStore('entries').index('order');
    const count = (kind: HeroRecord['kind']) => request(index.count(IDBKeyRange.bound([scope, year, snapshotId, kind, 0], [scope, year, snapshotId, kind, 0, 2])));
    const [movies, series] = await Promise.all([count('movie'), count('series')]);
    const value = { snapshotId, movies, series, selectionVersion: 3 };
    const tx = db.transaction('generations', 'readwrite'); const done = finished(tx);
    tx.objectStore('generations').put(value, `${scope}:${year}`); await done; return value;
  }
  async pick(scope: string, year: number, snapshotId: string, kind: HeroRecord['kind'], limit: number, exclude: ReadonlySet<string>, bucket: 0 | 1 | 2 = 0): Promise<HeroRecord[]> {
    const db = await this.db, chosen = new Map<string, HeroRecord>(), pivot = Math.random();
    if (bucket === 2) {
      for (const omitted of [exclude, new Set<string>()]) {
        await new Promise<void>((resolve, reject) => {
          const range = IDBKeyRange.bound([scope, year, snapshotId, kind, 2], [scope, year, snapshotId, kind, 3], false, true);
          const req = db.transaction('entries').objectStore('entries').index('order').openCursor(range);
          req.onerror = () => reject(new Error('HERO_INDEX_READ_FAILED'));
          req.onsuccess = () => { const cursor = req.result;
            if (!cursor || chosen.size >= limit) { resolve(); return; }
            const record = cursor.value as HeroRecord;
            if (record.item && !omitted.has(record.key)) chosen.set(record.key, record);
            cursor.continue();
          };
        });
        if (chosen.size >= limit) break;
      }
      return [...chosen.values()].slice(0, limit);
    }
    const scan = (priority: number, low: number, high: number, omitted: ReadonlySet<string>) => new Promise<void>((resolve, reject) => {
      const range = IDBKeyRange.bound([scope, year, snapshotId, kind, bucket, priority, low], [scope, year, snapshotId, kind, bucket, priority, high, '\uffff']);
      const req = db.transaction('entries').objectStore('entries').index('order').openCursor(range);
      req.onerror = () => reject(new Error('HERO_INDEX_READ_FAILED'));
      req.onsuccess = () => { const cursor = req.result;
        if (!cursor || chosen.size >= limit) { resolve(); return; }
        const record = cursor.value as HeroRecord;
        if (record.item && !omitted.has(record.key)) chosen.set(record.key, record);
        cursor.continue();
      };
    });
    for (const omitted of [exclude, new Set<string>()]) {
      await scan(0, 0, 1, omitted); await scan(1, pivot, 1, omitted); await scan(1, 0, pivot, omitted);
      if (chosen.size >= limit) break;
    }
    return [...chosen.values()].slice(0, limit);
  }
  async displayed(key: string, snapshotId: string): Promise<void> {
    const tx = (await this.db).transaction('entries', 'readwrite'); const done = finished(tx), store = tx.objectStore('entries');
    const req = store.get(key);
    req.onsuccess = () => { const value = req.result as HeroRecord | undefined;
      if (value?.snapshotId === snapshotId && value.fresh) store.put(ordered({ ...value, fresh: false, item: value.bucket === 1 ? undefined : value.item }));
    };
    await done;
  }
}

/** Bounded fallback for first-fold only, also injectable in isolated tests. */
export class MemoryHomeHeroRepository implements HomeHeroRepository {
  readonly records = new Map<string, HeroRecord>();
  private readonly generations = new Map<string, HeroGeneration>();
  private readonly limit: number;
  constructor(limit = 400) { this.limit = limit; }
  async generation(scope: string, year: number) { return this.generations.get(`${scope}:${year}`); }
  async readMany(keys: string[]) { return new Map(keys.flatMap((key) => this.records.has(key) ? [[key, this.records.get(key)!] as const] : [])); }
  async writeMany(records: HeroRecord[]) { for (const value of records) { this.records.set(value.key, ordered(value)); while (this.records.size > this.limit) this.records.delete(this.records.keys().next().value!); } }
  async commit(scope: string, year: number, snapshotId: string) {
    const values = [...this.records.values()].filter((v) => v.scope === scope && v.year === year && v.snapshotId === snapshotId && !v.bucket && v.item);
    const generation = { snapshotId, movies: values.filter((v) => v.kind === 'movie').length, series: values.filter((v) => v.kind === 'series').length, selectionVersion: 3 };
    this.generations.set(`${scope}:${year}`, generation); return generation;
  }
  async pick(scope: string, year: number, snapshotId: string, kind: HeroRecord['kind'], limit: number, exclude: ReadonlySet<string>, bucket: 0 | 1 | 2 = 0) {
    const pivot = Math.random(); const values = [...this.records.values()].filter((v) => v.scope === scope && v.year === year && v.snapshotId === snapshotId && v.kind === kind && (v.bucket || 0) === bucket && v.item);
    values.sort((a, b) => (bucket === 2 ? (b.releaseYear || 0) - (a.releaseYear || 0) : Number(b.fresh) - Number(a.fresh)) || ((a.rank - pivot + 1) % 1) - ((b.rank - pivot + 1) % 1));
    const chosen = values.filter((v) => !exclude.has(v.key)).slice(0, limit);
    for (const value of values) if (chosen.length < limit && !chosen.some((v) => v.key === value.key)) chosen.push(value);
    return chosen;
  }
  async displayed(key: string, snapshotId: string) { const value = this.records.get(key); if (value?.snapshotId === snapshotId) { value.fresh = false; if (value.bucket === 1) value.item = undefined; } }
}
