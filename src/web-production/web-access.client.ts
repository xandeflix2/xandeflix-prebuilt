import { getSupabaseRuntimeConfig } from '../integrations/supabase/runtime-config.ts';
export const WEB_ACCESS_ERROR = 'Não foi possível autorizar o acesso. Confira os dados ou tente mais tarde.';
function configuration(): { url: string; publishableKey: string } {
  const config = getSupabaseRuntimeConfig();
  if (!config || config.url.replace(/\/$/, '') !== 'https://cujbmyhitgomlgwfkaat.supabase.co' || !config.key.startsWith('sb_publishable_')) throw new Error(WEB_ACCESS_ERROR);
  return { url: config.url.replace(/\/$/, ''), publishableKey: config.key };
}
async function post(path: string, body: Record<string, unknown>, authorization?: string, keepalive = false): Promise<Record<string, unknown>> {
  const config = configuration();
  const abort = new AbortController(), timer = setTimeout(() => abort.abort(), 15000);
  try {
    const response = await fetch(config.url + path, {
      method: 'POST', credentials: 'omit', cache: 'no-store', keepalive, signal: keepalive ? undefined : abort.signal,
      headers: { 'Content-Type': 'application/json', apikey: config.publishableKey, ...(authorization ? { Authorization: `Bearer ${authorization}` } : {}) },
      body: JSON.stringify(body),
    });
    const result: unknown = await response.json();
    if (!response.ok || !result || typeof result !== 'object' || (result as { success?: boolean }).success !== true) throw new Error(WEB_ACCESS_ERROR);
    return result as Record<string, unknown>;
  } catch { throw new Error(WEB_ACCESS_ERROR); } finally { clearTimeout(timer); }
}
export function webAccessRequest(operation: 'LOGIN' | 'SET_PIN' | 'ENROLL_PIN', fields: Record<string, unknown>, authorization?: string) {
  return post('/functions/v1/web-device-access', { ...fields, operation }, authorization);
}
export function webSessionRequest(operation: 'rpc_web_session_context' | 'rpc_web_logout', token: string, keepalive = false) {
  return post('/rest/v1/rpc/' + operation, { p_session_token: token }, undefined, keepalive);
}
