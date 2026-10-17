package com.xandeflix.prebuilt;

import android.app.Activity;
import android.content.pm.ActivityInfo;
import android.content.res.Configuration;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebSettings;

import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import androidx.core.graphics.Insets;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import com.xandeflix.prebuilt.debug.DebugProvisioner;
import com.xandeflix.prebuilt.player.NativeAndroidPlayerPlugin;
import com.xandeflix.prebuilt.player.NativePlayerPlugin;
import com.xandeflix.prebuilt.security.LocalSecureSourceStorePlugin;
import com.xandeflix.prebuilt.security.PendingDeviceReactivationStorePlugin;
import com.xandeflix.prebuilt.source.LargeSourceTransportPlugin;
import com.xandeflix.prebuilt.update.AppUpdatesPlugin;

public class MainActivity extends BridgeActivity {
    // UI-thread only. Weak keys avoid retaining destroyed activity windows.
    private static final java.util.Map<View, Boolean> fullscreenDecorViews = new java.util.WeakHashMap<>();
    public static int phoneUiOrientation(int smallestScreenWidthDp, int uiMode, boolean fullscreen) {
        if (smallestScreenWidthDp <= 0 || smallestScreenWidthDp >= 600
                || (uiMode & Configuration.UI_MODE_TYPE_MASK) == Configuration.UI_MODE_TYPE_TELEVISION) {
            return ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED;
        }
        return fullscreen ? ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE
                : ActivityInfo.SCREEN_ORIENTATION_PORTRAIT;
    }

    public static void applyPhoneUiOrientation(Activity activity, boolean fullscreen) {
        if (activity == null) return;
        try {
            Configuration configuration = activity.getResources().getConfiguration();
            int orientation = phoneUiOrientation(configuration.smallestScreenWidthDp, configuration.uiMode, fullscreen);
            if (orientation != ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
                    && activity.getRequestedOrientation() != orientation) {
                activity.setRequestedOrientation(orientation);
            }
        } catch (Exception ignored) {
        }
    }

    public static boolean shouldUseImmersiveSystemBars(int uiMode) {
        return shouldUseImmersiveSystemBars(uiMode, false);
    }

    public static boolean shouldUseImmersiveSystemBars(int uiMode, boolean fullscreenVideo) {
        return fullscreenVideo
                || (uiMode & Configuration.UI_MODE_TYPE_MASK) == Configuration.UI_MODE_TYPE_TELEVISION;
    }

    public static void applyAppSystemUiPolicy(Window window) {
        if (window == null) return;
        applyAppSystemUiPolicy(window, Boolean.TRUE.equals(fullscreenDecorViews.get(window.getDecorView())));
    }

    public static void applyAppSystemUiPolicy(Window window, boolean fullscreenVideo) {
        if (window == null) {
            return;
        }
        fullscreenDecorViews.put(window.getDecorView(), fullscreenVideo);
        if (!shouldUseImmersiveSystemBars(window.getContext().getResources().getConfiguration().uiMode, fullscreenVideo)) {
            try {
                window.clearFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
                View decor = window.getDecorView();
                // Keep edge-to-edge geometry; bindSafeInsets reserves the visible bars once.
                decor.setSystemUiVisibility(View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                        | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
                WindowCompat.setDecorFitsSystemWindows(window, false);
                window.setStatusBarColor(android.graphics.Color.rgb(11, 15, 24));
                window.setNavigationBarColor(android.graphics.Color.rgb(11, 15, 24));
                WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, decor);
                controller.setAppearanceLightStatusBars(false);
                controller.setAppearanceLightNavigationBars(false);
                controller.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_DEFAULT);
                controller.show(WindowInsetsCompat.Type.systemBars());
                ViewCompat.requestApplyInsets(decor);
            } catch (Exception ignored) {
            }
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
        ViewCompat.requestApplyInsets(window.getDecorView());
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
        // Capacitor's WebView margin handler must not also reserve these insets.
        ViewCompat.setOnApplyWindowInsetsListener(target, null);
        if (target.getLayoutParams() instanceof ViewGroup.MarginLayoutParams) {
            ViewGroup.MarginLayoutParams margins = (ViewGroup.MarginLayoutParams) target.getLayoutParams();
            margins.setMargins(0, 0, 0, 0);
            target.setLayoutParams(margins);
        }
        ViewCompat.setOnApplyWindowInsetsListener(insetsRoot, (view, insets) -> insets);
        ViewCompat.setOnApplyWindowInsetsListener(contentContainer, (view, insets) -> {
            if (shouldUseImmersiveSystemBars(view.getResources().getConfiguration().uiMode,
                    Boolean.TRUE.equals(fullscreenDecorViews.get(insetsRoot)))) {
                view.setPadding(0, 0, 0, 0);
                return insets;
            }
            Insets safe = insets.getInsets(WindowInsetsCompat.Type.systemBars()
                    | WindowInsetsCompat.Type.displayCutout() | WindowInsetsCompat.Type.ime());
            view.setPadding(safe.left, safe.top, safe.right, safe.bottom);
            return WindowInsetsCompat.CONSUMED;
        });
        ViewCompat.requestApplyInsets(contentContainer);
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        applyPhoneUiOrientation(this, false);
        registerPlugin(NativeAndroidPlayerPlugin.class);
        registerPlugin(NativePlayerPlugin.class);
        registerPlugin(LocalSecureSourceStorePlugin.class);
        registerPlugin(com.xandeflix.prebuilt.security.LocalParentalControlPlugin.class);
        registerPlugin(PendingDeviceReactivationStorePlugin.class);
        registerPlugin(LargeSourceTransportPlugin.class);
        registerPlugin(AppUpdatesPlugin.class);
        registerPlugin(com.xandeflix.prebuilt.artwork.ArtworkCachePlugin.class);
        registerPlugin(com.xandeflix.prebuilt.cast.GoogleCastPlugin.class);
        registerPlugin(com.xandeflix.prebuilt.trailer.PublicTrailerPlugin.class);
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
                if (nativePlayer.dismissLivePanel()) return;
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

    private NativeAndroidPlayerPlugin nativePlayerPlugin() {
        if (getBridge() == null || getBridge().getPlugin("NativeAndroidPlayer") == null) return null;
        Plugin plugin = getBridge().getPlugin("NativeAndroidPlayer").getInstance();
        return plugin instanceof NativeAndroidPlayerPlugin ? (NativeAndroidPlayerPlugin)plugin : null;
    }
    @Override public boolean dispatchKeyEvent(android.view.KeyEvent event) {
        NativeAndroidPlayerPlugin plugin=nativePlayerPlugin();
        if(plugin!=null && plugin.dispatchLiveKey(event))return true;
        return super.dispatchKeyEvent(event);
    }
    @Override public void onUserLeaveHint() {
        super.onUserLeaveHint(); NativeAndroidPlayerPlugin plugin=nativePlayerPlugin();
        if(plugin!=null)plugin.onUserLeaveForPip();
    }
    @Override public void onPictureInPictureModeChanged(boolean pip, Configuration configuration) {
        super.onPictureInPictureModeChanged(pip,configuration);
        NativeAndroidPlayerPlugin plugin=nativePlayerPlugin();if(plugin!=null)plugin.onPipModeChanged(pip);
    }
    @Override public void onStop() {
        super.onStop();NativeAndroidPlayerPlugin plugin=nativePlayerPlugin();
        if(plugin!=null)plugin.onHostStopped();
    }
}
