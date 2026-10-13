import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import ts from 'typescript';
import { CompactSearchEngineV2Pruned } from '../src/experiments/search-compact-v2-pruned/compact-search-v2-pruned-engine.ts';
import { CompactSearchEngineV2 } from '../src/experiments/search-compact-v2/compact-search-v2-engine.ts';
import { CompactSearchIndexV2Builder } from '../src/experiments/search-compact-v2/compact-search-v2-builder.ts';
import { serializeCompactIndexV2 } from '../src/experiments/search-compact-v2/compact-search-v2-serializer.ts';
import { TmdbMetadataService, selectTmdbMatch, artworkIdentityKey, tmdbPosterPath } from '../src/artwork/tmdb-metadata.service.ts';
import { CatalogReadModel } from '../src/catalog/catalog-read-model.ts';
import { selectRelatedTitles, loadRelatedTitles } from '../src/catalog/related-titles.service.ts';

const movie=(id,title,year=1999,genreIds=['action'],categoryIds=['films'])=>({id,title,year,genreIds,categoryIds,artworkIds:[],streamIds:[]});
const movies=['Matrix','Matrix Reloaded','Matrix Revolutions','Matrix Resurrections'].map((title,i)=>movie('m'+i,title,i?2003:1999));
movies.push(...Array.from({length:130},(_,i)=>movie('extra'+i,'Adventure Matrix '+i,2000+i%20)));
const series=[{...movie('s0','Matrix',2020),seasonIds:[]},{...movie('s1','Matrix Chronicles',2021),seasonIds:[]}];
const catalog={metadata:{schemaVersion:1,snapshotId:'synthetic-related',catalogVersion:'1',generatedAt:'2026-10-06',counts:{movies:movies.length,series:series.length,categories:1,genres:1,artworks:0,streams:0,seasons:0,episodes:0}},movies,series,categories:[{id:'films',name:'Films'}],genres:[{id:'action',name:'Action'}],artworks:[],streams:[],seasons:[],episodes:[]};
const binary=serializeCompactIndexV2(new CompactSearchIndexV2Builder().build(catalog,{generator:'test',deterministicGeneratedAt:'2026-10-06T00:00:00.000Z'})).buffer;
const engine=new CompactSearchEngineV2Pruned();engine.load(binary);
const reference=new CompactSearchEngineV2();reference.load(binary);
// Exhaustive scoring oracle: intentionally bypass the obsolete exact-only
// return in the historical reference, while retaining its scoring and order.
reference.lookupExactTitle=()=>new Uint32Array();
for(const query of ['matrix',' MATRIX ','Matrix r','Matrix Reloaded','Matrix Adventure 2','adventure','chronicles','Matrix 2003'])for(const filter of [undefined,{kind:'movie'},{kind:'series'},{year:2003}])for(const topK of [1,2,50]){
  const actual=engine.query(query,{topK,filter}).items,expected=reference.query(query,{topK,filter}).items;
  assert.deepEqual(actual.map(({id,score})=>({id,score})),expected.map(({id,score})=>({id,score})),query+' '+JSON.stringify({filter,topK}));
  assert.ok(actual.length<=topK);assert.equal(new Set(actual.map(x=>x.id)).size,actual.length);
}
const result=engine.query('Matrix',{filter:{kind:'movie'}}).items;
assert.equal(result[0].id,'m0');for(const id of ['m1','m2','m3'])assert.ok(result.some(x=>x.id===id));
console.log('PASS_MATRIX_VARIATIONS_EXACT_FIRST_FILTERS_TOP50_EXHAUSTIVE_SCORE_PARITY');
if(process.argv.includes('--prove-baseline')){
  const file='src/experiments/search-compact-v2-pruned/compact-search-v2-pruned-engine.ts';
  const source=execFileSync('git',['show','HEAD:'+file],{encoding:'utf8'});
  const frozen=JSON.parse(readFileSync('tmp/c11-home-hero-visible-20261006/baseline.json','utf8'));
  assert.equal(createHash('sha256').update(source).digest('hex'),frozen[file].hash);
  const mod={exports:{}},require=createRequire(new URL('../'+file,import.meta.url));
  new Function('require','module','exports',ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(require,mod,mod.exports);
  const old=new mod.exports.CompactSearchEngineV2Pruned();old.load(binary);
  assert.deepEqual(old.query('Matrix',{filter:{kind:'movie'}}).items.map(x=>x.id),['m0']);
  console.log('PASS_FROZEN_PRODUCTION_EXACT_ONLY_REGRESSION_REPRODUCED');
}
const identity={kind:'movie',title:'Matrix'};
const homonyms=[{id:603,title:'Matrix',release_date:'1999-03-31',vote_count:28886},{id:411948,title:'Matrix',release_date:'1971-05-18',vote_count:3},{id:373223,title:'Matrix',release_date:'1973-09-06',vote_count:22}];
assert.equal(selectTmdbMatch(identity,homonyms)?.id,603);
assert.equal(selectTmdbMatch(identity,[{...homonyms[0],vote_count:1500},{...homonyms[1],vote_count:1000}]),null);
assert.equal(selectTmdbMatch({...identity,year:2005},homonyms),null);
assert.equal(selectTmdbMatch({kind:'movie',title:'Different Matrix Story'},homonyms),null);
assert.equal(selectTmdbMatch({...identity,posterPath:'/unrelated.jpg'},homonyms),null);
assert.equal(tmdbPosterPath('https://image.tmdb.org/t/p/w600/cover.jpg?ignored=1'),'/cover.jpg');
assert.equal(tmdbPosterPath('https://source.synthetic.invalid/private.jpg?token=secret'),undefined);
assert.equal(tmdbPosterPath('https://user:secret@image.tmdb.org/t/p/w600/cover.jpg'),undefined);
const details=id=>({id,title:'Matrix',release_date:'1999-03-31',poster_path:'/cover.jpg',backdrop_path:'/horizontal.jpg',overview:'Public synopsis',runtime:136,genres:[{name:'Action'}],images:{posters:[{file_path:id===603?'/alternate.jpg':'/other.jpg'}]}});
let calls=[],persisted;
const service=new TmdbMetadataService({credential:()=> 'synthetic-only',storage:{getItem:()=>JSON.stringify({version:2,entries:[['movie:matrix:',{expires:Date.now()+60000,value:null}]]}),setItem:(key,value)=>{persisted=value}},fetchImpl:async raw=>{const url=new URL(raw);calls.push(url.pathname);return new Response(JSON.stringify(url.pathname.includes('/search/')?{results:homonyms}:details(Number(url.pathname.split('/').at(-1)))));}});
const metadata=await service.resolve(identity,'high');assert.equal(metadata.tmdbId,603);assert.ok(metadata.overview&&metadata.backdropUri&&metadata.year===1999);
assert.equal(calls.length,2);await service.resolve(identity);assert.equal(calls.length,2);
const hinted=new TmdbMetadataService({credential:()=> 'synthetic-only',fetchImpl:async raw=>{const url=new URL(raw);return new Response(JSON.stringify(url.pathname.includes('/search/')?{results:homonyms}:details(Number(url.pathname.split('/').at(-1)))));}});
assert.equal((await hinted.resolve({...identity,posterPath:'/alternate.jpg'})).tmdbId,603);
assert.notEqual(artworkIdentityKey(identity),artworkIdentityKey({...identity,posterPath:'/alternate.jpg'}));
await new Promise(resolve=>setTimeout(resolve,280));assert.ok(!persisted.includes('synthetic-only')&&!persisted.includes('secret'));
console.log('PASS_MATRIX_METADATA_HOMONYM_CONFIDENCE_POSTER_VARIANT_OLD_MISS_BYPASSED');
const current=movies[0],sameGenre=movie('genre','Shared genre',2020,['action'],['other']),sameCategory=movie('category','Shared category',2021,['other'],['films']),unrelated=movie('none','Unrelated',2022,['other'],['other']);
assert.deepEqual(selectRelatedTitles(current,[current,sameCategory,unrelated,sameGenre,sameGenre]).map(x=>x.id),['genre','category']);
const small=new CatalogReadModel({...catalog,movies:[current,sameCategory],series:[]});
let snapshot='synthetic-related',reads=0,forbidden=0;
const storage={async readActiveManifest(){return{snapshotId:snapshot,segments:[{kind:'series',fileName:'series_1.json'},{kind:'movies',fileName:'movies_1.json'}]}},async readActivePointer(){return{snapshotId:snapshot}},async readActiveSegment(file){reads++;if(file.includes('series'))forbidden++;return JSON.stringify([current,sameGenre,unrelated,sameGenre]);}};
const related=await loadRelatedTitles(small,'movie',current,storage,new AbortController().signal);
assert.deepEqual(related.map(x=>x.id),['genre','category']);assert.equal(reads,1);assert.equal(forbidden,0);assert.equal(small.moviesById.has('genre'),false,'recommendations do not mutate read model');
snapshot='another';await assert.rejects(loadRelatedTitles(small,'movie',current,storage,new AbortController().signal),/SNAPSHOT/);
const cancelled=new AbortController();cancelled.abort();await assert.rejects(loadRelatedTitles(small,'movie',current,storage,cancelled.signal),/CANCELLED/);
assert.equal(selectRelatedTitles(current,Array.from({length:60},(_,i)=>movie('related'+i,'Related '+i))).length,20);
console.log('PASS_RELATED_GENRE_CATEGORY_SOURCE_ONLY_KIND_LIMIT20_NO_CURRENT_DUPLICATES_CANCEL_SNAPSHOT');
