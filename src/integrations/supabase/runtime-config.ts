export type SupabaseRuntimeConfigStatus =
  | 'AVAILABLE'
  | 'MISSING_PUBLIC_RUNTIME_CONFIG'
  | 'INVALID_PUBLIC_RUNTIME_CONFIG';

interface RuntimeSupabaseConfigShape {
  url?: unknown;
  publishableKey?: unknown;
  anonKey?: unknown;
}

type RuntimeGlobal = typeof globalThis & {
  __XANDEFLIX_RUNTIME_CONFIG__?: {
    supabase?: RuntimeSupabaseConfigShape;
  };
};

export interface SupabaseRuntimeConfigStatusSnapshot {
  status: SupabaseRuntimeConfigStatus;
  urlPresent: boolean;
  publishableKeyPresent: boolean;
}

export interface ResolvedSupabaseRuntimeConfig {
  url: string;
  key: string;
}

function asNonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function readRuntimeConfig(): ResolvedSupabaseRuntimeConfig | undefined {
  const runtimeEnv = (import.meta as ImportMeta & {
    env?: Record<string, string | undefined>;
  }).env;
  const runtimeGlobal = globalThis as RuntimeGlobal;
  const runtimeSupabase = runtimeGlobal.__XANDEFLIX_RUNTIME_CONFIG__?.supabase;

  const url = asNonEmptyString(runtimeSupabase?.url) ?? asNonEmptyString(runtimeEnv?.VITE_SUPABASE_URL);
  const key =
    asNonEmptyString(runtimeSupabase?.publishableKey) ??
    asNonEmptyString(runtimeEnv?.VITE_SUPABASE_PUBLISHABLE_KEY) ??
    asNonEmptyString(runtimeSupabase?.anonKey) ??
    asNonEmptyString(runtimeEnv?.VITE_SUPABASE_ANON_KEY);

  if (!url || !key || key === 'your-supabase-anon-or-publishable-key') return undefined;
  return { url, key };
}

function isValidSupabaseUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    const local = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
    return (parsed.protocol === 'https:' || (parsed.protocol === 'http:' && local)) && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

export function getSupabaseRuntimeConfigStatus(): SupabaseRuntimeConfigStatusSnapshot {
  const runtimeEnv = (import.meta as ImportMeta & {
    env?: Record<string, string | undefined>;
  }).env;
  const runtimeGlobal = globalThis as RuntimeGlobal;
  const runtimeSupabase = runtimeGlobal.__XANDEFLIX_RUNTIME_CONFIG__?.supabase;
  const url = asNonEmptyString(runtimeSupabase?.url) ?? asNonEmptyString(runtimeEnv?.VITE_SUPABASE_URL);
  const key =
    asNonEmptyString(runtimeSupabase?.publishableKey) ??
    asNonEmptyString(runtimeEnv?.VITE_SUPABASE_PUBLISHABLE_KEY) ??
    asNonEmptyString(runtimeSupabase?.anonKey) ??
    asNonEmptyString(runtimeEnv?.VITE_SUPABASE_ANON_KEY);

  if (!url || !key || key === 'your-supabase-anon-or-publishable-key') {
    return {
      status: 'MISSING_PUBLIC_RUNTIME_CONFIG',
      urlPresent: Boolean(url),
      publishableKeyPresent: Boolean(key),
    };
  }

  return {
    status: isValidSupabaseUrl(url) ? 'AVAILABLE' : 'INVALID_PUBLIC_RUNTIME_CONFIG',
    urlPresent: true,
    publishableKeyPresent: true,
  };
}

export function getSupabaseRuntimeConfig(): ResolvedSupabaseRuntimeConfig | undefined {
  const config = readRuntimeConfig();
  if (!config || getSupabaseRuntimeConfigStatus().status !== 'AVAILABLE') return undefined;
  return config;
}
