import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';

const read = (file) => fs.readFileSync(file, 'utf8');
const fixture = { url: 'https://cujbmyhitgomlgwfkaat.supabase.co', publishableKey: 'sb_publishable_synthetic_publication_test' };
const transpile = (file) => ts.transpileModule(read(file), { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
} }).outputText;
function execute(file, context, imports) {
  const exports = {};
  const run = vm.runInContext(`(function(require,exports,module,__dirname){${transpile(file)}\n})`, context);
  run((name) => { assert.ok(Object.hasOwn(imports, name), 'Unexpected import: ' + name); return imports[name]; }, exports, { exports }, process.cwd());
  return exports;
}
let tests = 0;
async function test(name, run) { await run(); tests++; console.log('PASS ' + name); }

async function bootstrap(options = {}) {
  const events = [], root = { textContent: '', setAttribute(name, value) { this[name] = value; } };
  const context = vm.createContext({
    isSecureContext: true, crypto: { subtle: {} }, indexedDB: {},
    __XANDEFLIX_WEB_VALIDATION__: true, __XANDEFLIX_APP_PUBLIC_CONFIG__: fixture,
    document: { getElementById: () => root }, ...options,
  });
  const validation = execute('src/web/validation.ts', context, { '@capacitor/core': { Capacitor: { isNativePlatform: () => false } } });
  const config = execute('src/manager/public-config.ts', context, {});
  // Observe the real asynchronous import without loading App or a source.
  const imports = {
    '../manager/public-config.ts': config, '../web/validation.ts': validation,
  };
  const run = vm.runInContext(`(function(require,exports,module,__dirname){${transpile('src/web-production/main.ts')}\n})`, context);
  run((name) => {
    if (name === '../main.tsx') { events.push(JSON.parse(JSON.stringify(context.__XANDEFLIX_RUNTIME_CONFIG__))); return {}; }
    assert.ok(Object.hasOwn(imports, name)); return imports[name];
  }, {}, { exports: {} }, process.cwd());
  await new Promise((resolve) => setImmediate(resolve));
  return { events, root, context };
}
await test('PUBLIC_CONFIG_INSTALLED_BEFORE_EXISTING_APP_IMPORT', async () => {
  const h = await bootstrap();
  assert.deepEqual(h.events, [{ supabase: fixture }]);
  assert.equal(h.root.role, undefined);
});
await test('INVALID_PROJECT_PRIVATE_OR_MISSING_CONFIG_NEVER_IMPORTS_APP', async () => {
  for (const config of [undefined, { ...fixture, url: 'https://wrong.supabase.co' }, { ...fixture, publishableKey: 'sb_secret_synthetic_private' }]) {
    const h = await bootstrap({ __XANDEFLIX_APP_PUBLIC_CONFIG__: config });
    assert.deepEqual(h.events, []); assert.equal(h.root.role, 'alert');
    assert.doesNotMatch(h.root.textContent, /sb_secret|wrong\.supabase|stack|Error:/);
  }
});
await test('HTTPS_WEBCRYPTO_AND_INDEXEDDB_REQUIRED_BEFORE_APP', async () => {
  for (const options of [{ isSecureContext: false }, { crypto: undefined }, { crypto: {} }, { indexedDB: undefined }]) {
    const h = await bootstrap(options); assert.deepEqual(h.events, []); assert.equal(h.root.role, 'alert');
    assert.equal(h.context.__XANDEFLIX_RUNTIME_CONFIG__, undefined);
  }
});
await test('PUBLIC_BUILD_EXPOSES_ONLY_CANONICAL_PUBLIC_CONFIG', () => {
  const context = vm.createContext({});
  const helper = execute('src/manager/public-config.ts', context, {});
  const config = execute('vite.app.config.ts', context, {
    vite: { defineConfig: (value) => value, loadEnv: (_mode, _root, prefix) => {
      assert.equal(prefix, 'VITE_SUPABASE_');
      return { VITE_SUPABASE_URL: fixture.url, VITE_SUPABASE_PUBLISHABLE_KEY: fixture.publishableKey, VITE_DEBUG_BUILD: 'true', VITE_TMDB_API_KEY: 'synthetic_unrelated_credential' };
    } }, '@vitejs/plugin-react': () => ({}), 'node:path': path, './src/manager/public-config.ts': helper,
  }).default({ mode: 'production' });
  assert.equal(config.base, '/app/'); assert.equal(config.envPrefix.length, 0);
  assert.equal(config.define.__XANDEFLIX_DEBUG_BUILD__, 'false');
  assert.equal(config.define.__XANDEFLIX_WEB_VALIDATION__, 'true');
  assert.equal(config.define.__XANDEFLIX_WEB_PUBLIC__, 'true');
  assert.deepEqual(JSON.parse(config.define.__XANDEFLIX_APP_PUBLIC_CONFIG__), fixture);
  assert.doesNotMatch(JSON.stringify(config), /synthetic_unrelated_credential/);
  assert.equal(config.build.sourcemap, false);
});
await test('PUBLIC_RUNTIME_PRESERVES_LOCAL_CATALOG_FETCH_AND_SEARCH_INPUT_WITHOUT_BADGE', async () => {
  for (const publicBuild of [true, false]) {
    const listeners = [], dataset = {}, window = { addEventListener: (name) => listeners.push(name), fetch: async () => new Response('direct') };
    const context = vm.createContext({
      window, document: { documentElement: { dataset }, querySelector: () => null, createElement: () => { throw Error('BADGE_REACHED'); } },
      __XANDEFLIX_WEB_PUBLIC__: publicBuild, URL, Request, location: new URL('https://app.example.test/app'),
    });
    const runtime = execute('src/web/web-runtime.ts', context, {
      './validation.ts': { isWebValidation: () => true }, '../ui/device-presentation.ts': {},
      '../bootstrap/boot-sync-coordinator.ts': { getBootSyncCoordinator: () => ({ subscribe: () => {} }) },
      '@capacitor/core': {}, './web-catalog-files.ts': { readWebCatalogFile: async (url) => url.pathname.startsWith('/DATA/prebuilt/') ? new Response('local-catalog') : undefined },
      '../playback/playback.service.ts': {}, './web-runtime.css': {},
    });
    if (publicBuild) runtime.mountWebRuntimeNotice();
    else assert.throws(() => runtime.mountWebRuntimeNotice(), /BADGE_REACHED/, 'Local conference badge remains available');
    assert.equal(dataset.webValidation, 'true'); assert.deepEqual(listeners, ['keydown']);
    assert.equal(await (await window.fetch('https://app.example.test/DATA/prebuilt/catalog.json')).text(), 'local-catalog');
    assert.equal(await (await window.fetch('https://provider.example.test/fixture')).text(), 'direct');
  }
});
await test('MANAGER_ROUTES_REMAIN_EXACT_AND_APP_DOES_NOT_CAPTURE_OTHER_PATHS', () => {
  const config = JSON.parse(read('vercel.json'));
  assert.equal(config.buildCommand, 'npm run site:build');
  assert.deepEqual(config.rewrites, ['/', '/admin', '/master', '/manager', '/manager-reset-password', '/app', '/app/'].map((source, index) => ({ source, destination: index < 5 ? '/manager.html' : '/app/app.html' })));
  assert.equal(config.headers[0].headers.find((row) => row.key === 'X-Frame-Options').value, 'DENY');
  assert.ok(!config.rewrites.some((row) => /api|DATA|\*/.test(row.source)));
  const scripts = JSON.parse(read('package.json')).scripts;
  assert.ok(scripts['site:build'].startsWith('npm run c11:new-device:lock && tsc && '));
  assert.equal(scripts.prebuild, 'npm run c11:new-device:lock');
  assert.equal(scripts['web:build'], 'npm run c11:new-device:lock && tsc && vite build --mode web');
});

const site = 'tmp/c154-web-production/site';
const files = fs.readdirSync(site, { recursive: true }).filter((file) => fs.statSync(path.join(site, file)).isFile());
const appScripts = files.filter((file) => file.replaceAll('\\', '/').startsWith('app/') && file.endsWith('.js')).map((file) => read(path.join(site, file))).join('\n');
await test('ASSEMBLED_HTML_USES_INDEPENDENT_APP_AND_MANAGER_ASSETS', () => {
  const manager = read(`${site}/manager.html`), app = read(`${site}/app/app.html`);
  assert.match(manager, /Painel administrativo/); assert.match(app, /<title>Xandeflix<\/title>/);
  assert.match(app, /src="\/app\/assets\//); assert.match(manager, /src="\/assets\//);
  for (const html of [manager, app]) for (const match of html.matchAll(/(?:src|href)="(\/[^\"]+)"/g)) assert.ok(fs.existsSync(path.join(site, match[1])));
  assert.ok(!files.some((file) => /\.map$|\.env|\.apk$|\.jks$|\.pem$|\.log$|catalog\.json$/i.test(file)));
});
await test('REAL_PUBLIC_BUNDLE_HAS_WEB_PLAYER_STORE_AND_NO_CONFERENCE_OR_DEBUG_UI', () => {
  assert.ok(appScripts.includes(fixture.url)); assert.match(appScripts, /sb_publishable_/);
  assert.ok(files.some((file) => /web-player-.*\.js$/.test(file)));
  assert.ok(files.some((file) => /web-source-store-.*\.js$/.test(file)));
  assert.doesNotMatch(appScripts, /Conferência web|Copiar diagnóstico web|Gestor \(Lab\)|Fonte \(Debug\)/);
  assert.doesNotMatch(appScripts, /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\bsb_secret_[A-Za-z0-9_-]{20,}|\b(?:gh[pousr]_|github_pat_)[A-Za-z0-9_]{30,}/);
});
assert.equal(tests, 8);
console.log(`C154_PUBLIC_SITE_TESTS=${tests}/8_PASS`);
