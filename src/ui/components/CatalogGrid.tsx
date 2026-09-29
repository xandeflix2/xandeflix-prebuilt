import React, { useEffect, useState } from 'react';
import { type CatalogItemViewModel, GRID_BATCH_SIZE } from '../../catalog/catalog-view-model.ts';
import { MediaCard } from './MediaCard.tsx';
interface CatalogGridProps { items: CatalogItemViewModel[]; onItemClick: (item: CatalogItemViewModel) => void; emptyMessage?: string; hasMoreRemote?: boolean; isLoadingRemote?: boolean; onLoadMoreRemote?: () => void; }
export const CatalogGrid: React.FC<CatalogGridProps> = ({ items, onItemClick, emptyMessage = 'Nenhum item encontrado nesta seleção.', hasMoreRemote, isLoadingRemote, onLoadMoreRemote }) => {
  const [visibleCount, setVisibleCount] = useState(GRID_BATCH_SIZE);
  useEffect(() => setVisibleCount(GRID_BATCH_SIZE), [items.length === 0]);
  const visibleItems = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length || Boolean(hasMoreRemote);
  const handleLoadMore = () => { if (visibleCount < items.length) setVisibleCount((previous) => previous + GRID_BATCH_SIZE); else onLoadMoreRemote?.(); };
  if (items.length === 0 && !isLoadingRemote) return <div className="catalog-grid-empty"><p>{emptyMessage}</p></div>;
  return <div className="catalog-grid-container"><div className="catalog-grid">{visibleItems.map((item, index) => <MediaCard key={item.id} item={item} onClick={onItemClick} onFocus={() => {
    if (index === visibleItems.length - 1) { if (visibleCount < items.length) setVisibleCount((previous) => previous + GRID_BATCH_SIZE); else if (hasMoreRemote) onLoadMoreRemote?.(); }
  }} />)}</div>{hasMore && <div className="catalog-grid-actions"><button type="button" className="focusable-item btn-secondary btn-load-more" onClick={handleLoadMore}>{isLoadingRemote ? 'Carregando...' : 'Carregar Mais'}</button></div>}</div>;
};
