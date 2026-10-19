import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { build } from 'esbuild';
import { getStartupCatalogPreview, resetStartupCatalogPreview, offerStartupPoster, subscribeStartupCatalogPreview, selectStartupPosters } from '../src/artwork/startup-catalog-preview.ts';
import { RealSourceImporterService } from '../src/source/real-source-importer.service.ts';
import { InMemoryCatalogStorage } from '../src/bootstrap/storage/in-memory.storage.ts';

const dir = 'tmp/c111-startup-loading';
fs.mkdirSync(dir, { recursive: true });
const reports = [];
function pass(name) { reports.push(name); console.log('PASS ' + name); }
const candidate = (n, category = 'Filmes') => ({ id: 'movie:' + n, title: 'Fixture ' + n, category, posterUri: 'https://artwork.fixture.invalid/' + n + '.jpg' });
resetStartupCatalogPreview();
offerStartupPoster(candidate(0)); assert.equal(getStartupCatalogPreview().length, 0);
let notifications = 0;
const unsubscribe = subscribeStartupCatalogPreview(() => notifications++);
for (let n = 0; n < 20000; n++) offerStartupPoster(candidate(n));
assert.equal(getStartupCatalogPreview().length, 6); assert.equal(notifications, 6);
for (let n = 0; n < 6; n++) offerStartupPoster(candidate('cinema' + n, 'Filmes | Cinema'));
for (let n = 0; n < 6; n++) offerStartupPoster(candidate('release' + n, 'Filmes | Lançamentos'));
assert.equal(getStartupCatalogPreview().length, 6); assert.equal(notifications, 18);
assert.ok(getStartupCatalogPreview().every(p => p.category === 'Lançamentos'));
const stable = getStartupCatalogPreview(); offerStartupPoster(candidate('release0', 'Lançamentos'));
assert.equal(getStartupCatalogPreview(), stable);
unsubscribe(); resetStartupCatalogPreview();
assert.equal(selectStartupPosters([{ ...candidate(1), posterUri: 'https://user:pass@fixture.invalid/a.jpg' }, { ...candidate(2), posterUri: 'javascript:alert(1)' }]).length, 0);
pass('RAM_ONLY_SIX_REAL_POSTERS_RELEASE_CINEMA_PRIORITY_BOUNDED_NOTIFICATIONS_NO_OBSERVER_WORK');

const observed = [];
const removeObserver = subscribeStartupCatalogPreview(() => { observed.push(getStartupCatalogPreview().map(p => p.title)); throw Error('UI_OBSERVER_FAILURE'); });
const storage = new InMemoryCatalogStorage();
const playlist = '#EXTM3U\n' + Array.from({ length: 3 }, (_, n) => `#EXTINF:-1 tvg-logo="https://artwork.fixture.invalid/${n}.jpg" group-title="FILMES | LANCAMENTOS",Fixture Cinema ${n}\nhttps://media.fixture.invalid/movie/fixture/fixture/${n + 1}.mp4`).join('\n');
const imported = await RealSourceImporterService.importM3u({ type: 'M3U', playlistUrl: 'https://source.fixture.invalid/list.m3u' }, {
  sourceId: 'src_startupfixture', provenance: { kind: 'REAL', sourceId: 'src_startupfixture', sourceVersion: 1 }, storage,
  deferSearchIndex: true, persistLiveCatalog: false, fetchImpl: async () => new Response(playlist),
});
assert.equal(imported.success, true); assert.equal(getStartupCatalogPreview().length, 3);
assert.equal(getStartupCatalogPreview()[0].category, 'Lançamentos');
const staged = await storage.readStaging(imported.segmentedStaging.snapshotId);
assert.equal(staged.catalog.movies.length, 3); assert.equal(staged.catalog.streams.length, 3);
assert.ok(observed.some(titles => titles.includes('Fixture Cinema 0')));
removeObserver(); resetStartupCatalogPreview();
pass('ACTUAL_M3U_IMPORT_EMITS_ONLY_POSTER_METADATA_OBSERVER_FAILURE_CANNOT_FAIL_STAGING');

let directoryPreview = false;
const removeDirectoryObserver = subscribeStartupCatalogPreview(() => { directoryPreview ||= getStartupCatalogPreview().length > 0; });
await import('./test-c105-directory-import.mjs');
removeDirectoryObserver(); resetStartupCatalogPreview(); assert.equal(directoryPreview, true);
pass('ACTUAL_DIRECTORY_IMPORT_BRANCH_OBSERVED_ALL_EXISTING_SEVEN_CONTRACT_CASES_PASS');

const root = process.cwd().replaceAll('\\', '/');
const appPath = root + '/src/App.tsx';
const fixtureState = `
import{useSyncExternalStore}from'react';
const listeners=new Set(),syncListeners=new Set();let version=0;
export const qa=window.qa={catalog:new URLSearchParams(location.search).get('catalog')==='true',auth:new URLSearchParams(location.search).get('auth')!=='false',reading:new URLSearchParams(location.search).get('reading')==='true',boot:'STAGING',retries:0,refreshes:0,homeMounts:0};
const publish=()=>{version++;for(const f of listeners)f()};
qa.setCatalog=value=>{qa.catalog=value;publish()};qa.finishReading=()=>{qa.reading=false;publish()};
qa.progress=(state,percentage)=>{qa.boot=state;for(const f of syncListeners)f(state,undefined,{state,percentage,progressText:'fixture-secret-not-for-ui'})};
const refresh=async()=>{qa.refreshes++;publish()};
export function useActiveCatalog(){useSyncExternalStore(f=>{listeners.add(f);return()=>listeners.delete(f)},()=>version,()=>0);const catalog={metadata:{snapshotId:'snap-startupfixture',catalogVersion:'1'},movies:[{id:'one'}],series:[]};return{activeCatalog:qa.catalog?catalog:null,readModel:qa.catalog?{catalog}:null,isLoading:qa.reading,isNoActiveCatalog:!qa.catalog,isValidEmptyCatalog:false,importWarning:null,summary:{activePointer:qa.catalog?{kind:'REAL'}:null},refresh};}
const coordinator={getState:()=>qa.boot,getProgress:()=>({state:qa.boot,progressText:'fixture-secret-not-for-ui'}),subscribe:f=>{syncListeners.add(f);qa.syncReady=true;return()=>{syncListeners.delete(f);qa.syncReady=syncListeners.size>0}},coordinateBootSync:async()=>({outcome:'NO_OP'}),startNonBlockingSync:()=>{qa.retries++}};
export const getBootSyncCoordinator=()=>coordinator;
export const DeviceIdentityService={loadActivationState:async()=>({status:qa.auth?'AUTHORIZED':'PENDING'}),getOrCreateInstallationIdentity:async()=>({})};
export const catalogReturn={remember(){},clearRequest(){},requestHome(){},apply(){},requestBack(){}};
`;
const page = name => `import React,{useEffect}from'react';export function ${name}(props){useEffect(()=>{if('${name}'==='HomePage')window.qa.homeMounts++},[]);return <main data-view="${name}">${name==='HomePage'?'<div className="hero-banner">Home fixture pronta</div>':name}<button className="focusable-item" onClick={props.onBack}>Voltar</button>${name==='ActivationPage'?'<button className="focusable-item" onClick={props.onOpenSettings}>Configurações</button>':''}</main>}`;
const mocks = {
  './ui/hooks/useActiveCatalog.ts': "export{useActiveCatalog}from'fixture-state'",
  './bootstrap/boot-sync-coordinator.ts': "export{getBootSyncCoordinator}from'fixture-state'",
  './device/device-identity.service.ts': "export{DeviceIdentityService}from'fixture-state'",
  './ui/hooks/useCatalogReturnNavigation.ts': "import{catalogReturn}from'fixture-state';export const useCatalogReturnNavigation=()=>catalogReturn",
  './ui/hooks/useFeaturedRotation.ts': 'export function requestFeaturedRotation(){}',
  './ui/components/NewContentProvider.tsx': 'export function NewContentProvider({children}){return children}',
  './ui/components/ParentalDetailGate.tsx': 'export function ParentalDetailGate({children}){return children}',
  './ui/pages/ParentalControlPage.tsx': page('ParentalControlPage'),
  './ui/components/PlaybackErrorNotice.tsx': 'export function PlaybackErrorNotice(){return null}',
  './ui/components/NoActiveCatalogState.tsx': page('NoActiveCatalogState'),
  './ui/components/EmptyState.tsx': page('EmptyState'),
  './ui/pages/HomeCollectionPage.tsx': page('HomeCollectionPage') + ';export const isHomeCollectionId=()=>false',
  './playback/native-android-player.bridge.ts': 'export const addNativeAndroidBackButtonListener=async()=>({remove:async()=>{}}),addNativePlayerResumeListener=addNativeAndroidBackButtonListener,finishNativeAndroidApp=async()=>{},NativeAndroidPlayer={}',
  './playback/playback.service.ts': "export const defaultPlaybackService={getCurrentSession:()=>({state:'IDLE'}),subscribe:()=>()=>{},stopPlayback:async()=>{},navigateEpisode:async()=>{}}",
  './bootstrap/automatic-source-refresh.ts': 'export class AutomaticSourceRefresh{tick(){}stop(){}recordSuccessfulCheck(){}};export const canRefreshCatalog=()=>true',
  './playback/google-cast.ts': 'export const hasGoogleCast=()=>false,GoogleCast={}',
  './playback/native-playback-error-notice.ts': 'export const handleNativePlayerReturn=async()=>{},getNativePlaybackErrorNotice=()=>null',
  './playback/playback-support-diagnostic.ts': 'export const capturePlaybackSupportDiagnostic=()=>null',
  './control-plane/client/installation-registry.service.ts': 'export const InstallationRegistryService={reportInstallationBestEffort:async()=>{}}',
  './diagnostics/boot-telemetry.ts': 'export const bootTelemetry={mark(){}}',
  './control-plane/client/device-activation-sync.service.ts': 'export const ensurePendingDeviceActivationRequest=async()=>{},syncPendingDeviceActivation=async()=>{}',
  './ui/layout/viewport-metrics.ts': 'export const installViewportMetricsDiagnostic=()=>{}',
};
for (const name of ['HomePage','MoviesPage','SeriesPage','SearchPage','MovieDetailPage','SeriesDetailPage','LocalSourceProvisioningPage','ActivationPage','SettingsPage','PublicDeviceActivationPage','LiveTvPage','AdultPage']) mocks['./ui/pages/' + name + '.tsx'] = page(name);
mocks['./debug/manager/ManagerPanelPage.tsx'] = page('ManagerPanelPage');
mocks['./ui/portal/CustomerPortalPage.tsx'] = page('CustomerPortalPage');
const entry = `import React from'react';import{createRoot}from'react-dom/client';import App from'${appPath}';import{qa}from'fixture-state';import{offerStartupPoster}from'${root}/src/artwork/startup-catalog-preview.ts';
qa.posters=()=>{for(let n=0;n<6;n++)offerStartupPoster({id:'movie:'+n,title:['HORIZONTE','ÚLTIMA SESSÃO','A TRAVESSIA','NOITE URBANA','MAR ABERTO','UM NOVO DIA'][n],posterUri:location.origin+'/poster/'+n+'.svg',category:n%2?'Filmes | Cinema':'Filmes | Lançamentos'})};
createRoot(document.getElementById('root')).render(<App/>);`;
const kept = new Set(['./ui/navigation/route-state.ts','./ui/hooks/useDpadNavigation.ts','./ui/components/AppShell.tsx','./ui/components/StartupLoadingScreen.tsx','./ui/components/FirstRealSyncState.tsx','./parental/parental-control.store.ts','./web/validation.ts']);
const result = await build({ stdin: { contents: entry, loader: 'tsx', resolveDir: process.cwd() }, bundle: true, write: false, format: 'iife', outdir: dir + '/browser-build',
  define: { __XANDEFLIX_DEBUG_BUILD__: 'false', 'process.env.NODE_ENV': '"development"', 'import.meta.env': '{}' }, plugins: [{ name: 'isolate-authorities-only', setup(builder) {
    builder.onResolve({filter:/hero-artwork\.service\.ts$/},()=>({path:'horizontal-hero-fixture',namespace:'fixture'}));
    builder.onResolve({ filter: /^fixture-state$/ }, () => ({ path: 'fixture-state', namespace: 'fixture' }));
    builder.onResolve({ filter: /^\.\// }, args => {
      if (args.importer.replaceAll('\\', '/') !== appPath || kept.has(args.path)) return;
      assert.ok(mocks[args.path], 'UNDECLARED_APP_IMPORT_' + args.path);
      return { path: args.path, namespace: 'fixture' };
    });
    builder.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({ contents: args.path==='horizontal-hero-fixture' ? `export const heroArtworkService={resolve:async(item,profile,priority)=>{(window.qa.heroCalls??=[]).push({profile,priority});return location.origin+'/horizontal/'+item.id.split(':').pop()+'.svg'}}` : args.path === 'fixture-state' ? fixtureState : mocks[args.path], loader: 'tsx', resolveDir: process.cwd() }));
  } }] });
const js = result.outputFiles.find(file => file.path.endsWith('.js')).text;
const css = fs.readFileSync('src/index.css', 'utf8') + '\n' + result.outputFiles.filter(file => file.path.endsWith('.css')).map(file => file.text).join('\n');
const server = http.createServer((req, res) => {
  if (req.url.startsWith('/horizontal/')) {
    res.setHeader('Content-Type','image/svg+xml');res.setHeader('Cache-Control','max-age=3600');
    res.end('<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><defs><linearGradient id="g"><stop stop-color="#ab684a"/><stop offset="1" stop-color="#223c60"/></linearGradient></defs><rect width="1280" height="720" fill="url(#g)"/><circle cx="840" cy="240" r="180" fill="#ffffff22"/><text x="60" y="110" fill="#fff" font-family="sans-serif" font-size="38">FUNDO HORIZONTAL ILUSTRATIVO</text></svg>');return;
  }
  if (req.url.startsWith('/poster/')) {
    const n = Number(req.url.match(/\d+/)?.[0] || 0), colors = ['#ce7044','#2d658d','#45947e','#865184','#31759c','#b99346'];
    res.setHeader('Content-Type', 'image/svg+xml'); res.setHeader('Cache-Control', 'max-age=3600');
    res.end(`<svg xmlns="http://www.w3.org/2000/svg" width="342" height="513"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="${colors[n]}"/><stop offset="1" stop-color="#0e1525"/></linearGradient></defs><rect width="342" height="513" fill="url(#g)"/><circle cx="225" cy="110" r="74" fill="#ffffff22"/><path d="M0 410 105 215 200 365 342 190v323H0" fill="#060e1e77"/><text x="22" y="62" fill="#fff" font-family="sans-serif" font-size="14" letter-spacing="3">CAPA ILUSTRATIVA</text><text x="22" y="390" fill="#fff" font-family="sans-serif" font-size="42" font-weight="bold">CINEMA</text><text x="22" y="435" fill="#fff9" font-family="sans-serif" font-size="28">${n + 1}</text></svg>`); return;
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body><div id="root"></div><script>${js.replaceAll('</script', '<\\/script')}</script></body></html>`);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = 'http://127.0.0.1:' + server.address().port;
const browser = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new','--no-first-run','--no-default-browser-check','--remote-debugging-port=9797','--user-data-dir=' + path.resolve(dir, 'browser-' + Date.now()),'about:blank'], { windowsHide: true, stdio: 'ignore' });
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
let ws, id = 0; const pending = new Map(), errors = [], external = [];
const send = (method, params = {}) => new Promise((resolve, reject) => { const n = ++id, timer = setTimeout(() => { pending.delete(n); reject(Error('CDP_TIMEOUT_' + method)); }, 15000); pending.set(n,{resolve,reject,timer}); ws.send(JSON.stringify({id:n,method,params})); });
async function evaluate(expression) { const value = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); assert.ok(!value.exceptionDetails, JSON.stringify(value.exceptionDetails)); return value.result.value; }
async function wait(expression) { for (let n = 0; n < 160; n++) { if (await evaluate('Boolean('+expression+')')) return; await pause(25); } throw Error('UI_TIMEOUT_' + expression); }
async function size(width,height) { await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false}); }
async function fresh(query='',width=960,height=540) {
  await size(width,height);
  const mobile=width<600||(height<420&&width<1000),square=Math.abs(width/height-1)<.25;
  await send('Emulation.setUserAgentOverride',{userAgent:mobile?'Mozilla/5.0 (Linux; Android 14; SM-S926B) Mobile Safari/537.36':square?'Mozilla/5.0 (Linux; Android 14; SM-X610) Safari/537.36':'Mozilla/5.0 (Linux; Android 12; GoogleTV) Safari/537.36'});
  await send('Emulation.setTouchEmulationEnabled',{enabled:mobile||square,maxTouchPoints:5});
  await send('Page.navigate',{url:origin+'/?'+query}); await wait('!!window.qa&&!!document.querySelector(".startup-loading-screen,[data-view]")');
  if(await evaluate('qa.auth'))await wait('qa.syncReady');
}
const screen = "!!document.querySelector('.startup-loading-screen')";
const clickText = text => evaluate(`(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent===${JSON.stringify(text)});if(!b)throw Error('MISSING_ACTION');b.focus();b.click();return true;})()`);
async function screenshot(name) { fs.writeFileSync(dir+'/'+name+'.png',Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64')); }
try {
  let tab; for (let n=0;n<80;n++) { try { tab=(await fetch('http://127.0.0.1:9797/json/list').then(r=>r.json())).find(tab=>tab.url==='about:blank'); if(tab)break; } catch{} await pause(100); }
  assert.ok(tab); ws=new WebSocket(tab.webSocketDebuggerUrl); await new Promise(resolve=>ws.addEventListener('open',resolve,{once:true}));
  ws.addEventListener('message',event=>{const m=JSON.parse(event.data),p=pending.get(m.id);if(p){clearTimeout(p.timer);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)}
    if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);
    if(m.method==='Network.requestWillBeSent'&&!m.params.request.url.startsWith(origin)&&!m.params.request.url.startsWith('data:'))external.push(m.params.request.url);
  });
  await send('Page.enable');await send('Runtime.enable');await send('Network.enable');await send('Emulation.setFocusEmulationEnabled',{enabled:true});
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
  await fresh();await wait(screen);assert.equal(await evaluate("!!document.querySelector('.app-shell,.app-header,.mobile-bottom-nav')"),false);
  assert.equal(await evaluate("document.querySelector('[role=progressbar]').hasAttribute('aria-valuenow')"),false);
  assert.equal(await evaluate('qa.homeMounts'),0);assert.equal(await evaluate("document.getElementById('root').textContent.includes('fixture-secret')"),false);
  assert.equal(await evaluate("document.querySelectorAll('.startup-loading-actions button').length"),0,'NORMAL_LOADING_HAS_NO_ACTIVATION_OR_PORTAL_ACTIONS');
  await evaluate('qa.progress("VALIDATING",67)');await wait("document.querySelector('[role=progressbar]').getAttribute('aria-valuenow')==='67'");
  await evaluate('qa.progress("PROMOTING",100)');await wait("document.querySelector('[role=progressbar]').getAttribute('aria-valuenow')==='99'");
  pass('ACTUAL_APP_FIRST_SYNC_HAS_NO_SHELL_NAV_OR_HOME_NO_INVENTED_PERCENT_OR_RAW_PROGRESS');
  for(const [width,height,name]of[[960,540,'tv'],[800,880,'square'],[390,844,'phone'],[844,390,'phone-landscape']]){
    await fresh('',width,height);await wait(screen);await evaluate('qa.posters()');
    const mobile=name.startsWith('phone');
    await wait(mobile?"document.querySelector('.startup-mobile-backdrop')?.dataset.currentCover":"document.querySelectorAll('.startup-preview-card img').length===6");
    assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true,name);
    if(mobile){assert.equal(await evaluate("document.querySelectorAll('.startup-preview-card').length"),0);assert.equal(await evaluate("document.querySelectorAll('.startup-mobile-backdrop img').length<=2"),true);}
    else{await wait("document.querySelector('.startup-wide-backdrop img')?.naturalWidth>document.querySelector('.startup-wide-backdrop img')?.naturalHeight");
      assert.equal(await evaluate("qa.heroCalls.every(c=>c.profile==='horizontal'&&c.priority==='normal')"),true);
      assert.equal(await evaluate("document.querySelectorAll('.startup-preview-card').length"),6);
      assert.equal(await evaluate("(()=>{const a=document.querySelector('.startup-preview').getBoundingClientRect(),b=document.querySelector('.startup-loading-info').getBoundingClientRect();return a.right<=b.left+1})()"),true,name);}
    if(mobile)assert.equal(await evaluate('qa.heroCalls?.length??0'),0,'PHONE_MUST_NOT_REQUEST_HORIZONTAL_ART');
    await pause(1000);await screenshot('loading-'+name);
  }
  pass('WIDE_SIX_COVERS_LEFT_PROGRESS_RIGHT_PHONE_SINGLE_BACKGROUND_NO_MOSAIC_BOTH_ORIENTATIONS');
  await fresh('',390,844);await wait(screen);await evaluate('qa.posters()');await wait("document.querySelector('.startup-mobile-backdrop')?.dataset.currentCover");
  const firstCover=await evaluate("document.querySelector('.startup-mobile-backdrop').dataset.currentCover");
  await pause(6100);await wait("document.querySelector('.startup-mobile-backdrop').dataset.currentCover!=="+JSON.stringify(firstCover));
  assert.equal(await evaluate("document.querySelectorAll('.startup-mobile-backdrop img').length"),2);
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.startup-mobile-cover--incoming')).animationName"),'startup-mobile-fade');
  await evaluate('qa.progress("OFFLINE")');await wait("document.querySelector('.startup-loading-screen--paused')");
  const pausedCover=await evaluate("document.querySelector('.startup-mobile-backdrop').dataset.currentCover");await pause(6100);
  assert.equal(await evaluate("document.querySelector('.startup-mobile-backdrop').dataset.currentCover"),pausedCover);
  pass('PHONE_LOADED_COVER_FADES_AFTER_SIX_SECONDS_TWO_LAYERS_MAX_AND_OFFLINE_STOPS_ROTATION');
  await fresh();await evaluate('qa.progress("OFFLINE")');await wait("document.querySelector('.startup-loading-screen--paused')");
  assert.match(await evaluate("document.querySelector('h1').textContent"),/conexão/);await clickText('Tentar novamente');assert.equal(await evaluate('qa.retries'),1);
  await evaluate('qa.progress("ERROR")');await wait("document.querySelector('h1').textContent.includes('tentar')");await clickText('Tentar novamente');assert.equal(await evaluate('qa.retries'),2);
  await clickText('Ver ativação');await wait("!!document.querySelector('[data-view=ActivationPage]')");
  await clickText('Voltar');await wait(screen);await evaluate('qa.progress("OFFLINE")');await wait("document.querySelector('.startup-loading-screen--paused')");await clickText('Portal do cliente');await wait("!!document.querySelector('[data-view=CustomerPortalPage]')");
  pass('OFFLINE_ERROR_STOP_ANIMATION_RETRY_ACTIVATION_PORTAL_AND_BACK_ACTIONS_REMAIN_AVAILABLE');
  await fresh();await wait(screen);await evaluate('qa.setCatalog(true)');await wait("!!document.querySelector('[data-view=HomePage]')");
  assert.equal(await evaluate(screen),false);assert.equal(await evaluate('qa.boot'),'STAGING');assert.equal(await evaluate("!!document.querySelector('.app-header')"),true);
  await evaluate('qa.progress("PARSING")');await pause(100);assert.equal(await evaluate(screen),false);
  await fresh('catalog=true');await wait("!!document.querySelector('[data-view=HomePage]')");assert.equal(await evaluate(screen),false);
  pass('LOCAL_READY_HOME_OPENS_WHILE_BACKGROUND_SYNC_CONTINUES_CACHED_REAL_CATALOG_NEVER_REBLOCKS');
  await fresh('auth=false');await wait("!!document.querySelector('[data-view=ActivationPage]')");assert.equal(await evaluate(screen),false);
  await fresh('reading=true');await wait(screen);assert.match(await evaluate("document.querySelector('[role=status]').textContent"),/Iniciando/);
  await evaluate('qa.finishReading()');await wait("document.querySelector('[role=status]').textContent.includes('Organizando')");
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.startup-loading-progress > span'),'::after').animationName"),'none');
  await evaluate("Object.defineProperty(document,'visibilityState',{configurable:true,value:'hidden'});document.dispatchEvent(new Event('visibilitychange'))");
  await wait("!!document.querySelector('.startup-loading-screen--paused')");
  assert.equal(external.length,0);assert.deepEqual(errors,[]);
  pass('ACTIVATION_STILL_REQUIRED_READING_SCREEN_EXCLUSIVE_REDUCED_MOTION_HIDDEN_PAUSE_NO_REMOTE_API');
  fs.writeFileSync(dir+'/tests.json',JSON.stringify({result:'PASS',tests:reports.length,reports,actualApp:true,realReact:true,authoritiesAndCatalogHookMocked:true,realDataWritten:false,externalRequests:external.length},null,2));
  console.log(JSON.stringify({result:'PASS',tests:reports.length}));
}finally{ws?.close();browser.kill();await new Promise(resolve=>server.close(resolve));}
