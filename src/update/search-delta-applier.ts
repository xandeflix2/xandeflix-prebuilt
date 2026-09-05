/**
 * Xandeflix Prebuilt — Search Index Delta Applier (Gate G9)
 *
 * Aplica um SearchIndexDelta sobre um índice base válido para produzir o índice target final.
 *
 * Princípios:
 * - ON_DEVICE_SEARCH_FULL_REINDEX_DURING_UPDATE = PROHIBITED
 *   (aplica postings diretamente sem re-tokenizar o catálogo inteiro)
 * - BROKEN_SEARCH_POSTING_REJECTED = PASS
 * - UNKNOWN_SEARCH_DOCUMENT_REF_REJECTED = PASS
 * - TARGET_SEARCH_HASH_MATCH = PASS
 */

import {
  SEARCH_INDEX_VERSION,
  SEARCH_NORMALIZATION_VERSION,
  type PrebuiltSearchIndex,
  type SearchDocument,
} from '../search/search-index.types.ts';
import { calculateSearchIndexContentHash } from '../search/search-index-builder.ts';
import type { SearchIndexDelta } from './search-delta.types.ts';

export class SearchDeltaApplier {
  apply(
    baseIndex: PrebuiltSearchIndex,
    delta: SearchIndexDelta,
    options?: { deterministicGeneratedAt?: string }
  ): PrebuiltSearchIndex {
    // 1. Verificação estrita de binding base
    if (baseIndex.catalogSnapshotId !== delta.baseSnapshotId) {
      throw new Error(
        `[SEARCH_SNAPSHOT_MISMATCH_REJECTED] Snapshot base ativo '${baseIndex.catalogSnapshotId}' diverge da base declarada no delta de busca '${delta.baseSnapshotId}'`
      );
    }
    if (baseIndex.catalogVersion !== delta.baseCatalogVersion) {
      throw new Error(
        `[SEARCH_CATALOG_VERSION_MISMATCH_REJECTED] Versão base ativa '${baseIndex.catalogVersion}' diverge da versão base do delta de busca '${delta.baseCatalogVersion}'`
      );
    }

    // 2. Reconstrução determinística dos documentos
    const docMap = new Map<string, SearchDocument>();
    for (const doc of baseIndex.documents || []) {
      docMap.set(doc.id, doc);
    }

    for (const removeId of delta.documentRemoveIds || []) {
      docMap.delete(removeId);
    }

    for (const upsertDoc of delta.documentUpserts || []) {
      docMap.set(upsertDoc.id, upsertDoc);
    }

    if (docMap.size !== delta.targetDocumentCount) {
      throw new Error(
        `[TARGET_DOCUMENT_COUNT_MISMATCH] Contagem de documentos reconstruída (${docMap.size}) diverge de targetDocumentCount declarado (${delta.targetDocumentCount})`
      );
    }

    const targetDocs = Array.from(docMap.values()).sort((a, b) =>
      a.id < b.id ? -1 : a.id > b.id ? 1 : 0
    );

    // Mapeamento O(1) de ID de documento para seu índice ordenado final no array targetDocs
    const docIdToTargetIdx = new Map<string, number>();
    for (let i = 0; i < targetDocs.length; i++) {
      docIdToTargetIdx.set(targetDocs[i].id, i);
    }

    // 3. Reconstrução determinística das postings
    const tokenSet = new Set<string>();

    // Carrega tokens base existentes
    for (const token of Object.keys(baseIndex.postings || {})) {
      tokenSet.add(token);
    }

    // Remove tokens desativados
    for (const token of delta.postingRemoveTokens || []) {
      tokenSet.delete(token);
    }

    // Adiciona tokens novos/alterados
    for (const token of Object.keys(delta.postingUpserts || {})) {
      tokenSet.add(token);
    }

    const sortedTokens = Array.from(tokenSet).sort();
    const targetPostings: Record<string, number[]> = {};

    for (const token of sortedTokens) {
      let docIds: string[];

      if (token in delta.postingUpserts) {
        // Token alterado: usa a lista final declarada no delta
        docIds = delta.postingUpserts[token];
      } else {
        // Token inalterado: mapeia os doc IDs da base para as novas posições no target
        const baseIndices = baseIndex.postings[token];
        if (!baseIndices) {
          throw new Error(`[BROKEN_SEARCH_POSTING_REJECTED] Token '${token}' ausente nas postings base`);
        }
        docIds = baseIndices.map(bIdx => {
          const baseDoc = baseIndex.documents[bIdx];
          if (!baseDoc) {
            throw new Error(`[BROKEN_SEARCH_POSTING_REJECTED] Índice base inválido '${bIdx}' para token '${token}'`);
          }
          return baseDoc.id;
        });
      }

      // Mapeia os document IDs para os novos índices target ordenados
      const targetIndices: number[] = [];
      for (const id of docIds) {
        const targetIdx = docIdToTargetIdx.get(id);
        if (targetIdx === undefined) {
          throw new Error(
            `[UNKNOWN_SEARCH_DOCUMENT_REF_REJECTED] Posting para token '${token}' referencia documento inexistente '${id}'`
          );
        }
        targetIndices.push(targetIdx);
      }

      targetPostings[token] = Array.from(new Set(targetIndices)).sort((a, b) => a - b);
    }

    if (sortedTokens.length !== delta.targetTokenCount) {
      throw new Error(
        `[TARGET_TOKEN_COUNT_MISMATCH] Contagem de tokens reconstruída (${sortedTokens.length}) diverge de targetTokenCount declarado (${delta.targetTokenCount})`
      );
    }

    // 4. Verificação de hash lógico
    const canonicalPayloadForHash = {
      searchIndexVersion: SEARCH_INDEX_VERSION,
      schemaVersion: 1,
      normalizationVersion: SEARCH_NORMALIZATION_VERSION,
      catalogSnapshotId: delta.targetSnapshotId,
      catalogVersion: delta.targetCatalogVersion,
      documentCount: targetDocs.length,
      tokenCount: sortedTokens.length,
      documents: targetDocs,
      postings: targetPostings,
    };

    const computedContentHash = calculateSearchIndexContentHash(canonicalPayloadForHash);
    if (computedContentHash !== delta.targetContentHash) {
      throw new Error(
        `[TARGET_SEARCH_HASH_MISMATCH] contentHash calculado ('${computedContentHash}') diverge do targetContentHash declarado ('${delta.targetContentHash}')`
      );
    }

    const generatedAt = delta.targetGeneratedAt || options?.deterministicGeneratedAt || new Date().toISOString();
    const generator = delta.targetGenerator || 'xandeflix-prebuilt-delta-applier/1.0';

    return {
      searchIndexVersion: SEARCH_INDEX_VERSION,
      schemaVersion: 1,
      normalizationVersion: SEARCH_NORMALIZATION_VERSION,
      generator,
      catalogSnapshotId: delta.targetSnapshotId,
      catalogVersion: delta.targetCatalogVersion,
      documentCount: targetDocs.length,
      tokenCount: sortedTokens.length,
      generatedAt,
      contentHash: computedContentHash,
      documents: targetDocs,
      postings: targetPostings,
    };
  }
}
