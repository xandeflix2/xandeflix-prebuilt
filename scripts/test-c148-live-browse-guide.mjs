import fs from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';
import * as jsx from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';

const read = file => fs.readFileSync(file, 'utf8');
function load(file, bindings, globals = {}, suffix = '') {
  const module = { exports: {} }, code = ts.transpileModule(read(file) + suffix, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  new Function('require', 'module', 'exports', ...Object.keys(globals), code)(name => {
    if (name === 'react/jsx-runtime') return jsx;
    if (Object.hasOwn(bindings, name)) return bindings[name]; throw Error('Uncontrolled dependency: ' + name);
  }, module, module.exports, ...Object.values(globals));
  return module.exports;
}
const active = { id: 'active', name: 'Active fixture', groupId: 'a', streamRef: {} };
const other = { id: 'other', name: 'Other fixture', groupId: 'a', streamRef: {} };
const press = load('src/ui/live-channel-press.ts', {});
const events = [], selections = [];
const page = { offset: 0, totalAvailable: 2, nextOffset: null, channels: [active, other] };
const hooks = { useMemo: fn => fn(), useCallback: fn => fn, useEffect() {},
  useRef: value => { if (value instanceof Map) value.set(0, page); return { current: value }; },
  useState: value => [typeof value === 'function' ? value() : value, () => {}] };
const { ContinuousLiveChannelList } = load('src/ui/components/ContinuousLiveChannelList.tsx', {
  react: hooks, '../live-channel-press.ts': press,
});
function descendants(node, predicate) {
  if (!node || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap(child => descendants(child, predicate));
  return [...(predicate(node) ? [node] : []), ...descendants(node.props?.children, predicate)];
}
const tree = ContinuousLiveChannelList({ total: 2, seed: page, selectedId: active.id,
  request: { offset: 0, nonce: 0, focus: false }, loadPage: () => { throw Error('focus must not read catalog pages'); },
  onSelect: channel => selections.push(channel), onInspect: channel => events.push(channel),
});
const buttons = descendants(tree, node => node.type === 'button' && node.props['data-live-channel']);
assert.equal(buttons.length, 2);
if (process.argv.includes('--baseline')) {
  assert.equal(buttons[1].props.onFocus, undefined); assert.equal(buttons[1].props.onPointerEnter, undefined);
  assert.ok(read('src/ui/pages/LiveTvPage.tsx').includes('<LiveEpgPanel channel={selectedChannel} inline open embedded'));
  console.log('REPRODUCED_GUIDE_BOUND_TO_ACTIVE_CHANNEL_WITHOUT_FOCUS_INSPECTION'); process.exit(0);
}
let tests = 0;
async function test(name, run) { await run(); tests++; console.log('PASS ' + name); }
await test('FOCUS_AND_MOUSE_INSPECT_WITHOUT_PLAY_TOUCH_AND_CLICK_REMAIN_UNCHANGED', () => {
  const button = buttons[1]; button.props.onFocus();
  button.props.onPointerEnter({ pointerType: 'mouse' });
  button.props.onPointerEnter({ pointerType: 'touch' }); button.props.onPointerEnter({ pointerType: 'pen' });
  assert.deepEqual(events, [other, other]); assert.equal(selections.length, 0);
  assert.ok(buttons[0].props.className.includes('active-channel'));
  assert.ok(!button.props.className.includes('active-channel'));
  button.props.onClick(); assert.deepEqual(selections, [other]);
});

const ui = read('src/ui/pages/LiveTvPage.tsx'), ast = ts.createSourceFile('LiveTvPage.tsx', ui, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
function declaration(name) {
  let found;
  function visit(node) {
    if (ts.isVariableStatement(node) && node.declarationList.declarations.some(value => value.name.getText(ast) === name)) found = node.getText(ast);
    ts.forEachChild(node, visit);
  }
  visit(ast); assert.ok(found, 'actual declaration: ' + name); return found;
}
const snippet = ['guideScope', 'guideChannel', 'handleChannelInspect'].map(declaration).join('\n');
const evaluate = ts.transpileModule(snippet + '\nreturn {guideChannel,handleChannelInspect};', {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
function guide(state, values = {}) {
  const data = { liveCatalog: { snapshotId: 's1' }, selectedChannel: active, effectiveGroupId: 'a', channelFilter: '',
    parental: { prompt: null, contentRevision: 0, adultSession: false }, inspectedChannel: state.value,
    canShowParentalLive: channel => channel.allowed !== false, useCallback: fn => fn, initialFocusDone: { current: false },
    setInspectedChannel: next => { state.value = typeof next === 'function' ? next(state.value) : next; }, ...values };
  return new Function(...Object.keys(data), evaluate)(...Object.values(data));
}
await test('GUIDE_CHANNEL_IS_INDEPENDENT_FROM_ACTIVE_PREVIEW_AND_SAME_FOCUS_IS_STABLE', () => {
  const state = { value: null }; guide(state).handleChannelInspect(other);
  assert.equal(guide(state).guideChannel, other); assert.equal(active.id, 'active');
  const before = state.value; guide(state).handleChannelInspect(other); assert.equal(state.value, before);
  guide(state).handleChannelInspect({ ...active }); assert.equal(guide(state).guideChannel, active);
});
await test('CATEGORY_FILTER_SNAPSHOT_ACTIVE_CHANNEL_AND_PARENTAL_CHANGES_INVALIDATE_OLD_GUIDE', () => {
  const state = { value: null }; guide(state).handleChannelInspect(other);
  for (const data of [{ effectiveGroupId: 'b' }, { channelFilter: 'filter' }, { liveCatalog: { snapshotId: 's2' } },
    { parental: { contentRevision: 1, adultSession: false } }, { canShowParentalLive: () => false }]) {
    assert.equal(guide(state, data).guideChannel, active);
  }
  assert.equal(guide(state, { selectedChannel: other }).guideChannel, other);
  const blocked = { value: null };
  guide(blocked, { canShowParentalLive: () => false }).handleChannelInspect(other); assert.equal(blocked.value, null);
  guide(blocked, { parental: { prompt: {} } }).handleChannelInspect(other); assert.equal(blocked.value, null);
  guide(blocked, { liveCatalog: null }).handleChannelInspect(other); assert.equal(blocked.value, null);
});
await test('ALL_DOM_GUIDE_LAYOUTS_RECEIVE_BROWSED_CHANNEL_WHILE_PREVIEW_SUMMARY_STAYS_ACTIVE', () => {
  const start = ui.indexOf('{isMobile || squareLive ?'), end = ui.indexOf('</div>}', start) + 7;
  assert.ok(start > 0 && end > start);
  const code = ts.transpileModule('return (' + ui.slice(start + 1, end) + ');', { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  for (const [isMobile, squareLive] of [[false, false], [true, false], [false, true], [true, true]]) {
    const Panel = () => null;
    const values = { isMobile, squareLive, selectedChannel: active, guideChannel: other, browsingGuide: true,
      isEpgOpen: true, setIsEpgOpen() {}, liveCatalog: { groups: [] }, LiveEpgPanel: Panel, favoriteButton: null };
    const node = new Function('require', 'exports', ...Object.keys(values), code)(() => jsx, {}, ...Object.values(values));
    const panel = descendants(node, item => item.type === Panel)[0];
    assert.equal(panel.props.channel, other); assert.equal(panel.props.browsing, true);
    if (!isMobile && !squareLive) {
      const summary = descendants(node, item => item.props.className === 'live-channel-summary')[0];
      const html = renderToStaticMarkup(summary); assert.ok(html.includes(active.name)); assert.ok(!html.includes(other.name));
    }
  }
});

function initialFocus(values = {}) {
  const requests = [], lookups = [], pages = [], done = { current: false };
  const data = { initialFocusDone: done, selectedChannel: active, liveCatalog: { snapshotId: 's1' }, parental: { prompt: null },
    effectiveGroupId: 'a', channelFilter: '', LIVE_GROUP_PAGE_SIZE: 48, useCallback: fn => fn,
    LiveCatalogService: { loadChannelById: async (id, options) => { lookups.push({ id, options }); return { channel: active, pageOffset: 192 }; } },
    loadContinuousPage: async (offset, signal) => { pages.push({ offset, signal }); return { offset, channels: [...Array(15).fill(other), active] }; },
    setChannelScrollRequest: update => requests.push(update({ nonce: 0 })), ...values };
  const code = ts.transpileModule(declaration('focusInitialChannel') + '\nreturn focusInitialChannel;', {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const run = new Function(...Object.keys(data), code)(...Object.values(data));
  return { run, requests, lookups, pages, done, data };
}
await test('INITIAL_ACTIVE_FOCUS_LOCATES_DISTANT_CHANNEL_ONCE_WITHOUT_MEDIA_OR_SELECTION', async () => {
  const f = initialFocus(), signal = new AbortController().signal; await f.run(signal);
  assert.equal(f.lookups.length, 1); assert.equal(f.lookups[0].id, active.id);
  assert.equal(f.lookups[0].options.expectedSnapshotId, 's1'); assert.equal(f.lookups[0].options.signal, signal);
  assert.deepEqual(f.pages.map(page => page.offset), [192]);
  assert.deepEqual(f.requests, [{ groupId: 'a', offset: 192, nonce: 1, focus: true, index: 207 }]);
  await f.run(signal); assert.equal(f.lookups.length, 1); assert.equal(f.requests.length, 1);
});
await test('INITIAL_FOCUS_RESPECTS_DIALOG_INTERACTION_ABORT_AND_MISSING_CHANNEL', async () => {
  for (const values of [{ parental: { prompt: {} } }, { effectiveGroupId: 'b' }, { channelFilter: 'typed' },
    { initialFocusDone: { current: true } }, { selectedChannel: null }]) {
    const f = initialFocus(values); await f.run(new AbortController().signal); assert.equal(f.lookups.length, 0); assert.equal(f.requests.length, 0);
  }
  let release;
  const f = initialFocus({ LiveCatalogService: { loadChannelById: () => new Promise(resolve => { release = resolve; }) } });
  const controller = new AbortController(), pending = f.run(controller.signal); controller.abort();
  release({ channel: active, pageOffset: 192 }); await pending; assert.equal(f.pages.length, 0); assert.equal(f.requests.length, 0);
  assert.equal(f.done.current, false);
  const replay = f.run(new AbortController().signal); release({ channel: active, pageOffset: 192 }); await replay;
  assert.equal(f.requests.length, 1, 'cleanup/replay still focuses the restored channel');
  const manual = initialFocus({ LiveCatalogService: { loadChannelById: () => new Promise(resolve => { release = resolve; }) } });
  const operation = manual.run(new AbortController().signal); manual.done.current = true;
  release({ channel: active, pageOffset: 192 }); await operation; assert.equal(manual.requests.length, 0);
  const absent = initialFocus({ LiveCatalogService: { loadChannelById: async () => undefined } });
  await absent.run(new AbortController().signal); assert.equal(absent.requests.length, 0);
});
await test('VIRTUAL_LIST_USES_EXACT_INDEX_WITHOUT_SEED_AND_FOCUSES_TARGET_WITH_PREVENT_SCROLL', () => {
  for (const focusBlocked of [false, true]) {
  const effects = [], refs = [], focusCalls = [], element = { scrollTop: 0, querySelector: selector => {
    assert.equal(selector, '[data-live-index="207"]'); return { focus: options => focusCalls.push(options) };
  } };
  const mockHooks = { ...hooks, useEffect: fn => effects.push(fn), useRef: value => {
    const ref = { current: refs.length ? value : element }; refs.push(ref); return ref;
  } };
  const { ContinuousLiveChannelList: List } = load('src/ui/components/ContinuousLiveChannelList.tsx', {
    react: mockHooks, '../live-channel-press.ts': press,
  });
  List({ total: 240, selectedId: active.id, focusBlocked, request: { offset: 192, index: 207, nonce: 1, focus: true },
    onSelect: () => { throw Error('initial focus must not activate'); }, loadPage: () => { throw Error('uncontrolled page read'); } });
  effects.find(fn => fn.toString().includes('appliedRequest.current === request.nonce'))();
  assert.equal(element.scrollTop, 207 * 64);
  effects.find(fn => fn.toString().includes('target.focus'))();
  assert.deepEqual(focusCalls, focusBlocked ? [] : [{ preventScroll: true }]);
  if (focusBlocked) assert.ok(refs.some(ref => ref.current === 207), 'PIN dialog keeps the focus request pending');
  }
});

function schedule() {
  let next = 0;
  const effects = [], timers = new Map(), intervals = new Map(), requests = [], writes = [];
  const bindings = { react: { useEffect: fn => effects.push(fn), useLayoutEffect() {}, useRef: value => ({ current: value }),
    useState: value => [typeof value === 'function' ? value() : value, value => writes.push(value)] },
    '../../catalog/live/live-epg.service.ts': { liveEpgService: { load: (channel, signal) => new Promise(resolve => { requests.push({ channel, signal, resolve }); }) } } };
  const module = load('src/ui/components/LiveEpgPanel.tsx', bindings, {
    setTimeout: (fn, ms) => { const id = ++next; timers.set(id, { fn, ms }); return id; }, clearTimeout: id => timers.delete(id),
    setInterval: (fn, ms) => { const id = ++next; intervals.set(id, { fn, ms }); return id; }, clearInterval: id => intervals.delete(id),
  }, '\nexport { EpgSchedule };');
  return { ...module, effects, timers, intervals, requests, writes, runTimer() {
    const [id, value] = timers.entries().next().value; timers.delete(id); value.fn();
  } };
}
await test('RAPID_FOCUS_CANCELLATION_MAKES_NO_EPG_REQUEST_AND_ACTIVE_CHANNEL_LOADS_IMMEDIATELY', () => {
  const f = schedule(); f.EpgSchedule({ channel: other, browsing: true });
  const cleanup = f.effects[0](); assert.equal(f.requests.length, 0); assert.equal([...f.timers.values()][0].ms, 250);
  cleanup(); assert.equal(f.timers.size, 0); assert.equal(f.intervals.size, 0); assert.equal(f.requests.length, 0);
  const current = schedule(); current.EpgSchedule({ channel: active });
  const close = current.effects[0](); assert.equal(current.requests[0].channel, active);
  assert.equal(current.timers.size, 0); assert.deepEqual([...current.intervals.values()].map(timer => timer.ms), [60000, 15000]);
  close(); assert.equal(current.requests[0].signal.aborted, true);
});
await test('BROWSED_GUIDE_LOADS_CORRECT_CHANNEL_ABORTS_AND_REJECTS_LATE_PROGRAMS', async () => {
  const f = schedule(), tree = f.EpgSchedule({ channel: other, browsing: true });
  assert.ok(renderToStaticMarkup(tree).includes('Programa')); assert.ok(renderToStaticMarkup(tree).includes(other.name));
  const cleanup = f.effects[0](); f.runTimer(); assert.equal(f.requests.length, 1); assert.equal(f.requests[0].channel, other);
  const writes = f.writes.length; cleanup(); assert.equal(f.requests[0].signal.aborted, true);
  f.requests[0].resolve({ status: 'ready', programs: [] }); await Promise.resolve();
  assert.equal(f.writes.length, writes); assert.equal(f.timers.size, 0); assert.equal(f.intervals.size, 0);
});
console.log(JSON.stringify({ result: 'PASS', tests, sourceRequests: 0, mediaRequests: 0, syntheticPorts: true, physicalDevices: false }));
