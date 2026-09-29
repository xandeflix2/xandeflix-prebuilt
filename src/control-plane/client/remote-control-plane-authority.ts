/**
 * Xandeflix Prebuilt — Remote Control Plane Authority (R2C).
 * Resolve apenas entitlement, binding e metadata da ManagedSource.
 */

import type {
  DeviceActivationRequest,
  DeviceActivationResponse,
  LicenseStatus,
  RemoteSourceAuthorizationMetadata,
  SourceResolutionRequest,
} from '../control-plane.types.ts';
import type {
  AuthorizedDeviceReactivationConfirmation,
  AuthorizedDeviceReactivationFinalizeRequest,
  AuthorizedDeviceReactivationPending,
  AuthorizedDeviceReactivationRequest,
} from '../device-reactivation.types.ts';
import { ControlPlaneCrypto } from '../crypto/control-plane-crypto.ts';
import type { ControlPlaneEngine } from '../engine/control-plane-engine.ts';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isLicenseStatus(value: unknown): value is LicenseStatus {
  return value === 'TRIAL' || value === 'ACTIVE' || value === 'REVOKED' || value === 'EXPIRED' || value === 'SUSPENDED';
}

export interface RemoteControlPlaneAuthority {
  resolveAuthorizedDeviceSource(
    req: SourceResolutionRequest
  ): Promise<RemoteSourceAuthorizationMetadata>;
  activateDevice?(req: DeviceActivationRequest): Promise<DeviceActivationResponse>;
  requestAuthorizedDeviceReactivation?(
    req: AuthorizedDeviceReactivationRequest
  ): Promise<AuthorizedDeviceReactivationPending>;
  finalizeAuthorizedDeviceReactivation?(
    req: AuthorizedDeviceReactivationFinalizeRequest
  ): Promise<AuthorizedDeviceReactivationConfirmation>;
}

export interface RemoteRpcClient {
  rpc(
    functionName: string,
    params: Record<string, unknown>
  ): Promise<{ data: unknown; error?: { message?: string } | null }>;
}

/** Adaptador de RPC para a migration Supabase R2C. */
export class SupabaseRemoteControlPlaneAuthority implements RemoteControlPlaneAuthority {
  private readonly rpcClient: RemoteRpcClient;

  constructor(rpcClient: RemoteRpcClient, ..._legacyArgs: unknown[]) {
    this.rpcClient = rpcClient;
  }

  async resolveAuthorizedDeviceSource(
    req: SourceResolutionRequest
  ): Promise<RemoteSourceAuthorizationMetadata> {
    const deviceTokenHash = await ControlPlaneCrypto.sha256(req.deviceAuthToken);
    const { data, error } = await this.rpcClient.rpc('rpc_resolve_authorized_source_metadata', {
      p_device_id: req.deviceId,
      p_device_token_hash: deviceTokenHash,
    });

    if (error || !data || typeof data !== 'object') {
      throw new Error('REMOTE_AUTHORITY_UNAVAILABLE');
    }

    const response = data as Record<string, unknown>;
    if (typeof response.status !== 'string') {
      throw new Error('REMOTE_AUTHORITY_UNAVAILABLE');
    }

    return {
      status: response.status as RemoteSourceAuthorizationMetadata['status'],
      mode: response.mode as RemoteSourceAuthorizationMetadata['mode'],
      licenseId: typeof response.licenseId === 'string' ? response.licenseId : undefined,
      licenseStatus: isLicenseStatus(response.licenseStatus) ? response.licenseStatus : undefined,
      sourceId: typeof response.sourceId === 'string' ? response.sourceId : undefined,
      protocol: response.protocol as RemoteSourceAuthorizationMetadata['protocol'],
      sourceStatus: response.sourceStatus as RemoteSourceAuthorizationMetadata['sourceStatus'],
      sourceVersion: typeof response.sourceVersion === 'number' ? response.sourceVersion : undefined,
      supportContact: response.supportContact as RemoteSourceAuthorizationMetadata['supportContact'],
      message: typeof response.message === 'string' ? response.message : undefined,
    };
  }

  async requestAuthorizedDeviceReactivation(
    req: AuthorizedDeviceReactivationRequest
  ): Promise<AuthorizedDeviceReactivationPending> {
    const { data, error } = await this.rpcClient.rpc('rpc_request_authorized_device_reactivation', {
      p_device_id: req.deviceId,
      p_new_device_token_hash: req.newDeviceTokenHash,
      p_display_code: req.displayCode,
      p_device_type: req.deviceType,
      p_device_label: req.deviceLabel,
    });

    return normalizeReactivationPending(data, error);
  }

  async finalizeAuthorizedDeviceReactivation(
    req: AuthorizedDeviceReactivationFinalizeRequest
  ): Promise<AuthorizedDeviceReactivationConfirmation> {
    const { data, error } = await this.rpcClient.rpc('rpc_finalize_authorized_device_reactivation', {
      p_request_id: req.requestId,
      p_device_id: req.deviceId,
    });

    return normalizeReactivationConfirmation(data, error);
  }
}

function normalizeReactivationPending(
  data: unknown,
  error?: { message?: string } | null,
): AuthorizedDeviceReactivationPending {
  if (error || !isRecord(data)) {
    return { success: false, resultCode: 'REMOTE_REACTIVATION_UNAVAILABLE' };
  }

  return {
    success: data.success === true,
    resultCode: typeof data.result_code === 'string'
      ? data.result_code as AuthorizedDeviceReactivationPending['resultCode']
      : 'REMOTE_REACTIVATION_UNAVAILABLE',
    requestId: typeof data.requestId === 'string' ? data.requestId : undefined,
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
    message: typeof data.message === 'string' ? data.message : undefined,
  };
}

function normalizeReactivationConfirmation(
  data: unknown,
  error?: { message?: string } | null,
): AuthorizedDeviceReactivationConfirmation {
  if (error || !isRecord(data)) {
    return { success: false, resultCode: 'REMOTE_REACTIVATION_UNAVAILABLE' };
  }

  return {
    success: data.success === true,
    resultCode: typeof data.result_code === 'string'
      ? data.result_code as AuthorizedDeviceReactivationConfirmation['resultCode']
      : 'REMOTE_REACTIVATION_UNAVAILABLE',
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
    message: typeof data.message === 'string' ? data.message : undefined,
  };
}

/** Double remoto determinístico para testes locais. */
export class InMemoryRemoteControlPlaneAuthority implements RemoteControlPlaneAuthority {
  private readonly remoteEngine: Pick<ControlPlaneEngine, 'resolveDeviceSource'>;

  constructor(remoteEngine: Pick<ControlPlaneEngine, 'resolveDeviceSource'>) {
    this.remoteEngine = remoteEngine;
  }

  resolveAuthorizedDeviceSource(req: SourceResolutionRequest): Promise<RemoteSourceAuthorizationMetadata> {
    return this.remoteEngine.resolveDeviceSource(req).then((response) => ({
      status: response.status,
      mode: response.mode,
      licenseId: response.licenseId,
      licenseStatus: response.licenseStatus,
      sourceId: response.sourceId,
      protocol: response.protocol,
      sourceStatus: response.sourceStatus,
      sourceVersion: response.sourceVersion,
      supportContact: response.supportContact,
      message: response.message,
    }));
  }
}
