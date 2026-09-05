/**
 * Xandeflix Prebuilt — Incremental Update Service (Gate G9)
 *
 * Ponto de entrada unificado para validação e aplicação transacional de atualizações incrementais.
 *
 * Garantias arquiteturais:
 * - ACTIVE_SNAPSHOT_IMMUTABLE_DURING_UPDATE = REQUIRED
 * - IN_PLACE_ACTIVE_PATCH = PROHIBITED
 * - DELTA_TRANSPORT = INCREMENTAL
 * - TARGET_STORAGE = FULL_CANONICAL_SNAPSHOT
 * - SEARCH_ENABLED_DELTA_ATOMICITY = CATALOG_AND_SEARCH_TOGETHER
 * - FAILED_UPDATE_PRESERVES_ACTIVE = PASS
 * - DELTA_REAPPLY_IDEMPOTENT = PASS
 * - OUT_OF_ORDER_DELTA_REJECTED = PASS
 * - NO_FALSE_EMPTY_DELTA_GUARD = PASS
 */

import type { LocalCatalogStorage } from '../bootstrap/storage/storage.interface.ts';
import { createActivePointer } from '../bootstrap/active-snapshot.ts';
import { validateNormalizedCatalog } from '../ingestion/validate.ts';
import { calculateSha256 } from '../provisioning/integrity.ts';
import { SearchIndexValidator } from '../search/search-index-validator.ts';
import { DeltaPackageValidator } from './delta-package-validator.ts';
import { CatalogDeltaApplier } from './catalog-delta-applier.ts';
import { SearchDeltaApplier } from './search-delta-applier.ts';
import type {
  DeltaManifest,
  DeltaCompatibilityCheck,
  IncrementalUpdateMetrics,
  IncrementalUpdateResult,
  UpdateState,
} from './update.types.ts';
import type { ProvisioningManifest, ProvisioningManifestV1, ProvisioningManifestV2 } from '../provisioning/types.ts';
import { calculatePackageContentHash } from '../provisioning/integrity.ts';

export class IncrementalUpdateService {
  private storage: LocalCatalogStorage;
  private deltaValidator = new DeltaPackageValidator();
  private catalogApplier = new CatalogDeltaApplier();
  private searchApplier = new SearchDeltaApplier();
  private searchIndexValidator = new SearchIndexValidator();
  private currentState: UpdateState = 'UPDATE_IDLE';

  constructor(storage: LocalCatalogStorage) {
    this.storage = storage;
  }

  getState(): UpdateState {
    return this.currentState;
  }

  /**
   * Verifica a compatibilidade preliminar de um DeltaManifest contra a geração atualmente ativa.
   */
  async checkCompatibility(manifest: DeltaManifest): Promise<DeltaCompatibilityCheck> {
    const activePointer = await this.storage.readActivePointer();
    if (!activePointer) {
      return {
        compatible: false,
        reason: 'BASE_MISMATCH',
        message: 'Nenhum catálogo ativo encontrado para aplicar delta incremental. Pacote completo requerido.',
        fullPackageRequired: true,
      };
    }

    // Idempotência
    if (
      activePointer.snapshotId === manifest.targetSnapshotId &&
      activePointer.catalogVersion === manifest.targetCatalogVersion
    ) {
      return {
        compatible: true,
        reason: 'ALREADY_ACTIVE',
        message: 'Snapshot target já é a geração ativa atual. Nenhuma modificação necessária.',
        fullPackageRequired: false,
      };
    }

    // Strict Base Binding
    if (
      activePointer.snapshotId !== manifest.baseSnapshotId ||
      activePointer.catalogVersion !== manifest.baseCatalogVersion
    ) {
      return {
        compatible: false,
        reason: 'BASE_MISMATCH',
        message: `Snapshot base ativo ('${activePointer.snapshotId}@${activePointer.catalogVersion}') diverge da base exigida pelo delta ('${manifest.baseSnapshotId}@${manifest.baseCatalogVersion}'). Pacote completo requerido.`,
        fullPackageRequired: true,
      };
    }

    const activeManifest = await this.storage.readActiveManifest();
    if (!activeManifest || activeManifest.catalogSha256 !== manifest.baseCatalogSha256) {
      return {
        compatible: false,
        reason: 'BASE_MISMATCH',
        message: 'Hash SHA-256 do catálogo ativo diverge do hash base exigido pelo delta. Pacote completo requerido.',
        fullPackageRequired: true,
      };
    }

    // Profile check
    const activeHasSearch = 'searchIndexFile' in activeManifest;
    if (activeHasSearch && manifest.targetPackageProfile === 'CATALOG_ONLY') {
      return {
        compatible: false,
        reason: 'PROFILE_MISMATCH',
        message: 'Base ativa possui busca mas o delta é catalog-only. Pacote completo requerido.',
        fullPackageRequired: true,
      };
    }
    if (!activeHasSearch && manifest.targetPackageProfile === 'SEARCH_ENABLED') {
      return {
        compatible: false,
        reason: 'PROFILE_MISMATCH',
        message: 'Base ativa não possui busca mas o delta exige search-enabled. Pacote completo requerido.',
        fullPackageRequired: true,
      };
    }

    return {
      compatible: true,
      message: 'Delta compatível com a geração ativa.',
      fullPackageRequired: false,
    };
  }

  /**
   * Executa a aplicação transacional e atômica de um pacote delta ZIP.
   */
  async applyDelta(packageSource: string | Buffer): Promise<IncrementalUpdateResult> {
    const totalStartTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    const metrics: IncrementalUpdateMetrics = {
      deltaValidateMs: 0,
      catalogDeltaApplyMs: 0,
      searchDeltaApplyMs: 0,
      targetCatalogValidateMs: 0,
      targetSearchValidateMs: 0,
      stagingWriteMs: 0,
      stagingReadbackMs: 0,
      promotionMs: 0,
      totalUpdateMs: 0,
      deltaPackageSizeBytes: Buffer.isBuffer(packageSource) ? packageSource.length : 0,
    };

    const previousPointer = await this.storage.readActivePointer();
    const previousSnapshotId = previousPointer?.snapshotId;

    if (!previousPointer) {
      this.currentState = 'FULL_PACKAGE_REQUIRED';
      metrics.totalUpdateMs = Date.now() - totalStartTime;
      return {
        success: false,
        state: 'FULL_PACKAGE_REQUIRED',
        metrics,
        errors: ['[NO_ACTIVE_CATALOG] Nenhum catálogo ativo encontrado para aplicar delta incremental. Pacote completo obrigatório.'],
        warnings,
      };
    }

    // -------------------------------------------------------------
    // FASE 1: Validação do Pacote Delta
    // -------------------------------------------------------------
    this.currentState = 'UPDATE_VALIDATING_DELTA';
    const valStart = Date.now();
    const valResult = await this.deltaValidator.validate(packageSource);
    metrics.deltaValidateMs = Date.now() - valStart;

    if (!valResult.valid || !valResult.manifest || !valResult.catalogDelta) {
      this.currentState = 'UPDATE_FAILED_ACTIVE_PRESERVED';
      metrics.totalUpdateMs = Date.now() - totalStartTime;
      return {
        success: false,
        state: 'UPDATE_FAILED_ACTIVE_PRESERVED',
        previousSnapshotId,
        metrics,
        errors: valResult.errors.map(err => `[DELTA_VALIDATION_FAILED] ${err}`),
        warnings: valResult.warnings,
      };
    }

    const { manifest, catalogDelta, searchDelta } = valResult;

    // -------------------------------------------------------------
    // FASE 2: Verificação de Idempotência
    // -------------------------------------------------------------
    if (
      previousPointer.snapshotId === manifest.targetSnapshotId &&
      previousPointer.catalogVersion === manifest.targetCatalogVersion
    ) {
      this.currentState = 'UPDATE_SUCCESS';
      metrics.totalUpdateMs = Date.now() - totalStartTime;
      return {
        success: true,
        state: 'UPDATE_SUCCESS',
        snapshotId: manifest.targetSnapshotId,
        catalogVersion: manifest.targetCatalogVersion,
        previousSnapshotId,
        metrics,
        errors: [],
        warnings: ['[SAME_DELTA_REAPPLY] Delta já aplicado anteriormente. Geração ativa inalterada.'],
      };
    }

    // -------------------------------------------------------------
    // FASE 3: Verificação Estrita de Binding Base (STRICT_BASE_BINDING)
    // -------------------------------------------------------------
    if (
      previousPointer.snapshotId !== manifest.baseSnapshotId ||
      previousPointer.catalogVersion !== manifest.baseCatalogVersion
    ) {
      this.currentState = 'FULL_PACKAGE_REQUIRED';
      metrics.totalUpdateMs = Date.now() - totalStartTime;
      return {
        success: false,
        state: 'FULL_PACKAGE_REQUIRED',
        previousSnapshotId,
        metrics,
        errors: [
          `[BASE_MISMATCH] Snapshot base ativo ('${previousPointer.snapshotId}@${previousPointer.catalogVersion}') ` +
          `diverge da base do delta ('${manifest.baseSnapshotId}@${manifest.baseCatalogVersion}'). Pacote completo obrigatório.`,
        ],
        warnings,
      };
    }

    const activeManifest = await this.storage.readActiveManifest();
    const activeCatalog = await this.storage.readActiveCatalog();

    if (!activeManifest || !activeCatalog) {
      this.currentState = 'FULL_PACKAGE_REQUIRED';
      metrics.totalUpdateMs = Date.now() - totalStartTime;
      return {
        success: false,
        state: 'FULL_PACKAGE_REQUIRED',
        previousSnapshotId,
        metrics,
        errors: ['[CORRUPT_ACTIVE_BASE] Manifesto ou catálogo ativo não pôde ser lido. Pacote completo obrigatório.'],
        warnings,
      };
    }

    if (activeManifest.catalogSha256 !== manifest.baseCatalogSha256) {
      this.currentState = 'FULL_PACKAGE_REQUIRED';
      metrics.totalUpdateMs = Date.now() - totalStartTime;
      return {
        success: false,
        state: 'FULL_PACKAGE_REQUIRED',
        previousSnapshotId,
        metrics,
        errors: [
          `[BASE_CATALOG_HASH_MISMATCH_REJECTED] Hash do catálogo ativo ('${activeManifest.catalogSha256}') ` +
          `diverge de baseCatalogSha256 ('${manifest.baseCatalogSha256}'). Pacote completo obrigatório.`,
        ],
        warnings,
      };
    }

    // 3.1 Verificação de perfil cruzado (CROSS_PROFILE_DELTA)
    const activeHasSearch = 'searchIndexFile' in activeManifest;
    if (activeHasSearch && manifest.targetPackageProfile === 'CATALOG_ONLY') {
      this.currentState = 'FULL_PACKAGE_REQUIRED';
      metrics.totalUpdateMs = Date.now() - totalStartTime;
      return {
        success: false,
        state: 'FULL_PACKAGE_REQUIRED',
        previousSnapshotId,
        metrics,
        errors: ['[CROSS_PROFILE_DELTA] Tentativa de transição search-enabled -> catalog-only via delta rejeitada. Pacote completo obrigatório.'],
        warnings,
      };
    }
    if (!activeHasSearch && manifest.targetPackageProfile === 'SEARCH_ENABLED') {
      this.currentState = 'FULL_PACKAGE_REQUIRED';
      metrics.totalUpdateMs = Date.now() - totalStartTime;
      return {
        success: false,
        state: 'FULL_PACKAGE_REQUIRED',
        previousSnapshotId,
        metrics,
        errors: ['[CROSS_PROFILE_DELTA] Tentativa de transição catalog-only -> search-enabled via delta rejeitada. Pacote completo obrigatório.'],
        warnings,
      };
    }

    // 3.2 Verificação de base do search-index se search-enabled
    let activeSearchIndex = null;
    if (manifest.targetPackageProfile === 'SEARCH_ENABLED') {
      activeSearchIndex = await this.storage.readActiveSearchIndex();
      if (!activeSearchIndex) {
        this.currentState = 'FULL_PACKAGE_REQUIRED';
        metrics.totalUpdateMs = Date.now() - totalStartTime;
        return {
          success: false,
          state: 'FULL_PACKAGE_REQUIRED',
          previousSnapshotId,
          metrics,
          errors: ['[SEARCH_BASE_MISSING] Índice de busca ativo não encontrado. Pacote completo obrigatório.'],
          warnings,
        };
      }
      if (activeSearchIndex.contentHash !== manifest.baseSearchIndexContentHash) {
        this.currentState = 'FULL_PACKAGE_REQUIRED';
        metrics.totalUpdateMs = Date.now() - totalStartTime;
        return {
          success: false,
          state: 'FULL_PACKAGE_REQUIRED',
          previousSnapshotId,
          metrics,
          errors: [
            `[SEARCH_BASE_HASH_MISMATCH_REJECTED] contentHash do índice ativo ('${activeSearchIndex.contentHash}') ` +
            `diverge de baseSearchIndexContentHash ('${manifest.baseSearchIndexContentHash}'). Pacote completo obrigatório.`,
          ],
          warnings,
        };
      }
    }

    // 3.3 Verificação de Downgrade (DELTA_DOWNGRADE = REJECT)
    if (manifest.targetCatalogVersion < manifest.baseCatalogVersion) {
      this.currentState = 'UPDATE_FAILED_ACTIVE_PRESERVED';
      metrics.totalUpdateMs = Date.now() - totalStartTime;
      return {
        success: false,
        state: 'UPDATE_FAILED_ACTIVE_PRESERVED',
        previousSnapshotId,
        metrics,
        errors: [
          `[DELTA_DOWNGRADE_REJECTED] Versão target ('${manifest.targetCatalogVersion}') é inferior à versão base ('${manifest.baseCatalogVersion}').`,
        ],
        warnings,
      };
    }

    const targetSnapshotId = manifest.targetSnapshotId;

    try {
      // -----------------------------------------------------------
      // FASE 4: Aplicação do CatalogDelta em Memória
      // -----------------------------------------------------------
      this.currentState = 'UPDATE_APPLYING';
      const catApplyStart = Date.now();
      const targetCatalog = this.catalogApplier.apply(activeCatalog, catalogDelta);
      metrics.catalogDeltaApplyMs = Date.now() - catApplyStart;

      // 4.1 Validação do catálogo target resultante contra contrato de dados G2
      const targetCatValStart = Date.now();
      const contractCheck = validateNormalizedCatalog(targetCatalog);
      metrics.targetCatalogValidateMs = Date.now() - targetCatValStart;

      if (!contractCheck.valid) {
        throw new Error(
          `[BROKEN_TARGET_REF_REJECTED] Catálogo target reconstruído viola o contrato de dados: ${contractCheck.errors.join('; ')}`
        );
      }

      // 4.2 Verificação de hash SHA-256 do catálogo target
      const targetCatBuffer = Buffer.from(JSON.stringify(targetCatalog, null, 2), 'utf8');
      const computedTargetCatSha = calculateSha256(targetCatBuffer);
      if (computedTargetCatSha !== manifest.targetCatalogSha256) {
        throw new Error(
          `[TARGET_CATALOG_HASH_MISMATCH_REJECTED] Hash calculado do catálogo target ('${computedTargetCatSha}') ` +
          `diverge do targetCatalogSha256 declarado no manifest ('${manifest.targetCatalogSha256}')`
        );
      }

      // -----------------------------------------------------------
      // FASE 5: Aplicação do SearchIndexDelta (quando SEARCH_ENABLED)
      // -----------------------------------------------------------
      let targetSearchIndex = null;
      let targetSearchSha256: string | undefined;
      let targetSearchSizeBytes: number | undefined;

      if (manifest.targetPackageProfile === 'SEARCH_ENABLED' && searchDelta && activeSearchIndex) {
        const searchApplyStart = Date.now();
        targetSearchIndex = this.searchApplier.apply(activeSearchIndex, searchDelta);
        metrics.searchDeltaApplyMs = Date.now() - searchApplyStart;

        // 5.1 Validação estrita do índice target reconstruído
        const targetSearchValStart = Date.now();
        const searchValResult = this.searchIndexValidator.validate(targetSearchIndex, {
          expectedSnapshotId: manifest.targetSnapshotId,
          expectedCatalogVersion: manifest.targetCatalogVersion,
        });
        metrics.targetSearchValidateMs = Date.now() - targetSearchValStart;

        if (!searchValResult.valid) {
          throw new Error(
            `[TARGET_SEARCH_INDEX_CORRUPTED] Índice de busca target reconstruído é inválido: ${searchValResult.errors.join('; ')}`
          );
        }

        // 5.2 Verificação de hash SHA-256 do search index target
        const targetSearchBuffer = Buffer.from(JSON.stringify(targetSearchIndex, null, 2), 'utf8');
        targetSearchSizeBytes = targetSearchBuffer.length;
        targetSearchSha256 = calculateSha256(targetSearchBuffer);

        if (manifest.targetSearchIndexSha256 && targetSearchSha256 !== manifest.targetSearchIndexSha256) {
          throw new Error(
            `[TARGET_SEARCH_HASH_MISMATCH_REJECTED] Hash SHA-256 do índice target ('${targetSearchSha256}') ` +
            `diverge do targetSearchIndexSha256 do manifest ('${manifest.targetSearchIndexSha256}')`
          );
        }
      }

      // -----------------------------------------------------------
      // FASE 6: Materialização em Staging (STAGING_THEN_PROMOTION)
      // -----------------------------------------------------------
      this.currentState = 'UPDATE_STAGING';
      const stageStart = Date.now();

      // Monta manifesto canônico do snapshot target (v1 ou v2)
      let targetManifest: ProvisioningManifest;
      if (manifest.targetPackageProfile === 'SEARCH_ENABLED' && targetSearchIndex) {
        const v2Manifest: ProvisioningManifestV2 = {
          packageFormatVersion: 2,
          schemaVersion: 1,
          catalogVersion: manifest.targetCatalogVersion,
          snapshotId: manifest.targetSnapshotId,
          createdAt: manifest.generatedAt,
          catalogFile: 'catalog.json',
          catalogSha256: computedTargetCatSha,
          catalogSizeBytes: targetCatBuffer.length,
          searchIndexFile: 'search-index.json',
          searchIndexVersion: 1,
          searchIndexSha256: targetSearchSha256!,
          searchIndexSizeBytes: targetSearchSizeBytes!,
          searchIndexContentHash: targetSearchIndex.contentHash,
          packageContentHash: calculatePackageContentHash({
            packageFormatVersion: 2,
            schemaVersion: 1,
            catalogVersion: manifest.targetCatalogVersion,
            snapshotId: manifest.targetSnapshotId,
            catalogFile: 'catalog.json',
            catalogSha256: computedTargetCatSha,
            catalogSizeBytes: targetCatBuffer.length,
            compression: 'DEFLATE',
            searchIndexFile: 'search-index.json',
            searchIndexVersion: 1,
            searchIndexSha256: targetSearchSha256,
            searchIndexSizeBytes: targetSearchSizeBytes,
            searchIndexContentHash: targetSearchIndex.contentHash,
          }),
          generator: manifest.generator,
          compression: 'DEFLATE',
        };
        targetManifest = v2Manifest;
      } else {
        const v1Manifest: ProvisioningManifestV1 = {
          packageFormatVersion: 1,
          schemaVersion: 1,
          catalogVersion: manifest.targetCatalogVersion,
          snapshotId: manifest.targetSnapshotId,
          createdAt: manifest.generatedAt,
          catalogFile: 'catalog.json',
          catalogSha256: computedTargetCatSha,
          catalogSizeBytes: targetCatBuffer.length,
          packageContentHash: calculatePackageContentHash({
            packageFormatVersion: 1,
            schemaVersion: 1,
            catalogVersion: manifest.targetCatalogVersion,
            snapshotId: manifest.targetSnapshotId,
            catalogFile: 'catalog.json',
            catalogSha256: computedTargetCatSha,
            catalogSizeBytes: targetCatBuffer.length,
            compression: 'DEFLATE',
          }),
          generator: manifest.generator,
          compression: 'DEFLATE',
        };
        targetManifest = v1Manifest;
      }

      await this.storage.writeStaging(targetSnapshotId, targetManifest, targetCatalog, targetSearchIndex);
      metrics.stagingWriteMs = Date.now() - stageStart;

      // -----------------------------------------------------------
      // FASE 7: Validação de Releitura de Staging (Readback Validation)
      // -----------------------------------------------------------
      this.currentState = 'UPDATE_VALIDATING_TARGET';
      const readbackStart = Date.now();
      const stagingData = await this.storage.readStaging(targetSnapshotId);
      metrics.stagingReadbackMs = Date.now() - readbackStart;

      if (!stagingData) {
        throw new Error('[STAGING_READBACK_FAILURE] Snapshot de staging não pôde ser relido');
      }

      if (
        stagingData.manifest.snapshotId !== targetManifest.snapshotId ||
        stagingData.manifest.catalogSha256 !== targetManifest.catalogSha256
      ) {
        throw new Error('[STAGING_READBACK_CORRUPTED] Metadados em staging divergem do target esperado');
      }

      const stagedCatBuffer = Buffer.from(JSON.stringify(stagingData.catalog, null, 2), 'utf8');
      if (calculateSha256(stagedCatBuffer) !== targetManifest.catalogSha256) {
        throw new Error('[STAGING_READBACK_HASH_MISMATCH] Hash do catálogo em staging diverge do manifesto');
      }

      if (manifest.targetPackageProfile === 'SEARCH_ENABLED') {
        if (!stagingData.searchIndex) {
          throw new Error('[STAGING_READBACK_SEARCH_MISSING] search-index.json ausente em staging');
        }
        if (stagingData.searchIndex.contentHash !== (targetManifest as ProvisioningManifestV2).searchIndexContentHash) {
          throw new Error('[STAGING_READBACK_SEARCH_HASH_MISMATCH] contentHash do search-index em staging diverge do target');
        }
      }

      // -----------------------------------------------------------
      // FASE 8: Promoção Atômica (ATOMIC_PROMOTION)
      // -----------------------------------------------------------
      this.currentState = 'UPDATE_PROMOTING';
      const promoStart = Date.now();
      await this.storage.promoteStaging(targetSnapshotId);

      const newPointer = createActivePointer(targetManifest);
      await this.storage.writeActivePointer(newPointer);
      metrics.promotionMs = Date.now() - promoStart;

      // -----------------------------------------------------------
      // FASE 9: Limpeza do Staging
      // -----------------------------------------------------------
      await this.storage.cleanupStaging(targetSnapshotId);

      this.currentState = 'UPDATE_SUCCESS';
      metrics.totalUpdateMs = Date.now() - totalStartTime;

      return {
        success: true,
        state: 'UPDATE_SUCCESS',
        snapshotId: manifest.targetSnapshotId,
        catalogVersion: manifest.targetCatalogVersion,
        previousSnapshotId,
        metrics,
        errors: [],
        warnings,
      };
    } catch (err) {
      // FAILED_UPDATE_PRESERVES_ACTIVE = PASS
      this.currentState = 'UPDATE_FAILED_ACTIVE_PRESERVED';
      errors.push(`[UPDATE_FAILED] ${(err as Error).message}`);

      try {
        await this.storage.cleanupStaging(targetSnapshotId);
      } catch {
        // Ignora falha de limpeza
      }

      metrics.totalUpdateMs = Date.now() - totalStartTime;
      return {
        success: false,
        state: 'UPDATE_FAILED_ACTIVE_PRESERVED',
        previousSnapshotId,
        metrics,
        errors,
        warnings,
      };
    }
  }
}
