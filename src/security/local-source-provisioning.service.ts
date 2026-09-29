import type {
  ManagedSourceStatus,
  SourceResolutionStatus,
} from '../control-plane/control-plane.types.ts';
import {
  LocalSecureSourceStore,
  validateLocalSourceId,
  type LocalSecureSourceConfig,
  type LocalSecureSourceRecord,
  type LocalSourceProtocol,
} from './local-secure-source-store.ts';

export interface ProvisionLocalSourceAuthorization {
  status: SourceResolutionStatus;
  sourceId: string;
  sourceVersion: number;
  protocol: LocalSourceProtocol;
  sourceStatus: ManagedSourceStatus;
}

export interface ProvisionLocalSourceRequest {
  authorization: ProvisionLocalSourceAuthorization;
  sourceConfig: LocalSecureSourceConfig;
}

export type LocalSourceProvisioningErrorCode =
  | 'INVALID_SOURCE_ID'
  | 'INVALID_SOURCE_VERSION'
  | 'INVALID_SOURCE_PROTOCOL'
  | 'SOURCE_STATUS_NOT_ACTIVE'
  | 'SOURCE_AUTHORIZATION_INVALID'
  | 'INVALID_LOCAL_SOURCE_CONFIG'
  | 'LOCAL_SOURCE_CONFIG_WRITE_FAILED'
  | 'M3U_URL_UNSUPPORTED'
  | 'PROTOCOL_MISMATCH';

export class LocalSourceProvisioningError extends Error {
  readonly code: LocalSourceProvisioningErrorCode;

  constructor(code: LocalSourceProvisioningErrorCode) {
    super('Provisionamento local rejeitado.');
    this.name = 'LocalSourceProvisioningError';
    this.code = code;
  }
}

export interface LocalSourceProvisioningStore {
  put(record: LocalSecureSourceRecord): Promise<void>;
}

export type LocalSourceProvisioningResult =
  | {
      success: true;
      status: 'STORED';
      sourceId: string;
      sourceVersion: number;
      protocol: LocalSourceProtocol;
    }
  | {
      success: false;
      status: 'REJECTED';
      errorCode: LocalSourceProvisioningErrorCode;
    };

const AUTHORIZATION_KEYS = new Set([
  'status',
  'sourceId',
  'sourceVersion',
  'protocol',
  'sourceStatus',
]);

const REQUEST_KEYS = new Set(['authorization', 'sourceConfig']);

const M3U_CONFIG_KEYS = new Set(['playlistUrl', 'token', 'runtimeOptions']);

const XTREAM_CONFIG_KEYS = new Set([
  'endpoint',
  'username',
  'password',
  'token',
  'runtimeOptions',
]);

const FORBIDDEN_SECRET_ENVELOPE_KEYS = new Set([
  'protectedConfig',
  'encrypted_payload',
  'encryptedPayload',
  'iv',
  'auth_tag',
  'authTag',
]);

const CREDENTIAL_QUERY_KEYS = /^(user(name)?|pass(word)?|token|auth|key|secret|credential)$/i;

export class LocalSourceProvisioningService {
  private readonly store: LocalSourceProvisioningStore;

  constructor(store: LocalSourceProvisioningStore = new LocalSecureSourceStore()) {
    this.store = store;
  }

  async provision(request: ProvisionLocalSourceRequest): Promise<LocalSourceProvisioningResult> {
    try {
      const record = buildLocalSecureSourceRecord(request);
      await this.store.put(record);

      return {
        success: true,
        status: 'STORED',
        sourceId: record.sourceId,
        sourceVersion: record.sourceVersion,
        protocol: record.protocol,
      };
    } catch (error: unknown) {
      if (error instanceof LocalSourceProvisioningError) {
        return {
          success: false,
          status: 'REJECTED',
          errorCode: error.code,
        };
      }

      return {
        success: false,
        status: 'REJECTED',
        errorCode: 'LOCAL_SOURCE_CONFIG_WRITE_FAILED',
      };
    }
  }
}

function buildLocalSecureSourceRecord(
  request: ProvisionLocalSourceRequest,
): LocalSecureSourceRecord {
  assertAllowedKeys(request, REQUEST_KEYS, 'SOURCE_AUTHORIZATION_INVALID');

  const authorization = request.authorization;
  if (!authorization || typeof authorization !== 'object' || Array.isArray(authorization)) {
    throw new LocalSourceProvisioningError('SOURCE_AUTHORIZATION_INVALID');
  }
  assertAllowedKeys(authorization, AUTHORIZATION_KEYS, 'SOURCE_AUTHORIZATION_INVALID');

  if (authorization.status !== 'SOURCE_READY') {
    throw new LocalSourceProvisioningError('SOURCE_AUTHORIZATION_INVALID');
  }

  if (authorization.sourceStatus !== 'ACTIVE') {
    throw new LocalSourceProvisioningError('SOURCE_STATUS_NOT_ACTIVE');
  }

  try {
    validateLocalSourceId(authorization.sourceId);
  } catch {
    throw new LocalSourceProvisioningError('INVALID_SOURCE_ID');
  }

  if (!Number.isSafeInteger(authorization.sourceVersion) || authorization.sourceVersion < 1) {
    throw new LocalSourceProvisioningError('INVALID_SOURCE_VERSION');
  }

  if (authorization.protocol !== 'M3U' && authorization.protocol !== 'XTREAM') {
    throw new LocalSourceProvisioningError('INVALID_SOURCE_PROTOCOL');
  }

  const sourceConfig = validateSourceConfig(authorization.protocol, request.sourceConfig);

  return {
    sourceId: authorization.sourceId,
    sourceVersion: authorization.sourceVersion,
    protocol: authorization.protocol,
    sourceConfig,
  };
}

function validateSourceConfig(
  protocol: LocalSourceProtocol,
  sourceConfig: LocalSecureSourceConfig,
): LocalSecureSourceConfig {
  assertPlainObject(sourceConfig, 'INVALID_LOCAL_SOURCE_CONFIG');
  const config = sourceConfig as LocalSecureSourceConfig;
  rejectForbiddenEnvelopeFields(config);

  if (
    protocol === 'M3U' &&
    ('endpoint' in config || 'username' in config || 'password' in config)
  ) {
    throw new LocalSourceProvisioningError('PROTOCOL_MISMATCH');
  }

  if (protocol === 'XTREAM' && 'playlistUrl' in config) {
    throw new LocalSourceProvisioningError('PROTOCOL_MISMATCH');
  }

  const allowedKeys = protocol === 'M3U' ? M3U_CONFIG_KEYS : XTREAM_CONFIG_KEYS;
  assertAllowedKeys(config, allowedKeys, 'INVALID_LOCAL_SOURCE_CONFIG');

  if (protocol === 'M3U') {
    if (!isNonEmptyString(config.playlistUrl)) {
      throw new LocalSourceProvisioningError('INVALID_LOCAL_SOURCE_CONFIG');
    }

    validateHttpUrl(config.playlistUrl, 'M3U_URL_UNSUPPORTED', true);
    validateOptionalToken(config.token);
    validateRuntimeOptions(config.runtimeOptions);
  } else {
    if (
      !isNonEmptyString(config.endpoint) ||
      !isNonEmptyString(config.username) ||
      !isNonEmptyString(config.password)
    ) {
      throw new LocalSourceProvisioningError('INVALID_LOCAL_SOURCE_CONFIG');
    }

    validateHttpUrl(config.endpoint, 'INVALID_LOCAL_SOURCE_CONFIG', false);
    validateOptionalToken(config.token);
    validateRuntimeOptions(config.runtimeOptions);
  }

  try {
    const serialized = JSON.stringify(config);
    if (serialized === undefined) {
      throw new Error('not serializable');
    }
  } catch {
    throw new LocalSourceProvisioningError('INVALID_LOCAL_SOURCE_CONFIG');
  }

  return config;
}

function validateHttpUrl(
  value: string,
  userInfoErrorCode: LocalSourceProvisioningErrorCode,
  allowM3uUserInfo: boolean,
): void {
  if (value.trim() !== value) {
    throw new LocalSourceProvisioningError('INVALID_LOCAL_SOURCE_CONFIG');
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new LocalSourceProvisioningError('INVALID_LOCAL_SOURCE_CONFIG');
  }

  if ((parsed.protocol !== 'http:' && parsed.protocol !== 'https:') || !parsed.hostname) {
    throw new LocalSourceProvisioningError('INVALID_LOCAL_SOURCE_CONFIG');
  }

  if (parsed.username || parsed.password) {
    if (allowM3uUserInfo) {
      throw new LocalSourceProvisioningError(userInfoErrorCode);
    }
    throw new LocalSourceProvisioningError('INVALID_LOCAL_SOURCE_CONFIG');
  }

  if (!allowM3uUserInfo) {
    for (const key of parsed.searchParams.keys()) {
      if (CREDENTIAL_QUERY_KEYS.test(key)) {
        throw new LocalSourceProvisioningError('INVALID_LOCAL_SOURCE_CONFIG');
      }
    }
  }
}

function validateOptionalToken(token: string | undefined): void {
  if (token !== undefined && !isNonEmptyString(token)) {
    throw new LocalSourceProvisioningError('INVALID_LOCAL_SOURCE_CONFIG');
  }
}

function validateRuntimeOptions(
  runtimeOptions: Record<string, string | number | boolean> | undefined,
): void {
  if (runtimeOptions === undefined) return;
  assertPlainObject(runtimeOptions, 'INVALID_LOCAL_SOURCE_CONFIG');

  for (const value of Object.values(runtimeOptions)) {
    if (
      typeof value !== 'string' &&
      typeof value !== 'boolean' &&
      !(typeof value === 'number' && Number.isFinite(value))
    ) {
      throw new LocalSourceProvisioningError('INVALID_LOCAL_SOURCE_CONFIG');
    }
  }
}

function rejectForbiddenEnvelopeFields(value: object): void {
  for (const key of Object.keys(value)) {
    if (FORBIDDEN_SECRET_ENVELOPE_KEYS.has(key)) {
      throw new LocalSourceProvisioningError('INVALID_LOCAL_SOURCE_CONFIG');
    }
  }
}

function assertAllowedKeys(
  value: object,
  allowedKeys: Set<string>,
  errorCode: LocalSourceProvisioningErrorCode,
): void {
  for (const key of Object.keys(value)) {
    if (FORBIDDEN_SECRET_ENVELOPE_KEYS.has(key)) {
      throw new LocalSourceProvisioningError(errorCode);
    }
    if (!allowedKeys.has(key)) {
      throw new LocalSourceProvisioningError(errorCode);
    }
  }
}

function assertPlainObject(
  value: unknown,
  errorCode: LocalSourceProvisioningErrorCode,
): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new LocalSourceProvisioningError(errorCode);
  }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}
