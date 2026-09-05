/**
 * Xandeflix Prebuilt — Incremental Update Types (Gate G9)
 *
 * Contratos de tipos canônicos para atualização incremental de catálogo e busca.
 *
 * Princípios:
 * - DELTA_PACKAGE_FORMAT_VERSION = 1
 * - DELTA_BASE_BINDING = STRICT
 * - DELTA_TRANSPORT = INCREMENTAL
 * - TARGET_STORAGE = FULL_CANONICAL_SNAPSHOT
 * - IN_PLACE_ACTIVE_PATCH = PROHIBITED
 * - ACTIVE_SNAPSHOT_IMMUTABLE_DURING_UPDATE = REQUIRED
 */

export const DELTA_PACKAGE_FORMAT_VERSION = 1;
export const DELTA_MANIFEST_FILENAME = 'delta-manifest.json';
export const CATALOG_DELTA_FILENAME = 'catalog-delta.json';
export const SEARCH_DELTA_FILENAME = 'search-index-delta.json';

export type TargetPackageProfile = 'CATALOG_ONLY' | 'SEARCH_ENABLED';

export type UpdateState =
  | 'UPDATE_IDLE'
  | 'UPDATE_VALIDATING_DELTA'
  | 'UPDATE_BASE_MISMATCH'
  | 'UPDATE_APPLYING'
  | 'UPDATE_STAGING'
  | 'UPDATE_VALIDATING_TARGET'
  | 'UPDATE_PROMOTING'
  | 'UPDATE_SUCCESS'
  | 'UPDATE_FAILED_ACTIVE_PRESERVED'
  | 'FULL_PACKAGE_REQUIRED';

export interface DeltaManifest {
  deltaFormatVersion: 1;
  baseSnapshotId: string;
  targetSnapshotId: string;
  baseCatalogVersion: string;
  targetCatalogVersion: string;
  baseCatalogSha256: string;
  targetCatalogSha256: string;
  catalogDeltaFile: 'catalog-delta.json';
  catalogDeltaSha256: string;
  catalogDeltaSizeBytes: number;
  targetPackageProfile: TargetPackageProfile;
  searchDeltaFile?: 'search-index-delta.json';
  baseSearchIndexContentHash?: string;
  targetSearchIndexContentHash?: string;
  searchDeltaSha256?: string;
  searchDeltaSizeBytes?: number;
  targetSearchIndexSha256?: string;
  deltaContentHash: string;
  generatedAt: string;
  generator: string;
}

export interface IncrementalUpdateMetrics {
  deltaValidateMs: number;
  catalogDeltaApplyMs: number;
  searchDeltaApplyMs: number;
  targetCatalogValidateMs: number;
  targetSearchValidateMs: number;
  stagingWriteMs: number;
  stagingReadbackMs: number;
  promotionMs: number;
  totalUpdateMs: number;
  deltaPackageSizeBytes: number;
  fullTargetPackageSizeBytes?: number;
  deltaToFullRatio?: number;
}

export interface IncrementalUpdateResult {
  success: boolean;
  state: UpdateState;
  snapshotId?: string;
  catalogVersion?: string;
  previousSnapshotId?: string;
  metrics: IncrementalUpdateMetrics;
  errors: string[];
  warnings: string[];
}

export interface DeltaCompatibilityCheck {
  compatible: boolean;
  reason?: 'BASE_MISMATCH' | 'PROFILE_MISMATCH' | 'DOWNGRADE' | 'ALREADY_ACTIVE' | 'UNSUPPORTED_VERSION';
  message: string;
  fullPackageRequired: boolean;
}
