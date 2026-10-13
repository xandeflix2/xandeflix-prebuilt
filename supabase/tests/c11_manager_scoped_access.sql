-- Run in BEGIN/ROLLBACK together with the candidate migration. No fixture persists.
DO $test$
DECLARE master UUID:=gen_random_uuid(); admin_a UUID:=gen_random_uuid(); admin_b UUID:=gen_random_uuid();
  consumer UUID:=gen_random_uuid(); disabled UUID:=gen_random_uuid(); ca UUID:=gen_random_uuid(); cb UUID:=gen_random_uuid();
  la UUID:=gen_random_uuid(); lb UUID:=gen_random_uuid(); da TEXT:='c70-test-'||gen_random_uuid(); db TEXT:='c70-test-'||gen_random_uuid();
  result JSONB; fixture JSONB; v_user UUID; v_op TEXT; report_a UUID:=gen_random_uuid(); report_b UUID:=gen_random_uuid();
  diagnostic JSONB:='{"PACKAGE":"com.xandeflix.prebuilt","APP_VERSION":"1.0","BUNDLE":"index-fixture.js","UTC":"2026-10-11T12:00:00.000Z","PAGE":"series-detail","ERROR_CODE":"NATIVE_ERROR","ERROR_CATEGORY":"MEDIA_PARSER_FAILURE","HTTP_STATUS":"UNAVAILABLE","MEDIA3_ERROR_CODE":"3001","CHECKPOINT":"PLAYER_READY","ANDROID":"28","WEBVIEW_CHROME":"128.0.0.0"}'::jsonb;
BEGIN
  INSERT INTO auth.users(id) VALUES(master),(admin_a),(admin_b),(consumer),(disabled);
  INSERT INTO public.manager_admins(user_id,role,status) VALUES(master,'OWNER','ACTIVE'),(admin_a,'ADMIN','ACTIVE'),(admin_b,'ADMIN','ACTIVE'),(disabled,'ADMIN','DISABLED');
  INSERT INTO public.customer_accounts(id,display_name,status) VALUES(ca,'C70 synthetic A','ACTIVE'),(cb,'C70 synthetic B','ACTIVE');
  INSERT INTO private.manager_customer_ownership(customer_id,manager_id) VALUES(ca,admin_a),(cb,admin_b);
  INSERT INTO public.licenses(id,license_key_hash,mode,status,max_devices,customer_account_id)
    VALUES(la,encode(extensions.digest(la::text,'sha256'),'hex'),'MANAGED','ACTIVE',2,ca),
      (lb,encode(extensions.digest(lb::text,'sha256'),'hex'),'MANAGED','ACTIVE',2,cb);
  INSERT INTO public.devices(device_id,display_code,device_type,status,device_token_hash)
    VALUES(da,'XF-C70A-TEST','TV','AUTHORIZED',repeat('a',64)),(db,'XF-C70B-TEST','TV','AUTHORIZED',repeat('b',64));
  INSERT INTO public.license_devices(license_id,device_id,status) VALUES(la,da,'ACTIVE'),(lb,db,'ACTIVE');
  INSERT INTO private.device_activation_key_vault(device_id,display_code,activation_key_hash,ciphertext,nonce,auth_tag,key_version)
    VALUES(da,'XF-C70A-TEST',repeat('a',64),'aa',repeat('a',24),repeat('b',32),'v1'),
      (db,'XF-C70B-TEST',repeat('b',64),'aa',repeat('a',24),repeat('b',32),'v1');
  INSERT INTO public.playback_sessions(license_id,device_id,session_token_hash)
    VALUES(la,da,repeat('a',64)),(lb,db,repeat('b',64));
  INSERT INTO playback_support_private.reports(id,device_pk,license_id,request_id,diagnostic)
    SELECT report_a,id,la,gen_random_uuid(),diagnostic FROM public.devices WHERE device_id=da;
  INSERT INTO playback_support_private.reports(id,device_pk,license_id,request_id,diagnostic)
    SELECT report_b,id,lb,gen_random_uuid(),diagnostic FROM public.devices WHERE device_id=db;

  PERFORM set_config('request.jwt.claim.sub',admin_a::text,true);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',admin_a,'role','authenticated')::text,true);
  IF public.rpc_manager_access_profile()->>'role'<>'ADMIN' THEN RAISE EXCEPTION 'C70_PROFILE'; END IF;
  result:=public.rpc_manager_list_customers();
  IF jsonb_array_length(result)<>1 OR result->0->>'customerId'<>ca::text THEN RAISE EXCEPTION 'C70_CUSTOMER_LIST'; END IF;
  result:=public.rpc_manager_read_control_plane_metadata();
  IF jsonb_array_length(result->'devices')<>1 OR result->'devices'->0->>'deviceId'<>da
    OR jsonb_array_length(result->'licenses')<>1 THEN RAISE EXCEPTION 'C70_SNAPSHOT'; END IF;
  PERFORM public.rpc_manager_get_customer_detail(ca);
  PERFORM public.rpc_manager_get_license_detail(la);
  BEGIN PERFORM public.rpc_manager_get_customer_detail(cb); RAISE EXCEPTION 'C70_CROSS_CUSTOMER_ALLOWED'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN PERFORM public.rpc_manager_get_license_detail(lb); RAISE EXCEPTION 'C70_CROSS_LICENSE_ALLOWED'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN PERFORM public.rpc_manager_update_customer_status(cb,'SUSPENDED','Synthetic'); RAISE EXCEPTION 'C70_CROSS_WRITE_ALLOWED'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN PERFORM public.rpc_manager_update_license_limits(lb,2,1,'Synthetic'); RAISE EXCEPTION 'C70_CROSS_LIMITS_ALLOWED'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN PERFORM public.rpc_manager_unbind_device_source_metadata(db); RAISE EXCEPTION 'C70_CROSS_DEVICE_ALLOWED'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN PERFORM public.rpc_manager_read_control_plane(); RAISE EXCEPTION 'C70_LEGACY_READ_ALLOWED'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN PERFORM public.rpc_manager_get_device_sensitive_envelope(da); RAISE EXCEPTION 'C70_REVEAL_ALLOWED'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN PERFORM public.rpc_manager_delete_device_permanently(da,'XF-C70A-TEST'); RAISE EXCEPTION 'C70_ADMIN_DELETE_ALLOWED'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  result:=public.rpc_manager_list_playback_errors(NULL);
  IF (result->>'unreadCount')::int<>1 OR jsonb_array_length(result->'reports')<>1 OR result->'reports'->0->>'id'<>report_a::text THEN RAISE EXCEPTION 'C70_REPORT_LIST'; END IF;
  BEGIN PERFORM public.rpc_manager_mark_playback_error_read(report_b); RAISE EXCEPTION 'C70_CROSS_REPORT_ALLOWED'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  IF public.rpc_manager_list_playback_errors(report_b)->>'success'<>'false' THEN RAISE EXCEPTION 'C70_CROSS_CURSOR_ALLOWED'; END IF;
  PERFORM public.rpc_manager_mark_playback_error_read(report_a);
  IF (public.rpc_manager_list_playback_errors(NULL)->>'unreadCount')::int<>0 THEN RAISE EXCEPTION 'C70_REPORT_READ'; END IF;

  -- Actual assisted activation assigns ownership only after the canonical core succeeds.
  INSERT INTO public.devices(device_id,display_code,device_type,status,device_token_hash)
    VALUES('c70-new-'||ca::text,'XF-C70N-TEST','TV','PENDING_MANAGER_APPROVAL',repeat('c',64));
  INSERT INTO public.app_installations(installation_id,device_id,display_code,package_name,platform,device_type,app_version)
    VALUES(gen_random_uuid(),'c70-new-'||ca::text,'XF-C70N-TEST','com.xandeflix.prebuilt','ANDROID','TV','1.0');
  INSERT INTO public.device_activation_requests(installation_id,device_id,display_code,device_token_hash,activation_key_hash,activation_status_secret_hash,status,device_type)
    SELECT installation_id,device_id,display_code,repeat('c',64),repeat('c',64),repeat('c',64),'PENDING','TV'
      FROM public.app_installations WHERE device_id='c70-new-'||ca::text;
  INSERT INTO private.device_activation_key_vault(device_id,display_code,activation_key_hash,ciphertext,nonce,auth_tag,key_version)
    VALUES('c70-new-'||ca::text,'XF-C70N-TEST',repeat('c',64),'aa',repeat('a',24),repeat('b',32),'v1');
  fixture:=public.rpc_manager_complete_device_activation(
    p_display_code=>'XF-C70N-TEST',p_activation_key_hash=>repeat('c',64),
    p_source_id=>'src_c70'||replace(ca::text,'-',''),p_source_type=>'M3U',p_display_name=>'C70 fixture',
    p_ciphertext=>'aa',p_nonce=>repeat('a',24),p_auth_tag=>repeat('b',32),p_new_customer_name=>'C70 newly activated');
  IF fixture->>'success'<>'true' OR NOT private.manager_can_customer((fixture->>'customerId')::uuid)
    OR NOT private.manager_can_source(fixture->>'sourceId') THEN RAISE EXCEPTION 'C70_ACTIVATION_OWNERSHIP'; END IF;
  PERFORM public.rpc_manager_get_customer_detail((fixture->>'customerId')::uuid);
  PERFORM public.rpc_manager_update_managed_source_metadata(fixture->>'sourceId',1,'C70 own update','M3U');
  -- An explicit source owner must win over a binding to one's own customer.
  UPDATE private.manager_source_ownership SET manager_id=admin_b WHERE source_id=fixture->>'sourceId';
  IF private.manager_can_source(fixture->>'sourceId') THEN RAISE EXCEPTION 'C70_OTHER_SOURCE_OWNER'; END IF;
  BEGIN PERFORM public.rpc_manager_update_managed_source_metadata(fixture->>'sourceId',2,'Denied','M3U');
    RAISE EXCEPTION 'C70_OTHER_OWNER_WRITE'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  UPDATE private.manager_source_ownership SET manager_id=admin_a WHERE source_id=fixture->>'sourceId';
  PERFORM public.rpc_manager_update_license_limits((fixture->>'licenseId')::uuid,2,1,'C70 synthetic capacity');
  INSERT INTO public.devices(device_id,display_code,device_type,status,device_token_hash)
    VALUES('c70-extra-'||ca::text,'XF-C70X-TEST','TV','PENDING_MANAGER_APPROVAL',repeat('d',64));
  INSERT INTO private.device_activation_key_vault(device_id,display_code,activation_key_hash,ciphertext,nonce,auth_tag,key_version)
    VALUES('c70-extra-'||ca::text,'XF-C70X-TEST',repeat('d',64),'aa',repeat('a',24),repeat('b',32),'v1');
  result:=public.rpc_manager_complete_device_activation(p_display_code=>'XF-C70X-TEST',p_activation_key_hash=>repeat('d',64),
    p_customer_id=>(fixture->>'customerId')::uuid,p_existing_display_code=>'XF-C70N-TEST',p_flow_mode=>'EXISTING_CUSTOMER');
  IF result->>'success'<>'true' OR NOT private.manager_can_device('c70-extra-'||ca::text) THEN RAISE EXCEPTION 'C70_EXISTING_ACTIVATION'; END IF;
  PERFORM set_config('request.jwt.claim.sub',admin_b::text,true);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',admin_b,'role','authenticated')::text,true);
  BEGIN PERFORM public.rpc_manager_complete_device_activation(
    p_display_code=>'XF-C70N-TEST',p_activation_key_hash=>repeat('c',64),p_customer_id=>ca,
    p_source_id=>'c70_other',p_source_type=>'M3U',p_ciphertext=>'aa',p_nonce=>repeat('a',24),p_auth_tag=>repeat('b',32));
    RAISE EXCEPTION 'C70_ACTIVATION_TAKEOVER'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN PERFORM public.rpc_manager_update_managed_source_metadata(fixture->>'sourceId',1,'Other','M3U');
    RAISE EXCEPTION 'C70_SOURCE_CROSS_WRITE'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;

  -- Authenticated consumers, disabled managers and anonymous callers all fail.
  FOREACH v_user IN ARRAY ARRAY[consumer,disabled,NULL::uuid] LOOP
    PERFORM set_config('request.jwt.claim.sub',coalesce(v_user::text,''),true);
    PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',v_user,'role','authenticated')::text,true);
    BEGIN PERFORM public.rpc_manager_access_profile(); RAISE EXCEPTION 'C70_INVALID_PROFILE_ALLOWED'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
    BEGIN PERFORM public.rpc_manager_list_customers(); RAISE EXCEPTION 'C70_INVALID_LIST_ALLOWED'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  END LOOP;
  PERFORM set_config('request.jwt.claim.sub',admin_b::text,true);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',admin_b,'role','authenticated')::text,true);
  result:=public.rpc_manager_list_customers();
  IF jsonb_array_length(result)<>1 OR result->0->>'customerId'<>cb::text THEN RAISE EXCEPTION 'C70_SECOND_ADMIN'; END IF;

  -- Real administrative entrypoints: all callers must pass the scope guard.
  IF EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname LIKE 'rpc_manager_%'
      AND p.proname NOT IN ('rpc_manager_access_profile','rpc_manager_delete_device_permanently',
        'rpc_manager_list_users','rpc_manager_list_staff','rpc_manager_assign_user','rpc_manager_allow_additional_signal_device')
      AND p.prosrc NOT LIKE '%private.manager_check_scope%') THEN RAISE EXCEPTION 'C70_ENDPOINT_UNGUARDED'; END IF;
  IF EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='private' AND p.proname LIKE 'c70_rpc_manager_%'
      AND (has_function_privilege('authenticated',p.oid,'EXECUTE') OR has_function_privilege('anon',p.oid,'EXECUTE')))
    THEN RAISE EXCEPTION 'C70_CORE_EXPOSED'; END IF;
  IF EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname LIKE 'rpc_manager_%' AND has_function_privilege('anon',p.oid,'EXECUTE'))
    THEN RAISE EXCEPTION 'C70_ANON_ENDPOINT_EXPOSED'; END IF;
  IF has_table_privilege('anon','public.playback_sessions','TRUNCATE') OR has_table_privilege('authenticated','public.playback_sessions','TRUNCATE')
    THEN RAISE EXCEPTION 'C70_TABLE_TRUNCATE_EXPOSED'; END IF;

  PERFORM set_config('request.jwt.claim.sub',master::text,true);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',master,'role','authenticated')::text,true);
  IF public.rpc_manager_access_profile()->>'role'<>'MASTER' THEN RAISE EXCEPTION 'C70_MASTER_PROFILE'; END IF;
  IF NOT private.manager_can_device(da) OR NOT private.manager_can_device(db) THEN RAISE EXCEPTION 'C70_MASTER_SCOPE'; END IF;
  BEGIN PERFORM public.rpc_manager_delete_device_permanently(da,'WRONG'); RAISE EXCEPTION 'C70_DELETE_CONFIRMATION'; EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
  IF public.rpc_manager_delete_device_permanently(da,'XF-C70A-TEST')->>'success'<>'true' THEN RAISE EXCEPTION 'C70_DELETE_FAILED'; END IF;
  IF EXISTS(SELECT 1 FROM public.devices WHERE device_id=da) OR NOT EXISTS(SELECT 1 FROM public.devices WHERE device_id=db)
    OR NOT EXISTS(SELECT 1 FROM public.licenses WHERE id=la) THEN RAISE EXCEPTION 'C70_DELETE_SCOPE'; END IF;
  IF EXISTS(SELECT 1 FROM private.device_activation_key_vault WHERE device_id=da)
    OR EXISTS(SELECT 1 FROM public.playback_sessions WHERE device_id=da)
    OR NOT EXISTS(SELECT 1 FROM private.device_activation_key_vault WHERE device_id=db)
    OR NOT EXISTS(SELECT 1 FROM public.playback_sessions WHERE device_id=db AND status='ACTIVE')
    OR NOT EXISTS(SELECT 1 FROM public.commercial_audit_logs WHERE target_id=da AND action='DEVICE_PERMANENTLY_DELETED')
    THEN RAISE EXCEPTION 'C70_DELETE_KEY_SESSION_AUDIT'; END IF;
END;
$test$;
SELECT 'C70_SCOPED_ACCESS_ROLLBACK_TESTS_PASS' AS result;
