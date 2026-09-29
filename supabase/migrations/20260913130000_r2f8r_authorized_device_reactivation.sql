-- Xandeflix Prebuilt - R2F8R canonical same-device reactivation
--
-- The device creates a high-entropy token locally and sends only its SHA-256
-- hash. A request does not mutate entitlement state. A legitimate Manager
-- approves the request, and the device then finalizes the token rotation.
-- License, source, binding and slot state are revalidated under row locks.

CREATE SCHEMA IF NOT EXISTS private;

CREATE TABLE IF NOT EXISTS private.device_reactivation_requests (
    request_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(64) NOT NULL,
    new_device_token_hash VARCHAR(64) NOT NULL,
    display_code VARCHAR(32) NOT NULL,
    device_type VARCHAR(20) NOT NULL,
    device_label VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'APPROVED', 'CONSUMED', 'EXPIRED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes'),
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    consumed_at TIMESTAMPTZ,
    CONSTRAINT chk_reactivation_token_hash_shape
        CHECK (new_device_token_hash ~ '^[0-9a-fA-F]{64}$'),
    CONSTRAINT chk_reactivation_display_code_shape
        CHECK (display_code ~* '^XF-[A-Z0-9]{4}-[A-Z0-9]{4}$'),
    CONSTRAINT chk_reactivation_device_type
        CHECK (device_type IN ('TV', 'PHONE', 'TABLET', 'PC', 'OTHER')),
    CONSTRAINT chk_reactivation_expiry_after_creation
        CHECK (expires_at > created_at)
);

ALTER TABLE private.device_reactivation_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE private.device_reactivation_requests FROM PUBLIC, anon, authenticated;

CREATE INDEX IF NOT EXISTS idx_device_reactivation_requests_device_status
    ON private.device_reactivation_requests(device_id, status);

CREATE UNIQUE INDEX IF NOT EXISTS uq_device_reactivation_requests_open_device
    ON private.device_reactivation_requests(device_id)
    WHERE status IN ('PENDING', 'APPROVED');

CREATE OR REPLACE FUNCTION private.reactivation_result(
    p_success BOOLEAN,
    p_result_code TEXT,
    p_request_id UUID,
    p_device_id VARCHAR,
    p_device_status TEXT,
    p_license_status TEXT,
    p_license_mode TEXT,
    p_source_id TEXT,
    p_source_version INTEGER,
    p_source_status TEXT,
    p_binding_status TEXT
)
RETURNS JSONB
LANGUAGE sql
IMMUTABLE
SET search_path = pg_catalog, private
AS $$
    SELECT jsonb_build_object(
        'success', p_success,
        'result_code', p_result_code,
        'requestId', p_request_id,
        'deviceId', p_device_id,
        'deviceStatus', p_device_status,
        'licenseStatus', p_license_status,
        'licenseMode', p_license_mode,
        'sourceId', p_source_id,
        'sourceVersion', p_source_version,
        'sourceStatus', p_source_status,
        'bindingStatus', p_binding_status,
        'netDeviceSlotDelta', 0,
        'licenseRecreated', false,
        'licenseChanged', false,
        'sourceBindingChanged', false
    );
$$;

REVOKE ALL ON FUNCTION private.reactivation_result(
    BOOLEAN, TEXT, UUID, VARCHAR, TEXT, TEXT, TEXT, TEXT, INTEGER, TEXT, TEXT
) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.rpc_request_authorized_device_reactivation(
    p_device_id VARCHAR(64),
    p_new_device_token_hash VARCHAR(64),
    p_display_code VARCHAR(32),
    p_device_type VARCHAR(20),
    p_device_label VARCHAR(100)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
DECLARE
    v_device public.devices%ROWTYPE;
    v_license_device public.license_devices%ROWTYPE;
    v_license public.licenses%ROWTYPE;
    v_binding public.device_source_bindings%ROWTYPE;
    v_source public.managed_sources%ROWTYPE;
    v_existing private.device_reactivation_requests%ROWTYPE;
    v_request_id UUID;
BEGIN
    IF p_device_id IS NULL OR p_device_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        RETURN private.reactivation_result(false, 'INVALID_DEVICE_ID', NULL, p_device_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
    END IF;
    IF p_new_device_token_hash IS NULL OR p_new_device_token_hash !~ '^[0-9a-fA-F]{64}$' THEN
        RETURN private.reactivation_result(false, 'TOKEN_HASH_INVALID', NULL, p_device_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
    END IF;
    IF p_display_code IS NULL OR p_display_code !~* '^XF-[A-Z0-9]{4}-[A-Z0-9]{4}$'
       OR p_device_type IS NULL OR p_device_type NOT IN ('TV', 'PHONE', 'TABLET', 'PC', 'OTHER')
       OR p_device_label IS NULL OR btrim(p_device_label) = '' THEN
        RETURN private.reactivation_result(false, 'INVALID_DEVICE_METADATA', NULL, p_device_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
    END IF;

    SELECT * INTO v_device
    FROM public.devices
    WHERE device_id = p_device_id
    FOR UPDATE;
    IF NOT FOUND THEN
        RETURN private.reactivation_result(false, 'DEVICE_NOT_FOUND', NULL, p_device_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
    END IF;
    IF v_device.status = 'REVOKED' THEN
        RETURN private.reactivation_result(false, 'DEVICE_REVOKED', NULL, p_device_id, v_device.status, NULL, NULL, NULL, NULL, NULL, NULL);
    END IF;
    IF v_device.status <> 'AUTHORIZED' THEN
        RETURN private.reactivation_result(false, 'DEVICE_NOT_AUTHORIZED', NULL, p_device_id, v_device.status, NULL, NULL, NULL, NULL, NULL, NULL);
    END IF;

    SELECT ld.* INTO v_license_device
    FROM public.license_devices ld
    WHERE ld.device_id = p_device_id AND ld.status = 'ACTIVE'
    ORDER BY ld.bound_at DESC
    LIMIT 1
    FOR UPDATE;
    IF NOT FOUND THEN
        RETURN private.reactivation_result(false, 'LICENSE_NOT_ACTIVE', NULL, p_device_id, v_device.status, NULL, NULL, NULL, NULL, NULL, NULL);
    END IF;

    SELECT l.* INTO v_license
    FROM public.licenses l
    WHERE l.id = v_license_device.license_id
    FOR UPDATE;
    IF NOT FOUND OR v_license.status <> 'ACTIVE'
       OR (v_license.expires_at IS NOT NULL AND v_license.expires_at <= NOW()) THEN
        RETURN private.reactivation_result(false, 'LICENSE_NOT_ACTIVE', NULL, p_device_id, v_device.status, COALESCE(v_license.status, 'MISSING'), COALESCE(v_license.mode, 'UNKNOWN'), NULL, NULL, NULL, NULL);
    END IF;
    IF v_license.mode <> 'MANAGED' THEN
        RETURN private.reactivation_result(false, 'LICENSE_MODE_INVALID', NULL, p_device_id, v_device.status, v_license.status, v_license.mode, NULL, NULL, NULL, NULL);
    END IF;

    SELECT dsb.* INTO v_binding
    FROM public.device_source_bindings dsb
    WHERE dsb.device_id = p_device_id AND dsb.license_id = v_license.id
    FOR UPDATE;
    IF NOT FOUND THEN
        RETURN private.reactivation_result(false, 'SOURCE_BINDING_NOT_FOUND', NULL, p_device_id, v_device.status, v_license.status, v_license.mode, NULL, NULL, NULL, NULL);
    END IF;

    SELECT ms.* INTO v_source
    FROM public.managed_sources ms
    WHERE ms.id = v_binding.source_id
    FOR UPDATE;
    IF NOT FOUND OR v_source.status <> 'ACTIVE' THEN
        RETURN private.reactivation_result(false, 'SOURCE_NOT_ACTIVE', NULL, p_device_id, v_device.status, v_license.status, v_license.mode, COALESCE(v_source.source_id, NULL), COALESCE(v_source.version, NULL), COALESCE(v_source.status, 'MISSING'), 'ACTIVE');
    END IF;

    UPDATE private.device_reactivation_requests
    SET status = 'EXPIRED'
    WHERE device_id = p_device_id
      AND status = 'PENDING'
      AND expires_at <= NOW();

    SELECT * INTO v_existing
    FROM private.device_reactivation_requests
    WHERE device_id = p_device_id
      AND status = 'PENDING'
      AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1
    FOR UPDATE;
    IF FOUND THEN
        IF lower(v_existing.new_device_token_hash) = lower(p_new_device_token_hash) THEN
            RETURN private.reactivation_result(true, 'REQUEST_ALREADY_PENDING', v_existing.request_id, p_device_id, v_device.status, v_license.status, v_license.mode, v_source.source_id, v_source.version, v_source.status, 'ACTIVE');
        END IF;
        RETURN private.reactivation_result(false, 'REQUEST_ALREADY_PENDING', NULL, p_device_id, v_device.status, v_license.status, v_license.mode, v_source.source_id, v_source.version, v_source.status, 'ACTIVE');
    END IF;

    INSERT INTO private.device_reactivation_requests (
        device_id, new_device_token_hash, display_code, device_type, device_label
    )
    VALUES (
        p_device_id, lower(p_new_device_token_hash), p_display_code, p_device_type, btrim(p_device_label)
    )
    RETURNING request_id INTO v_request_id;

    RETURN private.reactivation_result(true, 'REQUEST_CREATED', v_request_id, p_device_id, v_device.status, v_license.status, v_license.mode, v_source.source_id, v_source.version, v_source.status, 'ACTIVE');
EXCEPTION
    WHEN unique_violation THEN
        RETURN private.reactivation_result(false, 'REQUEST_ALREADY_PENDING', NULL, p_device_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_manager_list_device_reactivation_requests()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
BEGIN
    PERFORM private.require_active_manager();

    UPDATE private.device_reactivation_requests
    SET status = 'EXPIRED'
    WHERE status IN ('PENDING', 'APPROVED')
      AND expires_at <= NOW();

    RETURN COALESCE(
        (SELECT jsonb_agg(jsonb_build_object(
            'requestId', r.request_id,
            'deviceId', r.device_id,
            'displayCode', r.display_code,
            'deviceType', r.device_type,
            'deviceLabel', r.device_label,
            'status', r.status,
            'createdAtIso', r.created_at,
            'expiresAtIso', r.expires_at
        ) ORDER BY r.created_at)
        FROM private.device_reactivation_requests r
        WHERE r.status IN ('PENDING', 'APPROVED')
          AND r.expires_at > NOW()),
        '[]'::JSONB
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_manager_approve_device_reactivation(
    p_request_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
DECLARE
    v_manager_id UUID;
    v_request private.device_reactivation_requests%ROWTYPE;
    v_device public.devices%ROWTYPE;
    v_license_device public.license_devices%ROWTYPE;
    v_license public.licenses%ROWTYPE;
    v_binding public.device_source_bindings%ROWTYPE;
    v_source public.managed_sources%ROWTYPE;
BEGIN
    v_manager_id := private.require_active_manager();

    SELECT * INTO v_request
    FROM private.device_reactivation_requests
    WHERE request_id = p_request_id
    FOR UPDATE;
    IF NOT FOUND THEN
        RETURN private.reactivation_result(false, 'REQUEST_NOT_FOUND', p_request_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
    END IF;
    IF v_request.status = 'CONSUMED' THEN
        RETURN private.reactivation_result(false, 'REQUEST_ALREADY_CONSUMED', p_request_id, v_request.device_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
    END IF;
    IF v_request.expires_at <= NOW() THEN
        UPDATE private.device_reactivation_requests SET status = 'EXPIRED' WHERE request_id = p_request_id;
        RETURN private.reactivation_result(false, 'REQUEST_EXPIRED', p_request_id, v_request.device_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
    END IF;
    IF v_request.status = 'APPROVED' THEN
        RETURN private.reactivation_result(true, 'REQUEST_APPROVED', p_request_id, v_request.device_id, 'AUTHORIZED', 'ACTIVE', 'MANAGED', NULL, NULL, NULL, 'ACTIVE');
    END IF;

    SELECT * INTO v_device FROM public.devices WHERE device_id = v_request.device_id FOR UPDATE;
    IF NOT FOUND OR v_device.status <> 'AUTHORIZED' THEN
        RETURN private.reactivation_result(false, 'DEVICE_NOT_AUTHORIZED', p_request_id, v_request.device_id, COALESCE(v_device.status, 'MISSING'), NULL, NULL, NULL, NULL, NULL, NULL);
    END IF;

    SELECT ld.* INTO v_license_device
    FROM public.license_devices ld
    WHERE ld.device_id = v_request.device_id AND ld.status = 'ACTIVE'
    ORDER BY ld.bound_at DESC LIMIT 1 FOR UPDATE;
    IF NOT FOUND THEN
        RETURN private.reactivation_result(false, 'LICENSE_NOT_ACTIVE', p_request_id, v_request.device_id, v_device.status, NULL, NULL, NULL, NULL, NULL, NULL);
    END IF;
    SELECT l.* INTO v_license FROM public.licenses l WHERE l.id = v_license_device.license_id FOR UPDATE;
    IF NOT FOUND OR v_license.status <> 'ACTIVE'
       OR (v_license.expires_at IS NOT NULL AND v_license.expires_at <= NOW()) THEN
        RETURN private.reactivation_result(false, 'LICENSE_NOT_ACTIVE', p_request_id, v_request.device_id, v_device.status, COALESCE(v_license.status, 'MISSING'), COALESCE(v_license.mode, 'UNKNOWN'), NULL, NULL, NULL, NULL);
    END IF;
    IF v_license.mode <> 'MANAGED' THEN
        RETURN private.reactivation_result(false, 'LICENSE_MODE_INVALID', p_request_id, v_request.device_id, v_device.status, v_license.status, v_license.mode, NULL, NULL, NULL, NULL);
    END IF;
    SELECT dsb.* INTO v_binding FROM public.device_source_bindings dsb WHERE dsb.device_id = v_request.device_id AND dsb.license_id = v_license.id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN private.reactivation_result(false, 'SOURCE_BINDING_NOT_FOUND', p_request_id, v_request.device_id, v_device.status, v_license.status, v_license.mode, NULL, NULL, NULL, NULL);
    END IF;
    SELECT ms.* INTO v_source FROM public.managed_sources ms WHERE ms.id = v_binding.source_id FOR UPDATE;
    IF NOT FOUND OR v_source.status <> 'ACTIVE' THEN
        RETURN private.reactivation_result(false, 'SOURCE_NOT_ACTIVE', p_request_id, v_request.device_id, v_device.status, v_license.status, v_license.mode, COALESCE(v_source.source_id, NULL), COALESCE(v_source.version, NULL), COALESCE(v_source.status, 'MISSING'), 'ACTIVE');
    END IF;

    UPDATE private.device_reactivation_requests
    SET status = 'APPROVED', approved_at = NOW(), approved_by = v_manager_id
    WHERE request_id = p_request_id;

    RETURN private.reactivation_result(true, 'REQUEST_APPROVED', p_request_id, v_request.device_id, v_device.status, v_license.status, v_license.mode, v_source.source_id, v_source.version, v_source.status, 'ACTIVE');
EXCEPTION
    WHEN unique_violation THEN
        RETURN private.reactivation_result(false, 'REQUEST_ALREADY_PENDING', p_request_id, v_request.device_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_finalize_authorized_device_reactivation(
    p_request_id UUID,
    p_device_id VARCHAR(64)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
DECLARE
    v_request private.device_reactivation_requests%ROWTYPE;
    v_device public.devices%ROWTYPE;
    v_license_device public.license_devices%ROWTYPE;
    v_license public.licenses%ROWTYPE;
    v_binding public.device_source_bindings%ROWTYPE;
    v_source public.managed_sources%ROWTYPE;
BEGIN
    IF p_device_id IS NULL OR p_device_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        RETURN private.reactivation_result(false, 'INVALID_DEVICE_ID', p_request_id, p_device_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
    END IF;

    SELECT * INTO v_request FROM private.device_reactivation_requests WHERE request_id = p_request_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN private.reactivation_result(false, 'REQUEST_NOT_FOUND', p_request_id, p_device_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
    END IF;
    IF v_request.device_id <> p_device_id THEN
        RETURN private.reactivation_result(false, 'REQUEST_DEVICE_MISMATCH', p_request_id, p_device_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
    END IF;
    IF v_request.status = 'CONSUMED' THEN
        RETURN private.reactivation_result(false, 'REQUEST_ALREADY_CONSUMED', p_request_id, p_device_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
    END IF;
    IF v_request.expires_at <= NOW() THEN
        UPDATE private.device_reactivation_requests SET status = 'EXPIRED' WHERE request_id = p_request_id;
        RETURN private.reactivation_result(false, 'REQUEST_EXPIRED', p_request_id, p_device_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
    END IF;
    IF v_request.status <> 'APPROVED' THEN
        RETURN private.reactivation_result(false, 'REQUEST_NOT_APPROVED', p_request_id, p_device_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
    END IF;

    SELECT * INTO v_device FROM public.devices WHERE device_id = p_device_id FOR UPDATE;
    IF NOT FOUND OR v_device.status <> 'AUTHORIZED' THEN
        RETURN private.reactivation_result(false, 'DEVICE_NOT_AUTHORIZED', p_request_id, p_device_id, COALESCE(v_device.status, 'MISSING'), NULL, NULL, NULL, NULL, NULL, NULL);
    END IF;
    SELECT ld.* INTO v_license_device FROM public.license_devices ld WHERE ld.device_id = p_device_id AND ld.status = 'ACTIVE' ORDER BY ld.bound_at DESC LIMIT 1 FOR UPDATE;
    IF NOT FOUND THEN
        RETURN private.reactivation_result(false, 'LICENSE_NOT_ACTIVE', p_request_id, p_device_id, v_device.status, NULL, NULL, NULL, NULL, NULL, NULL);
    END IF;
    SELECT l.* INTO v_license FROM public.licenses l WHERE l.id = v_license_device.license_id FOR UPDATE;
    IF NOT FOUND OR v_license.status <> 'ACTIVE'
       OR (v_license.expires_at IS NOT NULL AND v_license.expires_at <= NOW()) THEN
        RETURN private.reactivation_result(false, 'LICENSE_NOT_ACTIVE', p_request_id, p_device_id, v_device.status, COALESCE(v_license.status, 'MISSING'), COALESCE(v_license.mode, 'UNKNOWN'), NULL, NULL, NULL, NULL);
    END IF;
    IF v_license.mode <> 'MANAGED' THEN
        RETURN private.reactivation_result(false, 'LICENSE_MODE_INVALID', p_request_id, p_device_id, v_device.status, v_license.status, v_license.mode, NULL, NULL, NULL, NULL);
    END IF;
    SELECT dsb.* INTO v_binding FROM public.device_source_bindings dsb WHERE dsb.device_id = p_device_id AND dsb.license_id = v_license.id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN private.reactivation_result(false, 'SOURCE_BINDING_NOT_FOUND', p_request_id, p_device_id, v_device.status, v_license.status, v_license.mode, NULL, NULL, NULL, NULL);
    END IF;
    SELECT ms.* INTO v_source FROM public.managed_sources ms WHERE ms.id = v_binding.source_id FOR UPDATE;
    IF NOT FOUND OR v_source.status <> 'ACTIVE' THEN
        RETURN private.reactivation_result(false, 'SOURCE_NOT_ACTIVE', p_request_id, p_device_id, v_device.status, v_license.status, v_license.mode, COALESCE(v_source.source_id, NULL), COALESCE(v_source.version, NULL), COALESCE(v_source.status, 'MISSING'), 'ACTIVE');
    END IF;

    UPDATE public.devices
    SET device_token_hash = lower(v_request.new_device_token_hash),
        last_seen_at = NOW()
    WHERE device_id = p_device_id;

    UPDATE private.device_reactivation_requests
    SET status = 'CONSUMED', consumed_at = NOW()
    WHERE request_id = p_request_id;

    RETURN private.reactivation_result(true, 'AUTHORIZED_DEVICE_REACTIVATED', p_request_id, p_device_id, v_device.status, v_license.status, v_license.mode, v_source.source_id, v_source.version, v_source.status, 'ACTIVE');
EXCEPTION
    WHEN unique_violation THEN
        RETURN private.reactivation_result(false, 'REACTIVATION_CONFLICT', p_request_id, p_device_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_request_authorized_device_reactivation(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_request_authorized_device_reactivation(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.rpc_finalize_authorized_device_reactivation(UUID, VARCHAR) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_finalize_authorized_device_reactivation(UUID, VARCHAR) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.rpc_manager_list_device_reactivation_requests() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_manager_list_device_reactivation_requests() TO authenticated;

REVOKE ALL ON FUNCTION public.rpc_manager_approve_device_reactivation(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_manager_approve_device_reactivation(UUID) TO authenticated;
