import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.116.0";

type Protocol = "M3U" | "XTREAM";
type RecordValue = Record<string, unknown>;
type ErrorStage =
  | "AUTH"
  | "MANAGER_AUTHORIZATION"
  | "REQUEST_VALIDATION"
  | "VAULT_KEY"
  | "VAULT_ENCRYPT"
  | "RPC"
  | "POST_WRITE_RESPONSE"
  | "INTERNAL";

const KEY_VERSION = "v1";
const KEY_ENV_NAME = "SOURCE_VAULT_KEY_V1";
const SOURCE_ID_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
const M3U_KEYS = new Set(["playlistUrl", "token", "runtimeOptions"]);
const XTREAM_KEYS = new Set(["endpoint", "username", "password", "token", "runtimeOptions"]);
const SAFE_ERROR_CODES = new Set([
  "LICENSE_EDITOR_CONFLICT", "INVALID_CUSTOMER_NAME", "CUSTOMER_NAME_CONFLICT", "CUSTOMER_PROFILE_NAME_INVALID", "CUSTOMER_NAME_ALREADY_USED", "INVALID_DEVICE_PLATFORM", "INVALID_DEVICE_TYPE", "INVALID_DEVICE_SLOT", "DEVICE_SLOT_OCCUPIED", "DEVICE_SLOT_OUTSIDE_LIMIT", "PRIMARY_SLOT_READ_ONLY", "DEVICE_ROLE_CONFIRMATION_REQUIRED", "DEVICE_TREE_CONFIRMATION_REQUIRED", "DEVICE_TREE_CHANGED",
  "PRINCIPAL_REQUIRED", "PRIMARY_CANNOT_BECOME_SECONDARY", "LICENSE_EDIT_REQUIRED", "EXTRA_SCREENS_PAYMENT_REQUIRED", "PAYMENT_REFERENCE_INVALID", "INVALID_PAID_EXTRA_SCREENS", "SCREEN_CHANGE_REASON_REQUIRED", "USE_ACTIVATION_SUBMENU",
  "PRIMARY_HAS_SECONDARIES", "REGISTERED_DEVICE_REQUIRED", "LICENSE_DEVICE_LIMIT_REACHED",
  "INVALID_DEVICE_ROLE", "PRIMARY_DEVICE_REQUIRED", "PRIMARY_DEVICE_INVALID", "DEVICE_ROLE_CONFLICT",
  "INVALID_MAX_DEVICES", "INVALID_MAX_CONCURRENT_SESSIONS", "CONCURRENT_LIMIT_EXCEEDS_DEVICES", "CANNOT_REDUCE_BELOW_ACTIVE_DEVICES",
  "CUSTOMER_SHARED_IDENTITY", "CUSTOMER_DELETE_CONFIRMATION_REQUIRED", "MANAGER_SCOPE_DENIED",
  "INVALID_DEVICE_LABEL", "CROSS_CUSTOMER_BINDING_DENIED",
  "HANDOFF_EXPIRED",
  "METHOD_NOT_ALLOWED",
  "MANAGER_AUTH_REQUIRED",
  "MANAGER_NOT_AUTHORIZED",
  "AUTH_REQUIRED",
  "VAULT_KEY_MISSING",
  "VAULT_KEY_INVALID",
  "VAULT_ENCRYPT_FAILED",
  "RPC_FAILED",
  "DATABASE_PERMISSION_DENIED",
  "INVALID_REQUEST",
  "INTERNAL_SANITIZED_ERROR",
  "VAULT_RUNTIME_NOT_CONFIGURED",
  "INVALID_CANONICAL_SOURCE_ID",
  "INVALID_SOURCE_NAME",
  "INVALID_SOURCE_PROTOCOL",
  "INVALID_EXPECTED_VERSION",
  "INVALID_SOURCE_CONFIG",
  "INVALID_SOURCE_CONFIG_FIELDS",
  "INVALID_M3U_PLAYLIST_URL",
  "INVALID_XTREAM_ENDPOINT",
  "INVALID_XTREAM_USERNAME",
  "INVALID_XTREAM_PASSWORD",
  "INVALID_SOURCE_TOKEN",
  "INVALID_SOURCE_RUNTIME_OPTIONS",
  "INVALID_VAULT_CIPHERTEXT",
  "INVALID_VAULT_NONCE",
  "INVALID_VAULT_AUTH_TAG",
  "INVALID_VAULT_KEY_VERSION",
  "DISPLAY_CODE_INVALID",
  "ACTIVATION_KEY_INVALID",
  "INVALID_ACTIVATION_KEY",
  "PERMANENT_KEY_REVOKED",
  "ACTIVATION_NOT_FOUND",
  "ACTIVATION_DEVICE_MISMATCH",
  "LICENSE_NOT_FOUND",
  "LICENSE_ID_REQUIRED",
  "LICENSE_NOT_ACTIVE",
  "LICENSE_EXPIRED",
  "TRIAL_EXPIRED",
  "LICENSE_MODE_INVALID",
  "LICENSE_DEVICE_LIMIT_REACHED",
  "DEVICE_REVOKED_REQUIRES_REACTIVATION",
  "SOURCE_TYPE_NOT_ALLOWED",
  "SOURCE_DISPLAY_NAME_INVALID",
  "SOURCE_ENVELOPE_INVALID",
  "SOURCE_ALREADY_EXISTS",
  "SOURCE_NOT_FOUND",
  "SOURCE_PROTOCOL_MISMATCH",
  "VERSION_CONFLICT",
  "EXISTING_DEVICE_CODE_REQUIRED",
  "EXISTING_DEVICE_NOT_FOUND",
  "EXISTING_DEVICE_CUSTOMER_MISMATCH",
  "CUSTOMER_ID_REQUIRED",
  "CUSTOMER_NAME_REQUIRED",
  "CUSTOMER_PROFILE_NOT_FOUND",
  "CUSTOMER_PROFILE_NOT_ACTIVE",
  "CUSTOMER_HAS_NO_ACTIVE_SOURCE",
  "CUSTOMER_SOURCE_AMBIGUOUS",
  "NO_ELIGIBLE_MANAGED_LICENSE",
  "MANAGED_LICENSE_CAPACITY_EXHAUSTED",
  "MANAGED_LICENSE_AMBIGUOUS",
  "CUSTOMER_ACCOUNT_NOT_FOUND",
  "CUSTOMER_ACCOUNT_NOT_ACTIVE",
  "CROSS_CUSTOMER_BINDING_DENIED",
  "SOURCE_CONFIG_REQUIRED",
  "INVALID_CUSTOMER_ID",
  "INVALID_FLOW_MODE",
]);

const ERROR_MESSAGES: Record<string, string> = {
  HANDOFF_EXPIRED: "Solicitacao indisponivel ou expirada. Abra novamente a notificacao antes de ativar.",
  METHOD_NOT_ALLOWED: "Metodo HTTP nao permitido para esta boundary.",
  AUTH_REQUIRED: "Autenticacao da sessao Manager obrigatoria.",
  MANAGER_NOT_AUTHORIZED: "Sessao sem autorizacao ativa de Manager.",
  VAULT_KEY_MISSING: "Runtime do vault sem chave configurada.",
  VAULT_KEY_INVALID: "Runtime do vault com chave invalida.",
  VAULT_ENCRYPT_FAILED: "Falha sanitizada na inicializacao da criptografia do vault.",
  RPC_FAILED: "Falha sanitizada na RPC do Control Plane.",
  DATABASE_PERMISSION_DENIED: "Permissao negada pela boundary do Control Plane.",
  INVALID_REQUEST: "Requisicao remota invalida.",
  INTERNAL_SANITIZED_ERROR: "Falha interna sanitizada do Control Plane.",
  EXISTING_DEVICE_CODE_REQUIRED: "Codigo do dispositivo ja vinculado e obrigatorio.",
  EXISTING_DEVICE_NOT_FOUND: "Dispositivo ja vinculado nao foi localizado.",
  EXISTING_DEVICE_CUSTOMER_MISMATCH: "Dispositivo informado nao pertence ao cliente selecionado.",
  CUSTOMER_ID_REQUIRED: "Identificador do cliente e obrigatorio.",
  CUSTOMER_NAME_REQUIRED: "Nome do cliente e obrigatorio para novo cliente.",
  CUSTOMER_ACCOUNT_NOT_FOUND: "Conta comercial de cliente nao encontrada.",
  CUSTOMER_ACCOUNT_NOT_ACTIVE: "Conta comercial de cliente nao esta ativa.",
  CUSTOMER_PROFILE_NOT_FOUND: "Perfil de cliente nao encontrado.",
  CUSTOMER_PROFILE_NOT_ACTIVE: "Perfil de cliente nao esta ativo.",
  CUSTOMER_HAS_NO_ACTIVE_SOURCE: "Cliente nao possui nenhuma fonte gerenciada ativa.",
  CUSTOMER_SOURCE_AMBIGUOUS: "Cliente possui multiplas fontes ativas; resolucao ambigua.",
  NO_ELIGIBLE_MANAGED_LICENSE: "Nenhuma licenca gerenciada ativa encontrada para o cliente.",
  MANAGED_LICENSE_CAPACITY_EXHAUSTED: "Capacidade de dispositivos da licenca gerenciada esgotada.",
  MANAGED_LICENSE_AMBIGUOUS: "Cliente possui multiplas licencas gerenciadas ativas elegiveis.",
  CROSS_CUSTOMER_BINDING_DENIED: "Tentativa de vinculacao entre clientes distintos negada.",
  SOURCE_CONFIG_REQUIRED: "Configuracao de fonte e obrigatoria para novo cliente.",
};

class SanitizedVaultError extends Error {
  readonly code: string;

  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function isRecord(value: unknown): value is RecordValue {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function fail(code: string): never {
  throw new SanitizedVaultError(code);
}

function assertProtocol(value: unknown): asserts value is Protocol {
  if (value !== "M3U" && value !== "XTREAM") fail("INVALID_SOURCE_PROTOCOL");
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

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return bytesToHex(new Uint8Array(digest));
}

function assertSourceId(value: unknown): asserts value is string {
  if (typeof value !== "string" || !/^src_[a-z0-9]+$/.test(value)) {
    fail("INVALID_CANONICAL_SOURCE_ID");
  }
}

function validateName(value: unknown): string {
  if (typeof value !== "string") fail("INVALID_SOURCE_NAME");
  const name = value.trim();
  if (name.length === 0 || name.length > 160) fail("INVALID_SOURCE_NAME");
  return name;
}

function assertHttpUrl(value: unknown, errorCode: string): asserts value is string {
  if (typeof value !== "string" || value.length === 0) fail(errorCode);
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") fail(errorCode);
  } catch {
    fail(errorCode);
  }
}

function assertOptionalString(value: unknown, errorCode: string): void {
  if (value !== undefined && (typeof value !== "string" || value.length === 0)) fail(errorCode);
}

function assertRuntimeOptions(value: unknown): void {
  if (value !== undefined && !isRecord(value)) fail("INVALID_SOURCE_RUNTIME_OPTIONS");
}

function validateSourceConfig(protocol: Protocol, config: unknown): void {
  if (!isRecord(config)) fail("INVALID_SOURCE_CONFIG");

  const allowedKeys = protocol === "M3U" ? M3U_KEYS : XTREAM_KEYS;
  if (Object.keys(config).some((key) => !allowedKeys.has(key))) {
    fail("INVALID_SOURCE_CONFIG_FIELDS");
  }

  if (protocol === "M3U") {
    assertHttpUrl(config.playlistUrl, "INVALID_M3U_PLAYLIST_URL");
    assertOptionalString(config.token, "INVALID_SOURCE_TOKEN");
    assertRuntimeOptions(config.runtimeOptions);
    return;
  }

  assertHttpUrl(config.endpoint, "INVALID_XTREAM_ENDPOINT");
  try {
    const endpoint = new URL(config.endpoint);
    if (endpoint.username || endpoint.password) fail("INVALID_XTREAM_ENDPOINT");
  } catch {
    fail("INVALID_XTREAM_ENDPOINT");
  }
  if (typeof config.username !== "string" || config.username.length === 0) {
    fail("INVALID_XTREAM_USERNAME");
  }
  if (typeof config.password !== "string" || config.password.length === 0) {
    fail("INVALID_XTREAM_PASSWORD");
  }
  assertOptionalString(config.token, "INVALID_SOURCE_TOKEN");
  assertRuntimeOptions(config.runtimeOptions);
}

function createOpaqueSourceId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return `src_${Array.from(bytes, (byte) => SOURCE_ID_ALPHABET[byte % SOURCE_ID_ALPHABET.length]).join("")}`;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function base64ToBytes(value: string): Uint8Array {
  try {
    const binary = atob(value);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch {
    fail("VAULT_KEY_INVALID");
  }
}

function getVaultKey(): Uint8Array {
  const rawKey = Deno.env.get(KEY_ENV_NAME);
  if (!rawKey) fail("VAULT_KEY_MISSING");
  const key = base64ToBytes(rawKey);
  if (key.byteLength !== 32) fail("VAULT_KEY_INVALID");
  return key;
}

async function inspectVaultRuntime(): Promise<{
  vaultKeyEnvPresent: boolean;
  vaultKeyFormatValid: boolean;
  vaultCryptoInitialization: "PASS" | "FAIL";
}> {
  const rawKey = Deno.env.get(KEY_ENV_NAME);
  if (!rawKey) {
    return {
      vaultKeyEnvPresent: false,
      vaultKeyFormatValid: false,
      vaultCryptoInitialization: "FAIL",
    };
  }

  let key: Uint8Array;
  try {
    key = base64ToBytes(rawKey);
  } catch {
    return {
      vaultKeyEnvPresent: true,
      vaultKeyFormatValid: false,
      vaultCryptoInitialization: "FAIL",
    };
  }

  if (key.byteLength !== 32) {
    return {
      vaultKeyEnvPresent: true,
      vaultKeyFormatValid: false,
      vaultCryptoInitialization: "FAIL",
    };
  }

  try {
    await crypto.subtle.importKey("raw", key, { name: "AES-GCM" }, false, ["encrypt"]);
    return {
      vaultKeyEnvPresent: true,
      vaultKeyFormatValid: true,
      vaultCryptoInitialization: "PASS",
    };
  } catch {
    return {
      vaultKeyEnvPresent: true,
      vaultKeyFormatValid: true,
      vaultCryptoInitialization: "FAIL",
    };
  }
}

async function encryptSourceConfig(
  sourceId: string,
  sourceVersion: number,
  protocol: Protocol,
  sourceConfig: unknown,
): Promise<{ ciphertext: string; nonce: string; authTag: string; keyVersion: string }> {
  validateSourceConfig(protocol, sourceConfig);
  const plaintext = JSON.stringify(sourceConfig);
  if (!plaintext) fail("INVALID_SOURCE_CONFIG");

  const key = await crypto.subtle.importKey(
    "raw",
    getVaultKey(),
    { name: "AES-GCM" },
    false,
    ["encrypt"],
  );
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const aad = new TextEncoder().encode(`${sourceId}\u0000${sourceVersion}\u0000${protocol}`);
  const encrypted = new Uint8Array(await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: nonce, additionalData: aad, tagLength: 128 },
    key,
    new TextEncoder().encode(plaintext),
  ));
  if (encrypted.byteLength < 16) fail("VAULT_ENCRYPT_FAILED");

  return {
    ciphertext: bytesToHex(encrypted.slice(0, -16)),
    nonce: bytesToHex(nonce),
    authTag: bytesToHex(encrypted.slice(-16)),
    keyVersion: KEY_VERSION,
  };
}

function safeErrorCode(error: unknown): string {
  const message = error instanceof Error ? error.message : isRecord(error) && typeof error.message === "string" ? error.message : "";
  if (error instanceof SanitizedVaultError && SAFE_ERROR_CODES.has(error.code)) return error.code;
  if (/MASTER_MANAGER_NOT_AUTHORIZED|MANAGER_NOT_AUTHORIZED/i.test(message)) return "MANAGER_NOT_AUTHORIZED";
  if (/MANAGER_AUTH_REQUIRED/i.test(message)) return "MANAGER_AUTH_REQUIRED";
  for (const code of SAFE_ERROR_CODES) {
    if (message.includes(code)) return code;
  }
  if (/permission denied|insufficient privilege/i.test(message)) return "DATABASE_PERMISSION_DENIED";
  return "INTERNAL_SANITIZED_ERROR";
}

function stageForErrorCode(code: string): ErrorStage {
  if (["AUTH_REQUIRED", "MANAGER_AUTH_REQUIRED", "VAULT_RUNTIME_NOT_CONFIGURED"].includes(code)) return "AUTH";
  if (code === "MANAGER_NOT_AUTHORIZED") return "MANAGER_AUTHORIZATION";
  if (["VAULT_KEY_MISSING", "VAULT_KEY_INVALID"].includes(code)) return "VAULT_KEY";
  if (code === "VAULT_ENCRYPT_FAILED") return "VAULT_ENCRYPT";
  if (["RPC_FAILED", "DATABASE_PERMISSION_DENIED", "SOURCE_NOT_FOUND", "VERSION_CONFLICT"].includes(code)) return "RPC";
  if (["INTERNAL_SANITIZED_ERROR", "VAULT_STORE_FAILED"].includes(code)) return "INTERNAL";
  return "REQUEST_VALIDATION";
}

function statusForErrorCode(code: string): number {
  if (code === "METHOD_NOT_ALLOWED") return 405;
  if (["AUTH_REQUIRED", "MANAGER_AUTH_REQUIRED"].includes(code)) return 401;
  if (["MANAGER_NOT_AUTHORIZED", "DATABASE_PERMISSION_DENIED", "MANAGER_SCOPE_DENIED"].includes(code)) return 403;
  if (["VERSION_CONFLICT", "SOURCE_ALREADY_EXISTS"].includes(code)) return 409;
  if (code === "INTERNAL_SANITIZED_ERROR") return 500;
  return 400;
}

function rpcErrorCode(error: unknown): string {
  const code = safeErrorCode(error);
  return code === "INTERNAL_SANITIZED_ERROR" ? "RPC_FAILED" : code;
}

function response(body: RecordValue, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function errorResponse(error: unknown): Response {
  const code = safeErrorCode(error);
  const status = statusForErrorCode(code);
  return response({
    success: false,
    code,
    stage: stageForErrorCode(code),
    message: ERROR_MESSAGES[code] ?? "Falha remota sanitizada do Control Plane.",
  }, status);
}

function sanitizedMutation(value: unknown): RecordValue {
  if (!isRecord(value) || value.success !== true || !isRecord(value.source)) {
    fail("VAULT_STORE_FAILED");
  }
  const source = value.source;
  if (
    typeof source.sourceId !== "string" ||
    typeof source.name !== "string" ||
    (source.sourceType !== "M3U" && source.sourceType !== "XTREAM") ||
    typeof source.version !== "number" ||
    (source.status !== "ACTIVE" && source.status !== "DISABLED") ||
    (source.vaultStatus !== "CONFIGURED" && source.vaultStatus !== "NOT_CONFIGURED")
  ) {
    fail("VAULT_STORE_FAILED");
  }
  return {
    success: true,
    sourceId: source.sourceId,
    sourceVersion: source.version,
    protocol: source.sourceType,
    sourceStatus: source.status,
    name: source.name,
    vaultStatus: source.vaultStatus,
  };
}

async function runVaultRuntimePreflight(supabase: ReturnType<typeof createClient>): Promise<RecordValue> {
  const runtime = await inspectVaultRuntime();
  const { error } = await supabase.rpc("rpc_manager_read_control_plane_metadata", {});
  const rpcErrorMessage = error?.message ?? "";
  const rpcPresent = !/function .* does not exist|could not find the function|not found/i.test(rpcErrorMessage);
  const managerAuthorized = !error;

  return {
    success: true,
    preflight: "VAULT_RUNTIME",
    vaultKeyEnvPresent: runtime.vaultKeyEnvPresent,
    vaultKeyFormatValid: runtime.vaultKeyFormatValid,
    vaultCryptoInitialization: runtime.vaultCryptoInitialization,
    callerAuthenticated: true,
    callerManagerActive: managerAuthorized,
    callerManagerRole: managerAuthorized ? "UNPROVEN" : "OTHER",
    managerAuthorization: managerAuthorized ? "PASS" : "DENIED",
    rpcName: "rpc_manager_update_managed_source_vault",
    rpcPresent,
    rpcExecuteAuthenticated: managerAuthorized && rpcPresent,
  };
}

async function handle(request: Request): Promise<Response> {
  if (request.method !== "POST") fail("METHOD_NOT_ALLOWED");

  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) fail("MANAGER_AUTH_REQUIRED");

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseAnonKey) fail("VAULT_RUNTIME_NOT_CONFIGURED");

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authorization } },
  });
  const { data: userData, error: userError } = await supabase.auth.getUser(authorization.slice(7));
  if (userError || !userData.user?.id) fail("AUTH_REQUIRED");

  const body: unknown = await request.json();
  if (!isRecord(body)) {
    fail("INVALID_REQUEST");
  }
  if (body.operation === "PREFLIGHT_VAULT_RUNTIME") {
    return response(await runVaultRuntimePreflight(supabase));
  }
  if (body.operation === "LICENSE_DEVICE") {
    const displayCode = validateDisplayCode(body.displayCode);
    if (typeof body.licenseId !== "string" || !/^[a-f0-9-]{36}$/i.test(body.licenseId)) fail("INVALID_LICENSE_ID");
    if (typeof body.label !== "string" || body.label.trim().length < 1 || body.label.trim().length > 100) fail("INVALID_DEVICE_LABEL");
    const hash = body.activationKey === undefined ? null : await sha256Hex(validateActivationKey(body.activationKey));
    const { data, error } = await supabase.rpc("rpc_manager_license_device", {
      p_license_id: body.licenseId, p_display_code: displayCode, p_label: body.label.trim(), p_key_hash: hash,
    });
    if (error) throw new Error(rpcErrorCode(error));
    if (!isRecord(data) || data.success !== true) fail("INTERNAL_SANITIZED_ERROR");
    return response({ success: true });
  }
  if (body.operation === "REPLACE_LICENSE_SOURCE") {
    if (typeof body.licenseId !== "string" || !/^[a-f0-9-]{36}$/i.test(body.licenseId) || !Array.isArray(body.expectedSources)) fail("INVALID_REQUEST");
    const protocol = body.protocol;
    assertProtocol(protocol);
    const { data: detail, error: detailError } = await supabase.rpc("rpc_manager_get_license_detail", { p_license_id: body.licenseId });
    if (detailError) throw new Error(rpcErrorCode(detailError));
    if (!isRecord(detail) || detail.success !== true || !isRecord(detail.license)) fail("LICENSE_NOT_FOUND");
    const sourceId = detail.license.mode === "SELF_SERVICE" ? createOpaqueSourceId().replace(/^src_/, "csrc_") : createOpaqueSourceId();
    const name = validateName(body.name);
    // Same source vault key and AAD contract for managed/customer delivery.
    const envelope = await encryptSourceConfig(sourceId, 1, protocol, body.sourceConfig);
    const { data, error } = await supabase.rpc("rpc_manager_replace_license_source", {
      p_license_id: body.licenseId, p_expected_sources: body.expectedSources, p_source_id: sourceId,
      p_name: name, p_protocol: protocol, p_ciphertext: envelope.ciphertext, p_nonce: envelope.nonce,
      p_auth_tag: envelope.authTag, p_key_version: envelope.keyVersion,
    });
    if (error) throw new Error(rpcErrorCode(error));
    if (!isRecord(data) || data.success !== true) fail("INTERNAL_SANITIZED_ERROR");
    return response({ success: true, sourceId, sourceVersion: 1 });
  }
  if (body.operation === "SAVE_LICENSE_EDITS") {
    if (typeof body.licenseId !== "string" || !/^[a-f0-9-]{36}$/i.test(body.licenseId) ||
      typeof body.expectedSnapshot !== "string" || !/^[a-f0-9]{64}$/.test(body.expectedSnapshot) || !isRecord(body.changes) ||
      !isRecord(body.source) || !Array.isArray(body.source.expectedSources) || "source" in body.changes) fail("INVALID_REQUEST");
    const protocol = body.source.protocol;
    assertProtocol(protocol);
    const { data: detail, error: detailError } = await supabase.rpc("rpc_manager_get_license_detail", { p_license_id: body.licenseId });
    if (detailError) throw new Error(rpcErrorCode(detailError));
    if (!isRecord(detail) || detail.success !== true || !isRecord(detail.license)) fail("LICENSE_NOT_FOUND");
    if (detail.editorSnapshot !== body.expectedSnapshot) fail("LICENSE_EDITOR_CONFLICT");
    const sourceId = detail.license.mode === "SELF_SERVICE" ? createOpaqueSourceId().replace(/^src_/, "csrc_") : createOpaqueSourceId();
    const name = validateName(body.source.name);
    const envelope = await encryptSourceConfig(sourceId, 1, protocol, body.source.sourceConfig);
    const { data, error } = await supabase.rpc("rpc_manager_save_license_edits", {
      p_license_id: body.licenseId, p_expected_snapshot: body.expectedSnapshot,
      p_changes: { ...body.changes, source: { expectedSources: body.source.expectedSources, sourceId, name, protocol,
        ciphertext: envelope.ciphertext, nonce: envelope.nonce, authTag: envelope.authTag, keyVersion: envelope.keyVersion } },
    });
    if (error) throw new Error(rpcErrorCode(error));
    if (!isRecord(data) || data.success !== true) fail("INTERNAL_SANITIZED_ERROR");
    return response({ success: true });
  }
  if (body.operation === "LINK_LICENSE_DEVICE") {
    if (typeof body.licenseId !== "string" || !/^[0-9a-f-]{36}$/i.test(body.licenseId)) fail("INVALID_LICENSE_ID");
    if (typeof body.registered !== "boolean") fail("INVALID_REQUEST");
    if (body.deviceRole !== "PRIMARY" && body.deviceRole !== "SECONDARY") fail("INVALID_DEVICE_ROLE");
    if (body.registered && body.deviceRole !== "SECONDARY") fail("INVALID_DEVICE_ROLE");
    if (typeof body.deviceLabel !== "string" || body.deviceLabel.trim().length < 1 || body.deviceLabel.trim().length > 100) fail("INVALID_DEVICE_LABEL");
    if (!Number.isSafeInteger(body.maxDevices) || (body.maxDevices as number) < 1 || (body.maxDevices as number) > 100) fail("INVALID_MAX_DEVICES");
    if (!Number.isSafeInteger(body.maxConcurrentSessions) || (body.maxConcurrentSessions as number) < 1 || (body.maxConcurrentSessions as number) > 50) fail("INVALID_MAX_CONCURRENT_SESSIONS");
    if ((body.maxConcurrentSessions as number) > (body.maxDevices as number)) fail("CONCURRENT_LIMIT_EXCEEDS_DEVICES");
    const displayCode = validateDisplayCode(body.displayCode);
    const primary = body.primaryDisplayCode ? validateDisplayCode(body.primaryDisplayCode) : null;
    if (body.deviceRole === "SECONDARY" && !primary) fail("PRIMARY_DEVICE_REQUIRED");
    if (primary === displayCode) fail("PRIMARY_DEVICE_INVALID");
    const { data, error } = await supabase.rpc("rpc_manager_link_license_device", {
      p_license_id: body.licenseId, p_display_code: displayCode, p_primary_display_code: primary,
      p_device_label: body.deviceLabel.trim(), p_max_devices: body.maxDevices, p_max_sessions: body.maxConcurrentSessions,
      p_device_role: body.deviceRole, p_registered: body.registered,
      p_key_hash: body.registered ? null : await sha256Hex(validateActivationKey(body.activationKey)),
    });
    if (error) throw new Error(rpcErrorCode(error));
    if (!isRecord(data) || data.success !== true) fail("INTERNAL_SANITIZED_ERROR");
    return response({ success: true });
  }
  if (body.operation === "ACTIVATE_SOURCE_FOR_DEVICE") {
    const configured = body.deviceRole !== undefined || body.primaryDisplayCode !== undefined || body.deviceLabel !== undefined || body.maxDevices !== undefined || body.maxConcurrentSessions !== undefined;
    if (configured) {
      if (body.deviceRole !== "PRIMARY" && body.deviceRole !== "SECONDARY") fail("INVALID_DEVICE_ROLE");
      if (body.deviceRole === "SECONDARY" && (body.flowMode !== "EXISTING_CUSTOMER" || typeof body.primaryDisplayCode !== "string" || !/^XF-[0-9A-Z]{4}-[0-9A-Z]{4}$/.test(body.primaryDisplayCode.trim().toUpperCase()))) fail("PRIMARY_DEVICE_REQUIRED");
      if (body.deviceRole === "SECONDARY" && (body.primaryDisplayCode as string).trim().toUpperCase() !== String(body.existingDeviceCode ?? body.existingDisplayCode).trim().toUpperCase()) fail("PRIMARY_DEVICE_INVALID");
      if (typeof body.deviceLabel !== "string" || body.deviceLabel.trim().length < 1 || body.deviceLabel.trim().length > 100) fail("INVALID_DEVICE_LABEL");
      if (!Number.isSafeInteger(body.maxDevices) || (body.maxDevices as number) < 1 || (body.maxDevices as number) > 100) fail("INVALID_MAX_DEVICES");
      if (!Number.isSafeInteger(body.maxConcurrentSessions) || (body.maxConcurrentSessions as number) < 1 || (body.maxConcurrentSessions as number) > 50) fail("INVALID_MAX_CONCURRENT_SESSIONS");
      if ((body.maxConcurrentSessions as number) > (body.maxDevices as number)) fail("CONCURRENT_LIMIT_EXCEEDS_DEVICES");
    }
    const activate = (args: RecordValue) => configured
      ? supabase.rpc("rpc_manager_activate_device_configured", { p_activation: args, p_device_label: (body.deviceLabel as string).trim(), p_max_devices: body.maxDevices, p_max_sessions: body.maxConcurrentSessions, p_device_role: body.deviceRole, p_primary_display_code: body.deviceRole === "SECONDARY" ? (body.primaryDisplayCode as string).trim().toUpperCase() : null })
      : supabase.rpc("rpc_manager_complete_device_activation", args);
    const flowMode = body.flowMode === "EXISTING_CUSTOMER" ? "EXISTING_CUSTOMER" : "NEW_CUSTOMER";
    const displayCode = validateDisplayCode(body.displayCode);
    let activationKeyHash: string;
    if (body.activationNotificationId !== undefined) {
      if (typeof body.activationNotificationId !== "string" || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(body.activationNotificationId)) fail("INVALID_REQUEST");
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (!serviceKey) fail("VAULT_RUNTIME_NOT_CONFIGURED");
      const server = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
      // The manager id comes from auth.getUser, never from the request body.
      const { data, error } = await server.rpc("rpc_service_activation_notification_hash", {
        p_manager_id: userData.user.id, p_notification_id: body.activationNotificationId, p_display_code: displayCode,
      });
      if (error || !isRecord(data) || data.success !== true || typeof data.activationKeyHash !== "string" || !/^[a-f0-9]{64}$/i.test(data.activationKeyHash)) fail("HANDOFF_EXPIRED");
      activationKeyHash = data.activationKeyHash;
    } else {
      activationKeyHash = await sha256Hex(validateActivationKey(body.activationKey));
    }
    const licenseId = typeof body.licenseId === "string" && body.licenseId.trim().length > 0
      ? body.licenseId.trim()
      : null;
    if (licenseId && !/^[0-9a-f-]{36}$/i.test(licenseId)) fail("INVALID_LICENSE_ID");

    if (flowMode === "EXISTING_CUSTOMER") {
      const customerId = typeof body.customerId === "string" && body.customerId.trim().length > 0
        ? body.customerId.trim()
        : null;
      if (!customerId || !/^[0-9a-f-]{36}$/i.test(customerId)) fail("CUSTOMER_ID_REQUIRED");
      const existingDisplayCode = validateDisplayCode(body.existingDeviceCode ?? body.existingDisplayCode);

      const { data, error } = await activate({
        p_display_code: displayCode,
        p_activation_key_hash: activationKeyHash,
        p_license_id: licenseId,
        p_source_id: null,
        p_source_type: null,
        p_display_name: null,
        p_ciphertext: null,
        p_nonce: null,
        p_auth_tag: null,
        p_key_version: "v1",
        p_customer_id: customerId,
        p_flow_mode: "EXISTING_CUSTOMER",
        p_new_customer_name: null,
        p_existing_display_code: existingDisplayCode,
      });
      if (error) throw new Error(rpcErrorCode(error));
      if (
        !isRecord(data) || data.success !== true ||
        typeof data.deviceId !== "string" || typeof data.displayCode !== "string" ||
        typeof data.licenseId !== "string" || typeof data.sourceId !== "string" ||
        data.deviceAuthorizationState !== "AUTHORIZED" ||
        data.sourceBindingStatus !== "ACTIVE" ||
        (data.licenseStatus !== "ACTIVE" && data.licenseStatus !== "TRIAL") ||
        data.sourceResolution !== "SOURCE_READY"
      ) {
        fail("INTERNAL_SANITIZED_ERROR");
      }
      return response({
        success: true,
        deviceId: data.deviceId,
        displayCode: data.displayCode,
        customerId: data.customerId,
        licenseId: data.licenseId,
        sourceId: data.sourceId,
        deviceAuthorizationState: "AUTHORIZED",
        sourceBindingStatus: "ACTIVE",
        licenseStatus: data.licenseStatus,
        sourceResolution: "SOURCE_READY",
        sourceReused: true,
      });
    }

    // FLOW_A: NEW_CUSTOMER
    const newCustomerName = typeof body.newCustomerName === "string" && body.newCustomerName.trim().length > 0
      ? body.newCustomerName.trim()
      : null;
    const customerId = typeof body.customerId === "string" && body.customerId.trim().length > 0
      ? body.customerId.trim()
      : null;
    if (customerId && !/^[0-9a-f-]{36}$/i.test(customerId)) fail("INVALID_CUSTOMER_ID");
    if (!newCustomerName && !customerId) fail("CUSTOMER_NAME_REQUIRED");

    const protocol = body.protocol;
    assertProtocol(protocol);
    const name = validateName(body.name);
    if (name.length > 100) fail("INVALID_SOURCE_NAME");
    const sourceId = createOpaqueSourceId();
    const envelope = await encryptSourceConfig(sourceId, 1, protocol, body.sourceConfig);
    const { data, error } = await activate({
      p_display_code: displayCode,
      p_activation_key_hash: activationKeyHash,
      p_license_id: licenseId,
      p_source_id: sourceId,
      p_source_type: protocol,
      p_display_name: name,
      p_ciphertext: envelope.ciphertext,
      p_nonce: envelope.nonce,
      p_auth_tag: envelope.authTag,
      p_key_version: envelope.keyVersion,
      p_customer_id: customerId,
      p_flow_mode: "NEW_CUSTOMER",
      p_new_customer_name: newCustomerName,
      p_existing_display_code: null,
    });
    if (error) throw new Error(rpcErrorCode(error));
    if (
      !isRecord(data) || data.success !== true ||
      typeof data.deviceId !== "string" || typeof data.displayCode !== "string" ||
      typeof data.licenseId !== "string" || typeof data.sourceId !== "string" ||
      data.deviceAuthorizationState !== "AUTHORIZED" ||
      data.sourceBindingStatus !== "ACTIVE" ||
      (data.licenseStatus !== "ACTIVE" && data.licenseStatus !== "TRIAL") ||
      data.sourceResolution !== "SOURCE_READY"
    ) {
      fail("INTERNAL_SANITIZED_ERROR");
    }
    return response({
      success: true,
      deviceId: data.deviceId,
      displayCode: data.displayCode,
      customerId: data.customerId,
      licenseId: data.licenseId,
      sourceId: data.sourceId,
      deviceAuthorizationState: "AUTHORIZED",
      sourceBindingStatus: "ACTIVE",
      licenseStatus: data.licenseStatus,
      sourceResolution: "SOURCE_READY",
      sourceReused: false,
    });
  }
  if (body.operation !== "CREATE_MANAGED_SOURCE_WITH_CONFIG" && body.operation !== "UPDATE_MANAGED_SOURCE_CONFIG") {
    fail("INVALID_REQUEST");
  }

  const protocol = body.protocol;
  assertProtocol(protocol);
  const name = validateName(body.name);
  let sourceId: string;
  let expectedSourceVersion: number | undefined;

  if (body.operation === "CREATE_MANAGED_SOURCE_WITH_CONFIG") {
    sourceId = createOpaqueSourceId();
  } else {
    assertSourceId(body.sourceId);
    sourceId = body.sourceId;
    if (!Number.isSafeInteger(body.expectedVersion) || (body.expectedVersion as number) < 1) {
      fail("INVALID_EXPECTED_VERSION");
    }
    expectedSourceVersion = body.expectedVersion as number;
  }

  const nextSourceVersion = expectedSourceVersion === undefined ? 1 : expectedSourceVersion + 1;
  if (!Number.isSafeInteger(nextSourceVersion)) fail("SOURCE_VERSION_OVERFLOW");
  const envelope = await encryptSourceConfig(sourceId, nextSourceVersion, protocol, body.sourceConfig);

  const rpcName = body.operation === "CREATE_MANAGED_SOURCE_WITH_CONFIG"
    ? "rpc_manager_create_managed_source_vault"
    : "rpc_manager_update_managed_source_vault";
  const rpcParams = body.operation === "CREATE_MANAGED_SOURCE_WITH_CONFIG"
    ? {
        p_source_id: sourceId,
        p_name: name,
        p_source_type: protocol,
        p_ciphertext: envelope.ciphertext,
        p_nonce: envelope.nonce,
        p_auth_tag: envelope.authTag,
        p_key_version: envelope.keyVersion,
      }
    : {
        p_source_id: sourceId,
        p_expected_source_version: expectedSourceVersion,
        p_name: name,
        p_source_type: protocol,
        p_ciphertext: envelope.ciphertext,
        p_nonce: envelope.nonce,
        p_auth_tag: envelope.authTag,
        p_key_version: envelope.keyVersion,
      };

  const { data, error } = await supabase.rpc(rpcName, rpcParams);
  if (error) throw new Error(rpcErrorCode(error));
  return response(sanitizedMutation(data));
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { status: 200, headers: corsHeaders });
  try {
    return await handle(request);
  } catch (error) {
    return errorResponse(error);
  }
});
