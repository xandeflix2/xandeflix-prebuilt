import { useEffect, useRef, useState } from 'react';
import { parentalControl } from '../../parental/parental-control.store.ts';
import { parentalErrorMessage } from '../../parental/parental-access.ts';
import { useParentalControl } from '../hooks/useParentalControl.ts';
import '../pages/ParentalControlPage.css';

export function ParentalPinDialog() {
  const state = useParentalControl(), dialog = useRef<HTMLDialogElement>(null);
  const [pin, setPin] = useState(''), [error, setError] = useState('');
  useEffect(() => {
    if (!state.prompt || !dialog.current) return;
    const element = dialog.current, origin = document.activeElement as HTMLElement | null;
    setPin(''); setError(''); element.showModal(); element.querySelector<HTMLInputElement>('input')?.focus();
    const back = (event: Event) => { event.preventDefault(); parentalControl.cancelPrompt(); };
    window.addEventListener('xandeflix:parental-back', back);
    return () => { window.removeEventListener('xandeflix:parental-back', back); element.close(); if (origin?.isConnected) origin.focus({ preventScroll: true }); };
  }, [state.prompt?.id]);
  useEffect(() => {
    if (state.prompt && !state.busy && error) dialog.current?.querySelector<HTMLInputElement>('input')?.focus();
  }, [state.prompt?.id, state.busy, error]);
  if (!state.prompt) return null;
  const id = state.prompt.id;
  return <dialog ref={dialog} data-detail-modal className="parental-dialog" aria-labelledby="parental-pin-title"
    onCancel={event => { event.preventDefault(); parentalControl.cancelPrompt(); }}>
    <div className="modal-content parental-dialog-content"><h2 id="parental-pin-title">Controle parental</h2>
      <p>{state.prompt.reason}</p>
      <form onSubmit={event => { event.preventDefault(); setError(''); void parentalControl.submitPrompt(id, pin).then(ok => {
        setPin(''); if (!ok) setError('PIN incorreto.');
      }, e => { setPin(''); setError(parentalErrorMessage(e)); }); }}>
        <label>PIN de seis dígitos<input className="focusable-item" type="password" inputMode="numeric" autoComplete="off" maxLength={6} value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))} disabled={state.busy}/></label>
        {error && <p role="alert">{error}</p>}
        <div className="parental-actions"><button type="submit" className="focusable-item btn-primary" disabled={state.busy || pin.length !== 6}>{state.busy ? 'Verificando…' : 'Confirmar'}</button>
          <button type="button" className="focusable-item btn-secondary" onClick={() => parentalControl.cancelPrompt()}>Cancelar</button></div>
      </form>
    </div>
  </dialog>;
}
