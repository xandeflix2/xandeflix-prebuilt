import type { CatalogReadModel } from '../catalog/catalog-read-model.ts';
import type { CatalogItemViewModel } from '../catalog/catalog-view-model.ts';
import { defaultPlaybackService } from './playback.service.ts';
import { watchFingerprint, watchHistory } from './watch-history.ts';

/** Resolve só o título selecionado; guard, stream e player continuam no serviço. */
export async function playHeroItem(item: CatalogItemViewModel, model: CatalogReadModel, active: () => boolean) {
  if (!active()) return;
  if (item.kind === 'movie') {
    const movie = await model.resolveMovieById(item.id);
    if (!active()) return;
    if (!movie) throw new Error('HERO_TITLE_UNAVAILABLE');
    return defaultPlaybackService.playMovie(movie.id, model);
  }
  const series = await model.resolveSeriesById(item.id);
  if (!active()) return;
  if (!series) throw new Error('HERO_TITLE_UNAVAILABLE');
  const episodes = await model.loadEpisodesForSeries(series.id);
  if (!active()) return;
  try { await watchHistory.syncNativeProgress(); } catch { /* Histórico local continua válido. */ }
  if (!active()) return;
  const available = episodes.filter(episode => episode.seriesId === series.id && episode.streamIds.length > 0);
  const fingerprint = watchFingerprint('series', series);
  const saved = watchHistory.list().find(row => row.kind === 'series' && row.itemId === series.id
    && row.fingerprint === fingerprint && !row.completed && row.positionMs > 0
    && available.some(episode => episode.id === row.episodeId));
  const episode = available.find(row => row.id === saved?.episodeId) || [...available].sort((a, b) =>
    (model.seasonsById.get(a.seasonId)?.seasonNumber ?? Number.MAX_SAFE_INTEGER)
      - (model.seasonsById.get(b.seasonId)?.seasonNumber ?? Number.MAX_SAFE_INTEGER)
      || a.episodeNumber - b.episodeNumber || a.id.localeCompare(b.id))[0];
  if (!episode) throw new Error('HERO_EPISODE_UNAVAILABLE');
  return defaultPlaybackService.playEpisode(series.id, episode.id, model);
}
