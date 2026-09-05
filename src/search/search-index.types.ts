/**
 * Xandeflix Prebuilt — Search Index Types (Gate G7)
 *
 * Tipos canônicos para o índice de busca prebuilt transportável.
 *
 * Princípios:
 * - SEARCH_INDEX_VERSION = 1
 * - SEARCH_NORMALIZATION_VERSION = 1
 * - SEARCH_DOCUMENT_KINDS = MOVIE_SERIES
 * - SEARCH_INDEX_FORMAT = CANONICAL_JSON_INVERTED_INDEX_V1
 * - DATA_MINIMIZATION = REQUIRED (sem overview completo, artwork URIs como tokens ou streams)
 */

export const SEARCH_INDEX_VERSION = 1;
export const SEARCH_NORMALIZATION_VERSION = 1;
export const SEARCH_INDEX_FILENAME = 'search-index.json';

export type SearchDocumentKind = 'movie' | 'series';

export interface SearchDocument {
  id: string;
  kind: SearchDocumentKind;
  title: string;
  originalTitle?: string;
  year?: number;
  genreIds: string[];
  categoryIds: string[];
}

export interface PrebuiltSearchIndex {
  searchIndexVersion: 1;
  schemaVersion: 1;
  normalizationVersion: 1;
  generator: string;
  catalogSnapshotId: string;
  catalogVersion: string;
  documentCount: number;
  tokenCount: number;
  generatedAt: string;
  contentHash: string;
  documents: SearchDocument[];
  postings: Record<string, number[]>;
}

export interface SearchFilter {
  kind?: 'movie' | 'series' | 'all';
  genreId?: string;
  year?: number;
}

export type SearchMatchClass =
  | 'EXACT_TITLE'
  | 'TITLE_PREFIX'
  | 'ALL_TOKENS'
  | 'PARTIAL'
  | 'AUXILIARY';

export interface SearchResultItem {
  id: string;
  kind: SearchDocumentKind;
  title: string;
  originalTitle?: string;
  year?: number;
  score: number;
  matchClass: SearchMatchClass;
}

export interface SearchIndexValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  index?: PrebuiltSearchIndex;
  contentHash?: string;
}

export type SearchStatus =
  | 'SEARCH_NO_ACTIVE_CATALOG'
  | 'SEARCH_INDEX_UNAVAILABLE'
  | 'SEARCH_INDEX_LOADING'
  | 'SEARCH_READY'
  | 'SEARCH_INDEX_INVALID'
  | 'SEARCH_QUERY_EMPTY'
  | 'SEARCH_RESULTS'
  | 'SEARCH_NO_RESULTS';
