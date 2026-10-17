import { useEffect, useRef, useState } from 'react';
import { parentalControl } from '../parental/parental-control.store.ts';
import { readDeviceWebPinState, saveDeviceWebPin, type DeviceWebPinState } from './web-pin-device.service.ts';
import './WebPinSettings.css';
export function WebPinSettings() {
  const [state, setState] = useState<DeviceWebPinState>(), [busy, setBusy] = useState(true), [message, setMessage] = useState('Conferindo o cadastro…');
  const [puk, setPuk] = useState(''), [pin, setPin] = useState(''), [confirmation, setConfirmation] = useState(''), [current, setCurrent] = useState('');
  const mounted = useRef(true);
  const clear = () => { setPuk(''); setPin(''); setConfirmation(''); setCurrent(''); };
  useEffect(() => {
    mounted.current = true;
    void (async () => {
      try { await parentalControl.load(); const result = await readDeviceWebPinState(); if (mounted.current) { setState(result); setMessage(''); } }
      catch { if (mounted.current) setMessage('Não foi possível conferir o cadastro. Confira a conexão e abra esta opção novamente.'); }
      finally { if (mounted.current) setBusy(false); }
    })();
    return () => { mounted.current = false; };
  }, []);
  const needsCurrent = !!state?.configured && !state.recoveryReady;
  const unavailable = !!state?.recoveryReady && !state.localRecoveryReady;
  return <section className="settings-section web-pin-settings">
    <p>Este PIN é exclusivo para entrar no navegador com o código e a chave do aparelho. Use um valor diferente do PIN de conteúdos restritos.</p>
    <p>A recuperação exige o PUK e este aparelho. O PUK não é enviado ao servidor.</p>
    {state && <p>{state.configured ? 'PIN web cadastrado.' : 'PIN web ainda não cadastrado.'} {state.localRecoveryReady ? 'Recuperação por PUK disponível neste aparelho.' : ''}</p>}
    {parentalControl.getSnapshot().status === 'unconfigured' && <p role="alert">Configure primeiro o PIN parental e guarde o PUK em Controle parental. Depois volte aqui para criar outro PIN, exclusivo para a web.</p>}
    {unavailable && <p role="alert">A chave de recuperação não está disponível neste aparelho. Use o aparelho onde a recuperação foi cadastrada. Não é possível substituir essa chave pelo PIN web ou pelo gestor.</p>}
    {state && !unavailable && parentalControl.getSnapshot().status === 'ready' && <form onSubmit={event => {
      event.preventDefault(); if (busy || !/^\d{6}$/.test(pin) || pin !== confirmation) return;
      setBusy(true); setMessage('Conferindo o PUK e salvando…');
      void (async () => {
        try {
          await saveDeviceWebPin(puk, pin, current);
          if (mounted.current) { setState(await readDeviceWebPinState()); setMessage('PIN web salvo. Sessões web anteriores foram encerradas. O PIN parental permanece igual.'); }
        } catch (error) {
          if (mounted.current) setMessage(error instanceof Error && error.message === 'WEB_PIN_MUST_DIFFER' ? 'Escolha um PIN web diferente do PIN parental.' : 'Não foi possível salvar. Confira o PUK, o PIN web atual quando solicitado e a conexão. Bloqueios por tentativas devem ser aguardados.');
        } finally { if (mounted.current) { clear(); setBusy(false); } }
      })();
    }}>
      <fieldset disabled={busy}><legend>{state.recoveryReady ? 'Recuperar ou redefinir PIN web' : 'Criar PIN web e cadastrar recuperação'}</legend>
        {needsCurrent && <><p>O PIN web já foi criado no painel. Confirme esse PIN uma vez para vincular a recuperação por PUK. Sem ele, não é possível cadastrar a recuperação retroativamente.</p><label>PIN web atual<input className="focusable-item" type="password" inputMode="numeric" autoComplete="off" required maxLength={6} pattern="[0-9]{6}" value={current} onChange={e => setCurrent(e.target.value.replace(/\D/g, ''))}/></label></>}
        <label>PUK do aparelho<input className="focusable-item" type="password" autoComplete="off" required minLength={16} maxLength={64} value={puk} onChange={e => setPuk(e.target.value)}/></label>
        <label>Novo PIN web (6 dígitos)<input className="focusable-item" type="password" inputMode="numeric" autoComplete="new-password" required maxLength={6} pattern="[0-9]{6}" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))}/></label>
        <label>Confirmar novo PIN web<input className="focusable-item" type="password" inputMode="numeric" autoComplete="new-password" required maxLength={6} pattern="[0-9]{6}" value={confirmation} onChange={e => setConfirmation(e.target.value.replace(/\D/g, ''))}/></label>
        <button className="focusable-item btn-primary" type="submit" disabled={pin.length !== 6 || pin !== confirmation || puk.length < 16 || (needsCurrent && current.length !== 6)}>{busy ? 'Salvando…' : state.recoveryReady ? 'Salvar novo PIN web com PUK' : 'Cadastrar PIN web'}</button>
      </fieldset>
    </form>}
    <p role="status" aria-live="polite">{message}</p>
  </section>;
}
