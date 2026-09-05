/**
 * Xandeflix Prebuilt — Provisioning Package Types
 *
 * Tipos canônicos para o pacote de provisionamento (G4).
 * Estrutura interna mínima: manifest.json + catalog.json empacotados em ZIP.
 *
 * Princípios:
 * - PACKAGE_FORMAT_VERSION=1
 * - SCHEMA_VERSION=1
 * - UNKNOWN_PACKAGE_FILES=REJECT
 * - LOGICAL_PACKAGE_DETERMINISTIC=SIM
 */

import type { PrebuiltCatalog } from '../contracts/catalog.ts';
import type { PrebuiltSearchIndex } from '../search/search-index.types.ts';

export const PACKAGE_FORMAT_VERSION = 1;
export const PACKAGE_FORMAT_VERSION_V1 = 1;
export const PACKAGE_FORMAT_VERSION_V2 = 2;
export const SEARCH_ENABLED_PACKAGE_FORMAT_VERSION = 2;

export const SCHEMA_VERSION = 1;
export const MANIFEST_FILENAME = 'manifest.json';
export const CATALOG_FILENAME = 'catalog.json';
export const SEARCH_INDEX_FILENAME = 'search-index.json';

export interface ProvisioningManifestV1 {
  packageFormatVersion: 1;
  schemaVersion: 1;
  catalogVersion: string;
  snapshotId: string;
  createdAt: string;
  catalogFile: 'catalog.json';
  catalogSha256: string;
  catalogSizeBytes: number;
  packageContentHash: string;
  generator: string;
  compression: 'DEFLATE' | 'STORE';
  metadata?: Record<string, unknown>;
}

export interface ProvisioningManifestV2 {
  packageFormatVersion: 2;
  schemaVersion: 1;
  catalogVersion: string;
  snapshotId: string;
  createdAt: string;
  catalogFile: 'catalog.json';
  catalogSha256: string;
  catalogSizeBytes: number;
  searchIndexFile: 'search-index.json';
  searchIndexVersion: 1;
  searchIndexSha256: string;
  searchIndexSizeBytes: number;
  searchIndexContentHash: string;
  packageContentHash: string;
  generator: string;
  compression: 'DEFLATE' | 'STORE';
  metadata?: Record<string, unknown>;
}

export type ProvisioningManifest = ProvisioningManifestV1 | ProvisioningManifestV2;

export interface BuildPackageOptions {
  packageFormatVersion?: 1 | 2;
  searchIndex?: PrebuiltSearchIndex;
  searchIndexBuffer?: Buffer;
  outputPath?: string;
  catalogVersion?: string;
  deterministicCreatedAt?: string;
  generator?: string;
  compression?: 'DEFLATE' | 'STORE';
}

export interface BuildPackageResult {
  success: boolean;
  packagePath?: string;
  packageBuffer?: Buffer;
  manifest?: ProvisioningManifest;
  catalog?: PrebuiltCatalog;
  searchIndex?: PrebuiltSearchIndex;
  catalogSizeBytes: number;
  searchIndexSizeBytes?: number;
  packageSizeBytes: number;
  compressionRatio: number;
  packageContentHash: string;
  catalogSha256: string;
  searchIndexSha256?: string;
  snapshotId: string;
  catalogVersion: string;
  durationMs: number;
  errors: string[];
}

export interface PackageValidationResult {
  valid: boolean;
  manifest?: ProvisioningManifest;
  searchIndex?: PrebuiltSearchIndex;
  errors: string[];
  warnings: string[];
}
