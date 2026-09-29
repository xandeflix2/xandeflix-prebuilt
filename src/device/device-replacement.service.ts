/**
 * R2F8Q — fluxo cliente da substituição atômica de dispositivo.
 *
 * O UUID local atual permanece inalterado. Somente o token novo é gerado
 * neste dispositivo; a rede recebe exclusivamente o hash desse token. O
 * estado local só é persistido depois da confirmação remota sanitizada.
 */

import { ControlPlaneCrypto } from '../control-plane/crypto/control-plane-crypto.ts';
import type {
  DeviceReplacementConfirmation,
  DeviceReplacementRequest,
} from '../control-plane/device-replacement.types.ts';
import type { RemoteManagerControlPlaneAuthority } from '../control-plane/client/manager-remote-control-plane-authority.ts';
import { getManagerRemoteControlPlaneAuthority } from '../control-plane/client/manager-remote-control-plane-authority.ts';
import type { DeviceIdentity, StoredActivationState } from './device.types.ts';
import { DeviceIdentityService } from './device-identity.service.ts';

export interface SourceReadyPreflightResult {
  status: 'SOURCE_READY';
}

export interface DeviceReplacementContext {
  getIdentity(): Promise<DeviceIdentity>;
  loadActivationState(): Promise<StoredActivationState | null>;
  saveActivationState(state: StoredActivationState): Promise<void>;
}

export interface ReplaceCurrentManagedDeviceInput {
  oldDeviceId: string;
  runSourceReadyPreflight?: () => Promise<SourceReadyPreflightResult>;
}

export interface DeviceReplacementClientResult {
  confirmation: DeviceReplacementConfirmation;
  localDeviceId: string;
  sourceReadyPreflight?: SourceReadyPreflightResult;
}

const DEFAULT_CONTEXT: DeviceReplacementContext = {
  getIdentity: () => DeviceIdentityService.getOrCreateIdentity(),
  loadActivationState: () => DeviceIdentityService.loadActivationState(),
  saveActivationState: (state) => DeviceIdentityService.saveActivationState(state),
};

function requireSecureRandomBytes(byteLength: number): Uint8Array {
  const getRandomValues = globalThis.crypto?.getRandomValues;
  if (typeof getRandomValues !== 'function') {
    throw new Error('DEVICE_REPLACEMENT_CSPRNG_UNAVAILABLE');
  }

  const bytes = new Uint8Array(byteLength);
  getRandomValues.call(globalThis.crypto, bytes);
  return bytes;
}

function toBase64(bytes: Uint8Array): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let output = '';
  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index];
    const second = index + 1 < bytes.length ? bytes[index + 1] : 0;
    const third = index + 2 < bytes.length ? bytes[index + 2] : 0;
    const value = (first << 16) | (second << 8) | third;
    output += alphabet[(value >>> 18) & 63];
    output += alphabet[(value >>> 12) & 63];
    output += index + 1 < bytes.length ? alphabet[(value >>> 6) & 63] : '=';
    output += index + 2 < bytes.length ? alphabet[value & 63] : '=';
  }
  return output;
}

async function generateNewToken(previousToken?: string): Promise<{ rawToken: string; tokenHash: string }> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const rawToken = toBase64(requireSecureRandomBytes(32));
    if (rawToken === previousToken) continue;
    return { rawToken, tokenHash: await ControlPlaneCrypto.sha256(rawToken) };
  }
  throw new Error('DEVICE_REPLACEMENT_TOKEN_REUSE_DETECTED');
}

function assertCurrentActivation(
  identity: DeviceIdentity,
  activation: StoredActivationState | null
): asserts activation is StoredActivationState {
  if (
    !activation ||
    activation.deviceId !== identity.deviceId ||
    activation.status !== 'AUTHORIZED' ||
    activation.licenseMode !== 'MANAGED' ||
    typeof activation.deviceAuthToken !== 'string' ||
    activation.deviceAuthToken.length === 0
  ) {
    throw new Error('DEVICE_REPLACEMENT_LOCAL_STATE_INVALID');
  }
}

export class DeviceReplacementService {
  private readonly manager: Pick<RemoteManagerControlPlaneAuthority, 'replaceDevice'>;
  private readonly context: DeviceReplacementContext;

  constructor(
    manager: Pick<RemoteManagerControlPlaneAuthority, 'replaceDevice'>,
    context: DeviceReplacementContext = DEFAULT_CONTEXT
  ) {
    this.manager = manager;
    this.context = context;
  }

  async replaceCurrentManagedDevice(
    input: ReplaceCurrentManagedDeviceInput
  ): Promise<DeviceReplacementClientResult> {
    const identity = await this.context.getIdentity();
    const activation = await this.context.loadActivationState();
    assertCurrentActivation(identity, activation);

    const token = await generateNewToken(activation.deviceAuthToken);
    const request: DeviceReplacementRequest = {
      oldDeviceId: input.oldDeviceId,
      newDeviceId: identity.deviceId,
      newDeviceTokenHash: token.tokenHash,
      newDisplayCode: identity.displayCode,
      newDeviceType: identity.deviceType,
      newDeviceLabel: identity.deviceLabel,
    };

    const confirmation = await this.manager.replaceDevice(request);

    await this.context.saveActivationState({
      ...activation,
      deviceId: identity.deviceId,
      displayCode: identity.displayCode,
      deviceType: identity.deviceType,
      deviceLabel: identity.deviceLabel,
      licenseMode: 'MANAGED',
      status: 'AUTHORIZED',
      deviceAuthToken: token.rawToken,
      lastVerifiedAtIso: new Date().toISOString(),
      activatedAtIso: activation.activatedAtIso ?? new Date().toISOString(),
    });

    const sourceReadyPreflight = input.runSourceReadyPreflight
      ? await input.runSourceReadyPreflight()
      : undefined;

    return {
      confirmation,
      localDeviceId: identity.deviceId,
      sourceReadyPreflight,
    };
  }
}

export async function replaceCurrentManagedDevice(
  input: ReplaceCurrentManagedDeviceInput
): Promise<DeviceReplacementClientResult> {
  const manager = getManagerRemoteControlPlaneAuthority();
  if (!manager) throw new Error('MANAGER_REMOTE_AUTHORITY_UNAVAILABLE');
  return new DeviceReplacementService(manager).replaceCurrentManagedDevice(input);
}
