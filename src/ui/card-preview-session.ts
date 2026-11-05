export interface PreviewHandle { stop(): void | Promise<void> }
interface Clock { set(callback:()=>void, ms:number):unknown; clear(timer:unknown):void }
const clock:Clock={set:(fn,ms)=>setTimeout(fn,ms),clear:timer=>clearTimeout(timer as ReturnType<typeof setTimeout>)};
/** One lease for the application. Public trailer only; no source playback/session API. */
export class CardPreviewSession {
  private current?:{abort:AbortController;timer?:unknown;startup?:unknown;lifetime?:unknown;handle?:PreviewHandle};
  private queue:Promise<void>=Promise.resolve();
  private enabled=true;
  private time:Clock;
  constructor(time:Clock=clock){this.time=time;}
  setEnabled(enabled:boolean){this.enabled=enabled;if(!enabled)this.cancel();}
  cancel=()=>{
    const lease=this.current;if(!lease)return;this.current=undefined;
    if(lease.timer!==undefined)this.time.clear(lease.timer);
    if(lease.startup!==undefined)this.time.clear(lease.startup);
    if(lease.lifetime!==undefined)this.time.clear(lease.lifetime);
    lease.abort.abort();
    try{const closing=lease.handle?.stop();if(closing)this.queue=this.queue.then(()=>closing).then(()=>{},()=>{});}catch{/* Optional preview cleanup. */}
  };
  schedule<T>(resolve:(signal:AbortSignal)=>Promise<T|null>,open:(value:T,signal:AbortSignal)=>Promise<PreviewHandle|null>,options:{startupMs?:number;delayMs?:number}={}):()=>void {
    this.cancel();if(!this.enabled)return()=>{};
    const lease={abort:new AbortController()} as NonNullable<CardPreviewSession['current']>;this.current=lease;
    const active=()=>this.current===lease&&!lease.abort.signal.aborted&&this.enabled;
    lease.timer=this.time.set(()=>{
      lease.timer=undefined;
      const startupMs=Number.isFinite(options.startupMs)?Math.min(30000,Math.max(8000,options.startupMs!)):8000;
      lease.startup=this.time.set(()=>{if(active())this.cancel();},startupMs);
      void Promise.resolve().then(()=>active()?resolve(lease.abort.signal):null).then(value=>{
        if(!active())return;
        if(value===null){this.time.clear(lease.startup);lease.startup=undefined;return;}
        this.queue=this.queue.then(async()=>{
          if(!active())return;
          const handle=await open(value,lease.abort.signal);
          if(!active()){await handle?.stop();return;}
          if(lease.startup!==undefined)this.time.clear(lease.startup);lease.startup=undefined;
          if(handle){lease.handle=handle;lease.lifetime=this.time.set(()=>{if(active())this.cancel();},45000);}
        }).catch(()=>{});
      },()=>{if(active())this.cancel();});
    },Number.isFinite(options.delayMs)?Math.max(0,Math.min(3000,options.delayMs!)):3000);
    return()=>{if(this.current===lease)this.cancel();};
  }
}
export const cardPreviewSession=new CardPreviewSession();
