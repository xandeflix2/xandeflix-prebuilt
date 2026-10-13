import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const compile=(file,require)=>{const mod={exports:{}};const code=ts.transpileModule(readFileSync(new URL(file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText;new Function('require','module','exports',code)(require,mod,mod.exports);return mod.exports;};
let event,renewals=0,stops=0,closed=0,localStops=0,answer={success:true,status:'ACTIVE'},session={sessionId:'fixture-session',deviceId:'fixture-device',sessionToken:'fixture-token'};
const plugin={status:async()=>({mobile:true,connected:true,active:true}),addListener:async(_,fn)=>{event=fn;return{remove:async()=>{}};},renew:async()=>{renewals++;},stop:async()=>{stops++;}};
const service={getActiveSession:()=>session,sendHeartbeat:async req=>{assert.deepEqual(req,session);return answer;},closeSession:async()=>{closed++;}};
const clock=globalThis.setTimeout,clear=globalThis.clearTimeout;const scheduled=new Map();let seq=0;
globalThis.setTimeout=fn=>{scheduled.set(++seq,fn);return seq;};globalThis.clearTimeout=id=>scheduled.delete(id);
try {
 const cast=compile('../src/playback/google-cast.ts',name=>{
  if(name==='@capacitor/core')return{Capacitor:{getPlatform:()=> 'android',isPluginAvailable:()=>true},registerPlugin:()=>plugin};
  if(name.endsWith('playback-session.service.ts'))return{getPlaybackSessionService:()=>service};
  if(name.endsWith('native-android-player.bridge.ts'))return{NativeAndroidPlayer:{stopPlayback:async()=>{localStops++;}}};throw new Error(name);
 });
 await cast.armCastAuthorization();event({active:true,connected:true});await new Promise(resolve=>setImmediate(resolve));assert.equal(renewals,1);assert.equal(scheduled.size,1);
 answer={success:false,status:'REVOKED'};const callback=[...scheduled.values()][0];scheduled.clear();callback();await new Promise(resolve=>setImmediate(resolve));assert.equal(renewals,1);assert.equal(stops,1);assert.equal(closed,1);assert.equal(localStops,1);assert.equal(scheduled.size,0);
 answer={success:true,status:'ACTIVE'};await cast.armCastAuthorization();const stale=event;await cast.stopGoogleCast();stale({active:true,connected:true});await new Promise(resolve=>setImmediate(resolve));assert.equal(renewals,1,'stale callback never renews a new authorization');
 session=null;await cast.armCastAuthorization();event({active:true,connected:true});await new Promise(resolve=>setImmediate(resolve));assert.equal(renewals,1);assert.equal(localStops,2);
 console.log('PASS_CAST_LEASE_RENEWS_ONLY_AFTER_C9_ACTIVE_REVOCATION_MISSING_SESSION_STALE_CALLBACK');
 let state={mobile:true,connected:false,active:false};
 const {CastButton}=compile('../src/ui/components/CastButton.tsx',name=>name==='react'?{...React,useEffect(){},useState:initial=>[typeof initial==='boolean'?false:state,()=>{}]}:{GoogleCast:plugin,hasGoogleCast:()=>true});
 assert.ok(renderToStaticMarkup(React.createElement(CastButton)).includes('Transmitir pelo Google Cast'));
 state={mobile:false,connected:false,active:false};assert.equal(renderToStaticMarkup(React.createElement(CastButton)),'');
 state={mobile:true,connected:true,active:true};assert.ok(renderToStaticMarkup(React.createElement(CastButton)).includes('Controlar transmissão na TV'));
 for(const kind of ['Movie','Series']) {
  const page=readFileSync(new URL('../src/ui/pages/'+kind+'DetailPage.tsx',import.meta.url),'utf8');
  assert.ok(page.includes('<Phone'+kind+'Detail'),'detail routes to mobile controls');
  assert.match(readFileSync(new URL('../src/ui/components/Phone'+kind+'Detail.tsx',import.meta.url),'utf8'),/<CastButton(?:\s[^>]*?)?\s*\/>/);
 }
 assert.match(readFileSync(new URL('../src/ui/pages/LiveTvPage.tsx',import.meta.url),'utf8'),/<CastButton(?:\s[^>]*?)?\s*\/>/);
 console.log('PASS_CAST_ICON_DETAILS_LIVE_MOBILE_ONLY_ACCESSIBLE_AND_CONNECTED_STATE');
}finally{globalThis.setTimeout=clock;globalThis.clearTimeout=clear;}
