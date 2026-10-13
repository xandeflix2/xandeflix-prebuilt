import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core';
import { getSupabaseRuntimeConfig } from '../integrations/supabase/runtime-config.ts';
export interface UpdateReady { ready: boolean; versionCode?: number; versionName?: string; notes?: string }
export interface NativeUpdates {
  addListener(event: 'opening', listener: (status: UpdateReady) => void): Promise<PluginListenerHandle>;
  configure(options: { url: string; key: string }): Promise<void>;
  check(): Promise<void>;
  checkNow(): Promise<UpdateReady & { result: string }>;
  status(): Promise<UpdateReady>;
  install(): Promise<{ permissionRequired: boolean }>;
}
export const nativeUpdates = registerPlugin<NativeUpdates>('AppUpdates');
export function nativeUpdateAvailable(): boolean { return Capacitor.getPlatform() === 'android' && Capacitor.isPluginAvailable('AppUpdates'); }
export async function initializeNativeUpdates(): Promise<void> {
  const config = getSupabaseRuntimeConfig();
  if (!config || !nativeUpdateAvailable()) return;
  await nativeUpdates.configure(config);
  void nativeUpdates.check().catch(() => undefined);
}
