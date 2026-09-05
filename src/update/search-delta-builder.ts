/**
 * Xandeflix Prebuilt — Search Index Delta Builder (Gate G9)
 *
 * Gera o SearchIndexDelta determinístico externamente a partir de dois índices válidos.
 *
 * Princípios:
 * - DELTA_GENERATION = EXTERNAL_PREBUILT
 * - ON_DEVICE_SEARCH_FULL_REINDEX_DURING_UPDATE = PROHIBITED
 * - SEARCH_DELTA_DATA_MINIMIZATION = REQUIRED
 */

import type { PrebuiltSearchIndex, SearchDocument } from '../search/search-index.types.ts';
import type { SearchIndexDelta } from './search-delta.types.ts';

export class SearchDeltaBuilder {
  build(baseIndex: PrebuiltSearchIndex, targetIndex: PrebuiltSearchIndex): SearchIndexDelta {
    const baseDocMap = new Map<string, SearchDocument>();
    for (const doc of baseIndex.documents || []) {
      baseDocMap.set(doc.id, doc);
    }

    const targetDocMap = new Map<string, SearchDocument>();
    for (const doc of targetIndex.documents || []) {
      targetDocMap.set(doc.id, doc);
    }

    // 1. Document diff
    const documentUpserts: SearchDocument[] = [];
    for (const [id, targetDoc] of targetDocMap.entries()) {
      const baseDoc = baseDocMap.get(id);
      if (!baseDoc || JSON.stringify(baseDoc) !== JSON.stringify(targetDoc)) {
        documentUpserts.push(targetDoc);
      }
    }
    documentUpserts.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

    const documentRemoveIds: string[] = [];
    for (const id of baseDocMap.keys()) {
      if (!targetDocMap.has(id)) {
        documentRemoveIds.push(id);
      }
    }
    documentRemoveIds.sort();

    // 2. Postings diff
    const postingUpserts: Record<string, string[]> = {};
    const postingRemoveTokens: string[] = [];

    // Tokens no target
    for (const token of Object.keys(targetIndex.postings || {}).sort()) {
      const targetIndices = targetIndex.postings[token];
      const targetDocIds = targetIndices.map(idx => targetIndex.documents[idx].id);

      const baseIndices = baseIndex.postings[token];
      if (!baseIndices) {
        // Novo token
        postingUpserts[token] = targetDocIds;
      } else {
        const baseDocIds = baseIndices.map(idx => baseIndex.documents[idx].id);
        const isDifferent =
          baseDocIds.length !== targetDocIds.length ||
          baseDocIds.some((id, i) => id !== targetDocIds[i]);

        if (isDifferent) {
          postingUpserts[token] = targetDocIds;
        }
      }
    }

    // Tokens removidos (existiam na base mas não no target)
    for (const token of Object.keys(baseIndex.postings || {}).sort()) {
      if (!(token in targetIndex.postings)) {
        postingRemoveTokens.push(token);
      }
    }
    postingRemoveTokens.sort();

    return {
      deltaVersion: 1,
      baseSnapshotId: baseIndex.catalogSnapshotId,
      targetSnapshotId: targetIndex.catalogSnapshotId,
      baseCatalogVersion: baseIndex.catalogVersion,
      targetCatalogVersion: targetIndex.catalogVersion,
      documentUpserts,
      documentRemoveIds,
      postingUpserts,
      postingRemoveTokens,
      targetDocumentCount: targetIndex.documentCount,
      targetTokenCount: targetIndex.tokenCount,
      targetContentHash: targetIndex.contentHash,
      targetGeneratedAt: targetIndex.generatedAt,
      targetGenerator: targetIndex.generator,
    };
  }
}
