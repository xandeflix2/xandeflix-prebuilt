package com.xandeflix.prebuilt.player;

import static org.junit.Assert.*;
import androidx.media3.common.MimeTypes;
import java.lang.reflect.Method;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;
import org.junit.Test;

/** Opaque transport regression, synthetic URLs only; no source or network access. */
public class OpaqueHlsMimeRecoveryTest {
    // Reflection lets this exact test execute against the received pre-patch class.
    private String hint(NativeStreamRequest request) throws Exception {
        Method method = NativeStreamRequest.class.getMethod("getMediaMimeTypeHint");
        return (String) method.invoke(request);
    }

    private NativeStreamRequest first(String url) {
        return NativeStreamRequest.fromRawUrl(url).get(0);
    }

    @Test public void opaqueM3u8UsesHls() throws Exception {
        assertEquals(MimeTypes.APPLICATION_M3U8, hint(first("https://media.fixture.invalid/play/Ab_9-z==/m3u8")));
    }

    @Test public void opaqueHlsUsesHlsOverHttp() throws Exception {
        assertEquals(MimeTypes.APPLICATION_M3U8, hint(first("http://media.fixture.invalid:8080/play/Ab_9-z==/hls")));
    }

    @Test public void originalUrlQueryAndCandidateRemainExact() throws Exception {
        String url = "https://media.fixture.invalid/play/Ab_9-z==/m3u8?session=fixture&value=%2F";
        List<NativeStreamRequest> requests = NativeStreamRequest.fromRawUrl(url);
        assertEquals(1, requests.size());
        assertEquals(url, requests.get(0).getMediaUrl());
        assertEquals(url, requests.get(0).getRawUrl());
        assertEquals(MimeTypes.APPLICATION_M3U8, hint(requests.get(0)));
    }

    @Test public void pipeHeadersKeepTheirExistingSemantics() throws Exception {
        NativeStreamRequest request = first("https://media.fixture.invalid/play/fixture/m3u8|User-Agent=FixtureUA&Referer=https%3A%2F%2Fexample.invalid");
        assertEquals("https://media.fixture.invalid/play/fixture/m3u8", request.getMediaUrl());
        assertEquals("FixtureUA", request.getUserAgent());
        assertEquals("https://example.invalid", request.getRequestHeaders().get("Referer"));
        assertEquals(MimeTypes.APPLICATION_M3U8, hint(request));
    }

    @Test public void otherFormatsKeepDefaultInference() throws Exception {
        for (String path : new String[]{"/play/fixture/ts", "/play/fixture/mpegts", "/movie/u/p/25.mp4", "/series/u/p/26.mkv", "/live/master.m3u8", "/dash/master.mpd"}) {
            NativeStreamRequest request = first("https://media.fixture.invalid" + path);
            assertNull(path, hint(request));
            assertEquals("https://media.fixture.invalid" + path, request.getMediaUrl());
        }
    }

    @Test public void noGuessFromQueryCategoryOrSimilarPaths() throws Exception {
        for (String path : new String[]{"/movie.mp4?output=hls", "/hls", "/play/fixture", "/other/fixture/m3u8", "/play/fixture/m3u8/", "/play/fixture/m3u8.mp4", "/play//m3u8", "/play/fixture/extra/m3u8", "/play/../m3u8", "/play/%41/m3u8", "/play/fixture%2Fextra/m3u8", "/play/fixture/M3U8"}) {
            assertNull(path, hint(first("https://media.fixture.invalid" + path)));
        }
    }

    @Test public void nonHttpOrUserInfoNeverForcesHls() throws Exception {
        for (String url : new String[]{"ftp://media.fixture.invalid/play/fixture/m3u8", "file:///play/fixture/m3u8", "https:///play/fixture/m3u8", "https://fixture@media.fixture.invalid/play/fixture/m3u8", "https://media_fixture.invalid/play/fixture/m3u8"}) {
            assertNull(hint(first(url)));
        }
    }

    private void assertWired(String filename) throws Exception {
        String source = new String(Files.readAllBytes(Paths.get("src/main/java/com/xandeflix/prebuilt/player/", filename)), StandardCharsets.UTF_8);
        assertTrue(filename + " must bind the explicit hint to the original request URI",
            java.util.regex.Pattern.compile("new MediaItem\\.Builder\\(\\)\\s*\\.setUri\\([^;]+?\\.setMimeType\\(request\\.getMediaMimeTypeHint\\(\\)\\)\\s*\\.build\\(\\)").matcher(source).find());
    }

    @Test public void previewMediaItemIsWired() throws Exception { assertWired("NativeAndroidPlayerPlugin.java"); }
    @Test public void fullscreenMediaItemIsWired() throws Exception { assertWired("NativePlayerActivity.java"); }
}
