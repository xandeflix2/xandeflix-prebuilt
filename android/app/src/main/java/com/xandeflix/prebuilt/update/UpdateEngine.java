package com.xandeflix.prebuilt.update;

import android.app.job.JobInfo;
import android.app.job.JobScheduler;
import android.content.ComponentName;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.os.Build;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.*;
import java.net.*;
import javax.net.ssl.HttpsURLConnection;
import java.util.*;
import java.util.concurrent.atomic.AtomicBoolean;

public final class UpdateEngine {
    private static final int JOB_ID = 9013;
    private static final AtomicBoolean RUNNING = new AtomicBoolean(false);
    private final Context context;
    private final SharedPreferences preferences;
    private final File directory, ready;
    public UpdateEngine(Context context) {
        this.context = context.getApplicationContext();
        preferences = this.context.getSharedPreferences("app_updates", Context.MODE_PRIVATE);
        directory = new File(this.context.getFilesDir(), "app-updates");
        ready = new File(directory, "ready.apk");
    }
    public void configure(String url, String key) throws Exception {
        if (url == null || !UpdatePolicy.https(url) || key == null || key.isEmpty() || key.length() > 4096
            || key.startsWith("sb_secret_") || key.contains("\n") || key.contains("\r")) throw new IOException();
        URI uri = new URI(url);
        if (!"cujbmyhitgomlgwfkaat.supabase.co".equals(uri.getHost())
            || !(uri.getPath().isEmpty() || "/".equals(uri.getPath()))) throw new IOException();
        // Only public runtime keys. Reject legacy service-role JWTs as well.
        if (key.split("\\.").length == 3) {
            String payload = new String(android.util.Base64.decode(key.split("\\.")[1], android.util.Base64.URL_SAFE), java.nio.charset.StandardCharsets.UTF_8);
            if (!"anon".equals(new JSONObject(payload).optString("role"))) throw new IOException();
        } else if (!key.startsWith("sb_publishable_")) throw new IOException();
        if (!preferences.edit().putString("url", url.replaceAll("/+$", "")).putString("key", key).commit()) throw new IOException();
        JobScheduler scheduler = (JobScheduler)context.getSystemService(Context.JOB_SCHEDULER_SERVICE);
        boolean scheduled = false;
        if (scheduler != null) for (JobInfo job : scheduler.getAllPendingJobs()) if (job.getId() == JOB_ID) scheduled = true;
        if (scheduler != null && !scheduled) scheduler.schedule(new JobInfo.Builder(JOB_ID,
            new ComponentName(context, UpdateJobService.class)).setRequiredNetworkType(JobInfo.NETWORK_TYPE_ANY)
            .setPeriodic(UpdatePolicy.DAY).setPersisted(true).build());
    }
    private static long version(PackageInfo info) { return Build.VERSION.SDK_INT >= 28 ? info.getLongVersionCode() : info.versionCode; }
    private PackageInfo installed() throws Exception {
        return context.getPackageManager().getPackageInfo(context.getPackageName(),
            Build.VERSION.SDK_INT >= 28 ? PackageManager.GET_SIGNING_CERTIFICATES : PackageManager.GET_SIGNATURES);
    }
    private static Signature[] signers(PackageInfo info) {
        if (Build.VERSION.SDK_INT >= 28) return info.signingInfo == null ? null : info.signingInfo.getApkContentsSigners();
        return info.signatures;
    }
    private boolean validArchive(File file, JSONObject release) throws Exception {
        PackageInfo current = installed();
        PackageInfo archive = context.getPackageManager().getPackageArchiveInfo(file.getAbsolutePath(),
            Build.VERSION.SDK_INT >= 28 ? PackageManager.GET_SIGNING_CERTIFICATES : PackageManager.GET_SIGNATURES);
        if (archive == null) return false;
        Signature[] own = signers(current), candidate = signers(archive);
        boolean same = own != null && candidate != null && own.length > 0 && own.length == candidate.length
            && new HashSet<>(Arrays.asList(own)).equals(new HashSet<>(Arrays.asList(candidate)));
        return UpdatePolicy.candidate(version(current), release.getLong("versionCode"), version(archive),
            current.packageName, archive.packageName, same);
    }
    private static HttpsURLConnection connection(String value) throws Exception {
        if (!UpdatePolicy.https(value)) throw new IOException();
        URL url = new URL(value);
        // Never use a download mirror to reach loopback, local or link-local endpoints.
        for (InetAddress address : InetAddress.getAllByName(url.getHost())) {
            if (address.isAnyLocalAddress() || address.isLoopbackAddress() || address.isLinkLocalAddress()
                || address.isSiteLocalAddress() || address.isMulticastAddress()) throw new IOException();
        }
        HttpsURLConnection connection = (HttpsURLConnection)url.openConnection();
        connection.setConnectTimeout(15_000); connection.setReadTimeout(15_000);
        connection.setInstanceFollowRedirects(false); connection.setUseCaches(false);
        return connection;
    }
    private JSONObject remote() throws Exception {
        String url = preferences.getString("url", ""), key = preferences.getString("key", "");
        if (url.isEmpty() || key.isEmpty()) throw new IOException();
        HttpsURLConnection connection = connection(url + "/rest/v1/rpc/rpc_app_update_release");
        try {
            connection.setRequestMethod("POST"); connection.setRequestProperty("apikey", key);
            connection.setRequestProperty("Content-Type", "application/json"); connection.setDoOutput(true);
            try (OutputStream out = connection.getOutputStream()) { out.write("{}".getBytes(java.nio.charset.StandardCharsets.UTF_8)); }
            if (connection.getResponseCode() != 200) throw new IOException();
            try (InputStream in = connection.getInputStream(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
                byte[] buffer = new byte[4096]; int count;
                while ((count = in.read(buffer)) != -1) { if (out.size() + count > 32768) throw new IOException(); out.write(buffer, 0, count); }
                return new JSONObject(out.toString("UTF-8"));
            }
        } finally { connection.disconnect(); }
    }
    private static MirrorDownload.Response openMirror(String value) throws Exception {
        for (int redirects = 0; redirects <= 5; redirects++) {
            final HttpsURLConnection connection = connection(value);
            int code;
            try { code = connection.getResponseCode(); } catch (Exception failure) { connection.disconnect(); throw failure; }
            if (code == 301 || code == 302 || code == 303 || code == 307 || code == 308) {
                String location = connection.getHeaderField("Location"); connection.disconnect();
                if (location == null) throw new IOException();
                value = new URI(value).resolve(location).toString(); continue;
            }
            String type = connection.getContentType();
            if (code != 200 || (type != null && type.toLowerCase(Locale.ROOT).contains("text/html"))) { connection.disconnect(); throw new IOException(); }
            return new MirrorDownload.Response() {
                public InputStream body() throws Exception { return connection.getInputStream(); }
                public long length() {
                    try { return Long.parseLong(connection.getHeaderField("Content-Length")); }
                    catch (Exception ignored) { return -1; }
                }
                public void close() { connection.disconnect(); }
            };
        }
        throw new IOException();
    }
    private static boolean releaseValid(JSONObject release) {
        if (release == null || !"com.xandeflix.prebuilt".equals(release.optString("packageId"))
            || release.optLong("versionCode") < 1 || release.optLong("versionCode") > 999999999L
            || release.optLong("bytes") < 1 || release.optLong("bytes") > UpdatePolicy.MAX_BYTES
            || !release.optString("sha256").matches("[a-f0-9]{64}")) return false;
        JSONArray mirrors = release.optJSONArray("mirrors");
        if (mirrors == null || mirrors.length() < 1 || mirrors.length() > 5) return false;
        for (int i = 0; i < mirrors.length(); i++) {
            JSONObject mirror = mirrors.optJSONObject(i);
            if (mirror == null || !UpdatePolicy.https(mirror.optString("url"))) return false;
        }
        return true;
    }
    public void check() { check(false); }
    public String check(boolean force) {
        if (!RUNNING.compareAndSet(false, true)) return "checking";
        File partial = new File(directory, "partial.apk");
        try {
            long now = System.currentTimeMillis();
            if (!force && !UpdatePolicy.due(preferences.getLong("last_check", 0), now)) return "waiting";
            if (preferences.getString("url", "").isEmpty()) return "unavailable";
            preferences.edit().putLong("last_check", now).commit();
            JSONObject release; boolean fresh = true;
            try {
                JSONObject publication = remote();
                if (!publication.getBoolean("enabled")) { clearReady(); preferences.edit().remove("release").commit(); return "disabled"; }
                release = publication.getJSONObject("release");
                if (!releaseValid(release)) return "unavailable";
                preferences.edit().putString("release", release.toString()).commit();
            } catch (Exception offline) {
                fresh = false;
                release = new JSONObject(preferences.getString("release", "{}"));
                if (!releaseValid(release)) return "unavailable";
            }
            if (release.getLong("versionCode") <= version(installed())) { clearReady(); return fresh ? "current" : "unavailable"; }
            if (ready.exists() && preferences.getLong("ready_version", 0) == release.getLong("versionCode")
                && release.getString("sha256").equals(MirrorDownload.hash(ready))) return "ready";
            if (!directory.isDirectory() && !directory.mkdirs()) return "download_failed";
            List<String> urls = new ArrayList<>(); JSONArray mirrors = release.getJSONArray("mirrors");
            for (int i = 0; i < mirrors.length(); i++) urls.add(mirrors.getJSONObject(i).getString("url"));
            final JSONObject candidateRelease = release;
            if (!MirrorDownload.download(urls, release.getLong("bytes"), release.getString("sha256"), partial,
                UpdateEngine::openMirror, file -> validArchive(file, candidateRelease))) return "download_failed";
            synchronized (UpdateEngine.class) {
                if (Thread.currentThread().isInterrupted()) return "download_failed";
                if (ready.exists() && !ready.delete()) return "download_failed";
                if (!partial.renameTo(ready)) return "download_failed";
                if (!preferences.edit().putLong("ready_version", release.getLong("versionCode"))
                    .putString("ready_release", release.toString()).commit()) { ready.delete(); return "download_failed"; }
            }
            return "ready";
        } catch (Exception ignored) {
            // Network/storage/install metadata failure does not affect activation or playback.
        } finally { partial.delete(); RUNNING.set(false); }
        return "unavailable";
    }
    private void clearReady() {
        synchronized (UpdateEngine.class) {
            ready.delete(); preferences.edit().remove("ready_version").remove("ready_release").commit();
            File[] copies = directory.listFiles((dir, name) -> name.startsWith("install-") && name.endsWith(".apk"));
            if (copies != null) for (File copy : copies) copy.delete();
        }
    }
    public JSONObject status() throws Exception {
        synchronized (UpdateEngine.class) {
            long candidate = preferences.getLong("ready_version", 0);
            if (!ready.exists() || candidate <= version(installed())) { clearReady(); return new JSONObject().put("ready", false); }
            JSONObject release = new JSONObject(preferences.getString("ready_release", "{}"));
            return new JSONObject().put("ready", true).put("versionCode", candidate)
                .put("versionName", release.optString("versionName")).put("notes", release.optString("notes"));
        }
    }
    public File installationFile() throws Exception {
        synchronized (UpdateEngine.class) {
            JSONObject release = new JSONObject(preferences.getString("ready_release", "{}"));
            if (!releaseValid(release) || !ready.exists() || ready.length() != release.getLong("bytes")
                || !release.getString("sha256").equals(MirrorDownload.hash(ready)) || !validArchive(ready, release)) throw new IOException();
            // Installer URI references an immutable copy, even if a new download finishes.
            File copy = new File(directory, "install-" + release.getLong("versionCode") + ".apk");
            if (!copy.exists() || !release.getString("sha256").equals(MirrorDownload.hash(copy))) {
                try (InputStream in = new FileInputStream(ready); FileOutputStream out = new FileOutputStream(copy)) {
                    byte[] buffer = new byte[64 * 1024]; int count;
                    while ((count = in.read(buffer)) != -1) out.write(buffer, 0, count);
                    out.getFD().sync();
                } catch (Exception failure) { copy.delete(); throw failure; }
            }
            return copy;
        }
    }
}
