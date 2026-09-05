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

export const PACKAGE_FORMAT_VERSION = 1;
export const SCHEMA_VERSION = 1;
export const MANIFEST_FILENAME = 'manifest.json';
export const CATALOG_FILENAME = 'catalog.json';

export interface ProvisioningManifest {
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

export interface BuildPackageOptions {
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
  catalogSizeBytes: number;
  packageSizeBytes: number;
  compressionRatio: number;
  packageContentHash: string;
  catalogSha256: string;
  snapshotId: string;
  catalogVersion: string;
  durationMs: number;
  errors: string[];
}

export interface PackageValidationResult {
  valid: boolean;
  manifest?: ProvisioningManifest;
  errors: string[];
  warnings: string[];
}
