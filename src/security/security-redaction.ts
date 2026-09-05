/**
 * Xandeflix Prebuilt — Security Redaction Utility (Gate G10)
 *
 * Sanitização ativa de logs, mensagens de erro e payloads para prevenir vazamento acidental de segredos.
 *
 * Princípios:
 * - LOG_SANITIZATION = REQUIRED
 * - Nunca expor tokens, senhas, chaves privadas ou URLs autenticadas.
 */

const SENSITIVE_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  // Chaves privadas PEM
  {
    pattern: /-----BEGIN (?:EC )?PRIVATE KEY-----[a-zA-Z0-9+/=\s\r\n]+-----END (?:EC )?PRIVATE KEY-----/g,
    replacement: '[REDACTED_PRIVATE_KEY]',
  },
  // Bearer tokens e Authorization headers
  {
    pattern: /(Authorization\s*:\s*(?:Bearer\s+)?)['"]?[a-zA-Z0-9_\-.~+/=]+['"]?/gi,
    replacement: '$1[REDACTED_AUTH_TOKEN]',
  },
  // Cookies
  {
    pattern: /(Cookie\s*:\s*)['"]?[^;\r\n"']+['"]?/gi,
    replacement: '$1[REDACTED_COOKIE]',
  },
  // Senhas em strings ou URLs (user:pass@host)
  {
    pattern: /(https?:\/\/|rtmp:\/\/|srt:\/\/)([^:]+):([^@]+)@/gi,
    replacement: '$1$2:[REDACTED_PASSWORD]@',
  },
  // Parâmetros ou pares chave=valor com tokens/senhas (password=, secret=, token=, etc.)
  {
    pattern: /((?:\b|[?&])(?:token|key|secret|auth|apikey|password|pass|jwt)=)[^\s&;,]+/gi,
    replacement: '$1[REDACTED_VALUE]',
  },
  // Propriedades JSON de senhas ou tokens
  {
    pattern: /("(?:password|secret|token|privateKey|service_role)")\s*:\s*"[^"]+"/gi,
    replacement: '$1:"[REDACTED]"',
  },
];

export function sanitizeLogText(text: string): string {
  if (!text || typeof text !== 'string') return text;
  let sanitized = text;
  for (const { pattern, replacement } of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(pattern, replacement);
  }
  return sanitized;
}

export function sanitizeObject<T>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj;
  try {
    const jsonStr = JSON.stringify(obj);
    const sanitizedStr = sanitizeLogText(jsonStr);
    return JSON.parse(sanitizedStr) as T;
  } catch {
    return obj;
  }
}
