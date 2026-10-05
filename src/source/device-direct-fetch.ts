import {
  LargeSourceTransport,
  isLargeSourceTransportAvailable,
  type LargeSourceTransportStage,
  type LargeSourceTransportPlugin,
} from './large-source-transport.bridge.ts';

/**
 * R2F4A — transporte device-direct com observabilidade sanitizada.
 *
 * Este módulo não retorna URL, headers, corpo ou exception.message. Ele só
 * classifica o resultado do transporte no contexto atual da WebView.
 */

export const SANITIZED_FETCH_ERROR_CODES = [
  'NETWORK_UNREACHABLE',
  'DNS_FAILURE',
  'CONNECT_TIMEOUT',
  'READ_TIMEOUT',
  'TLS_HANDSHAKE_FAILED',
  'CERTIFICATE_REJECTED',
  'CLEAR_TEXT_NOT_PERMITTED',
  'WEBVIEW_CORS_BLOCKED',
  'MIXED_CONTENT_BLOCKED',
  'HTTP_STATUS_ERROR',
  'RESPONSE_EMPTY',
  'RESPONSE_TOO_LARGE',
  'ABORTED',
  'UNKNOWN_TRANSPORT_ERROR',
] as const;

export const SANITIZED_TRANSPORT_ERROR_CODES = [
  'HTTP_ERROR',
  'TIMEOUT',
  'DNS_FAILURE',
  'TLS_FAILURE',
  'CONNECTION_FAILURE',
  'REDIRECT_FAILURE',
  'FILE_IO_FAILURE',
  'CACHE_SPACE_INSUFFICIENT',
  'SOURCE_FILE_LIMIT_EXCEEDED',
  'DOWNLOAD_CANCELLED',
  'PLUGIN_UNAVAILABLE',
  'INVALID_NATIVE_RESPONSE',
  'RESPONSE_EMPTY',
  'UNKNOWN_SANITIZED_TRANSPORT_ERROR',
] as const;

export type SanitizedFetchErrorCode = (typeof SANITIZED_FETCH_ERROR_CODES)[number];
export type SanitizedTransportErrorCode = (typeof SANITIZED_TRANSPORT_ERROR_CODES)[number];
export type SanitizedTransportStage = LargeSourceTransportStage;
export type SourceSchemeClass = 'HTTP' | 'HTTPS' | 'UNKNOWN';
export type HttpStatusClass = '2XX' | '3XX' | '4XX' | '5XX' | 'UNKNOWN';
export type SanitizedBoolean = 'SIM' | 'NAO' | 'UNPROVEN';
export type FetchImplementation =
  | 'FETCH_API_WITH_CAPACITOR_HTTP_ON_NATIVE'
  | 'NATIVE_FILE_BACKED_DOWNLOAD'
  | 'WINDOW_FETCH'
  | 'OTHER';
export type FetchExecutionContext = 'CAPACITOR_ANDROID_NATIVE_HTTP' | 'WEBVIEW' | 'OTHER';
export type TransportRuntime = 'CAPACITOR_ANDROID_NATIVE_HTTP' | 'WEBVIEW_BROWSER_ONLY' | 'OTHER';
export type WebViewMixedContentMode = 'COMPATIBILITY' | 'NOT_APPLICABLE' | 'UNPROVEN';

export interface SanitizedTransportObservation {
  transportSuccess: boolean;
  transportStage: SanitizedTransportStage;
  transportType: 'NATIVE_FILE_BACKED' | 'WINDOW_FETCH' | 'OTHER';
  transportErrorCode?: SanitizedTransportErrorCode;
  retryable: boolean;
  fetchImplementation: FetchImplementation;
  fetchExecutionContext: FetchExecutionContext;
  webviewOrigin: 'SANITIZED_LOCAL_ORIGIN_ONLY' | 'NOT_APPLICABLE';
  capacitorHttpEnabled: SanitizedBoolean;
  transportRuntime: TransportRuntime;
  sourceSchemeClass: SourceSchemeClass;
  httpResponseReceived: 'SIM' | 'NAO';
  httpStatusClass: HttpStatusClass | 'NOT_APPLICABLE';
  corsEnforcementApplies: SanitizedBoolean;
  corsFailureClassified: 'SIM' | 'NAO';
  androidCleartextAllowed: SanitizedBoolean;
  webviewMixedContentAllowed: SanitizedBoolean;
  webviewMixedContentMode: WebViewMixedContentMode;
  tlsConnectionAttempted: SanitizedBoolean;
  tlsHandshakeResult: 'PASS' | 'FAIL' | 'UNPROVEN' | 'NOT_APPLICABLE';
  certificateValidation: 'PASS' | 'FAIL' | 'UNPROVEN' | 'NOT_APPLICABLE';
  sourceHostDnsResult: 'PASS' | 'FAIL' | 'UNPROVEN';
  sourceHostTcpConnect: 'PASS' | 'FAIL' | 'UNPROVEN';
  customUserAgentPresent: 'SIM' | 'NAO';
  acceptHeaderPresent: 'SIM' | 'NAO';
  sanitizedFetchErrorCode?: SanitizedFetchErrorCode;
}

export interface DeviceDirectTextFetchResult {
  success: boolean;
  body?: string;
  observation: SanitizedTransportObservation;
}

export interface FetchDiagnosticsOptions {
  fetchImpl?: typeof fetch;
  connectTimeoutMs?: number;
  readTimeoutMs?: number;
  maxResponseBytes?: number;
  maxSourceFileBytes?: number;
  nativeTransport?: LargeSourceTransportPlugin;
}

const DEFAULT_CONNECT_TIMEOUT_MS = 20_000;
const DEFAULT_READ_TIMEOUT_MS = 20_000;
const DEFAULT_MAX_RESPONSE_BYTES = 50 * 1024 * 1024;
export const DEFAULT_MAX_SOURCE_FILE_BYTES = 256 * 1024 * 1024;
const NATIVE_READ_CHUNK_BYTES = 2 * 1024 * 1024; // 2 MB por chunk (reduz viagens de 100+ para ~12)

export interface DeviceDirectM3uStreamHandle {
  readChunks(): AsyncIterable<Uint8Array | string>;
  cleanup(): Promise<void>;
  cancel(): Promise<void>;
}

export interface DeviceDirectM3uStreamResult {
  success: boolean;
  observation: SanitizedTransportObservation;
  sourcePayloadSizeBytes?: number;
  getSourcePayloadSizeBytes?: () => number | undefined;
  stream?: DeviceDirectM3uStreamHandle;
}

interface CapacitorHttpAndroidBridge {
  isEnabled?: () => boolean;
}

function isCapacitorHttpEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const bridge = (window as Window & { CapacitorHttpAndroidInterface?: CapacitorHttpAndroidBridge })
    .CapacitorHttpAndroidInterface;
  try {
    return bridge?.isEnabled?.() === true;
  } catch {
    return false;
  }
}

function getFetchImplementation(options?: FetchDiagnosticsOptions): typeof fetch {
  if (options?.fetchImpl) return options.fetchImpl;
  if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
    return window.fetch.bind(window);
  }
  return globalThis.fetch.bind(globalThis);
}

function getSourceSchemeClass(input: string): SourceSchemeClass {
  try {
    const protocol = new URL(input).protocol.toLowerCase();
    if (protocol === 'http:') return 'HTTP';
    if (protocol === 'https:') return 'HTTPS';
  } catch {
    // O valor não é propagado; apenas mantém a classificação fechada.
  }
  return 'UNKNOWN';
}

function getHttpStatusClass(status: number): HttpStatusClass {
  if (status >= 200 && status < 300) return '2XX';
  if (status >= 300 && status < 400) return '3XX';
  if (status >= 400 && status < 500) return '4XX';
  if (status >= 500 && status < 600) return '5XX';
  return 'UNKNOWN';
}

function isWebViewCrossOriginRequest(input: string): boolean {
  if (typeof window === 'undefined' || !window.location) return false;
  try {
    return new URL(input, window.location.href).origin !== window.location.origin;
  } catch {
    return false;
  }
}

function hasHeader(headers: HeadersInit | undefined, name: string): boolean {
  if (!headers) return false;
  const target = name.toLowerCase();
  if (headers instanceof Headers) return headers.has(name);
  if (Array.isArray(headers)) return headers.some(([key]) => key.toLowerCase() === target);
  return Object.keys(headers).some((key) => key.toLowerCase() === target);
}

function toHeaderRecord(headers: HeadersInit | undefined): Record<string, string> {
  if (!headers) return {};
  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers.map(([key, value]) => [key, String(value)]));
  }
  return Object.fromEntries(Object.entries(headers).map(([key, value]) => [key, String(value)]));
}

function decodeBase64Chunk(value: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(value, 'base64');
  }
  const binary = atob(value);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

function markNativeFileBackedObservation(observation: SanitizedTransportObservation): void {
  observation.transportType = 'NATIVE_FILE_BACKED';
  observation.fetchImplementation = 'NATIVE_FILE_BACKED_DOWNLOAD';
  observation.fetchExecutionContext = 'CAPACITOR_ANDROID_NATIVE_HTTP';
  observation.transportRuntime = 'CAPACITOR_ANDROID_NATIVE_HTTP';
  observation.corsEnforcementApplies = 'NAO';
  observation.corsFailureClassified = 'NAO';
  observation.androidCleartextAllowed = observation.sourceSchemeClass === 'HTTP' ? 'SIM' : 'UNPROVEN';
  observation.webviewMixedContentAllowed = 'UNPROVEN';
  observation.webviewMixedContentMode = 'NOT_APPLICABLE';
}

function isTransportStage(value: unknown): value is SanitizedTransportStage {
  return typeof value === 'string' && [
    'AUTH_PREFLIGHT', 'REQUEST_START', 'HTTP_RESPONSE', 'FILE_CREATE', 'FILE_WRITE',
    'FILE_SIZE_GUARD', 'DOWNLOAD_COMPLETE', 'FILE_READ', 'M3U_PARSE', 'TEMP_CLEANUP',
  ].includes(value);
}

function canonicalTransportError(rawCode?: string): SanitizedTransportErrorCode {
  switch (rawCode) {
    case 'HTTP_STATUS_ERROR': return 'HTTP_ERROR';
    case 'CONNECT_TIMEOUT':
    case 'READ_TIMEOUT': return 'TIMEOUT';
    case 'DNS_FAILURE': return 'DNS_FAILURE';
    case 'TLS_HANDSHAKE_FAILED':
    case 'CERTIFICATE_REJECTED': return 'TLS_FAILURE';
    case 'NETWORK_UNREACHABLE': return 'CONNECTION_FAILURE';
    case 'RESPONSE_EMPTY': return 'RESPONSE_EMPTY';
    case 'RESPONSE_TOO_LARGE': return 'SOURCE_FILE_LIMIT_EXCEEDED';
    case 'ABORTED': return 'DOWNLOAD_CANCELLED';
    case 'FILE_IO_FAILURE': return 'FILE_IO_FAILURE';
    case 'CACHE_SPACE_INSUFFICIENT': return 'CACHE_SPACE_INSUFFICIENT';
    case 'PLUGIN_UNAVAILABLE': return 'PLUGIN_UNAVAILABLE';
    case 'INVALID_NATIVE_RESPONSE': return 'INVALID_NATIVE_RESPONSE';
    case 'REDIRECT_FAILURE': return 'REDIRECT_FAILURE';
    case 'CLEAR_TEXT_NOT_PERMITTED':
    case 'WEBVIEW_CORS_BLOCKED':
    case 'MIXED_CONTENT_BLOCKED': return 'CONNECTION_FAILURE';
    default: return 'UNKNOWN_SANITIZED_TRANSPORT_ERROR';
  }
}

function legacyTransportError(rawCode?: string): SanitizedFetchErrorCode {
  return SANITIZED_FETCH_ERROR_CODES.includes(rawCode as SanitizedFetchErrorCode)
    ? rawCode as SanitizedFetchErrorCode
    : 'UNKNOWN_TRANSPORT_ERROR';
}

function defaultRetryable(code: SanitizedTransportErrorCode): boolean {
  return code === 'TIMEOUT' || code === 'DNS_FAILURE' || code === 'CONNECTION_FAILURE' || code === 'HTTP_ERROR';
}

function markTransportFailure(
  observation: SanitizedTransportObservation,
  rawCode?: string,
  stage?: unknown,
  retryable?: boolean,
): void {
  const code = canonicalTransportError(rawCode);
  observation.transportSuccess = false;
  observation.transportStage = isTransportStage(stage) ? stage : observation.transportStage;
  observation.transportErrorCode = code;
  observation.retryable = retryable ?? defaultRetryable(code);
  observation.sanitizedFetchErrorCode = legacyTransportError(rawCode);
}

function markTransportSuccess(
  observation: SanitizedTransportObservation,
  stage: SanitizedTransportStage = 'DOWNLOAD_COMPLETE',
): void {
  observation.transportSuccess = true;
  observation.transportStage = stage;
  observation.transportErrorCode = undefined;
  observation.retryable = false;
}

function createBaseObservation(
  input: string,
  init: RequestInit,
): SanitizedTransportObservation {
  const isWindowFetch = typeof window !== 'undefined' && typeof window.fetch === 'function';
  const capacitorHttpEnabled = isCapacitorHttpEnabled();
  const isNativeHttpFetch = isWindowFetch && capacitorHttpEnabled;
  const isCrossOrigin = isWebViewCrossOriginRequest(input);
  const scheme = getSourceSchemeClass(input);

  return {
    transportSuccess: false,
    transportStage: 'REQUEST_START',
    transportType: isWindowFetch ? 'WINDOW_FETCH' : 'OTHER',
    retryable: false,
    fetchImplementation: isNativeHttpFetch
      ? 'FETCH_API_WITH_CAPACITOR_HTTP_ON_NATIVE'
      : isWindowFetch
        ? 'WINDOW_FETCH'
        : 'OTHER',
    fetchExecutionContext: isNativeHttpFetch
      ? 'CAPACITOR_ANDROID_NATIVE_HTTP'
      : typeof window !== 'undefined'
        ? 'WEBVIEW'
        : 'OTHER',
    webviewOrigin: typeof window !== 'undefined' ? 'SANITIZED_LOCAL_ORIGIN_ONLY' : 'NOT_APPLICABLE',
    capacitorHttpEnabled: typeof window === 'undefined' ? 'UNPROVEN' : capacitorHttpEnabled ? 'SIM' : 'NAO',
    transportRuntime: isNativeHttpFetch
      ? 'CAPACITOR_ANDROID_NATIVE_HTTP'
      : isWindowFetch
        ? 'WEBVIEW_BROWSER_ONLY'
        : 'OTHER',
    sourceSchemeClass: scheme,
    httpResponseReceived: 'NAO',
    httpStatusClass: 'NOT_APPLICABLE',
    corsEnforcementApplies: isCrossOrigin ? 'SIM' : 'NAO',
    corsFailureClassified: 'NAO',
    androidCleartextAllowed: scheme === 'HTTP' && isNativeHttpFetch
      ? 'SIM'
      : scheme === 'HTTP' && typeof window !== 'undefined'
        ? 'NAO'
        : 'UNPROVEN',
    webviewMixedContentAllowed: scheme === 'HTTP' && typeof window !== 'undefined' ? 'SIM' : 'UNPROVEN',
    webviewMixedContentMode: isNativeHttpFetch ? 'COMPATIBILITY' : typeof window !== 'undefined' ? 'UNPROVEN' : 'NOT_APPLICABLE',
    tlsConnectionAttempted: scheme === 'HTTPS' ? 'SIM' : 'NAO',
    tlsHandshakeResult: scheme === 'HTTPS' ? 'UNPROVEN' : 'NOT_APPLICABLE',
    certificateValidation: scheme === 'HTTPS' ? 'UNPROVEN' : 'NOT_APPLICABLE',
    sourceHostDnsResult: 'UNPROVEN',
    sourceHostTcpConnect: 'UNPROVEN',
    customUserAgentPresent: hasHeader(init.headers, 'User-Agent') ? 'SIM' : 'NAO',
    acceptHeaderPresent: hasHeader(init.headers, 'Accept') ? 'SIM' : 'NAO',
  };
}

/**
 * Cria uma observação fechada quando uma exceção inesperada atravessa a
 * fronteira do transporte. Nenhum valor de URL, header ou corpo é incluído.
 */
export function createSanitizedTransportFailureObservation(
  input: string,
  init: RequestInit = {},
  code: SanitizedFetchErrorCode = 'UNKNOWN_TRANSPORT_ERROR',
): SanitizedTransportObservation {
  const observation = createBaseObservation(input, init);
  if (isLargeSourceTransportAvailable()) markNativeFileBackedObservation(observation);
  markTransportFailure(observation, code, 'REQUEST_START');
  return observation;
}

function isAbortError(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && 'name' in error && error.name === 'AbortError');
}

function isOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

async function classifyCorsFailure(
  input: string,
  fetchImpl: typeof fetch,
  observation: SanitizedTransportObservation,
): Promise<boolean> {
  if (observation.corsEnforcementApplies !== 'SIM' || observation.fetchExecutionContext !== 'WEBVIEW') return false;

  try {
    // A resposta opaque prova apenas que a pilha alcançou a origem sem
    // permitir que a WebView leia o corpo. Nenhum header secreto é enviado.
    const probe = await fetchImpl(input, { method: 'GET', mode: 'no-cors' });
    if (probe.type === 'opaque' || probe.status === 0) {
      observation.corsFailureClassified = 'SIM';
      if (observation.sourceSchemeClass === 'HTTPS') {
        observation.tlsHandshakeResult = 'PASS';
        observation.certificateValidation = 'PASS';
      }
      observation.sourceHostDnsResult = 'PASS';
      observation.sourceHostTcpConnect = 'PASS';
      markTransportFailure(observation, 'WEBVIEW_CORS_BLOCKED', 'HTTP_RESPONSE');
      return true;
    }
  } catch {
    // A exceção do probe permanece deliberadamente não observável.
  }

  return false;
}

function assignGenericFailure(
  error: unknown,
  observation: SanitizedTransportObservation,
  phase: 'connect' | 'read',
): void {
  if (isAbortError(error)) {
    markTransportFailure(observation, phase === 'connect' ? 'CONNECT_TIMEOUT' : 'READ_TIMEOUT', phase === 'connect' ? 'REQUEST_START' : 'FILE_READ');
    return;
  }
  if (isOffline()) {
    markTransportFailure(observation, 'NETWORK_UNREACHABLE', 'REQUEST_START');
    observation.sourceHostDnsResult = 'UNPROVEN';
    observation.sourceHostTcpConnect = 'FAIL';
    return;
  }
  markTransportFailure(observation, 'UNKNOWN_TRANSPORT_ERROR', phase === 'connect' ? 'REQUEST_START' : 'FILE_READ');
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, onTimeout: () => void): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => {
          onTimeout();
          reject(new DOMException('Timeout', 'AbortError'));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function fetchDeviceDirectText(
  input: string,
  init: RequestInit = {},
  options?: FetchDiagnosticsOptions,
): Promise<DeviceDirectTextFetchResult> {
  const fetchImpl = getFetchImplementation(options);
  const observation = createBaseObservation(input, init);
  const connectTimeoutMs = options?.connectTimeoutMs ?? DEFAULT_CONNECT_TIMEOUT_MS;
  const readTimeoutMs = options?.readTimeoutMs ?? DEFAULT_READ_TIMEOUT_MS;
  const maxResponseBytes = options?.maxResponseBytes ?? DEFAULT_MAX_RESPONSE_BYTES;
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
  const requestInit: RequestInit = controller ? { ...init, signal: controller.signal } : init;

  let response: Response;
  try {
    response = await withTimeout(
      Promise.resolve(fetchImpl(input, requestInit)),
      connectTimeoutMs,
      () => controller?.abort(),
    );
  } catch (error) {
    await classifyCorsFailure(input, fetchImpl, observation);
    if (!observation.sanitizedFetchErrorCode) assignGenericFailure(error, observation, 'connect');
    return { success: false, observation };
  }

  observation.httpResponseReceived = 'SIM';
  observation.httpStatusClass = getHttpStatusClass(response.status);
  observation.transportStage = 'HTTP_RESPONSE';
  if (!response.ok) {
    markTransportFailure(observation, 'HTTP_STATUS_ERROR', 'HTTP_RESPONSE');
    return { success: false, observation };
  }

  let body: string;
  try {
    body = await withTimeout(Promise.resolve(response.text()), readTimeoutMs, () => controller?.abort());
  } catch (error) {
    assignGenericFailure(error, observation, 'read');
    return { success: false, observation };
  }

  if (!body) {
    markTransportFailure(observation, 'RESPONSE_EMPTY', 'DOWNLOAD_COMPLETE');
    return { success: false, observation };
  }
  if (new TextEncoder().encode(body).byteLength > maxResponseBytes) {
    markTransportFailure(observation, 'RESPONSE_TOO_LARGE', 'FILE_SIZE_GUARD');
    return { success: false, observation };
  }

  markTransportSuccess(observation, 'DOWNLOAD_COMPLETE');
  return { success: true, body, observation };
}

/**
 * Abre o caminho grande sem materializar a resposta inteira como string.
 *
 * No Android nativo, o plugin grava em Directory.Cache e entrega somente
 * chunks limitados. Fora do Android, usa ReadableStream como fallback de
 * desenvolvimento/teste; o parser consumidor continua incremental.
 */
export async function fetchDeviceDirectM3uStream(
  input: string,
  init: RequestInit = {},
  options?: FetchDiagnosticsOptions,
): Promise<DeviceDirectM3uStreamResult> {
  const observation = createBaseObservation(input, init);
  const nativeTransport = options?.nativeTransport
    || (isLargeSourceTransportAvailable() ? LargeSourceTransport : undefined);
  const connectTimeoutMs = options?.connectTimeoutMs ?? DEFAULT_CONNECT_TIMEOUT_MS;
  const readTimeoutMs = options?.readTimeoutMs ?? DEFAULT_READ_TIMEOUT_MS;
  const maxSourceFileBytes = options?.maxSourceFileBytes ?? DEFAULT_MAX_SOURCE_FILE_BYTES;
  const headers = toHeaderRecord(init.headers);

  if (nativeTransport) {
    markNativeFileBackedObservation(observation);
    try {
      const result = await nativeTransport.startDownload({
        url: input,
        headers,
        connectTimeoutMs,
        readTimeoutMs,
        maxSourceFileBytes,
      });
      observation.httpResponseReceived = result.httpResponseReceived;
      observation.httpStatusClass = result.httpStatusClass;
      if (isTransportStage(result.stage)) observation.transportStage = result.stage;
      if (!result.success || !result.downloadId) {
        markTransportFailure(
          observation,
          result.errorCode || (!result.downloadId ? 'INVALID_NATIVE_RESPONSE' : 'UNKNOWN_TRANSPORT_ERROR'),
          result.stage,
          result.retryable,
        );
        return { success: false, observation };
      }

      observation.transportType = 'NATIVE_FILE_BACKED';
      markTransportSuccess(observation, result.stage || 'DOWNLOAD_COMPLETE');

      const downloadId = result.downloadId;
      let finished = false;
      const stream: DeviceDirectM3uStreamHandle = {
        async *readChunks(): AsyncIterable<Uint8Array | string> {
          while (!finished) {
            const chunk = await nativeTransport.readChunk({
              downloadId,
              maxBytes: NATIVE_READ_CHUNK_BYTES,
            });
            if (chunk.done) {
              finished = true;
              return;
            }
            if ((!chunk.dataText && !chunk.dataBase64) || chunk.bytesRead <= 0) {
              markTransportFailure(observation, chunk.errorCode || 'INVALID_NATIVE_RESPONSE', chunk.stage || 'FILE_READ', chunk.retryable);
              finished = true;
              throw new Error('NATIVE_CHUNK_READ_FAILED');
            }
            if (typeof chunk.dataText === 'string') {
              yield chunk.dataText;
            } else if (chunk.dataBase64) {
              yield decodeBase64Chunk(chunk.dataBase64);
            }
          }
        },
        async cleanup(): Promise<void> {
          const cleanup = await nativeTransport.cleanupDownload({ downloadId });
          if (!cleanup.success) {
            markTransportFailure(observation, cleanup.errorCode || 'FILE_IO_FAILURE', cleanup.stage, cleanup.retryable);
          }
          finished = true;
        },
        async cancel(): Promise<void> {
          await nativeTransport.cancelDownload({ downloadId });
          markTransportFailure(observation, 'ABORTED', 'FILE_WRITE', false);
          finished = true;
        },
      };

      return {
        success: true,
        observation,
        sourcePayloadSizeBytes: result.bytesWritten,
        getSourcePayloadSizeBytes: () => result.bytesWritten,
        stream,
      };
  } catch (streamInitError) {
      console.error('[STREAM_INIT_ERROR]', streamInitError);
      markTransportFailure(observation, 'UNKNOWN_TRANSPORT_ERROR', 'REQUEST_START');
      return { success: false, observation };
    }
  }

  const fetchImpl = getFetchImplementation(options);
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
  const requestInit: RequestInit = controller ? { ...init, signal: controller.signal } : init;
  let response: Response;
  try {
    response = await withTimeout(
      Promise.resolve(fetchImpl(input, requestInit)),
      connectTimeoutMs,
      () => controller?.abort(),
    );
  } catch (error) {
    await classifyCorsFailure(input, fetchImpl, observation);
    if (!observation.sanitizedFetchErrorCode) assignGenericFailure(error, observation, 'connect');
    return { success: false, observation };
  }

  observation.httpResponseReceived = 'SIM';
  observation.httpStatusClass = getHttpStatusClass(response.status);
  observation.transportStage = 'HTTP_RESPONSE';
  if (!response.ok) {
    markTransportFailure(observation, 'HTTP_STATUS_ERROR', 'HTTP_RESPONSE');
    return { success: false, observation };
  }

  const body = response.body;
  if (!body) {
    // Compatibilidade apenas para runtimes sem ReadableStream. O Android
    // nativo usa obrigatoriamente o caminho file-backed acima.
    let bufferedBody: string;
    try {
      bufferedBody = await withTimeout(Promise.resolve(response.text()), readTimeoutMs, () => controller?.abort());
    } catch (error) {
      assignGenericFailure(error, observation, 'read');
      return { success: false, observation };
    }
    if (!bufferedBody) {
      markTransportFailure(observation, 'RESPONSE_EMPTY', 'DOWNLOAD_COMPLETE');
      return { success: false, observation };
    }
    const bufferedBytes = new TextEncoder().encode(bufferedBody).byteLength;
    if (bufferedBytes > maxSourceFileBytes) {
      markTransportFailure(observation, 'RESPONSE_TOO_LARGE', 'FILE_SIZE_GUARD');
      return { success: false, observation };
    }
    const stream: DeviceDirectM3uStreamHandle = {
      async *readChunks(): AsyncIterable<Uint8Array | string> {
        yield new TextEncoder().encode(bufferedBody);
      },
      async cleanup(): Promise<void> {},
      async cancel(): Promise<void> { controller?.abort(); },
    };
    markTransportSuccess(observation, 'DOWNLOAD_COMPLETE');
    return {
      success: true,
      observation,
      sourcePayloadSizeBytes: bufferedBytes,
      getSourcePayloadSizeBytes: () => bufferedBytes,
      stream,
    };
  }

  let totalBytes = 0;
  let finished = false;
  const reader = body.getReader();
  const stream: DeviceDirectM3uStreamHandle = {
    async *readChunks(): AsyncIterable<Uint8Array | string> {
      try {
        while (!finished) {
          const next = await withTimeout(reader.read(), readTimeoutMs, () => controller?.abort());
          if (next.done) {
            finished = true;
            if (totalBytes === 0) {
              markTransportFailure(observation, 'RESPONSE_EMPTY', 'DOWNLOAD_COMPLETE');
              throw new Error('EMPTY_RESPONSE');
            }
            markTransportSuccess(observation, 'DOWNLOAD_COMPLETE');
            return;
          }
          const value = next.value;
          totalBytes += value.byteLength;
          if (totalBytes > maxSourceFileBytes) {
            markTransportFailure(observation, 'RESPONSE_TOO_LARGE', 'FILE_SIZE_GUARD');
            controller?.abort();
            throw new Error('RESPONSE_TOO_LARGE');
          }
          yield value;
        }
      } catch (error) {
        if (!observation.sanitizedFetchErrorCode) assignGenericFailure(error, observation, 'read');
        throw error;
      } finally {
        finished = true;
        try {
          reader.releaseLock();
        } catch {
          // O runtime já encerrou o reader.
        }
      }
    },
    async cleanup(): Promise<void> {
      finished = true;
      try {
        await reader.cancel();
      } catch {
        // A resposta já pode estar encerrada.
      }
    },
    async cancel(): Promise<void> {
      finished = true;
      controller?.abort();
      try {
        await reader.cancel();
      } catch {
        // A resposta já pode estar encerrada.
      }
    },
  };

  return {
    success: true,
    observation,
    sourcePayloadSizeBytes: undefined,
    getSourcePayloadSizeBytes: () => totalBytes || undefined,
    stream,
  };
}
