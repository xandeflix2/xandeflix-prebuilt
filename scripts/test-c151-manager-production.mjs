import fs from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
let tests = 0;
async function test(name, run) { await run(); tests++; console.log('PASS ' + name); }
function compile(file, ports = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React,
  } }).outputText;
  new Function('require', 'module', 'exports', code)(name => {
    if (name === 'react') return { default: React, ...React };
    assert.ok(Object.hasOwn(ports, name), 'controlled dependency: ' + name);
    return ports[name];
  }, module, module.exports);
  return module.exports;
}
const { resolveManagerPublicConfig } = compile('src/manager/public-config.ts');
const fixture = { url: 'https://cujbmyhitgomlgwfkaat.supabase.co', key: 'sb_publishable_synthetic_test_only' };
await test('CANONICAL_PUBLIC_ENV_ONLY_NO_SECRET_OR_OTHER_PROJECT', () => {
  assert.deepEqual(resolveManagerPublicConfig({ VITE_SUPABASE_URL: fixture.url, VITE_SUPABASE_PUBLISHABLE_KEY: fixture.key }), fixture);
  for (const url of ['', 'https://other-project.supabase.co', 'http://cujbmyhitgomlgwfkaat.supabase.co', fixture.url + '/path']) {
    assert.throws(() => resolveManagerPublicConfig({ VITE_SUPABASE_URL: url, VITE_SUPABASE_PUBLISHABLE_KEY: fixture.key }));
  }
  for (const key of ['', 'sb_secret_fixture', 'eyJhbGciOiJIUzI1NiJ9.fixture', 'your-supabase-anon-or-publishable-key']) {
    assert.throws(() => resolveManagerPublicConfig({ VITE_SUPABASE_URL: fixture.url, VITE_SUPABASE_PUBLISHABLE_KEY: key }));
  }
});
function harness({ config = fixture, client = {}, error } = {}) {
  const events = [], authorities = [];
  const Panel = () => React.createElement('main', null, 'manager');
  const Recovery = () => null;
  const { createManagerApplication } = compile('src/manager/ManagerApplication.tsx', {
    '../debug/manager/ManagerPanelPage.tsx': { ManagerPanelPage: Panel },
    '../debug/manager/ManagerPasswordRecovery.tsx': { ManagerPasswordRecovery: Recovery },
    '../debug/manager/manager-password-recovery.ts': { isManagerRecoveryLocation: location => {
      events.push('intent'); return location.pathname === '/manager-reset-password' || new URLSearchParams(location.hash.slice(1)).get('type') === 'recovery';
    } },
    '../integrations/supabase/runtime-config.ts': { getSupabaseRuntimeConfig: () => config },
    '../integrations/supabase/client.ts': { getSupabaseBrowserClient: () => { events.push('sdk'); if (error) throw error; return client; },
      createSupabaseManagerAuthClient: value => { assert.equal(value, client); return { auth: 'synthetic' }; } },
    '../control-plane/client/manager-remote-control-plane-authority.ts': {
      SupabaseManagerRemoteControlPlaneAuthority: class { constructor(value) { this.client = value; } },
      configureManagerRemoteControlPlaneAuthority: value => authorities.push(value),
    },
    './public-config.ts': { resolveManagerPublicConfig },
  });
  const location = { pathname: '/', hash: '', search: '' };
  return { run: override => createManagerApplication({ ...location, ...override }), Panel, Recovery, authorities, events };
}
await test('DEDICATED_MANAGER_BOOTSTRAPS_REMOTE_AUTH_WITHOUT_DEVICE_OR_CATALOG', () => {
  const h = harness(), node = h.run(); assert.equal(node.type, h.Panel);
  assert.equal(h.authorities.length, 1); assert.equal(h.authorities[0].client.auth, 'synthetic');
  assert.deepEqual(h.events, ['intent', 'sdk']);
});
await test('MISSING_WRONG_PROJECT_SECRET_AND_CLIENT_FAILURE_FAIL_CLOSED', () => {
  for (const options of [{ config: null }, { config: { ...fixture, url: 'https://wrong.supabase.co' } },
    { config: { ...fixture, key: 'sb_secret_fixture' } }, { client: undefined, error: Error('synthetic SDK error') }, { client: null }]) {
    const h = harness(options), node = h.run();
    assert.equal(node.type, 'main'); assert.match(renderToStaticMarkup(node), /role="alert"/);
    assert.deepEqual(h.authorities, [undefined]);
    assert.notEqual(node.type, h.Panel); assert.notEqual(node.type, h.Recovery);
    if (options.config !== undefined) assert.ok(!h.events.includes('sdk'), 'invalid public config must not initialize SDK');
  }
});
await test('RECOVERY_INTENT_CAPTURED_BEFORE_SDK_AND_ERRORS_NOT_LOGGED', () => {
  for (const route of [{ pathname: '/manager-reset-password' }, { hash: '#type=recovery&access_token=synthetic' }]) {
    const h = harness(), node = h.run(route); assert.equal(node.type, h.Recovery);
    assert.deepEqual(h.events, ['intent', 'sdk']);
    assert.equal(node.props.recoveryLink, Boolean(route.hash));
    assert.ok(!Object.hasOwn(node.props, 'access_token'));
  }
  const h = harness(), node = h.run({ pathname: '/manager-reset-password', search: '?error=synthetic' });
  assert.equal(node.props.linkError, true);
});
await test('PUBLIC_CONFIG_IS_INSTALLED_BEFORE_REAL_ENTRY_BOOTSTRAPS', () => {
  const names = ['window', 'document', '__XANDEFLIX_RUNTIME_CONFIG__', '__XANDEFLIX_MANAGER_PUBLIC_CONFIG__'];
  const previous = new Map(names.map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  let mounted = 0;
  try {
    globalThis.window = { location: { pathname: '/', hash: '', search: '' } };
    globalThis.document = { getElementById: () => ({}) };
    globalThis.__XANDEFLIX_MANAGER_PUBLIC_CONFIG__ = { url: fixture.url, publishableKey: fixture.key };
    delete globalThis.__XANDEFLIX_RUNTIME_CONFIG__;
    compile('src/manager/main.tsx', {
      'react-dom/client': { default: { createRoot: () => ({ render: () => { mounted++; } }) } },
      './ManagerApplication.tsx': { createManagerApplication: location => {
        assert.equal(location, globalThis.window.location);
        assert.deepEqual(globalThis.__XANDEFLIX_RUNTIME_CONFIG__, { supabase: { url: fixture.url, publishableKey: fixture.key } });
        return React.createElement('main');
      } }, '../index.css': {},
    });
    assert.equal(mounted, 1);
  } finally {
    for (const name of names) {
      const descriptor = previous.get(name);
      if (descriptor) Object.defineProperty(globalThis, name, descriptor); else delete globalThis[name];
    }
  }
});
await test('VERCEL_ROUTES_BUILD_AND_ARTIFACT_BOUNDARY', () => {
  const config = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  assert.equal(config.buildCommand, 'npm run manager:build');
  assert.equal(config.outputDirectory, 'tmp/c151-manager-production/site'); assert.equal(Object.hasOwn(config, 'public'), false);
  assert.deepEqual(config.rewrites.map(rule => rule.source), ['/', '/admin', '/master', '/manager', '/manager-reset-password']);
  assert.ok(config.rewrites.every(rule => rule.destination === '/manager.html'));
  assert.ok(!config.rewrites.some(rule => rule.source.includes('*')));
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  assert.match(pkg.scripts['manager:build'], /^npm run c11:new-device:lock && tsc && vite build --config vite.manager.config.ts$/);
  for (const file of ['.env', '.env.*', 'tmp', 'android/app/build', '*.apk', 'secrets', 'credentials']) {
    assert.ok(fs.readFileSync('.vercelignore', 'utf8').split(/\r?\n/).includes(file));
  }
  assert.ok(!fs.readFileSync('.vercelignore', 'utf8').split(/\r?\n/).includes('android'), 'activation lock needs native manifest/XML on remote builds');
});
await test('BUILD_ENV_IS_EXPLICIT_AND_APP_DEBUG_ENTRY_NOT_IMPORTED', () => {
  const config = fs.readFileSync('vite.manager.config.ts', 'utf8');
  assert.match(config, /envPrefix: \[\]/); assert.match(config, /__XANDEFLIX_DEBUG_BUILD__: 'false'/);
  assert.match(config, /__XANDEFLIX_MANAGER_PUBLIC_CONFIG__:/);
  assert.doesNotMatch(config, /controlPlaneApiPlugin|VITE_TMDB/);
  const source = fs.readFileSync('src/manager/main.tsx', 'utf8') + fs.readFileSync('src/manager/ManagerApplication.tsx', 'utf8');
  assert.doesNotMatch(source, /from ['"].*App['"]|DevicePresentationGate|startNonBlockingSync|configureDeviceSourceDelivery|bootTelemetry/);
});
console.log(JSON.stringify({ result: 'PASS', tests, remoteWrites: 0, physicalBrowser: false }));
