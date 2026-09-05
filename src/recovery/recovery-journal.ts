/**
 * Xandeflix Prebuilt — Recovery Journal Manager (Gate G10)
 *
 * Gerenciamento do diário de recuperação (recovery.json) para rastrear gerações
 * ativas e previous known-good com escrita atômica.
 *
 * Princípios:
 * - RECOVERY_BASELINE = ACTIVE_PLUS_PREVIOUS_KNOWN_GOOD
 * - RECOVERY_MINIMUM_GENERATIONS = 2
 * - Sem histórico arbitrário desnecessário.
 */

import type { LocalCatalogStorage } from '../bootstrap/storage/storage.interface.ts';
import type { RecoveryJournalData } from './recovery.types.ts';

export class RecoveryJournalManager {
  private storage: LocalCatalogStorage;

  constructor(storage: LocalCatalogStorage) {
    this.storage = storage;
  }

  async readJournal(): Promise<RecoveryJournalData | null> {
    if (this.storage.readRecoveryJournal) {
      return this.storage.readRecoveryJournal();
    }
    return null;
  }

  async writeJournal(journal: RecoveryJournalData): Promise<void> {
    if (this.storage.writeRecoveryJournal) {
      await this.storage.writeRecoveryJournal(journal);
    }
  }

  async recordPromotion(
    newActiveSnapshotId: string,
    previousSnapshotId?: string | null
  ): Promise<void> {
    const existing = await this.readJournal();
    const journal: RecoveryJournalData = {
      journalFormatVersion: 1,
      activeSnapshotId: newActiveSnapshotId,
      previousSnapshotId: previousSnapshotId ?? existing?.activeSnapshotId ?? null,
      lastKnownGoodSnapshotId: newActiveSnapshotId,
      updatedAt: new Date().toISOString(),
    };
    await this.writeJournal(journal);
  }

  async recordRecovery(
    recoveredSnapshotId: string,
    corruptedActiveId?: string | null
  ): Promise<void> {
    const existing = await this.readJournal();
    const journal: RecoveryJournalData = {
      journalFormatVersion: 1,
      activeSnapshotId: recoveredSnapshotId,
      previousSnapshotId: corruptedActiveId ?? existing?.previousSnapshotId ?? null,
      lastKnownGoodSnapshotId: recoveredSnapshotId,
      updatedAt: new Date().toISOString(),
    };
    await this.writeJournal(journal);
  }
}
