/**
 * Xandeflix Prebuilt — Device Bootstrap Types
 *
 * Tipos canônicos para importação, persistência local e bootstrap rápido no dispositivo (G5).
 *
 * Princípios:
 * - ACTIVE_GENERATION_SAFETY = REQUIRED
 * - NO_FALSE_EMPTY = REQUIRED
 * - FAIL_CLOSED_IMPORT = REQUIRED
 * - SAME_PACKAGE_REIMPORT = IDEMPOTENT
 */

import type { PrebuiltCatalog } from '../contracts/catalog.ts';
import type { ProvisioningManifest } from '../provisioning/types.ts';

export type BootstrapStatus =
  | 'NO_ACTIVE_CATALOG'
  | 'IMPORT_IN_PROGRESS'
  | 'ACTIVE_CATALOG_READY'
  | 'IMPORT_FAILED_ACTIVE_PRESERVED';

export interface ActivePointer {
  snapshotId: string;
  catalogVersion: string;
  schemaVersion: number;
  packageContentHash: string;
  promotedAt: string;
  searchIndexVersion?: number;
  searchIndexContentHash?: string;
}

export interface ImportMetrics {
  packageValidateMs: number;
  stagingWriteMs: number;
  stagingReadbackValidateMs: number;
  promotionMs: number;
  totalBootstrapMs: number;
  packageSizeBytes: number;
  catalogSizeBytes: number;
  activeStorageSizeBytes: number;
}

export interface ImportResult {
  success: boolean;
  status: 'PROMOTED' | 'ALREADY_ACTIVE' | 'REJECTED';
  snapshotId?: string;
  catalogVersion?: string;
  previousSnapshotId?: string;
  metrics: ImportMetrics;
  errors: string[];
  warnings: string[];
}

export interface ImportPackageOptions {
  forceReimport?: boolean;
}

export interface BootstrapSummary {
  status: BootstrapStatus;
  activePointer: ActivePointer | null;
  hasActiveCatalog: boolean;
  isReady: boolean;
}

export interface ActiveCatalogData {
  manifest: ProvisioningManifest;
  catalog: PrebuiltCatalog;
  pointer: ActivePointer;
}
