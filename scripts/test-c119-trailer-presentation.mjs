import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {build} from 'esbuild';

const dir='tmp/c119-trailer-presentation',root=process.cwd().replaceAll('\\','/');
fs.mkdirSync(dir,{recursive:true});
const fixture=`const params=new URLSearchParams(location.search);
export const qa=window.qa={native:params.has('native'),video:params.has('video'),image:!params.has('noimage'),kind:params.get('kind')||'movie',opens:[],bounds:[],closes:[],commands:[],listeners:new Set(),images:[],metadata:[]};
qa.emit=(state,sessionId=qa.opens.at(-1)?.sessionId)=>{for(const callback of qa.listeners)callback({state,sessionId})};
export const identity={kind:qa.kind,title:'Obra de exemplo',tmdbId:123};
window.addEventListener('message',event=>{if(event.origin==='https://www.youtube.com'&&event.data.fixtureCommand)qa.commands.push(event.data.fixtureCommand)});`;
const entry=`import React from'react';import{createRoot}from'react-dom/client';
import{SeriesTrailer}from'${root}/src/ui/components/SeriesTrailer.tsx';
import{DetailTrailer}from'${root}/src/ui/components/DetailTrailer.tsx';import{qa,identity}from'fixture';
const p=new URLSearchParams(location.search),root=createRoot(document.getElementById('root'));
const props={title:identity.title,identity,backdrop:'https://source.fixture.invalid/horizontal.jpg',poster:'https://source.fixture.invalid/poster.jpg'};
qa.unmount=()=>root.render(null);
root.render(<><header className="app-header" id="fixture-header">XANDEFLIX</header><main id="fixture-main">{p.has('modal')?<DetailTrailer {...props}/>:<SeriesTrailer {...props} loading={p.has('loading')} trailer={qa.video?{key:'abc_DEF-123'}:undefined}/>}<div style={{height:1500}}>Continuação dos detalhes</div></main><nav className="mobile-bottom-nav" id="fixture-nav">Menu</nav></>);`;
const mocks={
 'public-trailer.bridge.ts':`import{qa}from'fixture';export const hasPublicTrailer=()=>qa.native;export const PublicTrailer={addListener:async(_name,callback)=>{qa.listeners.add(callback);qa.lastListener=callback;return{remove:async()=>qa.listeners.delete(callback)}},open:async value=>qa.opens.push(value),bounds:async value=>qa.bounds.push(value),close:async value=>qa.closes.push(value)};`,
 'tmdb-metadata.service.ts':`export const artworkIdentityKey=i=>i.kind+':'+i.title;export const tmdbPosterPath=()=>undefined;`,
 'useArtworkMetadata.ts':`import{qa}from'fixture';export const useArtworkMetadataState=identity=>{qa.metadata.push(identity);return{metadata:qa.image?{backdropUri:'https://image.tmdb.org/t/p/w1280/example.jpg'}:null,pending:false}};`,
 'series-presentation.service.ts':`import{qa}from'fixture';const resolve=async()=>qa.video?{trailer:{key:'abc_DEF-123'}}:null;export const resolveMoviePresentation=resolve,resolveSeriesPresentation=resolve;`,
 'image-load-queue.ts':`import{qa}from'fixture';export const loadImage=async uri=>{qa.images.push(uri);return{ok:true,src:location.origin+'/artwork.svg'}};export const reserveHeroImageSlot=()=>()=>{};export const isImageReady=()=>true;export const invalidateLoadedImage=()=>{};`,
 'artwork-file-cache.ts':`export const invalidateCachedArtworkUri=()=>{};`,
 'artwork-visibility.ts':`export const observeArtwork=()=>()=>{};`,
};
const bundle=await build({stdin:{contents:entry,loader:'tsx',resolveDir:process.cwd()},bundle:true,write:false,format:'iife',outdir:dir+'/browser-build',define:{'process.env.NODE_ENV':'"development"'},plugins:[{name:'controlled-public-ports',setup(b){
 b.onResolve({filter:/^fixture$/},()=>({path:'fixture',namespace:'fixture'}));
 b.onResolve({filter:/\.(?:ts|tsx)$/},args=>mocks[args.path.split('/').at(-1)]?{path:args.path.split('/').at(-1),namespace:'fixture'}:undefined);
 b.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:args.path==='fixture'?fixture:mocks[args.path],loader:'tsx'}));
}}]});
const js=bundle.outputFiles.find(file=>file.path.endsWith('.js')).text,css=fs.readFileSync('src/index.css','utf8');
const server=http.createServer((req,res)=>{
 if(req.url==='/artwork.svg'){res.setHeader('Content-Type','image/svg+xml');res.end('<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><defs><linearGradient id="g"><stop stop-color="#267581"/><stop offset="1" stop-color="#81613f"/></linearGradient></defs><path fill="url(#g)" d="M0 0h1280v720H0z"/><circle cx="860" cy="260" r="150" fill="#ffffff33"/></svg>');return}
 res.setHeader('Content-Type','text/html;charset=utf-8');res.end('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'#fixture-header{position:fixed;inset:0 0 auto;height:56px;padding:16px;background:#080c14}#fixture-main{padding-top:64px}#fixture-nav{position:fixed;inset:auto 0 0;height:48px;background:#080c14}</style><div id="root"></div><script>'+js.replaceAll('</script','<\\/script')+'</script>');
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
const chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--no-first-run','--no-default-browser-check','--remote-debugging-port=9819','--user-data-dir='+path.resolve(dir,'browser-'+Date.now()),'about:blank'],{windowsHide:true,stdio:'ignore'});
let ws,id=0;const pending=new Map(),errors=[],reports=[],embeds=[];
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const send=(method,params={})=>new Promise((resolve,reject)=>{const key=++id,timer=setTimeout(()=>{pending.delete(key);reject(Error('CDP_TIMEOUT_'+method))},15000);pending.set(key,{resolve,reject,timer});ws.send(JSON.stringify({id:key,method,params}))});
async function evaluate(expression){const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});assert.ok(!result.exceptionDetails,JSON.stringify(result.exceptionDetails));return result.result.value}
async function wait(expression){for(let n=0;n<160;n++){if(await evaluate('Boolean('+expression+')'))return;await pause(25)}throw Error('UI_TIMEOUT_'+expression)}
async function open(query='',width=390,height=844){await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:origin+'/?'+query});await wait('window.qa&&document.querySelector(".series-trailer-frame,.detail-trailer-button")');await pause(25)}
async function click(selector){const point=await evaluate(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...point});await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...point})}
async function imageReady(){await wait('document.querySelector(".series-trailer-frame img")?.complete');const uris=await evaluate('qa.images');assert.ok(uris.length>0);assert.ok(uris.every(uri=>uri==='https://image.tmdb.org/t/p/w1280/example.jpg'))}
async function noExtraControls(){assert.equal(await evaluate('document.querySelectorAll(".series-trailer-external,.detail-trailer-controls,.series-trailer-loading").length'),0);assert.equal(await evaluate('document.querySelector(".series-trailer").innerText.includes("YouTube")'),false)}
async function save(name){fs.writeFileSync(dir+'/'+name+'.png',Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'))}
const pass=name=>{reports.push(name);console.log('PASS '+name)};
try{
 let tab;for(let n=0;n<80;n++){try{tab=(await fetch('http://127.0.0.1:9819/json/list').then(r=>r.json())).find(t=>t.url==='about:blank');if(tab)break}catch{}await pause(100)}assert.ok(tab);
 ws=new WebSocket(tab.webSocketDebuggerUrl);await new Promise(resolve=>ws.addEventListener('open',resolve,{once:true}));
 ws.addEventListener('message',event=>{const message=JSON.parse(event.data),p=pending.get(message.id);if(p){clearTimeout(p.timer);pending.delete(message.id);message.error?p.reject(Error(JSON.stringify(message.error))):p.resolve(message.result)}
  if(message.method==='Runtime.exceptionThrown')errors.push(message.params.exceptionDetails.text);
  if(message.method==='Fetch.requestPaused'){const {requestId,request}=message.params;embeds.push(request.url);const body='<html><body style="margin:0;background:#15202b"><script>addEventListener("message",e=>parent.postMessage({fixtureCommand:e.data},"*"))</script></body></html>';void send('Fetch.fulfillRequest',{requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'text/html'}],body:Buffer.from(body).toString('base64')}).catch(error=>errors.push(error.message));}
 });
 await send('Page.enable');await send('Runtime.enable');await send('Fetch.enable',{patterns:[{urlPattern:'https://www.youtube.com/*',requestStage:'Request'}]});
 await send('Emulation.setFocusEmulationEnabled',{enabled:true});
 for(const kind of['movie','series'])for(const loading of[false,true]){
  await open('kind='+kind+(loading?'&loading=1':''));await imageReady();await noExtraControls();
  assert.equal(await evaluate('document.querySelector(".series-trailer").innerText'),'');
  assert.equal(await evaluate('document.querySelectorAll(".series-trailer iframe,.series-trailer button,.series-trailer-overlay").length'),0);
  assert.equal(await evaluate('document.querySelector(".series-trailer-frame").getAttribute("aria-busy")'),String(loading));
  assert.equal(await evaluate('qa.metadata.every(identity=>identity.kind===qa.kind&&identity.tmdbId===123)'),true);
 }await save('phone-horizontal-fallback');pass('MOVIE_SERIES_NO_TRAILER_OR_LOADING_REAL_ARTWORK_CORRECT_IDENTITY_NO_MESSAGE_LINK_OVERLAY_BUTTONS');
 await open('noimage=1');await wait('document.querySelector(".series-trailer-frame .artwork-fallback")');
 assert.equal(await evaluate('getComputedStyle(document.querySelector(".artwork-fallback-title")).display'),'none');
 assert.equal(await evaluate('getComputedStyle(document.querySelector(".artwork-fallback-icon")).display'),'none');
 assert.equal(await evaluate('getComputedStyle(document.querySelector(".artwork-fallback")).backgroundColor'),'rgb(16, 18, 24)');
 assert.deepEqual(await evaluate('qa.images'),[]);pass('NO_HORIZONTAL_IMAGE_NEUTRAL_FRAME_WITHOUT_POSTER_SUBSTITUTION');
 await open('video=1');await imageReady();assert.equal(embeds.length,0);await click('.series-trailer-play');
 await wait('document.querySelector("iframe")&&document.querySelector(".series-trailer-frame").getAttribute("aria-busy")==="false"');
 const embed=new URL(embeds.at(-1));assert.equal(embed.origin,'https://www.youtube.com');assert.equal(embed.searchParams.get('controls'),'0');assert.equal(embed.searchParams.get('enablejsapi'),'1');assert.equal(embed.searchParams.get('origin'),origin);
 await noExtraControls();assert.equal(await evaluate('document.querySelectorAll(".series-trailer button,.series-trailer-overlay").length'),0);
 await evaluate('window.scrollTo(0,500)');await wait('qa.commands.length>0');assert.equal(JSON.parse(await evaluate('qa.commands.at(-1)')).func,'pauseVideo');
 pass('WEB_OFFICIAL_EMBED_AFTER_TOUCH_CONTROLS_ZERO_NO_OVERLAY_OR_BUTTONS_AND_OFFSCREEN_PAUSE');
 await open('video=1&native=1');await imageReady();await click('.series-trailer-play');await wait('qa.opens.length===1');
 const session=await evaluate('qa.opens[0].sessionId');assert.equal(await evaluate('qa.opens[0].visible'),true);await noExtraControls();
 assert.equal(await evaluate('document.querySelectorAll(".series-trailer button").length'),0);
 await evaluate('qa.emit("error","wrong-session")');assert.equal(await evaluate('qa.listeners.size'),1);
 await evaluate('qa.emit("ready")');await wait('document.querySelector(".series-trailer-frame").getAttribute("aria-busy")==="false"');
 await evaluate('qa.emit("playing")');await evaluate('window.scrollTo(0,500)');await wait('qa.bounds.some(value=>!value.visible)');
 await evaluate('window.scrollTo(0,0)');await wait('qa.bounds.at(-1).visible');const before=await evaluate('qa.bounds.length');
 await evaluate('dispatchEvent(new Event("resize"));dispatchEvent(new Event("resize"))');await pause(70);assert.equal(await evaluate('qa.bounds.length'),before);
 await evaluate('qa.emit("error")');await wait('qa.listeners.size===0');await imageReady();await noExtraControls();
 assert.equal(await evaluate('document.querySelector(".series-trailer").innerText'),'');assert.equal(await evaluate('qa.closes.some(value=>value.sessionId==='+JSON.stringify(session)+')'),true);
 await evaluate('qa.lastListener({sessionId:'+JSON.stringify(session)+',state:"ready"})');assert.equal(await evaluate('qa.opens.length'),1);
 pass('NATIVE_INLINE_READY_WRONG_SESSION_IGNORED_BOUNDS_DEDUP_VISIBILITY_ERROR_ARTWORK_CLEANUP_LATE_EVENT');
 for(const native of[false,true])for(const video of[false,true]){
  await open('modal=1&kind=series'+(native?'&native=1':'')+(video?'&video=1':''),960,640);await click('.detail-trailer-button');
  await wait('document.querySelector("dialog[open]")');await noExtraControls();
  if(video){if(native){await wait('qa.opens.length===1');assert.equal(await evaluate('qa.opens[0].presentation'),'modal');await evaluate('qa.emit("ready")')}else await wait('document.querySelector("iframe")')}
  else{await imageReady();assert.equal(await evaluate('document.querySelector(".series-trailer").innerText'),'')}
  assert.equal(await evaluate('document.querySelectorAll(".series-trailer button").length'),0);
  assert.equal(await evaluate('document.activeElement.classList.contains("detail-trailer-close")'),true);
  if(native&&video)await save('tablet-native-frame-no-extra-controls');
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  await wait('!document.querySelector("dialog[open]")');await wait('document.activeElement.classList.contains("detail-trailer-button")');
  if(native&&video){await wait('qa.listeners.size===0');assert.equal(await evaluate('qa.closes.length>0'),true)}
 }pass('REAL_MODAL_WEB_NATIVE_TRAILER_AND_ARTWORK_ONLY_CLOSE_BACK_FOCUS_RESTORE_NO_BOTTOM_BAR');
 assert.deepEqual(errors,[]);fs.writeFileSync(dir+'/tests.json',JSON.stringify({result:'PASS',tests:reports.length,reports,realReact:true,realArtwork:true,realModal:true,publicPortsMocked:true,physicalYoutubePlayback:false},null,2));
}finally{ws?.close();chrome.kill();await new Promise(resolve=>server.close(resolve))}
