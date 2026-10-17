import { Capacitor, registerPlugin } from '@capacitor/core';
import type { ParentalStorage } from './parental-control.store.ts';
import { validParentalClock, type ParentalClock } from './parental-clock.ts';
const native = registerPlugin<{ read(): Promise<{ value: string | null }>; write(options: { value: string }): Promise<void>; elapsedClock(): Promise<ParentalClock> }>('LocalParentalControl');
let webClockId: string | undefined;
export async function readParentalClock(): Promise<ParentalClock> {
  if (Capacitor.getPlatform() === 'android') {
    const clock = await native.elapsedClock();
    if (!validParentalClock(clock)) throw new Error('PARENTAL_CLOCK_UNAVAILABLE');
    return clock;
  }
  if (!webClockId) webClockId = 'web:' + [...crypto.getRandomValues(new Uint8Array(16))].map(n => n.toString(16).padStart(2, '0')).join('');
  const clock = { clockId: webClockId, elapsedMs: Math.floor(performance.now()) };
  if (!validParentalClock(clock)) throw new Error('PARENTAL_CLOCK_UNAVAILABLE');
  return clock;
}
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
