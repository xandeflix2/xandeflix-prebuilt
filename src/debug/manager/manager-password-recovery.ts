import type { SupabaseClient } from '@supabase/supabase-js';

export type RecoveryAuth = Pick<SupabaseClient['auth'], 'getUser' | 'resetPasswordForEmail' | 'updateUser' | 'signOut'>;

export function isManagerRecoveryLocation(location: Pick<Location, 'pathname' | 'hash'>): boolean {
  const hash = new URLSearchParams(location.hash.slice(1));
  return location.pathname === '/manager-reset-password' || hash.get('type') === 'recovery' || hash.get('error_code') === 'otp_expired';
}

export function managerRecoveryUrl(origin: string): string {
  const url = new URL(origin);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) {
    throw new Error('RECOVERY_ORIGIN_UNAVAILABLE');
  }
  return new URL('/manager-reset-password', url.origin).href;
}

export async function requestManagerPasswordRecovery(auth: RecoveryAuth, email: string, origin: string): Promise<void> {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) throw new Error('RECOVERY_EMAIL_INVALID');
  const { error } = await auth.resetPasswordForEmail(email.trim(), { redirectTo: managerRecoveryUrl(origin) });
  if (error) throw new Error('RECOVERY_EMAIL_FAILED');
}

export async function saveManagerRecoveryPassword(auth: RecoveryAuth, expectedUserId: string, password: string, confirmation: string): Promise<void> {
  if (password.length < 12) throw new Error('RECOVERY_PASSWORD_TOO_SHORT');
  if (password !== confirmation) throw new Error('RECOVERY_PASSWORD_MISMATCH');
  const verified = await auth.getUser();
  if (verified.error || !verified.data.user || verified.data.user.id !== expectedUserId) throw new Error('RECOVERY_SESSION_INVALID');
  const updated = await auth.updateUser({ password });
  if (updated.error || updated.data.user?.id !== expectedUserId) throw new Error('RECOVERY_PASSWORD_FAILED');
  try {
    const { error } = await auth.signOut({ scope: 'global' });
    if (error) throw new Error('RECOVERY_SIGNOUT_FAILED');
  } catch {
    throw new Error('RECOVERY_PASSWORD_SAVED_SIGNOUT_FAILED');
  }
}
