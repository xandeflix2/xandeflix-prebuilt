/**
 * Xandeflix Prebuilt — LoadingState Component (Gate G6)
 *
 * Indicador de carregamento e leitura de dados locais do dispositivo.
 */

import React from 'react';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Carregando catálogo local...',
}) => {
  return (
    <div className="loading-state-container" role="status">
      <div className="loading-spinner" />
      <p className="loading-message">{message}</p>
    </div>
  );
};
