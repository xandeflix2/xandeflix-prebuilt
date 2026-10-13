import type { ActivationStatus, LicenseMode } from '../../device/device.types.ts';
import type { RealSourceDeviceAuthPreflight, RealSourceDeviceImportResult } from '../../source/real-source-device-import.service.ts';
import type { ManagedStagingResult } from '../../source/managed-source-staging.orchestrator.ts';
import type { SourceDeliveryAck, DeviceSourceDeliveryErrorCode } from '../../security/device-source-delivery-dispatcher.ts';

interface ActivationDiagnosticInput {
  displayCode: string; effectiveStatus: ActivationStatus; mode?: LicenseMode;
  localKeyState: 'LOADING' | 'READY' | 'ERROR'; sourceConfigured: boolean; deviceId: string;
  authPreflight: RealSourceDeviceAuthPreflight | null; deliveryAck: SourceDeliveryAck | null;
  deliveryErrorCode: DeviceSourceDeliveryErrorCode | null;
  catalogImportResult: RealSourceDeviceImportResult | null; managedStagingResult: ManagedStagingResult | null;
}
const classifications = new Set([
  'SIM', 'NAO', 'PASS', 'FAIL', 'UNKNOWN', 'AUTHORIZED', 'UNREGISTERED', 'PENDING_MANAGER_APPROVAL',
  'REVOKED', 'EXPIRED', 'SUSPENDED', 'ACTIVE', 'TRIAL', 'MANAGED', 'SELF_SERVICE', 'LOADING', 'READY', 'ERROR',
  'SOURCE_READY', 'SOURCE_NOT_BOUND', 'SOURCE_DISABLED', 'DEVICE_NOT_AUTHORIZED', 'DEVICE_REVOKED',
  'LICENSE_INVALID', 'REMOTE_AUTHORITY_UNAVAILABLE', 'LOCAL_ACTIVATION_INVALID', 'LOCAL_ACTIVATION_DEVICE_ID_MISMATCH',
  'NOT_AUTHORIZED', 'STAGED', 'STORED', 'FAILED', 'M3U', 'XTREAM', 'SELF_SERVICE_LICENSE_ID_MISSING',
  'UNKNOWN_LICENSE_MODE', 'DELIVERY_REJECTED', 'REMOTE_AUTHORIZATION_UNAVAILABLE', 'REMOTE_METADATA_INVALID',
  'LOCAL_SOURCE_RECORD_NOT_FOUND', 'LOCAL_SOURCE_ID_MISMATCH', 'LOCAL_SOURCE_VERSION_MISMATCH',
  'LOCAL_SOURCE_PROTOCOL_MISMATCH', 'LOCAL_SOURCE_CONFIG_INVALID', 'REAL_SOURCE_FETCH_FAILED',
  'LOCAL_CATALOG_BUILD_FAILED', 'LOCAL_CATALOG_IMPORT_FAILED', 'NONE', 'UNPROVEN', 'ALREADY_ACTIVE',
  'REJECTED', 'SOURCE_CONFIG_INVALID', 'SOURCE_PROCESSING_FAILED', 'PACKAGE_BUILD_FAILED',
  'STAGING_FAILED', 'CATALOG_IMPORT_SUPPRESSED_DIAGNOSTIC',
]);

/** Never serialize entire objects, free-form errors or DOM innerText. */
export function buildActivationDiagnostics(input: ActivationDiagnosticInput): string {
  const lines = ['XANDEFLIX_SUPPORT_DIAGNOSTIC_V1'];
  const flag = (name: string, value: boolean) => lines.push(`${name}=${value ? 'SIM' : 'NAO'}`);
  const classified = (name: string, value: unknown) => lines.push(`${name}=${typeof value === 'string' && classifications.has(value) ? value : 'UNKNOWN'}`);
  const count = (name: string, value: unknown) => { if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) lines.push(`${name}=${value}`); };
  lines.push(`DEVICE_CODE=${/^XF-[A-Z0-9-]{4,40}$/.test(input.displayCode) ? input.displayCode : 'UNKNOWN'}`);
  classified('ACTIVATION_STATUS', input.effectiveStatus);
  classified('LICENSE_MODE', input.mode);
  classified('LOCAL_KEY_STATE', input.localKeyState);
  lines.push(`AUTH_UI_STATE=${input.effectiveStatus === 'AUTHORIZED' ? 'AUTHORIZED' : 'NOT_AUTHORIZED'}`);
  const preflight = input.authPreflight;
  if (preflight) {
    classified('AUTH_IMPORT_PREFLIGHT', preflight.importPreflightStatus);
    flag('AUTH_DEVICE_ID_MATCH', preflight.deviceId === input.deviceId && preflight.localActivationDeviceIdMatch === 'SIM');
    classified('AUTH_TOKEN_PRESENT_BOOLEAN', preflight.localDeviceAuthTokenPresent);
    classified('AUTH_REMOTE_AUTHORITY_AVAILABLE', preflight.remoteAuthorityAvailable);
    classified('AUTH_REMOTE_RESULT_CODE', preflight.remoteResultCode);
    classified('LICENSE_AUTHORIZATION', preflight.licenseAuth);
    classified('BINDING_AUTHORIZATION', preflight.bindingAuth);
    classified('SOURCE_AUTHORIZATION', preflight.sourceAuth);
  }
  flag('SOURCE_CONFIGURED', input.sourceConfigured);
  if (input.deliveryAck) {
    classified('DELIVERY_RESULT', input.deliveryAck.deliveryResult);
    lines.push(`SOURCE_ID=${/^src_[a-z0-9]{1,48}$/.test(input.deliveryAck.sourceId) ? input.deliveryAck.sourceId : 'UNKNOWN'}`);
    count('SOURCE_VERSION', input.deliveryAck.sourceVersion);
    classified('PROTOCOL', input.deliveryAck.protocol);
  }
  if (input.deliveryErrorCode) classified('DELIVERY_ERROR_CODE', input.deliveryErrorCode);
  lines.push('DATA_PLANE=DEVICE_TO_SOURCE_DIRECT');
  const imported = input.catalogImportResult;
  if (imported) {
    flag('PLAYLIST_FETCH_SUCCESS', imported.playlistFetchSuccess);
    count('RAW_ITEM_COUNT', imported.rawItemCount);
    count('NORMALIZED_ITEM_COUNT', imported.normalizedItemCount);
    count('INVALID_ITEM_COUNT', imported.invalidItemCount);
    flag('LOCAL_CATALOG_WRITE_EXECUTED', imported.localCatalogWriteExecuted);
    flag('ACTIVE_SNAPSHOT_PROMOTED', imported.activeSnapshotPromoted);
    flag('CATALOG_READY_UI', imported.catalogReady);
    classified('CATALOG_ERROR_CODE', imported.errorCode || 'NONE');
  }
  const staged = input.managedStagingResult;
  if (staged) {
    classified('MANAGED_STAGING_STATUS', staged.status);
    count('RAW_ITEM_COUNT', staged.rawItemCount);
    count('MOVIE_ITEM_COUNT', staged.movieCount);
    count('SERIES_ITEM_COUNT', staged.seriesCount);
    count('LIVE_ITEM_COUNT', staged.liveCount);
    count('UNRESOLVED_COUNT', staged.unresolvedCount);
    classified('STAGING_ERROR_CODE', staged.errorCode || 'NONE');
  }
  return lines.join('\n');
}
