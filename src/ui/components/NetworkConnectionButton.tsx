import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { describeNetwork } from '../../network/diagnostic-policy.ts';
import { useNetworkStatus } from './ConnectionIndicator.tsx';
import { NetworkSettings } from './NetworkSettings.tsx';
import { openSettingsWindow } from '../settings/settings-window.ts';
import '../pages/SettingsPage.css';
import './NetworkDiagnostics.css';

export function NetworkConnectionButton({ onOpenChange }: { onOpenChange?: (open: boolean) => void }) {
  const state = useNetworkStatus(), description = describeNetwork(state);
  const trigger = useRef<HTMLButtonElement>(null), dialog = useRef<HTMLDialogElement>(null);
  const cleanup = useRef<(() => void) | undefined>(), titleId = useId();
  const [open, setOpen] = useState(false);
  useEffect(() => () => { cleanup.current?.(); onOpenChange?.(false); }, [onOpenChange]);
  useEffect(() => {
    if (!open) return;
    const back = (event: KeyboardEvent) => {
      if (event.key !== 'Back' && event.keyCode !== 4) return;
      event.preventDefault(); event.stopImmediatePropagation(); dialog.current?.close();
    };
    window.addEventListener('keydown', back, true);
    return () => window.removeEventListener('keydown', back, true);
  }, [open]);
  const validated = state.connected === true && state.validated === true && !state.captive;
  return <>
    <button ref={trigger} type="button" className={`focusable-item network-connection-button${validated ? ' network-connection-button--online' : ''}`}
      aria-label={`Internet e conexão: ${description.detail}`} title={`Internet e conexão — ${description.detail}`} aria-haspopup="dialog" onClick={() => {
        if (!dialog.current || !trigger.current) return;
        cleanup.current?.(); setOpen(true); onOpenChange?.(true);
        cleanup.current = openSettingsWindow(dialog.current, trigger.current);
      }}>
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {state.transport === 'ethernet' ? <><path d="M7 3h10v9H7zM9 3v4m3-4v4m3-4v4M12 12v5M4 21v-4h16v4M12 17v4" /></>
          : <><path d="M2 8a16 16 0 0 1 20 0M5 12a11 11 0 0 1 14 0M8.5 16a5.5 5.5 0 0 1 7 0" /><circle cx="12" cy="20" r=".8" fill="currentColor" /></>}
      </svg>
    </button>
    {typeof document !== 'undefined' && createPortal(<dialog ref={dialog} data-settings-modal data-network-dialog className="settings-window network-connection-window" aria-labelledby={titleId}
      onClose={() => { setOpen(false); onOpenChange?.(false); }} onCancel={event => { event.preventDefault(); event.currentTarget.close(); }}>
      <div className="settings-window-header"><h2 id={titleId}>Internet e conexão</h2>
        <button type="button" className="focusable-item settings-window-close btn-secondary" data-settings-close onClick={() => dialog.current?.close()}>Fechar</button>
      </div>
      <div className="settings-window-body">{open && <NetworkSettings measurementAllowed={false} />}</div>
    </dialog>, document.body)}
  </>;
}
