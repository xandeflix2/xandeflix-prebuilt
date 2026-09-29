-- =============================================================================
-- Xandeflix Prebuilt - R2E-B2 metadata-only remote contract
--
-- Migration aditiva/transicional. A migration deve ser aplicada remotamente
-- somente no gate R2E-B3. Nenhuma linha legada e alterada ou removida aqui.
--
-- Boundary:
--   * novas RPCs recebem e retornam somente metadados de autorizacao;
--   * encrypted_payload/iv/auth_tag continuam fisicamente preservados para o
--     legado, mas nao podem ser preenchidos por novas RPCs;
--   * o binding continua usando managed_sources.id (UUID) como FK e source_id
--     como identidade opaca externa.
-- =============================================================================

-- Permite novas linhas metadata-only sem nulificar nenhum valor legado.
ALTER TABLE public.managed_sources
    ALTER COLUMN encrypted_payload DROP NOT NULL,
    ALTER COLUMN iv DROP NOT NULL,
    ALTER COLUMN auth_tag DROP NOT NULL;

CREATE OR REPLACE FUNCTION private.manager_source_metadata(p_internal_id UUID)
RETURNS JSONB
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
    SELECT jsonb_build_object(
        'id', ms.source_id,
        'sourceId', ms.source_id,
        'name', ms.name,
        'sourceType', ms.source_type,
        'version', ms.version,
        'status', ms.status,
        'createdAtIso', ms.created_at,
        'updatedAtIso', ms.updated_at
    )
    FROM public.managed_sources ms
    WHERE ms.id = p_internal_id;
$$;

REVOKE ALL ON FUNCTION private.manager_source_metadata(UUID) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.rpc_manager_read_control_plane_metadata()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
BEGIN
    PERFORM private.require_active_manager();

    RETURN jsonb_build_object(
        'licenses', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'id', l.id,
                'licenseKeyHash', l.license_key_hash,
                'mode', l.mode,
                'status', l.status,
                'maxDevices', l.max_devices,
                'createdAtIso', l.created_at,
                'expiresAtIso', l.expires_at
            ) ORDER BY l.created_at)
            FROM public.licenses l
        ), '[]'::JSONB),
        'devices', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'id', d.id,
                'deviceId', d.device_id,
                'displayCode', d.display_code,
                'deviceType', d.device_type,
                'deviceLabel', d.device_label,
                'status', d.status,
                'createdAtIso', d.created_at,
                'lastSeenAtIso', d.last_seen_at
            ) ORDER BY d.created_at)
            FROM public.devices d
        ), '[]'::JSONB),
        'licenseBindings', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'id', ld.id,
                'licenseId', ld.license_id,
                'deviceId', ld.device_id,
                'status', ld.status,
                'boundAtIso', ld.bound_at,
                'revokedAtIso', ld.revoked_at
            ) ORDER BY ld.bound_at)
            FROM public.license_devices ld
        ), '[]'::JSONB),
        'managedSources', COALESCE((
            SELECT jsonb_agg(private.manager_source_metadata(ms.id) ORDER BY ms.created_at)
            FROM public.managed_sources ms
        ), '[]'::JSONB),
        'sourceBindings', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'id', dsb.id,
                'licenseId', dsb.license_id,
                'deviceId', dsb.device_id,
                'sourceId', ms.source_id,
                'createdAtIso', dsb.created_at
            ) ORDER BY dsb.created_at)
            FROM public.device_source_bindings dsb
            JOIN public.managed_sources ms ON ms.id = dsb.source_id
        ), '[]'::JSONB)
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_manager_create_managed_source_metadata(
    p_source_id TEXT,
    p_name TEXT,
    p_source_type TEXT,
    p_source_version INTEGER DEFAULT 1,
    p_status TEXT DEFAULT 'ACTIVE'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
DECLARE
    v_internal_id UUID;
BEGIN
    PERFORM private.require_active_manager();

    IF p_source_id IS NULL OR p_source_id !~ '^src_[a-z0-9]+$' THEN
        RAISE EXCEPTION 'INVALID_CANONICAL_SOURCE_ID' USING ERRCODE = '22023';
    END IF;
    IF p_name IS NULL OR btrim(p_name) = '' THEN
        RAISE EXCEPTION 'INVALID_SOURCE_NAME' USING ERRCODE = '22023';
    END IF;
    IF p_source_type IS NULL OR p_source_type NOT IN ('XTREAM', 'M3U') THEN
        RAISE EXCEPTION 'INVALID_SOURCE_PROTOCOL' USING ERRCODE = '22023';
    END IF;
    IF p_source_version IS NULL OR p_source_version < 1 THEN
        RAISE EXCEPTION 'INVALID_SOURCE_VERSION' USING ERRCODE = '22023';
    END IF;
    IF p_status IS NULL OR p_status NOT IN ('ACTIVE', 'DISABLED') THEN
        RAISE EXCEPTION 'INVALID_SOURCE_STATUS' USING ERRCODE = '22023';
    END IF;

    INSERT INTO public.managed_sources (
        source_id,
        name,
        source_type,
        version,
        status
    )
    VALUES (
        p_source_id,
        btrim(p_name),
        p_source_type,
        p_source_version,
        p_status
    )
    RETURNING id INTO v_internal_id;

    RETURN jsonb_build_object(
        'success', true,
        'source', private.manager_source_metadata(v_internal_id)
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_manager_update_managed_source_metadata(
    p_source_id TEXT,
    p_expected_version INTEGER,
    p_name TEXT DEFAULT NULL,
    p_source_type TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
DECLARE
    v_source RECORD;
    v_internal_id UUID;
BEGIN
    PERFORM private.require_active_manager();

    IF p_expected_version IS NULL OR p_expected_version < 1 THEN
        RAISE EXCEPTION 'INVALID_EXPECTED_VERSION' USING ERRCODE = '22023';
    END IF;
    IF p_name IS NOT NULL AND btrim(p_name) = '' THEN
        RAISE EXCEPTION 'INVALID_SOURCE_NAME' USING ERRCODE = '22023';
    END IF;
    IF p_source_type IS NOT NULL AND p_source_type NOT IN ('XTREAM', 'M3U') THEN
        RAISE EXCEPTION 'INVALID_SOURCE_PROTOCOL' USING ERRCODE = '22023';
    END IF;

    SELECT id, name, source_type, version
    INTO v_source
    FROM public.managed_sources
    WHERE source_id = p_source_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'SOURCE_NOT_FOUND' USING ERRCODE = 'P0002';
    END IF;
    IF v_source.version <> p_expected_version THEN
        RAISE EXCEPTION 'VERSION_CONFLICT' USING ERRCODE = '40001';
    END IF;
    IF (p_name IS NULL OR btrim(p_name) = v_source.name)
       AND (p_source_type IS NULL OR p_source_type = v_source.source_type) THEN
        RAISE EXCEPTION 'NO_SOURCE_CHANGE' USING ERRCODE = '22023';
    END IF;

    UPDATE public.managed_sources
    SET name = COALESCE(NULLIF(btrim(p_name), ''), name),
        source_type = COALESCE(p_source_type, source_type),
        version = v_source.version + 1,
        updated_at = NOW()
    WHERE id = v_source.id
    RETURNING id INTO v_internal_id;

    RETURN jsonb_build_object(
        'success', true,
        'source', private.manager_source_metadata(v_internal_id)
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_manager_set_managed_source_status_metadata(
    p_source_id TEXT,
    p_status TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
DECLARE
    v_internal_id UUID;
BEGIN
    PERFORM private.require_active_manager();

    IF p_status IS NULL OR p_status NOT IN ('ACTIVE', 'DISABLED') THEN
        RAISE EXCEPTION 'INVALID_SOURCE_STATUS' USING ERRCODE = '22023';
    END IF;

    UPDATE public.managed_sources
    SET status = p_status,
        updated_at = NOW()
    WHERE source_id = p_source_id
    RETURNING id INTO v_internal_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'SOURCE_NOT_FOUND' USING ERRCODE = 'P0002';
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'source', private.manager_source_metadata(v_internal_id)
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_manager_bind_device_source_metadata(
    p_license_id UUID,
    p_device_id TEXT,
    p_source_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
DECLARE
    v_license RECORD;
    v_device RECORD;
    v_source RECORD;
    v_existing RECORD;
BEGIN
    PERFORM private.require_active_manager();

    SELECT id, status INTO v_license
    FROM public.licenses
    WHERE id = p_license_id
    FOR UPDATE;
    IF NOT FOUND OR v_license.status <> 'ACTIVE' THEN
        RAISE EXCEPTION 'LICENSE_NOT_ACTIVE' USING ERRCODE = 'P0002';
    END IF;

    SELECT device_id, status INTO v_device
    FROM public.devices
    WHERE device_id = p_device_id;
    IF NOT FOUND OR v_device.status <> 'AUTHORIZED' THEN
        RAISE EXCEPTION 'DEVICE_NOT_AUTHORIZED' USING ERRCODE = '42501';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.license_devices
        WHERE license_id = p_license_id
          AND device_id = p_device_id
          AND status = 'ACTIVE'
    ) THEN
        RAISE EXCEPTION 'CROSS_CUSTOMER_BINDING_DENIED' USING ERRCODE = '42501';
    END IF;

    SELECT id, source_id, status INTO v_source
    FROM public.managed_sources
    WHERE source_id = p_source_id;
    IF NOT FOUND OR v_source.status <> 'ACTIVE' THEN
        RAISE EXCEPTION 'SOURCE_NOT_ACTIVE' USING ERRCODE = 'P0002';
    END IF;

    SELECT id, source_id INTO v_existing
    FROM public.device_source_bindings
    WHERE device_id = p_device_id
    FOR UPDATE;
    IF FOUND THEN
        IF v_existing.source_id = v_source.id THEN
            RETURN jsonb_build_object(
                'success', true,
                'deviceId', p_device_id,
                'sourceId', p_source_id,
                'previousSourceId', p_source_id,
                'newSourceId', p_source_id
            );
        END IF;
        RAISE EXCEPTION 'DEVICE_ALREADY_BOUND_USE_SWITCH' USING ERRCODE = '23505';
    END IF;

    INSERT INTO public.device_source_bindings (license_id, device_id, source_id)
    VALUES (p_license_id, p_device_id, v_source.id);

    RETURN jsonb_build_object(
        'success', true,
        'deviceId', p_device_id,
        'sourceId', p_source_id
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_manager_switch_device_source_metadata(
    p_device_id TEXT,
    p_source_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
DECLARE
    v_device RECORD;
    v_binding RECORD;
    v_old_source RECORD;
    v_new_source RECORD;
BEGIN
    PERFORM private.require_active_manager();

    SELECT device_id, status INTO v_device
    FROM public.devices
    WHERE device_id = p_device_id;
    IF NOT FOUND OR v_device.status <> 'AUTHORIZED' THEN
        RAISE EXCEPTION 'DEVICE_NOT_AUTHORIZED' USING ERRCODE = '42501';
    END IF;

    SELECT id, source_id INTO v_binding
    FROM public.device_source_bindings
    WHERE device_id = p_device_id
    FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'BINDING_NOT_FOUND' USING ERRCODE = 'P0002';
    END IF;

    SELECT id, source_id INTO v_old_source
    FROM public.managed_sources
    WHERE id = v_binding.source_id;

    SELECT id, source_id, status INTO v_new_source
    FROM public.managed_sources
    WHERE source_id = p_source_id;
    IF NOT FOUND OR v_new_source.status <> 'ACTIVE' THEN
        RAISE EXCEPTION 'SOURCE_NOT_ACTIVE' USING ERRCODE = 'P0002';
    END IF;

    IF v_old_source.id <> v_new_source.id THEN
        UPDATE public.device_source_bindings
        SET source_id = v_new_source.id
        WHERE id = v_binding.id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'deviceId', p_device_id,
        'previousSourceId', v_old_source.source_id,
        'newSourceId', v_new_source.source_id
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_manager_unbind_device_source_metadata(
    p_device_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
DECLARE
    v_binding_id UUID;
BEGIN
    PERFORM private.require_active_manager();

    DELETE FROM public.device_source_bindings
    WHERE device_id = p_device_id
    RETURNING id INTO v_binding_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'BINDING_NOT_FOUND' USING ERRCODE = 'P0002';
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'deviceId', p_device_id
    );
END;
$$;

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

    SELECT l.id, l.mode
    INTO v_license
    FROM public.license_devices ld
    JOIN public.licenses l ON l.id = ld.license_id
    WHERE ld.device_id = p_device_id
      AND ld.status = 'ACTIVE'
      AND l.status = 'ACTIVE'
      AND (l.expires_at IS NULL OR l.expires_at >= NOW())
    ORDER BY ld.bound_at DESC
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('status', 'LICENSE_INVALID');
    END IF;
    IF v_license.mode = 'SELF_SERVICE' THEN
        RETURN jsonb_build_object(
            'status', 'SOURCE_READY',
            'mode', 'SELF_SERVICE'
        );
    END IF;

    SELECT dsb.source_id
    INTO v_binding
    FROM public.device_source_bindings dsb
    WHERE dsb.device_id = p_device_id
      AND dsb.license_id = v_license.id
    LIMIT 1;
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'status', 'SOURCE_NOT_BOUND',
            'mode', 'MANAGED'
        );
    END IF;

    SELECT source_id, source_type, version, status
    INTO v_source
    FROM public.managed_sources
    WHERE id = v_binding.source_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'status', 'SOURCE_NOT_BOUND',
            'mode', 'MANAGED'
        );
    END IF;
    IF v_source.status <> 'ACTIVE' THEN
        RETURN jsonb_build_object(
            'status', 'SOURCE_NOT_BOUND',
            'mode', 'MANAGED',
            'sourceId', v_source.source_id,
            'sourceVersion', v_source.version,
            'protocol', v_source.source_type,
            'sourceStatus', v_source.status
        );
    END IF;

    RETURN jsonb_build_object(
        'status', 'SOURCE_READY',
        'mode', 'MANAGED',
        'sourceId', v_source.source_id,
        'sourceVersion', v_source.version,
        'protocol', v_source.source_type,
        'sourceStatus', v_source.status
    );
END;
$$;

-- Congela as RPCs anteriores que aceitavam ou retornavam o envelope legado.
-- As funcoes nao sao removidas; os dados existentes permanecem recuperaveis
-- para o ciclo posterior de purge seguro.
REVOKE ALL ON FUNCTION public.rpc_manager_read_control_plane() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.rpc_manager_create_managed_source(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.rpc_manager_update_managed_source(TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.rpc_manager_set_managed_source_status(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.rpc_manager_bind_device_source(UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.rpc_manager_switch_device_source(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.rpc_manager_unbind_device_source(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.rpc_resolve_authorized_source(VARCHAR, VARCHAR) FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.rpc_manager_read_control_plane_metadata() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_manager_read_control_plane_metadata() TO authenticated;

REVOKE ALL ON FUNCTION public.rpc_manager_create_managed_source_metadata(TEXT, TEXT, TEXT, INTEGER, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_manager_create_managed_source_metadata(TEXT, TEXT, TEXT, INTEGER, TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.rpc_manager_update_managed_source_metadata(TEXT, INTEGER, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_manager_update_managed_source_metadata(TEXT, INTEGER, TEXT, TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.rpc_manager_set_managed_source_status_metadata(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_manager_set_managed_source_status_metadata(TEXT, TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.rpc_manager_bind_device_source_metadata(UUID, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_manager_bind_device_source_metadata(UUID, TEXT, TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.rpc_manager_switch_device_source_metadata(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_manager_switch_device_source_metadata(TEXT, TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.rpc_manager_unbind_device_source_metadata(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_manager_unbind_device_source_metadata(TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.rpc_resolve_authorized_source_metadata(VARCHAR, VARCHAR) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_resolve_authorized_source_metadata(VARCHAR, VARCHAR) TO anon, authenticated;
