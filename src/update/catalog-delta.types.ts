/**
 * Xandeflix Prebuilt — Catalog Delta Types (Gate G9)
 *
 * Contratos de tipos canônicos para o delta de catálogo.
 *
 * Princípios:
 * - CATALOG_DELTA_ADDRESSING = CANONICAL_ID_BASED
 * - DELTA_UPSERT_SEMANTICS = FULL_ENTITY_REPLACEMENT
 * - DELTA_APPLICATION_DETERMINISTIC = REQUIRED
 */

import type {
  Category,
  Genre,
  Movie,
  Series,
  Season,
  Episode,
  StreamRef,
  ArtworkRef,
  SnapshotMetadata,
} from '../contracts/catalog.ts';

export interface CollectionDelta<T> {
  upsert: T[];
  removeIds: string[];
}

export interface CatalogDelta {
  deltaVersion: 1;
  baseSnapshotId: string;
  targetSnapshotId: string;
  baseCatalogVersion: string;
  targetCatalogVersion: string;
  targetMetadata: SnapshotMetadata;

  categories: CollectionDelta<Category>;
  genres: CollectionDelta<Genre>;
  movies: CollectionDelta<Movie>;
  series: CollectionDelta<Series>;
  seasons: CollectionDelta<Season>;
  episodes: CollectionDelta<Episode>;
  streams: CollectionDelta<StreamRef>;
  artworks: CollectionDelta<ArtworkRef>;
}

export interface CatalogDeltaValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
