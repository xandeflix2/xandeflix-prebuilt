-- Atomic editor: only editable control-plane metadata enters the snapshot.
CREATE FUNCTION private.license_editor_snapshot(p_detail jsonb) RETURNS text
LANGUAGE sql IMMUTABLE SET search_path='' AS $function$
 SELECT encode(extensions.digest(jsonb_build_object(
   'license', p_detail->'license', 'customer', p_detail->'customer',
   'allowance', p_detail->'screenAllowance',
   'devices', (SELECT coalesce(jsonb_agg(jsonb_build_object(
     'id', d->'deviceId', 'label', d->'deviceLabel', 'platform', d->'platform', 'type', d->'deviceType',
     'role', d->'deviceRole', 'parent', d->'primaryDisplayCode', 'slot', d->'slotNumber',
     'status', d->'status', 'binding', d->'licenseBindingStatus') ORDER BY d->>'deviceId'),'[]'::jsonb)
     FROM jsonb_array_elements(coalesce(p_detail->'devices','[]')) d),
   'sources', (SELECT coalesce(jsonb_agg(jsonb_build_object('id',s->'sourceId','version',s->'version',
     'name',coalesce(s->'name',s->'displayName'),'status',s->'status') ORDER BY s->>'sourceId'),'[]'::jsonb)
     FROM jsonb_array_elements(coalesce(p_detail->'managedSources','[]')||coalesce(p_detail->'customerSources','[]')) s)
 )::text,'sha256'),'hex');
$function$;
REVOKE ALL ON FUNCTION private.license_editor_snapshot(jsonb) FROM PUBLIC,anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.rpc_manager_get_license_detail(p_license_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $function$
DECLARE result jsonb; paid integer;
BEGIN
 PERFORM private.manager_check_scope('rpc_manager_get_license_detail',jsonb_build_object('p_license_id',p_license_id));
 result:=private.c70_rpc_manager_get_license_detail(p_license_id);
 IF result->>'success'='true' THEN
   result:=jsonb_set(result,'{devices}',private.license_console_devices(p_license_id));
   SELECT coalesce(max(total_extra_screens),0) INTO paid FROM private.license_screen_payments WHERE license_id=p_license_id;
   result:=result||jsonb_build_object('screenAllowance',jsonb_build_object('baseScreens',4,'paidExtraScreens',paid));
   result:=result||jsonb_build_object('editorSnapshot',private.license_editor_snapshot(result));
 END IF;
 RETURN result;
END; $function$;
REVOKE ALL ON FUNCTION public.rpc_manager_get_license_detail(uuid) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.rpc_manager_get_license_detail(uuid) TO authenticated;

CREATE FUNCTION public.rpc_manager_save_license_edits(p_license_id uuid,p_expected_snapshot text,p_changes jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $function$
DECLARE detail jsonb; item jsonb; screens jsonb; source jsonb; old_capacity integer; early_screens boolean;
BEGIN
 PERFORM private.require_active_manager();
 IF NOT private.manager_can_license(p_license_id) THEN RAISE EXCEPTION 'MANAGER_SCOPE_DENIED' USING ERRCODE='42501'; END IF;
 IF jsonb_typeof(p_changes) IS DISTINCT FROM 'object' OR
   p_changes-ARRAY['customer','screens','devices','source'] <> '{}'::jsonb OR
   jsonb_typeof(p_changes->'devices') IS DISTINCT FROM 'array' OR jsonb_array_length(p_changes->'devices')>100
 THEN RAISE EXCEPTION 'INVALID_REQUEST'; END IF;
 IF (p_changes ? 'customer' AND jsonb_typeof(p_changes->'customer') IS DISTINCT FROM 'object') OR
   (p_changes ? 'screens' AND jsonb_typeof(p_changes->'screens') IS DISTINCT FROM 'object') OR
   (p_changes ? 'source' AND jsonb_typeof(p_changes->'source') IS DISTINCT FROM 'object')
 THEN RAISE EXCEPTION 'INVALID_REQUEST'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(p_changes->'devices') d WHERE jsonb_typeof(d) IS DISTINCT FROM 'object'
   OR d->>'licenseId' IS DISTINCT FROM p_license_id::text OR coalesce(d->>'role','INVALID') NOT IN ('','PRIMARY','SECONDARY')
   OR coalesce(d->>'expectedRole','INVALID') NOT IN ('','PRIMARY','SECONDARY') OR d->>'displayCode' IS NULL
   OR d->>'label' IS NULL OR d->>'platform' IS NULL OR d->>'deviceType' IS NULL)
 OR EXISTS(SELECT 1 FROM jsonb_array_elements(p_changes->'devices') d GROUP BY d->>'displayCode' HAVING count(*)>1)
 THEN RAISE EXCEPTION 'INVALID_REQUEST'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('signal-policy-write',0));
 PERFORM 1 FROM public.licenses WHERE id=p_license_id FOR UPDATE;
 detail:=public.rpc_manager_get_license_detail(p_license_id);
 IF p_expected_snapshot IS NULL OR p_expected_snapshot IS DISTINCT FROM detail->>'editorSnapshot'
 THEN RAISE EXCEPTION 'LICENSE_EDITOR_CONFLICT'; END IF;
 old_capacity:=(detail->'license'->>'maxDevices')::integer;
 screens:=p_changes->'screens'; source:=p_changes->'source';
 early_screens:=screens IS NOT NULL AND (screens->>'maxDevices')::integer>=old_capacity;
 IF p_changes ? 'customer' THEN
   item:=p_changes->'customer';
   PERFORM public.rpc_manager_edit_license_customer(p_license_id,(item->>'customerId')::uuid,item->>'name',item->>'expectedName');
 END IF;
 -- Explicit promotions can be used as the principal for a capacity change in the same save.
 FOR item IN SELECT d FROM jsonb_array_elements(p_changes->'devices') d
   WHERE d->>'role'='PRIMARY' AND d->>'expectedRole' IS DISTINCT FROM 'PRIMARY'
   ORDER BY d->>'displayCode' LOOP
   PERFORM public.rpc_manager_edit_license_device(p_license_id,item->>'displayCode',item->>'label',item->>'platform',item->>'deviceType',
     item->>'expectedRole',item->>'role',null,null,null,coalesce((item->>'roleConfirmed')::boolean,false),null);
 END LOOP;
 IF early_screens THEN
   PERFORM public.rpc_manager_edit_license_screens(p_license_id,screens->>'principalCode',(screens->>'maxDevices')::integer,
     (screens->>'maxSessions')::integer,screens->>'reason',(screens->>'paidExtraScreens')::integer,
     screens->>'paymentReference',coalesce((screens->>'paymentConfirmed')::boolean,false));
 END IF;
 -- Child metadata precedes any explicit migration of its principal's tree.
 FOR item IN SELECT d FROM jsonb_array_elements(p_changes->'devices') d
   WHERE NOT (d->>'role'='PRIMARY' AND d->>'expectedRole' IS DISTINCT FROM 'PRIMARY')
   ORDER BY CASE WHEN d ? 'treePlan' THEN 1 ELSE 0 END,d->>'displayCode' LOOP
   PERFORM public.rpc_manager_edit_license_device(p_license_id,item->>'displayCode',item->>'label',item->>'platform',item->>'deviceType',
     item->>'expectedRole',item->>'role',(item->>'primaryLicenseId')::uuid,item->>'primaryCode',
     (item->>'slotNumber')::integer,coalesce((item->>'roleConfirmed')::boolean,false),item->'treePlan');
 END LOOP;
 IF screens IS NOT NULL AND NOT early_screens THEN
   PERFORM public.rpc_manager_edit_license_screens(p_license_id,screens->>'principalCode',(screens->>'maxDevices')::integer,
     (screens->>'maxSessions')::integer,screens->>'reason',(screens->>'paidExtraScreens')::integer,
     screens->>'paymentReference',coalesce((screens->>'paymentConfirmed')::boolean,false));
 END IF;
 IF source IS NOT NULL THEN
   PERFORM public.rpc_manager_replace_license_source(p_license_id,source->'expectedSources',source->>'sourceId',source->>'name',source->>'protocol',
     source->>'ciphertext',source->>'nonce',source->>'authTag',source->>'keyVersion');
 END IF;
 RETURN jsonb_build_object('success',true);
END; $function$;
REVOKE ALL ON FUNCTION public.rpc_manager_save_license_edits(uuid,text,jsonb) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.rpc_manager_save_license_edits(uuid,text,jsonb) TO authenticated;
