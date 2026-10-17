import {useEffect,useLayoutEffect,useState} from 'react';
import type {RouteLocation} from '../navigation/route-state.ts';

export const CATALOG_RETURN_EXPAND='xandeflix:catalog-return-expand';
export const CATALOG_RETURN_END='xandeflix:catalog-return-end';
type Offset={top:number;left:number};
interface ReturnPoint {
  card?:string;rail?:string;hero:boolean;viewAll:boolean;horizontal:number;gridCount:number;
  offsets:Record<string,Offset>;
}
interface Request {route:RouteLocation;snapshot:string;home:boolean;point?:ReturnPoint}
const catalogRoute=(route:RouteLocation)=>['home','movies','series'].includes(route.view);
const key=(route:RouteLocation,snapshot:string)=>JSON.stringify([snapshot,route.view,route.itemId||null]);
const sameRoute=(a:RouteLocation,b:RouteLocation)=>a.view===b.view&&a.itemId===b.itemId;
const page=()=>document.querySelector<HTMLElement>('.app-content main');
const scrollers=(root:HTMLElement):Record<string,HTMLElement|null>=>({page:root,content:root.closest('.app-content'),shell:root.closest('.app-shell'),document:document.scrollingElement as HTMLElement|null});

/** RAM-only presentation coordinates; never retains an unmounted page or catalog. */
export class CatalogReturnNavigation {
  private points=new Map<string,ReturnPoint>();
  private snapshot='';
  private origin:HTMLElement|null=null;
  private request:Request|undefined;
  private stopWork:(()=>void)|undefined;

  track(element:Element|null):void {
    const target=element?.closest<HTMLElement>('.media-card[data-catalog-item], .rail-view-all, .hero-actions button');
    if(target?.closest('.app-content main'))this.origin=target;
  }
  private generation(snapshot:string):void {
    if(this.snapshot!==snapshot){this.clearRequest();this.points.clear();this.origin=null;this.snapshot=snapshot;}
  }
  remember(route:RouteLocation,snapshot:string|undefined,card?:string):void {
    if(!snapshot||!catalogRoute(route)){this.origin=null;return;}
    this.generation(snapshot);
    const root=page();if(!root)return;
    let target=this.origin?.isConnected&&root.contains(this.origin)?this.origin:document.activeElement as HTMLElement|null;
    if(card&&target?.dataset.catalogItem!==card)target=Array.from(root.querySelectorAll<HTMLElement>('[data-catalog-item]')).find(node=>node.dataset.catalogItem===card)||null;
    const rail=target?.closest<HTMLElement>('.media-rail');
    const offsets:Record<string,Offset>={};
    for(const[name,node]of Object.entries(scrollers(root)))if(node)offsets[name]={top:node.scrollTop,left:node.scrollLeft};
    const point:ReturnPoint={card:target?.dataset.catalogItem,rail:rail?.getAttribute('aria-labelledby')||undefined,
      hero:Boolean(target?.closest('.hero-banner')),viewAll:Boolean(target?.classList.contains('rail-view-all')),
      horizontal:rail?.querySelector<HTMLElement>('.media-rail-track')?.scrollLeft||0,
      gridCount:root.querySelectorAll('.catalog-grid [data-catalog-item]').length,offsets};
    const entry=key(route,snapshot);this.points.delete(entry);this.points.set(entry,point);
    while(this.points.size>16)this.points.delete(this.points.keys().next().value!);
    this.origin=null;
  }
  clearRequest():void {this.stopWork?.();this.stopWork=undefined;this.request=undefined;}
  requestHome(snapshot:string|undefined):void {
    this.clearRequest();if(!snapshot)return;this.generation(snapshot);
    this.request={route:{view:'home'},snapshot,home:true};this.origin=null;
  }
  requestBack(route:RouteLocation,snapshot:string|undefined):void {
    this.clearRequest();if(!snapshot)return;this.generation(snapshot);
    const point=this.points.get(key(route,snapshot));
    if(catalogRoute(route)&&point)this.request={route,snapshot,home:false,point};
    this.origin=null;
  }
  apply(route:RouteLocation,snapshot:string|undefined):()=>void {
    if(snapshot)this.generation(snapshot);
    const request=this.request;
    if(!request||snapshot!==request.snapshot||!sameRoute(route,request.route))return()=>{};
    this.stopWork?.();
    let stopped=false,frame=0,expanded=false,root:HTMLElement|null=null;
    const finish=()=>{
      if(stopped)return;stopped=true;observer.disconnect();cancelAnimationFrame(frame);clearTimeout(deadline);
      for(const event of ['keydown','pointerdown','wheel'])window.removeEventListener(event,finish,true);
      root?.dispatchEvent(new Event(CATALOG_RETURN_END));
      if(this.request===request)this.request=undefined;
      if(this.stopWork===finish)this.stopWork=undefined;
    };
    const restore=()=>{
      frame=0;if(stopped)return;
      root=page();if(!root)return;
      if(request.home){
        if(!root.classList.contains('home-page'))return;
        const hero=root.querySelector<HTMLElement>('.hero-banner');
        for(const node of Object.values(scrollers(root)))if(node){node.scrollTop=0;node.scrollLeft=0;}
        const action=hero?.querySelector<HTMLElement>('.hero-actions button:not([disabled])');
        if(action){action.focus({preventScroll:true});finish();}return;
      }
      const point=request.point!;
      if(!expanded&&point.gridCount>48){root.dispatchEvent(new CustomEvent(CATALOG_RETURN_EXPAND,{detail:{count:point.gridCount}}));expanded=true;}
      for(const[name,node]of Object.entries(scrollers(root))){const offset=point.offsets[name];if(node&&offset){node.scrollTop=offset.top;node.scrollLeft=offset.left;}}
      const line=point.rail?document.getElementById(point.rail)?.closest<HTMLElement>('.media-rail'):null;
      const rail=line&&root.contains(line)?line:null;
      if(rail){rail.scrollIntoView({block:'center',inline:'nearest',behavior:'auto'});const track=rail.querySelector<HTMLElement>('.media-rail-track');if(track)track.scrollLeft=point.horizontal;}
      const container=rail||root;
      const target=point.card?Array.from(container.querySelectorAll<HTMLElement>('[data-catalog-item]')).find(node=>node.dataset.catalogItem===point.card)
        :point.viewAll?rail?.querySelector<HTMLElement>('.rail-view-all')
          :point.hero?root.querySelector<HTMLElement>('.hero-actions button:not([disabled])'):undefined;
      if(target){target.focus({preventScroll:true});target.scrollIntoView({block:'nearest',inline:'nearest',behavior:'auto'});
        if(!target.closest('.media-rail-skeleton'))finish();}
      else if(rail)rail.querySelector<HTMLElement>('.rail-view-all')?.focus({preventScroll:true});
    };
    const schedule=()=>{if(!stopped&&!frame)frame=requestAnimationFrame(restore);};
    const observer=new MutationObserver(schedule);
    observer.observe(document.querySelector('.app-content')||document.body,{childList:true,subtree:true});
    const deadline=setTimeout(finish,12000);
    for(const event of ['keydown','pointerdown','wheel'])window.addEventListener(event,finish,true);
    this.stopWork=finish;
    // Collection's existing first-focus RAF runs first; restore on the following frame.
    frame=requestAnimationFrame(()=>{frame=0;schedule();});
    return finish;
  }
  dispose():void {this.clearRequest();this.points.clear();this.origin=null;}
}

export function useCatalogReturnNavigation(route:RouteLocation,snapshot:string|undefined):CatalogReturnNavigation {
  const[memory]=useState(()=>new CatalogReturnNavigation());
  useEffect(()=>{
    const track=(event:Event)=>{if(event.target instanceof Element)memory.track(event.target);};
    document.addEventListener('click',track,true);document.addEventListener('focusin',track,true);
    return()=>{document.removeEventListener('click',track,true);document.removeEventListener('focusin',track,true);memory.dispose();};
  },[memory]);
  useLayoutEffect(()=>memory.apply(route,snapshot),[memory,route.view,route.itemId,snapshot]);
  return memory;
}
