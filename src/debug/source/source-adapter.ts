/**
 * Xandeflix Prebuilt — Real Source Adapter Interface (Experiment R7A)
 *
 * Contrato base para adaptadores de fontes reais (Xtream, M3U).
 *
 * Princípios:
 * - EXTENSION_POINT: Ponto de extensão para futuras integrações (R7B).
 * - MINIMAL_HANDSHAKE: O teste de conexão no R7A executa a menor verificação possível
 *   sem importar catálogo, sem baixar listas completas e sem criar SearchIndex.
 */

import {
  type SourceType,
  type SourceRuntimeConfig,
  type SourceConnectionTestResult,
} from './source-runtime-config.ts';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface RealSourceAdapter {
  getSourceType(): SourceType;
  validateConfig(config: SourceRuntimeConfig): ValidationResult;
  testConnection(config: SourceRuntimeConfig): Promise<SourceConnectionTestResult>;
}
