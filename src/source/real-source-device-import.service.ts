/**
 * Xandeflix Prebuilt — R2F4 real source device import.
 *
 * Orquestra o caminho único de dados no dispositivo:
 * autoridade remota (somente metadata) → LocalSecureSourceStore → fetch
 * direto → RealSourceImporterService → PackageBuilder/BootstrapService.
 *
 * O resultado deste serviço é deliberadamente sanitizado. A configuração
 * local e a resposta M3U nunca fazem parte do resultado, de logs ou de
 * qualquer escrita remota.
 */

import { AuthorizedSourceResolver, type ResolvedSourceResult } from '../control-plane/client/authorized-source-resolver.ts';
import { DeviceIdentityService } from '../device/device-identity.service.ts';
import { BootstrapService } from '../bootstrap/bootstrap.service.ts';
import { getClientBootstrapService } from '../bootstrap/client.ts';
import { PackageBuilder } from '../provisioning/package-builder.ts';
import { LocalSecureSourceStore, type LocalSecureSourceRecord } from '../security/local-secure-source-store.ts';
import {
  RealSourceImporterService,
  type RealImportResult,
  type RealSourceImportOptions,
} from './real-source-importer.service.ts';
import type { SourceRuntimeConfig } from '../debug/source/source-runtime-config.ts';
import type { PrebuiltCatalog } from '../contracts/catalog.ts';
import type { LiveCatalog } from '../catalog/live/live-tv.types.ts';
import type { SanitizedTransportObservation } from './device-direct-fetch.ts';

export type RealSourceDeviceImportErrorCode =
  | 'REMOTE_AUTHORIZATION_UNAVAILABLE'
  | 'DEVICE_NOT_AUTHORIZED'
  | 'LICENSE_NOT_AUTHORIZED'
  | 'SOURCE_NOT_BOUND'
  | 'SOURCE_DISABLED'
  | 'REMOTE_METADATA_INVALID'
  | 'LOCAL_SOURCE_RECORD_NOT_FOUND'
  | 'LOCAL_SOURCE_ID_MISMATCH'
  | 'LOCAL_SOURCE_VERSION_MISMATCH'
  | 'LOCAL_SOURCE_PROTOCOL_MISMATCH'
  | 'LOCAL_SOURCE_CONFIG_INVALID'
  | 'REAL_SOURCE_FETCH_FAILED'
  | 'LOCAL_CATALOG_BUILD_FAILED'
  | 'LOCAL_CATALOG_IMPORT_FAILED';

export interface RealSourceDeviceImportResult {
  success: boolean;
  errorCode?: RealSourceDeviceImportErrorCode;
  sourceId: string;
  localSourceRecordPresent: boolean;
  localSourceVersion?: number;
  remoteSourceVersion?: number;
  localSourceVersionMatch: boolean;
  localProtocol?: 'M3U' | 'XTREAM';
  remoteProtocol?: 'M3U' | 'XTREAM';
  localProtocolMatch: boolean;
  deviceAuthorization: 'PASS' | 'FAIL';
  licenseAuthorization: 'PASS' | 'FAIL';
  bindingAuthorization: 'PASS' | 'FAIL';
  sourceAuthorization: 'PASS' | 'FAIL';
  realSourceFetchExecuted: boolean;
  realSourceFetchOrigin: 'DEVICE_DIRECT' | 'NOT_EXECUTED';
  backendSourceFetchExecuted: 'NAO';
  playlistFetchSuccess: boolean;
  rawItemCount: number;
  normalizedItemCount: number;
  invalidItemCount: number;
  liveCount: number;
  movieCount: number;
  seriesCount: number;
  unknownCount: number;
  sourcePayloadSizeBytes?: number;
  localCatalogWriteExecuted: boolean;
  stagingSnapshotCreated: boolean;
  activeSnapshotPromoted: boolean;
  activeSnapshotIdPresent: boolean;
  catalogReady: boolean;
  localCatalogStorageBytes: number;
  realSourceSecretExposed: 'NAO';
  streamUrlExposed: 'NAO';
  sourceConfigLogged: 'NAO';
  playlistBodyLogged: 'NAO';
  playbackExecuted: 'NAO';
  playerOpened: 'NAO';
  transport?: SanitizedTransportObservation;
}

export interface RealSourceDeviceAuthPreflight {
  deviceId: string;
  activationStatePresent: boolean;
  localActivationDeviceIdMatch: 'SIM' | 'NAO' | 'UNPROVEN';
  localDeviceAuthTokenPresent: 'SIM' | 'NAO';
  tokenHashRemoteMatch: 'SIM' | 'NAO' | 'UNPROVEN';
  tokenAcceptedByImportAuthority: 'SIM' | 'NAO' | 'UNPROVEN';
  remoteAuthorityAvailable: 'SIM' | 'NAO';
  remoteResultCode: string;
  importAuthorizationStatus: ResolvedSourceResult['status'];
  importPreflightStatus: string;
  remoteDeviceStatus: 'AUTHORIZED' | 'NOT_AUTHORIZED' | 'REVOKED' | 'UNPROVEN';
  licenseStatus: 'ACTIVE' | 'INACTIVE' | 'UNPROVEN';
  licenseMode?: 'SELF_SERVICE' | 'MANAGED';
  licenseAuth: 'PASS' | 'FAIL' | 'UNPROVEN';
  sourceBindingPresent: 'SIM' | 'NAO' | 'UNPROVEN';
  bindingAuth: 'PASS' | 'FAIL' | 'UNPROVEN';
  sourceId?: string;
  sourceStatus?: 'ACTIVE' | 'DISABLED';
  sourceVersion?: number;
  sourceProtocol?: 'M3U' | 'XTREAM';
  sourceAuth: 'PASS' | 'FAIL' | 'UNPROVEN';
}

type LocalStore = Pick<LocalSecureSourceStore, 'get'>;
type SourceAuthorizationResolver = () => Promise<ResolvedSourceResult>;
type SourceImporter = Pick<typeof RealSourceImporterService, 'importM3u' | 'importXtream'>;
type CatalogPackageBuilder = Pick<PackageBuilder, 'build'>;

export interface RealSourceDeviceImportServiceOptions {
  localStore?: LocalStore;
  resolveAuthorization?: SourceAuthorizationResolver;
  importer?: SourceImporter;
  bootstrapService?: BootstrapService;
  packageBuilder?: CatalogPackageBuilder;
}

function baseResult(sourceId: string): RealSourceDeviceImportResult {
  return {
    success: false,
    sourceId,
    localSourceRecordPresent: false,
    localSourceVersionMatch: false,
    localProtocolMatch: false,
    deviceAuthorization: 'FAIL',
    licenseAuthorization: 'FAIL',
    bindingAuthorization: 'FAIL',
    sourceAuthorization: 'FAIL',
    realSourceFetchExecuted: false,
    realSourceFetchOrigin: 'NOT_EXECUTED',
    backendSourceFetchExecuted: 'NAO',
    playlistFetchSuccess: false,
    rawItemCount: 0,
    normalizedItemCount: 0,
    invalidItemCount: 0,
    liveCount: 0,
    movieCount: 0,
    seriesCount: 0,
    unknownCount: 0,
    localCatalogWriteExecuted: false,
    stagingSnapshotCreated: false,
    activeSnapshotPromoted: false,
    activeSnapshotIdPresent: false,
    catalogReady: false,
    localCatalogStorageBytes: 0,
    realSourceSecretExposed: 'NAO',
    streamUrlExposed: 'NAO',
    sourceConfigLogged: 'NAO',
    playlistBodyLogged: 'NAO',
    playbackExecuted: 'NAO',
    playerOpened: 'NAO',
  };
}

function isManagedAuthorizationReady(result: ResolvedSourceResult): boolean {
  // O resolver cliente preserva SOURCE_ACTION_REQUIRED para MANAGED enquanto
  // a configuração não é lida pelo runtime. Neste serviço, a leitura segura
  // ocorre imediatamente depois, então ambos os estados remotos autorizados
  // são aceitos; estados de licença/device/binding nunca são relaxados.
  return (
    result.mode === 'MANAGED' &&
    (result.status === 'SOURCE_READY' || result.status === 'SOURCE_ACTION_REQUIRED') &&
    result.sourceStatus === 'ACTIVE'
  );
}

export function isCanonicalManagedPreflightReady(result: ResolvedSourceResult): boolean {
  return (
    result.mode === 'MANAGED' &&
    result.remoteResultCode === 'SOURCE_READY' &&
    result.sourceStatus === 'ACTIVE' &&
    typeof result.sourceId === 'string' &&
    typeof result.sourceVersion === 'number' &&
    (result.protocol === 'M3U' || result.protocol === 'XTREAM')
  );
}

function toRuntimeConfig(record: LocalSecureSourceRecord): SourceRuntimeConfig | undefined {
  if (record.protocol === 'M3U') {
    if (typeof record.sourceConfig.playlistUrl !== 'string' || !record.sourceConfig.playlistUrl.trim()) {
      return undefined;
    }
    return {
      type: 'M3U',
      playlistUrl: record.sourceConfig.playlistUrl,
    };
  }

  if (
    typeof record.sourceConfig.endpoint !== 'string' ||
    !record.sourceConfig.endpoint.trim() ||
    typeof record.sourceConfig.username !== 'string' ||
    !record.sourceConfig.username.trim() ||
    typeof record.sourceConfig.password !== 'string' ||
    !record.sourceConfig.password.trim()
  ) {
    return undefined;
  }

  return {
    type: 'XTREAM',
    host: record.sourceConfig.endpoint,
    username: record.sourceConfig.username,
    password: record.sourceConfig.password,
  };
}

function toTransientRequestOptions(record: LocalSecureSourceRecord, sourceId?: string): RealSourceImportOptions {
  const token = record.sourceConfig.token?.trim();
  return token
    ? { sourceId, persistLiveCatalog: false, requestHeaders: { Authorization: `Bearer ${token}` } }
    : { sourceId, persistLiveCatalog: false };
}

function applyImportMetrics(result: RealSourceDeviceImportResult, imported: RealImportResult): void {
  const metrics = imported.metrics;
  if (!metrics) return;

  result.rawItemCount = metrics.rawItemCount;
  result.movieCount = metrics.canonicalMovieCount;
  result.seriesCount = metrics.canonicalSeriesCount;
  result.liveCount = metrics.canonicalLiveChannelCount;
  result.normalizedItemCount = result.movieCount + result.seriesCount + result.liveCount;
  result.invalidItemCount = Math.max(0, result.rawItemCount - result.normalizedItemCount);
  result.unknownCount = result.invalidItemCount;
}

export class RealSourceDeviceImportService {
  private readonly localStore: LocalStore;
  private readonly resolveAuthorization: SourceAuthorizationResolver;
  private readonly importer: SourceImporter;
  private readonly bootstrapService: BootstrapService;
  private readonly packageBuilder: CatalogPackageBuilder;

  constructor(options?: RealSourceDeviceImportServiceOptions) {
    this.localStore = options?.localStore || new LocalSecureSourceStore();
    this.resolveAuthorization = options?.resolveAuthorization || (() => AuthorizedSourceResolver.resolve());
    this.importer = options?.importer || RealSourceImporterService;
    this.bootstrapService = options?.bootstrapService || getClientBootstrapService();
    this.packageBuilder = options?.packageBuilder || new PackageBuilder();
  }

  /**
   * Executa somente a etapa de autoridade do importador. Este metodo nao le o
   * LocalSecureSourceStore, nao chama fetch e nao toca no catalogo.
   */
  async preflightManagedSource(): Promise<RealSourceDeviceAuthPreflight> {
    const identity = await DeviceIdentityService.getOrCreateIdentity();
    const activation = await DeviceIdentityService.loadActivationState();

    let authorization: ResolvedSourceResult;
    try {
      authorization = await this.resolveAuthorization();
    } catch {
      authorization = {
        status: 'DEVICE_NOT_AUTHORIZED',
        remoteAuthorityAvailable: false,
        remoteResultCode: 'REMOTE_AUTHORITY_UNAVAILABLE',
      };
    }

    const localActivationDeviceIdMatch = activation
      ? activation.deviceId === identity.deviceId ? 'SIM' : 'NAO'
      : 'UNPROVEN';
    const localDeviceAuthTokenPresent = activation?.deviceAuthToken ? 'SIM' : 'NAO';
    const remoteResultCode = authorization.remoteResultCode || authorization.status;
    const remoteAuthorityAvailable = authorization.remoteAuthorityAvailable === true ? 'SIM' : 'NAO';
    const tokenAcceptedByImportAuthority = !activation?.deviceAuthToken || localActivationDeviceIdMatch !== 'SIM'
      ? 'NAO'
      : remoteResultCode === 'REMOTE_AUTHORITY_UNAVAILABLE' || remoteResultCode === 'LOCAL_ACTIVATION_INVALID' || remoteResultCode === 'LOCAL_ACTIVATION_DEVICE_ID_MISMATCH'
        ? 'UNPROVEN'
        : remoteResultCode === 'DEVICE_NOT_AUTHORIZED' || remoteResultCode === 'DEVICE_REVOKED'
          ? 'NAO'
          : 'SIM';
    const remoteDeviceStatus = remoteResultCode === 'REMOTE_AUTHORITY_UNAVAILABLE' || remoteResultCode === 'LOCAL_ACTIVATION_INVALID' || remoteResultCode === 'LOCAL_ACTIVATION_DEVICE_ID_MISMATCH'
      ? 'UNPROVEN'
      : remoteResultCode === 'DEVICE_REVOKED'
        ? 'REVOKED'
        : remoteResultCode === 'DEVICE_NOT_AUTHORIZED'
          ? 'NOT_AUTHORIZED'
          : 'AUTHORIZED';
    const licenseStatus = remoteResultCode === 'LICENSE_INVALID'
      ? 'INACTIVE'
      : remoteDeviceStatus === 'AUTHORIZED'
        ? 'ACTIVE'
        : 'UNPROVEN';
    const sourceBindingPresent = remoteResultCode === 'SOURCE_NOT_BOUND'
      ? 'NAO'
      : isCanonicalManagedPreflightReady(authorization)
        ? 'SIM'
        : 'UNPROVEN';
    const importPreflightStatus = isCanonicalManagedPreflightReady(authorization)
      ? 'SOURCE_READY'
      : remoteResultCode;

    return {
      deviceId: identity.deviceId,
      activationStatePresent: Boolean(activation),
      localActivationDeviceIdMatch,
      localDeviceAuthTokenPresent,
      tokenHashRemoteMatch: tokenAcceptedByImportAuthority,
      tokenAcceptedByImportAuthority,
      remoteAuthorityAvailable,
      remoteResultCode,
      importAuthorizationStatus: authorization.status,
      importPreflightStatus,
      remoteDeviceStatus,
      licenseStatus,
      licenseMode: authorization.mode || activation?.licenseMode,
      licenseAuth: licenseStatus === 'ACTIVE' ? 'PASS' : licenseStatus === 'INACTIVE' ? 'FAIL' : 'UNPROVEN',
      sourceBindingPresent,
      bindingAuth: sourceBindingPresent === 'SIM' ? 'PASS' : sourceBindingPresent === 'NAO' ? 'FAIL' : 'UNPROVEN',
      sourceId: authorization.sourceId,
      sourceStatus: authorization.sourceStatus,
      sourceVersion: authorization.sourceVersion,
      sourceProtocol: authorization.protocol,
      sourceAuth: isCanonicalManagedPreflightReady(authorization)
        ? 'PASS'
        : remoteAuthorityAvailable === 'NAO' || remoteDeviceStatus === 'UNPROVEN'
          ? 'UNPROVEN'
          : 'FAIL',
    };
  }

  async importManagedSource(): Promise<RealSourceDeviceImportResult> {
    const result = baseResult('src_uhwh5cio');

    let authorization: ResolvedSourceResult;
    try {
      authorization = await this.resolveAuthorization();
    } catch {
      result.errorCode = 'REMOTE_AUTHORIZATION_UNAVAILABLE';
      return result;
    }

    result.sourceId = authorization.sourceId || result.sourceId;
    result.remoteSourceVersion = authorization.sourceVersion;
    result.remoteProtocol = authorization.protocol;
    result.deviceAuthorization =
      authorization.status === 'DEVICE_NOT_AUTHORIZED' || authorization.status === 'DEVICE_REVOKED'
        ? 'FAIL'
        : 'PASS';
    result.licenseAuthorization = authorization.status === 'LICENSE_INVALID' ? 'FAIL' : 'PASS';
    result.bindingAuthorization =
      authorization.status === 'SOURCE_NOT_BOUND' || !authorization.sourceId ? 'FAIL' : 'PASS';
    result.sourceAuthorization = isManagedAuthorizationReady(authorization) ? 'PASS' : 'FAIL';

    if (authorization.status === 'DEVICE_NOT_AUTHORIZED' || authorization.status === 'DEVICE_REVOKED') {
      result.errorCode = 'DEVICE_NOT_AUTHORIZED';
      return result;
    }
    if (authorization.status === 'LICENSE_INVALID') {
      result.errorCode = 'LICENSE_NOT_AUTHORIZED';
      return result;
    }
    if (authorization.status === 'SOURCE_NOT_BOUND' || !authorization.sourceId) {
      result.errorCode = 'SOURCE_NOT_BOUND';
      return result;
    }
    if (authorization.sourceStatus === 'DISABLED') {
      result.errorCode = 'SOURCE_DISABLED';
      return result;
    }
    if (!isManagedAuthorizationReady(authorization)) {
      result.errorCode = 'REMOTE_METADATA_INVALID';
      return result;
    }
    const remoteSourceVersion = authorization.sourceVersion;
    const remoteProtocol = authorization.protocol;
    if (
      typeof remoteSourceVersion !== 'number' ||
      !Number.isSafeInteger(remoteSourceVersion) ||
      remoteSourceVersion < 1 ||
      (remoteProtocol !== 'M3U' && remoteProtocol !== 'XTREAM')
    ) {
      result.errorCode = 'REMOTE_METADATA_INVALID';
      return result;
    }

    let localRecord: LocalSecureSourceRecord | undefined;
    try {
      // Única origem permitida da configuração real neste caminho.
      localRecord = await this.localStore.get(authorization.sourceId);
    } catch {
      result.errorCode = 'LOCAL_SOURCE_RECORD_NOT_FOUND';
      return result;
    }

    if (!localRecord) {
      result.errorCode = 'LOCAL_SOURCE_RECORD_NOT_FOUND';
      return result;
    }

    result.localSourceRecordPresent = true;
    result.localSourceVersion = localRecord.sourceVersion;
    result.localProtocol = localRecord.protocol;
    result.localSourceVersionMatch = localRecord.sourceVersion === remoteSourceVersion;
    result.localProtocolMatch = localRecord.protocol === remoteProtocol;

    if (localRecord.sourceId !== authorization.sourceId) {
      result.errorCode = 'LOCAL_SOURCE_ID_MISMATCH';
      return result;
    }
    if (!result.localSourceVersionMatch) {
      result.errorCode = 'LOCAL_SOURCE_VERSION_MISMATCH';
      return result;
    }
    if (!result.localProtocolMatch) {
      result.errorCode = 'LOCAL_SOURCE_PROTOCOL_MISMATCH';
      return result;
    }

    const runtimeConfig = toRuntimeConfig(localRecord);
    if (!runtimeConfig) {
      result.errorCode = 'LOCAL_SOURCE_CONFIG_INVALID';
      return result;
    }

    result.realSourceFetchExecuted = true;
    result.realSourceFetchOrigin = 'DEVICE_DIRECT';

    let imported: RealImportResult;
    try {
      const requestOptions = toTransientRequestOptions(localRecord, authorization.sourceId);
      imported =
        localRecord.protocol === 'M3U'
          ? await this.importer.importM3u(runtimeConfig, requestOptions)
          : await this.importer.importXtream(runtimeConfig, requestOptions);
    } catch {
      result.errorCode = 'REAL_SOURCE_FETCH_FAILED';
      return result;
    }

    result.transport = imported.transport;
    result.sourcePayloadSizeBytes = imported.sourcePayloadSizeBytes;
    applyImportMetrics(result, imported);
    result.playlistFetchSuccess = imported.success;
    if (!imported.success || !imported.catalog || !imported.liveCatalog) {
      result.errorCode = 'REAL_SOURCE_FETCH_FAILED';
      return result;
    }

    try {
      const packageResult = await this.packageBuilder.build(imported.catalog, {
        packageFormatVersion: 2,
        allowSensitiveRuntimeLocators: true,
        generator: 'XandeflixPrebuilt/R2F4-DeviceRealSource',
        liveCatalog: imported.liveCatalog,
        searchIndexBuffer: imported.searchIndexBuffer as Buffer,
        compression: 'STORE',
      });
      if (!packageResult.success || !packageResult.packageBuffer) {
        result.errorCode = 'LOCAL_CATALOG_BUILD_FAILED';
        return result;
      }

      const bootstrapResult = await this.bootstrapService.importPackage(packageResult.packageBuffer);
      result.stagingSnapshotCreated = bootstrapResult.status === 'PROMOTED';
      result.activeSnapshotPromoted = bootstrapResult.status === 'PROMOTED';
      result.localCatalogWriteExecuted = bootstrapResult.success;

      if (!bootstrapResult.success) {
        result.errorCode = 'LOCAL_CATALOG_IMPORT_FAILED';
        return result;
      }

      // O catálogo de Live TV é mantido localmente e só é publicado depois
      // da promoção canônica do snapshot, sem alterar a busca ou o backend.
      await importLiveCatalogLocally(imported.liveCatalog);

      const storage = this.bootstrapService.getStorage();
      const activePointer = await this.bootstrapService.getActivePointer();
      const activeCatalog = await this.bootstrapService.getActiveCatalog();
      result.activeSnapshotIdPresent = Boolean(activePointer?.snapshotId);
      result.catalogReady =
        result.activeSnapshotIdPresent &&
        (await storage.hasActiveCatalog()) &&
        Boolean(activeCatalog);
      result.localCatalogStorageBytes = await storage.calculateActiveStorageSize();
      result.success = result.catalogReady && result.normalizedItemCount > 0;
      if (!result.success) {
        result.errorCode = 'LOCAL_CATALOG_IMPORT_FAILED';
      }
      return result;
    } catch {
      result.errorCode = 'LOCAL_CATALOG_IMPORT_FAILED';
      return result;
    }
  }
}

async function importLiveCatalogLocally(liveCatalog: LiveCatalog): Promise<void> {
  const { LiveCatalogService } = await import('../catalog/live/live-catalog.service.ts');
  await LiveCatalogService.saveLiveCatalog(liveCatalog);
}

export function countNormalizedCatalogItems(catalog: PrebuiltCatalog): number {
  return catalog.movies.length + catalog.series.length;
}
