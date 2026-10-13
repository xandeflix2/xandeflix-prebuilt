-- C70. Auth identity and ownership are server-side; no real accounts are seeded.
-- Administrative operations remain behind RPCs; TRUNCATE bypasses row security.
REVOKE TRUNCATE,REFERENCES,TRIGGER ON public.playback_sessions FROM PUBLIC,anon,authenticated;
CREATE TABLE private.manager_customer_ownership (
  customer_id UUID PRIMARY KEY,
  manager_id UUID NOT NULL REFERENCES public.manager_admins(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON private.manager_customer_ownership(manager_id, customer_id);
CREATE TABLE private.manager_source_ownership (
  source_id TEXT PRIMARY KEY,
  manager_id UUID NOT NULL REFERENCES public.manager_admins(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON private.manager_source_ownership(manager_id, source_id);
ALTER TABLE private.manager_customer_ownership ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.manager_source_ownership ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.manager_customer_ownership, private.manager_source_ownership FROM PUBLIC, anon, authenticated;

CREATE FUNCTION private.manager_is_master() RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS(SELECT 1 FROM public.manager_admins
    WHERE user_id=auth.uid() AND status='ACTIVE' AND role='OWNER');
$$;
CREATE FUNCTION private.manager_can_customer(p_customer UUID) RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT private.manager_is_master() OR EXISTS (
    SELECT 1 FROM private.manager_customer_ownership o JOIN public.manager_admins m ON m.user_id=o.manager_id
    WHERE o.customer_id=p_customer AND m.user_id=auth.uid() AND m.role='ADMIN' AND m.status='ACTIVE');
$$;
CREATE FUNCTION private.manager_can_license(p_license UUID) RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT private.manager_is_master() OR EXISTS (SELECT 1 FROM public.licenses l
    WHERE l.id=p_license AND private.manager_can_customer(coalesce(l.customer_account_id,l.customer_id)));
$$;
CREATE FUNCTION private.manager_can_device(p_device TEXT) RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT private.manager_is_master() OR (
    EXISTS(SELECT 1 FROM public.license_devices ld WHERE ld.device_id=p_device AND private.manager_can_license(ld.license_id))
    AND NOT EXISTS(SELECT 1 FROM public.license_devices ld WHERE ld.device_id=p_device AND NOT private.manager_can_license(ld.license_id)));
$$;
CREATE FUNCTION private.manager_can_source(p_source TEXT) RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT private.manager_is_master() OR (
    (EXISTS(SELECT 1 FROM private.manager_source_ownership o JOIN public.manager_admins m ON m.user_id=o.manager_id
      WHERE o.source_id=p_source AND m.user_id=auth.uid() AND m.status='ACTIVE' AND m.role='ADMIN')
    OR (NOT EXISTS(SELECT 1 FROM private.manager_source_ownership o WHERE o.source_id=p_source)
      AND EXISTS(SELECT 1 FROM public.device_source_bindings b JOIN public.managed_sources s ON s.id=b.source_id
      WHERE s.source_id=p_source AND private.manager_can_license(b.license_id))))
    AND NOT EXISTS(SELECT 1 FROM public.device_source_bindings b JOIN public.managed_sources s ON s.id=b.source_id
      WHERE s.source_id=p_source AND NOT private.manager_can_license(b.license_id)));
$$;

CREATE FUNCTION public.rpc_manager_access_profile() RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_user UUID; v_role TEXT;
BEGIN
  v_user := private.require_active_manager();
  SELECT role INTO v_role FROM public.manager_admins WHERE user_id=v_user AND status='ACTIVE';
  RETURN jsonb_build_object('userId',v_user,'role',CASE WHEN v_role='OWNER' THEN 'MASTER' ELSE 'ADMIN' END);
END;
$$;
REVOKE ALL ON FUNCTION public.rpc_manager_access_profile() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.rpc_manager_access_profile() TO authenticated;

-- Known scoped operations only. Everything else requires MASTER, including
-- legacy secret-bearing reads, system configuration and sensitive reveal.
CREATE FUNCTION private.manager_check_scope(p_operation TEXT,p_args JSONB) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_user UUID; v_device TEXT; v_source TEXT; v_request TEXT;
BEGIN
  v_user := private.require_active_manager();
  IF private.manager_is_master() THEN RETURN; END IF;
  IF p_operation NOT IN (
    'rpc_manager_read_control_plane_metadata','rpc_manager_list_customers','rpc_manager_list_licenses',
    'rpc_manager_list_customer_sources','rpc_manager_list_installations','rpc_manager_list_audit_logs',
    'rpc_manager_list_device_activation_events','rpc_manager_list_device_reactivation_requests',
    'rpc_manager_get_customer_detail','rpc_manager_update_customer_status','rpc_manager_get_license_detail',
    'rpc_manager_update_license_limits','rpc_manager_suspend_license','rpc_manager_revoke_license',
    'rpc_manager_activate_license_manual','rpc_manager_list_playback_sessions',
    'rpc_manager_complete_device_activation','rpc_manager_approve_device_reactivation','rpc_manager_cancel_device_reactivation',
    'rpc_manager_bind_device_source','rpc_manager_bind_device_source_metadata',
    'rpc_manager_switch_device_source','rpc_manager_switch_device_source_metadata',
    'rpc_manager_unbind_device_source','rpc_manager_unbind_device_source_metadata',
    'rpc_manager_create_managed_source_metadata','rpc_manager_create_managed_source_vault',
    'rpc_manager_update_managed_source_metadata','rpc_manager_update_managed_source_vault',
    'rpc_manager_set_managed_source_status_metadata','rpc_manager_list_playback_errors','rpc_manager_mark_playback_error_read'
  ) THEN RAISE EXCEPTION 'MASTER_REQUIRED' USING ERRCODE='42501'; END IF;

  IF p_args->>'p_customer_id' IS NOT NULL AND NOT private.manager_can_customer((p_args->>'p_customer_id')::uuid)
    THEN RAISE EXCEPTION 'MANAGER_SCOPE_DENIED' USING ERRCODE='42501'; END IF;
  IF p_args->>'p_license_id' IS NOT NULL AND NOT private.manager_can_license((p_args->>'p_license_id')::uuid)
    THEN RAISE EXCEPTION 'MANAGER_SCOPE_DENIED' USING ERRCODE='42501'; END IF;
  -- Session list without a license is global and cannot be delegated.
  IF p_operation='rpc_manager_list_playback_sessions' AND p_args->>'p_license_id' IS NULL
    THEN RAISE EXCEPTION 'MANAGER_SCOPE_DENIED' USING ERRCODE='42501'; END IF;
  v_device := p_args->>'p_device_id';
  IF v_device IS NOT NULL AND NOT private.manager_can_device(v_device)
    THEN RAISE EXCEPTION 'MANAGER_SCOPE_DENIED' USING ERRCODE='42501'; END IF;
  v_source := p_args->>'p_source_id';
  IF v_source IS NOT NULL AND EXISTS(SELECT 1 FROM public.managed_sources WHERE source_id=v_source)
      AND NOT private.manager_can_source(v_source)
    THEN RAISE EXCEPTION 'MANAGER_SCOPE_DENIED' USING ERRCODE='42501'; END IF;
  IF v_source IS NOT NULL AND p_operation NOT IN (
    'rpc_manager_complete_device_activation','rpc_manager_create_managed_source_metadata','rpc_manager_create_managed_source_vault')
      AND NOT private.manager_can_source(v_source)
    THEN RAISE EXCEPTION 'MANAGER_SCOPE_DENIED' USING ERRCODE='42501'; END IF;
  IF p_operation='rpc_manager_complete_device_activation' THEN
    PERFORM pg_advisory_xact_lock(hashtextextended('manager-activation:'||upper(trim(p_args->>'p_display_code')),0));
    SELECT device_id INTO v_device FROM public.devices WHERE display_code=upper(trim(p_args->>'p_display_code'));
    IF v_device IS NOT NULL AND EXISTS(SELECT 1 FROM public.license_devices WHERE device_id=v_device)
      AND NOT private.manager_can_device(v_device)
      THEN RAISE EXCEPTION 'MANAGER_SCOPE_DENIED' USING ERRCODE='42501'; END IF;
    IF nullif(trim(p_args->>'p_existing_display_code'),'') IS NOT NULL THEN
      SELECT device_id INTO v_device FROM public.devices WHERE display_code=upper(trim(p_args->>'p_existing_display_code'));
      IF v_device IS NULL OR NOT private.manager_can_device(v_device)
        THEN RAISE EXCEPTION 'MANAGER_SCOPE_DENIED' USING ERRCODE='42501'; END IF;
    END IF;
  END IF;
  v_request := p_args->>'p_request_id';
  IF v_request IS NOT NULL THEN
    SELECT device_id INTO v_device FROM private.device_reactivation_requests WHERE request_id=v_request::uuid;
    IF v_device IS NULL OR NOT private.manager_can_device(v_device)
      THEN RAISE EXCEPTION 'MANAGER_SCOPE_DENIED' USING ERRCODE='42501'; END IF;
  END IF;
  IF p_args->>'p_report_id' IS NOT NULL THEN
    IF NOT EXISTS(SELECT 1 FROM playback_support_private.reports
      WHERE id=(p_args->>'p_report_id')::uuid AND private.manager_can_license(license_id))
      THEN RAISE EXCEPTION 'MANAGER_SCOPE_DENIED' USING ERRCODE='42501'; END IF;
  END IF;
END;
$$;

CREATE FUNCTION private.manager_filter_rows(p_kind TEXT,p_rows JSONB) RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_result JSONB;
BEGIN
  IF private.manager_is_master() THEN RETURN p_rows; END IF;
  SELECT coalesce(jsonb_agg(e.value ORDER BY e.ordinality),'[]'::jsonb) INTO v_result
  FROM jsonb_array_elements(coalesce(p_rows,'[]'::jsonb)) WITH ORDINALITY e(value,ordinality)
  WHERE CASE p_kind
    WHEN 'customers' THEN private.manager_can_customer((e.value->>'customerId')::uuid)
    WHEN 'licenses' THEN private.manager_can_license(coalesce(e.value->>'licenseId',e.value->>'id')::uuid)
    WHEN 'devices' THEN private.manager_can_device(e.value->>'deviceId')
    WHEN 'managedSources' THEN private.manager_can_source(coalesce(e.value->>'sourceId',e.value->>'id'))
    WHEN 'licenseBindings' THEN private.manager_can_license((e.value->>'licenseId')::uuid) AND private.manager_can_device(e.value->>'deviceId')
    WHEN 'sourceBindings' THEN private.manager_can_license((e.value->>'licenseId')::uuid) AND private.manager_can_device(e.value->>'deviceId') AND private.manager_can_source(e.value->>'sourceId')
    WHEN 'customerSources' THEN private.manager_can_customer((e.value->>'customerId')::uuid)
    WHEN 'audit' THEN (e.value->>'managerId')=auth.uid()::text
    ELSE false END;
  RETURN v_result;
END;
$$;
CREATE FUNCTION private.manager_scope_result(p_operation TEXT,p_args JSONB,p_result JSONB) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_user UUID:=auth.uid(); v_customer UUID; v_source TEXT; v_kind TEXT; v_key TEXT;
BEGIN
  -- Ownership is inserted atomically; a retry can never transfer another admin's client.
  IF p_operation='rpc_manager_complete_device_activation' AND p_result->>'success'='true' THEN
    v_customer := (p_result->>'customerId')::uuid;
    IF v_customer IS NOT NULL THEN
      INSERT INTO private.manager_customer_ownership(customer_id,manager_id) VALUES(v_customer,v_user) ON CONFLICT DO NOTHING;
      IF NOT private.manager_can_customer(v_customer) THEN RAISE EXCEPTION 'MANAGER_SCOPE_DENIED' USING ERRCODE='42501'; END IF;
    END IF;
    v_source:=p_result->>'sourceId';
  ELSIF p_operation IN ('rpc_manager_create_managed_source_metadata','rpc_manager_create_managed_source_vault')
    AND coalesce(p_result->>'success','true')='true' THEN
    v_source:=coalesce(p_result->>'sourceId',p_args->>'p_source_id');
  END IF;
  IF v_source IS NOT NULL THEN
    INSERT INTO private.manager_source_ownership(source_id,manager_id) VALUES(v_source,v_user) ON CONFLICT DO NOTHING;
    IF NOT private.manager_can_source(v_source) THEN RAISE EXCEPTION 'MANAGER_SCOPE_DENIED' USING ERRCODE='42501'; END IF;
  END IF;
  IF private.manager_is_master() THEN RETURN p_result; END IF;
  IF p_operation='rpc_manager_read_control_plane_metadata' THEN
    FOREACH v_key IN ARRAY ARRAY['licenses','devices','licenseBindings','managedSources','sourceBindings'] LOOP
      p_result:=jsonb_set(p_result,ARRAY[v_key],private.manager_filter_rows(v_key,p_result->v_key));
    END LOOP;
    RETURN p_result;
  END IF;
  v_kind:=CASE p_operation
    WHEN 'rpc_manager_list_customers' THEN 'customers'
    WHEN 'rpc_manager_list_licenses' THEN 'licenses'
    WHEN 'rpc_manager_list_customer_sources' THEN 'customerSources'
    WHEN 'rpc_manager_list_installations' THEN 'devices'
    WHEN 'rpc_manager_list_device_reactivation_requests' THEN 'devices'
    WHEN 'rpc_manager_list_device_activation_events' THEN 'devices'
    WHEN 'rpc_manager_list_audit_logs' THEN 'audit' ELSE NULL END;
  IF v_kind IS NOT NULL THEN RETURN private.manager_filter_rows(v_kind,p_result); END IF;
  RETURN p_result;
END;
$$;

-- Preserve existing signatures/defaults and audited implementations. Public
-- endpoints always check scope before calling private cores. No client chooses
-- an operation name, core name, manager id or an ownership assignment.
DO $migration$
DECLARE r RECORD; v_core TEXT; v_definition TEXT; v_arguments TEXT; v_values TEXT; v_call TEXT;
BEGIN
  FOR r IN SELECT p.oid,p.proname,p.proargnames,pg_get_function_arguments(p.oid) args,
      pg_get_function_identity_arguments(p.oid) identity_args,pg_get_functiondef(p.oid) definition
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname LIKE 'rpc_manager_%' AND p.proname<>'rpc_manager_access_profile'
    ORDER BY p.proname LOOP
    IF pg_get_function_result(r.oid)<>'jsonb' THEN RAISE EXCEPTION 'C70_UNREVIEWED_SIGNATURE'; END IF;
    v_core:='c70_'||r.proname;
    v_definition:=replace(r.definition,'public.'||r.proname||'(', 'private.'||v_core||'(');
    IF r.proname='rpc_manager_complete_device_activation' THEN
      v_definition:=replace(v_definition,'''FIRE_STICK''',
        'coalesce((SELECT device_type FROM public.devices WHERE device_id=v_device_id),(SELECT device_type FROM public.app_installations WHERE device_id=v_device_id ORDER BY last_seen_at DESC LIMIT 1),''OTHER'')');
    ELSIF r.proname='rpc_manager_list_device_reactivation_requests' THEN
      IF position('AND expires_at <= NOW();' IN v_definition)=0 THEN RAISE EXCEPTION 'C70_UNREVIEWED_EXPIRY_CORE'; END IF;
      v_definition:=replace(v_definition,'AND expires_at <= NOW();',
        'AND expires_at <= NOW() AND private.manager_can_device(device_id);');
    END IF;
    EXECUTE v_definition;
    EXECUTE format('REVOKE ALL ON FUNCTION private.%I(%s) FROM PUBLIC,anon,authenticated,service_role',v_core,r.identity_args);
    SELECT coalesce(string_agg(format('%L,%I',arg,arg),',' ORDER BY ord),'') ,
      coalesce(string_agg(format('%I',arg),',' ORDER BY ord),'') INTO v_values,v_call
      FROM unnest(r.proargnames) WITH ORDINALITY a(arg,ord);
    v_arguments:='jsonb_build_object('||v_values||')';
    EXECUTE format($wrapper$
      CREATE OR REPLACE FUNCTION public.%I(%s) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $body$
      DECLARE v_args JSONB:=%s; v_result JSONB;
      BEGIN
        PERFORM private.manager_check_scope(%L,v_args);
        v_result:=private.%I(%s);
        RETURN private.manager_scope_result(%L,v_args,v_result);
      END; $body$;
    $wrapper$,r.proname,r.args,v_arguments,r.proname,v_core,v_call,r.proname);
    EXECUTE format('REVOKE ALL ON FUNCTION public.%I(%s) FROM PUBLIC,anon',r.proname,r.identity_args);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I(%s) TO authenticated',r.proname,r.identity_args);
  END LOOP;
END;
$migration$;

-- Scope pagination/counts at the query, before LIMIT; no cross-admin cursor leak.
CREATE OR REPLACE FUNCTION playback_support_private.list_errors(p_before_id UUID)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE v_manager UUID; v_before TIMESTAMPTZ; v_unread BIGINT; v_items JSONB; v_more BOOLEAN;
BEGIN
  v_manager:=private.require_active_manager();
  IF p_before_id IS NOT NULL THEN
    SELECT created_at INTO v_before FROM playback_support_private.reports WHERE id=p_before_id AND private.manager_can_license(license_id);
    IF NOT FOUND THEN RETURN jsonb_build_object('success',false,'code','REPORT_UNAVAILABLE'); END IF;
  END IF;
  SELECT count(*) INTO v_unread FROM playback_support_private.reports r
    WHERE private.manager_can_license(r.license_id)
      AND NOT EXISTS(SELECT 1 FROM playback_support_private.read_receipts rr WHERE rr.report_id=r.id AND rr.manager_id=v_manager);
  WITH page AS (
    SELECT r.* FROM playback_support_private.reports r WHERE private.manager_can_license(r.license_id)
      AND (p_before_id IS NULL OR (r.created_at,r.id)<(v_before,p_before_id))
      ORDER BY r.created_at DESC,r.id DESC LIMIT 51
  ), displayed AS (SELECT * FROM page ORDER BY created_at DESC,id DESC LIMIT 50)
  SELECT (SELECT count(*)>50 FROM page),coalesce(jsonb_agg(jsonb_build_object(
    'id',r.id,'receivedAt',r.created_at,'diagnostic',r.diagnostic,'displayCode',d.display_code,
    'deviceLabel',d.device_label,'deviceType',d.device_type,'customerName',coalesce(left(ca.display_name,100),left(c.nickname,100),''),
    'read',EXISTS(SELECT 1 FROM playback_support_private.read_receipts rr WHERE rr.report_id=r.id AND rr.manager_id=v_manager)
  ) ORDER BY r.created_at DESC,r.id DESC),'[]'::jsonb) INTO v_more,v_items
  FROM displayed r JOIN public.devices d ON d.id=r.device_pk JOIN public.licenses l ON l.id=r.license_id
    LEFT JOIN public.customer_accounts ca ON ca.id=l.customer_account_id LEFT JOIN public.customer_profiles c ON c.id=l.customer_id;
  RETURN jsonb_build_object('success',true,'unreadCount',v_unread,'reports',v_items,'hasMore',v_more);
END;
$$;
CREATE OR REPLACE FUNCTION playback_support_private.mark_read(p_report_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_manager UUID;
BEGIN
  v_manager:=private.require_active_manager();
  IF NOT EXISTS(SELECT 1 FROM playback_support_private.reports WHERE id=p_report_id AND private.manager_can_license(license_id))
    THEN RETURN jsonb_build_object('success',false,'code','REPORT_UNAVAILABLE'); END IF;
  INSERT INTO playback_support_private.read_receipts(report_id,manager_id) VALUES(p_report_id,v_manager) ON CONFLICT DO NOTHING;
  RETURN jsonb_build_object('success',true);
END;
$$;
DO $$ DECLARE r RECORD; BEGIN
  FOR r IN SELECT p.oid::regprocedure fn FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='private' AND p.proname IN ('manager_is_master','manager_can_customer','manager_can_license','manager_can_device','manager_can_source','manager_check_scope','manager_filter_rows','manager_scope_result') LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated,service_role',r.fn);
  END LOOP;
END; $$;
-- Extend existing audit enums without relaxing any historical validation.
DO $$ DECLARE r RECORD; BEGIN
  FOR r IN SELECT conname,pg_get_expr(conbin,conrelid) expression FROM pg_constraint
    WHERE conrelid='public.commercial_audit_logs'::regclass
      AND conname IN ('commercial_audit_logs_action_check','commercial_audit_logs_target_type_check') LOOP
    EXECUTE format('ALTER TABLE public.commercial_audit_logs DROP CONSTRAINT %I',r.conname);
    EXECUTE format('ALTER TABLE public.commercial_audit_logs ADD CONSTRAINT %I CHECK ((%s) OR %s)',r.conname,r.expression,
      CASE r.conname WHEN 'commercial_audit_logs_action_check' THEN 'action=''DEVICE_PERMANENTLY_DELETED''' ELSE 'target_type=''DEVICE''' END);
  END LOOP;
END; $$;
CREATE FUNCTION public.rpc_manager_delete_device_permanently(p_device_id TEXT,p_confirmation_code TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_manager UUID; v_code TEXT;
BEGIN
  v_manager:=private.require_master_manager();
  SELECT display_code INTO v_code FROM public.devices WHERE device_id=p_device_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'INVALID_DEVICE_ID' USING ERRCODE='22023'; END IF;
  IF v_code IS NULL OR upper(trim(p_confirmation_code)) IS DISTINCT FROM v_code
    THEN RAISE EXCEPTION 'DEVICE_DELETE_CONFIRMATION_REQUIRED' USING ERRCODE='22023'; END IF;
  UPDATE public.devices SET status='REVOKED' WHERE device_id=p_device_id;
  UPDATE public.playback_sessions SET status='CLOSED',closed_at=now(),close_reason='MASTER_DEVICE_DELETION'
    WHERE device_id=p_device_id AND status='ACTIVE';
  -- Device foreign keys cascade license bindings, source bindings and sessions.
  -- Licenses, other devices, customer/source vaults and audit remain intact.
  DELETE FROM public.device_activation_sessions WHERE activation_id IN
    (SELECT activation_id FROM public.device_activation_requests WHERE device_id=p_device_id);
  UPDATE public.device_activation_events SET activation_id=NULL WHERE activation_id IN
    (SELECT activation_id FROM public.device_activation_requests WHERE device_id=p_device_id);
  DELETE FROM public.device_activation_requests WHERE device_id=p_device_id;
  DELETE FROM private.device_reactivation_requests WHERE device_id=p_device_id;
  DELETE FROM private.device_activation_key_vault WHERE device_id=p_device_id;
  DELETE FROM public.app_installations WHERE device_id=p_device_id AND package_name='com.xandeflix.prebuilt';
  DELETE FROM public.devices WHERE device_id=p_device_id;
  INSERT INTO public.commercial_audit_logs(manager_id,action,target_type,target_id,reason)
    VALUES(v_manager,'DEVICE_PERMANENTLY_DELETED','DEVICE',p_device_id,'Master confirmation');
  RETURN jsonb_build_object('success',true,'code','DEVICE_DELETED');
END;
$$;
REVOKE ALL ON FUNCTION public.rpc_manager_delete_device_permanently(TEXT,TEXT) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.rpc_manager_delete_device_permanently(TEXT,TEXT) TO authenticated;
NOTIFY pgrst,'reload schema';
