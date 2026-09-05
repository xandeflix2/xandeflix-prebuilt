/**
 * Xandeflix Prebuilt — SearchState Component (Gate G7)
 *
 * Apresenta os diferentes estados da busca, diferenciando claramente
 * NO_RESULTS de INDEX_UNAVAILABLE e INDEX_INVALID.
 */

import React from 'react';
import type { SearchStatus } from '../../search/search-index.types.ts';

interface SearchStateProps {
  status: SearchStatus;
  query?: string;
}

export const SearchState: React.FC<SearchStateProps> = ({ status, query }) => {
  switch (status) {
    case 'SEARCH_INDEX_LOADING':
      return (
        <div className="search-state-container" role="status" aria-live="polite">
          <div className="search-state-spinner" />
          <p className="search-state-title">Carregando índice de busca local...</p>
          <p className="search-state-subtitle">Preparando estruturas rápidas em memória.</p>
        </div>
      );

    case 'SEARCH_INDEX_UNAVAILABLE':
      return (
        <div className="search-state-container search-state-notice" role="status">
          <span className="search-state-icon" aria-hidden="true">ℹ️</span>
          <p className="search-state-title">Busca indisponível para este catálogo</p>
          <p className="search-state-subtitle">
            O pacote ativo foi provisionado sem índice de busca pré-construído (v1). Você pode navegar normalmente pelas seções de Filmes e Séries.
          </p>
        </div>
      );

    case 'SEARCH_INDEX_INVALID':
      return (
        <div className="search-state-container search-state-warning" role="alert">
          <span className="search-state-icon" aria-hidden="true">⚠️</span>
          <p className="search-state-title">Índice de busca indisponível</p>
          <p className="search-state-subtitle">
            O índice de busca local não pôde ser validado com segurança. O catálogo ativo continua funcionando normalmente nas demais telas.
          </p>
        </div>
      );

    case 'SEARCH_NO_ACTIVE_CATALOG':
      return (
        <div className="search-state-container" role="status">
          <span className="search-state-icon" aria-hidden="true">📦</span>
          <p className="search-state-title">Nenhum catálogo ativo</p>
          <p className="search-state-subtitle">
            Importe um pacote de catálogo no dispositivo para utilizar a busca.
          </p>
        </div>
      );

    case 'SEARCH_QUERY_EMPTY':
      return (
        <div className="search-state-container search-state-hint" role="status">
          <span className="search-state-icon" aria-hidden="true">⌨️</span>
          <p className="search-state-title">O que você gostaria de assistir?</p>
          <p className="search-state-subtitle">
            Pesquise por títulos de filmes, séries, gêneros ou ano de lançamento.
          </p>
        </div>
      );

    case 'SEARCH_NO_RESULTS':
      return (
        <div className="search-state-container search-state-no-results" role="status" aria-live="polite">
          <span className="search-state-icon" aria-hidden="true">🔎</span>
          <p className="search-state-title">Nenhum resultado encontrado</p>
          <p className="search-state-subtitle">
            Não encontramos títulos correspondentes a &ldquo;<strong>{query}</strong>&rdquo;. Tente buscar por outras palavras-chave.
          </p>
        </div>
      );

    default:
      return null;
  }
};
