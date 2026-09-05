/**
 * Xandeflix Prebuilt — Data Contract Types (v1)
 *
 * Contrato canonico em TypeScript que espelha exatamente
 * a definicao formal do JSON Schema em schemas/prebuilt-catalog.schema.json.
 *
 * Princípio: ONE_SOURCE_OF_TRUTH. Nenhuma semantica concorrente.
 */

export type SchemaVersion = 1;

export type ContentKind = 'movie' | 'series' | 'episode';

export type ArtworkKind = 'poster' | 'backdrop' | 'thumbnail' | 'logo';

export interface ExternalIds {
  tmdbId?: string | number;
  imdbId?: string;
  sourceItemId?: string;
}

export interface SnapshotCounts {
  movies: number;
  series: number;
  seasons: number;
  episodes: number;
  categories: number;
  genres: number;
  streams: number;
  artworks: number;
}

export interface SnapshotMetadata {
  schemaVersion: SchemaVersion;
  catalogVersion: string;
  snapshotId: string;
  generatedAt: string;
  counts: SnapshotCounts;
  generator?: string;
}

export interface ArtworkRef {
  id: string;
  kind: ArtworkKind;
  uri: string;
  width?: number;
  height?: number;
  mimeType?: string;
}

export interface StreamRef {
  id: string;
  sourceItemId: string;
  contentKind: ContentKind;
  containerExtension?: string;
  qualityLabel?: string;
}

export interface Category {
  id: string;
  name: string;
  contentKinds: ('movie' | 'series')[];
}

export interface Genre {
  id: string;
  name: string;
}

export interface Movie {
  id: string;
  title: string;
  originalTitle?: string;
  year?: number;
  overview?: string;
  durationSeconds?: number;
  genreIds: string[];
  categoryIds: string[];
  artworkIds: string[];
  streamIds: string[];
  externalIds?: ExternalIds;
}

export interface Series {
  id: string;
  title: string;
  originalTitle?: string;
  year?: number;
  overview?: string;
  genreIds: string[];
  categoryIds: string[];
  artworkIds: string[];
  seasonIds: string[];
  externalIds?: ExternalIds;
}

export interface Season {
  id: string;
  seriesId: string;
  seasonNumber: number;
  title?: string;
  episodeIds: string[];
  artworkIds?: string[];
}

export interface Episode {
  id: string;
  seriesId: string;
  seasonId: string;
  episodeNumber: number;
  title: string;
  overview?: string;
  durationSeconds?: number;
  artworkIds: string[];
  streamIds: string[];
  externalIds?: ExternalIds;
}

export interface PrebuiltCatalog {
  metadata: SnapshotMetadata;
  categories: Category[];
  genres: Genre[];
  movies: Movie[];
  series: Series[];
  seasons: Season[];
  episodes: Episode[];
  streams: StreamRef[];
  artworks: ArtworkRef[];
  extensions?: Record<string, unknown>;
}
