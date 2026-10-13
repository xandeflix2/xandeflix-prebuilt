import { useEffect, useRef, useState } from 'react';
import { initializeNativeUpdates, nativeUpdateAvailable, nativeUpdates, type UpdateReady, type NativeUpdates } from './native-update.ts';
import './AppUpdatePrompt.css';

export function AppUpdatePrompt({ api = nativeUpdates, available = nativeUpdateAvailable(), initialize = initializeNativeUpdates }: { api?: NativeUpdates; available?: boolean; initialize?: () => Promise<void> }) {
  const [update, setUpdate] = useState<UpdateReady | null>(null), [feedback, setFeedback] = useState(''), [busy, setBusy] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!available) return;
    let alive = true;
    const listener = api.addListener('opening', status => { if (alive) { setUpdate(status.ready ? status : null); setFeedback(''); } }).catch(() => null);
    // Snapshot before this opening's download: newly downloaded updates prompt next opening.
    api.status().then(status => { if (alive && status.ready) setUpdate(status); }).catch(() => undefined);
    void initialize().catch(() => undefined);
    return () => { alive = false; void listener.then(handle => handle?.remove()).catch(() => undefined); };
  }, [api, available, initialize]);
  useEffect(() => {
    if (!update) { dialog.current?.close(); return; }
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.showModal(); dialog.current?.querySelector<HTMLButtonElement>('button')?.focus();
    return () => { dialog.current?.close(); previous?.focus(); };
  }, [update]);
  const install = async () => {
    if (busy) return; setBusy(true); setFeedback('');
    try {
      const result = await api.install();
      setFeedback(result.permissionRequired ? 'Autorize a instalação nas configurações do Android e toque em Instalar novamente.' : 'Conclua a instalação na tela do Android. Se cancelar, a atualização continuará disponível.');
    } catch { setFeedback('Não foi possível abrir o instalador. Tente novamente.'); }
    finally { setBusy(false); }
  };
  return <dialog ref={dialog} className="app-update-prompt" aria-labelledby="app-update-title" onCancel={() => setUpdate(null)}>
    <h2 id="app-update-title">Nova versão pronta para instalar</h2>
    <p>Versão {update?.versionName} · atualização {update?.versionCode}</p>
    {update?.notes && <p>{update.notes}</p>}
    <p>O download já foi concluído. Confirme a instalação no Android para atualizar o aplicativo.</p>
    <p role="status">{feedback}</p>
    <div><button type="button" disabled={busy} onClick={install}>{busy ? 'Abrindo…' : 'Instalar atualização'}</button><button type="button" disabled={busy} onClick={() => setUpdate(null)}>Mais tarde</button></div>
  </dialog>;
}
