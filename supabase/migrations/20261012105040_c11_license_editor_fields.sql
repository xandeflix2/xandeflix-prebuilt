-- C83: administrative metadata only; no real-row backfill, identity or vault rewrite.
CREATE TABLE private.license_device_slots (
 license_id uuid NOT NULL, device_id text NOT NULL, slot_number integer NOT NULL CHECK(slot_number BETWEEN 1 AND 100),
 PRIMARY KEY(license_id,device_id), UNIQUE(license_id,slot_number),
 FOREIGN KEY(license_id,device_id) REFERENCES public.license_devices(license_id,device_id) ON DELETE CASCADE
);
CREATE TABLE private.manager_device_presentation (
 device_id text PRIMARY KEY REFERENCES public.devices(device_id) ON DELETE CASCADE,
 platform text NOT NULL CHECK(platform IN ('ANDROID','IOS','TIZEN','WEBOS','WEB','OTHER')),
 device_type text NOT NULL CHECK(device_type IN ('TV','PHONE','TABLET','PC','OTHER')),
 updated_by uuid NOT NULL REFERENCES auth.users(id), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE private.license_role_operations (
 transaction_id bigint NOT NULL, device_id text NOT NULL, PRIMARY KEY(transaction_id,device_id)
);
ALTER TABLE private.license_device_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.manager_device_presentation ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.license_role_operations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.license_device_slots,private.manager_device_presentation,private.license_role_operations FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION private.assign_license_slots(p_license uuid,p_device text DEFAULT NULL,p_slot integer DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $function$
DECLARE capacity integer; candidate integer; member record;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended('signal-policy-write',0));
 SELECT max_devices INTO capacity FROM public.licenses WHERE id=p_license FOR UPDATE;
 DELETE FROM private.license_device_slots s WHERE s.license_id=p_license AND NOT EXISTS
 (SELECT 1 FROM public.license_devices ld WHERE ld.license_id=s.license_id AND ld.device_id=s.device_id AND ld.status='ACTIVE');
 IF p_slot IS NOT NULL THEN
   IF p_slot NOT BETWEEN 1 AND capacity THEN RAISE EXCEPTION 'INVALID_DEVICE_SLOT'; END IF;
   IF NOT EXISTS(SELECT 1 FROM public.license_devices WHERE license_id=p_license AND device_id=p_device AND status='ACTIVE') THEN RAISE EXCEPTION 'REGISTERED_DEVICE_REQUIRED'; END IF;
   IF EXISTS(SELECT 1 FROM private.license_device_slots WHERE license_id=p_license AND slot_number=p_slot AND device_id<>p_device) THEN RAISE EXCEPTION 'DEVICE_SLOT_OCCUPIED'; END IF;
   INSERT INTO private.license_device_slots VALUES(p_license,p_device,p_slot)
   ON CONFLICT(license_id,device_id) DO UPDATE SET slot_number=excluded.slot_number;
 END IF;
 FOR member IN SELECT ld.device_id FROM public.license_devices ld LEFT JOIN private.manager_device_relationships r
 ON r.license_id=ld.license_id AND r.device_id=ld.device_id WHERE ld.license_id=p_license AND ld.status='ACTIVE'
 ORDER BY (r.device_role='PRIMARY') DESC NULLS LAST,ld.bound_at,ld.device_id LOOP
   IF NOT EXISTS(SELECT 1 FROM private.license_device_slots WHERE license_id=p_license AND device_id=member.device_id) THEN
     SELECT min(g.n) INTO candidate FROM generate_series(1,capacity) g(n) WHERE NOT EXISTS
     (SELECT 1 FROM private.license_device_slots WHERE license_id=p_license AND slot_number=g.n);
     IF candidate IS NULL THEN RAISE EXCEPTION 'LICENSE_DEVICE_LIMIT_REACHED'; END IF;
     INSERT INTO private.license_device_slots VALUES(p_license,member.device_id,candidate);
   END IF;
 END LOOP;
END; $function$;
REVOKE ALL ON FUNCTION private.assign_license_slots(uuid,text,integer) FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION private.sync_license_slots() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $function$
BEGIN
 IF NEW.status='ACTIVE' THEN PERFORM private.assign_license_slots(NEW.license_id);
 ELSE DELETE FROM private.license_device_slots WHERE license_id=NEW.license_id AND device_id=NEW.device_id; END IF;
 RETURN NEW;
END; $function$;
REVOKE ALL ON FUNCTION private.sync_license_slots() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER c83_license_slots AFTER INSERT OR UPDATE OF status ON public.license_devices
FOR EACH ROW EXECUTE FUNCTION private.sync_license_slots();

CREATE FUNCTION private.guard_slot_capacity() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $function$
BEGIN
 IF NEW.max_devices<OLD.max_devices AND EXISTS(SELECT 1 FROM private.license_device_slots WHERE license_id=NEW.id AND slot_number>NEW.max_devices)
 THEN RAISE EXCEPTION 'DEVICE_SLOT_OUTSIDE_LIMIT'; END IF;
 RETURN NEW;
END; $function$;
REVOKE ALL ON FUNCTION private.guard_slot_capacity() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER c83_slot_capacity BEFORE UPDATE OF max_devices ON public.licenses FOR EACH ROW EXECUTE FUNCTION private.guard_slot_capacity();

CREATE OR REPLACE FUNCTION private.guard_principal_relationship() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $function$
BEGIN
 IF TG_OP='UPDATE' AND OLD.device_role='PRIMARY' AND NEW.device_role='SECONDARY' AND NOT EXISTS
 (SELECT 1 FROM private.license_role_operations WHERE transaction_id=txid_current() AND device_id=NEW.device_id)
 THEN RAISE EXCEPTION 'PRIMARY_CANNOT_BECOME_SECONDARY'; END IF;
 IF NEW.device_role='SECONDARY' THEN
   IF EXISTS(SELECT 1 FROM private.manager_device_relationships WHERE primary_device_id=NEW.device_id) THEN RAISE EXCEPTION 'PRIMARY_HAS_SECONDARIES'; END IF;
   IF NOT EXISTS(SELECT 1 FROM private.manager_device_relationships WHERE license_id=NEW.license_id AND device_id=NEW.primary_device_id AND device_role='PRIMARY') THEN RAISE EXCEPTION 'PRIMARY_DEVICE_INVALID'; END IF;
 END IF;
 RETURN NEW;
END; $function$;

CREATE FUNCTION public.rpc_manager_edit_license_customer(p_license_id uuid,p_customer_id uuid,p_name text,p_expected_name text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $function$
DECLARE manager uuid; lic public.licenses; previous text;
BEGIN
 manager:=private.require_active_manager();
 IF NOT private.manager_can_license(p_license_id) THEN RAISE EXCEPTION 'MANAGER_SCOPE_DENIED' USING ERRCODE='42501'; END IF;
 IF length(trim(coalesce(p_name,''))) NOT BETWEEN 1 AND 100 OR p_name ~ '[[:cntrl:]]' THEN RAISE EXCEPTION 'INVALID_CUSTOMER_NAME'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('signal-policy-write',0));
 SELECT * INTO lic FROM public.licenses WHERE id=p_license_id FOR UPDATE;
 IF p_customer_id IS NULL OR coalesce(lic.customer_account_id,lic.customer_id) IS DISTINCT FROM p_customer_id
 THEN RAISE EXCEPTION 'MANAGER_SCOPE_DENIED' USING ERRCODE='42501'; END IF;
 IF EXISTS(SELECT 1 FROM public.licenses WHERE (customer_account_id=p_customer_id OR customer_id=p_customer_id) AND NOT private.manager_can_license(id))
 THEN RAISE EXCEPTION 'MANAGER_SCOPE_DENIED' USING ERRCODE='42501'; END IF;
 IF lic.customer_account_id IS NOT NULL THEN
   SELECT display_name INTO previous FROM public.customer_accounts WHERE id=p_customer_id FOR UPDATE;
 ELSE SELECT nickname INTO previous FROM public.customer_profiles WHERE id=p_customer_id FOR UPDATE; END IF;
 IF previous IS DISTINCT FROM p_expected_name THEN RAISE EXCEPTION 'CUSTOMER_NAME_CONFLICT'; END IF;
 UPDATE public.customer_accounts SET display_name=trim(p_name),updated_at=now() WHERE id=p_customer_id;
 UPDATE public.customer_profiles SET nickname=trim(p_name),updated_at=now() WHERE id=p_customer_id;
 INSERT INTO public.commercial_audit_logs(manager_id,action,target_type,target_id,before_state,after_state,reason)
 VALUES(manager,'LICENSE_DEVICE_UPDATED','CUSTOMER',p_customer_id::text,jsonb_build_object('nickname',previous),jsonb_build_object('nickname',trim(p_name)),
 jsonb_build_object('operation','CUSTOMER_NAME_EDIT','licenseId',p_license_id)::text);
 RETURN jsonb_build_object('success',true);
END; $function$;
REVOKE ALL ON FUNCTION public.rpc_manager_edit_license_customer(uuid,uuid,text,text) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.rpc_manager_edit_license_customer(uuid,uuid,text,text) TO authenticated;

CREATE FUNCTION public.rpc_manager_edit_license_device(
 p_license_id uuid,p_display_code text,p_label text,p_platform text,p_device_type text,
 p_expected_role text,p_role text,p_primary_license_id uuid DEFAULT NULL,p_primary_code text DEFAULT NULL,
 p_slot integer DEFAULT NULL,p_role_confirmed boolean DEFAULT false,p_tree_plan jsonb DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $function$
DECLARE manager uuid; device text; v_role_before text; parent text; destination uuid; target public.licenses; result jsonb; before_data jsonb;
 children jsonb; expected_children jsonb; child record; child_destination uuid; child_principal text; child_capacity integer; child_sessions integer; moving text[]; main_slot integer;
BEGIN
 manager:=private.require_active_manager();
 IF NOT private.manager_can_license(p_license_id) THEN RAISE EXCEPTION 'MANAGER_SCOPE_DENIED' USING ERRCODE='42501'; END IF;
 IF p_display_code IS NULL OR p_display_code !~ '^XF-[0-9A-Z]{4}-[0-9A-Z]{4}$' THEN RAISE EXCEPTION 'DISPLAY_CODE_INVALID'; END IF;
 IF length(trim(coalesce(p_label,''))) NOT BETWEEN 1 AND 100 OR p_label ~ '[[:cntrl:]]' THEN RAISE EXCEPTION 'INVALID_DEVICE_LABEL'; END IF;
 IF p_platform IS NULL OR p_platform NOT IN ('ANDROID','IOS','TIZEN','WEBOS','WEB','OTHER') THEN RAISE EXCEPTION 'INVALID_DEVICE_PLATFORM'; END IF;
 IF p_device_type IS NULL OR p_device_type NOT IN ('TV','PHONE','TABLET','PC','OTHER') THEN RAISE EXCEPTION 'INVALID_DEVICE_TYPE'; END IF;
 IF p_role IS NULL OR p_role NOT IN ('','PRIMARY','SECONDARY') THEN RAISE EXCEPTION 'INVALID_DEVICE_ROLE'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('signal-policy-write',0));
 SELECT d.device_id INTO device FROM public.license_devices ld JOIN public.devices d ON d.device_id=ld.device_id
 WHERE ld.license_id=p_license_id AND ld.status='ACTIVE' AND d.status='AUTHORIZED' AND d.display_code=p_display_code FOR UPDATE OF d;
 IF device IS NULL THEN RAISE EXCEPTION 'REGISTERED_DEVICE_REQUIRED'; END IF;
 IF EXISTS(SELECT 1 FROM public.license_devices WHERE device_id=device AND NOT private.manager_can_license(license_id))
 THEN RAISE EXCEPTION 'MANAGER_SCOPE_DENIED' USING ERRCODE='42501'; END IF;
 SELECT r.device_role,pd.display_code INTO v_role_before,parent FROM private.manager_device_relationships r
 LEFT JOIN public.devices pd ON pd.device_id=r.primary_device_id WHERE r.license_id=p_license_id AND r.device_id=device;
 IF coalesce(v_role_before,'') IS DISTINCT FROM p_expected_role THEN RAISE EXCEPTION 'DEVICE_ROLE_CONFLICT'; END IF;
 IF p_role='' AND v_role_before IS NOT NULL THEN RAISE EXCEPTION 'INVALID_DEVICE_ROLE'; END IF;
 destination:=CASE WHEN p_role='SECONDARY' THEN coalesce(p_primary_license_id,p_license_id) ELSE p_license_id END;
 IF p_role<>coalesce(v_role_before,'') OR (p_role='SECONDARY' AND (parent IS DISTINCT FROM p_primary_code OR destination<>p_license_id)) THEN
   IF p_role_confirmed IS DISTINCT FROM true THEN RAISE EXCEPTION 'DEVICE_ROLE_CONFIRMATION_REQUIRED'; END IF;
 END IF;
 SELECT jsonb_build_object('deviceLabel',d.device_label,'deviceRole',v_role_before,'primaryCode',parent,'slot',s.slot_number,
 'platform',m.platform,'deviceType',m.device_type) INTO before_data FROM public.devices d
 LEFT JOIN private.license_device_slots s ON s.device_id=d.device_id AND s.license_id=p_license_id
 LEFT JOIN private.manager_device_presentation m ON m.device_id=d.device_id WHERE d.device_id=device;
 IF p_role='PRIMARY' AND v_role_before IS DISTINCT FROM 'PRIMARY' THEN
   PERFORM public.rpc_manager_promote_license_device(p_license_id,p_display_code);
 ELSIF p_role='SECONDARY' THEN
   IF p_primary_code IS NULL OR p_primary_code !~ '^XF-[0-9A-Z]{4}-[0-9A-Z]{4}$' THEN RAISE EXCEPTION 'PRIMARY_DEVICE_REQUIRED'; END IF;
   IF NOT private.manager_can_license(destination) THEN RAISE EXCEPTION 'MANAGER_SCOPE_DENIED' USING ERRCODE='42501'; END IF;
   IF v_role_before IS DISTINCT FROM 'SECONDARY' OR parent IS DISTINCT FROM p_primary_code OR destination<>p_license_id THEN
     SELECT * INTO target FROM public.licenses WHERE id=destination FOR UPDATE;
     IF EXISTS(SELECT 1 FROM private.manager_device_relationships WHERE primary_device_id=device) THEN
       IF p_tree_plan IS NULL THEN RAISE EXCEPTION 'PRIMARY_HAS_SECONDARIES'; END IF;
       IF coalesce(p_tree_plan->>'mode','') NOT IN ('MOVE_ALL','KEEP_ACCOUNT') OR jsonb_typeof(p_tree_plan->'expectedChildren') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'DEVICE_TREE_CONFIRMATION_REQUIRED'; END IF;
       SELECT coalesce(jsonb_agg(d.display_code ORDER BY d.display_code),'[]'::jsonb),array_agg(r.device_id)
       INTO children,moving FROM private.manager_device_relationships r JOIN public.devices d ON d.device_id=r.device_id WHERE r.primary_device_id=device;
       SELECT coalesce(jsonb_agg(c.value ORDER BY c.value),'[]'::jsonb) INTO expected_children FROM jsonb_array_elements_text(p_tree_plan->'expectedChildren') c(value);
       IF children IS DISTINCT FROM expected_children THEN RAISE EXCEPTION 'DEVICE_TREE_CHANGED'; END IF;
       IF EXISTS(SELECT 1 FROM private.manager_device_relationships WHERE primary_device_id=device AND NOT private.manager_can_license(license_id)) THEN RAISE EXCEPTION 'MANAGER_SCOPE_DENIED' USING ERRCODE='42501'; END IF;
       IF p_tree_plan->>'mode'='KEEP_ACCOUNT' THEN
         child_destination:=p_license_id; child_principal:=p_tree_plan->>'retainedPrincipalCode';
       ELSE child_destination:=destination; child_principal:=p_primary_code; END IF;
       IF child_principal IS NULL OR child_principal=p_display_code OR NOT EXISTS(SELECT 1 FROM private.manager_device_relationships r
         JOIN public.devices d ON d.device_id=r.device_id JOIN public.license_devices ld ON ld.license_id=r.license_id AND ld.device_id=r.device_id
         WHERE r.license_id=child_destination AND d.display_code=child_principal AND r.device_role='PRIMARY' AND d.status='AUTHORIZED' AND ld.status='ACTIVE')
       THEN RAISE EXCEPTION 'PRIMARY_DEVICE_INVALID'; END IF;
       SELECT max_devices,max_concurrent_sessions INTO child_capacity,child_sessions FROM public.licenses WHERE id=child_destination FOR UPDATE;
       IF p_tree_plan->>'mode'='MOVE_ALL' AND (SELECT count(*) FROM public.license_devices WHERE license_id=destination AND status='ACTIVE'
         AND device_id<>device AND NOT(device_id=ANY(moving)))+cardinality(moving)+1>target.max_devices THEN RAISE EXCEPTION 'LICENSE_DEVICE_LIMIT_REACHED'; END IF;
       IF p_slot IS NOT NULL AND (p_slot NOT BETWEEN 1 AND target.max_devices OR EXISTS(SELECT 1 FROM private.license_device_slots
         WHERE license_id=destination AND slot_number=p_slot AND device_id<>device AND NOT(device_id=ANY(moving)))) THEN RAISE EXCEPTION 'DEVICE_SLOT_OCCUPIED'; END IF;
       -- Reserve a valid main slot before moving children into the destination.
       IF p_tree_plan->>'mode'='MOVE_ALL' THEN
         main_slot:=p_slot;
         IF main_slot IS NULL THEN SELECT min(g.n) INTO main_slot FROM generate_series(1,target.max_devices)g(n) WHERE NOT EXISTS
           (SELECT 1 FROM private.license_device_slots WHERE license_id=destination AND slot_number=g.n AND device_id<>device AND NOT(device_id=ANY(moving))); END IF;
       END IF;
       FOR child IN SELECT r.license_id,r.device_id,d.display_code,d.device_label FROM private.manager_device_relationships r JOIN public.devices d ON d.device_id=r.device_id
         WHERE r.primary_device_id=device ORDER BY r.device_id LOOP
         PERFORM public.rpc_manager_link_license_device(child_destination,child.display_code,child_principal,child.device_label,child_capacity,child_sessions,'SECONDARY',true);
         -- Keep the requested main slot free while assigning children.
         IF main_slot IS NOT NULL AND EXISTS(SELECT 1 FROM private.license_device_slots WHERE license_id=destination AND device_id=child.device_id AND slot_number=main_slot) THEN
           SELECT min(g.n) INTO child_capacity FROM generate_series(1,target.max_devices)g(n) WHERE g.n<>main_slot AND NOT EXISTS
             (SELECT 1 FROM private.license_device_slots WHERE license_id=destination AND slot_number=g.n);
           IF child_capacity IS NULL THEN RAISE EXCEPTION 'LICENSE_DEVICE_LIMIT_REACHED'; END IF;
           UPDATE private.license_device_slots SET slot_number=child_capacity WHERE license_id=destination AND device_id=child.device_id;
           child_capacity:=target.max_devices;
         END IF;
       END LOOP;
     END IF;
     INSERT INTO private.license_role_operations VALUES(txid_current(),device);
     result:=public.rpc_manager_link_license_device(destination,p_display_code,p_primary_code,p_label,target.max_devices,target.max_concurrent_sessions,'SECONDARY',true);
     DELETE FROM private.license_role_operations WHERE transaction_id=txid_current() AND device_id=device;
   END IF;
 ELSE destination:=p_license_id;
 END IF;
 IF p_role<>'SECONDARY' AND p_slot IS NOT NULL
 THEN RAISE EXCEPTION 'PRIMARY_SLOT_READ_ONLY'; END IF;
 PERFORM private.assign_license_slots(destination,device,p_slot);
 UPDATE public.devices SET device_label=trim(p_label) WHERE device_id=device;
 INSERT INTO private.manager_device_presentation VALUES(device,p_platform,p_device_type,manager,now())
 ON CONFLICT(device_id) DO UPDATE SET platform=excluded.platform,device_type=excluded.device_type,updated_by=excluded.updated_by,updated_at=now();
 INSERT INTO public.commercial_audit_logs(manager_id,action,target_type,target_id,before_state,after_state,reason)
 VALUES(manager,'LICENSE_DEVICE_UPDATED','LICENSE',destination::text,before_data,jsonb_build_object('deviceId',device,'deviceLabel',trim(p_label),
 'platform',p_platform,'deviceType',p_device_type,'deviceRole',p_role,'primaryCode',p_primary_code,'treePlan',p_tree_plan,'slot',
 (SELECT slot_number FROM private.license_device_slots WHERE license_id=destination AND device_id=device)),
 jsonb_build_object('operation','LICENSE_EDITOR_DEVICE','previousLicenseId',p_license_id)::text);
 RETURN jsonb_build_object('success',true,'licenseId',destination);
END; $function$;
REVOKE ALL ON FUNCTION public.rpc_manager_edit_license_device(uuid,text,text,text,text,text,text,uuid,text,integer,boolean,jsonb) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.rpc_manager_edit_license_device(uuid,text,text,text,text,text,text,uuid,text,integer,boolean,jsonb) TO authenticated;

CREATE FUNCTION private.license_device_source_links(p_license uuid,p_device text) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $function$
 SELECT coalesce(jsonb_agg(q.value),'[]'::jsonb) FROM (
 SELECT jsonb_build_object('sourceId',ms.source_id,'name',ms.name,'deviceCount',
 (SELECT count(DISTINCT b2.device_id) FROM public.device_source_bindings b2
 JOIN public.license_devices ld ON ld.license_id=b2.license_id AND ld.device_id=b2.device_id AND ld.status='ACTIVE'
 JOIN public.devices d ON d.device_id=b2.device_id AND d.status='AUTHORIZED'
 WHERE b2.source_id=ms.id AND private.manager_can_license(b2.license_id))) AS value
 FROM public.device_source_bindings b JOIN public.managed_sources ms ON ms.id=b.source_id
 WHERE b.license_id=p_license AND b.device_id=p_device
 UNION ALL
 SELECT jsonb_build_object('sourceId',cs.source_id,'name',cs.display_name,'deviceCount',
 (SELECT count(DISTINCT ld.device_id) FROM public.license_devices ld JOIN public.devices d ON d.device_id=ld.device_id
 WHERE ld.license_id=p_license AND ld.status='ACTIVE' AND d.status='AUTHORIZED'))
 FROM public.customer_sources cs JOIN public.licenses l ON l.id=cs.license_id AND l.mode='SELF_SERVICE'
 WHERE cs.license_id=p_license AND cs.status='ACTIVE' AND EXISTS
 (SELECT 1 FROM public.license_devices WHERE license_id=p_license AND device_id=p_device AND status='ACTIVE')
 )q;
$function$;
REVOKE ALL ON FUNCTION private.license_device_source_links(uuid,text) FROM PUBLIC,anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION private.license_console_devices(p_license uuid) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $function$
 SELECT coalesce(jsonb_agg(jsonb_build_object('deviceId',d.device_id,'displayCode',d.display_code,'deviceLabel',d.device_label,
 'deviceType',coalesce(m.device_type,i.device_type,d.device_type),'platform',coalesce(m.platform,i.platform,'OTHER'),
 'lastSeenAt',greatest(d.last_seen_at,i.last_seen_at),'status',d.status,'boundAt',ld.bound_at,'licenseBindingStatus',ld.status,
 'deviceRole',r.device_role,'primaryDisplayCode',pd.display_code,'slotNumber',s.slot_number,'sourceLinks',private.license_device_source_links(ld.license_id,d.device_id))
 ORDER BY ld.bound_at,d.device_id),'[]'::jsonb)
 FROM public.license_devices ld JOIN public.devices d ON d.device_id=ld.device_id
 LEFT JOIN private.manager_device_relationships r ON r.license_id=ld.license_id AND r.device_id=ld.device_id
 LEFT JOIN public.devices pd ON pd.device_id=r.primary_device_id
 LEFT JOIN private.license_device_slots s ON s.license_id=ld.license_id AND s.device_id=ld.device_id
 LEFT JOIN private.manager_device_presentation m ON m.device_id=ld.device_id
 LEFT JOIN LATERAL(SELECT a.platform,a.device_type,a.last_seen_at FROM public.app_installations a WHERE a.device_id=d.device_id AND a.package_name='com.xandeflix.prebuilt'
 ORDER BY a.last_seen_at DESC,a.installation_id LIMIT 1)i ON true WHERE ld.license_id=p_license;
$function$;

CREATE OR REPLACE FUNCTION public.rpc_manager_link_license_device(p_license_id uuid, p_display_code text, p_primary_display_code text, p_device_label text, p_max_devices integer, p_max_sessions integer, p_device_role text, p_registered boolean, p_key_hash text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
 IF (p_max_devices<>v_license.max_devices OR p_max_sessions<>v_license.max_concurrent_sessions) THEN RAISE EXCEPTION 'VERSION_CONFLICT'; END IF;
 SELECT d.device_id,r.device_role INTO v_main,v_main_role FROM public.license_devices ld JOIN public.devices d ON d.device_id=ld.device_id
 LEFT JOIN private.manager_device_relationships r ON r.license_id=ld.license_id AND r.device_id=ld.device_id
 WHERE ld.license_id=p_license_id AND ld.status='ACTIVE' AND d.status='AUTHORIZED' AND r.device_role='PRIMARY'
   AND (v_main_code='' OR d.display_code=v_main_code) AND d.display_code<>v_code ORDER BY ld.bound_at,d.device_id LIMIT 1;
 IF v_main IS NULL OR v_main_role='SECONDARY' THEN RAISE EXCEPTION 'PRIMARY_DEVICE_INVALID'; END IF;
 IF p_registered THEN
   SELECT * INTO v_device FROM public.devices WHERE display_code=v_code FOR UPDATE;
   IF NOT FOUND OR v_device.status<>'AUTHORIZED' THEN RAISE EXCEPTION 'REGISTERED_DEVICE_REQUIRED'; END IF;
   v_device_id:=v_device.device_id;
   IF NOT EXISTS(SELECT 1 FROM public.license_devices WHERE device_id=v_device_id) THEN RAISE EXCEPTION 'REGISTERED_DEVICE_REQUIRED'; END IF;
   IF EXISTS(SELECT 1 FROM public.license_devices ld WHERE ld.device_id=v_device_id AND NOT private.manager_can_license(ld.license_id)) THEN RAISE EXCEPTION 'MANAGER_SCOPE_DENIED' USING ERRCODE='42501'; END IF;
   IF EXISTS(SELECT 1 FROM private.manager_device_relationships WHERE device_id=v_device_id AND device_role='PRIMARY') AND NOT EXISTS(SELECT 1 FROM private.license_role_operations WHERE transaction_id=txid_current() AND device_id=v_device_id) THEN RAISE EXCEPTION 'PRIMARY_CANNOT_BECOME_SECONDARY'; END IF;
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
END; $function$;
