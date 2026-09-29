-- Xandeflix Prebuilt - R2F8T atomic stale reactivation expiry.
-- The request RPC expires stale PENDING/APPROVED rows before checking the
-- partial unique active-request index, in the same transaction.

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
        RETURN private.reactivation_result(false, 'INVALID_DEVICE_METADATA', NULL, p_device_id, NULL, NULL, NULL, NULL, NULL, NULL);
    END IF;

    SELECT * INTO v_device
    FROM public.devices
    WHERE device_id = p_device_id
    FOR UPDATE;
    IF NOT FOUND THEN
        RETURN private.reactivation_result(false, 'DEVICE_NOT_FOUND', NULL, p_device_id, NULL, NULL, NULL, NULL, NULL, NULL);
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

    -- This update is deliberately inside this RPC and before the active check.
    -- The device row lock above serializes same-device request creation.
    UPDATE private.device_reactivation_requests
    SET status = 'EXPIRED'
    WHERE device_id = p_device_id
      AND status IN ('PENDING', 'APPROVED')
      AND expires_at <= NOW();

    SELECT * INTO v_existing
    FROM private.device_reactivation_requests
    WHERE device_id = p_device_id
      AND status IN ('PENDING', 'APPROVED')
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
