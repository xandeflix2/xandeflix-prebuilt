/**
 * Xandeflix Prebuilt — C6R server-only Customer Source Vault boundary.
 *
 * Módulo executado estritamente server-side (Edge Functions / Node server runtime).
 * Não deve ser importado pelo bundle web do cliente nem pelo aplicativo Android.
 * A chave mestra SOURCE_VAULT_KEY_V1 reside exclusivamente no ambiente do servidor.
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import type { CustomerSourceType } from '../control-plane.types.ts';

export type CustomerVaultProtocol = CustomerSourceType;

export interface CustomerM3uConfig {
  playlistUrl: string;
  token?: string;
  runtimeOptions?: Record<string, unknown>;
}

export interface CustomerXtreamConfig {
  endpoint: string;
  username: string;
  password: string;
  token?: string;
  runtimeOptions?: Record<string, unknown>;
}

export type CustomerSourceConfigPayload = CustomerM3uConfig | CustomerXtreamConfig;

export interface CustomerSourceVaultEnvelope {
  ciphertext: string;
  nonce: string;
  authTag: string;
  keyVersion: string;
}

export interface VaultKeyProvider {
  getKey(keyVersion: string): Uint8Array;
}

export class CustomerVaultError extends Error {
  readonly code: string;

  constructor(code: string, message?: string) {
    super(message || code);
    this.name = 'CustomerVaultError';
    this.code = code;
  }
}

function fail(code: string): never {
  throw new CustomerVaultError(code);
}

export function assertSafeHttpUrl(value: unknown, errorCode = 'INVALID_URL'): asserts value is string {
  if (typeof value !== 'string' || value.length === 0) fail(errorCode);
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') fail(errorCode);
    if (!parsed.hostname || parsed.hostname.length === 0) fail(errorCode);
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host === '::1' ||
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host) ||
      host.endsWith('.local') ||
      host.endsWith('.internal')
    ) {
      fail(errorCode);
    }
  } catch {
    fail(errorCode);
  }
}

export function validateSourceConfig(protocol: CustomerVaultProtocol, config: unknown): void {
  if (typeof config !== 'object' || config === null || Array.isArray(config)) {
    fail('INVALID_SOURCE_CONFIG');
  }

  const rec = config as Record<string, unknown>;
  const allowed = protocol === 'XTREAM'
    ? new Set(['endpoint', 'username', 'password', 'token', 'runtimeOptions'])
    : new Set(['playlistUrl', 'token', 'runtimeOptions']);

  if (Object.keys(rec).some((key) => !allowed.has(key))) {
    fail('INVALID_SOURCE_CONFIG_FIELDS');
  }

  if (protocol === 'M3U' || protocol === 'M3U8') {
    assertSafeHttpUrl(rec.playlistUrl, 'INVALID_M3U_PLAYLIST_URL');
    if (rec.token !== undefined && (typeof rec.token !== 'string' || rec.token.length === 0)) {
      fail('INVALID_SOURCE_TOKEN');
    }
    return;
  }

  assertSafeHttpUrl(rec.endpoint, 'INVALID_XTREAM_ENDPOINT');
  try {
    const ep = new URL(rec.endpoint as string);
    if (ep.username || ep.password) fail('INVALID_XTREAM_ENDPOINT');
  } catch {
    fail('INVALID_XTREAM_ENDPOINT');
  }

  if (typeof rec.username !== 'string' || rec.username.trim().length === 0) {
    fail('INVALID_XTREAM_USERNAME');
  }
  if (typeof rec.password !== 'string' || rec.password.length === 0) {
    fail('INVALID_XTREAM_PASSWORD');
  }
}

export function encryptCustomerSourceConfig(
  sourceId: string,
  sourceVersion: number,
  protocol: CustomerVaultProtocol,
  config: CustomerSourceConfigPayload,
  keyProvider: VaultKeyProvider,
  keyVersion = 'v1',
): CustomerSourceVaultEnvelope {
  validateSourceConfig(protocol, config);
  const key = keyProvider.getKey(keyVersion);
  if (key.byteLength !== 32) fail('VAULT_KEY_INVALID');

  const nonceBytes = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, nonceBytes);
  const aad = Buffer.from(`${sourceId}\0${sourceVersion}\0${protocol}`, 'utf8');
  cipher.setAAD(aad);

  const plaintext = Buffer.from(JSON.stringify(config), 'utf8');
  const ciphertextBuffer = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTagBuffer = cipher.getAuthTag();

  return {
    ciphertext: ciphertextBuffer.toString('hex'),
    nonce: nonceBytes.toString('hex'),
    authTag: authTagBuffer.toString('hex'),
    keyVersion,
  };
}

export function decryptCustomerSourceConfig(
  sourceId: string,
  sourceVersion: number,
  protocol: CustomerVaultProtocol,
  ciphertextHex: string,
  nonceHex: string,
  authTagHex: string,
  keyProvider: VaultKeyProvider,
  keyVersion = 'v1',
): CustomerSourceConfigPayload {
  const key = keyProvider.getKey(keyVersion);
  if (key.byteLength !== 32) fail('VAULT_KEY_INVALID');

  try {
    const nonce = Buffer.from(nonceHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const ciphertext = Buffer.from(ciphertextHex, 'hex');

    const decipher = createDecipheriv('aes-256-gcm', key, nonce);
    const aad = Buffer.from(`${sourceId}\0${sourceVersion}\0${protocol}`, 'utf8');
    decipher.setAAD(aad);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    const parsed = JSON.parse(decrypted.toString('utf8')) as CustomerSourceConfigPayload;
    validateSourceConfig(protocol, parsed);
    return parsed;
  } catch {
    fail('VAULT_DECRYPT_FAILED');
  }
}
