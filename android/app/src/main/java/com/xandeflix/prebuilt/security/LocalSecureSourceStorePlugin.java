package com.xandeflix.prebuilt.security;

import android.content.Context;
import com.xandeflix.prebuilt.BuildConfig;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONObject;

/** Bridge Capacitor mÃ­nima; nÃ£o expÃµe chave, handle de Keystore ou internals criptogrÃ¡ficos. */
@CapacitorPlugin(name = "LocalSecureSourceStore")
public final class LocalSecureSourceStorePlugin extends Plugin {
    private LocalSecureSourceStore store;

    @PluginMethod
    public void securePreflight(PluginCall call) {
        if (call == null) {
            return;
        }
        call.resolve(buildSanitizedPreflight(getContext(), getBridge() != null));
    }

    /** Preflight seguro para auditoria fÃƒÂ­sica; nÃƒÂ£o retorna dados do store. */
    public static JSObject buildSanitizedPreflight(Context context, boolean bridgeAvailable) {
        JSObject result = new JSObject();
        result.put("pluginAvailable", true);
        result.put("bridgeAvailable", bridgeAvailable);
        result.put("contextAvailable", context != null);
        result.put("keystoreAvailable", false);
        result.put("aesGcmSupported", false);
        result.put("aes256KeyCreation", false);
        result.put("keyAliasPresentAfterCreate", false);
        result.put("appPrivateStorageAvailable", false);
        result.put("sharedPreferencesCommitCapable", false);

        if (context == null) {
            return result;
        }

        try {
            org.json.JSONObject storeResult = new LocalSecureSourceStore(context).securePreflight();
            result.put("keystoreAvailable", storeResult.optBoolean("keystoreAvailable", false));
            result.put("aesGcmSupported", storeResult.optBoolean("aesGcmSupported", false));
            result.put("aes256KeyCreation", storeResult.optBoolean("aes256KeyCreation", false));
            result.put("keyAliasPresentAfterCreate", storeResult.optBoolean("keyAliasPresentAfterCreate", false));
            result.put("appPrivateStorageAvailable", storeResult.optBoolean("appPrivateStorageAvailable", false));
            result.put("sharedPreferencesCommitCapable", storeResult.optBoolean("sharedPreferencesCommitCapable", false));
        } catch (Exception ignored) {
            // O preflight permanece sanitizado e fail-closed.
        }
        return result;
    }

    @PluginMethod
    public void securePut(PluginCall call) {
        if (call == null) {
            return;
        }
        try {
            JSONObject recordObject = call.getObject("record");
            LocalSecureSourceRecord record = LocalSecureSourceRecord.fromJson(recordObject);
            getStore().put(record);
            JSObject result = new JSObject();
            result.put("success", true);
            call.resolve(result);
        } catch (LocalSecureSourceStoreException error) {
            reject(call, error.getCode());
        } catch (Exception error) {
            reject(call, LocalSecureSourceStoreException.LOCAL_SOURCE_CONFIG_WRITE_FAILED);
        }
    }

    @PluginMethod
    public void secureGet(PluginCall call) {
        if (call == null) {
            return;
        }
        try {
            String sourceId = call.getString("sourceId");
            LocalSecureSourceRecord record = getStore().get(sourceId);
            JSObject result = new JSObject();
            result.put("found", record != null);
            if (record != null) {
                result.put("record", record.toJson());
            }
            call.resolve(result);
        } catch (LocalSecureSourceStoreException error) {
            reject(call, error.getCode());
        } catch (Exception error) {
            reject(call, LocalSecureSourceStoreException.LOCAL_SOURCE_CONFIG_UNAVAILABLE);
        }
    }

    @PluginMethod
    public void secureHas(PluginCall call) {
        if (call == null) {
            return;
        }
        try {
            String sourceId = call.getString("sourceId");
            JSObject result = new JSObject();
            result.put("exists", getStore().has(sourceId));
            call.resolve(result);
        } catch (LocalSecureSourceStoreException error) {
            reject(call, error.getCode());
        } catch (Exception error) {
            reject(call, LocalSecureSourceStoreException.LOCAL_SOURCE_CONFIG_UNAVAILABLE);
        }
    }

    /** DEBUG-only: decrypts locally and returns only a non-reversible host summary. */
    @PluginMethod
    public void secureCurrentHostFingerprint(PluginCall call) {
        if (call == null) {
            return;
        }
        if (!BuildConfig.DEBUG) {
            reject(call, LocalSecureSourceStoreException.LOCAL_SOURCE_CONFIG_UNAVAILABLE);
            return;
        }
        try {
            String sourceId = call.getString("sourceId");
            LocalSecureSourceRecord record = getStore().get(sourceId);
            JSObject result = new JSObject();
            if (record == null) {
                result.put("available", false);
                call.resolve(result);
                return;
            }
            SecureSourceConfigHostDiagnostic.Summary safe = SecureSourceConfigHostDiagnostic.inspect(record,
                    new SecureSourceConfigHostDiagnostic.DnsResolver() {
                        @Override
                        public java.net.InetAddress[] resolve(String hostname) throws Exception {
                            return java.net.InetAddress.getAllByName(hostname);
                        }
                    });
            result.put("available", true);
            result.put("hostFingerprint", safe.hostFingerprint);
            result.put("scheme", safe.scheme);
            result.put("portClass", safe.portClass);
            result.put("hostLength", safe.hostLength);
            result.put("sourceVersion", safe.sourceVersion);
            result.put("dnsResult", safe.dnsResult);
            result.put("dnsException", safe.dnsException);
            result.put("aCount", safe.aCount);
            result.put("aaaaCount", safe.aaaaCount);
            call.resolve(result);
        } catch (LocalSecureSourceStoreException error) {
            reject(call, error.getCode());
        } catch (Exception error) {
            reject(call, LocalSecureSourceStoreException.LOCAL_SOURCE_CONFIG_UNAVAILABLE);
        }
    }

    @PluginMethod
    public void secureReadDiagnosis(PluginCall call) {
        if (call == null) return;
        if (!BuildConfig.DEBUG) {
            reject(call, LocalSecureSourceStoreException.LOCAL_SOURCE_CONFIG_UNAVAILABLE);
            return;
        }
        try {
            String sourceId = call.getString("sourceId");
            JSONObject safe = getStore().debugReadDiagnosis(sourceId);
            JSObject result = new JSObject();
            result.put("branch", safe.optString("branch", "OTHER"));
            result.put("recordPresent", safe.optBoolean("recordPresent", false));
            result.put("ivPresent", safe.optBoolean("ivPresent", false));
            result.put("ciphertextPresent", safe.optBoolean("ciphertextPresent", false));
            result.put("ciphertextLengthClass", safe.optString("ciphertextLengthClass", "OTHER"));
            result.put("keyAliasPresent", safe.optBoolean("keyAliasPresent", false));
            result.put("keyAlgorithm", safe.optString("keyAlgorithm", ""));
            result.put("exceptionClass", safe.optString("exceptionClass", ""));
            result.put("causeChain", safe.optString("causeChain", ""));
            call.resolve(result);
        } catch (LocalSecureSourceStoreException error) {
            reject(call, error.getCode());
        } catch (Exception error) {
            reject(call, LocalSecureSourceStoreException.LOCAL_SOURCE_CONFIG_UNAVAILABLE);
        }
    }

    @PluginMethod
    public void securePostReadFingerprintDiagnosis(PluginCall call) {
        if (call == null) return;
        if (!BuildConfig.DEBUG) {
            reject(call, LocalSecureSourceStoreException.LOCAL_SOURCE_CONFIG_UNAVAILABLE);
            return;
        }
        try {
            LocalSecureSourceRecord record = getStore().get(call.getString("sourceId"));
            JSObject result = new JSObject();
            if (record == null) {
                result.put("branch", "NO_RECORD");
                call.resolve(result);
                return;
            }
            JSObject safe = SecureSourceConfigHostDiagnostic.inspectPostRead(record);
            for (String key : new String[] { "branch", "objectPresent", "sourceType", "expectedHostField",
                    "expectedHostFieldState", "endpointState", "playlistUrlState", "schemeClass", "hostLength", "portClass" }) {
                if (safe.has(key)) result.put(key, safe.get(key));
            }
            call.resolve(result);
        } catch (LocalSecureSourceStoreException error) {
            reject(call, error.getCode());
        } catch (Exception error) {
            reject(call, LocalSecureSourceStoreException.LOCAL_SOURCE_CONFIG_UNAVAILABLE);
        }
    }

    @PluginMethod
    public void secureDelete(PluginCall call) {
        if (call == null) {
            return;
        }
        try {
            String sourceId = call.getString("sourceId");
            getStore().delete(sourceId);
            JSObject result = new JSObject();
            result.put("success", true);
            call.resolve(result);
        } catch (LocalSecureSourceStoreException error) {
            reject(call, error.getCode());
        } catch (Exception error) {
            reject(call, LocalSecureSourceStoreException.LOCAL_SOURCE_CONFIG_WRITE_FAILED);
        }
    }

    private synchronized LocalSecureSourceStore getStore() throws LocalSecureSourceStoreException {
        if (store == null) {
            if (getBridge() == null || getContext() == null) {
                throw new LocalSecureSourceStoreException(
                        LocalSecureSourceStoreException.LOCAL_SOURCE_CONFIG_UNAVAILABLE);
            }
            store = new LocalSecureSourceStore(getContext());
        }
        return store;
    }

    private void reject(PluginCall call, String code) {
        call.reject("OperaÃ§Ã£o do armazenamento local seguro indisponÃ­vel.", code);
    }
}

