/**
 * Xandeflix Prebuilt — Playback Redaction & URI Validation (Gate G8)
 *
 * Funções de validação de segurança e sanitização para URIs e headers de playback.
 *
 * Princípios:
 * - NO LOG CREDENTIALS: Nunca expor credenciais, tokens, cookies ou segredos em logs.
 * - CREDENTIALIZED URL GUARD: Rejeitar explicitamente URIs com credenciais embutidas (user:pass@).
 * - HTTPS_BASELINE: Esquema preferencial HTTPS; HTTP restrito a teste sintético; rejeitar esquemas arbitrários.
 */

import { PlaybackError } from './playback-errors.ts';

/**
 * Esquemas de URI permitidos para reprodução.
 * Em baseline de produção: https.
 * Em teste sintético local/controlado: http.
 */
const ALLOWED_SCHEMES = new Set(['https:', 'http:']);

/**
 * Esquemas expressamente proibidos e perigosos.
 */
const FORBIDDEN_SCHEMES = new Set([
  'file:',
  'content:',
  'javascript:',
  'data:',
  'intent:',
  'about:',
  'blob:',
]);

/**
 * Headers sensíveis cujo valor NUNCA deve ser registrado em logs.
 */
const SENSITIVE_HEADER_KEYS = new Set([
  'authorization',
  'cookie',
  'set-cookie',
  'token',
  'x-auth-token',
  'x-source-key',
  'proxy-authorization',
]);

/**
 * Valida se uma URI atende às regras de segurança de reprodução:
 * 1. Deve ser parseável como URL.
 * 2. Deve ter esquema permitido (https: ou http:).
 * 3. Não pode conter credenciais de autenticação básica (user:pass@).
 */
export function validatePlaybackUri(uri: string): void {
  if (!uri || typeof uri !== 'string' || uri.trim().length === 0) {
    throw PlaybackError.resolutionFailed('URI de reprodução vazia ou inválida.');
  }

  const trimmed = uri.trim();

  // Verifica preliminarmente esquemas proibidos
  const lower = trimmed.toLowerCase();
  for (const scheme of FORBIDDEN_SCHEMES) {
    if (lower.startsWith(scheme)) {
      throw PlaybackError.unsupportedScheme(scheme.replace(':', ''));
    }
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw PlaybackError.resolutionFailed(`Formato de URI malformado: ${trimmed.slice(0, 32)}...`);
  }

  // Validação de scheme
  if (!ALLOWED_SCHEMES.has(parsed.protocol)) {
    throw PlaybackError.unsupportedScheme(parsed.protocol.replace(':', ''));
  }

  // Detecção e rejeição de userinfo (user:pass@)
  if (parsed.username || parsed.password) {
    throw PlaybackError.userinfoCredentialsRejected();
  }
}

/**
 * Sanitiza uma URI para exibição em logs e relatórios.
 * Remove eventuais credenciais de query string ou autenticação,
 * preservando apenas scheme, host e pathname.
 */
export function sanitizePlaybackUriForLog(uri: string): string {
  if (!uri || typeof uri !== 'string') {
    return '[EMPTY_URI]';
  }

  try {
    const parsed = new URL(uri.trim());
    const sanitizedProtocol = parsed.protocol;
    const sanitizedHost = parsed.host;
    const sanitizedPath = parsed.pathname;

    if (parsed.search) {
      return `${sanitizedProtocol}//${sanitizedHost}${sanitizedPath}?[QUERY_REDACTED]`;
    }

    return `${sanitizedProtocol}//${sanitizedHost}${sanitizedPath}`;
  } catch {
    // Se falhar o parse padrão, não vazar a string original caso contenha segredo
    return '[MALFORMED_URI_REDACTED]';
  }
}

/**
 * Sanitiza um mapa de headers para exibição segura em logs.
 * Substitui valores de headers sensíveis por [REDACTED].
 */
export function sanitizeHeadersForLog(
  headers?: Record<string, string>
): Record<string, string> {
  if (!headers) return {};

  const sanitized: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase().trim();
    if (SENSITIVE_HEADER_KEYS.has(lowerKey)) {
      sanitized[key] = '[REDACTED]';
    } else {
      // Para headers não sensíveis (ex: User-Agent, Referer), registra normalmente
      sanitized[key] = value;
    }
  }

  return sanitized;
}
