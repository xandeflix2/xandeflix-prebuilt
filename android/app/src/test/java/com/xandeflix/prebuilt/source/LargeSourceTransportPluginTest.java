package com.xandeflix.prebuilt.source;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import com.getcapacitor.JSObject;
import com.xandeflix.prebuilt.player.ResilientDns;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.UnknownHostException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;

import okhttp3.Dns;

/**
 * Suíte de testes unitários para LargeSourceTransportPlugin conforme Seção 11:
 * - TEST_A_SYSTEM_DNS_SUCCESS: Transport works without fallback
 * - TEST_B_SYSTEM_DNS_FAILURE_FALLBACK_SUCCESS: ResilientDns fallback used -> request continues
 * - TEST_C_BOTH_DNS_FAIL: DNS_FAILURE -> fail cleanly
 * - TEST_D_ORIGINAL_HOST_PRESERVED: No IP URL rewrite
 * - TEST_E_STREAMING_DOWNLOAD: Response consumed as stream
 * - TEST_F_HTTP_STATUS_HANDLING: Non-2xx preserved correctly
 * - TEST_G_CANCELLATION: Request closes resources
 * - TEST_H_NO_SECRET_LOGGING: Hostname masked, no credentials in logs
 */
public class LargeSourceTransportPluginTest {

    private ServerSocket serverSocket;
    private int serverPort;
    private File tempDir;
    private Thread serverThread;

    @Before
    public void setUp() throws Exception {
        tempDir = Files.createTempDirectory("large-source-transport-test").toFile();
    }

    @After
    public void tearDown() {
        stopMockServer();
        LargeSourceTransportPlugin.setSharedDnsForTesting(null);
        LargeSourceTransportPlugin.setSharedHttpClientForTesting(null);
        if (tempDir != null && tempDir.exists()) {
            File[] files = tempDir.listFiles();
            if (files != null) {
                for (File f : files) f.delete();
            }
            tempDir.delete();
        }
    }

    private void startMockServer(int statusCode, byte[] payload, Map<String, String> headersToCapture) throws Exception {
        serverSocket = new ServerSocket(0);
        serverPort = serverSocket.getLocalPort();
        serverThread = new Thread(() -> {
            try {
                while (!serverSocket.isClosed()) {
                    Socket socket = serverSocket.accept();
                    BufferedReader reader = new BufferedReader(new InputStreamReader(socket.getInputStream(), StandardCharsets.UTF_8));
                    String line;
                    while ((line = reader.readLine()) != null && !line.isEmpty()) {
                        if (headersToCapture != null && line.contains(":")) {
                            String[] parts = line.split(":", 2);
                            headersToCapture.put(parts[0].trim().toLowerCase(), parts[1].trim());
                        }
                    }
                    OutputStream os = socket.getOutputStream();
                    String statusMsg = statusCode == 200 ? "OK" : "Error";
                    String headerStr = "HTTP/1.1 " + statusCode + " " + statusMsg + "\r\n"
                            + "Content-Length: " + (payload != null ? payload.length : 0) + "\r\n"
                            + "Connection: close\r\n\r\n";
                    os.write(headerStr.getBytes(StandardCharsets.UTF_8));
                    if (payload != null && payload.length > 0) {
                        os.write(payload);
                    }
                    os.flush();
                    socket.close();
                }
            } catch (Exception ignored) {}
        });
        serverThread.setDaemon(true);
        serverThread.start();
    }

    private void stopMockServer() {
        if (serverSocket != null) {
            try {
                serverSocket.close();
            } catch (Exception ignored) {}
        }
    }

    // TEST_A: SYSTEM_DNS_SUCCESS -> transport funciona sem acionar fallback
    @Test
    public void testA_SystemDnsSuccess() throws Exception {
        AtomicBoolean fallbackCalled = new AtomicBoolean(false);
        byte[] payload = "#EXTM3U\n#EXTINF:-1,Channel 1\nhttp://example.com/live\n".getBytes(StandardCharsets.UTF_8);
        startMockServer(200, payload, null);

        Dns mockSystemDns = hostname -> Collections.singletonList(InetAddress.getByName("127.0.0.1"));
        ResilientDns.FallbackResolver mockFallback = hostname -> {
            fallbackCalled.set(true);
            return Collections.singletonList(InetAddress.getByName("127.0.0.1"));
        };

        ResilientDns resilientDns = new ResilientDns(mockSystemDns, mockFallback);
        LargeSourceTransportPlugin.setSharedDnsForTesting(resilientDns);

        String url = "http://my-source.test:" + serverPort + "/playlist.m3u";
        LargeSourceTransportPlugin.DownloadSession session = new LargeSourceTransportPlugin.DownloadSession(
                "test-a", url, Collections.emptyMap(), 5000, 5000, 1024 * 1024
        );

        LargeSourceTransportPlugin.DownloadResult result = LargeSourceTransportPlugin.executeDownload(session, tempDir, LargeSourceTransportPlugin.getSharedHttpClient());

        assertTrue("Download deve ter sucesso", result.success);
        assertEquals("DOWNLOAD_COMPLETE", result.stage);
        assertEquals("2XX", result.httpStatusClass);
        assertEquals(payload.length, result.bytesWritten);
        assertFalse("TEST_A: Fallback NÃO deve ser chamado quando System DNS funciona", fallbackCalled.get());
        session.closeAndDelete();
    }

    // TEST_B: SYSTEM_DNS_FAILURE_FALLBACK_SUCCESS -> ResilientDns fallback acionado e download continua
    @Test
    public void testB_SystemDnsFailure_FallbackSuccess() throws Exception {
        AtomicBoolean fallbackCalled = new AtomicBoolean(false);
        byte[] payload = "#EXTM3U\n#EXTINF:-1,Fallback Stream\nhttp://stream.test/live\n".getBytes(StandardCharsets.UTF_8);
        startMockServer(200, payload, null);

        Dns failingSystemDns = hostname -> {
            throw new UnknownHostException("System DNS falhou para " + hostname);
        };
        ResilientDns.FallbackResolver workingFallback = hostname -> {
            fallbackCalled.set(true);
            return Collections.singletonList(InetAddress.getByName("127.0.0.1"));
        };

        ResilientDns resilientDns = new ResilientDns(failingSystemDns, workingFallback);
        LargeSourceTransportPlugin.setSharedDnsForTesting(resilientDns);

        String url = "http://provider-space.space:" + serverPort + "/fallback.m3u";
        LargeSourceTransportPlugin.DownloadSession session = new LargeSourceTransportPlugin.DownloadSession(
                "test-b", url, Collections.emptyMap(), 5000, 5000, 1024 * 1024
        );

        LargeSourceTransportPlugin.DownloadResult result = LargeSourceTransportPlugin.executeDownload(session, tempDir, LargeSourceTransportPlugin.getSharedHttpClient());

        assertTrue("Download deve ter sucesso via fallback", result.success);
        assertTrue("TEST_B: Fallback DEVE ser chamado quando System DNS falha", fallbackCalled.get());
        assertEquals("DOWNLOAD_COMPLETE", result.stage);
        assertEquals(payload.length, result.bytesWritten);
        session.closeAndDelete();
    }

    // TEST_C: BOTH_DNS_FAIL -> DNS_FAILURE com falha limpa e retryable=true
    @Test
    public void testC_BothDnsFail() {
        Dns failingSystemDns = hostname -> {
            throw new UnknownHostException("System DNS fail");
        };
        ResilientDns.FallbackResolver failingFallback = hostname -> {
            throw new UnknownHostException("Fallback DNS fail");
        };

        ResilientDns resilientDns = new ResilientDns(failingSystemDns, failingFallback);
        LargeSourceTransportPlugin.setSharedDnsForTesting(resilientDns);

        String url = "http://unresolvable.invalid:8080/playlist.m3u";
        LargeSourceTransportPlugin.DownloadSession session = new LargeSourceTransportPlugin.DownloadSession(
                "test-c", url, Collections.emptyMap(), 5000, 5000, 1024 * 1024
        );

        LargeSourceTransportPlugin.DownloadResult result = LargeSourceTransportPlugin.executeDownload(session, tempDir, LargeSourceTransportPlugin.getSharedHttpClient());

        assertFalse("Download deve falhar", result.success);
        assertEquals("DNS_FAILURE", result.errorCode);
        assertTrue("DNS_FAILURE deve ser retryable", result.retryable);
        assertEquals(0, result.bytesWritten);
        session.closeAndDelete();
    }

    // TEST_D: ORIGINAL_HOST_PRESERVED -> Header Host recebido no servidor preserva hostname original
    @Test
    public void testD_OriginalHostPreserved() throws Exception {
        Map<String, String> receivedHeaders = new HashMap<>();
        byte[] payload = "OK".getBytes(StandardCharsets.UTF_8);
        startMockServer(200, payload, receivedHeaders);

        Dns mockDns = hostname -> Collections.singletonList(InetAddress.getByName("127.0.0.1"));
        LargeSourceTransportPlugin.setSharedDnsForTesting(mockDns);

        String customHost = "custom-provider-host.space";
        String url = "http://" + customHost + ":" + serverPort + "/hostcheck.m3u";
        LargeSourceTransportPlugin.DownloadSession session = new LargeSourceTransportPlugin.DownloadSession(
                "test-d", url, Collections.emptyMap(), 5000, 5000, 1024 * 1024
        );

        LargeSourceTransportPlugin.DownloadResult result = LargeSourceTransportPlugin.executeDownload(session, tempDir, LargeSourceTransportPlugin.getSharedHttpClient());

        assertTrue("Download deve ter sucesso", result.success);
        assertNotNull(receivedHeaders.get("host"));
        assertTrue("Host header deve conter o hostname original",
                receivedHeaders.get("host").startsWith(customHost));
        session.closeAndDelete();
    }

    // TEST_E: STREAMING_DOWNLOAD -> Resposta consumida como stream em arquivo
    @Test
    public void testE_StreamingDownload() throws Exception {
        int targetBytes = 256 * 1024; // 256 KB
        byte[] payload = new byte[targetBytes];
        for (int i = 0; i < payload.length; i++) payload[i] = (byte) (i % 128);
        startMockServer(200, payload, null);

        Dns mockDns = hostname -> Collections.singletonList(InetAddress.getByName("127.0.0.1"));
        LargeSourceTransportPlugin.setSharedDnsForTesting(mockDns);

        String url = "http://stream-source.test:" + serverPort + "/stream.m3u";
        LargeSourceTransportPlugin.DownloadSession session = new LargeSourceTransportPlugin.DownloadSession(
                "test-e", url, Collections.emptyMap(), 5000, 5000, 10 * 1024 * 1024
        );

        LargeSourceTransportPlugin.DownloadResult result = LargeSourceTransportPlugin.executeDownload(session, tempDir, LargeSourceTransportPlugin.getSharedHttpClient());

        assertTrue("Download streaming deve ter sucesso", result.success);
        assertEquals(targetBytes, result.bytesWritten);
        assertNotNull(session.getFile());
        assertEquals(targetBytes, session.getFile().length());
        session.closeAndDelete();
    }

    // TEST_F: HTTP_STATUS_HANDLING -> Códigos de erro 4xx/5xx preservados corretamente
    @Test
    public void testF_HttpStatusHandling() throws Exception {
        startMockServer(404, null, null);

        Dns mockDns = hostname -> Collections.singletonList(InetAddress.getByName("127.0.0.1"));
        LargeSourceTransportPlugin.setSharedDnsForTesting(mockDns);

        String url = "http://status-test.test:" + serverPort + "/notfound.m3u";
        LargeSourceTransportPlugin.DownloadSession session = new LargeSourceTransportPlugin.DownloadSession(
                "test-f", url, Collections.emptyMap(), 5000, 5000, 1024 * 1024
        );

        LargeSourceTransportPlugin.DownloadResult result = LargeSourceTransportPlugin.executeDownload(session, tempDir, LargeSourceTransportPlugin.getSharedHttpClient());

        assertFalse("Download 404 deve falhar", result.success);
        assertEquals("HTTP_STATUS_ERROR", result.errorCode);
        assertEquals("4XX", result.httpStatusClass);
        assertTrue("HTTP_STATUS_ERROR deve ser retryable", result.retryable);
        session.closeAndDelete();
    }

    // TEST_G: CANCELLATION -> Cancelamento fecha recursos e aborta
    @Test
    public void testG_Cancellation() {
        Dns mockDns = hostname -> Collections.singletonList(InetAddress.getByName("127.0.0.1"));
        LargeSourceTransportPlugin.setSharedDnsForTesting(mockDns);

        String url = "http://cancel-test.test:9999/slow.m3u";
        LargeSourceTransportPlugin.DownloadSession session = new LargeSourceTransportPlugin.DownloadSession(
                "test-g", url, Collections.emptyMap(), 5000, 5000, 1024 * 1024
        );

        // Pre-cancela a sessão antes do download
        session.closeAndDelete();

        LargeSourceTransportPlugin.DownloadResult result = LargeSourceTransportPlugin.executeDownload(session, tempDir, LargeSourceTransportPlugin.getSharedHttpClient());

        assertFalse(result.success);
        session.closeAndDelete();
    }

    // TEST_H: NO_SECRET_LOGGING -> Hostname mascarado em logs
    @Test
    public void testH_NoSecretLogging() {
        String sanitized = ResilientDns.sanitizeHost("secret-provider.space");
        assertEquals("secret-provider.***.space", sanitized);
        assertFalse("Não deve expor o nome original completo sem máscara", sanitized.equals("secret-provider.space"));
    }
}
