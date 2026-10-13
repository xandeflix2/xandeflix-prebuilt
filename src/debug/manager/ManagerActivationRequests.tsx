import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getActivationHandoffService, tvPlatformLabels, type ActivationNotificationClaim, type ActivationNotificationInbox } from '../../control-plane/client/activation-handoff.service.ts';
import { navigateErrorControls } from '../../ui/dpad-error-controls.ts';
import './ManagerActivationRequests.css';

const empty: ActivationNotificationInbox = { unreadCount: 0, notifications: [], hasMore: false };
export function ManagerActivationRequests({ userId, onOpenClaim }: { userId?: string; onOpenClaim: (claim: ActivationNotificationClaim) => void }): React.JSX.Element | null {
  const service = useMemo(() => getActivationHandoffService(), []);
  const [inbox, setInbox] = useState(empty), [code, setCode] = useState(''), [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false), [feedback, setFeedback] = useState('');
  const dialog = useRef<HTMLDialogElement>(null), bell = useRef<HTMLButtonElement>(null);
  const generation = useRef(0), pending = useRef(false), openRef = useRef(false), controller = useRef<AbortController | null>(null);
  const refresh = useCallback(async (beforeId?: string) => {
    if (!userId || pending.current || !controller.current) return;
    const epoch = generation.current; pending.current = true; setLoading(true);
    try {
      const next = await service.inbox(beforeId, controller.current.signal);
      if (epoch !== generation.current) return;
      setInbox(old => ({ ...next, notifications: beforeId ? [...old.notifications, ...next.notifications.filter(item => !old.notifications.some(previous => previous.id === item.id))] : next.notifications })); setFeedback('');
    } catch { if (epoch === generation.current) setFeedback('Não foi possível consultar as solicitações. Tente atualizar.'); }
    finally { if (epoch === generation.current) { pending.current = false; setLoading(false); } }
  }, [service, userId]);
  useEffect(() => {
    generation.current++; pending.current = false; controller.current = new AbortController(); setInbox(empty); setCode(''); setOpen(false); setFeedback(''); setLoading(false);
    const epoch = generation.current;
    if (userId) {
      void refresh();
      void service.routingCode(controller.current.signal).then(next => { if (epoch === generation.current) setCode(next); }).catch(() => { if (epoch === generation.current) setCode(''); });
    }
    const poll = window.setInterval(() => { if (document.visibilityState === 'visible' && !openRef.current) void refresh(); }, 30_000);
    return () => { generation.current++; controller.current?.abort(); window.clearInterval(poll); };
  }, [userId, service, refresh]);
  useEffect(() => { openRef.current = open;
    if (open && userId) { dialog.current?.showModal(); dialog.current?.querySelector<HTMLButtonElement>('button')?.focus(); }
    else dialog.current?.close();
  }, [open, userId]);
  const close = () => { setOpen(false); dialog.current?.close(); bell.current?.focus({ preventScroll: true }); };
  const activate = async (id: string) => {
    if (pending.current || !controller.current) return;
    const epoch = generation.current; pending.current = true; setLoading(true); setFeedback('');
    try {
      const claim = await service.open(id, controller.current.signal);
      if (epoch !== generation.current) return;
      setInbox(previous => ({ ...previous, unreadCount: Math.max(0, previous.unreadCount - (previous.notifications.some(item => item.id === id && !item.read) ? 1 : 0)), notifications: previous.notifications.map(item => item.id === id ? { ...item, read: true } : item) }));
      close(); onOpenClaim(claim);
    } catch { if (epoch === generation.current) setFeedback('Não foi possível abrir. Atualize a lista: a solicitação pode ter expirado ou o aparelho já foi ativado.'); }
    finally { if (epoch === generation.current) { pending.current = false; setLoading(false); } }
  };
  if (!userId) return null;
  return <div className="manager-activation-notifications">
    <button ref={bell} type="button" className="focusable-item btn-secondary manager-error-bell" title="Solicitações de ativação" aria-label={`Solicitações de ativação: ${inbox.unreadCount} não lidas`} aria-haspopup="dialog" aria-expanded={open} onClick={() => { setOpen(true); void refresh(); }}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h18v13H3ZM8 21h8M12 17v4M12 7v7M8.5 10.5h7" /></svg>
      {inbox.unreadCount > 0 && <span className="manager-error-count">{inbox.unreadCount > 99 ? '99+' : inbox.unreadCount}</span>}
    </button>
    <dialog ref={dialog} data-detail-modal className="modal-content manager-playback-inbox" aria-labelledby="manager-activation-title" onKeyDown={event => navigateErrorControls(event, close)} onCancel={event => { event.preventDefault(); close(); }} onClose={() => setOpen(false)}>
      <header><h2 id="manager-activation-title">Solicitações de ativação</h2><button className="focusable-item btn-secondary" type="button" onClick={close}>Fechar</button></header>
      <p>Seu código de atendimento: <strong>{code || 'Indisponível agora'}</strong>. Informe-o ao usuário para receber a solicitação do aparelho.</p>
      <p>{inbox.unreadCount} não lidas. Clique em uma solicitação para abrir o formulário de ativação.</p>
      <button className="focusable-item btn-secondary" type="button" disabled={loading} onClick={() => { void refresh(); }}>Atualizar solicitações</button>
      {loading && <p role="status">Consultando…</p>}{feedback && <p role="status">{feedback}</p>}
      {!loading && !feedback && !inbox.notifications.length && <p>Nenhuma solicitação recebida.</p>}
      <ul className="manager-error-list">{inbox.notifications.map(item => <li key={item.id}>
        <button className={`focusable-item manager-error-report${item.read ? '' : ' manager-error-report--unread'}`} type="button" disabled={loading || !item.available} onClick={() => { void activate(item.id); }}>
          <strong>{item.nickname} · {item.displayCode}</strong><span>TV · {tvPlatformLabels[item.platform]}</span>
          <span>{new Date(item.receivedAt).toLocaleString()} · {item.available ? item.read ? 'Lida' : 'Não lida' : 'Encerrada ou expirada'}</span>
        </button>
      </li>)}</ul>
      {inbox.hasMore && <button className="focusable-item btn-secondary" type="button" disabled={loading} onClick={() => { void refresh(inbox.notifications.at(-1)?.id); }}>Mais solicitações</button>}
    </dialog>
  </div>;
}
