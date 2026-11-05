import {useEffect,useState} from 'react';
import {observeArtwork} from '../../artwork/artwork-visibility.ts';
import {loadImage} from '../../artwork/image-load-queue.ts';
/** Reserved decorative scene slot, using the existing shared visibility/transport/decode queues. */
export function EpisodeStill({uri,source}:{uri:string|undefined;source?:'episode'|'series'}){
  const [element,setElement]=useState<HTMLDivElement|null>(null),[visibility,setVisibility]=useState({near:false,visible:false});
  const [ready,setReady]=useState<{uri:string;src:string}>(),[attempt,setAttempt]=useState(0);
  useEffect(()=>element?observeArtwork(element,setVisibility):undefined,[element]);
  useEffect(()=>{
    if(!uri||!element||!visibility.near&&!visibility.visible)return;
    const controller=new AbortController();let retry:ReturnType<typeof setTimeout>|undefined;
    void loadImage(uri,visibility.visible,controller.signal,element.getBoundingClientRect().top).then(value=>{
      if(controller.signal.aborted)return;
      if(value.ok&&value.src)setReady({uri,src:value.src});
      else if(value.deferred)retry=setTimeout(()=>setAttempt(n=>n+1),500);
    });
    return()=>{controller.abort();if(retry)clearTimeout(retry);};
  },[uri,element,visibility.near,visibility.visible,attempt]);
  const shown=ready?.uri===uri?ready:undefined;
  return <div ref={setElement} className="episode-scene" data-artwork-kind={source} aria-hidden="true">
    {shown?<img className="episode-scene-image" src={shown.src} alt="" decoding="async" onError={()=>setReady(undefined)}/>:<span className="episode-scene-placeholder">Cena indisponível</span>}
  </div>;
}
