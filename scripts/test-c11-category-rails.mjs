import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import React from 'react';
import { CatalogReadModel } from '../src/catalog/catalog-read-model.ts';
import * as selectors from '../src/catalog/catalog-selectors.ts';
import { SegmentedBrowseService } from '../src/catalog/segmented-browse.service.ts';
import * as order from '../src/catalog/category-presentation.ts';
import * as activity from '../src/catalog/series-content-updates.ts';
import { navigateTo, navigateBack } from '../src/ui/navigation/route-state.ts';

// Exact IDs, including a shared movie/series ID and similarly named categories.
const row = (kind, n, category) => ({ id: `${kind}-${n}`, title: `Synthetic ${n}`, categoryIds: [category], genreIds: [], artworkIds: [], streamIds: [], seasonIds: [], posterUri: `https://synthetic.invalid/${kind}-${n}.jpg` });
const movies = Array.from({ length: 90 }, (_, n) => row('movie', n, 'shared'));
const otherMovies = Array.from({ length: 7 }, (_, n) => row('movie', n + 90, 'similar'));
const series = Array.from({ length: 55 }, (_, n) => row('series', n, 'shared'));
const apple = Array.from({ length: 10 }, (_, n) => row('series', n + 55, 'apple'));
const segments = { m1: movies.slice(0, 37), m2: [...movies.slice(37), ...otherMovies], s1: series.slice(0, 29), s2: [...series.slice(29), ...apple] };
let reads = 0;
const storage = {
  async readActiveManifest() { return { snapshotId: 'rails-test', counts: { movies: 97, series: 65 }, segments: Object.keys(segments).map(name => ({ kind: name[0] === 'm' ? 'movies' : 'series', fileName: name + '.json' })) }; },
  async readActiveSegment(file) { reads++; return JSON.stringify(segments[file.split('/').at(-1).replace('.json', '')]); },
};
const service = new SegmentedBrowseService(storage, 'rails-test');
assert.equal((await service.loadPage('movies', undefined, 20, 'shared', { count: false })).items.length, 20);
async function collection(kind, category) {
  let cursor, items = [];
  do { const page = await service.loadPage(kind, cursor, 48, category, { count: false }); items.push(...page.items); cursor = page.nextCursor; } while (cursor);
  return items;
}
assert.deepEqual((await collection('movies', 'shared')).map(x => x.id), movies.map(x => x.id));
assert.deepEqual((await collection('series', 'shared')).map(x => x.id), series.map(x => x.id));
assert.deepEqual((await collection('series', 'apple')).map(x => x.id), apple.map(x => x.id));
assert.equal(await service.countItems('movies', 'shared'), 90);
assert.equal(await service.countItems('series', 'shared'), 55);
const countReads = reads;
assert.equal((await service.loadPage('series', undefined, 48, 'shared', { count: false })).items.length, 48);
assert.equal(reads, countReads, 'prefetched category first page is reused without segment IO');
console.log('PASS_PREVIEW20_COMPLETE90_AND55_EXACT_IDS_TYPED_PLATFORM_AND_CACHED_PAGE');

let route = { current: { view: 'home' }, history: [] };
route = navigateTo(route, 'movies'); route = navigateTo(route, 'movies', 'shared');
assert.equal(navigateTo(route, 'movies', 'shared'), route);
route = navigateTo(route, 'movie-detail', 'movie-0'); route = navigateBack(route);
assert.deepEqual(route.current, { view: 'movies', itemId: 'shared' });
route = navigateBack(route); assert.deepEqual(route.current, { view: 'movies', itemId: undefined });
route = navigateTo(route, 'series'); route = navigateTo(route, 'series', 'apple');
route = navigateTo(route, 'series-detail', 'series-60'); route = navigateBack(route);
assert.deepEqual(route.current, { view: 'series', itemId: 'apple' });
assert.deepEqual(order.orderCategoryItems(movies, 'Filmes | Lançamentos', 123), movies);
const first = order.orderCategoryItems(movies.slice(0, 48), 'Ação', 123);
assert.deepEqual(order.orderCategoryItems(movies, 'Ação', 123).slice(0, 48), first, 'append must not shuffle the displayed fold');
assert.deepEqual(order.orderCategoryItems(movies, 'Ação', 123), order.orderCategoryItems(movies, 'Ação', 123));
console.log('PASS_DETAIL_CATEGORY_OVERVIEW_BACK_DEDUP_RELEASE_ORDER_AND_STABLE_FOLDS');

const catalog = { metadata: { snapshotId: 'rails-test' }, categories: [{ id: 'movie-category', name: 'Filmes | Ação' }, { id: 'shared', name: 'Netflix' }, { id: 'similar', name: 'Filmes | Ação Extra' }, { id: 'apple', name: 'Apple TV' }], genres: [], movies: [...movies.map(x => ({ ...x, categoryIds: ['movie-category'] })), ...otherMovies], series: [...series, ...apple], seasons: [], episodes: [], streams: [], artworks: [] };
const model = new CatalogReadModel(catalog);
const passiveReact = { ...React, useState: initial => [typeof initial === 'function' ? initial() : initial, () => {}], useMemo: fn => fn(), useCallback: fn => fn, useRef: value => ({ current: value }), useEffect: () => {}, useLayoutEffect: () => {} };
const marker = name => Object.assign(() => null, { displayName: name });
const Hero = marker('Hero'), Grid = marker('Grid'), Rail = marker('Rail');
let hookArgs;
function load(file, imports) {
  const module = { exports: {} };
  const code = ts.transpileModule(readFileSync(new URL('../' + file, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React } }).outputText;
  new Function('require', 'module', 'exports', code)(name => {
    for (const [key, value] of Object.entries(imports)) if (name.includes(key)) return value;
    throw Error('Uncontrolled component dependency: ' + name);
  }, module, module.exports);
  return module.exports;
}
const imports = {
  react: { default: passiveReact, ...passiveReact }, 'catalog-selectors': selectors, 'category-presentation': order,
  'series-content-updates': activity, useSeriesHighlights: { useSeriesHighlights: () => [] },
  'segmented-browse.service': { SegmentedBrowseService }, 'bootstrap/client': { getClientBootstrapService: () => ({ getStorage: () => storage }) },
  'artwork-preload': { prefetchCatalogArtwork: () => {} },
  useCategoryPreviews: { useCategoryPreviews: () => undefined },
  useSegmentedBrowse: { useSegmentedBrowse: (kind, category, snapshot, initial) => {
    hookArgs = { kind, category, snapshot };
    const items = (kind === 'movies' ? catalog.movies : catalog.series).filter(x => !category || x.categoryIds.includes(category));
    return { items, totalAvailable: items.length, hasMore: true, loading: false, failed: false, loadNext() {}, prefetchCategory: async () => initial };
  } }, AsyncCategoryRail: { AsyncCategoryRail: Rail, SimpleRailQueue: class {} }, MediaRail: { MediaRail: marker('Featured') }, CategoryHero: { CategoryHero: Hero }, CatalogGrid: { CatalogGrid: Grid },
};
const { CatalogBrowsePage } = load('src/ui/pages/CatalogBrowsePage.tsx', imports);
function elements(tree) { const nodes = []; function walk(node) { if (!React.isValidElement(node)) return; nodes.push(node); React.Children.forEach(node.props.children, walk); } walk(tree); return nodes; }
let chosen;
const props = { readModel: model, onSelectItem() {}, onSelectCategory: id => { chosen = id; } };
for (const kind of ['movies', 'series']) {
  const overview = elements(CatalogBrowsePage({ ...props, kind }));
  const rails = overview.filter(x => x.type === Rail);
  assert.deepEqual(rails.map(x => x.props.categoryId), model.getCategoriesForKind(kind === 'movies' ? 'movie' : 'series').map(x => x.id));
  assert.equal(overview.some(x => x.type === Grid), false);
  for (const rail of rails) { assert.equal(rail.props.kind, kind); assert.equal(rail.props.maxItems, 20); assert.equal(rail.props.loadWhenVisible, true); assert.ok(rail.props.initialItems.length <= 20); rail.props.onViewAll(); assert.equal(chosen, rail.props.categoryId); }
  const categoryId = kind === 'movies' ? 'movie-category' : 'shared';
  const nodes = elements(CatalogBrowsePage({ ...props, kind, categoryId })), grid = nodes.find(x => x.type === Grid);
  assert.equal(hookArgs.category, categoryId); assert.equal(hookArgs.kind, kind);
  assert.equal(grid.props.autoLoadMore, true); assert.equal(grid.props.items.length, kind === 'movies' ? 90 : 55);
  assert.ok(grid.props.items.every(x => x.kind === (kind === 'movies' ? 'movie' : 'series') && x.categoryLabels.includes(kind === 'movies' ? 'Filmes | Ação' : 'Netflix')));
  assert.equal(nodes.filter(x => x.type === Rail).length, 0);
}
const invalid = elements(CatalogBrowsePage({ ...props, kind: 'series', categoryId: 'similar' }));
assert.equal(invalid.some(x => x.type === Grid || x.type === Hero), false, 'movie-only category must not show unrelated series');
console.log('PASS_REAL_OVERVIEW_TYPED_RAILS_COLLECTION_GRID_AND_INVALID_CATEGORY');

// Home must route by kind AND opaque category ID, never by a shared label/ID alone.
const { HomePage } = load('src/ui/pages/HomePage.tsx', {
  ...imports, useHomeHero: { useHomeHero: () => ({ candidates: [] }) },
  HomeHero: { HomeHero: Hero }, RecentTitles: { RecentTitles: marker('Recent') },
  MediaRail: { MediaRail: marker('Featured') }, EmptyState: { EmptyState: marker('Empty') },
  StartupArtworkPreparation: { StartupArtworkPreparation: marker('Startup') },
});
let homeRoute = { current: { view: 'home' }, history: [] };
const homeNodes = elements(HomePage({ readModel: model, onSelectItem() {},
  onSelectCategory: (kind, id) => { homeRoute = navigateTo(homeRoute, kind, id); } }));
const homeRails = homeNodes.filter(node => node.type === Rail);
assert.equal(homeRails.length, model.getCategoriesForKind('movie').length + model.getCategoriesForKind('series').length);
for (const rail of homeRails) {
  homeRoute = { current: { view: 'home' }, history: [] };
  assert.equal(typeof rail.props.onViewAll, 'function');
  rail.props.onViewAll();
  assert.deepEqual(homeRoute.current, { view: rail.props.kind, itemId: rail.props.categoryId });
  homeRoute = navigateTo(homeRoute, rail.props.kind === 'movies' ? 'movie-detail' : 'series-detail', 'synthetic-detail');
  homeRoute = navigateBack(homeRoute);
  assert.deepEqual(homeRoute.current, { view: rail.props.kind, itemId: rail.props.categoryId });
  assert.deepEqual(navigateBack(homeRoute).current, { view: 'home' });
}
const appText = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const homeInstances = appText.match(/<HomePage\b[^\n]+\/>/g) || [];
assert.equal(homeInstances.length, 4);
assert.ok(homeInstances.every(node => node.includes('onSelectCategory={(kind, id) => handleNavigate(kind, id)}')));
console.log('PASS_HOME_CATEGORY_VIEW_ALL_TYPED_ROUTE_DETAIL_BACK_HOME_AND_ALL_FALLBACKS');

const { MediaRail } = load('src/ui/components/MediaRail.tsx', {
  react: { default: passiveReact, ...passiveReact }, 'category-presentation': order,
  MediaCard: { MediaCard: marker('Card') }, useRailArtworkPreparation: { useRailArtworkPreparation: () => ({ root: { current: null }, prepare: false }) },
});
const items = movies.slice(0, 20).map(x => selectors.movieToViewModel(model, x));
let clicked = 0, focused = 0;
const railProps = { id: 'one', title: 'Netflix', items, onItemClick() {}, onViewAll: () => clicked++, onViewAllFocus: () => focused++ };
const actionNodes = elements(MediaRail.type(railProps));
const action = actionNodes.find(x => x.props.className?.includes('rail-view-all'));
assert.equal(action.props.children, 'Ver todos'); assert.equal(action.props['aria-label'], 'Ver todos: Netflix');
assert.ok(action.props.className.includes('focusable-item')); action.props.onClick(); action.props.onFocus(); assert.equal(clicked, 1); assert.equal(focused, 1);
assert.equal(actionNodes.filter(x => x.props.className === 'rail-scroll-btn').length, 0);
assert.equal(elements(MediaRail.type({ ...railProps, onViewAll: undefined })).filter(x => x.props.className === 'rail-scroll-btn').length, 2);
console.log('PASS_REAL_VIEW_ALL_ACCESSIBLE_ACTION_AND_CONTROLS_WITHOUT_COLLECTION_ACTION');

let queued, resolveQueue, updates = 0;
const effects = [], effectReact = { ...passiveReact, useState: initial => [typeof initial === 'function' ? initial() : initial, () => updates++], useEffect: effect => effects.push(effect) };
const { AsyncCategoryRail } = load('src/ui/components/AsyncCategoryRail.tsx', { react: { default: effectReact, ...effectReact }, 'catalog-selectors': selectors, 'category-presentation': order, 'artwork-visibility': { observeArtwork: () => () => {} }, MediaRail: { MediaRail: marker('LoadedRail') } });
let pageReads = 0;
AsyncCategoryRail.type({ id: 'queued', title: 'Netflix', kind: 'movies', categoryId: 'shared', initialItems: [{ ...items[0], posterUri: undefined }], readModel: model, maxItems: 20, loadWhenVisible: true, onItemClick() {}, browseService: { loadPage: async () => { pageReads++; return { items: movies.slice(0, 20) }; } }, queue: { add: fn => { queued = fn; return new Promise(r => { resolveQueue = r; }); } } });
const cleanups = effects.map(effect => effect()).filter(x => typeof x === 'function');
cleanups.forEach(cleanup => cleanup()); resolveQueue(await queued());
await new Promise(r => setTimeout(r, 0));
assert.equal(pageReads, 0); assert.equal(updates, 0, 'leaving page before queued read must not start IO or update unmounted UI');
console.log('PASS_REAL_QUEUED_RAIL_CANCEL_BEFORE_IO_AND_NO_STALE_UPDATE');

const tailRecords = [...movies].reverse().slice(0,20);
for (const loadWhenVisible of [false,true]) {
  const pendingEffects=[], values=[]; let requestedOrder;
  const releaseReact={...passiveReact,useState: initial=>[typeof initial==='function'?initial():initial,value=>values.push(value)],useEffect: effect=>pendingEffects.push(effect)};
  const actualRail=load('src/ui/components/AsyncCategoryRail.tsx',{react:{default:releaseReact,...releaseReact},'catalog-selectors':selectors,'category-presentation':order,'artwork-visibility':{observeArtwork:()=>()=>{}},MediaRail:{MediaRail:marker('LoadedRail')}}).AsyncCategoryRail;
  const tree=actualRail.type({id:'latest',title:'Filmes | Lan\u00e7amentos',kind:'movies',categoryId:'shared',initialItems:movies.slice(0,20).map(row=>selectors.movieToViewModel(model,row)),readModel:model,maxItems:20,loadWhenVisible,onItemClick(){},browseService:{loadPage:async(_kind,_cursor,_size,_category,options)=>{requestedOrder=options.order;return {items:tailRecords};},loadRailItems:async(_kind,_category,_size,selectedOrder)=>{requestedOrder=selectedOrder;return tailRecords;}}});
  assert.equal(tree.props.className,'media-rail media-rail-skeleton','a full obsolete first-fold must not bypass the release tail read');
  const cleanups=pendingEffects.map(effect=>effect()).filter(x=>typeof x==='function');await new Promise(r=>setTimeout(r,0));
  assert.equal(requestedOrder,'source-desc');assert.deepEqual(values.find(Array.isArray).map(item=>item.id),tailRecords.map(item=>item.id));cleanups.forEach(cleanup=>cleanup());
}
console.log('PASS_REAL_RELEASE_RAIL_REJECTS_OLD_FIRST20_WITH_POSTERS_HOME_AND_MOVIES_FALLBACK_DESCENDING');
service.dispose();
console.log('PASS_C11_CATEGORY_RAILS');
