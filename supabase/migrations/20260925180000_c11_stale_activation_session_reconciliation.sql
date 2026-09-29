-- =============================================================================
-- Migration: 20260925180000_c11_stale_activation_session_reconciliation.sql
-- Description:
-- 1. Updates public.rpc_check_device_activation_status:
--    - Preserves strict caller capability validation (activation_id, device_id, secret hash)
--    - If status = 'CONSUMED', returns canonical payload as before
--    - If status = 'PENDING', inspects canonical device authority:
--        * device is 'AUTHORIZED'
--        * exactly ONE active eligible license is bound to device
--        * exactly ONE active source is bound to device/license and consistent
--    - If all conditions pass, atomically reconciles stale request to 'CONSUMED',
--      recording canonical license, source, claimed_at, customer_account_id,
--      logging DEVICE_ACTIVATION_STALE_RECONCILED event, and returning
--      deviceAuthorizationState = 'AUTHORIZED' so client auto-transitions without APK rebuild.
--    - If any condition fails, fails closed preserving current status.
-- 2. Updates private.activate_device_source_core (16 params):
--    - Supersedes/cancels any remaining older PENDING activation requests for the
--      same device when Manager activation succeeds, preventing future stale sessions.
-- =============================================================================

-- =============================================================================
-- 0. OBSOLETE INDEX CLEANUP: Drop single-use key index to allow permanent key reuse
-- =============================================================================
DROP INDEX IF EXISTS public.uq_device_activation_consumed_key_single_use;

-- =============================================================================
-- 1. RPC: public.rpc_check_device_activation_status
-- =============================================================================

CREATE OR REPLACE FUNCTION public.rpc_check_device_activation_status(
    p_activation_id UUID,
    p_device_id TEXT,
    p_activation_status_secret TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, extensions, private
AS $$
DECLARE
    v_request RECORD;
    v_device RECORD;
    v_license_count INTEGER := 0;
    v_active_license RECORD;
    v_source_count INTEGER := 0;
    v_active_source RECORD;
    v_canonical_timestamp TIMESTAMPTZ;
    v_now TIMESTAMPTZ := NOW();
BEGIN
    -- 1. Validacao de parametros obrigatorios
    IF p_activation_id IS NULL OR NULLIF(trim(p_device_id), '') IS NULL OR NULLIF(trim(p_activation_status_secret), '') IS NULL THEN
        RAISE EXCEPTION 'ACTIVATION_STATUS_PARAMS_REQUIRED' USING ERRCODE = '22023';
    END IF;

    -- 2. Localizacao do registro da solicitacao de ativacao
    SELECT * INTO v_request
    FROM public.device_activation_requests
    WHERE activation_id = p_activation_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'code', 'ACTIVATION_NOT_FOUND');
    END IF;

    -- 3. Validacao estrita de capacidade (capability isolation)
    -- O chamador DEVE apresentar o secret correto associado a este activation_id e device_id
    IF v_request.device_id <> trim(p_device_id)
       OR v_request.activation_status_secret_hash <> encode(sha256(trim(p_activation_status_secret)::bytea), 'hex') THEN
        RAISE EXCEPTION 'ACTIVATION_STATUS_CAPABILITY_INVALID' USING ERRCODE = '42501';
    END IF;

    -- 4. Se a solicitacao ja estiver CONSUMED, retorna payload canonico normalmente
    IF v_request.status = 'CONSUMED' THEN
        RETURN jsonb_build_object(
            'success', true,
            'activationId', v_request.activation_id,
            'status', 'CONSUMED',
            'deviceAuthorizationState', 'AUTHORIZED',
            'licenseId', v_request.linked_license_id,
            'sourceId', v_request.linked_source_id,
            'claimedAt', v_request.claimed_at
        );
    END IF;

    -- 5. Se a solicitacao estiver PENDING, verifica autoridade canonica do dispositivo
    IF v_request.status = 'PENDING' THEN
        -- Condicao 1: Dispositivo deve existir e estar canonicamente AUTHORIZED
        SELECT * INTO v_device
        FROM public.devices
        WHERE device_id = trim(p_device_id);

        IF FOUND AND v_device.status = 'AUTHORIZED' THEN
            -- Condicao 2: Exatamente UMA vinculacao de licenca ativa e elegivel deve existir
            SELECT COUNT(*) INTO v_license_count
            FROM public.license_devices ld
            JOIN public.licenses l ON l.id = ld.license_id
            WHERE ld.device_id = trim(p_device_id)
              AND ld.status = 'ACTIVE'
              AND l.status IN ('ACTIVE', 'TRIAL')
              AND (l.expires_at IS NULL OR l.expires_at > v_now)
              AND (l.trial_expires_at IS NULL OR l.trial_expires_at > v_now);

            IF v_license_count = 1 THEN
                SELECT ld.license_id, l.customer_account_id, l.customer_id, l.mode, l.status AS license_status, ld.bound_at
                INTO v_active_license
                FROM public.license_devices ld
                JOIN public.licenses l ON l.id = ld.license_id
                WHERE ld.device_id = trim(p_device_id)
                  AND ld.status = 'ACTIVE'
                  AND l.status IN ('ACTIVE', 'TRIAL')
                  AND (l.expires_at IS NULL OR l.expires_at > v_now)
                  AND (l.trial_expires_at IS NULL OR l.trial_expires_at > v_now);

                -- Condicao 3 e 4: Exatamente UMA vinculacao de fonte ativa e consistente
                IF v_active_license.mode = 'MANAGED' THEN
                    SELECT COUNT(*) INTO v_source_count
                    FROM public.device_source_bindings dsb
                    JOIN public.managed_sources ms ON ms.id = dsb.source_id
                    WHERE dsb.device_id = trim(p_device_id)
                      AND dsb.license_id = v_active_license.license_id
                      AND ms.status = 'ACTIVE';

                    IF v_source_count = 1 THEN
                        SELECT ms.source_id AS canonical_source_id
                        INTO v_active_source
                        FROM public.device_source_bindings dsb
                        JOIN public.managed_sources ms ON ms.id = dsb.source_id
                        WHERE dsb.device_id = trim(p_device_id)
                          AND dsb.license_id = v_active_license.license_id
                          AND ms.status = 'ACTIVE';
                    END IF;
                ELSIF v_active_license.mode = 'SELF_SERVICE' THEN
                    SELECT COUNT(*) INTO v_source_count
                    FROM public.customer_sources cs
                    WHERE cs.license_id = v_active_license.license_id
                      AND cs.status = 'ACTIVE';

                    IF v_source_count = 1 THEN
                        SELECT cs.source_id AS canonical_source_id
                        INTO v_active_source
                        FROM public.customer_sources cs
                        WHERE cs.license_id = v_active_license.license_id
                          AND cs.status = 'ACTIVE';
                    END IF;
                ELSE
                    v_source_count := 0;
                END IF;

                -- Todas as condicoes canonicas foram satisfeitas
                IF v_source_count = 1 THEN
                    -- Timestamp canonico da ativacao
                    SELECT claimed_at INTO v_canonical_timestamp
                    FROM public.device_activation_requests
                    WHERE device_id = trim(p_device_id)
                      AND status = 'CONSUMED'
                      AND claimed_at IS NOT NULL
                    ORDER BY claimed_at DESC
                    LIMIT 1;

                    v_canonical_timestamp := COALESCE(v_canonical_timestamp, v_active_license.bound_at, v_now);

                    -- Reconciliacao atomica do registro da solicitacao pendente
                    UPDATE public.device_activation_requests
                    SET status = 'CONSUMED',
                        claimed_at = v_canonical_timestamp,
                        claimed_by_customer_id = COALESCE(v_active_license.customer_id, claimed_by_customer_id),
                        customer_account_id = COALESCE(v_active_license.customer_account_id, customer_account_id),
                        linked_license_id = v_active_license.license_id,
                        linked_source_id = v_active_source.canonical_source_id
                    WHERE activation_id = p_activation_id;

                    -- Registro de evento de auditoria
                    INSERT INTO public.device_activation_events (
                        activation_id, customer_id, customer_account_id, license_id, device_id, display_code,
                        source_id, action, result, metadata
                    ) VALUES (
                        v_request.activation_id,
                        v_active_license.customer_id,
                        v_active_license.customer_account_id,
                        v_active_license.license_id,
                        v_request.device_id,
                        v_request.display_code,
                        v_active_source.canonical_source_id,
                        'DEVICE_ACTIVATION_COMPLETED',
                        'SUCCESS',
                        jsonb_build_object(
                            'reconciled', true,
                            'reconciledFromStatus', 'PENDING',
                            'claimedAt', v_canonical_timestamp,
                            'licenseMode', v_active_license.mode
                        )
                    );

                    -- Retorno de sucesso com AUTHORIZED que comanda a transicao imediata do Fire Stick
                    RETURN jsonb_build_object(
                        'success', true,
                        'activationId', v_request.activation_id,
                        'status', 'CONSUMED',
                        'deviceAuthorizationState', 'AUTHORIZED',
                        'licenseId', v_active_license.license_id,
                        'sourceId', v_active_source.canonical_source_id,
                        'claimedAt', v_canonical_timestamp
                    );
                END IF;
            END IF;
        END IF;
    END IF;

    -- Caso contrario (ex: dispositivo nao autorizado, licencas ambiguas, fontes ausentes ou status CANCELLED):
    -- Retorna o estado atual da solicitacao sem reconciliacao (fail-closed)
    RETURN jsonb_build_object(
        'success', true,
        'activationId', v_request.activation_id,
        'status', v_request.status,
        'deviceAuthorizationState', CASE WHEN v_request.status = 'CONSUMED' THEN 'AUTHORIZED' ELSE 'UNREGISTERED' END,
        'licenseId', v_request.linked_license_id,
        'sourceId', v_request.linked_source_id,
        'claimedAt', v_request.claimed_at
    );
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_check_device_activation_status(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_check_device_activation_status(UUID, TEXT, TEXT) TO anon, authenticated, service_role;

-- =============================================================================
-- 2. LIFECYCLE CLEANUP: private.activate_device_source_core (16 PARAMS)
--    Garante cancelamento de quaisquer solicitacoes PENDING remanescentes
--    do mesmo dispositivo quando uma ativacao for concluida com sucesso.
-- =============================================================================

CREATE OR REPLACE FUNCTION private.activate_device_source_core(
    p_activation_id UUID,
    p_device_id TEXT,
    p_display_code TEXT,
    p_customer_id UUID,
    p_customer_nickname TEXT,
    p_license_id UUID,
    p_source_id TEXT,
    p_source_kind TEXT,
    p_source_type TEXT,
    p_display_name TEXT,
    p_ciphertext TEXT,
    p_nonce TEXT,
    p_auth_tag TEXT,
    p_key_version TEXT,
    p_activation_path TEXT,
    p_customer_account_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, extensions, private
AS $$
DECLARE
    v_display_code VARCHAR(32) := upper(NULLIF(trim(p_display_code), ''));
    v_device_id VARCHAR(64) := NULLIF(trim(p_device_id), '');
    v_source_id VARCHAR(64) := lower(NULLIF(trim(p_source_id), ''));
    v_source_kind VARCHAR(20) := upper(NULLIF(trim(p_source_kind), ''));
    v_source_type VARCHAR(20) := upper(NULLIF(trim(p_source_type), ''));
    v_display_name VARCHAR(100) := NULLIF(trim(p_display_name), '');
    v_path VARCHAR(40) := NULLIF(trim(p_activation_path), '');
    v_request RECORD;
    v_device RECORD;
    v_license RECORD;
    v_profile RECORD;
    v_existing_license_binding RECORD;
    v_existing_source_binding RECORD;
    v_managed_source RECORD;
    v_license_id UUID := p_license_id;
    v_effective_customer_id UUID := p_customer_id;
    v_effective_customer_account_id UUID := p_customer_account_id;
    v_device_type VARCHAR(20) := 'OTHER';
    v_device_label VARCHAR(100) := 'DISPOSITIVO';
    v_device_token_hash VARCHAR(64);
    v_trial JSONB := jsonb_build_object('trialStarted', false);
    v_trial_expires_at TIMESTAMPTZ;
    v_active_count INTEGER;
    v_license_binding_exists BOOLEAN := false;
    v_reuse_existing_device BOOLEAN := false;
    v_now TIMESTAMPTZ := NOW();
BEGIN
    IF v_display_code IS NULL OR v_display_code !~ '^XF-[0-9A-Z]{4}-[0-9A-Z]{4}$'
       OR v_device_id IS NULL OR length(v_device_id) > 64 THEN
        RAISE EXCEPTION 'DISPLAY_CODE_INVALID' USING ERRCODE = '22023';
    END IF;
    IF v_source_kind NOT IN ('SELF_SERVICE', 'MANAGED') THEN
        RAISE EXCEPTION 'SOURCE_KIND_INVALID' USING ERRCODE = '22023';
    END IF;
    IF v_source_kind = 'SELF_SERVICE' AND v_source_id !~ '^csrc_[a-z0-9]+$' THEN
        RAISE EXCEPTION 'SOURCE_ID_INVALID' USING ERRCODE = '22023';
    END IF;
    IF v_source_kind = 'MANAGED' AND v_source_id !~ '^src_[a-z0-9]+$' THEN
        RAISE EXCEPTION 'INVALID_CANONICAL_SOURCE_ID' USING ERRCODE = '22023';
    END IF;
    IF v_source_kind = 'SELF_SERVICE' AND v_source_type NOT IN ('M3U', 'M3U8', 'XTREAM') THEN
        RAISE EXCEPTION 'SOURCE_TYPE_NOT_ALLOWED' USING ERRCODE = '22023';
    END IF;
    IF v_source_kind = 'MANAGED' AND v_source_type NOT IN ('M3U', 'XTREAM') THEN
        RAISE EXCEPTION 'SOURCE_TYPE_NOT_ALLOWED' USING ERRCODE = '22023';
    END IF;
    IF v_display_name IS NULL OR length(v_display_name) > 100 THEN
        RAISE EXCEPTION 'SOURCE_DISPLAY_NAME_INVALID' USING ERRCODE = '22023';
    END IF;
    IF p_ciphertext IS NULL OR p_ciphertext !~ '^[0-9a-fA-F]+$'
       OR length(p_ciphertext) = 0 OR length(p_ciphertext) % 2 <> 0
       OR p_nonce IS NULL OR p_nonce !~ '^[0-9a-fA-F]{24}$'
       OR p_auth_tag IS NULL OR p_auth_tag !~ '^[0-9a-fA-F]{32}$'
       OR p_key_version IS NULL OR p_key_version !~ '^[A-Za-z0-9_.-]{1,32}$' THEN
        RAISE EXCEPTION 'SOURCE_ENVELOPE_INVALID' USING ERRCODE = '22023';
    END IF;

    IF p_activation_id IS NOT NULL THEN
        SELECT * INTO v_request
        FROM public.device_activation_requests
        WHERE activation_id = p_activation_id
        FOR UPDATE;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'ACTIVATION_NOT_FOUND' USING ERRCODE = 'P0002';
        END IF;
        IF v_request.device_id <> v_device_id OR v_request.display_code <> v_display_code THEN
            RAISE EXCEPTION 'ACTIVATION_DEVICE_MISMATCH' USING ERRCODE = '42501';
        END IF;
        v_device_type := COALESCE(v_request.device_type, v_device_type);
        v_device_label := COALESCE(NULLIF(v_request.device_label, ''), v_device_label);
        v_device_token_hash := v_request.device_token_hash;
    ELSE
        SELECT device_type, device_label, device_token_hash
        INTO v_device_type, v_device_label, v_device_token_hash
        FROM public.devices
        WHERE device_id = v_device_id
        FOR UPDATE;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'DEVICE_NOT_FOUND' USING ERRCODE = 'P0002';
        END IF;
    END IF;

    SELECT * INTO v_device
    FROM public.devices
    WHERE device_id = v_device_id
    FOR UPDATE;

    IF FOUND AND v_device.status = 'REVOKED' THEN
        RAISE EXCEPTION 'DEVICE_REVOKED_REQUIRES_REACTIVATION' USING ERRCODE = '42501';
    END IF;

    IF p_license_id IS NOT NULL THEN
        SELECT * INTO v_license
        FROM public.licenses
        WHERE id = p_license_id
        FOR UPDATE;
        IF NOT FOUND OR v_license.status NOT IN ('ACTIVE', 'TRIAL') THEN
            RAISE EXCEPTION 'LICENSE_NOT_ACTIVE' USING ERRCODE = '42501';
        END IF;
        IF v_license.expires_at IS NOT NULL AND v_license.expires_at <= v_now THEN
            RAISE EXCEPTION 'LICENSE_EXPIRED' USING ERRCODE = '42501';
        END IF;
        IF v_license.status = 'TRIAL' AND v_license.trial_expires_at IS NOT NULL
           AND v_license.trial_expires_at <= v_now THEN
            RAISE EXCEPTION 'TRIAL_EXPIRED' USING ERRCODE = '42501';
        END IF;

        v_effective_customer_id := v_license.customer_id;
        v_effective_customer_account_id := COALESCE(p_customer_account_id, v_license.customer_account_id);
    ELSE
        IF v_source_kind <> 'SELF_SERVICE' OR v_effective_customer_id IS NULL THEN
            RAISE EXCEPTION 'LICENSE_ID_REQUIRED' USING ERRCODE = '22023';
        END IF;
        SELECT * INTO v_profile
        FROM public.customer_profiles
        WHERE id = v_effective_customer_id
        FOR UPDATE;
        IF NOT FOUND THEN
            INSERT INTO public.customer_profiles (id, nickname, status, created_at, updated_at)
            VALUES (
                v_effective_customer_id,
                private.validate_customer_nickname(COALESCE(NULLIF(trim(p_customer_nickname), ''), 'cliente')),
                'ACTIVE', v_now, v_now
            ) RETURNING * INTO v_profile;
        ELSIF v_profile.status <> 'ACTIVE' THEN
            RAISE EXCEPTION 'CUSTOMER_PROFILE_NOT_ACTIVE' USING ERRCODE = '42501';
        END IF;

        SELECT * INTO v_license
        FROM public.licenses
        WHERE customer_id = v_effective_customer_id
          AND status IN ('ACTIVE', 'TRIAL')
        ORDER BY created_at DESC
        LIMIT 1
        FOR UPDATE;

        IF NOT FOUND THEN
            IF v_profile.trial_used_at IS NOT NULL THEN
                RAISE EXCEPTION 'NO_ELIGIBLE_LICENSE' USING ERRCODE = '42501';
            END IF;
            v_license_id := gen_random_uuid();
            v_trial_expires_at := v_now + INTERVAL '7 days';

            v_effective_customer_account_id := COALESCE(
                p_customer_account_id,
                (SELECT customer_account_id FROM public.customer_account_users WHERE user_id = v_effective_customer_id AND status = 'ACTIVE' LIMIT 1),
                v_effective_customer_id
            );

            INSERT INTO public.licenses (
                id, license_key_hash, mode, status, trial_eligible, trial_started_at,
                trial_expires_at, max_devices, max_concurrent_sessions, customer_id, customer_account_id, created_at
            ) VALUES (
                v_license_id,
                encode(sha256(('PUBLIC_TRIAL_' || v_effective_customer_id::text || '_' || v_license_id::text || '_' || extract(epoch FROM v_now)::text)::bytea), 'hex'),
                'SELF_SERVICE', 'TRIAL', true, v_now, v_trial_expires_at, 1, 1,
                v_effective_customer_id, v_effective_customer_account_id, v_now
            ) RETURNING * INTO v_license;

            PERFORM set_config('private.system_trial_mutation', 'true', true);
            UPDATE public.customer_profiles
            SET trial_used_at = v_now, updated_at = v_now
            WHERE id = v_effective_customer_id;
            PERFORM set_config('private.system_trial_mutation', 'false', true);

            v_trial := jsonb_build_object(
                'trialStarted', true, 'status', 'TRIAL',
                'trialStartedAt', v_now, 'trialExpiresAt', v_trial_expires_at,
                'maxDevices', 1, 'maxConcurrentSessions', 1
            );
        ELSE
            v_license_id := v_license.id;
            v_effective_customer_account_id := COALESCE(p_customer_account_id, v_license.customer_account_id);
            IF v_license.status = 'TRIAL' AND (v_license.trial_expires_at IS NULL OR v_license.trial_expires_at <= v_now) THEN
                RAISE EXCEPTION 'TRIAL_EXPIRED' USING ERRCODE = '42501';
            END IF;
            v_trial := jsonb_build_object('trialStarted', false, 'status', v_license.status);
        END IF;
    END IF;

    IF v_license_id IS NULL THEN
        v_license_id := v_license.id;
    END IF;

    IF v_license.customer_id IS NOT NULL AND v_effective_customer_id IS NOT NULL
       AND v_license.customer_id <> v_effective_customer_id THEN
        RAISE EXCEPTION 'CROSS_CUSTOMER_BINDING_DENIED' USING ERRCODE = '42501';
    END IF;

    IF v_license.customer_account_id IS NOT NULL AND v_effective_customer_account_id IS NOT NULL
       AND v_license.customer_account_id <> v_effective_customer_account_id THEN
        RAISE EXCEPTION 'CROSS_CUSTOMER_BINDING_DENIED' USING ERRCODE = '42501';
    END IF;

    IF v_source_kind = 'SELF_SERVICE' AND v_license.mode <> 'SELF_SERVICE' THEN
        RAISE EXCEPTION 'LICENSE_MODE_INVALID' USING ERRCODE = '42501';
    END IF;
    IF v_source_kind = 'MANAGED' AND v_license.mode <> 'MANAGED' THEN
        RAISE EXCEPTION 'LICENSE_MODE_INVALID' USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_existing_license_binding
    FROM public.license_devices
    WHERE license_id = v_license_id AND device_id = v_device_id AND status = 'ACTIVE'
    FOR UPDATE;
    v_license_binding_exists := FOUND;

    SELECT count(*) INTO v_active_count
    FROM public.license_devices
    WHERE license_id = v_license_id AND status = 'ACTIVE' AND device_id <> v_device_id;

    IF v_active_count >= v_license.max_devices AND NOT v_license_binding_exists THEN
        RAISE EXCEPTION 'LICENSE_DEVICE_LIMIT_REACHED' USING ERRCODE = '42501';
    END IF;

    -- UPSERT public.devices FIRST (FK order preservation)
    INSERT INTO public.devices (
        device_id, display_code, device_type, device_label, status, device_token_hash, last_seen_at
    ) VALUES (
        v_device_id, v_display_code, v_device_type, v_device_label,
        'AUTHORIZED', v_device_token_hash, v_now
    ) ON CONFLICT (device_id) DO UPDATE SET
        display_code = EXCLUDED.display_code,
        device_type = EXCLUDED.device_type,
        device_label = EXCLUDED.device_label,
        status = 'AUTHORIZED',
        device_token_hash = COALESCE(EXCLUDED.device_token_hash, public.devices.device_token_hash),
        last_seen_at = v_now;

    IF v_source_kind = 'SELF_SERVICE' THEN
        UPDATE public.customer_sources
        SET status = 'DISABLED', updated_at = v_now
        WHERE license_id = v_license_id AND status = 'ACTIVE';

        INSERT INTO public.customer_sources (
            source_id, customer_id, customer_account_id, license_id, source_type, display_name,
            status, version, created_at, updated_at
        ) VALUES (
            v_source_id, COALESCE(v_effective_customer_id, v_license.customer_id),
            v_effective_customer_account_id,
            v_license_id, v_source_type, v_display_name, 'ACTIVE', 1, v_now, v_now
        );

        INSERT INTO private.customer_source_secret_vault (
            source_id, source_version, protocol, ciphertext, nonce, auth_tag, key_version, created_at
        ) VALUES (
            v_source_id, 1, v_source_type, p_ciphertext, p_nonce, p_auth_tag, p_key_version, v_now
        );
    ELSE
        SELECT id, source_id, version
        INTO v_managed_source
        FROM public.managed_sources
        WHERE source_id = v_source_id
        FOR UPDATE;

        IF FOUND THEN
            RAISE EXCEPTION 'SOURCE_ALREADY_EXISTS' USING ERRCODE = '23505';
        END IF;

        INSERT INTO public.managed_sources (
            source_id, name, source_type, version, status,
            encrypted_payload, iv, auth_tag, created_at, updated_at
        ) VALUES (
            v_source_id, v_display_name, v_source_type, 1, 'ACTIVE',
            NULL, NULL, NULL, v_now, v_now
        ) RETURNING id INTO v_managed_source;

        INSERT INTO private.managed_source_secret_vault (
            source_id, source_version, protocol, ciphertext, nonce, auth_tag, key_version, created_at, updated_at
        ) VALUES (
            v_source_id, 1, v_source_type, p_ciphertext, p_nonce, p_auth_tag, p_key_version, v_now, v_now
        );

        SELECT id, source_id
        INTO v_existing_source_binding
        FROM public.device_source_bindings
        WHERE device_id = v_device_id
        FOR UPDATE;

        INSERT INTO public.device_source_bindings (license_id, device_id, source_id, created_at)
        VALUES (v_license_id, v_device_id, v_managed_source.id, v_now)
        ON CONFLICT (device_id) DO UPDATE SET
            license_id = EXCLUDED.license_id,
            source_id = EXCLUDED.source_id,
            created_at = EXCLUDED.created_at;
    END IF;

    INSERT INTO public.license_devices (license_id, device_id, status, bound_at, revoked_at)
    VALUES (v_license_id, v_device_id, 'ACTIVE', v_now, NULL)
    ON CONFLICT (license_id, device_id) DO UPDATE SET
        status = 'ACTIVE', bound_at = EXCLUDED.bound_at, revoked_at = NULL;

    IF p_activation_id IS NOT NULL AND v_request.status = 'PENDING' THEN
        UPDATE public.device_activation_requests
        SET status = 'CONSUMED',
            claimed_at = v_now,
            claimed_by_customer_id = v_effective_customer_id,
            customer_account_id = v_effective_customer_account_id,
            linked_license_id = v_license_id,
            linked_source_id = v_source_id
        WHERE activation_id = p_activation_id;

        IF v_request.installation_id IS NOT NULL THEN
            UPDATE public.app_installations SET last_seen_at = v_now
            WHERE installation_id = v_request.installation_id;
        END IF;
    END IF;

    -- Lifecycle cleanup: cancela outras solicitacoes PENDING remanescentes para este dispositivo
    UPDATE public.device_activation_requests
    SET status = 'CANCELLED'
    WHERE device_id = v_device_id
      AND status = 'PENDING'
      AND (p_activation_id IS NULL OR activation_id <> p_activation_id);

    INSERT INTO public.device_activation_events (
        activation_id, customer_id, customer_account_id, license_id, device_id, display_code,
        source_id, action, result, metadata
    ) VALUES
    (
        p_activation_id, v_effective_customer_id, v_effective_customer_account_id, v_license_id, v_device_id,
        v_display_code, v_source_id, 'DEVICE_ACTIVATION_SOURCE_BOUND', 'SUCCESS',
        jsonb_build_object('sourceKind', v_source_kind, 'activationPath', v_path)
    ),
    (
        p_activation_id, v_effective_customer_id, v_effective_customer_account_id, v_license_id, v_device_id,
        v_display_code, v_source_id, 'DEVICE_ACTIVATION_COMPLETED', 'SUCCESS',
        jsonb_build_object('sourceKind', v_source_kind, 'activationPath', v_path, 'trial', v_trial)
    );

    RETURN jsonb_build_object(
        'success', true,
        'status', 'CONSUMED',
        'deviceAuthorizationState', 'AUTHORIZED',
        'deviceId', v_device_id,
        'displayCode', v_display_code,
        'licenseId', v_license_id,
        'sourceId', v_source_id,
        'sourceBindingStatus', 'ACTIVE',
        'licenseStatus', v_license.status,
        'sourceResolution', 'SOURCE_READY',
        'trial', v_trial
    );
END;
$$;

REVOKE ALL ON FUNCTION private.activate_device_source_core(UUID, TEXT, TEXT, UUID, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.activate_device_source_core(UUID, TEXT, TEXT, UUID, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID) TO service_role;
