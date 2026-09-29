-- C11: complete the authorized source metadata contract with the authoritative
-- license identity already selected by the device -> license -> source chain.
--
-- Scope is intentionally limited to this RPC. No table, row, binding, source,
-- token, key or vault payload is created or changed by this migration.

CREATE OR REPLACE FUNCTION public.rpc_resolve_authorized_source_metadata(
    p_device_id VARCHAR(64),
    p_device_token_hash VARCHAR(64)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
DECLARE
    v_device RECORD;
    v_license RECORD;
    v_binding RECORD;
    v_source RECORD;
    v_caller_uid UUID;
    v_active_license_count INTEGER;
    v_source_binding_count INTEGER;
BEGIN
    SELECT device_token_hash, status
    INTO v_device
    FROM public.devices
    WHERE device_id = p_device_id;

    IF NOT FOUND OR v_device.device_token_hash IS DISTINCT FROM p_device_token_hash THEN
        RETURN jsonb_build_object('status', 'DEVICE_NOT_AUTHORIZED');
    END IF;

    IF v_device.status = 'REVOKED' THEN
        RETURN jsonb_build_object('status', 'DEVICE_REVOKED');
    END IF;

    IF v_device.status <> 'AUTHORIZED' THEN
        RETURN jsonb_build_object('status', 'DEVICE_NOT_AUTHORIZED');
    END IF;

    -- Exactly one valid active license binding is required. No ordering or
    -- client-provided license identifier participates in this decision.
    SELECT count(*)
    INTO v_active_license_count
    FROM public.license_devices ld
    JOIN public.licenses l ON l.id = ld.license_id
    WHERE ld.device_id = p_device_id
      AND ld.status = 'ACTIVE'
      AND (
          (l.status = 'ACTIVE' AND (l.expires_at IS NULL OR l.expires_at > NOW()))
          OR
          (
              l.status = 'TRIAL'
              AND l.trial_started_at IS NOT NULL
              AND l.trial_expires_at IS NOT NULL
              AND NOW() < l.trial_expires_at
          )
      );

    IF v_active_license_count <> 1 THEN
        RETURN jsonb_build_object('status', 'LICENSE_INVALID');
    END IF;

    SELECT
        l.id,
        l.mode,
        l.status,
        l.customer_id,
        l.expires_at,
        l.trial_started_at,
        l.trial_expires_at
    INTO v_license
    FROM public.license_devices ld
    JOIN public.licenses l ON l.id = ld.license_id
    WHERE ld.device_id = p_device_id
      AND ld.status = 'ACTIVE'
      AND (
          (l.status = 'ACTIVE' AND (l.expires_at IS NULL OR l.expires_at > NOW()))
          OR
          (
              l.status = 'TRIAL'
              AND l.trial_started_at IS NOT NULL
              AND l.trial_expires_at IS NOT NULL
              AND NOW() < l.trial_expires_at
          )
      );

    IF NOT FOUND OR v_license.mode NOT IN ('MANAGED', 'SELF_SERVICE') THEN
        RETURN jsonb_build_object('status', 'LICENSE_INVALID');
    END IF;

    v_caller_uid := auth.uid();
    IF v_caller_uid IS NOT NULL
       AND v_license.customer_id IS NOT NULL
       AND v_caller_uid <> v_license.customer_id THEN
        RETURN jsonb_build_object('status', 'DEVICE_NOT_AUTHORIZED');
    END IF;

    IF v_license.mode = 'SELF_SERVICE' THEN
        SELECT source_id, source_type, version, status
        INTO v_source
        FROM public.customer_sources
        WHERE license_id = v_license.id
          AND status = 'ACTIVE'
        ORDER BY version DESC
        LIMIT 1;

        IF NOT FOUND THEN
            RETURN jsonb_build_object('status', 'SOURCE_NOT_BOUND', 'mode', 'SELF_SERVICE');
        END IF;

        RETURN jsonb_build_object(
            'status', 'SOURCE_READY',
            'mode', 'SELF_SERVICE',
            'licenseId', v_license.id,
            'licenseStatus', v_license.status,
            'sourceId', v_source.source_id,
            'sourceVersion', v_source.version,
            'protocol', v_source.source_type,
            'sourceStatus', v_source.status
        );
    END IF;

    SELECT count(*)
    INTO v_source_binding_count
    FROM public.device_source_bindings dsb
    WHERE dsb.device_id = p_device_id
      AND dsb.license_id = v_license.id;

    IF v_source_binding_count <> 1 THEN
        RETURN jsonb_build_object('status', 'SOURCE_NOT_BOUND', 'mode', v_license.mode);
    END IF;

    SELECT dsb.source_id
    INTO v_binding
    FROM public.device_source_bindings dsb
    WHERE dsb.device_id = p_device_id
      AND dsb.license_id = v_license.id;

    SELECT source_id, source_type, version, status
    INTO v_source
    FROM public.managed_sources
    WHERE id = v_binding.source_id;

    IF NOT FOUND THEN
        SELECT source_id, source_type, version, status
        INTO v_source
        FROM public.managed_sources
        WHERE source_id = v_binding.source_id::text;
    END IF;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('status', 'SOURCE_NOT_BOUND', 'mode', v_license.mode);
    END IF;

    IF v_source.status <> 'ACTIVE' THEN
        RETURN jsonb_build_object(
            'status', 'SOURCE_NOT_BOUND',
            'mode', v_license.mode,
            'sourceId', v_source.source_id,
            'sourceVersion', v_source.version,
            'protocol', v_source.source_type,
            'sourceStatus', v_source.status
        );
    END IF;

    RETURN jsonb_build_object(
        'status', 'SOURCE_READY',
        'mode', v_license.mode,
        'licenseId', v_license.id,
        'licenseStatus', v_license.status,
        'sourceId', v_source.source_id,
        'sourceVersion', v_source.version,
        'protocol', v_source.source_type,
        'sourceStatus', v_source.status
    );
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_resolve_authorized_source_metadata(VARCHAR, VARCHAR) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_resolve_authorized_source_metadata(VARCHAR, VARCHAR) TO anon, authenticated;
