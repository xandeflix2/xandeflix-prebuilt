/**
 * Xandeflix Prebuilt — CatalogSyncErrorState Component (Gate C11-P5B)
 *
 * Exibido quando a primeira sincronização do catálogo comercial real falha e
 * não há snapshot real promovido previamente disponível para local-first.
 */

import React from 'react';

interface CatalogSyncErrorStateProps {
  errorMessage?: string;
  onRetry?: () => void;
  onOpenPortal?: () => void;
  onOpenActivation?: () => void;
}

export const CatalogSyncErrorState: React.FC<CatalogSyncErrorStateProps> = ({
  errorMessage,
  onRetry,
  onOpenPortal,
  onOpenActivation,
}) => {
  return (
    <div className="bootstrap-state-container" role="alert">
      <div className="bootstrap-state-card">
        <div className="bootstrap-state-icon">⚠️</div>
        <h1 className="bootstrap-state-title">
          Falha na Sincronização do Catálogo
        </h1>
        <p className="bootstrap-state-desc">
          Não foi possível sincronizar o catálogo comercial para este dispositivo.
          {errorMessage ? ` (${errorMessage})` : ''}
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1.5rem' }}>
          {onRetry && (
            <button
              type="button"
              className="focusable-item btn-primary"
              onClick={onRetry}
            >
              🔄 Tentar Novamente
            </button>
          )}
          {onOpenPortal && (
            <button
              type="button"
              className="focusable-item"
              onClick={onOpenPortal}
              style={{
                backgroundColor: '#10b981',
                color: '#ffffff',
                border: '1px solid #34d399',
                padding: '0.6rem 1.2rem',
                borderRadius: '4px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              👤 Portal do Cliente
            </button>
          )}
          {onOpenActivation && (
            <button
              type="button"
              className="focusable-item"
              onClick={onOpenActivation}
              style={{
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: '1px solid #38bdf8',
                padding: '0.6rem 1.2rem',
                borderRadius: '4px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              🔑 Status da Ativação
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
