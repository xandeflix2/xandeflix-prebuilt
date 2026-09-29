package com.xandeflix.prebuilt.security;

import static org.junit.Assert.*;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.SecureRandom;
import java.util.HashMap;
import java.util.Map;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import org.junit.Before;
import org.junit.Test;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.DataInputStream;
import java.io.DataOutputStream;

/** Contrato criptográfico sintético; não instancia Android Keystore em JVM pura. */
public class LocalSecureSourceStoreContractTest {
    private static final String SOURCE_A = "src_synthetica";
    private static final String SOURCE_B = "src_syntheticb";
    private ContractStore store;

    @Before
    public void setUp() throws Exception {
        store = new ContractStore();
    }

    @Test
    public void t1PutGetRoundtrip() throws Exception {
        LocalSecureSourceRecord expected = syntheticRecord(SOURCE_A, 2, "M3U");
        store.put(expected);
        LocalSecureSourceRecord actual = store.get(SOURCE_A);
        assertNotNull(actual);
        assertEquals(expected.getSourceId(), actual.getSourceId());
        assertEquals(expected.getSourceVersion(), actual.getSourceVersion());
        assertEquals(expected.getProtocol(), actual.getProtocol());
        assertEquals(expected.getSourceConfigJson(), actual.getSourceConfigJson());
    }

    @Test
    public void t2TwoWritesUseDifferentIv() throws Exception {
        LocalSecureSourceRecord record = syntheticRecord(SOURCE_A, 1, "M3U");
        store.put(record);
        String firstIv = store.ivFor(SOURCE_A);
        store.put(record);
        assertNotEquals(firstIv, store.ivFor(SOURCE_A));
    }

    @Test
    public void t3CiphertextDoesNotContainPlaintext() throws Exception {
        store.put(syntheticRecord(SOURCE_A, 1, "XTREAM"));
        String ciphertext = new String(store.ciphertextFor(SOURCE_A), StandardCharsets.UTF_8);
        assertFalse(ciphertext.contains("synthetic-password"));
    }

    @Test
    public void t4TamperedCiphertextFailsClosed() throws Exception {
        store.put(syntheticRecord(SOURCE_A, 1, "M3U"));
        store.tamperCiphertext(SOURCE_A);
        LocalSecureSourceStoreException error = assertThrows(
                LocalSecureSourceStoreException.class, () -> store.get(SOURCE_A));
        assertEquals(LocalSecureSourceStoreException.LOCAL_SOURCE_CONFIG_UNAVAILABLE, error.getCode());
    }

    @Test
    public void t5InvalidAuthTagFailsClosed() throws Exception {
        store.put(syntheticRecord(SOURCE_A, 1, "M3U"));
        store.tamperAuthTag(SOURCE_A);
        LocalSecureSourceStoreException error = assertThrows(
                LocalSecureSourceStoreException.class, () -> store.get(SOURCE_A));
        assertEquals(LocalSecureSourceStoreException.LOCAL_SOURCE_CONFIG_UNAVAILABLE, error.getCode());
    }

    @Test
    public void t6MissingKeyFailsClosed() throws Exception {
        store.put(syntheticRecord(SOURCE_A, 1, "M3U"));
        store.keyAvailable = false;
        LocalSecureSourceStoreException error = assertThrows(
                LocalSecureSourceStoreException.class, () -> store.get(SOURCE_A));
        assertEquals(LocalSecureSourceStoreException.LOCAL_SOURCE_CONFIG_UNAVAILABLE, error.getCode());
    }

    @Test
    public void t7MissingRecordIsSafeNotFound() throws Exception {
        assertNull(store.get(SOURCE_A));
        assertFalse(store.has(SOURCE_A));
    }

    @Test
    public void t8DeleteMakesRecordUnavailable() throws Exception {
        store.put(syntheticRecord(SOURCE_A, 1, "M3U"));
        store.delete(SOURCE_A);
        assertNull(store.get(SOURCE_A));
        assertFalse(store.has(SOURCE_A));
    }

    @Test
    public void t9SourceIsolation() throws Exception {
        store.put(syntheticRecord(SOURCE_A, 1, "M3U"));
        store.put(syntheticRecord(SOURCE_B, 1, "XTREAM"));
        assertEquals(SOURCE_A, store.get(SOURCE_A).getSourceId());
        assertEquals(SOURCE_B, store.get(SOURCE_B).getSourceId());
    }

    @Test
    public void t10SourceVersionPreserved() throws Exception {
        store.put(syntheticRecord(SOURCE_A, 7, "M3U"));
        assertEquals(7, store.get(SOURCE_A).getSourceVersion());
    }

    @Test
    public void t11ProtocolPreserved() throws Exception {
        store.put(syntheticRecord(SOURCE_A, 1, "XTREAM"));
        assertEquals("XTREAM", store.get(SOURCE_A).getProtocol());
    }

    @Test
    public void t12ProductionStoreDoesNotLogPlaintext() throws Exception {
        String source = readProductionSource("LocalSecureSourceStore.java");
        assertFalse(source.contains("android.util.Log"));
        assertFalse(source.contains("System.out"));
        assertFalse(source.contains("System.err"));
    }

    @Test
    public void t13WebContractHasNoPersistentSecretFallback() throws Exception {
        String source = readProjectSource("src/security/local-secure-source-store.ts");
        assertFalse(source.contains("localStorage"));
        assertFalse(source.contains("sessionStorage"));
        assertFalse(source.contains("indexedDB"));
    }

    @Test
    public void t14TsBoundaryDoesNotExposeKeyMaterial() throws Exception {
        String source = readProjectSource("src/security/local-secure-source-store.ts");
        assertFalse(source.contains("CryptoKey"));
        assertFalse(source.contains("rawKey"));
        assertFalse(source.contains("encryptionKey"));
        assertFalse(source.toLowerCase().contains("keystore"));
    }

    @Test
    public void t15DebugReadDiagnosisIsDebugOnlyAndTransportSafe() throws Exception {
        String plugin = readProductionSource("LocalSecureSourceStorePlugin.java");
        int start = plugin.indexOf("public void secureReadDiagnosis");
        int end = plugin.indexOf("\n    @PluginMethod", start + 1);
        assertTrue(start >= 0);
        assertTrue(end > start);
        String method = plugin.substring(start, end).toLowerCase();

        assertTrue(method.contains("!buildconfig.debug"));
        for (String forbidden : new String[] {
                "endpoint", "playlist", "sourceconfig", "password", "username", "token",
                "rawenvelope", "record.tojson", "host", "url" }) {
            assertFalse("Campo sensivel no transporte de diagnostico: " + forbidden,
                    method.contains(forbidden));
        }

        String store = readProductionSource("LocalSecureSourceStore.java");
        assertTrue(store.contains("\"DECRYPT_FAILED\""));
        assertTrue(store.contains("\"ENVELOPE_RECORD_MISMATCH\""));
        assertTrue(store.contains("\"RECORD_SCHEMA_INVALID\""));
        assertFalse(store.contains("android.util.Log"));
    }

    private static LocalSecureSourceRecord syntheticRecord(String sourceId, int version, String protocol)
            throws Exception {
        return new LocalSecureSourceRecord(
                sourceId,
                version,
                protocol,
                "{\"endpoint\":\"synthetic-endpoint\",\"username\":\"synthetic-user\",\"password\":\"synthetic-password\"}");
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

    private static final class ContractStore implements SecureSourceStore {
        private static final int TAG_LENGTH_BITS = 128;
        private final SecretKey key;
        private final SecureRandom random = new SecureRandom();
        private final Map<String, byte[]> ciphertext = new HashMap<>();
        private final Map<String, byte[]> ivs = new HashMap<>();
        private boolean keyAvailable = true;

        private ContractStore() throws Exception {
            KeyGenerator generator = KeyGenerator.getInstance("AES");
            generator.init(256);
            key = generator.generateKey();
        }

        @Override
        public void put(LocalSecureSourceRecord record) throws LocalSecureSourceStoreException {
            try {
                byte[] iv = new byte[12];
                random.nextBytes(iv);
                Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
                cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(TAG_LENGTH_BITS, iv));
                byte[] encrypted = cipher.doFinal(encodeRecord(record));
                ciphertext.put(record.getSourceId(), encrypted);
                ivs.put(record.getSourceId(), iv);
            } catch (Exception error) {
                throw new LocalSecureSourceStoreException(
                        LocalSecureSourceStoreException.LOCAL_SOURCE_CONFIG_WRITE_FAILED);
            }
        }

        @Override
        public LocalSecureSourceRecord get(String sourceId) throws LocalSecureSourceStoreException {
            if (!ciphertext.containsKey(sourceId)) {
                return null;
            }
            if (!keyAvailable) {
                throw new LocalSecureSourceStoreException(
                        LocalSecureSourceStoreException.LOCAL_SOURCE_CONFIG_UNAVAILABLE);
            }
            try {
                Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
                cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(TAG_LENGTH_BITS, ivs.get(sourceId)));
                byte[] plaintext = cipher.doFinal(ciphertext.get(sourceId));
                return decodeRecord(plaintext);
            } catch (Exception error) {
                throw new LocalSecureSourceStoreException(
                        LocalSecureSourceStoreException.LOCAL_SOURCE_CONFIG_UNAVAILABLE);
            }
        }

        @Override
        public boolean has(String sourceId) {
            return ciphertext.containsKey(sourceId);
        }

        @Override
        public void delete(String sourceId) {
            ciphertext.remove(sourceId);
            ivs.remove(sourceId);
        }

        private String ivFor(String sourceId) {
            return java.util.Base64.getEncoder().encodeToString(ivs.get(sourceId));
        }

        private byte[] ciphertextFor(String sourceId) {
            return ciphertext.get(sourceId).clone();
        }

        private void tamperCiphertext(String sourceId) {
            ciphertext.get(sourceId)[0] ^= 1;
        }

        private void tamperAuthTag(String sourceId) {
            byte[] value = ciphertext.get(sourceId);
            value[value.length - 1] ^= 1;
        }

        private static byte[] encodeRecord(LocalSecureSourceRecord record) throws Exception {
            ByteArrayOutputStream bytes = new ByteArrayOutputStream();
            DataOutputStream output = new DataOutputStream(bytes);
            output.writeUTF(record.getSourceId());
            output.writeInt(record.getSourceVersion());
            output.writeUTF(record.getProtocol());
            output.writeUTF(record.getSourceConfigJson());
            output.flush();
            return bytes.toByteArray();
        }

        private static LocalSecureSourceRecord decodeRecord(byte[] encoded) throws Exception {
            DataInputStream input = new DataInputStream(new ByteArrayInputStream(encoded));
            return new LocalSecureSourceRecord(
                    input.readUTF(),
                    input.readInt(),
                    input.readUTF(),
                    input.readUTF());
        }
    }
}
