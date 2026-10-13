-- C78: license console. No real data seeded or deleted by migration.
CREATE FUNCTION private.license_console_devices(p_license UUID) RETURNS JSONB
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT coalesce(jsonb_agg(jsonb_build_object('deviceId',d.device_id,'displayCode',d.display_code,
 'deviceLabel',d.device_label,'deviceType',coalesce(i.device_type,d.device_type),
 'platform',coalesce(i.platform,'OTHER'),'lastSeenAt',greatest(d.last_seen_at,i.last_seen_at),
 'status',d.status,'boundAt',ld.bound_at) ORDER BY ld.bound_at,d.device_id),'[]'::jsonb)
 FROM public.license_devices ld JOIN public.devices d ON d.device_id=ld.device_id
 LEFT JOIN LATERAL (SELECT a.platform,a.device_type,a.last_seen_at FROM public.app_installations a
 WHERE a.device_id=d.device_id AND a.package_name='com.xandeflix.prebuilt'
 ORDER BY a.last_seen_at DESC,a.installation_id LIMIT 1) i ON true WHERE ld.license_id=p_license;
$$;
REVOKE ALL ON FUNCTION private.license_console_devices(UUID) FROM PUBLIC,anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.rpc_manager_list_licenses() RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE result JSONB;
BEGIN
 PERFORM private.require_active_manager();
 result:=private.manager_scope_result('rpc_manager_list_licenses','{}',private.c70_rpc_manager_list_licenses());
 RETURN coalesce((SELECT jsonb_agg(e.value||jsonb_build_object('devices',private.license_console_devices((e.value->>'licenseId')::uuid)) ORDER BY e.ordinality)
 FROM jsonb_array_elements(result) WITH ORDINALITY e(value,ordinality)),'[]'::jsonb);
END; $$;

CREATE OR REPLACE FUNCTION public.rpc_manager_get_license_detail(p_license_id UUID) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE result JSONB;
BEGIN
 PERFORM private.manager_check_scope('rpc_manager_get_license_detail',jsonb_build_object('p_license_id',p_license_id));
 result:=private.c70_rpc_manager_get_license_detail(p_license_id);
 IF result->>'success'='true' THEN result:=jsonb_set(result,'{devices}',private.license_console_devices(p_license_id)); END IF;
 RETURN result;
END; $$;

-- Keep immutable audit; extend only named action enum.
DO $$ DECLARE r RECORD; BEGIN
 FOR r IN SELECT conname,pg_get_expr(conbin,conrelid) expression FROM pg_constraint
 WHERE conrelid='public.commercial_audit_logs'::regclass AND conname='commercial_audit_logs_action_check' LOOP
 EXECUTE format('ALTER TABLE public.commercial_audit_logs DROP CONSTRAINT %I',r.conname);
 EXECUTE format('ALTER TABLE public.commercial_audit_logs ADD CONSTRAINT %I CHECK ((%s) OR action IN (''LICENSE_SOURCE_REPLACED'',''LICENSE_DEVICE_UPDATED'',''CUSTOMER_PERMANENTLY_DELETED''))',r.conname,r.expression);
 END LOOP;
END; $$;

CREATE FUNCTION public.rpc_manager_license_device(p_license_id UUID,p_display_code TEXT,p_label TEXT,p_key_hash TEXT DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE manager UUID; lic RECORD; pair JSONB; dev TEXT; typ TEXT; token TEXT; src RECORD; count_devices INTEGER;
BEGIN
 manager:=private.require_active_manager();
 IF NOT private.manager_can_license(p_license_id) THEN RAISE EXCEPTION 'MANAGER_SCOPE_DENIED' USING ERRCODE='42501'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('signal-policy-write',0));
 SELECT * INTO lic FROM public.licenses WHERE id=p_license_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'LICENSE_NOT_FOUND'; END IF;
 IF length(trim(coalesce(p_label,''))) NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'INVALID_DEVICE_LABEL'; END IF;
 SELECT d.device_id INTO dev FROM public.devices d JOIN public.license_devices ld ON ld.device_id=d.device_id
 WHERE d.display_code=upper(trim(p_display_code)) AND ld.license_id=p_license_id;
 IF p_key_hash IS NULL THEN
   IF dev IS NULL OR EXISTS(SELECT 1 FROM public.license_devices WHERE device_id=dev AND license_id<>p_license_id)
   THEN RAISE EXCEPTION 'MANAGER_SCOPE_DENIED' USING ERRCODE='42501'; END IF;
 ELSE
   IF lic.status NOT IN ('ACTIVE','TRIAL') OR lic.expires_at<=now() OR (lic.status='TRIAL' AND lic.trial_expires_at<=now())
   THEN RAISE EXCEPTION 'LICENSE_NOT_ACTIVE'; END IF;
   pair:=public.rpc_claim_device_key(upper(trim(p_display_code)),p_key_hash);
   dev:=pair->>'deviceId'; typ:=pair->>'deviceType'; token:=pair->>'deviceTokenHash';
   IF dev IS NULL OR token IS NULL OR EXISTS(SELECT 1 FROM public.license_devices WHERE device_id=dev AND license_id<>p_license_id)
   THEN RAISE EXCEPTION 'CROSS_CUSTOMER_BINDING_DENIED' USING ERRCODE='42501'; END IF;
   SELECT count(*) INTO count_devices FROM public.license_devices WHERE license_id=p_license_id AND status='ACTIVE' AND device_id<>dev;
   IF count_devices>=100 THEN RAISE EXCEPTION 'LICENSE_DEVICE_LIMIT_REACHED'; END IF;
   IF lic.mode='MANAGED' THEN
     IF count_devices>=lic.max_devices THEN RAISE EXCEPTION 'LICENSE_DEVICE_LIMIT_REACHED'; END IF;
     IF (SELECT count(DISTINCT source_id) FROM public.device_source_bindings WHERE license_id=p_license_id)<>1
     THEN RAISE EXCEPTION 'CUSTOMER_SOURCE_AMBIGUOUS'; END IF;
     SELECT ms.id,ms.source_id,ms.version INTO src FROM public.managed_sources ms JOIN public.device_source_bindings b ON b.source_id=ms.id
       WHERE b.license_id=p_license_id AND ms.status='ACTIVE' LIMIT 1;
   ELSE
     IF (SELECT count(*) FROM public.customer_sources WHERE license_id=p_license_id AND status='ACTIVE')<>1
     THEN RAISE EXCEPTION 'CUSTOMER_SOURCE_AMBIGUOUS'; END IF;
     SELECT id,source_id::text AS source_id,version INTO src FROM public.customer_sources WHERE license_id=p_license_id AND status='ACTIVE';
   END IF;
   IF src.source_id IS NULL THEN RAISE EXCEPTION 'SOURCE_NOT_FOUND'; END IF;
   INSERT INTO public.devices(device_id,display_code,device_type,device_label,status,device_token_hash,last_seen_at)
   VALUES(dev,upper(trim(p_display_code)),coalesce(typ,'TV'),trim(p_label),'AUTHORIZED',token,now())
   ON CONFLICT(device_id) DO UPDATE SET device_label=excluded.device_label,status='AUTHORIZED',device_token_hash=excluded.device_token_hash;
   IF lic.mode='SELF_SERVICE' THEN
     INSERT INTO private.additional_signal_device_approvals(license_id,device_id,source_id,source_version,approved_by)
     VALUES(p_license_id,dev,src.source_id,src.version,manager) ON CONFLICT(license_id,device_id) DO UPDATE SET
       source_id=excluded.source_id,source_version=excluded.source_version,approved_by=excluded.approved_by,approved_at=now();
     UPDATE public.licenses SET manager_approved_additional_devices=greatest(manager_approved_additional_devices,count_devices),
       max_devices=greatest(max_devices,count_devices+1) WHERE id=p_license_id;
   END IF;
   INSERT INTO public.license_devices(license_id,device_id,status,bound_at) VALUES(p_license_id,dev,'ACTIVE',now())
   ON CONFLICT(license_id,device_id) DO UPDATE SET status='ACTIVE',revoked_at=NULL;
   IF lic.mode='MANAGED' THEN
     INSERT INTO public.device_source_bindings(license_id,device_id,source_id) VALUES(p_license_id,dev,src.id)
     ON CONFLICT(device_id) DO UPDATE SET license_id=excluded.license_id,source_id=excluded.source_id;
   END IF;
   UPDATE public.device_activation_requests SET status='CONSUMED',claimed_at=now(),linked_license_id=p_license_id,
     linked_source_id=src.source_id,customer_account_id=lic.customer_account_id,claimed_by_customer_id=lic.customer_id
     WHERE device_id=dev AND status='PENDING';
 END IF;
 UPDATE public.devices SET device_label=trim(p_label) WHERE device_id=dev;
 UPDATE public.app_installations SET updated_at=now() WHERE device_id=dev AND package_name='com.xandeflix.prebuilt';
 INSERT INTO public.commercial_audit_logs(manager_id,action,target_type,target_id,reason)
 VALUES(manager,'LICENSE_DEVICE_UPDATED','LICENSE',p_license_id::text,'Manager confirmed device label / additional-device authorization');
 RETURN jsonb_build_object('success',true);
END; $$;

CREATE FUNCTION public.rpc_manager_replace_license_source(p_license_id UUID,p_expected_sources JSONB,p_source_id TEXT,
 p_name TEXT,p_protocol TEXT,p_ciphertext TEXT,p_nonce TEXT,p_auth_tag TEXT,p_key_version TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE manager UUID; lic RECORD; old_sources UUID[]; new_id UUID; actual JSONB;
BEGIN
 manager:=private.require_active_manager();
 IF NOT private.manager_can_license(p_license_id) THEN RAISE EXCEPTION 'MANAGER_SCOPE_DENIED' USING ERRCODE='42501'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('signal-policy-write',0));
 SELECT * INTO lic FROM public.licenses WHERE id=p_license_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'LICENSE_NOT_FOUND'; END IF;
 IF p_source_id IS NULL OR p_protocol IS NULL OR p_name IS NULL OR p_nonce IS NULL OR p_auth_tag IS NULL OR p_key_version IS NULL
 OR (lic.mode='MANAGED' AND p_source_id !~ '^src_[a-z0-9]{16,64}$')
 OR (lic.mode='SELF_SERVICE' AND p_source_id !~ '^csrc_[a-z0-9]{16,64}$') OR p_protocol NOT IN ('M3U','XTREAM') OR length(trim(p_name)) NOT BETWEEN 1 AND 100
 OR p_ciphertext IS NULL OR p_ciphertext !~ '^[a-f0-9]+$' OR length(p_ciphertext)%2<>0
 OR p_nonce !~ '^[a-f0-9]{24}$' OR p_auth_tag !~ '^[a-f0-9]{32}$' OR p_key_version<>'v1'
 THEN RAISE EXCEPTION 'SOURCE_ENVELOPE_INVALID'; END IF;
 actual:=coalesce((SELECT jsonb_agg(jsonb_build_object('sourceId',s->>'sourceId','version',(s->>'version')::int) ORDER BY s->>'sourceId')
 FROM jsonb_array_elements(CASE WHEN lic.mode='MANAGED' THEN private.c70_rpc_manager_get_license_detail(p_license_id)->'managedSources'
 ELSE private.c70_rpc_manager_get_license_detail(p_license_id)->'customerSources' END) s),'[]');
 IF actual IS DISTINCT FROM p_expected_sources THEN RAISE EXCEPTION 'VERSION_CONFLICT'; END IF;
 IF lic.mode='MANAGED' THEN
   IF EXISTS(SELECT 1 FROM public.license_devices ld JOIN public.license_devices other ON other.device_id=ld.device_id
   WHERE ld.license_id=p_license_id AND other.license_id<>p_license_id) THEN RAISE EXCEPTION 'CROSS_CUSTOMER_BINDING_DENIED'; END IF;
   SELECT array_agg(DISTINCT source_id) INTO old_sources FROM public.device_source_bindings WHERE license_id=p_license_id;
   INSERT INTO public.managed_sources(source_id,name,source_type,version,status) VALUES(p_source_id,trim(p_name),p_protocol,1,'ACTIVE') RETURNING id INTO new_id;
   INSERT INTO private.managed_source_secret_vault(source_id,source_version,protocol,ciphertext,nonce,auth_tag,key_version)
     VALUES(p_source_id,1,p_protocol,p_ciphertext,p_nonce,p_auth_tag,p_key_version);
   INSERT INTO private.manager_source_ownership(source_id,manager_id) VALUES(p_source_id,manager);
   INSERT INTO public.device_source_bindings(license_id,device_id,source_id)
     SELECT p_license_id,device_id,new_id FROM public.license_devices WHERE license_id=p_license_id AND status='ACTIVE'
     ON CONFLICT(device_id) DO UPDATE SET source_id=excluded.source_id,license_id=excluded.license_id;
   -- Remove obsolete, now unbound secrets only. External shared sources survive.
   DELETE FROM private.managed_source_secret_vault v USING public.managed_sources s WHERE s.id=ANY(old_sources) AND v.source_id=s.source_id
     AND NOT EXISTS(SELECT 1 FROM public.device_source_bindings WHERE source_id=s.id);
   DELETE FROM private.signal_source_index i USING public.managed_sources s WHERE s.id=ANY(old_sources) AND i.source_kind='MANAGED' AND i.source_id=s.source_id
     AND NOT EXISTS(SELECT 1 FROM public.device_source_bindings WHERE source_id=s.id);
   DELETE FROM private.manager_source_ownership o USING public.managed_sources s WHERE s.id=ANY(old_sources) AND o.source_id=s.source_id
     AND NOT EXISTS(SELECT 1 FROM public.device_source_bindings WHERE source_id=s.id);
   DELETE FROM public.managed_sources s WHERE s.id=ANY(old_sources) AND NOT EXISTS(SELECT 1 FROM public.device_source_bindings WHERE source_id=s.id);
 ELSE
   DELETE FROM private.signal_source_index WHERE source_kind='CUSTOMER' AND source_id IN(SELECT source_id FROM public.customer_sources WHERE license_id=p_license_id);
   DELETE FROM public.customer_sources WHERE license_id=p_license_id;
   INSERT INTO public.customer_sources(source_id,customer_id,customer_account_id,license_id,source_type,display_name,status,version)
     VALUES(p_source_id,lic.customer_id,lic.customer_account_id,p_license_id,p_protocol,trim(p_name),'ACTIVE',1);
   INSERT INTO private.customer_source_secret_vault(source_id,source_version,protocol,ciphertext,nonce,auth_tag,key_version)
     VALUES(p_source_id,1,p_protocol,p_ciphertext,p_nonce,p_auth_tag,p_key_version);
   UPDATE private.additional_signal_device_approvals SET source_id=p_source_id,source_version=1 WHERE license_id=p_license_id;
 END IF;
 UPDATE public.playback_sessions SET status='CLOSED',closed_at=now(),close_reason='LICENSE_SOURCE_REPLACED' WHERE license_id=p_license_id AND status='ACTIVE';
 INSERT INTO public.commercial_audit_logs(manager_id,action,target_type,target_id,reason)
   VALUES(manager,'LICENSE_SOURCE_REPLACED','LICENSE',p_license_id::text,'Manager confirmed replacement for selected license');
 RETURN jsonb_build_object('success',true,'sourceId',p_source_id,'sourceVersion',1);
END; $$;

CREATE FUNCTION private.license_console_delete_scope(p_license UUID) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE customer UUID; license_ids UUID[]; result JSONB;
BEGIN
 PERFORM private.require_master_manager();
 SELECT coalesce(customer_account_id,customer_id) INTO customer FROM public.licenses WHERE id=p_license;
 IF NOT FOUND THEN RAISE EXCEPTION 'LICENSE_NOT_FOUND'; END IF;
 IF customer IS NULL THEN RAISE EXCEPTION 'CUSTOMER_ID_REQUIRED'; END IF;
 SELECT array_agg(id ORDER BY id) INTO license_ids FROM public.licenses WHERE coalesce(customer_account_id,customer_id)=customer;
 IF EXISTS(SELECT 1 FROM public.license_devices a JOIN public.license_devices b ON b.device_id=a.device_id
 WHERE a.license_id=ANY(license_ids) AND NOT b.license_id=ANY(license_ids)) THEN RAISE EXCEPTION 'CROSS_CUSTOMER_BINDING_DENIED'; END IF;
 IF EXISTS(SELECT 1 FROM public.customer_account_users u WHERE u.customer_account_id=customer AND
 (EXISTS(SELECT 1 FROM public.manager_admins WHERE user_id=u.user_id) OR EXISTS(SELECT 1 FROM public.customer_account_users x WHERE x.user_id=u.user_id AND x.customer_account_id<>customer)
 OR EXISTS(SELECT 1 FROM public.licenses l WHERE l.customer_id=u.user_id AND coalesce(l.customer_account_id,l.customer_id)<>customer)))
 OR EXISTS(SELECT 1 FROM public.manager_admins WHERE user_id=customer)
 THEN RAISE EXCEPTION 'CUSTOMER_SHARED_IDENTITY'; END IF;
 IF EXISTS(SELECT 1 FROM public.customer_profiles WHERE id=customer) AND (
 EXISTS(SELECT 1 FROM public.customer_account_users WHERE user_id=customer AND customer_account_id<>customer)
 OR EXISTS(SELECT 1 FROM public.licenses WHERE customer_id=customer AND coalesce(customer_account_id,customer_id)<>customer))
 THEN RAISE EXCEPTION 'CUSTOMER_SHARED_IDENTITY'; END IF;
 result:=jsonb_build_object('customerId',customer,'nickname',coalesce((SELECT display_name FROM public.customer_accounts WHERE id=customer),(SELECT nickname FROM public.customer_profiles WHERE id=customer)),
 'licenses',to_jsonb(license_ids),'devices',coalesce((SELECT jsonb_agg(DISTINCT jsonb_build_object('deviceId',d.device_id,'displayCode',d.display_code,'deviceLabel',d.device_label))
 FROM public.devices d JOIN public.license_devices ld ON ld.device_id=d.device_id WHERE ld.license_id=ANY(license_ids)),'[]'::jsonb));
 RETURN result||jsonb_build_object('snapshot',md5(result::text));
END; $$;
REVOKE ALL ON FUNCTION private.license_console_delete_scope(UUID) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.rpc_manager_customer_delete_preview(p_license_id UUID) RETURNS JSONB
LANGUAGE sql SECURITY DEFINER SET search_path='' AS $$ SELECT private.license_console_delete_scope(p_license_id); $$;

CREATE FUNCTION public.rpc_manager_delete_license_customer(p_license_id UUID,p_snapshot TEXT,p_confirmation TEXT) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE manager UUID; scope JSONB; customer UUID; ids UUID[]; devs TEXT[]; sources UUID[]; v_users UUID[]; dev RECORD;
BEGIN
 manager:=private.require_master_manager();
 PERFORM pg_advisory_xact_lock(hashtextextended('signal-policy-write',0));
 PERFORM 1 FROM public.customer_accounts WHERE id=(SELECT customer_account_id FROM public.licenses WHERE id=p_license_id) FOR UPDATE;
 PERFORM 1 FROM public.licenses WHERE coalesce(customer_account_id,customer_id)=(SELECT coalesce(customer_account_id,customer_id) FROM public.licenses WHERE id=p_license_id) ORDER BY id FOR UPDATE;
 scope:=private.license_console_delete_scope(p_license_id);
 IF scope->>'snapshot' IS DISTINCT FROM p_snapshot OR p_confirmation IS DISTINCT FROM 'EXCLUIR '||(scope->>'nickname')
 THEN RAISE EXCEPTION 'CUSTOMER_DELETE_CONFIRMATION_REQUIRED'; END IF;
 customer:=(scope->>'customerId')::uuid;
 SELECT array_agg(value::uuid) INTO ids FROM jsonb_array_elements_text(scope->'licenses');
 SELECT array_agg(value->>'deviceId') INTO devs FROM jsonb_array_elements(scope->'devices');
 SELECT array_agg(DISTINCT source_id) INTO sources FROM public.device_source_bindings WHERE license_id=ANY(ids);
 SELECT array_agg(DISTINCT user_id) INTO v_users FROM public.customer_account_users WHERE customer_account_id=customer;
 IF EXISTS(SELECT 1 FROM public.customer_profiles WHERE id=customer) THEN v_users:=coalesce(v_users,'{}'::uuid[])||customer; END IF;
 IF EXISTS(SELECT 1 FROM public.manager_admins WHERE user_id=ANY(v_users)) OR EXISTS(SELECT 1 FROM public.customer_account_users WHERE user_id=ANY(v_users) AND customer_account_id<>customer)
 OR EXISTS(SELECT 1 FROM public.licenses WHERE customer_id=ANY(v_users) AND NOT id=ANY(ids))
 THEN RAISE EXCEPTION 'CUSTOMER_SHARED_IDENTITY'; END IF;
 -- Existing master delete handles keys, requests, reactivation, sessions and app installations.
 FOR dev IN SELECT device_id,display_code FROM public.devices WHERE device_id=ANY(devs) ORDER BY device_id FOR UPDATE LOOP
   PERFORM public.rpc_manager_delete_device_permanently(dev.device_id,dev.display_code);
 END LOOP;
 DELETE FROM public.device_activation_sessions WHERE license_id=ANY(ids) OR customer_id=ANY(v_users);
 DELETE FROM public.device_activation_events WHERE license_id=ANY(ids) OR customer_account_id=customer OR customer_id=ANY(v_users);
 DELETE FROM public.device_activation_requests WHERE linked_license_id=ANY(ids) OR customer_account_id=customer OR claimed_by_customer_id=ANY(v_users);
 DELETE FROM public.device_pairing_requests WHERE linked_license_id=ANY(ids) OR customer_account_id=customer OR consumed_by_customer_id=ANY(v_users);
 DELETE FROM private.signal_source_index WHERE source_kind='CUSTOMER' AND source_id IN(SELECT source_id FROM public.customer_sources WHERE license_id=ANY(ids) OR customer_account_id=customer);
 DELETE FROM public.customer_sources WHERE license_id=ANY(ids) OR customer_account_id=customer;
 DELETE FROM public.licenses WHERE id=ANY(ids);
 DELETE FROM private.managed_source_secret_vault v USING public.managed_sources s WHERE s.id=ANY(sources) AND v.source_id=s.source_id AND NOT EXISTS(SELECT 1 FROM public.device_source_bindings WHERE source_id=s.id);
 DELETE FROM private.signal_source_index i USING public.managed_sources s WHERE s.id=ANY(sources) AND i.source_kind='MANAGED' AND i.source_id=s.source_id AND NOT EXISTS(SELECT 1 FROM public.device_source_bindings WHERE source_id=s.id);
 DELETE FROM private.manager_source_ownership o USING public.managed_sources s WHERE s.id=ANY(sources) AND o.source_id=s.source_id AND NOT EXISTS(SELECT 1 FROM public.device_source_bindings WHERE source_id=s.id);
 DELETE FROM public.managed_sources s WHERE s.id=ANY(sources) AND NOT EXISTS(SELECT 1 FROM public.device_source_bindings WHERE source_id=s.id);
 DELETE FROM private.manager_customer_ownership WHERE customer_id=customer;
 DELETE FROM public.customer_accounts WHERE id=customer;
 -- Exclusive consumer identities only, already checked against staff and other accounts.
 DELETE FROM auth.sessions WHERE user_id=ANY(v_users);
 DELETE FROM auth.users WHERE id=ANY(v_users);
 DELETE FROM public.customer_profiles WHERE id=ANY(v_users);
 INSERT INTO public.commercial_audit_logs(manager_id,action,target_type,target_id,reason)
 VALUES(manager,'CUSTOMER_PERMANENTLY_DELETED','CUSTOMER',customer::text,'Master confirmation; operational data removed; audit retained');
 RETURN jsonb_build_object('success',true);
END; $$;

REVOKE ALL ON FUNCTION public.rpc_manager_license_device(UUID,TEXT,TEXT,TEXT),
 public.rpc_manager_replace_license_source(UUID,JSONB,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT),
 public.rpc_manager_customer_delete_preview(UUID),public.rpc_manager_delete_license_customer(UUID,TEXT,TEXT) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.rpc_manager_license_device(UUID,TEXT,TEXT,TEXT),
 public.rpc_manager_replace_license_source(UUID,JSONB,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT),
 public.rpc_manager_customer_delete_preview(UUID),public.rpc_manager_delete_license_customer(UUID,TEXT,TEXT) TO authenticated;
NOTIFY pgrst,'reload schema';
