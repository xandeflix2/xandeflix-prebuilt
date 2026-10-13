import { acquireCachedArtworkUri,usesArtworkFileCache } from './artwork-file-cache.ts';
type Loaded = {ok:boolean;width:number;height:number;src?:string;cancelled?:boolean;deferred?:boolean};
type Job = {uri:string;promise:Promise<Loaded>;resolve:(value:Loaded)=>void;queued:boolean;persistent:boolean;priority:boolean;rank:number;fetching:boolean;acquired:boolean;src?:string;settled:boolean;timer?:ReturnType<typeof setTimeout>;stop?:()=>void;signals:Set<AbortSignal>;cleanup:Array<()=>void>};
const recent=new Map<string,Loaded>(),pending=new Map<string,Job>(),queue:Job[]=[];
let active=0,acquiring=0,reservations=0,draining=false;
const empty=(extra:Partial<Loaded>={}):Loaded=>({ok:false,width:0,height:0,...extra});
function next(predicate:(job:Job)=>boolean):number {
  let best=-1;
  for(let n=0;n<queue.length;n++)if(predicate(queue[n]) && (best<0 || (queue[n].priority && (!queue[best].priority || queue[n].rank<queue[best].rank))))best=n;
  return best;
}
function remove(job:Job):void {const index=queue.indexOf(job);if(index>=0)queue.splice(index,1);job.queued=false;}
function finish(job:Job,value:Loaded):void {
  if(job.settled)return;job.settled=true;clearTimeout(job.timer);
  for(const cleanup of job.cleanup)cleanup();
  if(pending.get(job.uri)===job)pending.delete(job.uri);
  job.resolve(value);
}
/** Fire's decode promise can await stalled compositor frames after bytes are ready.
 * Read one local-cache pixel to materialize the bitmap; never export its contents. */
function confirmLocalFireBitmap(image:HTMLImageElement,src:string):boolean {
  if(!usesArtworkFileCache() || typeof document==='undefined' || !document.querySelector('.app-shell--fire-stick') ||
    !image.complete || !image.naturalWidth || !image.naturalHeight)return false;
  let canvas:HTMLCanvasElement|undefined;
  try {
    const url=new URL(src);
    if(url.origin!==document.location.origin || !url.pathname.startsWith('/_capacitor_file_/'))return false;
    canvas=document.createElement('canvas');canvas.width=canvas.height=1;
    const context=canvas.getContext('2d');if(!context)return false;
    context.drawImage(image,0,0,1,1);context.getImageData(0,0,1,1);
    return true;
  }catch{return false;}
  finally{if(canvas)canvas.width=canvas.height=0;}
}
function decode(job:Job):void {
  remove(job);active++;const image=new Image();let ended=false;
  const done=(ok:boolean)=>{
    if(ended)return;ended=true;image.onload=image.onerror=null;active--;
    ok=ok && image.naturalWidth>0 && image.naturalHeight>0;
    const value={ok,width:image.naturalWidth||0,height:image.naturalHeight||0,src:ok?job.src:undefined};
    if(ok){recent.set(job.uri,value);while(recent.size>96)recent.delete(recent.keys().next().value!);}else image.removeAttribute('src');
    finish(job,value);drain();
  };
  if(!job.timer)job.timer=setTimeout(()=>done(false),8000);
  job.stop=()=>done(false);image.decoding='async';
  image.onload=()=>{if(confirmLocalFireBitmap(image,job.src!))done(true);else if(typeof image.decode==='function')void image.decode().then(()=>done(true),()=>done(false));else done(true);};
  image.onerror=()=>done(false);image.src=job.src!;
}
function acquire(job:Job):void {
  job.timer=setTimeout(()=>{if(job.stop)job.stop();else{remove(job);finish(job,empty());drain();}},8000);
  if(!usesArtworkFileCache()){job.src=job.uri;job.acquired=true;return;}
  job.fetching=true;acquiring++;
  void acquireCachedArtworkUri(job.uri).then(src=>{
    acquiring--;job.fetching=false;
    if(!job.settled){if(src){job.src=src;job.acquired=true;}else{remove(job);finish(job,empty());}}
    drain();
  },()=>{acquiring--;job.fetching=false;if(!job.settled){remove(job);finish(job,empty());}drain();});
}
/** Two transports overlap two decoders; only two paths/transports may wait for decode. */
function drain():void {
  if(draining)return;draining=true;
  try {
    // AbortSignal is already aborted before its per-job listeners run.
    // Purge every unsubscribed job before freeing a buffer slot can admit more IO.
    for(const job of [...queue])if(!job.persistent && ![...job.signals].some(signal=>!signal.aborted)){
      remove(job);finish(job,empty({cancelled:true}));
    }
    let progress=true;
    while(progress){progress=false;
      while(active<2){const index=next(job=>job.acquired);if(index<0 || (reservations && active>=1 && !queue[index].priority))break;decode(queue[index]);progress=true;}
      while(acquiring+queue.filter(job=>job.acquired).length<2){
        const index=next(job=>!job.acquired && !job.fetching);
        if(index<0 || (reservations && acquiring>=1 && !queue[index].priority))break;
        acquire(queue[index]);progress=true;
      }
    }
  } finally {draining=false;}
}
/** A first hero may arrive after metadata; reserve a slot in each stage. */
export function reserveHeroImageSlot():()=>void {
  reservations++;let released=false;
  const release=()=>{if(released)return;released=true;clearTimeout(timer);reservations--;drain();};
  const timer=setTimeout(release,8000);return release;
}
export function isImageReady(uri:string|undefined):boolean {return !!uri && recent.has(uri);}
function subscribe(job:Job,signal?:AbortSignal):void {
  if(!signal){job.persistent=true;return;}if(job.signals.has(signal))return;
  job.signals.add(signal);
  const abort=()=>{job.signals.delete(signal);if(job.queued && !job.persistent && !job.signals.size){remove(job);finish(job,empty({cancelled:true}));drain();}};
  signal.addEventListener('abort',abort,{once:true});job.cleanup.push(()=>signal.removeEventListener('abort',abort));
}
export function invalidateLoadedImage(uri:string):void {recent.delete(uri);}
export function loadImage(uri:string,priority=false,signal?:AbortSignal,viewportTop?:number):Promise<Loaded>{
  if(signal?.aborted)return Promise.resolve(empty({cancelled:true}));
  if(typeof Image==='undefined')return Promise.resolve(empty());
  const cached=recent.get(uri);if(cached){recent.delete(uri);recent.set(uri,cached);return Promise.resolve(cached);}
  const rank=Number.isFinite(viewportTop)?Math.max(0,viewportTop!):-1;
  const existing=pending.get(uri);if(existing){subscribe(existing,signal);if(priority){existing.rank=existing.priority?Math.min(existing.rank,rank):rank;existing.priority=true;drain();}return existing.promise;}
  if(queue.length>=128)return Promise.resolve(empty({deferred:true}));
  let resolve!:(value:Loaded)=>void;const promise=new Promise<Loaded>(finish=>{resolve=finish});
  const native=usesArtworkFileCache();
  const job:Job={uri,promise,resolve,queued:true,persistent:false,priority,rank,fetching:false,acquired:!native,src:native?undefined:uri,settled:false,signals:new Set(),cleanup:[]};
  pending.set(uri,job);queue.push(job);subscribe(job,signal);drain();return promise;
}
