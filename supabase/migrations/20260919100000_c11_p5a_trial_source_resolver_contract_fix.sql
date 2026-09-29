-- ==============================================================================
-- Migration: 20260919100000_c11_p5a_trial_source_resolver_contract_fix.sql
-- Cycle: XANDEFLIX_PREBUILT_C11_P5A_TRIAL_SOURCE_RESOLVER_CONTRACT_FIX
-- Objective: Permitir elegibilidade de licenças TRIAL válidas e vigentes na
--            resolução de metadados da source via rpc_resolve_authorized_source_metadata.
-- Principles:
--   - FORWARD ONLY: Atualização in-place da função sem alterar migrations anteriores.
--   - TRIAL RIGID CHECK: Exige status='TRIAL', trial_started_at, trial_expires_at,
--     NOW() < trial_expires_at, device autorizado e binding consistente.
--   - ZERO SECRET EXPOSURE: Apenas metadados públicos da source (id, versão, protocolo).
-- ==============================================================================

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
    -- 1. Validar autenticacao e autorizacao do dispositivo (FAIL CLOSED)
    SELECT device_token_hash, status
    INTO v_device
    FROM public.devices
    WHERE device_id = p_device_id;

    IF NOT FOUND OR v_device.device_token_hash IS DISTINCT FROM p_device_token_hash THEN
        RETURN jsonb_build_object('status', 'DEVICE_NOT_AUTHORIZED');
    END IF;

    IF v_device.status = 'REVOKED' THEN
        RETURN jsonb_build_object('status', 'DEVICE_REVOKED');
    END IF;

    IF v_device.status <> 'AUTHORIZED' THEN
        RETURN jsonb_build_object('status', 'DEVICE_NOT_AUTHORIZED');
    END IF;

    -- 2. Resolver a vinculacao do dispositivo com a licenca
    SELECT 
        l.id,
        l.mode,
        l.status,
        l.customer_id,
        l.expires_at,
        l.trial_started_at,
        l.trial_expires_at,
        ld.status AS ld_status
    INTO v_license
    FROM public.license_devices ld
    JOIN public.licenses l ON l.id = ld.license_id
    WHERE ld.device_id = p_device_id
    ORDER BY ld.bound_at DESC
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('status', 'LICENSE_INVALID');
    END IF;

    -- 2.1. Validar status da ligacao device-licenca
    IF v_license.ld_status <> 'ACTIVE' THEN
        RETURN jsonb_build_object('status', 'LICENSE_INVALID');
    END IF;

    -- 2.2. Protecao contra Cross-Customer se chamado sob contexto de sessao autenticada
    v_caller_uid := auth.uid();
    IF v_caller_uid IS NOT NULL AND v_license.customer_id IS NOT NULL AND v_caller_uid <> v_license.customer_id THEN
        RETURN jsonb_build_object('status', 'DEVICE_NOT_AUTHORIZED');
    END IF;

    -- 2.3. Validar vigencia e status da licenca
    IF v_license.status = 'ACTIVE' THEN
        IF v_license.expires_at IS NOT NULL AND v_license.expires_at < NOW() THEN
            RETURN jsonb_build_object('status', 'LICENSE_INVALID');
        END IF;
    ELSIF v_license.status = 'TRIAL' THEN
        -- Requisitos estritos para TRIAL:
        -- - trial_started_at IS NOT NULL
        -- - trial_expires_at IS NOT NULL
        -- - NOW() < trial_expires_at (ainda vigente)
        IF v_license.trial_started_at IS NULL 
           OR v_license.trial_expires_at IS NULL 
           OR NOW() >= v_license.trial_expires_at THEN
            RETURN jsonb_build_object('status', 'LICENSE_INVALID');
        END IF;
    ELSE
        -- SUSPENDED, REVOKED, EXPIRED ou qualquer outro estado nao-ativo/trial
        RETURN jsonb_build_object('status', 'LICENSE_INVALID');
    END IF;

    -- 3. Resolver source vinculada ao dispositivo
    SELECT dsb.source_id
    INTO v_binding
    FROM public.device_source_bindings dsb
    WHERE dsb.device_id = p_device_id
      AND dsb.license_id = v_license.id
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'status', 'SOURCE_NOT_BOUND',
            'mode', v_license.mode
        );
    END IF;

    -- 4. Resolver metadados da source em managed_sources
    SELECT source_id, source_type, version, status
    INTO v_source
    FROM public.managed_sources
    WHERE id = v_binding.source_id;

    IF NOT FOUND THEN
        -- Fallback por source_id caso binding guarde identificador sanitizado direto
        SELECT source_id, source_type, version, status
        INTO v_source
        FROM public.managed_sources
        WHERE source_id = v_binding.source_id::text;
    END IF;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'status', 'SOURCE_NOT_BOUND',
            'mode', v_license.mode
        );
    END IF;

    IF v_source.status <> 'ACTIVE' THEN
        RETURN jsonb_build_object(
            'status', 'SOURCE_NOT_BOUND',
            'mode', v_license.mode,
            'sourceId', v_source.source_id,
            'sourceVersion', v_source.version,
            'protocol', v_source.source_type,
            'sourceStatus', v_source.status
        );
    END IF;

    RETURN jsonb_build_object(
        'status', 'SOURCE_READY',
        'mode', v_license.mode,
        'sourceId', v_source.source_id,
        'sourceVersion', v_source.version,
        'protocol', v_source.source_type,
        'sourceStatus', v_source.status
    );
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_resolve_authorized_source_metadata(VARCHAR, VARCHAR) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_resolve_authorized_source_metadata(VARCHAR, VARCHAR) TO anon, authenticated;
