-- Historical C80/C81 acceptance, including the then-authorized registration limit edit.
-- C82 intentionally supersedes that edit and the conversion of a childless PRIMARY.
-- Current regression acceptance: c11_principal_screen_policy.sql (BEGIN / ROLLBACK).
-- Execute this snapshot only with the C80/C81 migration state, never the current policy.
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
 IF has_function_privilege('anon','public.rpc_manager_activate_device_configured(jsonb,text,integer,integer,text,text)','EXECUTE')
 OR has_table_privilege('authenticated','private.manager_device_relationships','SELECT') THEN RAISE EXCEPTION 'C80_EXPOSED_PRIVILEGES'; END IF;
 PERFORM set_config('request.jwt.claim.sub',consumer::text,true);
 BEGIN PERFORM public.rpc_manager_activate_device_configured(args,'Quarto',3,2,'SECONDARY','XF-C80P-TEST'); RAISE EXCEPTION 'C80_USER_ALLOWED'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 PERFORM set_config('request.jwt.claim.sub',admin_b::text,true);
 BEGIN PERFORM public.rpc_manager_activate_device_configured(args,'Quarto',3,2,'SECONDARY','XF-C80P-TEST'); RAISE EXCEPTION 'C80_CROSS_ADMIN_ALLOWED'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 PERFORM set_config('request.jwt.claim.sub',admin_a::text,true);
 -- Bad input/key/cross-customer failures must not change limits or create relationships.
 FOR wrong_case,expected IN SELECT * FROM (VALUES
   (args||jsonb_build_object('p_activation_key_hash',repeat('f',64)),'INVALID_ACTIVATION_KEY'),
   (args||jsonb_build_object('p_existing_display_code','XF-C80F-TEST'),'PRIMARY_DEVICE_INVALID')) AS cases(a,e) LOOP
   BEGIN PERFORM public.rpc_manager_activate_device_configured(wrong_case,'Quarto',3,2,'SECONDARY',wrong_case->>'p_existing_display_code'); RAISE EXCEPTION 'C80_BAD_INPUT_ALLOWED';
   EXCEPTION WHEN OTHERS THEN IF SQLERRM='C80_BAD_INPUT_ALLOWED' OR (expected='PRIMARY_DEVICE_INVALID' AND SQLERRM NOT IN ('PRIMARY_DEVICE_INVALID','MANAGER_SCOPE_DENIED')) OR (expected='INVALID_ACTIVATION_KEY' AND SQLERRM NOT IN ('INVALID_ACTIVATION_KEY','ACTIVATION_KEY_INVALID')) THEN RAISE; END IF; END;
 END LOOP;
 IF (SELECT max_devices FROM public.licenses WHERE id=license)<>1 OR EXISTS(SELECT 1 FROM private.manager_device_relationships WHERE license_id=license) THEN RAISE EXCEPTION 'C80_FAILURE_PARTIAL_WRITE'; END IF;
 BEGIN PERFORM public.rpc_manager_activate_device_configured(args,'',3,2,'SECONDARY','XF-C80P-TEST'); RAISE EXCEPTION 'C80_EMPTY_LABEL'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'INVALID_DEVICE_LABEL' THEN RAISE; END IF; END;
 BEGIN PERFORM public.rpc_manager_activate_device_configured(args,'Quarto',101,2,'SECONDARY','XF-C80P-TEST'); RAISE EXCEPTION 'C80_BAD_CAPACITY'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'INVALID_MAX_DEVICES' THEN RAISE; END IF; END;
 BEGIN PERFORM public.rpc_manager_activate_device_configured(args,'Quarto',3,51,'SECONDARY','XF-C80P-TEST'); RAISE EXCEPTION 'C80_BAD_SESSIONS'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'INVALID_MAX_CONCURRENT_SESSIONS' THEN RAISE; END IF; END;
 BEGIN PERFORM public.rpc_manager_activate_device_configured(args,'Quarto',3,4,'SECONDARY','XF-C80P-TEST'); RAISE EXCEPTION 'C81_SESSIONS_CAPACITY'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'CONCURRENT_LIMIT_EXCEEDS_DEVICES' THEN RAISE; END IF; END;
 BEGIN PERFORM public.rpc_manager_update_license_limits(license,3,4,'fixture'); RAISE EXCEPTION 'C81_LIMITS_CAPACITY'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'CONCURRENT_LIMIT_EXCEEDS_DEVICES' THEN RAISE; END IF; END;
 BEGIN PERFORM public.rpc_manager_activate_device_configured(args,'Quarto',3,2,'SECONDARY',NULL); RAISE EXCEPTION 'C80_MISSING_PRIMARY'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'PRIMARY_DEVICE_REQUIRED' THEN RAISE; END IF; END;
 result:=public.rpc_manager_activate_device_configured(args,'Quarto',3,2,'SECONDARY','XF-C80P-TEST');
 IF result->>'success'<>'true' OR result->>'sourceId'<>source_code OR (SELECT max_devices FROM public.licenses WHERE id=license)<>3
 OR (SELECT max_concurrent_sessions FROM public.licenses WHERE id=license)<>2 OR (SELECT device_label FROM public.devices WHERE device_id=secondary)<>'Quarto'
 OR (SELECT device_token_hash FROM public.devices WHERE device_id=secondary)<>repeat('d',64)
 OR NOT EXISTS(SELECT 1 FROM private.device_activation_key_vault WHERE device_id=secondary AND activation_key_hash=key_hash AND key_status='ACTIVE')
 OR NOT EXISTS(SELECT 1 FROM private.manager_device_relationships WHERE license_id=license AND device_id=secondary AND primary_device_id=main_device AND device_role='SECONDARY')
 OR NOT EXISTS(SELECT 1 FROM private.manager_device_relationships WHERE license_id=license AND device_id=main_device AND device_role='PRIMARY')
 THEN RAISE EXCEPTION 'C80_SECONDARY_STATE'; END IF;
 detail:=public.rpc_manager_get_license_detail(license);
 IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(detail->'devices') d WHERE d->>'displayCode'='XF-C80S-TEST' AND d->>'primaryDisplayCode'='XF-C80P-TEST' AND d->>'deviceRole'='SECONDARY' AND d->>'licenseBindingStatus'='ACTIVE') THEN RAISE EXCEPTION 'C80_DETAIL_METADATA'; END IF;
 args:=args||jsonb_build_object('p_display_code','XF-C80T-TEST','p_existing_display_code','XF-C80S-TEST');
 BEGIN PERFORM public.rpc_manager_activate_device_configured(args,'Sala',4,2,'SECONDARY','XF-C80S-TEST'); RAISE EXCEPTION 'C80_CHAIN_ALLOWED'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'PRIMARY_DEVICE_INVALID' THEN RAISE; END IF; END;
 args:=args||jsonb_build_object('p_existing_display_code','XF-C80T-TEST');
 BEGIN PERFORM public.rpc_manager_activate_device_configured(args,'Sala',4,2,'SECONDARY','XF-C80T-TEST'); RAISE EXCEPTION 'C80_SELF_ALLOWED'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'PRIMARY_DEVICE_INVALID' THEN RAISE; END IF; END;
 args:=args||jsonb_build_object('p_existing_display_code','XF-C80P-TEST');
 -- Capacity failure after limits update must roll that update back too.
 BEGIN PERFORM public.rpc_manager_activate_device_configured(args,'Sala',2,1,'SECONDARY','XF-C80P-TEST'); RAISE EXCEPTION 'C80_FULL_ALLOWED'; EXCEPTION WHEN OTHERS THEN IF SQLERRM NOT IN ('LICENSE_DEVICE_LIMIT_REACHED','MANAGED_LICENSE_CAPACITY_EXHAUSTED') THEN RAISE; END IF; END;
 IF (SELECT max_devices FROM public.licenses WHERE id=license)<>3 OR (SELECT max_concurrent_sessions FROM public.licenses WHERE id=license)<>2 OR EXISTS(SELECT 1 FROM public.devices WHERE device_id=third) THEN RAISE EXCEPTION 'C80_CAPACITY_ROLLBACK'; END IF;
 SELECT count(*) INTO before_count FROM public.customer_accounts;
 BEGIN PERFORM public.rpc_manager_activate_device_configured(new_args||jsonb_build_object('p_activation_key_hash',repeat('f',64)),'Sala',3,2,'PRIMARY'); RAISE EXCEPTION 'C80_NEW_BAD_KEY'; EXCEPTION WHEN OTHERS THEN IF SQLERRM NOT IN ('INVALID_ACTIVATION_KEY','ACTIVATION_KEY_INVALID') THEN RAISE; END IF; END;
 IF (SELECT count(*) FROM public.customer_accounts)<>before_count THEN RAISE EXCEPTION 'C80_NEW_ROLLBACK'; END IF;
 result:=public.rpc_manager_activate_device_configured(new_args,'Sala',3,2,'PRIMARY');
 IF result->>'success'<>'true' OR (SELECT max_devices FROM public.licenses WHERE id=(result->>'licenseId')::uuid)<>3
 OR (SELECT device_label FROM public.devices WHERE device_id=new_customer_device)<>'Sala'
 OR (SELECT device_token_hash FROM public.devices WHERE device_id=new_customer_device)<>repeat('d',64)
 OR NOT EXISTS(SELECT 1 FROM private.manager_device_relationships WHERE device_id=new_customer_device AND device_role='PRIMARY')
 OR NOT private.manager_can_license((result->>'licenseId')::uuid) THEN RAISE EXCEPTION 'C80_NEW_PRIMARY_STATE'; END IF;
 -- Registered transfers: both ends scoped, no key needed, identity and origin retained.
 origin_license:=(result->>'licenseId')::uuid;
 IF has_function_privilege('anon','public.rpc_manager_link_license_device(uuid,text,text,text,integer,integer,text,boolean,text)','EXECUTE') THEN RAISE EXCEPTION 'C80_LINK_ANON'; END IF;
 PERFORM set_config('request.jwt.claim.sub',consumer::text,true);
 BEGIN PERFORM public.rpc_manager_link_license_device(license,'XF-C80N-TEST','XF-C80P-TEST','Tablet',4,2,'SECONDARY',true); RAISE EXCEPTION 'C80_LINK_USER'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 PERFORM set_config('request.jwt.claim.sub',admin_a::text,true);
 BEGIN PERFORM public.rpc_manager_link_license_device(license,'XF-C80F-TEST','XF-C80P-TEST','TV',3,2,'SECONDARY',true); RAISE EXCEPTION 'C80_LINK_FOREIGN_ORIGIN'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN PERFORM public.rpc_manager_link_license_device(foreign_license,'XF-C80N-TEST','XF-C80F-TEST','TV',4,2,'SECONDARY',true); RAISE EXCEPTION 'C80_LINK_FOREIGN_TARGET'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN PERFORM public.rpc_manager_link_license_device(origin_license,'XF-C80P-TEST','XF-C80N-TEST','TV',3,2,'SECONDARY',true); RAISE EXCEPTION 'C80_LINK_ROOT_WITH_CHILD'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'PRIMARY_HAS_SECONDARIES' THEN RAISE; END IF; END;
 BEGIN PERFORM public.rpc_manager_link_license_device(license,'XF-C80N-TEST','XF-C80S-TEST','TV',3,2,'SECONDARY',true); RAISE EXCEPTION 'C80_LINK_CHAIN'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'PRIMARY_DEVICE_INVALID' THEN RAISE; END IF; END;
 BEGIN PERFORM public.rpc_manager_link_license_device(license,'XF-C80N-TEST','XF-C80P-TEST','TV',4,2,'SECONDARY',true); RAISE EXCEPTION 'C81_IMPLICIT_CAPACITY'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'VERSION_CONFLICT' THEN RAISE; END IF; END;
 BEGIN PERFORM public.rpc_manager_link_license_device(license,'XF-C80N-TEST','XF-C80P-TEST','TV',3,4,'SECONDARY',true); RAISE EXCEPTION 'C81_LINK_SIMULTANEOUS_CAP'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'CONCURRENT_LIMIT_EXCEEDS_DEVICES' THEN RAISE; END IF; END;
 PERFORM public.rpc_manager_update_license_limits(license,2,2,'fixture full capacity');
 BEGIN PERFORM public.rpc_manager_link_license_device(license,'XF-C80N-TEST','XF-C80P-TEST','TV',2,2,'SECONDARY',true); RAISE EXCEPTION 'C80_LINK_CAPACITY'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'LICENSE_DEVICE_LIMIT_REACHED' THEN RAISE; END IF; END;
 PERFORM public.rpc_manager_update_license_limits(license,3,2,'fixture restore capacity');
 IF NOT EXISTS(SELECT 1 FROM public.license_devices WHERE license_id=origin_license AND device_id=new_customer_device) OR (SELECT max_devices FROM public.licenses WHERE id=license)<>3 THEN RAISE EXCEPTION 'C80_LINK_FAILURE_ROLLBACK'; END IF;
 PERFORM public.rpc_manager_link_license_device(license,'XF-C80N-TEST','XF-C80P-TEST','Tablet',3,2,'SECONDARY',true);
 IF EXISTS(SELECT 1 FROM public.license_devices WHERE license_id=origin_license AND device_id=new_customer_device)
 OR NOT EXISTS(SELECT 1 FROM public.licenses WHERE id=origin_license)
 OR NOT EXISTS(SELECT 1 FROM public.managed_sources WHERE source_id=new_source)
 OR (SELECT device_token_hash FROM public.devices WHERE device_id=new_customer_device)<>repeat('d',64)
 OR NOT EXISTS(SELECT 1 FROM private.device_activation_key_vault WHERE device_id=new_customer_device AND activation_key_hash=key_hash AND key_status='ACTIVE')
 OR NOT EXISTS(SELECT 1 FROM public.device_source_bindings WHERE license_id=license AND device_id=new_customer_device AND source_id=source)
 OR NOT EXISTS(SELECT 1 FROM private.manager_device_relationships WHERE license_id=license AND device_id=new_customer_device AND device_role='SECONDARY' AND primary_device_id=main_device)
 THEN RAISE EXCEPTION 'C80_REGISTERED_TRANSFER_STATE'; END IF;
 BEGIN PERFORM public.rpc_manager_link_license_device(license,'XF-C80T-TEST','XF-C80P-TEST','Celular',5,2,'SECONDARY',false,repeat('f',64)); RAISE EXCEPTION 'C80_LINK_BAD_KEY'; EXCEPTION WHEN OTHERS THEN IF SQLERRM NOT IN ('INVALID_ACTIVATION_KEY','ACTIVATION_KEY_INVALID') THEN RAISE; END IF; END;
 PERFORM public.rpc_manager_link_license_device(license,'XF-C80T-TEST','XF-C80P-TEST','Celular',5,2,'SECONDARY',false,key_hash);
 IF (SELECT device_token_hash FROM public.devices WHERE device_id=third)<>repeat('d',64) THEN RAISE EXCEPTION 'C80_LINK_NEW_TOKEN'; END IF;
 -- SELF_SERVICE explicitly approved secondary uses the destination source and clears managed binding.
 INSERT INTO public.customer_profiles(id,nickname,status) VALUES(consumer,'C80 self','ACTIVE');
 INSERT INTO private.manager_customer_ownership(customer_id,manager_id) VALUES(consumer,admin_a);
 INSERT INTO public.licenses(id,license_key_hash,mode,status,max_devices,customer_id) VALUES(self_license,encode(extensions.digest(self_license::text,'sha256'),'hex'),'SELF_SERVICE','ACTIVE',1,consumer);
 INSERT INTO public.devices(device_id,display_code,device_type,device_label,status,device_token_hash) VALUES(self_device,'XF-C80U-TEST','TV','Self','AUTHORIZED',repeat('a',64));
 INSERT INTO public.license_devices(license_id,device_id,status) VALUES(self_license,self_device,'ACTIVE');
 INSERT INTO public.customer_sources(source_id,customer_id,license_id,source_type,display_name,status,version) VALUES(self_source,consumer,self_license,'M3U','Self','ACTIVE',1);
 UPDATE public.licenses SET manager_approved_additional_devices=1 WHERE id=self_license;
 PERFORM public.rpc_manager_update_license_limits(self_license,2,2,'Explicit fixture capacity approval before link');
 PERFORM public.rpc_manager_link_license_device(self_license,'XF-C80N-TEST','XF-C80U-TEST','Tablet',2,2,'SECONDARY',true);
 IF EXISTS(SELECT 1 FROM public.device_source_bindings WHERE device_id=new_customer_device)
 OR NOT EXISTS(SELECT 1 FROM private.additional_signal_device_approvals WHERE license_id=self_license AND device_id=new_customer_device AND source_id=self_source)
 OR (SELECT device_token_hash FROM public.devices WHERE device_id=new_customer_device)<>repeat('d',64) THEN RAISE EXCEPTION 'C80_SELF_LINK_POLICY'; END IF;
 PERFORM set_config('request.jwt.claim.sub',master::text,true);
 PERFORM public.rpc_manager_link_license_device(license,'XF-C80F-TEST','XF-C80P-TEST','Quarto',5,2,'SECONDARY',true);
 IF EXISTS(SELECT 1 FROM public.license_devices WHERE license_id=foreign_license AND device_id=foreign_device)
 OR NOT EXISTS(SELECT 1 FROM public.customer_accounts WHERE id=foreign_account)
 OR (SELECT device_token_hash FROM public.devices WHERE device_id=foreign_device)<>repeat('b',64) THEN RAISE EXCEPTION 'C80_MASTER_TRANSFER'; END IF;
 IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(public.rpc_manager_list_licenses()) l WHERE l->>'licenseId'=license::text) THEN RAISE EXCEPTION 'C80_MASTER_LIST'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(public.rpc_manager_list_licenses()) l WHERE l::text ~ 'activationKey|deviceTokenHash|ciphertext|playlistUrl') THEN RAISE EXCEPTION 'C80_SECRET_LIST'; END IF;
END; $test$;
SELECT 'C80_SQL_REGISTRATION_SCOPE_ROLES_TOKEN_AND_ROLLBACK_PASS' AS result;
