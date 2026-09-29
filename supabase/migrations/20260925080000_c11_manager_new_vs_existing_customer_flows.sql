-- =============================================================================
-- Migration: 20260925080000_c11_manager_new_vs_existing_customer_flows.sql
-- Xandeflix Prebuilt — C11 Manager Two-Flow Activation: New vs Existing Customer
--
-- Authoritative server-side execution for the two canonical manager flows:
--   FLOW_A: NEW_CUSTOMER
--           Requires: new customer name, new device code, new permanent key, source config
--           Action: creates customer -> creates canonical MVP MANAGED license (max_devices=1)
--                   -> encrypts & stores source in Vault -> binds & authorizes device
--   FLOW_B: EXISTING_CUSTOMER
--           Requires: customerId, existing bound device code, new device code, new permanent key
--           Action: validates customer exists & active -> enforces existing device belongs to customer
--                   -> reuses existing active MANAGED source (no source re-entry, no plaintext copy)
--                   -> resolves eligible MANAGED license with capacity (fails closed if exhausted)
--                   -> binds & authorizes new device
-- =============================================================================

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
    PERFORM private.require_master_manager();

    -- 1. Validate new device display code and activation key hash
    v_pair := private.validate_device_code_key(p_display_code, p_activation_key_hash);
    v_device_id := v_pair->>'deviceId';
    v_display_code := v_pair->>'displayCode';

    -- 2. Route by Flow Mode
    IF p_flow_mode = 'EXISTING_CUSTOMER' THEN
        -- =====================================================================
        -- FLOW B: EXISTING_ACTIVE_CUSTOMER
        -- =====================================================================
        IF v_target_customer_id IS NULL THEN
            RAISE EXCEPTION 'CUSTOMER_ID_REQUIRED' USING ERRCODE = '22023';
        END IF;

        SELECT * INTO v_profile
        FROM public.customer_profiles
        WHERE id = v_target_customer_id;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'CUSTOMER_PROFILE_NOT_FOUND' USING ERRCODE = 'P0002';
        END IF;
        IF v_profile.status <> 'ACTIVE' THEN
            RAISE EXCEPTION 'CUSTOMER_PROFILE_NOT_ACTIVE' USING ERRCODE = '42501';
        END IF;

        -- Validate existing bound device code
        IF p_existing_display_code IS NULL OR trim(p_existing_display_code) = '' THEN
            RAISE EXCEPTION 'EXISTING_DEVICE_CODE_REQUIRED' USING ERRCODE = '22023';
        END IF;
        v_clean_existing_code := trim(p_existing_display_code);
        IF NOT (v_clean_existing_code ~ '^XF-[0-9A-Z]{4}-[0-9A-Z]{4}$') THEN
            RAISE EXCEPTION 'DISPLAY_CODE_INVALID' USING ERRCODE = '22023';
        END IF;

        SELECT d.device_id, d.status INTO v_existing_device
        FROM public.devices d
        WHERE d.display_code = v_clean_existing_code;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'EXISTING_DEVICE_NOT_FOUND' USING ERRCODE = 'P0002';
        END IF;

        -- Enforce that existing device belongs to selected customer
        SELECT ld.license_id, l.customer_id
        INTO v_existing_device_binding
        FROM public.license_devices ld
        JOIN public.licenses l ON l.id = ld.license_id
        WHERE ld.device_id = v_existing_device.device_id
          AND ld.status = 'ACTIVE';

        IF NOT FOUND OR v_existing_device_binding.customer_id <> v_target_customer_id THEN
            RAISE EXCEPTION 'EXISTING_DEVICE_CUSTOMER_MISMATCH' USING ERRCODE = '42501';
        END IF;

        -- Resolve existing customer's active managed source
        CREATE TEMPORARY TABLE IF NOT EXISTS temp_reusable_sources (
            managed_source_id UUID,
            source_id TEXT,
            source_type TEXT,
            name TEXT
        ) ON COMMIT DROP;
        DELETE FROM temp_reusable_sources;

        INSERT INTO temp_reusable_sources (managed_source_id, source_id, source_type, name)
        SELECT DISTINCT ms.id, ms.source_id, ms.source_type, ms.name
        FROM public.device_source_bindings dsb
        JOIN public.managed_sources ms ON ms.id = dsb.source_id
        WHERE ms.status = 'ACTIVE'
          AND (
            dsb.device_id = v_existing_device.device_id
            OR dsb.license_id IN (SELECT l.id FROM public.licenses l WHERE l.customer_id = v_target_customer_id)
          );

        SELECT count(*) INTO v_sources_count FROM temp_reusable_sources;

        IF v_sources_count = 0 THEN
            RAISE EXCEPTION 'CUSTOMER_HAS_NO_ACTIVE_SOURCE' USING ERRCODE = '42501';
        ELSIF v_sources_count > 1 THEN
            RAISE EXCEPTION 'CUSTOMER_SOURCE_AMBIGUOUS' USING ERRCODE = '42501';
        END IF;

        SELECT * INTO v_reused_source FROM temp_reusable_sources LIMIT 1;

        -- Resolve eligible MANAGED license belonging to customer
        IF v_resolved_license_id IS NOT NULL THEN
            SELECT * INTO v_candidate_license
            FROM public.licenses
            WHERE id = v_resolved_license_id;
            IF NOT FOUND THEN
                RAISE EXCEPTION 'LICENSE_NOT_FOUND' USING ERRCODE = 'P0002';
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
            CREATE TEMPORARY TABLE IF NOT EXISTS temp_eligible_licenses (
                id UUID,
                customer_id UUID,
                max_devices INTEGER
            ) ON COMMIT DROP;
            DELETE FROM temp_eligible_licenses;

            INSERT INTO temp_eligible_licenses (id, customer_id, max_devices)
            SELECT l.id, l.customer_id, l.max_devices
            FROM public.licenses l
            WHERE l.customer_id = v_target_customer_id
              AND l.mode = 'MANAGED'
              AND l.status IN ('ACTIVE', 'TRIAL')
              AND (l.expires_at IS NULL OR l.expires_at > v_now)
              AND (l.trial_expires_at IS NULL OR l.trial_expires_at > v_now);

            SELECT count(*) INTO v_licenses_count FROM temp_eligible_licenses;

            IF v_licenses_count = 0 THEN
                RAISE EXCEPTION 'NO_ELIGIBLE_MANAGED_LICENSE' USING ERRCODE = '42501';
            ELSIF v_licenses_count > 1 THEN
                RAISE EXCEPTION 'MANAGED_LICENSE_AMBIGUOUS' USING ERRCODE = '42501';
            END IF;

            SELECT * INTO v_candidate_license FROM temp_eligible_licenses LIMIT 1;
            v_resolved_license_id := v_candidate_license.id;
        END IF;

        -- Enforce capacity
        SELECT count(*) INTO v_active_devices_count
        FROM public.license_devices ld
        WHERE ld.license_id = v_candidate_license.id AND ld.status = 'ACTIVE' AND ld.device_id <> v_device_id;

        SELECT EXISTS (
            SELECT 1 FROM public.license_devices ld
            WHERE ld.license_id = v_candidate_license.id AND ld.device_id = v_device_id AND ld.status = 'ACTIVE'
        ) INTO v_is_already_bound;

        IF v_active_devices_count >= v_candidate_license.max_devices AND NOT v_is_already_bound THEN
            RAISE EXCEPTION 'MANAGED_LICENSE_CAPACITY_EXHAUSTED' USING ERRCODE = '42501';
        END IF;

        -- Bind device to license
        INSERT INTO public.license_devices (license_id, device_id, status, bound_at, revoked_at)
        VALUES (v_resolved_license_id, v_device_id, 'ACTIVE', v_now, NULL)
        ON CONFLICT (license_id, device_id) DO UPDATE SET
            status = 'ACTIVE',
            bound_at = EXCLUDED.bound_at,
            revoked_at = NULL;

        -- Bind device to reused existing managed source
        INSERT INTO public.device_source_bindings (license_id, device_id, source_id, created_at)
        VALUES (v_resolved_license_id, v_device_id, v_reused_source.managed_source_id, v_now)
        ON CONFLICT (device_id) DO UPDATE SET
            license_id = EXCLUDED.license_id,
            source_id = EXCLUDED.source_id,
            created_at = EXCLUDED.created_at;

        -- Authorize device
        v_new_token_hash := encode(sha256(('DEV_TOKEN_' || v_device_id || '_' || extract(epoch FROM v_now)::text)::bytea), 'hex');
        INSERT INTO public.devices (
            device_id, display_code, device_type, device_label, status, device_token_hash, last_seen_at
        ) VALUES (
            v_device_id, v_display_code, COALESCE(v_pair->>'deviceType', 'FIRE_STICK'), COALESCE(v_pair->>'deviceLabel', 'Dispositivo Gerenciado'),
            'AUTHORIZED', v_new_token_hash, v_now
        ) ON CONFLICT (device_id) DO UPDATE SET
            display_code = EXCLUDED.display_code,
            status = 'AUTHORIZED',
            last_seen_at = v_now;

        -- Consume activation request
        UPDATE public.device_activation_requests
        SET status = 'CONSUMED', claimed_at = v_now, claimed_by_customer_id = v_target_customer_id,
            linked_license_id = v_resolved_license_id, linked_source_id = v_reused_source.source_id
        WHERE device_id = v_device_id AND display_code = v_display_code AND status = 'PENDING';

        RETURN jsonb_build_object(
            'success', true,
            'deviceId', v_device_id,
            'displayCode', v_display_code,
            'customerId', v_target_customer_id,
            'licenseId', v_resolved_license_id,
            'sourceId', v_reused_source.source_id,
            'deviceAuthorizationState', 'AUTHORIZED',
            'sourceBindingStatus', 'ACTIVE',
            'licenseStatus', 'ACTIVE',
            'sourceResolution', 'SOURCE_READY',
            'sourceReused', true
        );
    ELSE
        -- =====================================================================
        -- FLOW A: NEW_CUSTOMER (Canonical MVP Policy)
        -- =====================================================================
        IF p_new_customer_name IS NOT NULL AND trim(p_new_customer_name) <> '' THEN
            v_clean_name := trim(p_new_customer_name);
            v_target_customer_id := gen_random_uuid();
            INSERT INTO public.customer_profiles (id, nickname, status, created_at, updated_at)
            VALUES (v_target_customer_id, private.validate_customer_nickname(v_clean_name), 'ACTIVE', v_now, v_now)
            RETURNING * INTO v_profile;
        ELSIF v_target_customer_id IS NOT NULL THEN
            SELECT * INTO v_profile
            FROM public.customer_profiles
            WHERE id = v_target_customer_id;
            IF NOT FOUND THEN
                RAISE EXCEPTION 'CUSTOMER_PROFILE_NOT_FOUND' USING ERRCODE = 'P0002';
            END IF;
            IF v_profile.status <> 'ACTIVE' THEN
                RAISE EXCEPTION 'CUSTOMER_PROFILE_NOT_ACTIVE' USING ERRCODE = '42501';
            END IF;
        ELSE
            RAISE EXCEPTION 'CUSTOMER_NAME_REQUIRED' USING ERRCODE = '22023';
        END IF;

        -- Source input is strictly required for NEW_CUSTOMER
        IF p_source_id IS NULL OR p_ciphertext IS NULL OR p_nonce IS NULL OR p_auth_tag IS NULL THEN
            RAISE EXCEPTION 'SOURCE_CONFIG_REQUIRED' USING ERRCODE = '22023';
        END IF;

        -- Auto-create canonical MVP MANAGED license
        v_resolved_license_id := gen_random_uuid();
        INSERT INTO public.licenses (
            id, license_key_hash, mode, status, customer_id,
            max_devices, max_concurrent_sessions, expires_at,
            trial_eligible, trial_started_at, trial_expires_at, created_at
        ) VALUES (
            v_resolved_license_id,
            encode(sha256(('MANAGED_MVP_' || v_target_customer_id::text || '_' || v_resolved_license_id::text || '_' || extract(epoch FROM v_now)::text)::bytea), 'hex'),
            'MANAGED', 'ACTIVE', v_target_customer_id,
            1, 1, NULL, false, NULL, NULL, v_now
        );

        -- Complete device activation core (stores encrypted source and binds)
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

        RETURN v_result;
    END IF;
END;
$$;

-- Permissions
REVOKE ALL ON FUNCTION public.rpc_manager_complete_device_activation(TEXT, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_manager_complete_device_activation(TEXT, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT) TO authenticated;
