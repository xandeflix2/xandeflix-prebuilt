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

interface SearchResultsProps {
  results: SearchResultItem[];
  readModel: CatalogReadModel;
  onSelectItem: (item: CatalogItemViewModel) => void;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  readModel,
  onSelectItem,
}) => {
  const [, setResolvedVersion] = React.useState(0);

  React.useEffect(() => {
    let active = true;
    for (const r of results) {
      if (r.kind === 'movie' && !readModel.moviesById.has(r.id)) {
        void readModel.resolveMovieById(r.id).then((resolved) => {
          if (active && resolved) {
            setResolvedVersion((v) => v + 1);
          }
        });
      } else if (r.kind === 'series' && !readModel.seriesById.has(r.id)) {
        void readModel.resolveSeriesById(r.id).then((resolved) => {
          if (active && resolved) {
            setResolvedVersion((v) => v + 1);
          }
        });
      }
    }
    return () => {
      active = false;
    };
  }, [results, readModel]);

  if (results.length === 0) {
    return null;
  }

  // Hidrata cada SearchResultItem através do CatalogReadModel
  const viewModels: CatalogItemViewModel[] = [];

  for (const r of results) {
    const rawPoster =
      r.posterUri ||
      r.posterUrl ||
      (r as any).logo ||
      (r as any).cover ||
      '';

    if (r.kind === 'movie') {
      const movie = readModel.moviesById.get(r.id);
      if (movie) {
        const vm = movieToViewModel(readModel, movie);
        if (!vm.posterUri && rawPoster) {
          vm.posterUri = rawPoster;
        }
        viewModels.push(vm);
      } else {
        viewModels.push({
          id: r.id,
          kind: 'movie',
          title: r.title,
          yearFormatted: r.year ? String(r.year) : undefined,
          posterUri: rawPoster,
          genreLabels: [],
          categoryLabels: [],
        });
      }
    } else {
      const series = readModel.seriesById.get(r.id);
      if (series) {
        const vm = seriesToViewModel(readModel, series);
        if (!vm.posterUri && rawPoster) {
          vm.posterUri = rawPoster;
        }
        viewModels.push(vm);
      } else {
        viewModels.push({
          id: r.id,
          kind: 'series',
          title: r.title,
          yearFormatted: r.year ? String(r.year) : undefined,
          posterUri: rawPoster,
          genreLabels: [],
          categoryLabels: [],
        });
      }
    }
  }

  return (
    <section className="search-results-section" aria-label="Resultados da Busca">
      <div className="search-results-header">
        <h2 className="search-results-count">
          {viewModels.length} {viewModels.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}
        </h2>
      </div>

      <div className="catalog-grid search-results-grid">
        {viewModels.map((item) => (
          <MediaCard
            key={item.id}
            item={item}
            onClick={onSelectItem}
            className="search-result-card"
          />
        ))}
      </div>
    </section>
  );
};
