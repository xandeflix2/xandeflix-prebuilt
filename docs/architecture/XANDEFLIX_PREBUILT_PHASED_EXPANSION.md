# CANON-01 - Consolidacao canonica e expansao por fases

## Autoridade, escopo e allowlist - 2026-10-19

Gate nominal CANON-01, solicitado pelo Chat Mestre em IMPLEMENTACAO_CONTROLADA.
Baseline Git: b3fc8d1e3844bc5601813ab1b298289af5b3f1fd. Workspace/top-level
C:/Xandeflix/xandeflix-prebuilt-c11-main; origin
https://github.com/xandeflix2/xandeflix-prebuilt.git; main local/remota iguais;
working tree limpa antes deste documento; branch de revisao ainda inexistente.
AGENTS, Architecture, Execution, Gate Rules, Activation Lock e Source Boundary
lidos. Sem colisao com projeto protegido; Git-dir proprio e unica worktree.

Documentacao e novos verificadores autorizados; nenhum produto novo. Commit/push
somente em governance/canon-01-hardening, criada apos validacao a partir da
baseline. Main e a branch padrao de integracao, nao uma proibicao geral a
branches de Gate: esta excecao de revisao e explicitamente autorizada neste
pedido. Nao ha alteracao da main, merge, PR, force, rulesets ou release.
Adjudicacao final exclusiva do Chat Mestre; CHAT_MASTER_REVIEW=PENDING.

Allowlist fechada, definida ANTES dos testes novos:

1. AGENTS.md - referencia normativa e excecao de branch deste Gate.
2. docs/architecture/XANDEFLIX_PREBUILT_ARCHITECTURE_CONTRACT.md - referencia.
3. docs/architecture/XANDEFLIX_PREBUILT_EXECUTION_CONTRACT.md - referencia.
4. docs/governance/GATE_EXECUTION_RULES.md - referencia/papeis/ordem de revisao.
5. docs/STATUS.md - append de status, sem apagar historico.
6. docs/EVOLUTION_REPORT.md - append de evolucao.
7. docs/ERRORS_AND_BLOCKERS.md - append de falhas/limites.
8. Este documento - especificacao e politica unica legivel por maquina.
9. docs/evidence/ANDROID_V1_0_37_PHYSICAL_HOMOLOGATION.md - relato do operador.
10. docs/evidence/CANON_01_EXECUTION.md - relatorio e verificacoes do Gate.
11. package.json - apenas comandos/hook de verificacao, sem dependencias.
12. scripts/verify-canonical-contract.mjs - verificador portavel fail-closed.
13. scripts/test-canonical-regression.mjs - controles negativos e suites existentes.
14. .github/workflows/canonical-regression.yml - CI de leitura/testes/build web.

Saidas de validacao/manifestos/recibos em tmp/canon-01, ignorado pelo Git.
Nenhum arquivo de src, Android, fixture existente, suite existente, lock antigo,
Capacitor, configuracao Vite, migration ou funcao remota pode ser alterado.
Sem APK/AAB, cap copy/sync, Gradle de distribuicao, instalacao ou dados reais.
Supabase, analitica de producao, Tizen e webOS nao sao executados neste Gate.

## Classificacao obrigatoria

- DECISAO_CANONICA: regra aprovada para orientar e limitar implementacoes.
- EVIDENCIA_DE_TESTE: observacao com origem, escopo e limites identificados.
- HIPOTESE_NAO_VALIDADA: possibilidade que ainda exige prova; nao e garantia.
- PENDENCIA: trabalho/requisito ainda aberto, sem autorizacao implicita.
- EXPANSAO_FUTURA: direcao de roadmap que exige novo Gate nominal.

Nao elevar evidencias, modelos de navegador ou medicoes a SLA. Nao inferir
homologacao fisica de um build, hash, emulacao, suite ou relato de outro modelo.
Contratos historicos ficam preservados; este documento os referencia e nao
apaga suas autorizacoes limitadas. A confirmacao fisica nova do operador
atualiza somente a pendencia de homologacao1.0.37, com origem explicita.

## DECISAO_CANONICA - invariantes e fronteiras

### Identidade e ativacao

Identidade persistente por instalacao, chave permanente, token e licenca nao
rotacionam por remount, retry, cold start ou falha de leitura/reproducao.
Ativacao exige autorizacao real e persistencia verificada; falhas nao podem
virar nova identidade nem perda silenciosa de licenca. O lock
C11_NEW_DEVICE_ACTIVATION_AND_CATALOG_LOCK_V1 continua obrigatorio e integral,
incluindo seus nove negativos e suites reais. Regras comerciais C164 e
reconciliacao C165 permanecem sem mudanca funcional.

### Catalogo e pesquisa

EXTERNAL_PREPROCESSING=TARGET e PROVISIONING_PACKAGE=TARGET permanecem metas
do Architecture Contract: pipeline externo, artefato versionado, importacao e
promocao seguras. TARGET nao e declaracao de implantacao universal. O Source
Data Boundary vigente registra CATALOG_PROCESSING=DEVICE_LOCAL no canal atual;
nao mover esse processamento nem criar catalogo no Supabase neste Gate.
Essa distincao preserva ambos os contratos, sem inventar conformidade completa.
Qualquer transicao futura exige especificacao e novo Gate, antes do codigo.

Catalogo/index persistidos e consultados localmente; cold start/navegacao nao
podem perder resultados. Cache vazio transitorio nao substitui geracao REAL
valida. Importacao incompleta, fonte indisponivel ou erro de I/O nao destrui
geracao ativa; candidato e validado antes da promocao. Pesquisa nao depende
de consultas de catalogo ao Supabase. Backend permanece Control Plane.

### Reproducao e compatibilidade

Playback direto da fonte autorizada, preservando licenca, revogacao e C9;
nenhum proxy/relay central. Preservar VOD/series/Live, toque, foco e controle
remoto/D-pad, Android Phone/Tablet e Fire OS, retrato/paisagem. O transporte
Cast local efemero ja autorizado continua limitado ao seu contrato; nao e
precedente para relay central. Simulacao nao certifica um aparelho fisico.

### Seguranca

Package canonico com.xandeflix.prebuilt em Gradle/Capacitor/manifest. Nenhuma
service_role/credencial de fonte/chave privada no cliente ou pacote. Preservar
verificacao de assinatura/hash, keystore/cofres, exclusoes de backup e
armazenamento de identidade. Mudar essas fronteiras exige Gate especifico,
testes de impacto e revisao; este Gate nao as modifica nem escreve no backend.

## EVIDENCIA_DE_TESTE - baseline historica

[Homologacao1.0.37](../evidence/ANDROID_V1_0_37_PHYSICAL_HOMOLOGATION.md):
operador informa20/20 funcionais e21/21 capturas de resistencia,90min no total,
video/audio PASS e PID estavel nos tres modelos. Nao foram anexados os logs
brutos nesta solicitacao; nenhum PID/serial/endereco ou medicao e inventado.
Build1.0.37/code37 e referencia HISTORICA, nao teto de versao.

## DECISAO_CANONICA - politica estruturada

Este bloco e a unica origem dos marcadores abaixo. O verificador compara
tipos, valores e ordem, em vez de aceitar palavras soltas ou comentarios.

<!-- CANON-01:POLICY -->
```json
{
  "schema": 1,
  "gate": "CANON-01",
  "referenceCommit": "b3fc8d1e3844bc5601813ab1b298289af5b3f1fd",
  "historicalAndroid": { "versionName": "1.0.37", "versionCode": 37, "physicalStatus": "PASS", "permanentVersionCeiling": false },
  "decisions": {
    "PRODUCT_VISION": "MULTIPLATFORM",
    "CURRENT_PRIORITY": "ANDROID_AND_FIRE_OS",
    "ANDROID_MOBILE_GOOGLE_PLAY": "PLANNED",
    "ANDROID_TABLET_GOOGLE_PLAY": "PLANNED",
    "ANDROID_TV_GOOGLE_PLAY": "PLANNED",
    "FIRE_STICK_EXTERNAL_APK": "PLANNED",
    "GOOGLE_PLAY_RELEASE_READY": "NAO",
    "ANDROID_TV_PHYSICAL_VALIDATION": "PENDING",
    "SAMSUNG_TIZEN": "FUTURE_ROADMAP",
    "LG_WEBOS": "FUTURE_ROADMAP",
    "TIZEN_DEVELOPMENT_AUTHORIZED": "NAO",
    "WEBOS_DEVELOPMENT_AUTHORIZED": "NAO",
    "PILOT_MAX_PARTICIPANTS": 60,
    "PILOT_EXECUTED": "NAO",
    "ANALYTICS_PANEL": "PLANNED"
  },
  "phaseOrder": [
    "CANONICAL_CONSOLIDATION",
    "ANDROID_FIRE_OS_FINAL_ADJUSTMENTS_GATE",
    "ANDROID_DISTRIBUTION_READINESS_GATE",
    "PILOT_60_ANALYTICS_GATE",
    "PILOT_EVALUATION_AND_CAPACITY_DECISION",
    "TIZEN_WEBOS_FUTURE_GATE"
  ],
  "evidenceClasses": ["DECISAO_CANONICA", "EVIDENCIA_DE_TESTE", "HIPOTESE_NAO_VALIDADA", "PENDENCIA", "EXPANSAO_FUTURA"]
}
```

Fases sao dependencias de planejamento, nao autorizacao de executar a proxima.
Ajustes finais Android ainda precisam de especificacao nominal. Publicacao
Google Play mobile/tablet/TV esta planejada, sem prontidao declarada: assinatura
de distribuicao, AAB/release, politicas/listagem/privacidade/classificacao,
compatibilidade/controle remoto/acessibilidade e Android TV fisico ainda
dependem de analise e Gate proprio. Distribuicao externa Fire tambem e planejada.

## PENDENCIA - piloto de ate60 participantes

PILOT_EXECUTED permanece NAO. Participantes nao equivalem a conexoes PostgreSQL
simultaneas: conexoes sao recurso do backend/pool, sessoes e dispositivos sao
outras dimensoes. Painel analitico e PLANEJADO, sem tabela/migration/funcao/
instrumentacao de producao neste Gate. Sem liberar planos comerciais novos.

Analise futura deve definir coleta minima/retencao/agregacao sem segredos,
janela de observacao, baseline e criterios revisaveis para:

| Dimensao | Requisito da analise futura |
| --- | --- |
| Usuarios ativos | Unicos por janela e retencao, separados de cadastros |
| Sessoes simultaneas | Concorrencia/ocupacao/picos e recusas do guard |
| Dispositivos online | Quantidade, duracao e reconexoes por janela |
| APIs | Volume, latencia/distribuicao, erros e saturacao por operacao |
| PostgreSQL/pool | Conexoes ativas/ociosas/limites, espera e consumo do pool |
| Infraestrutura | CPU, RAM, I/O e correlacao com demanda |
| Incidentes | Quedas, degradacao, erros, inicio/fim e historico temporal |
| Supabase | Consumo por produto, limites contratados, custos e tendencia |

Nenhum numero acima estabelece SLA ou upgrade automatico. Somente a avaliacao
do piloto permite decidir aumento de usuarios/infraestrutura e solicitar o
Gate futuro Tizen/webOS. Sem projetos/dependencias dessas plataformas agora.

## Protecao executavel e evolucao autorizada

Comandos: npm run canon:check e npm run canon:test. Sem flags/env de bypass.
Git e objeto da baseline sao dependencias obrigatorias; CI deve fazer checkout
com historico completo. npm ci deve preceder verificacao de dependencias.

Verificador compara conteudo Git da baseline contra src/, Android app/src/,
scripts/, supabase/, fixtures/, schemas/ e configuracoes de seguranca/build. Suites
existentes nao podem desaparecer nem ser substituidas por PASS incondicional:
hashes dos arquivos e runner C11 sao conferidos contra a baseline, com
normalizacao LF somente para texto. Novas dependencias/arquivos de produto
tambem sao detectados. Pacote/hooks/licencas/backup/assinatura nao sao inferidos
de um numero de versao. Ausencia de arquivo/objeto/dependencia obrigatoria falha.

O prebuild C11 permanece exatamente npm run c11:new-device:lock. Novos comandos
canonicos e hooks de build/typecheck/CI so acrescentam verificacao; nao removem
suites. CI GitHub Actions Windows/Linux, Node24, contents:read, sem segredos,
deploy ou artefatos Android. A revisao final pode torna-lo required check;
nenhum ruleset/protecao remota e alterado aqui.

Futuro Gate pode evoluir versionCode/versionName: gradle continua validando
packageId e integridade do restante do arquivo, mas compara versao NOVA com
uma autorizacao especifica, nao com um teto37. Procedimento de evolucao:

1. Chat Mestre autoriza novo Gate e allowlist ANTES da mudanca.
2. Registrar docs/governance/CANON_CHANGE_AUTHORIZATION.json nesse Gate com
   schema1, gate diferente de CANON-01, status APPROVED_BY_CHAT_MASTER,
   referenceCommit desta baseline e changes com path/before/after (Git blob
   hashes apos normalizacao LF dos DOIS lados para texto; binarios exatos;
   before=null apenas para arquivo novo), testes requeridos e
   justificativa de impacto/homologacao fisica. Nenhum registro ativo aqui.
3. Registrar somente os hashes realmente aprovados; qualquer divergencia extra
   falha. Mudanca de suite existente ainda exige revisao especifica
   testChangesReviewed=true, justificativa e preservacao dos negativos.
4. Executar regressao e homologacao fisica conforme impacto; a declaracao nao
   executa testes nem prova sozinha autorizacao externa ou hardware.
5. Submeter diff/evidencias ao Chat Mestre; nenhum agente atualiza baseline ou
   autoriza a si mesmo para tornar um erro verde. Controles negativos devem
   demonstrar versao futura permitida com Gate especifico e negada sem ele.

Esse recibo e controle de mudanca auditavel, nao assinatura criptografica da
conversa. Um ator com poder de reescrever testes/CI/contratos pode desliga-los;
revisao humana e protecao de branch sao complementos, nao promessas deste Gate.
Nao confundir o PASS do verificador com homologacao arquitetural definitiva.

## Emenda aprovada CANON-01-G10FIX - 2026-10-20

GATE=CANON-01; AMENDMENT=CANON-01-G10FIX; NEXT_GATE_STARTED=NAO.
Proveniencia: instrucao expressa do Chat Mestre fornecida pelo usuario em
2026-10-20, titulo CHAT MESTRE - EMENDA CONTROLADA CANON-01 / G10.
Nao reiniciar/recriar consolidacao. Os14 arquivos anteriores foram conferidos
e capturados em tmp/canon-01-g10fix/before.json antes de qualquer edicao.
HEAD b3fc8d1, main/origin corretos,140 artefatos Android preservados.

Esta emenda substitui apenas a proibicao anterior de corrigir o transporte
de extensions no DeltaV1. Autoriza os4 arquivos abaixo, um teste novo, ajuste
minimo do runner e os documentos/recibos enumerados. Git commit/push/merge/PR,
checkout de branch, APK/AAB, instalacao/reset, versao, Supabase e outras fases
NAO autorizados nesta continuacao. Autorizacao de publicacao anterior fica
suspensa; main/HEAD/index nao devem receber operacoes Git de escrita.

Allowlist adicional estrita:
- src/update/catalog-delta.types.ts
- src/update/catalog-delta-builder.ts
- src/update/catalog-delta-applier.ts
- schemas/prebuilt-catalog-delta.schema.json
- scripts/test-g10-delta-extensions-regression.mjs (novo)
- scripts/test-canonical-regression.mjs (integracao obrigatoria do novo teste)
- Este contrato, docs/evidence/CANON_01_EXECUTION.md, docs/STATUS.md,
  docs/EVOLUTION_REPORT.md e docs/ERRORS_AND_BLOCKERS.md: atualizacao documental.
- docs/governance/CANON_CHANGE_AUTHORIZATION.json (novo recibo auditavel)
- docs/evidence/CANON_01_G10_FIX_EVIDENCE.md (novo relatorio)

Implementacao: targetExtensions opcional do tipo objeto, com substituicao
completa. Campo ausente representa target SEM extensions; objeto vazio e
distinto. Nunca herdar implicitamente extensions da base nem alterar hash,
assinatura, binding, validacao/staging/promocao para aceitar catalogo diferente.
Tipos invalidos e outros campos de topo continuam rejeitados pelo schema.

Compatibilidade a verificar: old/new delta x old/new reader, com/sem extensions,
e pacotes completos assinados. Leitor antigo e obtido dos objetos Git da
baseline somente em subprocesso de teste; produto atual nao recebe loader.
Delta novo com targetExtensions nao e compativel diretamente com leitor antigo.
Politica segura proposta: para leitores antigos ou capacidade desconhecida,
selecionar pacote COMPLETO assinado pelo canal importPackage ja existente.
Se um delta incompatível chegar, manter geracao ativa e executar importacao
explicita do pacote completo validado; nenhum retry removendo extensions ou
ignorando hash. Isso nao presume negociacao/download/fallback automatico de
producao. Se a interoperabilidade exigir novo dispatcher fora da allowlist,
parar com HARD_STOP_COMPATIBILITY_SCOPE e submeter proposta especifica.

Aceitacao: novo teste cobre os12 grupos solicitados, hashes exatos, base
imutavel e recuperacao segura real. G9/G10 antigos inalterados, canon:check,
canon:test, C11 lock, typecheck e suites relevantes devem passar antes de
build web (incluindo npm run build). Sem build Android ou teste fisico novo.
O runner pode preservar grants ativos nos overlays de seus controles
sinteticos futuros; nenhum negativo/assert/resultado anterior e removido.
Verificador, CI e hooks permanecem byte a byte como recebidos.

O recibo usa gate=CANON-01-G10FIX, referenceCommit original, hashes Git blob
normalizados LF antes/depois dos4 arquivos e do novo teste (before=null).
requiredTests referencia suites reconhecidas pelo verificador inalterado;
mandatoryCommands complementa com G9 e o novo teste sem alterar o formato
exigido pelo checker. Identificador e emenda aprovada, nao nova fase.

## Emenda aprovada CANON-01-LEGACYTESTS - 2026-10-20

GATE=CANON-01; AMENDMENT=CANON-01-LEGACYTESTS; IMPLEMENTACAO_CONTROLADA.
Autorizacao expressa do Chat Mestre recebida no anexo cujo SHA-256 e
6db32f1cc2bb81913434dc13bd558843b405543e8660f7b91525f55ec1ef34f1.
Preflight: main/HEAD b3fc8d1, origin canonico,21 arquivos conhecidos iguais
ao inventario G10FIX e140 artefatos Android inalterados. Captura anterior
em tmp/canon-01-legacytests/before.json. Nao reiniciar CANON-01 nem G10FIX.

Allowlist FECHADA desta emenda, anterior ao codigo:
- scripts/test-c11-phone-ui-orientation.mjs: somente assercao estrutural XML
  e cenarios adicionais; preservar os cinco negativos anteriores.
- scripts/validate-direct-playback.mjs: instalar somente o helper existente
  installUnconfiguredParentalFixture antes de load; manter12 blocos originais
  e acrescentar negativos parentais isolados em processos novos.
- scripts/verify-canonical-contract.mjs e scripts/test-canonical-regression.mjs:
  dois recibos independentes, grants por origem, rejeicao de sobreposicoes,
  hashes invalidos, ausencia, revisao ausente e escopo indevido; manter43
  controles e suites anteriores, acrescentar G8/C126 obrigatorios.
- docs/governance/CANON_01_LEGACY_TESTS_AUTHORIZATION.json (novo recibo).
- docs/evidence/CANON_01_LEGACY_TESTS_EVIDENCE.md (novo relatorio).
- Append somente neste documento, docs/evidence/CANON_01_EXECUTION.md,
  docs/STATUS.md, docs/EVOLUTION_REPORT.md e docs/ERRORS_AND_BLOCKERS.md.

Preservar byte a byte CANON_CHANGE_AUTHORIZATION.json,4 arquivos G10 e teste
dedicado, runtime/Android/schema/backend/helper/package/lockfile/CI e demais
arquivos fora da allowlist. Nao trocar branch, commitar, publicar, instalar,
resetar dados, alterar versao ou gerar APK/AAB. Nao iniciar proximo Gate.

Orientacao: exatamente uma NativePlayerActivity, exported=false e
screenOrientation=sensorLandscape, quaisquer ordens/aspas XML validas,
rejeitando duplicatas e atividades somente comentadas. Manifest nao muda.
G8: fixture nao configurada permite somente conteudo normal; escrita deve
falhar. Ausencia/corrupcao/indisponibilidade, PIN incorreto, cancelamento,
adulto, bloqueio persistente e licenca recusada permanecem fail-closed.
Nao substituir authorizeParentalItem nem conceder desbloqueio sintetico.

O segundo recibo usa gate CANON-01-LEGACYTESTS, parentGate CANON-01,
testChangesReviewed=true e hashes nominais apenas dos dois testes. O recibo
G10FIX continua independente e nao pode ser substituido pelo segundo.
Permissoes de revisao pertencem somente ao respectivo grant. Manter a
politica anterior de evolucao por NOVO Gate expresso; esta emenda nao aprova
nenhuma mudanca futura. Recibos sao evidencia auditavel, nao assinatura da
aprovacao humana. Remocao/adulteracao invalida bloqueia; revisao humana e
auditoria byte a byte continuam necessarias para detectar reescrita maliciosa
de todo o conjunto de verificador, recibos e evidencias.

Executar orientacao, G8, C126, C11/C9, G9, G10, teste Delta, canon:check/test,
C11 lock, typecheck, contrato e busca na arvore REAL. Somente apos todos
passarem, build/site:build web LOCAIS. Guardar exit codes/logs, auditar21
anteriores/14 originais,140 artefatos, HEAD/index e diff integral. PASS tecnico
da emenda nao homologa CANON-01; CHAT_MASTER_REVIEW=PENDING.

## CANON-01 AUTHORIZATION HARDENING - especificacao aprovada - 2026-10-20

GATE=CANON-01; AMENDMENT=CANON-01-AUTHORIZATION-HARDENING.
Pedido expresso do Chat Mestre nesta data autoriza corrigir a integridade
historica da governanca. Nao reiniciar o Gate nem reaplicar G10/LEGACYTESTS.
Preflight: workspace C11 independente, main/HEAD b3fc8d1, origin canonico,
25 arquivos anteriores conferidos por SHA-256 e140 artefatos Android intactos.
Captura anterior em tmp/canon-01-auth-hardening/before.json.

Allowlist deste ciclo, ANTES do codigo:
- scripts/verify-canonical-contract.mjs
- scripts/test-canonical-regression.mjs
- Este contrato, docs/evidence/CANON_01_EXECUTION.md, docs/STATUS.md,
  docs/EVOLUTION_REPORT.md e docs/ERRORS_AND_BLOCKERS.md: SOMENTE append.
- docs/governance/CANON_01_AUTHORIZATION_HARDENING.json: novo recibo nominal.
- docs/evidence/CANON_01_AUTHORIZATION_HARDENING.md: nova evidencia/plano.
- Logs, inventarios e diffs privados em tmp/canon-01-auth-hardening.

O comportamento anterior que substituia CANON_CHANGE_AUTHORIZATION.json
num Gate futuro fica SUPERSEDED exclusivamente pelo procedimento aditivo
abaixo. Historico textual permanece; nao e autorizacao para reutilizar esse
arquivo. Os dois recibos existentes sao sempre obrigatorios, com path,
identificador e blob hash LF fixos independentemente do gate lido. Nenhum
novo registro, status, permissao ou identificador dispensa essa verificacao.

Evolucao passa a usar recibo NOVO e entrada NOVA append-only no contrato:
bloco CANON-01:AUTHORIZATION com schema/gate/path/hash. Primeiro registro e
obrigatorio para esta emenda e aponta ao novo recibo de hardening. Demais
registros devem ter Gate unico e path docs/governance/authorizations/GATE.json,
sem reutilizar paths/ids historicos. Recibo nao registrado, hash divergente,
entrada duplicada, campo extra ou evidencia nominal ausente bloqueia.

Cada recibo declara aprovacao expressa, baseline, impacto, evidencia, testes
e grants path/before/after exatos. Hashes de grants continuam normalizados LF
para textos e binarios exatos. Para evoluir um path ja autorizado, o NOVO
recibo deve nomear o predecessor em supersedes[path] e seu before deve ser
igual ao after anterior. Duplicatas sem esse vinculo sao rejeitadas. Cada
nova revisao de teste precisa da propria revisao nominal; nao herda flags.
Historicos nao sao editados, removidos ou substituidos pela cadeia.

Os dois scripts de governanca deixam de ter isencao de integridade. Novo
recibo de hardening concede seus hashes after exatos; previousGovernanceHashes
registra os hashes recebidos nesta emenda, e before=null nos grants porque
esses scripts nao existem na baseline Git b3fc8d1. O recibo e vinculado pelo
hash da entrada normativa, evitando ciclo de hash entre codigo e recibo.
Alterar silenciosamente checker/runner, recibo ou registro isoladamente deve
falhar; nao introduzir parametros/env/campos de bypass. Isso nao constitui
assinatura criptografica do Chat Mestre: reescrita coordenada de toda a raiz
de confianca exige revisao humana/branch protection externa, nao prometida aqui.

Preservar os72 cenarios anteriores e11 suites. Adaptar SOMENTE as entradas
sinteticas que antes substituiam recibos para usar recibo/registro novos,
mantendo seus objetivos e assercoes de autorizacao, licenca, hashes, revisao
e versao. Acrescentar negativos de identidade de ambos os historicos,
imutabilidade, registro/cadeia e arquivos de governanca. Exemplo1.0.38 e
puramente sintetico; nao altera Gradle nem autoriza versao funcional agora.

Executar os comandos solicitados, guardando resultados/exit codes, e auditar
25 anteriores, G10/LEGACY, hashes/diffs, indice/HEAD e140 artefatos. Builds
WEB exclusivamente locais. Avaliar site:build no CI em evidencia; workflow
permanece intacto ate autorizacao adicional. Nao mudar runtime/Android/
catalogo/player/parental/backend/dados/package/dependencias/CI, gerar APK/AAB,
instalar/resetar, trocar branch ou executar Git write. SOURCE-FORMAT-01 e
demais Gates nao iniciados. Adjudicacao/publicacao continuam pendentes.

<!-- CANON-01:AUTHORIZATION -->
```json
{
  "schema": 1,
  "gate": "CANON-01-AUTHORIZATION-HARDENING",
  "path": "docs/governance/CANON_01_AUTHORIZATION_HARDENING.json",
  "hash": "766db763ee98aeeb33230c2828f050a8527555b7"
}
```

## CANON-01-VERCEL-BUILD-A1 — especificacao aprovada antes do codigo — 2026-10-20

GATE=CANON-01; AMENDMENT=CANON-01-VERCEL-BUILD-A1.
Autorizacao nominal no anexo CHAT MESTRE — CANON-01 VERCEL BUILD VALIDATION,
SHA-256 89fa9dbf8a83b6662c0ef4e5d5de4cdc36930e9cd0a0b2558538bfb4b49b1b86.
Workspace C11, branch governance/canon-01-hardening, HEAD
3a418ac42bf0794624efc9aef2d41e5f6162fa71. Main permanece b3fc8d1;
PR #1 OPEN_DRAFT e CI canonico Windows/Linux PASS no preflight.
Arvore/index inicialmente limpos; 1278 arquivos rastreados, 28 arquivos
revisados e 140 artefatos Android capturados antes da alteracao.
canon:check, canon:test (95 controles/11 suites) e lock C11 passaram antes.

Allowlist FECHADA desta emenda:
- Novos: .github/workflows/site-build-validation.yml;
  scripts/test-site-build-contract.mjs;
  docs/governance/authorizations/CANON-01-VERCEL-BUILD-A1.json;
  docs/evidence/CANON_01_VERCEL_BUILD_A1.md.
- Alteracoes controladas: scripts/verify-canonical-contract.mjs e
  scripts/test-canonical-regression.mjs.
- Somente append: este documento, docs/STATUS.md, docs/EVOLUTION_REPORT.md
  e docs/ERRORS_AND_BLOCKERS.md.
Saidas usuais de testes/build/auditoria ficam em tmp ignorado pelo Git.

Workflow independente, pull_request e push, matriz ubuntu-latest/windows-latest,
Node 24, contents: read, actions oficiais fixadas nos mesmos SHAs revisados do
CI existente, checkout fetch-depth: 0 e persist-credentials: false.
Sequencia obrigatoria: npm ci; npm run canon:check; npm run canon:test;
npm run c11:new-device:lock; npm run typecheck; npm run site:build.
O passo site:build recebe somente vars.VITE_SUPABASE_URL e
vars.VITE_SUPABASE_PUBLISHABLE_KEY, configuracao intencionalmente publica do
cliente. Nenhum valor e incluido nesta emenda, nenhuma variavel e cadastrada
remotamente e nao ha fallback sintetico. Ausencia/invalidez deve bloquear o
build real; referencias secrets ou valores fixos alternativos sao rejeitados.
Sem condicoes de skip, continue-on-error, secrets, deploy, APIs de publicacao,
tokens Vercel, permissoes de escrita, workflow reutilizavel ou release.
canonical-regression.yml permanece byte a byte igual ao HEAD recebido.
Contrato exato do novo workflow, tolerando apenas LF/CRLF, e verificado
independentemente do hash autorizado; revisao futura exige emenda de governanca.

Novo workflow e teste dedicado sao obrigatorios e protegidos nominalmente por
hash. Recibo novo append-registrado, before/after exatos e supersedes dos dois
scripts apontando para CANON-01-AUTHORIZATION-HARDENING. Nao substituir recibos
G10FIX, LEGACYTESTS ou AUTHORIZATION-HARDENING. Preservar os 95 controles e
11 suites; ajustar somente fixtures sinteticas para carregar a nova emenda
ativa e seu predecessor real. Acrescentar contrato dedicado executado como
suite adicional e negativos de remocao de checks, shallow checkout, secrets,
deploy, falta de site:build, mutacao silenciosa, recibos e baseline ausente.
Fixtures negativas exercitam o verificador real; nao substituem testes oficiais.

Aceitacao: os nove comandos obrigatorios mais o teste dedicado com exit 0,
95 controles anteriores identificados e 11 suites preservadas, diff restrito,
prefixos documentais/recibos/Android/Supabase intactos e auditoria de segredos.
Sem commit/push/merge/PR write, deploy/redeploy, alteracao de Vercel/dominos,
package.json/vercel.json/.vercelignore, runtime/Android/versao, dados ou migrations.
A1 valida build; nao corrige nem declara PASS dos deployments Vercel existentes.
A2, publicacao, protecao remota da main e demais Gates exigem nova autorizacao.
CHAT_MASTER_REVIEW=PENDING; SOURCE_FORMAT_01_STARTED=NAO; NEXT_GATE_STARTED=NAO.

<!-- CANON-01:AUTHORIZATION -->
```json
{
  "schema": 1,
  "gate": "CANON-01-VERCEL-BUILD-A1",
  "path": "docs/governance/authorizations/CANON-01-VERCEL-BUILD-A1.json",
  "hash": "7edaa32c4b13c8295fc0daa64abed1ef7a4b0c2d"
}
```

## CANON-01 VERCEL A2.1 — local-only artifact verifier

Operator authorized local implementation by PowerShell. Preserve CANON-01 and A1.
A2.1 checks deterministic SHA-256 file integrity, identity claims, routes and headers.
No manifest or fixture is a trusted GitHub attestation; actual Vercel prebuilt NOT verified.
No deploy or Git writes authorized. Publishing requires separate A2.2 gate.

<!-- CANON-01:AUTHORIZATION -->
```json
{
  "schema": 1,
  "gate": "CANON-01-VERCEL-A2-ARTIFACT",
  "path": "docs/governance/authorizations/CANON-01-VERCEL-A2-ARTIFACT.json",
  "hash": "fb613a143676e3e32267ebacb3bec81123791823"
}
```


## CANON-01-VERCEL-A22A - Vercel Prebuilt attested build-only - 2026-10-20

Authorization: latest express Chat Mestre A2.2A request, local implementation only.
Required branch governance/canon-01-hardening; received HEAD
a27d7cd4a74bd447221bba2851ee0af033d0a2fd. Main remains b3fc8d1.
Preflight clean; canonical check, 115 controls/13 suites and C11 passed.

Closed allowlist, defined BEFORE implementation:
- .github/workflows/vercel-prebuilt-attested.yml (new manual workflow);
- scripts/vercel-prebuilt-contract.mjs (new build/output/provenance boundary);
- scripts/test-vercel-prebuilt-contract.mjs (new executable negative suite);
- scripts/verify-canonical-contract.mjs and scripts/test-canonical-regression.mjs;
- docs/governance/authorizations/CANON-01-VERCEL-A22A.json (new receipt);
- docs/evidence/CANON_01_VERCEL_A22A.md (new evidence);
- append-only: this architecture document, docs/STATUS.md,
  docs/EVOLUTION_REPORT.md and docs/ERRORS_AND_BLOCKERS.md.
Existing A2.1 scripts, historical receipts, workflows, package.json, lockfile,
vercel.json, runtime, Android and Supabase remain unchanged. Audit/build logs
are confined to ignored tmp/canon-01-a22a and existing ignored build outputs.

Architecture and acceptance:
Manual workflow_dispatch only, immutable input SHA equal to GitHub event SHA,
review branch only, full Git history, baseline and received HEAD ancestry,
clean tracked source, exact repository and workflow identity. Node 24/npm ci;
all nine official canonical/C11/type/update/security/playback/web commands
plus existing site/A2 tests and the new dedicated suite, without skips.
Separate build and signing jobs on GitHub-hosted Ubuntu. Build has contents
read only; Vercel token is scoped to authenticated read-only project inspection.
CLI vercel@64.7.0, no deploy/redeploy/production invocation. Explicit local
link only to existing project prj_OJcEZDNVPI3NV8Z1GfHOB02v20TF,
team_gHZGQz2zRhEWsyK2jfOLLD5t (xandeflix-prebuilt-nm3x), Preview.
No environment pull: inspect settings in memory, validate canonical settings,
write only whitelisted local project settings. Build receives public client
variables only. Missing/invalid token, public vars, settings or permissions
blocks; never create a project or modify a remote integration.

Only the real CLI build creates .vercel/output. Inspect actual config.json
(version 3) and static payload, byte hashes, exact generated route/header
contract, file types and absence of private credentials/symlinks/maps.
CLI diagnostics and builds.json are NOT Build Output API payload and are
excluded explicitly; no output config/static content is fabricated or patched.
Package deterministic regular-file-only TAR with exact file list and manifest
(repository/SHA/baseline/workflow/run/attempt/project/team/Preview/CLI).
Signing job needs successful build, authenticates same-run staging artifact,
rechecks manifest/output before actions/attest with pinned SHA, then invokes
gh attestation verify with exact repo/workflow/source/signer digest/ref/issuer
and hosted-runner policy. Verify certificate-bound run ID/attempt and subject
digest before uploading the final artifact and Sigstore bundle. No manifest
or fixture grants trusted provenance; no deploy authorization is implemented.

New receipt supersedes only the two governance grants from
CANON-01-VERCEL-A2-ARTIFACT, preserving every historical receipt and control.
New workflow is protected both by grant hash and exact execution template.
Negatives cover identity changes, no Git/baseline, dirty source, missing
credentials/permissions, wrong settings, route/header changes, sensitive
files, archive traversal/links/duplicates, adulterated bytes, invalid/missing
signature, untrusted issuer/runner/workflow/run/repository and missing evidence.
Synthetic policy fixtures are not real signed GitHub attestations.

Remote execution is NOT authorized here. Workflow dispatch availability
requires the workflow on the default branch, plus later publication/approval;
this step does not change main, trigger Actions or configure secrets.
Real .vercel/output and GitHub attestation remain pending remote execution
when local authorized credentials are absent. No fake positive substitution.
All CI actions are pinned to reviewed official SHAs. No merge, commit, push,
PR readiness, Vercel publication or SOURCE-FORMAT-01.
CHAT_MASTER_REVIEW=PENDING; NEXT_GATE_STARTED=NAO.

<!-- CANON-01:AUTHORIZATION -->
```json
{
  "schema": 1,
  "gate": "CANON-01-VERCEL-A22A",
  "path": "docs/governance/authorizations/CANON-01-VERCEL-A22A.json",
  "hash": "c698fec429f4058118d4701a7f5208ece9a0b0d1"
}
```

## A2.2A-R1 - local compatibility amendment - 2026-10-20
Reviewed actions/attest@v4 requires artifact-metadata: write in attest job.
Pinned vercel build target changed to --target=preview; no --prod/deploy.
Offline .vercel/.env.preview.local is blocked: cannot persist potentially private Preview variables under this authorization.
No vercel pull/env pull; actual CLI Preview build remains unproven and potentially blocked without an approved credential-safe configuration mechanism.
GitHub workflow_dispatch still needs default-branch registration; main unchanged and remote execution not authorized.
A2.2A-R1: local corrective implementation only. Existing receipts unchanged; new A22 receipt and registry rehashed.

## CANON-01-A22A-CI-DIAG — diagnostico fail-closed Windows CI — 2026-10-20

Autorizacao de implementacao LOCAL de diagnostico apos falha do job Windows
no commit 2d430d2aae64118ca7e92824c794e32549024ece. Ubuntu PASS, Windows FAIL na suite
scripts/test-vercel-prebuilt-contract.mjs; Windows local PASS 111 controles.
Objetivo exclusivo: emitir ultimo controle PASS e categorias codificadas da
falha na regressao; jamais imprimir stdout/stderr bruto, credenciais ou URL.
Falha continua bloqueando o job, sem continue-on-error ou bypass.

Allowlist fechada: scripts/test-canonical-regression.mjs, este documento
(append-only), docs/evidence/CANON_01_A22A_CI_DIAG.md e
docs/governance/authorizations/CANON-01-A22A-CI-DIAG.json.
Registro SHA de recibo e grant exato para o runner; antecessor nominal
CANON-01-VERCEL-A22A. Todos os 125 controles e 14 suites anteriores
continuam obrigatorios, mais tres controles negativos de diagnostico.
Nenhum recibo historico, workflow, Android, Supabase, Vercel ou runtime
foi modificado. Commit/push e reteste remoto exigem autorizacao separada.
A execucao local nao representa sucesso do Windows CI nem assinatura GitHub.

<!-- CANON-01:AUTHORIZATION -->
```json
{
  "schema": 1,
  "gate": "CANON-01-A22A-CI-DIAG",
  "path": "docs/governance/authorizations/CANON-01-A22A-CI-DIAG.json",
  "hash": "7d89451bf23a05fa1ba819b72b99b28025aa7a66"
}
```


## CANON-01-A22A-WINDOWS-EOL - approved autonomous correction - 2026-10-20

Latest explicit user authorization (attachment SHA-256
dc9feae1e4dddb0cc8950d1df1cb93d840d99bc8446f68897e7b91b9681bf854)
authorizes technical decisions, isolated review-branch commits/push after tests,
and local functional diagnosis without repeated Chat Mestre approval. Main,
remote backend/integrations, release/deploy and Android artifacts stay protected.
This stage is CI-only; functional recovery will have a separate branch/commit.
Received clean HEAD 4a19e23da4aff7dc8e39ba789f22ffddff08a21e; PR #1 Draft.
Pre-edit canon check, 128 controls/14 suites and C11 passed. Windows CI failed
with A22_WORKFLOW_CHANGED immediately after REVIEWED_WORKFLOW_REQUIRED; pure
in-memory reproduction confirms LF-to-CRLF on CRLF input creates CRCRLF.

Closed allowlist before code: scripts/test-vercel-prebuilt-contract.mjs
(idempotent test fixture plus positive/negative EOL cases),
scripts/test-canonical-regression.mjs (only new amendment identity in future
fixture), docs/governance/authorizations/CANON-01-A22A-WINDOWS-EOL.json (new),
docs/evidence/CANON_01_A22A_WINDOWS_EOL.md (new), and append-only this document,
docs/STATUS.md, docs/EVOLUTION_REPORT.md, docs/ERRORS_AND_BLOCKERS.md.
Do not modify verifier, workflow, production code or old receipts. New grants
chain test to CANON-01-VERCEL-A22A and runner to CANON-01-A22A-CI-DIAG.
Keep exact workflow hash, all 128 existing controls/14 suites and 111 dedicated
checks; add LF, already-CRLF, mixed and repeated conversion tests, retaining
rejection of malformed CRCRLF. Run canonical/C11 and nine official checks,
dedicated tests and real Windows/Linux remote checks when publication is safe.
No remote PASS without confirmed jobs. No force/merge/main push, APK/AAB,
Supabase or private-source access. Evidence in ignored tmp/codex-source-recovery.

<!-- CANON-01:AUTHORIZATION -->
```json
{
  "schema": 1,
  "gate": "CANON-01-A22A-WINDOWS-EOL",
  "path": "docs/governance/authorizations/CANON-01-A22A-WINDOWS-EOL.json",
  "hash": "73ffd5ed494cb87a7c0d22e4a8a3f94252cf321e"
}
```

## CANON-01 - explicit test APK delivery authorization - 2026-10-20

Subsequent explicit user request: generate an APK for tests directly on devices. This supersedes only prior prohibitions on local APK generation. Preserve Android 1.0.37 / versionCode 37, package com.xandeflix.prebuilt, historical APKs and all 140 inventoried Android artifacts. No source-code/configuration/version changes or device installation authorized by this request.

Allowlist: append-only authorization here, ignored tmp/codex-source-recovery reports/build sandbox, ordinary ignored dist/TypeScript output, and a new separately named ignored APK. Run canonical checks, C11 lock, typecheck/build and native unit tests; package the verified dist in an isolated Android copy so historical outputs are not overwritten. Verify package, version, signature, assets and SHA-256. No commit/push/deploy/merge as part of APK delivery. Real provider and physical playback remain unverified until tested on the devices.

## CANON-01-SOURCE-OUTPUT - explicit functional recovery - 2026-10-20

User-authorized separate functional branch fix/source-output-format-recovery. Pre-code specification, exact allowlist, confirmed mpegts-to-HLS mismatch, safe TS-checkpoint recovery and acceptance tests: docs/architecture/SOURCE_OUTPUT_FORMAT_RECOVERY.md. Preserve all previous receipts, Android 1.0.37, main and data. This repairs an existing format alias; SOURCE-FORMAT-01 is not started. No push/deploy/merge/backend changes.

<!-- CANON-01:AUTHORIZATION -->
```json
{
  "schema": 1,
  "gate": "CANON-01-SOURCE-OUTPUT",
  "path": "docs/governance/authorizations/CANON-01-SOURCE-OUTPUT.json",
  "hash": "a93d98a1022f99c0e0957dd8f4a2c7d078b8f588"
}
```


## CANON-01-CATALOG-READ-DIAG - local diagnostic test APK - 2026-10-20

User-confirmed current import timestamp and matching source provenance with no movie/Live items. Specification and closed allowlist before code: docs/architecture/CATALOG_LOCAL_READ_DIAGNOSTIC.md. Existing autonomous recovery and test APK authorization permits a separate local diagnostic delivery. It does not establish or bypass the remaining physical cause. Preserve all prior receipts, main, Android identity/artifacts and the format fix. No publication, backend or installation.

<!-- CANON-01:AUTHORIZATION -->
```json
{
  "schema": 1,
  "gate": "CANON-01-CATALOG-READ-DIAG",
  "path": "docs/governance/authorizations/CANON-01-CATALOG-READ-DIAG.json",
  "hash": "169b19ee02a4c1cacbe575cded00ec02928fa3c7"
}
```


## CANON-01-XUI-OPAQUE-RECOVERY - confirmed existing M3U recovery - 2026-10-21

Explicit autonomous recovery and test APK authorization; source attachment and read-only device/API evidence confirm the opaque XUI classification cause. Pre-code specification, closed allowlist and acceptance: [XUI_OPAQUE_M3U_RECOVERY](XUI_OPAQUE_M3U_RECOVERY.md). Preserve all previous diagnostic changes and receipts. Keep both output=mpegts and output=hls, original media URLs, same-source IDs, 16 MiB cap, licensing, C9 and parental guards. No commit/push/deploy/install/backend/version change or SOURCE-FORMAT-01. Physical installed-app restoration remains pending.

<!-- CANON-01:AUTHORIZATION -->
```json
{
  "schema": 1,
  "gate": "CANON-01-XUI-OPAQUE-RECOVERY",
  "path": "docs/governance/authorizations/CANON-01-XUI-OPAQUE-RECOVERY.json",
  "hash": "cf4176d0007b4a04997bf2631558bd9d954fd6f7"
}
```


## CANON-01-XUI-OPAQUE-RECOVERY - explicit physical installation authorization - 2026-10-21

User now explicitly authorizes in-place installation and functional tests on all three connected canonical devices (AFTSS, SM_X610, SM_S926B). Approved APK SHA-256 0fa7e55a22b64848a56d9f870fed01608a89080dc0adceb092cfb0d5c1e0ea93, unchanged 1.0.37/code37/package/signature. This supersedes only no-install restrictions for this APK. Scope, privacy/preservation checks and UI-only test plan: docs/evidence/XUI_OPAQUE_M3U_PHYSICAL_TESTS.md. No uninstall/reset, source/security/backend/runtime/old receipt/Git changes or next Gate. Results pending actual evidence.


## CANON-01-CATALOG-PHYSICAL-FIXES - user-authorized physical refinements - 2026-10-21

Pre-code specification and closed allowlist: [CATALOG_PHYSICAL_REFINEMENTS](CATALOG_PHYSICAL_REFINEMENTS.md). Exact provider types override ambiguous numeric/chapter titles without shifting genuine content IDs; bounded adult loading and phone action geometry retain protection. Explicit source-recovery autonomy and in-place installation/testing authorization apply to the same three devices. Preserve all old receipts, main and Android1.0.37. No Git/backend/deploy/next Gate.

<!-- CANON-01:AUTHORIZATION -->
```json
{
  "schema": 1,
  "gate": "CANON-01-CATALOG-PHYSICAL-FIXES",
  "path": "docs/governance/authorizations/CANON-01-CATALOG-PHYSICAL-FIXES.json",
  "hash": "ea179b852518e2a14c7ee79b6c3c72e76c0df6a9"
}
```


## CANON-01-SERIES-POSTER-COMPOSITION - automatic series posters - 2026-10-21

Explicit user source-to-TMDB rule and screenshot confirm invalid horizontal/shared generic source artwork. Specification/closed scope: [SERIES_POSTER_COMPOSITION_RECOVERY](SERIES_POSTER_COMPOSITION_RECOVERY.md). Bounded RAM evidence triggers conservative TV lookup; valid official source variants remain first. No catalog/source/identity/parental/native/backend/version changes. Existing three-device in-place testing authorization applies; no Git publication or next Gate.

<!-- CANON-01:AUTHORIZATION -->
```json
{
  "schema": 1,
  "gate": "CANON-01-SERIES-POSTER-COMPOSITION",
  "path": "docs/governance/authorizations/CANON-01-SERIES-POSTER-COMPOSITION.json",
  "hash": "645dc8b2b5d4b822bc83d72e9f5ab9f4f4cb4347"
}
```


## CANON-01-TMDB-CONTEXT-IDENTITY - user requested known TMDB works - 2026-10-21

Pre-code specification and closed allowlist: [TMDB_CONTEXT_IDENTITY_RECOVERY](TMDB_CONTEXT_IDENTITY_RECOVERY.md). Source country/network and declared episodes distinguish official TV homonyms, without counts/IDs/catalog/source changes. Exact compact full-title normalization repairs provider spacing. Match7 isolates context and old misses, preserving offline unqualified positives. Source-first rendering, authorization and old receipts remain. Existing local APK/three-device testing authorization applies; no Git/backend publication or next Gate.

<!-- CANON-01:AUTHORIZATION -->
```json
{
  "schema": 1,
  "gate": "CANON-01-TMDB-CONTEXT-IDENTITY",
  "path": "docs/governance/authorizations/CANON-01-TMDB-CONTEXT-IDENTITY.json",
  "hash": "3ab236bab99175dcb5374047c2fc6565650d8945"
}
```


## CANON-01-TMDB-SUBTITLE-PREVIEW — recurring subtitle poster recovery — 2026-10-21

Explicit user screenshot and tablet/Fire source/UI proof; autonomous local recovery applies. Pre-code closed scope and acceptance: [TMDB_SUBTITLE_PREVIEW_RECOVERY](TMDB_SUBTITLE_PREVIEW_RECOVERY.md). Preserve declared episodic presentation through optional preview migration, normalize narrow suffixes and exclude only confirmed unaired Planned homonyms. Earlier network-only test rule superseded explicitly; missing proof and real homonyms remain blocked. Existing receipts/main/source/data/parental/native preserved; no Git/backend publication or next Gate.

<!-- CANON-01:AUTHORIZATION -->
```json
{
  "schema": 1,
  "gate": "CANON-01-TMDB-SUBTITLE-PREVIEW",
  "path": "docs/governance/authorizations/CANON-01-TMDB-SUBTITLE-PREVIEW.json",
  "hash": "5e50d1c29c33b5fe3455112818e978213d065e96"
}
```


## CANON-01-TMDB-SUBTITLE-PREVIEW — validated local delivery — 2026-10-21

Nine official checks/prebuilt contract and128 controls/21 suites PASS;206 native tests PASS. New separate1.0.37 APK fed49d854b34b67837c18adad3f1bfcc84d008ccfc81f5f85e589b52bec157a9. Tablet/phone in-place updates preserve all nine private records; user explicitly reauthorized phone tests. Actual two-title search and three reported Home posters pass on both; tablet screenshot inspected. Optional preview migrated to version3 without changing active catalog counts. Fire is unavailable to ADB and remains on preceding APK; reconnection/IP requested, no full three-device or playback PASS. Initial metadata-timing/cache-path harness failure and evidence-header rejection retained with corrected rechecks; no verifier bypass. Old receipts/main/Android native/data/parental/backend preserved; no Git publication or next Gate.


## CANON-01-TMDB-SUBTITLE-PREVIEW ? Fire follow-up ? 2026-10-21

The authorized Fire AFTSS debug connection was recovered through an ephemeral USB-phone loopback ADB bridge. Streaming installation failed; explicit no-streaming in-place installation then passed. Installed APK SHA256 fed49d854b34b67837c18adad3f1bfcc84d008ccfc81f5f85e589b52bec157a9 verified; all nine private-state comparisons including active catalog and parental preferences are unchanged. Actual decoded own-WebView checks pass for Lovesick and LoveSick [L] and all three reported Home posters. Latest poster APK is therefore installed and poster-tested on all three devices. These checks do not certify video/next-navigation playback. Read-only storage audit independently found unbounded historical catalog generations; no catalog cleanup occurred during this poster amendment. Previous failed results retained. No Git/backend/native/version changes or next Gate.


## CANON-01-CATALOG-RETENTION — automatic catalog retention — 2026-10-21

Explicit user request for automatic obsolete-data cleanup in updated installations. Pre-code closed scope and safety: [CATALOG_SNAPSHOT_RETENTION](CATALOG_SNAPSHOT_RETENTION.md). Preserve active/previous/last-known-good, fail closed on inconsistent records/digests, serialize filesystem readers/writers, and yield between bounded proofs/deletions. Startup and successful import schedule background maintenance; no identity/source/parental/staging purge. Existing128 controls/21 suites preserved, new suite22. Separate same-version APK/tests authorized; no Git/backend publication, native/version changes or next Gate.

<!-- CANON-01:AUTHORIZATION -->
```json
{
  "schema": 1,
  "gate": "CANON-01-CATALOG-RETENTION",
  "path": "docs/governance/authorizations/CANON-01-CATALOG-RETENTION.json",
  "hash": "b3c18f01ba1e753597af3a162c2605669dcd4e6b"
}
```


## Local validation checkpoint ? 2026-10-21

All nine official commands and prebuilt contract exited0; canonical128 controls/22 suites, C11 and typecheck PASS. Dedicated retention29 scenarios and unchanged promotion27 tests PASS. No Android APK or device cleanup performed for this amendment yet. Latest explicit user priority pauses queued work for detail backdrops and transparent sidebar, then APK/device delivery. Retention implementation/receipt are frozen; no physical reclamation PASS claimed. Historical receipts unchanged; no Git/backend/native/version change.


## CANON-01-DETAIL-BACKDROP-UI — detail artwork and TV navigation — 2026-10-21

Explicit priority before queued cast/flicker: [DETAIL_BACKDROP_UI_RECOVERY](DETAIL_BACKDROP_UI_RECOVERY.md). Same-identity bounded horizontal alternatives, poster composition, transparent lateral menu and TV-only compact glyphs; no global zoom or phone/tablet size changes. Existing128 controls/22 suites preserved, new suite23. Same-version separate APK/in-place three-device tests authorized. Frozen retention/receipts preserved; no Git/backend/native/version or next Gate changes.

<!-- CANON-01:AUTHORIZATION -->
```json
{
  "schema": 1,
  "gate": "CANON-01-DETAIL-BACKDROP-UI",
  "path": "docs/governance/authorizations/CANON-01-DETAIL-BACKDROP-UI.json",
  "hash": "579097e952a7ddf142ba885aaf23e164c0241e54"
}
```


## CANON-01-DETAIL-BACKDROP-TYPES ? compilation-only follow-up ? 2026-10-21

TS6133: explicit React.ReactElement return annotations, no runtime behavior change. Preserve the prior UI receipt and128 controls/23 suites. Same local APK/user-prioritized installation scope, no next phase.

<!-- CANON-01:AUTHORIZATION -->
```json
{
  "schema": 1,
  "gate": "CANON-01-DETAIL-BACKDROP-TYPES",
  "path": "docs/governance/authorizations/CANON-01-DETAIL-BACKDROP-TYPES.json",
  "hash": "da8c532e25e220040bba3c942bad41507d4b9245"
}
```


## CANON-01-TV-SIDEBAR-COMPOSITION — physical sidebar correction — 2026-10-21

User continuity audit first, then TV-only background composition and spacing. [TV_SIDEBAR_COMPOSITION_RECOVERY](TV_SIDEBAR_COMPOSITION_RECOVERY.md) documents the confirmed Fire causes and reversible pixel/geometry proof. Preserve128 controls/23 suites/18 prior receipts and all77 incoming dirty paths. CSS-only patch, no new feature. Separate same-version APK, Fire-only in-place install; other devices manual. No Git/backend/native/version/reset or next Gate changes.

<!-- CANON-01:AUTHORIZATION -->
```json
{
  "schema": 1,
  "gate": "CANON-01-TV-SIDEBAR-COMPOSITION",
  "path": "docs/governance/authorizations/CANON-01-TV-SIDEBAR-COMPOSITION.json",
  "hash": "f5d43f845cd4e3fdb7947dc33e4f9b3df8669ab7"
}
```


## TV sidebar installed-APK acceptance — 2026-10-21

All10 official commands exit0; canonical128 controls/23 suites, C11, typecheck, update, security, playback and both web builds PASS. Capacitor/Gradle exit0; native206 tests/35 suites, zero failures/errors/skips. Separate Xandeflix-v1.0.37-tv-menu-20261021.apk:11,800,536 bytes, SHA256a071e4f0bc9a9098d2f411e9a307ff4deb3c0c4e5d74fddeab7d82566a07ef07. Same package1.0.37/code37/certificate,8 web assets verified, standalone HTTPS, no private credential pattern.

Installed ONLY on Fire AFTSS with in-place update; exact installed SHA confirmed. Ten identity/activation/source/parental/active/recovery files byte-identical during update. No uninstall/reset/restore. Actual packaged CSS, without preview injection: nav252px,44x36 targets,36px pitch,16px icons; transparent rail follows page palette. Native screenshot inspected; rail/page RGB delta0 at all5 sampled rows. Actual ADB D-pad Down traverses all6 subsequent controls with visible focus, without entering PIN or protected content. Phone/tablet APK installation remains manual; no new phone physical test claimed. Tablet temporary CSS dimensions unchanged.

Preservation audit:1339 baseline files checked, only6 allowlisted existing paths changed;18 prior receipts and140 old APK/AAB artifacts unchanged. Build stage158 of159 files identical; only auto-generated capacitor.settings.gradle relocates4 module references to the same root node_modules during cap sync. Root native files unchanged;14 native APK entries (DEX/libraries/manifest/resources) identical to previous UI APK. Initial broad stage-equality diagnostic stopped on that generated relocation; exact content/real-path verification resolved it without modifying production or test assertions. Old UI APK preserved. HEAD/main/index unchanged; source branch unpublished. Evidence and report:tmp/codex-source-recovery/tv-sidebar-composition-20261021/.

User now reports playback starts then stalls repeatedly on slow connections. Buffer policy is wired to full-screen and preview players, but this visual APK does not change it or certify a slow-network fix. Actual network/bitrate diagnosis remains pending; no player/backend/source/parental/license change. Before this update only2 snapshots existed (~555MB); automatic reclamation is not proven by this update, and earlier clean-install savings remain attributable to user uninstall. GIT_COMMIT=NAO; GIT_PUSH=NAO; SUPABASE_CHANGED=NAO; NEXT_GATE_STARTED=NAO.


## CANON-01-A22A-WINDOWS-METADATA-EOL — Windows CI metadata EOL regex normalization — 2026-10-22

Explicit autonomous user instruction authorizes controlled CI fix for Windows workflow failures in Canonical regression #13 and Site build validation #9. Root cause: scripts/test-vercel-prebuilt-contract.mjs asserted ATTEST_ARTIFACT_METADATA_PERMISSION using a multi-line LF regex against raw workflow string, which contains CRLF (\r\n) on Windows git checkouts, causing regex failure despite lfWorkflow already existing.

Closed allowlist before code: scripts/test-vercel-prebuilt-contract.mjs (minimal patch: assert against lfWorkflow), scripts/test-canonical-regression.mjs (only new amendment identity in future fixture), docs/governance/authorizations/CANON-01-A22A-WINDOWS-METADATA-EOL.json (new receipt), docs/evidence/CANON_01_A22A_WINDOWS_METADATA_EOL.md (new evidence), and append-only this document, docs/STATUS.md, docs/EVOLUTION_REPORT.md, docs/ERRORS_AND_BLOCKERS.md.

Chaining: supersedes scripts/test-vercel-prebuilt-contract.mjs from CANON-01-A22A-WINDOWS-EOL and scripts/test-canonical-regression.mjs from CANON-01-TV-SIDEBAR-COMPOSITION. All 19 historical/prior receipts, 128 canonical controls / 23 suites, Android 1.0.37 / versionCode 37, package com.xandeflix.prebuilt, signing certificate, Supabase, Vercel and production workflows remain strictly preserved. No git commit, push, PR or deployment.

<!-- CANON-01:AUTHORIZATION -->
```json
{
  "schema": 1,
  "gate": "CANON-01-A22A-WINDOWS-METADATA-EOL",
  "path": "docs/governance/authorizations/CANON-01-A22A-WINDOWS-METADATA-EOL.json",
  "hash": "90d7db4a18e84221afa6fa9dda40c82d6dad6121"
}
```
