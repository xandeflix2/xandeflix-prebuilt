-- =============================================================================
-- Migration: 20260925140000_c11_customer_accounts_schema_and_rls.sql
-- Cycle: XANDEFLIX_PREBUILT_C11_CUSTOMER_ACCOUNTS_PHASE_AB_IMPLEMENTATION
-- Phase: PHASE A — Commercial Customer Schema, RLS & Transitional Ownership Columns
--
-- Master Architectural Decision:
-- COMMERCIAL CUSTOMER != AUTH USER
--
-- Entities created:
-- 1. public.customer_accounts (Canonical independent commercial identity)
-- 2. public.customer_account_users (Optional associative mapping to auth.users)
--
-- Transitional Columns added (NULLABLE, no legacy columns removed):
-- 1. licenses.customer_account_id -> customer_accounts(id) ON DELETE SET NULL
-- 2. customer_sources.customer_account_id -> customer_accounts(id) ON DELETE SET NULL
-- 3. device_activation_requests.customer_account_id -> customer_accounts(id) ON DELETE SET NULL
-- 4. device_activation_events.customer_account_id -> customer_accounts(id) ON DELETE SET NULL
-- 5. commercial_activation_events.customer_account_id -> customer_accounts(id) ON DELETE SET NULL
-- 6. device_pairing_requests.customer_account_id -> customer_accounts(id) ON DELETE SET NULL
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. TABELA CANÔNICA DE CONTAS DE CLIENTES COMERCIAIS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customer_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_name VARCHAR(150) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'BLOCKED', 'CANCELLED', 'PENDING')),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices de consulta e status
CREATE INDEX IF NOT EXISTS idx_customer_accounts_status 
    ON public.customer_accounts (status);

CREATE INDEX IF NOT EXISTS idx_customer_accounts_display_name 
    ON public.customer_accounts (display_name);

CREATE INDEX IF NOT EXISTS idx_customer_accounts_created_at 
    ON public.customer_accounts (created_at DESC);

-- -----------------------------------------------------------------------------
-- 2. TABELA ASSOCIATIVA DE VÍNCULO COM USUÁRIOS AUTH (OPCIONAL)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customer_account_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_account_id UUID NOT NULL REFERENCES public.customer_accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(32) NOT NULL DEFAULT 'PRIMARY' CHECK (role IN ('PRIMARY', 'OWNER', 'MEMBER', 'VIEWER')),
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'INACTIVE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unicidade do vínculo por par (conta, usuário auth)
CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_account_users_account_user 
    ON public.customer_account_users (customer_account_id, user_id);

-- Índices para resolução rápida de conta a partir de auth.uid()
CREATE INDEX IF NOT EXISTS idx_customer_account_users_user_id 
    ON public.customer_account_users (user_id, status);

CREATE INDEX IF NOT EXISTS idx_customer_account_users_account_id 
    ON public.customer_account_users (customer_account_id);

CREATE INDEX IF NOT EXISTS idx_customer_account_users_role 
    ON public.customer_account_users (role);

-- -----------------------------------------------------------------------------
-- 3. SECURITY HARDENING & ROW LEVEL SECURITY (RLS)
-- -----------------------------------------------------------------------------
ALTER TABLE public.customer_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_account_users ENABLE ROW LEVEL SECURITY;

-- Postura padrão: Revoga todos os privilégios diretos de PUBLIC, anon e authenticated
REVOKE ALL ON TABLE public.customer_accounts FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.customer_account_users FROM PUBLIC, anon, authenticated;

-- Permite apenas SELECT aos usuários authenticated (zero mutação direta)
GRANT SELECT ON TABLE public.customer_accounts TO authenticated;
GRANT SELECT ON TABLE public.customer_account_users TO authenticated;

-- service_role retém privilégios administrativos para Edge Functions e RPCs
GRANT ALL ON TABLE public.customer_accounts TO service_role;
GRANT ALL ON TABLE public.customer_account_users TO service_role;

-- RLS Policy: Usuário autenticado consulta apenas os seus próprios vínculos
DROP POLICY IF EXISTS customer_account_users_select_own ON public.customer_account_users;
CREATE POLICY customer_account_users_select_own
    ON public.customer_account_users
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- RLS Policy: Usuário autenticado consulta apenas contas comerciais onde tem vínculo ativo
DROP POLICY IF EXISTS customer_accounts_select_associated ON public.customer_accounts;
CREATE POLICY customer_accounts_select_associated
    ON public.customer_accounts
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 
            FROM public.customer_account_users cau 
            WHERE cau.customer_account_id = public.customer_accounts.id 
              AND cau.user_id = auth.uid()
              AND cau.status = 'ACTIVE'
        )
    );

-- Nota de Segurança Canônica:
-- AUTHENTICATED_DIRECT_INSERT_CUSTOMER_ACCOUNTS = NAO
-- AUTHENTICATED_DIRECT_UPDATE_CUSTOMER_ACCOUNTS = NAO
-- AUTHENTICATED_DIRECT_DELETE_CUSTOMER_ACCOUNTS = NAO
-- AUTHENTICATED_DIRECT_MUTATE_ACCOUNT_USERS = NAO
-- Toda mutação deve ser efetuada via RPC SECURITY DEFINER ou service_role.

-- -----------------------------------------------------------------------------
-- 4. COLUNAS TRANSICIONAIS DE PROPRIEDADE COMERCIAL (NULLABLE, FK SET NULL)
-- -----------------------------------------------------------------------------

-- 4.1 licenses: adiciona customer_account_id preservando customer_id legada
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'licenses' AND column_name = 'customer_account_id'
    ) THEN
        ALTER TABLE public.licenses
            ADD COLUMN customer_account_id UUID REFERENCES public.customer_accounts(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_licenses_customer_account_id 
            ON public.licenses (customer_account_id);
    END IF;
END $$;

-- 4.2 customer_sources: adiciona customer_account_id preservando customer_id legada
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'customer_sources' AND column_name = 'customer_account_id'
    ) THEN
        ALTER TABLE public.customer_sources
            ADD COLUMN customer_account_id UUID REFERENCES public.customer_accounts(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_customer_sources_customer_account_id 
            ON public.customer_sources (customer_account_id);
    END IF;
END $$;

-- 4.3 device_activation_requests: adiciona customer_account_id preservando claimed_by_customer_id legada
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'device_activation_requests' AND column_name = 'customer_account_id'
    ) THEN
        ALTER TABLE public.device_activation_requests
            ADD COLUMN customer_account_id UUID REFERENCES public.customer_accounts(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_device_activation_requests_customer_account_id 
            ON public.device_activation_requests (customer_account_id);
    END IF;
END $$;

-- 4.4 device_activation_events: adiciona customer_account_id preservando customer_id legada
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'device_activation_events' AND column_name = 'customer_account_id'
    ) THEN
        ALTER TABLE public.device_activation_events
            ADD COLUMN customer_account_id UUID REFERENCES public.customer_accounts(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_device_activation_events_customer_account_id 
            ON public.device_activation_events (customer_account_id);
    END IF;
END $$;

-- 4.5 commercial_activation_events: adiciona customer_account_id preservando customer_id legada
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'commercial_activation_events' AND column_name = 'customer_account_id'
    ) THEN
        ALTER TABLE public.commercial_activation_events
            ADD COLUMN customer_account_id UUID REFERENCES public.customer_accounts(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_commercial_activation_events_customer_account_id 
            ON public.commercial_activation_events (customer_account_id);
    END IF;
END $$;

-- 4.6 device_pairing_requests: adiciona customer_account_id preservando consumed_by_customer_id legada
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'device_pairing_requests' AND column_name = 'customer_account_id'
    ) THEN
        ALTER TABLE public.device_pairing_requests
            ADD COLUMN customer_account_id UUID REFERENCES public.customer_accounts(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_device_pairing_requests_customer_account_id 
            ON public.device_pairing_requests (customer_account_id);
    END IF;
END $$;
