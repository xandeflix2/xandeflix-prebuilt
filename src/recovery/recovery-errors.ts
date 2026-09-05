/**
 * Xandeflix Prebuilt — Recovery Error Codes (Gate G10)
 *
 * Categorias estáveis de erro para o sistema de validação de startup e recuperação local.
 *
 * Princípios:
 * - NO_SECRETS_IN_ERROR: Mensagens factuais sem expor identificadores sensíveis.
 */

export const RecoveryErrorCodes = {
  ACTIVE_POINTER_INVALID: 'ACTIVE_POINTER_INVALID',
  ACTIVE_SNAPSHOT_INVALID: 'ACTIVE_SNAPSHOT_INVALID',
  PREVIOUS_SNAPSHOT_INVALID: 'PREVIOUS_SNAPSHOT_INVALID',
  RECOVERY_SUCCEEDED: 'RECOVERY_SUCCEEDED',
  RECOVERY_FAILED: 'RECOVERY_FAILED',
  NO_VALID_LOCAL_SNAPSHOT: 'NO_VALID_LOCAL_SNAPSHOT',
  SNAPSHOT_CORRUPTED: 'SNAPSHOT_CORRUPTED',
  POINTER_WRITE_FAILED: 'POINTER_WRITE_FAILED',
} as const;

export type RecoveryErrorCode = (typeof RecoveryErrorCodes)[keyof typeof RecoveryErrorCodes];

export class RecoveryError extends Error {
  public readonly code: RecoveryErrorCode;

  constructor(code: RecoveryErrorCode, message: string) {
    super(`[${code}] ${message}`);
    this.name = 'RecoveryError';
    this.code = code;
    Object.setPrototypeOf(this, RecoveryError.prototype);
  }
}
