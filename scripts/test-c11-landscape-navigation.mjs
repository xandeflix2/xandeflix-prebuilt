import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { shouldUseSideNavigation } from '../src/ui/navigation/landscape-navigation.ts';

const cases = [
  ['Fire 960x540', { width: 960, height: 540, userAgent: 'Android 9; AFTSSS Mobile', mobile: true }, true],
  ['Fire 1280x720', { width: 1280, height: 720, userAgent: 'FireTV' }, true],
  ['Smart TV', { width: 1920, height: 1080, userAgent: 'SMART-TV Tizen' }, true],
  ['tablet', { width: 1280, height: 800, userAgent: 'Android SM-X610', mobile: false }, true],
  ['small tablet', { width: 1024, height: 600, userAgent: 'Android Tablet' }, true],
  ['tablet portrait', { width: 800, height: 1280, userAgent: 'Android SM-X610' }, false],
  ['iPad', { width: 1024, height: 768, userAgent: 'iPad Mobile Safari' }, true],
  ['iPad desktop UA', { width: 1180, height: 820, userAgent: 'Macintosh', touchPoints: 5 }, true],
  ['phone portrait', { width: 390, height: 844, userAgent: 'Android Mobile', mobile: true }, false],
  ['phone landscape wide', { width: 915, height: 412, userAgent: 'Android Mobile', mobile: true }, false],
  ['phone large landscape', { width: 1280, height: 720, userAgent: 'Android Mobile', mobile: true }, false],
  ['iPhone landscape wide', { width: 932, height: 430, userAgent: 'iPhone Mobile Safari' }, false],
  ['mobile hint without UA', { width: 1024, height: 600, mobile: true }, false],
  ['small unknown', { width: 800, height: 400 }, false],
  ['desktop landscape', { width: 1280, height: 720 }, true],
  ['portrait tablet IME', { width: 800, height: 450, screenWidth: 800, screenHeight: 1280, orientation: 'portrait-primary', userAgent: 'Android' }, false],
  ['landscape tablet IME', { width: 1280, height: 350, screenWidth: 1280, screenHeight: 800, orientation: 'landscape-primary', userAgent: 'Android' }, true],
  ['zero/unready', { width: 0, height: 0 }, false],
];
for (const [name, viewport, expected] of cases) {
  assert.equal(shouldUseSideNavigation(viewport), expected, name);
  console.log(`PASS ${name}`);
}

// Execute the actual hook and prove its subscriptions are removed on unmount.
const source = readFileSync(new URL('../src/ui/hooks/useLandscapeNavigation.ts', import.meta.url), 'utf8');
const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const listeners = new Map();
let cleanup;
let state;
const win = { innerWidth: 1280, innerHeight: 800, screen: { width: 1280, height: 800, orientation: { type: 'landscape-primary' } },
  addEventListener: (key, callback) => { assert.ok(!listeners.has(key)); listeners.set(key, callback); },
  removeEventListener: (key, callback) => { assert.equal(listeners.get(key), callback); listeners.delete(key); } };
const exports = {};
vm.runInNewContext(output, { exports, window: win, navigator: { userAgent: 'Android Tablet', maxTouchPoints: 5, userAgentData: { mobile: false } },
  require: (name) => name === 'react' ? {
    useState: (initial) => { state = initial(); return [state, (next) => { state = next; }]; },
    useEffect: (effect) => { cleanup = effect(); },
  } : { shouldUseSideNavigation },
});
assert.equal(exports.useLandscapeNavigation(), true);
win.innerWidth = 800; win.innerHeight = 1280;
listeners.get('resize')(); assert.equal(state, false);
win.innerWidth = 1280; win.innerHeight = 800;
listeners.get('orientationchange')(); assert.equal(state, true);
cleanup(); assert.equal(listeners.size, 0);
console.log('PASS REAL_LAYOUT_HOOK_RESIZE_ORIENTATION_AND_CLEANUP');
console.log('C11_LANDSCAPE_NAVIGATION_POLICY=PASS_18_CASES_AND_REAL_HOOK');
