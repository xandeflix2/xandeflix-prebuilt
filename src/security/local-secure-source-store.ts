import { Capacitor, registerPlugin } from '@capacitor/core';

export type LocalSourceProtocol = 'M3U' | 'XTREAM';

/**
 * Configuração real da source. Este tipo é local e nunca é retornado por RPC
 * nem persistido pela camada web.
 */
export interface LocalSecureSourceConfig {
  endpoint?: string;
  playlistUrl?: string;
  username?: string;
  password?: string;
  token?: string;
  runtimeOptions?: Record<string, string | number | boolean>;
}

export interface LocalSecureSourceRecord {
  sourceId: string;
  sourceVersion: number;
  protocol: LocalSourceProtocol;
  sourceConfig: LocalSecureSourceConfig;
}

export const LOCAL_SECURE_SOURCE_STORE_PLUGIN = 'LocalSecureSourceStore';

export type LocalSecureSourceStoreErrorCode =
  | 'INVALID_SOURCE_RECORD'
  | 'INVALID_SOURCE_ID'
  | 'UNSUPPORTED_SECURE_STORE'
  | 'LOCAL_SOURCE_CONFIG_NOT_FOUND'
  | 'LOCAL_SOURCE_CONFIG_UNAVAILABLE'
  | 'LOCAL_SOURCE_CONFIG_WRITE_FAILED';

export class LocalSecureSourceStoreError extends Error {
  readonly code: LocalSecureSourceStoreErrorCode;

  constructor(code: LocalSecureSourceStoreErrorCode, message: string) {
    super(message);
    this.name = 'LocalSecureSourceStoreError';
    this.code = code;
  }
}

export interface NativeLocalSecureSourceStorePlugin {
  securePut(options: { record: LocalSecureSourceRecord }): Promise<{
    success: boolean;
    errorCode?: LocalSecureSourceStoreErrorCode;
  }>;
  secureGet(options: { sourceId: string }): Promise<{
    found: boolean;
    record?: LocalSecureSourceRecord;
    errorCode?: LocalSecureSourceStoreErrorCode;
  }>;
  secureHas(options: { sourceId: string }): Promise<{
    exists: boolean;
    errorCode?: LocalSecureSourceStoreErrorCode;
  }>;
  secureCurrentHostFingerprint(options: { sourceId: string }): Promise<{
    available: boolean;
    hostFingerprint?: string;
    scheme?: string;
    portClass?: 'default' | 'explicit';
    hostLength?: number;
    sourceVersion?: number;
    dnsResult?: 'PASS' | 'FAIL';
    dnsException?: string;
    aCount?: number;
    aaaaCount?: number;
    errorCode?: LocalSecureSourceStoreErrorCode;
  }>;
  secureReadDiagnosis(options: { sourceId: string }): Promise<{
    branch: string;
    recordPresent: boolean;
    ivPresent: boolean;
    ciphertextPresent: boolean;
    ciphertextLengthClass: 'ZERO' | 'SMALL' | 'NORMAL' | 'OTHER';
    keyAliasPresent: boolean;
    keyAlgorithm?: string;
    exceptionClass?: string;
    causeChain?: string;
    errorCode?: LocalSecureSourceStoreErrorCode;
  }>;
  securePostReadFingerprintDiagnosis(options: { sourceId: string }): Promise<{
    branch: string;
    objectPresent?: boolean;
    sourceType?: LocalSourceProtocol;
    expectedHostField?: 'endpoint' | 'playlistUrl';
    expectedHostFieldState?: 'ABSENT' | 'EMPTY' | 'NON_EMPTY' | 'INVALID';
    endpointState?: 'ABSENT' | 'EMPTY' | 'NON_EMPTY' | 'INVALID';
    playlistUrlState?: 'ABSENT' | 'EMPTY' | 'NON_EMPTY' | 'INVALID';
    schemeClass?: 'http' | 'https' | string;
    hostLength?: number;
    portClass?: 'default' | 'explicit';
    errorCode?: LocalSecureSourceStoreErrorCode;
  }>;
  secureDelete(options: { sourceId: string }): Promise<{
    success: boolean;
    errorCode?: LocalSecureSourceStoreErrorCode;
  }>;
}

export const NativeLocalSecureSourceStore = registerPlugin<NativeLocalSecureSourceStorePlugin>(
  LOCAL_SECURE_SOURCE_STORE_PLUGIN,
);

const SOURCE_ID_PATTERN = /^(src|csrc)_[a-z0-9]+$/;
const NATIVE_ERROR_CODES: LocalSecureSourceStoreErrorCode[] = [
  'INVALID_SOURCE_RECORD',
  'INVALID_SOURCE_ID',
  'UNSUPPORTED_SECURE_STORE',
  'LOCAL_SOURCE_CONFIG_NOT_FOUND',
  'LOCAL_SOURCE_CONFIG_UNAVAILABLE',
  'LOCAL_SOURCE_CONFIG_WRITE_FAILED',
];

export function validateLocalSourceId(sourceId: string): void {
  if (typeof sourceId !== 'string' || !SOURCE_ID_PATTERN.test(sourceId)) {
    throw new LocalSecureSourceStoreError(
      'INVALID_SOURCE_ID',
      'Identificador lógico da source inválido.',
    );
  }
}

export function validateLocalSecureSourceRecord(record: LocalSecureSourceRecord): void {
  if (!record || typeof record !== 'object') {
    throw new LocalSecureSourceStoreError('INVALID_SOURCE_RECORD', 'Registro local inválido.');
  }

  validateLocalSourceId(record.sourceId);

  if (!Number.isSafeInteger(record.sourceVersion) || record.sourceVersion < 1) {
    throw new LocalSecureSourceStoreError('INVALID_SOURCE_RECORD', 'Versão lógica inválida.');
  }

  if (record.protocol !== 'M3U' && record.protocol !== 'XTREAM') {
    throw new LocalSecureSourceStoreError('INVALID_SOURCE_RECORD', 'Protocolo local inválido.');
  }

  if (!record.sourceConfig || typeof record.sourceConfig !== 'object' || Array.isArray(record.sourceConfig)) {
    throw new LocalSecureSourceStoreError('INVALID_SOURCE_RECORD', 'Configuração local inválida.');
  }

  try {
    JSON.stringify(record.sourceConfig);
  } catch {
    throw new LocalSecureSourceStoreError('INVALID_SOURCE_RECORD', 'Configuração local não serializável.');
  }
}

function nativeErrorCode(error: unknown): LocalSecureSourceStoreErrorCode | undefined {
  if (!error || typeof error !== 'object') {
    return undefined;
  }
  const candidate = (error as { code?: unknown }).code;
  return typeof candidate === 'string' && NATIVE_ERROR_CODES.includes(candidate as LocalSecureSourceStoreErrorCode)
    ? candidate as LocalSecureSourceStoreErrorCode
    : undefined;
}

function errorFromNative(
  errorCode: LocalSecureSourceStoreErrorCode | undefined,
  fallback: LocalSecureSourceStoreErrorCode,
): LocalSecureSourceStoreError {
  const code = errorCode && NATIVE_ERROR_CODES.includes(errorCode) ? errorCode : fallback;
  return new LocalSecureSourceStoreError(code, 'Operação do armazenamento local seguro falhou.');
}

/**
 * Fachada mínima da boundary segura local. Não possui fallback persistente web,
 * cache local ou qualquer caminho para expor material de chave à camada TS.
 */
export class LocalSecureSourceStore {
  private readonly pluginOverride?: NativeLocalSecureSourceStorePlugin;

  constructor(pluginOverride?: NativeLocalSecureSourceStorePlugin) {
    this.pluginOverride = pluginOverride;
  }

  async put(record: LocalSecureSourceRecord): Promise<void> {
    validateLocalSecureSourceRecord(record);
    try {
      const result = await this.requirePlugin().securePut({ record });
      if (!result.success) {
        throw errorFromNative(result.errorCode, 'LOCAL_SOURCE_CONFIG_WRITE_FAILED');
      }
    } catch (error: unknown) {
      if (error instanceof LocalSecureSourceStoreError) {
        throw error;
      }
      throw errorFromNative(nativeErrorCode(error), 'LOCAL_SOURCE_CONFIG_WRITE_FAILED');
    }
  }

  async get(sourceId: string): Promise<LocalSecureSourceRecord | undefined> {
    validateLocalSourceId(sourceId);
    try {
      const result = await this.requirePlugin().secureGet({ sourceId });
      if (!result.found) {
        return undefined;
      }
      if (!result.record) {
        throw errorFromNative('LOCAL_SOURCE_CONFIG_UNAVAILABLE', 'LOCAL_SOURCE_CONFIG_UNAVAILABLE');
      }
      validateLocalSecureSourceRecord(result.record);
      if (result.record.sourceId !== sourceId) {
        throw errorFromNative('LOCAL_SOURCE_CONFIG_UNAVAILABLE', 'LOCAL_SOURCE_CONFIG_UNAVAILABLE');
      }
      return result.record;
    } catch (error: unknown) {
      if (error instanceof LocalSecureSourceStoreError) {
        throw error;
      }
      throw errorFromNative(nativeErrorCode(error), 'LOCAL_SOURCE_CONFIG_UNAVAILABLE');
    }
  }

  async has(sourceId: string): Promise<boolean> {
    validateLocalSourceId(sourceId);
    try {
      const result = await this.requirePlugin().secureHas({ sourceId });
      if (typeof result.exists !== 'boolean') {
        throw errorFromNative('LOCAL_SOURCE_CONFIG_UNAVAILABLE', 'LOCAL_SOURCE_CONFIG_UNAVAILABLE');
      }
      return result.exists;
    } catch (error: unknown) {
      if (error instanceof LocalSecureSourceStoreError) {
        throw error;
      }
      throw errorFromNative(nativeErrorCode(error), 'LOCAL_SOURCE_CONFIG_UNAVAILABLE');
    }
  }

  async delete(sourceId: string): Promise<void> {
    validateLocalSourceId(sourceId);
    try {
      const result = await this.requirePlugin().secureDelete({ sourceId });
      if (!result.success) {
        throw errorFromNative(result.errorCode, 'LOCAL_SOURCE_CONFIG_UNAVAILABLE');
      }
    } catch (error: unknown) {
      if (error instanceof LocalSecureSourceStoreError) {
        throw error;
      }
      throw errorFromNative(nativeErrorCode(error), 'LOCAL_SOURCE_CONFIG_UNAVAILABLE');
    }
  }

  private requirePlugin(): NativeLocalSecureSourceStorePlugin {
    if (this.pluginOverride) {
      return this.pluginOverride;
    }

    if (!Capacitor.isNativePlatform() && !Capacitor.isPluginAvailable(LOCAL_SECURE_SOURCE_STORE_PLUGIN)) {
      throw new LocalSecureSourceStoreError(
        'UNSUPPORTED_SECURE_STORE',
        'Armazenamento local seguro indisponível nesta plataforma.',
      );
    }

    return NativeLocalSecureSourceStore;
  }
}
