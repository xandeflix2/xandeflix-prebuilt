import type { LocalCatalogStorage } from '../../bootstrap/storage/storage.interface.ts';
import { getClientBootstrapService } from '../../bootstrap/client.ts';
import { AuthorizedSourceResolver } from '../../control-plane/client/authorized-source-resolver.ts';
import { getBootSyncCoordinator } from '../../bootstrap/boot-sync-coordinator.ts';
import { canRefreshCatalog } from '../../bootstrap/automatic-source-refresh.ts';
import { defaultPlaybackService } from '../../playback/playback.service.ts';
import { GoogleCast, hasGoogleCast } from '../../playback/google-cast.ts';

export interface SourceIdentity { id: string; version: number }
export interface ActiveSourceStatus {
  local?: SourceIdentity; bound?: SourceIdentity; importedAt?: string;
  localState: 'ready' | 'absent' | 'unconfirmed';
  bindingState: 'ready' | 'unavailable' | 'unauthorized' | 'unbound';
  comparison: 'same' | 'changed' | 'unknown';
}
function identity(id: unknown, version: unknown): SourceIdentity | undefined {
  return typeof id === 'string' && /^(?:src|csrc)_[a-z0-9]{1,64}$/.test(id)
    && Number.isSafeInteger(version) && Number(version) > 0 ? { id, version: Number(version) } : undefined;
}
const same = (a?: SourceIdentity, b?: SourceIdentity) => Boolean(a && b && a.id === b.id && a.version === b.version);

/** Only provenance metadata is returned; never source config, credentials or free-form errors. */
export async function readActiveSourceStatus(deps: {
  storage: Pick<LocalCatalogStorage, 'readActivePointer' | 'readActiveManifest'>;
  resolve: () => Promise<{ status: string; sourceId?: string; sourceVersion?: number; sourceStatus?: string; remoteResultCode?: string }>;
} = { storage: getClientBootstrapService().getStorage(), resolve: () => AuthorizedSourceResolver.resolve() }): Promise<ActiveSourceStatus> {
  const result: ActiveSourceStatus = { localState: 'unconfirmed', bindingState: 'unavailable', comparison: 'unknown' };
  await Promise.all([
    (async () => {
      try {
        const first = await deps.storage.readActivePointer();
        if (!first) { result.localState = 'absent'; return; }
        const manifest = await deps.storage.readActiveManifest(), last = await deps.storage.readActivePointer();
        const local = identity(first.sourceId, first.sourceVersion), metadata = manifest?.metadata;
        if (first.kind !== 'REAL' || last?.snapshotId !== first.snapshotId || manifest?.snapshotId !== first.snapshotId
            || metadata?.kind !== 'REAL' || !same(local, identity(last.sourceId, last.sourceVersion))
            || !same(local, identity(metadata.sourceId, metadata.sourceVersion))) return;
        result.local = local; result.localState = 'ready';
        if (typeof first.promotedAt === 'string' && Number.isFinite(Date.parse(first.promotedAt))) result.importedAt = new Date(first.promotedAt).toISOString();
      } catch { /* Keep an explicit unconfirmed state. */ }
    })(),
    (async () => {
      try {
        const remote = await deps.resolve();
        if (remote.remoteResultCode === 'REMOTE_AUTHORITY_UNAVAILABLE') return;
        if (remote.status === 'SOURCE_NOT_BOUND' || remote.sourceStatus === 'DISABLED') { result.bindingState = 'unbound'; return; }
        if (['DEVICE_NOT_AUTHORIZED', 'DEVICE_REVOKED', 'LICENSE_INVALID'].includes(remote.status)) { result.bindingState = 'unauthorized'; return; }
        const bound = identity(remote.sourceId, remote.sourceVersion);
        if (remote.status === 'SOURCE_READY' && remote.sourceStatus === 'ACTIVE' && bound) { result.bound = bound; result.bindingState = 'ready'; }
      } catch { /* Network failures do not attest current authorization. */ }
    })(),
  ]);
  if (result.local && result.bound) result.comparison = same(result.local, result.bound) ? 'same' : 'changed';
  return result;
}

export async function canUpdateSourceCatalog(): Promise<boolean> {
  const safe = () => Boolean(document.querySelector('.settings-page')) && canRefreshCatalog({ visible: document.visibilityState === 'visible', online: navigator.onLine !== false,
    view: 'settings', playbackState: defaultPlaybackService.getCurrentSession().state,
    modalOpen: Boolean(document.querySelector('[data-detail-modal], .parental-dialog[open]')) });
  if (!safe()) return false;
  try { if (hasGoogleCast() && (await GoogleCast.status()).active) return false; } catch { return false; }
  return safe();
}
export async function updateSourceCatalog(deps = { canRun: canUpdateSourceCatalog,
  sync: (canPromote: () => boolean) => getBootSyncCoordinator().coordinateBootSync({ checkContent: true, canPromote })
}): Promise<'updated' | 'unchanged' | 'deferred' | 'failed'> {
  let listener: { remove: () => Promise<void> } | undefined, casting = false;
  try {
    if (!await deps.canRun()) return 'deferred';
    if (hasGoogleCast()) {
      listener = await GoogleCast.addListener('state', state => { casting = state.active; });
      casting = (await GoogleCast.status()).active;
      if (casting) return 'deferred';
    }
    const canPromote = () => !casting && Boolean(document.querySelector('.settings-page')) && document.visibilityState === 'visible' && navigator.onLine !== false
      && !document.querySelector('[data-detail-modal], .parental-dialog[open]')
      && !['RESOLVING','READY_TO_START','OPENING_NATIVE_PLAYER','BUFFERING','PLAYING','PAUSED'].includes(defaultPlaybackService.getCurrentSession().state);
    const result = await deps.sync(canPromote);
    return result.outcome === 'PROMOTED' ? 'updated' : result.outcome === 'NO_OP' ? 'unchanged'
      : result.outcome === 'LOCAL_FIRST_ACTIVE_PRESERVED' ? 'deferred' : 'failed';
  } catch { return 'failed'; }
  finally { await listener?.remove().catch(() => {}); }
}
