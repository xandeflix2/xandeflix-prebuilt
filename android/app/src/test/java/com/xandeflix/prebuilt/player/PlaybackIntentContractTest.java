package com.xandeflix.prebuilt.player;

import static org.junit.Assert.*;

import org.junit.Test;

/**
 * Testes unitários para validação de segurança e conformidade do contrato de playback no Android.
 */
public class PlaybackIntentContractTest {

    @Test
    public void testValidHttpsUriAccepted() {
        PlaybackIntentContract.validatePlaybackUri("https://media.example.invalid/movies/stream1.m3u8");
    }

    @Test
    public void testValidHttpSyntheticUriAccepted() {
        PlaybackIntentContract.validatePlaybackUri("http://10.0.2.2:8080/live/stream2.m3u8");
    }

    @Test(expected = IllegalArgumentException.class)
    public void testNullUriRejected() {
        PlaybackIntentContract.validatePlaybackUri(null);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testEmptyUriRejected() {
        PlaybackIntentContract.validatePlaybackUri("   ");
    }

    @Test(expected = IllegalArgumentException.class)
    public void testUserInfoCredentialsRejected() {
        PlaybackIntentContract.validatePlaybackUri("https://user:secret123@media.example.invalid/live/stream1.m3u8");
    }

    @Test(expected = IllegalArgumentException.class)
    public void testFileSchemeRejected() {
        PlaybackIntentContract.validatePlaybackUri("file:///sdcard/video.mp4");
    }

    @Test(expected = IllegalArgumentException.class)
    public void testContentSchemeRejected() {
        PlaybackIntentContract.validatePlaybackUri("content://media/external/video/1");
    }

    @Test(expected = IllegalArgumentException.class)
    public void testJavascriptSchemeRejected() {
        PlaybackIntentContract.validatePlaybackUri("javascript:alert(1)");
    }

    @Test(expected = IllegalArgumentException.class)
    public void testDataSchemeRejected() {
        PlaybackIntentContract.validatePlaybackUri("data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==");
    }

    @Test(expected = IllegalArgumentException.class)
    public void testIntentSchemeRejected() {
        PlaybackIntentContract.validatePlaybackUri("intent://scan/#Intent;scheme=zxing;package=com.google.zxing.client.android;end");
    }

    @Test
    public void testSanitizeUriForLogRedactsQuery() {
        String raw = "https://media.example.invalid/hls/movie.m3u8?token=secret_token_12345&sig=abcdef";
        String sanitized = PlaybackIntentContract.sanitizeUriForLog(raw);

        assertFalse(sanitized.contains("secret_token_12345"));
        assertFalse(sanitized.contains("abcdef"));
        assertTrue(sanitized.contains("?[QUERY_REDACTED]"));
        assertTrue(sanitized.startsWith("https://media.example.invalid/hls/movie.m3u8"));
    }

    @Test
    public void testSanitizeUriForLogWithoutQuery() {
        String raw = "https://media.example.invalid/hls/movie.m3u8";
        String sanitized = PlaybackIntentContract.sanitizeUriForLog(raw);

        assertEquals("https://media.example.invalid/hls/movie.m3u8", sanitized);
    }

    @Test
    public void testIntentConstantsMatchSpecification() {
        assertEquals("com.xandeflix.prebuilt.player.EXTRA_URI", PlaybackIntentContract.EXTRA_URI);
        assertEquals("com.xandeflix.prebuilt.player.EXTRA_TITLE", PlaybackIntentContract.EXTRA_TITLE);
        assertEquals("com.xandeflix.prebuilt.player.EXTRA_MIME_TYPE", PlaybackIntentContract.EXTRA_MIME_TYPE);
        assertEquals("com.xandeflix.prebuilt.player.EXTRA_START_POSITION_MS", PlaybackIntentContract.EXTRA_START_POSITION_MS);
        assertEquals("com.xandeflix.prebuilt.player.EXTRA_HEADERS_KEYS", PlaybackIntentContract.EXTRA_HEADERS_KEYS);
        assertEquals("com.xandeflix.prebuilt.player.EXTRA_HEADERS_VALUES", PlaybackIntentContract.EXTRA_HEADERS_VALUES);
    }
}
