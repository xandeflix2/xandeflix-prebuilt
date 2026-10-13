import React, { useEffect, useRef, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { requestManagerPasswordRecovery, saveManagerRecoveryPassword } from './manager-password-recovery.ts';
import './ManagerPasswordRecovery.css';

export function ManagerPasswordRecovery({ client, recoveryLink, linkError }: { client: SupabaseClient | undefined; recoveryLink: boolean; linkError: boolean }) {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [saved, setSaved] = useState(false);
  const [signOutPending, setSignOutPending] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  const busyRef = useRef(false);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = window.setTimeout(() => setResendSeconds(value => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [resendSeconds]);

  useEffect(() => {
    let active = true;
    if (!client) { setChecking(false); setMessage('A conexão com o serviço de acesso está indisponível.'); return; }
    if (!recoveryLink || linkError) {
      setChecking(false);
      if (linkError) setMessage('Este link expirou ou não pode mais ser usado. Solicite um novo link e abra somente o email mais recente.');
      return;
    }
    void client.auth.getUser().then(({ data, error }) => {
      if (!active) return;
      if (!linkError && !error && data.user?.email) {
        setUser({ id: data.user.id, email: data.user.email });
      } else setMessage('Não foi possível confirmar o link. Solicite um novo link e abra somente o email mais recente.');
      setChecking(false);
    }).catch(() => {
      if (active) { setChecking(false); setMessage('Não foi possível verificar o acesso. Solicite um novo link.'); }
    });
    return () => { active = false; };
  }, [client, recoveryLink, linkError]);

  async function request(event: React.FormEvent) {
    event.preventDefault();
    if (!client || busyRef.current || resendSeconds > 0) return;
    busyRef.current = true; setBusy(true);
    try {
      await requestManagerPasswordRecovery(client.auth, email, window.location.origin);
      setResendSeconds(60);
      setMessage('Se o email estiver cadastrado, você receberá um link para definir sua nova senha. Abra somente o email mais recente neste computador.');
    } catch {
      setMessage('Não foi possível solicitar o email. Aguarde alguns minutos e tente novamente ou use a recuperação no Supabase.');
    } finally { busyRef.current = false; setBusy(false); }
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!client || !user || busyRef.current) return;
    busyRef.current = true; setBusy(true);
    try {
      await saveManagerRecoveryPassword(client.auth, user.id, password, confirmation);
      setSaved(true); setUser(null); setMessage('Senha atualizada. Entre novamente no painel com sua nova senha.');
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      if (code === 'RECOVERY_PASSWORD_SAVED_SIGNOUT_FAILED') {
        setSaved(true); setUser(null); setSignOutPending(true);
        setMessage('Senha atualizada, mas as sessões anteriores não puderam ser encerradas. Tente encerrar novamente antes de entrar.');
      } else if (code === 'RECOVERY_PASSWORD_MISMATCH') setMessage('As duas senhas devem ser iguais.');
      else if (code === 'RECOVERY_PASSWORD_TOO_SHORT') setMessage('Use uma senha com pelo menos 12 caracteres.');
      else if (code === 'RECOVERY_SESSION_INVALID') { setUser(null); setMessage('O acesso expirou ou mudou. Solicite um novo link.'); }
      else setMessage('Não foi possível salvar a senha. Verifique os requisitos da senha e solicite um novo link se necessário.');
    } finally { setPassword(''); setConfirmation(''); busyRef.current = false; setBusy(false); }
  }

  async function retrySignOut() {
    if (!client || busyRef.current) return;
    busyRef.current = true; setBusy(true);
    try {
      const { error } = await client.auth.signOut({ scope: 'global' });
      if (error) throw error;
      setSignOutPending(false); setMessage('Sessões encerradas. Entre no painel com a nova senha.');
    } catch { setMessage('Não foi possível encerrar todas as sessões. Tente novamente em alguns minutos.'); }
    finally { busyRef.current = false; setBusy(false); }
  }

  return <main className="manager-recovery">
    <section aria-labelledby="recovery-title">
      <p className="manager-recovery__brand">XANDEFLIX</p>
      <h1 id="recovery-title">{user && !saved ? 'Definir nova senha' : 'Recuperar acesso ao painel'}</h1>
      {checking ? <p role="status">Verificando seu acesso…</p> : user && !saved ? <>
        <p>Defina a nova senha de <strong>{user.email}</strong>.</p>
        <form onSubmit={event => void save(event)}>
          <label htmlFor="recovery-password">Nova senha (pelo menos 12 caracteres)</label>
          <input id="recovery-password" type="password" autoComplete="new-password" minLength={12} required disabled={busy} value={password} onChange={event => setPassword(event.target.value)} />
          <label htmlFor="recovery-confirmation">Confirme a nova senha</label>
          <input id="recovery-confirmation" type="password" autoComplete="new-password" minLength={12} required disabled={busy} value={confirmation} onChange={event => setConfirmation(event.target.value)} />
          <button type="submit" disabled={busy}>{busy ? 'Salvando…' : 'Salvar nova senha'}</button>
        </form>
      </> : !saved && <form onSubmit={event => void request(event)}>
        <p>Receba um link no seu email para definir uma nova senha.</p>
        <label htmlFor="recovery-email">Email da conta</label>
        <input id="recovery-email" type="email" autoComplete="username" required disabled={busy || !client} value={email} onChange={event => setEmail(event.target.value)} />
        <button type="submit" disabled={busy || !client || resendSeconds > 0}>{busy ? 'Solicitando…' : resendSeconds > 0 ? `Reenviar em ${resendSeconds}s` : 'Enviar link de recuperação'}</button>
      </form>}
      {message && <p role="status" aria-live="polite">{message}</p>}
      {signOutPending && <button type="button" disabled={busy} onClick={() => void retrySignOut()}>Encerrar sessões anteriores</button>}
      {!signOutPending && <a href="/">Voltar ao aplicativo</a>}
    </section>
  </main>;
}
