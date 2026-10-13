import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import ts from 'typescript';
import { SegmentedBrowseService } from '../src/catalog/segmented-browse.service.ts';
import * as paths from '../src/bootstrap/storage/segment-path-resolver.ts';
import { prefetchCatalogArtwork } from '../src/artwork/artwork-preload.service.ts';
import { tmdbMetadataService } from '../src/artwork/tmdb-metadata.service.ts';

const row=(kind,n,category='shared')=>({id:kind+'-'+n,title:'Synthetic '+n,categoryIds:[category],genreIds:[],artworkIds:[],streamIds:[],seasonIds:[]});
const rows={m1:Array.from({length:50},(_,n)=>row('movie',n)),m2:Array.from({length:20},(_,n)=>row('movie',n+50,n<10?'shared':'other')),s1:Array.from({length:7},(_,n)=>row('series',n))};
let release;const gate=new Promise(r=>release=r);
let reads=0,peak=0,active=0;
const storage={
 async readActiveManifest(){return{snapshotId:'preview-snapshot',counts:{movies:70,series:7},segments:[{kind:'movies',fileName:'m1.json'},{kind:'movies',fileName:'m2.json'},{kind:'series',fileName:'s1.json'}]}},
 async readActiveSegment(file){reads++;peak=Math.max(peak,++active);try{if(file.includes('m2'))await gate;await new Promise(r=>setTimeout(r,1));return JSON.stringify(rows[file.split('/').at(-1).slice(0,-5)])}finally{active--}},
};

// Optional local diagnosis of the frozen pre-change reader; CI tests below
// do not depend on ignored evidence or Git history.
let oldPage;
if (process.argv.includes('--prove-baseline')) {
const baseline=JSON.parse(readFileSync(new URL('../tmp/c11-home-hero-visible-20261006/baseline.json',import.meta.url),'utf8'));
const oldBytes=execFileSync('git',['show','HEAD:src/catalog/segmented-browse.service.ts']);
assert.equal(createHash('sha256').update(oldBytes).digest('hex'),baseline['src/catalog/segmented-browse.service.ts'].hash);
const oldModule={exports:{}};
const oldJs=ts.transpileModule(oldBytes.toString('utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
new Function('require','module','exports',oldJs)(()=>paths,oldModule,oldModule.exports);
oldPage=new oldModule.exports.SegmentedBrowseService(storage).loadPage('movies',{segment:0,offset:0},48,'shared',{count:false});
assert.equal(await Promise.race([oldPage.then(()=> 'ready'),new Promise(r=>setTimeout(()=>r('blocked'),40))]),'blocked','old first-page path waits on complete category count');
console.log('PASS_REPRODUCED_FROZEN_READER_FIRST_PAGE_BLOCKED_BY_FULL_COUNT');
}

const service=new SegmentedBrowseService(storage,'preview-snapshot');
const preview=await Promise.race([service.loadPage('movies',{segment:0,offset:0},48,'shared',{count:false}),new Promise((_,reject)=>setTimeout(()=>reject(new Error('First page waited on blocked count')),80))]);
assert.equal(preview.items.length,48);assert.equal(preview.totalIsExact,false);assert.equal(preview.totalAvailable,48);
const afterPreview=reads;
assert.equal(service.cachedPage('movies','shared').items,preview.items);
assert.equal((await service.loadPage('movies',{segment:0,offset:0},48,'shared',{count:false})).items,preview.items);
assert.equal(reads,afterPreview,'cached click performs no segment IO');
const count=service.countItems('movies','shared');
release();await oldPage;assert.equal(await count,60);
const afterCount=reads;assert.equal(await service.countItems('movies','other'),10);assert.equal(reads,afterCount,'one count scan populates all categories of that kind');
assert.equal(await service.countItems('series','shared'),7,'mixed category counts stay isolated by kind');
const beforeCold=reads;
assert.equal((await service.loadPage('movies',undefined,48,'other',{count:false})).items.length,10);
assert.equal(reads-beforeCold,1,'known category start skips preceding segments even before first visit');
assert.equal((await service.loadPage('movies',{segment:0,offset:0},48,'shared')).totalAvailable,60,'default reader still returns exact total');
const next=await service.loadPage('movies',preview.nextCursor,48,'shared',{count:false});
assert.equal(next.items.length,12);assert.equal(next.nextCursor,null);
assert.equal(new Set([...preview.items,...next.items].map(x=>x.id)).size,60);
assert.ok(peak<=2,'active reads bounded');
console.log('PASS_PREVIEW_BEFORE_FULL_COUNT_CACHE_NO_IO_TYPED_COUNTS_AND_PAGINATION');

const cancel=new AbortController();cancel.abort();
await assert.rejects(()=>service.loadPage('movies',undefined,48,'shared',{count:false,signal:cancel.signal}),/CANCELLED/);
await assert.rejects(()=>new SegmentedBrowseService(storage,'other-snapshot').loadPage('movies',undefined,48,undefined,{count:false}),/GENERATION_CHANGED/);
const dedup=new SegmentedBrowseService(storage,'preview-snapshot');const beforeDedup=reads;
const pages=await Promise.all(Array.from({length:6},()=>dedup.loadPage('movies',undefined,48,'shared',{count:false})));
assert.equal(reads-beforeDedup,1);assert.ok(pages.every(p=>p.items===pages[0].items));
for(let n=0;n<25;n++)await dedup.loadPage('movies',undefined,48,'absent-'+n,{count:false});
assert.equal(dedup.cachedPage('movies','shared'),undefined,'LRU evicts pages beyond 24');
dedup.dispose();await assert.rejects(()=>dedup.loadPage('movies',undefined,48,'shared',{count:false}),/CANCELLED/);
console.log('PASS_PREFETCH_DEDUP_LRU24_CANCEL_DISPOSE_AND_SNAPSHOT_ISOLATION');

const originalImage=globalThis.Image,originalResolve=tmdbMetadataService.resolve,originalPeek=tmdbMetadataService.peek;
let imageActive=0,imagePeak=0;const pendingImages=[],urls=[];
class FakeImage{
 set src(value){urls.push(value);imagePeak=Math.max(imagePeak,++imageActive);pendingImages.push(this)}
 removeAttribute(){}
}
globalThis.Image=FakeImage;
tmdbMetadataService.peek=()=>null;
tmdbMetadataService.resolve=async()=>({kind:'movie',tmdbId:1,genres:[],backdropUri:'https://image.tmdb.org/t/p/w1280/hero-preview.jpg'});
try{
 const items=Array.from({length:8},(_,n)=>({id:'movie-'+n,kind:'movie',title:'Synthetic '+n,posterUri:'https://source.synthetic.invalid/preview-'+n+'.jpg',genreLabels:[],categoryLabels:[]}));
 prefetchCatalogArtwork(items);prefetchCatalogArtwork(items);await new Promise(r=>setTimeout(r,0));
 while(pendingImages.length){const image=pendingImages.shift();imageActive--;image.onload?.()}
 assert.equal(imagePeak,2);assert.equal(new Set(urls).size,9);assert.equal(urls.length,9,'poster/hero downloads deduplicated');
 assert.ok(urls.includes('https://image.tmdb.org/t/p/w1280/hero-preview.jpg'));
 assert.equal(urls[2],'https://image.tmdb.org/t/p/w1280/hero-preview.jpg','hero takes priority over queued source posters');
 const aborted=new AbortController();aborted.abort();prefetchCatalogArtwork(items,aborted.signal);assert.equal(urls.length,9);
}finally{globalThis.Image=originalImage;tmdbMetadataService.resolve=originalResolve;tmdbMetadataService.peek=originalPeek}
console.log('PASS_SOURCE_POSTER_AND_HORIZONTAL_TMDB_HERO_PRELOAD_DEDUP_TWO_ACTIVE');
console.log('PASS_C11_CATEGORY_PREVIEW');
