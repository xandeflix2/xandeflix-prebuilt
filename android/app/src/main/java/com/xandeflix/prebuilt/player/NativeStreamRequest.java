package com.xandeflix.prebuilt.player;

import androidx.media3.common.PlaybackException;
import androidx.media3.datasource.DefaultHttpDataSource;
import androidx.media3.datasource.HttpDataSource;

import java.net.URI;
import java.net.URL;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * Xandeflix Prebuilt — NativeStreamRequest (Unidade de Transporte T1)
 *
 * Encapsula uma requisição de mídia nativa com:
 * 1. Resolução estrita de candidatos (M3U Direct vs Xtream);
 * 2. Allowlist e sanitização rigorosa de cabeçalhos HTTP (anti-injection);
 * 3. Precedência determinística de User-Agent;
 * 4. Fallback de candidatos restrito a códigos de erro HTTP inválidos;
 * 5. Mascaramento estrito de credenciais em URLs e headers para logs seguros.
 */
public final class NativeStreamRequest {

    public static final String DEFAULT_USER_AGENT =
            "Mozilla/5.0 (Linux; Android 12; Fire TV) AppleWebKit/537.36 Chrome/122.0.0.0 Mobile Safari/537.36";

    private static final Set<String> ALLOWED_HEADER_NAMES = Collections.unmodifiableSet(new HashSet<>(Arrays.asList(
            "User-Agent",
            "Referer",
            "Origin",
            "Accept",
            "Connection",
            "Authorization"
    )));

    private final String rawUrl;
    private final String mediaUrl;
    private final String userAgent;
    private final Map<String, String> requestHeaders;
    private final boolean hasPipeHeaders;
    private final int candidateIndex;
    private final int candidateCount;

    private NativeStreamRequest(
            String rawUrl,
            String mediaUrl,
            String userAgent,
            Map<String, String> requestHeaders,
            boolean hasPipeHeaders,
            int candidateIndex,
            int candidateCount
    ) {
        this.rawUrl = rawUrl != null ? rawUrl.trim() : "";
        this.mediaUrl = mediaUrl != null ? mediaUrl.trim() : "";
        this.userAgent = userAgent != null && !userAgent.trim().isEmpty() ? userAgent.trim() : DEFAULT_USER_AGENT;
        this.requestHeaders = Collections.unmodifiableMap(new LinkedHashMap<>(requestHeaders));
        this.hasPipeHeaders = hasPipeHeaders;
        this.candidateIndex = candidateIndex;
        this.candidateCount = candidateCount;
    }

    /**
     * Constrói a lista determinística de requisições candidatas a partir de uma URL bruta.
     */
    public static List<NativeStreamRequest> fromRawUrl(String rawUrl) {
        return fromUrlWithHeaders(rawUrl, null, null);
    }

    /**
     * Constrói a lista determinística de candidatos suportando headers explícitos e override de User-Agent.
     */
    public static List<NativeStreamRequest> fromUrlWithHeaders(
            String rawUrl,
            Map<String, String> explicitHeaders,
            String explicitUserAgent
    ) {
        ParsedRawStream parsedStream = parseRawStream(rawUrl);

        // Precedência de User-Agent:
        // 1. explicitUserAgent informado nominalmente;
        // 2. User-Agent em explicitHeaders;
        // 3. User-Agent parsed dos pipe headers;
        // 4. DEFAULT_USER_AGENT.
        String resolvedUserAgent = DEFAULT_USER_AGENT;
        if (explicitUserAgent != null && !explicitUserAgent.trim().isEmpty()) {
            resolvedUserAgent = explicitUserAgent.trim();
        } else if (explicitHeaders != null && explicitHeaders.containsKey("User-Agent")) {
            String val = explicitHeaders.get("User-Agent");
            if (val != null && !val.trim().isEmpty()) {
                resolvedUserAgent = val.trim();
            }
        } else if (parsedStream.userAgentOverride != null) {
            resolvedUserAgent = parsedStream.userAgentOverride;
        }

        // Consolidação dos Headers com Allowlist e Sanitização
        Map<String, String> consolidatedHeaders = new LinkedHashMap<>();
        consolidatedHeaders.put("Accept", "*/*");
        consolidatedHeaders.put("Connection", "keep-alive");

        // Adiciona headers do pipe
        consolidatedHeaders.putAll(parsedStream.requestHeaders);

        // Adiciona headers explícitos autorizados
        if (explicitHeaders != null) {
            for (Map.Entry<String, String> entry : explicitHeaders.entrySet()) {
                String normName = normalizeHeaderName(entry.getKey());
                if (normName != null && !normName.isEmpty() && !"User-Agent".equals(normName)) {
                    String sanitizedVal = sanitizeHeaderValue(entry.getValue());
                    if (!sanitizedVal.isEmpty()) {
                        consolidatedHeaders.put(normName, sanitizedVal);
                    }
                }
            }
        }

        // Determina lista determinística de URLs candidatas
        List<String> candidateUrls = buildCandidateUrls(parsedStream.mediaUrl);
        List<NativeStreamRequest> requests = new ArrayList<>(candidateUrls.size());

        for (int index = 0; index < candidateUrls.size(); index++) {
            requests.add(
                    new NativeStreamRequest(
                            rawUrl,
                            candidateUrls.get(index),
                            resolvedUserAgent,
                            consolidatedHeaders,
                            parsedStream.hasPipeHeaders,
                            index + 1,
                            candidateUrls.size()
                    )
            );
        }

        return requests;
    }

    public String getRawUrl() {
        return rawUrl;
    }

    public String getMediaUrl() {
        return mediaUrl;
    }

    public String getMaskedUrl() {
        return maskStreamUrl(mediaUrl);
    }

    /** Metadados estritamente seguros para telemetria nativa. */
    public String getDiagnosticFingerprint() {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(mediaUrl.getBytes(StandardCharsets.UTF_8));
            StringBuilder out = new StringBuilder();
            for (int i = 0; i < 6; i++) out.append(String.format(Locale.US, "%02x", digest[i]));
            return out.toString();
        } catch (Exception ignored) { return "unavailable"; }
    }

    public String getDiagnosticScheme() {
        try { return new URI(mediaUrl).getScheme() == null ? "unknown" : new URI(mediaUrl).getScheme().toLowerCase(Locale.US); }
        catch (Exception ignored) { return "unknown"; }
    }

    public String getDiagnosticPortClass() {
        try {
            URI uri = new URI(mediaUrl); int port = uri.getPort();
            if (port < 0) return "default";
            return port == 80 || port == 443 ? "default" : "explicit";
        } catch (Exception ignored) { return "unknown"; }
    }

    public String getDiagnosticContainerHint() {
        String path;
        try { path = new URI(mediaUrl).getPath(); } catch (Exception ignored) { return "unknown"; }
        if (path == null) return "unknown";
        String lower = path.toLowerCase(Locale.US);
        if (lower.endsWith(".m3u8")) return "hls";
        if (lower.endsWith(".mpd")) return "dash";
        if (lower.endsWith(".mp4")) return "mp4";
        if (lower.endsWith(".ts")) return "mpegts";
        return "unknown";
    }

    public String getDiagnosticHeaderNames() { return new ArrayList<>(requestHeaders.keySet()).toString(); }

    public String getUserAgent() {
        return userAgent;
    }

    public boolean isCustomUserAgentUsed() {
        return !DEFAULT_USER_AGENT.equals(userAgent);
    }

    public Map<String, String> getRequestHeaders() {
        return requestHeaders;
    }

    public boolean hasPipeHeaders() {
        return hasPipeHeaders;
    }

    public int getCandidateIndex() {
        return candidateIndex;
    }

    public int getCandidateCount() {
        return candidateCount;
    }

    /**
     * Retorna resumo seguro de cabeçalhos para diagnóstico (SEM VALORES SENSÍVEIS).
     */
    public String getHeaderSummary() {
        List<String> names = new ArrayList<>();
        for (String k : requestHeaders.keySet()) {
            if ("Authorization".equals(k)) {
                names.add("Authorization=[PRESENT_REDACTED]");
            } else {
                names.add(k);
            }
        }
        if (isCustomUserAgentUsed()) {
            names.add("User-Agent=[CUSTOM]");
        }
        return names.toString();
    }

    /**
     * Cria fábrica de DataSource HTTP com timeouts e cabeçalhos validados.
     */
    public DefaultHttpDataSource.Factory createHttpDataSourceFactory() {
        return new DefaultHttpDataSource.Factory()
                .setUserAgent(userAgent)
                .setAllowCrossProtocolRedirects(true)
                .setConnectTimeoutMs(30000)
                .setReadTimeoutMs(30000)
                .setDefaultRequestProperties(new LinkedHashMap<>(requestHeaders));
    }

    /**
     * Avalia se a falha no candidato atual qualifica a tentativa do próximo candidato.
     * Somente HTTP_BAD_STATUS ou InvalidResponseCodeException são elegíveis.
     */
    public static boolean shouldTryNextCandidate(PlaybackException error) {
        return error != null
                && (
                error.errorCode == PlaybackException.ERROR_CODE_IO_BAD_HTTP_STATUS
                        || findInvalidResponseCodeException(error) != null
        );
    }

    public static HttpDataSource.InvalidResponseCodeException findInvalidResponseCodeException(Throwable error) {
        Throwable current = error;
        while (current != null) {
            if (current instanceof HttpDataSource.InvalidResponseCodeException) {
                return (HttpDataSource.InvalidResponseCodeException) current;
            }
            current = current.getCause();
        }
        return null;
    }

    public static String describeHttpStatus(Throwable error) {
        HttpDataSource.InvalidResponseCodeException responseError =
                findInvalidResponseCodeException(error);
        if (responseError == null) {
            return "unknown";
        }
        return String.valueOf(responseError.responseCode);
    }

    /**
     * Mascara credenciais embutidas na URL (query params, user:pass e path de autenticação).
     */
    public static String maskStreamUrl(String url) {
        if (url == null || url.trim().isEmpty()) {
            return "[EMPTY_URL]";
        }

        try {
            URI uri = new URI(url.trim());
            String scheme = uri.getScheme() != null ? uri.getScheme() : "http";
            String host = uri.getHost();
            int port = uri.getPort();
            String authority;
            if (host != null) {
                authority = (port > 0 && port != 80 && port != 443) ? (host + ":" + port) : host;
            } else {
                authority = uri.getAuthority() != null ? uri.getAuthority() : "unknown-host";
                if (authority.contains("@")) {
                    authority = authority.substring(authority.indexOf("@") + 1);
                }
            }

            String path = uri.getPath();
            if (path == null || path.isEmpty() || "/".equals(path)) {
                return scheme + "://" + authority + "/...";
            }

            int lastSlash = path.lastIndexOf('/');
            String lastSegment = (lastSlash >= 0 && lastSlash < path.length() - 1)
                    ? path.substring(lastSlash + 1)
                    : "";

            if (lastSegment.isEmpty()) {
                return scheme + "://" + authority + "/...";
            }

            return scheme + "://" + authority + "/.../" + lastSegment;
        } catch (Exception error) {
            return "[INVALID_URL_REDACTED]";
        }
    }

    /**
     * Geração determinística de candidatos de URL.
     * REGRA CANÔNICA:
     * - O primeiro candidato é SEMPRE a URL original recebida.
     * - Se a URL for um arquivo de mídia direto (ex: .mp4, .mkv, .m3u8 puro), NÃO gera candidatos Xtream espúrios.
     * - Variantes Xtream só são geradas para padrões numéricos sem extensão direta de arquivo VOD.
     */
    private static List<String> buildCandidateUrls(String mediaUrl) {
        List<String> candidates = new ArrayList<>();
        if (mediaUrl == null || mediaUrl.trim().isEmpty()) {
            return candidates;
        }

        String trimmed = mediaUrl.trim();
        addUnique(candidates, trimmed);

        try {
            URL parsedUrl = new URL(trimmed);
            String path = parsedUrl.getPath();
            List<String> segments = splitPathSegments(path);

            if (segments.size() >= 3) {
                String streamId = segments.get(segments.size() - 1);
                String password = segments.get(segments.size() - 2);
                String username = segments.get(segments.size() - 3);
                String firstSegment = segments.get(0).toLowerCase(Locale.US);
                String origin = parsedUrl.getProtocol() + "://" + parsedUrl.getAuthority();
                String querySuffix = parsedUrl.getQuery() != null ? "?" + parsedUrl.getQuery() : "";

                // Se o arquivo for um VOD direto (ex: .mp4, .mkv), é M3U Direto: não criar variantes de Live!
                String lowerStreamId = streamId.toLowerCase(Locale.US);
                boolean isDirectVodFile = lowerStreamId.endsWith(".mp4")
                        || lowerStreamId.endsWith(".mkv")
                        || lowerStreamId.endsWith(".avi")
                        || lowerStreamId.endsWith(".mov");

                if (isDirectVodFile) {
                    return candidates;
                }

                boolean isKnownTypedPath =
                        "live".equals(firstSegment)
                                || "movie".equals(firstSegment)
                                || "series".equals(firstSegment)
                                || "vod".equals(firstSegment);

                if (!isKnownTypedPath && isNumericStreamId(streamId)) {
                    addUnique(
                            candidates,
                            origin + "/live/" + username + "/" + password + "/" + streamId + ".ts" + querySuffix
                    );
                    addUnique(
                            candidates,
                            origin + "/live/" + username + "/" + password + "/" + streamId + querySuffix
                    );
                    addUnique(
                            candidates,
                            origin + "/" + username + "/" + password + "/" + streamId + ".ts" + querySuffix
                    );
                }

                if ("live".equals(firstSegment) && isNumericStreamId(streamId)) {
                    addUnique(
                            candidates,
                            origin + buildPathPrefix(segments) + "/" + streamId + ".ts" + querySuffix
                    );
                }
            }
        } catch (Exception error) {
            return candidates;
        }

        return candidates;
    }

    private static void addUnique(List<String> list, String item) {
        if (item != null && !item.isEmpty() && !list.contains(item)) {
            list.add(item);
        }
    }

    private static List<String> splitPathSegments(String path) {
        String[] rawSegments = path != null ? path.split("/") : new String[0];
        List<String> segments = new ArrayList<>();
        for (String rawSegment : rawSegments) {
            String segment = rawSegment != null ? rawSegment.trim() : "";
            if (!segment.isEmpty()) {
                segments.add(segment);
            }
        }
        return segments;
    }

    private static boolean isNumericStreamId(String streamId) {
        if (streamId == null || streamId.isEmpty()) {
            return false;
        }
        String cleaned = streamId;
        int dotIdx = cleaned.indexOf('.');
        if (dotIdx > 0) {
            cleaned = cleaned.substring(0, dotIdx);
        }
        if (cleaned.isEmpty()) {
            return false;
        }
        for (int i = 0; i < cleaned.length(); i++) {
            if (!Character.isDigit(cleaned.charAt(i))) {
                return false;
            }
        }
        return true;
    }

    private static String buildPathPrefix(List<String> segments) {
        StringBuilder builder = new StringBuilder();
        for (int index = 0; index < segments.size() - 1; index++) {
            builder.append("/").append(segments.get(index));
        }
        return builder.toString();
    }

    private static ParsedRawStream parseRawStream(String rawUrl) {
        String trimmedUrl = rawUrl != null ? rawUrl.trim() : "";
        String[] parts = trimmedUrl.split("\\|");
        String mediaUrl = parts.length > 0 ? parts[0].trim() : trimmedUrl;
        Map<String, String> parsedHeaders = new LinkedHashMap<>();

        for (int index = 1; index < parts.length; index++) {
            parseHeaderPart(parts[index], parsedHeaders);
        }

        String userAgentOverride = parsedHeaders.remove("User-Agent");
        return new ParsedRawStream(
                mediaUrl,
                userAgentOverride != null && !userAgentOverride.trim().isEmpty() ? userAgentOverride.trim() : null,
                parsedHeaders,
                parts.length > 1
        );
    }

    private static void parseHeaderPart(String headerPart, Map<String, String> parsedHeaders) {
        if (headerPart == null || headerPart.trim().isEmpty()) {
            return;
        }

        String[] assignments = headerPart.split("&");
        for (String assignment : assignments) {
            int equalsIndex = assignment.indexOf('=');
            if (equalsIndex <= 0 || equalsIndex >= assignment.length() - 1) {
                continue;
            }

            String rawName = decodeHeaderValue(assignment.substring(0, equalsIndex));
            String rawValue = decodeHeaderValue(assignment.substring(equalsIndex + 1));
            String headerName = normalizeHeaderName(rawName);
            String headerValue = sanitizeHeaderValue(rawValue);

            if (headerName != null && !headerName.isEmpty() && !headerValue.isEmpty()) {
                parsedHeaders.put(headerName, headerValue);
            }
        }
    }

    private static String decodeHeaderValue(String value) {
        if (value == null || value.trim().isEmpty()) {
            return "";
        }
        try {
            return URLDecoder.decode(value.trim(), "UTF-8");
        } catch (Exception error) {
            return value.trim();
        }
    }

    /**
     * Valida e normaliza o nome do cabeçalho contra a allowlist estrita.
     * Retorna null se o header não estiver na allowlist ou tiver caracteres de injeção.
     */
    public static String normalizeHeaderName(String headerName) {
        if (headerName == null) {
            return null;
        }

        String trimmedName = headerName.trim();
        if (!isHeaderNameSafe(trimmedName)) {
            return null;
        }

        String normalized = trimmedName.toLowerCase(Locale.US).replace('_', '-');

        if ("user-agent".equals(normalized) || "useragent".equals(normalized)) {
            return "User-Agent";
        }
        if ("referer".equals(normalized) || "referrer".equals(normalized)) {
            return "Referer";
        }
        if ("origin".equals(normalized)) {
            return "Origin";
        }
        if ("accept".equals(normalized)) {
            return "Accept";
        }
        if ("connection".equals(normalized)) {
            return "Connection";
        }
        if ("authorization".equals(normalized)) {
            return "Authorization";
        }

        // Qualquer header fora da allowlist é sumariamente rejeitado
        return null;
    }

    public static boolean isHeaderNameSafe(String headerName) {
        return headerName != null
                && !headerName.isEmpty()
                && headerName.indexOf('\r') == -1
                && headerName.indexOf('\n') == -1
                && headerName.indexOf(':') == -1;
    }

    public static String sanitizeHeaderValue(String headerValue) {
        if (headerValue == null) {
            return "";
        }
        return headerValue
                .replace("\r", "")
                .replace("\n", "")
                .trim();
    }

    private static final class ParsedRawStream {
        private final String mediaUrl;
        private final String userAgentOverride;
        private final Map<String, String> requestHeaders;
        private final boolean hasPipeHeaders;

        private ParsedRawStream(
                String mediaUrl,
                String userAgentOverride,
                Map<String, String> requestHeaders,
                boolean hasPipeHeaders
        ) {
            this.mediaUrl = mediaUrl;
            this.userAgentOverride = userAgentOverride;
            this.requestHeaders = requestHeaders;
            this.hasPipeHeaders = hasPipeHeaders;
        }
    }
}
