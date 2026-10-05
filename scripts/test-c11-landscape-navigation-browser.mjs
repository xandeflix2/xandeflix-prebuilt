import assert from 'node:assert/strict';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';

const root = fileURLToPath(new URL('../', import.meta.url));
assert.equal(path.resolve(process.cwd()), path.resolve(root), 'RUN_ONLY_IN_C11_WORKSPACE');
const artifacts = path.join(root, 'tmp', 'c11-side-navigation', `run-${Date.now()}`);
mkdirSync(artifacts, { recursive: true });
const chromePath = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
assert.ok(chromePath, 'ISOLATED_BROWSER_UNAVAILABLE');
const port = 3141;
const debugPort = 9341;
const remainingOnly = process.argv.includes('--remaining-only');
const liveOnly = process.argv.includes('--live-only');
const mobileCleanOnly = process.argv.includes('--mobile-clean-only');
const categoryRetentionOnly = process.argv.includes('--live-category-only');
const phoneHomeBackOnly = process.argv.includes('--phone-home-back-only');
const phoneHeaderBackOnly = process.argv.includes('--phone-header-back-only');
const phoneFourIconNavigationOnly = process.argv.includes('--phone-four-icon-navigation-only');
const phoneDetailHeaderOnly = process.argv.includes('--phone-detail-header-only');
const liveInteractions = process.argv.includes('--live-interactions') || mobileCleanOnly || categoryRetentionOnly;
const liveScrollOnly = process.argv.includes('--live-scroll-only');
const interactionState = `
  const state=window.__LIVE_GESTURE_FIXTURE__ ||= {acquire:0,release:0,start:0,stop:0,enter:0,exit:0,geometry:0,seq:0,currentId:null,startDelay:0,fullscreenDelay:0,allowSession:true,failFullscreen:false,taps:new Set(),errors:new Set(),fullscreen:new Set()};
  const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
`;
const url = `http://127.0.0.1:${port}/scripts/landscape-navigation-fixture.html`;
let server, chrome, ws;
const errors = [];
let checks = 0;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const waitFor = async (read, timeout = 15000) => {
  const until = Date.now() + timeout;
  let value;
  do { try { value = await read(); if (value) return value; } catch {} await delay(100); } while (Date.now() < until);
  throw new Error('BROWSER_WAIT_TIMEOUT');
};
const pass = label => { checks++; console.log(`PASS ${label}`); };
let command;
let evaluate;
let screenshot;
// Resolve only the real Live page's infrastructure imports into isolated test
// adapters. No production module, source URL, native player or backend is used.
const liveFixtureAdapters = {
  name: 'c11-isolated-live-ui-adapters',
  enforce: 'pre',
  resolveId(source, importer) {
    if (!importer?.replaceAll('\\','/').endsWith('/src/ui/pages/LiveTvPage.tsx')) return null;
    if (source === '../../catalog/live/live-catalog.service.ts') return '\0c11-live-catalog';
    if (source === '../../playback/native-android-player.bridge.ts') return '\0c11-live-bridge';
    if (source === '../../control-plane/client/playback-session.service.ts') return '\0c11-live-session';
    return null;
  },
  load(id) {
    if (id === '\0c11-live-catalog' && categoryRetentionOnly) return `
      const state=window.__LIVE_CATALOG_FIXTURE__={pending:0,delay:0};
      const groups=['A','B','Vazia','Falha'].map((name,i)=>({id:'fixture-group-'+(i+1),name:'Categoria de teste '+name}));
      const channels=Array.from({length:52},(_,i)=>({id:'fixture-channel-'+(i+1),name:'Canal de teste '+(i+1),groupId:groups[i<50?0:1].id,streamRef:{containerExtension:'ts',directStreamUrl:'https://fixture.invalid/'+(i+1)+'.ts'}}));
      const byGroup=Object.fromEntries(groups.map(g=>[g.id,channels.filter(c=>c.groupId===g.id)]));
      // First group is hydrated asynchronously, not from the lightweight catalog.
      const catalog={snapshotId:'fixture-only',groups,channels:byGroup[groups[1].id],channelsByGroup:{}};
      export const resolveCanonicalLiveTotal=()=>channels.length;
      export const LiveCatalogService={loadLiveCatalog:async()=>catalog,loadCanonicalGroupCounts:async()=>Object.fromEntries(groups.map(g=>[g.id,byGroup[g.id].length])),loadChannelPageForGroup:async(id,offset,size)=>{
        state.pending++;try{await new Promise(resolve=>setTimeout(resolve,state.delay));if(id===groups[3].id)throw new Error('FIXTURE_PAGE_FAILED');const all=byGroup[id];return {channels:all.slice(offset,offset+size).map(c=>({...c,streamRef:{...c.streamRef}})),offset,totalAvailable:all.length,nextOffset:offset+size<all.length?offset+size:null};}finally{state.pending--;}
      }};`;
    if (id === '\0c11-live-catalog') return `
      const groups=[{id:'fixture-group-1',name:'Categoria de teste A'},{id:'fixture-group-2',name:'Categoria de teste B'}];
      const channels=[1,2,3].map(i=>({id:'fixture-channel-'+i,name:'Canal de teste '+i,groupId:i<3?groups[0].id:groups[1].id,streamRef:{containerExtension:'ts',${liveInteractions ? "directStreamUrl:'https://fixture.invalid/'+i+'.ts'" : ''}}}));
      const catalog={snapshotId:'fixture-only',groups,channels,channelsByGroup:Object.fromEntries(groups.map(g=>[g.id,channels.filter(c=>c.groupId===g.id)]))};
      export const resolveCanonicalLiveTotal=()=>channels.length;
      export const LiveCatalogService={loadLiveCatalog:async()=>catalog,loadCanonicalGroupCounts:async()=>Object.fromEntries(groups.map(g=>[g.id,catalog.channelsByGroup[g.id].length])),loadChannelPageForGroup:async(id,offset,size)=>({channels:catalog.channelsByGroup[id].slice(offset,offset+size),offset,totalAvailable:catalog.channelsByGroup[id].length,nextOffset:null})};`;
    if (id === '\0c11-live-bridge' && liveInteractions) return interactionState+`
      const subscribe=(set,listener)=>{set.add(listener);return Promise.resolve({remove:async()=>set.delete(listener)})};
      export const addNativePreviewErrorListener=listener=>subscribe(state.errors,listener);
      export const addNativePreviewFullscreenListener=listener=>subscribe(state.fullscreen,listener);
      export const addNativePreviewTapListener=listener=>subscribe(state.taps,listener);
      export const startNativeAndroidPreview=async()=>{state.start++;await delay(state.startDelay);state.currentId='fixture-preview-'+(++state.seq);return {success:true,previewId:state.currentId}};
      export const stopNativeAndroidPreview=async options=>{state.stop++;if(!options?.previewId||options.previewId===state.currentId)state.currentId=null;return {success:true}};
      export const updateNativeAndroidPreview=async()=>{state.geometry++;return {success:true}};
      export const enterNativeAndroidPreviewFullscreen=async options=>{state.enter++;await delay(state.fullscreenDelay);if(state.failFullscreen)return {success:false};state.fullscreen.forEach(listener=>listener({previewId:options.previewId,fullscreen:true}));return {success:true,previewId:options.previewId,fullscreen:true}};
      state.nativeBack=()=>{state.exit++;state.fullscreen.forEach(listener=>listener({previewId:state.currentId,fullscreen:false}))};
      export const exitNativeAndroidPreviewFullscreen=async()=>{state.nativeBack();return {success:true,fullscreen:false}};
    `;
    if (id === '\0c11-live-bridge') return `
      export const addNativePreviewErrorListener=async()=>({remove:async()=>{}});
      export const addNativePreviewFullscreenListener=async()=>({remove:async()=>{}});
      export const addNativePreviewTapListener=async()=>({remove:async()=>{}});
      export const stopNativeAndroidPreview=async()=>({success:true});
      const forbidden=async()=>{throw new Error('NO_NATIVE_PLAYBACK_IN_UI_FIXTURE')};
      export {forbidden as startNativeAndroidPreview,forbidden as updateNativeAndroidPreview,forbidden as enterNativeAndroidPreviewFullscreen,forbidden as exitNativeAndroidPreviewFullscreen};`;
    if (id === '\0c11-live-session' && liveInteractions) return interactionState+`
      const guard={acquireSession:async()=>{state.acquire++;return {allowed:state.allowSession,code:state.allowSession?'PASS':'SESSION_LIMIT_REACHED'}},releaseSession:async()=>{state.release++},onTermination:()=>()=>{}};
      export const getAuthorizedPlaybackSessionGuard=()=>guard;
    `;
    if (id === '\0c11-live-session') return `export const getAuthorizedPlaybackSessionGuard=()=>{throw new Error('NO_SESSION_BACKEND_IN_UI_FIXTURE')};`;
    return null;
  },
};
try {
  server = await createServer({ root, configFile: false, cacheDir: path.join(artifacts, 'vite-cache'), plugins: [liveFixtureAdapters,react()],
    define: { __XANDEFLIX_DEBUG_BUILD__: 'false' }, server: { host: '127.0.0.1', port, strictPort: true, watch: { ignored: ['**/tmp/**','**/android/**','**/dist/**','**/*.apk'] } } });
  await server.listen();
  chrome = spawn(chromePath, ['--headless=new', '--disable-gpu', '--disable-background-networking', '--no-first-run',
    '--no-default-browser-check', '--disable-sync', `--user-data-dir=${path.join(artifacts, 'profile')}`,
    `--remote-debugging-port=${debugPort}`, 'about:blank'], { cwd: root, windowsHide: true, stdio: 'ignore' });
  const pages = await waitFor(async () => { const response = await fetch(`http://127.0.0.1:${debugPort}/json/list`); return response.ok && await response.json(); });
  ws = new WebSocket(pages.find(page => page.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; setTimeout(() => reject(new Error('CDP_OPEN_TIMEOUT')), 10000).unref(); });
  let id = 0;
  const pending = new Map();
  command = (method, params = {}) => new Promise((resolve, reject) => {
    const next = ++id;
    const timer = setTimeout(() => { pending.delete(next); reject(new Error(`CDP_TIMEOUT_${method}`)); }, 15000);
    pending.set(next, response => { clearTimeout(timer); response.error ? reject(new Error(response.error.message)) : resolve(response.result); });
    ws.send(JSON.stringify({ id: next, method, params }));
  });
  ws.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) { pending.get(message.id)(message); pending.delete(message.id); }
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
    if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') errors.push('CONSOLE_ERROR');
    if (message.method === 'Fetch.requestPaused') {
      const requested = new URL(message.params.request.url);
      void command(requested.origin === new URL(url).origin ? 'Fetch.continueRequest' : 'Fetch.failRequest',
        { requestId: message.params.requestId, ...(requested.origin === new URL(url).origin ? {} : { errorReason: 'BlockedByClient' }) });
    }
  };
  evaluate = async expression => {
    const result = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result.value;
  };
  screenshot = async name => { const { data } = await command('Page.captureScreenshot'); writeFileSync(path.join(artifacts, name), Buffer.from(data, 'base64')); };
  const viewport = async (width, height, userAgent, mobile = false) => {
    await command('Emulation.setDeviceMetricsOverride', { width, height, screenWidth: width, screenHeight: height, deviceScaleFactor: 1, mobile,
      screenOrientation: { type: width > height ? 'landscapePrimary' : 'portraitPrimary', angle: width > height ? 90 : 0 } });
    await command('Emulation.setUserAgentOverride', { userAgent, userAgentMetadata: { brands: [], fullVersionList: [], platform: 'Android', platformVersion: '9', architecture: 'arm', model: 'fixture', mobile } });
  };
  const open = async (width, height, ua, mobile = false) => {
    await viewport(width, height, ua, mobile);
    await command('Page.navigate', { url });
    await waitFor(() => evaluate('document.querySelectorAll(".header-nav .nav-link").length===6'));
    await delay(200);
    assert.equal(await evaluate('!!document.querySelector("vite-error-overlay")'), false);
    assert.equal(errors.length, 0, 'BROWSER_RUNTIME_ERRORS');
    assert.equal(await evaluate('!!document.querySelector(".header-catalog-badge")'),false,'CATALOG_VERSION_INDICATOR_MUST_BE_REMOVED_IN_ALL_LAYOUTS');
  };
  const key = async key => {
    await delay(70);
    const codes = { ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40, Enter: 13, Escape: 27 };
    await command('Input.dispatchKeyEvent', { type: 'keyDown', key, windowsVirtualKeyCode: codes[key], nativeVirtualKeyCode: codes[key] });
    await command('Input.dispatchKeyEvent', { type: 'keyUp', key, windowsVirtualKeyCode: codes[key], nativeVirtualKeyCode: codes[key] });
    await delay(80);
  };
  const focus = selector => evaluate(`document.querySelector(${JSON.stringify(selector)}).focus()`);
  const activeIs = selector => evaluate(`document.activeElement.matches(${JSON.stringify(selector)})`);
  const assertLivePreviewLayout = async (sideLayout, label) => {
    await waitFor(()=>evaluate('!!document.querySelector(".live-preview-surface")'));
    const layout=await evaluate('(()=>{const s=document.querySelector(".live-preview-surface"),p=document.querySelector(".live-preview-panel"),c=document.querySelector(".live-channel-summary"),badge=c.querySelector(".live-channel-live-badge"),legacy=document.querySelector(".live-preview-legacy-title"),f=document.querySelector(".live-epg-fallback"),r=s.getBoundingClientRect(),cr=c.getBoundingClientRect(),lr=badge.getBoundingClientRect(),fr=f.getBoundingClientRect(),visible=e=>getComputedStyle(e).display!=="none";return {surfaceWidth:r.width,surfaceHeight:r.height,panelWidth:p.clientWidth,surfaceBottom:r.bottom,surfaceTop:r.top,buttonCount:document.querySelectorAll(".live-native-player-button").length,legacyVisible:visible(legacy),newBadgeVisible:visible(badge),badgeInside:lr.left>=cr.left&&lr.right<=cr.right&&lr.top>=cr.top&&lr.bottom<=cr.bottom,badgeAtRight:lr.right>cr.left+cr.width*0.8,summaryTop:cr.top,summaryBottom:cr.bottom,technicalVisible:visible(document.querySelector(".live-channel-details > div:last-child")),epgHeaderVisible:visible(document.querySelector(".live-epg-header")),fallbackTop:fr.top,fallbackBottom:fr.bottom,fallbackVisible:visible(f.children[1])&&fr.height>0,fallbackCompact:!visible(f.children[0])&&!visible(f.children[2])&&fr.height<65,fallbackHonest:f.children[1].textContent.includes("Guia de programação indisponível"),globalOverflow:document.documentElement.scrollWidth>innerWidth};})()');
    assert.equal(layout.buttonCount,0,'NO_NATIVE_PLAYER_BUTTON_IN_ANY_LAYOUT');assert.ok(layout.surfaceWidth>0);assert.equal(layout.globalOverflow,false);
    assert.equal(layout.legacyVisible,!sideLayout);assert.equal(layout.newBadgeVisible,sideLayout);
    if(sideLayout){
      assert.ok(Math.abs(layout.surfaceWidth-layout.panelWidth)<=1,'VIDEO_MUST_FILL_PREVIEW_COLUMN_WIDTH');
      assert.ok(Math.abs(layout.surfaceWidth/layout.surfaceHeight-16/9)<0.01,'VIDEO_MUST_REMAIN_16_BY_9');
      assert.ok(Math.abs(layout.summaryTop-layout.surfaceBottom)<=1,'CHANNEL_SUMMARY_MUST_FOLLOW_VIDEO_WITHOUT_LARGE_GAP');
      assert.ok(layout.badgeInside&&layout.badgeAtRight,'LIVE_BADGE_MUST_BE_INSIDE_CHANNEL_CARD_AT_RIGHT');
      assert.equal(layout.technicalVisible,false);assert.equal(layout.epgHeaderVisible,false);
      assert.ok(layout.fallbackVisible&&layout.fallbackCompact&&layout.fallbackHonest,'MISSING_EPG_MUST_BE_HONEST_AND_COMPACT');
      assert.ok(layout.fallbackTop>=layout.summaryBottom-1,'PREVIEW_ORDER_VIDEO_CHANNEL_PROGRAMMING_WITHOUT_REDUNDANT_ACTION');
    } else {
      assert.ok(layout.technicalVisible&&layout.epgHeaderVisible&&!layout.fallbackCompact,'PHONE_OR_PORTRAIT_METADATA_MUST_REMAIN_UNCHANGED');
    }
    pass(label);
  };
  const deepCard = '[aria-labelledby="rail-title-fixture-12"] .media-card:first-child';
  const assertLiveScrollIsolation = async label => {
    await evaluate('(()=>{const preview=document.querySelector(".live-preview-panel"),categories=document.querySelector("[data-dpad-region=live-categories]").lastElementChild,channels=document.querySelector(".active-channel").parentElement;for(const container of [preview,categories,channels]){const fill=document.createElement("div");fill.dataset.liveScrollFixture="true";fill.style.cssText="height:3000px;min-height:3000px;flex-shrink:0;order:5";fill.textContent="Conteúdo sintético para teste de rolagem";container.appendChild(fill);}})()');
    const positions=()=>evaluate('(()=>{const preview=document.querySelector(".live-preview-panel"),categories=document.querySelector("[data-dpad-region=live-categories]"),channels=document.querySelector(".active-channel").parentElement;return {windowY:scrollY,headerTop:document.querySelector(".live-page-header").getBoundingClientRect().top,categoryTop:categories.getBoundingClientRect().top,channelTop:channels.parentElement.getBoundingClientRect().top,categoryScroll:categories.lastElementChild.scrollTop,channelScroll:channels.scrollTop,previewScroll:preview.scrollTop};})()');
    const wheel=async selector=>{const point=await evaluate('(()=>{const r=document.querySelector('+JSON.stringify(selector)+').getBoundingClientRect();return {x:r.left+r.width/2,y:Math.min(innerHeight-40,r.bottom-30)};})()');await command('Input.dispatchMouseEvent',{type:'mouseWheel',...point,deltaX:0,deltaY:500});await delay(150)};
    const before=await positions();
    await wheel('.live-preview-panel');
    assert.ok((await positions()).previewScroll>0,'PREVIEW_MUST_SCROLL_INDEPENDENTLY');
    await evaluate('const p=document.querySelector(".live-preview-panel");p.scrollTop=p.scrollHeight;undefined');
    await wheel('.live-preview-panel');
    const previewEnd=await positions();
    assert.equal(previewEnd.windowY,before.windowY,'PREVIEW_EDGE_MUST_NOT_SCROLL_OUTER_DOCUMENT');
    assert.equal(previewEnd.headerTop,before.headerTop);assert.equal(previewEnd.categoryTop,before.categoryTop);assert.equal(previewEnd.channelTop,before.channelTop);
    assert.equal(previewEnd.categoryScroll,before.categoryScroll);assert.equal(previewEnd.channelScroll,before.channelScroll);
    await wheel('[data-dpad-region=live-categories] > div:last-child');
    const category=await positions();assert.ok(category.categoryScroll>before.categoryScroll);assert.equal(category.channelScroll,previewEnd.channelScroll);assert.equal(category.previewScroll,previewEnd.previewScroll);
    await wheel('.active-channel');const channel=await positions();
    assert.ok(channel.channelScroll>before.channelScroll);assert.equal(channel.categoryScroll,category.categoryScroll);assert.equal(channel.previewScroll,category.previewScroll);assert.equal(channel.windowY,before.windowY);
    await evaluate('document.querySelectorAll("[data-live-scroll-fixture]").forEach(element=>element.remove());document.querySelectorAll(".live-preview-panel,.live-category-list,.live-channel-list").forEach(element=>{element.scrollTop=0});undefined');
    pass(label+'_THREE_INDEPENDENT_SCROLL_AREAS_NO_OUTER_PAGE_MOVEMENT');
  };
  const menu = '.header-nav .nav-link';
  const navigatePhone = async view => {
    const names={movies:'Ir para Filmes',series:'Ir para Séries',live:'Ir para Canais ao Vivo',search:'Ir para Busca'};
    // Fixture-only setup for Activation; its mobile footer entry was removed.
    const selector=view==='activation'?'.header-nav [aria-label="Ativação"]':'.mobile-bottom-nav [aria-label="'+names[view]+'"]';
    await evaluate('document.querySelector('+JSON.stringify(selector)+').click()');await delay(120);
  };
  await command('Runtime.enable'); await command('Page.enable');
  await command('Fetch.enable', { patterns: [{ urlPattern: 'http*' }] });
  // Immediate skill-required visual gut check before any other browser work.
  await open(remainingOnly ? 1280 : 960, remainingOnly ? 800 : 540, remainingOnly ? 'Android SM-X610' : 'Android 9; AFTSSS Mobile', !remainingOnly);
  await screenshot('fire-initial.png');
  assert.ok(await evaluate('document.body.innerText.trim().length>0'));
  pass('SERVER_VERIFIED_RENDER_CONSOLE_OVERLAY_AND_SIX_REAL_MENU_ITEMS');
  const headerExports={};
  const headerCode=ts.transpileModule(readFileSync(path.join(root,'src/ui/components/Header.tsx'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText;
  runInNewContext(headerCode,{exports:headerExports,require:name=>{assert.equal(name,'react');return React;}});
  for(const catalogVersion of [undefined,'','1.0.0','Teste local','Sincronizando...']) {
    const html=renderToStaticMarkup(React.createElement(headerExports.Header,{currentView:'live',onNavigate:()=>{},catalogVersion}));
    assert.equal(html.includes('header-catalog-badge'),false);
    assert.equal(html.includes('role="status"'),catalogVersion==='Sincronizando...');
    assert.equal(html.includes('Sincronizando...'),catalogVersion==='Sincronizando...');
    assert.equal(html.includes('v1.0.0'),false);
  }
  pass('REAL_HEADER_SSR_REMOVES_VERSIONS_BUT_PRESERVES_SYNC_STATUS');

  if (phoneDetailHeaderOnly) {
    const route=()=>evaluate('document.querySelector("[data-testid=route]").textContent');
    const click=async selector=>{await evaluate('document.querySelector('+JSON.stringify(selector)+').click()');await delay(120)};
    const geometry=()=>evaluate('(()=>{const b=document.querySelector(".app-header .btn-back,.page-back-row .btn-back"),r=b.getBoundingClientRect(),brand=document.querySelector(".brand-container").getBoundingClientRect(),h=document.querySelector(".app-header").getBoundingClientRect(),i=b.querySelector(".back-arrow-icon")?.getBoundingClientRect();return {headerHeight:h.height,contained:r.top>=h.top&&r.bottom<=h.bottom,centered:!!i&&i.width>0&&Math.abs((i.left+i.right-r.left-r.right)/2)<=1&&Math.abs((i.top+i.bottom-r.top-r.bottom)/2)<=1,brandLeft:brand.left,brandRight:brand.right,left:r.left,right:r.right,width:r.width,height:r.height,text:b.innerText.trim(),name:b.getAttribute("aria-label"),headerBack:!!b.closest(".app-header"),overflow:document.documentElement.scrollWidth>innerWidth,homeButtons:document.querySelectorAll(".header-home-button").length};})()');
    for(const width of [320,390,430]) {
      await open(width,844,'Android Mobile',true);
      const brandLeft=await evaluate('document.querySelector(".brand-container").getBoundingClientRect().left');
      for(const [list,kind,index] of [['movies','movie-detail',1],['series','series-detail',2]]) {
        await navigatePhone(list);
        const listHeaderHeight=await evaluate('document.querySelector(".app-header").getBoundingClientRect().height');
        await click('.catalog-grid .media-card:nth-child('+index+')');
        assert.equal(await route(),'Rota: '+kind);
        const layout=await geometry();
        assert.ok(layout.headerHeight>=64&&Math.abs(layout.headerHeight-listHeaderHeight)<=1,'PHONE_DETAIL_HEADER_MUST_SHARE_64PX_HEIGHT');
        assert.ok(layout.contained&&layout.centered&&layout.width>=44&&layout.height>=44,'DETAIL_BACK_MUST_BE_CENTERED_AND_CONTAINED_WITH_ACCESSIBLE_TARGET');
        assert.ok(Math.abs(layout.brandLeft-brandLeft)<=1&&layout.left>=layout.brandRight&&layout.right<=width&&layout.right>=width-32,'DETAIL_BACK_MUST_ALIGN_RIGHT_WITHOUT_PUSHING_BRAND');
        assert.equal(layout.text,'');assert.equal(layout.name,'Voltar para a tela anterior');assert.equal(layout.homeButtons,0);
        assert.equal(layout.overflow,false);assert.equal(await evaluate('document.querySelectorAll(".mobile-bottom-nav button").length'),4);
        pass('PHONE_'+width+'_'+kind.toUpperCase()+'_64PX_RIGHT_CENTERED_ICON_WITHOUT_HOME_OR_OVERFLOW');
        await screenshot('phone-'+width+'-'+kind+'-right-back.png');
        await click('.app-header .btn-back');assert.equal(await route(),'Rota: '+list);
        await click('.catalog-grid .media-card:nth-child('+index+')');await focus('.app-header .btn-back');
        assert.ok(await activeIs('.app-header .btn-back'));await key('Enter');assert.equal(await route(),'Rota: '+list);
        await click('.catalog-grid .media-card:nth-child('+index+')');await key('Escape');assert.equal(await route(),'Rota: '+list);
        pass('PHONE_'+width+'_'+kind.toUpperCase()+'_CLICK_ENTER_ESCAPE_RETURN_TO_SAME_LIST');
        await click('.header-home-button');assert.equal(await route(),'Rota: home');
        await click('.media-rail .media-card:nth-child('+index+')');assert.equal(await route(),'Rota: '+kind);
        assert.ok((await geometry()).headerHeight>=64);await click('.app-header .btn-back');
        assert.equal(await route(),'Rota: home');assert.equal(await evaluate('document.querySelectorAll(".app-header .btn-back,.header-home-button,.page-back-row .btn-back").length'),0);
        pass('PHONE_'+width+'_'+kind.toUpperCase()+'_HOME_CARD_DETAILS_RETURN_WITHOUT_HOME_ACTIONS');
      }
    }
    for(const [label,width,height,ua,side] of [['TABLET_PORTRAIT',800,1280,'Android SM-X610',false],['TABLET_LANDSCAPE',1280,800,'Android SM-X610',true],['FIRE',960,540,'FireTV',true],['SMART_TV',1920,1080,'SMART-TV Tizen',true],['WIDE_PHONE',915,412,'Android Mobile',false]]) {
      await open(width,height,ua,false);
      for(const [list,kind,index,name] of [['movies','movie-detail',1,'Filmes'],['series','series-detail',2,'Séries']]) {
        await click('.header-nav [aria-label="'+name+'"]');await click('.catalog-grid .media-card:nth-child('+index+')');
        assert.equal(await route(),'Rota: '+kind);
        const layout=await geometry();assert.equal(layout.headerBack,!side);assert.ok(layout.text.includes('Voltar'));assert.equal(layout.overflow,false);assert.equal(layout.homeButtons,0);
        if(side){const expectedRight=await evaluate('(()=>{const row=document.querySelector(".page-back-row");return document.querySelector(".app-content").getBoundingClientRect().right-parseFloat(getComputedStyle(row).right);})()');assert.ok(Math.abs(layout.right-expectedRight)<=1);}
        else assert.ok(layout.left<layout.brandLeft,'NON_PHONE_DETAIL_HEADER_ORDER_MUST_REMAIN_UNCHANGED');
        await click('.app-header .btn-back,.page-back-row .btn-back');assert.equal(await route(),'Rota: '+list);
        pass(label+'_'+kind.toUpperCase()+'_EXISTING_BACK_LAYOUT_TEXT_AND_HISTORY_PRESERVED');
      }
    }
  } else if (phoneFourIconNavigationOnly) {
    const route=()=>evaluate('document.querySelector("[data-testid=route]").textContent');
    const visible=selector=>evaluate('Array.from(document.querySelectorAll('+JSON.stringify(selector)+')).filter(e=>e.getClientRects().length>0).length');
    const click=async selector=>{await evaluate('document.querySelector('+JSON.stringify(selector)+').click()');await delay(120)};
    const items=[['Ir para Filmes','movies'],['Ir para Séries','series'],['Ir para Canais ao Vivo','live'],['Ir para Busca','search']];
    const footer=()=>evaluate('Array.from(document.querySelectorAll(".mobile-bottom-nav button")).map(b=>{const r=b.getBoundingClientRect(),svg=b.querySelector("svg"),i=svg?.getBoundingClientRect();return {name:b.getAttribute("aria-label"),text:b.innerText.trim(),width:r.width,height:r.height,iconWidth:i?.width||0,iconHeight:i?.height||0,active:b.getAttribute("aria-current"),visible:r.width>0&&r.height>0};})');
    for(const width of [320,390,430]) {
      await open(width,844,'Android Mobile',true);
      const buttons=await footer();
      assert.deepEqual(buttons.map(b=>b.name),items.map(([label])=>label),'PHONE_FOOTER_MUST_HAVE_ONLY_FOUR_ROUTES_IN_ORDER');
      assert.ok(buttons.every(b=>b.visible&&b.text===''&&b.width>=44&&b.height>=44&&b.iconWidth>=32&&b.iconHeight>=32),'PHONE_FOOTER_MUST_SHOW_LARGER_ICONS_ONLY_WITH_ACCESSIBLE_TOUCH_TARGETS');
      assert.equal(await visible('.header-home-button,.btn-back'),0,'HOME_MUST_NOT_SHOW_HOME_OR_BACK_BUTTON');
      assert.ok(await evaluate('(()=>{const r=document.querySelector(".mobile-bottom-nav").getBoundingClientRect();return Math.abs(r.bottom-innerHeight)<=1&&Math.abs(r.height-56)<=1;})()'),'FOOTER_GEOMETRY_MUST_BE_PRESERVED');
      pass('PHONE_'+width+'_FOUR_LARGE_ACCESSIBLE_ICONS_ONLY_HOME_WITHOUT_TOP_ACTIONS');
      await screenshot('phone-'+width+'-four-icon-home.png');
      const brandLeft=await evaluate('document.querySelector(".brand-container").getBoundingClientRect().left');
      for(const [label,name] of items.filter(([,name])=>name!=='live').concat([['Ativação','activation']])) {
        // Activation is fixture setup through the hidden desktop route, not a
        // claim that its removed mobile footer action is still available.
        await click(name==='activation'?'.header-nav [aria-label="Ativação"]':'.mobile-bottom-nav [aria-label="'+label+'"]');
        assert.equal(await route(),'Rota: '+name);
        assert.equal(await visible('.header-home-button'),1);assert.equal(await visible('.app-header .btn-back'),1);
        const geometry=await evaluate('(()=>{const rect=s=>document.querySelector(s).getBoundingClientRect(),h=rect(".header-home-button"),b=rect(".app-header .btn-back"),brand=rect(".brand-container"),header=rect(".app-header"),i=rect(".header-home-button svg");return {noOverflow:document.documentElement.scrollWidth<=innerWidth,brandLeft:brand.left,brandRight:brand.right,homeLeft:h.left,homeRight:h.right,backLeft:b.left,backRight:b.right,targets:h.width>=44&&h.height>=44&&b.width>=44&&b.height>=44,contained:h.top>=header.top&&h.bottom<=header.bottom&&b.top>=header.top&&b.bottom<=header.bottom,centered:Math.abs((i.left+i.right-h.left-h.right)/2)<=1&&Math.abs((i.top+i.bottom-h.top-h.bottom)/2)<=1,headerHeight:header.height,text:document.querySelector(".header-home-button").innerText.trim(),name:document.querySelector(".header-home-button").getAttribute("aria-label")};})()');
        assert.ok(geometry.noOverflow&&geometry.targets&&geometry.contained&&geometry.centered);
        assert.ok(Math.abs(geometry.brandLeft-brandLeft)<=1&&geometry.homeLeft>=geometry.brandRight&&geometry.homeRight<=geometry.backLeft&&geometry.backRight<=width&&geometry.backRight>=width-32,'HOME_AND_BACK_MUST_BE_ADJACENT_AT_RIGHT_WITHOUT_MOVING_BRAND');
        assert.ok(geometry.headerHeight>=64);assert.equal(geometry.text,'');assert.equal(geometry.name,'Ir para Início');
        if(name!=='activation')assert.equal((await footer()).find(b=>b.name===label).active,'page');
        pass('PHONE_'+width+'_'+name.toUpperCase()+'_HOME_AND_BACK_AT_RIGHT_NO_OVERLAP');
        await screenshot('phone-'+width+'-'+name+'-home-and-back.png');
        await click('.header-home-button');assert.equal(await route(),'Rota: home');assert.equal(await visible('.header-home-button,.btn-back'),0);
        await click(name==='activation'?'.header-nav [aria-label="Ativação"]':'.mobile-bottom-nav [aria-label="'+label+'"]');
        await focus('.header-home-button');assert.ok(await activeIs('.header-home-button'));await key('Enter');
        assert.equal(await route(),'Rota: home');assert.equal(await visible('.header-home-button,.btn-back'),0);
        pass('PHONE_'+width+'_'+name.toUpperCase()+'_HOME_CLICK_AND_KEYBOARD_USE_EXISTING_NAVIGATION');
      }
      await click('.mobile-bottom-nav [aria-label="Ir para Canais ao Vivo"]');await waitFor(()=>evaluate('!!document.querySelector(".live-page-back")'));
      assert.equal(await visible('.header-home-button,.app-header .btn-back'),0);assert.equal(await visible('.live-page-back'),1);
      pass('PHONE_'+width+'_LIVE_HAS_NO_EXTRA_TOP_HOME_OR_BACK');
      for(const canGoBack of [false,true]) {
        const html=renderToStaticMarkup(React.createElement(headerExports.Header,{currentView:'activation',onNavigate:()=>{},onBack:()=>{},canGoBack,catalogVersion:'Sincronizando...'}));
        await evaluate('(()=>{const wrapper=document.createElement("div");wrapper.id="sync-state-fixture";wrapper.className="app-shell app-shell--phone-header-back";wrapper.style.cssText="position:fixed;left:0;top:0;width:100%;z-index:2000";wrapper.innerHTML='+JSON.stringify(html)+';document.getElementById("root").appendChild(wrapper);})()');
        const geometry=await evaluate('(()=>{const wrapper=document.getElementById("sync-state-fixture"),rect=s=>wrapper.querySelector(s).getBoundingClientRect(),brand=rect(".brand-container"),home=rect(".header-home-button"),back=wrapper.querySelector(".btn-back")?.getBoundingClientRect(),status=rect(".header-sync-status"),last=back||home;return {fits:brand.right<=home.left&&home.right<=(back?.left||home.right)&&last.right<=status.left&&status.right<=innerWidth,noOverflow:document.documentElement.scrollWidth<=innerWidth,statusText:wrapper.querySelector("[role=status]").textContent.trim(),textAccessible:getComputedStyle(wrapper.querySelector(".badge-text")).display!=="none"};})()');
        assert.ok(geometry.fits&&geometry.noOverflow,'SYNC_STATUS_MUST_NOT_OVERLAP_OR_PUSH_PHONE_TOP_ACTIONS');
        assert.equal(geometry.statusText,'Sincronizando...');assert.ok(geometry.textAccessible);
        await evaluate('document.getElementById("sync-state-fixture").remove()');
      }
      pass('PHONE_'+width+'_ACTIVATION_SYNC_STATUS_ACCESSIBLE_WITH_AND_WITHOUT_BACK_HISTORY');
    }
    for(const view of ['home','movies','series','search','activation','live','movie-detail','series-detail']) {
      const html=renderToStaticMarkup(React.createElement(headerExports.Header,{currentView:view,onNavigate:()=>{},canGoBack:false}));
      assert.equal(html.includes('header-home-button'),['movies','series','search','activation'].includes(view),'HOME_ACTION_ROUTE_POLICY_MUST_NOT_DEPEND_ON_BACK_HISTORY');
      assert.equal(html.includes('class="focusable-item btn-back"'),false);
    }
    pass('REAL_HEADER_SSR_ACTIVATION_WITHOUT_HISTORY_KEEPS_HOME_WITHOUT_INVENTING_BACK');
    for(const [label,width,height,ua] of [['TABLET_PORTRAIT',800,1280,'Android SM-X610'],['TABLET_LANDSCAPE',1280,800,'Android SM-X610'],['FIRE',960,540,'FireTV'],['SMART_TV',1920,1080,'SMART-TV Tizen'],['WIDE_PHONE',915,412,'Android Mobile']]) {
      await open(width,height,ua,false);
      for(const name of ['Filmes','Séries','Busca','Ativação']) {
        await click('.header-nav [aria-label="'+name+'"]');
        assert.equal(await visible('.header-home-button,.mobile-bottom-nav'),0,'NON_PHONE_NAVIGATION_MUST_NOT_GAIN_MOBILE_ACTIONS');
        assert.equal(await visible('.header-nav .nav-link'),6);assert.equal(await visible('.app-header .btn-back,.page-back-row .btn-back'),1);
      }
      pass(label+'_SIX_EXISTING_MENU_ACTIONS_AND_BACK_PRESERVED_NO_PHONE_HOME');
    }
  } else if (phoneHeaderBackOnly) {
    const route=()=>evaluate('document.querySelector("[data-testid=route]").textContent');
    const visibleBacks=()=>evaluate('Array.from(document.querySelectorAll(".app-header .btn-back,.page-back-row .btn-back,.live-page-back")).filter(b=>b.getClientRects().length>0).length');
    const navigate=async(selector,index)=>{await evaluate('document.querySelectorAll('+JSON.stringify(selector)+')['+index+'].click()');await delay(120)};
    const geometry=()=>evaluate('(()=>{const b=document.querySelector(".app-header .btn-back,.page-back-row .btn-back"),brand=document.querySelector(".brand-container"),r=b.getBoundingClientRect(),br=brand.getBoundingClientRect(),label=b.querySelector(".back-label");return {left:r.left,right:r.right,width:r.width,height:r.height,brandLeft:br.left,brandRight:br.right,text:b.innerText.trim(),labelVisible:label?label.getClientRects().length>0:false,accessible:b.getAttribute("aria-label"),overflow:document.documentElement.scrollWidth>innerWidth,headerButton:!!b.closest(".app-header")};})()');
    for(const width of [320,390,430]) {
      await open(width,844,'Android Mobile',true);
      const homeBrandLeft=await evaluate('document.querySelector(".brand-container").getBoundingClientRect().left');
      assert.ok(await evaluate('document.querySelector(".app-header").getBoundingClientRect().height>=64'),'PHONE_HOME_HEADER_MUST_MATCH_OTHER_64PX_HEADERS');
      assert.equal(await visibleBacks(),0);
      for(const name of ['movies','series','search']) {
        await navigatePhone(name);assert.equal(await route(),'Rota: '+name);assert.equal(await visibleBacks(),1);
        const layout=await geometry();
        const centering=await evaluate('(()=>{const b=document.querySelector(".app-header .btn-back"),r=b.getBoundingClientRect(),h=document.querySelector(".app-header").getBoundingClientRect(),icon=b.querySelector(".back-arrow-icon"),i=icon?.getBoundingClientRect();return {headerHeight:h.height,contained:r.top>=h.top&&r.bottom<=h.bottom,centered:!!i&&i.width>0&&Math.abs((i.left+i.right-r.left-r.right)/2)<=1&&Math.abs((i.top+i.bottom-r.top-r.bottom)/2)<=1};})()');
        assert.ok(centering.headerHeight>=64,'PHONE_HEADER_MUST_HAVE_ROOM_FOR_CENTERED_BACK');assert.ok(centering.contained);assert.ok(centering.centered,'PHONE_ARROW_MUST_BE_CENTERED_IN_BUTTON');
        assert.ok(layout.left>=layout.brandRight,'PHONE_BACK_MUST_FOLLOW_BRAND_AT_RIGHT');
        assert.ok(Math.abs(layout.brandLeft-homeBrandLeft)<=1,'PHONE_BRAND_MUST_NOT_SHIFT_WHEN_BACK_APPEARS');
        assert.ok(layout.right<=width&&layout.right>=width-32,'PHONE_BACK_MUST_ALIGN_WITH_RIGHT_HEADER_EDGE');
        assert.ok(layout.width>=44&&layout.height>=44,'PHONE_BACK_MUST_KEEP_44PX_TOUCH_TARGET');
        assert.equal(layout.labelVisible,false);assert.equal(layout.text,'','PHONE_BACK_MUST_SHOW_ONLY_DECORATIVE_ICON');
        assert.equal(layout.accessible,'Voltar para a tela anterior');assert.equal(layout.overflow,false);
        pass('PHONE_'+width+'_'+name.toUpperCase()+'_RIGHT_ICON_ACCESSIBLE_NO_BRAND_SHIFT_OR_OVERFLOW');
        await screenshot('phone-'+width+'-'+name+'-right-back.png');
        await evaluate('document.querySelector(".app-header .btn-back").click()');await delay(100);
        assert.equal(await route(),'Rota: home');assert.equal(await visibleBacks(),0);
        await navigatePhone(name);await focus('.app-header .btn-back');
        assert.ok(await activeIs('.app-header .btn-back'));await key('Enter');
        assert.equal(await route(),'Rota: home');assert.equal(await visibleBacks(),0);
        pass('PHONE_'+width+'_'+name.toUpperCase()+'_CLICK_AND_KEYBOARD_RETURN_WITH_SAME_HISTORY');
      }
      await navigatePhone('activation');
      assert.equal((await geometry()).labelVisible,false,'ACTIVATION_NOW_SHARES_PHONE_ICON_ONLY_TOP_ACTIONS');
      await navigatePhone('live');await waitFor(()=>evaluate('!!document.querySelector(".live-page-back")'));
      assert.equal(await visibleBacks(),1);assert.equal(await evaluate('!!document.querySelector(".app-header .btn-back")'),false);
      pass('PHONE_'+width+'_HOME_LIVE_INVARIANTS_AND_ACTIVATION_ICON_ONLY_BACK');
    }
    for(const [label,width,height,ua,mobile,side] of [['TABLET_PORTRAIT',800,1280,'Android SM-X610',false,false],['TABLET_LANDSCAPE',1280,800,'Android SM-X610',false,true],['FIRE',960,540,'FireTV',false,true],['WIDE_PHONE',640,360,'Android Mobile',true,false]]) {
      await open(width,height,ua,mobile);
      for(const [index,name] of [[1,'movies'],[2,'series'],[4,'search']]) {
        await navigate('.header-nav .nav-link',index);const layout=await geometry();
        assert.equal(layout.headerButton,!side);assert.ok(layout.text.includes('Voltar'));assert.equal(layout.overflow,false);
        if(side){const expectedRight=await evaluate('(()=>{const row=document.querySelector(".page-back-row");return document.querySelector(".app-content").getBoundingClientRect().right-parseFloat(getComputedStyle(row).right);})()');assert.ok(Math.abs(layout.right-expectedRight)<=1,'EXISTING_NON_PHONE_RIGHT_BACK_GUTTER_MUST_BE_PRESERVED');}
        else assert.ok(layout.left<layout.brandLeft,'EXISTING_NON_PHONE_HEADER_ORDER_MUST_BE_PRESERVED');
        pass(label+'_'+name.toUpperCase()+'_BACK_LAYOUT_AND_LABEL_UNCHANGED');
      }
    }
  } else if (phoneHomeBackOnly) {
    const visibleBacks=()=>evaluate('Array.from(document.querySelectorAll(".app-header .btn-back,.page-back-row .btn-back,.live-page-back")).filter(b=>b.getClientRects().length>0).length');
    const route=()=>evaluate('document.querySelector("[data-testid=route]").textContent');
    const navigate=async(selector,index)=>{await evaluate('document.querySelectorAll('+JSON.stringify(selector)+')['+index+'].click()');await delay(120)};
    for(const width of [320,390,430]) {
      await open(width,844,'Android Mobile',true);
      assert.equal(await visibleBacks(),0);
      await navigatePhone('movies');assert.equal(await visibleBacks(),1);
      await navigate('.header-home-button',0);assert.equal(await route(),'Rota: home');assert.equal(await visibleBacks(),0,'PHONE_HOME_MUST_NOT_SHOW_BACK_EVEN_WITH_ROUTE_HISTORY');
      assert.equal(await evaluate('document.querySelectorAll(".app-header .btn-back,.page-back-row .btn-back").length'),0,'HOME_MUST_NOT_RENDER_BACK_IN_ANY_LAYOUT');
      pass('PHONE_'+width+'_HOME_BACK_HIDDEN_AFTER_MENU_NAVIGATION_WITH_HISTORY');
      await screenshot('phone-'+width+'-home-no-back.png');
      for(const name of ['series','search','activation']) {
        await navigatePhone(name);assert.equal(await route(),'Rota: '+name);assert.equal(await visibleBacks(),1);
        await evaluate('document.querySelector(".app-header .btn-back").click()');await delay(100);
        assert.equal(await route(),'Rota: home');assert.equal(await visibleBacks(),0);
      }
      pass('PHONE_'+width+'_OTHER_ROUTES_KEEP_BACK_AND_RETURN_HOME_WITHOUT_BACK');
      await navigatePhone('live');await waitFor(()=>evaluate('!!document.querySelector(".live-page-back")'));assert.equal(await visibleBacks(),1);
      await evaluate('document.querySelector(".live-page-back").click()');await delay(100);assert.equal(await visibleBacks(),1);
      await evaluate('document.querySelector(".live-page-back").click()');await delay(100);assert.equal(await route(),'Rota: home');assert.equal(await visibleBacks(),0);
      pass('PHONE_'+width+'_LIVE_SINGLE_BACK_AND_HISTORY_UNCHANGED');
    }
    for(const [label,width,height,ua] of [['TABLET_PORTRAIT',800,1280,'Android SM-X610'],['TABLET_LANDSCAPE',1280,800,'Android SM-X610'],['FIRE',960,540,'FireTV'],['SMART_TV',1920,1080,'SMART-TV Tizen'],['WIDE_PHONE',915,412,'Android Mobile']]) {
      await open(width,height,ua,false);await navigate('.header-nav .nav-link',1);assert.equal(await visibleBacks(),1);
      await navigate('.header-nav .nav-link',0);assert.equal(await route(),'Rota: home');assert.equal(await visibleBacks(),0,'HOME_MUST_NOT_SHOW_BACK_IN_ANY_LAYOUT');
      assert.equal(await evaluate('document.querySelectorAll(".app-header .btn-back,.page-back-row .btn-back").length'),0,'HOME_MUST_NOT_RENDER_BACK_IN_ANY_LAYOUT');
      pass(label+'_HOME_HAS_NO_BACK_EVEN_WITH_HISTORY');
      for(const [index,name] of [[2,'series'],[4,'search'],[5,'activation']]) {
        await navigate('.header-nav .nav-link',index);assert.equal(await route(),'Rota: '+name);assert.equal(await visibleBacks(),1);
        await evaluate('document.querySelector(".app-header .btn-back,.page-back-row .btn-back").click()');await delay(100);
        assert.equal(await route(),'Rota: home');assert.equal(await visibleBacks(),0);
        assert.equal(await evaluate('document.querySelectorAll(".app-header .btn-back,.page-back-row .btn-back").length'),0);
      }
      pass(label+'_OTHER_ROUTES_KEEP_BACK_AND_RETURN_HOME_WITHOUT_BUTTON');
    }
  } else if (categoryRetentionOnly) {
    const counts=()=>evaluate('(()=>{const s=window.__LIVE_GESTURE_FIXTURE__;return {acquire:s.acquire,start:s.start,release:s.release,stop:s.stop,currentId:s.currentId};})()');
    const idle=async()=>{await waitFor(()=>evaluate('window.__LIVE_CATALOG_FIXTURE__.pending===0'));await delay(100)};
    const chooseGroup=async index=>{
      if(await evaluate('!!document.querySelector(".mobile-live-tabs")'))await evaluate('document.querySelector(".mobile-live-tabs button").click()');
      await evaluate('document.querySelectorAll(".live-category-list > button")['+index+'].click()');await idle();
    };
    const listNames=()=>evaluate('Array.from(document.querySelectorAll(".live-channel-list > button")).filter(b=>b.children.length>0).map(b=>b.firstElementChild.nextElementSibling.firstElementChild.textContent.trim())');
    const assertRetained=async baseline=>{
      assert.deepEqual(await counts(),baseline,'CATEGORY_FILTER_PAGE_MUST_NOT_RESTART_OR_RELEASE_PLAYER_SESSION');
      assert.ok(await evaluate('window.__retainedSurface===document.querySelector(".live-preview-surface")'),'PREVIEW_DOM_MUST_NOT_REMOUNT');
    };
    const setFilter=async value=>{
      await evaluate('(()=>{const input=document.querySelector(".live-channel-column input");Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(input,'+JSON.stringify(value)+');input.dispatchEvent(new Event("input",{bubbles:true}));})()');await delay(100);
    };
    for(const [label,width,height,ua,mobile] of [['PHONE',390,844,'Android Mobile',true],['TABLET',1280,800,'Android SM-X610',false],['FIRE',960,540,'FireTV',false]]) {
      await open(width,height,ua,mobile);
      if(mobile)await navigatePhone('live');else await evaluate('document.querySelector(".header-nav [aria-label=Canais]").click()');
      await waitFor(()=>evaluate('!!window.__LIVE_GESTURE_FIXTURE__?.currentId'));await idle();
      await evaluate('document.querySelectorAll("#open-modal,#open-player-overlay").forEach(e=>e.remove());window.__retainedSurface=document.querySelector(".live-preview-surface");undefined');
      const initial=await counts();assert.equal(initial.acquire,1);assert.equal(initial.start,1);
      assert.ok(await evaluate('document.querySelector(".live-channel-summary").textContent.includes("Canal de teste 1")'));
      pass(label+'_ASYNC_INITIAL_FIRST_CHANNEL_STARTS_ONCE');
      await chooseGroup(1);assert.deepEqual(await listNames(),['Canal de teste 51','Canal de teste 52']);await assertRetained(initial);
      assert.equal(await evaluate('document.querySelectorAll(".active-channel").length'),0);
      assert.ok(await evaluate('document.querySelector(".live-channel-summary").textContent.includes("Canal de teste 1")'));
      assert.ok(await evaluate('document.querySelector(".live-preview-panel").textContent.includes("Categoria de teste A")'),'PLAYING_CHANNEL_GROUP_MUST_NOT_FOLLOW_BROWSED_CATEGORY');
      pass(label+'_CATEGORY_CHANGES_LIST_ONLY_ACTIVE_CHANNEL_AND_SESSION_RETAINED');
      await chooseGroup(1);assert.deepEqual(await listNames(),['Canal de teste 51','Canal de teste 52']);await assertRetained(initial);
      pass(label+'_RESELECTING_CATEGORY_DOES_NOT_RESET_PLAYER');
      await chooseGroup(2);assert.equal((await listNames()).length,0);await assertRetained(initial);
      pass(label+'_EMPTY_CATEGORY_KEEPS_ACTIVE_PLAYER');
      await chooseGroup(3);assert.equal((await listNames()).length,0);await assertRetained(initial);
      pass(label+'_FAILED_CATEGORY_PAGE_KEEPS_ACTIVE_PLAYER');
      await evaluate('window.__LIVE_CATALOG_FIXTURE__.delay=180;undefined');
      if(mobile)await evaluate('document.querySelector(".mobile-live-tabs button").click()');
      await evaluate('document.querySelectorAll(".live-category-list > button")[0].click()');
      await delay(40);
      if(mobile)await evaluate('document.querySelector(".mobile-live-tabs button").click()');
      await evaluate('document.querySelectorAll(".live-category-list > button")[1].click()');
      await idle();assert.deepEqual(await listNames(),['Canal de teste 51','Canal de teste 52']);await assertRetained(initial);
      await evaluate('window.__LIVE_CATALOG_FIXTURE__.delay=0;undefined');
      pass(label+'_RAPID_CATEGORY_LOADS_DO_NOT_REPLACE_PLAYER_OR_SHOW_STALE_FIRST_PAGE');
      if(!mobile){await focus('.active-group');await key('ArrowRight');assert.ok(await activeIs('.live-channel-list > button:first-child'));await assertRetained(initial);pass(label+'_DPAD_ENTERS_CHANNEL_LIST_WITHOUT_ACTIVE_CHANNEL_IN_CATEGORY');}
      await chooseGroup(0);assert.equal((await listNames()).length,48);await assertRetained(initial);
      await focus('.live-channel-list > button:nth-last-child(2)');await key('ArrowDown');await idle();
      assert.deepEqual(await listNames(),['Canal de teste 49','Canal de teste 50']);await assertRetained(initial);
      pass(label+'_PAGINATION_CHANGES_LIST_ONLY');
      await setFilter('Canal de teste 50');assert.deepEqual(await listNames(),['Canal de teste 50']);await assertRetained(initial);
      await setFilter('sem resultado');assert.equal((await listNames()).length,0);await assertRetained(initial);
      await setFilter('');await assertRetained(initial);
      pass(label+'_FILTER_AND_EMPTY_RESULTS_KEEP_CURRENT_PLAYER');
      await evaluate('document.querySelector(".live-channel-list > button").click()');
      await waitFor(()=>evaluate('window.__LIVE_GESTURE_FIXTURE__.currentId!=='+JSON.stringify(initial.currentId)));await delay(100);
      const chosen=await counts();assert.equal(chosen.start,initial.start+1);assert.equal(chosen.acquire,initial.acquire+1);assert.equal(chosen.stop,initial.stop+1);assert.equal(chosen.release,initial.release+1);
      assert.equal(await evaluate('document.querySelector(".live-preview-surface").dataset.previewFullscreen'),'false');
      assert.ok(await evaluate('document.querySelector(".active-channel").textContent.includes("Canal de teste 49")'));
      pass(label+'_EXPLICIT_CHANNEL_CLICK_REPLACES_PLAYER_EXACTLY_ONCE_INLINE');
      await chooseGroup(1);await assertRetained(chosen);
      assert.ok(await evaluate('document.querySelector(".live-preview-panel").textContent.includes("Categoria de teste A")'));
      await evaluate('(()=>{const s=window.__LIVE_GESTURE_FIXTURE__;s.taps.forEach(listener=>listener({previewId:s.currentId}));})()');
      await waitFor(()=>evaluate('document.querySelector(".live-preview-surface").dataset.previewFullscreen==="true"'));await assertRetained(chosen);
      await evaluate('window.__LIVE_GESTURE_FIXTURE__.nativeBack()');
      await waitFor(()=>evaluate('document.querySelector(".live-preview-surface").dataset.previewFullscreen==="false"'));await assertRetained(chosen);
      pass(label+'_INLINE_TAP_AND_BACK_USE_PLAYING_CHANNEL_OUTSIDE_BROWSED_CATEGORY');
      await chooseGroup(0);await assertRetained(chosen);
      await focus('.live-channel-list > button:nth-last-child(2)');await key('ArrowDown');await idle();
      await evaluate('document.querySelector(".active-channel").click()');
      await waitFor(()=>evaluate('document.querySelector(".live-preview-surface").dataset.previewFullscreen==="true"'));await assertRetained(chosen);
      await evaluate('window.__LIVE_GESTURE_FIXTURE__.nativeBack()');await delay(100);await assertRetained(chosen);
      pass(label+'_RETURN_AND_CONFIRM_SELECTED_CHANNEL_REUSE_SAME_PLAYER');
      await evaluate('(()=>{const s=window.__LIVE_GESTURE_FIXTURE__;s.errors.forEach(listener=>listener({previewId:s.currentId,errorCode:"LIVE_PREVIEW_PLAYBACK_FAILED"}));})()');await delay(100);
      const failed=await counts();await chooseGroup(1);await assertRetained(failed);
      assert.ok(await evaluate('document.querySelector(".live-preview-surface h3").textContent.includes("LIVE_PREVIEW_PLAYBACK_FAILED")'));
      pass(label+'_CATEGORY_DOES_NOT_CLEAR_EXISTING_PLAYBACK_ERROR_OR_RETRY');
      await screenshot(label.toLowerCase()+'-category-retention.png');
      await evaluate('window.__SIDE_NAV_FIXTURE__.unmount()');await delay(100);
      assert.equal(await evaluate('window.__LIVE_GESTURE_FIXTURE__.taps.size+window.__LIVE_GESTURE_FIXTURE__.errors.size+window.__LIVE_GESTURE_FIXTURE__.fullscreen.size'),0);
      pass(label+'_UNMOUNT_REMOVES_PREVIEW_LISTENERS');
    }
  } else if (mobileCleanOnly) {
    for (const [width,height] of [[320,568],[390,844],[430,932]]) {
      await open(width,height,'Android Mobile',true);
      await navigatePhone('live');
      await waitFor(()=>evaluate('!!document.querySelector(".mobile-live-tabs")'));
      // Fixture-only overlay launchers are siblings absent from the real App.
      await evaluate('document.querySelectorAll("#open-modal,#open-player-overlay").forEach(e=>e.remove());undefined');
      assert.equal(await evaluate('document.querySelectorAll(".mobile-live-tabs button").length'),2,'MOBILE_MUST_HAVE_ONLY_CATEGORIES_AND_CHANNELS_TABS');
      await waitFor(()=>evaluate('!!window.__LIVE_GESTURE_FIXTURE__?.currentId'));
      const layout=()=>evaluate('(()=>{const rect=q=>document.querySelector(q).getBoundingClientRect(),h=rect(".live-page-header"),s=rect(".live-preview-surface"),t=rect(".mobile-live-tabs"),l=rect(".live-channel-column"),n=rect(".mobile-bottom-nav");return {headerBottom:h.bottom,surfaceTop:s.top,surfaceBottom:s.bottom,surfaceWidth:s.width,surfaceHeight:s.height,tabsTop:t.top,tabsBottom:t.bottom,listTop:l.top,listBottom:l.bottom,navTop:n.top,overflow:document.documentElement.scrollWidth>innerWidth,backs:document.querySelectorAll(".app-header .btn-back,.live-page-back,.page-back-row").length};})()');
      const r=await layout();console.log('MOBILE_FIXTURE_LAYOUT '+JSON.stringify(r));
      console.log('MOBILE_LIST_GEOMETRY '+JSON.stringify(await evaluate('(()=>{const l=document.querySelector(".live-channel-list"),h=l.previousElementSibling;return {list:l.clientHeight,header:h.clientHeight,headerPadding:getComputedStyle(h).padding,headerMargin:getComputedStyle(h.firstElementChild).marginBottom,shortViewport:matchMedia("(max-height:650px)").matches,rootFont:getComputedStyle(document.documentElement).fontSize};})()')));
      assert.equal(r.backs,1);assert.equal(r.overflow,false);assert.ok(r.surfaceWidth>0&&r.surfaceHeight>0);
      assert.ok(Math.abs(r.surfaceWidth/r.surfaceHeight-16/9)<0.01);
      assert.equal(r.surfaceWidth,width,'MOBILE_PREVIEW_MUST_FILL_WIDTH_EDGE_TO_EDGE');
      assert.ok(r.surfaceTop>=r.headerBottom&&r.surfaceBottom<=r.tabsTop&&r.tabsBottom<=r.listTop);
      assert.ok(r.listBottom<=r.navTop&&r.listBottom-r.listTop>60,'CHANNEL_LIST_MUST_REMAIN_USABLE_ABOVE_BOTTOM_NAV');
      assert.ok(await evaluate('document.querySelector(".live-channel-list").clientHeight>=48'),'REAL_CHANNEL_LIST_MUST_SHOW_AT_LEAST_ONE_ROW');
      assert.equal(await evaluate('/Trocar Categoria|Voltar para Lista|CONEXÃO DIRETA À FONTE|THREE-PANE PREVIEW|MOBILE FLUXO/i.test(document.body.innerText)'),false);
      pass('MOBILE_'+width+'_CLEAN_HEADER_SINGLE_BACK_VIDEO_ABOVE_TWO_TABS');
      await evaluate('window.__mobileSurface=document.querySelector(".live-preview-surface");window.__mobilePreview=window.__LIVE_GESTURE_FIXTURE__.currentId;undefined');
      const initial=await evaluate('({start:window.__LIVE_GESTURE_FIXTURE__.start,acquire:window.__LIVE_GESTURE_FIXTURE__.acquire,geometry:window.__LIVE_GESTURE_FIXTURE__.geometry})');
      for(const index of [0,1,0,1]) {
        await evaluate('document.querySelectorAll(".mobile-live-tabs button")['+index+'].click()');await delay(80);
        assert.ok(await evaluate('window.__mobileSurface===document.querySelector(".live-preview-surface")&&window.__mobilePreview===window.__LIVE_GESTURE_FIXTURE__.currentId&&document.querySelector(".live-preview-surface").getBoundingClientRect().height>0'));
      }
      const switched=await evaluate('({start:window.__LIVE_GESTURE_FIXTURE__.start,acquire:window.__LIVE_GESTURE_FIXTURE__.acquire})');
      assert.equal(switched.start,initial.start);assert.equal(switched.acquire,initial.acquire);
      pass('MOBILE_'+width+'_TABS_KEEP_SAME_VISIBLE_PREVIEW_WITHOUT_RESTART_SESSION');
      await evaluate('(()=>{const list=document.querySelector(".live-channel-list"),fill=document.createElement("div");fill.style.cssText="height:1800px;min-height:1800px";fill.dataset.mobileScrollFixture="true";list.appendChild(fill);list.scrollTop=100;list.dispatchEvent(new Event("scroll"));})()');
      await delay(80);const scrolled=await layout();assert.equal(scrolled.surfaceTop,r.surfaceTop);
      assert.ok(await evaluate('document.querySelector(".live-channel-list").scrollTop>0'));
      assert.ok(await evaluate('window.__LIVE_GESTURE_FIXTURE__.geometry')>initial.geometry,'SURFACE_GEOMETRY_LISTENER_MUST_ATTACH_AFTER_ASYNC_CATALOG_LOAD');
      await evaluate('document.querySelector("[data-mobile-scroll-fixture]").remove();document.querySelector(".live-channel-list").scrollTop=0;undefined');
      pass('MOBILE_'+width+'_LIST_SCROLL_KEEPS_VIDEO_FIXED_AND_GEOMETRY_UPDATED');
      await evaluate('(()=>{const input=document.querySelector(".live-channel-column input");Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(input,"Canal de teste 2");input.dispatchEvent(new Event("input",{bubbles:true}));})()');
      await waitFor(()=>evaluate('document.querySelectorAll(".live-channel-list > button").length===1'));
      assert.equal(await evaluate('window.__LIVE_GESTURE_FIXTURE__.start'),initial.start);
      await evaluate('(()=>{const input=document.querySelector(".live-channel-column input");Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(input,"");input.dispatchEvent(new Event("input",{bubbles:true}));})()');
      await waitFor(()=>evaluate('document.querySelectorAll(".live-channel-list > button").length===2'));
      pass('MOBILE_'+width+'_FILTER_REMAINS_LOCAL_WITHOUT_RESTART');
      await evaluate('Array.from(document.querySelectorAll(".live-channel-list > button")).find(b=>!b.classList.contains("active-channel")).click()');
      await waitFor(()=>evaluate('!!window.__LIVE_GESTURE_FIXTURE__.currentId&&window.__LIVE_GESTURE_FIXTURE__.currentId!==window.__mobilePreview'));
      const playing=await evaluate('({start:window.__LIVE_GESTURE_FIXTURE__.start,acquire:window.__LIVE_GESTURE_FIXTURE__.acquire})');
      assert.equal(playing.start,initial.start+1);assert.equal(playing.acquire,initial.acquire+1);
      assert.equal(await evaluate('document.querySelector(".live-preview-surface").dataset.previewFullscreen'), 'false');
      pass('MOBILE_'+width+'_FIRST_DIFFERENT_CHANNEL_CLICK_ONLY_STARTS_INLINE');
      assert.equal(await evaluate('!!document.querySelector(".live-native-player-button")'),false);
      await evaluate('document.querySelector(".active-channel").click()');
      await waitFor(()=>evaluate('document.querySelector(".live-preview-surface").dataset.previewFullscreen==="true"'));
      assert.equal(await evaluate('window.__LIVE_GESTURE_FIXTURE__.start'),playing.start);
      await evaluate('window.__LIVE_GESTURE_FIXTURE__.nativeBack()');
      await waitFor(()=>evaluate('document.querySelector(".live-preview-surface").dataset.previewFullscreen==="false"'));
      pass('MOBILE_'+width+'_SECOND_CHANNEL_CLICK_AND_NATIVE_BACK_REUSE_PREVIEW_WITHOUT_BUTTON');
      await evaluate('(()=>{const s=window.__LIVE_GESTURE_FIXTURE__;s.taps.forEach(listener=>listener({previewId:s.currentId}));})()');
      await waitFor(()=>evaluate('document.querySelector(".live-preview-surface").dataset.previewFullscreen==="true"'));
      assert.equal(await evaluate('window.__LIVE_GESTURE_FIXTURE__.start'),playing.start);
      assert.equal(await evaluate('window.__LIVE_GESTURE_FIXTURE__.acquire'),playing.acquire);
      await evaluate('window.__LIVE_GESTURE_FIXTURE__.nativeBack()');
      await waitFor(()=>evaluate('document.querySelector(".live-preview-surface").dataset.previewFullscreen==="false"'));
      pass('MOBILE_'+width+'_NATIVE_INLINE_TAP_AND_BACK_KEEP_AUTHORIZED_SESSION');
      await screenshot('phone-'+width+'-clean-live.png');
      await evaluate('document.querySelector(".live-page-back").click()');
      assert.ok(await evaluate('!!document.querySelector(".live-category-list")'));
      await evaluate('document.querySelector(".live-page-back").click()');
      await waitFor(()=>evaluate('document.querySelector("[data-testid=route]").textContent==="Rota: home"'));
      pass('MOBILE_'+width+'_SINGLE_BACK_PRESERVES_CATEGORIES_THEN_HISTORY');
    }
  } else if (liveScrollOnly) {
    await open(1280,800,'Android SM-X610',false);
    await evaluate('document.querySelectorAll(".header-nav .nav-link")[3].click()');
    await waitFor(()=>evaluate('!!document.querySelector(".active-channel")'));
    await assertLiveScrollIsolation('TABLET');
  } else if (liveInteractions) {
    const counts=()=>evaluate('(()=>{const s=window.__LIVE_GESTURE_FIXTURE__;return {acquire:s.acquire,start:s.start,enter:s.enter,release:s.release,stop:s.stop,exit:s.exit,taps:s.taps.size,errors:s.errors.size,fullscreen:s.fullscreen.size,currentId:s.currentId};})()');
    const fullscreen=()=>evaluate('document.querySelector(".live-preview-surface")?.dataset.previewFullscreen==="true"');
    const ready=async()=>{await waitFor(()=>evaluate('!!window.__LIVE_GESTURE_FIXTURE__?.currentId'));await delay(80)};
    const openLive=async(width,height,ua)=>{await open(width,height,ua,false);await evaluate('document.querySelectorAll(".header-nav .nav-link")[3].click()');await ready()};
    const chooseOther=()=>evaluate('(()=>{const active=document.querySelector(".active-channel");Array.from(active.parentElement.querySelectorAll("button")).find(button=>button!==active).click();})()');
    const tap=()=>evaluate('(()=>{const s=window.__LIVE_GESTURE_FIXTURE__;s.taps.forEach(listener=>listener({previewId:s.currentId}));})()');
    const nativeBack=async()=>{await evaluate('window.__LIVE_GESTURE_FIXTURE__.nativeBack()');await waitFor(async()=>!await fullscreen())};
    for (const [label,width,height,ua] of [['FIRE',960,540,'FireTV'],['TABLET',1280,800,'Android SM-X610'],['TABLET_PORTRAIT',800,1280,'Android SM-X610']]) {
      await openLive(width,height,ua);
      assert.equal(await evaluate('!!document.querySelector(".live-native-player-button")'),false,'GESTURES_MUST_WORK_WITHOUT_NATIVE_BUTTON_IN_ALL_LAYOUTS');
      const initial=await counts();
      assert.equal(await fullscreen(),false);assert.equal(initial.acquire,1);assert.equal(initial.start,1);assert.equal(initial.taps,1);
      pass(label+'_INITIAL_SELECTION_IS_INLINE');
      await chooseOther();await ready();
      const selected=await counts();
      assert.equal(await fullscreen(),false);assert.equal(selected.acquire,initial.acquire+1);assert.equal(selected.start,initial.start+1);
      pass(label+'_FIRST_DIFFERENT_CHANNEL_CLICK_ONLY_SELECTS');
      await focus('.active-channel');await key('Enter');await waitFor(fullscreen);
      const expanded=await counts();
      assert.equal(expanded.enter,selected.enter+1);assert.equal(expanded.start,selected.start);assert.equal(expanded.acquire,selected.acquire);assert.equal(expanded.currentId,selected.currentId);
      pass(label+'_SECOND_CONFIRMATION_EXPANDS_SAME_PREVIEW_WITHOUT_NEW_SESSION');
      await nativeBack();
      assert.ok(await evaluate('!!document.querySelector(".active-channel")'));assert.equal((await counts()).acquire,selected.acquire);
      pass(label+'_NATIVE_BACK_EVENT_RESTORES_INLINE_AND_KEEPS_SELECTION_SESSION');
      if(label.startsWith('TABLET')){
        await evaluate('window.__LIVE_GESTURE_FIXTURE__.taps.forEach(listener=>listener({previewId:"stale-fixture-preview"}))');await delay(100);
        assert.equal((await counts()).enter,expanded.enter);
        pass(label+'_STALE_NATIVE_TAP_IGNORED');
        await tap();await waitFor(fullscreen);assert.equal((await counts()).enter,expanded.enter+1);assert.equal((await counts()).start,selected.start);
        pass(label+'_NATIVE_INLINE_TAP_USES_SAME_FULLSCREEN');
        await nativeBack();
      }
      await screenshot(label.toLowerCase()+'-gesture-inline.png');
    }
    const beforeConcurrent=await counts();
    await evaluate('window.__LIVE_GESTURE_FIXTURE__.fullscreenDelay=250;document.querySelector(".active-channel").click();document.querySelector(".active-channel").click();undefined');
    await waitFor(fullscreen);await delay(100);
    assert.equal((await counts()).enter,beforeConcurrent.enter+1);
    pass('DUPLICATE_CONFIRMATIONS_SHARE_ONE_FULLSCREEN_COMMAND');
    await nativeBack();
    await evaluate('window.__LIVE_GESTURE_FIXTURE__.fullscreenDelay=0;window.__LIVE_GESTURE_FIXTURE__.startDelay=250;undefined');
    await chooseOther();await delay(70);
    const pending=await counts();await evaluate('document.querySelector(".active-channel").click()');
    assert.equal((await counts()).enter,pending.enter);await ready();assert.equal(await fullscreen(),false);
    pass('CONFIRMATION_WHILE_PREPARING_NEVER_EXPANDS_OLD_PREVIEW');
    await evaluate('window.__LIVE_GESTURE_FIXTURE__.startDelay=0;window.__LIVE_GESTURE_FIXTURE__.fullscreenDelay=250;document.querySelector(".active-channel").click();undefined');
    await chooseOther();await ready();await delay(300);assert.equal(await fullscreen(),false);
    pass('STALE_FULLSCREEN_RESULT_AFTER_CHANNEL_CHANGE_IGNORED');
    await evaluate('window.__LIVE_GESTURE_FIXTURE__.fullscreenDelay=0;window.__LIVE_GESTURE_FIXTURE__.failFullscreen=true;undefined');
    const beforeFailure=await counts();await tap();
    await waitFor(()=>evaluate('document.querySelector(".live-preview-surface h3")?.textContent.includes("LIVE_PREVIEW_FULLSCREEN_FAILED")'));
    assert.equal(await fullscreen(),false);assert.equal((await counts()).acquire,beforeFailure.acquire);
    pass('FULLSCREEN_FAILURE_STAYS_ON_LIVE_WITH_SANITIZED_ERROR');
    await evaluate('window.__LIVE_GESTURE_FIXTURE__.failFullscreen=false;undefined');await tap();await waitFor(fullscreen);
    pass('FULLSCREEN_RETRY_REUSES_EXISTING_AUTHORIZED_PREVIEW');
    await nativeBack();
    await evaluate('window.__LIVE_GESTURE_FIXTURE__.allowSession=false;undefined');
    const beforeDenied=await counts();await chooseOther();
    await waitFor(()=>evaluate('document.querySelector(".live-preview-surface h3")?.textContent.includes("SESSION_LIMIT_REACHED")'));
    await evaluate('document.querySelector(".active-channel").click()');await delay(80);
    assert.equal((await counts()).start,beforeDenied.start);assert.equal((await counts()).enter,beforeDenied.enter);assert.equal(await fullscreen(),false);
    pass('DENIED_C9_SESSION_CANNOT_START_OR_EXPAND_PREVIEW');
    await evaluate('window.__SIDE_NAV_FIXTURE__.unmount()');await delay(100);
    const disposed=await counts();assert.equal(disposed.taps,0);assert.equal(disposed.errors,0);assert.equal(disposed.fullscreen,0);
    pass('ALL_NATIVE_PREVIEW_LISTENERS_REMOVED_ON_UNMOUNT');
  } else {
  if (!remainingOnly && !liveOnly) {
  for (const [name, width, height, ua, mobile, expected] of [
    ['fire-960',960,540,'Android 9; AFTSSS Mobile',true,true],
    ['fire-1280',1280,720,'FireTV',false,true],
    ['smart-tv',1920,1080,'SMART-TV Tizen',false,true],
    ['tablet',1280,800,'Android SM-X610',false,true],
    ['small-tablet',1024,600,'Android Tablet',false,true],
    ['tablet-portrait',800,1280,'Android SM-X610',false,false],
    ['phone-portrait',390,844,'Android Mobile',true,false],
    ['phone-landscape',915,412,'Android Mobile',true,false],
    ['large-phone-landscape',1280,720,'Android Mobile',true,false],
  ]) {
    await open(width, height, ua, mobile);
    assert.equal(await evaluate('document.querySelector(".app-shell").classList.contains("app-shell--side-nav")'), expected, name);
    if (expected) {
      const layout = await evaluate('(()=>{const h=document.querySelector(".app-header").getBoundingClientRect();const m=document.querySelector("main").getBoundingClientRect();return {left:h.left,top:h.top,height:h.height,right:h.right,mainLeft:m.left,overflow:document.documentElement.scrollWidth>innerWidth};})()');
      assert.equal(layout.left,0); assert.equal(layout.top,0); assert.equal(layout.height,height); assert.ok(layout.mainLeft>=layout.right); assert.equal(layout.overflow,false);
    }
    const labels = await evaluate('Array.from(document.querySelectorAll(".header-nav .nav-link")).every(button=>!!button.getAttribute("aria-label")&&(getComputedStyle(button.querySelector(".nav-label")).display!=="none")==='+!expected+'&&(getComputedStyle(button.querySelector(".nav-icon")).display!=="none")==='+expected+')');
    assert.ok(labels, 'ICONS_ONLY_IN_SIDEBAR_ACCESSIBLE_NAMES_AND_PHONE_LABELS_PRESERVED');
    await screenshot(`${name}.png`);
    pass(`RESPONSIVE_${name.toUpperCase()}`);
  }
  await open(960,540,'Android 9; AFTSSS Mobile',true);
  await focus(deepCard);
  const before = await evaluate('scrollY'); assert.ok(before > 1000);
  await key('ArrowLeft'); assert.ok(await activeIs(`${menu}.active`));
  assert.ok(Math.abs(await evaluate('scrollY')-before)<1,'MENU_MUST_NOT_SCROLL_HOME_TO_TOP');
  await screenshot('fire-deep-menu.png'); pass('DEEP_RAIL_LEFT_REACHES_FIXED_MENU_WITHOUT_TOP_SCROLL');
  await key('ArrowRight'); assert.ok(await activeIs(deepCard));
  assert.ok(Math.abs(await evaluate('scrollY')-before)<1); pass('RIGHT_RESTORES_SAME_CATEGORY_CARD_AND_SCROLL');
  await key('ArrowRight'); assert.ok(await activeIs('[aria-labelledby="rail-title-fixture-12"] .media-card:nth-child(2)'));
  await key('ArrowLeft'); assert.ok(await activeIs(deepCard)); pass('HORIZONTAL_RAIL_MOVEMENT_PRESERVED');
  await key('ArrowDown'); assert.ok(await activeIs('[aria-labelledby="rail-title-fixture-13"] .media-card:first-child'));
  await key('ArrowUp'); assert.ok(await activeIs(deepCard)); pass('VERTICAL_CATEGORY_ALIGNMENT_PRESERVED');
  // Negative control: old top-header mode cannot exit this deep first card left.
  await evaluate('document.querySelector(".app-shell").classList.remove("app-shell--side-nav")');
  await key('ArrowLeft'); assert.ok(await activeIs(deepCard));
  await evaluate('document.querySelector(".app-shell").classList.add("app-shell--side-nav")'); pass('NEGATIVE_BASELINE_TOP_MENU_REPRODUCES_MISSING_LEFT_ACCESS');
  await key('ArrowLeft'); await key('ArrowDown'); assert.ok(await activeIs(`${menu}:nth-child(2)`));
  await key('ArrowUp'); assert.ok(await activeIs(`${menu}:first-child`)); pass('VERTICAL_MENU_UP_DOWN');
  await key('ArrowDown'); await key('Enter');
  await waitFor(() => evaluate('document.querySelector("[data-testid=route]").textContent.includes("movies")')); pass('ENTER_USES_EXISTING_ROUTE_CALLBACK');
  assert.equal(await evaluate('!!document.querySelector(".app-header .btn-back")'),false);
  assert.ok(await evaluate('!!document.querySelector(".app-content > .page-back-row .btn-back")'));
  const backLayout=await evaluate('(()=>{const b=document.querySelector(".page-back-row .btn-back").getBoundingClientRect(),t=document.querySelector(".page-title").getBoundingClientRect(),row=document.querySelector(".page-back-row");const y=t.top;row.style.display="none";const without=document.querySelector(".page-title").getBoundingClientRect().top;row.style.display="";return {right:b.right,left:b.left,top:b.top,bottom:b.bottom,titleTop:t.top,titleBottom:t.bottom,titleRight:t.right,titleShift:y-without,position:getComputedStyle(row).position};})()');
  assert.equal(backLayout.position,'absolute');assert.ok(backLayout.right>900);assert.ok(backLayout.titleRight<=backLayout.left);assert.ok(backLayout.top<=backLayout.titleBottom&&backLayout.bottom>=backLayout.titleTop);assert.equal(backLayout.titleShift,0);
  await screenshot('movies-back-top-right.png');
  pass('BACK_TOP_RIGHT_ALIGNED_WITH_TITLE_WITHOUT_NEW_ROW_OR_OVERLAP');
  await focus('.catalog-grid .media-card:first-child');await key('ArrowUp');
  assert.ok(await activeIs('.page-back-row .btn-back'));
  pass('TOP_RIGHT_BACK_REACHABLE_FROM_CONTENT_WITH_DPAD');
  await key('Enter');
  await waitFor(()=>evaluate('document.querySelector("[data-testid=route]").textContent.includes("home")'));
  pass('SIDEBAR_BACK_IS_OUTSIDE_MENU_AND_EXISTING_HISTORY_CALLBACK_WORKS');
  await evaluate('document.querySelectorAll(".header-nav .nav-link")[1].click()'); await delay(100);
  const columns = await evaluate('getComputedStyle(document.querySelector(".catalog-grid")).gridTemplateColumns.split(String.fromCharCode(32)).filter(Boolean).length');
  await focus(`.catalog-grid .media-card:nth-child(${columns+1})`); await key('ArrowLeft'); assert.ok(await activeIs(`${menu}.active`));
  await key('ArrowRight'); assert.ok(await activeIs(`.catalog-grid .media-card:nth-child(${columns+1})`)); pass('GRID_LEFT_EDGE_MENU_AND_RETURN');
  await focus('.catalog-grid .media-card:first-child'); await key('ArrowDown'); assert.ok(await activeIs(`.catalog-grid .media-card:nth-child(${columns+1})`)); pass('GRID_DOWN_USES_ACTUAL_CSS_COLUMNS');
  await key('Escape'); await waitFor(() => evaluate('document.querySelector("[data-testid=route]").textContent.includes("home")')); pass('BACK_HISTORY_PRESERVED');
  for(let i=1;i<=6;i++){
    await evaluate(`document.querySelectorAll(${JSON.stringify(menu)})[${i-1}].click()`);
    const expected=['home','movies','series','live','search','activation'][i-1];
    await waitFor(()=>evaluate(`document.querySelector('[data-testid=route]').textContent==='Rota: ${expected}'`));
    assert.ok(await evaluate(`document.querySelectorAll(${JSON.stringify(menu)})[${i-1}].getAttribute('aria-current')==='page'`));
    pass(`UNCHANGED_ROUTE_${expected.toUpperCase()}`);
  }
  await evaluate('document.querySelectorAll(".header-nav .nav-link")[4].click()'); await delay(100);
  await focus('input'); await key('ArrowLeft'); assert.ok(await activeIs('input')); pass('TEXT_INPUT_ARROW_EDITING_NOT_STOLEN');
  await evaluate('document.querySelector(".header-nav .nav-link").click()'); await delay(100);
  for(const button of ['#open-modal','#open-player-overlay']){
    await evaluate(`document.querySelector(${JSON.stringify(button)}).click()`); await delay(80); await focus('#overlay-first');
    await key('ArrowLeft'); assert.ok(await activeIs('#overlay-first')); await key('ArrowRight');
    assert.ok(await activeIs('.modal-content button:last-child, .player-overlay button:last-child')); await key('Enter');
    pass(`SCOPED_OVERLAY_${button.slice(1).toUpperCase()}`);
  }
  }
  if (!remainingOnly) {
    await evaluate('document.querySelectorAll(".header-nav .nav-link")[3].focus()');
    await key('Enter');
    await waitFor(()=>evaluate('!!document.querySelector("[data-dpad-region=live-categories] .active-group")'));
    assert.equal(await evaluate('!!document.querySelector(".app-header .btn-back, .page-back-row")'),false,'LIVE_REUSES_ITS_OWN_CONTENT_BACK_CONTROL');
    assert.equal(await evaluate('!!document.querySelector("main")'),false,'REAL_LIVE_PAGE_HAS_DIV_ROOT');
    assert.ok(await evaluate('(()=>{const b=document.querySelector(".live-page-back").getBoundingClientRect(),h=document.querySelector(".live-page-header").getBoundingClientRect(),t=document.querySelector(".live-page-header h1").getBoundingClientRect();return b.right>innerWidth*0.85&&b.left>=t.right&&b.top>=h.top&&b.bottom<=h.bottom&&b.top<=t.bottom&&b.bottom>=t.top;})()'),'LIVE_BACK_MUST_ALIGN_TOP_RIGHT_WITH_HEADING');
    pass('REAL_LIVE_BACK_TOP_RIGHT_ALIGNED_WITH_HEADER');
    assert.ok(await evaluate('(()=>{const h=document.querySelector(".live-page-header");return h.querySelector("h1").textContent.includes("Canais ao Vivo")&&h.textContent.includes("3 CANAIS")&&!/CONEXÃO DIRETA À FONTE|THREE-PANE PREVIEW|MOBILE FLUXO/i.test(h.textContent);})()'),'LIVE_HEADER_MUST_KEEP_TITLE_COUNT_WITHOUT_TECHNICAL_BADGES');
    pass('LIVE_HEADER_TITLE_COUNT_AND_BACK_PRESERVED_WITHOUT_TECHNICAL_BADGES');
    await key('ArrowRight');
    assert.ok(await activeIs('[data-dpad-region="live-categories"] .active-group'),'SIDEBAR_RIGHT_MUST_ENTER_LIVE_CATEGORY');
    pass('REAL_LIVE_DIV_PAGE_MENU_RIGHT_ENTERS_SELECTED_CATEGORY');
    await key('ArrowDown'); assert.ok(await activeIs('[data-dpad-region="live-categories"] button:nth-child(2)'));
    await key('ArrowUp'); assert.ok(await activeIs('[data-dpad-region="live-categories"] .active-group'));
    await key('ArrowLeft'); assert.ok(await activeIs(`${menu}.active`));
    await key('ArrowRight'); assert.ok(await activeIs('[data-dpad-region="live-categories"] .active-group'));
    pass('LIVE_CATEGORY_VERTICAL_AND_SIDEBAR_RETURN_PRESERVED');
    await screenshot('live-categories-focus.png');
    await assertLivePreviewLayout(true,'FIRE_960_LIVE_BADGE_RIGHT_AND_NO_REDUNDANT_NATIVE_BUTTON');
    await assertLiveScrollIsolation('FIRE_960');
    for(const [name,width,height,ua] of [['fire-1280',1280,720,'FireTV'],['smart-tv',1920,1080,'SMART-TV Tizen'],['tablet',1280,800,'Android SM-X610'],['small-tablet',1024,600,'Android Tablet']]){
      await open(width,height,ua,false);
      await evaluate('document.querySelectorAll(".header-nav .nav-link")[3].click()');
      await assertLivePreviewLayout(true,name.toUpperCase()+'_LIVE_PREVIEW_PRESENTATION');
      await screenshot(name+'-live-preview-layout.png');
      await assertLiveScrollIsolation(name.toUpperCase());
    }
    await evaluate('document.querySelector(".live-channel-details > div:first-child").textContent="Nome de canal extenso ".repeat(12);document.querySelector(".live-channel-details > div:last-child").textContent="fixture-only-id-".repeat(20);undefined');
    assert.ok(await evaluate('(()=>{const c=document.querySelector(".live-channel-summary"),r=c.getBoundingClientRect(),b=c.querySelector(".live-channel-live-badge").getBoundingClientRect();return c.scrollWidth<=c.clientWidth&&b.left>=r.left&&b.right<=r.right;})()'),'LONG_CHANNEL_LABELS_MUST_NOT_PUSH_LIVE_BADGE_OUTSIDE_CARD');
    pass('LONG_CHANNEL_NAME_AND_ID_KEEP_BADGE_INSIDE_CARD');
    await evaluate('window.__livePreviewFixtureSurface=document.querySelector(".live-preview-surface");undefined');
    await viewport(800,1280,'Android SM-X610',false);await delay(200);
    await assertLivePreviewLayout(false,'TABLET_PORTRAIT_KEEPS_ORIGINAL_PREVIEW_LAYOUT');
    await viewport(1280,800,'Android SM-X610',false);await delay(200);
    await assertLivePreviewLayout(true,'TABLET_ROTATED_BACK_RESTORES_REQUESTED_PREVIEW_LAYOUT');
    assert.ok(await evaluate('!document.querySelector(".live-native-player-button")&&window.__livePreviewFixtureSurface===document.querySelector(".live-preview-surface")'),'ROTATION_MUST_KEEP_SAME_PLAYER_SURFACE_WITHOUT_BUTTON');
    await evaluate('delete window.__livePreviewFixtureSurface;undefined');
    pass('ROTATION_PRESERVES_LIVE_SURFACE_WITHOUT_NATIVE_BUTTON');
    await viewport(800,1280,'Android SM-X610',false);await delay(200);
    await focus('.active-channel');await key('Enter');
    assert.equal(await evaluate('document.querySelector(".live-preview-surface").dataset.previewFullscreen'), 'false');
    pass('PORTRAIT_SELECTED_CHANNEL_WITHOUT_READY_PREVIEW_DOES_NOT_EXPAND');
    await evaluate('document.querySelector(".header-nav .nav-link").click()'); await delay(100);
    if (!liveOnly) {
      await open(915,412,'Android Mobile',true);
      await evaluate('document.querySelectorAll(".header-nav .nav-link")[1].click()'); await delay(100);
      assert.ok(await evaluate('!!document.querySelector(".app-header .btn-back")'));
      assert.equal(await evaluate('!!document.querySelector(".page-back-row")'),false);
      await evaluate('document.querySelectorAll(".header-nav .nav-link")[3].click()');
      await waitFor(()=>evaluate('!!document.querySelector(".live-page-back")'));
      assert.equal(await evaluate('getComputedStyle(document.querySelector(".live-page-back")).position'),'static','PHONE_LIVE_BACK_LAYOUT_UNCHANGED');
      assert.equal(await evaluate('document.querySelectorAll(".app-header .btn-back,.live-page-back,.page-back-row").length'),1,'WIDE_PHONE_LIVE_MUST_HAVE_ONE_BACK');
      pass('PHONE_BACK_REMAINS_IN_ORIGINAL_HEADER_LAYOUT');
      await assertLivePreviewLayout(false,'PHONE_LANDSCAPE_PREVIEW_CONTROLS_NOT_REARRANGED');
      await open(390,844,'Android Mobile',true);
      await evaluate('document.querySelectorAll(".header-nav .nav-link")[3].click()');
      await waitFor(()=>evaluate('!!document.querySelector(".mobile-live-tabs")'));
      await evaluate('document.querySelectorAll("#open-modal,#open-player-overlay").forEach(e=>e.remove());undefined');
      assert.ok(await evaluate('(()=>{const h=document.querySelector(".live-page-header"),tabs=document.querySelectorAll(".mobile-live-tabs button");return !/CONEXÃO DIRETA À FONTE|THREE-PANE PREVIEW|MOBILE FLUXO/i.test(h.textContent)&&h.querySelector("h1").textContent.includes("Canais ao Vivo")&&h.textContent.includes("3 CANAIS")&&document.querySelectorAll(".app-header .btn-back,.live-page-back,.page-back-row").length===1&&tabs.length===2&&tabs[0].textContent.includes("Categorias")&&tabs[1].textContent.includes("Canais");})()'),'MOBILE_LIVE_MUST_HAVE_TWO_TABS_ONE_BACK_AND_NO_TECHNICAL_BADGES');
      await screenshot('phone-live-header-clean.png');
      pass('MOBILE_LIVE_HEADER_CLEAN_WITH_TITLE_COUNT_SINGLE_BACK_AND_TWO_TABS');
      await assertLivePreviewLayout(false,'PHONE_PORTRAIT_ALWAYS_VISIBLE_PREVIEW_WITH_FULLSCREEN_ACTION_BELOW_VIDEO');
      await screenshot('phone-preview-always-visible-layout.png');
      await open(960,540,'Android 9; AFTSSS Mobile',true);
    }
  }
  if (!liveOnly) {
  await focus(deepCard); await evaluate('window.__rememberedFixtureCard=document.activeElement; undefined');
  await viewport(800,1280,'Android SM-X610',false); await delay(150);
  assert.equal(await evaluate('!!document.querySelector(".app-shell--side-nav")'),false);
  await viewport(1280,800,'Android SM-X610',false); await delay(150);
  assert.equal(await evaluate('!!document.querySelector(".app-shell--side-nav")'),true);
  assert.ok(await evaluate(`window.__rememberedFixtureCard===document.querySelector(${JSON.stringify(deepCard)})`)); pass('ROTATION_PRESERVES_PAGE_AND_DOM_NOT_REMOUNTED');
  const counts=await evaluate('window.__SIDE_NAV_FIXTURE__.listenerCounts()');
  assert.equal(counts.keydown,1);assert.equal(counts.resize,1);assert.equal(counts.orientationchange,1); pass('ONE_LISTENER_PER_EVENT_AFTER_ROUTES_AND_ROTATION');
  await evaluate('window.__SIDE_NAV_FIXTURE__.unmount()'); await delay(100);
  const disposed=await evaluate('window.__SIDE_NAV_FIXTURE__.listenerCounts()');
  assert.equal(disposed.keydown,0);assert.equal(disposed.resize,0);assert.equal(disposed.orientationchange,0); pass('ALL_NAVIGATION_LISTENERS_REMOVED_ON_UNMOUNT');
  }
  }
  assert.equal(errors.length,0);
  const report={checks,artifacts,errors:errors.length,realBackendCalls:false,physicalAndroid:false,remainingOnly,liveOnly,liveInteractions,categoryRetentionOnly,phoneHomeBackOnly,phoneHeaderBackOnly,phoneFourIconNavigationOnly,phoneDetailHeaderOnly};
  writeFileSync(path.join(artifacts,'report.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report));
  console.log(remainingOnly ? 'C11_LANDSCAPE_SIDE_NAVIGATION_BROWSER_REMAINING=PASS' : 'C11_LANDSCAPE_SIDE_NAVIGATION_BROWSER=PASS');
} catch(error) {
  if(screenshot)try{await screenshot('failure.png');}catch{}
  console.error(error);
  console.error(`ARTIFACTS=${artifacts}`);
  process.exitCode=1;
} finally {
  if(command)try{await command('Browser.close');}catch{}
  if(ws)ws.close();
  if(server)await server.close();
}
