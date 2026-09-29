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
import type {
  ActivePointer,
  ImportPackageOptions,
  ImportResult,
  ImportMetrics,
  PromoteStagedPackageOptions,
  StagingResult,
} from './types.ts';
import type { PrebuiltCatalog } from '../contracts/catalog.ts';
import type { PrebuiltSearchIndex } from '../search/search-index.types.ts';
import { SearchIndexValidator } from '../search/search-index-validator.ts';
import { validateLiveCatalog } from '../catalog/live/live-catalog-validation.ts';
import type { ProvisioningManifest, ProvisioningManifestV2 } from '../provisioning/types.ts';
import type { LiveCatalog } from '../catalog/live/live-tv.types.ts';
import { deserializeCompactIndexV2 } from '../experiments/search-compact-v2/compact-search-v2-serializer.ts';

function assertStagedLiveCatalog(
  manifest: ProvisioningManifest,
  liveCatalog: LiveCatalog | null | undefined,
): void {
  const isSegmented = Boolean((manifest as any).segments?.length || (manifest as any).counts?.live !== undefined);
  if (isSegmented) {
    if (liveCatalog) {
      const validation = validateLiveCatalog(liveCatalog, { expectedSnapshotId: manifest.snapshotId });
      if (!validation.valid) {
        throw new Error(`[STAGING_LIVE_CATALOG_INVALID] ${validation.errors.join('; ')}`);
      }
    }
    return;
  }

  const liveFile = 'liveCatalogFile' in manifest ? manifest.liveCatalogFile : undefined;
  if (liveFile) {
    const manifestV2 = manifest as ProvisioningManifestV2;
    if (!liveCatalog) {
      throw new Error('[STAGING_LIVE_CATALOG_MISSING] live_catalog.json ausente em staging para pacote v2');
    }
    const validation = validateLiveCatalog(liveCatalog, { expectedSnapshotId: manifest.snapshotId });
    if (!validation.valid) {
      throw new Error(`[STAGING_LIVE_CATALOG_INVALID] ${validation.errors.join('; ')}`);
    }
    const serialized = JSON.stringify(liveCatalog, null, 2);
    if (calculateSha256(serialized) !== manifestV2.liveCatalogSha256) {
      throw new Error('[STAGING_LIVE_CATALOG_HASH_MISMATCH] live_catalog em staging diverge do manifest');
    }
    if (Buffer.byteLength(serialized, 'utf8') !== manifestV2.liveCatalogSizeBytes) {
      throw new Error('[STAGING_LIVE_CATALOG_SIZE_MISMATCH] live_catalog em staging diverge do manifest');
    }
  } else if (liveCatalog) {
    throw new Error('[STAGING_LIVE_CATALOG_UNDECLARED] live_catalog inesperado em staging');
  }
}

function assertSegmentedPackageContentHash(manifest: ProvisioningManifest): void {
  const isSegmented = Array.isArray((manifest as any).segments) && (manifest as any).segments.length > 0;
  if (!isSegmented) return;

  const packageContentHash = (manifest as any).packageContentHash;
  if (typeof packageContentHash !== 'string' || !/^[0-9a-f]{64}$/i.test(packageContentHash)) {
    throw new Error('[SEGMENTED_PACKAGE_CONTENT_HASH_INVALID] Manifesto segmentado exige packageContentHash SHA-256 hexadecimal');
  }

  if (packageContentHash.toLowerCase() !== manifest.catalogSha256.toLowerCase()) {
    throw new Error('[SEGMENTED_PACKAGE_CONTENT_HASH_MISMATCH] packageContentHash segmentado diverge de catalogSha256');
  }
}

export class PackageImporter {
  private storage: LocalCatalogStorage;
  private validator = new PackageValidator();
  private searchIndexValidator = new SearchIndexValidator();

  constructor(storage: LocalCatalogStorage) {
    this.storage = storage;
  }

  /**
   * Valida e materializa um pacote somente em staging.
   *
   * Este caminho nunca promove o snapshot nem grava o active pointer. A
   * promoção fica disponível apenas por promoteStagedPackage().
   */
  async stagePackage(
    packageSource: string | Buffer | Uint8Array,
    options?: ImportPackageOptions
  ): Promise<StagingResult> {
    const totalStartTime = Date.now();
    const errors: string[] = [];
    const metrics: ImportMetrics = {
      packageValidateMs: 0,
      stagingWriteMs: 0,
      stagingReadbackValidateMs: 0,
      promotionMs: 0,
      totalBootstrapMs: 0,
      packageSizeBytes:
        (typeof Buffer !== 'undefined' && Buffer.isBuffer(packageSource)) || packageSource instanceof Uint8Array
          ? packageSource.length
          : 0,
      catalogSizeBytes: 0,
      activeStorageSizeBytes: 0,
    };

    const previousPointer = await this.storage.readActivePointer();
    const previousSnapshotId = previousPointer?.snapshotId;

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

    const { manifest, catalog, searchIndex, searchIndexBuffer, liveCatalog } = validationResult;
    const searchPayload = searchIndexBuffer || searchIndex;

    return this.stageValidatedArtifacts({
      manifest,
      catalog,
      searchPayload,
      liveCatalog,
      options,
      totalStartTime,
      previousPointer,
      previousSnapshotId,
      packageValidateMs: metrics.packageValidateMs,
      packageSizeBytes: metrics.packageSizeBytes,
      initialWarnings: validationResult.warnings,
    });
  }

  /**
   * Materializa artefatos diretamente na área de staging sem criar um arquivo ZIP intermediário.
   */
  async stageArtifacts(
    manifest: ProvisioningManifest,
    catalog: PrebuiltCatalog | string,
    searchPayload?: PrebuiltSearchIndex | Buffer | Uint8Array | null,
    liveCatalog?: LiveCatalog | null,
    options?: ImportPackageOptions,
    rawCatalogJson?: string
  ): Promise<StagingResult> {
    const totalStartTime = Date.now();
    const previousPointer = await this.storage.readActivePointer();
    const previousSnapshotId = previousPointer?.snapshotId;

    const catalogObj = typeof catalog === 'string' ? (JSON.parse(catalog) as PrebuiltCatalog) : catalog;
    const contractCheck = validateNormalizedCatalog(catalogObj);
    if (!contractCheck.valid) {
      return {
        success: false,
        status: 'REJECTED',
        previousSnapshotId,
        metrics: {
          packageValidateMs: 0,
          stagingWriteMs: 0,
          stagingReadbackValidateMs: 0,
          promotionMs: 0,
          totalBootstrapMs: Date.now() - totalStartTime,
          packageSizeBytes: 0,
          catalogSizeBytes: manifest.catalogSizeBytes,
          activeStorageSizeBytes: 0,
        },
        errors: contractCheck.errors.map((e) => `[ARTIFACT_VALIDATION_FAILED] ${e}`),
        warnings: [],
      };
    }

    if (liveCatalog) {
      const liveCheck = validateLiveCatalog(liveCatalog, { expectedSnapshotId: manifest.snapshotId });
      if (!liveCheck.valid) {
        return {
          success: false,
          status: 'REJECTED',
          previousSnapshotId,
          metrics: {
            packageValidateMs: 0,
            stagingWriteMs: 0,
            stagingReadbackValidateMs: 0,
            promotionMs: 0,
            totalBootstrapMs: Date.now() - totalStartTime,
            packageSizeBytes: 0,
            catalogSizeBytes: manifest.catalogSizeBytes,
            activeStorageSizeBytes: 0,
          },
          errors: liveCheck.errors.map((e) => `[ARTIFACT_VALIDATION_FAILED] ${e}`),
          warnings: [],
        };
      }
    }

    return this.stageValidatedArtifacts({
      manifest,
      catalog: rawCatalogJson || catalog,
      searchPayload,
      liveCatalog,
      options,
      totalStartTime,
      previousPointer,
      previousSnapshotId,
      packageValidateMs: 0,
      packageSizeBytes: 0,
      initialWarnings: [],
    });
  }

  private async stageValidatedArtifacts(params: {
    manifest: ProvisioningManifest;
    catalog: PrebuiltCatalog | string;
    searchPayload?: PrebuiltSearchIndex | Buffer | Uint8Array | null;
    liveCatalog?: LiveCatalog | null;
    options?: ImportPackageOptions;
    totalStartTime: number;
    previousPointer: ActivePointer | null;
    previousSnapshotId?: string;
    packageValidateMs: number;
    packageSizeBytes: number;
    initialWarnings: string[];
  }): Promise<StagingResult> {
    const {
      manifest,
      catalog,
      searchPayload,
      liveCatalog,
      options,
      totalStartTime,
      previousPointer,
      previousSnapshotId,
      packageValidateMs,
      packageSizeBytes,
      initialWarnings,
    } = params;

    const errors: string[] = [];
    const warnings: string[] = [...initialWarnings];
    const metrics: ImportMetrics = {
      packageValidateMs,
      stagingWriteMs: 0,
      stagingReadbackValidateMs: 0,
      promotionMs: 0,
      totalBootstrapMs: 0,
      packageSizeBytes,
      catalogSizeBytes: manifest.catalogSizeBytes,
      activeStorageSizeBytes: 0,
    };

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
      const stageStart = Date.now();
      await this.storage.writeStaging(targetSnapshotId, manifest, catalog, searchPayload, liveCatalog);
      metrics.stagingWriteMs = Date.now() - stageStart;

      const readbackStart = Date.now();
      const stagingData = await this.storage.readStaging(targetSnapshotId);
      metrics.stagingReadbackValidateMs = Date.now() - readbackStart;

      if (!stagingData) {
        throw new Error('[STAGING_READBACK_MISSING] Falha ao reler snapshot recém-escrito na área de staging');
      }

      if (
        stagingData.manifest.snapshotId !== manifest.snapshotId ||
        stagingData.manifest.catalogSha256 !== manifest.catalogSha256 ||
        stagingData.manifest.catalogSizeBytes !== manifest.catalogSizeBytes
      ) {
        throw new Error('[STAGING_READBACK_CORRUPTED] Metadados em staging divergem dos metadados originais');
      }

      const contractCheck = validateNormalizedCatalog(stagingData.catalog);
      if (!contractCheck.valid) {
        throw new Error(
          `[STAGING_CONTRACT_VIOLATION] Catálogo em staging viola o contrato de dados: ${contractCheck.errors.join('; ')}`
        );
      }

      const isSegmented = Boolean(
        (stagingData.manifest as any).segments?.length ||
        (stagingData.catalog as any)?.extensions?.isSegmented
      );

      if (isSegmented) {
        if (!Array.isArray((stagingData.manifest as any).segments)) {
          throw new Error('[STAGING_SEGMENTS_MISSING] Manifest segmentado não possui lista de segmentos');
        }
        assertSegmentedPackageContentHash(stagingData.manifest);
      } else {
        const stagedSha = stagingData.rawCatalogJson
          ? calculateSha256(stagingData.rawCatalogJson)
          : calculateSha256(JSON.stringify(stagingData.catalog, null, 2));
        if (stagedSha !== manifest.catalogSha256) {
          throw new Error('[STAGING_HASH_MISMATCH] Hash SHA-256 do catálogo em staging diverge do manifest');
        }
      }

      if ('searchIndexFile' in manifest) {
        const manifestV2 = manifest as ProvisioningManifestV2;
        if (manifestV2.searchIndexVersion === 2) {
          if (!stagingData.searchIndexBuffer) {
            throw new Error('[STAGING_SEARCH_INDEX_BUFFER_MISSING] compact-search-index-v2.bin ausente em staging para pacote v2');
          }

          const deserialized = deserializeCompactIndexV2(stagingData.searchIndexBuffer);
          if (deserialized.metadata.catalogSnapshotId !== manifest.snapshotId) {
            throw new Error('[STAGING_SEARCH_INDEX_SNAPSHOT_MISMATCH] catalogSnapshotId do índice V2 em staging diverge do manifest');
          }

          if (deserialized.metadata.contentHash !== manifestV2.searchIndexContentHash) {
            throw new Error('[STAGING_SEARCH_INDEX_HASH_MISMATCH] contentHash do search-index V2 em staging diverge do manifest');
          }

          const stagedIndexSha = calculateSha256(stagingData.searchIndexBuffer);
          if (stagedIndexSha !== manifestV2.searchIndexSha256) {
            throw new Error('[STAGING_SEARCH_INDEX_SHA_MISMATCH] search-index V2 em staging diverge do manifest');
          }
        } else {
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

          const stagedIndexSha = calculateSha256(JSON.stringify(stagingData.searchIndex, null, 2));
          if (stagedIndexSha !== manifest.searchIndexSha256) {
            throw new Error(
              '[STAGING_SEARCH_INDEX_SHA_MISMATCH] search-index em staging diverge do manifest'
            );
          }
        }
      }

      assertStagedLiveCatalog(manifest, stagingData.liveCatalog);

      metrics.totalBootstrapMs = Date.now() - totalStartTime;
      return {
        success: true,
        status: 'STAGED',
        snapshotId: manifest.snapshotId,
        catalogVersion: manifest.catalogVersion,
        previousSnapshotId,
        metrics,
        errors,
        warnings,
      };
    } catch (err) {
      errors.push(`[STAGING_FAILED] ${(err as Error).message}`);
      try {
        await this.storage.cleanupStaging(targetSnapshotId);
      } catch {
        // Ignora falha secundária de limpeza.
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

  /**
   * Promove explicitamente um pacote previamente materializado em staging.
   */
  async promoteStagedPackage(
    snapshotId: string,
    options?: PromoteStagedPackageOptions
  ): Promise<ImportResult> {
    const promotionStart = Date.now();
    const currentPointer = await this.storage.readActivePointer();
    const previousSnapshotId = currentPointer?.snapshotId;
    const metrics: ImportMetrics = {
      ...(options?.stagingMetrics || {
        packageValidateMs: 0,
        stagingWriteMs: 0,
        stagingReadbackValidateMs: 0,
        promotionMs: 0,
        totalBootstrapMs: 0,
        packageSizeBytes: 0,
        catalogSizeBytes: 0,
        activeStorageSizeBytes: 0,
      }),
    };

    if (
      options?.expectedPreviousSnapshotId !== undefined &&
      options.expectedPreviousSnapshotId !== previousSnapshotId
    ) {
      return {
        success: false,
        status: 'REJECTED',
        previousSnapshotId,
        metrics,
        errors: ['[PROMOTION_ACTIVE_POINTER_CHANGED] O ponteiro ativo mudou desde a criação do candidato'],
        warnings: [],
      };
    }

    const stagingData = await this.storage.readStaging(snapshotId);
    if (!stagingData || stagingData.manifest.snapshotId !== snapshotId) {
      return {
        success: false,
        status: 'REJECTED',
        previousSnapshotId,
        metrics,
        errors: ['[PROMOTION_STAGING_NOT_FOUND] Candidato de staging inexistente ou inconsistente'],
        warnings: [],
      };
    }

    try {
      assertSegmentedPackageContentHash(stagingData.manifest);
      await this.storage.promoteStaging(snapshotId);
      await this.storage.writeActivePointer(createActivePointer(stagingData.manifest));

      if (this.storage.writeRecoveryJournal) {
        await this.storage.writeRecoveryJournal({
          journalFormatVersion: 1,
          activeSnapshotId: stagingData.manifest.snapshotId,
          previousSnapshotId: previousSnapshotId || null,
          lastKnownGoodSnapshotId: stagingData.manifest.snapshotId,
          updatedAt: new Date().toISOString(),
        });
      }

      metrics.promotionMs = Date.now() - promotionStart;
      await this.storage.cleanupStaging(snapshotId);
      metrics.activeStorageSizeBytes = await this.storage.calculateActiveStorageSize();
      metrics.totalBootstrapMs = (options?.stagingMetrics?.totalBootstrapMs || 0) + metrics.promotionMs;

      return {
        success: true,
        status: 'PROMOTED',
        snapshotId,
        catalogVersion: stagingData.manifest.catalogVersion,
        previousSnapshotId,
        metrics,
        errors: [],
        warnings: [],
      };
    } catch (err) {
      try {
        await this.storage.cleanupStaging(snapshotId);
      } catch {
        // Ignora falha secundária de limpeza.
      }

      metrics.totalBootstrapMs = (options?.stagingMetrics?.totalBootstrapMs || 0) + (Date.now() - promotionStart);
      return {
        success: false,
        status: 'REJECTED',
        previousSnapshotId,
        metrics,
        errors: [`[PROMOTION_FAILED] ${(err as Error).message}`],
        warnings: [],
      };
    }
  }

  async importPackage(
    packageSource: string | Buffer | Uint8Array,
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
      packageSizeBytes:
        (typeof Buffer !== 'undefined' && Buffer.isBuffer(packageSource)) || packageSource instanceof Uint8Array
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

    const { manifest, catalog, searchIndex, liveCatalog } = validationResult;
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
      await this.storage.writeStaging(targetSnapshotId, manifest, catalog, searchIndex, liveCatalog);
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
      const isSegmented = Boolean(
        (stagingData.manifest as any).segments?.length ||
        (stagingData.catalog as any)?.extensions?.isSegmented
      );

      if (isSegmented) {
        if (!Array.isArray((stagingData.manifest as any).segments)) {
          throw new Error('[STAGING_SEGMENTS_MISSING] Manifest segmentado não possui lista de segmentos');
        }
      } else {
        const stagedSha = stagingData.rawCatalogJson
          ? calculateSha256(stagingData.rawCatalogJson)
          : calculateSha256(JSON.stringify(stagingData.catalog, null, 2));
        if (stagedSha !== manifest.catalogSha256) {
          throw new Error('[STAGING_HASH_MISMATCH] Hash SHA-256 do catálogo em staging diverge do manifest');
        }
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

        const stagedIndexSha = calculateSha256(JSON.stringify(stagingData.searchIndex, null, 2));
        if (stagedIndexSha !== manifest.searchIndexSha256) {
          throw new Error(
            '[STAGING_SEARCH_INDEX_SHA_MISMATCH] Hash SHA-256 do search-index em staging diverge do manifest'
          );
        }
      }

      // -----------------------------------------------------------
      // FASE 5: Promoção e Atualização Atômica do Active Pointer
      // -----------------------------------------------------------
      assertStagedLiveCatalog(manifest, stagingData.liveCatalog);

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

