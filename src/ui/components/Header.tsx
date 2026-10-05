/**
 * Xandeflix Prebuilt — Header Component (Gate G6)
 *
 * Barra de cabeçalho e navegação principal com suporte a mouse, touch e D-pad.
 */

import React from 'react';
import type { AppView } from '../navigation/route-state.ts';

declare const __XANDEFLIX_DEBUG_BUILD__: boolean;

const navigationIcons: Partial<Record<AppView, React.ReactNode>> = {
  home: <path d="M3 10.5 12 3l9 7.5V21h-6v-7H9v7H3z" />,
  movies: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M7 3v18M17 3v18M3 8h4M3 16h4M17 8h4M17 16h4" /></>,
  series: <><rect x="6" y="6" width="15" height="15" rx="2" /><path d="M17 3H3v14M11 10l5 3.5-5 3.5z" /></>,
  live: <><rect x="3" y="7" width="18" height="14" rx="2" /><path d="m7 3 5 4 5-4M7 17h6M17 17h.01" /></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5.5 5.5" /></>,
  activation: <><circle cx="8" cy="8" r="4" /><path d="m11 11 10 10m-4-4 3-3m-1 5 3-3" /></>,
};

const NavigationIcon: React.FC<{ view: AppView }> = ({ view }) => (
  <span className="nav-icon" aria-hidden="true">
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {navigationIcons[view]}
    </svg>
  </span>
);

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
            <span className="back-icon" aria-hidden="true">
              <span className="back-arrow-glyph">←</span>
              <svg className="back-arrow-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" focusable="false">
                <path d="M19 12H5m6-6-6 6 6 6" />
              </svg>
            </span><span className="back-label"> Voltar</span>
          </button>
        )}
        <div
          className="brand-container"
          onClick={() => onNavigate('home')}
          role="button"
          tabIndex={0}
          aria-label="Xandeflix Prebuilt - Início"
        >
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"><path d="m5 4 14 16M19 4 5 20" /></svg>
          </span>
          <span className="brand-logo">XANDEFLIX</span>
          <span className="brand-sub">PREBUILT</span>
        </div>
        {(currentView === 'movies' || currentView === 'series' || currentView === 'search' || currentView === 'activation') && (
          <button
            type="button"
            className="focusable-item header-home-button"
            onClick={() => onNavigate('home')}
            aria-label="Ir para Início"
            title="Início"
          >
            <NavigationIcon view="home" />
          </button>
        )}
      </div>

      <nav className="header-nav" aria-label="Navegação Principal">
        <button
          type="button"
          className={`focusable-item nav-link ${currentView === 'home' ? 'active' : ''}`}
          aria-current={currentView === 'home' ? 'page' : undefined}
          aria-label="Início"
          title="Início"
          onClick={() => onNavigate('home')}
        >
          <NavigationIcon view="home" /><span className="nav-label">Início</span>
        </button>
        <button
          type="button"
          className={`focusable-item nav-link ${currentView === 'movies' ? 'active' : ''}`}
          aria-current={currentView === 'movies' ? 'page' : undefined}
          aria-label="Filmes"
          title="Filmes"
          onClick={() => onNavigate('movies')}
        >
          <NavigationIcon view="movies" /><span className="nav-label">Filmes</span>
        </button>
        <button
          type="button"
          className={`focusable-item nav-link ${currentView === 'series' ? 'active' : ''}`}
          aria-current={currentView === 'series' ? 'page' : undefined}
          aria-label="Séries"
          title="Séries"
          onClick={() => onNavigate('series')}
        >
          <NavigationIcon view="series" /><span className="nav-label">Séries</span>
        </button>
        <button
          type="button"
          className={`focusable-item nav-link ${currentView === 'live' ? 'active' : ''}`}
          aria-current={currentView === 'live' ? 'page' : undefined}
          aria-label="Canais"
          title="Canais"
          onClick={() => onNavigate('live')}
        >
          <NavigationIcon view="live" /><span className="nav-label">📺 Canais</span>
        </button>
        <button
          type="button"
          className={`focusable-item nav-link ${currentView === 'search' ? 'active' : ''}`}
          aria-current={currentView === 'search' ? 'page' : undefined}
          aria-label="Busca"
          title="Busca"
          onClick={() => onNavigate('search')}
        >
          <NavigationIcon view="search" /><span className="nav-label">Busca</span>
        </button>
        <button
          type="button"
          className={`focusable-item nav-link ${currentView === 'activation' ? 'active' : ''}`}
          aria-current={currentView === 'activation' ? 'page' : undefined}
          aria-label="Ativação"
          title="Ativação"
          onClick={() => onNavigate('activation')}
          style={{ color: '#38bdf8' }}
        >
          <NavigationIcon view="activation" /><span className="nav-label">🔑 Ativação</span>
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
        {catalogVersion === 'Sincronizando...' && (
          <div className="header-sync-status" role="status">
            <span className="badge-dot" />
            <span className="badge-text">{catalogVersion}</span>
          </div>
        )}
      </div>
    </header>

    <nav className="mobile-bottom-nav" aria-label="Navegação Mobile Inferior">
      <button
        type="button"
        className={`focusable-item mobile-nav-btn ${currentView === 'movies' ? 'active' : ''}`}
        aria-current={currentView === 'movies' ? 'page' : undefined}
        onClick={() => onNavigate('movies')}
        aria-label="Ir para Filmes"
      >
        <span className="mobile-nav-icon"><NavigationIcon view="movies" /></span>
        <span className="mobile-nav-label">Filmes</span>
      </button>
      <button
        type="button"
        className={`focusable-item mobile-nav-btn ${currentView === 'series' ? 'active' : ''}`}
        aria-current={currentView === 'series' ? 'page' : undefined}
        onClick={() => onNavigate('series')}
        aria-label="Ir para Séries"
      >
        <span className="mobile-nav-icon"><NavigationIcon view="series" /></span>
        <span className="mobile-nav-label">Séries</span>
      </button>
      <button
        type="button"
        className={`focusable-item mobile-nav-btn ${currentView === 'live' ? 'active' : ''}`}
        aria-current={currentView === 'live' ? 'page' : undefined}
        onClick={() => onNavigate('live')}
        aria-label="Ir para Canais ao Vivo"
      >
        <span className="mobile-nav-icon"><NavigationIcon view="live" /></span>
        <span className="mobile-nav-label">Canais</span>
      </button>
      <button
        type="button"
        className={`focusable-item mobile-nav-btn ${currentView === 'search' ? 'active' : ''}`}
        aria-current={currentView === 'search' ? 'page' : undefined}
        onClick={() => onNavigate('search')}
        aria-label="Ir para Busca"
      >
        <span className="mobile-nav-icon"><NavigationIcon view="search" /></span>
        <span className="mobile-nav-label">Busca</span>
      </button>
    </nav>
  </>
  );
};
