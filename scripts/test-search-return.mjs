import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import React from 'react';
import { navigateTo, navigateBack } from '../src/ui/navigation/route-state.ts';
import { isSearchReturnRoute, captureSearchPosition, restoreSearchPosition } from '../src/ui/navigation/search-return.ts';

let count = 0;
async function test(name, run) { await run(); count++; console.log('PASS ' + name); }
const home = () => ({ current: { view: 'home' }, history: [] });
await test('SEARCH_CONTENT_TRAIL_SUPPORTS_MOVIES_SERIES_LIVE_AND_BACK', () => {
  for (const view of ['movie-detail', 'series-detail', 'live']) {
    const search = navigateTo(home(), 'search'); const content = navigateTo(search, view, 'synthetic');
    assert.equal(isSearchReturnRoute(content), true);
    assert.equal(navigateBack(content).current.view, 'search');
  }
});
await test('RELATED_CONTENT_RETAINS_SEARCH_ORIGIN', () => {
  let s = navigateTo(home(), 'search');
  s = navigateTo(s, 'movie-detail', 'one'); s = navigateTo(s, 'series-detail', 'two');
  assert.equal(isSearchReturnRoute(s), true); assert.equal(isSearchReturnRoute(navigateBack(s)), true);
});
await test('LEAVING_SEARCH_TO_ANOTHER_SECTION_CLOSES_VISIT', () => {
  const content = navigateTo(navigateTo(home(), 'search'), 'movie-detail', 'one');
  for (const view of ['home', 'movies', 'series', 'settings', 'parental-control', 'activation']) {
    const section = navigateTo(content, view); assert.equal(isSearchReturnRoute(section), false);
    assert.equal(isSearchReturnRoute(navigateTo(section, 'movie-detail', 'two')), false);
  }
});
await test('DETAIL_WITHOUT_SEARCH_ANCESTRY_DOES_NOT_CREATE_SEARCH', () => {
  assert.equal(isSearchReturnRoute(navigateTo(home(), 'movie-detail', 'one')), false);
});

let focused = null;
class Element {
  constructor(parent = null) { this.parentElement = parent; this.scrollTop = 0; this.scrollLeft = 0; this.isConnected = true; this.children = []; if (parent) parent.children.push(this); }
  contains(node) { return node === this || this.children.some(child => child.contains(node)); }
  querySelector(selector) { return selector === '.search-page-body' ? this.body || null : this.fallback || null; }
  closest() { return this; }
  getClientRects() { return this.isConnected ? [{}] : []; }
  focus(options) { focused = this; this.focusOptions = options; }
}
globalThis.HTMLElement = Element;
const shell = new Element(), content = new Element(shell), root = new Element(content), body = new Element(root), card = new Element(body);
root.body = body; root.fallback = card;
globalThis.document = { scrollingElement: shell };
const listeners = new Map(), frames = new Map(); let nextFrame = 0;
globalThis.window = { addEventListener(type, fn) { listeners.set(type, fn); }, removeEventListener(type, fn) { if (listeners.get(type) === fn) listeners.delete(type); } };
globalThis.requestAnimationFrame = fn => { const id = ++nextFrame; frames.set(id, fn); return id; };
globalThis.cancelAnimationFrame = id => frames.delete(id);
function tick() { const entries = [...frames]; frames.clear(); for (const [, fn] of entries) fn(); }
await test('RETURN_RESTORES_CARD_AND_EVERY_SCROLL_CONTAINER_WITHOUT_KEYBOARD', () => {
  content.scrollTop = 430; shell.scrollTop = 170; body.scrollTop = 40;
  const point = captureSearchPosition(root, card); content.scrollTop = shell.scrollTop = body.scrollTop = 0;
  restoreSearchPosition(root, point);
  assert.equal(focused, card); assert.deepEqual(card.focusOptions, { preventScroll: true });
  assert.equal(content.scrollTop, 430); assert.equal(shell.scrollTop, 170); assert.equal(body.scrollTop, 40);
});
await test('REMOVED_OR_OUT_OF_SCOPE_RESULT_IS_NEVER_REFOCUSED', () => {
  const old = new Element(root), point = captureSearchPosition(root, old); old.isConnected = false;
  restoreSearchPosition(root, point); assert.equal(focused, card);
  assert.equal(captureSearchPosition(root, new Element()).target, null);
});

function service(ready = true) {
  let status = ready ? 'SEARCH_READY' : 'SEARCH_INDEX_LOADING', results = []; const subs = new Set();
  const calls = { initialize: 0, unsubscribe: 0, searches: [] };
  const emit = (s, r = []) => { status = s; results = r; for (const fn of subs) fn(status, results); };
  return { calls, emit, subscribe(fn) { subs.add(fn); fn(status, results); return () => { calls.unsubscribe++; subs.delete(fn); }; },
    initialize() { calls.initialize++; if (ready) emit('SEARCH_READY'); return Promise.resolve(status); },
    isSearchReady() { return ['SEARCH_READY', 'SEARCH_RESULTS', 'SEARCH_QUERY_EMPTY', 'SEARCH_NO_RESULTS'].includes(status); },
    search(query, filter) { calls.searches.push({ query, filter }); emit(query.trim() ? 'SEARCH_RESULTS' : 'SEARCH_QUERY_EMPTY', query.trim() ? [{ id: 'one', kind: 'movie', title: 'Synthetic one' }, { id: 'two', kind: 'movie', title: 'Synthetic two' }] : []); },
  };
}
const Input = () => null, Results = () => null, State = () => null;
function harness(srv) {
  let cursor = 0; const values = [], effects = new Map(), work = [];
  const memo = (fn, deps) => { const i = cursor++, old = values[i]; if (!old || !deps.every((v, n) => Object.is(v, old.deps[n]))) values[i] = { deps, value: fn() }; return values[i].value; };
  const hooks = { ...React,
    useState(initial) { const i = cursor++; if (!(i in values)) values[i] = typeof initial === 'function' ? initial() : initial; return [values[i], value => { values[i] = typeof value === 'function' ? value(values[i]) : value; }]; },
    useRef(initial) { const i = cursor++; return values[i] ||= { current: initial }; },
    useMemo: memo, useCallback: (fn, deps) => memo(() => fn, deps),
    useEffect(fn, deps) { const i = cursor++, old = effects.get(i); if (!old || !deps.every((v, n) => Object.is(v, old.deps[n]))) work.push(() => { old?.cleanup?.(); effects.set(i, { deps, cleanup: fn() }); }); },
  };
  const module = { exports: {} }, code = ts.transpileModule(fs.readFileSync(new URL('../src/ui/pages/SearchPage.tsx', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React } }).outputText;
  const require = name => {
    if (name === 'react') return { ...hooks, default: hooks };
    if (name.includes('search-return')) return { captureSearchPosition, restoreSearchPosition };
    if (name.includes('SearchInput')) return { SearchInput: Input };
    if (name.includes('SearchResults')) return { SearchResults: Results };
    if (name.includes('SearchState')) return { SearchState: State };
    if (name.includes('search-client')) return { getClientSearchService() { throw Error('Unexpected default service'); } };
    throw Error('Uncontrolled search dependency ' + name);
  };
  new Function('require', 'module', 'exports', code)(require, module, module.exports);
  return { render(active = true) { cursor = 0; return module.exports.SearchPage({ readModel: {}, searchServiceOverride: srv, active, onSelectItem() {} }); }, flush() { while (work.length) work.shift()(); }, dispose() { for (const e of effects.values()) e.cleanup?.(); }, values };
}
function nodes(tree) { const list = []; const walk = n => { if (!React.isValidElement(n)) return; list.push(n); React.Children.forEach(n.props.children, walk); }; walk(tree); return list; }
const child = (tree, type) => nodes(tree).find(n => n.type === type);
await test('REAL_SEARCH_PAGE_RETAINS_QUERY_FILTER_RESULTS_AND_SUBSCRIPTION_DURING_CONTENT', async () => {
  const srv = service(), h = harness(srv); let tree = h.render(); tree.ref.current = root; h.flush(); tree = h.render();
  child(tree, Input).props.onChange('alpha'); tree = h.render();
  nodes(tree).find(n => n.type === 'button' && n.props.children === 'Filmes').props.onClick(); tree = h.render();
  const originalResults = child(tree, Results).props.results;
  tree.props.onClickCapture({ target: card, currentTarget: root });
  content.scrollTop = 510; child(tree, Results).props.onSelectItem({ id: 'one', kind: 'movie' });
  tree = h.render(false); h.flush(); assert.equal(tree.props.hidden, true); assert.equal(tree.props.style.display, 'none');
  content.scrollTop = 0; tree = h.render(true); h.flush(); tick(); tick(); tree = h.render();
  assert.equal(child(tree, Input).props.query, 'alpha'); assert.equal(child(tree, Results).props.results, originalResults);
  assert.equal(nodes(tree).find(n => n.type === 'button' && n.props.children === 'Filmes').props['aria-selected'], true);
  assert.equal(content.scrollTop, 510); assert.equal(focused, card); assert.equal(srv.calls.initialize, 1);
  assert.equal(srv.calls.unsubscribe, 0); h.dispose(); assert.equal(srv.calls.unsubscribe, 1);
});
await test('FRESH_VISIT_AND_CATALOG_REMOUNT_START_EMPTY_WITHOUT_STALE_RESULTS', () => {
  const srv = service(), old = harness(srv); let tree = old.render(); old.flush(); child(tree, Input).props.onChange('alpha'); old.dispose();
  srv.emit('SEARCH_RESULTS', [{ id: 'stale', kind: 'movie' }]); const fresh = harness(srv); tree = fresh.render();
  assert.equal(child(tree, Input).props.query, ''); assert.equal(child(tree, Results), undefined);
  fresh.flush(); fresh.dispose();
});
await test('QUERY_TYPED_DURING_INDEX_LOADING_IS_EXECUTED_WHEN_READY', () => {
  const srv = service(false), h = harness(srv); let tree = h.render(); h.flush(); child(tree, Input).props.onChange('pending');
  assert.equal(srv.calls.searches.length, 0); srv.emit('SEARCH_READY'); tree = h.render();
  assert.equal(child(tree, Input).props.query, 'pending'); assert.equal(child(tree, Results).props.results.length, 2); h.dispose();
});
await test('USER_INTERACTION_AND_UNMOUNT_CANCEL_DELAYED_FOCUS_RESTORE', () => {
  const srv = service(), h = harness(srv); let tree = h.render(); tree.ref.current = root; h.flush(); child(tree, Input).props.onChange('alpha'); tree = h.render();
  tree.props.onClickCapture({ target: card, currentTarget: root }); child(tree, Results).props.onSelectItem({ id: 'one', kind: 'movie' });
  h.render(false); h.flush(); h.render(true); h.flush(); const before = focused; listeners.get('keydown')(); tick(); tick(); assert.equal(focused, before); h.dispose(); assert.equal(frames.size, 0); assert.equal(listeners.size, 0);
});
console.log('SEARCH_RETURN_TESTS=' + count + '_PASS');
