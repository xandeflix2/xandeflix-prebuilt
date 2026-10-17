import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {build} from 'esbuild';
const dir='tmp/c114-live-dpad-focus';fs.mkdirSync(dir,{recursive:true});
const root=process.cwd().replaceAll('\\','/'),page=root+'/src/ui/pages/LiveTvPage.tsx';
const state=`
const listeners={};export const qa=window.qa={starts:0,updates:0,acquires:0,releases:0,lookups:0,reads:[],snapshot:'fixture',hold:false,channelId:'live:75'};
export const rows=Array.from({length:160},(_,i)=>({id:'live:'+i,name:'Canal '+i,groupId:'g1',groupName:'Categoria A',streamId:'stream:'+i,streamRef:{directStreamUrl:'https://media.fixture.invalid/live/'+i+'.ts',containerExtension:'ts',sourceItemId:String(i)}}));
const catalog={snapshotId:'fixture',generatedAt:'',groups:[{id:'g1',name:'Categoria A'},{id:'g2',name:'Categoria B'}],channels:rows.slice(0,48),channelsByGroup:{g1:rows.slice(0,48)},totalChannels:160};
const getPage=(group,offset,size=48,filter='')=>{qa.reads.push({offset,size});const list=group==='g1'?rows.filter(c=>!filter||c.name.toLowerCase().includes(filter.toLowerCase())):[];return{channels:list.slice(offset,offset+size),offset,totalAvailable:list.length,nextOffset:offset+size<list.length?offset+size:null}};
export const LiveCatalogService={loadLiveCatalog:async()=>({...catalog,snapshotId:qa.snapshot}),loadCanonicalGroupCounts:async()=>({g1:160,g2:0}),loadChannelPageForGroup:async(g,o,s)=>getPage(g,o,s),loadContinuousChannelPage:async(g,o,opts)=>getPage(g,o,48,opts.filter),loadChannelById:async(id,opts)=>{qa.lookups++;if(qa.hold)await new Promise(r=>qa.finishLookup=r);if(opts.signal?.aborted||opts.expectedSnapshotId!==qa.snapshot)throw Error('STALE');return{channel:rows.find(c=>c.id===id),pageOffset:Math.floor(Number(id.split(':')[1])/48)*48}}};
qa.full=value=>{document.documentElement.dataset.fullscreen=String(value);if(value)document.getElementById('native').focus();listeners.full?.({previewId:'preview-fixture',fullscreen:value})};
qa.action=action=>listeners.action?.({previewId:'preview-fixture',channelId:qa.channelId,action});
qa.staleFull=()=>listeners.full?.({previewId:'old-preview',fullscreen:false});
export const bridge={
 addNativePreviewErrorListener:async f=>({remove:async()=>{}}),addNativePreviewTapListener:async f=>({remove:async()=>{}}),addNativePreviewPlayingListener:async f=>({remove:async()=>{}}),
 addNativePreviewFullscreenListener:async f=>{listeners.full=f;return{remove:async()=>{delete listeners.full}}},addNativeLiveActionListener:async f=>{listeners.action=f;return{remove:async()=>{delete listeners.action}}},
 startNativeAndroidPreview:async()=>{qa.starts++;return{success:true,previewId:'preview-fixture'}},updateNativeAndroidPreview:async opts=>{qa.updates++;return{success:true,previewId:'preview-fixture'}},stopNativeAndroidPreview:async()=>({success:true}),
 enterNativeAndroidPreviewFullscreen:async()=>{qa.full(true);return{success:true}},exitNativeAndroidPreviewFullscreen:async()=>{qa.full(false);return{success:true}},setNativeLiveControls:async(id,context)=>{qa.channelId=context.channelId;return{success:true}}
};
export const getAuthorizedPlaybackSessionGuard=()=>({acquireSession:async()=>{qa.acquires++;return{allowed:true}},releaseSession:async()=>{qa.releases++},onTermination:()=>()=>{}});
`;
const mocks={
 '../../catalog/live/live-catalog.service.ts':"export{LiveCatalogService}from'fixture';export const resolveCanonicalLiveTotal=()=>160",
 '../../playback/native-android-player.bridge.ts':`import{bridge}from'fixture';export const{${['addNativePreviewErrorListener','addNativePreviewFullscreenListener','addNativePreviewTapListener','addNativePreviewPlayingListener','enterNativeAndroidPreviewFullscreen','exitNativeAndroidPreviewFullscreen','startNativeAndroidPreview','stopNativeAndroidPreview','updateNativeAndroidPreview','addNativeLiveActionListener','setNativeLiveControls'].join(',')}}=bridge;`,
 '../../control-plane/client/playback-session.service.ts':"export{getAuthorizedPlaybackSessionGuard}from'fixture'",
 '../../playback/google-cast.ts':'export const armCastAuthorization=async()=>{},stopGoogleCast=async()=>{}',
 '../../diagnostics/boot-telemetry.ts':'export const bootTelemetry={mark(){}}',
 '../components/CastButton.tsx':'export function CastButton(){return null}',
 '../components/LiveEpgPanel.tsx':'export function LiveEpgPanel(){return null}',
 '../hooks/useLivePresentation.ts':'export const useLivePresentation=()=>({tabletPortrait:false,stackedLive:false,squareLive:false})',
 '../../bootstrap/client.ts':"export const getClientBootstrapService=()=>({getStorage:()=>({readActiveManifest:async()=>({snapshotId:'fixture',metadata:{sourceId:'source-fixture'}})})})",
 '../../catalog/live/live-epg.service.ts':"export const liveEpgService={load:async()=>({status:'unavailable',programs:[]})}",
};
const entry=`import React,{useState}from'react';import{createRoot}from'react-dom/client';import{LiveTvPage}from'${page}';import{qa}from'fixture';function App(){const[mounted,setMounted]=useState(true);qa.unmount=()=>setMounted(false);return <div className="app-shell app-shell--side-nav app-shell--fire-stick"><div className="app-content">{mounted&&<LiveTvPage initialChannelId="live:75" onBack={()=>setMounted(false)}/>}</div><button id="native">Native fixture</button></div>}createRoot(document.getElementById('root')).render(<App/>);`;
const result=await build({stdin:{contents:entry,loader:'tsx',resolveDir:process.cwd()},bundle:true,write:false,outdir:dir+'/browser-build',format:'iife',define:{'process.env.NODE_ENV':'"development"','import.meta.env':'{}'},plugins:[{name:'isolate-native-catalog-authority',setup(b){
 b.onResolve({filter:/^fixture$/},()=>({path:'fixture',namespace:'fixture'}));
 b.onResolve({filter:/^\.\.\//},args=>args.importer.replaceAll('\\','/')===page&&mocks[args.path]?{path:args.path,namespace:'fixture'}:undefined);
 b.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:args.path==='fixture'?state:mocks[args.path],loader:'tsx',resolveDir:process.cwd()}));
}}]});
const js=result.outputFiles.find(f=>f.path.endsWith('.js')).text,css=fs.readFileSync('src/index.css','utf8')+'\n'+result.outputFiles.filter(f=>f.path.endsWith('.css')).map(f=>f.text).join('\n');
const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html;charset=utf-8');res.end(`<!doctype html><html><head><style>${css}\n#native{position:fixed;inset:0;z-index:10000;display:none}[data-fullscreen=true] #native{display:block}[data-fullscreen=true] .live-tv-page{visibility:hidden}.live-tv-page{height:100vh!important}.app-content{height:100vh!important}</style></head><body><div id="root"></div><script>${js.replaceAll('</script','<\\/script')}</script></body></html>`)});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
const browser=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--no-first-run','--no-default-browser-check','--remote-debugging-port=9804','--user-data-dir='+path.resolve(dir,'browser-'+Date.now()),'about:blank'],{windowsHide:true,stdio:'ignore'});
const pause=ms=>new Promise(r=>setTimeout(r,ms));let ws,id=0;const pending=new Map(),errors=[],remote=[],reports=[];
const send=(method,params={})=>new Promise((resolve,reject)=>{const key=++id,timer=setTimeout(()=>{pending.delete(key);reject(Error('CDP_TIMEOUT_'+method))},15000);pending.set(key,{resolve,reject,timer});ws.send(JSON.stringify({id:key,method,params}))});
async function evaluate(expression){const v=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});assert.ok(!v.exceptionDetails,JSON.stringify(v.exceptionDetails));return v.result.value;}
async function wait(expression){for(let n=0;n<200;n++){if(await evaluate('Boolean('+expression+')'))return;await pause(25)}throw Error('UI_TIMEOUT_'+expression)}
const focusId="document.activeElement?.dataset.liveChannel";
async function ready(){await send('Page.navigate',{url:origin});await wait("window.qa?.starts===1&&document.querySelector('[data-live-channel=\"live:75\"]')");}
async function enter(){await evaluate("(()=>{const b=document.querySelector('.active-channel');b.focus();b.click()})()");await wait("document.documentElement.dataset.fullscreen==='true'");}
function pass(name){reports.push(name);console.log('PASS '+name)}
try{
 let tab;for(let n=0;n<70;n++){try{tab=(await fetch('http://127.0.0.1:9804/json/list').then(r=>r.json())).find(t=>t.url==='about:blank');if(tab)break}catch{}await pause(100)}assert.ok(tab);ws=new WebSocket(tab.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
 ws.addEventListener('message',event=>{const m=JSON.parse(event.data),p=pending.get(m.id);if(p){clearTimeout(p.timer);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);if(m.method==='Network.requestWillBeSent'&&!m.params.request.url.startsWith(origin)&&!m.params.request.url.startsWith('data:'))remote.push(m.params.request.url)});
 await send('Page.enable');await send('Runtime.enable');await send('Network.enable');await send('Emulation.setFocusEmulationEnabled',{enabled:true});await send('Emulation.setDeviceMetricsOverride',{width:960,height:540,deviceScaleFactor:1,mobile:false});await send('Emulation.setUserAgentOverride',{userAgent:'Mozilla/5.0 (Linux; Android 9; AFTSS) Safari/537.36'});
 await ready();await enter();const before=await evaluate('({starts:qa.starts,acquires:qa.acquires})');await evaluate('qa.full(false)');await wait(focusId+"==='live:75'");assert.deepEqual(await evaluate('({starts:qa.starts,acquires:qa.acquires})'),before);pass('SECOND_CLICK_FULLSCREEN_BACK_RESTORES_ACTIVE_CHANNEL_WITHOUT_PLAYER_OR_C9_RESTART');
 await enter();await evaluate('qa.full(false)');await wait(focusId+"==='live:75'");pass('SAME_INDEX_AND_SCROLL_NEW_RETURN_REQUEST_REFOCUSES_CHANNEL');
 await evaluate("(()=>{const i=document.querySelector('input[aria-label=\"Filtrar canais nesta categoria\"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(i,'Canal 75');i.dispatchEvent(new Event('input',{bubbles:true}))})()");await wait("document.querySelectorAll('[data-live-channel]').length===1");await enter();await evaluate('qa.full(false)');await wait(focusId+"==='live:75'");assert.equal(await evaluate("document.querySelector('input').value"),'Canal 75');pass('RETURN_PRESERVES_EXISTING_FILTER_WHEN_ACTIVE_CHANNEL_IS_VISIBLE');await ready();
 await enter();await evaluate('qa.staleFull()');await pause(100);assert.equal(await evaluate('document.activeElement.id'),'native');await evaluate('qa.full(false)');await wait(focusId+"==='live:75'");pass('STALE_PREVIEW_EVENT_CANNOT_EXIT_OR_RESTORE_FOCUS');
 await enter();await evaluate('qa.action("next")');await wait("qa.channelId==='live:76'");await evaluate('qa.full(false)');await wait(focusId+"==='live:76'");assert.equal(await evaluate('qa.starts'),1);pass('CHANNEL_SWITCH_WHILE_FULLSCREEN_RETURNS_TO_CURRENT_CHANNEL_SAME_PLAYER');
 await enter();await evaluate("(()=>{const l=document.querySelector('.live-channel-list--continuous');l.scrollTop=0;l.dispatchEvent(new Event('scroll'))})()");await wait("!document.querySelector('[data-live-channel=\"live:76\"]')");await evaluate('qa.full(false)');await wait(focusId+"==='live:76'");assert.ok(await evaluate('document.querySelectorAll("[data-live-channel]").length<=48'));pass('VIRTUALIZED_OFFSCREEN_CHANNEL_PAGE_SCROLL_AND_FOCUS_RESTORED_BOUNDED');
 await evaluate("document.querySelector('[data-live-channel=\"live:75\"]').focus();qa.full(false)");await pause(120);assert.equal(await evaluate(focusId),'live:75');pass('DUPLICATE_FALSE_EVENT_DOES_NOT_STEAL_LIST_FOCUS');
 await enter();await evaluate('qa.hold=true;qa.full(false)');await wait('qa.finishLookup');await evaluate("(()=>{const i=document.querySelector('input[aria-label=\"Filtrar canais nesta categoria\"]');i.focus();Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(i,'Canal 1');i.dispatchEvent(new Event('input',{bubbles:true}));qa.finishLookup()})()");await pause(180);assert.equal(await evaluate('document.activeElement.tagName'),'INPUT');pass('USER_FILTER_CHANGED_DURING_LOCAL_LOOKUP_PREVENTS_LATE_FOCUS_STEAL');
 await ready();await enter();await evaluate('qa.hold=true;qa.full(false)');await wait('qa.finishLookup');await evaluate('qa.snapshot="new-generation";qa.finishLookup()');await pause(180);assert.equal(await evaluate('!!document.activeElement?.dataset.liveChannel'),false);pass('CATALOG_GENERATION_CHANGED_DURING_LOOKUP_PREVENTS_OLD_CHANNEL_FOCUS');
 await ready();await enter();await evaluate('qa.hold=true;qa.full(false)');await wait('qa.finishLookup');await evaluate('qa.unmount();qa.finishLookup()');await pause(180);assert.equal(await evaluate("!!document.querySelector('.live-tv-page')"),false);pass('UNMOUNT_ABORTS_PENDING_RESTORE_NO_LATE_FOCUS_OR_REOPEN');
 assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);assert.ok(await evaluate('qa.reads.every(r=>r.size<=48)'));
 fs.writeFileSync(dir+'/focus-tests.json',JSON.stringify({result:'PASS',tests:reports.length,reports,realReactLivePageAndVirtualList:true,nativeCatalogAuthorityMocked:true,realBackendOrMedia:false},null,2));
 console.log(JSON.stringify({result:'PASS',tests:reports.length}));
}finally{ws?.close();browser.kill();await new Promise(r=>server.close(r))}
