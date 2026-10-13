# C11 — GLOBAL_FOOTER_REMOVAL — evidência de 2026-10-06

Contrato: [C11_GLOBAL_FOOTER_REMOVAL](../architecture/C11_GLOBAL_FOOTER_REMOVAL.md).
Clone C11 independente, main, HEAD61ec00902be5d0037adf79c68b3a8624b3a2bd6e;
correção local explicitamente solicitada. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.
Specs precederam código. Sem Git/backend/reset/alteração de identidade.

## Implementação

Rodapé removido de AppShell em todos os perfis. Não se ocultou somente via CSS.

## Verificação e limites

Fixtures e APK final sem app-footer. Leituras físicas no Fire, tablet e S24 confirmam ausência. Nenhuma alteração de navegação, catálogo ou reprodução.

Typecheck/build/lock canônico e APK final passaram. Dados detalhados de fixtures
e aparelhos em tmp/c11-phone-series-20261006 (ignorado, sem conteúdo privado).
A entrega consolidada, hash e preservação de dados estão no
[relatório completo](C11_OPTIMIZATION_REPORT_20261006.md), atualização a partir do item24.
