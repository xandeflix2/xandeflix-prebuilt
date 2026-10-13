package com.xandeflix.prebuilt.trailer;

import android.content.res.Configuration;
import android.graphics.Color;
import android.net.Uri;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.ConsoleMessage;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "PublicTrailer")
public final class PublicTrailerPlugin extends Plugin {
    private WebView player;
    private String session;
    private boolean visible;

    private boolean validateBounds(PluginCall call) {
        return PublicTrailerPolicy.bounds(call.getDouble("x", Double.NaN), call.getDouble("y", Double.NaN),
            call.getDouble("width", Double.NaN), call.getDouble("height", Double.NaN), call.getDouble("viewportWidth", Double.NaN));
    }
    @PluginMethod public void open(PluginCall call) {
        String id = call.getString("videoId"), nonce = call.getString("sessionId");
        Configuration cfg = getContext().getResources().getConfiguration();
        if (!PublicTrailerPolicy.presentation(cfg.smallestScreenWidthDp, cfg.uiMode, call.getString("presentation", "inline")) || !PublicTrailerPolicy.videoId(id)
            || !PublicTrailerPolicy.sessionId(nonce) || !validateBounds(call)
            || !call.getBoolean("visible", false)) { call.reject("Public trailer unavailable"); return; }
        getActivity().runOnUiThread(() -> {
            destroyPlayer();session = nonce;
            try {
                WebView view = new WebView(getActivity());player = view;
                view.setFocusable(false);view.setFocusableInTouchMode(false);
                view.setBackgroundColor(Color.BLACK);
                WebSettings settings = view.getSettings();settings.setJavaScriptEnabled(true);settings.setDomStorageEnabled(true);
                settings.setAllowFileAccess(false);settings.setAllowContentAccess(false);
                settings.setCacheMode(WebSettings.LOAD_NO_CACHE);
                settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);settings.setMediaPlaybackRequiresUserGesture(false);
                // No JavascriptInterface or Capacitor bridge is attached to this public WebView.
                view.setWebViewClient(new WebViewClient() {
                    @Override public boolean shouldOverrideUrlLoading(WebView web, WebResourceRequest request) {
                        if (!request.isForMainFrame()) return false;
                        Uri url = request.getUrl();
                        return !("https".equals(url.getScheme()) && "com.xandeflix.prebuilt".equals(url.getHost()));
                    }
                });
                view.setWebChromeClient(new WebChromeClient() {
                    @Override public boolean onConsoleMessage(ConsoleMessage message) {
                        if (player != view || !nonce.equals(session)) return true;
                        if ("XANDE_PUBLIC_TRAILER:ready".equals(message.message())) emit("ready");
                        else if ("XANDE_PUBLIC_TRAILER:playing".equals(message.message())) emit("playing");
                        else if ("XANDE_PUBLIC_TRAILER:player-paused".equals(message.message())) emit("player-paused");
                        else if ("XANDE_PUBLIC_TRAILER:error".equals(message.message())) emit("error");
                        return true;
                    }
                });
                getActivity().addContentView(view, new FrameLayout.LayoutParams(1, 1));
                applyBounds(call);
                view.loadDataWithBaseURL("https://com.xandeflix.prebuilt/", PublicTrailerPolicy.html(id), "text/html", "UTF-8", null);
                call.resolve();
            } catch (Exception ignored) { destroyPlayer();call.reject("Public trailer unavailable"); }
        });
    }
    @PluginMethod public void bounds(PluginCall call) {
        if (!validateBounds(call)) { call.reject("Invalid trailer bounds"); return; }
        getActivity().runOnUiThread(() -> {
            if (player != null && session != null && session.equals(call.getString("sessionId"))) applyBounds(call);
            call.resolve();
        });
    }
    private void applyBounds(PluginCall call) {
        if (player == null || getBridge().getWebView() == null) return;
        WebView host = getBridge().getWebView();
        double scale = host.getWidth() / call.getDouble("viewportWidth", 1.0);
        int[] offset = new int[2];host.getLocationInWindow(offset);
        int width = Math.min(host.getWidth(), Math.max(1, (int)Math.round(call.getDouble("width", 1.0) * scale)));
        int height = Math.min(host.getHeight(), Math.max(1, (int)Math.round(call.getDouble("height", 1.0) * scale)));
        FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(width, height);
        // addContentView places this overlay inside the padded content container.
        int[] parentOffset = new int[2];
        ViewGroup parent = (ViewGroup) player.getParent();
        parent.getLocationInWindow(parentOffset);
        params.leftMargin = offset[0] - parentOffset[0] - parent.getPaddingLeft()
                + (int)Math.round(call.getDouble("x", 0.0) * scale);
        params.topMargin = offset[1] - parentOffset[1] - parent.getPaddingTop()
                + (int)Math.round(call.getDouble("y", 0.0) * scale);
        ViewGroup.LayoutParams previous = player.getLayoutParams();
        if (!(previous instanceof FrameLayout.LayoutParams)
            || previous.width != params.width || previous.height != params.height
            || ((FrameLayout.LayoutParams)previous).leftMargin != params.leftMargin
            || ((FrameLayout.LayoutParams)previous).topMargin != params.topMargin) player.setLayoutParams(params);
        boolean next = call.getBoolean("visible", false);
        if (visible && !next) player.evaluateJavascript("pausePublicTrailer()", null);
        visible = next;player.setVisibility(next ? View.VISIBLE : View.INVISIBLE);
    }
    @PluginMethod public void close(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (session != null && session.equals(call.getString("sessionId"))) destroyPlayer();
            call.resolve();
        });
    }
    @PluginMethod public void control(PluginCall call) {
        String script = PublicTrailerPolicy.controlScript(call.getString("command"));
        String nonce = call.getString("sessionId");
        if (script == null || !PublicTrailerPolicy.sessionId(nonce)) { call.reject("Invalid trailer control"); return; }
        getActivity().runOnUiThread(() -> {
            if (player == null || !nonce.equals(session) || !visible) { call.reject("Trailer unavailable"); return; }
            player.evaluateJavascript(script, null);
            call.resolve();
        });
    }
    private void emit(String state) {
        if (session == null) return;
        JSObject result = new JSObject();result.put("sessionId", session);result.put("state", state);
        notifyListeners("trailerState", result);
    }
    private void destroyPlayer() {
        WebView view=player;player=null;session=null;visible=false;
        if (view != null) {
            try { view.stopLoading();view.loadUrl("about:blank");if (view.getParent() instanceof ViewGroup) ((ViewGroup)view.getParent()).removeView(view);view.destroy(); } catch (Exception ignored) {}
        }
    }
    @Override protected void handleOnPause() {
        if (getActivity()!=null) getActivity().runOnUiThread(() -> {emit("paused");destroyPlayer();});
    }
    @Override protected void handleOnDestroy() {
        if (getActivity()!=null) getActivity().runOnUiThread(this::destroyPlayer);
    }
}
