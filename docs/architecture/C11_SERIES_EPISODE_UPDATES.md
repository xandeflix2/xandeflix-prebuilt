# C11 — Séries novas e episódios novos nos Destaques/heroes (ciclo 61)

Pedido direto do usuário de 2026-10-09. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.
Preflight no clone C11 independente/main, origin canônico, HEAD
61ec00902be5d0037adf79c68b3a8624b3a2bd6e. AGENTS, Architecture, Execution,
Source Data Boundary e Activation Lock lidos. Baseline privado registrado antes
do patch. Git commit/push/PR, backend/env/migration/projeto protegido proibidos.

## Especificação anterior ao código

1. Detectar adições de séries e de episódios apenas após promoção de catálogo
   REAL autorizado, usando o inventário local e a sincronização do ciclo60.
   Sem consulta nova ao TMDB/fonte ou modificação de identidade/ativação/licença.
2. Novidade para título de série recém-observado; Episódios Novos para série
   já conhecida com nova combinação temporada/número de episódio. Ambos por
   sete dias desde detecção local; Novidade prevalece quando ambos seriam
   aplicáveis. Episódios adicionados depois renovam somente Episódios Novos.
   Filmes mantêm o selo anterior. Reordem, IDs M3U ordinais, mudanças de URL,
   título de episódio/capa/metadados, exclusão e reinserção de episódio já visto
   não são adições. Nova temporada com episódios é adição; temporada vazia não.
3. Migração aditiva do inventário existente: preservar datas de títulos.
   Primeiro inventário completo de episódios serve de referência sem falso selo,
   inclusive na mesma geração já registrada no v1. Não inventar datas históricas.
   Escopo por fonte e título normalizado existente: homônimos indistinguíveis da
   fonte compartilham referência, como antes; renomear série pode parecer título novo.
4. Ler filmes/séries/temporadas/episódios locais um segmento por vez/batches200.
   Persistir somente hashes, datas e coordenadas numéricas compactadas em faixas;
   nada de título, stream, credencial ou bytes do catálogo no inventário.
   No máximo100000 identidades de títulos e1000000 registros/coordenadas de
   episódios,500000 temporadas; não reter objetos completos de episódios.
   IDs correntes apenas em mapas efêmeros para vincular temporada/série.
   Coordenada segura: temporada0..999999, episódio1..999999; inválido/orfão,
   segmento ausente/parcial/contagens inconsistentes/geração alterada/abort/CAS
   rejeitam apresentação parcial e preservam inventário anterior. Contrato
   canônico do catálogo/fonte não muda por esse limite opcional de apresentação.
5. Séries novas/atualizadas têm prioridade por detecção mais recente em
   Séries em Destaque na Home, overview Séries e Ver todos da mesma coleção.
   Seleção consistente limitada20; complementar com seleção anterior, sem alterar
   categorias, filmes, Recentes assistidos, histórico/playback ou ordem da fonte.
   Resolver essas séries no catálogo completo, inclusive fora do first-fold.
   Guardar em memória no máximo100 view models recentes para apresentação.
6. Hero da Home prioriza candidatas de séries atualizadas independentemente do
   ano de estreia, mantendo filmes/cotas e exigência de imagem válida existente.
   Hero do overview Séries e categorias Séries prioriza as mesmas candidatas
   somente dentro da categoria selecionada. Expiração devolve seleção anterior.
   Cards e hero mostram selo acessível sem alvo de foco novo/D-pad ou mudança
   da geometria das capas. Sem deslocar seleção/foco à força durante interação,
   inclusive quando o prazo expira: retirar o selo no prazo, mas adiar remoção
   da série da seleção enquanto um card/rail/grid mantém o foco. Aplicar seleção
   expirada ao sair dessa região. Store puro recebe callback de disponibilidade
   do provider, sem conhecer DOM ou fazer I/O.
7. Reusar provider/relógio compartilhados, assinaturas estáveis e cleanup/abort;
   nenhuma leitura de storage por capa. Bootstrap/imagens não aguardam scan.
8. APK standalone code3/name1.0, mesmo package/certificado e RPC diagnóstico.
   Entrega recuperável nos três alvos já autorizados (tablet/S24/Fire1 3.126)
   somente disponíveis e sem playback ativo, preservando arquivos/firstInstallTime.
   Não interromper mídia/desbloquear OS/resetar; Fire2/S23 excluídos. Novo APK
   precisa ser instalado uma vez; não existe distribuição OTA automática.

## Allowlist estrita

Este documento; docs/evidence/C11_SERIES_EPISODE_UPDATES.md;
docs/evidence/C11_OPTIMIZATION_REPORT_20261006.md;
docs/{STATUS,DECISIONS,ERRORS_AND_BLOCKERS,EVOLUTION_REPORT}.md;
src/catalog/new-content-badge.ts; src/catalog/series-content-updates.ts (novo);
src/ui/components/{NewContentProvider,MediaCard,Hero}.tsx;
src/ui/hooks/{useSeriesHighlights (novo),useHomeHero}.ts;
src/ui/pages/{HomePage,CatalogBrowsePage,HomeCollectionPage}.tsx;
src/index.css; android/app/build.gradle;
scripts/test-c11-series-episode-updates.mjs (novo);
scripts/test-c11-{new-content-badge,browse-featured-order,home-special-collections,home-hero,category-rails,hero-artwork-eligibility}.mjs
somente ports/loaders indispensáveis ao novo hook e ao SSR de componentes de
detalhes já existentes (trailer/abas/ações/history), preservando todas as assertions.
O loader histórico de home-hero passou os10grupos de hero e parou numa dependência
DetailTrailer preexistente; atualizar esse port não autoriza mudar comportamento
ou testes de detalhes. Nenhum refactor de produção decorrente dessa adaptação.
Saídas usuais ignoradas build/Capacitor/APK/tsconfig.tsbuildinfo e helpers privados
tmp/c11-series-episode-updates-20261009. Nenhum outro código/playback/source/backend.

## Aceitação

Scan completo → persistência atômica → reinício → flags → seleção → hero/capa
testados. Adição/same-count replacement/hole/new-season, ausência de adição,
migração v1/same-generation, dados inválidos, concorrência/abort, escopo,
expiração7dias, prioridade fora first-fold/category-exclusive e DOM acessível.
Regressões de ativação/refresh automático/Novidade/browse/D-pad/heroes relevantes.
TypeScript/build/lock/assinatura/assets/APK/proveniência e QA visual responsiva.
Evidência física limitada à disponibilidade real dos aparelhos; não semear
catálogo comercial/histórico nem relatar erro fictício ao gestor/WhatsApp.
