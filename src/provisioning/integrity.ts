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

import { calculateArtifactDigest } from '../security/artifact-hash.ts';

export function calculateSha256(data: string | Buffer | Uint8Array): string {
  return calculateArtifactDigest(data).sha256;
}

export async function calculateSha256Async(data: string | Buffer | Uint8Array): Promise<string> {
  const runtimeCrypto = typeof globalThis !== 'undefined' ? (globalThis.crypto as unknown as { subtle?: SubtleCrypto }) : undefined;
  if (runtimeCrypto?.subtle && typeof runtimeCrypto.subtle.digest === 'function') {
    const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    const hashBuf = await runtimeCrypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuf));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').toLowerCase();
  }
  return calculateSha256(data);
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
  liveCatalogFile?: string;
  liveCatalogSha256?: string;
  liveCatalogSizeBytes?: number;
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
      liveCatalogFile: input.liveCatalogFile,
      liveCatalogSha256: input.liveCatalogSha256,
      liveCatalogSizeBytes: input.liveCatalogSizeBytes,
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
