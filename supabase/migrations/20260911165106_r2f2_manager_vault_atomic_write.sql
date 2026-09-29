-- =============================================================================
-- Xandeflix Prebuilt — R2F2 Manager -> Managed Source Vault integration
--
-- Blocker resolved by this migration: the R2F1 metadata-only create/update
-- RPCs cannot persist the initial v1 vault row atomically with metadata.
-- This migration adds only the transactional envelope RPCs used by the
-- authenticated server-side Edge Function. No legacy field is read, changed,
-- migrated or purged.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.bump_managed_source_version()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- R2F1/R2F2 vault writes explicitly supply OLD.version + 1. Preserve that
    -- generation even though the legacy encrypted columns remain unchanged.
    IF NEW.version = OLD.version + 1 THEN
        NEW.version := OLD.version + 1;
    ELSIF OLD.encrypted_payload IS DISTINCT FROM NEW.encrypted_payload
       OR OLD.iv IS DISTINCT FROM NEW.iv
       OR OLD.auth_tag IS DISTINCT FROM NEW.auth_tag
       OR OLD.source_type IS DISTINCT FROM NEW.source_type
       OR OLD.name IS DISTINCT FROM NEW.name THEN
        NEW.version := OLD.version + 1;
    ELSE
        NEW.version := OLD.version;
    END IF;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

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
        'vaultStatus', CASE WHEN EXISTS (
            SELECT 1
            FROM private.managed_source_secret_vault v
            WHERE v.source_id = ms.source_id
        ) THEN 'CONFIGURED' ELSE 'NOT_CONFIGURED' END,
        'createdAtIso', ms.created_at,
        'updatedAtIso', ms.updated_at
    )
    FROM public.managed_sources ms
    WHERE ms.id = p_internal_id;
$$;

REVOKE ALL ON FUNCTION private.manager_source_metadata(UUID) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.rpc_manager_create_managed_source_vault(
    p_source_id TEXT,
    p_name TEXT,
    p_source_type TEXT,
    p_ciphertext TEXT,
    p_nonce TEXT,
    p_auth_tag TEXT,
    p_key_version TEXT
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
    IF p_name IS NULL OR btrim(p_name) = '' OR length(btrim(p_name)) > 160 THEN
        RAISE EXCEPTION 'INVALID_SOURCE_NAME' USING ERRCODE = '22023';
    END IF;
    IF p_source_type IS NULL OR p_source_type NOT IN ('M3U', 'XTREAM') THEN
        RAISE EXCEPTION 'INVALID_SOURCE_PROTOCOL' USING ERRCODE = '22023';
    END IF;
    IF p_ciphertext IS NULL
       OR length(p_ciphertext) = 0
       OR length(p_ciphertext) % 2 <> 0
       OR p_ciphertext !~ '^[0-9A-Fa-f]+$' THEN
        RAISE EXCEPTION 'INVALID_VAULT_CIPHERTEXT' USING ERRCODE = '22023';
    END IF;
    IF p_nonce IS NULL OR p_nonce !~ '^[0-9A-Fa-f]{24}$' THEN
        RAISE EXCEPTION 'INVALID_VAULT_NONCE' USING ERRCODE = '22023';
    END IF;
    IF p_auth_tag IS NULL OR p_auth_tag !~ '^[0-9A-Fa-f]{32}$' THEN
        RAISE EXCEPTION 'INVALID_VAULT_AUTH_TAG' USING ERRCODE = '22023';
    END IF;
    IF p_key_version IS NULL OR p_key_version !~ '^[A-Za-z0-9_.-]{1,32}$' THEN
        RAISE EXCEPTION 'INVALID_VAULT_KEY_VERSION' USING ERRCODE = '22023';
    END IF;
    IF EXISTS (SELECT 1 FROM public.managed_sources WHERE source_id = p_source_id) THEN
        RAISE EXCEPTION 'SOURCE_ALREADY_EXISTS' USING ERRCODE = '23505';
    END IF;

    INSERT INTO public.managed_sources (source_id, name, source_type, version, status)
    VALUES (p_source_id, btrim(p_name), p_source_type, 1, 'ACTIVE')
    RETURNING id INTO v_internal_id;

    INSERT INTO private.managed_source_secret_vault (
        source_id, source_version, protocol, ciphertext, nonce, auth_tag, key_version
    )
    VALUES (p_source_id, 1, p_source_type, p_ciphertext, p_nonce, p_auth_tag, p_key_version);

    RETURN jsonb_build_object(
        'success', TRUE,
        'source', private.manager_source_metadata(v_internal_id)
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_manager_update_managed_source_vault(
    p_source_id TEXT,
    p_expected_source_version INTEGER,
    p_name TEXT,
    p_source_type TEXT,
    p_ciphertext TEXT,
    p_nonce TEXT,
    p_auth_tag TEXT,
    p_key_version TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
DECLARE
    v_source RECORD;
    v_next_version INTEGER;
BEGIN
    PERFORM private.require_active_manager();

    IF p_source_id IS NULL OR p_source_id !~ '^src_[a-z0-9]+$' THEN
        RAISE EXCEPTION 'INVALID_CANONICAL_SOURCE_ID' USING ERRCODE = '22023';
    END IF;
    IF p_expected_source_version IS NULL OR p_expected_source_version < 1 THEN
        RAISE EXCEPTION 'INVALID_EXPECTED_VERSION' USING ERRCODE = '22023';
    END IF;
    IF p_name IS NOT NULL AND (btrim(p_name) = '' OR length(btrim(p_name)) > 160) THEN
        RAISE EXCEPTION 'INVALID_SOURCE_NAME' USING ERRCODE = '22023';
    END IF;
    IF p_source_type IS NULL OR p_source_type NOT IN ('M3U', 'XTREAM') THEN
        RAISE EXCEPTION 'INVALID_SOURCE_PROTOCOL' USING ERRCODE = '22023';
    END IF;
    IF p_ciphertext IS NULL
       OR length(p_ciphertext) = 0
       OR length(p_ciphertext) % 2 <> 0
       OR p_ciphertext !~ '^[0-9A-Fa-f]+$' THEN
        RAISE EXCEPTION 'INVALID_VAULT_CIPHERTEXT' USING ERRCODE = '22023';
    END IF;
    IF p_nonce IS NULL OR p_nonce !~ '^[0-9A-Fa-f]{24}$' THEN
        RAISE EXCEPTION 'INVALID_VAULT_NONCE' USING ERRCODE = '22023';
    END IF;
    IF p_auth_tag IS NULL OR p_auth_tag !~ '^[0-9A-Fa-f]{32}$' THEN
        RAISE EXCEPTION 'INVALID_VAULT_AUTH_TAG' USING ERRCODE = '22023';
    END IF;
    IF p_key_version IS NULL OR p_key_version !~ '^[A-Za-z0-9_.-]{1,32}$' THEN
        RAISE EXCEPTION 'INVALID_VAULT_KEY_VERSION' USING ERRCODE = '22023';
    END IF;

    SELECT id, name, source_type, version
    INTO v_source
    FROM public.managed_sources
    WHERE source_id = p_source_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'SOURCE_NOT_FOUND' USING ERRCODE = 'P0002';
    END IF;
    IF v_source.version <> p_expected_source_version THEN
        RAISE EXCEPTION 'VERSION_CONFLICT' USING ERRCODE = '40001';
    END IF;

    v_next_version := v_source.version + 1;

    UPDATE public.managed_sources
    SET name = COALESCE(NULLIF(btrim(p_name), ''), name),
        source_type = p_source_type,
        version = v_next_version,
        updated_at = NOW()
    WHERE id = v_source.id;

    INSERT INTO private.managed_source_secret_vault (
        source_id, source_version, protocol, ciphertext, nonce, auth_tag, key_version
    )
    VALUES (p_source_id, v_next_version, p_source_type, p_ciphertext, p_nonce, p_auth_tag, p_key_version);

    RETURN jsonb_build_object(
        'success', TRUE,
        'source', private.manager_source_metadata(v_source.id)
    );
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_manager_create_managed_source_vault(
    TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_manager_create_managed_source_vault(
    TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) TO authenticated;

REVOKE ALL ON FUNCTION public.rpc_manager_update_managed_source_vault(
    TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_manager_update_managed_source_vault(
    TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) TO authenticated;
