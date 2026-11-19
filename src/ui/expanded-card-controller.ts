import type {CatalogItemViewModel} from '../catalog/catalog-view-model.ts';
import {cardPreviewSession} from './card-preview-session.ts';
export const CARD_FOCUS='xandeflix:card-focus',CARD_LEAVE='xandeflix:card-leave';
export interface CardSelection {element:HTMLButtonElement;item:CatalogItemViewModel;generation:number;identity:string;focusedAt?:number}
let mode:'dpad'|'pointer'='pointer';
export function eligibleExpansionRail(element:Element):HTMLElement|null {
  const root=element.closest<HTMLElement>('.media-rail-track[data-card-expansion-context],.media-rail-track[data-card-dpad-size]');
  const context=root?.dataset.cardExpansionContext,page=root?.closest<HTMLElement>('main[data-card-expansion-page]');
  return root&&root.isConnected&&context&&['home','movies','series'].includes(context)
    &&page?.dataset.cardExpansionPage===context&&!root.closest('.catalog-grid,.category-collection-page,.home-collection-page')?root:null;
}
export function cardRowGeometry(available:number,base:number,gap:number){
  const width=Math.min(available,Math.round(base*1.2*100)/100),height=Math.max(200,width*1.5);
  const expanded=Math.min(available,height*16/9),delta=Math.max(0,expanded-width);
  return {width,height,expanded,delta,columns:Math.max(1,Math.floor((available-delta+gap)/(width+gap)))};
}
/** Event delegation keeps startup and render cost independent of the number of cards. */
export function installExpandedCards(enabled:boolean,select:(value:CardSelection|null)=>void):()=>void {
  const page=enabled?document.querySelector<HTMLElement>('main[data-card-expansion-page]'):null;
  if(!page)return()=>{};
  let current:CardSelection|null=null,generation=0,frame=0,anchorFrame=0,disposed=false;
  const prepared=new Set<HTMLElement>(),observed=new Set<HTMLElement>(),near=new Set<HTMLElement>();
  const container=eligibleExpansionRail;
  const shapes=new Map<HTMLElement,ReturnType<typeof cardRowGeometry>&{gap:number}>();
  const sizing=(root:HTMLElement)=>container(root)===root||Boolean(root.matches('.media-rail-track[data-card-dpad-size]')&&root.closest('main[data-card-expansion-page]')&&!root.closest('.home-collection-page,.category-collection-page'));
  const alignAnchor=()=>{
    if(anchorFrame||!current||disposed)return;
    const selection=current;
    anchorFrame=requestAnimationFrame(()=>{
      anchorFrame=0;if(current!==selection||!selection.element.isConnected||document.activeElement!==selection.element)return;
      const root=container(selection.element);if(!root?.classList.contains('media-rail-track'))return;
      const shape=shapes.get(root);if(!shape)return;
      const index=selection.element.hasAttribute('data-rail-index')?Number(selection.element.dataset.railIndex):Array.from(root.children).filter(child=>child.matches('.media-card')).indexOf(selection.element);
      if(index>=0)root.scrollLeft=index*(shape.width+shape.gap);
    });
  };
  const clearSelection=(notify=true)=>{
    if(anchorFrame)cancelAnimationFrame(anchorFrame);anchorFrame=0;
    cardPreviewSession.cancel();
    if(current){current.element.removeAttribute('data-card-expanded');current=null;if(notify)select(null);}
  };
  const prepare=(root:HTMLElement)=>{
    if(!enabled||mode!=='dpad'||!root.isConnected||!sizing(root))return;
    if(root.hasAttribute('data-card-dpad-ready'))return;
    const card=root.querySelector<HTMLElement>('.media-card');if(!card)return;
    const base=parseFloat(getComputedStyle(card).width),available=root.clientWidth;
    if(!Number.isFinite(base)||base<=0||available<=0)return;
    const rootStyle=getComputedStyle(root),gap=parseFloat(rootStyle.columnGap)||8;
    const shape=cardRowGeometry(available,base,gap);
    root.style.setProperty('--card-dpad-width',shape.width+'px');root.style.setProperty('--card-dpad-height',shape.height+'px');
    root.style.setProperty('--card-dpad-expanded',shape.expanded+'px');root.style.setProperty('--card-dpad-delta',shape.delta+'px');root.style.setProperty('--card-dpad-columns',String(shape.columns));
    root.style.setProperty('--card-dpad-gap',gap+'px');root.style.setProperty('--card-dpad-tail',Math.max(0,available-shape.expanded-gap-(parseFloat(rootStyle.paddingLeft)||0)-(parseFloat(rootStyle.paddingRight)||0))+'px');
    shapes.set(root,{...shape,gap});root.setAttribute('data-card-dpad-ready','');prepared.add(root);
  };
  const expand=(selection:CardSelection)=>{
    const root=container(selection.element);if(!root)return;
    prepare(root);if(!root.hasAttribute('data-card-dpad-ready'))return;
    selection.element.setAttribute('data-card-expanded','');

  };
  const inView=typeof IntersectionObserver==='undefined'
    ? {observe:(root:HTMLElement)=>{near.add(root);prepare(root);},unobserve:(_root:HTMLElement)=>{},disconnect:()=>{}}
    : new IntersectionObserver(entries=>{for(const entry of entries){const root=entry.target as HTMLElement;if(entry.isIntersecting){near.add(root);prepare(root);}else near.delete(root);}},{rootMargin:'160px'});
  const scan=()=>{
    frame=0;if(disposed)return;
    if(current&&(!container(current.element)||current.element.dataset.cardPreviewIdentity!==current.identity))clearSelection();
    for(const root of observed)if(!sizing(root)){
      inView.unobserve(root);observed.delete(root);near.delete(root);prepared.delete(root);shapes.delete(root);
      root.removeAttribute('data-card-dpad-ready');
      for(const key of['width','height','expanded','delta','columns','gap','tail'])root.style.removeProperty('--card-dpad-'+key);
    }
    if(!enabled)return;
    for(const root of page.querySelectorAll<HTMLElement>('.media-rail-track[data-card-expansion-context]'))if(sizing(root)&&!observed.has(root)){observed.add(root);inView.observe(root);}
  };
  const scheduleScan=()=>{if(!frame)frame=requestAnimationFrame(scan);};
  const setMode=(next:typeof mode)=>{
    if(next===mode)return;mode=next;clearSelection();document.documentElement.dataset.cardInput=mode;
    document.dispatchEvent(new Event('xandeflix:card-input'));
    if(mode==='dpad'){for(const root of prepared)root.removeAttribute('data-card-dpad-ready');for(const root of near)prepare(root);}
  };
  const key=(event:KeyboardEvent)=>{
    if(event.altKey||event.ctrlKey||event.metaKey||event.target instanceof HTMLInputElement||event.target instanceof HTMLTextAreaElement||(event.target as HTMLElement)?.isContentEditable)return;
    if(['Enter',' ','Escape','Backspace'].includes(event.key)||event.keyCode===23)clearSelection();
    if(event.key==='Tab')setMode('pointer');
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))setMode('dpad');
  };
  const pointer=()=>setMode('pointer');
  const focus=(event:Event)=>{
    if(!enabled||mode!=='dpad'||document.hidden)return;
    const element=event.target,item=(event as CustomEvent<{item:CatalogItemViewModel}>).detail?.item;
    if(element instanceof HTMLButtonElement&&element===document.activeElement){const root=element.closest<HTMLElement>('.media-rail-track');if(root&&sizing(root))prepare(root);}
    if(!(element instanceof HTMLButtonElement)||element!==document.activeElement||!container(element)||!item||!['movie','series'].includes(item.kind))return;
    clearSelection(false);current={element,item,generation:++generation,identity:element.dataset.cardPreviewIdentity||'',focusedAt:performance.now()};expand(current);alignAnchor();select(current);
  };
  const leave=(event:Event)=>{if(event.type!==CARD_LEAVE||!current||event.target===current.element)clearSelection();};
  const resize=()=>{for(const root of prepared)root.removeAttribute('data-card-dpad-ready');for(const root of near)prepare(root);if(current){expand(current);alignAnchor();}};
  const hidden=()=>{if(document.hidden)clearSelection();};
  const mutation=new MutationObserver(entries=>{
    if(current&&(!current.element.isConnected||!container(current.element)||current.element.dataset.cardPreviewIdentity!==current.identity))clearSelection();
    // Artwork/text changes do not change the rail inventory. Scan only new/removed tracks or opt-in changes.
    if(entries.some(entry=>entry.type==='attributes'&&entry.attributeName!=='data-card-preview-identity'||Array.from([...entry.addedNodes,...entry.removedNodes]).some(node=>node instanceof Element&&(node.matches('.media-rail-track')||node.querySelector('.media-rail-track')))))scheduleScan();
  });mutation.observe(page,{childList:true,subtree:true,attributes:true,attributeFilter:['data-card-preview-identity','data-card-expansion-context','data-card-expansion-page','data-card-dpad-size']});
  document.documentElement.dataset.cardInput=mode;
  document.addEventListener('keydown',key,true);document.addEventListener('pointerdown',pointer,true);document.addEventListener('touchstart',pointer,{capture:true,passive:true});
  document.addEventListener('wheel',pointer,{capture:true,passive:true});
  document.addEventListener(CARD_FOCUS,focus);document.addEventListener(CARD_LEAVE,leave);document.addEventListener('visibilitychange',hidden);window.addEventListener('pagehide',leave);window.addEventListener('blur',leave);window.addEventListener('resize',resize);scan();
  return()=>{disposed=true;clearSelection();if(frame)cancelAnimationFrame(frame);inView.disconnect();mutation.disconnect();
    document.removeEventListener('keydown',key,true);document.removeEventListener('pointerdown',pointer,true);document.removeEventListener('touchstart',pointer,true);document.removeEventListener('wheel',pointer,true);document.removeEventListener(CARD_FOCUS,focus);document.removeEventListener(CARD_LEAVE,leave);document.removeEventListener('visibilitychange',hidden);window.removeEventListener('pagehide',leave);window.removeEventListener('blur',leave);window.removeEventListener('resize',resize);
    for(const root of prepared){root.removeAttribute('data-card-dpad-ready');for(const key of['width','height','expanded','delta','columns','gap','tail'])root.style.removeProperty('--card-dpad-'+key);}prepared.clear();observed.clear();near.clear();};
}
