import { DeviceIdentityService } from '../device/device-identity.service.ts';
import {
  PendingDeviceReactivationStore,
  validatePendingDeviceReactivationHandle,
} from '../device/pending-device-reactivation.store.ts';
import type { AuthorizedDeviceReactivationHandle } from '../control-plane/device-reactivation.types.ts';

type PendingHandleDiagnosticStep = 'basic' | 'prepare' | 'verify';

const SYNTHETIC_REQUEST_ID = '9b2e2f9e-3a07-4d3d-9bb5-5c8f2e2a7b11';
const SYNTHETIC_LABEL = 'TEST-ONLY PERSISTENCE';

let expectedHandle: AuthorizedDeviceReactivationHandle | undefined;

function createSyntheticToken(): string {
  const bytes = new Uint8Array(32);
  globalThis.crypto.getRandomValues(bytes);
  return `r2f8r_${Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')}`;
}

function createSyntheticHandle(identity: Awaited<ReturnType<typeof DeviceIdentityService.getOrCreateIdentity>>): AuthorizedDeviceReactivationHandle {
  const createdAtIso = new Date().toISOString();
  return {
    requestId: SYNTHETIC_REQUEST_ID,
    deviceId: identity.deviceId,
    rawDeviceToken: createSyntheticToken(),
    displayCode: identity.displayCode,
    deviceType: identity.deviceType,
    deviceLabel: SYNTHETIC_LABEL,
    createdAtIso,
    expiresAtIso: new Date(Date.parse(createdAtIso) + 10 * 60 * 1000).toISOString(),
  };
}

function sameHandle(a: AuthorizedDeviceReactivationHandle, b: AuthorizedDeviceReactivationHandle): boolean {
  return a.requestId === b.requestId
    && a.deviceId === b.deviceId
    && a.rawDeviceToken === b.rawDeviceToken
    && a.displayCode === b.displayCode
    && a.deviceType === b.deviceType
    && a.deviceLabel === b.deviceLabel
    && a.createdAtIso === b.createdAtIso
    && a.expiresAtIso === b.expiresAtIso;
}

function samePersistedMetadata(
  handle: AuthorizedDeviceReactivationHandle,
  identity: Awaited<ReturnType<typeof DeviceIdentityService.getOrCreateIdentity>>,
): boolean {
  try {
    validatePendingDeviceReactivationHandle(handle);
  } catch {
    return false;
  }
  return handle.requestId === SYNTHETIC_REQUEST_ID
    && handle.deviceId === identity.deviceId
    && handle.displayCode === identity.displayCode
    && handle.deviceType === identity.deviceType
    && handle.deviceLabel === SYNTHETIC_LABEL;
}

async function runBasic(): Promise<Record<string, string>> {
  const identity = await DeviceIdentityService.getOrCreateIdentity();
  const store = new PendingDeviceReactivationStore();
  const handle = createSyntheticHandle(identity);
  await store.save(handle);
  const loaded = await store.loadForDevice(identity.deviceId);
  const semanticMatch = Boolean(loaded && sameHandle(loaded, handle));
  await store.clear();
  const absent = (await store.load()) === undefined;
  return {
    RUNTIME_PLUGIN_AVAILABLE: 'SIM',
    PHYSICAL_SAVE_LOAD_BASIC: loaded && semanticMatch ? 'PASS' : 'FAIL',
    PHYSICAL_CLEAR: absent ? 'PASS' : 'FAIL',
  };
}

async function prepare(): Promise<Record<string, string>> {
  const identity = await DeviceIdentityService.getOrCreateIdentity();
  expectedHandle = createSyntheticHandle(identity);
  await new PendingDeviceReactivationStore().save(expectedHandle);
  return {
    RUNTIME_PLUGIN_AVAILABLE: 'SIM',
    STORE_SAVE_SUCCESS: 'SIM',
  };
}

async function verify(): Promise<Record<string, string>> {
  const identity = await DeviceIdentityService.getOrCreateIdentity();
  const store = new PendingDeviceReactivationStore();
  const loaded = await store.loadForDevice(identity.deviceId);
  const semanticMatch = Boolean(
    loaded
      && samePersistedMetadata(loaded, identity)
      && (!expectedHandle || sameHandle(loaded, expectedHandle)),
  );
  await store.clear();
  const absent = (await store.load()) === undefined;
  expectedHandle = undefined;
  return {
    RUNTIME_PLUGIN_AVAILABLE: 'SIM',
    STORE_LOAD_SUCCESS: loaded ? 'SIM' : 'NAO',
    STORE_SEMANTIC_MATCH: semanticMatch ? 'SIM' : 'NAO',
    STORE_CLEARED: 'SIM',
    STORE_LOAD_NOT_FOUND: absent ? 'SIM' : 'NAO',
  };
}

export function initDebugPendingDeviceReactivation(): void {
  (window as Window & {
    __XANDEFLIX_DEBUG_PENDING_HANDLE_STORE__?:
      (step?: PendingHandleDiagnosticStep) => Promise<Record<string, string>>;
  }).__XANDEFLIX_DEBUG_PENDING_HANDLE_STORE__ = async (step = 'basic') => {
    if (step === 'prepare') return prepare();
    if (step === 'verify') return verify();
    return runBasic();
  };
}
