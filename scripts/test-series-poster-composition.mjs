import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {SeriesPosterClaims} from '../src/artwork/series-poster-claims.ts';
const registry=new SeriesPosterClaims(),updates=[];
const a=registry.watch('synthetic-uri','series:one',value=>updates.push(['one',value]));
const same=registry.watch('synthetic-uri','series:one',value=>updates.push(['same',value]));
assert.ok(updates.every(([,shared])=>!shared));
const b=registry.watch('synthetic-uri','series:two',value=>updates.push(['two',value]));
assert.ok(updates.every(([,shared])=>!shared));
const c=registry.watch('synthetic-uri','series:three',value=>updates.push(['three',value]));
assert.ok(['one','same','two','three'].every(key=>updates.some(([k,v])=>k===key&&v)));
[a,same,b,c].forEach(stop=>stop());let remembered=false;registry.watch('synthetic-uri','series:one',shared=>remembered=shared)();assert.equal(remembered,true);
for(let i=0;i<800;i++)registry.watch('synthetic-'+i,'one',()=>{})();assert.equal(registry.size,512);
const occupied=new SeriesPosterClaims();const removers=Array.from({length:512},(_,i)=>occupied.watch('active-'+i,'one',()=>{}));occupied.watch('over-limit','one',()=>{})();assert.equal(occupied.size,512);removers.forEach(stop=>stop());
console.log('PASS_GENERIC_ARTWORK_CLAIMS_DEDUP_SUBSCRIPTION_CLEANUP_STICKY_FLAG_AND_RAM512');
for(const [file,marker] of [['scripts/test-c11-source-first-tmdb-artwork.mjs','PASS_C11_SOURCE_FIRST_TMDB_ARTWORK'],['scripts/test-c11-artwork-visible-recovery.mjs','PASS_SHARED_GENERIC_PORTRAIT_LOOKS_UP_TV_TITLE_WITHOUT_REUSING_WRONG_SOURCE'],['scripts/test-c11-tmdb-alias-recovery.mjs','PASS_ALIAS_LOOKUP_SHARED_DEDUP_AND_CONCURRENCY_TWO']]){
 const result=spawnSync(process.execPath,[file],{encoding:'utf8',timeout:120000});assert.equal(result.status,0,result.stdout+result.stderr);assert.ok(result.stdout.includes(marker),file);console.log('SUITE_PASS '+file);
}
console.log('SERIES_POSTER_COMPOSITION=PASS');
