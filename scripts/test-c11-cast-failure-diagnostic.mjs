import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {CAST_FAILURE_CODES,castFailureNotice} from '../src/playback/cast-failure.ts';
import {openNativeAndroidPlayer} from '../src/playback/native-android-player.bridge.ts';
import {NativeAndroidPlayerAdapter} from '../src/playback/native-android-player.adapter.ts';
import {PlaybackService} from '../src/playback/playback.service.ts';
import {CatalogReadModel} from '../src/catalog/catalog-read-model.ts';
import {WatchHistory} from '../src/playback/watch-history.ts';
import {createPlaybackSupportDiagnostic} from '../src/playback/playback-support-diagnostic.ts';
import {getNativePlaybackErrorNotice} from '../src/playback/native-playback-error-notice.ts';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const leak='https://fixture.invalid/private?token=fixture-secret';
const request={uri:'https://example.org/fixture.mp4',kind:'movie',startPositionMs:1234};
for(const code of CAST_FAILURE_CODES){
  const plugin={open:async()=>{throw Object.assign(new Error(leak),{code});}};
  const bridge=await openNativeAndroidPlayer(request,plugin);
  const adapter=await new NativeAndroidPlayerAdapter(plugin).launch(request);
  assert.equal(bridge.success,false);assert.equal(bridge.errorCode,code);
  assert.equal(adapter.errorCode,code);assert.equal(adapter.errorMessage,castFailureNotice(code));
  const report=createPlaybackSupportDiagnostic({errorCode:adapter.errorCode});
  assert.ok(report.includes('ERROR_CODE='+code+'\n'));
  assert.match(report,/HTTP_STATUS=UNAVAILABLE\nMEDIA3_ERROR_CODE=UNAVAILABLE\nCHECKPOINT=UNKNOWN/);
  assert.equal(getNativePlaybackErrorNotice({errorCode:code}),adapter.errorMessage);
  assert.doesNotMatch(JSON.stringify({bridge,adapter,report}),/fixture-secret|private\?|https:/);
}
for(const code of [undefined,leak,'CAST_MEDIA_ERROR\n'+leak]){
  const result=await openNativeAndroidPlayer(request,{open:async()=>{throw Object.assign(new Error(leak),{code});}});
  assert.equal(result.errorCode,'NATIVE_ERROR');assert.doesNotMatch(JSON.stringify(result),/fixture-secret|https:/);
}
console.log('PASS_CAST_CODES_BRIDGE_ADAPTER_NOTICE_REPORT_AND_RAW_REJECTION_REDACTION');

const movie={id:'mov:fixture:1',title:'Fixture',categoryIds:[],genreIds:[],artworkIds:[],streamIds:['fixture-stream']};
const model=new CatalogReadModel({metadata:{snapshotId:'fixture'},movies:[movie],series:[],seasons:[],episodes:[],streams:[],artworks:[],categories:[],genres:[]},
  {streamRefResolver:async id=>({id,sourceItemId:id,contentKind:'movie',containerExtension:'mp4',directStreamUrl:'https://example.org/fixture.mp4'})});
const values=new Map();const history=new WatchHistory({getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)});
let releases=0,allowed=true,accepted=false,termination;
const service=new PlaybackService({history,sessionGuard:{acquireSession:async()=>({allowed,code:'LICENSE_DENIED'}),releaseSession:async()=>{releases++;},onTermination:fn=>{termination=fn;return()=>{};}},
  playerAdapter:{launch:async()=>accepted?{success:true,state:'NATIVE_PLAYER_OPENED'}:{success:false,state:'NATIVE_PLAYER_ERROR',errorCode:'CAST_LOAD_TIMEOUT',errorMessage:castFailureNotice('CAST_LOAD_TIMEOUT')}}});
await service.playMovie(movie.id,model);
assert.equal(service.getCurrentSession().nativeErrorCode,'CAST_LOAD_TIMEOUT');assert.equal(releases,1);
termination('REVOKED','LICENSE_DENIED');assert.equal(service.getCurrentSession().nativeErrorCode,undefined);
await service.stopPlayback();assert.equal(releases,1);assert.equal(service.getCurrentSession().nativeErrorCode,undefined);
allowed=false;await service.playMovie(movie.id,model);assert.equal(service.getCurrentSession().nativeErrorCode,undefined);
allowed=true;accepted=true;await service.playMovie(movie.id,model);assert.equal(service.getCurrentSession().state,'PLAYING');assert.equal(service.getCurrentSession().nativeErrorCode,undefined);
await service.stopPlayback();assert.equal(releases,2);
console.log('PASS_REAL_SERVICE_ONE_RELEASE_NATIVE_CODE_CLEARED_FOR_LICENSE_IDLE_NEXT_ATTEMPT');

const source=ts.createSourceFile('App.tsx',read('src/App.tsx'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const effects=[];function visit(n){if(ts.isCallExpression(n)&&n.expression.getText(source)==='useEffect'&&n.arguments[0].getText(source).includes('defaultPlaybackService.subscribe'))effects.push(n.arguments[0]);ts.forEachChild(n,visit);}visit(source);
assert.equal(effects.length,1);let listener,removed=false;const notices=[],reports=[];
const context={module:{exports:{}},defaultPlaybackService:{subscribe(fn){listener=fn;return()=>{removed=true;};}},setNativePlaybackErrorNotice:value=>notices.push(value),setPlaybackSupportDiagnostic:value=>reports.push(value),getNativePlaybackErrorNotice,
  capturePlaybackSupportDiagnostic:event=>createPlaybackSupportDiagnostic(event,{page:'movie-detail'}),routeStateRef:{current:{current:{view:'movie-detail'}}}};
vm.runInNewContext(ts.transpileModule('module.exports = '+effects[0].getText(source),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,context);
const cleanup=context.module.exports();listener({state:'ERROR',nativeErrorCode:'CAST_MEDIA_ERROR'});
assert.equal(notices.at(-1),castFailureNotice('CAST_MEDIA_ERROR'));assert.match(reports.at(-1),/ERROR_CODE=CAST_MEDIA_ERROR/);
const count=reports.length;listener({state:'ERROR',errorCategory:'LICENSE_ACCESS_DENIED'});assert.equal(reports.length,count);
listener({state:'RESOLVING'});assert.equal(notices.at(-1),null);cleanup();assert.equal(removed,true);
console.log('PASS_REAL_APP_OPEN_FAILURE_HAS_EXISTING_COPY_WHATSAPP_NOTICE_CLEANUP');

const parser={errorCode:'NATIVE_ERROR',errorCategory:'MEDIA_PARSER_FAILURE',media3ErrorCode:3001,checkpoint:'PLAYER_READY'};
assert.match(getNativePlaybackErrorNotice(parser),/Media3 3001/);
assert.match(createPlaybackSupportDiagnostic(parser),/MEDIA3_ERROR_CODE=3001\nCHECKPOINT=PLAYER_READY/);
assert.match(getNativePlaybackErrorNotice({errorCode:'NATIVE_ERROR',errorCategory:'HTTP_ERROR',httpStatus:401}),/HTTP 401/);
const controller=read('android/app/src/main/java/com/xandeflix/prebuilt/cast/CastController.java');
assert.match(controller,/if\(loading && ticket==generation\)\{loadingFailure=null;loading=false;stop\(false\);failed.accept\("CAST_LOAD_TIMEOUT"\)/);
assert.match(controller,/catch\(Exception error\)\{loadingFailure=null;loading=false;stop\(false\);failed.accept\(CastFailurePolicy.loadExceptionCode\(error\)\)/);
assert.ok(controller.includes('cancelled.accept("CAST_LOAD_CANCELLED")'));
assert.ok(controller.includes('if(local==null || !(receiver instanceof Inet4Address) || !receiver.isSiteLocalAddress())'));
console.log('PASS_PARSER_HTTP_CODES_UNCHANGED_CAST_TIMEOUT_CANCEL_LAN_DISTINCT');
