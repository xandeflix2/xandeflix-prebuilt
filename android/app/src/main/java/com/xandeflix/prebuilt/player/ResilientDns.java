package com.xandeflix.prebuilt.player;

import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.HttpURLConnection;
import java.net.InetAddress;
import java.net.URL;
import java.net.URLEncoder;
import java.net.UnknownHostException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import okhttp3.Dns;

/**
 * Xandeflix Prebuilt — ResilientDns (Unidade de Transporte T4)
 *
 * Resolver DNS resiliente para OkHttp com política de fallback estrita:
 * 1. SYSTEM_DNS_FIRST: O resolver padrão do sistema (Dns.SYSTEM) é sempre consultado primeiro.
 * 2. FALLBACK_DNS_OR_DOH: Fallback público (UDP 53 / DoH) acionado SOMENTE quando o sistema falhar com UnknownHostException.
 * 3. ZERO_HARDCODE: Nenhum IP de provedor de streaming nem hostname de catálogo é fixado.
 * 4. HOSTNAME_PRESERVATION: Preserva integralmente o hostname original na InetAddress e requisições HTTP/TLS.
 * 5. SANITIZED_LOGS: Mascara hostnames em logs de diagnóstico (zero secrets exposure).
 */
public class ResilientDns implements Dns {

    private static final String TAG = "ResilientDns";

    public interface FallbackResolver {
        @NonNull
        List<InetAddress> resolve(@NonNull String hostname) throws Exception;
    }

    private final Dns systemDns;
    private final FallbackResolver fallbackResolver;
    private final Map<String, CacheEntry> cache = new ConcurrentHashMap<>();

    private static class CacheEntry {
        final List<InetAddress> addresses;
        final long expiresAtMs;

        CacheEntry(List<InetAddress> addresses, long ttlSeconds) {
            this.addresses = Collections.unmodifiableList(addresses);
            long validTtl = Math.max(30L, Math.min(ttlSeconds, 300L));
            this.expiresAtMs = System.currentTimeMillis() + (validTtl * 1000L);
        }

        boolean isExpired() {
            return System.currentTimeMillis() > expiresAtMs;
        }
    }

    public ResilientDns() {
        this(Dns.SYSTEM, new DefaultPublicDnsFallback());
    }

    public ResilientDns(@Nullable Dns systemDns, @Nullable FallbackResolver fallbackResolver) {
        this.systemDns = systemDns != null ? systemDns : Dns.SYSTEM;
        this.fallbackResolver = fallbackResolver != null ? fallbackResolver : new DefaultPublicDnsFallback();
    }

    @NonNull
    @Override
    public List<InetAddress> lookup(@NonNull String hostname) throws UnknownHostException {
        if (hostname.trim().isEmpty()) {
            throw new UnknownHostException("Hostname cannot be empty");
        }

        String normalizedHost = hostname.trim();

        // 0. Cache em memória para evitar tempestade de resoluções em segmentos de streaming
        CacheEntry cached = cache.get(normalizedHost);
        if (cached != null && !cached.isExpired() && !cached.addresses.isEmpty()) {
            return cached.addresses;
        }

        // 1. SYSTEM_DNS_FIRST: sempre consulta o resolver do sistema/rede primeiro
        try {
            List<InetAddress> systemAddresses = systemDns.lookup(normalizedHost);
            if (systemAddresses != null && !systemAddresses.isEmpty()) {
                cache.put(normalizedHost, new CacheEntry(systemAddresses, 60));
                return systemAddresses;
            }
        } catch (UnknownHostException uhe) {
            Log.w(TAG, "System DNS falhou para host " + sanitizeHost(normalizedHost) + ", acionando fallback");
        } catch (Exception e) {
            Log.w(TAG, "Exceção inesperada no system DNS para " + sanitizeHost(normalizedHost) + ": " + e.getMessage());
        }

        // 2. FALLBACK_DNS: acionado SOMENTE quando o resolver do sistema falha
        if (fallbackResolver != null) {
            try {
                List<InetAddress> fallbackAddresses = fallbackResolver.resolve(normalizedHost);
                if (fallbackAddresses != null && !fallbackAddresses.isEmpty()) {
                    Log.i(TAG, "Resolução DNS fallback bem-sucedida para host " + sanitizeHost(normalizedHost)
                            + " (count=" + fallbackAddresses.size() + ")");
                    cache.put(normalizedHost, new CacheEntry(fallbackAddresses, 60));
                    return fallbackAddresses;
                }
            } catch (Exception ex) {
                Log.w(TAG, "Fallback DNS também falhou para " + sanitizeHost(normalizedHost) + ": " + ex.getMessage());
            }
        }

        // 3. Se ambos falharem, propaga UnknownHostException
        throw new UnknownHostException("Falha na resolução de DNS (sistema e fallback) para: " + normalizedHost);
    }

    /**
     * Sanitização estrita de hostnames para logs (zero secrets exposure).
     */
    public static String sanitizeHost(String host) {
        if (host == null || host.isEmpty()) {
            return "[EMPTY]";
        }
        String[] parts = host.split("\\.");
        if (parts.length < 2) {
            return host.substring(0, Math.min(3, host.length())) + "***";
        }
        return parts[0] + ".***." + parts[parts.length - 1];
    }

    /**
     * Implementação padrão de fallback utilizando servidores DNS públicos (Cloudflare & Google).
     * Tenta primeiro UDP padrão (porta 53) e, caso indisponível, DNS-over-HTTPS (porta 443).
     */
    public static class DefaultPublicDnsFallback implements FallbackResolver {

        private static final String[] PUBLIC_DNS_IPS = {"1.1.1.1", "8.8.8.8"};
        private static final int UDP_TIMEOUT_MS = 2500;
        private static final int DOH_TIMEOUT_MS = 3500;

        @NonNull
        @Override
        public List<InetAddress> resolve(@NonNull String hostname) throws Exception {
            List<InetAddress> addresses = new ArrayList<>();

            // 1. Tentar consulta UDP rápida aos resolvers públicos padrão (RFC 1035)
            for (String dnsIp : PUBLIC_DNS_IPS) {
                try {
                    List<InetAddress> udpResults = queryUdpDns(hostname, dnsIp, UDP_TIMEOUT_MS);
                    if (!udpResults.isEmpty()) {
                        return udpResults;
                    }
                } catch (Exception e) {
                    Log.d(TAG, "UDP DNS query para " + dnsIp + " falhou: " + e.getMessage());
                }
            }

            // 2. Se UDP falhar ou porta 53 for bloqueada pela rede, tentar DoH (HTTPS porta 443)
            // Cloudflare DoH (JSON API)
            try {
                String cfUrl = "https://1.1.1.1/dns-query?name=" + URLEncoder.encode(hostname, "UTF-8") + "&type=A";
                List<InetAddress> cfResults = queryDoh(hostname, cfUrl, DOH_TIMEOUT_MS);
                if (!cfResults.isEmpty()) {
                    return cfResults;
                }
            } catch (Exception e) {
                Log.d(TAG, "Cloudflare DoH falhou: " + e.getMessage());
            }

            // Google DoH (JSON API)
            try {
                String googleUrl = "https://8.8.8.8/resolve?name=" + URLEncoder.encode(hostname, "UTF-8") + "&type=A";
                List<InetAddress> googleResults = queryDoh(hostname, googleUrl, DOH_TIMEOUT_MS);
                if (!googleResults.isEmpty()) {
                    return googleResults;
                }
            } catch (Exception e) {
                Log.d(TAG, "Google DoH falhou: " + e.getMessage());
            }

            return addresses;
        }

        public static List<InetAddress> queryUdpDns(String hostname, String dnsServerIp, int timeoutMs) throws Exception {
            byte[] query = buildDnsQueryPacket(hostname);
            InetAddress serverAddr = InetAddress.getByName(dnsServerIp);

            try (DatagramSocket socket = new DatagramSocket()) {
                socket.setSoTimeout(timeoutMs);
                DatagramPacket sendPacket = new DatagramPacket(query, query.length, serverAddr, 53);
                socket.send(sendPacket);

                byte[] buffer = new byte[512];
                DatagramPacket receivePacket = new DatagramPacket(buffer, buffer.length);
                socket.receive(receivePacket);

                return parseDnsResponse(hostname, buffer, receivePacket.getLength());
            }
        }

        public static List<InetAddress> queryDoh(String hostname, String dohUrl, int timeoutMs) {
            List<InetAddress> addresses = new ArrayList<>();
            try {
                URL url = new URL(dohUrl);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setConnectTimeout(timeoutMs);
                conn.setReadTimeout(timeoutMs);
                conn.setRequestProperty("Accept", "application/dns-json, application/json");
                conn.setRequestMethod("GET");

                if (conn.getResponseCode() == 200) {
                    try (InputStream in = conn.getInputStream();
                         BufferedReader reader = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8))) {
                        StringBuilder sb = new StringBuilder();
                        String line;
                        while ((line = reader.readLine()) != null) {
                            sb.append(line);
                        }
                        return parseDohJsonResponse(hostname, sb.toString());
                    }
                }
            } catch (Exception ignored) {
            }
            return addresses;
        }

        public static byte[] buildDnsQueryPacket(String hostname) {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            // ID (2 bytes)
            baos.write(0x12);
            baos.write(0x34);
            // Flags: 0x0100 (Standard Query, Recursion Desired)
            baos.write(0x01);
            baos.write(0x00);
            // QDCOUNT: 1
            baos.write(0x00);
            baos.write(0x01);
            // ANCOUNT: 0
            baos.write(0x00);
            baos.write(0x00);
            // NSCOUNT: 0
            baos.write(0x00);
            baos.write(0x00);
            // ARCOUNT: 0
            baos.write(0x00);
            baos.write(0x00);

            // Question: QNAME
            String[] labels = hostname.split("\\.");
            for (String label : labels) {
                byte[] bytes = label.getBytes(StandardCharsets.US_ASCII);
                baos.write(bytes.length);
                baos.write(bytes, 0, bytes.length);
            }
            baos.write(0); // Null terminator

            // QTYPE: 1 (A record)
            baos.write(0x00);
            baos.write(0x01);
            // QCLASS: 1 (IN)
            baos.write(0x00);
            baos.write(0x01);

            return baos.toByteArray();
        }

        public static List<InetAddress> parseDnsResponse(String hostname, byte[] buffer, int length) {
            List<InetAddress> addresses = new ArrayList<>();
            if (length < 12) {
                return addresses;
            }

            int offset = 12;
            // Pular seção de Question
            while (offset < length && buffer[offset] != 0) {
                if ((buffer[offset] & 0xc0) == 0xc0) {
                    offset += 2;
                    break;
                }
                offset += (buffer[offset] & 0xff) + 1;
            }
            if (offset < length && buffer[offset] == 0) {
                offset += 1;
            }
            offset += 4; // QTYPE (2) + QCLASS (2)

            // Parse dos registros Answer
            while (offset + 10 <= length) {
                if ((buffer[offset] & 0xc0) == 0xc0) {
                    offset += 2;
                } else {
                    while (offset < length && buffer[offset] != 0) {
                        offset += (buffer[offset] & 0xff) + 1;
                    }
                    if (offset < length && buffer[offset] == 0) {
                        offset += 1;
                    }
                }
                if (offset + 10 > length) {
                    break;
                }

                int type = ((buffer[offset] & 0xff) << 8) | (buffer[offset + 1] & 0xff);
                offset += 2;
                int clazz = ((buffer[offset] & 0xff) << 8) | (buffer[offset + 1] & 0xff);
                offset += 2;
                offset += 4; // TTL (4 bytes)
                int rdlength = ((buffer[offset] & 0xff) << 8) | (buffer[offset + 1] & 0xff);
                offset += 2;

                if (type == 1 && clazz == 1 && rdlength == 4 && offset + 4 <= length) {
                    byte[] ipBytes = new byte[4];
                    System.arraycopy(buffer, offset, ipBytes, 0, 4);
                    try {
                        addresses.add(InetAddress.getByAddress(hostname, ipBytes));
                    } catch (UnknownHostException ignored) {
                    }
                }
                offset += rdlength;
            }
            return addresses;
        }

        public static List<InetAddress> parseDohJsonResponse(String hostname, String json) {
            List<InetAddress> addresses = new ArrayList<>();
            try {
                JSONObject obj = new JSONObject(json);
                if (obj.has("Answer")) {
                    JSONArray answers = obj.getJSONArray("Answer");
                    for (int i = 0; i < answers.length(); i++) {
                        JSONObject item = answers.getJSONObject(i);
                        int type = item.optInt("type", 0);
                        if (type == 1) { // A record
                            String data = item.optString("data");
                            byte[] ipBytes = parseIpv4Bytes(data);
                            if (ipBytes != null) {
                                addresses.add(InetAddress.getByAddress(hostname, ipBytes));
                            }
                        }
                    }
                }
            } catch (Exception ignored) {
            }
            return addresses;
        }

        public static byte[] parseIpv4Bytes(String ip) {
            if (ip == null) return null;
            String[] parts = ip.trim().split("\\.");
            if (parts.length != 4) return null;
            byte[] bytes = new byte[4];
            for (int i = 0; i < 4; i++) {
                try {
                    int val = Integer.parseInt(parts[i]);
                    if (val < 0 || val > 255) return null;
                    bytes[i] = (byte) val;
                } catch (NumberFormatException e) {
                    return null;
                }
            }
            return bytes;
        }
    }
}
