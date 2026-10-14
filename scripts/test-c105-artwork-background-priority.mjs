import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import { HeroArtworkService } from '../src/artwork/hero-artwork.service.ts';

const priorities = [];
const uri = 'https://image.tmdb.org/t/p/w1280/synthetic.jpg';
const service = new HeroArtworkService(async (item, priority) => {
  priorities.push(['metadata', item.id, priority]); return { kind: 'movie', genres: [], backdropUri: uri };
}, async (image, profile, priority) => { priorities.push(['image', profile, priority]); return true; });
const item = id => ({ id, kind: 'movie', title: 'Synthetic ' + id, genreLabels: [], categoryLabels: [] });
await service.resolve(item('first'), 'horizontal');
await service.resolve(item('next'), 'horizontal', 'normal');
assert.deepEqual(priorities.map(row => row.at(-1)), ['high', 'high', 'normal', 'normal']);
console.log('PASS_METADATA_AND_IMAGE_PRIORITY_FIRST_HERO_VS_BACKGROUND');

function hookHarness(rows, limit, maxPerKind, failedId) {
  const calls = [], cache = new Map(), timers = new Map(), listeners = new Map(); let effect, retried = false, serial = 0;
  const fakeService = {
    resolve: async (row, profile, priority) => { calls.push({ id: row.id, priority });
      await new Promise(resolve => setImmediate(resolve));
      if (row.id === failedId && !retried) return undefined;
      cache.set(row.id, uri); return uri;
    },
    peek: row => cache.get(row.id), retryFailures: () => { retried = true; }, invalidate() {},
  };
  const react = { useState: initial => [typeof initial === 'function' ? initial() : initial, () => {}], useEffect: fn => { effect = fn; } };
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync('src/ui/hooks/useHeroArtwork.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Function('require', 'module', 'exports', 'window', 'setTimeout', 'clearTimeout', code)(name =>
    name === 'react' ? react : name.includes('tmdb-metadata') ? { artworkIdentityKey: row => row.id }
      : name.includes('hero-artwork') ? { heroArtworkService: fakeService, heroArtworkIdentity: row => row }
      : { reserveHeroImageSlot: () => () => {} }, module, module.exports,
    { addEventListener: (name, callback) => listeners.set(name, callback), removeEventListener: name => listeners.delete(name) },
    (fn, ms) => { const id = ++serial; timers.set(id, { fn, ms }); return id; }, id => timers.delete(id));
  const hook = () => module.exports.useHeroArtwork(rows, 'horizontal', limit, maxPerKind);
  hook(); const cleanup = effect();
  return { calls, timers, hook, cleanup, cache, listeners };
}
const tick = () => new Promise(resolve => setImmediate(resolve));
const rows = Array.from({ length: 6 }, (_, index) => item(String(index)));
const h = hookHarness(rows, 6, 0, '3');
for (let i = 0; i < 15; i++) await tick();
assert.ok(h.calls.length === 6);
assert.ok(h.calls.slice(0, 2).every(row => row.priority === 'high'));
assert.ok(h.calls.slice(2).every(row => row.priority === 'normal'));
assert.equal(h.cache.size, 5);
assert.equal(h.timers.size, 1);
for (let retry = 0; retry < 3 && h.timers.size; retry++) {
  const [id, timer] = h.timers.entries().next().value; assert.equal(timer.ms, 30000); h.timers.delete(id); timer.fn();
  for (let i = 0; i < 15; i++) await tick();
}
assert.equal(h.cache.size, 6); assert.equal(h.timers.size, 0);
h.cleanup(); assert.equal(h.listeners.size, 0);
console.log('PASS_FIRST_TWO_URGENT_REMAINING_BACKGROUND_RETRY_CONTINUES_AFTER_FIRST_HERO');
const capped = hookHarness(rows, 6, 2);
for (let i = 0; i < 15; i++) await tick();
assert.equal(capped.cache.size, 3, 'Two in-flight workers may both reach the existing per-kind bound');
assert.equal(capped.timers.size, 0, 'A completed per-kind quota must not repeatedly fetch remaining candidates');
capped.cleanup();
console.log('PASS_PER_KIND_TARGET_NO_UNNECESSARY_RETRY_AND_LISTENER_CLEANUP');
