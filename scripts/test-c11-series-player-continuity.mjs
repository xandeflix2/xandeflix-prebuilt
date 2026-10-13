import assert from 'node:assert/strict';
import { CatalogReadModel } from '../src/catalog/catalog-read-model.ts';
import { PlaybackService } from '../src/playback/playback.service.ts';
import { orderedSeriesEpisodes, episodeContext } from '../src/playback/episode-sequence.ts';
import { WatchHistory, watchFingerprint } from '../src/playback/watch-history.ts';
import { openNativeAndroidPlayer } from '../src/playback/native-android-player.bridge.ts';
const memory=()=>{const values=new Map();return {getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};};
const series={id:'series1',title:'Fixture',categoryIds:[],genreIds:[],artworkIds:[],seasonIds:['s1','s2','s10']};
const seasons=[10,2,1,3].map(n=>({id:'s'+n,seriesId:series.id,seasonNumber:n,episodeIds:[]}));
const ep=(s,n)=>({id:`s${s}e${n}`,seriesId:series.id,seasonId:'s'+s,episodeNumber:n,title:'Episode '+n,artworkIds:[],streamIds:[`stream-${s}-${n}`]});
const episodes=[ep(10,2),ep(2,2),ep(1,3),ep(10,1),ep(1,1),ep(2,1)];
let streamReads=[],holdStream;
const model=new CatalogReadModel({metadata:{snapshotId:'fixture'},series:[series],seasons,episodes,movies:[],streams:[],artworks:[],categories:[],genres:[]},{streamRefResolver:async id=>{
 streamReads.push(id);if(holdStream)await holdStream;
 return {id,contentKind:'episode',sourceItemId:id,containerExtension:'mp4',directStreamUrl:'https://fixture.invalid/'+id+'.mp4'};
}});
assert.deepEqual(orderedSeriesEpisodes(model,series.id).map(e=>e.id),['s1e1','s1e3','s2e1','s2e2','s10e1','s10e2']);
model.episodesBySeasonId.get('s1').push({...ep(1,2),seriesId:'foreign'});
assert.equal(orderedSeriesEpisodes(model,series.id).length,6);
assert.equal(episodeContext(model,series.id,'s10e2').hasNext,false);
assert.equal(episodeContext(model,'foreign','s1e1'),undefined);
console.log('PASS_NUMERIC_SEASONS_EPISODES_GAPS_EMPTY_SEASON_FOREIGN_FINAL_NO_WRAP');

const launches=[],actions=[],history=new WatchHistory(memory(),async()=>[]);
let allowed=true,termination,holdGuard;
const guard={acquireSession:async()=>{actions.push('acquire');if(holdGuard)await holdGuard;return {allowed,code:'DEVICE_REVOKED'};},releaseSession:async reason=>{actions.push('release:'+reason);},onTermination:fn=>{termination=fn;return()=>{};}};
const service=new PlaybackService({history,sessionGuard:guard,playerAdapter:{launch:async request=>{launches.push(request);actions.push('launch');return {success:true,state:'NATIVE_PLAYER_OPENED'};}}});
const event=(reason='next',episodeId)=>({playbackId:launches.at(-1).playbackId,requestId:'request-'+launches.length,reason,episodeId});
const remember=(episodeId,position)=>{let id=history.begin('series',series.id,episodeId,watchFingerprint('series',series));history.observe({playbackId:id,positionMs:position,durationMs:500000,observedAt:Date.now()});};
remember('s1e3',12345);
assert.equal((await service.playEpisode(series.id,'s1e1',model)).success,true);
assert.deepEqual(streamReads,['stream-1-1']);
const first=launches.at(-1);assert.equal(first.episodeContext.currentEpisodeId,'s1e1');assert.ok(!JSON.stringify(first.episodeContext).includes('https:'));
history.observe({playbackId:first.playbackId,positionMs:500000,durationMs:500000,ended:true,observedAt:Date.now()});
const ended=event('ended');assert.equal(await service.navigateEpisode(ended),true);
assert.equal(launches.at(-1).episodeContext.currentEpisodeId,'s1e3');assert.equal(launches.at(-1).startPositionMs,0);
assert.equal(launches.at(-1).replacePlaybackId,first.playbackId);assert.equal(launches.at(-1).navigationRequestId,ended.requestId);
assert.equal(await service.navigateEpisode(ended),false);assert.equal(launches.length,2);
assert.deepEqual(actions.slice(-3),['release:EPISODE_TRANSITION','acquire','launch']);
console.log('PASS_ENDED_ADVANCE_SKIP_GAP_NEW_START_ZERO_STALE_EVENT_C9_RELEASE_ACQUIRE');

const current=launches.at(-1);history.observe({playbackId:current.playbackId,positionMs:99123,durationMs:500000,observedAt:Date.now()});
assert.equal(await service.navigateEpisode(event()),true);assert.equal(launches.at(-1).episodeContext.currentEpisodeId,'s2e1');
assert.equal(history.savedPosition('series',series.id,watchFingerprint('series',series),'s1e3'),99123);
remember('s10e1',76543);
assert.equal(await service.navigateEpisode(event('select','s10e1')),true);assert.equal(launches.at(-1).startPositionMs,76543);
assert.equal(await service.navigateEpisode(event()),true);assert.equal(launches.at(-1).episodeContext.hasNext,false);
assert.equal(await service.navigateEpisode(event()),false);assert.equal(await service.navigateEpisode(event('select','foreign')),false);
console.log('PASS_MANUAL_NEXT_CROSS_SEASON_SAVED_OLD_POSITION_PICKER_RESUMES_FINAL_NO_WRAP');

await service.playEpisode(series.id,'s1e1',model);allowed=false;let count=launches.length;
assert.equal(await service.navigateEpisode(event()),false);assert.equal(launches.length,count);allowed=true;
await service.playEpisode(series.id,'s1e1',model);const revoked=event();termination('revoked','DEVICE_REVOKED');
assert.equal(await service.navigateEpisode(revoked),false);
console.log('PASS_DENIED_REAUTH_AND_REVOCATION_NEVER_LAUNCH_NEXT');

await service.playEpisode(series.id,'s1e1',model);let unblock;holdGuard=new Promise(resolve=>unblock=resolve);count=launches.length;
const pending=service.navigateEpisode(event());for(let n=0;n<25;n++)await Promise.resolve();
assert.equal(await service.navigateEpisode(event()),false);await service.stopPlayback();unblock();holdGuard=undefined;
assert.equal(await pending,false);assert.equal(launches.length,count);assert.equal(service.getCurrentSession().state,'IDLE');
console.log('PASS_DUPLICATE_INFLIGHT_AND_BACK_DURING_AUTH_CANCEL_NO_BACKGROUND_REOPEN');

// Stop during source resolution and during IPC acknowledgement must not restore PLAYING.
for(const boundary of ['resolver','native']) {
 let release;const block=new Promise(resolve=>release=resolve);let entered=false;const actual=[];
 const baseResolver={resolve:async(stream,context,options)=>{
   if(boundary==='resolver'&&entered){await block;}
   return {uri:'https://fixture.invalid/video.mp4',headers:{},contentKind:'episode',title:options?.title,startPositionMs:options?.startPositionMs};
 }};
 const pendingService=new PlaybackService({history:new WatchHistory(memory(),async()=>[]),resolver:baseResolver,sessionGuard:guard,
  playerAdapter:{launch:async request=>{actual.push(request);if(boundary==='native'&&entered)await block;return {success:true,state:'NATIVE_PLAYER_OPENED'};}}});
 await pendingService.playEpisode(series.id,'s1e1',model);entered=true;
 const moving=pendingService.navigateEpisode({playbackId:actual[0].playbackId,requestId:'cancel-'+boundary,reason:'next'});
 for(let n=0;n<50;n++)await Promise.resolve();await pendingService.stopPlayback();release();
 assert.equal(await moving,false);assert.equal(pendingService.getCurrentSession().state,'IDLE');
 if(boundary==='resolver')assert.equal(actual.length,1);
}
console.log('PASS_BACK_DURING_RESOLVER_AND_NATIVE_ACK_KEEP_IDLE_NO_LATE_REOPEN');

// IPC boundary must retain correlation and metadata without creating an unguarded fallback.
let ipc;const fake={open:async request=>{ipc=request;return {accepted:true};}};
assert.equal((await openNativeAndroidPlayer(launches[1],fake)).success,true);
assert.equal(ipc.replacePlaybackId,launches[1].replacePlaybackId);assert.equal(ipc.episodeContext.currentEpisodeId,'s1e3');
assert.equal(ipc.navigationRequestId,launches[1].navigationRequestId);
console.log('PASS_NATIVE_BRIDGE_EPISODE_CONTEXT_AND_TRANSITION_TOKEN');

// Large active series remains local; only bounded metadata goes to native, never all stream URLs.
for(let n=4;n<450;n++){const item=ep(1,n);model.episodesById.set(item.id,item);model.episodesBySeasonId.get('s1').push(item);}
const bounded=episodeContext(model,series.id,'s1e430');assert.equal(bounded.episodes.length,200);assert.ok(bounded.episodes.some(e=>e.id==='s1e430'));assert.equal(bounded.hasNext,true);
console.log('PASS_BOUNDED_ACTIVE_SERIES_PICKER_METADATA_ONLY');
