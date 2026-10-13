# C11 — Hero Home do celular e lançamentos do catálogo local

## Autorização/preflight — 2026-10-06

Usuário solicitou hero vertical alternativo em celulares, seleção aleatória de
pelo menos cinco filmes e cinco séries do ano vigente, renovação após conteúdo
novo do gestor da fonte e instalação ao final no Fire Stick 192.168.3.103,
tablet Samsung SM-X610 e celular SM-S926B. Autoriza patch/build e install -r
recuperável nesses três alvos, preservando todos os dados do package
com.xandeflix.prebuilt. Não autoriza reset/uninstall/downgrade ou Git/backend.

Workspace/top-level C:/Xandeflix/xandeflix-prebuilt-c11-main, Git próprio,
origin https://github.com/xandeflix2/xandeflix-prebuilt.git, main, HEAD
61ec00902be5d0037adf79c68b3a8624b3a2bd6e. AGENTS, Architecture/Execution,
Source Data Boundary e lock lidos; dirty conhecido congelado em baseline.
CURRENT_GATE=NONE, NEXT_GATE_STARTED=NAO; sem commit/push/PR.
Três alvos aparecem no ADB; validar novamente modelo/SDK/assinatura antes de
cada install. Serial mantido em memória. APK anterior salvo em tmp ignorado.

## Especificação anterior ao código

- Home: carrossel de opções locais do ano corrente calculado pela data do
  aparelho, buscando cinco filmes e cinco séries por janela quando existentes
  na fonte. Não inventar obras nem preencher a cota com anos anteriores.
- Leitura segmentada somente após montagem da Home, sequencial e cooperativa,
  um segmento por vez. Índice privado separado em IndexedDB guarda chaves de
  conteúdo vistas e opções elegíveis; memória limitada a segmento/janela.
  Nenhum fetch de playlist, alteração de importador, catálogo, boot ou autoridade.
  Esta necessidade substitui exclusivamente a restrição anterior de escolher
  hero apenas do first-fold; não autoriza materializar o catálogo inteiro em RAM.
- Ano via campo da fonte/título normalizado; para ano ausente, resolver metadados
  TMDB até completar a cota, e novos candidatos de Lançamentos. Mesma fila
  limitada de duas requisições, timeout/cache/cooldown; sem API discover/popular.
- Identidade do conteúdo por kind+título/ano normalizado ou TMDB ID, independente
  dos IDs posicionais M3U, de modo que reordenar a fonte não simule novos títulos.
- Após novo snapshot promovido, recompor o índice e descartar resultados antigos.
  Títulos novos elegíveis têm prioridade nas próximas janelas e deixam essa
  prioridade após exibição. Cada janela tem até cinco de cada kind; próximos
  lotes permitem exibir também novos lançamentos além dos primeiros dez.
  Aleatoriedade por visita/lote; somente conteúdo do snapshot ativo pode aparecer.
- Novo conteúdo entra após a sincronização existente concluir e promover snapshot;
  não existe push imediato garantido sem atualização real da fonte no aparelho.
- Celular identificado por perfil visual/UA, separado de tablet/TV. Somente hero
  Home usa imagem vertical TMDB; tablet/TV e heroes Filmes/Séries/detalhes
  continuam horizontais. Request de detalhes TMDB inclui imagens alternativas.
  Preferir pôster vertical diferente do pôster padrão e da URI/path da categoria;
  línguas pt/en/sem texto, dimensões/ratio válidos. Não fabricar variante: sem
  alternativa utilizável usar pôster vertical TMDB disponível; sem imagem, placeholder.
- Cache público TMDB migrado de versão sem reaproveitar entradas incompletas;
  lista de alternativas curta, validada e com TTL/limite existentes. Nenhum dado
  de fonte/dispositivo/stream em requests, logs ou cache público do TMDB.
- Carrossel com anterior/próximo/pausa, contador, botão de detalhes estável e
  acessível. Rotação a cada dez segundos; pausa com foco/hover, página oculta,
  fora da tela e preferência por movimento reduzido. Não recriar botão focado.
  Celular mantém proporção vertical 2:3; ações/texto legíveis sem cortar controles.
- Sem dependências novas. Falhas do índice/rede não derrubam Home: fallback local
  do ano corrente já materializado, sem mutação do catálogo/identidade/licença.

## Allowlist

src/catalog/home-hero*.ts; src/ui/hooks/useHomeHero.ts;
src/ui/components/{Hero,HomeHero}.tsx; src/ui/pages/HomePage.tsx;
src/artwork/tmdb-metadata.service.ts; src/index.css;
scripts/test-c11-home-hero.mjs; scripts/test-c11-source-first-tmdb-artwork.mjs
(somente adaptação justificada ao cache/imagens novas, sem relaxar regressões);
este plano; docs/evidence/C11_HOME_HERO_CURRENT_YEAR.md;
acréscimos a docs/{DECISIONS,STATUS,EVOLUTION_REPORT,ERRORS_AND_BLOCKERS}.md;
saídas build/Capacitor/Gradle usuais, APK raiz e tmp ignorados.
Nenhuma alteração de importação, source fetch, activation/native/player/backup,
configuração, schema de catálogo, backend, projeto histórico ou Xandeflix 2.0.

## Aceitação e entrega

Lock antes/depois/prebuild/antes de cap sync/Gradle/entrega; suite anterior de
capas e suite nova com 5+5/ano/reordenação/dedup/novo snapshot/remoção/cancelamento/
novos lançamentos além da primeira janela/alternativas/caches e limites.
Typecheck/build, revisão React e navegador com componentes reais/dados sintéticos
para celular/tablet/TV, foco/pausa/navegação/detalhes e fonte atualizada.
Smoke TMDB apenas de obra pública, sem expor chave real ou catálogo privado.

APK: validar assinatura/package/SDK/standalone e assets dist byte a byte, salvar
backups dos três APKs instalados, force-stop somente package autorizado, comparar
privados e catálogo antes/depois só em RAM, install -r Success, hash público do
APK instalado e firstInstallTime preservados. Ordem Fire Stick, tablet, celular.
Não abrir app automaticamente nem alterar fonte/licença para produzir evidência.
Proveniência: congelados fora da allowlist intactos; memórias só por acréscimos.

## Precisão de “sempre novo lançamento” — antes do refinamento

A cota do ano vigente permanece cinco filmes + cinco séries. Além dessa cota,
novos itens da categoria Lançamentos devem aparecer com prioridade mesmo se
forem de ano anterior ou ainda não possuírem ano resolvido. Usar até cinco
extras por kind na janela (máximo vinte opções), sem reduzir as dez atuais.
Extras deixam a seleção após exibição, mantendo sua chave vista para evitar
falsos novos; demais novos aparecem nos próximos lotes. Ano ausente não é
contado na cota atual. Este refinamento implementa o “sempre” solicitado sem
inventar ano ou excluir o lançamento fornecido pelo gestor.
