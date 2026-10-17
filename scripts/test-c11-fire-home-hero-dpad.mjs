import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { parentalControls, parentalDpadTarget, parentalEntry } from '../src/ui/parental-dpad-navigation.ts';

const source = readFileSync(new URL('../src/ui/hooks/useDpadNavigation.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const callbacks = [], cleanup = [], frames = new Map(), listeners = new Map();
let serial = 0, cancelled = 0;
const document = { body: {}, activeElement: null };
const heroSelector = '.home-page .hero-banner, .movies-page .hero-banner, .series-page .hero-banner';
class Element { constructor(matches) { this.matches = matches; this.isConnected = true; } closest(selector) { return this.matches[selector] || null; } scrollIntoView(options) { calls.push({ element: 'target', options }); } }
const exports = {};
vm.runInNewContext(code, { exports, document, HTMLElement: Element,
  window: { scrollY:100, scrollX:0, scrollTo:options=>calls.push({element:'hero',options}), addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: (name, fn) => { assert.equal(listeners.get(name), fn); listeners.delete(name); } },
  getComputedStyle:()=>({scrollMarginTop:'16.2px'}),
  MutationObserver: class { observe() {} disconnect() {} },
  requestAnimationFrame: fn => { frames.set(++serial, fn); return serial; }, cancelAnimationFrame: id => { if (frames.delete(id)) cancelled++; },
  require: name => { if (name === '../parental-dpad-navigation.ts') return { parentalControls, parentalDpadTarget, parentalEntry }; assert.equal(name, 'react'); return {
    useRef: value => ({ current: value }), useCallback: fn => { callbacks.push(fn); return fn; },
    useEffect: fn => { const dispose = fn(); if (dispose) cleanup.push(dispose); },
  }; },
});
exports.useDpadNavigation({ autoFocusFirst: false });
const schedule = callbacks[0]; assert.equal(typeof schedule, 'function');
const calls = [];
function element(matches = {}) { return new Element(matches); }
const hero = { getBoundingClientRect:()=>({top:70}), scrollIntoView:()=>{throw Error('Fire native scrollIntoView ignores inset');} };
function fireTarget() { return element({ [heroSelector]: hero, '.app-shell--fire-stick': {} }); }
function commit(target) { document.activeElement = target; const pending = [...frames.values()]; frames.clear(); for (const fn of pending) fn(); }
for (const direction of ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']) {
  const target = fireTarget(); schedule(target, direction, null); assert.equal(frames.size, 1); assert.equal(calls.length, 0);
  commit(target); assert.equal(calls.length, 1); assert.equal(calls[0].element, 'hero');
  assert.equal(calls[0].options.top,153.8); assert.equal(calls[0].options.behavior, 'auto'); assert.equal(calls[0].options.left,0); calls.length = 0;
}
assert.ok(heroSelector.split(', ').every(selector => source.includes(selector)));
console.log('PASS_REAL_DPAD_FIRE_HOME_MOVIES_SERIES_BANNER_EXPLICIT_INSET_SINGLE_FRAME_ALL_DIRECTIONS');
for (const target of [element({ [heroSelector]: hero }), element({ '.app-shell--fire-stick': {} })]) {
  schedule(target, 'ArrowUp', null); commit(target); assert.equal(calls[0].element, 'target'); assert.equal(calls[0].options.block, 'center'); calls.length = 0;
  schedule(target, 'ArrowRight', null); commit(target); assert.equal(calls[0].options.block, 'nearest'); calls.length = 0;
}
console.log('PASS_REAL_DPAD_OTHER_PLATFORMS_AND_NON_HOME_KEEP_PREVIOUS_SCROLL');
const focusin = listeners.get('focusin'); assert.equal(typeof focusin, 'function');
const focused = fireTarget(); document.activeElement = focused; focusin({ target: focused }); assert.equal(frames.size, 1);
schedule(focused, 'ArrowUp', null); assert.equal(frames.size, 1); commit(focused); assert.equal(calls[0].element, 'hero'); calls.length = 0;
const cancelledBefore = cancelled;
for (const target of [null, {}, element({ [heroSelector]: hero }), element({ '.app-shell--fire-stick': {} })]) { focusin({ target }); assert.equal(frames.size, 0); }
console.log('PASS_REAL_PROGRAMMATIC_FOCUS_FIRE_ONLY_SHARED_FRAME_OTHERS_UNCHANGED');
const stale = fireTarget(); schedule(stale, 'ArrowUp', null); stale.isConnected = false; commit(stale); assert.equal(calls.length, 0);
const departed = fireTarget(); schedule(departed, 'ArrowUp', null); commit(element()); assert.equal(calls.length, 0);
const first = fireTarget(), final = fireTarget(); schedule(first, 'ArrowUp', null); schedule(final, 'ArrowUp', null);
assert.equal(frames.size, 1); assert.equal(cancelled, cancelledBefore + 1); commit(final); assert.equal(calls.length, 1); calls.length = 0;
schedule(final, 'ArrowUp', null); for (const dispose of cleanup) dispose(); assert.equal(frames.size, 0); assert.equal(listeners.size, 0);
console.log('PASS_REAL_DPAD_STALE_FOCUS_CANCEL_COALESCED_FRAME_AND_UNMOUNT_CLEANUP');

// Geometry and CSS inset must agree; native scrollIntoView alone was insufficient.
const css=readFileSync(new URL('../src/index.css',import.meta.url),'utf8');
assert.ok(css.includes('--fire-hero-frame-gap: max(clamp(16px, 3vh, 24px), env(safe-area-inset-top, 0px))'));
assert.ok(css.includes('#root .app-shell--fire-stick :is(.home-page, .movies-page, .series-page) { padding-top: var(--fire-hero-frame-gap) !important; }'));
assert.ok(css.includes('scroll-margin-top: var(--fire-hero-frame-gap)'));
assert.ok(css.includes('min(350px, calc(100vh - 2 * var(--fire-hero-frame-gap)))'));
assert.ok(css.includes('min(620px, calc(100vh - 2 * var(--fire-hero-frame-gap)))'));
assert.ok(css.includes('#root .app-shell--fire-stick :is(.home-page, .movies-page, .series-page) .hero-overview { font-size: calc(var(--tv-font-sm, 15px) + 3px) !important; }'));
console.log('PASS_FIRE_ONLY_SHARED_PAGE_AND_SCROLL_INSET_SMALL_VIEWPORT_HEIGHT_BOUND');
