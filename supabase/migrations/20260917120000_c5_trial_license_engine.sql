-- =============================================================================
-- Xandeflix Prebuilt — C5 Trial License Engine Schema & Functions
--
-- Migration canônica local para o motor de licenças de Trial:
-- Regras de 7 dias, ativação atômica no primeiro pareamento bem-sucedido,
-- política anti-reuso (1 trial por conta de cliente) e autoridade server-side
-- de avaliação de entitlement comercial.
--
-- Princípios Canônicos:
-- - TRIAL_PERIOD_DAYS=7: Duração de exatamente 7 dias corridos.
-- - FIRST_SUCCESSFUL_PAIRING_TRIGGER: O trial inicia exclusivamente quando um
--   dispositivo é pareado com sucesso; NUNCA no signup, installation ou pairing request.
-- - CONTROL_PLANE_SERVER_TIME: Expiração e início utilizam estritamente o relógio do servidor (NOW()).
-- - ONE_TRIAL_PER_CUSTOMER_ACCOUNT: Cada conta de cliente possui direito a no máximo um período de trial.
-- - ACCOUNT_ONLY_MVP: Escopo de privacidade baseado na conta comercial (sem fingerprint de hardware).
-- - ATOMIC_WITH_PAIRING: Ativação do trial ocorre na mesma transação atômica do consumo do pareamento.
-- - PRESERVE_DATA_ON_EXPIRY: Dispositivo, instalação, catálogo local e configurações são preservados após a expiração.
-- - FAIL_CLOSED_EXPIRY: Avaliação de acesso comercial nega acesso assim que NOW() >= trial_expires_at.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. PREPARAÇÃO DA TABELA DE LICENÇAS (public.licenses)
-- -----------------------------------------------------------------------------

-- 1a. Atualização da restrição de status para incluir TRIAL e SUSPENDED
DO $$
BEGIN
    ALTER TABLE public.licenses DROP CONSTRAINT IF EXISTS licenses_status_check;
    ALTER TABLE public.licenses
        ADD CONSTRAINT licenses_status_check
        CHECK (status IN ('TRIAL', 'ACTIVE', 'REVOKED', 'EXPIRED', 'SUSPENDED'));
END $$;

-- 1b. Adição dos campos de controle de Trial
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'licenses' AND column_name = 'trial_eligible'
    ) THEN
        ALTER TABLE public.licenses
            ADD COLUMN trial_eligible BOOLEAN NOT NULL DEFAULT false;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'licenses' AND column_name = 'trial_started_at'
    ) THEN
        ALTER TABLE public.licenses
            ADD COLUMN trial_started_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'licenses' AND column_name = 'trial_expires_at'
    ) THEN
        ALTER TABLE public.licenses
            ADD COLUMN trial_expires_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'licenses' AND column_name = 'max_concurrent_sessions'
    ) THEN
        ALTER TABLE public.licenses
            ADD COLUMN max_concurrent_sessions INTEGER NOT NULL DEFAULT 1 CHECK (max_concurrent_sessions >= 1);
    END IF;
END $$;

-- Índices otimizados para busca de status e expiração de trial
CREATE INDEX IF NOT EXISTS idx_licenses_trial_expires_at
    ON public.licenses (trial_expires_at)
    WHERE status = 'TRIAL';

CREATE INDEX IF NOT EXISTS idx_licenses_trial_eligible
    ON public.licenses (trial_eligible)
    WHERE trial_eligible = true;

-- Garante que escrita direta em public.licenses permaneça revogada para anon e authenticated
REVOKE ALL ON TABLE public.licenses FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.licenses TO authenticated;

-- -----------------------------------------------------------------------------
-- 2. PREPARAÇÃO DA TABELA DE PERFIS DE CLIENTE (public.customer_profiles)
-- -----------------------------------------------------------------------------

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'customer_profiles' AND column_name = 'trial_used_at'
    ) THEN
        ALTER TABLE public.customer_profiles
            ADD COLUMN trial_used_at TIMESTAMPTZ;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_customer_profiles_trial_used_at
    ON public.customer_profiles (trial_used_at)
    WHERE trial_used_at IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 3. TRIGGER DE SEGURANÇA CONTRA MANIPULAÇÃO DIRETA DE TRIAL PELO CLIENTE
-- -----------------------------------------------------------------------------

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

    -- Proíbe alteração de trial_used_at pelo próprio cliente
    IF NEW.trial_used_at IS DISTINCT FROM OLD.trial_used_at 
       AND auth.uid() = OLD.id 
       AND COALESCE(current_setting('private.system_trial_mutation', true), 'false') <> 'true' THEN
        RAISE EXCEPTION 'CUSTOMER_TRIAL_USED_SELF_MUTATION_DENIED' USING ERRCODE = '42501';
    END IF;

    -- Atualiza updated_at no servidor
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- 4. FUNÇÃO SERVER-SIDE ATÔMICA DE INÍCIO DE TRIAL (private.start_trial_if_eligible)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.start_trial_if_eligible(
    p_license_id UUID,
    p_customer_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, extensions, private
AS $$
DECLARE
    v_license RECORD;
    v_customer RECORD;
    v_now TIMESTAMPTZ := NOW();
    v_expires_at TIMESTAMPTZ;
BEGIN
    IF p_license_id IS NULL THEN
        RAISE EXCEPTION 'LICENSE_ID_REQUIRED' USING ERRCODE = '22023';
    END IF;
    IF p_customer_id IS NULL THEN
        RAISE EXCEPTION 'CUSTOMER_ID_REQUIRED' USING ERRCODE = '22023';
    END IF;

    -- Lock pessimista na licença para sincronização estrita
    SELECT * INTO v_license
    FROM public.licenses
    WHERE id = p_license_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'INVALID_LICENSE' USING ERRCODE = '22023';
    END IF;

    -- Lock pessimista no perfil do cliente
    SELECT * INTO v_customer
    FROM public.customer_profiles
    WHERE id = p_customer_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'CUSTOMER_PROFILE_NOT_FOUND' USING ERRCODE = '42501';
    END IF;

    -- 1. Se a licença não for elegível a trial, não altera
    IF NOT COALESCE(v_license.trial_eligible, false) THEN
        RETURN jsonb_build_object(
            'trialStarted', false,
            'reason', 'LICENSE_NOT_TRIAL_ELIGIBLE',
            'status', v_license.status
        );
    END IF;

    -- 2. Se a licença já estiver ACTIVE e não for trial em andamento, não altera para TRIAL
    IF v_license.status = 'ACTIVE' AND v_license.trial_started_at IS NULL THEN
        RETURN jsonb_build_object(
            'trialStarted', false,
            'reason', 'LICENSE_ALREADY_ACTIVE',
            'status', v_license.status
        );
    END IF;

    -- 3. Se a licença já iniciou trial, preserva timestamps e limites existentes (NO_DOUBLE_EXTENSION)
    IF v_license.trial_started_at IS NOT NULL THEN
        RETURN jsonb_build_object(
            'trialStarted', false,
            'reason', 'TRIAL_ALREADY_STARTED_FOR_LICENSE',
            'status', v_license.status,
            'trialStartedAt', v_license.trial_started_at,
            'trialExpiresAt', v_license.trial_expires_at
        );
    END IF;

    -- 4. Política Anti-Reuso: ONE_TRIAL_PER_CUSTOMER_ACCOUNT
    -- Se o cliente já consumiu trial anteriormente em qualquer licença, bloqueia novo trial
    IF v_customer.trial_used_at IS NOT NULL THEN
        RETURN jsonb_build_object(
            'trialStarted', false,
            'reason', 'TRIAL_ALREADY_USED_BY_CUSTOMER',
            'status', v_license.status
        );
    END IF;

    -- 5. Início do Trial: Cálculo exclusivamente baseado no Server Time (NOW())
    v_expires_at := v_now + INTERVAL '7 days';

    UPDATE public.licenses
    SET status = 'TRIAL',
        trial_started_at = v_now,
        trial_expires_at = v_expires_at,
        max_devices = 1,
        max_concurrent_sessions = 1
    WHERE id = v_license.id;

    -- Registra o consumo único na conta do cliente com autorização server-side
    PERFORM set_config('private.system_trial_mutation', 'true', true);
    UPDATE public.customer_profiles
    SET trial_used_at = v_now,
        updated_at = v_now
    WHERE id = v_customer.id;
    PERFORM set_config('private.system_trial_mutation', 'false', true);

    RETURN jsonb_build_object(
        'trialStarted', true,
        'status', 'TRIAL',
        'trialStartedAt', v_now,
        'trialExpiresAt', v_expires_at,
        'maxDevices', 1,
        'maxConcurrentSessions', 1
    );
END;
$$;

REVOKE ALL ON FUNCTION private.start_trial_if_eligible(UUID, UUID) FROM PUBLIC, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 5. AVALIAÇÃO CANÔNICA DE ACESSO COMERCIAL (private.evaluate_license_access)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.evaluate_license_access(
    p_license_id UUID,
    p_device_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, extensions, private
AS $$
DECLARE
    v_license RECORD;
    v_device RECORD;
    v_now TIMESTAMPTZ := NOW();
BEGIN
    IF p_license_id IS NULL THEN
        RETURN jsonb_build_object(
            'accessAllowed', false,
            'code', 'INVALID_LICENSE',
            'message', 'Identificador de licença ausente.'
        );
    END IF;

    SELECT * INTO v_license
    FROM public.licenses
    WHERE id = p_license_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'accessAllowed', false,
            'code', 'INVALID_LICENSE',
            'message', 'Licença não encontrada.'
        );
    END IF;

    -- 1. Se especificado dispositivo, valida vínculo e autorização
    IF p_device_id IS NOT NULL THEN
        SELECT * INTO v_device
        FROM public.devices
        WHERE device_id = p_device_id;

        IF NOT FOUND OR v_device.status <> 'AUTHORIZED' THEN
            RETURN jsonb_build_object(
                'accessAllowed', false,
                'code', 'DEVICE_NOT_AUTHORIZED',
                'licenseStatus', v_license.status,
                'message', 'Dispositivo não autorizado para reprodução.'
            );
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM public.license_devices 
            WHERE license_id = p_license_id AND device_id = p_device_id AND status = 'ACTIVE'
        ) THEN
            RETURN jsonb_build_object(
                'accessAllowed', false,
                'code', 'DEVICE_NOT_AUTHORIZED',
                'licenseStatus', v_license.status,
                'message', 'Dispositivo não vinculado a esta licença.'
            );
        END IF;
    END IF;

    -- 2. Avaliação de Status da Licença
    IF v_license.status = 'REVOKED' THEN
        RETURN jsonb_build_object(
            'accessAllowed', false,
            'code', 'LICENSE_REVOKED',
            'licenseStatus', 'REVOKED',
            'message', 'Licença revogada administrativamente.'
        );
    ELSIF v_license.status = 'SUSPENDED' THEN
        RETURN jsonb_build_object(
            'accessAllowed', false,
            'code', 'LICENSE_SUSPENDED',
            'licenseStatus', 'SUSPENDED',
            'message', 'Licença suspensa temporariamente.'
        );
    ELSIF v_license.status = 'EXPIRED' THEN
        RETURN jsonb_build_object(
            'accessAllowed', false,
            'code', 'LICENSE_EXPIRED',
            'licenseStatus', 'EXPIRED',
            'message', 'Período da licença expirado.'
        );
    ELSIF v_license.status = 'TRIAL' THEN
        -- Se ainda não tiver iniciado (não deveria acontecer em status TRIAL, mas fail-closed)
        IF v_license.trial_started_at IS NULL THEN
            RETURN jsonb_build_object(
                'accessAllowed', false,
                'code', 'TRIAL_NOT_STARTED',
                'licenseStatus', 'TRIAL',
                'message', 'Período de teste ainda não foi iniciado.'
            );
        END IF;

        -- Avaliação determinística baseada no tempo do servidor
        IF v_license.trial_expires_at IS NOT NULL AND v_now >= v_license.trial_expires_at THEN
            -- Atualização preguiçosa (lazy persistence) para EXPIRED
            UPDATE public.licenses
            SET status = 'EXPIRED'
            WHERE id = v_license.id AND status = 'TRIAL';

            RETURN jsonb_build_object(
                'accessAllowed', false,
                'code', 'TRIAL_EXPIRED',
                'licenseStatus', 'EXPIRED',
                'isTrial', true,
                'trialStartedAt', v_license.trial_started_at,
                'trialExpiresAt', v_license.trial_expires_at,
                'serverTime', v_now,
                'message', 'Seu período de teste de 7 dias terminou.'
            );
        END IF;

        -- Trial ativo dentro do prazo de 7 dias
        RETURN jsonb_build_object(
            'accessAllowed', true,
            'code', 'ACCESS_ALLOWED',
            'licenseStatus', 'TRIAL',
            'isTrial', true,
            'trialStartedAt', v_license.trial_started_at,
            'trialExpiresAt', v_license.trial_expires_at,
            'serverTime', v_now,
            'message', 'Acesso permitido em período de teste.'
        );
    ELSIF v_license.status = 'ACTIVE' THEN
        -- Licença regular/paga ou gerenciada legada
        IF v_license.expires_at IS NOT NULL AND v_now >= v_license.expires_at THEN
            UPDATE public.licenses
            SET status = 'EXPIRED'
            WHERE id = v_license.id AND status = 'ACTIVE';

            RETURN jsonb_build_object(
                'accessAllowed', false,
                'code', 'LICENSE_EXPIRED',
                'licenseStatus', 'EXPIRED',
                'serverTime', v_now,
                'message', 'Licença ativa atingiu a data de expiração.'
            );
        END IF;

        RETURN jsonb_build_object(
            'accessAllowed', true,
            'code', 'ACCESS_ALLOWED',
            'licenseStatus', 'ACTIVE',
            'isTrial', false,
            'serverTime', v_now,
            'message', 'Acesso comercial autorizado.'
        );
    ELSE
        RETURN jsonb_build_object(
            'accessAllowed', false,
            'code', 'UNKNOWN_STATUS',
            'licenseStatus', v_license.status,
            'message', 'Status de licença desconhecido.'
        );
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION private.evaluate_license_access(UUID, TEXT) FROM PUBLIC, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 6. RPC PÚBLICA DE AVALIAÇÃO DE ACESSO (rpc_evaluate_license_access)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.rpc_evaluate_license_access(
    p_license_id UUID,
    p_device_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, extensions, private
AS $$
BEGIN
    RETURN private.evaluate_license_access(p_license_id, p_device_id);
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_evaluate_license_access(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_evaluate_license_access(UUID, TEXT) TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- 7. ATUALIZAÇÃO ATÔMICA DA RPC DE PAREAMENTO (rpc_customer_pair_device)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.rpc_customer_pair_device(
    p_display_code TEXT,
    p_pairing_code TEXT,
    p_device_label TEXT DEFAULT NULL,
    p_license_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, extensions, private
AS $$
DECLARE
    v_customer_id UUID;
    v_clean_display_code VARCHAR(32);
    v_clean_pairing_code VARCHAR(16);
    v_clean_label VARCHAR(100);
    v_license_id UUID;
    v_license RECORD;
    v_req RECORD;
    v_active_devices_count INTEGER;
    v_trial_result JSONB;
BEGIN
    -- 1. Exige autenticação de cliente
    v_customer_id := auth.uid();
    IF v_customer_id IS NULL THEN
        RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = '42501';
    END IF;

    -- 2. Verifica existência e status do perfil de cliente
    IF NOT EXISTS (
        SELECT 1 
        FROM public.customer_profiles 
        WHERE id = v_customer_id AND status = 'ACTIVE'
    ) THEN
        RAISE EXCEPTION 'CUSTOMER_PROFILE_NOT_ACTIVE' USING ERRCODE = '42501';
    END IF;

    -- 3. Sanitização dos parâmetros
    v_clean_display_code := upper(trim(p_display_code));
    v_clean_pairing_code := trim(p_pairing_code);
    v_clean_label := NULLIF(trim(p_device_label), '');

    IF v_clean_display_code IS NULL OR length(v_clean_display_code) = 0 THEN
        RAISE EXCEPTION 'DISPLAY_CODE_REQUIRED' USING ERRCODE = '22023';
    END IF;

    IF v_clean_pairing_code IS NULL OR length(v_clean_pairing_code) = 0 THEN
        RAISE EXCEPTION 'PAIRING_CODE_REQUIRED' USING ERRCODE = '22023';
    END IF;

    -- 4. Resolução da licença elegível com lock pessimista na linha da licença
    IF p_license_id IS NOT NULL THEN
        SELECT * INTO v_license
        FROM public.licenses
        WHERE id = p_license_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'INVALID_LICENSE' USING ERRCODE = '22023';
        END IF;

        IF v_license.customer_id IS NULL OR v_license.customer_id <> v_customer_id THEN
            RAISE EXCEPTION 'UNAUTHORIZED_LICENSE_ACCESS' USING ERRCODE = '42501';
        END IF;

        -- Permite licenças com status ACTIVE ou TRIAL
        IF v_license.status NOT IN ('ACTIVE', 'TRIAL') THEN
            RAISE EXCEPTION 'LICENSE_NOT_ACTIVE' USING ERRCODE = '42501';
        END IF;

        v_license_id := v_license.id;
    ELSE
        -- Seleciona primeira licença ativa ou trial do cliente com lock pessimista
        SELECT * INTO v_license
        FROM public.licenses
        WHERE customer_id = v_customer_id AND status IN ('ACTIVE', 'TRIAL')
        ORDER BY created_at DESC
        LIMIT 1
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'NO_ELIGIBLE_LICENSE' USING ERRCODE = '42501';
        END IF;

        v_license_id := v_license.id;
    END IF;

    -- 5. Busca a solicitação de pareamento pendente com lock pessimista
    SELECT * INTO v_req
    FROM public.device_pairing_requests
    WHERE display_code = v_clean_display_code
      AND status IN ('PENDING', 'CANCELLED')
    ORDER BY created_at DESC
    LIMIT 1
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'PAIRING_NOT_FOUND' USING ERRCODE = 'P0002';
    END IF;

    -- 6. Limite de tentativas (Rate Limit / Brute-force protection)
    IF v_req.status = 'CANCELLED' THEN
        RAISE EXCEPTION 'PAIRING_ATTEMPT_LIMIT_EXCEEDED' USING ERRCODE = '42501';
    END IF;

    IF v_req.attempts_count >= 5 THEN
        UPDATE public.device_pairing_requests
        SET status = 'CANCELLED'
        WHERE pairing_id = v_req.pairing_id;

        RAISE EXCEPTION 'PAIRING_ATTEMPT_LIMIT_EXCEEDED' USING ERRCODE = '42501';
    END IF;

    -- 7. Verifica expiração temporal (TTL 600s)
    IF NOW() > v_req.expires_at THEN
        UPDATE public.device_pairing_requests
        SET status = 'EXPIRED'
        WHERE pairing_id = v_req.pairing_id;

        RAISE EXCEPTION 'PAIRING_CODE_EXPIRED' USING ERRCODE = '42501';
    END IF;

    -- 8. Valida o código de pareamento via KDF crypt()
    IF extensions.crypt(v_clean_pairing_code, v_req.pairing_code_hash) <> v_req.pairing_code_hash THEN
        UPDATE public.device_pairing_requests
        SET attempts_count = attempts_count + 1
        WHERE pairing_id = v_req.pairing_id;

        IF v_req.attempts_count + 1 >= 5 THEN
            UPDATE public.device_pairing_requests
            SET status = 'CANCELLED'
            WHERE pairing_id = v_req.pairing_id;

            RETURN jsonb_build_object(
                'success', false,
                'code', 'PAIRING_ATTEMPT_LIMIT_EXCEEDED',
                'attemptsCount', v_req.attempts_count + 1,
                'message', 'Limite de tentativas de pareamento excedido.'
            );
        END IF;

        RETURN jsonb_build_object(
            'success', false,
            'code', 'INVALID_PAIRING_CODE',
            'attemptsCount', v_req.attempts_count + 1,
            'message', 'Código de pareamento incorreto.'
        );
    END IF;

    -- 9. Enforce de max_devices na licença (public.licenses.max_devices como autoridade)
    SELECT count(*) INTO v_active_devices_count
    FROM public.license_devices
    WHERE license_id = v_license_id
      AND status = 'ACTIVE'
      AND device_id <> v_req.device_id;

    IF v_active_devices_count >= v_license.max_devices THEN
        RAISE EXCEPTION 'LICENSE_DEVICE_LIMIT_REACHED' USING ERRCODE = '42501';
    END IF;

    -- 10. Consumo Atômico de Pareamento e Dispositivo
    -- 10a. Atualiza solicitação para CONSUMED
    UPDATE public.device_pairing_requests
    SET status = 'CONSUMED',
        consumed_at = NOW(),
        consumed_by_customer_id = v_customer_id,
        linked_license_id = v_license_id,
        device_label = COALESCE(v_clean_label, v_req.device_label, 'DISPOSITIVO')
    WHERE pairing_id = v_req.pairing_id;

    -- 10b. Cria ou promove device em public.devices para AUTHORIZED
    INSERT INTO public.devices (
        device_id,
        display_code,
        device_type,
        device_label,
        status,
        device_token_hash,
        created_at,
        last_seen_at
    ) VALUES (
        v_req.device_id,
        v_req.display_code,
        COALESCE(v_req.device_type, 'TV'),
        COALESCE(v_clean_label, v_req.device_label, 'DISPOSITIVO'),
        'AUTHORIZED',
        v_req.device_token_hash,
        NOW(),
        NOW()
    )
    ON CONFLICT (device_id) DO UPDATE
    SET status = 'AUTHORIZED',
        display_code = EXCLUDED.display_code,
        device_token_hash = EXCLUDED.device_token_hash,
        device_label = EXCLUDED.device_label,
        last_seen_at = NOW();

    -- 10c. Cria/atualiza associação em public.license_devices (consome 1 slot)
    INSERT INTO public.license_devices (
        license_id,
        device_id,
        status,
        bound_at
    ) VALUES (
        v_license_id,
        v_req.device_id,
        'ACTIVE',
        NOW()
    )
    ON CONFLICT (license_id, device_id) DO UPDATE
    SET status = 'ACTIVE',
        bound_at = NOW(),
        revoked_at = NULL;

    -- 10d. Correlaciona instalação
    UPDATE public.app_installations
    SET last_seen_at = NOW()
    WHERE installation_id = v_req.installation_id;

    -- 10e. Aciona o Trial Engine de forma atômica se a licença for elegível
    v_trial_result := private.start_trial_if_eligible(v_license_id, v_customer_id);

    -- Retorna payload sanitizado com dados de pareamento e trial
    RETURN jsonb_build_object(
        'success', true,
        'pairingId', v_req.pairing_id,
        'deviceId', v_req.device_id,
        'displayCode', v_req.display_code,
        'licenseId', v_license_id,
        'customerId', v_customer_id,
        'status', 'CONSUMED',
        'deviceAuthorizationState', 'AUTHORIZED',
        'trial', v_trial_result
    );
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_customer_pair_device(TEXT, TEXT, TEXT, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_customer_pair_device(TEXT, TEXT, TEXT, UUID) TO authenticated;
