/**
 * Xandeflix Prebuilt — Playback Error Model (Gate G8)
 *
 * Modelo de exceções estruturadas e sanitizadas para reprodução.
 *
 * Princípios:
 * - SAFE SANITIZATION: Mensagens de erro nunca expõem tokens, senhas ou URLs completas com query secrets.
 * - CATEGORICAL ERRORS: Categorias estáveis para observabilidade e tratamento na UI.
 */

import type { PlaybackErrorCategory } from './playback.types.ts';

export class PlaybackError extends Error {
  readonly category: PlaybackErrorCategory;

  constructor(category: PlaybackErrorCategory, message: string) {
    super(message);
    this.name = 'PlaybackError';
    this.category = category;

    // Mantém prototype chain correta em ES5/ES6
    Object.setPrototypeOf(this, PlaybackError.prototype);
  }

  static streamRefNotFound(streamRefId?: string): PlaybackError {
    return new PlaybackError(
      'STREAM_REF_NOT_FOUND',
      `StreamRef não encontrado no catálogo ativo${streamRefId ? `: ${streamRefId}` : ''}.`
    );
  }

  static sourceContextUnavailable(): PlaybackError {
    return new PlaybackError(
      'SOURCE_CONTEXT_UNAVAILABLE',
      'Contexto runtime da fonte não configurado ou indisponível.'
    );
  }

  static sourceContextExpired(expiresAt?: number): PlaybackError {
    return new PlaybackError(
      'SOURCE_CONTEXT_EXPIRED',
      `Contexto runtime da fonte expirado${expiresAt ? ` em ${new Date(expiresAt).toISOString()}` : ''}.`
    );
  }

  static unsupportedScheme(scheme: string): PlaybackError {
    return new PlaybackError(
      'UNSUPPORTED_SCHEME',
      `Esquema de URI não suportado: ${scheme}. Permitido apenas HTTPS (e HTTP em teste sintético).`
    );
  }

  static userinfoCredentialsRejected(): PlaybackError {
    return new PlaybackError(
      'URL_USERINFO_CREDENTIALS_REJECTED',
      'URI contém credenciais embutidas (user:pass@), o que é estritamente proibido.'
    );
  }

  static resolutionFailed(reason: string): PlaybackError {
    return new PlaybackError(
      'RESOLUTION_FAILED',
      `Falha na resolução do stream: ${reason}`
    );
  }

  static playerUnavailable(detail?: string): PlaybackError {
    return new PlaybackError(
      'PLAYER_UNAVAILABLE',
      detail || 'Player nativo Android não disponível nesta plataforma.'
    );
  }

  static playerInitFailed(detail?: string): PlaybackError {
    return new PlaybackError(
      'PLAYER_INIT_FAILED',
      `Falha na inicialização do player nativo: ${detail || 'Erro desconhecido'}`
    );
  }
}
