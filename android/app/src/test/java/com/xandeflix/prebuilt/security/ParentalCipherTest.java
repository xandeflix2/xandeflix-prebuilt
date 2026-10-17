package com.xandeflix.prebuilt.security;
import org.junit.Test;
import static org.junit.Assert.*;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
public class ParentalCipherTest {
    @Test public void independentRandomIvAuthenticatedEnvelopeAndTamperRejection() throws Exception {
        KeyGenerator generator = KeyGenerator.getInstance("AES"); generator.init(256);
        SecretKey key = generator.generateKey(); String value = "{\"version\":1,\"verifier\":\"synthetic\"}";
        byte[][] a = ParentalCipher.encrypt(key, value), b = ParentalCipher.encrypt(key, value);
        assertEquals(12, a[0].length); assertFalse(java.util.Arrays.equals(a[0], b[0]));
        assertEquals(value, ParentalCipher.decrypt(key, a[0], a[1]));
        a[1][0] ^= 1; try { ParentalCipher.decrypt(key, a[0], a[1]); fail(); } catch (Exception expected) { }
        try { ParentalCipher.decrypt(generator.generateKey(), b[0], b[1]); fail(); } catch (Exception expected) { }
    }
    @Test public void oversizedRecordRejected() throws Exception {
        KeyGenerator generator = KeyGenerator.getInstance("AES"); generator.init(256);
        try { ParentalCipher.encrypt(generator.generateKey(), new String(new char[65537])); fail(); } catch (IllegalArgumentException expected) { }
    }
}
