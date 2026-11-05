import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath,pathToFileURL} from 'node:url';

const ACTIVITY='android/app/src/main/java/com/xandeflix/prebuilt/player/NativePlayerActivity.java';
const PREVIEW='android/app/src/main/java/com/xandeflix/prebuilt/player/NativeAndroidPlayerPlugin.java';
function lexicalJava(code){return code.replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\/\/[^\r\n]*|\/\*[\s\S]*?\*\//g,match=>' '.repeat(match.length));}
export function validateNativeSources(sources){
 for(const[file,source]of Object.entries(sources)){
  const lexical=lexicalJava(source);
  if(/\bSecurePlaybackDiagnosticProbe\s*\.\s*run\s*\(/.test(lexical)||/\bimport\s+static\s+[\w.]*SecurePlaybackDiagnosticProbe\s*\.\s*(?:run|\*)\s*;/.test(lexical))throw Error('EXTRA_DIAGNOSTIC_MEDIA_CONNECTION '+file);
 }
}
function javaFiles(root){const walk=p=>fs.readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(p,e.name)):e.name.endsWith('.java')?[path.join(p,e.name)]:[]);return Object.fromEntries(walk(path.join(root,'android/app/src/main/java')).map(p=>[path.relative(root,p).replaceAll('\\','/'),fs.readFileSync(p,'utf8')]));}
export async function runSuite(root){
 const cases=[],pass=(name,fn)=>{fn();cases.push(name);console.log('PASS '+name);},sources=javaFiles(root);
 pass('NO_DIAGNOSTIC_MEDIA_CALLER_IN_PRODUCTION',()=>validateNativeSources(sources));
 for(const file of [ACTIVITY,PREVIEW]){
  pass('RESTORED_ACTIVE_PROBE_BLOCKED_'+path.basename(file),()=>assert.throws(()=>validateNativeSources({...sources,[file]:sources[file]+'\nSecurePlaybackDiagnosticProbe.run(request, attemptId);\n'}),/EXTRA_DIAGNOSTIC_MEDIA_CONNECTION/));
  pass('STATIC_IMPORTED_PROBE_BLOCKED_'+path.basename(file),()=>assert.throws(()=>validateNativeSources({...sources,[file]:'import static com.xandeflix.prebuilt.player.SecurePlaybackDiagnosticProbe.run;\n'+sources[file]}),/EXTRA_DIAGNOSTIC_MEDIA_CONNECTION/));
  pass('COMMENTS_AND_STRINGS_CANNOT_FAKE_ACTIVE_PROBE_'+path.basename(file),()=>validateNativeSources({...sources,[file]:sources[file]+'\n// SecurePlaybackDiagnosticProbe.run(request, id);\nString documentation="SecurePlaybackDiagnosticProbe.run(request, id)";\n'}));
 }
 pass('FULLSCREEN_REAL_TRANSPORT_KEEPS_PASSIVE_DIAGNOSTICS',()=>{assert.match(sources[ACTIVITY],/setTransferListener\(new TransferListener/);for(const marker of ['DATASOURCE_OPEN_SUCCESS','PLAYER_DATASOURCE_FIRST_BYTE','DATASOURCE_TRANSFER_ENDED','BUFFER_STATE','PLAYER_ERROR'])assert.ok(sources[ACTIVITY].includes(marker));});
 pass('PREVIEW_REUSES_SHARED_DATASOURCE_AND_STATE_OBSERVATION',()=>{assert.match(sources[PREVIEW],/NativePlayerActivity\.buildHttpDataSourceFactory\(request,\s*SecurePlaybackDiagnosticProbe\.enabled/);assert.ok(sources[PREVIEW].includes('BUFFER_STATE'));});
 pass('HLS_MIME_AND_BUFFER_STILL_WIRED_IN_BOTH_PLAYERS',()=>{for(const file of [ACTIVITY,PREVIEW]){assert.ok(sources[file].includes('setMimeType(request.getMediaMimeTypeHint())'));assert.match(sources[file],/configureMediaSource\(mediaSourceFactory\)/);assert.match(sources[file],/setLoadControl\(/);}});
 const savedFetch=globalThis.fetch;globalThis.fetch=()=>{throw Error('UNEXPECTED_NETWORK_IN_SYNTHETIC_C9_TEST')};
 try{
  const {ControlPlaneEngine}=await import(pathToFileURL(path.join(root,'src/control-plane/engine/control-plane-engine.ts')).href);
  const {ControlPlaneCrypto}=await import(pathToFileURL(path.join(root,'src/control-plane/crypto/control-plane-crypto.ts')).href);
  const engine=new ControlPlaneEngine();const {license}=await engine.createLicense({mode:'MANAGED',maxDevices:3,customKey:'SYNTHETIC_SINGLE_TRANSPORT_TEST'});license.maxConcurrentSessions=2;license.customerId='synthetic-single-transport';
  const tokens=new Map();for(const deviceId of ['synthetic-a','synthetic-b','synthetic-c']){const token='SYNTHETIC_NOT_A_REAL_CREDENTIAL_'+deviceId;tokens.set(deviceId,token);engine.devices.set(deviceId,{id:deviceId,deviceId,displayCode:'SYNTHETIC',deviceType:'TV',deviceLabel:'Synthetic',status:'AUTHORIZED',deviceTokenHash:await ControlPlaneCrypto.sha256(token),createdAtIso:new Date().toISOString()});engine.licenseBindings.set(deviceId,{id:deviceId,licenseId:license.id,deviceId,status:'ACTIVE',boundAtIso:new Date().toISOString()});}
  const start=deviceId=>engine.startPlaybackSession({licenseId:license.id,deviceId,deviceToken:tokens.get(deviceId)}),active=r=>engine.playbackSessions.get(r.sessionId)?.status==='ACTIVE';
  const a=await start('synthetic-a'),b=await start('synthetic-b');pass('TWO_AUTHORIZED_DEVICES_KEEP_BOTH_SESSIONS',()=>{assert.equal(a.success,true);assert.equal(b.success,true);assert.ok(active(a)&&active(b));});
  const third=await start('synthetic-c');pass('EXCESS_START_DENIED_WITH_EXISTING_SESSIONS_PRESERVED',()=>{assert.equal(third.success,false);assert.equal(third.code,'SESSION_LIMIT_REACHED');assert.ok(active(a)&&active(b));});
  const heartbeat=await engine.heartbeatPlaybackSession({sessionId:a.sessionId,deviceId:'synthetic-a',sessionToken:a.sessionToken});pass('FIRST_SESSION_HEARTBEAT_SURVIVES_SECOND_DEVICE',()=>assert.equal(heartbeat.success,true));
 }finally{globalThis.fetch=savedFetch;}
 console.log(JSON.stringify({result:'PASS',cases:cases.length,physicalTestPerformed:false,sourceRequests:0,realRpcCalls:0}));console.log('SINGLE_TRANSPORT_PLAYBACK=PASS');return cases;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await runSuite(fileURLToPath(new URL('..',import.meta.url)));
