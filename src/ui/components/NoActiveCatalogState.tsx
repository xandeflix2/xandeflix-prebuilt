/**
 * Xandeflix Prebuilt — NoActiveCatalogState Component (Gate G6)
 *
 * Exibido quando o dispositivo não possui nenhum catálogo ativo estabelecido.
 *
 * Princípios:
 * - NO_FALSE_EMPTY: Proibido classificar ausência de catálogo como "catálogo vazio"
 *   ou "nenhum título encontrado".
 * - INFORMATIVE: Apresenta o status explícito de espera de provisionamento do cliente.
 */

import React from 'react';

declare const __XANDEFLIX_DEBUG_BUILD__: boolean;

interface NoActiveCatalogStateProps {
  onRefresh?: () => void;
  onOpenDebugSource?: () => void;
  onOpenActivation?: () => void;
  onOpenManager?: () => void;
  onOpenPortal?: () => void;
}

export const NoActiveCatalogState: React.FC<NoActiveCatalogStateProps> = ({
  onRefresh,
  onOpenDebugSource,
  onOpenActivation,
  onOpenManager,
  onOpenPortal,
}) => {
  const isDebug = typeof __XANDEFLIX_DEBUG_BUILD__ !== 'undefined' && __XANDEFLIX_DEBUG_BUILD__;

  return (
    <div className="bootstrap-state-container" role="alert">
      <div className="bootstrap-state-card">
        <div className="bootstrap-state-icon">📦</div>
        <h1 className="bootstrap-state-title">
          Catálogo ainda não disponível neste dispositivo
        </h1>
        <p className="bootstrap-state-desc">
          O aplicativo universal está instalado e operacional, mas nenhum pacote de provisionamento
          de catálogo (PREBUILT) foi importado e ativado localmente.
        </p>
        <div className="bootstrap-state-steps">
          <div className="step-item">
            <span className="step-number">1</span>
            <span className="step-text">Gere um pacote de provisionamento ZIP válido.</span>
          </div>
          <div className="step-item">
            <span className="step-number">2</span>
            <span className="step-text">Execute a importação transacional via BootstrapService.</span>
          </div>
          <div className="step-item">
            <span className="step-number">3</span>
            <span className="step-text">O catálogo será promovido automaticamente para exibição.</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {onRefresh && (
            <button
              type="button"
              className="focusable-item btn-primary"
              onClick={onRefresh}
            >
              Verificar Novamente
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
              🔑 Ativação do Dispositivo
            </button>
          )}
          {isDebug && onOpenDebugSource && (
            <button
              type="button"
              className="focusable-item"
              onClick={onOpenDebugSource}
              style={{
                backgroundColor: '#dc2626',
                color: '#ffffff',
                border: '1px solid #ef4444',
                padding: '0.6rem 1.2rem',
                borderRadius: '4px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ⚙️ Configurar Fonte Real (DEBUG)
            </button>
          )}
          {isDebug && onOpenManager && (
            <button
              type="button"
              className="focusable-item"
              onClick={onOpenManager}
              style={{
                backgroundColor: '#7c3aed',
                color: '#ffffff',
                border: '1px solid #a855f7',
                padding: '0.6rem 1.2rem',
                borderRadius: '4px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              🛡️ Painel do Gestor (Lab)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
