# C148 - guia por foco e foco inicial no canal ativo - 2026-10-17

Spec anterior ao codigo e emendas: docs/architecture/C11_LIVE_BROWSE_GUIDE.md.
Preflight clone ativo c11-main/main, origin esperado, HEAD
bd7e10c7c069df66328309105b6b210d04c7cf2d; baseline1175/copias em
tmp/c148-live-browse-guide. C147 confirmado visualmente pelo usuario e auditado
antes deste ciclo; contratos lidos, Source Data Boundary integralmente relido.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem Git/backend/install/reset.

## Pedido e primeira fronteira

Usuario pediu guia abaixo do preview sem sintonizar outros canais e, durante
o trabalho, foco inicial no ultimo canal ja restaurado. Antes do patch,
ContinuousList nao emitia inspecao por foco/hover e guia recebia somente
selectedChannel do player. Teste --baseline reproduziu essas duas condicoes.
Pedido de foco tambem constatou request inicial focus=false e ausencia de
posicionamento do ultimo canal quando fora da primeira pagina.

## Mudancas

ContinuousList notifica onInspect opcional por foco/hover mouse. Clique/OK,
longpress favorito, teclado e loaders mantidos. LiveTvPage retém somente um
canal inspecionado, escopado a snapshot/canal ativo/grupo/filtro/revisao
parental/sessao adulta. Retorna ao canal ativo em escopo diferente ou se
canShowParentalLive negar. Consulta metadados somente de canais visiveis;
nao libera conteudo, concede grant ou provoca PIN ao apenas focar.

Guia DOM recebe esse canal; identificacao/favorito/AO VIVO/NativeLiveContext/
EPG fullscreen permanecem do canal ativo. Rotulo Programacao distingue guia
de outro canal. Primeira consulta de outro canal espera250ms; troca rapida
cancela timer, aborta consulta em curso e descarta resposta antiga. EPG ativo
continua imediato, refresh60s/relogio15s e mensagens reais de ausencia/erro.

Foco inicial usa loadChannelById ja existente e uma pagina local48, calcula
indice visivel exato e emite request uma vez. Index opcional na lista funciona
sem seed (parental configurado) e target.focus preventScroll; rolagem da
lista, nao ativacao do canal. Abort/escopo/interacao impedem operacao tardia.
Cleanup/replay conserva direito ao foco ate efetiva resolucao. focusBlocked
conserva foco pendente enquanto PIN esta aberto, reaplicando apos fechamento.
Estado novo de guia agrupado apos hooks existentes da lista; ordem relativa
dos hooks antigos preservada. Nenhuma alteracao em escolha/last channel store.

## Verificacoes

-9 testes C148 PASS: eventos foco/mouse/touch/clique, selecao ativa separada,
  escopo/parental, ligacao em4 layouts, foco distante uma vez, cancelamento/
  interacao/modal/cleanup replay, indice207 sem seed/PIN bloqueando foco,
  debounce/refresh ativo e abort/resposta atrasada. Portas sinteticas reais,
  nenhum pedido de fonte/midia real.
- Regressao C105 busca8, lista continua6, C107 EPG4, C124 favoritos10,
  C106 saida preview8, C128 parental11 PASS: total56 casos com C148.
  Teste C107 recebeu apenas bindings guideChannel/browsingGuide no fixture;
  asserts anteriores intactos e auditados inversamente.
- Teste novo de ligacao JSX falhou inicialmente porque fixture nao fornecia
  exports ao CommonJS emitido por TS. Adicionado exports vazio no harness;
  codigo produtivo/asserts inalterados. Log do erro preservado.
- Primeiro audit inverso removeu uma newline legitima; retirada somente essa
  normalizacao indevida, comparacao exata passa. Sem mudar producao ou relaxar
  asserts. Logs de ambos erros privados no ciclo.
- Auditoria inversa recompõe integralmente paginas/componentes anteriores,
  fora de estado/eventos/guia/foco/delay permitidos; playback/PIN/bridge,
  loaders/virtualizacao/press, fonte/busca/servico EPG/Android intactos.
- Checklist React aplicado: hooks incondicionais antes de retornos, callback
  estavel, estado repetido retorna mesma referencia, deriva escopo sem effect
  de sync, todos timers/requests com cleanup, acoes acessiveis preservadas;
  sem nova dependencia/refactor/requests por render.
- Lock inicial26+27+9 PASS; typecheck/build web e padrao intermediarios PASS.
  Builds finais apos guard PIN registrados no fechamento abaixo.
- Smoke HTTP200 dos3 componentes atualizados em localhost3000. Nao e prova
  de playback/EPG real. CUA apps=[]/browsers=[]; sem CDP alternativo.

Usuario recebeu pedido de conferencia na mesma aba ativada (Ctrl+F5, abrir
Live, conferir foco e guia por mouse/setas sem trocar video). Resultado
visual final pendente neste registro; Android fisico nao testado. APK C144
intacto, nenhum novo APK/sync/Gradle/install. Source Data Boundary preservado:
EPG continua device-to-source autorizado, sem transporte/sync para backend.

## Fechamento e confirmacao

Builds finais apos focusBlocked PASS: web24.05s e padrao21.98s, ambos com
lock26+27+9 e typecheck. Auditoria baseline1175/1167 preservados apos memorias,
4 UI+fixture C107+3 memorias e3 novos allowlisted, APK C144/HEAD/main/index
intactos. Usuario respondeu "DEU CERTO" para foco inicial e guia por mouse/setas
na aba real; nao equivale a teste instrumentado ou homologacao Android.
Pedido posterior de APK/install Fire fica em ciclo de empacotamento separado.
