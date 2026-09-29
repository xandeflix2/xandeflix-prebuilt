-- =============================================================================
-- Xandeflix Prebuilt — C11-P4 First Trial Onboarding Fix
-- Migration: 20260918190000_c11_p4_first_trial_onboarding_fix.sql
--
-- Princípios Canônicos:
-- - FORWARD_ONLY: Corrige public.rpc_customer_pair_device sem tocar C5 histórica.
-- - FIRST_SUCCESSFUL_DEVICE_PAIRING_STARTS_TRIAL: Cliente self-service com 0 licenças
--   ativas e trial_used_at IS NULL recebe atomicamente sua licença TRIAL no primeiro
--   pareamento bem-sucedido de dispositivo.
-- - ZERO_PRE_PAIRING_TRIAL: A licença trial NUNCA é criada se o pairing code for inválido,
--   expirado ou cancelado.
-- - PESSIMISTIC_LOCKING: Lock FOR UPDATE na linha de customer_profiles garante que
--   duas requisições simultâneas nunca criem trials duplicados (EXPECTED_TRIAL_COUNT=1).
-- - ATOMIC_ROLLBACK: Se qualquer etapa falhar após a criação da licença (ex: erro de dispositivo),
--   a transação é revertida integralmente pelo PostgreSQL.
-- - EXPLICIT_LICENSE_PRESERVED: Se p_license_id for fornecido, preserva 100% a lógica de C5.
-- - EXISTING_ACTIVE_TRIAL_PRESERVED: Se o cliente já possui licença ACTIVE ou TRIAL, reusa-a.
-- - ONE_TRIAL_PER_CUSTOMER_ACCOUNT: Se o cliente já usou trial (trial_used_at IS NOT NULL) e
--   não possui licença elegível, rejeita com NO_ELIGIBLE_LICENSE.
-- =============================================================================

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
    v_customer RECORD;
    v_clean_display_code VARCHAR(32);
    v_clean_pairing_code VARCHAR(16);
    v_clean_label VARCHAR(100);
    v_license_id UUID;
    v_license RECORD;
    v_req RECORD;
    v_active_devices_count INTEGER;
    v_trial_result JSONB;
    v_new_trial_created BOOLEAN := false;
    v_now TIMESTAMPTZ := NOW();
    v_expires_at TIMESTAMPTZ;
    v_license_key_hash VARCHAR(64);
BEGIN
    -- 1. Exige autenticação de cliente
    v_customer_id := auth.uid();
    IF v_customer_id IS NULL THEN
        RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = '42501';
    END IF;

    -- 2. Sanitização dos parâmetros
    v_clean_display_code := upper(trim(p_display_code));
    v_clean_pairing_code := trim(p_pairing_code);
    v_clean_label := NULLIF(trim(p_device_label), '');

    IF v_clean_display_code IS NULL OR length(v_clean_display_code) = 0 THEN
        RAISE EXCEPTION 'DISPLAY_CODE_REQUIRED' USING ERRCODE = '22023';
    END IF;

    IF v_clean_pairing_code IS NULL OR length(v_clean_pairing_code) = 0 THEN
        RAISE EXCEPTION 'PAIRING_CODE_REQUIRED' USING ERRCODE = '22023';
    END IF;

    -- 3. Lock pessimista no perfil do cliente para proteção estrita de concorrência
    SELECT * INTO v_customer
    FROM public.customer_profiles
    WHERE id = v_customer_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'CUSTOMER_PROFILE_NOT_FOUND' USING ERRCODE = '42501';
    END IF;

    IF v_customer.status <> 'ACTIVE' THEN
        RAISE EXCEPTION 'CUSTOMER_PROFILE_NOT_ACTIVE' USING ERRCODE = '42501';
    END IF;

    -- 4. Busca a solicitação de pareamento pendente com lock pessimista
    -- Validada ANTES de qualquer criação de licença para evitar efeitos colaterais
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

    -- 5. Limite de tentativas (Rate Limit / Brute-force protection)
    IF v_req.status = 'CANCELLED' THEN
        RAISE EXCEPTION 'PAIRING_ATTEMPT_LIMIT_EXCEEDED' USING ERRCODE = '42501';
    END IF;

    IF v_req.attempts_count >= 5 THEN
        UPDATE public.device_pairing_requests
        SET status = 'CANCELLED'
        WHERE pairing_id = v_req.pairing_id;

        RAISE EXCEPTION 'PAIRING_ATTEMPT_LIMIT_EXCEEDED' USING ERRCODE = '42501';
    END IF;

    -- 6. Verifica expiração temporal (TTL 600s)
    IF NOW() > v_req.expires_at THEN
        UPDATE public.device_pairing_requests
        SET status = 'EXPIRED'
        WHERE pairing_id = v_req.pairing_id;

        RAISE EXCEPTION 'PAIRING_CODE_EXPIRED' USING ERRCODE = '42501';
    END IF;

    -- 7. Valida o código de pareamento via KDF crypt() ANTES de criar licença
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

    -- 8. Resolução e Provisionamento Atômico de Licença
    IF p_license_id IS NOT NULL THEN
        -- Preserva comportamento existente quando p_license_id é informado explicitamente
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

        IF v_license.status NOT IN ('ACTIVE', 'TRIAL') THEN
            RAISE EXCEPTION 'LICENSE_NOT_ACTIVE' USING ERRCODE = '42501';
        END IF;

        v_license_id := v_license.id;
        v_new_trial_created := false;
    ELSE
        -- p_license_id IS NULL
        -- A) Procurar licença ACTIVE/TRIAL existente sob o lock
        SELECT * INTO v_license
        FROM public.licenses
        WHERE customer_id = v_customer_id AND status IN ('ACTIVE', 'TRIAL')
        ORDER BY created_at DESC
        LIMIT 1
        FOR UPDATE;

        IF FOUND THEN
            -- Reutiliza licença existente (não cria nova trial)
            v_license_id := v_license.id;
            v_new_trial_created := false;
        ELSE
            -- B) Cliente não possui licença ACTIVE/TRIAL
            -- Revalida sob o lock pessimista se o cliente já utilizou trial nesta conta
            IF v_customer.trial_used_at IS NOT NULL THEN
                RAISE EXCEPTION 'NO_ELIGIBLE_LICENSE' USING ERRCODE = '42501';
            END IF;

            -- Provisiona atomicamente a licença de Trial de 7 dias
            v_now := NOW();
            v_expires_at := v_now + INTERVAL '7 days';
            v_license_id := gen_random_uuid();
            v_license_key_hash := encode(sha256(('TRIAL_' || v_customer_id::text || '_' || v_license_id::text || '_' || extract(epoch from v_now)::text)::bytea), 'hex');

            INSERT INTO public.licenses (
                id,
                license_key_hash,
                mode,
                status,
                trial_eligible,
                trial_started_at,
                trial_expires_at,
                max_devices,
                max_concurrent_sessions,
                customer_id,
                created_at
            ) VALUES (
                v_license_id,
                v_license_key_hash,
                'SELF_SERVICE',
                'TRIAL',
                true,
                v_now,
                v_expires_at,
                1,
                1,
                v_customer_id,
                v_now
            )
            RETURNING * INTO v_license;

            -- Registra o consumo do trial no perfil do cliente com autorização server-side
            PERFORM set_config('private.system_trial_mutation', 'true', true);
            UPDATE public.customer_profiles
            SET trial_used_at = v_now,
                updated_at = v_now
            WHERE id = v_customer_id;
            PERFORM set_config('private.system_trial_mutation', 'false', true);

            v_new_trial_created := true;
        END IF;
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

    -- 10e. Aciona Trial Engine para licenças pré-existentes ou monta o payload da nova trial
    IF v_new_trial_created THEN
        v_trial_result := jsonb_build_object(
            'trialStarted', true,
            'status', 'TRIAL',
            'trialStartedAt', v_license.trial_started_at,
            'trialExpiresAt', v_license.trial_expires_at,
            'maxDevices', v_license.max_devices,
            'maxConcurrentSessions', v_license.max_concurrent_sessions
        );
    ELSE
        v_trial_result := private.start_trial_if_eligible(v_license_id, v_customer_id);
    END IF;

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
