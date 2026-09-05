package com.xandeflix.prebuilt.player;

import android.content.Intent;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.ArrayList;
import java.util.Iterator;

/**
 * Plugin Capacitor para ponte IPC entre o frontend web e a NativePlayerActivity.
 *
 * Princípios:
 * - SAFE VALIDATION: Valida esquema e formato antes de invocar a Activity nativa.
 * - SANITIZED IPC: Encaminha somente parâmetros transitórios estritamente necessários.
 */
@CapacitorPlugin(name = "NativePlayer")
public class NativePlayerPlugin extends Plugin {

    @PluginMethod
    public void play(PluginCall call) {
        String uri = call.getString("uri");
        if (uri == null || uri.trim().isEmpty()) {
            call.reject("URI de reprodução não informada.");
            return;
        }

        try {
            PlaybackIntentContract.validatePlaybackUri(uri);
        } catch (Exception e) {
            call.reject("URI inválida: " + e.getMessage());
            return;
        }

        String title = call.getString("title");
        String mimeType = call.getString("mimeType");
        Long startPositionMs = call.getLong("startPositionMs", 0L);
        JSObject headersObj = call.getObject("headers");

        Intent intent = new Intent(getContext(), NativePlayerActivity.class);
        intent.putExtra(PlaybackIntentContract.EXTRA_URI, uri);

        if (title != null) {
            intent.putExtra(PlaybackIntentContract.EXTRA_TITLE, title);
        }
        if (mimeType != null) {
            intent.putExtra(PlaybackIntentContract.EXTRA_MIME_TYPE, mimeType);
        }
        if (startPositionMs != null && startPositionMs > 0) {
            intent.putExtra(PlaybackIntentContract.EXTRA_START_POSITION_MS, startPositionMs);
        }

        if (headersObj != null) {
            ArrayList<String> headerKeys = new ArrayList<>();
            ArrayList<String> headerValues = new ArrayList<>();

            Iterator<String> keys = headersObj.keys();
            while (keys.hasNext()) {
                String key = keys.next();
                String val = headersObj.getString(key);
                if (val != null) {
                    headerKeys.add(key);
                    headerValues.add(val);
                }
            }

            intent.putStringArrayListExtra(PlaybackIntentContract.EXTRA_HEADERS_KEYS, headerKeys);
            intent.putStringArrayListExtra(PlaybackIntentContract.EXTRA_HEADERS_VALUES, headerValues);
        }

        getContext().startActivity(intent);

        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }
}
