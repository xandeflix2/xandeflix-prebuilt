BEGIN;
DO $test$
DECLARE master_id uuid:=gen_random_uuid(); admin_id uuid:=gen_random_uuid();
 initial jsonb; published jsonb; release jsonb; revision bigint; code bigint;
BEGIN
 INSERT INTO auth.users(id) VALUES(master_id),(admin_id);
 INSERT INTO public.manager_admins(user_id,role,status) VALUES(master_id,'OWNER','ACTIVE'),(admin_id,'ADMIN','ACTIVE');
 PERFORM set_config('request.jwt.claim.sub',admin_id::text,true);
 BEGIN PERFORM public.rpc_manager_app_update_read(); RAISE EXCEPTION 'ADMIN_NOT_DENIED';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 PERFORM set_config('request.jwt.claim.sub',master_id::text,true);
 initial:=public.rpc_manager_app_update_read(); revision:=(initial->>'revision')::bigint;
 code:=coalesce((initial->'release'->>'versionCode')::bigint,14)+1;
 release:=jsonb_build_object('versionCode',code,'versionName','C90 fixture','bytes',30,
  'sha256',repeat('a',64),'notes','Fixture update','mirrors',jsonb_build_array(
   jsonb_build_object('label','First','url','https://first.invalid/app.apk'),
   jsonb_build_object('label','Second','url','https://second.invalid/app.apk')));
 published:=public.rpc_manager_app_update_save(revision,true,release);
 IF (published->>'revision')::bigint<>revision+1 OR published->>'enabled'<>'true'
  OR published->'release'->'mirrors'->0->>'label'<>'First' THEN RAISE EXCEPTION 'PUBLICATION_FAILED'; END IF;
 BEGIN PERFORM public.rpc_manager_app_update_save(revision,true,release); RAISE EXCEPTION 'STALE_WRITE_ALLOWED';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'APP_UPDATE_REVISION_CONFLICT' THEN RAISE; END IF; END;
 BEGIN PERFORM public.rpc_manager_app_update_save(revision+1,true,jsonb_set(release,'{sha256}',to_jsonb(repeat('b',64)))); RAISE EXCEPTION 'SAME_VERSION_NEW_FILE_ALLOWED';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'APP_UPDATE_VERSION_REQUIRED' THEN RAISE; END IF; END;
 BEGIN PERFORM public.rpc_manager_app_update_save(revision+1,true,jsonb_set(release,'{mirrors,0,url}','"http://first.invalid/app.apk"')); RAISE EXCEPTION 'HTTP_ALLOWED';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'APP_UPDATE_MIRROR_INVALID' THEN RAISE; END IF; END;
 BEGIN PERFORM public.rpc_manager_app_update_save(revision+1,true,jsonb_set(release,'{bytes}','268435457')); RAISE EXCEPTION 'OVERSIZED_ALLOWED';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'APP_UPDATE_INVALID' THEN RAISE; END IF; END;
 PERFORM set_config('request.jwt.claim.sub','',true);
 EXECUTE 'SET LOCAL ROLE anon';
 IF public.rpc_app_update_release()->'release'->>'versionCode'<>code::text THEN RAISE EXCEPTION 'PUBLIC_READ_FAILED'; END IF;
 BEGIN PERFORM public.rpc_manager_app_update_read(); RAISE EXCEPTION 'ANON_ADMIN_ALLOWED';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN PERFORM * FROM private.app_update_publication; RAISE EXCEPTION 'DIRECT_TABLE_ALLOWED';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 EXECUTE 'RESET ROLE';
 PERFORM set_config('request.jwt.claim.sub',admin_id::text,true);
 BEGIN PERFORM public.rpc_manager_app_update_save(revision+1,false,NULL); RAISE EXCEPTION 'ADMIN_WRITE_ALLOWED';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 PERFORM set_config('request.jwt.claim.sub',master_id::text,true);
 PERFORM public.rpc_manager_app_update_save(revision+1,false,NULL);
 IF public.rpc_app_update_release()->'release' IS DISTINCT FROM 'null'::jsonb THEN RAISE EXCEPTION 'INACTIVE_RELEASE_EXPOSED'; END IF;
 IF EXISTS(SELECT 1 FROM public.commercial_audit_logs WHERE manager_id=master_id AND reason LIKE '%https://%') THEN RAISE EXCEPTION 'AUDIT_URL_LEAK'; END IF;
END; $test$;
SELECT 'C90_MASTER_ANON_ADMIN_RLS_REVISION_VALIDATION_PUBLIC_METADATA_PASS' AS result;
ROLLBACK;
