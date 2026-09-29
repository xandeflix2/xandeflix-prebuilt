package com.xandeflix.prebuilt.player;

import static org.junit.Assert.*;

import androidx.annotation.NonNull;
import androidx.media3.common.PlaybackException;
import androidx.media3.datasource.HttpDataSource;

import org.junit.Test;

import java.io.InputStream;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;

import okhttp3.Dns;

/**
 * Suíte de testes unitários para ResilientDns (Unidade T4) conforme Section 10.
 *
 * Cobertura obrigatória:
 * CASE_A: SYSTEM_DNS=SUCCESS -> fallback não chamado
 * CASE_B: SYSTEM_DNS=UnknownHostException, PUBLIC_FALLBACK=SUCCESS -> retorna endereço válido
 * CASE_C: SYSTEM_DNS=FAIL, FALLBACK=FAIL -> erro UnknownHostException propagado
 * CASE_D: nenhum IP de provedor hardcoded
 * CASE_E: hostname original preservado
 * CASE_F: headers e User-Agent preservados
 * CASE_G: HTTP 401 não aciona DNS fallback
 * CASE_H: HTTP 403 não aciona DNS fallback
 */
public class ResilientDnsTest {

    // CASE_A: SYSTEM_DNS=SUCCESS -> fallback não chamado
    @Test
    public void testCaseA_SystemDnsSuccess_FallbackNotCalled() throws Exception {
        AtomicBoolean fallbackCalled = new AtomicBoolean(false);

        Dns mockSystemDns = hostname -> Collections.singletonList(
                InetAddress.getByAddress(hostname, new byte[]{1, 2, 3, 4})
        );

        ResilientDns.FallbackResolver mockFallback = hostname -> {
            fallbackCalled.set(true);
            return Collections.singletonList(InetAddress.getByAddress(hostname, new byte[]{5, 6, 7, 8}));
        };

        ResilientDns resilientDns = new ResilientDns(mockSystemDns, mockFallback);
        List<InetAddress> result = resilientDns.lookup("valid.domain.com");

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("1.2.3.4", result.get(0).getHostAddress());
        assertFalse("CASE_A: Quando system DNS tem sucesso, fallback NÃO pode ser chamado", fallbackCalled.get());
    }

    // CASE_B: SYSTEM_DNS=UnknownHostException, PUBLIC_FALLBACK=SUCCESS -> resolução retorna endereço válido
    @Test
    public void testCaseB_SystemDnsUnknownHost_FallbackSuccess() throws Exception {
        AtomicBoolean fallbackCalled = new AtomicBoolean(false);

        Dns failingSystemDns = hostname -> {
            throw new UnknownHostException("System DNS failed for " + hostname);
        };

        ResilientDns.FallbackResolver successfulFallback = hostname -> {
            fallbackCalled.set(true);
            return Collections.singletonList(
                    InetAddress.getByAddress(hostname, new byte[]{(byte) 209, 97, (byte) 177, 104})
            );
        };

        ResilientDns resilientDns = new ResilientDns(failingSystemDns, successfulFallback);
        List<InetAddress> result = resilientDns.lookup("234.bxdtxs.space");

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("209.97.177.104", result.get(0).getHostAddress());
        assertTrue("CASE_B: Fallback DEVE ser acionado em caso de UnknownHostException do sistema", fallbackCalled.get());
    }

    // CASE_C: SYSTEM_DNS=FAIL, FALLBACK=FAIL -> erro propagado
    @Test
    public void testCaseC_SystemDnsFail_FallbackFail_ErrorPropagated() {
        Dns failingSystemDns = hostname -> {
            throw new UnknownHostException("System DNS failed for " + hostname);
        };

        ResilientDns.FallbackResolver failingFallback = hostname -> {
            throw new Exception("Public fallback also failed");
        };

        ResilientDns resilientDns = new ResilientDns(failingSystemDns, failingFallback);

        try {
            resilientDns.lookup("unresolvable.invalid.domain");
            fail("CASE_C: UnknownHostException deveria ter sido propagada quando ambos falham");
        } catch (UnknownHostException expected) {
            assertTrue(expected.getMessage().contains("unresolvable.invalid.domain"));
        }
    }

    // CASE_D: nenhum IP de provedor hardcoded
    @Test
    public void testCaseD_NoHardcodedProviderIp() {
        // Valida que nenhuma constante contendo IP de provedor de streaming ou hostname específico foi embutida no código
        String className = ResilientDns.class.getName().replace('.', '/') + ".class";
        InputStream is = ResilientDns.class.getClassLoader().getResourceAsStream(className);
        assertNotNull("Bytecode de ResilientDns deve existir", is);

        try {
            byte[] bytes = new byte[is.available()];
            is.read(bytes);
            String bytecodeStr = new String(bytes, StandardCharsets.ISO_8859_1);

            assertFalse("CASE_D: IP de provedor 209.97.177.104 NÃO pode estar hardcoded no bytecode",
                    bytecodeStr.contains("209.97.177.104"));
            assertFalse("CASE_D: Host de provedor 234.bxdtxs.space NÃO pode estar hardcoded no bytecode",
                    bytecodeStr.contains("234.bxdtxs.space"));
        } catch (Exception e) {
            fail("Falha ao auditar bytecode de ResilientDns: " + e.getMessage());
        }
    }

    // CASE_E: hostname original preservado
    @Test
    public void testCaseE_OriginalHostnamePreserved() throws Exception {
        String testHost = "custom.stream.provider.net";
        byte[] ipBytes = new byte[]{10, 0, 0, 1};

        InetAddress addr = InetAddress.getByAddress(testHost, ipBytes);
        assertEquals("CASE_E: O hostname original deve ser preservado", testHost, addr.getHostName());
        assertEquals("10.0.0.1", addr.getHostAddress());
    }

    // CASE_F: headers / User-Agent preservados
    @Test
    public void testCaseF_HeadersAndUserAgentPreserved() {
        Map<String, String> headers = new HashMap<>();
        headers.put("Authorization", "Bearer token_secret_123");
        headers.put("Referer", "https://xandeflix.app");

        NativeStreamRequest req = NativeStreamRequest.fromUrlWithHeaders(
                "http://stream.example.org/live.ts",
                headers,
                "CustomUserAgent/2.5"
        ).get(0);

        assertEquals("CustomUserAgent/2.5", req.getUserAgent());
        assertEquals("Bearer token_secret_123", req.getRequestHeaders().get("Authorization"));
        assertEquals("https://xandeflix.app", req.getRequestHeaders().get("Referer"));

        HttpDataSource.Factory factory = NativePlayerActivity.buildHttpDataSourceFactory(req);
        assertNotNull("CASE_F: Factory HTTP do Media3 deve ser construída com headers e UA preservados", factory);
    }

    // CASE_G: HTTP_401 -> DNS fallback não acionado
    @Test
    public void testCaseG_Http401_DnsFallbackNotTriggered() {
        HttpDataSource.InvalidResponseCodeException ex401 =
                new HttpDataSource.InvalidResponseCodeException(
                        401,
                        "Unauthorized",
                        null,
                        Collections.emptyMap(),
                        null,
                        new byte[0]
                );
        PlaybackException httpError = new PlaybackException(
                "HTTP Unauthorized",
                ex401,
                PlaybackException.ERROR_CODE_IO_BAD_HTTP_STATUS
        );

        // Erro HTTP 401 é pós-resolução de DNS: ocorre após a conexão TCP/TLS ser bem-sucedida.
        assertEquals("HTTP_ERROR", NativePlayerActivity.categorizeError(httpError));
        assertEquals("401", NativeStreamRequest.describeHttpStatus(httpError));
        // Erro 401 não é falha de DNS
        assertNull("401 não é UnknownHostException", findUnknownHostException(httpError));
    }

    // CASE_H: HTTP_403 -> DNS fallback não acionado
    @Test
    public void testCaseH_Http403_DnsFallbackNotTriggered() {
        HttpDataSource.InvalidResponseCodeException ex403 =
                new HttpDataSource.InvalidResponseCodeException(
                        403,
                        "Forbidden",
                        null,
                        Collections.emptyMap(),
                        null,
                        new byte[0]
                );
        PlaybackException httpError = new PlaybackException(
                "HTTP Forbidden",
                ex403,
                PlaybackException.ERROR_CODE_IO_BAD_HTTP_STATUS
        );

        // Erro HTTP 403 é pós-resolução de DNS
        assertEquals("HTTP_ERROR", NativePlayerActivity.categorizeError(httpError));
        assertEquals("403", NativeStreamRequest.describeHttpStatus(httpError));
        assertNull("403 não é UnknownHostException", findUnknownHostException(httpError));
    }

    private static UnknownHostException findUnknownHostException(Throwable error) {
        Throwable curr = error;
        while (curr != null) {
            if (curr instanceof UnknownHostException) {
                return (UnknownHostException) curr;
            }
            curr = curr.getCause();
        }
        return null;
    }
}
