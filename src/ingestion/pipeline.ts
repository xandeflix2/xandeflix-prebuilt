/**
 * Xandeflix Prebuilt — Ingestion Pipeline Orchestrator
 *
 * Orquestra o fluxo completo de ingestão externa:
 * 1. Adapter Load (parse raw)
 * 2. Adapter Validate (raw integrity check)
 * 3. Normalization (transform raw into canonical PrebuiltCatalog v1)
 * 4. Post-Normalization Validation (canonical JSON Schema + referential integrity)
 * 5. Optional output persistence (gitignored tmp)
 *
 * Princípios:
 * - FAIL_CLOSED=SIM (nunca produz snapshot parcial em caso de erro)
 * - SANITIZED_LOGGING=SIM (sem credenciais ou payloads privados em logs)
 */

import fs from 'node:fs';
import path from 'node:path';
import type { SourceAdapter } from './source-adapter.ts';
import type { IngestionOptions, IngestionResult, IngestionMetrics, RawSourceCatalog } from './types.ts';
import { normalizeRawCatalog } from './normalize.ts';
import { validateNormalizedCatalog } from './validate.ts';

export class IngestionPipeline {
  private adapter: SourceAdapter;

  constructor(adapter: SourceAdapter) {
    this.adapter = adapter;
  }

  async execute(input: unknown, options?: IngestionOptions): Promise<IngestionResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    const emptyMetrics: IngestionMetrics = {
      sourceItemsTotal: 0,
      moviesNormalized: 0,
      seriesNormalized: 0,
      seasonsNormalized: 0,
      episodesNormalized: 0,
      categoriesNormalized: 0,
      genresNormalized: 0,
      streamsNormalized: 0,
      artworksNormalized: 0,
      pipelineDurationMs: 0,
    };

    // 1. Adapter Load
    let raw: RawSourceCatalog;
    try {
      raw = await this.adapter.load(input);
    } catch (err) {
      errors.push(`[ADAPTER_LOAD_ERROR] ${(err as Error).message}`);
      return {
        success: false,
        metrics: { ...emptyMetrics, pipelineDurationMs: Date.now() - startTime },
        errors,
      };
    }

    // 2. Adapter Validate (Raw Model)
    const rawValidation = this.adapter.validate(raw);
    if (!rawValidation.valid) {
      for (const err of rawValidation.errors) {
        errors.push(`[RAW_VALIDATION_ERROR] ${err}`);
      }
      return {
        success: false,
        metrics: { ...emptyMetrics, pipelineDurationMs: Date.now() - startTime },
        errors,
      };
    }

    // 3. Normalization
    let normalizedResult: ReturnType<typeof normalizeRawCatalog>;
    try {
      normalizedResult = normalizeRawCatalog(raw, options);
    } catch (err) {
      errors.push(`[NORMALIZATION_ERROR] ${(err as Error).message}`);
      return {
        success: false,
        metrics: { ...emptyMetrics, pipelineDurationMs: Date.now() - startTime },
        errors,
      };
    }

    const { catalog, metrics } = normalizedResult;

    // 4. Post-Normalization Validation
    const validation = validateNormalizedCatalog(catalog);
    if (!validation.valid) {
      for (const err of validation.errors) {
        errors.push(`[CONTRACT_VALIDATION_ERROR] ${err}`);
      }
      return {
        success: false,
        metrics: { ...metrics, pipelineDurationMs: Date.now() - startTime },
        errors,
      };
    }

    // 5. Opcional: Persistência Temporária do Catálogo
    if (options?.outputPath) {
      try {
        const fullPath = path.resolve(options.outputPath);
        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(fullPath, JSON.stringify(catalog, null, 2), 'utf8');
      } catch (err) {
        errors.push(`[OUTPUT_PERSISTENCE_ERROR] Falha ao escrever arquivo de saída: ${(err as Error).message}`);
        return {
          success: false,
          metrics: { ...metrics, pipelineDurationMs: Date.now() - startTime },
          errors,
        };
      }
    }

    return {
      success: true,
      catalog,
      metrics: {
        ...metrics,
        pipelineDurationMs: Date.now() - startTime,
      },
      errors: [],
    };
  }
}
