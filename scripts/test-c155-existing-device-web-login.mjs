import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { webcrypto, pbkdf2Sync, createHmac, createHash } from 'node:crypto';
import ts from 'typescript';

let tests = 0;
async function test(name, run) { await run(); tests++; console.log('PASS ' + name); }
function harness(globals = {}, imports = {}) {
  const context = vm.createContext({ crypto: webcrypto, TextEncoder, TextDecoder, Uint8Array, URL, Request, Response, AbortController, setTimeout, clearTimeout, setInterval, clearInterval, performance, console, ...globals });
  const cache = new Map();
  function load(file) {
    file = path.resolve(file); if (cache.has(file)) return cache.get(file);
    const exports = {}; cache.set(file, exports);
    const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
    const factory = vm.runInContext(`(function(require,exports,module){${source}\n})`, context);
    factory(id => {
      if (Object.hasOwn(imports, id)) return imports[id];
      if (id.endsWith('.css')) return {};
      if (id.startsWith('.')) return load(path.resolve(path.dirname(file), id));
      throw new Error('Unexpected import: ' + id);
    }, exports, { exports });
    return exports;
  }
  return { context, load };
}
const did = '00000000-0000-4000-8000-000000000155', sid = '00000000-0000-4000-8000-000000000156';
const token = 'xw1_' + 'ac'.repeat(32), salt = '12'.repeat(16), pin = '247193';
const serverRoot = 'synthetic-c155-server-root-only-for-isolated-tests';
const session = { success: true, sessionId: sid, sessionToken: token, ttlSeconds: 900, absoluteTtlSeconds: 28800,
  activation: { deviceId: did, displayCode: 'XF-TEST-0155', deviceType: 'PC', deviceLabel: 'Synthetic PC', status: 'AUTHORIZED', licenseId: sid, licenseMode: 'MANAGED', licenseStatus: 'ACTIVE' } };
const cryptoFunctions = harness().load('supabase/functions/web-device-access/crypto.ts');

await test('PIN_KDF_AND_DOMAIN_PEPPER_MATCH_INDEPENDENT_REFERENCE', async () => {
  const bits = pbkdf2Sync(pin, Buffer.from(salt, 'hex'), 600000, 32, 'sha256').toString('hex');
  const root = createHmac('sha256', serverRoot).update('xandeflix:c155:pin:v1').digest();
  const reference = createHmac('sha256', root).update(salt + ':' + bits).digest('hex');
  assert.equal(await cryptoFunctions.pinVerifier(pin, salt, serverRoot), reference);
  assert.notEqual(await cryptoFunctions.pinVerifier(pin, salt, serverRoot + '-different'), reference);
  assert.notEqual(await cryptoFunctions.pinVerifier(pin, '34'.repeat(16), serverRoot), reference);
  assert.equal(cryptoFunctions.equalVerifier(reference, reference), true);
  assert.equal(cryptoFunctions.equalVerifier(reference, reference.slice(0, -1)), false);
  await assert.rejects(cryptoFunctions.pinVerifier('123', salt, serverRoot));
});
await test('NO_PUBLIC_IDENTITY_OR_ACTIVATION_BEFORE_VERIFIED_SESSION', async () => {
  let io = 0, clock = 0;
  const fsMock = new Proxy({}, { get() { return () => { io++; throw Error('UNEXPECTED_STORAGE'); }; } });
  const h = harness({ __XANDEFLIX_WEB_PUBLIC__: true, performance: { now: () => clock } }, {
    '@capacitor/filesystem': { Filesystem: fsMock, Directory: { Data: 'DATA' }, Encoding: { UTF8: 'utf8' } },
    '../ui/device-presentation.ts': { getDevicePresentation: () => null },
  });
  const context = h.load('src/web-production/session-context.ts');
  const identity = h.load('src/device/device-identity.service.ts');
  await assert.rejects(identity.getOrCreateDeviceIdentity());
  await assert.rejects(identity.DeviceIdentityService.loadActivationState());
  context.installPublicWebSession(session);
  assert.equal((await identity.getOrCreateDeviceIdentity()).deviceId, did);
  assert.equal((await identity.DeviceIdentityService.getOrCreateInstallationIdentity()).installationId, sid);
  assert.equal((await identity.DeviceIdentityService.getOrCreateDeviceAuthToken()).rawDeviceToken, token);
  assert.equal((await identity.DeviceIdentityService.getOrCreateDeviceAuthToken()).deviceTokenHash, createHash('sha256').update(token).digest('hex'));
  await assert.rejects(identity.DeviceIdentityService.getOrCreateDeviceActivationKey());
  await assert.rejects(identity.DeviceIdentityService.rotateDeviceActivationKey());
  assert.throws(() => identity.DeviceIdentityService.generateDisplayCode());
  await assert.rejects(identity.DeviceIdentityService.saveActivationState({ ...session.activation, deviceAuthToken: 'forged' }));
  assert.equal(io, 0);
  clock = 900001;
  assert.throws(() => context.publicWebSession(), /WEB_SESSION_REQUIRED/);
});
await test('PUBLIC_BOOT_NEVER_IMPORTS_APP_WHILE_LOGIN_IS_PENDING', async () => {
  let imported = 0, resolveLogin;
  const pending = new Promise(resolve => { resolveLogin = resolve; });
  const root = { setAttribute() {}, textContent: '' };
  const h = harness({ document: { getElementById: () => root }, __XANDEFLIX_APP_PUBLIC_CONFIG__: { url: 'fixture', publishableKey: 'fixture' } }, {
    '../manager/public-config.ts': { resolveManagerPublicConfig: () => ({ url: 'fixture', key: 'fixture' }) },
    '../web/validation.ts': { requireSecureWebContext: () => {} },
    './login.ts': { requireWebLogin: () => pending },
    '../main.tsx': new Proxy({}, { get() { imported++; return undefined; } }),
  });
  h.load('src/web-production/main.ts');
  await new Promise(resolve => setImmediate(resolve)); assert.equal(imported, 0);
  resolveLogin(); await new Promise(resolve => setImmediate(resolve)); assert.ok(imported > 0);
});
function memoryStorage() {
  const values = new Map();
  return { get length() { return values.size; }, getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(String(key), String(value)), removeItem: key => values.delete(key), key: index => [...values.keys()][index] ?? null, clear: () => values.clear() };
}
await test('CUSTOMER_STORAGE_ISOLATION_PRESERVES_MANAGER_AND_OTHER_CUSTOMERS', () => {
  const { scopedStorage } = harness().load('src/web-production/session-storage.ts');
  const original = memoryStorage(); original.setItem('manager-session', 'untouched');
  const a = scopedStorage(original, 'a:'), b = scopedStorage(original, 'b:');
  a.setItem('parental', 'a-private'); b.setItem('parental', 'b-private');
  assert.equal(a.getItem('parental'), 'a-private'); assert.equal(b.getItem('parental'), 'b-private');
  a.favorite = 'a-favorite'; assert.equal(b.favorite, undefined); assert.equal(a.length, 2);
  assert.equal(Object.hasOwn(a, 'favorite'), true); assert.equal(Object.hasOwn(b, 'favorite'), false);
  a.clear(); assert.equal(b.getItem('parental'), 'b-private'); assert.equal(original.getItem('manager-session'), 'untouched');
});
await test('INDEXEDDB_AND_STORAGE_ARE_SCOPED_BEFORE_APP_WITHOUT_DATABASE_DELETION', async () => {
  const calls = [], raw = memoryStorage();
  const factory = { open: (...args) => calls.push(args), deleteDatabase: name => calls.push(['delete', name]), databases: async () => [{ name: 'manager' }, { name: `xandeflix.consumer.${did}.catalog` }] };
  const window = { indexedDB: factory, localStorage: raw, sessionStorage: memoryStorage() };
  const h = harness({ window }); const scope = h.load('src/web-production/session-storage.ts');
  scope.installWebStorageScope(did); window.indexedDB.open('catalog', 1);
  assert.equal(calls[0][0], `xandeflix.consumer.${did}.catalog`);
  assert.equal((await window.indexedDB.databases())[0].name, 'catalog');
  assert.throws(() => scope.installWebStorageScope('different-device'), /RELOAD_REQUIRED/);
  assert.equal(calls.filter(call => call[0] === 'delete').length, 0);
});
await test('PARTIAL_STORAGE_INSTALL_FAILURE_RESTORES_ORIGINAL_SCOPES', () => {
  const local = memoryStorage(), sessionStorage = memoryStorage(), factory = { open() {} };
  const window = { localStorage: local, sessionStorage };
  Object.defineProperty(window, 'indexedDB', { value: factory, configurable: false });
  const h = harness({ window });
  assert.throws(() => h.load('src/web-production/session-storage.ts').installWebStorageScope(did), /STORAGE_UNAVAILABLE/);
  assert.equal(window.localStorage, local); assert.equal(window.sessionStorage, sessionStorage);
});
const storedVerifier = await cryptoFunctions.pinVerifier(pin, salt, serverRoot);
async function edgeCase(fields, options = {}) {
  const calls = [];
  const rpc = async (name, args) => {
    calls.push({ name, args });
    if (name === 'rpc_web_auth_rate_limit') return { data: !options.rateDenied };
    if (name === 'rpc_web_begin_login') return { data: options.unknownKey ? { success: false } : { success: true, challengeId: sid, salt, verifier: storedVerifier } };
    if (name === 'rpc_web_finish_login') return { data: { success: args.p_verified } };
    if (name === 'rpc_web_session_context') return { data: { ...session, sessionToken: undefined } };
    if (name === 'rpc_web_can_manage_device') return { data: options.managerScope === true };
    if (name === 'rpc_web_enrollment_state') return { data: { success: true, salt, verifier: storedVerifier, version: sid } };
    return { data: { success: true } };
  };
  const h = harness({ Deno: { env: { get: name => ({ SUPABASE_URL: 'https://canonical.invalid', SUPABASE_SERVICE_ROLE_KEY: serverRoot, SUPABASE_ANON_KEY: 'synthetic-public' })[name] }, serve() {} } }, {
    'npm:@supabase/supabase-js@2.116.0': { createClient: () => ({ rpc, auth: { getUser: async () => ({ data: { user: options.managerUser ? { id: did } : null } }) } }) },
  });
  const edge = h.load('supabase/functions/web-device-access/index.ts');
  const response = await edge.handleWebDeviceAccess(new Request('https://canonical.invalid/web-device-access', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: options.origin || 'https://xandeflix.vercel.app', ...(options.jwt ? { Authorization: 'Bearer synthetic-manager-jwt' } : {}) }, body: JSON.stringify(fields) }));
  return { status: response.status, result: await response.json(), calls, headers: response.headers };
}
const login = { operation: 'LOGIN', displayCode: 'XF-TEST-0155', accessKey: '391247', pin };
await test('THREE_CREDENTIALS_REQUIRED_AND_ERRORS_DO_NOT_ENUMERATE', async () => {
  const wrongPin = await edgeCase({ ...login, pin: '999999' });
  const wrongKey = await edgeCase(login, { unknownKey: true });
  assert.equal(wrongPin.status, 403); assert.deepEqual(wrongPin.result, wrongKey.result);
  for (const field of ['displayCode','accessKey','pin']) {
    const result = await edgeCase({ ...login, [field]: '' });
    assert.equal(result.status, 403); assert.deepEqual(result.result, wrongPin.result);
    assert(!result.calls.some(call => call.name === 'rpc_web_finish_login'));
  }
  assert.doesNotMatch(JSON.stringify(wrongPin.result), /verifier|challenge|salt|999999|391247/);
});
await test('LOGIN_RETURNS_ONLY_DELEGATED_SESSION_AND_NO_NATIVE_CREDENTIAL', async () => {
  const result = await edgeCase(login);
  assert.equal(result.status, 200); assert.match(result.result.sessionToken, /^xw1_[0-9a-f]{64}$/);
  assert.equal(result.result.activation.deviceId, did);
  assert.equal(result.result.activation.deviceAuthToken, undefined);
  assert.equal(result.headers.get('cache-control'), 'no-store');
  assert(!result.calls.some(call => /activation|installation|register|create_device/.test(call.name)));
});
await test('UNRELATED_ORIGIN_AND_ABUSE_ARE_DENIED_BEFORE_KDF_LOGIN', async () => {
  const origin = await edgeCase(login, { origin: 'https://unrelated.invalid' }); assert.equal(origin.status, 403); assert.equal(origin.calls.length, 0);
  const rate = await edgeCase(login, { rateDenied: true }); assert.equal(rate.status, 429);
  assert(!rate.calls.some(call => call.name === 'rpc_web_begin_login'));
});
await test('MANAGER_PIN_REQUIRES_REAL_USER_AND_SCOPED_AUTHORIZATION', async () => {
  const body = { operation: 'SET_PIN', deviceId: did, pin };
  for (const options of [{}, { jwt: true }, { jwt: true, managerUser: true }]) {
    const result = await edgeCase(body, options); assert.equal(result.status, 403);
    assert(!result.calls.some(call => call.name === 'rpc_manager_set_web_pin'));
  }
  const result = await edgeCase(body, { jwt: true, managerUser: true, managerScope: true });
  assert.equal(result.status, 200); assert.deepEqual(result.result, { success: true });
  const write = result.calls.find(call => call.name === 'rpc_manager_set_web_pin');
  assert.match(write.args.p_verifier, /^[0-9a-f]{64}$/); assert(!Object.values(write.args).includes(pin));
});
await test('DELEGATED_TOKEN_CANNOT_ENROLL_OR_RESET_PARENTAL_PIN', async () => {
  const result = await edgeCase({ operation: 'ENROLL_PIN', deviceId: did, deviceAuthToken: token, pin });
  assert.equal(result.status, 403); assert(!result.calls.some(call => call.name === 'rpc_web_enroll_pin'));
  const native = await edgeCase({ operation: 'ENROLL_PIN', deviceId: did, deviceAuthToken: 'synthetic-native-credential', pin });
  assert.equal(native.status, 200);
  assert(native.calls.find(call => call.name === 'rpc_web_enroll_pin').args.p_verified);
});
console.log(`C155_EXISTING_DEVICE_WEB_LOGIN=${tests}/${tests}_PASS`);
