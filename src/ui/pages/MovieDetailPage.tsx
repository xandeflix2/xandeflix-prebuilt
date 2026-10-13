/**
 * Xandeflix Prebuilt — MovieDetailPage Component (Gate G6)
 *
 * Tela de detalhes de filme a partir de metadados locais canônicos.
 *
 * Princípios:
 * - SAFE RENDERING: Trata campos ausentes sem renderizar undefined/null/NaN.
 * - PLAYBACK DEFERRED: Botão "Assistir" desabilitado com aviso explicativo do Gate G8.
 */

import React, { useState, useCallback, useEffect } from 'react';
import type { CatalogReadModel } from '../../catalog/catalog-read-model.ts';
import { getMovieDetail } from '../../catalog/catalog-selectors.ts';
import { Artwork } from '../components/Artwork.tsx';
import { useArtworkMetadata } from '../hooks/useArtworkMetadata.ts';
import { tmdbPosterPath } from '../../artwork/tmdb-metadata.service.ts';
import { RelatedTitles } from '../components/RelatedTitles.tsx';
import { useImmersiveArtwork } from '../hooks/useImmersiveArtwork.ts';
import { useDetailInitialFocus } from '../hooks/useDetailInitialFocus.ts';
import { DetailTrailer } from '../components/DetailTrailer.tsx';
import { SeriesPersonalActions } from '../components/SeriesPersonalActions.tsx';
import { watchFingerprint } from '../../playback/watch-history.ts';
import type { CatalogItemViewModel } from '../../catalog/catalog-view-model.ts';
import { defaultPlaybackService } from '../../playback/playback.service.ts';
import { PhoneMovieDetail } from '../components/PhoneMovieDetail.tsx';
import { usePhoneLayout } from '../hooks/usePhoneLayout.ts';

interface MovieDetailPageProps {
  movieId: string;
  readModel: CatalogReadModel;
  onBack: () => void;
  onSelectItem?: (item: CatalogItemViewModel) => void;
  onHome?: () => void;
}

export const MovieDetailPage: React.FC<MovieDetailPageProps> = ({ movieId, readModel, onBack, onSelectItem }) => {
  const phone = usePhoneLayout();
  const immersive=useImmersiveArtwork(movieId);
  const sourceDetail = getMovieDetail(readModel, movieId);
  const identity = sourceDetail ? { kind: 'movie' as const, title: sourceDetail.title,
    year: sourceDetail.yearFormatted, tmdbId: sourceDetail.externalIds?.tmdbId, posterPath: tmdbPosterPath(sourceDetail.posterUri), sourcePosterUri: sourceDetail.posterUri } : undefined;
  const metadata = useArtworkMetadata(identity, Boolean(sourceDetail && (!sourceDetail.overview || !sourceDetail.yearFormatted
    || !sourceDetail.originalTitle || !sourceDetail.durationFormatted || !sourceDetail.genreLabels.length)), 'high');
  const detail = sourceDetail && { ...sourceDetail,
    originalTitle: sourceDetail.originalTitle || metadata?.originalTitle,
    yearFormatted: sourceDetail.yearFormatted || (metadata?.year ? String(metadata.year) : undefined),
    durationFormatted: sourceDetail.durationFormatted || metadata?.durationFormatted,
    overview: sourceDetail.overview || metadata?.overview,
    genreLabels: sourceDetail.genreLabels.length ? sourceDetail.genreLabels : metadata?.genres || [],
  };
  const [detailLoading, setDetailLoading] = useState(!detail);
  const [detailFailed, setDetailFailed] = useState(false);
  const [detailAttempt, setDetailAttempt] = useState(0);
  const [, setResolvedVersion] = useState(0);
  const [isResolving, setIsResolving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusKind, setStatusKind] = useState<'info' | 'error' | null>(null);
  useDetailInitialFocus(immersive,movieId,Boolean(detail));

  useEffect(() => {
    let active = true;
    if (readModel.moviesById.has(movieId)) {
      setDetailLoading(false);
      return () => { active = false; };
    }
    setDetailLoading(true);
    setDetailFailed(false);
    void readModel.resolveMovieById(movieId).then(() => {
      if (active) {
        setDetailLoading(false);
        setResolvedVersion((value) => value + 1);
      }
    }).catch(() => { if (active) { setDetailLoading(false); setDetailFailed(true); } });
    return () => { active = false; };
  }, [movieId, readModel, detailAttempt]);

  const handlePlayMovie = useCallback(async () => {
    setIsResolving(true);
    setStatusKind('info');
    setStatusMessage('Preparando reprodução...');

    try {
      const result = await defaultPlaybackService.playMovie(movieId, readModel);
      if (result.state === 'NATIVE_PLAYER_OPENED') {
        setStatusMessage(null);
        setStatusKind(null);
      } else if (result.state === 'NATIVE_PLAYER_UNAVAILABLE') {
        setStatusKind('info');
        setStatusMessage('Player nativo Android indisponível no navegador web.');
      } else {
        setStatusKind('error');
        setStatusMessage(result.errorMessage || 'Falha ao iniciar player nativo.');
      }
    } catch (err: unknown) {
      setStatusKind('error');
      setStatusMessage(err instanceof Error ? err.message : 'Falha na resolução de stream.');
    } finally {
      setIsResolving(false);
    }
  }, [movieId, readModel]);

  if (!detail && detailLoading) {
    return <main ref={immersive} className="page-container detail-page"><p>Carregando detalhes do filme...</p></main>;
  }

  if (!detail) {
    return (
      <main ref={immersive} className="page-container detail-page">
        <div className="detail-not-found">
          <h2>{detailFailed ? 'Não foi possível carregar o filme' : 'Filme não encontrado'}</h2>
          <p>{detailFailed ? 'Tente carregar os detalhes novamente.' : 'O título solicitado não foi localizado no catálogo ativo.'}</p>
          {detailFailed && <button type="button" className="focusable-item btn-primary" onClick={() => setDetailAttempt(v => v + 1)}>Tentar novamente</button>}
          <button type="button" className="focusable-item btn-primary" onClick={onBack}>
            Voltar ao Catálogo
          </button>
        </div>
      </main>
    );
  }

  if (phone && identity) return (
    <main ref={immersive} className="page-container detail-page series-phone-detail movie-phone-detail">
      <PhoneMovieDetail key={movieId} detail={detail} identity={identity} readModel={readModel}
        resolving={isResolving} statusMessage={statusMessage} statusKind={statusKind}
        onPlay={() => { void handlePlayMovie(); }} onBack={onBack} onSelectItem={onSelectItem}/>
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
          </div>

          <div className="detail-info-col">
            <div className="detail-meta-row">
              <span className="detail-kind-badge">FILME</span>
              {detail.yearFormatted && (
                <span className="detail-meta-item">{detail.yearFormatted}</span>
              )}
              {detail.durationFormatted && (
                <span className="detail-meta-item">{detail.durationFormatted}</span>
              )}
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
              <div className="playback-action-container">
                <button
                  type="button"
                  data-detail-focus
                  className={`focusable-item btn-primary ${isResolving ? 'btn-resolving' : ''}`}
                  onClick={handlePlayMovie}
                  disabled={isResolving}
                >
                  {isResolving ? 'Preparando reprodução...' : '▶ Assistir'}
                </button>

                {statusMessage && (
                  <p className={`playback-status-notice ${statusKind === 'error' ? 'notice-error' : 'notice-info'}`}>
                    {statusMessage}
                  </p>
                )}
              </div>

              {identity && <DetailTrailer key={movieId} title={detail.title} identity={identity} backdrop={detail.backdropUri} poster={detail.posterUri}/>}
              {readModel.moviesById.has(movieId) && <SeriesPersonalActions key={movieId} kind="movie"
                fingerprint={watchFingerprint('movie', readModel.moviesById.get(movieId)!)} title={detail.title}
                tmdbId={Number.isSafeInteger(Number(detail.externalIds?.tmdbId)) && Number(detail.externalIds?.tmdbId) > 0 ? Number(detail.externalIds?.tmdbId) : undefined}/>}
            </div>
          </div>
        </div>
        </div>
        {onSelectItem && <RelatedTitles kind="movie" itemId={movieId} readModel={readModel} onSelectItem={onSelectItem} />}
      </div>
    </main>
  );
};
