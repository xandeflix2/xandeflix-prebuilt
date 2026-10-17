-- Bind delegated sessions/challenges to the current permanent-key generation.
-- The private fingerprint is not an activation key, native token or source ID.
ALTER TABLE private.web_access_sessions ADD COLUMN key_generation text;
ALTER TABLE private.web_access_challenges ADD COLUMN key_generation text;
CREATE FUNCTION private.c155_key_generation(p_device_id text,p_expected_hash text DEFAULT NULL)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT encode(extensions.digest(k.vault_record_id::text||':'||k.activation_key_hash||':'||
 coalesce(extract(epoch FROM k.rotated_at)::text,'')||':'||k.key_status,'sha256'),'hex')
 FROM private.device_activation_key_vault k WHERE k.device_id=p_device_id AND k.key_status='ACTIVE'
 AND (p_expected_hash IS NULL OR k.activation_key_hash=p_expected_hash);
$$;
REVOKE ALL ON FUNCTION private.c155_key_generation(text,text) FROM PUBLIC,anon,authenticated;
DO $patch$ DECLARE source text; patched text; BEGIN
 source:=pg_get_functiondef('public.rpc_web_begin_login(text,text)'::regprocedure);
 patched:=replace(source,
 'private.web_access_challenges(device_id,credential_version) VALUES(d.device_id,p.version)',
 'private.web_access_challenges(device_id,credential_version,key_generation) VALUES(d.device_id,p.version,private.c155_key_generation(d.device_id,p_key_hash))');
 IF patched=source THEN RAISE EXCEPTION 'C155_CHALLENGE_KEY_BOUNDARY_DRIFT'; END IF; EXECUTE patched;
 source:=pg_get_functiondef('public.rpc_web_finish_login(uuid,boolean,text)'::regprocedure);
 patched:=replace(source,'p.version<>c.credential_version',
 '(p.version<>c.credential_version OR c.key_generation IS NULL OR c.key_generation IS DISTINCT FROM private.c155_key_generation(p.device_id))');
 IF patched=source THEN RAISE EXCEPTION 'C155_FINISH_KEY_BOUNDARY_DRIFT'; END IF;
 source:=patched;
 patched:=replace(source,'private.web_access_sessions(device_id,license_id,credential_version,token_hash)',
 'private.web_access_sessions(device_id,license_id,credential_version,token_hash,key_generation)');
 IF patched=source THEN RAISE EXCEPTION 'C155_SESSION_KEY_COLUMN_DRIFT'; END IF;
 source:=patched;
 patched:=replace(source,'VALUES(p.device_id,(meta->>''licenseId'')::uuid,p.version,p_token_hash)',
 'VALUES(p.device_id,(meta->>''licenseId'')::uuid,p.version,p_token_hash,c.key_generation)');
 IF patched=source THEN RAISE EXCEPTION 'C155_SESSION_KEY_VALUE_DRIFT'; END IF; EXECUTE patched;
 source:=pg_get_functiondef('private.c155_web_session_valid_id(text,text,uuid)'::regprocedure);
 patched:=replace(source,'AND w.revoked_at IS NULL',
 'AND w.key_generation IS NOT NULL AND w.key_generation=private.c155_key_generation(w.device_id) AND w.revoked_at IS NULL');
 IF patched=source THEN RAISE EXCEPTION 'C155_KEY_GENERATION_BOUNDARY_DRIFT'; END IF; EXECUTE patched;
END $patch$;
