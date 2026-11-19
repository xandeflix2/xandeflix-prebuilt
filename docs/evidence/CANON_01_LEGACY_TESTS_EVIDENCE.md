# CANON-01-LEGACYTESTS - testes legados e autorizacoes independentes

GATE=CANON-01; AMENDMENT=CANON-01-LEGACYTESTS; CHAT_MASTER_REVIEW=PENDING.
Autorizacao expressa do Chat Mestre em2026-10-20, anexo SHA-256
6db32f1cc2bb81913434dc13bd558843b405543e8660f7b91525f55ec1ef34f1.
Baseline b3fc8d1e3844bc5601813ab1b298289af5b3f1fd, main, clone independente
C:/Xandeflix/xandeflix-prebuilt-c11-main, origin canonico confirmado.
Git index SHA-256 inicial002ee0d851ae3e7f8e9b7a79957d83f1067aef4d7d62b674e561e529b0362778.

Preflight confirmou21 arquivos anteriores por SHA-256 e1264 rastreados;
os140 APK/AAB inventariados conferem hash e tamanho. Recibo G10FIX SHA-256
9a8d750edc932cb7f97fda0129b368c5cac728273f34c4402be739abb08c64cf.
Captura privada anterior: tmp/canon-01-legacytests/before.json. Especificacao
previa e allowlist em XANDEFLIX_PREBUILT_PHASED_EXPANSION.md, secao desta emenda.
Sem Git write, backend, runtime novo, Android build, instalacao ou reset.

## Causas confirmadas e criterio

Orientacao: regex de atributos consecutivos rejeitava supportsPictureInPicture
entre name/exported, embora o manifest baseline tivesse valores corretos.
G8: Node nao oferecia localStorage; load parental cacheava estado error e
bloqueava corretamente MOVIE_PLAYBACK_FLOW antes de C9/resolver/player.
Corrigir testes/fixture, sem alterar esses bloqueios de producao.

Resultados oficiais e auditoria serao acrescentados apos execucao real.
Este registro inicial nao declara PASS de verificacoes ainda nao realizadas.

## Implementacao e diff dos testes

Orientacao troca somente a assercao fragil por extracao dos atributos das
activities, excluindo comentarios. Exige exatamente uma atividade com nome
.player.NativePlayerActivity, exported=false e screenOrientation=sensorLandscape;
duplicata de atributo falha. Os cinco negativos anteriores ficam integrais.
Novos positivos: seis permutacoes de atributos com PiP e aspas simples.
Novos negativos: exported errado/ausente, orientacao errada/ausente, atributo
duplicado, atividade somente comentada e atividade duplicada.14 casos novos.
Manifest, MainActivity, PiP, player, D-pad e politica real nao foram editados.

G8 instala exclusivamente installUnconfiguredParentalFixture existente,
antes de executar setup/ingestao/playback. As dependencias ESM ja foram
avaliadas nesse ponto: uma assercao exige status loading e outra confirma
a identidade do singleton reimportado. Nenhum load efetivo pode preceder a
fixture. Os12 blocos originais entre SETUP e NO_CENTRAL_PROXY sao preservados
integralmente. Sem substituir authorizeParentalItem, authorize ou helper.

Oito processos filhos novos exercitam: armazenamento ausente, corrompido,
negado, erro cacheado mesmo apos instalar a fixture, nao configurado,
PIN incorreto/cancelamento/adulto bloqueado, bloqueio persistente e licenca
recusada. O bloqueio abre um nono processo com o registro sintetico para
confirmar que reiniciar nao libera PIN correto/administracao/adulto.
O caso nao configurado rejeita escrita inesperada e adulto. Casos de erro
exigem zero aquisicoes C9, zero resolucoes e zero launches; licenca recusada
permite chegar somente ao guard, sem resolver nem iniciar player. Fetch dos
filhos e uma porta que falha se chamada, nunca um desbloqueio de conteudo.
PIN/PUK e registros usados sao exclusivamente sinteticos, sem persistencia
de producao. C126 oficial complementa cobertura de PIN, PUK, cancelamento,
regras, cooldown, corrupcao, cripto, escrita e bloqueio antes do player.

Diff exato dos dois testes: tmp/canon-01-legacytests/legacy-tests.diff.

## Governanca multirrecibo

CANON_CHANGE_AUTHORIZATION.json permanece byte a byte como recebido, inclusive
seu Gate G10FIX e cinco grants. Novo recibo independente em
docs/governance/CANON_01_LEGACY_TESTS_AUTHORIZATION.json, parentGate CANON-01,
emenda CANON-01-LEGACYTESTS, aprovacao expressa e SHA-256 do pedido. Concede
somente hashes before/after dos dois testes, com testChangesReviewed=true,
plano de testes, impacto, evidencia e restricoes. Nao concede runtime ou Git.

O verificador exige ambos os arquivos, valida cada recibo separadamente e
associa revisao nominal a cada grant da sua origem. Map unico rejeita paths
duplicados; nao ha last-wins nem permissao herdada de outro recibo. Campos
desconhecidos no recibo/grant, hashes incorretos/stale, origem/escopo indevido,
revisao ausente e evidencia incompleta bloqueiam. Recibo Legacy restringe
explicitamente os dois paths e exige G8/C126/C9/orientacao no plano.

Recibos dos identificadores atuais sao fixados por Git blob hash normalizado
LF, preservando portabilidade Windows/Linux: G10 e73152f228cbb625c508062d70ef810e8342059a;
Legacy e59e2d328db3d0dfd8c1d873b154e2e3f7900a0c. Auditoria local tambem exige
igualdade RAW SHA-256 do recibo G10. Reescrita do motivo de qualquer recibo
atual e rejeitada. Fixacao e controles de mudanca nao sao assinatura da
autorizacao humana: reescrever conjuntamente verificador/recibos/evidencias
continua exigindo revisao humana independente e protecao de branch.

authorizedEvolution preserva o valor G10FIX anterior; authorizedAmendments
explicita os dois registros. A politica preexistente de NOVO Gate nominal
continua testada pelo controle sintetico de versao38; nao e uma autorizacao
de evolucao emitida por esta emenda, nem cria recibo/versao/artefato futuro.

Runner mantem os43 controles anteriores com suas assercoes integrais e
acrescenta29 controles: reconhecimento conjunto e negativos de ausencia,
corrupcao, estado, baseline, identidade, parentGate, revisao, hashes before/
after, duplicatas, escopo/runtime/futuro/G10, campos de bypass, injecao de
permissoes, escalada Git, origem, plano, evidencias e reescrita dos recibos.
O negativo antigo SUITE_CHANGE_NEEDS_SEPARATE_REVIEW comprova adicionalmente
que testChangesReviewed do segundo recibo nao vaza para grants do primeiro.

SUITES ganha G8 e C126 obrigatorios; preserva as oito suites anteriores e o
teste Delta, total11. Exit code, timeout e marcador continuam obrigatorios.
CI/package/hooks nao mudaram; a chamada atual canon:test executa tudo.

## Primeira tentativa e correcao da entrada negativa

Primeiro canon:test: FAIL/exit1. LEGACY_CANNOT_REPLACE_G10 alterava gate mas
mantinha evidencia do Gate antigo; o verificador recusava pela evidencia,
antes do codigo de identidade esperado. A entrada sintetica agora inclui
evidencia do Gate que tenta imitar e comprova a recusa especifica. Nenhuma
regra foi relaxada. Primeira tentativa/exit codes preservados em
attempt-1-results.json e attempt-1-regression.log no diretorio privado.
Builds nao executados enquanto essa verificacao falhava. Segunda execucao
oficial real passou72 controles e11 suites; nenhum loader/substituicao de
modulos em RAM foi usado nos comandos oficiais.

## Validacoes oficiais e exit codes

Execucao local Windows, Node24.19.0. Todas as ultimas invocacoes abaixo
terminaram com exit0. Saidas completas e exit codes em
tmp/canon-01-legacytests/official-results.json e official-*.log.
pre-c11.log registra tambem o lock anterior as edicoes, exit0.

| Verificacao/comando | Resultado final |
| --- | --- |
| node scripts/test-c11-phone-ui-orientation.mjs | PASS;5 negativos antigos +7 positivos/7 negativos XML novos |
| npm run playback:check | PASS;12 blocos originais +8 filhos e1 reinicio isolado |
| node scripts/test-c126-parental-control.mjs | PASS;16 testes, backendRequests=0, physicalDevices=false |
| node scripts/test-c11-playback-session-c9-runtime-wiring.mjs | PASS;10/10 |
| node scripts/test-c11-vod-direct-stream-contract.mjs | PASS;12 casos |
| npm run update:check | PASS;G9 oficial inalterado |
| npm run security:check | PASS;G10 oficial inalterado |
| node scripts/test-g10-delta-extensions-regression.mjs | PASS;teste dedicado G10 inalterado |
| npm run canon:check | PASS;868 arquivos protegidos, dois recibos reconhecidos |
| npm run canon:test | PASS;72 controles/11 suites |
| npm run c11:new-device:lock | PASS;antes/depois e pelos prebuilds |
| npm run typecheck | PASS;inclui prehook canonico |
| npm run contract:check | PASS |
| npm run search:check | PASS |
| npm run build | PASS;somente build web local |
| npm run site:build | PASS;manager/app/site e testes C151/C154-C160 |

Os builds foram iniciados somente apos todas as verificacoes obrigatorias
passarem. Nenhum deploy, chamada Vercel, escrita Supabase ou Git remoto.
Logs Powershell podem ser UTF16LE; os demais foram gravados UTF8. O leitor
de evidencia verifica BOM, sem reinterpretar ausencia de marcador como PASS.

## Auditoria final, arquivos e limites

Inventario anterior1264 arquivos rastreados conferido. Dos21 acumulados:
14 byte a byte identicos,5 documentos recebem somente append e2 scripts de
governanca recebem ajustes autorizados. Os14 originais tambem conferidos
contra a captura pre-G10:7 identicos,5 append e2 governanca autorizados.
Os4 arquivos G10, teste dedicado, recibo G10 e evidencia G10 ficam intactos.
140 APK/AAB conferidos por SHA-256 e tamanho, sem build Android ou instalacao.
HEAD b3fc8d1e3844bc5601813ab1b298289af5b3f1fd, branch main e indice Git
inalterados. Nenhuma alteracao fora da allowlist.25 arquivos acumulados.

Arquivos MODIFICADOS nesta emenda (9):
- scripts/test-c11-phone-ui-orientation.mjs
- scripts/validate-direct-playback.mjs
- scripts/verify-canonical-contract.mjs
- scripts/test-canonical-regression.mjs
- docs/architecture/XANDEFLIX_PREBUILT_PHASED_EXPANSION.md (append)
- docs/evidence/CANON_01_EXECUTION.md (append)
- docs/STATUS.md (append)
- docs/EVOLUTION_REPORT.md (append)
- docs/ERRORS_AND_BLOCKERS.md (append)

Arquivos ADICIONADOS nesta emenda (2):
- docs/governance/CANON_01_LEGACY_TESTS_AUTHORIZATION.json
- docs/evidence/CANON_01_LEGACY_TESTS_EVIDENCE.md

Evidencias privadas para revisao, sem staging/commit:
- before.json: hashes, conteudos anteriores e inventario.
- integrity-result.json: preservacao21/14, hashes finais, escopo, HEAD/index.
- legacy-tests.diff: diff dos dois testes.
- amendment-review.diff: diff dos11 arquivos desta emenda.
- full-review.diff: diff integral dos25 arquivos acumulados.
- regression-result.json:72 controles e11 suites reais.
- official-results.json e logs: resultados finais/exit codes.
- attempt-1-results.json e attempt-1-regression.log: falha anterior preservada.

Arquivos acima ficam em tmp/canon-01-legacytests, ignorado pelo Git.
Recibo G10 usa SHA-256 raw9a8d750edc932cb7f97fda0129b368c5cac728273f34c4402be739abb08c64cf,
mesmo do preflight. Assercoes antigas do runner, blocos G8 e negativos de
orientacao sao comparados literalmente pela auditoria, sem apenas contar
mensagens PASS. Dados locais reais, fontes, identidades e versao nao mudam.

Limites: nenhum novo teste fisico/AndroidTV/Fire/phone/tablet foi realizado;
a evidencia fisica1.0.37 segue historica. CI remoto Windows/Linux nao foi
acionado. Builds emitem avisos Vite de chunks grandes, imports estaticos/
dinamicos e externalizacao node:fs/path para navegador, sem erro de build;
otimizacoes/alteracoes de runtime correspondentes ficam fora desta allowlist.
Recibos e pins nao substituem revisao humana da autorizacao e do verificador.
Nenhum problema funcional de producao foi corrigido ou certificado aqui.

Recomendacao: revisar os diffs, recibos independentes e evidencias; adjudicar
os criterios tecnicos desta emenda. PASS nao e homologacao final CANON-01,
nao autoriza GitHub/publicacao e nao inicia outro Gate. Aguardar decisao
expressa do Chat Mestre, preservando o trabalho acumulado.

```text
GATE=CANON-01
AMENDMENT=CANON-01-LEGACYTESTS
RESULT=PASS
PREVIOUS_21_FILES_PRESERVED=SIM
G10_FIX_PRESERVED=SIM
G10_AUTHORIZATION_PRESERVED=SIM
ORIENTATION_TEST=PASS
G8_PLAYBACK_TEST=PASS
PARENTAL_C126=PASS
C11_C9_TESTS=PASS
G9_OFFICIAL=PASS
G10_OFFICIAL=PASS
MULTI_AUTHORIZATION_CHECK=PASS
CANONICAL_CONTRACT=PASS
REGRESSION_LOCK=PASS
C11_LOCK=PASS
TYPECHECK=PASS
WEB_BUILD=PASS
FILES_CHANGED_THIS_AMENDMENT=11
TOTAL_CANON_01_FILES=25
ANDROID_BASELINE_PRESERVED=SIM
APP_VERSION_CHANGED=NAO
ANDROID_APK_CHANGED=NAO
SUPABASE_CHANGED=NAO
USER_DATA_CHANGED=NAO
GIT_COMMIT=NAO
GIT_PUSH=NAO
MAIN_MERGED=NAO
NEXT_GATE_STARTED=NAO
CHAT_MASTER_REVIEW=PENDING
```
