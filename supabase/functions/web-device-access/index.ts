import { createClient } from 'npm:@supabase/supabase-js@2.116.0';
import { equalVerifier, pinVerifier, protect, randomHex, sha256 } from './crypto.ts';

const origins = new Set(['https://xandeflix.vercel.app', 'https://xandeflix-prebuilt-nm3x.vercel.app', 'https://localhost', 'http://localhost:3000', 'http://localhost:4173']);
const denial = { success: false, code: 'ACCESS_DENIED', message: 'Não foi possível autorizar o acesso. Confira os dados ou tente mais tarde.' };
type Body = Record<string, unknown>;
const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
function text(value: unknown, max = 128): string { return typeof value === 'string' && value.length <= max ? value : ''; }
async function readBody(request: Request): Promise<Body> {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new Error('DENIED');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('DENIED');
  const parts: Uint8Array[] = []; let total = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read(); if (done) break;
      total += value.length;
      if (total > 4096) { await reader.cancel(); throw new Error('DENIED'); }
      parts.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(total); let offset = 0;
  for (const part of parts) { bytes.set(part, offset); offset += part.length; }
  const body = JSON.parse(new TextDecoder().decode(bytes));
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('DENIED');
  return body;
}

export async function handleWebDeviceAccess(request: Request): Promise<Response> {
  const origin = request.headers.get('origin');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json', 'Cache-Control': 'no-store',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Vary': 'Origin',
  };
  if (origin && origins.has(origin)) headers['Access-Control-Allow-Origin'] = origin;
  const respond = (body: unknown, status: number) => new Response(JSON.stringify(body), { headers, status });
  if (origin && !origins.has(origin)) return respond(denial, 403);
  if (request.method === 'OPTIONS') return new Response(null, { headers, status: 204 });
  if (request.method !== 'POST') return respond(denial, 405);
  try {
    const body = await readBody(request);
    const url = Deno.env.get('SUPABASE_URL') || '';
    const serverSecret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    if (!url || !anonKey || serverSecret.length < 32) return respond(denial, 503);
    const service = createClient(url, serverSecret, options);
    // Only hashes of bounded abuse buckets are persisted; never raw addresses.
    const ip = text(request.headers.get('x-forwarded-for')?.split(',').at(-1)?.trim(), 256) || 'unknown';
    for (const [bucket, limit] of [['global', 1200], ['ip:' + ip, 120]] as const) {
      const result = await service.rpc('rpc_web_auth_rate_limit', { p_bucket_hash: await protect(bucket, serverSecret, 'rate'), p_limit: limit });
      if (result.error || result.data !== true) return respond(denial, 429);
    }
    const operation = text(body.operation, 32), pin = text(body.pin, 6);
    if (!/^\d{6}$/.test(pin)) return respond(denial, 403);
    if (operation === 'LOGIN') {
      const code = text(body.displayCode, 12).trim().toUpperCase(), accessKey = text(body.accessKey, 6);
      if (!/^XF-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code) || !/^\d{6}$/.test(accessKey)) return respond(denial, 403);
      const rate = await service.rpc('rpc_web_auth_rate_limit', { p_bucket_hash: await protect('code:' + code, serverSecret, 'rate'), p_limit: 30 });
      if (rate.error || rate.data !== true) return respond(denial, 429);
      const challenge = await service.rpc('rpc_web_begin_login', { p_display_code: code, p_key_hash: await sha256(accessKey) });
      const record = !challenge.error && challenge.data?.success === true ? challenge.data : undefined;
      const computed = await pinVerifier(pin, record?.salt || '00000000000000000000000000000000', serverSecret);
      if (!record) return respond(denial, 403);
      const token = 'xw1_' + randomHex(32);
      const result = await service.rpc('rpc_web_finish_login', {
        p_challenge_id: record.challengeId, p_verified: equalVerifier(computed, record.verifier), p_token_hash: await sha256(token),
      });
      if (result.error || result.data?.success !== true) return respond(denial, 403);
      const context = await service.rpc('rpc_web_session_context', { p_session_token: token });
      if (context.error || context.data?.success !== true) return respond(denial, 403);
      return respond({ ...context.data, sessionToken: token }, 200);
    }
    const deviceId = text(body.deviceId);
    if (!deviceId) return respond(denial, 403);
    if (operation === 'SET_PIN') {
      const authorization = request.headers.get('authorization') || '';
      if (!authorization.startsWith('Bearer ')) return respond(denial, 403);
      const user = await service.auth.getUser(authorization.slice(7));
      if (user.error || !user.data.user) return respond(denial, 403);
      const manager = createClient(url, anonKey, { ...options, global: { headers: { Authorization: authorization } } });
      const scope = await manager.rpc('rpc_web_can_manage_device', { p_device_id: deviceId });
      if (scope.error || scope.data !== true) return respond(denial, 403);
      const salt = randomHex(16), verifier = await pinVerifier(pin, salt, serverSecret);
      const result = await manager.rpc('rpc_manager_set_web_pin', { p_device_id: deviceId, p_salt: salt, p_verifier: verifier });
      return result.error || result.data?.success !== true ? respond(denial, 403) : respond({ success: true }, 200);
    }
    if (operation === 'ENROLL_PIN') {
      const deviceToken = text(body.deviceAuthToken, 256);
      if (!deviceToken || deviceToken.startsWith('xw1_')) return respond(denial, 403);
      const tokenHash = await sha256(deviceToken);
      const state = await service.rpc('rpc_web_enrollment_state', { p_device_id: deviceId, p_native_token_hash: tokenHash });
      if (state.error || state.data?.success !== true) return respond(denial, 403);
      const verified = !state.data.version || equalVerifier(await pinVerifier(pin, state.data.salt, serverSecret), state.data.verifier);
      const salt = randomHex(16), verifier = await pinVerifier(pin, salt, serverSecret);
      const result = await service.rpc('rpc_web_enroll_pin', {
        p_device_id: deviceId, p_native_token_hash: tokenHash, p_expected_version: state.data.version,
        p_salt: salt, p_verifier: verifier, p_verified: verified,
      });
      return result.error || result.data?.success !== true ? respond(denial, 403) : respond({ success: true }, 200);
    }
    return respond(denial, 403);
  } catch { return respond(denial, 503); }
}
if (typeof Deno !== 'undefined') Deno.serve(handleWebDeviceAccess);
