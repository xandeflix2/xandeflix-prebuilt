# C11 — AUTOMATIC_CATEGORY_FOLD — evidência de 2026-10-06

Contrato: [C11_AUTOMATIC_CATEGORY_FOLD](../architecture/C11_AUTOMATIC_CATEGORY_FOLD.md).
Clone C11 independente, main, HEAD61ec00902be5d0037adf79c68b3a8624b3a2bd6e;
correção local explicitamente solicitada. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.
Specs precederam código. Sem Git/backend/reset/alteração de identidade.

## Implementação

Movies/Series ativam paginação automática em CatalogGrid: sentinel observado240px antes da tela, fallback scroll+rAF, uma leitura em curso. Botão Carregar Mais sai; Carregando… aparece durante espera e desaparece após anexar lote. Erro suspende tentativa automática e oferece retry.

## Verificação e limites

Fixture48→96→120, prefixo/foco estáveis,1 leitura máxima, reset de categoria48 e retry48→96 passaram. Fire físico final48→96 preservou48 rótulos/foco do último card, sem botão e sem overflow. Ordem atual aleatória por blocos preservada; lançamentos mantêm regra anterior. Semelhantes continuam limitados pelo sistema.

Typecheck/build/lock canônico e APK final passaram. Dados detalhados de fixtures
e aparelhos em tmp/c11-phone-series-20261006 (ignorado, sem conteúdo privado).
A entrega consolidada, hash e preservação de dados estão no
[relatório completo](C11_OPTIMIZATION_REPORT_20261006.md), atualização a partir do item24.
