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

import { createHash } from 'node:crypto';

export function calculateSha256(data: string | Buffer): string {
  return createHash('sha256').update(data).digest('hex');
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
}

/**
 * Calcula o hash lógico do conteúdo do pacote.
 * Exclui deliberadamente campos transitórios/não-determinísticos como createdAt.
 */
export function calculatePackageContentHash(input: PackageContentHashInput): string {
  const canonicalPayload = JSON.stringify({
    packageFormatVersion: input.packageFormatVersion,
    schemaVersion: input.schemaVersion,
    catalogVersion: input.catalogVersion,
    snapshotId: input.snapshotId,
    catalogFile: input.catalogFile,
    catalogSha256: input.catalogSha256,
    catalogSizeBytes: input.catalogSizeBytes,
    compression: input.compression,
  });

  return calculateSha256(canonicalPayload);
}

export function verifyChecksum(actual: string, expected: string): boolean {
  if (typeof actual !== 'string' || typeof expected !== 'string') {
    return false;
  }
  return actual.toLowerCase().trim() === expected.toLowerCase().trim();
}
