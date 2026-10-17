import { normalizeArtworkIdentity, selectTmdbMatch, type ArtworkIdentity } from './tmdb-metadata.service.ts';

type Json = Record<string, unknown>;
const object = (v: unknown): Json => v && typeof v === 'object' ? v as Json : {};
const key = (v: string) => normalizeArtworkIdentity({ kind: 'movie', title: v }).title
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
export interface SimilarMetadata {
  id: number; title: string; original_title: string; release_date: string;
  name: string; original_name: string; first_air_date: string; poster_path?: string;
  genres: string[];
}

/** Public metadata only. No local catalog/source is passed to this service. */
export class TmdbSimilarService {
  private readonly options: { credential: () => string; fetchImpl?: typeof fetch; now?: () => number };
  private cache = new Map<string, { expires: number; rows: SimilarMetadata[] }>();
  private pending = new Map<string, Promise<SimilarMetadata[]>>();
  private genreLists = new Map<string, Map<number, string>>();
  private tail: Promise<unknown> = Promise.resolve();
  private pausedUntil = 0;
  constructor(options: { credential: () => string; fetchImpl?: typeof fetch; now?: () => number }) { this.options = options; }
  private now() { return this.options.now?.() ?? Date.now(); }

  resolve(kind: ArtworkIdentity['kind'], id: number): Promise<SimilarMetadata[]> {
    if (!Number.isSafeInteger(id) || id <= 0) return Promise.resolve([]);
    const identity = `${kind}:${id}`, cached = this.cache.get(identity);
    if (cached && cached.expires > this.now()) return Promise.resolve(cached.rows);
    const pending = this.pending.get(identity);
    if (pending) return pending;
    if (!this.options.credential().trim() || this.now() < this.pausedUntil || this.pending.size >= 8) return Promise.resolve([]);
    const job = this.tail.then(async () => {
      try {
        const type = kind === 'movie' ? 'movie' : 'tv';
        let genres = this.genreLists.get(type);
        if (!genres) {
          const list = await this.request(`genre/${type}/list`);
          genres = new Map((Array.isArray(list.genres) ? list.genres : []).slice(0, 100)
            .map(object).filter(g => Number.isSafeInteger(g.id) && typeof g.name === 'string')
            .map(g => [Number(g.id), String(g.name).slice(0, 80)]));
          this.genreLists.set(type, genres);
        }
        const rows: SimilarMetadata[] = [];
        for (let page = 1; page <= 3; page++) {
          const result = await this.request(`${type}/${id}/similar`, page);
          const values = Array.isArray(result.results) ? result.results.slice(0, 20) : [];
          for (const raw of values) {
            const v = object(raw);
            if (!Number.isSafeInteger(v.id) || Number(v.id) <= 0 || v.adult === true) continue;
            const text = (field: string) => typeof v[field] === 'string' ? String(v[field]).slice(0, 200) : '';
            rows.push({ id: Number(v.id), title: text('title'), original_title: text('original_title'),
              release_date: text('release_date'), name: text('name'), original_name: text('original_name'),
              first_air_date: text('first_air_date'), poster_path: /^\/[\w.-]+$/.test(text('poster_path')) ? text('poster_path') : undefined,
              genres: Array.isArray(v.genre_ids) ? v.genre_ids.slice(0, 10).flatMap(id => genres!.has(Number(id)) ? [genres!.get(Number(id))!] : []) : [] });
          }
          if (values.length < 20 || page >= Number(result.total_pages || 1)) break;
        }
        this.cache.delete(identity); this.cache.set(identity, { expires: this.now() + (rows.length ? 1800000 : 180000), rows });
        while (this.cache.size > 64) this.cache.delete(this.cache.keys().next().value!);
        return rows;
      } catch { return []; }
      finally { this.pending.delete(identity); }
    });
    this.pending.set(identity, job); this.tail = job;
    return job;
  }

  private async request(path: string, page?: number): Promise<Json> {
    if (this.now() < this.pausedUntil) throw new Error('TMDB_SIMILAR_COOLDOWN');
    const url = new URL(`https://api.themoviedb.org/3/${path}`);
    url.searchParams.set('language', 'pt-BR'); if (page) url.searchParams.set('page', String(page));
    const credential = this.options.credential().trim(), headers: Record<string, string> = { accept: 'application/json' };
    if (/^[a-f\d]{32}$/i.test(credential)) url.searchParams.set('api_key', credential);
    else headers.Authorization = `Bearer ${credential}`;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([(async () => {
        const response = await (this.options.fetchImpl ?? fetch)(url.href, { headers, signal: controller.signal, referrerPolicy: 'no-referrer' });
        if (!response.ok) { this.pausedUntil = this.now() + (response.status === 401 || response.status === 403 ? 900000 : 30000); throw new Error('TMDB_SIMILAR_FAILED'); }
        return object(await response.json());
      })(), new Promise<never>((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new Error('TMDB_SIMILAR_TIMEOUT')); }, 6000); })]);
    } catch { this.pausedUntil = Math.max(this.pausedUntil, this.now() + 5000); throw new Error('TMDB_SIMILAR_UNAVAILABLE'); }
    finally { if (timer) clearTimeout(timer); }
  }
}

/** Index public candidates once; strong identity matching remains local. */
export function similarGenreLookup(rows: readonly SimilarMetadata[]) {
  const ids = new Map(rows.map(row => [row.id, row])), names = new Map<string, SimilarMetadata[]>();
  for (const row of rows) for (const title of new Set([row.title, row.original_title, row.name, row.original_name].filter(Boolean))) {
    const normalized = key(title); names.set(normalized, [...(names.get(normalized) || []), row]);
  }
  return (identity: ArtworkIdentity): string[] => {
    if (identity.tmdbId) return ids.get(Number(identity.tmdbId))?.genres || [];
    const candidates = [...new Set(names.get(key(identity.title)) || [])];
    const match = selectTmdbMatch(identity, candidates as unknown as Json[]);
    return match ? ids.get(Number(match.id))?.genres || [] : [];
  };
}

export const tmdbSimilarService = new TmdbSimilarService({
  credential: () => String(import.meta.env?.VITE_TMDB_API_KEY || import.meta.env?.VITE_TMDB_READ_ACCESS_TOKEN || ''),
});
