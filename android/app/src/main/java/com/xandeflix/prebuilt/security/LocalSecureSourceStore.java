package com.xandeflix.prebuilt.security;

import android.content.Context;
import android.content.SharedPreferences;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import com.xandeflix.prebuilt.BuildConfig;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.security.KeyStore;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Implementação Android da boundary local segura.
 *
 * A chave é não exportável no AndroidKeyStore. O SharedPreferences privado do
 * app contém somente ciphertext, IV e metadata não secreta do envelope.
 */
public final class LocalSecureSourceStore implements SecureSourceStore {
    private static final String KEYSTORE_PROVIDER = "AndroidKeyStore";
    private static final String KEY_ALIAS = "xandeflix_local_source_aes_v1";
    private static final String PREFERENCES_NAME = "xandeflix_local_secure_source_store_v1";
    private static final String PREFLIGHT_PREFERENCES_NAME = "xandeflix_local_secure_store_preflight_v1";
    private static final String PREFLIGHT_KEY = "synthetic_probe";
    private static final String RECORD_PREFIX = "record:";
    private static final String ENVELOPE_SCHEMA = "schemaVersion";
    private static final String ENVELOPE_SOURCE_VERSION = "sourceVersion";
    private static final String ENVELOPE_PROTOCOL = "protocol";
    private static final String ENVELOPE_IV = "iv";
    private static final String ENVELOPE_CIPHERTEXT = "ciphertext";
    private static final int GCM_TAG_LENGTH_BITS = 128;
    private static final int IV_LENGTH_BYTES = 12;

    private final SharedPreferences preferences;
    private final Context applicationContext;
    private final KeyStore keyStore;

    public LocalSecureSourceStore(Context context) throws LocalSecureSourceStoreException {
        if (context == null) {
            throw new LocalSecureSourceStoreException(LocalSecureSourceStoreException.LOCAL_SOURCE_CONFIG_UNAVAILABLE);
        }
        Context appContext = context.getApplicationContext();
        if (appContext == null) {
            appContext = context;
        }
        this.applicationContext = appContext;
        this.preferences = appContext.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE);
        try {
            this.keyStore = KeyStore.getInstance(KEYSTORE_PROVIDER);
            this.keyStore.load(null);
        } catch (Exception error) {
            throw new LocalSecureSourceStoreException(LocalSecureSourceStoreException.LOCAL_SOURCE_CONFIG_UNAVAILABLE);
        }
    }

    @Override
    public synchronized void put(LocalSecureSourceRecord record) throws LocalSecureSourceStoreException {
        if (record == null) {
            throw new LocalSecureSourceStoreException(LocalSecureSourceStoreException.INVALID_SOURCE_RECORD);
        }

        try {
            SecretKey key = getKey(true);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            // O AndroidKeyStore deve gerar o IV para respeitar randomized encryption.
            cipher.init(Cipher.ENCRYPT_MODE, key);
            byte[] iv = cipher.getIV();
            if (iv == null || iv.length != IV_LENGTH_BYTES) {
                throw new LocalSecureSourceStoreException(
                        LocalSecureSourceStoreException.LOCAL_SOURCE_CONFIG_WRITE_FAILED);
            }
            byte[] plaintext = record.toJson().toString().getBytes(StandardCharsets.UTF_8);
            byte[] ciphertext = cipher.doFinal(plaintext);

            JSONObject envelope = new JSONObject();
            envelope.put(ENVELOPE_SCHEMA, LocalSecureSourceRecord.CURRENT_SCHEMA_VERSION);
            envelope.put(ENVELOPE_SOURCE_VERSION, record.getSourceVersion());
            envelope.put(ENVELOPE_PROTOCOL, record.getProtocol());
            envelope.put(ENVELOPE_IV, Base64.encodeToString(iv, Base64.NO_WRAP));
            envelope.put(ENVELOPE_CIPHERTEXT, Base64.encodeToString(ciphertext, Base64.NO_WRAP));

            boolean committed = preferences.edit()
                    .putString(storageKey(record.getSourceId()), envelope.toString())
                    .commit();
            if (!committed) {
                throw new LocalSecureSourceStoreException(
                        LocalSecureSourceStoreException.LOCAL_SOURCE_CONFIG_WRITE_FAILED);
            }
        } catch (LocalSecureSourceStoreException error) {
            throw error;
        } catch (Exception error) {
            throw new LocalSecureSourceStoreException(
                    LocalSecureSourceStoreException.LOCAL_SOURCE_CONFIG_WRITE_FAILED);
        }
    }

    @Override
    public synchronized LocalSecureSourceRecord get(String sourceId) throws LocalSecureSourceStoreException {
        LocalSecureSourceRecord.validateSourceId(sourceId);
        String rawEnvelope = preferences.getString(storageKey(sourceId), null);
        if (rawEnvelope == null) {
            return null;
        }

        try {
            JSONObject envelope = new JSONObject(rawEnvelope);
            int schemaVersion = envelope.getInt(ENVELOPE_SCHEMA);
            if (schemaVersion != LocalSecureSourceRecord.CURRENT_SCHEMA_VERSION) {
                throw new LocalSecureSourceStoreException(LocalSecureSourceStoreException.UNSUPPORTED_SCHEMA);
            }

            String encodedIv = envelope.getString(ENVELOPE_IV);
            String encodedCiphertext = envelope.getString(ENVELOPE_CIPHERTEXT);
            byte[] iv = Base64.decode(encodedIv, Base64.DEFAULT);
            byte[] ciphertext = Base64.decode(encodedCiphertext, Base64.DEFAULT);
            if (iv.length != IV_LENGTH_BYTES || ciphertext.length == 0) {
                throw new LocalSecureSourceStoreException(
                        LocalSecureSourceStoreException.LOCAL_SOURCE_CONFIG_UNAVAILABLE);
            }

            SecretKey key = getKey(false);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv));
            byte[] plaintext = cipher.doFinal(ciphertext);
            JSONObject recordJson = new JSONObject(new String(plaintext, StandardCharsets.UTF_8));
            LocalSecureSourceRecord record = LocalSecureSourceRecord.fromJson(recordJson);

            if (!sourceId.equals(record.getSourceId())
                    || record.getSourceVersion() != envelope.getInt(ENVELOPE_SOURCE_VERSION)
                    || !record.getProtocol().equals(envelope.getString(ENVELOPE_PROTOCOL))) {
                throw new LocalSecureSourceStoreException(
                        LocalSecureSourceStoreException.LOCAL_SOURCE_CONFIG_UNAVAILABLE);
            }
            return record;
        } catch (LocalSecureSourceStoreException error) {
            throw error;
        } catch (Exception error) {
            // Inclui ciphertext corrompido, auth tag inválida e chave ausente.
            throw new LocalSecureSourceStoreException(
                    LocalSecureSourceStoreException.LOCAL_SOURCE_CONFIG_UNAVAILABLE);
        }
    }

    @Override
    public synchronized boolean has(String sourceId) throws LocalSecureSourceStoreException {
        LocalSecureSourceRecord.validateSourceId(sourceId);
        return preferences.contains(storageKey(sourceId));
    }

    /** DEBUG-only staged read diagnosis. It never returns decrypted configuration data. */
    synchronized JSONObject debugReadDiagnosis(String sourceId) throws LocalSecureSourceStoreException {
        if (!BuildConfig.DEBUG) {
            throw new LocalSecureSourceStoreException(
                    LocalSecureSourceStoreException.LOCAL_SOURCE_CONFIG_UNAVAILABLE);
        }
        LocalSecureSourceRecord.validateSourceId(sourceId);
        JSONObject result = new JSONObject();
        putString(result, "branch", "OTHER");
        putBoolean(result, "recordPresent", false);
        putBoolean(result, "ivPresent", false);
        putBoolean(result, "ciphertextPresent", false);
        putString(result, "ciphertextLengthClass", "ZERO");
        putBoolean(result, "keyAliasPresent", false);
        putString(result, "keyAlgorithm", "");
        putString(result, "exceptionClass", "");
        putString(result, "causeChain", "");

        String rawEnvelope = preferences.getString(storageKey(sourceId), null);
        if (rawEnvelope == null) {
            putString(result, "branch", "NO_RECORD");
            return result;
        }
        putBoolean(result, "recordPresent", true);
        try {
            JSONObject envelope = new JSONObject(rawEnvelope);
            if (envelope.getInt(ENVELOPE_SCHEMA) != LocalSecureSourceRecord.CURRENT_SCHEMA_VERSION) {
                putString(result, "branch", "SCHEMA_UNSUPPORTED");
                return result;
            }
            byte[] iv = Base64.decode(envelope.getString(ENVELOPE_IV), Base64.DEFAULT);
            byte[] ciphertext = Base64.decode(envelope.getString(ENVELOPE_CIPHERTEXT), Base64.DEFAULT);
            putBoolean(result, "ivPresent", iv.length > 0);
            putBoolean(result, "ciphertextPresent", ciphertext.length > 0);
            putString(result, "ciphertextLengthClass", ciphertext.length == 0 ? "ZERO"
                    : ciphertext.length < 32 ? "SMALL" : "NORMAL");
            if (iv.length != IV_LENGTH_BYTES || ciphertext.length == 0) {
                putString(result, "branch", "ENVELOPE_INVALID");
                return result;
            }
            boolean aliasPresent = keyStore.containsAlias(KEY_ALIAS);
            putBoolean(result, "keyAliasPresent", aliasPresent);
            if (!aliasPresent) {
                putString(result, "branch", "KEY_ALIAS_MISSING");
                return result;
            }
            Key rawKey = keyStore.getKey(KEY_ALIAS, null);
            if (!(rawKey instanceof SecretKey)) {
                putString(result, "branch", "KEY_UNAVAILABLE");
                return result;
            }
            SecretKey key = (SecretKey) rawKey;
            putString(result, "keyAlgorithm", key.getAlgorithm());
            byte[] plaintext = null;
            try {
                Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
                cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv));
                plaintext = cipher.doFinal(ciphertext);
                LocalSecureSourceRecord record = LocalSecureSourceRecord.fromJson(
                        new JSONObject(new String(plaintext, StandardCharsets.UTF_8)));
                if (!sourceId.equals(record.getSourceId())
                        || record.getSourceVersion() != envelope.getInt(ENVELOPE_SOURCE_VERSION)
                        || !record.getProtocol().equals(envelope.getString(ENVELOPE_PROTOCOL))) {
                    putString(result, "branch", "ENVELOPE_RECORD_MISMATCH");
                    return result;
                }
                putString(result, "branch", "READ_SUCCESS");
                return result;
            } catch (LocalSecureSourceStoreException error) {
                putString(result, "branch", "RECORD_SCHEMA_INVALID");
                putString(result, "exceptionClass", sanitizeExceptionClass(error));
                return result;
            } catch (Exception error) {
                putString(result, "branch", "DECRYPT_FAILED");
                putString(result, "exceptionClass", sanitizeExceptionClass(error));
                putString(result, "causeChain", sanitizeCauseChain(error));
                return result;
            } finally {
                if (plaintext != null) java.util.Arrays.fill(plaintext, (byte) 0);
            }
        } catch (Exception error) {
            putString(result, "branch", "ENVELOPE_INVALID");
            putString(result, "exceptionClass", sanitizeExceptionClass(error));
            putString(result, "causeChain", sanitizeCauseChain(error));
            return result;
        }
    }

    @Override
    public synchronized void delete(String sourceId) throws LocalSecureSourceStoreException {
        LocalSecureSourceRecord.validateSourceId(sourceId);
        boolean committed = preferences.edit().remove(storageKey(sourceId)).commit();
        if (!committed) {
            throw new LocalSecureSourceStoreException(
                    LocalSecureSourceStoreException.LOCAL_SOURCE_CONFIG_WRITE_FAILED);
        }
    }

    private String storageKey(String sourceId) {
        return RECORD_PREFIX + sourceId;
    }

    /** Retorna somente capacidades booleanas; nunca lê nem cria registro de source. */
    public synchronized JSONObject securePreflight() {
        JSONObject result = new JSONObject();
        putBoolean(result, "keystoreAvailable", keyStore != null);
        putBoolean(result, "aesGcmSupported", false);
        putBoolean(result, "aes256KeyCreation", false);
        putBoolean(result, "keyAliasPresentAfterCreate", false);
        putBoolean(result, "appPrivateStorageAvailable", false);
        putBoolean(result, "sharedPreferencesCommitCapable", false);

        try {
            putBoolean(result, "appPrivateStorageAvailable", applicationContext.getFilesDir() != null);
        } catch (Exception ignored) {
            // O resultado sanitizado permanece falso.
        }

        try {
            SecretKey key = getKey(true);
            boolean keyReady = key != null && keyStore.containsAlias(KEY_ALIAS);
            putBoolean(result, "aes256KeyCreation", keyReady);
            putBoolean(result, "keyAliasPresentAfterCreate", keyReady);

            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, key);
            byte[] iv = cipher.getIV();
            if (iv == null || iv.length != IV_LENGTH_BYTES) {
                throw new IllegalStateException();
            }
            cipher.doFinal(new byte[] {0});
            putBoolean(result, "aesGcmSupported", true);
        } catch (Exception ignored) {
            // Nenhuma mensagem nativa ou material criptogrÃ¡fico Ã© propagado.
        }

        try {
            SharedPreferences preflightPreferences = applicationContext.getSharedPreferences(
                    PREFLIGHT_PREFERENCES_NAME,
                    Context.MODE_PRIVATE);
            boolean writeCommitted = preflightPreferences.edit()
                    .putString(PREFLIGHT_KEY, "ok")
                    .commit();
            boolean cleanupCommitted = preflightPreferences.edit()
                    .remove(PREFLIGHT_KEY)
                    .commit();
            putBoolean(result, "sharedPreferencesCommitCapable", writeCommitted && cleanupCommitted);
        } catch (Exception ignored) {
            // Nenhum valor persistido do store de source Ã© consultado.
        }
        return result;
    }

    private static void putBoolean(JSONObject result, String key, boolean value) {
        try {
            result.put(key, value);
        } catch (JSONException ignored) {
            // O preflight Ã© best-effort e nÃ£o expÃµe detalhes da exceÃ§Ã£o.
        }
    }

    private static void putString(JSONObject result, String key, String value) {
        try {
            result.put(key, value);
        } catch (JSONException ignored) {
            // The diagnostic response remains fail-closed.
        }
    }

    private static String sanitizeExceptionClass(Exception error) {
        String name = error.getClass().getSimpleName();
        return "AEADBadTagException".equals(name) || "KeyPermanentlyInvalidatedException".equals(name)
                || "UnrecoverableKeyException".equals(name) || "InvalidKeyException".equals(name)
                || "JSONException".equals(name) ? name : "SECURE_READ_EXCEPTION";
    }

    private static String sanitizeCauseChain(Exception error) {
        StringBuilder result = new StringBuilder();
        Throwable current = error;
        int count = 0;
        while (current != null && count++ < 3) {
            if (result.length() > 0) result.append(">");
            String name = current.getClass().getSimpleName();
            result.append("AEADBadTagException".equals(name) || "KeyPermanentlyInvalidatedException".equals(name)
                    || "UnrecoverableKeyException".equals(name) || "InvalidKeyException".equals(name)
                    || "JSONException".equals(name) ? name : "SECURE_READ_EXCEPTION");
            current = current.getCause();
        }
        return result.toString();
    }

    private SecretKey getKey(boolean createIfMissing) throws LocalSecureSourceStoreException {
        try {
            if (keyStore.containsAlias(KEY_ALIAS)) {
                Key key = keyStore.getKey(KEY_ALIAS, null);
                if (key instanceof SecretKey) {
                    return (SecretKey) key;
                }
                throw new LocalSecureSourceStoreException(
                        LocalSecureSourceStoreException.LOCAL_SOURCE_CONFIG_UNAVAILABLE);
            }

            if (!createIfMissing) {
                throw new LocalSecureSourceStoreException(
                        LocalSecureSourceStoreException.LOCAL_SOURCE_CONFIG_UNAVAILABLE);
            }

            KeyGenerator generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, KEYSTORE_PROVIDER);
            generator.init(new KeyGenParameterSpec.Builder(
                    KEY_ALIAS,
                    KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
                    .setKeySize(256)
                    .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                    .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                    .build());
            return generator.generateKey();
        } catch (LocalSecureSourceStoreException error) {
            throw error;
        } catch (Exception error) {
            throw new LocalSecureSourceStoreException(
                    LocalSecureSourceStoreException.LOCAL_SOURCE_CONFIG_UNAVAILABLE);
        }
    }
}
