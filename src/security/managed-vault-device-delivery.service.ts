import { DeviceIdentityService } from '../device/device-identity.service.ts';
import {
  LocalSecureSourceStore,
  type LocalSecureSourceConfig,
  type LocalSecureSourceRecord,
  type LocalSourceProtocol,
  validateLocalSecureSourceRecord,
} from './local-secure-source-store.ts';

export interface ManagedVaultDeliveryTransport {
  invoke(
    functionName: string,
    options: { body: Record<string, unknown> },
  ): Promise<{
    data: unknown;
    error?: {
      code?: string;
      stage?: string;
      message?: string;
      status?: number;
    } | null;
  }>;
}

interface ManagedVaultDeliveryDeviceContext {
  getOrCreateIdentity(): Promise<{ deviceId: string }>;
  loadActivationState(): Promise<{
    deviceId: string;
    status: string;
    licenseMode?: string;
    deviceAuthToken?: string;
  } | null>;
}

export interface ManagedVaultDeviceDeliveryAck {
  deliveryResult: 'STORED';
  sourceId: string;
  sourceVersion: number;
  protocol: LocalSourceProtocol;
}

export type ManagedVaultDeviceDeliveryErrorCode =
  | 'DELIVERY_TRANSPORT_UNAVAILABLE'
  | 'DEVICE_NOT_AUTHORIZED'
  | 'DEVICE_REVOKED'
  | 'DEVICE_ID_MISMATCH'
  | 'MANAGED_LICENSE_REQUIRED'
  | 'DELIVERY_REJECTED'
  | 'INVALID_DELIVERY_RESPONSE'
  | 'SECURE_STORE_WRITE_FAILED'
  | 'LICENSE_INVALID'
  | 'SOURCE_NOT_BOUND'
  | 'SOURCE_DISABLED'
  | 'SOURCE_VERSION_MISMATCH'
  | 'VAULT_NOT_CONFIGURED'
  | 'VAULT_VERSION_MISMATCH'
  | 'VAULT_KEY_MISSING'
  | 'VAULT_KEY_INVALID'
  | 'VAULT_DECRYPT_FAILED'
  | 'DELIVERY_NOT_CONFIGURED';

export class ManagedVaultDeviceDeliveryError extends Error {
  readonly code: ManagedVaultDeviceDeliveryErrorCode;

  constructor(code: ManagedVaultDeviceDeliveryErrorCode) {
    super(code);
    this.name = 'ManagedVaultDeviceDeliveryError';
    this.code = code;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isProtocol(value: unknown): value is LocalSourceProtocol {
  return value === 'M3U' || value === 'XTREAM';
}

function isSourceConfig(value: unknown): value is LocalSecureSourceConfig {
  return isRecord(value);
}

function toDeliveryRecord(value: unknown): LocalSecureSourceRecord {
  if (!isRecord(value) || !isSourceConfig(value.sourceConfig)) {
    throw new ManagedVaultDeviceDeliveryError('INVALID_DELIVERY_RESPONSE');
  }

  const sourceId = value.sourceId;
  const sourceVersion = value.sourceVersion;
  const protocol = value.protocol;
  if (
    typeof sourceId !== 'string' ||
    typeof sourceVersion !== 'number' ||
    !isProtocol(protocol)
  ) {
    throw new ManagedVaultDeviceDeliveryError('INVALID_DELIVERY_RESPONSE');
  }

  const record: LocalSecureSourceRecord = {
    sourceId,
    sourceVersion,
    protocol,
    sourceConfig: value.sourceConfig,
  };

  try {
    validateLocalSecureSourceRecord(record);
  } catch {
    throw new ManagedVaultDeviceDeliveryError('INVALID_DELIVERY_RESPONSE');
  }
  return record;
}

function toSafeTransportError(
  error: { code?: string; stage?: string; message?: string; status?: number } | null | undefined,
): ManagedVaultDeviceDeliveryError {
  if (error?.code === 'DEVICE_REVOKED') {
    return new ManagedVaultDeviceDeliveryError('DEVICE_REVOKED');
  }
  if (error?.code === 'DEVICE_NOT_AUTHORIZED') {
    return new ManagedVaultDeviceDeliveryError('DEVICE_NOT_AUTHORIZED');
  }
  if (error?.code === 'LICENSE_INVALID' || error?.code === 'LICENSE_EXPIRED') {
    return new ManagedVaultDeviceDeliveryError(
      error.code === 'LICENSE_INVALID' ? 'LICENSE_INVALID' : 'MANAGED_LICENSE_REQUIRED',
    );
  }
  if (
    error?.code === 'SOURCE_NOT_BOUND' ||
    error?.code === 'SOURCE_DISABLED' ||
    error?.code === 'SOURCE_VERSION_MISMATCH' ||
    error?.code === 'VAULT_NOT_CONFIGURED' ||
    error?.code === 'VAULT_VERSION_MISMATCH' ||
    error?.code === 'VAULT_KEY_MISSING' ||
    error?.code === 'VAULT_KEY_INVALID' ||
    error?.code === 'VAULT_DECRYPT_FAILED' ||
    error?.code === 'DELIVERY_NOT_CONFIGURED'
  ) {
    return new ManagedVaultDeviceDeliveryError(error.code);
  }
  return new ManagedVaultDeviceDeliveryError('DELIVERY_REJECTED');
}

export class ManagedVaultDeviceDeliveryService {
  private readonly transport: ManagedVaultDeliveryTransport;
  private readonly localStore: Pick<LocalSecureSourceStore, 'put'>;
  private readonly deviceContext: ManagedVaultDeliveryDeviceContext;

  constructor(
    transport: ManagedVaultDeliveryTransport,
    localStore: Pick<LocalSecureSourceStore, 'put'> = new LocalSecureSourceStore(),
    deviceContext: ManagedVaultDeliveryDeviceContext = DeviceIdentityService,
  ) {
    this.transport = transport;
    this.localStore = localStore;
    this.deviceContext = deviceContext;
  }

  async deliver(): Promise<ManagedVaultDeviceDeliveryAck> {
    const identity = await this.deviceContext.getOrCreateIdentity();
    const activation = await this.deviceContext.loadActivationState();

    if (!activation || activation.status !== 'AUTHORIZED' || !activation.deviceAuthToken) {
      throw new ManagedVaultDeviceDeliveryError('DEVICE_NOT_AUTHORIZED');
    }
    if (activation.deviceId !== identity.deviceId) {
      throw new ManagedVaultDeviceDeliveryError('DEVICE_ID_MISMATCH');
    }
    if (activation.licenseMode !== 'MANAGED' && activation.licenseMode !== 'SELF_SERVICE') {
      throw new ManagedVaultDeviceDeliveryError('MANAGED_LICENSE_REQUIRED');
    }

    let response: Awaited<ReturnType<ManagedVaultDeliveryTransport['invoke']>>;
    try {
      response = await this.transport.invoke('managed-source-vault-delivery', {
        body: {
          operation: 'DELIVER_MANAGED_SOURCE',
          deviceId: identity.deviceId,
          deviceAuthToken: activation.deviceAuthToken,
        },
      });
    } catch {
      throw new ManagedVaultDeviceDeliveryError('DELIVERY_TRANSPORT_UNAVAILABLE');
    }

    if (response.error) {
      throw toSafeTransportError(response.error);
    }

    const payload = response.data;
    if (!isRecord(payload) || payload.success !== true) {
      throw new ManagedVaultDeviceDeliveryError('INVALID_DELIVERY_RESPONSE');
    }

    const record = toDeliveryRecord(payload);
    try {
      await this.localStore.put(record);
    } catch {
      throw new ManagedVaultDeviceDeliveryError('SECURE_STORE_WRITE_FAILED');
    }

    return {
      deliveryResult: 'STORED',
      sourceId: record.sourceId,
      sourceVersion: record.sourceVersion,
      protocol: record.protocol,
    };
  }
}

let configuredManagedVaultDeviceDeliveryService: ManagedVaultDeviceDeliveryService | undefined;

export function configureManagedVaultDeviceDeliveryService(
  service: ManagedVaultDeviceDeliveryService | undefined,
): void {
  configuredManagedVaultDeviceDeliveryService = service;
}

export function getManagedVaultDeviceDeliveryService(): ManagedVaultDeviceDeliveryService | undefined {
  return configuredManagedVaultDeviceDeliveryService;
}
