-- Run with migration inside BEGIN/ROLLBACK. Never persist these fixtures.
DO $test$
DECLARE master UUID:=gen_random_uuid(); admin_a UUID:=gen_random_uuid(); admin_b UUID:=gen_random_uuid(); consumer UUID:=gen_random_uuid();
 account UUID:=gen_random_uuid(); account_b UUID:=gen_random_uuid(); license UUID:=gen_random_uuid(); license2 UUID:=gen_random_uuid(); external UUID:=gen_random_uuid();
 device TEXT:='c78-'||gen_random_uuid(); device2 TEXT:='c78-'||gen_random_uuid(); external_device TEXT:='c78-'||gen_random_uuid();
 installed TEXT:='c78-'||gen_random_uuid(); installation UUID:=gen_random_uuid(); activation UUID:=gen_random_uuid();
 source UUID; other_source UUID; result JSONB; preview JSONB; expected JSONB; source_code TEXT:='src_'||substr(replace(gen_random_uuid()::text,'-',''),1,16);
 new_source TEXT:='src_'||substr(replace(gen_random_uuid()::text,'-',''),1,16); key_hash TEXT:=encode(extensions.digest('012345','sha256'),'hex');
 self_user UUID:=gen_random_uuid(); self_license UUID:=gen_random_uuid(); self_device TEXT:='c78-'||gen_random_uuid(); self_new TEXT:='c78-'||gen_random_uuid();
 self_install UUID:=gen_random_uuid(); self_source TEXT:='csrc_'||substr(replace(gen_random_uuid()::text,'-',''),1,16); self_replacement TEXT:='csrc_'||substr(replace(gen_random_uuid()::text,'-',''),1,16);
BEGIN
 INSERT INTO auth.users(id) VALUES(master),(admin_a),(admin_b),(consumer);
 INSERT INTO public.manager_admins(user_id,role,status) VALUES(master,'OWNER','ACTIVE'),(admin_a,'ADMIN','ACTIVE'),(admin_b,'ADMIN','ACTIVE');
 INSERT INTO public.customer_profiles(id,nickname,status) VALUES(consumer,'C78 consumer','ACTIVE');
 INSERT INTO public.customer_accounts(id,display_name,status) VALUES(account,'C78 synthetic','ACTIVE'),(account_b,'C78 external','ACTIVE');
 INSERT INTO public.customer_account_users(customer_account_id,user_id,role,status) VALUES(account,consumer,'OWNER','ACTIVE');
 INSERT INTO private.manager_customer_ownership(customer_id,manager_id) VALUES(account,admin_a),(account_b,admin_b);
 INSERT INTO public.licenses(id,license_key_hash,mode,status,max_devices,customer_account_id)
 VALUES(license,repeat('a',64),'MANAGED','ACTIVE',2,account),(license2,repeat('b',64),'MANAGED','ACTIVE',1,account),(external,repeat('c',64),'MANAGED','ACTIVE',1,account_b);
 INSERT INTO public.devices(device_id,display_code,device_type,device_label,status,device_token_hash)
 VALUES(device,'XF-C78A-TEST','TV','C78 TV','AUTHORIZED',repeat('a',64)),(device2,'XF-C78B-TEST','PHONE','C78 phone','AUTHORIZED',repeat('b',64)),(external_device,'XF-C78E-TEST','TV','External','AUTHORIZED',repeat('c',64));
 INSERT INTO public.license_devices(license_id,device_id,status) VALUES(license,device,'ACTIVE'),(license2,device2,'ACTIVE'),(external,external_device,'ACTIVE');
 INSERT INTO public.managed_sources(source_id,name,source_type,version,status) VALUES(source_code,'C78 shared','M3U',1,'ACTIVE') RETURNING id INTO source;
 INSERT INTO private.managed_source_secret_vault(source_id,source_version,protocol,ciphertext,nonce,auth_tag,key_version)
 VALUES(source_code,1,'M3U','aa',repeat('a',24),repeat('b',32),'v1');
 INSERT INTO public.device_source_bindings(license_id,device_id,source_id) VALUES(license,device,source),(external,external_device,source),(license2,device2,source);
 INSERT INTO public.app_installations(installation_id,device_id,display_code,package_name,platform,device_type,app_version,last_seen_at)
 VALUES(gen_random_uuid(),device,'XF-C78A-TEST','com.xandeflix.prebuilt','ANDROID','TV','1.0',now());
 IF has_function_privilege('anon','public.rpc_manager_license_device(uuid,text,text,text)','EXECUTE') OR
 has_function_privilege('anon','public.rpc_manager_delete_license_customer(uuid,text,text)','EXECUTE') THEN RAISE EXCEPTION 'C78_ANON_GRANT'; END IF;
 PERFORM set_config('request.jwt.claim.sub',consumer::text,true);
 BEGIN PERFORM public.rpc_manager_list_licenses(); RAISE EXCEPTION 'C78_USER_LIST_ALLOWED'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 PERFORM set_config('request.jwt.claim.sub',admin_b::text,true);
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(public.rpc_manager_list_licenses()) x WHERE x->>'licenseId'=license::text) THEN RAISE EXCEPTION 'C78_LIST_ISOLATION'; END IF;
 BEGIN PERFORM public.rpc_manager_license_device(license,'XF-C78A-TEST','Stolen'); RAISE EXCEPTION 'C78_ADMIN_CROSS_WRITE'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 PERFORM set_config('request.jwt.claim.sub',admin_a::text,true);
 result:=public.rpc_manager_get_license_detail(license);
 IF result->'devices'->0->>'platform'<>'ANDROID' OR result->'devices'->0->>'lastSeenAt' IS NULL THEN RAISE EXCEPTION 'C78_DEVICE_METADATA'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(public.rpc_manager_list_licenses()) x WHERE x::text ~ 'ciphertext|playlistUrl|activationKey') THEN RAISE EXCEPTION 'C78_LIST_SECRET'; END IF;
 PERFORM public.rpc_manager_license_device(license,'XF-C78A-TEST','Updated');
 IF (SELECT device_label FROM public.devices WHERE device_id=device)<>'Updated' THEN RAISE EXCEPTION 'C78_LABEL_NOT_UPDATED'; END IF;
 BEGIN PERFORM public.rpc_manager_customer_delete_preview(license); RAISE EXCEPTION 'C78_ADMIN_DELETE'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 expected:=jsonb_build_array(jsonb_build_object('sourceId',source_code,'version',1));
 BEGIN PERFORM public.rpc_manager_replace_license_source(license,'[]',new_source,'New','M3U','aa',repeat('a',24),repeat('b',32),'v1'); RAISE EXCEPTION 'C78_STALE_SOURCE';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'VERSION_CONFLICT' THEN RAISE; END IF; END;
 PERFORM public.rpc_manager_replace_license_source(license,expected,new_source,'New','M3U','aa',repeat('a',24),repeat('b',32),'v1');
 IF (SELECT source_id FROM public.device_source_bindings WHERE device_id=external_device)<>source OR NOT EXISTS(SELECT 1 FROM private.managed_source_secret_vault WHERE source_id=source_code)
 THEN RAISE EXCEPTION 'C78_EXTERNAL_SOURCE_CHANGED'; END IF;
 -- Installed pending device, permanent key verified through canonical validator.
 INSERT INTO public.app_installations(installation_id,device_id,display_code,package_name,app_version,device_type)
 VALUES(installation,installed,'XF-C78N-TEST','com.xandeflix.prebuilt','1.0','TV');
 INSERT INTO public.device_activation_requests(activation_id,installation_id,device_id,display_code,device_token_hash,activation_key_hash,activation_status_secret_hash,status,device_type)
 VALUES(activation,installation,installed,'XF-C78N-TEST',repeat('d',64),key_hash,repeat('e',64),'PENDING','TV');
 INSERT INTO private.device_activation_key_vault(device_id,display_code,activation_key_hash,ciphertext,nonce,auth_tag,key_version,key_status)
 VALUES(installed,'XF-C78N-TEST',key_hash,'aa',repeat('a',24),repeat('b',32),'v1','ACTIVE');
 BEGIN PERFORM public.rpc_manager_license_device(license,'XF-C78N-TEST','New',repeat('f',64)); RAISE EXCEPTION 'C78_BAD_KEY_ACCEPTED';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM='C78_BAD_KEY_ACCEPTED' THEN RAISE; END IF; END;
 PERFORM public.rpc_manager_license_device(license,'XF-C78N-TEST','New',key_hash);
 IF NOT EXISTS(SELECT 1 FROM public.license_devices WHERE license_id=license AND device_id=installed AND status='ACTIVE')
 OR (SELECT device_token_hash FROM public.devices WHERE device_id=installed)<>repeat('d',64) THEN RAISE EXCEPTION 'C78_LINK_OR_TOKEN'; END IF;
 -- SELF_SERVICE replacement + explicit extra device approval preserve USER policy.
 INSERT INTO auth.users(id) VALUES(self_user);
 INSERT INTO public.customer_profiles(id,nickname,status) VALUES(self_user,'C78 self','ACTIVE');
 INSERT INTO private.manager_customer_ownership(customer_id,manager_id) VALUES(self_user,admin_a);
 INSERT INTO public.licenses(id,license_key_hash,mode,status,max_devices,customer_id) VALUES(self_license,repeat('f',64),'SELF_SERVICE','ACTIVE',1,self_user);
 INSERT INTO public.devices(device_id,display_code,device_type,device_label,status,device_token_hash) VALUES(self_device,'XF-C78S-OLD1','TV','Self','AUTHORIZED',repeat('a',64));
 INSERT INTO public.license_devices(license_id,device_id,status) VALUES(self_license,self_device,'ACTIVE');
 INSERT INTO public.customer_sources(source_id,customer_id,license_id,source_type,display_name,status,version) VALUES(self_source,self_user,self_license,'M3U','Self','ACTIVE',1);
 INSERT INTO private.customer_source_secret_vault(source_id,source_version,protocol,ciphertext,nonce,auth_tag,key_version) VALUES(self_source,1,'M3U','aa',repeat('a',24),repeat('b',32),'v1');
 PERFORM public.rpc_manager_replace_license_source(self_license,jsonb_build_array(jsonb_build_object('sourceId',self_source,'version',1)),self_replacement,'Self new','XTREAM','aa',repeat('a',24),repeat('b',32),'v1');
 IF EXISTS(SELECT 1 FROM private.customer_source_secret_vault WHERE source_id=self_source) OR NOT EXISTS(SELECT 1 FROM private.customer_source_secret_vault WHERE source_id=self_replacement) THEN RAISE EXCEPTION 'C78_SELF_VAULT'; END IF;
 INSERT INTO public.app_installations(installation_id,device_id,display_code,package_name,app_version,device_type) VALUES(self_install,self_new,'XF-C78S-NEW1','com.xandeflix.prebuilt','1.0','TV');
 INSERT INTO public.device_activation_requests(activation_id,installation_id,device_id,display_code,device_token_hash,activation_key_hash,activation_status_secret_hash,status,device_type)
 VALUES(gen_random_uuid(),self_install,self_new,'XF-C78S-NEW1',repeat('d',64),key_hash,repeat('e',64),'PENDING','TV');
 INSERT INTO private.device_activation_key_vault(device_id,display_code,activation_key_hash,ciphertext,nonce,auth_tag,key_version,key_status) VALUES(self_new,'XF-C78S-NEW1',key_hash,'aa',repeat('a',24),repeat('b',32),'v1','ACTIVE');
 PERFORM public.rpc_manager_license_device(self_license,'XF-C78S-NEW1','Self new device',key_hash);
 IF NOT EXISTS(SELECT 1 FROM private.additional_signal_device_approvals WHERE license_id=self_license AND device_id=self_new AND source_id=self_replacement)
 OR (SELECT max_devices FROM public.licenses WHERE id=self_license)<>2 THEN RAISE EXCEPTION 'C78_SELF_APPROVAL'; END IF;
 PERFORM set_config('request.jwt.claim.sub',master::text,true);
 preview:=public.rpc_manager_customer_delete_preview(license);
 IF jsonb_array_length(preview->'licenses')<>2 OR jsonb_array_length(preview->'devices')<>3 THEN RAISE EXCEPTION 'C78_SCOPE_INCOMPLETE'; END IF;
 BEGIN PERFORM public.rpc_manager_delete_license_customer(license,preview->>'snapshot','wrong'); RAISE EXCEPTION 'C78_BAD_CONFIRMATION';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'CUSTOMER_DELETE_CONFIRMATION_REQUIRED' THEN RAISE; END IF; END;
 BEGIN PERFORM public.rpc_manager_delete_license_customer(license,'stale','EXCLUIR C78 synthetic'); RAISE EXCEPTION 'C78_BAD_SNAPSHOT';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'CUSTOMER_DELETE_CONFIRMATION_REQUIRED' THEN RAISE; END IF; END;
 INSERT INTO public.license_devices(license_id,device_id,status) VALUES(external,device,'REVOKED');
 BEGIN PERFORM public.rpc_manager_customer_delete_preview(license); RAISE EXCEPTION 'C78_SHARED_DEVICE_DELETE';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'CROSS_CUSTOMER_BINDING_DENIED' THEN RAISE; END IF; END;
 DELETE FROM public.license_devices WHERE license_id=external AND device_id=device;
 INSERT INTO public.customer_account_users(customer_account_id,user_id,role,status) VALUES(account_b,consumer,'OWNER','ACTIVE');
 BEGIN PERFORM public.rpc_manager_customer_delete_preview(license); RAISE EXCEPTION 'C78_SHARED_IDENTITY_DELETE';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'CUSTOMER_SHARED_IDENTITY' THEN RAISE; END IF; END;
 DELETE FROM public.customer_account_users WHERE customer_account_id=account_b AND user_id=consumer;
 PERFORM public.rpc_manager_delete_license_customer(license,preview->>'snapshot','EXCLUIR C78 synthetic');
 IF EXISTS(SELECT 1 FROM public.customer_accounts WHERE id=account) OR EXISTS(SELECT 1 FROM public.licenses WHERE id IN(license,license2))
 OR EXISTS(SELECT 1 FROM public.devices WHERE device_id IN(device,device2,installed)) OR EXISTS(SELECT 1 FROM private.device_activation_key_vault WHERE device_id=installed)
 OR EXISTS(SELECT 1 FROM auth.users WHERE id=consumer) OR EXISTS(SELECT 1 FROM private.managed_source_secret_vault WHERE source_id=new_source)
 THEN RAISE EXCEPTION 'C78_DELETE_INCOMPLETE'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.devices WHERE device_id=external_device) OR NOT EXISTS(SELECT 1 FROM public.customer_accounts WHERE id=account_b)
 OR NOT EXISTS(SELECT 1 FROM private.managed_source_secret_vault WHERE source_id=source_code) OR NOT EXISTS(SELECT 1 FROM public.commercial_audit_logs WHERE target_id=account::text AND action='CUSTOMER_PERMANENTLY_DELETED')
 THEN RAISE EXCEPTION 'C78_EXTERNAL_OR_AUDIT_DELETED'; END IF;
END; $test$;
SELECT 'C78_LICENSE_CONSOLE_SQL_PASS' AS result;
