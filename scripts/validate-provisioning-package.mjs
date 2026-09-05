/**
 * Xandeflix Prebuilt — Validate Provisioning Package CLI
 *
 * Valida pacotes de provisionamento, executa testes de determinismo e a
 * suíte completa de testes negativos com verificação estrita de fail-closed.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';
import { IngestionPipeline } from '../src/ingestion/pipeline.ts';
import { SyntheticSourceAdapter } from '../src/ingestion/adapters/synthetic-source.adapter.ts';
import { PackageBuilder } from '../src/provisioning/package-builder.ts';
import { PackageValidator } from '../src/provisioning/package-validator.ts';
import { MANIFEST_FILENAME, CATALOG_FILENAME } from '../src/provisioning/types.ts';

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
  return result.catalog;
}

async function runDeterminismCheck(builder, catalog) {
  console.log('[REPLAY / DETERMINISMO] Executando 2 runs a partir do mesmo catálogo de entrada...');

  const run1 = await builder.build(catalog, {
    deterministicCreatedAt: '2026-09-04T00:00:00.000Z',
  });
  const run2 = await builder.build(catalog, {
    deterministicCreatedAt: '2026-09-04T00:00:00.000Z',
  });

  if (!run1.success || !run2.success) {
    throw new Error('Falha na geração dos pacotes para teste de determinismo');
  }

  const hash1 = run1.packageContentHash;
  const hash2 = run2.packageContentHash;
  const catSha1 = run1.catalogSha256;
  const catSha2 = run2.catalogSha256;
  const snap1 = run1.snapshotId;
  const snap2 = run2.snapshotId;

  const hashMatch = hash1 === hash2;
  const shaMatch = catSha1 === catSha2;
  const snapMatch = snap1 === snap2;

  const zip1 = run1.packageBuffer;
  const zip2 = run2.packageBuffer;
  const byteIdenticalZip = zip1 && zip2 ? zip1.equals(zip2) : false;

  console.log(`  PACKAGE_CONTENT_HASH_RUN_1: ${hash1}`);
  console.log(`  PACKAGE_CONTENT_HASH_RUN_2: ${hash2}`);
  console.log(`  PACKAGE_CONTENT_HASH_MATCH: ${hashMatch ? 'SIM' : 'NAO'}`);
  console.log(`  CATALOG_SHA256_RUN_1:       ${catSha1}`);
  console.log(`  CATALOG_SHA256_RUN_2:       ${catSha2}`);
  console.log(`  CATALOG_SHA256_MATCH:       ${shaMatch ? 'SIM' : 'NAO'}`);
  console.log(`  SNAPSHOT_ID_RUN_1:          ${snap1}`);
  console.log(`  SNAPSHOT_ID_RUN_2:          ${snap2}`);
  console.log(`  SNAPSHOT_ID_MATCH:          ${snapMatch ? 'SIM' : 'NAO'}`);
  console.log(`  LOGICAL_PACKAGE_DETERMINISTIC: ${hashMatch && shaMatch && snapMatch ? 'SIM' : 'NAO'}`);
  console.log(`  BYTE_IDENTICAL_ZIP:         ${byteIdenticalZip ? 'SIM' : 'NAO'}\n`);

  if (!hashMatch || !shaMatch || !snapMatch) {
    throw new Error('Divergência de hash lógico detectada no replay de determinismo!');
  }

  return {
    run1,
    run2,
    byteIdenticalZip,
  };
}

async function runNegativeTests(validZipBuffer, validator) {
  console.log('[TESTES NEGATIVOS] Executando suíte obrigatória de testes negativos (fail-closed)...');

  // @ts-expect-error JSZip default export interoperability
  const ZipClass = JSZip.default || JSZip;

  const negativeCases = [
    {
      id: 'TAMPERED_CATALOG',
      name: '1. catalog.json adulterado após geração (1 byte mutado)',
      mutate: async () => {
        const zip = await ZipClass.loadAsync(validZipBuffer);
        const catText = await zip.file(CATALOG_FILENAME).async('text');
        // Adulterar conteúdo (altera 1 byte no catálogo gerado)
        const tampered = catText.replace('Movie Synthetic Alpha', 'Tampered Synthetic Alpha');
        if (tampered === catText) {
          throw new Error('Falha interna no teste: substituição não alterou o texto');
        }
        zip.file(CATALOG_FILENAME, tampered);
        return zip.generateAsync({ type: 'nodebuffer' });
      },
      expectedErrorPattern: /HASH_MISMATCH/,
    },
    {
      id: 'HASH_MISMATCH',
      name: '2. manifest com catalogSha256 incorreto',
      mutate: async () => {
        const zip = await ZipClass.loadAsync(validZipBuffer);
        const manifest = JSON.parse(await zip.file(MANIFEST_FILENAME).async('text'));
        manifest.catalogSha256 = '0000000000000000000000000000000000000000000000000000000000000000';
        zip.file(MANIFEST_FILENAME, JSON.stringify(manifest, null, 2));
        return zip.generateAsync({ type: 'nodebuffer' });
      },
      expectedErrorPattern: /HASH_MISMATCH/,
    },
    {
      id: 'SIZE_MISMATCH',
      name: '3. manifest com catalogSizeBytes incorreto',
      mutate: async () => {
        const zip = await ZipClass.loadAsync(validZipBuffer);
        const manifest = JSON.parse(await zip.file(MANIFEST_FILENAME).async('text'));
        manifest.catalogSizeBytes = manifest.catalogSizeBytes + 999;
        zip.file(MANIFEST_FILENAME, JSON.stringify(manifest, null, 2));
        return zip.generateAsync({ type: 'nodebuffer' });
      },
      expectedErrorPattern: /SIZE_MISMATCH/,
    },
    {
      id: 'SCHEMA_VERSION_MISMATCH',
      name: '4. schemaVersion incompatível (manifest schemaVersion=2)',
      mutate: async () => {
        const zip = await ZipClass.loadAsync(validZipBuffer);
        const manifest = JSON.parse(await zip.file(MANIFEST_FILENAME).async('text'));
        manifest.schemaVersion = 2;
        zip.file(MANIFEST_FILENAME, JSON.stringify(manifest, null, 2));
        return zip.generateAsync({ type: 'nodebuffer' });
      },
      expectedErrorPattern: /SCHEMA_VERSION_MISMATCH/,
    },
    {
      id: 'PACKAGE_VERSION_MISMATCH',
      name: '5. packageFormatVersion incompatível (packageFormatVersion=99)',
      mutate: async () => {
        const zip = await ZipClass.loadAsync(validZipBuffer);
        const manifest = JSON.parse(await zip.file(MANIFEST_FILENAME).async('text'));
        manifest.packageFormatVersion = 99;
        zip.file(MANIFEST_FILENAME, JSON.stringify(manifest, null, 2));
        return zip.generateAsync({ type: 'nodebuffer' });
      },
      expectedErrorPattern: /PACKAGE_VERSION_MISMATCH/,
    },
    {
      id: 'SNAPSHOT_MISMATCH',
      name: '6. snapshotId divergente entre manifest e catalog.json',
      mutate: async () => {
        const zip = await ZipClass.loadAsync(validZipBuffer);
        const manifest = JSON.parse(await zip.file(MANIFEST_FILENAME).async('text'));
        manifest.snapshotId = 'divergent-snapshot-id-xyz';
        zip.file(MANIFEST_FILENAME, JSON.stringify(manifest, null, 2));
        return zip.generateAsync({ type: 'nodebuffer' });
      },
      expectedErrorPattern: /SNAPSHOT_MISMATCH/,
    },
    {
      id: 'CATALOG_VERSION_MISMATCH',
      name: '7. catalogVersion divergente entre manifest e catalog.json',
      mutate: async () => {
        const zip = await ZipClass.loadAsync(validZipBuffer);
        const manifest = JSON.parse(await zip.file(MANIFEST_FILENAME).async('text'));
        manifest.catalogVersion = '9.9.9';
        zip.file(MANIFEST_FILENAME, JSON.stringify(manifest, null, 2));
        return zip.generateAsync({ type: 'nodebuffer' });
      },
      expectedErrorPattern: /CATALOG_VERSION_MISMATCH/,
    },
    {
      id: 'EXTRA_FILE',
      name: '8. arquivo inesperado/extra no ZIP (payload não autorizado)',
      mutate: async () => {
        const zip = await ZipClass.loadAsync(validZipBuffer);
        zip.file('unauthorized_script.sh', 'echo exploit');
        return zip.generateAsync({ type: 'nodebuffer' });
      },
      expectedErrorPattern: /EXTRA_FILE_REJECTED/,
    },
    {
      id: 'MISSING_MANIFEST',
      name: '9. ausência de manifest.json',
      mutate: async () => {
        const zip = await ZipClass.loadAsync(validZipBuffer);
        zip.remove(MANIFEST_FILENAME);
        return zip.generateAsync({ type: 'nodebuffer' });
      },
      expectedErrorPattern: /MISSING_MANIFEST/,
    },
    {
      id: 'MISSING_CATALOG',
      name: '10. ausência de catalog.json',
      mutate: async () => {
        const zip = await ZipClass.loadAsync(validZipBuffer);
        zip.remove(CATALOG_FILENAME);
        return zip.generateAsync({ type: 'nodebuffer' });
      },
      expectedErrorPattern: /MISSING_CATALOG/,
    },
    {
      id: 'PATH_TRAVERSAL',
      name: '11. tentativa de path traversal (entrada com ../ ou caminho absoluto)',
      mutate: async () => {
        const zip = await ZipClass.loadAsync(validZipBuffer);
        zip.file('../escape.txt', 'danger');
        return zip.generateAsync({ type: 'nodebuffer' });
      },
      expectedErrorPattern: /PATH_TRAVERSAL_DETECTED/,
    },
  ];

  let rejectedCount = 0;
  for (const tc of negativeCases) {
    const mutatedBuffer = await tc.mutate();
    const result = await validator.validate(mutatedBuffer);

    if (result.valid) {
      console.error(`ERRO: Caso negativo '${tc.name}' foi aceito indevidamente!`);
      process.exit(1);
    }

    const matched = result.errors.some((err) => tc.expectedErrorPattern.test(err));
    if (!matched) {
      console.error(`ERRO: Caso negativo '${tc.name}' falhou mas não com o erro esperado:`);
      console.error(`  Esperado regex: ${tc.expectedErrorPattern}`);
      console.error(`  Erros obtidos:  ${result.errors.join(' | ')}`);
      process.exit(1);
    }

    console.log(`  ✓ Rejeitado com sucesso: ${tc.name}`);
    rejectedCount++;
  }

  console.log(`\nTodos os ${rejectedCount} testes negativos foram rejeitados corretamente.`);
}

async function main() {
  console.log('=== Xandeflix Prebuilt — Provisioning Package Validation & Test Suite ===\n');

  const catalog = await getSyntheticCatalog();
  const builder = new PackageBuilder();
  const validator = new PackageValidator();

  // 1. Happy Path: Construir pacote válido
  console.log('[HAPPY PATH] Gerando e validando pacote sintético íntegro...');
  const buildResult = await builder.build(catalog, {
    deterministicCreatedAt: '2026-09-04T00:00:00.000Z',
  });

  if (!buildResult.success || !buildResult.packageBuffer) {
    console.error('ERRO: Falha ao construir pacote sintético íntegro:', buildResult.errors);
    process.exit(1);
  }

  const validValidation = await validator.validate(buildResult.packageBuffer);
  if (!validValidation.valid) {
    console.error('ERRO: Pacote sintético íntegro falhou na validação:', validValidation.errors);
    process.exit(1);
  }
  console.log('  ✓ Pacote sintético íntegro validado com sucesso (PACKAGE_VALIDATION=PASS)\n');

  // 2. Determinismo e Replay
  const { byteIdenticalZip } = await runDeterminismCheck(builder, catalog);

  // 3. Suíte de Testes Negativos
  await runNegativeTests(buildResult.packageBuffer, validator);

  // 4. Métricas e Resumo Final
  console.log('\n=== Métricas de Provisionamento (G4) ===');
  console.log(`CATALOG_JSON_SIZE_BYTES:        ${buildResult.catalogSizeBytes}`);
  console.log(`PACKAGE_ZIP_SIZE_BYTES:         ${buildResult.packageSizeBytes}`);
  console.log(`COMPRESSION_RATIO:              ${buildResult.compressionRatio}`);
  console.log(`LOGICAL_PACKAGE_DETERMINISTIC:  SIM`);
  console.log(`BYTE_IDENTICAL_ZIP:             ${byteIdenticalZip ? 'SIM' : 'NAO'}`);
  console.log(`PACKAGE_BUILD:                  PASS`);
  console.log(`PACKAGE_VALIDATION:             PASS`);
  console.log(`NEGATIVE_PACKAGE_TESTS:         PASS`);
  console.log(`TAMPERED_CATALOG_REJECTED:      PASS`);
  console.log(`HASH_MISMATCH_REJECTED:         PASS`);
  console.log(`SIZE_MISMATCH_REJECTED:         PASS`);
  console.log(`SCHEMA_VERSION_MISMATCH_REJECTED: PASS`);
  console.log(`PACKAGE_VERSION_MISMATCH_REJECTED: PASS`);
  console.log(`SNAPSHOT_MISMATCH_REJECTED:     PASS`);
  console.log(`CATALOG_VERSION_MISMATCH_REJECTED: PASS`);
  console.log(`EXTRA_FILE_REJECTED:            PASS`);
  console.log(`MISSING_MANIFEST_REJECTED:      PASS`);
  console.log(`MISSING_CATALOG_REJECTED:       PASS`);
  console.log(`PATH_TRAVERSAL_REJECTED:        PASS`);
  console.log(`ZIP_PATH_TRAVERSAL_PROTECTION:  PASS`);
  console.log('\nRESULT: PASS_PREBUILT_G4_PROVISIONING_PACKAGE_CHECK\n');
}

main().catch((err) => {
  console.error('ERRO INESPERADO NA VALIDAÇÃO DO PACOTE:', err);
  process.exit(1);
});
