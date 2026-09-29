package com.xandeflix.prebuilt.security;

/** Exceção sanitizada da persistência temporária do handle de reativação. */
public final class PendingDeviceReactivationStoreException extends Exception {
    public static final String PENDING_REACTIVATION_INVALID = "PENDING_REACTIVATION_INVALID";
    public static final String PENDING_REACTIVATION_STORE_UNAVAILABLE = "PENDING_REACTIVATION_STORE_UNAVAILABLE";
    public static final String PENDING_REACTIVATION_WRITE_FAILED = "PENDING_REACTIVATION_WRITE_FAILED";
    public static final String PENDING_REACTIVATION_READ_FAILED = "PENDING_REACTIVATION_READ_FAILED";
    public static final String PENDING_REACTIVATION_CLEAR_FAILED = "PENDING_REACTIVATION_CLEAR_FAILED";

    private final String code;

    public PendingDeviceReactivationStoreException(String code) {
        super(code);
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}
