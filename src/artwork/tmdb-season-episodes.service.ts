/// <reference types="vite/client" />
export type EpisodeTextLanguage='pt-BR'|'en-US';
export interface TmdbEpisodeMetadata {
  readonly id:number;readonly episodeNumber:number;readonly seasonNumber:number;
  readonly name?:string;readonly overview?:string;readonly stillPath?:string;readonly runtimeMinutes?:number;readonly airDate?:string;
  readonly nameLanguage:EpisodeTextLanguage;readonly overviewLanguage:EpisodeTextLanguage;
}
export interface TmdbSeasonMetadata {
  readonly seriesId:number;readonly id:number;readonly seasonNumber:number;readonly language:EpisodeTextLanguage;readonly episodes:readonly TmdbEpisodeMetadata[];
}
const object=(v:unknown):Record<string,unknown>=>v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{};
const number=(v:unknown,max:number,min=1):v is number=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=min&&v<=max;
const text=(v:unknown,max:number):string|undefined=>typeof v==='string'?v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g,'').trim().slice(0,max)||undefined:undefined;
export const validEpisodeStillPath=(v:unknown):v is string=>typeof v==='string'&&/^\/[A-Za-z0-9_-]+\.(?:jpg|jpeg|png|webp)$/.test(v)&&v.length<=160;
function date(v:unknown):string|undefined {
  if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v))return;
  const parsed=new Date(v+'T00:00:00Z');return Number.isFinite(parsed.getTime())&&parsed.toISOString().slice(0,10)===v?v:undefined;
}
/** Retains public display fields only. The series id is the validated request context, not a season id. */
export function parseTmdbSeason(raw:unknown,seriesId:number,seasonNumber:number,language:EpisodeTextLanguage):TmdbSeasonMetadata|null {
  const v=object(raw);
  if(!number(seriesId,2147483647)||!number(seasonNumber,1000,0)||!['pt-BR','en-US'].includes(language)
    ||!number(v.id,2147483647)||v.season_number!==seasonNumber||(v.series_id!==undefined&&v.series_id!==seriesId)
    ||!Array.isArray(v.episodes)||v.episodes.length>1000)return null;
  const ids=new Set<number>(),numbers=new Set<number>(),episodes:TmdbEpisodeMetadata[]=[];
  for(const row of v.episodes){
    const ep=object(row);
    if(!number(ep.id,2147483647)||!number(ep.episode_number,10000)||ep.season_number!==seasonNumber
      ||(ep.show_id!==undefined&&ep.show_id!==seriesId)||ids.has(ep.id)||numbers.has(ep.episode_number))return null;
    ids.add(ep.id);numbers.add(ep.episode_number);
    episodes.push({id:ep.id,episodeNumber:ep.episode_number,seasonNumber,name:text(ep.name,200),overview:text(ep.overview,2000),
      stillPath:validEpisodeStillPath(ep.still_path)?ep.still_path:undefined,runtimeMinutes:number(ep.runtime,600)?ep.runtime:undefined,
      airDate:date(ep.air_date),nameLanguage:language,overviewLanguage:language});
  }
  return{seriesId,id:v.id,seasonNumber,language,episodes};
}
interface Options{credential:()=>string;fetchImpl?:typeof fetch;now?:()=>number;timeoutMs?:number}
interface CacheEntry{expires:number;bytes:number;value:TmdbSeasonMetadata|null}
/** Optional, bounded public season metadata. No catalog, private ids, source URL or storage access. */
export class TmdbSeasonEpisodesService {
  private options:Options;private cache=new Map<string,CacheEntry>();private cacheBytes=0;
  private pending=new Map<string,Promise<TmdbSeasonMetadata|null>>();private queue:Array<()=>void>=[];private active=0;private pausedUntil=0;
  constructor(options:Options){this.options=options;}
  private now(){return this.options.now?.()??Date.now();}
  resolve(seriesId:number,seasonNumber:number,language:EpisodeTextLanguage='pt-BR'):Promise<TmdbSeasonMetadata|null>{
    if(!number(seriesId,2147483647)||!number(seasonNumber,1000,0)||!['pt-BR','en-US'].includes(language)||!this.options.credential().trim())return Promise.resolve(null);
    const key=`${seriesId}:${seasonNumber}:${language}`,cached=this.cache.get(key);
    if(cached&&cached.expires>this.now()){this.cache.delete(key);this.cache.set(key,cached);return Promise.resolve(cached.value);}
    if(cached){this.cache.delete(key);this.cacheBytes-=cached.bytes;}
    const pending=this.pending.get(key);if(pending)return pending;
    if(this.now()<this.pausedUntil||this.pending.size>=16)return Promise.resolve(null);
    let finish!:(value:TmdbSeasonMetadata|null)=>void;
    const promise=new Promise<TmdbSeasonMetadata|null>(r=>{finish=r;});this.pending.set(key,promise);
    this.queue.push(()=>{this.active++;void(async()=>{
      let value:TmdbSeasonMetadata|null=null;
      try{if(this.now()>=this.pausedUntil)value=await this.request(seriesId,seasonNumber,language);}
      catch{/* Public enrichment cannot block the source-backed page. */}
      finally{
        const bytes=value?new TextEncoder().encode(JSON.stringify(value)).byteLength:0;
        this.cache.set(key,{value,bytes,expires:this.now()+(value?6*60*60*1000:30000)});this.cacheBytes+=bytes;
        while(this.cache.size>16||this.cacheBytes>2*1024*1024){const oldest=this.cache.keys().next().value!;this.cacheBytes-=this.cache.get(oldest)!.bytes;this.cache.delete(oldest);}
        this.pending.delete(key);this.active--;this.drain();finish(value);
      }
    })();});this.drain();return promise;
  }
  private drain(){while(this.active<2&&this.queue.length)this.queue.shift()!();}
  private async request(seriesId:number,seasonNumber:number,language:EpisodeTextLanguage):Promise<TmdbSeasonMetadata|null>{
    const controller=new AbortController();let timer:ReturnType<typeof setTimeout>|undefined,accepted:TmdbSeasonMetadata|null=null;
    const fetchSeason=async(lang:EpisodeTextLanguage):Promise<TmdbSeasonMetadata|null>=>{
      if(controller.signal.aborted||this.now()<this.pausedUntil)return null;
      const url=new URL(`https://api.themoviedb.org/3/tv/${seriesId}/season/${seasonNumber}`),headers:Record<string,string>={accept:'application/json'};
      url.searchParams.set('language',lang);const credential=this.options.credential().trim();
      if(/^[a-fA-F0-9]{32}$/.test(credential))url.searchParams.set('api_key',credential);else headers.Authorization=`Bearer ${credential}`;
      const response=await(this.options.fetchImpl??fetch)(url.href,{headers,signal:controller.signal,referrerPolicy:'no-referrer'});
      if(!response.ok){
        if(response.status===429){const raw=response.headers.get('Retry-After'),seconds=raw&&/^\d+$/.test(raw)?Number(raw):30;this.pausedUntil=Math.max(this.pausedUntil,this.now()+Math.min(120,Math.max(1,seconds))*1000);}
        else if(response.status===401||response.status===403)this.pausedUntil=this.now()+15*60*1000;
        return null;
      }
      const body=await response.text();if(controller.signal.aborted||body.length>1000000||new TextEncoder().encode(body).byteLength>1000000)return null;
      return parseTmdbSeason(JSON.parse(body),seriesId,seasonNumber,lang);
    };
    try{return await Promise.race([(async()=>{
      const primary=await fetchSeason(language);accepted=primary;if(!primary||language!=='pt-BR'||controller.signal.aborted||!primary.episodes.some(e=>!e.name||!e.overview))return primary;
      let secondary:TmdbSeasonMetadata|null=null;try{secondary=await fetchSeason('en-US');}catch{/* Keep valid localized fields on a failed fallback. */}
      if(!secondary||secondary.id!==primary.id||controller.signal.aborted)return primary;
      const english=new Map(secondary.episodes.map(e=>[e.episodeNumber,e]));
      return{...primary,episodes:primary.episodes.map((ep):TmdbEpisodeMetadata=>{
        const alt=english.get(ep.episodeNumber);if(!alt||alt.id!==ep.id||alt.seasonNumber!==ep.seasonNumber)return ep;
        return{...ep,name:ep.name||alt.name,overview:ep.overview||alt.overview,stillPath:ep.stillPath||alt.stillPath,runtimeMinutes:ep.runtimeMinutes||alt.runtimeMinutes,airDate:ep.airDate||alt.airDate,
          nameLanguage:ep.name?'pt-BR':'en-US',overviewLanguage:ep.overview?'pt-BR':'en-US'};
      })};
    })(),new Promise<TmdbSeasonMetadata|null>(r=>{timer=setTimeout(()=>{controller.abort();r(accepted);},Math.min(8000,Math.max(1,this.options.timeoutMs??8000)));})]);}
    finally{if(timer)clearTimeout(timer);controller.abort();}
  }
}
export const tmdbSeasonEpisodesService=new TmdbSeasonEpisodesService({credential:()=>String(import.meta.env?.VITE_TMDB_API_KEY||import.meta.env?.VITE_TMDB_READ_ACCESS_TOKEN||'')});
