-- C155: reject shape-based loss of the server-owned web-session association.
DO $patch$ DECLARE source text; patched text; BEGIN
 source:=pg_get_functiondef('public.rpc_device_start_playback_session(uuid,text,text,jsonb)'::regprocedure);
 patched:=replace(source,'p_metadata:=coalesce(p_metadata,''{}''::jsonb)-''c155WebSessionId'';',
 'p_metadata:=(CASE WHEN jsonb_typeof(p_metadata)=''object'' THEN p_metadata ELSE ''{}''::jsonb END)-''c155WebSessionId'';');
 IF patched=source THEN RAISE EXCEPTION 'C155_C9_SHAPE_BOUNDARY_DRIFT'; END IF;
 EXECUTE patched;
 source:=pg_get_functiondef('private.c155_web_session_valid_id(text,text,uuid)'::regprocedure);
 patched:=replace(source,'AND p.version=w.credential_version',
 'AND p.version=w.credential_version AND coalesce(p.blocked_until<=now(),true)');
 IF patched=source THEN RAISE EXCEPTION 'C155_PIN_BLOCK_BOUNDARY_DRIFT'; END IF;
 EXECUTE patched;
END $patch$;
