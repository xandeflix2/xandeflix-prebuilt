-- C70 additive policy: directory visibility and explicit extra-device approval.
ALTER TABLE public.licenses ADD COLUMN manager_approved_additional_devices INTEGER NOT NULL DEFAULT 0 CHECK(manager_approved_additional_devices BETWEEN 0 AND 99);
ALTER TABLE public.licenses DROP CONSTRAINT chk_self_service_single_device;
ALTER TABLE public.licenses ADD CONSTRAINT chk_self_service_single_device CHECK(
  mode='MANAGED' OR (mode='SELF_SERVICE' AND max_devices<=1+manager_approved_additional_devices));
CREATE TABLE private.signal_source_index (
  source_kind TEXT NOT NULL CHECK(source_kind IN ('MANAGED','CUSTOMER')),
  source_id TEXT NOT NULL, source_version INTEGER NOT NULL,
  fingerprint TEXT NOT NULL CHECK(fingerprint ~ '^[0-9a-f]{64}$'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), PRIMARY KEY(source_kind,source_id,source_version)
);
CREATE INDEX ON private.signal_source_index(fingerprint);
CREATE TABLE private.additional_signal_device_approvals (
  license_id UUID NOT NULL REFERENCES public.licenses(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL REFERENCES public.devices(device_id) ON DELETE CASCADE,
  source_id TEXT NOT NULL, source_version INTEGER NOT NULL,
  approved_by UUID NOT NULL REFERENCES public.manager_admins(user_id),
  approved_at TIMESTAMPTZ NOT NULL DEFAULT now(), PRIMARY KEY(license_id,device_id)
);
ALTER TABLE private.signal_source_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.additional_signal_device_approvals ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.signal_source_index,private.additional_signal_device_approvals FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.rpc_manager_list_users() RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
  PERFORM private.require_active_manager();
  RETURN (SELECT coalesce(jsonb_agg(jsonb_build_object('userId',u.id,'name',u.name,'status',u.status,
    'kind',u.kind,'adminId',o.manager_id,'licenses',coalesce((SELECT jsonb_agg(jsonb_build_object(
      'licenseId',l.id,'mode',l.mode,'status',l.status,'maxDevices',l.max_devices)) FROM public.licenses l
      WHERE coalesce(l.customer_account_id,l.customer_id)=u.id),'[]'::jsonb)) ORDER BY u.name),'[]'::jsonb)
    FROM (SELECT a.id,a.display_name::text name,a.status::text,'MANAGED' kind FROM public.customer_accounts a
        WHERE NOT EXISTS(SELECT 1 FROM public.customer_profiles c WHERE c.id=a.id)
      UNION ALL SELECT id,nickname::text,status::text,'SELF_SERVICE' FROM public.customer_profiles) u
    LEFT JOIN private.manager_customer_ownership o ON o.customer_id=u.id
    WHERE private.manager_can_customer(u.id) AND NOT EXISTS(SELECT 1 FROM public.manager_admins m WHERE m.user_id=u.id));
END; $$;
CREATE FUNCTION public.rpc_manager_list_staff() RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
  PERFORM private.require_master_manager();
  RETURN (SELECT coalesce(jsonb_agg(jsonb_build_object('userId',m.user_id,'username',u.email,
    'role',CASE m.role WHEN 'OWNER' THEN 'MASTER' ELSE 'ADMIN' END,'status',m.status) ORDER BY u.email),'[]'::jsonb)
    FROM public.manager_admins m JOIN auth.users u ON u.id=m.user_id);
END; $$;
CREATE FUNCTION public.rpc_manager_assign_user(p_customer_id UUID,p_admin_id UUID) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_manager UUID;
BEGIN
  v_manager:=private.require_master_manager();
  IF NOT EXISTS(SELECT 1 FROM public.manager_admins WHERE user_id=p_admin_id AND role='ADMIN' AND status='ACTIVE')
    OR EXISTS(SELECT 1 FROM public.manager_admins WHERE user_id=p_customer_id)
    OR NOT (EXISTS(SELECT 1 FROM public.customer_accounts WHERE id=p_customer_id)
      OR EXISTS(SELECT 1 FROM public.customer_profiles WHERE id=p_customer_id))
    THEN RAISE EXCEPTION 'MANAGER_SCOPE_DENIED' USING ERRCODE='42501'; END IF;
  INSERT INTO private.manager_customer_ownership(customer_id,manager_id) VALUES(p_customer_id,p_admin_id)
    ON CONFLICT(customer_id) DO UPDATE SET manager_id=excluded.manager_id;
  INSERT INTO public.commercial_audit_logs(manager_id,action,target_type,target_id,reason)
    VALUES(v_manager,'CUSTOMER_ADMIN_ASSIGNED','CUSTOMER',p_customer_id::text,'Explicit MASTER assignment');
  RETURN jsonb_build_object('success',true);
END; $$;

CREATE FUNCTION public.rpc_manager_allow_additional_signal_device(p_license_id UUID,p_display_code TEXT) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_manager UUID; v_license RECORD; v_source RECORD; v_device TEXT; v_count INTEGER;
BEGIN
  v_manager:=private.require_active_manager();
  IF NOT private.manager_can_license(p_license_id) THEN RAISE EXCEPTION 'MANAGER_SCOPE_DENIED' USING ERRCODE='42501'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('signal-policy-write',0));
  SELECT * INTO v_license FROM public.licenses WHERE id=p_license_id FOR UPDATE;
  IF v_license.mode<>'SELF_SERVICE' OR v_license.status NOT IN ('ACTIVE','TRIAL') THEN RAISE EXCEPTION 'LICENSE_INVALID' USING ERRCODE='22023'; END IF;
  SELECT * INTO v_source FROM public.customer_sources WHERE license_id=p_license_id AND status='ACTIVE' ORDER BY updated_at DESC LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'SOURCE_NOT_FOUND' USING ERRCODE='22023'; END IF;
  SELECT device_id INTO v_device FROM public.devices WHERE display_code=upper(trim(p_display_code)) AND status<>'REVOKED' FOR UPDATE;
  IF v_device IS NULL OR EXISTS(SELECT 1 FROM public.license_devices WHERE device_id=v_device AND license_id<>p_license_id)
    THEN RAISE EXCEPTION 'MANAGER_SCOPE_DENIED' USING ERRCODE='42501'; END IF;
  IF EXISTS(SELECT 1 FROM public.license_devices WHERE device_id=v_device AND license_id=p_license_id AND status='ACTIVE')
    THEN RETURN jsonb_build_object('success',true,'code','DEVICE_ALREADY_AUTHORIZED'); END IF;
  INSERT INTO private.additional_signal_device_approvals(license_id,device_id,source_id,source_version,approved_by)
    VALUES(p_license_id,v_device,v_source.source_id,v_source.version,v_manager)
    ON CONFLICT(license_id,device_id) DO UPDATE SET source_id=excluded.source_id,source_version=excluded.source_version,
      approved_by=excluded.approved_by,approved_at=now();
  SELECT count(*) INTO v_count FROM (
    SELECT device_id FROM public.license_devices WHERE license_id=p_license_id AND status='ACTIVE'
    UNION SELECT device_id FROM private.additional_signal_device_approvals WHERE license_id=p_license_id) ids;
  IF v_count>100 THEN RAISE EXCEPTION 'INVALID_MAX_DEVICES' USING ERRCODE='22023'; END IF;
  UPDATE public.licenses SET manager_approved_additional_devices=greatest(manager_approved_additional_devices,v_count-1),
    max_devices=greatest(max_devices,v_count) WHERE id=p_license_id;
  INSERT INTO public.commercial_audit_logs(manager_id,action,target_type,target_id,reason)
    VALUES(v_manager,'ADDITIONAL_DEVICE_APPROVED','LICENSE',p_license_id::text,'Explicit manager additional-device approval');
  RETURN jsonb_build_object('success',true,'code','ADDITIONAL_DEVICE_APPROVED');
END; $$;

DO $$ DECLARE r RECORD; BEGIN
  FOR r IN SELECT conname,pg_get_expr(conbin,conrelid) expression FROM pg_constraint
    WHERE conrelid='public.commercial_audit_logs'::regclass AND conname='commercial_audit_logs_action_check' LOOP
    EXECUTE format('ALTER TABLE public.commercial_audit_logs DROP CONSTRAINT %I',r.conname);
    EXECUTE format('ALTER TABLE public.commercial_audit_logs ADD CONSTRAINT %I CHECK ((%s) OR action IN (''CUSTOMER_ADMIN_ASSIGNED'',''ADDITIONAL_DEVICE_APPROVED''))',r.conname,r.expression);
  END LOOP;
END; $$;

-- Trusted vault runtime only. No fingerprint, customer or encrypted envelope in public metadata.
CREATE FUNCTION public.rpc_signal_index_pending() RETURNS JSONB LANGUAGE SQL STABLE SECURITY DEFINER SET search_path='' AS $$
  SELECT coalesce(jsonb_agg(jsonb_build_object('kind',v.kind,'sourceId',v.source_id,'version',v.source_version,
    'protocol',v.protocol,'ciphertext',v.ciphertext,'nonce',v.nonce,'authTag',v.auth_tag)),'[]'::jsonb) FROM (
    SELECT 'CUSTOMER' kind,v.source_id,v.source_version,v.protocol,v.ciphertext,v.nonce,v.auth_tag
      FROM private.customer_source_secret_vault v JOIN public.customer_sources s ON s.source_id=v.source_id AND s.version=v.source_version AND s.status='ACTIVE'
      WHERE NOT EXISTS(SELECT 1 FROM private.signal_source_index i WHERE i.source_kind='CUSTOMER' AND i.source_id=v.source_id AND i.source_version=v.source_version)
    UNION ALL SELECT 'MANAGED',v.source_id,v.source_version,v.protocol,v.ciphertext,v.nonce,v.auth_tag
      FROM private.managed_source_secret_vault v JOIN public.managed_sources s ON s.source_id=v.source_id AND s.version=v.source_version AND s.status='ACTIVE'
      WHERE NOT EXISTS(SELECT 1 FROM private.signal_source_index i WHERE i.source_kind='MANAGED' AND i.source_id=v.source_id AND i.source_version=v.source_version)
    LIMIT 50) v;
$$;
CREATE FUNCTION public.rpc_signal_index_record(p_kind TEXT,p_source_id TEXT,p_version INTEGER,p_fingerprint TEXT) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
  IF (p_kind='CUSTOMER' AND EXISTS(SELECT 1 FROM private.customer_source_secret_vault WHERE source_id=p_source_id AND source_version=p_version))
    OR (p_kind='MANAGED' AND EXISTS(SELECT 1 FROM private.managed_source_secret_vault WHERE source_id=p_source_id AND source_version=p_version)) THEN
    INSERT INTO private.signal_source_index(source_kind,source_id,source_version,fingerprint) VALUES(p_kind,p_source_id,p_version,p_fingerprint) ON CONFLICT DO NOTHING;
    RETURN jsonb_build_object('success',true);
  END IF;
  RAISE EXCEPTION 'SOURCE_POLICY_UNAVAILABLE' USING ERRCODE='42501';
END; $$;
CREATE FUNCTION private.signal_public_decision(p_session_hash TEXT,p_display_code TEXT,p_fingerprint TEXT) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_device TEXT; v_customer UUID; v_license UUID; v_other BOOLEAN; v_session JSONB;
BEGIN
  IF p_fingerprint IS NULL OR p_fingerprint !~ '^[0-9a-f]{64}$' THEN RAISE EXCEPTION 'SOURCE_POLICY_REQUIRED' USING ERRCODE='42501'; END IF;
  v_session:=public.rpc_public_check_device_activation_session(p_session_hash,p_display_code);
  IF v_session->>'success'<>'true' THEN RAISE EXCEPTION 'ACTIVATION_SESSION_NOT_OPEN' USING ERRCODE='42501'; END IF;
  SELECT device_id INTO v_device FROM public.devices WHERE display_code=upper(trim(p_display_code));
  SELECT EXISTS(SELECT 1 FROM private.signal_source_index i JOIN public.customer_sources s
    ON i.source_kind='CUSTOMER' AND s.source_id=i.source_id AND s.version=i.source_version AND s.status='ACTIVE'
    JOIN public.license_devices ld ON ld.license_id=s.license_id AND ld.status='ACTIVE'
    WHERE i.fingerprint=p_fingerprint AND ld.device_id<>v_device) OR EXISTS(SELECT 1 FROM private.signal_source_index i
    JOIN public.managed_sources s ON i.source_kind='MANAGED' AND s.source_id=i.source_id AND s.version=i.source_version AND s.status='ACTIVE'
    JOIN public.device_source_bindings b ON b.source_id=s.id
    JOIN public.license_devices ld ON ld.license_id=b.license_id AND ld.device_id=b.device_id AND ld.status='ACTIVE'
    WHERE i.fingerprint=p_fingerprint AND b.device_id<>v_device) INTO v_other;
  IF NOT v_other THEN RETURN v_session; END IF;
  -- Existing authorized bindings retain their access; capacity alone never creates one.
  SELECT s.customer_id,s.license_id INTO v_customer,v_license FROM private.signal_source_index i
    JOIN public.customer_sources s ON i.source_kind='CUSTOMER' AND s.source_id=i.source_id AND s.version=i.source_version AND s.status='ACTIVE'
    JOIN public.license_devices ld ON ld.license_id=s.license_id AND ld.device_id=v_device AND ld.status='ACTIVE'
    WHERE i.fingerprint=p_fingerprint AND s.customer_id=(v_session->>'customerId')::uuid LIMIT 1;
  IF v_customer IS NOT NULL THEN RETURN jsonb_build_object('success',true,'customerId',v_customer,'licenseId',v_license); END IF;
  SELECT s.customer_id,s.license_id INTO v_customer,v_license FROM private.additional_signal_device_approvals a
    JOIN public.customer_sources s ON s.source_id=a.source_id AND s.version=a.source_version AND s.status='ACTIVE'
    JOIN private.signal_source_index i ON i.source_kind='CUSTOMER' AND i.source_id=s.source_id AND i.source_version=s.version
    JOIN public.licenses l ON l.id=s.license_id AND l.status IN ('ACTIVE','TRIAL')
    JOIN public.manager_admins m ON m.user_id=a.approved_by AND m.status='ACTIVE'
    WHERE a.device_id=v_device AND a.license_id=s.license_id AND i.fingerprint=p_fingerprint
      AND (m.role='OWNER' OR EXISTS(SELECT 1 FROM private.manager_customer_ownership o WHERE o.customer_id=s.customer_id AND o.manager_id=m.user_id))
    LIMIT 1;
  IF v_customer IS NULL THEN RAISE EXCEPTION 'ADDITIONAL_DEVICE_REQUIRES_APPROVAL' USING ERRCODE='42501'; END IF;
  RETURN jsonb_build_object('success',true,'customerId',v_customer,'licenseId',v_license);
END; $$;
CREATE FUNCTION public.rpc_signal_public_check(p_session_hash TEXT,p_display_code TEXT,p_fingerprint TEXT) RETURNS JSONB
LANGUAGE SQL SECURITY DEFINER SET search_path='' AS $$ SELECT private.signal_public_decision(p_session_hash,p_display_code,p_fingerprint); $$;

-- Private copies preserve the established license/session/vault invariants.
DO $$ DECLARE r RECORD; d TEXT; BEGIN
  FOR r IN SELECT p.oid,p.proname,pg_get_functiondef(p.oid) definition FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname IN ('rpc_public_complete_device_activation','rpc_customer_create_source','rpc_customer_update_source') LOOP
    d:=replace(r.definition,'public.'||r.proname||'(', 'private.c70_'||r.proname||'(');
    IF r.proname='rpc_customer_create_source' THEN
      d:=replace(d,'p_key_version text DEFAULT ''v1''::text)','p_key_version text DEFAULT ''v1''::text, p_candidate_source_id text DEFAULT NULL)');
      IF position('p_candidate_source_id text' IN d)=0 THEN RAISE EXCEPTION 'C70_CREATE_SIGNATURE_CHANGED'; END IF;
      d:=replace(d,'v_source_id := ''csrc_'' || lower(encode(gen_random_bytes(8), ''hex''));','v_source_id := p_candidate_source_id;');
      IF position('v_source_id := p_candidate_source_id;' IN d)=0 THEN RAISE EXCEPTION 'C70_CREATE_ID_CHANGED'; END IF;
    END IF;
    EXECUTE d;
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated,service_role',
      (SELECT p.oid::regprocedure FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='private' AND p.proname='c70_'||r.proname));
    d:=r.definition;
    d:=regexp_replace(d,'AS \$function\$[\s\S]*\$function\$', 'AS $function$ BEGIN RAISE EXCEPTION ''SOURCE_POLICY_REQUIRED'' USING ERRCODE=''42501''; END; $function$');
    EXECUTE d;
  END LOOP;
END; $$;
CREATE FUNCTION public.rpc_signal_public_complete(p_session_token_hash TEXT,p_display_code TEXT,p_customer_id UUID,p_customer_nickname TEXT,
  p_source_id TEXT,p_source_type TEXT,p_display_name TEXT,p_ciphertext TEXT,p_nonce TEXT,p_auth_tag TEXT,p_key_version TEXT,p_fingerprint TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE decision JSONB; result JSONB; v_customer UUID;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('signal-policy-write',0));
  IF jsonb_array_length(public.rpc_signal_index_pending())>0 THEN RAISE EXCEPTION 'SOURCE_POLICY_PREPARING' USING ERRCODE='42501'; END IF;
  decision:=private.signal_public_decision(p_session_token_hash,p_display_code,p_fingerprint);
  v_customer:=coalesce((decision->>'customerId')::uuid,p_customer_id);
  IF v_customer IS DISTINCT FROM p_customer_id THEN RAISE EXCEPTION 'SOURCE_POLICY_RETRY' USING ERRCODE='42501'; END IF;
  IF NOT EXISTS(SELECT 1 FROM auth.users WHERE id=v_customer) THEN RAISE EXCEPTION 'CUSTOMER_PROFILE_NOT_ACTIVE' USING ERRCODE='42501'; END IF;
  INSERT INTO public.customer_accounts(id,display_name,status) VALUES(v_customer,p_customer_nickname,'ACTIVE') ON CONFLICT DO NOTHING;
  result:=private.c70_rpc_public_complete_device_activation(p_session_token_hash,p_display_code,v_customer,p_customer_nickname,
    p_source_id,p_source_type,p_display_name,p_ciphertext,p_nonce,p_auth_tag,p_key_version);
  IF result->>'success'='true' AND result->>'sourceId'=p_source_id THEN
    PERFORM public.rpc_signal_index_record('CUSTOMER',p_source_id,1,p_fingerprint);
  END IF;
  RETURN result;
END; $$;

CREATE FUNCTION public.rpc_signal_customer_write(p_customer_id UUID,p_operation TEXT,p_source_id TEXT,p_license_id UUID,p_source_type TEXT,
  p_display_name TEXT,p_ciphertext TEXT,p_nonce TEXT,p_auth_tag TEXT,p_key_version TEXT,p_fingerprint TEXT,p_expected_version INTEGER)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE result JSONB; v_license UUID; v_customer UUID; v_version INTEGER;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('signal-policy-write',0));
  IF p_customer_id IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE='42501'; END IF;
  IF p_operation='CREATE_CUSTOMER_SOURCE' THEN
    v_license:=p_license_id;
    IF p_source_id !~ '^csrc_[a-z0-9]+$' THEN RAISE EXCEPTION 'INVALID_SOURCE_ID' USING ERRCODE='22023'; END IF;
  ELSIF p_operation='UPDATE_CUSTOMER_SOURCE' THEN
    SELECT license_id,customer_id,version INTO v_license,v_customer,v_version FROM public.customer_sources WHERE source_id=p_source_id FOR UPDATE;
    IF v_customer IS DISTINCT FROM p_customer_id THEN RAISE EXCEPTION 'CROSS_CUSTOMER_ACCESS_DENIED' USING ERRCODE='42501'; END IF;
    IF p_ciphertext IS NOT NULL AND v_version IS DISTINCT FROM p_expected_version THEN RAISE EXCEPTION 'VERSION_CONFLICT' USING ERRCODE='40001'; END IF;
  ELSE RAISE EXCEPTION 'INVALID_REQUEST' USING ERRCODE='22023'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.licenses WHERE id=v_license AND customer_id=p_customer_id AND mode='SELF_SERVICE' AND status IN ('ACTIVE','TRIAL'))
    THEN RAISE EXCEPTION 'UNAUTHORIZED_LICENSE_ACCESS' USING ERRCODE='42501'; END IF;
  IF p_ciphertext IS NOT NULL THEN
    IF p_fingerprint IS NULL OR p_fingerprint !~ '^[0-9a-f]{64}$' THEN RAISE EXCEPTION 'SOURCE_POLICY_REQUIRED' USING ERRCODE='42501'; END IF;
    IF jsonb_array_length(public.rpc_signal_index_pending())>0 THEN RAISE EXCEPTION 'SOURCE_POLICY_PREPARING' USING ERRCODE='42501'; END IF;
    IF EXISTS(SELECT 1 FROM private.signal_source_index i JOIN public.customer_sources s ON i.source_kind='CUSTOMER'
      AND s.source_id=i.source_id AND s.version=i.source_version AND s.status='ACTIVE'
      JOIN public.license_devices ld ON ld.license_id=s.license_id AND ld.status='ACTIVE'
      WHERE i.fingerprint=p_fingerprint AND s.license_id<>v_license)
      OR EXISTS(SELECT 1 FROM private.signal_source_index i JOIN public.managed_sources s ON i.source_kind='MANAGED'
      AND s.source_id=i.source_id AND s.version=i.source_version AND s.status='ACTIVE'
      JOIN public.device_source_bindings b ON b.source_id=s.id
      JOIN public.license_devices ld ON ld.license_id=b.license_id AND ld.device_id=b.device_id AND ld.status='ACTIVE' WHERE i.fingerprint=p_fingerprint)
      THEN RAISE EXCEPTION 'ADDITIONAL_DEVICE_REQUIRES_APPROVAL' USING ERRCODE='42501'; END IF;
  END IF;
  PERFORM set_config('request.jwt.claim.sub',p_customer_id::text,true);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',p_customer_id,'role','authenticated')::text,true);
  IF p_operation='CREATE_CUSTOMER_SOURCE' THEN
    result:=private.c70_rpc_customer_create_source(v_license,p_source_type,p_display_name,p_ciphertext,p_nonce,p_auth_tag,p_key_version,p_source_id);
  ELSE result:=private.c70_rpc_customer_update_source(p_source_id,p_display_name,p_ciphertext,p_nonce,p_auth_tag,p_key_version); END IF;
  IF p_ciphertext IS NOT NULL AND coalesce(result->>'success','true')='true' THEN
    SELECT version INTO v_version FROM public.customer_sources WHERE source_id=p_source_id;
    PERFORM public.rpc_signal_index_record('CUSTOMER',p_source_id,v_version,p_fingerprint);
  END IF;
  RETURN result;
END; $$;

-- Serialize existing managed-source mutations with policy decisions, including MASTER.
DO $$ DECLARE d TEXT; BEGIN
  SELECT pg_get_functiondef('private.manager_check_scope(text,jsonb)'::regprocedure) INTO d;
  d:=replace(d,'v_user := private.require_active_manager();', 'v_user := private.require_active_manager();
    IF p_operation IN (''rpc_manager_complete_device_activation'',''rpc_manager_create_managed_source_vault'',
      ''rpc_manager_update_managed_source_vault'',''rpc_manager_create_managed_source_metadata'',''rpc_manager_update_managed_source_metadata'',
      ''rpc_manager_create_managed_source'',''rpc_manager_update_managed_source'') THEN
      PERFORM pg_advisory_xact_lock(hashtextextended(''signal-policy-write'',0)); END IF;');
  EXECUTE d;
END; $$;
DO $$ DECLARE r RECORD; BEGIN
  FOR r IN SELECT p.oid::regprocedure fn,p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND (p.proname LIKE 'rpc_signal_%' OR p.proname IN ('rpc_manager_list_users','rpc_manager_list_staff','rpc_manager_assign_user','rpc_manager_allow_additional_signal_device')) LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated',r.fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO %I',r.fn,CASE WHEN r.proname LIKE 'rpc_signal_%' THEN 'service_role' ELSE 'authenticated' END);
  END LOOP;
END; $$;
REVOKE ALL ON FUNCTION private.signal_public_decision(TEXT,TEXT,TEXT) FROM PUBLIC,anon,authenticated,service_role;
NOTIFY pgrst,'reload schema';
