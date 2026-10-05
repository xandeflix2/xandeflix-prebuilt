import { DeviceIdentityService } from '../../device/device-identity.service.ts';
import { getDevicePairingService } from './device-pairing.service.ts';
import { getDeviceActivationService } from './device-activation.service.ts';
import { getControlPlaneClient } from './control-plane-client.ts';
import { InstallationRegistryService } from './installation-registry.service.ts';
import { activationDeadline } from './activation-timeout.ts';
import type { LicenseMode, StoredActivationState } from '../../device/device.types.ts';

let requestPromise: Promise<boolean> | null = null;
let syncPromise: Promise<StoredActivationState | null> | null = null;

export function ensurePendingDeviceActivationRequest(): Promise<boolean> {
  if (requestPromise) return requestPromise;
  const promise = ensurePendingRequest();
  requestPromise = promise;
  void promise.finally(() => {
    if (requestPromise === promise) requestPromise = null;
  }).catch(() => undefined);
  return promise;
}

async function ensurePendingRequest(): Promise<boolean> {
  // Resolve all canonical local values before contacting the control plane.
  const [identity, installation, keyInfo, tokenInfo] = await Promise.all([
    DeviceIdentityService.getOrCreateIdentity(),
    DeviceIdentityService.getOrCreateInstallationIdentity(),
    DeviceIdentityService.getOrCreateDeviceActivationKey(),
    getDevicePairingService().getOrCreateDeviceToken(),
  ]);
  const saved = await DeviceIdentityService.loadActivationState();
  if (saved?.status === 'AUTHORIZED') return false;

  const activationService = getDeviceActivationService();
  const pending = activationService.getPendingActivation();
  if (pending?.deviceId === identity.deviceId) {
    const status = await activationService.checkStatus(
      pending.activationId,
      identity.deviceId,
      pending.activationStatusSecret,
    );
    // Network failure is not cancellation. Never replace an unknown live session.
    if (!status.success) return false;
    if (status.status === 'CONSUMED') {
      await syncPendingDeviceActivation();
      return false;
    }
    if (status.status === 'PENDING') {
      const registered = await activationService.registerPermanentKey({
        activationId: pending.activationId,
        deviceId: identity.deviceId,
        displayCode: identity.displayCode,
        activationKey: keyInfo.rawActivationKey,
      });
      return registered.success;
    }
    if (status.status !== 'CANCELLED') return false;
  }

  const report = await InstallationRegistryService.reportInstallationBestEffort();
  if (!report?.success) return false;
  // A simultaneous CONSUMED poll may have authorized the device during the report.
  if ((await DeviceIdentityService.loadActivationState())?.status === 'AUTHORIZED') return false;
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
    const registered = await activationService.registerPermanentKey({
      activationId: result.activationId,
      deviceId: identity.deviceId,
      displayCode: identity.displayCode,
      activationKey: keyInfo.rawActivationKey,
    });
    return registered.success;
  }
  return false;
}

export function syncPendingDeviceActivation(): Promise<StoredActivationState | null> {
  if (syncPromise) return syncPromise;
  const promise = syncPendingActivation();
  syncPromise = promise;
  void promise.finally(() => {
    if (syncPromise === promise) syncPromise = null;
  }).catch(() => undefined);
  return promise;
}

async function syncPendingActivation(): Promise<StoredActivationState | null> {
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
    const metadata = await activationDeadline(() => getControlPlaneClient().resolveSource({
      deviceId: identity.deviceId,
      deviceAuthToken: tokenInfo.rawDeviceToken,
    }));
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
  if (!await DeviceIdentityService.saveActivationStateVerified(state)) return null;
  getDeviceActivationService().clearPendingActivation();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('xandeflix:activation-updated', { detail: state }));
  }
  return state;
}
