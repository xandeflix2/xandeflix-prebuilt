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

import type { Movie, Series } from '../contracts/catalog.ts';
import { CatalogReadModel } from './catalog-read-model.ts';
import {
  type CatalogItemViewModel,
  type MovieDetailViewModel,
  type SeriesDetailViewModel,
  type SeasonViewModel,
  type EpisodeViewModel,
  type HomeRailViewModel,
  HOME_RAIL_MAX_ITEMS_INITIAL,
} from './catalog-view-model.ts';

export function movieToViewModel(readModel: CatalogReadModel, movie: Movie): CatalogItemViewModel {
  return {
    id: movie.id,
    kind: 'movie',
    title: movie.title,
    originalTitle: movie.originalTitle,
    yearFormatted: readModel.formatYear(movie.year),
    overviewSnippet: movie.overview,
    posterUri: readModel.resolveArtworkUri(movie.artworkIds, 'poster'),
    backdropUri: readModel.resolveArtworkUri(movie.artworkIds, 'backdrop'),
    genreLabels: readModel.resolveGenreLabels(movie.genreIds),
    categoryLabels: readModel.resolveCategoryLabels(movie.categoryIds),
    durationFormatted: readModel.formatDuration(movie.durationSeconds),
  };
}

export function seriesToViewModel(readModel: CatalogReadModel, series: Series): CatalogItemViewModel {
  return {
    id: series.id,
    kind: 'series',
    title: series.title,
    originalTitle: series.originalTitle,
    yearFormatted: readModel.formatYear(series.year),
    overviewSnippet: series.overview,
    posterUri: readModel.resolveArtworkUri(series.artworkIds, 'poster'),
    backdropUri: readModel.resolveArtworkUri(series.artworkIds, 'backdrop'),
    genreLabels: readModel.resolveGenreLabels(series.genreIds),
    categoryLabels: readModel.resolveCategoryLabels(series.categoryIds),
  };
}

/**
 * Retorna o item de destaque (Hero) do catálogo.
 * Prioriza primeiro filme ou série disponível.
 */
export function getHeroItem(readModel: CatalogReadModel): CatalogItemViewModel | null {
  if (readModel.catalog.movies.length > 0) {
    return movieToViewModel(readModel, readModel.catalog.movies[0]);
  }
  if (readModel.catalog.series.length > 0) {
    return seriesToViewModel(readModel, readModel.catalog.series[0]);
  }
  return null;
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

  // 3. Faixas por Categoria (que tenham itens)
  for (const cat of readModel.catalog.categories) {
    const catMovies = readModel.moviesByCategoryId.get(cat.id) || [];
    const catSeries = readModel.seriesByCategoryId.get(cat.id) || [];

    const combined: CatalogItemViewModel[] = [
      ...catMovies.map((m) => movieToViewModel(readModel, m)),
      ...catSeries.map((s) => seriesToViewModel(readModel, s)),
    ].slice(0, HOME_RAIL_MAX_ITEMS_INITIAL);

    if (combined.length > 0) {
      rails.push({
        id: `rail-cat-${cat.id}`,
        title: cat.name,
        kind: 'category',
        items: combined,
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

  return {
    id: movie.id,
    title: movie.title,
    originalTitle: movie.originalTitle,
    yearFormatted: readModel.formatYear(movie.year),
    overview: movie.overview,
    durationFormatted: readModel.formatDuration(movie.durationSeconds),
    posterUri: readModel.resolveArtworkUri(movie.artworkIds, 'poster'),
    backdropUri: readModel.resolveArtworkUri(movie.artworkIds, 'backdrop'),
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

  const rawSeasons = readModel.seasonsBySeriesId.get(seriesId) || [];

  const seasons: SeasonViewModel[] = rawSeasons.map((season) => {
    const rawEpisodes = readModel.episodesBySeasonId.get(season.id) || [];

    const episodes: EpisodeViewModel[] = rawEpisodes.map((ep) => ({
      id: ep.id,
      episodeNumber: ep.episodeNumber,
      title: ep.title,
      overview: ep.overview,
      durationFormatted: readModel.formatDuration(ep.durationSeconds),
      thumbnailUri: readModel.resolveArtworkUri(ep.artworkIds, 'thumbnail'),
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
    title: series.title,
    originalTitle: series.originalTitle,
    yearFormatted: readModel.formatYear(series.year),
    overview: series.overview,
    posterUri: readModel.resolveArtworkUri(series.artworkIds, 'poster'),
    backdropUri: readModel.resolveArtworkUri(series.artworkIds, 'backdrop'),
    genreLabels: readModel.resolveGenreLabels(series.genreIds),
    categoryLabels: readModel.resolveCategoryLabels(series.categoryIds),
    seasons,
  };
}
