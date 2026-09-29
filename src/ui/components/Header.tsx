/**
 * Xandeflix Prebuilt — Header Component (Gate G6)
 *
 * Barra de cabeçalho e navegação principal com suporte a mouse, touch e D-pad.
 */

import React from 'react';
import type { AppView } from '../navigation/route-state.ts';

declare const __XANDEFLIX_DEBUG_BUILD__: boolean;

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
    <>
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
          className={`focusable-item nav-link ${currentView === 'live' ? 'active' : ''}`}
          onClick={() => onNavigate('live')}
        >
          📺 Canais
        </button>
        <button
          type="button"
          className={`focusable-item nav-link ${currentView === 'search' ? 'active' : ''}`}
          onClick={() => onNavigate('search')}
        >
          Busca
        </button>
        <button
          type="button"
          className={`focusable-item nav-link ${currentView === 'activation' ? 'active' : ''}`}
          onClick={() => onNavigate('activation')}
          style={{ color: '#38bdf8' }}
        >
          🔑 Ativação
        </button>
        {typeof __XANDEFLIX_DEBUG_BUILD__ !== 'undefined' && __XANDEFLIX_DEBUG_BUILD__ && (
          <>
            <button
              type="button"
              className={`focusable-item nav-link ${currentView === 'debug-source-setup' ? 'active' : ''}`}
              onClick={() => onNavigate('debug-source-setup')}
              style={{ color: '#f87171' }}
            >
              ⚙️ Fonte (Debug)
            </button>
            <button
              type="button"
              className={`focusable-item nav-link ${currentView === 'manager-panel' ? 'active' : ''}`}
              onClick={() => onNavigate('manager-panel')}
              style={{ color: '#a855f7' }}
            >
              🛡️ Gestor (Lab)
            </button>
          </>
        )}
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

    <nav className="mobile-bottom-nav" aria-label="Navegação Mobile Inferior">
      <button
        type="button"
        className={`focusable-item mobile-nav-btn ${currentView === 'home' ? 'active' : ''}`}
        onClick={() => onNavigate('home')}
        aria-label="Ir para Início"
      >
        <span className="mobile-nav-icon">🏠</span>
        <span className="mobile-nav-label">Início</span>
      </button>
      <button
        type="button"
        className={`focusable-item mobile-nav-btn ${currentView === 'movies' ? 'active' : ''}`}
        onClick={() => onNavigate('movies')}
        aria-label="Ir para Filmes"
      >
        <span className="mobile-nav-icon">🎬</span>
        <span className="mobile-nav-label">Filmes</span>
      </button>
      <button
        type="button"
        className={`focusable-item mobile-nav-btn ${currentView === 'series' ? 'active' : ''}`}
        onClick={() => onNavigate('series')}
        aria-label="Ir para Séries"
      >
        <span className="mobile-nav-icon">📺</span>
        <span className="mobile-nav-label">Séries</span>
      </button>
      <button
        type="button"
        className={`focusable-item mobile-nav-btn ${currentView === 'live' ? 'active' : ''}`}
        onClick={() => onNavigate('live')}
        aria-label="Ir para Canais ao Vivo"
      >
        <span className="mobile-nav-icon">📡</span>
        <span className="mobile-nav-label">Canais</span>
      </button>
      <button
        type="button"
        className={`focusable-item mobile-nav-btn ${currentView === 'search' ? 'active' : ''}`}
        onClick={() => onNavigate('search')}
        aria-label="Ir para Busca"
      >
        <span className="mobile-nav-icon">🔍</span>
        <span className="mobile-nav-label">Busca</span>
      </button>
      <button
        type="button"
        className={`focusable-item mobile-nav-btn ${currentView === 'activation' ? 'active' : ''}`}
        onClick={() => onNavigate('activation')}
        aria-label="Ir para Ativação"
      >
        <span className="mobile-nav-icon">🔑</span>
        <span className="mobile-nav-label">Ativação</span>
      </button>
    </nav>
  </>
  );
};
