-- C11 physical E2E: renew an expired public activation request without
-- exposing or changing the permanent device key.

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
    v_request_key_hash VARCHAR(64);
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
    WHERE device_id = v_request.device_id
      AND display_code = v_display_code
    ORDER BY created_at DESC
    LIMIT 1;

    IF FOUND AND v_key.key_status <> 'ACTIVE' THEN
        RETURN jsonb_build_object('success', false, 'code', 'PERMANENT_KEY_REVOKED');
    END IF;

    v_request_key_hash := COALESCE(v_key.activation_key_hash, v_request.activation_key_hash);

    IF v_request.status = 'PENDING'
       AND NOW() >= v_request.created_at + INTERVAL '15 minutes' THEN
        UPDATE public.device_activation_requests
        SET status = 'CANCELLED'
        WHERE activation_id = v_request.activation_id;
        v_request.status := 'CANCELLED';
    END IF;

    IF v_request.status = 'CANCELLED' AND v_request.attempts_count >= 5 THEN
        RETURN jsonb_build_object('success', false, 'code', 'ACTIVATION_ATTEMPT_LIMIT_EXCEEDED');
    END IF;

    IF v_request.status <> 'PENDING' THEN
        IF v_request_key_hash IS NULL OR v_request_key_hash <> v_key_hash THEN
            RETURN jsonb_build_object('success', false, 'code', 'ACTIVATION_NOT_PENDING');
        END IF;

        INSERT INTO public.device_activation_requests (
            installation_id,
            device_id,
            display_code,
            device_token_hash,
            activation_key_hash,
            activation_status_secret_hash,
            status,
            attempts_count,
            device_type,
            device_label,
            created_at
        ) VALUES (
            v_request.installation_id,
            v_request.device_id,
            v_request.display_code,
            v_request.device_token_hash,
            v_request_key_hash,
            encode(gen_random_bytes(32), 'hex'),
            'PENDING',
            0,
            v_request.device_type,
            v_request.device_label,
            NOW()
        )
        RETURNING * INTO v_request;
    END IF;

    IF v_request.attempts_count >= 5 THEN
        UPDATE public.device_activation_requests
        SET status = 'CANCELLED'
        WHERE activation_id = v_request.activation_id;
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
            v_request.activation_id,
            v_request.device_id,
            v_request.display_code,
            'DEVICE_ACTIVATION_REJECTED',
            'REJECTED',
            jsonb_build_object(
                'code', CASE WHEN v_attempts >= 5 THEN 'ACTIVATION_ATTEMPT_LIMIT_EXCEEDED' ELSE 'INVALID_ACTIVATION_KEY' END,
                'attemptsCount', v_attempts,
                'activationPath', 'PUBLIC_CODE_KEY'
            )
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

    UPDATE private.device_activation_key_vault
    SET last_used_at = NOW()
    WHERE device_id = v_request.device_id
      AND key_status = 'ACTIVE';

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
