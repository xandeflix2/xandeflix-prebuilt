import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getPlaybackErrorReportService, type ManagerPlaybackReport, type PlaybackReportInbox } from '../../control-plane/client/playback-error-report.service.ts';
import { copyDiagnostic } from '../../ui/components/PlaybackErrorNotice.tsx';
import { navigateErrorControls } from '../../ui/dpad-error-controls.ts';

const empty: PlaybackReportInbox = { unreadCount: 0, reports: [], hasMore: false };

export function ManagerPlaybackErrors({ userId }: { userId?: string }): React.JSX.Element | null {
  const service = useMemo(() => getPlaybackErrorReportService(), []);
  const dialog = useRef<HTMLDialogElement>(null);
  const bell = useRef<HTMLButtonElement>(null);
  const controller = useRef<AbortController | null>(null);
  const generation = useRef(0), revision = useRef(0), pending = useRef(false), actionPending = useRef(false);
  const openRef = useRef(false);
  const [inbox, setInbox] = useState(empty);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');

  const refresh = useCallback(async (beforeId?: string) => {
    if (!userId || pending.current || actionPending.current || !controller.current) return;
    const epoch = generation.current, version = revision.current;
    pending.current = true; setLoading(true);
    try {
      const next = await service.inbox(beforeId, controller.current.signal);
      if (epoch !== generation.current || version !== revision.current) return;
      setInbox(previous => ({ ...next, reports: beforeId
        ? [...previous.reports, ...next.reports.filter(report => !previous.reports.some(old => old.id === report.id))] : next.reports }));
      setFeedback('');
    } catch {
      if (epoch === generation.current) setFeedback('Não foi possível consultar os relatos. Tente atualizar.');
    } finally {
      if (epoch === generation.current) { pending.current = false; setLoading(false); }
    }
  }, [service, userId]);

  useEffect(() => {
    generation.current++; revision.current++; pending.current = false; actionPending.current = false;
    controller.current = new AbortController();
    setInbox(empty); setOpen(false); setSelected(null); setFeedback(''); setLoading(false); setBusy(false);
    if (userId) void refresh();
    const poll = window.setInterval(() => {
      if (document.visibilityState === 'visible' && !openRef.current) void refresh();
    }, 30_000);
    return () => { generation.current++; controller.current?.abort(); window.clearInterval(poll); };
  }, [userId, refresh]);

  useEffect(() => {
    openRef.current = open;
    if (open && userId) {
      dialog.current?.showModal();
      dialog.current?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
    } else dialog.current?.close();
  }, [open, userId]);

  const close = () => { dialog.current?.close(); setOpen(false); bell.current?.focus({ preventScroll: true }); };
  const read = async (report: ManagerPlaybackReport) => {
    setSelected(report.id);
    if (report.read || actionPending.current || pending.current || !controller.current) return;
    const epoch = generation.current;
    actionPending.current = true; setBusy(true); setFeedback('');
    try {
      await service.markRead(report.id, controller.current.signal);
      if (epoch !== generation.current) return;
      revision.current++;
      setInbox(previous => ({ ...previous,
        unreadCount: Math.max(0, previous.unreadCount - (previous.reports.some(item => item.id === report.id && !item.read) ? 1 : 0)),
        reports: previous.reports.map(item => item.id === report.id ? { ...item, read: true } : item) }));
    } catch {
      if (epoch === generation.current) setFeedback('Não foi possível marcar como lido. Tente abrir o relato novamente.');
    } finally {
      if (epoch === generation.current) { actionPending.current = false; setBusy(false); }
    }
  };
  const detail = inbox.reports.find(report => report.id === selected);
  if (!userId) return null;
  return <div className="manager-playback-notifications">
    <button ref={bell} type="button" className="focusable-item btn-secondary manager-error-bell"
      aria-label={`Relatos de erro: ${inbox.unreadCount} não lidos`} aria-haspopup="dialog" aria-expanded={open}
      onClick={() => { setOpen(true); void refresh(); }}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM9 21h6M12 2V1" /></svg>
      {inbox.unreadCount > 0 && <span className="manager-error-count">{inbox.unreadCount > 99 ? '99+' : inbox.unreadCount}</span>}
    </button>
    <dialog ref={dialog} data-detail-modal className="modal-content manager-playback-inbox" aria-labelledby="manager-errors-title"
      onKeyDown={event => navigateErrorControls(event, close)} onCancel={event => { event.preventDefault(); close(); }} onClose={() => setOpen(false)}>
      <header><h2 id="manager-errors-title">Relatos de reprodução</h2>
        <button type="button" className="focusable-item btn-secondary" onClick={close}>Fechar</button></header>
      <p>{inbox.unreadCount} não lidos</p>
      <button type="button" className="focusable-item btn-secondary" disabled={loading || busy} onClick={() => { setSelected(null); void refresh(); }}>Atualizar relatos</button>
      {loading && <p role="status">Carregando relatos…</p>}
      {feedback && <p role="status">{feedback}</p>}
      {!loading && !inbox.reports.length && !feedback && <p>Nenhum erro reportado.</p>}
      <ul className="manager-error-list">
        {inbox.reports.map(report => <li key={report.id}>
          <button type="button" className={`focusable-item manager-error-report${report.read ? '' : ' manager-error-report--unread'}`}
            aria-pressed={selected === report.id} disabled={busy || loading} onClick={() => { void read(report); }}>
            <strong>{report.customerName || 'Usuário'} · {report.displayCode}</strong>
            <span>{report.deviceLabel} · {report.deviceType}</span>
            <span>{new Date(report.receivedAt).toLocaleString()} · {report.read ? 'Lido' : 'Não lido'}</span>
          </button>
        </li>)}
      </ul>
      {detail && <section className="manager-error-detail" aria-label="Diagnóstico do relato">
        <h3>Dispositivo {detail.displayCode}</h3><pre>{detail.diagnostic}</pre>
        <button type="button" className="focusable-item btn-secondary" disabled={busy} onClick={() => {
          const epoch = generation.current;
          void copyDiagnostic(detail.diagnostic).then(() => { if (epoch === generation.current) setFeedback('Diagnóstico copiado.'); },
            () => { if (epoch === generation.current) setFeedback('Não foi possível copiar. Selecione o texto do diagnóstico.'); });
        }}>Copiar diagnóstico</button>
      </section>}
      {inbox.hasMore && <button type="button" className="focusable-item btn-secondary" disabled={loading || busy}
        onClick={() => { void refresh(inbox.reports.at(-1)?.id); }}>Carregar mais relatos</button>}
    </dialog>
  </div>;
}
