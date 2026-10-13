package com.xandeflix.prebuilt.update;

import java.io.*;
import java.security.MessageDigest;
import java.util.List;

/** Bounded streaming, isolated partial file, validation before publication. */
public final class MirrorDownload {
    public interface Response extends AutoCloseable {
        InputStream body() throws Exception;
        long length();
        @Override void close() throws Exception;
    }
    public interface Transport { Response open(String url) throws Exception; }
    public interface ArchiveValidator { boolean valid(File file) throws Exception; }
    private MirrorDownload() {}
    public static String hash(File file) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        try (InputStream in = new FileInputStream(file)) {
            byte[] buffer = new byte[64 * 1024]; int count;
            while ((count = in.read(buffer)) != -1) digest.update(buffer, 0, count);
        }
        StringBuilder result = new StringBuilder();
        for (byte value : digest.digest()) result.append(String.format(java.util.Locale.ROOT, "%02x", value & 255));
        return result.toString();
    }
    public static boolean download(List<String> urls, long bytes, String hash, File partial,
                                   Transport transport, ArchiveValidator validator) {
        if (bytes < 1 || bytes > UpdatePolicy.MAX_BYTES || !hash.matches("[a-f0-9]{64}")
            || urls.isEmpty() || urls.size() > 5) return false;
        for (String url : urls) {
            if (Thread.currentThread().isInterrupted()) break;
            boolean success = false;
            try {
                if (!UpdatePolicy.https(url)) continue;
                long deadline = System.nanoTime() + 120_000_000_000L;
                try (Response response = transport.open(url)) {
                    if (response.length() > 0 && response.length() != bytes) throw new IOException();
                    try (InputStream in = response.body(); FileOutputStream out = new FileOutputStream(partial)) {
                        byte[] buffer = new byte[64 * 1024]; long total = 0; int count;
                        while ((count = in.read(buffer)) != -1) {
                            if (Thread.currentThread().isInterrupted() || System.nanoTime() > deadline) throw new IOException();
                            total += count; if (total > bytes) throw new IOException();
                            out.write(buffer, 0, count);
                        }
                        if (total != bytes) throw new IOException();
                        out.getFD().sync();
                    }
                }
                if (!hash.equals(hash(partial)) || !validator.valid(partial)) throw new IOException();
                success = true; return true;
            } catch (Exception ignored) {
                // URLs and provider errors are never logged: try the next mirror.
            } finally { if (!success) partial.delete(); }
        }
        return false;
    }
}
