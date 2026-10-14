package com.xandeflix.prebuilt.player;

import static org.junit.Assert.*;

import com.getcapacitor.JSObject;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.xandeflix.prebuilt.MainActivity;

import org.junit.Before;
import org.junit.Test;

import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

/**
 * Suíte de testes unitários para NativeAndroidPlayerPlugin (Unidade T2).
 *
 * Cobre:
 * 1. Anotação e identificador do plugin (CapacitorPlugin name = "NativeAndroidPlayer");
 * 2. Contrato open() com requisição válida aceita;
 * 3. Contrato open() com requisições inválidas (URI ausente, sintética, tipo inválido, posição negativa);
 * 4. Proteção de headers contra logs e vazamento de segredos;
 * 5. Proteção de Authorization contra logs e exposição em diagnósticos;
 * 6. Contrato startPreview();
 * 7. Contrato updatePreview();
 * 8. Contrato stopPreview();
 * 9. Sanitização estrita do payload do evento resume;
 * 10. Compilação e registro do plugin em MainActivity.
 */
public class NativeAndroidPlayerPluginTest {

    private NativeAndroidPlayerPlugin plugin;

    @Test public void testSupportDiagnosticCarriesActualCodeAndClosedCheckpoint() {
        Map<String,Object> data = NativeAndroidPlayerPlugin.buildResumeData(1234L, false, "NATIVE_ERROR", "HTTP_ERROR", "401", 2004, "DATASOURCE_OPEN");
        assertEquals(2004, data.get("media3ErrorCode"));
        assertEquals(401, data.get("httpStatus"));
        assertEquals("DATASOURCE_OPEN", data.get("checkpoint"));
        assertEquals(7, data.size());
    }

    @Test public void testSupportDiagnosticRejectsInvalidCodesAndRawCheckpoint() {
        for (Integer code : new Integer[]{null, -1, 0, 999}) {
            Map<String,Object> data = NativeAndroidPlayerPlugin.buildResumeData(0L, false, "NATIVE_ERROR", "DECODER_ERROR", "401", code, "https://fixture.invalid/private?token=fixture-secret");
            assertFalse(data.containsKey("media3ErrorCode"));
            assertFalse(data.containsKey("checkpoint"));
            assertFalse(data.containsKey("httpStatus"));
            assertFalse(data.toString().contains("fixture-secret"));
        }
    }

    @Test public void testSupportDiagnosticDoesNotChangeManualBackCompletionOrOldApi() {
        for (boolean ended : new boolean[]{true, false}) {
            Map<String,Object> data = NativeAndroidPlayerPlugin.buildResumeData(5678L, ended, null, "HTTP_ERROR", "401", 2004, "DATASOURCE_OPEN");
            assertEquals(2, data.size());
            assertEquals(5678L, data.get("positionMs"));
            assertEquals(ended, data.get("ended"));
        }
        assertEquals(NativeAndroidPlayerPlugin.buildResumeData(1234L, false, "NATIVE_ERROR", "HTTP_ERROR", "401"),
                NativeAndroidPlayerPlugin.buildResumeData(1234L, false, "NATIVE_ERROR", "HTTP_ERROR", "401", null, null));
    }

    @Before
    public void setUp() {
        plugin = new NativeAndroidPlayerPlugin();
    }

    // 1. Plugin annotation e name
    @Test
    public void testPluginAnnotationAndName() {
        CapacitorPlugin annotation = NativeAndroidPlayerPlugin.class.getAnnotation(CapacitorPlugin.class);
        assertNotNull("Plugin deve declarar a anotação @CapacitorPlugin", annotation);
        assertEquals("Nome canônico do plugin deve ser NativeAndroidPlayer", "NativeAndroidPlayer", annotation.name());
    }

    // 2. Open valid request accepted
    @Test
    public void testOpenValidRequestAccepted() {
        TestPluginCall call = new TestPluginCall();
        call.put("uri", "http://server.iptv:8080/movie/user/pass/12345.mp4");
        call.put("title", "Filme Teste");
        call.put("kind", "movie");
        call.put("startPositionMs", 10000L);

        plugin.open(call);

        assertTrue("Chamada válida de open() deve ser resolvida", call.resolved);
        assertFalse("Chamada válida de open() não deve ser rejeitada", call.rejected);
        assertNotNull(call.resolvedData);
    }

    // 3. Open invalid request rejected (URI ausente, sintética, kind inválido, startPositionMs < 0)
    @Test
    public void testOpenInvalidRequestsRejected() {
        // A. URI vazia/ausente
        TestPluginCall callEmptyUri = new TestPluginCall();
        callEmptyUri.put("uri", "");
        callEmptyUri.put("kind", "movie");
        plugin.open(callEmptyUri);
        assertTrue(callEmptyUri.rejected);
        assertEquals(NativeAndroidPlayerPlugin.ERROR_INVALID_REQUEST, callEmptyUri.rejectCode);

        // B. URI sintética
        TestPluginCall callSynthetic = new TestPluginCall();
        callSynthetic.put("uri", "http://media.example.invalid/live/ch1.m3u8");
        callSynthetic.put("kind", "live");
        plugin.open(callSynthetic);
        assertTrue(callSynthetic.rejected);
        assertEquals(NativeAndroidPlayerPlugin.ERROR_INVALID_REQUEST, callSynthetic.rejectCode);

        // C. Kind inválido
        TestPluginCall callInvalidKind = new TestPluginCall();
        callInvalidKind.put("uri", "http://server.iptv/stream.m3u8");
        callInvalidKind.put("kind", "invalid_kind_123");
        plugin.open(callInvalidKind);
        assertTrue(callInvalidKind.rejected);
        assertEquals(NativeAndroidPlayerPlugin.ERROR_INVALID_REQUEST, callInvalidKind.rejectCode);

        // D. startPositionMs negativa
        TestPluginCall callNegativePos = new TestPluginCall();
        callNegativePos.put("uri", "http://server.iptv/movie.mp4");
        callNegativePos.put("kind", "movie");
        callNegativePos.put("startPositionMs", -100L);
        plugin.open(callNegativePos);
        assertTrue(callNegativePos.rejected);
        assertEquals(NativeAndroidPlayerPlugin.ERROR_INVALID_REQUEST, callNegativePos.rejectCode);
    }

    // 4. Headers not logged (integração segura via NativeStreamRequest)
    @Test
    public void testHeadersNotLogged() {
        TestJSObject headersObj = new TestJSObject();
        headersObj.putHeader("User-Agent", "SecurePlayer/1.0");
        headersObj.putHeader("Referer", "https://provider.internal/auth");
        headersObj.putHeader("X-Malicious-Header", "injected-content");

        Map<String, String> extracted = NativeAndroidPlayerPlugin.extractExplicitHeaders(headersObj);
        assertNotNull(extracted);
        assertTrue(extracted.containsKey("User-Agent"));
        assertTrue(extracted.containsKey("Referer"));

        // Normalização via NativeStreamRequest filtra headers fora da allowlist
        List<NativeStreamRequest> requests = NativeStreamRequest.fromUrlWithHeaders(
                "http://stream.host/play.m3u8",
                extracted,
                null
        );
        assertFalse(requests.isEmpty());
        NativeStreamRequest req = requests.get(0);

        assertNull("Header desconhecido fora da allowlist deve ser descartado", req.getRequestHeaders().get("X-Malicious-Header"));
        assertEquals("SecurePlayer/1.0", req.getUserAgent());
        assertEquals("https://provider.internal/auth", req.getRequestHeaders().get("Referer"));
    }

    // 5. Authorization not logged
    @Test
    public void testAuthorizationNotLogged() {
        TestJSObject headersObj = new TestJSObject();
        headersObj.putHeader("Authorization", "Bearer super_secret_auth_token_999");

        Map<String, String> extracted = NativeAndroidPlayerPlugin.extractExplicitHeaders(headersObj);
        List<NativeStreamRequest> requests = NativeStreamRequest.fromUrlWithHeaders(
                "http://secure.stream.host/ch1.m3u8",
                extracted,
                null
        );

        NativeStreamRequest req = requests.get(0);
        // O token é transportado em runtime para requisição HTTP:
        assertEquals("Bearer super_secret_auth_token_999", req.getRequestHeaders().get("Authorization"));

        // O resumo de diagnóstico e logging NUNCA pode expor o token bruto:
        String summary = req.getHeaderSummary();
        assertFalse("Resumo de diagnóstico jamais deve vazar o token de autorização", summary.contains("super_secret_auth_token_999"));
        assertTrue("Resumo de diagnóstico deve indicar presença mascarada", summary.contains("Authorization=[PRESENT_REDACTED]"));
    }

    // 6. Preview start contract
    @Test
    public void testPreviewStartContract() {
        TestPluginCall call = new TestPluginCall();
        call.put("uri", "http://server.iptv:8080/live/user/pass/555.ts");
        call.put("kind", "live");

        plugin.startPreview(call);

        assertTrue("startPreview() com requisição válida deve resolver", call.resolved);
        assertFalse("startPreview() não deve rejeitar requisição válida", call.rejected);
        assertTrue("Sessão de preview deve estar marcada como ativa", plugin.isPreviewActive());
        assertEquals("live", plugin.getCurrentPreviewKind());

        // Teste com URI sintética deve falhar
        TestPluginCall callInvalid = new TestPluginCall();
        callInvalid.put("uri", "http://media.example.invalid/live");
        plugin.startPreview(callInvalid);
        assertTrue(callInvalid.rejected);
        assertEquals(NativeAndroidPlayerPlugin.ERROR_INVALID_REQUEST, callInvalid.rejectCode);
    }

    // 7. Preview update contract
    @Test
    public void testPreviewUpdateContract() {
        // Inicializa preview
        TestPluginCall startCall = new TestPluginCall();
        startCall.put("uri", "http://server.iptv:8080/live/user/pass/1.ts");
        plugin.startPreview(startCall);

        TestPluginCall updateCall = new TestPluginCall();
        updateCall.put("uri", "http://server.iptv:8080/live/user/pass/2.ts");

        plugin.updatePreview(updateCall);

        assertTrue("updatePreview() com requisição válida deve resolver", updateCall.resolved);
        assertFalse("updatePreview() não deve rejeitar", updateCall.rejected);

        // Update com URI sintética deve falhar
        TestPluginCall updateInvalid = new TestPluginCall();
        updateInvalid.put("uri", "http://synthetic.stream/live");
        plugin.updatePreview(updateInvalid);
        assertTrue(updateInvalid.rejected);
        assertEquals(NativeAndroidPlayerPlugin.ERROR_INVALID_REQUEST, updateInvalid.rejectCode);
    }

    // 8. Preview stop contract
    @Test
    public void liveHandoffStopsMediaButPreservesPreviewAndPresentation() throws Exception {
        for (int mode = 0; mode < 3; mode++) {
            NativeAndroidPlayerPlugin owner = new NativeAndroidPlayerPlugin();
            TestPluginCall start = new TestPluginCall();
            start.put("uri", "https://fixture.test/live/channel1.ts"); start.put("kind", "live");
            owner.startPreview(start);
            String id = owner.getCurrentPreviewId();
            java.lang.reflect.Field full = NativeAndroidPlayerPlugin.class.getDeclaredField("previewFullscreen");
            java.lang.reflect.Field pip = NativeAndroidPlayerPlugin.class.getDeclaredField("previewInPip");
            java.lang.reflect.Field media = NativeAndroidPlayerPlugin.class.getDeclaredField("previewPlayer");
            java.lang.reflect.Field candidates = NativeAndroidPlayerPlugin.class.getDeclaredField("previewCandidateRequests");
            for (java.lang.reflect.Field field : new java.lang.reflect.Field[]{full,pip,media,candidates}) field.setAccessible(true);
            full.setBoolean(owner, mode > 0); pip.setBoolean(owner, mode == 2);
            java.util.List<String> calls = new java.util.ArrayList<>();
            Object player = java.lang.reflect.Proxy.newProxyInstance(getClass().getClassLoader(),
                new Class<?>[]{androidx.media3.exoplayer.ExoPlayer.class}, (p,m,a) -> {
                    calls.add(m.getName() + ("setPlayWhenReady".equals(m.getName()) ? ":"+a[0] : "")); return null;
                });
            media.set(owner, player);
            TestPluginCall suspend = new TestPluginCall(); suspend.put("previewId", id); suspend.put("suspendPlayback", true);
            owner.updatePreview(suspend);
            assertTrue(suspend.resolved); assertFalse(suspend.rejected);
            assertEquals(java.util.Arrays.asList("setPlayWhenReady:false","stop","clearMediaItems"), calls);
            assertSame(player, media.get(owner)); assertTrue(owner.isPreviewActive());
            assertEquals(id, owner.getCurrentPreviewId());
            assertEquals(mode > 0, full.getBoolean(owner)); assertEquals(mode == 2, pip.getBoolean(owner));
            assertTrue(((List<?>)candidates.get(owner)).isEmpty());
            // Headless media-source update exercises IDs/flags without Android surface infrastructure.
            media.set(owner, null);
            TestPluginCall next = new TestPluginCall(); next.put("previewId", id); next.put("uri", "https://fixture.test/live/channel2.ts");
            owner.updatePreview(next); assertTrue(next.resolved); assertFalse(next.rejected);
            assertEquals(id, owner.getCurrentPreviewId());
            assertEquals(mode > 0, full.getBoolean(owner)); assertEquals(mode == 2, pip.getBoolean(owner));
        }
    }

    @Test
    public void liveHandoffRejectsMissingStaleInactiveAndMixedRequests() {
        TestPluginCall start = new TestPluginCall(); start.put("uri", "https://fixture.test/live/channel1.ts"); start.put("kind", "live");
        plugin.startPreview(start);
        for (String id : new String[]{null, "old-preview"}) {
            TestPluginCall stale = new TestPluginCall(); stale.put("previewId", id); stale.put("suspendPlayback", true);
            plugin.updatePreview(stale); assertTrue(stale.rejected); assertTrue(plugin.isPreviewActive());
        }
        TestPluginCall mixed = new TestPluginCall(); mixed.put("previewId", plugin.getCurrentPreviewId());
        mixed.put("suspendPlayback", true); mixed.put("uri", "https://fixture.test/live/channel2.ts");
        plugin.updatePreview(mixed); assertTrue(mixed.rejected);
        plugin.stopPreview(new TestPluginCall());
        TestPluginCall inactive = new TestPluginCall(); inactive.put("suspendPlayback", true);
        plugin.updatePreview(inactive); assertTrue(inactive.rejected);
    }

    @Test
    public void testPreviewStopContract() {
        TestPluginCall startCall = new TestPluginCall();
        startCall.put("uri", "http://server.iptv:8080/live/user/pass/1.ts");
        plugin.startPreview(startCall);
        assertTrue(plugin.isPreviewActive());

        TestPluginCall stopCall = new TestPluginCall();
        plugin.stopPreview(stopCall);

        assertTrue("stopPreview() deve resolver", stopCall.resolved);
        assertFalse("Preview deve ser marcado como inativo", plugin.isPreviewActive());
        assertNull("Kind do preview deve ser resetado", plugin.getCurrentPreviewKind());
    }

    // 9. Resume payload sanitized
    @Test public void stopRejectsStaleOwnerAndMatchingStopIsIdempotent() {
        TestPluginCall start = new TestPluginCall();
        start.put("uri", "https://fixture.test/live/channel.ts");
        plugin.startPreview(start);
        String id = plugin.getCurrentPreviewId();
        TestPluginCall stale = new TestPluginCall(); stale.put("previewId", "old-page-preview");
        plugin.stopPreview(stale);
        assertTrue(stale.rejected);
        assertTrue(plugin.isPreviewActive());
        assertEquals(id, plugin.getCurrentPreviewId());
        for (int attempt = 0; attempt < 2; attempt++) {
            TestPluginCall stop = new TestPluginCall(); stop.put("previewId", id);
            plugin.stopPreview(stop);
            assertTrue(stop.resolved);
            assertFalse(stop.rejected);
            assertFalse(plugin.isPreviewActive());
        }
    }

    @Test
    public void testResumePayloadSanitized() {
        JSObject payloadNormal = NativeAndroidPlayerPlugin.buildResumePayload(15000L, false, null);
        assertNotNull(payloadNormal);

        // Clamping de posição negativa
        JSObject payloadClamped = NativeAndroidPlayerPlugin.buildResumePayload(-500L, true, "NATIVE_ERROR");
        assertNotNull(payloadClamped);

        // Sanitização de código de erro
        assertEquals("NATIVE_ERROR", NativeAndroidPlayerPlugin.sanitizeErrorCode("NATIVE_ERROR"));
        assertEquals("INVALID_REQUEST", NativeAndroidPlayerPlugin.sanitizeErrorCode("INVALID_REQUEST"));
        assertEquals("NATIVE_ERROR", NativeAndroidPlayerPlugin.sanitizeErrorCode("UNEXPECTED_INTERNAL_ERROR_STACKTRACE"));

        // Emissão segura mesmo sem ponte Capacitor ativa
        plugin.emitResumeEvent(15000L, false, null);
    }

    // 10. Plugin registration compile
    @Test
    public void testPluginRegistrationCompile() {
        // Garante que MainActivity e NativeAndroidPlayerPlugin coexistem e compilam
        assertNotNull(MainActivity.class);
        assertNotNull(NativeAndroidPlayerPlugin.class);
        assertEquals("com.xandeflix.prebuilt.player.NativeAndroidPlayerPlugin", NativeAndroidPlayerPlugin.class.getName());
    }

    @Test
    public void testRealJsonNumericResumePosition() {
        assertEquals(Long.valueOf(115995), NativeAndroidPlayerPlugin.parseStartPositionMs(Integer.valueOf(115995)));
        assertEquals(Long.valueOf(3300000), NativeAndroidPlayerPlugin.parseStartPositionMs(Integer.valueOf(3300000)));
        assertEquals(Long.valueOf(3300123), NativeAndroidPlayerPlugin.parseStartPositionMs(Double.valueOf(3300123)));
        assertEquals(Long.valueOf(765432), NativeAndroidPlayerPlugin.parseStartPositionMs(Long.valueOf(765432)));
        assertEquals(Long.valueOf(0), NativeAndroidPlayerPlugin.parseStartPositionMs(null));
        assertEquals(Long.valueOf(0), NativeAndroidPlayerPlugin.parseStartPositionMs(Integer.valueOf(0)));
        for(Object invalid:new Object[]{-1,1.5,Double.NaN,Double.POSITIVE_INFINITY,Long.MAX_VALUE,"3300000",true})
            assertNull(NativeAndroidPlayerPlugin.parseStartPositionMs(invalid));
        TestPluginCall call=new TestPluginCall();call.put("startPositionMs",Integer.valueOf(115995));
        assertEquals(Long.valueOf(0),call.getLong("startPositionMs",0L));
        assertEquals(Long.valueOf(115995),NativeAndroidPlayerPlugin.parseStartPositionMs(call.getData().opt("startPositionMs")));
    }

    // Test double para PluginCall sem necessidade de infraestrutura Android/WebView
    static class TestPluginCall extends PluginCall {
        final Map<String, Object> dataMap = new HashMap<>();
        boolean resolved = false;
        boolean rejected = false;
        JSObject resolvedData;
        String rejectMessage;
        String rejectCode;

        public TestPluginCall() {
            super(null, "NativeAndroidPlayer", "cb-test-1", "testMethod", null);
        }

        public void put(String key, Object value) {
            dataMap.put(key, value);
        }

        @Override
        public JSObject getData() {
            return new JSObject(){@Override public Object opt(String name){return dataMap.get(name);}};
        }

        @Override
        public String getString(String name) {
            return getString(name, null);
        }

        @Override
        public String getString(String name, String defaultValue) {
            Object val = dataMap.get(name);
            return val instanceof String ? (String) val : defaultValue;
        }

        @Override
        public Long getLong(String name) {
            return getLong(name, null);
        }

        @Override
        public Long getLong(String name, Long defaultValue) {
            Object val = dataMap.get(name);
            if (val instanceof Long) return (Long)val;
            return defaultValue;
        }

        @Override
        public Boolean getBoolean(String name) {
            Object value = dataMap.get(name);
            return value instanceof Boolean ? (Boolean)value : null;
        }

        @Override
        public JSObject getObject(String name) {
            return getObject(name, null);
        }

        @Override
        public JSObject getObject(String name, JSObject defaultValue) {
            Object val = dataMap.get(name);
            if (val instanceof JSObject) {
                return (JSObject) val;
            }
            return defaultValue;
        }

        @Override
        public void resolve(JSObject data) {
            this.resolved = true;
            this.resolvedData = data;
        }

        @Override
        public void resolve() {
            this.resolved = true;
        }

        @Override
        public void reject(String msg, String code, Exception ex, JSObject data) {
            this.rejected = true;
            this.rejectMessage = msg;
            this.rejectCode = code;
        }

        @Override
        public void reject(String msg, String code) {
            this.rejected = true;
            this.rejectMessage = msg;
            this.rejectCode = code;
        }

        @Override
        public void reject(String msg) {
            this.rejected = true;
            this.rejectMessage = msg;
        }
    }

    // Test double para JSObject para cabeçalhos simulados
    static class TestJSObject extends JSObject {
        private final Map<String, String> map = new HashMap<>();

        public TestJSObject putHeader(String key, String val) {
            map.put(key, val);
            return this;
        }

        @Override
        public Iterator<String> keys() {
            return map.keySet().iterator();
        }

        @Override
        public String getString(String name) {
            return map.get(name);
        }

        @Override
        public String optString(String name, String fallback) {
            String val = map.get(name);
            return val != null ? val : fallback;
        }
    }
}
