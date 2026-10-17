import React from 'react';
import type { BootSyncProgress } from '../../bootstrap/boot-sync-coordinator.ts';
import { StartupLoadingScreen, type StartupLoadingStage } from './StartupLoadingScreen.tsx';

export type FirstRealSyncCatalogState =
  | 'SYNCING_FIRST_REAL_CATALOG'
  | 'OFFLINE_WAITING_FOR_SYNC'
  | 'CATALOG_SYNC_ERROR';

interface FirstRealSyncStateProps {
  catalogState: FirstRealSyncCatalogState;
  progressText?: string;
  progress?: BootSyncProgress;
  errorMessage?: string;
  onOpenActivation?: () => void;
  onOpenPortal?: () => void;
  onRetry?: () => void;
}
export const FirstRealSyncState: React.FC<FirstRealSyncStateProps> = ({
  catalogState, progress, onOpenActivation, onOpenPortal, onRetry,
}) => {
  const paused = catalogState !== 'SYNCING_FIRST_REAL_CATALOG';
  const stage: StartupLoadingStage = catalogState === 'OFFLINE_WAITING_FOR_SYNC' ? 'offline'
    : catalogState === 'CATALOG_SYNC_ERROR' ? 'error'
    : progress?.state === 'VALIDATING' || progress?.state === 'PROMOTING' ? 'validating'
    : progress?.state === 'READY' ? 'artwork'
    : !progress || ['IDLE', 'CHECKING', 'CHECKING_SOURCE'].includes(progress.state) ? 'checking' : 'catalog';
  const percentage = !paused && typeof progress?.percentage === 'number' && Number.isFinite(progress.percentage)
    ? Math.min(99, Math.max(0, progress.percentage)) : undefined;
  return <StartupLoadingScreen stage={stage} percentage={percentage} actions={paused ? <>
    {onRetry && <button type="button" className="focusable-item btn-primary" onClick={onRetry}>Tentar novamente</button>}
    {onOpenActivation && <button type="button" className="focusable-item btn-secondary" onClick={onOpenActivation}>Ver ativação</button>}
    {onOpenPortal && <button type="button" className="focusable-item btn-secondary" onClick={onOpenPortal}>Portal do cliente</button>}
  </> : undefined}/>;
};
