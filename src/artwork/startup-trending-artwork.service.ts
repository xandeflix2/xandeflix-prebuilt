/// <reference types="vite/client" />
import type { StartupPoster } from './startup-catalog-preview.ts';

export const STARTUP_TRENDS_CACHE_KEY = 'xandeflix:public-startup-trends:v1';
const FRESH_MS = 6 * 60 * 60 * 1000, MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const EMPTY: readonly StartupPoster[] = [];
interface Candidate { id: number; title: string; poster_path: string; backdrop_path: string; }
interface Options {
  credential: () => string;
  fetchImpl?: typeof fetch;
  storage?: Pick<Storage, 'getItem' | 'setItem'>;
  now?: () => number;
  random?: () => number;
  timeoutMs?: number;
}
const object = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const imagePath = (value: unknown): value is string => typeof value === 'string' && /^\/[A-Za-z0-9_-]{1,100}\.(?:jpg|jpeg|png|webp)$/i.test(value);
function candidates(raw: unknown): Candidate[] {
  const items: Candidate[] = [], ids = new Set<number>(), posters = new Set<string>();
  for (const value of (Array.isArray(raw) ? raw : []).slice(0, 20)) {
    const row = object(value);
    if (!Number.isSafeInteger(row.id) || Number(row.id) <= 0 || row.adult === true || typeof row.title !== 'string'
      || !row.title.trim() || !imagePath(row.poster_path) || !imagePath(row.backdrop_path)
      || ids.has(Number(row.id)) || posters.has(row.poster_path)) continue;
    const title = row.title.replace(/[\p{Cc}]/gu, ' ').trim().slice(0, 180);
    if (!title || /https?:\/\//i.test(title)) continue;
    ids.add(Number(row.id)); posters.add(row.poster_path);
    items.push({ id: Number(row.id), title, poster_path: row.poster_path, backdrop_path: row.backdrop_path });
  }
  return items;
}

/** Decorative public metadata only; never reads a source, catalog or identity. */
export class StartupTrendingArtworkService {
  private listeners = new Set<() => void>();
  private snapshot = EMPTY;
  private pool: Candidate[] = [];
  private updatedAt = 0;
  private cacheRead = false;
  private retryAfter = 0;
  private request?: { controller: AbortController };
  private stopTimer?: ReturnType<typeof setTimeout>;
  private options: Options;

  constructor(options: Options) { this.options = options; }
  private now() { return this.options.now?.() ?? Date.now(); }
  private storage() { return this.options.storage ?? (typeof localStorage === 'undefined' ? undefined : localStorage); }
  readonly getSnapshot = (): readonly StartupPoster[] => this.snapshot;
  readonly getServerSnapshot = (): readonly StartupPoster[] => EMPTY;
  readonly subscribe = (listener: () => void): (() => void) => {
    clearTimeout(this.stopTimer);
    this.listeners.add(listener);
    if (!this.cacheRead) this.readCache();
    if (this.pool.length && this.now() - this.updatedAt > MAX_AGE_MS) { this.pool = []; this.publish(); }
    if ((!this.pool.length || this.now() - this.updatedAt >= FRESH_MS) && this.now() >= this.retryAfter
      && (!this.request || this.request.controller.signal.aborted)) this.refresh();
    return () => {
      this.listeners.delete(listener);
      // A same-turn React remount can retain the single request.
      if (!this.listeners.size) this.stopTimer = setTimeout(() => {
        if (!this.listeners.size) this.request?.controller.abort();
      }, 0);
    };
  };
  private readCache() {
    this.cacheRead = true;
    try {
      const raw = this.storage()?.getItem(STARTUP_TRENDS_CACHE_KEY);
      if (!raw || raw.length > 16000) return;
      const cached = object(JSON.parse(raw)), age = this.now() - Number(cached.updatedAt);
      if (cached.version !== 1 || typeof cached.updatedAt !== 'number' || !Number.isFinite(age) || age < 0 || age > MAX_AGE_MS) return;
      this.pool = candidates(cached.items); this.updatedAt = cached.updatedAt;
      if (this.pool.length) this.publish();
    } catch { /* Optional cache: private mode, corruption and quota do not affect boot. */ }
  }
  private publish() {
    const shuffled = [...this.pool];
    for (let n = shuffled.length - 1; n > 0; n--) {
      const index = Math.floor((this.options.random?.() ?? Math.random()) * (n + 1));
      [shuffled[n], shuffled[index]] = [shuffled[index], shuffled[n]];
    }
    this.snapshot = shuffled.length ? shuffled.slice(0, 6).map(row => ({
      id: 'tmdb-trending:movie:' + row.id, title: row.title, category: 'Em alta no TMDB',
      uri: 'https://image.tmdb.org/t/p/w342' + row.poster_path,
      backdropUri: 'https://image.tmdb.org/t/p/w780' + row.backdrop_path,
    })) : EMPTY;
    for (const listener of this.listeners) { try { listener(); } catch { /* Optional observer. */ } }
  }
  private refresh() {
    const credential = this.options.credential().trim();
    if (!credential) return;
    const controller = new AbortController(), request = { controller };
    this.request = request;
    const url = new URL('https://api.themoviedb.org/3/trending/movie/day');
    url.searchParams.set('language', 'pt-BR');
    const headers: Record<string, string> = { accept: 'application/json' };
    if (/^[a-fA-F0-9]{32}$/.test(credential)) url.searchParams.set('api_key', credential);
    else headers.Authorization = 'Bearer ' + credential;
    let timer: ReturnType<typeof setTimeout> | undefined, timedOut = false;
    void (async () => {
      try {
        const result = await Promise.race([
          (async () => {
            const response = await (this.options.fetchImpl ?? fetch)(url.href, { headers, signal: controller.signal, referrerPolicy: 'no-referrer' });
            if (controller.signal.aborted || this.request !== request) throw Error('TRENDS_CANCELLED');
            if (!response.ok) {
              this.retryAfter = this.now() + ([401, 403].includes(response.status) ? 900000 : 60000);
              throw Error('TRENDS_UNAVAILABLE');
            }
            return object(await response.json());
          })(),
          new Promise<never>((_, reject) => { timer = setTimeout(() => {
            timedOut = true; controller.abort(); reject(Error('TRENDS_TIMEOUT'));
          }, this.options.timeoutMs ?? 4000); }),
        ]);
        if (controller.signal.aborted || this.request !== request) return;
        const next = candidates(result.results);
        if (!next.length) throw Error('TRENDS_EMPTY');
        this.pool = next; this.updatedAt = this.now(); this.publish();
        try { this.storage()?.setItem(STARTUP_TRENDS_CACHE_KEY, JSON.stringify({ version: 1, updatedAt: this.updatedAt, items: next })); }
        catch { /* RAM-only fallback; never block the Home on storage. */ }
      } catch {
        if (this.request === request && (timedOut || !controller.signal.aborted)) this.retryAfter = Math.max(this.retryAfter, this.now() + 60000);
      } finally {
        clearTimeout(timer);
        if (this.request === request) this.request = undefined;
      }
    })();
  }
}

export const startupTrendingArtworkService = new StartupTrendingArtworkService({
  credential: () => String(import.meta.env?.VITE_TMDB_API_KEY || import.meta.env?.VITE_TMDB_READ_ACCESS_TOKEN || ''),
});
