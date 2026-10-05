import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { PlaybackErrorNotice } from '../src/ui/components/PlaybackErrorNotice';
import { handleNativePlayerReturn } from '../src/playback/native-playback-error-notice';
import type { NativePlayerResumeEvent } from '../src/playback/native-android-player.bridge';
import '../src/index.css';

// Isolated harness: no App, activation, source resolver, account, storage or network authority.
const realFetch = window.fetch.bind(window);
window.fetch = (input, options) => {
  const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url, location.href);
  if (url.origin !== location.origin) throw new Error('Fixture blocks external requests');
  return realFetch(input, options);
};
function Fixture() {
  const [notice, setNotice] = useState<string | null>(null);
  const [reason, setReason] = useState('Nenhum retorno');
  const [cleanupFails, setCleanupFails] = useState(false);
  const send = (event: NativePlayerResumeEvent) => {
    void handleNativePlayerReturn(event, async (value) => {
      setReason(value);
      if (cleanupFails) throw new Error('Synthetic cleanup failure');
    }, setNotice);
  };
  const fail = (errorCategory: NativePlayerResumeEvent['errorCategory'], httpStatus?: number) => send({ errorCode: 'NATIVE_ERROR', errorCategory, httpStatus, ended: false });
  return (
    <main style={{ maxWidth: 1000, margin: '0 auto', padding: 24 }}>
      <h1>Teste isolado do aviso de reprodução</h1>
      <p>Eventos simulados; sem ativação, catálogo ou fonte real.</p>
      <PlaybackErrorNotice message={notice} onDismiss={() => setNotice(null)} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 20 }}>
        <button onClick={() => fail('HTTP_ERROR', 404)}>Simular HTTP 404</button>
        <button onClick={() => fail('HTTP_ERROR', 403)}>Simular HTTP 403</button>
        <button onClick={() => fail('HTTP_ERROR', 503)}>Simular HTTP 503</button>
        <button onClick={() => fail('NETWORK_TIMEOUT')}>Simular conexão</button>
        <button onClick={() => fail('DECODER_ERROR')}>Simular decoder</button>
        <button onClick={() => send({ errorCode: 'NATIVE_ERROR' })}>Simular erro legado</button>
        <button onClick={() => send({ ended: false })}>Voltar manualmente</button>
        <button onClick={() => send({ ended: true })}>Terminar vídeo</button>
        <button onClick={() => { setNotice(null); setReason('Nova tentativa'); }}>Nova reprodução</button>
      </div>
      <p><label><input type="checkbox" checked={cleanupFails} onChange={(event) => setCleanupFails(event.target.checked)} /> Simular falha de cleanup</label></p>
      <p data-testid="cleanup-reason">Cleanup: {reason}</p>
    </main>
  );
}
createRoot(document.getElementById('root')!).render(<Fixture />);
