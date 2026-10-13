import React, { useEffect, useState } from 'react';
import type { CatalogReadModel } from '../../catalog/catalog-read-model.ts';
import type { MovieDetailViewModel, CatalogItemViewModel } from '../../catalog/catalog-view-model.ts';
import { artworkIdentityKey, type ArtworkIdentity } from '../../artwork/tmdb-metadata.service.ts';
import { resolveMoviePresentation, type MoviePresentation } from '../../artwork/series-presentation.service.ts';
import { watchFingerprint } from '../../playback/watch-history.ts';
import { SeriesTrailer } from './SeriesTrailer.tsx';
import { SeriesPersonalActions } from './SeriesPersonalActions.tsx';
import { CastButton } from './CastButton.tsx';
import { RelatedTitles } from './RelatedTitles.tsx';

interface Props {
  detail: MovieDetailViewModel;
  identity: ArtworkIdentity;
  readModel: CatalogReadModel;
  resolving: boolean;
  statusMessage: string | null;
  statusKind: 'info' | 'error' | null;
  onPlay: () => void;
  onBack: () => void;
  onSelectItem?: (item: CatalogItemViewModel) => void;
}

/** Phone presentation only. Playback and source resolution stay in the page. */
export function PhoneMovieDetail({ detail, identity, readModel, resolving, statusMessage, statusKind, onPlay, onBack, onSelectItem }: Props): React.ReactElement {
  const [state, setState] = useState<{ key: string; data: MoviePresentation | null }>();
  const key = artworkIdentityKey(identity);
  const { title, year, tmdbId, posterPath, sourcePosterUri } = identity;
  useEffect(() => {
    let active = true;
    void resolveMoviePresentation({ kind: 'movie', title, year, tmdbId, posterPath, sourcePosterUri })
      .then(data => { if (active) setState({ key, data }); })
      .catch(() => { if (active) setState({ key, data: null }); });
    return () => { active = false; };
  }, [key, title, year, tmdbId, posterPath, sourcePosterUri]);

  const extra = state?.key === key ? state.data : null;
  const loading = state?.key !== key;
  const source = readModel.moviesById.get(detail.id);
  const genres = detail.genreLabels.length ? detail.genreLabels : detail.categoryLabels;
  const duration = detail.durationFormatted || (extra?.runtimeMinutes ? `${extra.runtimeMinutes}min` : undefined);

  return <>
    <div data-detail-hero tabIndex={-1} className="focusable-item series-phone-hero">
      <SeriesTrailer key={`${detail.id}:${extra?.trailer?.key || 'none'}`} title={detail.title} identity={identity}
        backdrop={detail.backdropUri} poster={detail.posterUri} trailer={extra?.trailer} loading={loading}/>
    </div>
    <div className="series-phone-content">
      <h1 className="series-phone-title">{detail.title}</h1>
      <div className="series-phone-metadata" aria-label="Informações do filme">
        {detail.yearFormatted && <span>{detail.yearFormatted}</span>}
        {extra?.ageRating && <span className="series-age-rating series-age-rating--known" aria-label={`Classificação indicativa ${extra.ageRating}`}>
          {extra.ageRating === 'L' ? 'L' : `${extra.ageRating}+`}
        </span>}
        {duration && <span>{duration}</span>}
        {!!genres.length && <span className="series-phone-genres">{genres.slice(0, 4).join(' • ')}</span>}
      </div>
      <p className="series-phone-synopsis">{detail.overview || 'Sinopse indisponível para este filme.'}</p>
      <div className="series-phone-actions">
        <button type="button" data-detail-focus className="focusable-item series-phone-watch movie-phone-watch"
          disabled={resolving} onClick={onPlay} aria-label={`Assistir ${detail.title}`}>{resolving ? 'Preparando…' : '▶ Assistir'}</button>
        <button type="button" className="focusable-item btn-secondary" onClick={onBack}>← Voltar</button>
        <CastButton/>
      </div>
      {statusMessage && <p role="status" aria-live="polite" className={`playback-status-notice ${statusKind === 'error' ? 'notice-error' : 'notice-info'}`}>{statusMessage}</p>}
      {source && <SeriesPersonalActions key={detail.id} kind="movie" fingerprint={watchFingerprint('movie', source)} title={detail.title} tmdbId={extra?.tmdbId}/>}
      {onSelectItem && <section className="series-phone-panel movie-phone-related" aria-label="Títulos semelhantes">
        <h2 className="section-heading">Títulos semelhantes</h2>
        <RelatedTitles kind="movie" itemId={detail.id} readModel={readModel} onSelectItem={onSelectItem} layout="grid"/>
      </section>}
    </div>
  </>;
}
