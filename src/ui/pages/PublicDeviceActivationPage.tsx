import React, { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { DeviceCodeInput } from '../components/DeviceCodeInput.tsx';
import { getPublicDeviceActivationService, type PublicDeviceActivationSession } from '../../control-plane/client/public-device-activation.service.ts';
import type { PublicActivationHandoff } from '../activation/public-activation-url.ts';
import { firstNameOnly, type RegistrationPlatform } from '../../../supabase/functions/_shared/public-device-registration.ts';

interface PublicDeviceActivationPageProps {
  onBack?: () => void;
  handoff?: PublicActivationHandoff | null;
}

export const PublicDeviceActivationPage: React.FC<PublicDeviceActivationPageProps> = ({ onBack, handoff }) => {
  const [displayCode, setDisplayCode] = useState(handoff?.displayCode || '');
  const [activationKey, setActivationKey] = useState('');
  const [customerFirstName, setCustomerFirstName] = useState('');
  const [deviceLabel, setDeviceLabel] = useState('');
  const [platform, setPlatform] = useState<RegistrationPlatform>('ANDROID');
  const [sourceType, setSourceType] = useState<'M3U' | 'M3U8'>('M3U');
  const [sourceUrl, setSourceUrl] = useState('');
  const [epgUrl, setEpgUrl] = useState('');
  const [session, setSession] = useState<PublicDeviceActivationSession | null>(null);
  const [completedCode, setCompletedCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(Boolean(handoff));
  const [resuming, setResuming] = useState(Boolean(handoff));
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success' | 'info'; text: string } | null>(null);
  const resumeRequest = useRef<ReturnType<ReturnType<typeof getPublicDeviceActivationService>['resume']> | null>(null);

  useEffect(() => {
    if (!handoff || Capacitor.isNativePlatform()) return;
    let active = true;
    resumeRequest.current ??= getPublicDeviceActivationService().resume(handoff.displayCode, handoff.sessionToken);
    void resumeRequest.current.then(result => {
      if (!active) return;
      if ('success' in result) {
        setFeedback({ type: 'error', text: result.message || 'A abertura expirou. Abra novamente pelo aplicativo.' });
      } else {
        setSession(result);
        setFeedback({ type: 'info', text: 'Código e chave validados. Cadastre a fonte deste aparelho.' });
      }
    }).catch(() => {
      if (active) setFeedback({ type: 'error', text: 'Não foi possível validar o aparelho. Abra novamente pelo aplicativo.' });
    }).finally(() => { if (active) { setBusy(false); setResuming(false); } });
    return () => { active = false; };
  }, [handoff]);

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
        customerFirstName: firstNameOnly(customerFirstName),
        deviceLabel,
        platform,
        sourceName: `Fonte de ${firstNameOnly(customerFirstName)}`,
        initialScreens: 1,
        sourceType,
        sourceUrl,
        epgUrl,
      });
      if (!result.success) {
        setFeedback({ type: 'error', text: result.message || 'Não foi possível concluir a ativação.' });
        return;
      }
      setSourceUrl('');
      setEpgUrl('');
      setCustomerFirstName('');
      setDeviceLabel('');
      setCompletedCode(session.displayCode);
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
          Teste de sete dias, válido somente neste aparelho. O acesso expira ao final do teste, sem renovação automática.
        </p>

        {completedCode ? (
          <section role="status" aria-live="polite" style={{ marginTop: 24, padding: 20, borderRadius: 12, background: '#052e16' }}>
            <h2>Dispositivo pronto para sincronizar</h2>
            <p>Código ID: <strong>{completedCode}</strong></p>
            <p>A fonte foi vinculada. Mantenha o Xandeflix aberto e conectado à internet neste aparelho. A sincronização e seu progresso aparecem na tela dele.</p>
            <p>Assim que terminar, o aplicativo abre o catálogo automaticamente.</p>
            <p>O período de teste é de sete dias a partir da ativação. Após esse prazo, será necessária uma licença paga para continuar.</p>
          </section>
        ) : resuming ? <p role="status" style={{ marginTop: 24 }}>Validando o código e a chave do aparelho…</p> : !session ? (
          <form onSubmit={startSession} style={{ display: 'grid', gap: 16, marginTop: 24 }}>
            <label>Código ID<DeviceCodeInput required disabled={busy} value={displayCode} onValueChange={setDisplayCode} style={fieldStyle} /></label>
            <label>Chave de 6 dígitos<input required disabled={busy} value={activationKey} onChange={(event) => setActivationKey(event.target.value.replace(/[^0-9]/g, '').slice(0, 6))} placeholder="6 dígitos exibidos no aplicativo" style={fieldStyle} autoComplete="off" inputMode="numeric" maxLength={6} pattern="[0-9]{6}" /></label>
            <button type="submit" disabled={busy} style={{ padding: 12, borderRadius: 8, border: 0, background: '#7c3aed', color: 'white', fontWeight: 700 }}>{busy ? 'Validando…' : 'Validar dispositivo'}</button>
          </form>
        ) : (
          <form onSubmit={completeActivation} style={{ display: 'grid', gap: 16, marginTop: 24 }}>
            <div style={{ padding: 12, borderRadius: 8, background: '#172554' }}>
              <strong>Código do dispositivo: {session.displayCode}</strong>
              <p style={{ marginBottom: 0, color: '#86efac' }}>Chave permanente validada. Ativação exclusiva deste aparelho.</p>
            </div>
            <label>Cliente — primeiro nome<input required disabled={busy} autoComplete="given-name" maxLength={80} value={customerFirstName} onChange={event => setCustomerFirstName(event.target.value)} onBlur={() => setCustomerFirstName(firstNameOnly(customerFirstName))} style={fieldStyle} /></label>
            <label>Local/Tipo<input required disabled={busy} maxLength={100} value={deviceLabel} onChange={event => setDeviceLabel(event.target.value)} placeholder="Ex.: TV da sala" style={fieldStyle} autoComplete="off" /></label>
            <label>Plataforma<select disabled={busy} value={platform} onChange={event => setPlatform(event.target.value as RegistrationPlatform)} style={fieldStyle}><option value="ANDROID">Android / Fire TV</option><option value="IOS">iOS</option><option value="TIZEN">Samsung Tizen</option><option value="WEBOS">LG webOS</option><option value="WEB">Web</option><option value="OTHER">Outra</option></select></label>
            <label>Tipo da playlist<select disabled={busy} value={sourceType} onChange={(event) => setSourceType(event.target.value as 'M3U' | 'M3U8')} style={fieldStyle}><option value="M3U">M3U</option><option value="M3U8">M3U8</option></select></label>
            <label>URL da playlist M3U/M3U8<input required disabled={busy} type="url" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="http://exemplo.com/playlist.m3u" style={fieldStyle} autoComplete="off" /></label>
            <label>URL EPG (opcional)<input disabled={busy} type="url" value={epgUrl} onChange={(event) => setEpgUrl(event.target.value)} placeholder="http://exemplo.com/epg.xml" style={fieldStyle} autoComplete="off" /></label>
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
