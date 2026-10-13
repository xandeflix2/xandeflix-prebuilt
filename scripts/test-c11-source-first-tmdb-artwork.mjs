import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { normalizeArtworkUri, chooseArtworkUri, displayArtworkUri } from '../src/artwork/artwork-uri.ts';
import { TmdbMetadataService, normalizeArtworkIdentity, artworkIdentityKey, selectTmdbMatch, tmdbPosterPath, chooseHeroPoster } from '../src/artwork/tmdb-metadata.service.ts';
import { RealSourceImporterService } from '../src/source/real-source-importer.service.ts';
import { CatalogReadModel } from '../src/catalog/catalog-read-model.ts';
import * as selectors from '../src/catalog/catalog-selectors.ts';
import * as categoryPresentation from '../src/catalog/category-presentation.ts';
import * as artworkPreload from '../src/artwork/artwork-preload.service.ts';

const print = console.log.bind(console);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const response = (value) => new Response(JSON.stringify(value), { status: 200 });
const publicDetails = (id) => ({ id, title: 'Fixture', original_title: 'Original fixture', original_name: 'Original series',
  release_date: '2020-01-01', first_air_date: '2020-01-01', poster_path: '/poster.jpg', backdrop_path: '/backdrop.jpg',
  overview: 'Sinopse de teste', runtime: 123, genres: [{ id: 1, name: 'Drama' }], ignored_secret: 'must-never-persist' });
const identity = { kind: 'movie', title: 'Fixture (2020) 4K', year: 2020 };
const source = 'https://source.synthetic.invalid/path//cover,a.jpg?size=300,450';
const provider = 'https://image.tmdb.org/t/p/w342/poster.jpg';
const failed = new Set();

assert.equal(normalizeArtworkUri(source), source);
assert.equal(normalizeArtworkUri('http://image.tmdb.org/t/p/w342/poster.jpg'), provider);
assert.equal(normalizeArtworkUri('https://tmdb.org.attacker.invalid/a'), 'https://tmdb.org.attacker.invalid/a');
for (const uri of ['javascript:alert(1)', 'file:///secret', 'https://user:password@host.invalid/a', 'data:image/svg+xml,x']) assert.equal(normalizeArtworkUri(uri), undefined);
assert.equal(chooseArtworkUri({ source, provider, kind: 'poster', failed }), source);
assert.equal(chooseArtworkUri({ source, provider, kind: 'poster', failed: new Set([source]) }), provider);
assert.equal(chooseArtworkUri({ source, fallback: source, provider, kind: 'backdrop', failed }), provider);
assert.equal(chooseArtworkUri({ source, fallback: 'https://source.synthetic.invalid/poster.jpg', provider, kind: 'backdrop', failed }), source);
assert.equal(chooseArtworkUri({ source, provider, kind: 'poster', failed: new Set([source, provider]) }), undefined);
assert.equal(chooseArtworkUri({ source, provider, providerPoster: source, kind: 'backdrop', tmdbBackdropOnly: true, failed }), provider);
assert.equal(chooseArtworkUri({ source, fallback: source, providerPoster: provider, kind: 'backdrop', tmdbBackdropOnly: true, failed }), undefined, 'vertical poster cannot fill a TMDB-only backdrop');
assert.equal(normalizeArtworkIdentity(identity).title, 'Fixture');
assert.equal(normalizeArtworkIdentity({ kind: 'movie', title: '1917' }).title, '1917');
assert.notEqual(artworkIdentityKey(identity), artworkIdentityKey({ ...identity, kind: 'series' }));
assert.equal(selectTmdbMatch(identity, [{ id: 1, title: 'Fixture', release_date: '2020-01-01' }])?.id, 1);
assert.equal(selectTmdbMatch(identity, [{ id: 1, title: 'Fixture', release_date: '1980-01-01' }]), null);
assert.equal(selectTmdbMatch({ ...identity, year: undefined, title: 'Fixture' }, [{ id: 1, title: 'Fixture' }, { id: 2, title: 'Fixture' }]), null);
assert.equal(selectTmdbMatch(identity, [{ id: 1, title: 'Fixture', release_date: '2019-01-01' }, { id: 2, title: 'Fixture', release_date: '2020-01-01' }])?.id, 2);
assert.equal(selectTmdbMatch({ ...identity, title: 'Different Fixture Title' }, [{ id: 1, title: 'Fixture Title', release_date: '2020-01-01' }]), null, 'year cannot rescue weak title similarity');
print('PASS URI_SOURCE_FIRST_AND_KIND_YEAR_MATCHING');
const ordered = Array.from({ length: 96 }, (_, id) => ({ id: String(id), posterUri: `cover-${id}` }));
const shuffled = categoryPresentation.orderCategoryItems(ordered, 'Drama', 123);
assert.notDeepEqual(shuffled.map((item) => item.id), ordered.map((item) => item.id));
assert.deepEqual(shuffled, categoryPresentation.orderCategoryItems(ordered, 'Drama', 123));
assert.notDeepEqual(shuffled, categoryPresentation.orderCategoryItems(ordered, 'Drama', 456));
assert.equal(new Set(shuffled.map((item) => item.id)).size, ordered.length);
assert.deepEqual(shuffled.slice(0, 48), categoryPresentation.orderCategoryItems(ordered.slice(0, 48), 'Drama', 123));
assert.ok(shuffled.every((item) => item.posterUri === `cover-${item.id}`));
assert.equal(ordered[0].id, '0', 'canonical order untouched');
for (const name of ['Lançamentos', 'FILMES | LANÇAMENTOS 2026', 'Series - Lancamento']) {
  assert.equal(categoryPresentation.isReleaseCategory(name), true);
  assert.deepEqual(categoryPresentation.orderCategoryItems(ordered, name, 123), ordered);
}
print('PASS_RANDOM_CATEGORY_ORDER_RELEASE_EXCEPTION_AND_APPEND_STABILITY');

// Real importer + read model: no provider call during import or selection.
const originalFetch = globalThis.fetch;
let forbiddenCalls = 0;
globalThis.fetch = async () => { forbiddenCalls++; throw new Error('Unexpected network'); };
const originalLogs = [console.log, console.info, console.warn];
console.log = console.info = console.warn = () => {};
let imported;
try {
  const lines = ['#EXTM3U', '#EXTINF:-1 group-title="Filmes",Filme sem capa', 'https://stream.synthetic.invalid/movie/1.mp4',
    `#EXTINF:-1 tvg-logo="${source}" group-title="Filmes",Filme com capa`, 'https://stream.synthetic.invalid/movie/2.mp4',
    '#EXTINF:-1 group-title="Series",Serie Fixture S01E01', 'https://stream.synthetic.invalid/series/1.mp4',
    `#EXTINF:-1 tvg-logo="${source}" group-title="Series",Serie Fixture S01E02`, 'https://stream.synthetic.invalid/series/2.mp4'];
  imported = await RealSourceImporterService.importM3u({ playlistUrl: 'https://source.synthetic.invalid/list.m3u' }, {
    fetchImpl: async () => new Response(lines.join('\n'), { status: 200 }),
    storage: { async writeStagingSegment() {}, async writeStaging() {} },
  });
} finally {
  [console.log, console.info, console.warn] = originalLogs;
  globalThis.fetch = originalFetch;
}
assert.equal(imported.success, true);
assert.equal(forbiddenCalls, 0);
const catalog = imported.catalog;
const model = new CatalogReadModel(catalog);
assert.equal(catalog.movies[1].posterUri, source);
assert.equal(catalog.series[0].posterUri, source, 'later episode cover is promoted to series');
assert.equal(catalog.artworks.length, 2);
assert.equal(catalog.metadata.counts.artworks, 2);
for (const item of [...catalog.movies, ...catalog.episodes]) for (const id of item.artworkIds) assert.ok(model.artworkById.has(id));
assert.equal(selectors.getHeroItem(model).id, catalog.movies[1].id);
catalog.movies[1].backdropUri = 'https://source.synthetic.invalid/horizontal.jpg';
catalog.movies[1].externalIds = { tmdbId: 99, sourceItemId: 'private-source-id' };
assert.equal(selectors.movieToViewModel(model, catalog.movies[1]).backdropUri, catalog.movies[1].backdropUri);
assert.equal(selectors.getMovieDetail(model, catalog.movies[1].id).backdropUri, catalog.movies[1].backdropUri);
assert.deepEqual(selectors.getMovieDetail(model, catalog.movies[1].id).externalIds, { tmdbId: 99 });
print('PASS REAL_M3U_LATE_SERIES_COVER_BOUNDED_REFERENCES_AND_SELECTORS_NO_API');

console.log = console.info = console.warn = () => {};
try {
  const lines = ['#EXTM3U'];
  for (let id = 1; id <= 260; id++) {
    lines.push(`#EXTINF:-1 tvg-logo="${source}" group-title="Filmes",Filme ${id}`, `https://stream.synthetic.invalid/movie/${id}.mp4`);
    lines.push(`#EXTINF:-1 tvg-logo="${source}" group-title="Series",Serie ${id} S01E01`, `https://stream.synthetic.invalid/series/${id}.mp4`);
  }
  const large = await RealSourceImporterService.importM3u({ playlistUrl: 'https://source.synthetic.invalid/list.m3u' }, {
    fetchImpl: async () => new Response(lines.join('\n'), { status: 200 }),
    storage: { async writeStagingSegment() {}, async writeStaging() {} },
  });
  assert.equal(large.success, true);
  assert.equal(large.catalog.metadata.counts.movies, 260);
  assert.equal(large.catalog.artworks.length, 200, 'only 100 movies + 100 episodes retained');
  assert.equal(large.segmentedStaging.manifest.counts.artworks, 200);
} finally { [console.log, console.info, console.warn] = originalLogs; }
print('PASS_FIRST_FOLD_ARTWORK_REGISTRY_BOUNDED_200');

let clock = Date.now();
let stored = null;
const storage = { getItem: () => stored, setItem: (_key, value) => { stored = value; } };
const requests = [];
const fetchImpl = async (url, options) => {
  const parsed = new URL(url);
  requests.push(parsed.pathname);
  assert.equal(parsed.hostname, 'api.themoviedb.org');
  assert.equal(options.headers.Authorization, 'Bearer synthetic-read-token');
  assert.equal(parsed.searchParams.get('language'), 'pt-BR');
  assert.ok(!url.includes('stream.synthetic') && !url.includes('source.synthetic'));
  return parsed.pathname.includes('/search/') ? response({ results: [{ id: 99, title: 'Fixture', name: 'Fixture', release_date: '2020-01-01', first_air_date: '2020-01-01' }] }) : response(publicDetails(99));
};
const service = new TmdbMetadataService({ credential: () => 'synthetic-read-token', fetchImpl, storage, now: () => clock });
const [a, b] = await Promise.all([service.resolve(identity), service.resolve(identity, 'high')]);
assert.deepEqual(a, b);
assert.equal(a.posterUri, provider);
assert.equal(a.backdropUri, 'https://image.tmdb.org/t/p/w1280/backdrop.jpg');
assert.equal(requests.length, 2, 'concurrent requests deduplicated');
await service.resolve(identity);
assert.equal(requests.length, 2);
await service.resolve({ ...identity, kind: 'series' });
assert.ok(requests.includes('/3/search/tv'));
await sleep(300);
assert.ok(!stored.includes('synthetic-read-token') && !stored.includes('ignored_secret') && !stored.includes('private-source-id'));
const restarted = new TmdbMetadataService({ credential: () => '', fetchImpl, storage, now: () => clock });
assert.equal((await restarted.resolve(identity)).tmdbId, 99, 'cache survives restart/offline');
clock += 31 * 24 * 60 * 60 * 1000;
assert.equal(restarted.peek(identity), null);
assert.equal(await restarted.resolve(identity), null);
await service.resolve({ kind: 'movie', title: 'https://private.invalid/user/password' });
assert.equal(requests.length, 4, 'locator title is never sent');
print('PASS DEDUP_PUBLIC_CACHE_RESTART_TTL_AND_REQUEST_BOUNDARY');

let release;
const gate = new Promise((resolve) => { release = resolve; });
let active = 0, maxActive = 0;
const order = [];
const bounded = new TmdbMetadataService({ credential: () => 'synthetic-read-token', fetchImpl: async (url) => {
  active++; maxActive = Math.max(maxActive, active);
  const id = Number(new URL(url).pathname.split('/').at(-1)); order.push(id);
  await gate; active--; return response(publicDetails(id));
} });
const jobs = Array.from({ length: 7 }, (_, index) => bounded.resolve({ kind: 'movie', title: 'Fixture', tmdbId: index + 1 }));
jobs.push(bounded.resolve({ kind: 'movie', title: 'Fixture', tmdbId: 999 }, 'high'));
for (let id = 10; id < 145; id++) jobs.push(bounded.resolve({ kind: 'movie', title: 'Fixture', tmdbId: id }));
assert.equal(order.length, 2);
release();
const values = await Promise.all(jobs);
assert.equal(maxActive, 2);
assert.equal(order[2], 999, 'hero/detail gets queue priority');
assert.equal(order.length, 130, '2 active + 128 queued maximum');
assert.ok(values.some((value) => value === null));
print('PASS_CONCURRENCY_TWO_QUEUE_128_AND_HERO_PRIORITY');

let calls = 0, offline = true;
clock = Date.now();
const transient = new TmdbMetadataService({ credential: () => 'synthetic-read-token', timeoutMs: 20, now: () => clock,
  fetchImpl: async () => { calls++; if (offline) return new Promise(() => {}); return response(publicDetails(5)); } });
const explicit = { kind: 'movie', title: 'Fixture', tmdbId: 5 };
assert.equal(await transient.resolve(explicit), null);
assert.equal(await transient.resolve(explicit), null);
assert.equal(calls, 1, 'timeout cooldown prevents storms');
offline = false; clock += 6000;
assert.equal((await transient.resolve(explicit)).tmdbId, 5, 'transient error is not cached as permanent miss');
let missingCalls = 0;
const missing = new TmdbMetadataService({ credential: () => 'synthetic-read-token', now: () => clock,
  fetchImpl: async () => { missingCalls++; return response({ results: [] }); } });
assert.equal(await missing.resolve(identity), null);
assert.equal(await missing.resolve(identity), null);
assert.equal(missingCalls, 1);
clock += 25 * 60 * 60 * 1000;
await missing.resolve(identity);
assert.equal(missingCalls, 2);
const quota = new TmdbMetadataService({ credential: () => 'synthetic-read-token', fetchImpl: async () => response(publicDetails(5)),
  storage: { getItem: () => { throw new Error('disabled'); }, setItem: () => { throw new Error('quota'); } } });
assert.equal((await quota.resolve(explicit)).tmdbId, 5);
await sleep(300);
print('PASS_TIMEOUT_RECOVERY_NEGATIVE_CACHE_EXPIRY_AND_STORAGE_FAILURE');

clock = Date.now();
let authenticated = false, authCalls = 0;
const rejected = new TmdbMetadataService({ credential: () => 'synthetic-read-token', now: () => clock, fetchImpl: async () => {
  authCalls++; return authenticated ? response(publicDetails(5)) : new Response('{}', { status: 401 });
} });
assert.equal(await rejected.resolve(explicit), null);
clock += 6000;
assert.equal(await rejected.resolve(explicit), null);
assert.equal(authCalls, 1);
clock += 16 * 60 * 1000; authenticated = true;
assert.equal((await rejected.resolve(explicit)).tmdbId, 5);
let largeStored;
const limited = new TmdbMetadataService({ credential: () => 'synthetic-read-token', fetchImpl: async (url) => response(publicDetails(Number(new URL(url).pathname.split('/').at(-1)))),
  storage: { getItem: () => null, setItem: (_key, value) => { largeStored = value; } } });
for (let id = 1; id <= 520; id++) await limited.resolve({ ...explicit, tmdbId: id });
await sleep(300);
assert.equal(JSON.parse(largeStored).entries.length, 512);
assert.equal(limited.peek({ ...explicit, tmdbId: 1 }), null);
assert.equal(limited.peek({ ...explicit, tmdbId: 520 }).tmdbId, 520);
print('PASS_AUTH_COOLDOWN_RECOVERY_AND_CACHE_512_ENTRIES');

// Actual TSX render with a public overlay: source metadata/art stays authoritative.
const require = createRequire(import.meta.url);
const overlay = { ...a, year: 2020 };
const uriModule = { normalizeArtworkUri, chooseArtworkUri, displayArtworkUri };
const providerModule = { artworkIdentityKey, tmdbPosterPath, chooseHeroPoster };
const hookModule = { useArtworkMetadata: () => overlay, useArtworkMetadataState: () => ({ metadata: overlay, pending: false }) };
const compiled = new Map();
function loadTsx(relative) {
  if (compiled.has(relative)) return compiled.get(relative);
  const code = ts.transpileModule(readFileSync(new URL(relative, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true },
  }).outputText;
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', code)((name) => {
    if (name === 'react') return { ...React, useLayoutEffect: React.useEffect };
    if (name.endsWith('.css')) return {};
    if (name.endsWith('artwork-file-cache.ts')) return { invalidateCachedArtworkUri() {} };
    if (name.endsWith('artwork-visibility.ts')) return { observeArtwork: () => () => {} };
    if (name.endsWith('NewContentProvider.tsx')) return { useContentBadge: () => undefined };
    if (name.endsWith('SeriesPersonalActions.tsx')) return { SeriesPersonalActions: () => null };
    if (name.endsWith('SeriesDetailSections.tsx')) return { SeriesDetailSections: () => null };
    if (name.endsWith('DetailTrailer.tsx')) return { DetailTrailer: () => null };
    if (name.endsWith('PhoneMovieDetail.tsx')) return { PhoneMovieDetail: () => null };
    if (name.endsWith('watch-history.ts')) return { watchFingerprint: () => 'synthetic-watch', watchHistory: {
      get: () => undefined, list: () => [], savedPosition: () => 0,
      subscribe: () => () => {}, syncNativeProgress: async () => {},
    } };
    if (name.endsWith('useHeroLayout.ts')) return { useHeroLayout: () => false };
    if (name.endsWith('useHeroPlayback.ts')) return { useHeroPlayback: () => ({ onPlay() {}, playbackBusy: false, playbackMessage: null }) };
    if (name.endsWith('useSeriesHighlights.ts')) return { useSeriesHighlights: () => [] };
    if (name.endsWith('series-content-updates.ts')) return { prioritizeSeries: (_recent, items, limit) => items.slice(0, limit) };
    if (name.endsWith('useCategoryPreviews.ts')) return { useCategoryPreviews: () => new Map() };
    if (name.endsWith('segmented-browse.service.ts')) return { SegmentedBrowseService: class {} };
    if (name.endsWith('bootstrap/client.ts')) return { getClientBootstrapService: () => ({ getStorage: () => ({}) }) };
    if (name.endsWith('AsyncCategoryRail.tsx')) return { AsyncCategoryRail: () => null, SimpleRailQueue: class {} };
    if (name.endsWith('MediaRail.tsx')) return { MediaRail: () => null };
    if (name.endsWith('CatalogBrowsePage.tsx')) return loadTsx('../src/ui/pages/CatalogBrowsePage.tsx');
    if (name.endsWith('BrowseHero.tsx')) return loadTsx('../src/ui/components/BrowseHero.tsx');
    if (name.endsWith('HomeHero.tsx')) return loadTsx('../src/ui/components/HomeHero.tsx');
    if (name.endsWith('useHomeHero.ts')) return { useHomeHero: (readModel, _storage, kind) => ({
      candidates: (kind === 'movie' ? readModel.catalog.movies : readModel.catalog.series).map(row => {
        const item = kind === 'movie' ? selectors.movieToViewModel(readModel, row) : selectors.seriesToViewModel(readModel, row);
        return { item, key: `${kind}:${row.id}` };
      }), nextBatch: async () => false, displayed() {},
    }) };
    if (name.endsWith('artwork-uri.ts')) return uriModule;
    if (name.endsWith('tmdb-metadata.service.ts')) return providerModule;
    if (name.endsWith('useArtworkMetadata.ts')) return hookModule;
    if (name.endsWith('useCachedArtwork.ts')) return {useCachedArtwork:uri=>({src:uri,handleCacheError:()=>false})};
    if (name.endsWith('useImmersiveArtwork.ts')) return {useImmersiveArtwork:()=>undefined};
    if (name.endsWith('CastButton.tsx')) return {CastButton:()=>null};
    if (name.endsWith('PhoneSeriesDetail.tsx')) return {PhoneSeriesDetail:()=>null};
    if (name.endsWith('usePhoneLayout.ts')) return {usePhoneLayout:()=>false};
    if (name.endsWith('useDetailInitialFocus.ts')) return {useDetailInitialFocus:()=>{}};
    if (name.endsWith('image-load-queue.ts')) return {loadImage:async()=>({ok:true,width:342,height:513}),isImageReady:()=>false,reserveHeroImageSlot:()=>()=>{}};
    if (name.endsWith('useHeroArtwork.ts')) return {useHeroArtwork:items=>({eligible:items.map(item=>({item,uri:overlay.backdropUri})),pending:false,revision:0,reject(){}})};
    if (name.endsWith('CategoryHero.tsx')) return loadTsx('../src/ui/components/CategoryHero.tsx');
    if (name.endsWith('RelatedTitles.tsx')) return {RelatedTitles:()=>null};
    if (name.endsWith('catalog-selectors.ts')) return selectors;
    if (name.endsWith('Artwork.tsx')) return loadTsx('../src/ui/components/Artwork.tsx');
    if (name.endsWith('Hero.tsx')) return loadTsx('../src/ui/components/Hero.tsx');
    if (name.endsWith('CatalogGrid.tsx')) return loadTsx('../src/ui/components/CatalogGrid.tsx');
    if (name.endsWith('MediaCard.tsx')) return loadTsx('../src/ui/components/MediaCard.tsx');
    if (name.endsWith('catalog-view-model.ts')) return { GRID_BATCH_SIZE: 48 };
    if (name.endsWith('category-presentation.ts')) return categoryPresentation;
    if (name.endsWith('artwork-preload.service.ts')) return artworkPreload;
    if (name.endsWith('useSegmentedBrowse.ts')) return { useSegmentedBrowse: (kind) => ({ items: catalog[kind], totalAvailable: catalog[kind].length, loading: false, hasMore: false, loadNext() {} }) };
    if (name.endsWith('playback.service.ts')) return { defaultPlaybackService: {} };
    return require(name);
  }, mod, mod.exports);
  compiled.set(relative, mod.exports); return mod.exports;
}
const { Artwork } = loadTsx('../src/ui/components/Artwork.tsx');
const originalError = console.error;
const warnings = [];
console.error = (...args) => warnings.push(args.join(' '));
try {
  let html = renderToStaticMarkup(React.createElement(Artwork, { title: 'Fixture', uri: source, identity, priority: 'high' }));
  assert.ok(html.includes('artwork-placeholder') && html.includes('aria-busy="true"'));
  assert.ok(!html.includes('<img'), 'SSR cannot claim that an unverified image is ready');
  html = renderToStaticMarkup(React.createElement(Artwork, { title: 'Fixture', identity }));
  assert.ok(html.includes('artwork-placeholder') && html.includes('aria-busy="true"'));
  const { Hero } = loadTsx('../src/ui/components/Hero.tsx');
  const heroItem = { ...selectors.movieToViewModel(model, catalog.movies[1]), overviewSnippet: 'Sinopse da fonte', yearFormatted: '1999' };
  html = renderToStaticMarkup(React.createElement(Hero, { item: heroItem, artworkUri: a.backdropUri, onSelect() {} }));
  assert.ok(html.includes('Sinopse da fonte') && html.includes('1999'));
  assert.ok(!html.includes('Sinopse de teste'));
  assert.ok(html.includes(a.backdropUri) && !html.includes('horizontal.jpg'), 'hero only uses TMDB backdrop');
  for (const [relative, prop] of [['MovieDetailPage', { movieId: catalog.movies[0].id }], ['SeriesDetailPage', { seriesId: catalog.series[0].id }]]) {
    const Page = loadTsx(`../src/ui/pages/${relative}.tsx`)[relative];
    html = renderToStaticMarkup(React.createElement(Page, { ...prop, readModel: model, onBack() {} }));
    assert.ok(html.includes('Sinopse de teste') && html.includes('2020') && html.includes('detail-backdrop-img'));
  }
  for (const name of ['MoviesPage', 'SeriesPage']) {
    const Page = loadTsx(`../src/ui/pages/${name}.tsx`)[name];
    html = renderToStaticMarkup(React.createElement(Page, { readModel: model, onSelectItem() {} }));
    assert.ok(html.includes('hero-banner') && html.includes(a.backdropUri), `${name} includes horizontal TMDB hero`);
    assert.ok(html.includes('<h2 class="hero-title">'));
  }
} finally { console.error = originalError; }
assert.deepEqual(warnings, [], 'React rendering must not emit warnings');
print('PASS_REACT_CARDS_HERO_MOVIE_SERIES_OVERLAY_WITH_SOURCE_METADATA_PRESERVED');
print('PASS_C11_SOURCE_FIRST_TMDB_ARTWORK');
