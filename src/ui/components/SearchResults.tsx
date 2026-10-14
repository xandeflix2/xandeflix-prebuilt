/**
 * Xandeflix Prebuilt — SearchResults Component (Gate G7)
 *
 * Apresenta a grade de resultados de busca locais resolvidos pelo CatalogReadModel.
 */

import React from 'react';
import type { SearchResultItem } from '../../search/search-index.types.ts';
import type { CatalogReadModel } from '../../catalog/catalog-read-model.ts';
import type { CatalogItemViewModel } from '../../catalog/catalog-view-model.ts';
import { movieToViewModel, seriesToViewModel } from '../../catalog/catalog-selectors.ts';
import { MediaCard } from './MediaCard.tsx';
import { Artwork } from './Artwork.tsx';

interface SearchResultsProps {
  results: SearchResultItem[];
  readModel: CatalogReadModel;
  onSelectItem: (item: CatalogItemViewModel) => void;
  onSelectLive?: (channelId: string) => void;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  readModel,
  onSelectItem,
  onSelectLive,
}) => {
  const [, setResolvedVersion] = React.useState(0);

  React.useEffect(() => {
    let active = true;
    void (async () => {
      for (const r of results) {
        if (!active) break;
        if (r.kind === 'live') continue;
        try {
          const resolved = r.kind === 'movie'
            ? await readModel.resolveMovieById(r.id)
            : await readModel.resolveSeriesById(r.id);
          if (active && resolved) setResolvedVersion((v) => v + 1);
        } catch { /* Keep the index card usable; detail can retry its own read. */ }
      }
    })();
    return () => {
      active = false;
    };
  }, [results, readModel]);

  if (results.length === 0) {
    return null;
  }

  // Hidrata cada SearchResultItem através do CatalogReadModel
  const cards: Array<{ kind: 'catalog'; item: CatalogItemViewModel } | { kind: 'live'; result: SearchResultItem; posterUri: string }> = [];

  for (const r of results) {
    const rawPoster =
      r.posterUri ||
      r.posterUrl ||
      (r as any).logo ||
      (r as any).cover ||
      '';

    if (r.kind === 'live') {
      cards.push({ kind: 'live', result: r, posterUri: rawPoster });
      continue;
    }

    if (r.kind === 'movie') {
      const movie = readModel.moviesById.get(r.id);
      if (movie) {
        const vm = movieToViewModel(readModel, movie);
        if (!vm.posterUri && rawPoster) {
          vm.posterUri = rawPoster;
        }
        cards.push({ kind: 'catalog', item: vm });
      } else {
        cards.push({ kind: 'catalog', item: {
          id: r.id,
          kind: 'movie',
          title: r.title,
          yearFormatted: r.year ? String(r.year) : undefined,
          posterUri: rawPoster,
          genreLabels: [],
          categoryLabels: [],
        } });
      }
    } else {
      const series = readModel.seriesById.get(r.id);
      if (series) {
        const vm = seriesToViewModel(readModel, series);
        if (!vm.posterUri && rawPoster) {
          vm.posterUri = rawPoster;
        }
        cards.push({ kind: 'catalog', item: vm });
      } else {
        cards.push({ kind: 'catalog', item: {
          id: r.id,
          kind: 'series',
          title: r.title,
          yearFormatted: r.year ? String(r.year) : undefined,
          posterUri: rawPoster,
          genreLabels: [],
          categoryLabels: [],
        } });
      }
    }
  }

  return (
    <section className="search-results-section" aria-label="Resultados da Busca">
      <div className="search-results-header">
        <h2 className="search-results-count">
          {cards.length} {cards.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}
        </h2>
      </div>

      <div className="catalog-grid search-results-grid">
        {cards.map((card) => card.kind === 'live' ? (
          <button
            key={`live:${card.result.id}`}
            type="button"
            className="focusable-item media-card search-result-card"
            onClick={() => onSelectLive?.(card.result.id)}
            disabled={!onSelectLive}
            aria-label={`${card.result.title} - Canal ao vivo`}
          >
            <div className="media-card-poster-wrapper">
              <Artwork uri={card.posterUri} title={card.result.title} kind="poster" className="media-card-poster" prepare={false} />
              <div className="media-card-badge">AO VIVO</div>
            </div>
            <div className="media-card-info">
              <h3 className="media-card-title">{card.result.title}</h3>
            </div>
          </button>
        ) : (
          <MediaCard
            key={`${card.item.kind}:${card.item.id}`}
            item={card.item}
            onClick={onSelectItem}
            className="search-result-card"
          />
        ))}
      </div>
    </section>
  );
};
