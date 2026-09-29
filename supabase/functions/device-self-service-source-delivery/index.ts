import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.116.0";

type Protocol = "M3U" | "M3U8" | "XTREAM";
type RecordValue = Record<string, unknown>;

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
  "INVALID_DEVICE_TOKEN_PROOF",
  "DEVICE_NOT_BOUND_TO_LICENSE",
  "LICENSE_ACCESS_DENIED",
  "TRIAL_EXPIRED",
  "LICENSE_EXPIRED",
  "LICENSE_SUSPENDED",
  "NO_ACTIVE_SOURCE_FOR_LICENSE",
  "VAULT_SECRET_NOT_FOUND",
  "VAULT_SECRET_VERSION_NOT_FOUND",
  "VAULT_KEY_MISSING",
  "VAULT_KEY_INVALID",
  "VAULT_DECRYPT_FAILED",
  "INTERNAL_SANITIZED_ERROR",
]);

const ERROR_MESSAGES: Record<string, string> = {
  METHOD_NOT_ALLOWED: "Método HTTP não permitido para esta boundary.",
  INVALID_REQUEST: "Requisição de entrega de autoatendimento inválida.",
  DEVICE_NOT_AUTHORIZED: "Dispositivo não autorizado para entrega.",
  INVALID_DEVICE_TOKEN_PROOF: "Prova de autenticação do dispositivo inválida.",
  DEVICE_NOT_BOUND_TO_LICENSE: "Dispositivo não associado à licença especificada.",
  LICENSE_ACCESS_DENIED: "Acesso comercial à licença negado.",
  TRIAL_EXPIRED: "Período de teste comercial expirado.",
  LICENSE_EXPIRED: "Licença comercial expirada.",
  LICENSE_SUSPENDED: "Licença comercial suspensa.",
  NO_ACTIVE_SOURCE_FOR_LICENSE: "Nenhuma fonte de autoatendimento ativa para esta licença.",
  VAULT_SECRET_NOT_FOUND: "Segredo cifrado não encontrado no cofre.",
  VAULT_KEY_MISSING: "Chave mestra ausente no runtime do servidor.",
  VAULT_KEY_INVALID: "Chave mestra inválida no runtime do servidor.",
  VAULT_DECRYPT_FAILED: "Falha na decifragem segura do segredo no servidor.",
  INTERNAL_SANITIZED_ERROR: "Falha interna sanitizada na entrega de autoatendimento.",
};

export class DeliveryError extends Error {
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

export function getVaultMasterKey(): Uint8Array {
  const rawKey = typeof Deno !== "undefined"
    ? Deno.env.get(KEY_ENV_NAME)
    : process.env[KEY_ENV_NAME];
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

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function decryptCustomerSourceConfig(
  sourceId: string,
  sourceVersion: number,
  protocol: Protocol,
  ciphertext: string,
  nonce: string,
  authTag: string,
  masterKeyBytes?: Uint8Array,
): Promise<RecordValue> {
  const encrypted = hexToBytes(ciphertext, ciphertext.length / 2);
  const iv = hexToBytes(nonce, 12);
  const tag = hexToBytes(authTag, 16);
  const combined = new Uint8Array(encrypted.byteLength + tag.byteLength);
  combined.set(encrypted, 0);
  combined.set(tag, encrypted.byteLength);

  const keyBytes = masterKeyBytes ?? getVaultMasterKey();

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      keyBytes,
      { name: "AES-GCM" },
      false,
      ["decrypt"],
    );

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
    if (!isRecord(parsed)) fail("VAULT_DECRYPT_FAILED");
    return parsed;
  } catch (error) {
    if (error instanceof DeliveryError) throw error;
    fail("VAULT_DECRYPT_FAILED");
  }
}

function safeErrorCode(error: unknown): string {
  if (error instanceof DeliveryError && SAFE_ERROR_CODES.has(error.code)) {
    return error.code;
  }
  return "INTERNAL_SANITIZED_ERROR";
}

function statusForErrorCode(code: string): number {
  if (code === "METHOD_NOT_ALLOWED") return 405;
  if (
    code === "DEVICE_NOT_AUTHORIZED" ||
    code === "INVALID_DEVICE_TOKEN_PROOF" ||
    code === "DEVICE_NOT_BOUND_TO_LICENSE" ||
    code === "LICENSE_ACCESS_DENIED" ||
    code === "TRIAL_EXPIRED" ||
    code === "LICENSE_EXPIRED" ||
    code === "LICENSE_SUSPENDED"
  ) {
    return 403;
  }
  if (code === "INTERNAL_SANITIZED_ERROR" || code === "VAULT_KEY_MISSING" || code === "VAULT_KEY_INVALID") {
    return 500;
  }
  return 400;
}

function response(body: RecordValue, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function errorResponse(error: unknown): Response {
  const code = safeErrorCode(error);
  return response(
    {
      success: false,
      code,
      message: ERROR_MESSAGES[code] ?? "Falha na entrega segura da fonte.",
    },
    statusForErrorCode(code),
  );
}

export async function handleDeviceSelfServiceSourceDelivery(request: Request): Promise<Response> {
  if (request.method !== "POST") fail("METHOD_NOT_ALLOWED");

  const body: unknown = await request.json();
  if (!isRecord(body)) fail("INVALID_REQUEST");

  const deviceId = body.deviceId;
  const deviceAuthToken = body.deviceAuthToken;
  const licenseId = body.licenseId;

  if (
    typeof deviceId !== "string" || deviceId.length === 0 ||
    typeof deviceAuthToken !== "string" || deviceAuthToken.length === 0 ||
    typeof licenseId !== "string" || licenseId.length === 0
  ) {
    fail("INVALID_REQUEST");
  }

  const supabaseUrl = typeof Deno !== "undefined"
    ? Deno.env.get("SUPABASE_URL")
    : process.env.SUPABASE_URL;
  const supabaseServiceKey = typeof Deno !== "undefined"
    ? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    : process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) fail("INTERNAL_SANITIZED_ERROR");

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Validação atômica e recuperação do envelope cifrado via RPC Security Definer
  // A RPC executa:
  // 1. Prova de token e autorização do dispositivo (DEVICE_NOT_AUTHORIZED)
  // 2. Vínculo do dispositivo à licença (DEVICE_NOT_BOUND_TO_LICENSE)
  // 3. Avaliação de direito comercial da licença via evaluate_license_access
  // 4. Busca da fonte ativa e extração do envelope cifrado do Vault
  const { data: resolveResult, error: resolveError } = await supabase.rpc(
    "rpc_device_resolve_self_service_source",
    {
      p_device_id: deviceId,
      p_device_token: deviceAuthToken,
      p_license_id: licenseId,
    },
  );

  if (resolveError || !resolveResult || !isRecord(resolveResult)) {
    fail("INTERNAL_SANITIZED_ERROR");
  }

  if (resolveResult.success !== true) {
    const errCode = typeof resolveResult.code === "string" ? resolveResult.code : "INTERNAL_SANITIZED_ERROR";
    fail(SAFE_ERROR_CODES.has(errCode) ? errCode : "INTERNAL_SANITIZED_ERROR");
  }

  const protocol = resolveResult.sourceType as Protocol;
  const decryptedConfig = await decryptCustomerSourceConfig(
    resolveResult.sourceId as string,
    resolveResult.sourceVersion as number,
    protocol,
    resolveResult.ciphertext as string,
    resolveResult.nonce as string,
    resolveResult.authTag as string,
  );

  return response({
    success: true,
    sourceId: resolveResult.sourceId,
    sourceVersion: resolveResult.sourceVersion,
    protocol: resolveResult.sourceType,
    displayName: resolveResult.displayName,
    sourceConfig: decryptedConfig,
  });
}

if (typeof Deno !== "undefined" && typeof Deno.serve === "function") {
  Deno.serve(async (request: Request) => {
    if (request.method === "OPTIONS") {
      return new Response("ok", { status: 200, headers: corsHeaders });
    }
    try {
      return await handleDeviceSelfServiceSourceDelivery(request);
    } catch (error) {
      return errorResponse(error);
    }
  });
}
