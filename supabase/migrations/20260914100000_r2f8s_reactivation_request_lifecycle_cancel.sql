-- Xandeflix Prebuilt - R2F8S request lifecycle cancellation.
-- Local migration only in this cycle. Remote DDL is intentionally not applied.
-- Cancellation is an auditable Manager action and never changes entitlement state.

ALTER TABLE private.device_reactivation_requests
    DROP CONSTRAINT IF EXISTS device_reactivation_requests_status_check;

ALTER TABLE private.device_reactivation_requests
    DROP CONSTRAINT IF EXISTS chk_reactivation_status;

ALTER TABLE private.device_reactivation_requests
    ADD CONSTRAINT chk_reactivation_status
    CHECK (status IN ('PENDING', 'APPROVED', 'CANCELLED', 'CONSUMED', 'EXPIRED'));

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
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'requestId', r.request_id,
                    'deviceId', r.device_id,
                    'displayCode', r.display_code,
                    'deviceType', r.device_type,
                    'deviceLabel', r.device_label,
                    'status', r.status,
                    'createdAtIso', r.created_at,
                    'expiresAtIso', r.expires_at
                )
                ORDER BY r.created_at
            )
            FROM private.device_reactivation_requests r
        ),
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
    IF v_request.status = 'CANCELLED' THEN
        RETURN private.reactivation_result(false, 'REQUEST_CANCELLED', p_request_id, v_request.device_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
    END IF;
    IF v_request.status = 'CONSUMED' THEN
        RETURN private.reactivation_result(false, 'REQUEST_ALREADY_CONSUMED', p_request_id, v_request.device_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
    END IF;
    IF v_request.expires_at <= NOW() THEN
        UPDATE private.device_reactivation_requests SET status = 'EXPIRED' WHERE request_id = p_request_id;
        RETURN private.reactivation_result(false, 'REQUEST_EXPIRED', p_request_id, v_request.device_id, NULL, NULL, NULL, NULL, NULL, NULL);
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
    SELECT dsb.* INTO v_binding
    FROM public.device_source_bindings dsb
    WHERE dsb.device_id = v_request.device_id AND dsb.license_id = v_license.id
    FOR UPDATE;
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

CREATE OR REPLACE FUNCTION public.rpc_manager_cancel_device_reactivation(
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
BEGIN
    v_manager_id := private.require_active_manager();

    SELECT * INTO v_request
    FROM private.device_reactivation_requests
    WHERE request_id = p_request_id
    FOR UPDATE;
    IF NOT FOUND THEN
        RETURN private.reactivation_result(false, 'REQUEST_NOT_FOUND', p_request_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
    END IF;
    IF v_request.status = 'CANCELLED' THEN
        RETURN private.reactivation_result(true, 'REQUEST_ALREADY_CANCELLED', p_request_id, v_request.device_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
    END IF;
    IF v_request.status = 'CONSUMED' THEN
        RETURN private.reactivation_result(false, 'REQUEST_ALREADY_CONSUMED', p_request_id, v_request.device_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
    END IF;
    IF v_request.status = 'EXPIRED' OR v_request.expires_at <= NOW() THEN
        UPDATE private.device_reactivation_requests SET status = 'EXPIRED' WHERE request_id = p_request_id;
        RETURN private.reactivation_result(false, 'REQUEST_EXPIRED', p_request_id, v_request.device_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
    END IF;
    IF v_request.status NOT IN ('PENDING', 'APPROVED') THEN
        RETURN private.reactivation_result(false, 'REQUEST_ALREADY_TERMINAL', p_request_id, v_request.device_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
    END IF;

    SELECT * INTO v_device
    FROM public.devices
    WHERE device_id = v_request.device_id
    FOR UPDATE;
    IF NOT FOUND OR v_device.status <> 'AUTHORIZED' THEN
        RETURN private.reactivation_result(false, 'DEVICE_NOT_AUTHORIZED', p_request_id, v_request.device_id, COALESCE(v_device.status, 'MISSING'), NULL, NULL, NULL, NULL, NULL);
    END IF;

    UPDATE private.device_reactivation_requests
    SET status = 'CANCELLED'
    WHERE request_id = p_request_id;

    RETURN private.reactivation_result(true, 'REQUEST_CANCELLED', p_request_id, v_request.device_id, v_device.status, NULL, NULL, NULL, NULL, NULL, NULL);
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
        RETURN private.reactivation_result(false, 'REQUEST_NOT_FOUND', p_request_id, p_device_id, NULL, NULL, NULL, NULL, NULL, NULL);
    END IF;
    IF v_request.device_id <> p_device_id THEN
        RETURN private.reactivation_result(false, 'REQUEST_DEVICE_MISMATCH', p_request_id, p_device_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
    END IF;
    IF v_request.status = 'CANCELLED' THEN
        RETURN private.reactivation_result(false, 'REQUEST_CANCELLED', p_request_id, p_device_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
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
    SET device_token_hash = lower(v_request.new_device_token_hash), last_seen_at = NOW()
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

REVOKE ALL ON FUNCTION public.rpc_manager_cancel_device_reactivation(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_manager_cancel_device_reactivation(UUID) TO authenticated;
