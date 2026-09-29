/**
 * Xandeflix Prebuilt — Compact Search Index V2 Types (Experiment R3)
 *
 * Tipos de dados para o protótipo COMPACT_SEARCH_INDEX_V2 com
 * Delta Encoding, Varint/VByte e String Pooling.
 *
 * Princípios:
 * - ISOLATED_EXPERIMENT = SIM
 * - POSTINGS_DELTA_VARINT = SIM
 * - STRING_POOLING = SIM
 * - TOP_K_BOUND = 50
 */

import type { SearchDocumentKind, SearchMatchClass, SearchFilter } from '../../search/search-index.types.ts';
import { type StringPool } from './string-pool.ts';

export const COMPACT_SEARCH_INDEX_V2_MAGIC = 0x58465332; // 'XFS2' - Xandeflix Fast Search Index V2
export const COMPACT_SEARCH_INDEX_V2_VERSION = 2;

export interface CompactSearchIndexV2Metadata {
  format: 'COMPACT_SEARCH_INDEX_V2';
  version: 2;
  schemaVersion: 1;
  normalizationVersion: 1;
  generator: string;
  catalogSnapshotId: string;
  catalogVersion: string;
  documentCount: number;
  tokenCount: number;
  exactTitleCount: number;
  stringPoolCount: number;
  totalPostingsCount: number;
  totalPostingsBytes: number;
  generatedAt: string;
  contentHash: string;
}

export interface CompactSearchIndexV2 {
  metadata: CompactSearchIndexV2Metadata;
  stringPool: StringPool;

  // Document Table binária colunar compacta (3.6 MB para 240k docs)
  docKinds: Uint8Array;            // 0 = movie, 1 = series, 2 = live
  docYears: Uint16Array;          // 0 se undefined
  docCanonicalIdIds: Uint32Array; // String ID no pool
  docTitleIds: Uint32Array;       // String ID no pool
  docOriginalTitleIds: Int32Array;// String ID no pool ou -1 se undefined

  // Índice Exato dedicado
  exactTitles: string[];
  exactOffsets: Uint32Array;
  exactDocIds: Uint8Array;        // Delta+Varint docIds

  // Dicionário de Tokens
  tokens: string[];

  // Postings comprimidos com Delta + Varint
  postingsOffsets: Uint32Array;
  postingsBytes: Uint8Array;
}

export interface ComponentByteBreakdown {
  metadataBytes: number;
  stringPoolBytes: number;
  documentTableBytes: number;
  tokenDictionaryBytes: number;
  exactIndexBytes: number;
  postingsBytes: number;
  totalBytes: number;
}

export interface CompactSearchResultItemV2 {
  id: string;
  kind: SearchDocumentKind;
  title: string;
  originalTitle?: string;
  year?: number;
  score: number;
  matchClass: SearchMatchClass;
}

export interface CompactQueryResultV2 {
  items: CompactSearchResultItemV2[];
  candidateCount: number;
  durationMs: number;
}

export interface CompactSearchOptionsV2 {
  topK?: number;
  filter?: SearchFilter;
}
