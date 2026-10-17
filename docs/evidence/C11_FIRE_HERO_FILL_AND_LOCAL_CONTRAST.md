# C107 — hero, sugestões, plataformas e guia Live

## Proveniência e escopo — 2026-10-14

Clone independente ativo `C:\Xandeflix\xandeflix-prebuilt-c11-main`, main,
origin `https://github.com/xandeflix2/xandeflix-prebuilt.git`, HEAD
`0f68f169f7728fae17c8311832b7643629e97a02`. Preflight/AGENTS/Architecture/
Execution/Activation Lock/Source Data Boundary conferidos. Especificação e
emendas anteriores ao código em
[C11_FIRE_HERO_FILL_AND_LOCAL_CONTRAST](../architecture/C11_FIRE_HERO_FILL_AND_LOCAL_CONTRAST.md).
Cada extensão registra pedido do usuário e arquivos autorizados. CURRENT_GATE=NONE,
NEXT_GATE_STARTED=NAO. C100–C106 já publicados não autorizam publicação C107.
Nenhum commit/push/PR, backend, .env, rotação/reset ou aparelho externo operado.

## Resultado implementado

- Arte Fire usa cover proporcional/centro35%, preenchendo o quadro do hero
  Home/Filmes/Séries/Ver todos sem faixas laterais. Moldura1px/dimensões C106
  preservadas. Tablet/TV/touch quase quadrado compartilham imagem sem overlay
  global escuro e uma nuvem radial discreta atrás da área de texto/ações.
  Celular estreito mantém tratamento anterior da imagem. Ver Detalhes com
  preenchimento.62/blur6px local; botões Fire110px/tablet150px mínimos.
- Novidade compartilha métricas de Filme/Série. Gênero real substitui Geral
  somente Fire, usando enrichment existente quando necessário. Categoria
  de série e filme em todos os perfis perde prefixo Séries | / Filmes |, recebe logo público
  correspondente quando disponível, com nome somente em atributos acessíveis.
  Revisão final remove fundo azul. Selos9px/ano10px somente Fire.
- Menu Fire com ícones20px/gap4px/alvos44px/mesma largura56px, sem borda direita.
  Menu lateral tablet/TV usa cor ambiente com camada escura translúcida. Cor
  da página termina em degradê32px após hero; categorias abaixo escuras,
  inclusive durante rolagem interna. Nenhum blur/canvas adicional no menu.
- TV não renderiza Voltar visual nas páginas internas de filmes/séries e
  não mostra título/contagem de categoria acima do hero; erro de categoria
  indisponível e títulos das faixas preservados. Remote Back permanece.
  Tablet e tela quase quadrada também ocultam título/contagem, mantendo o
  botão Voltar touch. Celular estreito mantém cabeçalho e Voltar.
  Mensagem de preparação duplicada removida; busy no botão e erros preservados.
- Clique explícito Home foca hero/topo; Back do detalhe restaura linha/card.
  Memória RAM16 destinos por geração, cancelável/bounded12s; expansão de grid
  recupera quantidade já vista usando leitor atual. Se ordem aleatória da
  faixa muda, offset pode ajustar para revelar o mesmo card, sem mudar ordenação.
- Configurações tablet/Fire com quatro colunas e linhas automáticas; três
  itens atuais sem placeholders. Créditos JustWatch/TMDB ficam fora dos cards.
- Destaques Home deixam de selecionar sempre os primeiros20 registros.
  Lote imediato, depois amostra local de duas páginas10 em segmentos/offsets
  distribuídos, no máximo20 sugestões por tipo e últimas40 chaves em RAM.
  Clique Home renova lote; Back reutiliza lote. Novidades séries reservam até
  quatro posições. Snapshot/abort/foco protegem retorno e nenhuma fonte nova
  é baixada para criar sugestões. Sem scan/map da biblioteca completa.
- Detalhes mostram somente logos de plataformas lado a lado, quando o TMDB
  fornece dados BR do título identificado. Sem heading/modos/texto de
  disponibilidade. Dedupe por ID, URI, nome normalizado e aliases explícitos
  de marca; variantes comerciais Prime Video aparecem uma vez. Máximo16.
  Falhas/ausência não inventam dados ou bloqueiam ações. Logo hero e diretório
  são independentes da disponibilidade do título. Dados informativos não
  modificam a fonte ou a reprodução do Xandeflix.
- Guia Live já aberto sob nome do canal em layouts maiores, com programação
  atual/próxima/progresso quando a fonte fornece, retry/ausência reais e rolagem
  própria/controle remoto. Celular mantém drawer no rodapé e quase quadrado
  mantém composição anterior. Loader/cache/abort/refresh60s atuais reutilizados;
  guia nativo fullscreen, C9, Media3, seleção e barreira Live não alterados.

## Verificação

54 grupos novos PASS: metadados/perfis11, halo/menu7, preparação5, retorno11,
plataformas10, rotação6, guia4. Regressões C106 touch/swipe/autoplay8 e saída
Live8 PASS; D-pad Home/browse, playback direto C94 e paleta/cache existentes
também conferidos no ciclo. Lock canônico26 ativação +27 promoção +9 controles
negativos PASS; TypeScript/Vite/Capacitor/Gradle com lifecycle obrigatório.
Nenhum teste antigo teve assertion relaxada. Revisão React aplicada a hooks,
cleanup, dependências, acessibilidade e limites de memória/I/O.

Fixture real Hero/CategoryHero em14 contextos, imagem sintética branca:
quadros/ações preservados, área sem texto branca, única nuvem e métricas dos
selos corretas. Raster de halo em13 contextos termina na mesma cor de fundo
`rgb(8,12,20)`, inclusive página rolada. Contraste numérico sem text-shadow é
registrado como observação e não certifica WCAG4,5: o primeiro candidato mais
escuro foi rejeitado pelo usuário. Configurações com3/5/9 itens em12 casos
Fire/tablet horizontal/vertical/quadrado: quatro colunas,1/2/3 linhas, sem overflow.

Probes privados nos aparelhos retornam somente números/booleans, sem exportar
catálogo, imagens, EPG, títulos, URLs de mídia ou segredos. Confirmados retorno
Home/Filmes/Séries ao mesmo card/linha nos três alvos; foco Home/topo e quatro
colunas Fire/tablet. No candidato anterior à revisão final de logos, amostras
Home renovaram16–20 filmes/16–19 séries por clique, logos e dados BR apareceram
em Fire/tablet; guia embutido abaixo do canal/rolável/dentro da viewport PASS.
Revisão final de dedupe/ausência de texto coberta por fixture funcional; QA
físico final e digest de entrega registrados ao terminar a conferência.

## Artefatos e instalação

APK de teste Android1.0.19/versionCode19, package `com.xandeflix.prebuilt`,
mesma assinatura anterior, sete assets byte-idênticos a dist, HTTPS/sem dev
server/logging none.967 arquivos anteriores protegidos por hash e18 alterações
de apresentação nominalmente aprovadas, além de index.css/arquivos novos/docs.
Recuperações C104/C106 preservadas; candidatos C107 rejeitados/intermediários
continuam privados. Artefatos e relatórios sanitizados em tmp/c107-fire-hero,
fora do Git. Não publicar no updater com o mesmo versionCode.

Atualização-r autorizada nos USB identificados: Fire AFTSS, tablet SM-X610,
celular SM-S926B. Hash de todos os arquivos privados congelado com app parado
e comparado após instalação antes de abrir, UID/firstInstallTime iguais,
identidade/chave/ativação/fonte/catálogo preservados. Nada instalado em aparelhos
externos; arquivo fornecido para transferência e teste pelo usuário.

APK anterior à correção de sobreposição do Voltar: 11.441.550 bytes,
SHA-256 `eb40b6e8e5cef992fc248bc776ac4092f0b65b7e1622589928ea1ade1fb43eb8`.
Recuperação anterior à revisão de marcas/cabeçalho preservada com SHA-256
`77bed082af902fc2ee367d225d952c7bf87ba06f108346f8c0f06ebdf7ab907e`.
Três install-r confirmados com digest final: Fire67/tablet978/celular2471
arquivos privados idênticos antes/depois, mesmo UID/primeira instalação.

Revisão final em navegador:24 casos de Filmes/Séries em tablet horizontal,
vertical, quadrado, fold, celular e Fire, incluindo categoria ausente. Cabeçalho
oculto somente nos perfis autorizados; Voltar touch visível/habilitado/dentro
da viewport e erros de categoria preservados. QA físico do novo APK nos três
USB confirma cabeçalho oculto no tablet, Voltar mantido, celular estreito sem
mudança, categoria de filmes/séries limpa e transparente. Plataforma sem alias
ou dado público mantém texto; ausência de categoria válida não inventa selo.
No Fire, Grimm confirmado por busca normal: somente duas logos sob a capa,
uma Prime Video e uma Globoplay, sem texto e sem repetição de URI/marca.

Diagnóstico separado de episódios de Grimm: retry normal falhou em
DIRECTORY_JSON_FETCH_FAILED. Instrumentação temporária em RAM, restaurada,
retornou somente enum HTTP_STATUS_ERROR/HTTP_RESPONSE/4XX. Confirmação GET
nativa do mesmo pedido autorizado retornou HTTP404, sem grupos de episódios
ou temporadas. Nenhuma URL, credential, corpo ou identificador do catálogo
exportado/persistido; nenhuma correção especulativa de parser/reader ou bypass
de autorização. Episódios de Grimm continuam pendentes da resposta da fonte;
sucesso de UI/logos não certifica sua resolução nem playback.

FINAL_DELIVERY=APK_UI_VERIFIED_TABLET_FIRE_PHONE_MANUAL_USER_CHOICE

## Revisão de sobreposição do Voltar — 2026-10-14

Relato posterior do usuário invalida ausência de regressão geométrica. Tablet
USB1365x775 confirmou botão invadindo29,27px verticalmente o hero, interseção
2486,91px² em Filmes/Séries. Classe page-back-row herdava absolute do side-nav;
ocultar cabeçalho eliminou o espaço que antes separava botão e imagem.
AppShell recebe somente classe page-back-row--browse nos dois destinos; CSS
tablet/quase quadrado não-TV coloca row no fluxo, sem encolher, alinhada à
direita e main8px abaixo. Nenhum handler/foco/back nativo/detalhe alterado.

Políticas puras atuais e AppShell/Header reais em60 casos por candidato:
tablet horizontal/vertical, dobrável quase quadrado PHONE/TABLET nas duas
orientações, celular retrato/paisagem e Fire/TV, Filmes/Séries raiz/categoria/
categoria ausente. Antes: oito interseções em tablet/dobrável TABLET horizontal;
depois: zero, Back visível/hit disponível/viewport e cabeçalhos esperados.
Celular físico antes já não sobrepunha; dobrável PHONE também usa Back no Header.
Sem dobrável físico conectado, portanto validação desse perfil é responsiva.
22 regressões dirigidas de perfis/Back/retorno PASS; demais resultados C107
permanecem registrados na revisão anterior, sem alegar nova reprodução VOD.

APK corrigido: `Xandeflix-v1.0.19-C107-UI.apk`,11.441.560 bytes,
SHA-256 `7251f2ef50457e62bac04c49a6112ffd510dcdccc9a5b3a2dacbb96944c9151a`.
Mesmo package/assinatura/versionCode19 e sete assets exatos, recuperação
eb40b6e8 preservada. Lock26+27+9, TypeScript/Vite/Capacitor/Gradle PASS.
Tablet USB atualizado-r:978 arquivos privados preservados; Filmes/Séries
sem interseção, intervalo8,67px entre botão e hero e hit disponível; clique
normal Voltar retornou Home em ambos os destinos, títulos/contagens ocultos.
Mesmo APK atualizado-r também em celular e Fire, preservando2471/67 arquivos
privados, identidade/ativação/catálogo, UID e primeira instalação. Celular
mantém geometria anterior, zero interseção e Back->Home; Fire conserva ausência
do botão visual. Somente aparelhos USB autorizados; nenhum Z Fold operado.

## Faixa integrada ao ambiente, logo sem nome e Ver todos — 2026-10-14

Revisão solicitada após APK7251f2ef: a faixa do Voltar deve acompanhar o topo.
CSS mantém row transparente, altura/gap/fluxo iguais e adiciona camada local
atrás com mesma cor --navigation-ambient já medida pelo hero. Nenhum novo hook,
canvas/blur ou rede; categoria após hero continua escura. Dois tons sintéticos
e três layouts tablet/fold, Filmes/Séries:12 casos raster antes/depois passam,
cor da faixa igual ao topo, diferença <=2 por canal no limite do main, cor
rgb(8,12,20) após hero, geometria preservada.60 cenários de Back sem sobreposição.

Pedido subsequente remove fallback visual do nome da plataforma. URI ausente/
falha retorna null, selo vazio oculto; imagem fica invisível até onLoad confirmar
URI decodificada. Nome só em alt/aria/title, sem mudança de diretório/cache/
defer2s. Teste funcional cobre espera/erro/desconhecida/URI antiga carregando
depois da nova. Recurso é compartilhado pelos heros de filmes e séries: a
categoria local deve identificar plataforma reconhecida; não inferir pelo gênero.

Ver todos reduzido somente Fire/Android TV, todos os destinos que usam ação
existente .rail-view-all: fonte13->12px, min-height40->36, padding7x12->6x10.
AppShell acrescenta classe quando decisão TV atual + UA Android; Fire conserva
classe própria.28 comparações com Home/Filmes/Séries/detalhe em sete perfis:
botão menor em Fire/AndroidTV e medidas idênticas tablet/phone/Tizen/webOS,
foco visível e click preservados. React revisado: estado keyed por URI, hooks
incondicionais, erro não inventa texto/logo, sem novas dependências/requisições.

Pedido seguinte retira somente selo FILME/SÉRIE sobre capas de MediaCard,
compartilhado nas faixas/grids/busca. Removido um div, sem esconder título/ano/
novidade ou imagem e sem retirar tipo do aria-label. Smoke sintético4 casos
movie/series com/sem novidade confirma ausência do selo, poster/ano, tipo
acessível e mesmas ações/foco/preparo. Top10/Avaliar permanece futuro sem código.
APK bdee7b99 era intermediário e chegou somente ao tablet com dados preservados;
entrega final deve usar candidato posterior que inclui a remoção desse selo.

APK final acumulado `Xandeflix-v1.0.19-C107-UI.apk`:11.441.595 bytes,
SHA-256 `f769d1fca75dfbeaafe63d919e4a9d0a6dfa139ef3fc70701a13b8c53a33c60b`.
Assinatura/versionCode19/package/config/7 assets exatos e967 protegidos conferidos.
Instalado-r e hash confirmado no tablet/Fire, preservando978/67 privados,
identidade/ativação/fonte/catálogo, UID e primeira instalação. Probes locais
Filmes/Séries: tablet131/249 e Fire134/283 cards renderizados sem selo de tipo;
nenhum texto de plataforma ou alt visível durante carregamento observado.
Tablet série mostrou logo pronta; ausência de correspondência mantém oculto.
No tablet faixa transparente e camada igual à paleta atual do main, sem
interseção; Ver todos permaneceu13px/40px. Fire12px/36px e classe Android TV,
sem Back visual. Sem exportar mídia/IDs/nomes reais/URLs/corpos de resposta.

Celular: usuário primeiro mudou transporte para Wi-Fi, pair e sondas TCP
falharam por timeout. Em seguida pediu deixar a atualização pelo APK gerado.
Nenhuma instalação final no celular foi feita; arquivo entregue para update
manual in-place posterior pelo usuário. Não publicar updater nem prometer
detecção automática do mesmo versionCode. Não há pendência de autorização;
é escolha expressa de adiar esse alvo, sem fallback USB e sem novas tentativas.
Grimm episódios/HTTP404 e limites anteriores de playback/startup não mudam.

## Limites e fontes primárias

Não houve nova medição de instalação limpa/90s, homologação de playback VOD
ou solução da retenção C102. APK Android não instala em Tizen/webOS; os guards
de front-end desses perfis foram testados em fixture. Disponibilidade varia
por país e dados retornados; nomes de categorias não provam origem/licença.
TMDB/JustWatch não fornecem o stream para o player do Xandeflix.

Documentação consultada em2026-10-14:
[filmes](https://developer.themoviedb.org/reference/movie-watch-providers),
[séries](https://developer.themoviedb.org/reference/tv-series-watch-providers),
[diretório/logos](https://developer.themoviedb.org/reference/watch-provider-tv-list),
[imagens](https://developer.themoviedb.org/docs/image-basics).
