package com.xandeflix.prebuilt.security;

import java.util.Locale;
import java.util.regex.Pattern;
import org.json.JSONException;
import org.json.JSONObject;

/** Contrato local separado de autorização remota e de contexto de playback. */
public final class LocalSecureSourceRecord {
    public static final int CURRENT_SCHEMA_VERSION = 1;
    private static final Pattern SOURCE_ID_PATTERN = Pattern.compile("^(src|csrc)_[a-z0-9]+$");

    private final String sourceId;
    private final int sourceVersion;
    private final String protocol;
    private final String sourceConfigJson;

    public LocalSecureSourceRecord(String sourceId, int sourceVersion, String protocol, JSONObject sourceConfig)
            throws LocalSecureSourceStoreException {
        this(sourceId, sourceVersion, protocol, sourceConfig == null ? null : sourceConfig.toString());
    }

    public LocalSecureSourceRecord(String sourceId, int sourceVersion, String protocol, String sourceConfigJson)
            throws LocalSecureSourceStoreException {
        validateSourceId(sourceId);
        validateProtocol(protocol);
        if (sourceVersion < 1 || sourceConfigJson == null || sourceConfigJson.trim().isEmpty()) {
            throw new LocalSecureSourceStoreException(LocalSecureSourceStoreException.INVALID_SOURCE_RECORD);
        }
        this.sourceId = sourceId;
        this.sourceVersion = sourceVersion;
        this.protocol = protocol;
        this.sourceConfigJson = sourceConfigJson;
    }

    public static LocalSecureSourceRecord fromJson(JSONObject record) throws LocalSecureSourceStoreException {
        if (record == null) {
            throw new LocalSecureSourceStoreException(LocalSecureSourceStoreException.INVALID_SOURCE_RECORD);
        }
        try {
            String sourceId = record.optString("sourceId", null);
            int sourceVersion = record.optInt("sourceVersion", -1);
            String protocol = record.optString("protocol", null);
            JSONObject sourceConfig = record.optJSONObject("sourceConfig");
            return new LocalSecureSourceRecord(sourceId, sourceVersion, protocol, sourceConfig);
        } catch (LocalSecureSourceStoreException error) {
            throw error;
        } catch (Exception error) {
            throw new LocalSecureSourceStoreException(LocalSecureSourceStoreException.INVALID_SOURCE_RECORD);
        }
    }

    public JSONObject toJson() throws LocalSecureSourceStoreException {
        try {
            JSONObject result = new JSONObject();
            result.put("sourceId", sourceId);
            result.put("sourceVersion", sourceVersion);
            result.put("protocol", protocol);
            result.put("sourceConfig", new JSONObject(sourceConfigJson));
            return result;
        } catch (JSONException error) {
            throw new LocalSecureSourceStoreException(LocalSecureSourceStoreException.INVALID_SOURCE_RECORD);
        }
    }

    public String getSourceId() {
        return sourceId;
    }

    public int getSourceVersion() {
        return sourceVersion;
    }

    public String getProtocol() {
        return protocol;
    }

    public String getSourceConfigJson() {
        return sourceConfigJson;
    }

    public JSONObject getSourceConfigCopy() throws LocalSecureSourceStoreException {
        try {
            return new JSONObject(sourceConfigJson);
        } catch (JSONException error) {
            throw new LocalSecureSourceStoreException(LocalSecureSourceStoreException.INVALID_SOURCE_RECORD);
        }
    }

    public static void validateSourceId(String sourceId) throws LocalSecureSourceStoreException {
        if (sourceId == null || !SOURCE_ID_PATTERN.matcher(sourceId).matches()) {
            throw new LocalSecureSourceStoreException(LocalSecureSourceStoreException.INVALID_SOURCE_ID);
        }
    }

    public static void validateProtocol(String protocol) throws LocalSecureSourceStoreException {
        if (protocol == null || !("M3U".equals(protocol.toUpperCase(Locale.US))
                || "XTREAM".equals(protocol.toUpperCase(Locale.US)))) {
            throw new LocalSecureSourceStoreException(LocalSecureSourceStoreException.INVALID_SOURCE_RECORD);
        }
    }
}
