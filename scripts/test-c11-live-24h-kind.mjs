import assert from 'node:assert/strict';
import { classifyCanonicalSourceContent, isExplicit24HourChannel } from '../src/source/content-kind-classifier.ts';
import { classifySourceItemWithProfile, getManagedSourceClassificationProfile, MANAGED_SOURCE_CLASSIFICATION_PROFILE_SOURCE_ID, CURRENT_CLASSIFICATION_PROFILE_VERSION } from '../src/source/source-classification-profile.ts';
import { requiresClassificationProfileRefresh } from '../src/bootstrap/boot-sync-coordinator.ts';
import { RealSourceImporterService } from '../src/source/real-source-importer.service.ts';
import { InMemoryCatalogStorage } from '../src/bootstrap/storage/in-memory.storage.ts';

const channel = { title: '24H CHAVES TEMPORADA 07', groupName: 'CANAIS | 24HRS', streamUrl: 'https://source.synthetic.invalid/series/continuous.ts' };
for (const groupName of ['CANAIS | 24HRS', 'CANAL | 24H', 'canais | 24 horas', 'CANAIS | 24HR']) {
  const input = { ...channel, groupName }; assert.equal(isExplicit24HourChannel(input), true); assert.equal(classifyCanonicalSourceContent(input), 'live');
  for (const sourceId of ['unmanaged-synthetic', MANAGED_SOURCE_CLASSIFICATION_PROFILE_SOURCE_ID]) assert.equal(classifySourceItemWithProfile({ ...input, sourceId, profile: getManagedSourceClassificationProfile(sourceId) }).canonicalKind, 'live');
}
for (const [input, kind] of [
  [{ ...channel, groupName: 'SERIES | 24HRS' }, 'series'],
  [{ ...channel, groupName: 'CANAIS | 24HRS', title: 'Série S01E01' }, 'series'],
  [{ ...channel, title: '24H CHAVES S01E01' }, 'series'],
  [{ ...channel, title: '24H CHAVES TEMPORADA 07 EP08' }, 'series'],
  [{ ...channel, streamUrl: 'https://source.synthetic.invalid/movie/1.mp4' }, 'movie'],
  [{ ...channel, title: '24 horas' }, 'series'],
  [{ ...channel, title: '24House' }, 'series'],
  [{ ...channel, title: '24H CHAVES tvg-logo="raw"' }, 'unresolved'],
]) { assert.equal(isExplicit24HourChannel(input), false); assert.equal(classifyCanonicalSourceContent(input), kind); }
assert.equal(classifySourceItemWithProfile({ ...channel, explicitKind: 'series' }).canonicalKind, 'series');
assert.equal(isExplicit24HourChannel({ ...channel, title: '24H CHAVES SEASON 07' }), true);
assert.equal(CURRENT_CLASSIFICATION_PROFILE_VERSION, 4);
for (const version of [undefined, 1, 2, 3]) assert.equal(requiresClassificationProfileRefresh({ classificationProfileVersion: version }), true);
assert.equal(requiresClassificationProfileRefresh({ classificationProfileVersion: 4 }), false);
console.log('PASS_REAL_24H_CONTEXT_LIVE_GENERIC_MANAGED_NEGATIVES_EXPLICIT_KIND_REFRESH2_TO4');

const m3u = '#EXTM3U\n#EXTINF:-1 tvg-id="chaves-24h" group-title="CANAIS | 24HRS",24H CHAVES TEMPORADA 07\nhttps://source.synthetic.invalid/series/continuous.ts\n#EXTINF:-1 group-title="SERIES | TESTE",Série real S01E01\nhttps://source.synthetic.invalid/series/episode.ts\n';
const storage = new InMemoryCatalogStorage();
const result = await RealSourceImporterService.importM3u({ playlistUrl: 'https://source.synthetic.invalid/list.m3u' }, { fetchImpl: async () => new Response(m3u, { status: 200 }), storage, snapshotId: 'synthetic-24h-context', sourceId: 'synthetic-24h-source', provenance: { kind: 'REAL', sourceId: 'synthetic-24h-source', sourceVersion: 1 } });
assert.equal(result.success, true); assert.equal(result.catalog.series.length, 1); assert.equal(result.catalog.series[0].title, 'Série real');
assert.equal(result.liveCatalog.channels.length, 1); assert.equal(result.liveCatalog.channels[0].name, channel.title);
assert.equal(result.liveCatalog.channels[0].groupName, 'CANAIS | 24HRS');
assert.equal(result.liveCatalog.channels[0].streamRef.directStreamUrl, channel.streamUrl);
assert.equal((await storage.readStaging('synthetic-24h-context')).manifest.classificationProfileVersion, 4);
console.log('PASS_REAL_M3U_IMPORT_24H_ONLY_LIVE_REAL_SERIES_UNCHANGED_LOCATOR_PRESERVED_PROFILE4');
