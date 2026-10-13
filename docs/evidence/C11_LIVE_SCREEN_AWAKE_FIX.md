# C11 — Tela ativa no player Live; Fire Stick atualizado — 2026-10-05

## Autoridade, origem e limites

Usuário confirmou descanso na prévia e na tela cheia e aprovou corrigir/gerar
APK/instalar SOMENTE no Fire Stick, sem limpar dados. Especificação e allowlist
anteriores ao código: [plano](../architecture/C11_LIVE_SCREEN_AWAKE_FIX.md).
Workspace/top-level/Git próprio C11, main/origin canônicos, HEAD61ec00902be5d0037adf79c68b3a8624b3a2bd6e.
AGENTS, Architecture, Execution, Source Data Boundary e lock lidos; dirty
documental/operacional anterior preservado. CURRENT_GATE=NONE,
NEXT_GATE_STARTED=NAO; nenhum commit/push/PR/backend/outro aparelho/reset.

## Diagnóstico e patch mínimo

AFTSSS/API28 no endereço192.168.3.103:5555: MainActivity em foco, sem proteção
KEEP_SCREEN_ON e mHoldScreenWindow=null durante o diagnóstico anterior;
screen_off_timeout=300000ms, screensaver_enabled=1. VOD já usa proteção em sua
Activity; Live usa a mesma PlayerView na prévia e na expansão fullscreen.

Único arquivo de produção alterado: NativeAndroidPlayerPlugin.java. PlayerView
recebe setKeepScreenOn conforme preview ativo, primeiro plano, playWhenReady,
READY/BUFFERING e ausência de erro/supressão. Listener onEvents lê estado real;
erro/pause/background/release/destroy liberam. Sessão é marcada inativa antes
de callbacks do release; resume/retry voltam à política real. Não há WakeLock,
permissão/dependência nova, proteção global na Home nem ajuste do aparelho.
Mesmo PlayerView/player/mídia/fullscreen/Back; source/C9/ativação/key/catalog/
orientação/UI e flag já existente de VOD não alterados.

Referências primárias para o mecanismo e o listener:
[Android screen-on](https://developer.android.com/develop/background-work/background-tasks/awake/screen-on)
e [Media3 events](https://developer.android.com/media/media3/exoplayer/listening-to-player-events).

## Verificação local

- Lock de ativação49 casos+9 controles negativos PASS antes/depois/prebuild
  e novamente imediatamente antes da entrega; sem backend real.
- Novo teste Java:8 testes, incluindo matriz128 combinações da política e
  transições. Gradle testDebugUnitTest:15 suites/128 testes, zero falhas,
  erros ou skipped; JVM headless, não confirmação física da View.
- Novo guard Node: wiring lifecycle/erro/estado/VOD e8 mutações negativas
  PASS. Controle antes do patch falhou como esperado por método ausente;
  sem modificar ou relaxar critérios anteriores.
- Regressões selecionadas: notice11, C9 wiring10, VOD contract12,
  live/detail/catalog20, bridge retention+4 negativos, backdrop+5 negativos
  PASS. Backdrop é guard estático, não inspeção visual física.
- TypeScript/build Vite414 módulos, cap sync, Gradle assembleDebug PASS.
  Cinco assets web continuam byte-idênticos à baseline e ao APK; dois extras
  Cordova vazios conferidos separadamente. Config standalone/HTTPS sem server.url.
- Antes da cópia do APK:489 arquivos da baseline comparados, apenas plugin
  diferente; arquivos operacionais anteriores permanecem íntegros.
- Auditoria final após entrega:489 arquivos comparados,487 byte-idênticos;
  diferenças somente plugin e APK atual, ambas autorizadas. Cinco assets e
  sete operacionais preservados. Memórias documentais e novos testes/contrato/
  evidência são adicionais previstos na allowlist. diff --check PASS;
  main/HEAD61ec009 e Git próprio unchanged, nenhuma operação de staging/Git.

## Artefato e entrega

APK atual: Xandeflix-v1.0.0-standalone.apk,8.827.394bytes,
SHA256 BC8CA0BDB4F893532CBBE2C7A3E268BA84BC9CC9E03679E61209A08A0873B4D0.
Package com.xandeflix.prebuilt, versionCode1/versionName1.0, min23/target35.
Assinatura v1/v2 válida, mesmo certificado debug SHA256
b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d.
Backup recuperável anterior Xandeflix-v1.0.0-standalone-before-live-screen-awake.apk,
8.785.127bytes/SHA256F58BC34DA5B30ADC1E8C0D443086ACB286BEA47E4E4CEE9D23F261B6808881F8,
conferido antes de substituir o APK atual.

ADB com serial fixo/modelo validado; package congelado somente durante update
e comparação. install -r Success/exit0 SOMENTE AFTSSS; hash do APK instalado
igual ao novo artefato. Cinco arquivos privados e436 arquivos files/prebuilt
byte-idênticos antes/depois, hashes privados mantidos somente em RAM. Sem URL,
token, chave ou fingerprint privado em logs/documentos. firstInstallTime
2026-10-04 13:06:33 preservado; lastUpdateTime2026-10-05 22:55:50 (relógio do
aparelho). screen_off_timeout300000ms e screensaver_enabled1 inalterados.
Tablet SM-X610 conectado NÃO recebeu essa atualização; nenhum outro alvo.

## Limites físicos e falhas auxiliares

Após instalação: MainActivity em foco, mWakefulness=Awake, hold-screen ainda
null na amostra; não estava comprovado um canal reproduzindo nessa amostra.
Portanto não classificar essa primeira amostra como PASS nem como regressão.
Na leitura final, mHoldScreenWindow passou a apontar para
com.xandeflix.prebuilt/com.xandeflix.prebuilt.MainActivity, também em foco:
proteção de janela efetivamente observada no Android físico após a atualização.
Não houve comando de navegação/playback do agente para produzir essa amostra.
Modo inline/fullscreen e duração não certificados pela leitura de janela.
Pedido ao usuário:6 minutos sem controle na prévia e depois6 minutos em fullscreen.
Até resposta, observação além do timeout e confirmação dos dois modos PENDENTES.
Instalação, compilação, guard e política JVM não substituem esse teste físico.

Consultas auxiliares iniciais usaram LiveChannelPlayer.tsx/LivePage.tsx ausentes;
rg identificou LiveTvPage.tsx. Consulta adicional de teste usou nome inexistente
test-c11-native-player-bridge.mjs e retornou MODULE_NOT_FOUND; não contar como
guard válido. Inventário rg encontrou test-c11-native-bridge-retention.mjs,
executado com PASS, assim como live-repair20. Sem patch funcional motivado por
esses erros de consulta. Avisos preexistentes node:fs/path, mixed imports,
chunk grande, flatDir/deprecated API e META-INF/v1 permanecem registrados;
zero warning crypto. Nenhuma reembalagem ou mudança de testes para silenciá-los.
Pendência legada manager-form T15 fora deste escopo, não reexecutada/relaxada.

Registros desta correção são locais; Git não publicado nem novo Gate iniciado.
