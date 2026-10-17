# C148 - consultar guia sem sintonizar outro canal - 2026-10-17

## Pedido e preflight

Usuario confirmou C147 e pediu guia abaixo do preview inline para outros
canais durante navegacao, sem precisar ativa-los. Clone ativo c11-main/main,
origin esperado xandeflix2/xandeflix-prebuilt, HEAD
bd7e10c7c069df66328309105b6b210d04c7cf2d. AGENTS/Architecture/Execution/
Activation Lock lidos neste turno; Source Data Boundary integralmente relido
antes de inspecionar EPG. Auditoria C147 PASS, confirmacao visual registrada.
Baseline1175/copias em tmp/c148-live-browse-guide antes do patch.
CURRENT_GATE=NONE; ciclo local explicitamente solicitado, NEXT_GATE_STARTED=NAO.
Sem Git/backend/APK/install/reset; nenhuma operacao em Supabase.

## Especificacao anterior ao codigo

Fronteira: LiveTvPage passa selectedChannel (ativo) para toda guia inline.
ContinuousLiveChannelList nao informa foco/hover ao guia. Separar somente a
consulta de EPG da selecao/preview; nao alterar servico de EPG ou playback.

- Callback opcional onInspect no botao do canal, por foco D-pad/teclado e
  pointerenter somente mouse. Sem substituir click/confirm/longpress/favorito,
  foco virtualizado ou carregar paginas adicionais.
- Estado local bounded de um canal inspecionado, escopado a snapshot, canal
  ativo, categoria e filtro; fallback para canal ativo se escopo mudou ou
  protecao atual nao permite exibir o canal. Somente canais visiveis apos
  parentalLiveCatalog/canShowParentalLive; categoria adulta exige sessao
  adulta existente. Consultar metadados nao libera conteudo, pede PIN ou
  concede grant. Fonte continua autorizada pelo servico EPG atual.
- Passar canal inspecionado para guia do DOM embaixo do preview. Identificacao
  do player, favoritos/indicador AO VIVO e controles nativos em fullscreen
  continuam vinculados ao canal ativo. Rotulo explicito da programacao do
  outro canal evita confundir qual transmissao esta tocando.
- Inspecao nao chama setSelectedChannel, resolucao de stream, sessao C9,
  native bridge ou remember last channel. Sem mudanca de carregamento/busca.
- Enquanto consultando outro canal, adiar somente a primeira consulta de
  EPG em250ms; trocar rapidamente de foco cancela timer/pedido anterior e
  ignora respostas tardias. Canal ativo mantem consulta imediata e refresh
  existente60s/relogio15s. Fechar/sair aborta como antes. Nao inventar grade.
- Toque/clique e Enter/OK preservam sintonizacao atual. Novo recurso por
  foco/hover funciona navegador/teclado e TV/controle sem alterar toque.

## Allowlist estrita

src/ui/components/ContinuousLiveChannelList.tsx (prop/eventos de inspecao);
src/ui/pages/LiveTvPage.tsx (estado/guard/ligacao guia DOM apenas);
src/ui/components/LiveEpgPanel.tsx (flag browsing/rotulo/delay+cleanup);
src/ui/pages/LiveTvPage.css (exibir rotulo novo mantendo escala atual);
scripts/test-c107-inline-live-epg.mjs (fixture binding novo sem remover asserts);
scripts/test-c148-live-browse-guide.mjs (comportamento/isolamento/concorrencia);
este documento e docs/evidence/C11_LIVE_BROWSE_GUIDE.md;
docs/{STATUS,EVOLUTION_REPORT,ERRORS_AND_BLOCKERS}.md append-only;
helpers/logs privados tmp/c148-live-browse-guide e builds usuais.

Proibidos patch do servico EPG/catalogo/source/search/bridge/Android/store,
novas dependencias, storage/rede remota de catalogo/EPG ou mudanca de PIN.
Auditar inversamente blocos de playback/lista existentes e demais hashes.

## Aceitacao e verificacao

Teste real de eventos foco/mouse/touch e selecionado separado; consulta
correta, fallback por escopo/protecao e nenhum callback de playback por foco.
Debounce/abort/late result/refresh ativo preservados em portas sinteticas.
Regressao C105 continuous list/press/favorites, C107 EPG e testes relevantes
parental/saida preview; lock antes/depois e builds web/padrao/typecheck.
Aplicar checklist React sem refactor oportunista. CUA sem superficies neste
turno; conferir fluxo real com usuario na aba ativada, sem reset/novo segredo.
Sem gerar/instalar APK nao solicitado; nao alegar teste fisico Android.

## Emenda de foco inicial solicitada durante o trabalho

Usuario informou que ultimo canal ja e restaurado/reproduzido, mas nao recebe
foco. Acrescentar posicionamento inicial da lista por ID, sem alterar escolha
do ultimo canal nem o inicio do preview. Reutilizar loadChannelById existente
(lookup local, respeita parental/snapshot/signal, pageOffset filtrado) e uma
pagina local bounded48 para obter indice exato. Nenhum patch do service/fonte,
scan de todas as paginas, armazenamento ou alteracao de busca. Operacao em
paralelo ao preview, abortavel ao sair/mudar escopo; nao depende de playback.

Request de lista pode transportar index absoluto opcional, evitando foco no
primeiro item da pagina quando seed nao existe (parental configurado). Focar
uma vez ao abrir, com preventScroll no botao e rolagem apenas da lista. Nao
roubar foco depois de interacao manual com canais/categoria/filtro nem de
dialogo PIN aberto. StrictMode cleanup/replay nao deve consumir foco inicial
sem executa-lo. Erro/ausencia nao seleciona outro canal nem libera conteudo.
Estender teste C148 para canal alem da primeira pagina, request sem seed,
cancelamento/interacao/dialogo e nao repeticao; regressao busca C105 tambem.
Arquivos permanecem na allowlist, exceto novas linhas de foco justificadas.

A lista recebe flag opcional focusBlocked durante prompt PIN: conserva pedido
de foco pendente e o executa apos fechamento, em vez de tentar focar botao
fora de dialogo modal. A flag integra dependencia do efeito de aplicacao;
nao altera PIN, navegacao do dialogo ou confirma canal. Cobrir bloqueio na
porta de foco virtualizada. Continua dentro de LiveTvPage/ContinuousList.
