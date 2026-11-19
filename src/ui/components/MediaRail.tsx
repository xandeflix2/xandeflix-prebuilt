/**
 * Xandeflix Prebuilt — MediaRail Component (Gate G6)
 *
 * Faixa temática horizontal de itens com rolagem suave e navegação por D-pad.
 */

import React, { useRef, useState, useMemo, useEffect, useLayoutEffect } from 'react';
import {acceptDpadRepeat} from '../dpad-repeat.ts';
import {railWindow} from '../rail-pagination.ts';
import { createPresentationSeed, orderCategoryItems, isReleaseCategory } from '../../catalog/category-presentation.ts';
import type { CatalogItemViewModel } from '../../catalog/catalog-view-model.ts';
import { MediaCard } from './MediaCard.tsx';
import { useRailArtworkPreparation } from '../hooks/useRailArtworkPreparation.ts';
import { useParentalControl } from '../hooks/useParentalControl.ts';
import { canShowParentalItem } from '../../parental/parental-content.ts';

interface MediaRailProps {
  id: string;
  title: string;
  items: CatalogItemViewModel[];
  onItemClick: (item: CatalogItemViewModel) => void;
  getItemKey?: (item:CatalogItemViewModel)=>string;
  preserveOrder?: boolean;
  onViewAll?: () => void;
  onViewAllFocus?: () => void;
  startupArtworkCount?: number;
  virtualized?:boolean;
  onApproachEnd?:(index:number)=>void;
  onRequestNext?:()=>Promise<void>;
  moreAvailable?:boolean;
  enlargedDpad?:boolean;
  expansionContext?:'home'|'movies'|'series';
}

export const MediaRail = React.memo<MediaRailProps>(function MediaRail({
  id,
  title,
  items,
  onItemClick,
  getItemKey,
  preserveOrder=false,
  onViewAll,
  onViewAllFocus,
  startupArtworkCount = 0,
  virtualized=false,onApproachEnd,onRequestNext,moreAvailable=false,expansionContext,enlargedDpad=false,
}) {
  const parental = useParentalControl();
  items = useMemo(() => items.filter(canShowParentalItem), [items, parental.revision]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const preparation = useRailArtworkPreparation();
  const [seed] = useState(createPresentationSeed);
  const [displayedIds, setDisplayedIds] = useState<string[]>([]);
  const orderedItems = useMemo(() => {
    if (preserveOrder || isReleaseCategory(title)) return items;
    const shuffled = orderCategoryItems(items, title, seed);
    const current = new Map(items.map(item => [item.id, item]));
    const retained = displayedIds.filter(id => current.has(id));
    const retainedSet = new Set(retained);
    return [...retained.map(id => current.get(id)!), ...shuffled.filter(item => !retainedSet.has(item.id))];
  }, [items, title, seed, preserveOrder, displayedIds]);
  useEffect(() => {
    const ids = orderedItems.map(item => item.id);
    setDisplayedIds(previous => previous.length === ids.length && previous.every((id, index) => id === ids[index]) ? previous : ids);
  }, [orderedItems]);
  const [focusedIndex,setFocusedIndex]=useState(0);
  const pendingFocus=useRef<{index:number;previous:Element|null}|undefined>(undefined);
  const [focusRequest,setFocusRequest]=useState(0);
  const window=virtualized?railWindow(orderedItems.length,focusedIndex):{start:0,end:orderedItems.length};
  useLayoutEffect(()=>{
    if(!virtualized)return;
    const root=scrollContainerRef.current;if(!root)return;
    const read=()=>{const card=root.querySelector<HTMLElement>('.media-card:not([data-card-expanded])')||root.querySelector<HTMLElement>('.media-card');if(card&&!card.hasAttribute('data-card-expanded'))root.style.setProperty('--rail-window-width',getComputedStyle(card).width);};
    read();const observer=new ResizeObserver(read);observer.observe(root);document.addEventListener('xandeflix:card-input',read);
    return()=>{observer.disconnect();document.removeEventListener('xandeflix:card-input',read);};
  },[virtualized]);
  useLayoutEffect(()=>{
    const request=pendingFocus.current;if(!request)return;
    if(document.activeElement!==request.previous){pendingFocus.current=undefined;return;}
    const root=scrollContainerRef.current,target=root?.querySelector<HTMLButtonElement>(`[data-rail-index="${request.index}"]`);
    if(target){pendingFocus.current=undefined;target.focus({preventScroll:true});}
  },[focusRequest,window.start,window.end,orderedItems]);
  const move=(event:React.KeyboardEvent<HTMLDivElement>)=>{
    if(!virtualized||!['ArrowLeft','ArrowRight'].includes(event.key))return;
    const current=(event.target as HTMLElement).closest<HTMLElement>('[data-rail-index]');if(!current)return;
    const index=Number(current.dataset.railIndex),next=index+(event.key==='ArrowRight'?1:-1);
    if(next<0)return;
    event.preventDefault();event.stopPropagation();
    if(!acceptDpadRepeat(event))return;
    if(next>=orderedItems.length){if(moreAvailable){pendingFocus.current={index:next,previous:current};void onRequestNext?.();}return;}
    pendingFocus.current={index:next,previous:current};setFocusedIndex(next);setFocusRequest(value=>value+1);
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -320, behavior: 'auto' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 320, behavior: 'auto' });
    }
  };

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <section ref={preparation.root} className="media-rail" aria-labelledby={`rail-title-${id}`} data-startup-rail={startupArtworkCount > 0 || undefined}>
      <div className="media-rail-header">
        <h2 id={`rail-title-${id}`} className="media-rail-title">
          {title}
        </h2>
        <div className="media-rail-controls">
          {onViewAll ? <button type="button" className="focusable-item rail-view-all" onClick={onViewAll}
            onFocus={onViewAllFocus} onMouseEnter={onViewAllFocus} onTouchStart={onViewAllFocus}
            aria-label={`Ver todos: ${title}`}>Ver todos</button> : <>
          <button
            type="button"
            className="rail-scroll-btn"
            tabIndex={-1}
            onClick={scrollLeft}
            aria-label={`Rolar ${title} para esquerda`}
          >
            ‹
          </button>
          <button
            type="button"
            className="rail-scroll-btn"
            tabIndex={-1}
            onClick={scrollRight}
            aria-label={`Rolar ${title} para direita`}
          >
            ›
          </button>
          </>}
        </div>
      </div>
      <div className="media-rail-track" data-card-expansion-context={expansionContext} data-card-dpad-size={enlargedDpad||undefined} ref={scrollContainerRef} data-rail-window={virtualized||undefined} data-rail-current-index={virtualized?focusedIndex:undefined} onKeyDownCapture={move}
        onFocusCapture={event=>{const card=(event.target as HTMLElement).closest<HTMLElement>('[data-rail-index]');if(card){const index=Number(card.dataset.railIndex);setFocusedIndex(index);onApproachEnd?.(index);}}}
        onScroll={event=>{if(!virtualized||document.documentElement.dataset.cardInput==='dpad')return;const root=event.currentTarget;const unit=parseFloat(getComputedStyle(root).getPropertyValue('--rail-window-width'))||180;const index=Math.max(0,Math.floor(root.scrollLeft/(unit+6)));setFocusedIndex(index);onApproachEnd?.(Math.min(orderedItems.length-1,index+6));}}>
        {[...(window.start>0?[<div key="virtual-before" className="rail-virtual-spacer" aria-hidden="true" style={{'--rail-spacer-count':window.start} as React.CSSProperties}/>]:[]),
        ...orderedItems.slice(window.start,window.end).map((item, offset) => {
          const index=window.start+offset;return (
          <MediaCard key={getItemKey?getItemKey(item):item.id} item={item} onClick={onItemClick} prepareArtwork={preparation.prepare}
            railIndex={virtualized?index:undefined} startupArtwork={index < Math.min(8, startupArtworkCount)} />
        );}),
        ...(window.end<orderedItems.length?[<div key="virtual-after" className="rail-virtual-spacer" aria-hidden="true" style={{'--rail-spacer-count':orderedItems.length-window.end} as React.CSSProperties}/>]:[])]}
      </div>
    </section>
  );
});
