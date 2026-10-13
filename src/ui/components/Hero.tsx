/**
 * Xandeflix Prebuilt — Hero Banner Component (Gate G6)
 *
 * Destaque cinematográfico do catálogo local no topo da Home.
 *
 * Princípios:
 * - DETERMINISTIC HIGHLIGHT: Item derivado deterministicamente do catálogo local ativo.
 * - SOURCE FIRST: Complemento opcional sem modificar o catálogo local.
 */

import React, { useEffect, useState } from 'react';
import { artworkIdentityKey, chooseHeroPoster, tmdbPosterPath, type ArtworkMetadata } from '../../artwork/tmdb-metadata.service.ts';
import type { CatalogItemViewModel } from '../../catalog/catalog-view-model.ts';
import { Artwork } from './Artwork.tsx';
import { useArtworkMetadata } from '../hooks/useArtworkMetadata.ts';
import { useCachedArtwork } from '../hooks/useCachedArtwork.ts';
import { useImmersiveArtwork } from '../hooks/useImmersiveArtwork.ts';
import { useContentBadge } from './NewContentProvider.tsx';

interface HeroProps {
  item: CatalogItemViewModel;
  onSelect: (item: CatalogItemViewModel) => void;
  onPlay?: (item: CatalogItemViewModel) => void;
  playbackBusy?: boolean;
  playbackMessage?: string | null;
  headingLevel?: 1 | 2;
  mobilePoster?: boolean;
  controls?: React.ReactNode;
  artworkUri?: string;
  onArtworkError?: () => void;
}

function HeroPoster({ item, metadata }: { item: CatalogItemViewModel; metadata: ArtworkMetadata | null }) {
  const [failed, setFailed] = useState<Set<string>>(() => new Set());
  useEffect(() => { const retry = () => setFailed(new Set()); window.addEventListener('online', retry); return () => window.removeEventListener('online', retry); }, []);
  const uri = chooseHeroPoster(metadata, item.posterUri, failed);
  const cached = useCachedArtwork(uri || undefined);
  return uri ? <img src={cached.src} alt={item.title} data-immersive-artwork="poster" className="hero-backdrop-img hero-poster-img" loading="eager" decoding="async" {...{ fetchpriority: 'high' }}
    onError={() => {if(!cached.handleCacheError())setFailed((previous) => new Set(previous).add(uri));}} />
    : <div className="artwork-fallback artwork-poster hero-poster-img" aria-label={`Imagem para ${item.title}`}><span>{item.title}</span></div>;
}

export const Hero: React.FC<HeroProps> = ({ item, onSelect, onPlay, playbackBusy = false, playbackMessage, headingLevel = 1, mobilePoster = false, controls, artworkUri, onArtworkError }) => {
  const badge = useContentBadge(item.kind, item.title);
  const immersive=useImmersiveArtwork(`${item.kind}:${item.id}:${artworkUri||''}`);
  const Title = headingLevel === 1 ? 'h1' : 'h2';
  const cached = useCachedArtwork(artworkUri);
  const identity = { kind: item.kind, title: item.title, year: item.yearFormatted, tmdbId: item.externalIds?.tmdbId, posterPath: tmdbPosterPath(item.posterUri), sourcePosterUri: item.posterUri };
  const metadata = useArtworkMetadata(identity, mobilePoster || !item.overviewSnippet || !item.yearFormatted || !item.genreLabels.length
    || (item.kind === 'movie' && !item.durationFormatted), 'high');
  const year = mobilePoster ? metadata?.year || item.yearFormatted : item.yearFormatted || metadata?.year;
  const duration = mobilePoster ? metadata?.durationFormatted || item.durationFormatted : item.durationFormatted || metadata?.durationFormatted;
  const genres = mobilePoster && metadata?.genres.length ? metadata.genres : item.genreLabels.length ? item.genreLabels : metadata?.genres || [];
  const overview = mobilePoster ? metadata?.overview || item.overviewSnippet : item.overviewSnippet || metadata?.overview;
  return (
    <section ref={immersive} className={`hero-banner hero-banner--actions${mobilePoster ? ' hero-banner--vertical' : ''}`} aria-label={`Destaque: ${item.title}`}>
      <div className="hero-backdrop-container">
        {artworkUri ? <img src={cached.src} alt={item.title} data-immersive-artwork={mobilePoster?'poster':'backdrop'} className={`hero-backdrop-img${mobilePoster?' hero-poster-img':''}`} loading="eager" decoding="async" {...{fetchpriority:'high'}} onError={() => {if(!cached.handleCacheError())onArtworkError?.();}}/>
          : mobilePoster ? <HeroPoster key={artworkIdentityKey(identity)} item={item} metadata={metadata} /> : <Artwork
          uri={item.backdropUri}
          fallbackUri={item.posterUri}
          identity={identity}
          priority="high"
          tmdbBackdropOnly
          immersiveArtwork="backdrop"
          title={item.title}
          kind="backdrop"
          className="hero-backdrop-img"
        />}
        <div className="hero-overlay-gradient" />
      </div>
      <div className="hero-content">
        <div className="hero-copy">
        <div className="hero-meta">
          <span className="hero-badge">{item.kind === 'movie' ? 'FILME' : 'SÉRIE'}</span>
          {badge && <span className="hero-content-badge">{badge}</span>}
          {year && <span className="hero-year">{year}</span>}
          {duration && (
            <span className="hero-duration">{duration}</span>
          )}
        </div>
        <Title className="hero-title">{item.title}</Title>
        {genres.length > 0 && (
          <p className="hero-genres">{genres.join(' • ')}</p>
        )}
        {overview && (
          <p className="hero-overview">{overview}</p>
        )}
        </div>
        <div className="hero-footer">
        <div className="hero-actions">
          {onPlay && <button type="button" className="focusable-item btn-primary hero-btn-play" disabled={playbackBusy}
            onClick={() => onPlay(item)} aria-label={`Assistir ${item.title}`}>
            <span aria-hidden="true">▶</span> {playbackBusy ? 'Preparando…' : 'Assistir'}
          </button>}
          <button
            type="button"
            className="focusable-item btn-secondary hero-btn-primary"
            onClick={() => onSelect(item)}
          >
            Ver Detalhes
          </button>
        </div>
        {controls}
        </div>
        {playbackMessage && <p className="hero-playback-message" role="status">{playbackMessage}</p>}
      </div>
    </section>
  );
};
