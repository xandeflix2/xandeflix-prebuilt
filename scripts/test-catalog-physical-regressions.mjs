import assert from 'node:assert/strict';
import {RealSourceImporterService} from '../src/source/real-source-importer.service.ts';
import {InMemoryCatalogStorage} from '../src/bootstrap/storage/in-memory.storage.ts';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const config={type:'M3U',playlistUrl:'https://numeric.fixture.invalid/get.php?username=fixture&password=fixture&type=m3u_plus&output=mpegts'};
const body='#EXTM3U\n'+[
 '#EXTINF:-1 xui-id="11" group-title="M",4x100: Synthetic movie','https://media.fixture.invalid/play/movie-token',
 '#EXTINF:-1 group-title="M",Ordinary movie','https://media.fixture.invalid/movie/22.mp4',
 '#EXTINF:-1 group-title="S",Real series S01E01','https://media.fixture.invalid/play/episode-one',
 '#EXTINF:-1 group-title="S",Real series S01E02','https://media.fixture.invalid/play/episode-two',
].join('\n');
const run=async(text=body,membership=true,options={})=>RealSourceImporterService.importM3u(options.config||config,{sourceId:'src_numericfixture',snapshotId:'numeric-fixture',storage:new InMemoryCatalogStorage(),...options,fetchImpl:async(input)=>{
 const u=new URL(String(input)),a=u.searchParams.get('action');
 if(u.pathname==='/get.php')return new Response(text);
 if(!a)return Response.json({user_info:{auth:options.rejectAuth?0:1,status:'Active'}});
 if(a==='get_live_categories')return Response.json([]);
 if(a==='get_vod_categories')return Response.json([{category_id:'1',category_name:'M'}]);
 assert.equal(a,'get_vod_streams');assert.equal(u.searchParams.get('category_id'),'1');return Response.json(Array.isArray(membership)?membership:membership?[{stream_id:11,category_id:'1'}]:[]);
}});
let tests=0;const test=async(name,fn)=>{await fn();tests++;console.log('PASS '+name);};
await test('NUMERIC_MOVIE_TITLE_SOURCE_TYPE_OVERRIDES_AMBIGUOUS_EPISODE_WITH_STABLE_LINEAGE',async()=>{
 const result=await run();assert.equal(result.success,true);assert.equal(result.catalog.movies.length,2);
 assert.equal(result.catalog.movies.find(m=>m.title.startsWith('4x100')).id,'mov:m3u:xui:11');
 assert.equal(result.catalog.movies.find(m=>m.title==='Ordinary movie').id,'mov:m3u:1');
 assert.equal(result.catalog.series.length,1);assert.equal(result.catalog.series[0].id,'ser:m3u:1');
 assert.equal(result.catalog.streams.find(s=>s.sourceItemId==='ser:m3u:1:s1:e1').id,'str:m3u:ep:2');
 assert.equal(result.catalog.streams.find(s=>s.sourceItemId==='ser:m3u:1:s1:e2').id,'str:m3u:ep:3');
 assert.equal(result.catalog.streams.find(s=>s.sourceItemId==='mov:m3u:xui:11').directStreamUrl,'https://media.fixture.invalid/play/movie-token');
});
await test('CHAPTER_FILMS_AND_NUMERIC_TITLES_USE_EXACT_PROVIDER_TYPE_ON_OTHER_SERVERS',async()=>{
 const titles=['4x4','10x10 - Synthetic film','IT: Cap\u00edtulo 2','Sobrenatural: Cap\u00edtulo 2','Film Season 2'];
 const rows=titles.flatMap((t,i)=>[`#EXTINF:-1 xui-id="${i+50}" group-title="M",${t}`,`https://media.fixture.invalid/play/film-${i}`]);
 const text='#EXTM3U\n'+rows.join('\n')+'\n'+body.slice(8);
 for(const host of ['numeric.fixture.invalid','different-provider.fixture.invalid']){
  const c={...config,playlistUrl:config.playlistUrl.replace('numeric.fixture.invalid',host)};
  const result=await run(text,[...titles.map((_,i)=>({stream_id:i+50,category_id:1})),{stream_id:11,category_id:1}],{config:c});
  assert.equal(result.success,true);assert.equal(result.catalog.movies.length,7);assert.equal(result.catalog.series.length,1);
  for(let i=0;i<titles.length;i++){const movie=result.catalog.movies.find(m=>m.title===titles[i]);assert.equal(movie.id,`mov:m3u:xui:${i+50}`);assert.deepEqual(movie.categoryIds,result.catalog.movies.at(-1).categoryIds);}
 }
});
await test('LEGITIMATE_IDS_URLS_ARTWORK_AND_RELATIONS_SURVIVE_REMOVAL_OF_FALSE_SERIES',async()=>{
 const legacy=await run(body,false),fixed=await run();
 for(const kind of ['movies','series','seasons','episodes','streams','artworks']){
  const original=legacy.catalog[kind].filter(r=>!(r.id==='ser:m3u:0'||r.seriesId==='ser:m3u:0'||r.id.startsWith('ser:m3u:0:')||r.sourceItemId?.startsWith('ser:m3u:0:')));
  assert.deepEqual(fixed.catalog[kind].filter(r=>original.some(o=>o.id===r.id)),original,kind);
 }
});
await test('UNKNOWN_MEMBERSHIP_PRESERVES_REAL_CHAPTER_EPISODES_NO_CATEGORY_GUESS',async()=>{
 const chapter='#EXTM3U\n#EXTINF:-1 xui-id="12" group-title="M",Synthetic drama Capitulo 2\nhttps://media.fixture.invalid/play/real-chapter';
 const result=await run(chapter,false);assert.equal(result.success,true);assert.equal(result.catalog.movies.length,0);assert.equal(result.catalog.series.length,1);assert.equal(result.catalog.episodes[0].episodeNumber,2);
 const unknown=await run(chapter.replace('Synthetic drama Capitulo 2','Unknown title'),false);assert.equal(unknown.success,true);assert.equal(unknown.metrics.rawUnresolvedCount,1);assert.equal(unknown.catalog.movies.length,0);assert.equal(unknown.catalog.series.length,0);
});
await test('FAILED_AUTH_OR_BAD_METADATA_REJECTS_CANDIDATE_AND_PRESERVES_ACTIVE_GENERATION',async()=>{
 const storage=new InMemoryCatalogStorage();const pointer=await storage.readActivePointer();
 for(const options of [{rejectAuth:true},{ }]){
  const result=await run(body,options.rejectAuth?true:[{stream_id:11,category_id:999}],{...options,storage});
  assert.equal(result.success,false);assert.equal(result.error,'XUI_M3U_KIND_UNCONFIRMED');assert.deepEqual(await storage.readActivePointer(),pointer);
 }
});
await test('EXPLICIT_PATHS_COMPACT_EPISODES_AND_MIXED_CATEGORIES_REMAIN_INTACT',async()=>{
 const text='#EXTM3U\n'+[
  '#EXTINF:-1 group-title="UHD | 4K",Real Movie Capitulo 2','https://media.fixture.invalid/movie/1.mp4',
  '#EXTINF:-1 group-title="UHD | 4K",Real Show Capitulo 2','https://media.fixture.invalid/series/2.mp4',
  '#EXTINF:-1 xui-id="11" group-title="M",Real Show S01E02','https://media.fixture.invalid/play/show',
  '#EXTINF:-1 group-title="UHD | 4K",Real channel','https://media.fixture.invalid/live/3.ts',
 ].join('\n');
 const result=await run(text,true,{rejectAuth:true});assert.equal(result.success,true);assert.equal(result.catalog.movies.length,1);assert.equal(result.catalog.series.length,1);assert.equal(result.catalog.episodes.length,2);assert.equal(result.liveCatalog.channels.length,1);
});
await test('V1_CHECKPOINT_REBUILDS_ONCE_AND_V2_MATCH_IS_UNCHANGED',async()=>{
 const raw=createHash('sha256').update(body).digest('hex'),v1=createHash('sha256').update('M3U_XUI_TYPES_V1:'+raw).digest('hex');
 const first=await run(body,true,{unchangedContentDigest:v1});assert.equal(first.success,true);assert.notEqual(first.notModified,true);
 assert.equal(first.contentDigest,createHash('sha256').update('M3U_XUI_TYPES_V2:'+raw).digest('hex'));
 assert.equal((await run(body,true,{unchangedContentDigest:first.contentDigest})).notModified,true);
});
await test('REAL_ADULT_READER_PAGINATION_POLICY_AND_ROLLBACK_NEGATIVES',async()=>{
 const r=spawnSync(process.execPath,['scripts/test-c135-adult-reader.mjs'],{encoding:'utf8',timeout:60000});
 assert.equal(r.status,0,r.stdout+r.stderr);assert.ok(r.stdout.includes('PASS LOCK_OR_GENERATION_CHANGE_DURING_IO_ROLLS_BACK'));assert.ok(r.stdout.includes('PASS SPARSE_SCAN_BOUNDED_EMPTY_PARTIAL_PAGES_AND_MANUAL_RULE'));
});
console.log(`CATALOG_PHYSICAL_TESTS=${tests}_PASS\nCATALOG_PHYSICAL_REGRESSIONS=PASS`);
