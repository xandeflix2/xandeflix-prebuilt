package com.xandeflix.prebuilt.player;

import static org.junit.Assert.*;

import androidx.media3.common.PlaybackException;
import androidx.media3.datasource.HttpDataSource;

import org.junit.Test;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Testes unitários para o NativeStreamRequest (Unidade T1).
 */
public class NativeStreamRequestTest {

    // A. M3U directStreamUrl -> candidate #1 é a URL original
    @Test
    public void testM3uDirectStreamCandidate1IsOriginalUrl() {
        String m3uUrl = "http://234.bxdtxs.space:80/movie/user123/pass456/472600.mp4";
        List<NativeStreamRequest> requests = NativeStreamRequest.fromRawUrl(m3uUrl);

        assertNotNull(requests);
        assertFalse(requests.isEmpty());
        NativeStreamRequest first = requests.get(0);
        assertEquals(m3uUrl, first.getMediaUrl());
        assertEquals(1, first.getCandidateIndex());
    }

    // B. M3U direct -> não gera candidatos Xtream espúrios
    @Test
    public void testM3uDirectDoesNotGenerateSpuriousXtreamCandidates() {
        String m3uVodUrl = "http://server.iptv:8080/movie/user/pass/98765.mkv";
        List<NativeStreamRequest> requests = NativeStreamRequest.fromRawUrl(m3uVodUrl);

        assertEquals(1, requests.size());
        assertEquals(m3uVodUrl, requests.get(0).getMediaUrl());
        assertEquals(1, requests.get(0).getCandidateCount());
    }

    // C. Xtream -> gera candidatos compatíveis de forma determinística
    @Test
    public void testXtreamGeneratesCompatibilityCandidatesDeterministically() {
        // Formato numérico padrão sem extensão de VOD: /user/pass/12345
        String xtreamUrl = "http://stream.host:8080/alice/secret/555";
        List<NativeStreamRequest> requests = NativeStreamRequest.fromRawUrl(xtreamUrl);

        assertTrue("Xtream deve produzir múltiplos candidatos", requests.size() > 1);
        assertEquals(xtreamUrl, requests.get(0).getMediaUrl());
        assertTrue(requests.get(1).getMediaUrl().contains("/live/alice/secret/555.ts"));
        assertTrue(requests.get(2).getMediaUrl().contains("/live/alice/secret/555"));
        assertTrue(requests.get(3).getMediaUrl().contains("/alice/secret/555.ts"));

        // Determinismo: rodar novamente e checar igualdade
        List<NativeStreamRequest> secondRun = NativeStreamRequest.fromRawUrl(xtreamUrl);
        assertEquals(requests.size(), secondRun.size());
        for (int i = 0; i < requests.size(); i++) {
            assertEquals(requests.get(i).getMediaUrl(), secondRun.get(i).getMediaUrl());
        }
    }

    // D. HTTP 403/404 -> candidate fallback elegível
    @Test
    public void testHttpBadStatusEligibleForFallback() {
        HttpDataSource.InvalidResponseCodeException ex404 =
                new HttpDataSource.InvalidResponseCodeException(
                        404,
                        "Not Found",
                        null,
                        Collections.emptyMap(),
                        null,
                        new byte[0]
                );
        PlaybackException playbackError404 = new PlaybackException(
                "HTTP error",
                ex404,
                PlaybackException.ERROR_CODE_IO_BAD_HTTP_STATUS
        );

        assertTrue(NativeStreamRequest.shouldTryNextCandidate(playbackError404));
        assertEquals("404", NativeStreamRequest.describeHttpStatus(playbackError404));

        HttpDataSource.InvalidResponseCodeException ex403 =
                new HttpDataSource.InvalidResponseCodeException(
                        403,
                        "Forbidden",
                        null,
                        Collections.emptyMap(),
                        null,
                        new byte[0]
                );
        PlaybackException playbackError403 = new PlaybackException(
                "Forbidden",
                ex403,
                PlaybackException.ERROR_CODE_IO_BAD_HTTP_STATUS
        );

        assertTrue(NativeStreamRequest.shouldTryNextCandidate(playbackError403));
        assertEquals("403", NativeStreamRequest.describeHttpStatus(playbackError403));
    }

    // E. Decoder / runtime error -> não dispara candidate fallback arbitrário
    @Test
    public void testDecoderOrRuntimeErrorDoesNotTriggerFallback() {
        PlaybackException decoderError = new PlaybackException(
                "Decoder init failed",
                new RuntimeException("MediaCodec OOM"),
                PlaybackException.ERROR_CODE_DECODER_INIT_FAILED
        );

        assertFalse(NativeStreamRequest.shouldTryNextCandidate(decoderError));
        assertEquals("unknown", NativeStreamRequest.describeHttpStatus(decoderError));
    }

    // F. Pipe headers -> parsing correto
    @Test
    public void testPipeHeadersParsing() {
        String urlWithPipe = "http://provider.tv:8080/live/ch1.m3u8|User-Agent=CustomUA%20V1&Referer=https%3A%2F%2Fsite.com";
        List<NativeStreamRequest> requests = NativeStreamRequest.fromRawUrl(urlWithPipe);

        assertNotNull(requests);
        assertFalse(requests.isEmpty());
        NativeStreamRequest req = requests.get(0);

        assertEquals("http://provider.tv:8080/live/ch1.m3u8", req.getMediaUrl());
        assertEquals("CustomUA V1", req.getUserAgent());
        assertEquals("https://site.com", req.getRequestHeaders().get("Referer"));
        assertTrue(req.hasPipeHeaders());
    }

    // G. User-Agent custom -> aceito
    @Test
    public void testCustomUserAgentAccepted() {
        String raw = "http://stream.host/play.m3u8";
        List<NativeStreamRequest> requests = NativeStreamRequest.fromUrlWithHeaders(
                raw,
                null,
                "ExoPlayerCustom/2.0"
        );

        assertEquals("ExoPlayerCustom/2.0", requests.get(0).getUserAgent());
        assertTrue(requests.get(0).isCustomUserAgentUsed());
    }

    // H. Default User-Agent -> fallback correto
    @Test
    public void testDefaultUserAgentFallback() {
        String raw = "http://stream.host/play.m3u8";
        List<NativeStreamRequest> requests = NativeStreamRequest.fromRawUrl(raw);

        assertEquals(NativeStreamRequest.DEFAULT_USER_AGENT, requests.get(0).getUserAgent());
        assertFalse(requests.get(0).isCustomUserAgentUsed());
    }

    // I. Authorization -> encaminhado em runtime
    @Test
    public void testAuthorizationRuntimeForwarding() {
        String raw = "http://secure.stream.host/video.m3u8";
        Map<String, String> headers = new HashMap<>();
        headers.put("Authorization", "Bearer my_secret_token_123");

        List<NativeStreamRequest> requests = NativeStreamRequest.fromUrlWithHeaders(raw, headers, null);
        NativeStreamRequest req = requests.get(0);

        assertEquals("Bearer my_secret_token_123", req.getRequestHeaders().get("Authorization"));
        // Diagnóstico NUNCA deve expor o valor secreto:
        assertFalse(req.getHeaderSummary().contains("my_secret_token_123"));
        assertTrue(req.getHeaderSummary().contains("Authorization=[PRESENT_REDACTED]"));
    }

    // J. Header não permitido -> rejeitado
    @Test
    public void testDisallowedHeadersRejected() {
        Map<String, String> headers = new HashMap<>();
        headers.put("Cookie", "session=123");
        headers.put("X-Custom-Hack", "malicious");
        headers.put("Referer", "https://allowed.org");

        List<NativeStreamRequest> requests = NativeStreamRequest.fromUrlWithHeaders(
                "http://stream.host/vod.mp4",
                headers,
                null
        );
        NativeStreamRequest req = requests.get(0);

        assertNull(req.getRequestHeaders().get("Cookie"));
        assertNull(req.getRequestHeaders().get("X-Custom-Hack"));
        assertEquals("https://allowed.org", req.getRequestHeaders().get("Referer"));
    }

    // K. CR/LF injection -> sanitizado/rejeitado
    @Test
    public void testCrLfHeaderInjectionPrevented() {
        // Nome com CRLF ou ':' deve ser nulo
        assertNull(NativeStreamRequest.normalizeHeaderName("Referer\r\nInjected: hack"));
        assertNull(NativeStreamRequest.normalizeHeaderName("Bad:Header"));

        // Valor com CRLF deve ter CRLF removido
        String sanitized = NativeStreamRequest.sanitizeHeaderValue("https://clean.site\r\nInjected-Line");
        assertEquals("https://clean.siteInjected-Line", sanitized);
        assertFalse(sanitized.contains("\r"));
        assertFalse(sanitized.contains("\n"));
    }

    // L. URL com credencial -> diagnostic output mascarado
    @Test
    public void testUrlWithCredentialsMaskedInDiagnostic() {
        String rawWithCredentials = "http://username123:secretpassword@provider.space:8080/movie/usr/pwd/movie123.mp4";
        String masked = NativeStreamRequest.maskStreamUrl(rawWithCredentials);

        assertFalse(masked.contains("secretpassword"));
        assertFalse(masked.contains("username123"));
        assertTrue(masked.contains("provider.space:8080"));
        assertTrue(masked.contains("movie123.mp4"));
    }
}
