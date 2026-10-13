import type { Movie, Series } from '../contracts/catalog.ts';
import type { LocalCatalogStorage } from '../bootstrap/storage/storage.interface.ts';
import { resolveSegmentRelativePath } from '../bootstrap/storage/segment-path-resolver.ts';
import { artworkIdentityKey, normalizeArtworkIdentity, tmdbPosterPath, tmdbMetadataService, type ArtworkMetadata } from '../artwork/tmdb-metadata.service.ts';
import type { CatalogReadModel } from './catalog-read-model.ts';
import type { CatalogItemViewModel } from './catalog-view-model.ts';
import { movieToViewModel, seriesToViewModel } from './catalog-selectors.ts';
import { isReleaseCategory } from './category-presentation.ts';
import { type HeroRecord, type HomeHeroRepository, IndexedDbHomeHeroRepository, MemoryHomeHeroRepository } from './home-hero.repository.ts';

export interface HomeHeroOption { key: string; item: CatalogItemViewModel; fresh: boolean; }
export function isPhoneHeroProfile(userAgent: string, mobile: boolean | undefined, width: number, touchPoints = 0): boolean {
  if (/\baft\w+\b|fire.?tv|android tv|ipad/i.test(userAgent) || (/macintosh/i.test(userAgent) && touchPoints > 1)) return false;
  if (/iphone|ipod/i.test(userAgent) || mobile === true || /android.*\bmobile\b/i.test(userAgent)) return true;
  return !/android/i.test(userAgent) && width < 600;
}
export function homeHeroIdentity(item: CatalogItemViewModel) {
  return { kind: item.kind, title: item.title, year: item.yearFormatted, tmdbId: item.externalIds?.tmdbId, posterPath: tmdbPosterPath(item.posterUri) };
}
export function currentYearHeroItems(model: CatalogReadModel, year: number): CatalogItemViewModel[] {
  const options: CatalogItemViewModel[] = [];
  for (const kind of ['movie', 'series'] as const) {
    let count = 0;
    for (const row of kind === 'movie' ? model.catalog.movies : model.catalog.series) {
      const identity = normalizeArtworkIdentity({ kind, title: row.title, year: row.year, tmdbId: row.externalIds?.tmdbId });
      if (Number(identity.year) !== year) continue;
      options.push(kind === 'movie' ? movieToViewModel(model, row as Movie) : seriesToViewModel(model, row as Series));
      if (++count === 5) break;
    }
  }
  return options;
}
/** Immediate mixed selection; missing years never make the Home disappear. */
export function initialHomeHeroItems(model: CatalogReadModel, year: number, perKind = 5): CatalogItemViewModel[] {
  const items: CatalogItemViewModel[] = [];
  for (const kind of ['movie', 'series'] as const) {
    const seen = new Set<string>();
    const rows = kind === 'movie' ? model.catalog.movies : model.catalog.series;
    const candidates = rows.slice(0, 100).map((row) => {
      const item = kind === 'movie' ? movieToViewModel(model, row as Movie) : seriesToViewModel(model, row as Series);
      const identity = normalizeArtworkIdentity(homeHeroIdentity(item));
      const releaseYear = Number(identity.year);
      const priority = releaseYear === year ? 3000 : releaseYear && releaseYear < year ? releaseYear
        : !releaseYear && item.categoryLabels.some(isReleaseCategory) ? 1000 : !releaseYear ? 0 : -1;
      return { key: artworkIdentityKey(identity), priority, rank: Math.random(), item: { ...item, yearFormatted: releaseYear ? String(releaseYear) : undefined } };
    }).sort((a, b) => b.priority - a.priority || a.rank - b.rank);
    let count = 0;
    for (const candidate of candidates) {
      if (seen.has(candidate.key)) continue;
      seen.add(candidate.key); items.push(candidate.item);
      if (++count === Math.min(25, Math.max(1, perKind))) break;
    }
  }
  for (let i = items.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [items[i], items[j]] = [items[j], items[i]]; }
  return items;
}
export function completeHomeHeroOptions(primary: HomeHeroOption[], fallback: HomeHeroOption[]): HomeHeroOption[] {
  if (!primary.length) return fallback;
  const options = [...primary];
  const seen = new Set(options.map(({ item }) => `${item.kind}:${item.id}`));
  for (const kind of ['movie', 'series'] as const) {
    let count = options.filter(({ item }) => item.kind === kind).length;
    for (const option of fallback) {
      const key = `${option.item.kind}:${option.item.id}`;
      if (count >= 5 || options.length >= 20) break;
      if (option.item.kind !== kind || seen.has(key)) continue;
      options.push(option); seen.add(key); count++;
    }
  }
  return options;
}
const cooperate = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

/** Scans private local metadata cooperatively. The full catalog is never retained in RAM. */
export class HomeHeroService {
  private scope = 'local-catalog';
  private snapshotId = '';
  private readonly repository: HomeHeroRepository;
  private readonly resolveMetadata: (item: CatalogItemViewModel) => Promise<ArtworkMetadata | null>;
  private readonly segmented: boolean;
  constructor(repository: HomeHeroRepository,
    resolveMetadata = (item: CatalogItemViewModel): Promise<ArtworkMetadata | null> => tmdbMetadataService.resolve(homeHeroIdentity(item)), segmented = true) {
    this.repository = repository; this.resolveMetadata = resolveMetadata; this.segmented = segmented;
  }

  async prepare(model: CatalogReadModel, storage: LocalCatalogStorage, year: number, signal: AbortSignal): Promise<void> {
    const snapshotId = model.catalog.metadata.snapshotId;
    const check = () => { if (signal.aborted) throw new Error('HERO_SCAN_CANCELLED'); };
    check();
    const manifest = await storage.readActiveManifest() as null | { snapshotId?: string; metadata?: { sourceId?: string }; segments?: { kind?: string; fileName?: string }[] };
    check();
    if (manifest?.snapshotId && manifest.snapshotId !== snapshotId) throw new Error('HERO_GENERATION_CHANGED');
    this.scope = manifest?.metadata?.sourceId || 'local-catalog'; this.snapshotId = snapshotId;
    const previous = await this.repository.generation(this.scope, year);
    if (previous?.snapshotId === snapshotId && previous.selectionVersion === 3) return;
    const qualified = { movie: new Set<string>(), series: new Set<string>() };
    const recent = { movie: new Map<string, HeroRecord>(), series: new Map<string, HeroRecord>() };
    const process = async (rows: (Movie | Series)[], kind: HeroRecord['kind'], probeUnknown = false) => {
      for (let start = 0; start < rows.length; start += 100) {
        check(); const batch = rows.slice(start, start + 100).filter((row) => row && typeof row.id === 'string' && typeof row.title === 'string' && Array.isArray(row.categoryIds) && Array.isArray(row.genreIds));
        const items = batch.map((row) => kind === 'movie' ? movieToViewModel(model, row as Movie) : seriesToViewModel(model, row as Series));
        const keys = items.map((item) => `${this.scope}:${year}:${artworkIdentityKey(homeHeroIdentity(item))}`);
        const existing = await this.repository.readMany(keys); check(); const writes = new Map<string, HeroRecord>();
        for (let i = 0; i < items.length; i++) {
          check(); const item = items[i], key = keys[i], old = writes.get(key) || existing.get(key);
          const identity = normalizeArtworkIdentity(homeHeroIdentity(item));
          if (!identity.title || /https?:\/\/|tvg-logo\s*=|group-title\s*=|[\r\n]/i.test(item.title)) continue;
          let releaseYear = Number(identity.year || old?.releaseYear || (old?.item && normalizeArtworkIdentity(homeHeroIdentity(old.item)).year));
          if (probeUnknown && (releaseYear || qualified[kind].size >= 5)) continue;
          const fresh = old?.snapshotId === snapshotId ? old.fresh : Boolean(previous && (!old || old.snapshotId !== previous.snapshotId || old.fresh));
          const release = item.categoryLabels.some(isReleaseCategory);
          if (!releaseYear && (((release || probeUnknown) && qualified[kind].size < 5) || (fresh && release))) {
            const metadata = await this.resolveMetadata(item); check(); releaseYear = metadata?.year || 0;
          }
          const currentYear = releaseYear === year;
          const eligible = currentYear || (fresh && release);
          if (currentYear && qualified[kind].size < 5) qualified[kind].add(key);
          const record: HeroRecord = { key, scope: this.scope, year, snapshotId, kind, fresh,
            rank: old?.snapshotId === snapshotId ? old.rank : Math.random(),
            releaseYear: releaseYear || undefined,
            bucket: currentYear ? 0 : 1,
            item: { ...item, title: item.title.slice(0, 200), yearFormatted: releaseYear ? String(releaseYear) : undefined, overviewSnippet: item.overviewSnippet?.slice(0, 1200) } };
          if (!eligible && (!releaseYear || releaseYear < year)) {
            recent[kind].set(key, { ...record, fresh: false, bucket: 2 });
            if (recent[kind].size > 50) {
              const sorted = [...recent[kind].values()].sort((a, b) => (b.releaseYear || 0) - (a.releaseYear || 0) || a.rank - b.rank);
              recent[kind].delete(sorted[sorted.length - 1].key);
            }
          }
          writes.set(key, eligible ? record : { ...record, item: undefined });
        }
        check(); await this.repository.writeMany([...writes.values()]); await cooperate();
      }
    };
    for (const kind of ['movie', 'series'] as const) {
      const entries = this.segmented ? (manifest?.segments || []).filter((entry) => entry.kind === (kind === 'movie' ? 'movies' : 'series') && entry.fileName) : [];
      if (!entries.length) {
        const rows = kind === 'movie' ? model.catalog.movies : model.catalog.series;
        await process(this.segmented ? rows : rows.slice(0, 100), kind);
      }
      for (const entry of entries) {
        check(); const pointer = await storage.readActivePointer(); check();
        if (pointer && pointer.snapshotId !== snapshotId) throw new Error('HERO_GENERATION_CHANGED');
        const raw = await storage.readActiveSegment?.(resolveSegmentRelativePath(entry.fileName!)); check();
        if (!raw) throw new Error('HERO_SEGMENT_UNAVAILABLE');
        const rows: unknown = JSON.parse(raw); if (!Array.isArray(rows)) throw new Error('HERO_SEGMENT_INVALID');
        await process(rows as (Movie | Series)[], kind);
      }
      // Unknown years outside Lançamentos cannot delay current releases. Probe
      // them only when the local years/release metadata still leave a quota short.
      if (qualified[kind].size < 5) {
        if (!entries.length) {
          const rows = kind === 'movie' ? model.catalog.movies : model.catalog.series;
          await process(this.segmented ? rows : rows.slice(0, 100), kind, true);
        }
        for (const entry of entries) {
          if (qualified[kind].size >= 5) break;
          check(); const pointer = await storage.readActivePointer(); check();
          if (pointer && pointer.snapshotId !== snapshotId) throw new Error('HERO_GENERATION_CHANGED');
          const raw = await storage.readActiveSegment?.(resolveSegmentRelativePath(entry.fileName!)); check();
          if (!raw) throw new Error('HERO_SEGMENT_UNAVAILABLE');
          const rows: unknown = JSON.parse(raw); if (!Array.isArray(rows)) throw new Error('HERO_SEGMENT_INVALID');
          await process(rows as (Movie | Series)[], kind, true);
        }
      }
    }
    check(); const pointer = await storage.readActivePointer(); check();
    if (pointer && pointer.snapshotId !== snapshotId) throw new Error('HERO_GENERATION_CHANGED');
    await this.repository.writeMany([...recent.movie.values(), ...recent.series.values()]); check();
    await this.repository.commit(this.scope, year, snapshotId);
  }
  async options(year: number, exclude: ReadonlySet<string> = new Set(), contentKind?: 'movie' | 'series'): Promise<HomeHeroOption[]> {
    const kinds = contentKind ? [contentKind] : ['movie', 'series'] as const;
    const groups = await Promise.all(kinds.map(async (kind) => {
      const current = await this.repository.pick(this.scope, year, this.snapshotId, kind, 5, exclude, 0);
      const [latest, releases] = await Promise.all([
        current.length < 5 ? this.repository.pick(this.scope, year, this.snapshotId, kind, 5 - current.length, exclude, 2) : [],
        this.repository.pick(this.scope, year, this.snapshotId, kind, 5, exclude, 1),
      ]);
      return [...current, ...latest, ...releases];
    }));
    const values = groups.flat().map((record) => ({ key: record.key, item: record.item!, fresh: record.fresh }));
    for (let i = values.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [values[i], values[j]] = [values[j], values[i]]; }
    return values.sort((a, b) => Number(b.fresh) - Number(a.fresh));
  }
  displayed(option: HomeHeroOption): Promise<void> { return this.repository.displayed(option.key, this.snapshotId); }
}

let repository: HomeHeroRepository | undefined;
export function createHomeHeroService(): HomeHeroService {
  const supported = typeof indexedDB !== 'undefined';
  repository ||= supported ? new IndexedDbHomeHeroRepository() : new MemoryHomeHeroRepository();
  return new HomeHeroService(repository, undefined, supported);
}
