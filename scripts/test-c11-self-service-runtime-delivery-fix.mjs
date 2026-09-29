import assert from 'node:assert/strict';
import {
  DeviceSourceDeliveryDispatcher,
  DeviceSourceDeliveryError,
} from '../src/security/device-source-delivery-dispatcher.ts';
import { reconcileAuthorizedActivationState } from '../src/device/authorization-reconciliation.ts';

const baseActivation = {
  deviceId: 'device-test',
  displayCode: 'XF-TEST-0001',
  deviceType: 'TABLET',
  deviceLabel: 'Tablet de teste',
  status: 'AUTHORIZED',
  deviceAuthToken: 'synthetic-device-token',
  licenseId: 'license-test',
  licenseMode: 'SELF_SERVICE',
  licenseStatus: 'TRIAL',
};

function createDispatcher(calls) {
  return new DeviceSourceDeliveryDispatcher({
    selfService: {
      async resolveAndStoreSource() {
        calls.selfService += 1;
        return { success: true, sourceId: 'source-self', sourceVersion: 3, protocol: 'M3U' };
      },
    },
    managed: {
      async deliver() {
        calls.managed += 1;
        return { deliveryResult: 'STORED', sourceId: 'source-managed', sourceVersion: 7, protocol: 'XTREAM' };
      },
    },
  });
}

async function expectCode(promise, code) {
  await assert.rejects(promise, (error) => {
    assert(error instanceof DeviceSourceDeliveryError);
    assert.equal(error.code, code);
    return true;
  });
}

// A: SELF_SERVICE usa somente sua boundary.
{
  const calls = { selfService: 0, managed: 0 };
  const ack = await createDispatcher(calls).deliver(baseActivation);
  assert.equal(ack.mode, 'SELF_SERVICE');
  assert.equal(calls.selfService, 1);
  assert.equal(calls.managed, 0);
}

// B: MANAGED usa somente o cofre gerenciado.
{
  const calls = { selfService: 0, managed: 0 };
  const ack = await createDispatcher(calls).deliver({ ...baseActivation, licenseMode: 'MANAGED' });
  assert.equal(ack.mode, 'MANAGED');
  assert.equal(calls.selfService, 0);
  assert.equal(calls.managed, 1);
}

// C: SELF_SERVICE sem licenseId falha fechado, sem fallback silencioso.
{
  const calls = { selfService: 0, managed: 0 };
  await expectCode(
    createDispatcher(calls).deliver({ ...baseActivation, licenseId: undefined }),
    'SELF_SERVICE_LICENSE_ID_MISSING',
  );
  assert.deepEqual(calls, { selfService: 0, managed: 0 });
}

// D: reconciliação preserva licenseId, mode e status retornados/conhecidos.
{
  const state = reconcileAuthorizedActivationState({
    identity: {
      deviceId: 'device-test',
      displayCode: 'XF-TEST-0001',
      deviceType: 'TABLET',
      deviceLabel: 'Tablet de teste',
      createdAtIso: '2026-09-22T00:00:00.000Z',
    },
    deviceAuthToken: 'synthetic-device-token',
    metadata: { status: 'SOURCE_READY', mode: 'SELF_SERVICE', licenseId: 'license-preserved', licenseStatus: 'TRIAL' },
    previousState: null,
  });
  assert.equal(state?.licenseId, 'license-preserved');
  assert.equal(state?.licenseMode, 'SELF_SERVICE');
  assert.equal(state?.licenseStatus, 'TRIAL');
}

// E: regressão do caminho MANAGED continua entregando um ACK armazenado.
{
  const calls = { selfService: 0, managed: 0 };
  const ack = await createDispatcher(calls).deliver({ ...baseActivation, licenseMode: 'MANAGED' });
  assert.deepEqual(ack, {
    deliveryResult: 'STORED',
    sourceId: 'source-managed',
    sourceVersion: 7,
    protocol: 'XTREAM',
    mode: 'MANAGED',
  });
}

// F: modo ausente/desconhecido falha fechado.
{
  const calls = { selfService: 0, managed: 0 };
  await expectCode(
    createDispatcher(calls).deliver({ ...baseActivation, licenseMode: undefined }),
    'UNKNOWN_LICENSE_MODE',
  );
  assert.deepEqual(calls, { selfService: 0, managed: 0 });
}

console.log('PASS C11 SELF_SERVICE runtime delivery dispatch A-F');
