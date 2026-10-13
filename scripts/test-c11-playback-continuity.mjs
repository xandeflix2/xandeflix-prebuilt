import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import React from 'react';
import { WatchHistory, watchFingerprint, resumeRecentWatch } from '../src/playback/watch-history.ts';
import { PlaybackService } from '../src/playback/playback.service.ts';
import { CatalogReadModel } from '../src/catalog/catalog-read-model.ts';
import { resolveRecentTitleBindings } from '../src/ui/recent-title-resolution.ts';
import * as policy from '../src/playback/content-adult-policy.ts';
import * as selectors from '../src/catalog/catalog-selectors.ts';
import { LastLiveChannel, chooseInitialLiveChannel } from '../src/playback/last-live-channel.ts';

const memory=()=>{const values=new Map();return {values,getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};};
const plugin=readFileSync(new URL('../android/app/src/main/java/com/xandeflix/prebuilt/player/NativeAndroidPlayerPlugin.java',import.meta.url),'utf8');
const numericWiring=code=>assert.match(code,/parseStartPositionMs\(call\.getData\(\)\.opt\("startPositionMs"\)\)/);
numericWiring(plugin);assert.throws(()=>numericWiring(plugin.replace('parseStartPositionMs(call.getData().opt("startPositionMs"))','call.getLong("startPositionMs", 0L)')));
const movie={id:'mov:m3u:1',title:'Ordinary movie',durationSeconds:7200,categoryIds:['normal'],genreIds:[],artworkIds:[],streamIds:['movie-stream']};
const adult={...movie,id:'mov:m3u:2',title:'Classified adult movie',categoryIds:['adult'],streamIds:['adult-stream']};
const series={id:'ser:m3u:1',title:'Exact series',categoryIds:['normal'],genreIds:[],artworkIds:[],seasonIds:[]};
const seasons=[],episodes=[];
for(let season=1;season<=10;season++){
 const id=series.id+':s'+season;series.seasonIds.push(id);const seasonEpisodes=[];
 for(let number=1;number<=20;number++){const episodeId=id+':e'+number;seasonEpisodes.push(episodeId);episodes.push({id:episodeId,seriesId:series.id,seasonId:id,episodeNumber:number,title:'Episode '+number,artworkIds:[],streamIds:[episodeId+'-stream']});}
 seasons.push({id,seriesId:series.id,seasonNumber:season,episodeIds:seasonEpisodes});
}
const model=new CatalogReadModel({metadata:{snapshotId:'fixture'},movies:[movie,adult],series:[series],seasons,episodes,streams:[],artworks:[],categories:[{id:'normal',name:'Filmes | Drama',contentKinds:['movie','series']},{id:'adult',name:'Filmes | Adultos',contentKinds:['movie']}],genres:[]},{streamRefResolver:async id=>({id,sourceItemId:id,contentKind:id==='movie-stream'||id==='adult-stream'?'movie':'episode',containerExtension:'mp4',directStreamUrl:'https://synthetic.invalid/'+id+'.mp4'})});
const fp=(kind,item)=>watchFingerprint(kind,item),storage=memory(),history=new WatchHistory(storage);
const progress=(nonce,positionMs,observedAt,ended=false,durationMs=7200000)=>history.observe({playbackId:nonce,positionMs,durationMs,observedAt,ended});
const movieNonce=history.begin('movie',movie.id,undefined,fp('movie',movie));progress(movieNonce,3300000,1000);
const exactEpisode=series.id+':s5:e3',anotherEpisode=series.id+':s5:e4';
const episodeNonce=history.begin('series',series.id,exactEpisode,fp('series',series));progress(episodeNonce,765432,2000);
const anotherNonce=history.begin('series',series.id,anotherEpisode,fp('series',series));progress(anotherNonce,456789,3000);
const restored=new WatchHistory(storage);
assert.equal(restored.savedPosition('movie',movie.id,fp('movie',movie)),3300000);
assert.equal(restored.savedPosition('series',series.id,fp('series',series),exactEpisode),765432);
assert.equal(restored.savedPosition('series',series.id,fp('series',series),anotherEpisode),456789);
assert.equal(restored.list().find(r=>r.kind==='series').episodeId,anotherEpisode);
let allowed=true,streamReads=0;const realGet=model.getStreamRefAsync.bind(model);model.getStreamRefAsync=async id=>{streamReads++;return realGet(id);};
const launched=[],guards=[];
const service=new PlaybackService({history:restored,sessionGuard:{acquireSession:async metadata=>{guards.push(metadata);return {allowed,code:allowed?'OK':'SESSION_LIMIT_REACHED'};},releaseSession:async()=>{}},playerAdapter:{launch:async request=>{launched.push(request);return {success:true,state:'NATIVE_PLAYER_OPENED'};}}});
assert.equal((await service.playMovie(movie.id,model)).success,true);assert.equal(launched.at(-1).startPositionMs,3300000);await service.stopPlayback();
assert.equal((await service.playEpisode(series.id,exactEpisode,model)).success,true);assert.equal(launched.at(-1).startPositionMs,765432);assert.ok(launched.at(-1).uri.includes(':s5:e3-stream'));await service.stopPlayback();
await resumeRecentWatch(restored.list().find(r=>r.kind==='series'),model,service);assert.equal(launched.at(-1).startPositionMs,456789);assert.ok(launched.at(-1).uri.includes(':s5:e4-stream'));await service.stopPlayback();
await service.playMovie(movie.id,model,{startPositionMs:0});assert.equal(launched.at(-1).startPositionMs,0);await service.stopPlayback();
const before=streamReads;allowed=false;assert.equal((await service.playMovie(movie.id,model)).success,false);assert.equal(streamReads,before);allowed=true;
const launches=launched.length;const foreign={...episodes[0],id:'foreign',seriesId:'ser:m3u:99'};model.episodesById.set(foreign.id,foreign);
assert.equal((await service.playEpisode(series.id,foreign.id,model)).success,false);assert.equal(launched.length,launches);
assert.equal(restored.savedPosition('movie',movie.id,'0000000000000000'),0);
const short=new WatchHistory(memory()),shortNonce=short.begin('movie',movie.id,undefined,fp('movie',movie));short.observe({playbackId:shortNonce,positionMs:750,observedAt:1000});assert.equal(short.savedPosition('movie',movie.id,fp('movie',movie)),750);
short.observe({playbackId:shortNonce,positionMs:0,durationMs:0,observedAt:2000});assert.equal(short.savedPosition('movie',movie.id,fp('movie',movie)),750,'unknown opening state cannot erase saved progress');
short.observe({playbackId:shortNonce,positionMs:0,durationMs:7200000,observedAt:3000});assert.equal(short.savedPosition('movie',movie.id,fp('movie',movie)),0,'deliberate rewind to zero is retained');
console.log('PASS_MOVIE55MIN_EXACT_MS_SERIES10X20_INDIVIDUAL_EPISODES_RECENT_LATEST_RESTART_EXPLICIT_ZERO_C9_FOREIGN_ID');

const journalStore=memory(),sessions=new WatchHistory(journalStore),nonce=sessions.begin('movie',movie.id,undefined,fp('movie',movie));
const recovered=new WatchHistory(journalStore,async()=>[{playbackId:nonce,positionMs:3300123,durationMs:7200000,observedAt:5000,ended:false,uri:'https://private.invalid/',headers:{Authorization:'synthetic'}}]);
await recovered.syncNativeProgress();assert.equal(recovered.savedPosition('movie',movie.id,fp('movie',movie)),3300123);
const staleMovie={...recovered.list()[0],positionMs:3300000,updatedAt:4000};
await resumeRecentWatch(staleMovie,model,service,recovered);assert.equal(launched.at(-1).startPositionMs,3300123);await service.stopPlayback();
const delayedStore=memory(),delayedSessions=new WatchHistory(delayedStore),delayedNonce=delayedSessions.begin('series',series.id,anotherEpisode,fp('series',series));
const delayedHistory=new WatchHistory(delayedStore,async()=>[{playbackId:delayedNonce,positionMs:812345,durationMs:3600000,observedAt:8000,ended:false}]);
await resumeRecentWatch({kind:'series',itemId:series.id,episodeId:exactEpisode,fingerprint:fp('series',series),positionMs:765432,durationMs:3600000,updatedAt:2000,completed:false},model,service,delayedHistory);
assert.equal(launched.at(-1).startPositionMs,812345);assert.ok(launched.at(-1).uri.includes(':s5:e4-stream'));await service.stopPlayback();
const finished=new WatchHistory(journalStore,async()=>[{playbackId:nonce,positionMs:7200000,durationMs:7200000,observedAt:6000,ended:true}]);
await finished.syncNativeProgress();finished.observe({playbackId:nonce,positionMs:0,durationMs:0,observedAt:7000,ended:false});assert.equal(finished.savedPosition('movie',movie.id,fp('movie',movie)),0);assert.equal(finished.list()[0].completed,true);
for(const serialized of journalStore.values.values()){assert.ok(!serialized.includes('private.invalid'));assert.ok(!serialized.includes('Authorization'));assert.ok(!serialized.includes(movie.title));}
const large=memory(),bounded=new WatchHistory(large);
for(let n=0;n<1010;n++){const id='movie-'+n;bounded.observe({playbackId:bounded.begin('movie',id,undefined,'1234567890abcdef'),positionMs:2000,durationMs:10000,observedAt:1000+n});}
const persisted=JSON.parse(large.values.get('xandeflix:watch-positions:v1'));assert.equal(persisted.records.length,1000);assert.ok(Buffer.byteLength(large.values.get('xandeflix:watch-positions:v1'),'utf8')<=262144);assert.equal(bounded.list().length,60);
const unavailable=new WatchHistory({getItem(){throw Error('denied');},setItem(){throw Error('quota');}});unavailable.observe({playbackId:unavailable.begin('movie',movie.id,undefined,fp('movie',movie)),positionMs:3300000,observedAt:1000});assert.equal(unavailable.savedPosition('movie',movie.id,fp('movie',movie)),3300000);
const malicious=memory(),invalid=new WatchHistory(malicious,async()=>{throw Error('unavailable');});invalid.begin('movie','https://private.invalid/');await invalid.syncNativeProgress();assert.equal(malicious.values.size,0);
const malformed=new WatchHistory(memory(),async()=>[null,{}, {positionMs:NaN}]);await malformed.syncNativeProgress();assert.equal(malformed.list().length,0);
const longSessions=memory(),longHistory=new WatchHistory(longSessions);for(let n=0;n<5;n++)longHistory.begin('series','界'.repeat(500)+n,'集'.repeat(500)+n,'1234567890abcdef');assert.ok(Buffer.byteLength(longSessions.values.get('xandeflix:watch-sessions:v1'),'utf8')<=8192);
console.log('PASS_NATIVE_FINAL_JOURNAL_RESTART_COMPLETION_STICKY_POSITION1000_256K_RECENT60_PRIVACY_STORAGE_FAILURE');

for(const name of ['FILMES | ADULTOS','Canais | Adulto','SERIES | XXX','Filmes | Eróticos','Pornografia','Hentai','SEXYHOT'])assert.equal(policy.isAdultClassification(name),true,name);
for(const name of ['Drama','18','Filmes | Ação','Adult Swim','A Vida Adulta'])assert.equal(policy.isAdultClassification(name),false,name);
assert.equal(policy.isAdultCatalogItem(adult,model),true);assert.equal(policy.isAdultCatalogItem(movie,model),false);
const adultHistory=new WatchHistory(memory()),adultNonce=adultHistory.begin('movie',adult.id,undefined,fp('movie',adult),false);adultHistory.observe({playbackId:adultNonce,positionMs:654321,durationMs:7200000,observedAt:1000});assert.equal(adultHistory.list().length,0);assert.equal(adultHistory.savedPosition('movie',adult.id,fp('movie',adult)),654321);
const entry=item=>({kind:'movie',itemId:item.id,fingerprint:fp('movie',item),positionMs:3300000,durationMs:7200000,updatedAt:1000,completed:false});
const legacy=[entry(adult),entry(movie)];assert.deepEqual((await resolveRecentTitleBindings(legacy,model,{},new AbortController().signal)).map(b=>b.item.id),[movie.id]);
const renamed={...entry(adult),itemId:'mov:m3u:99'};
assert.equal((await resolveRecentTitleBindings([renamed],model,{readActiveManifest:async()=>({snapshotId:'fixture',segments:[{kind:'movies',fileName:'movies_1.json'}]}),readActivePointer:async()=>({snapshotId:'fixture'}),readActiveSegment:async()=>JSON.stringify([adult])},new AbortController().signal)).length,0);
// Execute the real RecentTitles fast path and async publish, recording each setResolved.
const published=[],effects=[],react={...React,useRef:value=>({current:value}),useState:initial=>[typeof initial==='function'?initial():initial,value=>{if(Array.isArray(value))published.push(value);}],useEffect:fn=>effects.push(fn)};
const module={exports:{}},code=ts.transpileModule(readFileSync(new URL('../src/ui/components/RecentTitles.tsx',import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React}}).outputText;
const imports={react:{default:react,...react},'catalog-selectors':selectors,'content-adult-policy':policy,'watch-history':{watchHistory:{list:()=>legacy,subscribe:()=>()=>{},syncNativeProgress:async()=>{}},watchFingerprint,resumeRecentWatch},'recent-title-resolution':{resolveRecentTitleBindings},'bootstrap/client':{getClientBootstrapService:()=>({getStorage:()=>({})})},'playback.service':{defaultPlaybackService:service},MediaRail:{MediaRail:()=>null},CatalogGrid:{CatalogGrid:()=>null}};
new Function('require','module','exports',code)(name=>{const found=Object.entries(imports).find(([key])=>name.includes(key));if(!found)throw Error('Uncontrolled dependency '+name);return found[1];},module,module.exports);
module.exports.RecentTitles({readModel:model});const cleanup=effects.map(fn=>fn());for(let n=0;n<15;n++)await Promise.resolve();assert.ok(published.length>=2);assert.ok(published.every(rows=>rows.every(row=>row.id!==adult.id)));cleanup.forEach(fn=>fn?.());
console.log('PASS_ADULT_MOVIE_NEW_LEGACY_REBIND_AND_FIRST_RENDER_EXCLUDED_ORDINARY_AGE18_PRESERVED');

const groups=[{id:'adult-group',name:'Canais | Adultos'},{id:'normal-group',name:'Canais | Notícias'}];
const channel=(id,groupId='normal-group',name='News '+id)=>({id,name,groupId,streamId:'stream-'+id,streamRef:{sourceItemId:'stream-'+id,containerExtension:'ts',directStreamUrl:'https://private.invalid/'+id+'.ts'}});
const channels=Array.from({length:60},(_,n)=>channel('channel-'+n)),adultChannel=channel('adult','adult-group','Adult channel');
const live={snapshotId:'live-fixture',groups,channels:[adultChannel,...channels.slice(0,2)],channelsByGroup:{'adult-group':[adultChannel],'normal-group':channels.slice(0,2)}};
const preferenceStorage=memory(),preference=new LastLiveChannel(preferenceStorage);assert.equal(preference.remember(channels[55],live),true);assert.equal(preference.remember(adultChannel,live),false);
assert.equal(preference.read().channelId,'channel-55');const freshPreference=new LastLiveChannel(preferenceStorage);
const reads=[];let generation='live-fixture';const loadPage=async(groupId,offset,size)=>{reads.push([groupId,offset,size]);const rows=groupId==='adult-group'?[adultChannel]:channels;return {channels:rows.slice(offset,offset+size),offset,totalAvailable:rows.length,nextOffset:offset+size<rows.length?offset+size:null};};
const options={preference:freshPreference,loadPage,activeSnapshot:async()=>generation,signal:new AbortController().signal};
assert.equal((await chooseInitialLiveChannel(live,options)).id,'channel-55');assert.ok(reads.some(r=>r[1]===48));assert.ok(reads.every(r=>r[0]!=='adult-group'&&r[2]===48));
const previousName=channels[55].name;channels[55].name='Different channel on reused ID';assert.equal((await chooseInitialLiveChannel(live,options)).id,'channel-0');channels[55].name=previousName;
assert.equal((await chooseInitialLiveChannel(live,{...options,preference:new LastLiveChannel(memory())})).id,'channel-0');
channels[55].metadata={adult:true};assert.equal((await chooseInitialLiveChannel(live,options)).id,'channel-0');delete channels[55].metadata;
assert.equal(await chooseInitialLiveChannel({...live,groups:[groups[0]]},{...options,preference:new LastLiveChannel(memory())}),undefined);
const aborted=new AbortController();aborted.abort();await assert.rejects(chooseInitialLiveChannel(live,{...options,signal:aborted.signal}));generation='other';await assert.rejects(chooseInitialLiveChannel(live,options));generation='live-fixture';
const during=new AbortController();await assert.rejects(chooseInitialLiveChannel(live,{...options,signal:during.signal,loadPage:async(...args)=>{const page=await loadPage(...args);during.abort();return page;}}));
for(const serialized of preferenceStorage.values.values()){assert.ok(!serialized.includes('private.invalid'));assert.ok(!serialized.includes('News'));assert.ok(Buffer.byteLength(serialized)<=2048);}
console.log('PASS_LAST_NON_ADULT_CHANNEL_OUTSIDE_FIRST_PAGE_RESTART_ADULT_FIRST_FALLBACK_REUSED_ID_METADATA_ABORT_GENERATION_PRIVACY');
