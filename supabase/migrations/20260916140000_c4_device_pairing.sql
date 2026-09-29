-- =============================================================================
-- Xandeflix Prebuilt — C4 Device Pairing Schema & RPCs (Reconciled C4R)
--
-- Migration canônica local para o pareamento seguro de dispositivos:
-- Device Pairing (Pre-Auth, 6-digit numeric code, TTL 600s, Attempt Limit 5,
-- Adaptive KDF via pgcrypto crypt/bcrypt at-rest, Temporary Pairing Capability Secret,
-- Single-Use, No MAC/Hardware IDs, Pessimistic Row Lock for Concurrency).
--
-- Princípios Canônicos:
-- - CANONICAL_SEPARATION:
--     AUTH USER != CUSTOMER
--     CUSTOMER != INSTALLATION
--     INSTALLATION != DEVICE
--     DEVICE != LICENSE
-- - NO_HARDWARE_IDS: Sem MAC, IMEI, Android ID, número de série ou fingerprint.
-- - DEVICE_TOKEN_AUTHORITY: CLIENT_GENERATED_RAW_SERVER_STORES_HASH
-- - PAIRING_PRE_AUTH: Request existe antes de public.devices possuir device autorizado.
-- - NO_PREMATURE_SLOT_CONSUMPTION: Request pendente não consome slot de licença.
-- - PAIRING_CODE_SECURITY: KDF adaptativo via crypt() pgcrypto (Blowfish salt único por linha).
-- - PAIRING_STATUS_SECURITY: Capability token temporária (pairing_status_secret_hash) — device token hash nunca é bearer.
-- - ATTEMPT_LIMIT: Máximo de 5 tentativas por request de pareamento.
-- - TRIAL_DEFERRED_TO_C5: Nenhuma alteração em trial_started_at ou trial_expires_at.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. TABELA DE SOLICITAÇÕES DE PAREAMENTO (public.device_pairing_requests)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.device_pairing_requests (
    pairing_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    installation_id UUID NOT NULL REFERENCES public.app_installations(installation_id) ON DELETE CASCADE,
    device_id VARCHAR(64) NOT NULL,
    display_code VARCHAR(32) NOT NULL,
    device_token_hash VARCHAR(64) NOT NULL,
    pairing_code_hash VARCHAR(100) NOT NULL,
    pairing_status_secret_hash VARCHAR(64) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONSUMED', 'EXPIRED', 'CANCELLED')),
    attempts_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ,
    consumed_by_customer_id UUID REFERENCES public.customer_profiles(id) ON DELETE SET NULL,
    linked_license_id UUID REFERENCES public.licenses(id) ON DELETE SET NULL,
    device_label VARCHAR(100),
    device_type VARCHAR(20) NOT NULL DEFAULT 'TV' CHECK (device_type IN ('TV', 'PHONE', 'TABLET', 'PC', 'OTHER'))
);

CREATE INDEX IF NOT EXISTS idx_pairing_requests_display_code 
    ON public.device_pairing_requests(display_code, status);

CREATE INDEX IF NOT EXISTS idx_pairing_requests_device_id 
    ON public.device_pairing_requests(device_id);

CREATE INDEX IF NOT EXISTS idx_pairing_requests_expires_at 
    ON public.device_pairing_requests(expires_at);

-- -----------------------------------------------------------------------------
-- 2. SEGURANÇA E RESTRIÇÃO DE ACESSO (RLS)
-- -----------------------------------------------------------------------------
ALTER TABLE public.device_pairing_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.device_pairing_requests FROM PUBLIC, anon, authenticated;

-- Leitura e mutações são mediadas exclusivamente por RPCs com SECURITY DEFINER

-- -----------------------------------------------------------------------------
-- 3. RPC DE SOLICITAÇÃO DE PAREAMENTO (rpc_request_device_pairing)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_request_device_pairing(
    p_installation_id UUID,
    p_device_id TEXT,
    p_display_code TEXT,
    p_device_token_hash TEXT,
    p_device_type TEXT DEFAULT 'TV',
    p_device_label TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, extensions, private
AS $$
DECLARE
    v_clean_device_id VARCHAR(64);
    v_clean_display_code VARCHAR(32);
    v_clean_token_hash VARCHAR(64);
    v_clean_type VARCHAR(20);
    v_clean_label VARCHAR(100);
    v_raw_code TEXT;
    v_code_hash VARCHAR(100);
    v_status_secret TEXT;
    v_status_secret_hash VARCHAR(64);
    v_pairing_id UUID;
    v_expires_at TIMESTAMPTZ;
    v_existing_status VARCHAR(30);
BEGIN
    -- 1. Validações de entrada
    IF p_installation_id IS NULL THEN
        RAISE EXCEPTION 'INSTALLATION_ID_REQUIRED' USING ERRCODE = '22023';
    END IF;

    v_clean_device_id := trim(p_device_id);
    v_clean_display_code := upper(trim(p_display_code));
    v_clean_token_hash := trim(p_device_token_hash);
    v_clean_type := upper(trim(COALESCE(p_device_type, 'TV')));
    v_clean_label := NULLIF(trim(p_device_label), '');

    IF v_clean_device_id IS NULL OR length(v_clean_device_id) = 0 THEN
        RAISE EXCEPTION 'DEVICE_ID_REQUIRED' USING ERRCODE = '22023';
    END IF;

    IF v_clean_display_code IS NULL OR length(v_clean_display_code) = 0 THEN
        RAISE EXCEPTION 'DISPLAY_CODE_REQUIRED' USING ERRCODE = '22023';
    END IF;

    IF v_clean_token_hash IS NULL OR length(v_clean_token_hash) = 0 THEN
        RAISE EXCEPTION 'DEVICE_TOKEN_HASH_REQUIRED' USING ERRCODE = '22023';
    END IF;

    IF v_clean_type NOT IN ('TV', 'PHONE', 'TABLET', 'PC', 'OTHER') THEN
        v_clean_type := 'TV';
    END IF;

    -- 2. Verifica existência da instalação
    IF NOT EXISTS (SELECT 1 FROM public.app_installations WHERE installation_id = p_installation_id) THEN
        RAISE EXCEPTION 'INSTALLATION_NOT_FOUND' USING ERRCODE = '22023';
    END IF;

    -- 3. Verifica se dispositivo já existe e está em estado conflitante
    SELECT status INTO v_existing_status FROM public.devices WHERE device_id = v_clean_device_id;
    IF v_existing_status = 'REVOKED' THEN
        RAISE EXCEPTION 'DEVICE_REVOKED_REQUIRES_REACTIVATION' USING ERRCODE = '42501';
    END IF;
    IF v_existing_status = 'AUTHORIZED' THEN
        RAISE EXCEPTION 'DEVICE_ALREADY_PAIRED' USING ERRCODE = '42501';
    END IF;

    -- 4. Cancela quaisquer solicitações anteriores pendentes para este display_code ou device_id
    UPDATE public.device_pairing_requests
    SET status = 'CANCELLED'
    WHERE (device_id = v_clean_device_id OR display_code = v_clean_display_code)
      AND status = 'PENDING';

    -- 5. Gera código numérico de 6 dígitos aleatório (100000..999999)
    v_raw_code := lpad(floor(100000 + random() * 900000)::text, 6, '0');
    -- KDF adaptativo via crypt() com salt Blowfish único por linha (impede rainbow tables e brute-force)
    v_code_hash := extensions.crypt(v_raw_code, extensions.gen_salt('bf', 8));
    -- Capability específica de pareamento temporária (192 bits de entropia)
    v_status_secret := encode(extensions.gen_random_bytes(24), 'hex');
    v_status_secret_hash := encode(sha256(v_status_secret::bytea), 'hex');
    v_expires_at := NOW() + INTERVAL '600 seconds'; -- TTL: exatamente 10 minutos

    -- 6. Cria registro da solicitação de pareamento
    INSERT INTO public.device_pairing_requests (
        installation_id,
        device_id,
        display_code,
        device_token_hash,
        pairing_code_hash,
        pairing_status_secret_hash,
        status,
        attempts_count,
        created_at,
        expires_at,
        device_type,
        device_label
    ) VALUES (
        p_installation_id,
        v_clean_device_id,
        v_clean_display_code,
        v_clean_token_hash,
        v_code_hash,
        v_status_secret_hash,
        'PENDING',
        0,
        NOW(),
        v_expires_at,
        v_clean_type,
        v_clean_label
    )
    RETURNING pairing_id INTO v_pairing_id;

    -- Retorna o raw pairing code e a pairing capability UMA ÚNICA VEZ ao dispositivo requerente
    RETURN jsonb_build_object(
        'success', true,
        'pairingId', v_pairing_id,
        'pairingCode', v_raw_code,
        'pairingStatusSecret', v_status_secret,
        'displayCode', v_clean_display_code,
        'expiresAt', v_expires_at,
        'status', 'PENDING'
    );
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_request_device_pairing(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_request_device_pairing(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- 4. RPC DE CONSULTA DE STATUS DO PAREAMENTO (rpc_check_pairing_status)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_check_pairing_status(
    p_pairing_id UUID,
    p_device_id TEXT,
    p_pairing_status_secret TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, extensions, private
AS $$
DECLARE
    v_req RECORD;
    v_input_secret_hash VARCHAR(64);
    v_current_status VARCHAR(20);
BEGIN
    IF p_pairing_id IS NULL THEN
        RAISE EXCEPTION 'PAIRING_ID_REQUIRED' USING ERRCODE = '22023';
    END IF;

    IF p_pairing_status_secret IS NULL OR length(trim(p_pairing_status_secret)) = 0 THEN
        RAISE EXCEPTION 'PAIRING_STATUS_SECRET_REQUIRED' USING ERRCODE = '22023';
    END IF;

    SELECT * INTO v_req
    FROM public.device_pairing_requests
    WHERE pairing_id = p_pairing_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'code', 'PAIRING_NOT_FOUND');
    END IF;

    -- Validação de capability temporária específica de pareamento (NÃO usa device_token_hash como bearer)
    v_input_secret_hash := encode(sha256(trim(p_pairing_status_secret)::bytea), 'hex');
    IF v_req.device_id <> trim(p_device_id) OR v_req.pairing_status_secret_hash <> v_input_secret_hash THEN
        RAISE EXCEPTION 'PAIRING_CAPABILITY_INVALID' USING ERRCODE = '42501';
    END IF;

    v_current_status := v_req.status;

    -- Expiração em runtime baseada no server time
    IF v_current_status = 'PENDING' AND NOW() > v_req.expires_at THEN
        UPDATE public.device_pairing_requests
        SET status = 'EXPIRED'
        WHERE pairing_id = p_pairing_id;
        
        v_current_status := 'EXPIRED';
    END IF;

    IF v_current_status = 'CONSUMED' THEN
        RETURN jsonb_build_object(
            'success', true,
            'pairingId', v_req.pairing_id,
            'status', 'CONSUMED',
            'deviceAuthorizationState', 'AUTHORIZED',
            'licenseId', v_req.linked_license_id,
            'consumedAt', v_req.consumed_at
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'pairingId', v_req.pairing_id,
        'status', v_current_status,
        'expiresAt', v_req.expires_at
    );
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_check_pairing_status(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_check_pairing_status(UUID, TEXT, TEXT) TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- 5. RPC DE CONSUMO DO PAREAMENTO PELO CLIENTE (rpc_customer_pair_device)
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
    -- Impede race condition quando múltiplos pareamentos competem pelo último slot disponível
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

        IF v_license.status <> 'ACTIVE' THEN
            RAISE EXCEPTION 'LICENSE_NOT_ACTIVE' USING ERRCODE = '42501';
        END IF;

        v_license_id := v_license.id;
    ELSE
        -- Seleciona primeira licença ativa do cliente com lock pessimista
        SELECT * INTO v_license
        FROM public.licenses
        WHERE customer_id = v_customer_id AND status = 'ACTIVE'
        ORDER BY created_at DESC
        LIMIT 1
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'NO_ELIGIBLE_LICENSE' USING ERRCODE = '42501';
        END IF;

        v_license_id := v_license.id;
    END IF;

    -- 5. Busca a solicitação de pareamento pendente ou cancelada com lock pessimista
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

    -- 6. Verifica limite de tentativas (Rate Limit / Brute-force protection)
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

    -- 8. Valida o código de pareamento via KDF adaptativo crypt()
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

    -- 9. Enforce de max_devices na licença:
    -- Autoridade do limite: public.licenses.max_devices
    -- Autoridade da relação de slots: public.license_devices
    SELECT count(*) INTO v_active_devices_count
    FROM public.license_devices
    WHERE license_id = v_license_id
      AND status = 'ACTIVE'
      AND device_id <> v_req.device_id;

    IF v_active_devices_count >= v_license.max_devices THEN
        RAISE EXCEPTION 'LICENSE_DEVICE_LIMIT_REACHED' USING ERRCODE = '42501';
    END IF;

    -- 10. Consumo Atômico:
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

    -- 10d. Correlaciona a instalação sem transformá-la em device
    UPDATE public.app_installations
    SET last_seen_at = NOW()
    WHERE installation_id = v_req.installation_id;

    -- Retorna payload sanitizado
    RETURN jsonb_build_object(
        'success', true,
        'pairingId', v_req.pairing_id,
        'deviceId', v_req.device_id,
        'displayCode', v_req.display_code,
        'licenseId', v_license_id,
        'customerId', v_customer_id,
        'status', 'CONSUMED',
        'deviceAuthorizationState', 'AUTHORIZED'
    );
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_customer_pair_device(TEXT, TEXT, TEXT, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_customer_pair_device(TEXT, TEXT, TEXT, UUID) TO authenticated;
