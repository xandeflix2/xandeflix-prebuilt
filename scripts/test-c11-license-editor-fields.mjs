import fs from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';
function compile(path, ports = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function('require', 'module', 'exports', code)(name => ports[name] ?? (() => { throw Error('Unexpected import ' + name); })(), module, module.exports);
  return module.exports;
}
const client = compile('src/control-plane/client/manager-remote-control-plane-authority.ts');
const Authority = client.SupabaseManagerRemoteControlPlaneAuthority;
const id = '11111111-1111-4111-8111-111111111111', customerId = '22222222-2222-4222-8222-222222222222';
const calls = []; let logged = true, error, response = { success: true };
const authority = new Authority({ auth: { getSession: async () => ({ data: { session: logged ? { user: { id } } : null } }) }, rpc: async (name, args) => {
  calls.push({ name, args }); return error ? { error: { code: 'P0001', message: error } } : { data: response };
} });
await authority.editLicenseCustomer(id, customerId, ' Novo cliente ', 'Anterior');
assert.deepEqual(calls.at(-1), { name: 'rpc_manager_edit_license_customer', args: { p_license_id: id, p_customer_id: customerId, p_name: 'Novo cliente', p_expected_name: 'Anterior' } });
for (const name of ['', 'a'.repeat(101), 'Test\nName']) { const n = calls.length; await assert.rejects(authority.editLicenseCustomer(id, customerId, name, 'Anterior')); assert.equal(calls.length, n); }
const input = { licenseId: id, displayCode: 'XF-AB12-CD34', label: 'Quarto', platform: 'ANDROID', deviceType: 'TV', expectedRole: 'PRIMARY', role: 'SECONDARY', primaryLicenseId: id, primaryCode: 'XF-EF56-GH78', slotNumber: 2, roleConfirmed: true,
  treePlan: { mode: 'MOVE_ALL', expectedChildren: ['XF-IJ90-KL12'] } };
await authority.editLicenseDevice(input);
assert.equal(calls.at(-1).name, 'rpc_manager_edit_license_device'); assert.deepEqual(calls.at(-1).args.p_tree_plan, input.treePlan);
assert.equal(calls.at(-1).args.p_expected_role, 'PRIMARY'); assert.equal(calls.at(-1).args.p_slot, 2);
for (const change of [{ label: '' }, { platform: 'spoof' }, { deviceType: 'fake' }, { role: 'fake' }, { slotNumber: 0 }, { slotNumber: 1.5 }, { slotNumber: 101 }, { primaryCode: input.displayCode }, { primaryLicenseId: '' }, { roleConfirmed: false }]) {
  const n = calls.length; await assert.rejects(authority.editLicenseDevice({ ...input, ...change })); assert.equal(calls.length, n);
}
const readonly = ['p_status', 'p_mode', 'p_created_at', 'p_last_seen_at', 'p_device_token', 'p_activation_key'];
assert(!readonly.some(field => Object.hasOwn(calls.at(-1).args, field)));
logged = false; const n = calls.length;
await assert.rejects(authority.editLicenseCustomer(id, customerId, 'Novo', 'Anterior'), /MANAGER_AUTH_REQUIRED/);
await assert.rejects(authority.editLicenseDevice(input), /MANAGER_AUTH_REQUIRED/); assert.equal(calls.length, n); logged = true;
const { managerActivationFailure } = compile('src/debug/manager/manager-activation-feedback.ts', { '../../control-plane/client/manager-remote-control-plane-authority.ts': client });
for (const code of ['CUSTOMER_NAME_CONFLICT', 'CUSTOMER_PROFILE_NAME_INVALID', 'CUSTOMER_NAME_ALREADY_USED', 'DEVICE_SLOT_OCCUPIED', 'DEVICE_SLOT_OUTSIDE_LIMIT', 'DEVICE_TREE_CHANGED', 'DEVICE_TREE_CONFIRMATION_REQUIRED']) {
  error = code; try { await authority.editLicenseDevice(input); assert.fail('Expected rejection'); } catch (cause) { assert.equal(cause.code, code); assert(!managerActivationFailure(cause).includes(code)); }
}
error = undefined;
const device = { deviceId: 'fixture', displayCode: input.displayCode, deviceLabel: 'Quarto', deviceType: 'TV', platform: 'WEBOS', status: 'AUTHORIZED', boundAt: '2026-10-10', deviceRole: 'SECONDARY', primaryDisplayCode: input.primaryCode, licenseBindingStatus: 'ACTIVE', slotNumber: 2,
  sourceLinks: [{ sourceId: 'src_fixture', name: 'Fonte de teste', deviceCount: 3 }] };
const license = { licenseId: id, customerId, customerNickname: 'Novo cliente', mode: 'MANAGED', status: 'ACTIVE', maxDevices: 4, maxConcurrentSessions: 3, createdAt: '2026-10-10', activeDeviceCount: 3 };
response = [{ ...license, devices: [device] }];
assert.deepEqual((await authority.listLicenses())[0].devices[0].sourceLinks, device.sourceLinks);
assert.equal((await authority.listLicenses())[0].devices[0].slotNumber, 2);
response = { success: true, license, customer: { customerId, nickname: 'Novo cliente', status: 'ACTIVE' }, devices: [device], managedSources: [], customerSources: [] };
assert.equal((await authority.getLicenseDetail(id)).devices[0].slotNumber, 2);
assert.deepEqual((await authority.getLicenseDetail(id)).devices[0].sourceLinks, device.sourceLinks);
console.log('C83_REAL_AUTHORITY_RENAME_METADATA_TREE_READONLY_NORMALIZATION_SAFE_ERRORS_AUTH_PASS');
