-- =============================================================================
-- Migration: 20260925150000_c11_manager_cutover_to_customer_accounts.sql
-- Cycle: XANDEFLIX_PREBUILT_C11_MANAGER_CUTOVER_TO_CUSTOMER_ACCOUNTS
-- Master Objective: Cut over Manager commercial-customer path from
--                   public.customer_profiles to public.customer_accounts.
--
-- Canonica:
-- 1. Manager NEW_CUSTOMER creates public.customer_accounts (zero auth.users, zero customer_profiles).
-- 2. Manager EXISTING_CUSTOMER selects/reads public.customer_accounts.
-- 3. Core activate_device_source_core extended with 16th transitional parameter p_customer_account_id
--    while preserving 15-parameter backward-compatible overload for Portal / Self-Service.
-- 4. Manager RPCs updated:
--    - rpc_manager_complete_device_activation
--    - rpc_manager_list_customers
--    - rpc_manager_list_licenses
--    - rpc_manager_get_customer_detail
--    - rpc_manager_update_customer_status
--    - rpc_manager_get_license_detail
--    - rpc_manager_list_customer_sources
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. EXTENSION DE private.activate_device_source_core (16 PARAMETROS)
-- -----------------------------------------------------------------------------

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

        -- Define ownership efetivo a partir da licenca se nao passado explicitamente
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

            -- Resolve customer_account_id para conta associada se existir
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

    -- Validacao de isolamento cross-customer (legada)
    IF v_license.customer_id IS NOT NULL AND v_effective_customer_id IS NOT NULL
       AND v_license.customer_id <> v_effective_customer_id THEN
        RAISE EXCEPTION 'CROSS_CUSTOMER_BINDING_DENIED' USING ERRCODE = '42501';
    END IF;

    -- Validacao de isolamento cross-customer (canonica por customer_account_id)
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

-- -----------------------------------------------------------------------------
-- 2. OVERLOAD DE COMPATIBILIDADE DE private.activate_device_source_core (15 PARAMETROS)
--    Garante que chamadores existentes (Portal / Self-Service) continuem funcionando
--    sem nenhuma alteracao de assinatura ou quebra de contrato.
-- -----------------------------------------------------------------------------

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
    p_activation_path TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, extensions, private
AS $$
BEGIN
    RETURN private.activate_device_source_core(
        p_activation_id,
        p_device_id,
        p_display_code,
        p_customer_id,
        p_customer_nickname,
        p_license_id,
        p_source_id,
        p_source_kind,
        p_source_type,
        p_display_name,
        p_ciphertext,
        p_nonce,
        p_auth_tag,
        p_key_version,
        p_activation_path,
        NULL::UUID
    );
END;
$$;

REVOKE ALL ON FUNCTION private.activate_device_source_core(UUID, TEXT, TEXT, UUID, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 3. CUTOVER DE public.rpc_manager_complete_device_activation
--    - FLOW A (NEW_CUSTOMER): Cria customer_accounts e licencia vinculada
--      por customer_account_id (customer_id = NULL). Zero customer_profiles,
--      zero auth.users.
--    - FLOW B (EXISTING_CUSTOMER): Valida conta comercial em customer_accounts
--      e vincula dispositivo via customer_account_id da licenca.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.rpc_manager_complete_device_activation(
    p_display_code TEXT,
    p_activation_key_hash TEXT,
    p_license_id UUID DEFAULT NULL,
    p_source_id TEXT DEFAULT NULL,
    p_source_type TEXT DEFAULT NULL,
    p_display_name TEXT DEFAULT NULL,
    p_ciphertext TEXT DEFAULT NULL,
    p_nonce TEXT DEFAULT NULL,
    p_auth_tag TEXT DEFAULT NULL,
    p_key_version TEXT DEFAULT 'v1',
    p_customer_id UUID DEFAULT NULL,
    p_flow_mode TEXT DEFAULT 'NEW_CUSTOMER',
    p_new_customer_name TEXT DEFAULT NULL,
    p_existing_display_code TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, extensions, private
AS $$
DECLARE
    v_pair JSONB;
    v_result JSONB;
    v_device_id VARCHAR(64);
    v_display_code VARCHAR(32);
    v_target_customer_account_id UUID := p_customer_id;
    v_resolved_license_id UUID := p_license_id;
    v_account RECORD;
    v_now TIMESTAMPTZ := NOW();
    v_clean_name TEXT;
    v_clean_existing_code TEXT;
    v_existing_device RECORD;
    v_existing_device_binding RECORD;
    v_reused_source RECORD;
    v_sources_count INTEGER;
    v_candidate_license RECORD;
    v_licenses_count INTEGER;
    v_active_devices_count INTEGER;
    v_is_already_bound BOOLEAN;
    v_new_token_hash TEXT;
BEGIN
    -- Valida autorizacao de menor privilegio: permite gestores ativos com role 'OWNER' ou 'ADMIN'
    PERFORM private.require_device_activation_manager();

    -- Validacao do par display_code + activation_key_hash via helper canonico
    v_pair := public.rpc_claim_device_key(p_display_code, p_activation_key_hash);
    IF v_pair IS NULL OR (v_pair->>'valid')::BOOLEAN IS NOT TRUE THEN
        RAISE EXCEPTION 'INVALID_ACTIVATION_KEY' USING ERRCODE = '42501';
    END IF;

    v_device_id := v_pair->>'deviceId';
    v_display_code := v_pair->>'displayCode';

    IF v_device_id IS NULL OR v_display_code IS NULL THEN
        RAISE EXCEPTION 'ACTIVATION_DEVICE_MISMATCH' USING ERRCODE = '42501';
    END IF;

    -- =========================================================================
    -- ROTEAMENTO POR MODO DE FLUXO (CANONICAL TWO-FLOW ARCHITECTURE)
    -- =========================================================================
    IF p_flow_mode = 'EXISTING_CUSTOMER' THEN
        -- ---------------------------------------------------------------------
        -- FLOW B: EXISTING_CUSTOMER (Cliente comercial ja ativo)
        -- ---------------------------------------------------------------------
        IF v_target_customer_account_id IS NULL THEN
            RAISE EXCEPTION 'CUSTOMER_ID_REQUIRED' USING ERRCODE = '22023';
        END IF;

        v_clean_existing_code := UPPER(TRIM(COALESCE(p_existing_display_code, '')));
        IF v_clean_existing_code = '' THEN
            RAISE EXCEPTION 'EXISTING_DEVICE_CODE_REQUIRED' USING ERRCODE = '22023';
        END IF;

        IF v_clean_existing_code !~ '^XF-[0-9A-Z]{4}-[0-9A-Z]{4}$' THEN
            RAISE EXCEPTION 'DISPLAY_CODE_INVALID' USING ERRCODE = '22023';
        END IF;

        -- Valida existencia e status em public.customer_accounts
        SELECT id, display_name, status
        INTO v_account
        FROM public.customer_accounts
        WHERE id = v_target_customer_account_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'CUSTOMER_ACCOUNT_NOT_FOUND' USING ERRCODE = '42501';
        END IF;

        IF v_account.status <> 'ACTIVE' THEN
            RAISE EXCEPTION 'CUSTOMER_ACCOUNT_NOT_ACTIVE' USING ERRCODE = '42501';
        END IF;

        SELECT d.device_id, d.display_code, d.status
        INTO v_existing_device
        FROM public.devices d
        WHERE d.display_code = v_clean_existing_code;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'EXISTING_DEVICE_NOT_FOUND' USING ERRCODE = '42501';
        END IF;

        -- Valida que o dispositivo existente pertence a esta conta comercial
        SELECT ld.license_id, l.customer_account_id, l.customer_id
        INTO v_existing_device_binding
        FROM public.license_devices ld
        JOIN public.licenses l ON l.id = ld.license_id
        WHERE ld.device_id = v_existing_device.device_id
          AND ld.status = 'ACTIVE';

        IF NOT FOUND OR (
            COALESCE(v_existing_device_binding.customer_account_id, v_existing_device_binding.customer_id) <> v_target_customer_account_id
        ) THEN
            RAISE EXCEPTION 'EXISTING_DEVICE_CUSTOMER_MISMATCH' USING ERRCODE = '42501';
        END IF;

        -- Localiza fonte gerenciada reutilizavel da conta do cliente
        CREATE TEMPORARY TABLE IF NOT EXISTS temp_reusable_sources (
            internal_source_id UUID,
            canonical_source_id TEXT,
            source_type TEXT,
            name TEXT
        ) ON COMMIT DROP;
        DELETE FROM temp_reusable_sources;

        INSERT INTO temp_reusable_sources (internal_source_id, canonical_source_id, source_type, name)
        SELECT DISTINCT ms.id, ms.source_id, ms.source_type, ms.name
        FROM public.device_source_bindings dsb
        JOIN public.managed_sources ms ON ms.id = dsb.source_id
        WHERE ms.status = 'ACTIVE'
          AND (
            dsb.device_id = v_existing_device.device_id
            OR dsb.license_id IN (
                SELECT l.id FROM public.licenses l 
                WHERE l.customer_account_id = v_target_customer_account_id
                   OR (l.customer_account_id IS NULL AND l.customer_id = v_target_customer_account_id)
            )
          );

        SELECT COUNT(*) INTO v_sources_count FROM temp_reusable_sources;

        IF v_sources_count = 0 THEN
            RAISE EXCEPTION 'CUSTOMER_HAS_NO_ACTIVE_SOURCE' USING ERRCODE = '42501';
        ELSIF v_sources_count > 1 THEN
            RAISE EXCEPTION 'CUSTOMER_SOURCE_AMBIGUOUS' USING ERRCODE = '42501';
        END IF;

        SELECT * INTO v_reused_source FROM temp_reusable_sources LIMIT 1;

        -- Resolucao e validacao da licenca gerenciada da conta comercial
        IF v_resolved_license_id IS NOT NULL THEN
            SELECT *
            INTO v_candidate_license
            FROM public.licenses
            WHERE id = v_resolved_license_id;

            IF NOT FOUND THEN
                RAISE EXCEPTION 'LICENSE_NOT_FOUND' USING ERRCODE = '42501';
            END IF;

            IF COALESCE(v_candidate_license.customer_account_id, v_candidate_license.customer_id) <> v_target_customer_account_id THEN
                RAISE EXCEPTION 'CROSS_CUSTOMER_BINDING_DENIED' USING ERRCODE = '42501';
            END IF;

            IF v_candidate_license.mode <> 'MANAGED' THEN
                RAISE EXCEPTION 'LICENSE_MODE_INVALID' USING ERRCODE = '42501';
            END IF;

            IF v_candidate_license.status NOT IN ('ACTIVE', 'TRIAL') THEN
                RAISE EXCEPTION 'LICENSE_STATUS_INELIGIBLE' USING ERRCODE = '42501';
            END IF;
        ELSE
            CREATE TEMPORARY TABLE IF NOT EXISTS temp_candidate_licenses (
                id UUID,
                customer_account_id UUID,
                customer_id UUID,
                mode TEXT,
                status TEXT,
                max_devices INTEGER,
                created_at TIMESTAMPTZ
            ) ON COMMIT DROP;
            DELETE FROM temp_candidate_licenses;

            INSERT INTO temp_candidate_licenses (id, customer_account_id, customer_id, mode, status, max_devices, created_at)
            SELECT id, customer_account_id, customer_id, mode, status, max_devices, created_at
            FROM public.licenses
            WHERE (customer_account_id = v_target_customer_account_id
                   OR (customer_account_id IS NULL AND customer_id = v_target_customer_account_id))
              AND mode = 'MANAGED'
              AND status IN ('ACTIVE', 'TRIAL')
              AND (expires_at IS NULL OR expires_at > v_now)
              AND (trial_expires_at IS NULL OR trial_expires_at > v_now);

            SELECT COUNT(*) INTO v_licenses_count FROM temp_candidate_licenses;

            IF v_licenses_count = 0 THEN
                RAISE EXCEPTION 'NO_ELIGIBLE_MANAGED_LICENSE' USING ERRCODE = '42501';
            ELSIF v_licenses_count > 1 THEN
                RAISE EXCEPTION 'MANAGED_LICENSE_AMBIGUOUS' USING ERRCODE = '42501';
            END IF;

            SELECT *
            INTO v_candidate_license
            FROM temp_candidate_licenses
            ORDER BY created_at ASC
            LIMIT 1;

            v_resolved_license_id := v_candidate_license.id;
        END IF;

        -- Verificacao de capacidade da licenca
        SELECT COUNT(*)
        INTO v_active_devices_count
        FROM public.license_devices
        WHERE license_id = v_candidate_license.id
          AND status = 'ACTIVE'
          AND device_id <> v_device_id;

        SELECT EXISTS (
            SELECT 1
            FROM public.license_devices
            WHERE license_id = v_candidate_license.id
              AND device_id = v_device_id
              AND status = 'ACTIVE'
        ) INTO v_is_already_bound;

        IF v_active_devices_count >= v_candidate_license.max_devices AND NOT v_is_already_bound THEN
            RAISE EXCEPTION 'MANAGED_LICENSE_CAPACITY_EXHAUSTED' USING ERRCODE = '42501';
        END IF;

        -- Vinculacao da licenca e fonte ao novo dispositivo
        INSERT INTO public.license_devices (license_id, device_id, status, bound_at, revoked_at)
        VALUES (v_resolved_license_id, v_device_id, 'ACTIVE', v_now, NULL)
        ON CONFLICT (license_id, device_id) DO UPDATE SET
            status = 'ACTIVE',
            bound_at = EXCLUDED.bound_at,
            revoked_at = NULL;

        INSERT INTO public.device_source_bindings (license_id, device_id, source_id, created_at)
        VALUES (v_resolved_license_id, v_device_id, v_reused_source.internal_source_id, v_now)
        ON CONFLICT (device_id) DO UPDATE SET
            license_id = EXCLUDED.license_id,
            source_id = EXCLUDED.source_id,
            created_at = EXCLUDED.created_at;

        v_new_token_hash := encode(digest(v_device_id || ':' || gen_random_uuid()::text || ':' || v_now::text, 'sha256'), 'hex');

        INSERT INTO public.devices (
            device_id, display_code, device_type, device_label, status, device_token_hash, last_seen_at
        ) VALUES (
            v_device_id, v_display_code, 'FIRE_STICK', 'Dispositivo Gerenciado (Reutilizado)',
            'AUTHORIZED', v_new_token_hash, v_now
        ) ON CONFLICT (device_id) DO UPDATE SET
            display_code = EXCLUDED.display_code,
            device_type = EXCLUDED.device_type,
            device_label = EXCLUDED.device_label,
            status = 'AUTHORIZED',
            device_token_hash = COALESCE(EXCLUDED.device_token_hash, public.devices.device_token_hash),
            last_seen_at = v_now;

        -- Consome request de ativacao se pendente
        UPDATE public.device_activation_requests
        SET status = 'CONSUMED',
            claimed_at = v_now,
            customer_account_id = v_target_customer_account_id,
            claimed_by_customer_id = v_candidate_license.customer_id,
            linked_license_id = v_resolved_license_id,
            linked_source_id = v_reused_source.canonical_source_id
        WHERE device_id = v_device_id AND display_code = v_display_code AND status = 'PENDING';

        INSERT INTO public.device_activation_events (
            activation_id, customer_id, customer_account_id, license_id, device_id, display_code,
            source_id, action, result, metadata
        ) VALUES
        (
            NULL, v_candidate_license.customer_id, v_target_customer_account_id, v_resolved_license_id, v_device_id,
            v_display_code, v_reused_source.canonical_source_id, 'DEVICE_ACTIVATION_SOURCE_BOUND', 'SUCCESS',
            jsonb_build_object('sourceKind', 'MANAGED', 'sourceReused', true, 'flowMode', 'EXISTING_CUSTOMER')
        ),
        (
            NULL, v_candidate_license.customer_id, v_target_customer_account_id, v_resolved_license_id, v_device_id,
            v_display_code, v_reused_source.canonical_source_id, 'DEVICE_ACTIVATION_COMPLETED', 'SUCCESS',
            jsonb_build_object('sourceKind', 'MANAGED', 'sourceReused', true, 'flowMode', 'EXISTING_CUSTOMER')
        );

        RETURN jsonb_build_object(
            'success', true,
            'deviceId', v_device_id,
            'displayCode', v_display_code,
            'customerId', v_target_customer_account_id,
            'licenseId', v_resolved_license_id,
            'sourceId', v_reused_source.canonical_source_id,
            'deviceAuthorizationState', 'AUTHORIZED',
            'sourceBindingStatus', 'ACTIVE',
            'licenseStatus', v_candidate_license.status,
            'sourceResolution', 'SOURCE_READY',
            'sourceReused', true
        );

    ELSE
        -- ---------------------------------------------------------------------
        -- FLOW A: NEW_CUSTOMER (Canonical Commercial Customer Accounts Cutover)
        -- ---------------------------------------------------------------------
        IF p_source_id IS NULL OR p_source_type IS NULL OR p_ciphertext IS NULL
           OR p_nonce IS NULL OR p_auth_tag IS NULL THEN
            RAISE EXCEPTION 'SOURCE_CONFIG_REQUIRED' USING ERRCODE = '22023';
        END IF;

        v_clean_name := TRIM(COALESCE(p_new_customer_name, ''));
        IF v_target_customer_account_id IS NULL AND v_clean_name <> '' THEN
            -- Cria registro cannico em public.customer_accounts
            -- ZERO customer_profiles insert. ZERO auth.users insert.
            INSERT INTO public.customer_accounts (display_name, status, metadata, created_at, updated_at)
            VALUES (v_clean_name, 'ACTIVE', '{}'::jsonb, v_now, v_now)
            RETURNING id INTO v_target_customer_account_id;
        ELSIF v_target_customer_account_id IS NOT NULL THEN
            SELECT id, display_name, status
            INTO v_account
            FROM public.customer_accounts
            WHERE id = v_target_customer_account_id;

            IF NOT FOUND THEN
                RAISE EXCEPTION 'CUSTOMER_ACCOUNT_NOT_FOUND' USING ERRCODE = '42501';
            END IF;

            IF v_account.status <> 'ACTIVE' THEN
                RAISE EXCEPTION 'CUSTOMER_ACCOUNT_NOT_ACTIVE' USING ERRCODE = '42501';
            END IF;
        ELSE
            RAISE EXCEPTION 'CUSTOMER_NAME_REQUIRED' USING ERRCODE = '22023';
        END IF;

        -- Criacao ou resolucao da licenca gerenciada da nova conta comercial
        IF v_resolved_license_id IS NULL THEN
            SELECT COUNT(*)
            INTO v_licenses_count
            FROM public.licenses
            WHERE (customer_account_id = v_target_customer_account_id
                   OR (customer_account_id IS NULL AND customer_id = v_target_customer_account_id))
              AND mode = 'MANAGED'
              AND status IN ('ACTIVE', 'TRIAL')
              AND (expires_at IS NULL OR expires_at > v_now)
              AND (trial_expires_at IS NULL OR trial_expires_at > v_now);

            IF v_licenses_count = 0 THEN
                INSERT INTO public.licenses (
                    customer_account_id,
                    customer_id,
                    mode,
                    status,
                    max_devices,
                    max_concurrent_sessions,
                    trial_started_at,
                    trial_expires_at,
                    expires_at,
                    license_key_hash,
                    created_at,
                    updated_at
                ) VALUES (
                    v_target_customer_account_id,
                    NULL, -- explicitly NULL: sem UUIDs falsos na coluna legada
                    'MANAGED',
                    'ACTIVE',
                    1,
                    1,
                    NULL,
                    NULL,
                    NULL,
                    encode(digest(gen_random_uuid()::text, 'sha256'), 'hex'),
                    v_now,
                    v_now
                ) RETURNING id INTO v_resolved_license_id;
            ELSIF v_licenses_count = 1 THEN
                SELECT id
                INTO v_resolved_license_id
                FROM public.licenses
                WHERE (customer_account_id = v_target_customer_account_id
                       OR (customer_account_id IS NULL AND customer_id = v_target_customer_account_id))
                  AND mode = 'MANAGED'
                  AND status IN ('ACTIVE', 'TRIAL')
                  AND (expires_at IS NULL OR expires_at > v_now)
                  AND (trial_expires_at IS NULL OR trial_expires_at > v_now)
                ORDER BY created_at ASC
                LIMIT 1;
            ELSE
                RAISE EXCEPTION 'MANAGED_LICENSE_AMBIGUOUS' USING ERRCODE = '42501';
            END IF;
        END IF;

        -- Conclusao via private.activate_device_source_core canonico (16 parametros)
        v_result := private.activate_device_source_core(
            CASE WHEN NULLIF(v_pair->>'activationId', '') IS NULL THEN NULL ELSE (v_pair->>'activationId')::UUID END,
            v_device_id,
            v_display_code,
            NULL, -- p_customer_id = NULL para conta comercial sem Auth user
            NULL, -- p_customer_nickname = NULL
            v_resolved_license_id,
            p_source_id,
            'MANAGED',
            p_source_type,
            p_display_name,
            p_ciphertext,
            p_nonce,
            p_auth_tag,
            p_key_version,
            'MANAGER_ASSISTED',
            v_target_customer_account_id -- p_customer_account_id = nova conta comercial
        );

        IF v_target_customer_account_id IS NOT NULL THEN
            v_result := jsonb_set(v_result, '{customerId}', to_jsonb(v_target_customer_account_id::text), true);
        END IF;

        v_result := jsonb_set(v_result, '{sourceReused}', 'false'::jsonb, true);

        RETURN v_result;
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_manager_complete_device_activation(TEXT, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_manager_complete_device_activation(TEXT, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 4. ATUALIZACAO DE public.rpc_manager_list_customers
--    Consulta public.customer_accounts (contas migradas + novas contas comerciais)
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
    PERFORM private.require_active_manager();

    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'customerId', ca.id,
            'nickname', ca.display_name,
            'displayName', ca.display_name,
            'status', ca.status,
            'createdAt', ca.created_at,
            'updatedAt', ca.updated_at,
            'licensesCount', (
                SELECT count(*)::int 
                FROM public.licenses l 
                WHERE l.customer_account_id = ca.id 
                   OR (l.customer_account_id IS NULL AND l.customer_id = ca.id)
            )
        ) ORDER BY ca.created_at DESC
    ), '[]'::jsonb)
    INTO v_result
    FROM public.customer_accounts ca;

    RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_manager_list_customers() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_manager_list_customers() TO authenticated;

-- -----------------------------------------------------------------------------
-- 5. ATUALIZACAO DE public.rpc_manager_list_licenses
--    Suporta licencas com customer_account_id (customer_id = NULL)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.rpc_manager_list_licenses()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
DECLARE
    v_result JSONB;
BEGIN
    PERFORM private.require_active_manager();

    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'licenseId', l.id,
            'customerId', COALESCE(l.customer_account_id, l.customer_id),
            'customerNickname', COALESCE(ca.display_name, cp.nickname),
            'mode', l.mode,
            'status', l.status,
            'trialEligible', l.trial_eligible,
            'trialStartedAt', l.trial_started_at,
            'trialExpiresAt', l.trial_expires_at,
            'maxDevices', l.max_devices,
            'maxConcurrentSessions', l.max_concurrent_sessions,
            'activeDeviceCount', (
                SELECT count(*)::int
                FROM public.license_devices ld
                WHERE ld.license_id = l.id AND ld.status = 'ACTIVE'
            ),
            'sourceSummary', jsonb_build_object(
                'hasManagedSource', EXISTS (
                    SELECT 1 FROM public.device_source_bindings dsb WHERE dsb.license_id = l.id
                ),
                'hasCustomerSource', EXISTS (
                    SELECT 1 FROM public.customer_sources cs WHERE cs.license_id = l.id AND cs.status = 'ACTIVE'
                )
            ),
            'createdAt', l.created_at,
            'expiresAt', l.expires_at
        ) ORDER BY l.created_at DESC
    ), '[]'::jsonb)
    INTO v_result
    FROM public.licenses l
    LEFT JOIN public.customer_accounts ca ON ca.id = l.customer_account_id
    LEFT JOIN public.customer_profiles cp ON cp.id = l.customer_id;

    RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_manager_list_licenses() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_manager_list_licenses() TO authenticated;

-- -----------------------------------------------------------------------------
-- 6. ATUALIZACAO DE public.rpc_manager_get_customer_detail
--    Le de customer_accounts com fallback para customer_profiles
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.rpc_manager_get_customer_detail(p_customer_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
DECLARE
    v_account RECORD;
    v_profile RECORD;
    v_licenses JSONB;
    v_devices JSONB;
    v_sources JSONB;
    v_customer_found BOOLEAN := false;
    v_display_name TEXT;
    v_status TEXT;
    v_created_at TIMESTAMPTZ;
    v_updated_at TIMESTAMPTZ;
BEGIN
    PERFORM private.require_active_manager();

    IF p_customer_id IS NULL THEN
        RAISE EXCEPTION 'CUSTOMER_ID_REQUIRED' USING ERRCODE = '22023';
    END IF;

    -- Tenta customer_accounts primeiro
    SELECT * INTO v_account
    FROM public.customer_accounts
    WHERE id = p_customer_id;

    IF FOUND THEN
        v_customer_found := true;
        v_display_name := v_account.display_name;
        v_status := v_account.status;
        v_created_at := v_account.created_at;
        v_updated_at := v_account.updated_at;
    ELSE
        -- Fallback para customer_profiles
        SELECT * INTO v_profile
        FROM public.customer_profiles
        WHERE id = p_customer_id;

        IF FOUND THEN
            v_customer_found := true;
            v_display_name := v_profile.nickname;
            v_status := v_profile.status;
            v_created_at := v_profile.created_at;
            v_updated_at := v_profile.updated_at;
        END IF;
    END IF;

    IF NOT v_customer_found THEN
        RETURN jsonb_build_object('success', false, 'code', 'CUSTOMER_NOT_FOUND', 'message', 'Cliente nao encontrado.');
    END IF;

    -- Licencas do cliente (busca por customer_account_id ou customer_id)
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'licenseId', l.id,
            'mode', l.mode,
            'status', l.status,
            'trialEligible', l.trial_eligible,
            'trialStartedAt', l.trial_started_at,
            'trialExpiresAt', l.trial_expires_at,
            'maxDevices', l.max_devices,
            'maxConcurrentSessions', l.max_concurrent_sessions,
            'activeDevicesCount', (
                SELECT count(*)::int
                FROM public.license_devices ld
                WHERE ld.license_id = l.id AND ld.status = 'ACTIVE'
            ),
            'createdAt', l.created_at,
            'expiresAt', l.expires_at
        ) ORDER BY l.created_at DESC
    ), '[]'::jsonb)
    INTO v_licenses
    FROM public.licenses l
    WHERE l.customer_account_id = p_customer_id 
       OR (l.customer_account_id IS NULL AND l.customer_id = p_customer_id);

    -- Dispositivos associados as licencas deste cliente
    SELECT COALESCE(jsonb_agg(DISTINCT
        jsonb_build_object(
            'deviceId', d.device_id,
            'displayCode', d.display_code,
            'deviceType', d.device_type,
            'deviceLabel', d.device_label,
            'status', d.status,
            'licenseId', ld.license_id,
            'boundAt', ld.bound_at,
            'lastSeenAt', d.last_seen_at
        )
    ), '[]'::jsonb)
    INTO v_devices
    FROM public.license_devices ld
    JOIN public.licenses l ON l.id = ld.license_id
    JOIN public.devices d ON d.device_id = ld.device_id
    WHERE (l.customer_account_id = p_customer_id 
           OR (l.customer_account_id IS NULL AND l.customer_id = p_customer_id))
      AND ld.status = 'ACTIVE';

    -- Fontes associadas ao cliente
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'sourceId', cs.source_id,
            'licenseId', cs.license_id,
            'displayName', cs.display_name,
            'sourceType', cs.source_type,
            'status', cs.status,
            'version', cs.version,
            'hasCredentials', true,
            'createdAt', cs.created_at,
            'updatedAt', cs.updated_at
        ) ORDER BY cs.created_at DESC
    ), '[]'::jsonb)
    INTO v_sources
    FROM public.customer_sources cs
    WHERE cs.customer_account_id = p_customer_id 
       OR (cs.customer_account_id IS NULL AND cs.customer_id = p_customer_id);

    RETURN jsonb_build_object(
        'success', true,
        'customer', jsonb_build_object(
            'customerId', p_customer_id,
            'nickname', v_display_name,
            'displayName', v_display_name,
            'status', v_status,
            'createdAt', v_created_at,
            'updatedAt', v_updated_at
        ),
        'licenses', v_licenses,
        'devices', v_devices,
        'sources', v_sources
    );
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_manager_get_customer_detail(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_manager_get_customer_detail(UUID) TO authenticated;

-- -----------------------------------------------------------------------------
-- 7. ATUALIZACAO DE public.rpc_manager_update_customer_status
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.rpc_manager_update_customer_status(
    p_customer_id UUID,
    p_status TEXT,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
DECLARE
    v_manager_id UUID;
    v_account RECORD;
    v_profile RECORD;
    v_target_status TEXT := UPPER(TRIM(p_status));
    v_before JSONB;
    v_after JSONB;
    v_found BOOLEAN := false;
BEGIN
    v_manager_id := private.require_active_manager();

    IF p_customer_id IS NULL THEN
        RAISE EXCEPTION 'CUSTOMER_ID_REQUIRED' USING ERRCODE = '22023';
    END IF;

    IF v_target_status NOT IN ('ACTIVE', 'SUSPENDED', 'BLOCKED') THEN
        RAISE EXCEPTION 'INVALID_CUSTOMER_STATUS' USING ERRCODE = '22023';
    END IF;

    -- Tenta customer_accounts primeiro
    SELECT * INTO v_account
    FROM public.customer_accounts
    WHERE id = p_customer_id
    FOR UPDATE;

    IF FOUND THEN
        v_found := true;
        v_before := jsonb_build_object('status', v_account.status, 'displayName', v_account.display_name);

        UPDATE public.customer_accounts
        SET status = v_target_status,
            updated_at = NOW()
        WHERE id = p_customer_id;

        -- Sincroniza customer_profiles se existir para compatibilidade legada
        UPDATE public.customer_profiles
        SET status = v_target_status,
            updated_at = NOW()
        WHERE id = p_customer_id;

        v_after := jsonb_build_object('status', v_target_status, 'displayName', v_account.display_name);
    ELSE
        SELECT * INTO v_profile
        FROM public.customer_profiles
        WHERE id = p_customer_id
        FOR UPDATE;

        IF FOUND THEN
            v_found := true;
            v_before := jsonb_build_object('status', v_profile.status, 'nickname', v_profile.nickname);

            UPDATE public.customer_profiles
            SET status = v_target_status,
                updated_at = NOW()
            WHERE id = p_customer_id;

            v_after := jsonb_build_object('status', v_target_status, 'nickname', v_profile.nickname);
        END IF;
    END IF;

    IF NOT v_found THEN
        RAISE EXCEPTION 'CUSTOMER_ACCOUNT_NOT_FOUND' USING ERRCODE = 'P0002';
    END IF;

    INSERT INTO public.commercial_audit_logs (
        manager_id,
        action,
        target_type,
        target_id,
        before_state,
        after_state,
        reason,
        created_at
    ) VALUES (
        v_manager_id,
        'CUSTOMER_STATUS_CHANGED',
        'CUSTOMER_ACCOUNT',
        p_customer_id::text,
        v_before,
        v_after,
        p_reason,
        NOW()
    );

    RETURN jsonb_build_object(
        'success', true,
        'customerId', p_customer_id,
        'status', v_target_status
    );
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_manager_update_customer_status(UUID, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_manager_update_customer_status(UUID, TEXT, TEXT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 8. ATUALIZACAO DE public.rpc_manager_get_license_detail
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.rpc_manager_get_license_detail(p_license_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
DECLARE
    v_license RECORD;
    v_customer_id UUID;
    v_customer_name TEXT;
    v_customer_status TEXT;
    v_account RECORD;
    v_profile RECORD;
    v_devices JSONB;
    v_managed_sources JSONB;
    v_customer_sources JSONB;
BEGIN
    PERFORM private.require_active_manager();

    IF p_license_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'code', 'LICENSE_ID_REQUIRED', 'message', 'ID da licenca e obrigatorio.');
    END IF;

    SELECT * INTO v_license
    FROM public.licenses
    WHERE id = p_license_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'code', 'LICENSE_NOT_FOUND', 'message', 'Licenca nao encontrada.');
    END IF;

    -- Resolve cliente via customer_account_id ou customer_id
    v_customer_id := COALESCE(v_license.customer_account_id, v_license.customer_id);
    IF v_license.customer_account_id IS NOT NULL THEN
        SELECT display_name, status INTO v_account
        FROM public.customer_accounts
        WHERE id = v_license.customer_account_id;
        IF FOUND THEN
            v_customer_name := v_account.display_name;
            v_customer_status := v_account.status;
        END IF;
    END IF;
    IF v_customer_name IS NULL AND v_license.customer_id IS NOT NULL THEN
        SELECT nickname, status INTO v_profile
        FROM public.customer_profiles
        WHERE id = v_license.customer_id;
        IF FOUND THEN
            v_customer_name := v_profile.nickname;
            v_customer_status := v_profile.status;
        END IF;
    END IF;

    -- Dispositivos vinculados
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'deviceId', d.device_id,
            'displayCode', d.display_code,
            'deviceType', d.device_type,
            'deviceLabel', d.device_label,
            'status', d.status,
            'boundAt', ld.bound_at,
            'lastSeenAt', d.last_seen_at
        ) ORDER BY ld.bound_at DESC
    ), '[]'::jsonb)
    INTO v_devices
    FROM public.license_devices ld
    JOIN public.devices d ON d.device_id = ld.device_id
    WHERE ld.license_id = p_license_id AND ld.status = 'ACTIVE';

    -- Fontes gerenciadas
    SELECT COALESCE(jsonb_agg(DISTINCT
        jsonb_build_object(
            'sourceId', ms.source_id,
            'name', ms.name,
            'sourceType', ms.source_type,
            'version', ms.version,
            'status', ms.status
        )
    ), '[]'::jsonb)
    INTO v_managed_sources
    FROM public.device_source_bindings dsb
    JOIN public.managed_sources ms ON ms.id = dsb.source_id
    WHERE dsb.license_id = p_license_id;

    -- Fontes de autoatendimento
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'sourceId', cs.source_id,
            'displayName', cs.display_name,
            'sourceType', cs.source_type,
            'status', cs.status,
            'version', cs.version,
            'hasCredentials', true,
            'createdAt', cs.created_at,
            'updatedAt', cs.updated_at
        ) ORDER BY cs.created_at DESC
    ), '[]'::jsonb)
    INTO v_customer_sources
    FROM public.customer_sources cs
    WHERE cs.license_id = p_license_id;

    RETURN jsonb_build_object(
        'success', true,
        'license', jsonb_build_object(
            'licenseId', v_license.id,
            'customerId', v_customer_id,
            'mode', v_license.mode,
            'status', v_license.status,
            'trialEligible', v_license.trial_eligible,
            'trialStartedAt', v_license.trial_started_at,
            'trialExpiresAt', v_license.trial_expires_at,
            'maxDevices', v_license.max_devices,
            'maxConcurrentSessions', v_license.max_concurrent_sessions,
            'createdAt', v_license.created_at,
            'expiresAt', v_license.expires_at
        ),
        'customer', CASE
            WHEN v_customer_id IS NOT NULL THEN
                jsonb_build_object(
                    'customerId', v_customer_id,
                    'nickname', v_customer_name,
                    'displayName', v_customer_name,
                    'status', v_customer_status
                )
            ELSE NULL
        END,
        'devices', v_devices,
        'managedSources', v_managed_sources,
        'customerSources', v_customer_sources
    );
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_manager_get_license_detail(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_manager_get_license_detail(UUID) TO authenticated;

-- -----------------------------------------------------------------------------
-- 9. ATUALIZACAO DE public.rpc_manager_list_customer_sources
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.rpc_manager_list_customer_sources()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
DECLARE
    v_result JSONB;
BEGIN
    PERFORM private.require_active_manager();

    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'sourceId', cs.source_id,
            'customerId', COALESCE(cs.customer_account_id, cs.customer_id),
            'customerNickname', COALESCE(ca.display_name, cp.nickname),
            'licenseId', cs.license_id,
            'displayName', cs.display_name,
            'sourceType', cs.source_type,
            'status', cs.status,
            'version', cs.version,
            'hasCredentials', true,
            'createdAt', cs.created_at,
            'updatedAt', cs.updated_at
        ) ORDER BY cs.created_at DESC
    ), '[]'::jsonb)
    INTO v_result
    FROM public.customer_sources cs
    LEFT JOIN public.customer_accounts ca ON ca.id = cs.customer_account_id
    LEFT JOIN public.customer_profiles cp ON cp.id = cs.customer_id;

    RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_manager_list_customer_sources() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_manager_list_customer_sources() TO authenticated;
