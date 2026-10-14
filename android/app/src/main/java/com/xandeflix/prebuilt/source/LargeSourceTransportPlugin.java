package com.xandeflix.prebuilt.source;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.xandeflix.prebuilt.player.ResilientDns;

import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InterruptedIOException;
import java.io.RandomAccessFile;
import java.net.ConnectException;
import java.net.SocketTimeoutException;
import java.net.URI;
import java.net.UnknownHostException;
import java.security.MessageDigest;
import java.util.Collections;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

import javax.net.ssl.SSLHandshakeException;
import javax.net.ssl.SSLPeerUnverifiedException;

import okhttp3.Call;
import okhttp3.Dns;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.ResponseBody;
import okio.ByteString;

/**
 * Device-direct file-backed source transport with resilient DNS.
 *
 * Uses OkHttpClient configured with ResilientDns (matching the player transport),
 * providing system-DNS-first resolution with automatic fallback to public resolvers
 * (UDP 53 / DoH) if system DNS fails.
 *
 * Low-memory streaming model: The response stream is written directly to a temp
 * file in the application's cache directory in bounded 64KB buffers.
 * JavaScript receives only sanitized status and bounded chunk reads (256KB).
 * URLs, headers and source contents never enter logs or result messages.
 */
@CapacitorPlugin(name = "LargeSourceTransport")
public final class LargeSourceTransportPlugin extends Plugin {
    public static final String TRANSPORT_TYPE = "NATIVE_FILE_BACKED_DOWNLOAD";
    private static final long DEFAULT_MAX_SOURCE_FILE_BYTES = 256L * 1024L * 1024L;
    private static final long MIN_SAFE_FILE_BYTES = 16L * 1024L * 1024L;
    private static final int DOWNLOAD_BUFFER_BYTES = 64 * 1024;
    private static final int STREAM_PUBLISH_BYTES = 256 * 1024;
    private static final int READ_CHUNK_MAX_BYTES = 4 * 1024 * 1024; // 4 MB máximo suportado
    private static final int DEFAULT_CONNECT_TIMEOUT_MS = 20_000;
    private static final int DEFAULT_READ_TIMEOUT_MS = 20_000;

    private static Dns sharedDns = null;
    private static OkHttpClient sharedHttpClient = null;

    private final ExecutorService executor = Executors.newCachedThreadPool();
    private final ConcurrentMap<String, DownloadSession> sessions = new ConcurrentHashMap<>();

    public static synchronized Dns getSharedDns() {
        if (sharedDns == null) {
            sharedDns = new ResilientDns();
        }
        return sharedDns;
    }

    public static synchronized void setSharedDnsForTesting(@Nullable Dns dns) {
        sharedDns = dns;
        sharedHttpClient = null;
    }

    public static synchronized OkHttpClient getSharedHttpClient() {
        if (sharedHttpClient == null) {
            sharedHttpClient = new OkHttpClient.Builder()
                    .dns(getSharedDns())
                    .followRedirects(true)
                    .followSslRedirects(true)
                    .retryOnConnectionFailure(true)
                    .build();
        }
        return sharedHttpClient;
    }

    public static synchronized void setSharedHttpClientForTesting(@Nullable OkHttpClient client) {
        sharedHttpClient = client;
    }

    @PluginMethod
    public void startDownload(PluginCall call) {
        if (call == null) {
            return;
        }

        String url = call.getString("url");
        if (!isSupportedUrl(url) || isSyntheticUrl(url)) {
            call.resolve(failure("UNKNOWN_TRANSPORT_ERROR", "UNKNOWN", false, "REQUEST_START", false).toJSObject());
            return;
        }

        Map<String, String> headers = extractHeaders(call.getObject("headers"));
        int connectTimeoutMs = boundedTimeout(call.getInt("connectTimeoutMs"), DEFAULT_CONNECT_TIMEOUT_MS);
        int readTimeoutMs = boundedTimeout(call.getInt("readTimeoutMs"), DEFAULT_READ_TIMEOUT_MS);
        long requestedMax = boundedMax(call.getLong("maxSourceFileBytes"));
        String downloadId = UUID.randomUUID().toString();
        DownloadSession session = new DownloadSession(downloadId, url, headers, connectTimeoutMs, readTimeoutMs, requestedMax);
        sessions.put(downloadId, session);

        boolean progressive = Boolean.TRUE.equals(call.getBoolean("progressive"));
        executor.execute(() -> download(call, session, progressive));
    }

    @PluginMethod
    public void readChunk(PluginCall call) {
        if (call == null) {
            return;
        }
        String downloadId = call.getString("downloadId");
        DownloadSession session = downloadId == null ? null : sessions.get(downloadId);
        if (session == null || (!session.ready && !session.completed)) {
            call.resolve(failureChunk("INVALID_NATIVE_RESPONSE", false));
            return;
        }

        int requested = call.getInt("maxBytes") == null ? 2 * 1024 * 1024 : call.getInt("maxBytes");
        int maxBytes = Math.max(1, Math.min(READ_CHUNK_MAX_BYTES, requested));
        executor.execute(() -> readChunkInternal(call, session, maxBytes));
    }

    @PluginMethod
    public void cancelDownload(PluginCall call) {
        if (call == null) {
            return;
        }
        String downloadId = call.getString("downloadId");
        DownloadSession session = downloadId == null ? null : sessions.get(downloadId);
        if (session != null) {
            session.cancel();
        }
        JSObject result = new JSObject();
        result.put("success", session != null);
        call.resolve(result);
    }

    @PluginMethod
    public void cleanupDownload(PluginCall call) {
        if (call == null) {
            return;
        }
        String downloadId = call.getString("downloadId");
        DownloadSession session = downloadId == null ? null : sessions.remove(downloadId);
        boolean success = session != null;
        boolean cleanupSuccess = true;
        if (session != null) {
            cleanupSuccess = session.closeAndDelete();
        }
        JSObject result = new JSObject();
        result.put("success", success && cleanupSuccess);
        result.put("stage", "TEMP_CLEANUP");
        result.put("retryable", false);
        if (!success || !cleanupSuccess) {
            result.put("errorCode", cleanupSuccess ? "INVALID_NATIVE_RESPONSE" : "FILE_IO_FAILURE");
        }
        call.resolve(result);
    }

    public static final class DownloadResult {
        public final boolean success;
        public final String downloadId;
        public final String httpResponseReceived;
        public final String httpStatusClass;
        public final long bytesWritten;
        public final long maxSourceFileBytes;
        public final String errorCode;
        public final String stage;
        public final boolean retryable;
        public final String transportType;
        public final String sourceContentDigest;

        public DownloadResult(
                boolean success,
                String downloadId,
                String httpResponseReceived,
                String httpStatusClass,
                long bytesWritten,
                long maxSourceFileBytes,
                String errorCode,
                String stage,
                boolean retryable,
                String transportType
        ) {
            this(success, downloadId, httpResponseReceived, httpStatusClass, bytesWritten,
                    maxSourceFileBytes, errorCode, stage, retryable, transportType, null);
        }

        public DownloadResult(boolean success, String downloadId, String httpResponseReceived,
                String httpStatusClass, long bytesWritten, long maxSourceFileBytes, String errorCode,
                String stage, boolean retryable, String transportType, String sourceContentDigest) {
            this.success = success;
            this.downloadId = downloadId;
            this.httpResponseReceived = httpResponseReceived;
            this.httpStatusClass = httpStatusClass;
            this.bytesWritten = bytesWritten;
            this.maxSourceFileBytes = maxSourceFileBytes;
            this.errorCode = errorCode;
            this.stage = stage;
            this.retryable = retryable;
            this.transportType = transportType;
            this.sourceContentDigest = sourceContentDigest;
        }

        public JSObject toJSObject() {
            JSObject obj = new JSObject();
            obj.put("success", success);
            if (downloadId != null) {
                obj.put("downloadId", downloadId);
            }
            obj.put("httpResponseReceived", httpResponseReceived);
            obj.put("httpStatusClass", httpStatusClass);
            obj.put("bytesWritten", bytesWritten);
            if (maxSourceFileBytes > 0) {
                obj.put("maxSourceFileBytes", maxSourceFileBytes);
            }
            if (errorCode != null) {
                obj.put("errorCode", errorCode);
            }
            obj.put("stage", stage);
            obj.put("retryable", retryable);
            obj.put("transportType", transportType);
            if (success && sourceContentDigest != null) obj.put("sourceContentDigest", sourceContentDigest);
            return obj;
        }
    }

    private void download(PluginCall call, DownloadSession session, boolean progressive) {
        File cacheDir = getContext() == null ? null : getContext().getCacheDir();
        AtomicBoolean startResolved = new AtomicBoolean(false);
        DownloadReadyListener readyListener = readyResult -> {
            if (startResolved.compareAndSet(false, true)) {
                call.resolve(readyResult.toJSObject());
            }
        };
        DownloadResult result = executeDownload(session, cacheDir, getSharedHttpClient(), progressive ? readyListener : null);
        if (!session.ready && !result.success) {
            sessions.remove(session.id);
        }
        if (startResolved.compareAndSet(false, true)) {
            call.resolve(result.toJSObject());
        }
    }

    public static DownloadResult executeDownload(DownloadSession session, File cacheDir, OkHttpClient client) {
        return executeDownload(session, cacheDir, client, null);
    }

    interface DownloadReadyListener {
        void onReady(DownloadResult result);
    }

    static DownloadResult executeDownload(DownloadSession session, File cacheDir, OkHttpClient client,
                                          @Nullable DownloadReadyListener readyListener) {
        DownloadResult result = executeDownloadBody(session, cacheDir, client, readyListener);
        result = session.finish(result);
        if (!result.success) session.closeAndDelete();
        return result;
    }

    private static DownloadResult executeDownloadBody(DownloadSession session, File cacheDir, OkHttpClient client,
                                                      @Nullable DownloadReadyListener readyListener) {
        File tempFile = null;
        Response response = null;
        try {
            session.stage = "FILE_CREATE";
            if (cacheDir == null) {
                return failure("FILE_IO_FAILURE", "UNKNOWN", false, session.stage, false);
            }
            if (!cacheDir.exists() && !cacheDir.mkdirs()) {
                return failure("FILE_IO_FAILURE", "UNKNOWN", false, session.stage, false);
            }

            long usableBytes = cacheDir.getUsableSpace();
            long dynamicMax = Math.max(MIN_SAFE_FILE_BYTES, usableBytes / 3L);
            long effectiveMax = Math.min(session.requestedMaxBytes, dynamicMax);
            tempFile = File.createTempFile("source-import-", ".m3u", cacheDir);
            session.file = tempFile;
            session.maxSourceFileBytes = effectiveMax;

            session.stage = "REQUEST_START";
            if (session.cancelled.get()) {
                return failure("ABORTED", "UNKNOWN", false, session.stage, false);
            }

            Request.Builder requestBuilder = new Request.Builder()
                    .url(session.url)
                    .get();

            for (Map.Entry<String, String> header : session.headers.entrySet()) {
                requestBuilder.header(header.getKey(), header.getValue());
            }

            Request request = requestBuilder.build();

            OkHttpClient scopedClient = client.newBuilder()
                    .connectTimeout(session.connectTimeoutMs, TimeUnit.MILLISECONDS)
                    .readTimeout(session.readTimeoutMs, TimeUnit.MILLISECONDS)
                    .build();

            Call call = scopedClient.newCall(request);
            session.activeCall = call;

            session.stage = "HTTP_RESPONSE";
            response = call.execute();
            session.httpResponseReceived = true;
            int status = response.code();
            session.httpStatusClass = statusClass(status);

            if (!response.isSuccessful()) {
                response.close();
                return failure("HTTP_STATUS_ERROR", session.httpStatusClass, true, session.stage, true);
            }

            ResponseBody body = response.body();
            if (body == null) {
                return failure("RESPONSE_EMPTY", session.httpStatusClass, true, "DOWNLOAD_COMPLETE", false);
            }

            long contentLength = body.contentLength();
            if (contentLength > effectiveMax) {
                body.close();
                return failure("RESPONSE_TOO_LARGE", session.httpStatusClass, true, "FILE_SIZE_GUARD", false);
            }

            session.stage = "FILE_WRITE";
            MessageDigest contentDigest = MessageDigest.getInstance("SHA-256");
            try (InputStream input = body.byteStream();
                 BufferedOutputStream output = new BufferedOutputStream(new FileOutputStream(tempFile))) {
                if (session.cancelled.get()) {
                    return failure("ABORTED", session.httpStatusClass, true, session.stage, false);
                }
                if (readyListener != null) {
                    session.ready = true;
                    readyListener.onReady(new DownloadResult(true, session.id, "SIM", session.httpStatusClass,
                            session.bytesWritten, effectiveMax, null, session.stage, false, TRANSPORT_TYPE));
                }
                byte[] buffer = new byte[DOWNLOAD_BUFFER_BYTES];
                long lastPublishedBytes = 0L;
                int read;
                while ((read = input.read(buffer)) != -1) {
                    if (session.cancelled.get()) {
                        return failure("ABORTED", session.httpStatusClass, true, session.stage, false);
                    }
                    if (session.bytesWritten > effectiveMax - read) {
                        return failure("RESPONSE_TOO_LARGE", session.httpStatusClass, true, "FILE_SIZE_GUARD", false);
                    }
                    output.write(buffer, 0, read);
                    contentDigest.update(buffer, 0, read);
                    session.bytesWritten += read;
                    if (readyListener != null && session.bytesWritten - lastPublishedBytes >= STREAM_PUBLISH_BYTES) {
                        output.flush();
                        lastPublishedBytes = session.bytesWritten;
                    }
                }
                output.flush();
            }

            if (session.bytesWritten == 0L) {
                return failure("RESPONSE_EMPTY", session.httpStatusClass, true, "DOWNLOAD_COMPLETE", false);
            }
            if (contentLength >= 0L && session.bytesWritten != contentLength) {
                return failure("FILE_IO_FAILURE", session.httpStatusClass, true, "FILE_WRITE", true);
            }
            StringBuilder digestHex = new StringBuilder(64);
            for (byte value : contentDigest.digest()) {
                digestHex.append(Character.forDigit((value >>> 4) & 15, 16));
                digestHex.append(Character.forDigit(value & 15, 16));
            }

            session.stage = "DOWNLOAD_COMPLETE";
            if (session.cancelled.get()) {
                return failure("ABORTED", session.httpStatusClass, true, session.stage, false);
            }
            return new DownloadResult(
                    true,
                    session.id,
                    "SIM",
                    session.httpStatusClass,
                    session.bytesWritten,
                    effectiveMax,
                    null,
                    session.stage,
                    false,
                    TRANSPORT_TYPE,
                    digestHex.toString()
            );
        } catch (Exception error) {
            String code = classifyException(error, session);
            return failure(code, session.httpStatusClass, session.httpResponseReceived, session.stage, isRetryable(code));
        } finally {
            session.activeCall = null;
            if (response != null) response.close();
        }
    }

    private void readChunkInternal(PluginCall call, DownloadSession session, int maxBytes) {
        call.resolve(readChunkState(session, maxBytes).toJSObject());
    }

    static final class ChunkReadResult {
        final boolean done;
        final boolean pending;
        final String dataText;
        final String dataBase64;
        final int bytesRead;
        final String errorCode;
        final boolean retryable;

        ChunkReadResult(boolean done, boolean pending, String dataText, int bytesRead,
                        @Nullable String errorCode, boolean retryable) {
            this.done = done;
            this.pending = pending;
            this.dataText = dataText;
            this.dataBase64 = null;
            this.bytesRead = bytesRead;
            this.errorCode = errorCode;
            this.retryable = retryable;
        }

        ChunkReadResult(byte[] bytes) {
            this.done = false;
            this.pending = false;
            this.dataText = null;
            this.dataBase64 = ByteString.of(bytes).base64();
            this.bytesRead = bytes.length;
            this.errorCode = null;
            this.retryable = false;
        }

        JSObject toJSObject() {
            JSObject result = new JSObject();
            result.put("done", done);
            result.put("pending", pending);
            result.put("bytesRead", bytesRead);
            result.put("stage", "FILE_READ");
            if (dataText != null) result.put("dataText", dataText);
            if (dataBase64 != null) result.put("dataBase64", dataBase64);
            if (errorCode != null) result.put("errorCode", errorCode);
            result.put("retryable", retryable);
            return result;
        }
    }

    static ChunkReadResult readChunkState(DownloadSession session, int maxBytes) {
        synchronized (session) {
            try {
                DownloadResult terminalResult = session.terminalResult;
                if (session.cancelled.get() || (terminalResult != null && !terminalResult.success)) {
                    return failureChunkState(terminalResult != null && !terminalResult.success ? terminalResult.errorCode : "ABORTED",
                            terminalResult != null && !terminalResult.success && terminalResult.retryable);
                }
                if (session.file == null) {
                    if (terminalResult != null && !terminalResult.success) {
                        return failureChunkState(terminalResult.errorCode, terminalResult.retryable);
                    }
                    return failureChunkState("INVALID_NATIVE_RESPONSE", false);
                }
                if (session.randomAccessFile == null) {
                    session.randomAccessFile = new RandomAccessFile(session.file, "r");
                }
                long available = session.file.length() - session.randomAccessFile.getFilePointer();
                if (available > 0L) {
                    int boundedRead = (int) Math.min((long) maxBytes, available);
                    byte[] buffer = new byte[boundedRead];
                    int read = session.randomAccessFile.read(buffer);
                    if (read <= 0) {
                        return new ChunkReadResult(false, true, null, 0, null, false);
                    }
                    if (session.ready) return new ChunkReadResult(read == buffer.length ? buffer : copyOf(buffer, read));
                    return new ChunkReadResult(false, false,
                            new String(buffer, 0, read, java.nio.charset.StandardCharsets.UTF_8),
                            read, null, false);
                }
                if (!session.finished || !session.completed) {
                    return new ChunkReadResult(false, true, null, 0, null, false);
                }
                if (terminalResult != null && !terminalResult.success) {
                    return failureChunkState(terminalResult.errorCode, terminalResult.retryable);
                }
                return new ChunkReadResult(true, false, null, 0, null, false);
            } catch (Exception ignored) {
                return failureChunkState("FILE_IO_FAILURE", false);
            }
        }
    }

    private static byte[] copyOf(byte[] source, int length) {
        byte[] result = new byte[length];
        System.arraycopy(source, 0, result, 0, length);
        return result;
    }

    private static DownloadResult failure(String code, String statusClass, boolean responseReceived, String stage, boolean retryable) {
        return new DownloadResult(
                false,
                null,
                responseReceived ? "SIM" : "NAO",
                statusClass,
                0L,
                0L,
                code,
                stage,
                retryable,
                TRANSPORT_TYPE
        );
    }

    private static JSObject failureChunk(String code, boolean retryable) {
        return failureChunkState(code, retryable).toJSObject();
    }

    private static ChunkReadResult failureChunkState(String code, boolean retryable) {
        return new ChunkReadResult(false, false, null, 0, code, retryable);
    }

    private static boolean isRetryable(String code) {
        return "NETWORK_UNREACHABLE".equals(code)
                || "DNS_FAILURE".equals(code)
                || "CONNECT_TIMEOUT".equals(code)
                || "READ_TIMEOUT".equals(code)
                || "HTTP_STATUS_ERROR".equals(code);
    }

    private static String classifyException(Exception error, DownloadSession session) {
        if (session.cancelled.get() || (error.getMessage() != null && error.getMessage().toLowerCase(Locale.US).contains("canceled"))) {
            return "ABORTED";
        }
        if (error instanceof UnknownHostException) return "DNS_FAILURE";
        if (error instanceof SocketTimeoutException) {
            return session.httpResponseReceived ? "READ_TIMEOUT" : "CONNECT_TIMEOUT";
        }
        if (error instanceof InterruptedIOException) {
            return session.httpResponseReceived ? "READ_TIMEOUT" : "CONNECT_TIMEOUT";
        }
        if (error instanceof SSLHandshakeException) return "TLS_HANDSHAKE_FAILED";
        if (error instanceof SSLPeerUnverifiedException) return "CERTIFICATE_REJECTED";
        if (error instanceof SecurityException) return "CLEAR_TEXT_NOT_PERMITTED";
        if (error instanceof ConnectException) return "NETWORK_UNREACHABLE";
        return "UNKNOWN_TRANSPORT_ERROR";
    }

    private static String statusClass(int status) {
        if (status >= 200 && status < 300) return "2XX";
        if (status >= 300 && status < 400) return "3XX";
        if (status >= 400 && status < 500) return "4XX";
        if (status >= 500 && status < 600) return "5XX";
        return "UNKNOWN";
    }

    private static Map<String, String> extractHeaders(JSObject headersObject) {
        if (headersObject == null) return Collections.emptyMap();
        Map<String, String> headers = new LinkedHashMap<>();
        Iterator<String> keys = headersObject.keys();
        while (keys.hasNext()) {
            String key = keys.next();
            String value = headersObject.getString(key);
            if (value != null && !value.isEmpty()) headers.put(key, value);
        }
        return headers;
    }

    private static int boundedTimeout(Integer value, int fallback) {
        if (value == null) return fallback;
        return Math.max(1_000, Math.min(120_000, value));
    }

    private static long boundedMax(Long value) {
        if (value == null || value < MIN_SAFE_FILE_BYTES) return DEFAULT_MAX_SOURCE_FILE_BYTES;
        return Math.min(DEFAULT_MAX_SOURCE_FILE_BYTES, value);
    }

    private static boolean isSupportedUrl(String value) {
        if (value == null || value.trim().isEmpty()) return false;
        try {
            String scheme = new URI(value.trim()).getScheme();
            return "http".equalsIgnoreCase(scheme) || "https".equalsIgnoreCase(scheme);
        } catch (Exception ignored) {
            return false;
        }
    }

    private static boolean isSyntheticUrl(String value) {
        String lower = value.toLowerCase(Locale.US);
        return lower.contains(".invalid") || lower.contains("synthetic") || lower.contains("example.com/invalid");
    }

    public static final class DownloadSession {
        private final String id;
        private final String url;
        private final Map<String, String> headers;
        private final int connectTimeoutMs;
        private final int readTimeoutMs;
        private final long requestedMaxBytes;
        private final AtomicBoolean cancelled = new AtomicBoolean(false);
        private volatile Call activeCall;
        private volatile File file;
        private volatile RandomAccessFile randomAccessFile;
        private volatile boolean ready;
        private volatile boolean finished;
        private volatile boolean completed;
        private volatile DownloadResult terminalResult;
        private volatile boolean httpResponseReceived;
        private volatile String httpStatusClass = "UNKNOWN";
        private volatile String stage = "REQUEST_START";
        private volatile long bytesWritten;
        private volatile long maxSourceFileBytes;

        public DownloadSession(String id, String url, Map<String, String> headers, int connectTimeoutMs,
                                int readTimeoutMs, long requestedMaxBytes) {
            this.id = id;
            this.url = url;
            this.headers = headers;
            this.connectTimeoutMs = connectTimeoutMs;
            this.readTimeoutMs = readTimeoutMs;
            this.requestedMaxBytes = requestedMaxBytes;
        }

        public String getId() { return id; }
        public String getUrl() { return url; }
        public File getFile() { return file; }
        public boolean isCompleted() { return completed; }
        public boolean isReady() { return ready; }
        public boolean isFinished() { return finished; }
        public boolean hasActiveCall() { return activeCall != null; }
        public long getBytesWritten() { return bytesWritten; }
        public String getStage() { return stage; }
        public String getHttpStatusClass() { return httpStatusClass; }

        synchronized DownloadResult finish(DownloadResult result) {
            terminalResult = cancelled.get() && result.success
                    ? failure("ABORTED", httpStatusClass, httpResponseReceived, stage, false)
                    : result;
            completed = terminalResult.success;
            finished = true;
            return terminalResult;
        }

        void cancel() {
            cancelled.set(true);
            Call call = activeCall;
            if (call != null) call.cancel();
        }

        public synchronized boolean closeAndDelete() {
            cancel();
            activeCall = null;
            boolean success = true;
            try {
                if (randomAccessFile != null) randomAccessFile.close();
            } catch (IOException ignored) {
                success = false;
            }
            randomAccessFile = null;
            if (file != null && file.exists()) {
                // Cache files are always private and owned by this import session.
                //noinspection ResultOfMethodCallIgnored
                if (file.delete()) file = null;
                else success = false; // Retain ownership so cleanup can retry after the writer closes.
            } else {
                file = null;
            }
            return success;
        }
    }
}
