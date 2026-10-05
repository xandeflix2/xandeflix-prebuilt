# C11 — Prévia Live permanente e limpeza mobile

## Emenda prévia — cabeçalho phone dos detalhes de filme/série — 2026-10-05

Usuário respondeu "sim" à pergunta de entrega desta correção: após validação,
autoriza atualizar os três aparelhos na ordem celular -> Fire -> tablet,
sem limpar dados, conforme limites in-place/hashes/alvos ao final desta emenda.
Sucede a condição anterior de aguardar resposta, sem ampliar patch funcional.

Resultado observacional: entregue na ordem autorizada, install-r e abertura
normal nos três, mesmo APKEEBEED35...ADAB338F. Quatro privados/catálogos508/436/505
idênticos em RAM antes/depois, antes de abrir. Detalhes/medidas/testes constam na
evidence; não constituem SLA/homologação de mídia.405/405 hashes finais locais
idênticos após entrega, sem próximo Gate/Git/backend/reset.

Novo pedido: movie-detail/series-detail do celular devem compartilhar Header
64px+safe-area e Voltar só seta SVG centralizada à direita, como listagens/Home.
Não remover botões locais do conteúdo, alterar reprodução/episódios/histórico
ou adicionar Início a essas duas rotas (política anterior somente quatro rotas).
Home continua sem botões; footer quatro ícones, Live/tablet/Fire/TV intactos.

Causa na fonte: Shell exclui ambas rotas da classe phone-header-back. Essa classe
usa margin-left0 na nova dupla Início/Back, inadequado para detalhe sem Início.
Patch mínimo antes do código: booleano detailPage derivado de currentView em
render, incluir na classe existente64px e acrescentar phone-detail-page; CSS
adicional max-width599 somente nessa classe restaura margin-left:auto no Back.
Reusar SVG/nomes/handlers do Header, sem hooks/listeners/IO/UA/device policy nova.
Allowlist: AppShell.tsx somente booleano/classes; index.css bloco adicional;
harness existente novo --phone-detail-header-only e campo report, sem relaxar
suítes anteriores/fixture TSX. Header/páginas de detalhe/App/native/ativação/
source/search/route-state byte-idênticos. Este contrato/evidence/STATUS/
EVOLUTION_REPORT/ERRORS_AND_BLOCKERS, build/sync/Gradle/APK e backup recuperável
Xandeflix-v1.0.0-standalone-before-phone-detail-header.apk =0665565390BB35769ED5DF5
AAA978E77745D7075328753854501EED1DCD4A964 permitidos. Outros backups preservados.
PreflightC11/origin/main/ahead2/HEADf0fdb684.../contratos/lock/boundary revistos;
baseline405/405 idêntica à última entrega0665, dirty conhecido preservado.

Story: card real da listagem/Home -> route-state real -> Header/Shell real no
detalhe -> clique/Enter/Escape Back -> página anterior com mesma altura, Home
sem botões. Teste em320/390/430, duas rotas, Header64px/containment/centragem/
alvo44px/direita/marca ancorada/sem texto/sem Início/footer4/overflow, também
tablet portrait/landscape/Fire/TV/phone largo preservados. Negativo deve rejeitar
0665 antes do patch. Fixture de conteúdo sintético não certifica loading/player
nativo ou dados reais. CLI ausente, browser isolado/CDP com gut-check imediato;
revisão React deriva classes em render, sem efeito novo. Suítes anteriores250
checks/lock49+9/guards/build/config/package/cert/assets e audit allowlist exigidos.

CURRENT_GATE=NONE; sem Git/backend/gestor/Settings/reset/novo Gate/60s.
Entrega anterior nos três já concluída não autoriza nova instalação desta
versão: pergunta opcional enviada; sem resposta gerar sem instalar. Se autorizado,
mesma ordem celularSM-S926B/RXGYB03FL4W -> FireAFTSSS/192.168.3.103:5555 ->
tabletSM-X610/RX2X301Q3KY, install-r/mesmo package/cert, quatro privados/catálogo
comparados em RAM antes/depois, hash público/abertura normal, sem limpar dados.

## Entrega autorizada — celular, Fire, tablet nessa ordem — 2026-10-05

Usuário agora autoriza instalar a versão de quatro ícones já validada, primeiro
no celular conectado, depois Fire Stick e por último tablet. Sucede restrição
anterior de gerar sem instalar. Somente com.xandeflix.prebuilt, install-r sem
limpar dados, mesma assinatura. APK0665565390BB35769ED5DF5AAA978E77745D707532875385
4501EED1DCD4A964/9062043bytes, sem rebuild/patch funcional/testes novos.
Alvos: SM-S926B/RXGYB03FL4W, AFTSSS/192.168.3.103:5555, SM-X610/RX2X301Q3KY.
Manter ordem solicitada; alvo indisponível não equivale a instalação concluída.
Tablet ausente na lista ADB inicial, solicitar conexão somente após finalizar
celular/Fire para não interromper a primeira instalação. Sem IP antigo/scans.

PreflightC11/origin esperado/main/ahead2/HEADf0fdb684... realizado; AGENTS,
Architecture/Execution/boundary/activation lock lidos. Baseline405 coincide
com06655653 antes da entrega; dirty adjudicado preservado. CURRENT_GATE=NONE,
sem próximo Gate/Git/gestor/backend/Settings/reset/rotação/retomada60s.
Allowlist desta rodada: este contrato/evidence correspondente/STATUS/
EVOLUTION_REPORT/ERRORS_AND_BLOCKERS e registros sanitizados próprios tmp.
Nenhuma alteração em produção/testes/config/build/APK autorizada ou necessária.

Lock oficial49+9 PASS antes de entrega; conferir package/certificado/hash
local e identidade/modelo de cada alvo. Comparar em RAM quatro privados e todos
arquivos de catálogo imediatamente antes/depois install-r e antes da abertura,
publicando somente igualdade/contagens, nunca conteúdos/digests privados.
Conferir hash público do APK instalado e abrir normalmente MainActivity,
Status:ok/processo. Não selecionar canal/fonte nem testar mídia ou expor telas
de segredo; abertura não certifica reprodução. APK instalado anterior esperado
CE39CA717A00B52604BF1C9D106D6335D7F900E04B54333A81F4D1F26AFBCC6C ou novo0665,
ambos com mesmo certificado conferido. Divergência bloqueia alvo sem reset.
405/405 hashes locais devem permanecer idênticos ao término desta rodada.

## Emenda prévia — navegação phone com quatro ícones — 2026-10-05

Refinamento prévio de sincronização: App mantém status Sincronizando... quando
catálogo ausente, inclusive Ativação. Testar Header SSR real com status e
canGoBack true/false nas três larguras, sem sobrepor marca/Início/Voltar/status.
Se faltarem pixels, somente nessas quatro rotas phone apresentar o dot de status
e manter texto acessível visualmente oculto (não display:none/aria-hidden),
sem eliminar o aviso ou alterar suas condições, Home/Live/tablet/Fire intactos.

Pedido atual: somente Filmes, Séries, Canais e Busca no rodapé do celular,
nessa ordem e sem texto visível, ícones vetoriais32px e alvos>=44px. Início
somente no topo à direita de Filmes/Séries/Busca/Ativação, junto a Voltar;
ausente na Home, Live e detalhes. Preservar nomes acessíveis, foco, callbacks,
histórico/hardware Back, sincronização, Home64px sem Voltar em todos layouts.
Breakpoint phone existente<600, footer56px/safe-area e orientação intactos.
Tablet/Fire/TV conservam seis ações superiores/laterais, sem novo Início no topo.
Ativação inicial, links de recuperação existentes, chave/source/player intocados.

Allowlist deste ciclo, definida antes do código: Header.tsx somente quatro
botões mobile com NavigationIcon existente/aria-current e novo botão Início
condicional por rota (classe própria, oculto fora phone); AppShell.tsx somente
estender classe visual phone-header-back à Ativação; index.css somente regras
adicionais escopadas para ícones/label/ações à direita, marca compacta<=359px
se necessário para não sobrepor dois alvos44px. Nenhum hook/listener/IO novo.
Harness existente pode adicionar --phone-four-icon-navigation-only, substituir
índices mobile antigos por seletores semânticos e suceder apenas a expectativa
visual de Back Ativação. Setup sintético da rota Ativação pode usar nav desktop
oculta via DOM; não alegar acesso físico por botão ausente. Fixture TSX intacta.
Este contrato/evidence/STATUS/EVOLUTION_REPORT/ERRORS_AND_BLOCKERS e saídas normais
build/sync/Gradle/APK são permitidos; backup recuperável novo
Xandeflix-v1.0.0-standalone-before-phone-four-icon-navigation.apk guardaCE39CA71
7A00B52604BF1C9D106D6335D7F900E04B54333A81F4D1F26AFBCC6C, sem sobrescrever outros.
Baseline405 conferida idêntica antes do patch; fora allowlist hashes iguais.

Story isolada: quatro ícones -> onNavigate existente -> rota/Header real ->
Início/Voltar -> Home sem botões. Testar320/390/430, ícones32px/nomes/ordem,
sem labels/overflow/sobreposição, alinhamento direito, clique/Enter/histórico,
Ativação sem histórico via SSR, Live intacta e matriz tablet/Fire/TV/phone largo.
Novo teste rejeita baseline de seis botões antes do patch. Suítes anteriores
Home/Back/categoria/mobile/gestos/lateral mantêm força fora requisitos sucedidos.
Skills browser/verify/verification/React: CLI ausente; harness Chrome/CDP isolado
com gut-check imediato e revisão de derivação em render/a11y/cleanup. Sem backend,
env ou mídia real; browser não homologa reprodução/ativação nativa fisicamente.
Lock antes/prebuild/final, Java/guards, assinatura/package/config/assets obrigatórios.

CURRENT_GATE=NONE, continuação local explicitamente solicitada, sem próximo Gate,
Git/gestor/backend/Settings/reset/60s. Pedidos antigos de instalação já concluídos
não autorizam entrega desta nova versão. Pergunta de instalação in-place no
celular enviada nesta rodada; sem resposta gerar APK sem instalar. Se autorizado,
somente SM-S926B/RXGYB03FL4W, install-r com.xandeflix.prebuilt e mesma assinatura,
quatro privados/catálogo comparados em RAM, somente igualdade/contagens públicas,
hash instalado/abertura normal, nunca limpeza/regeração/novo canal/fonte.

## Autoridade e preflight — 2026-10-05

Pedido atual: um Voltar, sem Conexão direta à fonte, sem versão em qualquer
layout, sem Trocar Categoria/aba Player; vídeo abaixo do título/contador e acima
das duas abas Categorias/Canais. CURRENT_GATE=NONE, continuação local explícita;
nenhum próximo Gate/performance/backend/Git/reset autorizado.
Workspace/top-level C:\Xandeflix\xandeflix-prebuilt-c11-main, origin esperado
https://github.com/xandeflix2/xandeflix-prebuilt.git, main/ahead2, HEAD
f0fdb6840c21e7a660f1662f2bbac9f2cd241cba. AGENTS, Architecture, Execution,
Source Data Boundary, Activation Lock, lateral/preview/gestos/fundo opaco lidos.
401 hashes coincidem com entrega 6F1C4F36...9494B, inclusive Java e APK; dirty
conhecido preservado. Guard fundo opaco E3B26453...20A1 e teste Java
29DE1A96...EEA1 preservados. Lock prévio 49 casos/9 negativos PASS.

## Especificação anterior ao código/testes

1. Header não apresenta mais versão do catálogo (badge/texto/dot correspondente),
   em TODAS as rotas/layouts. Preservar mensagem Sincronizando... fornecida pelo
   bootstrap quando não há catálogo; não esconder alertas/avisos. Props públicas
   permanecem compatíveis; não alterar App/bootstrap/metadados armazenados.
2. Shell suprime Back global apenas na rota Live, que já possui Back próprio;
   demais rotas/histórico/Sidebar ficam intactos. Em mobile, Back local mantém
   canais -> categorias -> onBack, removendo apenas etapa Player agora inexistente.
   Escape/fullscreen/Back nativos continuam os mesmos.
3. Breakpoint mobile consolidado innerWidth<600 permanece (nenhuma mudança de
   classificação/UA/orientação). mobileTab fica groups|channels, default channels;
   selecionar canal não troca mais para Player. Preview é sempre montado UMA vez.
   Remover aba Player, Trocar Categoria e Voltar para Lista de Canais redundantes.
   Categorias/filtro/paginação/seleção/C9/source/autoplay permanecem existentes.
4. CSS adicional escopado à rota Live estreita: uma superfície nativa 16:9 abaixo
   de título/contador e antes das duas abas, lista com scroll próprio abaixo.
   display:contents/order permite reusar a MESMA árvore/ref, sem duplicar/remontar
   preview. EPG existente permanece acessível em painel mobile de rolagem abaixo
   da lista (sem inventar programação). Reservar área inferior para navegação,
   ocultar somente footer técnico nessa rota estreita para não consumir viewport.
   Cabeçalho compacto com Voltar à direita; título não quebra em uma palavra/linha.
   Manter controle fullscreen original do telefone, que não tem tap nativo tablet,
   agora abaixo do vídeo. Nada muda no layout landscape >600, tablet/Fire/menu.
5. Geometria: efeito existente observa a superfície quando selectedChannel aparece,
   e após carregamento de página; antes ele retornava em loading e não reexecutava
   com a montagem. Dependência primitiva de presença do canal; cleanup/resize/
   scroll/ResizeObserver existentes preservados. Não adicionar serviços/listeners
   novos nem restart/session por troca de aba, filtro ou rolagem.
6. Conexão direta/Three-pane/Mobile Fluxo já ausentes no JSX atual. Provar ausência
   também em mobile; imagem não prova que APK atual está instalado. Sem correção
   especulativa ou relaxamento de guard. Native/ponte/ativação intocados.

## Allowlist estrita

- src/ui/components/Header.tsx: versão vs mensagem de sincronização somente.
- src/ui/components/AppShell.tsx: condição Back Live e classe de rota somente.
- src/ui/pages/LiveTvPage.tsx: dois tabs, preview permanente/remoções descritas,
  classe mobile e dependência de montagem da geometria; handlers restantes iguais.
- src/index.css: bloco adicional mobile escopado; prefixo anterior byte-idêntico.
- scripts/test-c11-landscape-navigation-browser.mjs: asserts novos de duas abas/
  ordem/persistência/Back/version/all layouts/geometria; adapters locais somente,
  preservar story Fire/tablet/C9/concorrência/rolagem. Fixture TSX intacta.
- Este contrato, referência de sucessão em C11_LIVE_FULLSCREEN_GESTURES.md,
  docs/evidence/C11_LIVE_MOBILE_ALWAYS_VISIBLE_PREVIEW.md, STATUS,
  EVOLUTION_REPORT, ERRORS_AND_BLOCKERS.
- Saídas normais build/sync/Gradle/APK e backup recuperável novo
  Xandeflix-v1.0.0-standalone-before-live-mobile-cleanup.apk (6F1C4F36...9494B).
- Artefatos sintéticos/sanitizados próprios em tmp/c11-side-navigation.

## Aceitação/entrega

Skills browser/verify/verification/React: CLI ausente, Chrome/CDP isolado já
existente com gut-check imediato. Story: Live local -> seleção/tab -> mesma
prévia/autorização -> fullscreen existente -> Back. Nenhuma API/env nova,
fixtures sem backend/mídia real. Matriz Fire960/1280/TV/tablet/rotação/phone
estreito 320/390/430 e phone largo legado; uma volta Live, nenhuma versão/badge
técnico, vídeo visível em ambas abas e sem remount/restart. Erros/retry e filtro
acessíveis; list scroll não move vídeo. Guard negativo antes do patch reproduz
ausência de preview e tab redundante. Revisão hooks/cleanup/a11y/refs sem refactor.
Lock antes/depois/prebuild, guards playback/Java, build/config/package/assinatura/
assets/hash fora da allowlist obrigatórios. Native fundo opaco byte-idêntico.

Gerar APK; não presumir instalação física nem teste de mídia por fixtures.
Só celular Samsung RXGYB03FL4W/SM-S926B conectado no preflight. Atualização dele
depende de resposta explícita solicitada; sem resposta entregar APK sem instalar.
Fire/tablet não disponíveis: não reconectar/atualizar automaticamente nesta
rodada mobile. Se autorizado celular, somente install-r com.xandeflix.prebuilt,
mesma assinatura; comparar quatro privados/catálogo em RAM, publicar só igualdade
e hash público do APK. Nenhum clear/uninstall, mídia capturada, rotação persistente,
gestor/fonte/pairing. Confirmação UI sanitizada em Canais sem escolher novo canal.

Testes mitigam regressões cobertas; não garantem zero bugs ou playback universal.

### Refinamento antes do patch de altura curta

Revisão visual do fixture320x568 mostrou cabeçalho/filtro consumindo toda a
altura da lista; launcher de modal sintético (ausente no App) também consumia
88px e foi removido somente no DOM do teste, sem mudar fixture ou produto.
Exigir altura real da lista de canais >=48px, não apenas da coluna. EPG mobile
fica compacto (44px, scroll mantém conteúdo inteiro, chip de categoria duplicado
oculto somente mobile). Para viewport estreita com altura <=650px, limitar vídeo
a24vh/24dvh preservando16:9/centralização sem crop; demais dimensões mantêm largura
integral. Refinamento CSS/teste dentro da allowlist e antes do patch corretivo.

### Emenda solicitada durante a execução — fullscreen sem botão

Usuário agora determina remover também Player Nativo do celular e aplicar mesma
regra tablet/Fire. Sucede itens anteriores que preservavam esse botão original:
remover JSX do botão em TODOS layouts; segundo clique no canal selecionado usa
handler existente também no mobile. Toque na superfície Android live disponível
em telefone e tablet com tamanho conhecido>0, excluindo UI_MODE_TYPE_TELEVISION;
TV/Fire mantêm confirmação do canal. Não interpretar drag/long press como toque,
não mudar controles fullscreen/Back, eventos payload previewId, C9 ou MediaItem.
Renomear SOMENTE helper de elegibilidade isTabletPreviewTapEnabled para
isTouchPreviewTapEnabled e reduzir limiar600 para>0; undefined segue excluído.
Somente esse call-site/helper/comment no NativeAndroidPlayerPlugin.java e testes
NativeLivePreviewTapTest.java expandem allowlist. Ponte/enter/exit/fundo/FIT iguais.
Atualizar expectativas antigas do teste de fonte/button/layout conforme nova
autoridade; provar versão anterior rejeita phone tap e nova autoriza telefone,
mas rejeita TV/sizeundefined. Testes de layout exigem zero botões DOM; interação
mobile testa segundo clique e evento nativo do mesmo preview, sem nova sessão.
Sem instalação automática: resposta à pergunta pendente continua necessária.

### Emenda posterior — prévia de ponta a ponta

Usuário exige campo inline preencher largura até borda da tela. Remover limite
de largura para telas curtas definido no refinamento anterior (superseded),
manter superfície100%/16:9/sem bordas ou padding; nenhuma mudança FIT/zoom de mídia.
Em mobile curto, reduzir somente padding do filtro e altura/padding do EPG
rolável para garantir uma linha de canais sem reduzir largura do vídeo. Teste
exige left0/rightinnerWidth nos três tamanhos, além de altura da lista>=48px.
Paisagem Fire/tablet mantém largura da própria coluna, não cobre categorias/menu.

### Emenda posterior — orientação somente do celular

Usuário exige interface APENAS retrato em celulares; só player fullscreen pode
usar paisagem. Política nativa pura em MainActivity.phoneUiOrientation(dp,uiMode,
fullscreen): tamanho conhecido0<smallestScreenWidthDp<600 e não televisão =
PORTRAIT na UI e SENSOR_LANDSCAPE no fullscreen. Outros tamanhos/TV/undefined
retornam UNSPECIFIED como sinal de NÃO INTERFERIR (não aplicar esse valor).
applyPhoneUiOrientation(Activity,boolean) idempotente/null-safe, chamado no
onCreate antes da inicialização Bridge e somente depois do flag fullscreen
válido no enter; exit ativo restaura portrait depois de flagfalse. Nenhuma
orientação global Settings/sensor/manifest/storage ou licença alterada.
NativePlayerActivity já usa sensorLandscape para VOD; fica byte-idêntica.
Sem segunda Activity/player/MediaItem/requisição nem remount nativo na rotação;
MainActivity já tem configChanges orientation/screenSize, manifest intacto.
Release/Back continuam passando pelo exit. Não chamar política em resize React.
Sucede restrição anterior de enter/exit inteiramente byte-idênticos APENAS
adicionando dois calls da política; preto/transparent/FIT permanecem iguais.

Allowlist extra prévia: MainActivity.java somente imports Activity/ActivityInfo/
Configuration, helper puro/aplicador e chamadaonCreate; novo teste unitário
android/app/src/test/java/com/xandeflix/prebuilt/PhoneUiOrientationPolicyTest.java
para telefone360/599, tablet600/800, TV pequeno/grande/nightmask, undefined/null.
Novo scripts/test-c11-phone-ui-orientation.mjs: guard dos call-sites/onCreate/
enter/exit/back/release/manifestVOD e negativos em RAM contra lock global/tablet,
perda do restore e requisição antes da validação. Java testes reais obrigatórios.
Native não aplica Settings, não persiste orientação; Fire/tablet não mudam.
Limites: teste browser não simula WindowManager Android; sem instalação/ação
física autorizada não alegar rotação física homologada. Se permitido celular,
verificar requestedOrientation UI/fullscreen/retorno sanitizado e mesma sessão,
sem acessar fonte/gestor/chave, rodar só canal já ativo. Ativação permanece intacta.

Verificador existente pode acrescentar render SSR isolado do Header real via
TypeScript/React já instalados: versão1.0/undefined/empty/Teste local não exibidas,
Sincronizando... ainda acessível como status. Sem fixture TSX, prop pública ou
dependência nova. Smoke mobile inclui filtro sem restart e seleção de outro
canal (uma aquisição normal), depois confirmação/tap do mesmo preview.
Referências primárias da orientação:
[activity/configChanges](https://developer.android.com/guide/topics/manifest/activity-element),
[limites em telas grandes](https://developer.android.com/develop/adaptive-apps/guides/app-orientation-aspect-ratio-resizability).

Nota de proveniência: apply_patch normalizou somente UMA quebra CRLF do contexto
no fechamento do bloco CSS anterior. Recuperar essa quebra em RAM recupera o
SHA25613A0D8EB...502E byte-exato do prefixo; todo seu texto/regras está preservado.
O requisito de prefixo byte-idêntico acima é limitado por essa normalização de
EOL do contexto, não permite editar qualquer regra anterior. Nenhum formatter
ou normalização global foi executado. Guard novo inicialmente deixou limiar6000
passar por regex sem word boundary; negativo revelou defeito no VERIFICADOR,
corrigido antes da entrega, sem mudar política de produção ou relaxar requisito.

### Entrega autorizada no celular primeiro — 2026-10-05

Usuário autoriza instalar primeiro no celular SEM limpar o aplicativo; teste
de versão limpa fica para ciclo posterior, não autorizado nesta execução.
Somente Samsung SM-S926B/RXGYB03FL4W, com.xandeflix.prebuilt, install -r do APK
já validado SHA2564B66D7BF13A4E32B5F684E965C8A593568F6A03D0573644FBDBA5A781BFF835A.
Não rebuildar nem alterar produção/testes/APK. Verificar package/assinatura e
lock oficial antes da entrega; comparar quatro arquivos privados e catálogo
em RAM imediatamente antes/depois, publicando somente igualdade/contagens.
Abrir normalmente e confirmar processo/UI/orientação solicitada, sem escolher
nova fonte/canal, capturar mídia ou alterar Settings/sensor/rotação persistente.
Permite registro sanitizado em tmp próprio e alteração somente deste contrato,
evidence correspondente, STATUS, EVOLUTION_REPORT e ERRORS_AND_BLOCKERS.
Baseline405 deve permanecer idêntico. CURRENT_GATE=NONE; sem próximo Gate,
Git/backend/gestor, reset/uninstall/rotação de identidade ou outros aparelhos.

### Emenda prévia — categoria não troca canal em reprodução — 2026-10-05

Novo pedido: navegar nas categorias altera somente a coluna de canais. Canal
em reprodução deve permanecer até seleção explícita de outro canal, em todos
layouts. Primeira entrada mantém seleção inicial determinística do primeiro
canal do primeiro grupo; carga assíncrona inicial não sobrescreve clique posterior.
Categoria vazia, falha de página, filtro, paginação ou retorno ao grupo original
não trocam/remontam player nem readquirem/liberam C9; mantêm erro atual, se houver.
Identificação/logo/EPG continuam associados ao canal ativo, não à lista navegada.

Causa observada na fonte: handleGroupSelect zera selectedChannelId/groupPage;
as respostas de página selecionam primeiro ID; memo selectedChannel deriva da
página atual com fallback para primeiro canal. Separar em estado LiveChannel
estável e independente da lista. Resolver primeiro canal somente na inicialização
e página inicial do primeiro grupo se estado ainda nulo; handler de canal
atualiza o objeto após clique. Remover setters de seleção/erro/telemetria de
canal do handler de categoria e setter de canal da paginação, não mudar serviços.
Callbacks de preview/session/native, listeners, retry, fullscreen/Back e C9 iguais.
Sem alterações em classificação, layout, Java, ativação, boot, source/storage.

Allowlist estrita deste ciclo: src/ui/pages/LiveTvPage.tsx somente separação
descrita; scripts/test-c11-landscape-navigation-browser.mjs somente modo isolado
--live-category-only/adapters/asserções de retenção (fixtures padrão intactas);
este contrato/evidence correspondente/STATUS/EVOLUTION_REPORT/ERRORS_AND_BLOCKERS;
saídas normais build/sync/APK e novo backup recuperável
Xandeflix-v1.0.0-standalone-before-live-category-retention.apk (4B66D7BF...FF835A).
Artefatos sintéticos próprios tmp/c11-side-navigation permitidos. Baseline405
prévio idêntico. CURRENT_GATE=NONE, nenhum Gate novo/Git/backend/reset/60s.

Testar componente real com adapters sem backend/mídia em celular390, tablet1280
e Fire960: categoria normal/vazia/falha/rápida/reseleção, filtro/paginação, mesmo
previewId/DOM e contadores start/stop/acquire/release constantes; novo clique
troca apenas uma vez, confirmação/tap/fullscreen/Back reutilizam preview, erro
não desaparece por navegar. Novo teste deve rejeitar código anterior antes do
patch. Rodar regressões mobile/layout/gestos/C9/VOD/Live/locks e build/assinatura/
assets; fora da allowlist hash idêntico. Browser não homologa reprodução física.
Skill verification para UI -> página local -> canal estável -> preview/session;
CLI browser ausente, fallback Chrome/CDP isolado existente com gut-check inicial.
Não ler env/gestor/backend: nenhuma dessas fronteiras muda ou explica esse bug.

Gerar APK; atualização in-place no celular depende de resposta explícita à
pergunta desta rodada, não presumir autorização antiga para nova entrega.
Se autorizado, somente SM-S926B/RXGYB03FL4W, install-r/memo package/assinatura,
comparar quatro privados/catálogo em RAM e abertura normal. Nenhuma instalação
limpa antecipada, Settings/rotação persistente, seleção de fonte/canal real novo
ou instalação em tablet/Fire autorizada por esta emenda.

Reteste de categoria já selecionada revelou outro defeito do mesmo handler:
zerava groupPage mesmo sem mudança de effectiveGroupId, então efeito não relia
a página. Ajuste prévio autorizado no mesmo recorte: resetar grupo/página
somente se ID realmente mudou; manter limpeza de filtro e aba mobile existentes.
Adicionar effectiveGroupId ao callback; não alterar serviço/paginação/preview.

Regressão executável consolidada para futuras mudanças Live:
node scripts/test-c11-landscape-navigation-browser.mjs --live-category-only,
obrigatória antes/depois de alterações em seleção/categorias/paginação/preview,
junto às suítes mobile/gestos e lock de ativação. Não substituir por afirmação
em chat, remover controles ou relaxar contadores para aceitar troca automática.

Harness: backup APK criado durante browser fixture acionou watcher Vite/EBUSY
em Windows, fora do produto. Permitir somente acrescentar **/*.apk à lista já
existente de watch.ignored do harness para não observar artefatos de distribuição;
cleanup só Chrome isolado da fixture, nenhum browser pessoal ou dispositivo.

### Pedido adicional durante o ciclo — Home do celular sem Voltar

Usuário reporta botão Voltar na Home mobile após navegar entre rotas. Especificação
prévia: não mostrar esse botão somente na Home do layout estreito do celular
(breakpoint existente<600, UI nativa phone já retrato). Manter histórico/callbacks,
Back de outras páginas, Voltar local Live, tablet/Fire e fullscreen intactos.
Allowlist adicional: AppShell.tsx somente classe app-shell--home-page derivada
de currentView; index.css somente regra adicional max-width599 escondendo
.app-shell--home-page .app-header .btn-back por display:none. Nada de novo hook,
UA/device ID/storage ou alteração de route-state/Header/ativação/Java.
Harness pode acrescentar --phone-home-back-only para verificar Home após navegação
com histórico em320/390/430, Back nas outras páginas/Live e preservação tablet
portrait/landscape/Fire. Novo teste deve rejeitar versão anterior ao patch.
Revisão React dos dois TSX: objeto ativo estável, setState funcional/cancelamento
existentes e cleanup de listeners, somente classe visual no shell; sem refactor.
Gerar artefato final com os dois ajustes; build intermediário só categoria não
foi entregue/instalado/copied ao APK raiz e não substitui validação final.

### Emenda de entrega — atualizar os três dispositivos sem limpeza — 2026-10-05

Pedido atual autoriza instalar o APK final já validado nos três aparelhos usados
nos testes: celular SM-S926B/RXGYB03FL4W primeiro, tablet SM-X610/RX2X301Q3KY
e Fire Stick AFTSSS/192.168.3.104:5555. Esta autoridade substitui a restrição
anterior de entrega somente no celular; não autoriza qualquer outro aparelho.
Artefato: Xandeflix-v1.0.0-standalone.apk, SHA256
9FF238019553263CCADE6964FBE471C2BF575030A62A7E4B45C601DE13F9CF80.
Somente atualização in-place install -r de com.xandeflix.prebuilt, com package,
assinatura e hash conferidos. Nunca limpar dados, desinstalar ou recriar chave.

Antes/depois de cada instalação, comparar em RAM os quatro arquivos privados
de identidade/chave/instalação/ativação e todos os arquivos do catálogo local,
publicando somente igualdade e contagens. Não persistir conteúdos/digests
privados. Comparar imediatamente após instalar, antes da abertura normal.
Confirmar hash público instalado e abertura/processo; testes de reprodução,
gestos e orientação física continuam dependentes de validação do usuário.

Nenhuma alteração de produção/testes/build/APK autorizada neste ciclo. Allowlist
de registro: este contrato, evidence correspondente, STATUS, EVOLUTION_REPORT
e ERRORS_AND_BLOCKERS; artefatos sanitizados próprios em tmp permitidos.
Baseline atual de405 arquivos deve ficar byte-idêntico antes/depois. Lock de
ativação obrigatório antes da entrega. CURRENT_GATE=NONE, nenhum próximo Gate,
Git/backend/gestor/Settings/fonte/canal real/limpeza/retomada do prazo60s.
Aparelho não conectado ou ADB recusado permanece pendente, sem declarar sucesso
por intenção. Solicitar conexão/IP/depuração ao usuário; não procurar outros
alvos nem interferir no package/projeto original protegido.

### Emenda prévia — Voltar à direita e só ícone no celular — 2026-10-05

Pedido atual: nas rotas Filmes, Séries e Busca do celular, o botão do Header
deve ficar à direita da marca, somente seta, sem empurrar a marca para a direita.
Home continua sem Voltar; Live usa seu controle próprio; demais rotas e tablet/
Fire ficam intactos. Preservar aria-label, foco, histórico, callbacks e status
de sincronização. Nenhuma mudança de classificação/orientação/ativação/player.

Allowlist deste novo ciclo: AppShell.tsx somente classe visual adicional
app-shell--phone-header-back nas três rotas indicadas; index.css somente bloco
adicional max-width599 nessa classe, header-left flexível, gap compacto, botão
order1/margin-left:auto e área touch>=44px, back-label oculto. Header.tsx e
route-state ficam byte-idênticos, sem novos hooks/listeners/refactor.
scripts/test-c11-landscape-navigation-browser.mjs somente novo modo isolado
--phone-header-back-only com asserções de geometria, texto, acessibilidade,
retorno/foco, Home/Live e tablet/Fire inalterados. Fixtures existentes intactas.
Este contrato/evidence correspondente/STATUS/EVOLUTION_REPORT/ERRORS_AND_BLOCKERS
e saídas normais build/sync/Gradle/APK recuperável são permitidos. Backup novo
Xandeflix-v1.0.0-standalone-before-phone-header-back.apk guarda9FF23801...F9CF80;
não sobrescrever backups anteriores. Baseline405 atual capturado antes do patch;
fora da allowlist todos hashes devem ficar idênticos. CURRENT_GATE=NONE, sem
Git/backend/gestor/Settings/limpeza/novo Gate/retomada60s.

Story de verificação: navegação mobile -> rota e Header real -> ícone à direita
com nome acessível -> mesmo callback -> Home sem Voltar. Sem API/env/source:
fixtures isoladas sem backend/mídia, gut-check ao abrir dev server. CLI browser
não disponível, fallback Chrome/CDP isolado existente. Novo teste deve rejeitar
baseline antes da mudança; celular320/390/430 exige marca ancorada à esquerda,
sem sobreposição/overflow, botão à direita da marca e só seta, clique/Enter
mantêm retorno. Regressões Home14, Live categoria43, mobile26, gestos25 e matriz
lateral59 obrigatórias; lock antes/depois/prebuild/pré-entrega, package/assinatura/
assets e preservação Java/ativação exigidos. Testes browser não provam mídia física.

Usuário também confirmou reconexão para concluir atualização dos três aparelhos.
Após validar novo APK, autoriza install-r mesmo package/assinatura, sem limpeza,
no celular SM-S926B/RXGYB03FL4W primeiro se acessível, tablet SM-X610/RX2X301Q3KY
e Fire AFTSSS/192.168.3.104:5555. Quatro privados/catálogo comparados em RAM
imediatamente antes/depois, só igualdade/contagens; hash público e abertura normal.
Alvo ainda inacessível fica pendente, nunca resetar/recriar identidade ou procurar
outros dispositivos. Teste limpo segue adiado e depende de nova autoridade.

Usuário atualizou o IP do mesmo Fire Stick para192.168.3.103; substituir apenas
o endpoint autorizado por192.168.3.103:5555 neste ciclo, exigindo modelAFTSSS
e mesmo package/certificado. Não continuar tentativas no IP antigo nem buscar
outros alvos. Demais limites de atualização/preservação permanecem iguais.

Novo teste confirmou celular correto, mas assumiu margem32px no tablet landscape,
incompatível com o gutter já consolidado. Comparar borda direita do botão com
borda de app-content menos o right computado de page-back-row, tolerância1px;
não alterar CSS/layout tablet para satisfazer constante artificial do teste.

### Emenda posterior — Home sem Voltar em todos os dispositivos — 2026-10-05

Usuário observou botão na Home do tablet e determina ausência na Home de TODAS
as telas: telefone, tablet portrait/landscape, Fire/TV. Sucede preservação de
Voltar na Home não-phone das emendas anteriores. Histórico e ação Back hardware
continuam intactos; somente não renderizar botão da Home. Demais rotas mantêm
Voltar existente (incluindo seta à direita das três rotas phone e Back local Live).

Spec anterior ao código: AppShell.tsx acrescenta currentView !== 'home' tanto
à prop canGoBack do Header quanto à condição de page-back-row. Não mudar
route-state/handlers/hook/Header/Live/CSS/orientação/ativação/catálogo/player.
Allowlist: AppShell nesses dois guards; harness existente --phone-home-back-only
com expectativa Home universal sem DOM/controle visível e retorno em outras
rotas em phone320/390/430, tablet portrait/landscape, Fire/TV e phone largo;
este contrato/evidence correspondente/STATUS/EVOLUTION_REPORT/ERRORS_AND_BLOCKERS,
saídas build/sync/Gradle/APK e backup novo
Xandeflix-v1.0.0-standalone-before-home-no-back-all.apk =B3B0D71E...4D3623.
CSS/Java/Header/ativação e demais arquivos preservados. Baseline atual405
de B3B capturado e fora de AppShell/harness/APK byte-idêntico. CURRENT_GATE=NONE.

Novo teste rejeita baseline antes dos guards, confirma Home com histórico real
sem botão e retorno preservado fora da Home em todas as classes de tela. Rodar
novamente novo35/retorno/Home, Live categoria43/mobile26/gestos25/matriz59, lock
antes/prebuild/final e guards; verificar package/assinatura/assets/hash. Entrega
atualizar os mesmos três dispositivos conectados com install-r/sem reset e
comparação RAM de quatro privados/catálogo/hash público/abertura normal. Tablet
já atualizado B3B foi desconectado pelo usuário; se não reconectar, novo APK
fica pendente nele, não declarar entrega universal da versão final. Sem Git/
backend/gestor/Settings/chave nova/próximo Gate/retomada60s/teste limpo.

### Refinamento adicional — altura e seta centralizada no Header phone

Usuário enviou Filmes/Séries/Busca com botão ultrapassando a borda inferior do
cabeçalho e solicita mais altura/seta centralizada. Nessas três rotas phone<600,
Header terá64px mais safe-area top, sem mexer nos outros layouts/rotas ou Live.
Botão44px fica inteiramente dentro do Header; ícone vetorial20px centralizado
por flex, sem dependência da baseline do glifo tipográfico. Aria-label mantido.

Allowlist adicional prévia: Header.tsx apenas wrapper back-icon do ícone com
glifo legado e SVG decorativo/back-arrow-icon. CSS esconde SVG por padrão;
somente nas três rotas phone mostra SVG/oculta glifo, mantém outros ícones iguais,
acrescenta altura/min-height64px+safe-area/max-heightnone e centraliza wrapper.
Header handlers/props/nav/status/return invariantes. Harness --phone-header-back-only
acrescenta altura/containment/centragem do SVG/ausência de texto visível. Primeiro
rejeitar altura antiga, depois validar três larguras e layouts intactos. Revisão
React dos dois TSX: derivação em render, sem state/effect/listener/IO novo;
SVG decorativo/focusablefalse, callback e nome acessível preservados.
Esta emenda sucede proibição anterior de editar Header/CSS somente neste recorte.
APK final único reúne Home sem Voltar universal e cabeçalho phone refinado.

### Complemento — Home phone com a mesma altura de cabeçalho

Usuário agora exige que Home mobile tenha a mesma altura64px+safe-area top de
Filmes/Séries/Busca. Alteração mínima anterior ao código: acrescentar somente
#root .app-shell--home-page .app-header ao mesmo seletor de altura max-width599.
Não acrescentar botão Home, não alterar tablet/Fire, Live/outros cabeçalhos,
SVG/ícone/handlers/histórico/native/ativação. Allowlist: essa linha index.css,
harness --phone-header-back-only com assert Home64px/sem botão antes de navegar,
este contrato/evidence/STATUS/EVOLUTION_REPORT/ERRORS_AND_BLOCKERS, build/sync/
Gradle/APK e backup recuperável novo
Xandeflix-v1.0.0-standalone-before-home-header-height.apk =5C34E11D...7052AFC.
Baseline atual405; demais arquivos byte-idênticos. Novo assert deve rejeitar
5C34 antes do patch; executar suites de cabeçalho/Home e regressões existentes,
lock prévio/prebuild/final/package/assinatura/assets. Atualização-r dos mesmos
três aparelhos disponíveis, sem limpar dados, comparação RAM privados/catálogo,
hash público/abertura. CURRENT_GATE=NONE, sem Git/backend/Settings/novo Gate/60s.
