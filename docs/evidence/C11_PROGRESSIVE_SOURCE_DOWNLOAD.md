# C104 — Transporte progressivo da primeira importação

## Autoridade e proveniência

Pedido explícito de corrigir a demora superior a 23:44 no Fire Stick preservando
os termos canônicos. Especificação anterior ao patch em
`../architecture/C11_PROGRESSIVE_SOURCE_DOWNLOAD.md`, complementada antes dos
ajustes de compatibilidade C60 e testes físicos. Clone independente C11/main,
HEAD `d039f8837dfcfd44374560a9e6642cb93e59c2cf`, origin esperado. AGENTS,
Architecture, Execution, Source Data Boundary e Activation Lock lidos. Trabalho
C100–C103 preservado; nenhum commit/push/PR ou alteração administrativa.

Análise REA anterior é estática dos APKs e não prova o gargalo deste aparelho.
C104 deriva de telemetria CDP/ADB sanitizada e do código do transporte próprio.
Os APKs externos não forneceram código copiado nem foram executados neste ciclo.

## Diagnóstico físico corrigido — APK19 anterior, 2026-10-13

Alvo `G071CQ070344374G`, Amazon AFTSS/sheldon/API28. A conclusão inicial de que
53.592.362 bytes representavam um download terminado esperando EOF não foi
comprovada e fica superseded: o arquivo depois cresceu para 80.600.890 bytes e
80.643.110 bytes. Uma janela de dez segundos sem crescimento não prova EOF.
O aplicativo anterior acabou promovendo o catálogo às 19:09 locais, sem patch
novo ou alteração de fonte. A demora era no download antes do parser.

Milestones relativos ao `performance.timeOrigin` da mesma instância:

| Marco | Milissegundos |
| --- | ---: |
| T8_CATALOG_SYNC_STARTED | 342855,5 |
| IMPORT_FETCH_STARTED | 346754,1 |
| IMPORT_STREAM_PARSE | 2746734,6 |
| IMPORT_BATCH_PERSISTED | 2749035,7 |
| IMPORT_STAGING_FINALIZED | 2958091,5 |
| T11_PROMOTION_COMPLETE | 2958808,0 |

Download antes do parser: 2399980,5 ms (~40 minutos). Parse até promoção:
212073,4 ms (~3m32s). Sincronização total: 2615952,5 ms (~43m36s), separada da
espera humana/ativação inicial. Não é benchmark controlado de rede/provedor.
O processo permaneceu vivo, sem crash/ANR comprovado; uso de swap e ruído de
camera-service no WebView são observações secundárias, sem atribuição causal.
Primeiro catálogo ocorreu com o APK anterior; não atribuir sua conclusão ao C104.

## Patch delimitado

- Primeira importação sem digest anterior pede transporte progressivo. A ponte
  libera o consumidor após HTTP2xx/tamanho aceito/output aberto, ainda em FILE_WRITE.
- Leitura de arquivo em escrita distingue pendência de EOF real e entrega bytes
  em Base64, evitando corrupção de caracteres UTF-8 divididos em chunks.
- EOF final, cancelamento e falhas tardias chegam ao consumidor. Erro acompanhado
  de done=true também é rejeitado; cancelamento nunca vira término normal.
- Call permanece cancelável durante todo o corpo, com timeout total15min além
  dos timeouts existentes. Falha limpa somente temporário; resultado terminal
  precede limpeza. Falha de delete mantém ownership para nova tentativa após
  fechamento do output, inclusive no Windows usado pelos testes JVM.
- C60 conserva modo completo e digest nativo antecipado quando existe digest
  anterior: fonte inalterada evita parse/staging/promoção como antes.
- Parser, classificação, esquema, validação e promoção atômica não foram alterados.
  Importador mudou somente a preferência explícita de transporte.

## Verificação local — 2026-10-14

- Lock antes do patch: 26 ativação +27 promoção +9 controles negativos PASS.
- Build com prebuild oficial após patch: mesmo lock PASS; TypeScript/Vite PASS.
- Oito integrações progressivas PASS: Unicode/hash/tamanho byte-exatos, primeiro
  batch2500 antes do EOF, falha inicial/tardia, ativo preservado, promoção real
  validada em storage sintético, C60 sem reads e cancelamento concorrente.
- 13 testes de transporte nativo PASS, incluindo cinco novos: resposta aberta,
  bytes/ordem/pending, cancelamento, truncamento, cleanup imediato e deadline.
- Suíte JVM completa: 196 testes/33 suites, zero failures/errors.
- C60 refresh: 19 PASS. Transporte R2F8: seis PASS, fixture60MiB sem materializar
  playlist completa. Retenção/importação: PASS, 100000 records, heap pós-GC
  ~22,74MiB, counts/relações/hashes preservados. Suite bounded250000: 83 PASS.
- Diff whitespace PASS. Revisão independente read-only encontrou os riscos de
  UTF-8, C60 e cancelamento; revisou a correção e não apontou bloqueio remanescente.

## Falhas intermediárias e limite preexistente

Os dois primeiros testes novos falharam: inspeção JSObject em JVM retornava
stubs nulos e cancelamento via closeAndDelete não mantinha flag explícita.
Resultados tipados internos e cancelamento canônico corrigiram ambos. Depois,
o teste de cleanup imediato revelou delete negado com output aberto no Windows;
reter ownership e repetir limpeza após o fechamento eliminou o órfão. Nenhum
critério foi reduzido para aceitar regressão.

O harness legado `test-r2f8-large-source-transport-observability.mjs` falha em
M3U_LINE_TOO_LARGE na fixture intencional de linha9MiB. Reproduzido também com
os três módulos alterados carregados diretamente de HEAD por loader read-only,
sem tocar worktree: mesmo erro antes de C104. Harness não captura a exceção atual
do importador. Não homologado globalmente; não foi alterado/relaxado neste ciclo.
Os testes funcionais do transporte e integridade/ativação obrigatórios passam.

## Artefato e evidência física

APK de teste: `tmp/c104-progressive-source/Xandeflix-v1.0.19-c104-progressivo.apk`,
11558909 bytes, SHA-256
`3bf889d897b05650b98be1ad13853a66ef587de6c6bb2cfc3b81e63e3c6e640d`.
versionCode19/name1.0.19 preservados para teste local; não é uma versão nova
publicada pelo updater. Assinatura igual ao APK19 anterior recuperável
`401c8dc2...dfba6c`. Sete assets byte-match com dist; HTTPS/logging-none/config
sem servidor dev preservados. Cap sync e assembleDebug PASS.

Primeiro instalado in-place no alvo original: cinco privados e252 arquivos de
catálogo comparados integralmente em memória antes/depois, iguais; UID e
firstInstallTime iguais. APK instalado com hash idêntico. Activity abriu em
TotalTime5846ms; não equivale a Home com imagens.

Fixture HTTP somente loopback, adb reverse específico e ponte Capacitor real:
startDownload retornou FILE_WRITE em94ms; primeira leitura em253ms;262147 bytes
foram consumidos enquanto a resposta ainda estava aberta; EOF temporário era
pending. Depois639789 bytes completos foram entregues byte-exatos, incluindo
Unicode; EOF verdadeiro e cleanup PASS. Cancelamento retornou ABORTED, e corpo
truncado retornou erro sanitizado com done=false. Três sessões sintéticas limpas,
catálogo real continuava visível. Forward/reverse removidos. Fixture não invocou
importador/promotor nem alterou estado da fonte/ativação.

## Instalação limpa solicitada depois — 2026-10-14

Usuário solicitou explicitamente começar do zero para medir Home/hero/capas.
Emenda anterior à operação no contrato C104. Mesmo alvo/pacote: uninstall sem-k
PASS, ausência do package confirmada, instalação do APK verificado PASS.
Nenhum arquivo anterior em files antes da primeira abertura; clear-data não foi
necessário. Dados de identidade/ativação/fonte/catálogo não foram exportados nem
restaurados. Código/chave novos surgiram pelo fluxo normal e usuário confirmou
ativação pelo painel. Nenhuma autorização comercial foi executada pelo agente.

Primeira Activity: ThisTime8200ms, TotalTime7917ms, WaitTime8467ms. Telemetria
do novo processo: T0=1904,4; T5=13659,1; T6=13659,4; shell/interação11755ms
desde T0. Era tela de ativação, não Home carregada.

Após autorização: T8=92533,6; IMPORT_FETCH_STARTED=96461,4;
IMPORT_STREAM_PARSE=102260,8; IMPORT_BATCH_PERSISTED=106073,8 (ms desde
performance.timeOrigin). Parser começou5799,4ms após fetch, primeiro batch
9612,4ms. ADB confirmou arquivo de download ainda presente/crescente e25 arquivos
de staging. Isso confirma sobreposição no fluxo real, sem publicação parcial.
Home/hero/capas completos ainda em medição, separados da espera humana.

`CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; GIT_COMMIT_AUTHORIZED=NAO;
GIT_PUSH_AUTHORIZED=NAO; GIT_PR_AUTHORIZED=NAO`.
