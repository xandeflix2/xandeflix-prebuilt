-- C57: sanitized control-plane audit only. Never accept catalog/source/free-text.
CREATE SCHEMA playback_support_private;
REVOKE ALL ON SCHEMA playback_support_private FROM PUBLIC;
GRANT USAGE ON SCHEMA playback_support_private TO anon, authenticated;

CREATE FUNCTION playback_support_private.valid_diagnostic(p JSONB)
RETURNS BOOLEAN LANGUAGE plpgsql IMMUTABLE SET search_path = '' AS $$
DECLARE v_time TIMESTAMPTZ;
BEGIN
  IF p IS NULL OR jsonb_typeof(p) <> 'object' OR octet_length(p::text) > 1800 THEN RETURN false; END IF;
  IF (SELECT count(*) FROM jsonb_object_keys(p)) <> 12
    OR NOT p ?& ARRAY['PACKAGE','APP_VERSION','BUNDLE','UTC','PAGE','ERROR_CODE','ERROR_CATEGORY',
      'HTTP_STATUS','MEDIA3_ERROR_CODE','CHECKPOINT','ANDROID','WEBVIEW_CHROME']
    OR EXISTS (SELECT 1 FROM jsonb_each(p) WHERE jsonb_typeof(value) <> 'string') THEN RETURN false; END IF;
  IF p->>'PACKAGE' <> 'com.xandeflix.prebuilt' OR p->>'APP_VERSION' <> '1.0'
    OR p->>'BUNDLE' !~ '^(UNKNOWN|index-[A-Za-z0-9_-]{6,64}\.js)$'
    OR p->>'PAGE' NOT IN ('home','movies','series','live','search','movie-detail','series-detail','UNKNOWN')
    OR p->>'ERROR_CODE' NOT IN ('UNKNOWN','NATIVE_ERROR','INVALID_REQUEST','PLAYER_ACTIVITY_UNAVAILABLE','PREVIEW_UNAVAILABLE',
      'CAST_NOT_CONNECTED','CAST_UNSUPPORTED_MEDIA','CAST_WIFI_REQUIRED','CAST_LOAD_FAILED','CAST_LOAD_TIMEOUT',
      'CAST_LOAD_CANCELLED','CAST_MEDIA_ERROR','CAST_LEASE_EXPIRED')
    OR p->>'ERROR_CATEGORY' NOT IN ('HTTP_ERROR','NETWORK_TIMEOUT','DECODER_ERROR','SOURCE_UNAVAILABLE','MEDIA_PARSER_FAILURE','MEDIA_ERROR','UNKNOWN')
    OR p->>'HTTP_STATUS' !~ '^(UNAVAILABLE|[45][0-9]{2})$'
    OR p->>'CHECKPOINT' NOT IN ('UNKNOWN','NATIVE_ACTIVITY_STARTED','DATASOURCE_OPEN','FIRST_FRAME','PLAYER_READY')
    OR p->>'ANDROID' !~ '^(UNKNOWN|[0-9]{1,2}(\.[0-9]{1,2}){0,2})$'
    OR p->>'WEBVIEW_CHROME' !~ '^(UNKNOWN|[0-9]{1,3}(\.[0-9]{1,5}){0,3})$' THEN RETURN false; END IF;
  IF p->>'MEDIA3_ERROR_CODE' <> 'UNAVAILABLE' THEN
    IF p->>'MEDIA3_ERROR_CODE' !~ '^[1-9][0-9]{3,9}$' THEN RETURN false; END IF;
    IF (p->>'MEDIA3_ERROR_CODE')::bigint > 2147483647 THEN RETURN false; END IF;
  END IF;
  IF p->>'UTC' <> 'UNKNOWN' THEN
    IF p->>'UTC' !~ '^20[0-9]{2}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$' THEN RETURN false; END IF;
    v_time := (p->>'UTC')::timestamptz;
    IF to_char(v_time AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') <> p->>'UTC' THEN RETURN false; END IF;
  END IF;
  RETURN true;
EXCEPTION WHEN invalid_datetime_format OR datetime_field_overflow OR numeric_value_out_of_range THEN RETURN false;
END;
$$;

CREATE TABLE playback_support_private.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_pk UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
  license_id UUID NOT NULL REFERENCES public.licenses(id) ON DELETE CASCADE,
  request_id UUID NOT NULL,
  diagnostic JSONB NOT NULL CHECK (playback_support_private.valid_diagnostic(diagnostic)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (device_pk, request_id)
);
CREATE INDEX playback_reports_device_time ON playback_support_private.reports(device_pk, created_at DESC);
CREATE INDEX playback_reports_license ON playback_support_private.reports(license_id);
CREATE INDEX playback_reports_time ON playback_support_private.reports(created_at DESC, id DESC);
CREATE TABLE playback_support_private.read_receipts (
  report_id UUID NOT NULL REFERENCES playback_support_private.reports(id) ON DELETE CASCADE,
  manager_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (report_id, manager_id)
);
CREATE INDEX playback_receipts_manager ON playback_support_private.read_receipts(manager_id, report_id);
ALTER TABLE playback_support_private.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE playback_support_private.read_receipts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE playback_support_private.reports, playback_support_private.read_receipts FROM PUBLIC, anon, authenticated;

CREATE FUNCTION playback_support_private.report_error(p_device_id TEXT, p_device_token TEXT, p_request_id UUID, p_diagnostic JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_device public.devices%ROWTYPE; v_license UUID; v_report playback_support_private.reports%ROWTYPE;
BEGIN
  IF p_device_id IS NULL OR length(p_device_id) NOT BETWEEN 1 AND 64 OR p_device_token IS NULL
    OR length(p_device_token) NOT BETWEEN 8 AND 512 OR p_request_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'code', 'REPORT_UNAVAILABLE');
  END IF;
  -- Serialize dedup/rate-limit; never update identity or license/session state.
  SELECT * INTO v_device FROM public.devices WHERE device_id = p_device_id FOR UPDATE;
  IF NOT FOUND OR v_device.status <> 'AUTHORIZED' OR v_device.device_token_hash IS NULL
    OR v_device.device_token_hash <> encode(extensions.digest(p_device_token, 'sha256'), 'hex') THEN
    RETURN jsonb_build_object('success', false, 'code', 'REPORT_UNAVAILABLE');
  END IF;
  SELECT license_id INTO v_license FROM public.license_devices
    WHERE device_id = p_device_id AND status = 'ACTIVE' ORDER BY bound_at DESC, id DESC LIMIT 1;
  IF v_license IS NULL OR NOT playback_support_private.valid_diagnostic(p_diagnostic) THEN
    RETURN jsonb_build_object('success', false, 'code', 'REPORT_UNAVAILABLE');
  END IF;
  SELECT * INTO v_report FROM playback_support_private.reports WHERE device_pk = v_device.id AND request_id = p_request_id;
  IF FOUND THEN
    IF v_report.diagnostic <> p_diagnostic THEN RETURN jsonb_build_object('success', false, 'code', 'REPORT_UNAVAILABLE'); END IF;
    RETURN jsonb_build_object('success', true, 'reportId', v_report.id);
  END IF;
  IF (SELECT count(*) FROM playback_support_private.reports WHERE device_pk = v_device.id AND created_at > now() - interval '1 minute') >= 5
    OR (SELECT count(*) FROM playback_support_private.reports WHERE device_pk = v_device.id AND created_at > now() - interval '1 hour') >= 30 THEN
    RETURN jsonb_build_object('success', false, 'code', 'REPORT_RATE_LIMIT');
  END IF;
  INSERT INTO playback_support_private.reports(device_pk, license_id, request_id, diagnostic)
    VALUES (v_device.id, v_license, p_request_id, p_diagnostic) RETURNING * INTO v_report;
  RETURN jsonb_build_object('success', true, 'reportId', v_report.id);
END;
$$;

CREATE FUNCTION playback_support_private.list_errors(p_before_id UUID)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_manager UUID; v_before TIMESTAMPTZ; v_unread BIGINT; v_items JSONB; v_more BOOLEAN;
BEGIN
  v_manager := private.require_active_manager();
  IF p_before_id IS NOT NULL THEN
    SELECT created_at INTO v_before FROM playback_support_private.reports WHERE id = p_before_id;
    IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'code', 'REPORT_UNAVAILABLE'); END IF;
  END IF;
  SELECT count(*) INTO v_unread FROM playback_support_private.reports r
    WHERE NOT EXISTS (SELECT 1 FROM playback_support_private.read_receipts rr WHERE rr.report_id = r.id AND rr.manager_id = v_manager);
  WITH page AS (
    SELECT r.* FROM playback_support_private.reports r
    WHERE p_before_id IS NULL OR (r.created_at, r.id) < (v_before, p_before_id)
    ORDER BY r.created_at DESC, r.id DESC LIMIT 51
  ), displayed AS (SELECT * FROM page ORDER BY created_at DESC, id DESC LIMIT 50)
  SELECT (SELECT count(*) > 50 FROM page), COALESCE(jsonb_agg(jsonb_build_object(
    'id', r.id, 'receivedAt', r.created_at, 'diagnostic', r.diagnostic,
    'displayCode', d.display_code, 'deviceLabel', d.device_label, 'deviceType', d.device_type,
    'customerName', COALESCE(left(c.nickname, 100), ''),
    'read', EXISTS (SELECT 1 FROM playback_support_private.read_receipts rr WHERE rr.report_id = r.id AND rr.manager_id = v_manager)
  ) ORDER BY r.created_at DESC, r.id DESC), '[]'::jsonb)
  INTO v_more, v_items FROM displayed r JOIN public.devices d ON d.id = r.device_pk
    JOIN public.licenses l ON l.id = r.license_id LEFT JOIN public.customer_profiles c ON c.id = l.customer_id;
  RETURN jsonb_build_object('success', true, 'unreadCount', v_unread, 'reports', v_items, 'hasMore', v_more);
END;
$$;

CREATE FUNCTION playback_support_private.mark_read(p_report_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_manager UUID;
BEGIN
  v_manager := private.require_active_manager();
  IF NOT EXISTS (SELECT 1 FROM playback_support_private.reports WHERE id = p_report_id) THEN
    RETURN jsonb_build_object('success', false, 'code', 'REPORT_UNAVAILABLE');
  END IF;
  INSERT INTO playback_support_private.read_receipts(report_id, manager_id) VALUES (p_report_id, v_manager)
    ON CONFLICT (report_id, manager_id) DO NOTHING;
  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION playback_support_private.valid_diagnostic(JSONB) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION playback_support_private.report_error(TEXT,TEXT,UUID,JSONB) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION playback_support_private.list_errors(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION playback_support_private.mark_read(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION playback_support_private.report_error(TEXT,TEXT,UUID,JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION playback_support_private.list_errors(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION playback_support_private.mark_read(UUID) TO authenticated;

CREATE FUNCTION public.rpc_device_report_playback_error(p_device_id TEXT, p_device_token TEXT, p_request_id UUID, p_diagnostic JSONB)
RETURNS JSONB LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$
  SELECT playback_support_private.report_error(p_device_id, p_device_token, p_request_id, p_diagnostic);
$$;
CREATE FUNCTION public.rpc_manager_list_playback_errors(p_before_id UUID DEFAULT NULL)
RETURNS JSONB LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$ SELECT playback_support_private.list_errors(p_before_id); $$;
CREATE FUNCTION public.rpc_manager_mark_playback_error_read(p_report_id UUID)
RETURNS JSONB LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$ SELECT playback_support_private.mark_read(p_report_id); $$;
REVOKE ALL ON FUNCTION public.rpc_device_report_playback_error(TEXT,TEXT,UUID,JSONB) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.rpc_manager_list_playback_errors(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.rpc_manager_mark_playback_error_read(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_device_report_playback_error(TEXT,TEXT,UUID,JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_manager_list_playback_errors(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_manager_mark_playback_error_read(UUID) TO authenticated;
NOTIFY pgrst, 'reload schema';
