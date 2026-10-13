import assert from 'node:assert/strict';
import {WatchHistory,resumeRecentWatch,watchFingerprint} from '../src/playback/watch-history.ts';
import {PlaybackService} from '../src/playback/playback.service.ts';
import {CatalogReadModel} from '../src/catalog/catalog-read-model.ts';

const stored=new Map();const storage={getItem:key=>stored.get(key),setItem:(key,value)=>stored.set(key,value)};
const history=new WatchHistory(storage);
const emit=(nonce,positionMs,observedAt,ended=false)=>history.observe({playbackId:nonce,positionMs,durationMs:600000,observedAt,ended,uri:'https://fixture.invalid/private',headers:{Authorization:'fixture-only'}});
const movie=history.begin('movie','mov:m3u:1');emit(movie,123456,100);
const series=history.begin('series','ser:m3u:1','ep:m3u:2');emit(series,65432,200);
assert.deepEqual(history.list().map(r=>[r.kind,r.itemId,r.episodeId,r.positionMs]),[['series','ser:m3u:1','ep:m3u:2',65432],['movie','mov:m3u:1',undefined,123456]]);
emit(movie,88888,90);assert.equal(history.list()[1].positionMs,123456);
emit('unknown',77777,300);emit(movie,NaN,400);assert.equal(history.list().length,2);
const restarted=new WatchHistory(storage);assert.deepEqual(restarted.list(),history.list());
assert.ok(![...stored.values()][0].includes('https:'));assert.ok(![...stored.values()][0].includes('Authorization'));
emit(movie,600000,300,true);emit(movie,600000,310,false);assert.equal(history.list()[0].completed,true,'release after end cannot erase completion');
const replay=history.begin('movie','mov:m3u:1');emit(replay,2000,400);emit(movie,500000,500);assert.equal(history.list()[0].positionMs,2000,'old playback nonce cannot overwrite new playback');
const secondEpisode=history.begin('series','ser:m3u:1','ep:m3u:3');emit(secondEpisode,7000,600);assert.equal(history.list().filter(r=>r.kind==='series').length,1);assert.equal(history.list()[0].episodeId,'ep:m3u:3');
for(let n=0;n<65;n++)emit(history.begin('movie','m-'+n),2000,1000+n);
assert.equal(history.list().length,60);assert.equal(history.list()[0].itemId,'m-64');
const noStorage=new WatchHistory({getItem(){throw new Error('denied');},setItem(){throw new Error('quota');}});
const unavailable=noStorage.begin('movie','local');noStorage.observe({playbackId:unavailable,positionMs:2000,observedAt:2000});assert.equal(noStorage.list()[0].itemId,'local');
const rejected=new WatchHistory({getItem:()=>JSON.stringify({version:1,records:[{kind:'movie',itemId:'https://fixture.invalid',positionMs:1000,durationMs:0,updatedAt:1}]}),setItem(){}});assert.deepEqual(rejected.list(),[]);
for(let n=0;n<60;n++)emit(history.begin('series','界'.repeat(500)+n,'集'.repeat(500)+n),2000,3000+n);
assert.ok(Buffer.byteLength([...stored.values()][0],'utf8')<=65536);assert.ok(history.list().length<60);
console.log('PASS_RECENT_PERSISTENCE_ORDER_EPISODE_NONCE_COMPLETION_LIMIT_PRIVACY_STORAGE_FAILURE');

let movieReads=0,episodeReads=0,streamReads=0,allowed=true;
const currentMovie={id:'mov:m3u:1',title:'Movie',categoryIds:[],genreIds:[],streamIds:['stream-movie']};
const currentSeries={id:'ser:m3u:1',title:'Series',categoryIds:[],genreIds:[],seasonIds:['season-2']};
const episode={id:'ep:m3u:2',seriesId:'ser:m3u:1',seasonId:'season-2',episodeNumber:2,title:'Exact episode',streamIds:['stream-ep']};
const model=new CatalogReadModel({movies:[],series:[],seasons:[],episodes:[],streams:[],categories:[],genres:[],artworks:[]},{
 movieResolver:async id=>{movieReads++;return id===currentMovie.id?currentMovie:undefined;},
 seriesResolver:async id=>id===currentSeries.id?currentSeries:undefined,
 seasonResolver:async()=>[{id:'season-2',seriesId:'ser:m3u:1',seasonNumber:2,episodeIds:['ep:m3u:2']}],
 episodeResolver:async()=>{episodeReads++;return[episode];},
 streamRefResolver:async id=>{streamReads++;return{id,sourceItemId:id,contentKind:id==='stream-movie'?'movie':'episode',directStreamUrl:'https://media.example.invalid/'+id+'.mp4',containerExtension:'mp4'};}
});
let streamRequests=0;const getStream=model.getStreamRefAsync.bind(model);model.getStreamRefAsync=async id=>{streamRequests++;return getStream(id);};
const launched=[],guards=[],closed=[];
const service=new PlaybackService({history:new WatchHistory(storage),sessionGuard:{acquireSession:async metadata=>{guards.push(metadata);return{allowed,code:'SESSION_LIMIT_REACHED'};},releaseSession:async reason=>closed.push(reason)},playerAdapter:{launch:async request=>{launched.push(request);return{success:true,state:'NATIVE_PLAYER_OPENED'};}}});
const movieRecord={kind:'movie',itemId:'mov:m3u:1',positionMs:123456,durationMs:600000,completed:false,updatedAt:100};
const episodeRecord={kind:'series',itemId:'ser:m3u:1',episodeId:'ep:m3u:2',positionMs:65432,durationMs:600000,completed:false,updatedAt:200};
movieRecord.fingerprint=watchFingerprint('movie',currentMovie);episodeRecord.fingerprint=watchFingerprint('series',currentSeries);
assert.equal((await resumeRecentWatch(movieRecord,model,service)).success,true);assert.equal(movieReads,1);assert.equal(launched[0].startPositionMs,123456);assert.equal(launched[0].kind,'movie');assert.ok(launched[0].playbackId);assert.equal(guards[0].contentKind,'movie');
await service.stopPlayback();
assert.equal(episodeReads,0,'no episode I/O before explicit series resume');
assert.equal((await resumeRecentWatch(episodeRecord,model,service)).success,true);assert.equal(episodeReads,1);assert.equal(launched[1].startPositionMs,65432);assert.equal(launched[1].uri,'https://media.example.invalid/stream-ep.mp4');assert.equal(launched[1].kind,'series');assert.equal(guards[1].contentKind,'episode');
await service.stopPlayback();
await resumeRecentWatch({...movieRecord,completed:true},model,service);assert.equal(launched[2].startPositionMs,0);
await service.stopPlayback();
const before=streamRequests;allowed=false;assert.equal((await resumeRecentWatch(movieRecord,model,service)).success,false);assert.equal(streamRequests,before);assert.equal(launched.length,3,'guard rejection cannot launch a stream');
await assert.rejects(()=>resumeRecentWatch({...movieRecord,itemId:'removed'},model,service),/catálogo atual/);
await assert.rejects(()=>resumeRecentWatch({...episodeRecord,episodeId:'foreign'},model,service),/série atual/);
assert.equal(launched.length,3);
const previous=currentMovie.title;currentMovie.title='Outra obra no mesmo ID';
const guardCount=guards.length;await assert.rejects(()=>resumeRecentWatch(movieRecord,model,service),/catálogo atual/);assert.equal(guards.length,guardCount);assert.equal(launched.length,3);
currentMovie.title=previous;
const safeStore=new WatchHistory(storage);const safeNonce=safeStore.begin('movie',currentMovie.id,undefined,movieRecord.fingerprint);safeStore.observe({playbackId:safeNonce,positionMs:1500,observedAt:9000});
assert.equal(new WatchHistory(storage).list()[0].fingerprint,movieRecord.fingerprint);assert.ok(![...stored.values()][0].includes(currentMovie.title));
console.log('PASS_RECENT_M3U_REASSIGNED_ID_REFUSED_BEFORE_GUARD_PLAYER_OPAQUE_FINGERPRINT_RESTART');
console.log('PASS_RECENT_REAL_PLAYBACK_MOVIE_EXACT_EPISODE_POSITION_GUARD_REMOVAL_COMPLETED_RESTART');
