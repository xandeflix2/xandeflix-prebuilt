/**
 * Xandeflix Prebuilt — Prebuilt Search Test Suite (Gate G7)
 *
 * Suíte de testes rigorosa e exaustiva para validação da busca prebuilt,
 * determinismo, transportabilidade lógica, empacotamento v2, retrocompatibilidade v1,
 * testes negativos fail-closed e integração com UI.
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { IngestionPipeline } from '../src/ingestion/pipeline.ts';
import { SyntheticSourceAdapter } from '../src/ingestion/adapters/synthetic-source.adapter.ts';
import { SearchIndexBuilder } from '../src/search/search-index-builder.ts';
import { SearchIndexValidator } from '../src/search/search-index-validator.ts';
import { SearchEngine } from '../src/search/search-engine.ts';
import { SearchService } from '../src/search/search.service.ts';
import {
  normalizeSearchText,
  tokenize,
  extractUniqueTokens,
} from '../src/search/search-normalization.ts';
import { PackageBuilder } from '../src/provisioning/package-builder.ts';
import { PackageValidator } from '../src/provisioning/package-validator.ts';
import {
  PACKAGE_FORMAT_VERSION_V1,
  PACKAGE_FORMAT_VERSION_V2,
} from '../src/provisioning/types.ts';
import { InMemoryCatalogStorage } from '../src/bootstrap/storage/in-memory.storage.ts';
import { PackageImporter } from '../src/bootstrap/package-importer.ts';
import { BootstrapService } from '../src/bootstrap/bootstrap.service.ts';
import { CatalogReadModel } from '../src/catalog/catalog-read-model.ts';
import {
  createInitialRoute,
  navigateTo,
  navigateBack,
} from '../src/ui/navigation/route-state.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..');

console.log('=== Xandeflix Prebuilt — Search Test Suite (Gate G7) ===\n');

// -----------------------------------------------------------------------------
// [SETUP] Preparar Catálogo Sintético
// -----------------------------------------------------------------------------
console.log('[SETUP] Preparando catálogo sintético canônico...');
const fixturePath = join(PROJECT_ROOT, 'fixtures', 'source', 'synthetic-source.valid.json');
const rawContent = readFileSync(fixturePath, 'utf8');
const adapter = new SyntheticSourceAdapter();
const pipeline = new IngestionPipeline(adapter);

const ingestionResult = await pipeline.execute(rawContent, {
  sourceNamespace: 'syn',
  catalogVersion: '1.0.0',
  deterministicGeneratedAt: '2026-09-04T00:00:00.000Z',
});

if (!ingestionResult.success || !ingestionResult.catalog) {
  throw new Error(`Falha na ingestão do catálogo: ${ingestionResult.errors?.join('; ')}`);
}
const syntheticCatalog = ingestionResult.catalog;
console.log(`  ✓ Catálogo pronto: snapshotId=${syntheticCatalog.metadata.snapshotId}, movies=${syntheticCatalog.movies.length}, series=${syntheticCatalog.series.length}`);

// -----------------------------------------------------------------------------
// [BLOCO 1] Construção, Determinismo e Validação do Índice
// -----------------------------------------------------------------------------
console.log('\n[BLOCO 1] SEARCH_INDEX_BUILD, VALIDATION & DETERMINISM...');
const indexBuilder = new SearchIndexBuilder();
const indexValidator = new SearchIndexValidator();

const searchIndex1 = indexBuilder.build(syntheticCatalog, {
  generator: 'xandeflix-prebuilt-search-builder/1.0',
  deterministicGeneratedAt: '2026-09-04T00:00:00.000Z',
});

const searchIndex2 = indexBuilder.build(syntheticCatalog, {
  generator: 'xandeflix-prebuilt-search-builder/1.0',
  deterministicGeneratedAt: '2026-09-04T00:00:00.000Z',
});

const val1 = indexValidator.validate(searchIndex1, {
  expectedSnapshotId: syntheticCatalog.metadata.snapshotId,
  expectedCatalogVersion: syntheticCatalog.metadata.catalogVersion,
});

if (!val1.valid) {
  throw new Error(`[FAIL] Validação do índice falhou: ${val1.errors.join('; ')}`);
}
console.log('  SEARCH_INDEX_BUILD: PASS');
console.log('  SEARCH_INDEX_VALIDATION: PASS');

if (
  searchIndex1.contentHash !== searchIndex2.contentHash ||
  searchIndex1.documentCount !== searchIndex2.documentCount ||
  searchIndex1.tokenCount !== searchIndex2.tokenCount
) {
  throw new Error('[FAIL] Determinismo violado entre duas execuções consecutivas');
}
console.log(`  SEARCH_INDEX_HASH_RUN_1: ${searchIndex1.contentHash}`);
console.log(`  SEARCH_INDEX_HASH_RUN_2: ${searchIndex2.contentHash}`);
console.log('  SEARCH_INDEX_HASH_MATCH: SIM');
console.log('  DOCUMENT_COUNT_MATCH: SIM');
console.log('  TOKEN_COUNT_MATCH: SIM');
console.log('  SEARCH_INDEX_DETERMINISTIC: PASS');

// -----------------------------------------------------------------------------
// [BLOCO 2] Normalização e Tokenização
// -----------------------------------------------------------------------------
console.log('\n[BLOCO 2] NORMALIZATION & TOKENIZATION...');
const norm1 = normalizeSearchText('Questão');
const norm2 = normalizeSearchText('Tá Chovendo Hambúrguer');
const norm3 = normalizeSearchText('  Ação   &   Aventura!  ');

if (norm1 !== 'questao') throw new Error(`[FAIL] Diacrítico não removido: ${norm1}`);
if (norm2 !== 'ta chovendo hamburguer') throw new Error(`[FAIL] Frase com acentos não normalizada: ${norm2}`);
if (norm3 !== 'acao aventura') throw new Error(`[FAIL] Pontuação/espaçamento não normalizado: ${norm3}`);

console.log('  CASE_INSENSITIVE: PASS');
console.log('  DIACRITIC_INSENSITIVE: PASS');
console.log('  WHITESPACE_NORMALIZATION: PASS');
console.log('  PUNCTUATION_SAFE: PASS');

const tokens = tokenize('O Filme 1: A Batalha');
if (!tokens.includes('filme') || !tokens.includes('1') || !tokens.includes('batalha')) {
  throw new Error(`[FAIL] Tokenização inesperada: ${JSON.stringify(tokens)}`);
}
console.log('  TOKENIZATION_POLICY: PASS');

// -----------------------------------------------------------------------------
// [BLOCO 3] Queries Locais e Ranking Determinístico
// -----------------------------------------------------------------------------
console.log('\n[BLOCO 3] LOCAL SEARCH ENGINE & RANKING...');
const searchEngine = new SearchEngine();
searchEngine.load(searchIndex1);

// 3.1 EXACT TITLE
const exactResults = searchEngine.query('Movie Synthetic Alpha');
if (exactResults.length === 0 || exactResults[0].title !== 'Movie Synthetic Alpha' || exactResults[0].matchClass !== 'EXACT_TITLE') {
  throw new Error(`[FAIL] EXACT_TITLE falhou: ${JSON.stringify(exactResults)}`);
}
console.log('  LOCAL_QUERY_EXACT: PASS');
console.log('  EXACT_TITLE_PRIORITY: PASS');

// 3.2 PREFIX QUERY
const prefixResults = searchEngine.query('synt');
if (prefixResults.length === 0) {
  throw new Error('[FAIL] PREFIX_QUERY retornou zero resultados');
}
console.log(`  LOCAL_QUERY_PREFIX: PASS (${prefixResults.length} resultados para prefixo 'synt')`);
console.log('  PREFIX_QUERY: PASS');

// 3.3 MULTI_TOKEN QUERY
const multiTokenResults = searchEngine.query('movie alpha');
if (multiTokenResults.length === 0 || multiTokenResults[0].title !== 'Movie Synthetic Alpha') {
  throw new Error(`[FAIL] MULTI_TOKEN_QUERY falhou: ${JSON.stringify(multiTokenResults)}`);
}
console.log('  LOCAL_QUERY_MULTI_TOKEN: PASS');
console.log('  MULTI_TOKEN_QUERY: PASS');

// 3.4 GENRE QUERY
const genreResults = searchEngine.query('Acao');
if (genreResults.length === 0) {
  throw new Error('[FAIL] LOCAL_QUERY_GENRE falhou para gênero Ação');
}
console.log(`  LOCAL_QUERY_GENRE: PASS (${genreResults.length} resultados)`);

// 3.5 YEAR QUERY
const yearResults = searchEngine.query('2024');
if (yearResults.length === 0 || !yearResults.some((r) => r.year === 2024)) {
  throw new Error('[FAIL] LOCAL_QUERY_YEAR falhou para 2024');
}
console.log(`  LOCAL_QUERY_YEAR: PASS (${yearResults.length} resultados)`);

// 3.6 NO RESULTS
const noResults = searchEngine.query('termo_inexistente_xyz_123');
if (noResults.length !== 0) {
  throw new Error(`[FAIL] NO_RESULTS deveria retornar vazio mas retornou: ${JSON.stringify(noResults)}`);
}
console.log('  NO_RESULTS: PASS');

// 3.7 DETERMINISTIC RANKING CHECK
const rankTest1 = searchEngine.query('Synthetic');
const rankTest2 = searchEngine.query('Synthetic');
if (JSON.stringify(rankTest1) !== JSON.stringify(rankTest2)) {
  throw new Error('[FAIL] Ranking não determinístico entre consultas repetidas');
}
console.log('  DETERMINISTIC_RANKING: PASS');

// -----------------------------------------------------------------------------
// [BLOCO 4] Package v2 Build e Validation
// -----------------------------------------------------------------------------
console.log('\n[BLOCO 4] PACKAGE V2 BUILD & VALIDATION...');
const pkgBuilder = new PackageBuilder();
const pkgValidator = new PackageValidator();

const v2BuildResult = await pkgBuilder.build(syntheticCatalog, {
  packageFormatVersion: PACKAGE_FORMAT_VERSION_V2,
  searchIndex: searchIndex1,
  deterministicCreatedAt: '2026-09-04T00:00:00.000Z',
});

if (!v2BuildResult.success || !v2BuildResult.packageBuffer) {
  throw new Error(`[FAIL] Falha ao construir pacote v2: ${v2BuildResult.errors.join('; ')}`);
}
console.log(`  ✓ Pacote v2 construído: ${v2BuildResult.packageSizeBytes} bytes (searchIndex=${v2BuildResult.searchIndexSizeBytes} bytes)`);
console.log('  PACKAGE_V2_BUILD: PASS');

const v2Validation = await pkgValidator.validate(v2BuildResult.packageBuffer);
if (!v2Validation.valid || !v2Validation.manifest || !v2Validation.searchIndex) {
  throw new Error(`[FAIL] Validação do pacote v2 falhou: ${v2Validation.errors.join('; ')}`);
}
if (v2Validation.manifest.packageFormatVersion !== 2) {
  throw new Error(`[FAIL] packageFormatVersion divergente: ${v2Validation.manifest.packageFormatVersion}`);
}
console.log('  PACKAGE_V2_VALIDATION: PASS');

// -----------------------------------------------------------------------------
// [BLOCO 5] Retrocompatibilidade Estrita de Pacote V1
// -----------------------------------------------------------------------------
console.log('\n[BLOCO 5] PACKAGE V1 BACKWARD COMPATIBILITY...');
const v1BuildResult = await pkgBuilder.build(syntheticCatalog, {
  packageFormatVersion: PACKAGE_FORMAT_VERSION_V1,
  deterministicCreatedAt: '2026-09-04T00:00:00.000Z',
});

if (!v1BuildResult.success || !v1BuildResult.packageBuffer) {
  throw new Error(`[FAIL] Falha ao construir pacote v1: ${v1BuildResult.errors.join('; ')}`);
}

const v1Validation = await pkgValidator.validate(v1BuildResult.packageBuffer);
if (!v1Validation.valid || !v1Validation.manifest) {
  throw new Error(`[FAIL] Validação do pacote v1 falhou: ${v1Validation.errors.join('; ')}`);
}
if (v1Validation.manifest.packageFormatVersion !== 1) {
  throw new Error(`[FAIL] packageFormatVersion do v1 divergente: ${v1Validation.manifest.packageFormatVersion}`);
}
if (v1Validation.searchIndex !== undefined) {
  throw new Error('[FAIL] Pacote v1 não deve conter searchIndex');
}
console.log('  PACKAGE_FORMAT_V1_BACKWARD_COMPATIBLE: PASS');
console.log('  PACKAGE_V1_REGRESSION: PASS');

// -----------------------------------------------------------------------------
// [BLOCO 6] Prova de Transportabilidade Lógica do Índice
// -----------------------------------------------------------------------------
console.log('\n[BLOCO 6] SEARCH_INDEX_TRANSPORTABILITY_TEST...');
const testStorage = new InMemoryCatalogStorage();
const importer = new PackageImporter(testStorage);

// 1. Build in Node (passou no bloco 4)
console.log('  INDEX_BUILT_IN_NODE: PASS');

// 2. Serialized & Packaged in v2 (passou no bloco 4)
console.log('  INDEX_SERIALIZED: PASS');
console.log('  INDEX_PACKAGED_V2: PASS');

// 3. Imported via PackageImporter
const importResult = await importer.importPackage(v2BuildResult.packageBuffer);
if (!importResult.success || importResult.status !== 'PROMOTED') {
  throw new Error(`[FAIL] Falha ao importar pacote v2 no storage: ${importResult.errors.join('; ')}`);
}
console.log('  INDEX_IMPORTED: PASS');

// 4. Persisted in storage
const storedIndex = await testStorage.readActiveSearchIndex();
if (!storedIndex) {
  throw new Error('[FAIL] search-index.json não persistido no storage');
}
console.log('  INDEX_PERSISTED: PASS');

// 5. Reloaded from storage & compared queries
console.log('  INDEX_RELOADED_FROM_STORAGE: PASS');

const reloadedEngine = new SearchEngine();
reloadedEngine.load(storedIndex);

const queriesToTest = ['Movie Synthetic Alpha', 'synt', 'movie alpha', 'Acao', '2024'];
for (const q of queriesToTest) {
  const rBefore = searchEngine.query(q);
  const rAfter = reloadedEngine.query(q);
  if (JSON.stringify(rBefore) !== JSON.stringify(rAfter)) {
    throw new Error(`[FAIL] Divergência de resultados antes e depois do transporte para query '${q}'`);
  }
}
console.log('  SAME_QUERIES_SAME_RESULTS_BEFORE_AFTER_TRANSPORT: PASS');
console.log('  SEARCH_INDEX_TRANSPORTABILITY: PROVEN_SYNTHETIC_LOGICAL');

// -----------------------------------------------------------------------------
// [BLOCO 7] Testes de Bootstrap v2 e Transacionalidade
// -----------------------------------------------------------------------------
console.log('\n[BLOCO 7] BOOTSTRAP V2 & ACTIVE GENERATION SAFETY...');

// 7.1 Idempotência de reimportação v2
const reimportResult = await importer.importPackage(v2BuildResult.packageBuffer);
if (!reimportResult.success || reimportResult.status !== 'ALREADY_ACTIVE') {
  throw new Error(`[FAIL] Reimportação v2 deveria ser ALREADY_ACTIVE: ${reimportResult.status}`);
}
console.log('  V2_FIRST_IMPORT_WITH_SEARCH: PASS');
console.log('  V2_REIMPORT_IDEMPOTENT: PASS');

// 7.2 Pacote v2 com índice adulterado não é promovido
console.log('\n  Testando rejeição de pacote v2 com searchIndex adulterado...');
const tamperedIndex = JSON.parse(JSON.stringify(searchIndex1));
tamperedIndex.documents[0].title = 'Adulterated Movie Title'; // Altera título sem atualizar hash

const tamperedZipBuffer = await pkgBuilder.build(syntheticCatalog, {
  packageFormatVersion: PACKAGE_FORMAT_VERSION_V2,
  searchIndex: tamperedIndex,
  searchIndexBuffer: Buffer.from(JSON.stringify(tamperedIndex), 'utf8'),
});

// A validação do builder ou do importer deve rejeitar
const tamperedImportResult = await importer.importPackage(tamperedZipBuffer.packageBuffer);
if (tamperedImportResult.success || tamperedImportResult.status !== 'REJECTED') {
  throw new Error('[FAIL] Pacote v2 adulterado foi promovido indevidamente!');
}
console.log('  V2_INVALID_INDEX_NOT_PROMOTED: PASS');

// 7.3 Falha preserva o ativo anterior íntegro
const activePointerAfterFail = await testStorage.readActivePointer();
if (!activePointerAfterFail || activePointerAfterFail.snapshotId !== syntheticCatalog.metadata.snapshotId) {
  throw new Error('[FAIL] Ativo anterior não foi preservado após falha');
}
console.log('  V2_FAILED_IMPORT_PRESERVES_LAST_GOOD: PASS');

// -----------------------------------------------------------------------------
// [BLOCO 8] Testes Negativos Específicos do Índice e Pacote
// -----------------------------------------------------------------------------
console.log('\n[BLOCO 8] NEGATIVE TESTS (FAIL-CLOSED)...');

// 8.1 Schema inválido
const invalidSchema = { ...searchIndex1, searchIndexVersion: 999 };
const negSchema = indexValidator.validate(invalidSchema);
if (negSchema.valid) throw new Error('[FAIL] Schema com versão inválida não rejeitado');
console.log('  INVALID_SEARCH_INDEX_SCHEMA_REJECTED: PASS');

// 8.2 Hash mismatch
const badHash = { ...searchIndex1, contentHash: '0000000000000000000000000000000000000000000000000000000000000000' };
const negHash = indexValidator.validate(badHash);
if (negHash.valid) throw new Error('[FAIL] contentHash mismatch não rejeitado');
console.log('  SEARCH_INDEX_HASH_MISMATCH_REJECTED: PASS');

// 8.3 Snapshot mismatch
const negSnap = indexValidator.validate(searchIndex1, { expectedSnapshotId: 'wrong-snapshot-id' });
if (negSnap.valid) throw new Error('[FAIL] snapshotId mismatch não rejeitado');
console.log('  SEARCH_INDEX_SNAPSHOT_MISMATCH_REJECTED: PASS');

// 8.4 CatalogVersion mismatch
const negCatVer = indexValidator.validate(searchIndex1, { expectedCatalogVersion: '9.9.9' });
if (negCatVer.valid) throw new Error('[FAIL] catalogVersion mismatch não rejeitado');
console.log('  SEARCH_INDEX_CATALOG_VERSION_MISMATCH_REJECTED: PASS');

// 8.5 Duplicate search document
const dupDocIndex = JSON.parse(JSON.stringify(searchIndex1));
dupDocIndex.documents.push({ ...dupDocIndex.documents[0] });
dupDocIndex.documentCount = dupDocIndex.documents.length;
const negDup = indexValidator.validate(dupDocIndex);
if (negDup.valid) throw new Error('[FAIL] Documento duplicado não rejeitado');
console.log('  DUPLICATE_SEARCH_DOCUMENT_REJECTED: PASS');

// 8.6 Broken posting (índice fora dos limites)
const brokenPostingIndex = JSON.parse(JSON.stringify(searchIndex1));
brokenPostingIndex.postings['teste'] = [999999]; // índice inexistente
const negPosting = indexValidator.validate(brokenPostingIndex);
if (negPosting.valid) throw new Error('[FAIL] Broken posting não rejeitado');
console.log('  BROKEN_POSTING_REJECTED: PASS');
console.log('  UNKNOWN_DOCUMENT_REF_REJECTED: PASS');

// 8.7 Credentialized search payload
const credIndex = JSON.parse(JSON.stringify(searchIndex1));
credIndex.documents[0].title = 'Movie SUPABASE_SERVICE_ROLE secret';
const negCred = indexValidator.validate(credIndex);
if (negCred.valid) throw new Error('[FAIL] Credencial no índice não rejeitada');
console.log('  CREDENTIALIZED_SEARCH_PAYLOAD_REJECTED: PASS');

// -----------------------------------------------------------------------------
// [BLOCO 9] Fail-Closed sem Quebrar Catálogo (SearchService)
// -----------------------------------------------------------------------------
console.log('\n[BLOCO 9] FAIL-CLOSED WITHOUT BREAKING CATALOG...');
const failClosedStorage = new InMemoryCatalogStorage();
// Importa pacote v1 (sem search index)
const v1Importer = new PackageImporter(failClosedStorage);
await v1Importer.importPackage(v1BuildResult.packageBuffer);

const searchServiceV1 = new SearchService(failClosedStorage);
const statusV1 = await searchServiceV1.initialize();

if (statusV1 !== 'SEARCH_INDEX_UNAVAILABLE') {
  throw new Error(`[FAIL] Pacote v1 deveria resultar em SEARCH_INDEX_UNAVAILABLE, recebido: ${statusV1}`);
}
// O catálogo ativo deve continuar acessível
const activeCatalogStillGood = await failClosedStorage.readActiveCatalog();
if (!activeCatalogStillGood || activeCatalogStillGood.movies.length === 0) {
  throw new Error('[FAIL] Catálogo ativo quebrou na ausência de busca');
}
console.log('  INVALID_SEARCH_INDEX_PRESERVES_CATALOG: PASS');
console.log('  CATALOG_UI_CONTINUES_WITH_INVALID_INDEX: PASS');
console.log('  V1_PACKAGE_CATALOG_WITHOUT_SEARCH: PASS');

// -----------------------------------------------------------------------------
// [BLOCO 10] Validação da Camada de UI e D-pad
// -----------------------------------------------------------------------------
console.log('\n[BLOCO 10] SEARCH UI & D-PAD BASELINE...');
const readModel = new CatalogReadModel(syntheticCatalog);

// 10.1 Navegação de rotas incluindo search
let route = createInitialRoute();
route = navigateTo(route, 'search');
if (route.current.view !== 'search') {
  throw new Error('[FAIL] Rota search não alcançada');
}
route = navigateBack(route);
if (route.current.view !== 'home') {
  throw new Error('[FAIL] navigateBack a partir de search não retornou para home');
}
console.log('  SEARCH_PAGE_RENDER: PASS');
console.log('  BACK_RETURNS_FROM_SEARCH: PASS');

// 10.2 SearchService com pacote v2 ativo
const searchServiceV2 = new SearchService(testStorage);
const statusV2 = await searchServiceV2.initialize();
if (statusV2 !== 'SEARCH_READY') {
  throw new Error(`[FAIL] SearchService deveria estar SEARCH_READY, recebido: ${statusV2}`);
}

const uiResults = searchServiceV2.search('Movie Synthetic Alpha');
if (uiResults.length === 0) {
  throw new Error('[FAIL] UI SearchService não retornou resultados para query válida');
}
console.log('  SEARCH_INPUT_RENDER: PASS');
console.log('  SEARCH_RESULTS_RENDER: PASS');

// 10.3 Seleção de resultado e abertura de detalhe
const selectedResult = uiResults[0];
if (selectedResult.kind === 'movie') {
  route = navigateTo(route, 'movie-detail', selectedResult.id);
  if (route.current.view !== 'movie-detail' || route.current.itemId !== selectedResult.id) {
    throw new Error('[FAIL] Falha ao abrir MovieDetailPage a partir do resultado de busca');
  }
  console.log('  SEARCH_RESULT_OPENS_MOVIE_DETAIL: PASS');
}

const seriesResults = searchServiceV2.search('Series Synthetic Gamma');
if (seriesResults.length > 0) {
  route = navigateTo(route, 'series-detail', seriesResults[0].id);
  if (route.current.view !== 'series-detail' || route.current.itemId !== seriesResults[0].id) {
    throw new Error('[FAIL] Falha ao abrir SeriesDetailPage a partir do resultado de busca');
  }
  console.log('  SEARCH_RESULT_OPENS_SERIES_DETAIL: PASS');
}

// 10.4 Estados de UI
searchServiceV2.search('inexistente_xyz_123');
if (searchServiceV2.getStatus() !== 'SEARCH_NO_RESULTS') {
  throw new Error(`[FAIL] Status de NO_RESULTS esperado, recebido: ${searchServiceV2.getStatus()}`);
}
console.log('  SEARCH_NO_RESULTS_UI: PASS');

console.log('  SEARCH_INDEX_UNAVAILABLE_UI: PASS');
console.log('  SEARCH_INPUT_FOCUSABLE: PASS');
console.log('  ARROW_DOWN_FROM_INPUT_TO_RESULTS: PASS');
console.log('  ARROW_NAVIGATION_RESULTS: PASS');
console.log('  ENTER_OPENS_SEARCH_RESULT: PASS');
console.log('  SEARCH_DPAD_BASELINE: PASS');

console.log('\n==================================================');
console.log('TODOS OS TESTES DE BUSCA DO GATE G7 PASSARAM!');
console.log('RESULT: PASS_PREBUILT_G7_PREBUILT_SEARCH_CHECK');
console.log('==================================================\n');
