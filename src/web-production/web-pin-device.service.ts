import { DeviceIdentityService } from '../device/device-identity.service.ts';
import { parentalControl } from '../parental/parental-control.store.ts';
import { isPublicConsumerWeb } from './session-context.ts';
import { webAccessRequest } from './web-access.client.ts';
import { createRecoveryEnvelope, signRecoveryChallenge } from './web-pin-recovery.crypto.ts';
import { readRecoveryEnvelope, withRecoveryLock, writeRecoveryEnvelope } from './web-pin-recovery.storage.ts';
async function nativeProof() {
  if (isPublicConsumerWeb()) throw new Error('WEB_PIN_NATIVE_REQUIRED');
  const state = await DeviceIdentityService.loadActivationState();
  if (state?.status !== 'AUTHORIZED' || !state.deviceAuthToken || state.deviceAuthToken.startsWith('xw1_')) throw new Error('WEB_PIN_NATIVE_REQUIRED');
  return { deviceId: state.deviceId, deviceAuthToken: state.deviceAuthToken };
}
export interface DeviceWebPinState { configured: boolean; recoveryReady: boolean; localRecoveryReady: boolean }
export async function readDeviceWebPinState(): Promise<DeviceWebPinState> {
  const proof = await nativeProof(), state = await webAccessRequest('DEVICE_STATE', proof), local = readRecoveryEnvelope();
  return { configured: state.configured === true, recoveryReady: typeof state.publicKey === 'string',
    localRecoveryReady: !!local && local.deviceId === proof.deviceId && local.publicKey === state.publicKey };
}
export function saveDeviceWebPin(puk: string, pin: string, currentWebPin: string): Promise<void> {
  return withRecoveryLock(async () => {
    const proof = await nativeProof();
    if (!await parentalControl.authorizeWebPin(puk, pin)) throw new Error('WEB_PIN_PUK_INVALID');
    const state = await webAccessRequest('DEVICE_STATE', proof);
    let envelope = readRecoveryEnvelope();
    if (envelope && envelope.deviceId !== proof.deviceId) throw new Error('WEB_PIN_RECOVERY_UNAVAILABLE');
    if (state.publicKey) {
      if (!envelope || envelope.publicKey !== state.publicKey) throw new Error('WEB_PIN_RECOVERY_UNAVAILABLE');
      const challenge = await webAccessRequest('DEVICE_CHALLENGE', proof);
      if (typeof challenge.challenge !== 'string' || typeof challenge.challengeId !== 'string'
        || !challenge.challenge.startsWith(`xandeflix:c156:${proof.deviceId}:`)) throw new Error('WEB_PIN_RECOVERY_UNAVAILABLE');
      const signature = await signRecoveryChallenge(envelope, puk, challenge.challenge, pin);
      await webAccessRequest('DEVICE_RECOVER', { ...proof, pin, challengeId: challenge.challengeId, signature });
    } else {
      if (!envelope) { envelope = await createRecoveryEnvelope(proof.deviceId, puk); writeRecoveryEnvelope(envelope); }
      // Verify the saved local envelope before making a permanent remote registration.
      await signRecoveryChallenge(envelope, puk, 'xandeflix:c156:local-check', pin);
      await webAccessRequest('DEVICE_REGISTER', { ...proof, pin, currentPin: currentWebPin, publicKey: envelope.publicKey });
    }
  });
}
