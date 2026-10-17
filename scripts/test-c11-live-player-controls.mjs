import assert from 'node:assert/strict';
import fs from 'node:fs';
import { adjacentLiveChannel, favoriteLivePage } from '../src/playback/live-player-navigation.ts';
import { LiveFavorites, liveFavoriteScope } from '../src/playback/live-favorites.ts';
import { liveChannelFingerprint } from '../src/playback/last-live-channel.ts';

let tests=0;
async function test(name,run){await run();console.log('PASS '+name);tests++;}
const channel=(id,groupId='g1')=>({id:'live:'+id,name:'Channel '+id,groupId,groupName:groupId,streamId:'stream:'+id,streamRef:{sourceItemId:id,directStreamUrl:'https://synthetic.invalid/live/'+id+'.ts'}});
const groups=[{id:'g1',name:'Group 1'},{id:'g2',name:'Group 2'}];
const catalog={snapshotId:'qa',generatedAt:'',groups,channels:[],channelsByGroup:{}};
const rows={g1:Array.from({length:105},(_,i)=>channel(String(i))),g2:Array.from({length:50},(_,i)=>channel('other'+i,'g2'))};
const reads=[];
const port={activeSnapshot:async()=>catalog.snapshotId,loadPage:async(id,offset,size)=>{reads.push({id,offset,size});const list=rows[id];return {channels:list.slice(offset,offset+size),offset,totalAvailable:list.length,nextOffset:offset+size<list.length?offset+size:null};}};
const signal=()=>new AbortController().signal;
await test('CHANNEL_PREVIOUS_NEXT_CROSS_PAGE_BOUNDARY_AND_NEVER_WRAP',async()=>{
  assert.equal((await adjacentLiveChannel(catalog,rows.g1[47],1,port,signal())).id,rows.g1[48].id);
  assert.equal((await adjacentLiveChannel(catalog,rows.g1[48],-1,port,signal())).id,rows.g1[47].id);
  assert.equal(await adjacentLiveChannel(catalog,rows.g1[0],-1,port,signal()),undefined);
  assert.equal(await adjacentLiveChannel(catalog,rows.g1[104],1,port,signal()),undefined);
  assert.ok(reads.every(read=>read.size===48&&read.id==='g1'));
});
await test('STALE_GENERATION_ABORT_MISSING_CHANNEL_AND_MALFORMED_CURSOR_FAIL',async()=>{
  const aborted=new AbortController();aborted.abort();await assert.rejects(adjacentLiveChannel(catalog,rows.g1[0],1,port,aborted.signal),/CHANGED/);
  await assert.rejects(adjacentLiveChannel(catalog,rows.g1[0],1,{...port,activeSnapshot:async()=> 'different'},signal()),/CHANGED/);
  await assert.rejects(adjacentLiveChannel(catalog,channel('absent'),1,port,signal()),/CHANNEL_CHANGED/);
  await assert.rejects(adjacentLiveChannel(catalog,rows.g1[104],1,{...port,loadPage:async()=>({channels:[],offset:0,totalAvailable:2,nextOffset:0})},signal()),/INVALID/);
});
await test('FAVORITES_PERSIST_RESTART_SOURCE_ISOLATION_AND_ORDINAL_REBIND',()=>{
  const values=new Map(),storage={getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value)};
  const scope=liveFavoriteScope('opaque-a'),other=liveFavoriteScope('opaque-b');const store=new LiveFavorites(()=>storage);
  store.toggle(scope,rows.g1[0],catalog);const restarted=new LiveFavorites(()=>storage);
  assert.equal(restarted.keys(scope).size,1);assert.equal(restarted.keys(other).size,0);
  assert.equal(restarted.keys(scope).has(liveChannelFingerprint({...rows.g1[0],id:'live:reordered'},catalog)),true);
  assert.equal(store.toggle(scope,rows.g1[0],catalog).size,0);
  for(const forbidden of ['Channel','synthetic.invalid','directStreamUrl','opaque-a'])assert.ok(![...values.values()].join().includes(forbidden));
});
await test('FAVORITES_DENIED_LOST_WRITE_INVALID_SCHEMA_AND_LIMIT_FAIL',()=>{
  const scope=liveFavoriteScope('opaque-a');
  assert.throws(()=>new LiveFavorites(()=>({getItem:()=>null,setItem(){throw Error('denied');}})).toggle(scope,rows.g1[0],catalog));
  assert.throws(()=>new LiveFavorites(()=>({getItem:()=>null,setItem(){}})).toggle(scope,rows.g1[0],catalog),/UNAVAILABLE/);
  assert.throws(()=>new LiveFavorites(()=>({getItem:()=>'{"version":2}',setItem(){}})).keys(scope),/INVALID/);
  let data=null;const store=new LiveFavorites(()=>({getItem:()=>data,setItem:(k,v)=>{data=v;}}));
  for(let i=0;i<200;i++)store.toggle(scope,channel('favorite'+i),catalog);
  assert.throws(()=>store.toggle(scope,channel('overflow'),catalog),/LIMIT/);assert.equal(store.keys(scope).size,200);
});
await test('FAVORITES_LIST_PAGINATION_COVERS_GROUPS_WITHOUT_LOSING_MATCHES',async()=>{
  const keys=new Set([...rows.g1,...rows.g2].map(c=>liveChannelFingerprint(c,catalog))),seen=[],pages=[];let cursor;
  do {const page=await favoriteLivePage(catalog,keys,port,signal(),cursor);assert.ok(page.channels.length<=48);seen.push(...page.channels.map(c=>c.id));pages.push(page);cursor=page.next;}while(cursor);
  assert.deepEqual(seen,[...rows.g1,...rows.g2].map(c=>c.id));assert.equal(new Set(seen).size,155);
  assert.deepEqual(await favoriteLivePage(catalog,new Set(),port,signal()),{channels:[],next:null});
  await assert.rejects(favoriteLivePage(catalog,keys,{...port,activeSnapshot:async()=> 'stale'},signal()),/CHANGED/);
});
await test('LIVE_LAYOUT_EXCLUDES_VOD_SEEK_TIMELINE_EPISODE_AND_SPEED_CONTROLS',()=>{
  const xml=fs.readFileSync(new URL('../android/app/src/main/res/layout/xandeflix_live_controls.xml',import.meta.url),'utf8');
  for(const id of ['live_previous','live_next','live_channels','live_categories','live_guide','live_favorite','live_favorites','exo_play_pause','live_resize'])assert.ok(xml.includes(id));
  for(const forbidden of ['exo_rew','exo_ffwd','exo_progress','exo_position','exo_duration','player_episodes','player_speed','live_tracks'])assert.ok(!xml.includes(forbidden));
  const liveControls=fs.readFileSync(new URL('../android/app/src/main/java/com/xandeflix/prebuilt/player/LivePlayerControls.java',import.meta.url),'utf8');
  assert.ok(!liveControls.includes('live_tracks'));assert.ok(!liveControls.includes('showTracks'));assert.ok(!liveControls.includes('TrackSelectionDialogBuilder'));
  const vodLayout=fs.readFileSync(new URL('../android/app/src/main/res/layout/xandeflix_player_controls.xml',import.meta.url),'utf8');
  const vodControls=fs.readFileSync(new URL('../android/app/src/main/java/com/xandeflix/prebuilt/player/PlayerControls.java',import.meta.url),'utf8');
  assert.ok(vodLayout.includes('player_tracks'));assert.ok(vodControls.includes('R.id.player_tracks).setOnClickListener'));assert.ok(vodControls.includes('TrackSelectionDialogBuilder'));
  const plugin=fs.readFileSync(new URL('../android/app/src/main/java/com/xandeflix/prebuilt/player/NativeAndroidPlayerPlugin.java',import.meta.url),'utf8');
  const set=plugin.slice(plugin.indexOf('public void setLiveControls'),plugin.indexOf('public boolean dispatchLiveKey'));
  assert.ok(set.includes('currentPreviewId.equals(call.getString("previewId"))'));
  for(const forbidden of ['playPreviewCandidate','new ExoPlayer','Log.','setMediaSource'])assert.ok(!set.includes(forbidden));
});
await test('PIP_PRIVATE_CURRENT_PLAYER_ACTIONS_AND_DISPOSAL_WIRING',()=>{
  const pip=fs.readFileSync(new URL('../android/app/src/main/java/com/xandeflix/prebuilt/player/MobilePipController.java',import.meta.url),'utf8');
  for(const token of ['RECEIVER_NOT_EXPORTED','FLAG_IMMUTABLE','UUID.randomUUID()','activity.isInPictureInPictureMode()','actions.close()','actionIntent.cancel()','unregisterReceiver','"Silenciar"','"Pausar"'])assert.ok(pip.includes(token));
  for(const [file,kind] of [['NativeAndroidPlayerPlugin','currentPreviewKind'],['NativePlayerActivity','currentKind']]) {
    const source=fs.readFileSync(new URL('../android/app/src/main/java/com/xandeflix/prebuilt/player/'+file+'.java',import.meta.url),'utf8');
    assert.ok(source.includes('new MobilePipController(')); assert.ok(source.includes('player,'+kind+')')||source.includes('previewPlayer,'+kind+')'));
    assert.ok(source.includes('pipController.close()'));
  }
});
console.log(JSON.stringify({tests,pass:true,networkRequests:0}));
