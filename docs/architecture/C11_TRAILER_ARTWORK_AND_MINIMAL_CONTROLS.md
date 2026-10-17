# C119 — trailer, imagem de reserva e controles mínimos — 2026-10-15

Pedido explícito do usuário: retirar Abrir trailer no YouTube, apresentar
imagem horizontal na ausência de trailer e manter apenas play/pause quando
possível. Especificação anterior ao código. Preflight read-only no clone ativo
C:\Xandeflix\xandeflix-prebuilt-c11-main, main/origin canônicos, HEAD
0f68f169f7728fae17c8311832b7643629e97a02; AGENTS, Architecture, Execution,
Source Data Boundary, Activation Lock e contratos dos detalhes/trailer lidos.
Baseline privado em tmp/c119-trailer-presentation/baseline.json; trabalhos
C107–C118 preservados. Lock inicial26+27+9 PASS. CURRENT_GATE=NONE;
CURRENT_LOCAL_CYCLE=C119_TRAILER_PRESENTATION; NEXT_GATE_STARTED=NAO.
Sem commit/push/PR, backend, instalação, reset ou alteração da fonte.

## Comportamento e aceitação

- Retirar exclusivamente a ação externa abaixo do trailer e sua dependência
  Browser neste componente. Detalhes/episódios/reprodução da fonte intactos.
- Sem trailer confirmado, durante busca de metadados ou erro do player público:
  conservar o campo16:9/min200px com Artwork horizontal TMDB do próprio título,
  sem texto de indisponibilidade/erro e sem escurecimento adicional. Se não há
  imagem horizontal resolvida, fundo neutro, sem inventar vídeo/imagem ou usar
  trailer de outro título. Preservar identidade/ARIA do Artwork.
- Incorporar YouTube com controls=0 em web e WebView pública Android; oferecer
  somente a interação do próprio player, sem botões adicionais abaixo do vídeo
  em inline ou modal. Não cobrir/cropar/manipular
  a UI/marca do player. Informações/marca/recomendações controladas pelo
  YouTube podem continuar aparecendo. aria-busy sinaliza carregamento sem
  texto visível sobre o vídeo; play inicial só antes de abrir o embed.
- Não introduzir SDK, nova requisição de fonte, API de playback/C9, transporte
  de vídeo, cache ou biblioteca. Web iframe oficial mantém API/origin/referrer;
  Android mantém WebView separada, allowlists de ID/comando/sessão/bounds,
  deduplicação de layout, pausa fora da viewport e cleanup. Erros de iframe
  detectáveis pelo browser também retornam à imagem; não alegar que onLoad
  confirma vídeo tocando ou detecta todos os bloqueios internos do YouTube.
- Emenda local substitui somente a obrigação visual anterior de mensagem/link
  externo em C11_PHONE_SERIES_DETAIL_LAYOUT e C11_TRAILER_LAYOUT_STABILITY;
  demais restrições desses contratos e do modal permanecem em vigor.
- Testar componente real: movie/series, ausência/loading/erro, imagem TMDB,
  inline/modal, controles oficiais, ausência de comandos externos, visibility,
  cleanup/eventos tardios. Regressões existentes phone/movie/modal, teste Java
  da política, TypeScript/build/lock/sync/Gradle e conferência APK/assets/cert.
  Inspeção browser com portas públicas controladas, sem alegar playback físico.
  APK local recuperável C119; sem publicar atualizador nem instalar aparelhos.

## Allowlist estrita

src/ui/components/SeriesTrailer.tsx; src/index.css (somente trailer);
android/app/src/main/java/com/xandeflix/prebuilt/trailer/PublicTrailerPolicy.java;
android/app/src/test/java/com/xandeflix/prebuilt/trailer/PublicTrailerPolicyTest.java;
novo scripts/test-c119-trailer-presentation.mjs; este documento;
docs/evidence/C11_TRAILER_ARTWORK_AND_MINIMAL_CONTROLS.md;
docs/{STATUS,EVOLUTION_REPORT,ERRORS_AND_BLOCKERS}.md append-only;
saídas usuais ignoradas dist/Capacitor/Gradle/APK/tsconfig.tsbuildinfo e tmp.
Fonte/catalog/search/App/identidade/autoridade/player nativo da fonte intactos.

## Verificação read-only solicitada durante a análise

Usuário informou ausência de novos Lançamentos em todos os aparelhos da mesma
fonte, sem confirmar novas publicações no provedor. Código atual liga
AutomaticSourceRefresh após AUTHORIZED, checkContent=true, intervalo15min
após sucesso, backoff mínimo1min, timer60s e eventos online/focus/visibility.
Exige foreground/online; adia Live/detalhes/modal/playback/Cast. Digest verifica
conteúdo mesmo com sourceVersion igual; PROMOTED atualiza modelo/UI. Código
não determina se o provedor publicou novos títulos. Sem aparelho conectado ou
consulta comercial nesta rodada: não certificar última consulta real/fonte.
Suites existentes automatic-source-refresh19, release-source-order3 e
directory-orchestration9 PASS. Nenhum ajuste dessa rotina necessário pela
evidência disponível; não alterar código/import/cache ou simular conteúdo real.

Referências oficiais: https://developers.google.com/youtube/player_parameters;
https://developers.google.com/youtube/iframe_api_reference;
https://developers.google.com/youtube/terms/required-minimum-functionality.

## Adendo anterior à atualização dos harnesses históricos

A execução atual dos testes detail-tablet-tv e phone-movie-detail revelou
dependências sem binding introduzidas antes deste ciclo: WatchProviders e
seleção de perfil do AppShell, além da extração antiga do callback Back antes
da restauração de categoria C107. Acrescentar à allowlist esses dois scripts
somente para conectar stubs das portas de UI não exercitadas e funções reais
de classificação de dispositivo; preservar integralmente as assertions.
  Não alterar produção para satisfazer harness obsoleto. Falhas iniciais e
nova execução serão registradas na evidência e memória de erros.

## Correção do usuário durante execução — antes do patch correspondente

O usuário explicitou que não deve haver botão de play/pause abaixo do vídeo.
Esta instrução substitui a primeira proposta de barra externa, também no modal.
Remover o grupo e CSS sem criar overlay sobre YouTube. Interação acontece no
próprio player oficial, respeitando o que controls=0 permite. Controle nativo
allowlisted permanece disponível no plugin; não inventar suporte novo de
D-pad nem afirmar QA física. Teste histórico do modal passa a verificar a
ausência da barra, mantendo sessão/bounds/ready/playing/cleanup/isolamento e
demais assertions anteriores; única mudança de expectativa funcional justificada
por este pedido. Não há alteração no player de filmes/episódios/canais da fonte.
