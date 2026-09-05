/**
 * Xandeflix Prebuilt — Search Index Delta Validator (Gate G9)
 *
 * Validação estrita e fail-closed de payloads de SearchIndexDelta.
 *
 * Princípios:
 * - Validação contra schemas/prebuilt-search-index-delta.schema.json
 * - BROKEN_SEARCH_POSTING_REJECTED = PASS
 * - SEARCH_CREDENTIALIZED_PAYLOAD_REJECTED = PASS
 */

import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import searchDeltaSchema from '../../schemas/prebuilt-search-index-delta.schema.json' with { type: 'json' };
import type { SearchIndexDelta, SearchDeltaValidationResult } from './search-delta.types.ts';

// @ts-expect-error Ajv default export interoperability
const AjvClass = Ajv2020.default || Ajv2020;
const ajv = new AjvClass({ allErrors: true, strict: false });
const addFormatsFn =
  (addFormats as unknown as { default?: (a: unknown) => void }).default ||
  addFormats;
addFormatsFn(ajv);

const validateSchema = ajv.compile(searchDeltaSchema);

export interface ValidateSearchDeltaOptions {
  expectedBaseSnapshotId?: string;
  expectedBaseCatalogVersion?: string;
  expectedTargetSnapshotId?: string;
  expectedTargetCatalogVersion?: string;
  expectedBaseContentHash?: string;
}

export class SearchDeltaValidator {
  validate(
    delta: unknown,
    options?: ValidateSearchDeltaOptions
  ): SearchDeltaValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!delta || typeof delta !== 'object') {
      return {
        valid: false,
        errors: ['[INVALID_SEARCH_DELTA] Objeto delta de busca é nulo ou inválido'],
        warnings,
      };
    }

    // 1. JSON Schema validation
    const isSchemaValid = validateSchema(delta);
    if (!isSchemaValid) {
      for (const err of validateSchema.errors || []) {
        errors.push(
          `[SEARCH_DELTA_SCHEMA_ERROR] ${err.instancePath || '/'} ${err.message}`
        );
      }
      return { valid: false, errors, warnings };
    }

    const typedDelta = delta as SearchIndexDelta;

    // 2. Unicidade de document IDs em upsert e removeIds
    const upsertIds = new Set<string>();
    for (const doc of typedDelta.documentUpserts || []) {
      if (upsertIds.has(doc.id)) {
        errors.push(`[DUPLICATE_SEARCH_DOCUMENT_REJECTED] Documento ID '${doc.id}' duplicado em documentUpserts`);
      }
      upsertIds.add(doc.id);
    }

    const removeIds = new Set<string>();
    for (const id of typedDelta.documentRemoveIds || []) {
      if (removeIds.has(id)) {
        errors.push(`[DUPLICATE_REMOVE_ID_REJECTED] ID '${id}' duplicado em documentRemoveIds`);
      }
      removeIds.add(id);
      if (upsertIds.has(id)) {
        errors.push(
          `[UPSERT_AND_REMOVE_SAME_ID_REJECTED] Documento ID '${id}' declarado em documentUpserts e documentRemoveIds simultaneamente`
        );
      }
    }

    // 3. Auditoria de credenciais / segredos em tokens e textos (SEARCH_CREDENTIALIZED_PAYLOAD_REJECTED)
    const sensitivePatterns = [
      /password/i,
      /passwd/i,
      /service_role/i,
      /bearer\s+[a-zA-Z0-9_-]+/i,
      /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/, // JWT pattern
      /https?:\/\/[^/:]+:[^/@]+@/, // URL with credentials
    ];

    for (const token of Object.keys(typedDelta.postingUpserts || {})) {
      for (const pattern of sensitivePatterns) {
        if (pattern.test(token)) {
          errors.push(`[SEARCH_CREDENTIALIZED_PAYLOAD_REJECTED] Token suspeito de credencial detectado: '${token}'`);
        }
      }
    }

    // 4. Verificação de bindings com options
    if (options?.expectedBaseSnapshotId && typedDelta.baseSnapshotId !== options.expectedBaseSnapshotId) {
      errors.push(
        `[SEARCH_SNAPSHOT_MISMATCH_REJECTED] baseSnapshotId '${typedDelta.baseSnapshotId}' diverge do esperado '${options.expectedBaseSnapshotId}'`
      );
    }

    if (options?.expectedBaseCatalogVersion && typedDelta.baseCatalogVersion !== options.expectedBaseCatalogVersion) {
      errors.push(
        `[SEARCH_CATALOG_VERSION_MISMATCH_REJECTED] baseCatalogVersion '${typedDelta.baseCatalogVersion}' diverge do esperado '${options.expectedBaseCatalogVersion}'`
      );
    }

    if (options?.expectedTargetSnapshotId && typedDelta.targetSnapshotId !== options.expectedTargetSnapshotId) {
      errors.push(
        `[TARGET_SNAPSHOT_MISMATCH] targetSnapshotId '${typedDelta.targetSnapshotId}' diverge do esperado '${options.expectedTargetSnapshotId}'`
      );
    }

    if (options?.expectedTargetCatalogVersion && typedDelta.targetCatalogVersion !== options.expectedTargetCatalogVersion) {
      errors.push(
        `[TARGET_CATALOG_VERSION_MISMATCH] targetCatalogVersion '${typedDelta.targetCatalogVersion}' diverge do esperado '${options.expectedTargetCatalogVersion}'`
      );
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
