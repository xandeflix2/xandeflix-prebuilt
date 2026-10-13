import type { LiveCatalog, LiveChannel } from '../catalog/live/live-tv.types.ts';
import type { LiveChannelPage } from '../catalog/live/live-catalog.service.ts';
import { isAdultClassification, isAdultLiveChannel } from './content-adult-policy.ts';
import { watchFingerprint } from './watch-history.ts';

const KEY='xandeflix:last-safe-live:v1';
type StoragePort=Pick<Storage,'getItem'|'setItem'>;
interface Preference { channelId:string; groupId:string; fingerprint:string; updatedAt:number }
const opaqueId=(value:unknown):value is string=>typeof value==='string' && value.length>0 && value.length<=512 && !/[/?#]/.test(value);
export function liveChannelFingerprint(channel:LiveChannel,catalog:LiveCatalog):string {
  return watchFingerprint('movie',{title:JSON.stringify([channel.name,channel.groupName||catalog.groups.find(group=>group.id===channel.groupId)?.name||'',channel.tvgId||''])});
}

export class LastLiveChannel {
  private value?:Preference;
  private loaded=false;
  private readonly port?:StoragePort;
  constructor(port?:StoragePort){this.port=port;}
  private storage(){try{return this.port||(typeof window!=='undefined'?window.localStorage:undefined);}catch{return undefined;}}
  read():Preference|undefined {
    if(!this.loaded){this.loaded=true;try{
      const raw=this.storage()?.getItem(KEY);if(raw && new TextEncoder().encode(raw).byteLength<=2048){const data=JSON.parse(raw),p=data.value;
        if(data.version===1 && opaqueId(p?.channelId) && opaqueId(p?.groupId) && /^[0-9a-f]{16}$/.test(p?.fingerprint||'') && Number.isFinite(p?.updatedAt) && p.updatedAt>0)
          this.value={channelId:p.channelId,groupId:p.groupId,fingerprint:p.fingerprint,updatedAt:p.updatedAt};}
    }catch{/* Optional preference falls back to a safe current channel. */}}
    return this.value?{...this.value}:undefined;
  }
  remember(channel:LiveChannel,catalog:LiveCatalog):boolean {
    if(!opaqueId(channel.id) || !opaqueId(channel.groupId) || isAdultLiveChannel(channel,catalog))return false;
    this.loaded=true;this.value={channelId:channel.id,groupId:channel.groupId,fingerprint:liveChannelFingerprint(channel,catalog),updatedAt:Date.now()};
    const serialized=JSON.stringify({version:1,value:this.value});
    if(new TextEncoder().encode(serialized).byteLength>2048)return false;
    try{this.storage()?.setItem(KEY,serialized);}catch{/* RAM fallback */}
    return true;
  }
}
export const lastLiveChannel=new LastLiveChannel();

export async function chooseInitialLiveChannel(catalog:LiveCatalog,options:{
  preference?:LastLiveChannel;
  loadPage:(groupId:string,offset:number,pageSize:number)=>Promise<LiveChannelPage>;
  activeSnapshot:()=>Promise<string|undefined>;
  signal:AbortSignal;
}):Promise<LiveChannel|undefined> {
  const check=async()=>{if(options.signal.aborted)throw Error('LIVE_SELECTION_CANCELLED');if(await options.activeSnapshot()!==catalog.snapshotId)throw Error('LIVE_SELECTION_CHANGED');if(options.signal.aborted)throw Error('LIVE_SELECTION_CANCELLED');};
  const safe=(channel:LiveChannel)=>!isAdultLiveChannel(channel,catalog);
  const saved=(options.preference||lastLiveChannel).read();
  const find=async(groupId:string,predicate:(channel:LiveChannel)=>boolean)=>{
    let offset=0;
    for(let pages=0;pages<1000;pages++){
      await check();const page=await options.loadPage(groupId,offset,48);await check();
      const found=page.channels.find(channel=>channel.groupId===groupId && safe(channel) && predicate(channel));if(found)return found;
      if(page.nextOffset===null || page.nextOffset<=offset)return;
      offset=page.nextOffset;
    }
  };
  if(saved && catalog.groups.some(group=>group.id===saved.groupId && !isAdultClassification(group.name))){
    const channel=await find(saved.groupId,c=>c.id===saved.channelId && liveChannelFingerprint(c,catalog)===saved.fingerprint);
    if(channel)return channel;
  }
  for(const group of catalog.groups){
    if(isAdultClassification(group.name))continue;
    const channel=await find(group.id,()=>true);if(channel)return channel;
  }
  return undefined;
}
