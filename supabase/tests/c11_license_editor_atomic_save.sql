-- Run inside BEGIN/ROLLBACK. Random isolated fixtures; no real customer mutations.
DO $test$
DECLARE admin uuid:=gen_random_uuid(); outsider uuid:=gen_random_uuid(); consumer uuid:=gen_random_uuid();
 account uuid:=gen_random_uuid(); lic uuid:=gen_random_uuid(); dev text:='c85-'||gen_random_uuid();
 code text:='XF-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,4))||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,4));
 src text:='src_'||replace(gen_random_uuid()::text,'-',''); next_src text:='src_'||replace(gen_random_uuid()::text,'-',''); sid uuid;
 detail jsonb; before_detail jsonb; payload jsonb; edit jsonb; proof_count integer; audit_count integer; failure text;
 leaf text:='c85-'||gen_random_uuid(); leaf_code text:='XF-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,4))||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,4)); leaf_edit jsonb;
BEGIN
 INSERT INTO auth.users(id) VALUES(admin),(outsider),(consumer);
 INSERT INTO public.manager_admins(user_id,role,status) VALUES(admin,'ADMIN','ACTIVE'),(outsider,'ADMIN','ACTIVE');
 INSERT INTO public.customer_accounts(id,display_name,status) VALUES(account,'C85 Original','ACTIVE');
 INSERT INTO private.manager_customer_ownership(customer_id,manager_id) VALUES(account,admin);
 INSERT INTO public.licenses(id,license_key_hash,mode,status,max_devices,customer_account_id) VALUES(lic,encode(extensions.digest(lic::text,'sha256'),'hex'),'MANAGED','ACTIVE',1,account);
 INSERT INTO public.devices(device_id,display_code,device_type,device_label,status,device_token_hash) VALUES(dev,code,'TV','Sala','AUTHORIZED',repeat('a',64));
 INSERT INTO public.license_devices(license_id,device_id,status) VALUES(lic,dev,'ACTIVE');
 INSERT INTO public.managed_sources(source_id,name,source_type,version,status) VALUES(src,'C85 Fonte','M3U',1,'ACTIVE') RETURNING id INTO sid;
 INSERT INTO private.manager_source_ownership(source_id,manager_id) VALUES(src,admin);
 INSERT INTO private.managed_source_secret_vault(source_id,source_version,protocol,ciphertext,nonce,auth_tag,key_version) VALUES(src,1,'M3U','aa',repeat('a',24),repeat('b',32),'v1');
 INSERT INTO public.device_source_bindings(license_id,device_id,source_id) VALUES(lic,dev,sid);
 PERFORM set_config('request.jwt.claim.role','authenticated',true); PERFORM set_config('request.jwt.claim.sub',admin::text,true);
 detail:=public.rpc_manager_get_license_detail(lic);
 edit:=jsonb_build_object('licenseId',lic,'displayCode',code,'label','Quarto','platform','WEBOS','deviceType','TV','expectedRole','','role','PRIMARY','roleConfirmed',true);
 payload:=jsonb_build_object('customer',jsonb_build_object('customerId',account,'name','C85 Renamed','expectedName','C85 Original'),
   'screens',jsonb_build_object('principalCode',code,'maxDevices',5,'maxSessions',4,'reason','C85 manual','paidExtraScreens',1,'paymentReference','INDEFINIDO','paymentConfirmed',true),
   'devices',jsonb_build_array(edit),'source',jsonb_build_object('expectedSources',jsonb_build_array(jsonb_build_object('sourceId',src,'version',1)),
   'sourceId',next_src,'name','C85 Substituta','protocol','M3U','ciphertext','bb','nonce',repeat('a',24),'authTag',repeat('b',32),'keyVersion','v1'));
 PERFORM public.rpc_manager_save_license_edits(lic,detail->>'editorSnapshot',payload);
 detail:=public.rpc_manager_get_license_detail(lic);
 IF detail->'customer'->>'nickname'<>'C85 Renamed' OR detail->'license'->>'maxDevices'<>'5' OR detail->'license'->>'maxConcurrentSessions'<>'4'
 OR detail->'devices'->0->>'deviceRole'<>'PRIMARY' OR detail->'devices'->0->>'deviceLabel'<>'Quarto' OR detail->'devices'->0->>'platform'<>'WEBOS'
 OR detail->'managedSources'->0->>'sourceId'<>next_src OR detail->'screenAllowance'->>'paidExtraScreens'<>'1' THEN RAISE EXCEPTION 'C85_ALL_CHANGES'; END IF;
 -- Playback heartbeat changes never invalidate editable metadata.
 UPDATE public.devices SET last_seen_at=now() WHERE device_id=dev;
 IF detail->>'editorSnapshot' IS DISTINCT FROM public.rpc_manager_get_license_detail(lic)->>'editorSnapshot' THEN RAISE EXCEPTION 'C85_HEARTBEAT_CONFLICT'; END IF;
 -- Growth allocates a new slot before device edits; reduction happens after freeing it.
 INSERT INTO public.devices(device_id,display_code,device_type,device_label,status,device_token_hash) VALUES(leaf,leaf_code,'TABLET','Tablet','AUTHORIZED',repeat('b',64));
 INSERT INTO public.license_devices(license_id,device_id,status) VALUES(lic,leaf,'ACTIVE');
 INSERT INTO public.device_source_bindings(license_id,device_id,source_id) SELECT lic,leaf,id FROM public.managed_sources WHERE source_id=next_src;
 INSERT INTO private.manager_device_relationships(license_id,device_id,device_role,primary_device_id,manager_id) VALUES(lic,leaf,'SECONDARY',dev,admin);
 leaf_edit:=jsonb_build_object('licenseId',lic,'displayCode',leaf_code,'label','Tablet','platform','ANDROID','deviceType','TABLET','expectedRole','SECONDARY','role','SECONDARY','primaryLicenseId',lic,'primaryCode',code,'slotNumber',6);
 payload:=jsonb_build_object('devices',jsonb_build_array(leaf_edit),'screens',jsonb_build_object('principalCode',code,'maxDevices',6,'maxSessions',4,'reason','C85 growth slot','paidExtraScreens',2,'paymentReference','C85-SLOT','paymentConfirmed',true));
 detail:=public.rpc_manager_get_license_detail(lic); PERFORM public.rpc_manager_save_license_edits(lic,detail->>'editorSnapshot',payload);
 IF NOT EXISTS(SELECT 1 FROM private.license_device_slots WHERE license_id=lic AND device_id=leaf AND slot_number=6) THEN RAISE EXCEPTION 'C85_GROWTH_SLOT'; END IF;
 payload:=jsonb_build_object('devices',jsonb_build_array(leaf_edit||jsonb_build_object('slotNumber',2)),'screens',jsonb_build_object('principalCode',code,'maxDevices',5,'maxSessions',4,'reason','C85 reduction slot'));
 detail:=public.rpc_manager_get_license_detail(lic); PERFORM public.rpc_manager_save_license_edits(lic,detail->>'editorSnapshot',payload);
 IF (SELECT max_devices FROM public.licenses WHERE id=lic)<>5 OR NOT EXISTS(SELECT 1 FROM private.license_device_slots WHERE license_id=lic AND device_id=leaf AND slot_number=2) THEN RAISE EXCEPTION 'C85_REDUCTION_SLOT'; END IF;
 before_detail:=public.rpc_manager_get_license_detail(lic);
 SELECT count(*) INTO proof_count FROM private.license_screen_payments WHERE license_id=lic;
 SELECT count(*) INTO audit_count FROM public.commercial_audit_logs WHERE target_id=lic::text;
 payload:=jsonb_build_object('customer',jsonb_build_object('customerId',account,'name','C85 Must rollback','expectedName','C85 Renamed'),
 'screens',jsonb_build_object('principalCode',code,'maxDevices',6,'maxSessions',4,'reason','C85 rollback','paidExtraScreens',2,'paymentReference','C85-ROLLBACK','paymentConfirmed',true),
 'devices',jsonb_build_array(edit||jsonb_build_object('expectedRole','PRIMARY','label','Must rollback')),
 'source',jsonb_build_object('expectedSources','[]'::jsonb,'sourceId','src_'||replace(gen_random_uuid()::text,'-',''),'name','C85 Invalid source','protocol','M3U','ciphertext','cc','nonce',repeat('a',24),'authTag',repeat('b',32),'keyVersion','v1'));
 BEGIN PERFORM public.rpc_manager_save_license_edits(lic,before_detail->>'editorSnapshot',payload); RAISE EXCEPTION 'C85_LATE_FAILURE_EXPECTED';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'VERSION_CONFLICT' THEN RAISE; END IF; END;
 IF before_detail->>'editorSnapshot' IS DISTINCT FROM public.rpc_manager_get_license_detail(lic)->>'editorSnapshot'
 OR proof_count<>(SELECT count(*) FROM private.license_screen_payments WHERE license_id=lic)
 OR audit_count<>(SELECT count(*) FROM public.commercial_audit_logs WHERE target_id=lic::text) THEN RAISE EXCEPTION 'C85_PARTIAL_WRITE'; END IF;
 PERFORM public.rpc_manager_edit_license_device(lic,code,'Sala atualizada','WEBOS','TV','PRIMARY','PRIMARY');
 BEGIN PERFORM public.rpc_manager_save_license_edits(lic,before_detail->>'editorSnapshot',jsonb_build_object('devices','[]'::jsonb)); RAISE EXCEPTION 'C85_STALE_EXPECTED';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'LICENSE_EDITOR_CONFLICT' THEN RAISE; END IF; END;
 FOREACH failure IN ARRAY ARRAY[outsider::text,consumer::text] LOOP
   PERFORM set_config('request.jwt.claim.sub',failure,true);
   BEGIN PERFORM public.rpc_manager_save_license_edits(lic,detail->>'editorSnapshot',jsonb_build_object('devices','[]'::jsonb)); RAISE EXCEPTION 'C85_SCOPE_EXPECTED'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 END LOOP;
 IF has_function_privilege('anon','public.rpc_manager_save_license_edits(uuid,text,jsonb)','EXECUTE') OR has_function_privilege('service_role','public.rpc_manager_save_license_edits(uuid,text,jsonb)','EXECUTE')
 OR has_function_privilege('authenticated','private.license_editor_snapshot(jsonb)','EXECUTE') THEN RAISE EXCEPTION 'C85_GRANTS'; END IF;
END; $test$;
SELECT 'C85_ATOMIC_PROMOTION_QUOTA_PAYMENT_METADATA_SOURCE_ROLLBACK_CONFLICT_SCOPE_PASS' AS result;
