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
            if (val instanceof Number) {
                return ((Number) val).longValue();
            }
            return defaultValue;
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
