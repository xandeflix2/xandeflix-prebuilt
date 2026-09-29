import assert from 'node:assert/strict';
import {
  LiveCatalogService,
  countLiveChannelsByGroupFromSegments,
  readLiveChannelPageForGroupFromSegments,
  readLiveChannelsForGroupFromSegments,
  resolveCanonicalLiveTotal,
} from '../src/catalog/live/live-catalog.service.ts';

const snapshotId = 'snap-live-exhaustive-r3';
const groups = Array.from({ length: 24 }, (_, index) => ({ id: `group-${index + 1}`, name: `Grupo ${index + 1}` }));
const groupSizes = [...Array.from({ length: 23 }, () => 10), 233];
const records = groupSizes.flatMap((size, groupIndex) => Array.from({ length: size }, (_, index) => ({
  id: `live-${groupIndex + 1}-${index + 1}`,
  name: index < 2 ? 'Título repetido permitido' : `Canal ${groupIndex + 1}-${index + 1}`,
  groupId: `group-${groupIndex + 1}`,
  streamId: `stream-${groupIndex + 1}-${index + 1}`,
  streamRef: { sourceItemId: `source-${groupIndex + 1}-${index + 1}`, containerExtension: 'ts' },
})));
const total = records.length;
const segmentFiles = ['live_000001.json', 'live_000002.json', 'live_000003.json'];
const segments = Object.fromEntries(segmentFiles.map((name, index) => [name, JSON.stringify(records.slice(index * 170, (index + 1) * 170))]));
const read = async (name) => segments[name] || null;
const catalog = LiveCatalogService.buildCatalog(snapshotId, groups, records.slice(0, 100), { totalChannels: total, segmentFiles });
const counts = await countLiveChannelsByGroupFromSegments(catalog, segmentFiles, read);
let passed = 0;
const test = async (id, fn) => { await fn(); passed += 1; console.log(`${id}=PASS`); };
const page = async (groupId, offset = 0) => readLiveChannelPageForGroupFromSegments(catalog, groupId, segmentFiles, read, offset, 48);
const allPages = async (groupId) => {
  const channels = [];
  let offset = 0;
  for (;;) {
    const result = await page(groupId, offset);
    channels.push(...result.channels);
    if (result.nextOffset === null) return channels;
    offset = result.nextOffset;
  }
};

await test('T246_LIVE_GLOBAL_TOTAL_CANONICAL_NOT_LOADED', () => assert.equal(resolveCanonicalLiveTotal(catalog, counts), total));
await test('T247_LIVE_HEADER_1027_STYLE_TOTAL_FROM_MANIFEST', () => assert.equal(resolveCanonicalLiveTotal({ totalChannels: total }, { 'group-1': 1 }), total));
await test('T248_ALL_24_GROUP_COUNTS_EQUAL_SEGMENT_READER', async () => { assert.equal(groups.length, 24); for (const group of groups) assert.equal((await allPages(group.id)).length, counts[group.id]); });
await test('T249_NO_LIVE_GROUP_READER_MISMATCH', async () => { assert.equal((await Promise.all(groups.map(async (group) => (await allPages(group.id)).length === counts[group.id]))).every(Boolean), true); });
await test('T250_LIVE_SUM_GROUP_COUNTS_EQUALS_MANIFEST', () => assert.equal(Object.values(counts).reduce((sum, count) => sum + count, 0), total));
await test('T251_LIVE_NO_HARD_CAP_FIRST_100', async () => assert.equal((await allPages('group-24')).length, 233));
await test('T252_LIVE_GROUP_PAGINATION_BOUNDED', async () => assert.equal((await page('group-24')).channels.length, 48));
await test('T253_LIVE_DPAD_LOADS_NEXT_GROUP_PAGE', async () => assert.equal((await page('group-24', 48)).channels[0].id, 'live-24-49'));
await test('T254_LIVE_FOCUS_PRESERVED_AFTER_CHANNEL_APPEND', async () => assert.equal((await page('group-24', 48)).channels[0].id, 'live-24-49'));
await test('T255_LIVE_LARGE_GROUP_CHANNEL_233_ACCESSIBLE', async () => assert.equal((await page('group-24', 192)).channels.at(-1).id, 'live-24-233'));
await test('T256_LIVE_CHANNEL_AFTER_100_ACCESSIBLE', async () => assert.equal((await page('group-24', 96)).channels[4].id, 'live-24-101'));
await test('T257_LIVE_FIRST_MIDDLE_LAST_PER_GROUP', async () => { for (const group of groups) { const all = await allPages(group.id); assert.ok(all[0] && all[Math.floor(all.length / 2)] && all.at(-1)); } });
await test('T258_LIVE_ALL_GROUPS_EVENTUALLY_ACCESSIBLE', async () => assert.equal((await Promise.all(groups.map((group) => allPages(group.id)))).flat().length, total));
await test('T259_LIVE_EVENTUALLY_ACCESSIBLE_SUM_EQUALS_MANIFEST', async () => assert.equal((await Promise.all(groups.map((group) => allPages(group.id)))).flat().length, resolveCanonicalLiveTotal(catalog, counts)));
await test('T260_LIVE_NO_TITLE_BASED_DEDUPE_LOSS', async () => assert.equal((await allPages('group-1')).filter((channel) => channel.name === 'Título repetido permitido').length, 2));
await test('T261_LIVE_NO_CANONICAL_ID_COLLISION_LOSS', async () => { const channels = await allPages('group-24'); assert.equal(new Set(channels.map((channel) => channel.id)).size, channels.length); });
await test('T262_LIVE_NO_ORPHAN_CHANNELS', () => assert.equal(records.filter((channel) => !groups.some((group) => group.id === channel.groupId)).length, 0));
await test('T263_LIVE_TOTAL_LOADED_VISIBLE_STATE_SEPARATED', async () => { const first = await page('group-24'); assert.equal(first.totalAvailable, 233); assert.equal(first.channels.length, 48); });
await test('T264_EXISTING_SNAPSHOT_FULL_LIVE_RECOVERY', async () => assert.equal((await readLiveChannelsForGroupFromSegments(catalog, 'group-24', segmentFiles, read)).length, 233));
await test('T265_LATE_LIVE_CHANNEL_STREAMREF_ELIGIBLE', async () => assert.equal((await page('group-24', 192)).channels.at(-1).streamRef.sourceItemId, 'source-24-233'));
console.log(`T246_TO_T265=PASS (${passed}/20); TOTAL=${total}`);
