/**
 * Xandeflix Prebuilt — External Search Index Builder Script (Gate G7)
 *
 * Gera o índice de busca invertido canônico fora do dispositivo,
 * valida determinismo e grava temporariamente em tmp/search/search-index.json.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { IngestionPipeline } from '../src/ingestion/pipeline.ts';
import { SyntheticSourceAdapter } from '../src/ingestion/adapters/synthetic-source.adapter.ts';
import { SearchIndexBuilder } from '../src/search/search-index-builder.ts';
import { SearchIndexValidator } from '../src/search/search-index-validator.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..');

console.log('=== Xandeflix Prebuilt — External Search Index Builder ===\n');

// 1. Ingestão de Catálogo Sintético Canônico
console.log('[1/4] Ingerindo catálogo sintético canônico de entrada...');
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
  throw new Error(`Falha na ingestão do catálogo de entrada: ${ingestionResult.errors?.join('; ')}`);
}

const catalog = ingestionResult.catalog;
console.log(`  ✓ Catálogo pronto: snapshotId='${catalog.metadata.snapshotId}', movies=${catalog.movies.length}, series=${catalog.series.length}`);

// 2. Construção Externa do Índice de Busca
console.log('[2/4] Construindo índice de busca invertido (SearchIndexBuilder)...');
const builder = new SearchIndexBuilder();
const run1 = builder.build(catalog, {
  generator: 'xandeflix-prebuilt-search-builder/1.0',
  deterministicGeneratedAt: '2026-09-04T00:00:00.000Z',
});

console.log(`  ✓ Índice gerado: ${run1.documentCount} documentos, ${run1.tokenCount} tokens únicos`);
console.log(`  ✓ contentHash: ${run1.contentHash}`);

// 3. Prova de Determinismo Estrito (Run 1 vs Run 2)
console.log('[3/4] Validando determinismo estrito (Run 1 vs Run 2)...');
const run2 = builder.build(catalog, {
  generator: 'xandeflix-prebuilt-search-builder/1.0',
  deterministicGeneratedAt: '2026-09-04T00:00:00.000Z',
});

const hashMatch = run1.contentHash === run2.contentHash;
const docMatch = run1.documentCount === run2.documentCount;
const tokenMatch = run1.tokenCount === run2.tokenCount;

if (!hashMatch || !docMatch || !tokenMatch) {
  throw new Error(
    `[DETERMINISM_VIOLATION] Discrepância na prova de determinismo!\n` +
    `  Run 1: hash=${run1.contentHash}, docs=${run1.documentCount}, tokens=${run1.tokenCount}\n` +
    `  Run 2: hash=${run2.contentHash}, docs=${run2.documentCount}, tokens=${run2.tokenCount}`
  );
}
console.log('  SEARCH_INDEX_HASH_MATCH: SIM');
console.log('  DOCUMENT_COUNT_MATCH: SIM');
console.log('  TOKEN_COUNT_MATCH: SIM');
console.log('  SEARCH_INDEX_DETERMINISTIC: SIM');

// 4. Validação Fail-Closed do Índice Gerado
console.log('[4/4] Validando integridade estrutural do índice gerado...');
const validator = new SearchIndexValidator();
const validation = validator.validate(run1, {
  expectedSnapshotId: catalog.metadata.snapshotId,
  expectedCatalogVersion: catalog.metadata.catalogVersion,
});

if (!validation.valid) {
  throw new Error(`[VALIDATION_FAILED] Erros no índice gerado: ${validation.errors.join('; ')}`);
}
console.log('  SEARCH_INDEX_VALIDATION: PASS');

// 5. Gravação Temporária (não versionada)
const outDir = join(PROJECT_ROOT, 'tmp', 'search');
if (!existsSync(outDir)) {
  mkdirSync(outDir, { recursive: true });
}
const outPath = join(outDir, 'search-index.json');
writeFileSync(outPath, JSON.stringify(run1, null, 2), 'utf8');
console.log(`  ✓ Índice temporário persistido com sucesso em: ${outPath}\n`);

console.log('=== SEARCH_INDEX_BUILD: PASS ===');
