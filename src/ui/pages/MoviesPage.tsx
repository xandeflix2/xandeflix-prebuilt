import React, { useState, useMemo } from 'react';
import type { CatalogReadModel } from '../../catalog/catalog-read-model.ts';
import type { CatalogItemViewModel } from '../../catalog/catalog-view-model.ts';
import { getMovieCategories, movieToViewModel } from '../../catalog/catalog-selectors.ts';
import { useSegmentedBrowse } from '../hooks/useSegmentedBrowse.ts';
import { CatalogGrid } from '../components/CatalogGrid.tsx';

interface MoviesPageProps { readModel: CatalogReadModel; onSelectItem: (item: CatalogItemViewModel) => void; }
export const MoviesPage: React.FC<MoviesPageProps> = ({ readModel, onSelectItem }) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>();
  const categories = getMovieCategories(readModel);
  const browse = useSegmentedBrowse('movies', selectedCategoryId);
  const movies = useMemo(() => browse.items.map((movie) => movieToViewModel(readModel, movie)), [browse.items, readModel]);
  return <main className="page-container movies-page">
    <div className="page-header"><h1 className="page-title">Filmes</h1><p className="page-subtitle">{browse.totalAvailable} {browse.totalAvailable === 1 ? 'filme disponível' : 'filmes disponíveis'} no catálogo local</p></div>
    {categories.length > 0 && <div className="filter-bar" role="toolbar" aria-label="Filtro de Categorias de Filmes">
      <button type="button" className={`focusable-item filter-chip ${selectedCategoryId === undefined ? 'active' : ''}`} onClick={() => setSelectedCategoryId(undefined)}>Todos</button>
      {categories.map((cat) => <button key={cat.id} type="button" className={`focusable-item filter-chip ${selectedCategoryId === cat.id ? 'active' : ''}`} onClick={() => setSelectedCategoryId(cat.id)}>{cat.name}</button>)}
    </div>}
    <CatalogGrid items={movies} onItemClick={onSelectItem} emptyMessage={browse.loading ? 'Preparando catálogo...' : 'Nenhum filme encontrado nesta categoria.'} hasMoreRemote={browse.hasMore} isLoadingRemote={browse.loading} onLoadMoreRemote={() => void browse.loadNext()} />
  </main>;
};

