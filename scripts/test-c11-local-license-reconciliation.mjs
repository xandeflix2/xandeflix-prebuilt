import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BootSyncCoordinator } from '../src/bootstrap/boot-sync-coordinator.ts';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const identity = {
  deviceId: 'device-1',
  displayCode: 'XF-ABCD-EFGH',
  deviceType: 'TABLET',
  deviceLabel: 'TABLET TESTE',
  createdAtIso: '2026-09-23T00:00:00.000Z',
};
const activePointer = {
  kind: 'REAL',
  sourceId: 'src_uhwh5cio',
  sourceVersion: 11,
  snapshotId: 'real-snapshot-v11',
};

function createActivation(overrides = {}) {
  return {
    deviceId: identity.deviceId,
    displayCode: identity.displayCode,
    deviceType: identity.deviceType,
    deviceLabel: identity.deviceLabel,
    status: 'AUTHORIZED',
    licenseMode: 'MANAGED',
    deviceAuthToken: 'test-device-token',
    activatedAtIso: '2026-09-11T02:01:04.821Z',
    ...overrides,
  };
}

function createAuthority(overrides = {}) {
  return {
    status: 'SOURCE_READY',
    mode: 'MANAGED',
    licenseId: 'L1',
    licenseStatus: 'ACTIVE',
    sourceId: 'src_uhwh5cio',
    sourceVersion: 11,
    protocol: 'M3U',
    sourceStatus: 'ACTIVE',
    ...overrides,
  };
}

function createHarness(initialActivation, authority) {
  let savedActivation = initialActivation;
  let saveCalls = 0;
  let sourceCalls = 0;
  const context = {
    getOrCreateIdentity: async () => identity,
    loadActivationState: async () => savedActivation,
    saveActivationState: async (next) => {
      saveCalls += 1;
      savedActivation = next;
    },
  };
  const coordinator = new BootSyncCoordinator({
    deviceContext: context,
    sourceResolver: async () => {
      sourceCalls += 1;
      return authority;
    },
    bootstrapService: {
      getActivePointer: async () => activePointer,
    },
  });
  return {
    coordinator,
    getActivation: () => savedActivation,
    getSaveCalls: () => saveCalls,
    getSourceCalls: () => sourceCalls,
  };
}

let passed = 0;
async function test(name, fn) {
  await fn();
  passed += 1;
  console.log(`PASS ${name}`);
}

await test('TEST_A_AUTHORIZED_INCOMPLETE_RECONCILES', async () => {
  const h = createHarness(createActivation({ licenseId: null, licenseStatus: null }), createAuthority());
  const result = await h.coordinator.coordinateBootSync();
  const activation = h.getActivation();
  assert.equal(result.outcome, 'NO_OP');
  assert.equal(activation.licenseId, 'L1');
  assert.equal(activation.licenseStatus, 'ACTIVE');
  assert.equal(activation.licenseMode, 'MANAGED');
  assert.equal(activation.deviceId, identity.deviceId);
  assert.equal(activation.displayCode, identity.displayCode);
  assert.equal(h.getSaveCalls(), 1);
});

await test('TEST_B_AUTHORIZED_COMPLETE_IS_IDEMPOTENT', async () => {
  const h = createHarness(createActivation({ licenseId: 'L1', licenseStatus: 'ACTIVE' }), createAuthority());
  const first = await h.coordinator.coordinateBootSync();
  const second = await h.coordinator.coordinateBootSync();
  assert.equal(first.outcome, 'NO_OP');
  assert.equal(second.outcome, 'NO_OP');
  assert.equal(h.getSaveCalls(), 0);
});

await test('TEST_C_PENDING_STATE_REMAINS_FAIL_CLOSED', async () => {
  const h = createHarness(createActivation({ status: 'PENDING_MANAGER_APPROVAL' }), createAuthority());
  const result = await h.coordinator.coordinateBootSync();
  assert.equal(result.outcome, 'DEVICE_NOT_AUTHORIZED');
  assert.equal(h.getSaveCalls(), 0);
  assert.equal(h.getSourceCalls(), 0);
});

await test('TEST_D_REMOTE_LICENSE_MISSING_FAILS_CLOSED', async () => {
  const h = createHarness(createActivation({ licenseId: null, licenseStatus: null }), createAuthority({ licenseId: undefined, licenseStatus: undefined }));
  const result = await h.coordinator.coordinateBootSync();
  assert.equal(result.outcome, 'RECONCILIATION_FAILED');
  assert.equal(h.getActivation().licenseId, null);
  assert.equal(h.getActivation().licenseStatus, null);
  assert.equal(h.getSaveCalls(), 0);
});

await test('TEST_E_DEVICE_IDENTITY_IS_NOT_OVERWRITTEN', async () => {
  const h = createHarness(createActivation({ deviceId: 'different-device', displayCode: 'XF-DIFF-ERNT' }), createAuthority());
  const result = await h.coordinator.coordinateBootSync();
  assert.equal(result.outcome, 'DEVICE_NOT_AUTHORIZED');
  assert.equal(h.getActivation().deviceId, 'different-device');
  assert.equal(h.getActivation().displayCode, 'XF-DIFF-ERNT');
  assert.equal(h.getSaveCalls(), 0);
});

await test('TEST_F_SOURCE_POINTER_IS_PRESERVED', async () => {
  const h = createHarness(createActivation({ licenseId: null, licenseStatus: null }), createAuthority());
  const result = await h.coordinator.coordinateBootSync();
  assert.equal(result.sourceId, 'src_uhwh5cio');
  assert.equal(result.outcome, 'NO_OP');
  assert.deepEqual(activePointer, {
    kind: 'REAL',
    sourceId: 'src_uhwh5cio',
    sourceVersion: 11,
    snapshotId: 'real-snapshot-v11',
  });
});

await test('TEST_G_STALE_CONTROL_PLANE_STATE_IS_NOT_AUTHORITY', async () => {
  const source = fs.readFileSync(path.join(rootDir, 'src/bootstrap/boot-sync-coordinator.ts'), 'utf8');
  assert.equal(source.includes('control-plane-state.json'), false);
});

await test('TEST_H_SELF_SERVICE_COMPLETE_REGRESSION', async () => {
  const h = createHarness(
    createActivation({ licenseMode: 'SELF_SERVICE', licenseId: 'L2', licenseStatus: 'ACTIVE' }),
    createAuthority({ mode: 'SELF_SERVICE', licenseId: 'L2' }),
  );
  const result = await h.coordinator.coordinateBootSync();
  assert.equal(result.outcome, 'NO_OP');
  assert.equal(h.getSaveCalls(), 0);
});

await test('TEST_I_MANAGED_COMPLETE_REGRESSION', async () => {
  const h = createHarness(createActivation({ licenseId: 'L1', licenseStatus: 'ACTIVE' }), createAuthority());
  const result = await h.coordinator.coordinateBootSync();
  assert.equal(result.outcome, 'NO_OP');
  assert.equal(h.getActivation().licenseMode, 'MANAGED');
  assert.equal(h.getSaveCalls(), 0);
});

console.log(`C11 local license reconciliation: ${passed}/9 PASS`);
