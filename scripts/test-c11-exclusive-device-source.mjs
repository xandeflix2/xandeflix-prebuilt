import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createExclusiveSourceReplacement } from '../src/debug/manager/exclusive-device-source.ts';

const target = { customerId: 'customer-synthetic', nickname: 'Cliente sintético', deviceId: 'device-a', displayCode: 'XF-TEST-0001', licenseId: 'license-a' };
const input = { name: 'Nova fonte sintética', playlistUrl: 'https://source.synthetic.invalid/new.m3u?token=not-real', confirmed: true };
function fixture() {
  const detail = {
    success: true, customer: { customerId: target.customerId, nickname: target.nickname, status: 'ACTIVE' },
    licenses: [{ licenseId: 'license-a', mode: 'MANAGED', status: 'ACTIVE', expiresAt: null }],
    devices: [{ ...target, status: 'AUTHORIZED' }], sources: [],
  };
  const snapshot = {
    licenses: [{ id: 'license-a', mode: 'MANAGED', status: 'ACTIVE' }], devices: [target, { deviceId: 'device-b', displayCode: 'XF-TEST-0002' }].map(d => ({ ...d, status: 'AUTHORIZED' })),
    licenseBindings: [{ deviceId: 'device-a', licenseId: 'license-a', status: 'ACTIVE' }, { deviceId: 'device-b', licenseId: 'license-b', status: 'ACTIVE' }],
    managedSources: [{ sourceId: 'src_shared', version: 1, status: 'ACTIVE', vaultStatus: 'CONFIGURED' }],
    sourceBindings: [{ deviceId: 'device-a', licenseId: 'license-a', sourceId: 'src_shared' }, { deviceId: 'device-b', licenseId: 'license-b', sourceId: 'src_shared' }],
  };
  const calls = { created: 0, switched: 0, prepared: 0 };
  const api = {
    auth: { getSession: async () => ({ userId: 'manager-synthetic' }) },
    getCustomerDetail: async id => { assert.equal(id, target.customerId); return structuredClone(detail); },
    readControlPlane: async () => structuredClone(snapshot),
    createManagedSourceWithConfig: async request => {
      calls.created++;
      assert.deepEqual(request, { name: input.name, protocol: 'M3U', sourceConfig: { playlistUrl: input.playlistUrl } });
      snapshot.managedSources.push({ sourceId: 'src_exclusive', version: 1, status: 'ACTIVE', vaultStatus: 'CONFIGURED' });
      return { success: true, sourceId: 'src_exclusive' };
    },
    switchDeviceSource: async (deviceId, sourceId) => {
      calls.switched++;
      assert.equal(deviceId, target.deviceId); assert.equal(sourceId, 'src_exclusive');
      snapshot.sourceBindings.find(b => b.deviceId === deviceId).sourceId = sourceId;
      return { success: true, previousSourceId: 'src_shared', newSourceId: sourceId };
    },
  };
  const flow = createExclusiveSourceReplacement(api, target);
  const run = overrides => flow.apply({ ...input, ...overrides }, () => { calls.prepared++; });
  return { detail, snapshot, calls, api, flow, run };
}
let passed = 0;
async function test(name, fn) { await fn(); passed++; console.log(`PASS ${name}`); }

await test('creates new source; switches only target; preserves shared source/license/identity', async () => {
  const f = fixture();
  const before = structuredClone({ source: f.snapshot.managedSources[0], other: f.snapshot.sourceBindings[1], devices: f.snapshot.devices, licenses: f.snapshot.licenseBindings });
  assert.deepEqual(await f.run(), { sourceId: 'src_exclusive', displayCode: target.displayCode });
  assert.deepEqual({ source: f.snapshot.managedSources[0], other: f.snapshot.sourceBindings[1], devices: f.snapshot.devices, licenses: f.snapshot.licenseBindings }, before);
  assert.deepEqual(f.calls, { created: 1, switched: 1, prepared: 1 });
  await f.run({ playlistUrl: '', name: '' });
  assert.deepEqual(f.calls, { created: 1, switched: 1, prepared: 1 });
});
for (const [name, mutate] of [
  ['no session', f => { f.api.auth.getSession = async () => null; }],
  ['no remote customer authority', f => { delete f.api.getCustomerDetail; }],
  ['suspended customer', f => { f.detail.customer.status = 'SUSPENDED'; }],
  ['wrong customer', f => { f.detail.customer.customerId = 'other-customer'; }],
  ['self service license', f => { f.detail.licenses[0].mode = 'SELF_SERVICE'; }],
  ['expired license', f => { f.detail.licenses[0].expiresAt = '2020-01-01T00:00:00Z'; }],
  ['invalid expiry', f => { f.detail.licenses[0].expiresAt = 'invalid'; }],
  ['suspended license', f => { f.detail.licenses[0].status = 'SUSPENDED'; }],
  ['snapshot license revoked', f => { f.snapshot.licenses[0].status = 'REVOKED'; }],
  ['device revoked', f => { f.snapshot.devices[0].status = 'REVOKED'; }],
  ['device code mismatch', f => { f.snapshot.devices[0].displayCode = 'XF-TEST-0003'; }],
  ['foreign license binding', f => { f.snapshot.licenseBindings[0].licenseId = 'other-license'; }],
  ['foreign source binding', f => { f.snapshot.sourceBindings[0].licenseId = 'other-license'; }],
  ['no source binding', f => { f.snapshot.sourceBindings.shift(); }],
  ['ambiguous active licenses', f => { f.snapshot.licenseBindings.push({ ...f.snapshot.licenseBindings[0] }); }],
]) await test(`fail closed: ${name}`, async () => {
  const f = fixture(); mutate(f); await assert.rejects(f.run()); assert.equal(f.calls.created, 0); assert.equal(f.calls.switched, 0);
});
for (const overrides of [{ confirmed: false }, { name: '' }, { playlistUrl: '' }, { playlistUrl: 'file:///invalid.m3u' }]) {
  await test('input/confirmation rejected before requests', async () => {
    const f = fixture(); await assert.rejects(f.run(overrides)); assert.equal(f.calls.created, 0);
  });
}
await test('failed/ambiguous create: no switch, secret hidden, no automatic recreate', async () => {
  const f = fixture(); f.api.createManagedSourceWithConfig = async () => { f.calls.created++; throw new Error(input.playlistUrl); };
  await assert.rejects(f.run(), error => !error.message.includes(input.playlistUrl));
  await assert.rejects(f.run(), /Criação não confirmada/);
  assert.equal(f.flow.isCreationUnconfirmed(), true); assert.equal(f.calls.created, 1); assert.equal(f.calls.switched, 0);
});
await test('remote JSON null expiry means perpetual active license, not expired', async () => {
  const f = fixture(); f.snapshot.licenses[0].expiresAtIso = null;
  await f.run(); assert.equal(f.calls.switched, 1);
});
await test('failed switch retries prepared source, without URL or another create', async () => {
  const f = fixture(); const original = f.api.switchDeviceSource;
  f.api.switchDeviceSource = async () => { throw new Error(input.playlistUrl); };
  await assert.rejects(f.run(), /vínculo não confirmado/);
  assert.equal(f.snapshot.sourceBindings[0].sourceId, 'src_shared'); assert.equal(f.flow.hasPreparedSource(), true);
  f.api.switchDeviceSource = original; await f.run({ playlistUrl: '', name: '' });
  assert.equal(f.calls.created, 1); assert.equal(f.calls.switched, 1);
});
await test('lost switch reply: retry recognizes committed target without second switch', async () => {
  const f = fixture(); const original = f.api.switchDeviceSource;
  f.api.switchDeviceSource = async (...args) => { await original(...args); throw new Error('NETWORK'); };
  await assert.rejects(f.run()); await f.run({ playlistUrl: '' });
  assert.equal(f.calls.created, 1); assert.equal(f.calls.switched, 1);
});
await test('post-write verification outage: never claims success; retry verifies', async () => {
  const f = fixture(); const original = f.api.switchDeviceSource;
  const read = f.api.readControlPlane;
  f.api.switchDeviceSource = async (...args) => { const result = await original(...args); f.api.readControlPlane = async () => { throw new Error(input.playlistUrl); }; return result; };
  await assert.rejects(f.run(), /verificação indisponível/);
  f.api.readControlPlane = read; await f.run({ playlistUrl: '' }); assert.equal(f.calls.created, 1); assert.equal(f.calls.switched, 1);
});
await test('permission revoked after create: no switch; prepared ID retained', async () => {
  const f = fixture(); const original = f.api.createManagedSourceWithConfig;
  f.api.createManagedSourceWithConfig = async request => { const result = await original(request); f.api.auth.getSession = async () => null; return result; };
  await assert.rejects(f.run(), /Autentique/); assert.equal(f.calls.switched, 0); assert.equal(f.flow.hasPreparedSource(), true);
});
await test('new source shared/disabled/unconfigured: fail closed', async () => {
  for (const field of ['shared', 'disabled', 'unconfigured']) {
    const f = fixture(); const original = f.api.createManagedSourceWithConfig;
    f.api.createManagedSourceWithConfig = async request => {
      const result = await original(request);
      if (field === 'shared') f.snapshot.sourceBindings[1].sourceId = 'src_exclusive';
      if (field === 'disabled') f.snapshot.managedSources[1].status = 'DISABLED';
      if (field === 'unconfigured') f.snapshot.managedSources[1].vaultStatus = 'NOT_CONFIGURED';
      return result;
    };
    await assert.rejects(f.run(), /exclusivamente/); assert.equal(f.calls.switched, 0);
  }
});
await test('concurrent external binding change: no overwrite on retry', async () => {
  const f = fixture(); f.api.switchDeviceSource = async () => { throw new Error('NETWORK'); };
  await assert.rejects(f.run()); f.snapshot.sourceBindings[0].sourceId = 'src_third';
  await assert.rejects(f.run({ playlistUrl: '' }), /vínculo mudou/); assert.equal(f.calls.created, 1);
});
await test('wrong create ID or wrong switch reply is not success', async () => {
  const f = fixture(); f.api.createManagedSourceWithConfig = async () => ({ success: true, sourceId: 'src_shared' });
  await assert.rejects(f.run(), /Criação não confirmada/); assert.equal(f.calls.switched, 0);
  const g = fixture(); g.api.switchDeviceSource = async () => ({ success: true, newSourceId: 'src_wrong' });
  await assert.rejects(g.run(), /Vínculo não confirmado/);
});
await test('double click guarded synchronously', async () => {
  const f = fixture(); let release; f.api.auth.getSession = () => new Promise(resolve => { release = resolve; });
  const first = f.run(); await assert.rejects(f.run(), /andamento/);
  f.api.auth.getSession = async () => ({ userId: 'manager-synthetic' }); release({ userId: 'manager-synthetic' });
  await first; assert.equal(f.calls.created, 1); assert.equal(f.calls.switched, 1);
});
await test('UI wiring and footer invariants; no destructive/activation APIs in replacement', () => {
  const read = name => fs.readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');
  const workflow = read('src/debug/manager/exclusive-device-source.ts');
  assert.doesNotMatch(workflow, /updateManagedSourceConfig|unbindDeviceSource|activateSourceForDevice|localStorage|console\./);
  const header = read('src/ui/components/Header.tsx');
  const bottom = header.slice(header.indexOf('<nav className="mobile-bottom-nav"'));
  assert.equal((bottom.match(/className=\{`focusable-item mobile-nav-btn/g) || []).length, 4);
  assert.doesNotMatch(bottom, /onNavigate\('activation'\)|onNavigate\('home'\)/);
  assert.match(header, /currentView === 'home' && \([\s\S]*?header-activation-button/);
  assert.match(read('src/debug/manager/ManagerPanelPage.tsx'), /sourceAuthority=\{managerSession && managerRemote/);
});
console.log(`C11_EXCLUSIVE_DEVICE_SOURCE_TESTS=${passed}_PASS; mocks only, no live backend writes`);
