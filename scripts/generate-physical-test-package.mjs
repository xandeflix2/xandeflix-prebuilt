/**
 * Xandeflix Prebuilt — Generate Physical Test Package Script (Gate G11A)
 *
 * Gera artefato sintético V2 assinado com chave de teste para validação física.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { IngestionPipeline } from '../src/ingestion/pipeline.ts';
import { SyntheticSourceAdapter } from '../src/ingestion/adapters/synthetic-source.adapter.ts';
import { PackageBuilder } from '../src/provisioning/package-builder.ts';
import { signArtifact } from '../src/security/artifact-signer.ts';
import { ArtifactVerifier } from '../src/security/artifact-verifier.ts';
import { TrustedPublicKeyStore } from '../src/security/trusted-public-key-store.ts';
import { DEBUG_TEST_PUBLIC_KEY, DEBUG_TEST_KEY_ID } from '../src/debug/debug-keys.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const TMP_DIR = path.join(ROOT_DIR, 'tmp');
const PRIV_KEY_PATH = path.join(TMP_DIR, 'test-private-key.pem');
const OUTPUT_PKG_PATH = path.join(TMP_DIR, 'test-package-v2.zip');
const OUTPUT_ENV_PATH = path.join(TMP_DIR, 'test-envelope.json');
const OUTPUT_TAMPERED_ENV_PATH = path.join(TMP_DIR, 'test-envelope-tampered.json');

async function main() {
  console.log('=== Gerando Pacote Sintético V2 para G11A ===');

  if (!fs.existsSync(PRIV_KEY_PATH)) {
    throw new Error('Chave privada temporária não encontrada em: ' + PRIV_KEY_PATH);
  }
  const privateKeyPem = fs.readFileSync(PRIV_KEY_PATH, 'utf8');

  // 1. Fonte sintética com dados suficientes para navegação física
  const syntheticSource = {
    sourceName: 'Synthetic Physical Test Provider',
    sourceVersion: '2026.1-g11a',
    movies: [
      {
        sourceItemId: '1001',
        title: 'Movie Synthetic Alpha',
        originalTitle: 'Synthetic Alpha: Origin',
        year: 2024,
        overview: 'Uma aventura sintética em um ambiente de testes controlado.',
        durationSeconds: 7200,
        categories: ['Ação Sintética', 'Ficção Científica Sintética'],
        genres: ['Ação', 'Ficção Científica'],
        artworks: [
          { kind: 'poster', url: 'https://art.synthetic.test/alpha-poster.jpg' },
          { kind: 'backdrop', url: 'https://art.synthetic.test/alpha-backdrop.jpg' }
        ],
        streams: [
          { sourceItemId: 'stream-m-1001', containerExtension: 'mp4', qualityLabel: '1080p' }
        ],
        tmdbId: '90001',
        imdbId: 'tt9000001'
      },
      {
        sourceItemId: '1002',
        title: 'Movie Synthetic Beta',
        originalTitle: 'Synthetic Beta: Revolution',
        year: 2023,
        overview: 'A continuação da jornada sintética com novos parâmetros de teste.',
        durationSeconds: 5400,
        categories: ['Ação Sintética', 'Drama Sintético'],
        genres: ['Ação', 'Drama'],
        artworks: [
          { kind: 'poster', url: 'https://art.synthetic.test/beta-poster.jpg' }
        ],
        streams: [
          { sourceItemId: 'stream-m-1002', containerExtension: 'mkv', qualityLabel: '720p' }
        ],
        tmdbId: 90002
      },
      {
        sourceItemId: '1003',
        title: 'Movie Synthetic Delta',
        originalTitle: 'Synthetic Delta: Comedy Club',
        year: 2024,
        overview: 'Comédia sintética com situações simuladas e risadas determinísticas.',
        durationSeconds: 5100,
        categories: ['Comédia Sintética'],
        genres: ['Comédia'],
        artworks: [
          { kind: 'poster', url: 'https://art.synthetic.test/delta-poster.jpg' }
        ],
        streams: [
          { sourceItemId: 'stream-m-1003', containerExtension: 'mp4', qualityLabel: '1080p' }
        ],
        tmdbId: 90003
      },
      {
        sourceItemId: '1004',
        title: 'Movie Synthetic Epsilon',
        originalTitle: 'Synthetic Epsilon: Lost Planet',
        year: 2022,
        overview: 'Expedição a um planeta distante em busca de novos algoritmos.',
        durationSeconds: 6800,
        categories: ['Ficção Científica Sintética', 'Aventura Sintética'],
        genres: ['Ficção Científica', 'Aventura'],
        artworks: [
          { kind: 'poster', url: 'https://art.synthetic.test/epsilon-poster.jpg' }
        ],
        streams: [
          { sourceItemId: 'stream-m-1004', containerExtension: 'mp4', qualityLabel: '4K' }
        ],
        tmdbId: 90004
      },
      {
        sourceItemId: '1005',
        title: 'Movie Synthetic Zeta',
        originalTitle: 'Synthetic Zeta: Shadow Night',
        year: 2021,
        overview: 'Mistério e sombras em uma noite sintética de suspense.',
        durationSeconds: 5900,
        categories: ['Mistério Sintético'],
        genres: ['Mistério', 'Suspense'],
        artworks: [
          { kind: 'poster', url: 'https://art.synthetic.test/zeta-poster.jpg' }
        ],
        streams: [
          { sourceItemId: 'stream-m-1005', containerExtension: 'mp4', qualityLabel: '1080p' }
        ],
        tmdbId: 90005
      },
      {
        sourceItemId: '1006',
        title: 'Movie Synthetic Eta',
        originalTitle: 'Synthetic Eta: Deep Ocean',
        year: 2024,
        overview: 'Exploração submarina nas profundezas sintéticas do oceano.',
        durationSeconds: 6300,
        categories: ['Aventura Sintética', 'Documentário Sintético'],
        genres: ['Aventura', 'Documentário'],
        artworks: [
          { kind: 'poster', url: 'https://art.synthetic.test/eta-poster.jpg' }
        ],
        streams: [
          { sourceItemId: 'stream-m-1006', containerExtension: 'mkv', qualityLabel: '1080p' }
        ],
        tmdbId: 90006
      }
    ],
    series: [
      {
        sourceItemId: '2001',
        title: 'Series Synthetic Gamma',
        originalTitle: 'Synthetic Chronicles',
        year: 2023,
        overview: 'Crônicas completas de entidades sintéticas em execução determinística.',
        categories: ['Ficção Científica Sintética', 'Mistério Sintético'],
        genres: ['Ficção Científica', 'Mistério'],
        artworks: [
          { kind: 'poster', url: 'https://art.synthetic.test/gamma-series-poster.jpg' },
          { kind: 'backdrop', url: 'https://art.synthetic.test/gamma-series-backdrop.jpg' }
        ],
        tmdbId: '90101',
        seasons: [
          {
            seasonNumber: 1,
            title: 'Temporada 1: O Despertar',
            artworks: [{ kind: 'poster', url: 'https://art.synthetic.test/gamma-s1-poster.jpg' }],
            episodes: [
              {
                episodeNumber: 1,
                title: 'Episódio 01: Inicialização',
                overview: 'O primeiro ciclo de testes do ambiente artificial.',
                durationSeconds: 2700,
                artworks: [{ kind: 'thumbnail', url: 'https://art.synthetic.test/gamma-s1e1-thumb.jpg' }],
                streams: [{ sourceItemId: 'stream-ep-2001-1-1', containerExtension: 'mp4', qualityLabel: '1080p' }]
              },
              {
                episodeNumber: 2,
                title: 'Episódio 02: Processamento',
                overview: 'Normalização de dados e consistência referencial.',
                durationSeconds: 2800,
                artworks: [{ kind: 'thumbnail', url: 'https://art.synthetic.test/gamma-s1e2-thumb.jpg' }],
                streams: [{ sourceItemId: 'stream-ep-2001-1-2', containerExtension: 'mp4', qualityLabel: '1080p' }]
              }
            ]
          },
          {
            seasonNumber: 2,
            title: 'Temporada 2: Convergência',
            episodes: [
              {
                episodeNumber: 1,
                title: 'Episódio 01: Replay Determinístico',
                overview: 'Validação de idêntica saída para entradas idênticas.',
                durationSeconds: 2900,
                streams: [{ sourceItemId: 'stream-ep-2001-2-1', containerExtension: 'mkv', qualityLabel: '1080p' }]
              },
              {
                episodeNumber: 2,
                title: 'Episódio 02: Fechamento de Gate',
                overview: 'Conclusão e emissão do relatório terminal.',
                durationSeconds: 3100,
                streams: [{ sourceItemId: 'stream-ep-2001-2-2', containerExtension: 'mp4', qualityLabel: '1080p' }]
              }
            ]
          }
        ]
      },
      {
        sourceItemId: '2002',
        title: 'Series Synthetic Kappa',
        originalTitle: 'Synthetic Code Quest',
        year: 2024,
        overview: 'Uma jornada investigativa através de código e arquitetura limpa.',
        categories: ['Documentário Sintético'],
        genres: ['Documentário'],
        artworks: [
          { kind: 'poster', url: 'https://art.synthetic.test/kappa-poster.jpg' }
        ],
        tmdbId: 90102,
        seasons: [
          {
            seasonNumber: 1,
            title: 'Temporada 1: Fundamentos',
            episodes: [
              {
                episodeNumber: 1,
                title: 'Episódio 01: Linhas de Código',
                overview: 'Início da jornada de desenvolvimento.',
                durationSeconds: 2400,
                streams: [{ sourceItemId: 'stream-ep-2002-1-1', containerExtension: 'mp4', qualityLabel: '1080p' }]
              },
              {
                episodeNumber: 2,
                title: 'Episódio 02: Contratos e Tipos',
                overview: 'Validação estrita de contratos.',
                durationSeconds: 2600,
                streams: [{ sourceItemId: 'stream-ep-2002-1-2', containerExtension: 'mp4', qualityLabel: '1080p' }]
              }
            ]
          }
        ]
      }
    ]
  };

  // 2. Executa pipeline de ingestão
  console.log('[1/4] Executando IngestionPipeline...');
  const adapter = new SyntheticSourceAdapter();
  const pipeline = new IngestionPipeline(adapter);
  const ingestionResult = await pipeline.execute(JSON.stringify(syntheticSource), {
    sourceNamespace: 'syn',
    catalogVersion: '1.0.0',
    deterministicGeneratedAt: '2026-09-05T00:00:00.000Z',
  });

  if (!ingestionResult.success || !ingestionResult.catalog) {
    throw new Error('Falha na ingestão: ' + ingestionResult.errors?.join('; '));
  }

  const catalog = ingestionResult.catalog;
  console.log(`  ✓ Catálogo pronto: snapshotId='${catalog.metadata.snapshotId}', movies=${catalog.movies.length}, series=${catalog.series.length}`);

  // 3. Constrói Full Package V2
  console.log('[2/4] Construindo Full Package V2 (com SearchIndex)...');
  const builder = new PackageBuilder();
  const buildResult = await builder.build(catalog, {
    packageFormatVersion: 2,
    outputPath: OUTPUT_PKG_PATH,
    deterministicCreatedAt: '2026-09-05T00:00:00.000Z',
    generator: 'xandeflix-prebuilt-test-builder/1.0',
  });

  if (!buildResult.success || !buildResult.packageBuffer) {
    throw new Error('Falha no empacotamento: ' + buildResult.errors.join('; '));
  }
  console.log(`  ✓ Pacote V2 gerado: ${buildResult.packageSizeBytes} bytes em ${OUTPUT_PKG_PATH}`);

  // 4. Assina o artefato
  console.log('[3/4] Assinando artefato com chave de teste...');
  const packageBytes = fs.readFileSync(OUTPUT_PKG_PATH);
  const signingResult = signArtifact({
    artifactBytes: packageBytes,
    artifactType: 'FULL_PACKAGE_V2',
    keyId: DEBUG_TEST_KEY_ID,
    privateKeyPem,
    snapshotId: catalog.metadata.snapshotId,
    issuedAt: new Date().toISOString(),
  });

  fs.writeFileSync(OUTPUT_ENV_PATH, JSON.stringify(signingResult.envelope, null, 2), 'utf8');
  console.log(`  ✓ Envelope salvo em ${OUTPUT_ENV_PATH}`);

  // 5. Gera envelope adulterado para teste negativo
  const tamperedEnvelope = {
    ...signingResult.envelope,
    signature: signingResult.envelope.signature.slice(0, -4) + 'AAAA',
  };
  fs.writeFileSync(OUTPUT_TAMPERED_ENV_PATH, JSON.stringify(tamperedEnvelope, null, 2), 'utf8');
  console.log(`  ✓ Envelope adulterado salvo em ${OUTPUT_TAMPERED_ENV_PATH}`);

  // 6. Verificação local com ArtifactVerifier
  console.log('[4/4] Verificando integridade local com ArtifactVerifier...');
  const store = new TrustedPublicKeyStore([DEBUG_TEST_PUBLIC_KEY]);
  const verifier = new ArtifactVerifier(store);

  const validVerification = await verifier.verify(packageBytes, signingResult.envelope);
  console.log('  Verificação válida:', validVerification.valid ? 'PASS' : 'FAIL');
  if (!validVerification.valid) {
    throw new Error('Falha na validação do envelope válido: ' + validVerification.errorMessage);
  }

  const tamperedVerification = await verifier.verify(packageBytes, tamperedEnvelope);
  console.log('  Verificação adulterada (esperado FAIL):', !tamperedVerification.valid ? 'PASS' : 'FAIL');
  if (tamperedVerification.valid) {
    throw new Error('Envelope adulterado foi aceito indevidamente!');
  }

  console.log('\n=== PACOTE E ENVELOPES GERADOS E TESTADOS COM SUCESSO ===');
}

main().catch(err => {
  console.error('ERRO FATAL:', err);
  process.exit(1);
});
