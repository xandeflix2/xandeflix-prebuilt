import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import ts from 'typescript';

function environment() {
  let enabled = true, clock = 0, timerId = 0;
  const probes = [], timers = new Map(), frames = [], effects = [];
  class Probe {
    complete = false; naturalWidth = 0; currentSrc = ''; cors = false;
    set src(uri) { this.currentSrc = uri; this.beforeSrc = this.crossOrigin; probes.push(this); }
    get src() { return this.currentSrc; }
    removeAttribute() { this.released = true; }
    finish() { this.complete = true; this.naturalWidth = 100; this.cors = true; this.onload?.(); }
    fail() { this.onerror?.(); }
  }
  const window = new EventTarget();
  const document = { createElement: () => {
    let image;
    return { getContext: () => ({ drawImage: value => { image = value; }, getImageData: () => {
      if (!image.cors) throw Error('SecurityError');
      const rgb = image.currentSrc.includes('red') ? [220, 40, 30] : [20, 60, 220];
      return { data: new Uint8ClampedArray(Array.from({ length: 576 }, () => [...rgb, 255]).flat()) };
    } }) };
  } };
  const context = { console, URL, location: new URL('http://localhost:3000'), Image: Probe, document, window, AbortController,
    Date: { now: () => clock }, setTimeout: fn => { const id = ++timerId; timers.set(id, fn); return id; }, clearTimeout: id => timers.delete(id),
    requestAnimationFrame: fn => { frames.push(fn); return frames.length; }, cancelAnimationFrame() {},
    MutationObserver: class { observe() {} disconnect() {} } };
  function load(file, bindings = {}) {
    const exports = {};
    vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
      { ...context, exports, require: name => { if (Object.hasOwn(bindings, name)) return bindings[name]; throw Error('Uncontrolled ambient dependency: ' + name); } });
    return exports;
  }
  const palette = load('src/artwork/artwork-palette.ts');
  const displayed = uri => ({ complete: true, naturalWidth: 1280, currentSrc: 'https://art.fixture.invalid/' + uri, src: '', isConnected: true, cors: false, dataset: { immersiveArtwork: 'backdrop' } });
  function elements(image, fire = false) {
    const page = { style: new MapStyle(), scrollTop: 0, classList: { add() {}, remove() {} }, getBoundingClientRect: () => ({ top: 0 }), closest: name => name === '.app-shell' || (fire && name === '.app-shell--fire-stick') ? shell : null };
    const shell = { style: new MapStyle() };
    const element = Object.assign(new EventTarget(), { closest: name => name === '.page-container' ? page : null,
      querySelectorAll: () => [image], contains: other => other === image && image.isConnected,
      matches: name => name === '.hero-banner', getBoundingClientRect: () => ({ bottom: 400 }) });
    return { page, shell, element };
  }
  const helper = () => load('src/web/web-artwork-palette.ts', { '../artwork/artwork-palette.ts': palette, './validation.ts': { isWebValidation: () => enabled } });
  return { palette, displayed, elements, helper, probes, timers, frames, effects, load,
    set enabled(value) { enabled = value; }, advance: () => { clock += 61000; } };
}
class MapStyle extends Map { setProperty(key, value) { this.set(key, value); } removeProperty(key) { this.delete(key); } }
const tick = async () => { for (let n = 0; n < 8; n++) await Promise.resolve(); };
let tests = 0;
async function test(name, run) { await run(); tests++; console.log('PASS ' + name); }
const env = environment();
assert.equal(env.palette.paletteForImage(env.displayed('baseline-blue')), undefined);
if (process.argv.includes('--baseline')) {
  console.log(JSON.stringify({ result: 'REPRODUCED', canvasSecurityErrorReturnsNoPalette: true, syntheticPorts: true })); process.exit(0);
}
await test('WEB_CORS_PROBE_COLORS_CURRENT_IMAGE_WITHOUT_CHANGING_DISPLAYED_SOURCE', async () => {
  const f = environment(), { applyWebArtworkPalette } = f.helper(), image = f.displayed('blue'), nodes = f.elements(image);
  const before = { ...image }, pending = applyWebArtworkPalette(image, nodes.element, nodes.page, nodes.shell, new AbortController().signal);
  assert.equal(f.probes.length, 1); assert.equal(f.probes[0].beforeSrc, 'anonymous');
  assert.equal(f.probes[0].referrerPolicy, 'no-referrer'); f.probes[0].finish(); await pending;
  assert.deepEqual(image, before); assert.equal(nodes.page.style.get('--artwork-halo-height'), '432px');
  const ambient = nodes.shell.style.get('--navigation-ambient'); assert.ok(ambient);
  assert.equal(f.palette.paletteForImage(image).ambient, ambient, 'CORS probe reuses the existing palette cache');
  assert.equal(f.timers.size, 0); assert.equal(f.probes[0].released, true);
});
await test('ROTATION_APPLIES_NEW_COLOR_AND_REJECTS_OLD_IMAGE_RESULT', async () => {
  const f = environment(), helper = f.helper(), image = f.displayed('blue'), nodes = f.elements(image), signal = new AbortController().signal;
  const old = helper.applyWebArtworkPalette(image, nodes.element, nodes.page, nodes.shell, signal);
  image.currentSrc = 'https://art.fixture.invalid/red';
  const current = helper.applyWebArtworkPalette(image, nodes.element, nodes.page, nodes.shell, signal);
  f.probes[1].finish(); await current; const red = nodes.shell.style.get('--navigation-ambient');
  f.probes[0].finish(); await old; assert.equal(nodes.shell.style.get('--navigation-ambient'), red);
  assert.equal(red, f.palette.paletteFromPixels(new Uint8ClampedArray([220, 40, 30, 255])).ambient);
});
await test('ABORT_AND_DETACH_PREVENT_LATE_THEME_WRITES', async () => {
  for (const mode of ['abort', 'detach']) {
    const f = environment(), helper = f.helper(), image = f.displayed('blue'), nodes = f.elements(image), controller = new AbortController();
    const pending = helper.applyWebArtworkPalette(image, nodes.element, nodes.page, nodes.shell, controller.signal);
    if (mode === 'abort') controller.abort(); else image.isConnected = false;
    f.probes[0].finish(); await pending; assert.equal(nodes.shell.style.size, 0);
  }
});
await test('PROBES_DEDUPLICATE_LIMIT_CONCURRENCY_AND_TIMEOUT_WITHOUT_REPLACING_COVERS', async () => {
  const f = environment(), helper = f.helper(), image = f.displayed('blue'), nodes = f.elements(image), signal = new AbortController().signal;
  const one = helper.applyWebArtworkPalette(image, nodes.element, nodes.page, nodes.shell, signal);
  const duplicate = helper.applyWebArtworkPalette(image, nodes.element, nodes.page, nodes.shell, signal);
  const secondImage = f.displayed('red'), secondNodes = f.elements(secondImage);
  const two = helper.applyWebArtworkPalette(secondImage, secondNodes.element, secondNodes.page, secondNodes.shell, signal);
  const thirdImage = f.displayed('third'), third = f.elements(thirdImage);
  await helper.applyWebArtworkPalette(thirdImage, third.element, third.page, third.shell, signal);
  assert.equal(f.probes.length, 2);
  for (const callback of [...f.timers.values()]) callback(); await Promise.all([one, duplicate, two]);
  assert.equal(nodes.shell.style.size, 0); assert.equal(f.timers.size, 0);
  await helper.applyWebArtworkPalette(image, nodes.element, nodes.page, nodes.shell, signal); assert.equal(f.probes.length, 2, 'failure is not retried every resize');
  f.advance(); const retry = helper.applyWebArtworkPalette(image, nodes.element, nodes.page, nodes.shell, signal);
  assert.equal(f.probes.length, 3); f.probes[2].fail(); await retry;
});
await test('NON_WEB_AND_UNSAFE_OR_LOCAL_URIS_DO_NOT_START_EXTRA_IMAGES', async () => {
  const f = environment(), helper = f.helper(), image = f.displayed('blue'), nodes = f.elements(image), signal = new AbortController().signal;
  f.enabled = false; await helper.applyWebArtworkPalette(image, nodes.element, nodes.page, nodes.shell, signal); assert.equal(f.probes.length, 0);
  f.enabled = true;
  for (const uri of ['data:image/png;base64,AA', 'blob:http://localhost:3000/fixture', 'http://localhost:3000/poster', 'https://user:fixture@art.fixture.invalid/a']) {
    image.currentSrc = uri; await helper.applyWebArtworkPalette(image, nodes.element, nodes.page, nodes.shell, signal);
  }
  assert.equal(f.probes.length, 0);
});
await test('NATIVE_HOOK_STILL_SAMPLES_LOCALLY_AND_NEVER_IMPORTS_WEB_FALLBACK', async () => {
  for (const fire of [false, true]) for (const hasPalette of [false, true]) {
    const f = environment(), image = f.displayed('native'), nodes = f.elements(image, fire);
    const hook = f.load('src/ui/hooks/useImmersiveArtwork.ts', {
      react: { useRef: () => ({ current: null }), useEffect: effect => f.effects.push(effect) },
      '../../artwork/artwork-palette.ts': { paletteForImage: () => hasPalette ? { base: 'native-base', ambient: 'native-ambient' } : undefined },
      '../../web/validation.ts': { webValidationBuild: false, isWebValidation: () => { throw Error('native must short circuit'); } },
    }).useImmersiveArtwork;
    const root = hook('native'); root.current = nodes.element;
    const cleanups = f.effects.map(effect => effect()).filter(Boolean); for (const frame of f.frames) frame();
    assert.equal(nodes.shell.style.get('--navigation-ambient'), hasPalette ? 'native-ambient' : undefined);
    assert.equal(f.probes.length, 0);
    cleanups.pop()();
    assert.equal(nodes.shell.style.get('--navigation-ambient'), fire && hasPalette ? 'native-ambient' : undefined, 'native Fire retention and other-device reset preserved');
    for (const cleanup of cleanups) cleanup();
    assert.equal(nodes.shell.style.size, 0);
  }
});
await test('WEB_HOOK_IMPORTS_FALLBACK_AND_UPDATES_THE_CURRENT_SHELL', async () => {
  const f = environment(), image = f.displayed('web-hook-blue'), nodes = f.elements(image), helper = f.helper();
  const hook = f.load('src/ui/hooks/useImmersiveArtwork.ts', {
    react: { useRef: () => ({ current: null }), useEffect: effect => f.effects.push(effect) },
    '../../artwork/artwork-palette.ts': f.palette,
    '../../web/validation.ts': { webValidationBuild: true, isWebValidation: () => true },
    '../../web/web-artwork-palette.ts': helper,
  }).useImmersiveArtwork;
  const root = hook('web'); root.current = nodes.element;
  const cleanups = f.effects.map(effect => effect()).filter(Boolean); for (const frame of f.frames) frame();
  await tick(); assert.equal(f.probes.length, 1); f.probes[0].finish(); await tick();
  assert.ok(nodes.shell.style.get('--navigation-ambient'));
  cleanups.pop()(); assert.equal(nodes.shell.style.size, 0); for (const cleanup of cleanups) cleanup();
});
await test('WEB_HOOK_CLEANUP_BEFORE_LAZY_IMPORT_PREVENTS_EXTRA_IMAGE_AND_THEME', async () => {
  const f = environment(), image = f.displayed('web-hook-abort'), nodes = f.elements(image), helper = f.helper();
  const hook = f.load('src/ui/hooks/useImmersiveArtwork.ts', {
    react: { useRef: () => ({ current: null }), useEffect: effect => f.effects.push(effect) },
    '../../artwork/artwork-palette.ts': f.palette,
    '../../web/validation.ts': { webValidationBuild: true, isWebValidation: () => true },
    '../../web/web-artwork-palette.ts': helper,
  }).useImmersiveArtwork;
  const root = hook('web-abort'); root.current = nodes.element;
  const cleanups = f.effects.map(effect => effect()).filter(Boolean); for (const frame of f.frames) frame();
  cleanups.pop()(); await tick(); assert.equal(f.probes.length, 0); assert.equal(nodes.shell.style.size, 0);
  for (const cleanup of cleanups) cleanup();
});
await tick();
console.log(JSON.stringify({ result: 'PASS', tests, realBrowser: false, syntheticPorts: true, physicalDevices: false }));
