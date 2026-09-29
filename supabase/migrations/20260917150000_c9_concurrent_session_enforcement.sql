-- =============================================================================
-- XANDEFLIX PREBUILT — COMMERCIAL CONTROL PLANE C9
-- Migration: 20260917150000_c9_concurrent_session_enforcement.sql
-- 
-- Princípios:
-- - PLAYBACK SESSION ENFORCEMENT: Limite estrito de telas baseado em licenses.max_concurrent_sessions
-- - DECOUPLED AUTHORIZATION: Autorização do dispositivo mantida mesmo com limite de sessões atingido
-- - MUTUAL AUTHENTICATION: Prova criptográfica de device token no start e session token no heartbeat/close
-- - RAW_CLIENT_HASH_SERVER: Token bruto entregue uma vez ao dispositivo; banco armazena apenas SHA-256
-- - SERVER_TIME_AUTHORITY: Decisões temporais baseadas exclusivamente em NOW()
-- - STALE TIMEOUT: Sessões sem heartbeat há mais de 120s são desconsideradas/liberadas
-- - HEARTBEAT INTERVAL: Dispositivos emitem pulso a cada 60s
-- - ONE_ACTIVE_PLAYBACK_SESSION_PER_DEVICE_PER_LICENSE: Evita duplicação de slots em retry/crash do mesmo aparelho
-- - FAIL-CLOSED: Queda de autoridade ou expiração durante playback encerra a sessão
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. TABELA DE SESSÕES DE REPRODUÇÃO (playback_sessions)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.playback_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_id UUID NOT NULL REFERENCES public.licenses(id) ON DELETE CASCADE,
    device_id VARCHAR(64) NOT NULL REFERENCES public.devices(device_id) ON DELETE CASCADE,
    session_token_hash VARCHAR(64) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CLOSED', 'STALE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    close_reason VARCHAR(50),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_playback_sessions_license_id ON public.playback_sessions(license_id);
CREATE INDEX IF NOT EXISTS idx_playback_sessions_device_id ON public.playback_sessions(device_id);
CREATE INDEX IF NOT EXISTS idx_playback_sessions_status ON public.playback_sessions(status);
CREATE INDEX IF NOT EXISTS idx_playback_sessions_last_heartbeat ON public.playback_sessions(last_heartbeat_at);
CREATE INDEX IF NOT EXISTS idx_playback_sessions_license_status ON public.playback_sessions(license_id, status);

-- Habilita RLS estrito
ALTER TABLE public.playback_sessions ENABLE ROW LEVEL SECURITY;

-- Política de Leitura para Clientes (apenas próprias licenças)
DROP POLICY IF EXISTS "customers_read_own_playback_sessions" ON public.playback_sessions;
CREATE POLICY "customers_read_own_playback_sessions" ON public.playback_sessions
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.licenses l
            WHERE l.id = playback_sessions.license_id
              AND l.customer_id = auth.uid()
        )
    );

-- Nenhuma mutação direta permitida para clientes ou anon
-- Todas as operações devem passar pelas RPCs com validação de prova criptográfica.

-- -----------------------------------------------------------------------------
-- 2. RPC: rpc_device_start_playback_session
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.rpc_device_start_playback_session(
    p_license_id UUID,
    p_device_id TEXT,
    p_device_token TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, extensions, private
AS $$
DECLARE
    v_device RECORD;
    v_device_token_hash VARCHAR(64);
    v_license RECORD;
    v_access_eval JSONB;
    v_active_count INTEGER;
    v_session_id UUID;
    v_raw_session_token TEXT;
    v_session_token_hash VARCHAR(64);
    v_now TIMESTAMPTZ := NOW();
BEGIN
    -- 1. Validação de parâmetros
    IF p_license_id IS NULL OR p_device_id IS NULL OR p_device_token IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'INVALID_PARAMETERS',
            'message', 'Parâmetros obrigatórios ausentes.'
        );
    END IF;

    -- 2. Valida existência e autorização do dispositivo
    SELECT * INTO v_device
    FROM public.devices
    WHERE device_id = p_device_id;

    IF NOT FOUND OR v_device.status <> 'AUTHORIZED' THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'DEVICE_NOT_AUTHORIZED',
            'message', 'Dispositivo não autorizado.'
        );
    END IF;

    -- 3. Prova criptográfica do token de dispositivo
    v_device_token_hash := encode(digest(p_device_token, 'sha256'), 'hex');
    IF v_device_token_hash <> v_device.device_token_hash THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'INVALID_DEVICE_TOKEN_PROOF',
            'message', 'Prova de token do dispositivo inválida.'
        );
    END IF;

    -- 4. Valida vinculação do dispositivo à licença
    IF NOT EXISTS (
        SELECT 1 FROM public.license_devices
        WHERE license_id = p_license_id
          AND device_id = p_device_id
          AND status = 'ACTIVE'
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'DEVICE_NOT_BOUND_TO_LICENSE',
            'message', 'Dispositivo não vinculado a esta licença.'
        );
    END IF;

    -- 5. Avalia direito comercial da licença (Trial, Status, Expiração)
    v_access_eval := private.evaluate_license_access(p_license_id, p_device_id);
    IF NOT COALESCE((v_access_eval->>'accessAllowed')::boolean, false) THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', COALESCE(v_access_eval->>'code', 'LICENSE_ACCESS_DENIED'),
            'message', COALESCE(v_access_eval->>'message', 'Acesso da licença negado.')
        );
    END IF;

    -- 6. Bloqueio atômico da licença para prevenir race condition de início concorrente
    SELECT id, max_concurrent_sessions, status
    INTO v_license
    FROM public.licenses
    WHERE id = p_license_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'LICENSE_NOT_FOUND',
            'message', 'Licença não encontrada.'
        );
    END IF;

    -- 7. Limpeza e expiração de sessões stale (> 120s sem heartbeat)
    UPDATE public.playback_sessions
    SET status = 'STALE',
        closed_at = v_now,
        close_reason = 'STALE_TIMEOUT'
    WHERE license_id = p_license_id
      AND status = 'ACTIVE'
      AND v_now - last_heartbeat_at >= INTERVAL '120 seconds';

    -- 8. Política MVP: ONE_ACTIVE_PLAYBACK_SESSION_PER_DEVICE_PER_LICENSE
    -- Se o mesmo dispositivo tentar iniciar novamente (retry ou reabertura do player),
    -- encerra a sessão ativa anterior dele para evitar duplicação descontrolada de slots.
    UPDATE public.playback_sessions
    SET status = 'CLOSED',
        closed_at = v_now,
        close_reason = 'SUPERSEDED_BY_NEW_SESSION'
    WHERE license_id = p_license_id
      AND device_id = p_device_id
      AND status = 'ACTIVE';

    -- 9. Contagem atômica de sessões ativas válidas
    SELECT COUNT(*) INTO v_active_count
    FROM public.playback_sessions
    WHERE license_id = p_license_id
      AND status = 'ACTIVE'
      AND v_now - last_heartbeat_at < INTERVAL '120 seconds';

    -- 10. Verificação do limite de sessões simultâneas
    IF v_active_count >= v_license.max_concurrent_sessions THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'SESSION_LIMIT_REACHED',
            'maxConcurrentSessions', v_license.max_concurrent_sessions,
            'activeSessions', v_active_count,
            'message', 'Limite de telas simultâneas atingido para esta licença.'
        );
    END IF;

    -- 11. Geração de token de sessão criptograficamente seguro (32 bytes)
    v_session_id := gen_random_uuid();
    v_raw_session_token := encode(gen_random_bytes(32), 'hex');
    v_session_token_hash := encode(digest(v_raw_session_token, 'sha256'), 'hex');

    -- 12. Persistência atômica da sessão
    INSERT INTO public.playback_sessions (
        id,
        license_id,
        device_id,
        session_token_hash,
        status,
        created_at,
        last_heartbeat_at,
        metadata
    ) VALUES (
        v_session_id,
        p_license_id,
        p_device_id,
        v_session_token_hash,
        'ACTIVE',
        v_now,
        v_now,
        COALESCE(p_metadata, '{}'::jsonb)
    );

    -- 13. Retorno com token bruto fornecido apenas ao cliente
    RETURN jsonb_build_object(
        'success', true,
        'sessionId', v_session_id,
        'sessionToken', v_raw_session_token,
        'licenseId', p_license_id,
        'deviceId', p_device_id,
        'status', 'ACTIVE',
        'heartbeatIntervalSeconds', 60,
        'staleSessionSeconds', 120,
        'createdAt', v_now
    );
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_device_start_playback_session(UUID, TEXT, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_device_start_playback_session(UUID, TEXT, TEXT, JSONB) TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- 3. RPC: rpc_device_heartbeat_playback_session
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.rpc_device_heartbeat_playback_session(
    p_session_id UUID,
    p_device_id TEXT,
    p_session_token TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, extensions, private
AS $$
DECLARE
    v_session RECORD;
    v_token_hash VARCHAR(64);
    v_access_eval JSONB;
    v_now TIMESTAMPTZ := NOW();
BEGIN
    IF p_session_id IS NULL OR p_device_id IS NULL OR p_session_token IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'INVALID_PARAMETERS',
            'message', 'Identificador de sessão, dispositivo e token são obrigatórios.'
        );
    END IF;

    -- 1. Localiza a sessão
    SELECT * INTO v_session
    FROM public.playback_sessions
    WHERE id = p_session_id;

    IF NOT FOUND OR v_session.device_id <> p_device_id THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'SESSION_NOT_FOUND',
            'message', 'Sessão de reprodução não encontrada para este dispositivo.'
        );
    END IF;

    -- 2. Valida hash do token de sessão (stored hash não pode funcionar como bearer)
    v_token_hash := encode(digest(p_session_token, 'sha256'), 'hex');
    IF v_token_hash <> v_session.session_token_hash THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'INVALID_SESSION_TOKEN',
            'message', 'Token de sessão inválido.'
        );
    END IF;

    -- 3. Valida se a sessão ainda está marcada como ativa
    IF v_session.status <> 'ACTIVE' THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'SESSION_NOT_ACTIVE',
            'sessionStatus', v_session.status,
            'message', 'Sessão de reprodução não está ativa.'
        );
    END IF;

    -- 4. Valida se a sessão se tornou stale (> 120s sem pulso)
    IF v_now - v_session.last_heartbeat_at >= INTERVAL '120 seconds' THEN
        UPDATE public.playback_sessions
        SET status = 'STALE',
            closed_at = v_now,
            close_reason = 'STALE_TIMEOUT'
        WHERE id = p_session_id;

        RETURN jsonb_build_object(
            'success', false,
            'code', 'SESSION_STALE',
            'sessionStatus', 'STALE',
            'message', 'Sessão expirada por inatividade (stale timeout).'
        );
    END IF;

    -- 5. Validação contínua do direito comercial da licença (suspensa, revogada ou trial expirado)
    v_access_eval := private.evaluate_license_access(v_session.license_id, v_session.device_id);
    IF NOT COALESCE((v_access_eval->>'accessAllowed')::boolean, false) THEN
        -- Encerra a sessão imediatamente
        UPDATE public.playback_sessions
        SET status = 'CLOSED',
            closed_at = v_now,
            close_reason = COALESCE(v_access_eval->>'code', 'LICENSE_ACCESS_REVOKED')
        WHERE id = p_session_id;

        RETURN jsonb_build_object(
            'success', false,
            'code', COALESCE(v_access_eval->>'code', 'LICENSE_ACCESS_REVOKED'),
            'sessionStatus', 'CLOSED',
            'message', COALESCE(v_access_eval->>'message', 'Acesso da licença não mais permitido.')
        );
    END IF;

    -- 6. Atualiza heartbeat timestamp com horário do servidor
    UPDATE public.playback_sessions
    SET last_heartbeat_at = v_now
    WHERE id = p_session_id;

    RETURN jsonb_build_object(
        'success', true,
        'sessionId', p_session_id,
        'status', 'ACTIVE',
        'lastHeartbeatAt', v_now
    );
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_device_heartbeat_playback_session(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_device_heartbeat_playback_session(UUID, TEXT, TEXT) TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- 4. RPC: rpc_device_close_playback_session
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.rpc_device_close_playback_session(
    p_session_id UUID,
    p_device_id TEXT,
    p_session_token TEXT,
    p_close_reason TEXT DEFAULT 'USER_EXIT'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, extensions, private
AS $$
DECLARE
    v_session RECORD;
    v_token_hash VARCHAR(64);
    v_now TIMESTAMPTZ := NOW();
BEGIN
    IF p_session_id IS NULL OR p_device_id IS NULL OR p_session_token IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'INVALID_PARAMETERS',
            'message', 'Identificador de sessão, dispositivo e token são obrigatórios.'
        );
    END IF;

    -- 1. Localiza a sessão
    SELECT * INTO v_session
    FROM public.playback_sessions
    WHERE id = p_session_id;

    IF NOT FOUND OR v_session.device_id <> p_device_id THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'SESSION_NOT_FOUND',
            'message', 'Sessão de reprodução não encontrada.'
        );
    END IF;

    -- 2. Valida hash do token de sessão
    v_token_hash := encode(digest(p_session_token, 'sha256'), 'hex');
    IF v_token_hash <> v_session.session_token_hash THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'INVALID_SESSION_TOKEN',
            'message', 'Token de sessão inválido.'
        );
    END IF;

    -- 3. Idempotência: se já estiver fechada, retorna sucesso sem duplicar
    IF v_session.status = 'CLOSED' THEN
        RETURN jsonb_build_object(
            'success', true,
            'sessionId', p_session_id,
            'status', 'CLOSED',
            'message', 'Sessão já estava encerrada.'
        );
    END IF;

    -- 4. Encerra a sessão
    UPDATE public.playback_sessions
    SET status = 'CLOSED',
        closed_at = v_now,
        close_reason = COALESCE(p_close_reason, 'USER_EXIT')
    WHERE id = p_session_id;

    RETURN jsonb_build_object(
        'success', true,
        'sessionId', p_session_id,
        'status', 'CLOSED'
    );
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_device_close_playback_session(UUID, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_device_close_playback_session(UUID, TEXT, TEXT, TEXT) TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- 5. RPC: rpc_customer_list_playback_sessions
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.rpc_customer_list_playback_sessions(
    p_license_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, extensions, private
AS $$
DECLARE
    v_customer_id UUID;
    v_result JSONB;
BEGIN
    v_customer_id := auth.uid();
    IF v_customer_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'AUTHENTICATION_REQUIRED',
            'message', 'Autenticação necessária.'
        );
    END IF;

    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'sessionId', s.id,
            'licenseId', s.license_id,
            'deviceId', s.device_id,
            'deviceDisplayCode', d.display_code,
            'deviceLabel', d.device_label,
            'deviceType', d.device_type,
            'status', s.status,
            'createdAt', s.created_at,
            'lastHeartbeatAt', s.last_heartbeat_at,
            'closedAt', s.closed_at,
            'closeReason', s.close_reason
        ) ORDER BY s.last_heartbeat_at DESC
    ), '[]'::jsonb)
    INTO v_result
    FROM public.playback_sessions s
    JOIN public.licenses l ON l.id = s.license_id
    JOIN public.devices d ON d.device_id = s.device_id
    WHERE l.customer_id = v_customer_id
      AND (p_license_id IS NULL OR s.license_id = p_license_id);

    RETURN jsonb_build_object(
        'success', true,
        'sessions', v_result
    );
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_customer_list_playback_sessions(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_customer_list_playback_sessions(UUID) TO authenticated;

-- -----------------------------------------------------------------------------
-- 6. RPC: rpc_manager_list_playback_sessions
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.rpc_manager_list_playback_sessions(
    p_license_id UUID DEFAULT NULL,
    p_status TEXT DEFAULT NULL,
    p_limit INT DEFAULT 50
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, extensions, private
AS $$
DECLARE
    v_result JSONB;
    v_limit INT := LEAST(GREATEST(COALESCE(p_limit, 50), 1), 200);
BEGIN
    -- Valida autoridade administrativa de gestor ativo
    PERFORM private.require_active_manager();

    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'sessionId', s.id,
            'licenseId', s.license_id,
            'customerId', l.customer_id,
            'customerNickname', c.nickname,
            'deviceId', s.device_id,
            'deviceDisplayCode', d.display_code,
            'deviceLabel', d.device_label,
            'deviceType', d.device_type,
            'status', s.status,
            'createdAt', s.created_at,
            'lastHeartbeatAt', s.last_heartbeat_at,
            'closedAt', s.closed_at,
            'closeReason', s.close_reason
        ) ORDER BY s.last_heartbeat_at DESC
    ), '[]'::jsonb)
    INTO v_result
    FROM (
        SELECT s_sub.*
        FROM public.playback_sessions s_sub
        WHERE (p_license_id IS NULL OR s_sub.license_id = p_license_id)
          AND (p_status IS NULL OR s_sub.status = p_status)
        ORDER BY s_sub.last_heartbeat_at DESC
        LIMIT v_limit
    ) s
    JOIN public.licenses l ON l.id = s.license_id
    LEFT JOIN public.customers c ON c.id = l.customer_id
    JOIN public.devices d ON d.device_id = s.device_id;

    RETURN jsonb_build_object(
        'success', true,
        'sessions', v_result
    );
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_manager_list_playback_sessions(UUID, TEXT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_manager_list_playback_sessions(UUID, TEXT, INT) TO authenticated;
