/**
 * Xandeflix Prebuilt — R2F1 server-only Managed Source Vault boundary.
 *
 * Este módulo não deve ser importado pelo bundle web/Android. A chave é
 * fornecida por um VaultKeyProvider server-side; o harness injeta somente
 * uma chave sintética.
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

export type ManagedVaultProtocol = 'M3U' | 'XTREAM';

export interface ManagedM3uSourceConfig {
  playlistUrl: string;
  token?: string;
  runtimeOptions?: Record<string, unknown>;
}

export interface ManagedXtreamSourceConfig {
  endpoint: string;
  username: string;
  password: string;
  token?: string;
  runtimeOptions?: Record<string, unknown>;
}

export type ManagedSourceConfig = ManagedM3uSourceConfig | ManagedXtreamSourceConfig;

export interface ManagedSourceAuthorization {
  sourceId: string;
  sourceVersion: number;
  protocol: ManagedVaultProtocol;
}

export interface ManagedSourceVaultEnvelope {
  ciphertext: string;
  nonce: string;
  authTag: string;
  keyVersion: string;
}

export interface VaultKeyProvider {
  getKey(keyVersion: string): Uint8Array;
}

export interface ManagedSourceVaultWriteRequest {
  sourceId: string;
  expectedSourceVersion: number;
  protocol: ManagedVaultProtocol;
  envelope: ManagedSourceVaultEnvelope;
}

export interface ManagedSourceVaultWriteResult {
  success: true;
  sourceId: string;
  sourceVersion: number;
  protocol: ManagedVaultProtocol;
  sourceStatus: 'ACTIVE' | 'DISABLED';
}

export interface ManagedSourceVaultRepository {
  /**
   * Implementação server-side deve chamar a função privada da migration.
   * Nenhum sourceConfig plaintext atravessa esta boundary.
   */
  storeManagedSourceSecret(
    request: ManagedSourceVaultWriteRequest
  ): Promise<ManagedSourceVaultWriteResult>;
}

const SOURCE_ID_PATTERN = /^src_[a-z0-9]+$/;
const KEY_VERSION_PATTERN = /^[A-Za-z0-9_.-]{1,32}$/;
const HEX_PATTERN = /^[0-9a-f]+$/i;
const M3U_KEYS = new Set(['playlistUrl', 'token', 'runtimeOptions']);
const XTREAM_KEYS = new Set(['endpoint', 'username', 'password', 'token', 'runtimeOptions']);
const SAFE_REPOSITORY_ERRORS = new Set([
  'INVALID_CANONICAL_SOURCE_ID',
  'INVALID_EXPECTED_VERSION',
  'INVALID_SOURCE_PROTOCOL',
  'INVALID_VAULT_CIPHERTEXT',
  'INVALID_VAULT_NONCE',
  'INVALID_VAULT_AUTH_TAG',
  'INVALID_VAULT_KEY_VERSION',
  'SOURCE_NOT_FOUND',
  'SOURCE_PROTOCOL_MISMATCH',
  'VERSION_CONFLICT',
  'MANAGER_AUTH_REQUIRED',
  'MANAGER_NOT_AUTHORIZED',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function fail(code: string): never {
  throw new Error(code);
}

function assertSourceId(sourceId: string): void {
  if (!SOURCE_ID_PATTERN.test(sourceId)) fail('INVALID_CANONICAL_SOURCE_ID');
}

function assertAuthorization(authorization: ManagedSourceAuthorization): void {
  if (!isRecord(authorization)) fail('INVALID_SOURCE_AUTHORIZATION');
  if (typeof authorization.sourceId !== 'string') fail('INVALID_CANONICAL_SOURCE_ID');
  assertSourceId(authorization.sourceId);
  if (!Number.isSafeInteger(authorization.sourceVersion) || authorization.sourceVersion < 1) {
    fail('INVALID_SOURCE_VERSION');
  }
  if (authorization.protocol !== 'M3U' && authorization.protocol !== 'XTREAM') {
    fail('INVALID_SOURCE_PROTOCOL');
  }
}

function getSourceAssociatedData(authorization: ManagedSourceAuthorization): Buffer {
  return Buffer.from(
    `${authorization.sourceId}\u0000${authorization.sourceVersion}\u0000${authorization.protocol}`,
    'utf8',
  );
}

function assertAllowedKeys(config: Record<string, unknown>, allowedKeys: Set<string>): void {
  if (Object.keys(config).some((key) => !allowedKeys.has(key))) {
    fail('INVALID_SOURCE_CONFIG_FIELDS');
  }
}

function assertHttpUrl(value: unknown, errorCode: string): asserts value is string {
  if (typeof value !== 'string' || value.length === 0) fail(errorCode);
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') fail(errorCode);
  } catch {
    fail(errorCode);
  }
}

function assertOptionalString(value: unknown, errorCode: string): void {
  if (value !== undefined && (typeof value !== 'string' || value.length === 0)) fail(errorCode);
}

function assertRuntimeOptions(value: unknown): void {
  if (value !== undefined && !isRecord(value)) fail('INVALID_SOURCE_RUNTIME_OPTIONS');
}

export function validateManagedSourceConfig(
  protocol: ManagedVaultProtocol,
  config: unknown
): asserts config is ManagedSourceConfig {
  if (!isRecord(config)) fail('INVALID_SOURCE_CONFIG');

  if (protocol === 'M3U') {
    assertAllowedKeys(config, M3U_KEYS);
    assertHttpUrl(config.playlistUrl, 'INVALID_M3U_PLAYLIST_URL');
    assertOptionalString(config.token, 'INVALID_SOURCE_TOKEN');
    assertRuntimeOptions(config.runtimeOptions);
    return;
  }

  assertAllowedKeys(config, XTREAM_KEYS);
  assertHttpUrl(config.endpoint, 'INVALID_XTREAM_ENDPOINT');
  try {
    const parsedEndpoint = new URL(config.endpoint);
    if (parsedEndpoint.username || parsedEndpoint.password) fail('INVALID_XTREAM_ENDPOINT');
  } catch {
    fail('INVALID_XTREAM_ENDPOINT');
  }
  if (typeof config.username !== 'string' || config.username.length === 0) {
    fail('INVALID_XTREAM_USERNAME');
  }
  if (typeof config.password !== 'string' || config.password.length === 0) {
    fail('INVALID_XTREAM_PASSWORD');
  }
  assertOptionalString(config.token, 'INVALID_SOURCE_TOKEN');
  assertRuntimeOptions(config.runtimeOptions);
}

function assertKeyVersion(keyVersion: string): void {
  if (!KEY_VERSION_PATTERN.test(keyVersion)) fail('INVALID_VAULT_KEY_VERSION');
}

function getAesKey(keyProvider: VaultKeyProvider, keyVersion: string): Buffer {
  assertKeyVersion(keyVersion);
  let key: Uint8Array;
  try {
    key = keyProvider.getKey(keyVersion);
  } catch {
    fail('VAULT_KEY_UNAVAILABLE');
  }
  if (!(key instanceof Uint8Array) || key.byteLength !== 32) fail('VAULT_KEY_INVALID');
  return Buffer.from(key);
}

function assertHex(value: string, expectedLength: number, errorCode: string): void {
  if (
    typeof value !== 'string' ||
    value.length !== expectedLength ||
    !HEX_PATTERN.test(value)
  ) {
    fail(errorCode);
  }
}

function assertEnvelope(envelope: ManagedSourceVaultEnvelope): void {
  if (!isRecord(envelope)) fail('INVALID_VAULT_ENVELOPE');
  if (typeof envelope.ciphertext !== 'string' || envelope.ciphertext.length === 0) {
    fail('INVALID_VAULT_CIPHERTEXT');
  }
  if (envelope.ciphertext.length % 2 !== 0 || !HEX_PATTERN.test(envelope.ciphertext)) {
    fail('INVALID_VAULT_CIPHERTEXT');
  }
  assertHex(envelope.nonce, 24, 'INVALID_VAULT_NONCE');
  assertHex(envelope.authTag, 32, 'INVALID_VAULT_AUTH_TAG');
  assertKeyVersion(envelope.keyVersion);
}

export function encryptManagedSourceConfig(
  authorization: ManagedSourceAuthorization,
  config: unknown,
  keyProvider: VaultKeyProvider,
  keyVersion = 'v1'
): ManagedSourceVaultEnvelope {
  assertAuthorization(authorization);
  validateManagedSourceConfig(authorization.protocol, config);
  const key = getAesKey(keyProvider, keyVersion);
  const nonce = randomBytes(12);

  let plaintext: string;
  try {
    plaintext = JSON.stringify(config);
  } catch {
    fail('INVALID_SOURCE_CONFIG');
  }
  if (!plaintext) fail('INVALID_SOURCE_CONFIG');

  try {
    const cipher = createCipheriv('aes-256-gcm', key, nonce, { authTagLength: 16 });
    cipher.setAAD(getSourceAssociatedData(authorization));
    const ciphertext = Buffer.concat([
      cipher.update(Buffer.from(plaintext, 'utf8')),
      cipher.final(),
    ]);
    return {
      ciphertext: ciphertext.toString('hex'),
      nonce: nonce.toString('hex'),
      authTag: cipher.getAuthTag().toString('hex'),
      keyVersion,
    };
  } catch {
    fail('VAULT_ENCRYPT_FAILED');
  }
}

export function decryptManagedSourceConfig(
  authorization: ManagedSourceAuthorization,
  envelope: ManagedSourceVaultEnvelope,
  keyProvider: VaultKeyProvider
): ManagedSourceConfig {
  assertAuthorization(authorization);
  assertEnvelope(envelope);
  const key = getAesKey(keyProvider, envelope.keyVersion);

  try {
    const decipher = createDecipheriv(
      'aes-256-gcm',
      key,
      Buffer.from(envelope.nonce, 'hex'),
      { authTagLength: 16 }
    );
    decipher.setAAD(getSourceAssociatedData(authorization));
    decipher.setAuthTag(Buffer.from(envelope.authTag, 'hex'));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(envelope.ciphertext, 'hex')),
      decipher.final(),
    ]).toString('utf8');
    const config: unknown = JSON.parse(plaintext);
    validateManagedSourceConfig(authorization.protocol, config);
    return config;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('INVALID_')) throw error;
    fail('VAULT_DECRYPT_FAILED');
  }
}

export function createEnvironmentVaultKeyProvider(
  env: Record<string, string | undefined> = process.env
): VaultKeyProvider {
  return {
    getKey(keyVersion: string): Uint8Array {
      assertKeyVersion(keyVersion);
      const envSuffix = keyVersion.replace(/[^A-Za-z0-9_]/g, '_').toUpperCase();
      const rawKey = env[`SOURCE_VAULT_KEY_${envSuffix}`];
      if (!rawKey) fail('VAULT_KEY_UNAVAILABLE');
      let key: Buffer;
      try {
        key = Buffer.from(rawKey, 'base64');
      } catch {
        fail('VAULT_KEY_INVALID');
      }
      if (key.length !== 32) fail('VAULT_KEY_INVALID');
      return new Uint8Array(key);
    },
  };
}

export class ManagedSourceVaultService {
  private readonly keyProvider: VaultKeyProvider;
  private readonly repository: ManagedSourceVaultRepository;
  private readonly keyVersion: string;

  constructor(options: {
    keyProvider: VaultKeyProvider;
    repository: ManagedSourceVaultRepository;
    keyVersion?: string;
  }) {
    assertKeyVersion(options.keyVersion ?? 'v1');
    this.keyProvider = options.keyProvider;
    this.repository = options.repository;
    this.keyVersion = options.keyVersion ?? 'v1';
  }

  async storeManagedSourceSecret(input: {
    authorization: ManagedSourceAuthorization;
    sourceConfig: unknown;
  }): Promise<ManagedSourceVaultWriteResult> {
    assertAuthorization(input.authorization);
    const nextSourceVersion = input.authorization.sourceVersion + 1;
    if (!Number.isSafeInteger(nextSourceVersion)) fail('SOURCE_VERSION_OVERFLOW');
    const envelope = encryptManagedSourceConfig(
      { ...input.authorization, sourceVersion: nextSourceVersion },
      input.sourceConfig,
      this.keyProvider,
      this.keyVersion
    );

    try {
      return await this.repository.storeManagedSourceSecret({
        sourceId: input.authorization.sourceId,
        expectedSourceVersion: input.authorization.sourceVersion,
        protocol: input.authorization.protocol,
        envelope,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      throw new Error(SAFE_REPOSITORY_ERRORS.has(message) ? message : 'VAULT_STORE_FAILED');
    }
  }
}
