import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import React from 'react';
import {parentalFixtureBindings} from './lib/parental-fixture-bindings.mjs';
import { CatalogReadModel } from '../src/catalog/catalog-read-model.ts';
import * as selectors from '../src/catalog/catalog-selectors.ts';
import * as presentation from '../src/catalog/category-presentation.ts';
import * as activity from '../src/catalog/series-content-updates.ts';
import * as adultPolicy from '../src/playback/content-adult-policy.ts';
import { watchFingerprint, resumeRecentWatch } from '../src/playback/watch-history.ts';
import { resolveRecentTitleBindings } from '../src/ui/recent-title-resolution.ts';
import { navigateTo, navigateBack } from '../src/ui/navigation/route-state.ts';

function load(file, imports) {
  const module = { exports: {} };
  const code = ts.transpileModule(readFileSync(new URL('../' + file, import.meta.url), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React } }).outputText;
  new Function('require', 'module', 'exports', code)(name => {
    const parental=parentalFixtureBindings(name);if(parental)return parental;
    if(name.includes('useHeroPlayback'))return {useHeroPlayback:()=>({})};
    if(name.includes('useCatalogReturnNavigation'))return {useCatalogGridReturn:()=>{}};
    if(name.includes('FavoriteTitles'))return {FavoriteTitles:()=>null};
    if(name.includes('startup-catalog-preview'))return {selectStartupPosters:()=>[]};
    if(name.includes('useFeaturedRotation'))return {useFeaturedRotation:model=>({movies:model.catalog.movies.slice(0,20).map(row=>selectors.movieToViewModel(model,row)),series:model.catalog.series.slice(0,20).map(row=>selectors.seriesToViewModel(model,row))})};
    for (const [key, value] of Object.entries(imports)) if (name.includes(key)) return value;
    throw Error('Uncontrolled dependency: ' + name);
  }, module, module.exports);
  return module.exports;
}
function elements(tree) { const nodes = []; function walk(node) { if (!React.isValidElement(node)) return; nodes.push(node); React.Children.forEach(node.props.children, walk); } walk(tree); return nodes; }
const passive = { ...React, useState: initial => [typeof initial === 'function' ? initial() : initial, () => {}], useMemo: fn => fn(), useRef: value => ({ current: value }), useEffect() {}, useLayoutEffect() {}, useCallback: fn => fn };
const marker = name => Object.assign(() => null, { displayName: name });
const Rail = marker('Rail'), Grid = marker('Grid'), Recent = marker('Recent');
const rows = kind => Array.from({ length: 30 }, (_, n) => ({ id: String(n), title: `Synthetic ${kind} ${n}`, categoryIds: [], genreIds: [], artworkIds: [], streamIds: [], seasonIds: [], posterUri: `https://synthetic.invalid/${kind}-${n}.jpg` }));
const movies = rows('movie'), series = rows('series');
const model = new CatalogReadModel({ metadata: { snapshotId: 'synthetic-home-collections' }, categories: [], genres: [], movies, series, seasons: series.map((s, n) => ({ id: 'season-' + n, seriesId: s.id, seasonNumber: 1, episodeIds: ['episode-' + n] })), episodes: series.map((s, n) => ({ id: 'episode-' + n, seriesId: s.id, seasonId: 'season-' + n, episodeNumber: 1, title: 'Synthetic episode', streamIds: [], artworkIds: [] })), streams: [], artworks: [] });
const { HomePage } = load('src/ui/pages/HomePage.tsx', {
  react: { default: passive, ...passive }, 'catalog-selectors': selectors, 'category-presentation': presentation,
  'series-content-updates': activity, useSeriesHighlights: { useSeriesHighlights: () => [] },
  'segmented-browse.service': { SegmentedBrowseService: class {} }, 'bootstrap/client': { getClientBootstrapService: () => ({ getStorage: () => ({}) }) },
  useCategoryPreviews: { useCategoryPreviews: () => undefined }, useHomeHero: { useHomeHero: () => ({}) },
  HomeHero: { HomeHero: marker('Hero') }, RecentTitles: { RecentTitles: Recent }, MediaRail: { MediaRail: Rail },
  AsyncCategoryRail: { AsyncCategoryRail: marker('Category'), SimpleRailQueue: class {} },
  EmptyState: { EmptyState: marker('Empty') }, StartupArtworkPreparation: { StartupArtworkPreparation: marker('Startup') },
});
let chosen;
const nodes = elements(HomePage({ readModel: model, onSelectItem() {}, onSelectCategory() {}, onSelectCollection: id => { chosen = id; } }));
nodes.find(n => n.type === Recent).props.onViewAll(); assert.equal(chosen, 'recent-watched');
for (const [title, id] of [['Filmes em Destaque', 'featured-movies'], ['Séries em Destaque', 'featured-series']]) {
  const row = nodes.find(n => n.type === Rail && n.props.title === title); assert.equal(row.props.items.length, 20);
  row.props.onViewAll(); assert.equal(chosen, id);
}
const { HomeCollectionPage, isHomeCollectionId } = load('src/ui/pages/HomeCollectionPage.tsx', { react: { default: passive, ...passive }, 'catalog-selectors': selectors, 'series-content-updates': activity, useSeriesHighlights: { useSeriesHighlights: () => [] }, CatalogGrid: { CatalogGrid: Grid }, RecentTitles: { RecentTitles: Recent } });
for (const id of ['recent-watched', 'featured-movies', 'featured-series']) {
  assert.equal(isHomeCollectionId(id), true);
  let route = { current: { view: 'home' }, history: [] };
  route = navigateTo(route, 'home', id); assert.equal(navigateTo(route, 'home', id), route);
  route = navigateTo(route, id === 'featured-series' ? 'series-detail' : 'movie-detail', '0');
  route = navigateBack(route); assert.deepEqual(route.current, { view: 'home', itemId: id });
  assert.deepEqual(navigateBack(route).current, { view: 'home' });
  let back = 0, selected;
  const page = elements(HomeCollectionPage({ collection: id, readModel: model, onSelectItem: item => { selected = item; }, onBack: () => { back++; } }));
  page.find(n => n.props.className?.includes('home-collection-back')).props.onClick(); assert.equal(back, 1);
  if (id === 'recent-watched') assert.equal(page.find(n => n.type === Recent).props.presentation, 'collection');
  else { const grid = page.find(n => n.type === Grid); assert.equal(grid.props.items.length, 20); assert.ok(grid.props.autoLoadMore); assert.ok(grid.props.items.every(item => item.kind === (id === 'featured-movies' ? 'movie' : 'series'))); grid.props.onItemClick(grid.props.items[0]); assert.equal(selected.id, '0'); }
}
for (const invalid of ['__proto__', 'unknown', 'movie-category', undefined, {}, ['recent-watched']]) assert.equal(isHomeCollectionId(invalid), false);
const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const instances = app.match(/<HomePage\b[^\n]+\/>/g); assert.equal(instances.length, 4);
assert.ok(instances.every(line => line.includes("onSelectCollection={id => handleNavigate('home', id)}")));
assert.ok(app.includes('if (isHomeCollectionId(itemId)) return <HomeCollectionPage'));
console.log('PASS_REAL_HOME_SPECIAL_VIEW_ALL_FEATURED20_WHITELIST_HISTORY_DETAIL_BACK_ALL_APP_FALLBACKS');

const records = Array.from({ length: 60 }, (_, n) => {
  const kind = n % 2 ? 'series' : 'movie', item = (kind === 'movie' ? movies : series)[Math.floor(n / 2)];
  return { kind, itemId: item.id, ...(kind === 'series' ? { episodeId: 'episode-' + item.id } : {}), fingerprint: watchFingerprint(kind, item), positionMs: (n + 1) * 1000, durationMs: 90000, updatedAt: 100000 - n, completed: false };
});
const tick = async () => { for (let n = 0; n < 12; n++) await Promise.resolve(); };
const playbackCalls = [], playback = { playMovie: async (...args) => { playbackCalls.push(['movie', ...args]); return { success: true }; }, playEpisode: async (...args) => { playbackCalls.push(['series', ...args]); return { success: true }; } };
async function recentPage(presentation, sourceRecords = records) {
  const states = [], effects = [], refs = []; let si = 0, ei = 0, ri = 0, tree, dirty = false;
  const react = { ...passive,
    useRef(value) { const n = ri++; return refs[n] || (refs[n] = { current: value }); },
    useState(initial) { const n = si++; if (!(n in states)) states[n] = typeof initial === 'function' ? initial() : initial; return [states[n], value => { const next = typeof value === 'function' ? value(states[n]) : value; if (!Object.is(next, states[n])) { states[n] = next; dirty = true; } }]; },
    useEffect(fn, deps) { const n = ei++, prior = effects[n]; if (!prior || deps.some((v, i) => !Object.is(v, prior.deps[i]))) effects[n] = { fn, deps, changed: true, oldCleanup: prior?.cleanup }; },
  };
  let unsubscribed = 0;
  const { RecentTitles } = load('src/ui/components/RecentTitles.tsx', { react: { default: react, ...react }, 'catalog-selectors': selectors,
    'content-adult-policy': adultPolicy,
    'recent-title-resolution': { resolveRecentTitleBindings }, 'bootstrap/client': { getClientBootstrapService: () => ({ getStorage: () => ({}) }) },
    'watch-history': { watchHistory: { list: () => sourceRecords, subscribe: () => () => { unsubscribed++; }, syncNativeProgress: async () => {} }, watchFingerprint, resumeRecentWatch },
    'playback.service': { defaultPlaybackService: playback }, MediaRail: { MediaRail: Rail }, CatalogGrid: { CatalogGrid: Grid },
  });
  const render = () => { si = ei = ri = 0; dirty = false; tree = RecentTitles({ readModel: model, presentation, onViewAll() {} }); };
  const flush = () => { for (let n = 0; n < 8; n++) { render(); for (const e of effects) if (e.changed) { e.changed = false; e.oldCleanup?.(); e.cleanup = e.fn(); } if (!dirty) break; } };
  flush(); await tick(); flush();
  return { nodes: () => elements(tree), async click(item) { elements(tree).find(n => n.type === (presentation === 'collection' ? Grid : Rail)).props.onItemClick(item); await tick(); flush(); }, clean() { for (const e of effects) e.cleanup?.(); assert.equal(unsubscribed, 1); } };
}
const railPage = await recentPage('rail'); assert.equal(railPage.nodes().find(n => n.type === Rail).props.items.length, 20); assert.equal(typeof railPage.nodes().find(n => n.type === Rail).props.onViewAll, 'function'); railPage.clean();
const recent = await recentPage('collection'); const grid = recent.nodes().find(n => n.type === Grid);
assert.equal(grid.props.items.length, 60); assert.ok(grid.props.autoLoadMore);
assert.deepEqual(grid.props.items.map(item => `${item.kind}:${item.id}`), records.map(r => `${r.kind}:${r.itemId}`));
assert.notEqual(grid.props.getItemKey(grid.props.items[0]), grid.props.getItemKey(grid.props.items[1]));
await recent.click(grid.props.items[0]); assert.equal(playbackCalls[0][0], 'movie'); assert.equal(playbackCalls[0][3].startPositionMs, records[0].positionMs);
await recent.click(grid.props.items[1]); assert.equal(playbackCalls[1][0], 'series'); assert.equal(playbackCalls[1][2], records[1].episodeId); assert.equal(playbackCalls[1][4].startPositionMs, records[1].positionMs); recent.clean();
const stale = await recentPage('collection', [{ ...records[0], fingerprint: '0000000000000000' }, ...records.slice(1)]); assert.equal(stale.nodes().find(n => n.type === Grid).props.items.length, 59); stale.clean();
const empty = await recentPage('collection', []); assert.equal(empty.nodes().find(n => n.type === Grid).props.emptyMessage, 'Nenhum título recente disponível no catálogo atual.'); empty.clean();
console.log('PASS_REAL_RECENT_COLLECTION60_CHRONOLOGY_FINGERPRINT_MOVIE_EPISODE_RESUME_POSITION_EMPTY_AND_CLEANUP');

const Card = marker('Card');
const { CatalogGrid } = load('src/ui/components/CatalogGrid.tsx', { react: { default: passive, ...passive }, 'catalog-view-model': { GRID_BATCH_SIZE: 48 }, MediaCard: { MediaCard: Card } });
const mixed = elements(CatalogGrid({ items: grid.props.items, onItemClick() {}, getItemKey: grid.props.getItemKey, autoLoadMore: true })).filter(n => n.type === Card);
assert.equal(mixed.length, 48); assert.equal(new Set(mixed.map(n => n.key)).size, 48);
const defaults = elements(CatalogGrid({ items: grid.props.items.filter(i => i.kind === 'movie'), onItemClick() {} })).filter(n => n.type === Card);
assert.equal(defaults[0].key, '0');
console.log('PASS_REAL_GRID_MIXED_KEYS_DISTINCT_DEFAULT_UNCHANGED_AUTOMATIC48');
