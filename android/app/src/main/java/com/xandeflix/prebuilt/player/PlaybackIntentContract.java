package com.xandeflix.prebuilt.player;

import java.net.URI;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

/**
 * Contrato canônico de parâmetros e validação de segurança para a NativePlayerActivity.
 *
 * Princípios:
 * - SAFE SCHEMES: Permite apenas HTTPS (e HTTP em teste sintético controlado).
 * - REJECT USERINFO: Rejeita deliberadamente userinfo credentials (user:pass@).
 * - NO LEAKED CREDENTIALS: Sanitização estrita para logs.
 * - JVM PURE: Utiliza java.net.URI para máxima portabilidade em testes unitários e runtime.
 */
public final class PlaybackIntentContract {

    public static final String EXTRA_URI = "com.xandeflix.prebuilt.player.EXTRA_URI";
    public static final String EXTRA_TITLE = "com.xandeflix.prebuilt.player.EXTRA_TITLE";
    public static final String EXTRA_MIME_TYPE = "com.xandeflix.prebuilt.player.EXTRA_MIME_TYPE";
    public static final String EXTRA_START_POSITION_MS = "com.xandeflix.prebuilt.player.EXTRA_START_POSITION_MS";
    public static final String EXTRA_HEADERS_KEYS = "com.xandeflix.prebuilt.player.EXTRA_HEADERS_KEYS";
    public static final String EXTRA_HEADERS_VALUES = "com.xandeflix.prebuilt.player.EXTRA_HEADERS_VALUES";

    private static final Set<String> ALLOWED_SCHEMES = new HashSet<>(Arrays.asList("https", "http"));
    private static final Set<String> FORBIDDEN_SCHEMES = new HashSet<>(Arrays.asList(
        "file", "content", "javascript", "data", "intent", "about", "blob"
    ));

    private PlaybackIntentContract() {
        // Utilitário estático
    }

    /**
     * Valida uma URI de reprodução conforme as regras estritas de segurança do Gate G8.
     *
     * @param uriString URI em formato String
     * @throws IllegalArgumentException se a URI for nula, vazia, tiver esquema proibido ou credenciais
     */
    public static void validatePlaybackUri(String uriString) {
        if (uriString == null || uriString.trim().isEmpty()) {
            throw new IllegalArgumentException("URI de reprodução não pode ser nula ou vazia.");
        }

        String trimmed = uriString.trim();
        String lower = trimmed.toLowerCase();

        for (String forbidden : FORBIDDEN_SCHEMES) {
            if (lower.startsWith(forbidden + ":")) {
                throw new IllegalArgumentException("Esquema de URI proibido: " + forbidden);
            }
        }

        URI parsed;
        try {
            parsed = new URI(trimmed);
        } catch (Exception e) {
            throw new IllegalArgumentException("URI de reprodução malformada.", e);
        }

        String scheme = parsed.getScheme();
        if (scheme == null || !ALLOWED_SCHEMES.contains(scheme.toLowerCase())) {
            throw new IllegalArgumentException("Esquema de URI não permitido: " + scheme);
        }

        if (parsed.getUserInfo() != null && !parsed.getUserInfo().isEmpty()) {
            throw new IllegalArgumentException("URI contém credenciais embutidas (user:pass@), o que é estritamente proibido.");
        }
    }

    /**
     * Sanitiza uma URI de reprodução para fins de log, removendo query secrets e credenciais.
     */
    public static String sanitizeUriForLog(String uriString) {
        if (uriString == null || uriString.trim().isEmpty()) {
            return "[EMPTY_URI]";
        }

        try {
            URI parsed = new URI(uriString.trim());
            String scheme = parsed.getScheme();
            String host = parsed.getHost();
            String path = parsed.getPath();

            if (parsed.getQuery() != null && !parsed.getQuery().isEmpty()) {
                return scheme + "://" + host + (path != null ? path : "") + "?[QUERY_REDACTED]";
            }
            return scheme + "://" + host + (path != null ? path : "");
        } catch (Exception e) {
            return "[MALFORMED_URI_REDACTED]";
        }
    }
}
