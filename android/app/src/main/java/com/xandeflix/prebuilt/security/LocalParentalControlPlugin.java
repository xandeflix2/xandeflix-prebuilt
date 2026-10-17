package com.xandeflix.prebuilt.security;

import android.content.Context;
import android.content.SharedPreferences;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import android.os.SystemClock;
import android.provider.Settings;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.security.KeyStore;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;

@CapacitorPlugin(name = "LocalParentalControl")
public class LocalParentalControlPlugin extends Plugin {
    private static final String PROCESS_CLOCK = "process:" + java.util.UUID.randomUUID();
    private static final String PREFS = "xandeflix_parental";
    private static final String ALIAS = "xandeflix_parental_v1";
    static String clockId(int bootCount) { return bootCount >= 0 ? "boot:" + bootCount : PROCESS_CLOCK; }
    @PluginMethod public void elapsedClock(PluginCall call) {
        int bootCount = -1;
        try { bootCount = Settings.Global.getInt(getContext().getContentResolver(), "boot_count", -1); }
        catch (Exception ignored) { /* Unknown boot is conservatively process-scoped. */ }
        JSObject result = new JSObject();
        result.put("clockId", clockId(bootCount)); result.put("elapsedMs", SystemClock.elapsedRealtime()); call.resolve(result);
    }
    private SharedPreferences prefs() { return getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE); }
    private SecretKey key(boolean create) throws Exception {
        KeyStore store = KeyStore.getInstance("AndroidKeyStore"); store.load(null);
        if (store.containsAlias(ALIAS)) return (SecretKey) store.getKey(ALIAS, null);
        if (!create) throw new IllegalStateException();
        KeyGenerator generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
        generator.init(new KeyGenParameterSpec.Builder(ALIAS, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .setRandomizedEncryptionRequired(true).setKeySize(256).build());
        return generator.generateKey();
    }
    @PluginMethod public synchronized void read(PluginCall call) {
        try {
            SharedPreferences prefs = prefs();
            if (!prefs.contains("ciphertext") && !prefs.contains("iv")) { JSObject result = new JSObject(); result.put("value", org.json.JSONObject.NULL); call.resolve(result); return; }
            String iv = prefs.getString("iv", null), ciphertext = prefs.getString("ciphertext", null);
            if (iv == null || ciphertext == null || ciphertext.length() > 180000) throw new IllegalStateException();
            String value = ParentalCipher.decrypt(key(false), Base64.decode(iv, Base64.NO_WRAP), Base64.decode(ciphertext, Base64.NO_WRAP));
            JSObject result = new JSObject(); result.put("value", value); call.resolve(result);
        } catch (Exception ignored) { call.reject("PARENTAL_STORAGE_UNAVAILABLE"); }
    }
    @PluginMethod public synchronized void write(PluginCall call) {
        try {
            String value = call.getString("value");
            if (value == null || value.length() > 65536 || new org.json.JSONObject(value).getInt("version") != 1) throw new IllegalArgumentException();
            SharedPreferences prefs = prefs();
            byte[][] envelope = ParentalCipher.encrypt(key(!prefs.contains("ciphertext") && !prefs.contains("iv")), value);
            if (!prefs.edit().putString("iv", Base64.encodeToString(envelope[0], Base64.NO_WRAP))
                .putString("ciphertext", Base64.encodeToString(envelope[1], Base64.NO_WRAP)).commit()) throw new IllegalStateException();
            call.resolve();
        } catch (Exception ignored) { call.reject("PARENTAL_STORAGE_UNAVAILABLE"); }
    }
}
