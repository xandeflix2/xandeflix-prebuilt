import { useEffect, useState } from 'react';
import { artworkIdentityKey, tmdbMetadataService, type ArtworkIdentity, type ArtworkMetadata } from '../../artwork/tmdb-metadata.service.ts';

/** Optional overlay; never mutates the signed/active catalog or its read model. */
export function useArtworkMetadataState(identity: ArtworkIdentity | undefined, enabled: boolean, priority: 'high' | 'normal' = 'normal', backdrop = false) {
  const kind = identity?.kind;
  const title = identity?.title || '';
  const year = identity?.year;
  const tmdbId = identity?.tmdbId;
  const posterPath = identity?.posterPath;
  const sourcePosterUri = identity?.sourcePosterUri;
  const originCountry = identity?.originCountry;
  const network = identity?.network;
  const hasEpisodes = identity?.hasEpisodes;
  const key = identity ? artworkIdentityKey(identity) + (backdrop ? ':backdrops1' : '') : '';
  const [state, setState] = useState<{ key: string; value: ArtworkMetadata | null; pending: boolean }>({ key: '', value: null, pending: false });

  useEffect(() => {
    if (!enabled || !kind || !title) return;
    let active = true;
    let retries = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const current = { kind, title, year, tmdbId, posterPath, sourcePosterUri, originCountry, network, hasEpisodes };
    const resolve = async () => {
      if (timer) clearTimeout(timer);
      if (active) setState(previous => ({ key, value: previous.key === key ? previous.value : backdrop ? tmdbMetadataService.peekBackdrop(current) : tmdbMetadataService.peek(current), pending: true }));
      const value = await (backdrop ? tmdbMetadataService.resolveBackdrop(current, priority) : tmdbMetadataService.resolve(current, priority));
      if (!active) return;
      setState({ key, value, pending: false });
      if (!value && retries < 2) timer = setTimeout(() => { retries++; void resolve(); }, 15000 * (retries + 1));
    };
    const online = () => { if (active) void resolve(); };
    void resolve();
    window.addEventListener('online', online);
    return () => { active = false; if (timer) clearTimeout(timer); window.removeEventListener('online', online); };
  }, [enabled, key, kind, title, year, tmdbId, posterPath, sourcePosterUri, originCountry, network, hasEpisodes, priority, backdrop]);

  const metadata = state.key === key ? state.value : (identity ? backdrop ? tmdbMetadataService.peekBackdrop(identity) : tmdbMetadataService.peek(identity) : null);
  return { metadata, pending: Boolean(enabled && identity && (state.key !== key || state.pending)) };
}

export function useArtworkMetadata(identity: ArtworkIdentity | undefined, enabled: boolean, priority: 'high' | 'normal' = 'normal'): ArtworkMetadata | null {
  return useArtworkMetadataState(identity, enabled, priority).metadata;
}
