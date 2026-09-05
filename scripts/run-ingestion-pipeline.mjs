/**
 * Xandeflix Prebuilt — Ingestion Pipeline CLI Runner
 *
 * Executa o pipeline de ingestão externa contra fixtures sintéticas:
 * - Modo Synthetic (padrão): processa fonte válida, valida saída e comprova determinismo via replay.
 * - Modo Negative (--negative): submete fixtures e mutações anômalas comprovando rejeição fail-closed.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { IngestionPipeline } from '../src/ingestion/pipeline.ts';
import { SyntheticSourceAdapter } from '../src/ingestion/adapters/synthetic-source.adapter.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const VALID_FIXTURE_PATH = path.join(ROOT_DIR, 'fixtures', 'source', 'synthetic-source.valid.json');
const INVALID_FIXTURE_PATH = path.join(ROOT_DIR, 'fixtures', 'source', 'synthetic-source.invalid.json');
const OUTPUT_PATH = path.join(ROOT_DIR, 'tmp', 'ingestion-output', 'synthetic-catalog.json');

async function runSynthetic() {
  console.log('=== Xandeflix Prebuilt — Ingestion Pipeline (Synthetic Runner) ===\n');

  if (!fs.existsSync(VALID_FIXTURE_PATH)) {
    console.error(`ERRO: Fixture válida não encontrada em: ${VALID_FIXTURE_PATH}`);
    process.exit(1);
  }

  const rawContent = fs.readFileSync(VALID_FIXTURE_PATH, 'utf8');
  const adapter = new SyntheticSourceAdapter();
  const pipeline = new IngestionPipeline(adapter);

  // Execução 1
  console.log('[EXECUÇÃO 1] Executando pipeline contra synthetic-source.valid.json...');
  const optionsRun1 = {
    sourceNamespace: 'syn',
    catalogVersion: '1.0.0',
    deterministicGeneratedAt: '2026-09-04T00:00:00.000Z',
    outputPath: OUTPUT_PATH,
  };

  const result1 = await pipeline.execute(rawContent, optionsRun1);

  if (!result1.success || !result1.catalog) {
    console.error('FALHA na Execução 1 do pipeline:');
    for (const err of result1.errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }

  console.log('PASS: Execução 1 concluída com sucesso!');
  console.log(`Snapshot ID (Run 1): ${result1.catalog.metadata.snapshotId}`);
  console.log(`Catálogo temporário gravado em: ${OUTPUT_PATH}\n`);

  // Execução 2 (Replay determinístico)
  console.log('[EXECUÇÃO 2] Executando replay idêntico para verificação de determinismo...');
  const optionsRun2 = {
    sourceNamespace: 'syn',
    catalogVersion: '1.0.0',
    deterministicGeneratedAt: '2026-09-04T00:00:00.000Z',
  };

  const result2 = await pipeline.execute(rawContent, optionsRun2);

  if (!result2.success || !result2.catalog) {
    console.error('FALHA no Replay (Execução 2) do pipeline:');
    for (const err of result2.errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }

  console.log('PASS: Execução 2 (Replay) concluída com sucesso!');
  console.log(`Snapshot ID (Run 2): ${result2.catalog.metadata.snapshotId}\n`);

  // Validação de determinismo estrito
  console.log('[VERIFICAÇÃO DE DETERMINISMO]');
  const snap1 = result1.catalog.metadata.snapshotId;
  const snap2 = result2.catalog.metadata.snapshotId;

  if (snap1 !== snap2) {
    console.error(`ERRO: Divergência de Snapshot ID entre execuções: Run1=${snap1}, Run2=${snap2}`);
    process.exit(1);
  }
  console.log('  ✓ Snapshot ID idêntico entre execuções');

  const json1 = JSON.stringify(result1.catalog);
  const json2 = JSON.stringify(result2.catalog);

  if (json1 !== json2) {
    console.error('ERRO: Conteúdo serializado diverge entre execuções!');
    process.exit(1);
  }
  console.log('  ✓ Conteúdo serializado 100% idêntico byte a byte');

  // Resumo sanitizado de métricas
  const m = result1.metrics;
  console.log('\n=== Resumo de Métricas Sanitizadas do Pipeline ===');
  console.log(`SOURCE_ITEMS_TOTAL:       ${m.sourceItemsTotal}`);
  console.log(`MOVIES_NORMALIZED:        ${m.moviesNormalized}`);
  console.log(`SERIES_NORMALIZED:        ${m.seriesNormalized}`);
  console.log(`SEASONS_NORMALIZED:       ${m.seasonsNormalized}`);
  console.log(`EPISODES_NORMALIZED:      ${m.episodesNormalized}`);
  console.log(`CATEGORIES_NORMALIZED:    ${m.categoriesNormalized}`);
  console.log(`GENRES_NORMALIZED:        ${m.genresNormalized}`);
  console.log(`STREAMS_NORMALIZED:       ${m.streamsNormalized}`);
  console.log(`ARTWORKS_NORMALIZED:      ${m.artworksNormalized}`);
  console.log(`PIPELINE_DURATION_MS:     ${m.pipelineDurationMs}ms`);
  console.log('PIPELINE_DETERMINISTIC:   SIM');
  console.log('RESULT:                   PASS_PREBUILT_G3_INGESTION_SYNTHETIC\n');
}

async function runNegative() {
  console.log('=== Xandeflix Prebuilt — Ingestion Pipeline (Negative Tests Runner) ===\n');

  const adapter = new SyntheticSourceAdapter();
  const pipeline = new IngestionPipeline(adapter);

  const baseValidRaw = JSON.parse(fs.readFileSync(VALID_FIXTURE_PATH, 'utf8'));

  const negativeCases = [
    {
      name: 'Fixture inválida em arquivo (missing sourceItemId, unparseable year, duplicate id)',
      input: fs.readFileSync(INVALID_FIXTURE_PATH, 'utf8'),
      expectedPattern: /RAW_VALIDATION_ERROR/,
    },
    {
      name: 'Payload JSON malformado',
      input: '{ "sourceName": "Corrupted", "movies": [ incomplete json',
      expectedPattern: /ADAPTER_LOAD_ERROR/,
    },
    {
      name: 'Item sem sourceItemId obrigatório',
      input: (() => {
        const c = JSON.parse(JSON.stringify(baseValidRaw));
        delete c.movies[0].sourceItemId;
        return c;
      })(),
      expectedPattern: /sourceItemId.*obrigatório/,
    },
    {
      name: 'Item com sourceItemId duplicado',
      input: (() => {
        const c = JSON.parse(JSON.stringify(baseValidRaw));
        c.movies[1].sourceItemId = c.movies[0].sourceItemId;
        return c;
      })(),
      expectedPattern: /duplicado/,
    },
    {
      name: 'Ano não numérico não recuperável',
      input: (() => {
        const c = JSON.parse(JSON.stringify(baseValidRaw));
        c.movies[0].year = 'ano-invalido-xyz';
        return c;
      })(),
      expectedPattern: /year.*inválido/,
    },
    {
      name: 'Artwork com credenciais embutidas (username:password@)',
      input: (() => {
        const c = JSON.parse(JSON.stringify(baseValidRaw));
        c.movies[0].artworks = [
          { kind: 'poster', url: 'https://admin:senha123@art.synthetic.test/leak.jpg' },
        ];
        return c;
      })(),
      expectedPattern: /Credencial embutida proibida/,
    },
    {
      name: 'Temporada com seasonNumber duplicado na série',
      input: (() => {
        const c = JSON.parse(JSON.stringify(baseValidRaw));
        c.series[0].seasons[1].seasonNumber = c.series[0].seasons[0].seasonNumber;
        return c;
      })(),
      expectedPattern: /seasonNumber.*duplicado/,
    },
    {
      name: 'Episódio com episodeNumber duplicado na temporada',
      input: (() => {
        const c = JSON.parse(JSON.stringify(baseValidRaw));
        c.series[0].seasons[0].episodes[1].episodeNumber = c.series[0].seasons[0].episodes[0].episodeNumber;
        return c;
      })(),
      expectedPattern: /episodeNumber.*duplicado/,
    },
  ];

  let passed = 0;
  for (const tc of negativeCases) {
    const result = await pipeline.execute(tc.input);
    if (result.success) {
      console.error(`FALHA: Caso negativo '${tc.name}' foi aceito indevidamente (esperado falha)!`);
      process.exit(1);
    }

    const matched = result.errors.some((e) => tc.expectedPattern.test(e));
    if (!matched) {
      console.error(`FALHA: Erro gerado para '${tc.name}' não corresponde ao padrão esperado:`);
      console.error(`  Esperado regex: ${tc.expectedPattern}`);
      console.error(`  Erros obtidos:  ${result.errors.join(' | ')}`);
      process.exit(1);
    }

    console.log(`  ✓ Rejeitado corretamente (fail-closed): ${tc.name}`);
    passed++;
  }

  console.log(`\nTodos os ${passed} testes negativos foram rejeitados corretamente.`);
  console.log('RESULT: PASS_PREBUILT_G3_INGESTION_NEGATIVE (PASS_NO_FALSE_SUCCESS)\n');
}

const isNegative = process.argv.includes('--negative');
if (isNegative) {
  await runNegative();
} else {
  await runSynthetic();
}
