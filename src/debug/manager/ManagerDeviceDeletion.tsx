import { useState } from 'react';
interface Props { displayCode: string; onDelete: (confirmationCode: string) => Promise<void>; }
export function ManagerDeviceDeletion({ displayCode, onDelete }: Props) {
  const [open, setOpen] = useState(false), [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState(false);
  const normalized = confirmation.trim().toUpperCase();
  if (!open) return <button type="button" className="focusable-item" onClick={() => setOpen(true)}>Excluir dispositivo e chave</button>;
  return <form onSubmit={async event => {
    event.preventDefault();
    if (busy || normalized !== displayCode) return;
    setBusy(true); setError(false);
    try { await onDelete(normalized); setOpen(false); setConfirmation(''); }
    catch { setError(true); }
    finally { setBusy(false); }
  }} style={{ border: '1px solid #ef4444', padding: 16, borderRadius: 8, marginTop: 12 }}>
    <p>A exclusão é permanente. O dispositivo perde a autorização e sua chave cadastrada será removida.</p>
    <label>Digite {displayCode} para confirmar<input aria-label="Código para confirmar exclusão" value={confirmation} disabled={busy} autoComplete="off" onChange={event => setConfirmation(event.target.value)} /></label>
    <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
      <button type="submit" className="focusable-item" disabled={busy || normalized !== displayCode}>{busy ? 'Excluindo…' : 'Confirmar exclusão permanente'}</button>
      <button type="button" className="focusable-item" disabled={busy} onClick={() => { setOpen(false); setConfirmation(''); }}>Cancelar</button>
    </div>
    {error && <p role="alert">Não foi possível excluir. Verifique sua sessão e tente novamente.</p>}
  </form>;
}
