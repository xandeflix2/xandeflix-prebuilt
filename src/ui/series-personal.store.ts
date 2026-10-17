export type SeriesRating='dislike'|'like'|'love';
export interface SeriesPersonal { favorite:boolean; rating?:SeriesRating }
export interface FavoriteTarget {kind:'movie'|'series';itemId:string}
export interface PersonalFavorite {fingerprint:string;updatedAt:number;target?:FavoriteTarget}
type Entry=SeriesPersonal & {updatedAt:number;target?:FavoriteTarget};
const KEY='xandeflix:series-personal:v1';
const validRating=(v:unknown):v is SeriesRating=>v==='dislike'||v==='like'||v==='love';
function favoriteTarget(value:unknown):FavoriteTarget|undefined{
  const v=value as FavoriteTarget|undefined;
  return v && (v.kind==='movie'||v.kind==='series') && typeof v.itemId==='string' && v.itemId.length>0 && v.itemId.length<=512 && !/[/?#\s]/.test(v.itemId)
    ? {kind:v.kind,itemId:v.itemId}:undefined;
}
export class SeriesPersonalStore {
  private rows=new Map<string,Entry>(); private loaded=false;
  private listeners=new Set<()=>void>();
  private port?:Pick<Storage,'getItem'|'setItem'>;
  constructor(port?:Pick<Storage,'getItem'|'setItem'>) {this.port=port;}
  private storage(){if(this.port)return this.port;try{return typeof localStorage==='undefined'?undefined:localStorage;}catch{return undefined;}}
  private load(){
    if(this.loaded)return;this.loaded=true;
    try{const raw=this.storage()?.getItem(KEY);if(!raw||new TextEncoder().encode(raw).length>65536)return;
      const data=JSON.parse(raw);if(data.version!==1||!Array.isArray(data.entries))return;
      for(const row of data.entries.slice(-256)){if(!Array.isArray(row)||!/^[0-9a-f]{16}$/.test(row[0])||!row[1]||!Number.isFinite(row[1].updatedAt))continue;
        this.rows.set(row[0],{favorite:row[1].favorite===true,...(validRating(row[1].rating)?{rating:row[1].rating}:{}),updatedAt:row[1].updatedAt,...(favoriteTarget(row[1].target)?{target:favoriteTarget(row[1].target)}:{})});}
    }catch{/* Optional preferences never block the page. */}
  }
  get(key:string):SeriesPersonal{this.load();const v=this.rows.get(key);return {favorite:v?.favorite===true,...(v?.rating?{rating:v.rating}:{})};}
  favorites():PersonalFavorite[]{
    this.load();return [...this.rows].reverse().filter(([,value])=>value.favorite).sort((a,b)=>b[1].updatedAt-a[1].updatedAt)
      .map(([fingerprint,value])=>({fingerprint,updatedAt:value.updatedAt,...(value.target?{target:{...value.target}}:{})}));
  }
  subscribe(listener:()=>void):()=>void{this.listeners.add(listener);return()=>{this.listeners.delete(listener);};}
  set(key:string,value:SeriesPersonal,target?:FavoriteTarget):SeriesPersonal{
    this.load();if(!/^[0-9a-f]{16}$/.test(key))return {favorite:false};
    const reference=favoriteTarget(target)||this.rows.get(key)?.target;
    this.rows.delete(key);if(value.favorite||validRating(value.rating))this.rows.set(key,{favorite:value.favorite===true,...(validRating(value.rating)?{rating:value.rating}:{}),updatedAt:Date.now(),...(reference?{target:reference}:{})});
    while(this.rows.size>256)this.rows.delete(this.rows.keys().next().value!);
    let raw=JSON.stringify({version:1,entries:[...this.rows]});while(new TextEncoder().encode(raw).length>65536){this.rows.delete(this.rows.keys().next().value!);raw=JSON.stringify({version:1,entries:[...this.rows]});}
    try{this.storage()?.setItem(KEY,raw);}catch{/* RAM fallback. */}
    for(const notify of this.listeners)notify();return this.get(key);
  }
}
export const seriesPersonalStore=new SeriesPersonalStore();
