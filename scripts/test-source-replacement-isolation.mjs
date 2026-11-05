import assert from 'node:assert/strict';
import { SOURCE_REPLACEMENT_KEY as KEY, SOURCE_METADATA_KEYS, SourceReplacementLifecycle as Lifecycle,
  sourceScopedStorageKey, finishSourceRestart, clearSourcePresentationDatabases, SOURCE_PRESENTATION_DATABASES } from '../src/bootstrap/source-replacement.ts';
import { WatchHistory } from '../src/playback/watch-history.ts';
import { LastLiveChannel } from '../src/playback/last-live-channel.ts';
import { SeriesPersonalStore } from '../src/ui/series-personal.store.ts';
import { LiveFavorites, liveFavoriteScope } from '../src/playback/live-favorites.ts';
import { newContentScope } from '../src/catalog/new-content-badge.ts';
const binding = id => ({ sourceId: id, sourceVersion: 1, protocol: 'XTREAM' });
const pointer = (id, snapshotId = 'snapshot_a') => ({ ...binding(id), kind: 'REAL', snapshotId });
const storage = () => { const rows = new Map(); return { rows, getItem: k => rows.get(k) ?? null, setItem: (k,v) => rows.set(k,v), removeItem: k => rows.delete(k) }; };
let count = 0, epoch = 0;
const create = (s, reload = true) => new Lifecycle(s, reload, () => 's_activation_' + ++epoch);
async function test(name, run) { await run(); count++; console.log('PASS ' + name); }

await test('installed migration cleans only source metadata and requires one new runtime', () => {
  const s = storage(); s.setItem('device_identity', 'kept'); s.setItem('license', 'kept');
  SOURCE_METADATA_KEYS.forEach(k => s.setItem(k, 'old'));
  const l = create(s), p = l.prepare(binding('A'), pointer('A'));
  assert.equal(p.kind, 'RELOAD_REQUIRED'); assert.equal(l.pending(), true);
  for (const k of SOURCE_METADATA_KEYS) assert.equal(s.getItem(k), null);
  assert.equal(s.getItem('device_identity'), 'kept'); assert.equal(s.getItem('license'), 'kept');
  assert.equal(l.prepare(binding('A'), pointer('A')).kind, 'RELOAD_REQUIRED');
  const restarted = create(s); assert.equal(restarted.prepare(binding('A'), pointer('A')).kind, 'FRESH_IMPORT');
  restarted.complete(binding('A'), pointer('A', 'clean_a'), p.epoch);
  assert.equal(restarted.verified(pointer('A', 'clean_a')), true);
  assert.equal(restarted.verified(pointer('A')), false);
  assert.equal(restarted.prepare(binding('A'), pointer('A', 'clean_a')).kind, 'UNCHANGED');
});
await test('A to B to A creates different epochs even when B never promotes', () => {
  const s = storage(), l = create(s, false);
  const a = l.prepare(binding('A'), null); l.complete(binding('A'), pointer('A'), a.epoch);
  const b = l.prepare(binding('B'), pointer('A'));
  const returned = l.prepare(binding('A'), pointer('A'));
  assert.equal(returned.kind, 'FRESH_IMPORT'); assert.equal(new Set([a.epoch,b.epoch,returned.epoch]).size, 3);
  assert.throws(() => l.complete(binding('A'), pointer('A'), a.epoch), /COMMIT_MISMATCH/);
  assert.equal(l.verified(pointer('A')), false);
});
await test('version and protocol changes both invalidate same logical ID', () => {
  for (const change of [{ sourceVersion: 2 }, { protocol: 'M3U' }]) {
    const s = storage(), l = create(s, false), a = l.prepare(binding('A'), null);
    l.complete(binding('A'), pointer('A'), a.epoch);
    const b = l.prepare({ ...binding('A'), ...change }, pointer('A'));
    assert.notEqual(b.epoch, a.epoch); assert.equal(b.kind, 'FRESH_IMPORT');
  }
});
await test('interrupted PREPARED cleanup resumes and never reports old snapshot verified', () => {
  const s = storage(), remove = s.removeItem; let fail = true;
  s.removeItem = k => { if (fail) throw Error('storage fixture failure'); remove(k); };
  assert.throws(() => create(s).prepare(binding('B'), pointer('A')), /storage fixture/);
  assert.equal(JSON.parse(s.getItem(KEY)).phase, 'PREPARED');
  const before = JSON.parse(s.getItem(KEY)).epoch; fail = false;
  const p = create(s).prepare(binding('B'), pointer('A'));
  assert.equal(p.epoch, before); assert.equal(p.kind, 'RELOAD_REQUIRED');
});
await test('lost writes and incomplete removals block rather than falsely completing', () => {
  const s = storage(); s.setItem = () => {};
  assert.throws(() => create(s).prepare(binding('A'), null), /WRITE_FAILED/);
  const t = storage(); t.setItem(SOURCE_METADATA_KEYS[0], 'retained'); t.removeItem = () => {};
  assert.throws(() => create(t).prepare(binding('A'), null), /CLEANUP_FAILED/);
  assert.equal(JSON.parse(t.getItem(KEY)).phase, 'PREPARED');
});
await test('invalid state, target, snapshot and stale commit cannot authorize reuse', () => {
  const s = storage(); s.setItem(KEY, '{bad'); const l = create(s, false);
  assert.equal(l.verified(pointer('A')), false); assert.equal(l.pending(), true);
  assert.throws(() => l.prepare({ ...binding('A'), sourceVersion: NaN }, null), /BINDING_INVALID/);
  const a = l.prepare(binding('A'), null);
  assert.throws(() => l.complete(binding('B'), pointer('B'), a.epoch), /COMMIT_MISMATCH/);
  assert.throws(() => l.complete(binding('A'), { ...pointer('A'), snapshotId: '../unsafe' }, a.epoch), /COMMIT_MISMATCH/);
});
await test('last synchronous cleanup removes closing runtime writes before reload', () => {
  const s = storage(); create(s).prepare(binding('A'), null);
  s.setItem(SOURCE_METADATA_KEYS[0], 'late completion'); let reloads = 0;
  finishSourceRestart(s, () => { assert.equal(s.getItem(SOURCE_METADATA_KEYS[0]), null); reloads++; });
  assert.equal(reloads, 1);
  const l = create(s), p = l.prepare(binding('A'), null); l.complete(binding('A'), pointer('A'), p.epoch);
  assert.throws(() => finishSourceRestart(s, () => reloads++), /NOT_PREPARED/); assert.equal(reloads, 1);
});
await test('personal data and novelty inventory never rebind through colliding IDs', () => {
  const s = storage(); globalThis.window = { localStorage: s };
  try {
    const l = create(s, false), a = l.prepare(binding('A'), null); l.complete(binding('A'), pointer('A'), a.epoch);
    const h = new WatchHistory(s, async () => []), personal = new SeriesPersonalStore(s), last = new LastLiveChannel(s), favorites = new LiveFavorites(() => s);
    const nonce = h.begin('movie', 'same_id', undefined, '0123456789abcdef');
    h.observe({ playbackId: nonce, positionMs: 12000, durationMs: 60000, observedAt: 1 });
    personal.set('0123456789abcdef', { favorite: true }, { kind: 'movie', itemId: 'same_id' });
    const channel = { id: 'same_id', groupId: 'same_group', name: 'Channel' }, catalog = { groups: [{ id: 'same_group', name: 'General' }], channels: [channel] };
    last.remember(channel, catalog); favorites.toggle(liveFavoriteScope('A'), channel, catalog);
    const scopeA = newContentScope('A'), oldKey = sourceScopedStorageKey('xandeflix:recent-watched:v1');
    const b = l.prepare(binding('B'), pointer('A')); l.complete(binding('B'), pointer('B'), b.epoch);
    assert.equal(new WatchHistory(s).list().length, 0); assert.equal(new SeriesPersonalStore(s).favorites().length, 0);
    assert.equal(new LastLiveChannel(s).read(), undefined); assert.equal(new LiveFavorites(() => s).keys(liveFavoriteScope('A')).size, 0);
    assert.notEqual(newContentScope('A'), scopeA); assert.ok(s.getItem(oldKey));
    h.observe({ playbackId: nonce, positionMs: 13000, durationMs: 60000, observedAt: 2 });
    assert.equal(new WatchHistory(s).list().length, 0); assert.equal(h.list()[0].positionMs, 13000);
  } finally { delete globalThis.window; }
});
await test('only allowlisted presentation databases are removed; blocked and failed cleanup reject', async () => {
  const names=[];
  await clearSourcePresentationDatabases({ deleteDatabase(name) { names.push(name); const request={}; queueMicrotask(()=>request.onsuccess()); return request; } });
  assert.deepEqual(names, [...SOURCE_PRESENTATION_DATABASES]);
  for (const event of ['onblocked','onerror']) {
    let calls=0;
    await assert.rejects(clearSourcePresentationDatabases({ deleteDatabase() { calls++; const request={}; queueMicrotask(()=>request[event]()); return request; } }), /SOURCE_PRESENTATION_CLEANUP/);
    assert.equal(calls,1);
  }
});
console.log(`SOURCE_REPLACEMENT_ISOLATION=PASS ${count}`);
