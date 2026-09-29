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

const ALLOWED_RUNTIME_HEADERS = new Set([
  'user-agent',
  'referer',
  'origin',
  'accept',
  'connection',
  'authorization',
]);

export class DirectStreamResolver implements StreamResolver {
  async resolve(
    streamRef: StreamRef,
    runtimeSourceContext?: RuntimeSourceContext,
    options?: ResolveOptions
  ): Promise<ResolvedPlaybackRequest> {
    // 1. Validar integridade da referência de stream (StreamRef)
    if (!streamRef || typeof streamRef !== 'object') {
      throw PlaybackError.streamRefNotFound();
    }

    if (!streamRef.id || typeof streamRef.id !== 'string') {
      throw PlaybackError.streamRefNotFound();
    }

    // 2. Determinar URI de reprodução (M3U Authority vs Source Protocol)
    let resolvedUri: string;
    const directUrl = streamRef.directStreamUrl;
    const extension = streamRef.containerExtension?.replace(/^\.+/, '') || 'm3u8';

    if (directUrl && typeof directUrl === 'string' && directUrl.trim().length > 0) {
      // M3U Direct Stream Authority: autoridade máxima e não depende de synthetic context
      resolvedUri = directUrl.trim();
    } else {
      // Exige contexto da fonte quando não houver directStreamUrl nativo
      if (!runtimeSourceContext) {
        throw PlaybackError.sourceContextUnavailable();
      }
      validateSourceContext(runtimeSourceContext);

      if (!streamRef.sourceItemId || typeof streamRef.sourceItemId !== 'string') {
        throw PlaybackError.resolutionFailed(`StreamRef ${streamRef.id} não possui sourceItemId válido.`);
      }

      const base = runtimeSourceContext.baseUrl.replace(/\/+$/, '');
      if (runtimeSourceContext.providerKind === 'FUTURE_XTREAM' || runtimeSourceContext.providerKind === 'XTREAM') {
        // Resolução protocol-aware para Xtream (quando providerKind for FUTURE_XTREAM ou XTREAM)
        const username = runtimeSourceContext.sessionMaterial?.username || '';
        const password = runtimeSourceContext.sessionMaterial?.password || '';
        const typeSegment = streamRef.contentKind === 'movie' ? 'movie' : 'series';
        resolvedUri = `${base}/${typeSegment}/${encodeURIComponent(username)}/${encodeURIComponent(password)}/${encodeURIComponent(streamRef.sourceItemId)}.${extension}`;
      } else {
        // Padrão genérico / sintético
        const subpath = streamRef.contentKind === 'movie' ? 'movies' : 'series';
        resolvedUri = `${base}/${subpath}/${encodeURIComponent(streamRef.sourceItemId)}.${extension}`;
      }
    }

    // 3. Validar URI segundo as regras de segurança (HTTPS baseline / HTTP local, sem user:pass@)
    validatePlaybackUri(resolvedUri);

    // 4. Determinar mimeType apropriado baseado na extensão ou URI
    let mimeType: string | undefined;
    const lowerUri = resolvedUri.toLowerCase();
    if (lowerUri.includes('.m3u8') || extension === 'm3u8') {
      mimeType = 'application/x-mpegURL';
    } else if (lowerUri.includes('.mp4') || extension === 'mp4') {
      mimeType = 'video/mp4';
    } else if (lowerUri.includes('.mkv') || extension === 'mkv') {
      mimeType = 'video/x-matroska';
    } else if (lowerUri.includes('.ts') || extension === 'ts') {
      mimeType = 'video/mp2t';
    }

    // 5. Encaminhamento de headers com allowlist estrita (zero secrets logging / no persistence)
    const headers: Record<string, string> = {
      'User-Agent': 'IPTVSmarters/1.0',
    };

    if (runtimeSourceContext?.headers) {
      for (const [key, value] of Object.entries(runtimeSourceContext.headers)) {
        if (value && typeof value === 'string' && ALLOWED_RUNTIME_HEADERS.has(key.toLowerCase())) {
          headers[key] = value.trim();
        }
      }
    }

    // 6. Montar requisição de reprodução transitória (NÃO PERSISTIDA)
    const request: ResolvedPlaybackRequest = {
      uri: resolvedUri,
      streamRefId: streamRef.id,
      contentKind: streamRef.contentKind as 'movie' | 'episode',
      title: options?.title || streamRef.id,
      providerKind: runtimeSourceContext?.providerKind || 'FUTURE_GENERIC_HTTP',
      headers,
      mimeType,
      startPositionMs: options?.startPositionMs,
    };

    return request;
  }
}
