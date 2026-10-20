# CANON-01-G10FIX - Correcao controlada do DeltaV1

GATE=CANON-01; AMENDMENT=CANON-01-G10FIX; CHAT_MASTER_REVIEW=PENDING.
Autorizacao expressa do Chat Mestre recebida em2026-10-20. Baseline
b3fc8d1e3844bc5601813ab1b298289af5b3f1fd; clone independente C11, main,
origin https://github.com/xandeflix2/xandeflix-prebuilt.git.

Estado inicial:14 arquivos CANON-01 conhecidos e preservados;140 artefatos
Android identicos ao inventario. REGRESSION_LOCK=FAIL herdado, G9/G10 somente
PASS em experimento anterior com copias em RAM. Nenhuma correcao oficial
ou validacao futura e presumida neste registro inicial.

Especificacao anterior ao codigo e allowlist em
[contrato](../architecture/XANDEFLIX_PREBUILT_PHASED_EXPANSION.md).
Proveniencia privada: tmp/canon-01-g10fix/before.json captura conteudo/hash
dos14 arquivos anteriores; inventario baseline preservado em tmp/canon-01.

## Causa e limites

Builder/types/applier nao transportavam extensions.categoryProvenance do
target, produzindo um catalogo incompleto. SHA-256 rejeitava corretamente.
Somente transporte opcional de targetExtensions e autorizado; nao relaxar
assinatura/hash, alterar identidade, licenca, ativacao, playback ou backend.

Compatibilidade antiga e recuperacao por pacote completo serao verificadas
explicitamente. Resultados oficiais, diff, auditoria e flags serao anexados
apos execucao. Nenhum commit/push/APK/AAB/instalacao/reset autorizado.

## Resultado oficial - 2026-10-20

RESULT=FAIL para o Gate agregado. A correcao G10 foi aplicada e os testes
oficiais G9/G10 passam, mas outras duas suites legadas falham fora da
allowlist. Nao remover/ignorar esses testes, mudar Android/parental ou
declarar o Gate verde. Builds web nao executados pela condicao expressa
de executar somente depois de todas as verificacoes aprovadas.

### Implementacao e governanca

As3 alteracoes TypeScript sao de1 linha cada, mais5 linhas no schema.
Tipos/builder/applier agora transportam/restauram targetExtensions completo
somente quando presente. Ausencia nao herda extensoes da base. A regra
additionalProperties=false da raiz foi preservada; apenas o objeto de
extensoes, ja aberto no contrato do catalogo completo, e permitido.

[Recibo de autorizacao](../governance/CANON_CHANGE_AUTHORIZATION.json) registra
CANON-01-G10FIX, baseline, origem da aprovacao, before/after Git blob LF dos
4 arquivos de produto/schema e do novo teste, comandos, impacto e risco.
O identificador representa emenda deste Gate, nao proxima fase.
Verificador/CI/hooks nao foram modificados. Checker confirma868 arquivos
protegidos e aceita somente os hashes nominais; nenhum bypass introduzido.

Runner preserva todas as8 suites anteriores e os43 controles. Acrescenta
o novo teste ao fim com exit/timeout/marcador obrigatorios. Overlays de
autorizacao futura preservam os5 grants reais para testar a nova versao
sintetica sem perder a autorizacao vigente. Criterios negativos anteriores
nao foram relaxados. Em execucao real, os43 controles e6 suites passaram;
a7a suite (orientacao) falhou. Landscape/novo teste nao foram alcancados
por esse runner, mas passaram em execucoes oficiais separadas.

### Compatibilidade validada, com limites explicitos

| Artefato/leitor | Resultado observado | Caminho seguro |
| --- | --- | --- |
| Delta novo / leitor novo, extensions presentes/alteradas/novas/vazias | Aceito; target SHA-256 exato | Delta assinado validado |
| Delta novo / leitor novo, extensions removidas/ausentes | Aceito; ausencia preservada | Delta assinado validado |
| Delta antigo / leitor novo, target sem extensions | Aceito, nos perfis completos V1/V2 | Fluxo existente |
| Delta antigo / leitor novo, target com extensions omitidas pelo builder antigo | Rejeitado por hash; base preservada | Importacao explicita de FullV1/FullV2 assinado |
| Delta novo / leitor antigo, com targetExtensions | Rejeitado pelo schema antigo; base preservada | Importacao explicita de FullV1/FullV2 assinado |
| Delta novo / leitor antigo, target sem extensions | Aceito, inclusive remocao das extensoes anteriores | Fluxo existente |
| Pacote completo V1/V2 / leitor antigo ou novo | Catalogo final e hash corretos; geracao anterior retida | API segura importPackage existente |
| Pacote completo de fallback sem assinatura | Rejeitado; ponteiro ativo preservado | Exigir assinatura valida |

Leitores/builders antigos foram carregados dos objetos Git da baseline em
subprocessos isolados do teste dedicado. Nao sao mocks permissivos e nao
substituem modulos no processo principal nem nas suites G9/G10 oficiais.
Todos os12 grupos solicitados passaram, alem de falha simulada de promocao
preservando a geracao ativa. A base de entrada tambem nao sofreu mutacoes.

BACKWARD_COMPATIBILITY=PASS significa a matriz de aceites/rejeicoes e
recuperacao segura acima. NAO significa que leitor antigo aceita o novo
campo. Para leitores antigos/capacidade desconhecida, selecionar pacote
COMPLETO assinado. Fallback demonstrado e EXPLICITO pela API ja existente;
negociacao, selecao/download automatico e rollout em aparelhos nao foram
implementados nem certificados. Automatizar isso exigiria outro escopo;
nenhuma entrega automatica foi tentada nesta emenda.

### Validacoes na arvore real

| Comando/verificacao | Resultado |
| --- | --- |
| npm run update:check (G9) | PASS, exit0 |
| npm run security:check (G10) | PASS, exit0; assinatura, negativos, DeltaV1 e recovery |
| npm run canon:check | PASS,868 arquivos, emenda nominal reconhecida |
| npm run canon:test | FAIL, exit1 em test-c11-phone-ui-orientation.mjs |
| npm run c11:new-device:lock antes/depois | PASS;9 negativos e suites26/27/6 |
| npm run typecheck | PASS, incluindo prehook canonico |
| node scripts/test-g10-delta-extensions-regression.mjs | PASS;12 grupos e promocao/recovery |
| npm run contract:check (G2) | PASS;7 negativos |
| npm run search:check (G7) | PASS |
| node scripts/test-c11-landscape-navigation.mjs | PASS,18 casos e hook real |
| npm run playback:check (G8) | FAIL, exit1 no fluxo de filme |
| npm run build / npm run site:build | NOT_RUN: verificacoes obrigatorias nao aprovadas |
| Build APK/AAB, instalacao, teste fisico | NOT_RUN: nao autorizados |

Boot/promocao, busca C105, navegacao C107, VOD direto C11, C9 e G10 passaram
tambem como as6 suites existentes executadas pelo runner canonico.
Logs UTF8 e exit codes em tmp/canon-01-g10fix/official-results.json e *.log.
Experimentos candidatos anteriores em tmp/canon-01 eram copias em RAM,
nao substituem esses resultados oficiais. A evidencia fisica1.0.37 fornecida
pelo operador (20/20,21/21 capturas,90min) e historica; nenhum aparelho foi
testado/atualizado com esta correcao, nem uma nova versao foi gerada.

### Bloqueios fora da allowlist

1. scripts/test-c11-phone-ui-orientation.mjs:51 exige por regex que name,
   exported=false e screenOrientation=sensorLandscape sejam consecutivos.
   O manifest ja contem supportsPictureInPicture entre os dois primeiros.
   Os valores corretos permanecem presentes. Teste/manifest sao identicos
   a baseline; nao e prova de regressao funcional de orientacao causada
   pelo Delta. Corrigir seletor/atributos XML do teste exige nova emenda.
2. scripts/validate-direct-playback.mjs:278 esperava player indisponivel/
   aberto, mas recebeu NATIVE_PLAYER_ERROR com protecao local indisponivel.
   A fixture Node nao prepara localStorage usado pelo armazenamento parental;
   a protecao bloqueia acesso. Playback/parental/teste estao inalterados.
   Revisar fixture e suas portas/autorizacoes exige escopo proprio; nao
   desativar guarda parental, licenca ou C9 para tornar o teste verde.

Parada na correcao desses bloqueios por allowlist explicita do Chat Mestre.
Nenhuma suite antiga foi alterada ou retirada. Build/publicacao bloqueados.

### Arquivos e preservacao

Arquivos alterados/criados NESTA emenda (13):
- src/update/catalog-delta.types.ts
- src/update/catalog-delta-builder.ts
- src/update/catalog-delta-applier.ts
- schemas/prebuilt-catalog-delta.schema.json
- scripts/test-g10-delta-extensions-regression.mjs (novo)
- scripts/test-canonical-regression.mjs
- docs/architecture/XANDEFLIX_PREBUILT_PHASED_EXPANSION.md
- docs/evidence/CANON_01_EXECUTION.md
- docs/STATUS.md
- docs/EVOLUTION_REPORT.md
- docs/ERRORS_AND_BLOCKERS.md
- docs/governance/CANON_CHANGE_AUTHORIZATION.json (novo)
- docs/evidence/CANON_01_G10_FIX_EVIDENCE.md (novo)

O worktree completo contem21 arquivos do Gate:14 anteriores mais7 novos
no escopo. Dos14 anteriores,8 ficam byte a byte identicos,5 recebem apenas
append documental e o runner recebe o ajuste autorizado. Nenhum recriado
a partir de Git. Demais arquivos rastreados e140 APK/AAB devem permanecer
identicos ao inventario, conforme recibo final de integridade.

Diff desta emenda para revisao: tmp/canon-01-g10fix/amendment-review.diff.
Diff agregado dos21 arquivos: tmp/canon-01-g10fix/full-review.diff.
Auditoria final: tmp/canon-01-g10fix/integrity-result.json, com hashes e
classificacao de preservacao dos14, escopo, Android e HEAD/index.

### Recomendacao ao Chat Mestre

Revisar o diff G10 e reconhecer somente sua correcao/testes. Manter CANON-01
bloqueado; autorizar separadamente, se desejado, revisao das fixtures de
orientacao e G8 com criterios negativos integrais. Nao alterar runtime
Android/parental para acomodar testes antigos. Publicacao Git continua
explicitamente proibida mesmo apos eventual resolucao desses bloqueios.
Google Play, piloto60 e Tizen/webOS permanecem nos estados anteriores.

```text
RESULT=FAIL
GATE=CANON-01
AMENDMENT=CANON-01-G10FIX
CANONICAL_14_FILES_PRESERVED=SIM
G10_ROOT_CAUSE_CONFIRMED=SIM
G10_FIX_APPLIED=SIM
G10_OFFICIAL_TEST=PASS
G9_OFFICIAL_TEST=PASS
BACKWARD_COMPATIBILITY=PASS
CANONICAL_CONTRACT=PASS
REGRESSION_LOCK=FAIL
C11_LOCK=PASS
TYPECHECK=PASS
BUILD_VALIDATION=NOT_RUN
ANDROID_BASELINE_PRESERVED=SIM
APP_VERSION_CHANGED=NAO
ANDROID_APK_CHANGED=NAO
SUPABASE_CHANGED=NAO
USER_DATA_CHANGED=NAO
TIZEN_WEBOS_STARTED=NAO
GIT_COMMIT=NAO
GIT_PUSH=NAO
MAIN_MERGED=NAO
NEXT_GATE_STARTED=NAO
CHAT_MASTER_REVIEW=PENDING
```
