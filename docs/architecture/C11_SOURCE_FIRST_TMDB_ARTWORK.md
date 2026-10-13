# C11 — Imagens da fonte e complemento local pelo TMDB

## Autorização e preflight — 2026-10-06

O usuário solicitou implementar a estratégia após a auditoria e informou ter
configurado VITE_TMDB_API_KEY em .env.local. Autorização para este ciclo local
de imagens/metadados; CURRENT_GATE=NONE, NEXT_GATE_STARTED=NAO. Workspace e
top-level C:/Xandeflix/xandeflix-prebuilt-c11-main, main, origin esperado,
HEAD 61ec00902be5d0037adf79c68b3a8624b3a2bd6e. Vinte entradas dirty preexistentes
preservadas. AGENTS, Architecture, Execution, Source Data Boundary e lock de
ativação lidos. Sem commit/push/PR, backend, instalação ou alteração do 2.0.

## Comportamento especificado antes do código

- Cards: imagem válida da fonte primeiro; complemento TMDB quando ausente ou
  após falha; placeholder somente quando ambas as opções forem indisponíveis.
- Atualização explícita do usuário no mesmo ciclo: heroes da Home, Filmes e
  Séries devem usar exclusivamente backdrops horizontais do TMDB, pois a fonte
  não os fornece. O mesmo vale para fundos dos detalhes. Não esticar pôster
  vertical nesses espaços; na ausência de backdrop usar placeholder local.
  Completar sinopse/ano/título original/duração sem sobrescrever a fonte.
- Fonte M3U: preservar URLs válidas, inclusive vírgulas e caminhos com barras
  duplicadas; rejeitar credenciais inline e protocolos diferentes de HTTP(S).
  Recuperar capa de série em episódio posterior; registro do first-fold de
  artworks limitado aos itens retidos, sem materializar todas as imagens.
- API em serviço separado, nunca fetch direto nos componentes/seletores.
  Consultas após montagem autorizada, apenas itens visíveis/próximos ou detalhe/
  hero. Sem consulta durante boot/importação, sem varrer catálogo inteiro.
- Matching isolado por movie/series e ID TMDB quando disponível; título limpo,
  ano e rejeição de correspondências ambíguas quando não houver ID.
- Concorrência limitada, deduplicação, timeout, fila limitada/prioridade,
  cache público de metadados privado ao endpoint e com TTL/limite; erros
  transitórios não viram ausência permanente. Sem modificação do snapshot ativo.
- Nenhuma URL de stream/fonte, licença, dispositivo ou credencial de fonte
  enviada ao TMDB. Sem catálogo central nem proxy de playlist/mídia.
- VITE_TMDB_API_KEY é credencial de leitura do aplicativo: variável de build
  visível no cliente, não segredo recuperável apenas pelo servidor. Não copiar
  valor para código/docs/logs/testes, nem versionar .env.local/dist. Uma chave
  que precise permanecer secreta exige gateway de autenticação separado.
- Incluir hero nas listagens de Filmes e Séries conforme a atualização do
  usuário, usando o primeiro item da página segmentada já carregada. Não
  materializar novos lotes nem varrer catálogo para escolher destaque.
- Segunda atualização do usuário: variar a ordem de títulos/cards nas
  categorias por visita; Lançamentos preserva a ordem da fonte. Aleatoriedade
  estável durante a visita, sem trocar capas entre títulos nem timers que
  movam foco. Após promoção do catálogo pela sincronização existente, renovar
  serviços/caches locais e faixas usando o snapshot atualizado. Sem polling
  novo da playlist, mudança do boot ou ordenação por data não fornecida.

## Allowlist

src/artwork/*.ts; src/ui/hooks/useArtworkMetadata.ts;
src/ui/components/{Artwork,MediaCard,Hero}.tsx;
src/ui/components/MediaRail.tsx; src/ui/hooks/useSegmentedBrowse.ts;
src/ui/pages/{HomePage,MoviesPage,SeriesPage,MovieDetailPage,SeriesDetailPage}.tsx;
src/catalog/{catalog-selectors,catalog-view-model,category-presentation}.ts;
src/source/{real-source-importer.service,m3u-bounded-staging-writer}.ts;
scripts/test-c11-source-first-tmdb-artwork.mjs;
este contrato; docs/evidence/C11_SOURCE_FIRST_TMDB_ARTWORK.md;
docs/DECISIONS.md; acréscimos a docs/{STATUS,EVOLUTION_REPORT,ERRORS_AND_BLOCKERS}.md;
outputs usuais de build/validação ignorados em dist/tmp. Sem novas dependências.

## Aceitação

Lock antes/depois e prebuild; typecheck/build; fixtures reais do importador e
seletores; source-first, URL válida, série com capa tardia, heros/detalhes;
matching movie/series/ano/ambiguidade; cache/dedup/timeout/limites/falhas; ausência
de credencial de fonte em requests/cache; sem busca em boot; verificação React.
Smoke sanitizado da chave somente contra TMDB com obra pública, sem importar
ou exportar catálogo do usuário. Não alegar cobertura universal nem validação
física em aparelhos sem teste. Mudanças congeladas fora da allowlist preservadas.
