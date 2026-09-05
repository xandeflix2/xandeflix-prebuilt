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

interface NoActiveCatalogStateProps {
  onRefresh?: () => void;
}

export const NoActiveCatalogState: React.FC<NoActiveCatalogStateProps> = ({ onRefresh }) => {
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
        {onRefresh && (
          <button
            type="button"
            className="focusable-item btn-primary"
            onClick={onRefresh}
          >
            Verificar Novamente
          </button>
        )}
      </div>
    </div>
  );
};
