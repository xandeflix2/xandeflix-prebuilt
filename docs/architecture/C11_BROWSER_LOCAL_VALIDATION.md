# C136 — acesso de conferencia web local/LAN — 2026-10-17

## Autorizacao e preflight

Usuario solicita acesso web para conferir funcionamento e confirmou somente
computador/rede local. Nao publicar na internet. Por padrao usar fonte real
vinculada; alternativa demo foi perguntada, sem fabricar autorizacao nem dados.
C127 documentou os bloqueios: cofre/player exclusivamente nativos. Novo pedido
autoriza implementacao propria para web; nao apenas retirar guards Android.

Clone ativo C:/Xandeflix/xandeflix-prebuilt-c11-main, main, origin esperado,
HEAD bd7e10c7c069df66328309105b6b210d04c7cf2d. Preflight Git/AGENTS/Architecture/
Execution/Source Boundary/Activation Lock/C127 lidos. C135 auditada PASS antes
do patch, preservar baseline1128 arquivos, memorias e APK1.0.24 por hash.
CURRENT_GATE=NONE; CURRENT_LOCAL_CYCLE=C136_BROWSER_LOCAL_VALIDATION;
NEXT_GATE_STARTED=NAO. Git/backend writes, instalacao/reset Android nao autorizados.
Porta3000 pertence ao Vite deste clone; CUA nao apresenta browsers/surfaces.

## Especificacao previa

- Modo web explicito somente development ou build --mode web, com indicador
  visivel de conferencia. Android e build padrao continuam nativos, sem fallback
  silencioso; validacao web nao certifica Media3/Keystore/Cast/PiP/instalador.
- Ativacao real, autorizacao remota, C9 e controle parental existentes continuam
  autoridades. Nenhum bypass, token de teste em producao, reuso de identidade de
  outro origin ou envio de catalogo/PIN/PUK ao backend. Escolha visual pode ser
  alterada nas Configuracoes existentes para testar oito perfis.
- Novo cofre web de laboratorio para conferencia local: WebCrypto AES-GCM com
  CryptoKey nao exportavel armazenada em IndexedDB do mesmo origin, IV aleatorio
  por escrita e AAD sourceId. Persistir somente envelope cifrado e chave opaca;
  plaintext so em RAM local. Sem localStorage para fonte/chave, sem fallback
  inseguro se IDB/crypto falhar, sem regenerar chave caso dados existam. Ler e
  validar registro apos escrita. Nao promover este mecanismo a Keystore Android
  ou autoridade de producao geral (Source Boundary secao6 preservada).
- Web seguro exige localhost HTTP ou HTTPS confiavel em LAN. HTTP LAN deve
  mostrar orientacao clara e bloquear cofre/parental, sem desativar protecoes do
  navegador. Certificado/chave locais ficam fora do workspace, nunca no Git.
  Nao instalar raiz de confianca nem contornar interstitial automaticamente.
- Player HTML5 explicito via implementacao web do contrato Capacitor existente;
  fonte acessada diretamente no browser, sem proxy/relay central nem servidor
  lendo playlist ou video. MP4 nativo, HLS e MPEG-TS via bibliotecas oficiais
  lazy somente web. Falhas de CORS/codec/HTTP/header restrito devem ser claras;
  nao alegar compatibilidade universal nem trocar URL/extensao autoritativa.
- Mesmo player por vez, teardown antes de nova URL, bounds/preview/fullscreen,
  retorno e progresso existentes; C9/parental executam antes da abertura. Evento
  resume encerra sessao VOD; erro/fechamento/saida liberam recursos. Preview
  obscured esconde video durante PIN; suspendPlayback fecha conexao antes de C9.
  Sem prebuffer vizinho (fonte de uma conexao). Navegacao Live usa contexto/acoes
  existentes, estrela/favoritos/EPG, sem opcao legenda/audio extra no Live.
- Servidor local serve somente build web, sem API mock administrativa, proxy,
  credenciais, .env, source tree ou directory listing. Validar Host, paths e
  metodos; bind local por padrao, LAN somente HTTPS/certificado informado.
  Build web separado em tmp/c136-browser-web/site; nao sobrescrever APK/dist.
- Mensagens/diagnostico sem URI/headers/senhas. Nao usar browser com seguranca
  desativada nem gravar resposta real de delivery. CUA indisponivel limita QA
  da aba real; testes automatizados com portas sinteticas nao sao dado real.

## Allowlist estrita anterior ao codigo

- Novo src/web/{validation,web-source-store,web-player,web-media,web-runtime}.ts
  e src/web/web-runtime.css: flags, cofre, playback e indicador/limites locais.
- src/security/local-secure-source-store.ts e
  src/playback/native-android-player.bridge.ts: registrar implementacao web
  condicional explicita; ajustes minimos de guards de progresso para web.
- src/main.tsx: inicializar indicador web antes do App, sem mudar auth/delivery.
- src/ui/pages/LiveTvPage.tsx: somente mensagem sanitizada especifica web se
  necessario, preservando efeito/C9/autorizacao, callbacks e fluxo Android.
- vite.config.ts: flag web, saida separada, evitar API mock no modo web;
  package.json/package-lock.json: scripts web e hls.js/mpegts.js, fake-indexeddb
  somente teste; dependencias de registro oficial, nao imagens/CDN executaveis.
- Novos scripts/serve-web-local.mjs, scripts/start-web-local.ps1,
  scripts/test-c136-web-*.mjs: servidor/inicializacao/testes isolados.
- docs/architecture/C11_BROWSER_LOCAL_VALIDATION.md, correspondente evidence,
  docs/WEB_LOCAL.md e docs/{STATUS,EVOLUTION_REPORT,ERRORS_AND_BLOCKERS}.md
  append-only; helpers/saidas ignoradas tmp/c136-browser-web.

## Aceitacao

Lock antes/depois e build padrao preservado. Cofre real crypto com IDB testavel:
roundtrip/reload, concorrencia, sem plaintext, chave nao exportavel, adulteracao,
chave ausente nao recria, escrita/falha/HTTP LAN fail closed. Delivery autorizado
real com transporte sintetico armazena; nao autorizado nao grava.
Player: MP4/HLS/TS, autoplay/manual, troca/stop/resume/erro/PIN/bounds, um recurso
de midia, C9/revogacao preservados; capacidades nao suportadas sao informadas.
Servidor somente static, traversal/.env/Host/metodo rejeitados, headers seguros,
localhost e URL LAN apropriados. Testar boot/importacao/busca/favoritos/parental,
regressoes C135/C133/C134 e TS/build web. Preservar todos os arquivos fora da
allowlist e APK1.0.24; memorias append-only, HEAD/main/origin/index inalterados.
Relatar separadamente fonte/aba reais nao verificadas e QA nativo pendente.

## Emenda previa — retorno e episodios web

Leitura do App encontrou guards nativos nos dois listeners de resume e
episodeNavigation. Allowlist adicional src/App.tsx: aceitar tambem o modo web
explicito somente nesses dois guards, importando isWebValidation. Callback
de retorno e servico/C9/parental/progresso continuam existentes e inalterados.
Nao alterar guards de BACK Android, relink externo, identidade ou boot.

## Emenda previa — observabilidade da falha real web

Usuario trouxe SECURE_CONTEXT=SIM e plugins disponiveis, mas CATALOG_ERROR nao
e enum. No novo web-runtime, observar resultado/outcome do coordenador sem
copiar erro livre. Allowlist adicional src/source/device-direct-fetch.ts:
emitir somente evento local no modo web a partir de markTransportFailure e
markTransportSuccess, com whitelist de stage/transportErrorCode/httpStatusClass.
Sem URL/headers/payload/sourceId, persistencia, rede, mudanca de fetch/retry ou
autoridade. Diagnostico do modo web consome essa observacao para distinguir
CORS/rede/HTTP de entrega/validacao/promocao; nao logar respostas reais.

## Emenda previa — isolamento reforcado solicitado pelo usuario

Usuario exige preservar carregamento e busca dos demais aparelhos. Revogar a
ampliacao acima para device-direct-fetch.ts e restaurar seu conteudo anterior.
Observabilidade fica somente no novo web-runtime, envolvendo fetch no navegador
com retorno/erro/resposta originais, sem ler body, novos requests ou URL em log.
Native e excluido explicitamente antes de registrar implementacoes web. Nao
alterar bootstrap, source, catalogo, search, runtime native Java ou APK existente.
App aceita web apenas nos dois listeners de retorno/episodio, com callbacks
iguais aos anteriores. Auditar AST/hash das fronteiras consolidadas e build
padrao com flag web desativada, alem dos testes de boot/busca/ativacao existentes.

## Emenda previa — caminhos virtuais IndexedDB no navegador

Diagnostico real: fetch2XX, VALIDATION_FAILED. Leitura das implementacoes revela
FilesystemWeb.getUri=/DATA/prebuilt/... e convertFileSrc web identidade. Fast
path consolidado faz HTTP desse path; Vite retorna HTML200 e JSON de staging
fica ilegivel. Nao mudar leitor nativo/storage/search. Novo
src/web/web-catalog-files.ts atende somente fetch GET/HEAD do mesmo origin em
/DATA/prebuilt/ pela Filesystem API web local (UTF8/base64 conforme extensao),
retornando Response correta ou404, nunca HTML ou fetch remoto. Envolver fetch
somente no web-runtime explicitamente nao nativo. Metodos/path traversal e
acesso fora do prefixo sao rejeitados; sem servidor/proxy ou dados novos remotos.
Teste negativo reproduz HTML200 na classe consolidada, positivo valida staging,
binario e busca local sem alterar as classes consolidadas.

## Emenda previa — validacao fisica web e previa limpa

Usuario confirmou Home/fonte real carregadas e canais Live com imagem. Episodio
via hero falhou NATIVE_ERROR. Resolver consolidado inclui User-Agent fixo
IPTVSmarters/1.0 em toda requisicao; navegador nao permite sobrescrever UA.
Somente web-media/web-player normalizam esse valor padrao removendo-o para
usar UA do browser. Header custom diferente continua erro explicito; nao
alterar resolver/provider/header Android nem substituir URI autoritativa.
Usuario solicita remover toolbar na previa Live: previa sem menu/controles,
toque usa evento/tela cheia existentes e botao nativo somente no fullscreen.
Remover botao extra Reproduzir/Pausar da toolbar, pois video fullscreen ja
tem controles. Atualizar testes C136 para headers padrao e previa sem menu.

## Emenda previa - fixture de regressao T4

T4 executada em Node falhou no caso9 antes de acionar o adapter: nao prepara
armazenamento parental. Mesma falha reproduzida com bridge baseline C135 por
loader read-only,10/11 em ambos. Allowlist adicional exclusivamente
scripts/test-t4-ts-bridge-adapter.mjs: instalar a fixture parental nao
configurada ja usada pela suite C9. Preservar todos os asserts originais;
nao mudar servico, guard ou politica para atender ao teste historico.

Allowlist tambem scripts/test-c105-search-live-selection.mjs exclusivamente
para portas atuais do controle parental no require sintetico. Suite retornou
LIVE_SELECTION_CHANGED porque nao fornece parentalLiveCatalog, e o leitor
consolidado captura essa ausencia como catalogo indisponivel. Hash do leitor e
de todos os modulos search permanece baseline; nao mudar leitores produtivos.
Fixture T4 tambem deve incluir metadata.snapshotId do contrato atual.

## Emenda previa - controles web comparaveis ao tablet

Usuario anexou tablet com controles personalizados e navegador com UI HTML5,
solicitando os mesmos comandos de acao. Somente novos modulos src/web podem
substituir video.controls por overlay proprio: titulo/Voltar/Bloquear, play e
saltos10s, progresso/volume, ajustar/preencher, velocidade, episodios/proximo
com eventos existentes, audio/legendas apenas VOD quando trilhas sao expostas
por HLS/browser. Sem audio/legendas Live. Previa inline continua sem overlay.
Auto-hide com mouse/toque/teclado, foco acessivel, Escape fecha primeiro painel,
PIN oculta tudo e cancela paineis. Sem duplicar transporte/conexao para trilhas.
API de trilhas fica no transporte web ja existente, sem buscar legendas novas,
URLs inventadas ou transcodificar. Se browser/container nao expuser trilhas,
informar no painel, nao fingir funcionamento. Cast/brightness do SO continuam
nativos; opcional brilho visual do video nao altera sistema operacional.
Testar comandos por portas DOM/media sinteticas e solicitar QA visual real;
nenhum XML/Java, carregamento ou busca compartilhada entra no patch.

## Emenda previa - Home usa largura disponivel no desktop web

Usuario confirmou controles personalizados e solicita reduzir bordas laterais
grandes da Home no navegador. page-container consolidado limita1440px. Novo
web-runtime marca html[data-web-validation=true] somente no modo autorizado.
CSS desse modulo elimina teto da Home com gutter16-24px apenas viewport>=1024,
mouse/ponteiro preciso, excluindo perfil phone. Mantem espaco do menu lateral;
sem editar HomePage, index.css, perfis ou servicos de catalogo. Nativo nunca
recebe atributo; telas touch/estreitas e simulacao celular conservam regras.

## Emenda previa - enquadramento, rotacao e menu desktop

Pedidos seguintes do usuario: Hero horizontal inteiro/mais largo, troca
dinamica ativa, paginas internas usando largura e menu sem barras visiveis
em monitor menor. CSS novo web amplia tambem .detail-page--wide, Hero Home
na proporcao16/9 com contain (sem crop), sem teto/min-height herdados de TV.
Menu lateral web mantém rolagem funcional, oculta barras horizontal/vertical,
usa linhas grid auto/minmax(0,1fr)/auto e controles40px em altura<=720px.
Nao ocultar opcoes nem rolagem principal da pagina.

Allowlist adicional src/ui/components/HomeHero.tsx: importar isWebValidation
e, somente nesse modo, nao pausar indefinidamente por hover/foco (como regra
Fire existente). Manter10s, elegibilidade, proximo lote, gesto ativo, pagina
oculta, offscreen, reduced-motion, loading e playbackBusy. Nao alterar fonte,
arte carregada, candidatos ou timers dos demais dispositivos. Testar timer
real do componente com hooks/clock sinteticos em web/native e gates de pausa.
Player novo tem objectFit=contain explicito ao criar video; Preencher e uma
acao opt-in. Conferencia read-only XML/plugin Android confirma FIT inicial.

Refino posterior solicitado: Hero16/9 natural ficou alto; manter contain e
largura100%, mas limitar altura a clamp260px/50dvh/520px, margem inferior20px
e copy compacto para primeira categoria aparecer abaixo no desktop. Menu
lateral deve ficar centralizado como nativo: linhas externas simetricas,
nav central com max-height100dvh-100px/scroll funcional e barras ocultas.
Substitui as linhas auto/minmax/auto acima, sem mudar regras nativas.

Usuario informa que Filmes/Series ainda mostram bordas: incluir explicitamente
.movies-page/.series-page/.detail-page/.category-rails-page/.home-collection-page
no mesmo seletor de largura, alem da Home. Breakpoint desktop>=768px com mouse,
excluido phone; Hero horizontal compacto tambem em Filmes/Series. Nao alterar
forms de ativacao/settings/gestor. Allowlist adicional de teste apenas
scripts/test-c11-browse-dynamic-hero.mjs: portas device-presentation/validation
ausentes no require sintetico SSR, sem mudar asserts ou modulos produtivos.

## Emenda previa - espaco na busca web

Usuario reporta Space ausente na busca. handleKeyDown consolidado do D-pad
transforma Space em click/preventDefault em input.focusable-item. Nao editar
SearchPage, engine ou hook nativo. Somente mountWebRuntimeNotice registra
capture listener: Space simples em HTMLInputElement.search-input para propagacao
ao D-pad, preserva default de insercao. Enter, botoes, modificadores e demais
campos continuam existentes. Novo teste C136 extrai callbacks reais e prova
negativa anterior, insercao permitida e Enter/botoes inalterados, sem rede/UI.

Regressao C128 depois do import web no HomeHero requer porta adicional
isWebValidation=false em seu require isolado. Allowlist exclusivamente
scripts/test-c128-parental-visibility.mjs, uma porta de modulo; conservar11
asserts/casos. Nao alterar classificacao, visibilidade ou controle parental.

Ultimo refinamento web: usuario pede remover quantitativo acima do Hero em
Filmes/Series e manter titulo/Voltar. Ocultar somente page-subtitle do
page-header inicial dessas duas paginas no CSS web, sem alterar contagens
canonicas, categorias, cabecalhos de busca, catalogo ou dispositivo nativo.

## Emenda final - Hero maior e imagem preenchendo, por pedido explicito

Usuario substitui enquadramento inteiro do Hero: quer imagem preenchendo todo
banner mesmo cropada, e altura que deixe aproximadamente metade da primeira
fileira de Lancamentos visivel. CSS web usa cover/center somente na imagem do
Hero e altura max(300px,100dvh-210px), considerando topo/gap/cabecalho/parte dos
cards. Suplanta contain e limite520px anteriores do Hero; player permanece
contain/FIT por padrao. Nenhuma midia, cache, fonte ou interface nativa muda.

O usuario pediu depois aumentar um pouco mais: reserva passou de250 para210px,
incremento40px na altura fluida. Mantem demais regras e isolamento web.

Novo ajuste expressamente pedido: mais40px, passando a
max(340px,100dvh-170px), aumento exato40px inclusive no piso anterior300px.

Ultimo pedido visual: remover escurecimento global do backdrop, mantendo
somente gradiente atras de metadata/botoes. No mesmo seletor desktop web,
hero-overlay-gradient sem background; imagem sem filter/opacity redutora;
hero-content com isolation e ::before radial local (mesmos stops52/38/18/0
por cento do CSS nativo), limitado a65%+3rem/max800px. Sombra local no texto.
Nao alterar player, demais telas nem CSS compartilhado/nativo.

Usuario pede fonte maior da sinopse em todos os Heros: texto hero-overview
desktop web passa14->18px, line-height1.5, incluindo categorias e demais
hero-banner. Texto de sinopse do detalhe hero wide tambem18px. Manter titulos,
clamp das linhas/carrossel, fonte/catalogo e dispositivos nativos existentes.

## Verificacao adicional - rotacao ainda parada no browser real

Usuario reporta ausencia de troca10s apos refinamentos. CUA segue sem surfaces;
nao confirmar funcionamento fisico apenas pelo timer no codigo. HomeHero pode
pausar tambem por reduced-motion. Pedido explicito de rotacao ativa autoriza
no modo web manter ciclo10s mesmo reduced-motion, conservando transicao sem
animacao nesse caso. Native continua pausando como antes. Gesto/player/hidden/
offscreen/loading/menos de duas imagens continuam gates.

HomeHero expoe somente no web atributos locais de state/count/position; efeito
marca timer ARMED/FIRED/STOPPED e contador de ticks no proprio DOM. Sem titulo,
ID, URI, persistencia ou rede. Diagnostico web le esses campos para distinguir
preferencia, elegibilidade, visibilidade e timer efetivo. Testes sinteticos
separam reduced-motion web/native e preservam os demais bloqueios. Esta emenda
suplanta a pausa reduced-motion somente para troca de imagem web solicitada;
nenhum algoritmo/IO de artwork, fonte, boot, busca ou UI nativa e alterado.

Usuario confirmou depois de Ctrl+F5/25s que imagem MUDOU. QA real da rotacao
web agora confirmado pelo usuario. Solicita previa Live menor para mais EPG:
CSS desktop web limita max-height da live-preview-surface a min(50dvh,520px),
sem aumentar superficies naturalmente menores. Bounds existentes refletem
ResizeObserver; video permanece contain, fullscreen intocado. Nenhuma nova
conexao, alteracao de EPG/player nativo/C9/fonte ou fluxo Live compartilhado.

Usuario pediu na sequencia aumentar50px: teto da previa Live desktop passa a
min(50dvh+50px,570px), incremento50px sobre a limitacao anterior. Nao muda
fullscreen nem a altura do Hero de filmes/series.
