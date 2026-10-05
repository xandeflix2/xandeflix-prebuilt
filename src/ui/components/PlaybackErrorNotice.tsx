import React from 'react';

interface PlaybackErrorNoticeProps {
  message: string | null;
  onDismiss: () => void;
}

export function PlaybackErrorNotice({ message, onDismiss }: PlaybackErrorNoticeProps): React.JSX.Element | null {
  if (!message) return null;
  return (
    <section className="playback-error-notice" role="alert" aria-labelledby="playback-error-heading">
      <div>
        <h2 id="playback-error-heading">Erro na reprodução</h2>
        <p>{message}</p>
      </div>
      <button type="button" className="focusable-item btn-secondary" onClick={onDismiss}>
        Fechar aviso
      </button>
    </section>
  );
}
