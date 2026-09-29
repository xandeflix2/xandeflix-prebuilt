import {
  type LargeSourceDownloadChunkResult,
  type LargeSourceDownloadStartResult,
  type LargeSourceTransportPlugin,
  type LargeSourceTransportStage,
} from './large-source-transport.bridge.ts';
import { RealSourceImporterService } from './real-source-importer.service.ts';
import { ManagedSourceStagingOrchestrator } from './managed-source-staging.orchestrator.ts';
import type {
  SanitizedTransportErrorCode,
  SanitizedTransportObservation,
  SanitizedTransportStage,
} from './device-direct-fetch.ts';
import { createSanitizedTransportFailureObservation } from './device-direct-fetch.ts';

const SYNTHETIC_PLAYLIST_URL = 'https://large-source-observability.synthetic.invalid/playlist.m3u';
const SYNTHETIC_SOURCE_ID = 'src_r2f8_observability_fixture';

export const LARGE_SOURCE_TRANSPORT_OBSERVABILITY_LOCK_ID = 'LARGE_SOURCE_TRANSPORT_OBSERVABILITY_LOCK_V1';

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary);
}

export type SyntheticTransportCaseId =
  | 'T01_TIMEOUT'
  | 'T02_HTTP_4XX'
  | 'T03_HTTP_5XX'
  | 'T04_FILE_IO_FAILURE'
  | 'T05_CACHE_SPACE_INSUFFICIENT'
  | 'T06_SOURCE_FILE_LIMIT'
  | 'T07_INVALID_NATIVE_RESPONSE'
  | 'T08_CANCELLED'
  | 'T09_M3U_PARSE_FAILURE'
  | 'T10_UNKNOWN_ERROR'
  | 'SUCCESS_DOWNLOAD_COMPLETE';

interface SyntheticCase {
  id: SyntheticTransportCaseId;
  nativeCode?: string;
  nativeStage: LargeSourceTransportStage;
  httpResponseReceived: 'SIM' | 'NAO';
  httpStatusClass: '2XX' | '4XX' | '5XX' | 'UNKNOWN';
  retryable: boolean;
  parseFailure?: boolean;
  success?: boolean;
}

export interface SanitizedTransportDiagnosticSummary {
  success: boolean;
  stage: SanitizedTransportStage;
  code?: SanitizedTransportErrorCode;
  httpStatusClass: string;
  transportType: 'NATIVE_FILE_BACKED';
  retryable: boolean;
}

export interface LargeSourceTransportDiagnosticResult {
  id: SyntheticTransportCaseId;
  native: SanitizedTransportDiagnosticSummary;
  importer: SanitizedTransportDiagnosticSummary;
  orchestrator: SanitizedTransportDiagnosticSummary;
  diagnosticSurface: SanitizedTransportDiagnosticSummary;
}

const CASES: SyntheticCase[] = [
  { id: 'T01_TIMEOUT', nativeCode: 'CONNECT_TIMEOUT', nativeStage: 'REQUEST_START', httpResponseReceived: 'NAO', httpStatusClass: 'UNKNOWN', retryable: true },
  { id: 'T02_HTTP_4XX', nativeCode: 'HTTP_STATUS_ERROR', nativeStage: 'HTTP_RESPONSE', httpResponseReceived: 'SIM', httpStatusClass: '4XX', retryable: true },
  { id: 'T03_HTTP_5XX', nativeCode: 'HTTP_STATUS_ERROR', nativeStage: 'HTTP_RESPONSE', httpResponseReceived: 'SIM', httpStatusClass: '5XX', retryable: true },
  { id: 'T04_FILE_IO_FAILURE', nativeCode: 'FILE_IO_FAILURE', nativeStage: 'FILE_WRITE', httpResponseReceived: 'SIM', httpStatusClass: '2XX', retryable: false },
  { id: 'T05_CACHE_SPACE_INSUFFICIENT', nativeCode: 'CACHE_SPACE_INSUFFICIENT', nativeStage: 'FILE_CREATE', httpResponseReceived: 'NAO', httpStatusClass: 'UNKNOWN', retryable: false },
  { id: 'T06_SOURCE_FILE_LIMIT', nativeCode: 'RESPONSE_TOO_LARGE', nativeStage: 'FILE_SIZE_GUARD', httpResponseReceived: 'SIM', httpStatusClass: '2XX', retryable: false },
  { id: 'T07_INVALID_NATIVE_RESPONSE', nativeCode: 'INVALID_NATIVE_RESPONSE', nativeStage: 'REQUEST_START', httpResponseReceived: 'NAO', httpStatusClass: 'UNKNOWN', retryable: false },
  { id: 'T08_CANCELLED', nativeCode: 'ABORTED', nativeStage: 'FILE_WRITE', httpResponseReceived: 'SIM', httpStatusClass: '2XX', retryable: false },
  { id: 'T09_M3U_PARSE_FAILURE', nativeStage: 'DOWNLOAD_COMPLETE', httpResponseReceived: 'SIM', httpStatusClass: '2XX', retryable: false, parseFailure: true },
  { id: 'T10_UNKNOWN_ERROR', nativeCode: 'UNKNOWN_TRANSPORT_ERROR', nativeStage: 'REQUEST_START', httpResponseReceived: 'NAO', httpStatusClass: 'UNKNOWN', retryable: false },
  { id: 'SUCCESS_DOWNLOAD_COMPLETE', nativeStage: 'DOWNLOAD_COMPLETE', httpResponseReceived: 'SIM', httpStatusClass: '2XX', retryable: false, success: true },
];

function nativeSummary(caseData: SyntheticCase): SanitizedTransportDiagnosticSummary {
  const code = caseData.nativeCode === 'CONNECT_TIMEOUT' || caseData.nativeCode === 'READ_TIMEOUT'
    ? 'TIMEOUT'
    : caseData.nativeCode === 'HTTP_STATUS_ERROR'
      ? 'HTTP_ERROR'
      : caseData.nativeCode === 'RESPONSE_TOO_LARGE'
        ? 'SOURCE_FILE_LIMIT_EXCEEDED'
        : caseData.nativeCode === 'ABORTED'
          ? 'DOWNLOAD_CANCELLED'
          : caseData.nativeCode === 'UNKNOWN_TRANSPORT_ERROR'
            ? 'UNKNOWN_SANITIZED_TRANSPORT_ERROR'
            : caseData.nativeCode as SanitizedTransportErrorCode | undefined;
  return {
    success: caseData.success === true,
    stage: caseData.nativeStage,
    code,
    httpStatusClass: caseData.httpStatusClass,
    transportType: 'NATIVE_FILE_BACKED',
    retryable: caseData.retryable,
  };
}

function createSyntheticNativeTransport(caseData: SyntheticCase): LargeSourceTransportPlugin {
  let readCount = 0;
  return {
    async startDownload(): Promise<LargeSourceDownloadStartResult> {
      if (!caseData.success && !caseData.parseFailure) {
        return {
          success: false,
          httpResponseReceived: caseData.httpResponseReceived,
          httpStatusClass: caseData.httpStatusClass,
          bytesWritten: 0,
          errorCode: caseData.nativeCode as LargeSourceDownloadStartResult['errorCode'],
          stage: caseData.nativeStage,
          retryable: caseData.retryable,
          transportType: 'NATIVE_FILE_BACKED',
        };
      }
      return {
        success: true,
        downloadId: 'synthetic-download',
        httpResponseReceived: 'SIM',
        httpStatusClass: '2XX',
        bytesWritten: caseData.parseFailure ? 9 * 1024 * 1024 : 128,
        stage: caseData.nativeStage,
        retryable: false,
        transportType: 'NATIVE_FILE_BACKED',
      };
    },
    async readChunk(): Promise<LargeSourceDownloadChunkResult> {
      if (caseData.parseFailure && readCount < 40) {
        readCount += 1;
        const bytes = new Uint8Array(256 * 1024).fill(0x78);
        return {
          done: false,
          dataBase64: bytesToBase64(bytes),
          bytesRead: bytes.byteLength,
          stage: 'FILE_READ',
        };
      }
      if (caseData.success && readCount === 0) {
        readCount += 1;
        const text = '#EXTM3U\n#EXTINF:-1 group-title="Synthetic",Synthetic Movie\nhttps://synthetic.invalid/movie.mp4\n';
        return {
          done: false,
          dataBase64: btoa(text),
          bytesRead: new TextEncoder().encode(text).byteLength,
          stage: 'FILE_READ',
        };
      }
      return { done: true, bytesRead: 0, stage: 'FILE_READ' };
    },
    async cancelDownload() { return { success: true }; },
    async cleanupDownload() { return { success: true, stage: 'TEMP_CLEANUP', retryable: false }; },
  };
}

function toSummary(observation?: SanitizedTransportObservation): SanitizedTransportDiagnosticSummary {
  return {
    success: observation?.transportSuccess === true,
    stage: observation?.transportStage || 'REQUEST_START',
    code: observation?.transportErrorCode,
    httpStatusClass: observation?.httpStatusClass || 'UNKNOWN',
    transportType: 'NATIVE_FILE_BACKED',
    retryable: observation?.retryable === true,
  };
}

async function runImporter(caseData: SyntheticCase) {
  if (caseData.success) {
    return {
      success: true,
      catalog: {} as never,
      liveCatalog: {} as never,
      transport: createSyntheticSuccessfulTransportObservation(),
    };
  }
  return RealSourceImporterService.importM3u(
    { type: 'M3U', playlistUrl: SYNTHETIC_PLAYLIST_URL },
    {
      persistLiveCatalog: false,
      nativeTransport: createSyntheticNativeTransport(caseData),
    },
  );
}

function createSyntheticSuccessfulTransportObservation(): SanitizedTransportObservation {
  const observation = createSanitizedTransportFailureObservation(
    SYNTHETIC_PLAYLIST_URL,
    { method: 'GET' },
  );
  observation.transportSuccess = true;
  observation.transportStage = 'DOWNLOAD_COMPLETE';
  observation.transportType = 'NATIVE_FILE_BACKED';
  observation.fetchImplementation = 'NATIVE_FILE_BACKED_DOWNLOAD';
  observation.fetchExecutionContext = 'CAPACITOR_ANDROID_NATIVE_HTTP';
  observation.transportRuntime = 'CAPACITOR_ANDROID_NATIVE_HTTP';
  observation.httpResponseReceived = 'SIM';
  observation.httpStatusClass = '2XX';
  observation.transportErrorCode = undefined;
  observation.sanitizedFetchErrorCode = undefined;
  observation.retryable = false;
  return observation;
}

async function runOrchestrator(imported: Awaited<ReturnType<typeof runImporter>>) {
  const result = await new ManagedSourceStagingOrchestrator({
    resolveAuthorization: async () => ({
      status: 'SOURCE_READY',
      mode: 'MANAGED',
      sourceId: SYNTHETIC_SOURCE_ID,
      sourceVersion: 5,
      protocol: 'M3U',
      sourceStatus: 'ACTIVE',
    }),
    secureSourceStore: {
      async get() {
        return {
          sourceId: SYNTHETIC_SOURCE_ID,
          sourceVersion: 5,
          protocol: 'M3U' as const,
          sourceConfig: { playlistUrl: SYNTHETIC_PLAYLIST_URL },
        };
      },
    },
    importer: {
      async importM3u() { return imported; },
      async importXtream() { return imported; },
    },
    packageBuilder: {
      async build() {
        return { success: true, packageBuffer: new Uint8Array([1]), manifest: {} } as never;
      },
    },
    bootstrapService: {
      async stagePackage() {
        return {
          success: true,
          status: 'STAGED',
          snapshotId: 'synthetic-candidate',
          previousSnapshotId: 'synthetic-active',
          metrics: {
            packageValidateMs: 0,
            stagingWriteMs: 0,
            stagingReadbackValidateMs: 0,
            promotionMs: 0,
            totalBootstrapMs: 0,
            packageSizeBytes: 1,
            catalogSizeBytes: 1,
            activeStorageSizeBytes: 1,
          },
          errors: [],
          warnings: [],
        };
      },
    },
  }).stageManagedSource();
  return result;
}

export async function runLargeSourceTransportObservabilitySuite(): Promise<LargeSourceTransportDiagnosticResult[]> {
  const results: LargeSourceTransportDiagnosticResult[] = [];
  for (const caseData of CASES) {
    const imported = await runImporter(caseData);
    const orchestrated = await runOrchestrator(imported);
    const native = nativeSummary(caseData);
    const importer = toSummary(imported.transport);
    const orchestrator = toSummary(orchestrated.transport);
    results.push({
      id: caseData.id,
      native,
      importer,
      orchestrator,
      diagnosticSurface: orchestrator,
    });
  }
  return results;
}

export function isSyntheticTransportDiagnosticResult(value: unknown): value is LargeSourceTransportDiagnosticResult[] {
  return Array.isArray(value) && value.every((entry) => (
    typeof entry === 'object' && entry !== null
    && 'id' in entry && 'native' in entry && 'importer' in entry
    && 'orchestrator' in entry && 'diagnosticSurface' in entry
  ));
}
