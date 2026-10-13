-- C81: existing-device links preserve contracted limits; simultaneous screens <= device capacity.
CREATE OR REPLACE FUNCTION public.rpc_manager_activate_device_configured(p_activation JSONB,p_device_label TEXT,
 p_max_devices INTEGER,p_max_sessions INTEGER,p_device_role TEXT,p_primary_display_code TEXT DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE manager UUID; args JSONB:=p_activation; result JSONB; pair JSONB; limits JSONB;
 license UUID; customer UUID; main_device TEXT; reference_device TEXT; new_device TEXT; source RECORD; lic RECORD;
 existing RECORD; count_licenses INTEGER; role_code TEXT:=upper(trim(coalesce(p_device_role,'')));
 main_code TEXT:=upper(trim(coalesce(p_primary_display_code,''))); flow TEXT:=p_activation->>'p_flow_mode';
BEGIN
 manager:=private.require_active_manager();
 IF args IS NULL OR jsonb_typeof(args)<>'object' THEN RAISE EXCEPTION 'INVALID_REQUEST'; END IF;
 IF length(trim(coalesce(p_device_label,''))) NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'INVALID_DEVICE_LABEL'; END IF;
 IF p_max_devices IS NULL OR p_max_devices NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'INVALID_MAX_DEVICES'; END IF;
 IF p_max_sessions IS NULL OR p_max_sessions NOT BETWEEN 1 AND 50 THEN RAISE EXCEPTION 'INVALID_MAX_CONCURRENT_SESSIONS'; END IF;
 IF p_max_sessions>p_max_devices THEN RAISE EXCEPTION 'CONCURRENT_LIMIT_EXCEEDS_DEVICES'; END IF;
 IF role_code NOT IN ('PRIMARY','SECONDARY') THEN RAISE EXCEPTION 'INVALID_DEVICE_ROLE'; END IF;
 IF flow IS NULL OR flow NOT IN ('NEW_CUSTOMER','EXISTING_CUSTOMER') THEN RAISE EXCEPTION 'INVALID_REQUEST'; END IF;
 IF role_code='SECONDARY' AND (flow<>'EXISTING_CUSTOMER' OR main_code !~ '^XF-[0-9A-Z]{4}-[0-9A-Z]{4}$') THEN RAISE EXCEPTION 'PRIMARY_DEVICE_REQUIRED'; END IF;
 IF role_code='PRIMARY' AND main_code<>'' THEN RAISE EXCEPTION 'PRIMARY_DEVICE_INVALID'; END IF;
 IF role_code='SECONDARY' THEN
   IF main_code=upper(trim(args->>'p_display_code')) OR main_code IS DISTINCT FROM upper(trim(args->>'p_existing_display_code')) THEN RAISE EXCEPTION 'PRIMARY_DEVICE_INVALID'; END IF;
 END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('signal-policy-write',0));
 PERFORM private.manager_check_scope('rpc_manager_complete_device_activation',args);
 pair:=public.rpc_claim_device_key(args->>'p_display_code',args->>'p_activation_key_hash');
 new_device:=pair->>'deviceId';
 IF pair->>'valid' IS DISTINCT FROM 'true' OR new_device IS NULL THEN RAISE EXCEPTION 'INVALID_ACTIVATION_KEY' USING ERRCODE='42501'; END IF;
 IF flow='EXISTING_CUSTOMER' THEN
   customer:=nullif(args->>'p_customer_id','')::uuid;
   IF customer IS NULL THEN RAISE EXCEPTION 'CUSTOMER_ID_REQUIRED'; END IF;
   IF NOT EXISTS(SELECT 1 FROM public.customer_accounts WHERE id=customer AND status='ACTIVE') THEN RAISE EXCEPTION 'CUSTOMER_ACCOUNT_NOT_ACTIVE'; END IF;
   license:=nullif(args->>'p_license_id','')::uuid;
   IF license IS NULL THEN
     SELECT count(*),(array_agg(id ORDER BY created_at,id))[1] INTO count_licenses,license
     FROM public.licenses WHERE coalesce(customer_account_id,customer_id)=customer AND mode='MANAGED'
       AND status IN ('ACTIVE','TRIAL') AND (expires_at IS NULL OR expires_at>now()) AND (trial_expires_at IS NULL OR trial_expires_at>now());
     IF count_licenses=0 THEN RAISE EXCEPTION 'NO_ELIGIBLE_MANAGED_LICENSE'; END IF;
     IF count_licenses>1 THEN RAISE EXCEPTION 'MANAGED_LICENSE_AMBIGUOUS'; END IF;
   END IF;
   IF NOT private.manager_can_license(license) THEN RAISE EXCEPTION 'MANAGER_SCOPE_DENIED' USING ERRCODE='42501'; END IF;
   SELECT * INTO lic FROM public.licenses WHERE id=license FOR UPDATE;
   IF NOT FOUND OR coalesce(lic.customer_account_id,lic.customer_id) IS DISTINCT FROM customer THEN RAISE EXCEPTION 'CROSS_CUSTOMER_BINDING_DENIED' USING ERRCODE='42501'; END IF;
   IF lic.mode<>'MANAGED' OR lic.status NOT IN ('ACTIVE','TRIAL') OR lic.expires_at<=now() OR lic.trial_expires_at<=now() THEN RAISE EXCEPTION 'LICENSE_NOT_ACTIVE'; END IF;
   SELECT d.device_id INTO reference_device FROM public.devices d JOIN public.license_devices ld ON ld.device_id=d.device_id
     WHERE ld.license_id=license AND ld.status='ACTIVE' AND d.status='AUTHORIZED' AND d.display_code=upper(trim(args->>'p_existing_display_code'));
   IF reference_device IS NULL THEN RAISE EXCEPTION 'PRIMARY_DEVICE_INVALID'; END IF;
   IF role_code='SECONDARY' THEN
     main_device:=reference_device;
     IF main_device=new_device OR EXISTS(SELECT 1 FROM private.manager_device_relationships WHERE license_id=license AND device_id=main_device AND device_role<>'PRIMARY')
     THEN RAISE EXCEPTION 'PRIMARY_DEVICE_INVALID'; END IF;
   END IF;
   IF EXISTS(SELECT 1 FROM public.license_devices WHERE device_id=new_device AND license_id<>license) THEN RAISE EXCEPTION 'CROSS_CUSTOMER_BINDING_DENIED' USING ERRCODE='42501'; END IF;
   SELECT ms.* INTO source FROM public.device_source_bindings b JOIN public.managed_sources ms ON ms.id=b.source_id
     WHERE b.license_id=license AND b.device_id=reference_device AND ms.status='ACTIVE';
   IF NOT FOUND THEN RAISE EXCEPTION 'CUSTOMER_HAS_NO_ACTIVE_SOURCE'; END IF;
   -- The existing device mutation rejects ambiguous sources within this license.
   limits:=public.rpc_manager_update_license_limits(license,p_max_devices,p_max_sessions,'Manager confirmed capacity during device registration');
   IF limits->>'success' IS DISTINCT FROM 'true' THEN RAISE EXCEPTION 'REMOTE_MANAGER_MUTATION_FAILED'; END IF;
   PERFORM public.rpc_manager_license_device(license,pair->>'displayCode',trim(p_device_label),args->>'p_activation_key_hash');
   IF NOT EXISTS(SELECT 1 FROM public.device_source_bindings WHERE license_id=license AND device_id=new_device AND source_id=source.id)
   THEN RAISE EXCEPTION 'PRIMARY_DEVICE_INVALID'; END IF;
   result:=jsonb_build_object('success',true,'deviceId',new_device,'displayCode',pair->>'displayCode','customerId',customer,'licenseId',license,
    'sourceId',source.source_id,'deviceAuthorizationState','AUTHORIZED','sourceBindingStatus','ACTIVE','licenseStatus',lic.status,'sourceResolution','SOURCE_READY','sourceReused',true);
 ELSE
   result:=public.rpc_manager_complete_device_activation(args->>'p_display_code',args->>'p_activation_key_hash',
     nullif(args->>'p_license_id','')::uuid,args->>'p_source_id',args->>'p_source_type',args->>'p_display_name',
     args->>'p_ciphertext',args->>'p_nonce',args->>'p_auth_tag',coalesce(args->>'p_key_version','v1'),
     nullif(args->>'p_customer_id','')::uuid,flow,args->>'p_new_customer_name',args->>'p_existing_display_code');
   IF result->>'success' IS DISTINCT FROM 'true' OR result->>'deviceId' IS DISTINCT FROM new_device THEN RAISE EXCEPTION 'REMOTE_MANAGER_MUTATION_FAILED'; END IF;
   license:=(result->>'licenseId')::uuid;
   limits:=public.rpc_manager_update_license_limits(license,p_max_devices,p_max_sessions,'Manager confirmed capacity during device registration');
   IF limits->>'success' IS DISTINCT FROM 'true' THEN RAISE EXCEPTION 'REMOTE_MANAGER_MUTATION_FAILED'; END IF;
   PERFORM public.rpc_manager_license_device(license,result->>'displayCode',trim(p_device_label));
 END IF;
 SELECT * INTO existing FROM private.manager_device_relationships WHERE license_id=license AND device_id=new_device;
 IF FOUND AND (existing.device_role IS DISTINCT FROM role_code OR existing.primary_device_id IS DISTINCT FROM main_device) THEN RAISE EXCEPTION 'DEVICE_ROLE_CONFLICT'; END IF;
 IF main_device IS NOT NULL THEN
   INSERT INTO private.manager_device_relationships(license_id,device_id,device_role,manager_id) VALUES(license,main_device,'PRIMARY',manager) ON CONFLICT DO NOTHING;
 END IF;
 INSERT INTO private.manager_device_relationships(license_id,device_id,device_role,primary_device_id,manager_id)
 VALUES(license,new_device,role_code,main_device,manager) ON CONFLICT DO NOTHING;
 INSERT INTO public.commercial_audit_logs(manager_id,action,target_type,target_id,reason)
 VALUES(manager,'LICENSE_DEVICE_UPDATED','LICENSE',license::text,'Manager confirmed principal/secondary relation');
 RETURN result||jsonb_build_object('deviceLabel',trim(p_device_label),'maxDevices',p_max_devices,'maxConcurrentSessions',p_max_sessions,'deviceRole',role_code,'primaryDisplayCode',nullif(main_code,''));
END; $$;
REVOKE ALL ON FUNCTION public.rpc_manager_activate_device_configured(JSONB,TEXT,INTEGER,INTEGER,TEXT,TEXT) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.rpc_manager_activate_device_configured(JSONB,TEXT,INTEGER,INTEGER,TEXT,TEXT) TO authenticated;


-- C80 refinement: a manager explicitly moves a registered device to a principal.
-- No migration-time data mutation; authenticated manager scope is checked on both ends.
CREATE OR REPLACE FUNCTION public.rpc_manager_link_license_device(p_license_id UUID,p_display_code TEXT,p_primary_display_code TEXT,
 p_device_label TEXT,p_max_devices INTEGER,p_max_sessions INTEGER,p_device_role TEXT,p_registered BOOLEAN,p_key_hash TEXT DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_manager UUID; v_license RECORD; v_pair JSONB; v_device RECORD; v_main TEXT; v_device_id TEXT;
 v_main_role TEXT; v_source TEXT; v_internal_source UUID; v_version INTEGER; v_count INTEGER; v_limits JSONB; v_old_licenses JSONB;
 v_code TEXT:=upper(trim(coalesce(p_display_code,''))); v_main_code TEXT:=upper(trim(coalesce(p_primary_display_code,'')));
 v_role TEXT:=upper(trim(coalesce(p_device_role,''))); v_type TEXT; v_token TEXT;
BEGIN
 v_manager:=private.require_active_manager();
 IF NOT private.manager_can_license(p_license_id) THEN RAISE EXCEPTION 'MANAGER_SCOPE_DENIED' USING ERRCODE='42501'; END IF;
 IF v_code !~ '^XF-[0-9A-Z]{4}-[0-9A-Z]{4}$' THEN RAISE EXCEPTION 'DISPLAY_CODE_INVALID'; END IF;
 IF length(trim(coalesce(p_device_label,''))) NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'INVALID_DEVICE_LABEL'; END IF;
 IF p_registered IS NULL OR v_role NOT IN ('PRIMARY','SECONDARY') OR (p_registered AND v_role<>'SECONDARY') THEN RAISE EXCEPTION 'INVALID_DEVICE_ROLE'; END IF;
 IF p_max_devices IS NULL OR p_max_devices NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'INVALID_MAX_DEVICES'; END IF;
 IF p_max_sessions IS NULL OR p_max_sessions NOT BETWEEN 1 AND 50 THEN RAISE EXCEPTION 'INVALID_MAX_CONCURRENT_SESSIONS'; END IF;
 IF p_max_sessions>p_max_devices THEN RAISE EXCEPTION 'CONCURRENT_LIMIT_EXCEEDS_DEVICES'; END IF;
 IF v_role='SECONDARY' AND v_main_code !~ '^XF-[0-9A-Z]{4}-[0-9A-Z]{4}$' THEN RAISE EXCEPTION 'PRIMARY_DEVICE_REQUIRED'; END IF;
 IF v_main_code=v_code THEN RAISE EXCEPTION 'PRIMARY_DEVICE_INVALID'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('signal-policy-write',0));
 SELECT * INTO v_license FROM public.licenses WHERE id=p_license_id FOR UPDATE;
 IF NOT FOUND OR v_license.status NOT IN ('ACTIVE','TRIAL') OR v_license.expires_at<=now() OR (v_license.status='TRIAL' AND v_license.trial_expires_at<=now()) THEN RAISE EXCEPTION 'LICENSE_NOT_ACTIVE'; END IF;
 IF p_registered AND (p_max_devices<>v_license.max_devices OR p_max_sessions<>v_license.max_concurrent_sessions) THEN RAISE EXCEPTION 'VERSION_CONFLICT'; END IF;
 SELECT d.device_id,r.device_role INTO v_main,v_main_role FROM public.license_devices ld JOIN public.devices d ON d.device_id=ld.device_id
 LEFT JOIN private.manager_device_relationships r ON r.license_id=ld.license_id AND r.device_id=ld.device_id
 WHERE ld.license_id=p_license_id AND ld.status='ACTIVE' AND d.status='AUTHORIZED' AND coalesce(r.device_role,'PRIMARY')='PRIMARY'
   AND (v_main_code='' OR d.display_code=v_main_code) AND d.display_code<>v_code ORDER BY ld.bound_at,d.device_id LIMIT 1;
 IF v_main IS NULL OR v_main_role='SECONDARY' THEN RAISE EXCEPTION 'PRIMARY_DEVICE_INVALID'; END IF;
 IF p_registered THEN
   SELECT * INTO v_device FROM public.devices WHERE display_code=v_code FOR UPDATE;
   IF NOT FOUND OR v_device.status<>'AUTHORIZED' THEN RAISE EXCEPTION 'REGISTERED_DEVICE_REQUIRED'; END IF;
   v_device_id:=v_device.device_id;
   IF NOT EXISTS(SELECT 1 FROM public.license_devices WHERE device_id=v_device_id) THEN RAISE EXCEPTION 'REGISTERED_DEVICE_REQUIRED'; END IF;
   IF EXISTS(SELECT 1 FROM public.license_devices ld WHERE ld.device_id=v_device_id AND NOT private.manager_can_license(ld.license_id)) THEN RAISE EXCEPTION 'MANAGER_SCOPE_DENIED' USING ERRCODE='42501'; END IF;
   IF EXISTS(SELECT 1 FROM private.manager_device_relationships WHERE primary_device_id=v_device_id AND device_id<>v_device_id) THEN RAISE EXCEPTION 'PRIMARY_HAS_SECONDARIES'; END IF;
 ELSE
   PERFORM private.manager_check_scope('rpc_manager_complete_device_activation',jsonb_build_object('p_license_id',p_license_id,'p_display_code',v_code));
   v_pair:=public.rpc_claim_device_key(v_code,p_key_hash); v_device_id:=v_pair->>'deviceId'; v_token:=v_pair->>'deviceTokenHash'; v_type:=v_pair->>'deviceType';
   IF v_pair->>'valid' IS DISTINCT FROM 'true' OR v_device_id IS NULL OR v_token IS NULL THEN RAISE EXCEPTION 'INVALID_ACTIVATION_KEY' USING ERRCODE='42501'; END IF;
   IF EXISTS(SELECT 1 FROM public.license_devices WHERE device_id=v_device_id) THEN RAISE EXCEPTION 'DEVICE_ALREADY_BOUND_USE_SWITCH'; END IF;
   IF EXISTS(SELECT 1 FROM public.devices WHERE device_id=v_device_id AND status='REVOKED') THEN RAISE EXCEPTION 'DEVICE_REVOKED_REQUIRES_REACTIVATION'; END IF;
 END IF;
 IF v_device_id=v_main THEN RAISE EXCEPTION 'PRIMARY_DEVICE_INVALID'; END IF;
 IF v_license.mode='MANAGED' THEN
   SELECT ms.source_id,ms.id,ms.version INTO v_source,v_internal_source,v_version
   FROM public.device_source_bindings b JOIN public.managed_sources ms ON ms.id=b.source_id
   WHERE b.license_id=p_license_id AND b.device_id=v_main AND ms.status='ACTIVE';
 ELSE
   IF (SELECT count(*) FROM public.customer_sources WHERE license_id=p_license_id AND status='ACTIVE')<>1 THEN RAISE EXCEPTION 'CUSTOMER_SOURCE_AMBIGUOUS'; END IF;
   SELECT source_id,version INTO v_source,v_version FROM public.customer_sources WHERE license_id=p_license_id AND status='ACTIVE';
 END IF;
 IF v_source IS NULL THEN RAISE EXCEPTION 'CUSTOMER_HAS_NO_ACTIVE_SOURCE'; END IF;
 SELECT count(*) INTO v_count FROM public.license_devices WHERE license_id=p_license_id AND status='ACTIVE' AND device_id<>v_device_id;
 IF v_count>=p_max_devices THEN RAISE EXCEPTION 'LICENSE_DEVICE_LIMIT_REACHED'; END IF;
 -- Explicit manager capacity approval precedes the constrained limit update.
 IF v_license.mode='SELF_SERVICE' THEN
   UPDATE public.licenses SET manager_approved_additional_devices=greatest(manager_approved_additional_devices,p_max_devices-1) WHERE id=p_license_id;
 END IF;
 v_limits:=public.rpc_manager_update_license_limits(p_license_id,p_max_devices,p_max_sessions,'Manager confirmed device link capacity');
 IF v_limits->>'success' IS DISTINCT FROM 'true' THEN RAISE EXCEPTION 'REMOTE_MANAGER_MUTATION_FAILED'; END IF;
 SELECT coalesce(jsonb_agg(license_id ORDER BY license_id),'[]') INTO v_old_licenses FROM public.license_devices WHERE device_id=v_device_id;
 -- Transfer only the selected device. Other customer devices and source vaults survive.
 UPDATE public.playback_sessions SET status='CLOSED',closed_at=now(),close_reason='DEVICE_PRINCIPAL_LINK_CHANGED' WHERE device_id=v_device_id AND status='ACTIVE';
 DELETE FROM private.additional_signal_device_approvals WHERE device_id=v_device_id AND license_id<>p_license_id;
 DELETE FROM public.license_devices WHERE device_id=v_device_id AND license_id<>p_license_id;
 IF p_registered THEN
   UPDATE public.devices SET device_label=trim(p_device_label) WHERE device_id=v_device_id;
 ELSE
   INSERT INTO public.devices(device_id,display_code,device_type,device_label,status,device_token_hash,last_seen_at)
   VALUES(v_device_id,v_code,coalesce(v_type,'OTHER'),trim(p_device_label),'AUTHORIZED',v_token,now())
   ON CONFLICT(device_id) DO UPDATE SET device_label=excluded.device_label,status='AUTHORIZED',device_token_hash=excluded.device_token_hash;
 END IF;
 INSERT INTO public.license_devices(license_id,device_id,status,bound_at) VALUES(p_license_id,v_device_id,'ACTIVE',now())
 ON CONFLICT(license_id,device_id) DO UPDATE SET status='ACTIVE',revoked_at=NULL;
 IF v_license.mode='MANAGED' THEN
   INSERT INTO public.device_source_bindings(license_id,device_id,source_id) VALUES(p_license_id,v_device_id,v_internal_source)
   ON CONFLICT(device_id) DO UPDATE SET license_id=excluded.license_id,source_id=excluded.source_id;
 ELSE
   DELETE FROM public.device_source_bindings WHERE device_id=v_device_id;
   INSERT INTO private.additional_signal_device_approvals(license_id,device_id,source_id,source_version,approved_by)
   VALUES(p_license_id,v_device_id,v_source,v_version,v_manager) ON CONFLICT(license_id,device_id) DO UPDATE SET
   source_id=excluded.source_id,source_version=excluded.source_version,approved_by=excluded.approved_by,approved_at=now();
   UPDATE public.licenses SET manager_approved_additional_devices=greatest(manager_approved_additional_devices,v_count) WHERE id=p_license_id;
 END IF;
 IF v_role='SECONDARY' THEN
   INSERT INTO private.manager_device_relationships(license_id,device_id,device_role,manager_id) VALUES(p_license_id,v_main,'PRIMARY',v_manager) ON CONFLICT DO NOTHING;
 END IF;
 INSERT INTO private.manager_device_relationships(license_id,device_id,device_role,primary_device_id,manager_id)
 VALUES(p_license_id,v_device_id,v_role,CASE WHEN v_role='SECONDARY' THEN v_main ELSE NULL END,v_manager)
 ON CONFLICT(license_id,device_id) DO UPDATE SET device_role=excluded.device_role,primary_device_id=excluded.primary_device_id,manager_id=excluded.manager_id;
 UPDATE public.device_activation_requests SET linked_license_id=p_license_id,linked_source_id=v_source,
   customer_account_id=v_license.customer_account_id,claimed_by_customer_id=v_license.customer_id,
   status='CONSUMED',claimed_at=coalesce(claimed_at,now()) WHERE device_id=v_device_id AND status IN ('PENDING','CONSUMED');
 INSERT INTO public.commercial_audit_logs(manager_id,action,target_type,target_id,reason)
 VALUES(v_manager,'LICENSE_DEVICE_UPDATED','LICENSE',p_license_id::text,jsonb_build_object('operation','EXPLICIT_DEVICE_LINK','deviceId',v_device_id,'previousLicenses',v_old_licenses,'deviceRole',v_role,'principal',CASE WHEN v_role='SECONDARY' THEN v_main ELSE NULL END)::text);
 RETURN jsonb_build_object('success',true);
END; $$;
REVOKE ALL ON FUNCTION public.rpc_manager_link_license_device(UUID,TEXT,TEXT,TEXT,INTEGER,INTEGER,TEXT,BOOLEAN,TEXT) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.rpc_manager_link_license_device(UUID,TEXT,TEXT,TEXT,INTEGER,INTEGER,TEXT,BOOLEAN,TEXT) TO authenticated;
NOTIFY pgrst,'reload schema';

CREATE OR REPLACE FUNCTION public.rpc_manager_update_license_limits(p_license_id UUID,p_max_devices INTEGER,p_max_concurrent_sessions INTEGER,p_reason TEXT DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_args JSONB:=jsonb_build_object('p_license_id',p_license_id,'p_max_devices',p_max_devices,'p_max_concurrent_sessions',p_max_concurrent_sessions,'p_reason',p_reason); v_result JSONB;
BEGIN
 PERFORM private.manager_check_scope('rpc_manager_update_license_limits',v_args);
 IF p_max_concurrent_sessions>p_max_devices THEN RAISE EXCEPTION 'CONCURRENT_LIMIT_EXCEEDS_DEVICES'; END IF;
 v_result:=private.c70_rpc_manager_update_license_limits(p_license_id,p_max_devices,p_max_concurrent_sessions,p_reason);
 RETURN private.manager_scope_result('rpc_manager_update_license_limits',v_args,v_result);
END; $$;
REVOKE ALL ON FUNCTION public.rpc_manager_update_license_limits(UUID,INTEGER,INTEGER,TEXT) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.rpc_manager_update_license_limits(UUID,INTEGER,INTEGER,TEXT) TO authenticated;
NOTIFY pgrst,'reload schema';
