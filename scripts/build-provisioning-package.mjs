/**
 * Xandeflix Prebuilt — Build Provisioning Package CLI
 *
 * Gera o pacote de provisionamento ZIP a partir de catálogo sintético canônico.
 * Saída temporária em: tmp/provisioning/
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { IngestionPipeline } from '../src/ingestion/pipeline.ts';
import { SyntheticSourceAdapter } from '../src/ingestion/adapters/synthetic-source.adapter.ts';
import { PackageBuilder } from '../src/provisioning/package-builder.ts';
import { PackageValidator } from '../src/provisioning/package-validator.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const VALID_FIXTURE_PATH = path.join(ROOT_DIR, 'fixtures', 'source', 'synthetic-source.valid.json');
const OUTPUT_ZIP_PATH = path.join(ROOT_DIR, 'tmp', 'provisioning', 'xandeflix-prebuilt-catalog.zip');

async function main() {
  console.log('=== Xandeflix Prebuilt — Provisioning Package Builder ===\n');

  // 1. Obter catálogo sintético canônico
  if (!fs.existsSync(VALID_FIXTURE_PATH)) {
    console.error(`ERRO: Fixture válida não encontrada: ${VALID_FIXTURE_PATH}`);
    process.exit(1);
  }

  const rawSourceContent = fs.readFileSync(VALID_FIXTURE_PATH, 'utf8');
  const adapter = new SyntheticSourceAdapter();
  const pipeline = new IngestionPipeline(adapter);

  console.log('[1/4] Executando pipeline sintético para obtenção de PrebuiltCatalog v1...');
  const ingestionResult = await pipeline.execute(rawSourceContent, {
    sourceNamespace: 'syn',
    catalogVersion: '1.0.0',
    deterministicGeneratedAt: '2026-09-04T00:00:00.000Z',
  });

  if (!ingestionResult.success || !ingestionResult.catalog) {
    console.error('ERRO: Falha ao gerar catálogo sintético:', ingestionResult.errors);
    process.exit(1);
  }

  const catalog = ingestionResult.catalog;
  console.log(`  ✓ Catálogo sintético gerado com sucesso (snapshotId: ${catalog.metadata.snapshotId})`);

  // 2. Construir pacote de provisionamento
  console.log('\n[2/4] Empacotando artefato de provisionamento ZIP...');
  const builder = new PackageBuilder();
  const buildResult = await builder.build(catalog, {
    outputPath: OUTPUT_ZIP_PATH,
    deterministicCreatedAt: '2026-09-04T00:00:00.000Z',
  });

  if (!buildResult.success || !buildResult.packageBuffer) {
    console.error('ERRO: Falha na construção do pacote de provisionamento:', buildResult.errors);
    process.exit(1);
  }

  console.log(`  ✓ Pacote ZIP gerado com sucesso em: ${OUTPUT_ZIP_PATH}`);

  // 3. Validação imediata do pacote construído
  console.log('\n[3/4] Validando pacote recém-construído via PackageValidator...');
  const validator = new PackageValidator();
  const validationResult = await validator.validate(OUTPUT_ZIP_PATH);

  if (!validationResult.valid) {
    console.error('ERRO: Pacote recém-construído falhou na validação:', validationResult.errors);
    process.exit(1);
  }

  console.log('  ✓ Pacote validado com sucesso (FAIL_CLOSED verificado)');

  // 4. Exibir resumo sanitizado
  console.log('\n=== Resumo do Pacote de Provisionamento ===');
  console.log(`PACKAGE_PATH:              ${OUTPUT_ZIP_PATH}`);
  console.log(`PACKAGE_FORMAT_VERSION:    ${buildResult.manifest?.packageFormatVersion}`);
  console.log(`SCHEMA_VERSION:            ${buildResult.manifest?.schemaVersion}`);
  console.log(`SNAPSHOT_ID:               ${buildResult.snapshotId}`);
  console.log(`CATALOG_VERSION:           ${buildResult.catalogVersion}`);
  console.log(`CATALOG_SHA256:            ${buildResult.catalogSha256}`);
  console.log(`PACKAGE_CONTENT_HASH:      ${buildResult.packageContentHash}`);
  console.log(`CATALOG_JSON_SIZE_BYTES:   ${buildResult.catalogSizeBytes}`);
  console.log(`PACKAGE_ZIP_SIZE_BYTES:    ${buildResult.packageSizeBytes}`);
  console.log(`COMPRESSION_RATIO:         ${buildResult.compressionRatio}`);
  console.log(`BUILD_DURATION_MS:         ${buildResult.durationMs}ms`);
  console.log('PACKAGE_BUILD:             PASS\n');
}

main().catch((err) => {
  console.error('ERRO INESPERADO NO SCRIPT DE BUILD:', err);
  process.exit(1);
});
