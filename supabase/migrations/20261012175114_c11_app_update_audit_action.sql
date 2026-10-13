-- C90: retain every existing audit enum and add software publication only.
ALTER TABLE public.commercial_audit_logs DROP CONSTRAINT commercial_audit_logs_action_check;
ALTER TABLE public.commercial_audit_logs ADD CONSTRAINT commercial_audit_logs_action_check CHECK(action IN (
 'CUSTOMER_STATUS_CHANGED','LICENSE_LIMITS_CHANGED','LICENSE_SUSPENDED','LICENSE_REVOKED',
 'LICENSE_MANUALLY_ACTIVATED','LICENSE_RENEWED','DEVICE_PERMANENTLY_DELETED',
 'CUSTOMER_ADMIN_ASSIGNED','ADDITIONAL_DEVICE_APPROVED','LICENSE_SOURCE_REPLACED',
 'LICENSE_DEVICE_UPDATED','CUSTOMER_PERMANENTLY_DELETED','APP_UPDATE_PUBLISHED'));
ALTER TABLE public.commercial_audit_logs DROP CONSTRAINT commercial_audit_logs_target_type_check;
ALTER TABLE public.commercial_audit_logs ADD CONSTRAINT commercial_audit_logs_target_type_check
 CHECK(target_type IN ('CUSTOMER','LICENSE','DEVICE','APP_UPDATE'));
