/**
 * Xandeflix Prebuilt — Compact Search Index Builder (Experiment R2)
 *
 * Constrói o índice COMPACT_SEARCH_INDEX_V1 determinístico a partir
 * de um PrebuiltCatalog.
 *
 * Princípios:
 * - COMPACT_DOCUMENT_TABLE = SIM (docId ordinal, canonicalId, kind, title, originalTitle?, year?)
 * - SPECIALIZED_EXACT_TITLE = SIM (índice dedicado de títulos normalizados -> docIds)
 * - ORDERED_TOKEN_DICTIONARY = SIM (tokens ordenados para busca binária)
 * - UINT32_POSTINGS = SIM (offsets contíguos e postings em TypedArray)
 * - DETERMINISTIC_BUILD = SIM (ordenação estável em todas as coleções)
 */

import crypto from 'node:crypto';
import type { PrebuiltCatalog, Genre, Category } from '../../contracts/catalog.ts';
import {
  normalizeSearchText,
  extractUniqueTokens,
} from '../../search/search-normalization.ts';
import {
  COMPACT_SEARCH_INDEX_VERSION,
  type CompactSearchIndex,
  type CompactSearchDocument,
} from './compact-search.types.ts';
import { serializeCompactIndex } from './compact-search-serializer.ts';

export interface BuildCompactSearchIndexOptions {
  generator?: string;
  deterministicGeneratedAt?: string;
}

export function calculateCompactIndexContentHash(buffer: Buffer): string {
  if (crypto && typeof crypto.createHash === 'function') {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }
  let hash = 0;
  for (let i = 0; i < buffer.length; i++) {
    hash = (hash * 31 + buffer[i]) >>> 0;
  }
  return hash.toString(16).padStart(64, '0');
}

export class CompactSearchIndexBuilder {
  build(
    catalog: PrebuiltCatalog,
    options?: BuildCompactSearchIndexOptions
  ): CompactSearchIndex {
    const genreMap = new Map<string, Genre>();
    for (const g of catalog.genres || []) {
      genreMap.set(g.id, g);
    }

    const categoryMap = new Map<string, Category>();
    for (const c of catalog.categories || []) {
      categoryMap.set(c.id, c);
    }

    // 1. Extração de documentos em formato compacto
    type RawDoc = {
      canonicalId: string;
      kind: 'movie' | 'series';
      title: string;
      originalTitle?: string;
      year?: number;
      genreIds: string[];
      categoryIds: string[];
    };

    const rawDocs: RawDoc[] = [];

    for (const movie of catalog.movies || []) {
      const doc: RawDoc = {
        canonicalId: movie.id,
        kind: 'movie',
        title: movie.title,
        genreIds: [...(movie.genreIds || [])].sort(),
        categoryIds: [...(movie.categoryIds || [])].sort(),
      };
      if (movie.originalTitle && movie.originalTitle.trim().length > 0) {
        doc.originalTitle = movie.originalTitle.trim();
      }
      if (typeof movie.year === 'number' && !isNaN(movie.year)) {
        doc.year = movie.year;
      }
      rawDocs.push(doc);
    }

    for (const series of catalog.series || []) {
      const doc: RawDoc = {
        canonicalId: series.id,
        kind: 'series',
        title: series.title,
        genreIds: [...(series.genreIds || [])].sort(),
        categoryIds: [...(series.categoryIds || [])].sort(),
      };
      if (series.originalTitle && series.originalTitle.trim().length > 0) {
        doc.originalTitle = series.originalTitle.trim();
      }
      if (typeof series.year === 'number' && !isNaN(series.year)) {
        doc.year = series.year;
      }
      rawDocs.push(doc);
    }

    // Ordenação determinística por canonicalId
    rawDocs.sort((a, b) => (a.canonicalId < b.canonicalId ? -1 : a.canonicalId > b.canonicalId ? 1 : 0));

    // Atribuir docId ordinal
    const documents: CompactSearchDocument[] = new Array(rawDocs.length);
    for (let i = 0; i < rawDocs.length; i++) {
      const r = rawDocs[i];
      documents[i] = {
        docId: i,
        canonicalId: r.canonicalId,
        kind: r.kind,
        title: r.title,
        originalTitle: r.originalTitle,
        year: r.year,
      };
    }

    // 2. Construção do Índice Dedicado de Título Exato
    const exactMap = new Map<string, number[]>();

    for (let docId = 0; docId < documents.length; docId++) {
      const doc = documents[docId];
      const normTitle = normalizeSearchText(doc.title);
      if (normTitle) {
        let list = exactMap.get(normTitle);
        if (!list) {
          list = [];
          exactMap.set(normTitle, list);
        }
        list.push(docId);
      }

      if (doc.originalTitle) {
        const normOriginal = normalizeSearchText(doc.originalTitle);
        if (normOriginal && normOriginal !== normTitle) {
          let list = exactMap.get(normOriginal);
          if (!list) {
            list = [];
            exactMap.set(normOriginal, list);
          }
          list.push(docId);
        }
      }
    }

    const sortedExactTitles = Array.from(exactMap.keys()).sort();
    const exactOffsets = new Uint32Array(sortedExactTitles.length + 1);

    let totalExactDocIds = 0;
    for (let i = 0; i < sortedExactTitles.length; i++) {
      const title = sortedExactTitles[i];
      const docList = exactMap.get(title)!;
      // Deduplicar e ordenar
      const uniqueSorted = Array.from(new Set(docList)).sort((a, b) => a - b);
      exactMap.set(title, uniqueSorted);
      totalExactDocIds += uniqueSorted.length;
    }

    const exactDocIds = new Uint32Array(totalExactDocIds);
    let currentExactOffset = 0;
    for (let i = 0; i < sortedExactTitles.length; i++) {
      exactOffsets[i] = currentExactOffset;
      const list = exactMap.get(sortedExactTitles[i])!;
      for (let j = 0; j < list.length; j++) {
        exactDocIds[currentExactOffset + j] = list[j];
      }
      currentExactOffset += list.length;
    }
    exactOffsets[sortedExactTitles.length] = currentExactOffset;

    // 3. Construção do Índice Invertido (Dicionário de Tokens + Postings)
    const tokenToDocsMap = new Map<string, number[]>();

    for (let docId = 0; docId < rawDocs.length; docId++) {
      const r = rawDocs[docId];
      const textFields: string[] = [r.title];
      if (r.originalTitle) {
        textFields.push(r.originalTitle);
      }
      if (r.year) {
        textFields.push(String(r.year));
      }
      for (const gId of r.genreIds) {
        const genre = genreMap.get(gId);
        if (genre?.name) {
          textFields.push(genre.name);
        }
      }
      for (const cId of r.categoryIds) {
        const category = categoryMap.get(cId);
        if (category?.name) {
          textFields.push(category.name);
        }
      }

      const docTokens = extractUniqueTokens(...textFields);
      for (const token of docTokens) {
        let list = tokenToDocsMap.get(token);
        if (!list) {
          list = [];
          tokenToDocsMap.set(token, list);
        }
        list.push(docId);
      }
    }

    const sortedTokens = Array.from(tokenToDocsMap.keys()).sort();
    const postingsOffsets = new Uint32Array(sortedTokens.length + 1);

    let totalPostings = 0;
    for (let i = 0; i < sortedTokens.length; i++) {
      const token = sortedTokens[i];
      const list = tokenToDocsMap.get(token)!;
      const uniqueSorted = Array.from(new Set(list)).sort((a, b) => a - b);
      tokenToDocsMap.set(token, uniqueSorted);
      totalPostings += uniqueSorted.length;
    }

    const postingsDocIds = new Uint32Array(totalPostings);
    let currentPostingOffset = 0;
    for (let i = 0; i < sortedTokens.length; i++) {
      postingsOffsets[i] = currentPostingOffset;
      const list = tokenToDocsMap.get(sortedTokens[i])!;
      for (let j = 0; j < list.length; j++) {
        postingsDocIds[currentPostingOffset + j] = list[j];
      }
      currentPostingOffset += list.length;
    }
    postingsOffsets[sortedTokens.length] = currentPostingOffset;

    const documentCount = documents.length;
    const tokenCount = sortedTokens.length;
    const exactTitleCount = sortedExactTitles.length;

    const generatedAt = options?.deterministicGeneratedAt || new Date().toISOString();
    const generator = options?.generator || 'xandeflix-prebuilt-compact-search-builder/1.0';

    const interimIndex: CompactSearchIndex = {
      metadata: {
        format: 'COMPACT_SEARCH_INDEX_V1',
        version: COMPACT_SEARCH_INDEX_VERSION,
        schemaVersion: 1,
        normalizationVersion: 1,
        generator,
        catalogSnapshotId: catalog.metadata.snapshotId,
        catalogVersion: catalog.metadata.catalogVersion,
        documentCount,
        tokenCount,
        exactTitleCount,
        totalPostingsCount: totalPostings,
        totalExactDocIdsCount: totalExactDocIds,
        generatedAt,
        contentHash: '',
      },
      documents,
      exactTitles: sortedExactTitles,
      exactOffsets,
      exactDocIds,
      tokens: sortedTokens,
      postingsOffsets,
      postingsDocIds,
    };

    // Calcular hash sobre o binário canônico (com contentHash vazio)
    const serialized = serializeCompactIndex(interimIndex);
    const contentHash = calculateCompactIndexContentHash(serialized);
    interimIndex.metadata.contentHash = contentHash;

    return interimIndex;
  }
}
