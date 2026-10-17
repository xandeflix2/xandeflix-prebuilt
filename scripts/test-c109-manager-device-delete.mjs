import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';
import ts from 'typescript';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const dir = 'tmp/c109-device-delete';
fs.mkdirSync(dir, { recursive: true });
let tests = 0;
const reports = [];
function pass(name) { tests++; reports.push(name); console.log('PASS ' + name); }
function load(file, ports = {}) {
  const module = { exports: {} };
  new Function('require', 'module', 'exports', ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React, esModuleInterop: true }
  }).outputText)(name => name === 'react' ? React : name.endsWith('.css') ? {} : ports[name] || (() => { throw Error('UNKNOWN_IMPORT_' + name); })(), module, module.exports);
  return module.exports;
}
const editor = load('src/debug/manager/ManagerLicenseEditor.tsx', {
  './ManagerDeviceRegistrationFields.tsx': { ManagerDeviceRegistrationFields: () => null },
  './manager-activation-feedback.ts': { managerActivationFailure: () => 'Fixture error' }
});
for (const code of ['MASTER_REQUIRED', 'MANAGER_AUTH_REQUIRED', 'CUSTOMER_SHARED_IDENTITY', 'CROSS_CUSTOMER_BINDING_DENIED', 'CUSTOMER_ID_REQUIRED', 'PRIMARY_HAS_SECONDARIES']) {
  const message = editor.managerDeletionFailure(Error(code), true);
  assert.equal(typeof message, 'string'); assert.ok(message.length > 20); assert.ok(!message.includes(code));
}
for (const code of ['toString', '__proto__', 'constructor', 'https://fixture.invalid/?token=synthetic', 'unknown']) {
  const message = editor.managerDeletionFailure(Error(code), true);
  assert.equal(typeof message, 'string'); assert.doesNotMatch(message, /token|https|constructor|__proto__|toString/);
}
pass('CLOSED_ERROR_MESSAGES_KNOWN_GUARDS_AND_MALICIOUS_UNKNOWN_VALUES');
const device = { deviceId: 'synthetic-legacy', displayCode: 'XF-C109-LEG1', deviceLabel: 'Legacy test', deviceType: 'TABLET', platform: 'ANDROID', status: 'AUTHORIZED' };
const license = { licenseId: '11111111-1111-4111-8111-111111111111', customerId: null, mode: 'MANAGED', status: 'ACTIVE', maxDevices: 1, maxConcurrentSessions: 1, activeDeviceCount: 1, createdAt: '2026-10-15', devices: [device] };
const ports = { './ManagerLicenseEditor.tsx': { ManagerLicenseEditor: () => null }, './license-device-summary.ts': load('src/debug/manager/license-device-summary.ts') };
const before = load(dir + '/AdminLicensesView.tsx', ports).AdminLicensesView;
const after = load('src/debug/manager/AdminLicensesView.tsx', ports).AdminLicensesView;
const props = { licenses: [license], authority: { deleteDevicePermanently() { throw Error('SSR_MUST_NOT_MUTATE'); } }, isMaster: true, onUpdated: async () => {}, onInspectLicense: async () => null, onSuspendLicense: async () => true, onRevokeLicense: async () => true, onUpdateLimits: async () => true };
assert.doesNotMatch(renderToStaticMarkup(React.createElement(before, props)), /aria-label="Excluir/);
assert.match(renderToStaticMarkup(React.createElement(after, props)), /aria-label="Excluir dispositivo XF-C109-LEG1"/);
assert.doesNotMatch(renderToStaticMarkup(React.createElement(after, { ...props, isMaster: false })), /aria-label="Excluir/);
pass('REPRODUCED_LEGACY_MISSING_ACTION_BEFORE_MASTER_ACTION_AFTER_ADMIN_HIDDEN');

const root = process.cwd().replaceAll('\\', '/');
const entry = `
import React,{useState}from'react';import{createRoot}from'react-dom/client';
import{AdminLicensesView}from'${root}/src/debug/manager/AdminLicensesView.tsx';
import{SupabaseManagerRemoteControlPlaneAuthority as Authority}from'${root}/src/control-plane/client/manager-remote-control-plane-authority.ts';
const qa=window.qa={calls:[],deleted:[],mode:'ok',updates:0,refreshFail:false,pendingResolve:null};
const ids=['11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333'];
const dev=(id,code,role,primary)=>({deviceId:id,displayCode:code,deviceLabel:'Synthetic test',deviceType:'PHONE',platform:'ANDROID',status:'AUTHORIZED',deviceRole:role,primaryDisplayCode:primary});
const devices=[dev('self','XF-C109-MOB1'),dev('legacy','XF-C109-LEG1'),dev('primary','XF-C109-PRI1','PRIMARY'),dev('secondary','XF-C109-SEC1','SECONDARY','XF-C109-PRI1')];
const licenses=ids.map((id,n)=>({licenseId:id,customerId:n===1?null:id,customerNickname:n===1?null:'Synthetic customer',mode:n===0?'SELF_SERVICE':'MANAGED',status:'ACTIVE',maxDevices:2,maxConcurrentSessions:1,activeDeviceCount:n===2?2:1,createdAt:'2026-10-15',devices:n===2?devices.slice(2):[devices[n]]}));
const client={auth:{getSession:async()=>({data:{session:{user:{id:ids[0]}}}})},rpc:async(name,args)=>{
qa.calls.push({name,args});
if(name==='rpc_manager_customer_delete_preview')return{error:{message:qa.mode==='raw'?'https://fixture.invalid/?token=synthetic':'CUSTOMER_SHARED_IDENTITY'}};
if(name!=='rpc_manager_delete_device_permanently')throw Error('UNEXPECTED_MUTATION');
if(qa.mode==='pending')await new Promise(r=>qa.pendingResolve=r);
if(qa.mode==='fail')return{error:{message:'MASTER_REQUIRED'}};
if(qa.mode==='false')return{data:{success:false}};
qa.deleted.push(args.p_device_id);return{data:{success:true}};
}};
const authority=new Authority(client);
function App(){const[role,setRole]=useState('MASTER'),[generation,setGeneration]=useState(0);qa.setRole=setRole;qa.unmount=()=>setRole('USER');
return <main><AdminLicensesView licenses={licenses.map(l=>({...l,devices:l.devices.filter(d=>!qa.deleted.includes(d.deviceId))}))} authority={authority} isMaster={role==='MASTER'} onUpdated={async()=>{qa.updates++;if(qa.refreshFail)throw Error('synthetic refresh failure');setGeneration(generation+1);}} onInspectLicense={async()=>null} onSuspendLicense={async()=>true} onRevokeLicense={async()=>true} onUpdateLimits={async()=>true}/></main>;}
createRoot(document.getElementById('root')).render(<App/>);
`;
const bundled = (await build({ stdin: { contents: entry, loader: 'tsx', resolveDir: process.cwd() }, bundle: true, write: false, outdir: dir + '/browser-bundle', format: 'iife', define: { 'process.env.NODE_ENV': '"development"' } })).outputFiles.find(file => file.path.endsWith('.js')).text;
const css = fs.readFileSync('src/index.css', 'utf8') + '\n' + fs.readFileSync('src/debug/manager/AdminLicensesView.css', 'utf8') + '\n' + fs.readFileSync('src/debug/manager/ManagerLicenseEditor.css', 'utf8');
const server = http.createServer((_req, res) => { res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body><div id="root"></div><script>${bundled.replaceAll('</script', '<\\/script')}</script></body></html>`); });
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=9792', '--user-data-dir=' + path.resolve(dir, 'browser-' + Date.now()), 'about:blank'], { windowsHide: true, stdio: 'ignore' });
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
let ws, id = 0; const pending = new Map();
const send = (method, params = {}) => new Promise((resolve, reject) => { const n = ++id, timer = setTimeout(() => reject(Error('CDP_TIMEOUT')), 15000); pending.set(n, { resolve, reject, timer }); ws.send(JSON.stringify({ id: n, method, params })); });
const evaluate = async expression => { const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); assert.ok(!r.exceptionDetails, 'BROWSER_EVALUATION_FAILED'); return r.result.value; };
async function wait(expression, max = 100) { for (let n = 0; n < max; n++) { if (await evaluate(expression)) return; await pause(25); } throw Error('UI_CONDITION_TIMEOUT'); }
async function fresh(width = 1280) { await send('Emulation.setDeviceMetricsOverride', { width, height: width < 600 ? 844 : 900, deviceScaleFactor: 1, mobile: false }); await send('Page.navigate', { url: 'http://127.0.0.1:' + server.address().port + '/?run=' + Math.random() }); await wait("!!document.querySelector('button[aria-label=\"Excluir dispositivo XF-C109-LEG1\"]')"); }
async function open(code) { await evaluate(`(()=>{const b=document.querySelector('button[aria-label="Excluir dispositivo ${code}"]');b.focus();b.click();return true;})()`); await wait("!!document.querySelector('dialog[open] input')"); }
async function type(value) { await evaluate(`(()=>{const e=document.querySelector('dialog[open] input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));return true;})()`); await pause(20); }
const submit = () => evaluate("(()=>{document.querySelector('dialog[open] form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));return true;})()");
try {
  let tab; for (let n = 0; n < 60; n++) { try { tab = (await fetch('http://127.0.0.1:9792/json/list').then(r => r.json())).find(t => t.url === 'about:blank'); if (tab) break; } catch {} await pause(100); }
  assert.ok(tab); ws = new WebSocket(tab.webSocketDebuggerUrl); await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }));
  ws.addEventListener('message', e => { const m = JSON.parse(e.data), p = pending.get(m.id); if (!p) return; clearTimeout(p.timer); pending.delete(m.id); m.error ? p.reject(Error('CDP_ERROR')) : p.resolve(m.result); });
  await send('Page.enable'); await send('Emulation.setFocusEmulationEnabled', { enabled: true });
  for (const width of [1280, 390]) {
    await fresh(width); await open('XF-C109-LEG1');
    assert.equal(await evaluate('qa.calls.length'), 0); await type('wrong'); await submit(); assert.equal(await evaluate('qa.calls.length'), 0);
    assert.equal(await evaluate("document.querySelector('dialog[open] button[type=submit]').disabled"), true);
    const layout = await evaluate("(()=>{const d=document.querySelector('dialog[open]'),r=d.getBoundingClientRect();return{left:r.left,right:r.right,width:innerWidth,hasCustomerAction:d.textContent.includes('Excluir cliente e todos os dispositivos')};})()");
    assert.ok(layout.left >= 0 && layout.right <= layout.width); assert.equal(layout.hasCustomerAction, false);
    await type('  xf-c109-leg1  '); await wait("!document.querySelector('dialog[open] button[type=submit]').disabled"); await submit();
    await wait("document.querySelector('dialog[open] [role=status]')?.textContent.includes('confirmada')");
    const result = await evaluate('({calls:qa.calls,deleted:qa.deleted,updates:qa.updates})');
    assert.deepEqual(result.calls, [{ name: 'rpc_manager_delete_device_permanently', args: { p_device_id: 'legacy', p_confirmation_code: 'XF-C109-LEG1' } }]);
    assert.deepEqual(result.deleted, ['legacy']); assert.equal(result.updates, 1);
    await evaluate("document.querySelector('dialog[open]').dispatchEvent(new Event('cancel',{cancelable:true}))"); await wait("!document.querySelector('dialog[open]')");
    pass('LEGACY_EXACT_DEVICE_ONLY_NORMALIZED_CODE_NO_PREVIEW_NO_OPEN_MUTATION_' + width);
  }
  await fresh(); await open('XF-C109-MOB1'); await evaluate("[...document.querySelectorAll('dialog[open] button')].find(b=>b.textContent.startsWith('Excluir cliente e todos')).click()");
  await wait("document.querySelector('dialog[open] [role=alert]')?.textContent.includes('administrativa ou compartilhada')");
  assert.deepEqual(await evaluate('qa.calls.map(c=>c.name)'), ['rpc_manager_customer_delete_preview']);
  assert.equal(await evaluate('qa.deleted.length'), 0); assert.equal(await evaluate("!!document.querySelector('dialog[open] form')"), false);
  pass('SEPARATE_CUSTOMER_PREVIEW_STAFF_GUARD_NO_CUSTOMER_OR_DEVICE_DELETE');
  await fresh(); await evaluate("qa.mode='raw'"); await open('XF-C109-MOB1'); await evaluate("[...document.querySelectorAll('dialog[open] button')].find(b=>b.textContent.startsWith('Excluir cliente e todos')).click()");
  await wait("!!document.querySelector('dialog[open] [role=alert]')"); assert.doesNotMatch(await evaluate("document.querySelector('dialog[open] [role=alert]').textContent"), /https|token|fixture/);
  pass('CUSTOMER_PREVIEW_UNKNOWN_RPC_MESSAGE_NOT_EXPOSED');
  for (const mode of ['fail', 'false']) {
    await fresh(); await evaluate(`qa.mode=${JSON.stringify(mode)}`); await open('XF-C109-MOB1'); await type('XF-C109-MOB1'); await submit();
    await wait("!!document.querySelector('dialog[open] [role=alert]')"); assert.equal(await evaluate('qa.deleted.length'), 0); assert.equal(await evaluate('qa.updates'), 0);
    assert.equal(await evaluate("!!document.querySelector('dialog[open] [role=status]')"), false);
    pass('RPC_' + mode.toUpperCase() + '_NO_FALSE_SUCCESS_OR_REFRESH');
  }
  await fresh(); await evaluate("qa.mode='pending'"); await open('XF-C109-MOB1'); await type('XF-C109-MOB1'); await submit(); await submit();
  await wait('qa.calls.length===1&&!!qa.pendingResolve');
  assert.equal(await evaluate("[...document.querySelectorAll('dialog[open] button')].every(b=>b.disabled)"), true);
  await evaluate("document.querySelector('dialog[open]').dispatchEvent(new Event('cancel',{cancelable:true}))"); assert.equal(await evaluate("!!document.querySelector('dialog[open]')"), true);
  await evaluate('qa.pendingResolve()'); await wait("!!document.querySelector('dialog[open] [role=status]')"); assert.equal(await evaluate('qa.calls.length'), 1);
  pass('DOUBLE_SUBMIT_GUARD_AND_CLOSE_BLOCKED_WHILE_RPC_PENDING');
  await fresh(); await evaluate('qa.refreshFail=true'); await open('XF-C109-MOB1'); await type('XF-C109-MOB1'); await submit();
  await wait("document.querySelector('dialog[open] [role=status]')?.textContent.includes('lista não pôde ser atualizada')");
  assert.equal(await evaluate("!!document.querySelector('dialog[open] form')"), false); assert.equal(await evaluate('qa.deleted.length'), 1);
  pass('DELETE_ACK_CONFIRMED_REFRESH_FAILED_CANNOT_DELETE_AGAIN');
  await fresh(); await open('XF-C109-PRI1'); await type('XF-C109-PRI1'); await submit(); assert.equal(await evaluate('qa.calls.length'), 0);
  assert.match(await evaluate("document.querySelector('dialog[open] [role=alert]').textContent"), /Transfira/);
  pass('PRINCIPAL_WITH_SECONDARIES_NOT_DELETED_BY_SINGLE_DEVICE_FORM');
  await fresh(); await evaluate("document.querySelector('button[aria-expanded=false]').click()"); await open('XF-C109-SEC1'); await type('XF-C109-SEC1'); await submit();
  await wait("!!document.querySelector('dialog[open] [role=status]')"); assert.deepEqual(await evaluate('qa.deleted'), ['secondary']);
  pass('SECONDARY_ROW_CAN_DELETE_EXACT_SECONDARY_WITHOUT_DELETING_PRIMARY');
  await fresh(); await open('XF-C109-LEG1'); await evaluate("document.querySelector('dialog[open]').dispatchEvent(new Event('cancel',{cancelable:true}))"); await wait("!document.querySelector('dialog[open]')");
  assert.equal(await evaluate("document.activeElement?.getAttribute('aria-label')"), 'Excluir dispositivo XF-C109-LEG1');
  await evaluate("qa.setRole('ADMIN')"); await wait("!document.querySelector('button[aria-label^=\"Excluir dispositivo\"]')"); assert.equal(await evaluate('qa.calls.length'), 0);
  pass('CANCEL_RESTORES_TRIGGER_FOCUS_AND_ROLE_DOWNGRADE_HIDES_DELETE');
  await fresh(); await evaluate("qa.mode='pending'"); await open('XF-C109-LEG1'); await type('XF-C109-LEG1'); await submit(); await wait('!!qa.pendingResolve');
  await evaluate('qa.unmount()'); await wait("!document.querySelector('dialog[open]')"); await evaluate('qa.pendingResolve()'); await pause(100);
  assert.equal(await evaluate('qa.updates'), 0); assert.equal(await evaluate("!!document.querySelector('dialog[open]')"), false);
  pass('UNMOUNT_IGNORES_LATE_RPC_CALLBACK');
  fs.writeFileSync(dir + '/tests.json', JSON.stringify({ result: 'PASS', tests, reports, realReact: true, actualAuthority: true, syntheticBackendOnly: true, realDataDeleted: false }, null, 2));
  console.log(JSON.stringify({ result: 'PASS', tests, realDataDeleted: false }));
} finally { ws?.close(); browser.kill(); await new Promise(resolve => server.close(resolve)); }
