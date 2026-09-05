/**
 * Xandeflix Prebuilt — Hero Banner Component (Gate G6)
 *
 * Destaque cinematográfico do catálogo local no topo da Home.
 *
 * Princípios:
 * - DETERMINISTIC HIGHLIGHT: Item derivado deterministicamente do catálogo local ativo.
 * - ZERO EXTERNAL TMDB: Nenhum fetch de metadados em runtime.
 */

import React from 'react';
import type { CatalogItemViewModel } from '../../catalog/catalog-view-model.ts';
import { Artwork } from './Artwork.tsx';

interface HeroProps {
  item: CatalogItemViewModel;
  onSelect: (item: CatalogItemViewModel) => void;
}

export const Hero: React.FC<HeroProps> = ({ item, onSelect }) => {
  return (
    <section className="hero-banner" aria-label={`Destaque: ${item.title}`}>
      <div className="hero-backdrop-container">
        <Artwork
          uri={item.backdropUri || item.posterUri}
          title={item.title}
          kind="backdrop"
          className="hero-backdrop-img"
        />
        <div className="hero-overlay-gradient" />
      </div>
      <div className="hero-content">
        <div className="hero-meta">
          <span className="hero-badge">{item.kind === 'movie' ? 'FILME' : 'SÉRIE'}</span>
          {item.yearFormatted && <span className="hero-year">{item.yearFormatted}</span>}
          {item.durationFormatted && (
            <span className="hero-duration">{item.durationFormatted}</span>
          )}
        </div>
        <h1 className="hero-title">{item.title}</h1>
        {item.genreLabels.length > 0 && (
          <p className="hero-genres">{item.genreLabels.join(' • ')}</p>
        )}
        {item.overviewSnippet && (
          <p className="hero-overview">{item.overviewSnippet}</p>
        )}
        <div className="hero-actions">
          <button
            type="button"
            className="focusable-item btn-primary hero-btn-primary"
            onClick={() => onSelect(item)}
          >
            Ver Detalhes
          </button>
        </div>
      </div>
    </section>
  );
};
