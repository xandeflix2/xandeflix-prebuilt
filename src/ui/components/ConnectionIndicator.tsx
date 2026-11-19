import { useEffect, useState } from 'react';
import { describeNetwork, UNKNOWN_NETWORK, type NetworkStatus, type SourceConnections } from '../../network/diagnostic-policy.ts';
import { watchNetworkStatus } from '../../network/network-status.ts';
import { readSourceConnections } from '../../network/source-connections.ts';
import './NetworkDiagnostics.css';

export function useNetworkStatus(): NetworkStatus {
  const [state, setState] = useState(UNKNOWN_NETWORK);
  useEffect(() => watchNetworkStatus(setState), []);
  return state;
}
export function NetworkBadge({ state, compact = false }: { state: NetworkStatus; compact?: boolean }) {
  const description = describeNetwork(state);
  const ethernet = state.transport === 'ethernet';
  return <span className={`network-badge network-badge--${description.tone}${compact ? ' network-badge--compact' : ''}`} title={description.detail} aria-label={`${description.label}: ${description.detail}`}>
    <span className="network-status-dot" aria-hidden="true" />
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ethernet ? <><path d="M7 3h10v9H7zM9 3v4m3-4v4m3-4v4M12 12v5M4 21v-4h16v4M12 17v4" /></>
        : state.transport === 'wifi' ? <><path d="M2 8a16 16 0 0 1 20 0M5 12a11 11 0 0 1 14 0M8.5 16a5.5 5.5 0 0 1 7 0" /><circle cx="12" cy="20" r=".8" fill="currentColor" /></>
          : <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18" /></>}
    </svg>
    <span className="connection-network-label">{description.label}</span>
    {!compact && <span className="network-status-detail">{description.detail}</span>}
  </span>;
}
export function ConnectionIndicator({ snapshotId, includeNetwork = true }: { snapshotId?: string; includeNetwork?: boolean }) {
  const network = useNetworkStatus(), [connections, setConnections] = useState<SourceConnections | null>(null);
  useEffect(() => {
    let alive = true, running = false, rerun = false;
    let timer: ReturnType<typeof setTimeout> | undefined, active: AbortController | undefined;
    // readSourceConnections verifies the real active pointer and authority itself.
    const eligible = () => document.visibilityState === 'visible' && navigator.onLine !== false && network.connected === true;
    const load = async () => {
      if (!alive || running || !eligible()) return;
      running = true; rerun = false; setConnections(null); active = new AbortController();
      const controller = active, deadline = setTimeout(() => controller.abort(), 8000);
      try { const value = await readSourceConnections(controller.signal); if (alive && !controller.signal.aborted && eligible()) setConnections(value); }
      finally { clearTimeout(deadline); running = false; if (alive && eligible()) { if (rerun) void load(); else timer = setTimeout(() => void load(), 60_000); } }
    };
    const refresh = () => { clearTimeout(timer); active?.abort(); setConnections(null); if (running) rerun = true; else void load(); };
    refresh(); document.addEventListener('visibilitychange', refresh); window.addEventListener('online', refresh); window.addEventListener('offline', refresh);
    return () => { alive = false; clearTimeout(timer); active?.abort(); document.removeEventListener('visibilitychange', refresh); window.removeEventListener('online', refresh); window.removeEventListener('offline', refresh); };
  }, [snapshotId, network.connected]);
  const count = connections ? `${connections.active}/${connections.maximum}` : '—/—';
  const detail = connections ? `Conexões da fonte: ${connections.active} ativas de ${connections.maximum} permitidas. Informação do provedor, sujeita a atraso.` : 'A fonte não informou a contagem de conexões ou a consulta está indisponível.';
  return <div className="connection-indicator" role="status" aria-live="polite" aria-atomic="true">
    {includeNetwork && <NetworkBadge state={network} compact />}
    <span className={`source-connections-badge${connections && connections.active >= connections.maximum ? ' source-connections-badge--full' : ''}`} aria-label={detail} title={detail}>
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="2" y="3" width="14" height="11" rx="2" /><path d="M6 18h6m-3-4v4" /><rect x="18" y="9" width="4" height="12" rx="1" /></svg>{count}
    </span>
  </div>;
}
