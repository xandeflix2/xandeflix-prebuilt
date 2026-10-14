# C106 — toque na imagem do hero abre detalhes

## Autorização e preflight — 2026-10-14

Pedido explícito: no celular e tablet, além de Ver Detalhes, clicar/tocar na
imagem abre a página interna do conteúdo atualmente exibido. Aplica a hero de
Home/Filmes/Séries e hero de categoria que reutiliza Hero; nenhuma mudança no
player, catálogo, fonte, busca, boot ou tamanhos/posições definidos no C105.

Clone ativo C:\Xandeflix\xandeflix-prebuilt-c11-main, Git próprio, main,
origin esperado e HEADd039f8837dfcfd44374560a9e6642cb93e59c2cf confirmados.
AGENTS/Architecture/Execution/Source Boundary/Activation Lock lidos. Dirty
C100–C105 conhecido será preservado e conferido por digest privado. Historical
workspace somente leitura. CURRENT_GATE=NONE; ciclo local autorizado C106.
Nenhum commit/push/PR, backend, publicação ou reset autorizado.

## Especificação anterior ao código

- Reutilizar o callback onSelect do botão Ver Detalhes com o mesmo item do Hero.
  Área da imagem recebe botão transparente acessível, sem duplicar callback dos
  botões/indicadores e sem alterar metadados ou layout. Enter/Space dessa área
  abrem detalhes, nome acessível inclui título. Botões existentes permanecem.
- Perfil PHONE/TABLET explícito tem prioridade; fallback usa identificação de
  celular/tablet sem confundir TV/Fire/desktop por largura ou orientação. Válido
  em retrato, paisagem e dobrável quadrado. TV/Fire não recebem nova ação/foco.
- Imagem continua permitindo swipe horizontal. HomeHero admite início de gesto
  na área da imagem; toque simples abre detalhes, arrastar não abre detalhes.
  Movimento vertical, lento/inválido, cancelamento ou mudança de item durante
  gesto não pode produzir navegação por clique residual. Timer10s, dots, botões
  Assistir/Ver Detalhes e guards de playback continuam como antes.
- Sem elemento interativo aninhado. Imagem preservada/gradiente atual e hit area
  dedicada atrás de metadados/botões, foco visível restrito ao novo botão.
- Autorizações anteriores de instalação-r nos alvos celular USB e tablet Wi-Fi
  persistem para refinamento de UI; atualizar somente esses dois após testes/
  build/assets/assinatura/lock, preservando identidade/chave/ativação/fonte/
  catálogo. Fire permanece no C105; sua UI deve passar regressão sem nova ação.
  Se algum alvo desconectar, concluir código/build e informar disponibilidade,
  sem reset/rotação/instalação em outro alvo.

## Allowlist estrita e validação

Hero.tsx, HomeHero.tsx, src/index.css (somente botão de imagem), teste novo
scripts/test-c106-hero-artwork-tap.mjs e fixture/browser privado em tmp/c106.
Este contrato, evidência C11_HERO_ARTWORK_DETAILS_TAP.md, STATUS/EVOLUTION/
ERRORS; helpers privados de baseline/build/instalação. Mocks de apresentação
em testes existentes somente se necessários para nova dependência, preservando
todas as assertions. DECISIONS/C100–C105/source/Android/versão ficam intactos.

Aceitação: toque de imagem → detalhe do item exibido nos dois perfis/formatos;
teclado acessível; swipe/dots/timer/scroll e botões sem navegação dupla; TV/Fire/
desktop sem ação adicional. Testes direcionados/TypeScript/build/lock verdes,
APK de produção com assets idênticos/mesma assinatura; QA e instalação reais
relatadas separadamente de fixtures. Sem repetir medição limpa ou prometer90s.

`CURRENT_LOCAL_CYCLE=C106_IMPLEMENTATION; NEXT_GATE_STARTED=NAO;
GIT_COMMIT_AUTHORIZED=NAO; GIT_PUSH_AUTHORIZED=NAO; GIT_PR_AUTHORIZED=NAO`.

## Emendas Fire Stick recebidas durante C106

Usuário relata ausência de rotação automática10s no Fire. Probe no C105 real
confirmou hero com5 pontos, página visível/reduced-motion=false e foco no botão
Assistir: item permaneceu igual após11,5s. Foco persistente do controle remoto
não deve bloquear rotação em standby no Fire. Emenda HomeHero: foco/hover não
pausam permanentemente SOMENTE Fire, preservando pausas por gesto/loading/
playback/página invisível/reduced-motion. Timer mantém10000ms e consulta avanço
atual por ref; chegada de novas artes sem trocar item exibido não reinicia prazo.
TV genérica/celular/tablet mantêm pausa de foco/hover existente. Mudança de item
ou ação de seleção continua iniciando ciclo correspondente, CTA usa item atual.
Autorização anterior de Fire USB persiste para esta correção; atualizar três
alvos após verificação conjunta, sem reset, no mesmo ciclo C106.

Pedido seguinte: diminuir fonte dos nomes na coluna Canais do Fire para o mesmo
tamanho dos nomes de Categorias. Allowlist CSS index.css permite override
SOMENTE `.app-shell--fire-stick .live-continuous-name` e subtexto de formato,
usando escala tv-font-xs existente da categoria. Probe real: categoria10px e
canal13,6px; reduzir nome para10px e subtexto para não ficar maior que o nome.
Fallback mantém .85rem original fora da escala TV. Não aumentar/mudar categorias, outros dispositivos,
altura64px da janela virtual, logos, filtros ou player. Confirmar computed font
antes/depois e alcance do último canal, além de rotação real11s no Fire.

## Emendas de transição Live e moldura do hero — antes do código

Pedido explícito: ao sair de Live para Home no Fire, a superfície nativa não
pode permanecer sobre o hero. A rota deve aguardar o cancelamento da operação
Live e o fechamento confirmado da prévia, incluindo start/C9 ainda pendente.
Registrar guard da página no App; navegação/Home/Back centralizados aguardam
o guard apenas ao deixar Live. Cancelar antes de aguardar e fechar superfície
antes de Cast/release C9. Troca de canal retém superfície/fullscreen/PiP e
suspende mídia antes de release, como antes. Clique repetido compartilha cleanup;
só a última intenção de navegação vence. Falha mantém Live e permite retry,
sem liberar sessão enquanto player segue ativo nem iniciar acesso não autorizado.
stopPreview nativo confirma accepted, rejeita ID de outra prévia e oculta a
PlayerView antes do release. Não ocultar o host que também contém WebView.

Pedido visual seguinte: contorno fino em todos os heroes/dispositivos, sem
interceptar toque/foco, e reduzir levemente somente Fire. Adotar linha interna
1px clara discreta e altura aproximadamente6% menor no Fire para Home/Filmes/
Séries; manter largura, contain da arte, metadados/botões/indicadores internos.
Celular/tablet/TV genérica mantêm dimensões. Pedido de APK para outro dispositivo
autoriza entrega do artefato final recuperável; não instalar em alvo desconhecido.

Allowlist adicional estrita: src/App.tsx (barreira de saída Live),
src/ui/pages/LiveTvPage.tsx (cancelamento/cleanup/guard),
android/app/src/main/java/com/xandeflix/prebuilt/player/NativeAndroidPlayerPlugin.java
(stopPreview/releasePreview), seu NativeAndroidPlayerPluginTest.java e novo
scripts/test-c106-live-preview-route-exit.mjs. index.css permite somente moldura
global do hero e redução Fire. Guardar cópias/digests pré-emenda de App/Live e
nativos; manter todas as demais52 proteções C106 e7 congeladas C100. Testar
start atrasado, Cast atrasado, troca de canal, cancelamento, falha/retry,
intenções repetidas e ID stale; regressões C9/ativação/hero/lista e JVM, além
de QA de transição real no Fire, reportada sem confundir DOM com frame nativo.

Fechamento do ciclo: mocks antigos só podem ganhar port useLayoutEffect para
essa dependência; nenhuma assertion pode ser removida/relaxada. Build/testes/
artefato/instalações/QA concluídos e registrados na evidência correspondente.
CURRENT_LOCAL_CYCLE=C106_UI_INSTALLED; NEXT_GATE_STARTED=NAO;
GIT_COMMIT_AUTHORIZED=NAO; GIT_PUSH_AUTHORIZED=NAO; GIT_PR_AUTHORIZED=NAO.
