package com.xandeflix.prebuilt.trailer;

import com.getcapacitor.Bridge;
import java.lang.reflect.Field;
import java.util.Set;

/** A separate, local-only document origin. It never exposes Capacitor assets or source data. */
public final class CardTrailerFramePolicy {
    public static final String ORIGIN = "https://trailer.xandeflix.prebuilt";
    private CardTrailerFramePolicy() {}
    public static final class Session {
        public final String id, videoId, parentOrigin, url;
        public Session(String id, String videoId, String parentOrigin) {
            if (!PublicTrailerPolicy.sessionId(id) || !PublicTrailerPolicy.videoId(videoId)
                || !"https://localhost".equals(parentOrigin)) throw new IllegalArgumentException("Invalid card frame");
            this.id=id;this.videoId=videoId;this.parentOrigin=parentOrigin;this.url=ORIGIN+"/card/"+id;
        }
    }
    /** Fail closed on legacy JavascriptInterface transport, changed Capacitor internals or broad origins. */
    public static boolean isolatedBridge(Bridge bridge) {
        try {
            Set<String> origins=bridge.getAllowedOriginRules();
            if (!"https://localhost".equals(bridge.getLocalUrl()) || origins.size()!=1 || !origins.contains("https://localhost")) return false;
            Field handler=Bridge.class.getDeclaredField("msgHandler");handler.setAccessible(true);
            Object value=handler.get(bridge);
            Field reply=value.getClass().getDeclaredField("javaScriptReplyProxy");reply.setAccessible(true);
            return reply.get(value)!=null;
        } catch (ReflectiveOperationException | RuntimeException ignored) { return false; }
    }
    public static boolean owns(String url) {
        return url!=null && (url.equals(ORIGIN) || url.startsWith(ORIGIN+"/"));
    }
    public static boolean matches(Session session, String url, boolean mainFrame, String method) {
        return session!=null && !mainFrame && "GET".equals(method) && session.url.equals(url);
    }
    public static String html(Session s) {
        // Every interpolation is validated ASCII above; no arbitrary URL, title or source value is accepted.
        return "<!doctype html><html><head><meta name='viewport' content='width=device-width,initial-scale=1'>"
            + "<meta name='referrer' content='strict-origin-when-cross-origin'>"
            + "<style>html,body,#player{margin:0;width:100%;height:100%;overflow:hidden;background:#000}iframe{display:block;border:0;width:100%;height:100%}</style>"
            + "</head><body><div id='player'></div><script>var player;function tell(state){parent.postMessage({type:'xandeflix-card-trailer',sessionId:'"+s.id+"',state:state},'"+s.parentOrigin+"')}"
            + "function onYouTubeIframeAPIReady(){try{player=new YT.Player('player',{width:'100%',height:'100%',videoId:'"+s.videoId+"',"
            + "playerVars:{autoplay:1,playsinline:1,controls:0,disablekb:1,fs:0,rel:0,origin:'"+ORIGIN+"'},"
            + "events:{onReady:function(e){tell('ready');e.target.unMute();e.target.setVolume(100);e.target.playVideo()},"
            + "onStateChange:function(e){if(e.data===1)tell('playing');else if(e.data===0)tell('ended');else if(e.data===2)tell('player-paused')},"
            + "onError:function(){tell('error')},onAutoplayBlocked:function(){tell('error')}}})}catch(e){tell('error')}}"
            + "window.onerror=function(){tell('error')};</script><script src='https://www.youtube.com/iframe_api' onerror=\"tell('error')\"></script></body></html>";
    }
}
