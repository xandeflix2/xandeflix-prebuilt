-- Execute only inside BEGIN/ROLLBACK; isolated random fixtures, no real customers.
DO $test$
DECLARE
 manager uuid:=gen_random_uuid(); account uuid:=gen_random_uuid(); other_account uuid:=gen_random_uuid();
 lic uuid:=gen_random_uuid(); origin uuid:=gen_random_uuid(); origin2 uuid:=gen_random_uuid(); sid uuid; other_sid uuid;
 src text:='src_'||replace(gen_random_uuid()::text,'-',''); other_src text:='src_'||replace(gen_random_uuid()::text,'-','');
 fixture_devices text[]:=ARRAY[]::text[]; codes text[]:=ARRAY[]::text[]; detail jsonb; payload jsonb; proof_count integer; i integer;
BEGIN
 INSERT INTO auth.users(id) VALUES(manager);
 INSERT INTO public.manager_admins(user_id,role,status) VALUES(manager,'ADMIN','ACTIVE');
 INSERT INTO public.customer_accounts(id,display_name,status) VALUES(account,'C87 principal','ACTIVE'),(other_account,'C87 origin','ACTIVE');
 INSERT INTO private.manager_customer_ownership(customer_id,manager_id) VALUES(account,manager),(other_account,manager);
 INSERT INTO public.licenses(id,license_key_hash,mode,status,max_devices,customer_account_id)
 VALUES(lic,encode(extensions.digest(lic::text,'sha256'),'hex'),'MANAGED','ACTIVE',1,account),
 (origin,encode(extensions.digest(origin::text,'sha256'),'hex'),'MANAGED','ACTIVE',1,other_account),
 (origin2,encode(extensions.digest(origin2::text,'sha256'),'hex'),'MANAGED','ACTIVE',1,other_account);
 INSERT INTO public.managed_sources(source_id,name,source_type,version,status) VALUES(src,'C87 source','M3U',1,'ACTIVE') RETURNING id INTO sid;
 INSERT INTO public.managed_sources(source_id,name,source_type,version,status) VALUES(other_src,'C87 previous source','M3U',1,'ACTIVE') RETURNING id INTO other_sid;
 INSERT INTO private.manager_source_ownership(source_id,manager_id) VALUES(src,manager),(other_src,manager);
 INSERT INTO private.managed_source_secret_vault(source_id,source_version,protocol,ciphertext,nonce,auth_tag,key_version)
 VALUES(src,1,'M3U','aa',repeat('a',24),repeat('b',32),'v1'),(other_src,1,'M3U','bb',repeat('b',24),repeat('c',32),'v1');
 PERFORM set_config('request.jwt.claim.role','authenticated',true); PERFORM set_config('request.jwt.claim.sub',manager::text,true);
 FOR i IN 1..6 LOOP
   fixture_devices:=array_append(fixture_devices,'c87-'||gen_random_uuid());
   codes:=array_append(codes,'XF-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,4))||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,4)));
   INSERT INTO public.devices(device_id,display_code,device_type,device_label,status,device_token_hash)
   VALUES(fixture_devices[i],codes[i],'TV','C87 device '||i,'AUTHORIZED',repeat('a',64));
   INSERT INTO public.license_devices(license_id,device_id,status) VALUES(CASE WHEN i<=4 THEN lic WHEN i=5 THEN origin ELSE origin2 END,fixture_devices[i],'ACTIVE');
   INSERT INTO public.device_source_bindings(license_id,device_id,source_id) VALUES(CASE WHEN i<=4 THEN lic WHEN i=5 THEN origin ELSE origin2 END,fixture_devices[i],CASE WHEN i<=4 THEN sid ELSE other_sid END);
   IF i=1 THEN
     PERFORM public.rpc_manager_promote_license_device(lic,codes[i]);
     PERFORM public.rpc_manager_edit_license_screens(lic,codes[i],4,4,'C87 initial four');
   ELSIF i<=4 THEN
     INSERT INTO private.manager_device_relationships(license_id,device_id,device_role,primary_device_id,manager_id) VALUES(lic,fixture_devices[i],'SECONDARY',fixture_devices[1],manager);
   END IF;
 END LOOP;
 PERFORM private.assign_license_slots(lic);
 BEGIN
   PERFORM public.rpc_manager_link_license_device(lic,codes[5],codes[1],'C87 fifth',4,4,'SECONDARY',true);
   RAISE EXCEPTION 'C87_FULL_MUST_DENY';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'LICENSE_DEVICE_LIMIT_REACHED' THEN RAISE; END IF; END;
 detail:=public.rpc_manager_get_license_detail(lic);
 payload:=jsonb_build_object('devices','[]'::jsonb,'screens',jsonb_build_object('principalCode',codes[1],'maxDevices',5,'maxSessions',4,'reason','PONTO-ADICIONAL','paidExtraScreens',1,'paymentReference','INDISPONIVEL','paymentConfirmed',false));
 BEGIN
   PERFORM public.rpc_manager_save_license_edits(lic,detail->>'editorSnapshot',payload);
   RAISE EXCEPTION 'C87_UNCONFIRMED_MUST_DENY';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'PAYMENT_REFERENCE_INVALID' THEN RAISE; END IF; END;
 IF (SELECT max_devices FROM public.licenses WHERE id=lic)<>4 OR EXISTS(SELECT 1 FROM private.license_screen_payments WHERE license_id=lic) THEN RAISE EXCEPTION 'C87_UNCONFIRMED_PARTIAL_WRITE'; END IF;
 payload:=jsonb_set(payload,'{screens,paymentConfirmed}','true');
 PERFORM public.rpc_manager_save_license_edits(lic,detail->>'editorSnapshot',payload);
 IF (SELECT max_devices FROM public.licenses WHERE id=lic)<>5 OR (SELECT max_concurrent_sessions FROM public.licenses WHERE id=lic)<>4 THEN RAISE EXCEPTION 'C87_QUOTA_NOT_SAVED'; END IF;
 SELECT count(*) INTO proof_count FROM private.license_screen_payments WHERE license_id=lic;
 detail:=public.rpc_manager_get_license_detail(lic);
 PERFORM public.rpc_manager_save_license_edits(lic,detail->>'editorSnapshot',payload);
 IF (SELECT max_devices FROM public.licenses WHERE id=lic)<>5 OR proof_count<>(SELECT count(*) FROM private.license_screen_payments WHERE license_id=lic) THEN RAISE EXCEPTION 'C87_DUPLICATE_ALLOWANCE'; END IF;
 -- C88: the source editor saves only the transfer. No source principal/payment is required.
 detail:=public.rpc_manager_get_license_detail(origin);
 PERFORM public.rpc_manager_save_license_edits(origin,detail->>'editorSnapshot',jsonb_build_object('devices',jsonb_build_array(jsonb_build_object(
   'licenseId',origin,'displayCode',codes[5],'label','C87 fifth','platform','ANDROID','deviceType','TV','expectedRole','','role','SECONDARY',
   'primaryLicenseId',lic,'primaryCode',codes[1],'slotNumber',5,'roleConfirmed',true))));
 IF (SELECT max_devices FROM public.licenses WHERE id=origin)<>1 OR EXISTS(SELECT 1 FROM private.license_screen_payments WHERE license_id=origin) THEN RAISE EXCEPTION 'C88_ORIGIN_CAPACITY_PAYMENT_CHANGED'; END IF;
 IF NOT EXISTS(SELECT 1 FROM private.license_device_slots WHERE license_id=lic AND device_id=fixture_devices[5] AND slot_number=5)
 OR (SELECT count(*) FROM public.license_devices WHERE license_id=lic AND status='ACTIVE')<>5
 OR EXISTS(SELECT 1 FROM public.license_devices WHERE device_id=fixture_devices[5] AND license_id=origin)
 OR NOT EXISTS(SELECT 1 FROM public.device_source_bindings WHERE license_id=lic AND device_id=fixture_devices[5] AND source_id=sid)
 OR NOT EXISTS(SELECT 1 FROM private.manager_device_relationships WHERE license_id=lic AND device_id=fixture_devices[5] AND device_role='SECONDARY' AND primary_device_id=fixture_devices[1])
 OR NOT EXISTS(SELECT 1 FROM public.devices WHERE device_id=fixture_devices[5] AND display_code=codes[5] AND device_token_hash=repeat('a',64)) THEN RAISE EXCEPTION 'C87_FIFTH_LINK_SOURCE_SLOT_IDENTITY'; END IF;
 detail:=public.rpc_manager_get_license_detail(lic);
 payload:=jsonb_set(jsonb_set(payload,'{screens,maxDevices}','6'),'{screens,paidExtraScreens}','2');
 PERFORM public.rpc_manager_save_license_edits(lic,detail->>'editorSnapshot',payload);
 BEGIN
   PERFORM public.rpc_manager_edit_license_device(origin2,codes[6],'C87 sixth','ANDROID','TV','','SECONDARY',lic,codes[1],5,true,null);
   RAISE EXCEPTION 'C87_DUPLICATE_SLOT_MUST_DENY';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'DEVICE_SLOT_OCCUPIED' THEN RAISE; END IF; END;
 IF NOT EXISTS(SELECT 1 FROM public.license_devices WHERE license_id=origin2 AND device_id=fixture_devices[6]) THEN RAISE EXCEPTION 'C87_FAILED_TRANSFER_PARTIAL_WRITE'; END IF;
 PERFORM public.rpc_manager_link_license_device(lic,codes[6],codes[1],'C87 sixth',6,4,'SECONDARY',true);
 IF NOT EXISTS(SELECT 1 FROM private.license_device_slots WHERE license_id=lic AND device_id=fixture_devices[6] AND slot_number=6)
 OR (SELECT count(*) FROM public.license_devices WHERE license_id=lic AND status='ACTIVE')<>6 THEN RAISE EXCEPTION 'C87_SIXTH_SLOT'; END IF;
END; $test$;
SELECT 'C87_FULL_FOUR_PAID_FIFTH_CUMULATIVE_SIXTH_SAME_SOURCE_IDENTITY_ROLLBACK_DUPLICATE_SLOT_PASS' AS result;
