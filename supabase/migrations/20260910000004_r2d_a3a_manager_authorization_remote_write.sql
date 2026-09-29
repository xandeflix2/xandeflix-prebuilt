-- =============================================================================
-- Xandeflix Prebuilt - R2D-A3A Manager Authorization and Remote Write
--
-- Migration aditiva e local-only neste ciclo. Nenhum administrador, source,
-- license ou binding real e materializado.
--
-- Autoridade administrativa canonica:
-- Supabase Auth -> auth.uid() -> manager_admins -> RPC administrativa.
-- O cliente nunca envia user_id como prova de identidade.
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS private;

REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS public.manager_admins (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('OWNER', 'ADMIN')),
    status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'DISABLED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.manager_admins ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.manager_admins FROM PUBLIC, anon, authenticated;

CREATE INDEX IF NOT EXISTS idx_manager_admins_status_role
    ON public.manager_admins(status, role);

-- Tambem bloqueia acesso direto ao plano de controle. As RPCs SECURITY DEFINER
-- abaixo fazem as leituras/escritas apos validar o Manager no servidor.
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.managed_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_source_bindings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.control_plane_settings ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.licenses FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.devices FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.license_devices FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.managed_sources FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.device_source_bindings FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.control_plane_settings FROM PUBLIC, anon, authenticated;

-- Boundary central de autorizacao. O corpo consulta auth.uid() no servidor e
-- nunca aceita uma identidade administrativa enviada pelo caller.
CREATE OR REPLACE FUNCTION private.require_active_manager()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'MANAGER_AUTH_REQUIRED' USING ERRCODE = '42501';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.manager_admins
        WHERE user_id = v_user_id
          AND status = 'ACTIVE'
          AND role IN ('OWNER', 'ADMIN')
    ) THEN
        RAISE EXCEPTION 'MANAGER_NOT_AUTHORIZED' USING ERRCODE = '42501';
    END IF;

    RETURN v_user_id;
END;
$$;

REVOKE ALL ON FUNCTION private.require_active_manager() FROM PUBLIC, anon, authenticated;

-- Projecao administrativa sem plaintext de credenciais. O UUID tecnico
-- interno nunca e exposto como identidade da source: id/sourceId sao sempre o
-- source_id canonico estavel.
CREATE OR REPLACE FUNCTION private.manager_source_payload(p_internal_id UUID)
RETURNS JSONB
LANGUAGE SQL
STABLE
SET search_path = pg_catalog, public, private
AS $$
    SELECT jsonb_build_object(
        'id', ms.source_id,
        'sourceId', ms.source_id,
        'name', ms.name,
        'sourceType', ms.source_type,
        'encryptedPayload', ms.encrypted_payload,
        'iv', ms.iv,
        'authTag', ms.auth_tag,
        'version', ms.version,
        'status', ms.status,
        'createdAtIso', ms.created_at,
        'updatedAtIso', ms.updated_at
    )
    FROM public.managed_sources ms
    WHERE ms.id = p_internal_id;
$$;

-- Leitura remota usada tanto como confirmacao pos-mutation quanto para
-- repopular a UI. Nenhum token de device ou segredo plaintext e retornado.
CREATE OR REPLACE FUNCTION public.rpc_manager_read_control_plane()
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
            SELECT jsonb_agg(private.manager_source_payload(ms.id) ORDER BY ms.created_at)
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

CREATE OR REPLACE FUNCTION public.rpc_manager_create_managed_source(
    p_source_id TEXT,
    p_name TEXT,
    p_source_type TEXT,
    p_encrypted_payload TEXT,
    p_iv TEXT,
    p_auth_tag TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
DECLARE
    v_source public.managed_sources%ROWTYPE;
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
    IF p_encrypted_payload IS NULL OR p_iv IS NULL OR p_auth_tag IS NULL
       OR btrim(p_encrypted_payload) = '' OR btrim(p_iv) = '' OR btrim(p_auth_tag) = '' THEN
        RAISE EXCEPTION 'PROTECTED_CONFIG_REQUIRED' USING ERRCODE = '22023';
    END IF;

    INSERT INTO public.managed_sources (
        source_id,
        name,
        source_type,
        encrypted_payload,
        iv,
        auth_tag,
        version,
        status
    )
    VALUES (
        p_source_id,
        btrim(p_name),
        p_source_type,
        p_encrypted_payload,
        p_iv,
        p_auth_tag,
        1,
        'ACTIVE'
    )
    RETURNING * INTO v_source;

    RETURN jsonb_build_object(
        'success', true,
        'source', private.manager_source_payload(v_source.id)
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_manager_update_managed_source(
    p_source_id TEXT,
    p_expected_version INTEGER,
    p_name TEXT DEFAULT NULL,
    p_source_type TEXT DEFAULT NULL,
    p_encrypted_payload TEXT DEFAULT NULL,
    p_iv TEXT DEFAULT NULL,
    p_auth_tag TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
DECLARE
    v_source public.managed_sources%ROWTYPE;
    v_updated public.managed_sources%ROWTYPE;
    v_config_changed BOOLEAN;
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

    SELECT * INTO v_source
    FROM public.managed_sources
    WHERE source_id = p_source_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'SOURCE_NOT_FOUND' USING ERRCODE = 'P0002';
    END IF;

    IF v_source.version <> p_expected_version THEN
        RAISE EXCEPTION 'VERSION_CONFLICT' USING ERRCODE = '40001';
    END IF;

    v_config_changed := p_encrypted_payload IS NOT NULL
        OR p_iv IS NOT NULL
        OR p_auth_tag IS NOT NULL;

    IF v_config_changed AND (
        p_encrypted_payload IS NULL OR p_iv IS NULL OR p_auth_tag IS NULL
        OR btrim(p_encrypted_payload) = '' OR btrim(p_iv) = '' OR btrim(p_auth_tag) = ''
    ) THEN
        RAISE EXCEPTION 'PROTECTED_CONFIG_ENVELOPE_INCOMPLETE' USING ERRCODE = '22023';
    END IF;

    IF NOT v_config_changed
       AND p_source_type IS NOT NULL
       AND p_source_type <> v_source.source_type THEN
        RAISE EXCEPTION 'PROTECTED_CONFIG_REQUIRED_FOR_PROTOCOL_CHANGE' USING ERRCODE = '22023';
    END IF;

    IF NOT v_config_changed
       AND (p_name IS NULL OR btrim(p_name) = v_source.name)
       AND (p_source_type IS NULL OR p_source_type = v_source.source_type) THEN
        RAISE EXCEPTION 'NO_SOURCE_CHANGE' USING ERRCODE = '22023';
    END IF;

    UPDATE public.managed_sources
    SET name = COALESCE(NULLIF(btrim(p_name), ''), name),
        source_type = COALESCE(p_source_type, source_type),
        encrypted_payload = COALESCE(p_encrypted_payload, encrypted_payload),
        iv = COALESCE(p_iv, iv),
        auth_tag = COALESCE(p_auth_tag, auth_tag),
        version = p_expected_version + 1,
        updated_at = NOW()
    WHERE id = v_source.id
    RETURNING * INTO v_updated;

    IF v_updated.version <> p_expected_version + 1 THEN
        RAISE EXCEPTION 'VERSION_UPDATE_FAILED' USING ERRCODE = '40001';
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'source', private.manager_source_payload(v_updated.id)
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_manager_set_managed_source_status(
    p_source_id TEXT,
    p_status TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
DECLARE
    v_source public.managed_sources%ROWTYPE;
BEGIN
    PERFORM private.require_active_manager();

    IF p_status IS NULL OR p_status NOT IN ('ACTIVE', 'DISABLED') THEN
        RAISE EXCEPTION 'INVALID_SOURCE_STATUS' USING ERRCODE = '22023';
    END IF;

    UPDATE public.managed_sources
    SET status = p_status,
        updated_at = NOW()
    WHERE source_id = p_source_id
    RETURNING * INTO v_source;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'SOURCE_NOT_FOUND' USING ERRCODE = 'P0002';
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'source', private.manager_source_payload(v_source.id)
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_manager_bind_device_source(
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
    v_license public.licenses%ROWTYPE;
    v_device public.devices%ROWTYPE;
    v_source public.managed_sources%ROWTYPE;
    v_existing public.device_source_bindings%ROWTYPE;
    v_binding public.device_source_bindings%ROWTYPE;
BEGIN
    PERFORM private.require_active_manager();

    SELECT * INTO v_license FROM public.licenses WHERE id = p_license_id FOR UPDATE;
    IF NOT FOUND OR v_license.status <> 'ACTIVE' THEN
        RAISE EXCEPTION 'LICENSE_NOT_ACTIVE' USING ERRCODE = 'P0002';
    END IF;

    SELECT * INTO v_device FROM public.devices WHERE device_id = p_device_id;
    IF NOT FOUND OR v_device.status <> 'AUTHORIZED' THEN
        RAISE EXCEPTION 'DEVICE_NOT_AUTHORIZED' USING ERRCODE = '42501';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.license_devices
        WHERE license_id = p_license_id
          AND device_id = p_device_id
          AND status = 'ACTIVE'
    ) THEN
        RAISE EXCEPTION 'CROSS_CUSTOMER_BINDING_DENIED' USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_source
    FROM public.managed_sources
    WHERE source_id = p_source_id;
    IF NOT FOUND OR v_source.status <> 'ACTIVE' THEN
        RAISE EXCEPTION 'SOURCE_NOT_ACTIVE' USING ERRCODE = 'P0002';
    END IF;

    SELECT * INTO v_existing
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
    VALUES (p_license_id, p_device_id, v_source.id)
    RETURNING * INTO v_binding;

    RETURN jsonb_build_object(
        'success', true,
        'deviceId', p_device_id,
        'sourceId', p_source_id
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_manager_switch_device_source(
    p_device_id TEXT,
    p_source_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
DECLARE
    v_device public.devices%ROWTYPE;
    v_binding public.device_source_bindings%ROWTYPE;
    v_old_source public.managed_sources%ROWTYPE;
    v_new_source public.managed_sources%ROWTYPE;
BEGIN
    PERFORM private.require_active_manager();

    SELECT * INTO v_device FROM public.devices WHERE device_id = p_device_id;
    IF NOT FOUND OR v_device.status <> 'AUTHORIZED' THEN
        RAISE EXCEPTION 'DEVICE_NOT_AUTHORIZED' USING ERRCODE = '42501';
    END IF;

    SELECT dsb.* INTO v_binding
    FROM public.device_source_bindings dsb
    WHERE dsb.device_id = p_device_id
    FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'BINDING_NOT_FOUND' USING ERRCODE = 'P0002';
    END IF;

    SELECT * INTO v_old_source
    FROM public.managed_sources
    WHERE id = v_binding.source_id;

    SELECT * INTO v_new_source
    FROM public.managed_sources
    WHERE source_id = p_source_id;
    IF NOT FOUND OR v_new_source.status <> 'ACTIVE' THEN
        RAISE EXCEPTION 'SOURCE_NOT_ACTIVE' USING ERRCODE = 'P0002';
    END IF;

    IF v_old_source.id = v_new_source.id THEN
        RETURN jsonb_build_object(
            'success', true,
            'deviceId', p_device_id,
            'previousSourceId', v_old_source.source_id,
            'newSourceId', v_new_source.source_id
        );
    END IF;

    -- Uma unica UPDATE sob lock da linha garante a troca atomica e preserva
    -- exatamente uma linha ativa por device (uq_device_source_binding).
    UPDATE public.device_source_bindings
    SET source_id = v_new_source.id
    WHERE id = v_binding.id;

    RETURN jsonb_build_object(
        'success', true,
        'deviceId', p_device_id,
        'previousSourceId', v_old_source.source_id,
        'newSourceId', v_new_source.source_id
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_manager_unbind_device_source(
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

-- O Data API pode expor funcoes somente para authenticated; o helper privado
-- permanece inacessivel. A autorizacao real continua sendo require_active_manager.
REVOKE EXECUTE ON FUNCTION public.rpc_manager_read_control_plane() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_manager_read_control_plane() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.rpc_manager_create_managed_source(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_manager_create_managed_source(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.rpc_manager_update_managed_source(TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_manager_update_managed_source(TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.rpc_manager_set_managed_source_status(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_manager_set_managed_source_status(TEXT, TEXT) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.rpc_manager_bind_device_source(UUID, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_manager_bind_device_source(UUID, TEXT, TEXT) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.rpc_manager_switch_device_source(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_manager_switch_device_source(TEXT, TEXT) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.rpc_manager_unbind_device_source(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_manager_unbind_device_source(TEXT) TO authenticated;
