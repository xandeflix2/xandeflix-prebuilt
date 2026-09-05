/**
 * Xandeflix Prebuilt — Snapshot Integrity Validator (Gate G10)
 *
 * Verificador profundo de integridade de snapshots persistidos (catalog, manifest, search index).
 *
 * Princípios:
 * - STARTUP_ACTIVE_VALIDATION = REQUIRED
 * - SEARCH RECOVERY: snapshot search-enabled só é válido se catalog + search index forem válidos conjuntamente.
 * - FAIL-CLOSED: Qualquer anomalia ou corrupção invalida o snapshot.
 */

import type { LocalCatalogStorage } from '../bootstrap/storage/storage.interface.ts';
import { validateNormalizedCatalog } from '../ingestion/validate.ts';
import { calculateSha256 } from '../provisioning/integrity.ts';
import { SearchIndexValidator } from '../search/search-index-validator.ts';
import type { SnapshotIntegrityResult } from './recovery.types.ts';

export class SnapshotIntegrityValidator {
  private searchValidator = new SearchIndexValidator();

  async validateSnapshot(
    storage: LocalCatalogStorage,
    snapshotId: string
  ): Promise<SnapshotIntegrityResult> {
    const errors: string[] = [];

    if (!storage.readSnapshot) {
      return {
        valid: false,
        snapshotId,
        hasSearchIndex: false,
        errors: ['Storage não implementa leitura de snapshots'],
      };
    }

    const data = await storage.readSnapshot(snapshotId);
    if (!data) {
      return {
        valid: false,
        snapshotId,
        hasSearchIndex: false,
        errors: [`Snapshot '${snapshotId}' não encontrado no storage permanente`],
      };
    }

    const { manifest, catalog, searchIndex } = data;

    // 1. Validação do Manifest
    if (!manifest || typeof manifest !== 'object') {
      errors.push(`Manifest ausente ou inválido no snapshot '${snapshotId}'`);
      return { valid: false, snapshotId, hasSearchIndex: false, errors };
    }

    if (manifest.snapshotId !== snapshotId) {
      errors.push(`Identificador no manifest ('${manifest.snapshotId}') diverge do diretório ('${snapshotId}')`);
    }

    // 2. Validação do Catálogo
    if (!catalog || typeof catalog !== 'object') {
      errors.push(`Catálogo ausente ou inválido no snapshot '${snapshotId}'`);
      return { valid: false, snapshotId, hasSearchIndex: false, errors };
    }

    const catalogValidation = validateNormalizedCatalog(catalog);
    if (!catalogValidation.valid) {
      for (const err of catalogValidation.errors) {
        errors.push(`[CATALOG_SCHEMA_INVALID] ${err}`);
      }
    }

    // Vínculo referencial
    if (catalog.metadata?.snapshotId !== manifest.snapshotId) {
      errors.push(`SnapshotId do catálogo ('${catalog.metadata?.snapshotId}') diverge do manifest ('${manifest.snapshotId}')`);
    }
    if (catalog.metadata?.catalogVersion !== manifest.catalogVersion) {
      errors.push(`CatalogVersion do catálogo ('${catalog.metadata?.catalogVersion}') diverge do manifest ('${manifest.catalogVersion}')`);
    }

    // Validação de hash do catálogo
    const catalogBuffer = Buffer.from(JSON.stringify(catalog, null, 2), 'utf8');
    const calculatedCatalogSha256 = calculateSha256(catalogBuffer);
    if (calculatedCatalogSha256 !== manifest.catalogSha256) {
      errors.push(`Hash SHA-256 recalculado do catálogo ('${calculatedCatalogSha256}') diverge do manifest ('${manifest.catalogSha256}')`);
    }

    // 3. Validação do Search Index (quando pacote v2 / search-enabled)
    const isSearchEnabled = 'searchIndexVersion' in manifest && Boolean(manifest.searchIndexVersion);

    if (isSearchEnabled) {
      if (!searchIndex) {
        errors.push(`Snapshot '${snapshotId}' é search-enabled mas não possui search-index.json íntegro`);
      } else {
        const searchValidation = this.searchValidator.validate(searchIndex, {
          expectedSnapshotId: snapshotId,
          expectedCatalogVersion: manifest.catalogVersion,
        });
        if (!searchValidation.valid) {
          for (const err of searchValidation.errors) {
            errors.push(`[SEARCH_INDEX_INVALID] ${err}`);
          }
        }

        // Vínculo referencial de snapshot
        if (searchIndex.catalogSnapshotId !== snapshotId) {
          errors.push(`catalogSnapshotId no search-index ('${searchIndex.catalogSnapshotId}') diverge do snapshot ('${snapshotId}')`);
        }

        // Validação de hash do índice de busca
        if (searchIndex.contentHash !== manifest.searchIndexContentHash) {
          errors.push(`Hash de conteúdo do índice de busca ('${searchIndex.contentHash}') diverge do manifest ('${manifest.searchIndexContentHash}')`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      snapshotId,
      catalogVersion: manifest?.catalogVersion,
      hasSearchIndex: Boolean(searchIndex),
      errors,
    };
  }
}
