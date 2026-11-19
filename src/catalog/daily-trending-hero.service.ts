import type { LocalCatalogStorage } from '../bootstrap/storage/storage.interface.ts';
import { resolveSegmentRelativePath } from '../bootstrap/storage/segment-path-resolver.ts';
import type { Movie, Series } from '../contracts/catalog.ts';
import { normalizeArtworkIdentity } from '../artwork/tmdb-metadata.service.ts';
import { movieToViewModel, seriesToViewModel } from './catalog-selectors.ts';
import type { CatalogReadModel } from './catalog-read-model.ts';
import type { HomeHeroOption } from './home-hero.service.ts';

export type DailyTrendingKind = 'all' | 'movie' | 'series';
export type HeroRankingStage = 'day' | 'week' | '2026' | '2025';

interface Trend {
  id: number;
  kind: 'movie' | 'series';
  titles: string[];
  year?: number;
  popularity?: number;
}

interface Options {
  credential: () => string;
  fetchImpl?: typeof fetch;
  now?: () => number;
  maxPages?: number;
  timeoutMs?: number;
}

const record = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value)
  ? value as Record<string, unknown> : {};
const positiveId = (value: unknown): number | undefined => {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : undefined;
};
const yearOf = (value: unknown): number | undefined => {
  const match = typeof value === 'string' && value.match(/^(\d{4})-\d{2}-\d{2}$/);
  const year = match ? Number(match[1]) : undefined;
  return year && year >= 1880 && year <= 2100 ? year : undefined;
};
const titleKey = (value: unknown): string => typeof value === 'string'
  ? value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('en-US')
    .replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ').slice(0, 200)
  : '';
const trendKey = (trend: Trend): string => `${trend.kind}:${trend.id}`;

/** Public daily ranking intersected with the current private on-device catalog. */
export class DailyTrendingHeroService {
  private readonly cache = new Map<string, { hour: number; trends: Trend[] }>();
  private readonly selectionCache = new WeakMap<CatalogReadModel, { storage: LocalCatalogStorage; values: Map<string, HomeHeroOption[]> }>();
  private readonly options: Options;
  constructor(options: Options) { this.options = options; }

  private async page(kind: DailyTrendingKind, number: number, credential: string, signal: AbortSignal, stage: HeroRankingStage): Promise<Record<string, unknown>> {
    const mode = kind === 'series' ? 'tv' : kind;
    const byYear = stage === '2026' || stage === '2025';
    if (byYear && mode === 'all') throw Error('TRENDS_KIND_INVALID');
    const url = new URL(byYear ? `https://api.themoviedb.org/3/discover/${mode}`
      : `https://api.themoviedb.org/3/trending/${mode}/${stage}`);
    url.searchParams.set('language', 'pt-BR');
    url.searchParams.set('page', String(number));
    if (byYear) {
      url.searchParams.set(mode === 'movie' ? 'primary_release_year' : 'first_air_date_year', stage);
      url.searchParams.set('sort_by', 'popularity.desc');
      url.searchParams.set('include_adult', 'false');
    }
    const headers: Record<string, string> = { accept: 'application/json' };
    if (/^[a-fA-F0-9]{32}$/.test(credential)) url.searchParams.set('api_key', credential);
    else headers.Authorization = `Bearer ${credential}`;
    const controller = new AbortController();
    const abort = () => controller.abort();
    signal.addEventListener('abort', abort, { once: true });
    const timer = setTimeout(abort, this.options.timeoutMs ?? 5000);
    try {
      if (signal.aborted) throw Error('TRENDS_CANCELLED');
      const response = await (this.options.fetchImpl ?? fetch)(url.href, { headers, signal: controller.signal, referrerPolicy: 'no-referrer' });
      if (!response.ok) throw Error('TRENDS_UNAVAILABLE');
      const body = record(await response.json());
      if (controller.signal.aborted || signal.aborted) throw Error('TRENDS_CANCELLED');
      return body;
    } finally {
      clearTimeout(timer);
      signal.removeEventListener('abort', abort);
    }
  }

  async ranked(kind: DailyTrendingKind, signal: AbortSignal, stage: HeroRankingStage = 'day'): Promise<Trend[]> {
    if (signal.aborted) throw Error('TRENDS_CANCELLED');
    const credential = this.options.credential().trim();
    if (!credential) return [];
    const hour = Math.floor((this.options.now?.() ?? Date.now()) / 3600000);
    const cacheKey = `${kind}:${stage}`;
    const cached = this.cache.get(cacheKey);
    if (cached?.hour === hour) return cached.trends;
    if (kind === 'all' && (stage === '2026' || stage === '2025')) {
      const [movies, series] = await Promise.all([
        this.ranked('movie', signal, stage), this.ranked('series', signal, stage),
      ]);
      const combined = [...movies, ...series].sort((a, b) => (b.popularity || 0) - (a.popularity || 0)
        || a.kind.localeCompare(b.kind) || a.id - b.id);
      if (signal.aborted) throw Error('TRENDS_CANCELLED');
      this.cache.set(cacheKey, { hour, trends: combined });
      return combined;
    }
    const maxPages = Math.min(stage === 'day' ? 5 : stage === 'week' ? 3 : 2,
      Math.max(1, Math.floor(this.options.maxPages ?? 5)));
    const trends: Trend[] = [], seen = new Set<string>();
    let pages = 1;
    for (let page = 1; page <= Math.min(pages, maxPages); page++) {
      if (signal.aborted) throw Error('TRENDS_CANCELLED');
      const body = await this.page(kind, page, credential, signal, stage);
      if (page === 1) pages = Math.min(maxPages, Math.max(1, Number(body.total_pages) || 1));
      for (const raw of (Array.isArray(body.results) ? body.results : []).slice(0, 20)) {
        const row = record(raw), id = positiveId(row.id);
        const type = kind === 'all' ? row.media_type : kind === 'series' ? 'tv' : 'movie';
        const contentKind = type === 'movie' ? 'movie' : type === 'tv' ? 'series' : undefined;
        if (!id || !contentKind || row.adult === true) continue;
        const titles = [...new Set([titleKey(row.title ?? row.name), titleKey(row.original_title ?? row.original_name)].filter(Boolean))];
        if (!titles.length) continue;
        const year = yearOf(row.release_date ?? row.first_air_date);
        if ((stage === '2026' || stage === '2025') && year !== Number(stage)) continue;
        const entry: Trend = { id, kind: contentKind, titles, year,
          popularity: typeof row.popularity === 'number' && Number.isFinite(row.popularity) ? row.popularity : undefined };
        const key = trendKey(entry);
        if (seen.has(key)) continue;
        seen.add(key); trends.push(entry);
      }
    }
    if (signal.aborted) throw Error('TRENDS_CANCELLED');
    this.cache.set(cacheKey, { hour, trends });
    return trends;
  }

  async available(model: CatalogReadModel, storage: LocalCatalogStorage, kind: DailyTrendingKind, signal: AbortSignal,
    stage: HeroRankingStage = 'day'): Promise<HomeHeroOption[]> {
    const trends = await this.ranked(kind, signal, stage);
    if (!trends.length || signal.aborted) return [];
    const snapshotId = model.catalog.metadata.snapshotId;
    const manifest = await storage.readActiveManifest() as null | { snapshotId?: string; metadata?: { sourceId?: string }; segments?: { kind?: string; fileName?: string }[] };
    if (signal.aborted) return [];
    if (manifest?.snapshotId && manifest.snapshotId !== snapshotId) throw Error('TRENDS_GENERATION_CHANGED');
    const scope = manifest?.metadata?.sourceId;
    const pointerAtStart = await storage.readActivePointer();
    if (pointerAtStart?.snapshotId && pointerAtStart.snapshotId !== snapshotId) throw Error('TRENDS_GENERATION_CHANGED');
    const hour = Math.floor((this.options.now?.() ?? Date.now()) / 3600000);
    const selectionKey = `${kind}:${stage}:${hour}:${scope || ''}:${snapshotId}`;
    const saved = this.selectionCache.get(model);
    if (saved?.storage === storage && saved.values.has(selectionKey)) return saved.values.get(selectionKey)!;
    const byId = new Map(trends.map(entry => [trendKey(entry), entry]));
    const byTitle = new Map<string, Trend[]>();
    for (const entry of trends) for (const title of entry.titles) {
      const key = `${entry.kind}:${title}`;
      byTitle.set(key, [...(byTitle.get(key) || []), entry]);
    }
    const matches = new Map<string, { row: Movie | Series; strength: number; ambiguous: boolean }>();
    const offer = (row: Movie | Series, rowKind: 'movie' | 'series') => {
      if (!row || typeof row.id !== 'string' || typeof row.title !== 'string') return;
      if (!Array.isArray(row.categoryIds) || !Array.isArray(row.genreIds)) return;
      const explicit = positiveId(row.externalIds?.tmdbId);
      let match: Trend | undefined, strength = 0;
      if (explicit) { match = byId.get(`${rowKind}:${explicit}`); strength = 2; }
      else if (row.externalIds?.tmdbId === undefined) {
        const identity = normalizeArtworkIdentity({ kind: rowKind, title: row.title, year: row.year });
        const names = [identity.title, row.originalTitle].map(titleKey).filter(Boolean);
        const candidates = new Map<string, Trend>();
        for (const name of names) for (const candidate of byTitle.get(`${rowKind}:${name}`) || []) {
          if (identity.year && candidate.year && Number(identity.year) !== candidate.year) continue;
          candidates.set(trendKey(candidate), candidate);
        }
        if (candidates.size === 1) { match = candidates.values().next().value; strength = 1; }
      }
      if (!match) return;
      const key = trendKey(match), previous = matches.get(key);
      if (!previous || strength > previous.strength) matches.set(key, { row, strength, ambiguous: false });
      else if (strength === previous.strength && previous.row.id !== row.id) matches.set(key, { ...previous, ambiguous: true });
    };
    for (const row of model.catalog.movies) offer(row, 'movie');
    for (const row of model.catalog.series) offer(row, 'series');
    for (const entry of manifest?.segments || []) {
      if (signal.aborted) return [];
      if (entry.kind !== 'movies' && entry.kind !== 'series' || !entry.fileName) continue;
      if (kind === 'movie' && entry.kind !== 'movies' || kind === 'series' && entry.kind !== 'series') continue;
      const pointer = await storage.readActivePointer();
      if (pointer?.snapshotId && pointer.snapshotId !== snapshotId) throw Error('TRENDS_GENERATION_CHANGED');
      const raw = await storage.readActiveSegment?.(resolveSegmentRelativePath(entry.fileName));
      if (!raw) throw Error('TRENDS_SEGMENT_UNAVAILABLE');
      const rows: unknown = JSON.parse(raw);
      if (!Array.isArray(rows)) throw Error('TRENDS_SEGMENT_INVALID');
      for (const row of rows) offer(row as Movie | Series, entry.kind === 'movies' ? 'movie' : 'series');
      await new Promise<void>(resolve => setTimeout(resolve, 0));
    }
    const pointer = await storage.readActivePointer();
    const latest = await storage.readActiveManifest() as typeof manifest;
    if (signal.aborted) return [];
    if (pointer?.snapshotId && pointer.snapshotId !== snapshotId || latest?.snapshotId !== manifest?.snapshotId
      || latest?.metadata?.sourceId !== scope) throw Error('TRENDS_GENERATION_CHANGED');
    const result = trends.flatMap(entry => {
      const found = matches.get(trendKey(entry));
      if (!found || found.ambiguous) return [];
      const item = entry.kind === 'movie' ? movieToViewModel(model, found.row as Movie) : seriesToViewModel(model, found.row as Series);
      return [{ key: `${stage}:${snapshotId}:${trendKey(entry)}`, item, fresh: false }];
    });
    const values = saved?.storage === storage ? saved.values : new Map<string, HomeHeroOption[]>();
    values.set(selectionKey, result);
    while (values.size > 6) values.delete(values.keys().next().value!);
    this.selectionCache.set(model, { storage, values });
    return result;
  }

  async availableByPriority(model: CatalogReadModel, storage: LocalCatalogStorage, kind: DailyTrendingKind,
    signal: AbortSignal): Promise<HomeHeroOption[]> {
    for (const stage of ['day', 'week', '2026', '2025'] as HeroRankingStage[]) {
      if (signal.aborted) throw Error('TRENDS_CANCELLED');
      try {
        const options = await this.available(model, storage, kind, signal, stage);
        if (options.length) return options;
      } catch (error) {
        if (signal.aborted || error instanceof Error && error.message === 'TRENDS_GENERATION_CHANGED') throw error;
      }
    }
    return [];
  }
}

export const dailyTrendingHeroService = new DailyTrendingHeroService({
  credential: () => String(import.meta.env?.VITE_TMDB_API_KEY || import.meta.env?.VITE_TMDB_READ_ACCESS_TOKEN || ''),
});
