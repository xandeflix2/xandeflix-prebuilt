-- =============================================================================
-- XANDEFLIX PREBUILT — COMMERCIAL CONTROL PLANE C10
-- Migration: 20260917160000_c10_payment_and_manual_activation.sql
--
-- Princípios:
-- - SEPARAÇÃO ESTRITA: Payment Evidence desacoplada da autoridade de ativação de licença
-- - SERVER-ONLY AUTHORITY: Apenas o servidor é autoridade para converter licenças em ACTIVE
-- - MANUAL ACTIVATION MVP: Permite ativação manual por gestor ativo (MANUAL_MANAGER)
-- - PRESERVAÇÃO DE TRIAL: ONE_TRIAL_PER_CUSTOMER inviolável; ativação comercial nunca concede segundo trial
-- - PRESERVAÇÃO DE IDENTIDADE: Dispositivos, tokens, fontes e cofre 100% preservados
-- - BLOQUEIO DISCIPLINAR: Licenças SUSPENDED e REVOKED não podem ser auto-ativadas por pagamento
-- - IDEMPOTÊNCIA: Chave de idempotência evita duplicação de eventos comerciais e renovações
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. TABELA DE EVENTOS DE ATIVAÇÃO COMERCIAL E PAGAMENTOS (commercial_activation_events)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.commercial_activation_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_id UUID NOT NULL REFERENCES public.licenses(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customer_profiles(id) ON DELETE SET NULL,
    activation_type VARCHAR(30) NOT NULL CHECK (activation_type IN ('MANUAL_MANAGER', 'PROVIDER_WEBHOOK')),
    payment_status VARCHAR(30) NOT NULL DEFAULT 'CONFIRMED' CHECK (payment_status IN ('PENDING', 'CONFIRMED', 'FAILED', 'CANCELLED', 'REFUNDED')),
    amount_minor INTEGER, -- centavos, nullable para ativações manuais sem valor transacionado
    currency VARCHAR(3) DEFAULT 'BRL',
    external_reference VARCHAR(100),
    period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    period_end TIMESTAMPTZ, -- null = sem expiração contratual
    created_by_manager_id UUID,
    idempotency_key VARCHAR(100),
    provider_event_id VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_comm_events_license_id ON public.commercial_activation_events(license_id);
CREATE INDEX IF NOT EXISTS idx_comm_events_customer_id ON public.commercial_activation_events(customer_id);
CREATE INDEX IF NOT EXISTS idx_comm_events_payment_status ON public.commercial_activation_events(payment_status);
CREATE INDEX IF NOT EXISTS idx_comm_events_created_at ON public.commercial_activation_events(created_at DESC);

-- Índices únicos parciais para idempotência e proteção contra replay
CREATE UNIQUE INDEX IF NOT EXISTS idx_comm_events_idempotency_key 
    ON public.commercial_activation_events(idempotency_key) 
    WHERE idempotency_key IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_comm_events_provider_event_id 
    ON public.commercial_activation_events(provider_event_id) 
    WHERE provider_event_id IS NOT NULL;

-- Habilita RLS estrito
ALTER TABLE public.commercial_activation_events ENABLE ROW LEVEL SECURITY;

-- Revoga mutações diretas para anon e authenticated
REVOKE ALL ON TABLE public.commercial_activation_events FROM PUBLIC, anon, authenticated;

-- Política de leitura: Clientes podem ler apenas eventos associados às suas licenças
DROP POLICY IF EXISTS "customers_read_own_activation_events" ON public.commercial_activation_events;
CREATE POLICY "customers_read_own_activation_events" ON public.commercial_activation_events
    FOR SELECT TO authenticated
    USING (
        customer_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.licenses l
            WHERE l.id = commercial_activation_events.license_id
              AND l.customer_id = auth.uid()
        )
    );

-- -----------------------------------------------------------------------------
-- 2. AUTORIDADE PRIVADA DE ATIVAÇÃO SERVER-SIDE (private.activate_license_from_commercial_evidence)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.activate_license_from_commercial_evidence(
    p_license_id UUID,
    p_activation_type TEXT,
    p_payment_status TEXT,
    p_period_end TIMESTAMPTZ DEFAULT NULL,
    p_manager_id UUID DEFAULT NULL,
    p_idempotency_key TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, extensions, private
AS $$
DECLARE
    v_license RECORD;
    v_prev_status TEXT;
    v_event_id UUID;
    v_now TIMESTAMPTZ := NOW();
    v_new_expires_at TIMESTAMPTZ;
BEGIN
    -- 1. Verifica idempotência prévia se a chave foi informada
    IF p_idempotency_key IS NOT NULL THEN
        SELECT id, license_id, period_end, created_at
        INTO v_event_id, p_license_id, v_new_expires_at, v_now
        FROM public.commercial_activation_events
        WHERE idempotency_key = p_idempotency_key;

        IF FOUND THEN
            SELECT status, expires_at INTO v_license
            FROM public.licenses
            WHERE id = p_license_id;

            RETURN jsonb_build_object(
                'success', true,
                'licenseId', p_license_id,
                'previousStatus', v_license.status,
                'newStatus', v_license.status,
                'effectiveAt', v_now,
                'expiresAt', v_license.expires_at,
                'activationEventId', v_event_id,
                'idempotentReplay', true,
                'message', 'Operação já processada anteriormente (idempotente).'
            );
        END IF;
    END IF;

    -- 2. Bloqueio pessimista da licença
    SELECT id, customer_id, status, expires_at, trial_started_at, trial_expires_at, mode
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

    v_prev_status := v_license.status;

    -- 3. Bloqueio estrito de reativação para licenças SUSPENDED ou REVOKED
    IF v_license.status = 'SUSPENDED' THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'CANNOT_ACTIVATE_SUSPENDED_LICENSE',
            'message', 'Licença suspensa não pode ser ativada por evidência comercial. Desbloqueio administrativo prévio obrigatório.'
        );
    END IF;

    IF v_license.status = 'REVOKED' THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'CANNOT_ACTIVATE_REVOKED_LICENSE',
            'message', 'Licença revogada permanentemente não pode ser reativada por pagamento.'
        );
    END IF;

    -- 4. Validação de período de validade (se fornecido, deve ser no futuro)
    IF p_period_end IS NOT NULL AND p_period_end <= v_now THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'INVALID_VALID_UNTIL',
            'message', 'A data de expiração (valid_until) deve ser posterior ao horário atual do servidor.'
        );
    END IF;

    -- Define nova expiração (se null, mantém null ou a política atual sem inventar default)
    v_new_expires_at := p_period_end;

    -- 5. Atualização atômica da licença para ACTIVE
    -- Preserva integralmente histórico de trial (trial_started_at, trial_expires_at)
    UPDATE public.licenses
    SET status = 'ACTIVE',
        expires_at = v_new_expires_at
    WHERE id = p_license_id;

    -- 6. Registro do evento de ativação comercial
    v_event_id := gen_random_uuid();
    INSERT INTO public.commercial_activation_events (
        id,
        license_id,
        customer_id,
        activation_type,
        payment_status,
        period_start,
        period_end,
        created_by_manager_id,
        idempotency_key,
        created_at,
        metadata
    ) VALUES (
        v_event_id,
        p_license_id,
        v_license.customer_id,
        p_activation_type,
        p_payment_status,
        v_now,
        v_new_expires_at,
        p_manager_id,
        p_idempotency_key,
        v_now,
        COALESCE(p_metadata, '{}'::jsonb)
    );

    RETURN jsonb_build_object(
        'success', true,
        'licenseId', p_license_id,
        'previousStatus', v_prev_status,
        'newStatus', 'ACTIVE',
        'effectiveAt', v_now,
        'expiresAt', v_new_expires_at,
        'activationEventId', v_event_id,
        'idempotentReplay', false
    );
END;
$$;

REVOKE ALL ON FUNCTION private.activate_license_from_commercial_evidence(UUID, TEXT, TEXT, TIMESTAMPTZ, UUID, TEXT, JSONB) FROM PUBLIC, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 3. RPC DE ATIVAÇÃO MANUAL POR GESTOR (rpc_manager_activate_license_manual)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.rpc_manager_activate_license_manual(
    p_license_id UUID,
    p_reason TEXT,
    p_valid_until TIMESTAMPTZ DEFAULT NULL,
    p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, extensions, private
AS $$
DECLARE
    v_manager_user_id UUID;
    v_res JSONB;
BEGIN
    -- 1. Exige papel de gestor ativo
    PERFORM private.require_active_manager();
    v_manager_user_id := auth.uid();

    -- 2. Valida razão obrigatória
    IF p_license_id IS NULL OR p_reason IS NULL OR TRIM(p_reason) = '' THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'INVALID_PARAMETERS',
            'message', 'licenseId e reason são obrigatórios para ativação manual.'
        );
    END IF;

    -- 3. Executa ativação através da autoridade server-side
    v_res := private.activate_license_from_commercial_evidence(
        p_license_id => p_license_id,
        p_activation_type => 'MANUAL_MANAGER',
        p_payment_status => 'CONFIRMED',
        p_period_end => p_valid_until,
        p_manager_id => v_manager_user_id,
        p_idempotency_key => p_idempotency_key,
        p_metadata => jsonb_build_object(
            'manualActivationReason', TRIM(p_reason),
            'clientIp', NULL
        )
    );

    -- 4. Se obteve sucesso e não for replay, grava log de auditoria administrativa
    IF COALESCE((v_res->>'success')::boolean, false) AND NOT COALESCE((v_res->>'idempotentReplay')::boolean, false) THEN
        INSERT INTO public.commercial_audit_logs (
            id,
            manager_id,
            action,
            target_type,
            target_id,
            previous_state,
            new_state,
            created_at,
            metadata
        ) VALUES (
            gen_random_uuid(),
            v_manager_user_id,
            CASE WHEN (v_res->>'previousStatus') = 'ACTIVE' THEN 'LICENSE_RENEWED' ELSE 'LICENSE_MANUALLY_ACTIVATED' END,
            'LICENSE',
            p_license_id,
            jsonb_build_object('status', v_res->>'previousStatus'),
            jsonb_build_object('status', 'ACTIVE', 'expiresAt', v_res->>'expiresAt'),
            NOW(),
            jsonb_build_object(
                'reason', TRIM(p_reason),
                'activationEventId', v_res->>'activationEventId'
            )
        );
    END IF;

    RETURN v_res;
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_manager_activate_license_manual(UUID, TEXT, TIMESTAMPTZ, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_manager_activate_license_manual(UUID, TEXT, TIMESTAMPTZ, TEXT) TO authenticated;
