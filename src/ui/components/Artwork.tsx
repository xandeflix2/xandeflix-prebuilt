/**
 * Xandeflix Prebuilt — Artwork Component (Gate G6)
 *
 * Renderizador de arte visual com fallback local para erros ou ausência de imagem.
 *
 * Princípios:
 * - RESILIENT FALLBACK: Se uri falhar ou for ausente, renderiza placeholder gráfico local.
 * - SANITIZED URI: Remove barras duplicadas em URLs malformadas sem quebrar o protocolo.
 * - RESET ON URI CHANGE: Reseta o estado de erro quando a URI do item é atualizada.
 * - ZERO EXTERNAL FETCH: Não consulta provedores de arte de terceiros em runtime.
 */

import React, { useState } from 'react';

interface ArtworkProps {
  uri?: string;
  title: string;
  kind?: 'poster' | 'backdrop' | 'thumbnail';
  className?: string;
}

export const Artwork = React.memo<ArtworkProps>(function Artwork({
  uri,
  title,
  kind = 'poster',
  className = '',
}) {
  const [hasError, setHasError] = useState(false);
  const [lastUri, setLastUri] = useState(uri);

  if (uri !== lastUri) {
    setLastUri(uri);
    setHasError(false);
  }

  let cleanUri = uri ? uri.replace(/([^:])\/\//g, '$1/') : undefined;
  if (cleanUri && cleanUri.startsWith('http://') && (cleanUri.includes('tmdb.org') || cleanUri.includes('themoviedb.org'))) {
    cleanUri = cleanUri.replace(/^http:\/\//, 'https://');
  }
  const showFallback = !cleanUri || hasError;

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
      src={cleanUri}
      alt={title}
      className={`artwork-img artwork-${kind} ${className}`}
      loading="lazy"
      decoding="async"
      onError={() => setHasError(true)}
    />
  );
});
