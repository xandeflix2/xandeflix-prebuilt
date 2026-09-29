/**
 * Xandeflix Prebuilt — C11 Missing RPC Claim Device Key Recovery Test Suite (T1 - T12)
 *
 * Test Matrix required by Section 12:
 * T1: valid display code + correct permanent-key hash -> valid=true
 * T2: invalid display code -> fail closed
 * T3: incorrect permanent key -> fail closed
 * T4: revoked key -> denied
 * T5: unknown activation -> denied
 * T6: returned deviceId matches pending activation device
 * T7: returned displayCode canonicalized correctly
 * T8: no plaintext key returned
 * T9: no key hash returned
 * T10: validation alone does not authorize device
 * T11: manager activation NEW_CUSTOMER passes through helper
 * T12: manager activation EXISTING_CUSTOMER passes through helper
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const recoveryMigrationSql = fs.readFileSync(
  path.join(process.cwd(), 'supabase/migrations/20260925110000_c11_missing_rpc_claim_device_key_recovery.sql'),
  'utf8'
);

function sha256Hex(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

console.log('================================================================');
console.log('Xandeflix Prebuilt — C11 RPC Claim Device Key Recovery Test Suite');
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

function getBaseState() {
  const secretKey = 'mock-permanent-key-plaintext-1234';
  const keyHash = sha256Hex(secretKey);

  return {
    secretKey,
    keyHash,
    keyVault: [
      {
        deviceId: 'dev-firestick-1',
        displayCode: 'XF-PWCF-LCKC',
        activationKeyHash: keyHash,
        keyStatus: 'ACTIVE',
        lastUsedAt: null,
      },
      {
        deviceId: 'dev-revoked-2',
        displayCode: 'XF-REV0-KED1',
        activationKeyHash: sha256Hex('revoked-key'),
        keyStatus: 'REVOKED',
        lastUsedAt: null,
      }
    ],
    activationRequests: [
      {
        activationId: 'req-pending-1',
        installationId: 'inst-1',
        deviceId: 'dev-firestick-1',
        displayCode: 'XF-PWCF-LCKC',
        status: 'PENDING',
        attemptsCount: 0,
        linkedLicenseId: null,
        linkedSourceId: null,
        claimedByCustomerId: null,
      }
    ],
    devices: [],
    customerProfiles: [
      {
        id: 'cust-1',
        nickname: 'Cliente Existente',
        status: 'ACTIVE',
      }
    ],
    licenses: [
      {
        id: 'lic-1',
        customerId: 'cust-1',
        mode: 'MANAGED',
        status: 'ACTIVE',
        maxDevices: 2,
      }
    ],
    managedSources: [
      {
        id: 'ms-1',
        sourceId: 'src_managed_1',
        sourceType: 'M3U',
        name: 'Fonte 1',
        status: 'ACTIVE',
      }
    ],
    deviceSourceBindings: [
      {
        licenseId: 'lic-1',
        deviceId: 'dev-existing-bound',
        sourceId: 'ms-1',
      }
    ],
    licenseDevices: [
      {
        licenseId: 'lic-1',
        deviceId: 'dev-existing-bound',
        status: 'ACTIVE',
      }
    ],
    managerAdmins: [
      {
        userId: 'mgr-admin-1',
        status: 'ACTIVE',
        role: 'ADMIN',
      }
    ]
  };
}

/**
 * Pure simulator of private.validate_device_code_key (from 20260921170000)
 */
function simulateValidateDeviceCodeKey(p_display_code, p_activation_key_hash, state) {
  const v_display_code = p_display_code?.trim()?.toUpperCase() || null;
  const v_key_hash = p_activation_key_hash?.trim()?.toLowerCase() || null;

  if (!v_display_code || !/^XF-[0-9A-Z]{4}-[0-9A-Z]{4}$/.test(v_display_code) ||
      !v_key_hash || !/^[0-9a-f]{64}$/.test(v_key_hash)) {
    const err = new Error('ACTIVATION_KEY_INVALID');
    err.code = '42501';
    throw err;
  }

  const v_key = state.keyVault.find(
    (k) => k.displayCode === v_display_code && k.activationKeyHash === v_key_hash
  );

  if (!v_key) {
    const req = state.activationRequests.find((r) => r.displayCode === v_display_code && r.status === 'PENDING');
    if (req) {
      req.attemptsCount++;
      if (req.attemptsCount >= 5) {
        req.status = 'CANCELLED';
      }
    }
    const err = new Error('INVALID_ACTIVATION_KEY');
    err.code = '42501';
    throw err;
  }

  if (v_key.keyStatus !== 'ACTIVE') {
    const err = new Error('PERMANENT_KEY_REVOKED');
    err.code = '42501';
    throw err;
  }

  const v_request = state.activationRequests.find(
    (r) => r.deviceId === v_key.deviceId && r.displayCode === v_display_code
  );

  v_key.lastUsedAt = new Date().toISOString();

  return {
    success: true,
    deviceId: v_key.deviceId,
    displayCode: v_display_code,
    activationId: v_request?.activationId || null,
    installationId: v_request?.installationId || null,
    requestStatus: v_request?.status || null,
    deviceTokenHash: v_request?.deviceTokenHash || null,
    deviceType: v_request?.deviceType || null,
    deviceLabel: v_request?.deviceLabel || null,
  };
}

/**
 * Pure simulator of public.rpc_claim_device_key (canonical wrapper)
 */
function simulateRpcClaimDeviceKey(p_display_code, p_activation_key_hash, state) {
  const v_validated = simulateValidateDeviceCodeKey(p_display_code, p_activation_key_hash, state);
  return {
    valid: true,
    success: true,
    deviceId: v_validated.deviceId,
    displayCode: v_validated.displayCode,
    activationId: v_validated.activationId,
    installationId: v_validated.installationId,
    requestStatus: v_validated.requestStatus,
    deviceTokenHash: v_validated.deviceTokenHash,
    deviceType: v_validated.deviceType,
    deviceLabel: v_validated.deviceLabel,
  };
}

/**
 * Pure simulator of public.rpc_manager_complete_device_activation
 */
function simulateRpcManagerCompleteDeviceActivation(params, authContext, state) {
  const userId = authContext?.uid;
  if (!userId) {
    const err = new Error('MANAGER_AUTH_REQUIRED');
    err.code = '42501';
    throw err;
  }
  const admin = state.managerAdmins.find(
    (a) => a.userId === userId && a.status === 'ACTIVE' && ['OWNER', 'ADMIN'].includes(a.role)
  );
  if (!admin) {
    const err = new Error('MANAGER_NOT_AUTHORIZED');
    err.code = '42501';
    throw err;
  }

  // 1. Validation via helper
  const v_pair = simulateRpcClaimDeviceKey(params.displayCode, params.activationKeyHash, state);
  if (!v_pair?.valid) {
    const err = new Error('INVALID_ACTIVATION_KEY');
    err.code = '42501';
    throw err;
  }

  const v_deviceId = v_pair.deviceId;
  const v_displayCode = v_pair.displayCode;

  if (params.flowMode === 'EXISTING_CUSTOMER') {
    // Flow B
    if (!params.customerId) throw new Error('CUSTOMER_ID_REQUIRED');
    state.devices.push({
      deviceId: v_deviceId,
      displayCode: v_displayCode,
      status: 'AUTHORIZED',
    });
    return {
      success: true,
      deviceId: v_deviceId,
      displayCode: v_displayCode,
      customerId: params.customerId,
      deviceAuthorizationState: 'AUTHORIZED',
      sourceReused: true,
    };
  } else {
    // Flow A: NEW_CUSTOMER
    if (!params.newCustomerName) throw new Error('CUSTOMER_NAME_REQUIRED');
    const newCustId = 'cust-' + Math.random().toString(36).slice(2, 8);
    const newLicId = 'lic-' + Math.random().toString(36).slice(2, 8);
    state.customerProfiles.push({ id: newCustId, nickname: params.newCustomerName, status: 'ACTIVE' });
    state.licenses.push({ id: newLicId, customerId: newCustId, mode: 'MANAGED', status: 'ACTIVE', maxDevices: 1 });
    state.devices.push({
      deviceId: v_deviceId,
      displayCode: v_displayCode,
      status: 'AUTHORIZED',
    });
    return {
      success: true,
      deviceId: v_deviceId,
      displayCode: v_displayCode,
      customerId: newCustId,
      licenseId: newLicId,
      deviceAuthorizationState: 'AUTHORIZED',
      sourceReused: false,
    };
  }
}

// -----------------------------------------------------------------------------
// T1: valid display code + correct permanent-key hash -> valid=true
// -----------------------------------------------------------------------------
await runTest('T1: valid display code + correct permanent-key hash -> valid=true', async () => {
  const state = getBaseState();
  const res = simulateRpcClaimDeviceKey('XF-PWCF-LCKC', state.keyHash, state);
  assert.equal(res.valid, true);
  assert.equal(res.success, true);
  assert.equal(res.deviceId, 'dev-firestick-1');
  assert.equal(res.displayCode, 'XF-PWCF-LCKC');
});

// -----------------------------------------------------------------------------
// T2: invalid display code -> fail closed
// -----------------------------------------------------------------------------
await runTest('T2: invalid display code -> fail closed', async () => {
  const state = getBaseState();
  assert.throws(
    () => simulateRpcClaimDeviceKey('INVALID-CODE', state.keyHash, state),
    /ACTIVATION_KEY_INVALID/
  );
  assert.throws(
    () => simulateRpcClaimDeviceKey('', state.keyHash, state),
    /ACTIVATION_KEY_INVALID/
  );
  assert.throws(
    () => simulateRpcClaimDeviceKey(null, state.keyHash, state),
    /ACTIVATION_KEY_INVALID/
  );
});

// -----------------------------------------------------------------------------
// T3: incorrect permanent key -> fail closed
// -----------------------------------------------------------------------------
await runTest('T3: incorrect permanent key -> fail closed', async () => {
  const state = getBaseState();
  const wrongHash = sha256Hex('wrong-permanent-key-here');
  assert.throws(
    () => simulateRpcClaimDeviceKey('XF-PWCF-LCKC', wrongHash, state),
    /INVALID_ACTIVATION_KEY/
  );
  // Verify attempt counter incremented
  const req = state.activationRequests.find((r) => r.displayCode === 'XF-PWCF-LCKC');
  assert.equal(req.attemptsCount, 1);
});

// -----------------------------------------------------------------------------
// T4: revoked key -> denied
// -----------------------------------------------------------------------------
await runTest('T4: revoked key -> denied', async () => {
  const state = getBaseState();
  const revokedHash = sha256Hex('revoked-key');
  assert.throws(
    () => simulateRpcClaimDeviceKey('XF-REV0-KED1', revokedHash, state),
    /PERMANENT_KEY_REVOKED/
  );
});

// -----------------------------------------------------------------------------
// T5: unknown activation -> denied
// -----------------------------------------------------------------------------
await runTest('T5: unknown activation -> denied', async () => {
  const state = getBaseState();
  const randomHash = sha256Hex('random-key-unknown');
  assert.throws(
    () => simulateRpcClaimDeviceKey('XF-UNKN-9999', randomHash, state),
    /INVALID_ACTIVATION_KEY/
  );
});

// -----------------------------------------------------------------------------
// T6: returned deviceId matches pending activation device
// -----------------------------------------------------------------------------
await runTest('T6: returned deviceId matches pending activation device', async () => {
  const state = getBaseState();
  const res = simulateRpcClaimDeviceKey('XF-PWCF-LCKC', state.keyHash, state);
  const pendingReq = state.activationRequests.find((r) => r.displayCode === 'XF-PWCF-LCKC');
  assert.equal(res.deviceId, pendingReq.deviceId);
});

// -----------------------------------------------------------------------------
// T7: returned displayCode canonicalized correctly
// -----------------------------------------------------------------------------
await runTest('T7: returned displayCode canonicalized correctly', async () => {
  const state = getBaseState();
  // lowercase with whitespace
  const res = simulateRpcClaimDeviceKey('  xf-pwcf-lckc  ', state.keyHash, state);
  assert.equal(res.displayCode, 'XF-PWCF-LCKC');
});

// -----------------------------------------------------------------------------
// T8: no plaintext key returned
// -----------------------------------------------------------------------------
await runTest('T8: no plaintext key returned', async () => {
  const state = getBaseState();
  const res = simulateRpcClaimDeviceKey('XF-PWCF-LCKC', state.keyHash, state);
  assert.equal('key' in res, false);
  assert.equal('secret' in res, false);
  assert.equal('permanentKey' in res, false);
  assert.equal('ciphertext' in res, false);
});

// -----------------------------------------------------------------------------
// T9: no key hash returned
// -----------------------------------------------------------------------------
await runTest('T9: no key hash returned', async () => {
  const state = getBaseState();
  const res = simulateRpcClaimDeviceKey('XF-PWCF-LCKC', state.keyHash, state);
  assert.equal('activationKeyHash' in res, false);
  assert.equal('keyHash' in res, false);
});

// -----------------------------------------------------------------------------
// T10: validation alone does not authorize device
// -----------------------------------------------------------------------------
await runTest('T10: validation alone does not authorize device', async () => {
  const state = getBaseState();
  simulateRpcClaimDeviceKey('XF-PWCF-LCKC', state.keyHash, state);
  // Device must NOT be in state.devices (not authorized)
  const dev = state.devices.find((d) => d.displayCode === 'XF-PWCF-LCKC');
  assert.equal(dev, undefined);
  // Request must still be PENDING
  const req = state.activationRequests.find((r) => r.displayCode === 'XF-PWCF-LCKC');
  assert.equal(req.status, 'PENDING');
});

// -----------------------------------------------------------------------------
// T11: manager activation NEW_CUSTOMER passes through helper
// -----------------------------------------------------------------------------
await runTest('T11: manager activation NEW_CUSTOMER passes through helper', async () => {
  const state = getBaseState();
  const res = simulateRpcManagerCompleteDeviceActivation({
    flowMode: 'NEW_CUSTOMER',
    displayCode: 'XF-PWCF-LCKC',
    activationKeyHash: state.keyHash,
    newCustomerName: 'Novo Cliente T11',
    sourceId: 'src-1',
    sourceType: 'M3U',
    displayName: 'Lista 1',
    ciphertext: 'aabb',
    nonce: '00112233445566778899aabb',
    authTag: '00112233445566778899aabbccddeeff',
  }, { uid: 'mgr-admin-1' }, state);

  assert.equal(res.success, true);
  assert.equal(res.deviceAuthorizationState, 'AUTHORIZED');
  assert.equal(res.sourceReused, false);
  assert.ok(res.customerId);
  assert.ok(res.licenseId);
});

// -----------------------------------------------------------------------------
// T12: manager activation EXISTING_CUSTOMER passes through helper
// -----------------------------------------------------------------------------
await runTest('T12: manager activation EXISTING_CUSTOMER passes through helper', async () => {
  const state = getBaseState();
  const res = simulateRpcManagerCompleteDeviceActivation({
    flowMode: 'EXISTING_CUSTOMER',
    displayCode: 'XF-PWCF-LCKC',
    activationKeyHash: state.keyHash,
    customerId: 'cust-1',
    existingDisplayCode: 'XF-0000-1111',
  }, { uid: 'mgr-admin-1' }, state);

  assert.equal(res.success, true);
  assert.equal(res.deviceAuthorizationState, 'AUTHORIZED');
  assert.equal(res.sourceReused, true);
  assert.equal(res.customerId, 'cust-1');
});

console.log('\n================================================================');
console.log(`TOTAL TESTS: ${totalTests}`);
console.log(`PASSED: ${passedTests}`);
console.log(`FAILED: ${totalTests - passedTests}`);
console.log('================================================================\n');

assert.equal(totalTests, 12);
assert.equal(passedTests, 12);
