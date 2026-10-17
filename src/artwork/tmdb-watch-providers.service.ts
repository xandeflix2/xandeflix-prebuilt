/// <reference types="vite/client" />
import {tmdbMetadataService, type ArtworkIdentity} from './tmdb-metadata.service.ts';

export interface WatchProvider {id:number;name:string;logo?:string}
export interface WatchAvailability {groups:Array<{mode:'flatrate'|'free'|'ads'|'rent'|'buy';providers:WatchProvider[]}>}
interface Options {credential:()=>string;fetchImpl?:typeof fetch;storage?:Pick<Storage,'getItem'|'setItem'>;now?:()=>number;timeoutMs?:number;identify?:(identity:ArtworkIdentity)=>Promise<{tmdbId:number}|null>}
type CacheValue=WatchAvailability|WatchProvider[];
const KEY='xandeflix:public-watch-providers:br:v1',DAY=86400000;
const object=(v:unknown):Record<string,unknown>=>v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{};
const modes=['flatrate','free','ads','rent','buy'] as const;
const provider=(raw:unknown):WatchProvider|null=>{
  const r=object(raw),id=Number(r.provider_id??r.id),name=r.provider_name??r.name,path=r.logo_path;
  if(!Number.isSafeInteger(id)||id<=0||typeof name!=='string'||!name.trim())return null;
  const logo=typeof path==='string'&&/^\/[A-Za-z0-9_.-]+$/.test(path)?'https://image.tmdb.org/t/p/w45'+path
    :typeof r.logo==='string'&&/^https:\/\/image\.tmdb\.org\/t\/p\/w45\/[A-Za-z0-9_.-]+$/.test(r.logo)?r.logo:undefined;
  return{id,name:name.trim().slice(0,80),...(logo?{logo}:{})};
};
const providers=(raw:unknown,limit=16):WatchProvider[]=>{
  const seen=new Set<number>();return(Array.isArray(raw)?raw:[]).slice(0,512).map(provider).filter((v):v is WatchProvider=>Boolean(v)&&!seen.has(v!.id)&&Boolean(seen.add(v!.id))).slice(0,limit);
};
export function watchAvailability(raw:unknown):WatchAvailability {
  const r=object(raw);return{groups:modes.map(mode=>({mode,providers:providers(r[mode])})).filter(g=>g.providers.length)};
}
const normalize=(value:string)=>value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'');
export function matchPlatform(label:string,directory:WatchProvider[]):WatchProvider|undefined {
  const name=normalize(label),aliases:Record<string,string[]>={primevideo:['amazonprimevideo'],amazonprime:['amazonprimevideo'],hbo:['hbomax','max'],hbomax:['max'],max:['hbomax'],disney:['disneyplus','disney'],disneyplus:['disney'],appletvplus:['appletv']};
  return directory.find(p=>normalize(p.name)===name)||directory.find(p=>aliases[name]?.includes(normalize(p.name)));
}

/** Optional public BR metadata. Never touches the active catalog or playback. */
export class TmdbWatchProvidersService {
  private cache=new Map<string,{expires:number;value:CacheValue}>();
  private pending=new Map<string,Promise<CacheValue|null>>();
  private queue:Array<()=>void>=[];private active=0;private pausedUntil=0;
  private storage?:Options['storage'];
  constructor(private options:Options){
    try{this.storage=options.storage??(typeof localStorage==='undefined'?undefined:localStorage);
      const raw=this.storage?.getItem(KEY);if(!raw||raw.length>600000)return;
      const data=object(JSON.parse(raw));if(data.version!==1||!Array.isArray(data.entries))return;
      for(const row of data.entries.slice(-257)){
        if(!Array.isArray(row)||typeof row[0]!=='string'||!/^directory$|^(?:movie|series):[1-9][0-9]*$/.test(row[0]))continue;
        const entry=object(row[1]);if(typeof entry.expires!=='number'||entry.expires<=this.now()||entry.expires>this.now()+7*DAY)continue;
        const value=row[0]==='directory'?providers(entry.value,512):{groups:(Array.isArray(object(entry.value).groups)?object(entry.value).groups as unknown[]:[]).slice(0,5).map(object).filter(g=>modes.includes(g.mode as typeof modes[number])).map(g=>({mode:g.mode as typeof modes[number],providers:providers(g.providers)})).filter(g=>g.providers.length)};
        this.cache.set(row[0],{expires:entry.expires,value});
      }
    }catch{/* Optional cache failure never affects boot. */}
  }
  private now(){return this.options.now?.()??Date.now();}
  private cached(key:string):CacheValue|undefined {const e=this.cache.get(key);if(!e||e.expires<=this.now())return;this.cache.delete(key);this.cache.set(key,e);return e.value;}
  private persist(){const titles=[...this.cache.keys()].filter(key=>key!=='directory');while(titles.length>256)this.cache.delete(titles.shift()!);try{this.storage?.setItem(KEY,JSON.stringify({version:1,entries:[...this.cache]}));}catch{/* Quota/private mode: RAM-only cache. */}}
  private load(key:string,path:string,directory=false):Promise<CacheValue|null>{
    const cached=this.cached(key);if(cached)return Promise.resolve(cached);
    const existing=this.pending.get(key);if(existing)return existing;
    if(!this.options.credential().trim()||this.now()<this.pausedUntil||this.queue.length>=32)return Promise.resolve(null);
    let resolve!:(value:CacheValue|null)=>void;const promise=new Promise<CacheValue|null>(r=>{resolve=r;});this.pending.set(key,promise);
    this.queue.push(()=>{this.active++;void(async()=>{let value:CacheValue|null=null;
      try{const response=await this.request(path);value=directory?providers(response.results,512):watchAvailability(object(response.results).BR);
        this.cache.set(key,{expires:this.now()+(directory?7*DAY:(value as WatchAvailability).groups.length?DAY:3600000),value});this.persist();
      }catch{/* Availability is optional, no fabricated provider. */}
      finally{this.pending.delete(key);this.active--;resolve(value);this.drain();}
    })();});this.drain();return promise;
  }
  private drain(){if(!this.active&&this.queue.length)this.queue.shift()!();}
  private async request(path:string):Promise<Record<string,unknown>>{
    if(this.now()<this.pausedUntil)throw Error('PROVIDER_COOLDOWN');
    const url=new URL('https://api.themoviedb.org/3/'+path);url.searchParams.set('language','pt-BR');if(path==='watch/providers/tv')url.searchParams.set('watch_region','BR');
    const credential=this.options.credential().trim(),headers:Record<string,string>={accept:'application/json'};
    if(/^[a-fA-F0-9]{32}$/.test(credential))url.searchParams.set('api_key',credential);else headers.Authorization='Bearer '+credential;
    const controller=new AbortController();let timer:ReturnType<typeof setTimeout>|undefined;
    try{return await Promise.race([(async()=>{const r=await(this.options.fetchImpl??fetch)(url.href,{headers,signal:controller.signal,referrerPolicy:'no-referrer'});
      if(!r.ok){this.pausedUntil=this.now()+([401,403].includes(r.status)?900000:r.status===429?30000:5000);throw Error('PROVIDER_UNAVAILABLE');}return object(await r.json());})(),new Promise<never>((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('PROVIDER_TIMEOUT'));},this.options.timeoutMs??8000);})]);}
    catch{this.pausedUntil=Math.max(this.pausedUntil,this.now()+5000);throw Error('PROVIDER_UNAVAILABLE');}
    finally{if(timer)clearTimeout(timer);}
  }
  peek(identity:ArtworkIdentity|undefined):WatchAvailability|null {
    if(!identity)return null;const id=Number(identity.tmdbId||tmdbMetadataService.peek(identity)?.tmdbId);if(!Number.isSafeInteger(id)||id<=0)return null;
    return this.cached(identity.kind+':'+id) as WatchAvailability??null;
  }
  async resolve(identity:ArtworkIdentity):Promise<WatchAvailability|null>{
    const found=await(this.options.identify?.(identity)??tmdbMetadataService.resolve(identity,'normal'));
    if(!found||!Number.isSafeInteger(found.tmdbId)||found.tmdbId<=0)return null;
    return await this.load(identity.kind+':'+found.tmdbId,(identity.kind==='movie'?'movie':'tv')+'/'+found.tmdbId+'/watch/providers') as WatchAvailability|null;
  }
  async logo(label:string):Promise<string|undefined>{const directory=await this.load('directory','watch/providers/tv',true);return directory?matchPlatform(label,directory as WatchProvider[])?.logo:undefined;}
}
export const tmdbWatchProvidersService=new TmdbWatchProvidersService({credential:()=>String(import.meta.env?.VITE_TMDB_API_KEY||import.meta.env?.VITE_TMDB_READ_ACCESS_TOKEN||'')});
