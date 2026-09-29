/**
 * Canonical security boundary for same-device reactivation.
 *
 * The hash is a review fingerprint of the ordered invariants below. It is not
 * derived from or related to any device token, license key or source secret.
 */
export const AUTHORIZED_DEVICE_REACTIVATION_LOCK_ID = 'AUTHORIZED_DEVICE_REACTIVATION_LOCK_V1';

export const AUTHORIZED_DEVICE_REACTIVATION_LOCK_INVARIANTS = [
  'same-device-id',
  'no-license-key-paste',
  'client-side-csprng-token',
  'server-hash-only',
  'device-authorized-after',
  'license-preserved',
  'source-binding-preserved',
  'net-slot-delta-zero',
  'local-write-after-remote-pass',
  'failure-safe',
  'retry-idempotent',
  'no-secret-logging',
] as const;

export const AUTHORIZED_DEVICE_REACTIVATION_LOCK_HASH =
  'EF5E9C6FE6A640A6EB854E764EC26ECA0126952F6010A21165D0C1B382B53590';
