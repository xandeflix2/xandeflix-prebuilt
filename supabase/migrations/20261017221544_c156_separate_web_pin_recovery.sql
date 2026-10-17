-- C156: public recovery key only; PUK and encrypted private key stay on device.
CREATE TABLE private.web_pin_recovery (
 device_id varchar PRIMARY KEY REFERENCES public.devices(device_id) ON DELETE CASCADE,
 public_key text NOT NULL CHECK(public_key ~ '^[0-9a-f]{182}$'),
 version uuid NOT NULL DEFAULT gen_random_uuid(), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE private.web_pin_recovery_challenges (
 challenge_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 device_id varchar NOT NULL REFERENCES public.devices(device_id) ON DELETE CASCADE,
 recovery_version uuid NOT NULL, credential_version uuid NOT NULL, key_generation text NOT NULL,
 nonce text NOT NULL, expires_at timestamptz NOT NULL DEFAULT now()+interval '60 seconds'
);
CREATE INDEX ON private.web_pin_recovery_challenges(device_id);
ALTER TABLE private.web_pin_recovery ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.web_pin_recovery_challenges ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.web_pin_recovery,private.web_pin_recovery_challenges FROM PUBLIC,anon,authenticated;

CREATE FUNCTION private.c156_native_allowed(p_device_id text,p_hash text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.devices WHERE device_id=p_device_id AND status='AUTHORIZED'
 AND p_hash ~ '^[0-9a-f]{64}$' AND device_token_hash=p_hash);
$$;
CREATE FUNCTION private.c156_fail(p_device_id text) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path='' AS $$
 UPDATE private.web_access_pins SET
 failures=least(CASE WHEN blocked_until IS NOT NULL AND blocked_until<=now() THEN 1 ELSE failures+1 END,6),
 blocked_until=CASE WHEN (CASE WHEN blocked_until IS NOT NULL AND blocked_until<=now() THEN 1 ELSE failures+1 END)>=6
 THEN now()+interval '3 hours' ELSE NULL END WHERE device_id=p_device_id;
$$;
REVOKE ALL ON FUNCTION private.c156_native_allowed(text,text),private.c156_fail(text) FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.rpc_web_pin_device_state(p_device_id text,p_native_token_hash text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE p private.web_access_pins; r private.web_pin_recovery; BEGIN
 IF NOT private.c156_native_allowed(p_device_id,p_native_token_hash) THEN RETURN jsonb_build_object('success',false); END IF;
 SELECT * INTO p FROM private.web_access_pins WHERE device_id=p_device_id;
 IF p.blocked_until>now() THEN RETURN jsonb_build_object('success',false); END IF;
 SELECT * INTO r FROM private.web_pin_recovery WHERE device_id=p_device_id;
 -- Salt/verifier are service-only, never copied into the device response.
 RETURN jsonb_build_object('success',true,'configured',p.device_id IS NOT NULL,'publicKey',r.public_key,
 'version',p.version,'salt',p.salt,'verifier',p.verifier);
END $$;

CREATE FUNCTION public.rpc_web_pin_register(p_device_id text,p_native_token_hash text,p_expected_version uuid,
 p_previous_verified boolean,p_public_key text,p_salt text,p_verifier text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE p private.web_access_pins; BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended('c155-pin:'||p_device_id,0));
 IF NOT private.c156_native_allowed(p_device_id,p_native_token_hash) OR p_public_key IS NULL OR p_public_key !~ '^[0-9a-f]{182}$'
 OR p_salt IS NULL OR p_salt !~ '^[0-9a-f]{32}$' OR p_verifier IS NULL OR p_verifier !~ '^[0-9a-f]{64}$'
 OR EXISTS(SELECT 1 FROM private.web_pin_recovery WHERE device_id=p_device_id) THEN RETURN jsonb_build_object('success',false); END IF;
 SELECT * INTO p FROM private.web_access_pins WHERE device_id=p_device_id FOR UPDATE;
 IF p.version IS DISTINCT FROM p_expected_version OR p.blocked_until>now() THEN RETURN jsonb_build_object('success',false); END IF;
 IF p.device_id IS NOT NULL AND NOT coalesce(p_previous_verified,false) THEN
  PERFORM private.c156_fail(p_device_id); RETURN jsonb_build_object('success',false);
 END IF;
 INSERT INTO private.web_access_pins(device_id,salt,verifier) VALUES(p_device_id,p_salt,p_verifier)
 ON CONFLICT(device_id) DO UPDATE SET salt=excluded.salt,verifier=excluded.verifier,version=gen_random_uuid(),updated_at=now();
 INSERT INTO private.web_pin_recovery(device_id,public_key) VALUES(p_device_id,p_public_key);
 PERFORM private.c155_revoke_web_sessions(p_device_id);
 INSERT INTO private.web_access_audit(device_id,event) VALUES(p_device_id,'PIN_ENROLLED');
 RETURN jsonb_build_object('success',true);
END $$;

CREATE FUNCTION public.rpc_web_pin_begin_recovery(p_device_id text,p_native_token_hash text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE p private.web_access_pins; r private.web_pin_recovery; c private.web_pin_recovery_challenges; generation text; BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended('c155-pin:'||p_device_id,0));
 IF NOT private.c156_native_allowed(p_device_id,p_native_token_hash) THEN RETURN jsonb_build_object('success',false); END IF;
 SELECT * INTO p FROM private.web_access_pins WHERE device_id=p_device_id FOR UPDATE;
 SELECT * INTO r FROM private.web_pin_recovery WHERE device_id=p_device_id;
 generation:=private.c155_key_generation(p_device_id);
 IF p.device_id IS NULL OR r.device_id IS NULL OR p.blocked_until>now() OR generation IS NULL THEN RETURN jsonb_build_object('success',false); END IF;
 DELETE FROM private.web_pin_recovery_challenges WHERE device_id=p_device_id AND expires_at<=now();
 INSERT INTO private.web_pin_recovery_challenges(device_id,recovery_version,credential_version,key_generation,nonce)
 VALUES(p_device_id,r.version,p.version,generation,encode(extensions.gen_random_bytes(32),'hex')) RETURNING * INTO c;
 RETURN jsonb_build_object('success',true,'challengeId',c.challenge_id,'publicKey',r.public_key,
 'challenge','xandeflix:c156:'||p_device_id||':'||c.challenge_id::text||':'||c.nonce);
END $$;

CREATE FUNCTION public.rpc_web_pin_recovery_proof(p_device_id text,p_native_token_hash text,p_challenge_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE c private.web_pin_recovery_challenges; r private.web_pin_recovery; BEGIN
 IF NOT private.c156_native_allowed(p_device_id,p_native_token_hash) THEN RETURN jsonb_build_object('success',false); END IF;
 SELECT * INTO c FROM private.web_pin_recovery_challenges WHERE challenge_id=p_challenge_id AND device_id=p_device_id AND expires_at>now();
 SELECT * INTO r FROM private.web_pin_recovery WHERE device_id=p_device_id;
 IF c.challenge_id IS NULL OR r.version IS DISTINCT FROM c.recovery_version THEN RETURN jsonb_build_object('success',false); END IF;
 RETURN jsonb_build_object('success',true,'publicKey',r.public_key,
 'challenge','xandeflix:c156:'||p_device_id||':'||c.challenge_id::text||':'||c.nonce);
END $$;

CREATE FUNCTION public.rpc_web_pin_finish_recovery(p_device_id text,p_native_token_hash text,p_challenge_id uuid,
 p_verified boolean,p_salt text,p_verifier text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE c private.web_pin_recovery_challenges; p private.web_access_pins; r private.web_pin_recovery; BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended('c155-pin:'||p_device_id,0));
 IF NOT private.c156_native_allowed(p_device_id,p_native_token_hash) THEN RETURN jsonb_build_object('success',false); END IF;
 DELETE FROM private.web_pin_recovery_challenges WHERE challenge_id=p_challenge_id AND device_id=p_device_id RETURNING * INTO c;
 SELECT * INTO p FROM private.web_access_pins WHERE device_id=p_device_id FOR UPDATE;
 SELECT * INTO r FROM private.web_pin_recovery WHERE device_id=p_device_id;
 IF c.challenge_id IS NULL OR c.expires_at<=now() OR p.version IS DISTINCT FROM c.credential_version
 OR r.version IS DISTINCT FROM c.recovery_version OR c.key_generation IS DISTINCT FROM private.c155_key_generation(p_device_id)
 OR p.blocked_until>now() THEN RETURN jsonb_build_object('success',false); END IF;
 IF NOT coalesce(p_verified,false) THEN PERFORM private.c156_fail(p_device_id); RETURN jsonb_build_object('success',false); END IF;
 IF p_salt IS NULL OR p_salt !~ '^[0-9a-f]{32}$' OR p_verifier IS NULL OR p_verifier !~ '^[0-9a-f]{64}$' THEN RETURN jsonb_build_object('success',false); END IF;
 UPDATE private.web_access_pins SET salt=p_salt,verifier=p_verifier,version=gen_random_uuid(),updated_at=now() WHERE device_id=p_device_id;
 PERFORM private.c155_revoke_web_sessions(p_device_id);
 INSERT INTO private.web_access_audit(device_id,event) VALUES(p_device_id,'PIN_ENROLLED');
 RETURN jsonb_build_object('success',true);
END $$;

-- Retire the previous PIN-sharing API, including calls from older APKs.
CREATE OR REPLACE FUNCTION public.rpc_web_enroll_pin(p_device_id text,p_native_token_hash text,p_expected_version uuid,p_salt text,p_verifier text,p_verified boolean)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path='' AS $$ SELECT jsonb_build_object('success',false); $$;
CREATE OR REPLACE FUNCTION public.rpc_manager_set_web_pin(p_device_id text,p_salt text,p_verifier text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid; inserted text; BEGIN
 actor:=private.require_active_manager(); PERFORM public.rpc_web_can_manage_device(p_device_id);
 PERFORM pg_advisory_xact_lock(hashtextextended('c155-pin:'||p_device_id,0));
 IF p_salt IS NULL OR p_salt !~ '^[0-9a-f]{32}$' OR p_verifier IS NULL OR p_verifier !~ '^[0-9a-f]{64}$' THEN RETURN jsonb_build_object('success',false); END IF;
 INSERT INTO private.web_access_pins(device_id,salt,verifier) VALUES(p_device_id,p_salt,p_verifier)
 ON CONFLICT(device_id) DO NOTHING RETURNING device_id INTO inserted;
 IF inserted IS NULL THEN RETURN jsonb_build_object('success',false); END IF;
 INSERT INTO private.web_access_audit(device_id,actor_id,event) VALUES(p_device_id,actor,'PIN_SET');
 RETURN jsonb_build_object('success',true);
END $$;
DO $$ DECLARE f record; BEGIN
 FOR f IN SELECT p.oid::regprocedure signature FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname IN ('rpc_web_pin_device_state','rpc_web_pin_register','rpc_web_pin_begin_recovery','rpc_web_pin_recovery_proof','rpc_web_pin_finish_recovery') LOOP
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated',f.signature);
  EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role',f.signature);
 END LOOP;
END $$;
