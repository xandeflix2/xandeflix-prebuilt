/**
 * Xandeflix Prebuilt — Source Error Sanitizer (Experiment R7A)
 *
 * Sanitizador estrito de erros e textos de rede para proteção contra vazamento de segredos.
 *
 * Princípios:
 * - NO_SECRET_CONTEXT: Credenciais, tokens e parâmetros de consulta jamais trafegam em mensagens de erro.
 * - FAIL_SAFE: Qualquer erro desconhecido é mapeado para códigos canônicos pré-aprovados.
 */

export const SANITIZED_ERROR_CODES = {
  SOURCE_AUTH_FAILED: 'SOURCE_AUTH_FAILED',
  SOURCE_NETWORK_TIMEOUT: 'SOURCE_NETWORK_TIMEOUT',
  SOURCE_UNREACHABLE: 'SOURCE_UNREACHABLE',
  SOURCE_UNSUPPORTED_FORMAT: 'SOURCE_UNSUPPORTED_FORMAT',
  SOURCE_INVALID_RESPONSE: 'SOURCE_INVALID_RESPONSE',
  SOURCE_CONFIG_INVALID: 'SOURCE_CONFIG_INVALID',
  SOURCE_CONNECTION_FAILED: 'SOURCE_CONNECTION_FAILED',
} as const;

export type SanitizedErrorCode = keyof typeof SANITIZED_ERROR_CODES;

/**
 * Remove credenciais, tokens e parâmetros sensíveis de qualquer URL.
 * Retorna apenas o protocolo e domínio limpos, sem query string nem user/pass embutidos.
 */
export function sanitizeUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  try {
    const parsed = new URL(rawUrl);
    // Elimina credenciais embutidas na URL (http://user:pass@host)
    parsed.username = '';
    parsed.password = '';
    // Elimina query parameters inteiros (podem conter username, password, token, etc.)
    parsed.search = '';
    parsed.hash = '';
    return parsed.toString();
  } catch {
    // Se não for URL válida pelo construtor nativo, mascara agressivamente
    const match = rawUrl.match(/^([a-zA-Z][a-zA-Z0-9+.-]*:\/\/)?([^/?#:]+)/);
    if (match) {
      return (match[1] || 'http://') + match[2];
    }
    return '[SANITIZED_URL]';
  }
}

/**
 * Redige qualquer ocorrência de credenciais em blocos de texto genéricos.
 */
export function redactCredentialsInText(text: string): string {
  if (!text) return '';
  return text
    .replace(/(username|user|usr)=[^&\s]+/gi, '$1=[REDACTED]')
    .replace(/(password|pass|pwd)=[^&\s]+/gi, '$1=[REDACTED]')
    .replace(/(token|auth|key|secret)=[^&\s]+/gi, '$1=[REDACTED]')
    .replace(/:\/\/([^:@]+):([^@]+)@/g, '://[REDACTED_USER]:[REDACTED_PASSWORD]@')
    .replace(/Bearer\s+[A-Za-z0-9-_.]+/gi, 'Bearer [REDACTED_TOKEN]');
}

/**
 * Mapeia qualquer exceção de rede, status HTTP ou erro genérico para um código sanitizado permitido.
 * Garante que stacks e mensagens internas do V8/WebKit não exponham URLs ou credenciais.
 */
export function sanitizeErrorMessage(err: unknown): SanitizedErrorCode {
  if (!err) return SANITIZED_ERROR_CODES.SOURCE_CONNECTION_FAILED;

  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();

  // 1. Falhas de autenticação
  if (
    lower.includes('401') ||
    lower.includes('403') ||
    lower.includes('unauthorized') ||
    lower.includes('forbidden') ||
    lower.includes('auth') ||
    lower.includes('credentials')
  ) {
    return SANITIZED_ERROR_CODES.SOURCE_AUTH_FAILED;
  }

  // 2. Timeout de rede
  if (
    lower.includes('timeout') ||
    lower.includes('timed out') ||
    lower.includes('timedout') ||
    lower.includes('time out') ||
    lower.includes('aborted') ||
    lower.includes('etimedout') ||
    lower.includes('deadline')
  ) {
    return SANITIZED_ERROR_CODES.SOURCE_NETWORK_TIMEOUT;
  }

  // 3. Servidor inalcançável / conexão recusada / DNS
  if (
    lower.includes('econnrefused') ||
    lower.includes('enotfound') ||
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('network request failed') ||
    lower.includes('unreachable')
  ) {
    return SANITIZED_ERROR_CODES.SOURCE_UNREACHABLE;
  }

  // 4. Formato não suportado
  if (
    lower.includes('unsupported') ||
    lower.includes('not a playlist') ||
    lower.includes('format') ||
    lower.includes('single_stream') ||
    lower.includes('ts_direct')
  ) {
    return SANITIZED_ERROR_CODES.SOURCE_UNSUPPORTED_FORMAT;
  }

  // 5. Resposta inválida (404, 500, HTML onde se esperava JSON ou M3U)
  if (
    lower.includes('404') ||
    lower.includes('500') ||
    lower.includes('502') ||
    lower.includes('503') ||
    lower.includes('invalid') ||
    lower.includes('syntaxerror')
  ) {
    return SANITIZED_ERROR_CODES.SOURCE_INVALID_RESPONSE;
  }

  // 6. Configuração inválida
  if (lower.includes('config') || lower.includes('url missing') || lower.includes('host missing')) {
    return SANITIZED_ERROR_CODES.SOURCE_CONFIG_INVALID;
  }

  return SANITIZED_ERROR_CODES.SOURCE_CONNECTION_FAILED;
}
