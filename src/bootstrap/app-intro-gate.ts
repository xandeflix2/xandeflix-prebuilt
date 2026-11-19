import { Capacitor, registerPlugin } from '@capacitor/core';

interface IntroBridge { ready(): Promise<{ reason: string }> }
export interface IntroGateEnvironment {
  native: boolean;
  ready: () => Promise<unknown>;
  setTimer: (callback: () => void, delay: number) => ReturnType<typeof setTimeout>;
  clearTimer: (timer: ReturnType<typeof setTimeout>) => void;
}
export const INTRO_BRIDGE_TIMEOUT_MS = 15000;
/** Single bounded gate; an unavailable native intro never prevents normal boot. */
export function createIntroGate(environment: IntroGateEnvironment): () => Promise<void> {
  let completion: Promise<void> | undefined;
  return () => {
    if (!completion) completion = new Promise<void>(resolve => {
      if (!environment.native) { resolve(); return; }
      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true; environment.clearTimer(timer); resolve();
      };
      const timer = environment.setTimer(finish, INTRO_BRIDGE_TIMEOUT_MS);
      try { Promise.resolve(environment.ready()).then(finish, finish); } catch { finish(); }
    });
    return completion;
  };
}
const bridge = registerPlugin<IntroBridge>('AppIntro');
export const waitForAppIntro = createIntroGate({
  native: Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android',
  ready: () => bridge.ready(), setTimer: (fn, ms) => setTimeout(fn, ms), clearTimer: id => clearTimeout(id),
});
