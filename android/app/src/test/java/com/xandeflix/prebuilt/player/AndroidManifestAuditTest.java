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

        // 3. O transporte device-direct exige cleartext explícito e configuração de rede base.
        assertTrue("usesCleartextTraffic=\"true\" deve estar alinhado ao transporte original",
                manifestContent.contains("android:usesCleartextTraffic=\"true\""));
        assertTrue("Manifest deve apontar para network_security_config",
                manifestContent.contains("android:networkSecurityConfig=\"@xml/network_security_config\""));

        File networkSecurityFile = new File("src/main/res/xml/network_security_config.xml");
        if (!networkSecurityFile.exists()) {
            networkSecurityFile = new File("android/app/src/main/res/xml/network_security_config.xml");
        }
        assertTrue("network_security_config.xml deve existir", networkSecurityFile.exists());
        String networkSecurityContent = new String(Files.readAllBytes(networkSecurityFile.toPath()));
        assertTrue("cleartextTrafficPermitted=\"true\" deve estar permitido na base",
                networkSecurityContent.contains("cleartextTrafficPermitted=\"true\""));
    }
}
