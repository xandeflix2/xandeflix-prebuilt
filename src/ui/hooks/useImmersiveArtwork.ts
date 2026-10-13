import {useEffect,useRef} from 'react';
import {paletteForImage} from '../../artwork/artwork-palette.ts';

export function useImmersiveArtwork(identity:string|undefined){
  const root=useRef<HTMLElement|null>(null);
  useEffect(()=>{
    const element=root.current;if(!element)return;
    const page=element.closest<HTMLElement>('.page-container')||element;
    let frame=0;
    const reset=()=>{page.style.removeProperty('--artwork-base');page.style.removeProperty('--artwork-ambient');page.classList.remove('immersive-background');};
    const sample=()=>{
      frame=0;
      const images=[...element.querySelectorAll<HTMLImageElement>('img[data-immersive-artwork]')];
      const image=images.find(img=>img.dataset.immersiveArtwork==='backdrop' && img.complete && img.naturalWidth)||images.find(img=>img.complete && img.naturalWidth);
      const palette=image && paletteForImage(image);if(!palette){reset();return;}
      page.style.setProperty('--artwork-base',palette.base);page.style.setProperty('--artwork-ambient',palette.ambient);page.classList.add('immersive-background');
    };
    const schedule=()=>{if(!frame)frame=requestAnimationFrame(sample);};
    const observer=new MutationObserver(schedule);observer.observe(element,{subtree:true,childList:true,attributes:true,attributeFilter:['src']});
    element.addEventListener('load',schedule,true);element.addEventListener('error',schedule,true);schedule();
    return()=>{observer.disconnect();element.removeEventListener('load',schedule,true);element.removeEventListener('error',schedule,true);cancelAnimationFrame(frame);reset();};
  },[identity]);
  return root;
}
