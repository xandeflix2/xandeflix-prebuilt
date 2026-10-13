# C11 — DETAIL_INITIAL_FOCUS — evidência de 2026-10-06

Contrato: [C11_DETAIL_INITIAL_FOCUS](../architecture/C11_DETAIL_INITIAL_FOCUS.md).
Clone C11 independente, main, HEAD61ec00902be5d0037adf79c68b3a8624b3a2bd6e;
correção local explicitamente solicitada. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.
Specs precederam código. Sem Git/backend/reset/alteração de identidade.

## Implementação

useDetailInitialFocus restaura topo ao entrar em outra obra e foca o hero quando os detalhes ficam disponíveis. A ação inicial fica dentro do destaque; foco posterior do usuário não é recapturado.

## Verificação e limites

Doze cenários browser movie/series × phone/tablet/TV × imediato/assíncrono passaram: topo0, hero visível e navegação posterior preservada. Fire físico O Protetor abriu com heroTop34, scrollTop0 e foco no hero. S24 Game of Thrones abriu com heroTop101 e scrollTop0; não se força foco D-pad em touchscreen. Uma amostra anterior cortada não se repetiu na trilha instrumentada.

Typecheck/build/lock canônico e APK final passaram. Dados detalhados de fixtures
e aparelhos em tmp/c11-phone-series-20261006 (ignorado, sem conteúdo privado).
A entrega consolidada, hash e preservação de dados estão no
[relatório completo](C11_OPTIMIZATION_REPORT_20261006.md), atualização a partir do item24.
