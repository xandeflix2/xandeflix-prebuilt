# C11 — foco inicial e posição do hero interno — 2026-10-06

Pedido explícito: abrir filme/série com foco no hero e topo sem corte.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; workspace/main/remote/HEAD e contratos
já registrados nos ciclos deste dia. Sem Git/backend/alteração de licença.

Allowlist: src/ui/hooks/useDetailInitialFocus.ts, src/ui/pages/{MovieDetailPage,
SeriesDetailPage}.tsx e src/ui/components/PhoneSeriesDetail.tsx apenas para invocar
hook e marcar hero/foco; docs/evidence/C11_DETAIL_INITIAL_FOCUS.md, este contrato,
relatório e memórias append-only. Demais componentes/rotas globais não refatorados.

Antes de renderizar uma nova identidade de detalhe, resetar somente ancestrais
roláveis e documento para início. Quando o hero/detalhe resolve, focar ação
principal habilitada no hero com preventScroll. Se ação principal ainda indisponível,
focar hero programaticamente com tabIndex=-1. Não focar carrossel inferior nem
reposicionar após metadados/episódios/novas capas; não roubar navegação do usuário.
Celular sem d-pad continua exibindo início da página; mini player permanece sem
autoplay. Hook cancela frame pendente ao desmontar e não muda estado do catálogo.

Aceitação: browser real abrindo a partir de rolagem inferior e foco em card,
filme e série, dados imediatos e assíncronos. Hero permanece visível, foco nele ou
na ação principal, e movimento posterior não é desfeito. Confirmar no Fire após
APK final. Typecheck/build/lock/Java e preservação dos dados na atualização.

Compatibilidade dos testes SSR isolados: permitir somente shim sem efeito para a
nova importação useDetailInitialFocus em scripts/test-c11-home-hero.mjs e
scripts/test-c11-source-first-tmdb-artwork.mjs. As asserções de catálogo e imagem
permanecem intactas; o foco é verificado no browser com os componentes reais.
