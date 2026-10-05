/**
 * Xandeflix Prebuilt — AppShell Component (Gate G6)
 *
 * Shell visual principal da aplicação unindo Header, aviso de bootstrap e viewport.
 */

import React from 'react';
import type { AppView } from '../navigation/route-state.ts';
import { Header } from './Header.tsx';
import { useLandscapeNavigation } from '../hooks/useLandscapeNavigation.ts';

interface AppShellProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  onBack?: () => void;
  canGoBack?: boolean;
  snapshotId?: string;
  catalogVersion?: string;
  warningNotice?: string | null;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentView,
  onNavigate,
  onBack,
  canGoBack = false,
  snapshotId,
  catalogVersion,
  warningNotice,
  children,
}) => {
  const sideNavigation = useLandscapeNavigation();
  const detailPage = currentView === 'movie-detail' || currentView === 'series-detail';
  return (
    <div className={`app-shell${sideNavigation ? ' app-shell--side-nav' : ''}${sideNavigation && currentView === 'live' ? ' app-shell--live-view' : ''}${currentView === 'live' ? ' app-shell--live-page' : ''}${currentView === 'home' ? ' app-shell--home-page' : ''}${currentView === 'movies' || currentView === 'series' || currentView === 'search' || currentView === 'activation' || detailPage ? ' app-shell--phone-header-back' : ''}${detailPage ? ' app-shell--phone-detail-page' : ''}`}>
      <Header
        currentView={currentView}
        onNavigate={onNavigate}
        onBack={onBack}
        canGoBack={!sideNavigation && currentView !== 'live' && currentView !== 'home' && canGoBack}
        snapshotId={snapshotId}
        catalogVersion={catalogVersion}
      />

      {warningNotice && (
        <div className="warning-banner" role="alert">
          <span className="warning-icon">⚠️</span>
          <span className="warning-text">{warningNotice}</span>
        </div>
      )}

      <div className="app-content">
        {sideNavigation && canGoBack && onBack && currentView !== 'live' && currentView !== 'home' && (
          <div className="page-back-row">
            <button type="button" className="focusable-item btn-back" onClick={onBack} aria-label="Voltar para a tela anterior">
              ← Voltar
            </button>
          </div>
        )}
        {children}
      </div>

      <footer className="app-footer">
        <div className="footer-left">
          <span>Xandeflix Prebuilt</span>
          <span className="footer-dot">•</span>
          <span>Catálogo Local</span>
        </div>
        <div className="footer-right">
          {snapshotId && <span className="footer-snapshot">Snapshot: {snapshotId}</span>}
        </div>
      </footer>
    </div>
  );
};
