-- C164: public self-activation is one device, seven days, no plan/payment upgrade.
-- Existing manager/licensed commercial flows and encrypted source vaults remain unchanged.
DO $c164$
DECLARE definition text;
BEGIN
 definition:=pg_get_functiondef('public.rpc_signal_public_complete_with_screens(text,text,uuid,text,text,text,text,text,text,text,text,text,integer)'::regprocedure);
 IF position('p_initial_screens NOT BETWEEN 1 AND 4' IN definition)=0 THEN RAISE EXCEPTION 'C164_SCREEN_CORE_DRIFT'; END IF;
 definition:=replace(definition,'p_initial_screens NOT BETWEEN 1 AND 4','p_initial_screens <> 1');
 EXECUTE definition;

 definition:=pg_get_functiondef('private.evaluate_license_access(uuid,text)'::regprocedure);
 IF position('v_license.trial_expires_at IS NOT NULL AND v_now >= v_license.trial_expires_at' IN definition)=0 THEN RAISE EXCEPTION 'C164_TRIAL_CORE_DRIFT'; END IF;
 definition:=replace(definition,
  'v_license.trial_expires_at IS NOT NULL AND v_now >= v_license.trial_expires_at',
  'v_license.trial_expires_at IS NULL OR v_now >= least(v_license.trial_expires_at,v_license.trial_started_at + interval ''7 days'')');
 definition:=replace(definition,'''trialExpiresAt'', v_license.trial_expires_at',
  '''trialExpiresAt'', least(v_license.trial_expires_at,v_license.trial_started_at + interval ''7 days'')');
 EXECUTE definition;

 definition:=pg_get_functiondef('public.rpc_public_check_device_activation_session(text,text)'::regprocedure);
 IF position('SELECT s.status, s.expires_at' IN definition)=0 OR position('''expiresAt'', v_session.expires_at' IN definition)=0 THEN RAISE EXCEPTION 'C164_SESSION_CORE_DRIFT'; END IF;
 definition:=replace(definition,'SELECT s.status, s.expires_at','SELECT s.session_id, s.status, s.expires_at');
 definition:=replace(definition,'''expiresAt'', v_session.expires_at','''sessionId'', v_session.session_id, ''expiresAt'', v_session.expires_at');
 EXECUTE definition;
END;
$c164$;

CREATE FUNCTION public.rpc_public_complete_single_device(
 p_session_token_hash text,p_display_code text,p_customer_id uuid,p_customer_nickname text,
 p_source_id text,p_source_type text,p_display_name text,p_ciphertext text,p_nonce text,
 p_auth_tag text,p_key_version text,p_fingerprint text,p_initial_screens integer,
 p_customer_first_name text,p_device_label text,p_platform text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $function$
DECLARE capability record; request record; result jsonb; entitlement jsonb;
 license uuid; first_name text:=btrim(p_customer_first_name); label text:=btrim(p_device_label);
BEGIN
 IF coalesce(current_setting('request.jwt.claim.role',true),'') IN ('anon','authenticated') THEN
  RAISE EXCEPTION 'SERVICE_ROLE_REQUIRED' USING ERRCODE='42501';
 END IF;
 IF p_initial_screens IS DISTINCT FROM 1 THEN RAISE EXCEPTION 'INITIAL_SCREEN_LIMIT'; END IF;
 IF first_name IS NULL OR length(first_name) NOT BETWEEN 1 AND 32 OR first_name !~ '^[[:alpha:]][[:alpha:]''’-]*$' THEN
  RAISE EXCEPTION 'CUSTOMER_FIRST_NAME_INVALID';
 END IF;
 IF label IS NULL OR length(label) NOT BETWEEN 1 AND 100 OR label ~ '[[:cntrl:]<>]' THEN RAISE EXCEPTION 'INVALID_DEVICE_LABEL'; END IF;
 IF p_platform IS NULL OR p_platform NOT IN ('ANDROID','IOS','TIZEN','WEBOS','WEB','OTHER') THEN RAISE EXCEPTION 'INVALID_DEVICE_PLATFORM'; END IF;
 IF p_session_token_hash IS NULL OR p_session_token_hash !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'ACTIVATION_SESSION_NOT_FOUND'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('signal-policy-write',0));
 SELECT * INTO capability FROM public.device_activation_sessions WHERE session_token_hash=p_session_token_hash FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'ACTIVATION_SESSION_NOT_FOUND'; END IF;
 SELECT * INTO request FROM public.device_activation_requests WHERE activation_id=capability.activation_id FOR UPDATE;
 IF NOT FOUND OR request.display_code IS DISTINCT FROM upper(btrim(p_display_code)) THEN RAISE EXCEPTION 'ACTIVATION_SESSION_NOT_FOUND'; END IF;
 IF capability.customer_id IS NOT NULL AND capability.customer_id IS DISTINCT FROM p_customer_id THEN RAISE EXCEPTION 'SOURCE_POLICY_RETRY'; END IF;
 IF capability.status='COMPLETED' THEN
  entitlement:=private.evaluate_license_access(capability.license_id,request.device_id);
  IF entitlement->>'accessAllowed' IS DISTINCT FROM 'true' THEN RETURN jsonb_build_object('success',false,'code',coalesce(entitlement->>'code','TRIAL_EXPIRED')); END IF;
  RETURN jsonb_build_object('success',true,'status','CONSUMED','deviceAuthorizationState','AUTHORIZED',
   'licenseId',capability.license_id,'sourceId',capability.source_id,'licenseStatus',entitlement->>'licenseStatus');
 END IF;
 IF capability.status<>'OPEN' THEN RAISE EXCEPTION 'ACTIVATION_SESSION_NOT_OPEN'; END IF;
 IF capability.expires_at<=now() THEN RAISE EXCEPTION 'ACTIVATION_SESSION_EXPIRED'; END IF;
 IF request.status<>'PENDING' THEN RAISE EXCEPTION 'ACTIVATION_NOT_PENDING'; END IF;
 result:=public.rpc_signal_public_complete_with_screens(p_session_token_hash,p_display_code,p_customer_id,p_customer_nickname,
  p_source_id,p_source_type,p_display_name,p_ciphertext,p_nonce,p_auth_tag,p_key_version,p_fingerprint,1);
 IF result->>'success' IS DISTINCT FROM 'true' THEN RETURN result; END IF;
 license:=(result->>'licenseId')::uuid;
 IF NOT EXISTS(SELECT 1 FROM public.licenses l JOIN public.license_devices ld ON ld.license_id=l.id
  WHERE l.id=license AND l.customer_id=p_customer_id AND ld.device_id=request.device_id AND ld.status='ACTIVE') THEN
  RAISE EXCEPTION 'SOURCE_POLICY_RETRY';
 END IF;
 UPDATE public.customer_accounts SET display_name=first_name,updated_at=now() WHERE id=p_customer_id;
 UPDATE public.customer_profiles SET nickname=first_name,updated_at=now() WHERE id=p_customer_id;
 UPDATE public.devices SET device_label=label WHERE device_id=request.device_id;
 INSERT INTO private.manager_device_presentation(device_id,platform,device_type,updated_by)
 SELECT device_id,p_platform,device_type,p_customer_id FROM public.devices WHERE device_id=request.device_id
 ON CONFLICT(device_id) DO UPDATE SET platform=excluded.platform,device_type=excluded.device_type,updated_by=excluded.updated_by,updated_at=now();
 -- Never restart, lengthen, or automatically convert the trial.
 UPDATE public.licenses SET expires_at=least(coalesce(expires_at,trial_expires_at),trial_started_at+interval '7 days')
 WHERE id=license AND mode='SELF_SERVICE' AND status='TRIAL';
 RETURN result;
END;
$function$;
REVOKE ALL ON FUNCTION public.rpc_public_complete_single_device(text,text,uuid,text,text,text,text,text,text,text,text,text,integer,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_public_complete_single_device(text,text,uuid,text,text,text,text,text,text,text,text,text,integer,text,text,text) TO service_role;
