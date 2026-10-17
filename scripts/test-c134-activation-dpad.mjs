import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { build } from 'esbuild';
import ts from 'typescript';

const dir = 'tmp/c134-parental-preview-overlay', root = process.cwd().replaceAll('\\', '/');
const before = process.argv.includes('--before');
fs.mkdirSync(dir, { recursive: true });
const pagePath = root + '/src/ui/pages/ActivationPage.tsx';
const source = fs.readFileSync(pagePath, 'utf8');
const parse = text => ts.createSourceFile('ActivationPage.tsx', text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
function bodyOf(ast) {
  let body;
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(ast) === 'ActivationPage') body = node.initializer.body;
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.ok(body);
  return body;
}
// All pre-existing auth/source callbacks, effects and derived status remain exact.
const logic = text => {
  const ast = parse(text);
  return bodyOf(ast).statements.filter(s => !ts.isReturnStatement(s)
    && !s.getText(ast).startsWith('const pageRef =')
    && !(ts.isExpressionStatement(s) && s.getText(ast).includes('pageRef.current')))
    .map(s => s.getText(ast).replaceAll('\r\n', '\n'));
};
assert.deepEqual(logic(source), logic(fs.readFileSync(dir + '/ActivationPage-before.tsx', 'utf8')));
assert.match(fs.readFileSync('src/App.tsx', 'utf8'), /case 'activation':[\s\S]*?<ActivationPage\s+onBack=\{handleBack\}\s+showBackButton=\{!canGoBack\}/);

const ast = parse(source), edits = [], imports = new Map();
const defaults = {
  deviceId: 'synthetic-device', displayCode: 'XF-TEST-0001', deviceType: 'TV', status: 'AUTHORIZED',
  mode: 'MANAGED', deviceActivationKey: '123456', localKeyState: 'READY', sourceConfigured: true,
  contactState: 'READY', multiDeviceContact: { whatsapp: '5511999999999' },
  authPreflight: { remoteDeviceStatus: 'AUTHORIZED', importPreflightStatus: 'SOURCE_READY', deviceId: 'synthetic-device',
    localActivationDeviceIdMatch: 'SIM', localDeviceAuthTokenPresent: 'SIM', remoteAuthorityAvailable: 'SIM',
    remoteResultCode: 'SOURCE_READY', licenseAuth: 'PASS', bindingAuth: 'PASS', sourceAuth: 'PASS' },
  deliveryAck: { deliveryResult: 'STORED', sourceId: 'src_fixture', sourceVersion: 1, protocol: 'M3U' },
};
for (const s of bodyOf(ast).statements) {
  // Isolate service effects only; run the new real focus effect with real React.
  if (ts.isExpressionStatement(s) && ts.isCallExpression(s.expression)
      && s.expression.expression.getText(ast) === 'useEffect' && !s.getText(ast).includes('pageRef.current')) {
    edits.push([s.getStart(ast), s.end, '']);
  }
  if (ts.isVariableStatement(s)) for (const d of s.declarationList.declarations) {
    if (!d.initializer || !ts.isCallExpression(d.initializer) || d.initializer.expression.getText(ast) !== 'useState') continue;
    const name = d.name.elements[0].name.getText(ast);
    if (Object.hasOwn(defaults, name)) {
      const argument = d.initializer.arguments[0];
      edits.push([argument.getStart(ast), argument.end, name === 'localKeyState'
        ? '(new URLSearchParams(location.search).has("notReady") ? "LOADING" : "READY")' : JSON.stringify(defaults[name])]);
    }
  }
}
for (const s of ast.statements) if (ts.isImportDeclaration(s) && s.importClause && !s.importClause.isTypeOnly) {
  const names = s.importClause.namedBindings;
  if (names && ts.isNamedImports(names)) imports.set(s.moduleSpecifier.text,
    names.elements.filter(e => !e.isTypeOnly).map(e => e.propertyName?.text || e.name.text));
}
let isolated = source;
for (const [start, end, replacement] of edits.sort((a, b) => b[0] - a[0])) isolated = isolated.slice(0, start) + replacement + isolated.slice(end);
assert.ok(edits.length > 5, 'all service effects isolated and fixture states supplied');
const mocks = Object.fromEntries([...imports].filter(([p]) => p !== 'react' && !p.endsWith('.css')
  && !p.endsWith('activation-diagnostics.ts') && !p.endsWith('activation-clipboard.ts')).map(([p, names]) => [p,
  names.map(name => name === 'AuthorizedDeviceReactivationService' ? 'export class AuthorizedDeviceReactivationService {}'
    : name === 'whatsappContactUrl' ? 'export const whatsappContactUrl=c=>c?"https://wa.me/"+c.whatsapp:null'
    : ['TransportObservabilityDiagnosticBlock', 'ActivationHandoff'].includes(name) ? 'export const ' + name + '=()=>null'
    : 'export const ' + name + '=()=>{window.qa.blocked++;throw Error("SERVICE_FORBIDDEN")}').join(';')
]));
const entry = `import React,{useState}from'react';import{createRoot}from'react-dom/client';
import{ActivationPage}from'${pagePath}';import{SettingsPage}from'${root}/src/ui/pages/SettingsPage.tsx';import{useDpadNavigation}from'${root}/src/ui/hooks/useDpadNavigation.ts';
const model=new URLSearchParams(location.search).get('model');window.qa={model,blocked:0,copies:[],backs:0};
Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>qa.copies.push(text)},configurable:true});
function App(){const standalone=new URLSearchParams(location.search).has('standalone');const[view,setView]=useState(standalone?'activation':'settings');qa.view=view;const tv=!['PHONE','TABLET','FOLDABLE'].includes(model);const back=()=>{qa.backs++;setView('settings')};useDpadNavigation({onBack:back,autoFocusFirst:false});return <div className={standalone?'standalone':'app-shell'+(tv?' app-shell--television':'')+(model!=='PHONE'?' app-shell--side-nav':'')+(model==='FIRE_TV'?' app-shell--fire-stick':'')}><header className="app-header"><nav className="header-nav"><button id="menu" className="focusable-item nav-link active">Configurações</button></nav></header><div className="app-content">{!standalone&&<div className="page-back-row"><button id="back" className="focusable-item" onClick={back}>Voltar externo</button></div>}{view==='settings'?<SettingsPage onOpenActivation={()=>setView('activation')}/>:<ActivationPage onBack={back} onOpenSettings={back} {...(standalone?{}:{showBackButton:false})}/>}</div></div>}createRoot(document.getElementById('root')).render(<App/>);`;
const result = await build({ stdin: { contents: entry, loader: 'tsx', resolveDir: process.cwd() }, bundle: true, write: false, format: 'iife', outdir: dir + '/activation-build',
  define: { 'process.env.NODE_ENV': '"development"', 'import.meta.env': '{}' }, plugins: [{ name: 'activation-presentation-isolation', setup(b) {
    b.onLoad({ filter: /ActivationPage\.tsx$/ }, () => ({ contents: isolated, loader: 'tsx', resolveDir: path.dirname(pagePath) }));
    if (before) b.onLoad({ filter: /useDpadNavigation\.ts$/ }, () => ({ contents: fs.readFileSync(dir + '/useDpadNavigation-before-activation.ts', 'utf8'), loader: 'ts', resolveDir: root + '/src/ui/hooks' }));
    b.onResolve({ filter: /./ }, a => {
      if (mocks[a.path] && a.importer.endsWith('ActivationPage.tsx')) return { path: a.path, namespace: 'mock' };
      if (a.path.endsWith('AppUpdateSettings.tsx')) return { path: 'export const AppUpdateSettings=()=>null', namespace: 'inline' };
      if (a.path.endsWith('ActiveSourceSettings.tsx')) return { path: 'export const ActiveSourceSettings=()=>null', namespace: 'inline' };
      if (a.path.endsWith('useDevicePresentation.ts')) return { path: 'export const useDevicePresentation=()=>"TV"', namespace: 'inline' };
      if (a.path.endsWith('device-presentation.ts')) return { path: 'export const getDevicePresentationModel=()=>null,devicePresentationModels={},openDevicePresentation=()=>{}', namespace: 'inline' };
    });
    b.onLoad({ filter: /.*/, namespace: 'mock' }, a => ({ contents: mocks[a.path], loader: 'tsx', resolveDir: process.cwd() }));
    b.onLoad({ filter: /.*/, namespace: 'inline' }, a => ({ contents: a.path, loader: 'tsx' }));
  } }] });
const js = result.outputFiles.find(f => f.path.endsWith('.js')).text;
const css = fs.readFileSync('src/index.css', 'utf8') + '\n' + result.outputFiles.filter(f => f.path.endsWith('.css')).map(f => f.text).join('\n');
const server = http.createServer((req, res) => {
  if (req.url === '/favicon.ico') { res.writeHead(204); res.end(); return; }
  res.setHeader('Content-Type', 'text/html;charset=utf-8');
  res.end('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>' + css + '</style><div id="root"></div><script>' + js.replaceAll('</script', '<\\/script') + '</script>');
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const origin = 'http://127.0.0.1:' + server.address().port;
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=9835', '--user-data-dir=' + path.resolve(dir, 'activation-browser-' + Date.now()), 'about:blank'], { windowsHide: true, stdio: 'ignore' });
let ws, id = 0;
const pending = new Map(), errors = [], external = [], reports = [], pause = ms => new Promise(r => setTimeout(r, ms));
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const key = ++id, timer = setTimeout(() => { pending.delete(key); reject(Error('CDP_TIMEOUT_' + method)); }, 20000);
  pending.set(key, { resolve, reject, timer }); ws.send(JSON.stringify({ id: key, method, params }));
});
async function evaluate(expression) {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  assert.ok(!r.exceptionDetails, JSON.stringify(r.exceptionDetails)); return r.result.value;
}
async function wait(expression) {
  for (let n = 0; n < 200; n++) { if (await evaluate('Boolean(' + expression + ')')) return; await pause(25); }
  throw Error('UI_TIMEOUT_' + expression);
}
async function key(key) {
  const code = { ArrowUp: 38, ArrowDown: 40, ArrowLeft: 37, ArrowRight: 39, Enter: 13, Escape: 27 }[key];
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code: key, windowsVirtualKeyCode: code });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code: key, windowsVirtualKeyCode: code }); await pause(45);
}
const focus = () => evaluate('document.activeElement.tagName==="BUTTON"?document.activeElement.textContent.trim():document.activeElement.tagName');
const save = async name => fs.writeFileSync(dir + '/' + name + '.png', Buffer.from((await send('Page.captureScreenshot', { format: 'png' })).data, 'base64'));
async function enter() {
  await wait('document.querySelector(".settings-page")');
  await evaluate('[...document.querySelectorAll(".settings-page button")].find(b=>b.textContent==="Ver dados de ativação").focus()');
  await key('Enter'); await wait('document.querySelector(".activation-page")');
}
try {
  let tab;
  for (let n = 0; n < 100; n++) { try { tab = (await fetch('http://127.0.0.1:9835/json/list').then(r => r.json())).find(t => t.url === 'about:blank'); if (tab) break; } catch {} await pause(80); }
  assert.ok(tab); ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r, { once: true }));
  ws.addEventListener('message', e => {
    const m = JSON.parse(e.data), p = pending.get(m.id);
    if (p) { clearTimeout(p.timer); pending.delete(m.id); m.error ? p.reject(Error(JSON.stringify(m.error))) : p.resolve(m.result); }
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.text);
    if (m.method === 'Network.requestWillBeSent' && !m.params.request.url.startsWith(origin) && !m.params.request.url.startsWith('data:')) external.push(new URL(m.params.request.url).origin);
  });
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
  const models = [['FIRE_TV',960,540],['ANDROID_TV',1280,720],['ANDROID_BOX',960,540],['TIZEN',1280,720],['WEBOS',1280,720],['PHONE',390,844],['TABLET',1280,800],['FOLDABLE',800,880]].filter(r => !before || r[0] === 'FIRE_TV');
  for (const [model, width, height] of models) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: origin + '/?model=' + model }); await enter();
    if (!['PHONE','TABLET','FOLDABLE'].includes(model)) assert.equal(await focus(), 'Configurações', 'TV entry focus');
    await evaluate('document.querySelector("#back").focus()'); await key('ArrowDown');
    if (before) { const observed = await focus(); fs.writeFileSync(dir + '/activation-negative.json', JSON.stringify({ expected: 'Configurações', observed }, null, 2)); }
    // Phone has no sidebar/extra Back rule; its touch controls remain accessible.
    if (model === 'PHONE') await evaluate('document.querySelector(".activation-page button").focus()');
    assert.equal(await focus(), 'Configurações', 'top Back reaches activation without a hero');
    assert.equal(await evaluate('[...document.querySelectorAll("button")].filter(b=>b.textContent.includes("Voltar")).length'), 1, 'one Back in shell');
    await key('ArrowDown'); assert.equal(await focus(), 'Copiar chave');
    await key('Enter'); await wait('qa.copies.length===1'); assert.equal(await evaluate('qa.copies[0]'), '123456');
    await key('ArrowDown'); assert.equal(await focus(), 'Falar pelo WhatsApp');
    await key('ArrowDown'); assert.match(await focus(), /Informações para suporte/); await key('Enter');
    await wait('document.querySelector(".activation-page__diagnostic")'); await key('ArrowDown'); assert.equal(await focus(), 'PRE');
    const beforeScroll = await evaluate('document.activeElement.scrollTop'); await key('ArrowDown');
    assert.equal(await focus(), 'PRE'); assert.ok(await evaluate('document.activeElement.scrollTop') > beforeScroll, 'diagnostic scrolls while retaining focus');
    await evaluate('document.activeElement.scrollTop=document.activeElement.scrollHeight'); await key('ArrowDown'); assert.equal(await focus(), 'Copiar diagnóstico');
    await key('Enter'); await wait('qa.copies.length===2'); assert.ok(await evaluate('qa.copies[1].startsWith("XANDEFLIX_SUPPORT_DIAGNOSTIC_V1")')); assert.equal(await evaluate('qa.copies[1].includes("123456")'), false);
    await key('ArrowUp'); assert.equal(await focus(), 'PRE'); await key('ArrowUp'); assert.equal(await focus(), 'PRE');
    await evaluate('document.activeElement.scrollTop=0'); await key('ArrowUp'); assert.match(await focus(), /Informações para suporte/);
    if (model !== 'PHONE') { await key('ArrowLeft'); assert.equal(await evaluate('document.activeElement.id'), 'menu'); await key('ArrowRight'); assert.match(await focus(), /Informações para suporte/); }
    await key('Enter'); assert.equal(await evaluate('!!document.querySelector(".activation-page__diagnostic")'), false);
    await key('ArrowUp'); assert.equal(await focus(), 'Falar pelo WhatsApp'); await key('ArrowUp'); assert.equal(await focus(), 'Copiar chave');
    assert.ok(await evaluate('(()=>{const r=document.activeElement.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight})()'), 'focused action scrolled into view');
    if (model === 'FIRE_TV') await save('activation-fire-copy');
    // Skip disabled and hidden controls without modifying activation state.
    await evaluate('document.activeElement.disabled=true;document.querySelector(".activation-page__whatsapp").hidden=true;document.querySelector(".activation-page button").focus()');
    await key('ArrowDown'); assert.match(await focus(), /Informações para suporte/);
    await key('Escape'); await wait('document.querySelector(".settings-page")'); assert.equal(await evaluate('qa.backs'), 1); assert.equal(await evaluate('qa.blocked'), 0);
    reports.push(model); console.log('PASS ' + model + '_ACTIVATION_ENTRY_ACTIONS_SUPPORT_SCROLL_COPY_BACK');
  }
  await send('Page.navigate', { url: origin + '/?model=FIRE_TV&standalone=1' });
  await wait('document.querySelector(".activation-page__header button")');
  assert.equal(await evaluate('[...document.querySelectorAll("button")].filter(b=>b.textContent.includes("Voltar")).length'), 1, 'standalone retains default Back');
  await evaluate('document.querySelector(".activation-page__header button").focus()'); await key('Enter');
  await wait('document.querySelector(".settings-page")'); assert.equal(await evaluate('qa.backs'), 1);
  assert.deepEqual(errors, []); assert.deepEqual(external, []);
  const report = { result: 'PASS', reports, realPageAndGlobalDpad: true, existingAuthorizationLogicUnchanged: true, serviceEffectsIsolated: true, externalRequests: 0, physicalDevices: false };
  fs.writeFileSync(dir + '/activation-inspection.json', JSON.stringify(report, null, 2)); console.log(JSON.stringify(report));
} catch (error) {
  if (ws) await save(before ? 'activation-before-failure' : 'activation-failure');
  console.log(JSON.stringify({ result: 'FAIL', before, focus: ws ? await focus() : null, message: error.message, expected: error.expected, observed: error.actual })); throw error;
} finally { ws?.close(); chrome.kill(); await new Promise(r => server.close(r)); }
