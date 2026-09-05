/**
 * Xandeflix Prebuilt — MediaCard Component (Gate G6)
 *
 * Card focável e interativo para navegação em listas, faixas e grids.
 *
 * Princípios:
 * - ACCESSIBLE SEMANTICS: Tag <button> focável com accessible name completo.
 * - DPAD COMPATIBLE: Classe 'focusable-item' para navegação espacial de TV.
 */

import React from 'react';
import type { CatalogItemViewModel } from '../../catalog/catalog-view-model.ts';
import { Artwork } from './Artwork.tsx';

interface MediaCardProps {
  item: CatalogItemViewModel;
  onClick: (item: CatalogItemViewModel) => void;
  className?: string;
}

export const MediaCard: React.FC<MediaCardProps> = ({ item, onClick, className = '' }) => {
  return (
    <button
      type="button"
      className={`focusable-item media-card ${className}`}
      onClick={() => onClick(item)}
      aria-label={`${item.title}${item.yearFormatted ? ` (${item.yearFormatted})` : ''} - ${item.kind === 'movie' ? 'Filme' : 'Série'}`}
    >
      <div className="media-card-poster-wrapper">
        <Artwork
          uri={item.posterUri}
          title={item.title}
          kind="poster"
          className="media-card-poster"
        />
        <div className="media-card-badge">
          {item.kind === 'movie' ? 'FILME' : 'SÉRIE'}
        </div>
        {item.yearFormatted && (
          <div className="media-card-year">{item.yearFormatted}</div>
        )}
      </div>
      <div className="media-card-info">
        <h3 className="media-card-title">{item.title}</h3>
        {item.genreLabels.length > 0 && (
          <p className="media-card-genres">{item.genreLabels.slice(0, 2).join(' • ')}</p>
        )}
      </div>
    </button>
  );
};
