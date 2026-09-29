import type {
  ManagedSourceStatus,
  RemoteSourceAuthorizationMetadata,
  SourceProtocol,
} from './control-plane.types.ts';
import type { LicenseMode } from '../device/device.types.ts';

export type SourceAuthorityOrigin =
  | 'MANAGED_CONTROL_PLANE'
  | 'MANAGED_DEVICE_DELIVERY'
  | 'LOCAL_SECURE_SOURCE'
  | 'TMP_TEST_ARTIFACT';

export interface SourceAuthorityCandidate {
  mode: LicenseMode;
  sourceId?: string;
  sourceVersion?: number;
  protocol?: SourceProtocol;
  sourceStatus?: ManagedSourceStatus;
  deviceId: string;
  deviceAuthorized: boolean;
  licenseActive: boolean;
  bindingAuthorized: boolean;
  /** Remote status is diagnostic-only; it never grants authority. */
  remoteStatus?: RemoteSourceAuthorizationMetadata['status'];
  origin: SourceAuthorityOrigin;
}

export type SourceAuthorityDecision =
  | {
      outcome: 'SOURCE_READY';
      selected: SourceAuthorityCandidate;
      staleTmpVersionObserved?: number;
      staleTmpSelected: false;
    }
  | {
      outcome: 'SELF_SERVICE_LOCAL';
      staleTmpVersionObserved?: number;
      staleTmpSelected: false;
    }
  | {
      outcome: 'SOURCE_NOT_BOUND' | 'SOURCE_ACTION_REQUIRED' | 'SOURCE_AUTHORITY_CONFLICT';
      staleTmpVersionObserved?: number;
      staleTmpSelected: false;
    }
  | {
      outcome: 'DEVICE_NOT_AUTHORIZED';
      staleTmpVersionObserved?: number;
      staleTmpSelected: false;
    };

export interface ResolveSourceAuthorityOptions {
  mode: LicenseMode;
  deviceId: string;
  managedCandidates?: readonly SourceAuthorityCandidate[];
  localSecureCandidate?: SourceAuthorityCandidate;
  tmpCandidate?: SourceAuthorityCandidate;
  allowLocalSecureFallback?: boolean;
}

const PRIMARY_ORIGINS = new Set<SourceAuthorityOrigin>([
  'MANAGED_CONTROL_PLANE',
  'MANAGED_DEVICE_DELIVERY',
]);

function validSourceId(sourceId: unknown): sourceId is string {
  return typeof sourceId === 'string' && /^src_[a-z0-9]+$/.test(sourceId);
}

function validVersion(sourceVersion: unknown): sourceVersion is number {
  return typeof sourceVersion === 'number' && Number.isSafeInteger(sourceVersion) && sourceVersion >= 1;
}

function validManagedCandidate(
  candidate: SourceAuthorityCandidate | undefined,
  deviceId: string,
): candidate is SourceAuthorityCandidate {
  return Boolean(
    candidate &&
      candidate.mode === 'MANAGED' &&
      candidate.deviceId === deviceId &&
      candidate.deviceAuthorized &&
      candidate.licenseActive &&
      candidate.bindingAuthorized &&
      validSourceId(candidate.sourceId) &&
      validVersion(candidate.sourceVersion) &&
      (candidate.protocol === 'M3U' || candidate.protocol === 'XTREAM') &&
      candidate.sourceStatus === 'ACTIVE'
  );
}

function authorityIdentity(candidate: SourceAuthorityCandidate): string {
  return [
    candidate.sourceId,
    candidate.sourceVersion,
    candidate.protocol,
    candidate.sourceStatus,
    candidate.deviceId,
  ].join('|');
}

function staleVersion(candidate: SourceAuthorityCandidate | undefined): number | undefined {
  return candidate?.origin === 'TMP_TEST_ARTIFACT' && validVersion(candidate.sourceVersion)
    ? candidate.sourceVersion
    : undefined;
}

/**
 * Selects the authority for a Managed source without using version as a blind
 * max(). The Control Plane/device-authorized candidates are the only primary
 * authority tier. A tmp candidate is diagnostic input only and is never
 * eligible for selection.
 */
export function resolveSourceAuthority(
  options: ResolveSourceAuthorityOptions,
): SourceAuthorityDecision {
  const observedTmpVersion = staleVersion(options.tmpCandidate);

  if (options.mode === 'SELF_SERVICE') {
    return {
      outcome: 'SELF_SERVICE_LOCAL',
      staleTmpVersionObserved: observedTmpVersion,
      staleTmpSelected: false,
    };
  }

  const candidates = (options.managedCandidates ?? []).filter((candidate) =>
    PRIMARY_ORIGINS.has(candidate.origin),
  );
  const validPrimary = candidates.filter((candidate) =>
    validManagedCandidate(candidate, options.deviceId),
  );

  // Preserve an explicit remote authentication denial. It must not be
  // inferred as a missing binding merely because the candidate is invalid.
  // This branch is diagnostic-only and does not make any candidate eligible.
  const remoteDeviceNotAuthorized = candidates.some(
    (candidate) =>
      candidate.deviceId === options.deviceId &&
      candidate.remoteStatus === 'DEVICE_NOT_AUTHORIZED',
  );

  if (remoteDeviceNotAuthorized && validPrimary.length === 0) {
    return {
      outcome: 'DEVICE_NOT_AUTHORIZED',
      staleTmpVersionObserved: observedTmpVersion,
      staleTmpSelected: false,
    };
  }

  const hasDisabledOrUnboundPrimary = candidates.some(
    (candidate) =>
      candidate.deviceId === options.deviceId &&
      candidate.mode === 'MANAGED' &&
      (candidate.sourceStatus === 'DISABLED' || !candidate.bindingAuthorized),
  );

  if (validPrimary.length > 0) {
    const identities = new Set(validPrimary.map(authorityIdentity));
    if (identities.size !== 1) {
      return {
        outcome: 'SOURCE_AUTHORITY_CONFLICT',
        staleTmpVersionObserved: observedTmpVersion,
        staleTmpSelected: false,
      };
    }

    const selected = [...validPrimary].sort((left, right) =>
      left.origin.localeCompare(right.origin),
    )[0];

    return {
      outcome: 'SOURCE_READY',
      selected,
      staleTmpVersionObserved: observedTmpVersion,
      staleTmpSelected: false,
    };
  }

  if (
    options.allowLocalSecureFallback &&
    validManagedCandidate(options.localSecureCandidate, options.deviceId)
  ) {
    return {
      outcome: 'SOURCE_READY',
      selected: options.localSecureCandidate,
      staleTmpVersionObserved: observedTmpVersion,
      staleTmpSelected: false,
    };
  }

  return {
    outcome: hasDisabledOrUnboundPrimary ? 'SOURCE_NOT_BOUND' : 'SOURCE_ACTION_REQUIRED',
    staleTmpVersionObserved: observedTmpVersion,
    staleTmpSelected: false,
  };
}

/** Converts sanitized remote metadata into the primary authority candidate. */
export function candidateFromRemoteMetadata(
  metadata: RemoteSourceAuthorizationMetadata,
  deviceId: string,
): SourceAuthorityCandidate {
  const authorized = metadata.status === 'SOURCE_READY' || metadata.status === 'SOURCE_ACTION_REQUIRED';
  const licenseActive = metadata.status !== 'LICENSE_INVALID';
  const bindingAuthorized = metadata.status === 'SOURCE_READY' && Boolean(metadata.sourceId);

  return {
    mode: metadata.mode ?? 'MANAGED',
    sourceId: metadata.sourceId,
    sourceVersion: metadata.sourceVersion,
    protocol: metadata.protocol,
    sourceStatus: metadata.sourceStatus,
    deviceId,
    deviceAuthorized: authorized,
    licenseActive,
    bindingAuthorized,
    remoteStatus: metadata.status,
    origin: 'MANAGED_CONTROL_PLANE',
  };
}

/** Builds a non-authoritative observation from a lab/tmp metadata record. */
export function candidateFromTmpMetadata(input: {
  deviceId: string;
  sourceId?: string;
  sourceVersion?: number;
  protocol?: SourceProtocol;
  sourceStatus?: ManagedSourceStatus;
  mode?: LicenseMode;
  deviceAuthorized?: boolean;
  licenseActive?: boolean;
  bindingAuthorized?: boolean;
}): SourceAuthorityCandidate {
  return {
    mode: input.mode ?? 'MANAGED',
    sourceId: input.sourceId,
    sourceVersion: input.sourceVersion,
    protocol: input.protocol,
    sourceStatus: input.sourceStatus,
    deviceId: input.deviceId,
    deviceAuthorized: input.deviceAuthorized ?? true,
    licenseActive: input.licenseActive ?? true,
    bindingAuthorized: input.bindingAuthorized ?? true,
    origin: 'TMP_TEST_ARTIFACT',
  };
}
