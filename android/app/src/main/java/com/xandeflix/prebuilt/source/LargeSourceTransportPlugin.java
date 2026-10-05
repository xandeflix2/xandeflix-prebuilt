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
import java.io.RandomAccessFile;
import java.net.ConnectException;
import java.net.SocketTimeoutException;
import java.net.URI;
import java.net.UnknownHostException;
import java.util.Base64;
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

        executor.execute(() -> download(call, session));
    }

    @PluginMethod
    public void readChunk(PluginCall call) {
        if (call == null) {
            return;
        }
        String downloadId = call.getString("downloadId");
        DownloadSession session = downloadId == null ? null : sessions.get(downloadId);
        if (session == null || !session.completed || session.file == null) {
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
            session.cancelled.set(true);
            Call activeCall = session.activeCall;
            if (activeCall != null) {
                activeCall.cancel();
            }
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
            return obj;
        }
    }

    private void download(PluginCall call, DownloadSession session) {
        File cacheDir = getContext() == null ? null : getContext().getCacheDir();
        DownloadResult result = executeDownload(session, cacheDir, getSharedHttpClient());
        if (!result.success) {
            sessions.remove(session.id);
        }
        call.resolve(result.toJSObject());
    }

    public static DownloadResult executeDownload(DownloadSession session, File cacheDir, OkHttpClient client) {
        File tempFile = null;
        boolean keepFile = false;
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
            Response response = call.execute();
            session.activeCall = null;
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
            try (InputStream input = body.byteStream();
                 BufferedOutputStream output = new BufferedOutputStream(new FileOutputStream(tempFile))) {
                byte[] buffer = new byte[DOWNLOAD_BUFFER_BYTES];
                int read;
                while ((read = input.read(buffer)) != -1) {
                    if (session.cancelled.get()) {
                        return failure("ABORTED", session.httpStatusClass, true, session.stage, false);
                    }
                    if (session.bytesWritten > effectiveMax - read) {
                        return failure("RESPONSE_TOO_LARGE", session.httpStatusClass, true, "FILE_SIZE_GUARD", false);
                    }
                    output.write(buffer, 0, read);
                    session.bytesWritten += read;
                }
                output.flush();
            }

            if (session.bytesWritten == 0L) {
                return failure("RESPONSE_EMPTY", session.httpStatusClass, true, "DOWNLOAD_COMPLETE", false);
            }

            session.stage = "DOWNLOAD_COMPLETE";
            session.completed = true;
            keepFile = true;
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
                    TRANSPORT_TYPE
            );
        } catch (Exception error) {
            String code = classifyException(error, session);
            return failure(code, session.httpStatusClass, session.httpResponseReceived, session.stage, isRetryable(code));
        } finally {
            if (!keepFile) {
                session.closeAndDelete();
            }
        }
    }

    private void readChunkInternal(PluginCall call, DownloadSession session, int maxBytes) {
        synchronized (session) {
            try {
                if (session.randomAccessFile == null) {
                    session.randomAccessFile = new RandomAccessFile(session.file, "r");
                }
                byte[] buffer = new byte[maxBytes];
                int read = session.randomAccessFile.read(buffer);
                JSObject result = new JSObject();
                if (read < 0) {
                    result.put("done", true);
                    result.put("bytesRead", 0);
                } else {
                    result.put("done", false);
                    result.put("dataText", new String(buffer, 0, read, java.nio.charset.StandardCharsets.UTF_8));
                    result.put("bytesRead", read);
                }
                result.put("stage", "FILE_READ");
                call.resolve(result);
            } catch (Exception ignored) {
                call.resolve(failureChunk("FILE_IO_FAILURE", false));
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
        JSObject result = new JSObject();
        result.put("done", true);
        result.put("bytesRead", 0);
        result.put("stage", "FILE_READ");
        result.put("errorCode", code);
        result.put("retryable", retryable);
        return result;
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
        private volatile boolean completed;
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
        public long getBytesWritten() { return bytesWritten; }
        public String getStage() { return stage; }
        public String getHttpStatusClass() { return httpStatusClass; }

        public synchronized boolean closeAndDelete() {
            if (activeCall != null) {
                activeCall.cancel();
                activeCall = null;
            }
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
                success = file.delete() && success;
            }
            file = null;
            return success;
        }
    }
}
