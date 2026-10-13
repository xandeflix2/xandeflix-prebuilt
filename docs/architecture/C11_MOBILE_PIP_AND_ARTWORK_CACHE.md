# C11 — PiP e cache de imagens local — 2026-10-06

Especificação anterior ao código. Refinamento expresso do usuário: continuar
vídeos em PiP ao abrir outro aplicativo em celulares/tablets e reutilizar
imagens já carregadas. Ciclo corretivo local C11, CURRENT_GATE=NONE,
NEXT_GATE_STARTED=NAO. Preflight/HEAD/origin/dirty/proveniência iguais ao ciclo
C11_HOME_HERO_VISIBLE_FIX; activation lock inicial obrigatório. Git, backend,
source/cofre, identidade, ativação e reset continuam fora do escopo.

## PiP

- Android API26+ com FEATURE_PICTURE_IN_PICTURE, somente não-TV. MinSDK23
  preservado. Player de filmes/episódios entra ao sair para outro aplicativo
  apenas se reprodução solicitada e READY/BUFFERING, sem erro/finalização.
- Activity nativa e MainActivity (preview Live) declaram supportsPictureInPicture
  e smallestScreenSize. Android12+ autoEnter; 8–11 onUserLeaveHint. View real
  como sourceRectHint; proporção vídeo limitada ao intervalo Android.
- PiP não pausa/para player; retorno restaura controles. Pausa, fim, erro,
  BACK/fechamento e revogação desabilitam autoEnter. Destruição libera player.
- Live promove o mesmo preview para fullscreen, oculta WebView em PiP e restaura
  layout ao retornar; não cria outro player/source/sessão. Não entra em páginas
  sem reprodução ativa, nem Fire/TV. onPause fora de PiP conserva comportamento.
- C9 continua autoridade e heartbeat/revogação intactos. A camada nativa recebe
  ordem de parada por revogação. Sem playback offline/stale nem keepalive que
  invente autorização. PiP depende da permissão do Android; não usar overlay.

## Cache local de artwork

- Plugin Android opcional/lazy; getCacheDir/artwork-v1, nunca source storage,
  catálogo/índice/cofre/WebView Data. Só bytes de imagens, nomes SHA256 da URI,
  sem URL/headers/credenciais em índice, filename, logs ou documentação.
- Download nativo limitado a duas imagens, GET http(s) somente, timeout10s,
  máximo8MiB/imagem, validação BitmapFactory bounds antes de promoção atômica.
- Cache até150MiB/1000 imagens, LRU por acesso, validade30dias desde download,
  poda ao gravar; arquivos .part removidos após falha. Cache descartável pelo SO.
- UI usa arquivo local convertido pelo Capacitor e fallback URL se erro. Sem
  download geral do catálogo. Somente imagens visíveis/preload limitado atual;
  manter source-first/TMDB fallback e validar orientação/decodificação do hero.
- Imagem de URL nova gera chave nova; vencimento renova. Cache nunca transforma
  imagem indisponível em hero elegível. Web mantém cache HTTP nativo do navegador.

## Allowlist e aceitação

android/app/src/main/AndroidManifest.xml; MainActivity.java;
player/{NativePlayerActivity,NativeAndroidPlayerPlugin,MobilePipPolicy,MobilePipController}.java;
artwork/{ArtworkCachePlugin,ArtworkDiskCache}.java;
android/app/src/test/java/com/xandeflix/prebuilt/{player,artwork}/*Test.java;
src/artwork/{artwork-file-cache,image-load-queue}.ts;
src/ui/{hooks/useCachedArtwork,components/Artwork,components/Hero}.tsx/ts;
src/playback/native-android-player.bridge.ts; src/playback/playback.service.ts;
este plano; docs/evidence/C11_MOBILE_PIP_AND_ARTWORK_CACHE.md; acréscimos nos
quatro arquivos de memória; saídas usuais build/APK/tmp ignorados.

Testes policy API/perfil/estado/finalização, cache hit após recriar serviço sem
Harness SSR anterior: somente resolver imports useCachedArtwork/CastButton
para perfil web, sem editar suas asserções nem simular cache Android como prova.
novo download, TTL, LRU bytes/quantidade, falha/arquivo parcial e nenhuma URL
persistida. Suites anteriores/tsc/build/activation lock/Gradle obrigatórios.
Validação física PiP depende de reprodução autorizada existente; não semear
source/playback pelo debugger. Atualização -r nos três alvos já autorizados,
mesmo package/certificado, árvores privadas/firstInstallTime comparados em RAM.

Fonte primária PiP: https://developer.android.com/develop/ui/views/picture-in-picture
