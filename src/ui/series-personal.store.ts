export type SeriesRating='dislike'|'like'|'love';
export interface SeriesPersonal { favorite:boolean; rating?:SeriesRating }
type Entry=SeriesPersonal & {updatedAt:number};
const KEY='xandeflix:series-personal:v1';
const validRating=(v:unknown):v is SeriesRating=>v==='dislike'||v==='like'||v==='love';
export class SeriesPersonalStore {
  private rows=new Map<string,Entry>(); private loaded=false;
  private port?:Pick<Storage,'getItem'|'setItem'>;
  constructor(port?:Pick<Storage,'getItem'|'setItem'>) {this.port=port;}
  private storage(){if(this.port)return this.port;try{return typeof localStorage==='undefined'?undefined:localStorage;}catch{return undefined;}}
  private load(){
    if(this.loaded)return;this.loaded=true;
    try{const raw=this.storage()?.getItem(KEY);if(!raw||new TextEncoder().encode(raw).length>65536)return;
      const data=JSON.parse(raw);if(data.version!==1||!Array.isArray(data.entries))return;
      for(const row of data.entries.slice(-256)){if(!Array.isArray(row)||!/^[0-9a-f]{16}$/.test(row[0])||!row[1]||!Number.isFinite(row[1].updatedAt))continue;
        this.rows.set(row[0],{favorite:row[1].favorite===true,...(validRating(row[1].rating)?{rating:row[1].rating}:{}),updatedAt:row[1].updatedAt});}
    }catch{/* Optional preferences never block the page. */}
  }
  get(key:string):SeriesPersonal{this.load();const v=this.rows.get(key);return {favorite:v?.favorite===true,...(v?.rating?{rating:v.rating}:{})};}
  set(key:string,value:SeriesPersonal):SeriesPersonal{
    this.load();if(!/^[0-9a-f]{16}$/.test(key))return {favorite:false};
    this.rows.delete(key);if(value.favorite||validRating(value.rating))this.rows.set(key,{favorite:value.favorite===true,...(validRating(value.rating)?{rating:value.rating}:{}),updatedAt:Date.now()});
    while(this.rows.size>256)this.rows.delete(this.rows.keys().next().value!);
    let raw=JSON.stringify({version:1,entries:[...this.rows]});while(new TextEncoder().encode(raw).length>65536){this.rows.delete(this.rows.keys().next().value!);raw=JSON.stringify({version:1,entries:[...this.rows]});}
    try{this.storage()?.setItem(KEY,raw);}catch{/* RAM fallback. */}return this.get(key);
  }
}
export const seriesPersonalStore=new SeriesPersonalStore();
