import React, { useEffect, useRef, useState } from 'react';
import { Browser } from '@capacitor/browser';
import { getMultiDeviceContactService } from '../../control-plane/client/multi-device-contact.service.ts';
import { whatsappPlaybackSupportUrl } from '../../playback/playback-support-diagnostic.ts';
import { createPlaybackReportRequestId, getPlaybackErrorReportService } from '../../control-plane/client/playback-error-report.service.ts';
import { usePhoneLayout } from '../hooks/usePhoneLayout.ts';
import { navigateErrorControls } from '../dpad-error-controls.ts';
import { canUsePlaybackWhatsapp } from '../playback-support-profile.ts';
import { GoogleCast, hasGoogleCast } from '../../playback/google-cast.ts';

interface PlaybackErrorNoticeProps {
  message: string | null;
  diagnostic?: string | null;
  onDismiss: () => void;
}

export async function copyDiagnostic(text: string): Promise<void> {
  try {
    if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); return; }
  } catch { /* Some WebViews deny the modern clipboard API; use the local fallback. */ }
  const previous = document.activeElement;
  const field = document.createElement('textarea');
  field.value = text;
  field.readOnly = true;
  field.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
  document.body.appendChild(field);
  try {
    field.select();
    if (!document.execCommand('copy')) throw new Error('COPY_UNAVAILABLE');
  } finally {
    field.remove();
    if (previous instanceof HTMLElement && previous.isConnected) previous.focus({ preventScroll: true });
  }
}

export function PlaybackErrorNotice({ message, diagnostic, onDismiss }: PlaybackErrorNoticeProps): React.JSX.Element | null {
  const phone = usePhoneLayout();
  const whatsappCandidate = typeof navigator !== 'undefined'
    && canUsePlaybackWhatsapp(navigator.userAgent, navigator.maxTouchPoints);
  const section = useRef<HTMLElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const reportRequest = useRef<string | null>(null);
  const reportAbort = useRef<AbortController | null>(null);
  const actionFocus = useRef<{ generation: number; target: Element | null } | null>(null);
  const dismiss = useRef(onDismiss);
  const generation = useRef(0);
  const actionPending = useRef(false);
  const [whatsapp, setWhatsapp] = useState('');
  const [whatsappAvailable, setWhatsappAvailable] = useState(whatsappCandidate && !hasGoogleCast());
  const [feedback, setFeedback] = useState('');
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const close = () => {
    dismiss.current();
    if (previousFocus.current?.isConnected) previousFocus.current.focus({ preventScroll: true });
  };
  useEffect(() => { dismiss.current = onDismiss; }, [onDismiss]);
  useEffect(() => {
    generation.current += 1;
    actionPending.current = false;
    setWhatsapp(''); setFeedback(''); setBusy(false); setHovered(false); setFocused(false); setSent(false);
    setWhatsappAvailable(whatsappCandidate && !hasGoogleCast());
    reportRequest.current = null;
    actionFocus.current = null;
    reportAbort.current?.abort();
    if (!message || !diagnostic) return;
    const controller = new AbortController();
    let active = true;
    const allowWhatsapp = () => {
      if (!active) return;
      setWhatsappAvailable(true);
      void getMultiDeviceContactService().readPublic(controller.signal)
        .then(contact => { if (active) setWhatsapp(contact.whatsapp); }).catch(() => {});
    };
    if (whatsappCandidate) {
      if (hasGoogleCast()) void GoogleCast.status().then(status => {
        if (status.mobile) allowWhatsapp();
      }).catch(allowWhatsapp);
      else allowWhatsapp();
    }
    return () => {
      active = false; generation.current += 1; controller.abort(); reportAbort.current?.abort();
      actionFocus.current = null;
    };
  }, [message, diagnostic, phone, whatsappCandidate]);
  useEffect(() => {
    if (busy || phone || !actionFocus.current) return;
    const pending = actionFocus.current;
    actionFocus.current = null;
    const notice = section.current, active = document.activeElement;
    if (pending.generation !== generation.current || !notice
      || (notice.contains(active) && !(active as HTMLButtonElement)?.disabled)) return;
    // Run after React commits enabled controls; a clipboard fallback cannot
    // refocus its original button while the action has it disabled.
    const target = pending.target instanceof HTMLElement && notice.contains(pending.target)
      && !(pending.target as HTMLButtonElement).disabled ? pending.target
      : notice.querySelector<HTMLButtonElement>('button:not([disabled])');
    target?.focus({ preventScroll: true });
  }, [busy, feedback, sent, phone, message, diagnostic]);
  useEffect(() => {
    if (!message) return;
    const previous = document.activeElement;
    previousFocus.current = previous instanceof HTMLElement && !section.current?.contains(previous) ? previous : null;
    const frame = !phone ? requestAnimationFrame(() => {
      (section.current?.querySelector<HTMLButtonElement>('[data-report-error]') || section.current?.querySelector<HTMLButtonElement>('button'))?.focus({ preventScroll: true });
    }) : null;
    const back = (event: Event) => { event.preventDefault(); close(); };
    window.addEventListener('xandeflix:playback-error-back', back);
    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      window.removeEventListener('xandeflix:playback-error-back', back);
    };
  }, [message, diagnostic, phone]);
  useEffect(() => {
    if (!message) return;
    if (hovered || focused || busy) return;
    const timeout = window.setTimeout(() => dismiss.current(), 10_000);
    return () => window.clearTimeout(timeout);
  }, [message, diagnostic, hovered, focused, busy]);

  const supportAction = async (action: 'copy' | 'whatsapp' | 'manager') => {
    if (!diagnostic || actionPending.current) return;
    const current = generation.current;
    const previousAction = document.activeElement;
    actionPending.current = true; setBusy(true); setFeedback('');
    try {
      if (action === 'manager') {
        if (sent) return;
        reportRequest.current ??= createPlaybackReportRequestId();
        const controller = new AbortController(); reportAbort.current = controller;
        await getPlaybackErrorReportService().send(diagnostic, reportRequest.current, controller.signal);
      } else if (action === 'copy') await copyDiagnostic(diagnostic);
      else await Browser.open({ url: whatsappPlaybackSupportUrl(diagnostic, whatsapp) });
      if (current === generation.current) {
        if (action === 'manager') setSent(true);
        setFeedback(action === 'manager' ? 'Erro enviado ao gestor.' : action === 'copy' ? 'Diagnóstico copiado. Cole na conversa para análise.' : 'Envie o diagnóstico na conversa do WhatsApp.');
      }
    } catch (error) {
      if (current === generation.current) setFeedback(action === 'manager'
        ? (error instanceof Error && error.message === 'REPORT_RATE_LIMIT' ? 'Muitos relatos enviados. Aguarde um minuto e tente novamente.' : 'Não foi possível enviar ao gestor. Verifique a conexão e tente novamente.')
        : action === 'copy' ? 'Não foi possível copiar. Use Enviar ao gestor.' : 'Não foi possível abrir o WhatsApp. Copie o diagnóstico para enviar.');
    } finally {
      if (current === generation.current) {
        actionPending.current = false;
        actionFocus.current = !phone ? { generation: current, target: previousAction } : null;
        setBusy(false);
      }
    }
  };
  if (!message) return null;
  return (
    <section ref={section} className="playback-error-notice" role="alert" aria-labelledby="playback-error-heading"
      onKeyDown={event => navigateErrorControls(event, close)}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
      <div>
        <h2 id="playback-error-heading">Erro na reprodução</h2>
        <p>{message}</p>
      </div>
      <button type="button" className="focusable-item btn-secondary" onClick={close}>
        Fechar aviso
      </button>
      {diagnostic && <div className="playback-error-notice-actions">
        <button data-report-error type="button" className="focusable-item btn-secondary" disabled={busy || sent} onClick={() => { void supportAction('manager'); }}>{busy ? 'Enviando…' : sent ? 'Enviado ao gestor' : 'Enviar ao gestor'}</button>
        {whatsappAvailable && <button type="button" className="focusable-item btn-secondary" disabled={busy} onClick={() => { void supportAction('whatsapp'); }}>WhatsApp</button>}
        <button type="button" className="focusable-item btn-secondary" disabled={busy} onClick={() => { void supportAction('copy'); }}>Copiar diagnóstico</button>
        {feedback && <p role="status">{feedback}</p>}
      </div>}
    </section>
  );
}
