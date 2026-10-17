import {useEffect,useRef} from 'react';
import {paletteForImage} from '../../artwork/artwork-palette.ts';
import {isWebValidation,webValidationBuild} from '../../web/validation.ts';

export function useImmersiveArtwork(identity:string|undefined){
  const root=useRef<HTMLElement|null>(null);
  const owner=useRef<{page:HTMLElement;reset:()=>void}|null>(null);
  useEffect(()=>()=>{owner.current?.reset();owner.current=null;},[]);
  useEffect(()=>{
    const element=root.current;if(!element){owner.current?.reset();owner.current=null;return;}
    const page=element.closest<HTMLElement>('.page-container')||element;
    const shell=page.closest<HTMLElement>('.app-shell');
    const fire=Boolean(page.closest('.app-shell--fire-stick'));
    const webController=webValidationBuild && isWebValidation()?new AbortController():undefined;
    let frame=0;
    const reset=()=>{page.style.removeProperty('--artwork-base');page.style.removeProperty('--artwork-ambient');page.style.removeProperty('--artwork-halo-height');shell?.style.removeProperty('--navigation-ambient');page.classList.remove('immersive-background');};
    if(owner.current && owner.current.page!==page)owner.current.reset();
    owner.current={page,reset};
    const sample=()=>{
      frame=0;
      const images=[...element.querySelectorAll<HTMLImageElement>('img[data-immersive-artwork]')];
      const image=images.find(img=>img.dataset.immersiveArtwork==='backdrop' && img.complete && img.naturalWidth)||images.find(img=>img.complete && img.naturalWidth);
      const palette=image && paletteForImage(image);if(!palette){
        if(webValidationBuild && webController && image)void import('../../web/web-artwork-palette.ts')
          .then(({applyWebArtworkPalette})=>applyWebArtworkPalette(image,element,page,shell,webController.signal)).catch(()=>{});
        if(!fire || image)reset();return;}
      const surface=element.matches('.hero-banner')?element:element.querySelector<HTMLElement>('.detail-hero-wide, .series-phone-hero')||image;
      const bottom=Math.max(0,surface!.getBoundingClientRect().bottom-page.getBoundingClientRect().top+page.scrollTop);
      page.style.setProperty('--artwork-halo-height',`${Math.ceil(bottom+32)}px`);
      page.style.setProperty('--artwork-base',palette.base);page.style.setProperty('--artwork-ambient',palette.ambient);page.classList.add('immersive-background');
      shell?.style.setProperty('--navigation-ambient',palette.ambient);
    };
    const schedule=()=>{if(!frame)frame=requestAnimationFrame(sample);};
    const failed=(event:Event)=>{if(fire && (event.target as Element|null)?.matches('img[data-immersive-artwork]'))reset();schedule();};
    const observer=new MutationObserver(schedule);observer.observe(element,{subtree:true,childList:true,attributes:true,attributeFilter:['src']});
    element.addEventListener('load',schedule,true);element.addEventListener('error',failed,true);window.addEventListener('resize',schedule);schedule();
    return()=>{webController?.abort();observer.disconnect();element.removeEventListener('load',schedule,true);element.removeEventListener('error',failed,true);window.removeEventListener('resize',schedule);cancelAnimationFrame(frame);if(!fire)reset();};
  },[identity]);
  return root;
}
