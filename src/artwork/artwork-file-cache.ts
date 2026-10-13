import { Capacitor, registerPlugin } from '@capacitor/core';
const plugin=registerPlugin<{get(options:{uri:string}):Promise<{path:string}>}>('ArtworkCache');
const pending=new Map<string,Promise<string|undefined>>();
const ready=new Map<string,{src:string;expires:number}>();
const unavailable=new Map<string,number>();
export function peekCachedArtworkUri(uri:string|undefined):string|undefined {
  if(!uri)return;const entry=ready.get(uri);if(!entry)return;
  if(entry.expires<=Date.now()){ready.delete(uri);return;}
  ready.delete(uri);ready.set(uri,entry);return entry.src;
}
export function invalidateCachedArtworkUri(uri:string):void {ready.delete(uri);unavailable.delete(uri);}
export function usesArtworkFileCache():boolean {
  return Capacitor.getPlatform()==='android' && Capacitor.isPluginAvailable('ArtworkCache');
}
/** Source URI only in RAM/IPC; disk has image bytes and opaque keys. */
export function acquireCachedArtworkUri(uri:string):Promise<string|undefined> {
  if(!usesArtworkFileCache())return Promise.resolve(uri);
  const cached=peekCachedArtworkUri(uri);if(cached)return Promise.resolve(cached);
  const expires=unavailable.get(uri);if(expires && expires>Date.now())return Promise.resolve(undefined);
  unavailable.delete(uri);
  const existing=pending.get(uri);if(existing)return existing;
  if(pending.size>=64)return Promise.resolve(uri);
  const job=plugin.get({uri}).then(({path})=>{
    const src=Capacitor.convertFileSrc(path);ready.delete(uri);ready.set(uri,{src,expires:Date.now()+5*60*1000});
    while(ready.size>128)ready.delete(ready.keys().next().value!);return src;
  },(error:unknown)=>{
    const failure=error as {code?:string;message?:string}|undefined;
    if(failure?.code==='CACHE_SOURCE_UNAVAILABLE' || failure?.message==='CACHE_SOURCE_UNAVAILABLE'){
      unavailable.delete(uri);unavailable.set(uri,Date.now()+60000);
      while(unavailable.size>128)unavailable.delete(unavailable.keys().next().value!);
      return undefined;
    }
    return uri;
  });
  pending.set(uri,job);void job.finally(()=>pending.delete(uri));return job;
}
/** Legacy consumers may still attempt direct transport when the cache rejects. */
export function cachedArtworkUri(uri:string):Promise<string> {
  return acquireCachedArtworkUri(uri).then(src=>src||uri);
}
