/**
 * Xandeflix Prebuilt — Catalog View Models (Gate G6)
 *
 * Modelos de apresentação sanitizados para consumo direto pelos componentes de UI.
 *
 * Princípios:
 * - SAFE METADATA: Nenhum campo ausente deve renderizar undefined/null/NaN/[object Object].
 * - BOUNDED RENDERING: Limites explícitos de apresentação para proteger o DOM.
 * - ZERO NETWORK: Dados originados estritamente do catálogo local pré-construído.
 */

export const HOME_RAIL_MAX_ITEMS_INITIAL = 24;
export const GRID_BATCH_SIZE = 48;

export type ContentType = 'movie' | 'series';

export interface CatalogItemViewModel {
  id: string;
  kind: ContentType;
  title: string;
  originalTitle?: string;
  yearFormatted?: string;
  overviewSnippet?: string;
  posterUri?: string;
  backdropUri?: string;
  genreLabels: string[];
  categoryLabels: string[];
  durationFormatted?: string;
}

export interface MovieDetailViewModel {
  id: string;
  title: string;
  originalTitle?: string;
  yearFormatted?: string;
  overview?: string;
  durationFormatted?: string;
  posterUri?: string;
  backdropUri?: string;
  genreLabels: string[];
  categoryLabels: string[];
  playbackState: 'PLAYBACK_AVAILABLE_IN_G8';
}

export interface EpisodeViewModel {
  id: string;
  episodeNumber: number;
  title: string;
  overview?: string;
  durationFormatted?: string;
  thumbnailUri?: string;
  playbackState: 'PLAYBACK_AVAILABLE_IN_G8';
}

export interface SeasonViewModel {
  id: string;
  seasonNumber: number;
  title: string;
  episodesCount: number;
  episodes: EpisodeViewModel[];
}

export interface SeriesDetailViewModel {
  id: string;
  title: string;
  originalTitle?: string;
  yearFormatted?: string;
  overview?: string;
  posterUri?: string;
  backdropUri?: string;
  genreLabels: string[];
  categoryLabels: string[];
  seasons: SeasonViewModel[];
}

export interface HomeRailViewModel {
  id: string;
  title: string;
  kind: 'hero' | 'category' | 'genre' | 'movies' | 'series';
  items: CatalogItemViewModel[];
}
