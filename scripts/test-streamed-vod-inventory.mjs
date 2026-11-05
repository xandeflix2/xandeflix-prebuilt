import assert from 'node:assert/strict';
import {parseStreamedVodRows as readRows,STREAMED_VOD_LIMITS as LIMITS,fetchStreamedVodInventory} from '../src/source/source-streamed-vod-inventory.ts';
import {RealSourceImporterService} from '../src/source/real-source-importer.service.ts';
import {InMemoryCatalogStorage} from '../src/bootstrap/storage/in-memory.storage.ts';
import {PackageImporter} from '../src/bootstrap/package-importer.ts';
import {DIRECTORY_JSON_MAX_BYTES} from '../src/source/source-directory-api.ts';
const enc=new TextEncoder();let tests=0;
async function* chunks(value,width=7){const bytes=typeof value==='string'?enc.encode(value):value;for(let i=0;i<bytes.length;i+=width)yield bytes.subarray(i,i+width);}
async function test(name,fn){await fn();tests++;console.log('PASS '+name);}
const fixture=[{stream_id:1,name:'Ação Élite 🧭 {[,\\"',category_id:'0',stream_icon:'https://fixture.invalid/poster.jpg',plot:{ignored:true}},{stream_id:'9999999999999999999',name:'Último título',year:'2026'}];
await test('COMPLETE_ARRAY_UTF8_ESCAPES_UNKNOWN_FIELDS_PROJECTED',async()=>{const result=await readRows(chunks('\uFEFF '+JSON.stringify(fixture)+'\r\n',1));assert.equal(result.rows.length,2);assert.equal(result.rows[0].name,fixture[0].name);assert.equal(result.rows[1].stream_id,fixture[1].stream_id);assert.ok(!Object.hasOwn(result.rows[0],'plot'));});
await test('EMPTY_DOCUMENT_ARRAY_VALID',async()=>assert.deepEqual((await readRows(chunks('[]'))).rows,[]));
for(const [name,text]of [['NO_ARRAY','{}'],['EMPTY',''],['TRUNCATED','[{"stream_id":1,"name":"valid"}'],['TRAILING_COMMA','[{"stream_id":1,"name":"valid"},]'],['TRAILING_PAYLOAD','[]{}'],['SCALAR_ROW','[null]'],['WRONG_BRACKET','[{"stream_id":1,"name":"valid"]]'],['MALFORMED_NESTED','[{"stream_id":1,"name":"valid","x":{"y":}}]']])await test(name,async()=>assert.rejects(readRows(chunks(text)),/STREAMED_VOD_JSON_INVALID/));
for(const[name,rows]of [['DUPLICATE_ID',[fixture[0],{...fixture[0],name:'Conflicting title'}]],['MISSING_NAME',[{stream_id:2}]],['NEGATIVE_ID',[{stream_id:-2,name:'valid'}]],['ROUNDED_NUMBER',[{stream_id:Number.MAX_SAFE_INTEGER+1,name:'valid'}]],['INVALID_FIELD',[{stream_id:2,name:'valid',stream_icon:{}}]]])await test(name,async()=>assert.rejects(readRows(chunks(JSON.stringify(rows))),/STREAMED_VOD_ROW_INVALID/));
await test('INVALID_UTF8',async()=>assert.rejects(readRows(chunks(Uint8Array.from([91,0xC3,40,93]))),/STREAMED_VOD_JSON_INVALID/));
await test('ROW_LIMIT',async()=>assert.rejects(readRows(chunks(JSON.stringify([{stream_id:1,name:'x'.repeat(200)}])),{rowBytes:128}),/STREAMED_VOD_ROW_LIMIT/));
await test('RAW_LIMIT',async()=>assert.rejects(readRows(chunks(JSON.stringify(fixture)),{rawBytes:64}),/STREAMED_VOD_RAW_LIMIT/));
await test('PROJECTED_LIMIT',async()=>assert.rejects(readRows(chunks(JSON.stringify(fixture)),{projectedBytes:64}),/STREAMED_VOD_PROJECTED_LIMIT/));
await test('COUNT_LIMIT',async()=>assert.rejects(readRows(chunks(JSON.stringify(fixture)),{rows:1}),/STREAMED_VOD_COUNT_LIMIT/));
await test('DEPTH_LIMIT',async()=>assert.rejects(readRows(chunks(JSON.stringify([{stream_id:1,name:'valid',extra:{nested:{more:1}}} ])),{depth:2}),/STREAMED_VOD_DEPTH_LIMIT/));
await test('LIMITS_CANNOT_BE_RAISED',async()=>assert.rejects(readRows(chunks('[]'),{rawBytes:LIMITS.rawBytes+1}),/STREAMED_VOD_LIMIT_INVALID/));
await test('ITERATOR_CLOSED_ON_FAILURE',async()=>{let closed=false;async function* source(){try{yield enc.encode('[null]');yield enc.encode('ignored');}finally{closed=true;}}await assert.rejects(readRows(source()),/STREAMED_VOD_JSON_INVALID/);assert.equal(closed,true);});
await test('ABOVE_16_MIB_COMPLETE_RAW_ARRAY_SMALL_PROJECTED_INVENTORY',async()=>{
 async function* source(){yield enc.encode('[');for(let i=1;i<=18000;i++){if(i>1)yield enc.encode(',');yield enc.encode(JSON.stringify({stream_id:i,name:'Title '+i,ignored:'x'.repeat(1000)}));}yield enc.encode(']');}
 const result=await readRows(source());assert.ok(result.rawBytes>16*1024*1024);assert.equal(result.rows.length,18000);assert.equal(result.rows.at(-1).name,'Title 18000');assert.ok(result.projectedBytes<16*1024*1024);
});


const CONFIG={type:'XTREAM',host:'https://inventory.fixture.invalid',username:'fixture-user',password:'fixture-pass'};
const PROVENANCE={kind:'REAL',sourceId:'src_streamedfixture',sourceVersion:1};
function nativeFixture(text,{readError=false,cleanupError=false}={}){
 let offset=0,cleanups=0,starts=0;const bytes=enc.encode(text);
 const transport={
  async startDownload(options){
   starts++;assert.equal(options.maxSourceFileBytes,64*1024*1024);assert.equal(options.progressive,true);
   const url=new URL(options.url);assert.equal(url.origin,CONFIG.host);assert.equal(url.pathname,'/player_api.php');
   assert.equal(url.searchParams.get('username'),CONFIG.username);assert.equal(url.searchParams.get('password'),CONFIG.password);assert.equal(url.searchParams.get('action'),'get_vod_streams');
   assert.equal(options.headers.Accept,'application/json');assert.equal(options.headers['X-Fixture'],'preserved');
   return {success:true,downloadId:'fixture-download',httpResponseReceived:'SIM',httpStatusClass:'2XX',bytesWritten:0,stage:'FILE_WRITE',retryable:false,transportType:'NATIVE_FILE_BACKED'};
  },
  async readChunk({downloadId}){assert.equal(downloadId,'fixture-download');if(readError)return {done:false,bytesRead:0,errorCode:'FILE_IO_FAILURE',stage:'FILE_READ'};
   if(offset===bytes.length)return {done:true,bytesRead:0};const part=bytes.slice(offset,++offset);return {done:false,bytesRead:part.length,dataBase64:Buffer.from(part).toString('base64')};},
  async cleanupDownload({downloadId}){assert.equal(downloadId,'fixture-download');cleanups++;return {success:!cleanupError,stage:'TEMP_CLEANUP',retryable:false,...(cleanupError?{errorCode:'FILE_IO_FAILURE'}:{})};},
  async cancelDownload(){throw Error('UNEXPECTED_GLOBAL_CANCEL');},
 };
 return {transport,counts:()=>({starts,cleanups})};
}
await test('NATIVE_FIXED_ACTION_RAW_LIMIT_UTF8_HEADERS_AND_EXCLUSIVE_CLEANUP',async()=>{
 const f=nativeFixture(JSON.stringify(fixture));const result=await fetchStreamedVodInventory(CONFIG,{nativeTransport:f.transport,headers:{'X-Fixture':'preserved'}});
 assert.equal(result.rows.length,2);assert.equal(result.rows[0].name,fixture[0].name);assert.deepEqual(f.counts(),{starts:1,cleanups:1});assert.equal(DIRECTORY_JSON_MAX_BYTES,16*1024*1024);
});
await test('NATIVE_TRUNCATION_OR_READ_FAILURE_ALWAYS_CLEANED',async()=>{
 for(const [body,settings,error]of [['[{"stream_id":1,"name":"partial"}',{},/STREAMED_VOD_JSON_INVALID/],['[]',{readError:true},/STREAMED_VOD_FETCH_FAILED/]]){
  const f=nativeFixture(body,settings);await assert.rejects(fetchStreamedVodInventory(CONFIG,{nativeTransport:f.transport,headers:{'X-Fixture':'preserved'}}),error);assert.equal(f.counts().cleanups,1);
 }
});
await test('NATIVE_CLEANUP_FAILURE_IS_NOT_SUCCESS',async()=>{const f=nativeFixture('[]',{cleanupError:true});await assert.rejects(fetchStreamedVodInventory(CONFIG,{nativeTransport:f.transport,headers:{'X-Fixture':'preserved'}}),/STREAMED_VOD_CLEANUP_FAILED/);});
await test('UNDECLARED_SOURCE_REJECTED_BEFORE_ANY_REQUEST',async()=>{let calls=0;await assert.rejects(fetchStreamedVodInventory({type:'M3U',playlistUrl:'https://fixture.invalid/other.m3u'},{fetchImpl:async()=>{calls++;return Response.json([]);}}),/STREAMED_VOD_SOURCE_UNSUPPORTED/);assert.equal(calls,0);});
await test('BODYLESS_BROWSER_RESPONSE_NEVER_BUFFERS_64_MIB_TEXT',async()=>{let textRead=false;await assert.rejects(fetchStreamedVodInventory(CONFIG,{fetchImpl:async()=>({ok:true,body:null,text:async()=>{textRead=true;return '[]';}})}),/STREAMED_VOD_FETCH_FAILED/);assert.equal(textRead,false);});
await test('BROWSER_HTTP_FAILURE_REJECTED',async()=>assert.rejects(fetchStreamedVodInventory(CONFIG,{fetchImpl:async()=>new Response('denied',{status:403})}),/STREAMED_VOD_FETCH_FAILED/));
class ObservedStorage extends InMemoryCatalogStorage{
 writes=0;
 async writeStagingSegment(...args){this.writes++;return super.writeStagingSegment(...args);}
}
const largeRows=Array.from({length:18000},(_,i)=>({stream_id:i+1,name:'Synthetic movie '+(i+1),category_id:'1',container_extension:'mp4',stream_icon:'https://artwork.fixture.invalid/poster.jpg',ignored:'x'.repeat(1000)}));
const largeJson=JSON.stringify([...largeRows,{...largeRows[0],category_id:'2'}]);assert.ok(enc.encode(largeJson).length>DIRECTORY_JSON_MAX_BYTES);
function provider(storage,{secondVod,lateFailure=false,denied=false,small=false}={}){
 let vodCalls=0,calls=0,allLists=false;const completed=new Set();
 return {counts:()=>({vodCalls,calls,allLists}),fetchImpl:async(input,init)=>{
  calls++;const url=new URL(String(input)),action=url.searchParams.get('action');assert.equal(url.origin,CONFIG.host);assert.equal(url.pathname,'/player_api.php');assert.equal(init.headers.Accept,'application/json');
  assert.equal(storage.writes,0,'All lists and full streamed document required before any segment');
  if(!action)return Response.json({user_info:{auth:denied?0:1,status:denied?'Disabled':'Active'}});
  completed.add(action);allLists=completed.size===6;
  if(action==='get_vod_streams'){vodCalls++;return new Response(small?JSON.stringify(largeRows.slice(0,2)):secondVod??largeJson);}
  if(action==='get_series'&&lateFailure)return Response.json({invalid:true});
  if(action.endsWith('_categories'))return Response.json(action==='get_vod_categories'?[{category_id:'1',category_name:'Fixture'},{category_id:'2',category_name:'Another category'}]:[{category_id:'1',category_name:'Fixture'}]);
  return Response.json(action==='get_series'?[{series_id:9,name:'Actual series',category_id:'1'}]:[{stream_id:90001,name:'Live fixture',category_id:'1'}]);
 }};
}
const storage=new ObservedStorage();let first;
await test('REAL_IMPORTER_RECOVERS_COMPLETE_OVERSIZE_ROOTS_WITHOUT_EPISODES',async()=>{
 const p=provider(storage);first=await RealSourceImporterService.importXtream(CONFIG,{directoryRoots:true,snapshotId:'streamed-first',storage,provenance:PROVENANCE,fetchImpl:p.fetchImpl});
 assert.equal(first.success,true);assert.equal(first.metrics.canonicalMovieCount,18000);assert.equal(first.metrics.canonicalSeriesCount,1);assert.equal(first.metrics.canonicalEpisodeCount,0);assert.equal(first.metrics.canonicalLiveChannelCount,1);
 assert.equal(first.catalog.extensions.sourceInventoryMode,'DIRECTORY_ROOTS_V1');assert.deepEqual(p.counts(),{vodCalls:1,calls:7,allLists:true});
 const movies=[];for(const entry of first.segmentedStaging.manifest.segments.filter(s=>s.kind==='movies'))movies.push(...JSON.parse(await storage.readStagingSegment('streamed-first',entry.fileName)));
 assert.equal(movies.length,18000);assert.equal(movies.at(-1).id,'movie:18000');assert.equal(movies.at(-1).title,'Synthetic movie 18000');assert.deepEqual(movies[0].categoryIds,['cat:vod:1','cat:vod:2']);assert.ok(!first.segmentedStaging.manifest.segments.some(x=>x.kind==='episodes'));
 const promoted=await new PackageImporter(storage).promoteStagedPackage('streamed-first');assert.equal(promoted.success,true);
 assert.equal((await storage.readActiveManifest()).counts.movies,18000);
});
await test('RECOVERED_IDENTICAL_DOCUMENT_NO_OP_IDS_STABLE',async()=>{
 storage.writes=0;const p=provider(storage);const result=await RealSourceImporterService.importXtream(CONFIG,{directoryRoots:true,unchangedContentDigest:first.contentDigest,snapshotId:'unchanged',storage,provenance:PROVENANCE,fetchImpl:p.fetchImpl});
 assert.equal(result.notModified,true);assert.equal(result.contentDigest,first.contentDigest);assert.equal(storage.writes,0);assert.equal(await storage.readStaging('unchanged'),null);
});
await test('TRUNCATION_DUPLICATE_LATE_FAILURE_PRESERVE_ACTIVE_NO_PARTIAL_STAGE',async()=>{
 const active=await storage.readActivePointer();
 for(const options of [{secondVod:largeJson.slice(0,-1)},{secondVod:JSON.stringify([...largeRows,{...largeRows[0],name:'Conflicting title'}])},{lateFailure:true}]){
  storage.writes=0;const p=provider(storage,options);await assert.rejects(RealSourceImporterService.importXtream(CONFIG,{directoryRoots:true,snapshotId:'failed',storage,provenance:PROVENANCE,fetchImpl:p.fetchImpl}),/STREAMED_VOD_JSON_INVALID|STREAMED_VOD_ROW_INVALID|XTREAM_LIST_INVALID/);
  assert.equal(storage.writes,0);assert.equal(await storage.readStaging('failed'),null);assert.deepEqual(await storage.readActivePointer(),active);
 }
});
await test('DENIED_AUTH_NEVER_USES_LARGE_INVENTORY_READER',async()=>{storage.writes=0;const p=provider(storage,{denied:true});const result=await RealSourceImporterService.importXtream(CONFIG,{directoryRoots:true,storage,fetchImpl:p.fetchImpl});assert.equal(result.success,false);assert.equal(result.error,'HANDSHAKE_AUTH_REJECTED');assert.equal(p.counts().calls,1);assert.equal(p.counts().vodCalls,0);assert.equal(storage.writes,0);});
await test('SMALL_ROOT_LIST_KEEPS_ONE_GLOBAL_REQUEST',async()=>{const s=new ObservedStorage(),p=provider(s,{small:true});const r=await RealSourceImporterService.importXtream(CONFIG,{directoryRoots:true,snapshotId:'small',storage:s,provenance:PROVENANCE,fetchImpl:p.fetchImpl});assert.equal(r.success,true);assert.equal(r.metrics.canonicalMovieCount,2);assert.equal(p.counts().vodCalls,1);});
await test('HTTP_ERROR_IS_NOT_RETRIED_AS_OVERSIZE',async()=>{let vodCalls=0;const s=new ObservedStorage(),p=provider(s);const fetchImpl=async(input,init)=>{if(new URL(String(input)).searchParams.get('action')==='get_vod_streams'){vodCalls++;return new Response('denied',{status:403});}return p.fetchImpl(input,init);};await assert.rejects(RealSourceImporterService.importXtream(CONFIG,{directoryRoots:true,storage:s,fetchImpl}),/DIRECTORY_JSON_FETCH_FAILED/);assert.equal(vodCalls,1);assert.equal(s.writes,0);});
await test('STAGING_IO_FAILURE_PRESERVES_ACTIVE_AND_REMOVES_CANDIDATE',async()=>{
 const active=await storage.readActivePointer(),original=storage.writeStagingSegment.bind(storage);let attempts=0;
 storage.writes=0;storage.writeStagingSegment=async(...args)=>{if(++attempts===2)throw Error('SYNTHETIC_STAGING_IO_FAILURE');return original(...args);};
 try{const p=provider(storage);await assert.rejects(RealSourceImporterService.importXtream(CONFIG,{directoryRoots:true,snapshotId:'io-failed',storage,provenance:PROVENANCE,fetchImpl:p.fetchImpl}),/SYNTHETIC_STAGING_IO_FAILURE/);}
 finally{storage.writeStagingSegment=original;}
 assert.equal(attempts,2);assert.equal(await storage.readStaging('io-failed'),null);assert.deepEqual(await storage.readActivePointer(),active);
});
await test('REAL_RAW_CEILING_REJECTS_WITH_BODY_CANCELLATION',async()=>{
 let produced=0,cancelled=false;const block=new Uint8Array(65536).fill(32);block[0]=91;
 await assert.rejects(fetchStreamedVodInventory(CONFIG,{fetchImpl:async()=>new Response(new ReadableStream({
  pull(controller){const next=block.slice();if(produced)next[0]=32;produced+=next.byteLength;controller.enqueue(next);},
  cancel(){cancelled=true;},
 }))}),/STREAMED_VOD_RAW_LIMIT/);
 assert.equal(cancelled,true);assert.ok(produced<=LIMITS.rawBytes+2*65536);
});
await test('EXACT_DUPLICATES_IDEMPOTENT_ALL_CATEGORY_MEMBERSHIPS_PRESERVED',async()=>{
 const first={stream_id:91,name:'Same film',category_id:'0',container_extension:'mp4',stream_icon:'https://fixture.invalid/cover.jpg',year:'2026'};
 const result=await readRows(chunks(JSON.stringify([first,{...first,category_id:'9'},{...first,category_id:'9'},first])));
 assert.equal(result.rows.length,1);assert.equal(result.rawRows,4);assert.equal(result.duplicateRows,3);assert.deepEqual(result.rows[0].__directoryCategoryIds,['0','9']);
});
await test('DUPLICATE_METADATA_CONFLICTS_NEVER_CHOOSE_FIRST_ROW',async()=>{
 const first={stream_id:91,name:'Same film',category_id:'1',container_extension:'mp4',stream_icon:'https://fixture.invalid/cover.jpg',year:'2026'};
 for(const[key,value]of [['name','Other film'],['container_extension','mkv'],['stream_icon','https://fixture.invalid/different.jpg'],['year','2025']]){
  await assert.rejects(readRows(chunks(JSON.stringify([first,{...first,[key]:value,category_id:'2'}]))),/STREAMED_VOD_ROW_INVALID/);
 }
});
await test('DUPLICATES_COUNT_AGAINST_RAW_RECORD_LIMIT',async()=>{const row={stream_id:1,name:'Same film',category_id:'1'};await assert.rejects(readRows(chunks(JSON.stringify([row,row,row])),{rows:2}),/STREAMED_VOD_COUNT_LIMIT/);});
await test('PROVIDER_CANNOT_INJECT_INTERNAL_CATEGORY_MEMBERSHIPS',async()=>{
 const r=await readRows(chunks(JSON.stringify([{stream_id:1,name:'Film',category_id:'1',__directoryCategoryIds:['999']}])));assert.equal(r.rows[0].__directoryCategoryIds,undefined);
 await assert.rejects(readRows(chunks(JSON.stringify([{stream_id:1,name:'Film',category_id:'bad'},{stream_id:1,name:'Film',category_id:'2'}]))),/STREAMED_VOD_ROW_INVALID/);
});
await test('MULTI_CATEGORY_GROWTH_ENFORCES_PROJECTED_LIMIT',async()=>{
 const row={stream_id:1,name:'Film',category_id:'1'},one=await readRows(chunks(JSON.stringify([row])));
 await assert.rejects(readRows(chunks(JSON.stringify([row,{...row,category_id:'2'}])),{projectedBytes:one.projectedBytes}),/STREAMED_VOD_PROJECTED_LIMIT/);
});
await test('HEAVY_ROOT_REQUESTS_OVERLAP_WITHOUT_EARLY_STAGING',async()=>{
 const s=new ObservedStorage(),p=provider(s,{small:true});let release;const seriesStarted=new Promise(r=>release=r);let seriesSeen=false;
 const fetchImpl=async(input,init)=>{const action=new URL(String(input)).searchParams.get('action');
  if(action==='get_series'){seriesSeen=true;release();return p.fetchImpl(input,init);}
  if(action==='get_vod_streams'){await p.fetchImpl(input,init);return new Response(new ReadableStream({async start(controller){await seriesStarted;controller.enqueue(enc.encode(JSON.stringify(largeRows.slice(0,2))));controller.close();}}));}
  return p.fetchImpl(input,init);
 };
 let timer;try{const r=await Promise.race([RealSourceImporterService.importXtream(CONFIG,{directoryRoots:true,snapshotId:'overlap',storage:s,provenance:PROVENANCE,fetchImpl}),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('ROOTS_DID_NOT_OVERLAP')),3000);})]);assert.equal(r.success,true);assert.equal(seriesSeen,true);}finally{clearTimeout(timer);}
});
await test('FAILED_ROOT_PAIR_DRAINS_OTHER_REQUEST_BEFORE_RETURN',async()=>{
 const s=new ObservedStorage();let vodFinished=false;
 const fetchImpl=async input=>{const action=new URL(String(input)).searchParams.get('action');
  if(!action)return Response.json({user_info:{auth:1,status:'Active'}});
  if(action==='get_series')return new Response('unavailable',{status:503});
  assert.equal(action,'get_vod_streams');await new Promise(r=>setTimeout(r,30));vodFinished=true;return Response.json(largeRows.slice(0,2));
 };
 await assert.rejects(RealSourceImporterService.importXtream(CONFIG,{directoryRoots:true,storage:s,fetchImpl}),/DIRECTORY_JSON_FETCH_FAILED/);
 assert.equal(vodFinished,true);assert.equal(s.writes,0);
});
await test('PER_FILM_CATEGORY_MEMBERSHIPS_BOUNDED',async()=>{await assert.rejects(readRows(chunks(JSON.stringify(Array.from({length:513},(_,i)=>({stream_id:1,name:'Film',category_id:String(i)}))))),/STREAMED_VOD_ROW_INVALID/);});
console.log(JSON.stringify({result:'PASS',tests,realDevice:false}));console.log('STREAMED_VOD_INVENTORY=PASS');
