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
