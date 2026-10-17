import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';import {build} from 'esbuild';
const dir='tmp/c118-square-hero-hit-area',root=process.cwd().replaceAll('\\','/');fs.mkdirSync(dir,{recursive:true});
const css=fs.readFileSync('src/index.css','utf8'),before=css.replace(/^\.hero-banner--artwork-details.*pointer-events: (?:none|auto); }\r?\n/gm,''),probeOnly=process.argv.includes('--probe-only');
const fixture=`export const qa=window.qa={selected:[],played:[],choice:new URLSearchParams(location.search).get('choice')||'TABLET',mobile:new URLSearchParams(location.search).has('mobile')};
export const item=n=>({id:'fixture:'+n,kind:'movie',title:'Filme de exemplo '+n,yearFormatted:'2026',durationFormatted:'1h 40min',overviewSnippet:'Uma sinopse de exemplo para testar o toque sobre textos e nas áreas transparentes.',genreLabels:['Aventura'],categoryLabels:[]});`;
const entry=`import React from'react';import{createRoot}from'react-dom/client';import{HomeHero}from'${root}/src/ui/components/HomeHero.tsx';import{CategoryHero}from'${root}/src/ui/components/CategoryHero.tsx';import{qa,item}from'fixture';
const p=new URLSearchParams(location.search),page=p.get('page')||'home',square=p.has('square'),mode=p.get('mode'),items=[1,2,3].map(item),options=items.map(item=>({key:item.id,item,fresh:false}));
const shell='app-shell'+(qa.choice==='TV'?' app-shell--television app-shell--fire-stick app-shell--side-nav':qa.choice==='TABLET'?' app-shell--tablet':'')+(square?' app-shell--square-display':'');
createRoot(document.getElementById('root')).render(<div className={shell}><main className={'page-container '+page+'-page'} style={{paddingTop:16}}>{mode==='category'?<CategoryHero items={items} onSelect={v=>qa.selected.push(v.id)} onPlay={v=>qa.played.push(v.id)}/>:<HomeHero options={options} onSelect={v=>qa.selected.push(v.id)} onPlay={v=>qa.played.push(v.id)} nextBatch={async()=>false} displayed={()=>{}}/>}<div style={{height:1200}}>Mais conteúdos</div></main></div>);`;
const bundle=await build({stdin:{contents:entry,loader:'tsx',resolveDir:process.cwd()},bundle:true,write:false,format:'iife',outdir:dir+'/browser-build',define:{'process.env.NODE_ENV':'"development"','import.meta.env':'{}'},plugins:[{name:'isolate-artwork-only',setup(b){
 b.onResolve({filter:/^fixture$/},()=>({path:'fixture',namespace:'fixture'}));
 const mocks={
 'useDevicePresentation.ts':"import{qa}from'fixture';export const useDevicePresentation=()=>qa.choice==='AUTO'?null:qa.choice",
 'useHeroLayout.ts':"import{qa}from'fixture';export const useHeroLayout=()=>qa.mobile",
 'useHeroArtwork.ts':"export const useHeroArtwork=items=>({eligible:items.map(item=>({item,uri:location.origin+'/image.svg'})),revision:0,pending:false})",
 'useCachedArtwork.ts':"export const useCachedArtwork=uri=>({src:uri,handleCacheError:()=>false})",
 'useImmersiveArtwork.ts':"export const useImmersiveArtwork=()=>undefined",
 'useArtworkMetadata.ts':"export const useArtworkMetadata=()=>null,useArtworkMetadataState=()=>({metadata:null,pending:false})",
 'NewContentProvider.tsx':"export const useContentBadge=()=>undefined",
 };
 b.onResolve({filter:/\.(?:ts|tsx)$/},args=>mocks[args.path.split('/').at(-1)]?{path:args.path.split('/').at(-1),namespace:'fixture'}:undefined);
 b.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:args.path==='fixture'?fixture:mocks[args.path],loader:'tsx',resolveDir:process.cwd()}));
}}]});
const js=bundle.outputFiles.find(f=>f.path.endsWith('.js')).text;
const server=http.createServer((req,res)=>{
 if(req.url.startsWith('/image.svg')){res.setHeader('Content-Type','image/svg+xml');res.end('<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><defs><linearGradient id="g"><stop stop-color="#286b74"/><stop offset="1" stop-color="#8d6047"/></linearGradient></defs><rect width="1280" height="720" fill="url(#g)"/><circle cx="820" cy="240" r="170" fill="#ffffff22"/></svg>');return}
 res.setHeader('Content-Type','text/html;charset=utf-8');res.end('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+(req.url.includes('before=1')?before:css)+'</style></head><body><div id="root"></div><script>'+js.replaceAll('</script','<\\/script')+'</script></body></html>');
});await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
const chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--no-first-run','--no-default-browser-check','--remote-debugging-port=9808','--user-data-dir='+path.resolve(dir,'browser-'+Date.now()),'about:blank'],{windowsHide:true,stdio:'ignore'});
let ws,id=0;const pending=new Map(),errors=[],external=[],reports=[],maps=[];const pause=ms=>new Promise(r=>setTimeout(r,ms));
const send=(method,params={})=>new Promise((resolve,reject)=>{const key=++id,timer=setTimeout(()=>{pending.delete(key);reject(Error('CDP_TIMEOUT_'+method))},15000);pending.set(key,{resolve,reject,timer});ws.send(JSON.stringify({id:key,method,params}))});
async function evaluate(expression){const v=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});assert.ok(!v.exceptionDetails,JSON.stringify(v.exceptionDetails));return v.result.value}
async function wait(expression){for(let n=0;n<180;n++){if(await evaluate('Boolean('+expression+')'))return;await pause(20)}throw Error('UI_TIMEOUT_'+expression)}
async function open(width=800,height=880,query='choice=TABLET&square=1'){
 await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
 await send('Emulation.setUserAgentOverride',{userAgent:query.includes('choice=TV')?'Mozilla/5.0 (Linux; Android 12; AFTSS)':query.includes('choice=AUTO')?'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome':'Mozilla/5.0 (Linux; Android 16; SM-FOLD) Mobile Safari/537.36'});
 await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});
 await send('Page.navigate',{url:origin+'/?'+query});await wait("window.qa&&document.querySelector('.hero-banner .hero-title')");await pause(30);
}
async function tap(point){await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:point.x,y:point.y,id:1}]});await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await pause(10)}
const hitMap=`(()=>{const h=document.querySelector('.hero-banner'),r=h.getBoundingClientRect();return[.08,.28,.48,.68,.88].flatMap(yp=>[.04,.25,.5,.75,.96].map(xp=>{const x=r.x+r.width*xp,y=r.y+r.height*yp,el=document.elementFromPoint(x,y),control=el?.closest('button,a,input,select,textarea,[role=button]');return{x,y,inside:y<innerHeight&&x<innerWidth,control:control?.className||'',hit:el?.className||el?.tagName,passive:!control||control.classList.contains('hero-artwork-link'),opens:control?.classList.contains('hero-artwork-link')||false}}))})()`;
async function point(selector){return await evaluate(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`)}
async function drag(from,to,cancel=false){await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...from,id:1}]});for(let n=1;n<=4;n++){await send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:from.x+(to.x-from.x)*n/4,y:from.y+(to.y-from.y)*n/4,id:1}]});await pause(20)}await send('Input.dispatchTouchEvent',{type:cancel?'touchCancel':'touchEnd',touchPoints:[]});await pause(30)}
const title="document.querySelector('.hero-title').textContent";
const save=async name=>fs.writeFileSync(dir+'/'+name+'.png',Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));
const pass=name=>{reports.push(name);console.log('PASS '+name)};
try{
 let tab;for(let n=0;n<80;n++){try{tab=(await fetch('http://127.0.0.1:9808/json/list').then(r=>r.json())).find(t=>t.url==='about:blank');if(tab)break}catch{}await pause(100)}assert.ok(tab);
 ws=new WebSocket(tab.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));ws.addEventListener('message',e=>{const m=JSON.parse(e.data),p=pending.get(m.id);if(p){clearTimeout(p.timer);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);if(m.method==='Network.requestWillBeSent'&&!m.params.request.url.startsWith(origin))external.push(m.params.request.url)});
 await send('Page.enable');await send('Runtime.enable');await send('Network.enable');await send('Emulation.setFocusEmulationEnabled',{enabled:true});await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await open(800,880,'choice=TABLET&square=1&before=1');
 const baseline=await evaluate(hitMap),blocked=baseline.filter(p=>p.inside&&p.passive&&!p.opens),working=baseline.find(p=>p.inside&&p.opens);assert.ok(blocked.length>0);assert.ok(working);
 await tap(blocked[0]);assert.equal(await evaluate('qa.selected.length'),0);await tap(working);assert.equal(await evaluate('qa.selected.length'),1);
 const diagnosis={result:'REPRODUCED',blocked:blocked.length,sampled:baseline.length,blockedElements:[...new Set(blocked.map(p=>p.hit))],upperArtworkTapWorks:true,blockedTapDoesNotNavigate:true};
 fs.writeFileSync(dir+'/before-hit-report.json',JSON.stringify(diagnosis,null,2));console.log(JSON.stringify(diagnosis));
 if(!probeOnly){
  for(const[width,height,choice,mobile,page,mode]of[[800,880,'TABLET',false,'home',''],[880,800,'TABLET',false,'movies',''],[800,880,'PHONE',false,'series',''],[390,844,'PHONE',true,'home',''],[1280,800,'TABLET',false,'home',''],[800,880,'TABLET',false,'movies','category'],[800,880,'TABLET',false,'series','category']]){
   await open(width,height,'choice='+choice+'&page='+page+'&mode='+mode+(mobile?'&mobile=1':'')+(Math.abs(width/height-1)<.3?'&square=1':''));
   const points=(await evaluate(hitMap)).filter(p=>p.inside&&p.passive);assert.ok(points.length>=15);assert.ok(points.every(p=>p.opens),JSON.stringify(points.filter(p=>!p.opens)));
   for(const p of points){const count=await evaluate('qa.selected.length');await tap(p);assert.equal(await evaluate('qa.selected.length'),count+1,'POINT_MUST_OPEN_EXACTLY_ONCE');assert.equal(await evaluate('qa.selected.at(-1)'),'fixture:1')}
   assert.equal(await evaluate('qa.played.length'),0);assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
   maps.push({width,height,choice,page,mode,samples:points.length,allOpen:true});if(width===800&&page==='home')await save('fold-square-after');
  }pass('REAL_TOUCH_GRID_FOLD_TWO_ORIENTATIONS_PHONE_TABLET_MOBILE_HOME_MOVIES_SERIES_CATEGORY_NO_DEAD_AREAS_ONCE_CURRENT_ITEM');

  await open();await tap(await point('.hero-btn-play'));assert.equal(await evaluate('qa.played.length'),1);assert.equal(await evaluate('qa.selected.length'),0);
  await tap(await point('.hero-btn-primary'));assert.equal(await evaluate('qa.selected.length'),1);
  const count=await evaluate('qa.selected.length');await tap(await point('.hero-carousel-dot:nth-child(2)'));await wait(title+".endsWith('2')");assert.equal(await evaluate('qa.selected.length'),count);
  await tap(await point('.hero-artwork-link'));assert.equal(await evaluate('qa.selected.at(-1)'),'fixture:2');
  pass('PLAY_DETAILS_AND_DOTS_KEEP_OWN_ACTION_NO_DOUBLE_SELECTION_CURRENT_SLIDE');

  await open();const bounds=await evaluate("(()=>{const r=document.querySelector('.hero-banner').getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height}})()");
  await drag({x:bounds.x+bounds.w*.75,y:bounds.y+30},{x:bounds.x+bounds.w*.25,y:bounds.y+32});await wait(title+".endsWith('2')");assert.equal(await evaluate('qa.selected.length'),0);
  await pause(450);await drag({x:bounds.x+bounds.w*.25,y:bounds.y+30},{x:bounds.x+bounds.w*.75,y:bounds.y+32});await wait(title+".endsWith('1')");assert.equal(await evaluate('qa.selected.length'),0);
  await pause(450);await drag({x:bounds.x+bounds.w*.5,y:bounds.y+100},{x:bounds.x+bounds.w*.5,y:bounds.y+200},true);assert.equal(await evaluate('qa.selected.length'),0);
  await pause(450);await evaluate("document.querySelector('.hero-artwork-link').focus()");await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r',unmodifiedText:'\r'});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});assert.equal(await evaluate('qa.selected.length'),1);
  pass('REAL_SWIPE_BOTH_DIRECTIONS_CANCEL_NO_RESIDUAL_DETAILS_KEYBOARD_ACCESSIBLE');
  for(const choice of['TV','AUTO']){await open(960,540,'choice='+choice);assert.equal(await evaluate("document.querySelectorAll('.hero-artwork-link').length"),0);assert.equal(await evaluate("document.querySelector('.hero-content')&&getComputedStyle(document.querySelector('.hero-content')).pointerEvents"),'auto')}
  pass('TV_FIRE_AND_DESKTOP_NO_NEW_ARTWORK_ACTION_OR_POINTER_POLICY');
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);fs.writeFileSync(dir+'/tests.json',JSON.stringify({result:'PASS',tests:reports.length,reports,baseline:diagnosis,maps,realHeroAndHomeHero:true,realPointerHitTesting:true,artworkPortsMocked:true,externalRequests:external.length},null,2));
 }
}finally{ws?.close();chrome.kill();await new Promise(r=>server.close(r))}
