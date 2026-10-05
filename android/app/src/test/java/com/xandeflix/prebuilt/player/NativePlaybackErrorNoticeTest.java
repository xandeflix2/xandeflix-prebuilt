package com.xandeflix.prebuilt.player;

import static org.junit.Assert.*;

import androidx.media3.common.PlaybackException;
import androidx.media3.datasource.HttpDataSource;
import org.junit.Test;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.Map;

/** Actual IPC data values; no reliance on Android's stubbed JSONObject getters. */
public class NativePlaybackErrorNoticeTest {
    @Test
    public void http404CauseBecomesSanitizedTerminalData() {
        HttpDataSource.InvalidResponseCodeException cause = new HttpDataSource.InvalidResponseCodeException(
                404, "fixture-secret", null, Collections.singletonMap("Authorization", Collections.singletonList("fixture-secret")), null, new byte[0]);
        PlaybackException error = new PlaybackException("fixture-secret", cause, PlaybackException.ERROR_CODE_IO_BAD_HTTP_STATUS);
        Map<String, Object> data = NativeAndroidPlayerPlugin.buildResumeData(1500L, false, "NATIVE_ERROR",
                NativePlayerActivity.categorizeError(error), NativeStreamRequest.describeHttpStatus(error));
        assertEquals(404, data.get("httpStatus"));
        assertEquals("HTTP_ERROR", data.get("errorCategory"));
        assertEquals("NATIVE_ERROR", data.get("errorCode"));
        assertEquals(1500L, data.get("positionMs"));
        assertEquals(false, data.get("ended"));
        assertEquals(new HashSet<>(Arrays.asList("positionMs", "ended", "errorCode", "errorCategory", "httpStatus")), data.keySet());
        assertFalse(data.toString().contains("fixture-secret"));
        assertNotNull(NativeAndroidPlayerPlugin.buildResumePayload(1500L, false, "NATIVE_ERROR", "HTTP_ERROR", "404"));
    }

    @Test
    public void httpStatusAllowlistRejectsMalformedValues() {
        for (String status : Arrays.asList("400", "401", "403", "404", "500", "599")) {
            assertEquals(Integer.valueOf(status), NativeAndroidPlayerPlugin.buildResumeData(0L, false, "NATIVE_ERROR", "HTTP_ERROR", status).get("httpStatus"));
        }
        for (String status : Arrays.asList(null, "399", "600", "404.0", " 404", "404 ", "https://fixture.invalid/secret", "404\n", "0404")) {
            assertFalse(NativeAndroidPlayerPlugin.buildResumeData(0L, false, "NATIVE_ERROR", "HTTP_ERROR", status).containsKey("httpStatus"));
        }
    }

    @Test
    public void categoryAllowlistDoesNotAcceptRawMessages() {
        for (String category : Arrays.asList("NETWORK_TIMEOUT", "DECODER_ERROR", "SOURCE_UNAVAILABLE", "MEDIA_PARSER_FAILURE", "MEDIA_ERROR", "UNKNOWN")) {
            Map<String, Object> data = NativeAndroidPlayerPlugin.buildResumeData(0L, false, "NATIVE_ERROR", category, "404");
            assertEquals(category, data.get("errorCategory"));
            assertFalse(data.containsKey("httpStatus"));
        }
        for (String category : Arrays.asList(null, "http_error", "HTTP_ERROR ", "https://fixture.invalid/secret")) {
            Map<String, Object> data = NativeAndroidPlayerPlugin.buildResumeData(0L, false, "https://fixture.invalid/secret", category, "404");
            assertEquals("UNKNOWN", data.get("errorCategory"));
            assertEquals("NATIVE_ERROR", data.get("errorCode"));
            assertFalse(data.toString().contains("fixture.invalid"));
        }
    }

    @Test
    public void backAndCompletionNeverCarryFalseErrorDetails() {
        for (boolean ended : new boolean[]{false, true}) {
            for (String code : Arrays.asList(null, "", " ")) {
                Map<String, Object> data = NativeAndroidPlayerPlugin.buildResumeData(-1L, ended, code, "HTTP_ERROR", "404");
                assertEquals(new HashSet<>(Arrays.asList("positionMs", "ended")), data.keySet());
                assertEquals(0L, data.get("positionMs"));
                assertEquals(ended, data.get("ended"));
            }
        }
        assertNotNull(NativeAndroidPlayerPlugin.buildResumePayload(0L, false, null));
        assertNotNull(NativeAndroidPlayerPlugin.buildResumePayload(0L, true, null));
        assertNotNull(NativeAndroidPlayerPlugin.buildResumePayload(0L, false, "NATIVE_ERROR"));
    }

    @Test
    public void decoderAndNetworkKeepExistingCategorization() {
        assertEquals("DECODER_ERROR", NativePlayerActivity.categorizeError(new PlaybackException("fixture-secret", null, PlaybackException.ERROR_CODE_DECODING_FAILED)));
        assertEquals("NETWORK_TIMEOUT", NativePlayerActivity.categorizeError(new PlaybackException("fixture-secret", null, PlaybackException.ERROR_CODE_IO_NETWORK_CONNECTION_TIMEOUT)));
    }
}
