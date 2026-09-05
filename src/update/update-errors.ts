/**
 * Xandeflix Prebuilt — Incremental Update Errors (Gate G9)
 *
 * Classes de erro categorizadas e sanitizadas para o ciclo de atualização incremental.
 */

export type UpdateErrorKind =
  | 'BASE_MISMATCH'
  | 'PROFILE_MISMATCH'
  | 'DOWNGRADE_REJECTED'
  | 'DELTA_PACKAGE_CORRUPTED'
  | 'DELTA_VALIDATION_FAILED'
  | 'TARGET_VALIDATION_FAILED'
  | 'STAGING_WRITE_FAILED'
  | 'STAGING_READBACK_FAILED'
  | 'PROMOTION_FAILED'
  | 'NO_ACTIVE_CATALOG';

export class IncrementalUpdateError extends Error {
  readonly kind: UpdateErrorKind;
  readonly fullPackageRequired: boolean;

  constructor(kind: UpdateErrorKind, message: string, fullPackageRequired = false) {
    super(`[${kind}] ${message}`);
    this.name = 'IncrementalUpdateError';
    this.kind = kind;
    this.fullPackageRequired = fullPackageRequired;
  }
}

export class BaseMismatchError extends IncrementalUpdateError {
  constructor(message: string) {
    super('BASE_MISMATCH', message, true);
    this.name = 'BaseMismatchError';
  }
}

export class ProfileMismatchError extends IncrementalUpdateError {
  constructor(message: string) {
    super('PROFILE_MISMATCH', message, true);
    this.name = 'ProfileMismatchError';
  }
}

export class DowngradeError extends IncrementalUpdateError {
  constructor(message: string) {
    super('DOWNGRADE_REJECTED', message, false);
    this.name = 'DowngradeError';
  }
}
