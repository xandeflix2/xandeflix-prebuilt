-- =============================================================================
-- Xandeflix Prebuilt — C8 Admin License & Customer Management Schema & RPCs
--
-- Migration canônica local para governança e gestão administrativa:
-- - Tabela de auditoria comercial (public.commercial_audit_logs)
-- - RPCs administrativas seguras com private.require_active_manager()
-- - Gestão de status de clientes (ACTIVE, SUSPENDED, BLOCKED)
-- - Gestão de limites de licenças (max_devices, max_concurrent_sessions)
-- - Ações de suspensão e revogação de licenças
-- - Listagem e detalhamento de licenças e clientes sanitizados
-- - Consulta administrativa de instalações, dispositivos e fontes
--
-- Princípios Canônicos:
-- - MANAGER_ONLY_MUTATIONS: Todas as mutações administrativas exigem private.require_active_manager().
-- - ZERO_SECRET_EXPOSURE: Proibido expor senhas, tokens de dispositivos, secrets de fontes ou JWTs.
-- - AUDITABLE_ADMIN_ACTIONS: Todas as mutações administrativas gravam em public.commercial_audit_logs.
-- - MAX_DEVICES_REDUCTION_POLICY=REJECT_BELOW_ACTIVE_DEVICE_COUNT: Proibido reduzir max_devices abaixo dos slots ocupados.
-- - NO_PAID_ACTIVATION_IN_C8: Ativações e renovações comerciais pagas são exclusivas de C10.
-- - NO_TRIAL_RESET: Proibido resetar trial_used_at ou estender trials arbitráriamente (ONE_TRIAL_PER_CUSTOMER).
-- - LEGACY_MANAGED_LICENSE_COMPATIBILITY: Licenças legadas com customer_id=NULL continuam válidas e visíveis.
-- - CUSTOMER_PORTAL_BOUNDARY: O portal do cliente nunca tem acesso às RPCs administrativas.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. TABELA DE AUDITORIA ADMINISTRATIVA (public.commercial_audit_logs)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.commercial_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manager_id UUID NOT NULL REFERENCES auth.users(id),
    action VARCHAR(64) NOT NULL CHECK (action IN (
        'CUSTOMER_STATUS_CHANGED',
        'LICENSE_LIMITS_CHANGED',
        'LICENSE_SUSPENDED',
        'LICENSE_REVOKED'
    )),
    target_type VARCHAR(32) NOT NULL CHECK (target_type IN ('CUSTOMER', 'LICENSE')),
    target_id VARCHAR(64) NOT NULL,
    before_state JSONB,
    after_state JSONB,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commercial_audit_logs_action
    ON public.commercial_audit_logs (action);

CREATE INDEX IF NOT EXISTS idx_commercial_audit_logs_target
    ON public.commercial_audit_logs (target_type, target_id);

CREATE INDEX IF NOT EXISTS idx_commercial_audit_logs_created_at
    ON public.commercial_audit_logs (created_at DESC);

-- RLS para tabela de auditoria: estritamente privada contra acesso direto
ALTER TABLE public.commercial_audit_logs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.commercial_audit_logs FROM PUBLIC, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 2. RPC ADMINISTRATIVA: DETALHE DO CLIENTE (rpc_manager_get_customer_detail)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.rpc_manager_get_customer_detail(p_customer_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
DECLARE
    v_customer RECORD;
    v_licenses JSONB;
    v_devices JSONB;
    v_sources JSONB;
BEGIN
    PERFORM private.require_active_manager();

    IF p_customer_id IS NULL THEN
        RAISE EXCEPTION 'CUSTOMER_ID_REQUIRED' USING ERRCODE = '22023';
    END IF;

    SELECT * INTO v_customer
    FROM public.customer_profiles
    WHERE id = p_customer_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'code', 'CUSTOMER_NOT_FOUND', 'message', 'Cliente não encontrado.');
    END IF;

    -- Licenças do cliente
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
    WHERE l.customer_id = p_customer_id;

    -- Dispositivos associados às licenças deste cliente (sem tokens ou segredos)
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
    WHERE l.customer_id = p_customer_id AND ld.status = 'ACTIVE';

    -- Fontes de autoatendimento associadas ao cliente (somente metadados sanitizados)
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
    WHERE cs.customer_id = p_customer_id;

    RETURN jsonb_build_object(
        'success', true,
        'customer', jsonb_build_object(
            'customerId', v_customer.id,
            'nickname', v_customer.nickname,
            'status', v_customer.status,
            'trialUsedAt', v_customer.trial_used_at,
            'createdAt', v_customer.created_at,
            'updatedAt', v_customer.updated_at
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
-- 3. RPC ADMINISTRATIVA: ATUALIZAR STATUS DO CLIENTE (rpc_manager_update_customer_status)
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
    v_clean_status VARCHAR(20);
    v_customer RECORD;
    v_before JSONB;
    v_after JSONB;
BEGIN
    v_manager_id := private.require_active_manager();

    IF p_customer_id IS NULL THEN
        RAISE EXCEPTION 'CUSTOMER_ID_REQUIRED' USING ERRCODE = '22023';
    END IF;

    v_clean_status := upper(trim(p_status));
    IF v_clean_status NOT IN ('ACTIVE', 'SUSPENDED', 'BLOCKED') THEN
        RAISE EXCEPTION 'INVALID_CUSTOMER_STATUS' USING ERRCODE = '22023';
    END IF;

    SELECT * INTO v_customer
    FROM public.customer_profiles
    WHERE id = p_customer_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'CUSTOMER_NOT_FOUND' USING ERRCODE = 'P0002';
    END IF;

    v_before := jsonb_build_object(
        'status', v_customer.status,
        'nickname', v_customer.nickname
    );

    UPDATE public.customer_profiles
    SET status = v_clean_status,
        updated_at = NOW()
    WHERE id = p_customer_id;

    v_after := jsonb_build_object(
        'status', v_clean_status,
        'nickname', v_customer.nickname
    );

    -- Gravação em auditoria
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
        'CUSTOMER',
        p_customer_id::text,
        v_before,
        v_after,
        p_reason,
        NOW()
    );

    RETURN jsonb_build_object(
        'success', true,
        'customerId', p_customer_id,
        'status', v_clean_status,
        'previousStatus', v_customer.status,
        'updatedAt', NOW()
    );
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_manager_update_customer_status(UUID, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_manager_update_customer_status(UUID, TEXT, TEXT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 4. RPC ADMINISTRATIVA: LISTAR LICENÇAS (rpc_manager_list_licenses)
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
            'customerId', l.customer_id,
            'customerNickname', cp.nickname,
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
    LEFT JOIN public.customer_profiles cp ON cp.id = l.customer_id;

    RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_manager_list_licenses() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_manager_list_licenses() TO authenticated;

-- -----------------------------------------------------------------------------
-- 5. RPC ADMINISTRATIVA: DETALHE DA LICENÇA (rpc_manager_get_license_detail)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.rpc_manager_get_license_detail(p_license_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
DECLARE
    v_license RECORD;
    v_customer RECORD;
    v_devices JSONB;
    v_managed_sources JSONB;
    v_customer_sources JSONB;
BEGIN
    PERFORM private.require_active_manager();

    IF p_license_id IS NULL THEN
        RAISE EXCEPTION 'LICENSE_ID_REQUIRED' USING ERRCODE = '22023';
    END IF;

    SELECT * INTO v_license
    FROM public.licenses
    WHERE id = p_license_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'code', 'LICENSE_NOT_FOUND', 'message', 'Licença não encontrada.');
    END IF;

    -- Perfil do cliente se associado
    IF v_license.customer_id IS NOT NULL THEN
        SELECT * INTO v_customer
        FROM public.customer_profiles
        WHERE id = v_license.customer_id;
    END IF;

    -- Dispositivos vinculados a esta licença (sanitizados)
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

    -- Fontes gerenciadas vinculadas via device_source_bindings
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
    JOIN public.managed_sources ms ON ms.source_id = dsb.source_id
    WHERE dsb.license_id = p_license_id;

    -- Fontes de autoatendimento da licença (somente metadados sanitizados)
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
            'customerId', v_license.customer_id,
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
            WHEN v_customer.id IS NOT NULL THEN
                jsonb_build_object(
                    'customerId', v_customer.id,
                    'nickname', v_customer.nickname,
                    'status', v_customer.status
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
-- 6. RPC ADMINISTRATIVA: ATUALIZAR LIMITES DA LICENÇA (rpc_manager_update_license_limits)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.rpc_manager_update_license_limits(
    p_license_id UUID,
    p_max_devices INT,
    p_max_concurrent_sessions INT,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
DECLARE
    v_manager_id UUID;
    v_license RECORD;
    v_active_devices INT;
    v_before JSONB;
    v_after JSONB;
BEGIN
    v_manager_id := private.require_active_manager();

    IF p_license_id IS NULL THEN
        RAISE EXCEPTION 'LICENSE_ID_REQUIRED' USING ERRCODE = '22023';
    END IF;

    -- Validação de limites dentro de boundaries técnicas razoáveis
    IF p_max_devices IS NULL OR p_max_devices < 1 OR p_max_devices > 100 THEN
        RAISE EXCEPTION 'INVALID_MAX_DEVICES' USING ERRCODE = '22023';
    END IF;

    IF p_max_concurrent_sessions IS NULL OR p_max_concurrent_sessions < 1 OR p_max_concurrent_sessions > 50 THEN
        RAISE EXCEPTION 'INVALID_MAX_CONCURRENT_SESSIONS' USING ERRCODE = '22023';
    END IF;

    SELECT * INTO v_license
    FROM public.licenses
    WHERE id = p_license_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'LICENSE_NOT_FOUND' USING ERRCODE = 'P0002';
    END IF;

    -- Contagem de slots ativos
    SELECT count(*)::int INTO v_active_devices
    FROM public.license_devices
    WHERE license_id = p_license_id AND status = 'ACTIVE';

    -- Policy Section 33: MAX_DEVICES_REDUCTION_POLICY=REJECT_BELOW_ACTIVE_DEVICE_COUNT
    IF p_max_devices < v_active_devices THEN
        RAISE EXCEPTION 'CANNOT_REDUCE_BELOW_ACTIVE_DEVICES' USING ERRCODE = '42501';
    END IF;

    v_before := jsonb_build_object(
        'maxDevices', v_license.max_devices,
        'maxConcurrentSessions', v_license.max_concurrent_sessions
    );

    UPDATE public.licenses
    SET max_devices = p_max_devices,
        max_concurrent_sessions = p_max_concurrent_sessions
    WHERE id = p_license_id;

    v_after := jsonb_build_object(
        'maxDevices', p_max_devices,
        'maxConcurrentSessions', p_max_concurrent_sessions
    );

    -- Gravação em auditoria
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
        'LICENSE_LIMITS_CHANGED',
        'LICENSE',
        p_license_id::text,
        v_before,
        v_after,
        p_reason,
        NOW()
    );

    RETURN jsonb_build_object(
        'success', true,
        'licenseId', p_license_id,
        'maxDevices', p_max_devices,
        'maxConcurrentSessions', p_max_concurrent_sessions,
        'activeDeviceCount', v_active_devices
    );
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_manager_update_license_limits(UUID, INT, INT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_manager_update_license_limits(UUID, INT, INT, TEXT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 7. RPC ADMINISTRATIVA: SUSPENDER LICENÇA (rpc_manager_suspend_license)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.rpc_manager_suspend_license(
    p_license_id UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
DECLARE
    v_manager_id UUID;
    v_license RECORD;
    v_before JSONB;
    v_after JSONB;
BEGIN
    v_manager_id := private.require_active_manager();

    IF p_license_id IS NULL THEN
        RAISE EXCEPTION 'LICENSE_ID_REQUIRED' USING ERRCODE = '22023';
    END IF;

    SELECT * INTO v_license
    FROM public.licenses
    WHERE id = p_license_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'LICENSE_NOT_FOUND' USING ERRCODE = 'P0002';
    END IF;

    IF v_license.status = 'REVOKED' THEN
        RAISE EXCEPTION 'CANNOT_SUSPEND_REVOKED_LICENSE' USING ERRCODE = '42501';
    END IF;

    v_before := jsonb_build_object(
        'status', v_license.status,
        'mode', v_license.mode
    );

    UPDATE public.licenses
    SET status = 'SUSPENDED'
    WHERE id = p_license_id;

    v_after := jsonb_build_object(
        'status', 'SUSPENDED',
        'mode', v_license.mode
    );

    -- Gravação em auditoria
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
        'LICENSE_SUSPENDED',
        'LICENSE',
        p_license_id::text,
        v_before,
        v_after,
        p_reason,
        NOW()
    );

    RETURN jsonb_build_object(
        'success', true,
        'licenseId', p_license_id,
        'status', 'SUSPENDED',
        'previousStatus', v_license.status
    );
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_manager_suspend_license(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_manager_suspend_license(UUID, TEXT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 8. RPC ADMINISTRATIVA: REVOGAR LICENÇA (rpc_manager_revoke_license)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.rpc_manager_revoke_license(
    p_license_id UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
DECLARE
    v_manager_id UUID;
    v_license RECORD;
    v_before JSONB;
    v_after JSONB;
BEGIN
    v_manager_id := private.require_active_manager();

    IF p_license_id IS NULL THEN
        RAISE EXCEPTION 'LICENSE_ID_REQUIRED' USING ERRCODE = '22023';
    END IF;

    SELECT * INTO v_license
    FROM public.licenses
    WHERE id = p_license_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'LICENSE_NOT_FOUND' USING ERRCODE = 'P0002';
    END IF;

    v_before := jsonb_build_object(
        'status', v_license.status,
        'mode', v_license.mode
    );

    UPDATE public.licenses
    SET status = 'REVOKED'
    WHERE id = p_license_id;

    v_after := jsonb_build_object(
        'status', 'REVOKED',
        'mode', v_license.mode
    );

    -- Gravação em auditoria
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
        'LICENSE_REVOKED',
        'LICENSE',
        p_license_id::text,
        v_before,
        v_after,
        p_reason,
        NOW()
    );

    RETURN jsonb_build_object(
        'success', true,
        'licenseId', p_license_id,
        'status', 'REVOKED',
        'previousStatus', v_license.status
    );
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_manager_revoke_license(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_manager_revoke_license(UUID, TEXT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 9. RPC ADMINISTRATIVA: LISTAR FONTES DE CLIENTE (rpc_manager_list_customer_sources)
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
            'customerId', cs.customer_id,
            'customerNickname', cp.nickname,
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
    JOIN public.customer_profiles cp ON cp.id = cs.customer_id;

    RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_manager_list_customer_sources() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_manager_list_customer_sources() TO authenticated;

-- -----------------------------------------------------------------------------
-- 10. RPC ADMINISTRATIVA: LISTAR LOGS DE AUDITORIA (rpc_manager_list_audit_logs)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.rpc_manager_list_audit_logs(p_limit INT DEFAULT 50)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
DECLARE
    v_limit INT;
    v_result JSONB;
BEGIN
    PERFORM private.require_active_manager();

    v_limit := GREATEST(1, LEAST(COALESCE(p_limit, 50), 200));

    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', al.id,
            'managerId', al.manager_id,
            'action', al.action,
            'targetType', al.target_type,
            'targetId', al.target_id,
            'beforeState', al.before_state,
            'afterState', al.after_state,
            'reason', al.reason,
            'createdAt', al.created_at
        ) ORDER BY al.created_at DESC
    ), '[]'::jsonb)
    INTO v_result
    FROM (
        SELECT *
        FROM public.commercial_audit_logs
        ORDER BY created_at DESC
        LIMIT v_limit
    ) al;

    RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_manager_list_audit_logs(INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_manager_list_audit_logs(INT) TO authenticated;
