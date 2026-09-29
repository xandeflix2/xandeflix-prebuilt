/**
 * Xandeflix Prebuilt — Compact Search Index Types (Experiment R2)
 *
 * Tipos de dados para o protótipo experimental COMPACT_SEARCH_INDEX_V1.
 *
 * Princípios:
 * - ISOLATED_EXPERIMENT = SIM
 * - COMPACT_DOCUMENT_TABLE = SIM (sem duplicação desnecessária de campos)
 * - SPECIALIZED_EXACT_LOOKUP = SIM
 * - TYPED_ARRAY_POSTINGS = SIM (Uint32Array)
 * - TOP_K_BOUND = SIM
 */

import type { SearchDocumentKind, SearchMatchClass, SearchFilter } from '../../search/search-index.types.ts';

export const COMPACT_SEARCH_INDEX_MAGIC = 0x58465349; // 'XFSI' - Xandeflix Fast Search Index
export const COMPACT_SEARCH_INDEX_VERSION = 1;

export interface CompactSearchDocument {
  docId: number;
  canonicalId: string;
  kind: SearchDocumentKind;
  title: string;
  originalTitle?: string;
  year?: number;
}

export interface CompactSearchIndexMetadata {
  format: 'COMPACT_SEARCH_INDEX_V1';
  version: 1;
  schemaVersion: 1;
  normalizationVersion: 1;
  generator: string;
  catalogSnapshotId: string;
  catalogVersion: string;
  documentCount: number;
  tokenCount: number;
  exactTitleCount: number;
  totalPostingsCount: number;
  totalExactDocIdsCount: number;
  generatedAt: string;
  contentHash: string;
}

export interface CompactSearchIndex {
  metadata: CompactSearchIndexMetadata;
  documents: CompactSearchDocument[];
  exactTitles: string[];
  exactOffsets: Uint32Array;
  exactDocIds: Uint32Array;
  tokens: string[];
  postingsOffsets: Uint32Array;
  postingsDocIds: Uint32Array;
}

export interface CompactQueryResult {
  items: CompactSearchResultItem[];
  candidateCount: number;
  durationMs: number;
}

export interface CompactSearchResultItem {
  id: string;
  kind: SearchDocumentKind;
  title: string;
  originalTitle?: string;
  year?: number;
  score: number;
  matchClass: SearchMatchClass;
}

export interface CompactSearchOptions {
  topK?: number;
  filter?: SearchFilter;
}
