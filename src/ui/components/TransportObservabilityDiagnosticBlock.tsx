import React, { useState } from 'react';
import {
  runLargeSourceTransportObservabilitySuite,
  type LargeSourceTransportDiagnosticResult,
} from '../../source/large-source-transport-observability.harness.ts';

declare const __XANDEFLIX_DEBUG_BUILD__: boolean;

export const TransportObservabilityDiagnosticBlock: React.FC = () => {
  const [results, setResults] = useState<LargeSourceTransportDiagnosticResult[] | null>(null);
  const [running, setRunning] = useState(false);

  if (typeof __XANDEFLIX_DEBUG_BUILD__ === 'undefined' || !__XANDEFLIX_DEBUG_BUILD__) return null;

  const runSuite = async () => {
    setRunning(true);
    try {
      setResults(await runLargeSourceTransportObservabilitySuite());
    } finally {
      setRunning(false);
    }
  };

  const successObserved = results?.some((entry) => entry.id === 'SUCCESS_DOWNLOAD_COMPLETE' && entry.diagnosticSurface.success) === true;
  const passed = results?.filter((entry) => {
    const surface = entry.diagnosticSurface;
    const stageMatches = entry.id === 'T09_M3U_PARSE_FAILURE'
      ? surface.stage === 'M3U_PARSE'
      : surface.stage === entry.native.stage;
    return stageMatches
      && (entry.id === 'SUCCESS_DOWNLOAD_COMPLETE'
        ? surface.success
        : !surface.success && Boolean(surface.code));
  }).length ?? 0;

  return (
    <section data-testid="large-source-transport-observability" style={{ padding: '0.75rem', backgroundColor: '#172033', borderRadius: '4px', marginBottom: '1rem' }}>
      <strong style={{ color: '#93c5fd', display: 'block', marginBottom: '0.35rem' }}>
        DEBUG_TRANSPORT_DIAGNOSTICS_PRESENT=SIM
      </strong>
      <span style={{ color: '#cbd5e1', display: 'block' }}>Harness sintético local: sem source real, staging real ou promoção.</span>
      {results && (
        <>
          <span style={{ color: '#86efac', display: 'block' }}>SYNTHETIC_ERROR_TEST_COUNT={results.length - 1}</span>
          <span style={{ color: '#86efac', display: 'block' }}>SYNTHETIC_ERROR_TEST_PASS_COUNT={passed - (successObserved ? 1 : 0)}</span>
          <span style={{ color: '#86efac', display: 'block' }}>SYNTHETIC_SUCCESS_OBSERVED={successObserved ? 'SIM' : 'NAO'}</span>
          <div style={{ marginTop: '0.5rem', maxHeight: '16rem', overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.75rem' }}>
            {results.map((entry) => (
              <div key={entry.id} style={{ borderTop: '1px solid #334155', padding: '0.35rem 0' }}>
                <span style={{ color: '#e2e8f0', display: 'block' }}>{entry.id}</span>
                <span style={{ color: '#cbd5e1', display: 'block' }}>TRANSPORT_STAGE={entry.diagnosticSurface.stage}</span>
                <span style={{ color: '#cbd5e1', display: 'block' }}>TRANSPORT_ERROR_CODE={entry.diagnosticSurface.code || 'NONE'}</span>
                <span style={{ color: '#cbd5e1', display: 'block' }}>HTTP_STATUS_CLASS={entry.diagnosticSurface.httpStatusClass}</span>
                <span style={{ color: '#cbd5e1', display: 'block' }}>TRANSPORT_TYPE={entry.diagnosticSurface.transportType}</span>
                <span style={{ color: '#cbd5e1', display: 'block' }}>RETRYABLE={entry.diagnosticSurface.retryable ? 'SIM' : 'NAO'}</span>
              </div>
            ))}
          </div>
        </>
      )}
      <button type="button" className="focusable-item" onClick={() => { void runSuite(); }} disabled={running} style={{ marginTop: '0.6rem', padding: '0.55rem 1rem', backgroundColor: '#1d4ed8', color: '#dbeafe', border: '1px solid #60a5fa', borderRadius: '5px', cursor: running ? 'wait' : 'pointer' }}>
        {running ? 'Executando diagnóstico sintético...' : 'Executar diagnóstico de transporte'}
      </button>
    </section>
  );
};
