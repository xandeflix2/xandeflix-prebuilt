-- C155: delegated consumer access. No native identity, license or source is created.
CREATE TABLE private.web_access_pins (
 device_id varchar PRIMARY KEY REFERENCES public.devices(device_id) ON DELETE CASCADE,
 salt text NOT NULL CHECK (salt ~ '^[0-9a-f]{32}$'),
 verifier text NOT NULL CHECK (verifier ~ '^[0-9a-f]{64}$'),
 version uuid NOT NULL DEFAULT gen_random_uuid(),
 failures integer NOT NULL DEFAULT 0 CHECK (failures BETWEEN 0 AND 6),
 blocked_until timestamptz,
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE private.web_access_sessions (
 session_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 device_id varchar NOT NULL REFERENCES public.devices(device_id) ON DELETE CASCADE,
 license_id uuid NOT NULL REFERENCES public.licenses(id) ON DELETE CASCADE,
 credential_version uuid NOT NULL,
 token_hash text NOT NULL UNIQUE CHECK (token_hash ~ '^[0-9a-f]{64}$'),
 created_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL DEFAULT now()+interval '15 minutes',
 absolute_expires_at timestamptz NOT NULL DEFAULT now()+interval '8 hours',
 revoked_at timestamptz
);
CREATE INDEX ON private.web_access_sessions(device_id);
CREATE TABLE private.web_access_challenges (
 challenge_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 device_id varchar NOT NULL REFERENCES public.devices(device_id) ON DELETE CASCADE,
 credential_version uuid NOT NULL,
 expires_at timestamptz NOT NULL DEFAULT now()+interval '60 seconds',
 consumed boolean NOT NULL DEFAULT false
);
CREATE TABLE private.web_access_rate_limits (
 bucket_hash text PRIMARY KEY CHECK (bucket_hash ~ '^[0-9a-f]{64}$'),
 window_start timestamptz NOT NULL DEFAULT now(),
 attempts integer NOT NULL DEFAULT 1
);
CREATE INDEX ON private.web_access_challenges(expires_at);
CREATE INDEX ON private.web_access_rate_limits(window_start);
CREATE TABLE private.web_access_audit (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 device_id varchar NOT NULL,
 actor_id uuid,
 event text NOT NULL CHECK (event IN ('PIN_SET','PIN_ENROLLED','LOGIN','LOGOUT')),
 created_at timestamptz NOT NULL DEFAULT now()
);
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['web_access_pins','web_access_sessions','web_access_challenges','web_access_rate_limits','web_access_audit'] LOOP
  EXECUTE format('ALTER TABLE private.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('REVOKE ALL ON private.%I FROM PUBLIC,anon,authenticated',t);
 END LOOP;
END $$;

CREATE FUNCTION private.c155_web_session_valid_id(p_session_id text,p_device_id text,p_license_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE s private.web_access_sessions; BEGIN
 IF p_session_id IS NULL OR p_session_id !~ '^[0-9a-f-]{36}$' THEN RETURN false; END IF;
 SELECT w.* INTO s FROM private.web_access_sessions w
 JOIN private.web_access_pins p ON p.device_id=w.device_id AND p.version=w.credential_version
 JOIN public.devices d ON d.device_id=w.device_id AND d.status='AUTHORIZED'
 JOIN public.license_devices ld ON ld.device_id=w.device_id AND ld.license_id=w.license_id AND ld.status='ACTIVE'
 WHERE w.session_id::text=p_session_id AND w.device_id=p_device_id AND w.license_id=p_license_id
   AND w.revoked_at IS NULL AND w.expires_at>now() AND w.absolute_expires_at>now();
 IF NOT FOUND THEN RETURN false; END IF;
 RETURN coalesce((private.evaluate_license_access(s.license_id,s.device_id)->>'accessAllowed')::boolean,false);
END $$;
CREATE FUNCTION private.c155_web_session_id(p_device_id text,p_token text,p_license_id uuid DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE s private.web_access_sessions; BEGIN
 IF p_token IS NULL OR p_token !~ '^xw1_[0-9a-f]{64}$' THEN RETURN NULL; END IF;
 SELECT * INTO s FROM private.web_access_sessions
 WHERE token_hash=encode(extensions.digest(p_token,'sha256'),'hex') AND device_id=p_device_id
   AND (p_license_id IS NULL OR license_id=p_license_id);
 IF NOT FOUND OR NOT private.c155_web_session_valid_id(s.session_id::text,s.device_id,s.license_id) THEN RETURN NULL; END IF;
 RETURN s.session_id;
END $$;
CREATE FUNCTION private.c155_revoke_web_sessions(p_device_id text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN
 UPDATE private.web_access_sessions SET revoked_at=now() WHERE device_id=p_device_id AND revoked_at IS NULL;
 UPDATE public.playback_sessions SET status='CLOSED',closed_at=now(),close_reason='WEB_ACCESS_REVOKED'
 WHERE status='ACTIVE' AND metadata->>'c155WebSessionId' IN
 (SELECT session_id::text FROM private.web_access_sessions WHERE device_id=p_device_id);
END $$;

CREATE FUNCTION public.rpc_web_session_context(p_session_token text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE s private.web_access_sessions; d public.devices; l public.licenses; BEGIN
 IF p_session_token IS NULL OR p_session_token !~ '^xw1_[0-9a-f]{64}$' THEN RETURN jsonb_build_object('success',false); END IF;
 SELECT * INTO s FROM private.web_access_sessions WHERE token_hash=encode(extensions.digest(p_session_token,'sha256'),'hex');
 IF NOT FOUND OR NOT private.c155_web_session_valid_id(s.session_id::text,s.device_id,s.license_id) THEN RETURN jsonb_build_object('success',false); END IF;
 UPDATE private.web_access_sessions SET expires_at=least(absolute_expires_at,now()+interval '15 minutes') WHERE session_id=s.session_id;
 SELECT * INTO d FROM public.devices WHERE device_id=s.device_id;
 SELECT * INTO l FROM public.licenses WHERE id=s.license_id;
 RETURN jsonb_build_object('success',true,'sessionId',s.session_id,'ttlSeconds',900,
 'absoluteTtlSeconds',greatest(0,extract(epoch FROM s.absolute_expires_at-now())::integer),
 'activation',jsonb_build_object('deviceId',d.device_id,'displayCode',d.display_code,'deviceType',d.device_type,
 'deviceLabel',d.device_label,'licenseId',l.id,'licenseMode',l.mode,'licenseStatus',l.status,'status','AUTHORIZED'));
END $$;
CREATE FUNCTION public.rpc_web_logout(p_session_token text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE sid uuid; did text; BEGIN
 IF p_session_token IS NULL OR p_session_token !~ '^xw1_[0-9a-f]{64}$' THEN RETURN jsonb_build_object('success',true); END IF;
 UPDATE private.web_access_sessions SET revoked_at=coalesce(revoked_at,now())
 WHERE token_hash=encode(extensions.digest(p_session_token,'sha256'),'hex') RETURNING session_id,device_id INTO sid,did;
 IF sid IS NOT NULL THEN
  UPDATE public.playback_sessions SET status='CLOSED',closed_at=now(),close_reason='WEB_LOGOUT'
  WHERE status='ACTIVE' AND metadata->>'c155WebSessionId'=sid::text;
  INSERT INTO private.web_access_audit(device_id,event) VALUES(did,'LOGOUT');
 END IF;
 RETURN jsonb_build_object('success',true);
END $$;

CREATE FUNCTION public.rpc_web_auth_rate_limit(p_bucket_hash text,p_limit integer DEFAULT 120) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE attempts_now integer; BEGIN
 IF p_bucket_hash IS NULL OR p_bucket_hash !~ '^[0-9a-f]{64}$' OR p_limit NOT BETWEEN 1 AND 1200 THEN RETURN false; END IF;
 DELETE FROM private.web_access_rate_limits WHERE window_start<now()-interval '1 hour';
 DELETE FROM private.web_access_challenges WHERE expires_at<now()-interval '5 minutes';
 INSERT INTO private.web_access_rate_limits(bucket_hash) VALUES(p_bucket_hash)
 ON CONFLICT(bucket_hash) DO UPDATE SET
 attempts=CASE WHEN private.web_access_rate_limits.window_start<now()-interval '1 minute' THEN 1 ELSE least(private.web_access_rate_limits.attempts+1,1201) END,
 window_start=CASE WHEN private.web_access_rate_limits.window_start<now()-interval '1 minute' THEN now() ELSE private.web_access_rate_limits.window_start END
 RETURNING attempts INTO attempts_now;
 RETURN attempts_now<=p_limit;
END $$;
CREATE FUNCTION public.rpc_web_begin_login(p_display_code text,p_key_hash text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE d public.devices; p private.web_access_pins; challenge uuid; meta jsonb; BEGIN
 SELECT dev.* INTO d FROM public.devices dev JOIN private.device_activation_key_vault k ON k.device_id=dev.device_id
 WHERE dev.display_code=upper(trim(p_display_code)) AND dev.status='AUTHORIZED' AND k.key_status='ACTIVE' AND k.activation_key_hash=p_key_hash;
 IF NOT FOUND THEN RETURN jsonb_build_object('success',false); END IF;
 SELECT * INTO p FROM private.web_access_pins WHERE device_id=d.device_id;
 IF NOT FOUND OR p.blocked_until>now() THEN RETURN jsonb_build_object('success',false); END IF;
 meta:=public.rpc_resolve_authorized_source_metadata(d.device_id,d.device_token_hash);
 IF meta->>'status' IS DISTINCT FROM 'SOURCE_READY' THEN RETURN jsonb_build_object('success',false); END IF;
 INSERT INTO private.web_access_challenges(device_id,credential_version) VALUES(d.device_id,p.version) RETURNING challenge_id INTO challenge;
 RETURN jsonb_build_object('success',true,'challengeId',challenge,'salt',p.salt,'verifier',p.verifier);
END $$;
CREATE FUNCTION public.rpc_web_finish_login(p_challenge_id uuid,p_verified boolean,p_token_hash text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE c private.web_access_challenges; p private.web_access_pins; d public.devices; meta jsonb; BEGIN
 IF p_token_hash IS NULL OR p_token_hash !~ '^[0-9a-f]{64}$' THEN RETURN jsonb_build_object('success',false); END IF;
 SELECT * INTO c FROM private.web_access_challenges WHERE challenge_id=p_challenge_id FOR UPDATE;
 IF NOT FOUND OR c.consumed OR c.expires_at<=now() THEN RETURN jsonb_build_object('success',false); END IF;
 UPDATE private.web_access_challenges SET consumed=true WHERE challenge_id=c.challenge_id;
 SELECT * INTO p FROM private.web_access_pins WHERE device_id=c.device_id FOR UPDATE;
 IF NOT FOUND OR p.version<>c.credential_version OR p.blocked_until>now() THEN RETURN jsonb_build_object('success',false); END IF;
 IF NOT coalesce(p_verified,false) THEN
  UPDATE private.web_access_pins SET failures=least(CASE WHEN blocked_until IS NOT NULL AND blocked_until<=now() THEN 1 ELSE failures+1 END,6),
  blocked_until=CASE WHEN (CASE WHEN blocked_until IS NOT NULL AND blocked_until<=now() THEN 1 ELSE failures+1 END)>=6 THEN now()+interval '3 hours' ELSE NULL END
  WHERE device_id=p.device_id;
  RETURN jsonb_build_object('success',false);
 END IF;
 SELECT * INTO d FROM public.devices WHERE device_id=p.device_id;
 meta:=public.rpc_resolve_authorized_source_metadata(d.device_id,d.device_token_hash);
 IF meta->>'status' IS DISTINCT FROM 'SOURCE_READY' THEN RETURN jsonb_build_object('success',false); END IF;
 UPDATE private.web_access_pins SET failures=0,blocked_until=NULL WHERE device_id=p.device_id;
 INSERT INTO private.web_access_sessions(device_id,license_id,credential_version,token_hash)
 VALUES(p.device_id,(meta->>'licenseId')::uuid,p.version,p_token_hash);
 INSERT INTO private.web_access_audit(device_id,event) VALUES(p.device_id,'LOGIN');
 RETURN jsonb_build_object('success',true);
END $$;

CREATE FUNCTION public.rpc_web_can_manage_device(p_device_id text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN
 PERFORM private.require_active_manager();
 IF NOT private.manager_can_device(p_device_id) OR NOT EXISTS(SELECT 1 FROM public.devices WHERE device_id=p_device_id AND status='AUTHORIZED')
 THEN RAISE EXCEPTION 'MANAGER_SCOPE_DENIED' USING ERRCODE='42501'; END IF;
 RETURN true;
END $$;
CREATE FUNCTION public.rpc_manager_set_web_pin(p_device_id text,p_salt text,p_verifier text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid; BEGIN
 actor:=private.require_active_manager(); PERFORM public.rpc_web_can_manage_device(p_device_id);
 IF p_salt IS NULL OR p_salt !~ '^[0-9a-f]{32}$' OR p_verifier IS NULL OR p_verifier !~ '^[0-9a-f]{64}$'
 THEN RAISE EXCEPTION 'INVALID_REQUEST'; END IF;
 INSERT INTO private.web_access_pins(device_id,salt,verifier) VALUES(p_device_id,p_salt,p_verifier)
 ON CONFLICT(device_id) DO UPDATE SET salt=excluded.salt,verifier=excluded.verifier,version=gen_random_uuid(),updated_at=now();
 -- Preserve an existing lockout even when an administrator changes the PIN.
 PERFORM private.c155_revoke_web_sessions(p_device_id);
 INSERT INTO private.web_access_audit(device_id,actor_id,event) VALUES(p_device_id,actor,'PIN_SET');
 RETURN jsonb_build_object('success',true);
END $$;
CREATE FUNCTION public.rpc_web_enrollment_state(p_device_id text,p_native_token_hash text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE p private.web_access_pins; BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.devices WHERE device_id=p_device_id AND status='AUTHORIZED' AND device_token_hash=p_native_token_hash)
 THEN RETURN jsonb_build_object('success',false); END IF;
 SELECT * INTO p FROM private.web_access_pins WHERE device_id=p_device_id;
 IF FOUND AND p.blocked_until>now() THEN RETURN jsonb_build_object('success',false); END IF;
 RETURN jsonb_build_object('success',true,'salt',p.salt,'verifier',p.verifier,'version',p.version);
END $$;
CREATE FUNCTION public.rpc_web_enroll_pin(p_device_id text,p_native_token_hash text,p_expected_version uuid,p_salt text,p_verifier text,p_verified boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE current_version uuid; BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended('c155-pin:'||p_device_id,0));
 IF NOT EXISTS(SELECT 1 FROM public.devices WHERE device_id=p_device_id AND status='AUTHORIZED' AND device_token_hash=p_native_token_hash)
 THEN RETURN jsonb_build_object('success',false); END IF;
 SELECT version INTO current_version FROM private.web_access_pins WHERE device_id=p_device_id FOR UPDATE;
 IF current_version IS DISTINCT FROM p_expected_version THEN RETURN jsonb_build_object('success',false); END IF;
 IF EXISTS(SELECT 1 FROM private.web_access_pins WHERE device_id=p_device_id AND blocked_until>now()) THEN RETURN jsonb_build_object('success',false); END IF;
 IF NOT coalesce(p_verified,false) THEN
  UPDATE private.web_access_pins SET failures=least(CASE WHEN blocked_until IS NOT NULL AND blocked_until<=now() THEN 1 ELSE failures+1 END,6),
  blocked_until=CASE WHEN (CASE WHEN blocked_until IS NOT NULL AND blocked_until<=now() THEN 1 ELSE failures+1 END)>=6 THEN now()+interval '3 hours' ELSE NULL END
  WHERE device_id=p_device_id;
  RETURN jsonb_build_object('success',false);
 END IF;
 IF p_salt IS NULL OR p_salt !~ '^[0-9a-f]{32}$' OR p_verifier IS NULL OR p_verifier !~ '^[0-9a-f]{64}$' THEN RETURN jsonb_build_object('success',false); END IF;
 INSERT INTO private.web_access_pins(device_id,salt,verifier) VALUES(p_device_id,p_salt,p_verifier)
 ON CONFLICT(device_id) DO UPDATE SET salt=excluded.salt,verifier=excluded.verifier,version=gen_random_uuid(),updated_at=now();
 PERFORM private.c155_revoke_web_sessions(p_device_id);
 INSERT INTO private.web_access_audit(device_id,event) VALUES(p_device_id,'PIN_ENROLLED');
 RETURN jsonb_build_object('success',true);
END $$;

-- Preserve native code/ACLs. Fail transactionally if the expected native boundary drifted.
DO $patch$ DECLARE source text; patched text; BEGIN
 source:=pg_get_functiondef('public.rpc_resolve_authorized_source_metadata(character varying,character varying)'::regprocedure);
 patched:=replace(source,'v_device.device_token_hash IS DISTINCT FROM p_device_token_hash',
 '(v_device.device_token_hash IS DISTINCT FROM p_device_token_hash AND private.c155_web_session_id(p_device_id,p_device_token_hash) IS NULL)');
 IF patched=source THEN RAISE EXCEPTION 'C155_METADATA_BOUNDARY_DRIFT'; END IF; EXECUTE patched;
 source:=pg_get_functiondef('public.rpc_device_resolve_self_service_source(text,text,uuid)'::regprocedure);
 patched:=replace(source,'v_token_hash <> v_device.device_token_hash',
 '(v_token_hash <> v_device.device_token_hash AND private.c155_web_session_id(p_device_id,p_device_token,p_license_id) IS NULL)');
 IF patched=source THEN RAISE EXCEPTION 'C155_SELF_SERVICE_BOUNDARY_DRIFT'; END IF; EXECUTE patched;
 source:=pg_get_functiondef('public.rpc_device_start_playback_session(uuid,text,text,jsonb)'::regprocedure);
 patched:=replace(source,'v_device_token_hash <> v_device.device_token_hash',
 '(v_device_token_hash <> v_device.device_token_hash AND private.c155_web_session_id(p_device_id,p_device_token,p_license_id) IS NULL)');
 IF patched=source THEN RAISE EXCEPTION 'C155_C9_AUTH_BOUNDARY_DRIFT'; END IF;
 source:=patched;
 patched:=replace(source,'v_device RECORD;', 'v_device RECORD; v_web_session_id uuid;');
 IF patched=source THEN RAISE EXCEPTION 'C155_C9_DECLARATION_DRIFT'; END IF;
 source:=patched;
 patched:=replace(source,'-- 8.', E'v_web_session_id:=private.c155_web_session_id(p_device_id,p_device_token,p_license_id);\n    p_metadata:=coalesce(p_metadata,''{}''::jsonb)-''c155WebSessionId'';\n    IF v_web_session_id IS NOT NULL THEN p_metadata:=p_metadata||jsonb_build_object(''c155WebSessionId'',v_web_session_id); END IF;\n    -- 8.');
 IF patched=source THEN RAISE EXCEPTION 'C155_C9_METADATA_DRIFT'; END IF;
 source:=patched;
 patched:=replace(source,E'AND device_id = p_device_id\n      AND status = ''ACTIVE'';',
 E'AND device_id = p_device_id\n      AND coalesce(metadata->>''c155WebSessionId'','''')=coalesce(v_web_session_id::text,'''')\n      AND status = ''ACTIVE'';');
 IF patched=source THEN RAISE EXCEPTION 'C155_C9_SUPERSEDE_DRIFT'; END IF; EXECUTE patched;
 source:=pg_get_functiondef('public.rpc_device_heartbeat_playback_session(uuid,text,text)'::regprocedure);
 patched:=replace(source,'-- 3.',E'IF v_session.metadata->>''c155WebSessionId'' IS NOT NULL AND NOT private.c155_web_session_valid_id(v_session.metadata->>''c155WebSessionId'',p_device_id,v_session.license_id) THEN\n UPDATE public.playback_sessions SET status=''CLOSED'',closed_at=now(),close_reason=''WEB_ACCESS_REVOKED'' WHERE id=p_session_id;\n RETURN jsonb_build_object(''success'',false,''code'',''WEB_ACCESS_REVOKED''); END IF;\n    -- 3.');
 IF patched=source THEN RAISE EXCEPTION 'C155_C9_HEARTBEAT_DRIFT'; END IF; EXECUTE patched;
END $patch$;

-- Explicit grants: private tables are not an API. No verifier is anonymously readable.
REVOKE ALL ON FUNCTION private.c155_web_session_valid_id(text,text,uuid),private.c155_web_session_id(text,text,uuid),private.c155_revoke_web_sessions(text) FROM PUBLIC,anon,authenticated;
DO $$ DECLARE f regprocedure; BEGIN
 FOR f IN SELECT p.oid::regprocedure FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname IN ('rpc_web_auth_rate_limit','rpc_web_begin_login','rpc_web_finish_login','rpc_web_enrollment_state','rpc_web_enroll_pin') LOOP
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated',f);
  EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role',f);
 END LOOP;
END $$;
REVOKE ALL ON FUNCTION public.rpc_web_can_manage_device(text),public.rpc_manager_set_web_pin(text,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.rpc_web_can_manage_device(text),public.rpc_manager_set_web_pin(text,text,text) TO authenticated;
REVOKE ALL ON FUNCTION public.rpc_web_session_context(text),public.rpc_web_logout(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_web_session_context(text),public.rpc_web_logout(text) TO anon,authenticated,service_role;
