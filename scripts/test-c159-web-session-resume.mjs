import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
import { IDBFactory } from 'fake-indexeddb';
import ts from 'typescript';

const KEY = 'xandeflix.web.resume.v1';
const token = 'xw1_' + 'b7'.repeat(32);
const session = { success: true, sessionToken: token, sessionId: '00000000-0000-4000-8000-000000000159', ttlSeconds: 900, absoluteTtlSeconds: 28800,
  activation: { status: 'AUTHORIZED', deviceId: '00000000-0000-4000-8000-000000000160', displayCode: 'XF-TEST-0159', licenseId: 'fixture-license', licenseMode: 'MANAGED', licenseStatus: 'ACTIVE', deviceType: 'PC' } };
let tests = 0;
const test = async (name, run) => { await run(); tests++; console.log('PASS ' + name); };
const tick = async () => { for (let i = 0; i < 12; i++) await new Promise(resolve => setImmediate(resolve)); };
const until = async predicate => {
  const deadline = Date.now() + 5000;
  while (!predicate()) { assert.ok(Date.now() < deadline, 'ASYNC_TEST_CONDITION_TIMEOUT'); await new Promise(resolve => setTimeout(resolve, 5)); }
};
function storage() {
  const data = new Map();
  return { get length() { return data.size; }, key: index => [...data.keys()][index] ?? null, getItem: key => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, String(value)), removeItem: key => data.delete(key), clear: () => data.clear() };
}
function harness({ raw = storage(), database = new IDBFactory(), navigation = 'reload', crypto = webcrypto, now = Date.now() } = {}) {
  const calls = [], logs = [], timers = [], replaced = [], clock = { now }, media = { paused: 0, removed: 0, loaded: 0, pause() { this.paused++; }, removeAttribute() { this.removed++; }, load() { this.loaded++; } };
  let imported = 0, contextOperation = async () => session, loginOperation = async () => session;
  class Element extends EventTarget { constructor() { super(); this.value = ''; this.textContent = ''; this.children = []; } setAttribute() {} focus() {} appendChild(e) { this.children.push(e); } }
  const fields = Object.fromEntries(['displayCode','accessKey','pin'].map(n => [n, new Element()]));
  const submit = new Element(), status = new Element(), form = new Element();
  form.elements = { namedItem: name => fields[name] }; form.reportValidity = () => true;
  form.querySelector = selector => selector === 'button' ? submit : status;
  const root = new Element(); let html = '';
  Object.defineProperty(root, 'innerHTML', { get: () => html, set: value => { html = value; } });
  root.querySelector = selector => selector === 'form' ? form : null;
  const body = new Element(), document = new EventTarget();
  Object.assign(document, { getElementById: () => root, body, createElement: () => new Element(), visibilityState: 'visible', querySelectorAll: () => [media] });
  const window = new EventTarget();
  Object.assign(window, { indexedDB: database, sessionStorage: raw, localStorage: storage(), setInterval: f => { timers.push(f); return timers.length; }, location: { replace: p => replaced.push(p), reload: () => replaced.push('reload') } });
  class ClockDate extends Date { static now() { return clock.now; } }
  const context = vm.createContext({ window, document, Event, URL, Date: ClockDate, crypto, TextEncoder, TextDecoder, Uint8Array, atob, btoa, AbortController, setTimeout, clearTimeout,
    performance: { now: () => 0, getEntriesByType: () => [{ type: navigation }] }, console: { log: (...a) => logs.push(a), info: (...a) => logs.push(a), error: (...a) => logs.push(a) },
    __XANDEFLIX_WEB_PUBLIC__: true, __XANDEFLIX_APP_PUBLIC_CONFIG__: { url: 'https://canonical.fixture.invalid', publishableKey: 'synthetic-public' } });
  const cache = new Map();
  function load(file) {
    file = path.resolve(file); if (cache.has(file)) return cache.get(file);
    const exports = {}; cache.set(file, exports);
    const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
    const require = id => {
      if (id.endsWith('.css')) return {};
      if (id === './web-access.client.ts') return { WEB_ACCESS_ERROR: 'GENERIC_ERROR', webAccessRequest: async (op, fields) => { calls.push({ op, fields }); return loginOperation(); },
        webSessionRequest: async (op, proof) => { calls.push({ op, proof }); return op === 'rpc_web_session_context' ? contextOperation() : { success: true }; } };
      if (id === '../web/validation.ts') return { requireSecureWebContext() {} };
      if (id === '../manager/public-config.ts') return { resolveManagerPublicConfig: () => ({ url: 'https://canonical.fixture.invalid', key: 'synthetic-public' }) };
      if (id === '../main.tsx') { imported++; return {}; }
      return load(path.resolve(path.dirname(file), id));
    };
    vm.runInContext(`(function(require,exports){${source}\n})`, context)(require, exports); return exports;
  }
  const resume = load('src/web-production/session-resume.ts');
  return { resume, load, raw, database, window, document, root, form, fields, submit, calls, logs, timers, replaced, media, clock, get imported() { return imported; },
    setContext: f => { contextOperation = f; }, setLogin: f => { loginOperation = f; },
    login: async () => { const promise = load('src/web-production/login.ts').requireWebLogin(); await until(() => root.innerHTML.includes('<form')); fields.displayCode.value = 'XF-TEST-0159'; fields.accessKey.value = '159731'; fields.pin.value = '248592'; form.dispatchEvent(new Event('submit', { cancelable: true })); await promise; } };
}
const getStoredKey = database => new Promise((resolve, reject) => { const request = database.open('xandeflix.web-auth.v1', 1); request.onerror = reject; request.onsuccess = () => { const db = request.result, tx = db.transaction('keys'); const read = tx.objectStore('keys').get('key'); read.onsuccess = () => resolve(read.result); tx.oncomplete = () => db.close(); }; });

await test('AES_REAL_IDB_ROUNDTRIP_RELOAD_AND_NON_EXPORTABLE_KEY', async () => {
  const first = harness(); assert.equal(await first.resume.rememberWebSession(token, 900, 28800), true);
  const encoded = first.raw.getItem(KEY); assert.ok(encoded); assert.ok(!encoded.includes(token));
  assert.deepEqual(Object.keys(JSON.parse(encoded)).sort(), ['body','expires','iv','version']);
  const key = await getStoredKey(first.database); assert.equal(key.extractable, false); await assert.rejects(webcrypto.subtle.exportKey('raw', key));
  const reload = harness({ raw: first.raw, database: first.database }); assert.equal(await reload.resume.takeWebSessionForReload(), token);
  assert.equal(first.logs.length + reload.logs.length, 0);
});
await test('NEW_NAVIGATION_OR_TAB_DOES_NOT_REUSE_COPIED_ENVELOPE', async () => {
  const h = harness(); await h.resume.rememberWebSession(token, 900, 900);
  const other = harness({ raw: h.raw, database: h.database, navigation: 'navigate' });
  assert.equal(await other.resume.takeWebSessionForReload(), undefined); assert.equal(h.raw.getItem(KEY), null);
});
await test('EXPIRED_AND_ABSOLUTE_SHORTER_LIFETIME_REQUIRE_FRESH_LOGIN', async () => {
  const h = harness(); await h.resume.rememberWebSession(token, 900, 10);
  const record = JSON.parse(h.raw.getItem(KEY)); assert.equal(record.expires, h.clock.now + 10000);
  h.clock.now += 10001; assert.equal(await h.resume.takeWebSessionForReload(), undefined); assert.equal(h.raw.getItem(KEY), null);
});
await test('TAMPERED_CIPHERTEXT_DEADLINE_AND_OVERSIZE_RECORD_FAIL_CLOSED', async () => {
  for (const tamper of [r => ({ ...r, expires: r.expires - 1 }), r => ({ ...r, body: 'A'.repeat(r.body.length) }), r => ({ ...r, uri: 'synthetic-private-data' })]) {
    const h = harness(); await h.resume.rememberWebSession(token, 900, 900); h.raw.setItem(KEY, JSON.stringify(tamper(JSON.parse(h.raw.getItem(KEY)))));
    assert.equal(await h.resume.takeWebSessionForReload(), undefined); assert.equal(h.raw.getItem(KEY), null);
  }
  const h = harness(); h.raw.setItem(KEY, 'x'.repeat(401)); assert.equal(await h.resume.takeWebSessionForReload(), undefined);
});
await test('MISSING_KEY_OR_CRYPTO_NEVER_RECOVERS_OR_STORES_PLAINTEXT', async () => {
  const h = harness(); await h.resume.rememberWebSession(token, 900, 900);
  const lost = harness({ raw: h.raw, database: new IDBFactory() }); assert.equal(await lost.resume.takeWebSessionForReload(), undefined);
  const noCrypto = harness({ crypto: {} }); assert.equal(await noCrypto.resume.rememberWebSession(token, 900, 900), false); assert.equal(noCrypto.raw.length, 0);
});
await test('CORRUPTED_STORED_KEY_IS_REJECTED_WITHOUT_REPLACEMENT_OR_HANG', async () => {
  const h = harness(); await h.resume.rememberWebSession(token, 900, 900);
  await new Promise((resolve, reject) => { const request = h.database.open('xandeflix.web-auth.v1', 1); request.onerror = reject; request.onsuccess = () => {
    const db = request.result, tx = db.transaction('keys', 'readwrite'); tx.objectStore('keys').put({ type: 'secret', extractable: false }, 'key'); tx.oncomplete = () => { db.close(); resolve(); };
  }; });
  const reload = harness({ raw: h.raw, database: h.database }); assert.equal(await reload.resume.takeWebSessionForReload(), undefined); assert.equal(h.raw.getItem(KEY), null);
  assert.deepEqual(await getStoredKey(h.database), { type: 'secret', extractable: false });
});
await test('STORAGE_DENIED_AND_BLOCKED_DATABASE_ARE_BOUNDED_WITHOUT_FALLBACK', async () => {
  const denied = { getItem() { throw Error('denied'); }, setItem() { throw Error('denied'); }, removeItem() { throw Error('denied'); } };
  const h = harness({ raw: denied }); assert.equal(await h.resume.rememberWebSession(token, 900, 900), false); assert.equal(await h.resume.takeWebSessionForReload(), undefined);
  const blocked = { open() { const request = {}; queueMicrotask(() => request.onblocked?.()); return request; } };
  const b = harness({ database: blocked }); assert.equal(await b.resume.rememberWebSession(token, 900, 900), false); assert.equal(b.raw.length, 0);
});
await test('DATABASE_WITHOUT_EVENTS_TIMES_OUT_AND_MANUAL_LOGIN_STILL_WORKS', async () => {
  const h = harness({ database: { open: () => ({}) }, navigation: 'navigate' });
  await h.login(); assert.equal(h.load('src/web-production/session-context.ts').publicWebSession().sessionToken, token); assert.equal(h.raw.getItem(KEY), null);
});
await test('PENDING_SAVE_CANNOT_RESURRECT_AFTER_SIGNOUT', async () => {
  let release;
  const crypto = { subtle: { generateKey: () => new Promise(resolve => { release = resolve; }), encrypt: webcrypto.subtle.encrypt.bind(webcrypto.subtle) }, getRandomValues: a => webcrypto.getRandomValues(a) };
  const h = harness({ crypto }), pending = h.resume.rememberWebSession(token, 900, 900); h.resume.clearWebSessionResume();
  release(await webcrypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt','decrypt']));
  assert.equal(await pending, false); assert.equal(h.raw.length, 0);
});
await test('EVERY_SAVE_USES_NEW_IV_AND_DOES_NOT_TOUCH_OTHER_STORAGE', async () => {
  const h = harness(); h.raw.setItem('manager-session', 'untouched'); await h.resume.rememberWebSession(token, 900, 900); const first = JSON.parse(h.raw.getItem(KEY));
  await h.resume.rememberWebSession(token, 900, 900); const second = JSON.parse(h.raw.getItem(KEY)); assert.notEqual(first.iv, second.iv); assert.notEqual(first.body, second.body);
  h.resume.clearWebSessionResume(); assert.equal(h.raw.getItem('manager-session'), 'untouched'); assert.equal(h.raw.length, 1);
});
await test('MANUAL_THREE_FACTOR_LOGIN_SAVES_ONLY_DELEGATED_PROOF_BEFORE_SCOPE', async () => {
  const h = harness({ navigation: 'navigate' }); await h.login();
  assert.equal(h.calls[0].op, 'LOGIN'); assert.equal(h.calls[0].fields.pin, '248592'); assert.equal(h.fields.pin.value, ''); assert.equal(h.fields.accessKey.value, '');
  assert.ok(h.raw.getItem(KEY)); assert.equal(h.window.sessionStorage.getItem(KEY), null, 'Auth entry must be in the captured raw tab store, outside customer scope');
  assert.equal(h.load('src/web-production/session-context.ts').publicWebSession().sessionToken, token);
  assert.equal(h.raw.length, 1); assert.equal(h.logs.length, 0);
});
await test('RELOAD_REVALIDATES_SERVER_BEFORE_APP_NO_LOGIN_OR_NEW_IDENTITY', async () => {
  const first = harness({ navigation: 'navigate' }); await first.login();
  const delayedCrypto = { getRandomValues: a => webcrypto.getRandomValues(a), subtle: {
    generateKey: webcrypto.subtle.generateKey.bind(webcrypto.subtle), encrypt: webcrypto.subtle.encrypt.bind(webcrypto.subtle),
    decrypt: async (...args) => { await new Promise(resolve => setTimeout(resolve, 40)); return webcrypto.subtle.decrypt(...args); },
  } };
  const reload = harness({ raw: first.raw, database: first.database, crypto: delayedCrypto }); let confirm;
  reload.setContext(() => new Promise(resolve => { confirm = resolve; }));
  reload.load('src/web-production/main.ts'); await until(() => typeof confirm === 'function'); assert.equal(reload.imported, 0); assert.equal(reload.calls[0].op, 'rpc_web_session_context');
  assert.throws(() => reload.load('src/web-production/session-context.ts').publicWebSession());
  confirm(session); await until(() => reload.imported > 0);
  assert.equal(reload.imported, 1); assert.ok(!reload.calls.some(c => c.op === 'LOGIN'));
  assert.equal(reload.load('src/web-production/session-context.ts').publicWebSession().sessionId, session.sessionId);
});
await test('REVOKED_OR_FORGED_SERVER_RESPONSE_DISCARDS_CACHE_WITHOUT_APP', async () => {
  for (const response of [() => Promise.reject(Error('revoked')), async () => ({ success: true, activation: { status: 'AUTHORIZED' } })]) {
    const h = harness(); await h.resume.rememberWebSession(token, 900, 900); h.setContext(response);
    h.load('src/web-production/main.ts'); await until(() => h.root.innerHTML.includes('<form'));
    assert.ok(h.root.innerHTML.includes('<form')); assert.equal(h.imported, 0); assert.equal(h.raw.getItem(KEY), null);
    assert.ok(h.calls.some(c => c.op === 'rpc_web_logout'));
  }
});
await test('PAGEHIDE_STOPS_MEDIA_BUT_RELOAD_DOES_NOT_REVOKE_SESSION', async () => {
  const h = harness({ navigation: 'navigate' }); await h.login(); h.window.dispatchEvent(new Event('pagehide')); await tick();
  assert.ok(h.media.paused && h.media.removed && h.media.loaded); assert.ok(h.raw.getItem(KEY)); assert.ok(!h.calls.some(c => c.op === 'rpc_web_logout'));
  assert.throws(() => h.load('src/web-production/session-context.ts').publicWebSession());
  const show = new Event('pageshow'); Object.defineProperty(show, 'persisted', { value: true }); h.window.dispatchEvent(show); assert.equal(h.replaced.at(-1), 'reload');
});
await test('EXPLICIT_SIGNOUT_AND_FAILED_HEARTBEAT_REMOVE_PROOF_AND_REVOKE', async () => {
  for (const action of ['signout', 'heartbeat']) {
    const h = harness({ navigation: 'navigate' }); await h.login();
    if (action === 'signout') h.window.dispatchEvent(new Event('xandeflix:web-signout'));
    else { h.setContext(() => Promise.reject(Error('expired'))); h.timers[0](); }
    await until(() => h.replaced.length > 0); assert.equal(h.raw.getItem(KEY), null); assert.ok(h.calls.some(c => c.op === 'rpc_web_logout')); assert.equal(h.replaced.at(-1), '/app');
  }
});
await test('INVALID_LIFETIME_TOKEN_AND_PLAINTEXT_RECORD_NEVER_AUTHORIZE', async () => {
  const h = harness(); assert.equal(await h.resume.rememberWebSession('synthetic-invalid', 900, 900), false);
  assert.equal(await h.resume.rememberWebSession(token, 0, 900), false); assert.equal(await h.resume.rememberWebSession(token, 900, Infinity), false);
  h.raw.setItem(KEY, JSON.stringify({ sessionToken: token, pin: 'fixture' })); assert.equal(await h.resume.takeWebSessionForReload(), undefined); assert.equal(h.raw.length, 0);
});
console.log(`C159_WEB_SESSION_RELOAD=${tests}/${tests}_PASS`);
