package com.xandeflix.prebuilt.security;

/** Exceção sanitizada da boundary local segura. Nunca carrega plaintext de source. */
public final class LocalSecureSourceStoreException extends Exception {
    public static final String INVALID_SOURCE_RECORD = "INVALID_SOURCE_RECORD";
    public static final String INVALID_SOURCE_ID = "INVALID_SOURCE_ID";
    public static final String UNSUPPORTED_SCHEMA = "UNSUPPORTED_SCHEMA";
    public static final String LOCAL_SOURCE_CONFIG_NOT_FOUND = "LOCAL_SOURCE_CONFIG_NOT_FOUND";
    public static final String LOCAL_SOURCE_CONFIG_UNAVAILABLE = "LOCAL_SOURCE_CONFIG_UNAVAILABLE";
    public static final String LOCAL_SOURCE_CONFIG_WRITE_FAILED = "LOCAL_SOURCE_CONFIG_WRITE_FAILED";

    private final String code;

    public LocalSecureSourceStoreException(String code) {
        super(code);
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}
