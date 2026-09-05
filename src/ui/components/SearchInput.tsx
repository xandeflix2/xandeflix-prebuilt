/**
 * Xandeflix Prebuilt — SearchInput Component (Gate G7)
 *
 * Campo de texto focável compatível com teclado, mouse, touch e D-pad TV.
 */

import React, { useRef, useEffect } from 'react';

interface SearchInputProps {
  query: string;
  onChange: (query: string) => void;
  onClear?: () => void;
  onSubmit?: () => void;
  autoFocus?: boolean;
  disabled?: boolean;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  query,
  onChange,
  onClear,
  onSubmit,
  autoFocus = true,
  disabled = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current && !disabled) {
      inputRef.current.focus();
    }
  }, [autoFocus, disabled]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (onSubmit) {
        onSubmit();
      }
    }
  };

  return (
    <div className="search-input-wrapper">
      <span className="search-icon" aria-hidden="true">🔍</span>
      <input
        ref={inputRef}
        id="search-query-input"
        type="text"
        className="focusable-item search-input"
        value={query}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Buscar filmes, séries, gêneros..."
        disabled={disabled}
        autoComplete="off"
        spellCheck="false"
        aria-label="Campo de busca de filmes e séries"
      />
      {query.length > 0 && onClear && (
        <button
          type="button"
          className="focusable-item search-clear-btn"
          onClick={onClear}
          aria-label="Limpar texto de busca"
        >
          ✕
        </button>
      )}
    </div>
  );
};
