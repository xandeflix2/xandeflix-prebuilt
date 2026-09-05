/**
 * Xandeflix Prebuilt — Artifact Security Errors (Gate G10)
 *
 * Categorias estáveis de erro para verificação criptográfica e boundary de importação segura.
 *
 * Princípio:
 * - NO_SECRETS_IN_ERROR: Mensagens factuais e sanitizadas sem expor chaves ou dados confidenciais.
 */

export const SecurityErrorCodes = {
  SECURITY_ENVELOPE_INVALID: 'SECURITY_ENVELOPE_INVALID',
  ARTIFACT_HASH_MISMATCH: 'ARTIFACT_HASH_MISMATCH',
  SIGNATURE_INVALID: 'SIGNATURE_INVALID',
  UNKNOWN_SIGNING_KEY: 'UNKNOWN_SIGNING_KEY',
  REVOKED_SIGNING_KEY: 'REVOKED_SIGNING_KEY',
  UNSUPPORTED_SIGNATURE_ALGORITHM: 'UNSUPPORTED_SIGNATURE_ALGORITHM',
  UNSIGNED_ARTIFACT: 'UNSIGNED_ARTIFACT',
  ARTIFACT_SIZE_MISMATCH: 'ARTIFACT_SIZE_MISMATCH',
  WRONG_ARTIFACT_TYPE: 'WRONG_ARTIFACT_TYPE',
  KEY_EXPIRED: 'KEY_EXPIRED',
  KEY_NOT_YET_VALID: 'KEY_NOT_YET_VALID',
  SECURE_IMPORT_FAILED: 'SECURE_IMPORT_FAILED',
} as const;

export type SecurityErrorCode = (typeof SecurityErrorCodes)[keyof typeof SecurityErrorCodes];

export class SecurityError extends Error {
  public readonly code: SecurityErrorCode;

  constructor(code: SecurityErrorCode, message: string) {
    super(`[${code}] ${message}`);
    this.name = 'SecurityError';
    this.code = code;
    Object.setPrototypeOf(this, SecurityError.prototype);
  }
}
