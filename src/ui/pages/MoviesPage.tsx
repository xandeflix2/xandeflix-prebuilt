/**
 * Xandeflix Prebuilt — MoviesPage Component (Gate G6)
 *
 * Catálogo de filmes local com filtro de categoria e grid em lotes.
 */

import React, { useState, useMemo } from 'react';
import type { CatalogReadModel } from '../../catalog/catalog-read-model.ts';
import type { CatalogItemViewModel } from '../../catalog/catalog-view-model.ts';
import { getAllMovies } from '../../catalog/catalog-selectors.ts';
import { CatalogGrid } from '../components/CatalogGrid.tsx';

interface MoviesPageProps {
  readModel: CatalogReadModel;
  onSelectItem: (item: CatalogItemViewModel) => void;
}

export const MoviesPage: React.FC<MoviesPageProps> = ({ readModel, onSelectItem }) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>();

  const categories = readModel.catalog.categories.filter((c) => c.contentKinds.includes('movie'));

  const movies = useMemo(() => {
    return getAllMovies(readModel, { categoryId: selectedCategoryId });
  }, [readModel, selectedCategoryId]);

  return (
    <main className="page-container movies-page">
      <div className="page-header">
        <h1 className="page-title">Filmes</h1>
        <p className="page-subtitle">
          {movies.length} {movies.length === 1 ? 'filme disponível' : 'filmes disponíveis'} no catálogo local
        </p>
      </div>

      {categories.length > 0 && (
        <div className="filter-bar" role="toolbar" aria-label="Filtro de Categorias de Filmes">
          <button
            type="button"
            className={`focusable-item filter-chip ${selectedCategoryId === undefined ? 'active' : ''}`}
            onClick={() => setSelectedCategoryId(undefined)}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`focusable-item filter-chip ${selectedCategoryId === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategoryId(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      <CatalogGrid
        items={movies}
        onItemClick={onSelectItem}
        emptyMessage="Nenhum filme encontrado nesta categoria."
      />
    </main>
  );
};
