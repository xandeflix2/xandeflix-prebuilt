package com.xandeflix.prebuilt.update;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import androidx.core.content.FileProvider;
import com.getcapacitor.*;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name="AppUpdates")
public final class AppUpdatesPlugin extends Plugin {
    private static final ExecutorService WORKER = Executors.newSingleThreadExecutor();
    @Override protected void handleOnResume() {
        try { notifyListeners("opening", JSObject.fromJSONObject(new UpdateEngine(getContext()).status())); }
        catch (Exception ignored) { }
        WORKER.execute(() -> new UpdateEngine(getContext()).check());
    }
    @PluginMethod public void configure(PluginCall call) {
        try { new UpdateEngine(getContext()).configure(call.getString("url"), call.getString("key")); call.resolve(); }
        catch (Exception ignored) { call.reject("Update configuration unavailable"); }
    }
    @PluginMethod public void check(PluginCall call) {
        // Resolve immediately; transfer runs independently of UI and playback.
        WORKER.execute(() -> new UpdateEngine(getContext()).check()); call.resolve();
    }
    @PluginMethod public void status(PluginCall call) {
        try { call.resolve(JSObject.fromJSONObject(new UpdateEngine(getContext()).status())); }
        catch (Exception ignored) { call.resolve(new JSObject().put("ready", false)); }
    }
    @PluginMethod public void checkNow(PluginCall call) {
        WORKER.execute(() -> {
            try {
                UpdateEngine engine = new UpdateEngine(getContext());
                String result = engine.check(true);
                call.resolve(JSObject.fromJSONObject(engine.status().put("result", result)));
            } catch (Exception ignored) { call.reject("Update check unavailable"); }
        });
    }
    @PluginMethod public void install(PluginCall call) {
        new Thread(() -> {
            try {
                File file = new UpdateEngine(getContext()).installationFile();
                getActivity().runOnUiThread(() -> {
                    try {
                        boolean permission = Build.VERSION.SDK_INT >= 26 && !getContext().getPackageManager().canRequestPackageInstalls();
                        Intent intent;
                        if (permission) intent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + getContext().getPackageName()));
                        else {
                            Uri uri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", file);
                            intent = new Intent(Intent.ACTION_VIEW).setDataAndType(uri, "application/vnd.android.package-archive")
                                .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                        }
                        getActivity().startActivity(intent);
                        call.resolve(new JSObject().put("permissionRequired", permission));
                    } catch (Exception ignored) { call.reject("Installer unavailable"); }
                });
            } catch (Exception ignored) { call.reject("Update unavailable"); }
        }, "app-update-installer").start();
    }
}
