# C11 — estabilidade do mini player público — 2026-10-06

Verificação física no S24: trailer de Raio Negro falhou honestamente; Game of
Thrones abriu WebView público, emitiu ready e gerou mais de100 bounds em3,5s,
com deslocamento do documento. Native applyBounds chama setLayoutParams mesmo
sem alteração; JS publica todos os frames de ResizeObserver/scroll. Não presumir
causa exclusiva de toda abertura cortada; outra abertura do hero ficou no topo.

Allowlist: SeriesTrailer.tsx, PublicTrailerPlugin.java, este contrato/evidência,
relatório/memórias append-only. Deduplicar bounds equivalentes (tolerância0,5px),
normalizar ruído subpixel e guardar último valor somente por sessão; Native
comparar parâmetros inteiros antes de requestLayout. WebView público não deve
tomar foco de entrada automaticamente; conservar controles de toque. Não mudar
política de URLs/IDs, C9, sessão da fonte, bridge privilegiada ou origem pública.
Aceitação: browser open/resize/scroll/close, ausência/erro; native ready sem loop
de posições e tela estável após toque. YouTube pode bloquear vídeo/incorporação;
fallback público e mensagem continuam obrigatórios. CURRENT_GATE=NONE;
NEXT_GATE_STARTED=NAO. Patch local autorizado para completar o layout solicitado.
