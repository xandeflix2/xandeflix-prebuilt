import type { PrebuiltCatalog, StreamRef } from '../contracts/catalog.ts';
import { CatalogReadModel } from './catalog-read-model.ts';
import type { LiveCatalog } from './live/live-tv.types.ts';
import { classifyCanonicalSourceContent } from '../source/content-kind-classifier.ts';
import { containsRawM3uAttributes } from '../source/m3u-extinf-parser.ts';

type StreamWithLocalUrl = StreamRef & { directStreamUrl?: string };

export interface CatalogKindIntegrityAudit {
  liveAsSeriesCount: number;
  movieAsSeriesCount: number;
  seriesAsMovieCount: number;
  titleWithRawM3uAttributeCount: number;
  crossKindArtworkBindingCount: number;
  unresolvedVisibleInTypedScope: number;
  trustedSeriesCategoryCount: number;
  seriesWithoutEpisodeStructureCount: number;
  liveChannelCount: number;
  candidateSafeForPromotion: boolean;
}

function normalizedTitle(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function streamKindFromLocalUrl(stream: StreamWithLocalUrl): 'live' | 'movie' | 'series' | 'unresolved' | undefined {
  if (!stream.directStreamUrl) return undefined;
  return classifyCanonicalSourceContent({
    title: '',
    streamUrl: stream.directStreamUrl,
  });
}

function countRawAttributes(values: readonly string[]): number {
  return values.filter((value) => containsRawM3uAttributes(value)).length;
}

function countCrossKindArtworkBindings(catalog: PrebuiltCatalog): number {
  const movieArtworkIds = new Set(catalog.movies.flatMap((movie) => movie.artworkIds));
  const seriesArtworkIds = new Set(catalog.series.flatMap((series) => series.artworkIds));
  let count = 0;

  for (const artworkId of movieArtworkIds) {
    if (seriesArtworkIds.has(artworkId)) count++;
  }

  for (const series of catalog.series) {
    for (const artworkId of series.artworkIds) {
      if (/^art:movie:/i.test(artworkId)) count++;
    }
  }

  for (const movie of catalog.movies) {
    for (const artworkId of movie.artworkIds) {
      if (/^art:series:/i.test(artworkId)) count++;
    }
  }

  return count;
}

/**
 * Auditoria sanitizada do candidato antes da promoção.
 *
 * Ela trabalha somente com relações canônicas e metadados estruturais. Não
 * retorna títulos, URLs, credenciais, logos ou conteúdo de streams.
 */
export function auditCatalogKindIntegrity(
  catalog: PrebuiltCatalog,
  liveCatalog: LiveCatalog,
): CatalogKindIntegrityAudit {
  const streamsById = new Map(catalog.streams.map((stream) => [stream.id, stream as StreamWithLocalUrl]));
  const liveSourceItemIds = new Set(
    liveCatalog.channels.map((channel) => channel.streamRef.sourceItemId),
  );

  const movieByTitle = new Set(catalog.movies.map((movie) => normalizedTitle(movie.title)));
  const seriesByTitle = new Set(catalog.series.map((series) => normalizedTitle(series.title)));

  let liveAsSeriesCount = 0;
  let movieAsSeriesCount = 0;
  let unresolvedVisibleInTypedScope = 0;
  let seriesWithoutEpisodeStructureCount = 0;

  for (const series of catalog.series) {
    const seasons = catalog.seasons.filter((season) => season.seriesId === series.id);
    const episodes = catalog.episodes.filter((episode) => episode.seriesId === series.id);
    if (seasons.length === 0 || episodes.length === 0) {
      seriesWithoutEpisodeStructureCount++;
      unresolvedVisibleInTypedScope++;
    }

    let foreignKind = false;
    for (const episode of episodes) {
      for (const streamId of episode.streamIds) {
        const stream = streamsById.get(streamId);
        if (!stream) {
          unresolvedVisibleInTypedScope++;
          continue;
        }

        const localUrlKind = streamKindFromLocalUrl(stream);
        const declaredKind = stream.contentKind as string;
        const isLive = declaredKind === 'live' ||
          liveSourceItemIds.has(stream.sourceItemId) ||
          localUrlKind === 'live';
        const isMovie = declaredKind === 'movie' || localUrlKind === 'movie';
        if (isLive) liveAsSeriesCount++;
        if (isMovie) {
          movieAsSeriesCount++;
          foreignKind = true;
        }
        if (declaredKind === 'episode' || localUrlKind === 'unresolved') {
          unresolvedVisibleInTypedScope++;
        }
      }
    }

    // Um mesmo título materializado nos dois tipos é uma colisão para
    // adjudicação, não uma regra de classificação.
    if (movieByTitle.has(normalizedTitle(series.title)) && foreignKind) {
      movieAsSeriesCount++;
    }
  }

  let seriesAsMovieCount = 0;
  for (const movie of catalog.movies) {
    for (const streamId of movie.streamIds) {
      const stream = streamsById.get(streamId);
      if (!stream) {
        unresolvedVisibleInTypedScope++;
        continue;
      }

      const localUrlKind = streamKindFromLocalUrl(stream);
      const declaredKind = stream.contentKind as string;
      if (declaredKind === 'series' || localUrlKind === 'series') seriesAsMovieCount++;
      if (declaredKind === 'live' || localUrlKind === 'live') unresolvedVisibleInTypedScope++;
      if (localUrlKind === 'unresolved') unresolvedVisibleInTypedScope++;
    }
  }

  for (const channel of liveCatalog.channels) {
    if (seriesByTitle.has(normalizedTitle(channel.name))) {
      liveAsSeriesCount++;
    }
  }

  const titleValues = [
    ...catalog.movies.map((movie) => movie.title),
    ...catalog.series.map((series) => series.title),
    ...catalog.episodes.map((episode) => episode.title),
    ...liveCatalog.channels.map((channel) => channel.name),
  ];

  const readModel = new CatalogReadModel(catalog);
  const audit: CatalogKindIntegrityAudit = {
    liveAsSeriesCount,
    movieAsSeriesCount,
    seriesAsMovieCount,
    titleWithRawM3uAttributeCount: countRawAttributes(titleValues),
    crossKindArtworkBindingCount: countCrossKindArtworkBindings(catalog),
    unresolvedVisibleInTypedScope,
    trustedSeriesCategoryCount: readModel.getTrustedCategoriesForKind('series').length,
    seriesWithoutEpisodeStructureCount,
    liveChannelCount: liveCatalog.channels.length,
    candidateSafeForPromotion: false,
  };

  audit.candidateSafeForPromotion =
    audit.liveAsSeriesCount === 0 &&
    audit.movieAsSeriesCount === 0 &&
    audit.seriesAsMovieCount === 0 &&
    audit.titleWithRawM3uAttributeCount === 0 &&
    audit.crossKindArtworkBindingCount === 0 &&
    audit.unresolvedVisibleInTypedScope === 0 &&
    audit.trustedSeriesCategoryCount > 0;

  return audit;
}
