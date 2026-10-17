import { useEffect, useRef, useState } from 'react';
import { readActiveSourceStatus, updateSourceCatalog, type ActiveSourceStatus } from '../settings/active-source-status.ts';
import { getBootSyncCoordinator } from '../../bootstrap/boot-sync-coordinator.ts';
import { useParentalControl } from '../hooks/useParentalControl.ts';

export function ActiveSourceSettings({ onOpenAdult }: { onOpenAdult?: () => void }) {
  const parental = useParentalControl(), [status, setStatus] = useState<ActiveSourceStatus>();
  const [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const mounted = useRef(false), epoch = useRef(0), pending = useRef(false);
  const reload = async () => { const id = ++epoch.current; const next = await readActiveSourceStatus(); if (mounted.current && epoch.current === id) setStatus(next); };
  useEffect(() => {
    mounted.current = true; void reload();
    const unsubscribe = getBootSyncCoordinator().subscribe((_, result) => {
      if (!pending.current && ['PROMOTED','NO_OP'].includes(result?.outcome || '')) void reload();
    });
    return () => { mounted.current = false; epoch.current++; unsubscribe(); };
  }, []);
  const run = async (sync: boolean) => {
    if (pending.current) return; pending.current = true; setBusy(true); setMessage('');
    try {
      if (sync) { const result = await updateSourceCatalog(); if (mounted.current) setMessage({ updated: 'Catálogo atualizado.', unchanged: 'A fonte foi consultada e o catálogo já está atualizado.', deferred: 'Atualização adiada. Retorne às configurações sem reprodução ou transmissão ativa.', failed: 'Não foi possível atualizar. O catálogo anterior foi preservado.' }[result]); }
      await reload();
    } finally { pending.current = false; if (mounted.current) setBusy(false); }
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
    <button type="button" className="focusable-item btn-secondary" disabled={busy} onClick={() => void run(false)}>Conferir fonte</button>
    <button type="button" className="focusable-item btn-primary" disabled={busy || status?.bindingState !== 'ready'} onClick={() => void run(true)}>{busy ? 'Aguarde…' : 'Atualizar catálogo'}</button>
    {onOpenAdult && <button type="button" className="focusable-item btn-secondary" onClick={onOpenAdult}>Abrir área 18+</button>}
    {message && <p role="status">{message}</p>}
  </section>;
}
