package com.xandeflix.prebuilt.update;

import java.net.URI;

/** Software updates are independent of device identity, activation and media. */
public final class UpdatePolicy {
    public static final long DAY = 24L * 60 * 60 * 1000;
    public static final long MAX_BYTES = 256L * 1024 * 1024;
    private UpdatePolicy() {}
    public static boolean due(long lastCheck, long now) {
        return lastCheck <= 0 || now < lastCheck || now - lastCheck >= DAY;
    }
    public static boolean candidate(long installed, long published, long archive,
                                    String installedPackage, String archivePackage,
                                    boolean sameSigner) {
        return published > installed && archive == published && published <= 999999999L
            && "com.xandeflix.prebuilt".equals(installedPackage)
            && installedPackage.equals(archivePackage) && sameSigner;
    }
    public static boolean https(String value) {
        try {
            URI uri = new URI(value);
            return "https".equals(uri.getScheme()) && uri.getHost() != null
                && uri.getUserInfo() == null && uri.getFragment() == null
                && (uri.getPort() == -1 || uri.getPort() == 443) && value.length() <= 2048;
        } catch (Exception ignored) { return false; }
    }
}
