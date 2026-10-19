import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {build} from 'esbuild';

const root=process.cwd().replaceAll('\\','/'),dir='tmp/c165-post-activation-startup';
fs.mkdirSync(dir,{recursive:true});
const appPath=root+'/src/App.tsx',syncPath=root+'/src/control-plane/client/device-activation-sync.service.ts';
const state=`
import{useSyncExternalStore}from'react';
const params=new URLSearchParams(location.search),listeners=new Set(),syncListeners=new Set();let version=0;
export const qa=window.qa={native:params.get('native')!=='false',auth:params.get('auth')==='true',catalog:params.get('catalog')==='true',delayed:params.get('delayed')==='true',persistFails:false,remote:'PENDING',pending:true,closeCalls:0,rejectClose:params.get('close')==='fail',verifiedSaves:0,bootCalls:0,refreshes:0,homeMounts:0,boot:'IDLE',unhandled:[],events:0};
window.addEventListener('unhandledrejection',()=>qa.unhandled.push('REJECTION'));
window.addEventListener('xandeflix:activation-updated',()=>qa.events++);
const identity={deviceId:'c165-device-fixture',displayCode:'XF-QA12-QA34',deviceType:'TV',deviceLabel:'Sala'};
const publish=()=>{version++;for(const f of listeners)f()};
const refresh=async()=>{qa.refreshes++;publish()};
qa.promote=()=>{qa.catalog=true;publish();qa.progress('READY',{outcome:'PROMOTED'})};
qa.progress=(state,result)=>{qa.boot=state;for(const f of syncListeners)f(state,result,{state,progressText:'fixture-progress'})};
export const DeviceIdentityService={getOrCreateIdentity:async()=>identity,getOrCreateInstallationIdentity:async()=>({installationId:'c165-install-fixture'}),getOrCreateDeviceActivationKey:async()=>({rawActivationKey:'123456',activationKeyHash:'0'.repeat(64)}),loadActivationState:async()=>{const value={...identity,status:qa.auth?'AUTHORIZED':'PENDING'};if(qa.delayed){qa.delayed=false;await new Promise(r=>qa.releaseOldRead=r)}return value},saveActivationStateVerified:async state=>{if(qa.persistFails)return false;qa.verifiedSaves++;qa.auth=true;return true}};
export function useActiveCatalog(){useSyncExternalStore(f=>{listeners.add(f);return()=>listeners.delete(f)},()=>version,()=>0);const catalog={metadata:{snapshotId:'c165-snapshot',catalogVersion:'1'},movies:[{id:'one'}],series:[]};return{activeCatalog:qa.catalog?catalog:null,readModel:qa.catalog?{catalog}:null,isLoading:false,isNoActiveCatalog:!qa.catalog,isValidEmptyCatalog:false,importWarning:null,summary:{activePointer:qa.catalog?{kind:'REAL'}:null},refresh};}
const coordinator={getState:()=>qa.boot,getProgress:()=>({state:qa.boot,progressText:'fixture-progress'}),subscribe:f=>{syncListeners.add(f);return()=>syncListeners.delete(f)},coordinateBootSync:async()=>{qa.bootCalls++;qa.progress('STAGING');return{outcome:'STAGING_FAILED'}},startNonBlockingSync:()=>{qa.bootCalls++;qa.progress('STAGING')}};
export const getBootSyncCoordinator=()=>coordinator;
export const getDevicePairingService=()=>({getOrCreateDeviceToken:async()=>({rawDeviceToken:'c165-native-fixture-only',deviceTokenHash:'1'.repeat(64)})});
export const getDeviceActivationService=()=>({getPendingActivation:()=>qa.pending?{activationId:'c165-request-fixture',deviceId:identity.deviceId,activationStatusSecret:'c165-short-fixture'}:null,checkStatus:async()=>({success:true,status:qa.remote,licenseId:'c165-license-fixture',licenseStatus:'TRIAL'}),registerPermanentKey:async()=>({success:true}),clearPendingActivation:()=>{qa.pending=false}});
export const getControlPlaneClient=()=>({resolveSource:async()=>({status:'SOURCE_READY',mode:'SELF_SERVICE'})});
export const InstallationRegistryService={reportInstallationBestEffort:async()=>({success:true})};
export const catalogReturn={remember(){},clearRequest(){},requestHome(){},apply(){},requestBack(){}};
`;
const page=name=>`import React,{useEffect}from'react';export function ${name}(props){useEffect(()=>{if('${name}'==='HomePage')qa.homeMounts++},[]);return <main data-view="${name}">${name}<button className="focusable-item" onClick={props.onBack}>Voltar</button>${name==='ActivationPage'?'<button className="focusable-item" onClick={props.onOpenSettings}>Configuracoes</button>':''}${name==='SettingsPage'?'<button className="focusable-item" onClick={props.onOpenActivation}>Ativacao</button><button className="focusable-item" onClick={props.onOpenParental}>Parental</button>':''}</main>}`;
const mocks={
 './ui/hooks/useActiveCatalog.ts':"export{useActiveCatalog}from'fixture-state'",
 './bootstrap/boot-sync-coordinator.ts':"export{getBootSyncCoordinator}from'fixture-state'",
 './device/device-identity.service.ts':"export{DeviceIdentityService}from'fixture-state'",
 './ui/hooks/useCatalogReturnNavigation.ts':"import{catalogReturn}from'fixture-state';export const useCatalogReturnNavigation=()=>catalogReturn",
 './ui/hooks/useFeaturedRotation.ts':'export function requestFeaturedRotation(){}',
 './ui/components/NewContentProvider.tsx':'export function NewContentProvider({children}){return children}',
 './ui/components/ParentalDetailGate.tsx':'export function ParentalDetailGate({children}){return children}',
 './ui/components/PlaybackErrorNotice.tsx':'export function PlaybackErrorNotice(){return null}',
 './ui/components/NoActiveCatalogState.tsx':page('NoActiveCatalogState'),
 './ui/components/EmptyState.tsx':page('EmptyState'),
 './ui/pages/HomeCollectionPage.tsx':page('HomeCollectionPage')+';export const isHomeCollectionId=()=>false',
 './playback/native-android-player.bridge.ts':'export const addNativeAndroidBackButtonListener=async()=>({remove:async()=>{}}),addNativePlayerResumeListener=addNativeAndroidBackButtonListener,finishNativeAndroidApp=async()=>{},NativeAndroidPlayer={addListener:async()=>({remove:async()=>{}})}',
 './playback/playback.service.ts':"export const defaultPlaybackService={getCurrentSession:()=>({state:'IDLE'}),subscribe:()=>()=>{},stopPlayback:async()=>{},navigateEpisode:async()=>{}}",
 './bootstrap/automatic-source-refresh.ts':'export class AutomaticSourceRefresh{tick(){}stop(){}recordSuccessfulCheck(){}};export const canRefreshCatalog=()=>true',
 './playback/google-cast.ts':'export const hasGoogleCast=()=>false,GoogleCast={}',
 './playback/native-playback-error-notice.ts':'export const handleNativePlayerReturn=async()=>{},getNativePlaybackErrorNotice=()=>null',
 './playback/playback-support-diagnostic.ts':'export const capturePlaybackSupportDiagnostic=()=>null',
 './control-plane/client/installation-registry.service.ts':"export{InstallationRegistryService}from'fixture-state'",
 './diagnostics/boot-telemetry.ts':'export const bootTelemetry={mark(){}}',
 './ui/layout/viewport-metrics.ts':'export const installViewportMetricsDiagnostic=()=>{}',
 './web/validation.ts':'export const isWebValidation=()=>false',
};
for(const name of ['HomePage','MoviesPage','SeriesPage','SearchPage','MovieDetailPage','SeriesDetailPage','LocalSourceProvisioningPage','ActivationPage','SettingsPage','PublicDeviceActivationPage','LiveTvPage','ParentalControlPage','AdultPage'])mocks['./ui/pages/'+name+'.tsx']=page(name);
mocks['./debug/manager/ManagerPanelPage.tsx']=page('ManagerPanelPage');
mocks['./ui/portal/CustomerPortalPage.tsx']=page('CustomerPortalPage');
const kept=new Set(['./ui/navigation/route-state.ts','./ui/hooks/useDpadNavigation.ts','./ui/components/AppShell.tsx','./ui/components/StartupLoadingScreen.tsx','./ui/components/FirstRealSyncState.tsx','./control-plane/client/device-activation-sync.service.ts','./parental/parental-control.store.ts']);
const entry=`import React from'react';import{createRoot}from'react-dom/client';import App from'${appPath}';import{qa}from'fixture-state';import{syncPendingDeviceActivation}from'${syncPath}';qa.poll=()=>syncPendingDeviceActivation();createRoot(document.getElementById('root')).render(<App/>);`;
const result=await build({stdin:{contents:entry,loader:'tsx',resolveDir:root},bundle:true,write:false,format:'iife',outdir:dir+'/browser-build',define:{__XANDEFLIX_DEBUG_BUILD__:'false','process.env.NODE_ENV':'"development"','import.meta.env':'{}'},plugins:[{name:'controlled-authorities',setup(b){
 b.onResolve({filter:/^fixture-state$/},()=>({path:'fixture-state',namespace:'fixture'}));
 b.onResolve({filter:/^@capacitor\/core$/},a=>a.importer.replaceAll('\\','/')===appPath?{path:"import{qa}from'fixture-state';export const Capacitor={isNativePlatform:()=>qa.native};",namespace:'inline'}:undefined);
 b.onResolve({filter:/^@capacitor\/browser$/},()=>({path:"import{qa}from'fixture-state';export const Browser={close:async()=>{qa.closeCalls++;if(qa.rejectClose)throw Error('CONTROLLED_CLOSE_FAILURE')}};",namespace:'inline'}));
 b.onResolve({filter:/hero-artwork\.service\.ts$/},()=>({path:'export const heroArtworkService={resolve:async()=>null}',namespace:'inline'}));
 b.onResolve({filter:/^\.\.?\//},a=>{const importer=a.importer.replaceAll('\\','/');if(importer===appPath&&!kept.has(a.path)){assert(mocks[a.path],'UNDECLARED_APP_IMPORT '+a.path);return{path:a.path,namespace:'fixture'}}if(importer===syncPath){const name=path.basename(a.path);const exports={'device-identity.service.ts':'DeviceIdentityService','device-pairing.service.ts':'getDevicePairingService','device-activation.service.ts':'getDeviceActivationService','control-plane-client.ts':'getControlPlaneClient','installation-registry.service.ts':'InstallationRegistryService'};if(exports[name])return{path:`export{${exports[name]}}from'fixture-state'`,namespace:'inline'};if(name==='session-context.ts')return{path:"import{qa}from'fixture-state';export const isPublicConsumerWeb=()=>!qa.native",namespace:'inline'};}});
 b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:a.path==='fixture-state'?state:mocks[a.path],loader:'tsx',resolveDir:root}));
 b.onLoad({filter:/.*/,namespace:'inline'},a=>({contents:a.path,loader:'tsx',resolveDir:root}));
}}]});
const js=result.outputFiles.find(f=>f.path.endsWith('.js')).text,css=fs.readFileSync('src/index.css','utf8')+'\n'+result.outputFiles.filter(f=>f.path.endsWith('.css')).map(f=>f.text).join('\n');
const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(`<!doctype html><html lang="pt-BR"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><body><div id="root"></div><script>${js.replaceAll('</script','<\\/script')}</script></body></html>`)});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'xandeflix-c165-'));
const chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--no-first-run','--disable-background-networking','--disable-extensions','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:'ignore'});
const pause=ms=>new Promise(r=>setTimeout(r,ms));let socket;const reports=[];
try{
 const active=path.join(profile,'DevToolsActivePort');for(let i=0;i<100&&!fs.existsSync(active);i++)await pause(100);assert(fs.existsSync(active));const port=fs.readFileSync(active,'utf8').split('\n')[0];const tabs=await(await fetch('http://127.0.0.1:'+port+'/json/list')).json();socket=new WebSocket(tabs.find(t=>t.url==='about:blank').webSocketDebuggerUrl);await new Promise(r=>socket.addEventListener('open',r,{once:true}));
 let serial=0;const pending=new Map(),external=[],errors=[];socket.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)}if(m.method==='Network.requestWillBeSent'&&!m.params.request.url.startsWith(origin)&&!m.params.request.url.startsWith('data:'))external.push(m.params.request.url);if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text)});
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}))});
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});assert(!r.exceptionDetails,JSON.stringify(r.exceptionDetails));return r.result?.value};
 const until=async expression=>{for(let i=0;i<200;i++){if(await evaluate('Boolean(document.body && ('+expression+'))'))return;await pause(25)}throw Error('UI_TIMEOUT '+expression)};
 const loading='document.querySelector(".startup-loading-screen")';
 const view=name=>'document.querySelector(\'[data-view="'+name+'"]\')';
 const click=async text=>evaluate('(()=>{const b=Array.from(document.querySelectorAll("button")).find(b=>b.textContent==='+JSON.stringify(text)+');if(!b)throw Error("BUTTON_MISSING");b.click();return true})()');
 const back=async()=>{await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await pause(60)};
 let seq=0;const fresh=async(query='',hash='activation',width=960,height=540)=>{await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:origin+'/?case='+(++seq)+'&'+query+'#/'+hash});await until('window.qa && '+(hash==='settings'?view('SettingsPage'):hash==='home'?query.includes('catalog=true')?view('HomePage'):loading:view('ActivationPage')))};
 const pass=name=>{reports.push(name);console.log('PASS '+name)};
 await send('Network.enable');await send('Runtime.enable');await send('Network.setBlockedURLs',{urls:['https://*']});
 for(const[width,height,label]of[[960,540,'FIRE_TV'],[1280,720,'ANDROID_TV'],[1280,800,'TABLET'],[390,844,'PHONE']]){
  await fresh('','activation',width,height);await until('qa.pending');await click('Configuracoes');await until(view('SettingsPage'));await click('Ativacao');await until(view('ActivationPage'));
  await evaluate('qa.remote="CONSUMED";qa.poll()');await until(loading);assert.equal(await evaluate('qa.verifiedSaves'),1);assert.equal(await evaluate('qa.closeCalls'),1);assert.equal(await evaluate('location.hash'),'');assert.equal(await evaluate('qa.homeMounts'),0);assert.equal(await evaluate('Boolean(document.querySelector(".app-shell"))'),false);assert.equal(await evaluate('qa.pending'),false);
  await back();await until(loading);assert.equal(await evaluate('Boolean('+view('SettingsPage')+'||'+view('ActivationPage')+')'),false);
  await evaluate('qa.progress("OFFLINE")');await until('document.querySelector(".startup-loading-screen--paused")');await click('Tentar novamente');await until(loading);await evaluate('qa.progress("CATALOG_SYNC_ERROR")');await until('document.querySelector(".startup-loading-screen--paused")');await click('Tentar novamente');
  if(label==='FIRE_TV'){const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(dir+'/post-activation-loading.png',Buffer.from(shot.data,'base64'))}
  await evaluate('qa.promote()');await until(view('HomePage'));await back();await until(view('HomePage'));assert.equal(await evaluate('Boolean('+view('SettingsPage')+')'),false);assert.equal(await evaluate('qa.closeCalls'),1);
  await evaluate('document.querySelector(\'button[aria-label="Configurações"]\').click()');await until(view('SettingsPage'));assert.deepEqual(await evaluate('qa.unhandled'),[]);pass(label+'_CONFIRMED_SAVE_LOADING_HOME_NEW_SETTINGS_ACCESS');
 }
 await fresh('','settings');await click('Parental');await until(view('ParentalControlPage'));await evaluate('qa.remote="CONSUMED";qa.poll()');await until(loading);await evaluate('qa.promote()');await until(view('HomePage'));await back();await until(view('HomePage'));pass('PARENTAL_SETTINGS_HISTORY_CLEARED_AFTER_CONFIRMATION');
 await fresh('','settings');await evaluate('qa.poll()');assert.equal(await evaluate('qa.closeCalls'),0);assert.equal(await evaluate('qa.verifiedSaves'),0);assert(await evaluate('Boolean('+view('SettingsPage')+')'));await evaluate('qa.persistFails=true;qa.remote="CONSUMED";qa.poll()');assert.equal(await evaluate('qa.events'),0);assert.equal(await evaluate('qa.closeCalls'),0);assert(await evaluate('Boolean('+view('SettingsPage')+')'));pass('PENDING_REMOTE_AND_FAILED_VERIFIED_SAVE_NEVER_START_OR_CLOSE');
 await fresh('close=fail','activation');await evaluate('qa.remote="CONSUMED";qa.poll()');await until(loading);assert.deepEqual(await evaluate('qa.unhandled'),[]);await evaluate('qa.promote()');await until(view('HomePage'));pass('BROWSER_CLOSE_FAILURE_CANNOT_BLOCK_SOURCE_LOADING');
 await fresh('delayed=true','settings');await until('qa.releaseOldRead');await evaluate('qa.remote="CONSUMED";qa.poll()');await until(loading);await evaluate('qa.releaseOldRead()');await pause(60);await until(loading);await evaluate('qa.promote()');await until(view('HomePage'));pass('OLD_INITIAL_READ_CANNOT_REVERT_CONFIRMED_AUTHORIZATION');
 await fresh('native=false','settings');await evaluate('window.dispatchEvent(new Event("xandeflix:activation-updated"))');await until(view('SettingsPage'));assert.equal(await evaluate('qa.closeCalls'),0);assert.equal(await evaluate('location.hash'),'#/settings');pass('WEB_EVENT_PRESERVES_ROUTE_AND_NEVER_CLOSES_BROWSER');
 await fresh('auth=true&catalog=true','home');assert.equal(await evaluate('Boolean('+loading+')'),false);assert.equal(await evaluate('qa.closeCalls'),0);await evaluate('document.querySelector(\'button[aria-label="Configurações"]\').click()');await until(view('SettingsPage'));pass('ALREADY_AUTHORIZED_LOCAL_FIRST_BOOT_AND_SETTINGS_UNCHANGED');
 assert.equal(external.length,0);assert.deepEqual(errors,[]);
 const out={result:'PASS',tests:reports,actualAppAndRouteAndStartup:true,actualActivationSyncService:true,realBackendWrites:0,externalRequests:external.length,physicalDeviceTest:false};fs.writeFileSync(dir+'/browser-result.json',JSON.stringify(out,null,2));console.log('C165_POST_ACTIVATION_STARTUP=PASS '+reports.length);await Promise.race([send('Browser.close').catch(()=>{}),pause(1000)]);
}finally{socket?.close();chrome.kill();server.closeAllConnections();await new Promise(r=>server.close(r))}
