/**
 * R2F8T atomic stale reactivation expiry boundary.
 * This lock is a review fingerprint and is unrelated to tokens or secrets.
 */
export const REACTIVATION_STALE_REQUEST_EXPIRY_LOCK_ID =
  'REACTIVATION_STALE_REQUEST_EXPIRY_LOCK_V1';

export const REACTIVATION_STALE_REQUEST_EXPIRY_LOCK_INVARIANTS = [
  'stale-pending-expires-atomically-before-create',
  'stale-approved-expires-atomically-before-create',
  'expired-never-blocks-fresh-request',
  'non-expired-active-request-still-blocks',
  'only-one-active-request-per-device',
  'no-manager-cleanup-required',
  'expired-cannot-approve-or-finalize',
  'fresh-request-gets-fresh-crypto-material',
  'device-license-source-binding-preserved',
  'no-secret-exposure',
] as const;

export const REACTIVATION_STALE_REQUEST_EXPIRY_LOCK_MATERIAL =
  `${REACTIVATION_STALE_REQUEST_EXPIRY_LOCK_ID}\n${REACTIVATION_STALE_REQUEST_EXPIRY_LOCK_INVARIANTS.join('\n')}`;

export const REACTIVATION_STALE_REQUEST_EXPIRY_LOCK_HASH =
  '88BB501184330C33D666EDBB4B4DE68B68D7B1F365382D31FF91C968A916E762';
