# P2.50D-R1 — contexto Git recuperado; regressão bloqueada no Chromium

**RESULT=P2_50D_R1_BLOCKED_REGRESSION_CHROME_STARTUP.**28/10/2026, America/Sao_Paulo. Retomada autorizada pelo pedido do usuário "continue" após diagnóstico/plano R0. O verificador canônico original passou no novo clone real, mas a regressão completa falhou; o gate não está aprovado e o build P2.50D não foi retomado. Nenhum APK gerado ou instalado.

Workspace novo: `C:/Xandeflix/xandeflix-prebuilt-c11-main/tmp/tmdb-episode-metadata-enrichment-20261027/P2_50_APK_V139/P2_50D_R1/workspace`. O candidato C original está intacto. A rota A+D+C foi aplicada com Git próprio e histórico integral, índice próprio via read-tree HEAD e origin canônico. Não há worktree ligada, alternates ou hardlinks compartilhados.1490 arquivos gerenciados e6853 dependências físicas copiados byte a byte, sem ambiente real, dist/APKs/outputs anteriores. HEAD recebido d8a74102124fbb8a3f013f6fd8a502519c1db4b8 e referência histórica b3fc8d1e3844bc5601813ab1b298289af5b3f1fd preservados; branch histórica fix/source-output-format-recovery mantida.

## Recuperação estrutural comprovada

canon:check original executado no clone: PASS952 protegidos/45 recibos, Android1.0.39/code39. Não foi alterado o verificador nem falsificado o contexto Git. Novo recibo CANON-01-P250-V139-CANONICAL-RECOVERY reconhece os bytes P2.43B+UnicodeC da interface, versão39 e revisão do runner;44 recibos históricos intactos. O campo de aprovação do schema registra a autorização local do usuário para a rota concreta, com proveniência explícita; não representa nova adjudicação independente do Chat Mestre.

As quatro fixtures foram revisadas:38 gerado explicitamente a partir de39; grant sintético encadeado à última concessão Gradle; stale com baseline37; lista estrita com apenas o novo gate.36 chamadas assert e155 chamadas rejects preservadas; somente input de um negativo e uma lista de expectativa mudam. Cauda de37 suítes byte-idêntica.204 controles reais passaram. Nenhum produto foi editado neste R1.

| Produto recebido | SHA256 preservado |
| --- | --- |
| ActiveSourceSettings.tsx | d4d369b39e012ddf37c6636a2b003a7a0900d7ce02474408981e5fb8624aaad2 |
| android/app/build.gradle | e369559d8283e3e73cbf17d8e48860e41b843dd085c7f74f1acb10feaea5e9b8 |

## Bloqueio exato e alcance

canon:test terminou exit1 após204 controles e34 suítes PASS. A35ª suíte, `scripts/test-series-episode-return.mjs`, passou a verificação estática inicial de retenção de memória, mas falhou com **Error: TIMEOUT_CHROME** na linha57. O teste original aguardou o arquivo DevToolsActivePort no perfil temporário por100 iterações de30ms, mais overhead. O arquivo não surgiu nessa janela; os cenários UI de foco/retorno não executaram. A causa exata no SO/Chromium não foi estabelecida; não atribuir o evento ao código de produto, credenciais ou Supabase. Warnings do esbuild sobre import.meta estão no log, sem evidência causal para o timeout.

Duas suítes finais NÃO EXECUTADAS: trailer-containment-r4 e tmdb-episode-enrichment. Não houve retry, aumento de timeout, skip, patch da suíte ou concessão adicional para aceitar a falha. O finally do teste fechou servidor/cliente e solicitou término de seu Chrome; a inspeção posterior não encontrou processo com o perfil próprio xf-episode-return. Nenhum processo alheio foi encerrado.

C11 prévio PASS. C11 posterior, typecheck, status8, refresh19, Unicode/AST, P2.27 e canon final NÃO EXECUTADOS após a falha. Unicode e guarda continuam nos hashes C aprovados; isso não é nova execução desses testes. Os resultados históricos P2.27/C permanecem preservados. O restante da recuperação/build precisa de nova decisão sobre esse impedimento; nenhum próximo gate foi iniciado.

## Preservação

Snapshots completos C/congelado/1.0.38 byte-idênticos; .git do root,1346 arquivos históricos,51 APKs do root e2 da fase intactos. APK1.0.38 continua SHA2560ca7022e44085d80bfbca1f27f7b1c1981598ceb2f8d9d185b962510e897c595. Mesmos HEAD/main/branch/origin, dez L1 e index vazio. Fechamentos C/D/R0 e recibos P2.43B/P2.44-R3/P2.50B conferidos. No clone: cinco arquivos existentes mudaram (runner e quatro normativos append-only), três docs novos. Dois produtos apenas reconhecidos; hashes completos em PRESERVATION_R1.json.

Sem verificador/A22/workflow/package/lockfile ou demais scripts alterados. Configuração pública não carregada/copied/revalidada. Nenhum Vite build de produção, Capacitor, Gradle, APK, dispositivo, Supabase, commit/push/PR ou promoção ao root. Transpilação esbuild de fixture local pelo teste não é build de produção; nenhum bundle/APK de entrega foi produzido. Homologação física e revisão final do Chat Mestre PENDING.

Incidentes do auxiliar antes do clone: leitura exploratória de nome inexistente e propriedade RESULT/result corrigida, registrados em INCIDENTS_R1.md. FAIL canônico da regressão é separado, preservado e prevalece sobre qualquer sucesso parcial. Evidências: AUTHORIZATION_R1, SPEC_R1, BEFORE_R1, COPY_R1, GIT_OPERATIONS_R1, RUNNER_REVIEW_R1, REGISTRATION_R1, PRIOR_APPROVALS_R1, logs01–03, regression-result e log da suíte no tmp do clone, STOP_R1, PRESERVATION_R1 e RESULT. Helpers de conclusão PASS foram preparados, mas não executados nem tratados como evidência.

```text
P2_50C_PREPARATION=PASS
ISOLATED_GIT_CONTEXT=PASS
DEPENDENCIES_ISOLATED=PASS
PROTECTED_FILE_AUTHORIZATIONS=REGISTERED_ADDITIVELY
ANDROID_VERSION_CODE=39
ANDROID_VERSION_NAME=1.0.39
APPROVED_PRODUCT_HASHES=PRESERVED
RUNNER_REVIEW=PASS_STATIC_FOUR_FIXTURES
CANONICAL_VERIFIER=PASS_BEFORE_REGRESSION
CANONICAL_CONTROLS=PASS_204
CANONICAL_REGRESSION=FAIL_34_PASSED_1_FAILED_2_NOT_RUN
REGRESSION_FAILURE=TIMEOUT_CHROME
C11_LOCK=PASS_BEFORE_ONLY
TYPECHECK=NOT_RUN_AFTER_FAILURE
SOURCE_STATUS_TESTS=NOT_RUN_AFTER_FAILURE
SOURCE_REFRESH_TESTS=NOT_RUN_AFTER_FAILURE
UNICODE_CORRECTION=PRESERVED_BY_APPROVED_HASH_NOT_RETESTED
AUTHORIZATION_GUARD=PRESERVED_BY_APPROVED_HASH
P2_27_EVIDENCE_GATE=HISTORICAL_EVIDENCE_PRESERVED_NOT_REEXECUTED
CANONICAL_VERIFIER_MODIFIED=NAO
ROOT_GIT_MODIFIED=NAO
ORIGINAL_CANDIDATE_MODIFIED=NAO
CANDIDATE_PRODUCT_CODE_MODIFIED=NAO
FROZEN_WORKSPACE_PRESERVED=SIM
APK_V138_PRESERVED=SIM
VITE_BUILD=NAO
CAPACITOR_COPY=NAO
GRADLE_BUILD=NAO
APK_GENERATED=NAO
APK_INSTALL=NAO
SUPABASE_WRITE=NAO
PHYSICAL_HOMOLOGATION=PENDING
CHAT_MASTER_REVIEW=PENDING
RESULT=P2_50D_R1_BLOCKED_REGRESSION_CHROME_STARTUP
NEXT_GATE_STARTED=NAO
```
