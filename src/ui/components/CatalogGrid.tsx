/**
 * Xandeflix Prebuilt — CatalogGrid Component (Gate G6)
 *
 * Grid responsivo com renderização controlada em lotes para proteger o DOM.
 *
 * Princípios:
 * - UNBOUNDED_DOM_RENDER = PROHIBITED: Renderiza itens em lotes (GRID_BATCH_SIZE).
 * - RESPONSIVE: Adapta colunas para Phone (2), Tablet (3-4) e TV (5-6).
 */

import React, { useState } from 'react';
import {
  type CatalogItemViewModel,
  GRID_BATCH_SIZE,
} from '../../catalog/catalog-view-model.ts';
import { MediaCard } from './MediaCard.tsx';

interface CatalogGridProps {
  items: CatalogItemViewModel[];
  onItemClick: (item: CatalogItemViewModel) => void;
  emptyMessage?: string;
}

export const CatalogGrid: React.FC<CatalogGridProps> = ({
  items,
  onItemClick,
  emptyMessage = 'Nenhum item encontrado nesta seleção.',
}) => {
  const [visibleCount, setVisibleCount] = useState<number>(GRID_BATCH_SIZE);

  const visibleItems = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + GRID_BATCH_SIZE);
  };

  if (items.length === 0) {
    return (
      <div className="catalog-grid-empty">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="catalog-grid-container">
      <div className="catalog-grid">
        {visibleItems.map((item) => (
          <MediaCard key={item.id} item={item} onClick={onItemClick} />
        ))}
      </div>
      {hasMore && (
        <div className="catalog-grid-actions">
          <button
            type="button"
            className="focusable-item btn-secondary btn-load-more"
            onClick={handleLoadMore}
          >
            Carregar Mais ({items.length - visibleCount} restantes)
          </button>
        </div>
      )}
    </div>
  );
};
