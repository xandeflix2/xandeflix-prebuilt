/**
 * Xandeflix Prebuilt — Ingestion Pipeline Types
 *
 * Define o modelo intermediário (Raw Source Model), interfaces de adaptadores,
 * opções de configuração e resultados de métricas do pipeline de ingestão externa.
 *
 * Princípio: RAW_MODEL_SEPARATED_FROM_CANONICAL_CONTRACT=SIM
 * O modelo bruto de fontes externas não se confunde com o PrebuiltCatalog v1.
 */

import type { PrebuiltCatalog } from '../contracts/catalog.ts';

export interface RawArtwork {
  kind: 'poster' | 'backdrop' | 'thumbnail' | 'logo';
  url: string;
  width?: number;
  height?: number;
  mimeType?: string;
}

export interface RawStream {
  sourceItemId: string | number;
  containerExtension?: string;
  qualityLabel?: string;
}

export interface RawMovie {
  sourceItemId: string | number;
  title: string;
  originalTitle?: string;
  year?: number | string;
  overview?: string;
  durationSeconds?: number | string;
  categories: string[];
  genres: string[];
  artworks?: RawArtwork[];
  streams?: RawStream[];
  tmdbId?: string | number;
  imdbId?: string;
}

export interface RawEpisode {
  episodeNumber: number | string;
  title: string;
  overview?: string;
  durationSeconds?: number | string;
  artworks?: RawArtwork[];
  streams?: RawStream[];
  tmdbId?: string | number;
  imdbId?: string;
}

export interface RawSeason {
  seasonNumber: number | string;
  title?: string;
  artworks?: RawArtwork[];
  episodes: RawEpisode[];
}

export interface RawSeries {
  sourceItemId: string | number;
  title: string;
  originalTitle?: string;
  year?: number | string;
  overview?: string;
  categories: string[];
  genres: string[];
  artworks?: RawArtwork[];
  seasons: RawSeason[];
  tmdbId?: string | number;
  imdbId?: string;
}

export interface RawSourceCatalog {
  sourceName: string;
  sourceVersion?: string;
  movies: RawMovie[];
  series: RawSeries[];
}

export interface IngestionOptions {
  sourceNamespace?: string;
  catalogVersion?: string;
  deterministicGeneratedAt?: string;
  outputPath?: string;
  quiet?: boolean;
}

export interface IngestionMetrics {
  sourceItemsTotal: number;
  moviesNormalized: number;
  seriesNormalized: number;
  seasonsNormalized: number;
  episodesNormalized: number;
  categoriesNormalized: number;
  genresNormalized: number;
  streamsNormalized: number;
  artworksNormalized: number;
  pipelineDurationMs: number;
}

export interface IngestionResult {
  success: boolean;
  catalog?: PrebuiltCatalog;
  metrics: IngestionMetrics;
  errors: string[];
}
