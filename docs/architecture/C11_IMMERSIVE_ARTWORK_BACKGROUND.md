# C11 — Fundo imersivo por imagem — 2026-10-06

Pedido explícito do usuário: cores de fundo derivadas da capa/banner atual.
Especificação anterior ao código. Mesmo preflight/origin/main/HEAD/baseline
do ciclo C11_HOME_HERO_VISIBLE_FIX. CURRENT_GATE=NONE/NEXT_GATE_STARTED=NAO;
sem backend/Git/reset ou modificação do projeto 2.0.

- Home/Filmes/Séries recebem tons da imagem real do hero; detalhes preferem
  backdrop horizontal carregado, senão pôster. Acompanhar troca de conteúdo.
- Amostra canvas24x24 somente depois de image load, sem nova API/download,
  dependências, varredura de cards ou trabalho no boot. Máximo48 paletas RAM.
  Agrupar cores por bins e pesar saturação/brilho, ignorando transparência/preto/branco;
  derivar base escura e brilho suave com limites de luminância.
- Marcar somente hero/backdrop/pôster principal; imagens de cards/semelhantes
  não podem mudar tema. Evento load e MutationObserver src/childList com RAF
  deduplicado; limpar observer/evento/RAF/cores ao desmontar/trocar conteúdo.
- Imagens conservam carregamento normal. Arquivo cache nativo same-origin
  permite amostragem sem requisição adicional. Canvas bloqueado/ausência
  de imagem/monocromática/erro usam tema neutro. Não contornar CORS nem proxy.
- Textos/controles/foco permanecem; sombras e base transitam700ms, reduced-motion
  elimina transição. Sem ampliar pedidos de imagem nem persistir cores/URLs.

Allowlist: este plano/evidência C11_IMMERSIVE_ARTWORK_BACKGROUND;
src/artwork/artwork-palette.ts; src/ui/hooks/useImmersiveArtwork.ts;
Hero.tsx/Artwork.tsx e MovieDetailPage/SeriesDetailPage.tsx; src/index.css;
scripts/test-c11-artwork-palette.mjs; somente novo import nos dois harnesses
SSR de hero/artwork; docs/evidence/C11_OPTIMIZATION_REPORT_20261006.md
(relatório detalhado solicitado), acréscimos de memória, tmp/build/APK.

Aceitação: paleta dominante azul/vermelha, preto/branco/transparente neutros,
contraste branco >=7:1 na base/brilho; canvas SecurityError neutro, cache48;
browser real TMDB/cached images, mudança com hero/categoria/detalhe, nenhum
card alterando tema, sem erros/foco perdido; suites/build/lock/Gradle/signature
e instalação -r já autorizada nos três alvos. CORS documentado em
https://developer.mozilla.org/en-US/docs/Web/HTML/How_to/CORS_enabled_image.

LATEST_REGRESSION_WINS: experimento anonymous nos imgs visíveis falhou no
browser com CDN/cache atual, removendo hero/pôster. Antes de entrega, retirar
crossOrigin dos imgs preserva completamente fonte/TMDB/eligibilidade. Cores
dependem da leitura permitida da imagem exibida (cache nativo same-origin ou
imagem same-origin no web); fonte remota tainted mantém neutro. Verificar
imagens remotas normais e cores com bytes públicos reais servidos localmente
em fixture, representando o arquivo local usado pelo plugin Android.

Refinamento visual antes do patch: bins muito escuros ocultavam o tom da
imagem. Peso inclui brilho ao quadrado; base escura até36/canal e brilho até84
mantêm contraste >=7:1 mesmo se todas as componentes forem máximas.
