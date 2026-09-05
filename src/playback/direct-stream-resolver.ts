/**
 * Xandeflix Prebuilt — Direct Stream Resolver (Gate G8)
 *
 * Implementação determinística de resolução direta para provedores sintéticos e HTTP diretos.
 *
 * Princípios:
 * - LOGICAL RESOLUTION ONLY: Produz exclusivamente URI de reprodução e headers de sessão.
 * - ZERO INTERMEDIARY: A URI resultante aponta diretamente para a infraestrutura da fonte (Device → Source).
 * - ZERO MEDIA HANDLING: Não baixa, não faz cache e não retransmite pacotes de mídia.
 */

import type { StreamRef } from '../contracts/catalog.ts';
import type { StreamResolver, ResolveOptions } from './stream-resolver.interface.ts';
import {
  type RuntimeSourceContext,
  validateSourceContext,
} from './source-runtime-context.ts';
import type { ResolvedPlaybackRequest } from './playback.types.ts';
import { PlaybackError } from './playback-errors.ts';
import { validatePlaybackUri } from './playback-redaction.ts';

export class DirectStreamResolver implements StreamResolver {
  async resolve(
    streamRef: StreamRef,
    runtimeSourceContext: RuntimeSourceContext,
    options?: ResolveOptions
  ): Promise<ResolvedPlaybackRequest> {
    // 1. Validar contexto runtime da fonte (existência, integridade e expiração)
    validateSourceContext(runtimeSourceContext);

    // 2. Validar integridade da referência de stream (StreamRef)
    if (!streamRef || typeof streamRef !== 'object') {
      throw PlaybackError.streamRefNotFound();
    }

    if (!streamRef.id || typeof streamRef.id !== 'string') {
      throw PlaybackError.streamRefNotFound();
    }

    if (!streamRef.sourceItemId || typeof streamRef.sourceItemId !== 'string') {
      throw PlaybackError.resolutionFailed(`StreamRef ${streamRef.id} não possui sourceItemId válido.`);
    }

    // 3. Montar URI direta dependendo do contentKind
    const base = runtimeSourceContext.baseUrl.replace(/\/+$/, '');
    const extension = streamRef.containerExtension?.replace(/^\.+/, '') || 'm3u8';
    const subpath = streamRef.contentKind === 'movie' ? 'movies' : 'series';

    // Formato canônico direto: {baseUrl}/{subpath}/{sourceItemId}.{extension}
    const resolvedUri = `${base}/${subpath}/${encodeURIComponent(streamRef.sourceItemId)}.${extension}`;

    // 4. Validar URI segundo as regras de segurança (HTTPS baseline, sem user:pass@)
    validatePlaybackUri(resolvedUri);

    // 5. Determinar mimeType apropriado baseado na extensão
    let mimeType: string | undefined;
    if (extension === 'm3u8') {
      mimeType = 'application/x-mpegURL';
    } else if (extension === 'mp4') {
      mimeType = 'video/mp4';
    } else if (extension === 'mkv') {
      mimeType = 'video/x-matroska';
    } else if (extension === 'ts') {
      mimeType = 'video/mp2t';
    }

    // 6. Montar requisição de reprodução transitória (NÃO PERSISTIDA)
    const request: ResolvedPlaybackRequest = {
      uri: resolvedUri,
      streamRefId: streamRef.id,
      contentKind: streamRef.contentKind as 'movie' | 'episode',
      title: options?.title || streamRef.id,
      providerKind: runtimeSourceContext.providerKind,
      headers: runtimeSourceContext.headers ? { ...runtimeSourceContext.headers } : undefined,
      mimeType,
      startPositionMs: options?.startPositionMs,
    };

    return request;
  }
}
