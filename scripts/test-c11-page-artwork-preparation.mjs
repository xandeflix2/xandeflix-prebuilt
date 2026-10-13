import assert from 'node:assert/strict';
import {loadImage,invalidateLoadedImage,reserveHeroImageSlot} from '../src/artwork/image-load-queue.ts';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const Original=globalThis.Image,originalTimeout=globalThis.setTimeout,originalClear=globalThis.clearTimeout;
const started=[],waiting=[],timers=new Map();let timerId=0,active=0,peak=0;
class FakeImage{
 naturalWidth=342;naturalHeight=513;
 set src(value){this.uri=value;started.push(value);waiting.push(this);peak=Math.max(peak,++active);}
 removeAttribute(){}
 decode=async()=>{};
}
globalThis.Image=FakeImage;globalThis.setTimeout=fn=>{timers.set(++timerId,fn);return timerId;};globalThis.clearTimeout=id=>timers.delete(id);
const tick=async()=>{await Promise.resolve();await Promise.resolve();await Promise.resolve();};
const release=async(success=true)=>{const image=waiting.shift();assert(image);active--;success?image.onload?.():image.onerror?.();await tick();};
const flush=async()=>{while(waiting.length)await release();};
try{
 const releaseHero=reserveHeroImageSlot(),before=started.length;
 const backdropWait=loadImage('first-cold-poster'),backgroundWait=loadImage('second-cold-poster');assert.equal(started.length,before+1);
 const urgent=loadImage('first-critical-hero',true);assert.equal(started.length,before+2);assert.equal(started.at(-1),'first-critical-hero');
 releaseHero();releaseHero();await flush();await Promise.all([backdropWait,backgroundWait,urgent]);assert.equal(peak,2);started.length=0;
 console.log('PASS_FIRST_HERO_RESERVED_SLOT_RELEASE_IDEMPOTENT_TWO_ACTIVE');
 const page=Array.from({length:48},(_,n)=>loadImage('https://source.synthetic.invalid/page-'+n));
 const same=loadImage('https://source.synthetic.invalid/page-12');assert.strictEqual(same,page[12]);
 const hero=loadImage('https://image.tmdb.org/t/p/w1280/hero.jpg',true);
 assert.equal(started.length,2);await release();assert.equal(started[2],'https://image.tmdb.org/t/p/w1280/hero.jpg');
 await flush();assert((await hero).ok);assert((await Promise.all(page)).every(r=>r.ok));assert.equal(peak,2);
 const count=started.length;await loadImage('https://source.synthetic.invalid/page-12');assert.equal(started.length,count);
 console.log('PASS_PAGE48_DECODE_TWO_ACTIVE_HERO_PRIORITY_DEDUP_WARM_CACHE');
 const first=loadImage('block-1'),second=loadImage('block-2'),a=new AbortController(),b=new AbortController();
 const shared=loadImage('shared-cancel',false,a.signal);assert.strictEqual(shared,loadImage('shared-cancel',false,b.signal));
 a.abort();assert.equal(started.includes('shared-cancel'),false);b.abort();assert.equal((await shared).cancelled,true);
 const route=new AbortController(),jobs=Array.from({length:128},(_,n)=>loadImage('queued-'+n,false,route.signal));
 assert.equal((await loadImage('overflow')).deferred,true);route.abort();assert((await Promise.all(jobs)).every(r=>r.cancelled));
 await flush();await Promise.all([first,second]);assert(!started.some(u=>u.startsWith('queued-')));
 const cancelled=new AbortController();cancelled.abort();assert.equal((await loadImage('never',false,cancelled.signal)).cancelled,true);
 console.log('PASS_QUOTA128_CANCEL_STALE_ROUTE_SHARED_CONSUMERS_NO_FALSE_FAILURE');
 const bad=loadImage('bad-image');await release(false);assert.equal((await bad).ok,false);
 const retry=loadImage('bad-image');await release();assert.equal((await retry).ok,true);
 const stalled=loadImage('stalled-image');assert.equal(timers.size,1);const timeout=[...timers.values()][0];active--;waiting.shift();timeout();assert.equal((await stalled).ok,false);
 const afterTimeout=loadImage('after-timeout');await release();assert.equal((await afterTimeout).ok,true);
 invalidateLoadedImage('bad-image');const invalidated=loadImage('bad-image');await release();assert.equal((await invalidated).ok,true);
 const many=Array.from({length:100},(_,n)=>loadImage('lru-'+n));await flush();await Promise.all(many);const evicted=loadImage('lru-0');await release();assert.equal((await evicted).ok,true);
 console.log('PASS_FAILURE_RETRY_TIMEOUT_RECOVERY_INVALIDATION_LRU96');
}finally{globalThis.Image=Original;globalThis.setTimeout=originalTimeout;globalThis.clearTimeout=originalClear;}

const source=readFileSync(new URL('../src/artwork/artwork-file-cache.ts',import.meta.url),'utf8'),compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,mod={exports:{}};
let calls=0,clock=10000,broken=false;
new Function('require','module','exports',compiled)(()=>({Capacitor:{getPlatform:()=> 'android',isPluginAvailable:()=>true,convertFileSrc:path=>'https://localhost/'+path},registerPlugin:()=>({get:async()=>{calls++;if(broken)throw Error('synthetic failure');return{path:'opaque-'+calls};}})}),mod,mod.exports);
const originalNow=Date.now;Date.now=()=>clock;
try{
 const cache=mod.exports,uri='https://fixture.invalid/cached';
 const both=await Promise.all([cache.cachedArtworkUri(uri),cache.cachedArtworkUri(uri)]);assert.equal(calls,1);assert.equal(both[0],both[1]);assert.equal(cache.peekCachedArtworkUri(uri),both[0]);
 await cache.cachedArtworkUri(uri);assert.equal(calls,1);cache.invalidateCachedArtworkUri(uri);await cache.cachedArtworkUri(uri);assert.equal(calls,2);
 clock+=300001;assert.equal(cache.peekCachedArtworkUri(uri),undefined);await cache.cachedArtworkUri(uri);assert.equal(calls,3);
 for(let n=0;n<129;n++)await cache.cachedArtworkUri('lru-cache-'+n);assert.equal(cache.peekCachedArtworkUri('lru-cache-0'),undefined);
 broken=true;assert.equal(await cache.cachedArtworkUri('failure'),'failure');assert.equal(cache.peekCachedArtworkUri('failure'),undefined);
 console.log('PASS_NATIVE_PATH_RAM128_TTL5MIN_DEDUP_IMMEDIATE_HIT_INVALIDATION_FAILURE_NO_POISON');
}finally{Date.now=originalNow;}
