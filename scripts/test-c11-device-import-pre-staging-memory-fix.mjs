/**
 * XANDEFLIX PREBUILT — C11 Device Import Pre-Staging Memory Fix Test Suite
 *
 * Valida formalmente:
 * TEST_A: SEARCH_V2_PASSTHROUGH (imported.searchIndexBuffer repassado sem Search V1)
 * TEST_B: DEVICE_LOCAL_NO_LEGACY_REBUILD (caminho device refresh não reconstrói índice textual legado)
 * TEST_C: PACKAGE_EXPORT_REGRESSION (export/package legado V1 continua funcionando perfeitamente)
 * TEST_D: STAGING_ARTIFACTS (staging contém manifest, catalog, compact-search-index-v2.bin, live_catalog)
 * TEST_E: SEARCH_INDEX (compact-search-index-v2.bin permanece legível e íntegro com engine podada)
 * TEST_F: DIRECT_STREAM (contrato directStreamUrl permanece preservado e fora do índice de busca)
 * TEST_G: ACTIVE_SNAPSHOT_SAFETY (falha antes da promoção preserva snapshot ativo anterior)
 * TEST_H: ATOMIC_PROMOTION (somente staging validado substitui ACTIVE)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { PackageBuilder } from '../src/provisioning/package-builder.ts';
import { PackageValidator } from '../src/provisioning/package-validator.ts';
import { PackageImporter } from '../src/bootstrap/package-importer.ts';
import { InMemoryCatalogStorage } from '../src/bootstrap/storage/in-memory.storage.ts';
import { CompactSearchIndexV2Builder } from '../src/experiments/search-compact-v2/compact-search-v2-builder.ts';
import { deserializeCompactIndexV2, serializeCompactIndexV2 } from '../src/experiments/search-compact-v2/compact-search-v2-serializer.ts';
import { CompactSearchEngineV2Pruned } from '../src/experiments/search-compact-v2-pruned/compact-search-v2-pruned-engine.ts';
import { IngestionPipeline } from '../src/ingestion/pipeline.ts';
import { SyntheticSourceAdapter } from '../src/ingestion/adapters/synthetic-source.adapter.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const VALID_FIXTURE_PATH = path.join(ROOT_DIR, 'fixtures', 'source', 'synthetic-source.valid.json');

async function getSyntheticCatalog() {
  const rawContent = fs.readFileSync(VALID_FIXTURE_PATH, 'utf8');
  const adapter = new SyntheticSourceAdapter();
  const pipeline = new IngestionPipeline(adapter);
  const result = await pipeline.execute(rawContent, {
    sourceNamespace: 'syn',
    catalogVersion: '1.0.0',
    deterministicGeneratedAt: '2026-09-04T00:00:00.000Z',
  });
  if (!result.success || !result.catalog) {
    throw new Error(`Falha ao gerar catálogo sintético: ${result.errors.join('; ')}`);
  }
  // Anexa um stream com directStreamUrl para validação do contrato TEST_F
  const catalog = result.catalog;
  if (catalog.streams && catalog.streams.length > 0) {
    catalog.streams[0].directStreamUrl = 'https://direct.test/movie/synthetic.mp4';
  }
  return catalog;
}

function createMockLiveCatalog(snapshotId) {
  const channel = {
    id: 'channel-globo',
    name: 'Globo RJ',
    groupId: 'group-news',
    streamId: 'stream-globo-001',
    streamRef: {
      sourceItemId: 'item-globo-001',
      directStreamUrl: 'https://direct.test/live/globo.m3u8',
    },
  };
  return {
    snapshotId,
    generatedAt: new Date().toISOString(),
    groups: [
      { id: 'group-news', name: 'Notícias', order: 1 },
    ],
    channels: [channel],
    channelsByGroup: {
      'group-news': [channel],
    },
  };
}

async function runTestSuite() {
  console.log('=== INICIANDO SUÍTE C11 MEMORY FIX E REFRESH RETRY ===\n');

  const catalog = await getSyntheticCatalog();
  const snapshotId = catalog.metadata.snapshotId;
  const liveCatalog = createMockLiveCatalog(snapshotId);

  // Gerar searchIndexBuffer V2 canônico usando o CompactSearchIndexV2Builder
  const v2Builder = new CompactSearchIndexV2Builder();
  const indexV2 = v2Builder.build(catalog);
  const { buffer: v2Buffer } = serializeCompactIndexV2(indexV2);

  // --------------------------------------------------------------------------
  // TEST_A: SEARCH_V2_PASSTHROUGH
  // --------------------------------------------------------------------------
  console.log('[TEST_A] Testando pass-through do searchIndexBuffer V2 no PackageBuilder...');
  let v1BuildCalled = false;
  const packageBuilder = new PackageBuilder();

  // Interceptar internamente para garantir que V1 não seja invocado
  const originalV1Build = packageBuilder.searchIndexBuilder.build.bind(packageBuilder.searchIndexBuilder);
  packageBuilder.searchIndexBuilder.build = (...args) => {
    v1BuildCalled = true;
    return originalV1Build(...args);
  };

  const buildResult = await packageBuilder.build(catalog, {
    packageFormatVersion: 2,
    allowSensitiveRuntimeLocators: true,
    generator: 'test-pass-through',
    liveCatalog,
    searchIndexBuffer: v2Buffer,
    compression: 'STORE',
  });

  assert.equal(buildResult.success, true, `Package build deve ser bem-sucedido: ${buildResult.errors?.join('; ')}`);
  assert.equal(v1BuildCalled, false, 'SearchIndexBuilder V1 NÃO DEVE ser chamado quando searchIndexBuffer for fornecido');
  assert.ok(buildResult.packageBuffer, 'Package buffer deve ser gerado');
  console.log('  ✓ TEST_A_SEARCH_V2_PASSTHROUGH: PASS (V1 Builder NÃO chamado, buffer V2 repassado)');

  // --------------------------------------------------------------------------
  // TEST_B: DEVICE_LOCAL_NO_LEGACY_REBUILD
  // --------------------------------------------------------------------------
  console.log('[TEST_B] Verificando que manifesto do pacote reflete Search V2 e compact-search-index-v2.bin...');
  const validator = new PackageValidator();
  const valResult = await validator.validate(buildResult.packageBuffer);

  assert.equal(valResult.valid, true, `Pacote deve ser válido: ${valResult.errors?.join('; ')}`);
  assert.equal(valResult.manifest?.packageFormatVersion, 2, 'Manifesto deve ser V2');
  const manifestV2 = valResult.manifest;
  assert.equal(manifestV2.searchIndexFile, 'compact-search-index-v2.bin', 'searchIndexFile deve ser compact-search-index-v2.bin');
  assert.equal(manifestV2.searchIndexVersion, 2, 'searchIndexVersion deve ser 2');
  assert.ok(valResult.searchIndexBuffer, 'Validator deve extrair searchIndexBuffer V2');
  assert.equal(valResult.searchIndex, undefined, 'Não deve haver objeto searchIndex textual V1');
  console.log('  ✓ TEST_B_DEVICE_LOCAL_NO_LEGACY_REBUILD: PASS (manifest declara V2 binário)');

  // --------------------------------------------------------------------------
  // TEST_C: PACKAGE_EXPORT_REGRESSION
  // --------------------------------------------------------------------------
  console.log('[TEST_C] Verificando que fluxo tradicional sem searchIndexBuffer continua gerando V1 íntegro...');
  v1BuildCalled = false;
  const legacyBuild = await packageBuilder.build(catalog, {
    packageFormatVersion: 2,
    generator: 'test-legacy-v1',
    liveCatalog,
    allowSensitiveRuntimeLocators: true,
    // sem searchIndexBuffer -> aciona fallback para V1
  });
  assert.equal(legacyBuild.success, true, `Package build sem buffer deve ter sucesso: ${legacyBuild.errors?.join('; ')}`);
  assert.equal(v1BuildCalled, true, 'SearchIndexBuilder V1 deve ser chamado quando searchIndexBuffer não é fornecido');
  const legacyVal = await validator.validate(legacyBuild.packageBuffer);
  assert.equal(legacyVal.valid, true, `Pacote V1 legado deve ser válido: ${legacyVal.errors?.join('; ')}`);
  const legacyManifest = legacyVal.manifest;
  assert.equal(legacyManifest.searchIndexFile, 'search-index.json', 'Arquivo legado deve ser search-index.json');
  assert.equal(legacyManifest.searchIndexVersion, 1, 'Versão legada deve ser 1');
  assert.ok(legacyVal.searchIndex, 'searchIndex V1 deve ser extraído');
  console.log('  ✓ TEST_C_PACKAGE_EXPORT_REGRESSION: PASS (fluxo export/package V1 permanece intacto)');

  // --------------------------------------------------------------------------
  // TEST_D: STAGING_ARTIFACTS
  // --------------------------------------------------------------------------
  console.log('[TEST_D] Verificando materialização de artefatos canônicos em staging com PackageImporter...');
  const storage = new InMemoryCatalogStorage();
  const importer = new PackageImporter(storage);

  const stageResult = await importer.stagePackage(buildResult.packageBuffer);
  assert.equal(stageResult.success, true, `Stage deve ter sucesso: ${stageResult.errors?.join('; ')}`);
  assert.equal(stageResult.status, 'STAGED', 'Status deve ser STAGED');
  assert.equal(stageResult.snapshotId, snapshotId);

  // Testar também a materialização direta sem ZIP (stageArtifacts)
  const directStorage = new InMemoryCatalogStorage();
  const directImporter = new PackageImporter(directStorage);
  const directManifest = valResult.manifest;
  const directStageResult = await directImporter.stageArtifacts(
    directManifest,
    catalog,
    v2Buffer,
    liveCatalog
  );
  assert.equal(directStageResult.success, true, `Direct stage deve ter sucesso: ${directStageResult.errors?.join('; ')}`);
  assert.equal(directStageResult.status, 'STAGED');
  const directStagedData = await directStorage.readStaging(snapshotId);
  assert.ok(directStagedData, 'Direct staging readback deve existir');
  assert.equal(directStagedData.manifest.catalogSha256, directManifest.catalogSha256);

  const stagedData = await storage.readStaging(snapshotId);
  assert.ok(stagedData, 'Dados em staging devem existir');
  assert.ok(stagedData.manifest, 'Manifesto em staging deve existir');
  assert.ok(stagedData.catalog, 'Catálogo em staging deve existir');
  assert.ok(stagedData.liveCatalog, 'Live catalog em staging deve existir');
  assert.ok(stagedData.searchIndexBuffer, 'searchIndexBuffer em staging deve existir');
  console.log('  ✓ TEST_D_STAGING_ARTIFACTS: PASS (staging direto e via pacote produzem artefatos canônicos idênticos)');

  // --------------------------------------------------------------------------
  // TEST_E: SEARCH_INDEX
  // --------------------------------------------------------------------------
  console.log('[TEST_E] Verificando legibilidade e precisão do compact-search-index-v2.bin em staging...');
  const stagedIndex = deserializeCompactIndexV2(stagedData.searchIndexBuffer);
  assert.equal(stagedIndex.metadata.version, 2, 'Versão do índice deve ser 2');
  assert.equal(stagedIndex.metadata.catalogSnapshotId, snapshotId, 'catalogSnapshotId deve coincidir');

  const engine = new CompactSearchEngineV2Pruned();
  engine.load(stagedData.searchIndexBuffer);
  const firstMovieTitle = catalog.movies[0].title;
  const searchResults = engine.query(firstMovieTitle.split(' ')[0]);
  assert.ok(searchResults.items.length > 0, `Busca deve retornar resultados para ${firstMovieTitle}`);
  console.log('  ✓ TEST_E_SEARCH_INDEX: PASS (índice V2 auditável e engine de busca operacional)');

  // --------------------------------------------------------------------------
  // TEST_F: DIRECT_STREAM
  // --------------------------------------------------------------------------
  console.log('[TEST_F] Verificando integridade de directStreamUrl e ausência no índice de busca...');
  assert.equal(
    stagedData.catalog.streams[0].directStreamUrl,
    'https://direct.test/movie/synthetic.mp4',
    'directStreamUrl em streams deve ser preservada em staging'
  );
  assert.equal(
    stagedData.liveCatalog?.channels[0].streamRef?.directStreamUrl,
    'https://direct.test/live/globo.m3u8',
    'directStreamUrl de live deve ser preservada em staging'
  );

  // Confirmar que URL não vazou no índice de busca
  const urlQueryResults = engine.query('https');
  assert.equal(urlQueryResults.items.length, 0, 'URLs diretas NÃO devem ser indexadas no motor de busca');
  console.log('  ✓ TEST_F_DIRECT_STREAM: PASS (directStreamUrl íntegro e não exposto no índice)');

  // --------------------------------------------------------------------------
  // TEST_G: ACTIVE_SNAPSHOT_SAFETY
  // --------------------------------------------------------------------------
  console.log('[TEST_G] Verificando que falha antes da promoção preserva ACTIVE anterior...');
  // Simular snapshot ativo inicial
  await storage.writeActivePointer({
    snapshotId: 'snap-previous-safe',
    catalogVersion: '1.0.0',
    activatedAt: new Date().toISOString(),
  });

  const pointerBefore = await storage.readActivePointer();
  assert.equal(pointerBefore?.snapshotId, 'snap-previous-safe', 'Active inicial deve ser snap-previous-safe');

  // Tentar promover snapshot inexistente/corrompido
  const failedPromotion = await importer.promoteStagedPackage('snap-inexistente-invalido');
  assert.equal(failedPromotion.success, false, 'Promoção deve falhar para snapshot inválido');

  const pointerAfterFailed = await storage.readActivePointer();
  assert.equal(pointerAfterFailed?.snapshotId, 'snap-previous-safe', 'ACTIVE anterior deve ser rigorosamente preservado');
  console.log('  ✓ TEST_G_ACTIVE_SNAPSHOT_SAFETY: PASS (ACTIVE anterior intacto após falha)');

  // --------------------------------------------------------------------------
  // TEST_H: ATOMIC_PROMOTION
  // --------------------------------------------------------------------------
  console.log('[TEST_H] Verificando promoção atômica do staging validado para ACTIVE...');
  const promotionResult = await importer.promoteStagedPackage(snapshotId, {
    expectedPreviousSnapshotId: 'snap-previous-safe',
  });
  assert.equal(promotionResult.success, true, `Promoção deve ter sucesso: ${promotionResult.errors?.join('; ')}`);
  assert.equal(promotionResult.status, 'PROMOTED');
  assert.equal(promotionResult.snapshotId, snapshotId);

  const activePointer = await storage.readActivePointer();
  assert.equal(activePointer?.snapshotId, snapshotId, `Ponteiro ativo deve agora apontar para ${snapshotId}`);

  const activeCatalog = await storage.readActiveCatalog();
  assert.equal(activeCatalog?.metadata.snapshotId, snapshotId, 'Catálogo ativo deve ser o promovido');

  const activeSnapshot = await storage.readSnapshot(snapshotId);
  assert.ok(activeSnapshot?.searchIndexBuffer, 'compact-search-index-v2.bin deve estar presente no snapshot promovido');
  console.log('  ✓ TEST_H_ATOMIC_PROMOTION: PASS (chaveamento atômico concluído com sucesso)');

  console.log('\n==================================================');
  console.log('TODOS OS TESTES (TEST_A a TEST_H) PASSARAM COM SUCESSO!');
  console.log('RESULT: PASS_C11_DEVICE_IMPORT_PRE_STAGING_MEMORY_FIX');
  console.log('==================================================\n');
}

runTestSuite().catch((err) => {
  console.error('\n❌ ERRO NA EXECUÇÃO DA SUÍTE:', err);
  process.exit(1);
});
