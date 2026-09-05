/**
 * Xandeflix Prebuilt — EmptyState Component (Gate G6)
 *
 * Exibido exclusivamente quando existe um catálogo ativo legitimamente vazio.
 *
 * Princípios:
 * - VALID_EMPTY_CATALOG: Exige active pointer válido com zero entidades cadastradas.
 */

import React from 'react';

interface EmptyStateProps {
  title?: string;
  message?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Catálogo Vazio',
  message = 'Este catálogo ativo não possui títulos cadastrados no momento.',
}) => {
  return (
    <div className="empty-state-container">
      <div className="empty-state-icon">📭</div>
      <h2 className="empty-state-title">{title}</h2>
      <p className="empty-state-desc">{message}</p>
    </div>
  );
};
