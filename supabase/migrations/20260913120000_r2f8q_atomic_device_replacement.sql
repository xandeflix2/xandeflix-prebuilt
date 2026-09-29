-- Xandeflix Prebuilt - R2F8Q atomic managed-device replacement
--
-- Local contract only in this gate. The RPC deliberately receives only the
-- new token hash; the raw token is generated and retained by the client.
-- The old device and its source binding are replaced in one transaction.

CREATE OR REPLACE FUNCTION public.rpc_manager_replace_device_atomic(
    p_old_device_id VARCHAR(64),
    p_new_device_id VARCHAR(64),
    p_new_device_token_hash VARCHAR(64),
    p_new_display_code VARCHAR(32),
    p_new_device_type VARCHAR(20),
    p_new_device_label VARCHAR(100)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
DECLARE
    v_old_device public.devices%ROWTYPE;
    v_new_device public.devices%ROWTYPE;
    v_license_device public.license_devices%ROWTYPE;
    v_license public.licenses%ROWTYPE;
    v_source_binding public.device_source_bindings%ROWTYPE;
    v_source public.managed_sources%ROWTYPE;
    v_active_device_count INTEGER;
BEGIN
    PERFORM private.require_active_manager();

    IF p_old_device_id IS NULL OR btrim(p_old_device_id) = ''
       OR p_new_device_id IS NULL OR btrim(p_new_device_id) = '' THEN
        RETURN jsonb_build_object('success', false, 'result_code', 'INVALID_DEVICE_ID');
    END IF;

    IF p_old_device_id = p_new_device_id THEN
        RETURN jsonb_build_object('success', false, 'result_code', 'NEW_DEVICE_CONFLICT');
    END IF;

    IF p_new_device_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        RETURN jsonb_build_object('success', false, 'result_code', 'INVALID_DEVICE_ID');
    END IF;

    IF p_new_device_token_hash IS NULL
       OR p_new_device_token_hash !~ '^[0-9a-fA-F]{64}$' THEN
        RETURN jsonb_build_object('success', false, 'result_code', 'TOKEN_HASH_INVALID');
    END IF;

    IF p_new_display_code IS NULL
       OR p_new_display_code !~* '^XF-[A-Z0-9]{4}-[A-Z0-9]{4}$' THEN
        RETURN jsonb_build_object('success', false, 'result_code', 'INVALID_DEVICE_METADATA');
    END IF;

    IF p_new_device_type IS NULL
       OR p_new_device_type NOT IN ('TV', 'PHONE', 'TABLET', 'PC', 'OTHER') THEN
        RETURN jsonb_build_object('success', false, 'result_code', 'INVALID_DEVICE_METADATA');
    END IF;

    IF p_new_device_label IS NULL OR btrim(p_new_device_label) = '' THEN
        RETURN jsonb_build_object('success', false, 'result_code', 'INVALID_DEVICE_METADATA');
    END IF;

    -- Lock existing device rows in lexical order so concurrent replacements
    -- cannot acquire the two device locks in opposite order.
    PERFORM d.device_id
    FROM public.devices d
    WHERE d.device_id IN (p_old_device_id, p_new_device_id)
    ORDER BY d.device_id
    FOR UPDATE;

    SELECT * INTO v_old_device
    FROM public.devices
    WHERE device_id = p_old_device_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'result_code', 'OLD_DEVICE_NOT_FOUND');
    END IF;

    IF v_old_device.status = 'REVOKED' THEN
        RETURN jsonb_build_object('success', false, 'result_code', 'OLD_DEVICE_REVOKED');
    END IF;

    IF v_old_device.status <> 'AUTHORIZED' THEN
        RETURN jsonb_build_object('success', false, 'result_code', 'OLD_DEVICE_NOT_AUTHORIZED');
    END IF;

    -- The active license row is locked before any relationship is changed.
    SELECT ld.*
    INTO v_license_device
    FROM public.license_devices ld
    WHERE ld.device_id = p_old_device_id
      AND ld.status = 'ACTIVE'
    ORDER BY ld.id
    LIMIT 1
    FOR UPDATE;

    IF FOUND THEN
        SELECT l.*
        INTO v_license
        FROM public.licenses l
        WHERE l.id = v_license_device.license_id
        FOR UPDATE;
    END IF;

    IF NOT FOUND OR v_license.status <> 'ACTIVE'
       OR (v_license.expires_at IS NOT NULL AND v_license.expires_at < NOW()) THEN
        RETURN jsonb_build_object('success', false, 'result_code', 'LICENSE_INVALID');
    END IF;

    IF v_license.mode <> 'MANAGED' THEN
        RETURN jsonb_build_object('success', false, 'result_code', 'LICENSE_MODE_INVALID');
    END IF;

    SELECT dsb.*
    INTO v_source_binding
    FROM public.device_source_bindings dsb
    WHERE dsb.device_id = p_old_device_id
      AND dsb.license_id = v_license.id
    LIMIT 1
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'result_code', 'SOURCE_BINDING_INVALID');
    END IF;

    SELECT * INTO v_source
    FROM public.managed_sources
    WHERE id = v_source_binding.source_id
    FOR UPDATE;

    IF NOT FOUND OR v_source.status <> 'ACTIVE' THEN
        RETURN jsonb_build_object('success', false, 'result_code', 'SOURCE_INVALID');
    END IF;

    SELECT * INTO v_new_device
    FROM public.devices
    WHERE device_id = p_new_device_id;

    IF FOUND AND v_new_device.status <> 'UNREGISTERED' THEN
        RETURN jsonb_build_object('success', false, 'result_code', 'NEW_DEVICE_CONFLICT');
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.license_devices
        WHERE device_id = p_new_device_id
          AND status = 'ACTIVE'
    ) THEN
        RETURN jsonb_build_object('success', false, 'result_code', 'NEW_DEVICE_CONFLICT');
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.device_source_bindings
        WHERE device_id = p_new_device_id
    ) THEN
        RETURN jsonb_build_object('success', false, 'result_code', 'NEW_DEVICE_CONFLICT');
    END IF;

    SELECT COUNT(*)
    INTO v_active_device_count
    FROM public.license_devices
    WHERE license_id = v_license.id
      AND status = 'ACTIVE';

    IF v_active_device_count > v_license.max_devices THEN
        RETURN jsonb_build_object('success', false, 'result_code', 'DEVICE_REPLACEMENT_CONFLICT');
    END IF;

    -- All state changes below are part of this function transaction. If any
    -- statement fails, PostgreSQL rolls back the old and new states together.
    UPDATE public.devices
    SET status = 'REVOKED',
        device_token_hash = NULL,
        last_seen_at = NOW()
    WHERE device_id = p_old_device_id;

    INSERT INTO public.devices (
        device_id,
        display_code,
        device_type,
        device_label,
        status,
        device_token_hash,
        last_seen_at
    )
    VALUES (
        p_new_device_id,
        p_new_display_code,
        p_new_device_type,
        p_new_device_label,
        'AUTHORIZED',
        lower(p_new_device_token_hash),
        NOW()
    )
    ON CONFLICT (device_id) DO UPDATE SET
        display_code = EXCLUDED.display_code,
        device_type = EXCLUDED.device_type,
        device_label = EXCLUDED.device_label,
        status = EXCLUDED.status,
        device_token_hash = EXCLUDED.device_token_hash,
        last_seen_at = EXCLUDED.last_seen_at;

    UPDATE public.license_devices
    SET status = 'REVOKED',
        revoked_at = NOW()
    WHERE id = v_license_device.id;

    INSERT INTO public.license_devices (license_id, device_id, status, revoked_at)
    VALUES (v_license.id, p_new_device_id, 'ACTIVE', NULL)
    ON CONFLICT (license_id, device_id) DO UPDATE SET
        status = 'ACTIVE',
        revoked_at = NULL,
        bound_at = NOW();

    DELETE FROM public.device_source_bindings
    WHERE id = v_source_binding.id;

    INSERT INTO public.device_source_bindings (license_id, device_id, source_id)
    VALUES (v_license.id, p_new_device_id, v_source_binding.source_id);

    RETURN jsonb_build_object(
        'success', true,
        'result_code', 'DEVICE_REPLACEMENT_READY',
        'newDeviceId', p_new_device_id,
        'deviceStatus', 'AUTHORIZED',
        'licenseStatus', v_license.status,
        'sourceId', v_source.source_id,
        'sourceVersion', v_source.version,
        'sourceStatus', v_source.status,
        'bindingStatus', 'ACTIVE',
        'oldDeviceStatus', 'REVOKED',
        'oldBindingStatus', 'REVOKED'
    );
EXCEPTION
    WHEN unique_violation THEN
        RETURN jsonb_build_object('success', false, 'result_code', 'DEVICE_REPLACEMENT_CONFLICT');
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_manager_replace_device_atomic(
    VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_manager_replace_device_atomic(
    VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR
) TO authenticated;
