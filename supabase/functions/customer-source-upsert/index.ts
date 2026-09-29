import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.116.0";

type Protocol = "M3U" | "M3U8" | "XTREAM";
type RecordValue = Record<string, unknown>;

const KEY_VERSION = "v1";
const KEY_ENV_NAME = "SOURCE_VAULT_KEY_V1";
const M3U_KEYS = new Set(["playlistUrl", "token", "runtimeOptions"]);
const XTREAM_KEYS = new Set(["endpoint", "username", "password", "token", "runtimeOptions"]);

const SAFE_ERROR_CODES = new Set([
  "METHOD_NOT_ALLOWED",
  "AUTH_REQUIRED",
  "UNAUTHORIZED_LICENSE_ACCESS",
  "INVALID_LICENSE",
  "LICENSE_NOT_ACTIVE",
  "VAULT_KEY_MISSING",
  "VAULT_KEY_INVALID",
  "VAULT_ENCRYPT_FAILED",
  "RPC_FAILED",
  "INVALID_REQUEST",
  "INVALID_SOURCE_ID",
  "INVALID_DISPLAY_NAME",
  "INVALID_SOURCE_TYPE",
  "INVALID_SOURCE_CONFIG",
  "INVALID_SOURCE_CONFIG_FIELDS",
  "INVALID_M3U_PLAYLIST_URL",
  "INVALID_XTREAM_ENDPOINT",
  "INVALID_XTREAM_USERNAME",
  "INVALID_XTREAM_PASSWORD",
  "INVALID_SOURCE_TOKEN",
  "SOURCE_NOT_FOUND",
  "CROSS_CUSTOMER_ACCESS_DENIED",
  "VERSION_CONFLICT",
  "INTERNAL_SANITIZED_ERROR",
]);

const ERROR_MESSAGES: Record<string, string> = {
  METHOD_NOT_ALLOWED: "Método HTTP não permitido para esta boundary.",
  AUTH_REQUIRED: "Autenticação de sessão de cliente obrigatória.",
  UNAUTHORIZED_LICENSE_ACCESS: "Acesso não autorizado a esta licença comercial.",
  INVALID_LICENSE: "Licença especificada inválida.",
  LICENSE_NOT_ACTIVE: "A licença não está ativa para cadastro de fontes.",
  VAULT_KEY_MISSING: "Ambiente do cofre sem chave mestra configurada.",
  VAULT_KEY_INVALID: "Chave mestra do cofre inválida no ambiente do servidor.",
  VAULT_ENCRYPT_FAILED: "Falha na cifragem do envelope no cofre.",
  RPC_FAILED: "Falha na transação atômica do banco de dados.",
  INVALID_REQUEST: "Requisição de fonte de autoatendimento inválida.",
  INVALID_SOURCE_ID: "Identificador de fonte inválido.",
  INVALID_DISPLAY_NAME: "Nome de exibição inválido (1 a 100 caracteres).",
  INVALID_SOURCE_TYPE: "Tipo de fonte não suportado (permitidos: M3U, M3U8, XTREAM).",
  INVALID_SOURCE_CONFIG: "Configuração de fonte inválida.",
  INVALID_SOURCE_CONFIG_FIELDS: "Campos desconhecidos na configuração da fonte.",
  INVALID_M3U_PLAYLIST_URL: "URL da lista M3U inválida ou direcionada para rede privada.",
  INVALID_XTREAM_ENDPOINT: "Endpoint do servidor Xtream inválido ou direcionado para rede privada.",
  INVALID_XTREAM_USERNAME: "Nome de usuário Xtream obrigatório.",
  INVALID_XTREAM_PASSWORD: "Senha Xtream obrigatória.",
  INVALID_SOURCE_TOKEN: "Token da fonte inválido.",
  SOURCE_NOT_FOUND: "Fonte especificada não encontrada.",
  CROSS_CUSTOMER_ACCESS_DENIED: "Acesso negado: a fonte pertence a outro cliente.",
  VERSION_CONFLICT: "Conflito de versão concorrente na atualização da fonte.",
  INTERNAL_SANITIZED_ERROR: "Falha interna sanitizada no cofre de autoatendimento.",
};

export class SanitizedCustomerVaultError extends Error {
  readonly code: string;

  constructor(code: string) {
    super(code);
    this.name = "SanitizedCustomerVaultError";
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
  throw new SanitizedCustomerVaultError(code);
}

function assertProtocol(value: unknown): asserts value is Protocol {
  if (value !== "M3U" && value !== "M3U8" && value !== "XTREAM") {
    fail("INVALID_SOURCE_TYPE");
  }
}

function validateDisplayName(value: unknown): string {
  if (typeof value !== "string") fail("INVALID_DISPLAY_NAME");
  const name = value.trim();
  if (name.length === 0 || name.length > 100) fail("INVALID_DISPLAY_NAME");
  return name;
}

export function assertSafeHttpUrl(value: unknown, errorCode: string): asserts value is string {
  if (typeof value !== "string" || value.length === 0) fail(errorCode);
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") fail(errorCode);
    if (!parsed.hostname || parsed.hostname.length === 0) fail(errorCode);
    const host = parsed.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "0.0.0.0" ||
      host === "::1" ||
      host.startsWith("10.") ||
      host.startsWith("192.168.") ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host) ||
      host.endsWith(".local") ||
      host.endsWith(".internal")
    ) {
      fail(errorCode);
    }
  } catch {
    fail(errorCode);
  }
}

function assertOptionalString(value: unknown, errorCode: string): void {
  if (value !== undefined && (typeof value !== "string" || value.length === 0)) {
    fail(errorCode);
  }
}

export function validateSourceConfig(protocol: Protocol, config: unknown): void {
  if (!isRecord(config)) fail("INVALID_SOURCE_CONFIG");

  const allowedKeys = protocol === "XTREAM" ? XTREAM_KEYS : M3U_KEYS;
  if (Object.keys(config).some((key) => !allowedKeys.has(key))) {
    fail("INVALID_SOURCE_CONFIG_FIELDS");
  }

  if (protocol === "M3U" || protocol === "M3U8") {
    assertSafeHttpUrl(config.playlistUrl, "INVALID_M3U_PLAYLIST_URL");
    assertOptionalString(config.token, "INVALID_SOURCE_TOKEN");
    return;
  }

  assertSafeHttpUrl(config.endpoint, "INVALID_XTREAM_ENDPOINT");
  try {
    const endpoint = new URL(config.endpoint as string);
    if (endpoint.username || endpoint.password) fail("INVALID_XTREAM_ENDPOINT");
  } catch {
    fail("INVALID_XTREAM_ENDPOINT");
  }

  if (typeof config.username !== "string" || config.username.trim().length === 0) {
    fail("INVALID_XTREAM_USERNAME");
  }
  if (typeof config.password !== "string" || config.password.length === 0) {
    fail("INVALID_XTREAM_PASSWORD");
  }
  assertOptionalString(config.token, "INVALID_SOURCE_TOKEN");
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

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function encryptCustomerSourceConfig(
  sourceId: string,
  sourceVersion: number,
  protocol: Protocol,
  config: unknown,
  masterKeyBytes?: Uint8Array,
): Promise<{ ciphertext: string; nonce: string; authTag: string; keyVersion: string }> {
  validateSourceConfig(protocol, config);
  const plaintext = JSON.stringify(config);
  const keyBytes = masterKeyBytes ?? getVaultMasterKey();

  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM" },
    false,
    ["encrypt"],
  );

  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const aad = new TextEncoder().encode(`${sourceId}\u0000${sourceVersion}\u0000${protocol}`);
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: nonce, additionalData: aad, tagLength: 128 },
      key,
      new TextEncoder().encode(plaintext),
    ),
  );

  if (encrypted.byteLength < 16) fail("VAULT_ENCRYPT_FAILED");

  return {
    ciphertext: bytesToHex(encrypted.slice(0, -16)),
    nonce: bytesToHex(nonce),
    authTag: bytesToHex(encrypted.slice(-16)),
    keyVersion: KEY_VERSION,
  };
}

function safeErrorCode(error: unknown): string {
  if (error instanceof SanitizedCustomerVaultError && SAFE_ERROR_CODES.has(error.code)) {
    return error.code;
  }
  const message = error instanceof Error
    ? error.message
    : (isRecord(error) && typeof error.message === "string" ? error.message : "");
  if (message.includes("CROSS_CUSTOMER_SOURCE_ACCESS_DENIED") || message.includes("CROSS_CUSTOMER_ACCESS_DENIED")) {
    return "CROSS_CUSTOMER_ACCESS_DENIED";
  }
  for (const code of SAFE_ERROR_CODES) {
    if (message.includes(code)) return code;
  }
  return "INTERNAL_SANITIZED_ERROR";
}

function statusForErrorCode(code: string): number {
  if (code === "METHOD_NOT_ALLOWED") return 405;
  if (code === "AUTH_REQUIRED") return 401;
  if (code === "UNAUTHORIZED_LICENSE_ACCESS" || code === "CROSS_CUSTOMER_ACCESS_DENIED" || code === "LICENSE_NOT_ACTIVE") {
    return 403;
  }
  if (code === "VERSION_CONFLICT") return 409;
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
  const status = statusForErrorCode(code);
  return response(
    {
      success: false,
      code,
      message: ERROR_MESSAGES[code] ?? "Falha sanitizada no cofre de autoatendimento.",
    },
    status,
  );
}

export async function handleCustomerSourceUpsert(request: Request): Promise<Response> {
  if (request.method !== "POST") fail("METHOD_NOT_ALLOWED");

  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) fail("AUTH_REQUIRED");

  const supabaseUrl = typeof Deno !== "undefined"
    ? Deno.env.get("SUPABASE_URL")
    : process.env.SUPABASE_URL;
  const supabaseAnonKey = typeof Deno !== "undefined"
    ? Deno.env.get("SUPABASE_ANON_KEY")
    : process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) fail("INTERNAL_SANITIZED_ERROR");

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authorization } },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser(authorization.slice(7));
  if (userError || !userData.user?.id) fail("AUTH_REQUIRED");

  const body: unknown = await request.json();
  if (!isRecord(body)) fail("INVALID_REQUEST");

  const operation = body.operation;
  if (operation !== "CREATE_CUSTOMER_SOURCE" && operation !== "UPDATE_CUSTOMER_SOURCE") {
    fail("INVALID_REQUEST");
  }

  if (operation === "CREATE_CUSTOMER_SOURCE") {
    const licenseId = body.licenseId;
    if (typeof licenseId !== "string" || licenseId.length === 0) fail("INVALID_LICENSE");
    const protocol = body.sourceType;
    assertProtocol(protocol);
    const displayName = validateDisplayName(body.displayName);
    const sourceConfig = body.sourceConfig;

    // Gera sourceId opaco no formato csrc_[hex]
    const randomHex = bytesToHex(crypto.getRandomValues(new Uint8Array(8)));
    const sourceId = `csrc_${randomHex}`;
    const initialVersion = 1;

    // Cifra o segredo no servidor usando a chave mestra
    const envelope = await encryptCustomerSourceConfig(sourceId, initialVersion, protocol, sourceConfig);

    // Persiste atomicamente no banco via RPC
    const { data, error } = await supabase.rpc("rpc_customer_create_source", {
      p_license_id: licenseId,
      p_source_type: protocol,
      p_display_name: displayName,
      p_ciphertext: envelope.ciphertext,
      p_nonce: envelope.nonce,
      p_auth_tag: envelope.authTag,
      p_key_version: envelope.keyVersion,
    });

    if (error) {
      throw new SanitizedCustomerVaultError(safeErrorCode(error));
    }

    return response(data as RecordValue);
  }

  // UPDATE_CUSTOMER_SOURCE
  const sourceId = body.sourceId;
  if (typeof sourceId !== "string" || !/^csrc_[a-z0-9]+$/.test(sourceId)) {
    fail("INVALID_SOURCE_ID");
  }

  const displayName = body.displayName ? validateDisplayName(body.displayName) : undefined;
  const sourceConfig = body.sourceConfig;
  let envelope: { ciphertext: string; nonce: string; authTag: string; keyVersion: string } | undefined;

  if (sourceConfig) {
    const protocol = body.sourceType;
    assertProtocol(protocol);

    if (typeof body.expectedVersion === "number") {
      const { data: currentSource } = await supabase
        .from("customer_sources")
        .select("version")
        .eq("source_id", sourceId)
        .single();
      if (currentSource && currentSource.version !== body.expectedVersion) {
        fail("VERSION_CONFLICT");
      }
    }

    const expectedVersion = typeof body.expectedVersion === "number" ? body.expectedVersion : 1;
    const nextVersion = expectedVersion + 1;
    envelope = await encryptCustomerSourceConfig(sourceId, nextVersion, protocol, sourceConfig);
  }

  const { data, error } = await supabase.rpc("rpc_customer_update_source", {
    p_source_id: sourceId,
    p_display_name: displayName ?? null,
    p_ciphertext: envelope?.ciphertext ?? null,
    p_nonce: envelope?.nonce ?? null,
    p_auth_tag: envelope?.authTag ?? null,
    p_key_version: envelope?.keyVersion ?? "v1",
  });

  if (error) {
    throw new SanitizedCustomerVaultError(safeErrorCode(error));
  }

  return response(data as RecordValue);
}

if (typeof Deno !== "undefined" && typeof Deno.serve === "function") {
  Deno.serve(async (request: Request) => {
    if (request.method === "OPTIONS") {
      return new Response("ok", { status: 200, headers: corsHeaders });
    }
    try {
      return await handleCustomerSourceUpsert(request);
    } catch (error) {
      return errorResponse(error);
    }
  });
}
