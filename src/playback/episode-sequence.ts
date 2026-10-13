import type { CatalogReadModel } from '../catalog/catalog-read-model.ts';
import type { Episode } from '../contracts/catalog.ts';
import type { NativeEpisodeContext } from './native-android-player.bridge.ts';

/** Local active-series projection only. Import order never determines playback order. */
export function orderedSeriesEpisodes(model: CatalogReadModel, seriesId: string): Episode[] {
  const seasons = [...(model.seasonsBySeriesId.get(seriesId) ?? [])]
    .filter(s => s.seriesId === seriesId && Number.isInteger(s.seasonNumber) && s.seasonNumber >= 0)
    .sort((a, b) => a.seasonNumber - b.seasonNumber || a.id.localeCompare(b.id));
  const seen = new Set<string>();
  return seasons.flatMap(season => [...(model.episodesBySeasonId.get(season.id) ?? [])]
    .filter(ep => ep.seriesId === seriesId && ep.seasonId === season.id
      && Number.isInteger(ep.episodeNumber) && ep.episodeNumber >= 0 && ep.streamIds?.length)
    .sort((a, b) => a.episodeNumber - b.episodeNumber || a.id.localeCompare(b.id)))
    .filter(ep => { if (seen.has(ep.id)) return false; seen.add(ep.id); return true; });
}

export function episodeContext(model: CatalogReadModel, seriesId: string, episodeId: string): NativeEpisodeContext | undefined {
  const episodes = orderedSeriesEpisodes(model, seriesId);
  const index = episodes.findIndex(ep => ep.id === episodeId);
  if (index < 0) return undefined;
  const current = episodes[index];
  const start = Math.max(0, Math.min(index - 50, episodes.length - 200));
  return {
    currentEpisodeId: episodeId,
    hasNext: index + 1 < episodes.length,
    seasonNumber: model.seasonsById.get(current.seasonId)?.seasonNumber ?? 0,
    episodeNumber: current.episodeNumber,
    episodes: episodes.slice(start, start + 200).map(ep => ({
      id: ep.id, title: ep.title.slice(0, 160),
      seasonNumber: model.seasonsById.get(ep.seasonId)?.seasonNumber ?? 0,
      episodeNumber: ep.episodeNumber,
    })),
  };
}
