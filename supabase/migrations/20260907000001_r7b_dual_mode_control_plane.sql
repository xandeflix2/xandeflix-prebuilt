-- =============================================================================
-- Xandeflix Prebuilt — Dual-Mode Control Plane Schema (Experiment R7B)
--
-- Migration canônica para o banco do Plano de Controle do laboratório PREBUILT.
--
-- Princípios:
-- - CONTROL_PLANE_ONLY: Armazena apenas entitlements, slots, hashes e fontes gerenciadas cifradas.
-- - ZERO_CATALOG_DATA: Proibido tabelas de canais, filmes, séries, streams ou SearchIndex.
-- - NO_PLAINTEXT_SECRETS: license_key_hash e device_token_hash usam SHA-256.
-- - MANAGED_SOURCE_CIPHERTEXT: managed_sources armazena encrypted_payload (AES-256-GCM).
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. TABELA DE LICENÇAS (licenses)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.licenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    license_key_hash VARCHAR(64) NOT NULL UNIQUE,
    mode VARCHAR(20) NOT NULL CHECK (mode IN ('SELF_SERVICE', 'MANAGED')),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'REVOKED', 'EXPIRED')),
    max_devices INTEGER NOT NULL DEFAULT 1 CHECK (max_devices >= 1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    CONSTRAINT chk_self_service_single_device CHECK (
        (mode = 'SELF_SERVICE' AND max_devices = 1) OR (mode = 'MANAGED')
    )
);

CREATE INDEX IF NOT EXISTS idx_licenses_key_hash ON public.licenses(license_key_hash);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON public.licenses(status);

-- -----------------------------------------------------------------------------
-- 2. TABELA DE DISPOSITIVOS (devices)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(64) NOT NULL UNIQUE,
    display_code VARCHAR(32) NOT NULL,
    device_type VARCHAR(20) NOT NULL DEFAULT 'TV' CHECK (device_type IN ('TV', 'PHONE', 'TABLET', 'PC', 'OTHER')),
    device_label VARCHAR(100) NOT NULL DEFAULT 'DISPOSITIVO',
    status VARCHAR(30) NOT NULL DEFAULT 'UNREGISTERED' CHECK (status IN ('UNREGISTERED', 'PENDING_MANAGER_APPROVAL', 'AUTHORIZED', 'REVOKED')),
    device_token_hash VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_devices_device_id ON public.devices(device_id);
CREATE INDEX IF NOT EXISTS idx_devices_display_code ON public.devices(display_code);
CREATE INDEX IF NOT EXISTS idx_devices_status ON public.devices(status);

-- -----------------------------------------------------------------------------
-- 3. ASSOCIAÇÃO DISPOSITIVO-LICENÇA (license_devices)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.license_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    license_id UUID NOT NULL REFERENCES public.licenses(id) ON DELETE CASCADE,
    device_id VARCHAR(64) NOT NULL REFERENCES public.devices(device_id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'REVOKED')),
    bound_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    CONSTRAINT uq_license_device UNIQUE (license_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_license_devices_license_id ON public.license_devices(license_id);
CREATE INDEX IF NOT EXISTS idx_license_devices_device_id ON public.license_devices(device_id);
CREATE INDEX IF NOT EXISTS idx_license_devices_status ON public.license_devices(status);

-- -----------------------------------------------------------------------------
-- 4. FONTES GERENCIADAS CIFRADAS (managed_sources)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.managed_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    source_type VARCHAR(20) NOT NULL CHECK (source_type IN ('XTREAM', 'M3U')),
    encrypted_payload TEXT NOT NULL, -- Ciphertext em hexadecimal (AES-256-GCM)
    iv VARCHAR(32) NOT NULL,
    auth_tag VARCHAR(32) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 5. BINDING FONTE GERENCIADA - DISPOSITIVO (device_source_bindings)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.device_source_bindings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    license_id UUID NOT NULL REFERENCES public.licenses(id) ON DELETE CASCADE,
    device_id VARCHAR(64) NOT NULL REFERENCES public.devices(device_id) ON DELETE CASCADE,
    source_id UUID NOT NULL REFERENCES public.managed_sources(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_device_source_binding UNIQUE (device_id)
);

CREATE INDEX IF NOT EXISTS idx_dsb_license_id ON public.device_source_bindings(license_id);
CREATE INDEX IF NOT EXISTS idx_dsb_device_id ON public.device_source_bindings(device_id);

-- -----------------------------------------------------------------------------
-- 6. CONFIGURAÇÕES DO PLANO DE CONTROLE (control_plane_settings)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.control_plane_settings (
    key VARCHAR(50) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Carga inicial de configuração de suporte ao gestor
INSERT INTO public.control_plane_settings (key, value, description)
VALUES 
    ('support_contact_type', 'WHATSAPP', 'Canal de atendimento com gestor'),
    ('support_contact_label', 'Falar com Gestor de Licenças', 'Rótulo exibido no app'),
    ('support_contact_value', '+55 11 99999-9999', 'Contato do gestor')
ON CONFLICT (key) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 7. FUNÇÃO ATÔMICA DE ATIVAÇÃO DE DISPOSITIVO (rpc_activate_device)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_activate_device(
    p_license_key_hash VARCHAR(64),
    p_device_id VARCHAR(64),
    p_display_code VARCHAR(32),
    p_device_type VARCHAR(20),
    p_device_label VARCHAR(100),
    p_device_token_hash VARCHAR(64)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_license RECORD;
    v_active_count INTEGER;
    v_existing_binding RECORD;
    v_device RECORD;
BEGIN
    -- 1. Localiza a licença ativa
    SELECT * INTO v_license FROM public.licenses
    WHERE license_key_hash = p_license_key_hash AND status = 'ACTIVE'
    FOR UPDATE; -- Bloqueio pessimista para prevenir race condition de ativações concorrentes

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'status', 'LICENSE_INVALID', 'message', 'Licença inexistente ou inativa.');
    END IF;

    IF v_license.expires_at IS NOT NULL AND v_license.expires_at < NOW() THEN
        RETURN jsonb_build_object('success', false, 'status', 'LICENSE_EXPIRED', 'message', 'Licença expirada.');
    END IF;

    -- 2. Upsert do registro do dispositivo
    INSERT INTO public.devices (device_id, display_code, device_type, device_label, status, device_token_hash, last_seen_at)
    VALUES (p_device_id, p_display_code, p_device_type, p_device_label, 'UNREGISTERED', p_device_token_hash, NOW())
    ON CONFLICT (device_id) DO UPDATE
    SET display_code = EXCLUDED.display_code,
        device_label = EXCLUDED.device_label,
        device_token_hash = EXCLUDED.device_token_hash,
        last_seen_at = NOW()
    RETURNING * INTO v_device;

    IF v_device.status = 'REVOKED' THEN
        RETURN jsonb_build_object('success', false, 'status', 'DEVICE_REVOKED', 'message', 'Dispositivo revogado.');
    END IF;

    -- 3. Verifica bindings ativos desta licença
    SELECT COUNT(*) INTO v_active_count
    FROM public.license_devices
    WHERE license_id = v_license.id AND status = 'ACTIVE';

    SELECT * INTO v_existing_binding
    FROM public.license_devices
    WHERE license_id = v_license.id AND device_id = p_device_id AND status = 'ACTIVE';

    -- 4. Regras para SELF_SERVICE (max_devices = 1 estrito)
    IF v_license.mode = 'SELF_SERVICE' THEN
        IF v_active_count >= 1 AND v_existing_binding IS NULL THEN
            RETURN jsonb_build_object(
                'success', false,
                'status', 'LICENSE_ALREADY_BOUND',
                'mode', 'SELF_SERVICE',
                'message', 'Esta licença já está vinculada a outro dispositivo.'
            );
        END IF;

        -- Bind atômico
        INSERT INTO public.license_devices (license_id, device_id, status)
        VALUES (v_license.id, p_device_id, 'ACTIVE')
        ON CONFLICT (license_id, device_id) DO UPDATE SET status = 'ACTIVE';

        UPDATE public.devices SET status = 'AUTHORIZED' WHERE device_id = p_device_id;

        RETURN jsonb_build_object(
            'success', true,
            'status', 'AUTHORIZED',
            'mode', 'SELF_SERVICE'
        );
    END IF;

    -- 5. Regras para MANAGED (max_devices = N com aprovação manual)
    IF v_license.mode = 'MANAGED' THEN
        IF v_active_count >= v_license.max_devices AND v_existing_binding IS NULL THEN
            RETURN jsonb_build_object(
                'success', false,
                'status', 'DEVICE_LIMIT_REACHED',
                'mode', 'MANAGED',
                'message', 'Limite de slots atingido para esta licença.'
            );
        END IF;

        -- Registra com status pendente de aprovação
        INSERT INTO public.license_devices (license_id, device_id, status)
        VALUES (v_license.id, p_device_id, 'ACTIVE')
        ON CONFLICT (license_id, device_id) DO NOTHING;

        UPDATE public.devices SET status = 'PENDING_MANAGER_APPROVAL' WHERE device_id = p_device_id;

        RETURN jsonb_build_object(
            'success', true,
            'status', 'PENDING_MANAGER_APPROVAL',
            'mode', 'MANAGED',
            'message', 'Dispositivo aguardando aprovação do gestor.'
        );
    END IF;

    RETURN jsonb_build_object('success', false, 'status', 'LICENSE_INVALID');
END;
$$;
