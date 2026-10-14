import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as homeHeroService from '../src/catalog/home-hero.service.ts';
import * as tmdbModule from '../src/artwork/tmdb-metadata.service.ts';
import * as catalogSelectors from '../src/catalog/catalog-selectors.ts';
import { CatalogReadModel } from '../src/catalog/catalog-read-model.ts';
import { HomeHeroService, currentYearHeroItems, isPhoneHeroProfile } from '../src/catalog/home-hero.service.ts';
import { MemoryHomeHeroRepository } from '../src/catalog/home-hero.repository.ts';
import { TmdbMetadataService, chooseHeroPoster, tmdbHeroPosters, normalizeArtworkIdentity } from '../src/artwork/tmdb-metadata.service.ts';

const year = new Date().getFullYear();
assert.equal(normalizeArtworkIdentity({kind:'movie',title:`Movie (${year}) | [4K]`}).year,year);
assert.equal(normalizeArtworkIdentity({kind:'movie',title:'1917'}).title,'1917');
const row = (kind, n, releaseYear = year) => ({ id: `${kind}-${n}`, title: `${kind} Fixture ${n} (${releaseYear}) HD`,
  year: releaseYear, categoryIds: ['launch'], genreIds: [], artworkIds: [], streamIds: [], seasonIds: [], posterUri: 'https://source.synthetic.invalid/category.jpg' });
let movies = Array.from({ length: 17 }, (_, n) => row('movie', n));
let series = Array.from({ length: 13 }, (_, n) => row('series', n));
movies.unshift(row('movie', 'old', year - 1)); series.unshift(row('series', 'future', year + 1));
const model = (snapshotId, ms = movies, ss = series) => new CatalogReadModel({
  metadata: { schemaVersion: 1, catalogVersion: '1', snapshotId, generatedAt: '2026-10-06', counts: { movies: ms.length, series: ss.length, categories: 1, genres: 0, artworks: 0, streams: 0, seasons: 0, episodes: 0 } },
  movies: ms.slice(0, 2), series: ss.slice(0, 2), seasons: [], episodes: [], streams: [], artworks: [], genres: [],
  categories: [{ id: 'launch', name: 'Lançamentos', contentKinds: ['movie', 'series'] }],
});
let active = 'a', reads = 0, simultaneous = 0, peak = 0, metadataCalls = 0;
const storage = {
  async readActivePointer() { return { snapshotId: active }; },
  async readActiveManifest() { return { snapshotId: active, metadata: { sourceId: 'synthetic-source' }, segments: [
    { kind: 'movies', fileName: 'movies_000001.json' }, { kind: 'movies', fileName: 'movies_000002.json' }, { kind: 'series', fileName: 'series_000001.json' } ] }; },
  async readActiveSegment(file) { reads++; peak = Math.max(peak, ++simultaneous); await new Promise((r) => setTimeout(r, 1)); simultaneous--;
    return JSON.stringify(file.includes('series') ? series : file.includes('000001') ? movies.slice(0, 3) : movies.slice(3)); },
};
const repo = new MemoryHomeHeroRepository(2000);
const service = new HomeHeroService(repo, async () => { metadataCalls++; return null; });
await service.prepare(model(active), storage, year, new AbortController().signal);
assert.equal(peak, 1); assert.equal(reads, 3); assert.equal(metadataCalls, 0);
const initial = await service.options(year);
assert.equal(initial.filter(v => v.item.kind === 'movie').length, 5);
assert.equal(initial.filter(v => v.item.kind === 'series').length, 5);
assert.equal(new Set(initial.map(v => v.key)).size, 10);
assert.ok(initial.every(v => Number(v.item.yearFormatted) === year && !v.fresh));
const rotations = new Set([initial.map(v=>v.key).join('|')]);
for (let i=0; i<6; i++) rotations.add((await service.options(year)).map(v=>v.key).join('|'));
assert.ok(rotations.size > 1);
await service.prepare(model(active), storage, year, new AbortController().signal); assert.equal(reads, 3, 'committed snapshot reused');
console.log('PASS_5_MOVIES_5_SERIES_CURRENT_YEAR_RANDOM_AND_ONE_SEGMENT_IN_RAM');

// Positional M3U IDs and source ordering can change without adding content.
active = 'b'; movies.reverse(); series.reverse(); movies = movies.map((m,i)=>({...m,id:'reordered-'+i}));
await service.prepare(model(active), storage, year, new AbortController().signal);
assert.ok((await service.options(year)).every(v=>!v.fresh));
const before = new Set([...repo.records.keys()]);
active = 'c'; const addedMovies = Array.from({length:12},(_,i)=>row('movie','new-'+i));
const addedSeries = Array.from({length:9},(_,i)=>row('series','new-'+i));
movies.push(...addedMovies); series.push(...addedSeries);
await service.prepare(model(active), storage, year, new AbortController().signal);
const fresh = new Set([...repo.records.values()].filter(v=>v.snapshotId===active&&v.item&&v.fresh).map(v=>v.key));
assert.equal(fresh.size, 21); assert.ok([...fresh].every(key=>!before.has(key)));
const displayed = new Set(); let batch = await service.options(year);
assert.ok(batch[0].fresh);
for(let pass=0;pass<6;pass++) { for(const option of batch){if(option.fresh)displayed.add(option.key);await service.displayed(option)}batch=await service.options(year,new Set(batch.map(v=>v.key))) }
assert.deepEqual(displayed, fresh, 'all new releases beyond first ten become hero options');
assert.ok((await service.options(year)).every(v=>!v.fresh));
console.log('PASS_REORDER_IS_NOT_NEW_AND_ALL_21_NEW_RELEASES_RECEIVE_PRIORITY');

active='d'; movies=movies.filter(v=>!v.title.includes('new-')); series=series.filter(v=>!v.title.includes('new-'));
await service.prepare(model(active),storage,year,new AbortController().signal);
assert.ok((await service.options(year)).every(v=>!v.item.title.includes('new-')));
const cancelled=new AbortController();cancelled.abort();await assert.rejects(()=>service.prepare(model('cancelled'),storage,year,cancelled.signal),/CANCELLED/);
active='foreign';await assert.rejects(()=>service.prepare(model('d'),storage,year,new AbortController().signal),/GENERATION_CHANGED/);
console.log('PASS_REMOVED_SOURCE_CONTENT_AND_CANCELLED_OLD_SNAPSHOT_NEVER_FEATURED');

active='older-launches'; movies.push(...Array.from({length:12},(_,i)=>row('movie','late-old-'+i,year-1)));
await service.prepare(model(active),storage,year,new AbortController().signal);
const lateSeen=new Set();batch=await service.options(year);
for(let pass=0;pass<4;pass++){
 assert.equal(batch.filter(v=>v.item.kind==='movie'&&Number(v.item.yearFormatted)===year).length,5);
 assert.equal(batch.filter(v=>v.item.kind==='series'&&Number(v.item.yearFormatted)===year).length,5);
 for(const option of batch){if(option.item.title.includes('late-old-'))lateSeen.add(option.key);await service.displayed(option)}
 batch=await service.options(year,new Set(batch.map(v=>v.key)));
}
assert.equal(lateSeen.size,12);assert.ok((await service.options(year)).every(v=>Number(v.item.yearFormatted)===year));
console.log('PASS_NEW_OLDER_RELEASES_DISPLAYED_WITHOUT_REDUCING_CURRENT_YEAR_5_PLUS_5');

active='unknown'; movies=Array.from({length:8},(_,i)=>({...row('movie','unknown-'+i),year:undefined,title:'Unknown movie '+i}));series=Array.from({length:8},(_,i)=>({...row('series','unknown-'+i),year:undefined,title:'Unknown series '+i}));
const unknownRepo=new MemoryHomeHeroRepository();let unknownCalls=0;
const enriched=new HomeHeroService(unknownRepo,async item=>{unknownCalls++;return{kind:item.kind,tmdbId:500,year,genres:[]}});
await enriched.prepare(model(active),storage,year,new AbortController().signal);assert.equal(unknownCalls,10,'unknown year enriched until quota reached');
assert.equal((await enriched.options(year)).length,10);
active='unknown-drama';movies=movies.map(v=>({...v,categoryIds:[]}));series=series.map(v=>({...v,categoryIds:[]}));
const legacy=new HomeHeroService(new MemoryHomeHeroRepository(),async item=>({kind:item.kind,tmdbId:700,year,genres:[]}));
await legacy.prepare(model(active),storage,year,new AbortController().signal);assert.equal((await legacy.options(year)).length,10,'unknown non-release years probed only after release-first scan');
const tiny=new CatalogReadModel({...model('tiny').catalog,movies:[row('movie',1)],series:[]});
assert.equal(currentYearHeroItems(tiny,year).length,1,'missing quota cannot manufacture titles');
const bounded=new MemoryHomeHeroRepository(4);await bounded.writeMany([...repo.records.values()].slice(0,10));assert.equal(bounded.records.size,4);
console.log('PASS_TMBD_YEAR_ENRICHMENT_QUOTA_AND_BOUNDED_FIRST_FOLD_FALLBACK');

assert.equal(isPhoneHeroProfile('Android Mobile',true,900),true);
assert.equal(isPhoneHeroProfile('Android SM-X610',false,500),false);
assert.equal(isPhoneHeroProfile('Android AFTSSS',false,960),false);
assert.equal(isPhoneHeroProfile('iPad',true,500),false);
assert.equal(isPhoneHeroProfile('iPhone',true,390),true);
const images={posters:[{file_path:'/standard.jpg',width:600,height:900,aspect_ratio:2/3,iso_639_1:'pt'},
 {file_path:'/alternate.jpg',width:600,height:900,aspect_ratio:2/3,iso_639_1:null},
 {file_path:'/landscape.jpg',width:1200,height:600,aspect_ratio:2}, {file_path:'//evil',width:600,height:900,aspect_ratio:2/3}]};
const posters=tmdbHeroPosters(images);assert.equal(posters.length,2);
const metadata={kind:'movie',tmdbId:1,genres:[],posterUri:'https://image.tmdb.org/t/p/w342/standard.jpg',heroPosterUris:posters};
assert.equal(chooseHeroPoster(metadata,'https://image.tmdb.org/t/p/original/standard.jpg'),'https://image.tmdb.org/t/p/w780/alternate.jpg');
assert.equal(chooseHeroPoster(metadata,undefined,new Set(['https://image.tmdb.org/t/p/w780/alternate.jpg'])),posters[0]);
assert.equal(chooseHeroPoster({...metadata,heroPosterUris:[]}),metadata.posterUri);
console.log('PASS_PHONE_ONLY_DISTINCT_VERTICAL_VARIANT_AND_IMAGE_FAILURE_FALLBACK');

let persisted='';const requests=[];
const tmdb=new TmdbMetadataService({credential:()=> 'synthetic-token',storage:{getItem:()=>null,setItem:(_k,v)=>persisted=v},fetchImpl:async input=>{
 const url=new URL(input);requests.push(url);return new Response(JSON.stringify({id:1,release_date:`${year}-01-01`,poster_path:'/standard.jpg',images}),{status:200});}});
await tmdb.resolve({kind:'movie',title:'Public fixture',tmdbId:1});
assert.equal(requests[0].searchParams.get('append_to_response'),'images');assert.equal(requests[0].searchParams.get('include_image_language'),'pt,en,null');
await new Promise(r=>setTimeout(r,300));assert.equal(JSON.parse(persisted).version,2);assert.ok(!persisted.includes('synthetic-token'));
const restarted=new TmdbMetadataService({credential:()=>'',storage:{getItem:()=>persisted,setItem(){} }});
assert.equal(chooseHeroPoster(await restarted.resolve({kind:'movie',title:'Public fixture',tmdbId:1})),posters[1]);
const obsolete=new TmdbMetadataService({credential:()=>'',storage:{getItem:()=>persisted.replace('"version":2','"version":1'),setItem(){}}});
assert.equal(obsolete.peek({kind:'movie',title:'Public fixture',tmdbId:1}),null);
console.log('PASS_TMDB_IMAGES_ONE_REQUEST_NEW_CACHE_RESTART_AND_OLD_CACHE_INVALIDATION');

// Real hook + carousel, before any async effects: no identified current year.
const require = createRequire(import.meta.url), compiled = new Map();
let mockMetadata = null;
function loadUi(relative) {
 const source = readFileSync(new URL(relative, import.meta.url), 'utf8');
 const code = ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText;
 const mod={exports:{}};
 new Function('require','module','exports',code)((name)=>{
  if(name.endsWith('home-hero.service.ts'))return homeHeroService;
  if(name.endsWith('useSeriesHighlights.ts'))return{useSeriesHighlights:()=>[]};
  if(name.endsWith('NewContentProvider.tsx'))return{useContentBadge:()=>undefined};
  if(name.endsWith('DetailTrailer.tsx'))return{DetailTrailer:()=>null};
  if(name.endsWith('SeriesPersonalActions.tsx'))return{SeriesPersonalActions:()=>null};
  if(name.endsWith('SeriesDetailSections.tsx'))return loadUi('../src/ui/components/SeriesDetailSections.tsx');
  if(name.endsWith('watch-history.ts'))return{watchFingerprint:()=> 'synthetic-ssr-fingerprint',watchHistory:{list:()=>[],savedPosition:()=>0,subscribe:()=>()=>{},syncNativeProgress:async()=>{}}};
  if(name.endsWith('tmdb-metadata.service.ts'))return tmdbModule;
  if(name.endsWith('useArtworkMetadata.ts'))return{useArtworkMetadata:()=>mockMetadata};
  if(name.endsWith('useCachedArtwork.ts'))return{useCachedArtwork:uri=>({src:uri,handleCacheError:()=>false})};
  if(name.endsWith('useImmersiveArtwork.ts'))return{useImmersiveArtwork:()=>undefined};
  if(name.endsWith('CastButton.tsx'))return{CastButton:()=>null};
  if(name.endsWith('PhoneSeriesDetail.tsx'))return{PhoneSeriesDetail:()=>null};
    if(name.endsWith('useHeroLayout.ts'))return {useHeroLayout:()=>false};
    if(name.endsWith('useHeroPlayback.ts'))return {useHeroPlayback:()=>({onPlay(){},playbackBusy:false,playbackMessage:null})};
  if(name.endsWith('usePhoneLayout.ts'))return{usePhoneLayout:()=>false};
  if(name.endsWith('useDevicePresentation.ts'))return{useDevicePresentation:()=>null};
  if(name.endsWith('device-presentation.ts'))return{isTelevisionPresentation:()=>false};
  if(name.endsWith('useDetailInitialFocus.ts'))return{useDetailInitialFocus:()=>{}};
  if(name.endsWith('useHeroArtwork.ts'))return{useHeroArtwork:()=>({eligible:[],pending:true,revision:0,reject(){}})};
  if(name.endsWith('CategoryHero.tsx'))return loadUi('../src/ui/components/CategoryHero.tsx');
  if(name.endsWith('RelatedTitles.tsx'))return{RelatedTitles:()=>null};
  if(name.endsWith('RecentTitles.tsx'))return{RecentTitles:()=>null};
  if(name.endsWith('catalog-selectors.ts'))return catalogSelectors;
  if(name.endsWith('playback.service.ts'))return{defaultPlaybackService:{}};
  if(name.endsWith('Hero.tsx'))return loadUi('../src/ui/components/Hero.tsx');
  if(name.endsWith('Artwork.tsx'))return{Artwork:()=>React.createElement('div',{'data-backdrop':true})};
  return require(name);
 },mod,mod.exports);compiled.set(relative,mod.exports);return mod.exports;
}
const {useHomeHero}=loadUi('../src/ui/hooks/useHomeHero.ts');
const {HomeHero}=loadUi('../src/ui/components/HomeHero.tsx');
const noYears=model('no-years',Array.from({length:7},(_,i)=>({...row('movie','missing-'+i),title:'Source movie '+i,year:undefined})),Array.from({length:7},(_,i)=>({...row('series','missing-'+i),title:'Source series '+i,year:undefined})));
let firstOptions;
function FirstHome(){const hero=useHomeHero(noYears,{});firstOptions=hero.options;return React.createElement(HomeHero,{...hero,onSelect(){}})}
assert.ok(renderToStaticMarkup(React.createElement(FirstHome)).includes('hero-banner'),'Home must render its mixed hero immediately without current-year metadata');
assert.ok(firstOptions.some(o=>o.item.kind==='movie')&&firstOptions.some(o=>o.item.kind==='series'));
assert.ok(firstOptions.every(o=>!o.item.yearFormatted),'missing year must not be fabricated');
console.log('PASS_HOME_REAL_HOOK_AND_CAROUSEL_VISIBLE_WITH_NO_YEARS_BEFORE_INDEX');

const pastMovies=Array.from({length:120},(_,i)=>row('movie','past-'+i,i>=110?year-1:year-10));
const pastSeries=Array.from({length:75},(_,i)=>row('series','past-'+i,i>=65?year-2:year-12));
const pastModel=model('past-only',pastMovies,pastSeries);
let pastReads=0;
const pastStorage={
 async readActiveManifest(){return{snapshotId:'past-only',metadata:{sourceId:'synthetic-past'},segments:[{kind:'movies',fileName:'movies_1.json'},{kind:'series',fileName:'series_1.json'}]}},
 async readActivePointer(){return{snapshotId:'past-only'}},
 async readActiveSegment(file){pastReads++;return JSON.stringify(file.includes('movies')?pastMovies:pastSeries)}
};
const pastRepo=new MemoryHomeHeroRepository(2000),pastService=new HomeHeroService(pastRepo,async()=>null);
await pastService.prepare(pastModel,pastStorage,year,new AbortController().signal);
const pastOptions=await pastService.options(year);
assert.equal(pastOptions.length,10);
assert.equal(pastOptions.filter(o=>o.item.kind==='movie'&&Number(o.item.yearFormatted)===year-1).length,5,'latest movies must be found beyond first-fold');
assert.equal(pastOptions.filter(o=>o.item.kind==='series'&&Number(o.item.yearFormatted)===year-2).length,5);
assert.ok(pastOptions.every(o=>!o.fresh));
for(const kind of ['movie','series'])assert.equal([...pastRepo.records.values()].filter(r=>r.kind===kind&&r.bucket===2&&r.item).length,50,'recent candidate pool bounded per type');
const originalGeneration=pastRepo.generation.bind(pastRepo);
pastRepo.generation=async(...args)=>({...await originalGeneration(...args),selectionVersion:undefined});
const readsBeforeMigration=pastReads;
await pastService.prepare(pastModel,pastStorage,year,new AbortController().signal);
assert.ok(pastReads>readsBeforeMigration,'legacy committed generation must acquire recent pool');
assert.ok((await pastService.options(year)).every(o=>!o.fresh),'rebuild cannot turn existing content into fresh releases');
const immediatePast=homeHeroService.initialHomeHeroItems(new CatalogReadModel({...pastModel.catalog,movies:pastMovies.slice(-15),series:pastSeries.slice(-15)}),year);
assert.equal(immediatePast.filter(o=>o.kind==='movie'&&Number(o.yearFormatted)===year-1).length,5);
assert.equal(immediatePast.filter(o=>o.kind==='series'&&Number(o.yearFormatted)===year-2).length,5);
const combined=homeHeroService.completeHomeHeroOptions(pastOptions.slice(0,1),pastOptions);
assert.equal(combined.length,10);assert.equal(combined[0],pastOptions[0]);assert.equal(new Set(combined.map(o=>o.item.kind+':'+o.item.id)).size,10);
assert.equal(homeHeroService.completeHomeHeroOptions([],firstOptions),firstOptions,'empty index keeps immediate mixed selection');
console.log('PASS_LATEST_AVAILABLE_BEYOND_FIRST_FOLD_BOUNDED_POOL_MIGRATION_AND_NO_DUPLICATE');

mockMetadata={kind:'movie',tmdbId:1,year:year-1,genres:['TMDB genre'],overview:'TMDB synopsis',durationFormatted:'2h',posterUri:'https://image.tmdb.org/t/p/w342/standard.jpg',heroPosterUris:posters};
const {Hero}=loadUi('../src/ui/components/Hero.tsx');
const phoneHtml=renderToStaticMarkup(React.createElement(Hero,{item:{id:'local-film',kind:'movie',title:'Local film',yearFormatted:'2001',overviewSnippet:'Source synopsis',genreLabels:['Source genre'],categoryLabels:[],durationFormatted:'1h'},mobilePoster:true,onSelect(){}}));
assert.ok(phoneHtml.includes('hero-banner--vertical')&&phoneHtml.includes('alternate.jpg'));
assert.ok(phoneHtml.includes('TMDB synopsis')&&phoneHtml.includes('TMDB genre')&&phoneHtml.includes(String(year-1))&&phoneHtml.includes('2h'));
assert.ok(!phoneHtml.includes('Source synopsis')&&!phoneHtml.includes('Source genre'));
mockMetadata=null;
console.log('PASS_PHONE_VERTICAL_ALTERNATIVE_PREFERS_TMDB_METADATA');

const episodeModel=new CatalogReadModel({...noYears.catalog,series:[{...row('series','list'),seasonIds:['season-list']}],seasons:[{id:'season-list',seriesId:'series-list',seasonNumber:1,title:'Season 1',episodeIds:['ep-1','ep-2']}],episodes:[1,2].map(n=>({id:'ep-'+n,seriesId:'series-list',seasonId:'season-list',episodeNumber:n,title:'Episode '+n,durationSeconds:1800,thumbnailUri:'https://source.synthetic.invalid/episode-'+n+'.jpg',artworkIds:[],streamIds:[]}))});
const {SeriesDetailPage}=loadUi('../src/ui/pages/SeriesDetailPage.tsx');
const episodesHtml=renderToStaticMarkup(React.createElement(SeriesDetailPage,{seriesId:'series-list',readModel:episodeModel,onBack(){}}));
const listHtml=episodesHtml.match(/<ul class="episodes-list"[\s\S]*?<\/ul>/)?.[0];
assert.ok(listHtml);assert.equal((listHtml.match(/class="episode-card"/g)||[]).length,2);
assert.ok(!listHtml.includes('<img')&&!listHtml.includes('episode-thumb')&&!listHtml.includes('data-backdrop'));
assert.equal((listHtml.match(/btn-episode-play/g)||[]).length,2);assert.ok(listHtml.includes('Episode 1')&&listHtml.includes('Episode 2'));
console.log('PASS_SERIES_EPISODES_SEMANTIC_LIST_WITHOUT_ARTWORK_AND_WITH_PLAY_BUTTONS');
console.log('PASS_C11_HOME_HERO_CURRENT_YEAR');
