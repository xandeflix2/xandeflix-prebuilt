import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Synthetic lifecycle/storage ports. No browser, backend or physical device.
const baseline = process.argv.includes('--baseline');
let effects = [], tests = 0;
const hooks = { ...React, useEffect: effect => effects.push(effect),
  useState: initial => [typeof initial === 'function' ? initial() : initial, () => {}],
  useRef: current => ({ current }), useCallback: fn => fn,
  useSyncExternalStore: (_subscribe, read) => read() };
function load(file, bindings = {}) {
  const exports = {};
  const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React,
  } }).outputText;
  vm.runInNewContext(output, { exports, require: name => {
    if (name === 'react') return { ...hooks, default: hooks };
    if (Object.hasOwn(bindings, name)) return bindings[name];
    throw Error('Uncontrolled startup dependency: ' + name);
  }, __XANDEFLIX_DEBUG_BUILD__: false, window: eventWindow, document: eventDocument,
  navigator: { userAgent: 'Synthetic TV fixture', maxTouchPoints: 0, onLine: true },
  setTimeout, clearTimeout, console });
  return exports;
}
const eventWindow = Object.assign(new EventTarget(), { location: { hash: '' } });
const eventDocument = Object.assign(new EventTarget(), { hidden: false, visibilityState: 'visible' });
const clock = load('src/parental/parental-clock.ts');
const { ParentalControlStore } = load('src/parental/parental-control.store.ts', { './parental-clock.ts': clock });
function fixture() {
  let resolve, reject, reads = 0, writes = 0;
  const pending = new Promise((yes, no) => { resolve = yes; reject = no; });
  const store = new ParentalControlStore({ storage: { read: () => { reads++; return pending; }, write: async () => { writes++; } },
    clock: async () => ({ clockId: 'fixture', elapsedMs: 0 }) });
  return { store, resolve, reject, get reads() { return reads; }, get writes() { return writes; } };
}
const marker = name => props => React.createElement('div', { 'data-screen': name }, props.children);
const StartupLoadingScreen = marker('startup'), Header = marker('header');
function shell(f, override, choice = 'TV') {
  const useParentalControl = load('src/ui/hooks/useParentalControl.ts', { '../../parental/parental-control.store.ts': { parentalControl: f.store } }).useParentalControl;
  return load('src/ui/components/AppShell.tsx', {
    './Header.tsx': { Header }, '../hooks/useLandscapeNavigation.ts': { useLandscapeNavigation: () => choice !== 'PHONE' },
    '../hooks/useLivePresentation.ts': { useLivePresentation: () => ({ tabletPortrait: false, stackedLive: false, squareLive: false }) },
    './CastButton.tsx': { CastButton: marker('cast') },
    '../device-presentation.ts': { isFireTvPresentation: () => choice === 'TV', isTelevisionPresentation: () => choice === 'TV' },
    '../hooks/useDevicePresentation.ts': { useDevicePresentation: () => choice },
    '../hooks/useParentalControl.ts': { useParentalControl: override ? () => override : useParentalControl },
    '../../parental/parental-control.store.ts': { parentalControl: f.store },
    './ParentalPinDialog.tsx': { ParentalPinDialog: marker('pin') }, './StartupLoadingScreen.tsx': { StartupLoadingScreen },
  }).AppShell;
}
function renderShell(Component, view = 'home', onNavigate = () => {}) {
  effects = [];
  return Component({ currentView: view, onNavigate, onBack() {}, canGoBack: view !== 'home',
    children: React.createElement('article', { 'data-catalog': true }, 'Synthetic restricted catalog') });
}
const text = tree => renderToStaticMarkup(tree);
function walk(tree, predicate) {
  if (!React.isValidElement(tree)) return;
  if (predicate(tree)) return tree;
  for (const child of React.Children.toArray(tree.props.children)) { const found = walk(child, predicate); if (found) return found; }
}
function app(f) {
  const calls = { authorization: 0, telemetry: 0 };
  const coordinator = { getState: () => 'IDLE', getProgress: () => undefined };
  const bindings = {
    '@capacitor/core': { Capacitor: { isNativePlatform: () => false } },
    './ui/hooks/useActiveCatalog.ts': { useActiveCatalog: () => ({ isLoading: true, readModel: null, refresh() {} }) },
    './ui/hooks/useDpadNavigation.ts': { useDpadNavigation() {} },
    './ui/hooks/useCatalogReturnNavigation.ts': { useCatalogReturnNavigation: () => ({}) },
    './bootstrap/boot-sync-coordinator.ts': { getBootSyncCoordinator: () => coordinator },
    './ui/navigation/route-state.ts': { createInitialRoute: () => ({ current: { view: 'home' }, history: [] }) },
    './parental/parental-control.store.ts': { parentalControl: f.store },
    './device/device-identity.service.ts': { DeviceIdentityService: {
      loadActivationState: async () => { calls.authorization++; return { status: 'PENDING' }; },
      getOrCreateInstallationIdentity: async () => ({}),
    } },
    './ui/layout/viewport-metrics.ts': { installViewportMetricsDiagnostic() {} },
    './diagnostics/boot-telemetry.ts': { bootTelemetry: { mark() { calls.telemetry++; } } },
    './playback/playback.service.ts': { defaultPlaybackService: { subscribe: () => () => {} } },
    './control-plane/client/installation-registry.service.ts': { InstallationRegistryService: { reportInstallationBestEffort: async () => {} } },
    './web/validation.ts': { isWebValidation: () => false },
    './ui/components/StartupLoadingScreen.tsx': { StartupLoadingScreen },
  };
  // Other imports remain unused because this fixture deliberately keeps boot pending.
  const source = ts.createSourceFile('App.tsx', fs.readFileSync('src/App.tsx', 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  for (const statement of source.statements) if (ts.isImportDeclaration(statement)) {
    const name = statement.moduleSpecifier.text;
    if (name !== 'react' && !Object.hasOwn(bindings, name)) bindings[name] = {};
  }
  return { Component: load('src/App.tsx', bindings).default, calls };
}
const tick = async () => { for (let n = 0; n < 5; n++) await Promise.resolve(); };
async function test(name, run) { await run(); tests++; console.log('PASS ' + name); }

if (baseline) {
  const f = fixture(), html = text(renderShell(shell(f)));
  assert.match(html, /Lendo preferências deste aparelho/);
  assert.match(html, /data-screen="header"/);
  assert.doesNotMatch(html, /data-screen="startup"/);
  console.log(JSON.stringify({ result: 'REPRODUCED', intermediateEmptyShell: true, storagePending: true }));
  process.exit(0);
}

await test('APP_STARTS_LOCAL_READ_DURING_INITIAL_STARTUP_WITHOUT_WAITING_FOR_CATALOG_OR_AUTHORITY', async () => {
  const f = fixture(), { Component, calls } = app(f);
  effects = []; assert.match(text(Component()), /data-screen="startup"/);
  assert.equal(f.reads, 0, 'render must have no I/O');
  const cleanups = effects.map(effect => effect()).filter(value => typeof value === 'function');
  assert.equal(f.reads, 1, 'App must start preferences before AppShell exists');
  assert.equal(f.store.getSnapshot().status, 'loading');
  assert.ok(calls.authorization > 0 && calls.telemetry > 0, 'other boot effects still run while read is pending');
  const ComponentShell = shell(f); assert.match(text(renderShell(ComponentShell)), /data-screen="startup"/);
  const shellCleanups = effects.map(effect => effect()).filter(value => typeof value === 'function');
  assert.equal(f.reads, 1, 'App and shell hook share the existing in-flight read');
  f.resolve(null); await f.store.load(); await tick();
  assert.equal(f.store.getSnapshot().status, 'unconfigured');
  assert.match(text(renderShell(ComponentShell)), /data-catalog/);
  assert.equal(f.writes, 0);
  for (const cleanup of [...cleanups, ...shellCleanups]) cleanup();
});
await test('PENDING_PREFERENCES_SHOW_ONLY_STARTUP_ON_PHONE_TABLET_AND_TV_ALL_INTERNAL_ROUTES', async () => {
  const f = fixture();
  for (const choice of ['TV', 'TABLET', 'PHONE']) {
    const Component = shell(f);
    const Profile = choice === 'TV' ? Component : shell(f, undefined, choice);
    for (const view of ['home', 'movies', 'series', 'live', 'activation', 'settings', 'parental-control']) {
      const html = text(renderShell(Profile, view));
      assert.match(html, /data-screen="startup"/);
      assert.doesNotMatch(html, /Lendo preferências|data-screen="header"|data-catalog|app-shell|data-screen="pin"/);
    }
  }
});
await test('CONFIGURED_POLICY_READY_REMOVES_STARTUP_AND_PRESERVES_LOCAL_POLICY', async () => {
  const f = fixture(), pending = f.store.load();
  f.resolve(JSON.stringify({ version: 1, iterations: 600000,
    pin: { salt: 'a'.repeat(32), hash: 'b'.repeat(64) }, puk: { salt: 'c'.repeat(32), hash: 'd'.repeat(64) },
    policy: { maxAge: 12, allowAdult: false }, failures: 0, blockedUntil: 0, rules: [] }));
  await pending;
  assert.equal(f.store.getSnapshot().status, 'ready');
  const html = text(renderShell(shell(f)));
  assert.match(html, /data-screen="header"/); assert.match(html, /data-catalog/);
  assert.doesNotMatch(html, /data-screen="startup"|Lendo preferências/);
  assert.equal(f.store.getSnapshot().policy.maxAge, 12);
  assert.equal(f.store.getSnapshot().admin, false); assert.equal(f.store.adultVisible(), false);
  assert.equal(f.writes, 0);
});
await test('READ_FAILURE_REMAINS_FAIL_CLOSED_AND_SETTINGS_ACTION_IS_PRESERVED', async () => {
  const f = fixture(), pending = f.store.load(); f.reject(Error('synthetic denied read')); await pending;
  assert.equal(f.store.getSnapshot().status, 'error');
  let destination;
  for (const view of ['home', 'movies', 'series', 'live', 'adult']) {
    const tree = renderShell(shell(f), view, value => { destination = value; }), html = text(tree);
    assert.match(html, /role="alert"/); assert.doesNotMatch(html, /data-catalog/);
    walk(tree, element => element.type === 'button' && element.props.children === 'Abrir configurações').props.onClick();
    assert.equal(destination, 'settings');
  }
  for (const view of ['settings', 'parental-control']) assert.match(text(renderShell(shell(f), view)), /data-catalog/);
  assert.equal(f.writes, 0);
});
await test('REENTRY_AND_CONCURRENT_LOADS_NEVER_REPEAT_LOCAL_READ_OR_CHANGE_SECRETS', async () => {
  const f = fixture(), one = f.store.load(), two = f.store.load(); assert.equal(one, two);
  f.resolve(null); await Promise.all([one, two]);
  for (let n = 0; n < 3; n++) {
    renderShell(shell(f)); const cleanups = effects.splice(0).map(effect => effect()).filter(value => typeof value === 'function');
    await f.store.load(); for (const cleanup of cleanups) cleanup();
  }
  assert.equal(f.reads, 1); assert.equal(f.writes, 0);
  assert.equal(f.store.getSnapshot().status, 'unconfigured');
  assert.equal(f.store.adultVisible(), false);
});
console.log(JSON.stringify({ result: 'PASS', tests, backendRequests: 0, physicalDevices: false, syntheticLifecycle: true }));
