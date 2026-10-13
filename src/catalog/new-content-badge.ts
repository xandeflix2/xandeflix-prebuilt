import type { CatalogReadModel } from './catalog-read-model.ts';
import type { LocalCatalogStorage, SegmentedCatalogManifest } from '../bootstrap/storage/storage.interface.ts';
import { resolveSegmentRelativePath } from '../bootstrap/storage/segment-path-resolver.ts';
import type { CatalogItemViewModel } from './catalog-view-model.ts';

export const NEW_CONTENT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
export const NEW_CONTENT_MAX_KEYS = 100000;
export const EPISODE_REFERENCE_MAX_RECORDS = 1000000;
const COORDINATE_BASE = 1000000;
export interface SeriesEpisodeReference { coordinates: string; addedAt: number }
export type ContentBadge = 'Novidade' | 'Episódios Novos' | undefined;
export interface NewContentInventory {
  version: 1;
  scope: string;
  snapshotId: string;
  // Zero means present in the initial reference, never a recent insertion.
  seen: Record<string, number>;
  // Optional for an additive migration of the existing v1 title inventory.
  seriesEpisodes?: Record<string, SeriesEpisodeReference>;
}
export interface NewContentRepository {
  read(scope: string): Promise<NewContentInventory | null>;
  commit(inventory: NewContentInventory, expectedSnapshotId?: string, signal?: AbortSignal): Promise<void>;
}

function hash(value: string): string {
  let a = 2166136261, b = 5381;
  for (let i = 0; i < value.length; i++) {
    a = Math.imul(a ^ value.charCodeAt(i), 16777619);
    b = Math.imul(b, 33) ^ value.charCodeAt(i);
  }
  return (a >>> 0).toString(16).padStart(8, '0') + (b >>> 0).toString(16).padStart(8, '0');
}
export function newContentKey(kind: 'movie' | 'series', title: string): string {
  // Do not key by ordinal ID or metadata which can change after enrichment.
  return hash(`${kind}:${title.normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ')}`);
}
export function newContentScope(sourceId: string): string { return hash(sourceId); }
export function isNewContent(firstSeen: number | undefined, now: number): boolean {
  return typeof firstSeen === 'number' && firstSeen > 0 && now >= firstSeen && now < firstSeen + NEW_CONTENT_WINDOW_MS;
}

type CoordinateRange = [number, number];
function readCoordinates(value: string): CoordinateRange[] {
  if (typeof value !== 'string' || value.length > 14000000) throw Error('NOVELTY_EPISODES_INVALID');
  if (!value) return [];
  let last = 0;
  return value.split(',').map(part => {
    if (!/^\d+(?:-\d+)?$/.test(part)) throw Error('NOVELTY_EPISODES_INVALID');
    const [start, second] = part.split('-').map(Number), end = second ?? start;
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start <= last || end < start ||
        end >= COORDINATE_BASE ** 2 || start % COORDINATE_BASE === 0 ||
        Math.floor(start / COORDINATE_BASE) !== Math.floor(end / COORDINATE_BASE)) throw Error('NOVELTY_EPISODES_INVALID');
    last = end;
    return [start, end];
  });
}
function mergeCoordinates(ranges: CoordinateRange[]): CoordinateRange[] {
  const merged: CoordinateRange[] = [];
  for (const [start, end] of ranges.sort((a, b) => a[0] - b[0])) {
    const last = merged[merged.length - 1];
    if (last && start <= last[1] + 1) last[1] = Math.max(last[1], end);
    else merged.push([start, end]);
  }
  return merged;
}
function validateEpisodeReferences(value: unknown): asserts value is Record<string, SeriesEpisodeReference> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('NOVELTY_EPISODES_INVALID');
  const entries = Object.entries(value);
  if (entries.length > NEW_CONTENT_MAX_KEYS) throw Error('NOVELTY_INVENTORY_LIMIT');
  let count = 0;
  for (const [key, ref] of entries) {
    if (!/^[a-f0-9]{16}$/.test(key) || !ref || !Number.isSafeInteger(ref.addedAt) || ref.addedAt < 0) throw Error('NOVELTY_EPISODES_INVALID');
    for (const [start, end] of readCoordinates(ref.coordinates)) count += end - start + 1;
    if (count > EPISODE_REFERENCE_MAX_RECORDS) throw Error('NOVELTY_INVENTORY_LIMIT');
  }
}
export function contentBadge(inventory: NewContentInventory | null, key: string, now = Date.now()): ContentBadge {
  if (isNewContent(inventory?.seen[key], now)) return 'Novidade';
  return isNewContent(inventory?.seriesEpisodes?.[key]?.addedAt, now) ? 'Episódios Novos' : undefined;
}
export function seriesActivityAt(inventory: NewContentInventory, key: string, now = Date.now()): number {
  const title = inventory.seen[key], episodes = inventory.seriesEpisodes?.[key]?.addedAt;
  return Math.max(isNewContent(title, now) ? title : 0, isNewContent(episodes, now) ? episodes! : 0);
}

function validateInventory(value: unknown, scope: string): NewContentInventory | null {
  if (value === undefined || value === null) return null;
  const v = value as Partial<NewContentInventory>;
  if (v.version !== 1 || v.scope !== scope || typeof v.snapshotId !== 'string' || !v.snapshotId || !v.seen || typeof v.seen !== 'object' || Array.isArray(v.seen)) throw Error('NOVELTY_STORAGE_INVALID');
  const entries = Object.entries(v.seen);
  if (entries.length > NEW_CONTENT_MAX_KEYS || entries.some(([key, time]) => !/^[a-f0-9]{16}$/.test(key) || !Number.isSafeInteger(time) || time < 0)) throw Error('NOVELTY_STORAGE_INVALID');
  if (v.seriesEpisodes !== undefined) validateEpisodeReferences(v.seriesEpisodes);
  return v as NewContentInventory;
}

/** One atomic, versioned record per source. No source titles, URLs or catalog bytes. */
export class IndexedDbNewContentRepository implements NewContentRepository {
  private db?: Promise<IDBDatabase>;
  private readonly databaseName: string;
  constructor(databaseName = 'xandeflix-local-new-content-v1') { this.databaseName = databaseName; }
  private open(): Promise<IDBDatabase> {
    return this.db ||= new Promise((resolve, reject) => {
      const request = indexedDB.open(this.databaseName, 1);
      let blocked = false;
      request.onupgradeneeded = () => { request.result.createObjectStore('inventories', { keyPath: 'scope' }); };
      request.onsuccess = () => {
        if (blocked) { request.result.close(); return; }
        request.result.onversionchange = () => { request.result.close(); this.db = undefined; };
        resolve(request.result);
      };
      request.onerror = () => reject(Error('NOVELTY_STORAGE_UNAVAILABLE'));
      request.onblocked = () => { blocked = true; reject(Error('NOVELTY_STORAGE_BLOCKED')); };
    });
  }
  async read(scope: string): Promise<NewContentInventory | null> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('inventories', 'readonly');
      const request = tx.objectStore('inventories').get(scope);
      let value: unknown;
      request.onsuccess = () => { value = request.result; };
      tx.oncomplete = () => { try { resolve(validateInventory(value, scope)); } catch (error) { reject(error); } };
      tx.onabort = tx.onerror = () => reject(Error('NOVELTY_STORAGE_READ_FAILED'));
    });
  }
  async commit(inventory: NewContentInventory, expectedSnapshotId?: string, signal?: AbortSignal): Promise<void> {
    validateInventory(inventory, inventory.scope);
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('inventories', 'readwrite'), store = tx.objectStore('inventories');
      const request = store.get(inventory.scope);
      request.onsuccess = () => {
        if (signal?.aborted || request.result?.snapshotId !== expectedSnapshotId) { tx.abort(); return; }
        store.put(inventory);
      };
      tx.oncomplete = () => resolve();
      tx.onabort = tx.onerror = () => reject(Error('NOVELTY_STORAGE_COMMIT_FAILED'));
    });
  }
}

/** Read one local segment at a time; only hashed identities survive each batch. */
export async function scanNewContent(
  model: CatalogReadModel, storage: LocalCatalogStorage, repository: NewContentRepository,
  signal: AbortSignal, onLoaded: (inventory: NewContentInventory | null) => void = () => {},
  now = Date.now(), cooperate = () => new Promise<void>((resolve) => setTimeout(resolve, 0)),
): Promise<NewContentInventory> {
  const snapshotId = model.catalog.metadata.snapshotId;
  const check = () => { if (signal.aborted) throw Error('NOVELTY_SCAN_CANCELLED'); };
  check();
  const manifest = await storage.readActiveManifest() as SegmentedCatalogManifest | null;
  check();
  if (manifest?.snapshotId && manifest.snapshotId !== snapshotId) throw Error('NOVELTY_GENERATION_CHANGED');
  const scope = newContentScope(manifest?.metadata?.sourceId || 'local-catalog');
  const previous = await repository.read(scope);
  check(); onLoaded(previous);
  if (previous?.snapshotId === snapshotId && previous.seriesEpisodes !== undefined) return previous;
  const seen: Record<string, number> = { ...previous?.seen };
  const seriesIds = new Map<string, string>();
  let keyCount = Object.keys(seen).length;
  const process = async (rows: unknown[], kind: 'movie' | 'series') => {
    for (let i = 0; i < rows.length; i += 200) {
      check();
      for (const row of rows.slice(i, i + 200)) {
        if (!row || typeof (row as { title?: unknown }).title !== 'string') throw Error('NOVELTY_RECORD_INVALID');
        const title = (row as { title: string }).title;
        if (!title.trim() || title.length > 1000 || /https?:\/\/|[\r\n]/i.test(title)) throw Error('NOVELTY_RECORD_INVALID');
        const key = newContentKey(kind, title);
        if (kind === 'series' && typeof (row as { id?: unknown }).id === 'string') {
          const id = (row as { id: string }).id;
          if (seriesIds.has(id) && seriesIds.get(id) !== key) throw Error('NOVELTY_RECORD_INVALID');
          seriesIds.set(id, key);
        }
        if (!(key in seen)) {
          if (++keyCount > NEW_CONTENT_MAX_KEYS) throw Error('NOVELTY_INVENTORY_LIMIT');
          seen[key] = previous ? now : 0;
        }
      }
      await cooperate();
    }
  };
  const assertGeneration = async () => {
    check(); const pointer = await storage.readActivePointer(); check();
    if (pointer?.snapshotId !== snapshotId) throw Error('NOVELTY_GENERATION_CHANGED');
  };
  for (const kind of ['movie', 'series'] as const) {
    const entries = manifest?.segments?.filter((entry) => entry.kind === (kind === 'movie' ? 'movies' : 'series')) || [];
    if (entries.length) {
      if (entries.reduce((count, entry) => count + entry.recordCount, 0) !== manifest?.counts?.[kind === 'movie' ? 'movies' : 'series']) throw Error('NOVELTY_INVENTORY_INCOMPLETE');
      for (const entry of entries) {
        await assertGeneration();
        const raw = await storage.readActiveSegment?.(resolveSegmentRelativePath(entry.fileName)); check();
        if (!raw) throw Error('NOVELTY_SEGMENT_UNAVAILABLE');
        const rows: unknown = JSON.parse(raw);
        if (!Array.isArray(rows) || rows.length !== entry.recordCount) throw Error('NOVELTY_SEGMENT_INVALID');
        await process(rows, kind);
      }
    } else {
      const rows = kind === 'movie' ? model.catalog.movies : model.catalog.series;
      // A segmented first-fold is never a complete baseline for a non-empty kind.
      const count = manifest?.counts?.[kind === 'movie' ? 'movies' : 'series'];
      if (count !== undefined && count !== rows.length) throw Error('NOVELTY_INVENTORY_INCOMPLETE');
      await process(rows, kind);
    }
  }
  const seriesEpisodes = await scanEpisodeReferences(model, storage, manifest, seriesIds, previous?.seriesEpisodes,
    previous?.seen, now, check, assertGeneration, cooperate);
  await assertGeneration();
  const inventory: NewContentInventory = { version: 1, scope, snapshotId, seen, seriesEpisodes };
  await repository.commit(inventory, previous?.snapshotId, signal);
  check();
  return inventory;
}

/** Keep only numeric coordinates, never full episode objects or stream references. */
async function scanEpisodeReferences(
  model: CatalogReadModel, storage: LocalCatalogStorage, manifest: SegmentedCatalogManifest | null,
  seriesIds: Map<string, string>, previous: Record<string, SeriesEpisodeReference> | undefined,
  previousTitles: Record<string, number> | undefined, now: number, check: () => void,
  assertGeneration: () => Promise<void>, cooperate: () => Promise<void>,
): Promise<Record<string, SeriesEpisodeReference>> {
  const seasons = new Map<string, { seriesId: string; key: string; number: number }>();
  const current = new Map<string, number[]>();
  for (const key of seriesIds.values()) current.set(key, []);
  let recordCount = 0;
  const consume = async (kind: 'seasons' | 'episodes', rows: unknown[]) => {
    for (let i = 0; i < rows.length; i += 200) {
      check();
      for (const value of rows.slice(i, i + 200)) {
        if (!value || typeof value !== 'object') throw Error('NOVELTY_EPISODES_INVALID');
        const row = value as Record<string, unknown>;
        const seriesId = row.seriesId as string, key = seriesIds.get(seriesId);
        if (!key) throw Error('NOVELTY_EPISODE_ORPHAN');
        if (kind === 'seasons') {
          const number = row.seasonNumber as number;
          if (typeof row.id !== 'string' || seasons.has(row.id) || !Number.isSafeInteger(number) || number < 0 || number >= COORDINATE_BASE) throw Error('NOVELTY_EPISODES_INVALID');
          if (seasons.size >= 500000) throw Error('NOVELTY_INVENTORY_LIMIT');
          seasons.set(row.id, { seriesId, key, number });
        } else {
          if (++recordCount > EPISODE_REFERENCE_MAX_RECORDS) throw Error('NOVELTY_INVENTORY_LIMIT');
          const season = seasons.get(row.seasonId as string), number = row.episodeNumber as number;
          if (!season || season.seriesId !== seriesId) throw Error('NOVELTY_EPISODE_ORPHAN');
          if (!Number.isSafeInteger(number) || number <= 0 || number >= COORDINATE_BASE) throw Error('NOVELTY_EPISODES_INVALID');
          current.get(key)!.push(season.number * COORDINATE_BASE + number);
        }
      }
      await cooperate();
    }
  };
  for (const kind of ['seasons', 'episodes'] as const) {
    const entries = manifest?.segments?.filter(entry => entry.kind === kind) || [];
    if (entries.length) {
      if (entries.reduce((total, entry) => total + entry.recordCount, 0) !== manifest?.counts?.[kind]) throw Error('NOVELTY_INVENTORY_INCOMPLETE');
      for (const entry of entries) {
        await assertGeneration();
        const raw = await storage.readActiveSegment?.(resolveSegmentRelativePath(entry.fileName)); check();
        if (!raw) throw Error('NOVELTY_SEGMENT_UNAVAILABLE');
        const rows: unknown = JSON.parse(raw);
        if (!Array.isArray(rows) || rows.length !== entry.recordCount) throw Error('NOVELTY_SEGMENT_INVALID');
        await consume(kind, rows);
      }
    } else {
      const rows = model.catalog[kind] || [];
      if (manifest?.counts?.[kind] !== undefined && manifest.counts[kind] !== rows.length) throw Error('NOVELTY_INVENTORY_INCOMPLETE');
      await consume(kind, rows);
    }
  }
  const result = { ...previous };
  let processed = 0;
  for (const [key, coordinates] of current) {
    check();
    coordinates.sort((a, b) => a - b);
    const old = previous?.[key], ranges = old ? readCoordinates(old.coordinates) : [];
    let index = 0, added = false;
    for (const coordinate of coordinates) {
      while (index < ranges.length && ranges[index][1] < coordinate) index++;
      if (index === ranges.length || ranges[index][0] > coordinate) added = true;
    }
    // Preserve prior knowledge across removals/reinsertions and the v1 baseline.
    const merged = mergeCoordinates([...ranges, ...coordinates.map((n): CoordinateRange => [n, n])]);
    result[key] = { coordinates: merged.map(([start, end]) => start === end ? String(start) : `${start}-${end}`).join(','),
      addedAt: old && previousTitles && key in previousTitles && added ? now : old?.addedAt || 0 };
    current.delete(key);
    if (++processed % 200 === 0) await cooperate();
  }
  validateEpisodeReferences(result);
  return result;
}

/** Only recent hashes in display memory; subscribers receive a stable boolean. */
export class NewContentDisplayStore {
  private recent = new Map<string, number>();
  private episodes = new Map<string, number>();
  private highlights: CatalogItemViewModel[] = [];
  private snapshotId = '';
  private listeners = new Set<() => void>();
  private readonly canUpdateHighlights: () => boolean;
  constructor(canUpdateHighlights: () => boolean = () => true) { this.canUpdateHighlights = canUpdateHighlights; }
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener); return () => { this.listeners.delete(listener); };
  };
  has = (key: string): boolean => isNewContent(this.recent.get(key), Date.now());
  badge = (key: string): ContentBadge => this.has(key) ? 'Novidade' : isNewContent(this.episodes.get(key), Date.now()) ? 'Episódios Novos' : undefined;
  getSeriesHighlights = (): CatalogItemViewModel[] => this.highlights;
  setSeriesHighlights(snapshotId: string, items: CatalogItemViewModel[]): void {
    if (snapshotId !== this.snapshotId) return;
    this.highlights = items.filter(item => this.badge(newContentKey('series', item.title))).slice(0, 100);
    this.notify();
  }
  publish(inventory: NewContentInventory | null, now = Date.now()): void {
    if (this.snapshotId !== inventory?.snapshotId || !inventory) this.highlights = [];
    this.snapshotId = inventory?.snapshotId || '';
    this.recent = new Map(Object.entries(inventory?.seen || {}).filter(([, date]) => isNewContent(date, now)));
    this.episodes = new Map(Object.entries(inventory?.seriesEpisodes || {}).filter(([, ref]) => isNewContent(ref.addedAt, now)).map(([key, ref]) => [key, ref.addedAt]));
    this.notify();
  }
  expire(now = Date.now()): void {
    let changed = false;
    for (const [key, date] of this.recent) if (!isNewContent(date, now)) { this.recent.delete(key); changed = true; }
    for (const [key, date] of this.episodes) if (!isNewContent(date, now)) { this.episodes.delete(key); changed = true; }
    if (this.canUpdateHighlights()) {
      const current = this.highlights.filter(item => this.badge(newContentKey('series', item.title)));
      if (current.length !== this.highlights.length) { this.highlights = current; changed = true; }
    }
    if (changed) this.notify();
  }
  nextExpiry(): number | undefined {
    let next = Infinity;
    for (const date of this.recent.values()) next = Math.min(next, date + NEW_CONTENT_WINDOW_MS);
    for (const date of this.episodes.values()) next = Math.min(next, date + NEW_CONTENT_WINDOW_MS);
    return Number.isFinite(next) ? next : undefined;
  }
  private notify(): void { for (const listener of this.listeners) listener(); }
}
