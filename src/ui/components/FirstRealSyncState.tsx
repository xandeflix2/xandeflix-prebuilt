/**
 * Xandeflix Prebuilt — First Real Sync State & Home Skeleton (Cycle C11-P5B1)
 *
 * Apresenta a interface funcional da Home durante a primeira sincronização do
 * catálogo comercial real, garantindo interatividade imediata do AppShell sem
 * bloquear a navegação e sem exibir a fixture sintética como se fosse conteúdo comercial.
 */

import React from 'react';

export type FirstRealSyncCatalogState =
  | 'SYNCING_FIRST_REAL_CATALOG'
  | 'OFFLINE_WAITING_FOR_SYNC'
  | 'CATALOG_SYNC_ERROR';

interface FirstRealSyncStateProps {
  catalogState: FirstRealSyncCatalogState;
  progressText?: string;
  errorMessage?: string;
  onOpenActivation?: () => void;
  onOpenPortal?: () => void;
  onRetry?: () => void;
}

export const FirstRealSyncState: React.FC<FirstRealSyncStateProps> = ({
  catalogState,
  progressText = 'Preparando catálogo comercial...',
  errorMessage,
  onOpenActivation,
  onOpenPortal,
  onRetry,
}) => {
  const isOffline = catalogState === 'OFFLINE_WAITING_FOR_SYNC';
  const isError = catalogState === 'CATALOG_SYNC_ERROR';

  return (
    <main className="page-container first-real-sync-container" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Banner de Status Não-Bloqueante */}
      <div
        className="sync-status-banner"
        role="status"
        aria-live="polite"
        style={{
          background: isError ? 'rgba(239, 68, 68, 0.15)' : isOffline ? 'rgba(234, 179, 8, 0.15)' : 'rgba(14, 165, 233, 0.15)',
          border: `1px solid ${isError ? '#ef4444' : isOffline ? '#eab308' : '#0ea5e9'}`,
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              fontSize: '28px',
              animation: !isError && !isOffline ? 'spin 2s linear infinite' : 'none',
              lineHeight: 1,
            }}
          >
            {isError ? '⚠️' : isOffline ? '📡' : '⏳'}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
              {isError
                ? 'Atenção na Sincronização do Catálogo'
                : isOffline
                ? 'Aguardando Conexão para Sincronização'
                : 'Sincronizando Catálogo Comercial'}
            </h2>
            <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '0.95rem' }}>
              {isError
                ? errorMessage || 'Ocorreu uma falha durante o download ou validação do catálogo.'
                : isOffline
                ? 'Sem conexão com a internet. O aplicativo está pronto e sincronizará os títulos assim que a rede retornar.'
                : progressText}
            </p>
          </div>
        </div>

        {/* Ações de Atalho Rápidas */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
          {onOpenActivation && (
            <button
              type="button"
              className="focusable-item"
              onClick={onOpenActivation}
              style={{
                background: '#1e293b',
                color: '#38bdf8',
                border: '1px solid #334155',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              🔑 Ver Código de Ativação
            </button>
          )}

          {onOpenPortal && (
            <button
              type="button"
              className="focusable-item"
              onClick={onOpenPortal}
              style={{
                background: '#1e293b',
                color: '#e2e8f0',
                border: '1px solid #334155',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              Portal do Cliente
            </button>
          )}

          {isError && onRetry && (
            <button
              type="button"
              className="focusable-item"
              onClick={onRetry}
              style={{
                background: '#ef4444',
                color: '#ffffff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              Tentar Novamente
            </button>
          )}
        </div>
      </div>

      {/* Hero Skeleton */}
      <div
        className="hero-skeleton"
        style={{
          width: '100%',
          height: '240px',
          borderRadius: '16px',
          background: 'linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 2s infinite',
          marginBottom: '36px',
          display: 'flex',
          alignItems: 'flex-end',
          padding: '24px',
        }}
      >
        <div style={{ width: '40%', height: '28px', background: '#475569', borderRadius: '6px' }} />
      </div>

      {/* Rail Skeletons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {[1, 2].map((railIdx) => (
          <div key={railIdx}>
            <div style={{ width: '180px', height: '22px', background: '#334155', borderRadius: '4px', marginBottom: '16px' }} />
            <div style={{ display: 'flex', gap: '16px', overflow: 'hidden' }}>
              {[1, 2, 3, 4, 5, 6].map((cardIdx) => (
                <div
                  key={cardIdx}
                  style={{
                    minWidth: '160px',
                    height: '240px',
                    borderRadius: '10px',
                    background: 'linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 2s infinite',
                    animationDelay: `${cardIdx * 0.15}s`,
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
};
