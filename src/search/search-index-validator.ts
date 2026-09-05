/**
 * Xandeflix Prebuilt — Search Index Validator (Gate G7)
 *
 * Validador estrito e fail-closed para o índice de busca prebuilt.
 *
 * Princípios:
 * - SEARCH_INDEX_VALIDATION = FAIL_CLOSED
 * - Valida JSON Schema, integridade estrutural, contagens, unicidade de documentos,
 *   consistência de postings e ausência de credenciais/segredos.
 */

import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import searchIndexSchema from '../../schemas/prebuilt-search-index.schema.json' with { type: 'json' };
import {
  SEARCH_INDEX_VERSION,
  SEARCH_NORMALIZATION_VERSION,
  type PrebuiltSearchIndex,
  type SearchIndexValidationResult,
} from './search-index.types.ts';
import { calculateSearchIndexContentHash } from './search-index-builder.ts';

// @ts-expect-error Ajv default export interoperability
const AjvClass = Ajv2020.default || Ajv2020;
const ajv = new AjvClass({ allErrors: true, strict: false });
const addFormatsFn =
  (addFormats as unknown as { default?: (a: unknown) => void }).default ||
  addFormats;
addFormatsFn(ajv);

const validateSchema = ajv.compile(searchIndexSchema);

export interface ValidateSearchIndexOptions {
  expectedSnapshotId?: string;
  expectedCatalogVersion?: string;
}

export class SearchIndexValidator {
  validate(
    index: unknown,
    options?: ValidateSearchIndexOptions
  ): SearchIndexValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Validação estrutural preliminar
    if (!index || typeof index !== 'object') {
      return {
        valid: false,
        errors: ['[INVALID_SEARCH_INDEX_SCHEMA] Índice de busca é nulo ou não é um objeto válido'],
        warnings,
      };
    }

    // 2. Validação contra o JSON Schema canônico
    const isSchemaValid = validateSchema(index);
    if (!isSchemaValid) {
      for (const err of validateSchema.errors || []) {
        errors.push(
          `[INVALID_SEARCH_INDEX_SCHEMA] JSON Schema: ${err.instancePath || '/'} ${err.message}`
        );
      }
      return { valid: false, errors, warnings };
    }

    const typedIndex = index as PrebuiltSearchIndex;

    // 3. Validação de versões
    if (typedIndex.searchIndexVersion !== SEARCH_INDEX_VERSION) {
      errors.push(
        `[SEARCH_INDEX_VERSION_MISMATCH] searchIndexVersion inválido. Esperado: ${SEARCH_INDEX_VERSION}, recebido: ${typedIndex.searchIndexVersion}`
      );
    }
    if (typedIndex.schemaVersion !== 1) {
      errors.push(
        `[SEARCH_INDEX_SCHEMA_VERSION_MISMATCH] schemaVersion inválido. Esperado: 1, recebido: ${typedIndex.schemaVersion}`
      );
    }
    if (typedIndex.normalizationVersion !== SEARCH_NORMALIZATION_VERSION) {
      errors.push(
        `[SEARCH_NORMALIZATION_VERSION_MISMATCH] normalizationVersion incompatível. Esperado: ${SEARCH_NORMALIZATION_VERSION}, recebido: ${typedIndex.normalizationVersion}`
      );
    }

    // 4. Vinculação com Snapshot e CatalogVersion esperados
    if (options?.expectedSnapshotId && typedIndex.catalogSnapshotId !== options.expectedSnapshotId) {
      errors.push(
        `[SEARCH_INDEX_SNAPSHOT_MISMATCH] catalogSnapshotId do índice diverge do esperado. Esperado: '${options.expectedSnapshotId}', recebido: '${typedIndex.catalogSnapshotId}'`
      );
    }
    if (options?.expectedCatalogVersion && typedIndex.catalogVersion !== options.expectedCatalogVersion) {
      errors.push(
        `[SEARCH_INDEX_CATALOG_VERSION_MISMATCH] catalogVersion do índice diverge do esperado. Esperado: '${options.expectedCatalogVersion}', recebido: '${typedIndex.catalogVersion}'`
      );
    }

    // 5. Validação de contagens
    if (typedIndex.documentCount !== typedIndex.documents.length) {
      errors.push(
        `[SEARCH_INDEX_COUNT_MISMATCH] documentCount diverge do tamanho de documents. Declarado: ${typedIndex.documentCount}, Real: ${typedIndex.documents.length}`
      );
    }

    const postingTokens = Object.keys(typedIndex.postings);
    if (typedIndex.tokenCount !== postingTokens.length) {
      errors.push(
        `[SEARCH_INDEX_TOKEN_COUNT_MISMATCH] tokenCount diverge do número de tokens em postings. Declarado: ${typedIndex.tokenCount}, Real: ${postingTokens.length}`
      );
    }

    // 6. Unicidade de IDs e ausência de segredos nos documentos
    const seenDocIds = new Set<string>();
    const secretPatterns = [
      /SUPABASE_SERVICE_ROLE/i,
      /service_role/i,
      /eyJh[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/, // JWT pattern
      /postgres:\/\/[^:]+:[^@]+@/i,
      /https?:\/\/[^:]+:[^@]+@/i,
      /PRIVATE_KEY/i,
      /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
    ];

    for (let i = 0; i < typedIndex.documents.length; i++) {
      const doc = typedIndex.documents[i];
      if (seenDocIds.has(doc.id)) {
        errors.push(`[DUPLICATE_SEARCH_DOCUMENT] ID de documento duplicado no índice: '${doc.id}'`);
      }
      seenDocIds.add(doc.id);

      // Auditoria de credenciais no conteúdo textual
      const docPayloadStr = `${doc.title} ${doc.originalTitle || ''} ${doc.id}`;
      for (const pattern of secretPatterns) {
        if (pattern.test(docPayloadStr)) {
          errors.push(
            `[CREDENTIALIZED_SEARCH_PAYLOAD] Padrão proibido ou credencial detectada no documento '${doc.id}': ${pattern.toString()}`
          );
        }
      }
    }

    // 7. Validação de Postings (Broken Postings & Unknown Document Refs)
    const maxDocIdx = typedIndex.documents.length;
    for (const token of postingTokens) {
      const docIndices = typedIndex.postings[token];
      if (!Array.isArray(docIndices)) {
        errors.push(`[BROKEN_POSTING] Posting do token '${token}' não é um array válido`);
        continue;
      }

      for (const idx of docIndices) {
        if (typeof idx !== 'number' || !Number.isInteger(idx) || idx < 0 || idx >= maxDocIdx) {
          errors.push(
            `[UNKNOWN_DOCUMENT_REF] Posting do token '${token}' referencia índice de documento inválido ou fora dos limites: ${idx} (max: ${maxDocIdx - 1})`
          );
        }
      }
    }

    // 8. Validação do ContentHash lógico determinístico
    const canonicalPayloadForHash = {
      searchIndexVersion: typedIndex.searchIndexVersion,
      schemaVersion: typedIndex.schemaVersion,
      normalizationVersion: typedIndex.normalizationVersion,
      catalogSnapshotId: typedIndex.catalogSnapshotId,
      catalogVersion: typedIndex.catalogVersion,
      documentCount: typedIndex.documentCount,
      tokenCount: typedIndex.tokenCount,
      documents: typedIndex.documents,
      postings: typedIndex.postings,
    };

    let recalculatedHash = '';
    try {
      recalculatedHash = calculateSearchIndexContentHash(canonicalPayloadForHash);
      if (recalculatedHash.toLowerCase() !== typedIndex.contentHash.toLowerCase()) {
        errors.push(
          `[SEARCH_INDEX_HASH_MISMATCH] contentHash divergente. Declarado: ${typedIndex.contentHash}, Recalculado: ${recalculatedHash}`
        );
      }
    } catch (err) {
      errors.push(`[SEARCH_INDEX_HASH_ERROR] Falha ao recalcular contentHash: ${(err as Error).message}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      index: typedIndex,
      contentHash: recalculatedHash,
    };
  }
}
