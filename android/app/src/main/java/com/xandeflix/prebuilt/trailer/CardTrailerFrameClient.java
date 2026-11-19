package com.xandeflix.prebuilt.trailer;

import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeWebViewClient;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Supplier;

/** Keeps the official public embed in the card's DOM clipping tree, with no app bridge in its document. */
public final class CardTrailerFrameClient extends BridgeWebViewClient {
    private final Supplier<CardTrailerFramePolicy.Session> active;
    public CardTrailerFrameClient(Bridge bridge, Supplier<CardTrailerFramePolicy.Session> active) { super(bridge);this.active=active; }
    @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
        String url=request.getUrl().toString();
        if (!CardTrailerFramePolicy.owns(url)) return super.shouldInterceptRequest(view,request);
        CardTrailerFramePolicy.Session session=active.get();
        boolean valid=CardTrailerFramePolicy.matches(session,url,request.isForMainFrame(),request.getMethod());
        Map<String,String> headers=new HashMap<>();headers.put("Cache-Control","no-store");headers.put("X-Content-Type-Options","nosniff");
        headers.put("Referrer-Policy","strict-origin-when-cross-origin");
        headers.put("Content-Security-Policy","default-src 'none'; script-src 'unsafe-inline' https://www.youtube.com https://s.ytimg.com; frame-src https://www.youtube.com https://www.youtube-nocookie.com; style-src 'unsafe-inline'; connect-src https://www.youtube.com; img-src https: data:; base-uri 'none'; form-action 'none'; frame-ancestors https://localhost");
        String html=valid?CardTrailerFramePolicy.html(session):"<!doctype html><title>Unavailable</title>";
        return new WebResourceResponse("text/html","UTF-8",valid?200:404,valid?"OK":"Not Found",headers,new ByteArrayInputStream(html.getBytes(StandardCharsets.UTF_8)));
    }
    @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
        String url=request.getUrl().toString();
        if (CardTrailerFramePolicy.owns(url)) return !CardTrailerFramePolicy.matches(active.get(),url,request.isForMainFrame(),request.getMethod());
        // The public player navigates its own nested iframe. It cannot navigate the app or open another window.
        if (active.get()!=null && !request.isForMainFrame() && "https".equals(request.getUrl().getScheme())
            && ("www.youtube.com".equals(request.getUrl().getHost()) || "www.youtube-nocookie.com".equals(request.getUrl().getHost()))) return false;
        return super.shouldOverrideUrlLoading(view,request);
    }
    @Deprecated @Override public boolean shouldOverrideUrlLoading(WebView view, String url) {
        if (CardTrailerFramePolicy.owns(url)) return true; // Legacy callback cannot establish a subframe boundary.
        return super.shouldOverrideUrlLoading(view,url);
    }
}
