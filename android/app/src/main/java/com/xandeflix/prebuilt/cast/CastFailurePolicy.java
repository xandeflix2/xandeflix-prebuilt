package com.xandeflix.prebuilt.cast;

/** Closed error vocabulary; never expose receiver/source exception messages. */
public final class CastFailurePolicy {
    private CastFailurePolicy() {}
    public static boolean known(String code) {
        return "CAST_NOT_CONNECTED".equals(code) || "CAST_UNSUPPORTED_MEDIA".equals(code)
                || "CAST_WIFI_REQUIRED".equals(code) || "CAST_LOAD_FAILED".equals(code)
                || "CAST_LOAD_TIMEOUT".equals(code) || "CAST_LOAD_CANCELLED".equals(code)
                || "CAST_MEDIA_ERROR".equals(code) || "CAST_LEASE_EXPIRED".equals(code);
    }
    public static String loadExceptionCode(Throwable error) {
        return error instanceof IllegalStateException && "CAST_WIFI_REQUIRED".equals(error.getMessage())
                ? "CAST_WIFI_REQUIRED" : "CAST_LOAD_FAILED";
    }
}
