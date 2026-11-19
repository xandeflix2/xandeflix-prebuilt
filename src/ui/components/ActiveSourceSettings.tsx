import { useEffect, useRef, useState } from 'react';
import { readActiveSourceStatus, updateSourceCatalog, type ActiveSourceStatus } from '../settings/active-source-status.ts';
import { getBootSyncCoordinator } from '../../bootstrap/boot-sync-coordinator.ts';
import { useParentalControl } from '../hooks/useParentalControl.ts';
import { readCatalogReadDiagnostic, type CatalogReadDiagnostic } from '../settings/catalog-read-diagnostic.ts';

function describeSourceStatus(current: ActiveSourceStatus): string {
  if (current.bindingState === 'unbound') return 'Nenhuma fonte ativa vinculada a este dispositivo foi confirmada no gestor.';
  if (current.bindingState === 'unauthorized') return 'A licença ou autorização do dispositivo foi recusada.';
  if (current.bindingState === 'unavailable') return 'A fonte remota não pôde ser confirmada.';
  if (current.comparison === 'changed') return 'A fonte vinculada mudou; a atualização do catálogo está pendente.';
  if (current.comparison === 'same') return 'O catálogo corresponde à fonte vinculada.';
  if (current.bindingState === 'ready') return 'A fonte está autorizada, mas o catálogo local não foi confirmado.';
  return 'Não foi possível determinar o estado da fonte.';
}

export function ActiveSourceSettings({ onOpenAdult }: { onOpenAdult?: () => void }) {
  const parental = useParentalControl(), [status, setStatus] = useState<ActiveSourceStatus>();
  const [busy, setBusy] = useState(false), [action, setAction] = useState<'check' | 'refresh' | null>(null), [message, setMessage] = useState('');
  const [diagnostic, setDiagnostic] = useState<CatalogReadDiagnostic>();
  const mounted = useRef(false), epoch = useRef(0), pending = useRef(false);
  const reload = async (): Promise<ActiveSourceStatus> => { const id = ++epoch.current; const next = await readActiveSourceStatus(); if (mounted.current && epoch.current === id) setStatus(next); return next; };
  useEffect(() => {
    mounted.current = true; void reload().catch(() => { if (mounted.current) setMessage('Falha na consulta da fonte. Nenhum dado foi alterado.'); });
    const unsubscribe = getBootSyncCoordinator().subscribe((_, result) => {
      if (!pending.current && ['PROMOTED','NO_OP'].includes(result?.outcome || '')) void reload();
    });
    return () => { mounted.current = false; epoch.current++; unsubscribe(); };
  }, []);
  const run = async (sync: boolean) => {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setAction(sync ? 'refresh' : 'check');
    setMessage(sync ? 'Atualizando catálogo…' : 'Consultando fonte vinculada no gestor…');
    setDiagnostic(undefined);
    try {
      if (sync) {
        const result = await updateSourceCatalog();
        if (mounted.current) setMessage({
          updated: 'Catálogo atualizado.',
          unchanged: 'A fonte foi consultada e o catálogo já está atualizado.',
          deferred: 'Atualização adiada. Permaneça nas configurações e encerre a reprodução.',
          failed: 'A atualização falhou. O catálogo anterior foi preservado.'
        }[result]);
        await reload();
      } else {
        const result = await reload();
        if (mounted.current) {
          setMessage('Consulta concluída: ' + describeSourceStatus(result));
        }
      }
    } catch {
      if (mounted.current) {
        setMessage('Falha na consulta ou atualização. Nenhum catálogo foi apagado.');
      }
    } finally {
      pending.current = false;
      if (mounted.current) {
        setBusy(false);
        setAction(null);
      }
    }
  };
  const diagnose = async () => {
    if (pending.current) return;
    pending.current = true; setBusy(true);
    try { const result = await readCatalogReadDiagnostic(); if (mounted.current) setDiagnostic(result); }
    finally { pending.current = false; if (mounted.current) setBusy(false); }
  };
  return <section className="settings-section settings-source" aria-labelledby="settings-source-title"><h2 id="settings-source-title">Fonte e catálogo</h2>
    {!status ? <p role="status">Conferindo fonte…</p> : <>
      <p>Fonte em uso: <strong>{status.local?.id || (status.localState === 'absent' ? 'Nenhum catálogo ativo' : 'Não foi possível confirmar')}</strong>{status.local && <> · versão {status.local.version}</>}</p>
      {status.bound && <p>Vinculada no painel: <strong>{status.bound.id}</strong> · versão {status.bound.version}</p>}
      {status.importedAt && <p>Última importação: {new Date(status.importedAt).toLocaleString('pt-BR')}</p>}
      <p role="status">{status.comparison === 'same' ? 'O catálogo corresponde à fonte vinculada.' : status.comparison === 'changed' ? 'Troca de fonte pendente. Atualize o catálogo deste aparelho.'
        : status.bindingState === 'unbound' ? 'Não há fonte ativa vinculada no painel.' : status.bindingState === 'unauthorized' ? 'Não foi possível autorizar o acesso à fonte.' : 'A fonte vinculada ainda não foi confirmada.'}</p>
    </>}
    <p>Verificação automática a cada 15 minutos com o aplicativo aberto e sem reprodução.</p>
    <p>Área 18+: {parental.adultSession ? 'sessão liberada neste aparelho' : 'acesso protegido por PIN'}.</p>
    <button type="button" className="focusable-item btn-secondary" disabled={busy} onClick={() => void run(false)}>{busy && action === "check" ? "Consultando…" : "Conferir fonte"}</button>
    <button type="button" className="focusable-item btn-primary" disabled={busy || status?.bindingState !== 'ready'} onClick={() => void run(true)}>{busy && action === "refresh" ? "Atualizando…" : "Atualizar catálogo"}</button>
    {parental.status === 'ready' && onOpenAdult && <button type="button" className="focusable-item btn-secondary" onClick={onOpenAdult}>Abrir área 18+</button>}
    {status && status.bindingState !== 'ready' && <p role="status" data-source-refresh-blocked>
      Atualização indisponível: {describeSourceStatus(status)}
    </p>}
    {message && <p role="status" aria-live="polite" data-source-action-result>{message}</p>}
    <button type="button" className="focusable-item btn-secondary" disabled={busy} onClick={() => void diagnose()}>Verificar leitura local</button>
    {diagnostic && <div aria-live="polite">
      <p>Totais salvos no manifesto: {diagnostic.totals.movies ?? '?'} filmes · {diagnostic.totals.series ?? '?'} séries · {diagnostic.totals.live ?? '?'} canais.</p>
      <p>Primeira tela salva: {diagnostic.firstFold.movies ?? '?'} filmes · {diagnostic.firstFold.series ?? '?'} séries · {diagnostic.firstFold.live ?? '?'} canais.</p>
      <p>{diagnostic.state === 'READABLE' ? 'Cabeçalhos e amostras locais legíveis. A verificação não percorre todo o catálogo.'
        : diagnostic.state === 'GENERATION_CHANGED' ? 'O catálogo mudou durante a leitura. Verifique novamente.'
        : diagnostic.state === 'ABSENT' ? 'Nenhum catálogo ativo foi encontrado.' : 'Não foi possível confirmar toda a leitura local. Consulte o diagnóstico abaixo.'}</p>
      <details><summary className="focusable-item">Diagnóstico do catálogo</summary>
        <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', userSelect: 'text' }}>{JSON.stringify(diagnostic, null, 2)}</pre>
      </details>
    </div>}
  </section>;
}
