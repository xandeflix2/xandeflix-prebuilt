import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createHash, webcrypto } from 'node:crypto';
import ts from 'typescript';

// Node crypto belongs exclusively to this test oracle, never the app bundle.
const hash = (value) => createHash('sha256').update(value).digest('hex');
const never = () => new Promise(() => {});
let passed = 0;
async function test(name, run) {
  await run();
  console.log(`PASS ${name}`);
  passed++;
}

function harness(options = {}) {
  const files = options.files || new Map();
  const storage = options.storage || new Map();
  const writes = [];
  const calls = [];
  const flags = { readHang: false, writeFail: false, storageFail: false, ...options.flags };
  let pendingStatus = 'PENDING';
  let remoteSuccess = true;
  let registerSuccess = true;
  let reportHang = false;
  const localStorage = {
    getItem(key) { if (flags.storageFail) throw new Error('STORAGE_UNAVAILABLE'); return storage.get(key) ?? null; },
    setItem(key, value) { if (flags.storageFail) throw new Error('STORAGE_UNAVAILABLE'); storage.set(key, value); },
    removeItem(key) { storage.delete(key); },
  };
  const filesystem = {
    async readFile({ path }) {
      if (flags.readHang) return never();
      if (flags.readDenied) throw Object.assign(new Error('Read permission denied'), { code: 'OS-PLUG-FILE-0007' });
      if (!files.has(path)) throw new Error('File does not exist');
      return { data: files.get(path) };
    },
    async writeFile({ path, data }) {
      writes.push({ path, data });
      if (flags.writeFail) throw new Error('WRITE_FAILED');
      files.set(path, data);
      return { uri: path };
    },
    async deleteFile({ path }) { files.delete(path); },
  };
  const client = {
    rpc(name, params) {
      return { abortSignal() {
        calls.push({ name, params });
        if (name === 'rpc_report_app_installation' && reportHang) return never();
        if (!remoteSuccess) return Promise.resolve({ data: null, error: { code: 'OFFLINE', message: 'Offline fixture' } });
        let data;
        if (name === 'rpc_report_app_installation') data = { success: true };
        if (name === 'rpc_request_device_activation') {
          const key = storage.get('__xandeflix_device_activation_key__');
          assert.equal(params.p_activation_key_hash, hash(key));
          assert.match(params.p_device_token_hash, /^[a-f0-9]{64}$/);
          data = { success: true, activationId: 'fixture-activation', activationStatusSecret: 'fixture-status-capability' };
        }
        if (name === 'rpc_check_device_activation_status') data = {
          success: true, status: pendingStatus, licenseStatus: 'ACTIVE', licenseId: 'fixture-license',
        };
        return Promise.resolve({ data, error: null });
      } };
    },
    functions: { async invoke(name, { body }) {
      calls.push({ name, operation: body.operation });
      assert.equal(body.activationKey, storage.get('__xandeflix_device_activation_key__'));
      assert.equal(body.displayCode, JSON.parse(storage.get('__xandeflix_device_identity__')).displayCode);
      return { data: { success: registerSuccess }, error: null };
    } },
  };
  const cache = new Map();
  const context = vm.createContext({
    Uint8Array, Uint32Array, TextEncoder, Date, Math, Map, Promise, Error, AbortController,
    crypto: options.crypto === undefined ? webcrypto : options.crypto,
    window: { localStorage, dispatchEvent() {} }, CustomEvent: class {},
    navigator: { userAgent: 'Android Mobile' },
    // Short deterministic deadlines for failure tests only; production keeps 4s/12s.
    setTimeout: (fn, ms) => setTimeout(fn, Math.min(ms, 30)), clearTimeout,
  });
  function load(file) {
    if (cache.has(file)) return cache.get(file);
    const source = fs.readFileSync(file, 'utf8');
    const code = ts.transpileModule(source, { compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
    } }).outputText;
    const exports = {};
    cache.set(file, exports);
    const require = (specifier) => {
      if (specifier === '@capacitor/filesystem') return { Filesystem: filesystem, Directory: { Data: 'DATA' }, Encoding: { UTF8: 'utf8' } };
      if (specifier === '@capacitor/core') return { Capacitor: { isNativePlatform: () => true } };
      if (specifier.endsWith('/supabase/client.ts')) return {
        getSupabaseBrowserClient: () => client, parseSanitizedFunctionError: async () => ({ code: 'REMOTE_ERROR' }),
      };
      if (specifier === './device-pairing.service.ts') return { getDevicePairingService: () => ({ getOrCreateDeviceToken: () => identity.getOrCreateDeviceAuthToken() }) };
      if (specifier === './control-plane-client.ts') return { getControlPlaneClient: () => ({ resolveSource: async () => ({ mode: 'SELF_SERVICE' }) }) };
      const resolved = new URL(specifier, new URL(file, `file:///${process.cwd().replaceAll('\\', '/')}/`));
      return load(decodeURIComponent(resolved.pathname).replace(/^\/(\w:)/, '$1'));
    };
    const execute = vm.runInContext(`(function(exports, require) { ${code}\n })`, context, { filename: file });
    execute(exports, require);
    return exports;
  }
  const identity = load('src/device/device-identity.service.ts').DeviceIdentityService;
  const sync = load('src/control-plane/client/device-activation-sync.service.ts');
  const service = load('src/control-plane/client/device-activation.service.ts').getDeviceActivationService();
  return {
    identity, sync, service, files, storage, writes, calls, flags,
    setRemote(success) { remoteSuccess = success; },
    setRegister(success) { registerSuccess = success; },
    setStatus(status) { pendingStatus = status; },
    hangReport() { reportHang = true; },
  };
}

for (const [name, crypto] of [
  ['native', webcrypto], ['absent', {}],
  ['rejected', { subtle: { digest: async () => { throw new Error('OperationError'); } } }],
  ['stalled', { subtle: { digest: never } }],
]) await test(`SHA256_${name}`, async () => {
  const h = harness({ crypto });
  for (const vector of ['', 'abc', '123456', 'ç漢😀', '\ud800', 'a'.repeat(1000)]) {
    assert.equal(await h.identity.computeSha256(vector), hash(vector));
  }
});

await test('CONCURRENT_LOCAL_VALUES_AND_RELOAD_STABLE', async () => {
  const h = harness();
  const requests = Array.from({ length: 24 }, () => Promise.all([
    h.identity.getOrCreateIdentity(), h.identity.getOrCreateInstallationIdentity(),
    h.identity.getOrCreateDeviceActivationKey(), h.identity.getOrCreateDeviceAuthToken(),
  ]));
  const rows = await Promise.all(requests);
  for (const row of rows) assert.equal(JSON.stringify(row), JSON.stringify(rows[0]));
  assert.match(rows[0][0].displayCode, /^XF-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  assert.match(rows[0][2].rawActivationKey, /^\d{6}$/);
  assert.equal(rows[0][2].activationKeyHash, hash(rows[0][2].rawActivationKey));
  for (const path of ['device_identity.json', 'app_installation.json', 'device_activation_key.json', 'pending_device_token.json']) {
    assert.equal(h.writes.filter((write) => write.path === path).length, 1);
  }
  const reboot = harness({ files: h.files, storage: h.storage });
  const next = await Promise.all([reboot.identity.getOrCreateIdentity(), reboot.identity.getOrCreateInstallationIdentity(),
    reboot.identity.getOrCreateDeviceActivationKey(), reboot.identity.getOrCreateDeviceAuthToken()]);
  assert.equal(JSON.stringify(next), JSON.stringify(rows[0]));
});

await test('TWO_CLEAN_DEVICES_ISOLATED_ACTIVATION_AND_RELOAD', async () => {
  function deviceCrypto(seed) {
    let sequence = 0;
    return {
      subtle: webcrypto.subtle,
      randomUUID: () => `${String(seed).padStart(8, '0')}-0000-4000-8000-${String(++sequence).padStart(12, '0')}`,
      getRandomValues(array) { for (let i = 0; i < array.length; i++) array[i] = seed + i; return array; },
    };
  }
  const devices = [harness({ crypto: deviceCrypto(11) }), harness({ crypto: deviceCrypto(22) })];
  const rows = await Promise.all(devices.map(async (h) => {
    const identity = await h.identity.getOrCreateIdentity();
    const installation = await h.identity.getOrCreateInstallationIdentity();
    const key = await h.identity.getOrCreateDeviceActivationKey();
    const token = await h.identity.getOrCreateDeviceAuthToken();
    assert.equal(await h.sync.ensurePendingDeviceActivationRequest(), true);
    h.setStatus('CONSUMED');
    const activation = await h.sync.syncPendingDeviceActivation();
    assert.equal(activation.status, 'AUTHORIZED');
    assert.equal(activation.deviceId, identity.deviceId);
    const reboot = harness({ files: h.files, storage: h.storage });
    assert.equal((await reboot.identity.loadActivationState()).status, 'AUTHORIZED');
    assert.equal(await reboot.sync.ensurePendingDeviceActivationRequest(), false);
    assert.equal(JSON.stringify(await reboot.identity.getOrCreateIdentity()), JSON.stringify(identity));
    assert.equal(JSON.stringify(await reboot.identity.getOrCreateDeviceActivationKey()), JSON.stringify(key));
    assert.equal(JSON.stringify(await reboot.identity.getOrCreateInstallationIdentity()), JSON.stringify(installation));
    assert.equal(JSON.stringify(await reboot.identity.getOrCreateDeviceAuthToken()), JSON.stringify(token));
    assert.equal(reboot.calls.length, 0);
    return { identity, installation, key, token };
  }));
  assert.notEqual(rows[0].identity.deviceId, rows[1].identity.deviceId);
  assert.notEqual(rows[0].identity.displayCode, rows[1].identity.displayCode);
  assert.notEqual(JSON.stringify(rows[0].installation), JSON.stringify(rows[1].installation));
  assert.notEqual(rows[0].key.rawActivationKey, rows[1].key.rawActivationKey);
  assert.notEqual(rows[0].token.rawDeviceToken, rows[1].token.rawDeviceToken);
  assert.notEqual(rows[0].token.deviceTokenHash, rows[1].token.deviceTokenHash);
  assert.notEqual(devices[0].files, devices[1].files);
  assert.notEqual(devices[0].storage, devices[1].storage);
});

await test('OFFLINE_STILL_GENERATES_LOCAL_KEY', async () => {
  const h = harness(); h.setRemote(false);
  assert.equal(await h.sync.ensurePendingDeviceActivationRequest(), false);
  const key = await h.identity.getOrCreateDeviceActivationKey();
  assert.match(key.rawActivationKey, /^\d{6}$/);
  assert.equal(h.service.getPendingActivation(), null);
  assert.equal(await h.identity.loadActivationState(), null);
});

await test('NATIVE_FAILURE_LOCALSTORAGE_VERIFIED', async () => {
  const h = harness({ flags: { writeFail: true } });
  const key = await h.identity.getOrCreateDeviceActivationKey();
  assert.equal(h.storage.get('__xandeflix_device_activation_key__'), key.rawActivationKey);
});

await test('LOCALSTORAGE_FAILURE_NATIVE_VERIFIED', async () => {
  const h = harness({ flags: { storageFail: true } });
  const key = await h.identity.getOrCreateDeviceActivationKey();
  assert.equal(h.files.get('device_activation_key.json'), key.rawActivationKey);
});

await test('FAILED_PERSISTENCE_RETRY_DOES_NOT_ROTATE', async () => {
  const h = harness({ flags: { writeFail: true, storageFail: true } });
  await assert.rejects(h.identity.getOrCreateDeviceActivationKey(), /PERSISTENCE_FAILED/);
  const candidate = h.writes.find((write) => write.path === 'device_activation_key.json').data;
  h.flags.writeFail = false;
  const retry = await h.identity.getOrCreateDeviceActivationKey();
  assert.equal(retry.rawActivationKey, candidate);
});

await test('HUNG_READ_NEVER_OVERWRITES_UNKNOWN_KEY', async () => {
  const h = harness({ flags: { readHang: true } });
  await assert.rejects(h.identity.getOrCreateDeviceActivationKey(), /LOCAL_STORAGE_TIMEOUT/);
  assert.equal(h.writes.length, 0);
  h.flags.readHang = false;
  assert.match((await h.identity.getOrCreateDeviceActivationKey()).rawActivationKey, /^\d{6}$/);
});

await test('HUNG_READ_USES_EXISTING_LOCAL_COPY', async () => {
  const storage = new Map([['__xandeflix_device_activation_key__', '123456']]);
  const h = harness({ storage, flags: { readHang: true } });
  assert.equal((await h.identity.getOrCreateDeviceActivationKey()).rawActivationKey, '123456');
  assert.equal(h.writes.length, 0);
});

await test('DENIED_READ_IS_NOT_ABSENT_AND_NEVER_ROTATES', async () => {
  const files = new Map([['device_activation_key.json', '123456']]);
  const h = harness({ files, flags: { readDenied: true } });
  await assert.rejects(h.identity.getOrCreateDeviceActivationKey(), /LOCAL_STORAGE_READ_FAILED/);
  assert.equal(h.writes.length, 0);
  h.flags.readDenied = false;
  assert.equal((await h.identity.getOrCreateDeviceActivationKey()).rawActivationKey, '123456');
});

await test('EXISTING_NATIVE_KEY_READ_ONLY_PRESERVED', async () => {
  const files = new Map([['device_activation_key.json', '123456']]);
  const h = harness({ files, flags: { writeFail: true, storageFail: true } });
  assert.equal((await h.identity.getOrCreateDeviceActivationKey()).rawActivationKey, '123456');
  assert.equal(h.writes.length, 0);
});

await test('BOOT_AND_UI_SHARE_ONE_A1_REQUEST_AND_PORTAL_HASH', async () => {
  const h = harness();
  assert.ok((await Promise.all(Array.from({ length: 20 }, () => h.sync.ensurePendingDeviceActivationRequest()))).every(Boolean));
  assert.equal(h.calls.filter((call) => call.name === 'rpc_request_device_activation').length, 1);
  assert.equal(h.calls.filter((call) => call.operation === 'REGISTER_KEY').length, 1);
});

await test('INDETERMINATE_STATUS_PRESERVES_PENDING_SESSION', async () => {
  const h = harness(); await h.sync.ensurePendingDeviceActivationRequest();
  const before = JSON.stringify(h.service.getPendingActivation());
  h.setRemote(false);
  assert.equal(await h.sync.ensurePendingDeviceActivationRequest(), false);
  assert.equal(JSON.stringify(h.service.getPendingActivation()), before);
  assert.equal(h.calls.filter((call) => call.name === 'rpc_request_device_activation').length, 1);
});

await test('FAILED_REGISTER_IS_NOT_READY_AND_RETRY_REUSES_SESSION', async () => {
  const h = harness(); h.setRegister(false);
  assert.equal(await h.sync.ensurePendingDeviceActivationRequest(), false);
  h.setRegister(true);
  assert.equal(await h.sync.ensurePendingDeviceActivationRequest(), true);
  assert.equal(h.calls.filter((call) => call.name === 'rpc_request_device_activation').length, 1);
});

await test('HUNG_REPORT_IS_BOUNDED_LOCAL_KEY_REMAINS_READY', async () => {
  const h = harness(); h.hangReport();
  assert.equal(await h.sync.ensurePendingDeviceActivationRequest(), false);
  assert.match((await h.identity.getOrCreateDeviceActivationKey()).rawActivationKey, /^\d{6}$/);
  assert.equal(h.calls.filter((call) => call.name === 'rpc_request_device_activation').length, 0);
});

await test('AUTHORIZED_STATE_PRESERVED_NO_NEW_REQUEST', async () => {
  const h = harness(); await h.sync.ensurePendingDeviceActivationRequest();
  h.setStatus('CONSUMED');
  const state = await h.sync.syncPendingDeviceActivation();
  assert.equal(state.status, 'AUTHORIZED');
  assert.equal(h.service.getPendingActivation(), null);
  assert.equal(await h.sync.ensurePendingDeviceActivationRequest(), false);
  assert.equal(h.calls.filter((call) => call.name === 'rpc_request_device_activation').length, 1);
});

await test('CLEAN_BOOT_IDLES_WITHOUT_SOURCE_LOOKUP_OR_LICENSE_ERROR', async () => {
  const { BootSyncCoordinator } = await import('../src/bootstrap/boot-sync-coordinator.ts');
  let sourceCalls = 0;
  const coordinator = new BootSyncCoordinator({
    sourceResolver: async () => { sourceCalls++; throw new Error('Must not resolve'); },
  });
  const result = await coordinator.coordinateBootSync();
  assert.equal(result.syncState, 'IDLE');
  assert.equal(result.error, undefined);
  assert.equal(sourceCalls, 0);
});

await test('BACKUP_EXCLUDES_IDENTITY_AND_WEBVIEW_COPIES', async () => {
  const manifest = fs.readFileSync('android/app/src/main/AndroidManifest.xml', 'utf8');
  assert.ok(manifest.includes('android:fullBackupContent="@xml/backup_rules"'));
  assert.ok(manifest.includes('android:dataExtractionRules="@xml/data_extraction_rules"'));
  for (const file of ['backup_rules', 'data_extraction_rules']) {
    const rules = fs.readFileSync(`android/app/src/main/res/xml/${file}.xml`, 'utf8');
    for (const path of ['device_identity.json', 'app_installation.json', 'device_activation_key.json',
      'device_activation.json', 'pending_device_token.json', 'app_webview']) assert.ok(rules.includes(`path="${path}"`));
  }
});

await test('AUTHORIZED_BOOT_STILL_RESOLVES_AND_PRESERVES_REAL_CATALOG', async () => {
  const { BootSyncCoordinator } = await import('../src/bootstrap/boot-sync-coordinator.ts');
  const identity = { deviceId: 'fixture-device', displayCode: 'XF-ABCD-EFGH', deviceType: 'PHONE', deviceLabel: 'Test' };
  const activation = { ...identity, status: 'AUTHORIZED', deviceAuthToken: 'fixture-auth-token',
    licenseId: 'fixture-license', licenseStatus: 'ACTIVE', licenseMode: 'SELF_SERVICE' };
  const pointer = { kind: 'REAL', snapshotId: 'fixture-snapshot', sourceId: 'fixture-source', sourceVersion: 1,
    catalogVersion: 'fixture-v1', schemaVersion: 1, packageContentHash: 'a'.repeat(64),
    promotedAt: '2026-10-03T00:00:00Z' };
  let sourceCalls = 0;
  const coordinator = new BootSyncCoordinator({
    deviceContext: { getOrCreateIdentity: async () => identity, loadActivationState: async () => activation },
    bootstrapService: {
      getActivePointer: async () => pointer,
      getStorage: () => ({ hasActiveCatalog: async () => true,
        readActiveManifest: async () => ({ metadata: { classificationProfileVersion: 2 } }) }),
    },
    sourceResolver: async () => { sourceCalls++; return { status: 'SOURCE_READY', mode: 'SELF_SERVICE',
      licenseId: 'fixture-license', licenseStatus: 'ACTIVE', sourceId: pointer.sourceId, sourceVersion: 1 }; },
    searchBuilder: async () => ({ success: true }),
  });
  const result = await coordinator.coordinateBootSync();
  assert.equal(sourceCalls, 1);
  assert.equal(result.outcome, 'NO_OP');
  assert.equal(result.snapshotId, pointer.snapshotId);
});

console.log(`RESULT=${passed}_TESTS_PASSED (isolated mocks; no live backend writes)`);
