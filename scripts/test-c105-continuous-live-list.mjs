import {parentalFixtureBindings} from './lib/parental-fixture-bindings.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import { resolveSegmentRelativePath } from '../src/bootstrap/storage/segment-path-resolver.ts';
import { LIVE_FAVORITES_GROUP_ID, favoriteChannelPage } from '../src/playback/live-favorite-category.ts';
const source=name=>fs.readFileSync(new URL('../'+name,import.meta.url),'utf8');
const load=(name,require)=>{const module={exports:{}};const code=ts.transpileModule(source(name),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;new Function('require','module','exports',code)((name => parentalFixtureBindings(name) ?? (require)(name)),module,module.exports);return module.exports;};
const row=(index,groupId='a')=>({id:`${groupId}:${index}`,name:index===104?'Canal procurado distante':`Canal ${index}`,groupId,streamRef:{sourceItemId:String(index),containerExtension:'ts'}});
const rows=[...Array.from({length:105},(_,i)=>row(i)),...Array.from({length:63},(_,i)=>row(i,'b'))];
const segments=['live_1.json','live_2.json','live_3.json'];
const catalog={snapshotId:'qa',generatedAt:'',groups:[{id:'a',name:'A'},{id:'b',name:'B'}],channels:rows.slice(0,8),channelsByGroup:{a:rows.slice(0,8),b:[]},totalChannels:168,segmentFiles:segments};
const files=new Map([['prebuilt/snapshots/qa/live_catalog.json',JSON.stringify(catalog)]]);
segments.forEach((name,index)=>files.set('prebuilt/snapshots/qa/'+resolveSegmentRelativePath(name),JSON.stringify(rows.slice(index*70,(index+1)*70))));
let snapshot='qa',afterRead;
const filesystem={async readFile({path}){if(path==='prebuilt/active.json')return{data:JSON.stringify({snapshotId:snapshot})};if(afterRead)await afterRead(path);if(!files.has(path))throw Error('READ_FAILED');return{data:files.get(path)};}};
const service=load('src/catalog/live/live-catalog.service.ts',name=>name==='@capacitor/filesystem'?{Filesystem:filesystem,Directory:{Data:'DATA'},Encoding:{UTF8:'utf8'}}:{resolveSegmentRelativePath});
const {LiveCatalogService,readLiveChannelPageForGroupFromSegments}=service;
const signal=()=>new AbortController().signal;
let tests=0;async function test(name,run){await run();tests++;console.log('PASS '+name);}
await test('ALL_LOCAL_ROWS_REACHABLE_IN_CANONICAL_ORDER_WITH_BOUNDED_PAGES',async()=>{
 for(const [group,total] of [['a',105],['b',63]]){const ids=[];let offset=0;do{const page=await LiveCatalogService.loadContinuousChannelPage(group,offset,{expectedSnapshotId:'qa',signal:signal()});assert.ok(page.channels.length<=48);assert.equal(page.totalAvailable,total);ids.push(...page.channels.map(c=>c.id));offset=page.nextOffset;}while(offset!==null);assert.deepEqual(ids,rows.filter(c=>c.groupId===group).map(c=>c.id));assert.equal(new Set(ids).size,total);}
});
await test('FILTER_SEARCHES_BEYOND_FIRST_PAGE_AND_DOES_NOT_MUTATE_CATALOG',async()=>{
 const before=JSON.stringify(catalog);const page=await LiveCatalogService.loadContinuousChannelPage('a',0,{expectedSnapshotId:'qa',signal:signal(),filter:' PROCURADO DISTANTE '});assert.equal(page.totalAvailable,1);assert.equal(page.channels[0].id,'a:104');assert.equal(page.nextOffset,null);assert.equal(JSON.stringify(catalog),before);
 const absent=await LiveCatalogService.loadContinuousChannelPage('a',0,{expectedSnapshotId:'qa',signal:signal(),filter:'ausente'});assert.equal(absent.totalAvailable,0);
});
await test('STALE_ABORT_MISSING_INVALID_SEGMENTS_NEVER_RETURN_FALSE_EMPTY',async()=>{
 const opts={expectedSnapshotId:'qa',signal:signal()};snapshot='other';await assert.rejects(LiveCatalogService.loadContinuousChannelPage('a',0,opts),/CHANGED/);snapshot='qa';
 const abort=new AbortController();afterRead=async path=>{if(path.includes('live_1'))abort.abort();};await assert.rejects(LiveCatalogService.loadContinuousChannelPage('a',0,{...opts,signal:abort.signal}),/CANCELLED/);afterRead=undefined;
 const key='prebuilt/snapshots/qa/'+resolveSegmentRelativePath(segments[2]),backup=files.get(key);files.delete(key);await assert.rejects(LiveCatalogService.loadContinuousChannelPage('a',0,opts),/UNAVAILABLE/);files.set(key,'{}');await assert.rejects(LiveCatalogService.loadContinuousChannelPage('a',0,opts),/INVALID/);files.set(key,backup);
 afterRead=async path=>{if(path.includes('live_2'))snapshot='other';};await assert.rejects(LiveCatalogService.loadContinuousChannelPage('a',0,opts),/CHANGED/);afterRead=undefined;snapshot='qa';
});
await test('VIRTUAL_WINDOW_STAYS_BOUNDED_AT_FIRST_LAST_AND_LARGE_OFFSETS',()=>{
 const {liveVisibleWindow}=load('src/ui/components/ContinuousLiveChannelList.tsx',()=>({}));
 for(const total of [0,63,105,1082,100000])for(const top of [0,47*64,Math.max(0,total-5)*64])for(const height of [300,540,800,2160]){const win=liveVisibleWindow(top,height,total);assert.ok(win.end-win.start<=48);assert.ok(win.offsets.length<=3);assert.ok(win.start>=0&&win.end<=total);}
 const last=liveVisibleWindow(100*64,400,105);assert.equal(last.end,105);assert.ok(last.start<104);
 const ui=source('src/ui/pages/LiveTvPage.tsx');assert.ok(ui.includes('<ContinuousLiveChannelList'));assert.ok(!ui.includes('data-live-page=')&&!ui.includes('Próximos canais ('));
});
await test('LEGACY_PAGE_READ_ORDER_AND_NATIVE_CONTROLS_PRESERVED',async()=>{
 const page=await readLiveChannelPageForGroupFromSegments(catalog,'a',segments,async name=>files.get('prebuilt/snapshots/qa/'+resolveSegmentRelativePath(name)),48,48);assert.equal(page.channels[0].id,'a:48');assert.equal(page.nextOffset,96);
 const ui=source('src/ui/pages/LiveTvPage.tsx');for(const token of ['pageNext','pagePrevious','favoriteLivePage','setNativeLiveControls','getAuthorizedPlaybackSessionGuard'])assert.ok(ui.includes(token));
});
await test('LATE_INITIAL_SEED_NEVER_SCROLLS_USER_BACK_AND_EXPLICIT_NAVIGATION_IS_GROUP_SCOPED',async()=>{
 const ui=source('src/ui/pages/LiveTvPage.tsx');const start=ui.indexOf('  const requestGroupPage = useCallback('),end=ui.indexOf('  // Hidrata uma página',start);assert.ok(start>0&&end>start);
 const snippet=ui.slice(start,end).replace('const requestGroupPage = useCallback(', 'const requestGroupPage = ').replace('}, [liveCatalog?.snapshotId]);','};');
 const js=ts.transpileModule(snippet+'\nmodule.exports=requestGroupPage;',{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const module={exports:{}},navigation=[],loaded=[];const state={groupId:'old',offset:0,nonce:2,focus:false};
 const port={loadChannelPageForGroup:async(id,offset)=>({channels:[row(offset,id)],offset,totalAvailable:105,nextOffset:offset+1}),loadLiveCatalog:async()=>catalog};
 new Function('module','exports','liveCatalog','groupRequest','browseGroupRef','LiveCatalogService','setIsGroupPageLoading','setGroupPage','setChannelScrollRequest','setLiveMessage','LIVE_GROUP_PAGE_SIZE','LIVE_FAVORITES_GROUP_ID','favoriteChannelPage','favoriteChannelsRef',js)(module,module.exports,catalog,{current:null},{current:'a'},port,()=>{},page=>loaded.push(page),fn=>navigation.push(fn(state)),()=>{},48,LIVE_FAVORITES_GROUP_ID,favoriteChannelPage,{current:[]});
 await module.exports('a',0);assert.equal(loaded.length,1);assert.equal(navigation.length,0);
 await module.exports('a',48,false,true);assert.equal(navigation[0].offset,48);assert.equal(navigation[0].groupId,'a');
 await module.exports('a',0,false,true);assert.equal(navigation[1].offset,0);assert.equal(navigation[1].groupId,'a');
 assert.ok(ui.includes('channelScrollRequest.groupId === effectiveGroupId'));
});
console.log(JSON.stringify({tests,pass:true,networkRequests:0,fixtureOnly:true}));
