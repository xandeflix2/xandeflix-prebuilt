# C11 — Tela ativa durante reprodução Live — 2026-10-05

## Autoridade e diagnóstico

Usuário confirmou descanso tanto na prévia de canais quanto em sua tela cheia,
e autorizou corrigir, gerar APK e instalar SOMENTE no Fire Stick sem limpar.
Preflight C11/main/HEAD61ec009/origin canônico, Git próprio; AGENTS, Architecture,
Execution, Source Data Boundary e lock de ativação lidos. Dirty conhecido:
memórias documentais das entregas, quatro planos/evidências locais e sete
operacionais preservados. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.
Nenhum commit/push/PR, backend, outro aparelho, reset ou rotação autorizado.

Diagnóstico em leitura: AFTSSS/192.168.3.103:5555 executa APKF58BC34D...;
MainActivity em foco sem KEEP_SCREEN_ON, mHoldScreenWindow=null, timeout300000ms,
screensaver_enabled=1. NativePlayerActivity de VOD já possui a proteção, mas
Live fullscreen reutiliza o PlayerView inline na MainActivity. O plugin de
preview não gerencia proteção de tela; não aplicar proteção global na Home.

## Comportamento aprovado

1. Política pura: manter tela ativa somente com preview ativo, app em primeiro
   plano, playWhenReady=true, sem erro/supressão e estado READY ou BUFFERING.
2. Aplicar setKeepScreenOn ao próprio PlayerView e atualizar após eventos Media3;
   não adquirir WakeLock de CPU nem adicionar permissões/dependências.
3. Mesma View na prévia e fullscreen mantém a proteção ao expandir/voltar,
   sem recriar player, MediaItem, transporte, sessão C9 ou fluxo de autorização.
4. Pause/background, erro terminal, IDLE/ENDED, stop/release/destroy liberam;
   resume/retry/troca de canal válido readquirem pelo estado real do player.
   Release deve marcar sessão inativa antes dos callbacks de stop/release.
5. Preservar orientação, gestos, foco, proporção FIT, controles, source/session,
   ativação/chave/catálogo, VOD e armazenamento. Não mudar configurações globais
   de descanso/sleep/screensaver do aparelho nem mascarar falhas do player.

## Allowlist estrita

- android/app/src/main/java/com/xandeflix/prebuilt/player/NativeAndroidPlayerPlugin.java:
  somente política e gerenciamento lifecycle da tela do preview.
- android/app/src/test/java/com/xandeflix/prebuilt/player/NativeLiveScreenAwakeTest.java:
  política pura e transições; nenhuma rede/credencial real.
- scripts/test-c11-live-screen-awake.mjs: wiring estático e controles negativos;
  preservar todas as suites e critérios anteriores.
- Este plano, docs/evidence/C11_LIVE_SCREEN_AWAKE_FIX.md, STATUS/EVOLUTION/ERRORS.
- Outputs usuais web/cap/Gradle, APK raiz e backup recuperável novo
  Xandeflix-v1.0.0-standalone-before-live-screen-awake.apk do APKF58BC34D...
  (8.785.127bytes); não sobrescrever backup divergente.
- Cache/artefatos sintéticos transitórios em tmp/c11-live-screen-awake-20261005/.

## Aceitação e entrega

Lock49+9 antes/depois/prebuild/entrega; testes novos Java e wiring/negativos,
regressões Java existentes, playback/error/C9/Live/bridge PASS. Build web,
cap sync, Gradle assembleDebug; config/package/assinatura/assets conferidos.
Cinco assets web e código fora do plugin/testes novos devem ficar byte-idênticos.
Não relaxar testes nem classificar JVM headless como teste Android físico.

Update -r somente Fire Stick AFTSSS/192.168.3.103:5555 com serial fixo, mesmo
package/certificado. Congelar package somente durante comparação/install;
cinco privados e files/prebuilt comparados antes/depois em RAM, sem conteúdo,
URL, token, chave ou digest privado em docs/logs. Exigir Success/exit0, hash do
APK instalado e firstInstallTime preservado. Sem uninstall/clear/downgrade/root.
Verificação física pode abrir app normalmente e confirmar SOMENTE o canal ativo
já em exibição, preview/fullscreen/Back e hold-screen por atributos sanitizados;
nenhum novo conteúdo/fonte/painel ou alteração persistente do aparelho.
Observação além de cinco minutos depende de vídeo ativo e usuário não tocar
no controle; registrar limites, não antecipar PASS físico pela compilação.

Referência primária: https://developer.android.com/develop/background-work/background-tasks/awake/screen-on
Esta autorização sucede apenas a restrição de manter plugin/build/APK intactos
dos ciclos anteriores; invariantes do lock e Source Data Boundary não mudam.
