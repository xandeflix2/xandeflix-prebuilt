/**
 * Xandeflix Prebuilt — Ingestion Catalog Validator
 *
 * Valida o catálogo gerado pela normalização contra o JSON Schema canônico Draft 2020-12
 * e contra as regras de negócio de integridade referencial, unicidade e contagens declaradas.
 *
 * Princípio: ONE_SOURCE_OF_TRUTH. Reutiliza o schema schemas/prebuilt-catalog.schema.json.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import type { PrebuiltCatalog } from '../contracts/catalog.ts';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCHEMA_PATH = path.resolve(__dirname, '..', '..', 'schemas', 'prebuilt-catalog.schema.json');

const schemaContent = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));

// @ts-expect-error Ajv default export interoperability
const AjvClass = Ajv2020.default || Ajv2020;
const ajv = new AjvClass({ allErrors: true, strict: false });
const addFormatsFn = (addFormats as unknown as { default?: (a: unknown) => void }).default || addFormats;
addFormatsFn(ajv);

const validateSchema = ajv.compile(schemaContent);

export function validateNormalizedCatalog(catalog: PrebuiltCatalog): ValidationResult {
  const errors: string[] = [];

  // 1. Validação JSON Schema Draft 2020-12
  const isSchemaValid = validateSchema(catalog);
  if (!isSchemaValid) {
    for (const err of validateSchema.errors || []) {
      errors.push(`JSON Schema: ${err.instancePath || '/'} ${err.message}`);
    }
    return { valid: false, errors };
  }

  // 2. Validação de Contagens Declaradas (Counts Check)
  const counts = catalog.metadata.counts;
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
  ] as const;

  for (const coll of collections) {
    const actual = Array.isArray(catalog[coll]) ? catalog[coll].length : -1;
    const declared = counts[coll];
    if (actual !== declared) {
      errors.push(
        `Contagem divergente para '${coll}': declarada=${declared}, real=${actual}`
      );
    }
  }

  // 3. Unicidade de IDs (DUPLICATE_ID_POLICY=REJECT)
  const idsByCollection: Record<string, Set<string>> = {};
  for (const coll of collections) {
    const set = new Set<string>();
    for (const item of catalog[coll] || []) {
      if (set.has(item.id)) {
        errors.push(`ID duplicado na coleção '${coll}': ${item.id}`);
      }
      set.add(item.id);
    }
    idsByCollection[coll] = set;
  }

  // 4. Segurança em URIs de Artwork (sem credenciais embutidas)
  for (const art of catalog.artworks || []) {
    if (/:\/\/.*:.*@/.test(art.uri)) {
      errors.push(`Credencial embutida detectada em artwork URI: ${art.id}`);
    }
  }

  // 5. Integridade Referencial
  const genres = idsByCollection.genres || new Set();
  const categories = idsByCollection.categories || new Set();
  const artworks = idsByCollection.artworks || new Set();
  const streams = idsByCollection.streams || new Set();
  const series = idsByCollection.series || new Set();
  const seasons = idsByCollection.seasons || new Set();
  const episodes = idsByCollection.episodes || new Set();

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

  // Séries
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

  // Temporadas
  for (const sea of catalog.seasons || []) {
    if (!series.has(sea.seriesId)) {
      errors.push(`Season '${sea.id}' referencia series inexistente '${sea.seriesId}'`);
    }
    for (const epId of sea.episodeIds || []) {
      if (!episodes.has(epId)) {
        errors.push(`Season '${sea.id}' referencia episode inexistente '${epId}'`);
      }
    }
    for (const aId of sea.artworkIds || []) {
      if (!artworks.has(aId)) {
        errors.push(`Season '${sea.id}' referencia artwork inexistente '${aId}'`);
      }
    }
  }

  // Episódios
  for (const ep of catalog.episodes || []) {
    if (!series.has(ep.seriesId)) {
      errors.push(`Episode '${ep.id}' referencia series inexistente '${ep.seriesId}'`);
    }
    if (!seasons.has(ep.seasonId)) {
      errors.push(`Episode '${ep.id}' referencia season inexistente '${ep.seasonId}'`);
    }
    for (const aId of ep.artworkIds || []) {
      if (!artworks.has(aId)) {
        errors.push(`Episode '${ep.id}' referencia artwork inexistente '${aId}'`);
      }
    }
    for (const sId of ep.streamIds || []) {
      if (!streams.has(sId)) {
        errors.push(`Episode '${ep.id}' referencia stream inexistente '${sId}'`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
