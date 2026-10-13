# C11 — DPAD_NAVIGATION_FLUIDITY — evidência de 2026-10-06

Contrato: [C11_DPAD_NAVIGATION_FLUIDITY](../architecture/C11_DPAD_NAVIGATION_FLUIDITY.md).
Clone C11 independente, main, HEAD61ec00902be5d0037adf79c68b3a8624b3a2bd6e;
correção local explicitamente solicitada. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.
Specs precederam código. Sem Git/backend/reset/alteração de identidade.

## Implementação

Passos horizontais de trilha usam irmãos; grade usa cache fraco de controles/colunas invalidado por DOM/viewport. Foco preventScroll síncrono, uma rolagem no próximo frame; somente repeat é limitado55ms. Eventos tratados, Enter e edição de texto são preservados.

## Verificação e limites

Hook real browser:12 pressões discretas→índice12,1 consulta/1 leitura de estilo/1 scroll; trilha avançou até0-10 sem deslocar página verticalmente. Resize, disabled/style, Enter único, input e cleanup passaram. Fire com APK final:10 DPAD_RIGHT→índice10; DOWN em7colunas→17; ida e retorno sidebar funcionaram. Medidas são daquela execução, não FPS/SLA universal.

Typecheck/build/lock canônico e APK final passaram. Dados detalhados de fixtures
e aparelhos em tmp/c11-phone-series-20261006 (ignorado, sem conteúdo privado).
A entrega consolidada, hash e preservação de dados estão no
[relatório completo](C11_OPTIMIZATION_REPORT_20261006.md), atualização a partir do item24.
