import { addNativePlayerProgressListener, readNativeWatchProgress, type NativePlayerProgressEvent } from './native-android-player.bridge.ts';
import type {CatalogReadModel} from '../catalog/catalog-read-model.ts';
import type {PlaybackService} from './playback.service.ts';
export interface RecentWatch {kind:'movie'|'series';itemId:string;episodeId?:string;fingerprint?:string;positionMs:number;durationMs:number;updatedAt:number;completed:boolean}
export function watchFingerprint(kind:'movie'|'series',item:{title:string;year?:number;durationSeconds?:number;externalIds?:{tmdbId?:string|number}}):string{
  const text=JSON.stringify([kind,item.title.normalize('NFKC').trim().toLowerCase(),item.year||0,item.durationSeconds||0,item.externalIds?.tmdbId||'']);
  let first=2166136261,second=0x9e3779b9;
  for(let i=0;i<text.length;i++){const code=text.charCodeAt(i);first=Math.imul(first^code,16777619);second=Math.imul(second^code,2246822519);}
  return [first,second].map(value=>(value>>>0).toString(16).padStart(8,'0')).join('');
}
const KEY='xandeflix:recent-watched:v1';
const POSITIONS_KEY='xandeflix:watch-positions:v1';
const SESSIONS_KEY='xandeflix:watch-sessions:v1';
const bytes=(value:string)=>new TextEncoder().encode(value).byteLength;
type StoragePort=Pick<Storage,'getItem'|'setItem'>;
function id(value:unknown):value is string{return typeof value==='string' && value.length>0 && value.length<=512 && !/[/?#]/.test(value);}
function record(value:unknown):RecentWatch|undefined{
  if(!value || typeof value!=='object')return;
  const r=value as RecentWatch;if((r.kind!=='movie' && r.kind!=='series') || !id(r.itemId) || r.kind==='series' && !id(r.episodeId))return;
  if(![r.positionMs,r.durationMs,r.updatedAt].every(Number.isFinite) || r.positionMs<0 || r.durationMs<0 || r.updatedAt<=0)return;
  return {kind:r.kind,itemId:r.itemId,...(r.kind==='series'?{episodeId:r.episodeId}:{}),...(typeof r.fingerprint==='string' && /^[0-9a-f]{16}$/.test(r.fingerprint)?{fingerprint:r.fingerprint}:{}),positionMs:Math.min(r.positionMs,604800000),durationMs:Math.min(r.durationMs,604800000),updatedAt:r.updatedAt,completed:r.completed===true};
}
export class WatchHistory {
  private records:RecentWatch[]=[];private loaded=false;
  private positions:RecentWatch[]=[];private positionsLoaded=false;
  private listeners=new Set<()=>void>();
  private sessions=new Map<string,{kind:'movie'|'series';itemId:string;episodeId?:string;fingerprint?:string;ended?:boolean;recentEligible?:boolean}>();
  private sessionsLoaded=false;
  private nativeListening=false;
  private nativeListenerReady:Promise<void>=Promise.resolve();
  private nativeSync?:Promise<void>;
  private readonly readProgress:()=>Promise<NativePlayerProgressEvent[]>;
  constructor(privateStorage?:StoragePort,readProgress=readNativeWatchProgress){this.privateStorage=privateStorage;this.readProgress=readProgress;}
  private privateStorage?:StoragePort;
  private storage(){if(this.privateStorage)return this.privateStorage;try{return typeof window!=='undefined'?window.localStorage:undefined;}catch{return undefined;}}
  list():RecentWatch[]{
    if(!this.loaded){this.loaded=true;try{const raw=this.storage()?.getItem(KEY);if(raw && raw.length<=65536 && bytes(raw)<=65536){const data=JSON.parse(raw);if(data.version===1 && Array.isArray(data.records))this.records=data.records.slice(0,60).map(record).filter((r:RecentWatch|undefined):r is RecentWatch=>!!r).sort((a:RecentWatch,b:RecentWatch)=>b.updatedAt-a.updatedAt);}}catch{/* RAM fallback */}}
    return this.records.map(row=>({...row}));
  }
  subscribe(listener:()=>void):()=>void{this.listeners.add(listener);return()=>{this.listeners.delete(listener);};}
  private loadPositions():void{
    if(this.positionsLoaded)return;this.positionsLoaded=true;
    try{
      const raw=this.storage()?.getItem(POSITIONS_KEY);
      if(raw && raw.length<=262144 && bytes(raw)<=262144){const data=JSON.parse(raw);if(data.version===1 && Array.isArray(data.records))this.positions=data.records.slice(0,1000).map(record).filter((r:RecentWatch|undefined):r is RecentWatch=>!!r);}
    }catch{/* RAM fallback */}
    for(const recent of this.list())if(!this.positions.some(row=>this.samePosition(row,recent)))this.positions.push(recent);
    this.positions.sort((a,b)=>b.updatedAt-a.updatedAt);this.positions=this.positions.slice(0,1000);
  }
  private samePosition(a:RecentWatch,b:RecentWatch):boolean{return a.kind===b.kind && a.itemId===b.itemId && a.episodeId===b.episodeId && a.fingerprint===b.fingerprint;}
  savedPosition(kind:'movie'|'series',itemId:string,fingerprint:string,episodeId?:string):number{
    this.loadPositions();const saved=this.positions.find(row=>row.kind===kind && row.itemId===itemId && row.fingerprint===fingerprint && row.episodeId===episodeId);
    return saved && !saved.completed?saved.positionMs:0;
  }
  private loadSessions():void{
    if(this.sessionsLoaded)return;this.sessionsLoaded=true;
    try{
      const raw=this.storage()?.getItem(SESSIONS_KEY);if(!raw || raw.length>8192 || bytes(raw)>8192)return;
      const data=JSON.parse(raw);if(data.version!==1 || !Array.isArray(data.sessions))return;
      for(const value of data.sessions.slice(-4)){
        if(!value || !/^[A-Za-z0-9_-]{1,64}$/.test(value.nonce||''))continue;
        const valid=record({...value,positionMs:0,durationMs:0,updatedAt:1});if(!valid)continue;
        this.sessions.set(value.nonce,{kind:valid.kind,itemId:valid.itemId,episodeId:valid.episodeId,fingerprint:valid.fingerprint,ended:value.ended===true,recentEligible:value.recentEligible!==false});
      }
    }catch{/* Optional association cannot block playback. */}
  }
  private persistSessions():void{
    const serialize=()=>JSON.stringify({version:1,sessions:[...this.sessions].map(([nonce,value])=>({nonce,...value}))});
    let serialized=serialize();
    while(bytes(serialized)>8192 && this.sessions.size>1){this.sessions.delete(this.sessions.keys().next().value!);serialized=serialize();}
    if(bytes(serialized)>8192)return;
    try{this.storage()?.setItem(SESSIONS_KEY,serialized);}catch{/* RAM fallback */}
  }
  async syncNativeProgress():Promise<void>{
    if(this.nativeSync)return this.nativeSync;
    this.loadSessions();
    this.nativeSync=(async()=>{
      const values=await this.readProgress();if(!Array.isArray(values))return;
      const events=values.slice(0,4).filter(event=>event && typeof event==='object');
      for(const event of events.sort((a,b)=>(a.observedAt||0)-(b.observedAt||0)))this.observe(event);
    })().catch(()=>{}).finally(()=>{this.nativeSync=undefined;});
    return this.nativeSync;
  }
  ready():Promise<void>{return this.nativeListenerReady;}
  begin(kind:'movie'|'series',itemId:string,episodeId?:string,fingerprint?:string,recentEligible=true):string{
    this.loadSessions();
    const nonce=typeof crypto!=='undefined' && typeof crypto.randomUUID==='function'?crypto.randomUUID():`watch-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    if(!record({kind,itemId,episodeId,fingerprint,positionMs:0,durationMs:0,updatedAt:1,completed:false}))return nonce;
    for(const [key,session] of this.sessions)if(session.kind===kind && session.itemId===itemId)this.sessions.delete(key);
    this.sessions.set(nonce,{kind,itemId,episodeId,fingerprint,recentEligible});while(this.sessions.size>4)this.sessions.delete(this.sessions.keys().next().value!);
    this.persistSessions();
    if(!this.nativeListening){this.nativeListening=true;this.nativeListenerReady=addNativePlayerProgressListener(event=>this.observe(event)).then(()=>{},()=>{this.nativeListening=false;});}
    return nonce;
  }
  observe(event:NativePlayerProgressEvent):void{
    const current=this.sessions.get(event.playbackId||'');if(!current || current.ended || !Number.isFinite(event.positionMs) || event.positionMs<0 || event.positionMs===0 && !event.ended && !((event.durationMs||0)>0))return;
    const next=record({...current,positionMs:event.positionMs,durationMs:Math.max(0,event.durationMs||0),updatedAt:event.observedAt||Date.now(),completed:event.ended===true});if(!next)return;
    this.loadPositions();const previous=this.positions.find(row=>this.samePosition(row,next));
    if(previous && previous.updatedAt>next.updatedAt)return;
    if(event.ended){current.ended=true;this.persistSessions();}
    this.positions=[next,...this.positions.filter(row=>!this.samePosition(row,next))].sort((a,b)=>b.updatedAt-a.updatedAt).slice(0,1000);
    let saved=JSON.stringify({version:1,records:this.positions});
    while(bytes(saved)>262144){this.positions.pop();saved=JSON.stringify({version:1,records:this.positions});}
    try{this.storage()?.setItem(POSITIONS_KEY,saved);}catch{/* Optional positions conserve RAM. */}
    const existing=this.records.find(row=>row.kind===next.kind && row.itemId===next.itemId);
    if(existing && existing.updatedAt>next.updatedAt)return;
    this.records=[...(current.recentEligible===false?[]:[next]),...this.records.filter(row=>row.kind!==next.kind || row.itemId!==next.itemId)].sort((a,b)=>b.updatedAt-a.updatedAt).slice(0,60);
    let serialized=JSON.stringify({version:1,records:this.records});
    while(bytes(serialized)>65536){this.records.pop();serialized=JSON.stringify({version:1,records:this.records});}
    try{this.storage()?.setItem(KEY,serialized);}catch{/* Optional history never blocks playback. */}
    for(const notify of this.listeners)notify();
  }
}
export const watchHistory=new WatchHistory();

export async function resumeRecentWatch(entry:RecentWatch,readModel:CatalogReadModel,service:Pick<PlaybackService,'playMovie'|'playEpisode'>,history:WatchHistory=watchHistory){
  await history.syncNativeProgress();
  const latest=history.list().find(row=>row.kind===entry.kind && row.itemId===entry.itemId && row.fingerprint===entry.fingerprint && row.updatedAt>entry.updatedAt);
  if(latest)entry=latest;
  const options={startPositionMs:entry.completed?0:entry.positionMs};
  if(entry.kind==='movie'){
    const movie=await readModel.resolveMovieById(entry.itemId);
    if(!movie || entry.fingerprint!==watchFingerprint('movie',movie))throw new Error('Conteúdo indisponível no catálogo atual.');
    return service.playMovie(entry.itemId,readModel,options);
  }
  const series=await readModel.resolveSeriesById(entry.itemId);
  if(!series || entry.fingerprint!==watchFingerprint('series',series))throw new Error('Conteúdo indisponível no catálogo atual.');
  await readModel.loadEpisodesForSeries(entry.itemId);
  if(!readModel.getEpisodesForSeries(entry.itemId).some(episode=>episode.id===entry.episodeId))throw new Error('Episódio indisponível na série atual.');
  return service.playEpisode(entry.itemId,entry.episodeId!,readModel,options);
}
