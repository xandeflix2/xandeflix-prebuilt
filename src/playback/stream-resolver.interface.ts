/**
 * Xandeflix Prebuilt — Stream Resolver Interface (Gate G8)
 *
 * Contrato abstrato para resolução de referências de stream (StreamRef)
 * em requisições de reprodução direta (ResolvedPlaybackRequest).
 *
 * Princípios:
 * - ZERO PROXY: O resolver gera exclusivamente metadados de requisição (URI + headers).
 * - ZERO MEDIA BYTES: Nenhum byte de mídia trafega pelo resolver (STREAM_RESOLVER_MEDIA_BYTES_HANDLED = 0).
 */

import type { StreamRef } from '../contracts/catalog.ts';
import type { RuntimeSourceContext } from './source-runtime-context.ts';
import type { ResolvedPlaybackRequest } from './playback.types.ts';

export interface ResolveOptions {
  title?: string;
  startPositionMs?: number;
}

export interface StreamResolver {
  /**
   * Transforma uma referência de stream do catálogo e o contexto runtime
   * em uma requisição concreta de reprodução direta.
   */
  resolve(
    streamRef: StreamRef,
    runtimeSourceContext: RuntimeSourceContext,
    options?: ResolveOptions
  ): Promise<ResolvedPlaybackRequest>;
}
