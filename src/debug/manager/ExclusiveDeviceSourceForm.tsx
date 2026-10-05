import React, { useRef, useState } from 'react';
import { createExclusiveSourceReplacement, type ExclusiveSourceAuthority, type ExclusiveSourceTarget } from './exclusive-device-source.ts';

interface Props {
  authority: ExclusiveSourceAuthority;
  target: ExclusiveSourceTarget;
  onClose: () => void;
  onBusyChange: (busy: boolean) => void;
  onApplied: () => void;
}

export const ExclusiveDeviceSourceForm: React.FC<Props> = ({ authority, target, onClose, onBusyChange, onApplied }) => {
  const [replacement] = useState(() => createExclusiveSourceReplacement(authority, target));
  const guard = useRef(false);
  const [name, setName] = useState(`Fonte exclusiva ${target.displayCode}`);
  const [url, setUrl] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [prepared, setPrepared] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [message, setMessage] = useState('');
  const [done, setDone] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (guard.current || done || uncertain) return;
    guard.current = true;
    setBusy(true);
    onBusyChange(true);
    setMessage('Validando autorização e vínculo remoto...');
    try {
      await replacement.apply({ name, playlistUrl: url, confirmed }, () => { setPrepared(true); setUrl(''); });
      setDone(true);
      setMessage('Fonte exclusiva vinculada somente a este dispositivo. No aplicativo, revalide a entrega e importe o novo catálogo pela tela Ativação. Os outros aparelhos mantêm sua fonte.');
      onApplied();
    } catch (error) {
      setUncertain(replacement.isCreationUnconfirmed());
      if (replacement.isCreationUnconfirmed()) setUrl('');
      setMessage(error instanceof Error ? error.message : 'Não foi possível confirmar a troca.');
    } finally {
      guard.current = false;
      setBusy(false);
      onBusyChange(false);
    }
  };

  const fieldStyle: React.CSSProperties = { width: '100%', padding: '0.6rem', background: '#151d30', color: '#fff', border: '1px solid #64748b', borderRadius: 4 };
  return (
    <form onSubmit={submit} aria-label="Trocar fonte exclusiva do dispositivo" style={{ marginTop: '1rem', padding: '1rem', border: '1px solid #38bdf8', borderRadius: 6 }}>
      <h4 style={{ margin: '0 0 0.5rem', color: '#38bdf8' }}>Trocar fonte exclusiva</h4>
      <p>Cliente: <strong>{target.nickname}</strong> — dispositivo: <strong>{target.displayCode}</strong></p>
      <p>Será criada uma fonte nova. A URL e os vínculos da fonte compartilhada não serão editados.</p>
      <p>Use uma URL com credenciais próprias deste usuário. Criar outro vínculo com as mesmas credenciais não elimina limites do provedor. Não inclua credenciais no nome da fonte.</p>
      {!prepared && !done && !uncertain && <>
        <label style={{ display: 'block', marginBottom: '0.75rem' }}>Nome da nova fonte
          <input className="focusable-item" value={name} disabled={busy} maxLength={120} onChange={event => setName(event.target.value)} required style={fieldStyle} />
        </label>
        <label style={{ display: 'block', marginBottom: '0.75rem' }}>URL da fonte M3U/M3U8
          <input className="focusable-item" type="url" value={url} disabled={busy} onChange={event => setUrl(event.target.value)} required autoComplete="off" spellCheck={false} autoCapitalize="none" style={fieldStyle} />
        </label>
      </>}
      {!done && <label style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center' }}>
        <input className="focusable-item" type="checkbox" checked={confirmed} disabled={busy || uncertain} onChange={event => setConfirmed(event.target.checked)} />
        Confirmo a troca somente no dispositivo {target.displayCode}, sem alterar os demais.
      </label>}
      {message && <p role="status" aria-live="polite" style={{ color: done ? '#34d399' : '#cbd5e1' }}>{message}</p>}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {!done && <button className="focusable-item btn-primary" type="submit" disabled={busy || !confirmed || uncertain}>
          {busy ? 'Verificando...' : prepared ? 'Verificar / concluir vínculo' : 'Aplicar somente neste dispositivo'}
        </button>}
        <button className="focusable-item btn-secondary" type="button" onClick={onClose} disabled={busy}>{done ? 'Concluir' : 'Fechar'}</button>
      </div>
    </form>
  );
};
