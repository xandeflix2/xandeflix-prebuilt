-- =============================================================================
-- Xandeflix Prebuilt — R2F1 Secure Managed Source Vault
--
-- Boundary privada e aditiva para configuração real de sources MANAGED.
-- Esta migration não lê, migra ou purga o legado existente em managed_sources.
-- A cifragem ocorre server-side antes da chamada da função privada abaixo.
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS private;

REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS private.managed_source_secret_vault (
    vault_record_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id TEXT NOT NULL,
    source_version INTEGER NOT NULL CHECK (source_version >= 1),
    protocol TEXT NOT NULL CHECK (protocol IN ('M3U', 'XTREAM')),
    ciphertext TEXT NOT NULL CHECK (
        length(ciphertext) > 0
        AND length(ciphertext) % 2 = 0
        AND ciphertext ~ '^[0-9A-Fa-f]+$'
    ),
    nonce TEXT NOT NULL CHECK (
        length(nonce) = 24
        AND nonce ~ '^[0-9A-Fa-f]{24}$'
    ),
    auth_tag TEXT NOT NULL CHECK (
        length(auth_tag) = 32
        AND auth_tag ~ '^[0-9A-Fa-f]{32}$'
    ),
    key_version TEXT NOT NULL CHECK (key_version ~ '^[A-Za-z0-9_.-]{1,32}$'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_managed_source_secret_vault_version UNIQUE (source_id, source_version),
    CONSTRAINT chk_managed_source_secret_vault_source_id CHECK (source_id ~ '^src_[a-z0-9]+$')
);

CREATE INDEX IF NOT EXISTS idx_managed_source_secret_vault_source
    ON private.managed_source_secret_vault(source_id, source_version DESC);

ALTER TABLE private.managed_source_secret_vault ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE private.managed_source_secret_vault FROM PUBLIC, anon, authenticated;

COMMENT ON TABLE private.managed_source_secret_vault IS
    'Private encrypted vault for MANAGED source configuration. Never exposed through public metadata.';

-- Contrato privado: a aplicação server-side fornece somente envelope já cifrado.
-- A função valida o Manager, a source, o protocolo e a versão; depois atualiza
-- metadata + vault na mesma transação. Não retorna configuração nem envelope.
CREATE OR REPLACE FUNCTION private.store_managed_source_secret(
    p_source_id TEXT,
    p_expected_source_version INTEGER,
    p_protocol TEXT,
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

    IF p_protocol IS NULL OR p_protocol NOT IN ('M3U', 'XTREAM') THEN
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

    -- Todas as linhas de managed_sources pertencem ao modo MANAGED.
    SELECT ms.source_id, ms.version, ms.source_type, ms.status
    INTO v_source
    FROM public.managed_sources ms
    WHERE ms.source_id = p_source_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'SOURCE_NOT_FOUND' USING ERRCODE = '22023';
    END IF;

    IF v_source.source_type <> p_protocol THEN
        RAISE EXCEPTION 'SOURCE_PROTOCOL_MISMATCH' USING ERRCODE = '22023';
    END IF;

    IF v_source.version <> p_expected_source_version THEN
        RAISE EXCEPTION 'VERSION_CONFLICT' USING ERRCODE = '40001';
    END IF;

    v_next_version := v_source.version + 1;

    UPDATE public.managed_sources
    SET version = v_next_version,
        updated_at = NOW()
    WHERE source_id = p_source_id
      AND version = p_expected_source_version;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'VERSION_CONFLICT' USING ERRCODE = '40001';
    END IF;

    INSERT INTO private.managed_source_secret_vault (
        source_id,
        source_version,
        protocol,
        ciphertext,
        nonce,
        auth_tag,
        key_version
    )
    VALUES (
        p_source_id,
        v_next_version,
        p_protocol,
        p_ciphertext,
        p_nonce,
        p_auth_tag,
        p_key_version
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'sourceId', p_source_id,
        'sourceVersion', v_next_version,
        'protocol', p_protocol,
        'sourceStatus', v_source.status
    );
END;
$$;

REVOKE ALL ON FUNCTION private.store_managed_source_secret(
    TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT
) FROM PUBLIC, anon, authenticated;
