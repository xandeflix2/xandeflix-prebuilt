# C11 — Fundo opaco na tela cheia do preview Live

## Autoridade e preflight — 2026-10-04

Usuário mostrou tablet em fullscreen Live com header/rodapé da página vazando
nas faixas fora do vídeo. Continuação corretiva local do ciclo Live,
CURRENT_GATE=NONE; nenhuma retomada de 60s ou próximo Gate.
Preflight: workspace/top-level C:\Xandeflix\xandeflix-prebuilt-c11-main,
origin https://github.com/xandeflix2/xandeflix-prebuilt.git, main/ahead2,
HEAD f0fdb6840c21e7a660f1662f2bbac9f2cd241cba. AGENTS, Architecture, Execution,
Source Data Boundary, Activation Lock e specs lateral/preview/gestos lidos.
401 hashes coincidem exatamente com última entrega ED324AF7...02B5F09.
Dirty conhecido preservado; nenhuma operação Git/backend/reset autorizada.

## Diagnóstico e especificação anteriores ao código

PlayerView nasce com Color.TRANSPARENT e RESIZE_MODE_FIT. Enter atual apenas
expande o mesmo View para MATCH_PARENT; não torna seu fundo opaco. Na imagem
16:10 do tablet com vídeo16:9, as áreas fora do vídeo deixam WebView visível.
FIT/proporção devem permanecer, sem zoom/crop/stretch ou requisição nova.

Patch estrito: no enterPreviewFullscreen válido, dentro de !previewFullscreen,
aplicar previewView.setBackgroundColor(Color.BLACK) antes de expandir layout.
No exitPreviewFullscreenInternal ativo, restaurar Color.TRANSPARENT sempre
que previewView existir, antes de restaurar limites inline. createPreviewView
e demais métodos continuam byte-idênticos; nenhum novo estado/player/Activity,
MediaItem/URI/session/source/listener/IPC/JSX/CSS ou dependência.
Back/release já passam pelo mesmo exit, preservando cleanup. Fullscreen Live
compartilhado nos aparelhos recebe opacidade; inline/telefone/VOD não mudam.

## Allowlist estrita

- android/app/src/main/java/com/xandeflix/prebuilt/player/NativeAndroidPlayerPlugin.java:
  somente dois setters descritos e guarda null no exit, nada além.
- Novo scripts/test-c11-live-fullscreen-backdrop.mjs: guard estático dos
  call sites/ordem/FIT/MATCH_PARENT/restauração, com negativos em memória.
  Não alegar teste Android visual a partir do guard de fonte.
- Este contrato; referência em C11_LIVE_FULLSCREEN_GESTURES.md; evidência
  docs/evidence/C11_LIVE_FULLSCREEN_OPAQUE_BACKDROP.md; STATUS,
  EVOLUTION_REPORT e ERRORS_AND_BLOCKERS. Contrato de ativação intacto.
- Saídas normais npm build/cap sync/Gradle/APK e novo backup recuperável
  Xandeflix-v1.0.0-standalone-before-live-fullscreen-backdrop.apk,
  SHA-256 ED324AF7D1528A1F9E7442AA0E3AC4655BD653E77E9176E1971E9E85102B5F09.
- Probes efêmeros/relatórios sanitizados próprios em tmp/c11-side-navigation.

## Aceitação e entrega

Lock antes/depois/prebuild, novo guard com controles negativos, guards
C9/VOD/Live/notice/bridge e Java existentes PASS. Matriz browser58 e
interações24 sem alterar fixtures/expectativas; CLI agent-browser indisponível,
fallback Chrome/CDP isolado/gut-check imediato pelas skills de verificação.
História: canal ativo/tap -> handler existente -> expansão opaca do MESMO
PlayerView -> Back restaura inline/transparência; nenhuma API/env/data nova.
Provar remover somente setters/guarda novos recupera arquivo nativo anterior,
e demais401 hashes fora da allowlist permanecem byte-idênticos.

Build/assinatura/package/assets antes de entrega. Continuação da instalação
autorizada Fire AFTSSS192.168.3.104:5555 PRIMEIRO, Samsung SM-X610 RX2X301Q3KY
DEPOIS, somente install-r com.xandeflix.prebuilt, mesma assinatura. Comparar
quatro privados e árvore files/prebuilt antes/depois somente em RAM, publicar
apenas igualdade/contagem e hash público de base.apk. Nenhum clear/uninstall,
gestor, rotação de chave, orientação persistente ou outros alvos.

Probes físicos podem entrar em Canais e confirmar somente canal ativo já em
exibição/tap tablet, Back; não escolher canal/grupo/fonte novo. Captura nativa
transitória somente em RAM; nenhuma imagem integral de vídeo é gravada ou
exibida. Se UI hierarchy fornecer bounds da SurfaceView atual, pode recortar
e gravar apenas faixa externa superior/inferior FORA desses bounds, para
comprovar fundo preto onde vazava página. Nunca usar coordenadas presumidas
que possam incluir mídia. XML nativo/console/rede/IDs/URLs/chaves não publicados.
Se bounds/captura seguros indisponíveis, registrar limite e não alegar
confirmação visual completa. DOM booleans/Back/PID/layout e previews continuam
válidos; nenhuma promessa universal de codec/reprodução/estabilidade.

Referências primárias: View.setBackgroundColor
https://developer.android.com/reference/android/view/View
e AspectRatioFrameLayout.RESIZE_MODE_FIT
https://developer.android.com/reference/androidx/media3/ui/AspectRatioFrameLayout .
