package com.xandeflix.prebuilt.security;

import com.getcapacitor.JSObject;
import java.net.Inet4Address;
import java.net.Inet6Address;
import java.net.InetAddress;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Debug-only safe projection of the locally decrypted source endpoint. */
final class SecureSourceConfigHostDiagnostic {
    interface DnsResolver {
        InetAddress[] resolve(String hostname) throws Exception;
    }

    static final class Summary {
        final String hostFingerprint;
        final String scheme;
        final String portClass;
        final int hostLength;
        final int sourceVersion;
        final String dnsResult;
        final String dnsException;
        final int aCount;
        final int aaaaCount;

        Summary(String hostFingerprint, String scheme, String portClass, int hostLength,
                int sourceVersion, String dnsResult, String dnsException, int aCount, int aaaaCount) {
            this.hostFingerprint = hostFingerprint;
            this.scheme = scheme;
            this.portClass = portClass;
            this.hostLength = hostLength;
            this.sourceVersion = sourceVersion;
            this.dnsResult = dnsResult;
            this.dnsException = dnsException;
            this.aCount = aCount;
            this.aaaaCount = aaaaCount;
        }
    }

    private SecureSourceConfigHostDiagnostic() {}

    /** DEBUG-only semantic projection. It never returns decrypted configuration values. */
    static JSObject inspectPostRead(LocalSecureSourceRecord record) {
        JSObject result = new JSObject();
        String expectedField = "M3U".equals(record.getProtocol()) ? "playlistUrl" : "endpoint";
        result.put("objectPresent", true);
        result.put("sourceType", record.getProtocol());
        result.put("expectedHostField", expectedField);
        result.put("endpointState", fieldState(record.getSourceConfigJson(), "endpoint"));
        result.put("playlistUrlState", fieldState(record.getSourceConfigJson(), "playlistUrl"));
        try {
            String endpoint = readEndpoint(record);
            result.put("expectedHostFieldState", stringState(endpoint));
            if (endpoint.trim().isEmpty()) {
                result.put("branch", "READ_SUCCESS_ENDPOINT_EMPTY");
                return result;
            }
            URI uri = new URI(endpoint.trim());
            if (uri.getScheme() == null || uri.getScheme().trim().isEmpty()) {
                result.put("branch", "READ_SUCCESS_URI_SCHEME_MISSING");
                return result;
            }
            String hostname = uri.getHost();
            if (hostname == null || hostname.trim().isEmpty()) {
                result.put("branch", "READ_SUCCESS_URI_HOST_MISSING");
                return result;
            }
            result.put("branch", "READ_SUCCESS_FINGERPRINT_SUCCESS");
            result.put("schemeClass", uri.getScheme().toLowerCase(Locale.US));
            result.put("hostLength", hostname.trim().length());
            result.put("portClass", uri.getPort() < 0 ? "default" : "explicit");
            return result;
        } catch (LocalSecureSourceStoreException error) {
            result.put("expectedHostFieldState", "ABSENT");
            result.put("branch", "READ_SUCCESS_ENDPOINT_MISSING");
            return result;
        } catch (Exception error) {
            result.put("branch", "READ_SUCCESS_URI_PARSE_FAILED");
            return result;
        }
    }

    private static String fieldState(String sourceConfigJson, String field) {
        Matcher matcher = Pattern.compile("\\\"" + field
                + "\\\"\\s*:\\s*\\\"((?:\\\\\\\\.|[^\\\"\\\\])*)\\\"")
                .matcher(sourceConfigJson);
        if (!matcher.find()) return "ABSENT";
        try {
            return stringState(decodeJsonString(matcher.group(1)));
        } catch (Exception error) {
            return "INVALID";
        }
    }

    private static String stringState(String value) {
        return value == null || value.trim().isEmpty() ? "EMPTY" : "NON_EMPTY";
    }

    static Summary inspect(LocalSecureSourceRecord record, DnsResolver resolver)
            throws LocalSecureSourceStoreException {
        String endpoint = null;
        try {
            endpoint = readEndpoint(record);
            URI uri = new URI(endpoint.trim());
            String hostname = uri.getHost();
            if (hostname == null || hostname.trim().isEmpty() || uri.getScheme() == null) {
                throw new IllegalArgumentException();
            }
            hostname = hostname.toLowerCase(Locale.US);
            DnsSummary dns = resolveDns(hostname, resolver);
            return new Summary(fingerprint(hostname), uri.getScheme().toLowerCase(Locale.US),
                    uri.getPort() < 0 ? "default" : "explicit", hostname.length(),
                    record.getSourceVersion(), dns.result, dns.exception, dns.aCount, dns.aaaaCount);
        } catch (LocalSecureSourceStoreException error) {
            throw error;
        } catch (Exception error) {
            throw new LocalSecureSourceStoreException(
                    LocalSecureSourceStoreException.LOCAL_SOURCE_CONFIG_UNAVAILABLE);
        } finally {
            endpoint = null;
        }
    }

    private static String readEndpoint(LocalSecureSourceRecord record)
            throws LocalSecureSourceStoreException {
        String field = "M3U".equals(record.getProtocol()) ? "playlistUrl" : "endpoint";
        Matcher matcher = Pattern.compile("\\\"" + field
                + "\\\"\\s*:\\s*\\\"((?:\\\\\\\\.|[^\\\"\\\\])*)\\\"")
                .matcher(record.getSourceConfigJson());
        if (!matcher.find()) {
            throw new LocalSecureSourceStoreException(
                    LocalSecureSourceStoreException.LOCAL_SOURCE_CONFIG_UNAVAILABLE);
        }
        try {
            return decodeJsonString(matcher.group(1));
        } catch (Exception error) {
            throw new LocalSecureSourceStoreException(
                    LocalSecureSourceStoreException.LOCAL_SOURCE_CONFIG_UNAVAILABLE);
        }
    }

    private static String decodeJsonString(String encoded) {
        StringBuilder decoded = new StringBuilder(encoded.length());
        for (int index = 0; index < encoded.length(); index++) {
            char value = encoded.charAt(index);
            if (value != '\\') {
                decoded.append(value);
                continue;
            }
            if (++index >= encoded.length()) throw new IllegalArgumentException();
            char escape = encoded.charAt(index);
            switch (escape) {
                case '\\': decoded.append('\\'); break;
                case '"': decoded.append('"'); break;
                case '/': decoded.append('/'); break;
                case 'b': decoded.append('\b'); break;
                case 'f': decoded.append('\f'); break;
                case 'n': decoded.append('\n'); break;
                case 'r': decoded.append('\r'); break;
                case 't': decoded.append('\t'); break;
                case 'u':
                    if (index + 4 >= encoded.length()) throw new IllegalArgumentException();
                    decoded.append((char) Integer.parseInt(encoded.substring(index + 1, index + 5), 16));
                    index += 4;
                    break;
                default: throw new IllegalArgumentException();
            }
        }
        return decoded.toString();
    }

    private static DnsSummary resolveDns(String hostname, DnsResolver resolver) {
        int ipv4 = 0;
        int ipv6 = 0;
        try {
            InetAddress[] addresses = resolver.resolve(hostname);
            if (addresses != null) {
                for (InetAddress address : addresses) {
                    if (address instanceof Inet4Address) ipv4++;
                    if (address instanceof Inet6Address) ipv6++;
                }
            }
            return new DnsSummary("PASS", "", ipv4, ipv6);
        } catch (Exception error) {
            return new DnsSummary("FAIL", sanitizeDnsException(error), 0, 0);
        }
    }

    private static String fingerprint(String hostname) throws Exception {
        byte[] digest = MessageDigest.getInstance("SHA-256")
                .digest(hostname.getBytes(StandardCharsets.UTF_8));
        StringBuilder output = new StringBuilder(12);
        for (int index = 0; index < 6; index++) {
            output.append(String.format(Locale.US, "%02x", digest[index] & 0xff));
        }
        return output.toString();
    }

    private static String sanitizeDnsException(Exception error) {
        String name = error.getClass().getSimpleName();
        return "UnknownHostException".equals(name) || "SecurityException".equals(name)
                ? name : "DNS_EXCEPTION";
    }

    private static final class DnsSummary {
        final String result;
        final String exception;
        final int aCount;
        final int aaaaCount;

        DnsSummary(String result, String exception, int aCount, int aaaaCount) {
            this.result = result;
            this.exception = exception;
            this.aCount = aCount;
            this.aaaaCount = aaaaCount;
        }
    }
}
