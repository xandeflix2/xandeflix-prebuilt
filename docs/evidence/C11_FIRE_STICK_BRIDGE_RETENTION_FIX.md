# C11 — Fire Stick: retenção residual da ponte nativa

## Escopo e baseline — 2026-10-04

Contrato prévio: ../architecture/C11_FIRE_STICK_BRIDGE_RETENTION_FIX.md.
Usuário autorizou prosseguir preservando a nova ativação. Sem novo uninstall,
pm clear, reset, backend/Git ou alteração da lógica de ativação. Preflight C11
confirmado, main/ahead 2, HEAD f0fdb6840c21e7a660f1662f2bbac9f2cd241cba;
393 hashes runtime/config/scripts/Android/APK capturados antes do patch.
Lock prévio 49 casos + 9 controles negativos PASS.

APK baseline 0450304141F162E0C3C912D416407B40A3B0620F1CB72D458B43C77E6EAC3781.
App estava fechado, nova ativação presente. Abertura normal baseline no Fire
AFTSSS/API 28, PID 8505, renderer 8585. CDP read-only confirmou DEBUG=true,
isLoggingEnabled=true, secureContext=true. Nenhum payload/console real exportado.

Runtime.getHeapUsage, sem GC/clearConsole forçados:

| Tempo performance.now | usedSize bytes | totalSize bytes |
| --- | --- | --- |
| 40844,1 ms | 77318416 | 81616896 |
| 49130,9 ms | 96678540 | 100200448 |
| 57339,5 ms | 119627740 | 122515456 |
| 66152,3 ms | 146124684 | 149176320 |

Time origin 1791131944079,6; T8=5110,2 ms, IMPORT_STREAM_PARSE=15465,8 ms,
primeiro batch=17723,6 ms. Nenhuma promoção/Home com conteúdo nesses samples.
13:40:45.633 local: V8 javascript OOM (Reached heap limit).
13:40:49.559 local: host SIGTRAP. Usuário confirmou "fechou novamente" enquanto
o APK corrigido ainda compilava, não após sua instalação. É nova reprodução
do baseline, não teste físico do novo patch. Forward tcp:50527 removido.

## Mecanismo reproduzido e patch mínimo

CapConfig.java instalado localmente: default loggingBehavior=debug habilita
logging em build debug. native-bridge.js efetivo registra call e result.data
via console.dir. Teste novo executa essa ponte intacta em VM separada, console
que retém argumentos explicitamente, 24 pares readChunk/writeFile de 1 MiB
UTF-16 Unicode distintos, 49 operações incluindo erro. Não é reprodução exata
dos limites internos do console Amazon WebView nem heap dump da fonte real.

- Logging ON: 48 objetos de payload retidos, delta pós-GC ~96,068 MiB.
- Logging OFF: zero payloads registrados, delta pós-GC ~4,055 MiB.
- Roundtrips/Unicode/erros e console de aplicação preservados em ambos.
- Verificação de config falhou no baseline como esperado; após patch PASS.
- Quatro controles negativos: campo ausente, debug, production, override Android.

Único patch de produção: capacitor.config.ts loggingBehavior='none'. Desabilita
logs internos/bridge do Capacitor, não plugins, eventos, HTTPS, CapacitorHttp,
mixed content nem avisos sanitizados do player. Não modifica parser, ativação,
snapshot, promoção, UI, player, backend ou dependências. Backup anterior
Xandeflix-v1.0.0-standalone-before-bridge-retention-fix.apk preserva APK baseline.

## Validação local

Lock após patch e prebuild PASS, build tsc/Vite e cap sync PASS; nenhum aviso
crypto externalized. Avisos preexistentes node:fs/path e chunks permanecem.
Teste 100 mil episódios com sink bounded/hashes PASS, heap pós-GC ~22,689 MiB
(PC/Node, não Fire). Suites disponíveis bounded T1..T83, post-gate T84..T126,
profile/live T127..T143 e source 66 PASS. Player notice 11, C9 10 e VOD 12 PASS.
Primeira tentativa do notice usou nome inexistente; reexecutado no caminho real
test-c11-playback-error-notice.mjs, sem criar stubs ou alterar a suite.
Três suites legadas R2F8 continuam indisponíveis por arquivos ausentes no baseline.

## Validação física e entrega

APK compilado/verificado e atualizado in-place com sucesso:
SHA-256 85EB23B526FBDEBA4353F32D5493CC358DFD0A0921DE843AF1DE42CEDDBDCAB2,
8745587 bytes, package com.xandeflix.prebuilt, versionCode 1/versionName 1.0,
minSDK 23/target 35, certificado
b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d.
Assinatura v1/v2 válida. 90 testes Java em 12 suites, zero failures/errors/skips,
Gradle 155 tarefas realmente executadas. Cinco assets web idênticos ao dist;
cordova.js/cordova_plugins.js gerados pelo sync conferidos separadamente.
Primeira conferência tratou esses dois extras como arquivos dist e falhou;
validação corrigida comparou arquivos gerados ao sync, sem relaxar bytes/assets.
Config no APK confirma loggingBehavior=none e HTTPS/Http intactos; sem entradas
de identidade/chave/ativação/fixtures no APK. APK instalado conferido por hash.

Igualdade dos arquivos de identidade, chave, instalação e ativação antes/depois
do install -r: TRUE, sem expor valores/digests. Nenhum uninstall, pm clear,
reset, alteração de backend ou limpeza de staging. Conexão ADB caiu na primeira
tentativa de abrir, restabelecida por connect scoped; app estava sem processo.
boot_id era diferente do teste anterior (causa não determinada; nenhum reboot
foi comandado pelo agente). Nova abertura normal bem-sucedida, PID 8001,
renderer 8077; loggingEnabled=false e secureContext=true no aparelho.

### Cronologia física (UTC-3)

Activity START 13:53:15.511; time origin 1791132798276,1.

| Marco | performance.now ms | Observação |
| --- | --- | --- |
| T8 sync | 5783,7 | fonte resolvida normalmente |
| Fetch | 6455,2 | download direto do dispositivo |
| Parse | 26106,9 | download durou 19,652s |
| Primeiro batch | 28305,7 | dados persistidos |
| T10 staging completo | 150607,9 | parse/persistência duraram 124,501s |
| T11 promoção completa | 151467,4 | promoção durou 0,860s |
| Primeira Home observada | 156184,4 | 225 cards, banner ausente |
| Busca completa | 171912,0 | posterior à Home |

Sync -> promoção: 145,684s. Activity -> promoção: 154,233s. A primeira
observação da Home às 13:55:54.404 limita a abertura completa a <=158,893s
nesta amostragem (polling de 10s, não instante exato de primeiro frame).
Não confundir 3,444s do am start/shell com Home completa. Meta <=60s: FAIL.

Heap via Runtime.getHeapUsage durante a importação amostrada: 16,2..25,8 MiB,
sem crescimento monotônico rumo ao limite. Após promoção 7,34 MiB; após busca
~7,10..7,14 MiB, até 289,404s do time origin, sem GC/console clear forçados.
Pico entre amostras é desconhecido. Meminfo pós-carga: host TOTAL PSS 93408 KiB
e renderer 65613 KiB (não equivalem a heap JS, nem a garantia de pico RSS).

Ponteiro ativo confirma snapshot promovido; manifest completo: 17124 filmes,
8911 séries, 15828 temporadas, 223660 episódios, 1027 live, 240784 streams,
44 categorias, 20 gêneros, 208 segmentos. Snapshot ~204 MiB em disco. Conteúdo
não truncado pelo patch; parser e writer permaneceram byte-idênticos ao baseline.
Home final 848 cards, sem banner/alerta de licença inválida; processo permaneceu
vivo após busca até 289,404s do time origin nesta série de observação. Dois stagings de crashes anteriores
preservados, conforme restrição de não limpar dados; não são catálogo ativo.

Esta é a primeira importação COMPLETA após atualização com a ativação recém
criada preservada, não outro teste de instalação limpa. OOM da importação não
reproduziu neste ciclo; combinação da reprodução sintética, flag física e
comparação é forte evidência de retenção associada aos logs da ponte, não
identificação de cada retentor por heap dump nem garantia universal.

Medição opcional de reabertura com cache foi especificada, mas o ambiente
bloqueou o comando combinado com am force-stop ANTES da execução. Nenhum
processo foi encerrado por esse teste, nenhum novo forward foi criado, nenhuma
tentativa de contornar a política. Tempo com cache permanece NÃO MEDIDO.
Forwards próprios 50528/50529 removidos ao terminar.

Posteriormente o PID mudou; usuário confirmou explicitamente que fechou e
reabriu manualmente depois de o catálogo aparecer. Logs também registraram
abertura pelo launcher/force-stop do sistema e uso do player, sem novo V8 OOM
no recorte. Não classificar troca de PID como falha automática nem validar
playback por essa evidência; tempos de abertura manual não foram instrumentados.
Último processo observado estava encerrado. Tentativa posterior de abertura
normal, sem comando de stop, também foi bloqueada antes de executar; sem
contorno, sem novo forward. Tempo com cache continua NÃO MEDIDO.

## Proveniência final

Auditoria dos 393 hashes baseline: somente capacitor.config.ts e APK raiz
mudaram; adicionado scripts/test-c11-native-bridge-retention.mjs. Nenhuma
remoção ou mudança em identidade/ativação/boot/storage/parser/writer/player,
package.json, dependências ou código Android. Outputs usuais de build/sync
fora desse inventário foram conferidos no APK. Diff scoped PASS. Sem Git.
Backup anterior mantém SHA 0450304141... e 8745571 bytes.

Resultado: FECHAMENTO/OOM_IMPORTAÇÃO=PASS_NESTA_AMOSTRA;
ATIVAÇÃO_PRESERVADA=PASS; FULL_CATALOG_HOME_SEARCH=PASS;
FIRST_LOAD_MAX_60_SECONDS=FAIL; CACHED_REOPEN_TIME=NOT_MEASURED.
Gargalo restante medido: parse/persistência local ~124,5s, não pareamento.
Não iniciar novo Gate nem relaxar carregamento para catálogo parcial.
