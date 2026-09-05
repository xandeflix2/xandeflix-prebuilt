/**
 * Xandeflix Prebuilt — Source Adapter Contract
 *
 * Contrato abstrato para adaptadores de fontes de catálogo externo.
 * Responsabilidades:
 * - Carregar/fazer parse do payload de entrada da fonte
 * - Validar a conformidade básica do modelo intermediário raw
 * - Não embutir credenciais hardcoded
 * - Não interagir com armazenamento ou runtime final
 */

import type { RawSourceCatalog } from './types.ts';

export interface SourceValidationResult {
  valid: boolean;
  errors: string[];
}

export interface SourceAdapter {
  readonly name: string;

  /**
   * Converte a entrada bruta da fonte para a representação intermediária RawSourceCatalog
   */
  load(input: unknown): Promise<RawSourceCatalog> | RawSourceCatalog;

  /**
   * Valida a integridade básica do modelo intermediário antes da normalização
   */
  validate(raw: RawSourceCatalog): SourceValidationResult;
}
