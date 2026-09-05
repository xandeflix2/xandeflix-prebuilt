/**
 * Xandeflix Prebuilt — MovieDetailPage Component (Gate G6)
 *
 * Tela de detalhes de filme a partir de metadados locais canônicos.
 *
 * Princípios:
 * - SAFE RENDERING: Trata campos ausentes sem renderizar undefined/null/NaN.
 * - PLAYBACK DEFERRED: Botão "Assistir" desabilitado com aviso explicativo do Gate G8.
 */

import React, { useState, useCallback } from 'react';
import type { CatalogReadModel } from '../../catalog/catalog-read-model.ts';
import { getMovieDetail } from '../../catalog/catalog-selectors.ts';
import { Artwork } from '../components/Artwork.tsx';
import { defaultPlaybackService } from '../../playback/playback.service.ts';

interface MovieDetailPageProps {
  movieId: string;
  readModel: CatalogReadModel;
  onBack: () => void;
}

export const MovieDetailPage: React.FC<MovieDetailPageProps> = ({ movieId, readModel, onBack }) => {
  const detail = getMovieDetail(readModel, movieId);
  const [isResolving, setIsResolving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusKind, setStatusKind] = useState<'info' | 'error' | null>(null);

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

  if (!detail) {
    return (
      <main className="page-container detail-page">
        <div className="detail-not-found">
          <h2>Filme não encontrado</h2>
          <p>O título solicitado não foi localizado no catálogo ativo.</p>
          <button type="button" className="focusable-item btn-primary" onClick={onBack}>
            Voltar ao Catálogo
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="page-container detail-page">
      <div className="detail-backdrop-wrapper">
        <Artwork
          uri={detail.backdropUri || detail.posterUri}
          title={detail.title}
          kind="backdrop"
          className="detail-backdrop-img"
        />
        <div className="detail-backdrop-gradient" />
      </div>

      <div className="detail-content">
        <div className="detail-layout">
          <div className="detail-poster-col">
            <Artwork
              uri={detail.posterUri}
              title={detail.title}
              kind="poster"
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

            <div className="detail-actions">
              <div className="playback-action-container">
                <button
                  type="button"
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

              <button
                type="button"
                className="focusable-item btn-secondary"
                onClick={onBack}
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
