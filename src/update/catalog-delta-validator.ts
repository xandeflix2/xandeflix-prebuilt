/**
 * Xandeflix Prebuilt — Catalog Delta Validator (Gate G9)
 *
 * Validação estrita e fail-closed de payloads de CatalogDelta.
 *
 * Princípios:
 * - Validação contra schemas/prebuilt-catalog-delta.schema.json
 * - DUPLICATE_UPSERT_ID_REJECTED = PASS
 * - DUPLICATE_REMOVE_ID_REJECTED = PASS
 * - UPSERT_AND_REMOVE_SAME_ID_REJECTED = PASS
 */

import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import catalogDeltaSchema from '../../schemas/prebuilt-catalog-delta.schema.json' with { type: 'json' };
import type { CatalogDelta, CatalogDeltaValidationResult, CollectionDelta } from './catalog-delta.types.ts';

// @ts-expect-error Ajv default export interoperability
const AjvClass = Ajv2020.default || Ajv2020;
const ajv = new AjvClass({ allErrors: true, strict: false });
const addFormatsFn =
  (addFormats as unknown as { default?: (a: unknown) => void }).default ||
  addFormats;
addFormatsFn(ajv);

const validateSchema = ajv.compile(catalogDeltaSchema);

export interface ValidateCatalogDeltaOptions {
  expectedBaseSnapshotId?: string;
  expectedBaseCatalogVersion?: string;
  expectedTargetSnapshotId?: string;
  expectedTargetCatalogVersion?: string;
}

function validateCollectionIds<T extends { id: string }>(
  collectionName: string,
  collectionDelta: CollectionDelta<T>,
  errors: string[]
): void {
  const upsertIds = new Set<string>();
  for (const item of collectionDelta.upsert || []) {
    if (upsertIds.has(item.id)) {
      errors.push(`[DUPLICATE_UPSERT_ID_REJECTED] ID '${item.id}' duplicado na lista upsert de ${collectionName}`);
    }
    upsertIds.add(item.id);
  }

  const removeIds = new Set<string>();
  for (const id of collectionDelta.removeIds || []) {
    if (removeIds.has(id)) {
      errors.push(`[DUPLICATE_REMOVE_ID_REJECTED] ID '${id}' duplicado na lista removeIds de ${collectionName}`);
    }
    removeIds.add(id);
    if (upsertIds.has(id)) {
      errors.push(
        `[UPSERT_AND_REMOVE_SAME_ID_REJECTED] ID '${id}' declarado simultaneamente em upsert e removeIds de ${collectionName}`
      );
    }
  }
}

export class CatalogDeltaValidator {
  validate(
    delta: unknown,
    options?: ValidateCatalogDeltaOptions
  ): CatalogDeltaValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!delta || typeof delta !== 'object') {
      return {
        valid: false,
        errors: ['[INVALID_CATALOG_DELTA] Objeto delta é nulo ou inválido'],
        warnings,
      };
    }

    // 1. JSON Schema validation
    const isSchemaValid = validateSchema(delta);
    if (!isSchemaValid) {
      for (const err of validateSchema.errors || []) {
        errors.push(
          `[CATALOG_DELTA_SCHEMA_ERROR] ${err.instancePath || '/'} ${err.message}`
        );
      }
      return { valid: false, errors, warnings };
    }

    const typedDelta = delta as CatalogDelta;

    // 2. Validação de ID duplication e conflito upsert/remove
    validateCollectionIds('categories', typedDelta.categories, errors);
    validateCollectionIds('genres', typedDelta.genres, errors);
    validateCollectionIds('movies', typedDelta.movies, errors);
    validateCollectionIds('series', typedDelta.series, errors);
    validateCollectionIds('seasons', typedDelta.seasons, errors);
    validateCollectionIds('episodes', typedDelta.episodes, errors);
    validateCollectionIds('streams', typedDelta.streams, errors);
    validateCollectionIds('artworks', typedDelta.artworks, errors);

    // 3. Validação de bindings com options
    if (options?.expectedBaseSnapshotId && typedDelta.baseSnapshotId !== options.expectedBaseSnapshotId) {
      errors.push(
        `[BASE_SNAPSHOT_MISMATCH] baseSnapshotId '${typedDelta.baseSnapshotId}' diverge do esperado '${options.expectedBaseSnapshotId}'`
      );
    }

    if (options?.expectedBaseCatalogVersion && typedDelta.baseCatalogVersion !== options.expectedBaseCatalogVersion) {
      errors.push(
        `[BASE_CATALOG_VERSION_MISMATCH] baseCatalogVersion '${typedDelta.baseCatalogVersion}' diverge do esperado '${options.expectedBaseCatalogVersion}'`
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
