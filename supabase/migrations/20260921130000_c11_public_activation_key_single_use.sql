-- C11 forward-only hardening: a consumed activation key hash cannot be used
-- to create another activation request for the same device.

CREATE UNIQUE INDEX IF NOT EXISTS uq_device_activation_consumed_key_single_use
    ON public.device_activation_requests(device_id, activation_key_hash)
    WHERE status = 'CONSUMED';
