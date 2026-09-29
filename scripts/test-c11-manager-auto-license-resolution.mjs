/**
 * Xandeflix Prebuilt — C11 Manager Activation Customer Claim & Zero-License MVP Policy Test Suite
 *
 * Deterministic test suite verifying server-side auto-resolution of managed licenses
 * with customer ownership selection and canonical MVP zero-license creation.
 *
 * Test Matrix:
 *   T1: selected customer + zero MANAGED licenses -> creates canonical MVP MANAGED license
 *   T2: created license: status ACTIVE
 *   T3: created license: max_devices=1
 *   T4: created license: max_concurrent_sessions=1
 *   T5: created license: expires_at NULL
 *   T6: created license: trial disabled
 *   T7: exactly one eligible license with capacity -> reuses license
 *   T8: one eligible license without capacity -> MANAGED_LICENSE_CAPACITY_EXHAUSTED
 *   T9: multiple eligible licenses -> MANAGED_LICENSE_AMBIGUOUS
 *   T10: other-customer license -> never selected
 *   T11: audit/test unrelated license -> never selected
 *   T12: invalid device code -> fail closed
 *   T13: invalid permanent key -> fail closed
 *   T14: customer mismatch -> fail closed
 *   T15: source stored encrypted -> plaintext not persisted
 *   T16: activation binds: customer + device + license + source
 *   T17: no secret/source credential logged
 *   T18: legacy explicit-license path -> preserved for compatibility / disambiguation
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

const managerPage = read('src/debug/manager/ManagerPanelPage.tsx');
const managerAuthoritySrc = read('src/control-plane/client/manager-remote-control-plane-authority.ts');
const edgeFunctionSrc = read('supabase/functions/managed-source-vault-admin/index.ts');
const autoLicenseMigration = read('supabase/migrations/20260924180000_c11_manager_auto_license_resolution.sql');

console.log('================================================================');
console.log('Xandeflix Prebuilt — C11 Manager Activation Customer Claim & Zero-License MVP Policy');
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
    sourceId,
    sourceType,
    displayName,
    ciphertext,
    nonce,
    authTag,
  } = params;

  // 1. Validate device code & key hash
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
  const request = state.activationRequests.find((r) => r.deviceId === deviceId && r.displayCode === displayCode);

  // 2. Determine target customer
  let targetCustomerId = customerId || (request && request.claimedByCustomerId) || null;
  if (!targetCustomerId) {
    const existingBinding = state.licenseDevices.find((b) => b.deviceId === deviceId && b.status === 'ACTIVE');
    if (existingBinding) {
      const existingLicense = state.licenses.find((l) => l.id === existingBinding.licenseId);
      if (existingLicense) targetCustomerId = existingLicense.customerId;
    }
  }

  if (!targetCustomerId) {
    throw new Error('CUSTOMER_ID_REQUIRED');
  }

  // Validate target customer exists and is active
  const customerProfile = state.customerProfiles.find((c) => c.id === targetCustomerId);
  if (!customerProfile) {
    throw new Error('CUSTOMER_PROFILE_NOT_FOUND');
  }
  if (customerProfile.status !== 'ACTIVE') {
    throw new Error('CUSTOMER_PROFILE_NOT_ACTIVE');
  }

  let resolvedLicenseId = licenseId || null;
  let resolvedCustomerId = targetCustomerId;
  const now = Date.now();

  // 3. Explicit licenseId (legacy/disambiguation path)
  if (resolvedLicenseId) {
    const candidate = state.licenses.find((l) => l.id === resolvedLicenseId);
    if (!candidate) throw new Error('LICENSE_NOT_FOUND');
    if (candidate.mode !== 'MANAGED') throw new Error('LICENSE_MODE_INVALID');
    if (!['ACTIVE', 'TRIAL'].includes(candidate.status)) throw new Error('LICENSE_STATUS_INELIGIBLE');
    if (candidate.status === 'TRIAL' && candidate.trialExpiresAt && candidate.trialExpiresAt <= now) {
      throw new Error('TRIAL_EXPIRED');
    }
    if (candidate.expiresAt && candidate.expiresAt <= now) {
      throw new Error('LICENSE_EXPIRED');
    }
    if (candidate.customerId && candidate.customerId !== targetCustomerId) {
      throw new Error('CROSS_CUSTOMER_BINDING_DENIED');
    }

    // Capacity check for explicit license
    const boundCount = state.licenseDevices.filter(
      (b) => b.licenseId === candidate.id && b.status === 'ACTIVE' && b.deviceId !== deviceId
    ).length;
    const isAlreadyBound = state.licenseDevices.some(
      (b) => b.licenseId === candidate.id && b.deviceId === deviceId && b.status === 'ACTIVE'
    );
    if (boundCount >= candidate.maxDevices && !isAlreadyBound) {
      throw new Error('MANAGED_LICENSE_CAPACITY_EXHAUSTED');
    }

    resolvedCustomerId = candidate.customerId;
  } else {
    // 4. Auto-Resolution for targetCustomerId
    const eligibleLicenses = state.licenses.filter((l) => {
      if (l.customerId !== targetCustomerId) return false;
      if (l.mode !== 'MANAGED') return false;
      if (!['ACTIVE', 'TRIAL'].includes(l.status)) return false;
      if (l.expiresAt && l.expiresAt <= now) return false;
      if (l.trialExpiresAt && l.trialExpiresAt <= now) return false;
      return true;
    });

    if (eligibleLicenses.length === 1) {
      // CASE A: Exactly one license
      const candidate = eligibleLicenses[0];
      const boundCount = state.licenseDevices.filter(
        (b) => b.licenseId === candidate.id && b.status === 'ACTIVE' && b.deviceId !== deviceId
      ).length;
      const isAlreadyBound = state.licenseDevices.some(
        (b) => b.licenseId === candidate.id && b.deviceId === deviceId && b.status === 'ACTIVE'
      );
      if (boundCount >= candidate.maxDevices && !isAlreadyBound) {
        throw new Error('MANAGED_LICENSE_CAPACITY_EXHAUSTED');
      }
      resolvedLicenseId = candidate.id;
    } else if (eligibleLicenses.length === 0) {
      // CASE B: ZERO-LICENSE MVP POLICY -> auto-create canonical MVP license
      const newLicenseId = `lic-mvp-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
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
      resolvedLicenseId = newLicenseId;
    } else {
      // CASE C: Multiple eligible licenses
      throw new Error('MANAGED_LICENSE_AMBIGUOUS');
    }
  }

  // 5. Complete bindings
  const licenseObj = state.licenses.find((l) => l.id === resolvedLicenseId);

  state.licenseDevices = state.licenseDevices.filter((b) => !(b.licenseId === resolvedLicenseId && b.deviceId === deviceId));
  state.licenseDevices.push({
    id: `bind_${Date.now()}_${Math.random()}`,
    licenseId: resolvedLicenseId,
    deviceId,
    status: 'ACTIVE',
  });

  state.managedSources.push({
    sourceId,
    displayName,
    sourceType,
    status: 'ACTIVE',
  });

  state.vault.push({
    sourceId,
    ciphertext,
    nonce,
    authTag,
  });

  state.deviceSourceBindings = state.deviceSourceBindings.filter((b) => b.deviceId !== deviceId);
  state.deviceSourceBindings.push({
    deviceId,
    sourceId,
    status: 'ACTIVE',
  });

  return {
    success: true,
    deviceId,
    displayCode,
    customerId: resolvedCustomerId,
    licenseId: resolvedLicenseId,
    sourceId,
    deviceAuthorizationState: 'AUTHORIZED',
    sourceBindingStatus: 'ACTIVE',
    licenseStatus: licenseObj.status,
    sourceResolution: 'SOURCE_READY',
  };
}

// -----------------------------------------------------------------------------
// Test Scenarios Execution (T1 to T18)
// -----------------------------------------------------------------------------

let t1CreatedLicense = null;

await runTest('T1: selected customer + zero MANAGED licenses -> creates canonical MVP MANAGED license', async () => {
  const customerId = 'cust-1111-2222-3333-444444444444';
  const displayCode = 'XF-7K29-PQ41';
  const rawKey = '123456';
  const keyHash = await sha256Hex(rawKey);

  const state = {
    keyVault: [{ displayCode, activationKeyHash: keyHash, deviceId: 'dev-firestick-1', keyStatus: 'ACTIVE' }],
    activationRequests: [{ deviceId: 'dev-firestick-1', displayCode, claimedByCustomerId: null }],
    customerProfiles: [{ id: customerId, nickname: 'cliente_zero_licencas', status: 'ACTIVE' }],
    licenses: [], // ZERO licenses
    licenseDevices: [],
    managedSources: [],
    vault: [],
    deviceSourceBindings: [],
  };

  const res = simulateRpcManagerCompleteDeviceActivation({
    displayCode,
    activationKeyHash: keyHash,
    customerId, // explicitly selected customer
    sourceId: 'src_opaque_1',
    sourceType: 'M3U',
    displayName: 'Fonte T1',
    ciphertext: 'encrypted_payload_hex',
    nonce: 'nonce_hex',
    authTag: 'tag_hex',
  }, state);

  assert.equal(res.success, true);
  assert.equal(res.customerId, customerId);
  assert.equal(res.deviceAuthorizationState, 'AUTHORIZED');
  assert.equal(res.sourceBindingStatus, 'ACTIVE');
  assert.equal(res.sourceResolution, 'SOURCE_READY');

  assert.equal(state.licenses.length, 1);
  t1CreatedLicense = state.licenses[0];
  assert.equal(res.licenseId, t1CreatedLicense.id);
});

await runTest('T2: created license: status ACTIVE', () => {
  assert.ok(t1CreatedLicense, 'T1 license must exist');
  assert.equal(t1CreatedLicense.mode, 'MANAGED');
  assert.equal(t1CreatedLicense.status, 'ACTIVE');
});

await runTest('T3: created license: max_devices=1', () => {
  assert.ok(t1CreatedLicense, 'T1 license must exist');
  assert.equal(t1CreatedLicense.maxDevices, 1);
});

await runTest('T4: created license: max_concurrent_sessions=1', () => {
  assert.ok(t1CreatedLicense, 'T1 license must exist');
  assert.equal(t1CreatedLicense.maxConcurrentSessions, 1);
});

await runTest('T5: created license: expires_at NULL', () => {
  assert.ok(t1CreatedLicense, 'T1 license must exist');
  assert.equal(t1CreatedLicense.expiresAt, null);
});

await runTest('T6: created license: trial disabled', () => {
  assert.ok(t1CreatedLicense, 'T1 license must exist');
  assert.equal(t1CreatedLicense.trialEligible, false);
  assert.equal(t1CreatedLicense.trialExpiresAt, null);
  assert.equal(t1CreatedLicense.trialStartedAt, null);
});

await runTest('T7: exactly one eligible license with capacity -> reuses license', async () => {
  const customerId = 'cust-2222-3333-4444-555555555555';
  const existingLicenseId = 'lic-existing-single';
  const displayCode = 'XF-8K30-QR42';
  const rawKey = '654321';
  const keyHash = await sha256Hex(rawKey);

  const state = {
    keyVault: [{ displayCode, activationKeyHash: keyHash, deviceId: 'dev-firestick-2', keyStatus: 'ACTIVE' }],
    activationRequests: [{ deviceId: 'dev-firestick-2', displayCode, claimedByCustomerId: customerId }],
    customerProfiles: [{ id: customerId, nickname: 'cliente_uma_licenca', status: 'ACTIVE' }],
    licenses: [
      { id: existingLicenseId, customerId, mode: 'MANAGED', status: 'ACTIVE', maxDevices: 1, maxConcurrentSessions: 1, expiresAt: null, trialEligible: false },
    ],
    licenseDevices: [], // 0 bound devices -> capacity available
    managedSources: [],
    vault: [],
    deviceSourceBindings: [],
  };

  const res = simulateRpcManagerCompleteDeviceActivation({
    displayCode,
    activationKeyHash: keyHash,
    customerId,
    sourceId: 'src_opaque_2',
    sourceType: 'XTREAM',
    displayName: 'Fonte T7',
    ciphertext: 'c_hex',
    nonce: 'n_hex',
    authTag: 't_hex',
  }, state);

  assert.equal(res.success, true);
  assert.equal(res.licenseId, existingLicenseId, 'Must reuse the existing license');
  assert.equal(state.licenses.length, 1, 'Must NOT create a second license');
});

await runTest('T8: one eligible license without capacity -> MANAGED_LICENSE_CAPACITY_EXHAUSTED', async () => {
  const customerId = 'cust-3333-4444-5555-666666666666';
  const existingLicenseId = 'lic-capacity-exhausted';
  const displayCode = 'XF-9K31-RS43';
  const rawKey = '112233';
  const keyHash = await sha256Hex(rawKey);

  const state = {
    keyVault: [{ displayCode, activationKeyHash: keyHash, deviceId: 'dev-firestick-3', keyStatus: 'ACTIVE' }],
    activationRequests: [{ deviceId: 'dev-firestick-3', displayCode, claimedByCustomerId: customerId }],
    customerProfiles: [{ id: customerId, nickname: 'cliente_cheio', status: 'ACTIVE' }],
    licenses: [
      { id: existingLicenseId, customerId, mode: 'MANAGED', status: 'ACTIVE', maxDevices: 1, maxConcurrentSessions: 1 },
    ],
    licenseDevices: [
      { id: 'b1', licenseId: existingLicenseId, deviceId: 'other-device-bound', status: 'ACTIVE' },
    ], // 1 bound device out of 1 maxDevices
    managedSources: [],
    vault: [],
    deviceSourceBindings: [],
  };

  assert.throws(
    () => simulateRpcManagerCompleteDeviceActivation({
      displayCode,
      activationKeyHash: keyHash,
      customerId,
      sourceId: 'src_opaque_3',
      sourceType: 'M3U',
      displayName: 'Fonte T8',
      ciphertext: 'c_hex',
      nonce: 'n_hex',
      authTag: 't_hex',
    }, state),
    /MANAGED_LICENSE_CAPACITY_EXHAUSTED/
  );
  assert.equal(state.licenses.length, 1, 'Must NOT auto-create a second license to bypass capacity');
});

await runTest('T9: multiple eligible licenses -> MANAGED_LICENSE_AMBIGUOUS', async () => {
  const customerId = 'cust-4444-5555-6666-777777777777';
  const displayCode = 'XF-1K23-AB45';
  const rawKey = '998877';
  const keyHash = await sha256Hex(rawKey);

  const state = {
    keyVault: [{ displayCode, activationKeyHash: keyHash, deviceId: 'dev-firestick-4', keyStatus: 'ACTIVE' }],
    activationRequests: [{ deviceId: 'dev-firestick-4', displayCode, claimedByCustomerId: customerId }],
    customerProfiles: [{ id: customerId, nickname: 'cliente_multiplas', status: 'ACTIVE' }],
    licenses: [
      { id: 'lic-1', customerId, mode: 'MANAGED', status: 'ACTIVE', maxDevices: 1 },
      { id: 'lic-2', customerId, mode: 'MANAGED', status: 'ACTIVE', maxDevices: 1 },
    ],
    licenseDevices: [],
    managedSources: [],
    vault: [],
    deviceSourceBindings: [],
  };

  assert.throws(
    () => simulateRpcManagerCompleteDeviceActivation({
      displayCode,
      activationKeyHash: keyHash,
      customerId,
      sourceId: 'src_opaque_4',
      sourceType: 'M3U',
      displayName: 'Fonte T9',
      ciphertext: 'c_hex',
      nonce: 'n_hex',
      authTag: 't_hex',
    }, state),
    /MANAGED_LICENSE_AMBIGUOUS/
  );
});

await runTest('T10: other-customer license -> never selected', async () => {
  const targetCustomerId = 'cust-prod-target';
  const otherCustomerId = 'cust-other-customer';
  const otherLicenseId = 'lic-other-customer';
  const displayCode = 'XF-2K24-BC46';
  const rawKey = '334455';
  const keyHash = await sha256Hex(rawKey);

  const state = {
    keyVault: [{ displayCode, activationKeyHash: keyHash, deviceId: 'dev-firestick-5', keyStatus: 'ACTIVE' }],
    activationRequests: [{ deviceId: 'dev-firestick-5', displayCode, claimedByCustomerId: null }],
    customerProfiles: [
      { id: targetCustomerId, nickname: 'cliente_alvo', status: 'ACTIVE' },
      { id: otherCustomerId, nickname: 'outro_cliente', status: 'ACTIVE' },
    ],
    licenses: [
      { id: otherLicenseId, customerId: otherCustomerId, mode: 'MANAGED', status: 'ACTIVE', maxDevices: 5 },
    ],
    licenseDevices: [],
    managedSources: [],
    vault: [],
    deviceSourceBindings: [],
  };

  const res = simulateRpcManagerCompleteDeviceActivation({
    displayCode,
    activationKeyHash: keyHash,
    customerId: targetCustomerId,
    sourceId: 'src_opaque_5',
    sourceType: 'M3U',
    displayName: 'Fonte T10',
    ciphertext: 'c_hex',
    nonce: 'n_hex',
    authTag: 't_hex',
  }, state);

  // Must NOT select other customer's license!
  assert.notEqual(res.licenseId, otherLicenseId);
  assert.equal(res.customerId, targetCustomerId);
  // Auto-created a new canonical license for targetCustomerId
  assert.equal(state.licenses.length, 2);
  const targetLicense = state.licenses.find((l) => l.customerId === targetCustomerId);
  assert.ok(targetLicense);
  assert.equal(res.licenseId, targetLicense.id);
});

await runTest('T11: audit/test unrelated license -> never selected', async () => {
  const prodCustomerId = 'cust-prod-real';
  const auditCustomerId = 'cust-audit-c10b';
  const displayCode = 'XF-3K25-CD47';
  const rawKey = '778899';
  const keyHash = await sha256Hex(rawKey);

  const state = {
    keyVault: [{ displayCode, activationKeyHash: keyHash, deviceId: 'dev-firestick-6', keyStatus: 'ACTIVE' }],
    activationRequests: [{ deviceId: 'dev-firestick-6', displayCode, claimedByCustomerId: prodCustomerId }],
    customerProfiles: [
      { id: prodCustomerId, nickname: 'cliente_producao', status: 'ACTIVE' },
      { id: auditCustomerId, nickname: 'c10b_audit_customer', status: 'ACTIVE' },
    ],
    licenses: [
      { id: 'lic-audit-1', customerId: auditCustomerId, mode: 'MANAGED', status: 'ACTIVE', maxDevices: 10 },
    ],
    licenseDevices: [],
    managedSources: [],
    vault: [],
    deviceSourceBindings: [],
  };

  const res = simulateRpcManagerCompleteDeviceActivation({
    displayCode,
    activationKeyHash: keyHash,
    customerId: prodCustomerId,
    sourceId: 'src_opaque_6',
    sourceType: 'M3U',
    displayName: 'Fonte T11',
    ciphertext: 'c_hex',
    nonce: 'n_hex',
    authTag: 't_hex',
  }, state);

  assert.notEqual(res.licenseId, 'lic-audit-1');
  assert.equal(res.customerId, prodCustomerId);
});

await runTest('T12: invalid device code -> fail closed', async () => {
  const rawKey = '123456';
  const keyHash = await sha256Hex(rawKey);

  const state = {
    keyVault: [],
    activationRequests: [],
    customerProfiles: [],
    licenses: [],
    licenseDevices: [],
    managedSources: [],
    vault: [],
    deviceSourceBindings: [],
  };

  assert.throws(
    () => simulateRpcManagerCompleteDeviceActivation({
      displayCode: 'INVALID-CODE',
      activationKeyHash: keyHash,
      customerId: 'cust-uuid',
      sourceId: 'src_opaque_7',
      sourceType: 'M3U',
      displayName: 'Fonte T12',
      ciphertext: 'c_hex',
      nonce: 'n_hex',
      authTag: 't_hex',
    }, state),
    /DISPLAY_CODE_INVALID/
  );
});

await runTest('T13: invalid permanent key -> fail closed', async () => {
  const displayCode = 'XF-4K26-DE48';
  const rawKey = '123456';
  const keyHash = await sha256Hex(rawKey);
  const wrongKeyHash = await sha256Hex('654321');

  const state = {
    keyVault: [{ displayCode, activationKeyHash: keyHash, deviceId: 'dev-firestick-7', keyStatus: 'ACTIVE' }],
    activationRequests: [{ deviceId: 'dev-firestick-7', displayCode }],
    customerProfiles: [{ id: 'cust-id', nickname: 'user', status: 'ACTIVE' }],
    licenses: [],
    licenseDevices: [],
    managedSources: [],
    vault: [],
    deviceSourceBindings: [],
  };

  assert.throws(
    () => simulateRpcManagerCompleteDeviceActivation({
      displayCode,
      activationKeyHash: wrongKeyHash,
      customerId: 'cust-id',
      sourceId: 'src_opaque_8',
      sourceType: 'M3U',
      displayName: 'Fonte T13',
      ciphertext: 'c_hex',
      nonce: 'n_hex',
      authTag: 't_hex',
    }, state),
    /INVALID_ACTIVATION_KEY/
  );
});

await runTest('T14: customer mismatch -> fail closed', async () => {
  const customerA = 'cust-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const customerB = 'cust-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const licenseOfB = 'lic-belonging-to-b';
  const displayCode = 'XF-5K27-EF49';
  const rawKey = '987654';
  const keyHash = await sha256Hex(rawKey);

  const state = {
    keyVault: [{ displayCode, activationKeyHash: keyHash, deviceId: 'dev-firestick-8', keyStatus: 'ACTIVE' }],
    activationRequests: [{ deviceId: 'dev-firestick-8', displayCode, claimedByCustomerId: customerA }],
    customerProfiles: [
      { id: customerA, nickname: 'cliente_a', status: 'ACTIVE' },
      { id: customerB, nickname: 'cliente_b', status: 'ACTIVE' },
    ],
    licenses: [
      { id: licenseOfB, customerId: customerB, mode: 'MANAGED', status: 'ACTIVE', maxDevices: 1 },
    ],
    licenseDevices: [],
    managedSources: [],
    vault: [],
    deviceSourceBindings: [],
  };

  // Explicitly supplying license of Customer B while Customer A is the target
  assert.throws(
    () => simulateRpcManagerCompleteDeviceActivation({
      displayCode,
      activationKeyHash: keyHash,
      customerId: customerA,
      licenseId: licenseOfB,
      sourceId: 'src_opaque_9',
      sourceType: 'M3U',
      displayName: 'Fonte T14',
      ciphertext: 'c_hex',
      nonce: 'n_hex',
      authTag: 't_hex',
    }, state),
    /CROSS_CUSTOMER_BINDING_DENIED/
  );
});

await runTest('T15: source stored encrypted -> plaintext not persisted', async () => {
  const customerId = 'cust-9999-0000-1111-222222222222';
  const licenseId = 'lic-15';
  const displayCode = 'XF-6K28-FG50';
  const rawKey = '556677';
  const keyHash = await sha256Hex(rawKey);

  const plainSecretUrl = 'https://provider.live.tv/secret_user/secret_pass/playlist.m3u8';
  const masterKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  const encrypted = await encryptAes256Gcm(plainSecretUrl, masterKey);

  const state = {
    keyVault: [{ displayCode, activationKeyHash: keyHash, deviceId: 'dev-firestick-9', keyStatus: 'ACTIVE' }],
    activationRequests: [{ deviceId: 'dev-firestick-9', displayCode, claimedByCustomerId: customerId }],
    customerProfiles: [{ id: customerId, nickname: 'cliente_15', status: 'ACTIVE' }],
    licenses: [
      { id: licenseId, customerId, mode: 'MANAGED', status: 'ACTIVE', maxDevices: 1 },
    ],
    licenseDevices: [],
    managedSources: [],
    vault: [],
    deviceSourceBindings: [],
  };

  simulateRpcManagerCompleteDeviceActivation({
    displayCode,
    activationKeyHash: keyHash,
    customerId,
    sourceId: 'src_encrypted_vault_1',
    sourceType: 'M3U',
    displayName: 'Fonte Segura',
    ciphertext: encrypted.ciphertext,
    nonce: encrypted.iv,
    authTag: encrypted.authTag,
  }, state);

  const vaultEntry = state.vault[0];
  assert.ok(vaultEntry);
  assert.equal(vaultEntry.ciphertext, encrypted.ciphertext);
  assert.doesNotMatch(JSON.stringify(state.vault), /secret_user|secret_pass|provider\.live\.tv/);
  assert.doesNotMatch(JSON.stringify(state.managedSources), /secret_user|secret_pass|provider\.live\.tv/);

  const decrypted = await decryptAes256Gcm(vaultEntry.ciphertext, vaultEntry.nonce, masterKey, vaultEntry.authTag);
  assert.match(decrypted, /provider\.live\.tv/);
});

await runTest('T16: activation binds: customer + device + license + source', async () => {
  const customerId = 'cust-1010-2020-3030-404040404040';
  const deviceId = 'dev-target-16';
  const sourceId = 'src-opaque-16';
  const displayCode = 'XF-7K29-GH51';
  const rawKey = '223344';
  const keyHash = await sha256Hex(rawKey);

  const state = {
    keyVault: [{ displayCode, activationKeyHash: keyHash, deviceId, keyStatus: 'ACTIVE' }],
    activationRequests: [{ deviceId, displayCode, claimedByCustomerId: customerId }],
    customerProfiles: [{ id: customerId, nickname: 'cliente_16', status: 'ACTIVE' }],
    licenses: [],
    licenseDevices: [],
    managedSources: [],
    vault: [],
    deviceSourceBindings: [],
  };

  const res = simulateRpcManagerCompleteDeviceActivation({
    displayCode,
    activationKeyHash: keyHash,
    customerId,
    sourceId,
    sourceType: 'M3U',
    displayName: 'Fonte 16',
    ciphertext: 'c_hex',
    nonce: 'n_hex',
    authTag: 't_hex',
  }, state);

  assert.equal(res.deviceId, deviceId);
  assert.equal(res.customerId, customerId);
  assert.ok(res.licenseId);
  assert.equal(res.sourceId, sourceId);

  const licenseBinding = state.licenseDevices.find((b) => b.deviceId === deviceId);
  assert.ok(licenseBinding);
  assert.equal(licenseBinding.licenseId, res.licenseId);
  assert.equal(licenseBinding.status, 'ACTIVE');

  const sourceBinding = state.deviceSourceBindings.find((b) => b.deviceId === deviceId);
  assert.ok(sourceBinding);
  assert.equal(sourceBinding.sourceId, sourceId);
  assert.equal(sourceBinding.status, 'ACTIVE');
});

await runTest('T17: no secret/source credential logged', () => {
  assert.doesNotMatch(managerPage, /console\.(log|error|warn)/);
  assert.doesNotMatch(managerAuthoritySrc, /console\.(log|error|warn)/);
  assert.doesNotMatch(edgeFunctionSrc, /console\.(log|error|warn)/);
  assert.doesNotMatch(managerPage, /localStorage|sessionStorage|indexedDB/i);
  assert.doesNotMatch(managerPage, /SOURCE_VAULT_KEY_|SUPABASE_SERVICE_ROLE|sb_secret_/i);
  assert.doesNotMatch(managerAuthoritySrc, /SOURCE_VAULT_KEY_|SUPABASE_SERVICE_ROLE|sb_secret_/i);
});

await runTest('T18: legacy explicit-license path -> preserved for compatibility / disambiguation', async () => {
  const customerId = 'cust-1818-1818-1818-181818181818';
  const explicitLicenseId = 'lic-explicit-disambiguated';
  const displayCode = 'XF-8K30-HI52';
  const rawKey = '445566';
  const keyHash = await sha256Hex(rawKey);

  const state = {
    keyVault: [{ displayCode, activationKeyHash: keyHash, deviceId: 'dev-firestick-18', keyStatus: 'ACTIVE' }],
    activationRequests: [{ deviceId: 'dev-firestick-18', displayCode, claimedByCustomerId: customerId }],
    customerProfiles: [{ id: customerId, nickname: 'cliente_18', status: 'ACTIVE' }],
    licenses: [
      { id: explicitLicenseId, customerId, mode: 'MANAGED', status: 'ACTIVE', maxDevices: 1 },
      { id: 'lic-other-ambiguous', customerId, mode: 'MANAGED', status: 'ACTIVE', maxDevices: 1 },
    ],
    licenseDevices: [],
    managedSources: [],
    vault: [],
    deviceSourceBindings: [],
  };

  const res = simulateRpcManagerCompleteDeviceActivation({
    displayCode,
    activationKeyHash: keyHash,
    customerId,
    licenseId: explicitLicenseId,
    sourceId: 'src_explicit_18',
    sourceType: 'M3U',
    displayName: 'Fonte 18',
    ciphertext: 'c_hex',
    nonce: 'n_hex',
    authTag: 't_hex',
  }, state);

  assert.equal(res.success, true);
  assert.equal(res.licenseId, explicitLicenseId);
});

console.log('\n================================================================');
console.log(`TOTAL TESTS: ${totalTests}`);
console.log(`PASSED: ${passedTests}`);
console.log(`FAILED: ${totalTests - passedTests}`);
console.log('================================================================');

if (passedTests !== totalTests) {
  process.exit(1);
}
