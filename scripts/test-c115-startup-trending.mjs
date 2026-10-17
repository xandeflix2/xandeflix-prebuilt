import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { build } from 'esbuild';
import { StartupTrendingArtworkService, STARTUP_TRENDS_CACHE_KEY } from '../src/artwork/startup-trending-artwork.service.ts';

const dir = 'tmp/c115-startup-trending'; fs.mkdirSync(dir, { recursive: true });
const reports = [], pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const row = n => ({ id: n + 1, title: 'Cinema fixture ' + n, poster_path: '/poster_' + n + '.jpg', backdrop_path: '/backdrop_' + n + '.jpg', adult: false });
const rows = Array.from({ length: 20 }, (_, n) => row(n));
const response = (items = rows) => new Response(JSON.stringify({ results: items }));
const memory = () => { const data = new Map(); return { data, getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) }; };
const pass = name => { reports.push(name); console.log('PASS ' + name); };
async function until(predicate) { for (let n = 0; n < 120; n++) { if (predicate()) return; await pause(5); } throw Error('SERVICE_TIMEOUT'); }

let now = 1000000000, calls = 0, lastRequest;
const storage = memory();
const service = new StartupTrendingArtworkService({ credential: () => 'fixture-token', storage, now: () => now, random: () => 0,
  fetchImpl: async (url, options) => { calls++; lastRequest = { url, options }; return response([...rows, row(99)]); } });
assert.equal(calls, 0); assert.equal(storage.data.size, 0); assert.deepEqual(service.getSnapshot(), []);
let updates = 0;
const remove = service.subscribe(() => updates++), removeSecond = service.subscribe(() => {});
await until(() => service.getSnapshot().length === 6);
assert.equal(calls, 1); assert.equal(updates, 1);
const first = service.getSnapshot();
assert.equal(new Set(first.map(v => v.id)).size, 6); assert.notEqual(first[0].id, 'tmdb-trending:movie:1');
assert.ok(first.every(v => v.category === 'Em alta no TMDB' && /^https:\/\/image\.tmdb\.org\/t\/p\/w342\/poster_/.test(v.uri)
  && /^https:\/\/image\.tmdb\.org\/t\/p\/w780\/backdrop_/.test(v.backdropUri)));
const request = new URL(lastRequest.url);
assert.equal(request.pathname, '/3/trending/movie/day'); assert.equal(request.search, '?language=pt-BR');
assert.equal(lastRequest.options.headers.Authorization, 'Bearer fixture-token'); assert.equal(lastRequest.options.referrerPolicy, 'no-referrer');
assert.deepEqual([...storage.data.keys()], [STARTUP_TRENDS_CACHE_KEY]);
assert.equal(JSON.parse(storage.data.get(STARTUP_TRENDS_CACHE_KEY)).items.length, 20);
assert.ok(!storage.data.get(STARTUP_TRENDS_CACHE_KEY).includes('fixture-token'));
remove(); removeSecond();
pass('NO_IO_BEFORE_SUBSCRIBE_SINGLE_PUBLIC_REQUEST_RANDOM_SIX_LIMIT_TWENTY_NO_SOURCE_OR_SECRET_IN_CACHE');

let freshCalls = 0;
const freshService = new StartupTrendingArtworkService({ credential: () => 'fixture', storage, now: () => now, random: () => .9,
  fetchImpl: async () => { freshCalls++; return response(); } });
const removeFresh = freshService.subscribe(() => {});
assert.equal(freshService.getSnapshot().length, 6); assert.equal(freshCalls, 0);
assert.notDeepEqual(freshService.getSnapshot().map(v => v.id), first.map(v => v.id)); removeFresh();
now += 6 * 3600000 + 1;
let staleCalls = 0, releaseStale;
const stale = new StartupTrendingArtworkService({ credential: () => 'fixture', storage, now: () => now,
  fetchImpl: async () => { staleCalls++; return await new Promise(resolve => releaseStale = resolve); } });
const removeStale = stale.subscribe(() => {});
assert.equal(stale.getSnapshot().length, 6); assert.equal(staleCalls, 1);
releaseStale(response([row(100)])); await until(() => stale.getSnapshot()[0]?.id === 'tmdb-trending:movie:101'); removeStale();
const expiredStorage = memory(); expiredStorage.setItem(STARTUP_TRENDS_CACHE_KEY, JSON.stringify({ version: 1, updatedAt: now - 8 * 86400000, items: rows }));
const expired = new StartupTrendingArtworkService({ credential: () => '', storage: expiredStorage, now: () => now });
const removeExpired = expired.subscribe(() => {}); assert.equal(expired.getSnapshot().length, 0); removeExpired();
pass('FRESH_PUBLIC_CACHE_NO_REQUEST_STALE_VISIBLE_DURING_REFRESH_EXPIRES_AFTER_SEVEN_DAYS_RANDOM_PER_SESSION');

const poisoned = [row(0), row(0), { ...row(2), adult: true }, { ...row(3), poster_path: '//evil.invalid/a.jpg' },
  { ...row(4), backdrop_path: '/../../escape.jpg' }, { ...row(5), id: '6' }, { ...row(6), title: '' },
  { ...row(7), title: 'https://user:pass@fixture.invalid' }, { ...row(8), backdrop_path: null }, row(9)];
const safe = new StartupTrendingArtworkService({ credential: () => 'fixture', storage: memory(), fetchImpl: async () => response(poisoned) });
const removeSafe = safe.subscribe(() => {}); await until(() => safe.getSnapshot().length > 0);
assert.deepEqual(safe.getSnapshot().map(v => v.id).sort(), ['tmdb-trending:movie:1', 'tmdb-trending:movie:10']); removeSafe();
for (const raw of ['{broken', 'x'.repeat(17000), JSON.stringify({ version: 2, updatedAt: now, items: rows }), JSON.stringify({ version: 1, updatedAt: now + 1000, items: rows })]) {
  const cache = memory(); cache.setItem(STARTUP_TRENDS_CACHE_KEY, raw);
  const invalid = new StartupTrendingArtworkService({ credential: () => '', storage: cache, now: () => now });
  const stop = invalid.subscribe(() => {}); assert.equal(invalid.getSnapshot().length, 0); stop();
}
const denied = new StartupTrendingArtworkService({ credential: () => 'fixture', storage: { getItem() { throw Error('DENIED'); }, setItem() { throw Error('QUOTA'); } }, fetchImpl: async () => response() });
const removeDenied = denied.subscribe(() => {}); await until(() => denied.getSnapshot().length === 6); removeDenied();
pass('SANITIZED_PUBLIC_FILENAMES_IDS_TITLES_NO_ADULT_DUPLICATES_CORRUPT_FUTURE_OR_OVERSIZE_CACHE_QUOTA_TOLERATED');

let abortedSignal, finishCancelled;
const cancelled = new StartupTrendingArtworkService({ credential: () => 'fixture', storage: memory(), timeoutMs: 100,
  fetchImpl: async (_, options) => { abortedSignal = options.signal; return await new Promise(resolve => finishCancelled = resolve); } });
const stopCancelled = cancelled.subscribe(() => {}); stopCancelled(); await pause(5); assert.equal(abortedSignal.aborted, true);
finishCancelled(response()); await pause(5); assert.equal(cancelled.getSnapshot().length, 0);
let timeoutCalls = 0, timeoutSignal;
const timeout = new StartupTrendingArtworkService({ credential: () => 'fixture', storage: memory(), now: () => now, timeoutMs: 15,
  fetchImpl: async (_, options) => { timeoutCalls++; timeoutSignal = options.signal; return await new Promise(() => {}); } });
const stopTimeout = timeout.subscribe(() => {}); await pause(30); assert.equal(timeoutSignal.aborted, true); stopTimeout();
const retryTimeout = timeout.subscribe(() => {}); assert.equal(timeoutCalls, 1); retryTimeout();
for (const status of [401, 429, 503]) {
  let count = 0;
  const failing = new StartupTrendingArtworkService({ credential: () => 'fixture', storage: memory(), now: () => now,
    fetchImpl: async () => { count++; return new Response('', { status }); } });
  const stop = failing.subscribe(() => {}); await pause(5); stop();
  const retry = failing.subscribe(() => {}); assert.equal(count, 1); assert.equal(failing.getSnapshot().length, 0); retry();
}
let noKeyCalls = 0;
const noKey = new StartupTrendingArtworkService({ credential: () => '', storage: memory(), fetchImpl: async () => { noKeyCalls++; return response(); } });
const stopNoKey = noKey.subscribe(() => {}); assert.equal(noKeyCalls, 0); stopNoKey();
let remountCalls = 0;
const remount = new StartupTrendingArtworkService({ credential: () => 'fixture', storage: memory(), fetchImpl: async () => { remountCalls++; await pause(10); return response(); } });
const stopRemount = remount.subscribe(() => {}); stopRemount();
const keepRemount = remount.subscribe(() => {}); await until(() => remount.getSnapshot().length === 6); assert.equal(remountCalls, 1); keepRemount();
pass('ABORT_LAST_SUBSCRIBER_IGNORED_LATE_RESULT_BOUNDED_TIMEOUT_COOLDOWN_MISSING_KEY_STRICT_REMOUNT_DEDUP');

const root = process.cwd().replaceAll('\\', '/');
const loadingPath = root + '/src/ui/components/StartupLoadingScreen.tsx';
const servicePath = root + '/src/artwork/startup-trending-artwork.service.ts';
const fixture = `import{StartupTrendingArtworkService}from'${servicePath}';
export const qa=window.qa={calls:0,heroCalls:0,mode:new URLSearchParams(location.search).get('mode'),stage:'catalog'};
export const startupTrendingArtworkService=new StartupTrendingArtworkService({credential:()=> 'fixture-token',timeoutMs:500,fetchImpl:async(url,opts)=>{
qa.calls++;qa.path=new URL(url).pathname;qa.signal=opts.signal;
if(qa.mode==='pending'){return await new Promise(resolve=>qa.finish=()=>resolve(new Response(JSON.stringify({results:${JSON.stringify(rows)}}))))}
if(qa.mode==='failure')throw Error('FIXTURE_UNAVAILABLE');
return new Response(JSON.stringify({results:${JSON.stringify(rows)}}));}});`;
const entry = `import React,{useState}from'react';import{createRoot}from'react-dom/client';import{StartupLoadingScreen}from'${loadingPath}';import{qa}from'fixture';
function App(){const[home,setHome]=useState(false),[stage,setStage]=useState(new URLSearchParams(location.search).get('stage')||'catalog');qa.home=()=>setHome(true);qa.stageTo=setStage;return home?<main data-home>Home utilizável</main>:<StartupLoadingScreen stage={stage} previewEnabled={false}/>}
createRoot(document.getElementById('root')).render(<App/>);`;
const bundle = await build({ stdin: { contents: entry, loader: 'tsx', resolveDir: process.cwd() }, bundle: true, write: false,
  format: 'iife', outdir: dir + '/browser-build', define: { 'process.env.NODE_ENV': '"development"', 'import.meta.env': '{}' },
  plugins: [{ name: 'isolate-trending-transport-only', setup(b) {
    b.onResolve({ filter: /^fixture$/ }, () => ({ path: 'fixture', namespace: 'fixture' }));
    b.onResolve({ filter: /startup-trending-artwork\.service\.ts$/ }, args => args.importer.replaceAll('\\', '/') === loadingPath ? { path: 'fixture', namespace: 'fixture' } : undefined);
    b.onResolve({ filter: /hero-artwork\.service\.ts$/ }, () => ({ path: 'hero-fixture', namespace: 'fixture' }));
    b.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({ contents: args.path === 'fixture' ? fixture : 'export const heroArtworkService={resolve:async()=>{window.qa.heroCalls++;return undefined}}', loader: 'tsx', resolveDir: process.cwd() }));
  } }] });
const js = bundle.outputFiles.find(v => v.path.endsWith('.js')).text;
const css = fs.readFileSync('src/index.css', 'utf8') + '\n' + bundle.outputFiles.filter(v => v.path.endsWith('.css')).map(v => v.text).join('\n');
const server = http.createServer((req, res) => { res.setHeader('Content-Type', 'text/html;charset=utf-8');
  res.end(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}${css}</style></head><body><div id="root"></div><script>${js.replaceAll('</script', '<\\/script')}</script></body></html>`); });
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = 'http://127.0.0.1:' + server.address().port;
const browser = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=9805', '--user-data-dir=' + path.resolve(dir, 'browser-' + Date.now()), 'about:blank'], { windowsHide: true, stdio: 'ignore' });
let ws, id = 0; const pending = new Map(), errors = [], imageRequests = [], external = [];
const send = (method, params = {}) => new Promise((resolve, reject) => { const key = ++id, timer = setTimeout(() => { pending.delete(key); reject(Error('CDP_TIMEOUT_' + method)); }, 15000);
  pending.set(key, { resolve, reject, timer }); ws.send(JSON.stringify({ id: key, method, params })); });
async function evaluate(expression) { const v = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); assert.ok(!v.exceptionDetails, JSON.stringify(v.exceptionDetails)); return v.result.value; }
async function wait(expression) { for (let n = 0; n < 160; n++) { if (await evaluate('Boolean(' + expression + ')')) return; await pause(25); } throw Error('UI_TIMEOUT_' + expression); }
async function fresh(query = '', width = 960, height = 540) {
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
  const mobile = width < 600;
  await send('Emulation.setUserAgentOverride', { userAgent: mobile ? 'Mozilla/5.0 (Linux; Android 14; SM-S926B) Mobile Safari/537.36' : 'Mozilla/5.0 (Linux; Android 14; SM-X610) Safari/537.36' });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await send('Storage.clearDataForOrigin', { origin, storageTypes: 'local_storage' });
  imageRequests.length = 0;
  await send('Page.navigate', { url: origin + '/?' + query }); await wait('!!window.qa&&!!document.querySelector(".startup-loading-screen")');
}
async function screenshot(name) { fs.writeFileSync(dir + '/' + name + '.png', Buffer.from((await send('Page.captureScreenshot', { format: 'png' })).data, 'base64')); }
try {
  let tab; for (let n = 0; n < 80; n++) { try { tab = (await fetch('http://127.0.0.1:9805/json/list').then(r => r.json())).find(t => t.url === 'about:blank'); if (tab) break; } catch {} await pause(100); }
  assert.ok(tab); ws = new WebSocket(tab.webSocketDebuggerUrl); await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }));
  ws.addEventListener('message', event => {
    const m = JSON.parse(event.data), p = pending.get(m.id); if (p) { clearTimeout(p.timer); pending.delete(m.id); m.error ? p.reject(Error(JSON.stringify(m.error))) : p.resolve(m.result); }
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.text);
    if (m.method === 'Network.requestWillBeSent' && !m.params.request.url.startsWith(origin) && !m.params.request.url.startsWith('https://image.tmdb.org/') && !m.params.request.url.startsWith('data:')) external.push(m.params.request.url);
    if (m.method === 'Fetch.requestPaused') {
      const url = m.params.request.url; imageRequests.push(url);
      const horizontal = url.includes('/backdrop_'), number = Number(url.match(/_(\d+)/)?.[1] || 0);
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${horizontal ? 1280 : 342}" height="${horizontal ? 720 : 513}"><defs><linearGradient id="g"><stop stop-color="${['#4b547d', '#8b554c', '#3e7168'][number % 3]}"/><stop offset="1" stop-color="#172331"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><circle cx="${horizontal ? 850 : 220}" cy="160" r="100" fill="#ffffff22"/><text x="24" y="70" fill="white" font-family="sans-serif" font-size="28">CINEMA ${number + 1}</text><text x="24" y="110" fill="#ffffff88" font-size="14">IMAGEM ILUSTRATIVA DE TESTE</text></svg>`;
      void send('Fetch.fulfillRequest', { requestId: m.params.requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'image/svg+xml' }], body: Buffer.from(svg).toString('base64') });
    }
  });
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
  await send('Fetch.enable', { patterns: [{ urlPattern: 'https://image.tmdb.org/*' }] });
  await send('Emulation.setFocusEmulationEnabled', { enabled: true });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
  for (const [width, height, name] of [[960, 540, 'tv'], [1280, 800, 'tablet'], [800, 880, 'square'], [390, 844, 'phone']]) {
    await fresh('', width, height);
    await wait("document.querySelector('.startup-backdrop')?.dataset.currentCover");
    assert.equal(await evaluate('qa.calls'), 1); assert.equal(await evaluate('qa.heroCalls'), 0);
    assert.equal(await evaluate('qa.path'), '/3/trending/movie/day');
    assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'), true);
    assert.equal(await evaluate("document.querySelectorAll('.startup-backdrop img').length<=2"), true);
    if (name === 'phone') {
      assert.equal(await evaluate("document.querySelectorAll('.startup-preview-card').length"), 0);
      assert.equal(await evaluate("document.querySelector('.startup-mobile-backdrop img').naturalHeight>document.querySelector('.startup-mobile-backdrop img').naturalWidth"), true);
      assert.ok(imageRequests.every(url => url.includes('/poster_')), 'PHONE_MUST_NOT_LOAD_HORIZONTAL_ART');
      assert.match(await evaluate("document.querySelector('.startup-loading-eyebrow').textContent"), /TMDB/);
    } else {
      await wait("document.querySelectorAll('.startup-preview-card img').length===6");
      assert.equal(await evaluate("document.querySelector('.startup-wide-backdrop img').naturalWidth>document.querySelector('.startup-wide-backdrop img').naturalHeight"), true);
      assert.match(await evaluate("document.querySelector('.startup-preview').textContent"), /TENDÊNCIAS DO CINEMA/);
      assert.equal(await evaluate("(()=>{const a=document.querySelector('.startup-preview').getBoundingClientRect(),b=document.querySelector('.startup-loading-info').getBoundingClientRect();return a.right<=b.left+1})()"), true);
      assert.ok(imageRequests.filter(url => url.includes('/poster_')).length <= 6);
    }
    await pause(1000); await screenshot('trends-' + name);
  }
  pass('REAL_LOADING_UI_WITHOUT_SOURCE_POSTERS_TV_TABLET_SQUARE_PHONE_PUBLIC_TRENDS_DIRECT_BACKDROP_NO_TITLE_LOOKUP');

  const firstUri = await evaluate("document.querySelector('.startup-backdrop').dataset.currentCover");
  await pause(6100); await wait("document.querySelector('.startup-backdrop').dataset.currentCover!==" + JSON.stringify(firstUri));
  assert.equal(await evaluate("document.querySelectorAll('.startup-backdrop img').length"), 2);
  await evaluate("qa.stageTo('offline')"); await wait("document.querySelector('.startup-loading-screen--paused')");
  const pausedUri = await evaluate("document.querySelector('.startup-backdrop').dataset.currentCover");
  await pause(6100); assert.equal(await evaluate("document.querySelector('.startup-backdrop').dataset.currentCover"), pausedUri);
  await fresh('stage=reading'); await wait("document.querySelector('.startup-wide-backdrop')?.dataset.currentCover");
  assert.match(await evaluate("document.querySelector('[role=status]').textContent"), /Iniciando/);
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await pause(30);
  const reducedUri = await evaluate("document.querySelector('.startup-backdrop').dataset.currentCover");
  await pause(6100); assert.equal(await evaluate("document.querySelector('.startup-backdrop').dataset.currentCover"), reducedUri);
  pass('PHONE_FADE_SIX_SECONDS_TWO_LAYERS_OFFLINE_PAUSE_READING_PUBLIC_ART_WITH_SOURCE_PREVIEW_DISABLED');

  for (const mode of ['pending', 'failure']) {
    await fresh('mode=' + mode); await wait('qa.calls===1');
    await evaluate('qa.home()'); await wait('!!document.querySelector("[data-home]")');
    assert.equal(await evaluate("!!document.querySelector('.startup-loading-screen')"), false);
    if (mode === 'pending') { await pause(5); assert.equal(await evaluate('qa.signal.aborted'), true); await evaluate('qa.finish()'); }
    await pause(25); assert.equal(await evaluate("!!document.querySelector('.startup-loading-screen')"), false);
  }
  await fresh('stage=offline'); await pause(30); assert.equal(await evaluate('qa.calls'), 0);
  await fresh('stage=error'); await pause(30); assert.equal(await evaluate('qa.calls'), 0);
  await fresh('mode=pending'); await wait('qa.calls===1');
  await evaluate("Object.defineProperty(document,'visibilityState',{configurable:true,value:'hidden'});document.dispatchEvent(new Event('visibilitychange'))");
  await pause(10); assert.equal(await evaluate('qa.signal.aborted'), true);
  assert.deepEqual(errors, []); assert.deepEqual(external, []);
  pass('HOME_UNMOUNTS_WITH_TMDB_PENDING_OR_FAILURE_NO_REOPEN_NO_REQUEST_OFFLINE_ERROR_HIDDEN_CANCEL_NO_EXTERNAL_AUTHORITY');
  fs.writeFileSync(dir + '/tests.json', JSON.stringify({ result: 'PASS', tests: reports.length, reports, realServiceAndReact: true,
    tmdbTransportAndImagesMocked: true, realBackendOrSource: false, externalRequests: external.length }, null, 2));
} finally { ws?.close(); browser.kill(); await new Promise(resolve => server.close(resolve)); }
