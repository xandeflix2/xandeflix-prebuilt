-- =============================================================================
-- Xandeflix Prebuilt — C11-P4 Customer Device Listing RPC (Read-Model Fix)
-- Migration: 20260919083000_c11_p4_customer_list_devices_rpc.sql
--
-- Princípios:
-- - SECURITY_FIRST: Evita conceder SELECT direto e amplo na tabela public.license_devices.
-- - CUSTOMER_SCOPED: auth.uid() obrigatório; retorna exclusivamente os dispositivos
--   pertencentes às licenças do cliente autenticado.
-- - NO_SECRETS_EXPOSED: Zero tokens brutos, zero hashes de token, zero capabilities
--   de pareamento e zero credenciais de fontes expostas.
-- - FAIL_CLOSED: Rejeita requisições não autenticadas ou de clientes inativos.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.rpc_customer_list_devices()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
DECLARE
    v_customer_id UUID;
    v_customer RECORD;
    v_devices JSONB;
BEGIN
    -- 1. Exige autenticação de cliente
    v_customer_id := auth.uid();
    IF v_customer_id IS NULL THEN
        RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = '42501';
    END IF;

    -- 2. Valida existência e status ativo do perfil do cliente
    SELECT * INTO v_customer
    FROM public.customer_profiles
    WHERE id = v_customer_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'CUSTOMER_PROFILE_NOT_FOUND' USING ERRCODE = '42501';
    END IF;

    IF v_customer.status <> 'ACTIVE' THEN
        RAISE EXCEPTION 'CUSTOMER_PROFILE_NOT_ACTIVE' USING ERRCODE = '42501';
    END IF;

    -- 3. Agrega exclusivamente os dispositivos vinculados a licenças deste cliente
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'deviceId', d.device_id,
        'displayCode', d.display_code,
        'deviceLabel', COALESCE(d.device_label, 'Dispositivo'),
        'deviceType', COALESCE(d.device_type, 'TV'),
        'status', d.status,
        'boundAt', ld.bound_at,
        'lastSeenAt', d.last_seen_at,
        'licenseId', ld.license_id
    ) ORDER BY ld.bound_at DESC), '[]'::JSONB)
    INTO v_devices
    FROM public.license_devices ld
    JOIN public.licenses l ON l.id = ld.license_id
    JOIN public.devices d ON d.device_id = ld.device_id
    WHERE l.customer_id = v_customer_id
      AND ld.status = 'ACTIVE';

    RETURN v_devices;
END;
$$;

-- Permissões rigorosas
REVOKE ALL ON FUNCTION public.rpc_customer_list_devices() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_customer_list_devices() TO authenticated;
