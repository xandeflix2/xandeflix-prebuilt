import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import React from 'react';
import { displayArtworkUri, chooseArtworkUri } from '../src/artwork/artwork-uri.ts';
import { artworkIdentityKey, tmdbPosterPath } from '../src/artwork/tmdb-metadata.service.ts';
import { SegmentedBrowseService } from '../src/catalog/segmented-browse.service.ts';
import * as presentation from '../src/catalog/category-presentation.ts';
import { CategoryPreviewIndex, categoryPreviewIndex } from '../src/catalog/category-preview-index.ts';
import { CatalogReadModel } from '../src/catalog/catalog-read-model.ts';

function load(file, imports) {
  const module = { exports: {} };
  new Function('require', 'module', 'exports', ts.transpileModule(readFileSync(new URL('../' + file, import.meta.url), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React } }).outputText)(name => {
    for (const [key, value] of Object.entries(imports)) if (name.includes(key)) return value;
    throw Error('Uncontrolled dependency: ' + name);
  }, module, module.exports);
  return module.exports;
}
assert.equal(displayArtworkUri('http://image.tmdb.org/t/p/original/one.jpg', 'poster'), 'https://image.tmdb.org/t/p/w342/one.jpg');
assert.equal(displayArtworkUri('https://image.tmdb.org/t/p/w342/one.jpg', 'poster', true), 'https://image.tmdb.org/t/p/w780/one.jpg');
assert.equal(displayArtworkUri('https://source.synthetic.invalid/one.jpg?size=full', 'poster'), 'https://source.synthetic.invalid/one.jpg?size=full');
assert.equal(displayArtworkUri('https://image.tmdb.org/t/p/original/one.jpg', 'backdrop'), 'https://image.tmdb.org/t/p/w1280/one.jpg');
console.log('PASS_TMDB_SMALL_CARD_HERO_SIZE_FILENAME_AND_OTHER_SOURCE_PRESERVED');

{
  let calls = 0, failure = 'CACHE_SOURCE_UNAVAILABLE', clock = Date.now();
  const nativeCache = load('src/artwork/artwork-file-cache.ts', { '@capacitor/core': {
    Capacitor: { getPlatform: () => 'android', isPluginAvailable: () => true, convertFileSrc: path => 'https://localhost/' + path },
    registerPlugin: () => ({ get: async () => { calls++; if (failure) throw { code: failure }; return { path: 'opaque' }; } }),
  } });
  const oldNow = Date.now; Date.now = () => clock;
  try {
    const uri = 'https://source.synthetic.invalid/unavailable';
    assert.equal(await nativeCache.acquireCachedArtworkUri(uri), undefined);
    assert.equal(await nativeCache.acquireCachedArtworkUri(uri), undefined); assert.equal(calls, 1);
    assert.equal(await nativeCache.cachedArtworkUri(uri), uri, 'legacy fallback remains compatible'); assert.equal(calls, 1);
    clock += 60001; await nativeCache.acquireCachedArtworkUri(uri); assert.equal(calls, 2);
    nativeCache.invalidateCachedArtworkUri(uri); failure = ''; assert.equal(await nativeCache.acquireCachedArtworkUri(uri), 'https://localhost/opaque'); assert.equal(calls, 3);
    failure = 'CACHE_UNAVAILABLE'; assert.equal(await nativeCache.acquireCachedArtworkUri('disk-failure'), 'disk-failure');
    failure = 'unknown'; assert.equal(await nativeCache.acquireCachedArtworkUri('unknown-failure'), 'unknown-failure');
    failure = 'CACHE_SOURCE_UNAVAILABLE'; for (let n = 0; n < 129; n++) await nativeCache.acquireCachedArtworkUri('bad-' + n);
    const before = calls; await nativeCache.acquireCachedArtworkUri('bad-0'); assert.equal(calls, before + 1, 'failure RAM cache is bounded128');
  } finally { Date.now = oldNow; }
  console.log('PASS_STRICT_NATIVE_SOURCE_FAILURE_NO_SECOND_TRANSPORT_DISK_FALLBACK_LEGACY_TTL_RECOVERY_RAM128');
}

const warmed = [], callback = [];
const coordinated = { loadImage: (...args) => { warmed.push(args); return Promise.resolve({ ok: true }); } };
const item = { id: 'synthetic', kind: 'series', title: 'Synthetic', posterUri: 'https://image.tmdb.org/t/p/original/one.jpg', genreLabels: [] };
const { MediaCard } = load('src/ui/components/MediaCard.tsx', {
  react: { default: React, ...React }, Artwork: { Artwork: () => null },
  NewContentProvider: { useContentBadge: () => undefined },
  'artwork-uri': { displayArtworkUri }, 'image-load-queue': coordinated,
});
MediaCard.type({ item, onClick() {}, onFocus: () => callback.push(true) }).props.onFocus();
assert.equal(warmed[0][0], displayArtworkUri(item.posterUri, 'poster'));
assert.equal(warmed[0][1], true); assert.equal(callback.length, 1);
const { prefetchCatalogArtwork } = load('src/artwork/artwork-preload.service.ts', {
  'artwork-uri': { displayArtworkUri }, 'image-load-queue': coordinated,
  'hero-artwork': { heroArtworkService: { resolve: async () => 'synthetic-hero' } },
});
const route = new AbortController();
prefetchCatalogArtwork([item], route.signal);
assert.equal(warmed[1][0], warmed[0][0]); assert.equal(warmed[1][2], route.signal);
route.abort(); prefetchCatalogArtwork([item], route.signal); assert.equal(warmed.length, 2);
console.log('PASS_REAL_FOCUS_AND_PREFETCH_SHARE_DISPLAY_SIZE_KEY_CALLBACK_AND_ROUTE_CANCEL');

const railStates = []; let railIndex = 0, railDirty = false, railEffects = [];
const railReact = { ...React, useRef: value => ({ current: value }), useMemo: fn => fn(),
  useState(initial) { const index = railIndex++; if (!(index in railStates)) railStates[index] = typeof initial === 'function' ? initial() : initial;
    return [railStates[index], value => { const next = typeof value === 'function' ? value(railStates[index]) : value; if (!Object.is(next, railStates[index])) { railStates[index] = next; railDirty = true; } }]; },
  useEffect(fn) { railEffects.push(fn); },
};
const { MediaRail } = load('src/ui/components/MediaRail.tsx', {
  react: { default: railReact, ...railReact }, 'category-presentation': presentation,
  MediaCard: { MediaCard: () => null }, useRailArtworkPreparation: { useRailArtworkPreparation: () => ({ root: {}, prepare: true }) },
});
function renderRail(items, extra = {}) {
  for (let n = 0; n < 10; n++) {
    railIndex = 0; railDirty = false; railEffects = [];
    const element = MediaRail.type({ id: 'synthetic-rail', title: 'Synthetic category', items, onItemClick() {}, onViewAll() {}, ...extra });
    for (const effect of railEffects) effect();
    if (!railDirty) return element.props.children[1].props.children.map(card => card.props.item);
  }
  throw Error('Rail order did not settle');
}
const partial = [{ ...item, id: 'one' }, { ...item, id: 'two' }], firstIds = renderRail(partial).map(row => row.id);
const completeRail = Array.from({ length: 20 }, (_, n) => ({ ...item, id: n < 2 ? partial[n].id : 'new-' + n }));
assert.deepEqual(renderRail(completeRail).slice(0, 2).map(row => row.id), firstIds);
assert.equal(new Set(renderRail(completeRail).map(row => row.id)).size, 20);
assert.equal(renderRail(completeRail.map(row => ({ ...row, title: 'Updated' })))[0].title, 'Updated');
assert.deepEqual(renderRail(completeRail, { preserveOrder: true }).map(row => row.id), completeRail.map(row => row.id));
assert.deepEqual(renderRail(completeRail, { title: 'Filmes | Lançamentos' }).map(row => row.id), completeRail.map(row => row.id));
console.log('PASS_REAL_RAIL_PARTIAL_TO20_VISIBLE_ORDER_METADATA_UPDATE_RELEASE_AND_RECENT_ORDER');

const oldObserver = globalThis.IntersectionObserver, observers = [];
class Observer {
  constructor(callback, options) { this.callback = callback; this.options = options; this.targets = new Set(); observers.push(this); }
  observe(target) { this.targets.add(target); }
  unobserve(target) { this.targets.delete(target); }
  disconnect() { this.targets.clear(); }
}
globalThis.IntersectionObserver = Observer;
try {
  const { observeArtwork } = await import('../src/artwork/artwork-visibility.ts');
  const a = {}, b = {}, states = [];
  const offA = observeArtwork(a, value => states.push(value)), offB = observeArtwork(b, () => {});
  assert.equal(observers.length, 2); assert.equal(observers[0].options.rootMargin, '600px 200px');
  observers[0].callback([{ target: a, isIntersecting: true }]); observers[1].callback([{ target: a, isIntersecting: true }]);
  assert.deepEqual(states.at(-1), { near: true, visible: true });
  observers[1].callback([{ target: a, isIntersecting: false }]); observers[0].callback([{ target: a, isIntersecting: false }]);
  assert.deepEqual(states.at(-1), { near: false, visible: false });
  offA(); assert.equal(observers[0].targets.has(a), false); assert.equal(observers[0].targets.has(b), true);
  offB(); assert.equal(observers[0].targets.size, 0); assert.equal(observers[1].targets.size, 0);
} finally { globalThis.IntersectionObserver = oldObserver; }
console.log('PASS_SHARED_OBSERVERS_TWO_AXES_VIEWPORT_PRIORITY_LEAVE_AND_CLEANUP');

// Aborting a non-shared preview must stop the real reader between segments.
let releaseSegment, readCount = 0;
const storage = {
  readActiveManifest: async () => ({ snapshotId: 'synthetic', counts: { series: 60 }, segments: [1, 2, 3].map(n => ({ kind: 'series', fileName: `series_${n}.json` })) }),
  readActiveSegment: async () => { readCount++; return await new Promise(resolve => { releaseSegment = resolve; }); },
};
const reader = new SegmentedBrowseService(storage, 'synthetic'), cancelledPreview = new AbortController();
const preview = reader.loadPage('series', { segment: 0, offset: 0 }, 20, 'chosen', { count: false, signal: cancelledPreview.signal });
const rejectedPreview = assert.rejects(preview, /BROWSE_CANCELLED/);
while (!releaseSegment) await Promise.resolve();
cancelledPreview.abort(); releaseSegment(JSON.stringify([{ id: 'other', categoryIds: ['other'] }]));
await rejectedPreview; assert.equal(readCount, 1); reader.dispose();

releaseSegment = undefined; readCount = 0;
const sharedReader = new SegmentedBrowseService(storage, 'synthetic'), oneCaller = new AbortController();
const aPage = sharedReader.loadPage('series', { segment: 0, offset: 0 }, 48, 'chosen', { count: false, signal: oneCaller.signal });
const rejectedCaller = assert.rejects(aPage, /BROWSE_CANCELLED/);
const bPage = sharedReader.loadPage('series', { segment: 0, offset: 0 }, 48, 'chosen', { count: false });
while (!releaseSegment) await Promise.resolve();
oneCaller.abort(); releaseSegment(JSON.stringify(Array.from({ length: 48 }, (_, n) => ({ id: `chosen-${n}`, categoryIds: ['chosen'], posterUri: 'https://fixture.invalid/synthetic.jpg' }))));
await rejectedCaller; assert.equal((await bPage).items.length, 48); assert.equal(readCount, 1); sharedReader.dispose();
console.log('PASS_REAL_READER_CANCEL_PREVIEW_BEFORE_NEXT_SEGMENT_AND_SHARED_PAGE48_SURVIVES');

{
  const record = (n, category) => ({ id: `preview-${category}-${n}`, title: `Synthetic ${n}`, categoryIds: [category], genreIds: [], artworkIds: [], seasonIds: [], streamIds: ['must-not-be-cached'],
    posterUri: `https://image.tmdb.org/t/p/original/synthetic${n}.jpg`, playbackUrl: 'https://private.synthetic.invalid/never-cache', sourcePassword: 'synthetic-marker' });
  const cat = { metadata: { snapshotId: 'preview-generation' }, categories: [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }], genres: [],
    movies: [], series: [record(0, 'a'), record(0, 'b')], seasons: [], episodes: [], artworks: [], streams: [] };
  const previewModel = new CatalogReadModel(cat), saved = new Map();
  const repository = { read: async kind => saved.get(kind), write: async (kind, value) => { saved.set(kind, structuredClone(value)); } };
  let previewReads = 0, releaseNext, hold = true, generation = 'preview-generation';
  const previewStorage = {
    readActiveManifest: async () => ({ snapshotId: generation, segments: [{ kind: 'series', fileName: 's1.json' }, { kind: 'series', fileName: 's2.json' }] }),
    readActiveSegment: async file => { previewReads++; if (file.endsWith('s1.json')) return JSON.stringify([...Array.from({ length: 30 }, (_, n) => record(n, 'a')), ...Array.from({ length: 4 }, (_, n) => record(n, 'b'))]);
      if (hold) await new Promise(resolve => { releaseNext = resolve; }); return JSON.stringify(Array.from({ length: 4 }, (_, n) => record(n + 4, 'b'))); },
  };
  const index = new CategoryPreviewIndex(previewModel, previewStorage, repository), one = new AbortController();
  const firstPreview = index.load('series', 'a');
  const cancelled = index.load('series', 'b', one.signal), rejectCancelled = assert.rejects(cancelled, /PREVIEW_CANCELLED/);
  const peer = index.load('series', 'b'); one.abort(); await rejectCancelled;
  assert.equal((await firstPreview).length, 20, 'a ready category must not wait for the rest of the scan');
  while (!releaseNext) await new Promise(resolve => setTimeout(resolve, 0)); releaseNext();
  assert.equal((await peer).length, 8); await index.prepare('series'); assert.equal(previewReads, 2);
  const stored = JSON.stringify(saved.get('series'));
  assert.ok(!stored.includes('playbackUrl') && !stored.includes('sourcePassword') && !stored.includes('must-not-be-cached'));
  assert.ok(stored.length * 2 < 1024 * 1024);
  const warm = new CategoryPreviewIndex(previewModel, previewStorage, repository), readsBefore = previewReads;
  assert.deepEqual((await warm.load('series', 'a')).map(row => row.id), Array.from({ length: 20 }, (_, n) => `preview-a-${n}`));
  assert.equal(previewReads, readsBefore, 'warm preview must not reread catalog segments');
  generation = 'different-generation';
  await assert.rejects(new CategoryPreviewIndex(previewModel, previewStorage, repository).load('series', 'a'), /GENERATION_CHANGED/);
  generation = 'preview-generation'; hold = false;
  const corrupt = { read: async () => ({ version: 1, snapshot: generation, rows: [['a', [{ kind: 'movie', id: 'wrong-kind' }]]] }), write: async () => {} };
  assert.equal((await new CategoryPreviewIndex(previewModel, previewStorage, corrupt).load('series', 'a')).length, 20);
  const unavailable = { read: async () => { throw Error('offline local cache'); }, write: async () => { throw Error('quota'); } };
  assert.equal((await new CategoryPreviewIndex(previewModel, previewStorage, unavailable).load('series', 'a')).length, 20);
  const switchedStorage = { ...previewStorage, readActiveSegment: async () => { generation = 'promoted-mid-read'; return JSON.stringify(Array.from({ length: 20 }, (_, n) => record(n, 'a'))); } };
  await assert.rejects(new CategoryPreviewIndex(previewModel, switchedStorage, unavailable).load('series', 'a'), /GENERATION_CHANGED/); generation = 'preview-generation';
  const privateRepo = new Map(), queryStorage = { ...previewStorage, readActiveSegment: async () => JSON.stringify([{ ...record(0, 'a'), posterUri: 'https://fixture.invalid/image.jpg?temporary=synthetic' }, ...Array.from({ length: 20 }, (_, n) => record(n, 'b'))]) };
  const queryIndex = new CategoryPreviewIndex(previewModel, queryStorage, { read: async () => undefined, write: async (kind, value) => privateRepo.set(kind, value) });
  assert.ok((await queryIndex.load('series', 'a'))[0].posterUri.includes('?')); await queryIndex.prepare('series');
  assert.ok(!JSON.stringify(privateRepo.get('series')).includes('temporary=')); queryIndex.dispose();
  const categories = Array.from({ length: 65 }, (_, n) => ({ id: 'quota-' + n, name: 'Q' + n }));
  const quotaModel = new CatalogReadModel({ ...cat, categories, series: categories.map((category, n) => record(n, category.id)) });
  await assert.rejects(new CategoryPreviewIndex(quotaModel, previewStorage, unavailable).load('series', 'quota-64'), /OUTSIDE_QUOTA/);
  const sharedA = categoryPreviewIndex(previewModel, previewStorage); assert.equal(sharedA, categoryPreviewIndex(previewModel, previewStorage));
  const changedModel = new CatalogReadModel({ ...cat, metadata: { snapshotId: 'new-generation' } });
  assert.notEqual(categoryPreviewIndex(changedModel, previewStorage), sharedA); await assert.rejects(sharedA.load('series', 'a'), /CANCELLED/);
  index.dispose(); warm.dispose();
}
console.log('PASS_REAL_PREVIEW_INDEX_SINGLE_SCAN20_TYPED_WARM_NO_SEGMENT_IO_SNAPSHOT_CORRUPTION_SHARED_ABORT_METADATA_ONLY');

// Execute the real coordinator with cold native cache promises. No cache request
// may start before admission, even with a full background page waiting.
const oldImage = globalThis.Image, native = [], images = [], started = [];
let nativeActive = 0, peak = 0;
class Image {
  naturalWidth = 342; naturalHeight = 513;
  set src(value) { this.value = value; images.push(this); }
  removeAttribute() {}
  decode = async () => {};
}
globalThis.Image = Image;
const queue = load('src/artwork/image-load-queue.ts', { 'artwork-file-cache': {
  usesArtworkFileCache: () => true,
  acquireCachedArtworkUri: uri => { started.push(uri); peak = Math.max(peak, ++nativeActive); return new Promise(resolve => native.push({ uri, resolve })); },
} });
const tick = async () => { for (let n = 0; n < 6; n++) await Promise.resolve(); };
async function complete() {
  const request = native.shift(); assert.ok(request); nativeActive--;
  request.resolve('https://localhost/opaque/' + request.uri); await tick();
  const image = images.shift(); if (image) { image.onload(); await tick(); }
}
try {
  const controller = new AbortController();
  const page = Array.from({ length: 40 }, (_, n) => queue.loadImage('background-' + n, false, controller.signal));
  assert.equal(started.length, 2);
  const visible = queue.loadImage('visible', true);
  await complete(); assert.equal(started[2], 'visible', 'visible poster must bypass queued offscreen posters');
  controller.abort(); while (native.length) await complete();
  const result = await visible; assert.equal(result.src, 'https://localhost/opaque/visible'); assert.ok(result.ok);
  assert.equal(peak, 2); assert.equal(started.length, 3, 'cancelled offscreen queue must not reach native downloader');
  assert.ok((await Promise.all(page)).slice(2).every(value => value.cancelled));
  const before = started.length; assert.equal((await queue.loadImage('visible')).src, result.src); assert.equal(started.length, before);
  const activeJobs = [queue.loadImage('active-first'), queue.loadImage('active-second')];
  const background = queue.loadImage('waiting-background');
  const upper = queue.loadImage('upper-visible', true), lower = queue.loadImage('lower-visible', true);
  assert.strictEqual(queue.loadImage('upper-visible', true), upper);
  await complete(); assert.equal(started.at(-1), 'upper-visible', 'first visible row cannot be displaced by later row');
  await complete(); assert.equal(started.at(-1), 'lower-visible', 'urgent FIFO still precedes background');
  while (native.length) await complete(); await Promise.all([...activeJobs, background, upper, lower]);
  const blockers = [queue.loadImage('rank-blocker1'), queue.loadImage('rank-blocker2')];
  const lowerSource = queue.loadImage('lower-source', true, undefined, 300);
  const upperFallback = queue.loadImage('upper-fallback', true, undefined, 48);
  await complete(); assert.equal(started.at(-1), 'upper-fallback', 'late upper-row fallback must precede lower-row source');
  await complete(); assert.equal(started.at(-1), 'lower-source');
  while (native.length) await complete(); await Promise.all([...blockers, lowerSource, upperFallback]);
  const miss = queue.loadImage('unavailable-source', true), imageCount = images.length;
  const request = native.shift(); nativeActive--; request.resolve(undefined); await tick();
  assert.equal((await miss).ok, false); assert.equal(images.length, imageCount, 'known failure must not assign original source to another Image');
} finally { globalThis.Image = oldImage; }
console.log('PASS_SINGLE_NATIVE_TRANSPORT_TWO_ACTIVE_VISIBLE_FIFO_BYPASS_CANCEL_AND_WARM_LOCAL_SRC');

// Hold both decoders open: next transfers must advance without creating a third Image.
{
  const requests = [], constructed = [], decoders = []; let inTransport = 0, transportPeak = 0, calls = 0;
  class StagedImage {
    naturalWidth = 342; naturalHeight = 513;
    set src(value) { this.uri = value; constructed.push(this); }
    removeAttribute() {}
    decode = () => new Promise(resolve => decoders.push(resolve));
  }
  globalThis.Image = StagedImage;
  const staged = load('src/artwork/image-load-queue.ts', { 'artwork-file-cache': {
    usesArtworkFileCache: () => true,
    acquireCachedArtworkUri: uri => { calls++; transportPeak = Math.max(transportPeak, ++inTransport); return new Promise(resolve => requests.push({ uri, finish: src => { inTransport--; resolve(src); } })); },
  } });
  try {
    const route = new AbortController(), results = Array.from({ length: 8 }, (_, n) => staged.loadImage('stage-' + n, false, route.signal));
    assert.equal(requests.length, 2);
    requests.shift().finish('https://localhost/first'); await tick();
    assert.equal(constructed.length, 1); assert.equal(requests.length, 2, 'next transfer starts before first image finishes decoding');
    requests.shift().finish('https://localhost/second'); await tick();
    assert.equal(constructed.length, 2); constructed[0].onload(); constructed[1].onload(); await tick();
    assert.equal(decoders.length, 2); assert.equal(requests.length, 2);
    requests.shift().finish('https://localhost/prepared3'); await tick();
    requests.shift().finish('https://localhost/prepared4'); await tick();
    assert.equal(constructed.length, 2, 'prepared files must not allocate another decoder'); assert.equal(calls, 4, 'prepared+transfers buffer stays2');
    route.abort(); decoders.splice(0).forEach(resolve => resolve()); await tick();
    const done = await Promise.all(results); assert.ok(done.slice(0, 2).every(r => r.ok)); assert.ok(done.slice(2).every(r => r.cancelled));
    assert.equal(transportPeak, 2); assert.equal(constructed.length, 2);
    assert.equal((await staged.loadImage('stage-0')).src, 'https://localhost/first'); assert.equal(calls, 4);
  } finally { globalThis.Image = oldImage; }
  console.log('PASS_PIPELINED_TRANSFER2_DECODE2_PREPARED2_REAL_OVERLAP_NO_EXTRA_BITMAP_CANCEL_WARM');
}

// Small hook runner: effects and cleanup are executed while the real Artwork
// component renders; optional external transports are controlled and observable.
{
  const oldDocument=globalThis.document;
  async function bitmapCase({fire=true,native=true,src='https://localhost/_capacitor_file_/cache/opaque',context=true,readFails=false,zero=false,loadFails=false,rejectDecode=false}={}) {
    const made=[],canvases=[];let draws=0,reads=0,decodeCalls=0,transports=0,release,reject;
    globalThis.document={location:{origin:'https://localhost'},querySelector:()=>fire?{}:null,createElement:tag=>{
      assert.equal(tag,'canvas');const canvas={width:300,height:150,getContext:()=>context?{
        drawImage:()=>{draws++;},getImageData:()=>{reads++;if(readFails)throw Error('Unreadable');return {data:new Uint8ClampedArray(4)};},
      }:null};canvases.push(canvas);return canvas;
    }};
    class BitmapImage {
      complete=true;naturalWidth=zero?0:342;naturalHeight=513;
      set src(value){this.uri=value;made.push(this);}removeAttribute(){}
      decode(){decodeCalls++;return new Promise((r,j)=>{release=r;reject=j;});}
    }
    globalThis.Image=BitmapImage;
    const q=load('src/artwork/image-load-queue.ts',{'artwork-file-cache':{usesArtworkFileCache:()=>native,acquireCachedArtworkUri:async()=>{transports++;return src;}}});
    const uri=native?'https://source.synthetic.invalid/bitmap':src,promise=q.loadImage(uri,true);let settled=false;
    void promise.then(()=>{settled=true;});await tick();assert.equal(made.length,1);assert.equal(transports,native?1:0);
    if(loadFails)made[0].onerror();else made[0].onload();await tick();
    const local=src.startsWith('https://localhost/_capacitor_file_/');
    const fast=fire&&native&&local&&context&&!readFails&&!zero&&!loadFails;
    if(fast){assert.ok(settled,'readable local bitmap must not await the stalled decode promise');assert.equal(decodeCalls,0);assert.equal(draws,1);assert.equal(reads,1);}
    else if(!loadFails){assert.equal(settled,false,'other transports/profiles and failed readback retain decode readiness');assert.equal(decodeCalls,1);if(rejectDecode)reject(Error('Invalid bitmap'));else release();await tick();}
    const result=await promise;assert.equal(result.ok,!loadFails&&!zero&&!rejectDecode);
    assert.equal(q.isImageReady(uri),result.ok);assert.ok(canvases.every(c=>c.width===0&&c.height===0),'release every pixel surface, including failures');
    if(!fire||!native||!local||zero||loadFails)assert.equal(canvases.length,0);
  }
  try{
    await bitmapCase();await bitmapCase({fire:false});await bitmapCase({native:false});
    await bitmapCase({src:'https://source.synthetic.invalid/direct'});
    await bitmapCase({src:'https://elsewhere.synthetic.invalid/_capacitor_file_/opaque'});
    await bitmapCase({context:false});await bitmapCase({readFails:true});
    await bitmapCase({zero:true});await bitmapCase({loadFails:true});await bitmapCase({readFails:true,rejectDecode:true});
  }finally{globalThis.Image=oldImage;if(oldDocument===undefined)delete globalThis.document;else globalThis.document=oldDocument;}
  console.log('PASS_FIRE_LOCAL_BITMAP_REAL_READBACK_STALLED_DECODE_OTHERS_KEEP_DECODE_FAILURE_ZERO_NO_HIT_SURFACE_RELEASE');
}
const oldWindow = globalThis.window;
globalThis.window = { addEventListener() {}, removeEventListener() {} };
let listener, metadata = null, pendingMetadata = false, metadataIdentity, jobs = [], invalidated = 0;
const states = [], effects = []; let si = 0, ei = 0, dirty = false, component, props, tree;
const react = { ...React,
  useState(initial) { const index = si++; if (!(index in states)) states[index] = typeof initial === 'function' ? initial() : initial;
    return [states[index], value => { const next = typeof value === 'function' ? value(states[index]) : value; if (!Object.is(next, states[index])) { states[index] = next; dirty = true; } }]; },
  useEffect(fn, deps) { const index = ei++, before = effects[index]; if (!before || deps.some((value, n) => !Object.is(value, before.deps[n]))) effects[index] = { deps, fn, oldCleanup: before?.cleanup, changed: true }; },
};
const { Artwork } = load('src/ui/components/Artwork.tsx', {
  react: { default: react, ...react }, 'artwork-uri': { displayArtworkUri, chooseArtworkUri },
  'tmdb-metadata': { artworkIdentityKey, tmdbPosterPath },
  useArtworkMetadata: { useArtworkMetadataState: (identity, enabled) => { if (enabled) metadataIdentity = identity; return { metadata: enabled ? metadata : null, pending: enabled && pendingMetadata }; } },
  'image-load-queue': { isImageReady: () => false, reserveHeroImageSlot: () => () => {}, invalidateLoadedImage: () => invalidated++, loadImage: (uri, priority, signal) => new Promise(resolve => jobs.push({ uri, priority, signal, resolve })) },
  'artwork-file-cache': { invalidateCachedArtworkUri: () => invalidated++ },
  'artwork-visibility': { observeArtwork: (_element, callback) => { listener = callback; return () => { listener = undefined; }; } },
});
function flush() {
  for (let cycle = 0; cycle < 20; cycle++) {
    dirty = false; si = ei = 0; tree = component(props);
    for (const effect of effects) if (effect.changed) { effect.oldCleanup?.(); effect.changed = false; effect.cleanup = effect.fn(); }
    if (!dirty) return tree;
  }
  throw Error('Hook updates did not settle');
}
const initial = Artwork.type({ uri: 'https://image.tmdb.org/t/p/original/broken.jpg', title: 'Synthetic (L)', kind: 'poster', identity: { kind: 'series', title: 'Synthetic (L)', year: 2018 }, prepare: true });
component = initial.type; props = initial.props;
try {
  flush(); assert.equal(tree.type, 'div'); assert.equal(tree.props.src, undefined); assert.equal(jobs.length, 0);
  tree.ref({}); flush(); listener({ near: true, visible: true }); flush();
  assert.equal(jobs.length, 1); assert.equal(jobs[0].priority, true);
  listener({ near: false, visible: false }); flush(); assert.equal(jobs[0].signal.aborted, true);
  jobs[0].resolve({ ok: true, src: 'https://localhost/stale' }); await tick(); flush(); assert.equal(tree.type, 'div');
  listener({ near: true, visible: true }); flush();
  metadata = { posterUri: 'https://image.tmdb.org/t/p/w342/provider.jpg' };
  jobs.at(-1).resolve({ ok: false }); await tick(); flush();
  assert.equal(metadataIdentity.posterPath, undefined, 'failed source filename must not exclude a valid conservative title match');
  assert.equal(metadataIdentity.title, 'Synthetic'); assert.equal(metadataIdentity.year, 2018); assert.equal(metadataIdentity.kind, 'series');
  assert.equal(jobs.at(-1).uri, metadata.posterUri);
  jobs.at(-1).resolve({ ok: true, src: 'https://localhost/provider-cached' }); await tick(); flush();
  assert.equal(tree.type, 'img'); assert.equal(tree.props.src, 'https://localhost/provider-cached'); assert.equal(tree.props['data-artwork-ready'], true);
  assert.equal(jobs.length, 3, 'rendering the decoded local src must not request cache again');
  tree.props.onError(); flush(); assert.equal(invalidated, 2);
  assert.equal(tree.type, 'div'); assert.equal(jobs.length, 4, 'invalid file retries once through coordinator');
  jobs.at(-1).resolve({ ok: false }); await tick(); metadata = null; pendingMetadata = false; flush();
  assert.equal(tree.type, 'div'); assert.ok(tree.props.className.includes('artwork-fallback')); assert.notEqual(tree.props['aria-busy'], true);
} finally { for (const effect of effects) effect.cleanup?.(); globalThis.window = oldWindow; }
console.log('PASS_REAL_ARTWORK_NO_EMPTY_IMG_STALE_CANCEL_FALLBACK_MATCH_LOCAL_SRC_INVALIDATION_AND_RESOLVED_MISS');

// A fallback lookup starts alongside an external poster, but never replaces a valid source.
states.length = effects.length = 0; jobs = []; metadata = null; pendingMetadata = true;
globalThis.window = { addEventListener() {}, removeEventListener() {} };
const external = Artwork.type({ uri: 'https://source.synthetic.invalid/poster.jpg', title: 'External (L)', kind: 'poster', identity: { kind: 'series', title: 'External (L)', year: 2020 } });
component = external.type; props = external.props;
try {
  flush(); tree.ref({}); flush(); listener({ near: true, visible: true }); flush();
  assert.equal(metadataIdentity.title, 'External'); assert.equal(jobs.at(-1).uri, props.uri);
  assert.equal(states[2].size, 0);
  jobs.at(-1).resolve({ ok: false }); await tick(); flush();
  assert.equal(states[2].size, 0, 'source retry cannot compete with pending fallback');
  metadata = { posterUri: 'https://image.tmdb.org/t/p/w342/external-provider.jpg' }; pendingMetadata = false; flush();
  assert.equal(jobs.at(-1).uri, metadata.posterUri); assert.equal(states[2].size, 0);
  jobs.at(-1).resolve({ ok: true, src: 'https://localhost/fallback' }); await tick(); flush();
  assert.equal(tree.props.src, 'https://localhost/fallback'); assert.equal(states[2].size, 0);
} finally { for (const effect of effects) effect.cleanup?.(); globalThis.window = oldWindow; }
states.length = effects.length = 0; jobs = []; pendingMetadata = false;
globalThis.window = { addEventListener() {}, removeEventListener() {} };
component = external.type; props = external.props;
try {
  flush(); tree.ref({}); flush(); listener({ near: true, visible: true }); flush();
  assert.equal(jobs.at(-1).uri, props.uri, 'available metadata must retain source-first image selection');
  jobs.at(-1).resolve({ ok: true, src: 'https://localhost/source' }); await tick(); flush();
  assert.equal(tree.props.src, 'https://localhost/source'); assert.equal(jobs.length, 1);
} finally { for (const effect of effects) effect.cleanup?.(); globalThis.window = oldWindow; }
console.log('PASS_EARLY_EXTERNAL_FALLBACK_SOURCE_FIRST_AND_NO_RETRY_WHILE_ALTERNATIVE_PENDING_OR_READY');
console.log('PASS_C11_ARTWORK_VISIBLE_RECOVERY');
