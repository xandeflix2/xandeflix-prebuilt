package com.xandeflix.prebuilt.debug;

import android.content.Intent;
import android.util.Base64;
import android.util.Log;
import com.getcapacitor.BridgeActivity;
import org.json.JSONObject;
import java.io.File;
import java.io.FileInputStream;
import java.nio.charset.StandardCharsets;

/**
 * Xandeflix Prebuilt — Debug Provisioner (Gate G11A)
 *
 * Mecanismo de ponte exclusivo de builds de depuração para testes físicos.
 *
 * Princípios:
 * - Compilado e presente EXCLUSIVAMENTE em src/debug (ausente no release APK).
 * - Não cria bypass: invoca SecureArtifactImportService na camada WebView.
 * - Transporta bytes e envelope a partir de arquivos locais para a verificação criptográfica.
 */
public class DebugProvisioner {

    private static final String TAG = "DebugProvisioner";
    public static final String ACTION_DEBUG_IMPORT = "com.xandeflix.prebuilt.action.DEBUG_IMPORT";
    public static final String EXTRA_PACKAGE_PATH = "com.xandeflix.prebuilt.extra.PACKAGE_PATH";
    public static final String EXTRA_ENVELOPE_PATH = "com.xandeflix.prebuilt.extra.ENVELOPE_PATH";

    public static void handleIntent(BridgeActivity activity, Intent intent) {
        if (intent == null || !ACTION_DEBUG_IMPORT.equals(intent.getAction())) {
            return;
        }

        String pkgPath = intent.getStringExtra(EXTRA_PACKAGE_PATH);
        String envPath = intent.getStringExtra(EXTRA_ENVELOPE_PATH);

        if (pkgPath == null || envPath == null) {
            Log.e(TAG, "[DEBUG_PROVISIONING_ERROR] EXTRA_PACKAGE_PATH ou EXTRA_ENVELOPE_PATH nulo.");
            return;
        }

        try {
            File pkgFile = new File(pkgPath);
            File envFile = new File(envPath);

            if (!pkgFile.exists() || !envFile.exists()) {
                Log.e(TAG, "[DEBUG_PROVISIONING_ERROR] Arquivos de pacote ou envelope inexistentes.");
                return;
            }

            byte[] pkgBytes = new byte[(int) pkgFile.length()];
            try (FileInputStream fis = new FileInputStream(pkgFile)) {
                int read = fis.read(pkgBytes);
                if (read != pkgBytes.length) {
                    Log.e(TAG, "[DEBUG_PROVISIONING_ERROR] Leitura incompleta do pacote.");
                    return;
                }
            }

            byte[] envBytes = new byte[(int) envFile.length()];
            try (FileInputStream fis = new FileInputStream(envFile)) {
                int read = fis.read(envBytes);
                if (read != envBytes.length) {
                    Log.e(TAG, "[DEBUG_PROVISIONING_ERROR] Leitura incompleta do envelope.");
                    return;
                }
            }

            String pkgBase64 = Base64.encodeToString(pkgBytes, Base64.NO_WRAP);
            String envJsonStr = new String(envBytes, StandardCharsets.UTF_8);

            Log.i(TAG, "Invocando SecureArtifactImportService via WebView bridge (bytes=" + pkgBytes.length + ")...");

            executeImportWhenReady(activity, pkgBase64, envJsonStr, 30);
        } catch (Exception e) {
            Log.e(TAG, "[DEBUG_PROVISIONING_EXCEPTION] Falha ao processar intent de provisionamento: " + e.getMessage(), e);
        }
    }

    private static void executeImportWhenReady(
            BridgeActivity activity,
            String pkgBase64,
            String envJsonStr,
            int attemptsLeft
    ) {
        if (attemptsLeft <= 0) {
            Log.e(TAG, "[DEBUG_PROVISIONING_TIMEOUT] Tempo limite excedido aguardando inicialização da WebView.");
            return;
        }

        if (activity.getBridge() == null || activity.getBridge().getWebView() == null) {
            android.os.Handler handler = new android.os.Handler(android.os.Looper.getMainLooper());
            handler.postDelayed(() -> executeImportWhenReady(activity, pkgBase64, envJsonStr, attemptsLeft - 1), 500);
            return;
        }

        activity.getBridge().getWebView().post(() -> {
            activity.getBridge().getWebView().evaluateJavascript(
                "typeof window.__XANDEFLIX_DEBUG_IMPORT__ === 'function'",
                (value) -> {
                    if ("true".equals(value)) {
                        String js = "(async function() {"
                            + "  try {"
                            + "    console.log('[DEBUG_PROVISIONER_JS] Invocando __XANDEFLIX_DEBUG_IMPORT__...');"
                            + "    const res = await window.__XANDEFLIX_DEBUG_IMPORT__('" + pkgBase64 + "', " + JSONObject.quote(envJsonStr) + ");"
                            + "    console.log('[DEBUG_PROVISIONER_JS_RESULT]', res);"
                            + "  } catch (e) {"
                            + "    console.error('[DEBUG_PROVISIONER_JS_ERROR]', e && e.message ? e.message : e);"
                            + "  }"
                            + "})();";
                        activity.getBridge().getWebView().evaluateJavascript(js, (result) -> {
                            Log.i(TAG, "DEBUG_IMPORT_EVALUATED: " + result);
                        });
                    } else {
                        android.os.Handler handler = new android.os.Handler(android.os.Looper.getMainLooper());
                        handler.postDelayed(() -> executeImportWhenReady(activity, pkgBase64, envJsonStr, attemptsLeft - 1), 500);
                    }
                }
            );
        });
    }
}
