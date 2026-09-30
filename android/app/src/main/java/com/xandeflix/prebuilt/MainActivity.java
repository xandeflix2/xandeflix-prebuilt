package com.xandeflix.prebuilt;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.view.Window;
import android.webkit.WebSettings;

import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import androidx.core.view.OnApplyWindowInsetsListener;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import com.xandeflix.prebuilt.debug.DebugProvisioner;
import com.xandeflix.prebuilt.player.NativeAndroidPlayerPlugin;
import com.xandeflix.prebuilt.player.NativePlayerPlugin;
import com.xandeflix.prebuilt.security.LocalSecureSourceStorePlugin;
import com.xandeflix.prebuilt.security.PendingDeviceReactivationStorePlugin;
import com.xandeflix.prebuilt.source.LargeSourceTransportPlugin;

public class MainActivity extends BridgeActivity {
    public static void applyAppSystemUiPolicy(Window window) {
        if (window == null) {
            return;
        }
        try {
            WindowCompat.setDecorFitsSystemWindows(window, false);
            window.setStatusBarColor(android.graphics.Color.TRANSPARENT);
            window.setNavigationBarColor(android.graphics.Color.TRANSPARENT);
            WindowInsetsControllerCompat controller =
                    WindowCompat.getInsetsController(window, window.getDecorView());
            if (controller != null) {
                controller.hide(WindowInsetsCompat.Type.systemBars());
                controller.setSystemBarsBehavior(
                        WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        } catch (Exception ignored) {
        }
        try {
            View decorView = window.getDecorView();
            if (decorView != null) {
                decorView.setSystemUiVisibility(
                        View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                                | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                                | View.SYSTEM_UI_FLAG_FULLSCREEN);
            }
        } catch (Exception ignored) {
        }
    }

    public static void bindSafeInsets(final View target) {
        if (target == null) {
            return;
        }
        final View insetsRoot = target.getRootView();
        final View contentContainer = insetsRoot.findViewById(android.R.id.content) != null
                ? insetsRoot.findViewById(android.R.id.content)
                : insetsRoot;
        contentContainer.setPadding(0, 0, 0, 0);
        target.setPadding(0, 0, 0, 0);
        ViewCompat.setOnApplyWindowInsetsListener(insetsRoot, (view, insets) -> insets);
        if (contentContainer != insetsRoot) {
            ViewCompat.setOnApplyWindowInsetsListener(contentContainer, (view, insets) -> insets);
        }
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeAndroidPlayerPlugin.class);
        registerPlugin(NativePlayerPlugin.class);
        registerPlugin(LocalSecureSourceStorePlugin.class);
        registerPlugin(PendingDeviceReactivationStorePlugin.class);
        registerPlugin(LargeSourceTransportPlugin.class);
        super.onCreate(savedInstanceState);
        applyAppSystemUiPolicy(getWindow());
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().getSettings().setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
            bindSafeInsets(getBridge().getWebView());
        }
        Log.i(
                "R2F3B_SECURE_PREFLIGHT",
                LocalSecureSourceStorePlugin.buildSanitizedPreflight(this, true).toString());
        DebugProvisioner.handleIntent(this, getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        applyAppSystemUiPolicy(getWindow());
        DebugProvisioner.handleIntent(this, intent);
    }

    @Override
    public void onResume() {
        super.onResume();
        applyAppSystemUiPolicy(getWindow());
        if (getBridge() != null && getBridge().getWebView() != null) {
            ViewCompat.requestApplyInsets(getBridge().getWebView());
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            applyAppSystemUiPolicy(getWindow());
        }
    }

    @Override
    public void onBackPressed() {
        if (getBridge() != null && getBridge().getPlugin("NativeAndroidPlayer") != null) {
            Plugin plugin = getBridge().getPlugin("NativeAndroidPlayer").getInstance();
            if (plugin instanceof NativeAndroidPlayerPlugin) {
                NativeAndroidPlayerPlugin nativePlayer = (NativeAndroidPlayerPlugin) plugin;
                if (nativePlayer.exitPreviewFullscreenFromActivity()) {
                    applyAppSystemUiPolicy(getWindow());
                    return;
                }
                if (nativePlayer.dispatchAndroidBackButton()) {
                    applyAppSystemUiPolicy(getWindow());
                    return;
                }
            }
        }
        super.onBackPressed();
    }
}
