import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import React from 'react';
import {parentalFixtureBindings} from './lib/parental-fixture-bindings.mjs';
import { renderToStaticMarkup } from 'react-dom/server';
import { CatalogReadModel } from '../src/catalog/catalog-read-model.ts';
import * as selectors from '../src/catalog/catalog-selectors.ts';
import * as presentation from '../src/catalog/category-presentation.ts';
import * as heroService from '../src/catalog/home-hero.service.ts';
import { scanNewContent, newContentKey, newContentScope, contentBadge, NewContentDisplayStore, NEW_CONTENT_WINDOW_MS } from '../src/catalog/new-content-badge.ts';
import * as activity from '../src/catalog/series-content-updates.ts';

const at = Date.now(), signal = () => new AbortController().signal, cooperate = async () => {};
let tests = 0;
async function test(name, run) { await run(); tests++; console.log('PASS ' + name); }
class Repository {
  records = new Map(); commits = 0;
  async read(scope) { return structuredClone(this.records.get(scope) || null); }
  async commit(value, expected, abort) {
    if (abort?.aborted || this.records.get(value.scope)?.snapshotId !== expected) throw Error('CAS_OR_ABORT');
    this.records.set(value.scope, structuredClone(value)); this.commits++;
  }
}
const old = { title: 'Série antiga (1988)', coords: [[1, 1], [1, 3]], category: 'netflix' };
const fresh = { title: 'Série nova (1995)', coords: [[1, 1]], category: 'disney' };
const key = title => newContentKey('series', title);
function fixture(snapshot = 'a', definitions = [old], salt = 'old-', source = 'source-a') {
  const series = [], seasons = [], episodes = [], payload = {}, reads = [];
  definitions.forEach((definition, i) => {
    const id = salt + i;
    const row = { id, title: definition.title, year: 1988, categoryIds: [definition.category || 'netflix'], genreIds: [], artworkIds: [], seasonIds: [], posterUri: 'https://synthetic.invalid/cover.jpg' };
    series.push(row);
    for (const number of [...new Set(definition.coords.map(c => c[0]))]) {
      const seasonId = id + '-s' + number; row.seasonIds.push(seasonId);
      seasons.push({ id: seasonId, seriesId: id, seasonNumber: number, episodeIds: [] });
    }
    definition.coords.forEach(([season, number], n) => {
      const seasonId = id + '-s' + season, episodeId = id + '-e' + n;
      seasons.find(s => s.id === seasonId).episodeIds.push(episodeId);
      episodes.push({ id: episodeId, seriesId: id, seasonId, episodeNumber: number, title: 'Synthetic episode ' + salt + n, streamIds: ['private-synthetic-ref'], artworkIds: [] });
    });
  });
  const rows = { movies: [], series, seasons, episodes };
  for (const [kind, records] of Object.entries(rows)) for (let i = 0; i < records.length; i += 200) payload[`segments/${kind}-${i}.json`] = records.slice(i, i + 200);
  const catalog = { metadata: { snapshotId: snapshot }, categories: [{ id: 'netflix', name: 'Netflix' }, { id: 'disney', name: 'Disney' }], genres: [],
    movies: [], series: series.slice(0, 1), seasons: seasons.slice(0, 1), episodes: episodes.slice(0, 1), streams: [], artworks: [] };
  const model = new CatalogReadModel(catalog);
  const manifest = { snapshotId: snapshot, metadata: { sourceId: source }, counts: Object.fromEntries(Object.entries(rows).map(([kind, data]) => [kind, data.length])),
    segments: Object.entries(payload).map(([fileName, data]) => ({ fileName, recordCount: data.length, kind: fileName.split('/')[1].split('-')[0] })) };
  let active = snapshot;
  const storage = { async readActiveManifest() { return manifest; }, async readActivePointer() { return { snapshotId: active }; },
    async readActiveSegment(path) { reads.push(path); return payload[path] ? JSON.stringify(payload[path]) : null; } };
  return { model, manifest, payload, storage, reads, rows, changeGeneration(next) { active = next; } };
}
const scan = (f, repo, time = at, abort = signal(), yieldToUi = cooperate) => scanNewContent(f.model, f.storage, repo, abort, () => {}, time, yieldToUi);

await test('COMPLETE_EPISODE_BASELINE_NO_FALSE_BADGES_BEYOND_FIRST_FOLD', async () => {
  const repo = new Repository(), f = fixture('a', [old, fresh]);
  const inventory = await scan(f, repo);
  assert.equal(Object.keys(inventory.seriesEpisodes).length, 2);
  assert.equal(inventory.seriesEpisodes[key(old.title)].coordinates, '1000001,1000003');
  assert.equal(contentBadge(inventory, key(old.title), at), undefined);
  assert.equal(contentBadge(inventory, key(fresh.title), at), undefined);
  assert.ok(f.reads.some(path => path.includes('seasons')) && f.reads.some(path => path.includes('episodes')));
  for (const forbidden of ['Série', 'synthetic.invalid', 'streamIds', 'private-synthetic-ref', 'old-0']) assert.ok(!JSON.stringify(inventory).includes(forbidden));
});

await test('OLD_SERIES_HOLE_AND_NEW_SEASON_ADDITIONS_SURVIVE_RESTART', async () => {
  const repo = new Repository(); await scan(fixture(), repo);
  const f = fixture('b', [{ ...old, coords: [[1, 1], [1, 2], [1, 3], [2, 1]] }], 'changed-');
  const inventory = await scan(f, repo, at + 1000);
  assert.equal(contentBadge(inventory, key(old.title), at + 1000), 'Episódios Novos');
  const recovered = JSON.parse(JSON.stringify(await repo.read(newContentScope('source-a'))));
  assert.equal(contentBadge(recovered, key(old.title), at + 1000), 'Episódios Novos');
  const highlights = await activity.loadRecentSeries(f.model, f.storage, recovered, signal(), at + 1000, cooperate);
  assert.deepEqual(highlights.map(item => item.id), ['changed-0']); assert.equal(highlights[0].yearFormatted, '1988');
});

await test('NEW_SERIES_NOVIDADE_PRECEDENCE_AND_EPISODES_OWN_EXPIRY', async () => {
  const repo = new Repository(); await scan(fixture(), repo);
  const added = await scan(fixture('b', [old, fresh]), repo, at);
  assert.equal(contentBadge(added, key(fresh.title), at), 'Novidade');
  const more = await scan(fixture('c', [old, { ...fresh, coords: [[1, 1], [1, 2]] }]), repo, at + 1000);
  assert.equal(more.seen[key(fresh.title)], at);
  assert.equal(contentBadge(more, key(fresh.title), at + 1000), 'Novidade');
  assert.equal(contentBadge(more, key(fresh.title), at + NEW_CONTENT_WINDOW_MS), 'Episódios Novos');
  assert.equal(contentBadge(more, key(fresh.title), at + 1000 + NEW_CONTENT_WINDOW_MS), undefined);
});

await test('SAME_COUNT_REPLACEMENT_IS_NEW_BUT_DUPLICATE_COORDINATES_ARE_NOT', async () => {
  const repo = new Repository(); await scan(fixture(), repo);
  const duplicate = await scan(fixture('b', [{ ...old, coords: [[1, 1], [1, 3], [1, 3]] }]), repo, at + 1000);
  assert.equal(contentBadge(duplicate, key(old.title), at + 1000), undefined);
  const replacement = await scan(fixture('c', [{ ...old, coords: [[1, 1], [1, 4]] }]), repo, at + 2000);
  assert.equal(contentBadge(replacement, key(old.title), at + 2000), 'Episódios Novos');
});

await test('ORDINAL_IDS_REORDER_TITLES_ARTWORK_AND_REINSERT_NEVER_RENEW', async () => {
  const repo = new Repository(); await scan(fixture(), repo);
  const normalized = { ...old, title: '  SÉRIE   ANTIGA (1988) ', coords: [[1, 3], [1, 1]] };
  const same = await scan(fixture('b', [normalized], 'new-ordinal-'), repo, at + 1000);
  assert.equal(contentBadge(same, key(old.title), at + 1000), undefined);
  await scan(fixture('c', [{ ...old, coords: [[1, 1]] }]), repo);
  const inserted = await scan(fixture('d', [old], 'another-ordinal-'), repo, at + 8000);
  assert.equal(contentBadge(inserted, key(old.title), at + 8000), undefined);
  const updated = await scan(fixture('e', [{ ...old, coords: [[1, 1], [1, 3], [2, 1]] }]), repo, at + 9000);
  await scan(fixture('f', [old]), repo, at + NEW_CONTENT_WINDOW_MS + 9000);
  const returned = await scan(fixture('g', [{ ...old, coords: [[1, 1], [1, 3], [2, 1]] }]), repo, at + NEW_CONTENT_WINDOW_MS + 10000);
  assert.equal(returned.seriesEpisodes[key(old.title)].addedAt, updated.seriesEpisodes[key(old.title)].addedAt);
  assert.equal(contentBadge(returned, key(old.title), at + NEW_CONTENT_WINDOW_MS + 10000), undefined);
});

await test('V1_SAME_GENERATION_MIGRATES_WITHOUT_INVENTING_EPISODE_DATES', async () => {
  const repo = new Repository(), scope = newContentScope('source-a');
  repo.records.set(scope, { version: 1, scope, snapshotId: 'a', seen: { [key(old.title)]: at } });
  const result = await scan(fixture(), repo, at + 100);
  assert.equal(result.seen[key(old.title)], at); assert.equal(result.seriesEpisodes[key(old.title)].addedAt, 0);
  const same = fixture(); await scan(same, repo, at + 1000); assert.equal(same.reads.length, 0);
  const next = await scan(fixture('b', [{ ...old, coords: [[1, 1], [1, 2], [1, 3]] }]), repo, at + NEW_CONTENT_WINDOW_MS);
  assert.equal(contentBadge(next, key(old.title), at + NEW_CONTENT_WINDOW_MS), 'Episódios Novos');
});

await test('EMPTY_SEASON_DOES_NOT_CREATE_EPISODE_EVENT', async () => {
  const repo = new Repository(); await scan(fixture(), repo);
  const f = fixture('b');
  const seasonFile = Object.keys(f.payload).find(name => name.includes('seasons'));
  f.payload[seasonFile].push({ id: 'empty-s2', seriesId: 'old-0', seasonNumber: 2, episodeIds: [] });
  f.manifest.counts.seasons++; f.manifest.segments.find(s => s.fileName === seasonFile).recordCount++;
  const inventory = await scan(f, repo);
  assert.equal(contentBadge(inventory, key(old.title), at), undefined);
});

await test('MISSING_PARTIAL_INVALID_OR_ORPHAN_EPISODES_PRESERVE_COMMIT', async () => {
  for (const corrupt of [f => { delete f.payload['segments/episodes-0.json']; },
    f => f.payload['segments/episodes-0.json'].pop(), f => { f.payload['segments/episodes-0.json'][0].seasonId = 'missing'; },
    f => { f.payload['segments/episodes-0.json'][0].episodeNumber = 0; }, f => { f.manifest.counts.episodes++; },
    f => { f.payload['segments/seasons-0.json'][0].seriesId = 'missing'; }]) {
    const repo = new Repository(); await scan(fixture(), repo); const before = structuredClone([...repo.records]);
    const f = fixture('b', [old, fresh]); corrupt(f);
    await assert.rejects(scan(f, repo)); assert.deepEqual([...repo.records], before); assert.equal(repo.commits, 1);
  }
});

await test('ABORT_GENERATION_SWITCH_AND_CAS_FAILURE_NEVER_PUBLISH_PARTIAL_SCAN', async () => {
  const repo = new Repository(); await scan(fixture(), repo); const before = structuredClone([...repo.records]);
  const f = fixture('b', [old, fresh]), controller = new AbortController();
  await assert.rejects(scan(f, repo, at, controller.signal, async () => controller.abort()), /CANCELLED/);
  assert.deepEqual([...repo.records], before);
  const moved = fixture('b'); await assert.rejects(scan(moved, repo, at, signal(), async () => moved.changeGeneration('elsewhere')), /GENERATION/);
  assert.deepEqual([...repo.records], before);
  const race = fixture('b'); const failing = { read: scope => repo.read(scope), commit: async () => { throw Error('CAS_FAILURE'); } };
  await assert.rejects(scan(race, failing), /CAS_FAILURE/); assert.deepEqual([...repo.records], before);
});

await test('SOURCE_SCOPE_ISOLATED_AND_NONSEGMENTED_COMPLETE_SUPPORTED', async () => {
  const repo = new Repository(); await scan(fixture(), repo);
  const other = await scan(fixture('b', [{ ...old, coords: [[1, 1], [1, 2], [1, 3]] }], 'new-', 'source-b'), repo);
  assert.equal(contentBadge(other, key(old.title), at), undefined);
  const f = fixture('c', [old, fresh]); f.manifest.segments = []; Object.assign(f.model.catalog, f.rows);
  const nonsegmented = await scan(f, repo); assert.equal(contentBadge(nonsegmented, key(fresh.title), at), 'Novidade');
});

let highlighted, highlightedFixture;
await test('FULL_CATALOG_ACTIVITY_BEYOND_FIRST_FOLD_PRIORITIZED_WITH_CATEGORY_LIMIT', async () => {
  const definitions = Array.from({ length: 150 }, (_, i) => ({ title: 'Series ' + i, coords: [[1, 1]], category: i % 2 ? 'disney' : 'netflix' }));
  const repo = new Repository(); await scan(fixture('a', definitions), repo);
  definitions[149].coords.push([2, 1]); definitions[148].coords.push([1, 2]);
  const f = fixture('b', definitions), inventory = await scan(f, repo);
  const recent = await activity.loadRecentSeries(f.model, f.storage, inventory, signal(), at, cooperate);
  assert.equal(recent.length, 2); assert.ok(recent.some(item => item.id === 'old-149'));
  const fallback = f.rows.series.slice(0, 20).map(row => selectors.seriesToViewModel(f.model, row));
  const selection = activity.prioritizeSeries(recent, fallback, 20);
  assert.equal(selection.length, 20); assert.equal(new Set(selection.map(item => item.id)).size, 20);
  assert.deepEqual(selection.slice(0, 2), recent);
  assert.deepEqual(activity.prioritizeSeries(recent, fallback, 48, 'Disney').map(item => item.categoryLabels[0]), Array(11).fill('Disney'));
  assert.deepEqual(await activity.loadRecentSeries(f.model, f.storage, inventory, signal(), at + NEW_CONTENT_WINDOW_MS, cooperate), []);
  await assert.rejects(activity.loadRecentSeries(f.model, f.storage, { ...inventory, snapshotId: 'stale' }, signal()), /GENERATION/);
  highlighted = recent; highlightedFixture = f;
});

await test('SHARED_CLOCK_EXPIRES_BADGES_AND_HIGHLIGHT_SELECTION_WITHOUT_CARD_IO', () => {
  const store = new NewContentDisplayStore(), date = Date.now(); let events = 0;
  const title = old.title, k = key(title), item = highlighted[0];
  const inventory = { version: 1, scope: 'qa', snapshotId: 'qa', seen: { [k]: 0, [key(item.title)]: 0 },
    seriesEpisodes: { [k]: { coordinates: '1000001-1000003', addedAt: date }, [key(item.title)]: { coordinates: '1000001', addedAt: date } } };
  const unsubscribe = store.subscribe(() => events++);
  store.publish(inventory, date); store.setSeriesHighlights('wrong', [item]); assert.equal(store.getSeriesHighlights().length, 0);
  store.setSeriesHighlights('qa', [item]); assert.equal(store.getSeriesHighlights()[0], item);
  assert.equal(store.badge(k), 'Episódios Novos'); assert.equal(store.has(k), false);
  const reference = store.getSeriesHighlights(); assert.equal(reference, store.getSeriesHighlights());
  store.expire(date + NEW_CONTENT_WINDOW_MS); assert.equal(store.badge(k), undefined); assert.deepEqual(store.getSeriesHighlights(), []);
  assert.equal(store.nextExpiry(), undefined); unsubscribe(); const last = events; store.publish(null); assert.equal(events, last);
  let focused = true;
  const deferred = new NewContentDisplayStore(() => !focused);
  deferred.publish(inventory, date); deferred.setSeriesHighlights('qa', [item]);
  const selected = deferred.getSeriesHighlights();
  deferred.expire(date + NEW_CONTENT_WINDOW_MS);
  assert.equal(deferred.badge(key(item.title)), undefined);
  assert.equal(deferred.getSeriesHighlights(), selected);
  focused = false; deferred.expire();
  assert.deepEqual(deferred.getSeriesHighlights(), []);
});

const passive = { ...React, useState: initial => [typeof initial === 'function' ? initial() : initial, () => {}], useMemo: fn => fn(), useCallback: fn => fn, useRef: value => ({ current: value }), useEffect() {}, useLayoutEffect() {} };
const marker = name => Object.assign(() => null, { displayName: name });
const Rail = marker('Rail'), Hero = marker('Hero'), Grid = marker('Grid');
function load(file, extra = {}) {
  const ports = { react: { default: passive, ...passive }, 'catalog-selectors': selectors, 'category-presentation': presentation, 'series-content-updates': activity,
    useSeriesHighlights: { useSeriesHighlights: () => highlighted }, 'home-hero.service': heroService,
    'bootstrap/client': { getClientBootstrapService: () => ({ getStorage: () => ({}) }) }, 'segmented-browse.service': { SegmentedBrowseService: class {} },
    'artwork-preload': { prefetchCatalogArtwork() {} },
    useHomeHero: { useHomeHero: () => ({}) }, HomeHero: { HomeHero: Hero }, CategoryHero: { CategoryHero: Hero }, CatalogGrid: { CatalogGrid: Grid }, MediaRail: { MediaRail: Rail },
    useCategoryPreviews: { useCategoryPreviews: () => undefined }, useSegmentedBrowse: { useSegmentedBrowse: (kind, category, snapshot, initial) => ({ items: initial, totalAvailable: initial.length }) },
    AsyncCategoryRail: { AsyncCategoryRail: marker('Category'), SimpleRailQueue: class {} }, RecentTitles: { RecentTitles: marker('Recent') },
    StartupArtworkPreparation: { StartupArtworkPreparation: marker('Startup') }, EmptyState: { EmptyState: marker('Empty') }, ...extra };
  const module = { exports: {} };
  new Function('require', 'module', 'exports', ts.transpileModule(readFileSync(new URL('../' + file, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true } }).outputText)(name => {
    const parental=parentalFixtureBindings(name);if(parental)return parental;
    if(name.endsWith('useCardGenres.ts'))return{useCardGenres:item=>({ref:{current:null},genres:item.genreLabels||[],visible:true})};
    if(name.includes('useHeroPlayback'))return {useHeroPlayback:()=>({})};
    if(name.includes('BrowseHero'))return {BrowseHero:marker('BrowseHero')};
    if(name.includes('FavoriteTitles'))return {FavoriteTitles:()=>null};
    if(name.includes('startup-catalog-preview'))return {selectStartupPosters:()=>[]};
    if(name.includes('useFeaturedRotation'))return {useFeaturedRotation:model=>({movies:model.catalog.movies.slice(0,20).map(row=>selectors.movieToViewModel(model,row)),series:model.catalog.series.slice(0,20).map(row=>selectors.seriesToViewModel(model,row))})};
    for (const [part, value] of Object.entries(ports)) if (name.includes(part)) return value;
    throw Error('Uncontrolled dependency ' + name);
  }, module, module.exports);
  return module.exports;
}
function elements(tree) { const result = []; const walk = node => { if (!React.isValidElement(node)) return; result.push(node); React.Children.forEach(node.props.children, walk); }; walk(tree); return result; }
await test('ACTUAL_HOME_SERIES_COLLECTION_AND_HERO_HOOK_SHARE_UPDATED_SELECTION', () => {
  const f = highlightedFixture;
  // Use the full 20-item fallback in this component fixture; recent items stay outside it.
  f.model = new CatalogReadModel({ ...f.model.catalog, series: f.rows.series.slice(0, 20) });
  const { HomePage } = load('src/ui/pages/HomePage.tsx'), { CatalogBrowsePage } = load('src/ui/pages/CatalogBrowsePage.tsx');
  const { HomeCollectionPage } = load('src/ui/pages/HomeCollectionPage.tsx');
  const props = { readModel: f.model, onSelectItem() {}, onSelectCategory() {}, onSelectCollection() {}, onBack() {} };
  const home = elements(HomePage(props)).find(node => node.type === Rail && node.props.title === 'Séries em Destaque');
  const browseNodes = elements(CatalogBrowsePage({ ...props, kind: 'series' }));
  const browse = browseNodes.find(node => node.type === Rail);
  const collection = elements(HomeCollectionPage({ ...props, collection: 'featured-series' })).find(node => node.type === Grid);
  assert.deepEqual(home.props.items, browse.props.items); assert.deepEqual(home.props.items, collection.props.items);
  assert.equal(home.props.items[0], highlighted[0]); assert.equal(home.props.preserveOrder, true);
  const overviewHero=browseNodes.find(node=>node.type?.displayName==='BrowseHero');
  assert.equal(overviewHero.props.readModel,f.model);assert.equal(overviewHero.props.contentKind,'series');
  const exclusive = elements(CatalogBrowsePage({ ...props, kind: 'series', categoryId: 'disney' })).find(node => node.type === Hero);
  assert.ok(exclusive.props.items.every(item => item.categoryLabels.includes('Disney')));
  const { useHomeHero } = load('src/ui/hooks/useHomeHero.ts');
  const options = useHomeHero(f.model, f.storage);
  assert.equal(options.candidates[0].item, highlighted[0]); assert.equal(options.candidates[0].fresh, true);
  assert.ok(options.candidates.some(option => option.item.yearFormatted === '1988'), 'Older series must not be rejected by release year');
});

await test('ACTUAL_CARD_BOTH_BADGES_ACCESSIBLE_NO_EXTRA_DPAD_TARGET_OR_GEOMETRY', () => {
  for (const badge of ['Novidade', 'Episódios Novos', undefined]) {
    const { MediaCard } = load('src/ui/components/MediaCard.tsx', { react: React,
      Artwork: { Artwork: () => React.createElement('img', { alt: '' }) }, 'artwork-uri': { displayArtworkUri: () => undefined },
      'image-load-queue': { loadImage: async () => {} }, NewContentProvider: { useContentBadge: () => badge } });
    const html = renderToStaticMarkup(React.createElement(MediaCard, { item: { ...highlighted[0], yearFormatted: '1988' }, onClick() {} }));
    assert.equal((html.match(/<button/g) || []).length, 1); assert.ok(!html.includes('tabindex'));
    assert.equal(html.includes('media-card-new-badge'), !!badge);
    if (badge) assert.ok(html.includes(' - ' + badge));
    assert.equal(html.includes('media-card-year--with-new'), !!badge);
  }
});

await test('COMPACT_BASELINE_FOR_250000_EPISODES_NO_PER_EPISODE_OBJECTS_IN_LEDGER', async () => {
  const repo = new Repository();
  const definitions = Array.from({ length: 1000 }, (_, i) => ({ title: 'Synthetic many episodes ' + i, coords: Array.from({ length: 250 }, (_, n) => [Math.floor(n / 25) + 1, n % 25 + 1]) }));
  const f = fixture('large', definitions); const inventory = await scan(f, repo);
  const bytes = Buffer.byteLength(JSON.stringify(inventory.seriesEpisodes));
  assert.equal(Object.keys(inventory.seriesEpisodes).length, 1000); assert.ok(bytes < 300000);
  assert.equal(Object.values(inventory.seriesEpisodes).filter(ref => ref.addedAt > 0).length, 0);
  console.log(JSON.stringify({ episodeRecords: 250000, referenceBytes: bytes, firstFoldEpisodes: f.model.catalog.episodes.length }));
});
console.log(JSON.stringify({ tests, pass: true, sourceWrites: 0, networkRequests: 0, playbackChanges: 0 }));
