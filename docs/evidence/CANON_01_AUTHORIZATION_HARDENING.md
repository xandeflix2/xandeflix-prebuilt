# CANON-01 - Authorization Hardening

GATE=CANON-01; AMENDMENT=CANON-01-AUTHORIZATION-HARDENING.
CHAT_MASTER_REVIEW=PENDING. Autorizacao expressa recebida do Chat Mestre na
mensagem CANON-01 AUTHORIZATION HARDENING em2026-10-20. Sem anexo nesta etapa.
Baseline b3fc8d1e3844bc5601813ab1b298289af5b3f1fd, main, origin
https://github.com/xandeflix2/xandeflix-prebuilt.git e workspace independente
C:/Xandeflix/xandeflix-prebuilt-c11-main confirmados. Nenhuma escrita Git.

Preflight25 arquivos conferidos contra a auditoria LEGACYTESTS,1264
rastreados e140 APK/AAB por SHA-256/tamanho. HEAD/index preservados.
Captura completa antes de editar: tmp/canon-01-auth-hardening/before.json.
Especificacao/allowlist previa no append correspondente do contrato de fases.

## Causa confirmada

O teste ANDROID-38 colocava o recibo sintetico no path do G10. A condicao
if(authorization.gate===gate) dispensava a fixacao do hash desse arquivo
quando o gate era trocado. A evidencia anterior LEGACYTESTS provou seus
criterios, mas nao resolvia essa substituicao historica. Este diagnostico
invalida qualquer inferencia anterior de imutabilidade incondicional.

Correcao autorizada: identidade/hash historicos obrigatorios; evolucao por
novo recibo e registro append-only; hashes dos dois scripts de governanca
verificados;72 cenarios e11 suites preservados com novas entradas para os
controles futuros. Resultados oficiais serao registrados apos execucao real.

## Avaliacao de site:build no CI

Recomendacao: incluir npm run site:build em futura emenda explicita do CI.
O workflow atual roda npm run build, que usa vite build padrao. site:build
tambem compila as configuracoes manager/app, empacota o site publico e roda
C151, C154, C155, C156, C157, C158, C159 e C160. Essa cobertura adicional
detecta falhas de embalagem/rotas/login/PIN/sessao/parental web que o build
padrao sozinho nao certifica. Mantem testes canonicos/C11 e nao exige deploy.

Antes da alteracao futura, medir custo na matriz Windows/Linux, conferir
que testes usam fixtures e nao segredos de producao e revisar timeout do
job25min. Insercao deve ser bloqueante, sem continue-on-error/skip, mantendo
as etapas atuais. Checker valida a lista exata de etapas e tambem precisaria
da mesma autorizacao nominal para aceitar a etapa adicional. Nesta emenda
nao alterar workflow, timeout, permissoes, package ou dependencias. Executar
site:build somente localmente nao equivale a declarar cobertura CI implantada.

## Implementacao revisavel

HISTORICAL_RECEIPTS associa cada path historico ao identificador e hash fixos:
- G10FIX: CANON_CHANGE_AUTHORIZATION.json,
  blob e73152f228cbb625c508062d70ef810e8342059a.
- LEGACYTESTS: CANON_01_LEGACY_TESTS_AUTHORIZATION.json,
  blob e59e2d328db3d0dfd8c1d873b154e2e3f7900a0c.

Os arquivos sao requeridos independentemente de registros futuros. G10
exige seu identificador original e Legacy preserva sua identidade especifica.
A verificacao de hash usa os paths fixos e nao possui mais if condicionado
ao identificador recebido. A validacao semantica continua produzindo motivos
especificos para entradas invalidas; nenhuma execucao pode retornar PASS
sem verificar os dois pins. Normalizacao LF e simetrica para CI; a auditoria
local compara tambem SHA-256 raw/bytes dos dois recibos.

O novo recibo CANON_01_AUTHORIZATION_HARDENING.json nao substitui nenhum
historico. Ele e registrado por bloco CANON-01:AUTHORIZATION append-only no
contrato de fases, contendo somente schema/gate/path/hash. Registros novos
devem usar path proprio docs/governance/authorizations/GATE.json e identidade
unica, sem aliases dos historicos, duplicatas ou campos desconhecidos.
Recibo nao registrado, registro ausente ou checksum divergente bloqueiam.

Os scripts verify-canonical-contract.mjs e test-canonical-regression.mjs
nao sao mais ignorados no loop de integridade. Entram nos arquivos protegidos
por hashes after exatos concedidos somente nesta emenda. Sao870 arquivos,
incluindo os868 anteriores. before=null nesses dois grants refere-se a
ausencia dos scripts na baseline Git b3fc8d1, nao a ausencia no worktree:
previousGovernanceHashes registra os blobs recebidos6e50851dd36becd0ccf90e827c23d144b4bfcebe
e01e43c3e2fec97378b60bae9298712c208147c37, e a captura anterior conserva os
conteudos. Nao ha exclusao generica de arquivos novos de governanca.

O hash do novo recibo fica no contrato; os hashes dos scripts ficam no
recibo. Assim nao ha ciclo de codigo conter seu proprio hash, nem campo de
bypass/placeholder removido do calculo. Todos os bytes normalizados dos
scripts/recibos sao conferidos. Alteracoes isoladas do checker ou runner
falham; alteracao de recibo sem novo registro normativo tambem falha.

Grants historicos nao sao copiados para uma autorizacao futura. Sobreposicao
legitima exige supersedes[path] com o Gate predecessor e before igual ao
after anterior. So entao o novo grant encadeia a raiz original e o novo
after. Duplicata dentro de recibo ou historicos continua proibida. Revisao
de teste pertence ao NOVO grant, inclusive quando o arquivo era novo na
baseline; nao e herdada de G10, Legacy ou Hardening. Nao existe last-wins.

## Preservacao dos controles e demonstracao futura

Os72 cenarios anteriores foram conservados, na mesma ordem e com as mesmas
11 suites. As entradas sinteticas de versao foram adaptadas exclusivamente
para o procedimento novo: o recibo ANDROID-38 agora tem path proprio e
registro append-only, sem G10 grants copiados. Estado DRAFT, Gate generico,
plano vazio, hash extra, autorizacao stale e revisao ausente continuam
rejeitados. O reconhecimento anterior dos dois historicos agora confere o
prefixo da lista, permitindo a presenca explicita do terceiro recibo.

Sao23 controles adicionais, total95: preservacao raw dos dois historicos
na fixture1.0.38; trocas de identidade e tentativa antiga de substituir G10;
remocao de historicos; registro ausente, duplicado, hash divergente, path
historico reaproveitado; ausencia/adulteracao do recibo Hardening; mutacao
silenciosa dos dois scripts; cadeia nominal de governanca e rejeicoes de
revisao emprestada, predecessor ausente, before incorreto e grants historicos
copiados sem vinculo. Nenhum negativo/suite foi omitido para obter PASS.

O positivo ANDROID-38 exige currentVersion=1.0.38, historicalVersion=1.0.37
e a lista G10FIX, LEGACYTESTS, HARDENING, ANDROID-38. Compara os dois recibos
originais byte a byte dentro da fixture. Um segundo positivo GOVERNANCE-02
mostra evolucao explicita de script com novo recibo, hash e predecessor,
mantendo o recibo Hardening. Ambos sao apenas entradas sinteticas ao
verificador REAL; nenhum desses dois Gates, arquivos, versoes ou alteracoes
de runtime/governanca foi aplicado fisicamente ao workspace.

## Plano para evolucao real apos nova autorizacao

1. Receber Gate nominal e allowlist expressa do Chat Mestre antes do codigo.
2. Preservar todos os recibos e entradas existentes. Criar NOVO recibo em
   docs/governance/authorizations/GATE.json com baseline, aprovacao, motivo,
   impacto, evidencia, plano e hashes path/before/after. Sem wildcard/skip.
3. Para path sem grant anterior, before vem da baseline protegida; para path
   ja autorizado, nomear supersedes[path] e usar o after anterior como before.
   Toda evolucao de teste/governanca exige revisao propria, nunca emprestada.
4. Acrescentar NOVA entrada CANON-01:AUTHORIZATION ao final do contrato com
   path/id exclusivos e hash exato do novo recibo. Nao editar entradas antigas.
5. Executar regressao, lock C11, verificacoes especificas, typecheck/builds
   e homologacao fisica quando exigida pelo impacto. Corrigir falhas antes
   de solicitar adjudicacao; registro nao prova execucao ou autorizacao humana.
6. Submeter diff/recibos/evidencias para revisao. Commit/push/publicacao exigem
   autorizacao nominal propria. Esta emenda nao autoriza1.0.38, funcionalidade,
   novo binario, novo Gate ou CI remoto.

Limite de confianca: nenhum verificador dentro do proprio repositorio pode
autenticar sozinho uma reescrita coordenada de codigo, runner, contratos,
recibos e CI por um ator com poder irrestrito. Os controles rejeitam mutacoes
silenciosas e bypasses no modelo aprovado; nao sao assinatura criptografica
do Chat Mestre. A publicacao futura, se autorizada, deve passar por revisao
independente e ancorar os arquivos aprovados em commit/CI e protecao externa
de branch. Nenhuma protecao remota foi criada ou alegada nesta emenda.

## Resultados oficiais locais

Windows/Node24.19.0, arvore real, processos novos de Node/npm; nenhum loader
diagnostico para substituir modulos oficiais. Pre-checks do estado anterior
PASS: canon:check, canon:test72/11 e C11, registrados em pre-*.log.

| Comando solicitado | Resultado final | Exit |
| --- | --- | --- |
| npm run canon:check | PASS;870 arquivos,3 recibos atuais | 0 |
| npm run canon:test | PASS;95 controles,11 suites | 0 |
| npm run c11:new-device:lock | PASS;antes/depois e prebuilds | 0 |
| npm run typecheck | PASS;inclui prehook canonico | 0 |
| npm run update:check | PASS;G9 oficial | 0 |
| npm run security:check | PASS;G10 oficial | 0 |
| npm run playback:check | PASS;G8 e isolamento parental | 0 |
| npm run build | PASS;web local, prebuild C11 e checker | 0 |
| npm run site:build | PASS;manager/app/site e C151/C154-C160 | 0 |

As11 suites anteriores foram executadas sem remocao: bootstrap, busca C105,
navegacao C107, VOD C11, C11/C9, seguranca/recovery, orientacao, landscape,
G8, C126 e regressao Delta G10. Timeout, exit code e marcador continuam
obrigatorios; o loop de execucao das suites permanece literalmente igual.
Os72 nomes/cenarios anteriores mantem a ordem, e os codigos esperados de
todas as rejeicoes nomeadas anteriores permanecem iguais. Somente fixtures
de evolucao e reconhecimento da lista foram adaptados conforme o novo modelo.

Logs UTF8 e exit codes em tmp/canon-01-auth-hardening/official-results.json,
official-*.log e regression-result.json. pre-*.log do PowerShell podem ser
UTF16LE. Todos os resultados oficiais finais sao PASS; nenhuma falha foi
suprimida. Builds ocorreram somente apos verificacoes obrigatorias PASS.
Avisos Vite de chunk/imports/externalizacao para navegador nao foram erros
de build nem alterados nesta emenda. CI remoto e testes fisicos nao executados.

## Auditoria e diff

Os25 arquivos recebidos foram preservados:18 byte a byte identicos,5
documentos somente append e2 scripts de governanca revisados no escopo.
G10FIX, LEGACYTESTS, seus testes legados/dedicados e ambos recibos antigos
ficam intactos. Recibos raw SHA-256 mantidos:
- G10:9a8d750edc932cb7f97fda0129b368c5cac728273f34c4402be739abb08c64cf.
- Legacy:805381b1f66ea46175398a7dd9d7ed8acad758477f5bb93e29e6238875cfa6a1.

Inventario1264 rastreados conferido; nenhum arquivo fora da allowlist
alterado.140 APK/AAB conferidos por SHA-256/tamanho. main/HEAD b3fc8d1 e
indice SHA-256002ee0d851ae3e7f8e9b7a79957d83f1067aef4d7d62b674e561e529b0362778
inalterados. Nenhum arquivo de autorizacao ANDROID-38/GOVERNANCE-02 foi
criado fora da fixture. App permanece1.0.37/code37.

Arquivos desta emenda (9), acumulado CANON-01 agora27:
- scripts/verify-canonical-contract.mjs
- scripts/test-canonical-regression.mjs
- docs/architecture/XANDEFLIX_PREBUILT_PHASED_EXPANSION.md (append)
- docs/evidence/CANON_01_EXECUTION.md (append)
- docs/STATUS.md (append)
- docs/EVOLUTION_REPORT.md (append)
- docs/ERRORS_AND_BLOCKERS.md (append)
- docs/governance/CANON_01_AUTHORIZATION_HARDENING.json (novo)
- docs/evidence/CANON_01_AUTHORIZATION_HARDENING.md (novo)

Material privado de revisao em tmp/canon-01-auth-hardening, ignorado pelo Git:
- before.json: captura dos25, hashes/conteudos e inventario anterior.
- previous-regression-result.json:72 controles/11 suites recebidos.
- integrity-result.json: auditoria final, hashes, escopo e preservacao.
- amendment-review.diff: diff desta emenda.
- full-review.diff: diff integral dos27 arquivos acumulados.
- official-results.json, logs e regression-result.json: resultados finais.

O recibo Hardening registra hashes de codigo exatos, plano/restricoes e
proveniencia; seu hash e vinculado no append normativo do contrato. Revisar
esse conjunto e os diffs antes de adjudicar/publicar. Nenhum commit, push,
merge, troca de branch, APK/AAB, instalacao, escrita remota ou proximo Gate.

```text
GATE=CANON-01
AMENDMENT=CANON-01-AUTHORIZATION-HARDENING
RESULT=PASS
PREVIOUS_25_FILES_PRESERVED=SIM
G10_RECEIPT_IMMUTABLE=SIM
LEGACY_RECEIPT_IMMUTABLE=SIM
FUTURE_GATE_SEPARATE_AUTHORIZATION=PASS
REGRESSION_LOCK=PASS
C11_LOCK=PASS
TYPECHECK=PASS
WEB_BUILDS=PASS
GIT_COMMIT=NAO
GIT_PUSH=NAO
SUPABASE_CHANGED=NAO
ANDROID_APK_CHANGED=NAO
NEXT_GATE_STARTED=NAO
CHAT_MASTER_REVIEW=PENDING
```

PASS refere-se somente aos criterios tecnicos desta emenda; adjudicacao final
CANON-01 e autorizacao de publicacao no GitHub continuam com o Chat Mestre.
