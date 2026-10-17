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
import { isFireTvPresentation, isTelevisionPresentation } from '../device-presentation.ts';
import { useDevicePresentation } from '../hooks/useDevicePresentation.ts';
import { useParentalControl } from '../hooks/useParentalControl.ts';
import { parentalControl } from '../../parental/parental-control.store.ts';
import { ParentalPinDialog } from './ParentalPinDialog.tsx';
import { StartupLoadingScreen } from './StartupLoadingScreen.tsx';

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
  const parental = useParentalControl();
  React.useEffect(() => {
    const changed = () => { if (document.hidden) parentalControl.lock(); };
    document.addEventListener('visibilitychange', changed);
    return () => document.removeEventListener('visibilitychange', changed);
  }, []);
  React.useEffect(() => { parentalControl.cancelPrompt(); }, [currentView]);
  const landscapeNavigation = useLandscapeNavigation();
  const choice = useDevicePresentation();
  const { tabletPortrait, stackedLive, squareLive } = useLivePresentation();
  const squareLivePage = currentView === 'live' && squareLive;
  const sideNavigation = landscapeNavigation && !tabletPortrait && !squareLivePage;
  const userAgent = typeof navigator === 'undefined' ? '' : navigator.userAgent;
  const television = isTelevisionPresentation(userAgent, choice);
  const fireStick = isFireTvPresentation(userAgent, choice);
  const androidTv = television && /\bandroid\b/i.test(userAgent);
  const tablet = choice ? choice === 'TABLET' : !television && (/ipad/i.test(userAgent)
    || (/macintosh/i.test(userAgent) && navigator.maxTouchPoints > 1)
    || (/android/i.test(userAgent) && !/\bmobile\b/i.test(userAgent)
      && !(navigator as Navigator & { userAgentData?: { mobile?: boolean } }).userAgentData?.mobile));
  const detailPage = currentView === 'movie-detail' || currentView === 'series-detail';
  const remoteBackOnly = television && (currentView === 'movies' || currentView === 'series' || detailPage);
  if (parental.status === 'loading') return <StartupLoadingScreen stage="reading"/>;
  return (
    <div className={`app-shell${television ? ' app-shell--television' : ''}${androidTv ? ' app-shell--android-tv' : ''}${squareLive ? ' app-shell--square-display' : ''}${fireStick ? ' app-shell--fire-stick' : ''}${tablet ? ' app-shell--tablet' : ''}${tabletPortrait ? ' app-shell--tablet-portrait' : ''}${squareLivePage ? ' app-shell--live-square' : ''}${currentView === 'live' && stackedLive ? ' app-shell--live-stacked' : ''}${sideNavigation ? ' app-shell--side-nav' : ''}${sideNavigation && currentView === 'live' ? ' app-shell--live-view' : ''}${currentView === 'live' ? ' app-shell--live-page' : ''}${currentView === 'home' ? ' app-shell--home-page' : ''}${currentView === 'movies' || currentView === 'series' || currentView === 'search' || currentView === 'activation' || currentView === 'settings' || detailPage ? ' app-shell--phone-header-back' : ''}${detailPage ? ' app-shell--phone-detail-page' : ''}`}>
      <Header
        currentView={currentView}
        tabletPortrait={tabletPortrait || squareLivePage}
        onNavigate={onNavigate}
        onBack={onBack}
        canGoBack={!remoteBackOnly && !sideNavigation && !tabletPortrait && currentView !== 'live' && currentView !== 'home' && canGoBack}
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
        {!remoteBackOnly && (sideNavigation || tabletPortrait) && canGoBack && onBack && currentView !== 'manager-panel' && currentView !== 'live' && currentView !== 'home' && (
          <div className={`page-back-row${detailPage ? ' page-back-row--detail' : ''}${currentView === 'movies' || currentView === 'series' ? ' page-back-row--browse' : ''}`}>
            <button type="button" className="focusable-item btn-back" onClick={onBack} aria-label="Voltar para a tela anterior">
              ← Voltar
            </button>
            {tablet && detailPage && <CastButton iconOnly />}
          </div>
        )}
        {parental.status === 'error' && currentView !== 'settings' && currentView !== 'parental-control'
            ? <div role="alert"><p>A proteção local está indisponível. O acesso ao catálogo permanece bloqueado.</p><button className="focusable-item btn-secondary" type="button" onClick={() => onNavigate('settings')}>Abrir configurações</button></div> : children}
      </div>
      <ParentalPinDialog/>
    </div>
  );
};
