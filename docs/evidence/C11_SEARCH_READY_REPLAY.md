# C11 — SEARCH_READY_REPLAY — evidência de 2026-10-06

Contrato: [C11_SEARCH_READY_REPLAY](../architecture/C11_SEARCH_READY_REPLAY.md).
Clone C11 independente, main, HEAD61ec00902be5d0037adf79c68b3a8624b3a2bd6e;
correção local explicitamente solicitada. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.
Specs precederam código. Sem Git/backend/reset/alteração de identidade.

## Implementação

SearchPage assina antes de initialize e guarda consulta/filtro mais recentes. Se digitados durante carregamento do índice, SEARCH_READY reaplica-os; Promise de inicialização não sobrescreve resultados publicados. Nenhuma mudança em engine/ranking/indexação.

## Verificação e limites

Bug observado fisicamente no APK33497EFF: consulta preenchida, evento READY limpou resultados. Fixture com SearchPage real e inicialização atrasada1800ms recebeu matrix/filtro Séries uma única vez e exibiu4 resultados, uma consulta final correta, zero erros. APK final Fire retornou11 resultados de protetor sem nova letra; O Protetor abriu por DPAD_CENTER. Busca por múltiplos termos conserva semântica atual da engine.

Typecheck/build/lock canônico e APK final passaram. Dados detalhados de fixtures
e aparelhos em tmp/c11-phone-series-20261006 (ignorado, sem conteúdo privado).
A entrega consolidada, hash e preservação de dados estão no
[relatório completo](C11_OPTIMIZATION_REPORT_20261006.md), atualização a partir do item24.
