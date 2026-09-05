package com.xandeflix.prebuilt.player;

import static org.junit.Assert.*;

import org.junit.Test;
import java.io.File;
import java.nio.file.Files;

/**
 * Teste unitário para auditoria de segurança das permissões e configurações do AndroidManifest.xml.
 */
public class AndroidManifestAuditTest {

    @Test
    public void testNativePlayerActivityNotExported() throws Exception {
        File manifestFile = new File("src/main/AndroidManifest.xml");
        if (!manifestFile.exists()) {
            manifestFile = new File("android/app/src/main/AndroidManifest.xml");
        }
        assertTrue("AndroidManifest.xml deve existir", manifestFile.exists());

        String manifestContent = new String(Files.readAllBytes(manifestFile.toPath()));

        // 1. Confirma declaração da NativePlayerActivity
        assertTrue("Manifest deve conter declaração da NativePlayerActivity",
                manifestContent.contains(".player.NativePlayerActivity")
                || manifestContent.contains("com.xandeflix.prebuilt.player.NativePlayerActivity"));

        // 2. Confirma android:exported="false"
        assertTrue("NativePlayerActivity deve ter android:exported=\"false\"",
                manifestContent.contains("android:name=\".player.NativePlayerActivity\"")
                && manifestContent.contains("android:exported=\"false\""));

        // 3. Confirma que usesCleartextTraffic="true" NÃO está configurado globalmente
        assertFalse("usesCleartextTraffic=\"true\" é proibido no baseline do Gate G8",
                manifestContent.contains("android:usesCleartextTraffic=\"true\""));
    }
}
