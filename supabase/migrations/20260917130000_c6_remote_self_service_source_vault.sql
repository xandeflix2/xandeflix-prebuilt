-- =============================================================================
-- Xandeflix Prebuilt — C6 Remote Self-Service Source & Vault Schema & RPCs
--
-- Migration canônica local para fontes de autoatendimento remotas e cofre privado:
-- Permite que clientes cadastrem e atualizem suas próprias fontes (M3U, M3U8, Xtream)
-- com segredos cifrados armazenados exclusivamente em private.customer_source_secret_vault,
-- expondo apenas metadados sanitizados em public.customer_sources.
--
-- Princípios Canônicos:
-- - DEVICE_TO_SOURCE_DIRECT: Dispositivo conecta diretamente à fonte (zero media proxy, zero restream).
-- - ZERO_PLAINTEXT_PUBLIC_STORAGE: Nenhuma credencial ou URL completa reside em tabelas públicas.
-- - VAULT_CRYPTO_AUTHORITY: Reutilização do primitivo canônico AES-256-GCM (nonce 12B/24hex, tag 16B/32hex).
-- - DOMAIN_SEPARATION: Vault de customer sources segregado em private.customer_source_secret_vault
--   mantendo o legado de private.managed_source_secret_vault 100% intacto.
-- - CUSTOMER_SOURCE_LICENSE_RELATION_AUTHORITY: public.customer_sources.license_id REFERENCES public.licenses(id).
-- - ONE_ACTIVE_SOURCE_PER_LICENSE: Índice parcial único para 1 fonte ativa por licença.
-- - CONTROL_PLANE_SOURCE_FETCH_ON_SAVE=NAO: Validação puramente sintática de formato de URL (zero SSRF).
-- - CUSTOMER_SECRET_READBACK=NAO: Nenhuma credencial original é reexibida ao cliente.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. TABELA PÚBLICA DE METADADOS DE FONTES DE CLIENTE (public.customer_sources)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.customer_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id VARCHAR(64) UNIQUE NOT NULL CHECK (source_id ~ '^csrc_[a-z0-9]+$'),
    customer_id UUID NOT NULL REFERENCES public.customer_profiles(id) ON DELETE CASCADE,
    license_id UUID NOT NULL REFERENCES public.licenses(id) ON DELETE CASCADE,
    source_type VARCHAR(20) NOT NULL CHECK (source_type IN ('M3U', 'M3U8', 'XTREAM')),
    display_name VARCHAR(100) NOT NULL CHECK (length(trim(display_name)) > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DISABLED', 'REVOKED')),
    version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices de consulta de fontes
CREATE INDEX IF NOT EXISTS idx_customer_sources_customer_id
    ON public.customer_sources (customer_id);

CREATE INDEX IF NOT EXISTS idx_customer_sources_license_id
    ON public.customer_sources (license_id);

-- Cardinalidade Canônica: 1 fonte ativa por licença
CREATE UNIQUE INDEX IF NOT EXISTS uq_customer_sources_active_per_license
    ON public.customer_sources (license_id)
    WHERE status = 'ACTIVE';

-- -----------------------------------------------------------------------------
-- 2. TABELA PRIVADA DE COFRE DE SEGREDOS (private.customer_source_secret_vault)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS private.customer_source_secret_vault (
    vault_record_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id VARCHAR(64) NOT NULL REFERENCES public.customer_sources(source_id) ON DELETE CASCADE,
    source_version INTEGER NOT NULL CHECK (source_version >= 1),
    protocol VARCHAR(20) NOT NULL CHECK (protocol IN ('M3U', 'M3U8', 'XTREAM')),
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
    key_version VARCHAR(32) NOT NULL DEFAULT 'v1' CHECK (key_version ~ '^[A-Za-z0-9_.-]{1,32}$'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_customer_source_vault_version UNIQUE (source_id, source_version)
);

CREATE INDEX IF NOT EXISTS idx_customer_source_secret_vault_lookup
    ON private.customer_source_secret_vault (source_id, source_version DESC);

-- -----------------------------------------------------------------------------
-- 3. POLÍTICAS DE SEGURANÇA E RLS
-- -----------------------------------------------------------------------------

ALTER TABLE public.customer_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.customer_source_secret_vault ENABLE ROW LEVEL SECURITY;

-- Proíbe qualquer acesso direto ao Vault
REVOKE ALL ON TABLE private.customer_source_secret_vault FROM PUBLIC, anon, authenticated;

-- Proíbe mutações diretas do cliente em customer_sources (tudo via RPC)
REVOKE ALL ON TABLE public.customer_sources FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.customer_sources TO authenticated;

-- Política de leitura: o cliente só lê os metadados das próprias fontes
DROP POLICY IF EXISTS customer_sources_owner_select ON public.customer_sources;
CREATE POLICY customer_sources_owner_select ON public.customer_sources
    FOR SELECT TO authenticated
    USING (customer_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 4. RPC DE CRIAÇÃO DE FONTE (public.rpc_customer_create_source)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.rpc_customer_create_source(
    p_license_id UUID,
    p_source_type TEXT,
    p_display_name TEXT,
    p_ciphertext TEXT,
    p_nonce TEXT,
    p_auth_tag TEXT,
    p_key_version TEXT DEFAULT 'v1'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, extensions, private
AS $$
DECLARE
    v_customer_id UUID;
    v_clean_type VARCHAR(20);
    v_clean_name VARCHAR(100);
    v_source_id VARCHAR(64);
    v_license RECORD;
    v_new_source RECORD;
BEGIN
    -- 1. Autenticação obrigatória
    v_customer_id := auth.uid();
    IF v_customer_id IS NULL THEN
        RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = '42501';
    END IF;

    IF p_license_id IS NULL THEN
        RAISE EXCEPTION 'LICENSE_ID_REQUIRED' USING ERRCODE = '22023';
    END IF;

    -- 2. Validação da licença e vínculo com o customer
    SELECT * INTO v_license
    FROM public.licenses
    WHERE id = p_license_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'INVALID_LICENSE' USING ERRCODE = '22023';
    END IF;

    IF v_license.customer_id IS DISTINCT FROM v_customer_id THEN
        RAISE EXCEPTION 'UNAUTHORIZED_LICENSE_ACCESS' USING ERRCODE = '42501';
    END IF;

    -- Licença precisa estar ativa ou em trial
    IF v_license.status NOT IN ('ACTIVE', 'TRIAL') THEN
        RAISE EXCEPTION 'LICENSE_NOT_ACTIVE' USING ERRCODE = '42501';
    END IF;

    -- 3. Validação do tipo de fonte
    v_clean_type := upper(trim(COALESCE(p_source_type, '')));
    IF v_clean_type NOT IN ('M3U', 'M3U8', 'XTREAM') THEN
        RAISE EXCEPTION 'INVALID_SOURCE_TYPE' USING ERRCODE = '22023';
    END IF;

    -- 4. Validação do nome de exibição
    v_clean_name := trim(COALESCE(p_display_name, ''));
    IF length(v_clean_name) = 0 OR length(v_clean_name) > 100 THEN
        RAISE EXCEPTION 'INVALID_DISPLAY_NAME' USING ERRCODE = '22023';
    END IF;

    -- 5. Validação dos envelopes criptográficos AES-256-GCM
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

    -- 6. Desativa fonte ativa existente para esta licença se houver (substituição limpa)
    UPDATE public.customer_sources
    SET status = 'DISABLED',
        updated_at = NOW()
    WHERE license_id = p_license_id
      AND status = 'ACTIVE';

    -- 7. Gera identificador opaco para a fonte (prefixo csrc_)
    v_source_id := 'csrc_' || lower(encode(gen_random_bytes(8), 'hex'));

    -- 8. Insere metadados públicos sanitizados
    INSERT INTO public.customer_sources (
        source_id,
        customer_id,
        license_id,
        source_type,
        display_name,
        status,
        version,
        created_at,
        updated_at
    ) VALUES (
        v_source_id,
        v_customer_id,
        p_license_id,
        v_clean_type,
        v_clean_name,
        'ACTIVE',
        1,
        NOW(),
        NOW()
    ) RETURNING * INTO v_new_source;

    -- 9. Insere segredo cifrado no Vault privado (atômico)
    INSERT INTO private.customer_source_secret_vault (
        source_id,
        source_version,
        protocol,
        ciphertext,
        nonce,
        auth_tag,
        key_version,
        created_at
    ) VALUES (
        v_source_id,
        1,
        v_clean_type,
        p_ciphertext,
        p_nonce,
        p_auth_tag,
        COALESCE(p_key_version, 'v1'),
        NOW()
    );

    -- 10. Retorna unicamente metadados sanitizados (Zero plaintext secret)
    RETURN jsonb_build_object(
        'success', true,
        'sourceId', v_new_source.source_id,
        'licenseId', v_new_source.license_id,
        'displayName', v_new_source.display_name,
        'sourceType', v_new_source.source_type,
        'status', v_new_source.status,
        'version', v_new_source.version,
        'createdAt', v_new_source.created_at,
        'updatedAt', v_new_source.updated_at
    );
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_customer_create_source(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_customer_create_source(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 5. RPC DE ATUALIZAÇÃO / ROTAÇÃO DE FONTE (public.rpc_customer_update_source)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.rpc_customer_update_source(
    p_source_id TEXT,
    p_display_name TEXT DEFAULT NULL,
    p_ciphertext TEXT DEFAULT NULL,
    p_nonce TEXT DEFAULT NULL,
    p_auth_tag TEXT DEFAULT NULL,
    p_key_version TEXT DEFAULT 'v1'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, extensions, private
AS $$
DECLARE
    v_customer_id UUID;
    v_clean_name VARCHAR(100);
    v_source RECORD;
    v_next_version INTEGER;
BEGIN
    v_customer_id := auth.uid();
    IF v_customer_id IS NULL THEN
        RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = '42501';
    END IF;

    IF p_source_id IS NULL THEN
        RAISE EXCEPTION 'SOURCE_ID_REQUIRED' USING ERRCODE = '22023';
    END IF;

    -- Lock pessimista na fonte
    SELECT * INTO v_source
    FROM public.customer_sources
    WHERE source_id = p_source_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'SOURCE_NOT_FOUND' USING ERRCODE = '22023';
    END IF;

    -- Validação estrita de posse
    IF v_source.customer_id <> v_customer_id THEN
        RAISE EXCEPTION 'CROSS_CUSTOMER_SOURCE_ACCESS_DENIED' USING ERRCODE = '42501';
    END IF;

    v_next_version := v_source.version;

    -- 1. Atualização de credenciais (rotação de segredo)
    IF p_ciphertext IS NOT NULL THEN
        IF length(p_ciphertext) = 0
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

        v_next_version := v_source.version + 1;

        -- Insere nova versão no Vault
        INSERT INTO private.customer_source_secret_vault (
            source_id,
            source_version,
            protocol,
            ciphertext,
            nonce,
            auth_tag,
            key_version,
            created_at
        ) VALUES (
            p_source_id,
            v_next_version,
            v_source.source_type,
            p_ciphertext,
            p_nonce,
            p_auth_tag,
            COALESCE(p_key_version, 'v1'),
            NOW()
        );
    END IF;

    -- 2. Atualização opcional de nome de exibição
    IF p_display_name IS NOT NULL THEN
        v_clean_name := trim(p_display_name);
        IF length(v_clean_name) = 0 OR length(v_clean_name) > 100 THEN
            RAISE EXCEPTION 'INVALID_DISPLAY_NAME' USING ERRCODE = '22023';
        END IF;
    ELSE
        v_clean_name := v_source.display_name;
    END IF;

    -- Atualiza metadados públicos
    UPDATE public.customer_sources
    SET display_name = v_clean_name,
        version = v_next_version,
        updated_at = NOW()
    WHERE source_id = p_source_id;

    RETURN jsonb_build_object(
        'success', true,
        'sourceId', p_source_id,
        'displayName', v_clean_name,
        'sourceType', v_source.source_type,
        'status', v_source.status,
        'version', v_next_version,
        'credentialsRotated', (p_ciphertext IS NOT NULL)
    );
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_customer_update_source(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_customer_update_source(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 6. RPC DE LISTAGEM DE FONTES DO CLIENTE (public.rpc_customer_list_sources)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.rpc_customer_list_sources()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, extensions, private
AS $$
DECLARE
    v_customer_id UUID;
    v_list JSONB;
BEGIN
    v_customer_id := auth.uid();
    IF v_customer_id IS NULL THEN
        RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = '42501';
    END IF;

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'sourceId', s.source_id,
        'licenseId', s.license_id,
        'displayName', s.display_name,
        'sourceType', s.source_type,
        'status', s.status,
        'version', s.version,
        'createdAt', s.created_at,
        'updatedAt', s.updated_at
    ) ORDER BY s.created_at DESC), '[]'::jsonb)
    INTO v_list
    FROM public.customer_sources s
    WHERE s.customer_id = v_customer_id;

    RETURN jsonb_build_object(
        'success', true,
        'sources', v_list
    );
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_customer_list_sources() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_customer_list_sources() TO authenticated;

-- -----------------------------------------------------------------------------
-- 7. RPC DE DESATIVAÇÃO DE FONTE (public.rpc_customer_disable_source)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.rpc_customer_disable_source(
    p_source_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, extensions, private
AS $$
DECLARE
    v_customer_id UUID;
    v_source RECORD;
BEGIN
    v_customer_id := auth.uid();
    IF v_customer_id IS NULL THEN
        RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = '42501';
    END IF;

    IF p_source_id IS NULL THEN
        RAISE EXCEPTION 'SOURCE_ID_REQUIRED' USING ERRCODE = '22023';
    END IF;

    SELECT * INTO v_source
    FROM public.customer_sources
    WHERE source_id = p_source_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'SOURCE_NOT_FOUND' USING ERRCODE = '22023';
    END IF;

    IF v_source.customer_id <> v_customer_id THEN
        RAISE EXCEPTION 'CROSS_CUSTOMER_SOURCE_ACCESS_DENIED' USING ERRCODE = '42501';
    END IF;

    UPDATE public.customer_sources
    SET status = 'DISABLED',
        updated_at = NOW()
    WHERE source_id = p_source_id;

    RETURN jsonb_build_object(
        'success', true,
        'sourceId', p_source_id,
        'status', 'DISABLED'
    );
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_customer_disable_source(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_customer_disable_source(TEXT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 8. RPC DE RESOLUÇÃO E ENTREGA AO DISPOSITIVO (rpc_device_resolve_self_service_source)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.rpc_device_resolve_self_service_source(
    p_device_id TEXT,
    p_device_token TEXT,
    p_license_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, extensions, private
AS $$
DECLARE
    v_device RECORD;
    v_token_hash VARCHAR(64);
    v_license_device RECORD;
    v_access_eval JSONB;
    v_source RECORD;
    v_vault RECORD;
BEGIN
    IF p_device_id IS NULL THEN
        RAISE EXCEPTION 'DEVICE_ID_REQUIRED' USING ERRCODE = '22023';
    END IF;
    IF p_device_token IS NULL THEN
        RAISE EXCEPTION 'DEVICE_TOKEN_REQUIRED' USING ERRCODE = '22023';
    END IF;
    IF p_license_id IS NULL THEN
        RAISE EXCEPTION 'LICENSE_ID_REQUIRED' USING ERRCODE = '22023';
    END IF;

    -- 1. Valida existência e autorização do dispositivo
    SELECT * INTO v_device
    FROM public.devices
    WHERE device_id = p_device_id;

    IF NOT FOUND OR v_device.status <> 'AUTHORIZED' THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'DEVICE_NOT_AUTHORIZED',
            'message', 'Dispositivo não autorizado.'
        );
    END IF;

    -- 2. Valida prova criptográfica do token de dispositivo (sem bearer no banco)
    v_token_hash := encode(digest(p_device_token, 'sha256'), 'hex');
    IF v_token_hash <> v_device.device_token_hash THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'INVALID_DEVICE_TOKEN_PROOF',
            'message', 'Prova de token do dispositivo inválida.'
        );
    END IF;

    -- 3. Valida vinculação do dispositivo com a licença
    SELECT * INTO v_license_device
    FROM public.license_devices
    WHERE license_id = p_license_id
      AND device_id = p_device_id
      AND status = 'ACTIVE';

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'DEVICE_NOT_BOUND_TO_LICENSE',
            'message', 'Dispositivo não vinculado a esta licença.'
        );
    END IF;

    -- 4. Avalia direito comercial da licença via private.evaluate_license_access
    v_access_eval := private.evaluate_license_access(p_license_id, p_device_id);
    IF (v_access_eval->>'accessAllowed')::boolean <> true THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', COALESCE(v_access_eval->>'code', 'LICENSE_ACCESS_DENIED'),
            'licenseStatus', v_access_eval->>'licenseStatus',
            'message', COALESCE(v_access_eval->>'message', 'Acesso comercial à licença negado.')
        );
    END IF;

    -- 5. Busca a fonte de autoatendimento ativa para esta licença
    SELECT * INTO v_source
    FROM public.customer_sources
    WHERE license_id = p_license_id
      AND status = 'ACTIVE';

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'NO_ACTIVE_SOURCE_FOR_LICENSE',
            'message', 'Nenhuma fonte ativa configurada para esta licença.'
        );
    END IF;

    -- 6. Obtém o envelope cifrado da versão corrente no Vault
    SELECT * INTO v_vault
    FROM private.customer_source_secret_vault
    WHERE source_id = v_source.source_id
      AND source_version = v_source.version;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'VAULT_SECRET_VERSION_NOT_FOUND',
            'message', 'Segredo cifrado da versão da fonte não encontrado.'
        );
    END IF;

    -- 7. Entrega segura do payload para o dispositivo autorizado
    RETURN jsonb_build_object(
        'success', true,
        'sourceId', v_source.source_id,
        'sourceVersion', v_source.version,
        'sourceType', v_source.source_type,
        'displayName', v_source.display_name,
        'ciphertext', v_vault.ciphertext,
        'nonce', v_vault.nonce,
        'authTag', v_vault.auth_tag,
        'keyVersion', v_vault.key_version
    );
END;
$$;

-- A RPC de resolução de dispositivo pode ser invocada por anon (já que TVs usam token proof) e service_role (Edge Functions)
REVOKE ALL ON FUNCTION public.rpc_device_resolve_self_service_source(TEXT, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_device_resolve_self_service_source(TEXT, TEXT, UUID) TO anon, authenticated, service_role;
