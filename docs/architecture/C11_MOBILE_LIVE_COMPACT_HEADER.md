# C11 — cabeçalho compacto de canais no mobile — 2026-10-07

Pedido explícito: mesma altura de Home/Filmes/Séries, com Início, Voltar e
Transmitir dentro do cabeçalho; Voltar e Transmitir somente ícones.

Preflight read-only: workspace/top-level C:/Xandeflix/xandeflix-prebuilt-c11-main,
clone .git independente, origin https://github.com/xandeflix2/xandeflix-prebuilt.git,
main, HEAD61ec00902be5d0037adf79c68b3a8624b3a2bd6e. AGENTS, Architecture,
Execution, Source Data Boundary e lock de ativação lidos. Dirty anterior
preservado por baseline próprio. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.
Correção visual local solicitada; Git/backend/reset/rotação não autorizados.
Autorização anterior de APK/update in-place nos três aparelhos permanece;
usar apenas alvos conectados e mesma identidade/package/certificado.

## Escopo e allowlist anterior ao código

- src/ui/components/Header.tsx: destino DOM exclusivo da apresentação Live.
- src/ui/pages/LiveTvPage.tsx: portal de apresentação ao Header no mobile,
  mantendo callbacks existentes de Voltar/Home e Cast; fallback sem shell.
- src/ui/components/CastButton.tsx: opção visual iconOnly, padrão intacto,
  aria-label/title preservados; retorno local conectado conserva ação e ícone.
- src/index.css: cabeçalho estreito com mesma regra64px+safe-area de Home;
  título/total e três controles numa só barra, sem barra Live duplicada.
- Este contrato, evidência, relatório de otimizações e quatro memórias append-only.
- Saídas habituais dist/Capacitor assets/APK; nenhum Java/SDK/config novo.

O perfil mobile segue o breakpoint atual<600px. Tablet/Fire/desktop conservam
seus cabeçalhos/controles. No mobile a identificação Canais ao Vivo e total
ocupam o lugar da marca repetida nesta página, dentro do Header único. Não
ocultar informações embaixo da superfície de vídeo nativa. Botões44×44,
SVG sem rótulo visual mas com nome acessível; texto de erro Cast não aumenta
altura do Header. Estado conectado mantém retorno Neste aparelho por ícone.

Não alterar LiveCatalogService, seleção de canal, bounds/ref do preview,
handlers de tela cheia, autorização/C9, playback/PiP/Cast SDK ou dados.
Header permanece disponível enquanto carrega/sem catálogo; portal desmonta
ao sair e ao ampliar viewport, sem listeners adicionais no runtime.

## Aceitação

Browser com componentes reais: comparar altura das quatro páginas em320/390/411px,
controle desconectado/conectado/erro e largura ampla; ações preservadas, nenhum
overflow/duplicação e ícones somente. Typecheck/build com lock obrigatório.
APK verificado byte a byte/assinatura; update-r sem apagar dados nos conectados.
Conferência física limitada ao Header/ações e relatório fiel às evidências.
Fixtures não certificam receiver Cast/streaming, que não pertencem a este patch.
