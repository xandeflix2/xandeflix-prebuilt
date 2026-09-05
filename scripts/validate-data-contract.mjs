/**
 * Xandeflix Prebuilt — Validador do Contrato de Dados (v1)
 *
 * Valida o catalogo prebuilt em relacao ao JSON Schema e regras de integridade de negocio:
 * 1. Validacao estrutural estrita via Ajv (JSON Schema 2020-12);
 * 2. Unicidade de IDs em todas as colecoes (DUPLICATE_ID_POLICY=REJECT);
 * 3. Integridade referencial completa entre entidades;
 * 4. Consistencia estrita entre contagens declaradas e tamanhos reais de arrays;
 * 5. Ausencia de credenciais embutidas em URIs;
 * 6. Suite de testes negativos em memoria provando rejeicao de anomalias.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const schemaPath = path.join(ROOT_DIR, 'schemas', 'prebuilt-catalog.schema.json');
const fixturePath = path.join(ROOT_DIR, 'fixtures', 'prebuilt-catalog.synthetic.json');

const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validateSchema = ajv.compile(schema);

/**
 * Executa validacao estrutural e semantica completa sobre um objeto de catalogo
 * @param {object} catalog
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateCatalog(catalog) {
  const errors = [];

  // 1. Validacao estrutural com JSON Schema
  const isSchemaValid = validateSchema(catalog);
  if (!isSchemaValid) {
    for (const err of validateSchema.errors || []) {
      errors.push(`JSON Schema: ${err.instancePath || '/'} ${err.message}`);
    }
    return { valid: false, errors };
  }

  // 2. Validacao de contagens declaradas (Counts Check)
  const counts = catalog.metadata?.counts;
  if (!counts) {
    errors.push('Metadata counts inexistente.');
    return { valid: false, errors };
  }

  const collections = [
    'movies',
    'series',
    'seasons',
    'episodes',
    'categories',
    'genres',
    'streams',
    'artworks',
  ];

  for (const coll of collections) {
    const actual = Array.isArray(catalog[coll]) ? catalog[coll].length : -1;
    const declared = counts[coll];
    if (actual !== declared) {
      errors.push(
        `Contagem divergente para '${coll}': declarada=${declared}, real=${actual}`
      );
    }
  }

  // 3. Validacao de unicidade de IDs (DUPLICATE_ID_POLICY=REJECT)
  const idsByCollection = {};
  for (const coll of collections) {
    const set = new Set();
    for (const item of catalog[coll] || []) {
      if (set.has(item.id)) {
        errors.push(`ID duplicado na colecao '${coll}': ${item.id}`);
      }
      set.add(item.id);
    }
    idsByCollection[coll] = set;
  }

  // 4. Validacao de seguranca em URIs (sem credenciais embutidas)
  for (const art of catalog.artworks || []) {
    if (/:\/\/.*:.*@/.test(art.uri)) {
      errors.push(`Credencial embutida detectada em artwork URI: ${art.id}`);
    }
  }

  // 5. Validacao de Integridade Referencial
  const genres = idsByCollection.genres;
  const categories = idsByCollection.categories;
  const artworks = idsByCollection.artworks;
  const streams = idsByCollection.streams;
  const series = idsByCollection.series;
  const seasons = idsByCollection.seasons;
  const episodes = idsByCollection.episodes;

  // Filmes
  for (const m of catalog.movies || []) {
    for (const gId of m.genreIds || []) {
      if (!genres.has(gId)) errors.push(`Movie '${m.id}' referencia genre inexistente '${gId}'`);
    }
    for (const cId of m.categoryIds || []) {
      if (!categories.has(cId)) errors.push(`Movie '${m.id}' referencia category inexistente '${cId}'`);
    }
    for (const aId of m.artworkIds || []) {
      if (!artworks.has(aId)) errors.push(`Movie '${m.id}' referencia artwork inexistente '${aId}'`);
    }
    for (const sId of m.streamIds || []) {
      if (!streams.has(sId)) errors.push(`Movie '${m.id}' referencia stream inexistente '${sId}'`);
    }
  }

  // Series
  for (const s of catalog.series || []) {
    for (const gId of s.genreIds || []) {
      if (!genres.has(gId)) errors.push(`Series '${s.id}' referencia genre inexistente '${gId}'`);
    }
    for (const cId of s.categoryIds || []) {
      if (!categories.has(cId)) errors.push(`Series '${s.id}' referencia category inexistente '${cId}'`);
    }
    for (const aId of s.artworkIds || []) {
      if (!artworks.has(aId)) errors.push(`Series '${s.id}' referencia artwork inexistente '${aId}'`);
    }
    for (const seaId of s.seasonIds || []) {
      if (!seasons.has(seaId)) errors.push(`Series '${s.id}' referencia season inexistente '${seaId}'`);
    }
  }

  // Seasons
  for (const sea of catalog.seasons || []) {
    if (!series.has(sea.seriesId)) {
      errors.push(`Season '${sea.id}' referencia seriesId inexistente '${sea.seriesId}'`);
    }
    for (const epId of sea.episodeIds || []) {
      if (!episodes.has(epId)) {
        errors.push(`Season '${sea.id}' referencia episode inexistente '${epId}'`);
      }
    }
    for (const aId of sea.artworkIds || []) {
      if (!artworks.has(aId)) errors.push(`Season '${sea.id}' referencia artwork inexistente '${aId}'`);
    }
  }

  // Episodes
  for (const ep of catalog.episodes || []) {
    if (!series.has(ep.seriesId)) {
      errors.push(`Episode '${ep.id}' referencia seriesId inexistente '${ep.seriesId}'`);
    }
    if (!seasons.has(ep.seasonId)) {
      errors.push(`Episode '${ep.id}' referencia seasonId inexistente '${ep.seasonId}'`);
    }
    for (const aId of ep.artworkIds || []) {
      if (!artworks.has(aId)) errors.push(`Episode '${ep.id}' referencia artwork inexistente '${aId}'`);
    }
    for (const sId of ep.streamIds || []) {
      if (!streams.has(sId)) errors.push(`Episode '${ep.id}' referencia stream inexistente '${sId}'`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// -------------------------------------------------------------
// EXECUCAO PRINCIPAL E SUITE DE TESTES
// -------------------------------------------------------------

console.log('=== Xandeflix Prebuilt Data Contract Validator ===');

// 1. Validar fixture sintetica canônica
console.log('\n[TEST 1] Validando fixture sintetica canonica:');
const canonicalResult = validateCatalog(fixture);
if (!canonicalResult.valid) {
  console.error('FAIL: Fixture sintetica canonica invalida!');
  console.error(canonicalResult.errors);
  process.exit(1);
}
console.log('PASS: Fixture sintetica canonica aprovada com sucesso.');

// 2. Testes Negativos em Memoria (provando rejeicao estrita)
console.log('\n[TEST 2] Executando suite de testes negativos em memoria:');

const negativeCases = [
  {
    name: 'schemaVersion invalida (esperado != 1)',
    mutate: (c) => { c.metadata.schemaVersion = 2; },
    expectedErrorSnippet: 'must be equal to constant',
  },
  {
    name: 'Campo obrigatorio ausente no metadata (snapshotId)',
    mutate: (c) => { delete c.metadata.snapshotId; },
    expectedErrorSnippet: "must have required property 'snapshotId'",
  },
  {
    name: 'ID duplicado na colecao de movies',
    mutate: (c) => {
      c.movies.push({ ...c.movies[0] });
      c.metadata.counts.movies += 1;
    },
    expectedErrorSnippet: 'ID duplicado',
  },
  {
    name: 'Referencia quebrada em Movie (genreId inexistente)',
    mutate: (c) => { c.movies[0].genreIds.push('gn-nao-existe'); },
    expectedErrorSnippet: 'referencia genre inexistente',
  },
  {
    name: 'Contagem declarada divergente (declared count != actual length)',
    mutate: (c) => { c.metadata.counts.movies = 999; },
    expectedErrorSnippet: 'Contagem divergente para',
  },
  {
    name: 'Credencial embutida em URI de artwork',
    mutate: (c) => {
      c.artworks[0].uri = 'https://usuario:senha123@art.synthetic.xandeflix.test/poster.jpg';
    },
    expectedErrorSnippet: 'must match pattern',
  },
  {
    name: 'Campo desconhecido na raiz (UNKNOWN_TOP_LEVEL_FIELDS=REJECT)',
    mutate: (c) => { c.campoNaoAutorizado = true; },
    expectedErrorSnippet: 'must NOT have additional properties',
  },
];

let negativePassCount = 0;
for (const testCase of negativeCases) {
  const clone = JSON.parse(JSON.stringify(fixture));
  testCase.mutate(clone);
  const res = validateCatalog(clone);

  if (res.valid) {
    console.error(`FAIL: Teste negativo falhou — mutacao '${testCase.name}' foi aceita indevidamente!`);
    process.exit(1);
  }

  const matches = res.errors.some((err) =>
    err.toLowerCase().includes(testCase.expectedErrorSnippet.toLowerCase())
  );

  if (!matches) {
    console.error(
      `FAIL: Teste negativo '${testCase.name}' rejeitou, mas nao conteve o erro esperado '${testCase.expectedErrorSnippet}'. Erros:`,
      res.errors
    );
    process.exit(1);
  }

  console.log(`  ✓ Rejeitado corretamente: ${testCase.name}`);
  negativePassCount++;
}

console.log(`\nTodos os ${negativePassCount} testes negativos passaram com sucesso.`);
console.log('RESULTADO FINAL: PASS_PREBUILT_G2_DATA_CONTRACT_VALIDATION');
process.exit(0);
