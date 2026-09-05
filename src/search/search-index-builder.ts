/**
 * Xandeflix Prebuilt — Search Index Builder (Gate G7)
 *
 * Constrói o índice de busca invertido canônico e determinístico externamente
 * a partir de um PrebuiltCatalog válido.
 *
 * Princípios:
 * - SEARCH_INDEX_EXTERNAL_BUILD = REQUIRED
 * - SEARCH_INDEX_FORMAT = CANONICAL_JSON_INVERTED_INDEX_V1
 * - DETERMINISTIC_OUTPUT = SIM (ordenação estável de docs, tokens e postings)
 * - DATA_MINIMIZATION = REQUIRED (somente entidades e campos autorizados)
 */

import crypto from 'node:crypto';
import type { PrebuiltCatalog, Genre, Category } from '../contracts/catalog.ts';
import {
  SEARCH_INDEX_VERSION,
  SEARCH_NORMALIZATION_VERSION,
  type PrebuiltSearchIndex,
  type SearchDocument,
} from './search-index.types.ts';
import { extractUniqueTokens } from './search-normalization.ts';

export interface BuildSearchIndexOptions {
  generator?: string;
  deterministicGeneratedAt?: string;
}

/**
 * Calcula o hash lógico SHA-256 do índice de busca.
 * Exclui generatedAt e campos variáveis para garantir determinismo estrito.
 */
export function calculateSearchIndexContentHash(canonicalPayload: unknown): string {
  const serialized = JSON.stringify(canonicalPayload);
  if (crypto && typeof crypto.createHash === 'function') {
    return crypto.createHash('sha256').update(serialized).digest('hex');
  }
  throw new Error('Ambiente sem suporte a hashing SHA-256');
}

export class SearchIndexBuilder {
  build(
    catalog: PrebuiltCatalog,
    options?: BuildSearchIndexOptions
  ): PrebuiltSearchIndex {
    // Mapas auxiliares para resolução de nomes de gêneros e categorias para tokens
    const genreMap = new Map<string, Genre>();
    for (const g of catalog.genres || []) {
      genreMap.set(g.id, g);
    }

    const categoryMap = new Map<string, Category>();
    for (const c of catalog.categories || []) {
      categoryMap.set(c.id, c);
    }

    // 1. Extração de documentos indexáveis (Movies e Series)
    const rawDocs: SearchDocument[] = [];

    // 1.1 Filmes
    for (const movie of catalog.movies || []) {
      const doc: SearchDocument = {
        id: movie.id,
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

    // 1.2 Séries
    for (const series of catalog.series || []) {
      const doc: SearchDocument = {
        id: series.id,
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

    // 2. Ordenação determinística de documentos por ID
    rawDocs.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

    // 3. Construção do índice invertido (postings)
    const tokenToDocsMap = new Map<string, number[]>();

    for (let docIdx = 0; docIdx < rawDocs.length; docIdx++) {
      const doc = rawDocs[docIdx];

      // Coleta campos textuais do documento
      const textFields: string[] = [doc.title];
      if (doc.originalTitle) {
        textFields.push(doc.originalTitle);
      }

      // Adiciona ano como token numérico se disponível
      if (doc.year) {
        textFields.push(String(doc.year));
      }

      // Adiciona nomes de gêneros
      for (const gId of doc.genreIds) {
        const genre = genreMap.get(gId);
        if (genre?.name) {
          textFields.push(genre.name);
        }
      }

      // Adiciona nomes de categorias
      for (const cId of doc.categoryIds) {
        const category = categoryMap.get(cId);
        if (category?.name) {
          textFields.push(category.name);
        }
      }

      // Extrai tokens únicos
      const docTokens = extractUniqueTokens(...textFields);

      for (const token of docTokens) {
        let postingsList = tokenToDocsMap.get(token);
        if (!postingsList) {
          postingsList = [];
          tokenToDocsMap.set(token, postingsList);
        }
        postingsList.push(docIdx);
      }
    }

    // 4. Ordenação determinística das chaves de postings
    const sortedTokens = Array.from(tokenToDocsMap.keys()).sort();
    const sortedPostings: Record<string, number[]> = {};

    for (const token of sortedTokens) {
      const list = tokenToDocsMap.get(token)!;
      // Deduplica e ordena os índices numéricos
      sortedPostings[token] = Array.from(new Set(list)).sort((a, b) => a - b);
    }

    const documentCount = rawDocs.length;
    const tokenCount = sortedTokens.length;

    // 5. Hash lógico determinístico
    const canonicalPayloadForHash = {
      searchIndexVersion: SEARCH_INDEX_VERSION,
      schemaVersion: 1,
      normalizationVersion: SEARCH_NORMALIZATION_VERSION,
      catalogSnapshotId: catalog.metadata.snapshotId,
      catalogVersion: catalog.metadata.catalogVersion,
      documentCount,
      tokenCount,
      documents: rawDocs,
      postings: sortedPostings,
    };

    const contentHash = calculateSearchIndexContentHash(canonicalPayloadForHash);

    const generatedAt =
      options?.deterministicGeneratedAt || new Date().toISOString();
    const generator =
      options?.generator || 'xandeflix-prebuilt-search-builder/1.0';

    return {
      searchIndexVersion: SEARCH_INDEX_VERSION,
      schemaVersion: 1,
      normalizationVersion: SEARCH_NORMALIZATION_VERSION,
      generator,
      catalogSnapshotId: catalog.metadata.snapshotId,
      catalogVersion: catalog.metadata.catalogVersion,
      documentCount,
      tokenCount,
      generatedAt,
      contentHash,
      documents: rawDocs,
      postings: sortedPostings,
    };
  }
}
