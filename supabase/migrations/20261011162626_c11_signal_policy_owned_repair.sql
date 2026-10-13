-- C70 recovery never skips another user's unverified source or grants a new slot.
CREATE FUNCTION private.signal_public_owned_target(p_session_hash TEXT,p_display_code TEXT) RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE v_session JSONB; result JSONB;
BEGIN
  v_session:=public.rpc_public_check_device_activation_session(p_session_hash,p_display_code);
  IF v_session->>'success'<>'true' THEN RAISE EXCEPTION 'ACTIVATION_SESSION_NOT_OPEN' USING ERRCODE='42501'; END IF;
  IF v_session->>'customerId' IS NULL THEN RETURN NULL; END IF;
  SELECT jsonb_build_object('kind','CUSTOMER','sourceId',s.source_id,'version',s.version) INTO result
    FROM public.customer_sources s JOIN public.license_devices ld ON ld.license_id=s.license_id AND ld.status='ACTIVE'
    JOIN public.devices d ON d.device_id=ld.device_id AND d.display_code=upper(trim(p_display_code)) AND d.status='AUTHORIZED'
    JOIN public.licenses l ON l.id=s.license_id AND l.mode='SELF_SERVICE' AND l.status IN ('ACTIVE','TRIAL')
    WHERE s.customer_id=(v_session->>'customerId')::uuid AND s.status='ACTIVE' LIMIT 1;
  RETURN result;
END; $$;
REVOKE ALL ON FUNCTION private.signal_public_owned_target(TEXT,TEXT) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.rpc_signal_public_owned_target(p_session_hash TEXT,p_display_code TEXT) RETURNS JSONB
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path='' AS $$ SELECT private.signal_public_owned_target(p_session_hash,p_display_code); $$;
REVOKE ALL ON FUNCTION public.rpc_signal_public_owned_target(TEXT,TEXT) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_signal_public_owned_target(TEXT,TEXT) TO service_role;

DO $$ DECLARE d TEXT; before_clause TEXT; after_clause TEXT; BEGIN
  before_clause:='IF jsonb_array_length(public.rpc_signal_index_pending())>0 THEN RAISE EXCEPTION ''SOURCE_POLICY_PREPARING'' USING ERRCODE=''42501''; END IF;';
  SELECT pg_get_functiondef('public.rpc_signal_public_complete(text,text,uuid,text,text,text,text,text,text,text,text,text)'::regprocedure) INTO d;
  IF position(before_clause IN d)=0 THEN RAISE EXCEPTION 'C70_PUBLIC_REPAIR_PRECONDITION_CHANGED'; END IF;
  after_clause:='IF EXISTS(SELECT 1 FROM jsonb_array_elements(public.rpc_signal_index_pending()) pending
    WHERE NOT coalesce((pending->>''kind''=''CUSTOMER''
      AND pending->>''sourceId''=(private.signal_public_owned_target(p_session_token_hash,p_display_code)->>''sourceId'')
      AND pending->>''version''=(private.signal_public_owned_target(p_session_token_hash,p_display_code)->>''version'')),false))
    THEN RAISE EXCEPTION ''SOURCE_POLICY_PREPARING'' USING ERRCODE=''42501''; END IF;';
  -- SQL NULL must fail closed when there is no pre-existing authorized target.
  d:=replace(d,before_clause,after_clause); EXECUTE d;
  SELECT pg_get_functiondef('public.rpc_signal_customer_write(uuid,text,text,uuid,text,text,text,text,text,text,text,integer)'::regprocedure) INTO d;
  IF position(before_clause IN d)=0 THEN RAISE EXCEPTION 'C70_CUSTOMER_REPAIR_PRECONDITION_CHANGED'; END IF;
  after_clause:='IF EXISTS(SELECT 1 FROM jsonb_array_elements(public.rpc_signal_index_pending()) pending
    WHERE NOT (p_operation=''UPDATE_CUSTOMER_SOURCE'' AND pending->>''kind''=''CUSTOMER''
      AND pending->>''sourceId''=p_source_id AND (pending->>''version'')::integer=v_version))
    THEN RAISE EXCEPTION ''SOURCE_POLICY_PREPARING'' USING ERRCODE=''42501''; END IF;';
  d:=replace(d,before_clause,after_clause); EXECUTE d;
END; $$;
NOTIFY pgrst,'reload schema';
