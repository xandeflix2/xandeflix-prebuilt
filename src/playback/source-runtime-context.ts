/**
 * Xandeflix Prebuilt — Source Runtime Context (Gate G8)
 *
 * Modelo e utilitários para contexto em memória da fonte em tempo de execução.
 *
 * Princípios:
 * - IN-MEMORY ONLY: Nunca persistir este objeto em catálogo, search index, provisioning ou storage.
 * - SEPARATION OF CONCERNS: Isola a referência de catálogo (StreamRef) da infraestrutura da fonte.
 * - SYNTHETIC DEFAULT: Para o Gate G8, utiliza estritamente contextos sintéticos de teste.
 */

import type { SourceProviderKind } from './playback.types.ts';
import { PlaybackError } from './playback-errors.ts';

export interface RuntimeSourceContext {
  readonly sourceId: string;
  readonly providerKind: SourceProviderKind;
  readonly baseUrl: string;
  readonly sessionMaterial?: Record<string, string>;
  readonly headers?: Record<string, string>;
  readonly expiresAt?: number; // epoch ms
}

/**
 * Cria um contexto sintético canônico para testes automatizados.
 * Utiliza valores comprovadamente artificiais (example.invalid).
 */
export function createSyntheticSourceContext(options?: {
  sourceId?: string;
  baseUrl?: string;
  headers?: Record<string, string>;
  expiresAt?: number;
}): RuntimeSourceContext {
  return {
    sourceId: options?.sourceId || 'synthetic-source-primary',
    providerKind: 'SYNTHETIC_DIRECT',
    baseUrl: options?.baseUrl || 'https://media.example.invalid',
    headers: options?.headers,
    expiresAt: options?.expiresAt,
  };
}

/**
 * Valida um contexto runtime de fonte antes do processo de resolução de stream.
 */
export function validateSourceContext(context?: RuntimeSourceContext): void {
  if (!context) {
    throw PlaybackError.sourceContextUnavailable();
  }

  if (!context.sourceId || typeof context.sourceId !== 'string' || context.sourceId.trim().length === 0) {
    throw PlaybackError.sourceContextUnavailable();
  }

  if (!context.baseUrl || typeof context.baseUrl !== 'string' || context.baseUrl.trim().length === 0) {
    throw PlaybackError.sourceContextUnavailable();
  }

  // Verifica se o contexto está expirado
  if (typeof context.expiresAt === 'number' && context.expiresAt > 0) {
    if (Date.now() > context.expiresAt) {
      throw PlaybackError.sourceContextExpired(context.expiresAt);
    }
  }
}
