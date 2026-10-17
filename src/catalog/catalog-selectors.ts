/**
 * Xandeflix Prebuilt — Catalog Selectors (Gate G6)
 *
 * Seletores determinísticos para derivar ViewModels a partir do CatalogReadModel.
 *
 * Princípios:
 * - ZERO SIDE EFFECTS: Funções puras de leitura.
 * - BOUNDED RAILS: Limite máximo inicial de itens por faixa (HOME_RAIL_MAX_ITEMS_INITIAL).
 * - SAFE SANITIZATION: Nenhum dado corrompido ou inesperado vaza para os componentes.
 */

import type { Category, Movie, Series } from '../contracts/catalog.ts';
import { normalizeArtworkUri } from '../artwork/artwork-uri.ts';
import { CatalogReadModel } from './catalog-read-model.ts';
import { parentalCatalogMetadata } from '../parental/parental-content.ts';
import {
  type CatalogItemViewModel,
  type MovieDetailViewModel,
  type SeriesDetailViewModel,
  type SeasonViewModel,
  type EpisodeViewModel,
  type HomeRailViewModel,
  HOME_RAIL_MAX_ITEMS_INITIAL,
} from './catalog-view-model.ts';

function sourceArtwork(readModel: CatalogReadModel, item: Movie | Series, kind: 'poster' | 'backdrop'): string | undefined {
  const fields = item as unknown as Record<string, unknown>;
  const names = kind === 'poster'
    ? ['posterUri', 'posterUrl', 'logo', 'cover', 'poster', 'stream_icon']
    : ['backdropUri', 'backdropUrl'];
  for (const name of names) {
    const uri = normalizeArtworkUri(fields[name]);
    if (uri) return uri;
  }
  for (const id of item.artworkIds || []) {
    const art = readModel.artworkById.get(id);
    if (art?.kind === kind) {
      const uri = normalizeArtworkUri(art.uri);
      if (uri) return uri;
    }
  }
  return undefined;
}

export function movieToViewModel(readModel: CatalogReadModel, movie: Movie): CatalogItemViewModel {
  return {
    parental: parentalCatalogMetadata(movie, readModel, 'movie'),
    id: movie.id,
    externalIds: movie.externalIds?.tmdbId ? { tmdbId: movie.externalIds.tmdbId } : undefined,
    kind: 'movie',
    title: movie.title,
    originalTitle: movie.originalTitle,
    yearFormatted: readModel.formatYear(movie.year),
    overviewSnippet: movie.overview,
    posterUri: sourceArtwork(readModel, movie, 'poster'),
    backdropUri: sourceArtwork(readModel, movie, 'backdrop'),
    genreLabels: readModel.resolveGenreLabels(movie.genreIds),
    categoryLabels: readModel.resolveCategoryLabels(movie.categoryIds),
    durationFormatted: readModel.formatDuration(movie.durationSeconds),
  };
}

export function seriesToViewModel(readModel: CatalogReadModel, series: Series): CatalogItemViewModel {
  return {
    parental: parentalCatalogMetadata(series, readModel, 'series'),
    id: series.id,
    externalIds: series.externalIds?.tmdbId ? { tmdbId: series.externalIds.tmdbId } : undefined,
    kind: 'series',
    title: series.title,
    originalTitle: series.originalTitle,
    yearFormatted: readModel.formatYear(series.year),
    overviewSnippet: series.overview,
    posterUri: sourceArtwork(readModel, series, 'poster'),
    backdropUri: sourceArtwork(readModel, series, 'backdrop'),
    genreLabels: readModel.resolveGenreLabels(series.genreIds),
    categoryLabels: readModel.resolveCategoryLabels(series.categoryIds),
  };
}

/**
 * Retorna o item de destaque (Hero) do catálogo.
 * Prioriza uma imagem disponível entre os itens limitados do first-fold.
 */
export function getHeroItem(readModel: CatalogReadModel): CatalogItemViewModel | null {
  const items = [
    ...readModel.catalog.movies.slice(0, HOME_RAIL_MAX_ITEMS_INITIAL).map((movie) => movieToViewModel(readModel, movie)),
    ...readModel.catalog.series.slice(0, HOME_RAIL_MAX_ITEMS_INITIAL).map((series) => seriesToViewModel(readModel, series)),
  ];
  return items.find((item) => item.backdropUri && item.backdropUri !== item.posterUri)
    || items.find((item) => item.posterUri) || items[0] || null;
}

/**
 * Retorna as faixas temáticas da Home com limites explícitos de renderização.
 */
export function getHomeRails(readModel: CatalogReadModel): HomeRailViewModel[] {
  const rails: HomeRailViewModel[] = [];

  // 1. Faixa de Filmes
  if (readModel.catalog.movies.length > 0) {
    const movieItems = readModel.catalog.movies
      .slice(0, HOME_RAIL_MAX_ITEMS_INITIAL)
      .map((m) => movieToViewModel(readModel, m));

    rails.push({
      id: 'rail-movies',
      title: 'Filmes em Destaque',
      kind: 'movies',
      items: movieItems,
    });
  }

  // 2. Faixa de Séries
  if (readModel.catalog.series.length > 0) {
    const seriesItems = readModel.catalog.series
      .slice(0, HOME_RAIL_MAX_ITEMS_INITIAL)
      .map((s) => seriesToViewModel(readModel, s));

    rails.push({
      id: 'rail-series',
      title: 'Séries em Destaque',
      kind: 'series',
      items: seriesItems,
    });
  }

  // 3. Faixas por Categoria tipadas pelos itens materializados.
  // Uma categoria de origem mista gera uma faixa independente por kind.
  for (const cat of readModel.getCategoriesForKind('movie')) {
    const catMovies = readModel.moviesByCategoryId.get(cat.id) || [];
    const movieItems = catMovies
      .slice(0, HOME_RAIL_MAX_ITEMS_INITIAL)
      .map((m) => movieToViewModel(readModel, m));

    if (movieItems.length > 0) {
      rails.push({
        id: `rail-cat-${cat.id}-movie`,
        title: cat.name,
        kind: 'category',
        items: movieItems,
      });
    }
  }

  for (const cat of readModel.getCategoriesForKind('series')) {
    const catSeries = readModel.seriesByCategoryId.get(cat.id) || [];
    const seriesItems = catSeries
      .slice(0, HOME_RAIL_MAX_ITEMS_INITIAL)
      .map((s) => seriesToViewModel(readModel, s));

    if (seriesItems.length > 0) {
      rails.push({
        id: `rail-cat-${cat.id}-series`,
        title: cat.name,
        kind: 'category',
        items: seriesItems,
      });
    }
  }

  // 4. Faixas por Gênero (que tenham itens)
  for (const genre of readModel.catalog.genres) {
    const genreMovies = readModel.moviesByGenreId.get(genre.id) || [];
    const genreSeries = readModel.seriesByGenreId.get(genre.id) || [];

    const combined: CatalogItemViewModel[] = [
      ...genreMovies.map((m) => movieToViewModel(readModel, m)),
      ...genreSeries.map((s) => seriesToViewModel(readModel, s)),
    ].slice(0, HOME_RAIL_MAX_ITEMS_INITIAL);

    if (combined.length > 0) {
      rails.push({
        id: `rail-genre-${genre.id}`,
        title: genre.name,
        kind: 'genre',
        items: combined,
      });
    }
  }

  return rails;
}

export function getMovieCategories(readModel: CatalogReadModel): Category[] {
  return readModel.getCategoriesForKind('movie');
}

export function getSeriesCategories(readModel: CatalogReadModel): Category[] {
  return readModel.getCategoriesForKind('series');
}

export function selectSeriesPageItems<T extends { kind: string }>(
  items: readonly T[]
): T[] {
  return items.filter((item) => item.kind === 'series');
}

export interface SeriesPageProjection {
  categories: Category[];
  items: CatalogItemViewModel[];
}

export function getSeriesPageProjection(
  readModel: CatalogReadModel,
  filters?: { categoryId?: string }
): SeriesPageProjection {
  const typedSeriesItems = selectSeriesPageItems(
    readModel.catalog.series.map((series) => seriesToViewModel(readModel, series))
  );
  const typedSeriesIds = new Set(typedSeriesItems.map((item) => item.id));
  const typedSeriesEntities = readModel.catalog.series.filter((series) =>
    typedSeriesIds.has(series.id)
  );
  const typedSeriesCategoryIds = new Set(
    typedSeriesEntities.flatMap((series) => series.categoryIds)
  );
  const categories = readModel.getTrustedCategoriesForKind('series').filter((category) =>
    typedSeriesCategoryIds.has(category.id)
  );
  const trustedSeriesCategoryIds = new Set(categories.map((category) => category.id));
  const filteredSeriesEntities = filters?.categoryId
    && trustedSeriesCategoryIds.has(filters.categoryId)
    ? typedSeriesEntities.filter((series) => series.categoryIds.includes(filters.categoryId!))
    : typedSeriesEntities;

  return {
    categories,
    items: selectSeriesPageItems(
      filteredSeriesEntities.map((series) => seriesToViewModel(readModel, series))
    ),
  };
}

/**
 * Retorna todos os filmes (com filtro opcional por categoria ou gênero).
 */
export function getAllMovies(
  readModel: CatalogReadModel,
  filters?: { categoryId?: string; genreId?: string }
): CatalogItemViewModel[] {
  let movies = readModel.catalog.movies;

  if (filters?.categoryId) {
    movies = readModel.moviesByCategoryId.get(filters.categoryId) || [];
  }
  if (filters?.genreId) {
    movies = movies.filter((m) => m.genreIds.includes(filters.genreId!));
  }

  return movies.map((m) => movieToViewModel(readModel, m));
}

/**
 * Retorna todas as séries (com filtro opcional por categoria ou gênero).
 */
export function getAllSeries(
  readModel: CatalogReadModel,
  filters?: { categoryId?: string; genreId?: string }
): CatalogItemViewModel[] {
  let seriesList = readModel.catalog.series;

  if (filters?.categoryId) {
    seriesList = readModel.seriesByCategoryId.get(filters.categoryId) || [];
  }
  if (filters?.genreId) {
    seriesList = seriesList.filter((s) => s.genreIds.includes(filters.genreId!));
  }

  return seriesList.map((s) => seriesToViewModel(readModel, s));
}

/**
 * Retorna os detalhes completos de um filme.
 */
export function getMovieDetail(
  readModel: CatalogReadModel,
  movieId: string
): MovieDetailViewModel | null {
  const movie = readModel.moviesById.get(movieId);
  if (!movie) return null;

  const posterUri = sourceArtwork(readModel, movie, 'poster');
  const backdropUri = sourceArtwork(readModel, movie, 'backdrop');

  return {
    id: movie.id,
    externalIds: movie.externalIds?.tmdbId ? { tmdbId: movie.externalIds.tmdbId } : undefined,
    title: movie.title,
    originalTitle: movie.originalTitle,
    yearFormatted: readModel.formatYear(movie.year),
    overview: movie.overview,
    durationFormatted: readModel.formatDuration(movie.durationSeconds),
    posterUri,
    backdropUri,
    genreLabels: readModel.resolveGenreLabels(movie.genreIds),
    categoryLabels: readModel.resolveCategoryLabels(movie.categoryIds),
    playbackState: 'PLAYBACK_AVAILABLE_IN_G8',
  };
}

/**
 * Retorna os detalhes completos de uma série, com suas temporadas e episódios associados.
 */
export function getSeriesDetail(
  readModel: CatalogReadModel,
  seriesId: string
): SeriesDetailViewModel | null {
  const series = readModel.seriesById.get(seriesId);
  if (!series) return null;

  const seriesPoster = sourceArtwork(readModel, series, 'poster');
  const seriesBackdrop = sourceArtwork(readModel, series, 'backdrop');

  const rawSeasons = readModel.seasonsBySeriesId.get(seriesId) || [];

  const seasons: SeasonViewModel[] = rawSeasons.map((season) => {
    const rawEpisodes = readModel.episodesBySeasonId.get(season.id) || [];

    const episodes: EpisodeViewModel[] = rawEpisodes.map((ep) => ({
      id: ep.id,
      episodeNumber: ep.episodeNumber,
      title: ep.title,
      overview: ep.overview,
      durationFormatted: readModel.formatDuration(ep.durationSeconds),
      thumbnailUri:
        (ep as any).thumbnailUri ||
        (ep as any).thumbnailUrl ||
        (ep as any).posterUri ||
        (ep as any).posterUrl ||
        (ep as any).logo ||
        seriesPoster ||
        readModel.resolveArtworkUri(ep.artworkIds, 'thumbnail') ||
        '',
      playbackState: 'PLAYBACK_AVAILABLE_IN_G8',
    }));

    return {
      id: season.id,
      seasonNumber: season.seasonNumber,
      title: season.title || `Temporada ${season.seasonNumber}`,
      episodesCount: episodes.length,
      episodes,
    };
  });

  return {
    id: series.id,
    externalIds: series.externalIds?.tmdbId ? { tmdbId: series.externalIds.tmdbId } : undefined,
    title: series.title,
    originalTitle: series.originalTitle,
    yearFormatted: readModel.formatYear(series.year),
    overview: series.overview,
    posterUri: seriesPoster,
    backdropUri: seriesBackdrop,
    genreLabels: readModel.resolveGenreLabels(series.genreIds),
    categoryLabels: readModel.resolveCategoryLabels(series.categoryIds),
    seasons,
  };
}
