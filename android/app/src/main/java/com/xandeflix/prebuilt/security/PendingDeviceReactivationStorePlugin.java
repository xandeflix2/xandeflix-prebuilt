package com.xandeflix.prebuilt.security;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONObject;

/** Bridge sanitizada para o handle temporário de reativação. */
@CapacitorPlugin(name = "PendingDeviceReactivationStore")
public final class PendingDeviceReactivationStorePlugin extends Plugin {
    private PendingDeviceReactivationStore store;

    @PluginMethod
    public void secureSavePendingReactivation(PluginCall call) {
        if (call == null) return;
        try {
            JSONObject handle = call.getObject("handle");
            getStore().save(handle);
            JSObject result = new JSObject();
            result.put("success", true);
            call.resolve(result);
        } catch (PendingDeviceReactivationStoreException error) {
            reject(call, error.getCode());
        } catch (Exception error) {
            reject(call, PendingDeviceReactivationStoreException.PENDING_REACTIVATION_WRITE_FAILED);
        }
    }

    @PluginMethod
    public void secureLoadPendingReactivation(PluginCall call) {
        if (call == null) return;
        try {
            JSONObject handle = getStore().load();
            JSObject result = new JSObject();
            result.put("found", handle != null);
            if (handle != null) result.put("handle", handle);
            call.resolve(result);
        } catch (PendingDeviceReactivationStoreException error) {
            reject(call, error.getCode());
        } catch (Exception error) {
            reject(call, PendingDeviceReactivationStoreException.PENDING_REACTIVATION_READ_FAILED);
        }
    }

    @PluginMethod
    public void secureClearPendingReactivation(PluginCall call) {
        if (call == null) return;
        try {
            getStore().clear();
            JSObject result = new JSObject();
            result.put("success", true);
            call.resolve(result);
        } catch (PendingDeviceReactivationStoreException error) {
            reject(call, error.getCode());
        } catch (Exception error) {
            reject(call, PendingDeviceReactivationStoreException.PENDING_REACTIVATION_CLEAR_FAILED);
        }
    }

    private synchronized PendingDeviceReactivationStore getStore() throws PendingDeviceReactivationStoreException {
        if (store == null) {
            if (getContext() == null) {
                throw new PendingDeviceReactivationStoreException(
                        PendingDeviceReactivationStoreException.PENDING_REACTIVATION_STORE_UNAVAILABLE);
            }
            store = new PendingDeviceReactivationStore(getContext());
        }
        return store;
    }

    private void reject(PluginCall call, String code) {
        call.reject("Operação do armazenamento seguro de reativação indisponível.", code);
    }
}
