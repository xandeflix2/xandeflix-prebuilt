package com.xandeflix.prebuilt.security;

/** Contrato mínimo testável da boundary de configuração local segura. */
public interface SecureSourceStore {
    void put(LocalSecureSourceRecord record) throws LocalSecureSourceStoreException;

    LocalSecureSourceRecord get(String sourceId) throws LocalSecureSourceStoreException;

    boolean has(String sourceId) throws LocalSecureSourceStoreException;

    void delete(String sourceId) throws LocalSecureSourceStoreException;
}
