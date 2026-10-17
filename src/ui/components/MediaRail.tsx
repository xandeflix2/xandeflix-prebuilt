/**
 * Xandeflix Prebuilt — MediaRail Component (Gate G6)
 *
 * Faixa temática horizontal de itens com rolagem suave e navegação por D-pad.
 */

import React, { useRef, useState, useMemo, useEffect } from 'react';
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
      <div className="media-rail-track" ref={scrollContainerRef}>
        {orderedItems.map((item, index) => (
          <MediaCard key={getItemKey?getItemKey(item):item.id} item={item} onClick={onItemClick} prepareArtwork={preparation.prepare}
            startupArtwork={index < Math.min(8, startupArtworkCount)} />
        ))}
      </div>
    </section>
  );
});
