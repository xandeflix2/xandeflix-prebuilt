/// <reference types="vite/client" />
import { publicBackdropUri } from './detail-backdrop.ts';
/** Optional device-local enrichment. Does not access snapshots or the control plane. */
export interface ArtworkIdentity {
  kind: 'movie' | 'series';
  title: string;
  year?: number | string;
  tmdbId?: string | number;
  /** Public TMDB filename only; never an arbitrary source URL. */
  posterPath?: string;
  /** RAM-only source image reference; never sent to the metadata API. */
  sourcePosterUri?: string;
  /** Presentation-only evidence from explicit source categories. */
  originCountry?: string;
  network?: 'Netflix';
  /** Local catalog declares seasons; counts are not compared with TMDB edits. */
  hasEpisodes?: boolean;
}

export interface ArtworkMetadata {
  /** Unique public poster/full-title proof for a conflicting source year. */
  posterYearCorrection?: { sourceYear:number; posterPath:string };
  kind: ArtworkIdentity['kind'];
  tmdbId: number;
  /** Localized public title of the work confirmed by TMDB. */
  title?: string;
  posterUri?: string;
  backdropUri?: string;
  backdropUris?: string[];
  heroPosterUris?: string[];
  originalTitle?: string;
  overview?: string;
  year?: number;
  durationFormatted?: string;
  genres: string[];
}

type JsonObject = Record<string, unknown>;
type CacheEntry = { expires: number; value: ArtworkMetadata | null };
type CacheStorage = Pick<Storage, 'getItem' | 'setItem'>;
interface ServiceOptions {
  credential: () => string;
  fetchImpl?: typeof fetch;
  storage?: CacheStorage;
  now?: () => number;
  timeoutMs?: number;
  matchPoster?: (uri: string, candidates: JsonObject[]) => Promise<JsonObject | null>;
}
const CACHE_KEY = 'xandeflix:public-tmdb-metadata:v2';
const MAX_CACHE_ENTRIES = 512;
const SUCCESS_TTL = 30 * 24 * 60 * 60 * 1000;
const MISS_TTL = 24 * 60 * 60 * 1000;
const object = (value: unknown): JsonObject => value && typeof value === 'object' && !Array.isArray(value) ? value as JsonObject : {};
const text = (value: unknown, max = 1200): string | undefined => typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : undefined;
const titleKey = (value: string): string => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

/** Narrow public metadata hints, never a change to catalog type or access. */
export function artworkCategoryContext(labels: readonly string[] = [], hasEpisodes = false): Pick<ArtworkIdentity, 'originCountry' | 'network' | 'hasEpisodes'> {
  const keys = labels.slice(0, 16).map(label => titleKey(label.slice(0, 120)));
  const countries = new Set<string>();
  for (const [code, pattern] of [
    ['TR', /\b(?:turc[oa]s?|turquia|turkish)\b/], ['BR', /\b(?:brasileir[oa]s?|brazilian)\b/],
    ['KR', /\b(?:sul corean[oa]s?|corean[oa]s?|korean)\b/], ['JP', /\b(?:japones[ae]s?|japanese)\b/],
    ['CN', /\b(?:chines[ae]s?|chinese)\b/], ['TH', /\b(?:tailandes[ae]s?|thai)\b/],
  ] as const) if (keys.some(key => pattern.test(key))) countries.add(code);
  const originCountry = countries.size === 1 ? [...countries][0] : undefined;
  const network = keys.some(key => /^(?:(?:series|novelas) )?netflix$/.test(key)) ? 'Netflix' as const : undefined;
  return { ...(originCountry ? { originCountry } : {}), ...(network ? { network } : {}), ...(hasEpisodes ? { hasEpisodes: true } : {}) };
}

export function tmdbPosterPath(uri?: string): string | undefined {
  try {
    const url = new URL(uri || '');
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return undefined;
    if (url.hostname === 'image.tmdb.org') return url.pathname.match(/^\/t\/p\/[^/]+(\/[A-Za-z0-9_.-]+)$/)?.[1];
    // A rehosted filename is only a hint: lookup still confirms it in TMDB images.
    const file = url.pathname.split('/').at(-1) || '';
    return !url.search && /^[A-Za-z0-9]{27}\.(?:jpg|png|webp)$/.test(file)
      && !/^[a-fA-F0-9]+\./.test(file) ? '/' + file : undefined;
  } catch { return undefined; }
}

const RELEASE_TOKEN = String.raw`(?:4k|8k|uhd|fhd|hd|sd|2160p|1080[pi]|720p|576p|480p|dv|dolby[ ._-]*vision|hdr10\+?|hdr|hlg|h[.]?26[45]|x26[45]|hevc|avc|av1|(?:8|10|12)[ ._-]*bit|blu[ ._-]*ray|b[dr]rip|remux|web[ ._-]*dl|webrip|hdtv|dvd(?:rip)?|dublado|legendado|dual[ ._-]*audio|dolby[ ._-]*atmos|atmos|dts(?:[ ._-]*hd)?|eac3|ac3|aac|[257][.]1)`;
const RELEASE_GROUP = new RegExp(`^(?:${RELEASE_TOKEN})(?:[\\s,|/+_.-]+(?:${RELEASE_TOKEN}))*$`, 'i');
const RELEASE_SUFFIX = new RegExp(`^(.*\\S)[\\s|,;:_.-]+${RELEASE_TOKEN}\\s*$`, 'i');
const RELEASE_PREFIX = new RegExp(`^${RELEASE_TOKEN}\\s*[|:–—-]\\s*(.+)$`, 'i');
const validYear = (value: unknown): number | undefined => {
  const year = Number(value);
  return Number.isInteger(year) && year >= 1880 && year <= 2100 ? year : undefined;
};

/** Presentation/query only: strip recognized release labels, never source records. */
function releaseTitle(raw: string, suppliedYear: unknown): { title: string; year?: number } {
  const original = raw.slice(0, 200).normalize('NFKC').replace(/[\u200b-\u200d\ufeff]/g, '').replace(/\s+/g, ' ').trim();
  const grouped = original.replace(/\[([^\[\](){}]{1,120})\]|\(([^\[\](){}]{1,120})\)|\{([^\[\](){}]{1,120})\}/g,
    (whole, square, round, brace) => RELEASE_GROUP.test(String(square ?? round ?? brace).trim()) ? ' ' : whole);
  let title = grouped.trim() || original, year = validYear(suppliedYear), subtitled = false;
  for (let step = 0; step < 100; step++) {
    const previous = title;
    const subtitle = title.match(/\s+(?:\[L\]|\(L\))(?=\s*(?:\((?:18|19|20)\d{2}\)|(?:18|19|20)\d{2})?\s*$)/i);
    if (subtitle) { title = title.replace(subtitle[0], '').trim(); subtitled = true; }
    const wrappedYear = title.match(/^(.*\S)\s*(?:\(((?:18|19|20)\d{2})\)|\[((?:18|19|20)\d{2})\])$/);
    if (wrappedYear && validYear(wrappedYear[2] || wrappedYear[3])) {
      year ??= validYear(wrappedYear[2] || wrappedYear[3]); title = wrappedYear[1].trim();
    }
    const bareYear = title.match(/^(.*\S)\s+((?:18|19|20)\d{2})$/);
    // A bare number may be part of the film title (Blade Runner 2049).
    if (bareYear && (subtitled || year === Number(bareYear[2]) || /\s[|–—-]$/.test(bareYear[1]))) {
      year ??= validYear(bareYear[2]); title = bareYear[1].replace(/\s[|–—-]$/, '').trim();
    }
    const suffix = title.match(RELEASE_SUFFIX), prefix = title.match(RELEASE_PREFIX);
    if (suffix) title = suffix[1].replace(/[\s|,;:_.–—-]+$/, '').trim() || title;
    else if (prefix) title = prefix[1].trim();
    title = title.replace(/\s+/g, ' ').trim();
    if (title === previous) break;
  }
  return { title, year };
}

export function normalizeArtworkIdentity(identity: ArtworkIdentity): ArtworkIdentity {
  const cleaned = releaseTitle(identity.title, identity.year);
  return {
    kind: identity.kind,
    tmdbId: /^\d+$/.test(String(identity.tmdbId || '')) ? identity.tmdbId : undefined,
    year: cleaned.year,
    title: cleaned.title,
    posterPath: /^\/[A-Za-z0-9_.-]+$/.test(identity.posterPath || '') ? identity.posterPath : undefined,
    sourcePosterUri: sourcePosterUri(identity.sourcePosterUri),
    originCountry: identity.kind === 'series' && /^[A-Z]{2}$/.test(identity.originCountry || '') ? identity.originCountry : undefined,
    network: identity.kind === 'series' && identity.network === 'Netflix' ? 'Netflix' : undefined,
    hasEpisodes: identity.kind === 'series' && identity.hasEpisodes === true ? true : undefined,
  };
}

export function artworkIdentityKey(identity: ArtworkIdentity): string {
  const normalized = normalizeArtworkIdentity(identity);
  const localized = normalized.kind === 'series' && normalized.hasEpisodes && (normalized.originCountry || normalized.network)
    && normalized.year && normalized.posterPath && !normalized.tmdbId ? ':localizedSeries1' : '';
  const context = (normalized.originCountry ? ':country=' + normalized.originCountry : '')
    + (normalized.network ? ':network=netflix' : '') + (normalized.hasEpisodes ? ':episodic=1' : '');
  const posterRecovery=normalized.kind==='series'&&normalized.hasEpisodes&&normalized.year&&normalized.posterPath&&!normalized.tmdbId&&!normalized.originCountry&&!normalized.network?':posterYear1':'';
  return `${normalized.kind}:${normalized.tmdbId || titleKey(normalized.title)}:${normalized.year || ''}${!normalized.tmdbId ? ':match7' + context
    + (!normalized.originCountry && !normalized.network ? normalized.posterPath ? ':poster=' + normalized.posterPath : normalized.sourcePosterUri ? ':source=' + opaqueImageKey(normalized.sourcePosterUri) : '' : '') : ''}${localized}${posterRecovery}`;
}

function sourcePosterUri(value?: string): string | undefined {
  if (!value || value.length > 2048) return;
  try { const uri = new URL(value); return /^https?:$/.test(uri.protocol) && !uri.username && !uri.password ? uri.href : undefined; } catch { return; }
}
function opaqueImageKey(value: string): string {
  let a = 2166136261, b = 5381;
  for (let n = 0; n < value.length; n++) { a = Math.imul(a ^ value.charCodeAt(n), 16777619); b = Math.imul(b, 33) ^ value.charCodeAt(n); }
  return (a >>> 0).toString(16).padStart(8, '0') + (b >>> 0).toString(16).padStart(8, '0');
}

/** Reject remake/homonym ambiguity rather than attach the wrong artwork. */
function rankTmdbCandidates(identity: ArtworkIdentity, candidates: unknown[]) {
  const normalized = normalizeArtworkIdentity(identity);
  const wanted = titleKey(normalized.title);
  const ranked = candidates.map(object).filter((candidate) => Number.isSafeInteger(candidate.id) && Number(candidate.id) > 0
    && (!normalized.originCountry || (Array.isArray(candidate.origin_country) && candidate.origin_country.includes(normalized.originCountry))))
    .map((candidate) => {
      const names = normalized.kind === 'movie' ? [candidate.title, candidate.original_title] : [candidate.name, candidate.original_name];
      let score = 0;
      for (const name of names) {
        if (typeof name !== 'string') continue;
        const key = titleKey(name);
        const a = new Set(wanted.split(' '));
        const b = new Set(key.split(' '));
        const common = [...a].filter((word) => b.has(word)).length;
        const compact = wanted.replaceAll(' ', ''), candidateCompact = key.replaceAll(' ', '');
        const exact = wanted === key || (compact.length >= 8 && compact === candidateCompact);
        score = Math.max(score, exact ? 1 : 2 * common / (a.size + b.size));
      }
      const parts = normalized.title.split(/\s+[-–—]\s+/).map(titleKey);
      if (parts.length === 2 && parts.every(Boolean) && names.every(name => typeof name === 'string')
        && ((parts[0] === titleKey(String(names[0])) && parts[1] === titleKey(String(names[1])))
          || (parts[1] === titleKey(String(names[0])) && parts[0] === titleKey(String(names[1]))))) score = 1;
      const date = normalized.kind === 'movie' ? candidate.release_date : candidate.first_air_date;
      const year = typeof date === 'string' ? Number(date.slice(0, 4)) : 0;
      const titleScore = score;
      if (normalized.year && (!year || Math.abs(Number(normalized.year) - year) > 1)) score = 0;
      if (score > 0 && normalized.year && Number(normalized.year) === year) score += 0.12;
      return { candidate, score, titleScore };
    }).filter(({ score, titleScore }) => titleScore >= 0.88 && score >= 0.88).sort((a, b) => b.score - a.score);
  return ranked;
}

export function selectTmdbMatch(identity: ArtworkIdentity, candidates: unknown[]): JsonObject | null {
  const ranked = rankTmdbCandidates(identity, candidates);
  if (!ranked.length) return null;
  const path = normalizeArtworkIdentity(identity).posterPath;
  const posterMatches = path ? ranked.filter(({ candidate }) => candidate.poster_path === path) : [];
  if (posterMatches.length === 1) return posterMatches[0].candidate;
  if (path) return null;
  if (ranked[1] && ranked[0].candidate.id !== ranked[1].candidate.id && ranked[0].score - ranked[1].score < 0.08) {
    if (!path) {
      const exact = ranked.filter(v => v.titleScore === 1 && v.score === ranked[0].score);
      const established = exact.filter(v => Number(v.candidate.vote_count) >= 1000
        && ranked.every(other => other.candidate.id === v.candidate.id
          || Number(v.candidate.vote_count) >= 20 * Math.max(1, Number(other.candidate.vote_count) || 0)));
      if (established.length === 1) return established[0].candidate;
    }
    return null;
  }
  return ranked[0].candidate;
}

function imageUri(path: unknown, size: 'w342' | 'w780' | 'w1280'): string | undefined {
  return typeof path === 'string' && /^\/[a-zA-Z0-9_.-]+$/.test(path)
    ? `https://image.tmdb.org/t/p/${size}${path}` : undefined;
}

/** Keep a few distinct, genuinely vertical image variants; never crop a backdrop. */
export function tmdbHeroPosters(images: unknown): string[] {
  const posters = object(images).posters;
  if (!Array.isArray(posters)) return [];
  const ranked = posters.map(object).filter((p) => {
    const ratio = Number(p.aspect_ratio || Number(p.width) / Number(p.height));
    return ratio >= 0.5 && ratio <= 0.8 && Number(p.height) > Number(p.width)
      && Boolean(imageUri(p.file_path, 'w780'));
  }).sort((a, b) => {
    const score = (p: JsonObject) => (p.iso_639_1 === 'pt' ? 300 : p.iso_639_1 == null ? 200 : p.iso_639_1 === 'en' ? 100 : 0)
      + Math.min(Number(p.vote_average) || 0, 10);
    return score(b) - score(a);
  });
  return [...new Set(ranked.map((p) => imageUri(p.file_path, 'w780')!))].slice(0, 8);
}

const imagePath = (uri?: string): string => {
  try { return uri ? new URL(uri).pathname.split('/').at(-1) || '' : ''; } catch { return ''; }
};

export function chooseHeroPoster(metadata: ArtworkMetadata | null, categoryPoster?: string, failed: ReadonlySet<string> = new Set()): string | undefined {
  const categoryPath = imagePath(categoryPoster);
  const standardPath = imagePath(metadata?.posterUri);
  const posters = (metadata?.heroPosterUris || []).filter((uri) => !failed.has(uri));
  return posters.find((uri) => imagePath(uri) !== categoryPath && imagePath(uri) !== standardPath)
    || posters.find((uri) => imagePath(uri) !== categoryPath)
    || (metadata?.posterUri && !failed.has(metadata.posterUri) ? metadata.posterUri : undefined)
    || posters[0];
}

function toMetadata(identity: ArtworkIdentity, value: JsonObject): ArtworkMetadata {
  const date = identity.kind === 'movie' ? value.release_date : value.first_air_date;
  const year = typeof date === 'string' ? Number(date.slice(0, 4)) : 0;
  const minutes = Number(value.runtime);
  const alternatives = Array.isArray(object(value.images).backdrops) ? (object(value.images).backdrops as unknown[]).slice(0, 128).map(object)
    .filter(image => Number(image.width) >= 300 && Number(image.height) >= 150 && Number(image.width) / Number(image.height) >= 1.2
      && Number(image.width) / Number(image.height) <= 3 && publicBackdropUri(imageUri(image.file_path, 'w1280')))
    .sort((a, b) => {
      const score = (image: JsonObject) => (image.iso_639_1 == null ? 300 : image.iso_639_1 === 'pt' ? 200 : image.iso_639_1 === 'en' ? 100 : 0)
        + Math.min(Number(image.vote_average) || 0, 10);
      return score(b) - score(a);
    }).map(image => imageUri(image.file_path, 'w1280')!) : [];
  const backdropUris = [...new Set([publicBackdropUri(imageUri(value.backdrop_path, 'w1280')), ...alternatives]
    .filter((uri): uri is string => Boolean(uri)))].slice(0, 8);
  return {
    kind: identity.kind, tmdbId: Number(value.id),
    title: text(identity.kind === 'movie' ? value.title : value.name, 200),
    posterUri: imageUri(value.poster_path, 'w342'), backdropUri: backdropUris[0], backdropUris,
    heroPosterUris: tmdbHeroPosters(value.images),
    originalTitle: text(identity.kind === 'movie' ? value.original_title : value.original_name, 200),
    overview: text(value.overview), year: year >= 1880 && year <= 2100 ? year : undefined,
    durationFormatted: identity.kind === 'movie' && minutes > 0 && minutes < 1000
      ? `${Math.floor(minutes / 60)}h ${minutes % 60}min` : undefined,
    genres: Array.isArray(value.genres) ? value.genres.slice(0, 10).map((genre) => text(object(genre).name, 80)).filter((genre): genre is string => Boolean(genre)) : [],
  };
}

export class TmdbMetadataService {
  private readonly options: ServiceOptions;
  private cache = new Map<string, CacheEntry>();
  private pending = new Map<string, Promise<ArtworkMetadata | null>>();
  private queue: Array<{ key: string; run: () => void }> = [];
  private active = 0;
  private pausedUntil = 0;
  private persistTimer: ReturnType<typeof setTimeout> | undefined;
  private storage?: CacheStorage;

  constructor(options: ServiceOptions) {
    this.options = options;
    try { this.storage = options.storage ?? (typeof localStorage === 'undefined' ? undefined : localStorage); } catch { /* private browsing */ }
    try {
      const raw = this.storage?.getItem(CACHE_KEY);
      if (raw && raw.length < 2500000) {
        const persisted = object(JSON.parse(raw));
        if (persisted.version === 2 && Array.isArray(persisted.entries)) {
          for (const entry of persisted.entries.slice(-MAX_CACHE_ENTRIES)) {
            if (!Array.isArray(entry) || typeof entry[0] !== 'string') continue;
            const stored = object(entry[1]);
            const value = object(stored.value);
            if (!Number.isFinite(stored.expires) || Number(stored.expires) <= this.now() || Number(stored.expires) > this.now() + SUCCESS_TTL) continue;
            if (stored.value === null) this.cache.set(entry[0], { expires: Number(stored.expires), value: null });
            else if ((value.kind === 'movie' || value.kind === 'series') && Number.isSafeInteger(value.tmdbId)) {
              // Reconstruct an allowlisted object: no arbitrary fields/URLs from local storage.
              this.cache.set(entry[0], { expires: Number(stored.expires), value: {
                kind: value.kind, tmdbId: Number(value.tmdbId),
                posterUri: this.cachedImage(value.posterUri), backdropUri: this.cachedImage(value.backdropUri),
                ...(Array.isArray(value.backdropUris) ? { backdropUris: value.backdropUris.slice(0, 8)
                  .map(uri => publicBackdropUri(this.cachedImage(uri))).filter((uri): uri is string => Boolean(uri)) } : {}),
                heroPosterUris: Array.isArray(value.heroPosterUris) ? value.heroPosterUris.slice(0, 8)
                  .map((uri) => this.cachedImage(uri)).filter((uri): uri is string => Boolean(uri)) : [],
                title: text(value.title, 200), originalTitle: text(value.originalTitle, 200), overview: text(value.overview),
                year: typeof value.year === 'number' ? value.year : undefined,
                durationFormatted: text(value.durationFormatted, 40),
                ...(validYear(object(value.posterYearCorrection).sourceYear)&&/^\/[A-Za-z0-9_.-]+$/.test(String(object(value.posterYearCorrection).posterPath||''))?{posterYearCorrection:{sourceYear:Number(object(value.posterYearCorrection).sourceYear),posterPath:String(object(value.posterYearCorrection).posterPath)}}:{}),
                genres: Array.isArray(value.genres) ? value.genres.slice(0, 10).map((genre) => text(genre, 80)).filter((genre): genre is string => Boolean(genre)) : [],
              } });
            }
          }
        }
      }
    } catch { /* Cache loss is never a catalog failure. */ }
  }

  private cachedImage(value: unknown): string | undefined {
    return typeof value === 'string' && /^https:\/\/image\.tmdb\.org\/t\/p\/(?:w342|w780|w1280)\/[A-Za-z0-9_.-]+$/.test(value) ? value : undefined;
  }

  private now(): number { return this.options.now?.() ?? Date.now(); }

  peek(identity: ArtworkIdentity): ArtworkMetadata | null {
    const key = artworkIdentityKey(identity), entry = this.cache.get(key);
    if (entry && entry.expires > this.now()) return entry.value?.kind === identity.kind ? entry.value : null;
    return this.legacyPositive(identity, key);
  }

  private legacyPositive(identity: ArtworkIdentity, key: string): ArtworkMetadata | null {
    const normalized = normalizeArtworkIdentity(identity);
    if (!normalized.tmdbId && (normalized.originCountry || normalized.network || normalized.hasEpisodes)) return null;
    if (normalized.sourcePosterUri && !normalized.posterPath && !normalized.tmdbId) return null;
    const keys = [6, 5, 4, 3].map(version => key.replace(':match7', ':match' + version));
    if (!normalized.posterPath) keys.push(key.replace(':match7', ''));
    for (const previous of keys) {
      const entry = this.cache.get(previous);
      if (entry?.value?.kind === identity.kind && entry.expires > this.now()) return entry.value;
    }
    return null;
  }

  resolve(identity: ArtworkIdentity, priority: 'high' | 'normal' = 'normal'): Promise<ArtworkMetadata | null> {
    return this.resolvePurpose(identity, priority, false);
  }

  peekBackdrop(identity: ArtworkIdentity): ArtworkMetadata | null {
    const normal = this.peek(identity);
    if (normal && Array.isArray(normal.backdropUris)) return normal;
    const entry = this.cache.get(artworkIdentityKey(identity) + ':backdrops1');
    return entry && entry.expires > this.now() && entry.value?.kind === identity.kind ? entry.value : null;
  }

  resolveBackdrop(identity: ArtworkIdentity, priority: 'high' | 'normal' = 'normal'): Promise<ArtworkMetadata | null> {
    const normal = this.peek(identity);
    return normal && Array.isArray(normal.backdropUris) ? Promise.resolve(normal) : this.resolvePurpose(identity, priority, true);
  }

  private resolvePurpose(identity: ArtworkIdentity, priority: 'high' | 'normal', backdrop: boolean): Promise<ArtworkMetadata | null> {
    const key = artworkIdentityKey(identity) + (backdrop ? ':backdrops1' : '');
    const cached = this.cache.get(key);
    if (cached && cached.expires > this.now() && (!cached.value || cached.value.kind === identity.kind)) return Promise.resolve(cached.value);
    const legacy = backdrop ? null : this.legacyPositive(identity, key);
    if (legacy) return Promise.resolve(legacy);
    const pending = this.pending.get(key);
    if (pending) {
      if (priority === 'high') {
        const index = this.queue.findIndex((job) => job.key === key);
        if (index > 0) this.queue.unshift(this.queue.splice(index, 1)[0]);
      }
      return pending;
    }
    if (!this.options.credential().trim() || this.now() < this.pausedUntil || this.queue.length >= 128) return Promise.resolve(null);
    let finish!: (value: ArtworkMetadata | null) => void;
    const promise = new Promise<ArtworkMetadata | null>((resolve) => { finish = resolve; });
    this.pending.set(key, promise);
    const job = { key, run: () => {
      this.active++;
      void (async () => {
        let value: ArtworkMetadata | null = null;
        try {
          value = await this.lookup(identity);
          this.cache.delete(key);
          this.cache.set(key, { value, expires: this.now() + (value ? SUCCESS_TTL : MISS_TTL) });
          while (this.cache.size > MAX_CACHE_ENTRIES) this.cache.delete(this.cache.keys().next().value!);
          this.schedulePersist();
        } catch { /* Transient failures are not negative cache entries. */ }
        finally { this.pending.delete(key); this.active--; this.drain(); }
        finish(value);
      })();
    } };
    if (priority === 'high') this.queue.unshift(job); else this.queue.push(job);
    this.drain();
    return promise;
  }

  private drain(): void { while (this.active < 2 && this.queue.length) this.queue.shift()!.run(); }

  private schedulePersist(): void {
    if (this.persistTimer || !this.storage) return;
    this.persistTimer = setTimeout(() => {
      this.persistTimer = undefined;
      try { this.storage?.setItem(CACHE_KEY, JSON.stringify({ version: 2, entries: [...this.cache] })); } catch { /* quota/unavailable */ }
    }, 250);
  }

  private async request(path: string, params: Record<string, string> = {}): Promise<JsonObject> {
    if (this.now() < this.pausedUntil) throw new Error('TMDB_COOLDOWN');
    const url = new URL(`https://api.themoviedb.org/3/${path}`);
    url.searchParams.set('language', 'pt-BR');
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    const credential = this.options.credential().trim();
    const headers: Record<string, string> = { accept: 'application/json' };
    if (/^[a-fA-F0-9]{32}$/.test(credential)) url.searchParams.set('api_key', credential);
    else headers.Authorization = `Bearer ${credential}`;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const operation = (async () => {
      const response = await (this.options.fetchImpl ?? fetch)(url.href, { headers, signal: controller.signal, referrerPolicy: 'no-referrer' });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) this.pausedUntil = this.now() + 15 * 60 * 1000;
        else if (response.status === 429) this.pausedUntil = this.now() + 30000;
        throw new Error('TMDB_REQUEST_FAILED');
      }
      return object(await response.json());
    })();
    try {
      return await Promise.race([operation, new Promise<never>((_, reject) => {
        timer = setTimeout(() => { controller.abort(); reject(new Error('TMDB_TIMEOUT')); }, this.options.timeoutMs ?? 8000);
      })]);
    } catch {
      this.pausedUntil = Math.max(this.pausedUntil, this.now() + 5000);
      throw new Error('TMDB_UNAVAILABLE');
    } finally { if (timer) clearTimeout(timer); }
  }

  private async lookup(raw: ArtworkIdentity): Promise<ArtworkMetadata | null> {
    const normalized = normalizeArtworkIdentity(raw);
    const contextual = !normalized.tmdbId && Boolean(normalized.originCountry || normalized.network);
    // An unrelated provider image cannot overrule independently confirmed context.
    const identity = contextual ? { ...normalized, posterPath: undefined, sourcePosterUri: undefined } : normalized;
    const privateTitle = /https?:\/\/|tvg-logo\s*=|group-title\s*=|[\r\n]/i;
    if ((!identity.tmdbId && !titleKey(identity.title)) || privateTitle.test(raw.title) || privateTitle.test(identity.title)) return null;
    const type = identity.kind === 'movie' ? 'movie' : 'tv';
    let candidate: JsonObject;
    const imageParams = { append_to_response: 'images', include_image_language: 'pt,en,null' };
    if (identity.tmdbId) {
      candidate = await this.request(`${type}/${identity.tmdbId}`, imageParams);
      if (Number(candidate.id) !== Number(identity.tmdbId)) return null;
    } else {
      const params: Record<string, string> = { query: identity.title, include_adult: 'false' };
      if (identity.year) params[type === 'movie' ? 'primary_release_year' : 'first_air_date_year'] = String(identity.year);
      const results = await this.request(`search/${type}`, params);
      let candidates = Array.isArray(results.results) ? results.results : [];
      const verified = new Map<number, JsonObject>();
      let networkRequired = false;
      if (identity.network || identity.hasEpisodes) {
        const strong = [...new Map(rankTmdbCandidates(identity, candidates).map(({ candidate }) => [Number(candidate.id), candidate])).values()];
        if (strong.length > 6) return null;
        if (strong.length > 1) {
          networkRequired = Boolean(identity.network);
          for (const possible of strong) {
            const details = await this.request(`${type}/${possible.id}`, imageParams);
            if (details.id !== possible.id) return null;
            if (this.matchesContext(identity, details, networkRequired)) verified.set(Number(details.id), details);
          }
          candidates = [...verified.values()];
        }
      }
      let match = selectTmdbMatch(identity, candidates);
      // Search considers aliases, while its response can expose only translated
      // and original titles. Confirm an exact official alias rather than guessing.
      if (!match && !identity.posterPath && !rankTmdbCandidates(identity, candidates).length) {
        match = await this.aliasMatch(identity, type, candidates);
      }
      if (!match && identity.kind === 'series' && normalized.hasEpisodes && (normalized.originCountry || normalized.network)
        && normalized.year && normalized.posterPath && !rankTmdbCandidates(identity, candidates).length) {
        const localized = await this.localizedSeriesMatch(normalized, candidates, imageParams);
        if (localized) return toMetadata(normalized, localized);
      }
      // The source may use another language's poster of the same work. Confirm
      // the public filename against bounded image variants of strong homonyms.
      if (!match && identity.posterPath) {
        const ranked = rankTmdbCandidates(identity, candidates);
        if (ranked.length > 6) return null;
        let confirmed: JsonObject | undefined;
        let exactFallback: JsonObject | undefined;
        for (const { candidate: possible } of ranked) {
          const details = await this.request(`${type}/${possible.id}`, imageParams);
          if (details.id !== possible.id || !this.matchesContext(identity, details, networkRequired)) continue;
          const posters = object(details.images).posters;
          if (details.poster_path === identity.posterPath || (Array.isArray(posters) && posters.some(p => object(p).file_path === identity.posterPath))) {
            if (confirmed) return null;
            confirmed = details;
          }
          // A provider can remove an old poster filename. Recover only a single
          // exact title/year, checked again in details; never guess a homonym.
          if (ranked.length === 1 && identity.year && ranked[0].titleScore === 1) {
            const date = type === 'movie' ? details.release_date : details.first_air_date;
            const candidateDate = type === 'movie' ? possible.release_date : possible.first_air_date;
            if (typeof date === 'string' && typeof candidateDate === 'string'
              && Number(date.slice(0, 4)) === Number(identity.year)
              && Number(candidateDate.slice(0, 4)) === Number(identity.year)
              && rankTmdbCandidates(identity, [details])[0]?.titleScore === 1) exactFallback = details;
          }
        }
        if(!confirmed&&identity.kind==='series'&&identity.hasEpisodes&&identity.year&&!identity.originCountry&&!identity.network){const recovered=await this.posterYearMatch(identity,imageParams);if(recovered)return recovered;}
        return confirmed || exactFallback ? toMetadata(identity, (confirmed || exactFallback)!) : null;
      }
      if (!match && identity.sourcePosterUri && !identity.posterPath) {
        const ranked = rankTmdbCandidates(identity, candidates);
        const unique = [...new Map(ranked.map(({ candidate }) => [candidate.id, candidate])).values()];
        if (!unique.length || unique.length > 6) return null;
        const details: JsonObject[] = [];
        for (const possible of unique) {
          const value = await this.request(`${type}/${possible.id}`, imageParams);
          if (value.id !== possible.id || !rankTmdbCandidates(identity, [value]).length || !this.matchesContext(identity, value, networkRequired)) return null;
          details.push(value);
        }
        const matcher = this.options.matchPoster ?? (await import('./poster-identity.ts')).matchSourcePoster;
        const confirmed = await matcher(identity.sourcePosterUri, details);
        return confirmed && details.includes(confirmed) ? toMetadata(identity, confirmed) : null;
      }
      if (!match) return null;
      const details = verified.get(Number(match.id)) ?? await this.request(`${type}/${match.id}`, imageParams);
      if (details.id !== match.id || ((contextual || identity.hasEpisodes) && !this.matchesContext(identity, details, networkRequired))) return null;
      candidate = details;
    }
    return toMetadata(identity, candidate);
  }

  /** Recover a source year only by one exact full title AND its public poster. */
  private async posterYearMatch(identity:ArtworkIdentity,imageParams:Record<string,string>):Promise<ArtworkMetadata|null>{
    const result=await this.request('search/tv',{query:identity.title,include_adult:'false'}),unbound={...identity,year:undefined};
    const candidates=[...new Map(rankTmdbCandidates(unbound,Array.isArray(result.results)?result.results:[]).filter(v=>v.titleScore===1).map(v=>[Number(v.candidate.id),v.candidate])).values()];
    if(candidates.length>6)throw new Error('PUBLIC_POSTER_CANDIDATE_LIMIT');let confirmed:JsonObject|undefined;
    for(const possible of candidates){const d=await this.request('tv/'+possible.id,imageParams);if(d.id!==possible.id)throw new Error('PUBLIC_POSTER_RESPONSE_ID');if(!this.matchesContext(unbound,d)||rankTmdbCandidates(unbound,[d])[0]?.titleScore!==1)continue;
      const posters=object(d.images).posters;if(d.poster_path!==identity.posterPath&&!(Array.isArray(posters)&&posters.some(p=>object(p).file_path===identity.posterPath)))continue;
      if(confirmed)throw new Error('PUBLIC_POSTER_IDENTITY_AMBIGUOUS');confirmed=d;
    }
    if(!confirmed)return null;const metadata=toMetadata(identity,confirmed),sourceYear=validYear(identity.year);if(!sourceYear||!metadata.year)return null;
    if(sourceYear!==metadata.year){metadata.posterYearCorrection={sourceYear,posterPath:identity.posterPath!};metadata.heroPosterUris=[imageUri(identity.posterPath,'w342')!,...(metadata.heroPosterUris||[])].slice(0,8);}
    return metadata;
  }

  /** Localized display names differ. Exact English title + public poster/year/context only. */
  private async localizedSeriesMatch(identity: ArtworkIdentity, candidates: unknown[], imageParams: Record<string, string>): Promise<JsonObject | null> {
    const bounded = [...new Map(candidates.map(object).filter(candidate => Number.isSafeInteger(candidate.id) && Number(candidate.id) > 0
      && (!identity.originCountry || (Array.isArray(candidate.origin_country) && candidate.origin_country.includes(identity.originCountry))))
      .map(candidate => [Number(candidate.id), candidate])).values()];
    if (!bounded.length || bounded.length > 2) return null;
    let confirmed: JsonObject | null = null;
    for (const possible of bounded) {
      const details = await this.request('tv/' + possible.id, { ...imageParams, language: 'en-US' });
      const date = details.first_air_date, posters = object(details.images).posters;
      if (details.id !== possible.id || !this.matchesContext(identity, details, Boolean(identity.network))
        || typeof date !== 'string' || Number(date.slice(0, 4)) !== Number(identity.year)
        || rankTmdbCandidates(identity, [details])[0]?.titleScore !== 1
        || !(details.poster_path === identity.posterPath || (Array.isArray(posters) && posters.some(p => object(p).file_path === identity.posterPath)))) continue;
      if (confirmed) return null;
      confirmed = details;
    }
    return confirmed;
  }

  private matchesContext(identity: ArtworkIdentity, details: JsonObject, networkRequired = false): boolean {
    if (identity.originCountry && (!Array.isArray(details.origin_country) || !details.origin_country.includes(identity.originCountry))) return false;
    if (identity.network) {
      if (networkRequired && (!Array.isArray(details.networks) || !details.networks.some(network => object(network).name === identity.network))) return false;
    }
    if (identity.hasEpisodes && details.status === 'Planned' && !text(details.first_air_date) && details.last_episode_to_air === null) return false;
    return true;
  }

  private async aliasMatch(identity: ArtworkIdentity, type: 'movie' | 'tv', candidates: unknown[]): Promise<JsonObject | null> {
    const unique = new Map<number, JsonObject>();
    for (const candidate of candidates.map(object)) {
      if (Number.isSafeInteger(candidate.id) && Number(candidate.id) > 0
        && (!identity.originCountry || (Array.isArray(candidate.origin_country) && candidate.origin_country.includes(identity.originCountry)))) unique.set(Number(candidate.id), candidate);
    }
    if (!unique.size || unique.size > 2) return null;
    const wanted = titleKey(identity.title);
    let confirmed: JsonObject | null = null;
    for (const candidate of unique.values()) {
      const date = type === 'movie' ? candidate.release_date : candidate.first_air_date;
      const year = typeof date === 'string' ? Number(date.slice(0, 4)) : 0;
      if (identity.year && (!year || Math.abs(Number(identity.year) - year) > 1)) continue;
      const response = await this.request(`${type}/${candidate.id}/alternative_titles`);
      const aliases = type === 'movie' ? response.titles : response.results;
      if (response.id !== candidate.id || !Array.isArray(aliases) || aliases.length > 128) return null;
      if (!aliases.some(alias => {
        const title = object(alias).title;
        return typeof title === 'string' && title.length <= 200 && titleKey(title) === wanted;
      })) continue;
      if (confirmed) return null;
      confirmed = candidate;
    }
    return confirmed;
  }
}

export const tmdbMetadataService = new TmdbMetadataService({
  credential: () => String(import.meta.env?.VITE_TMDB_API_KEY || import.meta.env?.VITE_TMDB_READ_ACCESS_TOKEN || ''),
});

/** Presentation-only year correction; explicit IDs/country/network remain authoritative. */
export function hasPosterYearCorrection(identity:ArtworkIdentity|undefined,metadata:ArtworkMetadata|null|undefined):boolean{
 if(identity?.kind!=='series'||metadata?.kind!=='series'||!identity.hasEpisodes||identity.tmdbId||identity.originCountry||identity.network)return false;
 const normalized=normalizeArtworkIdentity(identity),proof=metadata.posterYearCorrection;if(!proof||proof.sourceYear!==normalized.year||proof.posterPath!==normalized.posterPath||!metadata.year||metadata.year===proof.sourceYear)return false;
 const sameTitle=[metadata.title,metadata.originalTitle].some(t=>t&&titleKey(t)===titleKey(normalized.title));
 return sameTitle&&[metadata.posterUri,...(metadata.heroPosterUris||[])].some(uri=>uri?.startsWith('https://image.tmdb.org/')&&tmdbPosterPath(uri)===proof.posterPath);
}
