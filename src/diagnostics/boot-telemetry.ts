/**
 * Xandeflix Prebuilt — Boot Telemetry & Performance Instrumentation (Cycle C11-P5B1)
 *
 * Instrumenta e afere os marcos cronológicos de inicialização do aplicativo:
 * T0_PROCESS_START
 * T1_WEBVIEW_READY
 * T2_REACT_MOUNT
 * T3_IDENTITY_READY
 * T4_AUTHORIZATION_READY
 * T5_HOME_SHELL_VISIBLE
 * T6_NAV_INTERACTIVE
 * T7_SOURCE_RESOLUTION_READY
 * T8_CATALOG_SYNC_STARTED
 * T9_FIRST_REAL_CATALOG_DATA_AVAILABLE
 * T10_FULL_STAGING_COMPLETE
 * T11_PROMOTION_COMPLETE
 */

export type BootMilestone =
  | 'T0_PROCESS_START'
  | 'T1_WEBVIEW_READY'
  | 'T2_REACT_MOUNT'
  | 'T3_IDENTITY_READY'
  | 'T4_AUTHORIZATION_READY'
  | 'T5_HOME_SHELL_VISIBLE'
  | 'T6_NAV_INTERACTIVE'
  | 'T7_SOURCE_RESOLUTION_READY'
  | 'T8_CATALOG_SYNC_STARTED'
  | 'T9_FIRST_REAL_CATALOG_DATA_AVAILABLE'
  | 'T10_FULL_STAGING_COMPLETE'
  | 'T11_PROMOTION_COMPLETE'
  | 'IMPORT_FETCH_STARTED'
  | 'IMPORT_STREAM_PARSE'
  | 'IMPORT_BATCH_PERSISTED'
  | 'IMPORT_STAGING_FINALIZED'
  | 'IMPORT_PROMOTED'
  | 'SEARCH_BUILD_STARTED'
  | 'SEARCH_BUILD_COMPLETED'
  | 'MOVIE_PLAY_REQUESTED'
  | 'MOVIE_CANONICAL_ITEM_RESOLVED'
  | 'MOVIE_STREAMREF_REQUESTED'
  | 'MOVIE_STREAMREF_RESOLVED'
  | 'SERIES_DETAIL_RESOLVED'
  | 'SEASON_RESOLVED'
  | 'EPISODE_SELECTED'
  | 'EPISODE_STREAMREF_REQUESTED'
  | 'EPISODE_STREAMREF_RESOLVED'
  | 'C9_SESSION_STARTED'
  | 'NATIVE_PLAYER_START_REQUESTED'
  | 'NATIVE_PLAYER_STARTED'
  | 'FIRST_FRAME_OR_PLAYER_STATE'
  | 'LIVE_CHANNEL_SELECTED'
  | 'LIVE_STREAMREF_REQUESTED'
  | 'LIVE_STREAMREF_RESOLVED'
  | 'C9_ACQUIRE_REQUESTED'
  | 'C9_ACQUIRED'
  | 'NATIVE_PREVIEW_START_REQUESTED'
  | 'NATIVE_PREVIEW_STARTED'
  | 'NATIVE_PREVIEW_ERROR_STAGE';

export interface BootTimingsReport {
  milestones: Partial<Record<BootMilestone, number>>;
  durations: {
    appShellVisibleMs?: number;
    appInteractiveMs?: number;
    catalogSyncStartedMs?: number;
    firstRealDataMs?: number;
    fullCatalogReadyMs?: number;
    fullCatalogSyncDurationMs?: number;
    maxMainThreadBlockMs: number;
  };
  details: {
    t0ProcessStart?: number;
    t1WebViewReady?: number;
    t2ReactMount?: number;
    t3IdentityReady?: number;
    t4AuthorizationReady?: number;
    t5HomeShellVisible?: number;
    t6NavInteractive?: number;
    t7SourceResolutionReady?: number;
    t8CatalogSyncStarted?: number;
    t9FirstRealCatalogDataAvailable?: number;
    t10FullStagingComplete?: number;
    t11PromotionComplete?: number;
  };
}

class BootTelemetryService {
  private milestones: Map<BootMilestone, number> = new Map();
  private maxMainThreadBlockMs = 0;
  private isMonitoringMainThread = false;

  constructor() {
    this.initT0AndT1();
    this.startMainThreadBlockMonitor();
  }

  private initT0AndT1(): void {
    const t0 = typeof window !== 'undefined' && (window as any).__XANDEFLIX_T0__
      ? (window as any).__XANDEFLIX_T0__
      : typeof performance !== 'undefined'
      ? performance.timeOrigin || performance.now()
      : Date.now();

    this.milestones.set('T0_PROCESS_START', t0);

    const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now();
    this.milestones.set('T1_WEBVIEW_READY', t1);
  }

  mark(milestone: BootMilestone, customTimestamp?: number | Record<string, unknown>, _metadata?: Record<string, unknown>): void {
    const ts = typeof customTimestamp === 'number' ? customTimestamp : undefined;
    const now = ts ?? (typeof performance !== 'undefined' ? performance.now() : Date.now());
    if (!this.milestones.has(milestone)) {
      this.milestones.set(milestone, now);
      const t0 = this.milestones.get('T0_PROCESS_START') || now;
      const elapsedMs = Math.round(now - t0);
      console.log(`[BOOT_TELEMETRY] ${milestone} reached at +${elapsedMs}ms`);
    }
  }

  recordMainThreadBlock(durationMs: number): void {
    if (durationMs > this.maxMainThreadBlockMs) {
      this.maxMainThreadBlockMs = durationMs;
    }
  }

  private startMainThreadBlockMonitor(): void {
    if (this.isMonitoringMainThread || typeof window === 'undefined') return;
    this.isMonitoringMainThread = true;

    let lastCheck = performance.now();
    const interval = 50; // Checa a cada 50ms se a thread principal foi bloqueada

    const monitor = () => {
      const now = performance.now();
      const delta = now - lastCheck - interval;
      if (delta > 15) {
        // Bloco além do jitter normal
        this.recordMainThreadBlock(delta);
      }
      lastCheck = now;
      if (!this.milestones.has('T11_PROMOTION_COMPLETE') || performance.now() < 30000) {
        setTimeout(monitor, interval);
      }
    };

    setTimeout(monitor, interval);
  }

  getMilestone(milestone: BootMilestone): number | undefined {
    return this.milestones.get(milestone);
  }

  getReport(): BootTimingsReport {
    const t0 = this.milestones.get('T0_PROCESS_START') || 0;
    const t5 = this.milestones.get('T5_HOME_SHELL_VISIBLE');
    const t6 = this.milestones.get('T6_NAV_INTERACTIVE');
    const t8 = this.milestones.get('T8_CATALOG_SYNC_STARTED');
    const t9 = this.milestones.get('T9_FIRST_REAL_CATALOG_DATA_AVAILABLE');
    const t11 = this.milestones.get('T11_PROMOTION_COMPLETE');

    const appShellVisibleMs = t5 !== undefined ? Math.round(t5 - t0) : undefined;
    const appInteractiveMs = t6 !== undefined ? Math.round(t6 - t0) : undefined;
    const catalogSyncStartedMs = t8 !== undefined ? Math.round(t8 - t0) : undefined;
    const firstRealDataMs = t9 !== undefined ? Math.round(t9 - t0) : undefined;
    const fullCatalogReadyMs = t11 !== undefined ? Math.round(t11 - t0) : undefined;
    const fullCatalogSyncDurationMs = t11 !== undefined && t8 !== undefined ? Math.round(t11 - t8) : undefined;

    const milestonesObj: Partial<Record<BootMilestone, number>> = {};
    for (const [key, val] of this.milestones.entries()) {
      milestonesObj[key] = val;
    }

    return {
      milestones: milestonesObj,
      durations: {
        appShellVisibleMs,
        appInteractiveMs,
        catalogSyncStartedMs,
        firstRealDataMs,
        fullCatalogReadyMs,
        fullCatalogSyncDurationMs,
        maxMainThreadBlockMs: Math.round(this.maxMainThreadBlockMs),
      },
      details: {
        t0ProcessStart: t0,
        t1WebViewReady: this.milestones.get('T1_WEBVIEW_READY'),
        t2ReactMount: this.milestones.get('T2_REACT_MOUNT'),
        t3IdentityReady: this.milestones.get('T3_IDENTITY_READY'),
        t4AuthorizationReady: this.milestones.get('T4_AUTHORIZATION_READY'),
        t5HomeShellVisible: t5,
        t6NavInteractive: t6,
        t7SourceResolutionReady: this.milestones.get('T7_SOURCE_RESOLUTION_READY'),
        t8CatalogSyncStarted: t8,
        t9FirstRealCatalogDataAvailable: t9,
        t10FullStagingComplete: this.milestones.get('T10_FULL_STAGING_COMPLETE'),
        t11PromotionComplete: t11,
      },
    };
  }

  logSummary(): void {
    const report = this.getReport();
    console.log('==================================================');
    console.log('[BOOT_TELEMETRY_SUMMARY]');
    console.log(`APP_SHELL_VISIBLE_MS=${report.durations.appShellVisibleMs ?? 'N/A'}`);
    console.log(`APP_INTERACTIVE_MS=${report.durations.appInteractiveMs ?? 'N/A'}`);
    console.log(`CATALOG_SYNC_STARTED_MS=${report.durations.catalogSyncStartedMs ?? 'N/A'}`);
    console.log(`FIRST_REAL_DATA_MS=${report.durations.firstRealDataMs ?? 'N/A'}`);
    console.log(`FULL_CATALOG_READY_MS=${report.durations.fullCatalogReadyMs ?? 'N/A'}`);
    console.log(`FULL_CATALOG_SYNC_DURATION_MS=${report.durations.fullCatalogSyncDurationMs ?? 'N/A'}`);
    console.log(`MAX_MAIN_THREAD_BLOCK_MS=${report.durations.maxMainThreadBlockMs}`);
    console.log('==================================================');
  }
}

export const bootTelemetry = new BootTelemetryService();

export async function yieldToEventLoop(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof setTimeout !== 'undefined') {
      setTimeout(resolve, 0);
    } else {
      resolve();
    }
  });
}

if (typeof window !== 'undefined') {
  (window as any).__XANDEFLIX_BOOT_TELEMETRY__ = bootTelemetry;
}


