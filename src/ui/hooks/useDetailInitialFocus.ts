import {useLayoutEffect,type RefObject} from 'react';

/** Enter a detail once per identity; enrichment must never reset user navigation. */
export function useDetailInitialFocus(root:RefObject<HTMLElement|null>,identity:string,ready:boolean,preferHero=false):void{
  useLayoutEffect(()=>{
    const element=root.current;if(!element)return;
    for(let ancestor=element.parentElement;ancestor;ancestor=ancestor.parentElement){ancestor.scrollTop=0;ancestor.scrollLeft=0;}
    if(document.scrollingElement){document.scrollingElement.scrollTop=0;document.scrollingElement.scrollLeft=0;}
  },[root,identity]);
  useLayoutEffect(()=>{
    if(!ready)return;
    const frame=requestAnimationFrame(()=>{
      const element=root.current;if(!element)return;
      const hero=element.querySelector<HTMLElement>('[data-detail-hero]');if(!hero)return;
      const action=hero.querySelector<HTMLElement>('[data-detail-focus]:not([disabled])');
      (preferHero?hero:action||hero).focus({preventScroll:true});
      for(let ancestor=element.parentElement;ancestor;ancestor=ancestor.parentElement){ancestor.scrollTop=0;ancestor.scrollLeft=0;}
      if(document.scrollingElement){document.scrollingElement.scrollTop=0;document.scrollingElement.scrollLeft=0;}
    });
    return()=>cancelAnimationFrame(frame);
  },[root,identity,ready,preferHero]);
}
