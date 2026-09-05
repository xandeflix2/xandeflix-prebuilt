/**
 * Xandeflix Prebuilt — SeriesPage Component (Gate G6)
 *
 * Catálogo de séries local com filtro de categoria e grid em lotes.
 */

import React, { useState, useMemo } from 'react';
import type { CatalogReadModel } from '../../catalog/catalog-read-model.ts';
import type { CatalogItemViewModel } from '../../catalog/catalog-view-model.ts';
import { getAllSeries } from '../../catalog/catalog-selectors.ts';
import { CatalogGrid } from '../components/CatalogGrid.tsx';

interface SeriesPageProps {
  readModel: CatalogReadModel;
  onSelectItem: (item: CatalogItemViewModel) => void;
}

export const SeriesPage: React.FC<SeriesPageProps> = ({ readModel, onSelectItem }) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>();

  const categories = readModel.catalog.categories.filter((c) => c.contentKinds.includes('series'));

  const seriesList = useMemo(() => {
    return getAllSeries(readModel, { categoryId: selectedCategoryId });
  }, [readModel, selectedCategoryId]);

  return (
    <main className="page-container series-page">
      <div className="page-header">
        <h1 className="page-title">Séries</h1>
        <p className="page-subtitle">
          {seriesList.length} {seriesList.length === 1 ? 'série disponível' : 'séries disponíveis'} no catálogo local
        </p>
      </div>

      {categories.length > 0 && (
        <div className="filter-bar" role="toolbar" aria-label="Filtro de Categorias de Séries">
          <button
            type="button"
            className={`focusable-item filter-chip ${selectedCategoryId === undefined ? 'active' : ''}`}
            onClick={() => setSelectedCategoryId(undefined)}
          >
            Todas
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
        items={seriesList}
        onItemClick={onSelectItem}
        emptyMessage="Nenhuma série encontrada nesta categoria."
      />
    </main>
  );
};
