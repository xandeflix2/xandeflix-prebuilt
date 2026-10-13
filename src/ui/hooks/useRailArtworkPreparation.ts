import {useEffect,useRef,useState} from 'react';

/** Warm the complete bounded rail before horizontal navigation reaches its later cards. */
export function useRailArtworkPreparation(){
  const root=useRef<HTMLElement|null>(null),[prepare,setPrepare]=useState(false);
  useEffect(()=>{
    const element=root.current;if(!element || prepare)return;
    if(typeof IntersectionObserver==='undefined'){setPrepare(true);return;}
    const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){setPrepare(true);observer.disconnect();}},{rootMargin:'600px 0px'});
    observer.observe(element);return()=>observer.disconnect();
  },[prepare]);
  return {root,prepare};
}
