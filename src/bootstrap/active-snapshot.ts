/**
 * Xandeflix Prebuilt — Active Snapshot Utilities
 *
 * Funções determinísticas para gerenciamento e validação de ActivePointer.
 */

import type { ProvisioningManifest } from '../provisioning/types.ts';
import type { ActivePointer } from './types.ts';

export function createActivePointer(
  manifest: ProvisioningManifest,
  promotedAt?: string
): ActivePointer {
  const pointer: ActivePointer = {
    snapshotId: manifest.snapshotId,
    catalogVersion: manifest.catalogVersion,
    schemaVersion: manifest.schemaVersion,
    packageContentHash: manifest.packageContentHash,
    promotedAt: promotedAt || new Date().toISOString(),
  };

  if ('searchIndexVersion' in manifest) {
    pointer.searchIndexVersion = manifest.searchIndexVersion;
    pointer.searchIndexContentHash = manifest.searchIndexContentHash;
  }

  return pointer;
}

export function isValidActivePointer(pointer: unknown): pointer is ActivePointer {
  if (!pointer || typeof pointer !== 'object') return false;
  const p = pointer as Partial<ActivePointer>;
  return (
    typeof p.snapshotId === 'string' &&
    p.snapshotId.length > 0 &&
    typeof p.catalogVersion === 'string' &&
    p.catalogVersion.length > 0 &&
    typeof p.schemaVersion === 'number' &&
    p.schemaVersion > 0 &&
    typeof p.packageContentHash === 'string' &&
    p.packageContentHash.length === 64 &&
    typeof p.promotedAt === 'string' &&
    p.promotedAt.length > 0
  );
}

export function isSameActiveGeneration(
  current: ActivePointer | null,
  manifest: ProvisioningManifest
): boolean {
  if (!current) return false;
  return (
    current.snapshotId === manifest.snapshotId &&
    current.packageContentHash.toLowerCase() === manifest.packageContentHash.toLowerCase()
  );
}
