/**
 * Canonical contract lock for Commercial Control Plane V1.
 *
 * This lock is a review fingerprint of the ordered invariants below.
 * It is not derived from or related to any device token, license key or source secret.
 */
export const COMMERCIAL_CONTROL_PLANE_V1_LOCK_ID =
  'COMMERCIAL_CONTROL_PLANE_V1_LOCK';

export const COMMERCIAL_CONTROL_PLANE_V1_LOCK_INVARIANTS = [
  'customer-license-device-separation',
  'installation-device-separation',
  'max-devices-vs-concurrency-separation',
  'client-generated-device-token-raw',
  'server-stores-device-token-hash-only',
  'pairing-holds-installation-pre-auth',
  'pairing-code-temporary-single-use',
  'trial-7-days-first-pairing-trigger',
  'trial-privacy-scope-account-only-mvp',
  'post-expiry-app-and-catalog-preserved',
  'post-expiry-playback-blocked',
  'remote-self-service-vault-authorized-delivery',
  'local-self-service-channel-preserved',
  'managed-mode-and-baseline-preserved',
  'vault-secrets-zero-plaintext-public',
  'session-rpc-mutual-authorization',
  'session-timing-configurable-defaults',
  'device-to-source-direct-zero-media-proxy',
] as const;

export const COMMERCIAL_CONTROL_PLANE_V1_LOCK_MATERIAL =
  `${COMMERCIAL_CONTROL_PLANE_V1_LOCK_ID}\n${COMMERCIAL_CONTROL_PLANE_V1_LOCK_INVARIANTS.join('\n')}`;

export const COMMERCIAL_CONTROL_PLANE_V1_LOCK_HASH =
  'D080BFA78D6FAEBEC92809119382284CEF10E439275364F8FE05EA51DD385826';
