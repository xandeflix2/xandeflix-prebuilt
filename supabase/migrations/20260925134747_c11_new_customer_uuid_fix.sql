-- C11: explicit UUID for NEW_CUSTOMER in the manager activation transaction.
-- Function body based on 20260925110000_c11_missing_rpc_claim_device_key_recovery.sql.
CREATE OR REPLACE FUNCTION public.rpc_manager_complete_device_activation(
    p_display_code TEXT,
    p_activation_key_hash TEXT,
    p_license_id UUID DEFAULT NULL,
    p_source_id TEXT DEFAULT NULL,
    p_source_type TEXT DEFAULT NULL,
    p_display_name TEXT DEFAULT NULL,
    p_ciphertext TEXT DEFAULT NULL,
    p_nonce TEXT DEFAULT NULL,
    p_auth_tag TEXT DEFAULT NULL,
    p_key_version TEXT DEFAULT 'v1',
    p_customer_id UUID DEFAULT NULL,
    p_flow_mode TEXT DEFAULT 'NEW_CUSTOMER',
    p_new_customer_name TEXT DEFAULT NULL,
    p_existing_display_code TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, extensions, private
AS $$
DECLARE
    v_pair JSONB;
    v_result JSONB;
    v_device_id VARCHAR(64);
    v_display_code VARCHAR(32);
    v_target_customer_id UUID := p_customer_id;
    v_resolved_license_id UUID := p_license_id;
    v_profile RECORD;
    v_now TIMESTAMPTZ := NOW();
    v_clean_name TEXT;
    v_clean_existing_code TEXT;
    v_existing_device RECORD;
    v_existing_device_binding RECORD;
    v_reused_source RECORD;
    v_sources_count INTEGER;
    v_candidate_license RECORD;
    v_licenses_count INTEGER;
    v_active_devices_count INTEGER;
    v_is_already_bound BOOLEAN;
    v_new_token_hash TEXT;
BEGIN
    -- Valida autorizacao de menor privilegio: permite gestores ativos com role 'OWNER' ou 'ADMIN'
    PERFORM private.require_device_activation_manager();

    -- Validacao do par display_code + activation_key_hash via helper canonico
    v_pair := public.rpc_claim_device_key(p_display_code, p_activation_key_hash);
    IF v_pair IS NULL OR (v_pair->>'valid')::BOOLEAN IS NOT TRUE THEN
        RAISE EXCEPTION 'INVALID_ACTIVATION_KEY' USING ERRCODE = '42501';
    END IF;

    v_device_id := v_pair->>'deviceId';
    v_display_code := v_pair->>'displayCode';

    IF v_device_id IS NULL OR v_display_code IS NULL THEN
        RAISE EXCEPTION 'ACTIVATION_DEVICE_MISMATCH' USING ERRCODE = '42501';
    END IF;

    -- =========================================================================
    -- ROTEAMENTO POR MODO DE FLUXO (CANONICAL TWO-FLOW ARCHITECTURE)
    -- =========================================================================
    IF p_flow_mode = 'EXISTING_CUSTOMER' THEN
        -- ---------------------------------------------------------------------
        -- FLOW B: EXISTING_CUSTOMER (Cliente ja ativo)
        -- ---------------------------------------------------------------------
        IF v_target_customer_id IS NULL THEN
            RAISE EXCEPTION 'CUSTOMER_ID_REQUIRED' USING ERRCODE = '22023';
        END IF;

        v_clean_existing_code := UPPER(TRIM(COALESCE(p_existing_display_code, '')));
        IF v_clean_existing_code = '' THEN
            RAISE EXCEPTION 'EXISTING_DEVICE_CODE_REQUIRED' USING ERRCODE = '22023';
        END IF;

        IF v_clean_existing_code !~ '^XF-[0-9A-Z]{4}-[0-9A-Z]{4}$' THEN
            RAISE EXCEPTION 'DISPLAY_CODE_INVALID' USING ERRCODE = '22023';
        END IF;

        SELECT id, nickname, status
        INTO v_profile
        FROM public.customer_profiles
        WHERE id = v_target_customer_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'CUSTOMER_PROFILE_NOT_FOUND' USING ERRCODE = '42501';
        END IF;

        IF v_profile.status <> 'ACTIVE' THEN
            RAISE EXCEPTION 'CUSTOMER_PROFILE_NOT_ACTIVE' USING ERRCODE = '42501';
        END IF;

        SELECT d.device_id, d.display_code, d.status
        INTO v_existing_device
        FROM public.devices d
        WHERE d.display_code = v_clean_existing_code;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'EXISTING_DEVICE_NOT_FOUND' USING ERRCODE = '42501';
        END IF;

        SELECT ld.license_id, l.customer_id
        INTO v_existing_device_binding
        FROM public.license_devices ld
        JOIN public.licenses l ON l.id = ld.license_id
        WHERE ld.device_id = v_existing_device.device_id
          AND ld.status = 'ACTIVE';

        IF NOT FOUND OR v_existing_device_binding.customer_id <> v_target_customer_id THEN
            RAISE EXCEPTION 'EXISTING_DEVICE_CUSTOMER_MISMATCH' USING ERRCODE = '42501';
        END IF;

        CREATE TEMPORARY TABLE IF NOT EXISTS temp_reusable_sources (
            internal_source_id UUID,
            canonical_source_id TEXT,
            source_type TEXT,
            name TEXT
        ) ON COMMIT DROP;
        DELETE FROM temp_reusable_sources;

        INSERT INTO temp_reusable_sources (internal_source_id, canonical_source_id, source_type, name)
        SELECT DISTINCT ms.id, ms.source_id, ms.source_type, ms.name
        FROM public.device_source_bindings dsb
        JOIN public.managed_sources ms ON ms.id = dsb.source_id
        WHERE ms.status = 'ACTIVE'
          AND (
            dsb.device_id = v_existing_device.device_id
            OR dsb.license_id IN (
                SELECT l.id FROM public.licenses l WHERE l.customer_id = v_target_customer_id
            )
          );

        SELECT COUNT(*) INTO v_sources_count FROM temp_reusable_sources;

        IF v_sources_count = 0 THEN
            RAISE EXCEPTION 'CUSTOMER_HAS_NO_ACTIVE_SOURCE' USING ERRCODE = '42501';
        ELSIF v_sources_count > 1 THEN
            RAISE EXCEPTION 'CUSTOMER_SOURCE_AMBIGUOUS' USING ERRCODE = '42501';
        END IF;

        SELECT * INTO v_reused_source FROM temp_reusable_sources LIMIT 1;

        IF v_resolved_license_id IS NOT NULL THEN
            SELECT *
            INTO v_candidate_license
            FROM public.licenses
            WHERE id = v_resolved_license_id;

            IF NOT FOUND THEN
                RAISE EXCEPTION 'LICENSE_NOT_FOUND' USING ERRCODE = '42501';
            END IF;

            IF v_candidate_license.customer_id <> v_target_customer_id THEN
                RAISE EXCEPTION 'CROSS_CUSTOMER_BINDING_DENIED' USING ERRCODE = '42501';
            END IF;

            IF v_candidate_license.mode <> 'MANAGED' THEN
                RAISE EXCEPTION 'LICENSE_MODE_INVALID' USING ERRCODE = '42501';
            END IF;

            IF v_candidate_license.status NOT IN ('ACTIVE', 'TRIAL') THEN
                RAISE EXCEPTION 'LICENSE_STATUS_INELIGIBLE' USING ERRCODE = '42501';
            END IF;
        ELSE
            CREATE TEMPORARY TABLE IF NOT EXISTS temp_candidate_licenses (
                id UUID,
                customer_id UUID,
                mode TEXT,
                status TEXT,
                max_devices INTEGER,
                created_at TIMESTAMPTZ
            ) ON COMMIT DROP;
            DELETE FROM temp_candidate_licenses;

            INSERT INTO temp_candidate_licenses (id, customer_id, mode, status, max_devices, created_at)
            SELECT id, customer_id, mode, status, max_devices, created_at
            FROM public.licenses
            WHERE customer_id = v_target_customer_id
              AND mode = 'MANAGED'
              AND status IN ('ACTIVE', 'TRIAL')
              AND (expires_at IS NULL OR expires_at > v_now)
              AND (trial_expires_at IS NULL OR trial_expires_at > v_now);

            SELECT COUNT(*) INTO v_licenses_count FROM temp_candidate_licenses;

            IF v_licenses_count = 0 THEN
                RAISE EXCEPTION 'NO_ELIGIBLE_MANAGED_LICENSE' USING ERRCODE = '42501';
            ELSIF v_licenses_count > 1 THEN
                RAISE EXCEPTION 'MANAGED_LICENSE_AMBIGUOUS' USING ERRCODE = '42501';
            END IF;

            SELECT *
            INTO v_candidate_license
            FROM temp_candidate_licenses
            ORDER BY created_at ASC
            LIMIT 1;

            v_resolved_license_id := v_candidate_license.id;
        END IF;

        SELECT COUNT(*)
        INTO v_active_devices_count
        FROM public.license_devices
        WHERE license_id = v_candidate_license.id
          AND status = 'ACTIVE'
          AND device_id <> v_device_id;

        SELECT EXISTS (
            SELECT 1
            FROM public.license_devices
            WHERE license_id = v_candidate_license.id
              AND device_id = v_device_id
              AND status = 'ACTIVE'
        ) INTO v_is_already_bound;

        IF v_active_devices_count >= v_candidate_license.max_devices AND NOT v_is_already_bound THEN
            RAISE EXCEPTION 'MANAGED_LICENSE_CAPACITY_EXHAUSTED' USING ERRCODE = '42501';
        END IF;

        INSERT INTO public.license_devices (license_id, device_id, status, bound_at, revoked_at)
        VALUES (v_resolved_license_id, v_device_id, 'ACTIVE', v_now, NULL)
        ON CONFLICT (license_id, device_id) DO UPDATE SET
            status = 'ACTIVE',
            bound_at = EXCLUDED.bound_at,
            revoked_at = NULL;

        INSERT INTO public.device_source_bindings (license_id, device_id, source_id, created_at)
        VALUES (v_resolved_license_id, v_device_id, v_reused_source.internal_source_id, v_now)
        ON CONFLICT (device_id) DO UPDATE SET
            license_id = EXCLUDED.license_id,
            source_id = EXCLUDED.source_id,
            created_at = EXCLUDED.created_at;

        v_new_token_hash := encode(digest(v_device_id || ':' || gen_random_uuid()::text || ':' || v_now::text, 'sha256'), 'hex');

        INSERT INTO public.devices (
            device_id, display_code, device_type, device_label, status, device_token_hash, last_seen_at
        ) VALUES (
            v_device_id, v_display_code, 'FIRE_STICK', 'Dispositivo Gerenciado (Reutilizado)',
            'AUTHORIZED', v_new_token_hash, v_now
        ) ON CONFLICT (device_id) DO UPDATE SET
            display_code = EXCLUDED.display_code,
            device_type = EXCLUDED.device_type,
            device_label = EXCLUDED.device_label,
            status = 'AUTHORIZED',
            device_token_hash = COALESCE(EXCLUDED.device_token_hash, public.devices.device_token_hash),
            last_seen_at = v_now;

        -- Consome request de ativacao se pendente
        UPDATE public.device_activation_requests
        SET status = 'CONSUMED', claimed_at = v_now, claimed_by_customer_id = v_target_customer_id,
            linked_license_id = v_resolved_license_id, linked_source_id = v_reused_source.canonical_source_id
        WHERE device_id = v_device_id AND display_code = v_display_code AND status = 'PENDING';

        INSERT INTO public.device_activation_events (
            activation_id, customer_id, license_id, device_id, display_code,
            source_id, action, result, metadata
        ) VALUES
        (
            NULL, v_target_customer_id, v_resolved_license_id, v_device_id,
            v_display_code, v_reused_source.canonical_source_id, 'DEVICE_ACTIVATION_SOURCE_BOUND', 'SUCCESS',
            jsonb_build_object('sourceKind', 'MANAGED', 'sourceReused', true, 'flowMode', 'EXISTING_CUSTOMER')
        ),
        (
            NULL, v_target_customer_id, v_resolved_license_id, v_device_id,
            v_display_code, v_reused_source.canonical_source_id, 'DEVICE_ACTIVATION_COMPLETED', 'SUCCESS',
            jsonb_build_object('sourceKind', 'MANAGED', 'sourceReused', true, 'flowMode', 'EXISTING_CUSTOMER')
        );

        RETURN jsonb_build_object(
            'success', true,
            'deviceId', v_device_id,
            'displayCode', v_display_code,
            'customerId', v_target_customer_id,
            'licenseId', v_resolved_license_id,
            'sourceId', v_reused_source.canonical_source_id,
            'deviceAuthorizationState', 'AUTHORIZED',
            'sourceBindingStatus', 'ACTIVE',
            'licenseStatus', v_candidate_license.status,
            'sourceResolution', 'SOURCE_READY',
            'sourceReused', true
        );

    ELSE
        -- ---------------------------------------------------------------------
        -- FLOW A: NEW_CUSTOMER (Canonical MVP Policy)
        -- ---------------------------------------------------------------------
        IF p_source_id IS NULL OR p_source_type IS NULL OR p_ciphertext IS NULL
           OR p_nonce IS NULL OR p_auth_tag IS NULL THEN
            RAISE EXCEPTION 'SOURCE_CONFIG_REQUIRED' USING ERRCODE = '22023';
        END IF;

        v_clean_name := TRIM(COALESCE(p_new_customer_name, ''));
        IF v_target_customer_id IS NULL AND v_clean_name <> '' THEN
            INSERT INTO public.customer_profiles (id, nickname, status, created_at, updated_at)
            VALUES (gen_random_uuid(), v_clean_name, 'ACTIVE', v_now, v_now)
            RETURNING id INTO v_target_customer_id;
        ELSIF v_target_customer_id IS NOT NULL THEN
            SELECT id, nickname, status
            INTO v_profile
            FROM public.customer_profiles
            WHERE id = v_target_customer_id;

            IF NOT FOUND THEN
                RAISE EXCEPTION 'CUSTOMER_PROFILE_NOT_FOUND' USING ERRCODE = '42501';
            END IF;

            IF v_profile.status <> 'ACTIVE' THEN
                RAISE EXCEPTION 'CUSTOMER_PROFILE_NOT_ACTIVE' USING ERRCODE = '42501';
            END IF;
        ELSE
            RAISE EXCEPTION 'CUSTOMER_NAME_REQUIRED' USING ERRCODE = '22023';
        END IF;

        IF v_resolved_license_id IS NULL THEN
            SELECT COUNT(*)
            INTO v_licenses_count
            FROM public.licenses
            WHERE customer_id = v_target_customer_id
              AND mode = 'MANAGED'
              AND status IN ('ACTIVE', 'TRIAL')
              AND (expires_at IS NULL OR expires_at > v_now)
              AND (trial_expires_at IS NULL OR trial_expires_at > v_now);

            IF v_licenses_count = 0 THEN
                INSERT INTO public.licenses (
                    customer_id,
                    mode,
                    status,
                    max_devices,
                    max_concurrent_sessions,
                    trial_started_at,
                    trial_expires_at,
                    expires_at,
                    license_key_hash,
                    created_at,
                    updated_at
                ) VALUES (
                    v_target_customer_id,
                    'MANAGED',
                    'ACTIVE',
                    1,
                    1,
                    NULL,
                    NULL,
                    NULL,
                    encode(digest(gen_random_uuid()::text, 'sha256'), 'hex'),
                    v_now,
                    v_now
                ) RETURNING id INTO v_resolved_license_id;
            ELSIF v_licenses_count = 1 THEN
                SELECT id
                INTO v_resolved_license_id
                FROM public.licenses
                WHERE customer_id = v_target_customer_id
                  AND mode = 'MANAGED'
                  AND status IN ('ACTIVE', 'TRIAL')
                  AND (expires_at IS NULL OR expires_at > v_now)
                  AND (trial_expires_at IS NULL OR trial_expires_at > v_now)
                ORDER BY created_at ASC
                LIMIT 1;
            ELSE
                RAISE EXCEPTION 'MANAGED_LICENSE_AMBIGUOUS' USING ERRCODE = '42501';
            END IF;
        END IF;

        -- Conclusao via private.activate_device_source_core canonico
        v_result := private.activate_device_source_core(
            CASE WHEN NULLIF(v_pair->>'activationId', '') IS NULL THEN NULL ELSE (v_pair->>'activationId')::UUID END,
            v_device_id,
            v_display_code,
            v_target_customer_id,
            NULL,
            v_resolved_license_id,
            p_source_id,
            'MANAGED',
            p_source_type,
            p_display_name,
            p_ciphertext,
            p_nonce,
            p_auth_tag,
            p_key_version,
            'MANAGER_ASSISTED'
        );

        IF v_target_customer_id IS NOT NULL THEN
            v_result := jsonb_set(v_result, '{customerId}', to_jsonb(v_target_customer_id::text), true);
        END IF;

        v_result := jsonb_set(v_result, '{sourceReused}', 'false'::jsonb, true);

        RETURN v_result;
    END IF;
END;
$$;
