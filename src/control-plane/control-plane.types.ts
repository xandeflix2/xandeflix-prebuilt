/**
 * Xandeflix Prebuilt — Control Plane Contracts (Experiment R7B)
 *
 * Contratos centrais para o plano de controle de licenças, dispositivos e bindings de fonte.
 *
 * Princípios:
 * - CONTROL_PLANE_ONLY: O plano de controle gerencia apenas direitos (entitlements), slots e autorizações.
 * - ZERO_CATALOG_PROCESSING: Proibido baixar, interpretar, indexar ou persistir catálogos/streams no backend.
 * - SECURITY_HASHED_SECRETS: License keys e device auth tokens trafegam em forma de hash no backend.
 */

import type { DeviceType, ActivationStatus, LicenseMode } from '../device/device.types.ts';
import type { SourceType } from '../debug/source/source-runtime-config.ts';

export type LicenseStatus = 'TRIAL' | 'ACTIVE' | 'REVOKED' | 'EXPIRED' | 'SUSPENDED';

export interface LicenseEntity {
  id: string;
  licenseKeyHash: string;
  mode: LicenseMode;
  status: LicenseStatus;
  maxDevices: number;
  maxConcurrentSessions?: number;
  trialEligible?: boolean;
  trialStartedAtIso?: string;
  trialExpiresAtIso?: string;
  customerId?: string; // Nullable para legado / backward-compatibility
  createdAtIso: string;
  expiresAtIso?: string;
}

export interface DeviceEntity {
  id: string;
  deviceId: string;
  displayCode: string;
  deviceType: DeviceType;
  deviceLabel: string;
  status: 'UNREGISTERED' | 'PENDING_MANAGER_APPROVAL' | 'AUTHORIZED' | 'REVOKED';
  deviceTokenHash?: string;
  createdAtIso: string;
  lastSeenAtIso?: string;
}

/** Dados sensíveis devolvidos apenas pelo boundary server-side do Gestor Master. */
export interface ManagerDeviceSensitiveReveal {
  device: {
    deviceId: string;
    displayCode: string;
    deviceType: DeviceType;
    deviceLabel: string;
    status: DeviceEntity['status'];
    licenseId: string | null;
    licenseStatus: string | null;
  };
  permanentActivationKey: string | null;
  source: {
    sourceId: string;
    sourceVersion: number;
    protocol: string;
    displayName: string;
    sourceStatus: string;
    config: Record<string, unknown> | null;
  } | null;
}

export interface LicenseDeviceBindingEntity {
  id: string;
  licenseId: string;
  deviceId: string;
  status: 'ACTIVE' | 'REVOKED';
  boundAtIso: string;
  revokedAtIso?: string;
}

export interface ManagedSourceEntity {
  id: string;
  name: string;
  sourceType: SourceType;
  /** Campo legado somente no entity local do LAB; nunca faz parte do DTO remoto. */
  [legacyField: string]: any;
  version: number; // Versionamento monotônico (1, 2, 3...)
  status: 'ACTIVE' | 'DISABLED'; // Estado operacional da fonte gerenciada
  createdAtIso: string;
  updatedAtIso: string;
}

/** DTO remoto transitional; nao inclui dados da configuracao real da source. */
export interface RemoteManagedSourceMetadata {
  id: string;
  sourceId: string;
  name: string;
  sourceType: SourceType;
  version: number;
  status: 'ACTIVE' | 'DISABLED';
  vaultStatus: 'CONFIGURED' | 'NOT_CONFIGURED';
  createdAtIso: string;
  updatedAtIso: string;
}

export interface DeviceSourceBindingEntity {
  id: string;
  licenseId: string;
  deviceId: string;
  sourceId: string;
  createdAtIso: string;
}

export type SourceProtocol = 'M3U' | 'XTREAM';

export type ManagedSourceStatus = 'ACTIVE' | 'DISABLED';

export type SupportContactType = 'WHATSAPP' | 'EMAIL' | 'URL' | 'TEXT';

export interface ControlPlaneSettings {
  supportContactType?: SupportContactType;
  supportContactLabel?: string;
  supportContactValue?: string;
}

export interface DeviceActivationRequest {
  licenseKey: string;
  deviceId: string;
  displayCode: string;
  deviceType: DeviceType;
  deviceLabel: string;
}

export interface DeviceActivationResponse {
  success: boolean;
  status: ActivationStatus;
  mode?: LicenseMode;
  deviceAuthToken?: string;
  message?: string;
  supportContact?: ControlPlaneSettings;
}

export type SourceResolutionStatus =
  | 'SOURCE_READY'
  | 'SOURCE_ACTION_REQUIRED'
  | 'SOURCE_NOT_BOUND'
  | 'LICENSE_INVALID'
  | 'DEVICE_NOT_AUTHORIZED'
  | 'DEVICE_REVOKED';

export interface SourceResolutionRequest {
  deviceId: string;
  deviceAuthToken: string;
}

export interface RemoteSourceAuthorizationMetadata {
  status: SourceResolutionStatus;
  mode?: LicenseMode;
  licenseId?: string;
  licenseStatus?: LicenseStatus;
  sourceId?: string; // Identidade canônica da entidade ManagedSource
  protocol?: SourceProtocol;
  sourceStatus?: ManagedSourceStatus;
  sourceVersion?: number; // Versão monotônica da fonte gerenciada no plano de controle
  supportContact?: ControlPlaneSettings;
  message?: string;
}

/** Contrato local legado amplo; nao e aceito pelo novo transporte remoto. */
export interface SourceResolutionResponse extends RemoteSourceAuthorizationMetadata {
  [key: string]: unknown;
}

/** Alias nominal de compatibilidade, sem envelope ou configuracao protegida. */
export type RemoteSourceResolutionResponse = RemoteSourceAuthorizationMetadata;

export type InstallationStatus = 'OBSERVED' | 'PAIRED' | 'STALE';

export interface AppInstallationEntity {
  installationId: string;
  deviceId: string;
  displayCode: string;
  packageName: string;
  platform: 'ANDROID' | 'WEB' | 'IOS' | 'OTHER';
  deviceType: DeviceType;
  manufacturer?: string;
  model?: string;
  appVersion: string;
  buildNumber?: string;
  status: InstallationStatus;
  firstSeenAtIso: string;
  lastSeenAtIso: string;
  createdAtIso: string;
  updatedAtIso: string;
}

export interface AppInstallationReportPayload {
  installationId: string;
  deviceId: string;
  displayCode: string;
  packageName: string;
  platform?: 'ANDROID' | 'WEB' | 'IOS' | 'OTHER';
  deviceType?: DeviceType;
  manufacturer?: string;
  model?: string;
  appVersion: string;
  buildNumber?: string;
}

export interface AppInstallationReportResponse {
  success: boolean;
  installationId?: string;
  status?: InstallationStatus;
  firstSeenAt?: string;
  lastSeenAt?: string;
  message?: string;
}

export interface ManagerInstallationListItem {
  installationId: string;
  deviceId: string;
  displayCode: string;
  packageName: string;
  platform: 'ANDROID' | 'WEB' | 'IOS' | 'OTHER';
  deviceType: DeviceType;
  manufacturer?: string;
  model?: string;
  appVersion: string;
  buildNumber?: string;
  status: InstallationStatus;
  firstSeenAt: string;
  lastSeenAt: string;
  deviceCorrelation?: {
    isKnownDevice: boolean;
    deviceStatus: string;
    deviceLabel?: string;
    registeredAt?: string;
  };
}

export type CustomerStatus = 'ACTIVE' | 'SUSPENDED' | 'BLOCKED';

export interface CustomerProfileEntity {
  id: string; // auth.users.id
  customerId: string; // alias
  nickname: string;
  status: CustomerStatus;
  createdAtIso: string;
  updatedAtIso: string;
}

export interface CustomerProfileResponse {
  success: boolean;
  customerId?: string;
  nickname?: string;
  status?: CustomerStatus;
  createdAt?: string;
  updatedAt?: string;
  code?: string;
  message?: string;
}

export interface ManagerCustomerListItem {
  customerId: string;
  nickname: string;
  status: CustomerStatus;
  createdAt: string;
  updatedAt: string;
  licensesCount: number;
}

// =============================================================================
// C4: DEVICE PAIRING TYPES
// =============================================================================

export type PairingStatus = 'PENDING' | 'CONSUMED' | 'EXPIRED' | 'CANCELLED';

export interface DevicePairingRequestParams {
  installationId: string;
  deviceId: string;
  displayCode: string;
  deviceTokenHash: string;
  deviceType?: DeviceType;
  deviceLabel?: string;
}

export interface DevicePairingRequestResult {
  success: boolean;
  pairingId?: string;
  pairingCode?: string;
  pairingStatusSecret?: string;
  displayCode?: string;
  expiresAt?: string;
  status?: PairingStatus;
  code?: string;
  message?: string;
}

export interface DevicePairingStatusResult {
  success: boolean;
  pairingId?: string;
  status?: PairingStatus;
  expiresAt?: string;
  deviceAuthorizationState?: 'AUTHORIZED' | 'UNREGISTERED' | 'REVOKED';
  licenseId?: string;
  consumedAt?: string;
  code?: string;
  message?: string;
}

export interface CustomerPairDeviceParams {
  displayCode: string;
  pairingCode: string;
  deviceLabel?: string;
  licenseId?: string;
}

export interface CustomerPairDeviceResult {
  success: boolean;
  pairingId?: string;
  deviceId?: string;
  displayCode?: string;
  licenseId?: string;
  customerId?: string;
  status?: PairingStatus;
  deviceAuthorizationState?: 'AUTHORIZED';
  trial?: {
    trialStarted: boolean;
    status?: LicenseStatus;
    trialStartedAt?: string;
    trialExpiresAt?: string;
    maxDevices?: number;
    maxConcurrentSessions?: number;
    reason?: string;
  };
  code?: string;
  message?: string;
}

// =============================================================================
// A1: REMOTE DEVICE ACTIVATION TYPES
// =============================================================================

export type DeviceActivationStatus = 'PENDING' | 'CONSUMED' | 'CANCELLED';

export interface DeviceActivationRequestParams {
  installationId: string;
  deviceId: string;
  displayCode: string;
  deviceTokenHash: string;
  activationKeyHash: string;
  deviceType?: DeviceType;
  deviceLabel?: string;
}

export interface DeviceActivationRequestResult {
  success: boolean;
  activationId?: string;
  activationStatusSecret?: string;
  displayCode?: string;
  status?: DeviceActivationStatus;
  code?: string;
  message?: string;
}

export interface DeviceActivationStatusResult {
  success: boolean;
  activationId?: string;
  status?: 'PENDING' | 'CONSUMED' | 'CANCELLED';
  deviceAuthorizationState?: 'AUTHORIZED' | 'UNREGISTERED' | 'REVOKED';
  licenseId?: string;
  licenseStatus?: LicenseStatus;
  sourceId?: string;
  claimedAt?: string;
  code?: string;
  message?: string;
}

export interface CustomerActivateDeviceParams {
  displayCode: string;
  activationKey: string;
  sourceId: string;
  deviceLabel?: string;
  licenseId?: string;
}

export interface CustomerActivateDeviceResult {
  success: boolean;
  status?: DeviceActivationStatus;
  deviceAuthorizationState?: 'AUTHORIZED';
  deviceId?: string;
  displayCode?: string;
  licenseId?: string;
  sourceId?: string;
  trial?: {
    trialStarted?: boolean;
    status?: LicenseStatus;
    trialStartedAt?: string;
    trialExpiresAt?: string;
    maxDevices?: number;
    maxConcurrentSessions?: number;
    reason?: string;
  };
  code?: string;
  message?: string;
}

export type LicenseAccessCode =
  | 'ACCESS_ALLOWED'
  | 'TRIAL_ACTIVE'
  | 'TRIAL_EXPIRED'
  | 'TRIAL_NOT_STARTED'
  | 'LICENSE_ACTIVE'
  | 'LICENSE_EXPIRED'
  | 'LICENSE_SUSPENDED'
  | 'LICENSE_REVOKED'
  | 'DEVICE_NOT_AUTHORIZED'
  | 'INVALID_LICENSE'
  | 'UNKNOWN_STATUS';

export interface LicenseAccessEvaluationParams {
  licenseId: string;
  deviceId?: string;
}

export interface LicenseAccessEvaluationResult {
  accessAllowed: boolean;
  code: LicenseAccessCode;
  licenseStatus?: LicenseStatus;
  isTrial?: boolean;
  trialStartedAt?: string;
  trialExpiresAt?: string;
  serverTime?: string;
  message?: string;
}

// =============================================================================
// C6: REMOTE SELF-SERVICE SOURCE & VAULT TYPES
// =============================================================================

export type CustomerSourceType = 'M3U' | 'M3U8' | 'XTREAM';
export type CustomerSourceStatus = 'ACTIVE' | 'DISABLED' | 'REVOKED';

export interface CustomerSourceEntity {
  sourceId: string;
  customerId: string;
  licenseId: string;
  displayName: string;
  sourceType: CustomerSourceType;
  status: CustomerSourceStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerSourceConfigM3U {
  playlistUrl: string;
  token?: string;
  runtimeOptions?: Record<string, unknown>;
}

export interface CustomerSourceConfigXtream {
  endpoint: string;
  username: string;
  password: string;
  token?: string;
  runtimeOptions?: Record<string, unknown>;
}

export type CustomerSourceConfig = CustomerSourceConfigM3U | CustomerSourceConfigXtream;

export interface CreateCustomerSourceParams {
  licenseId: string;
  sourceType: CustomerSourceType;
  displayName: string;
  sourceConfig?: CustomerSourceConfig;
  ciphertext?: string;
  nonce?: string;
  authTag?: string;
  keyVersion?: string;
}

export interface CreateCustomerSourceResult {
  success: boolean;
  sourceId?: string;
  licenseId?: string;
  displayName?: string;
  sourceType?: CustomerSourceType;
  status?: CustomerSourceStatus;
  version?: number;
  createdAt?: string;
  updatedAt?: string;
  code?: string;
  message?: string;
}

export interface UpdateCustomerSourceParams {
  sourceId: string;
  sourceType?: CustomerSourceType;
  displayName?: string;
  expectedVersion?: number;
  sourceConfig?: CustomerSourceConfig;
  ciphertext?: string;
  nonce?: string;
  authTag?: string;
  keyVersion?: string;
}

export interface UpdateCustomerSourceResult {
  success: boolean;
  sourceId?: string;
  displayName?: string;
  sourceType?: CustomerSourceType;
  status?: CustomerSourceStatus;
  version?: number;
  credentialsRotated?: boolean;
  code?: string;
  message?: string;
}

export interface ListCustomerSourcesResult {
  success: boolean;
  sources?: CustomerSourceEntity[];
  code?: string;
  message?: string;
}

export interface DisableCustomerSourceResult {
  success: boolean;
  sourceId?: string;
  status?: CustomerSourceStatus;
  code?: string;
  message?: string;
}

export interface DeviceResolveSelfServiceSourceParams {
  deviceId: string;
  deviceToken: string;
  licenseId: string;
}

export interface DeviceResolveSelfServiceSourceResult {
  success: boolean;
  sourceId?: string;
  sourceVersion?: number;
  sourceType?: CustomerSourceType;
  protocol?: CustomerSourceType;
  displayName?: string;
  sourceConfig?: Record<string, unknown>;
  ciphertext?: string;
  nonce?: string;
  authTag?: string;
  keyVersion?: string;
  code?: string;
  message?: string;
  licenseStatus?: LicenseStatus;
}

// =============================================================================
// C8: ADMIN LICENSE & CUSTOMER MANAGEMENT TYPES
// =============================================================================

export interface ManagerLicenseListItem {
  licenseId: string;
  customerId: string | null;
  customerNickname: string | null;
  mode: LicenseMode;
  status: LicenseStatus;
  trialEligible: boolean;
  trialStartedAt: string | null;
  trialExpiresAt: string | null;
  maxDevices: number;
  maxConcurrentSessions: number;
  activeDeviceCount: number;
  sourceSummary?: {
    hasManagedSource: boolean;
    hasCustomerSource: boolean;
  };
  createdAt: string;
  expiresAt: string | null;
}

export interface ManagerLicenseDetailDeviceItem {
  deviceId: string;
  displayCode: string;
  deviceType: DeviceType;
  deviceLabel: string;
  status: string;
  boundAt: string;
  lastSeenAt?: string;
}

export interface ManagerLicenseDetailManagedSourceItem {
  sourceId: string;
  name: string;
  sourceType: SourceType;
  version: number;
  status: 'ACTIVE' | 'DISABLED';
}

export interface ManagerLicenseDetailCustomerSourceItem {
  sourceId: string;
  displayName: string;
  sourceType: CustomerSourceType;
  status: CustomerSourceStatus;
  version: number;
  hasCredentials: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ManagerLicenseDetail {
  success: boolean;
  license: {
    licenseId: string;
    customerId: string | null;
    mode: LicenseMode;
    status: LicenseStatus;
    trialEligible: boolean;
    trialStartedAt: string | null;
    trialExpiresAt: string | null;
    maxDevices: number;
    maxConcurrentSessions: number;
    createdAt: string;
    expiresAt: string | null;
  };
  customer: {
    customerId: string;
    nickname: string;
    status: CustomerStatus;
  } | null;
  devices: ManagerLicenseDetailDeviceItem[];
  managedSources: ManagerLicenseDetailManagedSourceItem[];
  customerSources: ManagerLicenseDetailCustomerSourceItem[];
}

export interface ManagerCustomerDetail {
  success: boolean;
  customer: {
    customerId: string;
    nickname: string;
    status: CustomerStatus;
    trialUsedAt: string | null;
    createdAt: string;
    updatedAt: string;
  };
  licenses: Array<{
    licenseId: string;
    mode: LicenseMode;
    status: LicenseStatus;
    trialEligible: boolean;
    trialStartedAt: string | null;
    trialExpiresAt: string | null;
    maxDevices: number;
    maxConcurrentSessions: number;
    activeDevicesCount: number;
    createdAt: string;
    expiresAt: string | null;
  }>;
  devices: Array<{
    deviceId: string;
    displayCode: string;
    deviceType: DeviceType;
    deviceLabel: string;
    status: string;
    licenseId: string;
    boundAt: string;
    lastSeenAt?: string;
  }>;
  sources: Array<{
    sourceId: string;
    licenseId: string;
    displayName: string;
    sourceType: CustomerSourceType;
    status: CustomerSourceStatus;
    version: number;
    hasCredentials: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
}

export interface ManagerAuditLogItem {
  id: string;
  managerId: string;
  action: 'CUSTOMER_STATUS_CHANGED' | 'LICENSE_LIMITS_CHANGED' | 'LICENSE_SUSPENDED' | 'LICENSE_REVOKED';
  targetType: 'CUSTOMER' | 'LICENSE';
  targetId: string;
  beforeState: Record<string, unknown> | null;
  afterState: Record<string, unknown> | null;
  reason: string | null;
  createdAt: string;
}

export type ManagerDeviceActivationEventAction =
  | 'DEVICE_ACTIVATION_COMPLETED'
  | 'DEVICE_ACTIVATION_REJECTED'
  | 'DEVICE_ACTIVATION_SOURCE_BOUND'
  | 'DEVICE_ACTIVATION_ADMIN_BOUND';

export interface ManagerDeviceActivationEvent {
  id: string;
  activationId: string | null;
  customerId: string | null;
  licenseId: string | null;
  deviceId: string;
  displayCode: string;
  sourceId: string | null;
  action: ManagerDeviceActivationEventAction;
  result: 'SUCCESS' | 'REJECTED';
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface ManagerCustomerSourceListItem {
  sourceId: string;
  customerId: string;
  customerNickname: string;
  licenseId: string;
  displayName: string;
  sourceType: CustomerSourceType;
  status: CustomerSourceStatus;
  version: number;
  hasCredentials: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateLicenseLimitsResult {
  success: boolean;
  licenseId: string;
  maxDevices: number;
  maxConcurrentSessions: number;
  activeDeviceCount?: number;
}

export interface SuspendLicenseResult {
  success: boolean;
  licenseId: string;
  status: 'SUSPENDED';
  previousStatus?: LicenseStatus;
}

export interface RevokeLicenseResult {
  success: boolean;
  licenseId: string;
  status: 'REVOKED';
  previousStatus?: LicenseStatus;
}

export interface UpdateCustomerStatusResult {
  success: boolean;
  customerId: string;
  status: CustomerStatus;
  previousStatus?: CustomerStatus;
  updatedAt?: string;
}

export type { LicenseMode };

// -----------------------------------------------------------------------------
// GATE C9: CONCURRENT PLAYBACK SESSION ENFORCEMENT TYPES
// -----------------------------------------------------------------------------

export type PlaybackSessionStatus = 'ACTIVE' | 'CLOSED' | 'STALE';

export interface PlaybackSessionEntity {
  id: string;
  licenseId: string;
  deviceId: string;
  sessionTokenHash: string;
  status: PlaybackSessionStatus;
  createdAtIso: string;
  lastHeartbeatAtIso: string;
  closedAtIso?: string;
  closeReason?: string;
  metadata?: Record<string, unknown>;
}

export interface DeviceStartPlaybackSessionRequest {
  licenseId: string;
  deviceId: string;
  deviceToken: string;
  metadata?: Record<string, unknown>;
  clientNowIso?: string; // Para testes de independência temporal
}

export interface DeviceStartPlaybackSessionResponse {
  success: boolean;
  sessionId?: string;
  sessionToken?: string;
  licenseId?: string;
  deviceId?: string;
  status?: PlaybackSessionStatus;
  heartbeatIntervalSeconds?: number;
  staleSessionSeconds?: number;
  createdAt?: string;
  code?: string;
  message?: string;
  maxConcurrentSessions?: number;
  activeSessions?: number;
}

export interface DeviceHeartbeatPlaybackSessionRequest {
  sessionId: string;
  deviceId: string;
  sessionToken: string;
  clientNowIso?: string;
}

export interface DeviceHeartbeatPlaybackSessionResponse {
  success: boolean;
  sessionId?: string;
  status?: PlaybackSessionStatus;
  lastHeartbeatAt?: string;
  code?: string;
  message?: string;
  sessionStatus?: PlaybackSessionStatus;
}

export interface DeviceClosePlaybackSessionRequest {
  sessionId: string;
  deviceId: string;
  sessionToken: string;
  closeReason?: string;
}

export interface DeviceClosePlaybackSessionResponse {
  success: boolean;
  sessionId?: string;
  status?: PlaybackSessionStatus;
  code?: string;
  message?: string;
}

export interface CustomerPlaybackSessionListItem {
  sessionId: string;
  licenseId: string;
  deviceId: string;
  deviceDisplayCode: string;
  deviceLabel: string;
  deviceType: string;
  status: PlaybackSessionStatus;
  createdAt: string;
  lastHeartbeatAt: string;
  closedAt?: string | null;
  closeReason?: string | null;
}

export interface ManagerPlaybackSessionListItem extends CustomerPlaybackSessionListItem {
  customerId?: string | null;
  customerNickname?: string | null;
}

// -----------------------------------------------------------------------------
// GATE C10: PAYMENT EVIDENCE & MANUAL ACTIVATION TYPES
// -----------------------------------------------------------------------------

export type ActivationType = 'MANUAL_MANAGER' | 'PROVIDER_WEBHOOK';
export type PaymentStatus = 'PENDING' | 'CONFIRMED' | 'FAILED' | 'CANCELLED' | 'REFUNDED';

export interface CommercialActivationEvent {
  id: string;
  customerId: string | null;
  licenseId: string;
  activationType: ActivationType;
  paymentStatus: PaymentStatus;
  amountMinor: number | null;
  currency: string | null;
  externalReference: string | null;
  periodStart: string;
  periodEnd: string | null;
  createdByManagerId: string | null;
  idempotencyKey: string | null;
  providerEventId: string | null;
  createdAt: string;
  metadata: Record<string, unknown>;
}

export interface ManualActivateLicenseParams {
  licenseId: string;
  reason: string;
  validUntil?: string | null;
  idempotencyKey?: string | null;
  clientNowIso?: string; // Para testes de independência temporal
}

export interface ManualActivateLicenseResult {
  success: boolean;
  licenseId?: string;
  previousStatus?: LicenseStatus;
  newStatus?: LicenseStatus;
  effectiveAt?: string;
  expiresAt?: string | null;
  activationEventId?: string;
  idempotentReplay?: boolean;
  code?: string;
  message?: string;
}

// Modelagem de interface futura para provider (Stripe, Mercado Pago, etc.)
export interface PaymentProviderEvent {
  provider: string;
  providerEventId: string;
  eventType: string;
  paymentReference: string;
  amount: number;
  currency: string;
  occurredAt: string;
  customerReference?: string;
  licenseReference?: string;
  signature?: string;
}
