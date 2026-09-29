import type {
  DeviceIdentity,
  LicenseMode,
  StoredActivationState,
  StoredLicenseStatus,
} from './device.types.ts';

export interface AuthorizationReconciliationMetadata {
  status: 'SOURCE_READY' | string;
  mode?: LicenseMode;
  licenseId?: string;
  licenseStatus?: StoredLicenseStatus;
}

export interface ReconcileAuthorizedActivationStateInput {
  identity: DeviceIdentity;
  deviceAuthToken: string;
  metadata: AuthorizationReconciliationMetadata;
  previousState?: StoredActivationState | null;
  activatedAtIso?: string;
}

/**
 * Atualiza apenas a autorização observada remotamente e preserva os campos
 * de licença já conhecidos localmente. Nenhum identificador é inventado.
 */
export function reconcileAuthorizedActivationState(
  input: ReconcileAuthorizedActivationStateInput,
): StoredActivationState | null {
  const { identity, deviceAuthToken, metadata, previousState } = input;
  if (metadata.status !== 'SOURCE_READY') return null;

  const licenseMode = metadata.mode ?? previousState?.licenseMode;
  if (!licenseMode) return null;

  return {
    deviceId: identity.deviceId,
    displayCode: identity.displayCode,
    deviceType: identity.deviceType,
    deviceLabel: identity.deviceLabel,
    status: 'AUTHORIZED',
    licenseId: metadata.licenseId ?? previousState?.licenseId,
    licenseMode,
    licenseStatus: metadata.licenseStatus ?? previousState?.licenseStatus,
    deviceAuthToken,
    activatedAtIso: input.activatedAtIso ?? previousState?.activatedAtIso ?? new Date().toISOString(),
    lastVerifiedAtIso: new Date().toISOString(),
  };
}
