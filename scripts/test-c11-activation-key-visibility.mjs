import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const root = fileURLToPath(new URL('../', import.meta.url));
assert.equal(path.resolve(process.cwd()), path.resolve(root), 'C11_WORKSPACE_ONLY');
const source = readFileSync(new URL('../src/ui/pages/ActivationPage.tsx', import.meta.url), 'utf8');
const parse = text => ts.createSourceFile('ActivationPage.tsx', text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
function pageBody(file) {
  let body;
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(file) === 'NativeActivationPage') body = node.initializer.body;
    ts.forEachChild(node, visit);
  }
  visit(file);
  assert.ok(body, 'real page body found');
  return body;
}
const ast = parse(source);
const stateNames = pageBody(ast).statements.flatMap(statement => {
  if (!ts.isVariableStatement(statement)) return [];
  return statement.declarationList.declarations.flatMap(declaration =>
    declaration.initializer && ts.isCallExpression(declaration.initializer)
    && declaration.initializer.expression.getText(ast) === 'useState'
      ? [declaration.name.elements[0].name.getText(ast)] : []);
});
// Vite's build-time env is empty in this fixture; no real .env is read.
const compile = text => ts.transpileModule(text.replaceAll('import.meta', '({ env: {} })'), { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
  jsx: ts.JsxEmit.React, esModuleInterop: true,
} }).outputText;
const output = compile(source+'\nexport { NativeActivationPage };'.replace('\\n','\n'));
function pureHelper(name, navigatorFixture) {
  const helper = {};
  vm.runInNewContext(compile(readFileSync(path.resolve(root, 'src/ui/activation', name), 'utf8')), { exports: helper, navigator: navigatorFixture, URL, URLSearchParams });
  return helper;
}

// Runs the real page JSX/copy callback. Effects and every external service are
// deliberately isolated: no App, credentials, Supabase, real storage or backend.
function createHarness(react, loadPage, names, overrides, navigatorFixture, onChange = () => {}) {
  const state = { ...overrides };
  let cursor = 0, blockedCalls = 0;
  const fakeReact = {
    __esModule: true, default: react,
    useState(initial) {
      const name = names[cursor++];
      if (!name) throw new Error('UNEXPECTED_STATE_HOOK');
      if (!Object.hasOwn(state, name)) state[name] = typeof initial === 'function' ? initial() : initial;
      return [state[name], value => {
        state[name] = typeof value === 'function' ? value(state[name]) : value;
        onChange();
      }];
    },
    useEffect() {},
    useCallback: callback => callback,
    useRef: value => ({ current: value }),
  };
  const services = new Proxy({}, { get: () => () => {
    blockedCalls++;
    throw new Error('EXTERNAL_SERVICE_CALL_BLOCKED');
  } });
  const page = loadPage(name => {
    if (name === 'react') return fakeReact;
    if (name.endsWith('/TransportObservabilityDiagnosticBlock.tsx')) return { TransportObservabilityDiagnosticBlock: () => null };
    if (name.endsWith('/ActivationHandoff.tsx')) return { ActivationHandoff: () => null };
    if (name.endsWith('/authorized-device-reactivation.service.ts')) return { AuthorizedDeviceReactivationService: class {} };
    if (name.endsWith('/activation-clipboard.ts')) return pureHelper('activation-clipboard.ts', navigatorFixture);
    if (name.endsWith('/public-activation-url.ts')) return pureHelper('public-activation-url.ts', navigatorFixture);
    if (name.endsWith('/activation-diagnostics.ts')) return pureHelper('activation-diagnostics.ts', navigatorFixture);
    if (name.endsWith('/multi-device-contact.service.ts')) return { whatsappContactUrl: contact => contact && /^[1-9][0-9]{7,14}$/.test(contact.whatsapp) ? 'https://wa.me/' + contact.whatsapp : null };
    return services;
  }, navigatorFixture);
  return {
    state,
    render() {
      cursor = 0;
      const tree = page({ onBack() {}, onOpenSourceSetup() {} });
      if (cursor !== names.length) throw new Error('STATE_HOOK_COUNT_MISMATCH');
      return tree;
    },
    set(patch) { Object.assign(state, patch); onChange(); },
    blockedCalls: () => blockedCalls,
  };
}
const defaults = {
  deviceId: 'synthetic-device-only', displayCode: 'XF-TEST-0001', deviceType: 'PHONE',
  deviceLabel: 'Aparelho sintético', status: 'AUTHORIZED', mode: 'MANAGED',
  localKeyState: 'READY', deviceActivationKey: '123456', sourceConfigured: true,
};
function fixture(overrides = {}, navigatorFixture = { clipboard: { writeText: async () => {} } }, code = output, names = stateNames) {
  return createHarness(React, (require, navigator) => {
    const exports = {};
    vm.runInNewContext(code, { exports, require, navigator });
    return exports.NativeActivationPage;
  }, names, { ...defaults, ...overrides }, navigatorFixture);
}
function nodes(tree, predicate) {
  const found = [];
  function visit(node) {
    if (Array.isArray(node)) { node.forEach(visit); return; }
    if (!node || typeof node !== 'object' || !node.props) return;
    if (predicate(node)) found.push(node);
    visit(node.props.children);
  }
  visit(tree);
  return found;
}
const textOf = node => !node ? '' : Array.isArray(node) ? node.map(textOf).join('')
  : typeof node === 'object' ? textOf(node.props?.children) : String(node);
const handoff = tree => {
  const elements=nodes(tree,node=>node.props?.embedded===true&&Object.hasOwn(node.props,'activationKey'));
  assert.equal(elements.length,1,'one combined credential handoff');return elements[0];
};
const htmlOf = f => renderToStaticMarkup(f.render());
const flush = () => new Promise(resolve => setImmediate(resolve));
let passed = 0;
async function test(name, run) { await run(); passed++; console.log(`PASS ${name}`); }

for (const status of ['UNREGISTERED', 'PENDING_MANAGER_APPROVAL', 'AUTHORIZED']) {
  for (const mode of ['MANAGED', 'SELF_SERVICE']) {
    await test(`REAL_PAGE_SINGLE_KEY_${status}_${mode}`, () => {
      const f = fixture({ status, mode });
      const html = htmlOf(f);
      assert.equal((html.match(/CHAVE PERMANENTE DO DISPOSITIVO/g) || []).length, 1);
      assert.equal((html.match(/123456/g) || []).length, 1, 'same synthetic key, never duplicate');
      assert.equal(handoff(f.render()).props.ready,true);assert.equal(handoff(f.render()).props.activationKey,'123456');assert.doesNotMatch(html,/Copiar chave|Ativar sem gestor/);
      assert.equal(html.includes('ATIVAÇÃO NOVA (A1)'), false, 'support initially collapsed');
      assert.equal(html.includes('Verificar ativação'), false, 'manual operations stay in support');
      f.set({ isSupportOpen: true });
      assert.equal(htmlOf(f).includes('ATIVAÇÃO NOVA (A1)'), status !== 'AUTHORIZED');
      assert.equal(htmlOf(f).includes('Verificar ativação'), status !== 'AUTHORIZED');
      assert.equal(f.blockedCalls(), 0);
    });
  }
}
for (const localKeyState of ['LOADING', 'ERROR']) {
  for (const status of ['UNREGISTERED', 'AUTHORIZED']) {
    await test(`REAL_PAGE_NOT_READY_${status}_${localKeyState}`, () => {
      const f = fixture({ status, localKeyState });
      const html = htmlOf(f);
      assert.doesNotMatch(html, /123456/);
      assert.match(html, localKeyState === 'LOADING' ? /Gerando chave/ : /Falha ao preparar a chave local/);
      assert.equal(handoff(f.render()).props.ready,false);assert.doesNotMatch(html,/Copiar chave/);
      assert.equal(f.blockedCalls(), 0);
    });
  }
}
await test('REAL_JSX_TRANSITION_AND_REMOUNT_KEEP_PROVIDED_KEY', () => {
  const f = fixture({ status: 'UNREGISTERED' });
  htmlOf(f);
  f.set({ status: 'AUTHORIZED', mode: 'MANAGED' });
  assert.match(htmlOf(f), /123456/);
  assert.equal(f.state.deviceActivationKey, '123456');
  assert.equal(f.blockedCalls(), 0);
  assert.match(htmlOf(fixture()), /123456/);
});
await test('REMOTE_AUTH_MISMATCH_STILL_FAILS_CLOSED_WITH_LOCAL_KEY_VISIBLE', () => {
  const f = fixture({ authPreflight: { remoteDeviceStatus: 'REVOKED' } });
  const html = htmlOf(f);
  assert.match(html, /123456/);
  assert.match(html, /Aguardando ativação/);
  assert.doesNotMatch(html, />Autorizado</);
  f.set({ isSupportOpen: true });
  assert.match(htmlOf(f), /ATIVAÇÃO NOVA/);
  assert.doesNotMatch(html, /✓ Dispositivo Autorizado/);
});
await test('DEFAULT_UI_ONLY_CODE_KEY_CONTACT_AND_CLOSED_SUPPORT', () => {
  for (const status of ['UNREGISTERED', 'PENDING_MANAGER_APPROVAL', 'AUTHORIZED']) {
    const f = fixture({ status, contactState: 'READY', multiDeviceContact: { whatsapp: '' }, statusMessage: 'TECHNICAL_INTERNAL_DETAIL' });
    const html = htmlOf(f);
    assert.doesNotMatch(html, /TECHNICAL_INTERNAL_DETAIL|AUTH_UI_STATE|Modo Gerenciado|SOURCE_ID|RECOVERY|ATIVAÇÃO NOVA/);
    assert.match(html, /aria-expanded="false"/);
    assert.match(html, /Quer utilizar uma única licença/);
    assert.match(html, /ainda não informou o WhatsApp/);
    assert.equal(html.includes('>Autorizado<'), status === 'AUTHORIZED');
    assert.ok(html.indexOf('CÓDIGO DO DISPOSITIVO') < html.indexOf('CHAVE PERMANENTE'));
    assert.ok(html.indexOf('CHAVE PERMANENTE') < html.indexOf('Quer utilizar'));
    assert.ok(html.indexOf('Quer utilizar') < html.indexOf('Informações para suporte'));
  }
});
await test('REAL_TOGGLE_OPENS_AND_RETRACTS_TECHNICAL_UI', () => {
  const f = fixture();
  const toggle = () => nodes(f.render(), node => node.type === 'button' && node.props['aria-controls'] === 'activation-support-details')[0];
  toggle().props.onClick();
  assert.match(htmlOf(f), /aria-expanded="true"/);
  assert.match(htmlOf(f), /AUTH_UI_STATE=AUTHORIZED/);
  assert.match(htmlOf(f), /Copiar diagnóstico/);
  toggle().props.onClick();
  assert.doesNotMatch(htmlOf(f), /AUTH_UI_STATE|Copiar diagnóstico|Modo Gerenciado/);
  assert.equal(f.state.deviceActivationKey, '123456');
  assert.equal(f.blockedCalls(), 0);
});
await test('DIAGNOSTIC_CLIPBOARD_EXCLUDES_PERMANENT_KEY_AND_FREE_MESSAGES', async () => {
  const copies = [];
  const f = fixture({ isSupportOpen: true, statusMessage: 'synthetic-private-message' }, { clipboard: { writeText: async value => copies.push(value) } });
  const button = nodes(f.render(), node => node.type === 'button' && textOf(node) === 'Copiar diagnóstico')[0];
  button.props.onClick(); await flush();
  assert.equal(copies.length, 1);
  assert.match(copies[0], /AUTH_UI_STATE=AUTHORIZED/);
  assert.doesNotMatch(copies[0], /123456|synthetic-private-message/);
  assert.match(htmlOf(f), /Diagnóstico copiado/);
});
await test('CONTACT_FAILURE_KEEPS_LOCAL_KEY_AND_RETRY_INDEPENDENT', () => {
  const f = fixture({ contactState: 'ERROR', multiDeviceContact: null, status: 'UNREGISTERED' });
  assert.match(htmlOf(f), /123456/);
  const button = nodes(f.render(), node => node.type === 'button' && textOf(node) === 'Tentar novamente')[0];
  const oldAttempt = f.state.activationAttempt;
  button.props.onClick();
  assert.equal(f.state.contactAttempt, 1);
  assert.equal(f.state.activationAttempt, oldAttempt);
  assert.equal(f.blockedCalls(), 0);
});

// Delivery-time provenance check, optional so this regression test keeps working
// after a future commit advances HEAD to include this fix.
if (process.argv.includes('--compare-head')) {
  const baseline = execFileSync('git', ['show', 'HEAD:src/ui/pages/ActivationPage.tsx'], { cwd: root, encoding: 'utf8' });
  await test('ALL_EXISTING_EFFECTS_HANDLERS_AND_STATUS_LOGIC_UNCHANGED', () => {
    function logic(text) {
      const file = parse(text);
      return pageBody(file).statements.filter(statement => !ts.isReturnStatement(statement)
        && !statement.getText(file).startsWith('const [keyCopyFeedback, setKeyCopyFeedback]'))
        .map(statement => statement.getText(file).replaceAll('\r\n', '\n'));
    }
    assert.deepEqual(logic(source), logic(baseline));
  });
  if (!baseline.includes('const [keyCopyFeedback,')) {
    await test('BASELINE_REPRODUCES_MISSING_KEY_AFTER_AUTHORIZATION', () => {
      const oldNames = stateNames.filter(name => name !== 'keyCopyFeedback');
      const before = htmlOf(fixture({}, undefined, compile(baseline), oldNames));
      assert.doesNotMatch(before, /CHAVE PERMANENTE DO DISPOSITIVO|Copiar chave|123456/);
      assert.match(htmlOf(fixture()), /CHAVE PERMANENTE DO DISPOSITIVO/);
    });
  }
}
console.log(`C11_ACTIVATION_KEY_VISIBILITY=PASS tests=${passed}; synthetic JSX/callback fixtures only`);

if (process.argv.includes('--serve')) {
  const { build } = await import('esbuild');
  const browserCode = `
    import React from 'react';
    import {createRoot} from 'react-dom/client';
    const helperCodes = ${JSON.stringify(Object.fromEntries(['activation-clipboard.ts', 'activation-diagnostics.ts', 'public-activation-url.ts'].map(name => [name, compile(readFileSync(path.resolve(root, 'src/ui/activation', name), 'utf8'))])))};
    function pureHelper(name, navigatorFixture) {
      const exports = {};
      new Function('exports', 'navigator', 'document', helperCodes[name])(exports, navigatorFixture, undefined);
      return exports;
    }
    const createHarness = ${createHarness.toString()};
    const code = ${JSON.stringify(output)};
    const names = ${JSON.stringify(stateNames)};
    const defaults = ${JSON.stringify(defaults)};
    const errors = [], copies = [];
    let rejectCopy = false;
    window.addEventListener('error', () => errors.push('WINDOW_ERROR'));
    window.addEventListener('unhandledrejection', () => errors.push('UNHANDLED_REJECTION'));
    const localFetch = window.fetch.bind(window);
    window.fetch = (input, init) => {
      const url = new URL(input instanceof Request ? input.url : String(input), location.href);
      if (url.origin !== location.origin) { errors.push('EXTERNAL_REQUEST_BLOCKED'); return Promise.reject(new Error('BLOCKED')); }
      return localFetch(input, init);
    };
    const root = createRoot(document.getElementById('root'));
    const navigatorFixture = {clipboard: {writeText: async value => {
      if (rejectCopy) throw new Error('SYNTHETIC_CLIPBOARD_REJECTION');
      copies.push(value);
    }}};
    const harness = createHarness(React, (require, navigator) => {
      const exports = {};
      new Function('exports', 'require', 'navigator', code)(exports, require, navigator);
      return exports.NativeActivationPage;
    }, names, defaults, navigatorFixture, () => queueMicrotask(render));
    function render() { root.render(harness.render()); }
    window.__KEY_VISIBILITY_FIXTURE__ = {
      set: patch => harness.set(patch),
      rejectCopy: value => { rejectCopy = value; },
      evidence: () => ({errors, copies: copies.length, lastCopyMatches: copies.at(-1) === '123456', diagnosticSafe: copies.at(-1)?.includes('AUTH_UI_STATE=AUTHORIZED') && !copies.at(-1)?.includes('123456'), blockedCalls: harness.blockedCalls()})
    };
    render();
  `;
  const result = await build({ stdin: { contents: browserCode, resolveDir: root, sourcefile: 'synthetic-key-fixture.js' }, bundle: true, write: false, platform: 'browser', format: 'iife' });
  const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../src/ui/pages/ActivationPage.css', import.meta.url), 'utf8');
  const server = createServer((req, res) => {
    const name = new URL(req.url, 'http://127.0.0.1:3016').pathname;
    if (name === '/fixture.js') { res.setHeader('Content-Type', 'text/javascript'); res.end(result.outputFiles[0].contents); }
    else if (name === '/fixture.css') { res.setHeader('Content-Type', 'text/css'); res.end(readFileSync(new URL('../src/index.css', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../src/ui/pages/ActivationPage.css', import.meta.url), 'utf8')); }
    else if (name === '/') { res.setHeader('Content-Type', 'text/html'); res.end('<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Chave sintética — fixture isolada</title><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>'); }
    else { res.writeHead(404); res.end(); }
  });
  server.listen(3016, '127.0.0.1', () => console.log('SYNTHETIC_ACTIVATION_KEY_UI=http://127.0.0.1:3016; no external dependencies invoked'));
}
