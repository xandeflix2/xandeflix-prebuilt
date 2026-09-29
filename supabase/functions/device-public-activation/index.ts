import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.116.0";

type RecordValue = Record<string, unknown>;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

const SAFE_ERROR_CODES = new Set([
  "METHOD_NOT_ALLOWED",
  "INVALID_REQUEST",
  "DISPLAY_CODE_INVALID",
  "ACTIVATION_KEY_INVALID",
  "ACTIVATION_NOT_FOUND",
  "ACTIVATION_NOT_PENDING",
  "ACTIVATION_ALREADY_CONSUMED",
  "ACTIVATION_EXPIRED",
  "ACTIVATION_ATTEMPT_LIMIT_EXCEEDED",
  "INVALID_ACTIVATION_KEY",
  "SOURCE_DISPLAY_NAME_INVALID",
  "INVALID_M3U_PLAYLIST_URL",
  "INVALID_EPG_URL",
  "INVALID_SOURCE_CREDENTIALS",
  "ACTIVATION_SESSION_NOT_FOUND",
  "ACTIVATION_SESSION_NOT_OPEN",
  "ACTIVATION_SESSION_EXPIRED",
  "CUSTOMER_BOOTSTRAP_FAILED",
  "CUSTOMER_PROFILE_NOT_ACTIVE",
  "NO_ELIGIBLE_LICENSE",
  "TRIAL_EXPIRED",
  "LICENSE_DEVICE_LIMIT_REACHED",
  "DEVICE_REVOKED_REQUIRES_REACTIVATION",
  "SOURCE_ID_INVALID",
  "SOURCE_TYPE_NOT_ALLOWED",
  "SOURCE_ENVELOPE_INVALID",
  "PERMANENT_KEY_ENVELOPE_INVALID",
  "ACTIVATION_KEY_REGISTRATION_INVALID",
  "PERMANENT_KEY_REVOKED",
  "SERVICE_ROLE_REQUIRED",
  "INTERNAL_SANITIZED_ERROR",
]);

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_EPG_URL: "Informe uma URL EPG publica e valida.",
  INVALID_SOURCE_CREDENTIALS: "Informe usuario e senha juntos ou deixe os dois vazios.",
  METHOD_NOT_ALLOWED: "Método HTTP não permitido.",
  INVALID_REQUEST: "Dados de ativação inválidos.",
  DISPLAY_CODE_INVALID: "Código do dispositivo inválido.",
  ACTIVATION_KEY_INVALID: "Chave de ativação inválida.",
  ACTIVATION_NOT_FOUND: "Ativação não encontrada.",
  ACTIVATION_NOT_PENDING: "Esta ativação não está disponível.",
  ACTIVATION_ALREADY_CONSUMED: "Esta chave já foi utilizada.",
  ACTIVATION_EXPIRED: "A solicitação de ativação expirou.",
  ACTIVATION_ATTEMPT_LIMIT_EXCEEDED: "Limite de tentativas excedido.",
  INVALID_ACTIVATION_KEY: "Código ou chave incorretos.",
  SOURCE_DISPLAY_NAME_INVALID: "Informe um nome para a fonte.",
  INVALID_M3U_PLAYLIST_URL: "Informe uma URL M3U/M3U8 pública e válida.",
  ACTIVATION_SESSION_NOT_FOUND: "Sessão de ativação não encontrada.",
  ACTIVATION_SESSION_NOT_OPEN: "Sessão de ativação encerrada.",
  ACTIVATION_SESSION_EXPIRED: "A sessão de ativação expirou.",
  CUSTOMER_BOOTSTRAP_FAILED: "Não foi possível preparar a ativação de teste.",
  CUSTOMER_PROFILE_NOT_ACTIVE: "Perfil comercial indisponível.",
  NO_ELIGIBLE_LICENSE: "Não há período de teste disponível.",
  TRIAL_EXPIRED: "O período de teste expirou.",
  LICENSE_DEVICE_LIMIT_REACHED: "O limite de dispositivos foi atingido.",
  DEVICE_REVOKED_REQUIRES_REACTIVATION: "Este dispositivo precisa de reativação.",
  SOURCE_ID_INVALID: "Identificador da fonte inválido.",
  SOURCE_TYPE_NOT_ALLOWED: "Somente fontes M3U são aceitas nesta ativação.",
  SOURCE_ENVELOPE_INVALID: "Envelope seguro da fonte inválido.",
  INTERNAL_SANITIZED_ERROR: "Falha interna sanitizada na ativação.",
};

class ActivationError extends Error {
  readonly code: string;

  constructor(code: string) {
    super(code);
    this.name = "ActivationError";
    this.code = code;
  }
}

function isRecord(value: unknown): value is RecordValue {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function fail(code: string): never {
  throw new ActivationError(code);
}

function env(name: string): string {
  const value = Deno.env.get(name);
  if (!value) fail("INTERNAL_SANITIZED_ERROR");
  return value;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return bytesToHex(new Uint8Array(digest));
}

function randomHex(byteCount: number): string {
  return bytesToHex(crypto.getRandomValues(new Uint8Array(byteCount)));
}

function validateDisplayCode(value: unknown): string {
  if (typeof value !== "string") fail("DISPLAY_CODE_INVALID");
  const code = value.trim().toUpperCase();
  if (!/^XF-[0-9A-Z]{4}-[0-9A-Z]{4}$/.test(code)) fail("DISPLAY_CODE_INVALID");
  return code;
}

function validateActivationKey(value: unknown): string {
  if (typeof value !== "string") fail("ACTIVATION_KEY_INVALID");
  const key = value.trim();
  if (!/^[0-9]{6}$/.test(key)) fail("ACTIVATION_KEY_INVALID");
  return key;
}

function validateSessionToken(value: unknown): string {
  if (typeof value !== "string" || !/^[0-9a-f]{64}$/i.test(value.trim())) {
    fail("ACTIVATION_SESSION_NOT_FOUND");
  }
  return value.trim().toLowerCase();
}

function validateDisplayName(value: unknown): string {
  if (typeof value !== "string") fail("SOURCE_DISPLAY_NAME_INVALID");
  const name = value.trim();
  if (name.length < 1 || name.length > 100) fail("SOURCE_DISPLAY_NAME_INVALID");
  return name;
}

function validateM3uUrl(value: unknown, errorCode = "INVALID_M3U_PLAYLIST_URL"): string {
  if (typeof value !== "string" || value.trim().length === 0) fail(errorCode);
  try {
    const parsed = new URL(value.trim());
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") fail(errorCode);
    const host = parsed.hostname.toLowerCase();
    if (
      !host || host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0" ||
      host === "::1" || host.endsWith(".local") || host.endsWith(".internal") ||
      host.startsWith("10.") || host.startsWith("192.168.") ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host)
    ) fail(errorCode);
    return parsed.toString();
  } catch {
    fail(errorCode);
  }
}

function base64ToBytes(rawKey: string): Uint8Array {
  if (!rawKey || rawKey.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(rawKey)) {
    fail("INTERNAL_SANITIZED_ERROR");
  }
  try {
    return Uint8Array.from(atob(rawKey), (character) => character.charCodeAt(0));
  } catch {
    fail("INTERNAL_SANITIZED_ERROR");
  }
}

function validatePublicSourceType(value: unknown): "M3U" | "M3U8" {
  if (value === undefined || value === null || value === "M3U") return "M3U";
  if (value === "M3U8") return "M3U8";
  fail("SOURCE_TYPE_NOT_ALLOWED");
}

function validatePublicSourceConfig(body: RecordValue, sourceType: "M3U" | "M3U8"): RecordValue {
  const playlistUrl = validateM3uUrl(body.sourceUrl);
  const epgUrl = body.epgUrl === undefined || body.epgUrl === ""
    ? undefined
    : validateM3uUrl(body.epgUrl, "INVALID_EPG_URL");
  const username = body.username === undefined ? "" : body.username;
  const password = body.password === undefined ? "" : body.password;
  if (typeof username !== "string" || typeof password !== "string" ||
      (username.length === 0) !== (password.length === 0) ||
      username.length > 256 || password.length > 256) {
    fail("INVALID_SOURCE_CREDENTIALS");
  }
  return {
    playlistUrl,
    ...(epgUrl ? { epgUrl } : {}),
    ...(username ? { username, password } : {}),
    sourceType,
  };
}

async function encryptSourceConfig(sourceId: string, sourceType: "M3U" | "M3U8", sourceConfig: RecordValue): Promise<{
  ciphertext: string;
  nonce: string;
  authTag: string;
  keyVersion: string;
}> {
  const rawKey = Deno.env.get("SOURCE_VAULT_KEY_V1");
  if (!rawKey) fail("INTERNAL_SANITIZED_ERROR");
  const keyBytes = base64ToBytes(rawKey);
  if (keyBytes.byteLength !== 32) fail("INTERNAL_SANITIZED_ERROR");

  try {
    const key = await crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, ["encrypt"]);
    const nonce = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = new Uint8Array(await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: nonce,
        additionalData: new TextEncoder().encode(`${sourceId}\u00001\u0000${sourceType}`),
        tagLength: 128,
      },
      key,
      new TextEncoder().encode(JSON.stringify(sourceConfig)),
    ));
    if (encrypted.byteLength < 16) fail("INTERNAL_SANITIZED_ERROR");
    return {
      ciphertext: bytesToHex(encrypted.slice(0, -16)),
      nonce: bytesToHex(nonce),
      authTag: bytesToHex(encrypted.slice(-16)),
      keyVersion: "v1",
    };
  } catch (error) {
    if (error instanceof ActivationError) throw error;
    fail("INTERNAL_SANITIZED_ERROR");
  }
}

async function encryptPermanentKey(deviceId: string, displayCode: string, activationKey: string): Promise<{
  ciphertext: string;
  nonce: string;
  authTag: string;
  keyVersion: string;
}> {
  const rawKey = Deno.env.get("SOURCE_VAULT_KEY_V1");
  if (!rawKey) fail("INTERNAL_SANITIZED_ERROR");
  const keyBytes = base64ToBytes(rawKey);
  if (keyBytes.byteLength !== 32) fail("INTERNAL_SANITIZED_ERROR");

  try {
    const key = await crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, ["encrypt"]);
    const nonce = crypto.getRandomValues(new Uint8Array(12));
    const keyVersion = "v1";
    const aad = new TextEncoder().encode(`${deviceId}\u0000${displayCode}\u0000${keyVersion}`);
    const encrypted = new Uint8Array(await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: nonce, additionalData: aad, tagLength: 128 },
      key,
      new TextEncoder().encode(JSON.stringify({ activationKey })),
    ));
    if (encrypted.byteLength < 16) fail("INTERNAL_SANITIZED_ERROR");
    return {
      ciphertext: bytesToHex(encrypted.slice(0, -16)),
      nonce: bytesToHex(nonce),
      authTag: bytesToHex(encrypted.slice(-16)),
      keyVersion,
    };
  } catch (error) {
    if (error instanceof ActivationError) throw error;
    fail("INTERNAL_SANITIZED_ERROR");
  }
}

function response(body: RecordValue, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function safeErrorCode(error: unknown): string {
  if (error instanceof ActivationError && SAFE_ERROR_CODES.has(error.code)) return error.code;
  if (isRecord(error) && typeof error.code === "string") {
    if (error.code === "42501") return "SERVICE_ROLE_REQUIRED";
    if (error.code === "22P02") return "ACTIVATION_KEY_REGISTRATION_INVALID";
    if (error.code.startsWith("23")) return "PERMANENT_KEY_ENVELOPE_INVALID";
  }
  const message = error instanceof Error ? error.message : "";
  if (/permission denied|service_role_required/i.test(message)) return "SERVICE_ROLE_REQUIRED";
  if (/invalid input syntax for type uuid/i.test(message)) return "ACTIVATION_KEY_REGISTRATION_INVALID";
  if (/violates .*constraint|check constraint|unique constraint/i.test(message)) return "PERMANENT_KEY_ENVELOPE_INVALID";
  for (const code of SAFE_ERROR_CODES) if (message.includes(code)) return code;
  return "INTERNAL_SANITIZED_ERROR";
}

function statusFor(code: string): number {
  if (code === "METHOD_NOT_ALLOWED") return 405;
  if (code === "ACTIVATION_NOT_FOUND" || code === "ACTIVATION_NOT_PENDING" || code === "ACTIVATION_ALREADY_CONSUMED" || code === "ACTIVATION_SESSION_NOT_FOUND" || code === "ACTIVATION_SESSION_NOT_OPEN" || code === "ACTIVATION_SESSION_EXPIRED") return 403;
  if (code === "INTERNAL_SANITIZED_ERROR" || code === "CUSTOMER_BOOTSTRAP_FAILED") return 500;
  return 400;
}

async function createSupabase() {
  return createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));
}

async function startActivation(supabase: ReturnType<typeof createClient>, body: RecordValue): Promise<Response> {
  const displayCode = validateDisplayCode(body.displayCode);
  const activationKey = validateActivationKey(body.activationKey);
  const sessionToken = randomHex(32);
  const sessionTokenHash = await sha256Hex(sessionToken);
  const activationKeyHash = await sha256Hex(activationKey);

  const { data, error } = await supabase.rpc("rpc_public_start_device_activation", {
    p_display_code: displayCode,
    p_activation_key_hash: activationKeyHash,
    p_session_token_hash: sessionTokenHash,
  });
  if (error) throw new ActivationError(safeErrorCode(error));
  if (!isRecord(data)) fail("INTERNAL_SANITIZED_ERROR");
  if (data.success !== true) {
    const code = typeof data.code === "string" ? data.code : "INTERNAL_SANITIZED_ERROR";
    throw new ActivationError(code);
  }

  return response({
    success: true,
    sessionToken,
    sessionId: data.sessionId,
    displayCode: data.displayCode,
    expiresAt: data.expiresAt,
    sourceSetupAllowed: true,
  });
}

async function registerPermanentKey(supabase: ReturnType<typeof createClient>, body: RecordValue): Promise<Response> {
  const activationId = typeof body.activationId === "string" ? body.activationId.trim() : "";
  const deviceId = typeof body.deviceId === "string" ? body.deviceId.trim() : "";
  const displayCode = validateDisplayCode(body.displayCode);
  const activationKey = validateActivationKey(body.activationKey);
  if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(activationId) || !deviceId) {
    fail("ACTIVATION_KEY_REGISTRATION_INVALID");
  }

  const activationKeyHash = await sha256Hex(activationKey);
  const envelope = await encryptPermanentKey(deviceId, displayCode, activationKey);
  const { data, error } = await supabase.rpc("rpc_register_permanent_device_activation_key", {
    p_activation_id: activationId,
    p_device_id: deviceId,
    p_display_code: displayCode,
    p_activation_key_hash: activationKeyHash,
    p_ciphertext: envelope.ciphertext,
    p_nonce: envelope.nonce,
    p_auth_tag: envelope.authTag,
    p_key_version: envelope.keyVersion,
  });
  if (error) throw new ActivationError(safeErrorCode(error));
  if (!isRecord(data) || data.success !== true) {
    throw new ActivationError(typeof data?.code === "string" ? data.code : "INTERNAL_SANITIZED_ERROR");
  }
  return response({ success: true, status: "ACTIVE" });
}

async function completeActivation(supabase: ReturnType<typeof createClient>, body: RecordValue): Promise<Response> {
  const displayCode = validateDisplayCode(body.displayCode);
  const sessionToken = validateSessionToken(body.sessionToken);
  const displayName = validateDisplayName(body.sourceName);
  const sourceType = validatePublicSourceType(body.sourceType);
  const sourceConfig = validatePublicSourceConfig(body, sourceType);
  const sessionTokenHash = await sha256Hex(sessionToken);

  // Do not create an internal customer identity, encrypt a source, or accept
  // source setup unless the capability is still scoped to this device/code.
  const { data: preflight, error: preflightError } = await supabase.rpc(
    "rpc_public_check_device_activation_session",
    { p_session_token_hash: sessionTokenHash, p_display_code: displayCode },
  );
  if (preflightError || !isRecord(preflight) || preflight.success !== true) {
    throw new ActivationError(
      isRecord(preflight) && typeof preflight.code === "string" ? preflight.code : "ACTIVATION_SESSION_NOT_FOUND",
    );
  }

  const sourceId = `csrc_${randomHex(8)}`;
  const envelope = await encryptSourceConfig(sourceId, sourceType, sourceConfig);

  const existingCustomerId = typeof preflight.customerId === "string" ? preflight.customerId : null;
  let createdCustomerId: string | null = null;
  let customerId = existingCustomerId;
  if (!customerId) {
    const customerEmail = `activation-${randomHex(16)}@activation.invalid`;
    const customerPassword = randomHex(32);
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: customerEmail,
      password: customerPassword,
      email_confirm: true,
    });
    if (userError || !userData.user?.id) throw new ActivationError("CUSTOMER_BOOTSTRAP_FAILED");
    customerId = userData.user.id;
    createdCustomerId = customerId;
  }
  if (!customerId) throw new ActivationError("CUSTOMER_BOOTSTRAP_FAILED");
  const nickname = `trial-${displayCode.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${randomHex(4)}`.slice(0, 32);

  try {
    const { data, error } = await supabase.rpc("rpc_public_complete_device_activation", {
      p_session_token_hash: sessionTokenHash,
      p_display_code: displayCode,
      p_customer_id: customerId,
      p_customer_nickname: nickname,
      p_source_id: sourceId,
      p_source_type: sourceType,
      p_display_name: displayName,
      p_ciphertext: envelope.ciphertext,
      p_nonce: envelope.nonce,
      p_auth_tag: envelope.authTag,
      p_key_version: envelope.keyVersion,
    });
    if (error) throw new ActivationError(safeErrorCode(error));
    if (!isRecord(data) || data.success !== true) {
      throw new ActivationError(typeof data?.code === "string" ? data.code : "INTERNAL_SANITIZED_ERROR");
    }
    return response({
      success: true,
      status: data.status,
      deviceAuthorizationState: data.deviceAuthorizationState,
      licenseId: data.licenseId,
      sourceId: data.sourceId,
      trial: data.trial,
    });
  } catch (error) {
    // The account is an internal bootstrap identity. Remove it when the
    // atomic database operation did not consume the activation session.
    if (createdCustomerId) await supabase.auth.admin.deleteUser(createdCustomerId).catch(() => undefined);
    throw error;
  }
}

export async function handleDevicePublicActivation(request: Request): Promise<Response> {
  if (request.method !== "POST") throw new ActivationError("METHOD_NOT_ALLOWED");
  const body: unknown = await request.json();
  if (!isRecord(body)) throw new ActivationError("INVALID_REQUEST");
  const operation = body.operation;
  if (operation !== "START" && operation !== "COMPLETE" && operation !== "REGISTER_KEY") throw new ActivationError("INVALID_REQUEST");
  const supabase = await createSupabase();
  if (operation === "START") return startActivation(supabase, body);
  if (operation === "REGISTER_KEY") return registerPermanentKey(supabase, body);
  return completeActivation(supabase, body);
}

if (typeof Deno !== "undefined" && typeof Deno.serve === "function") {
  Deno.serve(async (request: Request) => {
    if (request.method === "OPTIONS") return new Response("ok", { status: 200, headers: corsHeaders });
    try {
      return await handleDevicePublicActivation(request);
    } catch (error) {
      const code = safeErrorCode(error);
      return response({ success: false, code, message: ERROR_MESSAGES[code] ?? ERROR_MESSAGES.INTERNAL_SANITIZED_ERROR }, statusFor(code));
    }
  });
}
