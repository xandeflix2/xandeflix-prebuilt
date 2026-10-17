import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { build } from 'esbuild';
import { prepareStartupArtwork, isStartupArtworkSettled } from '../src/artwork/startup-artwork-preparation.ts';

const dir = 'tmp/c108-startup-order';
fs.mkdirSync(dir, { recursive: true });
const settled = { total: 8, ready: 7, unavailable: 1, heroSettled: true, waitingRails: false };
assert.equal(isStartupArtworkSettled(settled), true);
for (const change of [{ total: 0, ready: 0, unavailable: 0 }, { total: 41, ready: 40 },
  { heroSettled: false }, { waitingRails: true }, { ready: 6 }]) {
  assert.equal(isStartupArtworkSettled({ ...settled, ...change }), false);
}
let job, time = 0, schedules = 0, updates = 0, finishes = 0;
const cancel = prepareStartupArtwork({ sample: () => settled, update: () => { updates++; cancel(); },
  finish: () => finishes++, now: () => time,
  schedule: fn => { schedules++; job = fn; return fn; }, cancel: () => { job = undefined; } });
time = 250; job();
assert.equal(updates, 1); assert.equal(finishes, 0); assert.equal(job, undefined); assert.equal(schedules, 1);
console.log('PASS_SETTLED_CRITERIA_AND_CANCEL_INSIDE_UPDATE_NO_RESCHEDULE');

const entry = component => `
import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import {StartupArtworkPreparation} from ${JSON.stringify(component)};
const query=new URLSearchParams(location.search),kind=query.get('case'),strict=query.get('strict')!=='false';
const pixel='data:image/svg+xml;base64,'+btoa('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="90"><rect width="160" height="90" fill="#7186a3"/></svg>');
window.framesObserved=[];window.preparingEvents=[];window.focusCalls=0;window.fixtureReady=false;
function Home(){const root=useRef(null),[preparing,setPreparing]=useState(false),[ready,setReady]=useState(kind==='cached'||kind==='terminal'),[snapshot,setSnapshot]=useState('one');
window.changeSnapshot=()=>setSnapshot('two');
useEffect(()=>{const ms=kind==='slow'||kind==='snapshot'?1000:kind==='fast'?40:60000;const timer=setTimeout(()=>setReady(true),ms);return()=>clearTimeout(timer);},[]);
const onPreparing=React.useCallback(value=>{window.preparingEvents.push(value);setPreparing(value);},[]);
return <main ref={root} className="home-page"><StartupArtworkPreparation root={root} snapshot={snapshot} onPreparing={onPreparing}/>
<div className="home-hero-carousel">{kind==='terminal'?<div className="hero-preparing" aria-busy="false"/>:ready?<img src={pixel} className="hero-backdrop-img"/>:<div className="hero-preparing" aria-busy="true"/>}<div className="hero-actions"><button className="focusable-item" onFocus={()=>window.focusCalls++}>Assistir</button></div></div>
<div className="home-rails-container">{Array.from({length:8},(_,n)=><div key={n} className="media-card" data-startup-artwork={preparing||undefined}>{kind==='terminal'?<div className="artwork-fallback"/>:ready?<img src={pixel} data-artwork-ready/>:<div className="artwork-placeholder"/>}</div>)}</div></main>;}
function Fixture(){const [mounted,setMounted]=useState(true),[fire,setFire]=useState(kind!=='late-profile'&&kind!=='tablet');window.setMounted=setMounted;window.enableFire=()=>setFire(true);return <div className={'app-shell '+(fire?'app-shell--fire-stick':'')}><button id="menu">Início</button>{mounted&&<Home/>}</div>;}
const root=createRoot(document.getElementById('root'));
async function mount(){if(kind==='cached'){const image=new Image();image.src=pixel;await image.decode();}flushSync(()=>root.render(strict?<React.StrictMode><Fixture/></React.StrictMode>:<Fixture/>));
window.fixtureReady=true;let start=performance.now();function observe(){const hero=document.querySelector('.home-hero-carousel'),dialog=document.querySelector('.startup-artwork-preparation'),button=dialog?.querySelector('button');const row={t:Math.round(performance.now()-start),home:!!hero&&getComputedStyle(hero).visibility!=='hidden',modal:!!dialog,focused:!!button&&document.activeElement===button,hidden:!!document.querySelector('.home-page--startup-check')};if(window.framesObserved.length<1800)window.framesObserved.push(row);requestAnimationFrame(observe);}requestAnimationFrame(observe);}
mount();`;
const bundles = {};
for (const stage of ['before', 'after']) {
  const component = path.resolve(stage === 'before' ? dir + '/StartupArtworkPreparation.tsx' : 'src/ui/components/StartupArtworkPreparation.tsx').replaceAll('\\', '/');
  const result = await build({ stdin: { contents: entry(component), resolveDir: process.cwd(), loader: 'tsx' },
    bundle: true, write: false, outdir: dir + '/browser-bundle', format: 'iife', define: { 'process.env.NODE_ENV': '"development"', 'import.meta.env': '{}' },
    plugins: stage === 'before' ? [{ name: 'preserved-startup-engine', setup(builder) {
      builder.onResolve({ filter: /startup-artwork-preparation\.ts$/ }, () => ({ path: path.resolve(dir, 'startup-artwork-preparation.ts') }));
    } }] : [] });
  bundles[stage] = result.outputFiles.find(file => file.path.endsWith('.js')).text;
}
const css = fs.readFileSync('src/index.css', 'utf8') + '\n' + fs.readFileSync('src/ui/components/StartupLoadingScreen.css', 'utf8');
const server = http.createServer((req, res) => {
  const stage = req.url.startsWith('/before') ? 'before' : 'after';
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}\n.home-hero-carousel{height:260px;background:#294560}.media-card{width:80px;height:110px;display:inline-block}.media-card img{width:100%}</style></head><body><div id="root"></div><script>${bundles[stage].replaceAll('</script', '<\\/script')}</script></body></html>`);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=9788',
  '--user-data-dir=' + path.resolve(dir, 'browser-' + Date.now()), 'about:blank'
], { windowsHide: true, stdio: 'ignore' });
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
let ws, id = 0; const pending = new Map(), reports = [];
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const n = ++id, timer = setTimeout(() => reject(Error('CDP_TIMEOUT_' + method)), 15000);
  pending.set(n, { resolve, reject, timer }); ws.send(JSON.stringify({ id: n, method, params }));
});
const evaluate = async expression => {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  assert.ok(!result.exceptionDetails, 'BROWSER_EVALUATION_FAILED'); return result.result.value;
};
async function wait(expression, max = 100) {
  for (let n = 0; n < max; n++) { if (await evaluate(expression)) return; await pause(30); }
  throw Error('FIXTURE_CONDITION_TIMEOUT');
}
async function mount(stage, scenario, strict = true) {
  await send('Page.navigate', { url: `http://127.0.0.1:${server.address().port}/${stage}?case=${scenario}&strict=${strict}` });
  await wait('window.fixtureReady===true&&window.framesObserved.length>0');
}
const facts = () => evaluate(`({frames:window.framesObserved,preparing:window.preparingEvents,focusCalls:window.focusCalls,modal:!!document.querySelector('.startup-artwork-preparation'),reserved:!!document.querySelector('.home-page--startup-check')})`);
function neverCoverVisibleHome(frames) {
  let entered = false;
  for (const frame of frames) { if (frame.home && !frame.modal) entered = true;
    if (entered) assert.equal(frame.modal, false, 'ANIMATION_COVERED_ALREADY_PRESENTED_HOME'); }
}
try {
  let tab;
  for (let n = 0; n < 60; n++) {
    try { tab = (await fetch('http://127.0.0.1:9788/json/list').then(r => r.json())).find(t => t.url === 'about:blank'); if (tab) break; } catch {}
    await pause(100);
  }
  assert.ok(tab); ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }));
  ws.addEventListener('message', e => { const m = JSON.parse(e.data), p = pending.get(m.id); if (!p) return;
    clearTimeout(p.timer); pending.delete(m.id); m.error ? p.reject(Error('CDP_ERROR')) : p.resolve(m.result); });
  await send('Page.enable'); await send('Emulation.setFocusEmulationEnabled', { enabled: true });
  await send('Emulation.setDeviceMetricsOverride', { width: 960, height: 540, deviceScaleFactor: 1, mobile: false });

  await mount('before', 'fast'); await pause(400); let result = await facts();
  assert.ok(result.frames.some(f => f.modal), 'BASELINE_FAST_HOME_MUST_REPRODUCE_UNNECESSARY_MODAL');
  reports.push({ stage: 'before', scenario: 'fast', unnecessaryAnimationReproduced: true });
  await mount('before', 'late-profile'); await pause(100); await evaluate('window.enableFire()');
  await wait("!!document.querySelector('.startup-artwork-preparation')"); result = await facts();
  assert.ok(result.frames.some(f => f.home && !f.modal));
  reports.push({ stage: 'before', scenario: 'late-profile', lateAnimationReproduced: true });

  for (const scenario of ['cached', 'fast', 'terminal', 'tablet', 'late-profile']) {
    await mount('after', scenario);
    if (scenario === 'late-profile') { await pause(100); await evaluate('window.enableFire()'); }
    await pause(600); result = await facts();
    assert.equal(result.frames.some(f => f.modal), false, scenario);
    assert.ok(result.frames.some(f => f.home)); assert.equal(result.reserved, false);
    assert.equal(result.focusCalls, 0); neverCoverVisibleHome(result.frames);
    reports.push({ stage: 'after', scenario, animationSkipped: true, homeVisible: true, noFocusTheft: true });
  }
  for (const strict of [false, true]) {
    await mount('after', 'slow', strict);
    await wait("!!document.querySelector('.startup-artwork-preparation')");
    result = await facts(); assert.ok(result.frames.some(f => f.hidden && !f.home));
    assert.equal(result.frames.some(f => f.home), false, 'HOME_PAINTED_BEFORE_PREPARATION');
    await wait("window.framesObserved.some(f=>f.modal&&f.focused)");
    await wait("window.framesObserved.some(f=>f.home&&!f.modal)", 150); await pause(100);
    result = await facts(); neverCoverVisibleHome(result.frames); assert.equal(result.focusCalls, 1);
    assert.equal(result.reserved, false); assert.equal(result.modal, false);
    await evaluate('window.setMounted(false)'); await pause(50); await evaluate('window.setMounted(true)');
    await pause(600); result = await facts(); assert.equal(result.modal, false); assert.equal(result.reserved, false);
    reports.push({ stage: 'after', scenario: 'slow', strict, preparationPrecedesHome: true, focusRestored: true, returnSkipsAnimation: true });
  }
  await mount('after', 'snapshot'); await wait("!!document.querySelector('.startup-artwork-preparation')");
  await evaluate('window.changeSnapshot()'); await pause(40);
  await evaluate("document.querySelector('.startup-artwork-preparation button').click()");
  await wait("!document.querySelector('.startup-artwork-preparation')");
  await evaluate('window.changeSnapshot()'); await pause(700); result = await facts();
  assert.equal(result.modal, false); assert.equal(result.reserved, false); neverCoverVisibleHome(result.frames);
  reports.push({ stage: 'after', scenario: 'snapshot-and-enter', noRestart: true, immediateEntry: true });

  await mount('after', 'pending'); await pause(50); await evaluate('window.setMounted(false)');
  await pause(300); await evaluate('window.setMounted(true)'); await pause(400); result = await facts();
  assert.equal(result.modal, false); assert.equal(result.reserved, false);
  reports.push({ stage: 'after', scenario: 'unmount-during-check', noLateCallback: true, noRestart: true });

  await mount('after', 'pending'); await wait("!!document.querySelector('.startup-artwork-preparation')");
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await wait("!document.querySelector('.startup-artwork-preparation')"); result = await facts();
  assert.equal(result.reserved, false); assert.equal(result.focusCalls, 1);
  reports.push({ stage: 'after', scenario: 'back', preparationDismissed: true, focusRestored: true });
  const released = await evaluate(`new Promise(resolve=>{window.addEventListener('keydown',()=>resolve(true),{once:true});window.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true}));})`);
  assert.equal(released, true);

  await mount('after', 'pending'); await wait("!!document.querySelector('.startup-artwork-preparation')");
  await wait("window.framesObserved.some(f=>f.home&&!f.modal)", 800); result = await facts();
  const entered = result.frames.find(f => f.home && !f.modal);
  assert.ok(entered.t >= 19500 && entered.t < 23000, 'PRESENTATION_MUST_KEEP_ORIGINAL_20S_DEADLINE');
  assert.equal(result.reserved, false); assert.equal(result.modal, false); assert.equal(result.focusCalls, 1);
  neverCoverVisibleHome(result.frames);
  reports.push({ stage: 'after', scenario: 'timeout', originalDeadlineMs: 20000, homeReleased: true, noLateAnimation: true });
  const report = { result: 'PASS', actualReact: true, syntheticArtworkOnly: true, noBackend: true, cases: reports.length, reports };
  fs.writeFileSync(dir + '/browser-order.json', JSON.stringify(report, null, 2)); console.log(JSON.stringify(report));
} finally {
  ws?.close(); browser.kill(); await new Promise(resolve => server.close(resolve));
}
