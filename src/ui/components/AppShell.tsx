/**
 * Xandeflix Prebuilt — AppShell Component (Gate G6)
 *
 * Shell visual principal da aplicação unindo Header, aviso de bootstrap e viewport.
 */

import React from 'react';
import type { AppView } from '../navigation/route-state.ts';
import { Header } from './Header.tsx';

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
  return (
    <div className="app-shell">
      <Header
        currentView={currentView}
        onNavigate={onNavigate}
        onBack={onBack}
        canGoBack={canGoBack}
        snapshotId={snapshotId}
        catalogVersion={catalogVersion}
      />

      {warningNotice && (
        <div className="warning-banner" role="alert">
          <span className="warning-icon">⚠️</span>
          <span className="warning-text">{warningNotice}</span>
        </div>
      )}

      <div className="app-content">{children}</div>

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
