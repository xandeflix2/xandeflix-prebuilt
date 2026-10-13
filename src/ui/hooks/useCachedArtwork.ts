import { useEffect,useState } from 'react';
import { cachedArtworkUri,usesArtworkFileCache,peekCachedArtworkUri,invalidateCachedArtworkUri } from '../../artwork/artwork-file-cache.ts';
export function useCachedArtwork(uri:string|undefined,enabled=true) {
  const [state,setState]=useState<{uri:string;src:string}>();
  const [failed,setFailed]=useState<string>();const native=usesArtworkFileCache();
  useEffect(()=>{
    if(!uri || !enabled || !native)return;
    let current=true;void cachedArtworkUri(uri).then(src=>{if(current)setState({uri,src});});
    return()=>{current=false;};
  },[uri,enabled,native]);
  const src=!native || failed===uri ? uri : peekCachedArtworkUri(uri) || (state && state.uri===uri ? state.src : undefined);
  return {src,handleCacheError:()=>{
    if(uri && src && src!==uri){invalidateCachedArtworkUri(uri);setFailed(uri);return true;}return false;
  }};
}
