import { Capacitor, registerPlugin } from '@capacitor/core';

export const LARGE_SOURCE_TRANSPORT_PLUGIN = 'LargeSourceTransport';

export const LARGE_SOURCE_TRANSPORT_STAGES = [
  'AUTH_PREFLIGHT',
  'REQUEST_START',
  'HTTP_RESPONSE',
  'FILE_CREATE',
  'FILE_WRITE',
  'FILE_SIZE_GUARD',
  'DOWNLOAD_COMPLETE',
  'FILE_READ',
  'M3U_PARSE',
  'TEMP_CLEANUP',
] as const;

export type LargeSourceTransportStage = (typeof LARGE_SOURCE_TRANSPORT_STAGES)[number];

export type LargeSourceTransportErrorCode =
  | 'NETWORK_UNREACHABLE'
  | 'DNS_FAILURE'
  | 'CONNECT_TIMEOUT'
  | 'READ_TIMEOUT'
  | 'TLS_HANDSHAKE_FAILED'
  | 'CERTIFICATE_REJECTED'
  | 'CLEAR_TEXT_NOT_PERMITTED'
  | 'HTTP_STATUS_ERROR'
  | 'RESPONSE_EMPTY'
  | 'RESPONSE_TOO_LARGE'
  | 'ABORTED'
  | 'UNKNOWN_TRANSPORT_ERROR'
  | 'FILE_IO_FAILURE'
  | 'CACHE_SPACE_INSUFFICIENT'
  | 'SOURCE_FILE_LIMIT_EXCEEDED'
  | 'DOWNLOAD_CANCELLED'
  | 'PLUGIN_UNAVAILABLE'
  | 'INVALID_NATIVE_RESPONSE'
  | 'UNKNOWN_SANITIZED_TRANSPORT_ERROR';

export type LargeSourceTransportType = 'NATIVE_FILE_BACKED';

export interface LargeSourceDownloadStartOptions {
  url: string;
  headers?: Record<string, string>;
  connectTimeoutMs?: number;
  readTimeoutMs?: number;
  maxSourceFileBytes?: number;
}

export interface LargeSourceDownloadStartResult {
  success: boolean;
  downloadId?: string;
  httpResponseReceived: 'SIM' | 'NAO';
  httpStatusClass: '2XX' | '3XX' | '4XX' | '5XX' | 'UNKNOWN' | 'NOT_APPLICABLE';
  bytesWritten: number;
  maxSourceFileBytes?: number;
  errorCode?: LargeSourceTransportErrorCode;
  stage: LargeSourceTransportStage;
  retryable: boolean;
  transportType: LargeSourceTransportType;
}

export interface LargeSourceDownloadChunkResult {
  done: boolean;
  dataBase64?: string;
  bytesRead: number;
  stage?: LargeSourceTransportStage;
  errorCode?: LargeSourceTransportErrorCode;
  retryable?: boolean;
}

export interface LargeSourceDownloadCleanupResult {
  success: boolean;
  stage: 'TEMP_CLEANUP';
  errorCode?: LargeSourceTransportErrorCode;
  retryable: boolean;
}

export interface LargeSourceTransportPlugin {
  startDownload(options: LargeSourceDownloadStartOptions): Promise<LargeSourceDownloadStartResult>;
  readChunk(options: { downloadId: string; maxBytes?: number }): Promise<LargeSourceDownloadChunkResult>;
  cancelDownload(options: { downloadId: string }): Promise<{ success: boolean }>;
  cleanupDownload(options: { downloadId: string }): Promise<LargeSourceDownloadCleanupResult>;
}

export const LargeSourceTransport = registerPlugin<LargeSourceTransportPlugin>(
  LARGE_SOURCE_TRANSPORT_PLUGIN,
);

export function isLargeSourceTransportAvailable(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.isPluginAvailable(LARGE_SOURCE_TRANSPORT_PLUGIN);
}
