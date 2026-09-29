/**
 * Boundary server-side do R2F2 para cadastro e substituição de configuração
 * MANAGED. O browser nunca recebe a chave nem constrói o envelope.
 */

import { randomBytes } from 'node:crypto';
import {
  encryptManagedSourceConfig,
  type ManagedSourceConfig,
  type ManagedSourceVaultEnvelope,
  type ManagedVaultProtocol,
  type VaultKeyProvider,
} from './managed-source-vault.ts';

export interface ManagedSourceVaultAdminResult {
  success: true;
  sourceId: string;
  sourceVersion: number;
  protocol: ManagedVaultProtocol;
  sourceStatus: 'ACTIVE' | 'DISABLED';
  vaultStatus: 'CONFIGURED';
}

export interface ManagedSourceVaultAdminRepository {
  createManagedSourceWithSecret(input: {
    sourceId: string;
    name: string;
    protocol: ManagedVaultProtocol;
    envelope: ManagedSourceVaultEnvelope;
  }): Promise<ManagedSourceVaultAdminResult>;
  updateManagedSourceWithSecret(input: {
    sourceId: string;
    expectedSourceVersion: number;
    name?: string;
    protocol: ManagedVaultProtocol;
    envelope: ManagedSourceVaultEnvelope;
  }): Promise<ManagedSourceVaultAdminResult>;
}

export interface ActiveManagerVerifier {
  requireActiveManager(): Promise<void>;
}

const SOURCE_ID_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

function fail(code: string): never {
  throw new Error(code);
}

function assertName(name: string): string {
  if (typeof name !== 'string') fail('INVALID_SOURCE_NAME');
  const sanitized = name.trim();
  if (sanitized.length === 0 || sanitized.length > 160) fail('INVALID_SOURCE_NAME');
  return sanitized;
}

function assertSourceId(sourceId: string): void {
  if (typeof sourceId !== 'string' || !/^src_[a-z0-9]+$/.test(sourceId)) {
    fail('INVALID_CANONICAL_SOURCE_ID');
  }
}

function assertProtocol(protocol: string): asserts protocol is ManagedVaultProtocol {
  if (protocol !== 'M3U' && protocol !== 'XTREAM') fail('INVALID_SOURCE_PROTOCOL');
}

function createOpaqueSourceId(): string {
  const bytes = randomBytes(16);
  return `src_${Array.from(bytes, (byte) => SOURCE_ID_ALPHABET[byte % SOURCE_ID_ALPHABET.length]).join('')}`;
}

export class ManagedSourceVaultAdminService {
  private readonly options: {
    keyProvider: VaultKeyProvider;
    repository: ManagedSourceVaultAdminRepository;
    managerVerifier: ActiveManagerVerifier;
    keyVersion?: string;
  };

  constructor(
    options: {
      keyProvider: VaultKeyProvider;
      repository: ManagedSourceVaultAdminRepository;
      managerVerifier: ActiveManagerVerifier;
      keyVersion?: string;
    }
  ) {
    this.options = options;
  }

  async createManagedSourceWithConfig(input: {
    name: string;
    protocol: ManagedVaultProtocol;
    sourceConfig: unknown;
  }): Promise<ManagedSourceVaultAdminResult> {
    await this.options.managerVerifier.requireActiveManager();
    const protocol = input.protocol;
    assertProtocol(protocol);
    const sourceId = createOpaqueSourceId();
    const envelope = encryptManagedSourceConfig(
      { sourceId, sourceVersion: 1, protocol },
      input.sourceConfig,
      this.options.keyProvider,
      this.options.keyVersion ?? 'v1'
    );

    return this.options.repository.createManagedSourceWithSecret({
      sourceId,
      name: assertName(input.name),
      protocol,
      envelope,
    });
  }

  async updateManagedSourceConfig(input: {
    sourceId: string;
    expectedSourceVersion: number;
    name?: string;
    protocol: ManagedVaultProtocol;
    sourceConfig: unknown;
  }): Promise<ManagedSourceVaultAdminResult> {
    await this.options.managerVerifier.requireActiveManager();
    assertSourceId(input.sourceId);
    assertProtocol(input.protocol);
    if (!Number.isSafeInteger(input.expectedSourceVersion) || input.expectedSourceVersion < 1) {
      fail('INVALID_EXPECTED_VERSION');
    }
    const nextSourceVersion = input.expectedSourceVersion + 1;
    if (!Number.isSafeInteger(nextSourceVersion)) fail('SOURCE_VERSION_OVERFLOW');
    const envelope = encryptManagedSourceConfig(
      {
        sourceId: input.sourceId,
        sourceVersion: nextSourceVersion,
        protocol: input.protocol,
      },
      input.sourceConfig,
      this.options.keyProvider,
      this.options.keyVersion ?? 'v1'
    );

    return this.options.repository.updateManagedSourceWithSecret({
      sourceId: input.sourceId,
      expectedSourceVersion: input.expectedSourceVersion,
      name: input.name === undefined ? undefined : assertName(input.name),
      protocol: input.protocol,
      envelope,
    });
  }
}

export type { ManagedSourceConfig };
