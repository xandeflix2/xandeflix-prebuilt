import type { DeviceIdentity, StoredActivationState, InstallationIdentity } from '../device/device.types.ts';
declare const __XANDEFLIX_WEB_PUBLIC__: boolean;
export const isPublicConsumerWeb = (): boolean => typeof __XANDEFLIX_WEB_PUBLIC__ !== 'undefined' && __XANDEFLIX_WEB_PUBLIC__;
export interface WebSessionResponse {
  success: boolean; sessionToken: string; sessionId: string;
  ttlSeconds: number; absoluteTtlSeconds: number; activation: StoredActivationState;
}
let current: { response: WebSessionResponse; expires: number } | undefined;
export function installPublicWebSession(response: WebSessionResponse): void {
  const state = response.activation;
  if (!response.success || !/^xw1_[0-9a-f]{64}$/.test(response.sessionToken) ||
      !/^[0-9a-f-]{36}$/.test(response.sessionId) || !state || state.status !== 'AUTHORIZED' ||
      !/^[A-Za-z0-9-]{1,128}$/.test(state.deviceId) || !/^XF-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(state.displayCode) ||
      !state.licenseId || !['MANAGED','SELF_SERVICE'].includes(state.licenseMode || '') ||
      !Number.isFinite(response.ttlSeconds) || !Number.isFinite(response.absoluteTtlSeconds) ||
      response.ttlSeconds <= 0 || response.absoluteTtlSeconds <= 0) throw new Error('WEB_SESSION_REQUIRED');
  if (current && current.response.activation.deviceId !== state.deviceId) throw new Error('WEB_ACCOUNT_RELOAD_REQUIRED');
  current = { response: { ...response, activation: { ...state } }, expires: performance.now() + Math.min(900, response.ttlSeconds, response.absoluteTtlSeconds) * 1000 };
}
export function publicWebSession(): WebSessionResponse {
  if (!current || performance.now() >= current.expires) throw new Error('WEB_SESSION_REQUIRED');
  return { ...current.response, activation: { ...current.response.activation } };
}
export function clearPublicWebSession(): void { current = undefined; }
export function delegatedActivation(): StoredActivationState {
  const session = publicWebSession();
  return { ...session.activation, deviceAuthToken: session.sessionToken };
}
export function delegatedIdentity(): DeviceIdentity {
  const state = delegatedActivation();
  return { deviceId: state.deviceId, displayCode: state.displayCode, deviceType: state.deviceType,
    deviceLabel: state.deviceLabel, createdAtIso: state.activatedAtIso || '1970-01-01T00:00:00.000Z' };
}
export function delegatedInstallation(): InstallationIdentity {
  // Compatibility with local telemetry only: never reported as an app installation.
  return { installationId: publicWebSession().sessionId, createdAtIso: '1970-01-01T00:00:00.000Z' };
}
