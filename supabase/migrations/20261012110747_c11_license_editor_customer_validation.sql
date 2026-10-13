-- Preserve canonical self-service nickname validation when a profile exists.
CREATE OR REPLACE FUNCTION public.rpc_manager_edit_license_customer(p_license_id uuid,p_customer_id uuid,p_name text,p_expected_name text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $function$
DECLARE manager uuid; lic public.licenses; previous text; name text;
BEGIN
 manager:=private.require_active_manager();
 IF NOT private.manager_can_license(p_license_id) THEN RAISE EXCEPTION 'MANAGER_SCOPE_DENIED' USING ERRCODE='42501'; END IF;
 IF length(trim(coalesce(p_name,''))) NOT BETWEEN 1 AND 100 OR p_name ~ '[[:cntrl:]]' THEN RAISE EXCEPTION 'INVALID_CUSTOMER_NAME'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('signal-policy-write',0));
 SELECT * INTO lic FROM public.licenses WHERE id=p_license_id FOR UPDATE;
 IF p_customer_id IS NULL OR coalesce(lic.customer_account_id,lic.customer_id) IS DISTINCT FROM p_customer_id
 THEN RAISE EXCEPTION 'MANAGER_SCOPE_DENIED' USING ERRCODE='42501'; END IF;
 IF EXISTS(SELECT 1 FROM public.licenses WHERE (customer_account_id=p_customer_id OR customer_id=p_customer_id) AND NOT private.manager_can_license(id))
 THEN RAISE EXCEPTION 'MANAGER_SCOPE_DENIED' USING ERRCODE='42501'; END IF;
 IF lic.customer_account_id IS NOT NULL THEN
   SELECT display_name INTO previous FROM public.customer_accounts WHERE id=p_customer_id FOR UPDATE;
 ELSE SELECT nickname INTO previous FROM public.customer_profiles WHERE id=p_customer_id FOR UPDATE; END IF;
 IF previous IS DISTINCT FROM p_expected_name THEN RAISE EXCEPTION 'CUSTOMER_NAME_CONFLICT'; END IF;
 name:=trim(p_name);
 IF EXISTS(SELECT 1 FROM public.customer_profiles WHERE id=p_customer_id) THEN
   BEGIN name:=private.validate_customer_nickname(name);
   EXCEPTION WHEN invalid_parameter_value THEN RAISE EXCEPTION 'CUSTOMER_PROFILE_NAME_INVALID'; END;
   IF EXISTS(SELECT 1 FROM public.customer_profiles WHERE id<>p_customer_id AND lower(trim(nickname))=lower(name))
   THEN RAISE EXCEPTION 'CUSTOMER_NAME_ALREADY_USED'; END IF;
 END IF;
 UPDATE public.customer_accounts SET display_name=name,updated_at=now() WHERE id=p_customer_id;
 BEGIN UPDATE public.customer_profiles SET nickname=name,updated_at=now() WHERE id=p_customer_id;
 EXCEPTION WHEN unique_violation THEN RAISE EXCEPTION 'CUSTOMER_NAME_ALREADY_USED'; END;
 INSERT INTO public.commercial_audit_logs(manager_id,action,target_type,target_id,before_state,after_state,reason)
 VALUES(manager,'LICENSE_DEVICE_UPDATED','CUSTOMER',p_customer_id::text,jsonb_build_object('nickname',previous),jsonb_build_object('nickname',name),
 jsonb_build_object('operation','CUSTOMER_NAME_EDIT','licenseId',p_license_id)::text);
 RETURN jsonb_build_object('success',true);
END; $function$;
REVOKE ALL ON FUNCTION public.rpc_manager_edit_license_customer(uuid,uuid,text,text) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.rpc_manager_edit_license_customer(uuid,uuid,text,text) TO authenticated;
