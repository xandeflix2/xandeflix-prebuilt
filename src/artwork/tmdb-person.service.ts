/// <reference types="vite/client" />
/** Public person metadata only. No catalog/source data leaves the device. */
export interface PersonCredit { id:number; kind:'movie'|'series'; title:string; originalTitle?:string; year?:number; posterPath?:string }
export interface PersonProfile { id:number; name:string; biography?:string; birthday?:string; deathday?:string; birthplace?:string; department?:string; profileUri?:string; credits:PersonCredit[] }
const object=(v:unknown):Record<string,unknown>=>v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{};
const text=(v:unknown,max:number)=>typeof v==='string'&&v.trim()?v.trim().slice(0,max):undefined;
const id=(v:unknown)=>typeof v==='number'&&Number.isSafeInteger(v)&&v>0?v:undefined;
const picture=(v:unknown)=>typeof v==='string'&&/^\/[A-Za-z0-9_-]+\.(?:jpg|png|webp)$/.test(v)?v:undefined;
const date=(v:unknown)=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)?v:undefined;
export function parsePersonProfile(raw:unknown,personId:number):PersonProfile|null {
  const v=object(raw),name=text(v.name,120);if(!id(personId)||v.id!==personId||!name||v.adult===true)return null;
  const rows=object(v.combined_credits).cast,credits:PersonCredit[]=[],seen=new Set<string>();
  for(const rawRow of Array.isArray(rows)?rows:[]){const row=object(rawRow),n=id(row.id),kind=row.media_type==='movie'?'movie':row.media_type==='tv'?'series':undefined,title=text(row.title||row.name,200);
    if(!n||!kind||!title||row.adult===true||seen.has(kind+':'+n))continue;seen.add(kind+':'+n);
    const release=date(row.release_date||row.first_air_date),year=release?Number(release.slice(0,4)):undefined;
    credits.push({id:n,kind,title,originalTitle:text(row.original_title||row.original_name,200),year,posterPath:picture(row.poster_path)});
  }
  const photo=picture(v.profile_path);
  return{id:personId,name,biography:text(v.biography,50000),birthday:date(v.birthday),deathday:date(v.deathday),birthplace:text(v.place_of_birth,240),department:text(v.known_for_department,120),profileUri:photo?'https://image.tmdb.org/t/p/w300'+photo:undefined,credits};
}
interface Options {credential:()=>string;fetchImpl?:typeof fetch;now?:()=>number;timeoutMs?:number}
export class PersonMetadataService {
  private cache=new Map<number,{until:number;value:PersonProfile}>();private pending=new Map<number,Promise<PersonProfile|null>>();private queue:Array<()=>void>=[];private active=0;private pausedUntil=0;
  constructor(private options:Options){}
  resolve(personId:number):Promise<PersonProfile|null>{
    const now=this.options.now?.()??Date.now();if(!id(personId)||!this.options.credential().trim()||now<this.pausedUntil)return Promise.resolve(null);
    const cached=this.cache.get(personId);if(cached&&cached.until>now){this.cache.delete(personId);this.cache.set(personId,cached);return Promise.resolve(cached.value);}
    const pending=this.pending.get(personId);if(pending)return pending;if(this.pending.size>=16)return Promise.resolve(null);
    let finish!:(p:PersonProfile|null)=>void;const result=new Promise<PersonProfile|null>(resolve=>{finish=resolve;});this.pending.set(personId,result);
    this.queue.push(()=>{this.active++;void this.request(personId).catch(()=>null).then(value=>{if(value){this.cache.delete(personId);this.cache.set(personId,{until:(this.options.now?.()??Date.now())+21600000,value});while(this.cache.size>16)this.cache.delete(this.cache.keys().next().value!);}return value;}).then(finish).finally(()=>{this.pending.delete(personId);this.active--;this.drain();});});this.drain();return result;
  }
  private drain(){while(this.active<2&&this.queue.length)this.queue.shift()!();}
  private async request(personId:number):Promise<PersonProfile|null>{
    const url=new URL('https://api.themoviedb.org/3/person/'+personId);url.searchParams.set('language','pt-BR');url.searchParams.set('append_to_response','combined_credits');
    const credential=this.options.credential().trim(),headers:Record<string,string>={accept:'application/json'};
    if(/^[a-fA-F0-9]{32}$/.test(credential))url.searchParams.set('api_key',credential);else headers.Authorization='Bearer '+credential;
    const controller=new AbortController();let timer:ReturnType<typeof setTimeout>|undefined;
    try{return await Promise.race([(async()=>{const r=await(this.options.fetchImpl??fetch)(url.href,{headers,signal:controller.signal,referrerPolicy:'no-referrer'});if(!r.ok){if([401,403,429].includes(r.status))this.pausedUntil=(this.options.now?.()??Date.now())+(r.status===429?30000:900000);return null;}return parsePersonProfile(await r.json(),personId);})(),new Promise<null>(resolve=>{timer=setTimeout(()=>{controller.abort();resolve(null);},this.options.timeoutMs??8000);})]);}finally{if(timer)clearTimeout(timer);}
  }
}
export const personMetadataService=new PersonMetadataService({credential:()=>String(import.meta.env?.VITE_TMDB_API_KEY||import.meta.env?.VITE_TMDB_READ_ACCESS_TOKEN||'')});
