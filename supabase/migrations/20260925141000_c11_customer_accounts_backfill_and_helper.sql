-- =============================================================================
-- Migration: 20260925141000_c11_customer_accounts_backfill_and_helper.sql
-- Cycle: XANDEFLIX_PREBUILT_C11_CUSTOMER_ACCOUNTS_PHASE_AB_IMPLEMENTATION
-- Phase: PHASE B — Deterministic Backfill & Hardened Compatibility Helper
--
-- Master Architectural Decision:
-- Deterministic 1:1 migration of existing 17 customer_profiles to customer_accounts
-- preserving identical UUIDs (id = customer_profiles.id).
-- 1:1 mapping of existing customer_profiles to customer_account_users (role = 'PRIMARY').
-- Relink 25 licenses to customer_account_id preserving ownership.
-- 1 unlinked license (customer_id NULL) remains unassigned.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. DETERMINISTIC BACKFILL: customer_profiles -> customer_accounts
-- -----------------------------------------------------------------------------
INSERT INTO public.customer_accounts (
    id,
    display_name,
    status,
    metadata,
    created_at,
    updated_at
)
SELECT
    cp.id,
    cp.nickname AS display_name,
    cp.status,
    jsonb_build_object(
        'legacy_migrated_from', 'customer_profiles',
        'legacy_id', cp.id::text,
        'migrated_at', now()
    ),
    cp.created_at,
    cp.updated_at
FROM public.customer_profiles cp
ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    status = EXCLUDED.status,
    updated_at = EXCLUDED.updated_at;

-- -----------------------------------------------------------------------------
-- 2. DETERMINISTIC BACKFILL: customer_profiles -> customer_account_users (PRIMARY)
-- -----------------------------------------------------------------------------
INSERT INTO public.customer_account_users (
    id,
    customer_account_id,
    user_id,
    role,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    cp.id AS customer_account_id,
    cp.id AS user_id,
    'PRIMARY' AS role,
    'ACTIVE' AS status,
    cp.created_at,
    now() AS updated_at
FROM public.customer_profiles cp
JOIN auth.users au ON au.id = cp.id
ON CONFLICT (customer_account_id, user_id) DO UPDATE SET
    role = 'PRIMARY',
    status = 'ACTIVE',
    updated_at = now();

-- -----------------------------------------------------------------------------
-- 3. DETERMINISTIC BACKFILL: licenses.customer_account_id = licenses.customer_id
-- -----------------------------------------------------------------------------
UPDATE public.licenses l
SET customer_account_id = l.customer_id
WHERE l.customer_id IS NOT NULL
  AND (l.customer_account_id IS NULL OR l.customer_account_id != l.customer_id);

-- -----------------------------------------------------------------------------
-- 4. DETERMINISTIC BACKFILL: DEMAIS TABELAS COM PROVENIÊNCIA
-- -----------------------------------------------------------------------------

-- 4.1 customer_sources
UPDATE public.customer_sources cs
SET customer_account_id = cs.customer_id
WHERE cs.customer_id IS NOT NULL
  AND (cs.customer_account_id IS NULL OR cs.customer_account_id != cs.customer_id);

-- 4.2 device_activation_requests
UPDATE public.device_activation_requests dar
SET customer_account_id = dar.claimed_by_customer_id
WHERE dar.claimed_by_customer_id IS NOT NULL
  AND (dar.customer_account_id IS NULL OR dar.customer_account_id != dar.claimed_by_customer_id);

-- 4.3 device_activation_events
UPDATE public.device_activation_events dae
SET customer_account_id = dae.customer_id
WHERE dae.customer_id IS NOT NULL
  AND (dae.customer_account_id IS NULL OR dae.customer_account_id != dae.customer_id);

-- 4.4 commercial_activation_events
UPDATE public.commercial_activation_events cae
SET customer_account_id = cae.customer_id
WHERE cae.customer_id IS NOT NULL
  AND (cae.customer_account_id IS NULL OR cae.customer_account_id != cae.customer_id);

-- 4.5 device_pairing_requests
UPDATE public.device_pairing_requests dpr
SET customer_account_id = dpr.consumed_by_customer_id
WHERE dpr.consumed_by_customer_id IS NOT NULL
  AND (dpr.customer_account_id IS NULL OR dpr.customer_account_id != dpr.consumed_by_customer_id);

-- -----------------------------------------------------------------------------
-- 5. COMPATIBILITY HELPER: private.resolve_customer_account_for_auth_user
-- -----------------------------------------------------------------------------
-- Requisitos de Segurança e Resolução:
-- - p_user_id IS NULL -> retorna NULL
-- - 0 vínculo ativo PRIMARY -> retorna NULL (condição explícita de sem-conta)
-- - 1 vínculo ativo PRIMARY -> retorna o customer_account_id correspondente
-- - >1 vínculos ativos PRIMARY -> falha fechada (RAISE EXCEPTION erro de ambiguidade)
-- - Papeis MEMBER/VIEWER não sobressaem sobre PRIMARY
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.resolve_customer_account_for_auth_user(p_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
    v_count INTEGER;
    v_account_id UUID;
BEGIN
    IF p_user_id IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT count(*)
    INTO v_count
    FROM public.customer_account_users
    WHERE user_id = p_user_id
      AND status = 'ACTIVE'
      AND role = 'PRIMARY';

    IF v_count = 0 THEN
        -- Condição explícita: nenhum customer_account associado
        RETURN NULL;
    ELSIF v_count = 1 THEN
        SELECT customer_account_id
        INTO v_account_id
        FROM public.customer_account_users
        WHERE user_id = p_user_id
          AND status = 'ACTIVE'
          AND role = 'PRIMARY'
        LIMIT 1;

        RETURN v_account_id;
    ELSE
        -- Ambiguidade de múltiplos vínculos PRIMARY ativos: fail-closed
        RAISE EXCEPTION 'AMBIGUOUS_PRIMARY_CUSTOMER_ACCOUNT: user % is mapped to % active primary customer accounts',
            p_user_id, v_count
            USING ERRCODE = '23505';
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION private.resolve_customer_account_for_auth_user(UUID) TO authenticated, service_role;
