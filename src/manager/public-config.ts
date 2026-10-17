const MANAGER_SUPABASE_URL = 'https://cujbmyhitgomlgwfkaat.supabase.co';

/** Only the existing project's public browser key belongs in this build. */
export function resolveManagerPublicConfig(env: Record<string, unknown>): { url: string; key: string } {
  const url = typeof env.VITE_SUPABASE_URL === 'string' ? env.VITE_SUPABASE_URL.trim() : '';
  const key = typeof env.VITE_SUPABASE_PUBLISHABLE_KEY === 'string' ? env.VITE_SUPABASE_PUBLISHABLE_KEY.trim() : '';
  if (url !== MANAGER_SUPABASE_URL) throw new Error('MANAGER_CANONICAL_SUPABASE_REQUIRED');
  if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) throw new Error('MANAGER_PUBLIC_KEY_REQUIRED');
  return { url, key };
}
