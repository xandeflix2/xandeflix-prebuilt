import React, { useEffect, useState } from 'react';
import { publicWebSession } from './session-context.ts';
import { readActiveSourceStatus, type ActiveSourceStatus } from '../ui/settings/active-source-status.ts';
import { getWebCatalogRefresh } from '../web/web-source-connection.ts';

declare const __XANDEFLIX_WEB_TMDB_CONFIGURED__: boolean;
interface WebAccessStatusSnapshot {
  displayCode: string;
  mode: 'MANAGED' | 'SELF_SERVICE';
  source: ActiveSourceStatus;
}

/** Read the existing session, never request or create a native activation key. */
export async function readWebAccessStatus(): Promise<WebAccessStatusSnapshot> {
  const before = publicWebSession();
  const source = await readActiveSourceStatus();
  const current = publicWebSession();
  if (before.sessionId !== current.sessionId) throw new Error('WEB_SESSION_REQUIRED');
  return { displayCode: current.activation.displayCode, mode: current.activation.licenseMode!, source };
}

export function webAccessDiagnostic(value?: WebAccessStatusSnapshot): string {
  const lines = ['XANDEFLIX_WEB_SUPPORT_DIAGNOSTIC_V1',
    'WEB_SESSION_STATE=' + (value ? 'AUTHORIZED' : 'UNAVAILABLE'),
    'DEVICE_CODE=' + (value && /^XF-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(value.displayCode) ? value.displayCode : 'UNKNOWN'),
    'LICENSE_MODE=' + (value?.mode === 'MANAGED' || value?.mode === 'SELF_SERVICE' ? value.mode : 'UNKNOWN'),
    'LOCAL_KEY_STATE=NOT_APPLICABLE_WEB',
    'TMDB_CONFIGURED=' + (typeof __XANDEFLIX_WEB_TMDB_CONFIGURED__ !== 'undefined' && __XANDEFLIX_WEB_TMDB_CONFIGURED__ ? 'SIM' : 'NAO'),
    'DATA_PLANE=DEVICE_TO_SOURCE_DIRECT'];
  const source = value?.source;
  if (source) {
    lines.push('SOURCE_BINDING_STATE=' + ({ ready: 'READY', unavailable: 'UNAVAILABLE', unauthorized: 'UNAUTHORIZED', unbound: 'UNBOUND' }[source.bindingState] || 'UNKNOWN'));
    lines.push('LOCAL_CATALOG_STATE=' + ({ ready: 'READY', absent: 'ABSENT', unconfirmed: 'UNCONFIRMED' }[source.localState] || 'UNKNOWN'));
    lines.push('SOURCE_COMPARISON=' + ({ same: 'SAME', changed: 'CHANGED', unknown: 'UNKNOWN' }[source.comparison] || 'UNKNOWN'));
    for (const [name, version] of [['LOCAL_SOURCE_VERSION', source.local?.version], ['BOUND_SOURCE_VERSION', source.bound?.version]] as const) {
      if (Number.isSafeInteger(version) && Number(version) > 0) lines.push(name + '=' + version);
    }
  }
  const refresh = getWebCatalogRefresh();
  lines.push('CATALOG_LAST_OUTCOME=' + refresh.outcome, 'CATALOG_LAST_HAD_ERROR=' + (refresh.hadError ? 'SIM' : 'NAO'), 'CATALOG_LAST_ERROR_CODE=' + refresh.errorCode, 'CATALOG_REFRESH_BLOCKER=' + refresh.blocker);
  return lines.join('\n');
}

export function WebAccessStatus({ onBack, onOpenSettings, showBackButton = true }: {
  onBack: () => void; onOpenSettings?: () => void; showBackButton?: boolean;
}): React.ReactElement {
  const [value, setValue] = useState<WebAccessStatusSnapshot>();
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0), [support, setSupport] = useState(false);
  useEffect(() => {
    let mounted = true; setState('loading'); setValue(undefined);
    void readWebAccessStatus().then(next => { if (mounted) { setValue(next); setState('ready'); } })
      .catch(() => { if (mounted) setState('error'); });
    return () => { mounted = false; };
  }, [attempt]);
  return <main className="activation-page" style={{ maxWidth: 750, margin: '0 auto', padding: '2rem' }}>
    {showBackButton && <button type="button" className="focusable-item btn-secondary" onClick={onBack}>← Voltar</button>}
    <h1>Acesso web</h1>
    <p>Este navegador usa a sessão de um aparelho já ativado.</p>
    {state === 'loading' ? <p role="status">Conferindo sessão e catálogo…</p>
      : state === 'error' ? <p role="status">Não foi possível confirmar a sessão web. Saia e entre novamente com os dados do seu aparelho.</p>
      : value && <>
        <p>Código do aparelho: <strong>{value.displayCode}</strong></p>
        <p>Sessão web autorizada.</p>
        <p role="status">{value.source.comparison === 'changed'
          ? 'A fonte mudou. Abra Fonte e catálogo nas configurações e atualize o catálogo antes de reproduzir.'
          : value.source.bindingState === 'ready' ? value.source.comparison === 'same'
            ? 'O catálogo corresponde à fonte vinculada.' : 'Fonte autorizada. Confira o carregamento do catálogo nas configurações.'
            : value.source.bindingState === 'unauthorized' ? 'O acesso à fonte não foi autorizado na consulta atual.'
              : value.source.bindingState === 'unbound' ? 'Não há fonte ativa vinculada.' : 'Não foi possível consultar a autorização da fonte.'}</p>
      </>}
    <div className="startup-loading-actions">
      <button type="button" className="focusable-item btn-secondary" disabled={state === 'loading'} onClick={() => setAttempt(n => n + 1)}>Verificar novamente</button>
      {onOpenSettings && <button type="button" className="focusable-item btn-secondary" onClick={onOpenSettings}>Configurações</button>}
      <button type="button" className="focusable-item btn-secondary" aria-expanded={support} onClick={() => setSupport(open => !open)}>Informações para o suporte</button>
    </div>
    {support && <pre className="focusable-item" tabIndex={0} style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{webAccessDiagnostic(value)}</pre>}
  </main>;
}
