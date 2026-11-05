import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core';
import { UNKNOWN_NETWORK, nativeNetworkStatus, type NetworkStatus } from './diagnostic-policy.ts';
interface NativeNetworkStatus {
  getStatus(): Promise<unknown>; startWatch(): Promise<unknown>; stopWatch(): Promise<void>;
  addListener(event: 'networkStatusChanged', listener: (value: unknown) => void): Promise<PluginListenerHandle>;
}
const NativeNetwork = registerPlugin<NativeNetworkStatus>('NetworkStatus');
const owners = new Set<(value: NetworkStatus) => void>();
let state = UNKNOWN_NETWORK, handle: PluginListenerHandle | undefined, watching = false, queue = Promise.resolve();
const native = () => Capacitor.isNativePlatform();
const visible = () => typeof document !== 'undefined' && document.visibilityState === 'visible';
function publish(value: NetworkStatus): void { state = value; for (const listener of owners) listener(value); }
function reconcile(): void {
  queue = queue.catch(() => {}).then(async () => {
    if (!native()) { publish({ connected: navigator.onLine !== false, validated: null, captive: false, transport: navigator.onLine === false ? 'none' : 'unknown' }); return; }
    if (!owners.size || !visible()) {
      if (handle) { await handle.remove().catch(() => {}); handle = undefined; }
      if (watching) { watching = false; await NativeNetwork.stopWatch().catch(() => {}); }
      state = UNKNOWN_NETWORK; return;
    }
    if (!Capacitor.isPluginAvailable('NetworkStatus')) { publish(UNKNOWN_NETWORK); return; }
    try {
      if (!watching) {
        handle = await NativeNetwork.addListener('networkStatusChanged', value => { if (owners.size && visible()) publish(nativeNetworkStatus(value)); });
        watching = true;
        const started = await NativeNetwork.startWatch() as { watching?: boolean };
        if (started.watching !== true) throw new Error('NETWORK_WATCH_UNAVAILABLE');
      }
      const value = await NativeNetwork.getStatus(); if (owners.size && visible()) publish(nativeNetworkStatus(value));
    } catch {
      if (handle) { await handle.remove().catch(() => {}); handle = undefined; }
      watching = false; await NativeNetwork.stopWatch().catch(() => {}); publish(UNKNOWN_NETWORK);
    }
  });
}
export function watchNetworkStatus(listener: (value: NetworkStatus) => void): () => void {
  const first = owners.size === 0; owners.add(listener); listener(state);
  if (first) { document.addEventListener('visibilitychange', reconcile); window.addEventListener('online', reconcile); window.addEventListener('offline', reconcile); }
  reconcile();
  return () => {
    owners.delete(listener);
    if (!owners.size) { document.removeEventListener('visibilitychange', reconcile); window.removeEventListener('online', reconcile); window.removeEventListener('offline', reconcile); reconcile(); }
  };
}
/** Capacitor's saved browser fetch preserves streaming and AbortSignal for this public CORS endpoint. */
export function internetTestFetch(): typeof fetch {
  const original = (window as Window & { CapacitorWebFetch?: typeof fetch }).CapacitorWebFetch;
  return (original || window.fetch).bind(window);
}
