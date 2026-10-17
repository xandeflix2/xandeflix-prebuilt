import { useEffect } from 'react';
import type { CatalogItemViewModel } from '../../catalog/catalog-view-model.ts';
import { canShowParentalItem, parentalItemAge, parentalViewKey, parseParentalAge } from '../../parental/parental-content.ts';
import { parentalControl } from '../../parental/parental-control.store.ts';
import { resolveMoviePresentation, resolveSeriesPresentation } from '../../artwork/series-presentation.service.ts';
import { tmdbPosterPath } from '../../artwork/tmdb-metadata.service.ts';
import { useParentalControl } from './useParentalControl.ts';

/** Visible-only public classification; no catalog rewrite or background catalog scan. */
export function useParentalClassification(item: CatalogItemViewModel, visible: boolean) {
  const state = useParentalControl(), key = parentalViewKey(item), age = parentalItemAge(item);
  const enabled = visible && state.status === 'ready' && age === undefined && canShowParentalItem(item);
  const { kind, title, yearFormatted: year, posterUri } = item, tmdbId = item.externalIds?.tmdbId;
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    const identity = { kind, title, year, tmdbId, posterPath: tmdbPosterPath(posterUri), sourcePosterUri: posterUri };
    void (kind === 'movie' ? resolveMoviePresentation(identity) : resolveSeriesPresentation(identity))
      .then(value => { if (active) parentalControl.rememberAge(key, parseParentalAge(value?.ageRating)); })
      .catch(() => { /* Unknown classifications remain protected by PIN. */ });
    return () => { active = false; };
  }, [enabled, key, kind, title, year, tmdbId, posterUri]);
}
