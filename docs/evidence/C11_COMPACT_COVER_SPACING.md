# C11 — COMPACT_COVER_SPACING — evidência de 2026-10-06

Contrato: [C11_COMPACT_COVER_SPACING](../architecture/C11_COMPACT_COVER_SPACING.md).
Clone C11 independente, main, HEAD61ec00902be5d0037adf79c68b3a8624b3a2bd6e;
correção local explicitamente solicitada. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.
Specs precederam código. Sem Git/backend/reset/alteração de identidade.

## Implementação

Espaçamento entre capas da trilha6px, grade8px horizontal/12px vertical; margem de categoria12px. Valores aplicados sem ampliar lotes ou mudar regras de conteúdo.

## Verificação e limites

Browser com componentes reais confirmou6/8/12 e nenhum salto durante carga. Fire físico sem overflow e foco preservado na grade; expansão48→96 não alterou prefixo. Referência visual do usuário orientou a compactação; não se afirma medição exata de pixels internos da Netflix.

Typecheck/build/lock canônico e APK final passaram. Dados detalhados de fixtures
e aparelhos em tmp/c11-phone-series-20261006 (ignorado, sem conteúdo privado).
A entrega consolidada, hash e preservação de dados estão no
[relatório completo](C11_OPTIMIZATION_REPORT_20261006.md), atualização a partir do item24.
