import assert from 'node:assert/strict';
import {TmdbMetadataService,normalizeArtworkIdentity,artworkIdentityKey,artworkCategoryContext} from '../src/artwork/tmdb-metadata.service.ts';
import {CategoryPreviewIndex} from '../src/catalog/category-preview-index.ts';
import {CatalogReadModel} from '../src/catalog/catalog-read-model.ts';

for(const suffix of ['[L]','(L)'])for(const year of ['', ' (2020)', ' 2020']){
 const input={kind:'series',title:'Synthetic Fixture '+suffix+year};
 const normalized=normalizeArtworkIdentity(input);
 assert.equal(normalized.title,'Synthetic Fixture');assert.equal(normalized.year,year?2020:undefined);
 assert.equal(input.title,'Synthetic Fixture '+suffix+year,'display/source title is immutable');
}
for(const title of ['The L Word','L','Synthetic L','Synthetic (L) Extended','Synthetic [L] Extended']){
 assert.match(normalizeArtworkIdentity({kind:'series',title}).title,/(?:\bL\b|^L$)/,'genuine/internal L must survive');
}
console.log('PASS_NARROW_SUBTITLE_SUFFIX_WITH_YEAR_AND_GENUINE_LETTER_NEGATIVES');

const aired={id:101,name:'Synthetic Fixture',original_name:'Synthetic Fixture',first_air_date:'2020-01-01',status:'Ended',last_episode_to_air:{id:1},poster_path:'/official101.jpg',genres:[{name:'Drama'}],overview:'Verified synthetic overview',networks:[{name:'One network'}]};
const planned={...aired,id:102,first_air_date:'',status:'Planned',last_episode_to_air:null,poster_path:null};
function fixture(candidates=[aired,planned],options={}){
 const requests=[];
 const service=new TmdbMetadataService({credential:()=> 'synthetic-public-fixture',...options,fetchImpl:async value=>{
  const url=new URL(value);assert.equal(url.origin,'https://api.themoviedb.org');requests.push(url.pathname);
  return {ok:true,status:200,json:async()=>url.pathname.startsWith('/3/search/')?{results:candidates}:candidates.find(r=>String(r.id)===url.pathname.split('/').at(-1))||{}};
 }});return {service,requests};
}
const identity={kind:'series',title:'Synthetic Fixture [L]',...artworkCategoryContext(['Legendadas'],true)};
assert.equal(identity.hasEpisodes,true);assert.equal(identity.network,undefined);
let f=fixture();assert.equal((await f.service.resolve(identity))?.tmdbId,101);assert.equal(f.requests.length,3);
assert.equal(await fixture().service.resolve({...identity,hasEpisodes:undefined}),null,'absence of episode proof retains ambiguity');
assert.equal(await fixture([aired,{...planned,last_episode_to_air:undefined}]).service.resolve(identity),null,'unknown availability is not unaired proof');
assert.equal(await fixture([aired,{...planned,first_air_date:'2020-01-01',status:'Ended'}]).service.resolve(identity),null,'two aired homonyms stay ambiguous');
assert.equal(await fixture([planned]).service.resolve(identity),null,'unique confirmed planned work cannot explain aired source episodes');
assert.equal(await fixture().service.resolve({...identity,year:1990}),null,'wrong year stays rejected');
assert.equal(await fixture().service.resolve({...identity,posterPath:'/unrelated.jpg'}),null,'episode context does not bypass source-image identity');
assert.notEqual(artworkIdentityKey({...identity,posterPath:'/one.jpg'}),artworkIdentityKey({...identity,posterPath:'/two.jpg'}),'unqualified source hints remain distinct');
assert.equal(await fixture().service.resolve({...identity,network:'Netflix'}),null,'wrong required network remains rejected');
f=fixture(Array.from({length:7},(_,n)=>({...aired,id:200+n})));assert.equal(await f.service.resolve(identity),null);assert.equal(f.requests.length,1,'bounded six-detail disambiguation');
console.log('PASS_SUBTITLED_EPISODIC_MATCH_WITH_REAL_HOMONYM_AVAILABILITY_NETWORK_YEAR_SOURCE_AND_QUERY_BOUNDS');

const oldKey=artworkIdentityKey({...identity,hasEpisodes:undefined}),now=()=>1700000000000;
f=fixture(undefined,{now,storage:{getItem:()=>JSON.stringify({version:2,entries:[[oldKey,{expires:now()+60000,value:null}]]}),setItem(){}}});
assert.notEqual(artworkIdentityKey(identity),oldKey);assert.equal((await f.service.resolve(identity))?.tmdbId,101);
const movie=await fixture([{...aired,title:aired.name,original_title:aired.name,release_date:'2020-01-01'}]).service.resolve({kind:'movie',title:'Synthetic Fixture [L]'});
assert.equal(movie?.kind,'movie');
console.log('PASS_NEW_EPISODIC_KEY_ESCAPES_OLD_MISS_WITHOUT_CHANGING_KIND');

const records=[true,false].map((has,n)=>({id:'series-'+n,title:'Synthetic Fixture'+(n?'':' [L]'),categoryIds:['safe'],genreIds:[],artworkIds:[],seasonIds:has?['season-1']:[],posterUri:'https://image.tmdb.org/t/p/original/public.jpg',sourcePassword:'synthetic-private-marker',streamIds:['must-not-cache']}));
const catalog={metadata:{snapshotId:'preview-identity'},categories:[{id:'safe',name:'Legendadas'}],genres:[],movies:[],series:records,seasons:[],episodes:[],artworks:[],streams:[]};
const model=new CatalogReadModel(catalog),saved=new Map();let reads=0;
const storage={readActiveManifest:async()=>({snapshotId:'preview-identity',segments:[{kind:'series',fileName:'series_1.json'}]}),readActiveSegment:async()=>{reads++;return JSON.stringify(records);}};
const repository={read:async kind=>saved.get(kind),write:async(kind,value)=>saved.set(kind,structuredClone(value))};
const cold=new CategoryPreviewIndex(model,storage,repository),rows=await cold.load('series','safe');await cold.prepare('series');
assert.deepEqual(rows.map(r=>r.hasEpisodes),[true,false]);assert.equal(saved.get('series').version,3);assert.equal(reads,1);
assert.ok(!JSON.stringify(saved.get('series')).includes('synthetic-private-marker'));assert.ok(!JSON.stringify(saved.get('series')).includes('must-not-cache'));
const warm=new CategoryPreviewIndex(model,storage,repository);assert.deepEqual((await warm.load('series','safe')).map(r=>r.hasEpisodes),[true,false]);assert.equal(reads,1,'new warm cache requires no segment I/O');
for(const invalid of [
 {...saved.get('series'),version:2,rows:[['safe',rows.map(({hasEpisodes,...row})=>row)]]},
 {...saved.get('series'),rows:[['safe',rows.map(({hasEpisodes,...row})=>row)]]},
 {...saved.get('series'),rows:[['safe',rows.map(row=>({...row,hasEpisodes:'true'}))]]},
]){
 const before=reads,index=new CategoryPreviewIndex(model,storage,{read:async()=>invalid,write:async()=>{}});
 assert.deepEqual((await index.load('series','safe')).map(r=>r.hasEpisodes),[true,false]);assert.equal(reads,before+1,'old or malformed preview is rebuilt from real local records');index.dispose();
}
const context=artworkCategoryContext(rows[0].categoryLabels,rows[0].hasEpisodes);
assert.equal((await fixture().service.resolve({kind:rows[0].kind,title:rows[0].title,...context}))?.tmdbId,101,'real cold preview reaches the real optional matcher');
const movieRow={...records[0],id:'movie-1',seasonIds:undefined};const movieModel=new CatalogReadModel({...catalog,series:[],movies:[movieRow]});
const movieSaved={version:2,snapshot:'preview-identity',rows:[['safe',[{id:'movie-1',kind:'movie',title:'Synthetic Movie',genreLabels:[],categoryLabels:['Legendadas']}]]]};
const movieIndex=new CategoryPreviewIndex(movieModel,{readActiveManifest:async()=>({snapshotId:'preview-identity',segments:[]}),readActiveSegment:async()=>{throw Error('MOVIE_WARM_MUST_NOT_READ');}},{read:async()=>movieSaved,write:async()=>{}});
assert.equal((await movieIndex.load('movies','safe'))[0].title,'Synthetic Movie');
cold.dispose();warm.dispose();movieIndex.dispose();
console.log('PASS_REAL_COLD_WARM_PREVIEW_MIGRATION_BOOLEAN_VALIDATION_MOVIE_COMPATIBILITY_AND_PRIVATE_FIELD_EXCLUSION');
console.log('TMDB_SUBTITLE_PREVIEW_RECOVERY=PASS');
