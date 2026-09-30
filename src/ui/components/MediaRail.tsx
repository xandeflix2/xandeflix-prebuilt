/**
 * Xandeflix Prebuilt — MediaRail Component (Gate G6)
 *
 * Faixa temática horizontal de itens com rolagem suave e navegação por D-pad.
 */

import React, { useRef } from 'react';
import type { CatalogItemViewModel } from '../../catalog/catalog-view-model.ts';
import { MediaCard } from './MediaCard.tsx';

interface MediaRailProps {
  id: string;
  title: string;
  items: CatalogItemViewModel[];
  onItemClick: (item: CatalogItemViewModel) => void;
}

export const MediaRail = React.memo<MediaRailProps>(function MediaRail({
  id,
  title,
  items,
  onItemClick,
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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
    <section className="media-rail" aria-labelledby={`rail-title-${id}`}>
      <div className="media-rail-header">
        <h2 id={`rail-title-${id}`} className="media-rail-title">
          {title}
        </h2>
        <div className="media-rail-controls">
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
        </div>
      </div>
      <div className="media-rail-track" ref={scrollContainerRef}>
        {items.map((item) => (
          <MediaCard key={item.id} item={item} onClick={onItemClick} />
        ))}
      </div>
    </section>
  );
});
