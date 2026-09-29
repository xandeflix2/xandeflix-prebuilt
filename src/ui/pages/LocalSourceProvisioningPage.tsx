import React, { useCallback, useMemo, useRef, useState } from 'react';
import type { RemoteSourceAuthorizationMetadata } from '../../control-plane/control-plane.types.ts';
import {
  LocalSourceProvisioningService,
  type LocalSourceProvisioningErrorCode,
  type LocalSourceProvisioningResult,
  type ProvisionLocalSourceAuthorization,
} from '../../security/local-source-provisioning.service.ts';

interface LocalSourceProvisioningPageProps {
  authorizationMetadata: RemoteSourceAuthorizationMetadata | null;
  onBack: () => void;
  provisioner?: Pick<LocalSourceProvisioningService, 'provision'>;
}

type Feedback = {
  kind: 'success' | 'error' | 'info';
  message: string;
};

const SOURCE_ID_PATTERN = /^src_[a-z0-9]+$/;

const ERROR_MESSAGES: Record<LocalSourceProvisioningErrorCode, string> = {
  INVALID_SOURCE_ID: 'A metadata autorizada da source e invalida.',
  INVALID_SOURCE_VERSION: 'A versao autorizada da source e invalida.',
  INVALID_SOURCE_PROTOCOL: 'O protocolo autorizado da source e invalido.',
  SOURCE_STATUS_NOT_ACTIVE: 'A source autorizada esta desabilitada.',
  SOURCE_AUTHORIZATION_INVALID: 'A autorizacao da source nao esta pronta para provisionamento.',
  INVALID_LOCAL_SOURCE_CONFIG: 'A configuracao local nao foi aceita.',
  LOCAL_SOURCE_CONFIG_WRITE_FAILED: 'Nao foi possivel gravar no armazenamento local seguro.',
  M3U_URL_UNSUPPORTED: 'Esta URL M3U usa um componente nao suportado pela aplicacao.',
  PROTOCOL_MISMATCH: 'Os campos locais nao correspondem ao protocolo autorizado.',
};

export function toProvisionLocalSourceAuthorization(
  metadata: RemoteSourceAuthorizationMetadata | null,
): ProvisionLocalSourceAuthorization | null {
  if (!metadata || metadata.status !== 'SOURCE_READY') return null;
  const sourceId = metadata.sourceId;
  const sourceVersion = metadata.sourceVersion;
  const protocol = metadata.protocol;
  const sourceStatus = metadata.sourceStatus;
  if (
    typeof sourceId !== 'string' ||
    !SOURCE_ID_PATTERN.test(sourceId) ||
    typeof sourceVersion !== 'number' ||
    !Number.isSafeInteger(sourceVersion) ||
    sourceVersion < 1 ||
    (protocol !== 'M3U' && protocol !== 'XTREAM') ||
    (sourceStatus !== 'ACTIVE' && sourceStatus !== 'DISABLED')
  ) {
    return null;
  }

  return {
    status: metadata.status,
    sourceId,
    sourceVersion,
    protocol,
    sourceStatus,
  };
}

function getSanitizedResultMessage(result: LocalSourceProvisioningResult): string {
  if (result.success) {
    return `Provisionamento concluido para ${result.sourceId}, versao ${result.sourceVersion}, protocolo ${result.protocol}.`;
  }
  return ERROR_MESSAGES[result.errorCode];
}

export const LocalSourceProvisioningPage: React.FC<LocalSourceProvisioningPageProps> = ({
  authorizationMetadata,
  onBack,
  provisioner,
}) => {
  const authorization = useMemo(
    () => toProvisionLocalSourceAuthorization(authorizationMetadata),
    [authorizationMetadata],
  );
  const provisionerRef = useRef<Pick<LocalSourceProvisioningService, 'provision'>>(
    provisioner ?? new LocalSourceProvisioningService(),
  );

  const [playlistUrl, setPlaylistUrl] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const clearSensitiveFormState = useCallback(() => {
    setPlaylistUrl('');
    setEndpoint('');
    setUsername('');
    setPassword('');
  }, []);

  const canProvision = authorization?.status === 'SOURCE_READY' && authorization.sourceStatus === 'ACTIVE';

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setFeedback(null);

      if (!authorization || !canProvision) {
        setFeedback({
          kind: 'error',
          message: 'A metadata autorizada ainda nao permite provisionamento local.',
        });
        return;
      }

      setIsSubmitting(true);
      try {
        const sourceConfig =
          authorization.protocol === 'M3U'
            ? { playlistUrl }
            : { endpoint, username, password };
        const result = await provisionerRef.current.provision({
          authorization,
          sourceConfig,
        });

        if (result.success) {
          clearSensitiveFormState();
          setFeedback({ kind: 'success', message: getSanitizedResultMessage(result) });
        } else {
          setFeedback({ kind: 'error', message: getSanitizedResultMessage(result) });
        }
      } catch {
        setFeedback({ kind: 'error', message: ERROR_MESSAGES.LOCAL_SOURCE_CONFIG_WRITE_FAILED });
      } finally {
        setIsSubmitting(false);
      }
    },
    [authorization, canProvision, clearSensitiveFormState, endpoint, password, playlistUrl, username],
  );

  const handleBack = useCallback(() => {
    clearSensitiveFormState();
    onBack();
  }, [clearSensitiveFormState, onBack]);

  const metadataMessage = !authorizationMetadata
    ? 'Nenhuma metadata autorizada foi resolvida para esta tela.'
    : !authorization
      ? 'A metadata autorizada esta incompleta ou nao esta pronta.'
      : authorization.sourceStatus !== 'ACTIVE'
        ? 'A source autorizada esta desabilitada. Nenhum write sera executado.'
        : 'Insira a configuracao diretamente neste dispositivo.';

  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: '#080c14',
        color: '#f8fafc',
        padding: '2rem',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start' }}>
          <div>
            <span
              style={{
                display: 'inline-block',
                backgroundColor: '#334155',
                color: '#e2e8f0',
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '0.25rem 0.55rem',
                borderRadius: '4px',
                letterSpacing: '0.08em',
              }}
            >
              LOCAL-ONLY
            </span>
            <h1 style={{ fontSize: '1.7rem', margin: '0.6rem 0 0.4rem' }}>Provisionamento local de source</h1>
            <p style={{ color: '#94a3b8', lineHeight: 1.45, margin: 0 }}>
              A configuracao permanece em memoria e e enviada somente ao provisionador seguro local.
            </p>
          </div>
          <button type="button" className="focusable-item" onClick={handleBack} style={buttonStyle('#1e293b')}>
            Voltar
          </button>
        </header>

        <section style={panelStyle} aria-label="Metadata autorizada">
          <h2 style={sectionTitleStyle}>Metadata autorizada</h2>
          <div style={metadataGridStyle}>
            <MetadataItem label="SOURCE_ID" value={authorization?.sourceId ?? 'INDISPONIVEL'} />
            <MetadataItem label="SOURCE_VERSION" value={authorization ? String(authorization.sourceVersion) : 'INDISPONIVEL'} />
            <MetadataItem label="PROTOCOL" value={authorization?.protocol ?? 'INDISPONIVEL'} />
            <MetadataItem label="SOURCE_STATUS" value={authorization?.sourceStatus ?? 'INDISPONIVEL'} />
          </div>
          <p style={{ color: '#94a3b8', margin: '1rem 0 0', fontSize: '0.9rem' }}>{metadataMessage}</p>
        </section>

        {canProvision ? (
          <form onSubmit={handleSubmit} style={panelStyle} noValidate>
            <h2 style={sectionTitleStyle}>
              Configuracao local {authorization.protocol === 'M3U' ? 'M3U' : 'XTREAM'}
            </h2>

            {authorization.protocol === 'M3U' ? (
              <Field label="Playlist URL" htmlFor="local-playlist-url">
                <input
                  id="local-playlist-url"
                  name="playlistUrl"
                  type="text"
                  className="focusable-item"
                  value={playlistUrl}
                  onChange={(event) => setPlaylistUrl(event.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="https://dominio-exemplo.invalid/playlist.m3u"
                  style={inputStyle}
                />
              </Field>
            ) : (
              <>
                <Field label="Endpoint" htmlFor="local-xtream-endpoint">
                  <input
                    id="local-xtream-endpoint"
                    name="endpoint"
                    type="text"
                    className="focusable-item"
                    value={endpoint}
                    onChange={(event) => setEndpoint(event.target.value)}
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="https://dominio-exemplo.invalid:8443"
                    style={inputStyle}
                  />
                </Field>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <Field label="Username" htmlFor="local-xtream-username">
                    <input
                      id="local-xtream-username"
                      name="username"
                      type="text"
                      className="focusable-item"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      autoComplete="off"
                      spellCheck={false}
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Password" htmlFor="local-xtream-password">
                    <input
                      id="local-xtream-password"
                      name="password"
                      type="password"
                      className="focusable-item"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      autoComplete="off"
                      spellCheck={false}
                      style={inputStyle}
                    />
                  </Field>
                </div>
              </>
            )}

            <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.4 }}>
              Nenhum teste de conexao e executado neste fluxo. O submit apenas valida e grava no armazenamento seguro local.
            </p>
            <button
              type="submit"
              className="focusable-item"
              disabled={isSubmitting || !canProvision}
              style={buttonStyle('#e50914')}
            >
              {isSubmitting ? 'Provisionando...' : 'Provisionar localmente'}
            </button>
          </form>
        ) : (
          <section style={{ ...panelStyle, borderColor: '#475569' }}>
            <h2 style={sectionTitleStyle}>Provisionamento bloqueado</h2>
            <p style={{ color: '#cbd5e1', margin: 0 }}>
              Resolva uma metadata autorizada completa e ativa antes de inserir qualquer configuracao local.
            </p>
          </section>
        )}

        {feedback && (
          <div
            role="status"
            aria-live="polite"
            style={{
              ...panelStyle,
              borderColor: feedback.kind === 'success' ? '#22c55e' : feedback.kind === 'error' ? '#ef4444' : '#38bdf8',
            }}
          >
            <strong>{feedback.message}</strong>
          </div>
        )}
      </div>
    </main>
  );
};

function MetadataItem({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <div style={{ backgroundColor: '#151d30', borderRadius: '5px', padding: '0.75rem' }}>
      <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.72rem' }}>{label}</span>
      <strong style={{ display: 'block', marginTop: '0.25rem', overflowWrap: 'anywhere' }}>{value}</strong>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <label htmlFor={htmlFor} style={{ display: 'block', marginBottom: '1rem' }}>
      <span style={{ display: 'block', color: '#cbd5e1', fontSize: '0.85rem', marginBottom: '0.4rem' }}>{label}</span>
      {children}
    </label>
  );
}

const panelStyle: React.CSSProperties = {
  backgroundColor: '#101624',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  padding: '1.35rem',
  marginTop: '1.25rem',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '1rem',
  margin: '0 0 1rem',
};

const metadataGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: '0.75rem',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '0.75rem',
  backgroundColor: '#151d30',
  border: '1px solid rgba(255,255,255,0.15)',
  color: '#f8fafc',
  borderRadius: '6px',
  fontSize: '0.95rem',
};

function buttonStyle(backgroundColor: string): React.CSSProperties {
  return {
    padding: '0.7rem 1.1rem',
    backgroundColor,
    border: '1px solid rgba(255,255,255,0.16)',
    color: '#fff',
    fontWeight: 700,
    borderRadius: '6px',
    cursor: 'pointer',
  };
}
