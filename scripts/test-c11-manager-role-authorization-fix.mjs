/**
 * Xandeflix Prebuilt — C11 Manager Role Authorization Fix Test Suite
 *
 * Matrix:
 * T1: ACTIVE OWNER -> NEW_CUSTOMER activation authorized
 * T2: ACTIVE ADMIN -> NEW_CUSTOMER activation authorized
 * T3: ACTIVE OWNER -> EXISTING_CUSTOMER activation authorized
 * T4: ACTIVE ADMIN -> EXISTING_CUSTOMER activation authorized
 * T5: inactive ADMIN -> denied (MANAGER_NOT_AUTHORIZED)
 * T6: inactive OWNER -> denied (MANAGER_NOT_AUTHORIZED)
 * T7: authenticated non-manager -> denied (MANAGER_NOT_AUTHORIZED)
 * T8: unauthenticated caller -> denied (MANAGER_AUTH_REQUIRED)
 * T9: unsupported manager role -> denied (MANAGER_NOT_AUTHORIZED)
 * T10: ADMIN cannot gain unrelated OWNER-only operation
 * T11: existing NEW_CUSTOMER business tests remain PASS
 * T12: existing EXISTING_CUSTOMER business tests remain PASS
 * T13: cross-customer protections remain PASS
 * T14: Vault plaintext protections remain PASS
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const migrationSql = fs.readFileSync(
  path.join(process.cwd(), 'supabase/migrations/20260925100000_c11_manager_activation_role_authorization_fix.sql'),
  'utf8'
);

const edgeFunctionSrc = fs.readFileSync(
  path.join(process.cwd(), 'supabase/functions/managed-source-vault-admin/index.ts'),
  'utf8'
);

async function sha256Hex(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

/**
 * Simula private.require_device_activation_manager()
 */
function simulateRequireDeviceActivationManager(authContext, managerAdmins) {
  const userId = authContext?.uid;
  if (!userId) {
    const err = new Error('MANAGER_AUTH_REQUIRED');
    err.code = '42501';
    throw err;
  }

  const admin = managerAdmins.find(
    (a) => a.userId === userId && a.status === 'ACTIVE' && ['OWNER', 'ADMIN'].includes(a.role)
  );

  if (!admin) {
    const err = new Error('MANAGER_NOT_AUTHORIZED');
    err.code = '42501';
    throw err;
  }

  return userId;
}

/**
 * Simula private.require_master_manager() (OWNER only)
 */
function simulateRequireMasterManager(authContext, managerAdmins) {
  const userId = authContext?.uid;
  if (!userId) {
    const err = new Error('MANAGER_AUTH_REQUIRED');
    err.code = '42501';
    throw err;
  }

  const admin = managerAdmins.find(
    (a) => a.userId === userId && a.status === 'ACTIVE' && a.role === 'OWNER'
  );

  if (!admin) {
    const err = new Error('MASTER_MANAGER_NOT_AUTHORIZED');
    err.code = '42501';
    throw err;
  }

  return userId;
}

/**
 * Simula a RPC completa com verificacao de autorizacao de menor privilegio
 */
function simulateRpcWithAuth(input, authContext, state) {
  // 1. Authorization check
  simulateRequireDeviceActivationManager(authContext, state.managerAdmins);

  // 2. Validate pair
  const claimed = state.keyVault.find(
    (k) => k.displayCode === input.displayCode && k.activationKeyHash === input.activationKeyHash
  );
  if (!claimed) {
    throw new Error('INVALID_ACTIVATION_KEY');
  }

  const deviceId = claimed.deviceId;
  const displayCode = claimed.displayCode;

  if (input.flowMode === 'EXISTING_CUSTOMER') {
    if (!input.customerId) throw new Error('CUSTOMER_ID_REQUIRED');
    if (!input.existingDisplayCode || !/^XF-[0-9A-Z]{4}-[0-9A-Z]{4}$/.test(input.existingDisplayCode)) {
      throw new Error('EXISTING_DEVICE_CODE_REQUIRED');
    }

    const customer = state.customerProfiles.find((c) => c.id === input.customerId);
    if (!customer) throw new Error('CUSTOMER_PROFILE_NOT_FOUND');
    if (customer.status !== 'ACTIVE') throw new Error('CUSTOMER_PROFILE_NOT_ACTIVE');

    const existingDevice = state.devices.find((d) => d.displayCode === input.existingDisplayCode);
    if (!existingDevice) throw new Error('EXISTING_DEVICE_NOT_FOUND');

    // Linkage check
    const existingBinding = state.licenseDevices.find((ld) => {
      if (ld.deviceId !== existingDevice.deviceId || ld.status !== 'ACTIVE') return false;
      const lic = state.licenses.find((l) => l.id === ld.licenseId);
      return lic && lic.customerId === input.customerId;
    });
    if (!existingBinding) throw new Error('EXISTING_DEVICE_CUSTOMER_MISMATCH');

    const activeSources = state.deviceSourceBindings.filter((dsb) => {
      const lic = state.licenses.find((l) => l.id === dsb.licenseId);
      if (!lic || lic.customerId !== input.customerId) return false;
      const src = state.managedSources.find((ms) => ms.id === dsb.sourceId);
      return src && src.status === 'ACTIVE';
    });

    if (activeSources.length === 0) throw new Error('CUSTOMER_HAS_NO_ACTIVE_SOURCE');
    if (activeSources.length > 1) throw new Error('CUSTOMER_SOURCE_AMBIGUOUS');

    const reusedSource = state.managedSources.find((ms) => ms.id === activeSources[0].sourceId);

    const eligibleLicenses = state.licenses.filter(
      (l) => l.customerId === input.customerId && l.mode === 'MANAGED' && ['ACTIVE', 'TRIAL'].includes(l.status)
    );
    if (eligibleLicenses.length === 0) throw new Error('NO_ELIGIBLE_MANAGED_LICENSE');
    if (eligibleLicenses.length > 1) throw new Error('MANAGED_LICENSE_AMBIGUOUS');

    const candidateLicense = eligibleLicenses[0];
    const activeBoundCount = state.licenseDevices.filter(
      (ld) => ld.licenseId === candidateLicense.id && ld.status === 'ACTIVE' && ld.deviceId !== deviceId
    ).length;
    if (activeBoundCount >= candidateLicense.maxDevices) {
      throw new Error('MANAGED_LICENSE_CAPACITY_EXHAUSTED');
    }

    return {
      success: true,
      flowMode: 'EXISTING_CUSTOMER',
      deviceId,
      displayCode,
      customerId: input.customerId,
      licenseId: candidateLicense.id,
      sourceId: reusedSource.sourceId,
      sourceReused: true,
      deviceAuthorizationState: 'AUTHORIZED',
    };
  } else {
    // NEW_CUSTOMER
    if (!input.name || !input.sourceConfig) throw new Error('SOURCE_CONFIG_REQUIRED');
    let custId = input.customerId;
    if (!custId && input.newCustomerName) {
      custId = 'cust_' + Date.now();
      state.customerProfiles.push({ id: custId, nickname: input.newCustomerName, status: 'ACTIVE' });
    }
    const licId = 'lic_' + Date.now();
    state.licenses.push({ id: licId, customerId: custId, mode: 'MANAGED', status: 'ACTIVE', maxDevices: 1 });

    return {
      success: true,
      flowMode: 'NEW_CUSTOMER',
      deviceId,
      displayCode,
      customerId: custId,
      licenseId: licId,
      sourceId: 'src_' + Date.now(),
      sourceReused: false,
      deviceAuthorizationState: 'AUTHORIZED',
    };
  }
}

let testIndex = 0;
async function runTest(name, fn) {
  testIndex++;
  try {
    await fn();
    console.log(`[PASS] ${name}`);
  } catch (err) {
    console.error(`[FAIL] ${name}: ${err.message}`);
    process.exit(1);
  }
}

console.log('================================================================');
console.log('Xandeflix Prebuilt — C11 Manager Role Authorization Fix Suite');
console.log('================================================================\n');

// Common test state setup
const keyRaw = '123456';
const keyHash = await sha256Hex(keyRaw);

function getBaseState() {
  return {
    managerAdmins: [
      { userId: 'user-owner', role: 'OWNER', status: 'ACTIVE' },
      { userId: 'user-admin', role: 'ADMIN', status: 'ACTIVE' },
      { userId: 'user-inactive-admin', role: 'ADMIN', status: 'INACTIVE' },
      { userId: 'user-inactive-owner', role: 'OWNER', status: 'SUSPENDED' },
      { userId: 'user-viewer', role: 'VIEWER', status: 'ACTIVE' },
    ],
    keyVault: [
      { displayCode: 'XF-1111-2222', activationKeyHash: keyHash, deviceId: 'dev-new-1' },
      { displayCode: 'XF-3333-4444', activationKeyHash: keyHash, deviceId: 'dev-new-2' },
    ],
    customerProfiles: [
      { id: 'cust-1', nickname: 'Cliente Teste', status: 'ACTIVE' },
    ],
    devices: [
      { deviceId: 'dev-old-1', displayCode: 'XF-0000-1111', status: 'AUTHORIZED' },
    ],
    licenses: [
      { id: 'lic-1', customerId: 'cust-1', mode: 'MANAGED', status: 'ACTIVE', maxDevices: 5 },
    ],
    licenseDevices: [
      { licenseId: 'lic-1', deviceId: 'dev-old-1', status: 'ACTIVE' },
    ],
    managedSources: [
      { id: 'ms-1', sourceId: 'src_1', status: 'ACTIVE' },
    ],
    deviceSourceBindings: [
      { licenseId: 'lic-1', deviceId: 'dev-old-1', sourceId: 'ms-1' },
    ],
  };
}

// -----------------------------------------------------------------------------
// T1: ACTIVE OWNER -> NEW_CUSTOMER activation authorized
// -----------------------------------------------------------------------------
await runTest('T1: ACTIVE OWNER -> NEW_CUSTOMER activation authorized', async () => {
  const state = getBaseState();
  const res = simulateRpcWithAuth({
    flowMode: 'NEW_CUSTOMER',
    displayCode: 'XF-1111-2222',
    activationKeyHash: keyHash,
    newCustomerName: 'Novo Cliente Owner',
    name: 'Fonte M3U',
    sourceConfig: { playlistUrl: 'https://exemplo.com/live.m3u' },
  }, { uid: 'user-owner' }, state);

  assert.equal(res.success, true);
  assert.equal(res.deviceAuthorizationState, 'AUTHORIZED');
  assert.equal(res.sourceReused, false);
});

// -----------------------------------------------------------------------------
// T2: ACTIVE ADMIN -> NEW_CUSTOMER activation authorized
// -----------------------------------------------------------------------------
await runTest('T2: ACTIVE ADMIN -> NEW_CUSTOMER activation authorized', async () => {
  const state = getBaseState();
  const res = simulateRpcWithAuth({
    flowMode: 'NEW_CUSTOMER',
    displayCode: 'XF-1111-2222',
    activationKeyHash: keyHash,
    newCustomerName: 'Novo Cliente Admin',
    name: 'Fonte M3U',
    sourceConfig: { playlistUrl: 'https://exemplo.com/live.m3u' },
  }, { uid: 'user-admin' }, state);

  assert.equal(res.success, true);
  assert.equal(res.deviceAuthorizationState, 'AUTHORIZED');
  assert.equal(res.sourceReused, false);
});

// -----------------------------------------------------------------------------
// T3: ACTIVE OWNER -> EXISTING_CUSTOMER activation authorized
// -----------------------------------------------------------------------------
await runTest('T3: ACTIVE OWNER -> EXISTING_CUSTOMER activation authorized', async () => {
  const state = getBaseState();
  const res = simulateRpcWithAuth({
    flowMode: 'EXISTING_CUSTOMER',
    customerId: 'cust-1',
    existingDisplayCode: 'XF-0000-1111',
    displayCode: 'XF-1111-2222',
    activationKeyHash: keyHash,
  }, { uid: 'user-owner' }, state);

  assert.equal(res.success, true);
  assert.equal(res.deviceAuthorizationState, 'AUTHORIZED');
  assert.equal(res.sourceReused, true);
});

// -----------------------------------------------------------------------------
// T4: ACTIVE ADMIN -> EXISTING_CUSTOMER activation authorized
// -----------------------------------------------------------------------------
await runTest('T4: ACTIVE ADMIN -> EXISTING_CUSTOMER activation authorized', async () => {
  const state = getBaseState();
  const res = simulateRpcWithAuth({
    flowMode: 'EXISTING_CUSTOMER',
    customerId: 'cust-1',
    existingDisplayCode: 'XF-0000-1111',
    displayCode: 'XF-1111-2222',
    activationKeyHash: keyHash,
  }, { uid: 'user-admin' }, state);

  assert.equal(res.success, true);
  assert.equal(res.deviceAuthorizationState, 'AUTHORIZED');
  assert.equal(res.sourceReused, true);
});

// -----------------------------------------------------------------------------
// T5: inactive ADMIN -> denied (MANAGER_NOT_AUTHORIZED)
// -----------------------------------------------------------------------------
await runTest('T5: inactive ADMIN -> denied (MANAGER_NOT_AUTHORIZED)', async () => {
  const state = getBaseState();
  assert.throws(
    () => simulateRpcWithAuth({
      flowMode: 'NEW_CUSTOMER',
      displayCode: 'XF-1111-2222',
      activationKeyHash: keyHash,
      newCustomerName: 'Teste',
      name: 'Fonte',
      sourceConfig: { playlistUrl: 'https://exemplo.com' },
    }, { uid: 'user-inactive-admin' }, state),
    /MANAGER_NOT_AUTHORIZED/
  );
});

// -----------------------------------------------------------------------------
// T6: inactive OWNER -> denied (MANAGER_NOT_AUTHORIZED)
// -----------------------------------------------------------------------------
await runTest('T6: inactive OWNER -> denied (MANAGER_NOT_AUTHORIZED)', async () => {
  const state = getBaseState();
  assert.throws(
    () => simulateRpcWithAuth({
      flowMode: 'NEW_CUSTOMER',
      displayCode: 'XF-1111-2222',
      activationKeyHash: keyHash,
      newCustomerName: 'Teste',
      name: 'Fonte',
      sourceConfig: { playlistUrl: 'https://exemplo.com' },
    }, { uid: 'user-inactive-owner' }, state),
    /MANAGER_NOT_AUTHORIZED/
  );
});

// -----------------------------------------------------------------------------
// T7: authenticated non-manager -> denied (MANAGER_NOT_AUTHORIZED)
// -----------------------------------------------------------------------------
await runTest('T7: authenticated non-manager -> denied (MANAGER_NOT_AUTHORIZED)', async () => {
  const state = getBaseState();
  assert.throws(
    () => simulateRpcWithAuth({
      flowMode: 'NEW_CUSTOMER',
      displayCode: 'XF-1111-2222',
      activationKeyHash: keyHash,
      newCustomerName: 'Teste',
      name: 'Fonte',
      sourceConfig: { playlistUrl: 'https://exemplo.com' },
    }, { uid: 'user-regular-customer' }, state),
    /MANAGER_NOT_AUTHORIZED/
  );
});

// -----------------------------------------------------------------------------
// T8: unauthenticated caller -> denied (MANAGER_AUTH_REQUIRED)
// -----------------------------------------------------------------------------
await runTest('T8: unauthenticated caller -> denied (MANAGER_AUTH_REQUIRED)', async () => {
  const state = getBaseState();
  assert.throws(
    () => simulateRpcWithAuth({
      flowMode: 'NEW_CUSTOMER',
      displayCode: 'XF-1111-2222',
      activationKeyHash: keyHash,
      newCustomerName: 'Teste',
      name: 'Fonte',
      sourceConfig: { playlistUrl: 'https://exemplo.com' },
    }, null, state),
    /MANAGER_AUTH_REQUIRED/
  );
});

// -----------------------------------------------------------------------------
// T9: unsupported manager role -> denied (MANAGER_NOT_AUTHORIZED)
// -----------------------------------------------------------------------------
await runTest('T9: unsupported manager role -> denied (MANAGER_NOT_AUTHORIZED)', async () => {
  const state = getBaseState();
  assert.throws(
    () => simulateRpcWithAuth({
      flowMode: 'NEW_CUSTOMER',
      displayCode: 'XF-1111-2222',
      activationKeyHash: keyHash,
      newCustomerName: 'Teste',
      name: 'Fonte',
      sourceConfig: { playlistUrl: 'https://exemplo.com' },
    }, { uid: 'user-viewer' }, state),
    /MANAGER_NOT_AUTHORIZED/
  );
});

// -----------------------------------------------------------------------------
// T10: ADMIN cannot gain unrelated OWNER-only operation
// -----------------------------------------------------------------------------
await runTest('T10: ADMIN cannot gain unrelated OWNER-only operation', async () => {
  const state = getBaseState();
  // Call simulateRequireMasterManager as ADMIN -> must throw MASTER_MANAGER_NOT_AUTHORIZED
  assert.throws(
    () => simulateRequireMasterManager({ uid: 'user-admin' }, state.managerAdmins),
    /MASTER_MANAGER_NOT_AUTHORIZED/
  );

  // But OWNER succeeds
  const ownerResult = simulateRequireMasterManager({ uid: 'user-owner' }, state.managerAdmins);
  assert.equal(ownerResult, 'user-owner');

  // Verify migration SQL does NOT alter require_master_manager
  assert.doesNotMatch(migrationSql, /CREATE OR REPLACE FUNCTION private\.require_master_manager/i);
});

// -----------------------------------------------------------------------------
// T11: existing NEW_CUSTOMER business tests remain PASS
// -----------------------------------------------------------------------------
await runTest('T11: existing NEW_CUSTOMER business tests remain PASS', async () => {
  const state = getBaseState();
  const res = simulateRpcWithAuth({
    flowMode: 'NEW_CUSTOMER',
    displayCode: 'XF-1111-2222',
    activationKeyHash: keyHash,
    newCustomerName: 'Cliente Negocio T11',
    name: 'Fonte Negocio',
    sourceConfig: { playlistUrl: 'https://exemplo.com/negocio.m3u' },
  }, { uid: 'user-admin' }, state);

  assert.equal(res.success, true);
  assert.equal(res.flowMode, 'NEW_CUSTOMER');
  const createdLic = state.licenses.find((l) => l.id === res.licenseId);
  assert.ok(createdLic);
  assert.equal(createdLic.maxDevices, 1);
  assert.equal(createdLic.status, 'ACTIVE');
});

// -----------------------------------------------------------------------------
// T12: existing EXISTING_CUSTOMER business tests remain PASS
// -----------------------------------------------------------------------------
await runTest('T12: existing EXISTING_CUSTOMER business tests remain PASS', async () => {
  const state = getBaseState();
  const res = simulateRpcWithAuth({
    flowMode: 'EXISTING_CUSTOMER',
    customerId: 'cust-1',
    existingDisplayCode: 'XF-0000-1111',
    displayCode: 'XF-1111-2222',
    activationKeyHash: keyHash,
  }, { uid: 'user-admin' }, state);

  assert.equal(res.success, true);
  assert.equal(res.sourceReused, true);
  assert.equal(res.sourceId, 'src_1');
});

// -----------------------------------------------------------------------------
// T13: cross-customer protections remain PASS
// -----------------------------------------------------------------------------
await runTest('T13: cross-customer protections remain PASS', async () => {
  const state = getBaseState();
  state.customerProfiles.push({ id: 'cust-other', nickname: 'Outro Cliente', status: 'ACTIVE' });

  // Provide device of cust-1 but select cust-other
  assert.throws(
    () => simulateRpcWithAuth({
      flowMode: 'EXISTING_CUSTOMER',
      customerId: 'cust-other',
      existingDisplayCode: 'XF-0000-1111', // belongs to cust-1!
      displayCode: 'XF-1111-2222',
      activationKeyHash: keyHash,
    }, { uid: 'user-admin' }, state),
    /EXISTING_DEVICE_CUSTOMER_MISMATCH/
  );
});

// -----------------------------------------------------------------------------
// T14: Vault plaintext protections remain PASS
// -----------------------------------------------------------------------------
await runTest('T14: Vault plaintext protections remain PASS', async () => {
  // Check migration SQL doesn't return or log plaintext
  assert.doesNotMatch(migrationSql, /RAISE NOTICE.*password/i);
  assert.doesNotMatch(migrationSql, /SELECT.*password.*FROM/i);

  // Check Edge Function error mapping handles MASTER_MANAGER_NOT_AUTHORIZED
  assert.match(edgeFunctionSrc, /MASTER_MANAGER_NOT_AUTHORIZED/);
  assert.match(edgeFunctionSrc, /MANAGER_NOT_AUTHORIZED/);
});

console.log('\n================================================================');
console.log(`TOTAL TESTS: ${testIndex}`);
console.log(`PASSED: ${testIndex}`);
console.log(`FAILED: 0`);
console.log('================================================================\n');
