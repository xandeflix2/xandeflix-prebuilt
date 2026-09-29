import type { SourceAuthorityCandidate } from '../control-plane/source-resolution-authority.ts';

export const SNAPSHOT_STAGING_PROMOTION_BOUNDARY_LOCK_ID =
  'SNAPSHOT_STAGING_PROMOTION_BOUNDARY_LOCK_V1';

export interface StagingCandidatePlan {
  candidateSnapshotId: string;
  sourceId: string;
  sourceVersion: number;
  protocol: 'M3U' | 'XTREAM';
  mode: 'MANAGED';
  promotionRequired: 'SIM';
}

export function createManagedStagingCandidatePlan(
  authority: SourceAuthorityCandidate,
): StagingCandidatePlan {
  if (
    authority.origin !== 'MANAGED_CONTROL_PLANE' &&
    authority.origin !== 'MANAGED_DEVICE_DELIVERY'
  ) {
    throw new Error('STAGING_CANDIDATE_REQUIRES_MANAGED_AUTHORITY');
  }

  const sourceId = authority.sourceId;
  const sourceVersion = authority.sourceVersion;
  const protocol = authority.protocol;
  if (
    !sourceId ||
    typeof sourceVersion !== 'number' ||
    !Number.isSafeInteger(sourceVersion) ||
    sourceVersion < 1 ||
    (protocol !== 'M3U' && protocol !== 'XTREAM')
  ) {
    throw new Error('STAGING_CANDIDATE_INVALID_MANAGED_METADATA');
  }

  return {
    candidateSnapshotId: `candidate-managed-${sourceId}-v${sourceVersion}`,
    sourceId,
    sourceVersion,
    protocol,
    mode: 'MANAGED',
    promotionRequired: 'SIM',
  };
}
