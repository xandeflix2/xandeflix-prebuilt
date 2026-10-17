import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { build } from 'esbuild';
import { DevicePresentationStore, devicePresentationModels, DEVICE_PRESENTATION_KEY, isFireTvPresentation } from '../src/ui/device-presentation.ts';

const dir = 'tmp/c110-device-presentation';
fs.mkdirSync(dir, { recursive: true });
const reports = [];
const pass = name => { reports.push(name); console.log('PASS ' + name); };
const models = Object.entries(devicePresentationModels);
assert.equal(models.length, 8);
for (const [model, info] of models) {
  const values = new Map(), port = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  const store = new DevicePresentationStore(port);
  store.selectModel(model);
  assert.equal(store.read(), info.type);
  assert.equal(store.readModel(), model);
  assert.equal(new DevicePresentationStore(port).readModel(), model);
  assert.equal(values.size, 1);
  assert.deepEqual(JSON.parse(values.get(DEVICE_PRESENTATION_KEY)), { version: 1, type: info.type, model });
  assert.equal(isFireTvPresentation('Android AFTSS', info.type, model), model === 'FIRE_TV');
}
assert.equal(isFireTvPresentation('Android GoogleTV', 'TV', 'FIRE_TV'), true);
assert.equal(isFireTvPresentation('Android AFTSS', 'TV', null), true);
assert.equal(isFireTvPresentation('Android AFTSS', 'PHONE', null), false);
pass('EIGHT_MODELS_KEEP_CANONICAL_BASE_AND_RESTART_EXPLICIT_FIRE_OVERRIDES_UA');

for (const type of ['PHONE', 'TABLET', 'TV']) {
  const legacy = new DevicePresentationStore({ getItem: () => JSON.stringify({ version: 1, type }), setItem() { throw Error('NO_MIGRATION_WRITE'); } });
  assert.equal(legacy.read(), type); assert.equal(legacy.readModel(), null);
  for (const model of ['__proto__', 'unknown', type === 'PHONE' ? 'FIRE_TV' : 'PHONE']) {
    const bad = new DevicePresentationStore({ getItem: () => JSON.stringify({ version: 1, type, model }), setItem() {} });
    assert.equal(bad.read(), type); assert.equal(bad.readModel(), null);
  }
}
pass('LEGACY_V1_READ_ONLY_INVALID_OR_MISMATCHED_MODEL_CANNOT_SPOOF_BASE');

let raw = JSON.stringify({ version: 1, type: 'TV', model: 'FIRE_TV' }), behavior = 'ok';
const store = new DevicePresentationStore({ getItem: () => raw, setItem: (_key, value) => {
  if (behavior === 'denied') throw Error('denied');
  if (behavior === 'lost') return;
  if (behavior === 'drop-model') { const data = JSON.parse(value); delete data.model; raw = JSON.stringify(data); return; }
  raw = value;
} });
let notified = 0;
store.subscribe(() => notified++);
const first = store.readSelection();
for (behavior of ['denied', 'lost', 'drop-model']) {
  assert.throws(() => store.selectModel('ANDROID_TV'));
  assert.equal(store.readSelection(), first); assert.equal(notified, 0);
}
behavior = 'ok'; store.selectModel('ANDROID_TV');
assert.equal(store.read(), 'TV'); assert.notEqual(store.readSelection(), first); assert.equal(notified, 1);
assert.throws(() => store.select('PHONE', 'FIRE_TV')); assert.throws(() => store.selectModel('__proto__'));
pass('FAILED_OR_PARTIAL_PERSISTENCE_NEVER_PUBLISHES_SAME_BASE_MODEL_CHANGE_NOTIFIES');

const root = process.cwd().replaceAll('\\', '/');
const entry = `
import React,{useEffect}from'react';import{createRoot}from'react-dom/client';
import{Capacitor}from'@capacitor/core';
import{DevicePresentationGate}from'${root}/src/ui/components/DevicePresentationGate.tsx';
import{AppShell}from'${root}/src/ui/components/AppShell.tsx';
import{SettingsPage}from'${root}/src/ui/pages/SettingsPage.tsx';
import{useDevicePresentation}from'${root}/src/ui/hooks/useDevicePresentation.ts';
import{useHeroLayout}from'${root}/src/ui/hooks/useHeroLayout.ts';
import{useLivePresentation}from'${root}/src/ui/hooks/useLivePresentation.ts';
import{devicePresentationStore,openDevicePresentation,isFireTvPresentation}from'${root}/src/ui/device-presentation.ts';
Capacitor.isNativePlatform=()=>window.fixtureNative!==false;Capacitor.getPlatform=()=>window.fixtureNative===false?'web':'android';
window.qa={mounts:0,unmounts:0,open:openDevicePresentation,store:devicePresentationStore,fire:()=>isFireTvPresentation(navigator.userAgent)};
function Content(){const choice=useDevicePresentation(),vertical=useHeroLayout(),live=useLivePresentation();
useEffect(()=>{qa.mounts++;return()=>qa.unmounts++;},[]);
return <AppShell currentView="settings" onNavigate={()=>{}}><div id="probe" data-base={choice} data-vertical={vertical} data-square={live.squareLive} data-stacked={live.stackedLive}/><SettingsPage onOpenActivation={()=>{}}/></AppShell>;}
createRoot(document.getElementById('root')).render(<DevicePresentationGate><Content/></DevicePresentationGate>);
`;
const bundled = await build({ stdin: { contents: entry, loader: 'tsx', resolveDir: process.cwd() }, bundle: true, write: false,
  outdir: dir + '/browser-bundle', format: 'iife', define: { __XANDEFLIX_DEBUG_BUILD__: 'false', 'process.env.NODE_ENV': '"development"', 'import.meta.env': '{}' },
  plugins: [{ name: 'isolate-update-network-only', setup(builder) {
    builder.onResolve({ filter: /AppUpdateSettings\.tsx$/ }, () => ({ path: 'update-fixture', namespace: 'fixture' }));
    builder.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({ contents: 'export function AppUpdateSettings(){return null}', loader: 'js' }));
  } }] });
const js = bundled.outputFiles.find(f => f.path.endsWith('.js')).text;
const css = fs.readFileSync('src/index.css', 'utf8') + '\n' + bundled.outputFiles.filter(f => f.path.endsWith('.css')).map(f => f.text).join('\n')
  + '\n#outside{position:fixed;width:1px;height:1px;opacity:0;padding:0}';
const protectedData = { 'fixture.identity': 'unchanged-id', 'fixture.activation': 'unchanged-key', 'fixture.catalog': 'unchanged-catalog' };
const server = http.createServer((req, res) => {
  const q = new URL(req.url, 'http://localhost').searchParams;
  const record = q.has('seed') ? JSON.parse(q.get('seed')) : undefined;
  const seed = record === undefined ? '' : `localStorage.clear();${Object.entries(protectedData).map(([key, value]) => `localStorage.setItem(${JSON.stringify(key)},${JSON.stringify(value)});`).join('')}${record === null ? '' : `localStorage.setItem(${JSON.stringify(DEVICE_PRESENTATION_KEY)},${JSON.stringify(JSON.stringify(record))});`}history.replaceState(null,'','/');`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body><button id="outside">Outside fixture</button><div id="root"></div><script>window.fixtureNative=${q.get('web') !== 'true'};${seed}</script><script>${js.replaceAll('</script', '<\\/script')}</script></body></html>`);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = 'http://127.0.0.1:' + server.address().port;
const browser = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=9796', '--user-data-dir=' + path.resolve(dir, 'browser-' + Date.now()), 'about:blank'], { windowsHide: true, stdio: 'ignore' });
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
let ws, id = 0;
const pending = new Map(), errors = [], external = [];
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const n = ++id, timer = setTimeout(() => { pending.delete(n); reject(Error('CDP_TIMEOUT_' + method)); }, 15000);
  pending.set(n, { resolve, reject, timer }); ws.send(JSON.stringify({ id: n, method, params }));
});
async function evaluate(expression) {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  assert.ok(!r.exceptionDetails, JSON.stringify(r.exceptionDetails)); return r.result.value;
}
async function wait(expression) { for (let n = 0; n < 120; n++) { if (await evaluate(expression)) return; await pause(25); } throw Error('UI_TIMEOUT_' + expression); }
const click = selector => evaluate(`(()=>{const b=document.querySelector(${JSON.stringify(selector)});if(!b)throw Error('MISSING_BUTTON');b.focus();b.click();return true;})()`);
const group = type => click('[data-device-group="' + type + '"]');
const model = type => click('[data-device-model="' + type + '"]');
const key = value => evaluate(`window.dispatchEvent(new KeyboardEvent('keydown',{key:${JSON.stringify(value)},bubbles:true,cancelable:true}))`);
const dialog = "!!document.querySelector('[role=dialog]')";
async function size(width, height, touch = false) {
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
  await send('Emulation.setTouchEmulationEnabled', { enabled: touch, maxTouchPoints: 5 });
  await evaluate("window.dispatchEvent(new Event('resize'))");
}
async function fresh(seed = null, width = 960, height = 540, touch = false, ua = 'Mozilla/5.0 (Linux; Android 12; GoogleTV) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36', web = false) {
  await size(width, height, touch);
  await send('Emulation.setUserAgentOverride', { userAgent: ua });
  await send('Page.navigate', { url: origin + '/?seed=' + encodeURIComponent(JSON.stringify(seed)) + '&web=' + web });
  await wait('!!window.qa && !!document.querySelector(".device-presentation-dialog, #probe")');
}
async function saved(expected) {
  await wait('!(' + dialog + ') && !!document.querySelector("#probe")');
  assert.equal(await evaluate('qa.store.readModel()'), expected);
  assert.equal(await evaluate('qa.mounts'), 1);
  assert.deepEqual(await evaluate(`Object.fromEntries(${JSON.stringify(Object.keys(protectedData))}.map(k=>[k,localStorage.getItem(k)]))`), protectedData);
}
async function screenshot(name) { fs.writeFileSync(dir + '/' + name + '.png', Buffer.from((await send('Page.captureScreenshot', { format: 'png' })).data, 'base64')); }
try {
  let tab;
  for (let n = 0; n < 80; n++) { try { tab = (await fetch('http://127.0.0.1:9796/json/list').then(r => r.json())).find(t => t.url === 'about:blank'); if (tab) break; } catch {} await pause(100); }
  assert.ok(tab); ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }));
  ws.addEventListener('message', e => { const m = JSON.parse(e.data), p = pending.get(m.id);
    if (p) { clearTimeout(p.timer); pending.delete(m.id); m.error ? p.reject(Error(JSON.stringify(m.error))) : p.resolve(m.result); }
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.text);
    if (m.method === 'Network.requestWillBeSent' && !m.params.request.url.startsWith(origin) && !m.params.request.url.startsWith('data:')) external.push(m.params.request.url);
  });
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable'); await send('Emulation.setFocusEmulationEnabled', { enabled: true });
  await fresh();
  assert.equal(await evaluate("document.querySelectorAll('[data-device-group]').length"), 3);
  assert.equal(await evaluate('qa.mounts'), 0);
  await screenshot('first-step-tv');
  await group('PHONE'); await wait("document.querySelectorAll('[data-device-model]').length===2");
  assert.equal(await evaluate('qa.mounts'), 0); assert.equal(await evaluate('qa.store.read()'), null);
  await key('Escape'); await wait("!!document.querySelector('[data-device-group]')");
  assert.equal(await evaluate('document.activeElement.dataset.deviceGroup'), 'PHONE');
  await key('BrowserBack'); assert.equal(await evaluate(dialog), true);
  await group('TV'); await wait("document.querySelectorAll('[data-device-model]').length===5");
  await key('ArrowDown'); assert.equal(await evaluate('document.activeElement.dataset.deviceModel'), 'TIZEN');
  await key('ArrowUp'); assert.equal(await evaluate('document.activeElement.dataset.deviceModel'), 'FIRE_TV');
  assert.equal(await evaluate("[...document.querySelectorAll('.device-presentation-actions button')].every(b=>b.getBoundingClientRect().height>=44)"), true);
  assert.equal(await evaluate("(()=>{const r=document.querySelector('.device-presentation-actions').getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight})()"), true);
  await screenshot('tv-models-960x540');
  assert.equal(await evaluate("window.dispatchEvent(new Event('xandeflix:device-presentation-back',{cancelable:true}))"), false);
  await wait("!!document.querySelector('[data-device-group]')");
  assert.equal(await evaluate('document.activeElement.dataset.deviceGroup'), 'TV');
  assert.equal(await evaluate('qa.mounts'), 0); assert.equal(await evaluate(`localStorage.getItem(${JSON.stringify(DEVICE_PRESENTATION_KEY)})`), null);
  pass('FIRST_INSTALL_THREE_GROUPS_SUBSTEP_NEVER_MOUNTS_APP_BACK_RESTORES_GROUP_AND_BLOCKS_SKIP');

  for (const [name, info] of models) {
    await fresh(null, name === 'PHONE' ? 390 : 960, name === 'PHONE' ? 844 : 540, info.type !== 'TV');
    await group(info.type); if (info.type !== 'TABLET') { await wait(`!!document.querySelector('[data-device-model="${name}"]')`); await model(name); }
    await saved(name);
    assert.equal(await evaluate('qa.store.read()'), info.type);
    assert.equal(await evaluate("document.querySelector('[aria-labelledby=settings-display] strong').textContent"), info.title);
    assert.equal(await evaluate('qa.fire()'), name === 'FIRE_TV');
    await send('Page.reload'); await wait('!!window.qa && !!document.querySelector("#probe")');
    await saved(name);
    assert.equal(await evaluate('document.documentElement.dataset.deviceModel'), name.toLowerCase());
  }
  pass('ALL_EIGHT_CHOICES_REAL_GATE_SETTINGS_AND_RELOAD_NO_IDENTITY_OR_CATALOG_WRITES');

  await fresh(); await group('TV'); await wait("!!document.querySelector('[data-device-model=FIRE_TV]')"); await model('FIRE_TV'); await saved('FIRE_TV');
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.app-shell')).getPropertyValue('--side-nav-width').trim()"), '56px');
  await evaluate('qa.open()'); await wait(dialog); await group('TV'); await wait("!!document.querySelector('[data-device-model=ANDROID_TV]')"); await model('ANDROID_TV'); await saved('ANDROID_TV');
  assert.equal(await evaluate("!!document.querySelector('.app-shell--fire-stick')"), false);
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.app-shell')).getPropertyValue('--side-nav-width').trim()"), '80px');
  assert.equal(await evaluate('qa.unmounts'), 0);
  pass('FIRE_TO_ANDROID_TV_SAME_BASE_UPDATES_ACTUAL_SHELL_WITHOUT_APP_REMOUNT');

  await fresh({ version: 1, type: 'TV' }, 960, 540, false, 'Mozilla/5.0 (Linux; Android 9; AFTSS) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36');
  assert.equal(await evaluate('qa.fire()'), true); assert.equal(await evaluate(dialog), false);
  await evaluate('qa.open()'); await wait(dialog); await group('TV'); await wait("!!document.querySelector('[data-device-model=ANDROID_TV]')"); await model('ANDROID_TV'); await saved('ANDROID_TV'); assert.equal(await evaluate('qa.fire()'), false);
  for (const type of ['PHONE', 'TABLET', 'TV']) { await fresh({ version: 1, type }); assert.equal(await evaluate(dialog), false); assert.equal(await evaluate('qa.store.read()'), type); }
  pass('EXISTING_V1_USERS_SKIP_ONBOARDING_AND_RETAIN_UA_FALLBACK_UNTIL_EXPLICIT_MODEL');

  await fresh(null, 390, 844, true); await group('PHONE'); await wait("!!document.querySelector('[data-device-model=FOLDABLE]')");
  await screenshot('phone-models-390x844');
  const point = await evaluate("(()=>{const r=document.querySelector('[data-device-model=FOLDABLE]').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()");
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] }); await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await saved('FOLDABLE'); assert.equal(await evaluate('document.querySelector("#probe").dataset.vertical'), 'true');
  await size(800, 880, true); await wait('document.querySelector("#probe").dataset.square==="true"');
  assert.equal(await evaluate('document.querySelector("#probe").dataset.vertical'), 'false');
  await size(390, 844, true); await wait('document.querySelector("#probe").dataset.square==="false"');
  assert.equal(await evaluate('document.querySelector("#probe").dataset.vertical'), 'true');
  pass('REAL_TOUCH_FOLDABLE_EXTERNAL_PHONE_AND_OPEN_SQUARE_LAYOUT_RESIZE');

  await fresh(); await key('ArrowRight'); assert.equal(await evaluate('document.activeElement.dataset.deviceGroup'), 'TABLET');
  await key('Enter'); await saved('TABLET');
  await click('[aria-labelledby=settings-display] button'); await wait(dialog);
  await evaluate("document.getElementById('outside').focus()"); assert.equal(await evaluate("!!document.activeElement.closest('[role=dialog]')"), true);
  await group('TV'); await wait("!!document.querySelector('[data-device-model]')");
  await evaluate("[...document.querySelectorAll('[role=dialog] button')].find(b=>b.textContent==='Cancelar').click()");
  await saved('TABLET'); assert.equal(await evaluate('qa.unmounts'), 0);
  assert.equal(await evaluate("document.activeElement.closest('[aria-labelledby=settings-display]')!==null"), true);
  pass('KEYBOARD_ENTER_FOCUS_TRAP_AND_CANCEL_RESTORE_TRIGGER_WITHOUT_SAVING');

  await fresh();
  await evaluate(`window.originalWrite=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===${JSON.stringify(DEVICE_PRESENTATION_KEY)})throw Error('fixture denied');return originalWrite.call(this,k,v)}`);
  await group('PHONE'); await wait("!!document.querySelector('[data-device-model=PHONE]')"); await model('PHONE');
  await wait("!!document.querySelector('[role=alert]')"); assert.equal(await evaluate('qa.mounts'), 0); assert.equal(await evaluate('qa.store.read()'), null);
  await evaluate('Storage.prototype.setItem=originalWrite'); await model('PHONE'); await saved('PHONE');
  pass('STORAGE_DENIED_KEEPS_INITIAL_GATE_RETRY_COMPLETES_ONLY_AFTER_VERIFIED_WRITE');

  await fresh(null, 1280, 800, false, 'Mozilla/5.0 Chrome/120', true);
  assert.equal(await evaluate(dialog), false); assert.equal(await evaluate('qa.mounts'), 1);
  assert.equal(external.length, 0); assert.deepEqual(errors, []);
  pass('WEB_ENTRY_UNCHANGED_NO_EXTERNAL_REQUESTS_OR_BROWSER_EXCEPTIONS');
  fs.writeFileSync(dir + '/tests.json', JSON.stringify({ result: 'PASS', tests: reports.length, reports, realReact: true, nativePlatformMocked: true, physicalDeviceTested: false, externalRequests: external.length }, null, 2));
  console.log(JSON.stringify({ result: 'PASS', tests: reports.length }));
} finally { ws?.close(); browser.kill(); await new Promise(resolve => server.close(resolve)); }
