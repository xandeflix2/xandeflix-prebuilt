package com.xandeflix.prebuilt.trailer;
import org.junit.Test;
import static org.junit.Assert.*;

public class PublicTrailerPolicyTest {
    @Test public void validatesPublicIDWithoutURLsOrMarkup() {
        assertTrue(PublicTrailerPolicy.videoId("abc_DEF-123"));
        for(String id:new String[]{"", "https://youtube.com/watch?v=abc_DEF-123", "abc'<script", "../12345678", "abc_DEF-1235"}) assertFalse(PublicTrailerPolicy.videoId(id));
        assertFalse(PublicTrailerPolicy.videoId(null));
        assertFalse(PublicTrailerPolicy.sessionId("https://source.invalid"));
    }
    @Test public void phoneOnlyAndBoundedRectangle() {
        assertTrue(PublicTrailerPolicy.phone(360,1));
        assertFalse(PublicTrailerPolicy.phone(800,1));assertFalse(PublicTrailerPolicy.phone(360,4));assertFalse(PublicTrailerPolicy.phone(0,1));
        assertTrue(PublicTrailerPolicy.bounds(10,80,370,210,390));
        assertFalse(PublicTrailerPolicy.bounds(0,0,Double.NaN,210,390));
        assertFalse(PublicTrailerPolicy.bounds(0,0,9000,210,390));assertFalse(PublicTrailerPolicy.bounds(0,0,370,210,0));
    }
    @Test public void officialEmbedIdentityAndNoPrivilegedBridge() {
        String html=PublicTrailerPolicy.html("abc_DEF-123");
        assertTrue(html.contains("https://com.xandeflix.prebuilt"));assertTrue(html.contains("https://www.youtube.com/iframe_api"));
        assertTrue(html.contains("controls:0"));assertFalse(html.contains("controls:1"));assertFalse(html.contains("Authorization"));assertFalse(html.contains("Capacitor"));
        assertFalse(html.contains("directStreamUrl"));
    }
    @Test public void modalExplicitlySupportsTabletAndTVWithoutOpeningInline() {
        assertTrue(PublicTrailerPolicy.presentation(800, 1, "modal"));
        assertTrue(PublicTrailerPolicy.presentation(960, 4, "modal"));
        assertTrue(PublicTrailerPolicy.presentation(360, 1, "inline"));
        assertFalse(PublicTrailerPolicy.presentation(800, 1, "inline"));
        assertFalse(PublicTrailerPolicy.presentation(360, 4, "inline"));
        assertFalse(PublicTrailerPolicy.presentation(0, 4, "modal"));
        assertFalse(PublicTrailerPolicy.presentation(800, 1, "https://source.invalid"));
        assertFalse(PublicTrailerPolicy.presentation(800, 1, null));
    }
    @Test public void controlsAreFixedScriptsNotExecutableInput() {
        assertEquals("playPublicTrailer()", PublicTrailerPolicy.controlScript("play"));
        assertEquals("pausePublicTrailer()", PublicTrailerPolicy.controlScript("pause"));
        assertNull(PublicTrailerPolicy.controlScript("play;alert(1)"));
        assertNull(PublicTrailerPolicy.controlScript(null));
        String html = PublicTrailerPolicy.html("abc_DEF-123");
        assertTrue(html.contains("XANDE_PUBLIC_TRAILER:playing"));
        assertTrue(html.contains("XANDE_PUBLIC_TRAILER:player-paused"));
        assertTrue(html.contains("function playPublicTrailer()"));
    }
}
