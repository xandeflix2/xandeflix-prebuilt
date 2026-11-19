# XANDEFLIX-APP-INTRO-BRANDING-07 — especificação antes do código

Gate nominal autorizado em26/10/2026. Somente implementação local, recursos, testes/web build e compilação nativa de testes. Sem APK instalável/assemble/package/bundle de distribuição, instalação, operações em aparelhos, publicação Git/deploy/backend. Nenhuma mudança em trailer/retorno/FPS/rede/C9/autoridade. As falhas06 continuam abertas. Nenhum04 incorporado.

Base integral: physical-validation-06-20261025/workspace (1439 arquivos,37 recibos,924 protegidos), fonte funcional03. CLOSURE/manifests/artefatos03/04/05/06 e root verificados e congelados. Clone independente com overlay integral, sem reconstruir da main incompleta. Origin canônico, HEADd8a74102124fbb8a3f013f6fd8a502519c1db4b8, branch fix/source-output-format-recovery, root mainb3fc8d1;10 diferenças L1 preservadas. Pasta histórica somente leitura. Não normalizar estados ou recibos.

## Recursos e autoridade

Vídeos originais conferem76fb4e…(vertical) e41741f8…(horizontal),8s declarados; integrar bytes exatos em res/raw, sem cortar/reencode. Auditoria MP4 independente verificará dimensões/duração/codec/amostras/áudio; não confundir metadata com decoder físico. O PNG anexado cf422e99… difere do1de24356… descrito na ordem. Após esclarecimento, o usuário determinou literalmente “preciso que use a ogo anexada”; essa instrução mais recente substitui a escolha anterior. Fonte efetiva cf422e99…, original preservado em drawable-nodpi/intro_brand.png. Derivados determinísticos por recorte técnico do símbolo/escala contain/mascara, sem geração por IA/redesenho/retoque de marca. Nova sidebar NÃO alterada. Manifesto com crop, dimensões e hashes de cada derivado.

## Arquitetura e estados

MainActivity/Capacitor7 preservados, sem segunda Activity. Um AppIntroController nativo possui um PlayerView/SurfaceView local e um ExoPlayer Media3 1.5.1, dependência já existente. Não usa PublicTrailerPlugin nem qualquer player/C9 do catálogo. Bridge criado pelo caminho original do Capacitor; sem override de load e sem simular onStart/onResume do bridge. Index aponta a um entry mínimo intro-main.ts que espera AppIntro.ready antes de importar uma única vez main.tsx INALTERADO. CSS original carregado no prelude e WebView com fundo preto evitam flash branco. Não montar React nem iniciar bootstrap/autenticação/catálogo atrás da intro. Web e entradas públicas existentes continuam sem vídeo Android; falha/ausência/timeout da ponte nunca bloqueia a importação normal.

Mermaid:

    launcher frio elegível → WAITING → PREPARING → PLAYING → FINISHED → entrada web original
                                         ↓           ↓
                              erro/timeout/memória/lifecycle/skip → liberar → estática → entrada web original
    deep link/restauração/processo vivo → FINISHED inelegível → entrada original sem intro

Admissão explícita única em RAM por processo para a primeira criação lógica da MainActivity: ACTION_MAIN + LAUNCHER/LEANBACK_LAUNCHER, sem URI e savedInstanceState ausente. Qualquer primeiro ingresso não elegível consome a decisão, impedindo replay posterior no processo. Sem persistência ligada a auth/home. onNewIntent nunca reinicia. saved state/restauração e Activity recriada não repetem. Um processo futuro frio permite nova intro. Serviços sem UI não criam player; não afirmar medição de cold-process a partir de metadados locais.

Escolha no primeiro layout visível da área real: TV/Leanback por capabilities usa horizontal; janela retrato usa vertical, paisagem/quadrada horizontal. Nenhum modelo comercial. Escolha fica congelada na sessão. Rotações/redimensionamentos ajustam contain/fit mantendo posição, sem segundo player ou alternar recursos. PhoneUiOrientation original é adiada somente enquanto intro ativa, restaurada ao final. Demais layouts/perfis e rotas originais permanecem.

Iniciar prepare somente em onResume/área pronta. Primeiro quadro via onRenderedFirstFrame; fim normal somente STATE_ENDED. Deadline primeiro quadro4s (mídia local, não há espera de rede); teto total13s =4s preparação+8s mídia+1s de entrega de evento, terminando só em falha se exceder. Não truncar vídeo normal por timer8s. Fallback estático250ms no foreground, imediato se lifecycle inviável. Pressão de memória do ActivityManager ou trim encerra/evita player. Liberação idempotente: callbacks próprios, playerView.player=null, release do ExoPlayer, itens/surface/decoder/áudio/foco, overlay removido, um único resultado. Nenhum timer permanente.

Áudio original sem modificar volume do SO: somente ringer normal, volume de mídia>0 e nenhuma música externa ativa; request transitório MAY_DUCK enquanto Activity resumed. Negado/erro/perda de foco/música ativa → reprodução silenciosa restante, sem roubar/retomar foco. Media3 handleAudioFocus=false porque o controller mantém esse lease explícito e o abandona na liberação. Uma única trilha/player. Background/onPause/onStop/onDestroy cancelam e liberam, sem replay no retorno; confirmação de som/decoder físico pendente.

Pular: botão acessível “Pular introdução” no canto inferior com insets seguros; Enter/DPAD_CENTER/NUMPAD_ENTER/Back, keydown e keyup/repeat consumidos até soltar a tecla. Back dispatcher AndroidX exclusivo durante intro; depois removido e comportamento anterior intacto. Nenhuma confirmação, finish da Activity, navegação forçada à Home ou propagação da tecla à tela seguinte. A ponte entrega apenas motivo técnico, sem aceitar URI/credenciais/conteúdo.

## Identidade e recursos

Gerar legacy/round/foreground por densidade, símbolo XF na zona segura circular do adaptive icon (diagonal do conteúdo≤64dp no canvas108dp). Fundo preto; monochrome separado para máscara Android13. Banner Leanback320×180 com símbolo e nome completo. Splashs mantêm dimensões existentes com contain da composição completa e fundo preto; Theme.SplashScreen usa preto/postSplashScreenTheme e ícone nativo, nunca MP4 no recurso da splash. installSplashScreen antes de super.onCreate. PNG oficial original intocado, hashes separados dos derivados. Package/manifest/versão/dependências/assinatura/backup intactos.

## Testes e aceite

Antes de produto: fresh canon:check, canon:test, C11. Testes Java reais da política usada pelo controller: orientações Phone/Tablet/TV, entrada fria/restauração/deep link/warm, rotação sem duplicação, fim/skip/erros/timeouts/lifecycle/memória idempotentes, barreira de tecla e áudio permitido/negado. Integração Node/TS real da porta de entrada: aguarda nativo, web imediato, timeout/falha/reentrada, cancelamento e importação única; original main.tsx/players/auth/catalog byte-identical; símbolos/PNG/MP4 e XML válidos. Registrar suíte nova no runner canônico, preservar196 controles/33 suítes; acrescentar negativos para ausência/tamper de intro/ativos, sem alterar verificadores/negativos antigos. Grants novos com predecessores reais e hashes LF/binários antes/depois;37 recibos antigos congelados.

Após código congelado: canon:check/test/C11, typecheck, update/security/playback checks, build web, site:build/contratos de artefato quando pertinente ao index, Gradle --offline testDebugUnitTest somente, sem assemble/package/install. Revalidar CANON/C11 após tarefas. Logs com exit codes, erros intermediários preservados, nenhuma assertion removida/timeout ampliado para PASS. Inspecionar montagem técnica dos recursos e previews derivados. Física/CPU/PSS/primeiro quadro/splash/primeira tela/catalogo sem APK novo ficam PENDENTES, não fabricar números; medir tamanho byte-a-byte e delta de assets/build local. Plano para teste futuro em AFTSS/SM-S926B/SM-X610/outraTV, offline, skip, áudio, lifecycle e recursos. Rollback local preserva baseline06 e APK03; não executar rollback físico. Resultado esperado só após todos testes locais aprovados, sem blocker; NEXT_GATE_STARTED=NAO.

Fontes primárias consultadas: [splash Android](https://developer.android.com/develop/ui/views/launch/splash-screen/migrate), [lifecycle Media3](https://developer.android.com/media/implement/playback-app), [audio focus](https://developer.android.com/media/optimize/audio-focus), [eventos do player](https://developer.android.com/media/media3/exoplayer/listening-to-player-events). APIs compiladas contra Media31.5.1 existente; não adotar versão nova da documentação. BridgeActivity do Capacitor7 foi inspecionada localmente.

## Addendum de compatibilidade do controle negativo de orientação

A regressão final identificou que o negativo antigo ui-landscape substitui a primeira ocorrência textual de applyPhoneUiOrientation(this, false). O novo método completeAppIntro precedia onCreate e passou a interceptar essa mutação, deixando a chamada que o teste verifica intacta. Antes da correção, define-se somente reposicionar completeAppIntro depois de onCreate, com o corpo e comportamento preservados. O teste legado, suas assertions e os cinco negativos ficam byte a byte intactos. Revalidar o teste isolado e toda a regressão, atualizando apenas o grant atual de MainActivity no recibo38. A primeira rodada falha permanece registrada.

## Allowlist fechada

- android/app/src/main/java/com/xandeflix/prebuilt/MainActivity.java
- android/app/src/main/java/com/xandeflix/prebuilt/intro/AppIntroPolicy.java
- android/app/src/main/java/com/xandeflix/prebuilt/intro/AppIntroController.java
- android/app/src/main/java/com/xandeflix/prebuilt/intro/AppIntroPlugin.java
- src/intro-main.ts
- src/bootstrap/app-intro-gate.ts
- index.html
- android/app/src/main/res/layout/app_intro.xml
- android/app/src/main/res/values/styles.xml
- android/app/src/main/res/values/strings.xml
- android/app/src/main/res/raw/intro_vertical.mp4
- android/app/src/main/res/raw/intro_horizontal.mp4
- android/app/src/main/res/drawable-nodpi/intro_brand.png
- android/app/src/main/res/drawable-nodpi/intro_monochrome.png
- android/app/src/main/res/drawable/ic_launcher_background.xml
- android/app/src/main/res/drawable/splash.png
- android/app/src/main/res/drawable-land-hdpi/splash.png
- android/app/src/main/res/drawable-land-mdpi/splash.png
- android/app/src/main/res/drawable-land-xhdpi/splash.png
- android/app/src/main/res/drawable-land-xxhdpi/splash.png
- android/app/src/main/res/drawable-land-xxxhdpi/splash.png
- android/app/src/main/res/drawable-port-hdpi/splash.png
- android/app/src/main/res/drawable-port-mdpi/splash.png
- android/app/src/main/res/drawable-port-xhdpi/splash.png
- android/app/src/main/res/drawable-port-xxhdpi/splash.png
- android/app/src/main/res/drawable-port-xxxhdpi/splash.png
- android/app/src/main/res/drawable-v24/ic_launcher_foreground.xml
- android/app/src/main/res/drawable-xhdpi/xandeflix_tv_banner.png
- android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml
- android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml
- android/app/src/main/res/mipmap-anydpi-v33/ic_launcher.xml
- android/app/src/main/res/mipmap-anydpi-v33/ic_launcher_round.xml
- android/app/src/main/res/mipmap-hdpi/ic_launcher.png
- android/app/src/main/res/mipmap-hdpi/ic_launcher_foreground.png
- android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png
- android/app/src/main/res/mipmap-mdpi/ic_launcher.png
- android/app/src/main/res/mipmap-mdpi/ic_launcher_foreground.png
- android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png
- android/app/src/main/res/mipmap-television-xhdpi/ic_launcher.png
- android/app/src/main/res/mipmap-television-xhdpi/ic_launcher_round.png
- android/app/src/main/res/mipmap-xhdpi/ic_launcher.png
- android/app/src/main/res/mipmap-xhdpi/ic_launcher_foreground.png
- android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png
- android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png
- android/app/src/main/res/mipmap-xxhdpi/ic_launcher_foreground.png
- android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png
- android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png
- android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png
- android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png
- android/app/src/main/res/values/ic_launcher_background.xml
- scripts/test-app-intro-branding-07.mjs
- scripts/test-canonical-regression.mjs
- android/app/src/test/java/com/xandeflix/prebuilt/intro/AppIntroPolicyTest.java
- docs/architecture/XANDEFLIX_APP_INTRO_BRANDING_07.md
- docs/evidence/XANDEFLIX_APP_INTRO_BRANDING_07.md
- docs/governance/authorizations/CANON-01-XANDEFLIX-APP-INTRO-BRANDING-07.json
- docs/architecture/XANDEFLIX_PREBUILT_PHASED_EXPANSION.md
- docs/STATUS.md
- docs/EVOLUTION_REPORT.md
- docs/ERRORS_AND_BLOCKERS.md

Autorização UTF8/LF SHA256 43b7e53495291945e38729cb514547bfedd214509dc3bd32c8fa001cbd6a42f2. Última escolha de PNG em ASSET_AUTHORITY_ADDENDUM.json. Novos grants cobrem somente o delta efetivo; quatro documentos normativos append-only.


## Addendum de áudio antes do refinamento

# Addendum07 anterior ao refinamento de áudio

Quando o som não for permitido, desabilitar a faixa de áudio no mesmo ExoPlayer, além de volume0; isso evita alocar um decoder AAC desnecessário. Se uma falha for identificada inequivocamente pelo Media3 como renderer de áudio, permitir uma única tentativa silenciosa no mesmo player/posição, sem seek, novo player, alteração de mídia ou reinício dos deadlines. Outra falha segue o fallback estático terminal. A política usada pelo controller limita essa tentativa e é coberta por teste JVM. Sem alteração de dependências ou de players do catálogo.


## Emenda posterior — APK de teste autorizado ao final

# Emenda nominal — APK de teste ao final do gate07

Data do usuário:26/10/2026, America/Sao_Paulo. Instrução expressa posterior, literal:

> AO FINAL GERE O APK PARA TESTE NOS DISPOSITIVOS

Autoriza gerar e auditar APK de teste depois da implementação e verificações locais deste mesmo gate. Substitui apenas a proibição anterior de geração de APK/assemble para o artefato de teste. Não autoriza instalação, desinstalação, clear/reset/reboot, publicação/deploy/Git/backend, mudança de versão/package/assinatura/autoridade ou novo gate. Preservar os aparelhos e os ciclos03/04/05/06.

Procedimento após checks locais: fresh C11; build web válido, cap copy Android oficial, registry oficial dos mesmos plugins públicos instalados, Gradle offline assembleDebug com package/code37/name1.0.37/assinatura existentes. Auditar assinatura/package/versão/assets/recursos/bundle e SHA256; conferir ausência04, integridade dos dois MP4s e PNG original, presença das classes da intro, recursos de ícones/splash/Leanback e exclusões de backup. Comparar certificado do APK03 conhecido. Registrar o binário final distinguido pelo SHA256, sem instalar em nenhum alvo.

NEXT_GATE_STARTED=NAO.



## XANDEFLIX-APP-INTRO-BRANDING-07 — fechamento local — 2026-10-26

RESULT=APP_INTRO_BRANDING_07_LOCAL_VALIDATED_PHYSICAL_PENDING. Emenda posterior autoriza APK de teste, não instalação. APK SHA256 734e6ca9b89c8639d1e45d70caf81bf4c6fcbd2611278a163ca00431ef5c9ac2, package com.xandeflix.prebuilt/code37/name1.0.37/certificado b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d. CANON201 controles34 suítes/936 protegidos38 recibos;257 testes Android39 suítes e13 casos intro PASS.13 checks oficiais/assemble/auditoria PASS. Primeiro canon:test final falhou por interceptação textual do negativo antigo de orientação; reposicionamento do método sem mudar comportamento preservou o teste, repetido integralmente com PASS. Originais MP4/PNG e37 recibos preservados;03/04/05/06/root congelados. Classes04 ausentes; FAILs06 abertos. Relatório C:/Xandeflix/xandeflix-prebuilt-c11-main/tmp/app-intro-branding-07-20261026/REPORT.md; nenhuma instalação/operação de aparelho/publicação/Git/backend. Física pendente; NEXT_GATE_STARTED=NAO.
