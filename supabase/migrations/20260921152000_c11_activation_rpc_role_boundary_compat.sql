-- C11 forward compatibility: Supabase service-boundary requests may not expose a JWT role claim.
-- Direct anon/authenticated execution remains blocked by function grants.

-- C11 V2: permanent device activation key, external activation reuse and
-- Master-only audited reveal. Raw keys and source secrets remain encrypted.

CREATE TABLE IF NOT EXISTS private.device_activation_key_vault (
    vault_record_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id VARCHAR(64) NOT NULL UNIQUE,
    display_code VARCHAR(32) NOT NULL,
    activation_key_hash VARCHAR(64) NOT NULL CHECK (activation_key_hash ~ '^[0-9a-fA-F]{64}$'),
    ciphertext TEXT NOT NULL CHECK (ciphertext ~ '^[0-9a-fA-F]+$'),
    nonce TEXT NOT NULL CHECK (nonce ~ '^[0-9a-fA-F]{24}$'),
    auth_tag TEXT NOT NULL CHECK (auth_tag ~ '^[0-9a-fA-F]{32}$'),
    key_version VARCHAR(32) NOT NULL DEFAULT 'v1',
    key_status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE' CHECK (key_status IN ('ACTIVE', 'REVOKED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    rotated_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    failed_attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (failed_attempt_count >= 0)
);

CREATE INDEX IF NOT EXISTS idx_device_activation_key_vault_display
    ON private.device_activation_key_vault(display_code, key_status);

ALTER TABLE private.device_activation_key_vault ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE private.device_activation_key_vault FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS private.manager_sensitive_reveal_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manager_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    device_id VARCHAR(64) NOT NULL,
    display_code VARCHAR(32) NOT NULL,
    source_id VARCHAR(64),
    reveal_kind VARCHAR(32) NOT NULL CHECK (reveal_kind IN ('DEVICE_KEY', 'SOURCE_SECRET', 'DEVICE_AND_SOURCE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE private.manager_sensitive_reveal_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE private.manager_sensitive_reveal_audit FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION private.require_master_manager()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
DECLARE
    v_user_id UUID := auth.uid();
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'MANAGER_AUTH_REQUIRED' USING ERRCODE = '42501';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.manager_admins
        WHERE user_id = v_user_id
          AND status = 'ACTIVE'
          AND role = 'OWNER'
    ) THEN
        RAISE EXCEPTION 'MASTER_MANAGER_NOT_AUTHORIZED' USING ERRCODE = '42501';
    END IF;

    RETURN v_user_id;
END;
$$;

REVOKE ALL ON FUNCTION private.require_master_manager() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.rpc_register_permanent_device_activation_key(
    p_activation_id UUID,
    p_device_id TEXT,
    p_display_code TEXT,
    p_activation_key_hash TEXT,
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
    v_request RECORD;
    v_device_id VARCHAR(64) := NULLIF(trim(p_device_id), '');
    v_display_code VARCHAR(32) := upper(NULLIF(trim(p_display_code), ''));
    v_key_hash VARCHAR(64) := lower(NULLIF(trim(p_activation_key_hash), ''));
    v_key_version VARCHAR(32) := NULLIF(trim(p_key_version), '');
BEGIN
    IF COALESCE(current_setting('request.jwt.claim.role', true), '') IN ('anon', 'authenticated') THEN
        RAISE EXCEPTION 'SERVICE_ROLE_REQUIRED' USING ERRCODE = '42501';
    END IF;
    IF p_activation_id IS NULL OR v_device_id IS NULL OR v_display_code IS NULL
       OR v_key_hash IS NULL OR v_key_hash !~ '^[0-9a-f]{64}$'
       OR p_ciphertext IS NULL OR p_ciphertext !~ '^[0-9a-fA-F]+$'
       OR p_nonce IS NULL OR p_nonce !~ '^[0-9a-fA-F]{24}$'
       OR p_auth_tag IS NULL OR p_auth_tag !~ '^[0-9a-fA-F]{32}$'
       OR v_key_version IS NULL OR v_key_version !~ '^[A-Za-z0-9_.-]{1,32}$' THEN
        RAISE EXCEPTION 'PERMANENT_KEY_ENVELOPE_INVALID' USING ERRCODE = '22023';
    END IF;

    SELECT * INTO v_request
    FROM public.device_activation_requests
    WHERE activation_id = p_activation_id
    FOR UPDATE;

    IF NOT FOUND OR v_request.device_id <> v_device_id
       OR v_request.display_code <> v_display_code
       OR v_request.activation_key_hash <> v_key_hash THEN
        RAISE EXCEPTION 'ACTIVATION_KEY_REGISTRATION_INVALID' USING ERRCODE = '42501';
    END IF;

    INSERT INTO private.device_activation_key_vault (
        device_id, display_code, activation_key_hash, ciphertext, nonce, auth_tag,
        key_version, key_status, created_at, rotated_at
    ) VALUES (
        v_device_id, v_display_code, v_key_hash, p_ciphertext, p_nonce, p_auth_tag,
        v_key_version, 'ACTIVE', NOW(), NULL
    )
    ON CONFLICT (device_id) DO UPDATE SET
        display_code = EXCLUDED.display_code,
        activation_key_hash = EXCLUDED.activation_key_hash,
        ciphertext = EXCLUDED.ciphertext,
        nonce = EXCLUDED.nonce,
        auth_tag = EXCLUDED.auth_tag,
        key_version = EXCLUDED.key_version,
        key_status = 'ACTIVE',
        rotated_at = CASE
            WHEN private.device_activation_key_vault.activation_key_hash IS DISTINCT FROM EXCLUDED.activation_key_hash
            THEN NOW()
            ELSE private.device_activation_key_vault.rotated_at
        END;

    RETURN jsonb_build_object('success', true, 'status', 'ACTIVE', 'deviceId', v_device_id);
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_register_permanent_device_activation_key(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_register_permanent_device_activation_key(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.rpc_public_start_device_activation(
    p_display_code TEXT,
    p_activation_key_hash TEXT,
    p_session_token_hash TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, extensions, private
AS $$
DECLARE
    v_display_code VARCHAR(32) := upper(NULLIF(trim(p_display_code), ''));
    v_key_hash VARCHAR(64) := lower(NULLIF(trim(p_activation_key_hash), ''));
    v_session_hash VARCHAR(64) := lower(NULLIF(trim(p_session_token_hash), ''));
    v_request RECORD;
    v_key RECORD;
    v_session_id UUID;
    v_expires_at TIMESTAMPTZ;
    v_attempts INTEGER;
BEGIN
    IF COALESCE(current_setting('request.jwt.claim.role', true), '') IN ('anon', 'authenticated') THEN
        RAISE EXCEPTION 'SERVICE_ROLE_REQUIRED' USING ERRCODE = '42501';
    END IF;
    IF v_display_code IS NULL OR v_display_code !~ '^XF-[0-9A-Z]{4}-[0-9A-Z]{4}$'
       OR v_key_hash IS NULL OR v_key_hash !~ '^[0-9a-f]{64}$'
       OR v_session_hash IS NULL OR v_session_hash !~ '^[0-9a-f]{64}$' THEN
        RETURN jsonb_build_object('success', false, 'code', 'ACTIVATION_KEY_INVALID');
    END IF;

    SELECT * INTO v_request
    FROM public.device_activation_requests
    WHERE display_code = v_display_code
    ORDER BY created_at DESC
    LIMIT 1
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'code', 'ACTIVATION_NOT_FOUND');
    END IF;

    SELECT key_status, activation_key_hash
    INTO v_key
    FROM private.device_activation_key_vault
    WHERE device_id = v_request.device_id AND display_code = v_display_code;

    IF FOUND AND v_key.key_status <> 'ACTIVE' THEN
        RETURN jsonb_build_object('success', false, 'code', 'PERMANENT_KEY_REVOKED');
    END IF;

    IF v_request.status = 'PENDING' AND NOW() >= v_request.created_at + INTERVAL '15 minutes' THEN
        UPDATE public.device_activation_requests
        SET status = 'CANCELLED'
        WHERE activation_id = v_request.activation_id;
        v_request.status := 'CANCELLED';
    END IF;

    IF v_request.status = 'CANCELLED' AND v_request.attempts_count >= 5 THEN
        RETURN jsonb_build_object('success', false, 'code', 'ACTIVATION_ATTEMPT_LIMIT_EXCEEDED');
    END IF;

    IF v_request.status <> 'PENDING' THEN
        IF v_key.device_id IS NULL OR v_key.key_status <> 'ACTIVE' OR v_key.activation_key_hash <> v_key_hash
           OR v_request.activation_key_hash <> v_key_hash THEN
            RETURN jsonb_build_object('success', false, 'code', 'ACTIVATION_NOT_PENDING');
        END IF;

        INSERT INTO public.device_activation_requests (
            activation_id, installation_id, device_id, display_code,
            device_token_hash, activation_key_hash, activation_status_secret_hash,
            status, attempts_count, device_type, device_label, created_at
        ) VALUES (
            gen_random_uuid(), v_request.installation_id, v_request.device_id, v_request.display_code,
            v_request.device_token_hash, v_request.activation_key_hash,
            encode(gen_random_bytes(32), 'hex'), 'PENDING', 0,
            v_request.device_type, v_request.device_label, NOW()
        )
        RETURNING * INTO v_request;
    END IF;

    IF v_request.attempts_count >= 5 THEN
        UPDATE public.device_activation_requests SET status = 'CANCELLED' WHERE activation_id = v_request.activation_id;
        RETURN jsonb_build_object('success', false, 'code', 'ACTIVATION_ATTEMPT_LIMIT_EXCEEDED');
    END IF;

    IF v_request.activation_key_hash <> v_key_hash THEN
        v_attempts := v_request.attempts_count + 1;
        UPDATE public.device_activation_requests
        SET attempts_count = v_attempts,
            status = CASE WHEN v_attempts >= 5 THEN 'CANCELLED' ELSE 'PENDING' END
        WHERE activation_id = v_request.activation_id;
        INSERT INTO public.device_activation_events (
            activation_id, device_id, display_code, action, result, metadata
        ) VALUES (
            v_request.activation_id, v_request.device_id, v_request.display_code,
            'DEVICE_ACTIVATION_REJECTED', 'REJECTED',
            jsonb_build_object('code', CASE WHEN v_attempts >= 5 THEN 'ACTIVATION_ATTEMPT_LIMIT_EXCEEDED' ELSE 'INVALID_ACTIVATION_KEY' END, 'attemptsCount', v_attempts, 'activationPath', 'PUBLIC_CODE_KEY')
        );
        RETURN jsonb_build_object(
            'success', false,
            'code', CASE WHEN v_attempts >= 5 THEN 'ACTIVATION_ATTEMPT_LIMIT_EXCEEDED' ELSE 'INVALID_ACTIVATION_KEY' END,
            'attemptsCount', v_attempts
        );
    END IF;

    UPDATE public.device_activation_sessions
    SET status = 'CANCELLED'
    WHERE activation_id = v_request.activation_id AND status = 'OPEN';

    v_expires_at := NOW() + INTERVAL '10 minutes';
    INSERT INTO public.device_activation_sessions (activation_id, session_token_hash, expires_at)
    VALUES (v_request.activation_id, v_session_hash, v_expires_at)
    RETURNING session_id INTO v_session_id;

    UPDATE private.device_activation_key_vault
    SET last_used_at = NOW()
    WHERE device_id = v_request.device_id AND key_status = 'ACTIVE';

    RETURN jsonb_build_object(
        'success', true,
        'sessionId', v_session_id,
        'displayCode', v_request.display_code,
        'expiresAt', v_expires_at,
        'sourceSetupAllowed', true
    );
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_public_start_device_activation(TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_public_start_device_activation(TEXT, TEXT, TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.rpc_public_check_device_activation_session(
    p_session_token_hash TEXT,
    p_display_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, extensions, private
AS $$
DECLARE
    v_session RECORD;
    v_existing RECORD;
    v_display_code VARCHAR(32) := upper(NULLIF(trim(p_display_code), ''));
    v_session_hash VARCHAR(64) := lower(NULLIF(trim(p_session_token_hash), ''));
BEGIN
    IF COALESCE(current_setting('request.jwt.claim.role', true), '') IN ('anon', 'authenticated') THEN
        RAISE EXCEPTION 'SERVICE_ROLE_REQUIRED' USING ERRCODE = '42501';
    END IF;
    IF v_session_hash IS NULL OR v_session_hash !~ '^[0-9a-f]{64}$'
       OR v_display_code IS NULL OR v_display_code !~ '^XF-[0-9A-Z]{4}-[0-9A-Z]{4}$' THEN
        RETURN jsonb_build_object('success', false, 'code', 'ACTIVATION_SESSION_NOT_FOUND');
    END IF;

    SELECT s.status, s.expires_at, r.status AS request_status, r.display_code,
           r.device_id
    INTO v_session
    FROM public.device_activation_sessions s
    JOIN public.device_activation_requests r ON r.activation_id = s.activation_id
    WHERE s.session_token_hash = v_session_hash
    LIMIT 1;

    IF NOT FOUND OR v_session.display_code <> v_display_code THEN
        RETURN jsonb_build_object('success', false, 'code', 'ACTIVATION_SESSION_NOT_FOUND');
    END IF;
    IF v_session.request_status <> 'PENDING' THEN
        RETURN jsonb_build_object('success', false, 'code', 'ACTIVATION_NOT_PENDING');
    END IF;
    IF v_session.status <> 'OPEN' THEN
        RETURN jsonb_build_object('success', false, 'code', 'ACTIVATION_SESSION_NOT_OPEN');
    END IF;
    IF NOW() >= v_session.expires_at THEN
        RETURN jsonb_build_object('success', false, 'code', 'ACTIVATION_SESSION_EXPIRED');
    END IF;

    SELECT l.customer_id
    INTO v_existing
    FROM public.license_devices ld
    JOIN public.licenses l ON l.id = ld.license_id
    JOIN public.devices d ON d.device_id = ld.device_id
    WHERE ld.device_id = v_session.device_id
      AND ld.status = 'ACTIVE'
      AND d.status = 'AUTHORIZED'
      AND l.status IN ('ACTIVE', 'TRIAL')
    ORDER BY ld.bound_at DESC
    LIMIT 1;

    RETURN jsonb_build_object(
        'success', true,
        'sourceSetupAllowed', true,
        'expiresAt', v_session.expires_at,
        'reuseExistingDevice', FOUND,
        'customerId', CASE WHEN FOUND THEN v_existing.customer_id ELSE NULL END
    );
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_public_check_device_activation_session(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_public_check_device_activation_session(TEXT, TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.rpc_manager_get_device_sensitive_envelope(p_device_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, extensions, private
AS $$
DECLARE
    v_manager_id UUID := private.require_master_manager();
    v_device RECORD;
    v_key RECORD;
    v_license RECORD;
    v_source RECORD;
    v_source_envelope RECORD;
    v_reveal_kind VARCHAR(32);
BEGIN
    SELECT device_id, display_code, device_type, device_label, status
    INTO v_device
    FROM public.devices
    WHERE device_id = NULLIF(trim(p_device_id), '');
    IF NOT FOUND THEN RAISE EXCEPTION 'DEVICE_NOT_FOUND' USING ERRCODE = 'P0002'; END IF;

    SELECT device_id, display_code, activation_key_hash, ciphertext, nonce, auth_tag, key_version, key_status
    INTO v_key
    FROM private.device_activation_key_vault
    WHERE device_id = v_device.device_id;

    SELECT l.id AS license_id, l.customer_id, l.mode, l.status
    INTO v_license
    FROM public.license_devices ld
    JOIN public.licenses l ON l.id = ld.license_id
    WHERE ld.device_id = v_device.device_id AND ld.status = 'ACTIVE'
    ORDER BY ld.bound_at DESC
    LIMIT 1;

    IF FOUND AND v_license.mode = 'SELF_SERVICE' THEN
        SELECT cs.source_id, cs.version, cs.source_type, cs.display_name, cs.status,
               v.ciphertext, v.nonce, v.auth_tag, v.key_version
        INTO v_source_envelope
        FROM public.customer_sources cs
        JOIN private.customer_source_secret_vault v
          ON v.source_id = cs.source_id AND v.source_version = cs.version
        WHERE cs.license_id = v_license.license_id AND cs.status = 'ACTIVE'
        ORDER BY cs.version DESC
        LIMIT 1;
    ELSIF FOUND THEN
        SELECT ms.source_id, ms.version, ms.source_type, ms.name AS display_name, ms.status,
               v.ciphertext, v.nonce, v.auth_tag, v.key_version
        INTO v_source_envelope
        FROM public.device_source_bindings dsb
        JOIN public.managed_sources ms ON ms.id = dsb.source_id
        JOIN private.managed_source_secret_vault v
          ON v.source_id = ms.source_id AND v.source_version = ms.version
        WHERE dsb.device_id = v_device.device_id AND dsb.license_id = v_license.license_id
        ORDER BY dsb.created_at DESC
        LIMIT 1;
    END IF;

    v_reveal_kind := CASE
        WHEN v_key.device_id IS NOT NULL AND v_source_envelope.source_id IS NOT NULL THEN 'DEVICE_AND_SOURCE'
        WHEN v_key.device_id IS NOT NULL THEN 'DEVICE_KEY'
        ELSE 'SOURCE_SECRET'
    END;

    INSERT INTO private.manager_sensitive_reveal_audit (
        manager_id, device_id, display_code, source_id, reveal_kind
    ) VALUES (
        v_manager_id, v_device.device_id, v_device.display_code,
        CASE WHEN v_source_envelope.source_id IS NULL THEN NULL ELSE v_source_envelope.source_id END,
        v_reveal_kind
    );

    RETURN jsonb_build_object(
        'success', true,
        'device', jsonb_build_object(
            'deviceId', v_device.device_id,
            'displayCode', v_device.display_code,
            'deviceType', v_device.device_type,
            'deviceLabel', v_device.device_label,
            'status', v_device.status,
            'licenseId', CASE WHEN v_license IS NULL THEN NULL ELSE v_license.license_id END,
            'licenseStatus', CASE WHEN v_license IS NULL THEN NULL ELSE v_license.status END
        ),
        'permanentKeyEnvelope', CASE WHEN v_key.device_id IS NULL THEN NULL ELSE jsonb_build_object(
            'deviceId', v_key.device_id, 'displayCode', v_key.display_code,
            'ciphertext', v_key.ciphertext, 'nonce', v_key.nonce,
            'authTag', v_key.auth_tag, 'keyVersion', v_key.key_version,
            'keyStatus', v_key.key_status
        ) END,
        'sourceEnvelope', CASE WHEN v_source_envelope.source_id IS NULL THEN NULL ELSE jsonb_build_object(
            'sourceId', v_source_envelope.source_id,
            'sourceVersion', v_source_envelope.version,
            'protocol', v_source_envelope.source_type,
            'displayName', v_source_envelope.display_name,
            'sourceStatus', v_source_envelope.status,
            'ciphertext', v_source_envelope.ciphertext,
            'nonce', v_source_envelope.nonce,
            'authTag', v_source_envelope.auth_tag,
            'keyVersion', v_source_envelope.key_version
        ) END
    );
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_manager_get_device_sensitive_envelope(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_manager_get_device_sensitive_envelope(TEXT) TO authenticated;



-- C11 V2: reuse the permanent device key for a new source session on the
-- same authorized device without creating a second trial or license.

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
    v_profile RECORD;
    v_license RECORD;
    v_existing_device RECORD;
    v_license_id UUID;
    v_effective_customer_id UUID := p_customer_id;
    v_display_code VARCHAR(32) := upper(NULLIF(trim(p_display_code), ''));
    v_session_hash VARCHAR(64) := lower(NULLIF(trim(p_session_token_hash), ''));
    v_source_id VARCHAR(64) := lower(NULLIF(trim(p_source_id), ''));
    v_source_type VARCHAR(20) := upper(NULLIF(trim(p_source_type), ''));
    v_display_name VARCHAR(100) := NULLIF(trim(p_display_name), '');
    v_nickname VARCHAR(32) := NULLIF(trim(p_customer_nickname), '');
    v_now TIMESTAMPTZ := NOW();
    v_trial_expires_at TIMESTAMPTZ;
    v_active_count INTEGER;
    v_trial JSONB;
    v_reuse_existing_device BOOLEAN := FALSE;
BEGIN
    IF COALESCE(current_setting('request.jwt.claim.role', true), '') IN ('anon', 'authenticated') THEN
        RAISE EXCEPTION 'SERVICE_ROLE_REQUIRED' USING ERRCODE = '42501';
    END IF;
    IF v_session_hash IS NULL OR v_session_hash !~ '^[0-9a-f]{64}$' THEN
        RAISE EXCEPTION 'SESSION_CAPABILITY_INVALID' USING ERRCODE = '42501';
    END IF;
    IF v_display_code IS NULL OR v_display_code !~ '^XF-[0-9A-Z]{4}-[0-9A-Z]{4}$' THEN
        RAISE EXCEPTION 'DISPLAY_CODE_INVALID' USING ERRCODE = '22023';
    END IF;
    IF p_customer_id IS NULL OR v_nickname IS NULL THEN
        RAISE EXCEPTION 'CUSTOMER_BOOTSTRAP_REQUIRED' USING ERRCODE = '22023';
    END IF;
    IF v_source_id IS NULL OR v_source_id !~ '^csrc_[a-z0-9]+$' THEN
        RAISE EXCEPTION 'SOURCE_ID_INVALID' USING ERRCODE = '22023';
    END IF;
    IF v_source_type <> 'M3U' THEN
        RAISE EXCEPTION 'SOURCE_TYPE_NOT_ALLOWED' USING ERRCODE = '22023';
    END IF;
    IF v_display_name IS NULL OR length(v_display_name) > 100 THEN
        RAISE EXCEPTION 'SOURCE_DISPLAY_NAME_INVALID' USING ERRCODE = '22023';
    END IF;
    IF p_ciphertext IS NULL OR p_ciphertext !~ '^[0-9a-fA-F]+$' OR length(p_ciphertext) = 0 OR length(p_ciphertext) % 2 <> 0
       OR p_nonce IS NULL OR p_nonce !~ '^[0-9a-fA-F]{24}$'
       OR p_auth_tag IS NULL OR p_auth_tag !~ '^[0-9a-fA-F]{32}$'
       OR p_key_version IS NULL OR p_key_version !~ '^[A-Za-z0-9_.-]{1,32}$' THEN
        RAISE EXCEPTION 'SOURCE_ENVELOPE_INVALID' USING ERRCODE = '22023';
    END IF;

    SELECT * INTO v_session
    FROM public.device_activation_sessions
    WHERE session_token_hash = v_session_hash
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'ACTIVATION_SESSION_NOT_FOUND' USING ERRCODE = 'P0002';
    END IF;
    IF v_session.status = 'COMPLETED' THEN
        RETURN jsonb_build_object(
            'success', true, 'status', 'CONSUMED',
            'deviceAuthorizationState', 'AUTHORIZED',
            'licenseId', v_session.license_id, 'sourceId', v_session.source_id
        );
    END IF;
    IF v_session.status <> 'OPEN' THEN
        RAISE EXCEPTION 'ACTIVATION_SESSION_NOT_OPEN' USING ERRCODE = '42501';
    END IF;
    IF v_now >= v_session.expires_at THEN
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

    SELECT d.device_id, d.status, l.id AS license_id, l.customer_id, l.status AS license_status
    INTO v_existing_device
    FROM public.devices d
    JOIN public.license_devices ld ON ld.device_id = d.device_id AND ld.status = 'ACTIVE'
    JOIN public.licenses l ON l.id = ld.license_id
    WHERE d.device_id = v_request.device_id
    ORDER BY ld.bound_at DESC
    LIMIT 1
    FOR UPDATE;

    IF FOUND AND v_existing_device.status = 'REVOKED' THEN
        RAISE EXCEPTION 'DEVICE_REVOKED_REQUIRES_REACTIVATION' USING ERRCODE = '42501';
    END IF;
    IF FOUND AND v_existing_device.status = 'AUTHORIZED' THEN
        v_reuse_existing_device := TRUE;
        v_effective_customer_id := v_existing_device.customer_id;
    END IF;

    SELECT * INTO v_profile
    FROM public.customer_profiles
    WHERE id = v_effective_customer_id
    FOR UPDATE;

    IF NOT FOUND THEN
        INSERT INTO public.customer_profiles (id, nickname, status, created_at, updated_at)
        VALUES (v_effective_customer_id, private.validate_customer_nickname(v_nickname), 'ACTIVE', v_now, v_now)
        RETURNING * INTO v_profile;
    ELSIF v_profile.status <> 'ACTIVE' THEN
        RAISE EXCEPTION 'CUSTOMER_PROFILE_NOT_ACTIVE' USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_license
    FROM public.licenses
    WHERE customer_id = v_effective_customer_id AND status IN ('ACTIVE', 'TRIAL')
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
        UPDATE public.customer_profiles SET trial_used_at = v_now, updated_at = v_now WHERE id = v_effective_customer_id;
        PERFORM set_config('private.system_trial_mutation', 'false', true);
        v_trial := jsonb_build_object('trialStarted', true, 'status', 'TRIAL', 'trialStartedAt', v_now, 'trialExpiresAt', v_trial_expires_at, 'maxDevices', 1, 'maxConcurrentSessions', 1);
    ELSE
        v_license_id := v_license.id;
        IF v_license.status = 'TRIAL' AND (v_license.trial_expires_at IS NULL OR v_now >= v_license.trial_expires_at) THEN
            RAISE EXCEPTION 'TRIAL_EXPIRED' USING ERRCODE = '42501';
        END IF;
        v_trial := jsonb_build_object('trialStarted', false, 'status', v_license.status);
    END IF;

    SELECT count(*) INTO v_active_count
    FROM public.license_devices
    WHERE license_id = v_license_id AND status = 'ACTIVE' AND device_id <> v_request.device_id;
    IF v_active_count >= v_license.max_devices THEN
        RAISE EXCEPTION 'LICENSE_DEVICE_LIMIT_REACHED' USING ERRCODE = '42501';
    END IF;

    IF EXISTS (SELECT 1 FROM public.devices WHERE device_id = v_request.device_id AND status = 'REVOKED') THEN
        RAISE EXCEPTION 'DEVICE_REVOKED_REQUIRES_REACTIVATION' USING ERRCODE = '42501';
    END IF;

    IF v_reuse_existing_device THEN
        UPDATE public.customer_sources
        SET status = 'DISABLED', updated_at = v_now
        WHERE license_id = v_license_id AND status = 'ACTIVE';
    END IF;

    INSERT INTO public.customer_sources (
        source_id, customer_id, license_id, source_type, display_name, status, version, created_at, updated_at
    ) VALUES (
        v_source_id, v_effective_customer_id, v_license_id, v_source_type, v_display_name, 'ACTIVE', 1, v_now, v_now
    );

    INSERT INTO private.customer_source_secret_vault (
        source_id, source_version, protocol, ciphertext, nonce, auth_tag, key_version, created_at
    ) VALUES (v_source_id, 1, v_source_type, p_ciphertext, p_nonce, p_auth_tag, p_key_version, v_now);

    INSERT INTO public.devices (
        device_id, display_code, device_type, device_label, status, device_token_hash, last_seen_at
    ) VALUES (
        v_request.device_id, v_request.display_code, v_request.device_type,
        COALESCE(v_request.device_label, 'DISPOSITIVO'), 'AUTHORIZED', v_request.device_token_hash, v_now
    ) ON CONFLICT (device_id) DO UPDATE SET
        display_code = EXCLUDED.display_code, device_type = EXCLUDED.device_type,
        device_label = EXCLUDED.device_label, status = 'AUTHORIZED',
        device_token_hash = EXCLUDED.device_token_hash, last_seen_at = v_now;

    INSERT INTO public.license_devices (license_id, device_id, status, bound_at)
    VALUES (v_license_id, v_request.device_id, 'ACTIVE', v_now)
    ON CONFLICT (license_id, device_id) DO UPDATE SET status = 'ACTIVE', bound_at = v_now, revoked_at = NULL;

    UPDATE public.device_activation_requests
    SET status = 'CONSUMED', claimed_at = v_now, claimed_by_customer_id = v_effective_customer_id,
        linked_license_id = v_license_id, linked_source_id = v_source_id
    WHERE activation_id = v_request.activation_id;

    UPDATE public.app_installations SET last_seen_at = v_now WHERE installation_id = v_request.installation_id;

    UPDATE public.device_activation_sessions
    SET status = 'COMPLETED', customer_id = v_effective_customer_id, license_id = v_license_id,
        source_id = v_source_id, completed_at = v_now
    WHERE session_id = v_session.session_id;

    INSERT INTO public.device_activation_events (
        activation_id, customer_id, license_id, device_id, display_code, source_id, action, result, metadata
    ) VALUES
    (
        v_request.activation_id, v_effective_customer_id, v_license_id, v_request.device_id,
        v_request.display_code, v_source_id, 'DEVICE_ACTIVATION_SOURCE_BOUND', 'SUCCESS',
        jsonb_build_object('sourceKind', 'SELF_SERVICE', 'activationPath', 'PUBLIC_CODE_KEY', 'sourceUpdate', v_reuse_existing_device)
    ),
    (
        v_request.activation_id, v_effective_customer_id, v_license_id, v_request.device_id,
        v_request.display_code, v_source_id, 'DEVICE_ACTIVATION_COMPLETED', 'SUCCESS',
        jsonb_build_object('sourceKind', 'SELF_SERVICE', 'activationPath', 'PUBLIC_CODE_KEY', 'trial', v_trial, 'sourceUpdate', v_reuse_existing_device)
    );

    RETURN jsonb_build_object(
        'success', true, 'status', 'CONSUMED', 'deviceAuthorizationState', 'AUTHORIZED',
        'deviceId', v_request.device_id, 'displayCode', v_request.display_code,
        'licenseId', v_license_id, 'sourceId', v_source_id, 'trial', v_trial,
        'reusedPermanentDeviceKey', v_reuse_existing_device
    );
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_public_complete_device_activation(TEXT, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_public_complete_device_activation(TEXT, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO service_role;


