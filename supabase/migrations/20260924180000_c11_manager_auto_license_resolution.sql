-- =============================================================================
-- Migration: 20260924180000_c11_manager_auto_license_resolution.sql
-- Xandeflix Prebuilt — C11 Manager Activation Customer Claim & Zero-License MVP Policy
--
-- Authoritative server-side resolution and MVP license creation for manager-assisted
-- device activation:
--   CASE A: Exactly 1 eligible MANAGED license with capacity -> reused automatically
--   CASE B: Zero eligible licenses -> auto-creates canonical MVP MANAGED license:
--           (mode='MANAGED', status='ACTIVE', max_devices=1, max_concurrent_sessions=1,
--            expires_at=NULL, trial_eligible=false)
--   CASE C: Multiple eligible licenses (>1) -> fails closed with MANAGED_LICENSE_AMBIGUOUS
--   CAPACITY: Full license capacity -> fails closed with MANAGED_LICENSE_CAPACITY_EXHAUSTED
--   OWNERSHIP: Binds device to explicitly selected customer; cross-customer binding denied
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
    p_customer_id UUID DEFAULT NULL
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
    v_resolved_license_id UUID := p_license_id;
    v_resolved_customer_id UUID := p_customer_id;
    v_target_customer_id UUID;
    v_profile RECORD;
    v_candidate RECORD;
    v_total_licenses_count INTEGER;
    v_active_devices_count INTEGER;
    v_is_already_bound BOOLEAN;
    v_now TIMESTAMPTZ := NOW();
BEGIN
    PERFORM private.require_master_manager();

    -- 1. Validate device display code and activation key hash
    v_pair := private.validate_device_code_key(p_display_code, p_activation_key_hash);
    v_device_id := v_pair->>'deviceId';
    v_display_code := v_pair->>'displayCode';

    -- 2. Determine target customer
    IF v_resolved_customer_id IS NOT NULL THEN
        v_target_customer_id := v_resolved_customer_id;
    ELSE
        -- Check if request was claimed by a customer
        SELECT claimed_by_customer_id INTO v_target_customer_id
        FROM public.device_activation_requests
        WHERE device_id = v_device_id AND display_code = v_display_code
        ORDER BY created_at DESC
        LIMIT 1;

        -- If not claimed, check if device was previously bound to an active license
        IF v_target_customer_id IS NULL THEN
            SELECT l.customer_id INTO v_target_customer_id
            FROM public.license_devices ld
            JOIN public.licenses l ON l.id = ld.license_id
            WHERE ld.device_id = v_device_id AND ld.status = 'ACTIVE'
            LIMIT 1;
        END IF;
    END IF;

    IF v_target_customer_id IS NULL THEN
        RAISE EXCEPTION 'CUSTOMER_ID_REQUIRED' USING ERRCODE = '22023';
    END IF;

    -- Validate target customer exists and is active
    SELECT * INTO v_profile
    FROM public.customer_profiles
    WHERE id = v_target_customer_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'CUSTOMER_PROFILE_NOT_FOUND' USING ERRCODE = 'P0002';
    END IF;
    IF v_profile.status <> 'ACTIVE' THEN
        RAISE EXCEPTION 'CUSTOMER_PROFILE_NOT_ACTIVE' USING ERRCODE = '42501';
    END IF;

    -- 3. If explicit p_license_id is supplied, validate it (legacy/disambiguation call)
    IF v_resolved_license_id IS NOT NULL THEN
        SELECT l.*, cp.nickname as customer_nickname
        INTO v_candidate
        FROM public.licenses l
        LEFT JOIN public.customer_profiles cp ON cp.id = l.customer_id
        WHERE l.id = v_resolved_license_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'LICENSE_NOT_FOUND' USING ERRCODE = 'P0002';
        END IF;
        IF v_candidate.mode <> 'MANAGED' THEN
            RAISE EXCEPTION 'LICENSE_MODE_INVALID' USING ERRCODE = '42501';
        END IF;
        IF v_candidate.status NOT IN ('ACTIVE', 'TRIAL') THEN
            RAISE EXCEPTION 'LICENSE_STATUS_INELIGIBLE' USING ERRCODE = '42501';
        END IF;
        IF v_candidate.status = 'TRIAL' AND v_candidate.trial_expires_at IS NOT NULL AND v_candidate.trial_expires_at <= v_now THEN
            RAISE EXCEPTION 'TRIAL_EXPIRED' USING ERRCODE = '42501';
        END IF;
        IF v_candidate.expires_at IS NOT NULL AND v_candidate.expires_at <= v_now THEN
            RAISE EXCEPTION 'LICENSE_EXPIRED' USING ERRCODE = '42501';
        END IF;
        IF v_candidate.customer_id IS NOT NULL AND v_candidate.customer_id <> v_target_customer_id THEN
            RAISE EXCEPTION 'CROSS_CUSTOMER_BINDING_DENIED' USING ERRCODE = '42501';
        END IF;

        -- Check capacity for explicit license
        SELECT count(*) INTO v_active_devices_count
        FROM public.license_devices ld
        WHERE ld.license_id = v_candidate.id AND ld.status = 'ACTIVE' AND ld.device_id <> v_device_id;

        SELECT EXISTS (
            SELECT 1 FROM public.license_devices ld
            WHERE ld.license_id = v_candidate.id AND ld.device_id = v_device_id AND ld.status = 'ACTIVE'
        ) INTO v_is_already_bound;

        IF v_active_devices_count >= v_candidate.max_devices AND NOT v_is_already_bound THEN
            RAISE EXCEPTION 'MANAGED_LICENSE_CAPACITY_EXHAUSTED' USING ERRCODE = '42501';
        END IF;

        v_resolved_customer_id := v_candidate.customer_id;
    ELSE
        -- 4. Authoritative Server-Side Auto-Resolution for v_target_customer_id
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

        SELECT count(*) INTO v_total_licenses_count FROM temp_eligible_licenses;

        IF v_total_licenses_count = 1 THEN
            -- CASE A: Exactly one MANAGED license for this customer
            SELECT id, customer_id, max_devices INTO v_candidate
            FROM temp_eligible_licenses
            LIMIT 1;

            -- Enforce capacity
            SELECT count(*) INTO v_active_devices_count
            FROM public.license_devices ld
            WHERE ld.license_id = v_candidate.id AND ld.status = 'ACTIVE' AND ld.device_id <> v_device_id;

            SELECT EXISTS (
                SELECT 1 FROM public.license_devices ld
                WHERE ld.license_id = v_candidate.id AND ld.device_id = v_device_id AND ld.status = 'ACTIVE'
            ) INTO v_is_already_bound;

            IF v_active_devices_count >= v_candidate.max_devices AND NOT v_is_already_bound THEN
                RAISE EXCEPTION 'MANAGED_LICENSE_CAPACITY_EXHAUSTED' USING ERRCODE = '42501';
            END IF;

            v_resolved_license_id := v_candidate.id;
            v_resolved_customer_id := v_target_customer_id;
        ELSIF v_total_licenses_count = 0 THEN
            -- CASE B: ZERO-LICENSE MVP POLICY
            -- Auto-create canonical MANAGED license for this customer
            v_resolved_license_id := gen_random_uuid();
            INSERT INTO public.licenses (
                id,
                license_key_hash,
                mode,
                status,
                customer_id,
                max_devices,
                max_concurrent_sessions,
                expires_at,
                trial_eligible,
                trial_started_at,
                trial_expires_at,
                created_at
            ) VALUES (
                v_resolved_license_id,
                encode(sha256(('MANAGED_MVP_' || v_target_customer_id::text || '_' || v_resolved_license_id::text || '_' || extract(epoch FROM v_now)::text)::bytea), 'hex'),
                'MANAGED',
                'ACTIVE',
                v_target_customer_id,
                1,
                1,
                NULL,
                false,
                NULL,
                NULL,
                v_now
            );
            v_resolved_customer_id := v_target_customer_id;
        ELSE
            -- CASE C: Multiple (>1) eligible licenses exist for this customer -> fail closed
            RAISE EXCEPTION 'MANAGED_LICENSE_AMBIGUOUS' USING ERRCODE = '42501';
        END IF;
    END IF;

    -- 5. Complete device activation core
    v_result := private.activate_device_source_core(
        CASE WHEN NULLIF(v_pair->>'activationId', '') IS NULL THEN NULL ELSE (v_pair->>'activationId')::UUID END,
        v_device_id,
        v_display_code,
        v_resolved_customer_id,
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
END;
$$;

-- Revoke and Grant
REVOKE ALL ON FUNCTION public.rpc_manager_complete_device_activation(TEXT, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_manager_complete_device_activation(TEXT, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID) TO authenticated;
