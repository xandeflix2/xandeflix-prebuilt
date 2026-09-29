-- =============================================================================
-- Xandeflix Prebuilt - R2D-A1 Remote Source Identity Compatibility
--
-- Migration aditiva e local-only neste ciclo. O UUID interno de
-- managed_sources.id e o FK UUID de device_source_bindings.source_id permanecem
-- inalterados. source_id e a identidade logica canonica (ex.: src_uhwh5cio).
--
-- A migration falha fechada se encontrar linhas existentes sem identidade
-- canonica. Nenhum ID e inventado a partir de host, URL ou outro campo sensivel.
-- =============================================================================

ALTER TABLE public.managed_sources
    ADD COLUMN IF NOT EXISTS source_id TEXT;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM public.managed_sources
        WHERE source_id IS NULL
    ) THEN
        RAISE EXCEPTION 'R2D_A1_CANONICAL_SOURCE_ID_BACKFILL_REQUIRED';
    END IF;
END;
$$;

ALTER TABLE public.managed_sources
    ALTER COLUMN source_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_managed_sources_source_id
    ON public.managed_sources(source_id);

-- Resolve por PK UUID internamente, mas expoe somente o ID canonico estavel.
-- O envelope protegido continua cifrado e nao e convertido em plaintext nesta
-- camada.
CREATE OR REPLACE FUNCTION public.rpc_resolve_authorized_source(
    p_device_id VARCHAR(64),
    p_device_token_hash VARCHAR(64)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_device RECORD;
    v_license RECORD;
    v_binding RECORD;
    v_source RECORD;
BEGIN
    SELECT * INTO v_device
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

    SELECT l.* INTO v_license
    FROM public.license_devices ld
    JOIN public.licenses l ON l.id = ld.license_id
    WHERE ld.device_id = p_device_id
      AND ld.status = 'ACTIVE'
      AND l.status = 'ACTIVE'
      AND (l.expires_at IS NULL OR l.expires_at >= NOW())
    ORDER BY ld.bound_at DESC
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('status', 'LICENSE_INVALID');
    END IF;

    IF v_license.mode = 'SELF_SERVICE' THEN
        RETURN jsonb_build_object(
            'status', 'SOURCE_READY',
            'mode', 'SELF_SERVICE'
        );
    END IF;

    SELECT dsb.* INTO v_binding
    FROM public.device_source_bindings dsb
    WHERE dsb.device_id = p_device_id
      AND dsb.license_id = v_license.id
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'status', 'SOURCE_NOT_BOUND',
            'mode', 'MANAGED'
        );
    END IF;

    SELECT * INTO v_source
    FROM public.managed_sources
    WHERE id = v_binding.source_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'status', 'SOURCE_NOT_BOUND',
            'mode', 'MANAGED'
        );
    END IF;

    IF v_source.status <> 'ACTIVE' THEN
        RETURN jsonb_build_object(
            'status', 'SOURCE_NOT_BOUND',
            'mode', 'MANAGED',
            'sourceId', v_source.source_id,
            'sourceVersion', v_source.version,
            'protocol', v_source.source_type,
            'sourceStatus', v_source.status
        );
    END IF;

    RETURN jsonb_build_object(
        'status', 'SOURCE_READY',
        'mode', 'MANAGED',
        'sourceId', v_source.source_id,
        'sourceVersion', v_source.version,
        'protocol', v_source.source_type,
        'sourceStatus', v_source.status,
        'protectedConfig', jsonb_build_object(
            'encryptedPayload', v_source.encrypted_payload,
            'iv', v_source.iv,
            'authTag', v_source.auth_tag
        )
    );
END;
$$;
