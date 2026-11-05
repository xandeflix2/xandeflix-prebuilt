/** Device-local source activation lifecycle. No URL, credential or backend access. */
export const SOURCE_REPLACEMENT_KEY = '__xandeflix_source_replacement_v1__';
export const SOURCE_METADATA_KEYS = [
  'xandeflix:public-tmdb-metadata:v2',
  'xandeflix:public-watch-providers:br:v1',
  'xandeflix:public-startup-trends:v1',
  '__xandeflix_source_content_v1__',
  '__xandeflix_source_refresh_clock_v1__',
] as const;
export const SOURCE_PRESENTATION_DATABASES = [
  'xandeflix-category-previews-v1',
  'xandeflix-local-home-hero-v2',
  'xandeflix-local-new-content-v1',
] as const;

/** Run after the old runtime closes, before importing the replacement catalog. */
export async function clearSourcePresentationDatabases(factory?: Pick<IDBFactory, 'deleteDatabase'>): Promise<void> {
  const db = factory || (typeof indexedDB === 'undefined' ? undefined : indexedDB);
  if (!db) return; // This runtime cannot read persisted IndexedDB caches either.
  for (const name of SOURCE_PRESENTATION_DATABASES) {
    await new Promise<void>((resolve, reject) => {
      const request = db.deleteDatabase(name);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(Error('SOURCE_PRESENTATION_CLEANUP_FAILED'));
      request.onblocked = () => reject(Error('SOURCE_PRESENTATION_CLEANUP_BLOCKED'));
    });
  }
}

export interface SourceBinding {
  sourceId: string;
  sourceVersion: number;
  protocol: 'M3U' | 'XTREAM';
}
export interface SourcePointer {
  kind?: string;
  sourceId?: string;
  sourceVersion?: number;
  snapshotId?: string;
}
export type SourceCatalogReadiness = {
  state: 'CHECKING' | 'READY' | 'REPLACING' | 'BLOCKED' | 'LOCAL_UNCONFIRMED';
  sourceId?: string;
  sourceVersion?: number;
  snapshotId?: string;
};
type Port = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
type ReplacementState = {
  schema: 1;
  target: SourceBinding;
  epoch: string;
  phase: 'PREPARED' | 'CLEANED' | 'ACTIVE';
  snapshotId?: string;
};
export type SourceReplacementPlan = {
  kind: 'UNCHANGED' | 'RELOAD_REQUIRED' | 'FRESH_IMPORT';
  epoch: string;
};
const opaque = (v: unknown): v is string => typeof v === 'string' && /^[A-Za-z0-9_-]{1,256}$/.test(v);
const epochValid = (v: unknown): v is string => typeof v === 'string' && /^s_[A-Za-z0-9_-]{8,80}$/.test(v);
function validBinding(value: unknown): value is SourceBinding {
  const b = value as SourceBinding | undefined;
  return !!b && opaque(b.sourceId) && Number.isSafeInteger(b.sourceVersion) && b.sourceVersion > 0
    && (b.protocol === 'M3U' || b.protocol === 'XTREAM');
}
const same = (a: SourceBinding, b: SourceBinding) => a.sourceId === b.sourceId
  && a.sourceVersion === b.sourceVersion && a.protocol === b.protocol;
const pointerMatches = (p: SourcePointer | null | undefined, b: SourceBinding) => p?.kind === 'REAL'
  && p.sourceId === b.sourceId && p.sourceVersion === b.sourceVersion && opaque(p.snapshotId);
function parse(raw: string | null): ReplacementState | null {
  if (raw === null) return null;
  if (raw.length > 2048) throw Error('SOURCE_REPLACEMENT_STATE_INVALID');
  let s: ReplacementState;
  try { s = JSON.parse(raw); } catch { throw Error('SOURCE_REPLACEMENT_STATE_INVALID'); }
  if (!s || s.schema !== 1 || !validBinding(s.target) || !epochValid(s.epoch)
      || !['PREPARED', 'CLEANED', 'ACTIVE'].includes(s.phase)
      || s.snapshotId !== undefined && !opaque(s.snapshotId)
      || s.phase === 'ACTIVE' && !opaque(s.snapshotId)
      || Object.keys(s).some(k => !['schema', 'target', 'epoch', 'phase', 'snapshotId'].includes(k))
      || Object.keys(s.target).some(k => !['sourceId', 'sourceVersion', 'protocol'].includes(k))) {
    throw Error('SOURCE_REPLACEMENT_STATE_INVALID');
  }
  return s;
}
function newEpoch(): string {
  // An activation namespace, never an authentication key or derived source identifier.
  const random = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID().replaceAll('-', '') : Date.now().toString(36) + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  return 's_' + random;
}

export class SourceReplacementLifecycle {
  private readonly storage: Port;
  private readonly reloadRuntime: boolean;
  private readonly createEpoch: () => string;
  private readonly runtimeEpoch?: string;
  constructor(storage: Port, reloadRuntime = true, createEpoch: () => string = newEpoch) {
    this.storage = storage; this.reloadRuntime = reloadRuntime; this.createEpoch = createEpoch;
    try { this.runtimeEpoch = parse(storage.getItem(SOURCE_REPLACEMENT_KEY))?.epoch; } catch { /* Repair only after authorization. */ }
  }

  private read(): ReplacementState | null { return parse(this.storage.getItem(SOURCE_REPLACEMENT_KEY)); }
  private write(state: ReplacementState): void {
    const raw = JSON.stringify(state);
    this.storage.setItem(SOURCE_REPLACEMENT_KEY, raw);
    if (this.storage.getItem(SOURCE_REPLACEMENT_KEY) !== raw) throw Error('SOURCE_REPLACEMENT_WRITE_FAILED');
  }
  pending(): boolean {
    try { const state = this.read(); return !!state && state.phase !== 'ACTIVE'; }
    catch { return true; }
  }
  verified(pointer: SourcePointer | null): boolean {
    try { const s = this.read(); return !!s && s.phase === 'ACTIVE' && pointerMatches(pointer, s.target) && pointer?.snapshotId === s.snapshotId; }
    catch { return false; }
  }

  /** Call only after successful remote source and commercial authorization. */
  prepare(binding: SourceBinding, pointer: SourcePointer | null): SourceReplacementPlan {
    if (!validBinding(binding)) throw Error('SOURCE_REPLACEMENT_BINDING_INVALID');
    let previous: ReplacementState | null = null;
    try { previous = this.read(); } catch { /* Replace invalid metadata after authorization. */ }
    if (previous && same(previous.target, binding)) {
      if (previous.phase === 'ACTIVE' && pointerMatches(pointer, binding) && pointer?.snapshotId === previous.snapshotId) return { kind: 'UNCHANGED', epoch: previous.epoch };
      if (previous.phase === 'CLEANED') return { kind: this.reloadRuntime && previous.epoch !== this.runtimeEpoch
        ? 'RELOAD_REQUIRED' : 'FRESH_IMPORT', epoch: previous.epoch };
    }
    const continuing = previous?.phase === 'PREPARED' && same(previous.target, binding);
    const epoch = continuing ? previous!.epoch : this.createEpoch();
    if (!epochValid(epoch) || !continuing && epoch === previous?.epoch) throw Error('SOURCE_REPLACEMENT_EPOCH_INVALID');
    const state: ReplacementState = { schema: 1, target: { ...binding }, epoch, phase: 'PREPARED' };
    this.write(state);
    for (const key of SOURCE_METADATA_KEYS) {
      this.storage.removeItem(key);
      if (this.storage.getItem(key) !== null) throw Error('SOURCE_METADATA_CLEANUP_FAILED');
    }
    this.write({ ...state, phase: 'CLEANED' });
    // Even first activation restarts once so all singleton cache scopes are identical.
    return { kind: this.reloadRuntime ? 'RELOAD_REQUIRED' : 'FRESH_IMPORT', epoch };
  }

  complete(binding: SourceBinding, pointer: SourcePointer, expectedEpoch: string): void {
    const s = this.read();
    if (!s || s.epoch !== expectedEpoch || !validBinding(binding) || !same(s.target, binding) || s.phase === 'PREPARED'
        || !pointerMatches(pointer, binding)) throw Error('SOURCE_REPLACEMENT_COMMIT_MISMATCH');
    this.write({ ...s, phase: 'ACTIVE', snapshotId: pointer.snapshotId });
  }
}

/** Last synchronous step before reload: discard any late writes from the closing runtime. */
export function finishSourceRestart(storage: Port, reload: () => void): void {
  const state = parse(storage.getItem(SOURCE_REPLACEMENT_KEY));
  if (state?.phase !== 'CLEANED') throw Error('SOURCE_RESTART_NOT_PREPARED');
  for (const key of SOURCE_METADATA_KEYS) {
    storage.removeItem(key);
    if (storage.getItem(key) !== null) throw Error('SOURCE_METADATA_CLEANUP_FAILED');
  }
  reload();
}

export function createBrowserSourceReplacement(): SourceReplacementLifecycle | undefined {
  if (typeof window === 'undefined' || typeof document === 'undefined') return undefined;
  // A denied browser store is an error, not permission to reuse another source.
  const port: Port = {
    getItem: key => window.localStorage.getItem(key),
    setItem: (key, value) => window.localStorage.setItem(key, value),
    removeItem: key => window.localStorage.removeItem(key),
  };
  return new SourceReplacementLifecycle(port);
}
export function getSourceCacheScope(): string {
  if (typeof window === 'undefined') return 'legacy';
  try { return parse(window.localStorage.getItem(SOURCE_REPLACEMENT_KEY))?.epoch || 'legacy'; }
  catch { return 'unverified'; }
}
/** Retain personal records in their previous namespace, without automatic rebinding. */
export function sourceScopedStorageKey(base: string): string {
  const scope = getSourceCacheScope();
  return scope === 'legacy' ? base : `${base}:scope:${scope}`;
}
export function canUseSourceCatalog(readiness: SourceCatalogReadiness, pointer: SourcePointer | null | undefined): boolean {
  return (readiness.state === 'READY' || readiness.state === 'LOCAL_UNCONFIRMED')
    && pointer?.kind === 'REAL' && !!readiness.snapshotId && pointer.snapshotId === readiness.snapshotId
    && pointer.sourceId === readiness.sourceId && pointer.sourceVersion === readiness.sourceVersion;
}
