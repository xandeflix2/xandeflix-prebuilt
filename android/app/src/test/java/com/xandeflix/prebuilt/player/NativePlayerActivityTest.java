package com.xandeflix.prebuilt.player;

import static org.junit.Assert.*;

import android.content.Intent;
import android.view.KeyEvent;

import androidx.media3.common.PlaybackException;
import androidx.media3.common.Player;
import androidx.media3.datasource.DefaultHttpDataSource;
import androidx.media3.datasource.HttpDataSource;
import androidx.media3.exoplayer.DefaultLoadControl;

import org.junit.Before;
import org.junit.Test;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Suíte de testes unitários para NativePlayerActivity (Unidade T3).
 *
 * Valida contratos, integração Media3, candidate fallback, D-pad, fullscreen e lifecycle.
 */
public class NativePlayerActivityTest {

    // 1. Activity contract & candidate #1
    @Test
    public void testActivityContractAndCandidate1() {
        TestIntent intent = new TestIntent();
        intent.putExtra(PlaybackIntentContract.EXTRA_URI, "http://provider.tv:8080/movie/user/pass/9999.mp4");
        intent.putExtra("kind", "movie");
        intent.putExtra(PlaybackIntentContract.EXTRA_TITLE, "Filme 9999");
        intent.putExtra(PlaybackIntentContract.EXTRA_START_POSITION_MS, 15000L);

        NativePlayerActivity.ParsedPlaybackIntent parsed = NativePlayerActivity.parseIntent(intent);
        assertTrue("parseIntent deve retornar valid=true para intent válida", parsed.valid);

        assertEquals("movie", parsed.kind);
        assertEquals("Filme 9999", parsed.title);
        assertEquals(15000L, parsed.startPositionMs);

        List<NativeStreamRequest> candidates = parsed.candidateRequests;
        assertNotNull(candidates);
        assertFalse(candidates.isEmpty());
        // Regra canônica: Candidate #1 é a URL direta original
        assertEquals("http://provider.tv:8080/movie/user/pass/9999.mp4", candidates.get(0).getMediaUrl());
    }

    // 2. Intent validation (rejeição de URI ausente ou malformada)
    @Test
    public void testIntentValidationRejection() {
        TestIntent emptyIntent = new TestIntent();
        assertFalse(NativePlayerActivity.parseIntent(emptyIntent).valid);

        TestIntent nullUriIntent = new TestIntent();
        nullUriIntent.putExtra(PlaybackIntentContract.EXTRA_URI, "");
        assertFalse(NativePlayerActivity.parseIntent(nullUriIntent).valid);

        TestIntent forbiddenSchemeIntent = new TestIntent();
        forbiddenSchemeIntent.putExtra(PlaybackIntentContract.EXTRA_URI, "file:///sdcard/video.mp4");
        assertFalse(NativePlayerActivity.parseIntent(forbiddenSchemeIntent).valid);
    }

    // 3. Media3 initialization contract & load control
    @Test
    public void testMedia3LoadControlBuffers() {
        DefaultLoadControl loadControl = NativePlayerActivity.buildLoadControl(2500, 12000, 500, 1000);
        assertNotNull("DefaultLoadControl deve ser construído com buffers canônicos", loadControl);
    }

    // 4. Headers transfer contract
    @Test
    public void testHeadersTransferContract() {
        TestIntent intent = new TestIntent();
        intent.putExtra(PlaybackIntentContract.EXTRA_URI, "http://stream.host/play.m3u8");
        intent.putExtra("kind", "live");

        ArrayList<String> keys = new ArrayList<>(Arrays.asList("User-Agent", "Referer", "Authorization", "X-Custom-Reject"));
        ArrayList<String> values = new ArrayList<>(Arrays.asList("MyCustomPlayer/2.0", "https://site.org", "Bearer sec_tok", "hack"));
        intent.putStringArrayListExtra(PlaybackIntentContract.EXTRA_HEADERS_KEYS, keys);
        intent.putStringArrayListExtra(PlaybackIntentContract.EXTRA_HEADERS_VALUES, values);

        NativePlayerActivity.ParsedPlaybackIntent parsed = NativePlayerActivity.parseIntent(intent);
        assertTrue(parsed.valid);

        NativeStreamRequest req = parsed.candidateRequests.get(0);
        assertEquals("MyCustomPlayer/2.0", req.getUserAgent());
        assertEquals("https://site.org", req.getRequestHeaders().get("Referer"));
        assertEquals("Bearer sec_tok", req.getRequestHeaders().get("Authorization"));
        assertNull("Header fora da allowlist deve ser rejeitado", req.getRequestHeaders().get("X-Custom-Reject"));

        HttpDataSource.Factory factory = NativePlayerActivity.buildHttpDataSourceFactory(req);
        assertNotNull(factory);
    }

    // 5. Candidate fallback HTTP error (HTTP 403 / 404 / 500)
    @Test
    public void testCandidateFallbackHttpError() {
        HttpDataSource.InvalidResponseCodeException ex404 =
                new HttpDataSource.InvalidResponseCodeException(
                        404,
                        "Not Found",
                        null,
                        Collections.emptyMap(),
                        null,
                        new byte[0]
                );
        PlaybackException httpError = new PlaybackException(
                "HTTP Bad Status",
                ex404,
                PlaybackException.ERROR_CODE_IO_BAD_HTTP_STATUS
        );

        assertEquals("HTTP_ERROR", NativePlayerActivity.categorizeError(httpError));
        assertTrue("Erro HTTP é elegível para candidate fallback", NativeStreamRequest.shouldTryNextCandidate(httpError));
        assertEquals("404", NativeStreamRequest.describeHttpStatus(httpError));
    }

    // 6. No fallback for decoder / OOM / runtime error
    @Test
    public void testNoFallbackDecoderOrRuntimeError() {
        PlaybackException decoderError = new PlaybackException(
                "Decoder initialization failed",
                new RuntimeException("MediaCodec OOM"),
                PlaybackException.ERROR_CODE_DECODER_INIT_FAILED
        );

        assertEquals("DECODER_ERROR", NativePlayerActivity.categorizeError(decoderError));
        assertFalse("Decoder error NÃO deve disparar fallback arbitrário", NativeStreamRequest.shouldTryNextCandidate(decoderError));

        PlaybackException timeoutError = new PlaybackException(
                "Timeout",
                null,
                PlaybackException.ERROR_CODE_IO_NETWORK_CONNECTION_TIMEOUT
        );
        assertEquals("NETWORK_TIMEOUT", NativePlayerActivity.categorizeError(timeoutError));

        PlaybackException unknownError = new PlaybackException("Unknown", null, 1000);
        assertEquals("UNKNOWN", NativePlayerActivity.categorizeError(unknownError));
    }

    // 7. D-pad & BACK navigation controls
    @Test
    public void testDpadNavigationAndBackControls() {
        TestPlayerState playerState = new TestPlayerState();
        Player dummyPlayer = playerState.asPlayer();

        // A. Tecla BACK -> aciona runnable de encerramento e retorna true
        boolean[] backExecuted = new boolean[]{false};
        assertTrue(NativePlayerActivity.handleDpadKey(KeyEvent.KEYCODE_BACK, KeyEvent.ACTION_DOWN, "movie", dummyPlayer, null, () -> backExecuted[0] = true));
        assertTrue("Callback de encerramento de Activity/Player deve ser acionado", backExecuted[0]);

        // B. Tecla DPAD_CENTER / ENTER -> toggle play/pause
        playerState.playing = false;
        assertTrue(NativePlayerActivity.handleDpadKey(KeyEvent.KEYCODE_DPAD_CENTER, KeyEvent.ACTION_DOWN, "movie", dummyPlayer, null));
        assertTrue(playerState.playCalled);

        playerState.playing = true;
        playerState.playCalled = false;
        assertTrue(NativePlayerActivity.handleDpadKey(KeyEvent.KEYCODE_ENTER, KeyEvent.ACTION_DOWN, "movie", dummyPlayer, null));
        assertTrue(playerState.pauseCalled);

        // C. MEDIA_PLAY / MEDIA_PAUSE
        playerState.playCalled = false;
        assertTrue(NativePlayerActivity.handleDpadKey(KeyEvent.KEYCODE_MEDIA_PLAY, KeyEvent.ACTION_DOWN, "movie", dummyPlayer, null));
        assertTrue(playerState.playCalled);

        playerState.pauseCalled = false;
        assertTrue(NativePlayerActivity.handleDpadKey(KeyEvent.KEYCODE_MEDIA_PAUSE, KeyEvent.ACTION_DOWN, "movie", dummyPlayer, null));
        assertTrue(playerState.pauseCalled);

        // D. Seek no filme (+15s e -5s)
        playerState.currentPosition = 30000L;
        playerState.duration = 100000L;
        playerState.seekPosition = -1L;
        assertTrue(NativePlayerActivity.handleDpadKey(KeyEvent.KEYCODE_DPAD_RIGHT, KeyEvent.ACTION_DOWN, "movie", dummyPlayer, null));
        assertEquals(45000L, playerState.seekPosition);

        playerState.currentPosition = 30000L;
        playerState.seekPosition = -1L;
        assertTrue(NativePlayerActivity.handleDpadKey(KeyEvent.KEYCODE_DPAD_LEFT, KeyEvent.ACTION_DOWN, "movie", dummyPlayer, null));
        assertEquals(25000L, playerState.seekPosition);

        // E. Live TV: Seek NÃO deve ser executado
        playerState.seekPosition = -1L;
        assertFalse("Live TV não deve permitir seek para frente via D-pad",
                NativePlayerActivity.handleDpadKey(KeyEvent.KEYCODE_DPAD_RIGHT, KeyEvent.ACTION_DOWN, "live", dummyPlayer, null));
        assertEquals(-1L, playerState.seekPosition);

        assertFalse("Live TV não deve permitir seek para trás via D-pad",
                NativePlayerActivity.handleDpadKey(KeyEvent.KEYCODE_DPAD_LEFT, KeyEvent.ACTION_DOWN, "live", dummyPlayer, null));
        assertEquals(-1L, playerState.seekPosition);

        // F. Tecla MENU -> retorna true
        assertTrue(NativePlayerActivity.handleDpadKey(KeyEvent.KEYCODE_MENU, KeyEvent.ACTION_DOWN, "movie", dummyPlayer, null));

        // G. Teclas aleatórias -> retorna false
        assertFalse(NativePlayerActivity.handleDpadKey(KeyEvent.KEYCODE_A, KeyEvent.ACTION_DOWN, "movie", dummyPlayer, null));
        assertFalse(NativePlayerActivity.handleDpadKey(KeyEvent.KEYCODE_DPAD_RIGHT, KeyEvent.ACTION_UP, "movie", dummyPlayer, null));
    }

    // 8. Fullscreen strategy & controller auto-hide
    @Test
    public void testFullscreenStrategyAndConstants() {
        NativePlayerActivity.applyImmersiveFullscreen(null); // seguro contra null
        assertEquals(3500, NativePlayerActivity.AUTO_HIDE_CONTROLLER_MS);
        assertEquals("SENSOR_LANDSCAPE_PREFERRED", NativePlayerActivity.PLAYER_ORIENTATION_POLICY);
    }

    // 9. Zero secret logging
    @Test
    public void testNoSecretLogging() {
        String sensitiveUrl = "http://admin_user:secret_pass123@iptv.server:8080/live/admin_user/secret_pass123/100.ts";
        String masked = NativeStreamRequest.maskStreamUrl(sensitiveUrl);

        assertFalse("Senha jamais deve constar na URL mascarada", masked.contains("secret_pass123"));
        assertFalse("Usuário jamais deve constar na URL mascarada", masked.contains("admin_user"));
        assertTrue(masked.contains("iptv.server:8080"));
    }

    // 10. Fallback eligibility logic
    @Test
    public void testFallbackEligibilityLogic() {
        // Erro nulo
        assertFalse(NativeStreamRequest.shouldTryNextCandidate(null));

        // Erro HTTP Bad Status -> Elegível
        PlaybackException httpErr = new PlaybackException("HTTP", null, PlaybackException.ERROR_CODE_IO_BAD_HTTP_STATUS);
        assertTrue(NativeStreamRequest.shouldTryNextCandidate(httpErr));

        // Erro Decoder -> Não elegível
        PlaybackException decErr = new PlaybackException("Decoder", null, PlaybackException.ERROR_CODE_DECODER_INIT_FAILED);
        assertFalse(NativeStreamRequest.shouldTryNextCandidate(decErr));
    }

    // Test double para Intent
    static class TestIntent extends Intent {
        private final Map<String, Object> extras = new HashMap<>();

        @Override
        public Intent putExtra(String name, String value) {
            extras.put(name, value);
            return this;
        }

        @Override
        public Intent putExtra(String name, long value) {
            extras.put(name, value);
            return this;
        }

        @Override
        public Intent putStringArrayListExtra(String name, ArrayList<String> value) {
            extras.put(name, value);
            return this;
        }

        @Override
        public String getStringExtra(String name) {
            Object val = extras.get(name);
            return val instanceof String ? (String) val : null;
        }

        @Override
        public long getLongExtra(String name, long defaultValue) {
            Object val = extras.get(name);
            return val instanceof Number ? ((Number) val).longValue() : defaultValue;
        }

        @Override
        @SuppressWarnings("unchecked")
        public ArrayList<String> getStringArrayListExtra(String name) {
            Object val = extras.get(name);
            return val instanceof ArrayList ? (ArrayList<String>) val : null;
        }
    }

    // Test double para Player utilizando Dynamic Proxy
    static class TestPlayerState {
        boolean playing = false;
        boolean playCalled = false;
        boolean pauseCalled = false;
        long currentPosition = 0L;
        long duration = 100000L;
        long seekPosition = -1L;

        Player asPlayer() {
            return (Player) java.lang.reflect.Proxy.newProxyInstance(
                Player.class.getClassLoader(),
                new Class<?>[]{Player.class},
                (proxy, method, args) -> {
                    String name = method.getName();
                    if (name.equals("isPlaying")) return playing;
                    if (name.equals("play")) { playCalled = true; playing = true; return null; }
                    if (name.equals("pause")) { pauseCalled = true; playing = false; return null; }
                    if (name.equals("getCurrentPosition")) return currentPosition;
                    if (name.equals("getDuration")) return duration;
                    if (name.equals("seekTo") && args != null && args.length == 1 && args[0] instanceof Long) {
                        this.seekPosition = (Long) args[0];
                        return null;
                    }
                    Class<?> rt = method.getReturnType();
                    if (rt.equals(boolean.class)) return false;
                    if (rt.equals(int.class)) return 0;
                    if (rt.equals(long.class)) return 0L;
                    if (rt.equals(float.class)) return 0f;
                    if (rt.equals(double.class)) return 0d;
                    return null;
                }
            );
        }
    }
}
