import { isWebValidation } from './validation.ts';

export type WebSourceConnection = 'NOT_OBSERVED' | 'HTTP_IN_HTTPS_BLOCKED';
let connection: WebSourceConnection = 'NOT_OBSERVED';
const listeners = new Set<() => void>();
let refresh = { outcome: 'NOT_OBSERVED', hadError: false, blocker: 'NOT_OBSERVED', errorCode: 'NONE' };
export const getWebCatalogRefresh = () => ({ ...refresh });
export function observeWebCatalogRefresh(outcome: string, error: unknown): void {
  if (!isWebValidation()) return;
  const allowed = ['PROMOTED', 'NO_OP', 'LOCAL_FIRST_ACTIVE_PRESERVED', 'DELIVERY_FAILED', 'STAGING_FAILED', 'PROMOTION_FAILED', 'DEVICE_NOT_AUTHORIZED', 'SOURCE_NOT_BOUND', 'LICENSE_INVALID'];
  const codes = ['REMOTE_AUTHORIZATION_UNAVAILABLE', 'REMOTE_METADATA_INVALID', 'LOCAL_SOURCE_CONFIG_INVALID', 'REAL_SOURCE_FETCH_FAILED', 'LOCAL_CATALOG_BUILD_FAILED', 'LOCAL_CATALOG_IMPORT_FAILED', 'SOURCE_MODE_NOT_MANAGED', 'SOURCE_AUTHORITY_NOT_READY', 'SOURCE_CONFIG_NOT_FOUND', 'SOURCE_CONFIG_MISMATCH', 'SOURCE_CONFIG_INVALID', 'SOURCE_PROCESSING_FAILED', 'PACKAGE_BUILD_FAILED', 'STAGING_FAILED'];
  refresh = { outcome: allowed.includes(outcome) ? outcome : 'FAILED', hadError: Boolean(error), blocker: 'NONE',
    errorCode: typeof error === 'string' && codes.includes(error) ? error : error ? 'REPORTED_FAILURE' : 'NONE' };
}
export function observeWebRefreshBlocker(blocker: string): void {
  if (!isWebValidation()) return;
  const allowed = ['NOT_SETTINGS', 'HIDDEN', 'OFFLINE', 'MODAL_OPEN', 'PLAYBACK_ACTIVE', 'CAST_ACTIVE', 'CAST_UNAVAILABLE', 'GUARD_REJECTED'];
  refresh = { outcome: 'BLOCKED_BEFORE_SYNC', hadError: false, blocker: allowed.includes(blocker) ? blocker : 'GUARD_REJECTED', errorCode: 'NONE' };
}
const emptySnapshot = (): WebSourceConnection => 'NOT_OBSERVED';
export const getWebSourceConnection = (): WebSourceConnection => isWebValidation() ? connection : emptySnapshot();
export const getEmptyWebSourceConnection = emptySnapshot;

function publish(next: WebSourceConnection): void {
  if (!isWebValidation() || next === connection) return;
  connection = next;
  for (const listener of listeners) {
    try { listener(); } catch { /* Diagnostics must not affect the original request. */ }
  }
}

export function subscribeWebSourceConnection(listener: () => void): () => void {
  if (!isWebValidation()) return () => {};
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function resetWebSourceConnection(): void { publish('NOT_OBSERVED'); }

/** Observe a rejected fetch only; never retain addresses, errors or credentials. */
export function observeWebSourceFailure(url: URL, error: unknown): boolean {
  if (!isWebValidation() || location.protocol !== 'https:' || url.protocol !== 'http:'
    || (error instanceof DOMException && error.name === 'AbortError')) return false;
  const host = url.hostname;
  // Browsers treat loopback origins as potentially trustworthy.
  if (host === 'localhost' || host.endsWith('.localhost') || host === '[::1]'
    || /^127\.\d+\.\d+\.\d+$/.test(host)) return false;
  publish('HTTP_IN_HTTPS_BLOCKED');
  return true;
}
