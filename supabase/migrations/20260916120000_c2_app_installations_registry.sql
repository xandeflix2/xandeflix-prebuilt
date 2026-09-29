-- =============================================================================
-- Xandeflix Prebuilt — C2 Installation Registry Schema & RPCs
--
-- Migration canônica local para registro operacional de instalações de aplicativo.
--
-- Princípios:
-- - INSTALLATION_NOT_AUTHORIZED_DEVICE: Instalação é descoberta/inventário, não autorização.
-- - ZERO_SECRETS: Nenhuma credencial, token ou chave transita ou é armazenada nesta tabela.
-- - SERVER_TIMESTAMPS: first_seen_at e last_seen_at são fixados exclusivamente pelo servidor.
-- - SECURITY_DEFINER: RPCs sanitizadas com RLS estrito e REVOKE total em public.app_installations.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. TABELA DE INSTALAÇÕES (public.app_installations)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.app_installations (
    installation_id UUID PRIMARY KEY,
    device_id VARCHAR(64) NOT NULL,
    display_code VARCHAR(32) NOT NULL,
    package_name VARCHAR(100) NOT NULL CHECK (package_name = 'com.xandeflix.prebuilt'),
    platform VARCHAR(20) NOT NULL DEFAULT 'ANDROID' CHECK (platform IN ('ANDROID', 'WEB', 'IOS', 'OTHER')),
    device_type VARCHAR(20) NOT NULL DEFAULT 'TV' CHECK (device_type IN ('TV', 'PHONE', 'TABLET', 'PC', 'OTHER')),
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    app_version VARCHAR(50) NOT NULL,
    build_number VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'OBSERVED' CHECK (status IN ('OBSERVED', 'PAIRED', 'STALE')),
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_installations_device_id ON public.app_installations(device_id);
CREATE INDEX IF NOT EXISTS idx_app_installations_display_code ON public.app_installations(display_code);
CREATE INDEX IF NOT EXISTS idx_app_installations_status ON public.app_installations(status);
CREATE INDEX IF NOT EXISTS idx_app_installations_last_seen ON public.app_installations(last_seen_at DESC);

-- -----------------------------------------------------------------------------
-- 2. SEGURANÇA E RESTRIÇÃO DE ACESSO (RLS)
-- -----------------------------------------------------------------------------
ALTER TABLE public.app_installations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.app_installations FROM PUBLIC, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 3. RPC PÚBLICA DE REGISTRO / HEARTBEAT DE BOOT (rpc_report_app_installation)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_report_app_installation(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
DECLARE
    v_installation_id_raw TEXT;
    v_installation_id UUID;
    v_device_id TEXT;
    v_display_code TEXT;
    v_package_name TEXT;
    v_platform TEXT;
    v_device_type TEXT;
    v_manufacturer TEXT;
    v_model TEXT;
    v_app_version TEXT;
    v_build_number TEXT;
    v_first_seen_at TIMESTAMPTZ;
    v_last_seen_at TIMESTAMPTZ;
    v_status TEXT;
BEGIN
    -- Validação 1: Objeto JSON válido
    IF p_payload IS NULL OR jsonb_typeof(p_payload) <> 'object' THEN
        RAISE EXCEPTION 'INVALID_PAYLOAD_OBJECT' USING ERRCODE = '22023';
    END IF;

    -- Validação 2: Limite estrito de tamanho do payload (anti-spam / anti-bloat)
    IF octet_length(p_payload::text) > 4096 THEN
        RAISE EXCEPTION 'PAYLOAD_OVERSIZED' USING ERRCODE = '22023';
    END IF;

    -- Validação 3: Rejeição expressa de segredos ou campos perigosos/não autorizados
    IF p_payload ? 'deviceAuthToken' OR
       p_payload ? 'token' OR
       p_payload ? 'deviceTokenHash' OR
       p_payload ? 'tokenHash' OR
       p_payload ? 'licenseKey' OR
       p_payload ? 'licenseKeyHash' OR
       p_payload ? 'sourceId' OR
       p_payload ? 'sourceUrl' OR
       p_payload ? 'playlistUrl' OR
       p_payload ? 'username' OR
       p_payload ? 'password' OR
       p_payload ? 'secret' OR
       p_payload ? 'mac' OR
       p_payload ? 'imei' THEN
        RAISE EXCEPTION 'SENSITIVE_PAYLOAD_REJECTED' USING ERRCODE = '22023';
    END IF;

    -- Validação 4: installationId (UUID v4 válido)
    v_installation_id_raw := trim(COALESCE(p_payload->>'installationId', ''));
    IF v_installation_id_raw !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        RAISE EXCEPTION 'INVALID_INSTALLATION_ID' USING ERRCODE = '22023';
    END IF;
    v_installation_id := v_installation_id_raw::UUID;

    -- Validação 5: deviceId (alfanumérico/hífens até 64 caracteres)
    v_device_id := trim(COALESCE(p_payload->>'deviceId', ''));
    IF length(v_device_id) < 1 OR length(v_device_id) > 64 OR v_device_id !~ '^[a-zA-Z0-9_-]+$' THEN
        RAISE EXCEPTION 'INVALID_DEVICE_ID' USING ERRCODE = '22023';
    END IF;

    -- Validação 6: displayCode (formato estrito XF-XXXX-XXXX)
    v_display_code := trim(COALESCE(p_payload->>'displayCode', ''));
    IF v_display_code !~ '^XF-[A-Z0-9]{4}-[A-Z0-9]{4}$' THEN
        RAISE EXCEPTION 'INVALID_DISPLAY_CODE' USING ERRCODE = '22023';
    END IF;

    -- Validação 7: Package Allowlist (apenas o pacote canônico com.xandeflix.prebuilt é aceito)
    v_package_name := trim(COALESCE(p_payload->>'packageName', ''));
    IF v_package_name <> 'com.xandeflix.prebuilt' THEN
        RAISE EXCEPTION 'UNAUTHORIZED_PACKAGE_NAME' USING ERRCODE = '22023';
    END IF;

    -- Validação 8: Platform Enum
    v_platform := UPPER(trim(COALESCE(p_payload->>'platform', 'ANDROID')));
    IF v_platform NOT IN ('ANDROID', 'WEB', 'IOS', 'OTHER') THEN
        RAISE EXCEPTION 'INVALID_PLATFORM' USING ERRCODE = '22023';
    END IF;

    -- Validação 9: Device Type Enum
    v_device_type := UPPER(trim(COALESCE(p_payload->>'deviceType', 'TV')));
    IF v_device_type NOT IN ('TV', 'PHONE', 'TABLET', 'PC', 'OTHER') THEN
        RAISE EXCEPTION 'INVALID_DEVICE_TYPE' USING ERRCODE = '22023';
    END IF;

    -- Sanitização de strings opcionais
    v_manufacturer := NULLIF(substring(trim(COALESCE(p_payload->>'manufacturer', '')) from 1 for 100), '');
    v_model := NULLIF(substring(trim(COALESCE(p_payload->>'model', '')) from 1 for 100), '');

    -- Validação 10: App Version (obrigatória)
    v_app_version := trim(COALESCE(p_payload->>'appVersion', ''));
    IF length(v_app_version) < 1 OR length(v_app_version) > 50 THEN
        RAISE EXCEPTION 'INVALID_APP_VERSION' USING ERRCODE = '22023';
    END IF;

    v_build_number := NULLIF(substring(trim(COALESCE(p_payload->>'buildNumber', '')) from 1 for 50), '');

    -- Upsert Idempotente: preserva first_seen_at e created_at na atualização
    INSERT INTO public.app_installations (
        installation_id,
        device_id,
        display_code,
        package_name,
        platform,
        device_type,
        manufacturer,
        model,
        app_version,
        build_number,
        status,
        first_seen_at,
        last_seen_at,
        created_at,
        updated_at
    ) VALUES (
        v_installation_id,
        v_device_id,
        v_display_code,
        v_package_name,
        v_platform,
        v_device_type,
        v_manufacturer,
        v_model,
        v_app_version,
        v_build_number,
        'OBSERVED',
        NOW(),
        NOW(),
        NOW(),
        NOW()
    )
    ON CONFLICT (installation_id) DO UPDATE SET
        device_id = EXCLUDED.device_id,
        display_code = EXCLUDED.display_code,
        package_name = EXCLUDED.package_name,
        platform = EXCLUDED.platform,
        device_type = EXCLUDED.device_type,
        manufacturer = COALESCE(EXCLUDED.manufacturer, public.app_installations.manufacturer),
        model = COALESCE(EXCLUDED.model, public.app_installations.model),
        app_version = EXCLUDED.app_version,
        build_number = COALESCE(EXCLUDED.build_number, public.app_installations.build_number),
        last_seen_at = NOW(),
        updated_at = NOW()
    RETURNING
        first_seen_at,
        last_seen_at,
        status
    INTO
        v_first_seen_at,
        v_last_seen_at,
        v_status;

    RETURN jsonb_build_object(
        'success', true,
        'installationId', v_installation_id,
        'status', v_status,
        'firstSeenAt', v_first_seen_at,
        'lastSeenAt', v_last_seen_at
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_report_app_installation(JSONB) TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- 4. RPC PRIVADA DE LISTAGEM DO GESTOR (rpc_manager_list_installations)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_manager_list_installations()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
DECLARE
    v_result JSONB;
BEGIN
    -- Exige sessão autenticada com papel de gestor ativo (OWNER ou ADMIN)
    PERFORM private.require_active_manager();

    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'installationId', ai.installation_id,
            'deviceId', ai.device_id,
            'displayCode', ai.display_code,
            'packageName', ai.package_name,
            'platform', ai.platform,
            'deviceType', ai.device_type,
            'manufacturer', ai.manufacturer,
            'model', ai.model,
            'appVersion', ai.app_version,
            'buildNumber', ai.build_number,
            'status', ai.status,
            'firstSeenAt', ai.first_seen_at,
            'lastSeenAt', ai.last_seen_at,
            'deviceCorrelation', CASE
                WHEN d.device_id IS NOT NULL THEN
                    jsonb_build_object(
                        'isKnownDevice', true,
                        'deviceStatus', d.status,
                        'deviceLabel', d.device_label,
                        'registeredAt', d.created_at
                    )
                ELSE
                    jsonb_build_object(
                        'isKnownDevice', false,
                        'deviceStatus', 'UNREGISTERED'
                    )
            END
        ) ORDER BY ai.last_seen_at DESC
    ), '[]'::jsonb)
    INTO v_result
    FROM public.app_installations ai
    LEFT JOIN public.devices d ON d.device_id = ai.device_id;

    RETURN v_result;
END;
$$;

-- Restrição estrita de acesso: public e anon proibidos de listar instalações
REVOKE ALL ON FUNCTION public.rpc_manager_list_installations() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_manager_list_installations() TO authenticated;
