import assert from 'node:assert/strict';
import { resolveRecentTitleBindings } from '../src/ui/recent-title-resolution.ts';
import { watchFingerprint, resumeRecentWatch } from '../src/playback/watch-history.ts';
import { CatalogReadModel } from '../src/catalog/catalog-read-model.ts';

const item=(kind,id,title,year=1988)=>({id,title,year,artworkIds:[],categoryIds:[],genreIds:[],streamIds:[],...(kind==='series'?{seasonIds:[]}:{})});
const movie=item('movie','mov:m3u:12','Exact movie'),series={...item('series','ser:m3u:9','Exact series'),seasonIds:['ser:m3u:9:s1']};
const record=(kind,id,canonical)=>({kind,itemId:id,fingerprint:watchFingerprint(kind,canonical),positionMs:123456,durationMs:600000,updatedAt:100,completed:false,...(kind==='series'?{episodeId:id+':s1:e2'}:{})});
const original=[record('series','ser:m3u:10',series),record('movie','mov:m3u:13',movie)], before=JSON.stringify(original);
function fixture(rows=[movie,series],snapshot='fixture'){
 const reads=[];let active=snapshot;
 const model=new CatalogReadModel({metadata:{snapshotId:snapshot},movies:rows.filter(r=>r.id.startsWith('mov:')),series:rows.filter(r=>r.id.startsWith('ser:')),seasons:[{id:series.id+':s1',seriesId:series.id,seasonNumber:1,episodeIds:[series.id+':s1:e2']}],episodes:[{id:series.id+':s1:e2',seriesId:series.id,seasonId:series.id+':s1',episodeNumber:2,title:'Episode two',streamIds:[],artworkIds:[]}],streams:[],categories:[],genres:[],artworks:[]});
 const segments=[{kind:'movies',fileName:'movies_1.json'},{kind:'series',fileName:'series_1.json'}];
 const storage={readActiveManifest:async()=>({snapshotId:active,segments}),readActivePointer:async()=>({snapshotId:active}),readActiveSegment:async path=>{reads.push(path);return JSON.stringify(rows.filter(r=>path.replace(/^segments\//,'').startsWith('movies')?r.id.startsWith('mov:'):r.id.startsWith('ser:')));}};
 return {model,storage,reads,setActive:value=>{active=value;}};
}
const f=fixture(),bindings=await resolveRecentTitleBindings(original,f.model,f.storage,new AbortController().signal);
assert.deepEqual(bindings.map(b=>b.record.itemId),[series.id,movie.id]);assert.equal(bindings[0].record.episodeId,series.id+':s1:e2');assert.equal(JSON.stringify(original),before);
assert.ok(bindings.every(b=>b.record.positionMs===123456&&b.record.updatedAt===100&&b.record.fingerprint===watchFingerprint(b.record.kind,b.item)));
const calls=[],service={playMovie:async(...args)=>{calls.push(['movie',...args]);return {success:true};},playEpisode:async(...args)=>{calls.push(['series',...args]);return {success:true};}};
await resumeRecentWatch(bindings[0].record,f.model,service);assert.equal(calls[0][1],series.id);assert.equal(calls[0][2],series.id+':s1:e2');assert.equal(calls[0][4].startPositionMs,123456);
await resumeRecentWatch(bindings[1].record,f.model,service);assert.equal(calls[1][3].startPositionMs,123456);
assert.ok(f.reads.every(path=>!/streams|episodes/.test(path)));
console.log('PASS_EXACT_UNIQUE_M3U_REASSIGNED_SERIES_MOVIE_ORDER_POSITION_EPISODE_AND_ORIGINAL_HISTORY_INTACT');

const duplicate=fixture([movie,{...movie,id:'mov:m3u:99'},series]);
assert.equal((await resolveRecentTitleBindings(original,duplicate.model,duplicate.storage,new AbortController().signal)).length,1);
for(const bad of [{...original[0],fingerprint:'0000000000000000'},{...original[0],episodeId:'ser:m3u:99:s1:e2'},{...original[0],episodeId:'foreign-episode'},{...original[0],itemId:'series:provider:10'}]){
 assert.equal((await resolveRecentTitleBindings([bad],f.model,f.storage,new AbortController().signal)).length,0);
}
const changed=fixture([movie,{...series,year:2021}]);assert.equal((await resolveRecentTitleBindings([original[0]],changed.model,changed.storage,new AbortController().signal)).length,0);
const absent={...bindings[0].record,episodeId:series.id+':s1:e99'};await assert.rejects(resumeRecentWatch(absent,f.model,service));assert.equal(calls.length,2,'missing episode never reaches playback');
const current=record('series',series.id,series),noScan=fixture();await resolveRecentTitleBindings([current],noScan.model,noScan.storage,new AbortController().signal);assert.equal(noScan.reads.length,0);
console.log('PASS_AMBIGUITY_YEAR_FINGERPRINT_FOREIGN_SUFFIX_PROTOCOL_AND_MISSING_EPISODE_FAIL_CLOSED_CURRENT_ID_NO_SCAN');

const aborted=new AbortController();aborted.abort();await assert.rejects(resolveRecentTitleBindings(original,f.model,f.storage,aborted.signal));
const changedGeneration=fixture();changedGeneration.setActive('other');await assert.rejects(resolveRecentTitleBindings(original,changedGeneration.model,changedGeneration.storage,new AbortController().signal));
const during=fixture(),controller=new AbortController(),read=during.storage.readActiveSegment;during.storage.readActiveSegment=async path=>{const raw=await read(path);controller.abort();return raw;};await assert.rejects(resolveRecentTitleBindings(original,during.model,during.storage,controller.signal));assert.equal(during.reads.length,1);
const atEnd=fixture();const endRead=atEnd.storage.readActivePointer;atEnd.storage.readActivePointer=async()=>({...await endRead(),snapshotId:'other'});await assert.rejects(resolveRecentTitleBindings(original,atEnd.model,atEnd.storage,new AbortController().signal));
const many=Array.from({length:65},(_,n)=>item('movie','mov:m3u:'+n,'Unique movie '+n)),manyFixture=fixture(many);
const capped=await resolveRecentTitleBindings(many.map(m=>record('movie',m.id,m)),manyFixture.model,manyFixture.storage,new AbortController().signal);assert.equal(capped.length,60);
const newer={...record('series',series.id,series),updatedAt:200,positionMs:234567};
const deduplicated=await resolveRecentTitleBindings([newer,original[0]],f.model,f.storage,new AbortController().signal);assert.equal(deduplicated.length,1);assert.equal(deduplicated[0].record.positionMs,234567);
console.log('PASS_ABORT_BEFORE_DURING_SEGMENT_GENERATION_AT_START_END_AND_MAXIMUM60');
