/**
 * Xandeflix Prebuilt - R2D-A3A Manager Remote Authority.
 *
 * O cliente apenas encaminha uma sessao Supabase Auth e metadados de source.
 * A decisao de autorizacao continua exclusivamente em auth.uid() +
 * manager_admins dentro das RPCs.
 */

import type {
  CustomerStatus,
  DeviceEntity,
  DeviceSourceBindingEntity,
  LicenseDeviceBindingEntity,
  LicenseEntity,
  ManagerAuditLogItem,
  ManagerDeviceActivationEvent,
  ManagerCustomerDetail,
  ManagerCustomerListItem,
  ManagerCustomerSourceListItem,
  ManagerDeviceSensitiveReveal,
  ManagerInstallationListItem,
  ManagerLicenseDetail,
  ManagerLicenseListItem,
  RemoteManagedSourceMetadata,
  RevokeLicenseResult,
  SuspendLicenseResult,
  UpdateCustomerStatusResult,
  UpdateLicenseLimitsResult,
  ManualActivateLicenseResult,
} from '../control-plane.types.ts';
import type { SourceType } from '../../debug/source/source-runtime-config.ts';
import type { RemoteRpcClient } from './remote-control-plane-authority.ts';
import type {
  DeviceReplacementConfirmation,
  DeviceReplacementRequest,
} from '../device-replacement.types.ts';
import type {
  AuthorizedDeviceReactivationConfirmation,
  ManagerDeviceReactivationRequest,
} from '../device-reactivation.types.ts';

export interface SanitizedRemoteFunctionError {
  message?: string;
  code?: string;
  stage?: string;
  status?: number;
}

export interface ManagerAuthClient extends RemoteRpcClient {
  auth: {
    getSession(): Promise<{
      data: {
        session: {
          user?: { id?: string };
        } | null;
      };
      error?: { message?: string } | null;
    }>;
    signInWithPassword(credentials: {
      email: string;
      password: string;
    }): Promise<{
      data: {
        session: {
          user?: { id?: string };
        } | null;
      };
      error?: { message?: string } | null;
    }>;
    signOut(): Promise<{ error?: { message?: string } | null }>;
  };
  functions?: {
    invoke(
      functionName: string,
      options: { body: Record<string, unknown> }
    ): Promise<{ data: unknown; error?: SanitizedRemoteFunctionError | null }>;
  };
}

export interface ManagerAuthSession {
  userId: string;
}

export interface ManagerAuthController {
  getSession(): Promise<ManagerAuthSession | null>;
  signInWithPassword(email: string, password: string): Promise<ManagerAuthSession>;
  signOut(): Promise<void>;
}

export interface ManagerControlPlaneSnapshot {
  licenses: LicenseEntity[];
  devices: DeviceEntity[];
  licenseBindings: LicenseDeviceBindingEntity[];
  managedSources: RemoteManagedSourceMetadata[];
  sourceBindings: DeviceSourceBindingEntity[];
}

export type ManagerSourceType = Exclude<SourceType, 'AUTO'>;

export type ManagerManagedSourceConfig =
  | {
      playlistUrl: string;
      token?: string;
      runtimeOptions?: Record<string, unknown>;
    }
  | {
      endpoint: string;
      username: string;
      password: string;
      token?: string;
      runtimeOptions?: Record<string, unknown>;
    };

export interface CreateManagedSourceInput {
  sourceId: string;
  name: string;
  sourceType: ManagerSourceType;
  sourceVersion?: number;
}

export interface CreateManagedSourceWithConfigInput {
  name: string;
  protocol: ManagerSourceType;
  sourceConfig: ManagerManagedSourceConfig;
}

export interface UpdateManagedSourceInput {
  sourceId: string;
  expectedVersion: number;
  name?: string;
  sourceType?: ManagerSourceType;
}

export interface UpdateManagedSourceConfigInput {
  sourceId: string;
  expectedVersion: number;
  name?: string;
  protocol: ManagerSourceType;
  sourceConfig: ManagerManagedSourceConfig;
}

export interface RemoteSourceMutationConfirmation {
  success: boolean;
  source?: RemoteManagedSourceMetadata;
  sourceId?: string;
  sourceVersion?: number;
  name?: string;
  protocol?: ManagerSourceType;
  sourceStatus?: 'ACTIVE' | 'DISABLED';
  previousSourceId?: string;
  newSourceId?: string;
  vaultStatus?: 'CONFIGURED' | 'NOT_CONFIGURED';
}

export interface ManagerDeviceActivationInput {
  displayCode: string;
  activationKey: string;
  flowMode?: 'NEW_CUSTOMER' | 'EXISTING_CUSTOMER';
  newCustomerName?: string;
  existingDeviceCode?: string;
  licenseId?: string;
  customerId?: string;
  name?: string;
  protocol?: ManagerSourceType;
  sourceConfig?: ManagerManagedSourceConfig;
}

export interface ManagerDeviceActivationResult {
  success: true;
  deviceId: string;
  displayCode: string;
  customerId?: string;
  licenseId: string;
  sourceId: string;
  deviceAuthorizationState: 'AUTHORIZED';
  sourceBindingStatus: 'ACTIVE';
  licenseStatus: 'ACTIVE' | 'TRIAL';
  sourceResolution: 'SOURCE_READY';
  sourceReused?: boolean;
}

export interface ManagerVaultRuntimePreflight {
  success: true;
  preflight: 'VAULT_RUNTIME';
  vaultKeyEnvPresent: boolean;
  vaultKeyFormatValid: boolean;
  vaultCryptoInitialization: 'PASS' | 'FAIL';
  callerAuthenticated: boolean;
  callerManagerActive: boolean;
  callerManagerRole: 'ADMIN' | 'OWNER' | 'OTHER' | 'UNPROVEN';
  managerAuthorization: 'PASS' | 'DENIED';
  rpcName: 'rpc_manager_update_managed_source_vault';
  rpcPresent: boolean;
  rpcExecuteAuthenticated: boolean;
}

export interface RemoteManagerControlPlaneAuthority {
  auth?: ManagerAuthController;
  runVaultRuntimePreflight(): Promise<ManagerVaultRuntimePreflight>;
  readControlPlane(): Promise<ManagerControlPlaneSnapshot>;
  createManagedSource(input: CreateManagedSourceInput): Promise<RemoteSourceMutationConfirmation>;
  createManagedSourceWithConfig(input: CreateManagedSourceWithConfigInput): Promise<RemoteSourceMutationConfirmation>;
  activateSourceForDevice(input: ManagerDeviceActivationInput): Promise<ManagerDeviceActivationResult>;
  updateManagedSource(input: UpdateManagedSourceInput): Promise<RemoteSourceMutationConfirmation>;
  updateManagedSourceConfig(input: UpdateManagedSourceConfigInput): Promise<RemoteSourceMutationConfirmation>;
  setManagedSourceStatus(
    sourceId: string,
    status: 'ACTIVE' | 'DISABLED'
  ): Promise<RemoteSourceMutationConfirmation>;
  bindDeviceSource(
    licenseId: string,
    deviceId: string,
    sourceId: string
  ): Promise<RemoteSourceMutationConfirmation>;
  switchDeviceSource(
    deviceId: string,
    sourceId: string
  ): Promise<RemoteSourceMutationConfirmation>;
  unbindDeviceSource(deviceId: string): Promise<RemoteSourceMutationConfirmation>;
  replaceDevice(input: DeviceReplacementRequest): Promise<DeviceReplacementConfirmation>;
  listDeviceReactivationRequests(): Promise<ManagerDeviceReactivationRequest[]>;
  approveDeviceReactivation(requestId: string): Promise<AuthorizedDeviceReactivationConfirmation>;
  cancelDeviceReactivation(requestId: string): Promise<AuthorizedDeviceReactivationConfirmation>;
  listInstallations(): Promise<ManagerInstallationListItem[]>;
  listCustomers?(): Promise<ManagerCustomerListItem[]>;
  listLicenses?(): Promise<ManagerLicenseListItem[]>;
  getLicenseDetail?(licenseId: string): Promise<ManagerLicenseDetail>;
  updateLicenseLimits?(licenseId: string, maxDevices: number, maxConcurrentSessions: number, reason?: string): Promise<UpdateLicenseLimitsResult>;
  suspendLicense?(licenseId: string, reason?: string): Promise<SuspendLicenseResult>;
  revokeLicense?(licenseId: string, reason?: string): Promise<RevokeLicenseResult>;
  activateLicenseManual?(licenseId: string, reason: string, validUntil?: string | null, idempotencyKey?: string | null): Promise<ManualActivateLicenseResult>;
  getCustomerDetail?(customerId: string): Promise<ManagerCustomerDetail>;
  updateCustomerStatus?(customerId: string, status: CustomerStatus, reason?: string): Promise<UpdateCustomerStatusResult>;
  listCustomerSources?(): Promise<ManagerCustomerSourceListItem[]>;
  listAuditLogs?(limit?: number): Promise<ManagerAuditLogItem[]>;
  listDeviceActivationEvents?(limit?: number): Promise<ManagerDeviceActivationEvent[]>;
  revealDeviceSensitiveData(deviceId: string): Promise<ManagerDeviceSensitiveReveal>;
}

const SAFE_REMOTE_ERRORS = new Set([
  'MANAGER_AUTH_REQUIRED',
  'MANAGER_NOT_AUTHORIZED',
  'AUTH_REQUIRED',
  'INVALID_CANONICAL_SOURCE_ID',
  'INVALID_SOURCE_NAME',
  'INVALID_SOURCE_PROTOCOL',
  'INVALID_SOURCE_VERSION',
  'INVALID_EXPECTED_VERSION',
  'NO_SOURCE_CHANGE',
  'VERSION_CONFLICT',
  'VERSION_UPDATE_FAILED',
  'SOURCE_NOT_FOUND',
  'INVALID_SOURCE_STATUS',
  'LICENSE_NOT_ACTIVE',
  'DEVICE_NOT_AUTHORIZED',
  'CROSS_CUSTOMER_BINDING_DENIED',
  'SOURCE_NOT_ACTIVE',
  'DEVICE_ALREADY_BOUND_USE_SWITCH',
  'BINDING_NOT_FOUND',
  'REMOTE_MANAGER_MUTATION_FAILED',
  'REMOTE_MANAGER_READ_FAILED',
  'REMOTE_MANAGER_REREAD_MISMATCH',
  'REMOTE_VAULT_BOUNDARY_UNAVAILABLE',
  'VAULT_RUNTIME_NOT_CONFIGURED',
  'VAULT_KEY_UNAVAILABLE',
  'VAULT_KEY_MISSING',
  'VAULT_KEY_INVALID',
  'INVALID_SOURCE_CONFIG',
  'INVALID_SOURCE_CONFIG_FIELDS',
  'INVALID_M3U_PLAYLIST_URL',
  'INVALID_XTREAM_ENDPOINT',
  'INVALID_XTREAM_USERNAME',
  'INVALID_XTREAM_PASSWORD',
  'INVALID_SOURCE_TOKEN',
  'INVALID_SOURCE_RUNTIME_OPTIONS',
  'SOURCE_ALREADY_EXISTS',
  'VAULT_ENCRYPT_FAILED',
  'VAULT_STORE_FAILED',
  'RPC_FAILED',
  'DATABASE_PERMISSION_DENIED',
  'INTERNAL_SANITIZED_ERROR',
  'OLD_DEVICE_NOT_FOUND',
  'OLD_DEVICE_REVOKED',
  'OLD_DEVICE_NOT_AUTHORIZED',
  'NEW_DEVICE_CONFLICT',
  'INVALID_DEVICE_ID',
  'LICENSE_INVALID',
  'LICENSE_MODE_INVALID',
  'SOURCE_BINDING_INVALID',
  'SOURCE_INVALID',
  'TOKEN_HASH_INVALID',
  'INVALID_DEVICE_METADATA',
  'DEVICE_REPLACEMENT_CONFLICT',
  'REQUEST_NOT_FOUND',
  'REQUEST_EXPIRED',
  'REQUEST_NOT_APPROVED',
  'REQUEST_ALREADY_CONSUMED',
  'REQUEST_CANCELLED',
  'REQUEST_ALREADY_TERMINAL',
  'REMOTE_REACTIVATION_UNAVAILABLE',
  'CUSTOMER_NOT_FOUND',
  'INVALID_CUSTOMER_STATUS',
  'CUSTOMER_ID_REQUIRED',
  'MASTER_MANAGER_NOT_AUTHORIZED',
  'DEVICE_NOT_FOUND',
  'REVEAL_DECRYPT_FAILED',
  'LICENSE_NOT_FOUND',
  'LICENSE_ID_REQUIRED',
  'INVALID_MAX_DEVICES',
  'INVALID_MAX_CONCURRENT_SESSIONS',
  'CANNOT_REDUCE_BELOW_ACTIVE_DEVICES',
  'CANNOT_SUSPEND_REVOKED_LICENSE',
  'CANNOT_ACTIVATE_SUSPENDED_LICENSE',
  'CANNOT_ACTIVATE_REVOKED_LICENSE',
  'INVALID_VALID_UNTIL',
  'ACTIVATION_REASON_REQUIRED',
  'DISPLAY_CODE_INVALID',
  'ACTIVATION_KEY_INVALID',
  'INVALID_ACTIVATION_KEY',
  'PERMANENT_KEY_REVOKED',
  'ACTIVATION_NOT_FOUND',
  'ACTIVATION_DEVICE_MISMATCH',
  'ACTIVATION_SESSION_NOT_FOUND',
  'SOURCE_KIND_INVALID',
  'SOURCE_TYPE_NOT_ALLOWED',
  'SOURCE_DISPLAY_NAME_INVALID',
  'SOURCE_ENVELOPE_INVALID',
  'LICENSE_EXPIRED',
  'TRIAL_EXPIRED',
  'LICENSE_ID_REQUIRED',
  'SOURCE_ALREADY_EXISTS',
  'EXISTING_DEVICE_CODE_REQUIRED',
  'EXISTING_DEVICE_NOT_FOUND',
  'EXISTING_DEVICE_CUSTOMER_MISMATCH',
  'CUSTOMER_NAME_REQUIRED',
  'CUSTOMER_PROFILE_NOT_FOUND',
  'CUSTOMER_PROFILE_NOT_ACTIVE',
  'CUSTOMER_HAS_NO_ACTIVE_SOURCE',
  'CUSTOMER_SOURCE_AMBIGUOUS',
  'NO_ELIGIBLE_MANAGED_LICENSE',
  'MANAGED_LICENSE_CAPACITY_EXHAUSTED',
  'MANAGED_LICENSE_AMBIGUOUS',
  'SOURCE_CONFIG_REQUIRED',
  'INVALID_CUSTOMER_ID',
  'INVALID_FLOW_MODE',
]);

const SAFE_REMOTE_ERROR_STAGES = new Set([
  'AUTH',
  'MANAGER_AUTHORIZATION',
  'REQUEST_VALIDATION',
  'VAULT_KEY',
  'VAULT_ENCRYPT',
  'RPC',
  'POST_WRITE_RESPONSE',
  'INTERNAL',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function safeErrorCode(error: unknown): string {
  if (isRecord(error) && typeof error.code === 'string' && SAFE_REMOTE_ERRORS.has(error.code)) {
    return error.code;
  }
  const message = error instanceof Error
    ? error.message
    : isRecord(error) && typeof error.message === 'string'
      ? error.message
      : '';
  return SAFE_REMOTE_ERRORS.has(message) ? message : 'REMOTE_MANAGER_MUTATION_FAILED';
}

function safeErrorStage(error: unknown): string {
  if (isRecord(error) && typeof error.stage === 'string' && SAFE_REMOTE_ERROR_STAGES.has(error.stage)) {
    return error.stage;
  }
  return 'INTERNAL';
}

class SanitizedManagerRemoteError extends Error {
  readonly code: string;
  readonly stage: string;
  readonly status?: number;

  constructor(code: string, stage: string, status?: number) {
    super(code);
    this.code = code;
    this.stage = stage;
    this.status = status;
  }
}

function normalizeRemoteSource(data: unknown): RemoteManagedSourceMetadata {
  if (!isRecord(data)) {
    throw new Error('REMOTE_MANAGER_READ_FAILED');
  }

  const sourceId = typeof data.sourceId === 'string' ? data.sourceId : data.id;
  if (
    typeof data.id !== 'string' ||
    typeof sourceId !== 'string' ||
    typeof data.name !== 'string' ||
    typeof data.sourceType !== 'string' ||
    typeof data.version !== 'number' ||
    (data.status !== 'ACTIVE' && data.status !== 'DISABLED') ||
    typeof data.createdAtIso !== 'string' ||
    typeof data.updatedAtIso !== 'string'
  ) {
    throw new Error('REMOTE_MANAGER_READ_FAILED');
  }

  return {
    id: data.id,
    sourceId,
    name: data.name,
    sourceType: data.sourceType as SourceType,
    version: data.version,
    status: data.status,
    vaultStatus: data.vaultStatus === 'CONFIGURED' ? 'CONFIGURED' : 'NOT_CONFIGURED',
    createdAtIso: data.createdAtIso,
    updatedAtIso: data.updatedAtIso,
  };
}

function normalizeSnapshot(data: unknown): ManagerControlPlaneSnapshot {
  if (!isRecord(data)) {
    throw new Error('REMOTE_MANAGER_READ_FAILED');
  }

  const arrays = ['licenses', 'devices', 'licenseBindings', 'managedSources', 'sourceBindings'];
  if (arrays.some((key) => !Array.isArray(data[key]))) {
    throw new Error('REMOTE_MANAGER_READ_FAILED');
  }

  return {
    licenses: data.licenses as LicenseEntity[],
    devices: data.devices as DeviceEntity[],
    licenseBindings: data.licenseBindings as LicenseDeviceBindingEntity[],
    managedSources: (data.managedSources as unknown[]).map(normalizeRemoteSource),
    sourceBindings: data.sourceBindings as DeviceSourceBindingEntity[],
  };
}

function normalizeMutation(data: unknown): RemoteSourceMutationConfirmation {
  if (!isRecord(data) || data.success !== true) {
    throw new Error(isRecord(data) && typeof data.reason === 'string' ? safeErrorCode(new Error(data.reason)) : 'REMOTE_MANAGER_MUTATION_FAILED');
  }

  return {
    success: true,
    source: isRecord(data.source) ? normalizeRemoteSource(data.source) : undefined,
    sourceId: typeof data.sourceId === 'string' ? data.sourceId : undefined,
    sourceVersion: typeof data.sourceVersion === 'number' ? data.sourceVersion : undefined,
    name: typeof data.name === 'string' ? data.name : undefined,
    protocol: data.protocol === 'M3U' || data.protocol === 'XTREAM' ? data.protocol : undefined,
    sourceStatus: data.sourceStatus === 'ACTIVE' || data.sourceStatus === 'DISABLED' ? data.sourceStatus : undefined,
    previousSourceId: typeof data.previousSourceId === 'string' ? data.previousSourceId : undefined,
    newSourceId: typeof data.newSourceId === 'string' ? data.newSourceId : undefined,
    vaultStatus: data.vaultStatus === 'CONFIGURED' ? 'CONFIGURED' : 'NOT_CONFIGURED',
  };
}

function normalizeDeviceReplacement(data: unknown): DeviceReplacementConfirmation {
  if (
    !isRecord(data) ||
    data.success !== true ||
    data.result_code !== 'DEVICE_REPLACEMENT_READY' ||
    typeof data.newDeviceId !== 'string' ||
    data.deviceStatus !== 'AUTHORIZED' ||
    data.licenseStatus !== 'ACTIVE' ||
    typeof data.sourceId !== 'string' ||
    typeof data.sourceVersion !== 'number' ||
    data.sourceStatus !== 'ACTIVE' ||
    data.bindingStatus !== 'ACTIVE' ||
    data.oldDeviceStatus !== 'REVOKED' ||
    data.oldBindingStatus !== 'REVOKED'
  ) {
    const reason = isRecord(data) && typeof data.result_code === 'string'
      ? data.result_code
      : 'REMOTE_MANAGER_MUTATION_FAILED';
    throw new Error(safeErrorCode(new Error(reason)));
  }

  return {
    success: true,
    resultCode: 'DEVICE_REPLACEMENT_READY',
    newDeviceId: data.newDeviceId,
    deviceStatus: 'AUTHORIZED',
    licenseStatus: 'ACTIVE',
    sourceId: data.sourceId,
    sourceVersion: data.sourceVersion,
    sourceStatus: 'ACTIVE',
    bindingStatus: 'ACTIVE',
    oldDeviceStatus: 'REVOKED',
    oldBindingStatus: 'REVOKED',
  };
}

function normalizeDeviceReactivationRequests(data: unknown): ManagerDeviceReactivationRequest[] {
  if (!Array.isArray(data)) throw new Error('REMOTE_MANAGER_READ_FAILED');
  const uuidPattern = /^[0-9a-f-]{36}$/i;
  const deviceTypes = new Set(['TV', 'PHONE', 'TABLET', 'PC', 'OTHER']);
  const requestStatuses = new Set(['PENDING', 'APPROVED', 'CANCELLED', 'CONSUMED', 'EXPIRED']);
  return data.filter(isRecord).map((entry) => {
    const status = typeof entry.status === 'string' && requestStatuses.has(entry.status)
      ? entry.status as ManagerDeviceReactivationRequest['status']
      : null;
    const deviceType = typeof entry.deviceType === 'string' && deviceTypes.has(entry.deviceType)
      ? entry.deviceType as ManagerDeviceReactivationRequest['deviceType']
      : null;
    return {
      requestId: typeof entry.requestId === 'string' && uuidPattern.test(entry.requestId) ? entry.requestId : '',
      deviceId: typeof entry.deviceId === 'string' && uuidPattern.test(entry.deviceId) ? entry.deviceId : '',
      displayCode: typeof entry.displayCode === 'string' ? entry.displayCode : '',
      deviceType,
      deviceLabel: typeof entry.deviceLabel === 'string' ? entry.deviceLabel : '',
      status,
      createdAtIso: typeof entry.createdAtIso === 'string' ? entry.createdAtIso : '',
      expiresAtIso: typeof entry.expiresAtIso === 'string' ? entry.expiresAtIso : '',
    };
  }).filter((entry): entry is ManagerDeviceReactivationRequest => Boolean(
    entry.requestId &&
    entry.deviceId &&
    entry.displayCode &&
    entry.deviceType &&
    entry.status &&
    entry.createdAtIso &&
    entry.expiresAtIso
  ));
}

function normalizeInstallations(data: unknown): ManagerInstallationListItem[] {
  if (!Array.isArray(data)) throw new Error('REMOTE_MANAGER_READ_FAILED');
  const uuidPattern = /^[0-9a-f-]{36}$/i;
  const deviceTypes = new Set(['TV', 'PHONE', 'TABLET', 'PC', 'OTHER']);
  const platforms = new Set(['ANDROID', 'WEB', 'IOS', 'OTHER']);
  const statuses = new Set(['OBSERVED', 'PAIRED', 'STALE']);

  const results: ManagerInstallationListItem[] = [];

  for (const entry of data) {
    if (!isRecord(entry)) continue;

    const installationId = typeof entry.installationId === 'string' && uuidPattern.test(entry.installationId)
      ? entry.installationId
      : '';
    const deviceId = typeof entry.deviceId === 'string' ? entry.deviceId : '';
    const displayCode = typeof entry.displayCode === 'string' ? entry.displayCode : '';

    if (!installationId || !deviceId || !displayCode) continue;

    const packageName = typeof entry.packageName === 'string' ? entry.packageName : '';
    const platform = typeof entry.platform === 'string' && platforms.has(entry.platform)
      ? entry.platform as ManagerInstallationListItem['platform']
      : 'ANDROID';
    const deviceType = typeof entry.deviceType === 'string' && deviceTypes.has(entry.deviceType)
      ? entry.deviceType as ManagerInstallationListItem['deviceType']
      : 'TV';
    const status = typeof entry.status === 'string' && statuses.has(entry.status)
      ? entry.status as ManagerInstallationListItem['status']
      : 'OBSERVED';
    const firstSeenAt = typeof entry.firstSeenAt === 'string' ? entry.firstSeenAt : '';
    const lastSeenAt = typeof entry.lastSeenAt === 'string' ? entry.lastSeenAt : '';

    const item: ManagerInstallationListItem = {
      installationId,
      deviceId,
      displayCode,
      packageName,
      platform,
      deviceType,
      appVersion: typeof entry.appVersion === 'string' ? entry.appVersion : '2.0.0',
      status,
      firstSeenAt,
      lastSeenAt,
    };

    if (typeof entry.manufacturer === 'string') {
      item.manufacturer = entry.manufacturer;
    }
    if (typeof entry.model === 'string') {
      item.model = entry.model;
    }
    if (typeof entry.buildNumber === 'string') {
      item.buildNumber = entry.buildNumber;
    }
    if (isRecord(entry.deviceCorrelation)) {
      item.deviceCorrelation = {
        isKnownDevice: entry.deviceCorrelation.isKnownDevice === true,
        deviceStatus: typeof entry.deviceCorrelation.deviceStatus === 'string' ? entry.deviceCorrelation.deviceStatus : 'UNREGISTERED',
      };
      if (typeof entry.deviceCorrelation.deviceLabel === 'string') {
        item.deviceCorrelation.deviceLabel = entry.deviceCorrelation.deviceLabel;
      }
      if (typeof entry.deviceCorrelation.registeredAt === 'string') {
        item.deviceCorrelation.registeredAt = entry.deviceCorrelation.registeredAt;
      }
    }

    results.push(item);
  }

  return results;
}

function normalizeCustomers(data: unknown): ManagerCustomerListItem[] {
  if (!Array.isArray(data)) throw new Error('REMOTE_MANAGER_READ_FAILED');
  const uuidPattern = /^[0-9a-f-]{36}$/i;
  const statuses = new Set(['ACTIVE', 'SUSPENDED', 'BLOCKED']);

  const results: ManagerCustomerListItem[] = [];

  for (const entry of data) {
    if (!isRecord(entry)) continue;

    const customerId = typeof entry.customerId === 'string' && uuidPattern.test(entry.customerId)
      ? entry.customerId
      : '';
    const nickname = typeof entry.nickname === 'string' ? entry.nickname : '';

    if (!customerId || !nickname) continue;

    const status = typeof entry.status === 'string' && statuses.has(entry.status)
      ? entry.status as ManagerCustomerListItem['status']
      : 'ACTIVE';
    const createdAt = typeof entry.createdAt === 'string' ? entry.createdAt : '';
    const updatedAt = typeof entry.updatedAt === 'string' ? entry.updatedAt : '';
    const licensesCount = typeof entry.licensesCount === 'number' && Number.isFinite(entry.licensesCount)
      ? entry.licensesCount
      : 0;

    results.push({
      customerId,
      nickname,
      status,
      createdAt,
      updatedAt,
      licensesCount,
    });
  }

  return results;
}

function normalizeLicenses(data: unknown): ManagerLicenseListItem[] {
  if (!Array.isArray(data)) throw new Error('REMOTE_MANAGER_READ_FAILED');
  const uuidPattern = /^[0-9a-f-]{36}$/i;
  const statuses = new Set(['TRIAL', 'ACTIVE', 'REVOKED', 'EXPIRED', 'SUSPENDED']);
  const modes = new Set(['MANAGED', 'SELF_SERVICE']);

  const results: ManagerLicenseListItem[] = [];

  for (const entry of data) {
    if (!isRecord(entry)) continue;

    const licenseId = typeof entry.licenseId === 'string' && uuidPattern.test(entry.licenseId)
      ? entry.licenseId
      : '';
    if (!licenseId) continue;

    const customerId = typeof entry.customerId === 'string' && uuidPattern.test(entry.customerId)
      ? entry.customerId
      : null;
    const customerNickname = typeof entry.customerNickname === 'string' ? entry.customerNickname : null;
    const mode = typeof entry.mode === 'string' && modes.has(entry.mode)
      ? entry.mode as ManagerLicenseListItem['mode']
      : 'MANAGED';
    const status = typeof entry.status === 'string' && statuses.has(entry.status)
      ? entry.status as ManagerLicenseListItem['status']
      : 'ACTIVE';
    const trialEligible = entry.trialEligible === true;
    const trialStartedAt = typeof entry.trialStartedAt === 'string' ? entry.trialStartedAt : null;
    const trialExpiresAt = typeof entry.trialExpiresAt === 'string' ? entry.trialExpiresAt : null;
    const maxDevices = typeof entry.maxDevices === 'number' && entry.maxDevices >= 1 ? entry.maxDevices : 1;
    const maxConcurrentSessions = typeof entry.maxConcurrentSessions === 'number' && entry.maxConcurrentSessions >= 1
      ? entry.maxConcurrentSessions
      : 1;
    const activeDeviceCount = typeof entry.activeDeviceCount === 'number' ? entry.activeDeviceCount : 0;
    const createdAt = typeof entry.createdAt === 'string' ? entry.createdAt : '';
    const expiresAt = typeof entry.expiresAt === 'string' ? entry.expiresAt : null;

    let sourceSummary: ManagerLicenseListItem['sourceSummary'];
    if (isRecord(entry.sourceSummary)) {
      sourceSummary = {
        hasManagedSource: entry.sourceSummary.hasManagedSource === true,
        hasCustomerSource: entry.sourceSummary.hasCustomerSource === true,
      };
    }

    results.push({
      licenseId,
      customerId,
      customerNickname,
      mode,
      status,
      trialEligible,
      trialStartedAt,
      trialExpiresAt,
      maxDevices,
      maxConcurrentSessions,
      activeDeviceCount,
      sourceSummary,
      createdAt,
      expiresAt,
    });
  }

  return results;
}

function normalizeLicenseDetail(data: unknown): ManagerLicenseDetail {
  if (!isRecord(data) || data.success !== true || !isRecord(data.license)) {
    throw new Error('REMOTE_MANAGER_READ_FAILED');
  }

  const lic = data.license;
  const licenseId = typeof lic.licenseId === 'string' ? lic.licenseId : '';
  const customerId = typeof lic.customerId === 'string' ? lic.customerId : null;
  const mode = lic.mode === 'SELF_SERVICE' ? 'SELF_SERVICE' : 'MANAGED';
  const status = typeof lic.status === 'string' ? lic.status as ManagerLicenseDetail['license']['status'] : 'ACTIVE';
  const trialEligible = lic.trialEligible === true;
  const trialStartedAt = typeof lic.trialStartedAt === 'string' ? lic.trialStartedAt : null;
  const trialExpiresAt = typeof lic.trialExpiresAt === 'string' ? lic.trialExpiresAt : null;
  const maxDevices = typeof lic.maxDevices === 'number' ? lic.maxDevices : 1;
  const maxConcurrentSessions = typeof lic.maxConcurrentSessions === 'number' ? lic.maxConcurrentSessions : 1;
  const createdAt = typeof lic.createdAt === 'string' ? lic.createdAt : '';
  const expiresAt = typeof lic.expiresAt === 'string' ? lic.expiresAt : null;

  let customer: ManagerLicenseDetail['customer'] = null;
  if (isRecord(data.customer) && typeof data.customer.customerId === 'string') {
    customer = {
      customerId: data.customer.customerId,
      nickname: typeof data.customer.nickname === 'string' ? data.customer.nickname : '',
      status: typeof data.customer.status === 'string' ? data.customer.status as CustomerStatus : 'ACTIVE',
    };
  }

  const devices: ManagerLicenseDetail['devices'] = [];
  if (Array.isArray(data.devices)) {
    for (const d of data.devices) {
      if (!isRecord(d)) continue;
      devices.push({
        deviceId: typeof d.deviceId === 'string' ? d.deviceId : '',
        displayCode: typeof d.displayCode === 'string' ? d.displayCode : '',
        deviceType: typeof d.deviceType === 'string' ? d.deviceType as any : 'TV',
        deviceLabel: typeof d.deviceLabel === 'string' ? d.deviceLabel : '',
        status: typeof d.status === 'string' ? d.status : '',
        boundAt: typeof d.boundAt === 'string' ? d.boundAt : '',
        lastSeenAt: typeof d.lastSeenAt === 'string' ? d.lastSeenAt : undefined,
      });
    }
  }

  const managedSources: ManagerLicenseDetail['managedSources'] = [];
  if (Array.isArray(data.managedSources)) {
    for (const ms of data.managedSources) {
      if (!isRecord(ms)) continue;
      managedSources.push({
        sourceId: typeof ms.sourceId === 'string' ? ms.sourceId : '',
        name: typeof ms.name === 'string' ? ms.name : '',
        sourceType: typeof ms.sourceType === 'string' ? ms.sourceType as SourceType : 'XTREAM',
        version: typeof ms.version === 'number' ? ms.version : 1,
        status: ms.status === 'DISABLED' ? 'DISABLED' : 'ACTIVE',
      });
    }
  }

  const customerSources: ManagerLicenseDetail['customerSources'] = [];
  if (Array.isArray(data.customerSources)) {
    for (const cs of data.customerSources) {
      if (!isRecord(cs)) continue;
      customerSources.push({
        sourceId: typeof cs.sourceId === 'string' ? cs.sourceId : '',
        displayName: typeof cs.displayName === 'string' ? cs.displayName : '',
        sourceType: typeof cs.sourceType === 'string' ? cs.sourceType as any : 'M3U',
        status: typeof cs.status === 'string' ? cs.status as any : 'ACTIVE',
        version: typeof cs.version === 'number' ? cs.version : 1,
        hasCredentials: cs.hasCredentials === true,
        createdAt: typeof cs.createdAt === 'string' ? cs.createdAt : '',
        updatedAt: typeof cs.updatedAt === 'string' ? cs.updatedAt : '',
      });
    }
  }

  return {
    success: true,
    license: {
      licenseId,
      customerId,
      mode,
      status,
      trialEligible,
      trialStartedAt,
      trialExpiresAt,
      maxDevices,
      maxConcurrentSessions,
      createdAt,
      expiresAt,
    },
    customer,
    devices,
    managedSources,
    customerSources,
  };
}

function normalizeCustomerDetail(data: unknown): ManagerCustomerDetail {
  if (!isRecord(data) || data.success !== true || !isRecord(data.customer)) {
    throw new Error('REMOTE_MANAGER_READ_FAILED');
  }

  const c = data.customer;
  const customerId = typeof c.customerId === 'string' ? c.customerId : '';
  const nickname = typeof c.nickname === 'string' ? c.nickname : '';
  const status = typeof c.status === 'string' ? c.status as CustomerStatus : 'ACTIVE';
  const trialUsedAt = typeof c.trialUsedAt === 'string' ? c.trialUsedAt : null;
  const createdAt = typeof c.createdAt === 'string' ? c.createdAt : '';
  const updatedAt = typeof c.updatedAt === 'string' ? c.updatedAt : '';

  const licenses: ManagerCustomerDetail['licenses'] = [];
  if (Array.isArray(data.licenses)) {
    for (const l of data.licenses) {
      if (!isRecord(l)) continue;
      licenses.push({
        licenseId: typeof l.licenseId === 'string' ? l.licenseId : '',
        mode: l.mode === 'SELF_SERVICE' ? 'SELF_SERVICE' : 'MANAGED',
        status: typeof l.status === 'string' ? l.status as any : 'ACTIVE',
        trialEligible: l.trialEligible === true,
        trialStartedAt: typeof l.trialStartedAt === 'string' ? l.trialStartedAt : null,
        trialExpiresAt: typeof l.trialExpiresAt === 'string' ? l.trialExpiresAt : null,
        maxDevices: typeof l.maxDevices === 'number' ? l.maxDevices : 1,
        maxConcurrentSessions: typeof l.maxConcurrentSessions === 'number' ? l.maxConcurrentSessions : 1,
        activeDevicesCount: typeof l.activeDevicesCount === 'number' ? l.activeDevicesCount : 0,
        createdAt: typeof l.createdAt === 'string' ? l.createdAt : '',
        expiresAt: typeof l.expiresAt === 'string' ? l.expiresAt : null,
      });
    }
  }

  const devices: ManagerCustomerDetail['devices'] = [];
  if (Array.isArray(data.devices)) {
    for (const d of data.devices) {
      if (!isRecord(d)) continue;
      devices.push({
        deviceId: typeof d.deviceId === 'string' ? d.deviceId : '',
        displayCode: typeof d.displayCode === 'string' ? d.displayCode : '',
        deviceType: typeof d.deviceType === 'string' ? d.deviceType as any : 'TV',
        deviceLabel: typeof d.deviceLabel === 'string' ? d.deviceLabel : '',
        status: typeof d.status === 'string' ? d.status : '',
        licenseId: typeof d.licenseId === 'string' ? d.licenseId : '',
        boundAt: typeof d.boundAt === 'string' ? d.boundAt : '',
        lastSeenAt: typeof d.lastSeenAt === 'string' ? d.lastSeenAt : undefined,
      });
    }
  }

  const sources: ManagerCustomerDetail['sources'] = [];
  if (Array.isArray(data.sources)) {
    for (const s of data.sources) {
      if (!isRecord(s)) continue;
      sources.push({
        sourceId: typeof s.sourceId === 'string' ? s.sourceId : '',
        licenseId: typeof s.licenseId === 'string' ? s.licenseId : '',
        displayName: typeof s.displayName === 'string' ? s.displayName : '',
        sourceType: typeof s.sourceType === 'string' ? s.sourceType as any : 'M3U',
        status: typeof s.status === 'string' ? s.status as any : 'ACTIVE',
        version: typeof s.version === 'number' ? s.version : 1,
        hasCredentials: s.hasCredentials === true,
        createdAt: typeof s.createdAt === 'string' ? s.createdAt : '',
        updatedAt: typeof s.updatedAt === 'string' ? s.updatedAt : '',
      });
    }
  }

  return {
    success: true,
    customer: {
      customerId,
      nickname,
      status,
      trialUsedAt,
      createdAt,
      updatedAt,
    },
    licenses,
    devices,
    sources,
  };
}

function normalizeAuditLogs(data: unknown): ManagerAuditLogItem[] {
  if (!Array.isArray(data)) throw new Error('REMOTE_MANAGER_READ_FAILED');
  const results: ManagerAuditLogItem[] = [];

  for (const entry of data) {
    if (!isRecord(entry)) continue;
    const id = typeof entry.id === 'string' ? entry.id : '';
    const managerId = typeof entry.managerId === 'string' ? entry.managerId : '';
    const action = typeof entry.action === 'string' ? entry.action as ManagerAuditLogItem['action'] : null;
    const targetType = typeof entry.targetType === 'string' ? entry.targetType as ManagerAuditLogItem['targetType'] : null;
    const targetId = typeof entry.targetId === 'string' ? entry.targetId : '';
    const beforeState = isRecord(entry.beforeState) ? entry.beforeState : null;
    const afterState = isRecord(entry.afterState) ? entry.afterState : null;
    const reason = typeof entry.reason === 'string' ? entry.reason : null;
    const createdAt = typeof entry.createdAt === 'string' ? entry.createdAt : '';

    if (!id || !managerId || !action || !targetType || !targetId) continue;

    results.push({
      id,
      managerId,
      action,
      targetType,
      targetId,
      beforeState,
      afterState,
      reason,
      createdAt,
    });
  }

  return results;
}

function normalizeDeviceActivationEvents(data: unknown): ManagerDeviceActivationEvent[] {
  if (!Array.isArray(data)) throw new Error('REMOTE_MANAGER_READ_FAILED');
  const results: ManagerDeviceActivationEvent[] = [];

  for (const entry of data) {
    if (!isRecord(entry)) continue;
    const id = typeof entry.id === 'string' ? entry.id : '';
    const activationId = typeof entry.activationId === 'string' ? entry.activationId : null;
    const customerId = typeof entry.customerId === 'string' ? entry.customerId : null;
    const licenseId = typeof entry.licenseId === 'string' ? entry.licenseId : null;
    const deviceId = typeof entry.deviceId === 'string' ? entry.deviceId : '';
    const displayCode = typeof entry.displayCode === 'string' ? entry.displayCode : '';
    const sourceId = typeof entry.sourceId === 'string' ? entry.sourceId : null;
    const action = typeof entry.action === 'string' ? entry.action as ManagerDeviceActivationEvent['action'] : null;
    const result = entry.result === 'REJECTED' ? 'REJECTED' : entry.result === 'SUCCESS' ? 'SUCCESS' : null;
    const metadata = isRecord(entry.metadata) ? entry.metadata : {};
    const createdAt = typeof entry.createdAt === 'string' ? entry.createdAt : '';

    if (!id || !deviceId || !displayCode || !action || !result) continue;
    results.push({ id, activationId, customerId, licenseId, deviceId, displayCode, sourceId, action, result, metadata, createdAt });
  }

  return results;
}

function normalizeCustomerSources(data: unknown): ManagerCustomerSourceListItem[] {
  if (!Array.isArray(data)) throw new Error('REMOTE_MANAGER_READ_FAILED');
  const results: ManagerCustomerSourceListItem[] = [];

  for (const entry of data) {
    if (!isRecord(entry)) continue;
    const sourceId = typeof entry.sourceId === 'string' ? entry.sourceId : '';
    const customerId = typeof entry.customerId === 'string' ? entry.customerId : '';
    const customerNickname = typeof entry.customerNickname === 'string' ? entry.customerNickname : '';
    const licenseId = typeof entry.licenseId === 'string' ? entry.licenseId : '';
    const displayName = typeof entry.displayName === 'string' ? entry.displayName : '';
    const sourceType = typeof entry.sourceType === 'string' ? entry.sourceType as any : 'M3U';
    const status = typeof entry.status === 'string' ? entry.status as any : 'ACTIVE';
    const version = typeof entry.version === 'number' ? entry.version : 1;
    const hasCredentials = entry.hasCredentials === true;
    const createdAt = typeof entry.createdAt === 'string' ? entry.createdAt : '';
    const updatedAt = typeof entry.updatedAt === 'string' ? entry.updatedAt : '';

    if (!sourceId || !customerId || !licenseId) continue;

    results.push({
      sourceId,
      customerId,
      customerNickname,
      licenseId,
      displayName,
      sourceType,
      status,
      version,
      hasCredentials,
      createdAt,
      updatedAt,
    });
  }

  return results;
}

function normalizeDeviceSensitiveReveal(data: unknown): ManagerDeviceSensitiveReveal {
  if (!isRecord(data) || data.success !== true || !isRecord(data.device)) {
    throw new Error('REVEAL_DECRYPT_FAILED');
  }

  const device = data.device;
  const deviceId = typeof device.deviceId === 'string' ? device.deviceId : '';
  const displayCode = typeof device.displayCode === 'string' ? device.displayCode : '';
  const deviceType = typeof device.deviceType === 'string' ? device.deviceType : 'OTHER';
  const deviceLabel = typeof device.deviceLabel === 'string' ? device.deviceLabel : 'DISPOSITIVO';
  const status = typeof device.status === 'string' ? device.status : 'UNREGISTERED';
  if (!deviceId || !displayCode) throw new Error('REVEAL_DECRYPT_FAILED');

  let source: ManagerDeviceSensitiveReveal['source'] = null;
  if (isRecord(data.source)) {
    const sourceId = typeof data.source.sourceId === 'string' ? data.source.sourceId : '';
    const sourceVersion = typeof data.source.sourceVersion === 'number' ? data.source.sourceVersion : 0;
    const protocol = typeof data.source.protocol === 'string' ? data.source.protocol : '';
    const displayName = typeof data.source.displayName === 'string' ? data.source.displayName : '';
    const sourceStatus = typeof data.source.sourceStatus === 'string' ? data.source.sourceStatus : '';
    const config = data.source.config === null || isRecord(data.source.config) ? data.source.config : null;
    if (sourceId && sourceVersion > 0 && protocol && displayName && sourceStatus) {
      source = { sourceId, sourceVersion, protocol, displayName, sourceStatus, config };
    }
  }

  return {
    device: {
      deviceId,
      displayCode,
      deviceType: deviceType as ManagerDeviceSensitiveReveal['device']['deviceType'],
      deviceLabel,
      status: status as ManagerDeviceSensitiveReveal['device']['status'],
      licenseId: typeof device.licenseId === 'string' ? device.licenseId : null,
      licenseStatus: typeof device.licenseStatus === 'string' ? device.licenseStatus : null,
    },
    permanentActivationKey: typeof data.permanentActivationKey === 'string' ? data.permanentActivationKey : null,
    source,
  };
}

function normalizeDeviceReactivationConfirmation(
  data: unknown,
  acceptedResultCode: ('REQUEST_APPROVED' | 'REQUEST_CANCELLED' | 'REQUEST_ALREADY_CANCELLED' | 'AUTHORIZED_DEVICE_REACTIVATED') | Array<'REQUEST_APPROVED' | 'REQUEST_CANCELLED' | 'REQUEST_ALREADY_CANCELLED' | 'AUTHORIZED_DEVICE_REACTIVATED'>,
): AuthorizedDeviceReactivationConfirmation {
  const accepted = Array.isArray(acceptedResultCode) ? acceptedResultCode : [acceptedResultCode];
  if (!isRecord(data) || data.success !== true || typeof data.result_code !== 'string' || !accepted.includes(data.result_code as typeof accepted[number])) {
    const code = isRecord(data) && typeof data.result_code === 'string'
      ? data.result_code
      : 'REMOTE_REACTIVATION_UNAVAILABLE';
    throw new Error(safeErrorCode(new Error(code)));
  }

  return {
    success: true,
    resultCode: data.result_code as AuthorizedDeviceReactivationConfirmation['resultCode'],
    deviceId: typeof data.deviceId === 'string' ? data.deviceId : undefined,
    deviceStatus: data.deviceStatus === 'AUTHORIZED' ? 'AUTHORIZED' : undefined,
    licenseStatus: data.licenseStatus === 'ACTIVE' ? 'ACTIVE' : undefined,
    licenseMode: data.licenseMode === 'MANAGED' ? 'MANAGED' : undefined,
    sourceId: typeof data.sourceId === 'string' ? data.sourceId : undefined,
    sourceVersion: typeof data.sourceVersion === 'number' ? data.sourceVersion : undefined,
    sourceStatus: data.sourceStatus === 'ACTIVE' ? 'ACTIVE' : undefined,
    bindingStatus: data.bindingStatus === 'ACTIVE' ? 'ACTIVE' : undefined,
    netDeviceSlotDelta: data.netDeviceSlotDelta === 0 ? 0 : undefined,
    licenseRecreated: data.licenseRecreated === false ? false : undefined,
    licenseChanged: data.licenseChanged === false ? false : undefined,
    sourceBindingChanged: data.sourceBindingChanged === false ? false : undefined,
  };
}

function requireCanonicalSourceId(sourceId: string): void {
  if (!/^src_[a-z0-9]+$/.test(sourceId)) {
    throw new Error('INVALID_CANONICAL_SOURCE_ID');
  }
}

/**
 * Adaptador do cliente autenticado. O user_id local e usado apenas para
 * confirmar a existencia de sessao; ele nunca e enviado para uma RPC.
 */
export class SupabaseManagerRemoteControlPlaneAuthority implements RemoteManagerControlPlaneAuthority {
  private readonly client: ManagerAuthClient;
  readonly auth: ManagerAuthController = {
    getSession: () => this.readManagerSession(),
    signInWithPassword: (email, password) => this.signInWithPassword(email, password),
    signOut: () => this.signOut(),
  };

  constructor(client: ManagerAuthClient, ..._legacyArgs: unknown[]) {
    this.client = client;
  }

  private async readManagerSession(): Promise<ManagerAuthSession | null> {
    try {
      const { data, error } = await this.client.auth.getSession();
      const userId = data.session?.user?.id;
      return !error && userId ? { userId } : null;
    } catch {
      return null;
    }
  }

  async hasAuthenticatedSession(): Promise<boolean> {
    return Boolean(await this.readManagerSession());
  }

  private async signInWithPassword(email: string, password: string): Promise<ManagerAuthSession> {
    try {
      const { data, error } = await this.client.auth.signInWithPassword({ email, password });
      const userId = data.session?.user?.id;
      if (error || !userId) throw new Error('MANAGER_AUTH_LOGIN_FAILED');
      return { userId };
    } catch {
      throw new Error('MANAGER_AUTH_LOGIN_FAILED');
    }
  }

  private async signOut(): Promise<void> {
    try {
      const { error } = await this.client.auth.signOut();
      if (error) throw new Error('MANAGER_AUTH_LOGOUT_FAILED');
    } catch {
      throw new Error('MANAGER_AUTH_LOGOUT_FAILED');
    }
  }

  private async requireAuthenticatedSession(): Promise<void> {
    if (!(await this.hasAuthenticatedSession())) {
      throw new Error('MANAGER_AUTH_REQUIRED');
    }
  }

  private async call(
    functionName: string,
    params: Record<string, unknown>
  ): Promise<unknown> {
    await this.requireAuthenticatedSession();
    try {
      const { data, error } = await this.client.rpc(functionName, params);
      if (error) {
        throw new Error(safeErrorCode(error));
      }
      if (!data) {
        throw new Error('REMOTE_MANAGER_MUTATION_FAILED');
      }
      return data;
    } catch (error) {
      const code = safeErrorCode(error);
      throw new Error(code);
    }
  }

  async readControlPlane(): Promise<ManagerControlPlaneSnapshot> {
    try {
      return normalizeSnapshot(await this.call('rpc_manager_read_control_plane_metadata', {}));
    } catch (error) {
      const code = error instanceof Error &&
        (error.message === 'MANAGER_AUTH_REQUIRED' || error.message === 'MANAGER_NOT_AUTHORIZED')
        ? error.message
        : 'REMOTE_MANAGER_READ_FAILED';
      throw new Error(code);
    }
  }

  async createManagedSource(input: CreateManagedSourceInput): Promise<RemoteSourceMutationConfirmation> {
    requireCanonicalSourceId(input.sourceId);
    return normalizeMutation(await this.call('rpc_manager_create_managed_source_metadata', {
      p_source_id: input.sourceId,
      p_name: input.name,
      p_source_type: input.sourceType,
      p_source_version: input.sourceVersion ?? 1,
    }));
  }

  private async callVaultBoundary(body: Record<string, unknown>): Promise<RemoteSourceMutationConfirmation> {
    await this.requireAuthenticatedSession();
    if (!this.client.functions) {
      throw new Error('REMOTE_VAULT_BOUNDARY_UNAVAILABLE');
    }

    try {
      const { data, error } = await this.client.functions.invoke('managed-source-vault-admin', { body });
      if (error) {
        throw new SanitizedManagerRemoteError(safeErrorCode(error), safeErrorStage(error), error.status);
      }
      if (!data) throw new SanitizedManagerRemoteError('INTERNAL_SANITIZED_ERROR', 'POST_WRITE_RESPONSE');
      return normalizeMutation(data);
    } catch (error) {
      if (error instanceof SanitizedManagerRemoteError) throw error;
      throw new SanitizedManagerRemoteError(safeErrorCode(error), safeErrorStage(error));
    }
  }

  async createManagedSourceWithConfig(
    input: CreateManagedSourceWithConfigInput
  ): Promise<RemoteSourceMutationConfirmation> {
    return this.callVaultBoundary({
      operation: 'CREATE_MANAGED_SOURCE_WITH_CONFIG',
      name: input.name,
      protocol: input.protocol,
      sourceConfig: input.sourceConfig,
    });
  }

  async activateSourceForDevice(
    input: ManagerDeviceActivationInput,
  ): Promise<ManagerDeviceActivationResult> {
    const flowMode = input.flowMode === 'EXISTING_CUSTOMER' ? 'EXISTING_CUSTOMER' : 'NEW_CUSTOMER';
    if (!/^XF-[0-9A-Z]{4}-[0-9A-Z]{4}$/.test(input.displayCode.trim().toUpperCase())) {
      throw new Error('DISPLAY_CODE_INVALID');
    }
    if (!/^[0-9]{6}$/.test(input.activationKey.trim())) {
      throw new Error('ACTIVATION_KEY_INVALID');
    }
    const trimmedLicenseId = typeof input.licenseId === 'string' ? input.licenseId.trim() : '';
    if (trimmedLicenseId && !/^[0-9a-f-]{36}$/i.test(trimmedLicenseId)) {
      throw new Error('LICENSE_ID_INVALID');
    }

    let requestBody: Record<string, unknown>;

    if (flowMode === 'EXISTING_CUSTOMER') {
      const trimmedCustomerId = typeof input.customerId === 'string' ? input.customerId.trim() : '';
      if (!trimmedCustomerId || !/^[0-9a-f-]{36}$/i.test(trimmedCustomerId)) {
        throw new Error('CUSTOMER_ID_REQUIRED');
      }
      const existingCode = typeof input.existingDeviceCode === 'string' ? input.existingDeviceCode.trim().toUpperCase() : '';
      if (!existingCode || !/^XF-[0-9A-Z]{4}-[0-9A-Z]{4}$/.test(existingCode)) {
        throw new Error('EXISTING_DEVICE_CODE_REQUIRED');
      }

      requestBody = {
        operation: 'ACTIVATE_SOURCE_FOR_DEVICE',
        flowMode: 'EXISTING_CUSTOMER',
        displayCode: input.displayCode.trim().toUpperCase(),
        activationKey: input.activationKey.trim(),
        customerId: trimmedCustomerId,
        existingDeviceCode: existingCode,
        ...(trimmedLicenseId ? { licenseId: trimmedLicenseId } : {}),
      };
    } else {
      const trimmedNewCustomerName = typeof input.newCustomerName === 'string' ? input.newCustomerName.trim() : '';
      const trimmedCustomerId = typeof input.customerId === 'string' ? input.customerId.trim() : '';
      if (!trimmedNewCustomerName && !trimmedCustomerId) {
        throw new Error('CUSTOMER_NAME_REQUIRED');
      }
      if (!input.name || !input.name.trim()) {
        throw new Error('INVALID_SOURCE_NAME');
      }
      if (!input.protocol || (input.protocol !== 'M3U' && input.protocol !== 'XTREAM')) {
        throw new Error('INVALID_SOURCE_PROTOCOL');
      }
      if (!input.sourceConfig) {
        throw new Error('SOURCE_CONFIG_REQUIRED');
      }

      requestBody = {
        operation: 'ACTIVATE_SOURCE_FOR_DEVICE',
        flowMode: 'NEW_CUSTOMER',
        displayCode: input.displayCode.trim().toUpperCase(),
        activationKey: input.activationKey.trim(),
        ...(trimmedNewCustomerName ? { newCustomerName: trimmedNewCustomerName } : {}),
        ...(trimmedCustomerId ? { customerId: trimmedCustomerId } : {}),
        ...(trimmedLicenseId ? { licenseId: trimmedLicenseId } : {}),
        name: input.name.trim(),
        protocol: input.protocol,
        sourceConfig: input.sourceConfig,
      };
    }

    await this.requireAuthenticatedSession();
    if (!this.client.functions) throw new SanitizedManagerRemoteError('REMOTE_VAULT_BOUNDARY_UNAVAILABLE', 'INTERNAL');

    try {
      const { data, error } = await this.client.functions.invoke('managed-source-vault-admin', {
        body: requestBody,
      });
      if (error) throw new SanitizedManagerRemoteError(safeErrorCode(error), safeErrorStage(error), error.status);
      if (!isRecord(data) || data.success !== true) {
        throw new SanitizedManagerRemoteError(
          safeErrorCode(new Error(isRecord(data) && typeof data.code === 'string' ? data.code : 'REMOTE_MANAGER_MUTATION_FAILED')),
          'POST_WRITE_RESPONSE',
        );
      }
      if (
        typeof data.deviceId !== 'string' ||
        typeof data.displayCode !== 'string' ||
        typeof data.licenseId !== 'string' ||
        typeof data.sourceId !== 'string' ||
        data.deviceAuthorizationState !== 'AUTHORIZED' ||
        data.sourceBindingStatus !== 'ACTIVE' ||
        (data.licenseStatus !== 'ACTIVE' && data.licenseStatus !== 'TRIAL') ||
        data.sourceResolution !== 'SOURCE_READY'
      ) {
        throw new SanitizedManagerRemoteError('INTERNAL_SANITIZED_ERROR', 'POST_WRITE_RESPONSE');
      }
      return {
        success: true,
        deviceId: data.deviceId,
        displayCode: data.displayCode,
        customerId: typeof data.customerId === 'string' ? data.customerId : undefined,
        licenseId: data.licenseId,
        sourceId: data.sourceId,
        deviceAuthorizationState: 'AUTHORIZED',
        sourceBindingStatus: 'ACTIVE',
        licenseStatus: data.licenseStatus,
        sourceResolution: 'SOURCE_READY',
        sourceReused: data.sourceReused === true,
      };
    } catch (error) {
      if (error instanceof SanitizedManagerRemoteError) throw error;
      throw new SanitizedManagerRemoteError(safeErrorCode(error), safeErrorStage(error));
    }
  }

  async runVaultRuntimePreflight(): Promise<ManagerVaultRuntimePreflight> {
    await this.requireAuthenticatedSession();
    if (!this.client.functions) throw new SanitizedManagerRemoteError('REMOTE_VAULT_BOUNDARY_UNAVAILABLE', 'INTERNAL');

    try {
      const { data, error } = await this.client.functions.invoke('managed-source-vault-admin', {
        body: { operation: 'PREFLIGHT_VAULT_RUNTIME' },
      });
      if (error) {
        throw new SanitizedManagerRemoteError(safeErrorCode(error), safeErrorStage(error), error.status);
      }
      if (!isRecord(data) || data.success !== true || data.preflight !== 'VAULT_RUNTIME') {
        throw new SanitizedManagerRemoteError('INTERNAL_SANITIZED_ERROR', 'POST_WRITE_RESPONSE');
      }
      return {
        success: true,
        preflight: 'VAULT_RUNTIME',
        vaultKeyEnvPresent: data.vaultKeyEnvPresent === true,
        vaultKeyFormatValid: data.vaultKeyFormatValid === true,
        vaultCryptoInitialization: data.vaultCryptoInitialization === 'PASS' ? 'PASS' : 'FAIL',
        callerAuthenticated: data.callerAuthenticated === true,
        callerManagerActive: data.callerManagerActive === true,
        callerManagerRole: data.callerManagerRole === 'ADMIN' || data.callerManagerRole === 'OWNER' || data.callerManagerRole === 'OTHER'
          ? data.callerManagerRole
          : 'UNPROVEN',
        managerAuthorization: data.managerAuthorization === 'PASS' ? 'PASS' : 'DENIED',
        rpcName: 'rpc_manager_update_managed_source_vault',
        rpcPresent: data.rpcPresent === true,
        rpcExecuteAuthenticated: data.rpcExecuteAuthenticated === true,
      };
    } catch (error) {
      if (error instanceof SanitizedManagerRemoteError) throw error;
      throw new SanitizedManagerRemoteError(safeErrorCode(error), safeErrorStage(error));
    }
  }

  async updateManagedSource(input: UpdateManagedSourceInput): Promise<RemoteSourceMutationConfirmation> {
    requireCanonicalSourceId(input.sourceId);
    return normalizeMutation(await this.call('rpc_manager_update_managed_source_metadata', {
      p_source_id: input.sourceId,
      p_expected_version: input.expectedVersion,
      p_name: input.name ?? null,
      p_source_type: input.sourceType ?? null,
    }));
  }

  async updateManagedSourceConfig(
    input: UpdateManagedSourceConfigInput
  ): Promise<RemoteSourceMutationConfirmation> {
    requireCanonicalSourceId(input.sourceId);
    return this.callVaultBoundary({
      operation: 'UPDATE_MANAGED_SOURCE_CONFIG',
      sourceId: input.sourceId,
      expectedVersion: input.expectedVersion,
      name: input.name,
      protocol: input.protocol,
      sourceConfig: input.sourceConfig,
    });
  }

  async setManagedSourceStatus(
    sourceId: string,
    status: 'ACTIVE' | 'DISABLED'
  ): Promise<RemoteSourceMutationConfirmation> {
    requireCanonicalSourceId(sourceId);
    return normalizeMutation(await this.call('rpc_manager_set_managed_source_status_metadata', {
      p_source_id: sourceId,
      p_status: status,
    }));
  }

  async bindDeviceSource(
    licenseId: string,
    deviceId: string,
    sourceId: string
  ): Promise<RemoteSourceMutationConfirmation> {
    requireCanonicalSourceId(sourceId);
    return normalizeMutation(await this.call('rpc_manager_bind_device_source_metadata', {
      p_license_id: licenseId,
      p_device_id: deviceId,
      p_source_id: sourceId,
    }));
  }

  async switchDeviceSource(
    deviceId: string,
    sourceId: string
  ): Promise<RemoteSourceMutationConfirmation> {
    requireCanonicalSourceId(sourceId);
    return normalizeMutation(await this.call('rpc_manager_switch_device_source_metadata', {
      p_device_id: deviceId,
      p_source_id: sourceId,
    }));
  }

  async unbindDeviceSource(deviceId: string): Promise<RemoteSourceMutationConfirmation> {
    return normalizeMutation(await this.call('rpc_manager_unbind_device_source_metadata', {
      p_device_id: deviceId,
    }));
  }

  async replaceDevice(input: DeviceReplacementRequest): Promise<DeviceReplacementConfirmation> {
    return normalizeDeviceReplacement(await this.call('rpc_manager_replace_device_atomic', {
      p_old_device_id: input.oldDeviceId,
      p_new_device_id: input.newDeviceId,
      p_new_device_token_hash: input.newDeviceTokenHash,
      p_new_display_code: input.newDisplayCode,
      p_new_device_type: input.newDeviceType,
      p_new_device_label: input.newDeviceLabel,
    }));
  }

  async listDeviceReactivationRequests(): Promise<ManagerDeviceReactivationRequest[]> {
    return normalizeDeviceReactivationRequests(
      await this.call('rpc_manager_list_device_reactivation_requests', {}),
    );
  }

  async approveDeviceReactivation(requestId: string): Promise<AuthorizedDeviceReactivationConfirmation> {
    if (!/^[0-9a-f-]{36}$/i.test(requestId)) {
      throw new Error('REQUEST_NOT_FOUND');
    }
    return normalizeDeviceReactivationConfirmation(
      await this.call('rpc_manager_approve_device_reactivation', {
        p_request_id: requestId,
      }),
      'REQUEST_APPROVED',
    );
  }

  async cancelDeviceReactivation(requestId: string): Promise<AuthorizedDeviceReactivationConfirmation> {
    if (!/^[0-9a-f-]{36}$/i.test(requestId)) {
      throw new Error('REQUEST_NOT_FOUND');
    }
    return normalizeDeviceReactivationConfirmation(
      await this.call('rpc_manager_cancel_device_reactivation', {
        p_request_id: requestId,
      }),
      ['REQUEST_CANCELLED', 'REQUEST_ALREADY_CANCELLED'],
    );
  }

  async listInstallations(): Promise<ManagerInstallationListItem[]> {
    return normalizeInstallations(
      await this.call('rpc_manager_list_installations', {}),
    );
  }

  async listCustomers(): Promise<ManagerCustomerListItem[]> {
    return normalizeCustomers(
      await this.call('rpc_manager_list_customers', {}),
    );
  }

  async listLicenses(): Promise<ManagerLicenseListItem[]> {
    return normalizeLicenses(
      await this.call('rpc_manager_list_licenses', {}),
    );
  }

  async getLicenseDetail(licenseId: string): Promise<ManagerLicenseDetail> {
    if (!/^[0-9a-f-]{36}$/i.test(licenseId)) {
      throw new Error('LICENSE_ID_REQUIRED');
    }
    return normalizeLicenseDetail(
      await this.call('rpc_manager_get_license_detail', { p_license_id: licenseId }),
    );
  }

  async updateLicenseLimits(
    licenseId: string,
    maxDevices: number,
    maxConcurrentSessions: number,
    reason?: string,
  ): Promise<UpdateLicenseLimitsResult> {
    if (!/^[0-9a-f-]{36}$/i.test(licenseId)) {
      throw new Error('LICENSE_ID_REQUIRED');
    }
    const data = await this.call('rpc_manager_update_license_limits', {
      p_license_id: licenseId,
      p_max_devices: maxDevices,
      p_max_concurrent_sessions: maxConcurrentSessions,
      p_reason: reason ?? null,
    });
    if (!isRecord(data) || data.success !== true) {
      throw new Error('REMOTE_MANAGER_MUTATION_FAILED');
    }
    return {
      success: true,
      licenseId: typeof data.licenseId === 'string' ? data.licenseId : licenseId,
      maxDevices: typeof data.maxDevices === 'number' ? data.maxDevices : maxDevices,
      maxConcurrentSessions: typeof data.maxConcurrentSessions === 'number' ? data.maxConcurrentSessions : maxConcurrentSessions,
      activeDeviceCount: typeof data.activeDeviceCount === 'number' ? data.activeDeviceCount : undefined,
    };
  }

  async suspendLicense(licenseId: string, reason?: string): Promise<SuspendLicenseResult> {
    if (!/^[0-9a-f-]{36}$/i.test(licenseId)) {
      throw new Error('LICENSE_ID_REQUIRED');
    }
    const data = await this.call('rpc_manager_suspend_license', {
      p_license_id: licenseId,
      p_reason: reason ?? null,
    });
    if (!isRecord(data) || data.success !== true) {
      throw new Error('REMOTE_MANAGER_MUTATION_FAILED');
    }
    return {
      success: true,
      licenseId: typeof data.licenseId === 'string' ? data.licenseId : licenseId,
      status: 'SUSPENDED',
      previousStatus: typeof data.previousStatus === 'string' ? data.previousStatus as any : undefined,
    };
  }

  async revokeLicense(licenseId: string, reason?: string): Promise<RevokeLicenseResult> {
    if (!/^[0-9a-f-]{36}$/i.test(licenseId)) {
      throw new Error('LICENSE_ID_REQUIRED');
    }
    const data = await this.call('rpc_manager_revoke_license', {
      p_license_id: licenseId,
      p_reason: reason ?? null,
    });
    if (!isRecord(data) || data.success !== true) {
      throw new Error('REMOTE_MANAGER_MUTATION_FAILED');
    }
    return {
      success: true,
      licenseId: typeof data.licenseId === 'string' ? data.licenseId : licenseId,
      status: 'REVOKED',
      previousStatus: typeof data.previousStatus === 'string' ? data.previousStatus as any : undefined,
    };
  }

  async activateLicenseManual(
    licenseId: string,
    reason: string,
    validUntil?: string | null,
    idempotencyKey?: string | null,
  ): Promise<ManualActivateLicenseResult> {
    if (!/^[0-9a-f-]{36}$/i.test(licenseId)) {
      throw new Error('LICENSE_ID_REQUIRED');
    }
    if (!reason || !reason.trim()) {
      throw new Error('ACTIVATION_REASON_REQUIRED');
    }
    const data = await this.call('rpc_manager_activate_license_manual', {
      p_license_id: licenseId,
      p_reason: reason.trim(),
      p_valid_until: validUntil || null,
      p_idempotency_key: idempotencyKey || null,
    });
    if (!isRecord(data) || data.success !== true) {
      throw new Error('REMOTE_MANAGER_MUTATION_FAILED');
    }
    return {
      success: true,
      licenseId: typeof data.licenseId === 'string' ? data.licenseId : licenseId,
      previousStatus: typeof data.previousStatus === 'string' ? data.previousStatus as any : undefined,
      newStatus: 'ACTIVE',
      effectiveAt: typeof data.effectiveAt === 'string' ? data.effectiveAt : undefined,
      expiresAt: typeof data.expiresAt === 'string' ? data.expiresAt : null,
      activationEventId: typeof data.activationEventId === 'string' ? data.activationEventId : undefined,
      idempotentReplay: Boolean(data.idempotentReplay),
    };
  }

  async getCustomerDetail(customerId: string): Promise<ManagerCustomerDetail> {
    if (!/^[0-9a-f-]{36}$/i.test(customerId)) {
      throw new Error('CUSTOMER_ID_REQUIRED');
    }
    return normalizeCustomerDetail(
      await this.call('rpc_manager_get_customer_detail', { p_customer_id: customerId }),
    );
  }

  async updateCustomerStatus(
    customerId: string,
    status: CustomerStatus,
    reason?: string,
  ): Promise<UpdateCustomerStatusResult> {
    if (!/^[0-9a-f-]{36}$/i.test(customerId)) {
      throw new Error('CUSTOMER_ID_REQUIRED');
    }
    const data = await this.call('rpc_manager_update_customer_status', {
      p_customer_id: customerId,
      p_status: status,
      p_reason: reason ?? null,
    });
    if (!isRecord(data) || data.success !== true) {
      throw new Error('REMOTE_MANAGER_MUTATION_FAILED');
    }
    return {
      success: true,
      customerId: typeof data.customerId === 'string' ? data.customerId : customerId,
      status: typeof data.status === 'string' ? data.status as CustomerStatus : status,
      previousStatus: typeof data.previousStatus === 'string' ? data.previousStatus as CustomerStatus : undefined,
      updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : undefined,
    };
  }

  async listCustomerSources(): Promise<ManagerCustomerSourceListItem[]> {
    return normalizeCustomerSources(
      await this.call('rpc_manager_list_customer_sources', {}),
    );
  }

  async listAuditLogs(limit?: number): Promise<ManagerAuditLogItem[]> {
    return normalizeAuditLogs(
      await this.call('rpc_manager_list_audit_logs', { p_limit: limit ?? 50 }),
    );
  }

  async listDeviceActivationEvents(limit?: number): Promise<ManagerDeviceActivationEvent[]> {
    return normalizeDeviceActivationEvents(
      await this.call('rpc_manager_list_device_activation_events', { p_limit: limit ?? 50 }),
    );
  }

  async revealDeviceSensitiveData(deviceId: string): Promise<ManagerDeviceSensitiveReveal> {
    await this.requireAuthenticatedSession();
    if (!this.client.functions) throw new SanitizedManagerRemoteError('REMOTE_VAULT_BOUNDARY_UNAVAILABLE', 'INTERNAL');
    if (!deviceId.trim()) throw new Error('DEVICE_NOT_FOUND');

    try {
      const { data, error } = await this.client.functions.invoke('manager-sensitive-reveal', {
        body: { operation: 'REVEAL_DEVICE_SENSITIVE', deviceId: deviceId.trim() },
      });
      if (error) throw new SanitizedManagerRemoteError(safeErrorCode(error), safeErrorStage(error), error.status);
      return normalizeDeviceSensitiveReveal(data);
    } catch (error) {
      if (error instanceof SanitizedManagerRemoteError) throw error;
      throw new SanitizedManagerRemoteError(safeErrorCode(error), safeErrorStage(error));
    }
  }
}

/** ID logico gerado sem qualquer derivacao de host, URL ou credencial. */
export function createCanonicalSourceId(): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = new Uint8Array(10);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }
  return `src_${Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('')}`;
}

export function sanitizeManagerErrorMessage(error: unknown): string {
  const code = safeErrorCode(error);
  const stage = safeErrorStage(error);
  switch (code) {
    case 'MANAGER_AUTH_REQUIRED':
      return 'Sessao Supabase autenticada obrigatoria para mutacoes do Manager.';
    case 'MANAGER_NOT_AUTHORIZED':
      return 'Usuario autenticado sem autorizacao ativa de Manager.';
    case 'MASTER_MANAGER_NOT_AUTHORIZED':
      return 'Apenas o Gestor Master pode revelar dados protegidos.';
    case 'DEVICE_NOT_FOUND':
      return 'Dispositivo nao encontrado no plano de controle.';
    case 'REVEAL_DECRYPT_FAILED':
      return 'Nao foi possivel revelar os dados protegidos.';
    case 'MANAGER_AUTH_LOGIN_FAILED':
      return 'Nao foi possivel autenticar a sessao do gestor.';
    case 'MANAGER_AUTH_LOGOUT_FAILED':
      return 'Nao foi possivel encerrar a sessao do gestor.';
    case 'AUTH_REQUIRED':
      return 'A Edge Function recusou a sessao autenticada do Manager.';
    case 'VAULT_KEY_MISSING':
      return `Runtime do vault sem chave configurada (${code}/${stage}).`;
    case 'VAULT_KEY_INVALID':
      return `Runtime do vault com chave invalida (${code}/${stage}).`;
    case 'VAULT_ENCRYPT_FAILED':
      return `Falha sanitizada na criptografia do vault (${code}/${stage}).`;
    case 'RPC_FAILED':
      return `Falha sanitizada na RPC do Control Plane (${code}/${stage}).`;
    case 'DATABASE_PERMISSION_DENIED':
      return `Permissao negada pela boundary do Control Plane (${code}/${stage}).`;
    case 'INTERNAL_SANITIZED_ERROR':
      return `Falha interna sanitizada do Control Plane (${code}/${stage}).`;
    case 'VERSION_CONFLICT':
      return 'A fonte foi alterada remotamente. Recarregue os dados antes de salvar novamente.';
    case 'REMOTE_MANAGER_METADATA_ONLY':
      return 'Configuracao protegida indisponivel; a mutacao foi bloqueada em fail-closed.';
    case 'SOURCE_NOT_FOUND':
      return 'Fonte gerenciada nao encontrada no Control Plane remoto.';
    case 'SOURCE_NOT_ACTIVE':
      return 'A fonte gerenciada nao esta ativa.';
    case 'BINDING_NOT_FOUND':
      return 'Vinculo de fonte nao encontrado no Control Plane remoto.';
    case 'DEVICE_NOT_AUTHORIZED':
      return 'Dispositivo nao autorizado para esta operacao.';
    case 'CROSS_CUSTOMER_BINDING_DENIED':
      return 'Dispositivo e licenca nao pertencem ao mesmo vinculo autorizado.';
    case 'DEVICE_ALREADY_BOUND_USE_SWITCH':
      return 'O dispositivo ja possui uma fonte; use a troca atomica de fonte.';
    case 'OLD_DEVICE_NOT_FOUND':
      return 'O dispositivo autorizado anterior nao foi encontrado.';
    case 'OLD_DEVICE_REVOKED':
      return 'O dispositivo anterior ja foi revogado.';
    case 'OLD_DEVICE_NOT_AUTHORIZED':
      return 'O dispositivo anterior nao esta autorizado.';
    case 'NEW_DEVICE_CONFLICT':
      return 'O novo dispositivo ja possui um vinculo ou estado incompatível.';
    case 'LICENSE_INVALID':
      return 'A licenca do dispositivo anterior nao esta ativa.';
    case 'LICENSE_MODE_INVALID':
      return 'A substituicao atomica exige uma licenca gerenciada.';
    case 'SOURCE_BINDING_INVALID':
      return 'O vinculo de fonte do dispositivo anterior nao foi encontrado.';
    case 'SOURCE_INVALID':
      return 'A fonte vinculada nao esta ativa.';
    case 'TOKEN_HASH_INVALID':
      return 'O novo token nao passou na validacao segura.';
    case 'INVALID_DEVICE_ID':
    case 'INVALID_DEVICE_METADATA':
      return 'Os metadados do novo dispositivo sao invalidos.';
    case 'DEVICE_REPLACEMENT_CONFLICT':
      return 'A substituicao do dispositivo entrou em conflito; nenhuma alteracao foi confirmada.';
    case 'CUSTOMER_NOT_FOUND':
      return 'Cliente nao encontrado no sistema.';
    case 'INVALID_CUSTOMER_STATUS':
      return 'Status de cliente invalido informado.';
    case 'CUSTOMER_ID_REQUIRED':
      return 'Identificador do cliente e obrigatorio.';
    case 'LICENSE_NOT_FOUND':
      return 'Licenca nao encontrada no sistema.';
    case 'LICENSE_ID_REQUIRED':
      return 'Identificador da licenca e obrigatorio.';
    case 'INVALID_MAX_DEVICES':
      return 'Limite maximo de dispositivos invalido (deve ser entre 1 e 100).';
    case 'INVALID_MAX_CONCURRENT_SESSIONS':
      return 'Limite maximo de sessoes simultaneas invalido (deve ser entre 1 e 50).';
    case 'CANNOT_REDUCE_BELOW_ACTIVE_DEVICES':
      return 'Proibido reduzir max_devices abaixo da quantidade atual de dispositivos ativos.';
    case 'CANNOT_SUSPEND_REVOKED_LICENSE':
      return 'Nao e possivel suspender uma licenca que ja foi revogada.';
    case 'EXISTING_DEVICE_CODE_REQUIRED':
      return 'Codigo do dispositivo ja vinculado e obrigatorio.';
    case 'EXISTING_DEVICE_NOT_FOUND':
      return 'Dispositivo ja vinculado informado nao foi localizado.';
    case 'EXISTING_DEVICE_CUSTOMER_MISMATCH':
      return 'Dispositivo informado nao pertence ao cliente selecionado.';
    case 'CUSTOMER_NAME_REQUIRED':
      return 'Nome do cliente e obrigatorio para novo cliente.';
    case 'CUSTOMER_PROFILE_NOT_FOUND':
      return 'Perfil de cliente nao encontrado.';
    case 'CUSTOMER_PROFILE_NOT_ACTIVE':
      return 'Perfil de cliente nao esta ativo.';
    case 'CUSTOMER_HAS_NO_ACTIVE_SOURCE':
      return 'Cliente nao possui nenhuma fonte gerenciada ativa.';
    case 'CUSTOMER_SOURCE_AMBIGUOUS':
      return 'Cliente possui multiplas fontes ativas; resolucao ambigua.';
    case 'NO_ELIGIBLE_MANAGED_LICENSE':
      return 'Nenhuma licenca gerenciada ativa encontrada para o cliente.';
    case 'MANAGED_LICENSE_CAPACITY_EXHAUSTED':
      return 'Capacidade de dispositivos da licenca gerenciada esgotada.';
    case 'MANAGED_LICENSE_AMBIGUOUS':
      return 'Cliente possui multiplas licencas gerenciadas ativas elegiveis.';
    case 'SOURCE_CONFIG_REQUIRED':
      return 'Configuracao de fonte e obrigatoria para novo cliente.';
    default:
      return 'Falha remota do Control Plane; nenhuma alteracao local foi confirmada.';
  }
}

let configuredManagerRemoteAuthority: RemoteManagerControlPlaneAuthority | undefined;

export function configureManagerRemoteControlPlaneAuthority(
  authority: RemoteManagerControlPlaneAuthority | undefined
): void {
  configuredManagerRemoteAuthority = authority;
}

export function getManagerRemoteControlPlaneAuthority(): RemoteManagerControlPlaneAuthority | undefined {
  return configuredManagerRemoteAuthority;
}
