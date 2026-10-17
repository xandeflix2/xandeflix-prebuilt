/** Device-local bookkeeping only: never a source configuration or authority. */
export const SOURCE_REFRESH_INTERVAL_MS = 15 * 60 * 1000;
export const SOURCE_REFRESH_RETRY_MS = 60 * 1000;
const CONTENT_KEY = '__xandeflix_source_content_v1__';
const CLOCK_KEY = '__xandeflix_source_refresh_clock_v1__';

export function canRefreshCatalog(input: { visible: boolean; online: boolean; view: string; playbackState: string; modalOpen: boolean }): boolean {
  return input.visible && input.online && !input.modalOpen &&
    !['live', 'adult', 'movie-detail', 'series-detail', 'manager-panel', 'portal'].includes(input.view) &&
    !['RESOLVING', 'READY_TO_START', 'OPENING_NATIVE_PLAYER', 'BUFFERING', 'PLAYING', 'PAUSED'].includes(input.playbackState);
}

export interface SourceContentCheckpoint {
  sourceId: string;
  sourceVersion: number;
  snapshotId: string;
  contentDigest: string;
}

export interface SourceContentRepository {
  read(): SourceContentCheckpoint | null;
  write(checkpoint: SourceContentCheckpoint): void;
}

function browserStorage(): Storage | undefined {
  try { return typeof window === 'undefined' ? undefined : window.localStorage; } catch { return undefined; }
}

export function isContentDigest(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
}

export const localSourceContentRepository: SourceContentRepository = {
  read() {
    try {
      const raw = browserStorage()?.getItem(CONTENT_KEY);
      if (!raw || raw.length > 2048) return null;
      const value = JSON.parse(raw);
      return typeof value.sourceId === 'string' && value.sourceId.length <= 256 &&
        typeof value.snapshotId === 'string' && value.snapshotId.length <= 256 &&
        Number.isSafeInteger(value.sourceVersion) && isContentDigest(value.contentDigest) ? value : null;
    } catch { return null; }
  },
  write(value) {
    if (!isContentDigest(value.contentDigest)) return;
    try { browserStorage()?.setItem(CONTENT_KEY, JSON.stringify(value)); } catch { /* Optional cache. */ }
  },
};

export interface RefreshClock { attemptedAt: number; succeededAt: number }
export function readRefreshClock(now = Date.now()): RefreshClock {
  try {
    const raw = browserStorage()?.getItem(CLOCK_KEY);
    const value = raw && raw.length < 256 ? JSON.parse(raw) : {};
    const valid = (n: unknown): number => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= now ? n : 0;
    return { attemptedAt: valid(value.attemptedAt), succeededAt: valid(value.succeededAt) };
  } catch { return { attemptedAt: 0, succeededAt: 0 }; }
}

export function writeRefreshClock(clock: RefreshClock): void {
  try { browserStorage()?.setItem(CLOCK_KEY, JSON.stringify(clock)); } catch { /* In-memory clock still applies. */ }
}

/** One foreground scheduler; completion controls cooldown, failures only backoff. */
export class AutomaticSourceRefresh {
  private running = false;
  private stopped = false;
  private clock: RefreshClock;
  private readonly deps: {
    check: () => Promise<{ outcome: string }>;
    canRun: () => boolean | Promise<boolean>;
    now?: () => number;
    readClock?: () => RefreshClock;
    saveClock?: (clock: RefreshClock) => void;
  };

  constructor(deps: AutomaticSourceRefresh['deps']) {
    this.deps = deps;
    this.clock = deps.readClock?.() || readRefreshClock(this.now());
  }

  private now(): number { return this.deps.now?.() ?? Date.now(); }
  stop(): void { this.stopped = true; }
  recordSuccessfulCheck(): void {
    this.clock.succeededAt = this.now();
    this.save();
  }

  async tick(): Promise<void> {
    if (this.stopped || this.running) return;
    const now = this.now();
    if (this.clock.attemptedAt > now || this.clock.succeededAt > now) this.clock = { attemptedAt: 0, succeededAt: 0 };
    if ((this.clock.succeededAt > 0 && now - this.clock.succeededAt < SOURCE_REFRESH_INTERVAL_MS) ||
        (this.clock.attemptedAt > 0 && now - this.clock.attemptedAt < SOURCE_REFRESH_RETRY_MS)) return;
    this.running = true;
    try {
      if (!(await this.deps.canRun()) || this.stopped) return;
      this.clock.attemptedAt = this.now();
      this.save();
      const result = await this.deps.check();
      if (result.outcome === 'PROMOTED' || result.outcome === 'NO_OP') this.clock.succeededAt = this.now();
      else this.clock.attemptedAt = this.now();
      this.save();
    } catch { this.clock.attemptedAt = this.now(); this.save(); }
    finally { this.running = false; }
  }

  private save(): void { (this.deps.saveClock || writeRefreshClock)({ ...this.clock }); }
}
