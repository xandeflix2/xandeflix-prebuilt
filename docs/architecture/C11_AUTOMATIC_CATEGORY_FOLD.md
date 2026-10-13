# C11 — próxima dobra automática nas categorias — 2026-10-06

Pedido explícito: nas grades de Filmes/Séries, ao chegar ao antigo Carregar
Mais, iniciar próxima dobra automaticamente, mostrar Carregando… enquanto
aguarda e acrescentar as capas abaixo. Correção local no clone C11;
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem Git/backend/alteração de source.

Allowlist: CatalogGrid.tsx, MoviesPage.tsx, SeriesPage.tsx, useSegmentedBrowse.ts,
src/index.css; este contrato, evidência, relatório e quatro memórias append-only.
Ativar só nas duas grades paginadas; títulos semelhantes mantêm limite20.
Preservar batch48, cursores e ordenação por blocos48 já existentes. Não
ordenar novamente a dobra anterior, trocar IDs, buscar catálogo remoto nem
carregar todas as dobras antecipadamente. Remontar somente a grade quando
snapshot/categoria muda para limpar cota e pedido pendente de seleção antiga.

Sentinela IntersectionObserver no fim, antecedência240px; fallback scroll/resize
agrupado por frame se API ausente. Disparos foco da última capa também servem
ao D-pad. Uma leitura por vez; não aguardar download de todas as imagens para
inserir novos cards. Indicador role=status/aria-live enquanto leitura pendente,
sem botão Carregar Mais no funcionamento normal. Preservar foco e scroll.
Falha mantém capas e mostra erro com Tentar novamente; sem loop de retries.
Cleanup observer/listeners/frame na troca de página. Não alterar C9/ativação.

Aceitação: grade real48→96→120 ao rolar, prefixo/ID/foco estáveis, concorrência1,
troca categoria limpa, erro/retry controlados, fim sem indicador/botão e D-pad
sem precisar ativar um controle de paginação. Build/lock/C9 antes do APK.
