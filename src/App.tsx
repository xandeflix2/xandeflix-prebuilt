import React from 'react';

export default function App(): React.JSX.Element {
  return (
    <main className="skeleton-container">
      <header className="skeleton-header">
        <h1>Xandeflix Prebuilt</h1>
        <p className="skeleton-badge">App Skeleton</p>
      </header>
      <section className="skeleton-card">
        <div className="status-indicator">
          <span className="status-dot"></span>
          <span className="status-text">Foundation Ready</span>
        </div>
        <p className="skeleton-notice">Nenhum catálogo carregado.</p>
      </section>
    </main>
  );
}
