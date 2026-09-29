-- C11 dual activation: one server-side completion boundary for Manager and
-- Self-Service paths. Plaintext source configuration never enters this SQL;
-- callers provide only an AES-256-GCM envelope.

CREATE OR REPLACE FUNCTION private.validate_device_code_key(
    p_display_code TEXT,
    p_activation_key_hash TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, extensions, private
AS $$
DECLARE
    v_display_code VARCHAR(32) := upper(NULLIF(trim(p_display_code), ''));
    v_key_hash VARCHAR(64) := lower(NULLIF(trim(p_activation_key_hash), ''));
    v_key RECORD;
    v_request RECORD;
BEGIN
    IF v_display_code IS NULL OR v_display_code !~ '^XF-[0-9A-Z]{4}-[0-9A-Z]{4}$'
       OR v_key_hash IS NULL OR v_key_hash !~ '^[0-9a-f]{64}$' THEN
        RAISE EXCEPTION 'ACTIVATION_KEY_INVALID' USING ERRCODE = '42501';
    END IF;

    SELECT device_id, display_code, key_status
    INTO v_key
    FROM private.device_activation_key_vault
    WHERE display_code = v_display_code
      AND activation_key_hash = v_key_hash
    ORDER BY created_at DESC
    LIMIT 1
    FOR UPDATE;

    IF NOT FOUND THEN
        UPDATE public.device_activation_requests
        SET attempts_count = attempts_count + 1,
            status = CASE WHEN attempts_count + 1 >= 5 THEN 'CANCELLED' ELSE status END
        WHERE display_code = v_display_code
          AND status = 'PENDING';
        RAISE EXCEPTION 'INVALID_ACTIVATION_KEY' USING ERRCODE = '42501';
    END IF;

    IF v_key.key_status <> 'ACTIVE' THEN
        RAISE EXCEPTION 'PERMANENT_KEY_REVOKED' USING ERRCODE = '42501';
    END IF;

    SELECT activation_id, installation_id, device_id, display_code,
           device_token_hash, device_type, device_label, status
    INTO v_request
    FROM public.device_activation_requests
    WHERE device_id = v_key.device_id
      AND display_code = v_display_code
    ORDER BY created_at DESC
    LIMIT 1;

    UPDATE private.device_activation_key_vault
    SET last_used_at = NOW()
    WHERE device_id = v_key.device_id
      AND key_status = 'ACTIVE';

    RETURN jsonb_build_object(
        'success', true,
        'deviceId', v_key.device_id,
        'displayCode', v_display_code,
        'activationId', CASE WHEN v_request.activation_id IS NULL THEN NULL ELSE v_request.activation_id END,
        'installationId', CASE WHEN v_request.installation_id IS NULL THEN NULL ELSE v_request.installation_id END,
        'requestStatus', CASE WHEN v_request.status IS NULL THEN NULL ELSE v_request.status END,
        'deviceTokenHash', CASE WHEN v_request.device_token_hash IS NULL THEN NULL ELSE v_request.device_token_hash END,
        'deviceType', CASE WHEN v_request.device_type IS NULL THEN NULL ELSE v_request.device_type END,
        'deviceLabel', CASE WHEN v_request.device_label IS NULL THEN NULL ELSE v_request.device_label END
    );
END;
$$;

REVOKE ALL ON FUNCTION private.validate_device_code_key(TEXT, TEXT) FROM PUBLIC, anon, authenticated;

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
            INSERT INTO public.licenses (
                id, license_key_hash, mode, status, trial_eligible, trial_started_at,
                trial_expires_at, max_devices, max_concurrent_sessions, customer_id, created_at
            ) VALUES (
                v_license_id,
                encode(sha256(('PUBLIC_TRIAL_' || v_effective_customer_id::text || '_' || v_license_id::text || '_' || extract(epoch FROM v_now)::text)::bytea), 'hex'),
                'SELF_SERVICE', 'TRIAL', true, v_now, v_trial_expires_at, 1, 1,
                v_effective_customer_id, v_now
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
            source_id, customer_id, license_id, source_type, display_name,
            status, version, created_at, updated_at
        ) VALUES (
            v_source_id, COALESCE(v_effective_customer_id, v_license.customer_id),
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
        SET status = 'CONSUMED', claimed_at = v_now,
            claimed_by_customer_id = v_effective_customer_id,
            linked_license_id = v_license_id,
            linked_source_id = v_source_id
        WHERE activation_id = p_activation_id;
        IF v_request.installation_id IS NOT NULL THEN
            UPDATE public.app_installations SET last_seen_at = v_now
            WHERE installation_id = v_request.installation_id;
        END IF;
    END IF;

    INSERT INTO public.device_activation_events (
        activation_id, customer_id, license_id, device_id, display_code,
        source_id, action, result, metadata
    ) VALUES
    (
        p_activation_id, v_effective_customer_id, v_license_id, v_device_id,
        v_display_code, v_source_id, 'DEVICE_ACTIVATION_SOURCE_BOUND', 'SUCCESS',
        jsonb_build_object('sourceKind', v_source_kind, 'activationPath', v_path)
    ),
    (
        p_activation_id, v_effective_customer_id, v_license_id, v_device_id,
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

REVOKE ALL ON FUNCTION private.activate_device_source_core(UUID, TEXT, TEXT, UUID, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.rpc_public_complete_device_activation(
    p_session_token_hash TEXT,
    p_display_code TEXT,
    p_customer_id UUID,
    p_customer_nickname TEXT,
    p_source_id TEXT,
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
    v_session RECORD;
    v_request RECORD;
    v_result JSONB;
    v_session_hash VARCHAR(64) := lower(NULLIF(trim(p_session_token_hash), ''));
    v_display_code VARCHAR(32) := upper(NULLIF(trim(p_display_code), ''));
BEGIN
    IF COALESCE(current_setting('request.jwt.claim.role', true), '') IN ('anon', 'authenticated') THEN
        RAISE EXCEPTION 'SERVICE_ROLE_REQUIRED' USING ERRCODE = '42501';
    END IF;
    IF v_session_hash IS NULL OR v_session_hash !~ '^[0-9a-f]{64}$' THEN
        RAISE EXCEPTION 'SESSION_CAPABILITY_INVALID' USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_session
    FROM public.device_activation_sessions
    WHERE session_token_hash = v_session_hash
    FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'ACTIVATION_SESSION_NOT_FOUND' USING ERRCODE = 'P0002'; END IF;
    IF v_session.status = 'COMPLETED' THEN
        RETURN jsonb_build_object(
            'success', true, 'status', 'CONSUMED',
            'deviceAuthorizationState', 'AUTHORIZED',
            'licenseId', v_session.license_id, 'sourceId', v_session.source_id,
            'sourceBindingStatus', 'ACTIVE', 'licenseStatus', 'TRIAL',
            'sourceResolution', 'SOURCE_READY'
        );
    END IF;
    IF v_session.status <> 'OPEN' THEN RAISE EXCEPTION 'ACTIVATION_SESSION_NOT_OPEN' USING ERRCODE = '42501'; END IF;
    IF NOW() >= v_session.expires_at THEN
        UPDATE public.device_activation_sessions SET status = 'EXPIRED' WHERE session_id = v_session.session_id;
        RAISE EXCEPTION 'ACTIVATION_SESSION_EXPIRED' USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_request
    FROM public.device_activation_requests
    WHERE activation_id = v_session.activation_id
    FOR UPDATE;
    IF NOT FOUND OR v_request.status <> 'PENDING' OR v_request.display_code <> v_display_code THEN
        RAISE EXCEPTION 'ACTIVATION_NOT_PENDING' USING ERRCODE = '42501';
    END IF;

    v_result := private.activate_device_source_core(
        v_request.activation_id,
        v_request.device_id,
        v_display_code,
        p_customer_id,
        p_customer_nickname,
        NULL,
        p_source_id,
        'SELF_SERVICE',
        p_source_type,
        p_display_name,
        p_ciphertext,
        p_nonce,
        p_auth_tag,
        p_key_version,
        'SELF_SERVICE'
    );

    UPDATE public.device_activation_sessions
    SET status = 'COMPLETED', customer_id = p_customer_id,
        license_id = (v_result->>'licenseId')::UUID,
        source_id = v_result->>'sourceId', completed_at = NOW()
    WHERE session_id = v_session.session_id;

    RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_public_complete_device_activation(TEXT, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_public_complete_device_activation(TEXT, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.rpc_manager_complete_device_activation(
    p_display_code TEXT,
    p_activation_key_hash TEXT,
    p_license_id UUID,
    p_source_id TEXT,
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
    v_pair JSONB;
    v_result JSONB;
    v_license_customer_id UUID;
BEGIN
    PERFORM private.require_master_manager();
    v_pair := private.validate_device_code_key(p_display_code, p_activation_key_hash);
    SELECT customer_id INTO v_license_customer_id
    FROM public.licenses
    WHERE id = p_license_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'LICENSE_NOT_FOUND' USING ERRCODE = 'P0002'; END IF;

    v_result := private.activate_device_source_core(
        CASE WHEN NULLIF(v_pair->>'activationId', '') IS NULL THEN NULL ELSE (v_pair->>'activationId')::UUID END,
        v_pair->>'deviceId',
        v_pair->>'displayCode',
        v_license_customer_id,
        NULL,
        p_license_id,
        p_source_id,
        'MANAGED',
        p_source_type,
        p_display_name,
        p_ciphertext,
        p_nonce,
        p_auth_tag,
        p_key_version,
        'MANAGER_ASSISTED'
    );

    RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_manager_complete_device_activation(TEXT, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_manager_complete_device_activation(TEXT, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
