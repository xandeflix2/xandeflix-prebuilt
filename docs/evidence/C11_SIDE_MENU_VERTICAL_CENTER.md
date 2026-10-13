# C11 — SIDE_MENU_VERTICAL_CENTER — evidência de 2026-10-06

Contrato: [C11_SIDE_MENU_VERTICAL_CENTER](../architecture/C11_SIDE_MENU_VERTICAL_CENTER.md).
Clone C11 independente, main, HEAD61ec00902be5d0037adf79c68b3a8624b3a2bd6e;
correção local explicitamente solicitada. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.
Specs precederam código. Sem Git/backend/reset/alteração de identidade.

## Implementação

Sidebar usa grid com áreas superior/inferior simétricas e nav central; logo alinhado ao topo e acessórios ao fim. Mantém scroll quando altura insuficiente e nenhuma mudança nos handlers de navegação.

## Verificação e limites

Browser produção equivalente6botões: centro270 na viewport540 Fire, centro400 na viewport800 tablet. APK final: Fire6botões, navCenter270/viewportCenter270; tablet6botões,426,667/426,5 (arredondamento CSS da viewport). Navegação física D-pad sidebar/retorno passou. Fixture dev8botões ultrapassava altura e foi ajustada somente na fixture para representar os6 da produção; não se afirma centralização sem overflow de8botões nessa altura.

Typecheck/build/lock canônico e APK final passaram. Dados detalhados de fixtures
e aparelhos em tmp/c11-phone-series-20261006 (ignorado, sem conteúdo privado).
A entrega consolidada, hash e preservação de dados estão no
[relatório completo](C11_OPTIMIZATION_REPORT_20261006.md), atualização a partir do item24.
