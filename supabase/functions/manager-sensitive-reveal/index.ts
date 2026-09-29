import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.116.0";

type RecordValue = Record<string, unknown>;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

const SAFE_CODES = new Set([
  "AUTH_REQUIRED",
  "MANAGER_AUTH_REQUIRED",
  "MASTER_MANAGER_NOT_AUTHORIZED",
  "DEVICE_NOT_FOUND",
  "VAULT_KEY_MISSING",
  "VAULT_KEY_INVALID",
  "REVEAL_DECRYPT_FAILED",
  "INVALID_REQUEST",
]);

class RevealError extends Error {
  readonly code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

function fail(code: string): never {
  throw new RevealError(code);
}

function isRecord(value: unknown): value is RecordValue {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function env(name: string): string {
  const value = Deno.env.get(name);
  if (!value) fail("VAULT_KEY_MISSING");
  return value;
}

function hexToBytes(value: unknown): Uint8Array {
  if (typeof value !== "string" || value.length === 0 || value.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(value)) {
    fail("REVEAL_DECRYPT_FAILED");
  }
  const bytes = new Uint8Array(value.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(value.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

function base64ToBytes(value: string): Uint8Array {
  try {
    return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
  } catch {
    fail("VAULT_KEY_INVALID");
  }
}

function concatBytes(...parts: Uint8Array[]): Uint8Array {
  const result = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

async function decryptEnvelope(
  envelope: RecordValue,
  aadText: string,
): Promise<RecordValue> {
  const rawKey = env("SOURCE_VAULT_KEY_V1");
  const keyBytes = base64ToBytes(rawKey);
  if (keyBytes.byteLength !== 32) fail("VAULT_KEY_INVALID");
  if (typeof envelope.ciphertext !== "string" || typeof envelope.nonce !== "string" || typeof envelope.authTag !== "string") {
    fail("REVEAL_DECRYPT_FAILED");
  }

  try {
    const key = await crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, ["decrypt"]);
    const plaintext = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: hexToBytes(envelope.nonce),
        additionalData: new TextEncoder().encode(aadText),
        tagLength: 128,
      },
      key,
      concatBytes(hexToBytes(envelope.ciphertext), hexToBytes(envelope.authTag)),
    );
    const parsed: unknown = JSON.parse(new TextDecoder().decode(plaintext));
    if (!isRecord(parsed)) fail("REVEAL_DECRYPT_FAILED");
    return parsed;
  } catch (error) {
    if (error instanceof RevealError) throw error;
    fail("REVEAL_DECRYPT_FAILED");
  }
}

function response(body: RecordValue, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function errorResponse(error: unknown): Response {
  const raw = error instanceof RevealError ? error.code : error instanceof Error ? error.message : "";
  const code = [...SAFE_CODES].find((candidate) => raw.includes(candidate)) ?? "REVEAL_DECRYPT_FAILED";
  const status = code === "AUTH_REQUIRED" || code === "MANAGER_AUTH_REQUIRED" ? 401 : code === "MASTER_MANAGER_NOT_AUTHORIZED" ? 403 : 400;
  const messages: Record<string, string> = {
    AUTH_REQUIRED: "Sessão autenticada obrigatória.",
    MANAGER_AUTH_REQUIRED: "Sessão de gestor obrigatória.",
    MASTER_MANAGER_NOT_AUTHORIZED: "Apenas o Gestor Master pode revelar estes dados.",
    DEVICE_NOT_FOUND: "Dispositivo não encontrado.",
    VAULT_KEY_MISSING: "Runtime do vault sem chave configurada.",
    VAULT_KEY_INVALID: "Chave do vault inválida.",
    REVEAL_DECRYPT_FAILED: "Não foi possível revelar os dados protegidos.",
    INVALID_REQUEST: "Requisição inválida.",
  };
  return response({ success: false, code, message: messages[code] }, status);
}

async function handle(request: Request): Promise<Response> {
  if (request.method !== "POST") return response({ success: false, code: "INVALID_REQUEST" }, 405);
  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) fail("MANAGER_AUTH_REQUIRED");
  const supabaseUrl = env("SUPABASE_URL");
  const anonKey = env("SUPABASE_ANON_KEY");
  const accessToken = authorization.slice(7).trim();
  const supabase = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } });
  const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
  if (userError || !userData.user?.id) fail("AUTH_REQUIRED");

  const body: unknown = await request.json();
  if (!isRecord(body) || body.operation !== "REVEAL_DEVICE_SENSITIVE" || typeof body.deviceId !== "string" || !body.deviceId.trim()) {
    fail("INVALID_REQUEST");
  }

  const { data, error } = await supabase.rpc("rpc_manager_get_device_sensitive_envelope", {
    p_device_id: body.deviceId.trim(),
  });
  if (error) throw new RevealError(error.message);
  if (!isRecord(data) || data.success !== true || !isRecord(data.device)) fail("REVEAL_DECRYPT_FAILED");

  const device = data.device;
  const keyEnvelope = isRecord(data.permanentKeyEnvelope) ? data.permanentKeyEnvelope : null;
  const sourceEnvelope = isRecord(data.sourceEnvelope) ? data.sourceEnvelope : null;
  let permanentActivationKey: string | null = null;
  let sourceConfig: RecordValue | null = null;

  if (keyEnvelope) {
    const keyVersion = typeof keyEnvelope.keyVersion === "string" ? keyEnvelope.keyVersion : "v1";
    const decrypted = await decryptEnvelope(
      keyEnvelope,
      `${String(keyEnvelope.deviceId)}\u0000${String(keyEnvelope.displayCode)}\u0000${keyVersion}`,
    );
    if (typeof decrypted.activationKey !== "string") fail("REVEAL_DECRYPT_FAILED");
    permanentActivationKey = decrypted.activationKey;
  }

  if (sourceEnvelope) {
    const protocol = String(sourceEnvelope.protocol);
    const sourceVersion = Number(sourceEnvelope.sourceVersion);
    const keyVersion = typeof sourceEnvelope.keyVersion === "string" ? sourceEnvelope.keyVersion : "v1";
    sourceConfig = await decryptEnvelope(
      sourceEnvelope,
      `${String(sourceEnvelope.sourceId)}\u0000${sourceVersion}\u0000${protocol}`,
    );
  }

  return response({
    success: true,
    device: {
      deviceId: device.deviceId,
      displayCode: device.displayCode,
      deviceType: device.deviceType,
      deviceLabel: device.deviceLabel,
      status: device.status,
      licenseId: device.licenseId,
      licenseStatus: device.licenseStatus,
    },
    permanentActivationKey,
    source: sourceEnvelope ? {
      sourceId: sourceEnvelope.sourceId,
      sourceVersion: sourceEnvelope.sourceVersion,
      protocol: sourceEnvelope.protocol,
      displayName: sourceEnvelope.displayName,
      sourceStatus: sourceEnvelope.sourceStatus,
      config: sourceConfig,
    } : null,
  });
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { status: 200, headers: corsHeaders });
  try {
    return await handle(request);
  } catch (error) {
    return errorResponse(error);
  }
});
