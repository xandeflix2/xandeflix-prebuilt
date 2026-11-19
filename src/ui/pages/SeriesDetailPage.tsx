/**
 * Xandeflix Prebuilt — SeriesDetailPage Component (Gate G6)
 *
 * Tela de detalhes de série com seleção de temporadas e listagem de episódios locais.
 *
 * Princípios:
 * - COMPLETE HIERARCHY: Series → Seasons → Episodes resolvidas a partir do catálogo local.
 * - PLAYBACK DEFERRED: Reprodução de episódios desabilitada até o Gate G8.
 */

import React, { useState, useCallback, useEffect } from 'react';
import type { CatalogReadModel } from '../../catalog/catalog-read-model.ts';
import { getSeriesDetail } from '../../catalog/catalog-selectors.ts';
import { Artwork } from '../components/Artwork.tsx';
import { DetailBackdrop } from '../components/DetailBackdrop.tsx';
import { useArtworkMetadata } from '../hooks/useArtworkMetadata.ts';
import { tmdbPosterPath, artworkCategoryContext, hasPosterYearCorrection } from '../../artwork/tmdb-metadata.service.ts';
import { useImmersiveArtwork } from '../hooks/useImmersiveArtwork.ts';
import { DetailTrailer } from '../components/DetailTrailer.tsx';
import { SeriesDetailSections } from '../components/SeriesDetailSections.tsx';
import { EpisodeListPresentation } from '../components/EpisodeListPresentation.tsx';
import { EpisodeStill } from '../components/EpisodeStill.tsx';
import { SeriesPersonalActions } from '../components/SeriesPersonalActions.tsx';
import { watchFingerprint, watchHistory } from '../../playback/watch-history.ts';
import { PhoneSeriesDetail } from '../components/PhoneSeriesDetail.tsx';
import { WatchProviders } from '../components/WatchProviders.tsx';
import { usePhoneLayout } from '../hooks/usePhoneLayout.ts';
import { useDetailInitialFocus } from '../hooks/useDetailInitialFocus.ts';
import type { CatalogItemViewModel } from '../../catalog/catalog-view-model.ts';
import { defaultPlaybackService } from '../../playback/playback.service.ts';
import { meaningfulDetailGenres } from '../detail-genres.ts';
import { observeWebSeriesDetails } from '../../web/web-playback-diagnostic.ts';

/** Ephemeral UI position; owned by the current App route, never persisted. */
export interface SeriesEpisodeReturnState {
  seasonId?: string;
  episodeId?: string;
  pendingFocus?: boolean;
  launchPending?: boolean;
}

interface SeriesDetailPageProps {
  returnState?: SeriesEpisodeReturnState;
  seriesId: string;
  readModel: CatalogReadModel;
  onBack: () => void;
  onSelectItem?: (item: CatalogItemViewModel) => void;
  onHome?: () => void;
}

export const SeriesDetailPage: React.FC<SeriesDetailPageProps> = ({
  seriesId,
  readModel,
  onBack,
  onSelectItem,
  returnState,
}) => {
  const immersive=useImmersiveArtwork(seriesId);
  const phone = usePhoneLayout();
  const sourceDetail = getSeriesDetail(readModel, seriesId);
  const identity = sourceDetail ? { kind: 'series' as const, title: sourceDetail.title,
    ...artworkCategoryContext(sourceDetail.categoryLabels, sourceDetail.seasons.some(season => season.episodesCount > 0)),
    year: sourceDetail.yearFormatted, tmdbId: sourceDetail.externalIds?.tmdbId, posterPath: tmdbPosterPath(sourceDetail.posterUri), sourcePosterUri: sourceDetail.posterUri } : undefined;
  const sourceGenres = meaningfulDetailGenres(sourceDetail?.genreLabels || []);
  const metadata = useArtworkMetadata(identity, Boolean(sourceDetail && (!sourceDetail.overview || !sourceDetail.yearFormatted
    || !sourceDetail.originalTitle || !sourceGenres.length)), 'high');
  const corrected=hasPosterYearCorrection(identity,metadata);
  const detail = sourceDetail && { ...sourceDetail,
    ...(corrected&&metadata?.title?{title:metadata.title}:{}),
    originalTitle: corrected?metadata?.originalTitle:sourceDetail.originalTitle || metadata?.originalTitle,
    yearFormatted: corrected&&metadata?.year?String(metadata.year):sourceDetail.yearFormatted || (metadata?.year ? String(metadata.year) : undefined),
    overview: corrected?metadata?.overview:sourceDetail.overview || metadata?.overview,
    genreLabels: corrected?meaningfulDetailGenres(metadata?.genres||[]):sourceGenres.length ? sourceGenres : meaningfulDetailGenres(metadata?.genres || []),
  };
  const [detailLoading, setDetailLoading] = useState(!detail);
  const [detailFailed, setDetailFailed] = useState(false);
  const [detailAttempt, setDetailAttempt] = useState(0);

  const seasons = detail?.seasons || [];
  const [localReturnState] = useState<SeriesEpisodeReturnState>(() => ({}));
  const episodeReturn = returnState || localReturnState;
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | undefined>(() => episodeReturn.seasonId);
  const selectedSeasonIndex = Math.max(0, seasons.findIndex(season => season.id === selectedSeasonId));
  const [returningToEpisode] = useState(() => Boolean(episodeReturn.pendingFocus));
  const [returnFocus] = useState(() => ({ onMount: Boolean(episodeReturn.pendingFocus), wasAway: false }));
  const [resolvingEpisodeId, setResolvingEpisodeId] = useState<string | null>(null);
    const [episodeStatusNotice, setEpisodeStatusNotice] = useState<string | null>(null);
  const [episodesLoading, setEpisodesLoading] = useState<boolean>(() => typeof readModel.loadEpisodesForSeries === 'function');
  const [episodesFailed, setEpisodesFailed] = useState(false);
  const [episodeLoadAttempt, setEpisodeLoadAttempt] = useState(0);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string | null>(() => episodeReturn.episodeId || null);
  useDetailInitialFocus(immersive,seriesId,Boolean(detail) && !returningToEpisode,phone);

  useEffect(() => {
    setSelectedEpisodeId(episodeReturn.episodeId || null);
    const unsubscribe=watchHistory.subscribe(()=>setRefreshKey(value=>value+1));
    void watchHistory.syncNativeProgress();
    return unsubscribe;
  }, [seriesId]);

  useEffect(() => {
    let active = true;
    if (readModel.seriesById.has(seriesId)) {
      setDetailLoading(false);
      return () => { active = false; };
    }
    setDetailLoading(true);
    setDetailFailed(false);
    void readModel.resolveSeriesById(seriesId).then(() => {
      if (active) {
        setDetailLoading(false);
        setRefreshKey((value) => value + 1);
      }
    }).catch(() => { if (active) { setDetailLoading(false); setDetailFailed(true); } });
    return () => { active = false; };
  }, [readModel, seriesId, detailAttempt]);

  useEffect(() => {
    let isMounted = true;
    if (typeof (readModel as any).loadEpisodesForSeries === 'function') {
      setEpisodesLoading(true);
      setEpisodesFailed(false);
      observeWebSeriesDetails(() => readModel.loadEpisodesForSeries(seriesId))
        .then(() => {
          if (isMounted) {
            setEpisodesLoading(false);
            setRefreshKey((k) => k + 1);
          }
        })
        .catch(() => {
          if (isMounted) { setEpisodesLoading(false); setEpisodesFailed(true); }
        });
    }
    return () => {
      isMounted = false;
    };
  }, [seriesId, readModel, episodeLoadAttempt]);

  const handlePlayEpisode = useCallback(
    async (episodeId: string) => {
      const season = seasons.find(value => value.episodes.some(episode => episode.id === episodeId));
      episodeReturn.seasonId = season?.id;
      episodeReturn.episodeId = episodeId;
      episodeReturn.pendingFocus = true;
      episodeReturn.launchPending = true;
      returnFocus.onMount = false;
      returnFocus.wasAway = false;
      setSelectedEpisodeId(episodeId);
      setResolvingEpisodeId(episodeId);
      setEpisodeStatusNotice(null);

      try {
        const result = await defaultPlaybackService.playEpisode(seriesId, episodeId, readModel);
        if (result.state === 'NATIVE_PLAYER_OPENED') {
          setEpisodeStatusNotice(null);
        } else if (result.state === 'NATIVE_PLAYER_UNAVAILABLE') {
          episodeReturn.pendingFocus = false;
          setEpisodeStatusNotice('Player nativo Android indisponível no navegador web.');
        } else {
          episodeReturn.pendingFocus = false;
          setEpisodeStatusNotice(result.errorMessage || 'Falha ao iniciar player nativo.');
        }
      } catch (err: unknown) {
        episodeReturn.pendingFocus = false;
        setEpisodeStatusNotice(err instanceof Error ? err.message : 'Falha na resolução de stream.');
      } finally {
        episodeReturn.launchPending = false;
        setResolvingEpisodeId(null);
      }
    },
    [seriesId, readModel, seasons, episodeReturn, returnFocus]
  );

  useEffect(() => {
    const page = immersive.current;
    if (!page || !episodeReturn.pendingFocus) return;
    let frame = 0;
    if (document.hidden) returnFocus.wasAway = true;
    const restore = () => {
      frame = 0;
      if (!episodeReturn.pendingFocus || episodeReturn.launchPending || document.hidden || (!returnFocus.onMount && !returnFocus.wasAway) || resolvingEpisodeId !== null
        || document.querySelector('dialog[open], .playback-error-notice')) return;
      const target = Array.from(page.querySelectorAll<HTMLButtonElement>('[data-series-episode-id]'))
        .find(button => button.dataset.seriesEpisodeId === episodeReturn.episodeId && !button.disabled)
          || (!episodesLoading ? page.querySelector<HTMLButtonElement|HTMLSelectElement>('.series-season-select, .season-tab.active')
          || page.querySelector<HTMLButtonElement>('.series-detail-tabs button, .series-phone-tabs button') : null);
      if (!target || !target.isConnected) return;
      target.focus({ preventScroll: true });
      if (document.activeElement !== target) return;
      (target.closest('.episode-card') || target).scrollIntoView({ behavior: 'auto', block: 'center', inline: 'nearest' });
      episodeReturn.pendingFocus = false;
      returnFocus.onMount = false;
      returnFocus.wasAway = false;
    };
    const schedule = () => {
      if (document.hidden) { returnFocus.wasAway = true; return; }
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(restore);
    };
    const departed = () => { returnFocus.wasAway = true; };
    document.addEventListener('visibilitychange', schedule);
    window.addEventListener('blur', departed);
    window.addEventListener('focus', schedule);
    schedule();
    return () => {
      if (frame) cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', schedule);
      window.removeEventListener('blur', departed);
      window.removeEventListener('focus', schedule);
    };
  }, [immersive, episodeReturn, returnFocus, resolvingEpisodeId, episodesLoading, refreshKey, selectedSeasonId]);

  if (!detail && detailLoading) {
    return <main ref={immersive} className="page-container detail-page"><p>Carregando detalhes da série...</p></main>;
  }

  if (!detail) {
    return (
      <main ref={immersive} className="page-container detail-page">
        <div className="detail-not-found">
          <h2>{detailFailed ? 'Não foi possível carregar a série' : 'Série não encontrada'}</h2>
          <p>{detailFailed ? 'Tente carregar os detalhes novamente.' : 'O título solicitado não foi localizado no catálogo ativo.'}</p>
          {detailFailed && <button type="button" className="focusable-item btn-primary" onClick={() => setDetailAttempt(v => v + 1)}>Tentar novamente</button>}
          <button type="button" className="focusable-item btn-primary" onClick={onBack}>
            Voltar ao Catálogo
          </button>
        </div>
      </main>
    );
  }

  const currentSeason = seasons[selectedSeasonIndex] || seasons[0];
  const canonicalSeries = readModel.seriesById.get(seriesId);
  const fingerprint = canonicalSeries ? watchFingerprint('series',canonicalSeries) : null;
  const lastWatched = fingerprint ? watchHistory.list().find(row=>row.kind==='series' && row.itemId===seriesId && row.fingerprint===fingerprint) : undefined;
  const selectedEpisode = selectedEpisodeId ?? lastWatched?.episodeId;
  const publicId = Number(detail.externalIds?.tmdbId);
  const episodesSection = (
        <section className="seasons-section" aria-label="Temporadas e Episódios">


          {phone && seasons.length > 0 ? (
            <select className="focusable-item series-season-select" aria-label="Selecionar temporada"
              value={currentSeason?.id || ''} onChange={event => { episodeReturn.seasonId = event.target.value; setSelectedSeasonId(event.target.value); }}>
              {seasons.map(season => <option key={season.id} value={season.id}>{season.title}</option>)}
            </select>
          ) : seasons.length > 1 ? (
            <div className="season-selector-tabs" role="tablist">
              {seasons.map((season, idx) => (
                <button
                  key={season.id}
                  type="button"
                  role="tab"
                  aria-selected={idx === selectedSeasonIndex}
                  className={`focusable-item season-tab ${idx === selectedSeasonIndex ? 'active' : ''}`}
                  onClick={() => { episodeReturn.seasonId = season.id; setSelectedSeasonId(season.id); }}
                >
                  {season.title}
                </button>
              ))}
            </div>
          ) : null}

          {episodeStatusNotice && (
            <div className="series-playback-status-banner">
              <p className="playback-status-notice notice-info">{episodeStatusNotice}</p>
            </div>
          )}

          {currentSeason && (
            <EpisodeListPresentation key={`${seriesId}:${currentSeason.id}`} readModel={readModel} seriesId={seriesId} season={currentSeason} identity={identity} enabled={!episodesLoading}>
            {(episodePresentation) => (
            <ul className="episodes-list" aria-label={`Episódios de ${currentSeason.title}`}>
              {episodesLoading && currentSeason.episodes.length === 0 ? (
                <li className="loading-episodes" role="status" aria-live="polite"><span className="episode-loading-spinner" aria-hidden="true"/>Carregando episódios da temporada...</li>
              ) : currentSeason.episodes.length === 0 ? (
                <li className="no-episodes">Nenhum episódio cadastrado para esta temporada.</li>
              ) : (
                episodePresentation.map((ep) => {
                  const resumePosition = fingerprint ? watchHistory.savedPosition('series',seriesId,fingerprint,ep.id) : 0;
                   const savedProgress = fingerprint ? watchHistory.savedProgress('series',seriesId,fingerprint,ep.id) : undefined;
                   const progressPercent = savedProgress && savedProgress.durationMs > 0 && (savedProgress.positionMs > 0 || savedProgress.completed)
                     ? Math.min(100, Math.max(0, savedProgress.completed ? 100 : 100 * savedProgress.positionMs / savedProgress.durationMs))
                     : null;
                  return (
                  <li key={ep.id} className={`episode-card episode-card--metadata${selectedEpisode===ep.id?' episode-card--selected':''}`}
                    onFocusCapture={()=>setSelectedEpisodeId(ep.id)} onClickCapture={()=>setSelectedEpisodeId(ep.id)}>
                    <div className="episode-visual">
                      <EpisodeStill uri={ep.sceneUri} source={ep.sceneSource}/>
                      {!phone && (
                        <>
                          <button
                            type="button"
                            data-series-episode-id={ep.id}
                            aria-label={`${resolvingEpisodeId === ep.id ? 'Preparando' : resumePosition > 0 ? 'Continuar assistindo' : 'Assistir'} episódio ${ep.episodeNumber}: ${ep.title}`}
                            className={`focusable-item episode-scene-action ${resolvingEpisodeId === ep.id ? 'btn-resolving' : ''}`}
                            onClick={() => handlePlayEpisode(ep.id)}
                            disabled={resolvingEpisodeId !== null}
                          >
                            <span className="episode-scene-action-label">
                              {resolvingEpisodeId === ep.id ? 'Preparando...' : resumePosition > 0 ? '▶ Continuar' : '▶ Assistir'}
                            </span>
                          </button>
                          {progressPercent !== null && (
                            <progress
                              className="episode-progress"
                              value={progressPercent}
                              max={100}
                              aria-label={`Progresso do episódio ${ep.episodeNumber}`}
                            />
                          )}
                        </>
                      )}
                    </div>
                    <div className="episode-info">
                      <div className="episode-header">
                        <h3 className="episode-title">
                          {ep.episodeNumber}. {ep.title}
                        </h3>
                        {ep.durationFormatted && (
                          <span className="episode-duration">{ep.durationFormatted}</span>
                        )}
                      </div>
                      <p className="episode-overview">{ep.overview || ''}</p>
                      {phone && (
<div className="episode-playback-action">
                        {resumePosition>0 && <span className="episode-resume-notice">Continuar assistindo</span>}
                        <button
                          type="button"
                          data-series-episode-id={ep.id}
                          aria-label={`${resolvingEpisodeId === ep.id ? 'Preparando' : resumePosition>0 ? 'Continuar' : 'Assistir'} episódio ${ep.episodeNumber}: ${ep.title}`}
                          className={`focusable-item btn-primary btn-episode-play ${resolvingEpisodeId === ep.id ? 'btn-resolving' : ''}`}
                          onClick={() => handlePlayEpisode(ep.id)}
                          disabled={resolvingEpisodeId !== null}
                        >
                          <span className="episode-play-label">{resolvingEpisodeId === ep.id ? 'Preparando...' : resumePosition>0 ? '▶ Continuar' : '▶ Assistir'}</span>
                        </button>
                      </div>
)}
                    </div>
                  </li>
                );})
              )}
            </ul>
            )}
            </EpisodeListPresentation>
          )}
          {!currentSeason && episodesLoading && <p className="loading-episodes" role="status" aria-live="polite"><span className="episode-loading-spinner" aria-hidden="true"/>Carregando temporadas e episódios...</p>}
        </section>
  );

  if (phone && identity) return (
    <main ref={immersive} className="page-container detail-page series-phone-detail">
      <PhoneSeriesDetail key={seriesId} detail={detail} identity={identity} readModel={readModel}
        episodes={episodesSection} episodesLoading={episodesLoading} episodesFailed={episodesFailed}
        selectedSeasonIndex={selectedSeasonIndex} resolving={resolvingEpisodeId !== null}
        onPlay={id => {void handlePlayEpisode(id);}} onRetryEpisodes={() => setEpisodeLoadAttempt(value => value + 1)}
        onBack={onBack} onSelectItem={onSelectItem}/>
    </main>
  );

  return (
    <main ref={immersive} className={`page-container detail-page detail-page--wide${typeof navigator !== 'undefined' && /\bAFT\w*/i.test(navigator.userAgent) ? ' detail-page--fire' : ''}`}>
      <div className="detail-content">
        <div className="detail-hero-wide">
      <div className="detail-backdrop-wrapper">
        <DetailBackdrop
          backdrop={detail.backdropUri}
          poster={detail.posterUri}
          identity={identity}
          title={detail.title}
          className="detail-backdrop-img"
        />
        <div className="detail-backdrop-gradient" />
      </div>

        <div className="detail-layout" data-detail-hero tabIndex={-1}>
          <div className="detail-poster-col">
            <Artwork
              uri={detail.posterUri}
              identity={identity}
              priority="high"
              title={detail.title}
              kind="poster"
              immersiveArtwork="poster"
              className="detail-poster-img"
            />
            <WatchProviders identity={identity}/>
          </div>

          <div className="detail-info-col">
            <div className="detail-meta-row">
              <span className="detail-kind-badge">SÉRIE</span>
              {detail.yearFormatted && (
                <span className="detail-meta-item">{detail.yearFormatted}</span>
              )}
              <span className="detail-meta-item">
                {seasons.length} {seasons.length === 1 ? 'Temporada' : 'Temporadas'}
              </span>
            </div>

            <h1 className="detail-title">{detail.title}</h1>
            {detail.originalTitle && detail.originalTitle !== detail.title && (
              <h2 className="detail-orig-title">Título original: {detail.originalTitle}</h2>
            )}

            {detail.genreLabels.length > 0 && (
              <div className="detail-genres">
                {detail.genreLabels.map((genre) => (
                  <span key={genre} className="genre-pill">
                    {genre}
                  </span>
                ))}
              </div>
            )}

            {detail.overview && (
              <div className="detail-overview-block">
                <h3 className="section-heading">Sinopse</h3>
                <p className="detail-overview-text">{detail.overview}</p>
              </div>
            )}

            <div className="detail-actions series-detail-hero-actions">
              {identity && <DetailTrailer key={seriesId} title={detail.title} identity={identity} backdrop={detail.backdropUri} poster={detail.posterUri}/>}
              <SeriesPersonalActions key={seriesId} itemId={seriesId} title={detail.title}
                fingerprint={watchFingerprint('series',readModel.seriesById.get(seriesId)!)}
                tmdbId={Number.isSafeInteger(publicId)&&publicId>0?publicId:undefined}/>
            </div>
          </div>
        </div>
        </div>
        <SeriesDetailSections key={seriesId} seriesId={seriesId} identity={identity}
          readModel={readModel} episodes={episodesSection} episodesFailed={episodesFailed}
          onRetryEpisodes={()=>setEpisodeLoadAttempt(value=>value+1)} onSelectItem={onSelectItem}/>
      </div>
    </main>
  );
};
