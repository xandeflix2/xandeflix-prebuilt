import React, { useCallback, useEffect, useRef, useState } from 'react';
import { type CatalogItemViewModel, GRID_BATCH_SIZE } from '../../catalog/catalog-view-model.ts';
import { MediaCard } from './MediaCard.tsx';
import { useParentalControl } from '../hooks/useParentalControl.ts';
import { canShowParentalItem } from '../../parental/parental-content.ts';
import { CATALOG_RETURN_EXPAND, CATALOG_RETURN_END } from '../hooks/useCatalogReturnNavigation.ts';
interface CatalogGridProps { items: CatalogItemViewModel[]; onItemClick: (item: CatalogItemViewModel) => void; emptyMessage?: string; hasMoreRemote?: boolean; isLoadingRemote?: boolean; onLoadMoreRemote?: () => void | Promise<void>; autoLoadMore?: boolean; loadMoreFailed?: boolean; getItemKey?: (item: CatalogItemViewModel) => React.Key; }
export const CatalogGrid: React.FC<CatalogGridProps> = ({ items, onItemClick, emptyMessage = 'Nenhum item encontrado nesta seleção.', hasMoreRemote, isLoadingRemote, onLoadMoreRemote, autoLoadMore = false, loadMoreFailed = false, getItemKey }) => {
  const parental = useParentalControl();
  items = React.useMemo(() => items.filter(canShowParentalItem), [items, parental.revision]);
  const [visibleCount, setVisibleCount] = useState(GRID_BATCH_SIZE);
  const [requesting, setRequesting] = useState(false);
  const requestingRef = useRef(false), sentinelRef = useRef<HTMLDivElement>(null);
  const rootRef=useRef<HTMLDivElement>(null),returnLimit=useRef(0);
  const[returnCount,setReturnCount]=useState(0);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => setVisibleCount(Math.max(GRID_BATCH_SIZE,returnLimit.current)), [items.length === 0]);
  React.useLayoutEffect(()=>{
    const page=rootRef.current?.closest('main');if(!page)return;
    const expand=(event:Event)=>{const count=(event as CustomEvent<{count:number}>).detail?.count||0;
      if(!Number.isSafeInteger(count)||count<=GRID_BATCH_SIZE)return;
      returnLimit.current=count;setReturnCount(count);setVisibleCount(previous=>Math.max(previous,count));};
    const end=()=>{returnLimit.current=0;setReturnCount(0);};
    page.addEventListener(CATALOG_RETURN_EXPAND,expand);page.addEventListener(CATALOG_RETURN_END,end);
    return()=>{page.removeEventListener(CATALOG_RETURN_EXPAND,expand);page.removeEventListener(CATALOG_RETURN_END,end);};
  },[items.length===0]);
  const visibleItems = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length || Boolean(hasMoreRemote);
  const handleLoadMore = useCallback(async () => {
    if (requestingRef.current || isLoadingRemote || !hasMore) return;
    if (visibleCount < items.length) { setVisibleCount(previous => previous + GRID_BATCH_SIZE); return; }
    if (!onLoadMoreRemote) return;
    requestingRef.current = true; setRequesting(true);
    try {
      await onLoadMoreRemote();
      if (mounted.current) setVisibleCount(previous => previous + GRID_BATCH_SIZE);
    } finally {
      requestingRef.current = false;
      if (mounted.current) setRequesting(false);
    }
  }, [isLoadingRemote, hasMore, visibleCount, items.length, onLoadMoreRemote]);
  useEffect(()=>{
    if(returnCount<=items.length||!hasMoreRemote||!onLoadMoreRemote||isLoadingRemote||loadMoreFailed||requestingRef.current)return;
    requestingRef.current=true;setRequesting(true);
    void Promise.resolve().then(onLoadMoreRemote).catch(()=>{if(mounted.current){returnLimit.current=0;setReturnCount(0);}})
      .finally(()=>{requestingRef.current=false;if(mounted.current)setRequesting(false);});
  },[returnCount,items.length,hasMoreRemote,onLoadMoreRemote,isLoadingRemote,loadMoreFailed]);
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!autoLoadMore || !hasMore || isLoadingRemote || requesting || loadMoreFailed || !sentinel) return;
    const load = () => { void handleLoadMore().catch(() => {}); };
    if (typeof IntersectionObserver !== 'undefined') {
      const observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) load(); }, { rootMargin: '0px 0px 240px 0px' });
      observer.observe(sentinel);
      return () => observer.disconnect();
    }
    let frame = 0;
    const check = () => { if (!frame) frame = requestAnimationFrame(() => { frame = 0; if (sentinel.getBoundingClientRect().top <= innerHeight + 240) load(); }); };
    window.addEventListener('scroll', check, { passive: true }); window.addEventListener('resize', check); check();
    return () => { window.removeEventListener('scroll', check); window.removeEventListener('resize', check); if (frame) cancelAnimationFrame(frame); };
  }, [autoLoadMore, hasMore, isLoadingRemote, requesting, loadMoreFailed, handleLoadMore]);
  if (items.length === 0 && !isLoadingRemote) return <div ref={rootRef} className="catalog-grid-empty"><p>{emptyMessage}</p></div>;
  return <div ref={rootRef} className="catalog-grid-container"><div className="catalog-grid">{visibleItems.map((item, index) => <MediaCard key={getItemKey ? getItemKey(item) : item.id} item={item} onClick={onItemClick} onFocus={() => {
    if (index === visibleItems.length - 1 && !loadMoreFailed) void handleLoadMore().catch(() => {});
  }} />)}</div>{autoLoadMore ? (hasMore || requesting) && <div ref={sentinelRef} className="catalog-grid-sentinel">
    {loadMoreFailed ? <><p role="status">Não foi possível carregar os próximos títulos.</p><button type="button" className="focusable-item btn-secondary" onClick={() => void handleLoadMore().catch(() => {})}>Tentar novamente</button></>
      : <span role="status" aria-live="polite">{requesting || isLoadingRemote ? 'Carregando…' : ''}</span>}
  </div> : hasMore && <div className="catalog-grid-actions"><button type="button" className="focusable-item btn-secondary btn-load-more" onClick={() => void handleLoadMore().catch(() => {})}>{isLoadingRemote ? 'Carregando...' : 'Carregar Mais'}</button></div>}</div>;
};
