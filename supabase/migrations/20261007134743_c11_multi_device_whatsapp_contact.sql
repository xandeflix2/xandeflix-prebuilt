-- C11: separate published contact; legacy settings and activation authority unchanged.
CREATE SCHEMA IF NOT EXISTS activation_contact_private;
REVOKE ALL ON SCHEMA activation_contact_private FROM PUBLIC;
GRANT USAGE ON SCHEMA activation_contact_private TO anon, authenticated;

-- This intentionally anonymous helper reads only one published administrative key.
-- No device/license/source data and no fallback to the seeded example support number.
CREATE FUNCTION activation_contact_private.get_published_contact()
RETURNS JSONB LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT jsonb_build_object('success', true, 'whatsapp', COALESCE((
    SELECT CASE WHEN value ~ '^[1-9][0-9]{7,14}$' THEN value ELSE '' END
    FROM public.control_plane_settings WHERE key = 'multi_device_whatsapp'
  ), ''));
$$;

CREATE FUNCTION activation_contact_private.get_master_contact()
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  PERFORM private.require_master_manager();
  RETURN activation_contact_private.get_published_contact();
END;
$$;

CREATE FUNCTION activation_contact_private.set_master_contact(p_whatsapp TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_number TEXT := btrim(COALESCE(p_whatsapp, ''));
BEGIN
  PERFORM private.require_master_manager();
  IF v_number <> '' AND v_number !~ '^[1-9][0-9]{7,14}$' THEN
    RAISE EXCEPTION 'INVALID_WHATSAPP' USING ERRCODE = '22023';
  END IF;
  INSERT INTO public.control_plane_settings(key, value, description, updated_at)
  VALUES ('multi_device_whatsapp', v_number, 'Contato público para múltiplos dispositivos, configurado por master', now())
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at;
  RETURN activation_contact_private.get_published_contact();
END;
$$;

REVOKE ALL ON FUNCTION activation_contact_private.get_published_contact() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION activation_contact_private.get_master_contact() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION activation_contact_private.set_master_contact(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION activation_contact_private.get_published_contact() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION activation_contact_private.get_master_contact() TO authenticated;
GRANT EXECUTE ON FUNCTION activation_contact_private.set_master_contact(TEXT) TO authenticated;

CREATE FUNCTION public.rpc_public_get_multi_device_contact()
RETURNS JSONB LANGUAGE sql STABLE SECURITY INVOKER SET search_path = ''
AS $$ SELECT activation_contact_private.get_published_contact(); $$;
CREATE FUNCTION public.rpc_manager_get_multi_device_contact()
RETURNS JSONB LANGUAGE sql STABLE SECURITY INVOKER SET search_path = ''
AS $$ SELECT activation_contact_private.get_master_contact(); $$;
CREATE FUNCTION public.rpc_manager_set_multi_device_contact(p_whatsapp TEXT)
RETURNS JSONB LANGUAGE sql SECURITY INVOKER SET search_path = ''
AS $$ SELECT activation_contact_private.set_master_contact(p_whatsapp); $$;

REVOKE ALL ON FUNCTION public.rpc_public_get_multi_device_contact() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.rpc_manager_get_multi_device_contact() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.rpc_manager_set_multi_device_contact(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_public_get_multi_device_contact() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_manager_get_multi_device_contact() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_manager_set_multi_device_contact(TEXT) TO authenticated;
NOTIFY pgrst, 'reload schema';
