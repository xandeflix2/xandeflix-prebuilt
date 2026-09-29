package com.xandeflix.prebuilt.security;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Base64;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.security.KeyStore;
import java.util.regex.Pattern;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import org.json.JSONObject;

/**
 * Armazenamento Android privado e cifrado do handle pendente de reativação.
 * A preferência contém apenas envelope cifrado; o token nunca é escrito em
 * texto plano, log ou retorno sanitizado.
 */
public final class PendingDeviceReactivationStore {
    private static final String KEYSTORE_PROVIDER = "AndroidKeyStore";
    private static final String KEY_ALIAS = "xandeflix_local_source_aes_v1";
    private static final String PREFERENCES_NAME = "xandeflix_pending_device_reactivation_v1";
    private static final String PENDING_KEY = "pending_handle";
    private static final int CURRENT_SCHEMA_VERSION = 1;
    private static final int GCM_TAG_LENGTH_BITS = 128;
    private static final int IV_LENGTH_BYTES = 12;
    private static final Pattern UUID_PATTERN = Pattern.compile("^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$");
    private static final Pattern DISPLAY_CODE_PATTERN = Pattern.compile("^XF-[A-Z0-9]{4}-[A-Z0-9]{4}$");
    private static final Pattern RAW_TOKEN_PATTERN = Pattern.compile("^r2f8r_[0-9a-f]{64}$");

    private final SharedPreferences preferences;
    private final KeyStore keyStore;

    public PendingDeviceReactivationStore(Context context) throws PendingDeviceReactivationStoreException {
        if (context == null) {
            throw new PendingDeviceReactivationStoreException(
                    PendingDeviceReactivationStoreException.PENDING_REACTIVATION_STORE_UNAVAILABLE);
        }
        Context appContext = context.getApplicationContext();
        if (appContext == null) appContext = context;
        preferences = appContext.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE);
        try {
            keyStore = KeyStore.getInstance(KEYSTORE_PROVIDER);
            keyStore.load(null);
        } catch (Exception error) {
            throw new PendingDeviceReactivationStoreException(
                    PendingDeviceReactivationStoreException.PENDING_REACTIVATION_STORE_UNAVAILABLE);
        }
    }

    public synchronized void save(JSONObject handle) throws PendingDeviceReactivationStoreException {
        validateHandle(handle);
        try {
            SecretKey key = getKey(true);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, key);
            byte[] iv = cipher.getIV();
            if (iv == null || iv.length != IV_LENGTH_BYTES) {
                throw new PendingDeviceReactivationStoreException(
                        PendingDeviceReactivationStoreException.PENDING_REACTIVATION_WRITE_FAILED);
            }
            byte[] ciphertext = cipher.doFinal(handle.toString().getBytes(StandardCharsets.UTF_8));
            JSONObject envelope = new JSONObject();
            envelope.put("schemaVersion", CURRENT_SCHEMA_VERSION);
            envelope.put("iv", Base64.encodeToString(iv, Base64.NO_WRAP));
            envelope.put("ciphertext", Base64.encodeToString(ciphertext, Base64.NO_WRAP));
            if (!preferences.edit().putString(PENDING_KEY, envelope.toString()).commit()) {
                throw new PendingDeviceReactivationStoreException(
                        PendingDeviceReactivationStoreException.PENDING_REACTIVATION_WRITE_FAILED);
            }
        } catch (PendingDeviceReactivationStoreException error) {
            throw error;
        } catch (Exception error) {
            throw new PendingDeviceReactivationStoreException(
                    PendingDeviceReactivationStoreException.PENDING_REACTIVATION_WRITE_FAILED);
        }
    }

    public synchronized JSONObject load() throws PendingDeviceReactivationStoreException {
        String rawEnvelope = preferences.getString(PENDING_KEY, null);
        if (rawEnvelope == null) return null;
        try {
            JSONObject envelope = new JSONObject(rawEnvelope);
            if (envelope.optInt("schemaVersion", -1) != CURRENT_SCHEMA_VERSION) {
                throw new PendingDeviceReactivationStoreException(
                        PendingDeviceReactivationStoreException.PENDING_REACTIVATION_READ_FAILED);
            }
            byte[] iv = Base64.decode(envelope.getString("iv"), Base64.DEFAULT);
            byte[] ciphertext = Base64.decode(envelope.getString("ciphertext"), Base64.DEFAULT);
            if (iv.length != IV_LENGTH_BYTES || ciphertext.length == 0) {
                throw new PendingDeviceReactivationStoreException(
                        PendingDeviceReactivationStoreException.PENDING_REACTIVATION_READ_FAILED);
            }
            SecretKey key = getKey(false);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv));
            JSONObject handle = new JSONObject(new String(cipher.doFinal(ciphertext), StandardCharsets.UTF_8));
            validateHandle(handle);
            return handle;
        } catch (PendingDeviceReactivationStoreException error) {
            throw error;
        } catch (Exception error) {
            throw new PendingDeviceReactivationStoreException(
                    PendingDeviceReactivationStoreException.PENDING_REACTIVATION_READ_FAILED);
        }
    }

    public synchronized void clear() throws PendingDeviceReactivationStoreException {
        if (!preferences.edit().remove(PENDING_KEY).commit()) {
            throw new PendingDeviceReactivationStoreException(
                    PendingDeviceReactivationStoreException.PENDING_REACTIVATION_CLEAR_FAILED);
        }
    }

    private SecretKey getKey(boolean createIfMissing) throws Exception {
        if (keyStore.containsAlias(KEY_ALIAS)) {
            Key key = keyStore.getKey(KEY_ALIAS, null);
            if (key instanceof SecretKey) return (SecretKey) key;
            throw new PendingDeviceReactivationStoreException(
                    PendingDeviceReactivationStoreException.PENDING_REACTIVATION_STORE_UNAVAILABLE);
        }
        if (!createIfMissing) {
            throw new PendingDeviceReactivationStoreException(
                    PendingDeviceReactivationStoreException.PENDING_REACTIVATION_READ_FAILED);
        }
        KeyGenerator generator = KeyGenerator.getInstance("AES", KEYSTORE_PROVIDER);
        generator.init(new android.security.keystore.KeyGenParameterSpec.Builder(
                KEY_ALIAS,
                android.security.keystore.KeyProperties.PURPOSE_ENCRYPT
                        | android.security.keystore.KeyProperties.PURPOSE_DECRYPT)
                .setKeySize(256)
                .setBlockModes(android.security.keystore.KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(android.security.keystore.KeyProperties.ENCRYPTION_PADDING_NONE)
                .build());
        return generator.generateKey();
    }

    private static void validateHandle(JSONObject handle) throws PendingDeviceReactivationStoreException {
        if (handle == null
                || !UUID_PATTERN.matcher(handle.optString("requestId", "")).matches()
                || !UUID_PATTERN.matcher(handle.optString("deviceId", "")).matches()
                || !RAW_TOKEN_PATTERN.matcher(handle.optString("rawDeviceToken", "")).matches()
                || !DISPLAY_CODE_PATTERN.matcher(handle.optString("displayCode", "")).matches()
                || handle.optString("deviceType", "").isEmpty()
                || handle.optString("deviceLabel", "").trim().isEmpty()
                || handle.optString("createdAtIso", "").isEmpty()
                || handle.optString("expiresAtIso", "").isEmpty()) {
            throw new PendingDeviceReactivationStoreException(
                    PendingDeviceReactivationStoreException.PENDING_REACTIVATION_INVALID);
        }
    }
}
