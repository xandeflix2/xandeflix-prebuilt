/**
 * Xandeflix Prebuilt — Provisioning Integrity & Hashing
 *
 * Funções determinísticas de cálculo e verificação de integridade via SHA-256 (node:crypto).
 *
 * Princípios:
 * - CATALOG_HASH_ALGORITHM=SHA256
 * - PACKAGE_CONTENT_HASH_ALGORITHM=SHA256
 * - LOGICAL_PACKAGE_DETERMINISTIC=SIM (createdAt não afeta o packageContentHash)
 */

import crypto from 'node:crypto';
import { calculateArtifactDigest } from '../security/artifact-hash.ts';

export function calculateSha256(data: string | Buffer | Uint8Array): string {
  if (crypto && typeof crypto.createHash === 'function') {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  return calculateArtifactDigest(bytes).sha256;
}

export interface PackageContentHashInput {
  packageFormatVersion: number;
  schemaVersion: number;
  catalogVersion: string;
  snapshotId: string;
  catalogFile: string;
  catalogSha256: string;
  catalogSizeBytes: number;
  compression: string;
  searchIndexFile?: string;
  searchIndexVersion?: number;
  searchIndexSha256?: string;
  searchIndexSizeBytes?: number;
  searchIndexContentHash?: string;
}

/**
 * Calcula o hash lógico do conteúdo do pacote.
 * Exclui deliberadamente campos transitórios/não-determinísticos como createdAt.
 */
export function calculatePackageContentHash(input: PackageContentHashInput): string {
  let canonicalPayload: string;

  if (input.packageFormatVersion === 2) {
    canonicalPayload = JSON.stringify({
      packageFormatVersion: 2,
      schemaVersion: input.schemaVersion,
      catalogVersion: input.catalogVersion,
      snapshotId: input.snapshotId,
      catalogFile: input.catalogFile,
      catalogSha256: input.catalogSha256,
      catalogSizeBytes: input.catalogSizeBytes,
      compression: input.compression,
      searchIndexFile: input.searchIndexFile,
      searchIndexVersion: input.searchIndexVersion,
      searchIndexSha256: input.searchIndexSha256,
      searchIndexSizeBytes: input.searchIndexSizeBytes,
      searchIndexContentHash: input.searchIndexContentHash,
    });
  } else {
    canonicalPayload = JSON.stringify({
      packageFormatVersion: input.packageFormatVersion,
      schemaVersion: input.schemaVersion,
      catalogVersion: input.catalogVersion,
      snapshotId: input.snapshotId,
      catalogFile: input.catalogFile,
      catalogSha256: input.catalogSha256,
      catalogSizeBytes: input.catalogSizeBytes,
      compression: input.compression,
    });
  }

  return calculateSha256(canonicalPayload);
}

export function verifyChecksum(actual: string, expected: string): boolean {
  if (typeof actual !== 'string' || typeof expected !== 'string') {
    return false;
  }
  return actual.toLowerCase().trim() === expected.toLowerCase().trim();
}
