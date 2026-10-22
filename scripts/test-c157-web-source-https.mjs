import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';

let count = 0;
const test = async (name, run) => { await run(); count++; console.log('PASS ' + name); };
function harness({ web = true, protocol = 'https:', overrides = {}, globals = {} } = {}) {
  const calls = [], states = [], location = new URL(protocol + '//web.fixture.invalid/app');
  let perform = async () => new Response('fixture');
  const fetch = function (input, init) { assert.equal(this, window); calls.push({ input, init }); return perform(input, init); };
  const window = { fetch, addEventListener() {} };
  const context = vm.createContext({ URL, Request, Response, DOMException, location, window,
    document: { querySelector: () => null, documentElement: { dataset: {} } },
    __XANDEFLIX_WEB_PUBLIC__: web, __dirname: process.cwd(), ...globals,
  });
  const cache = new Map();
  function load(file) {
    file = path.resolve(file);
    if (cache.has(file)) return cache.get(file);
    const exports = {}; cache.set(file, exports);
    const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React, esModuleInterop: true,
    } }).outputText;
    const require = id => {
      if (Object.hasOwn(overrides, id)) return overrides[id];
      if (id === 'react') return { ...React, useSyncExternalStore: (_, snapshot) => snapshot() };
      if (id.endsWith('/validation.ts') || id === './validation.ts') return { isWebValidation: () => web };
      if (id.endsWith('device-presentation.ts')) return {};
      if (id.endsWith('boot-sync-coordinator.ts')) return { getBootSyncCoordinator: () => ({ subscribe: listener => states.push(listener) }) };
      if (id === '@capacitor/core') return {};
      if (id.endsWith('web-catalog-files.ts')) return { readWebCatalogFile: async () => null };
      if (id.endsWith('playback.service.ts') || id.endsWith('.css')) return {};
      if (id.endsWith('StartupLoadingScreen.tsx')) return { StartupLoadingScreen: () => null };
      return load(path.resolve(path.dirname(file), id));
    };
    vm.runInContext(`(function(require,exports){${source}\n})`, context)(require, exports);
    return exports;
  }
  const store = load('src/web/web-source-connection.ts');
  load('src/web/web-runtime.ts').mountWebRuntimeNotice();
  return { store, window, calls, fetch, load, set: value => { perform = value; }, state: value => states.forEach(listener => listener(value)) };
}

await test('FETCH_ARGUMENTS_RESPONSE_AND_UNCONSUMED_BODY_ARE_PRESERVED', async () => {
  const h = harness(), response = new Response('original'), request = new Request('https://source.fixture.invalid/list'), init = { headers: { 'X-Fixture': 'synthetic' } };
  h.set(async () => response);
  assert.equal(await h.window.fetch(request, init), response); assert.equal(response.bodyUsed, false);
  assert.equal(h.calls.length, 1); assert.equal(h.calls[0].input, request); assert.equal(h.calls[0].init, init);
  assert.equal(h.store.getWebSourceConnection(), 'NOT_OBSERVED');
});
await test('HTTP_REJECTION_RETHROWN_UNCHANGED_ONLY_SANITIZED_ENUM_OBSERVED', async () => {
  const h = harness(), error = new TypeError('synthetic-private-message'); let notifications = 0;
  const remove = h.store.subscribeWebSourceConnection(() => { notifications++; throw Error('observer-failure'); });
  h.set(async () => { throw error; });
  for (let n = 0; n < 2; n++) await assert.rejects(h.window.fetch('http://source.fixture.invalid/list?fixture=private'), value => value === error);
  assert.equal(h.calls.length, 2); assert.equal(h.calls[0].input, 'http://source.fixture.invalid/list?fixture=private');
  assert.equal(h.store.getWebSourceConnection(), 'HTTP_IN_HTTPS_BLOCKED'); assert.equal(notifications, 1);
  assert.doesNotMatch(JSON.stringify(h.store.getWebSourceConnection()), /private|fixture|http:|list/); remove();
});
await test('HTTPS_TRANSPORT_FAILURE_IS_NOT_MISREPORTED_AS_MIXED_CONTENT', async () => {
  const h = harness(), error = new TypeError('network-or-cors'); h.set(async () => { throw error; });
  await assert.rejects(h.window.fetch('https://source.fixture.invalid/list'), value => value === error);
  assert.equal(h.store.getWebSourceConnection(), 'NOT_OBSERVED');
});
await test('ABORT_AND_TRUSTWORTHY_LOOPBACK_ARE_NOT_MISREPORTED', async () => {
  const h = harness(), aborted = new DOMException('cancelled', 'AbortError'); h.set(async () => { throw aborted; });
  await assert.rejects(h.window.fetch('http://source.fixture.invalid/list'), value => value === aborted);
  const error = new TypeError('fixture'); h.set(async () => { throw error; });
  for (const host of ['localhost', 'sub.localhost', '127.0.0.1', '127.0.0.2', '[::1]']) {
    await assert.rejects(h.window.fetch('http://' + host + '/list'), value => value === error);
  }
  assert.equal(h.store.getWebSourceConnection(), 'NOT_OBSERVED');
});
await test('NON_HTTPS_PAGE_AND_EXCLUDED_AUTHORITIES_DO_NOT_SET_SOURCE_NOTICE', async () => {
  for (const [protocol, url] of [['http:', 'http://source.fixture.invalid/list'], ['https:', 'https://web.fixture.invalid/local'], ['https:', 'http://project.supabase.co/api'], ['https:', 'http://image.tmdb.org/image']]) {
    const h = harness({ protocol }); h.set(async () => { throw new TypeError('fixture'); });
    await assert.rejects(h.window.fetch(url)); assert.equal(h.store.getWebSourceConnection(), 'NOT_OBSERVED');
  }
});
await test('SUCCESSFUL_HTTP_RESPONSE_IS_NOT_LABELLED_BLOCKED', async () => {
  const h = harness(), response = new Response('fixture'); h.set(async () => response);
  assert.equal(await h.window.fetch('http://source.fixture.invalid/list'), response);
  assert.equal(h.store.getWebSourceConnection(), 'NOT_OBSERVED');
});
await test('RETRY_AND_READY_RESET_NOTICE_WITHOUT_ADDITIONAL_REQUESTS', async () => {
  const h = harness(); let notifications = 0; const remove = h.store.subscribeWebSourceConnection(() => { notifications++; });
  h.set(async () => { throw new TypeError('fixture'); });
  await assert.rejects(h.window.fetch('http://source.fixture.invalid/list')); h.state('ERROR');
  assert.equal(h.store.getWebSourceConnection(), 'HTTP_IN_HTTPS_BLOCKED'); h.state('CHECKING_SOURCE');
  assert.equal(h.store.getWebSourceConnection(), 'NOT_OBSERVED'); h.state('CHECKING_SOURCE');
  await assert.rejects(h.window.fetch('http://source.fixture.invalid/list')); h.state('READY');
  assert.equal(h.store.getWebSourceConnection(), 'NOT_OBSERVED'); assert.equal(notifications, 4); assert.equal(h.calls.length, 2); remove();
});
await test('NOTICE_ONLY_ON_FAILED_CATALOG_CALLBACKS_REMAIN_UNCHANGED', async () => {
  const h = harness(), Component = h.load('src/ui/components/FirstRealSyncState.tsx').FirstRealSyncState;
  const callbacks = { onRetry() {}, onOpenActivation() {}, onOpenPortal() {} };
  const render = catalogState => Component({ catalogState, ...callbacks });
  assert.equal(render('CATALOG_SYNC_ERROR').props.notice, undefined);
  h.set(async () => { throw new TypeError('fixture'); }); await assert.rejects(h.window.fetch('http://source.fixture.invalid/list'));
  assert.equal(render('SYNCING_FIRST_REAL_CATALOG').props.notice, undefined); assert.equal(render('OFFLINE_WAITING_FOR_SYNC').props.notice, undefined);
  assert.equal(render('SYNCING_FIRST_REAL_CATALOG').props.actions, undefined);
  const failed = render('CATALOG_SYNC_ERROR'); assert.match(failed.props.notice, /HTTP.*HTTPS/);
  const buttons = failed.props.actions.props.children; assert.equal(buttons.length, 3);
  assert.deepEqual(buttons.map(button => button.props.onClick), Object.values(callbacks));
  h.state('CHECKING_SOURCE'); assert.equal(render('CATALOG_SYNC_ERROR').props.notice, undefined);
});
await test('NATIVE_BUILD_HAS_NO_FETCH_WRAPPER_SUBSCRIPTIONS_OR_NOTICE', async () => {
  const h = harness({ web: false }); let notified = false;
  assert.equal(h.window.fetch, h.fetch);
  const remove = h.store.subscribeWebSourceConnection(() => { notified = true; });
  assert.equal(h.store.observeWebSourceFailure(new URL('http://source.fixture.invalid/list'), new TypeError('fixture')), false);
  h.store.resetWebSourceConnection(); assert.equal(h.store.getWebSourceConnection(), 'NOT_OBSERVED'); assert.equal(h.store.getEmptyWebSourceConnection(), 'NOT_OBSERVED'); assert.equal(notified, false); remove();
  const Component = h.load('src/ui/components/FirstRealSyncState.tsx').FirstRealSyncState;
  assert.equal(Component({ catalogState: 'CATALOG_SYNC_ERROR' }).props.notice, undefined);
});
await test('WEB_ACCESS_STATUS_READS_EXISTING_SESSION_AND_ONLY_PROVENANCE_METADATA', async () => {
  const session = { sessionId: 'synthetic-session', sessionToken: 'synthetic-private-token', activation: { displayCode: 'XF-TEST-0157', licenseMode: 'MANAGED' } };
  let calls = 0;
  const source = { localState: 'ready', bindingState: 'ready', comparison: 'changed', local: { id: 'src_fixture', version: 1 }, bound: { id: 'src_fixture', version: 2 } };
  const h = harness({ overrides: {
    './session-context.ts': { publicWebSession: () => session },
    '../ui/settings/active-source-status.ts': { readActiveSourceStatus: async () => { calls++; return source; } },
  } });
  const page = h.load('src/web-production/WebAccessStatus.tsx');
  const value = await page.readWebAccessStatus(); assert.equal(calls, 1);
  assert.equal(value.source.comparison, 'changed'); assert.equal(value.displayCode, 'XF-TEST-0157');
  assert.doesNotMatch(JSON.stringify(value), /private-token|sessionToken|sessionId/);
  const diagnostic = page.webAccessDiagnostic(value);
  assert.match(diagnostic, /WEB_SESSION_STATE=AUTHORIZED/); assert.match(diagnostic, /LOCAL_KEY_STATE=NOT_APPLICABLE_WEB/);
  assert.match(diagnostic, /SOURCE_COMPARISON=CHANGED/); assert.match(diagnostic, /LOCAL_SOURCE_VERSION=1/); assert.match(diagnostic, /BOUND_SOURCE_VERSION=2/);
  assert.doesNotMatch(diagnostic, /src_fixture|private-token|UNREGISTERED|https?:/);
  assert.match(page.webAccessDiagnostic(), /WEB_SESSION_STATE=UNAVAILABLE/);
});
await test('EXPIRED_OR_CHANGED_WEB_SESSION_DURING_STATUS_READ_FAILS_CLOSED', async () => {
  for (const mode of ['expired', 'changed']) {
    let finished = false;
    const h = harness({ overrides: {
      './session-context.ts': { publicWebSession: () => {
        if (finished && mode === 'expired') throw Error('WEB_SESSION_REQUIRED');
        return { sessionId: finished ? 'other-session' : 'original', activation: { displayCode: 'XF-TEST-0157', licenseMode: 'MANAGED' } };
      } },
      '../ui/settings/active-source-status.ts': { readActiveSourceStatus: async () => { finished = true; return {}; } },
    } });
    await assert.rejects(h.load('src/web-production/WebAccessStatus.tsx').readWebAccessStatus(), /WEB_SESSION_REQUIRED/);
  }
});
await test('PUBLIC_ACTIVATION_ROUTE_SELECTS_WEB_COMPONENT_WITHOUT_NATIVE_PORT_CALLS', () => {
  for (const web of [true, false]) {
    let nativeCalls = 0;
    const ports = new Proxy({}, { get: (_, key) => key === '__esModule' ? true : () => { nativeCalls++; throw Error('NATIVE_PORT_CALLED'); } });
    const context = vm.createContext({});
    const exports = {};
    const source = ts.transpileModule(fs.readFileSync('src/ui/pages/ActivationPage.tsx', 'utf8'), { compilerOptions: {
      target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true,
    } }).outputText.replaceAll('import.meta', '({env:{}})');
    function WebAccessStatus() {}
    vm.runInContext(`(function(require,exports){${source}\n})`, context)(id => id === 'react' ? React
      : id.endsWith('/session-context.ts') ? { isPublicConsumerWeb: () => web }
        : id.endsWith('/WebAccessStatus.tsx') ? { WebAccessStatus } : ports, exports);
    const onBack = () => {};
    const result = exports.ActivationPage({ onBack });
    assert.equal(web ? result.type === WebAccessStatus : result.type.name === 'NativeActivationPage', true);
    assert.equal(result.props.onBack, onBack); assert.equal(nativeCalls, 0);
  }
});
await test('TMDB_READ_KEY_OPTIONAL_EXACT_WHITELIST_REJECTS_PRIVATE_OR_INVALID_VALUES', () => {
  for (const key of ['', 'ab'.repeat(16), 'not-a-valid-read-key', 'eyJ.synthetic-private-jwt']) {
    const h = harness({ overrides: {
      vite: { defineConfig: value => value, loadEnv: (_, __, prefix) => prefix === 'VITE_SUPABASE_' ? {} : { VITE_TMDB_API_KEY: key, VITE_TMDB_API_KEY_EXTRA: 'never-public', VITE_TMDB_READ_ACCESS_TOKEN: 'never-public' } },
      '@vitejs/plugin-react': () => ({}), 'node:path': path,
      './src/manager/public-config.ts': { resolveManagerPublicConfig: () => ({ url: 'https://public.fixture.invalid', key: 'synthetic-public' }) },
    } });
    const configuration = h.load('vite.app.config.ts').default;
    if (key && key !== 'ab'.repeat(16)) { assert.throws(() => configuration({ mode: 'production' }), /WEB_TMDB_READ_KEY_INVALID/); continue; }
    const result = configuration({ mode: 'production' });
    assert.equal(JSON.parse(result.define['import.meta.env.VITE_TMDB_API_KEY']), key);
    assert.equal(result.define.__XANDEFLIX_WEB_TMDB_CONFIGURED__, String(Boolean(key)));
    assert.equal(result.envPrefix.length, 0); assert.doesNotMatch(JSON.stringify(result), /never-public/);
  }
});
await test('PRESERVED_CATALOG_FAILURE_IS_FAILED_ON_WEB_AND_NATIVE_WITHOUT_FALSE_DEFERRAL', async () => {
  for (const web of [true, false]) {
    const h = harness({ web, overrides: {
      '../../bootstrap/client.ts': {}, '../../control-plane/client/authorized-source-resolver.ts': {},
      '../../playback/google-cast.ts': { hasGoogleCast: () => false },
    } });
    const settings = h.load('src/ui/settings/active-source-status.ts');
    const result = await settings.updateSourceCatalog({ canRun: async () => true, sync: async () => ({ outcome: 'LOCAL_FIRST_ACTIVE_PRESERVED', error: 'synthetic-private-failure' }) });
    assert.equal(result, 'failed');
    const refresh = h.store.getWebCatalogRefresh();
    assert.equal(refresh.hadError, web); assert.doesNotMatch(JSON.stringify(refresh), /private-failure/);
    assert.equal(await settings.updateSourceCatalog({ canRun: async () => true, sync: async () => ({ outcome: 'LOCAL_FIRST_ACTIVE_PRESERVED' }) }), 'deferred');
    assert.equal(h.store.getWebCatalogRefresh().hadError, false);
  }
});
await test('REAL_REFRESH_GUARD_RECORDS_REASON_WITHOUT_BYPASSING_PLAYBACK_MODAL_OR_VISIBILITY', async () => {
  let settings = true, visible = 'visible', online = true, modal = false, playback = 'IDLE';
  const document = { get visibilityState() { return visible; }, documentElement: { dataset: {} }, querySelector: selector => selector === '.settings-page' ? settings ? {} : null : selector.includes('data-detail-modal') && modal ? {} : null };
  const h = harness({ globals: { document, navigator: { get onLine() { return online; } } }, overrides: {
    '../../bootstrap/client.ts': {}, '../../control-plane/client/authorized-source-resolver.ts': {},
    '../../playback/google-cast.ts': { hasGoogleCast: () => false },
    '../../playback/playback.service.ts': { defaultPlaybackService: { getCurrentSession: () => ({ state: playback }) } },
  } });
  const service = h.load('src/ui/settings/active-source-status.ts');
  assert.equal(await service.canUpdateSourceCatalog(), true);
  for (const reason of ['NOT_SETTINGS', 'HIDDEN', 'OFFLINE', 'MODAL_OPEN', 'PLAYBACK_ACTIVE']) {
    settings = reason !== 'NOT_SETTINGS'; visible = reason === 'HIDDEN' ? 'hidden' : 'visible'; online = reason !== 'OFFLINE'; modal = reason === 'MODAL_OPEN'; playback = reason === 'PLAYBACK_ACTIVE' ? 'PLAYING' : 'IDLE';
    assert.equal(await service.canUpdateSourceCatalog(), false); assert.equal(h.store.getWebCatalogRefresh().blocker, reason);
  }
});
assert.equal(count, 15);
console.log(`C157_WEB_SOURCE_HTTPS_TESTS=${count}/15_PASS`);
