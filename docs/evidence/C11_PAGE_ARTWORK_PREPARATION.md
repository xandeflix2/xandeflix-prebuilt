# C11 — PAGE_ARTWORK_PREPARATION — evidência de 2026-10-06

Contrato: [C11_PAGE_ARTWORK_PREPARATION](../architecture/C11_PAGE_ARTWORK_PREPARATION.md).
Clone C11 independente, main, HEAD61ec00902be5d0037adf79c68b3a8624b3a2bd6e;
correção local explicitamente solicitada. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.
Specs precederam código. Sem Git/backend/reset/alteração de identidade.

## Implementação

MediaCard prepara capas do lote já renderizado, inclusive fora da viewport: grade48/busca até50. Trilhas preparam até20 itens quando próximas (600px); categorias distantes não são baixadas em conjunto. Fonte primeiro; falha/ausência usa o fallback TMDB existente.

## Verificação e limites

Fila2 ativos/128 pendentes/96 sucessos RAM; cancelamento compartilhado e timeout8s. Fixture real carregou48 antes da rolagem, manteve altura estável e reutilizou cache ao reabrir; duas capas sem fonte válida recorreram ao TMDB. Trilhas distantes não geraram preload. Suítes verificam quota, prioridade, reserva do hero, retry e invalidação. Não há promessa de instantaneidade cold/offline.

Typecheck/build/lock canônico e APK final passaram. Dados detalhados de fixtures
e aparelhos em tmp/c11-phone-series-20261006 (ignorado, sem conteúdo privado).
A entrega consolidada, hash e preservação de dados estão no
[relatório completo](C11_OPTIMIZATION_REPORT_20261006.md), atualização a partir do item24.
