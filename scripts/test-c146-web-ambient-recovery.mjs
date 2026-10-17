import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import ts from 'typescript';

const tick = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
function fixture() {
  let enabled = true, time = 0, next = 0;
  const probes = [], requests = [], revoked = [], timers = new Map(), blobs = new Map();
  class Probe {
    complete = false; naturalWidth = 0; currentSrc = '';
    set src(value) { this.currentSrc = value; probes.push(this); }
    get src() { return this.currentSrc; }
    removeAttribute() { this.released = true; }
    finish() { this.complete = true; this.naturalWidth = 100; this.onload?.(); }
    fail() { this.onerror?.(); }
  }
  class LocalURL extends URL {
    static createObjectURL(blob) { const key = `blob:http://localhost:3000/${++next}`; blobs.set(key, blob); return key; }
    static revokeObjectURL(key) { blobs.delete(key); revoked.push(key); }
  }
  const context = { console, URL: LocalURL, location: new URL('http://localhost:3000'), AbortController,
    Image: Probe, Date: { now: () => time },
    fetch: (uri, options) => new Promise((resolve, reject) => { requests.push({ uri, options, resolve, reject }); }),
    setTimeout: fn => { const id = ++next; timers.set(id, fn); return id; }, clearTimeout: id => timers.delete(id),
    document: { createElement: () => { let image; return { getContext: () => ({
      drawImage: value => { image = value; }, getImageData: () => {
        if (!blobs.has(image.currentSrc)) throw Error('SecurityError');
        return { data: new Uint8ClampedArray([220, 40, 30, 255]) };
      },
    }) }; } },
  };
  function load(file, bindings = {}) {
    const exports = {};
    vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
    } }).outputText, { ...context, exports, require: name => {
      if (Object.hasOwn(bindings, name)) return bindings[name]; throw Error('Uncontrolled module: ' + name);
    } });
    return exports;
  }
  const palette = load('src/artwork/artwork-palette.ts');
  const helper = load('src/web/web-artwork-palette.ts', {
    '../artwork/artwork-palette.ts': palette, './validation.ts': { isWebValidation: () => enabled },
  });
  const shell = { style: new Style() };
  function nodes(name = 'red') {
    const image = { complete: true, naturalWidth: 100, isConnected: true, src: `https://art.fixture.invalid/${name}`,
      currentSrc: `https://art.fixture.invalid/${name}`, dataset: { immersiveArtwork: 'backdrop' } };
    const page = { style: new Style(), scrollTop: 0, classList: { add() {} }, getBoundingClientRect: () => ({ top: 0 }) };
    const element = { matches: () => true, contains: value => value === image, getBoundingClientRect: () => ({ bottom: 400 }) };
    const controller = new AbortController();
    return { image, page, controller, start: () => helper.applyWebArtworkPalette(image, element, page, shell, controller.signal) };
  }
  const response = (overrides = {}) => ({ ok: true, type: 'cors', headers: new Headers({ 'content-type': 'image/jpeg' }),
    blob: async () => ({ size: 128, type: 'image/jpeg' }), ...overrides });
  return { nodes, shell, probes, requests, timers, revoked, blobs, response,
    enable: value => { enabled = value; }, advance: () => { time += 61000; } };
}
class Style extends Map { setProperty(key, value) { this.set(key, value); } }

const baseline = fixture(), first = baseline.nodes(), initial = first.start();
baseline.probes[0].fail(); await tick();
if (process.argv.includes('--baseline')) {
  await initial;
  assert.equal(baseline.requests.length, 0); assert.equal(baseline.shell.style.size, 0);
  assert.equal(first.image.dataset.webAmbientState, 'NO_PALETTE');
  console.log('REPRODUCED_IMAGE_PROBE_FAILURE_LEAVES_PAGE_WITHOUT_PALETTE'); process.exit(0);
}
let tests = 0;
async function test(name, run) { await run(); tests++; console.log('PASS ' + name); }
async function recovered(f, n, job) {
  const request = f.requests.at(-1); assert.ok(request, 'CORS recovery requested');
  request.resolve(f.response()); await tick();
  f.probes.at(-1).finish(); await job;
}
await test('FAILED_IMAGE_PROBE_RECOVERS_SAME_IMAGE_WITH_FRESH_CORS_WITHOUT_CHANGING_COVER', async () => {
  const f = baseline, n = first, original = n.image.src;
  assert.equal(f.requests.length, 1);
  const { uri, options } = f.requests[0]; assert.equal(uri, original);
  assert.equal(options.mode, 'cors'); assert.equal(options.credentials, 'omit'); assert.equal(options.cache, 'reload');
  assert.equal(options.referrerPolicy, 'no-referrer');
  await recovered(f, n, initial);
  assert.equal(f.shell.style.get('--navigation-ambient'), 'rgb(79, 14, 11)');
  assert.equal(n.image.src, original); assert.equal(n.image.currentSrc, original);
  assert.equal(n.image.crossOrigin, undefined); assert.equal(n.image.dataset.webAmbientState, 'APPLIED');
  assert.equal(f.blobs.size, 0); assert.equal(f.revoked.length, 1); assert.equal(f.timers.size, 0);
  assert.ok(f.probes.every(probe => probe.released)); assert.equal(options.signal.aborted, true);
});
await test('REVISITING_ROUTE_REUSES_PALETTE_WITHOUT_FETCH_OR_EXTRA_IMAGE', async () => {
  const f = baseline, n = f.nodes(); f.shell.style.clear();
  await n.start();
  assert.equal(f.shell.style.get('--navigation-ambient'), 'rgb(79, 14, 11)');
  assert.equal(f.requests.length, 1); assert.equal(f.probes.length, 2);
});
await test('LATE_FETCH_AFTER_NAVIGATION_OR_HERO_CHANGE_DOES_NOT_REPAINT_OLD_PAGE', async () => {
  for (const changed of ['abort', 'uri', 'detach']) {
    const f = fixture(), n = f.nodes(), job = n.start();
    f.probes[0].fail(); await tick();
    if (changed === 'abort') n.controller.abort();
    else if (changed === 'uri') n.image.currentSrc += '-other'; else n.image.isConnected = false;
    await recovered(f, n, job);
    assert.equal(f.shell.style.size, 0); assert.equal(n.page.style.size, 0); assert.equal(f.blobs.size, 0);
  }
});
await test('CORS_FAILURE_OPAQUE_HTTP_AND_NON_IMAGE_RESPONSES_FAIL_SAFELY_AND_BACK_OFF', async () => {
  for (const failure of ['cors', 'opaque', 'http', 'mime', 'large']) {
    const f = fixture(), n = f.nodes(), job = n.start(); f.probes[0].fail(); await tick();
    if (failure === 'cors') f.requests[0].reject(Error('private address must never be exposed'));
    else f.requests[0].resolve(f.response(failure === 'opaque' ? { type: 'opaque' } : failure === 'http' ? { ok: false }
      : failure === 'mime' ? { blob: async () => ({ size: 100, type: 'text/html' }) }
      : { blob: async () => ({ size: 6 * 1024 * 1024, type: 'image/jpeg' }) }));
    await job;
    assert.equal(f.shell.style.size, 0); assert.equal(f.blobs.size, 0); assert.equal(f.timers.size, 0);
    assert.equal(n.image.dataset.webAmbientState, 'NO_PALETTE');
    assert.match(n.image.dataset.webAmbientFailure, /^[A-Z_]+$/);
    await n.start(); assert.equal(f.requests.length, 1); assert.equal(f.probes.length, 1);
  }
});
await test('RECOVERY_TIMEOUT_ABORTS_FETCH_RELEASES_RESOURCES_AND_RETRIES_ONLY_AFTER_BACKOFF', async () => {
  const f = fixture(), n = f.nodes(), job = n.start(); f.probes[0].fail(); await tick();
  for (const callback of [...f.timers.values()]) callback(); await job;
  assert.equal(f.requests[0].options.signal.aborted, true); assert.equal(f.timers.size, 0);
  assert.equal(n.image.dataset.webAmbientFailure, 'TIMEOUT'); assert.equal(f.shell.style.size, 0);
  await n.start(); assert.equal(f.probes.length, 1);
  f.advance(); const retry = n.start(); assert.equal(f.probes.length, 2);
  n.controller.abort(); f.probes[1].fail(); await tick(); f.requests[1].reject(Error('network')); await retry;
});
await test('NON_WEB_AND_UNSAFE_IMAGE_URIS_NEVER_START_RECOVERY', async () => {
  const f = fixture(); f.enable(false); await f.nodes().start(); assert.equal(f.probes.length, 0);
  f.enable(true);
  for (const uri of ['blob:http://localhost:3000/a', 'data:image/png,a', 'http://localhost:3000/a', 'https://user:fixture@art.fixture.invalid/a']) {
    const n = f.nodes(); n.image.currentSrc = uri; await n.start();
  }
  assert.equal(f.probes.length, 0); assert.equal(f.requests.length, 0);
});
await test('RECOVERY_REMAINS_DEDUPLICATED_WITH_TWO_JOBS_DURING_ROUTE_CHANGES', async () => {
  const f = fixture(), one = f.nodes('one'), two = f.nodes('two'), third = f.nodes('third');
  const firstJob = one.start(), duplicate = one.start(), secondJob = two.start();
  f.probes[0].fail(); f.probes[1].fail(); await tick();
  await third.start();
  assert.equal(f.requests.length, 2); assert.equal(f.probes.length, 2);
  assert.equal(third.image.dataset.webAmbientFailure, 'BUSY');
  for (const request of f.requests) request.reject(Error('offline'));
  await Promise.all([firstJob, duplicate, secondJob]);
  assert.equal(f.timers.size, 0); assert.equal(f.blobs.size, 0); assert.equal(f.shell.style.size, 0);
});
console.log(JSON.stringify({ result: 'PASS', tests, realBrowser: false, syntheticPorts: true }));
