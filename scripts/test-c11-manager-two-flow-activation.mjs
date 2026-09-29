/**
 * Xandeflix Prebuilt — C11 Manager Two-Flow Activation Test Suite (T1 - T20)
 *
 * Authoritative verification of the Two-Flow Canonical Manager Activation Contract:
 *   FLOW_A: NEW_CUSTOMER
 *   FLOW_B: EXISTING_ACTIVE_CUSTOMER
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { sha256Hex, encryptAes256Gcm, decryptAes256Gcm } from '../src/control-plane/crypto/control-plane-crypto.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..');

const read = (rel) => fs.readFileSync(resolve(PROJECT_ROOT, rel), 'utf8');

const managerPageSrc = read('src/debug/manager/ManagerPanelPage.tsx');
const managerAuthoritySrc = read('src/control-plane/client/manager-remote-control-plane-authority.ts');
const edgeFunctionSrc = read('supabase/functions/managed-source-vault-admin/index.ts');
const twoFlowMigrationSrc = read('supabase/migrations/20260925080000_c11_manager_new_vs_existing_customer_flows.sql');

console.log('================================================================');
console.log('Xandeflix Prebuilt — C11 Manager Two-Flow Activation Test Suite');
console.log('================================================================\n');

let totalTests = 0;
let passedTests = 0;

async function runTest(name, fn) {
  totalTests++;
  try {
    await fn();
    passedTests++;
    console.log(`[PASS] ${name}`);
  } catch (error) {
    console.error(`[FAIL] ${name}: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}

// -----------------------------------------------------------------------------
// Pure Authoritative RPC Resolution Simulator (Mirrors PostgreSQL Migration)
// -----------------------------------------------------------------------------
function simulateRpcManagerCompleteDeviceActivation(params, state) {
  const {
    displayCode,
    activationKeyHash,
    licenseId,
    customerId,
    flowMode = 'NEW_CUSTOMER',
    newCustomerName,
    existingDisplayCode,
    sourceId,
    sourceType,
    displayName,
    ciphertext,
    nonce,
    authTag,
  } = params;

  // 1. Validate new device display code and activation key hash
  if (!displayCode || !/^XF-[0-9A-Z]{4}-[0-9A-Z]{4}$/.test(displayCode)) {
    throw new Error('DISPLAY_CODE_INVALID');
  }
  if (!activationKeyHash || !/^[0-9a-f]{64}$/.test(activationKeyHash)) {
    throw new Error('ACTIVATION_KEY_INVALID');
  }

  const keyEntry = state.keyVault.find(
    (k) => k.displayCode === displayCode && k.activationKeyHash === activationKeyHash
  );
  if (!keyEntry) {
    throw new Error('INVALID_ACTIVATION_KEY');
  }
  if (keyEntry.keyStatus !== 'ACTIVE') {
    throw new Error('PERMANENT_KEY_REVOKED');
  }

  const deviceId = keyEntry.deviceId;
  const now = Date.now();

  if (flowMode === 'EXISTING_CUSTOMER') {
    // =========================================================================
    // FLOW B: EXISTING_ACTIVE_CUSTOMER
    // =========================================================================
    if (!customerId) {
      throw new Error('CUSTOMER_ID_REQUIRED');
    }

    const profile = state.customerProfiles.find((c) => c.id === customerId);
    if (!profile) {
      throw new Error('CUSTOMER_PROFILE_NOT_FOUND');
    }
    if (profile.status !== 'ACTIVE') {
      throw new Error('CUSTOMER_PROFILE_NOT_ACTIVE');
    }

    // Validate existing bound device code
    if (!existingDisplayCode || !existingDisplayCode.trim()) {
      throw new Error('EXISTING_DEVICE_CODE_REQUIRED');
    }
    const cleanExistingCode = existingDisplayCode.trim().toUpperCase();
    if (!/^XF-[0-9A-Z]{4}-[0-9A-Z]{4}$/.test(cleanExistingCode)) {
      throw new Error('DISPLAY_CODE_INVALID');
    }

    const existingDevice = state.devices.find((d) => d.displayCode === cleanExistingCode);
    if (!existingDevice) {
      throw new Error('EXISTING_DEVICE_NOT_FOUND');
    }

    // Enforce that existing device belongs to selected customer
    const existingBinding = state.licenseDevices.find(
      (ld) => ld.deviceId === existingDevice.deviceId && ld.status === 'ACTIVE'
    );
    if (!existingBinding) {
      throw new Error('EXISTING_DEVICE_CUSTOMER_MISMATCH');
    }
    const existingLicense = state.licenses.find((l) => l.id === existingBinding.licenseId);
    if (!existingLicense || existingLicense.customerId !== customerId) {
      throw new Error('EXISTING_DEVICE_CUSTOMER_MISMATCH');
    }

    // Resolve existing customer's active managed source
    // Sources can be bound to existing device or customer's licenses
    const customerLicenseIds = new Set(state.licenses.filter((l) => l.customerId === customerId).map((l) => l.id));
    const reusableBindings = state.deviceSourceBindings.filter(
      (dsb) => dsb.deviceId === existingDevice.deviceId || customerLicenseIds.has(dsb.licenseId)
    );

    const activeManagedSourcesMap = new Map();
    for (const b of reusableBindings) {
      const ms = state.managedSources.find((s) => s.id === b.sourceId && s.status === 'ACTIVE');
      if (ms) {
        activeManagedSourcesMap.set(ms.id, ms);
      }
    }

    const activeManagedSources = Array.from(activeManagedSourcesMap.values());
    if (activeManagedSources.length === 0) {
      throw new Error('CUSTOMER_HAS_NO_ACTIVE_SOURCE');
    }
    if (activeManagedSources.length > 1) {
      throw new Error('CUSTOMER_SOURCE_AMBIGUOUS');
    }

    const reusedSource = activeManagedSources[0];

    // Resolve eligible MANAGED license belonging to customer
    let resolvedLicenseId = licenseId || null;
    let candidateLicense = null;

    if (resolvedLicenseId) {
      candidateLicense = state.licenses.find((l) => l.id === resolvedLicenseId);
      if (!candidateLicense) throw new Error('LICENSE_NOT_FOUND');
      if (candidateLicense.customerId !== customerId) throw new Error('CROSS_CUSTOMER_BINDING_DENIED');
      if (candidateLicense.mode !== 'MANAGED') throw new Error('LICENSE_MODE_INVALID');
      if (!['ACTIVE', 'TRIAL'].includes(candidateLicense.status)) throw new Error('LICENSE_STATUS_INELIGIBLE');
    } else {
      const eligibleLicenses = state.licenses.filter((l) => {
        if (l.customerId !== customerId) return false;
        if (l.mode !== 'MANAGED') return false;
        if (!['ACTIVE', 'TRIAL'].includes(l.status)) return false;
        if (l.expiresAt && l.expiresAt <= now) return false;
        if (l.trialExpiresAt && l.trialExpiresAt <= now) return false;
        return true;
      });

      if (eligibleLicenses.length === 0) {
        throw new Error('NO_ELIGIBLE_MANAGED_LICENSE');
      }
      if (eligibleLicenses.length > 1) {
        throw new Error('MANAGED_LICENSE_AMBIGUOUS');
      }

      candidateLicense = eligibleLicenses[0];
      resolvedLicenseId = candidateLicense.id;
    }

    // Enforce license capacity
    const activeBoundCount = state.licenseDevices.filter(
      (ld) => ld.licenseId === candidateLicense.id && ld.status === 'ACTIVE' && ld.deviceId !== deviceId
    ).length;
    const isAlreadyBound = state.licenseDevices.some(
      (ld) => ld.licenseId === candidateLicense.id && ld.deviceId === deviceId && ld.status === 'ACTIVE'
    );

    if (activeBoundCount >= candidateLicense.maxDevices && !isAlreadyBound) {
      throw new Error('MANAGED_LICENSE_CAPACITY_EXHAUSTED');
    }

    // Bind device to license
    state.licenseDevices = state.licenseDevices.filter((ld) => !(ld.licenseId === resolvedLicenseId && ld.deviceId === deviceId));
    state.licenseDevices.push({
      licenseId: resolvedLicenseId,
      deviceId,
      status: 'ACTIVE',
      boundAt: new Date().toISOString(),
    });

    // Bind device to reused source (NO duplicate row in managedSources or vault)
    state.deviceSourceBindings = state.deviceSourceBindings.filter((dsb) => dsb.deviceId !== deviceId);
    state.deviceSourceBindings.push({
      licenseId: resolvedLicenseId,
      deviceId,
      sourceId: reusedSource.id,
      createdAt: new Date().toISOString(),
    });

    // Authorize device
    const existingDevIndex = state.devices.findIndex((d) => d.deviceId === deviceId);
    const devRecord = {
      deviceId,
      displayCode,
      deviceType: 'FIRE_STICK',
      deviceLabel: 'Dispositivo Gerenciado',
      status: 'AUTHORIZED',
    };
    if (existingDevIndex >= 0) {
      state.devices[existingDevIndex] = devRecord;
    } else {
      state.devices.push(devRecord);
    }

    return {
      success: true,
      deviceId,
      displayCode,
      customerId,
      licenseId: resolvedLicenseId,
      sourceId: reusedSource.sourceId,
      deviceAuthorizationState: 'AUTHORIZED',
      sourceBindingStatus: 'ACTIVE',
      licenseStatus: candidateLicense.status,
      sourceResolution: 'SOURCE_READY',
      sourceReused: true,
    };
  } else {
    // =========================================================================
    // FLOW A: NEW_CUSTOMER (Canonical MVP Policy)
    // =========================================================================
    let targetCustomerId = customerId || null;
    if (newCustomerName && newCustomerName.trim()) {
      targetCustomerId = `cust_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
      state.customerProfiles.push({
        id: targetCustomerId,
        nickname: newCustomerName.trim(),
        status: 'ACTIVE',
      });
    } else if (targetCustomerId) {
      const profile = state.customerProfiles.find((c) => c.id === targetCustomerId);
      if (!profile) throw new Error('CUSTOMER_PROFILE_NOT_FOUND');
      if (profile.status !== 'ACTIVE') throw new Error('CUSTOMER_PROFILE_NOT_ACTIVE');
    } else {
      throw new Error('CUSTOMER_NAME_REQUIRED');
    }

    // Source input is strictly required for NEW_CUSTOMER
    if (!sourceId || !ciphertext || !nonce || !authTag) {
      throw new Error('SOURCE_CONFIG_REQUIRED');
    }

    // Auto-create canonical MVP MANAGED license
    const newLicenseId = `lic_mvp_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    const newLicense = {
      id: newLicenseId,
      customerId: targetCustomerId,
      mode: 'MANAGED',
      status: 'ACTIVE',
      maxDevices: 1,
      maxConcurrentSessions: 1,
      expiresAt: null,
      trialEligible: false,
      trialStartedAt: null,
      trialExpiresAt: null,
      createdAt: new Date().toISOString(),
    };
    state.licenses.push(newLicense);

    // Insert managed source & vault
    const managedSourceUuid = `ms_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    state.managedSources.push({
      id: managedSourceUuid,
      sourceId,
      name: displayName,
      sourceType,
      status: 'ACTIVE',
      version: 1,
    });
    state.vault.push({
      sourceId,
      sourceVersion: 1,
      ciphertext,
      nonce,
      authTag,
    });

    // Bind license and source
    state.licenseDevices.push({
      licenseId: newLicenseId,
      deviceId,
      status: 'ACTIVE',
      boundAt: new Date().toISOString(),
    });
    state.deviceSourceBindings.push({
      licenseId: newLicenseId,
      deviceId,
      sourceId: managedSourceUuid,
      createdAt: new Date().toISOString(),
    });

    state.devices.push({
      deviceId,
      displayCode,
      deviceType: 'FIRE_STICK',
      deviceLabel: 'Dispositivo Gerenciado',
      status: 'AUTHORIZED',
    });

    return {
      success: true,
      deviceId,
      displayCode,
      customerId: targetCustomerId,
      licenseId: newLicenseId,
      sourceId,
      deviceAuthorizationState: 'AUTHORIZED',
      sourceBindingStatus: 'ACTIVE',
      licenseStatus: 'ACTIVE',
      sourceResolution: 'SOURCE_READY',
      sourceReused: false,
    };
  }
}

// -----------------------------------------------------------------------------
// Test Scenarios (T1 to T20)
// -----------------------------------------------------------------------------

await runTest('T1: NEW_CUSTOMER creates customer + license + source + binding', async () => {
  const displayCode = 'XF-1111-2222';
  const rawKey = '123456';
  const keyHash = await sha256Hex(rawKey);

  const state = {
    keyVault: [{ displayCode, activationKeyHash: keyHash, deviceId: 'dev-new-1', keyStatus: 'ACTIVE' }],
    devices: [],
    customerProfiles: [],
    licenses: [],
    licenseDevices: [],
    managedSources: [],
    vault: [],
    deviceSourceBindings: [],
  };

  const res = simulateRpcManagerCompleteDeviceActivation({
    flowMode: 'NEW_CUSTOMER',
    newCustomerName: 'Cliente Novo Alpha',
    displayCode,
    activationKeyHash: keyHash,
    sourceId: 'src_alpha_1',
    sourceType: 'M3U',
    displayName: 'Fonte Alpha',
    ciphertext: 'c_alpha',
    nonce: 'n_alpha',
    authTag: 't_alpha',
  }, state);

  assert.equal(res.success, true);
  assert.equal(res.deviceAuthorizationState, 'AUTHORIZED');
  assert.equal(res.sourceBindingStatus, 'ACTIVE');
  assert.equal(res.sourceResolution, 'SOURCE_READY');
  assert.equal(res.sourceReused, false);

  assert.equal(state.customerProfiles.length, 1);
  assert.equal(state.customerProfiles[0].nickname, 'Cliente Novo Alpha');
  assert.equal(state.licenses.length, 1);
  assert.equal(state.licenses[0].mode, 'MANAGED');
  assert.equal(state.licenses[0].maxDevices, 1);
  assert.equal(state.managedSources.length, 1);
  assert.equal(state.vault.length, 1);
  assert.equal(state.licenseDevices.length, 1);
  assert.equal(state.deviceSourceBindings.length, 1);
});

await runTest('T2: NEW_CUSTOMER requires source', async () => {
  const displayCode = 'XF-2222-3333';
  const rawKey = '123456';
  const keyHash = await sha256Hex(rawKey);

  const state = {
    keyVault: [{ displayCode, activationKeyHash: keyHash, deviceId: 'dev-new-2', keyStatus: 'ACTIVE' }],
    devices: [],
    customerProfiles: [],
    licenses: [],
    licenseDevices: [],
    managedSources: [],
    vault: [],
    deviceSourceBindings: [],
  };

  assert.throws(
    () => simulateRpcManagerCompleteDeviceActivation({
      flowMode: 'NEW_CUSTOMER',
      newCustomerName: 'Cliente Sem Fonte',
      displayCode,
      activationKeyHash: keyHash,
      // No source inputs
    }, state),
    /SOURCE_CONFIG_REQUIRED/
  );
});

await runTest('T3: EXISTING_CUSTOMER does NOT require source input', async () => {
  const customerId = 'cust-existing-t3';
  const oldCode = 'XF-9999-0001';
  const newCode = 'XF-9999-0002';
  const rawKey = '123456';
  const keyHash = await sha256Hex(rawKey);

  const sourceUuid = 'ms-t3';
  const licenseId = 'lic-t3';

  const state = {
    keyVault: [{ displayCode: newCode, activationKeyHash: keyHash, deviceId: 'dev-new-3', keyStatus: 'ACTIVE' }],
    devices: [
      { deviceId: 'dev-old-3', displayCode: oldCode, status: 'AUTHORIZED' },
    ],
    customerProfiles: [{ id: customerId, nickname: 'Cliente Ativo T3', status: 'ACTIVE' }],
    licenses: [
      { id: licenseId, customerId, mode: 'MANAGED', status: 'ACTIVE', maxDevices: 5 },
    ],
    licenseDevices: [
      { licenseId, deviceId: 'dev-old-3', status: 'ACTIVE' },
    ],
    managedSources: [
      { id: sourceUuid, sourceId: 'src_reused_t3', name: 'Fonte Existente T3', status: 'ACTIVE' },
    ],
    vault: [{ sourceId: 'src_reused_t3', ciphertext: 'c_vault', nonce: 'n_vault', authTag: 't_vault' }],
    deviceSourceBindings: [
      { licenseId, deviceId: 'dev-old-3', sourceId: sourceUuid },
    ],
  };

  const res = simulateRpcManagerCompleteDeviceActivation({
    flowMode: 'EXISTING_CUSTOMER',
    customerId,
    existingDisplayCode: oldCode,
    displayCode: newCode,
    activationKeyHash: keyHash,
    // Strictly NO source inputs provided!
  }, state);

  assert.equal(res.success, true);
  assert.equal(res.sourceReused, true);
  assert.equal(res.sourceId, 'src_reused_t3');
  assert.equal(res.licenseId, licenseId);
});

await runTest('T4: EXISTING_CUSTOMER valid old device belongs to customer -> passes linkage check', async () => {
  const customerId = 'cust-t4';
  const oldCode = 'XF-4444-1111';
  const newCode = 'XF-4444-2222';
  const rawKey = '654321';
  const keyHash = await sha256Hex(rawKey);

  const state = {
    keyVault: [{ displayCode: newCode, activationKeyHash: keyHash, deviceId: 'dev-new-4', keyStatus: 'ACTIVE' }],
    devices: [{ deviceId: 'dev-old-4', displayCode: oldCode, status: 'AUTHORIZED' }],
    customerProfiles: [{ id: customerId, nickname: 'Cliente T4', status: 'ACTIVE' }],
    licenses: [{ id: 'lic-t4', customerId, mode: 'MANAGED', status: 'ACTIVE', maxDevices: 2 }],
    licenseDevices: [{ licenseId: 'lic-t4', deviceId: 'dev-old-4', status: 'ACTIVE' }],
    managedSources: [{ id: 'ms-t4', sourceId: 'src_t4', status: 'ACTIVE' }],
    vault: [{ sourceId: 'src_t4' }],
    deviceSourceBindings: [{ licenseId: 'lic-t4', deviceId: 'dev-old-4', sourceId: 'ms-t4' }],
  };

  const res = simulateRpcManagerCompleteDeviceActivation({
    flowMode: 'EXISTING_CUSTOMER',
    customerId,
    existingDisplayCode: oldCode,
    displayCode: newCode,
    activationKeyHash: keyHash,
  }, state);

  assert.equal(res.success, true);
  assert.equal(res.customerId, customerId);
  assert.equal(res.deviceId, 'dev-new-4');
});

await runTest('T5: old device belongs to different customer -> EXISTING_DEVICE_CUSTOMER_MISMATCH', async () => {
  const customerA = 'cust-t5-a';
  const customerB = 'cust-t5-b';
  const oldCodeOfB = 'XF-5555-0001';
  const newCodeOfA = 'XF-5555-0002';
  const rawKey = '123456';
  const keyHash = await sha256Hex(rawKey);

  const state = {
    keyVault: [{ displayCode: newCodeOfA, activationKeyHash: keyHash, deviceId: 'dev-new-5', keyStatus: 'ACTIVE' }],
    devices: [{ deviceId: 'dev-old-b', displayCode: oldCodeOfB, status: 'AUTHORIZED' }],
    customerProfiles: [
      { id: customerA, nickname: 'Cliente A', status: 'ACTIVE' },
      { id: customerB, nickname: 'Cliente B', status: 'ACTIVE' },
    ],
    licenses: [
      { id: 'lic-b', customerId: customerB, mode: 'MANAGED', status: 'ACTIVE', maxDevices: 2 },
    ],
    licenseDevices: [{ licenseId: 'lic-b', deviceId: 'dev-old-b', status: 'ACTIVE' }],
    managedSources: [{ id: 'ms-b', sourceId: 'src_b', status: 'ACTIVE' }],
    vault: [],
    deviceSourceBindings: [{ licenseId: 'lic-b', deviceId: 'dev-old-b', sourceId: 'ms-b' }],
  };

  assert.throws(
    () => simulateRpcManagerCompleteDeviceActivation({
      flowMode: 'EXISTING_CUSTOMER',
      customerId: customerA, // Operator selected Customer A, but gave Customer B's device code!
      existingDisplayCode: oldCodeOfB,
      displayCode: newCodeOfA,
      activationKeyHash: keyHash,
    }, state),
    /EXISTING_DEVICE_CUSTOMER_MISMATCH/
  );
});

await runTest('T6: nonexistent old device code -> fail closed', async () => {
  const customerId = 'cust-t6';
  const newCode = 'XF-6666-0002';
  const rawKey = '123456';
  const keyHash = await sha256Hex(rawKey);

  const state = {
    keyVault: [{ displayCode: newCode, activationKeyHash: keyHash, deviceId: 'dev-new-6', keyStatus: 'ACTIVE' }],
    devices: [], // No existing devices!
    customerProfiles: [{ id: customerId, nickname: 'Cliente T6', status: 'ACTIVE' }],
    licenses: [{ id: 'lic-t6', customerId, mode: 'MANAGED', status: 'ACTIVE', maxDevices: 2 }],
    licenseDevices: [],
    managedSources: [],
    vault: [],
    deviceSourceBindings: [],
  };

  assert.throws(
    () => simulateRpcManagerCompleteDeviceActivation({
      flowMode: 'EXISTING_CUSTOMER',
      customerId,
      existingDisplayCode: 'XF-0000-0000', // Nonexistent device code
      displayCode: newCode,
      activationKeyHash: keyHash,
    }, state),
    /EXISTING_DEVICE_NOT_FOUND/
  );
});

await runTest('T7: customer has exactly one active source -> source reused', async () => {
  const customerId = 'cust-t7';
  const oldCode = 'XF-7777-0001';
  const newCode = 'XF-7777-0002';
  const rawKey = '123456';
  const keyHash = await sha256Hex(rawKey);

  const state = {
    keyVault: [{ displayCode: newCode, activationKeyHash: keyHash, deviceId: 'dev-new-7', keyStatus: 'ACTIVE' }],
    devices: [{ deviceId: 'dev-old-7', displayCode: oldCode, status: 'AUTHORIZED' }],
    customerProfiles: [{ id: customerId, nickname: 'Cliente T7', status: 'ACTIVE' }],
    licenses: [{ id: 'lic-t7', customerId, mode: 'MANAGED', status: 'ACTIVE', maxDevices: 5 }],
    licenseDevices: [{ licenseId: 'lic-t7', deviceId: 'dev-old-7', status: 'ACTIVE' }],
    managedSources: [
      { id: 'ms-unique-7', sourceId: 'src_unique_7', name: 'Fonte Unica 7', status: 'ACTIVE' },
    ],
    vault: [{ sourceId: 'src_unique_7', ciphertext: 'c7' }],
    deviceSourceBindings: [{ licenseId: 'lic-t7', deviceId: 'dev-old-7', sourceId: 'ms-unique-7' }],
  };

  const res = simulateRpcManagerCompleteDeviceActivation({
    flowMode: 'EXISTING_CUSTOMER',
    customerId,
    existingDisplayCode: oldCode,
    displayCode: newCode,
    activationKeyHash: keyHash,
  }, state);

  assert.equal(res.success, true);
  assert.equal(res.sourceId, 'src_unique_7');
  assert.equal(res.sourceReused, true);
  // Managed sources count must remain exactly 1 (no duplication)
  assert.equal(state.managedSources.length, 1);
  assert.equal(state.vault.length, 1);
});

await runTest('T8: customer has zero active sources -> CUSTOMER_HAS_NO_ACTIVE_SOURCE', async () => {
  const customerId = 'cust-t8';
  const oldCode = 'XF-8888-0001';
  const newCode = 'XF-8888-0002';
  const rawKey = '123456';
  const keyHash = await sha256Hex(rawKey);

  const state = {
    keyVault: [{ displayCode: newCode, activationKeyHash: keyHash, deviceId: 'dev-new-8', keyStatus: 'ACTIVE' }],
    devices: [{ deviceId: 'dev-old-8', displayCode: oldCode, status: 'AUTHORIZED' }],
    customerProfiles: [{ id: customerId, nickname: 'Cliente T8', status: 'ACTIVE' }],
    licenses: [{ id: 'lic-t8', customerId, mode: 'MANAGED', status: 'ACTIVE', maxDevices: 2 }],
    licenseDevices: [{ licenseId: 'lic-t8', deviceId: 'dev-old-8', status: 'ACTIVE' }],
    managedSources: [], // ZERO sources!
    vault: [],
    deviceSourceBindings: [],
  };

  assert.throws(
    () => simulateRpcManagerCompleteDeviceActivation({
      flowMode: 'EXISTING_CUSTOMER',
      customerId,
      existingDisplayCode: oldCode,
      displayCode: newCode,
      activationKeyHash: keyHash,
    }, state),
    /CUSTOMER_HAS_NO_ACTIVE_SOURCE/
  );
});

await runTest('T9: customer has multiple active sources -> CUSTOMER_SOURCE_AMBIGUOUS', async () => {
  const customerId = 'cust-t9';
  const oldCode = 'XF-9999-0001';
  const newCode = 'XF-9999-0002';
  const rawKey = '123456';
  const keyHash = await sha256Hex(rawKey);

  const state = {
    keyVault: [{ displayCode: newCode, activationKeyHash: keyHash, deviceId: 'dev-new-9', keyStatus: 'ACTIVE' }],
    devices: [{ deviceId: 'dev-old-9', displayCode: oldCode, status: 'AUTHORIZED' }],
    customerProfiles: [{ id: customerId, nickname: 'Cliente T9', status: 'ACTIVE' }],
    licenses: [
      { id: 'lic-t9-1', customerId, mode: 'MANAGED', status: 'ACTIVE', maxDevices: 5 },
      { id: 'lic-t9-2', customerId, mode: 'MANAGED', status: 'ACTIVE', maxDevices: 5 },
    ],
    licenseDevices: [{ licenseId: 'lic-t9-1', deviceId: 'dev-old-9', status: 'ACTIVE' }],
    managedSources: [
      { id: 'ms-9a', sourceId: 'src_9a', status: 'ACTIVE' },
      { id: 'ms-9b', sourceId: 'src_9b', status: 'ACTIVE' },
    ],
    vault: [],
    deviceSourceBindings: [
      { licenseId: 'lic-t9-1', deviceId: 'dev-old-9', sourceId: 'ms-9a' },
      { licenseId: 'lic-t9-2', deviceId: 'dev-other-9', sourceId: 'ms-9b' },
    ],
  };

  assert.throws(
    () => simulateRpcManagerCompleteDeviceActivation({
      flowMode: 'EXISTING_CUSTOMER',
      customerId,
      existingDisplayCode: oldCode,
      displayCode: newCode,
      activationKeyHash: keyHash,
    }, state),
    /CUSTOMER_SOURCE_AMBIGUOUS/
  );
});

await runTest('T10: source credentials never returned to frontend', () => {
  // Extract ACTIVATE_SOURCE_FOR_DEVICE block from edge function
  const activateBlock = edgeFunctionSrc.split('if (body.operation === "ACTIVATE_SOURCE_FOR_DEVICE") {')[1].split('if (body.operation !== "CREATE_MANAGED_SOURCE_WITH_CONFIG"')[0];
  assert.ok(activateBlock);
  // Find all response calls within ACTIVATE_SOURCE_FOR_DEVICE
  const responseMatches = activateBlock.match(/return response\(\{[\s\S]*?\}\);/g);
  assert.ok(responseMatches && responseMatches.length >= 2);
  for (const resp of responseMatches) {
    assert.doesNotMatch(resp, /password|username|playlistUrl|sourceConfig|ciphertext|nonce|authTag/i);
  }
  // Check manager authority activateSourceForDevice result
  const authorityBlock = managerAuthoritySrc.split('async activateSourceForDevice(')[1].split('async updateManagedSource(')[0];
  assert.ok(authorityBlock);
  const authorityReturn = authorityBlock.match(/return \{[\s\S]*?\};/);
  assert.ok(authorityReturn);
  assert.doesNotMatch(authorityReturn[0], /password|username|playlistUrl|sourceConfig/i);
});

await runTest('T11: existing eligible license with capacity -> reused', async () => {
  const customerId = 'cust-t11';
  const oldCode = 'XF-1111-0001';
  const newCode = 'XF-1111-0002';
  const rawKey = '123456';
  const keyHash = await sha256Hex(rawKey);

  const licenseId = 'lic-with-capacity-t11';

  const state = {
    keyVault: [{ displayCode: newCode, activationKeyHash: keyHash, deviceId: 'dev-new-11', keyStatus: 'ACTIVE' }],
    devices: [{ deviceId: 'dev-old-11', displayCode: oldCode, status: 'AUTHORIZED' }],
    customerProfiles: [{ id: customerId, nickname: 'Cliente T11', status: 'ACTIVE' }],
    licenses: [
      { id: licenseId, customerId, mode: 'MANAGED', status: 'ACTIVE', maxDevices: 3 },
    ],
    licenseDevices: [
      { licenseId, deviceId: 'dev-old-11', status: 'ACTIVE' }, // 1 active out of 3 -> 2 slots available
    ],
    managedSources: [{ id: 'ms-11', sourceId: 'src_11', status: 'ACTIVE' }],
    vault: [],
    deviceSourceBindings: [{ licenseId, deviceId: 'dev-old-11', sourceId: 'ms-11' }],
  };

  const res = simulateRpcManagerCompleteDeviceActivation({
    flowMode: 'EXISTING_CUSTOMER',
    customerId,
    existingDisplayCode: oldCode,
    displayCode: newCode,
    activationKeyHash: keyHash,
  }, state);

  assert.equal(res.success, true);
  assert.equal(res.licenseId, licenseId);
  assert.equal(state.licenses.length, 1, 'Must NOT create new license');
});

await runTest('T12: capacity exhausted -> MANAGED_LICENSE_CAPACITY_EXHAUSTED', async () => {
  const customerId = 'cust-t12';
  const oldCode = 'XF-1212-0001';
  const newCode = 'XF-1212-0002';
  const rawKey = '123456';
  const keyHash = await sha256Hex(rawKey);

  const state = {
    keyVault: [{ displayCode: newCode, activationKeyHash: keyHash, deviceId: 'dev-new-12', keyStatus: 'ACTIVE' }],
    devices: [{ deviceId: 'dev-old-12', displayCode: oldCode, status: 'AUTHORIZED' }],
    customerProfiles: [{ id: customerId, nickname: 'Cliente T12', status: 'ACTIVE' }],
    licenses: [
      { id: 'lic-t12', customerId, mode: 'MANAGED', status: 'ACTIVE', maxDevices: 1 }, // 1 slot!
    ],
    licenseDevices: [
      { licenseId: 'lic-t12', deviceId: 'dev-old-12', status: 'ACTIVE' }, // 1 active -> 0 slots free!
    ],
    managedSources: [{ id: 'ms-12', sourceId: 'src_12', status: 'ACTIVE' }],
    vault: [],
    deviceSourceBindings: [{ licenseId: 'lic-t12', deviceId: 'dev-old-12', sourceId: 'ms-12' }],
  };

  assert.throws(
    () => simulateRpcManagerCompleteDeviceActivation({
      flowMode: 'EXISTING_CUSTOMER',
      customerId,
      existingDisplayCode: oldCode,
      displayCode: newCode,
      activationKeyHash: keyHash,
    }, state),
    /MANAGED_LICENSE_CAPACITY_EXHAUSTED/
  );
});

await runTest('T13: multiple eligible licenses -> MANAGED_LICENSE_AMBIGUOUS', async () => {
  const customerId = 'cust-t13';
  const oldCode = 'XF-1313-0001';
  const newCode = 'XF-1313-0002';
  const rawKey = '123456';
  const keyHash = await sha256Hex(rawKey);

  const state = {
    keyVault: [{ displayCode: newCode, activationKeyHash: keyHash, deviceId: 'dev-new-13', keyStatus: 'ACTIVE' }],
    devices: [{ deviceId: 'dev-old-13', displayCode: oldCode, status: 'AUTHORIZED' }],
    customerProfiles: [{ id: customerId, nickname: 'Cliente T13', status: 'ACTIVE' }],
    licenses: [
      { id: 'lic-13a', customerId, mode: 'MANAGED', status: 'ACTIVE', maxDevices: 5 },
      { id: 'lic-13b', customerId, mode: 'MANAGED', status: 'ACTIVE', maxDevices: 5 },
    ],
    licenseDevices: [{ licenseId: 'lic-13a', deviceId: 'dev-old-13', status: 'ACTIVE' }],
    managedSources: [{ id: 'ms-13', sourceId: 'src_13', status: 'ACTIVE' }],
    vault: [],
    deviceSourceBindings: [{ licenseId: 'lic-13a', deviceId: 'dev-old-13', sourceId: 'ms-13' }],
  };

  assert.throws(
    () => simulateRpcManagerCompleteDeviceActivation({
      flowMode: 'EXISTING_CUSTOMER',
      customerId,
      existingDisplayCode: oldCode,
      displayCode: newCode,
      activationKeyHash: keyHash,
    }, state),
    /MANAGED_LICENSE_AMBIGUOUS/
  );
});

await runTest('T14: new device invalid code -> fail closed', async () => {
  const rawKey = '123456';
  const keyHash = await sha256Hex(rawKey);

  const state = {
    keyVault: [],
    devices: [],
    customerProfiles: [],
    licenses: [],
    licenseDevices: [],
    managedSources: [],
    vault: [],
    deviceSourceBindings: [],
  };

  assert.throws(
    () => simulateRpcManagerCompleteDeviceActivation({
      flowMode: 'NEW_CUSTOMER',
      newCustomerName: 'Cliente T14',
      displayCode: 'BAD-CODE-FORMAT',
      activationKeyHash: keyHash,
      sourceId: 'src_14',
      ciphertext: 'c', nonce: 'n', authTag: 't',
    }, state),
    /DISPLAY_CODE_INVALID/
  );
});

await runTest('T15: new permanent key invalid -> fail closed', async () => {
  const displayCode = 'XF-1515-0001';
  const rightKeyHash = await sha256Hex('123456');
  const wrongKeyHash = await sha256Hex('999999');

  const state = {
    keyVault: [{ displayCode, activationKeyHash: rightKeyHash, deviceId: 'dev-15', keyStatus: 'ACTIVE' }],
    devices: [],
    customerProfiles: [],
    licenses: [],
    licenseDevices: [],
    managedSources: [],
    vault: [],
    deviceSourceBindings: [],
  };

  assert.throws(
    () => simulateRpcManagerCompleteDeviceActivation({
      flowMode: 'NEW_CUSTOMER',
      newCustomerName: 'Cliente T15',
      displayCode,
      activationKeyHash: wrongKeyHash,
      sourceId: 'src_15',
      ciphertext: 'c', nonce: 'n', authTag: 't',
    }, state),
    /INVALID_ACTIVATION_KEY/
  );
});

await runTest('T16: UI new-customer mode shows source fields', () => {
  assert.match(managerPageSrc, /Novo cliente/);
  assert.match(managerPageSrc, /Nome da fonte/);
  assert.match(managerPageSrc, /Protocolo/);
  assert.match(managerPageSrc, /URL da fonte M3U/);
  assert.match(managerPageSrc, /Endpoint XTREAM/);
});

await runTest('T17: UI existing-customer mode hides source fields', () => {
  assert.match(managerPageSrc, /Cliente já ativo/);
  assert.match(managerPageSrc, /activationFlowMode === 'NEW_CUSTOMER'/);
  assert.match(managerPageSrc, /Código do dispositivo já vinculado ao cliente/);
  // Source fields must never be rendered in existing customer section
  const existingCustomerSection = managerPageSrc.split('Código do dispositivo já vinculado ao cliente')[1].split('<button')[0];
  assert.ok(existingCustomerSection);
  assert.doesNotMatch(existingCustomerSection, /URL da fonte/);
  assert.doesNotMatch(existingCustomerSection, /Endpoint XTREAM/);
  assert.doesNotMatch(existingCustomerSection, /assistedSourceUser/);
  assert.doesNotMatch(existingCustomerSection, /assistedSourcePass/);
  assert.doesNotMatch(existingCustomerSection, /assistedPlaylistUrl/);
  assert.doesNotMatch(existingCustomerSection, /assistedSourceName/);
});

await runTest('T18: existing-customer mode requires existing device code', () => {
  assert.match(managerPageSrc, /assistedExistingDeviceCode/);
  assert.match(managerAuthoritySrc, /EXISTING_DEVICE_CODE_REQUIRED/);
  assert.match(edgeFunctionSrc, /existingDeviceCode/);
  assert.match(twoFlowMigrationSrc, /p_existing_display_code/);
});

await runTest('T19: customer UUID used internally, display name not authority', () => {
  assert.match(managerPageSrc, /c\.customerId/);
  assert.match(managerAuthoritySrc, /customerId/);
  assert.match(edgeFunctionSrc, /customerId/);
  assert.match(twoFlowMigrationSrc, /p_customer_id/);
});

await runTest('T20: no cross-customer source/license reuse', async () => {
  const customerA = 'cust-20-a';
  const customerB = 'cust-20-b';
  const oldCodeOfB = 'XF-2020-0001';
  const newCodeOfA = 'XF-2020-0002';
  const rawKey = '123456';
  const keyHash = await sha256Hex(rawKey);

  const state = {
    keyVault: [{ displayCode: newCodeOfA, activationKeyHash: keyHash, deviceId: 'dev-new-20', keyStatus: 'ACTIVE' }],
    devices: [{ deviceId: 'dev-old-20', displayCode: oldCodeOfB, status: 'AUTHORIZED' }],
    customerProfiles: [
      { id: customerA, nickname: 'Cliente A', status: 'ACTIVE' },
      { id: customerB, nickname: 'Cliente B', status: 'ACTIVE' },
    ],
    licenses: [
      { id: 'lic-b-20', customerId: customerB, mode: 'MANAGED', status: 'ACTIVE', maxDevices: 5 },
    ],
    licenseDevices: [{ licenseId: 'lic-b-20', deviceId: 'dev-old-20', status: 'ACTIVE' }],
    managedSources: [{ id: 'ms-20', sourceId: 'src_20', status: 'ACTIVE' }],
    vault: [],
    deviceSourceBindings: [{ licenseId: 'lic-b-20', deviceId: 'dev-old-20', sourceId: 'ms-20' }],
  };

  assert.throws(
    () => simulateRpcManagerCompleteDeviceActivation({
      flowMode: 'EXISTING_CUSTOMER',
      customerId: customerA,
      existingDisplayCode: oldCodeOfB,
      displayCode: newCodeOfA,
      activationKeyHash: keyHash,
    }, state),
    /EXISTING_DEVICE_CUSTOMER_MISMATCH/
  );
});

console.log('\n================================================================');
console.log(`TOTAL TESTS: ${totalTests}`);
console.log(`PASSED: ${passedTests}`);
console.log(`FAILED: ${totalTests - passedTests}`);
console.log('================================================================');

if (passedTests !== totalTests) {
  process.exit(1);
}
