import { Capacitor } from '@capacitor/core';
declare const __XANDEFLIX_WEB_VALIDATION__: boolean;
export const webValidationBuild = typeof __XANDEFLIX_WEB_VALIDATION__ !== 'undefined' && __XANDEFLIX_WEB_VALIDATION__;
export const isWebValidation = () => webValidationBuild && !Capacitor.isNativePlatform();
export function requireSecureWebContext(): void {
  if (!globalThis.isSecureContext || !globalThis.crypto?.subtle || !globalThis.indexedDB) throw new Error('WEB_SECURE_CONTEXT_REQUIRED');
}
