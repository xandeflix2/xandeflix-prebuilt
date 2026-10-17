package com.xandeflix.prebuilt.security;

import java.nio.charset.StandardCharsets;
import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

/** Independent encrypted envelope, never shared with source/device identity. */
public final class ParentalCipher {
    private ParentalCipher() {}
    public static byte[][] encrypt(SecretKey key, String value) throws Exception {
        if (value == null || value.length() > 65536) throw new IllegalArgumentException();
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.ENCRYPT_MODE, key);
        cipher.updateAAD("xandeflix.parental.v1".getBytes(StandardCharsets.UTF_8));
        return new byte[][] {cipher.getIV(), cipher.doFinal(value.getBytes(StandardCharsets.UTF_8))};
    }
    public static String decrypt(SecretKey key, byte[] iv, byte[] value) throws Exception {
        if (iv == null || iv.length != 12 || value == null || value.length > 131072) throw new IllegalArgumentException();
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(128, iv));
        cipher.updateAAD("xandeflix.parental.v1".getBytes(StandardCharsets.UTF_8));
        String result = new String(cipher.doFinal(value), StandardCharsets.UTF_8);
        if (result.length() > 65536) throw new IllegalArgumentException();
        return result;
    }
}
