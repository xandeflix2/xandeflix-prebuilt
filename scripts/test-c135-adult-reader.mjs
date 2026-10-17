import fs from 'node:fs';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
const dir = 'tmp/c135-active-source';
fs.mkdirSync(dir, { recursive: true });
const result = await build({ entryPoints: ['src/catalog/adult-catalog-reader.ts'], bundle: true, write: false, platform: 'node', format: 'esm',
  plugins: [{ name: 'local-parental-and-presentation-ports', setup(b) {
    const ports = {
      'parental-control.store.ts': 'export const parentalControl={adultVisible:()=>globalThis.__readerAllowed,rule:()=>undefined}',
      'parental-content.ts': 'export const parentalCatalogMetadata=row=>({key:row.id,adult:row.adult===true})',
      'catalog-selectors.ts': 'export const movieToViewModel=(_,row)=>({...row,kind:"movie"}),seriesToViewModel=(_,row)=>({...row,kind:"series"})',
    };
    b.onResolve({ filter: /\.ts$/ }, a => ports[a.path.split('/').at(-1)] ? { path: a.path.split('/').at(-1), namespace: 'ports' } : undefined);
    b.onLoad({ filter: /.*/, namespace: 'ports' }, a => ({ contents: ports[a.path], loader: 'js' }));
  } }] });
const { AdultCatalogReader } = await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
globalThis.__readerAllowed = true;
const movies = Array.from({ length: 50 }, (_, n) => ({ id: 'm' + n, title: 'Synthetic adult ' + n, categoryIds: [], adult: true }));
const series = Array.from({ length: 4 }, (_, n) => ({ id: 's' + n, title: 'Synthetic series ' + n, categoryIds: [], adult: true }));
const model = { catalog: { metadata: { snapshotId: 'fixture' }, movies: [], series: [] } };
let failSeries = true, generation = 'fixture', abortDuringRead;
const storage = { readActiveManifest: async () => ({ snapshotId: generation, segments: [{ kind: 'movies', fileName: 'segments/movies.json' }, { kind: 'series', fileName: 'segments/series.json' }] }),
  readActiveSegment: async file => {
    if (file.includes('series') && failSeries) { failSeries = false; throw new Error('SYNTHETIC_READ_FAILURE'); }
    if (abortDuringRead) { abortDuringRead.abort(); abortDuringRead = undefined; }
    return JSON.stringify(file.includes('movies') ? movies : series);
  } };
let tests = 0;
async function test(name, operation) { await operation(); tests++; console.log('PASS ' + name); }
const reader = new AdultCatalogReader(model, storage), signal = new AbortController().signal;
await test('SECOND_PHASE_FAILURE_RETRY_RETAINS_FIRST_PHASE_WITHOUT_OMISSION', async () => {
  await assert.rejects(reader.loadNext(signal), /SYNTHETIC_READ_FAILURE/);
  const batches = []; let more = true;
  while (more) { const page = await reader.loadNext(signal); batches.push(...page.items); more = page.hasMore; }
  assert.equal(batches.length, 54); assert.equal(new Set(batches.map(r => r.id)).size, 54);
  assert.deepEqual(batches.filter(r => r.kind === 'movie').map(r => r.id), movies.map(r => r.id));
  reader.dispose();
});
await test('ABORT_DOES_NOT_ADVANCE_CURSOR', async () => {
  const active = new AdultCatalogReader(model, storage), request = new AbortController(); abortDuringRead = request;
  await assert.rejects(active.loadNext(request.signal), /BLOCKED|CANCELLED/);
  const page = await active.loadNext(signal); assert.equal(page.items[0].id, 'm0'); assert.equal(page.items.length, 28); active.dispose();
});
await test('LOCK_AND_SNAPSHOT_CHANGE_PREVENT_READ', async () => {
  const active = new AdultCatalogReader(model, storage); globalThis.__readerAllowed = false;
  await assert.rejects(active.loadNext(signal), /BLOCKED/); globalThis.__readerAllowed = true; generation = 'other';
  await assert.rejects(active.loadNext(signal), /GENERATION_CHANGED/); active.dispose(); generation = 'fixture';
});
fs.writeFileSync(dir + '/adult-reader-tests.json', JSON.stringify({ result: 'PASS', tests, realSegmentedReader: true, syntheticOnly: true }, null, 2));
