import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getActivationHandoffService, tvPlatformLabels, type ActivationTvPlatform } from '../../control-plane/client/activation-handoff.service.ts';
import { isTelevisionPresentation } from '../device-presentation.ts';
import { useDevicePresentation } from '../hooks/useDevicePresentation.ts';
import { shareActivation } from '../activation/activation-share.ts';
import { validDeviceCode } from '../activation/device-code-input.ts';
import './ActivationHandoff.css';

export function ActivationHandoff({ displayCode, activationKey, ready, pending }: { displayCode: string; activationKey: string; ready: boolean; pending: boolean }): React.JSX.Element | null {
  const choice = useDevicePresentation();
  const ua = navigator.userAgent;
  const tv = isTelevisionPresentation(ua, choice);
  const [nickname, setNickname] = useState(''), [managerCode, setManagerCode] = useState('');
  const [platform, setPlatform] = useState<ActivationTvPlatform>(/tizen/i.test(ua) ? 'TIZEN' : /web[0o]s/i.test(ua) ? 'WEBOS' : /aft|fire.?tv/i.test(ua) ? 'FIRE_TV' : 'ANDROID_TV');
  const [busy, setBusy] = useState(false), [feedback, setFeedback] = useState(''), [sent, setSent] = useState(false);
  const controller = useRef<AbortController | null>(null), generation = useRef(0), pendingAction = useRef(false);
  const service = useMemo(() => getActivationHandoffService(), []);
  useEffect(() => { generation.current++; controller.current = new AbortController(); setSent(false); setFeedback(''); setBusy(false); pendingAction.current = false;
    return () => { generation.current++; controller.current?.abort(); }; }, [displayCode, tv, pending]);
  if (!pending) return null;
  const usable = ready && validDeviceCode(displayCode) && /^[0-9]{6}$/.test(activationKey);
  const run = async (action: () => Promise<string>) => {
    if (pendingAction.current || !usable) return;
    const epoch = generation.current; pendingAction.current = true; setBusy(true); setFeedback('');
    try { const message = await action(); if (epoch === generation.current) setFeedback(message); }
    catch (error) { if (epoch === generation.current) setFeedback(error instanceof Error && error.message === 'HANDOFF_ROUTING_INVALID' ? 'Código de atendimento não encontrado. Confira com seu gestor.' : error instanceof Error && error.message === 'HANDOFF_DATA_INVALID' ? 'Informe um nome de 2 a 80 caracteres e confira o código do gestor.' : 'Não foi possível enviar agora. Confira a internet e tente novamente.'); }
    finally { if (epoch === generation.current) { pendingAction.current = false; setBusy(false); } }
  };
  return <section className="activation-handoff" aria-labelledby="activation-handoff-title">
    <h2 id="activation-handoff-title">{tv ? 'Solicitar ativação ao gestor' : 'Enviar dados de ativação'}</h2>
    {tv ? <form onKeyDown={event => {
      const active = event.target;
      if (active instanceof HTMLInputElement && ['ArrowLeft', 'ArrowRight', ' ', 'Enter'].includes(event.key)) {
        event.stopPropagation();
        if (event.key === 'Enter') { event.preventDefault(); active.click(); }
        return;
      }
      if (active instanceof HTMLSelectElement && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault(); event.stopPropagation();
        const options = Object.keys(tvPlatformLabels) as ActivationTvPlatform[];
        const next = options.indexOf(platform) + (event.key === 'ArrowRight' ? 1 : -1);
        setPlatform(options[Math.max(0, Math.min(options.length - 1, next))]);
        return;
      }
      if (active instanceof HTMLSelectElement && ['Enter', ' '].includes(event.key)) { event.stopPropagation(); return; }
      if (!['ArrowUp', 'ArrowDown'].includes(event.key)) return;
      const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('.focusable-item:not([disabled])'));
      const next = controls[controls.indexOf(active as HTMLElement) + (event.key === 'ArrowDown' ? 1 : -1)];
      if (next) { event.preventDefault(); event.stopPropagation(); next.focus({ preventScroll: true }); next.scrollIntoView({ block: 'nearest' }); }
    }} onSubmit={event => { event.preventDefault(); void run(async () => { const epoch = generation.current; await service.send(nickname, platform, managerCode, controller.current?.signal); if (epoch === generation.current) setSent(true); return 'Solicitação enviada. Aguarde a autorização do gestor com o aplicativo aberto.'; }); }}>
      <label>Seu nome ou apelido<input className="focusable-item" required minLength={2} maxLength={80} value={nickname} disabled={busy || sent} onChange={event => setNickname(event.target.value)} autoComplete="off" /></label>
      <label>Sistema da TV<select className="focusable-item" value={platform} disabled={busy || sent} onChange={event => setPlatform(event.target.value as ActivationTvPlatform)}>{Object.entries(tvPlatformLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
      <label>Código de atendimento do gestor (opcional)<input className="focusable-item" maxLength={8} value={managerCode} disabled={busy || sent} onChange={event => setManagerCode(event.target.value.replace(/[^a-z0-9]/gi, '').toUpperCase())} autoComplete="off" /></label>
      <p>Sem código de atendimento, a solicitação será encaminhada ao gestor MASTER.</p>
      <button className="focusable-item btn-primary" type="submit" disabled={!usable || busy || sent}>{busy ? 'Enviando…' : sent ? 'Solicitação enviada' : 'Enviar ao painel do gestor'}</button>
    </form> : <>
      <p>Compartilhe o Código ID e a chave com seu gestor para ativar este aparelho.</p>
      <button type="button" className="focusable-item btn-primary" disabled={!usable || busy} onClick={() => { void run(async () => {
        const result = await shareActivation(displayCode, activationKey);
        return result === 'shared' ? 'Compartilhamento concluído.' : result === 'copied' ? 'Código e chave copiados. Envie-os ao gestor.' : 'Compartilhamento cancelado.';
      }); }}>{busy ? 'Preparando…' : 'Compartilhar código e chave'}</button>
    </>}
    {feedback && <p role="status">{feedback}</p>}
  </section>;
}
