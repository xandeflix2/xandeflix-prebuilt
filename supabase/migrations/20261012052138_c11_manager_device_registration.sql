-- C80: explicit device role and descriptive registration. No real-data backfill.
CREATE TABLE private.manager_device_relationships (
 license_id UUID NOT NULL,
 device_id TEXT NOT NULL,
 device_role TEXT NOT NULL CHECK (device_role IN ('PRIMARY','SECONDARY')),
 primary_device_id TEXT,
 manager_id UUID NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 PRIMARY KEY(license_id,device_id),
 FOREIGN KEY(license_id,device_id) REFERENCES public.license_devices(license_id,device_id) ON DELETE CASCADE,
 FOREIGN KEY(license_id,primary_device_id) REFERENCES public.license_devices(license_id,device_id) ON DELETE CASCADE,
 CHECK ((device_role='PRIMARY' AND primary_device_id IS NULL) OR
        (device_role='SECONDARY' AND primary_device_id IS NOT NULL AND primary_device_id<>device_id))
);
CREATE INDEX manager_device_relationships_primary_idx ON private.manager_device_relationships(license_id,primary_device_id) WHERE primary_device_id IS NOT NULL;
ALTER TABLE private.manager_device_relationships ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.manager_device_relationships FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION public.rpc_manager_activate_device_configured(p_activation JSONB,p_device_label TEXT,
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

CREATE OR REPLACE FUNCTION private.license_console_devices(p_license UUID) RETURNS JSONB
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT coalesce(jsonb_agg(jsonb_build_object('deviceId',d.device_id,'displayCode',d.display_code,
 'deviceLabel',d.device_label,'deviceType',coalesce(i.device_type,d.device_type),
 'platform',coalesce(i.platform,'OTHER'),'lastSeenAt',greatest(d.last_seen_at,i.last_seen_at),
 'status',d.status,'boundAt',ld.bound_at,'licenseBindingStatus',ld.status,'deviceRole',r.device_role,'primaryDisplayCode',pd.display_code)
 ORDER BY ld.bound_at,d.device_id),'[]'::jsonb)
 FROM public.license_devices ld JOIN public.devices d ON d.device_id=ld.device_id
 LEFT JOIN private.manager_device_relationships r ON r.license_id=ld.license_id AND r.device_id=ld.device_id
 LEFT JOIN public.devices pd ON pd.device_id=r.primary_device_id
 LEFT JOIN LATERAL (SELECT a.platform,a.device_type,a.last_seen_at FROM public.app_installations a
 WHERE a.device_id=d.device_id AND a.package_name='com.xandeflix.prebuilt'
 ORDER BY a.last_seen_at DESC,a.installation_id LIMIT 1) i ON true WHERE ld.license_id=p_license;
$$;
REVOKE ALL ON FUNCTION private.license_console_devices(UUID) FROM PUBLIC,anon,authenticated,service_role;
NOTIFY pgrst,'reload schema';
