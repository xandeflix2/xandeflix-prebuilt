import { Capacitor, registerPlugin } from '@capacitor/core';
import type { ParentalStorage } from './parental-control.store.ts';
const native = registerPlugin<{ read(): Promise<{ value: string | null }>; write(options: { value: string }): Promise<void> }>('LocalParentalControl');
const key = 'xandeflix.parental.v1';
export const parentalStorage: ParentalStorage = {
  async read() {
    if (Capacitor.getPlatform() === 'android') return (await native.read()).value;
    return localStorage.getItem(key);
  },
  async write(value) {
    if (value.length > 65536) throw new Error('PARENTAL_STORAGE_INVALID');
    if (Capacitor.getPlatform() === 'android') await native.write({ value });
    else localStorage.setItem(key, value);
  },
};
