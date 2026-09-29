import { DeviceIdentityService } from '../../device/device-identity.service.ts';
import { getDevicePairingService } from './device-pairing.service.ts';
import { getDeviceActivationService } from './device-activation.service.ts';
import { getControlPlaneClient } from './control-plane-client.ts';
import { InstallationRegistryService } from './installation-registry.service.ts';
import type { LicenseMode, StoredActivationState } from '../../device/device.types.ts';

export async function ensurePendingDeviceActivationRequest(): Promise<boolean> {
  await InstallationRegistryService.reportInstallationBestEffort();
  const identity = await DeviceIdentityService.getOrCreateIdentity();
  const saved = await DeviceIdentityService.loadActivationState();
  if (saved?.status === 'AUTHORIZED') return false;

  const activationService = getDeviceActivationService();
  const keyInfo = await activationService.getOrCreateActivationKey();
  const pending = activationService.getPendingActivation();
  if (pending?.deviceId === identity.deviceId) {
    const status = await activationService.checkStatus(
      pending.activationId,
      identity.deviceId,
      pending.activationStatusSecret,
    );
    if (status.success && status.status === 'PENDING') {
      await activationService.registerPermanentKey({
        activationId: pending.activationId,
        deviceId: identity.deviceId,
        displayCode: identity.displayCode,
        activationKey: keyInfo.rawActivationKey,
      });
      return true;
    }
  }

  const installation = await DeviceIdentityService.getOrCreateInstallationIdentity();
  const tokenInfo = await getDevicePairingService().getOrCreateDeviceToken();
  const result = await activationService.requestActivation({
    installationId: installation.installationId,
    deviceId: identity.deviceId,
    displayCode: identity.displayCode,
    deviceTokenHash: tokenInfo.deviceTokenHash,
    activationKeyHash: keyInfo.activationKeyHash,
    deviceType: identity.deviceType,
    deviceLabel: identity.deviceLabel,
  });
  if (result.success && result.activationId) {
    await activationService.registerPermanentKey({
      activationId: result.activationId,
      deviceId: identity.deviceId,
      displayCode: identity.displayCode,
      activationKey: keyInfo.rawActivationKey,
    });
  }
  return result.success;
}

export async function syncPendingDeviceActivation(): Promise<StoredActivationState | null> {
  const identity = await DeviceIdentityService.getOrCreateIdentity();
  const pending = getDeviceActivationService().getPendingActivation();
  if (!pending || pending.deviceId !== identity.deviceId) return null;

  const status = await getDeviceActivationService().checkStatus(
    pending.activationId,
    identity.deviceId,
    pending.activationStatusSecret,
  );
  if (!status.success || status.status !== 'CONSUMED') return null;
  const tokenInfo = await getDevicePairingService().getOrCreateDeviceToken();
  let mode: LicenseMode = 'SELF_SERVICE';
  try {
    const metadata = await getControlPlaneClient().resolveSource({
      deviceId: identity.deviceId,
      deviceAuthToken: tokenInfo.rawDeviceToken,
    });
    mode = metadata.mode || mode;
  } catch {
    // O status CONSUMED já é a confirmação remota; a resolução da fonte pode
    // concluir no próximo ciclo sem reabrir o formulário externo.
  }

  const state: StoredActivationState = {
    deviceId: identity.deviceId,
    displayCode: identity.displayCode,
    deviceType: identity.deviceType,
    deviceLabel: identity.deviceLabel,
    status: 'AUTHORIZED',
    licenseMode: mode,
    licenseId: status.licenseId,
    licenseStatus: status.licenseStatus,
    deviceAuthToken: tokenInfo.rawDeviceToken,
    activatedAtIso: new Date().toISOString(),
  };
  await DeviceIdentityService.saveActivationState(state);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('xandeflix:activation-updated', { detail: state }));
  }
  return state;
}
