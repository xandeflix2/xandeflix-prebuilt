/**
 * Xandeflix Prebuilt — Header Component (Gate G6)
 *
 * Barra de cabeçalho e navegação principal com suporte a mouse, touch e D-pad.
 */

import React from 'react';
import type { AppView } from '../navigation/route-state.ts';

interface HeaderProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  onBack?: () => void;
  canGoBack?: boolean;
  snapshotId?: string;
  catalogVersion?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  onBack,
  canGoBack = false,
  snapshotId,
  catalogVersion,
}) => {
  return (
    <header className="app-header">
      <div className="header-left">
        {canGoBack && onBack && (
          <button
            type="button"
            className="focusable-item btn-back"
            onClick={onBack}
            aria-label="Voltar para a tela anterior"
          >
            ← Voltar
          </button>
        )}
        <div
          className="brand-container"
          onClick={() => onNavigate('home')}
          role="button"
          tabIndex={0}
          aria-label="Xandeflix Prebuilt - Início"
        >
          <span className="brand-logo">XANDEFLIX</span>
          <span className="brand-sub">PREBUILT</span>
        </div>
      </div>

      <nav className="header-nav" aria-label="Navegação Principal">
        <button
          type="button"
          className={`focusable-item nav-link ${currentView === 'home' ? 'active' : ''}`}
          onClick={() => onNavigate('home')}
        >
          Início
        </button>
        <button
          type="button"
          className={`focusable-item nav-link ${currentView === 'movies' ? 'active' : ''}`}
          onClick={() => onNavigate('movies')}
        >
          Filmes
        </button>
        <button
          type="button"
          className={`focusable-item nav-link ${currentView === 'series' ? 'active' : ''}`}
          onClick={() => onNavigate('series')}
        >
          Séries
        </button>
        <button
          type="button"
          className={`focusable-item nav-link ${currentView === 'search' ? 'active' : ''}`}
          onClick={() => onNavigate('search')}
        >
          Busca
        </button>
      </nav>

      <div className="header-right">
        {catalogVersion && (
          <div className="header-catalog-badge" title={`Snapshot: ${snapshotId || 'local'}`}>
            <span className="badge-dot" />
            <span className="badge-text">v{catalogVersion}</span>
          </div>
        )}
      </div>
    </header>
  );
};
