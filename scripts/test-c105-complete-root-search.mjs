import assert from 'node:assert/strict';
import { DeferredSearchIndexCoordinator } from '../src/search/deferred-search-index-coordinator.ts';
import { CompactSearchEngineV2Pruned } from '../src/experiments/search-compact-v2-pruned/compact-search-v2-pruned-engine.ts';
import { CompactSearchIndexV2Builder } from '../src/experiments/search-compact-v2/compact-search-v2-builder.ts';
import { serializeCompactIndexV2, deserializeCompactIndexV2 } from '../src/experiments/search-compact-v2/compact-search-v2-serializer.ts';

const channels = Array.from({ length: 252 }, (_, i) => ({ id: `live:${i + 1}`, name: `Canal ${i + 1}`, groupId: 'g1',
  streamRef: { directStreamUrl: `https://private.synthetic.invalid/live/${i + 1}.m3u8` } }));
channels[251].name = 'Último Canal Distante';
const header = { metadata: { schemaVersion: 1, catalogVersion: '1', snapshotId: 'root-search-test', generatedAt: '', counts: {} },
  movies: [{ id: 'movie:1', title: 'Filme', genreIds: [], categoryIds: [] }], series: [{ id: 'series:1', title: 'Série', genreIds: [], categoryIds: [] }],
  categories: [], genres: [], streams: [], artworks: [], seasons: [], episodes: [], extensions: { sourceInventoryMode: 'DIRECTORY_ROOTS_V1' } };
const liveCatalog = { snapshotId: header.metadata.snapshotId, groups: [{ id: 'g1', name: 'Notícias' }], channels: channels.slice(0, 3) };
const segments = [{ kind: 'live', fileName: 'live_1.json' }, { kind: 'live', fileName: 'live_2.json' }];
const manifest = { snapshotId: header.metadata.snapshotId, counts: { movies: 1, series: 1, live: 252 }, segments };
let activeId = header.metadata.snapshotId, written = 0, fail = false, change = false;
let binary = serializeCompactIndexV2(new CompactSearchIndexV2Builder().build(header, { liveCatalog })).buffer;
const before = Buffer.from(binary);
const storage = {
  readActivePointer: async () => ({ snapshotId: activeId }), readActiveCatalog: async () => header, readActiveManifest: async () => manifest,
  readActiveSearchIndexBuffer: async () => binary,
  readActiveSegment: async path => { if (fail && path.endsWith('live_2.json')) return null;
    if (change) activeId = 'new-root';
    return JSON.stringify(path.endsWith('live_1.json') ? channels.slice(0, 130) : channels.slice(130)); },
  writeActiveSearchIndex: async (snapshot, data) => { assert.equal(snapshot, activeId); written++; binary = data; },
};
assert.equal(await DeferredSearchIndexCoordinator.hasUsableActiveIndex(activeId, storage), false, 'Old first-fold-only index must rebuild locally');
const result = await DeferredSearchIndexCoordinator.buildAndPersistIndex(activeId, storage, { liveCatalog });
assert.equal(result.success, true); assert.equal(written, 1);
assert.equal(deserializeCompactIndexV2(binary).metadata.documentCount, 254);
assert.equal(await DeferredSearchIndexCoordinator.hasUsableActiveIndex(activeId, storage), true);
const engine = new CompactSearchEngineV2Pruned(); engine.load(binary);
assert.ok(engine.query('Último Canal Distante').items.some(row => row.kind === 'live' && row.id === 'live:252'));
assert.equal(Buffer.from(binary).includes(Buffer.from('private.synthetic.invalid')), false, 'No source URI in the search index');
console.log('PASS_FULL_LIVE_SEGMENTS_LOCAL_LAST_CHANNEL_INDEX_REBUILD_AND_NO_PRIVATE_URI');
const completed = Buffer.from(binary); fail = true;
await assert.rejects(DeferredSearchIndexCoordinator.buildAndPersistIndex(activeId, storage, { liveCatalog }), /SEARCH_MISSING_SEGMENT/);
assert.equal(written, 1); assert.deepEqual(Buffer.from(binary), completed);
console.log('PASS_MISSING_LATE_LIVE_SEGMENT_PRESERVES_PRIOR_INDEX');
fail = false; change = true;
await assert.rejects(DeferredSearchIndexCoordinator.buildAndPersistIndex(header.metadata.snapshotId, storage, { liveCatalog }), /SEARCH_GENERATION_CHANGED/);
assert.equal(written, 1); assert.deepEqual(Buffer.from(binary), completed);
console.log('PASS_ACTIVE_DIRECTORY_CHANGE_REJECTS_MIXED_GENERATION_BEFORE_PERSIST');
assert.notDeepEqual(completed, before);
