# C11 — Hero Home: ano corrente, pôster alternativo e novos lançamentos

## Escopo/proveniência — 2026-10-06

Plano anterior ao código: docs/architecture/C11_HOME_HERO_CURRENT_YEAR.md.
Workspace/top-level C:/Xandeflix/xandeflix-prebuilt-c11-main, origin esperado
https://github.com/xandeflix2/xandeflix-prebuilt.git, main, HEAD
61ec00902be5d0037adf79c68b3a8624b3a2bd6e. AGENTS/contratos/boundary/lock lidos.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem Git/backend/projeto 2.0.
Baseline: 568 arquivos congelados; patch dirty anterior preservado. Build e
instalação in-place nos três alvos explicitamente solicitados pelo usuário.

## Comportamento implementado

- HomeHero/useHomeHero substituem o destaque único da Home por seleção aleatória
  e janelas de cinco filmes + cinco séries do ano corrente, quando disponíveis.
  Cota não é preenchida por obras antigas, futuras ou com ano desconhecido.
- HomeHeroService lê o catálogo local segmentado cooperativamente após montagem
  da Home; IndexedDB privado separado registra conteúdo visto e opções por
  snapshot/source lógica/ano. Um segmento por leitor e batch de cem referências;
  janela/DOM até vinte opções, mantendo somente uma imagem hero ativa.
  Não muda importação, boot, catálogo canônico, source fetch ou autoridade.
- Normalização de título/ano tolera sufixos de qualidade entre colchetes/pipes.
  Identidade de apresentação independe dos IDs posicionais M3U. Reordenar fonte
  não transforma obras existentes em novos lançamentos; movie/series isolados.
- Ano ausente: metadados de Lançamentos têm prioridade. Só se a cota ainda ficar
  incompleta, consultar desconhecidos de outras categorias em segunda leitura
  com early-exit. Evita que séries antigas sem ano atrasem os lançamentos atuais.
- Novo snapshot invalida seleção antiga; títulos novos têm prioridade e são
  marcados exibidos somente com hero visível. Próximos lotes atendem também
  lançamentos além dos primeiros dez. Removidos da fonte não entram na seleção.
- Para cumprir “sempre novo lançamento”, novos itens da categoria Lançamentos
  de anos anteriores/ano ausente entram como extras (até cinco por kind), sem
  reduzir as dez opções atuais. Extras deixam o pool após exibição.
- Celular: hero Home vertical 2:3 e variante TMDB diferente do pôster padrão/
  categoria quando fornecida. Tablet/TV, heroes Filmes/Séries e detalhes mantêm
  backdrops horizontais. Nenhuma imagem da categoria é modificada.
- TMDB: detalhes com append_to_response=images e include_image_language=pt,en,null;
  filtrar dimensões/ratio verticais, preferir pt/sem texto/en, máximo oito URIs.
  Comparação por file path ignora resolução da URL para não confundir resize
  com imagem alternativa. Falha de variante tenta próxima; sem alternativa
  válida usa pôster vertical padrão; sem imagem, placeholder.
- Cache público TMDB v2 invalida versões incompletas; limite 512 entradas,
  TTL anterior, duas requisições ativas, timeout/fila/cooldown preservados.
  Nenhum segredo de fonte/dispositivo/stream nesse cache ou requests TMDB.
- Controles anterior/próximo/pausa e contador; botão de detalhes mantém DOM/foco.
  Rotação dez segundos, pausa com foco/hover, movimento reduzido, página oculta
  ou hero fora da viewport. Durante I/O controles preservam foco (aria-disabled).
- Sem IndexedDB/rede utilizáveis: fallback local limitado do ano corrente,
  sem travar shell/boot e sem falsa fabricação de cota/ano.

## Testes/fluxo — PASS local

- scripts/test-c11-home-hero.mjs: 5+5/ano vigente, aleatoriedade/segmented late
  items, uma leitura de segmento ativa, dedup/reordenação, 21 lançamentos novos
  em vários lotes, remoção/snapshot/cancelamento, doze lançamentos anteriores
  extras preservando 5+5, anos ausentes em Lançamentos e outras categorias,
  fallback limitado, perfil phone/tablet/TV, variante/erro/cache/migração.
- scripts/test-c11-source-first-tmdb-artwork.mjs: todos marcadores PASS, sem
  edição/relaxamento da suite anterior. Source-first/cards/URLs/overlays/TMDB
  cache/fila e heroes horizontais das demais páginas preservados.
- npm run catalog-ui:check: PASS. Typecheck/build com prebuild obrigatório: PASS.
- Lock oficial executado antes do patch e em prebuilds: 22+27 cenários e nove
  controles negativos, PASS. Lock após build/Gradle obrigatório antes da entrega.
- Navegador Chrome, perfis de UA/viewport phone 390x844, tablet 1280x800,
  Fire TV 960x540, componentes reais + fonte/API sintéticas + imagens públicas:
  5+5 opções, celular 358x537 (2:3), alternativa distinta, recuperação após
  onError, controles dentro do hero, seleção abre o item realmente visível.
  Atualização de fonte coloca novo lançamento primeiro. Novo lançamento anterior
  aparece com onze opções e ainda cinco filmes + cinco séries atuais.
  Tablet/TV permanecem horizontais; setas/Enter alcançam controles e mudam item.
  Botão de detalhes preservado; rotação automática/pausa por foco/pausa explícita
  confirmadas. Zero console errors no fluxo observado.
- Movimento reduzido do navegador inicialmente impediu rotação conforme política;
  emulação no-preference confirmou rotação real e foco estável. Fixture curta
  não permitia ocultar hero por scroll; ampliada somente em tmp para validar
  esse cenário. Não confundir esses controles de ensaio com regressão funcional.
- Smoke real API: filme público TMDB550 e série1399, oito variantes válidas
  retidas por obra, variante diferente em ambas, imagens escolhidas HTTP200.
  Sem catálogo privado/credenciais em outputs; chave real somente em RAM/build
  ignorado. Requests de fixture registrados apenas por pathname público.

Documentação primária consultada:
https://developer.themoviedb.org/reference/movie-images
https://developer.themoviedb.org/reference/tv-series-images
https://developer.themoviedb.org/docs/image-languages

Revisão React: hooks antes de early-return, dependências/cancelamento por snapshot,
limpeza de timers/listeners/observer, estado identificado por item/geração,
fetch separado/cacheado, no máximo vinte opções e um hero; botões nomeados,
pausa/sem foco perdido e movimento reduzido. Sem bibliotecas/dependências novas.

## Build/instalação — concluídos

Build final tsc/Vite, Capacitor sync e Gradle assembleDebug: PASS.
testDebugUnitTest: execução inicial PASS; entradas Java inalteradas, relatórios
JUnit existentes com 110 testes, zero falhas/erros/skips; não são teste visual
do novo hero. Lock final após o último build/Gradle: PASS, 22+27 cenários e
nove controles negativos. Nenhuma mudança funcional após esse lock.

APK raiz/Gradle idênticos, 9.215.486 bytes, SHA-256:
434B5936807C1EDA2095A07D184AC4DBCA4DAA9A9F672E3C7AB34BAC92B24C5A.
Package com.xandeflix.prebuilt, versionCode1/versionName1.0, minSDK23,
targetSDK35; assinatura compatível com os três APKs anteriores.
Cinco assets do dist comparados byte a byte com assets/public do ZIP: PASS.
Config Capacitor standalone: appId correto, sem server.url remoto.
Backups anteriores e relatórios sanitizados apenas no tmp ignorado.

Ordem real de instalação: Fire Stick AFTSSS, tablet SM-X610, celular SM-S926B.
Todos user0 e package existente, adb install -r Success.

| Aparelho | Instalação/hash APK | Arquivos privados | Catálogo | Estado nativo | Dados/firstInstallTime |
| --- | --- | ---: | ---: | ---: | --- |
| AFTSSS | PASS | 458 | 436 | 5 | PASS |
| SM-X610 | PASS | 524 | 505 | 5 | PASS |
| SM-S926B | PASS | 526 | 508 | 5 | PASS |

Comparação de árvores privadas após force-stop e antes/depois da atualização
exclusivamente em RAM. Sem fingerprints/conteúdo privado em relatórios.
Sem uninstall, clear, reset, rotação ou abertura automática do app.
Estado preservado não equivale a homologação de imagens/playback no aparelho.

Teste final de hero fora da viewport: rotação pausada e zero console errors.
Três sessões de navegador de ensaio fechadas; servidor temporário encerrado.
Avisos preexistentes de bundle/flatDir/imports preservados, sem relaxar checks.

## Limites práticos

A cota requer pelo menos cinco obras elegíveis de cada tipo na fonte; ano
inexistente precisa de correspondência segura TMDB. Não inventar obras/ano.
Imagem diferente depende de variante TMDB utilizável para a obra.
Conteúdo novo entra após sincronização e promoção do catálogo existente;
nenhum push/polling adicional ou SLA de tempo foi criado. Índice usa espaço
privado local e primeiro preenchimento ocorre em segundo plano; memória fica
limitada, mas custo físico desse preenchimento ainda não é benchmark/SLA.
Instalação/preservação não certificam capas/ativação/playback físico; app não
será aberto automaticamente. Projetos histórico/2.0, fonte/licença e backend
permanecem sem escrita neste ciclo.
