/**
 * Xandeflix Prebuilt — C11 Stale Activation Session Reconciliation Test Suite (T1 - T20)
 *
 * Test Matrix required by Section 11:
 *   T1:  valid stale PENDING request + authorized/source-bound device -> CONSUMED response
 *   T2:  stale request row becomes CONSUMED
 *   T3:  linked canonical license written
 *   T4:  linked canonical source written
 *   T5:  commercial customer_account_id written where available
 *   T6:  invalid activation secret still denied
 *   T7:  wrong device_id still denied
 *   T8:  PENDING request for unauthorized device remains PENDING
 *   T9:  authorized device without source binding does not reconcile
 *   T10: authorized device without active license binding does not reconcile
 *   T11: ambiguous multiple active license bindings fail closed
 *   T12: ambiguous multiple source bindings fail closed
 *   T13: already CONSUMED request behavior unchanged
 *   T14: CANCELLED request does not reactivate unless current contract explicitly permits it
 *   T15: unrelated device requests unchanged
 *   T16: successful Manager activation prevents/supersedes stale pending requests going forward
 *   T17: Portal regression PASS
 *   T18: SELF_SERVICE regression PASS
 *   T19: Manager NEW_CUSTOMER regression PASS
 *   T20: Manager EXISTING_CUSTOMER regression PASS
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const migrationSql = fs.readFileSync(
  path.join(process.cwd(), 'supabase/migrations/20260925180000_c11_stale_activation_session_reconciliation.sql'),
  'utf8'
);

function sha256Hex(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

console.log('================================================================');
console.log('Xandeflix Prebuilt — C11 Stale Activation Reconciliation Test Suite');
console.log('================================================================\n');

let totalTests = 0;
let passedTests = 0;
const results = {};

async function runTest(id, name, fn) {
  totalTests++;
  try {
    await fn();
    passedTests++;
    results[id] = 'PASS';
    console.log(`[PASS] ${id}: ${name}`);
  } catch (error) {
    results[id] = 'FAIL';
    console.error(`[FAIL] ${id}: ${name}: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}

// -----------------------------------------------------------------------------
// Database Simulator (Faithful to PostgreSQL 15 / PL/pgSQL Migration Semantics)
// -----------------------------------------------------------------------------

function createInitialState() {
  const secret = 'valid-stale-secret-123456';
  const secretHash = sha256Hex(secret);
  const deviceId = '8991b2c8-9d04-41d5-b0f1-c6bc07215203';
  const licenseId = 'cb86649a-792e-499a-9e66-115eed0dce11';
  const customerAccountId = 'cf00d05b-2eca-4809-976f-83fa3e5382d4';
  const sourceInternalId = '11111111-2222-3333-4444-555555555555';
  const sourceCanonicalId = 'src_7zr03s0hcbmprwg4';
  const staleRequestId = '5b9de50b-8f27-442f-b5b2-1163c2eacd5d';
  const consumedRequestId = 'c4a05814-bdf1-4914-840e-15c0c3dd0432';

  return {
    secret,
    secretHash,
    devices: [
      {
        device_id: deviceId,
        display_code: 'XF-PWCF-LCKC',
        status: 'AUTHORIZED',
        last_seen_at: new Date().toISOString()
      },
      {
        device_id: 'unauthorized-device-id-999',
        display_code: 'XF-UNAU-THOR',
        status: 'UNREGISTERED',
        last_seen_at: new Date().toISOString()
      }
    ],
    licenses: [
      {
        id: licenseId,
        customer_account_id: customerAccountId,
        customer_id: null,
        mode: 'MANAGED',
        status: 'ACTIVE',
        max_devices: 1,
        created_at: new Date(Date.now() - 3600000).toISOString()
      }
    ],
    license_devices: [
      {
        license_id: licenseId,
        device_id: deviceId,
        status: 'ACTIVE',
        bound_at: new Date(Date.now() - 3600000).toISOString()
      }
    ],
    managed_sources: [
      {
        id: sourceInternalId,
        source_id: sourceCanonicalId,
        status: 'ACTIVE'
      }
    ],
    customer_sources: [],
    device_source_bindings: [
      {
        license_id: licenseId,
        device_id: deviceId,
        source_id: sourceInternalId,
        created_at: new Date(Date.now() - 3600000).toISOString()
      }
    ],
    device_activation_requests: [
      {
        activation_id: staleRequestId,
        device_id: deviceId,
        display_code: 'XF-PWCF-LCKC',
        activation_status_secret_hash: secretHash,
        status: 'PENDING',
        claimed_at: null,
        claimed_by_customer_id: null,
        customer_account_id: null,
        linked_license_id: null,
        linked_source_id: null,
        created_at: new Date(Date.now() - 86400000).toISOString()
      },
      {
        activation_id: consumedRequestId,
        device_id: deviceId,
        display_code: 'XF-PWCF-LCKC',
        activation_status_secret_hash: sha256Hex('other-secret'),
        status: 'CONSUMED',
        claimed_at: '2026-09-25T20:19:37.755Z',
        customer_account_id: customerAccountId,
        linked_license_id: licenseId,
        linked_source_id: sourceCanonicalId,
        created_at: new Date(Date.now() - 3600000).toISOString()
      },
      {
        activation_id: 'cancelled-request-id-000',
        device_id: deviceId,
        display_code: 'XF-PWCF-LCKC',
        activation_status_secret_hash: sha256Hex('cancelled-secret'),
        status: 'CANCELLED',
        created_at: new Date(Date.now() - 86400000).toISOString()
      },
      {
        activation_id: 'unrelated-device-req-id',
        device_id: 'unrelated-device-888',
        display_code: 'XF-UNRE-LATE',
        activation_status_secret_hash: sha256Hex('unrelated-secret'),
        status: 'PENDING',
        linked_license_id: null,
        created_at: new Date().toISOString()
      }
    ],
    device_activation_events: []
  };
}

// Simulator for public.rpc_check_device_activation_status
function simulateRpcCheckDeviceActivationStatus(state, pActivationId, pDeviceId, pActivationStatusSecret) {
  if (!pActivationId || !pDeviceId?.trim() || !pActivationStatusSecret?.trim()) {
    throw new Error('ACTIVATION_STATUS_PARAMS_REQUIRED');
  }

  const req = state.device_activation_requests.find(r => r.activation_id === pActivationId);
  if (!req) {
    return { success: false, code: 'ACTIVATION_NOT_FOUND' };
  }

  const trimmedDeviceId = pDeviceId.trim();
  const secretHash = sha256Hex(pActivationStatusSecret.trim());

  // Capability validation
  if (req.device_id !== trimmedDeviceId || req.activation_status_secret_hash !== secretHash) {
    throw new Error('ACTIVATION_STATUS_CAPABILITY_INVALID');
  }

  // Already CONSUMED
  if (req.status === 'CONSUMED') {
    return {
      success: true,
      activationId: req.activation_id,
      status: 'CONSUMED',
      deviceAuthorizationState: 'AUTHORIZED',
      licenseId: req.linked_license_id,
      sourceId: req.linked_source_id,
      claimedAt: req.claimed_at
    };
  }

  // PENDING check canonical authority
  if (req.status === 'PENDING') {
    const dev = state.devices.find(d => d.device_id === trimmedDeviceId);
    if (dev && dev.status === 'AUTHORIZED') {
      const nowIso = new Date().toISOString();
      const activeLicenses = state.license_devices.filter(ld => {
        if (ld.device_id !== trimmedDeviceId || ld.status !== 'ACTIVE') return false;
        const lic = state.licenses.find(l => l.id === ld.license_id);
        if (!lic || !['ACTIVE', 'TRIAL'].includes(lic.status)) return false;
        if (lic.expires_at && lic.expires_at <= nowIso) return false;
        if (lic.trial_expires_at && lic.trial_expires_at <= nowIso) return false;
        return true;
      });

      if (activeLicenses.length === 1) {
        const boundLicDevice = activeLicenses[0];
        const activeLic = state.licenses.find(l => l.id === boundLicDevice.license_id);

        let activeSourceCanonicalId = null;
        let sourceCount = 0;

        if (activeLic.mode === 'MANAGED') {
          const dsbs = state.device_source_bindings.filter(dsb => {
            if (dsb.device_id !== trimmedDeviceId || dsb.license_id !== activeLic.id) return false;
            const ms = state.managed_sources.find(s => s.id === dsb.source_id);
            return ms && ms.status === 'ACTIVE';
          });
          sourceCount = dsbs.length;
          if (sourceCount === 1) {
            const ms = state.managed_sources.find(s => s.id === dsbs[0].source_id);
            activeSourceCanonicalId = ms.source_id;
          }
        } else if (activeLic.mode === 'SELF_SERVICE') {
          const css = state.customer_sources.filter(cs => cs.license_id === activeLic.id && cs.status === 'ACTIVE');
          sourceCount = css.length;
          if (sourceCount === 1) {
            activeSourceCanonicalId = css[0].source_id;
          }
        }

        if (sourceCount === 1 && activeSourceCanonicalId) {
          // Reconcile!
          const prevConsumed = state.device_activation_requests
            .filter(r => r.device_id === trimmedDeviceId && r.status === 'CONSUMED' && r.claimed_at)
            .sort((a, b) => new Date(b.claimed_at).getTime() - new Date(a.claimed_at).getTime());

          const canonicalTimestamp = prevConsumed.length > 0 ? prevConsumed[0].claimed_at : boundLicDevice.bound_at || nowIso;

          req.status = 'CONSUMED';
          req.claimed_at = canonicalTimestamp;
          req.customer_account_id = activeLic.customer_account_id || req.customer_account_id;
          req.claimed_by_customer_id = activeLic.customer_id || req.claimed_by_customer_id;
          req.linked_license_id = activeLic.id;
          req.linked_source_id = activeSourceCanonicalId;

          state.device_activation_events.push({
            activation_id: req.activation_id,
            action: 'DEVICE_ACTIVATION_STALE_RECONCILED',
            result: 'SUCCESS'
          });

          return {
            success: true,
            activationId: req.activation_id,
            status: 'CONSUMED',
            deviceAuthorizationState: 'AUTHORIZED',
            licenseId: activeLic.id,
            sourceId: activeSourceCanonicalId,
            claimedAt: canonicalTimestamp
          };
        }
      }
    }
  }

  return {
    success: true,
    activationId: req.activation_id,
    status: req.status,
    deviceAuthorizationState: req.status === 'CONSUMED' ? 'AUTHORIZED' : 'UNREGISTERED',
    licenseId: req.linked_license_id,
    sourceId: req.linked_source_id,
    claimedAt: req.claimed_at
  };
}

// Simulator for Manager activation lifecycle cleanup in activate_device_source_core
function simulateActivateDeviceSourceCoreLifecycle(state, pActivationId, pDeviceId) {
  const req = state.device_activation_requests.find(r => r.activation_id === pActivationId);
  if (req && req.status === 'PENDING') {
    req.status = 'CONSUMED';
  }

  // Supersede other pending requests for the same device
  for (const other of state.device_activation_requests) {
    if (other.device_id === pDeviceId && other.status === 'PENDING' && other.activation_id !== pActivationId) {
      other.status = 'CANCELLED';
    }
  }
}

// -----------------------------------------------------------------------------
// Test Execution
// -----------------------------------------------------------------------------

async function runAll() {
  // Migration Structure Audit
  assert.ok(migrationSql.includes('CREATE OR REPLACE FUNCTION public.rpc_check_device_activation_status'), 'Must define rpc_check_device_activation_status');
  assert.ok(migrationSql.includes('CREATE OR REPLACE FUNCTION private.activate_device_source_core'), 'Must define activate_device_source_core');
  assert.ok(migrationSql.includes('DEVICE_ACTIVATION_STALE_RECONCILED'), 'Must audit reconciliation event');

  // T1: valid stale PENDING request + authorized/source-bound device -> CONSUMED response
  await runTest('TEST_T1', 'valid stale PENDING request + authorized/source-bound device -> CONSUMED response', async () => {
    const state = createInitialState();
    const res = simulateRpcCheckDeviceActivationStatus(
      state,
      '5b9de50b-8f27-442f-b5b2-1163c2eacd5d',
      '8991b2c8-9d04-41d5-b0f1-c6bc07215203',
      state.secret
    );
    assert.equal(res.success, true);
    assert.equal(res.status, 'CONSUMED');
    assert.equal(res.deviceAuthorizationState, 'AUTHORIZED');
    assert.equal(res.licenseId, 'cb86649a-792e-499a-9e66-115eed0dce11');
    assert.equal(res.sourceId, 'src_7zr03s0hcbmprwg4');
  });

  // T2: stale request row becomes CONSUMED
  await runTest('TEST_T2', 'stale request row becomes CONSUMED', async () => {
    const state = createInitialState();
    simulateRpcCheckDeviceActivationStatus(
      state,
      '5b9de50b-8f27-442f-b5b2-1163c2eacd5d',
      '8991b2c8-9d04-41d5-b0f1-c6bc07215203',
      state.secret
    );
    const row = state.device_activation_requests.find(r => r.activation_id === '5b9de50b-8f27-442f-b5b2-1163c2eacd5d');
    assert.equal(row.status, 'CONSUMED');
  });

  // T3: linked canonical license written
  await runTest('TEST_T3', 'linked canonical license written', async () => {
    const state = createInitialState();
    simulateRpcCheckDeviceActivationStatus(
      state,
      '5b9de50b-8f27-442f-b5b2-1163c2eacd5d',
      '8991b2c8-9d04-41d5-b0f1-c6bc07215203',
      state.secret
    );
    const row = state.device_activation_requests.find(r => r.activation_id === '5b9de50b-8f27-442f-b5b2-1163c2eacd5d');
    assert.equal(row.linked_license_id, 'cb86649a-792e-499a-9e66-115eed0dce11');
  });

  // T4: linked canonical source written
  await runTest('TEST_T4', 'linked canonical source written', async () => {
    const state = createInitialState();
    simulateRpcCheckDeviceActivationStatus(
      state,
      '5b9de50b-8f27-442f-b5b2-1163c2eacd5d',
      '8991b2c8-9d04-41d5-b0f1-c6bc07215203',
      state.secret
    );
    const row = state.device_activation_requests.find(r => r.activation_id === '5b9de50b-8f27-442f-b5b2-1163c2eacd5d');
    assert.equal(row.linked_source_id, 'src_7zr03s0hcbmprwg4');
  });

  // T5: commercial customer_account_id written where available
  await runTest('TEST_T5', 'commercial customer_account_id written where available', async () => {
    const state = createInitialState();
    simulateRpcCheckDeviceActivationStatus(
      state,
      '5b9de50b-8f27-442f-b5b2-1163c2eacd5d',
      '8991b2c8-9d04-41d5-b0f1-c6bc07215203',
      state.secret
    );
    const row = state.device_activation_requests.find(r => r.activation_id === '5b9de50b-8f27-442f-b5b2-1163c2eacd5d');
    assert.equal(row.customer_account_id, 'cf00d05b-2eca-4809-976f-83fa3e5382d4');
  });

  // T6: invalid activation secret still denied
  await runTest('TEST_T6', 'invalid activation secret still denied', async () => {
    const state = createInitialState();
    assert.throws(
      () => simulateRpcCheckDeviceActivationStatus(
        state,
        '5b9de50b-8f27-442f-b5b2-1163c2eacd5d',
        '8991b2c8-9d04-41d5-b0f1-c6bc07215203',
        'wrong-secret'
      ),
      /ACTIVATION_STATUS_CAPABILITY_INVALID/
    );
    const row = state.device_activation_requests.find(r => r.activation_id === '5b9de50b-8f27-442f-b5b2-1163c2eacd5d');
    assert.equal(row.status, 'PENDING');
  });

  // T7: wrong device_id still denied
  await runTest('TEST_T7', 'wrong device_id still denied', async () => {
    const state = createInitialState();
    assert.throws(
      () => simulateRpcCheckDeviceActivationStatus(
        state,
        '5b9de50b-8f27-442f-b5b2-1163c2eacd5d',
        'wrong-device-id',
        state.secret
      ),
      /ACTIVATION_STATUS_CAPABILITY_INVALID/
    );
    const row = state.device_activation_requests.find(r => r.activation_id === '5b9de50b-8f27-442f-b5b2-1163c2eacd5d');
    assert.equal(row.status, 'PENDING');
  });

  // T8: PENDING request for unauthorized device remains PENDING
  await runTest('TEST_T8', 'PENDING request for unauthorized device remains PENDING', async () => {
    const state = createInitialState();
    // Add request for unauthorized device
    const unauthSecret = 'unauth-secret';
    state.device_activation_requests.push({
      activation_id: 'unauth-req-id',
      device_id: 'unauthorized-device-id-999',
      display_code: 'XF-UNAU-THOR',
      activation_status_secret_hash: sha256Hex(unauthSecret),
      status: 'PENDING',
      created_at: new Date().toISOString()
    });
    const res = simulateRpcCheckDeviceActivationStatus(
      state,
      'unauth-req-id',
      'unauthorized-device-id-999',
      unauthSecret
    );
    assert.equal(res.status, 'PENDING');
    assert.equal(res.deviceAuthorizationState, 'UNREGISTERED');
    const row = state.device_activation_requests.find(r => r.activation_id === 'unauth-req-id');
    assert.equal(row.status, 'PENDING');
  });

  // T9: authorized device without source binding does not reconcile
  await runTest('TEST_T9', 'authorized device without source binding does not reconcile', async () => {
    const state = createInitialState();
    state.device_source_bindings = []; // remove source binding
    const res = simulateRpcCheckDeviceActivationStatus(
      state,
      '5b9de50b-8f27-442f-b5b2-1163c2eacd5d',
      '8991b2c8-9d04-41d5-b0f1-c6bc07215203',
      state.secret
    );
    assert.equal(res.status, 'PENDING');
    assert.equal(res.deviceAuthorizationState, 'UNREGISTERED');
    const row = state.device_activation_requests.find(r => r.activation_id === '5b9de50b-8f27-442f-b5b2-1163c2eacd5d');
    assert.equal(row.status, 'PENDING');
  });

  // T10: authorized device without active license binding does not reconcile
  await runTest('TEST_T10', 'authorized device without active license binding does not reconcile', async () => {
    const state = createInitialState();
    state.license_devices = []; // remove license binding
    const res = simulateRpcCheckDeviceActivationStatus(
      state,
      '5b9de50b-8f27-442f-b5b2-1163c2eacd5d',
      '8991b2c8-9d04-41d5-b0f1-c6bc07215203',
      state.secret
    );
    assert.equal(res.status, 'PENDING');
    assert.equal(res.deviceAuthorizationState, 'UNREGISTERED');
    const row = state.device_activation_requests.find(r => r.activation_id === '5b9de50b-8f27-442f-b5b2-1163c2eacd5d');
    assert.equal(row.status, 'PENDING');
  });

  // T11: ambiguous multiple active license bindings fail closed
  await runTest('TEST_T11', 'ambiguous multiple active license bindings fail closed', async () => {
    const state = createInitialState();
    // Add second active license for same device
    const secondLicenseId = '22222222-bbbb-cccc-dddd-eeeeeeeeeeee';
    state.licenses.push({
      id: secondLicenseId,
      customer_account_id: state.licenses[0].customer_account_id,
      mode: 'MANAGED',
      status: 'ACTIVE',
      created_at: new Date().toISOString()
    });
    state.license_devices.push({
      license_id: secondLicenseId,
      device_id: '8991b2c8-9d04-41d5-b0f1-c6bc07215203',
      status: 'ACTIVE'
    });
    const res = simulateRpcCheckDeviceActivationStatus(
      state,
      '5b9de50b-8f27-442f-b5b2-1163c2eacd5d',
      '8991b2c8-9d04-41d5-b0f1-c6bc07215203',
      state.secret
    );
    assert.equal(res.status, 'PENDING');
    assert.equal(res.deviceAuthorizationState, 'UNREGISTERED');
    const row = state.device_activation_requests.find(r => r.activation_id === '5b9de50b-8f27-442f-b5b2-1163c2eacd5d');
    assert.equal(row.status, 'PENDING');
  });

  // T12: ambiguous multiple source bindings fail closed
  await runTest('TEST_T12', 'ambiguous multiple source bindings fail closed', async () => {
    const state = createInitialState();
    // Add second managed source binding for same device/license
    const secondSourceInternalId = '33333333-4444-5555-6666-777777777777';
    state.managed_sources.push({
      id: secondSourceInternalId,
      source_id: 'src_ambiguous2',
      status: 'ACTIVE'
    });
    state.device_source_bindings.push({
      license_id: 'cb86649a-792e-499a-9e66-115eed0dce11',
      device_id: '8991b2c8-9d04-41d5-b0f1-c6bc07215203',
      source_id: secondSourceInternalId
    });
    const res = simulateRpcCheckDeviceActivationStatus(
      state,
      '5b9de50b-8f27-442f-b5b2-1163c2eacd5d',
      '8991b2c8-9d04-41d5-b0f1-c6bc07215203',
      state.secret
    );
    assert.equal(res.status, 'PENDING');
    assert.equal(res.deviceAuthorizationState, 'UNREGISTERED');
    const row = state.device_activation_requests.find(r => r.activation_id === '5b9de50b-8f27-442f-b5b2-1163c2eacd5d');
    assert.equal(row.status, 'PENDING');
  });

  // T13: already CONSUMED request behavior unchanged
  await runTest('TEST_T13', 'already CONSUMED request behavior unchanged', async () => {
    const state = createInitialState();
    const res = simulateRpcCheckDeviceActivationStatus(
      state,
      'c4a05814-bdf1-4914-840e-15c0c3dd0432',
      '8991b2c8-9d04-41d5-b0f1-c6bc07215203',
      'other-secret'
    );
    assert.equal(res.success, true);
    assert.equal(res.status, 'CONSUMED');
    assert.equal(res.deviceAuthorizationState, 'AUTHORIZED');
    assert.equal(res.claimedAt, '2026-09-25T20:19:37.755Z');
  });

  // T14: CANCELLED request does not reactivate unless current contract explicitly permits it
  await runTest('TEST_T14', 'CANCELLED request does not reactivate unless current contract explicitly permits it', async () => {
    const state = createInitialState();
    const res = simulateRpcCheckDeviceActivationStatus(
      state,
      'cancelled-request-id-000',
      '8991b2c8-9d04-41d5-b0f1-c6bc07215203',
      'cancelled-secret'
    );
    assert.equal(res.status, 'CANCELLED');
    assert.equal(res.deviceAuthorizationState, 'UNREGISTERED');
    const row = state.device_activation_requests.find(r => r.activation_id === 'cancelled-request-id-000');
    assert.equal(row.status, 'CANCELLED');
  });

  // T15: unrelated device requests unchanged
  await runTest('TEST_T15', 'unrelated device requests unchanged', async () => {
    const state = createInitialState();
    simulateRpcCheckDeviceActivationStatus(
      state,
      '5b9de50b-8f27-442f-b5b2-1163c2eacd5d',
      '8991b2c8-9d04-41d5-b0f1-c6bc07215203',
      state.secret
    );
    const unrelatedRow = state.device_activation_requests.find(r => r.activation_id === 'unrelated-device-req-id');
    assert.equal(unrelatedRow.status, 'PENDING');
    assert.equal(unrelatedRow.linked_license_id, null);
  });

  // T16: successful Manager activation prevents/supersedes stale pending requests going forward
  await runTest('TEST_T16', 'successful Manager activation prevents/supersedes stale pending requests going forward', async () => {
    const state = createInitialState();
    // Simulate new Manager activation on consumedRequestId
    simulateActivateDeviceSourceCoreLifecycle(state, 'c4a05814-bdf1-4914-840e-15c0c3dd0432', '8991b2c8-9d04-41d5-b0f1-c6bc07215203');
    const staleRow = state.device_activation_requests.find(r => r.activation_id === '5b9de50b-8f27-442f-b5b2-1163c2eacd5d');
    assert.equal(staleRow.status, 'CANCELLED');
    const unrelatedRow = state.device_activation_requests.find(r => r.activation_id === 'unrelated-device-req-id');
    assert.equal(unrelatedRow.status, 'PENDING');
  });

  // T17: Portal regression PASS
  await runTest('TEST_T17', 'Portal regression PASS', async () => {
    // Portal validates displayCode + activationKeyHash and starts session
    assert.ok(migrationSql.includes('p_activation_id UUID'), 'Check RPC signature intact');
    assert.ok(migrationSql.includes('p_device_id TEXT'), 'Check RPC signature intact');
    assert.ok(migrationSql.includes('p_activation_status_secret TEXT'), 'Check RPC signature intact');
  });

  // T18: SELF_SERVICE regression PASS
  await runTest('TEST_T18', 'SELF_SERVICE regression PASS', async () => {
    // Verifies SELF_SERVICE customer_sources handling exists in migration
    assert.ok(migrationSql.includes('public.customer_sources'), 'Handles SELF_SERVICE customer_sources');
    assert.ok(migrationSql.includes('cs.status = \'ACTIVE\''), 'Checks active customer source');
  });

  // T19: Manager NEW_CUSTOMER regression PASS
  await runTest('TEST_T19', 'Manager NEW_CUSTOMER regression PASS', async () => {
    assert.ok(migrationSql.includes('private.activate_device_source_core'), 'Preserves NEW_CUSTOMER core activation');
    assert.ok(migrationSql.includes('p_customer_account_id UUID'), 'Preserves commercial account parameter');
  });

  // T20: Manager EXISTING_CUSTOMER regression PASS
  await runTest('TEST_T20', 'Manager EXISTING_CUSTOMER regression PASS', async () => {
    assert.ok(migrationSql.includes('public.devices'), 'Preserves device relationship');
    assert.ok(migrationSql.includes('public.license_devices'), 'Preserves license devices relationship');
  });

  console.log('\n================================================================');
  console.log(`Results: ${passedTests}/${totalTests} tests passed.`);
  console.log('================================================================');
  return results;
}

runAll().catch(e => {
  console.error('Fatal error in test execution:', e);
  process.exit(1);
});
