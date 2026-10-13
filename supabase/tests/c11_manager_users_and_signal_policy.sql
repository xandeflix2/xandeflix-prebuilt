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
  result:=public.rpc_signal_public_check(repeat('1',64),'XF-C70C-TEST',repeat('8',64));
  IF result->>'success'<>'true' THEN RAISE EXCEPTION 'C70_FIRST_SIGNAL_CHECK'; END IF;
  first_result:=public.rpc_signal_public_complete(repeat('1',64),'XF-C70C-TEST',customer_a,'c70-'||left(customer_a::text,8),src_a,'M3U','Synthetic signal','aa',repeat('a',24),repeat('b',32),'v1',repeat('8',64));
  IF first_result->>'success'<>'true' THEN RAISE EXCEPTION 'C70_FIRST_SIGNAL_ACTIVATION'; END IF;
  la:=(first_result->>'licenseId')::uuid;
  IF (SELECT max_devices FROM public.licenses WHERE id=la)<>1 THEN RAISE EXCEPTION 'C70_FIRST_DEVICE_LIMIT'; END IF;
  BEGIN PERFORM public.rpc_signal_public_check(repeat('2',64),'XF-C70D-TEST',repeat('8',64));
    RAISE EXCEPTION 'C70_DUPLICATE_SIGNAL_ALLOWED'; EXCEPTION WHEN insufficient_privilege THEN IF SQLERRM<>'ADDITIONAL_DEVICE_REQUIRES_APPROVAL' THEN RAISE; END IF; END;
  BEGIN PERFORM public.rpc_signal_public_complete(repeat('2',64),'XF-C70D-TEST',customer_b,'c70-'||left(customer_b::text,8),src_b,'M3U','Blocked signal','aa',repeat('a',24),repeat('b',32),'v1',repeat('8',64));
    RAISE EXCEPTION 'C70_DUPLICATE_NEW_ACCOUNT_ALLOWED'; EXCEPTION WHEN insufficient_privilege THEN IF SQLERRM<>'ADDITIONAL_DEVICE_REQUIRES_APPROVAL' THEN RAISE; END IF; END;
  IF EXISTS(SELECT 1 FROM public.license_devices WHERE device_id=db) THEN RAISE EXCEPTION 'C70_DENIED_DEVICE_BOUND'; END IF;
  IF has_function_privilege('authenticated','public.rpc_signal_public_complete(text,text,uuid,text,text,text,text,text,text,text,text,text)','EXECUTE')
    OR has_function_privilege('anon','public.rpc_signal_index_pending()','EXECUTE') THEN RAISE EXCEPTION 'C70_SIGNAL_ENDPOINT_EXPOSED'; END IF;
  BEGIN PERFORM public.rpc_public_complete_device_activation(repeat('2',64),'XF-C70D-TEST',customer_b,'c70-blocked',src_b,'M3U','Blocked','aa',repeat('a',24),repeat('b',32),'v1');
    RAISE EXCEPTION 'C70_LEGACY_PUBLIC_BYPASS'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;

  PERFORM set_config('request.jwt.claim.role','authenticated',true);
  PERFORM set_config('request.jwt.claim.sub',admin_a::text,true);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',admin_a,'role','authenticated')::text,true);
  IF EXISTS(SELECT 1 FROM jsonb_array_elements(public.rpc_manager_list_users()) u WHERE u->>'userId'=customer_a::text) THEN RAISE EXCEPTION 'C70_ADMIN_UNASSIGNED_USER_VISIBLE'; END IF;
  BEGIN PERFORM public.rpc_manager_list_staff(); RAISE EXCEPTION 'C70_ADMIN_STAFF_VISIBLE'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN PERFORM public.rpc_manager_assign_user(customer_a,admin_a); RAISE EXCEPTION 'C70_ADMIN_ASSIGN_ALLOWED'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN PERFORM public.rpc_manager_allow_additional_signal_device(la,'XF-C70D-TEST'); RAISE EXCEPTION 'C70_ADMIN_CROSS_APPROVAL'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  PERFORM set_config('request.jwt.claim.sub',master::text,true);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',master,'role','authenticated')::text,true);
  IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(public.rpc_manager_list_staff()) s WHERE s->>'userId'=admin_b::text) THEN RAISE EXCEPTION 'C70_MASTER_STAFF'; END IF;
  IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(public.rpc_manager_list_users()) u WHERE u->>'userId'=customer_a::text) THEN RAISE EXCEPTION 'C70_MASTER_CONSUMERS'; END IF;
  PERFORM public.rpc_manager_assign_user(customer_a,admin_a);
  PERFORM set_config('request.jwt.claim.sub',admin_a::text,true);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',admin_a,'role','authenticated')::text,true);
  IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(public.rpc_manager_list_users()) u WHERE u->>'userId'=customer_a::text) THEN RAISE EXCEPTION 'C70_ADMIN_OWN_USER'; END IF;
  PERFORM public.rpc_manager_allow_additional_signal_device(la,'XF-C70D-TEST');
  IF (SELECT max_devices FROM public.licenses WHERE id=la)<>2 THEN RAISE EXCEPTION 'C70_APPROVED_CAPACITY'; END IF;
  PERFORM set_config('request.jwt.claim.role','service_role',true);
  PERFORM set_config('request.jwt.claim.sub','',true);
  PERFORM set_config('request.jwt.claims','{"role":"service_role"}',true);
  BEGIN PERFORM public.rpc_signal_public_check(repeat('3',64),'XF-C70E-TEST',repeat('8',64));
    RAISE EXCEPTION 'C70_CAPACITY_ALONE_BYPASS'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  result:=public.rpc_signal_public_check(repeat('2',64),'XF-C70D-TEST',repeat('8',64));
  IF result->>'customerId'<>customer_a::text THEN RAISE EXCEPTION 'C70_APPROVED_CUSTOMER_MAPPING'; END IF;
  result:=public.rpc_signal_public_complete(repeat('2',64),'XF-C70D-TEST',customer_a,'c70-'||left(customer_a::text,8),src_b,'M3U','Synthetic approved signal','aa',repeat('a',24),repeat('b',32),'v1',repeat('8',64));
  IF result->>'success'<>'true' OR result->>'licenseId'<>la::text OR NOT EXISTS(SELECT 1 FROM public.license_devices WHERE license_id=la AND device_id=db AND status='ACTIVE')
    THEN RAISE EXCEPTION 'C70_APPROVED_DEVICE_ACTIVATION'; END IF;

  -- Existing consumer source management stays owner-bound, with a trusted proof.
  PERFORM set_config('request.jwt.claim.sub',customer_a::text,true);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',customer_a,'role','authenticated')::text,true);
  BEGIN PERFORM public.rpc_customer_update_source(src_b,'Bypass','aa',repeat('a',24),repeat('b',32),'v1');
    RAISE EXCEPTION 'C70_CUSTOMER_RPC_BYPASS'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  PERFORM set_config('request.jwt.claim.role','service_role',true);
  result:=public.rpc_signal_customer_write(customer_a,'UPDATE_CUSTOMER_SOURCE',src_b,NULL,'M3U','Own signal','aa',repeat('a',24),repeat('b',32),'v1',repeat('8',64),1);
  IF result->>'success'='false' OR (SELECT version FROM public.customer_sources WHERE source_id=src_b)<>2 THEN RAISE EXCEPTION 'C70_OWN_SOURCE_UPDATE'; END IF;
  BEGIN PERFORM public.rpc_signal_customer_write(customer_b,'UPDATE_CUSTOMER_SOURCE',src_b,NULL,'M3U','Other','aa',repeat('a',24),repeat('b',32),'v1',repeat('9',64),2);
    RAISE EXCEPTION 'C70_CROSS_SOURCE_WRITE'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  INSERT INTO public.customer_accounts(id,display_name,status) VALUES(customer_b,'C70 synthetic consumer','ACTIVE');
  INSERT INTO public.customer_profiles(id,nickname,status) VALUES(customer_b,'c70-'||left(customer_b::text,8),'ACTIVE');
  lb:=gen_random_uuid();
  INSERT INTO public.licenses(id,license_key_hash,mode,status,max_devices,customer_id,customer_account_id)
    VALUES(lb,encode(extensions.digest(lb::text,'sha256'),'hex'),'SELF_SERVICE','ACTIVE',1,customer_b,customer_b);
  BEGIN PERFORM public.rpc_signal_customer_write(customer_b,'CREATE_CUSTOMER_SOURCE','csrc_c70duplicate',lb,'M3U','Other','aa',repeat('a',24),repeat('b',32),'v1',repeat('8',64),NULL);
    RAISE EXCEPTION 'C70_SOURCE_CREATE_DUPLICATE'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  result:=public.rpc_signal_customer_write(customer_b,'CREATE_CUSTOMER_SOURCE','csrc_c70unique',lb,'M3U','Own','aa',repeat('a',24),repeat('b',32),'v1',repeat('9',64),NULL);
  IF NOT EXISTS(SELECT 1 FROM public.customer_sources WHERE source_id='csrc_c70unique' AND customer_id=customer_b)
    OR NOT EXISTS(SELECT 1 FROM private.signal_source_index WHERE source_id='csrc_c70unique' AND fingerprint=repeat('9',64))
    THEN RAISE EXCEPTION 'C70_CREATE_OPAQUE_ID_OR_PROOF'; END IF;
  -- Repair must replace only the verified owner's source, never skip a foreign one.
  DELETE FROM private.signal_source_index WHERE source_id=src_b AND source_version=2;
  DELETE FROM private.signal_source_index WHERE source_id='csrc_c70unique';
  BEGIN PERFORM public.rpc_signal_customer_write(customer_a,'UPDATE_CUSTOMER_SOURCE',src_b,NULL,'M3U','Own','aa',repeat('a',24),repeat('b',32),'v1',repeat('8',64),2);
    RAISE EXCEPTION 'C70_REPAIR_SKIPPED_FOREIGN_UNKNOWN'; EXCEPTION WHEN insufficient_privilege THEN IF SQLERRM<>'SOURCE_POLICY_PREPARING' THEN RAISE; END IF; END;
  PERFORM public.rpc_signal_index_record('CUSTOMER','csrc_c70unique',1,repeat('9',64));
  result:=public.rpc_signal_customer_write(customer_a,'UPDATE_CUSTOMER_SOURCE',src_b,NULL,'M3U','Owned repair','aa',repeat('a',24),repeat('b',32),'v1',repeat('8',64),2);
  IF result->>'success'='false' OR (SELECT version FROM public.customer_sources WHERE source_id=src_b)<>3 THEN RAISE EXCEPTION 'C70_AUTHENTICATED_OWN_REPAIR'; END IF;
  DELETE FROM private.signal_source_index WHERE source_id=src_b AND source_version=3;
  IF public.rpc_signal_public_owned_target(repeat('3',64),'XF-C70E-TEST') IS NOT NULL THEN RAISE EXCEPTION 'C70_NEW_DEVICE_REPAIR_TARGET'; END IF;
  BEGIN PERFORM public.rpc_signal_public_complete(repeat('3',64),'XF-C70E-TEST',customer_b,'c70-'||left(customer_b::text,8),'csrc_c70newbypass','M3U','Unknown','aa',repeat('a',24),repeat('b',32),'v1',repeat('7',64));
    RAISE EXCEPTION 'C70_NEW_DEVICE_REPAIR_BYPASS'; EXCEPTION WHEN insufficient_privilege THEN IF SQLERRM<>'SOURCE_POLICY_PREPARING' THEN RAISE; END IF; END;
  UPDATE public.device_activation_requests SET status='PENDING' WHERE activation_id=request_a;
  UPDATE public.device_activation_sessions SET status='OPEN',expires_at=now()+interval '5 minutes' WHERE activation_id=request_a;
  result:=public.rpc_signal_public_owned_target(repeat('1',64),'XF-C70C-TEST');
  IF result->>'sourceId'<>src_b OR (result->>'version')::integer<>3 THEN RAISE EXCEPTION 'C70_PUBLIC_OWN_REPAIR_TARGET'; END IF;
  result:=public.rpc_signal_public_complete(repeat('1',64),'XF-C70C-TEST',customer_a,'c70-'||left(customer_a::text,8),'csrc_c70ownedrepair','M3U','Own replacement','aa',repeat('a',24),repeat('b',32),'v1',repeat('8',64));
  IF result->>'success'<>'true' OR result->>'licenseId'<>la::text OR (SELECT max_devices FROM public.licenses WHERE id=la)<>2
    OR (SELECT count(*) FROM public.license_devices WHERE license_id=la)<>2
    OR NOT EXISTS(SELECT 1 FROM private.signal_source_index WHERE source_id='csrc_c70ownedrepair' AND fingerprint=repeat('8',64))
    THEN RAISE EXCEPTION 'C70_PUBLIC_OWN_REPAIR_CHANGED_CAPACITY'; END IF;
END; $test$;
SELECT 'C70_USERS_SIGNAL_POLICY_ROLLBACK_PASS' AS result;
