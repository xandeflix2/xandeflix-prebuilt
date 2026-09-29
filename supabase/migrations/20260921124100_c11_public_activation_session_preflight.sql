-- C11 forward-only hardening: reject invalid activation capabilities before
-- encrypting source input or bootstrapping an internal customer identity.

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
    v_display_code VARCHAR(32) := upper(NULLIF(trim(p_display_code), ''));
    v_session_hash VARCHAR(64) := lower(NULLIF(trim(p_session_token_hash), ''));
BEGIN
    IF v_session_hash IS NULL OR v_session_hash !~ '^[0-9a-f]{64}$'
       OR v_display_code IS NULL OR v_display_code !~ '^XF-[0-9A-Z]{4}-[0-9A-Z]{4}$' THEN
        RETURN jsonb_build_object('success', false, 'code', 'ACTIVATION_SESSION_NOT_FOUND');
    END IF;

    SELECT s.status, s.expires_at, r.status AS request_status, r.display_code
    INTO v_session
    FROM public.device_activation_sessions s
    JOIN public.device_activation_requests r ON r.activation_id = s.activation_id
    WHERE s.session_token_hash = v_session_hash
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'code', 'ACTIVATION_SESSION_NOT_FOUND');
    END IF;
    IF v_session.display_code <> v_display_code OR v_session.request_status <> 'PENDING' THEN
        RETURN jsonb_build_object('success', false, 'code', 'ACTIVATION_NOT_PENDING');
    END IF;
    IF v_session.status <> 'OPEN' THEN
        RETURN jsonb_build_object('success', false, 'code', 'ACTIVATION_SESSION_NOT_OPEN');
    END IF;
    IF NOW() >= v_session.expires_at THEN
        RETURN jsonb_build_object('success', false, 'code', 'ACTIVATION_SESSION_EXPIRED');
    END IF;

    RETURN jsonb_build_object('success', true, 'sourceSetupAllowed', true, 'expiresAt', v_session.expires_at);
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_public_check_device_activation_session(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_public_check_device_activation_session(TEXT, TEXT) TO service_role;


