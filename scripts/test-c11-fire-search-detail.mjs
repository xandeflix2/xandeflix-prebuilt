import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {CanonicalItemResolver} from '../src/catalog/canonical-item-resolver.ts';
const path='src/catalog/canonical-item-resolver.ts';
const mod={exports:{}},require=createRequire(new URL('../'+path,import.meta.url));
if(process.argv.includes('--prove-baseline')){
 const source=execFileSync('git',['show','HEAD:'+path],{encoding:'utf8'});
 const baseline=JSON.parse(readFileSync('tmp/c11-phone-series-20261006/fire-baseline.json','utf8'));
 assert.equal(createHash('sha256').update(source).digest('hex'),baseline[path].hash);
 new Function('require','module','exports',ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(require,mod,mod.exports);
}
async function burst(Resolver){
 let active=0,peak=0,reads=0;
 const storage={readActiveManifest:async()=>({snapshotId:'synthetic',segments:[{kind:'movies',fileName:'movies_1.json'},{kind:'series',fileName:'series_1.json'}]}),readActiveSegment:async file=>{reads++;peak=Math.max(peak,++active);await new Promise(r=>setTimeout(r,8));active--;return JSON.stringify(Array.from({length:11},(_,i)=>({id:'item-'+i,title:'Synthetic',kind:file.includes('series')?'series':'movie'})));}};
 const resolver=new Resolver(storage,'synthetic');
 const jobs=Array.from({length:11},(_,i)=>resolver.resolveMovieById('item-'+i));jobs.push(resolver.resolveMovieById('item-3'));
 const rows=await Promise.all(jobs);assert.equal(rows.length,12);assert.ok(rows.every(Boolean));return {peak,reads};
}
const current=await burst(CanonicalItemResolver);
assert.equal(current.peak,1);assert.equal(current.reads,11);
if(mod.exports.CanonicalItemResolver){const old=await burst(mod.exports.CanonicalItemResolver);assert.equal(old.peak,12);assert.equal(old.reads,12);console.log('PASS_FROZEN_SEARCH_BURST_PEAK12_VS_PATCH1');}
console.log('PASS_SERIAL_READS_DUPLICATE_SCAN_REMOVED');
let fail=true,kindReads=[];
const storage={readActiveManifest:async()=>({snapshotId:'synthetic',segments:[{kind:'movies',fileName:'movies_1.json'},{kind:'series',fileName:'series_1.json'}]}),readActiveSegment:async file=>{kindReads.push(file);if(fail){fail=false;throw Error('synthetic storage error');}return JSON.stringify([{id:'same',title:file.includes('series')?'Series':'Movie'}]);}};
const resolver=new CanonicalItemResolver(storage,'synthetic');
await assert.rejects(resolver.resolveMovieById('same'),/synthetic/);
assert.equal((await resolver.resolveMovieById('same')).title,'Movie');assert.equal((await resolver.resolveSeriesById('same')).title,'Series');
assert.equal(kindReads.filter(p=>p.includes('series')).length,1);
assert.equal(await resolver.resolveMovieById('absent'),undefined);
assert.equal((await resolver.resolveMovieById('same')).title,'Movie');
assert.equal(await new CanonicalItemResolver(storage,'other').resolveMovieById('same'),undefined);
console.log('PASS_RESOLVER_ERROR_RETRY_KIND_ISOLATION_MISS_NO_POISON_SNAPSHOT');
let release;const barrier=new Promise(r=>release=r);
const bounded=new CanonicalItemResolver({readActiveManifest:async()=>{await barrier;return {snapshotId:'synthetic',segments:[]};}},'synthetic');
const jobs=Array.from({length:32},(_,i)=>bounded.resolveMovieById('quota-'+i));
const duplicate=bounded.resolveMovieById('quota-0');
await assert.rejects(bounded.resolveMovieById('overflow'),/BUSY/);release();
await Promise.all([...jobs,duplicate]);assert.equal(await bounded.resolveMovieById('after-drain'),undefined);
console.log('PASS_QUOTA32_DEDUP_CLEANUP_BEFORE_RESULT_QUEUE_REUSABLE');
// Execute the real component effect: a changed/unmounted search must not scan
// the remaining result set after the current bounded read finishes.
let cleanup,resolveRead,readCalls=0,updates=0;
const react={useState:()=>[0,()=>updates++],useEffect:effect=>{cleanup=effect();},createElement:()=>null};
const component={exports:{}};
const uiSource=readFileSync(new URL('../src/ui/components/SearchResults.tsx',import.meta.url),'utf8');
const uiRequire=name=>name==='react'?{default:react,...react}:name.includes('catalog-selectors')?{movieToViewModel:()=>({genreLabels:[]}),seriesToViewModel:()=>({genreLabels:[]})}:{MediaCard:()=>null};
new Function('require','module','exports',ts.transpileModule(uiSource,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React}}).outputText)(uiRequire,component,component.exports);
component.exports.SearchResults({results:Array.from({length:50},(_,i)=>({kind:'movie',id:'effect-'+i,title:'Synthetic'})),readModel:{moviesById:new Map(),seriesById:new Map(),resolveMovieById:()=>{readCalls++;return new Promise(r=>resolveRead=r);}},onSelectItem:()=>{}});
assert.equal(readCalls,1);cleanup();resolveRead({id:'effect-0'});await new Promise(r=>setTimeout(r,0));assert.equal(readCalls,1);assert.equal(updates,0);
console.log('PASS_REAL_SEARCH_EFFECT_SERIAL_CANCEL_NO_STALE_UPDATES');
