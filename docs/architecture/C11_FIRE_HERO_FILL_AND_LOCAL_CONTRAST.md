# C107 — preenchimento e contraste local do hero no Fire Stick

## Autorização e preflight — 2026-10-14

Usuário relata faixas vazias laterais e escurecimento de toda a imagem nos
heroes do Fire após C106, e autoriza ajustar quadro ou crop e remover filtro
geral mantendo legibilidade, preferindo fundo esfumaçado elíptico atrás dos
caracteres. Escopo Fire Stick, Home/Filmes/Séries e categorias em Ver todos
que já têm Hero; não criar hero em coleções que só possuem grid.

Clone ativo independente C:\Xandeflix\xandeflix-prebuilt-c11-main, main,
HEAD0f68f169f7728fae17c8311832b7643629e97a02, origin esperado, status limpo.
AGENTS/Architecture/Execution/Activation Lock lidos. Ciclo local C107 autorizado,
CURRENT_GATE=NONE, sem iniciar Gate funcional. C100–C106 publicados/preservados.
Autorização anterior para atualização-r do Fire USB G071CQ070344374G/AFTSS
persiste neste refinamento; alvos novos/tablet USB atual não são operados.
Build/APK recuperável necessário para aplicar no app; não limpar dados.
Publicação C100–C106 já concluída não inicia push automático deste patch.

## Especificação anterior ao código

- Manter dimensões C106 do quadro, contorno1px, metadados/ações/indicadores
  internos, menu56px, fonte Live10px e timer10s. Corrigir somente a pintura.
- Trocar contain por cover no Fire para imagens de TODOS os hero-banner,
  incluindo CategoryHero de Ver todos. Mesma imagem/URI/cache; crop proporcional
  sem distorcer, posição horizontal central e vertical35% para preservar mais
  da região superior. O selector não depende exclusivamente das3 páginas raiz.
- Desativar gradiente sobre toda a imagem SOMENTE Fire. Imagem sem brightness,
  opacity reduzida, blur ou filtro. Tablet/celular/TV genérica mantêm regras.
- Criar fundo radial/elíptico com bordas suaves atrás do bloco hero-copy e das
  ações/status. Pseudo-elementos locais não interativos, isolados atrás de
  texto/botões, sem alargar layout, capturar foco ou criar uma placa escura em
  toda a capa. Preservar cor branca/clara/dourada dos textos, sem contorno de
  caracteres; testar contraste em imagem sintética muito clara. Sem filter ou
  backdrop-filter, novo canvas no runtime, cache, chamada remota ou dependência.
- Assistir, Ver Detalhes, swipe, autoplay/dots, D-pad, foco, C9 e transição Live
  permanecem byte-idênticos; nenhum arquivo funcional TSX/Android é alterado.

## Allowlist e aceitação

src/index.css: apenas regras Fire de fit/posição/overlay/contraste local.
Este contrato, evidência C11_FIRE_HERO_FILL_AND_LOCAL_CONTRAST.md e registros
STATUS/EVOLUTION_REPORT/ERRORS_AND_BLOCKERS. Helpers/fixtures/provas sintéticas
privados em tmp/c107-fire-hero; saídas usuais web/Capacitor/Gradle ignoradas.
Não editar teste antigo para aceitar regressão nem adicionar teste que só
replique CSS. Conferência visual/geométrica em navegador real com Hero real e
imagens sintéticas, nos4 contextos e outros perfis. Verificar bordas preenchidas,
região livre de texto com cor original e contraste local sobre branco, CTA/
foco/hit testing preservados. Regressões hero/gesto/D-pad existentes e lock.

Antes/depois verificar proveniência por digest dos demais arquivos rastreados,
APK C106 recuperável e HEAD. Build/7 assets/config/assinatura conferidos, sem
alterar versão local19/1.0.19 ou publicar updater. Atualizar-r SOMENTE Fire
conectado após checks, preservar identidade/chave/ativação/fonte/catálogo e
dados privados, conferir UI normal e categorias sem exportar mídia/segredos.
Outros perfis validados em fixture; não instalar no tablet/celular nesta etapa.
Se alvo faltar, entregar código/artefato e informar instalação pendente.

`CURRENT_LOCAL_CYCLE=C107_IMPLEMENTATION; NEXT_GATE_STARTED=NAO;
GIT_COMMIT_AUTHORIZED=NAO; GIT_PUSH_AUTHORIZED=NAO; GIT_PR_AUTHORIZED=NAO`.

## Revisão visual solicitada durante o ciclo — antes do novo CSS

Usuário rejeitou o primeiro fundo como borrão preto e pediu algo muito mais
discreto/transparente, único para o conjunto, permitindo que botões usem seu
preenchimento próprio. Reforçou gradiente radial escuro no centro e mais claro
nas extremidades. Esta revisão supersede opacidade/ausência de text-shadow do
primeiro candidato, não cover/quadros/foco/contorno ou outras invariantes.

Usar UM pseudo-elemento em hero-content, sem fundo individual em hero-copy,
hero-actions ou status. Centro com opacidade máxima.52, transição.38/.18 até
zero nas bordas; nenhum blur/filter/corte por border-radius elíptico. Botões
mantêm preenchimento próprio e não recebem nova placa escura. Texto claro com
sombra curta suave de leitura e stroke0, sem borda dura em caracteres; ano/
duração/sinopse podem usar tom branco já existente no tema. Critério principal
é legibilidade visual com capa clara mantendo imagem perceptível sob o fundo;
contraste5,9 do candidato escuro rejeitado não certifica este novo estilo.

Permitir prévia reversível do CSS no WebView do MESMO Fire via CDP antes de
rebuild, sem dados/segredos/JS funcional, para aplicar a correção visual enquanto
APK é preparado. Após instalação, conferir ausência dessa sobreposição de
diagnóstico e usar apenas assets do APK. Preservar primeiro candidato privado
como evidência rejeitada; entrega final será outro digest. Não alterar tests
antigos; nova QA visual privada separada para estilo revisado.

### Refinamento do botão Ver Detalhes — antes do CSS

Usuário pediu reduzir a transparência do fundo de Ver Detalhes preservando
o desfoque. Somente nesse botão do hero Fire, elevar o preenchimento branco
de .12 para .24 e aplicar backdrop-filter blur(6px), com prefixo WebKit e
fallback de preenchimento quando o desfoque não for suportado. Esta exceção
expressamente solicitada supersede a proibição de backdrop-filter apenas
para o botão; imagem, gradiente radial e demais áreas continuam sem blur.
Manter dimensões, borda, foco, eventos e preenchimento de Assistir. Nenhum
outro perfil muda. Confirmar no WebView físico suporte/pintura e hit test.

Na fixture branca, preenchimento branco .24 não manteve o rótulo legível.
Antes do CSS final, substituir exclusivamente o preenchimento desse botão
por cinza rgba(20,27,40,.62), mantendo blur(6px), cor branca e borda original.
Esse fundo pertence ao próprio botão; não acrescentar outra nuvem radial.
Geometria/eventos/foco não mudam. Contraste numérico da nuvem translúcida,
sem considerar sombra de texto, será observado sem alegar certificação4,5.

### Menu Fire e largura de ações Fire/tablet — antes do CSS

Pedidos adicionais autorizam somente Fire: ícones de navegação24→20px,
gap vertical6→4px, células48→44px sem reduzir área de foco abaixo44px.
Manter menu56px, marca, ordem, handlers e rotas. Sem mudar menu tablet/TV/celular.
Nos heroes já existentes do Fire e do tablet, ampliar horizontalmente Assistir
e Ver Detalhes: padding lateral20px/min-width110px no Fire; padding28px/
min-width150px no tablet. Preservar altura, gap entre botões, alinhamento,
timer, indicadores e todos os eventos. Não alterar outros botões do app.
Este pedido supersede invariância de largura das ações e pintura tablet
apenas nessa largura; crop/gradiente/desfoque continuam exclusivos do Fire.
Allowlist funcional continua src/index.css. QA com Header e Hero reais,
perfis tablet horizontal/quadrado/vertical e Fire, sem overflow/CTA coberto.
Instalação autorizada atual continua somente Fire USB; tablet será conferido
em fixture e recebe o mesmo artefato para instalação posterior autorizada.

### Selo Novidade — antes do CSS

Último pedido autoriza padronizar Novidade nos metadados do hero, em todos
os perfis, com Filme/Série: compartilhar fonte, peso, altura de linha,
padding, raio e espaçamento de letras, inclusive override TV/Fire existente.
Largura segue o texto do rótulo, sem truncá-lo. Usar seletores compartilhados
hero-badge/hero-content-badge; remover regra dimensional divergente.
Não mudar cálculo/eligibilidade/texto do selo, dados, nem selos nos cards.
Fixture deve renderizar Novidade e comparar métricas dos dois selos em todos
os perfis. Essa padronização supersede invariância visual dos selos fora Fire;
demais pintura/geometria fora Fire e largura de CTA tablet ficam preservadas.

### Gênero e categoria de séries no Fire — antes do código

Usuário pediu substituir Geral pelo gênero real e mostrar categoria local
da série junto ao selo de novidade no Fire, por exemplo Netflix/Prime Video.
Boundary de Source Data relido. Somente Hero.tsx passa a integrar allowlist
funcional além de index.css; teste de integração de apresentação novo autorizado
em scripts/test-c107-fire-hero-metadata.mjs. Demais984 arquivos de baseline
continuam byte-idênticos; preservar hash anterior de Hero e registrar digest
novo explicitamente autorizado, sem reclassificar alterações alheias.

Mesmo guard de AppShell: isTelevisionPresentation e UA AFT. Descartar rótulo
exato Geral da lista de gêneros só Fire; usar gênero real da source quando
presente, senão enrichment público opcional já existente. Permitir consulta
existente mesmo quando Geral preenchia campo; cache/fila/identidade/limites
continuam do serviço atual. Ausência de gênero real não inventa classificação,
não mostra Geral e não bloqueia imagem/Home/playback. Outros perfis preservados.

Para séries Fire, renderizar a primeira categoria não vazia/não Geral do
view-model local junto ao selo Novidade (se houver); sem inferir plataforma,
sem fetch de catálogo, sem alterar badge/eligibilidade/IDs/snapshot. Nova
categoria usa métricas de selo compartilhadas, texto limitado100 caracteres
e meta pode quebrar linha no Fire para não ultrapassar hero. Testes cobrem
Geral→metadata, source real prioritária, metadata ausente, troca de item,
categorias de série vs filme, outros perfis e ações/gestos consolidados.

### Voltar pelo controle nas páginas de filmes/séries em TV — antes do código

Último pedido autoriza remover Voltar visual no topo do hero nas páginas
movies/series e movie-detail/series-detail, somente apresentação de televisão
detectada pelo guard atual: Fire/Android TV/Tizen/webOS. AppShell.tsx integra
allowlist funcional;983 arquivos restantes de baseline byte-idênticos.
Ocultar por não renderizar toolbar e impedir botão equivalente no Header
apenas nessas rotas TV. Não mudar guard de plataforma, pilha de histórico,
onBack, lifecycle Live/C9/player ou listener de controle. Tablet/celular e
outras rotas continuam com Voltar. Testar perfis e navegação real por Back.
Teste novo acima também cobre AppShell/Header reais e todas essas rotas.

### Cor ambiente limitada ao hero — antes do código

Pedido posterior autoriza em todos os perfis limitar a cor extraída da capa
ao entorno do hero, com degradê contínuo até fundo escuro das categorias.
Adicionar useImmersiveArtwork.ts à allowlist funcional (982 demais arquivos
baseline preservados) e scripts/test-c107-artwork-halo.mjs à allowlist de testes.
Paleta atual/cache48/canvas24/fonte/imagem permanecem inalterados.

Trocar background-color uniforme da página por fundo escuro constante e
camada linear sem repetição, com cor ambiente no topo, base60%, escuro100%.
Altura da camada termina32px após o fim do hero relativo à página. Hook atual
mede só hero-banner ou detail-hero-wide/series-phone-hero (imagem como fallback),
define --artwork-halo-height e recalcula no resize/observação já existente,
coalescendo em RAF. Limpar variável/listener junto das propriedades atuais.
Não acrescentar fetch/decode/canvas/scroll handler, pseudo acima do conteúdo,
posição fixed, nem alterar dimensões. Fim do degradê deve ter exatamente a
mesma cor do fundo abaixo, sem linha horizontal. Confirmar pixels antes/no/
após término em fixture e limite geométrico no Fire físico.

### Título/contagem acima do hero nas páginas de TV — antes do código

Pedido adicional, em continuidade às páginas internas em TV/controlador,
autoriza ocultar page-header (título/quantidade) de movies/series e categorias
válidas para hero ser primeiro conteúdo no topo. AppShell marca apresentação
television já calculada; não altera classificação. CSS utiliza essa classe,
sem :has para compatibilidade. CatalogBrowsePage.tsx integra allowlist só
para marcar categoria indisponível, preservando seu título/mensagem de erro
quando não existe hero.981 arquivos restantes da baseline preservados.
Não remover títulos/contagens das faixas abaixo, headings do próprio hero,
filtros, mensagens de loading/falha ou cabeçalhos de celular/tablet.
Dimensões do hero mantidas; somente sua posição sobe ao remover cabeçalho.
useLayoutEffect/foco em coleção, useDpadNavigation/scroll-margin/histórico
ficam byte-idênticos. QA reavalia topo/foco/D-pad e Back com cabeçalho ausente.

### Contraste local também tablet/TV/telas quadradas — antes do CSS

Pedido posterior estende remoção de escurecimento global e contraste radial
discreto do Fire aos tablets, apresentação TV (Android TV/Tizen/webOS) e
touch quase quadrado já identificado pela regra existente (Z Fold aberto).
AppShell marca app-shell--square-display a partir de squareLive já calculado;
não alterar detector/breakpoints/navegação/layout Live. CSS partilha overlay
desativado, nuvem única .52/.38/.18→0, texto/sombra e Ver Detalhes fosco entre
Fire/television/tablet/square-display. Não aplicar novo blur à imagem.
Crop cover continua exclusivamente Fire; demais fit/dimensões/layouts mantidos.
Celular estreito/normal conserva tratamento anterior da capa. Testar mudança
de perfil/orientação e contraste local nos novos alvos. Alteração visual
autorizada supersede QA de pintura tablet/TV anterior, nunca preservação de
ações/touch/D-pad/foco/dados. APK Android não instala em Tizen/webOS; nesses
alvos somente comportamento do front-end/guard fica coberto por fixtures.

### Preparando reprodução somente no botão — antes do código

Pedido mais recente autoriza remover aviso pendente repetido abaixo de
Assistir, em heroes e detalhes filme/série em todos os perfis. Acrescentar
useHeroPlayback.ts, MovieDetailPage.tsx e SeriesDetailPage.tsx à allowlist
somente para inicializar mensagem como null em vez do texto de preparação;
busy/resolving, label/disabled do botão, handlers/C9/player e mensagens de
erro/indisponibilidade/sucesso ficam intactos.978 demais arquivos de baseline
preservados. Novo teste permitido scripts/test-c107-playback-pending-message.mjs
executa callbacks reais com promessa pendente e falha/sucesso, sem fonte real.
Nenhuma regra CSS oculta avisos indiscriminadamente e nenhum erro é silenciado.

### Correção de rolagem interna encontrada em QA — antes do CSS/hook

Fixture TV usa page-container com viewport/overflow próprio. Background scroll
padrão acompanha a caixa, não o conteúdo; mudar para background-attachment:local
e somar page.scrollTop ao limite medido para não recalcular altura menor quando
uma imagem carrega com página já rolada. QA raster deve rolar a caixa e medir
dentro da viewport visível; pixel fora da página captura shell, não categorias.
Novo teste de hook cobre página já rolada. Sem listener adicional de scroll.

### Configurações em quatro colunas — antes do CSS

Novo pedido autoriza tablet e Fire: settings-sections grid repeat(4,minmax(0,1fr)),
linhas automáticas pelo número de seções, sem cards vazios. SettingsPage.css
integra allowlist (977 demais arquivos de baseline). Reduzir gap/padding para
quatro cards caberem; min-width0, texto/botões podem quebrar linha dentro do
card sem overflow. Não criar funções/configurações novas nem mudar ações/
atualizador/ativação ou menu. Celular/TV genérica conservam layout atual.
QA com três itens atuais e cinco/nove itens sintéticos em linha2/3, tablet
horizontal/vertical/quadrado e Fire; navegação continua no motor D-pad atual.

### Home explícita e retorno à categoria — antes do código

Pedido autoriza em todos os perfis: clique Home no menu sempre mostra/foca
hero Home; Back de detalhe restaura a categoria/posição de origem. Distinguir
intenção Home de pop no histórico, mantendo commitRoute/barreira Live/C9 e
listeners Android atuais. Acrescentar App.tsx, MediaCard.tsx, CatalogGrid.tsx
à allowlist; novo hook permitido useCatalogReturnNavigation.ts.974 demais
arquivos de baseline preservados. Teste/QA de retorno autorizados em script
test-c107-catalog-return-navigation.mjs e helpers sintéticos privados.

Memória local somente de apresentação, RAM, no máximo16 destinos, vinculada
à geração do catálogo e route view/itemId. Guardar chave opaca do card, linha,
offsets vertical/horizontal e quantidade visível de grid; não guardar dados
de mídia, source, credenciais, catálogo completo ou DOM de páginas desmontadas.
MediaCard recebe atributo de chave local, sem alterar cliques/artwork/IDs.
Captura de clique apenas identifica origem em touch e controle. No Back,
restaurar scroll da linha imediatamente, aguardar card assíncrono com observer/
RAF bounded12s, cancelando ao receber nova navegação/input ou geração mudar.
Fallback para linha correspondente se item não existe; não focar item stale.
Clques Home na Home atual também funcionam, sem duplicar histórico. Hero
pronto ganha foco em Assistir/Ver Detalhes sem executar player.

Grid retornado pode recuperar apenas a quantidade já visualizada usando
o mesmo loadNext local sequencial/guardado; não baixar fonte nova nem alterar
leitor/ordem/index/cache. Eventos internos de apresentação delimitam expansão,
cancelamento e conclusão; limpar listeners ao desmontar. Restaurar foco depois
do reset inicial existente de coleção, sem remover ou relaxar esse reset.
Não reter páginas ocultas nem criar loops permanentes. Tests cobrem Home,
Back/linha/card tardio/grid, snapshot/input/cancel/cleanup e barreira Live.

### Transportes de instalação confirmados pelo usuário — 2026-10-14

Usuário informou celular e tablet conectados por USB, supersedendo exigência
anterior de Wi-Fi para tablet e restrição de instalação somente Fire deste
ciclo. Atualização-r autorizada, sem reset, nos alvos USB já identificados:
Fire G071CQ070344374G/AFTSS; celular RXGYB03FL4W/SM-S926B; tablet
RX2X301Q3KY/SM-X610. Antes de instalar, confirmar serial/modelo/assinatura,
congelar hashes privados e conferir mesmos bytes/UID/firstInstallTime antes
de abrir. Nunca operar alvo desconhecido ou alterar identidade/ativação.

### Cor distinta para categoria da série — antes do CSS

Pedido posterior autoriza background azul #1d4ed8 em hero-category-badge,
diferenciando-o de Filme/Série/Novidade vermelhos. Preservar texto branco,
dimensões, categoria real/guard Fire e todos os metadados. Último APK instalado
dae36bdfee636d4f54e08e64c3d0612ca54f68989c9e13bd4bf32108400ab413 é candidato
anterior a esta cor; rebuild final e updates-r autorizados nos mesmos três
USB com nova conferência de assinatura/assets/dados. Não publicar updater.

### Categoria sem prefixo em todos os dispositivos — antes do código

Pedido seguinte estende o selo azul de categoria de série a todos os perfis,
incluindo celular/tablet/TV/Tizen/webOS. No Hero compartilhado remover somente
o prefixo inicial Séries | (com/sem acento, maiúsculas/minúsculas e espaços),
exibindo o restante da categoria local, por exemplo NETFLIX/PRIME VIDEO/HBO.
Não inferir plataforma nem modificar categorias, view-model ou catálogo.
Escolher primeiro rótulo útil após limpeza; vazio/Geral continua omitido,
texto limitado100 caracteres, escape React e exclusão de filmes preservados.
CSS azul/quebra de linha passa do guard Fire ao hero compartilhado, mantendo
dimensões de Filme/Série/Novidade. Regra de gênero real continua só Fire.
Teste existente de metadados cobre normalização/imutabilidade e todos os perfis.
Rebuild substitui candidato azul ainda não instalado; mesmos três updates-r
autorizados. Demais allowlists, lock, dados, Git e restrições permanecem.

### Critério de QA horizontal com ordem aleatória consolidada

QA físico identificou reordenação de cards ao remontar faixas pelo seed já
existente em MediaRail. Retorno deve manter linha e foco do mesmo card; offset
horizontal original é preservado quando deixa esse card visível. Se a ordem
existente muda, scrollIntoView pode ajustar o offset para revelar o card.
Não congelar ordem aleatória nem alterar MediaRail/catalog/category-presentation.
QA distingue ordem alterada de regressão: exigir mesma linha/card e card
inteiro visível horizontalmente quando o offset precisa ser ajustado. Teste
de offset exato com ordem estável continua obrigatório e já passa.

### Fontes menores Fire e plataformas TMDB — antes do código

Usuário solicita selos/ano menores só Fire: hero-badge/content-badge9px,
hero-year10px; manter padding/legibilidade/foco e demais perfis. Solicita
disponibilidade de streaming abaixo da capa nas páginas de filme/série,
usando TMDB, e logos em lugar de nomes no selo de categoria da série.
Pesquisa primária em 2026-10-14 confirmou movie/{id}/watch/providers,
tv/{id}/watch/providers e watch/providers/tv, por país, com logo_path e
atribuição obrigatória JustWatch; não fornece stream nem deep link completo.
Referências: https://developer.themoviedb.org/reference/movie-watch-providers,
https://developer.themoviedb.org/reference/tv-series-watch-providers,
https://developer.themoviedb.org/reference/watch-provider-tv-list.

Implementação opcional isolada em src/artwork/tmdb-watch-providers.service.ts,
src/ui/hooks/useWatchProviders.ts e src/ui/components/WatchProviders.tsx.
Usar Brasil (BR), ID TMDB confirmado pelo matcher atual sem modificá-lo.
Detalhes wide recebem componente abaixo do poster; PhoneMovieDetail.tsx e
PhoneSeriesDetail.tsx entram na allowlist para mesmo componente abaixo da
capa/trailer existente. Não duplicar capa nem modificar trailer/player/ações.
Hero.tsx usa componente novo PlatformCategoryBadge.tsx para logo quando há
correspondência exata/alias explícito no diretório público de plataformas
TMDB; nomes desconhecidos/falha de imagem conservam texto azul acessível.
Diretório de logos não determina disponibilidade ou origem do conteúdo.
Lista de disponibilidade vem exclusivamente da resposta BR do título atual,
com grupos assinatura/grátis/aluguel/compra, atribuição JustWatch visível;
não mostrar falsa disponibilidade quando faltar dado/ID/consulta falhar.

Serviço novo compartilha somente resolver público TMDB existente; não editar
tmdb-metadata.service.ts, catálogo/readers/source/Control Plane/env/backend.
Somente ID/kind e rótulo de plataforma público em requests; nunca source URL,
credenciais de mídia, snapshots ou catálogo em payload/log. Credencial TMDB
existente usada em memória, sem ler/exibir .env. Cache público local limitado
256 títulos/um diretório, TTL24h/7dias (ausência1h), reconstrução allowlist,
URLs image.tmdb.org/t/p/w45 e link themoviedb.org permitidos. Requisições
deduplicadas, no máximo1 ativa/fila32, timeout8s e cooldown; sem dependência.
Home não espera logos: consulta adiada2s, detalhe250ms, troca/unmount cancela
atualização UI e falha mantém funções existentes. Sem prefetch de catálogo
ou request novo em cards. Logo quadrado pequeno acompanha altura do selo,
sem distorção; ano/selos Fire ficam menores, handlers/swipes preservados.

Teste funcional novo scripts/test-c107-watch-providers.mjs autorizado para
regionalidade/modos, validação/limites/cache/dedupe/timeout/stale UI/logo/
fallback/atribuição, sem API real ou mídia. Fixtures antigos que carregam
Hero podem receber somente stub do componente novo, preservando assertions;
não relaxar critérios. scripts/test-c106-hero-artwork-tap.mjs entra allowlist
apenas para esse adaptador.972 demais arquivos baseline byte-idênticos.
APK8aa943a82c2bef6d1c720487df3c947c699eb0a7ebb2aa96b376a1ecfb3d5a81,
instalado e QA três USB, é recuperação anterior ao novo recurso. Rebuild e
update-r dos três alvos permanecem autorizados. Nenhum novo Gate/Git/reset/
publicação/updater/garantia de playback ou startup90s.

### Rotatividade das faixas Destaque e menu translúcido — antes do código

Usuário solicita variedade efetiva em Filmes/Séries Destaque da Home: causa
observada é slice(0,20) dos mesmos registros seed. Autoriza HomePage.tsx e
novo hook useFeaturedRotation.ts: seleção limitada20 por tipo, amostragem
local de duas páginas10 em segmentos distribuídos do manifest pelo leitor
SegmentedBrowseService existente, count:false/signal/snapshot guard, sem
fetch de source ou scan completo. Pool inicial local pronto não espera I/O.
Memória RAM limitada a uma geração/dois tipos, últimas40 chaves por tipo
para evitar repetição quando há alternativa. Lote de cada visita fica estável;
Back de detalhes reutiliza lote, não desloca o card. Clique explícito Home
solicita outro lote via função de apresentação chamada em App.tsx; troca de
snapshot cancela lote anterior. Releitura somente desse lote, sem timer de
substituição enquanto usuário navega/faixa em foco, sem alterar lançamentos,
recentes, autoplay10s, Ver todos, C9 ou biblioteca/search. Novidades séries
mantêm slot de prioridade limitado, restante recebe amostra diversa.
Teste novo scripts/test-c107-featured-rotation.mjs cobre exclusão de recentes,
tipos/limite20, snapshot/cancel/visitaBack, cursor distribuído/leitura limitada.

Usuário também solicita menu lateral tablet/TV/AndroidTV com efeito translúcido
mostrando cor ambiente do topo; Fire sem linha vertical de contorno. Hook
useImmersiveArtwork já autorizado projeta somente variável de cor sanitizada
no shell atual, limpa ao desmontar/sem imagem; não muda paleta/canvas/cache.
CSS usa camada ambiente degradê com fundo escuro translúcido no cabeçalho
lateral e transição, sem blur adicional/GPU no menu; remove border-right só
Fire. Cor cai para fundo escuro no restante do menu, não colore categorias.
Mesmo detector de perfis e largura/ícones/foco/scroll/barreira Live intactos.
971 demais arquivos baseline permanecem byte-idênticos (HomePage adicionado;
adaptador de teste antigo somente se necessário, contado à parte).

Manifest traz recordCount: variar também offset dentro do segmento, inclusive
quando há só um segmento, deixando espaço para completar a página. Seleção
inicial inspeciona no máximo120 posições por passada e materializa20 VMs;
não clonar/mapear biblioteca inteira. QA inclui catálogo de segmento único.

### Guia Live embutido e APK externo — antes do código

Usuário pede trocar Abrir guia de programação por grade já visível abaixo do
nome do canal em layouts maiores. Celular estreito mantém drawer no rodapé;
quase quadrado mantém composição já configurada. Autoriza LiveTvPage.tsx
somente para substituir fallback/button no ramo não-mobile/não-square pelo
LiveEpgPanel atual inline/open, embedded; LiveEpgPanel.tsx para flag embedded
com região focável e Up/Down rolando horários quando possível, deixando
propagação para D-pad ao chegar extremidade. Não muda ramo mobile/square,
service.load/autoridade/source/player/C9/fullscreen/troca/barreira Live.
LiveTvPage.css recebe apenas regras .live-epg-section .live-epg-embedded,
posição estática abaixo do summary, flex/min-height0/rolagem própria e esconder
nome/heading duplicados; nunca seletor mobile/square. Reutilizar loader atual
por canal, cache/abort/retry/refresh60s, mensagem real de ausência/erro sem
fabricar programas. Teste novo scripts/test-c107-inline-live-epg.mjs cobre
composição de todos perfis, grade/current/retry/cancel e foco/scroll.968 demais
arquivos baseline preservados (nenhum adaptador antigo editado até aqui).
Pedido final autoriza gerar APK recuperável completo para transferir a
aparelhos externos não conectados; não instalar/resetar esses novos alvos.
Preservar mesma assinatura/package/version19 de teste, lock/assets/proveniência.

Compilação detectou openLivePanel/import usados exclusivamente pelo botão
removido. Retirar somente esse wrapper morto e import; listener/guia nativo
fullscreen e bridge permanecem intactos. Sync anterior à constatação da falha
não é evidência de APK atualizado; repetir build completo bem-sucedido e sync
antes de Gradle/verificação final.

### Logos sem fundo azul e sem texto nos detalhes — antes do código

Usuário rejeita fundo azul do selo da logo e informação de disponibilidade
abaixo da capa. Categoria no hero passa a transparente (inclui alternativa
em texto quando logo falha), sem alterar demais selos. WatchProviders renderiza
somente logos lado a lado, deduplicados por providerId, no máximo16, alt/title
com nome acessível; nenhum heading/modo/rótulo de disponibilidade ou nome
visível. Imagem ausente/falha não deixa texto ou placeholder. Dados BR atuais
e cache permanecem os mesmos; não inferir origem nem alterar reprodução.
Termo primário TMDB exige atribuir JustWatch: mover créditos para rodapé
discreto de Configurações, fora da área da capa e sem novo card/ação/layout.
SettingsPage.tsx entra allowlist para crédito JustWatch/TMDB e nota de uso da
API sem endosso; não alterar botões/funções.967 demais arquivos baseline
preservados. Critério anterior de azul/grupos/texto em detalhes supersedido
explicitamente; testes atualizados somente para apresentação solicitada.
APK529b52abfda0221289e221a8469b4be1c353fb14daa10f9e9692cc32b24f84e8
é candidato anterior a esta revisão e será preservado como recuperação.

Usuário confirma duplicatas na versão com grupos. Nova composição deve também
deduplicar logo URI e nome público normalizado, além do ID, para variantes do
mesmo logo/mesma plataforma entre modos. Não baixar/decode imagens para comparar
pixels. Testar mesma plataforma em vários grupos e IDs distintos com mesmo logo.

### Revisão de marcas e cabeçalhos tablet/quadrado — antes do código

Novo relato do usuário invalida dedupe somente por ID/URI/nome: Prime Video
aparece três vezes com variantes comerciais da mesma marca. Autoriza normalizar
somente aliases explícitos de marcas conhecidas (Amazon/Prime Video, variantes
with Ads e Amazon Channel; Netflix/Disney+/HBO Max/Globoplay correspondentes),
sem fundir marcas diferentes ou inferir disponibilidade. Uma logo por marca,
preferindo o serviço base quando disponível; identificadores/URLs originais
continuam na resposta/cache, agrupamento apenas de apresentação. Allowlist já
inclui WatchProviders.tsx e tmdb-watch-providers.service.ts; testes sintéticos
devem reproduzir três Prime com IDs/logos/nomes diferentes + Globoplay => duas
logos, incluindo marcas desconhecidas distintas. Créditos mantidos em Settings.

Pedido adicional: em tablet e telas quase quadradas, nas páginas Filmes/Séries
e suas categorias com hero, remover cabeçalho de título/contagem acima do hero.
Ampliar somente seletor CSS já existente usando app-shell--tablet e
app-shell--square-display. Preservar botão Voltar do AppShell/Header, foco,
rotas e cabeçalho informativo de categoria ausente. Celular estreito não muda;
TV continua com Back remoto. Conferir tablet horizontal/vertical e tela quadrada.

Relato de Grimm sem episódios exige diagnóstico separado, somente números e
flags locais dos dispositivos autorizados, sem exportar catálogo/source/segredos.
Não presumir relação com logos, não usar episódios TMDB como itens reproduzíveis
nem alterar readers/source/autoridade sob esta emenda. Qualquer correção de
carregamento deve ter causa reproduzida e spec anterior própria neste documento.
Preflight reiterado: clone ativo C11, main/HEAD0f68f169, origin esperado,
CURRENT_GATE=NONE; mesmos 967 arquivos protegidos, sem Git/reset/novo Gate.

### Logo de plataforma no hero de filmes — antes do código

Usuário solicita o mesmo selo de plataforma das séries também nos filmes.
Autoriza Hero.tsx já listado: extrair categoria tanto movie como series,
retirar somente prefixo Filmes | / Séries |, manter limite100 e excluir Geral.
Reutilizar PlatformCategoryLogo/cache público adiado/diretório BR existente,
mesmo tamanho/fundo transparente/fallback textual; sem inferir plataforma pelo
gênero, sem requisição por card ou alterar watch providers/trailer/playback.
Mesmos perfis Home/Filmes/Séries/Ver todos com Hero. Ajustar testes C107 para
requisito ampliado, preservando gesto/timer/foco/imagem e outros critérios.

### Voltar fora do hero em tablet/dobrável — antes do código

Usuário relata Voltar sobreposto ao hero de Filmes/Séries no tablet e pede
verificar dobráveis quase quadrados. Preflight repetido no clone C11 ativo,
main/HEAD0f68f169/origin esperados;37 alterações C107 de proveniência conhecida,
CURRENT_GATE=NONE, sem commit/push/PR ou próximo Gate. Leitura dos contratos
reiterada. APK eb40b6e8e5cef992fc248bc776ac4092f0b65b7e1622589928ea1ade1fb43eb8
é recuperação desta revisão. Regra side-nav posiciona page-back-row absolute;
remoção do cabeçalho expôs o hero nessa área, não reservava altura do Voltar.

Allowlist incremental: AppShell.tsx já autorizado, somente classe browse na
row atual para currentView movies/series; index.css somente essa classe nos
perfis tablet/quase quadrado não-TV, posição no fluxo, flex-shrink0, alinhamento
direito/altura do botão preservados e espaço curto antes do main. Nenhum novo
botão/handler, título ou contagem; não tocar página de detalhes, Live, settings,
busca ou celular estreito. TV conserva ausência do botão e remote Back.
Mesmo efeito nas categorias Ver todos destas rotas; erro de categoria preservado.

Verificar geometricamente interseção botão/hero igual a zero em tablet
horizontal/vertical, dobrável PHONE/TABLET nas duas orientações quase quadradas,
celular e TV. Fixture usa AppShell/Header reais e regras puras atuais de perfil;
callbacks/Back e foco mantidos. No tablet USB autorizado confirmar via UI
normal; dobrável não conectado tem somente validação responsiva, não alegar
teste físico de Z Fold. Helpers/evidências privados em tmp/c107-fire-hero.
Lock obrigatório antes/depois/build e APK recuperável; update-r dos três USB
autorizados continua permitido preservando todos os dados, sem reset. Fonte/
catálogo/C9/native/env/ativação e demais alterações C107 permanecem intactos.

### Fundo do topo atrás da faixa Voltar — antes do CSS

Usuário solicita transparência na faixa reservada do Voltar no tablet em
Filmes/Séries, para continuar o efeito de fundo do topo. Preflight reiterado:
clone C11 ativo/main/HEAD0f68f169/origin esperados;37 alterações C107 conhecidas,
CURRENT_GATE=NONE, sem Git/novo Gate. Contratos/lock relidos. Recuperação APK
7251f2ef50457e62bac04c49a6112ffd510dcdccc9a5b3a2dacbb96944c9151a.

Allowlist incremental somente src/index.css e documentação C107 existente.
Preservar row no fluxo, altura/gap/hit/foco e callbacks byte-idênticos; faixa
sem background próprio ou borda. Sob ela, pseudo-elemento não interativo usa
exatamente --navigation-ambient já calculado pelo hero, que coincide com
--artwork-ambient no começo do main. Isolamento local mantém essa camada atrás
do botão sem cobrir imagem ou alterar cor das categorias abaixo. Sem novo
canvas/blur, leitura de imagem, hook, store, rede, dimensão ou JavaScript.
Mesma herança atualiza a cada capa; ausência/erro/saída usa fallback escuro e
limpeza existentes. Escopo do seletor atual: tablet/quase quadrado não-TV,
somente page-back-row--browse. Home, detalhe, Live, settings, celular/TV e
tratamento/fill do próprio botão permanecem como estavam.

Validar raster sintético antes/depois com duas paletas bem diferentes, faixa
transparente e camada da cor do topo, limite contínuo com main, áreas após hero
escuras, gap/interseção/hit/Back preservados. Rerodar matriz responsiva60 casos
e regressão de halo/limpeza; tablet físico só flags/números, sem exportar mídia.
Build/lock/assinatura/assets e updates-r dos três USB seguem autorizados com
preservação integral de dados, recuperação anterior e sem novo Gate/Git/reset.

### Selo de plataforma sem flash de nome — antes do componente

Durante a revisão de fundo, usuário rejeita nome visível antes da logo na
abertura de Séries e pede somente a logo. Supersede fallback textual anterior
somente desse selo. PlatformCategoryBadge.tsx já autorizado passa a renderizar
null enquanto não há URI/ela falha; imagem com visibility hidden até onLoad
confirmar URI carregada, evitando alt visível durante download. Nome permanece
em alt/aria/title acessíveis, sem texto visual. Estado keyed pela URI impede
onLoad anterior de revelar outra imagem. Hero pai continua mesmas props/ações;
CSS esconde apenas hero-category-badge:empty para não deixar selo vazio.
Vale para selo compartilhado Filmes/Séries em todos os perfis, sem editar
diretório/API/cache/hook/defer2s ou adicionar download/requisição. Ausência de
logo deixa área oculta, não uma categoria escrita. Alterar somente teste C107
de logo para requisito novo: pendente/erro/desconhecida sem texto, imagem só
visível após load, URI trocada mantém oculto até novo load, sem nova chamada.
Demais metadados, fundo transparente do selo, foco/gestos/perfis preservados.

### Ver todos menor em Fire/Android TV — antes do CSS

Usuário pede redução leve de Ver todos em todas as páginas somente Fire e
Android TV. Os dois componentes existentes usam a mesma classe rail-view-all;
não alterar MediaRail/AsyncCategoryRail, callbacks/Ver todos/ordenamento/foco.
AppShell.tsx já listado recebe classe app-shell--android-tv somente quando
decisão television atual é verdadeira e userAgent contém Android. Fire já
tem classe própria e cobre também UA Fire sem palavra Android. Não redefinir
detector de TV nem estender a tablet/PHONE/Tizen/webOS por acidente.
CSS limitado à união dessas duas classes: fonte13->12px, min-height40->36px,
padding7x12->6x10px. Bordas/cor/raio/texto/estado de foco e posição da linha
mantidos. Reutilizar .rail-view-all cobre Home/Filmes/Séries/categorias onde
ação existe. Verificar medidas e foco/hit de Fire/AndroidTV em navegadores,
tablet/celular/Tizen/webOS sem diferença. Build/APK atualizados acumulam os
três pedidos deste turno, mesma assinatura e updates-r autorizados sem reset.

### Remoção de tipo nas capas das listas — antes do JSX

Usuário pede retirar Filme/Série do canto superior esquerdo das capas nas
listas/categorias e reserva esse local para um futuro Top10 ligado a Avaliar.
Autoriza MediaCard.tsx já listado: remover somente div.media-card-badge com
texto FILME/SÉRIE. Não trocar título/pôster, ano/novidade, aria-label (tipo segue
acessível sem sobreposição visual), identidade/operação/hit/foco/return-memory,
preparo/carregamento da imagem ou tamanho do card. Componente compartilhado
cobre faixas/grid/busca que o utilizam. Não remover selos do hero nem de canais.
Top10/ranking/Avaliar são futuros, não implementar placeholder/recurso/Gate.
Validar ausência DOM desse selo em movie/series e cards navegáveis, mantendo
informação acessível e retorno; sem teste novo rastreado para remoção simples.
APK bdee7b996247b2d460d27507df27dc01f67c0d984caf50587b6219ca8d0e653b
é intermediário antes desta solicitação; tablet já o recebeu-r preservando978
privados, outros ainda não. Gerar candidato acumulado final e atualizar-r os
três alvos autorizados, sem tratar intermediário como entrega final.

### Transporte do celular alterado para Wi-Fi — antes de operar o alvo

Usuário pede explicitamente atualizar celular via Wi-Fi e fornece janela de
pareamento/conexão. Isso supersede USB somente do celular; tablet/Fire mantêm
USB. Usar ADB wireless pairing seguro, endpoint atual informado, confirmar
modelo SM-S926B e hardware serial RXGYB03FL4W antes de install-r; manter todas
as verificações de assinatura/hash/privados/UID/instalação. Não habilitar modo
TCP legado5555, trocar rede/credenciais ou usar USB como fallback implícito.
Código de pareamento transitório somente no comando autorizado, nunca em docs/
Git/relatórios. Sem reachability ao endpoint, pedir rede/IP/portas atuais e
continuar verificação independente dos outros alvos; não afirmar celular
atualizado por ter mesmo versionCode19 ou APK apenas pronto no computador.

Usuário respondeu em seguida para deixar a atualização do celular pelo APK
gerado. Suspender novas tentativas/instalação nesse alvo por solicitação dele;
entregar arquivo para instalação manual in-place, sem afirmar update remoto/
automático ou publicar no updater. Encerramento permite tablet/Fire confirmados
e celular explicitamente adiado ao usuário, não um bloqueio pendente de código.
