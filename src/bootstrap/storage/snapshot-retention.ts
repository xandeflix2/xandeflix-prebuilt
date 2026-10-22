import { isValidActivePointer } from '../active-snapshot.ts';
import type { ActivePointer } from '../types.ts';
import type { RecoveryJournalData } from '../../recovery/recovery.types.ts';

/** Shared by all filesystem-storage instances in this app runtime. */
export class SnapshotOperationQueue {
  private tail: Promise<unknown> = Promise.resolve();
  run<T>(work: () => Promise<T>): Promise<T> {
    const result = this.tail.then(work);
    this.tail = result.catch(() => {});
    return result;
  }
}

export const snapshotOperations = new SnapshotOperationQueue();
export const isSafeSnapshotId = (value: unknown): value is string =>
  typeof value === 'string' && /^[A-Za-z0-9_-]{1,160}$/.test(value);

type RetentionState = { pointer: ActivePointer | null; journal: RecoveryJournalData | null };
export interface SnapshotRetentionIO {
  exclusive<T>(work: () => Promise<T>): Promise<T>;
  state(): Promise<RetentionState>;
  list(): Promise<Array<{ name: string; type: string }>>;
  validateKept(id: string): Promise<boolean>;
  remove(id: string): Promise<void>;
}
export interface SnapshotRetentionResult {
  status: 'COMPLETE' | 'DEFERRED';
  removed: number;
  preserved: number;
}

function protection(state: RetentionState): string[] | null {
  const { pointer: p, journal: j } = state;
  if (!isValidActivePointer(p) || p.kind !== 'REAL' || !isSafeSnapshotId(p.snapshotId) ||
      !j || j.journalFormatVersion !== 1 || j.activeSnapshotId !== p.snapshotId ||
      !isSafeSnapshotId(j.previousSnapshotId) || !isSafeSnapshotId(j.lastKnownGoodSnapshotId) ||
      typeof j.updatedAt !== 'string' || !Number.isFinite(Date.parse(j.updatedAt))) return null;
  const ids = [...new Set([p.snapshotId, j.previousSnapshotId, j.lastKnownGoodSnapshotId])];
  return ids.length >= 2 ? ids : null;
}

/** Only unreferenced permanent generations; never clears general app data. */
export async function collectObsoleteSnapshots(io: SnapshotRetentionIO): Promise<SnapshotRetentionResult> {
  const result: SnapshotRetentionResult = { status: 'DEFERRED', removed: 0, preserved: 0 };
  try {
    const plan = await io.exclusive(async () => {
      const state = await io.state(), keep = protection(state);
      if (!keep) return null;
      const entries = await io.list();
      if (entries.length > 1024 || entries.some(e => !isSafeSnapshotId(e.name) || e.type !== 'directory') ||
          new Set(entries.map(e => e.name)).size !== entries.length ||
          keep.some(id => !entries.some(e => e.name === id))) return null;
      result.preserved = keep.length;
      const candidates = entries.filter(e => !keep.includes(e.name)).map(e => e.name);
      return { fingerprint: JSON.stringify(state), candidates, keep };
    });
    if (!plan) return result;
    // Proof may read large immutable generations. Do not hold the operation
    // queue throughout it: the adapter queues each bounded read separately.
    if (plan.candidates.length) for (const id of plan.keep) if (!await io.validateKept(id)) return result;
    for (const id of plan.candidates) {
      const removed = await io.exclusive(async () => {
        const current = await io.state(), keep = protection(current);
        if (!keep || JSON.stringify(current) !== plan.fingerprint || keep.includes(id)) return false;
        await io.remove(id);
        return true;
      });
      if (!removed) return result;
      result.removed++;
      await new Promise<void>(resolve => setTimeout(resolve, 0));
    }
    result.status = 'COMPLETE';
  } catch { /* Coded aggregate only; never leak a filesystem/source exception. */ }
  return result;
}
