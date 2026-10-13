# C11 — Correção do hero misto ausente na Home

## Autorização/preflight — 2026-10-06

Usuário reportou hero ausente na Home após o APK anterior e pediu destaque
misto de filmes/séries. Reiterou celular com capa vertical e metadados TMDB.
Correção local desse fluxo e entrega in-place nos três alvos já autorizados
continuam no escopo: AFTSSS, SM-X610 e SM-S926B, mesma assinatura/package,
sem reset. Git/backend/projetos histórico e 2.0 fora do escopo.

Workspace/top-level C:/Xandeflix/xandeflix-prebuilt-c11-main, Git próprio,
origin https://github.com/xandeflix2/xandeflix-prebuilt.git, main,
HEAD 61ec00902be5d0037adf79c68b3a8624b3a2bd6e. AGENTS, Architecture,
Execution, Source Data Boundary e activation lock lidos. Dirty existente
preservado; baseline 575 arquivos em tmp ignorado. CURRENT_GATE=NONE;
NEXT_GATE_STARTED=NAO; commit/push/PR não autorizados. Lock inicial PASS49+9.

## Defeito confirmado antes do código

useHomeHero usa somente currentYearHeroItems como fallback; HomeHero retorna
null se nenhuma opção. Agregados privados read-only, sem títulos/IDs/URLs:
nos três aparelhos, first-fold com 100 filmes/100 séries, zero obras com ano
vigente identificado; 100 filmes/95 séries sem ano. Manifestos segmentados
válidos. Portanto a UI fica sem hero durante a preparação ou se a seleção
do ano nunca for resolvida. A afirmação anterior de sucesso não cobre essa
regressão real (LATEST_REGRESSION_WINS).

## Especificação anterior à correção

- Home não deve ficar sem hero quando catálogo contém filmes/séries. Seleção
  provisória imediata com até cinco de cada tipo do first-fold já carregado;
  preferir ano corrente, depois Lançamentos, depois demais conteúdos reais.
  Misturar tipos/ordem por visita, deduplicar, memória até cem candidatos/tipo.
- Índice assíncrono continua enriquecendo/selecionando ano vigente e novos
  lançamentos. Quando pronto, suas opções têm prioridade; completar somente
  tipo insuficiente com itens locais reais. Não contar essas opções antigas/
  sem ano como cota atual, nem inventar ano/conteúdo ou remover resultados novos.
  Janela até vinte; se catálogo vazio, manter EmptyState sem hero fictício.
- Mesmo com ano ausente, TMDB offline, índice vazio, leitura rejeitada ou
  pendente, hero permanece visível. Metadados opcionais nunca bloqueiam Home.
- Celular preserva pôster vertical alternativo TMDB e prefere ano/sinopse/
  gêneros/duração TMDB quando disponíveis. Placeholder vertical enquanto
  imagem chega; detalhes continuam abrindo a entidade local correta.
- Tablet/TV e heroes internos continuam com backdrops horizontais. Não alterar
  fonte/importação/native/boot/storage/ativação, políticas ou dependências.
- Callbacks de exibição só marcam opções do índice correspondente; seleção
  derivada memoizada para não reiniciar cursor/timer em renders irrelevantes.

## Allowlist e aceitação

src/catalog/home-hero.service.ts; src/ui/hooks/useHomeHero.ts;
src/ui/components/{HomeHero,Hero}.tsx; scripts/test-c11-home-hero.mjs;
este plano; docs/evidence/C11_HOME_HERO_VISIBLE_FIX.md;
acréscimos docs/{DECISIONS,STATUS,EVOLUTION_REPORT,ERRORS_AND_BLOCKERS}.md;
saídas usuais build/Capacitor/Gradle/APK e tmp ignorados.

Reproduzir hero nulo com first-fold sem ano antes do patch. Testes de catálogo
antigo/sem ano, fallback misto, dedup, cota atual preservada, índice vazio/
rejeitado/pendente, atualização e metadados TMDB prioritários no celular.
Suite anterior não relaxada; typecheck/build, navegador phone/tablet/TV com
componentes reais e zero console errors. Lock antes/depois/prebuild/antes de
Capacitor/Gradle e antes da entrega. APK standalone/assinatura/assets validados;
install -r Fire → tablet → S24 com árvores privadas/firstInstallTime comparados
somente em RAM. Sem abertura automática/reset; auditoria de proveniência final.

## Refinamento explícito do usuário — antes do código

Se não houver conteúdo do ano vigente, buscar os mais recentes. Acrescentar
src/catalog/home-hero.repository.ts à allowlist. Fallback imediato prioriza
ano vigente e, entre anos passados conhecidos, o maior ano; para ano ausente
usar Lançamentos antes dos demais. Índice conserva um pool limitado de cinquenta
candidatos recentes por tipo, ordenado pelo ano real conhecido/obtido do TMDB,
e completa a cota insuficiente com esses recentes. Ano ausente não vira ano atual.
Gerações antigas sem esse pool são reconstruídas sem apagar conteúdo visto.
Preservar prioridade de lançamentos novos e limite de vinte opções.

## Episódios em lista sem imagens — antes do código

Usuário solicitou episódios da série como lista, sem imagem. Acrescentar
src/ui/pages/SeriesDetailPage.tsx e src/index.css à allowlist. Remover somente
o thumbnail de cada episódio, mantendo número, título, sinopse/duração e o
mesmo botão/handler Assistir. Lista semântica ul/li, carregamento/seleção de
temporada preservados, sem alterar hierarquia, resolução ou playback.
CSS somente dessa lista: uma coluna em todos os perfis, sem marcas/margens
nativas e com linhas compactas. Artwork da série não é alterado. Verificar
ausência de img/Artwork dentro dos episódios e botão/foco em browser.

## Troca de categoria imediata — antes do código

scripts/test-c11-source-first-tmdb-artwork.mjs pode receber somente resolução
do novo import de preload no harness SSR, sem editar/relaxar suas asserções.

Usuário reportou hero/capas lentos ao trocar categoria em Filmes/Séries.
Fronteira confirmada: useSegmentedBrowse zera itens em cada clique; loadPage
aguarda countCategory varrer todos os segmentos antes de devolver a primeira
página; nenhum cache de página/prefetch de imagem/categoria nesse fluxo.

Acrescentar à allowlist src/catalog/segmented-browse.service.ts,
src/ui/hooks/useSegmentedBrowse.ts, src/ui/pages/{Movies,Series}Page.tsx,
src/artwork/artwork-preload.service.ts e scripts/test-c11-category-preview.mjs.

- Render síncrono dos itens já materializados/categoria pré-carregada. Estado
  por kind/categoria/snapshot, nunca exibir outra categoria ao mudar seleção.
- Primeira página não espera contagem completa. Contagem canônica em segundo
  plano; até lá, indicação honesta de conteúdo carregado, sem falso zero/total.
  API loadPage padrão continua com contagem exata para leitores existentes.
- Contagens de todas as categorias calculadas numa varredura por kind; somente
  mapas numéricos, sem reter catálogo inteiro. Página até48 itens; LRU24 páginas
  por serviço/snapshot. Request cancelado/snapshot anterior não atualiza UI.
  Guardar também primeiro segmento/offset por categoria nesse mesmo scan para
  pular segmentos anteriores em cliques ainda sem página em cache. Preload
  prioriza backdrop do hero antes de pôsteres ainda pendentes.
- Prefetch limitado de categorias vizinhas e por foco/hover/toque, com dedup de
  I/O. Aquecer pôsteres da fonte e backdrop TMDB do primeiro item na ordem final
  de apresentação. Até duas imagens ativas/24 pendentes/96 URLs recentes; fila
  TMDB e source-first existentes preservadas. Sem download geral do catálogo.
- Categoria carregada em cache muda itens/hero no render do clique. Primeira
  imagem remota não armazenada depende de I/O/rede: não inventar SLA físico.
- Manter randomização por visita exceto Lançamentos, tipo correto, paginação,
  botão de detalhes/foco e heroes horizontais. Nenhuma mudança no importador,
  native, ativação ou source; zero dependências novas.
- Testes devem reproduzir bloqueio da primeira página por contagem antes do
  patch, validar preview antes do último segmento, cache/revisita, contagens
  tipadas, cancelamento e snapshot, e navegador com I/O artificial atrasado.

## Fade do hero Home — antes do código

Usuário pediu transição fade entre conteúdos do hero Home. Usar animação de
entrada de opacidade até400ms ao mudar a opção; preservar o mesmo DOM do botão
de detalhes e controles, sem remontar o hero inteiro nem reter imagens extras.
Cancelar animação anterior/na desmontagem e respeitar prefers-reduced-motion.
Restrita à Home; navegabilidade, timer e callbacks existentes permanecem.
Verificar mudança de opção com animação e foco preservado em browser.

## Altura do hero Fire Stick — antes do código

Usuário solicitou aumentar o hero muito fino no Fire Stick. Ajuste limitado
ao perfil TV compacto paisagem/altura baixa com navegação lateral: hero Home,
Filmes/Séries em torno de48vh, clamp220–320px, imagem horizontal e texto/controles
dentro da área. Não afeta o hero vertical móvel. Verificar layout 960x540,
controles/foco e aumento da altura em browser; preservar demais áreas/player.

## Busca, detalhes, foco e semelhantes — antes do código

Refinamentos expressos do usuário: Matrix deve retornar também suas variações;
detalhes com metadados TMDB, fundo horizontal e pôster vertical (preferência
confirmada); foco D-pad com sombra/preenchimento, busca sem retângulo branco;
abaixo dos detalhes, títulos do mesmo gênero ou categoria disponíveis na fonte.

Diagnóstico: engine binário interrompe a consulta no primeiro título exato.
Busca pública TMDB Matrix retorna diversos homônimos, sem ano/ID a seleção
segura atual rejeita todos. Consulta pública confirma metadados/backdrop de603.
Conservar rejeição de ambiguidades; usar a identificação pública da capa TMDB
quando disponível, incluindo variantes fornecidas por images, para confirmar
o candidato. Sem eleger homônimo por popularidade e sem enviar capa da fonte
ou dados privados ao TMDB. Cache com identidade da capa pública deve contornar
miss antigo de título genérico. Busca continua local, índice/formato intactos.

Allowlist adicional: src/experiments/search-compact-v2-pruned/compact-search-v2-pruned-engine.ts,
src/artwork/tmdb-metadata.service.ts, src/ui/hooks/useArtworkMetadata.ts,
src/ui/components/{Artwork,Hero,MediaCard}.tsx, src/ui/pages/MovieDetailPage.tsx,
src/catalog/home-hero.service.ts, src/artwork/artwork-preload.service.ts,
src/App.tsx, src/catalog/related-titles.service.ts,
src/ui/components/RelatedTitles.tsx, scripts/test-c11-search-details-related.mjs.
Harness SSR existentes de artwork/Home podem somente resolver os novos imports;
suas asserções permanecem. src/index.css e SeriesDetailPage já autorizados.

Remover retorno exclusivo exato, conservar pontuação e heap limitado50; exato
em primeiro lugar seguido de prefixos/tokens. Sem comparar a nova semântica
com short-circuit legado R5 como requisito de produto: pedido atual corrige
esse comportamento. Testar variantes, filtros, paginação limitada e empates.

Semelhantes: mesmo tipo, compartilhar gênero ou categoria por IDs canônicos;
excluir obra atual/duplicatas, preferir gênero. Até20 sugestões, primeira faixa
materializada imediata e complemento segmentado local com cancelamento e
validação do snapshot. Sem recomendações de obras ausentes da fonte, catálogo
completo em memória, alteração de source/playback ou novo backend. Callback
existente abre o detalhe correto; séries preservam episódios em lista sem img.

CSS foco visível com brilho rubi e preenchimento/sombra interna, sem outline
branco nem deslocamento; input usa foco do wrapper arredondado, seleção de
texto/caret/teclado permanecem. Verificar controles, cards e input pelo D-pad,
query→seleção→detalhes→semelhantes em browser TV/phone. Locks anteriores e
verificação de proveniência obrigatórios antes de APK/instalações autorizadas.

Diagnóstico adicional read-only do catálogo do Fire: Matrix não possui ano,
ID TMDB ou filename de capa TMDB reconhecível. A dica de capa sozinha não
resolve este caso. Busca pública confirma cinco homônimos: obra603 com28886
votos; os demais3/22/25/51. Fallback de confiança explicitamente inferido,
sem escolher simplesmente primeiro resultado/popularidade: só considerar
uma obra com título exato, pelo menos1000 votos e vinte vezes os votos de
qualquer outro homônimo elegível. Nunca superar incompatibilidade de ano,
título fraco, ou usar esse fallback quando uma dica de capa puder confirmar
ou contradizer a escolha. Homônimos concorrentes continuam sem associação.
Identidade de resolução v3 evita persistir antigo miss de título genérico;
positivos legados podem ser reaproveitados. Testar positivo Matrix, ambiguidade
real remakes, ano incompatível, título fraco e dica de imagem contraditória.

## Seleção de hero com imagem TMDB confirmada — antes do código

Usuário pediu exibir no hero somente obras com imagem disponível no TMDB.
Novo refinamento supera o fallback anterior que apresentava um título ainda
sem imagem: preservar a área com estado de preparação até confirmar ao menos
uma imagem; nunca exibir obra conhecida sem imagem. Cards/busca permanecem
completos e source-first. Home telefone exige poster TMDB vertical; outros
perfis/Filmes/Séries exigem backdrop TMDB horizontal. Confirmar carregamento
e decode da imagem com limites/timeout; falha elimina só esse destaque nesta
sessão. Opções 5+5/ano vigente ou recentes são meta quando há títulos elegíveis,
sem inventar imagens nem conteúdo. Se nenhuma opção elegível, mensagem clara,
sem hero vazio de um filme. Cache limitado por identidade/perfil e preload de
categorias aquece candidatos seguintes. Sem bloquear grid/contagens; mudança
de categoria nunca conserva título de outra categoria nem perde foco.

Allowlist adicional: src/artwork/hero-artwork.service.ts,
src/ui/hooks/useHeroArtwork.ts, src/ui/components/CategoryHero.tsx,
scripts/test-c11-hero-artwork-eligibility.mjs. HomeHero/MoviesPage/SeriesPage,
preload e testes/harness já autorizados. Testar primeiro sem imagem seguido
de outro com imagem, falha de decode, perfis independentes, cache/prefetch,
troca rápida e fonte nova; validar que nenhum título sem imagem entra no hero.

Preload e confirmação de decode compartilham a mesma fila de imagens, em
src/artwork/image-load-queue.ts (allowlist), para manter duas ativas/24 pendentes
e96 resultados recentes no conjunto, evitando um terceiro download simultâneo.
Harness SSR dos testes anteriores pode injetar metadados sintéticos confirmados
no novo hook/componente para conservar as asserções de render. Teste próprio
de elegibilidade verifica o hook/serviço real e não presume imagem em SSR/offline.

src/ui/pages/HomePage.tsx também autorizado: passar pool de apresentação de
até25 candidatos por tipo do first-fold, além dos selecionados pelo índice,
para completar vagas que perdem elegibilidade. Sem inventar cota quando a fonte
não oferece imagens. Verificação até10 elegíveis por tipo; exibição até5 opções
regulares e5 lançamentos novos por tipo, total20. Pool extra não altera a
seleção/persistência do índice nem seu reconhecimento de novos lançamentos.

## Acesso Início e espera de episódios — antes do código

Usuário solicita acesso Início nos canais mobile ao lado de Voltar e nos
detalhes de filme/série. Allowlist adicional src/ui/components/Header.tsx,
src/ui/pages/LiveTvPage.tsx. Usar callback de navegação existente; detalhe
possui botão Início junto de Voltar e ícone no header mobile; Live mobile
botão com SVG/callback Início no header sem alterar preview/player. App.tsx,
CSS/SeriesDetail já autorizados. Conferir saída fecha preview pelo ciclo de
vida existente, sem redefinir grupos/catálogo ou tocar backend.

Episódios: manter leitura sob demanda e cache efêmero canônico; não pré-carregar
hierarquia no boot nem alterar arquivos de primeira instalação. Mostrar lista
materializada imediatamente; na primeira leitura, spinner discreto e texto
acessível role=status/aria-live, respeitando movimento reduzido. Espera de
temporadas sem linhas também informada. Sem promessa de zero I/O no primeiro
acesso; nenhuma mudança no resolver canônico ou no importador/native/ativação.

Teste novo de busca detectou limite de score inseguro para token numérico de
uma letra: scoring reconhece prefixo2→20, enquanto o índice só expande prefixos
de comprimento mínimo. Desativar poda nessas consultas curtas mantendo heap50,
mesmos candidatos e score; demais consultas preservam poda. Critério: paridade
com scoring exaustivo para filtros/topK/empates, incluindo consulta numérica.

Consulta posterior sobre Google Cast: usuário escolheu transmissão direta e
perguntou compatibilidade Tizen/webOS/Android TV. Registrar análise documental
em docs/architecture/C11_GOOGLE_CAST_MOBILE_FEASIBILITY.md (allowlist de análise).
Não declarar botão/integração implementado nesta correção de UI: verificar
SDK/minSDK23, lifecycle, autorização do receptor e C9 requer especificação
própria antes de código nativo. Viabilidade/compatibilidade respondidas com
fontes primárias; instalação deste ciclo cobre somente correções testadas acima.
