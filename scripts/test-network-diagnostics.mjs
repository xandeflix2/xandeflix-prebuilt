import fs from 'node:fs';import assert from 'node:assert/strict';import ts from 'typescript';import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
const load=(file,require=()=>{throw Error('UNEXPECTED_IMPORT')})=>{const m={exports:{}};const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText;new Function('require','module','exports','React',code)(require,m,m.exports,React);return m.exports;};
const policy=load('src/network/diagnostic-policy.ts');let count=0;async function test(name,fn){await fn();count++;console.log('PASS '+name)}
await test('NATIVE_OFFLINE_CAPTIVE_VALIDATED_AND_UNKNOWN_ARE_DISTINCT',()=>{
 const native=v=>policy.describeNetwork(policy.nativeNetworkStatus(v));assert.equal(native({available:true,connected:false,validated:true,transport:'wifi'}).tone,'bad');assert.equal(native({available:true,connected:true,validated:true,captive:true,transport:'wifi'}).tone,'bad');assert.equal(native({available:true,connected:true,validated:true,transport:'ethernet'}).tone,'good');assert.equal(native({available:false,connected:true,validated:true}).tone,'pending');assert.equal(policy.describeNetwork({connected:true,validated:null,captive:false,transport:'unknown'}).tone,'pending');
});
const info=(active='1',maximum='2',extra={})=>({user_info:{auth:1,status:'Active',active_cons:active,max_connections:maximum,...extra}});
await test('PROVIDER_EXACT_1_2_2_2_1_1_ZERO_AND_OVER_LIMIT_NOT_CLAMPED',()=>{
 for(const [a,m]of [[1,2],[2,2],[1,1],[0,2],[3,2]])assert.deepEqual(policy.parseSourceConnections(info(String(a),String(m))),{active:a,maximum:m});
});
await test('MISSING_INVALID_UNLIMITED_OR_UNAUTHORIZED_NEVER_FABRICATE_A_COUNT',()=>{
 for(const v of [null,{},[],{user_info:[]},info('1','0'),info('-1','2'),info('1.5','2'),info('1','2',{auth:0}),info('1','2',{status:'Expired'}),info(undefined,undefined,{active_cons:undefined,max_connections:undefined}),info('1e1','2'),info('Infinity','2')])assert.equal(policy.parseSourceConnections(v),null);
});
const signal=()=>new AbortController();const payload=n=>new Response(new Uint8Array(n),{status:200,headers:{'content-type':'application/octet-stream','content-length':String(n)}});
await test('MANUAL_GUARD_AND_ABORTED_SIGNAL_EMIT_ZERO_HTTP_REQUESTS',async()=>{
 let requests=0;const fetchImpl=async()=>{requests++;return payload(0)};await assert.rejects(policy.measureInternet({signal:signal().signal,canRun:()=>false,fetchImpl}),/CANCELLED/);const c=signal();c.abort();await assert.rejects(policy.measureInternet({signal:c.signal,canRun:()=>true,fetchImpl}),/CANCELLED/);assert.equal(requests,0);
});
await test('PUBLIC_FIXED_ENDPOINT_NO_CREDENTIALS_NO_UPLOAD_EXACT_MAX_AND_FINITE_RESULTS',async()=>{
 const calls=[];const result=await policy.measureInternet({signal:signal().signal,canRun:()=>true,fetchImpl:async(url,init)=>{calls.push({url,init});const u=new URL(url);assert.equal(u.origin,'https://speed.cloudflare.com');assert.equal(u.pathname,'/__down');assert.deepEqual([...u.searchParams.keys()],['bytes','t']);assert.equal(init.credentials,'omit');assert.equal(init.referrerPolicy,'no-referrer');assert.equal(init.cache,'no-store');assert.equal(init.redirect,'error');assert.equal(init.headers,undefined);assert.equal(init.body,undefined);return payload(Number(u.searchParams.get('bytes')))}});assert.equal(calls.length,2);assert.equal(result.receivedBytes,5_000_000);assert.equal(result.limited,false);assert.ok(Number.isFinite(result.downloadMbps)&&result.downloadMbps>0);assert.ok(result.responseMs>=0);
});
await test('HTTP_ERROR_AND_HTML_REJECT_WITHOUT_DATA_RESULT',async()=>{
 for(const response of [new Response('',{status:503}),new Response('error',{headers:{'content-type':'text/html'}})])await assert.rejects(policy.measureInternet({signal:signal().signal,canRun:()=>true,fetchImpl:async()=>response}),/HTTP_FAILED/);
});
await test('DECLARED_SIZE_TRUNCATION_AND_EXCESS_BYTES_ARE_REJECTED',async()=>{
 for(const mode of ['declared','short','oversize']){let n=0;await assert.rejects(policy.measureInternet({signal:signal().signal,canRun:()=>true,fetchImpl:async()=>{if(n++===0)return payload(0);if(mode==='declared')return payload(1);return new Response(new Uint8Array(mode==='short'?100:5_000_001),{headers:{'content-type':'application/octet-stream'}})}}),mode==='declared'?/SIZE_INVALID/:mode==='short'?/INCOMPLETE/:/LIMIT_EXCEEDED/)}
});
await test('TOTAL_TIMEOUT_TERMINATES_A_HUNG_TRANSPORT',async()=>{await assert.rejects(policy.measureInternet({signal:signal().signal,canRun:()=>true,fetchImpl:()=>new Promise(()=>{}),timeoutMs:10}),/TIMEOUT/)});
await test('SLOW_LINK_PARTIAL_ESTIMATE_IS_EXPLICITLY_LIMITED',async()=>{
 let n=0,cancelled=false;const value=await policy.measureInternet({signal:signal().signal,canRun:()=>true,timeoutMs:20,fetchImpl:async()=>n++===0?payload(0):new Response(new ReadableStream({start(c){c.enqueue(new Uint8Array(65536))},cancel(){cancelled=true}}))});assert.equal(value.limited,true);assert.equal(value.receivedBytes,65536);assert.equal(cancelled,true);
});
await test('MANUAL_CANCEL_NEVER_BECOMES_A_PARTIAL_SUCCESS',async()=>{
 const c=signal();let n=0;const promise=policy.measureInternet({signal:c.signal,canRun:()=>true,timeoutMs:100,fetchImpl:async()=>n++===0?payload(0):new Response(new ReadableStream({start(s){s.enqueue(new Uint8Array(65536));setTimeout(()=>c.abort(),5)}}))});await assert.rejects(promise,/CANCELLED/);
});
await test('PLAYBACK_START_DURING_READ_CANCELS_AND_CLOSES_STREAM',async()=>{
 let safe=true,n=0,cancelled=false;await assert.rejects(policy.measureInternet({signal:signal().signal,canRun:()=>safe,fetchImpl:async()=>n++===0?payload(0):new Response(new ReadableStream({pull(c){safe=false;c.enqueue(new Uint8Array(1024))},cancel(){cancelled=true}}))}),/CANCELLED/);assert.equal(cancelled,true);
});
let directFetch=()=>{throw Error('UNEXPECTED_SOURCE_REQUEST')};
const directory=load('src/source/source-directory-api.ts',()=>({fetchDeviceDirectM3uStream:(...a)=>directFetch(...a)}));
const source=load('src/network/source-connections.ts',name=>{
 if(name.endsWith('diagnostic-policy.ts'))return policy;
 if(name.endsWith('source-directory-api.ts'))return directory;
 if(name.endsWith('device-direct-fetch.ts'))return {fetchDeviceDirectM3uStream:(...a)=>directFetch(...a)};
 if(name.endsWith('authorized-source-resolver.ts'))return {AuthorizedSourceResolver:{resolve:()=>{throw Error('UNEXPECTED_DEFAULT_AUTH')}}};
 if(name.endsWith('local-secure-source-store.ts'))return {LocalSecureSourceStore:class{},validateLocalSecureSourceRecord:r=>{assert.ok(r.sourceConfig)}};
 if(name.endsWith('/client.ts'))return {getClientBootstrapService:()=>{throw Error('UNEXPECTED_BOOT')}};
 throw Error('UNEXPECTED_IMPORT');
});
const config={type:'M3U',playlistUrl:'https://source.example/get.php?username=synthetic&password=fixture&type=m3u_plus&output=hls'},pointer={kind:'REAL',sourceId:'src_test',sourceVersion:1,snapshotId:'fixture-1'},auth={status:'SOURCE_READY',sourceStatus:'ACTIVE',sourceId:'src_test',sourceVersion:1,protocol:'M3U',mode:'SELF_SERVICE',config};
const deps=()=>({resolve:async()=>auth,pointer:async()=>pointer,local:async()=>undefined,fetch:async()=>info()});
await test('AUTHORIZED_ACTIVE_SOURCE_RETURNS_ONLY_TWO_NUMBERS',async()=>{const value=await source.readSourceConnections(signal().signal,deps());assert.deepEqual(value,{active:1,maximum:2});assert.deepEqual(Object.keys(value),['active','maximum']);assert.equal(JSON.stringify(value).includes('synthetic'),false)});
await test('AUTHORITY_BINDING_AND_VERSION_FAILURES_PREVENT_PROVIDER_REQUEST',async()=>{
 for(const change of [{resolve:async()=>({...auth,status:'DEVICE_REVOKED'})},{resolve:async()=>({...auth,sourceStatus:'DISABLED'})},{resolve:async()=>({...auth,remoteResultCode:'REMOTE_AUTHORITY_UNAVAILABLE'})},{resolve:async()=>({...auth,remoteAuthorityAvailable:false})},{resolve:async()=>({...auth,sourceVersion:0})},{resolve:async()=>({...auth,mode:'UNKNOWN'})},{resolve:async()=>({...auth,protocol:'XTREAM'})},{pointer:async()=>({...pointer,sourceVersion:2})},{pointer:async()=>({...pointer,sourceId:'src_other'})}]){let sent=0;const d={...deps(),...change,fetch:async()=>{sent++;return info()}};assert.equal(await source.readSourceConnections(signal().signal,d),null);assert.equal(sent,0)}
});
await test('SEALED_SOURCE_REQUIRED_FOR_MANAGED_AND_NO_STALE_GENERATION',async()=>{
 let sent=0;const base={...deps(),resolve:async()=>({...auth,config:undefined,mode:'MANAGED'}),fetch:async()=>{sent++;return info()}};assert.equal(await source.readSourceConnections(signal().signal,base),null);assert.equal(sent,0);
 assert.equal(await source.readSourceConnections(signal().signal,{...base,local:async()=>({sourceId:'src_test',sourceVersion:2,protocol:'M3U',sourceConfig:{playlistUrl:config.playlistUrl}})}),null);assert.equal(sent,0);
 assert.deepEqual(await source.readSourceConnections(signal().signal,{...base,local:async()=>({sourceId:'src_test',sourceVersion:1,protocol:'M3U',sourceConfig:{playlistUrl:config.playlistUrl}})}),{active:1,maximum:2});assert.equal(sent,1);
 assert.equal(await source.readSourceConnections(signal().signal,{...base,resolve:async()=>({...auth,mode:'MANAGED',config})}),null);assert.equal(sent,1);
});
await test('SNAPSHOT_SWITCH_OR_ABORT_DISCARDS_OLD_PROVIDER_COUNT',async()=>{
 let n=0;assert.equal(await source.readSourceConnections(signal().signal,{...deps(),pointer:async()=>n++===0?pointer:{...pointer,snapshotId:'other'}}),null);
 const c=signal();assert.equal(await source.readSourceConnections(c.signal,{...deps(),fetch:async()=>{c.abort();return info()}}),null);
});
await test('UNSUPPORTED_PLAYLIST_NEVER_INFERRED_FROM_MEDIA_URL',async()=>{let n=0;assert.equal(await source.readSourceConnections(signal().signal,{...deps(),resolve:async()=>({...auth,config:{type:'M3U',playlistUrl:'https://source.example/play/opaque'}}),fetch:async()=>{n++;return info()}}),null);assert.equal(n,0)});
await test('PROVIDER_METADATA_FETCH_IS_BOUNDED_AND_CLEANS_UP_WITHOUT_MEDIA',async()=>{
 let clean=0;directFetch=async(url,init,options)=>{const u=new URL(url);assert.equal(u.pathname,'/player_api.php');assert.equal(u.searchParams.has('action'),false);assert.equal(options.maxSourceFileBytes,65536);assert.equal(options.connectTimeoutMs,4000);assert.equal(init.headers.Accept,'application/json');return{success:true,stream:{async *readChunks(){yield new TextEncoder().encode(JSON.stringify(info()))},cleanup:async()=>{clean++},cancel:async()=>{}}}};assert.deepEqual(policy.parseSourceConnections(await source.fetchSourceUserInfo(config,signal().signal)),{active:1,maximum:2});assert.equal(clean,1);
});
await test('OVERSIZE_INVALID_JSON_AND_ABORT_ALWAYS_CLOSE_PRIVATE_TRANSPORT',async()=>{
 for(const mode of ['oversize','invalid','abort']){let cleaned=0,cancelled=0;const c=signal();directFetch=async()=>({success:true,stream:{async *readChunks(){if(mode==='abort')c.abort();yield mode==='oversize'?new Uint8Array(65537):new TextEncoder().encode('invalid')},cleanup:async()=>{cleaned++},cancel:async()=>{cancelled++}}});try{assert.equal(await source.fetchSourceUserInfo(config,c.signal),null)}catch(e){assert.ok(e instanceof SyntaxError||/CANCELLED/.test(e.message))}assert.equal(cleaned,1);if(mode!=='invalid')assert.ok(cancelled>=1)}
});
await test('UI_DECLARATIONS_DO_NOT_START_MEASUREMENT_AND_KEEP_ACCESSIBLE_CANCEL',()=>{
 const code=fs.readFileSync('src/ui/components/NetworkSettings.tsx','utf8'),live=fs.readFileSync('src/ui/pages/LiveTvPage.tsx','utf8'),settings=fs.readFileSync('src/ui/pages/SettingsPage.tsx','utf8');assert.ok(code.indexOf('const run = async')<code.indexOf('await measureInternet'));assert.match(code,/onClick=\{\(\) => void run\(\)\}/);assert.match(code,/active.current\?\.abort\(\)/);assert.match(code,/canUpdateSourceCatalog/);assert.match(settings,/title="Internet e conexão"[\s\S]*?mountOnOpen/);assert.equal(live.includes('<ConnectionIndicator'),false);assert.equal(live.includes('className="focusable-item live-page-back"'),false);assert.match(live,/<NetworkConnectionButton onOpenChange=/);assert.ok(code.includes('<ConnectionIndicator includeNetwork={false} />'));
});
await test('BADGE_TEXT_DOES_NOT_CLAIM_INTERNET_ON_BROWSER_ONLINE_ALONE',()=>{
 const ui=load('src/ui/components/ConnectionIndicator.tsx',name=>name==='react'?React:name.endsWith('diagnostic-policy.ts')?policy:name.endsWith('network-status.ts')?{}:name.endsWith('source-connections.ts')?{}:{});
 const html=renderToStaticMarkup(React.createElement(ui.NetworkBadge,{state:{connected:true,validated:null,captive:false,transport:'unknown'}}));assert.match(html,/internet não confirmado/);assert.equal(html.includes('internet validado'),false);
});
await test('NATIVE_MONITOR_HAS_NO_PROBES_AND_RELEASES_CALLBACKS',()=>{
 const code=fs.readFileSync('android/app/src/main/java/com/xandeflix/prebuilt/network/NetworkStatusPlugin.java','utf8');assert.match(code,/registerDefaultNetworkCallback/);assert.match(code,/unregisterNetworkCallback/);assert.match(code,/handleOnDestroy/);assert.match(code,/NET_CAPABILITY_VALIDATED/);assert.equal(/HttpURLConnection|OkHttpClient|openConnection|\.requestNetwork\(|getSSID|getBSSID/.test(code),false);
 const bridge=fs.readFileSync('src/network/network-status.ts','utf8');assert.match(bridge,/owners\.size/);assert.match(bridge,/visibilitychange/);assert.match(bridge,/CapacitorWebFetch/);assert.equal(/setInterval|https?:\/\//.test(bridge),false);
});
console.log(JSON.stringify({result:'PASS',controls:count,networkRequestsToRealServers:0,physicalTestPerformed:false}));console.log('NETWORK_DIAGNOSTICS=PASS');
