import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import React from 'react';
import { CatalogReadModel } from '../src/catalog/catalog-read-model.ts';
import * as selectors from '../src/catalog/catalog-selectors.ts';
import * as presentation from '../src/catalog/category-presentation.ts';
import * as activity from '../src/catalog/series-content-updates.ts';
import { navigateTo, navigateBack } from '../src/ui/navigation/route-state.ts';

const passive = { ...React, useState: init => [typeof init === 'function' ? init() : init, () => {}], useMemo: fn => fn(), useCallback: fn => fn, useRef: value => ({ current: value }), useEffect() {}, useLayoutEffect() {} };
const marker = name => Object.assign(() => null, { displayName: name });
const Category = marker('Category'), Featured = marker('Featured'), Hero = marker('Hero'), Grid = marker('Grid');
const read = file => readFileSync(new URL('../' + file, import.meta.url), 'utf8');
function load(file, extra = {}) {
  const ports = {
    react: { default: passive, ...passive }, 'catalog-selectors': selectors, 'category-presentation': presentation,
    'series-content-updates': activity, useSeriesHighlights: { useSeriesHighlights: () => [] },
    'segmented-browse.service': { SegmentedBrowseService: class {} }, 'bootstrap/client': { getClientBootstrapService: () => ({ getStorage: () => ({}) }) },
    'artwork-preload': { prefetchCatalogArtwork() {} }, useCategoryPreviews: { useCategoryPreviews: () => undefined },
    useSegmentedBrowse: { useSegmentedBrowse: (kind, category, snapshot, initial) => ({ items: initial, totalAvailable: initial.length, totalIsExact: true, loading: false, hasMore: false, prefetchCategory: async () => [] }) },
    AsyncCategoryRail: { AsyncCategoryRail: Category, SimpleRailQueue: class {} }, MediaRail: { MediaRail: Featured },
    CategoryHero: { CategoryHero: Hero }, CatalogGrid: { CatalogGrid: Grid }, ...extra,
  };
  const module = { exports: {} };
  new Function('require', 'module', 'exports', ts.transpileModule(read(file), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React } }).outputText)(name => {
    for (const [part, value] of Object.entries(ports)) if (name.includes(part)) return value;
    throw Error('Uncontrolled dependency ' + name);
  }, module, module.exports);
  return module.exports;
}
function elements(tree) { const nodes = []; const walk = node => { if (!React.isValidElement(node)) return; nodes.push(node); React.Children.forEach(node.props.children, walk); }; walk(tree); return nodes; }
const row = (kind, n, categoryIds) => ({ id: `${kind}-${n}`, title: 'Synthetic ' + n, categoryIds, genreIds: [], artworkIds: [], streamIds: [], seasonIds: [] });
const movies = Array.from({ length: 35 }, (_, n) => row('movie', n, [n < 10 ? 'national' : n < 20 ? 'release' : n < 30 ? 'action' : 'release4k']));
const series = Array.from({ length: 29 }, (_, n) => row('series', n, [n < 15 ? 'netflix' : 'disney']));
const catalog = { metadata: { snapshotId: 'synthetic-browse-featured' }, categories: [
  { id: 'national', name: 'Filmes | Nacionais' }, { id: 'netflix', name: 'SÉRIES | NETFLIX' },
  { id: 'action', name: 'Filmes | Ação' }, { id: 'release', name: 'Filmes | Lançamentos' },
  { id: 'disney', name: 'SÉRIES | DISNEY PLUS' }, { id: 'release4k', name: 'Filmes | Lancamentos 4K' },
], genres: [], movies, series, seasons: [], episodes: [], streams: [], artworks: [] };
const model = new CatalogReadModel(catalog), before = catalog.categories.map(row => row.id);
const { CatalogBrowsePage } = load('src/ui/pages/CatalogBrowsePage.tsx');
const { HomePage } = load('src/ui/pages/HomePage.tsx', {
  useHomeHero: { useHomeHero: () => ({}) },
  HomeHero: { HomeHero: Hero }, RecentTitles: { RecentTitles: marker('Recent') },
  EmptyState: { EmptyState: marker('Empty') },
  StartupArtworkPreparation: { StartupArtworkPreparation: marker('Startup') },
});
const base = { readModel: model, onSelectItem() {}, onSelectCategory() {}, onSelectCollection() {} };
const home = elements(HomePage(base));
for (const [kind, title, collection] of [['movies', 'Filmes em Destaque', 'featured-movies'], ['series', 'Séries em Destaque', 'featured-series']]) {
  let chosen, selected;
  const nodes = elements(CatalogBrowsePage({ ...base, kind, onSelectCollection: id => chosen = id, onSelectItem: item => selected = item }));
  const rows = nodes.filter(node => node.type === Category || node.type === Featured);
  assert.deepEqual(rows.map(node => node.props.title), kind === 'movies'
    ? ['Filmes | Lançamentos', 'Filmes | Lancamentos 4K', title, 'Filmes | Nacionais', 'Filmes | Ação']
    : [title, 'SÉRIES | NETFLIX', 'SÉRIES | DISNEY PLUS']);
  const featured = rows.find(node => node.type === Featured), reference = home.find(node => node.type === Featured && node.props.title === title);
  assert.deepEqual(featured.props.items, reference.props.items, 'Same canonical views and membership as Home');
  assert.equal(featured.props.items.length, 20); assert.equal(featured.props.preserveOrder, true);
  featured.props.onViewAll(); assert.equal(chosen, collection);
  featured.props.onItemClick(featured.props.items[0]); assert.equal(selected, featured.props.items[0]);
  assert.equal(new Set(rows.filter(node => node.type === Category).map(node => node.props.categoryId)).size, rows.filter(node => node.type === Category).length);
  assert.deepEqual(catalog.categories.map(row => row.id), before, 'Never mutate source category order');
  let route = { current: { view: kind }, history: [] };
  route = navigateTo(route, 'home', collection); route = navigateTo(route, kind === 'movies' ? 'movie-detail' : 'series-detail', 'synthetic');
  route = navigateBack(route); assert.deepEqual(route.current, { view: 'home', itemId: collection });
  assert.equal(navigateBack(route).current.view, kind, 'Back restores originating browse overview');
}
console.log('PASS_REAL_OVERVIEW_RELEASE_FIRST_FEATURED_HOME_MEMBERSHIP_SERIES_FIRST_VIEW_ALL_BACK');

for (const [kind, categoryId] of [['movies', 'national'], ['movies', 'release'], ['series', 'netflix']]) {
  let chosen;
  const nodes = elements(CatalogBrowsePage({ ...base, kind, categoryId, onSelectCategory: id => chosen = id }));
  assert.equal(nodes.filter(node => node.type === Featured || node.type === Category).length, 0);
  assert.ok(nodes.find(node => node.type === Grid));
  assert.ok(nodes.find(node => node.props['data-category-id'] === categoryId));
  assert.equal(chosen, undefined);
}
console.log('PASS_REAL_EXCLUSIVE_COLLECTION_NO_OVERVIEW_ROWS_OR_FOREIGN_CATEGORY');

const noRelease = new CatalogReadModel({ ...catalog, movies: movies.filter(row => !row.categoryIds.some(id => id.startsWith('release'))) });
const without = elements(CatalogBrowsePage({ ...base, readModel: noRelease, kind: 'movies' })).filter(node => node.type === Category || node.type === Featured);
assert.deepEqual(without.map(node => node.props.title), ['Filmes em Destaque', 'Filmes | Nacionais', 'Filmes | Ação']);
const empty = new CatalogReadModel({ ...catalog, movies: [], series: [] });
assert.equal(elements(CatalogBrowsePage({ ...base, readModel: empty, kind: 'series' })).some(node => node.type === Featured || node.type === Category), false);
console.log('PASS_REAL_NO_RELEASE_NO_SYNTHETIC_CATEGORY_EMPTY_NO_FEATURED');

const app = read('src/App.tsx');
for (const name of ['MoviesPage', 'SeriesPage']) assert.match(app, new RegExp('<' + name + '[\\s\\S]*?onSelectCollection=\\{id => handleNavigate\\(\'home\', id\\)\\}'));
console.log('PASS_APP_BOTH_BROWSE_COLLECTION_CALLBACKS_USE_EXISTING_ROUTE');
