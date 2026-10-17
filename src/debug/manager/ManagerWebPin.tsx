import { useState } from 'react';
import { getSupabaseBrowserClient } from '../../integrations/supabase/client.ts';
import { WEB_ACCESS_ERROR, webAccessRequest } from '../../web-production/web-access.client.ts';

export function ManagerWebPin({ deviceId }: { deviceId: string }) {
  const [open, setOpen] = useState(false), [pin, setPin] = useState(''), [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  if (!open) return <button type="button" className="focusable-item" onClick={() => { setMessage(''); setOpen(true); }}>Configurar PIN de acesso web</button>;
  return <form onSubmit={event => {
    event.preventDefault(); if (busy || !/^\d{6}$/.test(pin) || pin !== confirmation) return;
    setBusy(true); setMessage('');
    void (async () => {
      try {
        const session = await getSupabaseBrowserClient()?.auth.getSession();
        const token = session?.data.session?.access_token;
        if (!token) throw new Error(WEB_ACCESS_ERROR);
        await webAccessRequest('SET_PIN', { deviceId, pin }, token);
        setMessage('PIN de acesso web cadastrado. Sessões web anteriores foram encerradas.');
      } catch { setMessage(WEB_ACCESS_ERROR); }
      finally { setPin(''); setConfirmation(''); setBusy(false); }
    })();
  }}>
    <fieldset disabled={busy} style={{ border: '1px solid #475569', borderRadius: 8, padding: 16 }}>
      <legend>PIN de acesso web</legend>
      <p>Crie apenas o PIN web inicial, diferente do PIN parental. Para cadastrar a recuperação, use Configurações → PIN web no aparelho com este PIN inicial e o PUK.</p>
      <p>Um PIN web já cadastrado só pode ser redefinido pelo responsável com o PUK no aparelho preparado para recuperação.</p>
      <p>Esta alteração não redefine o PIN parental ou o PUK do aparelho.</p>
      <label>Novo PIN (6 dígitos)<input className="focusable-item" type="password" inputMode="numeric" autoComplete="off" maxLength={6} required pattern="[0-9]{6}" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))}/></label>
      <label>Confirmar PIN<input className="focusable-item" type="password" inputMode="numeric" autoComplete="off" maxLength={6} required pattern="[0-9]{6}" value={confirmation} onChange={e => setConfirmation(e.target.value.replace(/\D/g, ''))}/></label>
      <div style={{ display: 'flex', gap: 12, marginTop: 12 }}><button className="focusable-item" type="submit" disabled={pin.length !== 6 || pin !== confirmation}>{busy ? 'Salvando…' : 'Salvar PIN web'}</button>
        <button className="focusable-item" type="button" onClick={() => { setPin(''); setConfirmation(''); setMessage(''); setOpen(false); }}>Fechar</button></div>
      <p role="status" aria-live="polite">{message}</p>
    </fieldset>
  </form>;
}
