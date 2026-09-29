import React, { useState, useMemo } from 'react';
import type { CatalogReadModel } from '../../catalog/catalog-read-model.ts';
import type { CatalogItemViewModel } from '../../catalog/catalog-view-model.ts';
import { getSeriesCategories, seriesToViewModel } from '../../catalog/catalog-selectors.ts';
import { useSegmentedBrowse } from '../hooks/useSegmentedBrowse.ts';
import { CatalogGrid } from '../components/CatalogGrid.tsx';

interface SeriesPageProps { readModel: CatalogReadModel; onSelectItem: (item: CatalogItemViewModel) => void; }
export const SeriesPage: React.FC<SeriesPageProps> = ({ readModel, onSelectItem }) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>();
  const categories = getSeriesCategories(readModel);
  const browse = useSegmentedBrowse('series', selectedCategoryId);
  const movies = useMemo(() => browse.items.map((movie) => seriesToViewModel(readModel, movie)), [browse.items, readModel]);
  return <main className="page-container series-page">
    <div className="page-header"><h1 className="page-title">Séries</h1><p className="page-subtitle">{browse.totalAvailable} {browse.totalAvailable === 1 ? 'série disponível' : 'séries disponíveis'} no catálogo local</p></div>
    {categories.length > 0 && <div className="filter-bar" role="toolbar" aria-label="Filtro de Categorias de Séries">
      <button type="button" className={`focusable-item filter-chip ${selectedCategoryId === undefined ? 'active' : ''}`} onClick={() => setSelectedCategoryId(undefined)}>Todas</button>
      {categories.map((cat) => <button key={cat.id} type="button" className={`focusable-item filter-chip ${selectedCategoryId === cat.id ? 'active' : ''}`} onClick={() => setSelectedCategoryId(cat.id)}>{cat.name}</button>)}
    </div>}
    <CatalogGrid items={movies} onItemClick={onSelectItem} emptyMessage={browse.loading ? 'Preparando catálogo...' : 'Nenhuma série encontrada nesta categoria.'} hasMoreRemote={browse.hasMore} isLoadingRemote={browse.loading} onLoadMoreRemote={() => void browse.loadNext()} />
  </main>;
};

