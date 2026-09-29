/** Lock estrutural do handle temporário de reativação. */
export const PENDING_DEVICE_REACTIVATION_HANDLE_LOCK_ID =
  'PENDING_DEVICE_REACTIVATION_HANDLE_LOCK_V1';

export const PENDING_DEVICE_REACTIVATION_HANDLE_LOCK_INVARIANTS = [
  'same-device-id',
  'handle-survives-ui-route-lifecycle',
  'raw-token-device-local-only',
  'no-plaintext-browser-storage',
  'no-secret-logging-or-ui',
  'expired-handle-fails-closed',
  'successful-finalization-clears-handle',
  'canonical-device-binding',
  'old-approved-request-never-reconstructed',
  'fresh-csprng-token',
  'license-source-binding-unchanged',
] as const;

export const PENDING_DEVICE_REACTIVATION_HANDLE_LOCK_MATERIAL =
  `${PENDING_DEVICE_REACTIVATION_HANDLE_LOCK_ID}\n${PENDING_DEVICE_REACTIVATION_HANDLE_LOCK_INVARIANTS.join('\n')}`;

export const PENDING_DEVICE_REACTIVATION_HANDLE_LOCK_HASH =
  '823519EE818373E2988244629CDCF3008E72674B721AAD8122B640AFBE96B636';
