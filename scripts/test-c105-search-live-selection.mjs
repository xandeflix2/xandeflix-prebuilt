import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { resolveSegmentRelativePath } from '../src/bootstrap/storage/segment-path-resolver.ts';
import { CompactSearchIndexV2Builder } from '../src/experiments/search-compact-v2/compact-search-v2-builder.ts';
import { serializeCompactIndexV2 } from '../src/experiments/search-compact-v2/compact-search-v2-serializer.ts';
import { CompactSearchEngineV2Pruned } from '../src/experiments/search-compact-v2-pruned/compact-search-v2-pruned-engine.ts';
import { navigateTo, navigateBack } from '../src/ui/navigation/route-state.ts';

const source = name => readFileSync(new URL('../' + name, import.meta.url), 'utf8');
function load(name, require) {
  const module = { exports: {} };
  const code = ts.transpileModule(source(name), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React } }).outputText;
  new Function('require', 'module', 'exports', code)(require, module, module.exports);
  return module.exports;
}
let tests = 0;
async function test(name, run) { await run(); tests++; console.log('PASS ' + name); }
const tick = () => new Promise(resolve => setImmediate(resolve));
const channel = (id, groupId = 'g1') => ({ id: 'live:' + id, name: 'Canal ' + id, groupId, streamId: id,
  streamRef: { sourceItemId: id, directStreamUrl: 'https://synthetic.invalid/live/' + id + '.m3u8', containerExtension: 'm3u8' } });
const rows = [...Array.from({ length: 225 }, (_, i) => channel(String(i))), channel('searched-other', 'g2')];
const target = rows[207];
target.name = 'Canal Encontrado Distante';
const groups = [{ id: 'g1', name: 'Notícias' }, { id: 'g2', name: 'Outros' }];
const files = new Map();
const segmentFiles = ['live_1.json', 'live_2.json', 'live_3.json', 'live_4.json'];
const segments = [rows.slice(0, 70), [...rows.slice(70, 140), rows[5]], rows.slice(140, 210), rows.slice(210)];
const catalog = { snapshotId: 'synthetic-c105', generatedAt: '', groups, channels: rows.slice(0, 8),
  channelsByGroup: { g1: rows.slice(0, 8), g2: [] }, totalChannels: rows.length, segmentFiles };
let currentSnapshot = catalog.snapshotId, onRead;
const diskReads = [];
files.set('prebuilt/snapshots/' + catalog.snapshotId + '/live_catalog.json', JSON.stringify(catalog));
for (let i = 0; i < segmentFiles.length; i++) files.set('prebuilt/snapshots/' + catalog.snapshotId + '/' + resolveSegmentRelativePath(segmentFiles[i]), JSON.stringify(segments[i]));
const fsPort = { async readFile({ path }) {
  diskReads.push(path);
  if (path === 'prebuilt/active.json') return { data: JSON.stringify({ snapshotId: currentSnapshot }) };
  if (onRead) await onRead(path);
  if (!files.has(path)) throw Error('SYNTHETIC_READ_FAILURE');
  return { data: files.get(path) };
} };
const liveModule = load('src/catalog/live/live-catalog.service.ts', name => name === '@capacitor/filesystem'
  ? { Filesystem: fsPort, Directory: { Data: 'DATA' }, Encoding: { UTF8: 'utf8' } }
  : { resolveSegmentRelativePath });
const { LiveCatalogService, readLiveChannelByIdFromSegments, readLiveChannelPageForGroupFromSegments } = liveModule;
const readSegment = async name => JSON.stringify(segments[segmentFiles.indexOf(name)]);

await test('SELECT_ID_OUTSIDE_FIRST_FOLD_ONE_PASS_EARLY_EXIT_AND_PAGE_OFFSET', async () => {
  diskReads.length = 0;
  const selected = await LiveCatalogService.loadChannelById(target.id, { expectedSnapshotId: catalog.snapshotId, pageSize: 48 });
  assert.deepEqual(selected, { channel: target, pageOffset: 192 });
  const pages = diskReads.filter(path => path.includes('/segments/'));
  assert.equal(pages.length, 3);
  assert.ok(!pages.some(path => path.endsWith('live_4.json')));
  const page = await readLiveChannelPageForGroupFromSegments(catalog, target.groupId, segmentFiles, readSegment, selected.pageOffset, 48);
  assert.ok(page.channels.some(row => row.id === target.id));
  assert.equal(page.channels.length, 33);
  assert.deepEqual(selected.channel.streamRef, target.streamRef);
  assert.equal(catalog.channels.length, 8, 'lookup does not materialize or mutate first fold');
});
await test('MISSING_ID_LEGACY_FOLD_AND_INVALID_SEGMENT_ARE_DISTINCT', async () => {
  assert.equal(await LiveCatalogService.loadChannelById('live:absent'), undefined);
  const legacy = await readLiveChannelByIdFromSegments(catalog, rows[7].id, [], async () => { throw Error('unexpected read'); });
  assert.equal(legacy.channel.id, rows[7].id);
  await assert.rejects(readLiveChannelByIdFromSegments(catalog, target.id, ['bad'], async () => '{'), /SEGMENT_INVALID/);
  await assert.rejects(readLiveChannelByIdFromSegments(catalog, target.id, ['bad'], async () => null), /SEGMENT_UNAVAILABLE/);
});
await test('CANCEL_AND_ACTIVE_SNAPSHOT_CHANGE_BEFORE_AFTER_READ_FAIL_CLOSED', async () => {
  await assert.rejects(LiveCatalogService.loadChannelById(target.id, { expectedSnapshotId: 'different' }), /SELECTION_CHANGED/);
  const aborted = new AbortController(); aborted.abort();
  await assert.rejects(LiveCatalogService.loadChannelById(target.id, { signal: aborted.signal }), /SELECTION_CANCELLED/);
  onRead = async path => { if (path.includes('/segments/')) currentSnapshot = 'different'; };
  await assert.rejects(LiveCatalogService.loadChannelById(target.id), /SELECTION_CHANGED/);
  currentSnapshot = catalog.snapshotId;
  const controller = new AbortController();
  onRead = async path => { if (path.includes('/segments/')) controller.abort(); };
  await assert.rejects(LiveCatalogService.loadChannelById(target.id, { signal: controller.signal }), /SELECTION_CANCELLED/);
  onRead = undefined;
  assert.equal((await LiveCatalogService.loadChannelById(target.id)).channel.id, target.id, 'failed lookup does not poison a later retry');
});

const rootCatalog = { metadata: { schemaVersion: 1, snapshotId: catalog.snapshotId, catalogVersion: '1', generatedAt: '', counts: {} },
  categories: [], genres: [], movies: [{ id: 'movie:1', title: 'Canal Encontrado Filme', genreIds: [], categoryIds: [], artworkIds: [], streamIds: [] }],
  series: [{ id: 'series:1', title: 'Canal Encontrado Série', genreIds: [], categoryIds: [], artworkIds: [], seasonIds: [] }], seasons: [], episodes: [], streams: [], artworks: [] };
const engine = new CompactSearchEngineV2Pruned();
const binary = serializeCompactIndexV2(new CompactSearchIndexV2Builder().build(rootCatalog, { liveCatalog: { ...catalog, channels: rows }, deterministicGeneratedAt: '2026-10-14T00:00:00.000Z' })).buffer;
engine.load(binary);
const searched = engine.query('Canal Encontrado').items;

function hooks(overrides = new Map()) {
  const state = [], refs = [], effects = [];
  let stateIndex = 0, refIndex = 0;
  const react = {
    useState(initial) {
      const i = stateIndex++;
      if (!(i in state)) state[i] = overrides.has(i) ? overrides.get(i) : typeof initial === 'function' ? initial() : initial;
      return [state[i], value => { state[i] = typeof value === 'function' ? value(state[i]) : value; }];
    },
    useRef(initial) { const i = refIndex++; return refs[i] ||= { current: initial }; },
    useEffect(run, deps) { effects.push({ run, deps }); },
    useLayoutEffect() {},
    useMemo: run => run(), useCallback: callback => callback,
    createElement: (type, props, ...children) => ({ type, props: props || {}, children }),
    Fragment: 'fragment',
  };
  return { react, state, refs, effects, begin() { stateIndex = 0; refIndex = 0; effects.length = 0; } };
}
function flatten(node) {
  if (!node || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap(flatten);
  return [node, ...(node.children || []).flatMap(flatten)];
}
const MediaCard = () => null, Artwork = () => null;
const renderSearch = (runtime, readModel, callbacks) => {
  const component = load('src/ui/components/SearchResults.tsx', name => name === 'react' ? { default: runtime.react, ...runtime.react }
    : name.includes('catalog-selectors') ? { movieToViewModel: () => { throw Error('unexpected hydrated movie'); }, seriesToViewModel: () => { throw Error('unexpected hydrated series'); } }
    : name.includes('MediaCard') ? { MediaCard } : { Artwork });
  return { ...component, tree: component.SearchResults({ results: searched, readModel, ...callbacks }) };
};
await test('LOCAL_COMPLETE_INDEX_LIVE_CARD_HAS_DISTINCT_HANDLER_AND_NO_SERIES_HYDRATION', async () => {
  assert.deepEqual(new Set(searched.map(row => row.kind)), new Set(['movie', 'series', 'live']));
  assert.ok(searched.some(row => row.id === target.id && row.kind === 'live'));
  const runtime = hooks(), resolutions = [], selected = [];
  const readModel = { moviesById: new Map(), seriesById: new Map(),
    resolveMovieById: async id => { resolutions.push(['movie', id]); },
    resolveSeriesById: async id => { resolutions.push(['series', id]); } };
  const { tree } = renderSearch(runtime, readModel, { onSelectItem: item => selected.push(item.kind), onSelectLive: id => selected.push(id) });
  const liveCard = flatten(tree).find(node => node.type === 'button' && node.props['aria-label']?.includes('Canal ao vivo'));
  assert.ok(liveCard); assert.equal(liveCard.props.disabled, false); liveCard.props.onClick();
  assert.deepEqual(selected, [target.id]);
  assert.ok(flatten(liveCard).some(node => node.type === Artwork && node.props.identity === undefined && node.props.prepare === false));
  for (const card of flatten(tree).filter(node => node.type === MediaCard)) card.props.onClick(card.props.item);
  assert.deepEqual(new Set(selected.slice(1)), new Set(['movie', 'series']));
  const cleanup = runtime.effects[0].run(); await tick(); cleanup();
  assert.equal(resolutions.length, 2); assert.ok(resolutions.every(([, id]) => id !== target.id));
  const unavailable = renderSearch(hooks(), readModel, { onSelectItem() {} }).tree;
  assert.equal(flatten(unavailable).find(node => node.type === 'button').props.disabled, true);
});
await test('SEARCH_PAGE_PASSES_LIVE_CALLBACK_WITHOUT_CHANGING_MOVIE_SERIES_CALLBACK', () => {
  const onSelectItem = () => {}, onSelectLive = () => {}, SearchResults = () => null;
  const runtime = hooks(new Map([[2, 'SEARCH_RESULTS'], [3, searched]]));
  const component = load('src/ui/pages/SearchPage.tsx', name => name === 'react' ? { default: runtime.react, ...runtime.react }
    : name.includes('SearchResults') ? { SearchResults } : {});
  const tree = component.SearchPage({ readModel: {}, onSelectItem, onSelectLive, searchServiceOverride: {} });
  const result = flatten(tree).find(node => node.type === SearchResults);
  assert.equal(result.props.onSelectLive, onSelectLive); assert.equal(result.props.onSelectItem, onSelectItem);
});
await test('REAL_APP_LIVE_HANDLER_PRESERVES_BACK_AND_PROMOTION_GUARD', () => {
  const app = source('src/App.tsx');
  const ast = ts.createSourceFile('App.tsx', app, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let arrow;
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(ast) === 'handleSelectLive') arrow = node.initializer.arguments[0].getText(ast);
    ts.forEachChild(node, visit);
  }
  visit(ast); assert.ok(arrow);
  const handlerModule = { exports: {} };
  const code = ts.transpileModule('export const select = ' + arrow, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  let state = { current: { view: 'search' }, history: [{ view: 'home' }] }, promoting = false;
  new Function('module', 'exports', 'getBootSyncCoordinator', 'handleNavigate', code)(handlerModule, handlerModule.exports,
    () => ({ getState: () => promoting ? 'PROMOTING' : 'SYNCING' }), (view, id) => { state = navigateTo(state, view, id); });
  handlerModule.exports.select(target.id);
  assert.deepEqual(state.current, { view: 'live', itemId: target.id });
  assert.equal(navigateBack(state).current.view, 'search');
  promoting = true; handlerModule.exports.select('live:another');
  assert.equal(state.current.itemId, target.id);
  assert.ok(app.includes('<LiveTvPage initialChannelId={itemId}'));
  assert.ok(app.includes('onSelectLive={handleSelectLive}'));
});

async function runLiveInitial(initialChannelId, lookup = LiveCatalogService.loadChannelById.bind(LiveCatalogService)) {
  const runtime = hooks();
  let defaultSelections = 0;
  const service = { ...LiveCatalogService, loadLiveCatalog: async () => catalog, loadChannelById: lookup,
    loadChannelPageForGroup: LiveCatalogService.loadChannelPageForGroup.bind(LiveCatalogService) };
  const component = load('src/ui/pages/LiveTvPage.tsx', name => name === 'react' ? { default: runtime.react, ...runtime.react }
    : name.endsWith('.css') ? {} : name.includes('live-catalog.service') ? { ...liveModule, LiveCatalogService: service }
    : name.includes('useLivePresentation') ? { useLivePresentation: () => ({ tabletPortrait: false, stackedLive: false, squareLive: false }) }
    : name.includes('last-live-channel') ? { chooseInitialLiveChannel: async () => { defaultSelections++; return rows[0]; }, liveChannelFingerprint: () => 'synthetic' }
    : {});
  component.LiveTvPage({ onBack() {}, initialChannelId });
  const effect = runtime.effects.find(({ run }) => run.toString().includes('setIsLoading(true)'));
  assert.ok(effect); const cleanup = effect.run();
  for (let i = 0; i < 30 && runtime.state[6]; i++) await tick();
  assert.equal(runtime.state[6], false);
  return { runtime, cleanup, defaultSelections };
}
await test('REAL_LIVE_INITIAL_EFFECT_SELECTS_REQUESTED_ID_AND_VISIBLE_PAGE_ONLY', async () => {
  const { runtime, cleanup, defaultSelections } = await runLiveInitial(target.id);
  assert.equal(runtime.state[5].id, target.id); assert.equal(runtime.state[4], target.groupId);
  assert.deepEqual(runtime.refs[0].current, { groupId: target.groupId, offset: 192 });
  assert.equal(defaultSelections, 0); cleanup();
  const normal = await runLiveInitial(undefined);
  assert.equal(normal.runtime.state[5].id, rows[0].id); assert.equal(normal.defaultSelections, 1); normal.cleanup();
});
await test('REAL_LIVE_REQUEST_MISS_AND_IO_FAILURE_NEVER_PLAY_DEFAULT_OR_REPORT_FALSE_EMPTY', async () => {
  const missing = await runLiveInitial('live:absent');
  assert.equal(missing.runtime.state[5], null); assert.match(missing.runtime.state[7], /busca/); assert.equal(missing.defaultSelections, 0); missing.cleanup();
  const failed = await runLiveInitial(target.id, async () => { throw Error('LIVE_SELECTION_CHANGED'); });
  assert.equal(failed.runtime.state[5], null); assert.match(failed.runtime.state[7], /Não foi possível carregar/); assert.equal(failed.defaultSelections, 0); failed.cleanup();
});
console.log(JSON.stringify({ tests, pass: true, networkRequests: 0, fixtureOnly: true }));
