/**
 * Xandeflix Prebuilt — Artwork Component (Gate G6)
 *
 * Renderizador de arte visual com fallback local para erros ou ausência de imagem.
 *
 * Princípios:
 * - RESILIENT FALLBACK: Se uri falhar ou for ausente, renderiza placeholder gráfico local.
 * - ZERO EXTERNAL FETCH: Não consulta provedores de arte de terceiros em runtime.
 */

import React, { useState } from 'react';

interface ArtworkProps {
  uri?: string;
  title: string;
  kind?: 'poster' | 'backdrop' | 'thumbnail';
  className?: string;
}

export const Artwork: React.FC<ArtworkProps> = ({
  uri,
  title,
  kind = 'poster',
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);

  const showFallback = !uri || hasError;

  if (showFallback) {
    return (
      <div
        className={`artwork-fallback artwork-${kind} ${className}`}
        aria-label={`Imagem para ${title}`}
      >
        <div className="artwork-fallback-icon">
          {kind === 'backdrop' ? '🎬' : kind === 'thumbnail' ? '📺' : '🎥'}
        </div>
        <span className="artwork-fallback-title">{title}</span>
      </div>
    );
  }

  return (
    <img
      src={uri}
      alt={title}
      className={`artwork-img artwork-${kind} ${className}`}
      loading="lazy"
      onError={() => setHasError(true)}
    />
  );
};
