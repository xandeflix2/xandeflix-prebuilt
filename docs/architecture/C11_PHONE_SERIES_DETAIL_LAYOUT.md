# C11 — detalhe de série no celular — 2026-10-06

Especificação anterior ao código. Pedido explícito do usuário, confirmado:
**somente celulares**. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.
O pedido posterior de investigar busca→fechamento no Fire será executado
depois deste ciclo de apresentação. Diagnóstico read-only pode coletar falhas.

## Preflight e proveniência

Workspace/top-level C:\Xandeflix\xandeflix-prebuilt-c11-main; clone independente;
origin https://github.com/xandeflix2/xandeflix-prebuilt.git; main; HEAD
61ec00902be5d0037adf79c68b3a8624b3a2bd6e. AGENTS, Architecture/Execution,
Source Data Boundary e lock C11 lidos. Auditoria anterior:575 arquivos,
79 alterações autorizadas, zero divergências e quatro prefixos de memória
preservados. Novo baseline congela esse estado antes deste patch.
Lock antes do ciclo:22+27 cenários e9 controles negativos PASS.
Sem Git, backend, reset, nova identidade, escrita em 2.0/pasta histórica.

## Comportamento autorizado

- Apenas perfil phone usa novo layout; tablet/TV/desktop mantêm apresentação.
- No topo, mini player 16:9 com altura mínima200px. Trailer público associado
  à série via TMDB, preferindo Trailer oficial pt, depois en, depois outros
  trailers. Aceitar somente YouTube com ID11 caracteres allowlisted.
  Não extrair streams YouTube nem substituir player autorizado de episódios.
  Carregar player somente ao tocar; sem autoplay ao abrir página. Sem trailer
  confirmado, mostrar capa horizontal e mensagem honesta, não trailer alheio.
- Android usa WebView dedicado sem interface JS privilegiada, HTML local com
  loadDataWithBaseURL https://com.xandeflix.prebuilt/ para identidade/referrer
  exigido pelo embed oficial. Enviar somente ID público e bounds. Pausar/ocultar
  fora da viewport/ao sair/background; destruir ao desmontar. Sem vídeo em disco,
  transporte da fonte, C9 extra, proxy ou mudança de scheme do app.
  Web usa iframe oficial após toque. Erro/indisponibilidade mostra alternativa
  pública Abrir no YouTube; sem alegar reprodução física a partir de mocks.
  Antes de iniciar por toque, alinhar o mini player abaixo do header; abertura
  nativa exige bounds inicialmente visíveis, evitando autoplay invisível se o
  frame estiver parcialmente encoberto. Scroll posterior continua pausando.
- Abaixo: título; ano; quantidade de episódios disponíveis na fonte quando
  resolvidos (total TMDB explicitamente rotulado enquanto aguarda, sem falso0);
  classificação brasileira BR (L/10/12/14/16/18; ausente = não informada);
  duração por episódio local ou TMDB; gênero/categoria; sinopse.
- Ações: Assistir (primeiro episódio da temporada escolhida, mesmo PlaybackService
  e C9), Voltar e Cast existente. Início permanece acessível no header.
- Faixa destacada: Avaliar (Não gostei/Gostei/Adorei/limpar), Favoritos
  (toggle), Compartilhar (sheet nativo oficial ou Web Share/cópia).
  Avaliação/favoritos exclusivamente locais/versionados, até256 registros/64KiB,
  chave por fingerprint da obra, nunca source URL/credenciais. Falha de storage
  conserva RAM. Share só título e link público TMDB se conhecido; nenhuma fonte,
  episodeId/URL/token/arquivo privado. Não envia automaticamente a terceiros.
- Abas acessíveis Episódios (padrão) e Títulos semelhantes. Só painel ativo
  apresentado. Temporadas/episódios continuam no resolver local existente,
  lista sem imagens. Semelhantes mantêm limite20 da seleção atual, grade de
  duas colunas, sem carrossel; carregados apenas ao abrir a aba no phone.
- Metadados extras opcionais sob demanda, RAM LRU64/TTL6h, deduplicação,
  até2 requests ativas/32 pendentes/timeout8s e falhas sem cache negativo longo.
  Nenhuma consulta extras no boot/tablet/Fire. Correspondência usa serviço
  TMDB existente antes de requisitar extras; não inventar identidade/ano/rating.

## Allowlist estrita

Este plano/evidência C11_PHONE_SERIES_DETAIL_LAYOUT; acréscimos em
docs/{DECISIONS,STATUS,EVOLUTION_REPORT,ERRORS_AND_BLOCKERS}.md e adendo no
relatório C11_OPTIMIZATION_REPORT_20261006.md, preservando entrega anterior.
src/ui/pages/SeriesDetailPage.tsx; src/ui/components/{RelatedTitles,
PhoneSeriesDetail,SeriesTrailer,SeriesPersonalActions}.tsx; src/index.css;
src/ui/hooks/usePhoneLayout.ts; src/artwork/series-presentation.service.ts;
src/ui/series-personal.store.ts; src/ui/share-series.ts;
src/playback/public-trailer.bridge.ts. @capacitor/share7.0.4 em package.json/
package-lock.json e saídas Capacitor Android geradas por sync.
android/app/src/main/java/com/xandeflix/prebuilt/MainActivity.java somente
registro plugin; trailer/{PublicTrailerPlugin,PublicTrailerPolicy}.java;
android/app/src/test/java/com/xandeflix/prebuilt/trailer/PublicTrailerPolicyTest.java.
scripts/test-c11-phone-series-detail.mjs; somente resolução de imports novos
nos harnesses SSR anteriores, sem relaxar seus asserts. tmp/build/APK ignorados.
Native Media3/C9/source/import/search/contratos de catálogo permanecem fora.

## Aceitação e entrega

Teste funcional de TMDB: trailer/rating BR/runtime/ausências/ID malicioso,
dedup/quota/timeout. Preferências persistentes/limites/storage negado; share
sem segredos. Browser: ordem de blocos, abas, grade2, lista sem img, Assistir
episódio correto, favoritos/avaliação/compartilhar/trailer lifecycle.
Comparar tablet/TV e suíte anterior; revisão React, typecheck/build/lock,
Java, APK/package/certificado/standalone. APK recuperável para entrega
acumulada, install-r autorizado sem reset nos alvos previamente autorizados
quando conectados. Diagnóstico Fire tem precedência sobre entrega final.

Referências: [TMDB detalhes](https://developer.themoviedb.org/reference/tv-series-details),
[vídeos](https://developer.themoviedb.org/reference/tv-series-videos),
[ratings](https://developer.themoviedb.org/reference/tv-series-content-ratings),
[YouTube identificação WebView](https://developers.google.com/youtube/terms/required-minimum-functionality),
[Share Capacitor7](https://capacitorjs.com/docs/v7/apis/share).
