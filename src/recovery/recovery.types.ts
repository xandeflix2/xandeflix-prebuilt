/**
 * Xandeflix Prebuilt — Recovery Types (Gate G10)
 *
 * Definições canônicas de tipos para o sistema de integridade e recuperação last-known-good.
 */

export interface RecoveryJournalData {
  journalFormatVersion: 1;
  activeSnapshotId: string | null;
  previousSnapshotId: string | null;
  lastKnownGoodSnapshotId: string | null;
  updatedAt: string;
}

export type RecoveryState =
  | 'ACTIVE_READY'
  | 'RECOVERY_SUCCEEDED'
  | 'NO_VALID_LOCAL_SNAPSHOT';

export interface SnapshotIntegrityResult {
  valid: boolean;
  snapshotId: string;
  catalogVersion?: string;
  hasSearchIndex: boolean;
  errors: string[];
}

export interface RecoveryMetrics {
  scanMs: number;
  recoveryMs: number;
  totalMs: number;
}

export interface RecoveryResult {
  status: RecoveryState;
  activeSnapshotId: string | null;
  recoveredSnapshotId?: string | null;
  errors: string[];
  metrics: RecoveryMetrics;
}
