import assert from 'node:assert/strict';
import { resolveNextEpisode } from '../src/playback/next-episode-resolver.ts';

let networkCalls=0;const originalFetch=globalThis.fetch;globalThis.fetch=()=>{networkCalls++;throw Error('NETWORK_FORBIDDEN')};
const season=(id,n)=>({id,seriesId:'s',seasonNumber:n,episodeIds:[]});
const ep=(id,seasonId,n,streamIds=[`stream-${id}`])=>({id,seriesId:'s',seasonId,episodeNumber:n,title:id,artworkIds:[],streamIds});
function fixture(seasons,episodes){
 const streams=new Map();for(const e of episodes)for(const id of e.streamIds)streams.set(id,{id,sourceItemId:id,contentKind:'episode',directStreamUrl:'https://media.example.invalid/video.m3u8'});
 return {catalog:{metadata:{snapshotId:'snap'}},seriesById:new Map([['s',{id:'s'}]]),seasonsBySeriesId:new Map([['s',seasons]]),episodesBySeasonId:new Map(seasons.map(s=>[s.id,episodes.filter(e=>e.seasonId===s.id)])),streamsById:streams};
}
const ctx=()=>({sourceId:'source',currentSourceId:'source',catalogGeneration:'gen',currentCatalogGeneration:'gen',snapshotId:'snap',license:'ALLOWED',parental:'ALLOWED',sourceAuthorization:'ALLOWED',completeSeasonLastEpisode:{},indirectReferenceReady:false});
const run=(m,id='e1',c=ctx())=>resolveNextEpisode(m,'s',id,c);
const one=()=>fixture([season('t1',1)],[ep('e1','t1',1),ep('e2','t1',2)]);
const cases=[];function test(name,fn){fn();cases.push(name);console.log('PASS '+name);}
try {
 test('NORMAL',()=>assert.deepEqual(run(one()),{status:'AVAILABLE',episodeId:'e2',seasonNumber:1,episodeNumber:2,sourceId:'source',catalogGeneration:'gen',snapshotId:'snap'}));
 test('SEASON_TRANSITION',()=>{const c=ctx();c.completeSeasonLastEpisode.t1=1;assert.equal(run(fixture([season('t2',2),season('t1',1)],[ep('e1','t1',1),ep('e2','t2',1)]),'e1',c).episodeId,'e2');});
 test('DUPLICATE_NUMBER',()=>assert.equal(run(fixture([season('t1',1)],[ep('e1','t1',1),ep('e2','t1',2),ep('other','t1',2,[])])).status,'AMBIGUOUS'));
 test('IDENTICAL_ID_REPEAT',()=>{let e=ep('e2','t1',2);assert.equal(run(fixture([season('t1',1)],[ep('e1','t1',1),e,{...e}])).episodeId,'e2');});
 test('CONFLICTING_ID',()=>assert.equal(run(fixture([season('t1',1)],[ep('e1','t1',1),ep('e2','t1',2),ep('e2','t1',3)])).status,'AMBIGUOUS'));
 test('EPISODE_GAP',()=>assert.equal(run(fixture([season('t1',1)],[ep('e1','t1',1),ep('e2','t1',2),ep('e4','t1',4)]),'e2').reason,'EPISODE_GAP_OR_INCOMPLETE'));
 test('SPECIAL_SEASON',()=>assert.equal(run(fixture([season('t0',0)],[ep('e1','t0',1)])).reason,'SPECIAL_EPISODE'));
 test('SPECIAL_EPISODE',()=>assert.equal(run(fixture([season('t1',1)],[ep('e1','t1',0)])).reason,'SPECIAL_EPISODE'));
 test('KNOWN_SERIES_END',()=>{let c=ctx();c.completeSeasonLastEpisode.t1=1;c.finalSeasonNumber=1;assert.equal(run(fixture([season('t1',1)],[ep('e1','t1',1)]),'e1',c).status,'END_OF_SERIES');});
 test('INCOMPLETE_CATALOG',()=>assert.equal(run(fixture([season('t1',1)],[ep('e1','t1',1)])).reason,'EPISODE_GAP_OR_INCOMPLETE'));
 test('CURRENT_MISSING',()=>assert.equal(run(one(),'missing').reason,'CURRENT_EPISODE_NOT_FOUND'));
 test('INCONSISTENT_SEASON',()=>{let m=one();m.seasonsBySeriesId.get('s')[0].seriesId='other';assert.equal(run(m).reason,'INVALID_SEASON');});
 test('MEDIA_MISSING',()=>assert.equal(run(fixture([season('t1',1)],[ep('e1','t1',1),ep('e2','t1',2,[])])).reason,'MEDIA_REFERENCE_MISSING'));
 test('MEDIA_INVALID',()=>{let m=one();m.streamsById.get('stream-e2').directStreamUrl='file:///private';assert.equal(run(m).reason,'MEDIA_REFERENCE_INVALID');});
 test('SOURCE_CHANGED',()=>{let c=ctx();c.currentSourceId='other';assert.equal(run(one(),'e1',c).reason,'SOURCE_CHANGED');});
 test('GENERATION_CHANGED',()=>{let c=ctx();c.currentCatalogGeneration='next';assert.equal(run(one(),'e1',c).reason,'CATALOG_CHANGED');});
 test('AUTHORIZATION_DENIED',()=>{let c=ctx();c.license='DENIED';assert.equal(run(one(),'e1',c).reason,'LICENSE_AUTHORIZATION_REQUIRED');});
 test('AUTHORIZATION_UNKNOWN',()=>{let c=ctx();c.sourceAuthorization='UNKNOWN';assert.equal(run(one(),'e1',c).reason,'SOURCE_AUTHORIZATION_REQUIRED');});
 test('PARENTAL_DENIED',()=>{let c=ctx();c.parental='DENIED';assert.equal(run(one(),'e1',c).reason,'PARENTAL_AUTHORIZATION_REQUIRED');});
 test('IMPORT_ORDER',()=>{let a=fixture([season('t1',1)],[ep('e2','t1',2),ep('e1','t1',1)]);assert.equal(run(a).episodeId,'e2');});
 test('NO_MUTATION',()=>{let m=one(),c=ctx(),before=JSON.stringify({seasons:[...m.seasonsBySeriesId],episodes:[...m.episodesBySeasonId],streams:[...m.streamsById],c});run(m,'e1',c);assert.equal(JSON.stringify({seasons:[...m.seasonsBySeriesId],episodes:[...m.episodesBySeasonId],streams:[...m.streamsById],c}),before);});
 test('DETERMINISTIC',()=>{let m=one();assert.deepEqual(run(m),run(m));});
 test('NO_EXTERNAL_CALLS',()=>assert.equal(networkCalls,0));
 test('MISSING_CONTEXT',()=>assert.equal(resolveNextEpisode(one(),'s','e1',undefined).reason,'MISSING_CONTEXT'));
 test('INVALID_NUMBER',()=>assert.equal(run(fixture([season('t1',1)],[ep('e1','t1',1),ep('bad','t1',-1)])).reason,'INVALID_EPISODE'));
 test('NO_SEASON_GAP_SKIP',()=>{let c=ctx();c.completeSeasonLastEpisode.t1=1;assert.equal(run(fixture([season('t1',1),season('t3',3)],[ep('e1','t1',1),ep('e3','t3',1)]),'e1',c).reason,'SEASON_GAP');});
 test('INDIRECT_REQUIRES_CONTEXT',()=>{let m=one();delete m.streamsById.get('stream-e2').directStreamUrl;assert.equal(run(m).reason,'MEDIA_REFERENCE_INVALID');});
 console.log(JSON.stringify({result:'PASS',cases:cases.length,networkCalls}));
} finally {globalThis.fetch=originalFetch;}
