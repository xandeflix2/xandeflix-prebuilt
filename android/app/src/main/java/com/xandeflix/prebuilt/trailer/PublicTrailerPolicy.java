package com.xandeflix.prebuilt.trailer;

/** Public YouTube trailer presentation, independent of source/session data. */
public final class PublicTrailerPolicy {
    private PublicTrailerPolicy() {}
    public static boolean videoId(String value) { return value != null && value.matches("[A-Za-z0-9_-]{11}"); }
    public static boolean sessionId(String value) { return value != null && value.matches("[A-Za-z0-9_-]{1,96}"); }
    public static boolean phone(int smallestWidthDp, int uiMode) {
        return smallestWidthDp > 0 && smallestWidthDp < 600 && (uiMode & 15) != 4;
    }
    public static boolean presentation(int smallestWidthDp, int uiMode, String mode) {
        if ("card".equals(mode)) return smallestWidthDp > 0;
        return "inline".equals(mode) ? phone(smallestWidthDp, uiMode)
            : "modal".equals(mode) && smallestWidthDp > 0;
    }
    public static String controlScript(String command) {
        if ("play".equals(command)) return "playPublicTrailer()";
        if ("pause".equals(command)) return "pausePublicTrailer()";
        return null;
    }
    private static boolean finite(double value) { return !Double.isNaN(value) && !Double.isInfinite(value); }
    public static boolean bounds(double x, double y, double width, double height, double viewportWidth) {
        return finite(x) && finite(y) && Math.abs(x) < 20000 && Math.abs(y) < 20000
            && finite(width) && width >= 1 && width <= 4096
            && finite(height) && height >= 1 && height <= 4096
            && finite(viewportWidth) && viewportWidth >= 1 && viewportWidth <= 8192;
    }
    public static String html(String id) {
        return html(id, false);
    }
    public static boolean cardBounds(double width, double height) {
        return finite(width) && finite(height) && width >= 200 && height >= 200;
    }
    public static String html(String id, boolean card) {
        if (!videoId(id)) throw new IllegalArgumentException("Invalid public trailer ID");
        return "<!doctype html><html><head><meta name='viewport' content='width=device-width,initial-scale=1'>"
            + "<meta name='referrer' content='strict-origin-when-cross-origin'><style>html,body,#player{margin:0;width:100%;height:100%;background:#000;overflow:hidden}</style></head><body>"
            + "<div id='player'></div><script>var player;function onYouTubeIframeAPIReady(){player=new YT.Player('player',{width:'100%',height:'100%',videoId:'" + id
            + "',playerVars:{autoplay:1,playsinline:1,controls:0,rel:0," + (card ? "mute:1,disablekb:1,fs:0," : "")
            + "origin:'https://com.xandeflix.prebuilt'},events:{onReady:function(e){console.log('XANDE_PUBLIC_TRAILER:ready');"
            + (card ? "e.target.mute();setTimeout(function(){pausePublicTrailer();console.log('XANDE_PUBLIC_TRAILER:ended')},45000);" : "")
            + "e.target.playVideo()},onStateChange:function(e){if(e.data===1)console.log('XANDE_PUBLIC_TRAILER:playing');else if(e.data===2)console.log('XANDE_PUBLIC_TRAILER:player-paused')"
            + (card ? ";else if(e.data===0)console.log('XANDE_PUBLIC_TRAILER:ended')" : "")
            + "},onError:function(){console.log('XANDE_PUBLIC_TRAILER:error')}"
            + (card ? ",onAutoplayBlocked:function(){console.log('XANDE_PUBLIC_TRAILER:error')}" : "") + "}})}"
            + "function playPublicTrailer(){if(player&&player.playVideo)player.playVideo()}"
            + "function pausePublicTrailer(){if(player&&player.pauseVideo)player.pauseVideo()}"
            + "</script><script src='https://www.youtube.com/iframe_api'></script></body></html>";
    }
}
