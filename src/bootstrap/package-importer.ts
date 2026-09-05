/**
 * Xandeflix Prebuilt — Package Importer
 *
 * Mecanismo transacional, seguro e fail-closed de importação de pacote no dispositivo.
 *
 * Fases de Execução:
 * 1. PACKAGE_VALIDATION: Validação integral do pacote de entrada via PackageValidator (G4)
 * 2. IDEMPOTENCY_CHECK: Detecção de pacote idêntico já ativo (ALREADY_ACTIVE)
 * 3. STAGING_WRITE: Materialização isolada em staging/<snapshotId>/
 * 4. STAGING_READBACK_VALIDATION: Releitura e validação estrita da integridade de staging
 * 5. PROMOTION: Promoção segura do snapshot e gravação atômica do ActivePointer
 * 6. CLEANUP: Remoção dos resíduos da área de staging
 *
 * Garantias:
 * - ACTIVE_GENERATION_SAFETY = REQUIRED
 * - FAILED_IMPORT_PRESERVES_ACTIVE = SIM
 * - PARTIAL_STAGING_NOT_ACTIVE = PASS
 * - NO_FALSE_EMPTY_GUARD = PASS
 */

import { PackageValidator } from '../provisioning/package-validator.ts';
import { validateNormalizedCatalog } from '../ingestion/validate.ts';
import { calculateSha256 } from '../provisioning/integrity.ts';
import type { LocalCatalogStorage } from './storage/storage.interface.ts';
import { createActivePointer, isSameActiveGeneration } from './active-snapshot.ts';
import type { ImportPackageOptions, ImportResult, ImportMetrics } from './types.ts';
import { SearchIndexValidator } from '../search/search-index-validator.ts';

export class PackageImporter {
  private storage: LocalCatalogStorage;
  private validator = new PackageValidator();
  private searchIndexValidator = new SearchIndexValidator();

  constructor(storage: LocalCatalogStorage) {
    this.storage = storage;
  }

  async importPackage(
    packageSource: string | Buffer,
    options?: ImportPackageOptions
  ): Promise<ImportResult> {
    const totalStartTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    const metrics: ImportMetrics = {
      packageValidateMs: 0,
      stagingWriteMs: 0,
      stagingReadbackValidateMs: 0,
      promotionMs: 0,
      totalBootstrapMs: 0,
      packageSizeBytes: Buffer.isBuffer(packageSource)
        ? packageSource.length
        : 0,
      catalogSizeBytes: 0,
      activeStorageSizeBytes: 0,
    };

    // Lê o ponteiro anterior para garantir FAILED_IMPORT_PRESERVES_ACTIVE
    const previousPointer = await this.storage.readActivePointer();
    const previousSnapshotId = previousPointer?.snapshotId;

    // -------------------------------------------------------------
    // FASE 1: Validação do Pacote de Entrada (G4 / G7)
    // -------------------------------------------------------------
    const valStart = Date.now();
    const validationResult = await this.validator.validate(packageSource);
    metrics.packageValidateMs = Date.now() - valStart;

    if (!validationResult.valid || !validationResult.manifest || !validationResult.catalog) {
      for (const err of validationResult.errors) {
        errors.push(`[PACKAGE_IMPORT_VALIDATION_FAILED] ${err}`);
      }
      metrics.totalBootstrapMs = Date.now() - totalStartTime;
      return {
        success: false,
        status: 'REJECTED',
        previousSnapshotId,
        metrics,
        errors,
        warnings: validationResult.warnings,
      };
    }

    const { manifest, catalog, searchIndex } = validationResult;
    metrics.catalogSizeBytes = manifest.catalogSizeBytes;

    // -------------------------------------------------------------
    // FASE 2: Verificação de Idempotência
    // -------------------------------------------------------------
    if (!options?.forceReimport && isSameActiveGeneration(previousPointer, manifest)) {
      metrics.activeStorageSizeBytes = await this.storage.calculateActiveStorageSize();
      metrics.totalBootstrapMs = Date.now() - totalStartTime;
      return {
        success: true,
        status: 'ALREADY_ACTIVE',
        snapshotId: manifest.snapshotId,
        catalogVersion: manifest.catalogVersion,
        previousSnapshotId,
        metrics,
        errors: [],
        warnings: ['Pacote idêntico ao atualmente ativo detectado. Nenhuma modificação necessária.'],
      };
    }

    const targetSnapshotId = manifest.snapshotId;

    try {
      // -----------------------------------------------------------
      // FASE 3: Escrita em Staging
      // -----------------------------------------------------------
      const stageStart = Date.now();
      await this.storage.writeStaging(targetSnapshotId, manifest, catalog, searchIndex);
      metrics.stagingWriteMs = Date.now() - stageStart;

      // -----------------------------------------------------------
      // FASE 4: Validação de Releitura de Staging (Readback Validation)
      // -----------------------------------------------------------
      const readbackStart = Date.now();
      const stagingData = await this.storage.readStaging(targetSnapshotId);
      metrics.stagingReadbackValidateMs = Date.now() - readbackStart;

      if (!stagingData) {
        throw new Error('[STAGING_READBACK_MISSING] Falha ao reler snapshot recém-escrito na área de staging');
      }

      // 4.1 Validação de consistência do manifest
      if (
        stagingData.manifest.snapshotId !== manifest.snapshotId ||
        stagingData.manifest.catalogSha256 !== manifest.catalogSha256 ||
        stagingData.manifest.catalogSizeBytes !== manifest.catalogSizeBytes
      ) {
        throw new Error('[STAGING_READBACK_CORRUPTED] Metadados em staging divergem dos metadados originais');
      }

      // 4.2 Validação do catálogo contra o contrato de dados v1
      const contractCheck = validateNormalizedCatalog(stagingData.catalog);
      if (!contractCheck.valid) {
        throw new Error(
          `[STAGING_CONTRACT_VIOLATION] Catálogo em staging viola o contrato de dados: ${contractCheck.errors.join('; ')}`
        );
      }

      // 4.3 Verificação de hash do conteúdo do catálogo serializado
      const stagedCatalogBuffer = Buffer.from(JSON.stringify(stagingData.catalog, null, 2), 'utf8');
      const stagedSha = calculateSha256(stagedCatalogBuffer);
      if (stagedSha !== manifest.catalogSha256) {
        throw new Error('[STAGING_HASH_MISMATCH] Hash SHA-256 do catálogo em staging diverge do manifest');
      }

      // 4.4 Se pacote v2, validação de releitura do search-index
      if ('searchIndexFile' in manifest) {
        if (!stagingData.searchIndex) {
          throw new Error('[STAGING_SEARCH_INDEX_MISSING] search-index.json ausente em staging para pacote v2');
        }

        const indexValidation = this.searchIndexValidator.validate(stagingData.searchIndex, {
          expectedSnapshotId: manifest.snapshotId,
          expectedCatalogVersion: manifest.catalogVersion,
        });

        if (!indexValidation.valid) {
          throw new Error(
            `[STAGING_SEARCH_INDEX_CORRUPTED] search-index em staging é inválido: ${indexValidation.errors.join('; ')}`
          );
        }

        if (stagingData.searchIndex.contentHash !== manifest.searchIndexContentHash) {
          throw new Error(
            '[STAGING_SEARCH_INDEX_HASH_MISMATCH] contentHash do search-index em staging diverge do manifest'
          );
        }

        const stagedIndexBuffer = Buffer.from(JSON.stringify(stagingData.searchIndex, null, 2), 'utf8');
        const stagedIndexSha = calculateSha256(stagedIndexBuffer);
        if (stagedIndexSha !== manifest.searchIndexSha256) {
          throw new Error(
            '[STAGING_SEARCH_INDEX_SHA_MISMATCH] Hash SHA-256 do search-index em staging diverge do manifest'
          );
        }
      }

      // -----------------------------------------------------------
      // FASE 5: Promoção e Atualização Atômica do Active Pointer
      // -----------------------------------------------------------
      const promoStart = Date.now();
      await this.storage.promoteStaging(targetSnapshotId);

      const newPointer = createActivePointer(manifest);
      await this.storage.writeActivePointer(newPointer);

      if (this.storage.writeRecoveryJournal) {
        await this.storage.writeRecoveryJournal({
          journalFormatVersion: 1,
          activeSnapshotId: manifest.snapshotId,
          previousSnapshotId: previousSnapshotId || null,
          lastKnownGoodSnapshotId: manifest.snapshotId,
          updatedAt: new Date().toISOString(),
        });
      }

      metrics.promotionMs = Date.now() - promoStart;

      // -----------------------------------------------------------
      // FASE 6: Limpeza do Staging
      // -----------------------------------------------------------
      await this.storage.cleanupStaging(targetSnapshotId);

      metrics.activeStorageSizeBytes = await this.storage.calculateActiveStorageSize();
      metrics.totalBootstrapMs = Date.now() - totalStartTime;

      return {
        success: true,
        status: 'PROMOTED',
        snapshotId: manifest.snapshotId,
        catalogVersion: manifest.catalogVersion,
        previousSnapshotId,
        metrics,
        errors: [],
        warnings,
      };
    } catch (err) {
      // Em qualquer falha de staging, readback ou promoção:
      // FAILED_IMPORT_PRESERVES_ACTIVE = SIM
      errors.push(`[IMPORT_FAILED] ${(err as Error).message}`);

      try {
        await this.storage.cleanupStaging(targetSnapshotId);
      } catch {
        // Ignora erro de cleanup
      }

      metrics.totalBootstrapMs = Date.now() - totalStartTime;
      return {
        success: false,
        status: 'REJECTED',
        previousSnapshotId,
        metrics,
        errors,
        warnings,
      };
    }
  }
}
