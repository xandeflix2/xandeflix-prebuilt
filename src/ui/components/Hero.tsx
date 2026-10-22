/**
 * Xandeflix Prebuilt — Hero Banner Component (Gate G6)
 *
 * Destaque cinematográfico do catálogo local no topo da Home.
 *
 * Princípios:
 * - DETERMINISTIC HIGHLIGHT: Item derivado deterministicamente do catálogo local ativo.
 * - SOURCE FIRST: Complemento opcional sem modificar o catálogo local.
 */

import React, { useEffect, useRef, useState } from 'react';
import { artworkIdentityKey, artworkCategoryContext, chooseHeroPoster, tmdbPosterPath, type ArtworkMetadata } from '../../artwork/tmdb-metadata.service.ts';
import type { CatalogItemViewModel } from '../../catalog/catalog-view-model.ts';
import { Artwork } from './Artwork.tsx';
import { useArtworkMetadata } from '../hooks/useArtworkMetadata.ts';
import { useCachedArtwork } from '../hooks/useCachedArtwork.ts';
import { useImmersiveArtwork } from '../hooks/useImmersiveArtwork.ts';
import { useContentBadge } from './NewContentProvider.tsx';
import { useDevicePresentation } from '../hooks/useDevicePresentation.ts';
import { isTelevisionPresentation, type DevicePresentation } from '../device-presentation.ts';
import { PlatformCategoryLogo } from './PlatformCategoryBadge.tsx';
import { meaningfulDetailGenres } from '../detail-genres.ts';
import { useParentalControl } from '../hooks/useParentalControl.ts';
import { canShowParentalItem } from '../../parental/parental-content.ts';
import { useParentalClassification } from '../hooks/useParentalClassification.ts';

export function canOpenHeroArtworkDetails(choice: DevicePresentation | null, userAgent: string, touchPoints = 0): boolean {
  if (choice) return choice === 'PHONE' || choice === 'TABLET';
  if (isTelevisionPresentation(userAgent, choice)) return false;
  return /android|iphone|ipad|ipod/i.test(userAgent) || (/macintosh/i.test(userAgent) && touchPoints > 1);
}

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
  useParentalControl();
  const allowed = canShowParentalItem(item);
  useParentalClassification(item, allowed);
  const presentation = useDevicePresentation();
  const sourceGenres = meaningfulDetailGenres(item.genreLabels);
  const artworkDetails = canOpenHeroArtworkDetails(presentation, typeof navigator === 'undefined' ? '' : navigator.userAgent,
    typeof navigator === 'undefined' ? 0 : navigator.maxTouchPoints);
  const artworkGesture = useRef<{ pointerId: number; x: number; y: number; key: string; moved: boolean }>();
  const suppressArtworkClickUntil = useRef(0);
  const artworkKey = `${item.kind}:${item.id}`;
  const trackArtworkMovement = (event: React.PointerEvent<HTMLButtonElement>) => {
    const start = artworkGesture.current;
    if (start?.pointerId === event.pointerId && Math.hypot(event.clientX - start.x, event.clientY - start.y) > 10) start.moved = true;
  };
  const badge = useContentBadge(item.kind, item.title);
  const immersive=useImmersiveArtwork(`${item.kind}:${item.id}:${artworkUri||''}`);
  const Title = headingLevel === 1 ? 'h1' : 'h2';
  const cached = useCachedArtwork(allowed ? artworkUri : undefined);
  const identity = { kind: item.kind, title: item.title, year: item.yearFormatted, tmdbId: item.externalIds?.tmdbId, posterPath: tmdbPosterPath(item.posterUri), sourcePosterUri: item.posterUri,
    ...(item.kind === 'series' ? artworkCategoryContext(item.categoryLabels, item.hasEpisodes) : {}) };
  const metadata = useArtworkMetadata(identity, allowed && (mobilePoster || !item.overviewSnippet || !item.yearFormatted || !sourceGenres.length
    || (item.kind === 'movie' && !item.durationFormatted)), 'high');
  const year = mobilePoster ? metadata?.year || item.yearFormatted : item.yearFormatted || metadata?.year;
  const duration = mobilePoster ? metadata?.durationFormatted || item.durationFormatted : item.durationFormatted || metadata?.durationFormatted;
  const genres = sourceGenres.length ? sourceGenres : meaningfulDetailGenres(metadata?.genres || []);
  const platformCategory = item.categoryLabels.map(label => label.trim().replace(/^(?:s[eé]ries|filmes)\s*\|\s*/i, '').trim())
    .find(label => label && !/^geral$/i.test(label))?.slice(0, 100);
  const overview = mobilePoster ? metadata?.overview || item.overviewSnippet : item.overviewSnippet || metadata?.overview;
  if (!allowed) return null;
  return (
    <section ref={immersive} className={`hero-banner hero-banner--actions${mobilePoster ? ' hero-banner--vertical' : ''}${artworkDetails ? ' hero-banner--artwork-details' : ''}`} aria-label={`Destaque: ${item.title}`}>
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
        {artworkDetails && <button type="button" className="hero-artwork-link"
          aria-label={`Ver detalhes de ${item.title}`}
          onPointerDown={event => {
            if (!event.isPrimary) { suppressArtworkClickUntil.current = performance.now() + 400; return; }
            artworkGesture.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, key: artworkKey, moved: false };
          }} onPointerMove={trackArtworkMovement} onPointerUp={trackArtworkMovement}
          onPointerCancel={() => { suppressArtworkClickUntil.current = performance.now() + 400; artworkGesture.current = undefined; }}
          onClick={event => {
            const start = artworkGesture.current;
            artworkGesture.current = undefined;
            if (event.detail > 0 && (performance.now() < suppressArtworkClickUntil.current || start?.moved || (start && start.key !== artworkKey))) {
              event.preventDefault(); return;
            }
            onSelect(item);
          }}/>}
      </div>
      <div className="hero-content">
        <div className="hero-copy">
        <div className="hero-meta">
          <span className="hero-badge">{item.kind === 'movie' ? 'FILME' : 'SÉRIE'}</span>
          {badge && <span className="hero-content-badge">{badge}</span>}
          {platformCategory && <span className="hero-content-badge hero-category-badge" aria-label={platformCategory} title={platformCategory}><PlatformCategoryLogo label={platformCategory}/></span>}
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
