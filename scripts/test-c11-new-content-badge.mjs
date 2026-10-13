import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { scanNewContent, newContentKey, newContentScope, isNewContent, NEW_CONTENT_WINDOW_MS,
  NEW_CONTENT_MAX_KEYS, NewContentDisplayStore } from '../src/catalog/new-content-badge.ts';

const time = 1791579600000, signal = () => new AbortController().signal;
let tests = 0;
async function test(name, run) { await run(); tests++; console.log('PASS ' + name); }
class Repository {
  records = new Map(); commits = 0;
  async read(scope) { return structuredClone(this.records.get(scope) || null); }
  async commit(value, expected, abortSignal) {
    assert.equal(abortSignal?.aborted, false);
    assert.equal(this.records.get(value.scope)?.snapshotId, expected);
    this.records.set(value.scope, structuredClone(value)); this.commits++;
  }
}
function fixture(id = 'initial', source = 'source-a', movies = [{ title: 'Filme antigo (2020)' }], series = [{ title: 'Série antiga' }]) {
  const payload = { 'segments/movies.json': movies, 'segments/series.json': series };
  const reads = [];
  const model = { catalog: { metadata: { snapshotId: id }, movies: movies.slice(0, 1), series: series.slice(0, 1) } };
  const manifest = { snapshotId: id, metadata: { sourceId: source }, counts: { movies: movies.length, series: series.length },
    segments: Object.entries(payload).map(([fileName, rows]) => ({ fileName, kind: fileName.includes('movies') ? 'movies' : 'series', recordCount: rows.length })) };
  const storage = { async readActiveManifest() { return manifest; }, async readActivePointer() { return { snapshotId: id }; },
    async readActiveSegment(path) { reads.push(path); return JSON.stringify(payload[path]); } };
  return { model, storage, manifest, payload, reads };
}
const scan = (f, repo, abort = signal(), at = time, cooperate = async () => {}) => scanNewContent(f.model, f.storage, repo, abort, () => {}, at, cooperate);
const key = newContentKey('movie', 'Filme novo (1995)');

await test('COMPLETE_INITIAL_REFERENCE_NEVER_MARKS_INSTALLED_CATALOG_NEW', async () => {
  const repo = new Repository(), f = fixture('a', 'source-a', [{ title: 'Primeiro' }, { title: 'Fora do first-fold' }]);
  const result = await scan(f, repo);
  assert.equal(Object.keys(result.seen).length, 3);
  assert.ok(Object.values(result.seen).every(date => date === 0));
  assert.deepEqual(f.reads, ['segments/movies.json', 'segments/series.json']);
});
await test('NEW_INSERTION_OLD_RELEASE_YEAR_RECEIVES_SEVEN_DAYS_EXACT', async () => {
  const repo = new Repository(); await scan(fixture(), repo);
  const result = await scan(fixture('b', 'source-a', [{ title: 'Filme antigo (2020)' }, { title: 'Filme novo (1995)' }]), repo);
  assert.equal(result.seen[key], time);
  assert.equal(isNewContent(time, time - 1), false);
  assert.equal(isNewContent(time, time), true);
  assert.equal(isNewContent(time, time + NEW_CONTENT_WINDOW_MS - 1), true);
  assert.equal(isNewContent(time, time + NEW_CONTENT_WINDOW_MS), false);
  assert.equal(isNewContent(0, time), false);
});
await test('RESTART_RESYNC_REORDER_POSTER_METADATA_AND_REINSERT_DO_NOT_RENEW', async () => {
  const repo = new Repository(); await scan(fixture(), repo);
  await scan(fixture('b', 'source-a', [{ id: 'movie-2', title: 'Filme novo (1995)' }]), repo);
  const same = fixture('b', 'source-a', [{ title: 'Ignored different payload for same immutable snapshot' }]);
  assert.equal((await scan(same, repo, signal(), time + 1234)).seen[key], time); assert.equal(same.reads.length, 0);
  await scan(fixture('c', 'source-a', []), repo);
  const result = await scan(fixture('d', 'source-a', [{ id: 'movie-999', title: '  FILME  novo (1995) ', year: 2026, posterUrl: 'changed', externalIds: { tmdbId: 'different' } }]), repo, signal(), time + 8 * 86400000);
  assert.equal(result.seen[key], time); assert.equal(isNewContent(result.seen[key], time + 8 * 86400000), false);
});
await test('MOVIE_SERIES_SOURCE_ISOLATION_AND_NO_PRIVATE_DATA_IN_LEDGER', async () => {
  const repo = new Repository(); await scan(fixture(), repo);
  const result = await scan(fixture('b', 'source-a', [{ title: 'Mesmo nome' }], [{ title: 'Mesmo nome' }]), repo);
  assert.notEqual(newContentKey('movie', 'Mesmo nome'), newContentKey('series', 'Mesmo nome'));
  assert.equal(result.seen[newContentKey('series', 'Mesmo nome')], time);
  const other = await scan(fixture('other', 'source-b', [{ title: 'Mesmo nome' }]), repo);
  assert.ok(Object.values(other.seen).every(date => date === 0));
  assert.notEqual(result.scope, other.scope);
  assert.ok(!JSON.stringify([...repo.records.values()]).includes('Mesmo nome'));
  assert.ok(!JSON.stringify([...repo.records.values()]).includes('source-a'));
});
await test('ABORT_MISSING_MALFORMED_OR_INCOMPLETE_SEGMENTS_NEVER_COMMIT', async () => {
  for (const mode of ['abort', 'missing', 'malformed', 'partial', 'bad-row']) {
    const repo = new Repository(), f = fixture();
    const controller = new AbortController();
    if (mode === 'abort') controller.abort();
    if (mode === 'missing') f.storage.readActiveSegment = async () => null;
    if (mode === 'malformed') f.storage.readActiveSegment = async () => '{';
    if (mode === 'partial') f.manifest.counts.movies++;
    if (mode === 'bad-row') f.payload['segments/movies.json'][0] = { title: '' };
    await assert.rejects(scan(f, repo, controller.signal)); assert.equal(repo.commits, 0);
  }
});
await test('GENERATION_SWITCH_DURING_SCAN_AND_ABORT_BETWEEN_BATCHES_PRESERVE_BASELINE', async () => {
  const repo = new Repository(); await scan(fixture(), repo);
  const old = JSON.stringify([...repo.records.values()]);
  const f = fixture('b', 'source-a', Array.from({ length: 401 }, (_, i) => ({ title: 'Novo ' + i })));
  let calls = 0; f.storage.readActivePointer = async () => ({ snapshotId: ++calls > 1 ? 'changed' : 'b' });
  await assert.rejects(scan(f, repo), /GENERATION_CHANGED/);
  assert.equal(JSON.stringify([...repo.records.values()]), old);
  const controller = new AbortController();
  await assert.rejects(scan(fixture('b', 'source-a', Array.from({ length: 401 }, (_, i) => ({ title: 'Novo ' + i }))), repo, controller.signal, time, async () => controller.abort()), /CANCELLED/);
  assert.equal(JSON.stringify([...repo.records.values()]), old);
});
await test('STORAGE_FAILURE_CANNOT_EXPOSE_UNCOMMITTED_DATES', async () => {
  const repo = new Repository(); await scan(fixture(), repo);
  const old = JSON.stringify([...repo.records.values()]);
  repo.commit = async () => { throw Error('storage quota'); };
  await assert.rejects(scan(fixture('b', 'source-a', [{ title: 'New title' }]), repo), /storage quota/);
  assert.equal(JSON.stringify([...repo.records.values()]), old);
});
await test('EMPTY_BASELINE_AND_NONSEGMENTED_COMPLETE_CATALOG_SUPPORTED', async () => {
  const repo = new Repository(), f = fixture('empty', 'source-a', [], []);
  await scan(f, repo);
  const next = fixture('b', 'source-a', [{ title: 'Primeiro conteúdo' }], []); next.manifest.segments = [];
  const result = await scan(next, repo);
  assert.equal(result.seen[newContentKey('movie', 'Primeiro conteúdo')], time);
  next.manifest.counts.movies = 3; next.model.catalog.metadata.snapshotId = 'c'; next.manifest.snapshotId = 'c';
  await assert.rejects(scan(next, repo), /INCOMPLETE/);
});
await test('INVENTORY_BOUNDED_AND_ONLY_MOVIE_SERIES_SEGMENTS_READ', async () => {
  const repo = new Repository(), f = fixture('a', 'source-a', Array.from({ length: NEW_CONTENT_MAX_KEYS + 1 }, (_, i) => ({ title: 'Title ' + i })), []);
  await assert.rejects(scan(f, repo), /LIMIT/); assert.equal(repo.commits, 0);
  const small = fixture(); small.manifest.segments.push({ kind: 'streams', fileName: 'private-streams.json', recordCount: 300 });
  await scan(small, repo); assert.ok(small.reads.every(path => !path.includes('streams')));
});
await test('SHARED_DISPLAY_STORE_EXPIRES_AND_UNSUBSCRIBES_WITHOUT_PER_CARD_IO', () => {
  const store = new NewContentDisplayStore(), now = Date.now(); let events = 0;
  const unsubscribe = store.subscribe(() => events++);
  store.publish({ version: 1, scope: newContentScope('source-a'), snapshotId: 'a', seen: { [key]: now, old: 0 } }, now);
  assert.equal(store.has(key), true); assert.equal(store.nextExpiry(), now + NEW_CONTENT_WINDOW_MS);
  store.expire(now + NEW_CONTENT_WINDOW_MS - 1); assert.equal(events, 1);
  store.expire(now + NEW_CONTENT_WINDOW_MS); assert.equal(store.has(key), false); assert.equal(events, 2);
  assert.equal(store.nextExpiry(), undefined); unsubscribe(); store.publish(null); assert.equal(events, 2);
});
await test('REAL_CARD_MARKUP_ACCESSIBLE_AND_NO_ADDITIONAL_DPAD_TARGET', () => {
  const text = readFileSync(new URL('../src/ui/components/MediaCard.tsx', import.meta.url), 'utf8');
  for (const fresh of [true, false]) {
    const module = { exports: {} }, ports = { react: React,
      './Artwork.tsx': { Artwork: () => React.createElement('img', { alt: '' }) },
      '../../artwork/artwork-uri.ts': { displayArtworkUri: () => undefined },
      '../../artwork/image-load-queue.ts': { loadImage: () => Promise.resolve() },
      './NewContentProvider.tsx': { useContentBadge: () => fresh ? 'Novidade' : undefined } };
    new Function('require', 'module', 'exports', ts.transpileModule(text, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true } }).outputText)
      (name => { assert.ok(ports[name], name); return ports[name]; }, module, module.exports);
    const html = renderToStaticMarkup(React.createElement(module.exports.MediaCard, { item: { id: 'a', title: 'Title', kind: 'series', yearFormatted: '1995', genreLabels: [] }, onClick() {} }));
    assert.equal((html.match(/<button/g) || []).length, 1);
    assert.equal(html.includes('media-card-new-badge'), fresh);
    assert.equal(html.includes(' - Novidade'), fresh);
    assert.equal(html.includes('media-card-year--with-new'), fresh);
    assert.ok(!html.includes('tabindex'));
  }
});
await test('PROVIDER_OBSERVES_ONLY_AUTHORIZED_REAL_CATALOG_AND_SHARED_CLOCK', () => {
  const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
  assert.ok(read('src/App.tsx').includes("model={authorizationGate === 'AUTHORIZED' && isExistingRealCatalog ? readModel : null}"));
  const provider = read('src/ui/components/NewContentProvider.tsx');
  assert.ok(provider.includes('controller.abort()'));
  assert.ok(provider.includes("document.removeEventListener('visibilitychange', refresh)"));
  assert.ok(provider.includes('useSyncExternalStore(store.subscribe, getSnapshot, notNew)'));
  assert.ok(!read('src/ui/components/MediaCard.tsx').includes('setInterval'));
});
console.log(JSON.stringify({ tests, pass: true, networkRequests: 0 }));
