import assert from 'node:assert/strict';
import {TmdbMetadataService,artworkIdentityKey} from '../src/artwork/tmdb-metadata.service.ts';

const identity={kind:'movie',title:'Soulm8te (2026)',posterPath:'/obsolete-public-poster.jpg'};
const candidate={id:1307118,title:'Soulm8te',original_title:'Soulm8te',release_date:'2026-07-31'};
const details={...candidate,poster_path:'/current.jpg',backdrop_path:'/wide.jpg',overview:'Public fixture synopsis',runtime:101,genres:[{name:'Horror'}],images:{posters:[{file_path:'/current.jpg',width:600,height:900,aspect_ratio:2/3}]}};
const now=()=>1_700_000_000_000;
function fixture({candidates=[candidate],detail=id=>({...details,id}),storage,fetchFailure}={}){
 const requests=[];
 const service=new TmdbMetadataService({credential:()=> 'synthetic',storage:storage||{getItem:()=>null,setItem(){}},now,
  fetchImpl:async input=>{const path=new URL(input).pathname;requests.push(path);if(fetchFailure)throw Error('synthetic transient');return{ok:true,status:200,json:async()=>path.includes('/search/')?{results:candidates}:detail(Number(path.split('/').at(-1))) };}});
 return{service,requests};
}
const stale=fixture();
const recovered=await stale.service.resolve(identity,'high');
assert.equal(recovered?.tmdbId,1307118,'obsolete filename must not block one exact title/year');
assert.ok(recovered.overview&&recovered.posterUri&&recovered.backdropUri);
assert.equal(stale.requests.length,2,'reuse fetched details; no broad fallback search');
await stale.service.resolve(identity);assert.equal(stale.requests.length,2,'cache and dedup remain');
console.log('PASS_STALE_POSTER_EXACT_TITLE_YEAR_METADATA_RECOVERY');

for(const [label,changed,options] of [
 ['missing year',{...identity,title:'Soulm8te'},{}],
 ['near year',{...identity,title:'Soulm8te (2025)'},{}],
 ['weak title',{...identity,title:'Soulm8te Other (2026)'},{}],
 ['homonyms',identity,{candidates:[candidate,{...candidate,id:2}]}],
 ['details wrong ID',identity,{detail:()=>({...details,id:2})}],
 ['details changed year',identity,{detail:()=>({...details,release_date:'2025-07-31'})}],
 ['details changed name',identity,{detail:()=>({...details,title:'Different',original_title:'Different'})}],
 ['transient',identity,{fetchFailure:true}],
 ])assert.equal(await fixture(options).service.resolve(changed),null,label);
console.log('PASS_NO_YEAR_NEAR_YEAR_WEAK_TITLE_HOMONYMS_INCONSISTENT_DETAILS_FAIL_CLOSED');

const variant=fixture({detail:id=>({...details,id,images:{posters:[{file_path:identity.posterPath}]}})});
assert.equal((await variant.service.resolve({...identity,title:'Soulm8te'}))?.tmdbId,1307118,'poster-confirmed identity still works without year');
const series={kind:'series',title:'Public Series (2026)',posterPath:identity.posterPath};
const tvCandidate={id:321,name:'Public Series',original_name:'Public Series',first_air_date:'2026-01-01'};
const tv=fixture({candidates:[tvCandidate],detail:id=>({...tvCandidate,id,poster_path:'/tv.jpg',backdrop_path:'/tv-wide.jpg'})});
assert.equal((await tv.service.resolve(series))?.kind,'series');assert.ok(tv.requests.every(path=>path.includes('/tv')));
assert.equal(artworkIdentityKey({...identity,tmdbId:1307118}),'movie:1307118:2026');
console.log('PASS_FILENAME_PRIORITY_KIND_ISOLATION_AND_EXPLICIT_ID_KEY');

const newKey=artworkIdentityKey(identity),oldKey=newKey.replace(':match6',':match4');assert.notEqual(newKey,oldKey);
const storage=value=>({getItem:()=>JSON.stringify({version:2,entries:[[oldKey,{expires:now()+60000,value}]]}),setItem(){}});
const oldNegative=fixture({storage:storage(null)});assert.equal((await oldNegative.service.resolve(identity))?.tmdbId,1307118);assert.equal(oldNegative.requests.length,2);
const oldPositive=fixture({storage:storage(recovered)});assert.equal(oldPositive.service.peek(identity)?.tmdbId,1307118);assert.equal((await oldPositive.service.resolve(identity))?.tmdbId,1307118);assert.equal(oldPositive.requests.length,0);
console.log('PASS_MATCH5_NEGATIVE_RECOVERY_WITH_OLD_POSITIVE_OFFLINE_REUSE');
