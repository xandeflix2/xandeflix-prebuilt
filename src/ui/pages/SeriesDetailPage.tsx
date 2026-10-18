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
import { useArtworkMetadata } from '../hooks/useArtworkMetadata.ts';
import { tmdbPosterPath } from '../../artwork/tmdb-metadata.service.ts';
import { useImmersiveArtwork } from '../hooks/useImmersiveArtwork.ts';
import { DetailTrailer } from '../components/DetailTrailer.tsx';
import { SeriesDetailSections } from '../components/SeriesDetailSections.tsx';
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

interface SeriesDetailPageProps {
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
}) => {
  const immersive=useImmersiveArtwork(seriesId);
  const phone = usePhoneLayout();
  const sourceDetail = getSeriesDetail(readModel, seriesId);
  const identity = sourceDetail ? { kind: 'series' as const, title: sourceDetail.title,
    year: sourceDetail.yearFormatted, tmdbId: sourceDetail.externalIds?.tmdbId, posterPath: tmdbPosterPath(sourceDetail.posterUri), sourcePosterUri: sourceDetail.posterUri } : undefined;
  const sourceGenres = meaningfulDetailGenres(sourceDetail?.genreLabels || []);
  const metadata = useArtworkMetadata(identity, Boolean(sourceDetail && (!sourceDetail.overview || !sourceDetail.yearFormatted
    || !sourceDetail.originalTitle || !sourceGenres.length)), 'high');
  const detail = sourceDetail && { ...sourceDetail,
    originalTitle: sourceDetail.originalTitle || metadata?.originalTitle,
    yearFormatted: sourceDetail.yearFormatted || (metadata?.year ? String(metadata.year) : undefined),
    overview: sourceDetail.overview || metadata?.overview,
    genreLabels: sourceGenres.length ? sourceGenres : meaningfulDetailGenres(metadata?.genres || []),
  };
  const [detailLoading, setDetailLoading] = useState(!detail);
  const [detailFailed, setDetailFailed] = useState(false);
  const [detailAttempt, setDetailAttempt] = useState(0);

  const seasons = detail?.seasons || [];
  const [selectedSeasonIndex, setSelectedSeasonIndex] = useState<number>(0);
  const [resolvingEpisodeId, setResolvingEpisodeId] = useState<string | null>(null);
    const [episodeStatusNotice, setEpisodeStatusNotice] = useState<string | null>(null);
  const [episodesLoading, setEpisodesLoading] = useState<boolean>(() => typeof readModel.loadEpisodesForSeries === 'function');
  const [episodesFailed, setEpisodesFailed] = useState(false);
  const [episodeLoadAttempt, setEpisodeLoadAttempt] = useState(0);
  const [, setRefreshKey] = useState<number>(0);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string | null>(null);
  useDetailInitialFocus(immersive,seriesId,Boolean(detail),phone);

  useEffect(() => {
    setSelectedEpisodeId(null);
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
      setResolvingEpisodeId(episodeId);
      setEpisodeStatusNotice(null);

      try {
        const result = await defaultPlaybackService.playEpisode(seriesId, episodeId, readModel);
        if (result.state === 'NATIVE_PLAYER_OPENED') {
          setEpisodeStatusNotice(null);
        } else if (result.state === 'NATIVE_PLAYER_UNAVAILABLE') {
          setEpisodeStatusNotice('Player nativo Android indisponível no navegador web.');
        } else {
          setEpisodeStatusNotice(result.errorMessage || 'Falha ao iniciar player nativo.');
        }
      } catch (err: unknown) {
        setEpisodeStatusNotice(err instanceof Error ? err.message : 'Falha na resolução de stream.');
      } finally {
        setResolvingEpisodeId(null);
      }
    },
    [seriesId, readModel]
  );

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
          <h2 className="section-heading">Episódios</h2>

          {seasons.length > 1 && (
            <div className="season-selector-tabs" role="tablist">
              {seasons.map((season, idx) => (
                <button
                  key={season.id}
                  type="button"
                  role="tab"
                  aria-selected={idx === selectedSeasonIndex}
                  className={`focusable-item season-tab ${idx === selectedSeasonIndex ? 'active' : ''}`}
                  onClick={() => setSelectedSeasonIndex(idx)}
                >
                  {season.title}
                </button>
              ))}
            </div>
          )}

          {episodeStatusNotice && (
            <div className="series-playback-status-banner">
              <p className="playback-status-notice notice-info">{episodeStatusNotice}</p>
            </div>
          )}

          {currentSeason && (
            <ul className="episodes-list" aria-label={`Episódios de ${currentSeason.title}`}>
              {episodesLoading && currentSeason.episodes.length === 0 ? (
                <li className="loading-episodes" role="status" aria-live="polite"><span className="episode-loading-spinner" aria-hidden="true"/>Carregando episódios da temporada...</li>
              ) : currentSeason.episodes.length === 0 ? (
                <li className="no-episodes">Nenhum episódio cadastrado para esta temporada.</li>
              ) : (
                currentSeason.episodes.map((ep) => {
                  const resumePosition = fingerprint ? watchHistory.savedPosition('series',seriesId,fingerprint,ep.id) : 0;
                  return (
                  <li key={ep.id} className={`episode-card${selectedEpisode===ep.id?' episode-card--selected':''}`}
                    onFocusCapture={()=>setSelectedEpisodeId(ep.id)} onClickCapture={()=>setSelectedEpisodeId(ep.id)}>
                    <div className="episode-info">
                      <div className="episode-header">
                        <h3 className="episode-title">
                          {ep.episodeNumber}. {ep.title}
                        </h3>
                        {ep.durationFormatted && (
                          <span className="episode-duration">{ep.durationFormatted}</span>
                        )}
                      </div>
                      {ep.overview && <p className="episode-overview">{ep.overview}</p>}
                      <div className="episode-playback-action">
                        {resumePosition>0 && <span className="episode-resume-notice">Continuar assistindo</span>}
                        <button
                          type="button"
                          className={`focusable-item btn-primary btn-episode-play ${resolvingEpisodeId === ep.id ? 'btn-resolving' : ''}`}
                          onClick={() => handlePlayEpisode(ep.id)}
                          disabled={resolvingEpisodeId !== null}
                        >
                          {resolvingEpisodeId === ep.id ? 'Preparando...' : resumePosition>0 ? '▶ Continuar' : '▶ Assistir'}
                        </button>
                      </div>
                    </div>
                  </li>
                );})
              )}
            </ul>
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
        <Artwork
          uri={detail.backdropUri}
          fallbackUri={detail.posterUri}
          identity={identity}
          priority="high"
          tmdbBackdropOnly
          immersiveArtwork="backdrop"
          title={detail.title}
          kind="backdrop"
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
        <SeriesDetailSections key={seriesId} seriesId={seriesId}
          readModel={readModel} episodes={episodesSection} episodesFailed={episodesFailed}
          onRetryEpisodes={()=>setEpisodeLoadAttempt(value=>value+1)} onSelectItem={onSelectItem}/>
      </div>
    </main>
  );
};
