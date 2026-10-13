-- C74. Pre-auth handoff proves possession of the existing A1 status capability.
-- No key/token plaintext or source/catalog data is stored in notifications.
CREATE SCHEMA activation_handoff_private;
REVOKE ALL ON SCHEMA activation_handoff_private FROM PUBLIC,anon,authenticated;
GRANT USAGE ON SCHEMA activation_handoff_private TO anon,authenticated,service_role;
CREATE TABLE activation_handoff_private.routing (
  manager_id UUID PRIMARY KEY REFERENCES public.manager_admins(user_id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE CHECK(code ~ '^[A-F0-9]{8}$')
);
CREATE TABLE activation_handoff_private.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activation_id UUID NOT NULL UNIQUE REFERENCES public.device_activation_requests(activation_id) ON DELETE CASCADE,
  recipient_manager_id UUID REFERENCES public.manager_admins(user_id) ON DELETE CASCADE,
  nickname TEXT NOT NULL CHECK(length(nickname) BETWEEN 2 AND 80),
  platform TEXT NOT NULL CHECK(platform IN ('ANDROID_TV','FIRE_TV','TIZEN','WEBOS')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now()+interval '7 days'
);
CREATE INDEX ON activation_handoff_private.notifications(recipient_manager_id,created_at DESC,id DESC);
CREATE TABLE activation_handoff_private.receipts (
  notification_id UUID NOT NULL REFERENCES activation_handoff_private.notifications(id) ON DELETE CASCADE,
  manager_id UUID NOT NULL REFERENCES public.manager_admins(user_id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT now(), opened_at TIMESTAMPTZ,
  PRIMARY KEY(notification_id,manager_id)
);
ALTER TABLE activation_handoff_private.routing ENABLE ROW LEVEL SECURITY;
ALTER TABLE activation_handoff_private.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activation_handoff_private.receipts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA activation_handoff_private FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION activation_handoff_private.can_view(p_manager UUID,p_id UUID) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM activation_handoff_private.notifications n
 JOIN public.device_activation_requests a ON a.activation_id=n.activation_id
 JOIN public.manager_admins m ON m.user_id=p_manager AND m.status='ACTIVE'
 WHERE n.id=p_id AND (m.role='OWNER' OR (m.role='ADMIN' AND
   (n.recipient_manager_id=p_manager OR EXISTS(
     SELECT 1 FROM public.license_devices ld JOIN public.licenses l ON l.id=ld.license_id
     JOIN private.manager_customer_ownership o ON o.customer_id=coalesce(l.customer_account_id,l.customer_id)
     WHERE ld.device_id=a.device_id AND o.manager_id=p_manager))
   AND NOT EXISTS(SELECT 1 FROM public.license_devices ld JOIN public.licenses l ON l.id=ld.license_id
     LEFT JOIN private.manager_customer_ownership o ON o.customer_id=coalesce(l.customer_account_id,l.customer_id)
     WHERE ld.device_id=a.device_id AND o.manager_id IS DISTINCT FROM p_manager))));
$$;
CREATE FUNCTION activation_handoff_private.valid_pending(p_id UUID) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM activation_handoff_private.notifications n
 JOIN public.device_activation_requests a ON a.activation_id=n.activation_id
 JOIN private.device_activation_key_vault k ON k.device_id=a.device_id
 WHERE n.id=p_id AND n.expires_at>now() AND a.status='PENDING' AND k.key_status='ACTIVE'
 AND k.activation_key_hash=a.activation_key_hash AND k.display_code=a.display_code);
$$;
CREATE FUNCTION activation_handoff_private.routing_code() RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_manager UUID; v_code TEXT;
BEGIN
 v_manager:=private.require_active_manager();
 -- Serialize lazy initialization for this manager only. Routing is not authority.
 PERFORM pg_advisory_xact_lock(hashtextextended('activation-routing:'||v_manager::text,0));
 SELECT code INTO v_code FROM activation_handoff_private.routing WHERE manager_id=v_manager;
 IF v_code IS NULL THEN
   LOOP
    v_code:=upper(encode(extensions.gen_random_bytes(4),'hex'));
    BEGIN INSERT INTO activation_handoff_private.routing(manager_id,code) VALUES(v_manager,v_code); EXIT;
    EXCEPTION WHEN unique_violation THEN NULL; END;
   END LOOP;
 END IF;
 RETURN jsonb_build_object('success',true,'code',v_code);
END;
$$;
CREATE FUNCTION activation_handoff_private.submit(p_activation_id UUID,p_device_id TEXT,p_status_secret TEXT,p_nickname TEXT,p_platform TEXT,p_manager_code TEXT) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE a public.device_activation_requests%ROWTYPE; n activation_handoff_private.notifications%ROWTYPE; v_recipient UUID; v_name TEXT:=btrim(p_nickname);
BEGIN
 IF p_activation_id IS NULL OR p_device_id IS NULL OR length(p_device_id) NOT BETWEEN 1 AND 64
 OR p_status_secret IS NULL OR length(p_status_secret) NOT BETWEEN 16 AND 512
 OR v_name IS NULL OR length(v_name) NOT BETWEEN 2 AND 80 OR v_name ~ '[[:cntrl:]<>]' OR v_name ~* 'https?:|www\.'
 OR p_platform IS NULL OR p_platform NOT IN ('ANDROID_TV','FIRE_TV','TIZEN','WEBOS') THEN
  RETURN jsonb_build_object('success',false,'code','HANDOFF_UNAVAILABLE'); END IF;
 SELECT * INTO a FROM public.device_activation_requests WHERE activation_id=p_activation_id AND device_id=p_device_id FOR UPDATE;
 IF NOT FOUND OR a.status<>'PENDING' OR a.activation_status_secret_hash IS DISTINCT FROM encode(extensions.digest(p_status_secret,'sha256'),'hex')
 OR NOT EXISTS(SELECT 1 FROM private.device_activation_key_vault k WHERE k.device_id=a.device_id AND k.display_code=a.display_code
  AND k.key_status='ACTIVE' AND k.activation_key_hash=a.activation_key_hash) THEN
  RETURN jsonb_build_object('success',false,'code','HANDOFF_UNAVAILABLE'); END IF;
 IF nullif(btrim(p_manager_code),'') IS NOT NULL THEN
  SELECT r.manager_id INTO v_recipient FROM activation_handoff_private.routing r JOIN public.manager_admins m ON m.user_id=r.manager_id
  WHERE r.code=upper(btrim(p_manager_code)) AND m.status='ACTIVE' AND m.role IN ('ADMIN','OWNER');
  IF v_recipient IS NULL THEN RETURN jsonb_build_object('success',false,'code','HANDOFF_ROUTING_INVALID'); END IF;
  IF EXISTS(SELECT 1 FROM public.manager_admins m WHERE m.user_id=v_recipient AND m.role='ADMIN')
   AND EXISTS(SELECT 1 FROM public.license_devices ld JOIN public.licenses l ON l.id=ld.license_id
    LEFT JOIN private.manager_customer_ownership o ON o.customer_id=coalesce(l.customer_account_id,l.customer_id)
    WHERE ld.device_id=a.device_id AND o.manager_id IS DISTINCT FROM v_recipient) THEN
   RETURN jsonb_build_object('success',false,'code','HANDOFF_ROUTING_INVALID'); END IF;
 END IF;
 SELECT * INTO n FROM activation_handoff_private.notifications WHERE activation_id=a.activation_id;
 IF FOUND THEN
  IF n.expires_at<=now() THEN RETURN jsonb_build_object('success',false,'code','HANDOFF_EXPIRED'); END IF;
  IF n.nickname<>v_name OR n.platform<>p_platform OR n.recipient_manager_id IS DISTINCT FROM v_recipient THEN
   RETURN jsonb_build_object('success',false,'code','HANDOFF_UNAVAILABLE'); END IF;
  RETURN jsonb_build_object('success',true,'notificationId',n.id);
 END IF;
 IF (SELECT count(*) FROM activation_handoff_private.notifications n2 JOIN public.device_activation_requests a2 ON a2.activation_id=n2.activation_id
   WHERE a2.device_id=a.device_id AND n2.created_at>now()-interval '1 hour')>=5 THEN
  RETURN jsonb_build_object('success',false,'code','HANDOFF_RATE_LIMIT'); END IF;
 INSERT INTO activation_handoff_private.notifications(activation_id,recipient_manager_id,nickname,platform)
  VALUES(a.activation_id,v_recipient,v_name,p_platform) RETURNING * INTO n;
 -- Administrative metadata of this pending request only; never rewrite a device identity.
 UPDATE public.device_activation_requests SET device_type='TV',device_label=v_name WHERE activation_id=a.activation_id;
 RETURN jsonb_build_object('success',true,'notificationId',n.id);
END;
$$;
CREATE FUNCTION activation_handoff_private.inbox(p_before_id UUID) RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE v_manager UUID; v_before TIMESTAMPTZ; v_count BIGINT; v_items JSONB; v_more BOOLEAN;
BEGIN
 v_manager:=private.require_active_manager();
 IF p_before_id IS NOT NULL THEN
  SELECT created_at INTO v_before FROM activation_handoff_private.notifications WHERE id=p_before_id AND activation_handoff_private.can_view(v_manager,id);
  IF NOT FOUND THEN RETURN jsonb_build_object('success',false,'code','HANDOFF_UNAVAILABLE'); END IF;
 END IF;
 SELECT count(*) INTO v_count FROM activation_handoff_private.notifications n WHERE activation_handoff_private.can_view(v_manager,n.id)
  AND activation_handoff_private.valid_pending(n.id) AND NOT EXISTS(SELECT 1 FROM activation_handoff_private.receipts r WHERE r.notification_id=n.id AND r.manager_id=v_manager);
 WITH page AS(SELECT n.* FROM activation_handoff_private.notifications n WHERE activation_handoff_private.can_view(v_manager,n.id)
  AND (p_before_id IS NULL OR (n.created_at,n.id)<(v_before,p_before_id)) ORDER BY n.created_at DESC,n.id DESC LIMIT 51),
 shown AS(SELECT * FROM page ORDER BY created_at DESC,id DESC LIMIT 50)
 SELECT (SELECT count(*)>50 FROM page),coalesce(jsonb_agg(jsonb_build_object('id',n.id,'displayCode',a.display_code,'nickname',n.nickname,'platform',n.platform,
  'receivedAt',n.created_at,'available',activation_handoff_private.valid_pending(n.id),'read',EXISTS(SELECT 1 FROM activation_handoff_private.receipts r WHERE r.notification_id=n.id AND r.manager_id=v_manager)) ORDER BY n.created_at DESC,n.id DESC),'[]'::jsonb)
 INTO v_more,v_items FROM shown n JOIN public.device_activation_requests a ON a.activation_id=n.activation_id;
 RETURN jsonb_build_object('success',true,'unreadCount',v_count,'notifications',v_items,'hasMore',v_more);
END;
$$;
CREATE FUNCTION activation_handoff_private.open_notification(p_notification_id UUID) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_manager UUID; n activation_handoff_private.notifications%ROWTYPE; a public.device_activation_requests%ROWTYPE;
BEGIN
 v_manager:=private.require_active_manager();
 IF NOT activation_handoff_private.can_view(v_manager,p_notification_id) THEN RETURN jsonb_build_object('success',false,'code','HANDOFF_UNAVAILABLE'); END IF;
 SELECT * INTO n FROM activation_handoff_private.notifications WHERE id=p_notification_id;
 SELECT * INTO a FROM public.device_activation_requests WHERE activation_id=n.activation_id FOR UPDATE;
 IF NOT activation_handoff_private.valid_pending(n.id) THEN RETURN jsonb_build_object('success',false,'code','HANDOFF_EXPIRED'); END IF;
 INSERT INTO activation_handoff_private.receipts(notification_id,manager_id,opened_at) VALUES(n.id,v_manager,now())
  ON CONFLICT(notification_id,manager_id) DO UPDATE SET opened_at=now();
 RETURN jsonb_build_object('success',true,'id',n.id,'displayCode',a.display_code,'nickname',n.nickname,'platform',n.platform,'expiresAt',now()+interval '15 minutes');
END;
$$;
-- Only the authenticated Edge runtime can resolve the hash. Never expose it to
-- a browser or anonymous RPC; a six-digit key hash is brute-forceable.
CREATE FUNCTION activation_handoff_private.resolve_hash(p_manager_id UUID,p_notification_id UUID,p_display_code TEXT) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_hash TEXT;
BEGIN
 IF NOT activation_handoff_private.can_view(p_manager_id,p_notification_id) OR NOT activation_handoff_private.valid_pending(p_notification_id)
 OR NOT EXISTS(SELECT 1 FROM activation_handoff_private.receipts WHERE notification_id=p_notification_id AND manager_id=p_manager_id AND opened_at>now()-interval '15 minutes') THEN
  RETURN jsonb_build_object('success',false,'code','HANDOFF_EXPIRED'); END IF;
 SELECT a.activation_key_hash INTO v_hash FROM activation_handoff_private.notifications n JOIN public.device_activation_requests a ON a.activation_id=n.activation_id
  WHERE n.id=p_notification_id AND a.display_code=p_display_code FOR UPDATE OF a;
 IF v_hash IS NULL THEN RETURN jsonb_build_object('success',false,'code','HANDOFF_EXPIRED'); END IF;
 RETURN jsonb_build_object('success',true,'activationKeyHash',v_hash);
END;
$$;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA activation_handoff_private FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION activation_handoff_private.submit(UUID,TEXT,TEXT,TEXT,TEXT,TEXT) TO anon,authenticated;
GRANT EXECUTE ON FUNCTION activation_handoff_private.routing_code(),activation_handoff_private.inbox(UUID),activation_handoff_private.open_notification(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION activation_handoff_private.resolve_hash(UUID,UUID,TEXT) TO service_role;
CREATE FUNCTION public.rpc_device_send_activation_notification(p_activation_id UUID,p_device_id TEXT,p_status_secret TEXT,p_nickname TEXT,p_platform TEXT,p_manager_code TEXT DEFAULT NULL) RETURNS JSONB
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT activation_handoff_private.submit(p_activation_id,p_device_id,p_status_secret,p_nickname,p_platform,p_manager_code); $$;
CREATE FUNCTION public.rpc_manager_activation_routing_code() RETURNS JSONB
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT activation_handoff_private.routing_code(); $$;
CREATE FUNCTION public.rpc_manager_activation_notifications(p_before_id UUID DEFAULT NULL) RETURNS JSONB
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$ SELECT activation_handoff_private.inbox(p_before_id); $$;
CREATE FUNCTION public.rpc_manager_open_activation_notification(p_notification_id UUID) RETURNS JSONB
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT activation_handoff_private.open_notification(p_notification_id); $$;
CREATE FUNCTION public.rpc_service_activation_notification_hash(p_manager_id UUID,p_notification_id UUID,p_display_code TEXT) RETURNS JSONB
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT activation_handoff_private.resolve_hash(p_manager_id,p_notification_id,p_display_code); $$;
REVOKE ALL ON FUNCTION public.rpc_device_send_activation_notification(UUID,TEXT,TEXT,TEXT,TEXT,TEXT),public.rpc_manager_activation_routing_code(),public.rpc_manager_activation_notifications(UUID),public.rpc_manager_open_activation_notification(UUID),public.rpc_service_activation_notification_hash(UUID,UUID,TEXT) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.rpc_device_send_activation_notification(UUID,TEXT,TEXT,TEXT,TEXT,TEXT) TO anon,authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_manager_activation_routing_code(),public.rpc_manager_activation_notifications(UUID),public.rpc_manager_open_activation_notification(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_service_activation_notification_hash(UUID,UUID,TEXT) TO service_role;
NOTIFY pgrst,'reload schema';
