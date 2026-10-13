import { useEffect, useRef, useState } from 'react';
import { getSupabaseRuntimeConfig } from '../integrations/supabase/runtime-config.ts';
import { nativeUpdateAvailable, nativeUpdates, type UpdateReady, type NativeUpdates } from './native-update.ts';

export const updateCheckMessages: Record<string, string> = {
  current: 'Seu aplicativo já está na versão publicada mais recente.',
  disabled: 'Não há atualização publicada no momento.',
  ready: 'Download concluído. A nova versão está pronta para instalar.',
  checking: 'Já existe uma busca em andamento. Aguarde e tente novamente.',
  unavailable: 'Não foi possível consultar a versão. Confira a conexão e tente novamente.',
  download_failed: 'Não foi possível concluir o download em nenhuma fonte. Tente novamente mais tarde.',
};
export function AppUpdateSettings({ api = nativeUpdates, available = nativeUpdateAvailable() }: { api?: NativeUpdates; available?: boolean }) {
  const alive = useRef(true), pending = useRef(false);
  const [busy, setBusy] = useState(false), [feedback, setFeedback] = useState(''), [ready, setReady] = useState<UpdateReady | null>(null);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const check = async () => {
    if (!available || pending.current) return;
    pending.current = true; setBusy(true); setReady(null); setFeedback('Buscando a versão publicada… Se houver atualização, o download será iniciado.');
    try {
      const config = getSupabaseRuntimeConfig();
      if (config) await api.configure(config);
      const status = await api.checkNow();
      if (alive.current) { setReady(status.ready ? status : null); setFeedback(updateCheckMessages[status.result] ?? updateCheckMessages.unavailable); }
    } catch { if (alive.current) setFeedback(updateCheckMessages.unavailable); }
    finally { pending.current = false; if (alive.current) setBusy(false); }
  };
  const install = async () => {
    if (pending.current) return; pending.current = true; setBusy(true);
    try {
      const result = await api.install();
      if (alive.current) setFeedback(result.permissionRequired ? 'Autorize a instalação nas configurações do Android e toque em Instalar novamente.' : 'Confirme a instalação na tela do Android. Se cancelar, a atualização continuará disponível.');
    } catch { if (alive.current) setFeedback('Não foi possível abrir o instalador. Tente novamente.'); }
    finally { pending.current = false; if (alive.current) setBusy(false); }
  };
  return <section className="settings-section" aria-labelledby="settings-updates">
    <h2 id="settings-updates">Atualizações do aplicativo</h2>
    <p>Procure uma nova versão agora. A busca automática continua acontecendo uma vez por dia, quando o Android permite.</p>
    {available ? <><button type="button" className="focusable-item btn-primary" disabled={busy} onClick={check}>{busy ? 'Aguarde…' : 'Buscar atualização'}</button>
      <p role="status" aria-live="polite">{feedback}</p>
      {ready && <><p>Nova versão: <strong>{ready.versionName} ({ready.versionCode})</strong></p><button type="button" className="focusable-item btn-secondary" disabled={busy} onClick={install}>Instalar atualização</button></>}
    </> : <p>A instalação de APK está disponível no aplicativo Android que já contém este recurso.</p>}
  </section>;
}
