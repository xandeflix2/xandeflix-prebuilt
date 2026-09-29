package com.xandeflix.prebuilt.security;

import static org.junit.Assert.*;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import org.junit.Test;

public class SecureSourceConfigHostDiagnosticTest {
    @Test
    public void returnsOnlySafeDeterministicHostMetadata() throws Exception {
        LocalSecureSourceRecord record = new LocalSecureSourceRecord(
                "src_synthetica", 7, "M3U",
                "{\"playlistUrl\":\"https://diagnostic.example.invalid:8443/private/path?token=not-real\"}");
        SecureSourceConfigHostDiagnostic.Summary first = SecureSourceConfigHostDiagnostic.inspect(record,
                hostname -> new InetAddress[] { InetAddress.getByAddress(new byte[] {1, 2, 3, 4}) });
        SecureSourceConfigHostDiagnostic.Summary second = SecureSourceConfigHostDiagnostic.inspect(record,
                hostname -> new InetAddress[] { InetAddress.getByAddress(new byte[] {1, 2, 3, 4}) });

        assertEquals(first.hostFingerprint, second.hostFingerprint);
        assertEquals(12, first.hostFingerprint.length());
        assertEquals("https", first.scheme);
        assertEquals("explicit", first.portClass);
        assertEquals("PASS", first.dnsResult);
        assertEquals(1, first.aCount);
    }

    @Test
    public void distinctHostsHaveDistinctFingerprintsAndDnsFailureIsSanitized() throws Exception {
        LocalSecureSourceRecord first = new LocalSecureSourceRecord(
                "src_synthetica", 1, "XTREAM",
                "{\"endpoint\":\"http://one.example.invalid\"}");
        LocalSecureSourceRecord second = new LocalSecureSourceRecord(
                "src_syntheticb", 1, "XTREAM",
                "{\"endpoint\":\"http://two.example.invalid\"}");
        SecureSourceConfigHostDiagnostic.DnsResolver failing = hostname -> {
            throw new UnknownHostException();
        };
        SecureSourceConfigHostDiagnostic.Summary firstResult = SecureSourceConfigHostDiagnostic.inspect(first, failing);
        SecureSourceConfigHostDiagnostic.Summary secondResult = SecureSourceConfigHostDiagnostic.inspect(second, failing);

        assertNotEquals(firstResult.hostFingerprint, secondResult.hostFingerprint);
        assertEquals("FAIL", firstResult.dnsResult);
        assertEquals("UnknownHostException", firstResult.dnsException);
    }

    @Test
    public void pluginGuardsTheDiagnosticFromReleaseBuildsAndNeverLogs() throws Exception {
        String source = readPluginSource();
        assertTrue(source.contains("!BuildConfig.DEBUG"));
        assertFalse(source.contains("android.util.Log"));
        assertFalse(source.contains("System.out"));
        assertFalse(source.contains("System.err"));
    }

    private static String readPluginSource() throws Exception {
        Path[] candidates = new Path[] {
                Paths.get("src/main/java/com/xandeflix/prebuilt/security/LocalSecureSourceStorePlugin.java"),
                Paths.get("app/src/main/java/com/xandeflix/prebuilt/security/LocalSecureSourceStorePlugin.java"),
                Paths.get("../android/app/src/main/java/com/xandeflix/prebuilt/security/LocalSecureSourceStorePlugin.java")
        };
        for (Path candidate : candidates) {
            if (Files.exists(candidate)) {
                return new String(Files.readAllBytes(candidate), StandardCharsets.UTF_8);
            }
        }
        throw new AssertionError("Fonte do plugin nÃƒÂ£o encontrada");
    }
}

