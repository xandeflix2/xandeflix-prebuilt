import { useState } from 'react';
import { parentalControl } from '../parental/parental-control.store.ts';
import { DeviceIdentityService } from '../device/device-identity.service.ts';
import { isPublicConsumerWeb } from './session-context.ts';
import { WEB_ACCESS_ERROR, webAccessRequest } from './web-access.client.ts';

export function WebPinEnrollment() {
  const [open, setOpen] = useState(false), [pin, setPin] = useState(''), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  if (isPublicConsumerWeb()) return null;
  if (!open) return <button type="button" className="focusable-item btn-secondary" onClick={() => setOpen(true)}>Usar meu PIN no acesso web</button>;
  return <section><h2>Acesso pelo navegador</h2><p>Confirme seu PIN atual para cadastrá-lo no acesso web deste aparelho. O PUK e as restrições continuam neste aparelho.</p>
    <label>PIN atual<input className="focusable-item" type="password" autoComplete="off" inputMode="numeric" maxLength={6} value={pin} disabled={busy} onChange={event => setPin(event.target.value.replace(/\D/g, ''))}/></label>
    <div className="parental-actions"><button type="button" className="focusable-item btn-primary" disabled={busy || pin.length !== 6} onClick={() => {
      if (busy) return; setBusy(true); setMessage('');
      void (async () => {
        try {
          if (!await parentalControl.authenticate(pin)) throw new Error(WEB_ACCESS_ERROR);
          const activation = await DeviceIdentityService.loadActivationState();
          if (activation?.status !== 'AUTHORIZED' || !activation.deviceAuthToken) throw new Error(WEB_ACCESS_ERROR);
          await webAccessRequest('ENROLL_PIN', { deviceId: activation.deviceId, deviceAuthToken: activation.deviceAuthToken, pin });
          setMessage('PIN cadastrado para acesso web com o código e a chave deste aparelho.');
        } catch { setMessage('Não foi possível cadastrar. Confira o PIN. Se o gestor cadastrou outro PIN web, solicite que ele alinhe os dois valores.'); }
        finally { setPin(''); setBusy(false); }
      })();
    }}>{busy ? 'Cadastrando…' : 'Cadastrar meu PIN'}</button>
      <button type="button" className="focusable-item btn-secondary" disabled={busy} onClick={() => { setPin(''); setMessage(''); setOpen(false); }}>Cancelar</button></div>
    <p role="status" aria-live="polite">{message}</p>
  </section>;
}
