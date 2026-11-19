/**
 * Xandeflix Prebuilt — SearchPage (Gate G7)
 *
 * Tela de busca unificada de filmes, séries e canais consumindo exclusivamente
 * o índice de busca local persistido e o CatalogReadModel.
 *
 * Princípios:
 * - SEARCH_QUERY_NETWORK = NONE
 * - RESULT_SELECTION_OPENS_DETAIL = SIM (via onSelectItem)
 * - DPAD_NAVIGATION = SIM
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import { captureSearchPosition, restoreSearchPosition, type SearchReturnPosition } from '../navigation/search-return.ts';

interface SearchPageProps {
  active?: boolean;
  parentalEditor?: boolean;
  readModel: CatalogReadModel;
  onSelectItem: (item: CatalogItemViewModel) => void;
  onSelectLive?: (channelId: string) => void;
  searchServiceOverride?: SearchService;
}

export const SearchPage: React.FC<SearchPageProps> = ({
  readModel,
  onSelectItem,
  onSelectLive,
  searchServiceOverride,
  parentalEditor = false,
  active = true,
}) => {
  const searchService = useMemo(
    () => searchServiceOverride || getClientSearchService(),
    [searchServiceOverride]
  );

  const [query, setQuery] = useState('');
  const [filterKind, setFilterKind] = useState<'all' | 'movie' | 'series'>('all');
  const [status, setStatus] = useState<SearchStatus>('SEARCH_INDEX_LOADING');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const pendingQuery = useRef({ query: '', kind: 'all' as 'all' | 'movie' | 'series' });

  const rootRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLElement | null>(null);
  const returnPosition = useRef<SearchReturnPosition | null>(null);
  const initialAutoFocus = useRef(active);

  const rememberPosition = useCallback(() => {
    if (rootRef.current) returnPosition.current = captureSearchPosition(rootRef.current, selectedRef.current);
  }, []);

  useEffect(() => {
    if (!active || !returnPosition.current) return;
    const position = returnPosition.current;
    let frame = 0;
    const cancel = () => {
      cancelAnimationFrame(frame);
      for (const event of ['pointerdown', 'keydown', 'wheel']) window.removeEventListener(event, cancel, true);
      if (returnPosition.current === position) returnPosition.current = null;
    };
    // Other page focus effects run first; search owns focus on its return.
    frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        if (rootRef.current) restoreSearchPosition(rootRef.current, position);
        cancel();
      });
    });
    for (const event of ['pointerdown', 'keydown', 'wheel']) window.addEventListener(event, cancel, true);
    return () => {
      cancel();
      for (const event of ['pointerdown', 'keydown', 'wheel']) window.removeEventListener(event, cancel, true);
    };
  }, [active]);

  // Inicializa o SearchService
  useEffect(() => {
    let isMounted = true;

    const unsubscribe = searchService.subscribe((newStatus, newResults) => {
      if (isMounted) {
        setStatus(newStatus);
        setResults(newResults);
        if (newStatus === 'SEARCH_READY' && pendingQuery.current.query.trim()) {
          searchService.search(pendingQuery.current.query, { kind: pendingQuery.current.kind });
        }
      }
    });
    void searchService.initialize().catch(() => {
      if (isMounted) { setStatus('SEARCH_FAILED'); setResults([]); }
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
      pendingQuery.current = { query: newQuery, kind: filterKind };
      const filter: SearchFilter = {
        kind: filterKind,
      };
      if (searchService.isSearchReady()) searchService.search(newQuery, filter);
    },
    [searchService, filterKind]
  );

  const handleFilterChange = useCallback(
    (kind: 'all' | 'movie' | 'series') => {
      setFilterKind(kind);
      pendingQuery.current = { query, kind };
      const filter: SearchFilter = {
        kind,
      };
      if (searchService.isSearchReady()) searchService.search(query, filter);
    },
    [searchService, query]
  );

  const handleClear = useCallback(() => {
    setQuery('');
    pendingQuery.current.query = '';
    if (searchService.isSearchReady()) searchService.search('');
  }, [searchService]);

  const showResults = query.trim().length > 0 && status === 'SEARCH_RESULTS' && results.length > 0;

  return (
    <div ref={rootRef} className="search-page-container" hidden={!active}
      style={active ? undefined : { display: 'none' }} aria-hidden={!active || undefined}
      onClickCapture={event => {
        const card = (event.target as Element).closest<HTMLElement>('.media-card');
        if (card && event.currentTarget.contains(card)) selectedRef.current = card;
      }}
      onFocusCapture={event => { selectedRef.current = event.target as HTMLElement; }}>
      <div className="search-page-top">
        <h1 className="search-page-heading">Busca Local</h1>
        <p className="search-page-subheading">
          Pesquise no catálogo pré-construído instantaneamente, sem chamadas de rede.
        </p>

        <div className="search-controls-container">
          <SearchInput
            query={query}
            autoFocus={initialAutoFocus.current}
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

      <div
        className="search-page-body"
        onTouchMove={() => {
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }
        }}
      >
        {showResults ? (
          <SearchResults
            parentalEditor={parentalEditor}
            results={results}
            readModel={readModel}
            onSelectItem={item => { rememberPosition(); onSelectItem(item); }}
            onSelectLive={onSelectLive ? id => { rememberPosition(); onSelectLive(id); } : undefined}
          />
        ) : (
          <SearchState status={status} query={query} />
        )}
      </div>
    </div>
  );
};
