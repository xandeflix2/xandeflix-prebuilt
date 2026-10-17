# C125 — gêneros e semelhantes — 2026-10-16

Pedido/spec: [C11_CONTENT_GENRES_AND_RELATED_TITLES](../architecture/C11_CONTENT_GENRES_AND_RELATED_TITLES.md).
Preflight no clone independente C11-main/main/origin esperado; HEAD
0f68f169f7728fae17c8311832b7643629e97a02. Baseline1068 arquivos privados.
C124 fechado com audit PASS antes da especificação C125. AGENTS/Architecture/
Execution/Source Boundary/Activation Lock lidos. Sem operações Git de escrita,
backend, instalação, reset ou novo Gate. Provenance anterior preservada.

## Causa e correção

MediaCard imprimia genreLabels=['Geral'] sem enriquecimento. Hero ignorava
Geral apenas em Fire; o CSS mobile escondia hero-genres. Cards compactos TV
também ocultavam a segunda linha. RelatedTitles pontuava IDs de gênero Geral
e categoria como se fossem semelhança real, sem usar o overlay dos detalhes.

- Cards: filtro C121 compartilhado, fallback/cache TMDB existente, apenas
  após300ms efetivamente visíveis. Metadata usa mesma identidade/queue limitada2,
  matching conservador e persistência local existentes. Fonte real mantém
  prioridade; sem metadata confiável não exibe Geral/categoria como gênero.
- Hero: mesma regra para todos os perfis, inclusive vertical mobile; gêneros
  visíveis no CSS. Cards TV mantêm poster165px e ganham14px na área de texto
  para segunda linha. Sem mexer em foco, gesto, player, episódios ou tamanhohero.
- Semelhantes: contexto opcional de gêneros reais no seletor local; a UI sempre
  o fornece. Categoria isolada e Geral não pontuam. Dedup/current/adult/limit20,
  gênero real local/cache e overlay de metadata pública para candidato validado.
  Nenhuma mutação do catálogo/readModel. API antiga sem contexto foi preservada
  para compatibilidade; não é usada pela UI de semelhantes.
- Complemento TMDB similar por ID público já validado, três páginas/60 descritores,
  dicionário por kind, fila serial, máximo8 pendentes/cache64 em RAM/30min,
  timeout6s/cooldown/dedup. Recebe apenas kind/ID público; sem catálogo, fonte,
  segredo ou URL de mídia. Matching exato de ID, ou títulos/ano/poster com matcher
  existente; apenas interseção com entidades locais, nunca títulos remotos novos.
  O [endpoint de filmes](https://developer.themoviedb.org/reference/movie-similar)
  relaciona gêneros e palavras-chave; séries usam o
  [endpoint correspondente](https://developer.themoviedb.org/reference/tv-series-similar).
- Leitura local por segmentos com yield/abort/snapshot/pointer, reter20; estado
  de carregamento antes do resultado e erro/retry em falha de leitura/gênero
  da referência. Troca de título/geração não entrega seleção antiga.

A lista não pretende ser exaustiva: somente gêneros locais/cache e até60
descritores públicos são considerados, sem milhares de consultas por título.
Falha de TMDB pode reduzir sugestões; ausência de gênero nunca vira Geral.
Capas/Home não aguardam essas consultas. Concurrency2 refere-se à fila de
metadata existente; o complemento de similares tem uma requisição ativa própria.

## Verificação

- Novo test-c125-content-genres:9 grupos PASS — limites60/3/8/64, queue serial,
  TTL/dedup/kind/credencial/cooldown, allowlist/adult/identidade forte, gênero
  real/sem categoria, seleção20/local segments/imutabilidade/abort/snapshot,
  Hero real de filme/série em todos os oito modelos.
- Browser privado:18 casos,3 grupos PASS; Hero/MediaCard/useCardGenres/
  RelatedTitles/MediaRail/CatalogGrid e serviços de metadata reais, HTTP público
  e portas source/storage/native isoladas. PHONE390x844, FOLDABLE800x880,
  TABLET1280x800, FIRE_TV960x540, ANDROID_TV1280x720, ANDROID_BOX960x540,
  TIZEN1280x720, WEBOS1280x720, ambos os kinds. Gêneros visíveis; consultas
  metadata limitadas2; último card fora da viewport não inicia consulta;
  Geral/genre errado/título remoto sem entidade local excluídos; entidade de
  segmento local abre com ID correto; geração/título alterados sem estado stale.
  Zero requests externos/erros JS. Capturas phone/Fire/tablet vistas, fixture
  com arte neutra; cabeçalho adicional do harness não pertence ao produto.
- Regressões PASS: C1219, C12311, C12410, C1068, C10711, home-hero,
  search-details-related, category-rails, detail-tablet-tv e C118 square-hit-area.
  C118 primeiro reproduz baseline e depois exige matriz touch/foco/tap corrigida.
- Typecheck/build PASS. Lock26 ativação+27 promoção+9 controles negativos PASS
  antes do patch e no prebuild. cap sync android e assembleDebug PASS.
  Avisos anteriores Vite node:fs/path, dynamic/static/chunk grande e Gradle
  flatDir mantidos; nenhuma nova dependência ou alteração nativa.
- Revisão React aplicada: hooks incondicionais, ref estável, timers/observer e
  effects com cleanup, resultados assíncronos guardados, identidade keyed,
  UI bounded, botões/labels/gestos anteriores preservados.

## Artefato e limites

`tmp/c125-content-genres/Xandeflix-v1.0.19-C125.apk`,12.708.979 bytes,
SHA256 `bb51c62bb3c38a62b8b097a2f325acb72f8ac22ca05b78839de07f65ce378532`.
Package com.xandeflix.prebuilt/code19/name1.0.19/min23/target35, sete assets
dist idênticos aos empacotados, HTTPS localhost/logging none/sem dev server,
mesmo certificado C124.12 DEX e1410 recursos nativos byte-idênticos; C124
preservado por hash. Inclui gestos/estrela/contador de favoritos C124.
Não instalado nem publicado. Perfis Tizen/webOS simulados não são pacote nativo
Samsung/LG nem certificação física. Testes não provam performance de rede,
resposta do TMDB/fonte real, reprodução ou ausência universal de regressões.

Auditoria final:11 existentes autorizados (cinco produção, três harnesses,
três memórias append-only), cinco novos (hook, serviço, teste, spec/evidence).
Demais hashes, prefixos de memória, HEAD/main/origin e nativo preservados;
helpers/relatórios/capturas privados em tmp/c125-content-genres.
CURRENT_GATE=NONE; CURRENT_LOCAL_CYCLE=C125_CONTENT_GENRES;
NEXT_GATE_STARTED=NAO; PHYSICAL_QA=NOT_EXECUTED.
