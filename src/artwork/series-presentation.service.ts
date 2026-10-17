/// <reference types="vite/client" />
import { tmdbMetadataService, type ArtworkIdentity } from './tmdb-metadata.service.ts';

export interface MoviePresentation {
  tmdbId: number;
  runtimeMinutes?: number;
  ageRating?: string;
  trailer?: { key: string; name: string };
}
export interface SeriesPresentation extends MoviePresentation {
  episodeCount?: number;
}

const object = (v: unknown): Record<string, unknown> => v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {};
const array = (v: unknown): unknown[] => Array.isArray(v) ? v : [];
const integer = (v: unknown, max: number): number | undefined => typeof v === 'number' && Number.isInteger(v) && v > 0 && v <= max ? v : undefined;
export function selectSeriesTrailer(value: unknown): SeriesPresentation['trailer'] {
  const videos = array(value).slice(0, 200).map(object).filter(v => v.site === 'YouTube' && v.type === 'Trailer'
    && typeof v.key === 'string' && /^[A-Za-z0-9_-]{11}$/.test(v.key));
  const score = (v: Record<string, unknown>) => (v.iso_639_1 === 'pt' ? 100 : v.iso_639_1 === 'en' ? 50 : 0) + (v.official === true ? 10 : 0);
  videos.sort((a,b) => score(b)-score(a));
  const video = videos[0];
  return video ? { key: video.key as string, name: typeof video.name === 'string' ? video.name.trim().slice(0,160) : 'Trailer' } : undefined;
}
export function parseSeriesPresentation(raw: unknown, tmdbId: number): SeriesPresentation | null {
  const v=object(raw); if (v.id !== tmdbId) return null;
  const ratings=array(object(v.content_ratings).results).map(object).filter(r=>r.iso_3166_1==='BR');
  const rating=ratings.map(r=>r.rating).find(r=>typeof r==='string' && /^(?:L|Livre|AL|10|12|14|16|18)$/.test(r));
  const runtimes=array(v.episode_run_time).map(n=>integer(n,600)).filter((n):n is number=>!!n);
  const runtime=runtimes[0] || integer(object(v.last_episode_to_air).runtime,600);
  return { tmdbId, episodeCount:integer(v.number_of_episodes,100000), runtimeMinutes:runtime,
    ageRating: typeof rating==='string' ? /^(?:L|Livre|AL)$/.test(rating)?'L':rating : undefined,
    trailer:selectSeriesTrailer(object(v.videos).results) };
}

export function parseMoviePresentation(raw: unknown, tmdbId: number): MoviePresentation | null {
  const v = object(raw);
  if (v.id !== tmdbId) return null;
  const ratings = array(object(v.release_dates).results).map(object)
    .filter(row => row.iso_3166_1 === 'BR')
    .flatMap(row => array(row.release_dates).map(object));
  const rating = ratings.map(row => row.certification)
    .find(value => typeof value === 'string' && /^(?:L|Livre|AL|10|12|14|16|18)$/.test(value));
  return {
    tmdbId,
    runtimeMinutes: integer(v.runtime, 1440),
    ageRating: typeof rating === 'string' ? /^(?:L|Livre|AL)$/.test(rating) ? 'L' : rating : undefined,
    trailer: selectSeriesTrailer(object(v.videos).results),
  };
}

interface Options { credential:()=>string; fetchImpl?:typeof fetch; now?:()=>number; timeoutMs?:number; kind?:'movie'|'series' }
const ageListeners = new Set<() => void>();
export function subscribePresentationAges(listener: () => void): () => void {
  ageListeners.add(listener); return () => { ageListeners.delete(listener); };
}
/** Optional public metadata; no source/catalog writes and no video bytes. */
export class SeriesPresentationService {
  private cache=new Map<number,{expires:number;value:SeriesPresentation}>();
  private pending=new Map<number,Promise<SeriesPresentation|null>>();
  private queue:Array<()=>void>=[]; private active=0; private pausedUntil=0;
  private options:Options;
  constructor(options:Options) {this.options=options;}
  peek(tmdbId:number):SeriesPresentation|null {
    const cached=this.cache.get(tmdbId);
    return cached && cached.expires>(this.options.now?.()??Date.now()) ? cached.value : null;
  }
  resolve(tmdbId:number):Promise<SeriesPresentation|null> {
    const now=this.options.now?.()??Date.now();
    if(!Number.isSafeInteger(tmdbId)||tmdbId<=0||!this.options.credential().trim()||now<this.pausedUntil)return Promise.resolve(null);
    const cached=this.cache.get(tmdbId);
    if(cached && cached.expires>now){this.cache.delete(tmdbId);this.cache.set(tmdbId,cached);return Promise.resolve(cached.value);}
    const pending=this.pending.get(tmdbId);if(pending)return pending;
    if(this.pending.size>=32)return Promise.resolve(null);
    let finish!:(value:SeriesPresentation|null)=>void;
    const result=new Promise<SeriesPresentation|null>(r=>{finish=r;}); this.pending.set(tmdbId,result);
    this.queue.push(()=>{
      this.active++;
      void(async()=>{
        let value:SeriesPresentation|null=null;
        try {
          value=await this.request(tmdbId);
          if(value){this.cache.delete(tmdbId);this.cache.set(tmdbId,{expires:(this.options.now?.()??Date.now())+6*60*60*1000,value});while(this.cache.size>64)this.cache.delete(this.cache.keys().next().value!);
            if(value.ageRating)for(const listener of ageListeners){try{listener();}catch{/* Optional presentation observer. */}}
          }
        } catch {/* Optional enrichment failure. */}
        finally {this.pending.delete(tmdbId);this.active--;this.drain();}
        finish(value);
      })();
    });this.drain();return result;
  }
  private drain(){while(this.active<2 && this.queue.length)this.queue.shift()!();}
  private async request(id:number):Promise<SeriesPresentation|null> {
    const movie = this.options.kind === 'movie';
    const url=new URL(`https://api.themoviedb.org/3/${movie ? 'movie' : 'tv'}/${id}`);
    url.searchParams.set('language','pt-BR');url.searchParams.set('append_to_response',movie ? 'videos,release_dates' : 'videos,content_ratings');url.searchParams.set('include_video_language','pt,en,null');
    const credential=this.options.credential().trim(),headers:Record<string,string>={accept:'application/json'};
    if(/^[a-fA-F0-9]{32}$/.test(credential))url.searchParams.set('api_key',credential);else headers.Authorization=`Bearer ${credential}`;
    const controller=new AbortController();let timer:ReturnType<typeof setTimeout>|undefined;
    try {
      return await Promise.race([(async()=>{
        const response=await(this.options.fetchImpl??fetch)(url.href,{headers,signal:controller.signal,referrerPolicy:'no-referrer'});
        if(!response.ok){if([401,403,429].includes(response.status))this.pausedUntil=(this.options.now?.()??Date.now())+(response.status===429?30000:15*60*1000);return null;}
        const raw = await response.json();
        return movie ? parseMoviePresentation(raw,id) : parseSeriesPresentation(raw,id);
      })(),new Promise<null>(resolve=>{timer=setTimeout(()=>{controller.abort();resolve(null);},this.options.timeoutMs??8000);})]);
    } finally {if(timer)clearTimeout(timer);}
  }
}
export const seriesPresentationService=new SeriesPresentationService({credential:()=>String(import.meta.env?.VITE_TMDB_API_KEY||import.meta.env?.VITE_TMDB_READ_ACCESS_TOKEN||'')});
export async function resolveSeriesPresentation(identity:ArtworkIdentity):Promise<SeriesPresentation|null> {
  if(identity.kind!=='series')return null;
  const matched=await tmdbMetadataService.resolve(identity,'high');
  return matched ? seriesPresentationService.resolve(matched.tmdbId) : null;
}
export const moviePresentationService=new SeriesPresentationService({kind:'movie',credential:()=>String(import.meta.env?.VITE_TMDB_API_KEY||import.meta.env?.VITE_TMDB_READ_ACCESS_TOKEN||'')});
export async function resolveMoviePresentation(identity:ArtworkIdentity):Promise<MoviePresentation|null> {
  if(identity.kind!=='movie')return null;
  const matched=await tmdbMetadataService.resolve(identity,'high');
  return matched ? moviePresentationService.resolve(matched.tmdbId) : null;
}
