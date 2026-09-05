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
  PACKAGE_FORMAT_VERSION_V1,
  PACKAGE_FORMAT_VERSION_V2,
  SCHEMA_VERSION,
  CATALOG_FILENAME,
  SEARCH_INDEX_FILENAME,
  type ProvisioningManifest,
  type ProvisioningManifestV1,
  type ProvisioningManifestV2,
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
  const createdAt = options?.deterministicCreatedAt || new Date().toISOString();
  const generator = options?.generator || 'xandeflix-prebuilt-provisioning/1.0';

  const isV2 =
    options?.packageFormatVersion === PACKAGE_FORMAT_VERSION_V2 ||
    Boolean(options?.searchIndex || options?.searchIndexBuffer);

  if (isV2) {
    if (!options?.searchIndexBuffer) {
      throw new Error('searchIndexBuffer obrigatório para geração de manifest de pacote v2');
    }

    const searchIndexSha256 = calculateSha256(options.searchIndexBuffer);
    const searchIndexSizeBytes = options.searchIndexBuffer.length;
    const searchIndexContentHash =
      options.searchIndex?.contentHash ||
      JSON.parse(options.searchIndexBuffer.toString('utf8')).contentHash;

    const packageContentHash = calculatePackageContentHash({
      packageFormatVersion: PACKAGE_FORMAT_VERSION_V2,
      schemaVersion: SCHEMA_VERSION,
      catalogVersion,
      snapshotId,
      catalogFile: CATALOG_FILENAME,
      catalogSha256,
      catalogSizeBytes,
      compression,
      searchIndexFile: SEARCH_INDEX_FILENAME,
      searchIndexVersion: 1,
      searchIndexSha256,
      searchIndexSizeBytes,
      searchIndexContentHash,
    });

    const manifestV2: ProvisioningManifestV2 = {
      packageFormatVersion: PACKAGE_FORMAT_VERSION_V2,
      schemaVersion: SCHEMA_VERSION,
      catalogVersion,
      snapshotId,
      createdAt,
      catalogFile: CATALOG_FILENAME,
      catalogSha256,
      catalogSizeBytes,
      searchIndexFile: SEARCH_INDEX_FILENAME,
      searchIndexVersion: 1,
      searchIndexSha256,
      searchIndexSizeBytes,
      searchIndexContentHash,
      packageContentHash,
      generator,
      compression,
    };

    return manifestV2;
  }

  // Pacote v1 (formato padrão do G4)
  const packageContentHash = calculatePackageContentHash({
    packageFormatVersion: PACKAGE_FORMAT_VERSION_V1,
    schemaVersion: SCHEMA_VERSION,
    catalogVersion,
    snapshotId,
    catalogFile: CATALOG_FILENAME,
    catalogSha256,
    catalogSizeBytes,
    compression,
  });

  const manifestV1: ProvisioningManifestV1 = {
    packageFormatVersion: PACKAGE_FORMAT_VERSION_V1,
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

  return manifestV1;
}

export function serializeManifest(manifest: ProvisioningManifest): string {
  return JSON.stringify(manifest, null, 2);
}
