# CANON-01 - Registro de execucao controlada

Baseline: b3fc8d1e3844bc5601813ab1b298289af5b3f1fd.
Preflight local/remote/origin/main PASS e arvore limpa antes do Gate.
Especificacao/allowlist anterior aos testes em
[Phased Expansion](../architecture/XANDEFLIX_PREBUILT_PHASED_EXPANSION.md).
Homologacao fisica fornecida pelo operador em
[Android1.0.37](ANDROID_V1_0_37_PHYSICAL_HOMOLOGATION.md).

Este registro inicial nao afirma validacoes ainda nao executadas.
CURRENT_GATE=CANON-01; CHAT_MASTER_REVIEW=PENDING; NEXT_GATE_STARTED=NAO.
Etapas, resultados locais, diff/artefatos e recibo Git serao acrescentados
apos evidencia, sem adjudicacao definitiva pelo executor.

## Resultado da validacao - 2026-10-19

RESULT=FAIL. A etapa de regressao encontrou falha obrigatoria e bloqueou
branch/commit/push/builds posteriores. Nao remover a suite para tornar o Gate
verde. Trabalho preservado localmente na main de baseline, sem commit.

O verificador estatico conferiu861 arquivos protegidos contra objetos Git
da baseline, marcadores/fases/contratos/packageId/hooks e dependencia Git.
Quarenta e dois controles sinteticos PASS, incluindo rejeicao de suite sempre
verde, negativos removidos, fonte/seguranca/backup alterados, CI omitido/
condicional/comentado, Git/dependencia ausente e evolucao1.0.38 permitida
com Gate especifico/negada sem ele. Nenhuma versao real foi alterada.

Sucesso das suites existentes antes da falha:
- validate-device-bootstrap.mjs: importacao/promocao/preservacao, PASS.
- test-c105-complete-root-search.mjs: busca/index local completo, PASS.
- test-c107-catalog-return-navigation.mjs: retorno/navegacao, PASS.
- test-c11-vod-direct-stream-contract.mjs: fonte direta/autorizacao, PASS.
- test-c11-playback-session-c9-runtime-wiring.mjs:10/10, PASS.

Falha: scripts/validate-security-recovery.mjs, teste3.4 SIGNED_DELTA_V1_ACCEPTED.
O DeltaV1 assinado foi rejeitado com UPDATE_FAILED /
TARGET_CATALOG_HASH_MISMATCH_REJECTED: hash do catalogo target calculado
diverge do targetCatalogSha256 do manifest. Assinatura positiva, negativos
criptograficos e importacoes FullV1/FullV2 passaram antes dessa falha.
A suite saiu com1. Repeticoes apos mudancas no verificador/recibo reproduziram
o mesmo erro. A suite e os arquivos src/update/src/security continuam
identicos a baseline (integridade conferida), sem patch de produto neste Gate.
Isso localiza uma falha herdada de validacao; nao atribui ainda a causa a
fixture ou runtime e nao declara regressao fisica nos aparelhos homologados.

Phone orientation e landscape nao executados pelo runner apos a falha.
Vite/build e CI remoto nao executados neste Gate; etapa8 nao iniciada.
C11 lock antes/depois PASS com9 negativos e suites26/27/6; typecheck PASS.
O campo protectedIntegrity do check estatico e separado do REGRESSION_LOCK
integrado: integridade PASS nao mascara resultado dinamico FAIL.

CI compativel preparado em Windows/Linux, Node24, historico completo,
contents:read, sem credenciais persistidas/deploy/artefatos Android.
Acoes oficiais fixadas em SHAs obtidos por consulta aos tagsv6. Referencias:
[actions/checkout](https://github.com/actions/checkout) e
[actions/setup-node](https://github.com/actions/setup-node). Nao foi enviado
ao GitHub nem certificado por execucao remota. Nenhum ruleset alterado.

## Falhas de implementacao do verificador e limites

Primeiro comparador normalizava LF somente no arquivo local; um script
legado com finais mistos no Git causou falso positivo. Leitura dos dois blobs
confirmou igualdade apos normalizacao; algoritmo corrigido para comparar os
DOIS lados e controle LF/CRLF adicionado. Nenhum arquivo antigo normalizado.
Helper diagnostico de Node tentou usar process indisponivel no REPL; leitura
de bytes foi refeita sem esse global. Nao afetou o produto.

Recibo fail-closed do runner registra suite/exit e remainingSuites NOT_RUN;
nenhum assert existente alterado. Corrigir o teste positivo G10 exige
adjudicacao da causa/allowlist; este Gate nao autoriza mudar update/security
ou enfraquecer o hash para aceitar um Delta divergente.

## Cross-check e evidencias preservadas

Baseline1264 arquivos rastreados; escopo de14 arquivos autorizado. Todos os
arquivos src/Android/Supabase/suites antigas e140 APK/AAB inventariados foram
conferidos e preservados byte a byte. Gradle permanece1.0.37/code37.
Sem Supabase write/migration, dados de usuario, runtime funcional, instalacao,
reset, release, distribuicao Android, Tizen/webOS ou proximo Gate.
Homologacao fisica e a evidencia fornecida pelo operador,20/20 funcionais,
21/21 capturas/90min, sem novos testes fisicos ou logs/PIDs inventados.

Logs/JSON privados em tmp/canon-01: baseline.json, scope-audit.json,
c11-before.log, c11-after.log, typecheck.log, canonical-contract-result.log,
canonical-tests-reporting.log, regression-result.json e logs por suite.
Git ls-remote confirma main b3fc8d1e3844bc5601813ab1b298289af5b3f1fd;
branch governance/canon-01-hardening inexiste. HEAD local e baseline iguais.

Arquivos do trabalho local:
- AGENTS.md
- docs/architecture/XANDEFLIX_PREBUILT_ARCHITECTURE_CONTRACT.md
- docs/architecture/XANDEFLIX_PREBUILT_EXECUTION_CONTRACT.md
- docs/governance/GATE_EXECUTION_RULES.md
- docs/STATUS.md
- docs/EVOLUTION_REPORT.md
- docs/ERRORS_AND_BLOCKERS.md
- docs/architecture/XANDEFLIX_PREBUILT_PHASED_EXPANSION.md
- docs/evidence/ANDROID_V1_0_37_PHYSICAL_HOMOLOGATION.md
- docs/evidence/CANON_01_EXECUTION.md
- package.json
- scripts/verify-canonical-contract.mjs
- scripts/test-canonical-regression.mjs
- .github/workflows/canonical-regression.yml

## Pendencias e adjudicacao

Bloqueio principal: G10/DeltaV1 positivo. Nao publicar enquanto a regressao
obrigatoria falhar. Google Play continua PLANNED/not ready; Android TV fisico
PENDING. Piloto60/painel analitico nao executados; crescimento/infraestrutura
e Gate Tizen/webOS dependem da analise futura. Regras remotas nao alteradas.
Aguardar decisao do Chat Mestre, preservando o trabalho e a baseline.

```text
RESULT=FAIL
CANONICAL_CONTRACT=PASS
REGRESSION_LOCK=FAIL
C11_LOCK=PASS
TYPECHECK=PASS
BUILD_VALIDATION=NOT_RUN
FILES_CHANGED=14
LOCAL_COMMIT=NONE
REMOTE_COMMIT=NONE
LOCAL_REMOTE_MATCH=NAO
REVIEW_BRANCH=NONE
ANDROID_BASELINE_PRESERVED=SIM
APP_VERSION_CHANGED=NAO
ANDROID_APK_CHANGED=NAO
SUPABASE_CHANGED=NAO
USER_DATA_CHANGED=NAO
TIZEN_WEBOS_STARTED=NAO
MAIN_MERGED=NAO
NEXT_GATE_STARTED=NAO
CHAT_MASTER_REVIEW=PENDING
```
LOCAL_REMOTE_MATCH=NAO refere-se a branch de entrega nao criada, nao a divergencia
da main: main local/remota seguem iguais a baseline.

## Continuacao diagnostica - 2026-10-20

Pedido "continue" executado como diagnostico local, sem ampliar a allowlist
de produto. Preflight confirma clone C11 independente, origin esperado,
main/HEAD b3fc8d1 e os mesmos14 arquivos conhecidos. Nenhum Git write.

Causa reproduzida com a fixture sintetica original do G10: normalize.ts
produz extensions.categoryProvenance; CatalogDeltaBuilder/CatalogDelta nao
transportam extensions e CatalogDeltaApplier omite o campo ao reconstruir.
Comparacao estrutural encontrou somente $.extensions ausente. O manifest
contem corretamente o hash do target completo. Recolocar as extensoes numa
COPIA diagnostica restaura igualdade estrutural e binaria do JSON serializado:

```text
TARGET_EXPECTED_SHA256=e1a4563775222306f62c32f680b1f79c0eb27e277c23a7202ad3778b96a5d67e
RECONSTRUCTED_SHA256=162e8055cd4ad7bab25d48eb31b59b766e937c2477471b8627ba22f74add7477
COPY_WITH_TARGET_EXTENSIONS_SHA256=e1a4563775222306f62c32f680b1f79c0eb27e277c23a7202ad3778b96a5d67e
```

Hashes exclusivamente sinteticos; nao correspondem a APK, usuario ou fonte.
O validador de hash rejeita corretamente o catalogo incompleto. Nao e defeito
de assinatura, chave, segredo, final de linha ou permissao Vercel/Supabase.
Isso nao demonstra falha fisica de playback nem altera homologacao1.0.37.

Proposta revisavel, NAO aplicada, em tmp/canon-01/g10-proposed-fix.patch:
- src/update/catalog-delta.types.ts: targetExtensions opcional.
- src/update/catalog-delta-builder.ts: transportar as extensoes do target.
- src/update/catalog-delta-applier.ts: reconstruir exatamente esse campo.
- schemas/prebuilt-catalog-delta.schema.json: declarar o objeto opcional.

Sem copiar implicitamente extensoes da base: ausencia no target significa
remocao; objeto vazio e objeto ausente permanecem distintos. Hash, assinatura,
binding, contagens, staging e promocao continuam verificando o resultado.
Leitores antigos rejeitam o novo campo pelo schema estrito; compatibilidade
de distribuicao/full-package deve ser revisada antes de qualquer entrega.

Um loader diagnostico aplica a proposta somente a copias de modulos em RAM.
G9 incremental e G10 security/recovery INALTERADOS passaram nesse experimento
com exit0 e marcadores completos;11 casos adicionais passaram para preservar,
substituir, incluir, remover, ausencia, objeto vazio e tipos/campo invalidos.
Nao sao resultados da arvore oficial nem autorizacao para aplicar/publicar.
Nao houve persistencia de chaves privadas, dados reais ou chamadas a fontes.

O diagnostico tambem identificou schemas/ fora da cobertura do novo checker.
Dentro da allowlist CANON-01, spec/checker/negativo foram ampliados para
proteger esses contratos: agora867 arquivos e43 controles PASS. Nova execucao
oficial de canon:test manteve5 suites PASS e falhou no mesmo G10, exit1;
as2 seguintes continuam NOT_RUN. canon:check e diff --check PASS.
C11/typecheck PASS ja registrados continuam evidencias anteriores; nenhum
novo build, APK/AAB ou teste fisico foi executado nesta continuacao.

Evidencias privadas adicionais: diagnose-g10-delta.mjs, g10-root-cause.json,
g10-proposed-fix.patch, g10-candidate-result.json e logs candidate-*.log,
canonical-diagnosis-followup.log, todos em tmp/canon-01 ignorado pelo Git.

RESULT=FAIL; REGRESSION_LOCK=FAIL; CHAT_MASTER_REVIEW=PENDING.
Aplicar a correcao exige emenda nominal para os4 arquivos de produto/schema
acima e teste adicional, com registro de mudanca aprovado. O pedido vigente
CANON-01 declara RUNTIME_FEATURE_CHANGES_AUTHORIZED=NAO e allowlist fechada;
nao alterar src/schema ou suite existente para obter um PASS. Nenhum commit,
push, branch de revisao, merge ou proximo Gate iniciado.

## Emenda CANON-01-G10FIX executada - 2026-10-20

Chat Mestre autorizou os4 arquivos G10, novo teste, ajuste minimo de runner
e recibos/documentos, revogando commit/push nesta etapa. Trabalho anterior
preservado, sem reinicio do Gate. Spec previa no contrato de fases; hashes
nominais em docs/governance/CANON_CHANGE_AUTHORIZATION.json. Checker/CI/hooks
nao alterados. G9/G10 oficiais e novo teste PASS, incluindo compatibilidade
segura com FullV1/V2 assinado explicitamente importado apos rejeicao de Delta
incompativel. Nenhum fallback automatico de producao e alegado.

Checker868 arquivos PASS;43 controles e6 suites antigas PASS no runner.
Regressao agora bloqueia no teste legado de orientacao: regex exige atributos
consecutivos e nao aceita o supportsPictureInPicture ja presente no manifest.
Teste e Android identicos a baseline. Suite adicional G8 tambem FAIL por
armazenamento parental indisponivel na fixture Node, sem patch no player/
parental. Ambos fora da allowlist; nao foram alterados/omitidos para passar.
C11 antes/depois, typecheck, contrato G2, busca G7 e landscape separados PASS.
Builds web NOT_RUN por falha obrigatoria; sem APK/AAB/instalacao/Git/remote.

RESULT=FAIL; REGRESSION_LOCK=FAIL; G10_FIX_APPLIED=SIM.
Relatorio completo, matriz,13 arquivos desta emenda e todas as flags em
[CANON_01_G10_FIX_EVIDENCE](CANON_01_G10_FIX_EVIDENCE.md).
CHAT_MASTER_REVIEW=PENDING; NEXT_GATE_STARTED=NAO.

## Emenda CANON-01-LEGACYTESTS executada - 2026-10-20

Autorizacao expressa posterior permite corrigir somente os dois testes
legados e a governanca multirrecibo. Estado inicial21 arquivos confirmado,
sem reaplicar G10 ou reiniciar Gate. Assercao XML agora estrutural e fixture
G8 instalada antes do load parental. Cinco negativos/12 blocos antigos
intactos; novos cenarios XML e processos isolados mantem bloqueios reais.

G10FIX conserva recibo byte a byte. Novo recibo separado concede somente
dois hashes nominais de testes, com revisao especifica. Verificador exige
ambos, rejeita sobreposicao, hashes divergentes, revisao emprestada, escopo
indevido, campos desconhecidos e reescrita dos recibos atuais. Politica de
evolucao por novo Gate permanece, sem aprovar mudancas futuras nesta emenda.

Resultados oficiais locais: orientacao, G8, C12616 casos, C11/C910 casos,
VOD12 casos, G9, G10, teste Delta, C11 lock, contrato, busca e typecheck PASS.
canon:check868 arquivos PASS; canon:test72 controles/11 suites PASS, incluindo
os43 controles anteriores. npm run build e npm run site:build PASS/exit0.
Primeiro FAIL do novo controle negativo e sua correcao de entrada sintetica
foram preservados; nenhum build iniciado enquanto havia falha obrigatoria.

21 anteriores preservados (14 bytes identicos,5 append,2 governanca revisados),
14 originais auditados,140 artefatos intactos, HEAD/index inalterados.11
arquivos desta emenda,25 no Gate acumulado. Sem APK/versao nova/instalacao/
reset/Supabase/dados/Git write/deploy/proxima fase. Evidencia completa e flags
em [CANON_01_LEGACY_TESTS_EVIDENCE](CANON_01_LEGACY_TESTS_EVIDENCE.md).
Diff e auditoria em tmp/canon-01-legacytests, ignorado pelo Git.
RESULT=PASS tecnico da emenda; CHAT_MASTER_REVIEW=PENDING.

## CANON-01 AUTHORIZATION HARDENING - 2026-10-20

Pedido expresso posterior corrige somente a governanca. Diagnostico do Chat
Mestre confirmado: o positivo ANDROID-38 substituia G10 e o pin era
condicional ao identificador. O procedimento anterior fica superseded no
append normativo desta emenda, preservando a documentacao/recibos recebidos.

G10FIX/LEGACYTESTS agora sao obrigatorios por path/identidade e hash sem
condicao baseada no Gate lido. Futuras autorizacoes usam recibo NOVO e
registro append-only. Os dois scripts de governanca sao conferidos por
hashes nominais do novo recibo Hardening, sem isencao generica. Sobreposicoes
exigem cadeia explicita e revisao propria, sem flags/permissoes herdadas.

Preflight25 arquivos/140 artefatos PASS.95 controles/11 suites PASS, com os
72 cenarios anteriores preservados. canon:check870 arquivos, C11, typecheck,
update:check, security:check, playback:check, build e site:build PASS/exit0.
Nenhum teste oficial usa loader diagnostico ou modifica runtime; controles
de verificador usam entradas sinteticas e nao alteram os arquivos simulados.

25 anteriores preservados (18 identicos,5 append,2 governanca autorizados),
9 arquivos nesta emenda,27 acumulados. Historicos G10/Legacy byte a byte
intactos,140 APK/AAB preservados, HEAD/index/branch inalterados. Sem versao,
instalacao/reset, dados/Supabase, Git write, deploy ou SOURCE-FORMAT-01.
site:build recomendado para CI futuro, workflow atual intacto. Relatorio,
plano, flags e evidencias em [CANON_01_AUTHORIZATION_HARDENING](CANON_01_AUTHORIZATION_HARDENING.md).
RESULT=PASS tecnico; CHAT_MASTER_REVIEW=PENDING; NEXT_GATE_STARTED=NAO.
