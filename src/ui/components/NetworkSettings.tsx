import { useEffect, useRef, useState } from 'react';
import { awaitWithAbort, measureInternet, SPEED_MAX_BYTES, type InternetMeasurement } from '../../network/diagnostic-policy.ts';
import { internetTestFetch } from '../../network/network-status.ts';
import { canUpdateSourceCatalog } from '../settings/active-source-status.ts';
import { defaultPlaybackService } from '../../playback/playback.service.ts';
import { GoogleCast, hasGoogleCast } from '../../playback/google-cast.ts';
import { ConnectionIndicator, NetworkBadge, useNetworkStatus } from './ConnectionIndicator.tsx';
import './NetworkDiagnostics.css';

export function NetworkSettings({ measurementAllowed = true }: { measurementAllowed?: boolean }) {
  const network = useNetworkStatus(), active = useRef<AbortController>(), mounted = useRef(false);
  const testButton = useRef<HTMLButtonElement>(null), restoreFocus = useRef(false);
  const [busy, setBusy] = useState(false), [progress, setProgress] = useState(0), [message, setMessage] = useState('');
  const [result, setResult] = useState<InternetMeasurement | null>(null);
  useEffect(() => { if (!busy && restoreFocus.current) { restoreFocus.current = false; testButton.current?.focus({ preventScroll: true }); } }, [busy]);
  const safe = () => measurementAllowed && document.visibilityState === 'visible' && navigator.onLine !== false && Boolean(document.querySelector('.settings-page'))
    && !['RESOLVING', 'READY_TO_START', 'OPENING_NATIVE_PLAYER', 'BUFFERING', 'PLAYING', 'PAUSED'].includes(defaultPlaybackService.getCurrentSession().state);
  useEffect(() => {
    mounted.current = true;
    const cancelIfBusy = () => { if (!safe()) active.current?.abort(); };
    const unsubscribe = defaultPlaybackService.subscribe(cancelIfBusy);
    document.addEventListener('visibilitychange', cancelIfBusy); window.addEventListener('offline', cancelIfBusy);
    return () => { mounted.current = false; active.current?.abort(); unsubscribe(); document.removeEventListener('visibilitychange', cancelIfBusy); window.removeEventListener('offline', cancelIfBusy); };
  }, [measurementAllowed]);
  const run = async () => {
    if (!measurementAllowed) return;
    if (active.current) return;
    const controller = new AbortController(); active.current = controller; setBusy(true); setResult(null); setProgress(0); setMessage('Conferindo se é possível iniciar…');
    let castHandle: Awaited<ReturnType<typeof GoogleCast.addListener>> | undefined;
    const guardTimeout = setTimeout(() => controller.abort(), 5000);
    try {
      if (!await awaitWithAbort(canUpdateSourceCatalog(), controller.signal) || !safe()) { if (mounted.current) setMessage('Pare a reprodução ou transmissão antes de testar a internet.'); return; }
      if (hasGoogleCast()) {
        const pendingHandle = GoogleCast.addListener('state', state => { if (state.active) controller.abort(); });
        void pendingHandle.then(handle => { if (controller.signal.aborted || !mounted.current) void handle.remove().catch(() => {}); }, () => {});
        castHandle = await awaitWithAbort(pendingHandle, controller.signal);
        if ((await awaitWithAbort(GoogleCast.status(), controller.signal)).active) throw new Error('INTERNET_TEST_CANCELLED');
      }
      clearTimeout(guardTimeout); if (controller.signal.aborted || !safe()) throw new Error('INTERNET_TEST_CANCELLED');
      if (mounted.current) setMessage('Medindo a conexão…');
      const value = await measureInternet({ signal: controller.signal, canRun: safe, fetchImpl: internetTestFetch(), progress: bytes => { if (mounted.current) setProgress(bytes); } });
      if (mounted.current && !controller.signal.aborted) { setResult(value); setMessage(value.limited ? 'Estimativa parcial: medição encerrada no limite de 15 segundos.' : 'Teste concluído.'); }
    } catch (error) {
      if (mounted.current) setMessage(controller.signal.aborted ? 'Teste cancelado. Nenhuma alteração foi feita na rede.'
        : error instanceof Error && error.message === 'INTERNET_TEST_TIMEOUT' ? 'A conexão não respondeu no tempo do teste. Tente novamente quando a rede estiver estável.'
          : 'Não foi possível medir a conexão com o serviço de teste. Isso não prova que a fonte esteja indisponível.');
    } finally { clearTimeout(guardTimeout); await castHandle?.remove().catch(() => {}); if (active.current === controller) active.current = undefined; if (mounted.current) setBusy(false); }
  };
  return <section className="network-settings" aria-label="Teste de internet">
    <div role="status"><NetworkBadge state={network} /></div>
    <div className="network-source-connections"><span>Conexões da fonte</span><ConnectionIndicator includeNetwork={false} /></div>
    <p className="network-test-note">Ativas/permitidas informadas pela fonte; a atualização pode ter atraso.</p>
    {!measurementAllowed && <p className="network-test-note">Para medir a velocidade, pare a reprodução e abra Internet e conexão em Configurações.</p>}
    <p>Confira a conexão deste aparelho e meça a velocidade aproximada de download.</p>
    <div className="network-test-actions">
      <button ref={testButton} type="button" className="focusable-item btn-primary" disabled={!measurementAllowed || busy || network.connected === false} onClick={() => void run()}>{busy ? 'Testando…' : 'Testar internet'}</button>
      {busy && <button type="button" className="focusable-item btn-secondary" onClick={() => { restoreFocus.current = true; active.current?.abort(); }}>Cancelar teste</button>}
    </div>
    {busy && <progress className="network-test-progress" max={SPEED_MAX_BYTES} value={progress} aria-label="Dados recebidos no teste" />}
    <p className="network-test-feedback" role="status" aria-live="polite">{message}</p>
    {result && <dl className="network-test-results">
      <div><dt>Download estimado</dt><dd>{result.downloadMbps.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} <span>Mbps</span></dd></div>
      <div><dt>Resposta HTTP</dt><dd>{Math.round(result.responseMs)} <span>ms</span></dd></div>
      <div><dt>Dados recebidos</dt><dd>{(result.receivedBytes / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} <span>MB</span></dd></div>
    </dl>}
    <p className="network-test-note">Teste manual via Cloudflare. Consome até 5 MB, inclusive em dados móveis, com até 15 segundos de medição. Fechar esta página cancela o teste.</p>
    <p className="network-test-note">A velocidade varia ao longo do tempo. A resposta HTTP não é ping de rede. O resultado não mede o servidor da fonte nem garante a reprodução de um canal ou qualidade específica.</p>
  </section>;
}
