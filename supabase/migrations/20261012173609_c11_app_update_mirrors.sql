-- C90 public software metadata; no media, credentials or APK stored remotely.
CREATE TABLE private.app_update_publication (
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
 revision bigint NOT NULL DEFAULT 0, enabled boolean NOT NULL DEFAULT false,
 release jsonb, updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO private.app_update_publication(singleton) VALUES(true);
ALTER TABLE private.app_update_publication ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.app_update_publication FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION public.rpc_app_update_release() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT jsonb_build_object('enabled',enabled,'revision',revision,
   'release',CASE WHEN enabled THEN release ELSE NULL END)
 FROM private.app_update_publication WHERE singleton;
$$;
REVOKE ALL ON FUNCTION public.rpc_app_update_release() FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.rpc_app_update_release() TO anon,authenticated;

CREATE FUNCTION public.rpc_manager_app_update_read() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 PERFORM private.require_master_manager();
 RETURN (SELECT jsonb_build_object('enabled',enabled,'revision',revision,'release',release)
  FROM private.app_update_publication WHERE singleton);
END; $$;
REVOKE ALL ON FUNCTION public.rpc_manager_app_update_read() FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.rpc_manager_app_update_read() TO authenticated;

CREATE FUNCTION public.rpc_manager_app_update_save(p_revision bigint,p_enabled boolean,p_release jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_user uuid; v_old private.app_update_publication%ROWTYPE; v_mirror jsonb;
 v_release jsonb; v_mirrors jsonb:='[]'; v_url text; v_label text; v_code bigint; v_bytes bigint;
BEGIN
 v_user:=private.require_master_manager();
 SELECT * INTO v_old FROM private.app_update_publication WHERE singleton FOR UPDATE;
 IF p_revision IS DISTINCT FROM v_old.revision THEN RAISE EXCEPTION 'APP_UPDATE_REVISION_CONFLICT'; END IF;
 IF p_enabled IS NULL THEN RAISE EXCEPTION 'APP_UPDATE_INVALID'; END IF;
 IF p_release IS NOT NULL THEN
  IF jsonb_typeof(p_release)<>'object'
   OR coalesce(p_release->>'versionCode','') !~ '^[1-9][0-9]{0,8}$'
   OR coalesce(p_release->>'bytes','') !~ '^[1-9][0-9]{0,8}$'
   OR length(btrim(coalesce(p_release->>'versionName',''))) NOT BETWEEN 1 AND 64
   OR coalesce(p_release->>'sha256','') !~ '^[a-fA-F0-9]{64}$'
   OR length(coalesce(p_release->>'notes',''))>1000
   OR jsonb_typeof(p_release->'mirrors') IS DISTINCT FROM 'array'
  THEN RAISE EXCEPTION 'APP_UPDATE_INVALID'; END IF;
  v_code:=(p_release->>'versionCode')::bigint; v_bytes:=(p_release->>'bytes')::bigint;
  IF v_bytes>268435456 OR jsonb_array_length(p_release->'mirrors') NOT BETWEEN 1 AND 5
   THEN RAISE EXCEPTION 'APP_UPDATE_INVALID'; END IF;
  IF v_old.release IS NOT NULL AND (v_code<(v_old.release->>'versionCode')::bigint
   OR (v_code=(v_old.release->>'versionCode')::bigint
     AND (lower(p_release->>'sha256')<>v_old.release->>'sha256'
       OR v_bytes<>(v_old.release->>'bytes')::bigint)))
   THEN RAISE EXCEPTION 'APP_UPDATE_VERSION_REQUIRED'; END IF;
  FOR v_mirror IN SELECT value FROM jsonb_array_elements(p_release->'mirrors') LOOP
   v_url:=btrim(coalesce(v_mirror->>'url','')); v_label:=btrim(coalesce(v_mirror->>'label',''));
   IF v_url !~ '^https://[A-Za-z0-9][A-Za-z0-9.-]*(:443)?(/|\?|$)'
    OR v_url ~ '[[:space:]\\#]' OR length(v_url)>2048 OR length(v_label) NOT BETWEEN 1 AND 80
    OR EXISTS(SELECT 1 FROM jsonb_array_elements(v_mirrors) x WHERE x->>'url'=v_url)
   THEN RAISE EXCEPTION 'APP_UPDATE_MIRROR_INVALID'; END IF;
   v_mirrors:=v_mirrors || jsonb_build_array(jsonb_build_object('label',v_label,'url',v_url));
  END LOOP;
  v_release:=jsonb_build_object('versionCode',v_code,'versionName',btrim(p_release->>'versionName'),
    'bytes',v_bytes,'sha256',lower(p_release->>'sha256'),'notes',coalesce(p_release->>'notes',''),
    'mirrors',v_mirrors,'packageId','com.xandeflix.prebuilt');
 ELSIF p_enabled THEN RAISE EXCEPTION 'APP_UPDATE_INVALID';
 END IF;
 UPDATE private.app_update_publication SET revision=revision+1,enabled=p_enabled,
  release=coalesce(v_release,v_old.release),updated_at=now() WHERE singleton;
 INSERT INTO public.commercial_audit_logs(manager_id,action,target_type,target_id,reason)
 VALUES(v_user,'APP_UPDATE_PUBLISHED','APP_UPDATE','ANDROID',
  'Publicação Android; código '||coalesce(v_code::text,'preservado')||'; ativa '||p_enabled::text);
 RETURN public.rpc_manager_app_update_read();
END; $$;
REVOKE ALL ON FUNCTION public.rpc_manager_app_update_save(bigint,boolean,jsonb) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.rpc_manager_app_update_save(bigint,boolean,jsonb) TO authenticated;
