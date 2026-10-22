import { useEffect, useState } from 'react';
import type { CatalogItemViewModel } from '../../catalog/catalog-view-model.ts';
import { observeArtwork } from '../../artwork/artwork-visibility.ts';
import { tmdbPosterPath, artworkCategoryContext } from '../../artwork/tmdb-metadata.service.ts';
import { meaningfulDetailGenres } from '../detail-genres.ts';
import { useArtworkMetadata } from './useArtworkMetadata.ts';

/** Optional visible-card overlay, sharing the artwork cache/queue, never catalog data. */
export function useCardGenres(item: CatalogItemViewModel) {
  const [element, setElement] = useState<HTMLButtonElement | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!element) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const stop = observeArtwork(element, state => {
      if (timer) clearTimeout(timer);
      if (state.visible && !document.hidden) timer = setTimeout(() => setVisible(true), 300);
      else setVisible(false);
    });
    return () => { stop(); if (timer) clearTimeout(timer); };
  }, [element]);
  const source = meaningfulDetailGenres(item.genreLabels);
  const metadata = useArtworkMetadata({ kind: item.kind, title: item.title,
    year: item.yearFormatted, tmdbId: item.externalIds?.tmdbId,
    ...(item.kind === 'series' ? artworkCategoryContext(item.categoryLabels, item.hasEpisodes) : {}),
    posterPath: tmdbPosterPath(item.posterUri), sourcePosterUri: item.posterUri }, visible && !source.length);
  return { ref: setElement, visible, genres: source.length ? source : meaningfulDetailGenres(metadata?.genres || []) };
}
