package com.xandeflix.prebuilt.update;

import org.junit.Test;
import java.io.*;
import java.nio.file.Files;
import java.util.*;
import static org.junit.Assert.*;

public class AppUpdateTest {
    private static final String PKG = "com.xandeflix.prebuilt";
    private MirrorDownload.Response response(byte[] bytes, long declared) {
        return new MirrorDownload.Response() {
            public InputStream body() { return new ByteArrayInputStream(bytes); }
            public long length() { return declared; }
            public void close() {}
        };
    }
    @Test public void checksDailyAndClockRollback() {
        assertTrue(UpdatePolicy.due(0, 100)); assertFalse(UpdatePolicy.due(100, 101));
        assertFalse(UpdatePolicy.due(100, 100 + UpdatePolicy.DAY - 1));
        assertTrue(UpdatePolicy.due(100, 100 + UpdatePolicy.DAY)); assertTrue(UpdatePolicy.due(100, 99));
    }
    @Test public void requiresSamePackageSignerAndNewPublishedVersion() {
        assertTrue(UpdatePolicy.candidate(14, 15, 15, PKG, PKG, true));
        assertFalse(UpdatePolicy.candidate(14, 14, 14, PKG, PKG, true));
        assertFalse(UpdatePolicy.candidate(14, 15, 16, PKG, PKG, true));
        assertFalse(UpdatePolicy.candidate(14, 15, 15, PKG, "other.app", true));
        assertFalse(UpdatePolicy.candidate(14, 15, 15, PKG, PKG, false));
    }
    @Test public void rejectsInsecureOrCredentialedRedirectTargets() {
        assertTrue(UpdatePolicy.https("https://example.invalid/file.apk?a=1"));
        for (String url : new String[]{"http://example.invalid", "file:///file.apk", "https://user:secret@example.invalid/file", "https://example.invalid:8443/file", "https://example.invalid/file#fragment", "not a link"}) assertFalse(UpdatePolicy.https(url));
    }
    @Test public void providerFailureThenWrongHashThenGoodMirrorInOrder() throws Exception {
        File directory = Files.createTempDirectory("update-test").toFile(); File partial = new File(directory,"partial.apk");
        byte[] bytes = "signed archive fixture".getBytes("UTF-8"); Files.write(partial.toPath(), bytes);
        String hash = MirrorDownload.hash(partial); partial.delete(); List<String> attempts = new ArrayList<>();
        List<String> urls = Arrays.asList("https://first.invalid/apk","https://second.invalid/apk","https://third.invalid/apk");
        assertTrue(MirrorDownload.download(urls,bytes.length,hash,partial,url -> {
            attempts.add(url); if (url.contains("first")) throw new IOException("Quota fixture");
            return response(url.contains("second") ? new byte[bytes.length] : bytes, bytes.length);
        }, file -> Arrays.equals(bytes, Files.readAllBytes(file.toPath()))));
        assertEquals(urls, attempts); assertArrayEquals(bytes,Files.readAllBytes(partial.toPath())); partial.delete(); directory.delete();
    }
    @Test public void rejectsIncompleteOversizedAndInvalidArchiveWithoutRetainingPartial() throws Exception {
        File directory = Files.createTempDirectory("update-test").toFile(), partial = new File(directory,"partial.apk");
        byte[] bytes = new byte[]{1,2,3}; Files.write(partial.toPath(),bytes); String hash=MirrorDownload.hash(partial); partial.delete();
        List<String> urls=Collections.singletonList("https://mirror.invalid/file");
        for(byte[] invalid:new byte[][]{new byte[]{1,2},new byte[]{1,2,3,4}}) {
            assertFalse(MirrorDownload.download(urls,3,hash,partial,url -> response(invalid,-1),file -> true)); assertFalse(partial.exists());
        }
        assertFalse(MirrorDownload.download(urls,3,hash,partial,url -> response(bytes,4),file -> true));
        assertFalse(MirrorDownload.download(urls,3,hash,partial,url -> response(bytes,3),file -> false));
        assertFalse(partial.exists()); directory.delete();
    }
    @Test public void interruptedJobLeavesNoCandidate() throws Exception {
        File directory=Files.createTempDirectory("update-test").toFile(),partial=new File(directory,"partial.apk");
        Thread.currentThread().interrupt();
        try { assertFalse(MirrorDownload.download(Collections.singletonList("https://mirror.invalid/file"),3,String.join("",Collections.nCopies(64,"a")),partial,url -> {throw new AssertionError();},file -> true)); }
        finally { Thread.interrupted(); }
        assertFalse(partial.exists()); directory.delete();
    }
}
