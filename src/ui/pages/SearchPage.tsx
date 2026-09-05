/**
 * Xandeflix Prebuilt — SearchPage (Gate G7)
 *
 * Tela de busca unificada de filmes e séries consumindo exclusivamente
 * o índice de busca local persistido e o CatalogReadModel.
 *
 * Princípios:
 * - SEARCH_QUERY_NETWORK = NONE
 * - RESULT_SELECTION_OPENS_DETAIL = SIM (via onSelectItem)
 * - DPAD_NAVIGATION = SIM
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { CatalogReadModel } from '../../catalog/catalog-read-model.ts';
import type { CatalogItemViewModel } from '../../catalog/catalog-view-model.ts';
import type {
  SearchResultItem,
  SearchStatus,
  SearchFilter,
} from '../../search/search-index.types.ts';
import { SearchService } from '../../search/search.service.ts';
import { getClientSearchService } from '../../search/search-client.ts';
import { SearchInput } from '../components/SearchInput.tsx';
import { SearchResults } from '../components/SearchResults.tsx';
import { SearchState } from '../components/SearchState.tsx';

interface SearchPageProps {
  readModel: CatalogReadModel;
  onSelectItem: (item: CatalogItemViewModel) => void;
  searchServiceOverride?: SearchService;
}

export const SearchPage: React.FC<SearchPageProps> = ({
  readModel,
  onSelectItem,
  searchServiceOverride,
}) => {
  const searchService = useMemo(
    () => searchServiceOverride || getClientSearchService(),
    [searchServiceOverride]
  );

  const [query, setQuery] = useState('');
  const [filterKind, setFilterKind] = useState<'all' | 'movie' | 'series'>('all');
  const [status, setStatus] = useState<SearchStatus>('SEARCH_INDEX_LOADING');
  const [results, setResults] = useState<SearchResultItem[]>([]);

  // Inicializa o SearchService
  useEffect(() => {
    let isMounted = true;

    searchService.initialize().then((initialStatus) => {
      if (isMounted) {
        setStatus(initialStatus);
      }
    });

    const unsubscribe = searchService.subscribe((newStatus, newResults) => {
      if (isMounted) {
        setStatus(newStatus);
        setResults(newResults);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [searchService]);

  // Executa a busca sempre que query ou filtro mudam
  const handleQueryChange = useCallback(
    (newQuery: string) => {
      setQuery(newQuery);
      const filter: SearchFilter = {
        kind: filterKind,
      };
      searchService.search(newQuery, filter);
    },
    [searchService, filterKind]
  );

  const handleFilterChange = useCallback(
    (kind: 'all' | 'movie' | 'series') => {
      setFilterKind(kind);
      const filter: SearchFilter = {
        kind,
      };
      searchService.search(query, filter);
    },
    [searchService, query]
  );

  const handleClear = useCallback(() => {
    setQuery('');
    searchService.search('');
  }, [searchService]);

  const showResults = status === 'SEARCH_RESULTS' && results.length > 0;

  return (
    <div className="search-page-container">
      <div className="search-page-top">
        <h1 className="search-page-heading">Busca Local</h1>
        <p className="search-page-subheading">
          Pesquise no catálogo pré-construído instantaneamente, sem chamadas de rede.
        </p>

        <div className="search-controls-container">
          <SearchInput
            query={query}
            onChange={handleQueryChange}
            onClear={handleClear}
            disabled={status === 'SEARCH_INDEX_UNAVAILABLE' || status === 'SEARCH_INDEX_INVALID'}
          />

          {/* Filtros rápidos por tipo */}
          <div className="search-filters-bar" role="tablist" aria-label="Filtro de categoria de busca">
            <button
              type="button"
              className={`focusable-item filter-chip ${filterKind === 'all' ? 'active' : ''}`}
              onClick={() => handleFilterChange('all')}
              role="tab"
              aria-selected={filterKind === 'all'}
            >
              Todos
            </button>
            <button
              type="button"
              className={`focusable-item filter-chip ${filterKind === 'movie' ? 'active' : ''}`}
              onClick={() => handleFilterChange('movie')}
              role="tab"
              aria-selected={filterKind === 'movie'}
            >
              Filmes
            </button>
            <button
              type="button"
              className={`focusable-item filter-chip ${filterKind === 'series' ? 'active' : ''}`}
              onClick={() => handleFilterChange('series')}
              role="tab"
              aria-selected={filterKind === 'series'}
            >
              Séries
            </button>
          </div>
        </div>
      </div>

      <div className="search-page-body">
        {showResults ? (
          <SearchResults
            results={results}
            readModel={readModel}
            onSelectItem={onSelectItem}
          />
        ) : (
          <SearchState status={status} query={query} />
        )}
      </div>
    </div>
  );
};
