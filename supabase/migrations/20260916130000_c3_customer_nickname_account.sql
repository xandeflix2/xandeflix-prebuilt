-- =============================================================================
-- Xandeflix Prebuilt — C3 Customer Nickname Account Schema & RPCs
--
-- Migration canônica local para a identidade comercial do cliente:
-- Customer Profile + Nickname Account.
--
-- Princípios Canônicos:
-- - CUSTOMER_NOT_DEVICE_NOT_INSTALLATION: Cliente é a entidade comercial;
--   não é aparelho (device), não é instalação física e não é licença.
-- - SUPABASE_AUTH_AUTHORITY: A autenticação reside exclusivamente em auth.users;
--   nickname é identificador visível e legível, NUNCA credencial de login.
-- - NICKNAME_CASE_INSENSITIVE_UNIQUE: Unicidade canônica case-insensitive (LOWER(TRIM(nickname))).
-- - ZERO_SECRETS: Nenhuma senha, token ou chave transita nesta tabela.
-- - ZERO_EMAIL_DUPLICATION: auth.users é a autoridade exclusiva do e-mail.
-- - LEGACY_MANAGED_LICENSE_COMPATIBILITY: customer_id em licenses é estritamente NULLABLE.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. TABELA DE PERFIS DE CLIENTES (public.customer_profiles)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customer_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nickname VARCHAR(32) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'BLOCKED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unicidade de Nickname normalizado (Case-Insensitive e Trim)
CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_profiles_nickname_lower
    ON public.customer_profiles (LOWER(TRIM(nickname)));

CREATE INDEX IF NOT EXISTS idx_customer_profiles_status
    ON public.customer_profiles (status);

CREATE INDEX IF NOT EXISTS idx_customer_profiles_created_at
    ON public.customer_profiles (created_at DESC);

-- -----------------------------------------------------------------------------
-- 2. PREPARAÇÃO DA RELAÇÃO COM LICENÇAS (NULLABLE PARA LEGACY)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'licenses' 
          AND column_name = 'customer_id'
    ) THEN
        ALTER TABLE public.licenses
            ADD COLUMN customer_id UUID REFERENCES public.customer_profiles(id) ON DELETE SET NULL;
            
        CREATE INDEX IF NOT EXISTS idx_licenses_customer_id
            ON public.licenses (customer_id);
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 3. SEGURANÇA E RESTRIÇÃO DE ACESSO (RLS)
-- -----------------------------------------------------------------------------
ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.customer_profiles FROM PUBLIC, anon, authenticated;

-- Leitura: Cliente autenticado pode consultar estritamente seu próprio perfil
DROP POLICY IF EXISTS customer_profiles_select_own ON public.customer_profiles;
CREATE POLICY customer_profiles_select_own
    ON public.customer_profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Escrita controlada: Atualização de próprio perfil
DROP POLICY IF EXISTS customer_profiles_update_own ON public.customer_profiles;
CREATE POLICY customer_profiles_update_own
    ON public.customer_profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- -----------------------------------------------------------------------------
-- 4. FUNÇÕES INTERNAS DE VALIDAÇÃO E SEGURANÇA
-- -----------------------------------------------------------------------------

-- Validador e normalizador canônico de nickname
CREATE OR REPLACE FUNCTION private.validate_customer_nickname(p_nickname TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    v_clean TEXT;
BEGIN
    IF p_nickname IS NULL THEN
        RAISE EXCEPTION 'NICKNAME_REQUIRED' USING ERRCODE = '22023';
    END IF;

    v_clean := trim(p_nickname);

    -- Limites de tamanho: 3 a 32 caracteres
    IF length(v_clean) < 3 OR length(v_clean) > 32 THEN
        RAISE EXCEPTION 'NICKNAME_LENGTH_INVALID' USING ERRCODE = '22023';
    END IF;

    -- Formato seguro: Letras, números, hífen, underscore ou espaços internos
    -- Não permite HTML, scripts, caracteres de controle ou apenas espaços
    IF v_clean !~ '^[A-Za-z0-9][A-Za-z0-9_ -]{1,30}[A-Za-z0-9]$' THEN
        RAISE EXCEPTION 'NICKNAME_FORMAT_INVALID' USING ERRCODE = '22023';
    END IF;

    -- Nomes reservados explícitos (proteção contra impersonation)
    IF lower(v_clean) IN (
        'admin', 'administrator', 'manager', 'support', 'system', 
        'xandeflix', 'root', 'moderator', 'null', 'undefined', 'gestor'
    ) THEN
        RAISE EXCEPTION 'RESERVED_NICKNAME' USING ERRCODE = '22023';
    END IF;

    RETURN v_clean;
END;
$$;

-- Trigger para bloquear mutação indevida de campos protegidos
CREATE OR REPLACE FUNCTION private.trg_customer_profiles_enforce_safety()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
BEGIN
    -- Proíbe alteração de ID
    IF NEW.id <> OLD.id THEN
        RAISE EXCEPTION 'CANNOT_MUTATE_CUSTOMER_ID' USING ERRCODE = '42501';
    END IF;

    -- Proíbe alteração de status pelo próprio cliente
    IF NEW.status <> OLD.status AND auth.uid() = OLD.id THEN
        RAISE EXCEPTION 'CUSTOMER_STATUS_SELF_MUTATION_DENIED' USING ERRCODE = '42501';
    END IF;

    -- Sempre atualiza updated_at no servidor
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_customer_profiles_safety ON public.customer_profiles;
CREATE TRIGGER trg_customer_profiles_safety
    BEFORE UPDATE ON public.customer_profiles
    FOR EACH ROW
    EXECUTE FUNCTION private.trg_customer_profiles_enforce_safety();

-- -----------------------------------------------------------------------------
-- 5. RPC DE CRIAÇÃO DE PERFIL DO CLIENTE (rpc_customer_create_profile)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_customer_create_profile(p_nickname TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
DECLARE
    v_user_id UUID;
    v_clean_nickname TEXT;
    v_profile RECORD;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = '42501';
    END IF;

    -- Verifica se o usuário já possui um perfil
    IF EXISTS (SELECT 1 FROM public.customer_profiles WHERE id = v_user_id) THEN
        RAISE EXCEPTION 'CUSTOMER_PROFILE_ALREADY_EXISTS' USING ERRCODE = '23505';
    END IF;

    -- Validação do nickname
    v_clean_nickname := private.validate_customer_nickname(p_nickname);

    -- Verificação de unicidade case-insensitive
    IF EXISTS (
        SELECT 1 
        FROM public.customer_profiles 
        WHERE lower(trim(nickname)) = lower(v_clean_nickname)
    ) THEN
        RAISE EXCEPTION 'NICKNAME_ALREADY_TAKEN' USING ERRCODE = '23505';
    END IF;

    INSERT INTO public.customer_profiles (
        id,
        nickname,
        status,
        created_at,
        updated_at
    ) VALUES (
        v_user_id,
        v_clean_nickname,
        'ACTIVE',
        NOW(),
        NOW()
    )
    RETURNING * INTO v_profile;

    RETURN jsonb_build_object(
        'success', true,
        'customerId', v_profile.id,
        'nickname', v_profile.nickname,
        'status', v_profile.status,
        'createdAt', v_profile.created_at,
        'updatedAt', v_profile.updated_at
    );
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_customer_create_profile(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_customer_create_profile(TEXT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 6. RPC DE CONSULTA DO PERFIL DO CLIENTE (rpc_customer_get_profile)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_customer_get_profile()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
DECLARE
    v_user_id UUID;
    v_profile RECORD;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_profile
    FROM public.customer_profiles
    WHERE id = v_user_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'code', 'PROFILE_NOT_FOUND');
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'customerId', v_profile.id,
        'nickname', v_profile.nickname,
        'status', v_profile.status,
        'createdAt', v_profile.created_at,
        'updatedAt', v_profile.updated_at
    );
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_customer_get_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_customer_get_profile() TO authenticated;

-- -----------------------------------------------------------------------------
-- 7. RPC DE ATUALIZAÇÃO DO NICKNAME (rpc_customer_update_nickname)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_customer_update_nickname(p_nickname TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
DECLARE
    v_user_id UUID;
    v_clean_nickname TEXT;
    v_profile RECORD;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = '42501';
    END IF;

    -- Validação do novo nickname
    v_clean_nickname := private.validate_customer_nickname(p_nickname);

    -- Verificação de colisão com outros clientes
    IF EXISTS (
        SELECT 1 
        FROM public.customer_profiles 
        WHERE lower(trim(nickname)) = lower(v_clean_nickname)
          AND id <> v_user_id
    ) THEN
        RAISE EXCEPTION 'NICKNAME_ALREADY_TAKEN' USING ERRCODE = '23505';
    END IF;

    UPDATE public.customer_profiles
    SET nickname = v_clean_nickname,
        updated_at = NOW()
    WHERE id = v_user_id
    RETURNING * INTO v_profile;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'PROFILE_NOT_FOUND' USING ERRCODE = 'P0002';
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'customerId', v_profile.id,
        'nickname', v_profile.nickname,
        'status', v_profile.status,
        'createdAt', v_profile.created_at,
        'updatedAt', v_profile.updated_at
    );
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_customer_update_nickname(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_customer_update_nickname(TEXT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 8. RPC ADMINISTRATIVA DO GESTOR (rpc_manager_list_customers)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_manager_list_customers()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
DECLARE
    v_result JSONB;
BEGIN
    -- Exige papel ativo de gestor (OWNER ou ADMIN)
    PERFORM private.require_active_manager();

    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'customerId', cp.id,
            'nickname', cp.nickname,
            'status', cp.status,
            'createdAt', cp.created_at,
            'updatedAt', cp.updated_at,
            'licensesCount', (
                SELECT count(*)::int 
                FROM public.licenses l 
                WHERE l.customer_id = cp.id
            )
        ) ORDER BY cp.created_at DESC
    ), '[]'::jsonb)
    INTO v_result
    FROM public.customer_profiles cp;

    RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_manager_list_customers() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_manager_list_customers() TO authenticated;
