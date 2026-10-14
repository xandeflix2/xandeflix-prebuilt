package com.xandeflix.prebuilt.source;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import com.xandeflix.prebuilt.player.ResilientDns;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;

import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
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
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;

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

    private void startProgressiveMockServer(byte[] payload, int firstPartBytes,
                                            CountDownLatch firstPartSent,
                                            CountDownLatch allowFinish) throws Exception {
        startProgressiveMockServer(payload, firstPartBytes, firstPartSent, allowFinish, true);
    }

    private void startProgressiveMockServer(byte[] payload, int firstPartBytes,
                                            CountDownLatch firstPartSent,
                                            CountDownLatch allowFinish, boolean sendRest) throws Exception {
        serverSocket = new ServerSocket(0);
        serverPort = serverSocket.getLocalPort();
        serverThread = new Thread(() -> {
            try (Socket socket = serverSocket.accept()) {
                BufferedReader reader = new BufferedReader(new InputStreamReader(socket.getInputStream(), StandardCharsets.UTF_8));
                String line;
                while ((line = reader.readLine()) != null && !line.isEmpty()) {}
                OutputStream os = socket.getOutputStream();
                String headers = "HTTP/1.1 200 OK\r\n"
                        + "Content-Length: " + payload.length + "\r\n"
                        + "Connection: close\r\n\r\n";
                os.write(headers.getBytes(StandardCharsets.UTF_8));
                os.write(payload, 0, firstPartBytes);
                os.flush();
                firstPartSent.countDown();
                if (allowFinish.await(5, TimeUnit.SECONDS) && sendRest) {
                    os.write(payload, firstPartBytes, payload.length - firstPartBytes);
                    os.flush();
                }
            } catch (Exception ignored) {}
        });
        serverThread.setDaemon(true);
        serverThread.start();
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
        byte[] digest = java.security.MessageDigest.getInstance("SHA-256").digest(payload);
        StringBuilder expectedDigest = new StringBuilder(64);
        for (byte value : digest) expectedDigest.append(String.format(java.util.Locale.ROOT, "%02x", value & 255));
        assertEquals("C60: digest is the exact streamed source bytes", expectedDigest.toString(), result.sourceContentDigest);
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

    @Test
    public void testI_ProgressiveReadStartsBeforeResponseEofAndPreservesOrder() throws Exception {
        byte[] payload = ("Ação São Paulo 🐉東京\r\n").repeat(40000).getBytes(StandardCharsets.UTF_8);
        CountDownLatch firstPartSent = new CountDownLatch(1);
        CountDownLatch allowFinish = new CountDownLatch(1);
        startProgressiveMockServer(payload, 384 * 1024, firstPartSent, allowFinish);

        Dns mockDns = hostname -> Collections.singletonList(InetAddress.getByName("127.0.0.1"));
        LargeSourceTransportPlugin.setSharedDnsForTesting(mockDns);
        LargeSourceTransportPlugin.DownloadSession session = new LargeSourceTransportPlugin.DownloadSession(
                "test-i", "http://progressive-source.test:" + serverPort + "/playlist.m3u",
                Collections.emptyMap(), 5000, 5000, 2 * 1024 * 1024
        );
        CountDownLatch ready = new CountDownLatch(1);
        AtomicReference<LargeSourceTransportPlugin.DownloadResult> terminal = new AtomicReference<>();
        Thread downloadThread = new Thread(() -> {
            LargeSourceTransportPlugin.DownloadResult result = LargeSourceTransportPlugin.executeDownload(
                    session, tempDir, LargeSourceTransportPlugin.getSharedHttpClient(), readyResult -> ready.countDown());
            terminal.set(result);
        });
        downloadThread.start();

        try {
            assertTrue("Transport must release the consumer before EOF", ready.await(2, TimeUnit.SECONDS));
            assertTrue("The first part must reach the client", firstPartSent.await(2, TimeUnit.SECONDS));
            long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(2);
            while (session.getBytesWritten() < 256 * 1024 && System.nanoTime() < deadline) Thread.sleep(10);
            assertTrue("Call must remain active while the consumer reads", session.hasActiveCall());
            assertFalse("Response must still be open", session.isFinished());

            LargeSourceTransportPlugin.ChunkReadResult first = LargeSourceTransportPlugin.readChunkState(session, 128 * 1024);
            assertFalse("Available data cannot be reported as pending", first.pending);
            assertTrue("First chunk must contain bytes", first.bytesRead > 0);

            ByteArrayOutputStream received = new ByteArrayOutputStream(payload.length);
            received.write(java.util.Base64.getDecoder().decode(first.dataBase64));
            boolean pendingObserved = false;
            for (int attempts = 0; attempts < 30; attempts++) {
                LargeSourceTransportPlugin.ChunkReadResult chunk = LargeSourceTransportPlugin.readChunkState(session, 127 * 1024 + 1);
                assertFalse("Temporary EOF cannot complete the stream", chunk.done);
                assertTrue("An open response cannot fail this fixture", chunk.errorCode == null);
                if (chunk.pending) { pendingObserved = true; break; }
                received.write(java.util.Base64.getDecoder().decode(chunk.dataBase64));
            }
            assertTrue("Temporary EOF must be explicit pending", pendingObserved);
            allowFinish.countDown();
            downloadThread.join(5000);
            assertFalse("Synthetic download must finish", downloadThread.isAlive());
            assertTrue("Complete download must succeed", terminal.get() != null && terminal.get().success);

            boolean done = false;
            for (int attempts = 0; attempts < 100 && !done; attempts++) {
                LargeSourceTransportPlugin.ChunkReadResult chunk = LargeSourceTransportPlugin.readChunkState(session, 128 * 1024);
                assertTrue("Progressive read cannot hide an error", chunk.errorCode == null);
                if (chunk.pending) {
                    Thread.sleep(10);
                    continue;
                }
                done = chunk.done;
                if (!done) received.write(java.util.Base64.getDecoder().decode(chunk.dataBase64));
            }
            assertTrue("Real EOF must finish the consumer", done);
            assertEquals("All bytes must be delivered once", payload.length, received.size());
            assertTrue("Content order must be preserved", java.util.Arrays.equals(payload, received.toByteArray()));
        } finally {
            allowFinish.countDown();
            session.closeAndDelete();
        }
    }

    @Test
    public void testK_TruncatedBodyFailsAfterProgressiveStartAndDeletesOnlyItsFile() throws Exception {
        byte[] payload = new byte[512 * 1024];
        CountDownLatch firstPartSent = new CountDownLatch(1), allowFinish = new CountDownLatch(1);
        startProgressiveMockServer(payload, 256 * 1024, firstPartSent, allowFinish, false);
        File preserved = new File(tempDir, "unrelated-active-fixture");
        Files.write(preserved.toPath(), new byte[]{1, 2, 3});
        LargeSourceTransportPlugin.DownloadSession session = new LargeSourceTransportPlugin.DownloadSession(
                "test-k", "http://127.0.0.1:" + serverPort + "/playlist.m3u",
                Collections.emptyMap(), 5000, 5000, 2 * 1024 * 1024);
        AtomicReference<LargeSourceTransportPlugin.DownloadResult> terminal = new AtomicReference<>();
        Thread worker = new Thread(() -> terminal.set(LargeSourceTransportPlugin.executeDownload(
                session, tempDir, LargeSourceTransportPlugin.getSharedHttpClient(), ready -> {})));
        worker.start();
        assertTrue(firstPartSent.await(2, TimeUnit.SECONDS));
        allowFinish.countDown();
        worker.join(5000);
        assertFalse(worker.isAlive());
        assertNotNull(terminal.get());
        assertFalse("Truncation cannot become success", terminal.get().success);
        LargeSourceTransportPlugin.ChunkReadResult failed = LargeSourceTransportPlugin.readChunkState(session, 1024);
        assertFalse("Late transport error cannot be EOF", failed.done);
        assertNotNull(failed.errorCode);
        assertTrue("Unrelated active fixture must remain", preserved.exists());
        assertTrue("Failed temp must be removed", session.getFile() == null);
    }

    @Test
    public void testL_ImmediateCleanupFromReadyDoesNotRecreateTempFile() throws Exception {
        byte[] payload = new byte[512 * 1024];
        CountDownLatch firstPartSent = new CountDownLatch(1), allowFinish = new CountDownLatch(1);
        startProgressiveMockServer(payload, 256 * 1024, firstPartSent, allowFinish);
        LargeSourceTransportPlugin.DownloadSession session = new LargeSourceTransportPlugin.DownloadSession(
                "test-l", "http://127.0.0.1:" + serverPort + "/playlist.m3u",
                Collections.emptyMap(), 5000, 5000, 2 * 1024 * 1024);
        try {
            LargeSourceTransportPlugin.DownloadResult result = LargeSourceTransportPlugin.executeDownload(
                    session, tempDir, LargeSourceTransportPlugin.getSharedHttpClient(), ready -> session.closeAndDelete());
            assertFalse(result.success);
            assertEquals("ABORTED", result.errorCode);
            assertEquals("Cleanup must not leave an orphan", 0, tempDir.listFiles().length);
        } finally { allowFinish.countDown(); session.closeAndDelete(); }
    }

    @Test
    public void testM_TotalCallDeadlineFailsWithoutPromotingPartialBody() throws Exception {
        byte[] payload = new byte[512 * 1024];
        CountDownLatch firstPartSent = new CountDownLatch(1), allowFinish = new CountDownLatch(1);
        startProgressiveMockServer(payload, 256 * 1024, firstPartSent, allowFinish);
        LargeSourceTransportPlugin.DownloadSession session = new LargeSourceTransportPlugin.DownloadSession(
                "test-m", "http://127.0.0.1:" + serverPort + "/playlist.m3u",
                Collections.emptyMap(), 5000, 5000, 2 * 1024 * 1024);
        okhttp3.OkHttpClient client = LargeSourceTransportPlugin.getSharedHttpClient().newBuilder()
                .callTimeout(500, TimeUnit.MILLISECONDS).build();
        try {
            LargeSourceTransportPlugin.DownloadResult result = LargeSourceTransportPlugin.executeDownload(
                    session, tempDir, client, ready -> {});
            assertFalse(result.success);
            assertEquals("READ_TIMEOUT", result.errorCode);
            assertTrue(result.retryable);
            assertEquals("READ_TIMEOUT", LargeSourceTransportPlugin.readChunkState(session, 1024).errorCode);
            assertTrue("Deadline must delete partial temp", session.getFile() == null);
        } finally { allowFinish.countDown(); session.closeAndDelete(); }
    }

    @Test
    public void testJ_ProgressiveCancellationKeepsCallReachableUntilBodyEnds() throws Exception {
        byte[] payload = new byte[512 * 1024];
        CountDownLatch firstPartSent = new CountDownLatch(1);
        CountDownLatch allowFinish = new CountDownLatch(1);
        startProgressiveMockServer(payload, 256 * 1024, firstPartSent, allowFinish);

        Dns mockDns = hostname -> Collections.singletonList(InetAddress.getByName("127.0.0.1"));
        LargeSourceTransportPlugin.setSharedDnsForTesting(mockDns);
        LargeSourceTransportPlugin.DownloadSession session = new LargeSourceTransportPlugin.DownloadSession(
                "test-j", "http://cancel-progressive.test:" + serverPort + "/playlist.m3u",
                Collections.emptyMap(), 5000, 5000, 2 * 1024 * 1024
        );
        CountDownLatch ready = new CountDownLatch(1);
        AtomicReference<LargeSourceTransportPlugin.DownloadResult> terminal = new AtomicReference<>();
        Thread downloadThread = new Thread(() -> {
            LargeSourceTransportPlugin.DownloadResult result = LargeSourceTransportPlugin.executeDownload(
                    session, tempDir, LargeSourceTransportPlugin.getSharedHttpClient(), readyResult -> ready.countDown());
            terminal.set(result);
        });
        downloadThread.start();

        try {
            assertTrue(ready.await(2, TimeUnit.SECONDS));
            assertTrue(firstPartSent.await(2, TimeUnit.SECONDS));
            assertTrue("Call must remain cancellable while body is open", session.hasActiveCall());
            session.closeAndDelete();
            downloadThread.join(5000);
            assertFalse("Cancellation must unblock native read", downloadThread.isAlive());
            assertNotNull(terminal.get());
            assertFalse("Late cancellation cannot become success", terminal.get().success);
            assertEquals("ABORTED", terminal.get().errorCode);
        } finally {
            allowFinish.countDown();
            session.closeAndDelete();
        }
    }

    // TEST_H: NO_SECRET_LOGGING -> Hostname mascarado em logs
    @Test
    public void testH_NoSecretLogging() {
        String sanitized = ResilientDns.sanitizeHost("secret-provider.space");
        assertEquals("secret-provider.***.space", sanitized);
        assertFalse("Não deve expor o nome original completo sem máscara", sanitized.equals("secret-provider.space"));
    }
}
