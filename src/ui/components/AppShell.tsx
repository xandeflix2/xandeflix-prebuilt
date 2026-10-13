/**
 * Xandeflix Prebuilt — AppShell Component (Gate G6)
 *
 * Shell visual principal da aplicação unindo Header, aviso de bootstrap e viewport.
 */

import React from 'react';
import type { AppView } from '../navigation/route-state.ts';
import { Header } from './Header.tsx';
import { useLandscapeNavigation } from '../hooks/useLandscapeNavigation.ts';
import { useLivePresentation } from '../hooks/useLivePresentation.ts';
import { CastButton } from './CastButton.tsx';
import { isTelevisionPresentation } from '../device-presentation.ts';
import { useDevicePresentation } from '../hooks/useDevicePresentation.ts';

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
  const landscapeNavigation = useLandscapeNavigation();
  const choice = useDevicePresentation();
  const { tabletPortrait, stackedLive, squareLive } = useLivePresentation();
  const squareLivePage = currentView === 'live' && squareLive;
  const sideNavigation = landscapeNavigation && !tabletPortrait && !squareLivePage;
  const userAgent = typeof navigator === 'undefined' ? '' : navigator.userAgent;
  const television = isTelevisionPresentation(userAgent, choice);
  const fireStick = television && /\bAFT\w*/i.test(userAgent);
  const tablet = choice ? choice === 'TABLET' : !television && (/ipad/i.test(userAgent)
    || (/macintosh/i.test(userAgent) && navigator.maxTouchPoints > 1)
    || (/android/i.test(userAgent) && !/\bmobile\b/i.test(userAgent)
      && !(navigator as Navigator & { userAgentData?: { mobile?: boolean } }).userAgentData?.mobile));
  const detailPage = currentView === 'movie-detail' || currentView === 'series-detail';
  return (
    <div className={`app-shell${fireStick ? ' app-shell--fire-stick' : ''}${tablet ? ' app-shell--tablet' : ''}${tabletPortrait ? ' app-shell--tablet-portrait' : ''}${squareLivePage ? ' app-shell--live-square' : ''}${currentView === 'live' && stackedLive ? ' app-shell--live-stacked' : ''}${sideNavigation ? ' app-shell--side-nav' : ''}${sideNavigation && currentView === 'live' ? ' app-shell--live-view' : ''}${currentView === 'live' ? ' app-shell--live-page' : ''}${currentView === 'home' ? ' app-shell--home-page' : ''}${currentView === 'movies' || currentView === 'series' || currentView === 'search' || currentView === 'activation' || currentView === 'settings' || detailPage ? ' app-shell--phone-header-back' : ''}${detailPage ? ' app-shell--phone-detail-page' : ''}`}>
      <Header
        currentView={currentView}
        tabletPortrait={tabletPortrait || squareLivePage}
        onNavigate={onNavigate}
        onBack={onBack}
        canGoBack={!sideNavigation && !tabletPortrait && currentView !== 'live' && currentView !== 'home' && canGoBack}
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
        {(sideNavigation || tabletPortrait) && canGoBack && onBack && currentView !== 'manager-panel' && currentView !== 'live' && currentView !== 'home' && (
          <div className={`page-back-row${detailPage ? ' page-back-row--detail' : ''}`}>
            <button type="button" className="focusable-item btn-back" onClick={onBack} aria-label="Voltar para a tela anterior">
              ← Voltar
            </button>
            {tablet && detailPage && <CastButton iconOnly />}
          </div>
        )}
        {children}
      </div>

    </div>
  );
};
