/**
 * Xandeflix Prebuilt — SeriesDetailPage Component (Gate G6)
 *
 * Tela de detalhes de série com seleção de temporadas e listagem de episódios locais.
 *
 * Princípios:
 * - COMPLETE HIERARCHY: Series → Seasons → Episodes resolvidas a partir do catálogo local.
 * - PLAYBACK DEFERRED: Reprodução de episódios desabilitada até o Gate G8.
 */

import React, { useState, useCallback } from 'react';
import type { CatalogReadModel } from '../../catalog/catalog-read-model.ts';
import { getSeriesDetail } from '../../catalog/catalog-selectors.ts';
import { Artwork } from '../components/Artwork.tsx';
import { defaultPlaybackService } from '../../playback/playback.service.ts';

interface SeriesDetailPageProps {
  seriesId: string;
  readModel: CatalogReadModel;
  onBack: () => void;
}

export const SeriesDetailPage: React.FC<SeriesDetailPageProps> = ({
  seriesId,
  readModel,
  onBack,
}) => {
  const detail = getSeriesDetail(readModel, seriesId);

  const seasons = detail?.seasons || [];
  const [selectedSeasonIndex, setSelectedSeasonIndex] = useState<number>(0);
  const [resolvingEpisodeId, setResolvingEpisodeId] = useState<string | null>(null);
  const [episodeStatusNotice, setEpisodeStatusNotice] = useState<string | null>(null);

  const handlePlayEpisode = useCallback(
    async (episodeId: string) => {
      setResolvingEpisodeId(episodeId);
      setEpisodeStatusNotice('Preparando reprodução...');

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

  if (!detail) {
    return (
      <main className="page-container detail-page">
        <div className="detail-not-found">
          <h2>Série não encontrada</h2>
          <p>O título solicitado não foi localizado no catálogo ativo.</p>
          <button type="button" className="focusable-item btn-primary" onClick={onBack}>
            Voltar ao Catálogo
          </button>
        </div>
      </main>
    );
  }

  const currentSeason = seasons[selectedSeasonIndex] || seasons[0];

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

            <div className="detail-actions">
              <button
                type="button"
                className="focusable-item btn-secondary"
                onClick={onBack}
              >
                ← Voltar
              </button>
            </div>
          </div>
        </div>

        {/* Seção de Temporadas e Episódios */}
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
            <div className="episodes-list">
              {currentSeason.episodes.length === 0 ? (
                <p className="no-episodes">Nenhum episódio cadastrado para esta temporada.</p>
              ) : (
                currentSeason.episodes.map((ep) => (
                  <article key={ep.id} className="episode-card focusable-item" tabIndex={0}>
                    <div className="episode-thumb-wrapper">
                      <Artwork
                        uri={ep.thumbnailUri || detail.posterUri}
                        title={ep.title}
                        kind="thumbnail"
                        className="episode-thumb-img"
                      />
                      <span className="episode-num-badge">EP {ep.episodeNumber}</span>
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
                      {ep.overview && <p className="episode-overview">{ep.overview}</p>}
                      <div className="episode-playback-action">
                        <button
                          type="button"
                          className={`focusable-item btn-primary btn-episode-play ${resolvingEpisodeId === ep.id ? 'btn-resolving' : ''}`}
                          onClick={() => handlePlayEpisode(ep.id)}
                          disabled={resolvingEpisodeId !== null}
                        >
                          {resolvingEpisodeId === ep.id ? 'Preparando...' : '▶ Assistir'}
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
};
