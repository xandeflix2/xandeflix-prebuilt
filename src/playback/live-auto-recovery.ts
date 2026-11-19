/** Local live recovery only. No media requests or authorization are performed here. */
export interface LiveRecoveryState {
  previewId: string;
  requestId: string;
  state: 'IDLE' | 'BUFFERING' | 'READY' | 'ENDED';
  playWhenReady: boolean;
  foreground: boolean;
  suppressed: boolean;
  obscured: boolean;
}
export type LiveRecoveryReason = 'BUFFER_TIMEOUT' | 'MEDIA_ERROR' | 'STREAM_ENDED';
export interface LiveRecoveryClock {
  now(): number;
  schedule(callback: () => void, delay: number): unknown;
  cancel(timer: unknown): void;
}
const clock: LiveRecoveryClock = {
  now: () => performance.now(),
  schedule: (callback, delay) => setTimeout(callback, delay),
  cancel: timer => clearTimeout(timer as ReturnType<typeof setTimeout>),
};

/** One decision per tune; the view ID alone is insufficient because the view is reused. */
export class LiveAutoRecovery {
  private active = true;
  private previewId: string | undefined;
  private eligible = false;
  private bufferedSince: number | undefined;
  private timer: unknown;
  private requestId: string;
  private recover: (reason: LiveRecoveryReason) => void;
  private time: LiveRecoveryClock;

  constructor(requestId: string, recover: (reason: LiveRecoveryReason) => void,
    time: LiveRecoveryClock = clock) {
    this.requestId = requestId; this.recover = recover; this.time = time;
  }

  bind(previewId: string): void {
    if (this.previewId && this.previewId !== previewId) this.cancel();
    else this.previewId = previewId;
  }

  private matches(event: { requestId?: string; previewId?: string }): boolean {
    if (!this.active || event.requestId !== this.requestId || !event.previewId) return false;
    if (this.previewId && this.previewId !== event.previewId) return false;
    this.previewId = event.previewId;
    return true;
  }

  state(event: LiveRecoveryState): void {
    if (!this.matches(event)) return;
    this.eligible = event.playWhenReady === true && event.foreground === true
      && event.suppressed === false && event.obscured === false;
    if (this.eligible && event.state === 'ENDED') { this.fire('STREAM_ENDED'); return; }
    if (!this.eligible || event.state !== 'BUFFERING') { this.clearBuffer(); return; }
    if (this.bufferedSince === undefined) this.bufferedSince = this.time.now();
    if (this.timer === undefined) this.schedule();
  }

  error(event: { requestId?: string; previewId?: string; errorCode?: string }): boolean {
    if (this.matches(event) && this.eligible && event.errorCode === 'LIVE_PREVIEW_PLAYBACK_FAILED') {
      this.fire('MEDIA_ERROR'); return true;
    }
    return false;
  }

  private schedule(): void {
    const remaining = 5001 - (this.time.now() - this.bufferedSince!);
    this.timer = this.time.schedule(() => {
      this.timer = undefined;
      if (!this.active || !this.eligible || this.bufferedSince === undefined) return;
      if (this.time.now() - this.bufferedSince > 5000) this.fire('BUFFER_TIMEOUT');
      else this.schedule();
    }, Math.max(1, remaining));
  }

  private clearBuffer(): void {
    if (this.timer !== undefined) this.time.cancel(this.timer);
    this.timer = undefined;
    this.bufferedSince = undefined;
  }
  private fire(reason: LiveRecoveryReason): void {
    if (!this.active) return;
    this.cancel();
    this.recover(reason);
  }
  cancel(): void { this.active = false; this.clearBuffer(); }
}

/** Handoff cannot select a new channel until the previous native/C9 cleanup settles. */
export async function recoverNextLiveChannel<T>(port: {
  current(): boolean;
  cleanup(): Promise<void>;
  next(): Promise<T | undefined>;
  permitted(channel: T): Promise<boolean>;
  select(channel: T): void;
}): Promise<'SELECTED' | 'CANCELLED' | 'END' | 'BLOCKED'> {
  if (!port.current()) return 'CANCELLED';
  await port.cleanup();
  if (!port.current()) return 'CANCELLED';
  const next = await port.next();
  if (!port.current()) return 'CANCELLED';
  if (!next) return 'END';
  const permitted = await port.permitted(next);
  if (!port.current()) return 'CANCELLED';
  if (!permitted) return 'BLOCKED';
  port.select(next);
  return 'SELECTED';
}
