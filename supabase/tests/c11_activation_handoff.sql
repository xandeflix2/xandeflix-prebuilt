-- Execute in BEGIN/ROLLBACK. Synthetic accounts/devices only; no fixture persists.
DO $test$
DECLARE master UUID:=gen_random_uuid(); admin_a UUID:=gen_random_uuid(); admin_b UUID:=gen_random_uuid(); consumer UUID:=gen_random_uuid(); disabled UUID:=gen_random_uuid();
 activation UUID:=gen_random_uuid(); installation UUID:=gen_random_uuid(); device TEXT:='c74-test-'||gen_random_uuid(); notification UUID; result JSONB; route_a TEXT; route_b TEXT;
 secret TEXT:=encode(extensions.gen_random_bytes(24),'hex'); key_hash TEXT:=encode(extensions.digest('012345','sha256'),'hex');
 customer UUID:=gen_random_uuid(); license UUID:=gen_random_uuid(); default_notification UUID; activation2 UUID:=gen_random_uuid(); install2 UUID:=gen_random_uuid(); device2 TEXT:='c74-test-'||gen_random_uuid();
 page_install UUID; page_activation UUID; page_device TEXT; page_code TEXT; page_prefix TEXT:=upper(substr(replace(gen_random_uuid()::text,'-',''),1,4));
 page_ids UUID[]:='{}'; cursor_id UUID; page_item JSONB; page_count INTEGER:=0; expected_count INTEGER;
BEGIN
 INSERT INTO auth.users(id) VALUES(master),(admin_a),(admin_b),(consumer),(disabled);
 INSERT INTO public.manager_admins(user_id,role,status) VALUES(master,'OWNER','ACTIVE'),(admin_a,'ADMIN','ACTIVE'),(admin_b,'ADMIN','ACTIVE'),(disabled,'ADMIN','DISABLED');
 PERFORM set_config('request.jwt.claim.sub',admin_a::text,true);
 route_a:=public.rpc_manager_activation_routing_code()->>'code';
 IF length(route_a)<>8 OR public.rpc_manager_activation_routing_code()->>'code'<>route_a THEN RAISE EXCEPTION 'C74_ROUTING_STABILITY'; END IF;
 PERFORM set_config('request.jwt.claim.sub',admin_b::text,true);route_b:=public.rpc_manager_activation_routing_code()->>'code';
 IF route_a=route_b THEN RAISE EXCEPTION 'C74_ROUTING_COLLISION'; END IF;
 INSERT INTO public.app_installations(installation_id,device_id,display_code,package_name,app_version) VALUES(installation,device,'XF-C74A-TEST','com.xandeflix.prebuilt','1.0'),(install2,device2,'XF-C74B-TEST','com.xandeflix.prebuilt','1.0');
 INSERT INTO public.device_activation_requests(activation_id,installation_id,device_id,display_code,device_token_hash,activation_key_hash,activation_status_secret_hash,status,device_type)
 VALUES(activation,installation,device,'XF-C74A-TEST',repeat('a',64),key_hash,encode(extensions.digest(secret,'sha256'),'hex'),'PENDING','TV'),
 (activation2,install2,device2,'XF-C74B-TEST',repeat('b',64),key_hash,encode(extensions.digest(secret,'sha256'),'hex'),'PENDING','TV');
 INSERT INTO private.device_activation_key_vault(device_id,display_code,activation_key_hash,ciphertext,nonce,auth_tag) VALUES(device,'XF-C74A-TEST',key_hash,'aa',repeat('a',24),repeat('b',32)),(device2,'XF-C74B-TEST',key_hash,'aa',repeat('a',24),repeat('b',32));
 PERFORM set_config('request.jwt.claim.sub','',true);
 result:=public.rpc_device_send_activation_notification(activation,device,'forged-capability-secret','TV sala','ANDROID_TV',route_a);
 IF result->>'success'<>'false' THEN RAISE EXCEPTION 'C74_FORGED_CAPABILITY'; END IF;
 result:=public.rpc_device_send_activation_notification(activation,device,secret,'https://not-allowed.invalid','ANDROID_TV',route_a);
 IF result->>'success'<>'false' THEN RAISE EXCEPTION 'C74_BAD_NAME'; END IF;
 result:=public.rpc_device_send_activation_notification(activation,device,secret,'TV sala','FAKE',route_a);
 IF result->>'success'<>'false' THEN RAISE EXCEPTION 'C74_BAD_PLATFORM'; END IF;
 result:=public.rpc_device_send_activation_notification(activation,device,secret,'TV sala','WEBOS','00000000');
 IF result->>'code'<>'HANDOFF_ROUTING_INVALID' THEN RAISE EXCEPTION 'C74_BAD_ROUTE'; END IF;
 result:=public.rpc_device_send_activation_notification(activation,device,secret,'TV sala','WEBOS',route_a);notification:=(result->>'notificationId')::uuid;
 IF notification IS NULL OR (SELECT status FROM public.device_activation_requests WHERE activation_id=activation)<>'PENDING' THEN RAISE EXCEPTION 'C74_SUBMIT_AUTHORIZED_OR_FAILED'; END IF;
 IF public.rpc_device_send_activation_notification(activation,device,secret,'TV sala','WEBOS',route_a)->>'notificationId'<>notification::text THEN RAISE EXCEPTION 'C74_IDEMPOTENT'; END IF;
 result:=public.rpc_device_send_activation_notification(activation2,device2,secret,'TV quarto','TIZEN',NULL);default_notification:=(result->>'notificationId')::uuid;
 IF default_notification IS NULL THEN RAISE EXCEPTION 'C74_DEFAULT_ROUTE'; END IF;
 BEGIN PERFORM public.rpc_manager_activation_notifications(); RAISE EXCEPTION 'C74_ANON_LIST_ALLOWED'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 PERFORM set_config('request.jwt.claim.sub',consumer::text,true);
 BEGIN PERFORM public.rpc_manager_activation_notifications(); RAISE EXCEPTION 'C74_USER_LIST_ALLOWED'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 PERFORM set_config('request.jwt.claim.sub',disabled::text,true);
 BEGIN PERFORM public.rpc_manager_activation_routing_code(); RAISE EXCEPTION 'C74_DISABLED_ROUTE_ALLOWED'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 PERFORM set_config('request.jwt.claim.sub',admin_b::text,true);
 result:=public.rpc_manager_activation_notifications();
 IF result->>'unreadCount'<>'0' OR EXISTS(SELECT 1 FROM jsonb_array_elements(result->'notifications') x WHERE x->>'id' IN(notification::text,default_notification::text)) THEN RAISE EXCEPTION 'C74_CROSS_ADMIN_LIST'; END IF;
 IF public.rpc_manager_open_activation_notification(notification)->>'success'<>'false' THEN RAISE EXCEPTION 'C74_CROSS_ADMIN_OPEN'; END IF;
 PERFORM set_config('request.jwt.claim.sub',admin_a::text,true);
 result:=public.rpc_manager_activation_notifications();
 IF result->>'unreadCount'<>'1' OR jsonb_array_length(result->'notifications')<>1 THEN RAISE EXCEPTION 'C74_ADMIN_LIST'; END IF;
 IF public.rpc_service_activation_notification_hash(admin_a,notification,'XF-C74A-TEST')->>'success'<>'false' THEN RAISE EXCEPTION 'C74_UNOPENED_HANDOFF'; END IF;
 result:=public.rpc_manager_open_activation_notification(notification);
 IF result->>'success'<>'true' OR result->>'displayCode'<>'XF-C74A-TEST' OR result ? 'activationKey' OR result ? 'activationKeyHash' THEN RAISE EXCEPTION 'C74_OPEN_METADATA'; END IF;
 IF public.rpc_manager_activation_notifications()->>'unreadCount'<>'0' THEN RAISE EXCEPTION 'C74_READ_RECEIPT'; END IF;
 IF public.rpc_service_activation_notification_hash(admin_a,notification,'XF-C74A-TEST')->>'activationKeyHash'<>key_hash THEN RAISE EXCEPTION 'C74_SERVER_HANDOFF'; END IF;
 IF public.rpc_service_activation_notification_hash(admin_b,notification,'XF-C74A-TEST')->>'success'<>'false' OR public.rpc_service_activation_notification_hash(admin_a,notification,'XF-C74B-TEST')->>'success'<>'false' THEN RAISE EXCEPTION 'C74_FORGED_HANDOFF'; END IF;
 UPDATE activation_handoff_private.receipts SET opened_at=now()-interval '16 minutes' WHERE notification_id=notification;
 IF public.rpc_service_activation_notification_hash(admin_a,notification,'XF-C74A-TEST')->>'success'<>'false' THEN RAISE EXCEPTION 'C74_EXPIRED_RECEIPT'; END IF;
 PERFORM public.rpc_manager_open_activation_notification(notification);
 UPDATE private.device_activation_key_vault SET key_status='REVOKED' WHERE device_id=device;
 IF public.rpc_manager_open_activation_notification(notification)->>'code'<>'HANDOFF_EXPIRED' THEN RAISE EXCEPTION 'C74_REVOKED_KEY'; END IF;
 UPDATE private.device_activation_key_vault SET key_status='ACTIVE' WHERE device_id=device;
 UPDATE public.device_activation_requests SET status='CONSUMED' WHERE activation_id=activation;
 IF public.rpc_manager_open_activation_notification(notification)->>'code'<>'HANDOFF_EXPIRED' OR public.rpc_service_activation_notification_hash(admin_a,notification,'XF-C74A-TEST')->>'success'<>'false' THEN RAISE EXCEPTION 'C74_CONSUMED_REQUEST'; END IF;
 UPDATE public.device_activation_requests SET status='PENDING' WHERE activation_id=activation;
 -- A routed notification must not override ownership established by another manager.
 INSERT INTO public.customer_accounts(id,display_name,status) VALUES(customer,'C74 synthetic','ACTIVE');
 INSERT INTO private.manager_customer_ownership(customer_id,manager_id) VALUES(customer,admin_b);
 INSERT INTO public.licenses(id,license_key_hash,mode,status,max_devices,customer_account_id) VALUES(license,repeat('c',64),'MANAGED','ACTIVE',1,customer);
 INSERT INTO public.devices(device_id,display_code,device_type,status,device_token_hash) VALUES(device,'XF-C74A-TEST','TV','AUTHORIZED',repeat('a',64));
 INSERT INTO public.license_devices(license_id,device_id,status) VALUES(license,device,'ACTIVE');
 IF public.rpc_manager_open_activation_notification(notification)->>'success'<>'false' THEN RAISE EXCEPTION 'C74_ROUTING_OVERRIDES_OWNER'; END IF;
 PERFORM set_config('request.jwt.claim.sub',master::text,true);
 result:=public.rpc_manager_activation_notifications();
 IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(result->'notifications') x WHERE x->>'id'=default_notification::text) OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(result->'notifications') x WHERE x->>'id'=notification::text) THEN RAISE EXCEPTION 'C74_MASTER_ALL'; END IF;
 UPDATE activation_handoff_private.notifications SET expires_at=now()-interval '1 second' WHERE id=default_notification;
 IF public.rpc_manager_open_activation_notification(default_notification)->>'code'<>'HANDOFF_EXPIRED' THEN RAISE EXCEPTION 'C74_NOTIFICATION_EXPIRED'; END IF;
 IF has_function_privilege('anon','public.rpc_manager_activation_notifications(uuid)','EXECUTE') OR has_function_privilege('authenticated','public.rpc_service_activation_notification_hash(uuid,uuid,text)','EXECUTE') OR has_function_privilege('anon','public.rpc_service_activation_notification_hash(uuid,uuid,text)','EXECUTE') THEN RAISE EXCEPTION 'C74_FUNCTION_GRANTS'; END IF;
 IF NOT has_function_privilege('service_role','public.rpc_service_activation_notification_hash(uuid,uuid,text)','EXECUTE') THEN RAISE EXCEPTION 'C74_SERVICE_GRANT'; END IF;
 IF has_table_privilege('authenticated','activation_handoff_private.notifications','SELECT') OR has_table_privilege('anon','activation_handoff_private.notifications','INSERT') THEN RAISE EXCEPTION 'C74_TABLE_GRANTS'; END IF;
 IF EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='activation_handoff_private' AND c.relkind='r' AND NOT c.relrowsecurity) THEN RAISE EXCEPTION 'C74_RLS'; END IF;
 -- More than one bounded page, including identical timestamps: no duplicates or omissions.
 FOR i IN 1..52 LOOP
  page_install:=gen_random_uuid();page_activation:=gen_random_uuid();page_device:='c74-page-'||gen_random_uuid();page_code:='XF-'||page_prefix||'-'||lpad(i::text,4,'0');
  INSERT INTO public.app_installations(installation_id,device_id,display_code,package_name,app_version) VALUES(page_install,page_device,page_code,'com.xandeflix.prebuilt','1.0');
  INSERT INTO public.device_activation_requests(activation_id,installation_id,device_id,display_code,device_token_hash,activation_key_hash,activation_status_secret_hash,status,device_type)
   VALUES(page_activation,page_install,page_device,page_code,repeat('a',64),key_hash,encode(extensions.digest(secret,'sha256'),'hex'),'PENDING','TV');
  INSERT INTO activation_handoff_private.notifications(activation_id,nickname,platform) VALUES(page_activation,'C74 pagination','ANDROID_TV');
 END LOOP;
 SELECT count(*) INTO expected_count FROM activation_handoff_private.notifications;
 cursor_id:=NULL;
 LOOP
  result:=public.rpc_manager_activation_notifications(cursor_id);page_count:=page_count+1;
  IF page_count>100 OR jsonb_array_length(result->'notifications')>50 OR (page_count=1 AND (jsonb_array_length(result->'notifications')<>50 OR result->>'hasMore'<>'true')) THEN RAISE EXCEPTION 'C74_PAGE_BOUNDS'; END IF;
  FOR page_item IN SELECT * FROM jsonb_array_elements(result->'notifications') LOOP
   cursor_id:=(page_item->>'id')::uuid;
   IF cursor_id=ANY(page_ids) THEN RAISE EXCEPTION 'C74_PAGE_DUPLICATE'; END IF;
   page_ids:=array_append(page_ids,cursor_id);
  END LOOP;
  EXIT WHEN result->>'hasMore'='false';
 END LOOP;
 IF cardinality(page_ids)<>expected_count OR page_count<2 THEN RAISE EXCEPTION 'C74_PAGE_OMISSION'; END IF;
 PERFORM set_config('request.jwt.claim.sub','',true);
END;
$test$;
