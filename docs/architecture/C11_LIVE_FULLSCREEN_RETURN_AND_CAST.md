# C11 — retorno da tela cheia Live, Cast e alinhamento EPG — 2026-10-07

Pedido novo durante a conferência do guia: Cast permanentemente visível na
tela cheia Live; preview fora da posição no retorno até tocar; guia aberto
com espaço vazio acima após esse retorno. LATEST_REGRESSION_WINS: entrega
final depende destas correções, não afirmar conclusão do APK intermediário.

Mesmo preflight clone independente C11/main/HEAD61ec0090/origin canônico e
baseline669 do ciclo EPG, dirty anteriores preservados. AGENTS/contratos/
Source Boundary/lock lidos. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.
Solicitação corretiva local e update-r previamente autorizados; sem Git,
backend, reset, source/C9/credenciais, mídia nova ou próximo Gate.

## Allowlist e implementação previamente especificada

- NativeAndroidPlayerPlugin.java: Cast inline-fullscreen usa visibilidade do
  controlador Media3 e condição !PiP; inline oculto. Show/hide dos controles
  acompanha entrada/saída de fullscreen; mesma View/ExoPlayer/sessão. Atualizar
  última geometria inline ao receber bounds; evento de saída depois de pedir
  orientação UI. Não alterar URL/candidatos/media/playback/autorização.
- Novo NativeLiveCastVisibilityTest.java: estados inline/fullscreen/controles/
  PiP e sequência de entrada/ocultação/toque/retorno, política pura.
- LiveTvPage.tsx: realinhar bounds após fullscreen/resize/orientação/viewport
  visual/retorno visível; frame seguinte e retries limitados80/250/600ms,
  com cleanup. Sem polling infinito, player novo ou gesto necessário.
- LiveEpgPanel.tsx: substituir altura congelada por top relativo ao preview
  e bottom0. offsetTop/offsetHeight em CSS pixels (fallback rect/escala),
  medir ao abrir e após retorno/orientação/layout; frame e retries limitados,
  ResizeObserver/listeners removidos. Não mover a superfície do vídeo.
- Este contrato/evidência, contrato EPG, relatório e quatro memórias append-only;
  harnesses ignorados e saídas dist/Capacitor/APK usuais.

Restringir atualização de bounds ao inline; ref/ID estáveis; fullscreen nativo
permanece autoridade. Browser deve exercitar portrait→landscape→portrait e
mudança de escala/layout, garantir painel colado ao preview sem tocar tela.
S24: expandir player por toque/bridge existente, Cast aparece com controles
e some após timeout; Back restaura bounds nativos/DOM e guia sem lacuna,
em ciclos repetidos. Validar geometry em UIAutomator comparada a DOM/density,
com tolerância de arredondamento; não gravar URL, credenciais ou mídia em logs.
Build/lock, testes nativos, assinatura/assets e update-r nos três alvos; relatório
com limites reais. Esta correção sucede apenas restrições antigas de não
alterar geometria/controllers nativos no escopo específico dos pedidos acima.

## Emenda prévia — toque do controlador em fullscreen

QA físico distinguiu o botão Cast virtual do Header (android.widget.Button)
do botão nativo do player (android.widget.ImageButton). O primeiro falso
positivo era do harness. Contudo, o toque fullscreen não reabria controles:
createPreviewView deixa PlayerView.setClickable(false) para o gesto inline;
ao retornar false no listener fullscreen, o PlayerView precisa novamente ser
clickable para executar performClick/toggleControllerVisibility do Media3.
Habilitar clickable apenas na promoção fullscreen e desabilitar no retorno
inline. Sem mudar listener inline/URL/player/sessão/PiP. Repetir QA no APK;
contar somente ImageButton nativo e conferir timeout e toque reais.
Referência primária da versão usada:
[PlayerView Media3 1.5.1](https://github.com/androidx/media/blob/1.5.1/libraries/ui/src/main/java/androidx/media3/ui/PlayerView.java).

## Emenda prévia — estados de animação e listener da View ativa

Repetição física: segundo ciclo mostrou controles sem Cast. Listener genérico
reporta VISIBLE também em estados de animação/barra parcial do Media3. Derivar
visibilidade de isControllerFullyVisible no callback, ignorar callback de
PlayerView substituído/liberado e remover listener antes de liberar a View.
Ao exibir Cast, elevar sua View acima das camadas de controle. Estado continua
condicionado a fullscreen/!PiP; sem timer independente ou media/player novo.
Revalidar dois ciclos, captura após animação, ocultação, retorno e guia.

## Emenda prévia — pertencimento ao controlador Media3

A repetição ainda mostrou ausência no segundo ciclo. Substituir a sincronização
manual de visibilidade por pertencimento: inserir o ImageButton Cast no
FrameLayout exo_controller, em vez de no PlayerView independente. Assim a
visibilidade/animacão do ancestral Media3 governa o ícone junto aos demais
controles. Política própria apenas fullscreen&&!PiP; inline/PiP ocultam filho.
Remover flag/listener manual anteriores, sem timer/instrumentação/SDK novo.
Testes de política pura verificam elegibilidade fullscreen/PiP; visibilidade
dos controles é verificada na hierarquia/capturas reais. Mesma sessão/View.

## Emenda previa - fase visual dos controles

Contencao no exo_controller resolveu pertencimento, mas esse ancestral
permanece visivel por uma fase em que somente a barra de progresso aparece.
Capturas repetidas ainda mostraram um frame sem Cast junto aos controles.
Sincronizar o filho com visibilidade/alpha reais de exo_controls_background
no OnPreDraw da PlayerView ativa; nao depender de evento VISIBLE generico
ou isFullyVisible durante animacao. Manter INVISIBLE quando oculto para
preservar geometria medida. Mutar apenas propriedades diferentes, ignorar
View antiga e remover callback antes de liberar. Sem polling/timer novo,
sem stream/sessao/receptor novo, mesmo timeout e animacao Media3.
Validar entrada/toques repetidos, frames durante exibicao/fade/barra parcial,
timeout, dois retornos sem toque e guia; teste anterior sem Cast nao e PASS.
