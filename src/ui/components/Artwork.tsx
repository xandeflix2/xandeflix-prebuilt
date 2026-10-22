import React, { useEffect, useState } from 'react';
import { chooseArtworkUri, displayArtworkUri } from '../../artwork/artwork-uri.ts';
import { artworkIdentityKey, tmdbPosterPath, type ArtworkIdentity } from '../../artwork/tmdb-metadata.service.ts';
import { useArtworkMetadataState } from '../hooks/useArtworkMetadata.ts';
import { loadImage, reserveHeroImageSlot, isImageReady, invalidateLoadedImage } from '../../artwork/image-load-queue.ts';
import { invalidateCachedArtworkUri } from '../../artwork/artwork-file-cache.ts';
import { observeArtwork } from '../../artwork/artwork-visibility.ts';
import { seriesPosterClaims } from '../../artwork/series-poster-claims.ts';
import { chooseDetailBackdropUri, isHorizontalDetailBackdrop } from '../../artwork/detail-backdrop.ts';

interface ArtworkProps {
  uri?: string; fallbackUri?: string; identity?: ArtworkIdentity; title: string;
  kind?: 'poster' | 'backdrop' | 'thumbnail'; className?: string;
  priority?: 'high' | 'normal'; tmdbBackdropOnly?: boolean;
  immersiveArtwork?: 'backdrop' | 'poster'; prepare?: boolean;
  startup?: boolean;
  detailBackdrop?: boolean;
  hideEmpty?: boolean;
  onReadyChange?: (ready: boolean) => void;
}

function ArtworkImage({ uri, fallbackUri, identity, title, kind = 'poster', className = '', priority = 'normal', tmdbBackdropOnly = false, immersiveArtwork, startup = false, detailBackdrop = false, hideEmpty = false, onReadyChange }: ArtworkProps) {
  const high = priority === 'high';
  const [failed, setFailed] = useState<Set<string>>(() => new Set());
  const [retried] = useState<Set<string>>(() => new Set());
  const [retryTimers] = useState<Set<ReturnType<typeof setTimeout>>>(() => new Set());
  const [element, setElement] = useState<HTMLElement | null>(null);
  const [visibility, setVisibility] = useState({ near: high, visible: high });
  const [ready, setReady] = useState<{ uri: string; src: string }>();
  const [attempt, setAttempt] = useState(0);
  const [sharedSource, setSharedSource] = useState(false);
  const source = displayArtworkUri(uri, kind, high), fallback = displayArtworkUri(fallbackUri, kind, high);
  const near = visibility.near || visibility.visible || startup;
  const urgent = visibility.visible || (high && near);
  const seriesPoster = kind === 'poster' && identity?.kind === 'series';
  const claimKey = seriesPoster ? artworkIdentityKey({ ...identity, posterPath: undefined, sourcePosterUri: undefined }) : '';
  useEffect(() => {
    if (!near || !seriesPoster || !source) return;
    return seriesPosterClaims.watch(source, claimKey, setSharedSource);
  }, [near, seriesPoster, source, claimKey]);
  const externalPoster = kind === 'poster' && !!source && !tmdbPosterPath(source);
  const missingSource = (kind === 'backdrop' && tmdbBackdropOnly) || !source || failed.has(source) || (kind === 'backdrop' && source === fallback);
  // A failed source filename is not proof that TMDB has no poster for this title.
  // Matching still enforces kind/year/title and rejects ambiguous candidates.
  const independentLookup = sharedSource || failed.has(source || '');
  const metadataIdentity = identity && (externalPoster || independentLookup)
    ? { ...identity, title: identity.title.replace(/\s+\(L\)\s*$/i, ''), posterPath: undefined,
      sourcePosterUri: independentLookup ? undefined : identity.sourcePosterUri } : identity;
  const { metadata, pending: metadataPending } = useArtworkMetadataState(metadataIdentity, near && (missingSource || externalPoster || sharedSource), urgent ? 'high' : 'normal', detailBackdrop);
  const provider = displayArtworkUri(detailBackdrop ? chooseDetailBackdropUri(metadata, failed) : kind === 'backdrop' ? metadata?.backdropUri : metadata?.posterUri, kind, high);
  const sourcePath = tmdbPosterPath(source);
  const verifiedSource = Boolean(sourcePath && metadata && [metadata.posterUri, ...(metadata.heroPosterUris || [])].some(uri => tmdbPosterPath(uri) === sourcePath));
  const untrustedSource = sharedSource && !verifiedSource;
  const chosen = detailBackdrop ? provider : chooseArtworkUri({ source: untrustedSource ? undefined : source, fallback: untrustedSource && fallback === source ? undefined : fallback, kind, failed, tmdbBackdropOnly,
    provider,
    providerPoster: displayArtworkUri(metadata?.posterUri, 'poster', high),
  });

  useEffect(() => element ? observeArtwork(element, setVisibility) : undefined, [element]);
  useEffect(() => { if (high && near && !isImageReady(chosen) && ready?.uri !== chosen) return reserveHeroImageSlot(); }, [high, near, chosen, ready?.uri]);
  useEffect(() => {
    if (!near || !chosen) return;
    const controller = new AbortController(); let deferred: ReturnType<typeof setTimeout> | undefined;
    const viewportTop = urgent && !high ? element?.getBoundingClientRect?.().top ?? 0 : undefined;
    void loadImage(chosen, urgent, controller.signal, viewportTop).then(result => {
      if (controller.signal.aborted) return;
      if (result.ok && result.src && (!seriesPoster || result.height > result.width) && (!detailBackdrop || isHorizontalDetailBackdrop(result.width, result.height))) setReady({ uri: chosen, src: result.src });
      else if (result.deferred) deferred = setTimeout(() => setAttempt(value => value + 1), 500);
      else if (!result.cancelled) {
        setFailed(previous => new Set(previous).add(chosen));
      }
    });
    return () => { controller.abort(); if (deferred) clearTimeout(deferred); };
  }, [near, chosen, urgent, element, high, attempt, source, fallback, retried, retryTimers, seriesPoster, detailBackdrop]);
  useEffect(() => {
    if (!near || metadataPending || (provider && !failed.has(provider))) return;
    const candidate = [source, fallback].find(value => value && failed.has(value) && !retried.has(value));
    if (!candidate) return;
    retried.add(candidate);
    let fired = false;
    const timer = setTimeout(() => {
      fired = true;
      retryTimers.delete(timer); invalidateCachedArtworkUri(candidate);
      setFailed(previous => { const next = new Set(previous); next.delete(candidate); return next; });
    }, 3000);
    retryTimers.add(timer);
    return () => { clearTimeout(timer); retryTimers.delete(timer); if (!fired) retried.delete(candidate); };
  }, [near, metadataPending, provider, failed, source, fallback, retried, retryTimers]);
  useEffect(() => () => { for (const timer of retryTimers) clearTimeout(timer); }, [retryTimers]);
  useEffect(() => {
    const online = () => { for (const uri of failed) invalidateCachedArtworkUri(uri); retried.clear(); setFailed(new Set()); setAttempt(value => value + 1); };
    window.addEventListener('online', online);
    return () => window.removeEventListener('online', online);
  }, [retried, failed]);

  const onError = () => {
    if (!ready) return;
    invalidateLoadedImage(ready.uri); invalidateCachedArtworkUri(ready.uri); setReady(undefined);
    if (ready.src !== ready.uri && !retried.has(`cache:${ready.uri}`)) {
      retried.add(`cache:${ready.uri}`); setAttempt(value => value + 1);
    } else setFailed(previous => new Set(previous).add(ready.uri));
  };
  const shown = ready && !failed.has(ready.uri) && (!untrustedSource || ready.uri !== source || provider === source) ? ready : undefined;
  useEffect(() => { onReadyChange?.(Boolean(shown)); }, [onReadyChange, shown?.uri]);
  if (shown) return <img ref={setElement} src={shown.src} alt={title} aria-busy={false} data-artwork-ready
    data-immersive-artwork={immersiveArtwork} className={`artwork-img artwork-${kind} ${className}`}
    loading="eager" decoding="async" {...{ fetchpriority: urgent ? 'high' : 'auto' }} onError={onError}/>;
  if (hideEmpty) return <div ref={setElement} className={`artwork-empty artwork-${kind} ${className}`} aria-hidden="true"/>;
  if (chosen || metadataPending) return <div ref={setElement}
    role="img" aria-label={`Carregando imagem para ${title}`} aria-busy data-artwork-ready={false}
    className={`artwork-placeholder artwork-${kind} ${className}`}/>;
  return <div ref={setElement} className={`artwork-fallback artwork-${kind} ${className}`} aria-label={`Imagem indisponível para ${title}`}>
    <div className="artwork-fallback-icon">{kind === 'backdrop' ? '🎬' : kind === 'thumbnail' ? '📺' : '🎥'}</div>
    <span className="artwork-fallback-title">{title}</span>
  </div>;
}

export const Artwork = React.memo<ArtworkProps>(function Artwork(props) {
  const identity = props.identity && { ...props.identity, posterPath: props.identity.posterPath || tmdbPosterPath(props.kind === 'backdrop' ? props.fallbackUri : props.uri),
    sourcePosterUri: props.identity.sourcePosterUri || (props.kind === 'backdrop' ? props.fallbackUri : props.uri) };
  const key = `${identity ? artworkIdentityKey(identity) : props.title}:${props.kind}:${props.uri}:${props.fallbackUri}:${props.tmdbBackdropOnly}:${Boolean(props.detailBackdrop)}`;
  return <ArtworkImage key={key} {...props} identity={identity}/>;
});
