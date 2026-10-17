import assert from 'node:assert/strict';
import nodeFs from 'node:fs';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {SeriesPersonalStore} from '../src/ui/series-personal.store.ts';
import {watchFingerprint} from '../src/playback/watch-history.ts';
import {residentFavoriteTitles,resolveFavoriteTitles} from '../src/ui/favorite-title-resolution.ts';
import {resolveLiveFavoriteCategory,favoriteChannelPage} from '../src/playback/live-favorite-category.ts';
import {LiveFavorites,liveFavoriteScope} from '../src/playback/live-favorites.ts';
import {liveChannelFingerprint} from '../src/playback/last-live-channel.ts';

let tests=0;async function test(name,run){await run();tests++;console.log('PASS '+name);}
const signal=()=>new AbortController().signal;
const item=(id,title)=>({id,title,year:2026,categoryIds:[],genreIds:[],artworkIds:[]});
const movie=item('mov:m3u:1','Filme escolhido'),series=item('ser:m3u:1','Série escolhida');
const fm=watchFingerprint('movie',movie),fs=watchFingerprint('series',series);
const values=new Map(),port={getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value)};
const store=new SeriesPersonalStore(port);
await test('MIXED_MOVIE_SERIES_PERSIST_RESTART_SUBSCRIBE_REMOVE_AND_KEEP_RATING',()=>{
  let notifications=0;const stop=store.subscribe(()=>notifications++);
  store.set(fm,{favorite:true,rating:'love'},{kind:'movie',itemId:movie.id});store.set(fs,{favorite:true},{kind:'series',itemId:series.id});
  const reloaded=new SeriesPersonalStore(port);assert.deepEqual(new Set(reloaded.favorites().map(row=>row.target.kind)),new Set(['movie','series']));
  assert.equal(reloaded.favorites().find(row=>row.fingerprint===fm).target.itemId,movie.id);
  store.set(fm,{...store.get(fm),favorite:false});assert.deepEqual(store.get(fm),{favorite:false,rating:'love'});
  assert.deepEqual(store.favorites().map(row=>row.fingerprint),[fs]);assert.equal(notifications,3);stop();store.set(fs,{favorite:false});assert.equal(notifications,3);
});
await test('LEGACY_V1_RETAINED_HINT_ALLOWLIST_DEFENSIVE_COPY_AND_RAM_FALLBACK',()=>{
  const legacy=new SeriesPersonalStore({getItem:()=>JSON.stringify({version:1,entries:[[fm,{favorite:true,rating:'like',updatedAt:1}]]}),setItem(){}});
  assert.deepEqual(legacy.favorites(),[{fingerprint:fm,updatedAt:1}]);
  legacy.set(fm,{favorite:true,rating:'love'},{kind:'movie',itemId:movie.id,privateUrl:'https://must-not-survive.invalid'});
  const record=legacy.favorites()[0];record.target.itemId='changed';assert.equal(legacy.favorites()[0].target.itemId,movie.id);
  let saved;const safe=new SeriesPersonalStore({getItem:()=>null,setItem:(_key,value)=>saved=value});safe.set(fm,{favorite:true},{kind:'movie',itemId:'https://private.invalid'});
  assert.equal(safe.favorites()[0].target,undefined);assert.ok(!saved.includes('private'));
  const denied=new SeriesPersonalStore({getItem(){throw Error('denied');},setItem(){throw Error('denied');}});denied.set(fm,{favorite:true},{kind:'movie',itemId:movie.id});assert.equal(denied.favorites().length,1);
});
await test('STORE_EXISTING_LIMIT_256_64K_AND_NO_ARBITRARY_PAYLOAD',()=>{
  for(let n=0;n<300;n++)store.set(n.toString(16).padStart(16,'0'),{favorite:true,streamUrl:'https://secret.invalid'},{kind:'movie',itemId:'mov:'+n});
  assert.equal(store.favorites().length,256);assert.ok([...values.values()].every(raw=>new TextEncoder().encode(raw).length<=65536&&!raw.includes('secret.invalid')));
});

function fixture(){
  let snapshot='active',reads=0;const segments=new Map();
  const model={catalog:{metadata:{snapshotId:'active'}},moviesById:new Map([[movie.id,movie]]),seriesById:new Map([[series.id,series]]),categoryById:new Map([['adult',{name:'Adultos'}]]),genreById:new Map(),resolveMovieById:async id=>model.moviesById.get(id),resolveSeriesById:async id=>model.seriesById.get(id)};
  const storage={readActiveManifest:async()=>({snapshotId:snapshot,segments:[...segments.keys()].map(fileName=>({kind:fileName.includes('series')?'series':'movies',fileName}))}),readActivePointer:async()=>({snapshotId:snapshot}),readActiveSegment:async name=>{reads++;return segments.get(name.replace('segments/',''));}};
  return {model,storage,segments,get reads(){return reads;},generation(value){snapshot=value;}};
}
const favorites=[{fingerprint:fm,updatedAt:2,target:{kind:'movie',itemId:movie.id}},{fingerprint:fs,updatedAt:1,target:{kind:'series',itemId:series.id}}];
await test('RESIDENT_MIXED_FAVORITES_ORDER_NO_IO_NO_CATALOG_MUTATION',async()=>{
  const f=fixture(),before=JSON.stringify([...f.model.moviesById]);assert.deepEqual(residentFavoriteTitles(favorites,f.model).map(row=>row.kind),['movie','series']);
  const rows=await resolveFavoriteTitles(favorites,f.model,{readActiveManifest(){throw Error('unneeded');}},signal());assert.deepEqual(rows.map(row=>row.item.id),[movie.id,series.id]);assert.equal(JSON.stringify([...f.model.moviesById]),before);
});
await test('OFF_FIRST_FOLD_HINT_MATCH_AND_REJECT_WRONG_ID_CONTENT',async()=>{
  const f=fixture();f.model.moviesById.clear();let calls=0;f.model.resolveMovieById=async()=>{calls++;return movie;};
  assert.equal((await resolveFavoriteTitles(favorites,f.model,f.storage,signal())).length,2);assert.equal(calls,1);assert.equal(f.reads,0);
  f.model.resolveMovieById=async()=>item(movie.id,'Outro filme');assert.deepEqual((await resolveFavoriteTitles(favorites,f.model,f.storage,signal())).map(row=>row.kind),['series']);
});
await test('LEGACY_AND_REORDERED_FAVORITES_REBIND_LOCAL_SEGMENTS_ADULT_AND_DUPLICATES_FILTERED',async()=>{
  const f=fixture(),changed={...movie,id:'mov:m3u:99'},adult={...item('mov:adult','Restrito'),categoryIds:['adult']};f.model.moviesById.clear();f.model.seriesById.clear();
  f.segments.set('movies_1.json',JSON.stringify([item('mov:other','Outro'),changed,changed,adult]));f.segments.set('series_1.json',JSON.stringify([series]));
  const rows=await resolveFavoriteTitles([...favorites,{fingerprint:watchFingerprint('movie',adult),updatedAt:0}],f.model,f.storage,signal());assert.deepEqual(rows.map(row=>row.item.id),[changed.id,series.id]);assert.equal(f.reads,2);
});
await test('CANCEL_GENERATION_MISSING_INVALID_SEGMENTS_FAIL_WITHOUT_FALSE_SUCCESS',async()=>{
  const f=fixture();f.model.moviesById.clear();const abort=new AbortController();abort.abort();await assert.rejects(resolveFavoriteTitles(favorites,f.model,f.storage,abort.signal),/CANCELLED/);
  f.generation('new');await assert.rejects(resolveFavoriteTitles(favorites,f.model,f.storage,signal()),/GENERATION_CHANGED/);f.generation('active');
  f.segments.set('movies_1.json',null);await assert.rejects(resolveFavoriteTitles(favorites,f.model,f.storage,signal()),/UNAVAILABLE/);
  f.segments.set('movies_1.json','{}');await assert.rejects(resolveFavoriteTitles(favorites,f.model,f.storage,signal()),/INVALID/);
  f.segments.set('movies_1.json',JSON.stringify([movie]));const original=f.storage.readActiveSegment;f.storage.readActiveSegment=async name=>{const data=await original(name);f.generation('new');return data;};await assert.rejects(resolveFavoriteTitles(favorites,f.model,f.storage,signal()),/GENERATION_CHANGED/);
});
await test('COLLECTION_FIRST_RENDER_PENDING_LOOKUP_NEVER_CLAIMS_EMPTY',()=>{
  const module={exports:{}},code=ts.transpileModule(nodeFs.readFileSync('src/ui/components/FavoriteTitles.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,target:ts.ScriptTarget.ES2022}}).outputText;
  const imports={react:{...React,default:React},'series-personal.store':{seriesPersonalStore:{favorites:()=>favorites,subscribe:()=>()=>{}}},'favorite-title-resolution':{residentFavoriteTitles:()=>[]},'catalog-selectors':{},'bootstrap/client':{},MediaRail:{MediaRail:()=>null},CatalogGrid:{CatalogGrid:()=>null}};
  new Function('require','module','exports',code)(name=>{for(const [key,value]of Object.entries(imports))if(name.includes(key))return value;throw Error('Uncontrolled dependency '+name);},module,module.exports);
  const html=renderToStaticMarkup(React.createElement(module.exports.FavoriteTitles,{readModel:fixture().model,onSelectItem(){},presentation:'collection'}));
  assert.match(html,/Carregando favoritos/);assert.ok(!html.includes('Nenhum favorito'));assert.match(html,/aria-busy="true"/);
});

const channel=(n,groupId='a')=>({id:'live:'+groupId+':'+n,name:'Canal '+n,groupId,groupName:groupId,streamRef:{sourceItemId:String(n)}});
const catalog={snapshotId:'live-active',groups:[{id:'a',name:'A'},{id:'b',name:'B'}],channels:[],channelsByGroup:{}};
const channels=[...Array.from({length:105},(_,i)=>channel(i)),...Array.from({length:50},(_,i)=>channel(i,'b'))];
const keys=new Set(channels.map(row=>liveChannelFingerprint(row,catalog))),reads=[];
const livePort={activeSnapshot:async()=>catalog.snapshotId,loadPage:async(id,offset,size)=>{reads.push(size);const rows=channels.filter(row=>row.groupId===id);return {channels:rows.slice(offset,offset+size),offset,totalAvailable:rows.length,nextOffset:offset+size<rows.length?offset+size:null};}};
await test('ALL_155_FAVORITE_CHANNELS_CONTINUOUS_FILTER_LAST_ITEM_NO_LOSS_48_PAGE_LIMIT',async()=>{
  const rows=await resolveLiveFavoriteCategory(catalog,keys,livePort,signal());assert.deepEqual(rows.map(row=>row.id),channels.map(row=>row.id));
  const seen=[];for(let offset=0;;){const page=favoriteChannelPage(rows,offset);assert.ok(page.channels.length<=48);seen.push(...page.channels.map(row=>row.id));if(page.nextOffset===null)break;offset=page.nextOffset;}
  assert.deepEqual(seen,channels.map(row=>row.id));const filtered=favoriteChannelPage(rows,0,'  canal 104  ');assert.equal(filtered.totalAvailable,1);assert.equal(filtered.channels[0].id,channels[104].id);assert.ok(reads.every(size=>size===48));assert.equal(catalog.channels.length,0);
});
await test('LIVE_SOURCE_PERSIST_RESTART_REMOVE_AND_NEVER_PREPARE_SECOND_STREAM',async()=>{
  const map=new Map(),data={getItem:key=>map.get(key)||null,setItem:(key,value)=>map.set(key,value)},scope=liveFavoriteScope('source-a');const saved=new LiveFavorites(()=>data);
  saved.toggle(scope,channels[104],catalog);const reloaded=new LiveFavorites(()=>data);assert.equal(reloaded.keys(liveFavoriteScope('source-b')).size,0);
  assert.deepEqual((await resolveLiveFavoriteCategory(catalog,reloaded.keys(scope),livePort,signal())).map(row=>row.id),[channels[104].id]);saved.toggle(scope,channels[104],catalog);
  let calls=0;assert.deepEqual(await resolveLiveFavoriteCategory(catalog,saved.keys(scope),{...livePort,loadPage:async()=>{calls++;throw Error('no read');}},signal()),[]);assert.equal(calls,0);
  assert.ok(!JSON.stringify([...map.values()]).includes('Canal'));
});
await test('LIVE_ABORT_GENERATION_LIMIT_AND_DEDUPLICATION',async()=>{
  const abort=new AbortController();abort.abort();await assert.rejects(resolveLiveFavoriteCategory(catalog,keys,livePort,abort.signal),/CHANGED/);
  await assert.rejects(resolveLiveFavoriteCategory(catalog,keys,{...livePort,activeSnapshot:async()=> 'new'},signal()),/CHANGED/);
  await assert.rejects(resolveLiveFavoriteCategory(catalog,new Set(Array.from({length:201},(_,i)=>String(i))),livePort,signal()),/LIMIT/);
  const duplicatePort={...livePort,loadPage:async(id,offset,size)=>{const page=await livePort.loadPage(id,offset,size);return {...page,channels:[...page.channels,page.channels[0]].filter(Boolean)};}};
  const oneKeys=new Set([liveChannelFingerprint(channels[0],catalog)]);assert.equal((await resolveLiveFavoriteCategory(catalog,oneKeys,duplicatePort,signal())).length,1);
});
console.log('C123_FAVORITES_TESTS='+tests+'/PASS');
