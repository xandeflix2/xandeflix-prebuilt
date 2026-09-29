-- =============================================================================
-- Xandeflix Prebuilt â€” C11 public device-code activation
--
-- Forward-only correction for the first-installation flow:
-- DEVICE_DISPLAY_CODE + ONE_TIME_ACTIVATION_KEY -> scoped session -> source
-- setup -> atomic trial/device/source activation.
--
-- The browser never receives a customer credential and the database never
-- stores the raw activation key, session capability, playlist URL, or source
-- credentials. The final source envelope is produced by the server boundary.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.device_activation_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activation_id UUID NOT NULL REFERENCES public.device_activation_requests(activation_id) ON DELETE CASCADE,
    session_token_hash VARCHAR(64) NOT NULL UNIQUE CHECK (session_token_hash ~ '^[0-9a-fA-F]{64}$'),
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'COMPLETED', 'EXPIRED', 'CANCELLED')),
    expires_at TIMESTAMPTZ NOT NULL,
    customer_id UUID REFERENCES public.customer_profiles(id) ON DELETE SET NULL,
    license_id UUID REFERENCES public.licenses(id) ON DELETE SET NULL,
    source_id VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_device_activation_sessions_activation
    ON public.device_activation_sessions(activation_id, status);

ALTER TABLE public.device_activation_sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.device_activation_sessions FROM PUBLIC, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 1. Validates code + key and creates a short-lived, scoped capability.
-- -----------------------------------------------------------------------------

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
    v_session_id UUID;
    v_expires_at TIMESTAMPTZ;
    v_attempts INTEGER;
BEGIN
    IF v_display_code IS NULL OR v_display_code !~ '^XF-[0-9A-Z]{4}-[0-9A-Z]{4}$' THEN
        RETURN jsonb_build_object('success', false, 'code', 'DISPLAY_CODE_INVALID');
    END IF;
    IF v_key_hash IS NULL OR v_key_hash !~ '^[0-9a-f]{64}$' THEN
        RETURN jsonb_build_object('success', false, 'code', 'ACTIVATION_KEY_INVALID');
    END IF;
    IF v_session_hash IS NULL OR v_session_hash !~ '^[0-9a-f]{64}$' THEN
        RETURN jsonb_build_object('success', false, 'code', 'SESSION_CAPABILITY_INVALID');
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

    IF v_request.status = 'CONSUMED' THEN
        RETURN jsonb_build_object('success', false, 'code', 'ACTIVATION_ALREADY_CONSUMED');
    END IF;
    IF v_request.status <> 'PENDING' THEN
        RETURN jsonb_build_object('success', false, 'code', 'ACTIVATION_NOT_PENDING');
    END IF;

    IF v_request.attempts_count >= 5 THEN
        UPDATE public.device_activation_requests
        SET status = 'CANCELLED'
        WHERE activation_id = v_request.activation_id;
        RETURN jsonb_build_object('success', false, 'code', 'ACTIVATION_ATTEMPT_LIMIT_EXCEEDED');
    END IF;

    IF NOW() >= v_request.created_at + INTERVAL '15 minutes' THEN
        UPDATE public.device_activation_requests
        SET status = 'CANCELLED'
        WHERE activation_id = v_request.activation_id;
        RETURN jsonb_build_object('success', false, 'code', 'ACTIVATION_EXPIRED');
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
            v_request.activation_id,
            v_request.device_id,
            v_request.display_code,
            'DEVICE_ACTIVATION_REJECTED',
            'REJECTED',
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
    WHERE activation_id = v_request.activation_id
      AND status = 'OPEN';

    v_expires_at := NOW() + INTERVAL '10 minutes';
    INSERT INTO public.device_activation_sessions (
        activation_id, session_token_hash, expires_at
    ) VALUES (
        v_request.activation_id, v_session_hash, v_expires_at
    )
    RETURNING session_id INTO v_session_id;

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

-- -----------------------------------------------------------------------------
-- 2. Atomic completion invoked only by the server activation boundary.
-- -----------------------------------------------------------------------------

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
    v_license_id UUID;
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
BEGIN
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
    IF p_ciphertext IS NULL OR p_ciphertext !~ '^[0-9a-fA-F]+$' OR length(p_ciphertext) = 0 OR length(p_ciphertext) % 2 <> 0 THEN
        RAISE EXCEPTION 'SOURCE_ENVELOPE_INVALID' USING ERRCODE = '22023';
    END IF;
    IF p_nonce IS NULL OR p_nonce !~ '^[0-9a-fA-F]{24}$' OR p_auth_tag IS NULL OR p_auth_tag !~ '^[0-9a-fA-F]{32}$' THEN
        RAISE EXCEPTION 'SOURCE_ENVELOPE_INVALID' USING ERRCODE = '22023';
    END IF;
    IF p_key_version IS NULL OR p_key_version !~ '^[A-Za-z0-9_.-]{1,32}$' THEN
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
            'success', true,
            'status', 'CONSUMED',
            'deviceAuthorizationState', 'AUTHORIZED',
            'licenseId', v_session.license_id,
            'sourceId', v_session.source_id
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

    SELECT * INTO v_profile
    FROM public.customer_profiles
    WHERE id = p_customer_id
    FOR UPDATE;

    IF NOT FOUND THEN
        INSERT INTO public.customer_profiles (id, nickname, status, created_at, updated_at)
        VALUES (p_customer_id, private.validate_customer_nickname(v_nickname), 'ACTIVE', v_now, v_now)
        RETURNING * INTO v_profile;
    ELSIF v_profile.status <> 'ACTIVE' THEN
        RAISE EXCEPTION 'CUSTOMER_PROFILE_NOT_ACTIVE' USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_license
    FROM public.licenses
    WHERE customer_id = p_customer_id AND status IN ('ACTIVE', 'TRIAL')
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
            id, license_key_hash, mode, status, trial_eligible,
            trial_started_at, trial_expires_at, max_devices,
            max_concurrent_sessions, customer_id, created_at
        ) VALUES (
            v_license_id,
            encode(sha256(('PUBLIC_TRIAL_' || p_customer_id::text || '_' || v_license_id::text || '_' || extract(epoch FROM v_now)::text)::bytea), 'hex'),
            'SELF_SERVICE', 'TRIAL', true,
            v_now, v_trial_expires_at, 1, 1, p_customer_id, v_now
        )
        RETURNING * INTO v_license;

        PERFORM set_config('private.system_trial_mutation', 'true', true);
        UPDATE public.customer_profiles
        SET trial_used_at = v_now, updated_at = v_now
        WHERE id = p_customer_id;
        PERFORM set_config('private.system_trial_mutation', 'false', true);

        v_trial := jsonb_build_object(
            'trialStarted', true,
            'status', 'TRIAL',
            'trialStartedAt', v_now,
            'trialExpiresAt', v_trial_expires_at,
            'maxDevices', 1,
            'maxConcurrentSessions', 1
        );
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

    INSERT INTO public.customer_sources (
        source_id, customer_id, license_id, source_type, display_name, status, version, created_at, updated_at
    ) VALUES (
        v_source_id, p_customer_id, v_license_id, v_source_type, v_display_name, 'ACTIVE', 1, v_now, v_now
    );

    INSERT INTO private.customer_source_secret_vault (
        source_id, source_version, protocol, ciphertext, nonce, auth_tag, key_version, created_at
    ) VALUES (
        v_source_id, 1, v_source_type, p_ciphertext, p_nonce, p_auth_tag, p_key_version, v_now
    );

    INSERT INTO public.devices (
        device_id, display_code, device_type, device_label, status, device_token_hash, last_seen_at
    ) VALUES (
        v_request.device_id, v_request.display_code, v_request.device_type,
        COALESCE(v_request.device_label, 'DISPOSITIVO'), 'AUTHORIZED', v_request.device_token_hash, v_now
    )
    ON CONFLICT (device_id) DO UPDATE SET
        display_code = EXCLUDED.display_code,
        device_type = EXCLUDED.device_type,
        device_label = EXCLUDED.device_label,
        status = 'AUTHORIZED',
        device_token_hash = EXCLUDED.device_token_hash,
        last_seen_at = v_now;

    INSERT INTO public.license_devices (license_id, device_id, status, bound_at)
    VALUES (v_license_id, v_request.device_id, 'ACTIVE', v_now)
    ON CONFLICT (license_id, device_id) DO UPDATE SET status = 'ACTIVE', bound_at = v_now, revoked_at = NULL;

    UPDATE public.device_activation_requests
    SET status = 'CONSUMED', claimed_at = v_now, claimed_by_customer_id = p_customer_id,
        linked_license_id = v_license_id, linked_source_id = v_source_id
    WHERE activation_id = v_request.activation_id;

    UPDATE public.app_installations SET last_seen_at = v_now WHERE installation_id = v_request.installation_id;

    UPDATE public.device_activation_sessions
    SET status = 'COMPLETED', customer_id = p_customer_id, license_id = v_license_id,
        source_id = v_source_id, completed_at = v_now
    WHERE session_id = v_session.session_id;

    INSERT INTO public.device_activation_events (
        activation_id, customer_id, license_id, device_id, display_code, source_id, action, result, metadata
    ) VALUES
    (
        v_request.activation_id, p_customer_id, v_license_id, v_request.device_id,
        v_request.display_code, v_source_id, 'DEVICE_ACTIVATION_SOURCE_BOUND', 'SUCCESS',
        jsonb_build_object('sourceKind', 'SELF_SERVICE', 'activationPath', 'PUBLIC_CODE_KEY')
    ),
    (
        v_request.activation_id, p_customer_id, v_license_id, v_request.device_id,
        v_request.display_code, v_source_id, 'DEVICE_ACTIVATION_COMPLETED', 'SUCCESS',
        jsonb_build_object('sourceKind', 'SELF_SERVICE', 'activationPath', 'PUBLIC_CODE_KEY', 'trial', v_trial)
    );

    RETURN jsonb_build_object(
        'success', true,
        'status', 'CONSUMED',
        'deviceAuthorizationState', 'AUTHORIZED',
        'deviceId', v_request.device_id,
        'displayCode', v_request.display_code,
        'licenseId', v_license_id,
        'sourceId', v_source_id,
        'trial', v_trial
    );
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_public_complete_device_activation(TEXT, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_public_complete_device_activation(TEXT, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO service_role;

-- -----------------------------------------------------------------------------
-- 3. Extend metadata resolution to the canonical self-service source vault.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.rpc_resolve_authorized_source_metadata(
    p_device_id VARCHAR(64),
    p_device_token_hash VARCHAR(64)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
DECLARE
    v_device RECORD;
    v_license RECORD;
    v_binding RECORD;
    v_source RECORD;
    v_caller_uid UUID;
BEGIN
    SELECT device_token_hash, status INTO v_device
    FROM public.devices WHERE device_id = p_device_id;
    IF NOT FOUND OR v_device.device_token_hash IS DISTINCT FROM p_device_token_hash THEN
        RETURN jsonb_build_object('status', 'DEVICE_NOT_AUTHORIZED');
    END IF;
    IF v_device.status = 'REVOKED' THEN RETURN jsonb_build_object('status', 'DEVICE_REVOKED'); END IF;
    IF v_device.status <> 'AUTHORIZED' THEN RETURN jsonb_build_object('status', 'DEVICE_NOT_AUTHORIZED'); END IF;

    SELECT l.id, l.mode, l.status, l.customer_id, l.expires_at, l.trial_started_at, l.trial_expires_at,
           ld.status AS ld_status
    INTO v_license
    FROM public.license_devices ld
    JOIN public.licenses l ON l.id = ld.license_id
    WHERE ld.device_id = p_device_id
    ORDER BY ld.bound_at DESC
    LIMIT 1;
    IF NOT FOUND OR v_license.ld_status <> 'ACTIVE' THEN RETURN jsonb_build_object('status', 'LICENSE_INVALID'); END IF;

    v_caller_uid := auth.uid();
    IF v_caller_uid IS NOT NULL AND v_license.customer_id IS NOT NULL AND v_caller_uid <> v_license.customer_id THEN
        RETURN jsonb_build_object('status', 'DEVICE_NOT_AUTHORIZED');
    END IF;

    IF v_license.status = 'ACTIVE' THEN
        IF v_license.expires_at IS NOT NULL AND v_license.expires_at <= NOW() THEN RETURN jsonb_build_object('status', 'LICENSE_INVALID'); END IF;
    ELSIF v_license.status = 'TRIAL' THEN
        IF v_license.trial_started_at IS NULL OR v_license.trial_expires_at IS NULL OR NOW() >= v_license.trial_expires_at THEN
            RETURN jsonb_build_object('status', 'LICENSE_INVALID');
        END IF;
    ELSE
        RETURN jsonb_build_object('status', 'LICENSE_INVALID');
    END IF;

    IF v_license.mode = 'SELF_SERVICE' THEN
        SELECT source_id, source_type, version, status
        INTO v_source
        FROM public.customer_sources
        WHERE license_id = v_license.id AND status = 'ACTIVE'
        ORDER BY version DESC
        LIMIT 1;
        IF NOT FOUND THEN RETURN jsonb_build_object('status', 'SOURCE_NOT_BOUND', 'mode', 'SELF_SERVICE'); END IF;
        RETURN jsonb_build_object(
            'status', 'SOURCE_READY', 'mode', 'SELF_SERVICE', 'sourceId', v_source.source_id,
            'sourceVersion', v_source.version, 'protocol', v_source.source_type, 'sourceStatus', v_source.status
        );
    END IF;

    SELECT dsb.source_id INTO v_binding
    FROM public.device_source_bindings dsb
    WHERE dsb.device_id = p_device_id AND dsb.license_id = v_license.id
    LIMIT 1;
    IF NOT FOUND THEN RETURN jsonb_build_object('status', 'SOURCE_NOT_BOUND', 'mode', v_license.mode); END IF;

    SELECT source_id, source_type, version, status INTO v_source
    FROM public.managed_sources WHERE id = v_binding.source_id;
    IF NOT FOUND THEN
        SELECT source_id, source_type, version, status INTO v_source
        FROM public.managed_sources WHERE source_id = v_binding.source_id::text;
    END IF;
    IF NOT FOUND THEN RETURN jsonb_build_object('status', 'SOURCE_NOT_BOUND', 'mode', v_license.mode); END IF;
    IF v_source.status <> 'ACTIVE' THEN
        RETURN jsonb_build_object('status', 'SOURCE_NOT_BOUND', 'mode', v_license.mode,
            'sourceId', v_source.source_id, 'sourceVersion', v_source.version,
            'protocol', v_source.source_type, 'sourceStatus', v_source.status);
    END IF;
    RETURN jsonb_build_object(
        'status', 'SOURCE_READY', 'mode', v_license.mode, 'sourceId', v_source.source_id,
        'sourceVersion', v_source.version, 'protocol', v_source.source_type, 'sourceStatus', v_source.status
    );
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_resolve_authorized_source_metadata(VARCHAR, VARCHAR) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_resolve_authorized_source_metadata(VARCHAR, VARCHAR) TO anon, authenticated;


