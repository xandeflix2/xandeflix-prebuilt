/**
 * R2F8S lifecycle boundary for auditable Manager cancellation.
 * This lock is a review fingerprint, unrelated to any token or secret.
 */
export const DEVICE_REACTIVATION_REQUEST_LIFECYCLE_LOCK_ID =
  'DEVICE_REACTIVATION_REQUEST_LIFECYCLE_LOCK_V1';

export const DEVICE_REACTIVATION_REQUEST_LIFECYCLE_LOCK_INVARIANTS = [
  'approved-request-without-local-handle-is-never-reconstructed',
  'manager-may-explicitly-cancel-unusable-request',
  'cancelled-request-remains-auditable',
  'cancelled-request-cannot-finalize',
  'cancelled-request-cannot-be-approved',
  'fresh-same-device-request-only-after-previous-active-terminal',
  'fresh-request-gets-fresh-csprng-token',
  'only-one-active-request-per-device',
  'cancel-preserves-device-license-source-binding',
  'manager-rpc-returns-no-secret',
] as const;

export const DEVICE_REACTIVATION_REQUEST_LIFECYCLE_LOCK_MATERIAL =
  `${DEVICE_REACTIVATION_REQUEST_LIFECYCLE_LOCK_ID}\n${DEVICE_REACTIVATION_REQUEST_LIFECYCLE_LOCK_INVARIANTS.join('\n')}`;

export const DEVICE_REACTIVATION_REQUEST_LIFECYCLE_LOCK_HASH =
  '471286A5FFDE069E3C2E8F102C67992F2BB6A2146A257D50B1001E87AAD8F819';
