import React, { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { getPublicDeviceActivationService, type PublicDeviceActivationSession } from '../../control-plane/client/public-device-activation.service.ts';

interface PublicDeviceActivationPageProps {
  onBack?: () => void;
}

export const PublicDeviceActivationPage: React.FC<PublicDeviceActivationPageProps> = ({ onBack }) => {
  const [displayCode, setDisplayCode] = useState('');
  const [activationKey, setActivationKey] = useState('');
  const [sourceName, setSourceName] = useState('Minha fonte');
  const [sourceType, setSourceType] = useState<'M3U' | 'M3U8'>('M3U');
  const [sourceUrl, setSourceUrl] = useState('');
  const [epgUrl, setEpgUrl] = useState('');
  const [sourceUsername, setSourceUsername] = useState('');
  const [sourcePassword, setSourcePassword] = useState('');
  const [session, setSession] = useState<PublicDeviceActivationSession | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success' | 'info'; text: string } | null>(null);

  const startSession = async (event: React.FormEvent) => {
    event.preventDefault();
    setFeedback(null);
    setBusy(true);
    try {
      const result = await getPublicDeviceActivationService().start(displayCode, activationKey);
      if ('success' in result) {
        setFeedback({ type: 'error', text: result.message || 'Não foi possível validar o código e a chave.' });
        return;
      }
      setSession(result);
      setActivationKey('');
      setFeedback({ type: 'info', text: 'Código validado. Agora informe a URL M3U/M3U8 da fonte.' });
    } finally {
      setBusy(false);
    }
  };

  const completeActivation = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!session) return;
    setFeedback(null);
    setBusy(true);
    try {
      const result = await getPublicDeviceActivationService().complete({
        displayCode: session.displayCode,
        sessionToken: session.sessionToken,
        sourceName,
        sourceType,
        sourceUrl,
        epgUrl,
        username: sourceUsername,
        password: sourcePassword,
      });
      if (!result.success) {
        setFeedback({ type: 'error', text: result.message || 'Não foi possível concluir a ativação.' });
        return;
      }
      setSourceUrl('');
      setEpgUrl('');
      setSourceUsername('');
      setSourcePassword('');
      setSession(null);
      setFeedback({ type: 'success', text: 'Dispositivo autorizado. A fonte foi protegida e vinculada; abra o aplicativo para sincronizar.' });
    } finally {
      setBusy(false);
    }
  };

  const fieldStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '12px',
    borderRadius: 8,
    border: '1px solid #3b4560',
    background: '#111827',
    color: '#f8fafc',
    fontSize: '1rem',
  };

  if (Capacitor.isNativePlatform()) {
    return (
      <main style={{ maxWidth: 620, margin: '0 auto', padding: '32px 20px' }}>
        <section style={{ background: '#111827', border: '1px solid #5b21b6', borderRadius: 14, padding: 24 }}>
          <p style={{ color: '#c084fc', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' }}>Ativação externa</p>
          <h1 style={{ marginTop: 8 }}>Abra esta página no navegador</h1>
          <p style={{ color: '#cbd5e1', lineHeight: 1.5 }}>
            O formulário da fonte existe somente no navegador externo. Volte à tela de ativação do aplicativo e use o botão para abrir a página pública.
          </p>
          {onBack && <button type="button" onClick={onBack} style={{ marginTop: 20, padding: 10, borderRadius: 8, background: '#334155', color: 'white', border: 0 }}>Voltar</button>}
        </section>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 620, margin: '0 auto', padding: '32px 20px' }}>
      <section style={{ background: '#111827', border: '1px solid #5b21b6', borderRadius: 14, padding: 24 }}>
        <p style={{ color: '#c084fc', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' }}>Ativação de dispositivo</p>
        <h1 style={{ marginTop: 8 }}>Ative seu novo aparelho</h1>
        <p style={{ color: '#cbd5e1', lineHeight: 1.5 }}>
          Informe o código e a chave mostrados no aplicativo. Não é necessário criar uma conta ou informar senha.
        </p>

        {!session ? (
          <form onSubmit={startSession} style={{ display: 'grid', gap: 16, marginTop: 24 }}>
            <label>Código do dispositivo<input required value={displayCode} onChange={(event) => setDisplayCode(event.target.value.toUpperCase())} placeholder="XF-XXXX-XXXX" style={fieldStyle} autoComplete="off" /></label>
            <label>Chave permanente do dispositivo<input required value={activationKey} onChange={(event) => setActivationKey(event.target.value.replace(/[^0-9]/g, '').slice(0, 6))} placeholder="6 dígitos exibidos no aplicativo" style={fieldStyle} autoComplete="off" inputMode="numeric" maxLength={6} pattern="[0-9]{6}" /></label>
            <button type="submit" disabled={busy} style={{ padding: 12, borderRadius: 8, border: 0, background: '#7c3aed', color: 'white', fontWeight: 700 }}>{busy ? 'Validando…' : 'Validar dispositivo'}</button>
          </form>
        ) : (
          <form onSubmit={completeActivation} style={{ display: 'grid', gap: 16, marginTop: 24 }}>
            <p style={{ color: '#86efac' }}>Código validado. Esta etapa fica disponível por poucos minutos.</p>
            <label>Nome da fonte<input required value={sourceName} onChange={(event) => setSourceName(event.target.value)} style={fieldStyle} /></label>
            <label>Tipo da playlist<select value={sourceType} onChange={(event) => setSourceType(event.target.value as 'M3U' | 'M3U8')} style={fieldStyle}><option value="M3U">M3U</option><option value="M3U8">M3U8</option></select></label>
            <label>URL da playlist M3U/M3U8<input required type="url" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://exemplo.com/playlist.m3u" style={fieldStyle} autoComplete="off" /></label>
            <label>URL EPG (opcional)<input type="url" value={epgUrl} onChange={(event) => setEpgUrl(event.target.value)} placeholder="https://exemplo.com/epg.xml" style={fieldStyle} autoComplete="off" /></label>
            <label>Usuario (opcional)<input value={sourceUsername} onChange={(event) => setSourceUsername(event.target.value)} style={fieldStyle} autoComplete="off" /></label>
            <label>Senha (opcional)<input type="password" value={sourcePassword} onChange={(event) => setSourcePassword(event.target.value)} style={fieldStyle} autoComplete="new-password" /></label>
            <button type="submit" disabled={busy} style={{ padding: 12, borderRadius: 8, border: 0, background: '#16a34a', color: 'white', fontWeight: 700 }}>{busy ? 'Protegendo e ativando…' : 'Ativar fonte neste dispositivo'}</button>
          </form>
        )}

        {feedback && (
          <div role="status" style={{ marginTop: 20, padding: 12, borderRadius: 8, color: feedback.type === 'error' ? '#fecaca' : feedback.type === 'success' ? '#bbf7d0' : '#bfdbfe', background: feedback.type === 'error' ? '#450a0a' : feedback.type === 'success' ? '#052e16' : '#172554' }}>
            {feedback.text}
          </div>
        )}

        {onBack && <button type="button" onClick={onBack} style={{ marginTop: 20, padding: 10, borderRadius: 8, background: '#334155', color: 'white', border: 0 }}>Voltar</button>}
      </section>
    </main>
  );
};
