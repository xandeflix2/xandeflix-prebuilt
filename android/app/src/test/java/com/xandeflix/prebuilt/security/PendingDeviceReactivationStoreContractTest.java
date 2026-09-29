package com.xandeflix.prebuilt.security;

import static org.junit.Assert.assertTrue;
import static org.junit.Assert.assertFalse;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import org.junit.Test;

/** Auditoria JVM do boundary seguro; não materializa token real nem usa o device. */
public class PendingDeviceReactivationStoreContractTest {
    @Test
    public void t1ProductionStoreUsesAndroidKeystoreAndAesGcm() throws Exception {
        String source = readProductionSource("PendingDeviceReactivationStore.java");
        assertTrue(source.contains("AndroidKeyStore"));
        assertTrue(source.contains("AES/GCM/NoPadding"));
        assertTrue(source.contains("cipher.getIV()"));
    }

    @Test
    public void t2ProductionStoreDoesNotUseBrowserPersistenceOrLogs() throws Exception {
        String store = readProductionSource("PendingDeviceReactivationStore.java");
        String plugin = readProductionSource("PendingDeviceReactivationStorePlugin.java");
        String combined = store + "\n" + plugin;
        assertFalse(combined.contains("localStorage"));
        assertFalse(combined.contains("sessionStorage"));
        assertFalse(combined.contains("System.out"));
        assertFalse(combined.contains("System.err"));
        assertFalse(combined.contains("android.util.Log"));
    }

    @Test
    public void t3PluginExposesOnlySaveLoadClearBoundary() throws Exception {
        String source = readProductionSource("PendingDeviceReactivationStorePlugin.java");
        assertTrue(source.contains("secureSavePendingReactivation"));
        assertTrue(source.contains("secureLoadPendingReactivation"));
        assertTrue(source.contains("secureClearPendingReactivation"));
        assertTrue(source.contains("@CapacitorPlugin(name = \"PendingDeviceReactivationStore\")"));
    }

    @Test
    public void t4MalformedAndExpiredRecordsAreValidatedAtTsBoundary() throws Exception {
        String source = readProjectSource("src/device/pending-device-reactivation.store.ts");
        assertTrue(source.contains("PENDING_REACTIVATION_INVALID"));
        assertTrue(source.contains("Date.parse(result.handle.expiresAtIso) <= Date.now()"));
        assertTrue(source.contains("loadForDevice"));
    }

    private static String readProductionSource(String fileName) throws Exception {
        Path[] candidates = new Path[] {
                Paths.get("src/main/java/com/xandeflix/prebuilt/security", fileName),
                Paths.get("app/src/main/java/com/xandeflix/prebuilt/security", fileName),
                Paths.get("../android/app/src/main/java/com/xandeflix/prebuilt/security", fileName)
        };
        for (Path candidate : candidates) {
            if (Files.exists(candidate)) {
                return new String(Files.readAllBytes(candidate), StandardCharsets.UTF_8);
            }
        }
        throw new AssertionError("Fonte de produção não encontrada");
    }

    private static String readProjectSource(String relativePath) throws Exception {
        Path[] candidates = new Path[] {
                Paths.get(relativePath),
                Paths.get("../" + relativePath),
                Paths.get("../../" + relativePath),
                Paths.get("../../../" + relativePath)
        };
        for (Path candidate : candidates) {
            if (Files.exists(candidate)) {
                return new String(Files.readAllBytes(candidate), StandardCharsets.UTF_8);
            }
        }
        throw new AssertionError("Fonte do projeto não encontrada");
    }
}
