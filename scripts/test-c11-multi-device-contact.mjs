import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(relative, overrides = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(new URL('../' + relative, import.meta.url), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  vm.runInNewContext(code, { exports, require: () => ({ getSupabaseBrowserClient: () => undefined }), AbortController, setTimeout, clearTimeout, ...overrides });
  return exports;
}
const { MultiDeviceContactService, normalizeWhatsapp, whatsappContactUrl } = load('src/control-plane/client/multi-device-contact.service.ts');
const { buildActivationDiagnostics } = load('src/ui/activation/activation-diagnostics.ts');
let passed = 0;
async function test(name, body) { await body(); passed++; console.log('PASS ' + name); }

await test('PUBLIC_READ_EXPLICIT_RPC_AND_OUTPUT_ALLOWLIST', async () => {
  const calls = [];
  const service = new MultiDeviceContactService({ rpc: (name, params) => {
    calls.push([name, params]); return Promise.resolve({ data: { success: true, whatsapp: '15555550100', token: 'synthetic-secret', sourceConfig: { password: 'synthetic-secret' } } });
  } });
  const result = await service.readPublic();
  assert.equal(JSON.stringify(result), '{"whatsapp":"15555550100"}');
  assert.equal(calls[0][0], 'rpc_public_get_multi_device_contact');
  assert.equal(JSON.stringify(calls[0][1]), '{}');
  assert.equal(whatsappContactUrl(result), 'https://wa.me/15555550100');
});
await test('NO_CONTACT_NO_PLACEHOLDER_OR_LINK', async () => {
  const result = await new MultiDeviceContactService({ rpc: () => Promise.resolve({ data: { success: true, whatsapp: '' } }) }).readPublic();
  assert.equal(whatsappContactUrl(result), null);
  assert.equal(whatsappContactUrl({ whatsapp: 'javascript:alert(1)' }), null);
});
await test('MASTER_WRITE_NORMALIZES_NUMBER_ONLY_AND_EMPTY_REMOVAL', async () => {
  const calls = [];
  const service = new MultiDeviceContactService({ rpc: (name, params) => {
    calls.push([name, params]); return Promise.resolve({ data: { success: true, whatsapp: params.p_whatsapp } });
  } });
  assert.equal((await service.saveForMaster('+1 (555) 555-0100')).whatsapp, '15555550100');
  assert.equal(calls[0][0], 'rpc_manager_set_multi_device_contact');
  assert.equal(JSON.stringify(calls[0][1]), '{"p_whatsapp":"15555550100"}');
  assert.equal((await service.saveForMaster('')).whatsapp, '');
});
await test('INVALID_NUMBER_NEVER_WRITES_REMOTE', () => {
  let calls = 0;
  const service = new MultiDeviceContactService({ rpc: () => { calls++; throw new Error('should not write'); } });
  for (const number of ['123', '0555555555', '1555555555555555', 'https://wa.me/15555550100', '5551234e2', '<script>']) assert.throws(() => service.saveForMaster(number), /INVALID_WHATSAPP/);
  assert.equal(calls, 0);
  assert.equal(normalizeWhatsapp('   '), '');
});
await test('ADMIN_OR_SIGNED_OUT_DENIAL_FAILS_CLOSED', async () => {
  for (const message of ['MASTER_MANAGER_NOT_AUTHORIZED', 'MANAGER_AUTH_REQUIRED']) {
    const service = new MultiDeviceContactService({ rpc: () => Promise.resolve({ data: null, error: { message } }) });
    await assert.rejects(service.readForMaster(), /MASTER_MANAGER_NOT_AUTHORIZED/);
    await assert.rejects(service.saveForMaster('15555550100'), /MASTER_MANAGER_NOT_AUTHORIZED/);
  }
});
await test('MALFORMED_REMOTE_CONTACT_AND_PRIVATE_ERROR_SANITIZED', async () => {
  for (const response of [{ data: { success: false, whatsapp: '15555550100' } }, { data: { success: true, whatsapp: 'https://secret' } }, { data: null, error: { message: 'synthetic-secret' } }]) {
    await assert.rejects(new MultiDeviceContactService({ rpc: () => Promise.resolve(response) }).readPublic(), /^Error: CONTACT_UNAVAILABLE$/);
  }
  await assert.rejects(new MultiDeviceContactService(undefined).readPublic(), /CONTACT_UNAVAILABLE/);
});
await test('HUNG_REQUEST_BOUNDED_AND_TRANSPORT_ABORTED', async () => {
  let signal;
  const hung = new Promise(() => {}); hung.abortSignal = value => { signal = value; return hung; };
  await assert.rejects(new MultiDeviceContactService({ rpc: () => hung }, 15).readPublic(), /CONTACT_UNAVAILABLE/);
  assert.equal(signal.aborted, true);
});
await test('UNMOUNT_CANCELS_AND_PREABORT_MAKES_NO_CALL', async () => {
  let calls = 0, signal;
  const hung = new Promise(() => {}); hung.abortSignal = value => { signal = value; return hung; };
  const service = new MultiDeviceContactService({ rpc: () => { calls++; return hung; } });
  const controller = new AbortController();
  const request = service.readPublic(controller.signal); controller.abort();
  await assert.rejects(request, /CONTACT_UNAVAILABLE/); assert.equal(signal.aborted, true);
  const before = calls; await assert.rejects(service.readPublic(controller.signal), /CONTACT_UNAVAILABLE/); assert.equal(calls, before);
});
await test('DIAGNOSTICS_INCLUDE_AUTHORIZATION_AND_EXCLUDE_ALL_PRIVATE_DATA', () => {
  const secret = 'synthetic-private-canary';
  const input = {
    displayCode: 'XF-TEST-0001', effectiveStatus: 'AUTHORIZED', mode: 'MANAGED', localKeyState: 'READY', sourceConfigured: true, deviceId: secret,
    deviceActivationKey: '123456', deviceAuthToken: secret, statusMessage: secret, sourceConfig: { username: secret, password: secret, playlistUrl: 'https://private.example/' },
    authPreflight: { deviceId: secret, localActivationDeviceIdMatch: 'SIM', importPreflightStatus: 'SOURCE_READY', localDeviceAuthTokenPresent: 'SIM', remoteAuthorityAvailable: 'SIM', remoteResultCode: 'SOURCE_READY', licenseAuth: 'PASS', bindingAuth: 'PASS', sourceAuth: 'PASS', token: secret },
    deliveryAck: { deliveryResult: 'STORED', sourceId: 'src_test001', sourceVersion: 2, protocol: 'M3U', sourceConfig: { password: secret } },
    deliveryErrorCode: null, catalogImportResult: { playlistFetchSuccess: true, rawItemCount: 42, normalizedItemCount: 40, invalidItemCount: 2, localCatalogWriteExecuted: true, activeSnapshotPromoted: true, catalogReady: true, transport: { webviewOrigin: secret } }, managedStagingResult: null,
  };
  const text = buildActivationDiagnostics(input);
  for (const token of ['AUTH_UI_STATE=AUTHORIZED', 'LICENSE_AUTHORIZATION=PASS', 'SOURCE_ID=src_test001', 'RAW_ITEM_COUNT=42']) assert.ok(text.includes(token));
  for (const token of [secret, '123456', 'https://', 'password', 'username', 'deviceAuthToken']) assert.ok(!text.includes(token));
  input.authPreflight.remoteResultCode = secret; input.deliveryAck.sourceId = secret;
  const hostile = buildActivationDiagnostics(input); assert.ok(!hostile.includes(secret)); assert.ok(hostile.includes('AUTH_REMOTE_RESULT_CODE=UNKNOWN'));
});
console.log(`C11_MULTI_DEVICE_CONTACT_TESTS=${passed}/${passed}_PASS; NO_LIVE_WRITES`);
