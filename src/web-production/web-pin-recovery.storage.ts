import { parseRecoveryEnvelope, rewrapRecoveryEnvelope, type RecoveryEnvelope } from './web-pin-recovery.crypto.ts';
const key = 'xandeflix.web-pin-recovery.v1';
let queue: Promise<unknown> = Promise.resolve();
export function withRecoveryLock<T>(run: () => Promise<T>): Promise<T> {
  const task = queue.then(run, run); queue = task.catch(() => {}); return task;
}
export function readRecoveryEnvelope(): RecoveryEnvelope | null {
  const value = localStorage.getItem(key);
  return value === null ? null : parseRecoveryEnvelope(value);
}
export function writeRecoveryEnvelope(envelope: RecoveryEnvelope): void {
  const value = JSON.stringify(parseRecoveryEnvelope(JSON.stringify(envelope)));
  localStorage.setItem(key, value);
  if (localStorage.getItem(key) !== value) throw new Error('WEB_PIN_RECOVERY_STORAGE_FAILED');
}
/** Local-only transaction participant. Never calls network or grants parental access. */
export function prepareRecoveryPukChange(current: string, next: string): Promise<() => Promise<void>> {
  return withRecoveryLock(async () => {
    const envelope = readRecoveryEnvelope();
    if (!envelope) return async () => {};
    const replacement = await rewrapRecoveryEnvelope(envelope, current, next);
    try { writeRecoveryEnvelope(replacement); }
    catch (error) { writeRecoveryEnvelope(envelope); throw error; }
    return async () => { await withRecoveryLock(async () => { writeRecoveryEnvelope(envelope); }); };
  });
}
