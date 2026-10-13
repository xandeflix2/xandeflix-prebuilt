# C11 — consulta digitada antes do índice pronto — 2026-10-06

Regressão observada no Fire após instalação33497EFF: input protetor preenchido,
índice terminou em SEARCH_READY e cards permaneceram ausentes. SearchPage
executa busca durante loading e initialize publica READY/[], apagando resultado
anterior; nenhuma consulta é repetida. Faz parte do pedido de busca/capas rápida.

Allowlist: SearchPage.tsx, scripts/test-c11-fire-search-detail.mjs (somente se
necessário), este contrato/evidência/relatório/memórias append-only. Preservar
SearchService, índice, ranking, C9 e source. Assinar estado antes de initialize;
guardar query/filtro atuais em ref. Não buscar antes de isSearchReady. Ao evento
READY, executar somente query/filtro vigentes. Não sobrescrever o estado publicado
pelo subscribe com retorno stale de initialize. Erro encerra loading; unmount
remove subscribe e não publica resultados. Testar índice atrasado e filtro/clear.
Mesmo clone/main/HEAD, CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem Git/backend.
