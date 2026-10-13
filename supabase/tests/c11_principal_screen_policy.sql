-- C82: execute only inside BEGIN / ROLLBACK. Random identities, fake vault envelopes, no real data changes.
DO $test$
DECLARE master UUID:=gen_random_uuid(); admin_a UUID:=gen_random_uuid(); admin_b UUID:=gen_random_uuid(); consumer UUID:=gen_random_uuid();
 account UUID:=gen_random_uuid(); foreign_account UUID:=gen_random_uuid(); license UUID:=gen_random_uuid(); foreign_license UUID:=gen_random_uuid();
 main_device TEXT:='c80-'||gen_random_uuid(); secondary TEXT:='c80-'||gen_random_uuid(); third TEXT:='c80-'||gen_random_uuid(); foreign_device TEXT:='c80-'||gen_random_uuid();
 new_customer_device TEXT:='c80-'||gen_random_uuid(); installment UUID; activation UUID; v_device TEXT; v_code TEXT; n INTEGER;
 source UUID; source_code TEXT:='src_'||substr(replace(gen_random_uuid()::text,'-',''),1,16);
 new_source TEXT:='src_'||substr(replace(gen_random_uuid()::text,'-',''),1,16); key_hash TEXT:=encode(extensions.digest('012345','sha256'),'hex');
 args JSONB; new_args JSONB; result JSONB; before_count INTEGER; wrong_case JSONB; expected TEXT; detail JSONB; origin_license UUID;
 self_license UUID:=gen_random_uuid(); self_device TEXT:='c80-'||gen_random_uuid(); self_source TEXT:='csrc_'||substr(replace(gen_random_uuid()::text,'-',''),1,16);
BEGIN
 INSERT INTO auth.users(id) VALUES(master),(admin_a),(admin_b),(consumer);
 INSERT INTO public.manager_admins(user_id,role,status) VALUES(master,'OWNER','ACTIVE'),(admin_a,'ADMIN','ACTIVE'),(admin_b,'ADMIN','ACTIVE');
 INSERT INTO public.customer_accounts(id,display_name,status) VALUES(account,'C80 fixture','ACTIVE'),(foreign_account,'C80 foreign','ACTIVE');
 INSERT INTO private.manager_customer_ownership(customer_id,manager_id) VALUES(account,admin_a),(foreign_account,admin_b);
 INSERT INTO public.licenses(id,license_key_hash,mode,status,max_devices,customer_account_id)
 VALUES(license,encode(extensions.digest(license::text,'sha256'),'hex'),'MANAGED','ACTIVE',1,account),
 (foreign_license,encode(extensions.digest(foreign_license::text,'sha256'),'hex'),'MANAGED','ACTIVE',1,foreign_account);
 INSERT INTO public.devices(device_id,display_code,device_type,device_label,status,device_token_hash)
 VALUES(main_device,'XF-C80P-TEST','TV','Legacy main','AUTHORIZED',repeat('a',64)),(foreign_device,'XF-C80F-TEST','TV','Foreign','AUTHORIZED',repeat('b',64));
 INSERT INTO public.license_devices(license_id,device_id,status) VALUES(license,main_device,'ACTIVE'),(foreign_license,foreign_device,'ACTIVE');
 INSERT INTO public.managed_sources(source_id,name,source_type,version,status) VALUES(source_code,'C80 source','M3U',1,'ACTIVE') RETURNING id INTO source;
 INSERT INTO private.manager_source_ownership(source_id,manager_id) VALUES(source_code,admin_a);
 INSERT INTO private.managed_source_secret_vault(source_id,source_version,protocol,ciphertext,nonce,auth_tag,key_version)
 VALUES(source_code,1,'M3U','aa',repeat('a',24),repeat('b',32),'v1');
 INSERT INTO public.device_source_bindings(license_id,device_id,source_id) VALUES(license,main_device,source);
 -- Three pending installations with synthetic permanent keys, rolled back at end.
 FOR n IN 1..3 LOOP
   v_device:=CASE n WHEN 1 THEN secondary WHEN 2 THEN third ELSE new_customer_device END;
   v_code:=CASE n WHEN 1 THEN 'XF-C80S-TEST' WHEN 2 THEN 'XF-C80T-TEST' ELSE 'XF-C80N-TEST' END;
   installment:=gen_random_uuid(); activation:=gen_random_uuid();
   INSERT INTO public.app_installations(installation_id,device_id,display_code,package_name,platform,app_version,device_type)
     VALUES(installment,v_device,v_code,'com.xandeflix.prebuilt','ANDROID','1.0','TV');
   INSERT INTO public.device_activation_requests(activation_id,installation_id,device_id,display_code,device_token_hash,activation_key_hash,activation_status_secret_hash,status,device_type)
     VALUES(activation,installment,v_device,v_code,repeat('d',64),key_hash,repeat('e',64),'PENDING','TV');
   INSERT INTO private.device_activation_key_vault(device_id,display_code,activation_key_hash,ciphertext,nonce,auth_tag,key_version,key_status)
     VALUES(v_device,v_code,key_hash,'aa',repeat('a',24),repeat('b',32),'v1','ACTIVE');
 END LOOP;
 args:=jsonb_build_object('p_display_code','XF-C80S-TEST','p_activation_key_hash',key_hash,'p_license_id',license,
   'p_customer_id',account,'p_flow_mode','EXISTING_CUSTOMER','p_existing_display_code','XF-C80P-TEST');
 new_args:=jsonb_build_object('p_display_code','XF-C80N-TEST','p_activation_key_hash',key_hash,
   'p_flow_mode','NEW_CUSTOMER','p_new_customer_name','C80 new fixture','p_source_id',new_source,'p_source_type','M3U',
   'p_display_name','C80 new source','p_ciphertext','aa','p_nonce',repeat('a',24),'p_auth_tag',repeat('b',32),'p_key_version','v1');

 IF has_function_privilege('anon','public.rpc_manager_edit_license_screens(uuid,text,integer,integer,text,integer,text,boolean)','EXECUTE')
 OR has_function_privilege('authenticated','public.rpc_signal_public_complete_with_screens(text,text,uuid,text,text,text,text,text,text,text,text,text,integer)','EXECUTE')
 OR has_table_privilege('authenticated','private.license_screen_payments','SELECT') OR has_table_privilege('service_role','private.license_capacity_operations','INSERT') THEN RAISE EXCEPTION 'C82_PRIVILEGES'; END IF;
 PERFORM set_config('request.jwt.claim.sub',consumer::text,true);
 BEGIN PERFORM public.rpc_manager_promote_license_device(license,'XF-C80P-TEST'); RAISE EXCEPTION 'C82_USER_PROMOTE'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN PERFORM public.rpc_manager_edit_license_screens(license,'XF-C80P-TEST',4,4,'Fixture'); RAISE EXCEPTION 'C82_USER_EDIT'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 PERFORM set_config('request.jwt.claim.sub',admin_b::text,true);
 BEGIN PERFORM public.rpc_manager_promote_license_device(license,'XF-C80P-TEST'); RAISE EXCEPTION 'C82_FOREIGN_PROMOTE'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN PERFORM public.rpc_manager_edit_license_screens(license,'XF-C80P-TEST',4,4,'Fixture'); RAISE EXCEPTION 'C82_FOREIGN_EDIT'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 PERFORM set_config('request.jwt.claim.sub',admin_a::text,true);
 BEGIN PERFORM public.rpc_manager_edit_license_screens(license,'XF-C80P-TEST',4,4,'Fixture'); RAISE EXCEPTION 'C82_LEGACY_ROOT'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'PRINCIPAL_REQUIRED' THEN RAISE; END IF; END;
 PERFORM public.rpc_manager_promote_license_device(license,'XF-C80P-TEST');
 BEGIN PERFORM public.rpc_manager_update_license_limits(license,4,4,'Fixture'); RAISE EXCEPTION 'C82_OLD_EDIT'; EXCEPTION WHEN insufficient_privilege THEN IF SQLERRM<>'LICENSE_EDIT_REQUIRED' THEN RAISE; END IF; END;
 BEGIN UPDATE public.licenses SET max_devices=2 WHERE id=license; RAISE EXCEPTION 'C82_DIRECT_GROWTH'; EXCEPTION WHEN insufficient_privilege THEN IF SQLERRM<>'LICENSE_EDIT_REQUIRED' THEN RAISE; END IF; END;
 -- Client-controlled session settings do not authorize capacity changes.
 PERFORM set_config('app.license_edit_authorized','true',true);
 BEGIN UPDATE public.licenses SET max_devices=2 WHERE id=license; RAISE EXCEPTION 'C82_GUC_BYPASS'; EXCEPTION WHEN insufficient_privilege THEN IF SQLERRM<>'LICENSE_EDIT_REQUIRED' THEN RAISE; END IF; END;
 PERFORM public.rpc_manager_edit_license_screens(license,'XF-C80P-TEST',4,4,'Fixture');
 BEGIN PERFORM public.rpc_manager_edit_license_screens(license,'XF-C80P-TEST',5,4,'Fixture'); RAISE EXCEPTION 'C82_NO_PAYMENT'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'EXTRA_SCREENS_PAYMENT_REQUIRED' THEN RAISE; END IF; END;
 BEGIN PERFORM public.rpc_manager_edit_license_screens(license,'XF-C80P-TEST',5,4,'Fixture',1,'https://invalid',true); RAISE EXCEPTION 'C82_UNSAFE_PAYMENT'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'PAYMENT_REFERENCE_INVALID' THEN RAISE; END IF; END;
 BEGIN PERFORM public.rpc_manager_edit_license_screens(license,'XF-C80P-TEST',5,4,'Fixture',1,'C82-PROOF',false); RAISE EXCEPTION 'C82_UNCONFIRMED_PAYMENT'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'PAYMENT_REFERENCE_INVALID' THEN RAISE; END IF; END;
 BEGIN PERFORM public.rpc_manager_edit_license_screens(license,'XF-C80P-TEST',4,5,'Fixture'); RAISE EXCEPTION 'C82_SIMULTANEOUS'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'CONCURRENT_LIMIT_EXCEEDS_DEVICES' THEN RAISE; END IF; END;
 PERFORM public.rpc_manager_edit_license_screens(license,'XF-C80P-TEST',5,4,'Fixture',1,'C82-PROOF',true);
 IF (SELECT max_devices FROM public.licenses WHERE id=license)<>5 OR NOT EXISTS(SELECT 1 FROM public.commercial_audit_logs WHERE target_id=license::text AND reason LIKE '%C82-PROOF%') THEN RAISE EXCEPTION 'C82_PAID_CAPACITY'; END IF;
 BEGIN PERFORM public.rpc_manager_edit_license_screens(license,'XF-C80P-TEST',6,4,'Fixture'); RAISE EXCEPTION 'C82_PAYMENT_SHORT'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'EXTRA_SCREENS_PAYMENT_REQUIRED' THEN RAISE; END IF; END;
 PERFORM public.rpc_manager_edit_license_screens(license,'XF-C80P-TEST',4,2,'Fixture decrease');
 BEGIN PERFORM public.rpc_manager_activate_device_configured(args,'Quarto',5,2,'SECONDARY','XF-C80P-TEST'); RAISE EXCEPTION 'C82_ACTIVATION_GROWTH'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'LICENSE_EDIT_REQUIRED' THEN RAISE; END IF; END;
 result:=public.rpc_manager_activate_device_configured(args,'Quarto',4,2,'SECONDARY','XF-C80P-TEST');
 IF result->>'success'<>'true' OR (SELECT device_token_hash FROM public.devices WHERE device_id=secondary)<>repeat('d',64)
 OR NOT EXISTS(SELECT 1 FROM private.device_activation_key_vault WHERE device_id=secondary AND activation_key_hash=key_hash) THEN RAISE EXCEPTION 'C82_ACTIVATION_IDENTITY'; END IF;
 BEGIN PERFORM public.rpc_manager_edit_license_screens(license,'XF-C80S-TEST',4,2,'Fixture'); RAISE EXCEPTION 'C82_SECONDARY_EDIT'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'PRINCIPAL_REQUIRED' THEN RAISE; END IF; END;
 BEGIN PERFORM public.rpc_manager_edit_license_screens(license,'XF-C80P-TEST',1,1,'Fixture',2,'C82-ROLLBACK-PROOF',true); RAISE EXCEPTION 'C82_BELOW_ACTIVE'; EXCEPTION WHEN insufficient_privilege THEN IF SQLERRM<>'CANNOT_REDUCE_BELOW_ACTIVE_DEVICES' THEN RAISE; END IF; END;
 IF EXISTS(SELECT 1 FROM private.license_screen_payments WHERE license_id=license AND payment_reference='C82-ROLLBACK-PROOF') THEN RAISE EXCEPTION 'C82_PROOF_PARTIAL_WRITE'; END IF;
 -- New principal cannot secretly provision more than one screen.
 BEGIN PERFORM public.rpc_manager_activate_device_configured(new_args,'Sala',4,4,'PRIMARY'); RAISE EXCEPTION 'C82_NEW_EXTRA'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'LICENSE_EDIT_REQUIRED' THEN RAISE; END IF; END;
 result:=public.rpc_manager_activate_device_configured(new_args,'Sala',1,1,'PRIMARY'); origin_license:=(result->>'licenseId')::uuid;
 BEGIN PERFORM public.rpc_manager_link_license_device(license,'XF-C80N-TEST','XF-C80P-TEST','Tablet',4,2,'SECONDARY',true); RAISE EXCEPTION 'C82_PRINCIPAL_AS_SECONDARY'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'PRIMARY_CANNOT_BECOME_SECONDARY' THEN RAISE; END IF; END;
 BEGIN PERFORM public.rpc_manager_link_license_device(origin_license,'XF-C80P-TEST','XF-C80N-TEST','TV',1,1,'SECONDARY',true); RAISE EXCEPTION 'C82_ROOT_WITH_CHILD'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'PRIMARY_CANNOT_BECOME_SECONDARY' THEN RAISE; END IF; END;
 -- Transfer a genuine secondary, preserving permanent key and destination source.
 PERFORM public.rpc_manager_edit_license_screens(origin_license,'XF-C80N-TEST',2,2,'Fixture');
 PERFORM public.rpc_manager_link_license_device(origin_license,'XF-C80S-TEST','XF-C80N-TEST','Tablet',2,2,'SECONDARY',true);
 BEGIN PERFORM public.rpc_manager_link_license_device(origin_license,'XF-C80T-TEST','XF-C80N-TEST','TV',2,2,'SECONDARY',false,key_hash);
 RAISE EXCEPTION 'C82_FULL_SLOT'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'LICENSE_DEVICE_LIMIT_REACHED' THEN RAISE; END IF; END;
 IF NOT EXISTS(SELECT 1 FROM public.device_source_bindings b JOIN public.managed_sources s ON s.id=b.source_id WHERE b.device_id=secondary AND s.source_id=new_source)
 OR (SELECT device_token_hash FROM public.devices WHERE device_id=secondary)<>repeat('d',64) THEN RAISE EXCEPTION 'C82_TRANSFER_IDENTITY_SOURCE'; END IF;
 BEGIN PERFORM public.rpc_manager_link_license_device(origin_license,'XF-C80S-TEST','XF-C80N-TEST','Tablet',3,2,'SECONDARY',true); RAISE EXCEPTION 'C82_LINK_LIMIT_EDIT'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'VERSION_CONFLICT' THEN RAISE; END IF; END;
 PERFORM public.rpc_manager_promote_license_device(origin_license,'XF-C80S-TEST');
 IF NOT EXISTS(SELECT 1 FROM private.manager_device_relationships WHERE license_id=origin_license AND device_id=secondary AND device_role='PRIMARY' AND primary_device_id IS NULL)
 OR (SELECT max_devices FROM public.licenses WHERE id=origin_license)<>2 THEN RAISE EXCEPTION 'C82_PROMOTION_CAPACITY'; END IF;
 BEGIN UPDATE private.manager_device_relationships SET device_role='SECONDARY',primary_device_id=new_customer_device WHERE license_id=origin_license AND device_id=secondary;
 RAISE EXCEPTION 'C82_RELATIONSHIP_DEMOTION'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'PRIMARY_CANNOT_BECOME_SECONDARY' THEN RAISE; END IF; END;
 detail:=public.rpc_manager_get_license_detail(license);
 IF (detail->'screenAllowance'->>'paidExtraScreens')::int<>1 OR detail::text LIKE '%C82-PROOF%' OR EXISTS(SELECT 1 FROM private.license_capacity_operations) THEN RAISE EXCEPTION 'C82_PRIVATE_LEDGER'; END IF;
 PERFORM set_config('request.jwt.claim.sub',master::text,true);
 PERFORM public.rpc_manager_promote_license_device(foreign_license,'XF-C80F-TEST');
 PERFORM public.rpc_manager_edit_license_screens(foreign_license,'XF-C80F-TEST',4,4,'MASTER fixture');
END; $test$;

-- BEGIN/ROLLBACK only. Metadata proofs below are synthetic test substitutes, never committed.
DO $test$
DECLARE master UUID:=gen_random_uuid(); admin_a UUID:=gen_random_uuid(); admin_b UUID:=gen_random_uuid();
  customer_a UUID:=gen_random_uuid(); customer_b UUID:=gen_random_uuid();
  da TEXT:='c70-signal-'||gen_random_uuid(); db TEXT:='c70-signal-'||gen_random_uuid(); dc TEXT:='c70-signal-'||gen_random_uuid();
  result JSONB; first_result JSONB; la UUID; lb UUID; request_a UUID; request_b UUID; request_c UUID;
  src_a TEXT:='csrc_c70'||replace(gen_random_uuid()::text,'-',''); src_b TEXT:='csrc_c70'||replace(gen_random_uuid()::text,'-','');
BEGIN
  INSERT INTO auth.users(id) VALUES(master),(admin_a),(admin_b),(customer_a),(customer_b);
  INSERT INTO public.manager_admins(user_id,role,status) VALUES(master,'OWNER','ACTIVE'),(admin_a,'ADMIN','ACTIVE'),(admin_b,'ADMIN','ACTIVE');
  INSERT INTO public.devices(device_id,display_code,device_type,status,device_token_hash)
    VALUES(da,'XF-C70C-TEST','PHONE','PENDING_MANAGER_APPROVAL',repeat('1',64)),
      (db,'XF-C70D-TEST','TABLET','PENDING_MANAGER_APPROVAL',repeat('2',64)),
      (dc,'XF-C70E-TEST','TV','PENDING_MANAGER_APPROVAL',repeat('3',64));
  INSERT INTO public.app_installations(installation_id,device_id,display_code,package_name,platform,device_type,app_version)
    SELECT gen_random_uuid(),device_id,display_code,'com.xandeflix.prebuilt','ANDROID',device_type,'1.0' FROM public.devices WHERE device_id IN (da,db,dc);
  INSERT INTO public.device_activation_requests(installation_id,device_id,display_code,device_token_hash,activation_key_hash,activation_status_secret_hash,status,device_type)
    SELECT installation_id,device_id,display_code,repeat('f',64),encode(extensions.digest(device_id,'sha256'),'hex'),repeat('f',64),'PENDING',device_type
      FROM public.app_installations WHERE device_id IN (da,db,dc);
  SELECT activation_id INTO request_a FROM public.device_activation_requests WHERE device_id=da;
  SELECT activation_id INTO request_b FROM public.device_activation_requests WHERE device_id=db;
  SELECT activation_id INTO request_c FROM public.device_activation_requests WHERE device_id=dc;
  INSERT INTO public.device_activation_sessions(activation_id,session_token_hash,expires_at)
    VALUES(request_a,repeat('1',64),now()+interval '5 minutes'),(request_b,repeat('2',64),now()+interval '5 minutes'),(request_c,repeat('3',64),now()+interval '5 minutes');
  PERFORM set_config('request.jwt.claim.role','service_role',true);
  PERFORM set_config('request.jwt.claim.sub','',true);
  PERFORM set_config('request.jwt.claims','{"role":"service_role"}',true);
  -- Do not decrypt real data in tests; mark existing versions only inside rollback.
  INSERT INTO private.signal_source_index(source_kind,source_id,source_version,fingerprint)
    SELECT 'CUSTOMER',source_id,source_version,repeat('0',64) FROM private.customer_source_secret_vault ON CONFLICT DO NOTHING;
  INSERT INTO private.signal_source_index(source_kind,source_id,source_version,fingerprint)
    SELECT 'MANAGED',source_id,source_version,repeat('0',64) FROM private.managed_source_secret_vault ON CONFLICT DO NOTHING;

  BEGIN PERFORM public.rpc_signal_public_complete_with_screens(repeat('1',64),'XF-C70C-TEST',customer_a,'C82',src_a,'M3U','Synthetic','aa',repeat('a',24),repeat('b',32),'v1',repeat('8',64),5);
  RAISE EXCEPTION 'C82_SELF_FIVE'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'INITIAL_SCREEN_LIMIT' THEN RAISE; END IF; END;
  first_result:=public.rpc_signal_public_complete_with_screens(repeat('1',64),'XF-C70C-TEST',customer_a,'C82-'||left(customer_a::text,8),src_a,'M3U','Synthetic','aa',repeat('a',24),repeat('b',32),'v1',repeat('8',64),4);
  la:=(first_result->>'licenseId')::uuid;
  IF first_result->>'success'<>'true' OR (SELECT max_devices FROM public.licenses WHERE id=la)<>4 OR (SELECT max_concurrent_sessions FROM public.licenses WHERE id=la)<>4
  OR NOT EXISTS(SELECT 1 FROM private.manager_device_relationships WHERE license_id=la AND device_id=da AND device_role='PRIMARY') THEN RAISE EXCEPTION 'C82_SELF_FOUR'; END IF;
  -- A repeated capability may not reconfigure the licensed quantity.
  BEGIN PERFORM public.rpc_signal_public_complete_with_screens(repeat('1',64),'XF-C70C-TEST',customer_a,'C82',src_a,'M3U','Synthetic','aa',repeat('a',24),repeat('b',32),'v1',repeat('8',64),2);
  RAISE EXCEPTION 'C82_SELF_RECONFIGURE'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'LICENSE_EDIT_REQUIRED' THEN RAISE; END IF; END;
  BEGIN PERFORM public.rpc_signal_public_check(repeat('2',64),'XF-C70D-TEST',repeat('8',64)); RAISE EXCEPTION 'C82_SELF_UNAPPROVED_SIGNAL'; EXCEPTION WHEN insufficient_privilege THEN IF SQLERRM<>'ADDITIONAL_DEVICE_REQUIRES_APPROVAL' THEN RAISE; END IF; END;
  result:=public.rpc_signal_public_complete_with_screens(repeat('2',64),'XF-C70D-TEST',customer_b,'C82-'||left(customer_b::text,8),src_b,'M3U','Synthetic','aa',repeat('a',24),repeat('b',32),'v1',repeat('9',64),1);
  lb:=(result->>'licenseId')::uuid;
  IF (SELECT max_devices FROM public.licenses WHERE id=lb)<>1 OR (SELECT max_concurrent_sessions FROM public.licenses WHERE id=lb)<>1 THEN RAISE EXCEPTION 'C82_SELF_ONE'; END IF;
  PERFORM set_config('request.jwt.claim.role','authenticated',true); PERFORM set_config('request.jwt.claim.sub',master::text,true); PERFORM set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',master)::text,true);
  BEGIN PERFORM public.rpc_manager_edit_license_screens(la,'XF-C70C-TEST',5,5,'Fixture'); RAISE EXCEPTION 'C82_SELF_EXTRA_UNPAID'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'EXTRA_SCREENS_PAYMENT_REQUIRED' THEN RAISE; END IF; END;
  PERFORM public.rpc_manager_edit_license_screens(la,'XF-C70C-TEST',5,5,'Fixture',1,'C82-SELF-PROOF',true);
  IF (SELECT max_devices FROM public.licenses WHERE id=la)<>5 OR (SELECT manager_approved_additional_devices FROM public.licenses WHERE id=la)<4 THEN RAISE EXCEPTION 'C82_SELF_PAID_FIVE'; END IF;
  PERFORM public.rpc_manager_link_license_device(la,'XF-C80T-TEST','XF-C70C-TEST','TV',5,5,'SECONDARY',false,encode(extensions.digest('012345','sha256'),'hex'));
  IF NOT EXISTS(SELECT 1 FROM private.additional_signal_device_approvals a JOIN public.devices d ON d.device_id=a.device_id WHERE a.license_id=la AND d.display_code='XF-C80T-TEST' AND a.source_id=src_a)
  OR (SELECT max_devices FROM public.licenses WHERE id=la)<>5 THEN RAISE EXCEPTION 'C82_SELF_APPROVAL_BOUNDARY'; END IF;
END; $test$;
SELECT 'C82_PRINCIPAL_SCREEN_POLICY_PASS' AS result;
