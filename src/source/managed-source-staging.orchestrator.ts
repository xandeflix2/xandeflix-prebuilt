/**
 * R2F8L — orquestração Managed para fetch e materialização somente em staging.
 *
 * A configuração real atravessa apenas a memória entre o secure store e o
 * importador. O resultado público deste módulo contém somente metadata e
 * métricas sanitizadas. A promoção continua fora desta rota.
 */

import { AuthorizedSourceResolver, type ResolvedSourceResult } from '../control-plane/client/authorized-source-resolver.ts';
import { BootstrapService } from '../bootstrap/bootstrap.service.ts';
import { getClientBootstrapService } from '../bootstrap/client.ts';
import { LocalSecureSourceStore, type LocalSecureSourceRecord } from '../security/local-secure-source-store.ts';
import { PackageBuilder } from '../provisioning/package-builder.ts';
import { createManifest } from '../provisioning/manifest.ts';
import { calculateArtifactDigest } from '../security/artifact-hash.ts';
import {
  RealSourceImporterService,
  type RealImportResult,
  type RealImportErrorStage,
  type RealSourceImportOptions,
} from './real-source-importer.service.ts';
import type { SourceRuntimeConfig } from '../debug/source/source-runtime-config.ts';
import {
  createSanitizedTransportFailureObservation,
  type SanitizedTransportObservation,
} from './device-direct-fetch.ts';
import type { SegmentedCatalogProvenance } from '../bootstrap/storage/storage.interface.ts';

export const MANAGED_FETCH_TO_STAGING_LOCK_ID = 'MANAGED_FETCH_TO_STAGING_LOCK_V1';
export const SEGMENTED_STAGING_RESULT_USED = true;
export const SECOND_MANIFEST_CREATED = false;
export const SECOND_STAGEARTIFACTS_CALL = false;
export const DOUBLE_STAGING_REMOVED = true;

// TEMPORARY C11 pre-import diagnostic; remove after master adjudication.
const TEMPORARY_SUPPRESS_CATALOG_IMPORT_AT_PRE_IMPORT_BOUNDARY = false;

export type ManagedStagingErrorCode =
  | 'SOURCE_MODE_NOT_MANAGED'
  | 'SOURCE_AUTHORITY_NOT_READY'
  | 'SOURCE_CONFIG_NOT_FOUND'
  | 'SOURCE_CONFIG_MISMATCH'
  | 'SOURCE_CONFIG_INVALID'
  | 'REAL_SOURCE_FETCH_FAILED'
  | 'SOURCE_PROCESSING_FAILED'
  | 'PACKAGE_BUILD_FAILED'
  | 'STAGING_FAILED'
  | 'CATALOG_IMPORT_SUPPRESSED_DIAGNOSTIC';

export interface ManagedStagingResult {
  success: boolean;
  status: 'STAGED' | 'ALREADY_ACTIVE' | 'REJECTED';
  errorCode?: ManagedStagingErrorCode;
  errorStage?: RealImportErrorStage;
  sanitizedErrorClass?: 'SOURCE_FETCH_FAILED' | 'SOURCE_PROCESSING_FAILED' | 'STAGING_FAILED';
  sourceId?: string;
  sourceVersion?: number;
  protocol?: 'M3U' | 'XTREAM';
  snapshotId?: string;
  previousSnapshotId?: string;
  rawItemCount: number;
  movieCount: number;
  seriesCount: number;
  liveCount: number;
  unresolvedCount: number;
  sourcePayloadSizeBytes?: number;
  transport?: SanitizedTransportObservation;
}

type SecureSourceStore = Pick<LocalSecureSourceStore, 'get'>;
type SourceImporter = Pick<typeof RealSourceImporterService, 'importM3u' | 'importXtream'>;
type ManagedAuthorityResolver = () => Promise<ResolvedSourceResult>;
type CatalogPackageBuilder = Pick<PackageBuilder, 'build'>;
type StagingBootstrap = Pick<BootstrapService, 'stagePackage'> & Partial<Pick<BootstrapService, 'stageArtifacts' | 'getStorage' | 'getActivePointer'>>;

import { installWebViewBufferCompatibility } from '../debug/webview-buffer-compatibility.ts';

installWebViewBufferCompatibility();

export interface ManagedSourceStagingOrchestratorOptions {
  resolveAuthorization?: ManagedAuthorityResolver;
  secureSourceStore?: SecureSourceStore;
  importer?: SourceImporter;
  packageBuilder?: CatalogPackageBuilder;
  bootstrapService?: StagingBootstrap;
  allowSelfServiceBoundSource?: boolean;
}

function emptyResult(): ManagedStagingResult {
  return {
    success: false,
    status: 'REJECTED',
    rawItemCount: 0,
    movieCount: 0,
    seriesCount: 0,
    liveCount: 0,
    unresolvedCount: 0,
  };
}

function isManagedAuthorityReady(authority: ResolvedSourceResult, allowSelfService = false): boolean {
  const isModeAllowed = authority.mode === 'MANAGED' || (allowSelfService && authority.mode === 'SELF_SERVICE');
  return (
    isModeAllowed &&
    (authority.status === 'SOURCE_READY' || authority.remoteResultCode === 'SOURCE_READY') &&
    authority.sourceStatus === 'ACTIVE' &&
    typeof authority.sourceId === 'string' &&
    authority.sourceId.length > 0 &&
    Number.isSafeInteger(authority.sourceVersion) &&
    (authority.protocol === 'M3U' || authority.protocol === 'XTREAM')
  );
}

function toRuntimeConfig(record: LocalSecureSourceRecord): SourceRuntimeConfig | undefined {
  if (record.protocol === 'M3U') {
    return typeof record.sourceConfig.playlistUrl === 'string' && record.sourceConfig.playlistUrl.trim()
      ? { type: 'M3U', playlistUrl: record.sourceConfig.playlistUrl }
      : undefined;
  }

  const { endpoint, username, password } = record.sourceConfig;
  if (
    typeof endpoint !== 'string' || !endpoint.trim() ||
    typeof username !== 'string' || !username.trim() ||
    typeof password !== 'string' || !password.trim()
  ) {
    return undefined;
  }

  return { type: 'XTREAM', host: endpoint, username, password };
}

function toTransientRequestOptions(
  record: LocalSecureSourceRecord,
  provenance?: SegmentedCatalogProvenance,
  storage?: import('../bootstrap/storage/storage.interface.ts').LocalCatalogStorage,
): RealSourceImportOptions {
  const token = record.sourceConfig.token?.trim();
  return {
    sourceId: provenance?.sourceId,
    provenance,
    storage,
    persistLiveCatalog: false,
    ...(token ? { requestHeaders: { Authorization: `Bearer ${token}` } } : {}),
  };
}

function applyImportMetrics(result: ManagedStagingResult, imported: RealImportResult): void {
  const metrics = imported.metrics;
  if (!metrics) return;
  result.rawItemCount = metrics.rawItemCount;
  result.movieCount = metrics.canonicalMovieCount;
  result.seriesCount = metrics.canonicalSeriesCount;
  result.liveCount = metrics.canonicalLiveChannelCount;
  result.unresolvedCount = metrics.rawUnresolvedCount ?? Math.max(0, result.rawItemCount - result.movieCount - result.seriesCount - result.liveCount);
}

export class ManagedSourceStagingOrchestrator {
  private readonly resolveAuthorization: ManagedAuthorityResolver;
  private readonly secureSourceStore: SecureSourceStore;
  private readonly importer: SourceImporter;
  private readonly packageBuilder: CatalogPackageBuilder;
  private readonly bootstrapService: StagingBootstrap;
  private readonly allowSelfServiceBoundSource: boolean;
  private preImportDiagnosticSuppressionConsumed = false;

  constructor(options?: ManagedSourceStagingOrchestratorOptions) {
    this.resolveAuthorization = options?.resolveAuthorization || (() => AuthorizedSourceResolver.resolve());
    this.secureSourceStore = options?.secureSourceStore || new LocalSecureSourceStore();
    this.importer = options?.importer || RealSourceImporterService;
    this.packageBuilder = options?.packageBuilder || new PackageBuilder();
    this.bootstrapService = options?.bootstrapService || getClientBootstrapService();
    this.allowSelfServiceBoundSource = Boolean(options?.allowSelfServiceBoundSource);
  }

  /**
   * Resolve a autoridade Managed, lê o registro seguro, importa e materializa
   * o pacote em staging. Esta função não possui caminho de promoção.
   */
  async stageManagedSource(): Promise<ManagedStagingResult> {
    const result = emptyResult();
    let authority: ResolvedSourceResult;

    console.info('REMOTE_AUTHORITY_STARTED_DIAGNOSTIC');
    console.info('SOURCE_RESOLUTION_STARTED_DIAGNOSTIC');
    try {
      authority = await this.resolveAuthorization();
      console.info('REMOTE_AUTHORITY_COMPLETED_DIAGNOSTIC');
      console.info(
        `REMOTE_AUTHORITY_RESULT_DIAGNOSTIC status=${authority.status} code=${authority.remoteResultCode || authority.status} authorityAvailable=${authority.remoteAuthorityAvailable === true}`,
      );
      console.info('SOURCE_RESOLUTION_COMPLETED_DIAGNOSTIC');
    } catch {
      console.info('REMOTE_AUTHORITY_COMPLETED_DIAGNOSTIC', { result: 'UNAVAILABLE' });
      console.info('SOURCE_RESOLUTION_COMPLETED_DIAGNOSTIC', { result: 'UNAVAILABLE' });
      result.errorCode = 'SOURCE_AUTHORITY_NOT_READY';
      return result;
    }

    result.sourceId = authority.sourceId;
    result.sourceVersion = authority.sourceVersion;
    result.protocol = authority.protocol;

    const isModeAllowed =
      authority.mode === 'MANAGED' ||
      (this.allowSelfServiceBoundSource && authority.mode === 'SELF_SERVICE');
    if (!isModeAllowed) {
      result.errorCode = 'SOURCE_MODE_NOT_MANAGED';
      return result;
    }
    if (!isManagedAuthorityReady(authority, this.allowSelfServiceBoundSource)) {
      result.errorCode = 'SOURCE_AUTHORITY_NOT_READY';
      return result;
    }
    console.info('SOURCE_READY_REACHED_DIAGNOSTIC');

    let record: LocalSecureSourceRecord | undefined;
    try {
      record = await this.secureSourceStore.get(authority.sourceId!);
    } catch {
      result.errorCode = 'SOURCE_CONFIG_NOT_FOUND';
      return result;
    }

    if (!record) {
      result.errorCode = 'SOURCE_CONFIG_NOT_FOUND';
      return result;
    }
    if (
      record.sourceId !== authority.sourceId ||
      record.sourceVersion !== authority.sourceVersion ||
      record.protocol !== authority.protocol
    ) {
      result.errorCode = 'SOURCE_CONFIG_MISMATCH';
      return result;
    }

    const runtimeConfig = toRuntimeConfig(record);
    if (!runtimeConfig) {
      result.errorCode = 'SOURCE_CONFIG_INVALID';
      return result;
    }

    console.info('PRE_IMPORT_BOUNDARY_REACHED_DIAGNOSTIC');
    if (
      TEMPORARY_SUPPRESS_CATALOG_IMPORT_AT_PRE_IMPORT_BOUNDARY &&
      this.allowSelfServiceBoundSource &&
      !this.preImportDiagnosticSuppressionConsumed
    ) {
      this.preImportDiagnosticSuppressionConsumed = true;
      console.info('CATALOG_IMPORT_SUPPRESSED_DIAGNOSTIC');
      result.errorCode = 'CATALOG_IMPORT_SUPPRESSED_DIAGNOSTIC';
      return result;
    }

    let imported: RealImportResult;
    try {
      const storage = typeof this.bootstrapService.getStorage === 'function'
        ? this.bootstrapService.getStorage()
        : undefined;
      const provenance: SegmentedCatalogProvenance = {
        kind: 'REAL',
        sourceId: authority.sourceId!,
        sourceVersion: authority.sourceVersion!,
      };
      imported = record.protocol === 'M3U'
        ? await this.importer.importM3u(runtimeConfig, toTransientRequestOptions(record, provenance, storage))
        : await this.importer.importXtream(runtimeConfig, toTransientRequestOptions(record, provenance, storage));
    } catch (stageError) {
      console.info('[STAGE_MANAGED_SOURCE_ERROR]', stageError);
      result.errorCode = 'REAL_SOURCE_FETCH_FAILED';
      result.errorStage = 'FETCH';
      result.sanitizedErrorClass = 'SOURCE_FETCH_FAILED';
      if (runtimeConfig.type === 'M3U') {
        result.transport = createSanitizedTransportFailureObservation(
          runtimeConfig.playlistUrl ?? '',
          { headers: toTransientRequestOptions(record).requestHeaders },
        );
      }
      return result;
    }

    result.transport = imported.transport;
    result.sourcePayloadSizeBytes = imported.sourcePayloadSizeBytes;
    applyImportMetrics(result, imported);
    if (!imported.success || !imported.catalog || !imported.liveCatalog) {
      if (imported.error === 'SOURCE_PROCESSING_FAILED') {
        result.errorCode = 'SOURCE_PROCESSING_FAILED';
        result.errorStage = imported.errorStage || 'SERIALIZE';
        result.sanitizedErrorClass = 'SOURCE_PROCESSING_FAILED';
      } else {
        result.errorCode = 'REAL_SOURCE_FETCH_FAILED';
        result.errorStage = imported.errorStage || 'FETCH';
        result.sanitizedErrorClass = 'SOURCE_FETCH_FAILED';
      }
      return result;
    }

    // BLOCKER C FIX: SINGLE SEGMENTED STAGING
    // importM3u already produced and persisted the canonical segmented staging
    // (manifest with segments table, sha256, counts, segments, catalogHeader).
    // DO NOT create a second manifest.
    // DO NOT call stageArtifacts (which would re-materialize the full catalog).
    // DO NOT replace segmented manifest.
    if (imported.segmentedStaging) {
      let previousSnapshotId: string | undefined;
      try {
        if (typeof this.bootstrapService.getActivePointer === 'function') {
          const ptr = await this.bootstrapService.getActivePointer();
          previousSnapshotId = ptr?.snapshotId;
        } else if (typeof this.bootstrapService.getStorage === 'function') {
          const ptr = await this.bootstrapService.getStorage()?.readActivePointer?.();
          previousSnapshotId = ptr?.snapshotId;
        }
      } catch {
        // pointer read optional
      }
      result.status = 'STAGED';
      result.snapshotId = imported.segmentedStaging.snapshotId;
      result.previousSnapshotId = previousSnapshotId;
      result.success = true;
      return result;
    }

    // DIRECT DEVICE STAGING: se stageArtifacts estiver disponível no serviço de bootstrap,
    // materializa diretamente em staging eliminando o JSZip monolítico e a pressão de heap
    if (typeof this.bootstrapService.stageArtifacts === 'function') {
      try {
        // O importer já produziu a representação canônica uma única vez.
        // Reutilizá-la evita uma segunda cópia integral do catálogo no pico.
        const catalogJson = imported.catalogJson || JSON.stringify(imported.catalog, null, 2);
        const digest = calculateArtifactDigest(catalogJson);
        const manifest = createManifest(imported.catalog, undefined, {
          packageFormatVersion: 2,
          allowSensitiveRuntimeLocators: true,
          generator: 'XandeflixPrebuilt/R2F8L-ManagedStaging',
          liveCatalog: imported.liveCatalog,
          searchIndexBuffer: imported.searchIndexBuffer as Buffer,
          compression: 'STORE',
          catalogSha256: digest.sha256,
          catalogSizeBytes: digest.sizeBytes,
          metadata: {
            kind: 'REAL',
            sourceId: authority.sourceId,
            sourceVersion: authority.sourceVersion,
          },
        });

        const staged = await this.bootstrapService.stageArtifacts(
          manifest,
          imported.catalog,
          imported.searchIndexBuffer as Buffer,
          imported.liveCatalog,
          undefined,
          catalogJson,
        );

        result.status = staged.status;
        result.snapshotId = staged.snapshotId;
        result.previousSnapshotId = staged.previousSnapshotId;
        if (!staged.success) {
          result.errorCode = 'STAGING_FAILED';
          result.errorStage = 'STAGE';
          result.sanitizedErrorClass = 'STAGING_FAILED';
          return result;
        }
        result.success = true;
        return result;
      } catch (stagingErr) {
        console.info('[DIRECT_STAGING_ERROR]', stagingErr);
        result.errorCode = 'STAGING_FAILED';
        result.errorStage = 'STAGE';
        result.sanitizedErrorClass = 'STAGING_FAILED';
        return result;
      }
    }

    let built: Awaited<ReturnType<CatalogPackageBuilder['build']>>;
    try {
      built = await this.packageBuilder.build(imported.catalog, {
        packageFormatVersion: 2,
        allowSensitiveRuntimeLocators: true,
        generator: 'XandeflixPrebuilt/R2F8L-ManagedStaging',
        liveCatalog: imported.liveCatalog,
        searchIndexBuffer: imported.searchIndexBuffer as Buffer,
        compression: 'STORE',
        metadata: {
          kind: 'REAL',
          sourceId: authority.sourceId,
          sourceVersion: authority.sourceVersion,
        },
      });
    } catch (buildError) {
      console.info('[PACKAGE_BUILD_CATCH_ERROR]', buildError);
      result.errorCode = 'PACKAGE_BUILD_FAILED';
      result.errorStage = 'STAGE';
      return result;
    }

    if (!built.success || !built.packageBuffer) {
      console.info('[PACKAGE_BUILD_BUILT_FAIL]', built?.errors, built?.success, !built?.packageBuffer);
      result.errorCode = 'PACKAGE_BUILD_FAILED';
      result.errorStage = 'STAGE';
      return result;
    }

    try {
      const staged = await this.bootstrapService.stagePackage(built.packageBuffer);
      result.status = staged.status;
      result.snapshotId = staged.snapshotId;
      result.previousSnapshotId = staged.previousSnapshotId;
      if (!staged.success) {
        result.errorCode = 'STAGING_FAILED';
        result.errorStage = 'STAGE';
        result.sanitizedErrorClass = 'STAGING_FAILED';
        return result;
      }
      result.success = true;
      return result;
    } catch {
      result.errorCode = 'STAGING_FAILED';
      result.errorStage = 'STAGE';
      result.sanitizedErrorClass = 'STAGING_FAILED';
      return result;
    }
  }
}


