/** Métricas sanitizadas do viewport para auditoria de densidade responsiva. */
export interface ViewportMetrics {
  innerWidth: number;
  innerHeight: number;
  screenWidth: number;
  screenHeight: number;
  devicePixelRatio: number;
  visualViewportWidth: number | null;
  visualViewportHeight: number | null;
}

export function readViewportMetrics(): ViewportMetrics | null {
  if (typeof window === 'undefined') return null;
  return {
    innerWidth: Math.round(window.innerWidth),
    innerHeight: Math.round(window.innerHeight),
    screenWidth: Math.round(window.screen.width),
    screenHeight: Math.round(window.screen.height),
    devicePixelRatio: Number(window.devicePixelRatio.toFixed(3)),
    visualViewportWidth: window.visualViewport ? Math.round(window.visualViewport.width) : null,
    visualViewportHeight: window.visualViewport ? Math.round(window.visualViewport.height) : null,
  };
}

/** Instala apenas um snapshot numérico sanitizado para auditorias locais. */
export function installViewportMetricsDiagnostic(): ViewportMetrics | null {
  const metrics = readViewportMetrics();
  if (metrics && typeof window !== 'undefined') {
    (window as Window & { __XANDEFLIX_VIEWPORT_METRICS__?: ViewportMetrics })
      .__XANDEFLIX_VIEWPORT_METRICS__ = metrics;
  }
  return metrics;
}
