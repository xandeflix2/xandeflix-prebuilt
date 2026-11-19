import React,{useCallback,useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react';
import type {CatalogGridProps} from './CatalogGrid.tsx';
import {MediaCard} from './MediaCard.tsx';
import {useParentalControl} from '../hooks/useParentalControl.ts';
import {canShowParentalItem} from '../../parental/parental-content.ts';
import {CATALOG_RETURN_EXPAND,CATALOG_RETURN_END} from '../hooks/useCatalogReturnNavigation.ts';
import {gridRowRanges,gridTarget} from '../catalog-grid-window.ts';

interface FocusRequest {index:number;previous:Element|null}

/** Category collections only. Existing readers own cursors, cancellation and source order. */
export function VirtualCatalogGrid({items:input,onItemClick,emptyMessage='Nenhum item encontrado nesta seleção.',hasMoreRemote=false,isLoadingRemote=false,onLoadMoreRemote,autoLoadMore=true,loadMoreFailed=false,getItemKey}:CatalogGridProps):React.ReactElement {
  const parental=useParentalControl();
  const items=useMemo(()=>{const seen=new Set<string>();return input.filter(item=>{
    const key=item.kind+':'+item.id;if(seen.has(key)||!canShowParentalItem(item))return false;seen.add(key);return true;
  });},[input,parental.revision]);
  const root=useRef<HTMLDivElement>(null),grid=useRef<HTMLDivElement>(null),sentinel=useRef<HTMLDivElement>(null);
  const mounted=useRef(true),busy=useRef(false),lastRepeat=useRef(0);
  const [requesting,setRequesting]=useState(false),[failed,setFailed]=useState(false);
  const [focused,setFocused]=useState(-1),[pending,setPending]=useState<FocusRequest|null>(null),[restore,setRestore]=useState(-1);
  const [layout,setLayout]=useState({columns:1,unit:300,gap:12,first:0,visible:3});
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
  const requestPage=useCallback(async(retry=false)=>{
    if(busy.current||isLoadingRemote||!hasMoreRemote||!onLoadMoreRemote||(!retry&&(failed||loadMoreFailed)))return;
    busy.current=true;setRequesting(true);setFailed(false);
    try{await onLoadMoreRemote();}catch{if(mounted.current)setFailed(true);}
    finally{busy.current=false;if(mounted.current)setRequesting(false);}
  },[isLoadingRemote,hasMoreRemote,onLoadMoreRemote,failed,loadMoreFailed]);

  useLayoutEffect(()=>{
    const element=grid.current;if(!element)return;
    let frame=0;
    const measure=()=>{
      frame=0;const style=getComputedStyle(element),template=style.gridTemplateColumns;
      const columns=template&&template!=='none'?template.trim().split(/\s+/).length:1;
      const card=element.querySelector<HTMLElement>('.media-card'),height=card?.getBoundingClientRect().height||288;
      const gap=parseFloat(style.rowGap)||0,unit=height+gap,top=element.getBoundingClientRect().top;
      const first=Math.max(0,Math.floor(-top/unit)),visible=Math.ceil(innerHeight/unit)+1;
      setLayout(old=>old.columns===columns&&Math.abs(old.unit-unit)<.5&&old.gap===gap&&old.first===first&&old.visible===visible?old:{columns,unit,gap,first,visible});
    };
    const schedule=()=>{if(!frame)frame=requestAnimationFrame(measure);};
    const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(schedule);observer?.observe(element);
    document.addEventListener('scroll',schedule,{capture:true,passive:true});window.addEventListener('resize',schedule);measure();
    return()=>{observer?.disconnect();document.removeEventListener('scroll',schedule,true);window.removeEventListener('resize',schedule);if(frame)cancelAnimationFrame(frame);};
  },[items.length===0]);

  useLayoutEffect(()=>{
    const page=root.current?.closest('main');if(!page)return;
    const expand=(event:Event)=>{const count=(event as CustomEvent<{count:number}>).detail?.count;if(typeof count==='number'&&Number.isSafeInteger(count)&&count>0)setRestore(count-1);};
    const end=()=>setRestore(-1);
    page.addEventListener(CATALOG_RETURN_EXPAND,expand);page.addEventListener(CATALOG_RETURN_END,end);
    return()=>{page.removeEventListener(CATALOG_RETURN_EXPAND,expand);page.removeEventListener(CATALOG_RETURN_END,end);};
  },[]);
  useEffect(()=>{if(restore>=items.length&&hasMoreRemote&&!isLoadingRemote&&!requesting)void requestPage();},[restore,items.length,hasMoreRemote,isLoadingRemote,requesting,requestPage]);
  useEffect(()=>{
    const target=sentinel.current;
    if(!autoLoadMore||!target||!hasMoreRemote||failed||loadMoreFailed||isLoadingRemote||requesting||typeof IntersectionObserver==='undefined')return;
    const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting))void requestPage();},{rootMargin:'240px'});
    observer.observe(target);return()=>observer.disconnect();
  },[autoLoadMore,hasMoreRemote,failed,loadMoreFailed,isLoadingRemote,requesting,requestPage,items.length]);

  useLayoutEffect(()=>{
    if(!pending)return;
    const index=pending.index<items.length?pending.index:hasMoreRemote?pending.index:Math.min(pending.index,items.length-1);
    const target=grid.current?.querySelector<HTMLButtonElement>(`[data-grid-index="${index}"] .media-card`);
    if(!target)return;
    if(document.activeElement===pending.previous){target.focus({preventScroll:true});target.scrollIntoView({block:'nearest',inline:'nearest',behavior:'auto'});}
    setPending(null);
  },[pending,items.length,hasMoreRemote]);

  const move=(event:React.KeyboardEvent<HTMLDivElement>)=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)||event.altKey||event.ctrlKey||event.metaKey)return;
    const slot=(event.target as HTMLElement).closest<HTMLElement>('[data-grid-index]');if(!slot)return;
    const index=Number(slot.dataset.gridIndex),column=index%layout.columns;
    // Keep the existing way out to the sidebar/hero; other edges stay on the same row.
    if(event.key==='ArrowLeft'&&column===0){
      event.preventDefault();event.stopPropagation();
      const side=grid.current?.closest('.app-shell--side-nav')?.querySelector<HTMLElement>('.header-nav .nav-link.active, .header-nav .focusable-item');
      side?.focus({preventScroll:true});return;
    }
    if(event.key==='ArrowUp'&&index<layout.columns)return;
    event.preventDefault();event.stopPropagation();
    const now=performance.now();if(event.repeat&&now-lastRepeat.current<55)return;lastRepeat.current=now;
    let next=gridTarget(index,event.key,items.length,layout.columns);
    if(event.key==='ArrowDown'&&next===index&&hasMoreRemote){next=index+layout.columns;void requestPage();}
    if(next!==index)setPending({index:next,previous:document.activeElement});
  };
  const retained=pending?(hasMoreRemote?pending.index:Math.min(pending.index,items.length-1)):restore;
  const ranges=gridRowRanges(items.length,layout.columns,layout.first,layout.visible,[focused,retained]);
  const children:React.ReactNode[]=[];
  let row=0;
  const spacer=(rows:number,key:string)=>rows>0&&children.push(<div key={key} className="catalog-grid-row-spacer" aria-hidden="true" style={{height:Math.max(0,rows*layout.unit-layout.gap)}}/>);
  for(const range of ranges){
    spacer(range.start-row,'before-'+range.start);
    for(let index=range.start*layout.columns;index<Math.min(items.length,range.end*layout.columns);index++){
      const item=items[index];children.push(<div key={getItemKey?getItemKey(item):item.kind+':'+item.id} className="catalog-grid-slot" data-grid-index={index}>
        <MediaCard item={item} onClick={onItemClick}/>
      </div>);
    }
    row=range.end;
  }
  spacer(Math.ceil(items.length/layout.columns)-row,'after');
  return <div ref={root} className="catalog-grid-container catalog-grid-container--windowed">
    <div ref={grid} className="catalog-grid catalog-grid--windowed" onKeyDownCapture={move} onFocusCapture={event=>{
      const slot=(event.target as HTMLElement).closest<HTMLElement>('[data-grid-index]');if(!slot)return;
      const index=Number(slot.dataset.gridIndex);setFocused(index);
      if(items.length-1-index<layout.columns*2)void requestPage();
    }}>{children}</div>
    {!items.length&&!isLoadingRemote&&<p>{emptyMessage}</p>}
    {(hasMoreRemote||isLoadingRemote||requesting||failed||loadMoreFailed)&&<div ref={sentinel} className="catalog-grid-sentinel">
      {failed||loadMoreFailed?<><p role="status">Não foi possível carregar os próximos títulos.</p><button type="button" className="focusable-item btn-secondary" onClick={()=>void requestPage(true)}>Tentar novamente</button></>
        :<span role="status" aria-live="polite">{requesting||isLoadingRemote?'Carregando…':''}</span>}
    </div>}
  </div>;
}
