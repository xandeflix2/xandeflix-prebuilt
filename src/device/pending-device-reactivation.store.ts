import { Capacitor, registerPlugin } from '@capacitor/core';
import type {
  AuthorizedDeviceReactivationHandle,
} from '../control-plane/device-reactivation.types.ts';

export type PendingDeviceReactivationStoreErrorCode =
  | 'PENDING_REACTIVATION_INVALID'
  | 'PENDING_REACTIVATION_DEVICE_MISMATCH'
  | 'PENDING_REACTIVATION_EXPIRED'
  | 'PENDING_REACTIVATION_STORE_UNAVAILABLE'
  | 'PENDING_REACTIVATION_WRITE_FAILED'
  | 'PENDING_REACTIVATION_READ_FAILED'
  | 'PENDING_REACTIVATION_CLEAR_FAILED';

export class PendingDeviceReactivationStoreError extends Error {
  readonly code: PendingDeviceReactivationStoreErrorErrorCode;

  constructor(code: PendingDeviceReactivationStoreErrorCode, message: string) {
    super(message);
    this.name = 'PendingDeviceReactivationStoreError';
    this.code = code;
  }
}

type PendingDeviceReactivationStoreErrorErrorCode = PendingDeviceReactivationStoreErrorCode;

export interface NativePendingDeviceReactivationStorePlugin {
  secureSavePendingReactivation(options: {
    handle: AuthorizedDeviceReactivationHandle;
  }): Promise<{
    success: boolean;
    errorCode?: PendingDeviceReactivationStoreErrorCode;
  }>;
  secureLoadPendingReactivation(): Promise<{
    found: boolean;
    handle?: AuthorizedDeviceReactivationHandle;
    errorCode?: PendingDeviceReactivationStoreErrorCode;
  }>;
  secureClearPendingReactivation(): Promise<{
    success: boolean;
    errorCode?: PendingDeviceReactivationStoreErrorCode;
  }>;
}

export const PENDING_DEVICE_REACTIVATION_STORE_PLUGIN = 'PendingDeviceReactivationStore';

export const NativePendingDeviceReactivationStore = registerPlugin<NativePendingDeviceReactivationStorePlugin>(
  PENDING_DEVICE_REACTIVATION_STORE_PLUGIN,
);

const DEVICE_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DISPLAY_CODE_PATTERN = /^XF-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
const REQUEST_ID_PATTERN = DEVICE_ID_PATTERN;
const RAW_TOKEN_PATTERN = /^r2f8r_[0-9a-f]{64}$/;
const DEVICE_TYPES = new Set(['TV', 'PHONE', 'TABLET', 'PC', 'OTHER']);
const NATIVE_ERROR_CODES: PendingDeviceReactivationStoreErrorCode[] = [
  'PENDING_REACTIVATION_INVALID',
  'PENDING_REACTIVATION_DEVICE_MISMATCH',
  'PENDING_REACTIVATION_EXPIRED',
  'PENDING_REACTIVATION_STORE_UNAVAILABLE',
  'PENDING_REACTIVATION_WRITE_FAILED',
  'PENDING_REACTIVATION_READ_FAILED',
  'PENDING_REACTIVATION_CLEAR_FAILED',
];

function nativeErrorCode(error: unknown): PendingDeviceReactivationStoreErrorCode | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const candidate = (error as { code?: unknown }).code;
  return typeof candidate === 'string' && NATIVE_ERROR_CODES.includes(candidate as PendingDeviceReactivationStoreErrorCode)
    ? candidate as PendingDeviceReactivationStoreErrorCode
    : undefined;
}

function errorFromNative(
  errorCode: PendingDeviceReactivationStoreErrorCode | undefined,
  fallback: PendingDeviceReactivationStoreErrorCode,
): PendingDeviceReactivationStoreError {
  const code = errorCode && NATIVE_ERROR_CODES.includes(errorCode) ? errorCode : fallback;
  return new PendingDeviceReactivationStoreError(code, 'Operação do armazenamento seguro de reativação falhou.');
}

export function validatePendingDeviceReactivationHandle(
  handle: AuthorizedDeviceReactivationHandle,
): void {
  if (!handle || typeof handle !== 'object') {
    throw new PendingDeviceReactivationStoreError('PENDING_REACTIVATION_INVALID', 'Handle pendente inválido.');
  }
  if (!REQUEST_ID_PATTERN.test(handle.requestId)
    || !DEVICE_ID_PATTERN.test(handle.deviceId)
    || !RAW_TOKEN_PATTERN.test(handle.rawDeviceToken)
    || !DISPLAY_CODE_PATTERN.test(handle.displayCode)
    || !DEVICE_TYPES.has(handle.deviceType)
    || typeof handle.deviceLabel !== 'string'
    || handle.deviceLabel.trim().length === 0
    || handle.deviceLabel.length > 100
    || typeof handle.createdAtIso !== 'string'
    || typeof handle.expiresAtIso !== 'string') {
    throw new PendingDeviceReactivationStoreError('PENDING_REACTIVATION_INVALID', 'Handle pendente inválido.');
  }

  const createdAt = Date.parse(handle.createdAtIso);
  const expiresAt = Date.parse(handle.expiresAtIso);
  if (!Number.isFinite(createdAt) || !Number.isFinite(expiresAt) || expiresAt <= createdAt) {
    throw new PendingDeviceReactivationStoreError('PENDING_REACTIVATION_INVALID', 'Validade do handle pendente inválida.');
  }
}

/**
 * Boundary temporária do handle de reativação. Não possui fallback persistente
 * em browser: em plataformas sem o plugin nativo, falha fechada.
 */
export class PendingDeviceReactivationStore {
  private readonly pluginOverride?: NativePendingDeviceReactivationStorePlugin;

  constructor(pluginOverride?: NativePendingDeviceReactivationStorePlugin) {
    this.pluginOverride = pluginOverride;
  }

  async save(handle: AuthorizedDeviceReactivationHandle): Promise<void> {
    validatePendingDeviceReactivationHandle(handle);
    try {
      const result = await this.requirePlugin().secureSavePendingReactivation({ handle });
      if (!result.success) {
        throw errorFromNative(result.errorCode, 'PENDING_REACTIVATION_WRITE_FAILED');
      }
    } catch (error: unknown) {
      if (error instanceof PendingDeviceReactivationStoreError) throw error;
      throw errorFromNative(nativeErrorCode(error), 'PENDING_REACTIVATION_WRITE_FAILED');
    }
  }

  async load(): Promise<AuthorizedDeviceReactivationHandle | undefined> {
    try {
      const result = await this.requirePlugin().secureLoadPendingReactivation();
      if (!result.found) return undefined;
      if (!result.handle) {
        throw errorFromNative('PENDING_REACTIVATION_INVALID', 'PENDING_REACTIVATION_READ_FAILED');
      }
      validatePendingDeviceReactivationHandle(result.handle);
      if (Date.parse(result.handle.expiresAtIso) <= Date.now()) {
        await this.clear();
        return undefined;
      }
      return result.handle;
    } catch (error: unknown) {
      if (error instanceof PendingDeviceReactivationStoreError) throw error;
      throw errorFromNative(nativeErrorCode(error), 'PENDING_REACTIVATION_READ_FAILED');
    }
  }

  async loadForDevice(deviceId: string): Promise<AuthorizedDeviceReactivationHandle | undefined> {
    if (!DEVICE_ID_PATTERN.test(deviceId)) {
      throw new PendingDeviceReactivationStoreError('PENDING_REACTIVATION_INVALID', 'Identidade do dispositivo inválida.');
    }
    const handle = await this.load();
    if (!handle) return undefined;
    if (handle.deviceId !== deviceId) {
      await this.clear();
      throw new PendingDeviceReactivationStoreError(
        'PENDING_REACTIVATION_DEVICE_MISMATCH',
        'Handle pendente vinculado a outro dispositivo.',
      );
    }
    return handle;
  }

  async clear(): Promise<void> {
    try {
      const result = await this.requirePlugin().secureClearPendingReactivation();
      if (!result.success) {
        throw errorFromNative(result.errorCode, 'PENDING_REACTIVATION_CLEAR_FAILED');
      }
    } catch (error: unknown) {
      if (error instanceof PendingDeviceReactivationStoreError) throw error;
      throw errorFromNative(nativeErrorCode(error), 'PENDING_REACTIVATION_CLEAR_FAILED');
    }
  }

  private requirePlugin(): NativePendingDeviceReactivationStorePlugin {
    if (this.pluginOverride) return this.pluginOverride;
    if (!Capacitor.isNativePlatform() && !Capacitor.isPluginAvailable(PENDING_DEVICE_REACTIVATION_STORE_PLUGIN)) {
      throw new PendingDeviceReactivationStoreError(
        'PENDING_REACTIVATION_STORE_UNAVAILABLE',
        'Armazenamento seguro de reativação indisponível nesta plataforma.',
      );
    }
    return NativePendingDeviceReactivationStore;
  }
}
