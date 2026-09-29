-- =============================================================================
-- Xandeflix Prebuilt — A1 Remote Device Activation
--
-- Implementa a ativação externa por displayCode + deviceActivationKey.
-- A chave bruta nunca é persistida: somente SHA-256 é armazenado.
-- A fonte é referenciada por sourceId opaco; URLs e credenciais não entram aqui.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.device_activation_requests (
    activation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    installation_id UUID NOT NULL REFERENCES public.app_installations(installation_id) ON DELETE CASCADE,
    device_id VARCHAR(64) NOT NULL,
    display_code VARCHAR(32) NOT NULL,
    device_token_hash VARCHAR(64) NOT NULL CHECK (device_token_hash ~ '^[0-9a-fA-F]{64}$'),
    activation_key_hash VARCHAR(64) NOT NULL CHECK (activation_key_hash ~ '^[0-9a-fA-F]{64}$'),
    activation_status_secret_hash VARCHAR(64) NOT NULL CHECK (activation_status_secret_hash ~ '^[0-9a-fA-F]{64}$'),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONSUMED', 'CANCELLED')),
    attempts_count INTEGER NOT NULL DEFAULT 0 CHECK (attempts_count >= 0),
    device_type VARCHAR(20) NOT NULL DEFAULT 'TV' CHECK (device_type IN ('TV', 'PHONE', 'TABLET', 'PC', 'OTHER')),
    device_label VARCHAR(100),
    linked_license_id UUID REFERENCES public.licenses(id) ON DELETE SET NULL,
    linked_source_id VARCHAR(64),
    claimed_by_customer_id UUID REFERENCES public.customer_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    claimed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_device_activation_requests_display
    ON public.device_activation_requests(display_code, status);

CREATE INDEX IF NOT EXISTS idx_device_activation_requests_device
    ON public.device_activation_requests(device_id, status);

ALTER TABLE public.device_activation_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.device_activation_requests FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS public.device_activation_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activation_id UUID REFERENCES public.device_activation_requests(activation_id) ON DELETE SET NULL,
    customer_id UUID REFERENCES public.customer_profiles(id) ON DELETE SET NULL,
    license_id UUID REFERENCES public.licenses(id) ON DELETE SET NULL,
    device_id VARCHAR(64) NOT NULL,
    display_code VARCHAR(32) NOT NULL,
    source_id VARCHAR(64),
    action VARCHAR(40) NOT NULL CHECK (action IN ('DEVICE_ACTIVATION_COMPLETED', 'DEVICE_ACTIVATION_REJECTED', 'DEVICE_ACTIVATION_SOURCE_BOUND')),
    result VARCHAR(20) NOT NULL CHECK (result IN ('SUCCESS', 'REJECTED')),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.device_activation_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.device_activation_events FROM PUBLIC, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 1. Solicitação criada pelo aplicativo
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.rpc_request_device_activation(
    p_installation_id UUID,
    p_device_id TEXT,
    p_display_code TEXT,
    p_device_token_hash TEXT,
    p_activation_key_hash TEXT,
    p_device_type TEXT DEFAULT 'TV',
    p_device_label TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, extensions, private
AS $$
DECLARE
    v_device_id VARCHAR(64) := NULLIF(trim(p_device_id), '');
    v_display_code VARCHAR(32) := upper(NULLIF(trim(p_display_code), ''));
    v_token_hash VARCHAR(64) := lower(NULLIF(trim(p_device_token_hash), ''));
    v_activation_hash VARCHAR(64) := lower(NULLIF(trim(p_activation_key_hash), ''));
    v_type VARCHAR(20) := upper(COALESCE(NULLIF(trim(p_device_type), ''), 'TV'));
    v_label VARCHAR(100) := NULLIF(trim(p_device_label), '');
    v_secret TEXT;
    v_activation_id UUID;
BEGIN
    IF p_installation_id IS NULL THEN
        RAISE EXCEPTION 'INSTALLATION_ID_REQUIRED' USING ERRCODE = '22023';
    END IF;
    IF v_device_id IS NULL THEN
        RAISE EXCEPTION 'DEVICE_ID_REQUIRED' USING ERRCODE = '22023';
    END IF;
    IF v_display_code IS NULL THEN
        RAISE EXCEPTION 'DISPLAY_CODE_REQUIRED' USING ERRCODE = '22023';
    END IF;
    IF v_token_hash IS NULL OR v_token_hash !~ '^[0-9a-f]{64}$' THEN
        RAISE EXCEPTION 'DEVICE_TOKEN_HASH_REQUIRED' USING ERRCODE = '22023';
    END IF;
    IF v_activation_hash IS NULL OR v_activation_hash !~ '^[0-9a-f]{64}$' THEN
        RAISE EXCEPTION 'ACTIVATION_KEY_HASH_REQUIRED' USING ERRCODE = '22023';
    END IF;
    IF v_type NOT IN ('TV', 'PHONE', 'TABLET', 'PC', 'OTHER') THEN
        v_type := 'TV';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.app_installations WHERE installation_id = p_installation_id) THEN
        RAISE EXCEPTION 'INSTALLATION_NOT_FOUND' USING ERRCODE = '22023';
    END IF;

    IF EXISTS (SELECT 1 FROM public.devices WHERE device_id = v_device_id AND status = 'REVOKED') THEN
        RAISE EXCEPTION 'DEVICE_REVOKED_REQUIRES_REACTIVATION' USING ERRCODE = '42501';
    END IF;
    IF EXISTS (SELECT 1 FROM public.devices WHERE device_id = v_device_id AND status = 'AUTHORIZED') THEN
        RAISE EXCEPTION 'DEVICE_ALREADY_AUTHORIZED' USING ERRCODE = '42501';
    END IF;

    UPDATE public.device_activation_requests
    SET status = 'CANCELLED'
    WHERE (device_id = v_device_id OR display_code = v_display_code)
      AND status = 'PENDING';

    v_secret := encode(extensions.gen_random_bytes(24), 'hex');

    INSERT INTO public.device_activation_requests (
        installation_id,
        device_id,
        display_code,
        device_token_hash,
        activation_key_hash,
        activation_status_secret_hash,
        device_type,
        device_label
    ) VALUES (
        p_installation_id,
        v_device_id,
        v_display_code,
        v_token_hash,
        v_activation_hash,
        encode(sha256(v_secret::bytea), 'hex'),
        v_type,
        v_label
    ) RETURNING activation_id INTO v_activation_id;

    RETURN jsonb_build_object(
        'success', true,
        'activationId', v_activation_id,
        'activationStatusSecret', v_secret,
        'displayCode', v_display_code,
        'status', 'PENDING'
    );
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_request_device_activation(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_request_device_activation(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- 2. Status consultado pelo aplicativo
-- -----------------------------------------------------------------------------

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
BEGIN
    IF p_activation_id IS NULL OR NULLIF(trim(p_device_id), '') IS NULL OR NULLIF(trim(p_activation_status_secret), '') IS NULL THEN
        RAISE EXCEPTION 'ACTIVATION_STATUS_PARAMS_REQUIRED' USING ERRCODE = '22023';
    END IF;

    SELECT * INTO v_request
    FROM public.device_activation_requests
    WHERE activation_id = p_activation_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'code', 'ACTIVATION_NOT_FOUND');
    END IF;

    IF v_request.device_id <> trim(p_device_id)
       OR v_request.activation_status_secret_hash <> encode(sha256(trim(p_activation_status_secret)::bytea), 'hex') THEN
        RAISE EXCEPTION 'ACTIVATION_STATUS_CAPABILITY_INVALID' USING ERRCODE = '42501';
    END IF;

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
GRANT EXECUTE ON FUNCTION public.rpc_check_device_activation_status(UUID, TEXT, TEXT) TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- 3. Claim pelo cliente autenticado: dispositivo + chave + fonte
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.rpc_customer_activate_device(
    p_display_code TEXT,
    p_activation_key TEXT,
    p_source_id TEXT,
    p_device_label TEXT DEFAULT NULL,
    p_license_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, extensions, private
AS $$
DECLARE
    v_customer_id UUID := auth.uid();
    v_display_code VARCHAR(32) := upper(NULLIF(trim(p_display_code), ''));
    v_activation_key TEXT := NULLIF(trim(p_activation_key), '');
    v_source_id VARCHAR(64) := NULLIF(trim(p_source_id), '');
    v_label VARCHAR(100) := NULLIF(trim(p_device_label), '');
    v_license RECORD;
    v_request RECORD;
    v_managed_source RECORD;
    v_customer_source RECORD;
    v_trial JSONB;
    v_active_count INTEGER;
    v_source_internal_id UUID;
    v_source_kind TEXT;
BEGIN
    IF v_customer_id IS NULL THEN
        RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = '42501';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.customer_profiles WHERE id = v_customer_id AND status = 'ACTIVE') THEN
        RAISE EXCEPTION 'CUSTOMER_PROFILE_NOT_ACTIVE' USING ERRCODE = '42501';
    END IF;
    IF v_display_code IS NULL THEN
        RAISE EXCEPTION 'DISPLAY_CODE_REQUIRED' USING ERRCODE = '22023';
    END IF;
    IF v_activation_key IS NULL OR length(v_activation_key) < 32 THEN
        RAISE EXCEPTION 'ACTIVATION_KEY_REQUIRED' USING ERRCODE = '22023';
    END IF;
    IF v_source_id IS NULL THEN
        RAISE EXCEPTION 'SOURCE_ID_REQUIRED' USING ERRCODE = '22023';
    END IF;

    SELECT * INTO v_request
    FROM public.device_activation_requests
    WHERE display_code = v_display_code
      AND status IN ('PENDING', 'CONSUMED')
    ORDER BY created_at DESC
    LIMIT 1
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'ACTIVATION_NOT_FOUND' USING ERRCODE = 'P0002';
    END IF;

    IF v_request.activation_key_hash <> encode(sha256(v_activation_key::bytea), 'hex') THEN
        IF v_request.status = 'PENDING' THEN
            UPDATE public.device_activation_requests
            SET attempts_count = attempts_count + 1,
                status = CASE WHEN attempts_count + 1 >= 5 THEN 'CANCELLED' ELSE status END
            WHERE activation_id = v_request.activation_id;
        END IF;
        INSERT INTO public.device_activation_events (activation_id, customer_id, device_id, display_code, action, result, metadata)
        VALUES (v_request.activation_id, v_customer_id, v_request.device_id, v_display_code, 'DEVICE_ACTIVATION_REJECTED', 'REJECTED', jsonb_build_object('code', 'INVALID_ACTIVATION_KEY'));
        RETURN jsonb_build_object('success', false, 'code', 'INVALID_ACTIVATION_KEY');
    END IF;

    IF v_request.status = 'CONSUMED' THEN
        IF v_request.claimed_by_customer_id = v_customer_id THEN
            RETURN jsonb_build_object('success', true, 'status', 'CONSUMED', 'deviceAuthorizationState', 'AUTHORIZED', 'deviceId', v_request.device_id, 'displayCode', v_request.display_code, 'licenseId', v_request.linked_license_id, 'sourceId', v_request.linked_source_id);
        END IF;
        RAISE EXCEPTION 'ACTIVATION_ALREADY_CONSUMED' USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_license
    FROM public.licenses
    WHERE id = COALESCE(p_license_id, (
        SELECT id FROM public.licenses
        WHERE customer_id = v_customer_id AND status IN ('ACTIVE', 'TRIAL')
        ORDER BY created_at DESC LIMIT 1
    ))
      AND customer_id = v_customer_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'NO_ELIGIBLE_LICENSE' USING ERRCODE = '42501';
    END IF;
    IF v_license.status NOT IN ('ACTIVE', 'TRIAL') THEN
        RAISE EXCEPTION 'LICENSE_NOT_ACTIVE' USING ERRCODE = '42501';
    END IF;
    IF v_license.expires_at IS NOT NULL AND v_license.expires_at <= NOW() THEN
        RAISE EXCEPTION 'LICENSE_EXPIRED' USING ERRCODE = '42501';
    END IF;

    SELECT id, source_id, name, source_type, version, status
    INTO v_managed_source
    FROM public.managed_sources
    WHERE source_id = v_source_id AND status = 'ACTIVE';

    IF FOUND THEN
        IF v_license.mode <> 'MANAGED' THEN
            RAISE EXCEPTION 'SOURCE_MODE_MISMATCH' USING ERRCODE = '42501';
        END IF;
        v_source_internal_id := v_managed_source.id;
        v_source_kind := 'MANAGED';
    ELSE
        SELECT source_id, license_id, customer_id, version, source_type, status
        INTO v_customer_source
        FROM public.customer_sources
        WHERE source_id = v_source_id
          AND license_id = v_license.id
          AND customer_id = v_customer_id
          AND status = 'ACTIVE';
        IF NOT FOUND THEN
            RAISE EXCEPTION 'SOURCE_NOT_ACTIVE_OR_NOT_OWNED' USING ERRCODE = '42501';
        END IF;
        IF v_license.mode <> 'SELF_SERVICE' THEN
            RAISE EXCEPTION 'SOURCE_MODE_MISMATCH' USING ERRCODE = '42501';
        END IF;
        v_source_kind := 'SELF_SERVICE';
    END IF;

    v_trial := private.start_trial_if_eligible(v_license.id, v_customer_id);

    SELECT count(*) INTO v_active_count
    FROM public.license_devices
    WHERE license_id = v_license.id
      AND status = 'ACTIVE'
      AND device_id <> v_request.device_id;

    IF v_active_count >= v_license.max_devices THEN
        RAISE EXCEPTION 'LICENSE_DEVICE_LIMIT_REACHED' USING ERRCODE = '42501';
    END IF;

    IF EXISTS (SELECT 1 FROM public.devices WHERE device_id = v_request.device_id AND status = 'REVOKED') THEN
        RAISE EXCEPTION 'DEVICE_REVOKED_REQUIRES_REACTIVATION' USING ERRCODE = '42501';
    END IF;

    INSERT INTO public.devices (device_id, display_code, device_type, device_label, status, device_token_hash, last_seen_at)
    VALUES (v_request.device_id, v_request.display_code, v_request.device_type, COALESCE(v_label, v_request.device_label, 'DISPOSITIVO'), 'AUTHORIZED', v_request.device_token_hash, NOW())
    ON CONFLICT (device_id) DO UPDATE
    SET display_code = EXCLUDED.display_code,
        device_label = EXCLUDED.device_label,
        status = 'AUTHORIZED',
        device_token_hash = EXCLUDED.device_token_hash,
        last_seen_at = NOW();

    INSERT INTO public.license_devices (license_id, device_id, status, bound_at)
    VALUES (v_license.id, v_request.device_id, 'ACTIVE', NOW())
    ON CONFLICT (license_id, device_id) DO UPDATE
    SET status = 'ACTIVE', bound_at = NOW(), revoked_at = NULL;

    IF v_source_kind = 'MANAGED' THEN
        INSERT INTO public.device_source_bindings (license_id, device_id, source_id)
        VALUES (v_license.id, v_request.device_id, v_source_internal_id)
        ON CONFLICT (device_id) DO UPDATE
        SET license_id = EXCLUDED.license_id, source_id = EXCLUDED.source_id;
    END IF;

    UPDATE public.device_activation_requests
    SET status = 'CONSUMED',
        claimed_at = NOW(),
        claimed_by_customer_id = v_customer_id,
        linked_license_id = v_license.id,
        linked_source_id = v_source_id,
        device_label = COALESCE(v_label, device_label)
    WHERE activation_id = v_request.activation_id;

    UPDATE public.app_installations
    SET last_seen_at = NOW()
    WHERE installation_id = v_request.installation_id;

    INSERT INTO public.device_activation_events (activation_id, customer_id, license_id, device_id, display_code, source_id, action, result, metadata)
    VALUES (v_request.activation_id, v_customer_id, v_license.id, v_request.device_id, v_request.display_code, v_source_id, 'DEVICE_ACTIVATION_COMPLETED', 'SUCCESS', jsonb_build_object('sourceKind', v_source_kind, 'trial', v_trial));

    RETURN jsonb_build_object(
        'success', true,
        'status', 'CONSUMED',
        'deviceAuthorizationState', 'AUTHORIZED',
        'deviceId', v_request.device_id,
        'displayCode', v_request.display_code,
        'licenseId', v_license.id,
        'sourceId', v_source_id,
        'trial', v_trial
    );
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_customer_activate_device(TEXT, TEXT, TEXT, TEXT, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_customer_activate_device(TEXT, TEXT, TEXT, TEXT, UUID) TO authenticated;

-- -----------------------------------------------------------------------------
-- 4. Consulta sanitizada pelo painel do gestor
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.rpc_manager_list_device_activation_events(p_limit INTEGER DEFAULT 50)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
DECLARE
    v_limit INTEGER := GREATEST(1, LEAST(COALESCE(p_limit, 50), 200));
    v_result JSONB;
BEGIN
    PERFORM private.require_active_manager();

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', e.id,
        'activationId', e.activation_id,
        'customerId', e.customer_id,
        'licenseId', e.license_id,
        'deviceId', e.device_id,
        'displayCode', e.display_code,
        'sourceId', e.source_id,
        'action', e.action,
        'result', e.result,
        'metadata', e.metadata,
        'createdAt', e.created_at
    ) ORDER BY e.created_at DESC), '[]'::jsonb)
    INTO v_result
    FROM (
        SELECT * FROM public.device_activation_events
        ORDER BY created_at DESC
        LIMIT v_limit
    ) e;

    RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_manager_list_device_activation_events(INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_manager_list_device_activation_events(INTEGER) TO authenticated;
