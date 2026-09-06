/**
 * Xandeflix Prebuilt — Delta Manifest Helpers (Gate G9)
 *
 * Criação, serialização e cálculo de hash de conteúdo determinístico para o DeltaManifest.
 *
 * Princípios:
 * - DELTA_CONTENT_HASH_ALGORITHM = SHA256
 * - DELTA_DETERMINISTIC = SIM (generatedAt é excluído da identidade lógica)
 */

import crypto from 'node:crypto';
import { calculateArtifactDigest } from '../security/artifact-hash.ts';
import type { DeltaManifest, TargetPackageProfile } from './update.types.ts';

export interface CreateDeltaManifestOptions {
  baseSnapshotId: string;
  targetSnapshotId: string;
  baseCatalogVersion: string;
  targetCatalogVersion: string;
  baseCatalogSha256: string;
  targetCatalogSha256: string;
  catalogDeltaSha256: string;
  catalogDeltaSizeBytes: number;
  targetPackageProfile: TargetPackageProfile;
  searchDeltaFile?: 'search-index-delta.json';
  baseSearchIndexContentHash?: string;
  targetSearchIndexContentHash?: string;
  searchDeltaSha256?: string;
  searchDeltaSizeBytes?: number;
  targetSearchIndexSha256?: string;
  generator?: string;
  deterministicGeneratedAt?: string;
}

export function calculateDeltaContentHash(input: {
  deltaFormatVersion: number;
  baseSnapshotId: string;
  targetSnapshotId: string;
  baseCatalogVersion: string;
  targetCatalogVersion: string;
  baseCatalogSha256: string;
  targetCatalogSha256: string;
  catalogDeltaFile: string;
  catalogDeltaSha256: string;
  catalogDeltaSizeBytes: number;
  targetPackageProfile: string;
  searchDeltaFile?: string;
  baseSearchIndexContentHash?: string;
  targetSearchIndexContentHash?: string;
  searchDeltaSha256?: string;
  searchDeltaSizeBytes?: number;
  targetSearchIndexSha256?: string;
}): string {
  const canonicalPayload = JSON.stringify({
    deltaFormatVersion: input.deltaFormatVersion,
    baseSnapshotId: input.baseSnapshotId,
    targetSnapshotId: input.targetSnapshotId,
    baseCatalogVersion: input.baseCatalogVersion,
    targetCatalogVersion: input.targetCatalogVersion,
    baseCatalogSha256: input.baseCatalogSha256,
    targetCatalogSha256: input.targetCatalogSha256,
    catalogDeltaFile: input.catalogDeltaFile,
    catalogDeltaSha256: input.catalogDeltaSha256,
    catalogDeltaSizeBytes: input.catalogDeltaSizeBytes,
    targetPackageProfile: input.targetPackageProfile,
    searchDeltaFile: input.searchDeltaFile,
    baseSearchIndexContentHash: input.baseSearchIndexContentHash,
    targetSearchIndexContentHash: input.targetSearchIndexContentHash,
    searchDeltaSha256: input.searchDeltaSha256,
    searchDeltaSizeBytes: input.searchDeltaSizeBytes,
    targetSearchIndexSha256: input.targetSearchIndexSha256,
  });

  if (crypto && typeof crypto.createHash === 'function') {
    return crypto.createHash('sha256').update(canonicalPayload).digest('hex');
  }
  const bytes = new TextEncoder().encode(canonicalPayload);
  return calculateArtifactDigest(bytes).sha256;
}

export function createDeltaManifest(options: CreateDeltaManifestOptions): DeltaManifest {
  const deltaFormatVersion = 1;
  const catalogDeltaFile = 'catalog-delta.json';

  const deltaContentHash = calculateDeltaContentHash({
    deltaFormatVersion,
    baseSnapshotId: options.baseSnapshotId,
    targetSnapshotId: options.targetSnapshotId,
    baseCatalogVersion: options.baseCatalogVersion,
    targetCatalogVersion: options.targetCatalogVersion,
    baseCatalogSha256: options.baseCatalogSha256,
    targetCatalogSha256: options.targetCatalogSha256,
    catalogDeltaFile,
    catalogDeltaSha256: options.catalogDeltaSha256,
    catalogDeltaSizeBytes: options.catalogDeltaSizeBytes,
    targetPackageProfile: options.targetPackageProfile,
    searchDeltaFile: options.searchDeltaFile,
    baseSearchIndexContentHash: options.baseSearchIndexContentHash,
    targetSearchIndexContentHash: options.targetSearchIndexContentHash,
    searchDeltaSha256: options.searchDeltaSha256,
    searchDeltaSizeBytes: options.searchDeltaSizeBytes,
    targetSearchIndexSha256: options.targetSearchIndexSha256,
  });

  const generatedAt = options.deterministicGeneratedAt || new Date().toISOString();
  const generator = options.generator || 'xandeflix-prebuilt-delta-builder/1.0';

  const manifest: DeltaManifest = {
    deltaFormatVersion: 1,
    baseSnapshotId: options.baseSnapshotId,
    targetSnapshotId: options.targetSnapshotId,
    baseCatalogVersion: options.baseCatalogVersion,
    targetCatalogVersion: options.targetCatalogVersion,
    baseCatalogSha256: options.baseCatalogSha256,
    targetCatalogSha256: options.targetCatalogSha256,
    catalogDeltaFile,
    catalogDeltaSha256: options.catalogDeltaSha256,
    catalogDeltaSizeBytes: options.catalogDeltaSizeBytes,
    targetPackageProfile: options.targetPackageProfile,
    deltaContentHash,
    generatedAt,
    generator,
  };

  if (options.targetPackageProfile === 'SEARCH_ENABLED') {
    manifest.searchDeltaFile = options.searchDeltaFile || 'search-index-delta.json';
    manifest.baseSearchIndexContentHash = options.baseSearchIndexContentHash;
    manifest.targetSearchIndexContentHash = options.targetSearchIndexContentHash;
    manifest.searchDeltaSha256 = options.searchDeltaSha256;
    manifest.searchDeltaSizeBytes = options.searchDeltaSizeBytes;
    manifest.targetSearchIndexSha256 = options.targetSearchIndexSha256;
  }

  return manifest;
}

export function serializeDeltaManifest(manifest: DeltaManifest): string {
  return JSON.stringify(manifest, null, 2);
}
