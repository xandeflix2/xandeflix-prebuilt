-- =============================================================================
-- Xandeflix Prebuilt — R2C Remote Source Authority
--
-- Migration aditiva. Não contém catálogo, playlist, stream ou SearchIndex.
-- O payload sensível permanece cifrado; a RPC expõe somente metadata da
-- ManagedSource e o envelope protegido necessário ao runtime autorizado.
-- =============================================================================

ALTER TABLE public.managed_sources
    ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'managed_sources_version_positive'
          AND conrelid = 'public.managed_sources'::regclass
    ) THEN
        ALTER TABLE public.managed_sources
            ADD CONSTRAINT managed_sources_version_positive CHECK (version >= 1);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'managed_sources_status_valid'
          AND conrelid = 'public.managed_sources'::regclass
    ) THEN
        ALTER TABLE public.managed_sources
            ADD CONSTRAINT managed_sources_status_valid CHECK (status IN ('ACTIVE', 'DISABLED'));
    END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_managed_sources_status ON public.managed_sources(status);

-- Atualizações autorizadas do payload mantêm a mesma entidade e avançam sua
-- versão. Mudanças exclusivamente operacionais de status não alteram o payload.
CREATE OR REPLACE FUNCTION public.bump_managed_source_version()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD.encrypted_payload IS DISTINCT FROM NEW.encrypted_payload
       OR OLD.iv IS DISTINCT FROM NEW.iv
       OR OLD.auth_tag IS DISTINCT FROM NEW.auth_tag
       OR OLD.source_type IS DISTINCT FROM NEW.source_type
       OR OLD.name IS DISTINCT FROM NEW.name THEN
        NEW.version := OLD.version + 1;
    ELSE
        NEW.version := OLD.version;
    END IF;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_managed_source_version ON public.managed_sources;
CREATE TRIGGER trg_managed_source_version
BEFORE UPDATE ON public.managed_sources
FOR EACH ROW
EXECUTE FUNCTION public.bump_managed_source_version();

-- Resolve somente device autorizado + licença ativa + binding válido + source ativa.
-- O resultado protegido não é plaintext: encrypted_payload/iv/auth_tag continuam
-- sujeitos ao unsealer seguro do cliente/runtime.
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
            'sourceId', v_source.id,
            'sourceVersion', v_source.version,
            'protocol', v_source.source_type,
            'sourceStatus', v_source.status
        );
    END IF;

    RETURN jsonb_build_object(
        'status', 'SOURCE_READY',
        'mode', 'MANAGED',
        'sourceId', v_source.id,
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
