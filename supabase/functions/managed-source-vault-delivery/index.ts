import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import postgres from "npm:postgres@3.4.5";

type Protocol = "M3U" | "XTREAM";
type RecordValue = Record<string, unknown>;
type DatabaseClient = ReturnType<typeof postgres>;
type ErrorStage = "AUTH" | "LICENSE" | "BINDING" | "VAULT" | "DELIVERY" | "INTERNAL";

const KEY_ENV_NAME = "SOURCE_VAULT_KEY_V1";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

const SAFE_ERROR_CODES = new Set([
  "METHOD_NOT_ALLOWED",
  "INVALID_REQUEST",
  "DEVICE_NOT_AUTHORIZED",
  "DEVICE_REVOKED",
  "LICENSE_INVALID",
  "SOURCE_NOT_BOUND",
  "SOURCE_DISABLED",
  "SOURCE_VERSION_MISMATCH",
  "VAULT_NOT_CONFIGURED",
  "VAULT_VERSION_MISMATCH",
  "VAULT_KEY_MISSING",
  "VAULT_KEY_INVALID",
  "VAULT_DECRYPT_FAILED",
  "DELIVERY_NOT_CONFIGURED",
  "INTERNAL_SANITIZED_ERROR",
]);

const ERROR_MESSAGES: Record<string, string> = {
  METHOD_NOT_ALLOWED: "Método HTTP não permitido para esta boundary.",
  INVALID_REQUEST: "Requisição de entrega inválida.",
  DEVICE_NOT_AUTHORIZED: "Dispositivo não autorizado para entrega gerenciada.",
  DEVICE_REVOKED: "Dispositivo revogado.",
  LICENSE_INVALID: "Licença gerenciada inválida ou inativa.",
  SOURCE_NOT_BOUND: "Nenhuma fonte gerenciada vinculada ao dispositivo.",
  SOURCE_DISABLED: "A fonte gerenciada está desabilitada.",
  SOURCE_VERSION_MISMATCH: "A versão da fonte gerenciada não está disponível.",
  VAULT_NOT_CONFIGURED: "Vault gerenciado não configurado.",
  VAULT_VERSION_MISMATCH: "Versão do vault gerenciado não corresponde à fonte.",
  VAULT_KEY_MISSING: "Runtime do vault sem chave configurada.",
  VAULT_KEY_INVALID: "Runtime do vault com chave inválida.",
  VAULT_DECRYPT_FAILED: "Falha sanitizada na leitura segura do vault.",
  DELIVERY_NOT_CONFIGURED: "Boundary de entrega não configurada.",
  INTERNAL_SANITIZED_ERROR: "Falha interna sanitizada da entrega gerenciada.",
};

class DeliveryError extends Error {
  readonly code: string;

  constructor(code: string) {
    super(code);
    this.name = "DeliveryError";
    this.code = code;
  }
}

function isRecord(value: unknown): value is RecordValue {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function fail(code: string): never {
  throw new DeliveryError(code);
}

function response(body: RecordValue, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function statusForErrorCode(code: string): number {
  if (code === "METHOD_NOT_ALLOWED") return 405;
  if (code === "DEVICE_NOT_AUTHORIZED" || code === "DEVICE_REVOKED" || code === "LICENSE_INVALID") return 403;
  if (code === "INTERNAL_SANITIZED_ERROR") return 500;
  return 400;
}

function stageForErrorCode(code: string): ErrorStage {
  if (["DEVICE_NOT_AUTHORIZED", "DEVICE_REVOKED"].includes(code)) return "AUTH";
  if (code === "LICENSE_INVALID") return "LICENSE";
  if (["SOURCE_NOT_BOUND", "SOURCE_DISABLED", "SOURCE_VERSION_MISMATCH"].includes(code)) return "BINDING";
  if (["VAULT_NOT_CONFIGURED", "VAULT_VERSION_MISMATCH", "VAULT_KEY_MISSING", "VAULT_KEY_INVALID", "VAULT_DECRYPT_FAILED"].includes(code)) return "VAULT";
  if (code === "DELIVERY_NOT_CONFIGURED") return "DELIVERY";
  return "INTERNAL";
}

function sanitizedErrorCode(error: unknown): string {
  if (error instanceof DeliveryError && SAFE_ERROR_CODES.has(error.code)) return error.code;
  return "INTERNAL_SANITIZED_ERROR";
}

function errorResponse(error: unknown): Response {
  const code = sanitizedErrorCode(error);
  return response({
    success: false,
    code,
    stage: stageForErrorCode(code),
    message: ERROR_MESSAGES[code] ?? ERROR_MESSAGES.INTERNAL_SANITIZED_ERROR,
  }, statusForErrorCode(code));
}

function requireString(value: unknown): string {
  if (typeof value !== "string" || value.length === 0) fail("INVALID_REQUEST");
  return value;
}

function requireProtocol(value: unknown): Protocol {
  if (value !== "M3U" && value !== "XTREAM") fail("INVALID_REQUEST");
  return value;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return bytesToHex(new Uint8Array(digest));
}

function base64ToBytes(rawKey: string): Uint8Array {
  if (
    rawKey.length === 0 ||
    rawKey.length % 4 !== 0 ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(rawKey)
  ) {
    fail("VAULT_KEY_INVALID");
  }
  try {
    const binary = atob(rawKey);
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

function hexToBytes(value: unknown, expectedBytes: number): Uint8Array {
  if (typeof value !== "string" || value.length !== expectedBytes * 2 || !/^[0-9a-fA-F]+$/.test(value)) {
    fail("VAULT_DECRYPT_FAILED");
  }
  const bytes = new Uint8Array(expectedBytes);
  for (let index = 0; index < expectedBytes; index += 1) {
    bytes[index] = Number.parseInt(value.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

function assertHttpUrl(value: unknown, protocol: Protocol): asserts value is string {
  if (typeof value !== "string" || value.length === 0) fail("VAULT_DECRYPT_FAILED");
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") fail("VAULT_DECRYPT_FAILED");
    if (protocol === "XTREAM" && (url.username || url.password)) fail("VAULT_DECRYPT_FAILED");
  } catch {
    fail("VAULT_DECRYPT_FAILED");
  }
}

function validateRuntimeOptions(value: unknown): void {
  if (value !== undefined && !isRecord(value)) fail("VAULT_DECRYPT_FAILED");
}

function validateDeliveredConfig(protocol: Protocol, value: unknown): asserts value is RecordValue {
  if (!isRecord(value)) fail("VAULT_DECRYPT_FAILED");
  const keys = Object.keys(value);
  const allowed = protocol === "M3U"
    ? new Set(["playlistUrl", "token", "runtimeOptions"])
    : new Set(["endpoint", "username", "password", "token", "runtimeOptions"]);
  if (keys.some((key) => !allowed.has(key))) fail("VAULT_DECRYPT_FAILED");
  if (protocol === "M3U") {
    assertHttpUrl(value.playlistUrl, protocol);
  } else {
    assertHttpUrl(value.endpoint, protocol);
    if (typeof value.username !== "string" || value.username.length === 0) fail("VAULT_DECRYPT_FAILED");
    if (typeof value.password !== "string" || value.password.length === 0) fail("VAULT_DECRYPT_FAILED");
  }
  if (value.token !== undefined && (typeof value.token !== "string" || value.token.length === 0)) {
    fail("VAULT_DECRYPT_FAILED");
  }
  validateRuntimeOptions(value.runtimeOptions);
}

async function decryptSourceConfig(
  sourceId: string,
  sourceVersion: number,
  protocol: Protocol,
  ciphertext: unknown,
  nonce: unknown,
  authTag: unknown,
): Promise<RecordValue> {
  const encrypted = hexToBytes(ciphertext, typeof ciphertext === "string" ? ciphertext.length / 2 : 0);
  const iv = hexToBytes(nonce, 12);
  const tag = hexToBytes(authTag, 16);
  const combined = new Uint8Array(encrypted.byteLength + tag.byteLength);
  combined.set(encrypted, 0);
  combined.set(tag, encrypted.byteLength);

  try {
    const key = await crypto.subtle.importKey("raw", getVaultKey(), { name: "AES-GCM" }, false, ["decrypt"]);
    const plaintext = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv,
        additionalData: new TextEncoder().encode(`${sourceId}\u0000${sourceVersion}\u0000${protocol}`),
        tagLength: 128,
      },
      key,
      combined,
    );
    const parsed: unknown = JSON.parse(new TextDecoder().decode(plaintext));
    validateDeliveredConfig(protocol, parsed);
    return parsed;
  } catch (error) {
    if (error instanceof DeliveryError) throw error;
    fail("VAULT_DECRYPT_FAILED");
  }
}

function getDatabaseClient(): DatabaseClient {
  const connectionString = Deno.env.get("SUPABASE_DB_URL");
  if (!connectionString) fail("DELIVERY_NOT_CONFIGURED");
  return postgres(connectionString, { prepare: false, max: 1 });
}

async function deliver(request: Request): Promise<Response> {
  if (request.method !== "POST") fail("METHOD_NOT_ALLOWED");
  const body: unknown = await request.json();
  if (!isRecord(body) || body.operation !== "DELIVER_MANAGED_SOURCE") fail("INVALID_REQUEST");

  const deviceId = requireString(body.deviceId);
  const deviceAuthToken = requireString(body.deviceAuthToken);
  const tokenHash = await sha256(deviceAuthToken);
  const sql = getDatabaseClient();

  const deviceRows = await sql`
    SELECT device_id, status
    FROM public.devices
    WHERE device_id = ${deviceId}
      AND device_token_hash = ${tokenHash}
    LIMIT 1
  `;
  const device = deviceRows[0] as RecordValue | undefined;
  if (!device) fail("DEVICE_NOT_AUTHORIZED");
  if (device.status === "REVOKED") fail("DEVICE_REVOKED");
  if (device.status !== "AUTHORIZED") fail("DEVICE_NOT_AUTHORIZED");

  const licenseRows = await sql`
    SELECT l.id, l.status, l.mode, l.expires_at, l.trial_started_at, l.trial_expires_at
    FROM public.license_devices AS ld
    JOIN public.licenses AS l ON l.id = ld.license_id
    WHERE ld.device_id = ${deviceId}
      AND ld.status = 'ACTIVE'
      AND (
        (l.status = 'ACTIVE' AND (l.expires_at IS NULL OR l.expires_at >= NOW()))
        OR
        (l.status = 'TRIAL' AND l.trial_started_at IS NOT NULL AND l.trial_expires_at IS NOT NULL AND NOW() < l.trial_expires_at)
      )
    ORDER BY ld.bound_at DESC
    LIMIT 1
  `;
  const license = licenseRows[0] as RecordValue | undefined;
  if (!license) fail("LICENSE_INVALID");

  const bindingRows = await sql`
    SELECT
      dsb.source_id AS binding_source_uuid,
      ms.source_id,
      ms.version,
      ms.source_type,
      ms.status
    FROM public.device_source_bindings AS dsb
    JOIN public.managed_sources AS ms ON ms.id = dsb.source_id
    WHERE dsb.device_id = ${deviceId}
      AND dsb.license_id = ${license.id}
    LIMIT 1
  `;
  const binding = bindingRows[0] as RecordValue | undefined;
  if (!binding) fail("SOURCE_NOT_BOUND");
  if (binding.status !== "ACTIVE") fail("SOURCE_DISABLED");

  const sourceId = requireString(binding.source_id);
  const sourceVersion = binding.version;
  const protocol = requireProtocol(binding.source_type);
  if (!Number.isSafeInteger(sourceVersion) || sourceVersion < 1) fail("SOURCE_VERSION_MISMATCH");

  const vaultRows = await sql`
    SELECT source_id, source_version, protocol, ciphertext, nonce, auth_tag
    FROM private.managed_source_secret_vault
    WHERE source_id = ${sourceId}
      AND source_version = ${sourceVersion}
      AND protocol = ${protocol}
    LIMIT 1
  `;
  const vault = vaultRows[0] as RecordValue | undefined;
  if (!vault) fail("VAULT_NOT_CONFIGURED");
  if (
    vault.source_id !== sourceId ||
    vault.source_version !== sourceVersion ||
    vault.protocol !== protocol
  ) {
    fail("VAULT_VERSION_MISMATCH");
  }

  const sourceConfig = await decryptSourceConfig(
    sourceId,
    sourceVersion,
    protocol,
    vault.ciphertext,
    vault.nonce,
    vault.auth_tag,
  );

  return response({
    success: true,
    sourceId,
    sourceVersion,
    protocol,
    sourceConfig,
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { status: 200, headers: corsHeaders });
  try {
    return await deliver(request);
  } catch (error) {
    return errorResponse(error);
  }
});
