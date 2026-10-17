import React, { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { Artwork } from './Artwork.tsx';
import { getStartupCatalogPreview, getEmptyStartupCatalogPreview, subscribeStartupCatalogPreview, type StartupPoster } from '../../artwork/startup-catalog-preview.ts';
import './StartupLoadingScreen.css';
import { usePhoneLayout } from '../hooks/usePhoneLayout.ts';
import { useLivePresentation } from '../hooks/useLivePresentation.ts';
import { StartupBackdrop } from './StartupBackdrop.tsx';
import { startupTrendingArtworkService } from '../../artwork/startup-trending-artwork.service.ts';

export type StartupLoadingStage = 'reading' | 'checking' | 'catalog' | 'validating' | 'artwork' | 'offline' | 'error';
const stages = ['Preparação', 'Catálogo', 'Organização', 'Sua Home'];
const stageIndex: Record<StartupLoadingStage, number> = { reading: 0, checking: 0, catalog: 1, validating: 2, artwork: 3, offline: 1, error: 1 };
const stageMessages: Record<StartupLoadingStage, string> = {
  reading: 'Iniciando o aplicativo', checking: 'Conferindo seu acesso', catalog: 'Organizando filmes, séries e canais',
  validating: 'Preparando o catálogo para você', artwork: 'Preparando o hero e as primeiras capas',
  offline: 'Aguardando conexão com a internet', error: 'Não foi possível concluir o carregamento',
};
interface Props {
  stage?: StartupLoadingStage;
  percentage?: number;
  posters?: readonly StartupPoster[];
  previewEnabled?: boolean;
  modal?: boolean;
  className?: string;
  actions?: React.ReactNode;
  titleId?: string;
  messageId?: string;
}

/** Presentation only: does not start sync, fetch catalogs or control app readiness. */
export function StartupLoadingScreen({ stage = 'checking', percentage, posters, previewEnabled = true, modal = false, className = '', actions,
  titleId = 'startup-loading-title', messageId = 'startup-loading-message' }: Props) {
  const observed = useSyncExternalStore(subscribeStartupCatalogPreview, getStartupCatalogPreview, getEmptyStartupCatalogPreview);
  const phone = usePhoneLayout();
  const { squareLive } = useLivePresentation();
  const mobile = phone && !squareLive;
  const [hidden, setHidden] = useState(() => typeof document !== 'undefined' && document.visibilityState === 'hidden');
  const [online, setOnline] = useState(() => typeof navigator === 'undefined' || navigator.onLine !== false);
  const paused = stage === 'error' || stage === 'offline';
  useEffect(() => {
    const update = () => setHidden(document.visibilityState === 'hidden');
    const connectivity = () => setOnline(navigator.onLine !== false);
    document.addEventListener('visibilitychange', update);
    window.addEventListener('online', connectivity); window.addEventListener('offline', connectivity);
    return () => {
      document.removeEventListener('visibilitychange', update);
      window.removeEventListener('online', connectivity); window.removeEventListener('offline', connectivity);
    };
  }, []);
  const subscribeTrends = useCallback((listener: () => void) => !hidden && !paused && online
    ? startupTrendingArtworkService.subscribe(listener) : () => {}, [hidden, paused, online]);
  const trends = useSyncExternalStore(subscribeTrends, startupTrendingArtworkService.getSnapshot, startupTrendingArtworkService.getServerSnapshot);
  const covers = useMemo(() => trends.length ? trends : previewEnabled ? (posters?.length ? posters : observed).slice(0, 6) : [], [trends, posters, observed, previewEnabled]);
  const trending = covers[0]?.category === 'Em alta no TMDB';
  const measured = typeof percentage === 'number' && Number.isFinite(percentage) ? Math.min(100, Math.max(0, percentage)) : undefined;
  const step = stageIndex[stage];
  return <section className={`startup-loading-screen${mobile ? ' startup-loading-screen--mobile' : ''}${paused || hidden ? ' startup-loading-screen--paused' : ''} ${className}`} role={modal ? 'dialog' : undefined}
    aria-modal={modal || undefined} aria-labelledby={titleId} aria-describedby={messageId}>
    <StartupBackdrop key={mobile ? 'portrait' : 'horizontal'} mobile={mobile} posters={covers} paused={paused || hidden}/>
    <div className="startup-loading-layout">
      {!mobile && <div className="startup-preview" aria-label={trending ? 'Tendências do cinema no TMDB' : 'Amostra de filmes do seu catálogo'}>
        <p className="startup-preview-eyebrow">{trending ? 'TENDÊNCIAS DO CINEMA' : 'UMA PRÉVIA DO QUE VEM AÍ'}</p>
        <div className="startup-preview-grid">
          {Array.from({ length: 6 }, (_, index) => <div className="startup-preview-card" key={index}>
            {covers[index] ? <><Artwork key={covers[index].uri} uri={covers[index].uri} title={covers[index].title} startup/>
              <div className="startup-preview-caption"><span>{covers[index].category}</span><strong>{covers[index].title}</strong></div></>
              : <div className="startup-preview-placeholder" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="7" y="6" width="34" height="36" rx="4"/><path d="M15 6v36M33 6v36M7 15h8M7 24h8M7 33h8M33 15h8M33 24h8M33 33h8"/></svg></div>}
          </div>)}
        </div>
        <p className="startup-preview-note">{trending ? 'Em alta no TMDB. A disponibilidade depende do seu catálogo.' : covers.length ? 'Uma amostra dos filmes que estamos preparando para você.' : 'Preparando as primeiras imagens para você.'}</p>
      </div>}
      <div className="startup-loading-info">
        <div className="startup-loading-brand" aria-label="Xandeflix">XANDE<span>FLIX</span></div>
        <p className="startup-loading-eyebrow">{mobile && trending ? 'TENDÊNCIAS DO CINEMA · TMDB' : 'SEU CINEMA, DO SEU JEITO'}</p>
        <h1 id={titleId}>{paused ? stage === 'offline' ? 'Vamos continuar quando a conexão voltar' : 'Precisamos tentar mais uma vez' : 'A diversão já vai começar'}</h1>
        <p className="startup-loading-subtitle">{paused ? 'Seu acesso continua protegido. Você pode conferir a conexão e tentar novamente.' : 'Estamos preparando sua experiência. Em instantes, você poderá explorar seus próximos favoritos.'}</p>
        <div className="startup-loading-progress-heading"><span id={messageId} role="status" aria-live="polite">{stageMessages[stage]}</span>
          <strong>{measured === undefined ? `${String(step + 1).padStart(2, '0')} / 04` : `${Math.round(measured)}%`}</strong></div>
        <div className={`startup-loading-progress${measured === undefined && !paused ? ' startup-loading-progress--active' : ''}`}
          role="progressbar" aria-label={stageMessages[stage]} aria-valuemin={0} aria-valuemax={100} aria-valuenow={measured}
          aria-valuetext={measured === undefined ? `Etapa ${step + 1} de 4: ${stageMessages[stage]}` : `${Math.round(measured)}%`}>
          <span style={{ width: `${measured ?? [12, 40, 72, 90][step]}%` }}/>
        </div>
        <ol className="startup-loading-stages" aria-label="Etapas de preparação">{stages.map((label, index) => <li key={label} aria-current={index === step ? 'step' : undefined}
          className={index < step ? 'startup-step--done' : ''}><span aria-hidden="true">{index < step ? '✓' : index + 1}</span>{label}</li>)}</ol>
        {actions && <div className="startup-loading-actions">{actions}</div>}
        {!paused && <p className="startup-loading-footnote">A Home abre assim que estiver pronta. Os demais conteúdos continuam carregando em segundo plano.</p>}
      </div>
    </div>
  </section>;
}
