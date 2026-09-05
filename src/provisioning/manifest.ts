/**
 * Xandeflix Prebuilt — Provisioning Manifest Generator
 *
 * Constrói o manifest.json canônico do pacote de provisionamento.
 *
 * Princípios:
 * - ONE_SOURCE_OF_TRUTH: Reflete o catálogo de dados normalizado v1
 * - HASHING: SHA-256 para catálogo e para o hash lógico do pacote
 * - NO_SECRETS: Proibido embutir tokens, senhas ou URLs privadas
 */

import type { PrebuiltCatalog } from '../contracts/catalog.ts';
import {
  PACKAGE_FORMAT_VERSION,
  SCHEMA_VERSION,
  CATALOG_FILENAME,
  type ProvisioningManifest,
  type BuildPackageOptions,
} from './types.ts';
import { calculateSha256, calculatePackageContentHash } from './integrity.ts';

export function createManifest(
  catalog: PrebuiltCatalog,
  catalogBuffer: Buffer,
  options?: BuildPackageOptions
): ProvisioningManifest {
  const catalogSha256 = calculateSha256(catalogBuffer);
  const catalogSizeBytes = catalogBuffer.length;
  const compression = options?.compression || 'DEFLATE';
  const catalogVersion = catalog.metadata.catalogVersion;
  const snapshotId = catalog.metadata.snapshotId;

  const packageContentHash = calculatePackageContentHash({
    packageFormatVersion: PACKAGE_FORMAT_VERSION,
    schemaVersion: SCHEMA_VERSION,
    catalogVersion,
    snapshotId,
    catalogFile: CATALOG_FILENAME,
    catalogSha256,
    catalogSizeBytes,
    compression,
  });

  const createdAt = options?.deterministicCreatedAt || new Date().toISOString();
  const generator = options?.generator || 'xandeflix-prebuilt-provisioning/1.0';

  return {
    packageFormatVersion: PACKAGE_FORMAT_VERSION,
    schemaVersion: SCHEMA_VERSION,
    catalogVersion,
    snapshotId,
    createdAt,
    catalogFile: CATALOG_FILENAME,
    catalogSha256,
    catalogSizeBytes,
    packageContentHash,
    generator,
    compression,
  };
}

export function serializeManifest(manifest: ProvisioningManifest): string {
  return JSON.stringify(manifest, null, 2);
}
