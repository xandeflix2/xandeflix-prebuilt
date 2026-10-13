-- Isolated fixtures only; execute the entire file so every write is rolled back.
BEGIN;
DO $test$
DECLARE
 manager uuid:=gen_random_uuid(); installation uuid:=gen_random_uuid();
 device text:='c89-'||gen_random_uuid();
 code text:='XF-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,4))||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,4));
 key_hash text:=encode(extensions.gen_random_bytes(32),'hex');
 token_hash text:=encode(extensions.gen_random_bytes(32),'hex');
 session_hash text:=encode(extensions.gen_random_bytes(32),'hex');
 first_request jsonb; second_request jsonb; result jsonb;
BEGIN
 INSERT INTO auth.users(id) VALUES(manager);
 INSERT INTO public.manager_admins(user_id,role,status) VALUES(manager,'OWNER','ACTIVE');
 PERFORM set_config('request.jwt.claim.role','anon',true);
 result:=public.rpc_report_app_installation(jsonb_build_object(
   'installationId',installation,'deviceId',device,'displayCode',code,
   'packageName','com.xandeflix.prebuilt','platform','ANDROID','deviceType','TV',
   'manufacturer','Fixture','model','C89 fixture','appVersion','2.0.0','buildNumber','1'));
 IF (result->>'success')::boolean IS DISTINCT FROM true THEN RAISE EXCEPTION 'C89_INITIAL_REPORT_FAILED'; END IF;
 first_request:=public.rpc_request_device_activation(installation,device,code,token_hash,key_hash,'TV','C89 fixture');
 PERFORM set_config('request.jwt.claim.role','service_role',true);
 PERFORM public.rpc_register_permanent_device_activation_key((first_request->>'activationId')::uuid,device,code,key_hash,'aa',repeat('1',24),repeat('2',32),'v1');
 INSERT INTO public.devices(device_id,display_code,device_type,device_label,status,device_token_hash)
 VALUES(device,code,'TV','C89 fixture','AUTHORIZED',token_hash);
 PERFORM set_config('request.jwt.claim.role','authenticated',true);
 PERFORM set_config('request.jwt.claim.sub',manager::text,true);
 PERFORM public.rpc_manager_delete_device_permanently(device,code);
 IF EXISTS(SELECT 1 FROM public.devices WHERE device_id=device)
    OR EXISTS(SELECT 1 FROM public.device_activation_requests WHERE device_id=device)
    OR EXISTS(SELECT 1 FROM private.device_activation_key_vault WHERE device_id=device)
    OR EXISTS(SELECT 1 FROM public.app_installations WHERE installation_id=installation) THEN
   RAISE EXCEPTION 'C89_DELETION_NOT_COMPLETE';
 END IF;
 PERFORM set_config('request.jwt.claim.role','anon',true);
 result:=public.rpc_check_device_activation_status((first_request->>'activationId')::uuid,device,first_request->>'activationStatusSecret');
 IF result->>'code'<>'ACTIVATION_NOT_FOUND' THEN RAISE EXCEPTION 'C89_MISSING_STATUS_NOT_EXPLICIT'; END IF;
 PERFORM set_config('request.jwt.claim.role','service_role',true);
 result:=public.rpc_public_start_device_activation(code,key_hash,session_hash);
 IF result->>'code'<>'ACTIVATION_NOT_FOUND' THEN RAISE EXCEPTION 'C89_MANAGER_START_SHOULD_REQUIRE_REQUEST'; END IF;
 PERFORM set_config('request.jwt.claim.role','anon',true);
 PERFORM public.rpc_report_app_installation(jsonb_build_object(
   'installationId',installation,'deviceId',device,'displayCode',code,
   'packageName','com.xandeflix.prebuilt','platform','ANDROID','deviceType','TV',
   'manufacturer','Fixture','model','C89 fixture','appVersion','2.0.0','buildNumber','1'));
 second_request:=public.rpc_request_device_activation(installation,device,code,token_hash,key_hash,'TV','C89 fixture');
 IF second_request->>'activationId'=first_request->>'activationId' OR second_request->>'activationStatusSecret'=first_request->>'activationStatusSecret' THEN
   RAISE EXCEPTION 'C89_CAPABILITY_NOT_REPLACED';
 END IF;
 BEGIN
   PERFORM public.rpc_check_device_activation_status((second_request->>'activationId')::uuid,device,first_request->>'activationStatusSecret');
   RAISE EXCEPTION 'C89_OLD_CAPABILITY_MUST_FAIL';
 EXCEPTION WHEN insufficient_privilege THEN IF SQLERRM<>'ACTIVATION_STATUS_CAPABILITY_INVALID' THEN RAISE; END IF; END;
 PERFORM set_config('request.jwt.claim.role','service_role',true);
 PERFORM public.rpc_register_permanent_device_activation_key((second_request->>'activationId')::uuid,device,code,key_hash,'bb',repeat('3',24),repeat('4',32),'v1');
 result:=public.rpc_public_start_device_activation(code,encode(extensions.gen_random_bytes(32),'hex'),session_hash);
 IF result->>'code'<>'INVALID_ACTIVATION_KEY' THEN RAISE EXCEPTION 'C89_WRONG_KEY_MUST_FAIL'; END IF;
 result:=public.rpc_public_start_device_activation(code,key_hash,session_hash);
 IF (result->>'success')::boolean IS DISTINCT FROM true THEN RAISE EXCEPTION 'C89_NEW_REGISTRATION_NOT_VALIDATABLE'; END IF;
 result:=public.rpc_claim_device_key(code,key_hash);
 IF result->>'deviceId'<>device OR result->>'activationId'<>second_request->>'activationId'
    OR result->>'deviceTokenHash'<>token_hash THEN RAISE EXCEPTION 'C89_IDENTITY_OR_TOKEN_CHANGED'; END IF;
 IF EXISTS(SELECT 1 FROM public.devices WHERE device_id=device)
    OR EXISTS(SELECT 1 FROM public.license_devices WHERE device_id=device)
    OR EXISTS(SELECT 1 FROM public.device_source_bindings WHERE device_id=device) THEN
   RAISE EXCEPTION 'C89_REGISTRATION_MUST_NOT_AUTHORIZE';
 END IF;
 INSERT INTO public.devices(device_id,display_code,device_type,status,device_token_hash) VALUES(device,code,'TV','REVOKED',token_hash);
 PERFORM set_config('request.jwt.claim.role','anon',true);
 BEGIN
   PERFORM public.rpc_request_device_activation(installation,device,code,token_hash,key_hash,'TV','C89 fixture');
   RAISE EXCEPTION 'C89_REVOCATION_MUST_NOT_BE_BYPASSED';
 EXCEPTION WHEN insufficient_privilege THEN IF SQLERRM<>'DEVICE_REVOKED_REQUIRES_REACTIVATION' THEN RAISE; END IF; END;
 PERFORM set_config('test.c89.result','C89_DELETION_NEW_REQUEST_SAME_IDENTITY_VALIDATION_NO_AUTO_AUTH_REVOCATION_PASS',true);
END;
$test$;
SELECT current_setting('test.c89.result') AS result;
ROLLBACK;
