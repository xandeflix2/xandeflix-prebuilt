/**
 * Xandeflix Prebuilt — Search Index Delta Types (Gate G9)
 *
 * Contratos de tipos canônicos para o delta do índice de busca prebuilt.
 *
 * Princípios:
 * - ON_DEVICE_SEARCH_FULL_REINDEX_DURING_UPDATE = PROHIBITED
 * - SEARCH_DELTA_DATA_MINIMIZATION = REQUIRED
 * - SEARCH_POSTING_SEMANTICS = CANONICAL_DOC_IDS
 */

import type { SearchDocument } from '../search/search-index.types.ts';

export interface SearchIndexDelta {
  deltaVersion: 1;
  baseSnapshotId: string;
  targetSnapshotId: string;
  baseCatalogVersion: string;
  targetCatalogVersion: string;

  documentUpserts: SearchDocument[];
  documentRemoveIds: string[];

  /**
   * Mapeamento de tokens alterados para a lista FINAL ordenada de document IDs correspondentes.
   */
  postingUpserts: Record<string, string[]>;

  /**
   * Tokens que deixaram de existir no índice target.
   */
  postingRemoveTokens: string[];

  targetDocumentCount: number;
  targetTokenCount: number;
  targetContentHash: string;
  targetGeneratedAt?: string;
  targetGenerator?: string;
}

export interface SearchDeltaValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
