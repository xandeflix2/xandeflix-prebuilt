import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import React from 'react';
import * as metadata from '../src/artwork/tmdb-metadata.service.ts';
import {heroArtworkIdentity} from '../src/artwork/hero-artwork.service.ts';

const {TmdbMetadataService,selectTmdbMatch,artworkIdentityKey}=metadata;
const series=(id,name,origin='TR',year=2020)=>({id,name,original_name:name,origin_country:[origin],first_air_date:year+'-01-01',poster_path:'/poster-'+id+'.jpg'});
assert.equal(selectTmdbMatch({kind:'series',title:'Med Cezir Vidas Alheias'},[series(101,'Medcezir: Vidas Alheias')])?.id,101);
assert.equal(selectTmdbMatch({kind:'series',title:'AB C'},[series(101,'A BC')]),null,'short initials never folded');
assert.equal(selectTmdbMatch({kind:'series',title:'Compact Name 2'},[series(101,'Compactname 3')]),null,'all digits retained');
assert.equal(selectTmdbMatch({kind:'series',title:'Compact Name'},[series(101,'Compactname'),series(102,'Compact Name')]),null,'compact collisions still ambiguous');
assert.equal(selectTmdbMatch({kind:'series',title:'Med Cezir Vidas Alheias',year:1990},[series(101,'Medcezir: Vidas Alheias')]),null);
console.log('PASS_FULL_TITLE_BOUNDARY_FOLD_WITH_LENGTH_DIGIT_YEAR_AND_COLLISION_GUARDS');

function fixture({candidates=[series(101,'Family Fixture','BR'),series(102,'Family Fixture','TR')],details={},storage,now=()=>1700000000000,status=200,wait}={}){
 const requests=[];let active=0,peak=0;
 const service=new TmdbMetadataService({credential:()=> 'synthetic-public-test',storage,now,fetchImpl:async value=>{
  const u=new URL(value);assert.equal(u.origin,'https://api.themoviedb.org');assert.equal(u.searchParams.get('include_adult')||'false','false');requests.push(u.pathname);peak=Math.max(peak,++active);
  try{if(wait)await wait();let data;if(u.pathname.startsWith('/3/search/'))data={results:candidates};else if(u.pathname.endsWith('/alternative_titles')){const id=Number(u.pathname.split('/').at(-2));data={id,results:[]};}else{const id=Number(u.pathname.split('/').at(-1));data=details[id]||{...candidates.find(c=>c.id===id),overview:'Official overview',genres:[{name:'Drama'}]};}return{ok:status===200,status,json:async()=>data};}finally{active--;}
 }});return{service,requests,peak:()=>peak};
}
const turkish={kind:'series',title:'Family Fixture',originCountry:'TR'};
let f=fixture();assert.equal((await f.service.resolve(turkish))?.tmdbId,102);
assert.deepEqual(f.requests,['/3/search/tv','/3/tv/102']);
assert.equal(await fixture().service.resolve({...turkish,originCountry:'JP'}),null);
assert.equal(await fixture().service.resolve({...turkish,originCountry:undefined}),null);
assert.equal(await fixture({candidates:[series(101,'Family Fixture'),series(102,'Family Fixture')]}).service.resolve(turkish),null);
assert.equal(await fixture({details:{102:{...series(102,'Family Fixture','BR')}}}).service.resolve(turkish),null,'details must reconfirm origin');
assert.equal(await fixture({details:{102:{...series(999,'Family Fixture','TR')}}}).service.resolve(turkish),null,'details ID mismatch');
assert.equal((await fixture().service.resolve({...turkish,posterPath:'/wrong-provider-image.jpg'}))?.tmdbId,102,'unique strong context can replace unrelated source artwork');
assert.equal(await fixture({candidates:[series(102,'Unrelated Family')]}).service.resolve(turkish),null,'country cannot rescue weak title');
console.log('PASS_ORIGIN_CONTEXT_UNIQUE_WORK_AND_WRONG_UNKNOWN_AMBIGUOUS_ID_TITLE_NEGATIVES');

const netflix={kind:'series',title:'Streamed Fixture',network:'Netflix',hasEpisodes:true};
const released={...series(201,'Streamed Fixture','GB',2014),networks:[{name:'Netflix'}],status:'Ended',last_episode_to_air:{id:44}};
const planned={...series(202,'Streamed Fixture','US',2026),first_air_date:'',networks:[{name:'Netflix'}],status:'Planned',last_episode_to_air:null};
f=fixture({candidates:[released,planned]});assert.equal((await f.service.resolve(netflix))?.tmdbId,201);assert.equal(f.requests.length,3);
for(const patch of [{hasEpisodes:undefined},{network:undefined,hasEpisodes:undefined},{network:'Netflix',hasEpisodes:false}])assert.equal(await fixture({candidates:[released,planned]}).service.resolve({...netflix,...patch}),null,'title without episode proof cannot exclude an unaired homonym');
assert.equal((await fixture({candidates:[released,planned]}).service.resolve({...netflix,network:undefined}))?.tmdbId,201,'declared episodes independently exclude a confirmed Planned/undated/not-aired homonym');
assert.equal(await fixture({candidates:[released,{...planned,first_air_date:'2026-01-01',status:'Returning Series'}]}).service.resolve(netflix),null,'two released homonyms remain ambiguous');
assert.equal(await fixture({candidates:[released,{...planned,last_episode_to_air:undefined}]}).service.resolve(netflix),null,'missing availability facts are not proof');
assert.equal(await fixture({candidates:[released,planned],details:{201:{...released,networks:[{name:'Another platform'}]}}}).service.resolve(netflix),null);
assert.equal(await fixture({candidates:[released,planned],details:{201:{...released,networks:undefined}}}).service.resolve(netflix),null);
assert.equal((await fixture({candidates:[released],details:{201:{...released,networks:[{name:'Another platform'}]}}}).service.resolve(netflix))?.tmdbId,201,'Netflix shelf also carries uniquely identified licensed works');
const many=fixture({candidates:Array.from({length:7},(_,i)=>({...released,id:210+i}))});assert.equal(await many.service.resolve(netflix),null);assert.equal(many.requests.length,1);
assert.equal(await fixture({candidates:[planned]}).service.resolve(netflix),null,'known planned work does not explain streamed episodes');
console.log('PASS_NETWORK_EPISODIC_PLANNED_EXCLUSION_WITH_AMBIGUITY_MISSING_FACTS_AND_SIX_DETAIL_BOUND');

assert.equal(typeof metadata.artworkCategoryContext,'function');
assert.deepEqual(metadata.artworkCategoryContext(['\u2666\ufe0f Novelas Turcas']),{originCountry:'TR'});
assert.deepEqual(metadata.artworkCategoryContext(['SERIES | NETFLIX'],true),{network:'Netflix',hasEpisodes:true});
assert.deepEqual(metadata.artworkCategoryContext(['Doramas','Legendadas','Drama']),{});
assert.deepEqual(metadata.artworkCategoryContext(['Novelas Turcas','Novelas Brasileiras']),{});
assert.notEqual(artworkIdentityKey(netflix),artworkIdentityKey({...netflix,network:undefined}));
assert.notEqual(artworkIdentityKey(turkish),artworkIdentityKey({...turkish,originCountry:'BR'}));
assert.equal(artworkIdentityKey({...turkish,tmdbId:102}),'series:102:','explicit ID key unchanged');
const now=()=>1700000000000;
const oldKey=artworkIdentityKey({kind:'series',title:'Family Fixture'}).replace(/:match\d+/,':match6');
const oldValue={kind:'series',tmdbId:101,posterUri:'https://image.tmdb.org/t/p/w342/old.jpg',genres:[]};
const storage=value=>({getItem:()=>JSON.stringify({version:2,entries:[[oldKey,{expires:now()+60000,value}]]}),setItem(){}});
f=fixture({now,storage:storage(oldValue)});assert.equal(f.service.peek({kind:'series',title:'Family Fixture'})?.tmdbId,101);assert.equal(f.service.peek(turkish),null);assert.equal((await f.service.resolve(turkish))?.tmdbId,102);
const compact=fixture({candidates:[series(101,'Medcezir: Vidas Alheias')],now,storage:{getItem:()=>JSON.stringify({version:2,entries:[['series:med cezir vidas alheias::match6',{expires:now()+60000,value:null}]]}),setItem(){}}});assert.equal((await compact.service.resolve({kind:'series',title:'Med Cezir Vidas Alheias'}))?.tmdbId,101);
console.log('PASS_CATEGORY_CONTEXT_BOUNDS_AND_MATCH7_CACHE_CONTEXT_ISOLATION_LEGACY_POSITIVE_AND_NEGATIVE_RECOVERY');

f=fixture({candidates:[{...released,title:released.name,release_date:'2014-01-01'}]});const movie=await f.service.resolve({kind:'movie',title:'Streamed Fixture'});assert.equal(movie?.kind,'movie');assert.equal(f.requests[0],'/3/search/movie');
f=fixture({wait:()=>new Promise(r=>setTimeout(r,2))});await Promise.all(Array.from({length:8},()=>f.service.resolve(turkish)));assert.equal(f.requests.length,2);assert.ok(f.peak()<=2);
for(const code of[401,403,429]){f=fixture({status:code});assert.equal(await f.service.resolve(turkish),null);const n=f.requests.length;await f.service.resolve(turkish);assert.equal(f.requests.length,n);}
f=fixture();assert.equal(await f.service.resolve({...turkish,title:'https://private.synthetic.invalid/secret'}),null);assert.equal(f.requests.length,0);
console.log('PASS_MOVIE_TV_ISOLATION_DEDUP_CONCURRENCY_AUTH_COOLDOWN_AND_PRIVATE_TITLE_BOUNDARY');

const load=(file,imports)=>{
 const mod={exports:{}};
 new Function('require','module','exports',ts.transpileModule(readFileSync(new URL('../'+file,import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React}}).outputText)(name=>{for(const[k,v]of Object.entries(imports))if(name.includes(k))return v;throw Error('Uncontrolled fixture dependency');},mod,mod.exports);
 return mod.exports;
};
const Artwork=()=>null;
const {MediaCard}=load('src/ui/components/MediaCard.tsx',{
 react:{...React,default:React},'tmdb-metadata':metadata,Artwork:{Artwork},'artwork-uri':{displayArtworkUri:v=>v},'image-load-queue':{loadImage:()=>Promise.resolve({ok:true})},
 NewContentProvider:{useContentBadge:()=>undefined},useCardGenres:{useCardGenres:()=>({ref(){},genres:[],visible:false})},useParentalControl:{useParentalControl:()=>({admin:false})},
 'parental-content':{canShowParentalItem:()=>true},useParentalClassification:{useParentalClassification(){}}
});
const vm={id:'synthetic',kind:'series',title:'Family Fixture',categoryLabels:['Novelas Turcas'],genreLabels:[],hasEpisodes:true};
const tree=MediaCard.type({item:vm,onClick(){}});
const findArtwork=node=>!node||typeof node!=='object'?undefined:node.type===Artwork?node.props.identity:React.Children.toArray(node.props?.children).map(findArtwork).find(Boolean);
assert.equal(findArtwork(tree)?.originCountry,'TR');
assert.equal(heroArtworkIdentity(vm).originCountry,'TR');
assert.equal(heroArtworkIdentity({...vm,categoryLabels:['Netflix']}).hasEpisodes,true);
assert.equal(heroArtworkIdentity({...vm,kind:'movie'}).originCountry,undefined);
let effect,cleanup,captured;const oldWindow=globalThis.window;
globalThis.window={addEventListener(){},removeEventListener(){}};
try{
 const hooks=load('src/ui/hooks/useArtworkMetadata.ts',{
  react:{useEffect:callback=>{effect=callback;},useState:initial=>[initial,()=>{}]},
  'tmdb-metadata':{artworkIdentityKey,tmdbMetadataService:{peek:()=>null,resolve:async identity=>{captured=identity;return{kind:'series',tmdbId:201,genres:[]};}}}
 });
 hooks.useArtworkMetadataState({...netflix,originCountry:'GB'},true,'high');cleanup=effect();await Promise.resolve();await Promise.resolve();
 assert.equal(captured.originCountry,'GB');assert.equal(captured.network,'Netflix');assert.equal(captured.hasEpisodes,true);
}finally{cleanup?.();globalThis.window=oldWindow;}
console.log('PASS_ACTUAL_CARD_HERO_AND_METADATA_HOOK_CONTEXT_PROPAGATION_WITH_CLEANUP');
console.log('TMDB_CONTEXT_IDENTITY=PASS');
