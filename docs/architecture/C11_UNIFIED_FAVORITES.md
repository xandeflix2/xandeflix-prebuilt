# C123 — favoritos de títulos e canais — 2026-10-15

Pedido explícito: favoritar filme/série deve alimentar uma única categoria
Favoritos na Home; canais favoritos devem aparecer ao selecionar Favoritos
no topo das categorias Live, preservando layouts e reprodução consolidados.
Preflight: clone ativo independente C11-main, main/origin canônicos, HEAD
0f68f169f7728fae17c8311832b7643629e97a02. AGENTS/Architecture/Execution/Source
Data Boundary/Activation Lock lidos. Baseline1058 arquivos capturado após
C122; alterações anteriores preservadas. CURRENT_GATE=NONE;
CURRENT_LOCAL_CYCLE=C123_UNIFIED_FAVORITES; NEXT_GATE_STARTED=NAO.
Autorizados implementação local/testes/build/APK recuperável; sem instalação,
reset, Git, backend, publicação, alterações em autoridade/C9 ou source.

## Diagnóstico e especificação anterior ao código

SeriesPersonalActions salva favorite por fingerprint no store local v1 usado
por filmes/séries, mas store não publica lista e Home não consome favoritos.
Live já possui store de fingerprints por source e favoritos no painel nativo
fullscreen; coluna web de categorias não oferece essa coleção nem favoritar.

- Preservar chave/schema v1, ratings e favoritos existentes. Acrescentar
  listagem/assinatura de mudanças ao store de preferências. Hint opcional
  sanitizado kind/itemId no mesmo registro para resolver títulos fora do
  first-fold; nunca guardar URLs, credenciais, catálogo ou metadados remotos.
  Get continua devolvendo apenas flags/rating; limites256/64KiB e RAM fallback.
- Ações existentes em todos os perfis passam o ID local como hint. Mesma
  avaliação/compartilhamento, toggle e aria-pressed; remover desfaz favorito.
- Uma faixa Favoritos mista na Home, até20 itens, com Ver todos abrindo coleção
  única até limite256. Capas abrem detalhes corretos por kind. Lista reativa e
  persistente neste aparelho; sem prometer sincronização entre dispositivos.
- Resolver somente no catálogo ativo local, imediatamente pelos itens já em
  RAM, depois hint de ID com fingerprint conferido e fallback segmentado para
  preferências antigas/IDs M3U reordenados. I/O sequencial, um segmento por vez,
  yields/AbortSignal e geração conferida; não bloqueia hero/boot nem busca
  fonte/TMDB. Conteúdo ausente ou adulto não é exibido por esta coleção.
- Live: categoria virtual Favoritos primeira na coluna, tabs mobile e seletor
  dobrável/quadrado; não alterar grupos/catálogo reais. Usa store já existente
  por fonte; resolver páginas locais e reter apenas favoritos (máximo200),
  deduplicados, jamais pré-buffer de vídeo. Filtro e rolagem contínua usam a
  mesma janela48/3páginas; troca de categoria não troca player/sessão ativa.
- Favoritar/desfavoritar canal por botão web acessível em todos os layouts e
  pelo botão nativo já existente. Atualizar coleção ao mudar preferências;
  painel nativo/categoria virtual/paginação funcionam com o mesmo store.
  Erros de armazenamento/leitura não fabricam êxito. Voltar do fullscreen
  preserva foco no canal visível, inclusive quando categoria é Favoritos.

## Allowlist

src/ui/series-personal.store.ts; src/ui/components/SeriesPersonalActions.tsx;
PhoneMovieDetail.tsx/PhoneSeriesDetail.tsx; src/ui/pages/MovieDetailPage.tsx/
SeriesDetailPage.tsx/HomePage.tsx/HomeCollectionPage.tsx/LiveTvPage.tsx e
LiveTvPage.css; novos src/ui/favorite-title-resolution.ts e
src/ui/components/FavoriteTitles.tsx; novo src/playback/live-favorite-category.ts;
scripts/test-c123-favorites.mjs e bindings de harnesses existentes estritamente
necessários às novas dependências, sem relaxar assertions;
este plano/docs/evidence/C11_UNIFIED_FAVORITES.md e memórias STATUS/EVOLUTION/
ERRORS append-only; helpers tmp/c123-unified-favorites e saídas build ignoradas.
Sem novos pacotes nem edição de schema/source/search/player nativo/App/router.

Refinamento anterior ao patch correspondente: MediaRail.tsx recebe somente
getItemKey opcional, preservando default. Coleção mista usa kind:id na faixa
e no grid, pois filme/série podem ter o mesmo ID opaco. Harnesses históricos
podem adaptar portas/representação do BrowseHero atual, mantendo verificações
semânticas de destaque, navegação, seleção e limites; não exigir props da
implementação antiga que já foi substituída antes deste ciclo.

## Aceitação

Testar persistência/reabertura, mistura movie+series, remoção/rating preservado,
preferências legadas, resolução fora do first-fold/reordenação/ausência,
AbortSignal/generation e isolamento Live por fonte. Browser com componentes
reais: clique Favoritos → Home/Ver todos/detalhes; Live favoritos no topo,
seleção/filtro/remoção/rolagem>48/foco/preview preservado em phone/tablet/TV/
quadrado. Portas nativas/source controladas; não chamar fixture de hardware.
Regressões dos detalhes, coleções/retorno, canais contínuos/player/foco,
TypeScript/build/lock inicial/final e revisão React. APK de teste C123 inclui
C122/assinatura/package e assets atuais conferidos. Sem instalação automática.
