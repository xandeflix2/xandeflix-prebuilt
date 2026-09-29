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
  COMPACT_SEARCH_INDEX_FILENAME,
  SEARCH_INDEX_VERSION_V2,
  LIVE_CATALOG_FILENAME,
  type ProvisioningManifest,
  type ProvisioningManifestV1,
  type ProvisioningManifestV2,
  type BuildPackageOptions,
} from './types.ts';
import { calculateSha256, calculatePackageContentHash } from './integrity.ts';
import { getUtf8ByteLength } from '../security/artifact-hash.ts';
import { COMPACT_SEARCH_INDEX_V2_MAGIC } from '../experiments/search-compact-v2/compact-search-v2.types.ts';
import { deserializeCompactIndexV2 } from '../experiments/search-compact-v2/compact-search-v2-serializer.ts';

export function createManifest(
  catalog: PrebuiltCatalog,
  catalogBuffer?: Buffer | Uint8Array | { length: number },
  options?: BuildPackageOptions
): ProvisioningManifest {
  const catalogSha256 =
    options?.catalogSha256 ||
    (catalogBuffer
      ? calculateSha256(catalogBuffer as Buffer)
      : calculateSha256(JSON.stringify(catalog, null, 2)));
  const catalogSizeBytes =
    options?.catalogSizeBytes ||
    (catalogBuffer
      ? catalogBuffer.length
      : getUtf8ByteLength(JSON.stringify(catalog, null, 2)));
  const compression = options?.compression || 'DEFLATE';
  const catalogVersion = catalog.metadata.catalogVersion;
  const snapshotId = catalog.metadata.snapshotId;
  const createdAt = options?.deterministicCreatedAt || new Date().toISOString();
  const generator = options?.generator || 'xandeflix-prebuilt-provisioning/1.0';
  const liveCatalogBuffer = options?.liveCatalog
    ? (() => {
        const u8 = new TextEncoder().encode(JSON.stringify(options.liveCatalog, null, 2));
        return Buffer.from(u8.buffer, u8.byteOffset, u8.byteLength);
      })()
    : undefined;
  const liveCatalogSha256 = liveCatalogBuffer ? calculateSha256(liveCatalogBuffer) : undefined;

  const isV2 =
    options?.packageFormatVersion === PACKAGE_FORMAT_VERSION_V2 ||
    Boolean(options?.searchIndex || options?.searchIndexBuffer);

  if (isV2) {
    if (!options?.searchIndexBuffer) {
      throw new Error('searchIndexBuffer obrigatório para geração de manifest de pacote v2');
    }

    const buf = Buffer.isBuffer(options.searchIndexBuffer)
      ? options.searchIndexBuffer
      : Buffer.from(options.searchIndexBuffer);
    const searchIndexSha256 = calculateSha256(buf);
    const searchIndexSizeBytes = buf.length;

    const isCompactV2 =
      buf.length >= 4 &&
      buf.readUInt32LE(0) === COMPACT_SEARCH_INDEX_V2_MAGIC;

    let searchIndexContentHash: string;
    let searchIndexFile: 'search-index.json' | 'compact-search-index-v2.bin';
    let searchIndexVersion: 1 | 2;

    if (isCompactV2) {
      const compact = deserializeCompactIndexV2(buf);
      searchIndexContentHash = compact.metadata.contentHash;
      searchIndexFile = COMPACT_SEARCH_INDEX_FILENAME;
      searchIndexVersion = SEARCH_INDEX_VERSION_V2;
    } else {
      searchIndexContentHash =
        options.searchIndex?.contentHash ||
        JSON.parse(buf.toString('utf8')).contentHash;
      searchIndexFile = SEARCH_INDEX_FILENAME;
      searchIndexVersion = 1;
    }

    const packageContentHash = calculatePackageContentHash({
      packageFormatVersion: PACKAGE_FORMAT_VERSION_V2,
      schemaVersion: SCHEMA_VERSION,
      catalogVersion,
      snapshotId,
      catalogFile: CATALOG_FILENAME,
      catalogSha256,
      catalogSizeBytes,
      compression,
      searchIndexFile,
      searchIndexVersion,
      searchIndexSha256,
      searchIndexSizeBytes,
      searchIndexContentHash,
      liveCatalogFile: liveCatalogBuffer ? LIVE_CATALOG_FILENAME : undefined,
      liveCatalogSha256,
      liveCatalogSizeBytes: liveCatalogBuffer?.length,
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
      searchIndexFile,
      searchIndexVersion,
      searchIndexSha256,
      searchIndexSizeBytes,
      searchIndexContentHash,
      liveCatalogFile: liveCatalogBuffer ? LIVE_CATALOG_FILENAME : undefined,
      liveCatalogSha256,
      liveCatalogSizeBytes: liveCatalogBuffer?.length,
      packageContentHash,
      generator,
      compression,
      metadata: options?.metadata,
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
    metadata: options?.metadata,
  };

  return manifestV1;
}

export function serializeManifest(manifest: ProvisioningManifest): string {
  return JSON.stringify(manifest, null, 2);
}
