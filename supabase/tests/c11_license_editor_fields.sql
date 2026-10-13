-- C83: execute in BEGIN/ROLLBACK or nested rollback block. Only random fixtures.
DO $test$
DECLARE owner uuid:=gen_random_uuid(); admin uuid:=gen_random_uuid(); outsider uuid:=gen_random_uuid(); user_id uuid:=gen_random_uuid();
 account uuid:=gen_random_uuid(); homonym uuid:=gen_random_uuid(); license uuid:=gen_random_uuid(); foreign_license uuid:=gen_random_uuid();
 main text:='c83-'||gen_random_uuid(); leaf text:='c83-'||gen_random_uuid(); root text:='c83-'||gen_random_uuid();
 source uuid; other_source uuid; src text:='src_'||replace(gen_random_uuid()::text,'-',''); src2 text:='src_'||replace(gen_random_uuid()::text,'-','');
 original jsonb; detail jsonb; data jsonb; result jsonb;
BEGIN
 INSERT INTO auth.users(id) VALUES(owner),(admin),(outsider),(user_id);
 INSERT INTO public.manager_admins(user_id,role,status) VALUES(owner,'OWNER','ACTIVE'),(admin,'ADMIN','ACTIVE'),(outsider,'ADMIN','ACTIVE');
 INSERT INTO public.customer_accounts(id,display_name,status) VALUES(account,'C83 Original','ACTIVE'),(homonym,'C83 Original','ACTIVE');
 INSERT INTO private.manager_customer_ownership(customer_id,manager_id) VALUES(account,admin),(homonym,outsider);
 INSERT INTO public.licenses(id,license_key_hash,mode,status,max_devices,customer_account_id)
 VALUES(license,repeat('1',64),'MANAGED','ACTIVE',1,account),(foreign_license,repeat('2',64),'MANAGED','ACTIVE',1,homonym);
 INSERT INTO public.devices(device_id,display_code,device_type,device_label,status,device_token_hash,last_seen_at)
 VALUES(main,'XF-C83P-TEST','TV','TV Sala','AUTHORIZED',repeat('a',64),'2026-10-10T10:00:00Z'),
 (leaf,'XF-C83S-TEST','PHONE','Quarto','AUTHORIZED',repeat('b',64),'2026-10-10T11:00:00Z'),
 (root,'XF-C83F-TEST','TV','Outra sala','AUTHORIZED',repeat('c',64),'2026-10-10T12:00:00Z');
 INSERT INTO public.license_devices(license_id,device_id,status) VALUES(license,main,'ACTIVE'),(foreign_license,root,'ACTIVE');
 INSERT INTO public.app_installations(installation_id,device_id,display_code,package_name,platform,device_type,app_version,last_seen_at)
 VALUES(gen_random_uuid(),leaf,'XF-C83S-TEST','com.xandeflix.prebuilt','ANDROID','PHONE','1.0','2026-10-10T11:00:00Z');
 INSERT INTO public.managed_sources(source_id,name,source_type,version,status) VALUES(src,'C83 Source','M3U',1,'ACTIVE') RETURNING id INTO source;
 INSERT INTO public.managed_sources(source_id,name,source_type,version,status) VALUES(src2,'C83 Destination','M3U',1,'ACTIVE') RETURNING id INTO other_source;
 INSERT INTO private.manager_source_ownership(source_id,manager_id) VALUES(src,admin),(src2,outsider);
 INSERT INTO public.device_source_bindings(license_id,device_id,source_id) VALUES(license,main,source),(foreign_license,root,other_source);
 SELECT jsonb_agg(jsonb_build_object('id',device_id,'code',display_code,'token',device_token_hash,'status',status,'created',created_at,'seen',last_seen_at) ORDER BY device_id)
 INTO original FROM public.devices WHERE device_id IN (main,leaf,root);
 PERFORM set_config('request.jwt.claim.role','authenticated',true); PERFORM set_config('request.jwt.claim.sub',admin::text,true);
 result:=public.rpc_manager_edit_license_customer(license,account,'C83 Renamed','C83 Original');
 IF result->>'success'<>'true' OR (SELECT display_name FROM public.customer_accounts WHERE id=account)<>'C83 Renamed'
 OR (SELECT display_name FROM public.customer_accounts WHERE id=homonym)<>'C83 Original' THEN RAISE EXCEPTION 'C83_RENAME_ID'; END IF;
 detail:=public.rpc_manager_get_license_detail(license);
 IF detail->'customer'->>'nickname'<>'C83 Renamed' OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(public.rpc_manager_list_licenses()) l WHERE l->>'licenseId'=license::text AND l->>'customerNickname'='C83 Renamed')
 THEN RAISE EXCEPTION 'C83_RENAME_VIEWS'; END IF;
 BEGIN PERFORM public.rpc_manager_edit_license_customer(license,account,'C83 Bad','C83 Original'); RAISE EXCEPTION 'C83_STALE_NAME';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'CUSTOMER_NAME_CONFLICT' THEN RAISE; END IF; END;
 BEGIN PERFORM public.rpc_manager_edit_license_customer(foreign_license,homonym,'C83 Bad','C83 Original'); RAISE EXCEPTION 'C83_FOREIGN_RENAME';
 EXCEPTION WHEN insufficient_privilege THEN IF SQLERRM<>'MANAGER_SCOPE_DENIED' THEN RAISE; END IF; END;
 BEGIN PERFORM public.rpc_manager_edit_license_customer(license,homonym,'C83 Bad','C83 Original'); RAISE EXCEPTION 'C83_SUBJECT_ID';
 EXCEPTION WHEN insufficient_privilege THEN IF SQLERRM<>'MANAGER_SCOPE_DENIED' THEN RAISE; END IF; END;
 PERFORM public.rpc_manager_promote_license_device(license,'XF-C83P-TEST');
 PERFORM public.rpc_manager_edit_license_screens(license,'XF-C83P-TEST',4,3,'C83 fixture capacity');
 INSERT INTO public.license_devices(license_id,device_id,status) VALUES(license,leaf,'ACTIVE');
 INSERT INTO public.device_source_bindings(license_id,device_id,source_id) VALUES(license,leaf,source);
 INSERT INTO private.manager_device_relationships(license_id,device_id,device_role,primary_device_id,manager_id) VALUES(license,leaf,'SECONDARY',main,admin);
 BEGIN PERFORM public.rpc_manager_edit_license_device(license,'XF-C83S-TEST','Quarto','ANDROID','TABLET','SECONDARY','SECONDARY',license,'XF-C83P-TEST',1,false);
 RAISE EXCEPTION 'C83_DUPLICATE_SLOT'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'DEVICE_SLOT_OCCUPIED' THEN RAISE; END IF; END;
 IF EXISTS(SELECT 1 FROM private.manager_device_presentation WHERE device_id=leaf) THEN RAISE EXCEPTION 'C83_PARTIAL_METADATA'; END IF;
 BEGIN PERFORM public.rpc_manager_edit_license_device(license,'XF-C83S-TEST','Quarto','ANDROID','TABLET','SECONDARY','SECONDARY',license,'XF-C83P-TEST',5,false);
 RAISE EXCEPTION 'C83_SLOT_RANGE'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'INVALID_DEVICE_SLOT' THEN RAISE; END IF; END;
 PERFORM public.rpc_manager_edit_license_device(license,'XF-C83S-TEST','TV Quarto','TIZEN','TV','SECONDARY','SECONDARY',license,'XF-C83P-TEST',3,false);
 detail:=public.rpc_manager_get_license_detail(license);
 SELECT value INTO data FROM jsonb_array_elements(detail->'devices') WHERE value->>'deviceId'=leaf;
 IF data->>'slotNumber'<>'3' OR data->>'deviceLabel'<>'TV Quarto' OR data->>'platform'<>'TIZEN' OR data->>'deviceType'<>'TV'
 OR data->'sourceLinks'->0->>'name'<>'C83 Source' OR data->'sourceLinks'->0->>'deviceCount'<>'2' THEN RAISE EXCEPTION 'C83_EDITOR_DTO'; END IF;
 IF (SELECT platform FROM public.app_installations WHERE device_id=leaf)<>'ANDROID' OR (SELECT device_type FROM public.devices WHERE device_id=leaf)<>'PHONE' THEN RAISE EXCEPTION 'C83_TELEMETRY_UNCHANGED'; END IF;
 BEGIN PERFORM public.rpc_manager_edit_license_screens(license,'XF-C83P-TEST',2,2,'C83 reduction'); RAISE EXCEPTION 'C83_HIGH_SLOT';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'DEVICE_SLOT_OUTSIDE_LIMIT' THEN RAISE; END IF; END;
 BEGIN PERFORM public.rpc_manager_edit_license_device(license,'XF-C83P-TEST','Sala','ANDROID','TV','PRIMARY','PRIMARY',NULL,NULL,2,false);
 RAISE EXCEPTION 'C83_ROOT_SLOT_EDIT'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'PRIMARY_SLOT_READ_ONLY' THEN RAISE; END IF; END;
 -- Explicit demotion confirmation required, and roots with children remain protected.
 BEGIN PERFORM public.rpc_manager_edit_license_device(license,'XF-C83P-TEST','Sala','ANDROID','TV','PRIMARY','SECONDARY',foreign_license,'XF-C83F-TEST',2,false);
 RAISE EXCEPTION 'C83_DEMOTION_CONFIRM'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'DEVICE_ROLE_CONFIRMATION_REQUIRED' THEN RAISE; END IF; END;
 PERFORM set_config('request.jwt.claim.sub',owner::text,true);
 PERFORM public.rpc_manager_promote_license_device(foreign_license,'XF-C83F-TEST');
 PERFORM public.rpc_manager_edit_license_screens(foreign_license,'XF-C83F-TEST',2,2,'C83 destination capacity');
 BEGIN PERFORM public.rpc_manager_edit_license_device(license,'XF-C83P-TEST','Sala','ANDROID','TV','PRIMARY','SECONDARY',foreign_license,'XF-C83F-TEST',2,true);
 RAISE EXCEPTION 'C83_ROOT_CHILDREN'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'PRIMARY_HAS_SECONDARIES' THEN RAISE; END IF; END;
 PERFORM public.rpc_manager_promote_license_device(license,'XF-C83S-TEST');
 BEGIN PERFORM public.rpc_manager_link_license_device(foreign_license,'XF-C83S-TEST','XF-C83F-TEST','Quarto',2,2,'SECONDARY',true);
 RAISE EXCEPTION 'C83_IMPLICIT_DEMOTION'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'PRIMARY_CANNOT_BECOME_SECONDARY' THEN RAISE; END IF; END;
 PERFORM set_config('request.jwt.claim.sub',admin::text,true);
 BEGIN PERFORM public.rpc_manager_edit_license_device(license,'XF-C83S-TEST','Quarto','ANDROID','TABLET','PRIMARY','SECONDARY',foreign_license,'XF-C83F-TEST',2,true);
 RAISE EXCEPTION 'C83_FOREIGN_TRANSFER'; EXCEPTION WHEN insufficient_privilege THEN IF SQLERRM<>'MANAGER_SCOPE_DENIED' THEN RAISE; END IF; END;
 -- Same-account demotion, slot choice and root preservation.
 PERFORM public.rpc_manager_edit_license_device(license,'XF-C83S-TEST','TV Quarto','TIZEN','TV','PRIMARY','SECONDARY',license,'XF-C83P-TEST',2,true);
 IF NOT EXISTS(SELECT 1 FROM private.manager_device_relationships WHERE license_id=license AND device_id=leaf AND device_role='SECONDARY' AND primary_device_id=main)
 THEN RAISE EXCEPTION 'C83_SAME_ACCOUNT_DEMOTION'; END IF;
 PERFORM public.rpc_manager_promote_license_device(license,'XF-C83S-TEST');
 PERFORM set_config('request.jwt.claim.sub',owner::text,true);
 PERFORM public.rpc_manager_edit_license_device(license,'XF-C83S-TEST','Tablet quarto','ANDROID','TABLET','PRIMARY','SECONDARY',foreign_license,'XF-C83F-TEST',2,true);
 IF EXISTS(SELECT 1 FROM public.license_devices WHERE license_id=license AND device_id=leaf)
 OR NOT EXISTS(SELECT 1 FROM public.device_source_bindings WHERE license_id=foreign_license AND device_id=leaf AND source_id=other_source)
 OR NOT EXISTS(SELECT 1 FROM private.license_device_slots WHERE license_id=foreign_license AND device_id=leaf AND slot_number=2)
 OR NOT EXISTS(SELECT 1 FROM private.manager_device_relationships WHERE license_id=foreign_license AND device_id=leaf AND device_role='SECONDARY' AND primary_device_id=root)
 THEN RAISE EXCEPTION 'C83_TRANSFER_ATOMIC'; END IF;
 SELECT jsonb_agg(jsonb_build_object('id',device_id,'code',display_code,'token',device_token_hash,'status',status,'created',created_at,'seen',last_seen_at) ORDER BY device_id)
 INTO data FROM public.devices WHERE device_id IN (main,leaf,root);
 IF original IS DISTINCT FROM data THEN RAISE EXCEPTION 'C83_AUTOMATIC_IDENTITY_PRESERVED'; END IF;
 IF EXISTS(SELECT 1 FROM private.license_role_operations) THEN RAISE EXCEPTION 'C83_OPERATION_NOT_CLEARED'; END IF;
 PERFORM set_config('request.jwt.claim.sub',user_id::text,true);
 BEGIN PERFORM public.rpc_manager_edit_license_customer(license,account,'C83 User','C83 Renamed'); RAISE EXCEPTION 'C83_USER_RENAME'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN PERFORM public.rpc_manager_edit_license_device(foreign_license,'XF-C83S-TEST','Quarto','ANDROID','TV','SECONDARY','PRIMARY'); RAISE EXCEPTION 'C83_USER_EDIT'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 IF has_function_privilege('anon','public.rpc_manager_edit_license_customer(uuid,uuid,text,text)','EXECUTE')
 OR has_function_privilege('anon','public.rpc_manager_edit_license_device(uuid,text,text,text,text,text,text,uuid,text,integer,boolean,jsonb)','EXECUTE')
 OR has_table_privilege('authenticated','private.license_device_slots','INSERT')
 OR has_table_privilege('authenticated','private.license_role_operations','INSERT') THEN RAISE EXCEPTION 'C83_PRIVATE_GRANTS'; END IF;
END; $test$;
SELECT 'C83_LICENSE_EDITOR_FIELDS_SQL_PASS' AS result;

DO $test$
DECLARE manager uuid:=gen_random_uuid(); account uuid:=gen_random_uuid(); other uuid:=gen_random_uuid();
 license uuid:=gen_random_uuid(); original text:='C83 '||substr(account::text,1,8); other_name text:='C83 '||substr(other::text,1,8); bad_name text;
BEGIN
 INSERT INTO auth.users(id) VALUES(manager),(account),(other);
 INSERT INTO public.manager_admins(user_id,role,status) VALUES(manager,'OWNER','ACTIVE');
 INSERT INTO public.customer_profiles(id,nickname,status) VALUES(account,original,'ACTIVE'),(other,other_name,'ACTIVE');
 INSERT INTO public.customer_accounts(id,display_name,status) VALUES(account,original,'ACTIVE');
 INSERT INTO public.licenses(id,license_key_hash,mode,status,max_devices,customer_account_id,customer_id)
 VALUES(license,encode(extensions.digest(license::text,'sha256'),'hex'),'MANAGED','ACTIVE',1,account,account);
 PERFORM set_config('request.jwt.claim.role','authenticated',true); PERFORM set_config('request.jwt.claim.sub',manager::text,true);
 FOREACH bad_name IN ARRAY ARRAY['ab',repeat('a',33),'admin','C83 <html>'] LOOP
   BEGIN PERFORM public.rpc_manager_edit_license_customer(license,account,bad_name,original);
   RAISE EXCEPTION 'C83_INVALID_PROFILE_ACCEPTED';
   EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'CUSTOMER_PROFILE_NAME_INVALID' THEN RAISE; END IF; END;
 END LOOP;
 BEGIN PERFORM public.rpc_manager_edit_license_customer(license,account,lower(other_name),original);
 RAISE EXCEPTION 'C83_DUPLICATE_PROFILE_ACCEPTED';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'CUSTOMER_NAME_ALREADY_USED' THEN RAISE; END IF; END;
 IF (SELECT display_name FROM public.customer_accounts WHERE id=account)<>original
 OR (SELECT nickname FROM public.customer_profiles WHERE id=account)<>original THEN RAISE EXCEPTION 'C83_PROFILE_PARTIAL_RENAME'; END IF;
 PERFORM public.rpc_manager_edit_license_customer(license,account,'C83 Renamed '||substr(account::text,1,8),original);
 IF (SELECT display_name FROM public.customer_accounts WHERE id=account)<>(SELECT nickname FROM public.customer_profiles WHERE id=account)
 OR (SELECT nickname FROM public.customer_profiles WHERE id=other)<>other_name THEN RAISE EXCEPTION 'C83_PROFILE_ID_RENAME'; END IF;
END; $test$;
SELECT 'C83_CANONICAL_PROFILE_RENAME_VALIDATION_ROLLBACK_PASS' AS result;

DO $test$
DECLARE owner uuid:=gen_random_uuid(); account uuid:=gen_random_uuid(); dest_account uuid:=gen_random_uuid();
 lic uuid:=gen_random_uuid(); dest uuid:=gen_random_uuid(); main text:='c83tree-'||gen_random_uuid(); leaf text:='c83tree-'||gen_random_uuid();
 keeper text:='c83tree-'||gen_random_uuid(); new_root text:='c83tree-'||gen_random_uuid(); source uuid; dest_source uuid;
 src text:='src_'||replace(gen_random_uuid()::text,'-',''); src2 text:='src_'||replace(gen_random_uuid()::text,'-',''); plan jsonb; before_data jsonb; after_data jsonb;
BEGIN
 INSERT INTO auth.users(id) VALUES(owner);
 INSERT INTO public.manager_admins(user_id,role,status) VALUES(owner,'OWNER','ACTIVE');
 INSERT INTO public.customer_accounts(id,display_name,status) VALUES(account,'C83 Tree origin','ACTIVE'),(dest_account,'C83 Tree destination','ACTIVE');
 INSERT INTO public.licenses(id,license_key_hash,mode,status,max_devices,customer_account_id)
 VALUES(lic,encode(extensions.digest(lic::text,'sha256'),'hex'),'MANAGED','ACTIVE',1,account),(dest,encode(extensions.digest(dest::text,'sha256'),'hex'),'MANAGED','ACTIVE',1,dest_account);
 INSERT INTO public.devices(device_id,display_code,device_type,device_label,status,device_token_hash)
 VALUES(main,'XF-C83A-TREE','TV','Sala','AUTHORIZED',repeat('a',64)),(leaf,'XF-C83B-TREE','PHONE','Filho','AUTHORIZED',repeat('b',64)),
 (keeper,'XF-C83C-TREE','TV','Outra raiz','AUTHORIZED',repeat('c',64)),(new_root,'XF-C83D-TREE','TV','Destino','AUTHORIZED',repeat('d',64));
 INSERT INTO public.license_devices(license_id,device_id,status) VALUES(lic,main,'ACTIVE'),(dest,new_root,'ACTIVE');
 INSERT INTO public.managed_sources(source_id,name,source_type,version,status) VALUES(src,'C83 Tree source','M3U',1,'ACTIVE') RETURNING id INTO source;
 INSERT INTO public.managed_sources(source_id,name,source_type,version,status) VALUES(src2,'C83 Tree destination source','M3U',1,'ACTIVE') RETURNING id INTO dest_source;
 INSERT INTO public.device_source_bindings(license_id,device_id,source_id) VALUES(lic,main,source),(dest,new_root,dest_source);
 PERFORM set_config('request.jwt.claim.role','authenticated',true); PERFORM set_config('request.jwt.claim.sub',owner::text,true);
 PERFORM public.rpc_manager_promote_license_device(lic,'XF-C83A-TREE'); PERFORM public.rpc_manager_promote_license_device(dest,'XF-C83D-TREE');
 PERFORM public.rpc_manager_edit_license_screens(lic,'XF-C83A-TREE',4,4,'C83 tree fixture');
 PERFORM public.rpc_manager_edit_license_screens(dest,'XF-C83D-TREE',2,2,'C83 tree fixture');
 INSERT INTO public.license_devices(license_id,device_id,status) VALUES(lic,keeper,'ACTIVE'),(lic,leaf,'ACTIVE');
 INSERT INTO public.device_source_bindings(license_id,device_id,source_id) VALUES(lic,keeper,source),(lic,leaf,source);
 INSERT INTO private.manager_device_relationships(license_id,device_id,device_role,primary_device_id,manager_id)
 VALUES(lic,keeper,'PRIMARY',NULL,owner),(lic,leaf,'SECONDARY',main,owner);
 SELECT jsonb_agg(to_jsonb(d) ORDER BY device_id) INTO before_data FROM public.devices d WHERE device_id IN (main,leaf,keeper,new_root);
 plan:=jsonb_build_object('mode','MOVE_ALL','expectedChildren',jsonb_build_array('XF-C83B-TREE'));
 BEGIN PERFORM public.rpc_manager_edit_license_device(lic,'XF-C83A-TREE','Sala','ANDROID','TV','PRIMARY','SECONDARY',dest,'XF-C83D-TREE',2,true,
 jsonb_build_object('mode','MOVE_ALL','expectedChildren','[]'::jsonb));
 RAISE EXCEPTION 'C83_TREE_STALE'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'DEVICE_TREE_CHANGED' THEN RAISE; END IF; END;
 BEGIN PERFORM public.rpc_manager_edit_license_device(lic,'XF-C83A-TREE','Sala','ANDROID','TV','PRIMARY','SECONDARY',dest,'XF-C83D-TREE',2,true,plan);
 RAISE EXCEPTION 'C83_TREE_CAPACITY'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'LICENSE_DEVICE_LIMIT_REACHED' THEN RAISE; END IF; END;
 IF (SELECT primary_device_id FROM private.manager_device_relationships WHERE license_id=lic AND device_id=leaf)<>main
 OR NOT EXISTS(SELECT 1 FROM public.license_devices WHERE license_id=lic AND device_id=main) THEN RAISE EXCEPTION 'C83_TREE_ROLLBACK'; END IF;
 -- Keep children under another existing primary in the origin account.
 BEGIN
   PERFORM public.rpc_manager_edit_license_device(lic,'XF-C83A-TREE','Sala','ANDROID','TV','PRIMARY','SECONDARY',dest,'XF-C83D-TREE',2,true,
     jsonb_build_object('mode','KEEP_ACCOUNT','expectedChildren',jsonb_build_array('XF-C83B-TREE'),'retainedPrincipalCode','XF-C83C-TREE'));
   IF NOT EXISTS(SELECT 1 FROM private.manager_device_relationships WHERE license_id=lic AND device_id=leaf AND primary_device_id=keeper)
   OR NOT EXISTS(SELECT 1 FROM public.device_source_bindings WHERE license_id=lic AND device_id=leaf AND source_id=source)
   OR NOT EXISTS(SELECT 1 FROM private.manager_device_relationships WHERE license_id=dest AND device_id=main AND primary_device_id=new_root)
   THEN RAISE EXCEPTION 'C83_TREE_KEEP_ACCOUNT'; END IF;
   RAISE EXCEPTION USING ERRCODE='ZX083',MESSAGE='C83_TREE_SCENARIO_ROLLBACK';
 EXCEPTION WHEN SQLSTATE 'ZX083' THEN NULL; END;
 PERFORM public.rpc_manager_edit_license_screens(dest,'XF-C83D-TREE',4,4,'C83 tree enough capacity');
 PERFORM public.rpc_manager_edit_license_device(lic,'XF-C83A-TREE','Sala','ANDROID','TV','PRIMARY','SECONDARY',dest,'XF-C83D-TREE',2,true,plan);
 IF NOT EXISTS(SELECT 1 FROM private.manager_device_relationships WHERE license_id=dest AND device_id=main AND primary_device_id=new_root)
 OR NOT EXISTS(SELECT 1 FROM private.manager_device_relationships WHERE license_id=dest AND device_id=leaf AND primary_device_id=new_root)
 OR EXISTS(SELECT 1 FROM public.license_devices WHERE license_id=lic AND device_id IN (main,leaf))
 OR NOT EXISTS(SELECT 1 FROM public.device_source_bindings WHERE license_id=dest AND device_id=leaf AND source_id=dest_source)
 OR NOT EXISTS(SELECT 1 FROM private.license_device_slots WHERE license_id=dest AND device_id=main AND slot_number=2)
 OR NOT EXISTS(SELECT 1 FROM private.license_device_slots WHERE license_id=dest AND device_id=leaf AND slot_number=3)
 OR NOT EXISTS(SELECT 1 FROM private.manager_device_relationships WHERE license_id=lic AND device_id=keeper AND device_role='PRIMARY')
 THEN RAISE EXCEPTION 'C83_TREE_MOVE_ALL'; END IF;
 SELECT jsonb_agg(to_jsonb(d) ORDER BY device_id) INTO after_data FROM public.devices d WHERE device_id IN (main,leaf,keeper,new_root);
 IF before_data IS DISTINCT FROM after_data THEN RAISE EXCEPTION 'C83_TREE_IDENTITY'; END IF;
END; $test$;
SELECT 'C83_TREE_MOVE_ALL_KEEP_ACCOUNT_ROLLBACK_IDENTITY_PASS' AS result;
