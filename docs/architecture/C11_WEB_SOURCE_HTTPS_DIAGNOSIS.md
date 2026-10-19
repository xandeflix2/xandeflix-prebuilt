# C157 — diagnostico de fonte HTTP no navegador HTTPS — 2026-10-17

## Pedido, preflight e evidencia anterior ao codigo

Usuario cadastrou PIN web e relatou falha apos login. Screenshot/console
mostram T4_AUTHORIZATION_READY, SOURCE_READY e entrada PRE_IMPORT_BOUNDARY,
seguidos de8 mensagens Mixed Content (requisicao HTTP bloqueada em pagina
HTTPS). Entrada/autorizacao ocorreram; isso nao certifica download/catalogo.
Usuario identificou Vercel como provedor: Vercel hospeda o site HTTPS, nao
converte em HTTPS a fonte de catalogo/midia cadastrada no painel. Enderecos
reais foram ocultos no log; nao presumir hostname/porta/protocolo da fonte
armazenada nem que as oito requisicoes sejam todas do catalogo.

Clone independente C:/Xandeflix/xandeflix-prebuilt-c11-main, main/origin
canonicos, HEADa66270392ac1b54a83a6bdeb6f7f8551a034790e, arvore limpa.
AGENTS/Architecture/Execution/Source Boundary/C154/C156/Activation Lock lidos.
CURRENT_GATE=NONE; CURRENT_LOCAL_CYCLE=C157; NEXT_GATE_STARTED=NAO.
Publicacao/Git da correcao web no mesmo projeto equipe2 continuam autorizados;
GIT_COMMIT_AUTHORIZED=SIM; GIT_PUSH_AUTHORIZED=SIM; GIT_PR_AUTHORIZED=NAO.
Nenhum backend, segredo, fonte/conta real, APK ou dispositivo sera alterado.

## Especificacao e limite da correcao

- Observar somente no wrapper web C136 ja existente a rejeicao de fetch
  cross-origin HTTP em pagina HTTPS (exceto loopback confiavel/abort).
  Registrar somente enum HTTP_IN_HTTPS_BLOCKED em RAM, sem URL/host/path,
  headers, credenciais, corpo ou exception.message. Nao mudar requisição,
  resposta, retry, redirect, timeout, transportes nativos ou URLs da fonte.
- Resetar diagnostico no CHECKING_SOURCE de cada tentativa e ao completar
  READY; notificar React para refletir diagnostico atual sem estado stale.
- Na falha da primeira sincronizacao, mostrar aviso adicional especifico
  sobre requisicoes HTTP bloqueadas e necessidade de HTTPS do fornecedor.
  Separar fato observado de causa exclusiva: recurso HTTP bloqueado nao
  prova sozinho que foi a playlist e nao deve mascarar outras falhas.
  Demais estados/offline/Android e callbacks de tentar/ativacao/portal iguais.
- Acrescentar codigo sanitizado ao diagnostico web existente; nenhuma tela
  solicita PIN/PUK/URL/segredo para diagnosticar. Proteger segredos no texto.
- Sem proxy/relay central, no-cors como contorno, permissoes inseguras ou
  upgrade automatico HTTP->HTTPS. C154 exige fonte com HTTPS/CORS/codecs;
  apenas endpoint real fornecido/validado pelo provedor resolve essa barreira.
  Informacao faltante solicitada ao usuario apenas como protocolo HTTP/HTTPS.
  Nao prometer que mensagem melhorada carrega fonte incompativel.

## Allowlist e verificacao

- Novo src/web/web-source-connection.ts: store observacional sanitizado.
- src/web/web-runtime.ts: observacao/reset no wrapper existente, sem alterar
  chamada/resposta/erro originais. Novo codigo somente em web-validation.
- src/ui/components/FirstRealSyncState.tsx e StartupLoadingScreen.tsx: aviso
  opcional, sem readiness, sincronizacao, liberacao precoce ou callback novo.
- Novo scripts/test-c157-web-source-https.mjs; package.json apenas inclui
  suite no site:build, sem dependencia ou mudanca em builds nativos.
- Este contrato, nova evidencia docs/evidence/C11_WEB_SOURCE_HTTPS_DIAGNOSIS.md;
  tres memorias append-only; baseline/helpers privados tmp/c157-web-https.
  Nenhum outro arquivo permitido. APK1.0.31/C156 preservado por hash.

Testar HTTP rejeitado, HTTPS normal/CORS desconhecido, abort/loopback,
preservacao do fetch/erros e reset por tentativa; nunca copiar URL em store
ou UI. Native flag falsa retorna estado neutro/sem instrumentacao. Lock antes
e em site:build, typecheck e suites C151/C154/C155/C156/C157 completas;
Chrome isolado com fonte sintetica deve reproduzir Mixed Content sem ler
conteudo real. Auditoria hashes/allowlist/memorias/segredos, publicar via Git
e verificar commit correto/HTTP. Fonte real/HTTPS do provedor continua uma
dependencia externa, nao resolvida por deploy Vercel.

## Esclarecimento do usuario e proposta para revisao, sem implementacao

Usuario confirmou que a fonte e HTTP, que consegue baixar M3U por navegacao
direta e que nao consegue obter HTTPS do fornecedor. Navegacao top-level nao
equivale a fetch de subrecurso HTTP em documento HTTPS (W3C Mixed Content,
https://www.w3.org/TR/mixed-content/). Manter HTTP na origem e possivel com
um transporte HTTPS intermediario, mas essa arquitetura NAO esta autorizada
pela presente allowlist. Nao afirmar que o aviso C157 resolve o carregamento.

Proposta concreta para decisao do usuario:

1. Site/login/painel continuam na Vercel em HTTPS. Aplicativos Android/TV e
   Fire Stick continuam com transporte direto da fonte e identidades iguais.
2. Gateway HTTPS dedicado, fora da Vercel/Supabase, acessa a origem HTTP e
   transmite em fluxo somente para sessoes web autorizadas. Exige servidor,
   dominio/certificado e capacidade/custo de banda. Nao contratar hospedagem.
   A Vercel nao sera usada como relay: sua AUP lista proxy entre atividades
   proibidas (https://vercel.com/legal/acceptable-use-policy) e a orientacao
   tecnica descreve Functions como API leve, nao servidor de midia
   (https://vercel.com/kb/guide/how-to-bypass-vercel-body-size-limit-serverless-functions).
3. Emenda limitada necessaria aos contratos Architecture secao4, Source
   Boundary e C154 secao4/5: permitir somente este transporte web de
   compatibilidade. Preservar vault cifrado, licenca/C9/revogacao, PIN/PUK,
   catalogo/busca locais, proibicao de storage de video/catalogo e demais
   plataformas. Nao usar proxy publico, desativar seguranca do navegador,
   publicar segredos nem trocar apenas esquema/porta por suposicao.
4. Implementacao futura deve autenticar servidor a servidor/sessao delegada,
   limitar destinos aos da fonte autorizada (anti-SSRF inclusive redirects e
   DNS), ocultar URL/credenciais em identificadores opacos efemeros e logs,
   validar origem/sessao/limites de concorrencia, encerrar ao revogar/sair,
   suportar Range e HLS/segmentos/chaves sem transcodificar/persistir conteudo.
   HTTPS protege o trecho navegador-gateway; origem HTTP continua sem TLS.
5. Antes de liberar, testar fonte real autorizada, inclusive bloqueios por IP
   de origem, CORS/codec e interrupcao de sessao. Nao prometer compatibilidade
   somente com download M3U ou suite sintetica. Contrato/allowlist/testes desse
   transporte precisam preceder codigo em ciclo explicitamente autorizado.

Decisao sobre emenda e infraestrutura pendente. Nenhum gateway, proxy, compra,
servico, mudanca de fonte real ou proximo Gate iniciado por esta proposta.

## Decisao e atualizacao autorizada do mesmo ciclo — anterior ao codigo

Usuario REJEITOU gateway/VPS/custos de banda e nao autorizou emenda para
proxy/relay. Proposta anterior encerrada sem implementacao; proxima estrategia
HTTP via gateway permanece suspensa por pedido explicito. Se conexao direta
nao funcionar, usuario prefere somente painel administrativo. Nao retirar /app
agora: usuario testou HTTPS na fonte e relatou sistema abrindo com capas,
sem complemento TMDB e erro DIRECTORY_SOURCE_NOT_AUTHORIZED na reproducao.
Esse relato nao certifica HTTPS da midia nem todos os redirecionamentos.

Leitura confirmou: C154 exclui credencial TMDB do build publico; contrato
C11_SOURCE_FIRST_TMDB_ARTWORK.md permite VITE_TMDB_API_KEY como credencial
de leitura visivel no cliente, sem valor em Git/docs/logs. ActivationPage
nativa tenta obter chave permanente mesmo no navegador, que corretamente
recusa geracao e cai em falso UNREGISTERED/UNKNOWN/LOCAL_KEY_STATE=ERROR.
Resolver de detalhes C105 nega tanto autorizacao quanto sourceId/versao/
protocolo inconsistentes; nao relaxar esse guard. Troca HTTP->HTTPS pode
exigir atualizar catalogo; isso e hipotese solicitada ao usuario, nao causa
confirmada. Backend lido apenas por booleans da definicao RPC canonica, sem
dados/credenciais de clientes: validacao web e campos de metadata presentes.

Extensao minima de allowlist antes da implementacao:

- vite.app.config.ts: whitelist APENAS VITE_TMDB_API_KEY (32hex opcional),
  define explicita do valor de leitura e boolean configurado; sem token JWT,
  service role, importacao ampla de env ou alteracao do build Android.
- Novo src/web-production/WebAccessStatus.tsx: pagina read-only da sessao
  delegada existente, consulta readActiveSourceStatus existente e diagnostico
  de enums/versoes, sem chaves/URLs/tokens/PIN/PUK. Sem identidade nova ou
  preflight de ativacao nativa. Botao de consulta e de configuracoes existentes.
- src/ui/pages/ActivationPage.tsx: wrapper exclusivo isPublicConsumerWeb
  seleciona nova pagina; corpo/hook/fluxo original nativo em componente separado
  preservado. Nunca substituir estado remoto por autorizacao ficticia.
- scripts/test-c154-public-site.mjs: adicionar import mock do store C157
  exigido pelo harness (falha observada Unexpected import), preservar todas
  as oito verificacoes e ampliar teste de whitelist TMDB permitida/invalida.
- scripts/test-c157-web-source-https.mjs: ampliar suites com pagina web real,
  nenhum acesso a gerador nativo, expiracao e diagnostico sanitizado/versoes.
- docs/VERCEL_APP.md e append a C11_WEB_PUBLICATION.md: login existente,
  whitelist TMDB publica explicita e configuracao Production pelo titular,
  ausencia de gateway e nenhum certificado de HTTPS da midia sem teste.
- Demais arquivos da allowlist inicial e memorias append-only preservados.

Nenhuma alteracao funcional autorizada em source resolver, backend, RLS,
cofre, player, catalogo/search ou APK. Se reprodutor ainda falhar apos catalogo
atualizado, obter evidencia sanitizada da fronteira, sem remover validacao.

Usuario confirmou adiamento mesmo apos recarga. Leitura mostrou que
LOCAL_FIRST_ACTIVE_PRESERVED tambem e retornado para falha de entrega/staging
com campo error; UI C135 o chama sempre de adiamento por playback. Essa
mensagem nao comprova a condicao de bloqueio, nem ausencia de consulta.
Extensao adicional: src/ui/settings/active-source-status.ts apenas no build
publico distingue resultado com erro de adiamento legitimo e registra em
store web enums/booleanos de guard/resultado, sem alterar guard/canPromote,
coordenador, pedidos ou comportamento nativo. WebAccessStatus mostra esses
enums de ultima tentativa. Ampliar suite C157 para provar guard, erro de
preservacao, resultado sem erro e comportamento nativo anterior intacto.

## Revisao final da conexao direta e dependencia do fornecedor — 2026-10-18

Usuario pediu correcao definitiva e confirmou que usa fonte de terceiros,
sem acesso administrativo ao servidor. Mantida decisao anterior contra
gateway/VPS/relay/custos de banda. Nao ha autorizacao para contornar TLS,
CORS ou Mixed Content, nem para desabilitar /app parcialmente funcional.

Preflight: clone independente C:/Xandeflix/xandeflix-prebuilt-c11-main,
main/origin canonicos, HEAD007c1851459763b520acd4a412e70c918e059727 limpo.
AGENTS, Architecture, Execution, Source Boundary e especificacao existente
consultados. CURRENT_GATE=NONE; mesmo diagnostico web autorizado, sem novo
Gate. Allowlist deste registro: este documento e tres memorias append-only.
Git/publicacao de registros do reparo continuam autorizados; PR=NAO.
Sem alteracoes de codigo/testes/build/backend/APK/cliente/fonte/dispositivo.

Revisao read-only confirmou: source-directory-api preserva scheme/origin
da configuracao autorizada; source-directory-details consulta diretamente
get_series_info, sem relay; web-media valida protocolo e usa URI original;
web-runtime observa falha e relanca o mesmo erro, sem mudar URL; EPG faz
fetch direto no endpoint provisionado. Nao foi identificada nessas rotas
uma reescrita local que explique o destino HTTP ou repare TLS/CORS da fonte.
Isso nao certifica todas as series nem atribui seus erros sem diagnostico.

Console real ja entregue pelo usuario comprova ERR_SSL_PROTOCOL_ERROR em
filme, HTTP final bloqueado em Live, API/EPG sem Access-Control-Allow-Origin
e404, imagens com ERR_CERT_COMMON_NAME_INVALID. Enderecos, contas e tokens
reais nao transcritos nem consultados. Correcao desses transportes exige
acao do fornecedor; mudar somente o endereco inicial para HTTPS nao basta.

### Pedido tecnico pronto para o fornecedor

O aplicativo web usa conexao direta do navegador, em
https://xandeflix.vercel.app. Precisamos que a fonte ofereca:

1. HTTPS funcional com certificado valido para cada host final de filmes,
   episodios, canais e imagens, inclusive portas e redirecionamentos.
   Manifestos/segmentos/chaves, quando usados, tambem devem permanecer HTTPS.
2. API player_api.php acessivel e com respostas JSON validas para a conta,
   inclusive get_series_info e get_short_epg; corrigir respostas404 das
   rotas anunciadas ou fornecer os endpoints oficiais compativeis.
3. Nas respostas da API e nas midias lidas por fetch/HLS/MPEGTS, permitir
   a origem https://xandeflix.vercel.app por Access-Control-Allow-Origin.
   Se o alias nm3x for usado, inclui-lo na allowlist com uma unica origem
   correspondente por resposta. Vary: Origin ao selecionar origem dinamica.
   Atender OPTIONS/headers apenas quando requisitados pelo preflight.
4. Entregar formatos e codecs reproduziveis pelo navegador alvo. Sucesso
   de download M3U ou reproducao em app nativo nao comprova compatibilidade
   web; verificar TLS/CORS antes de atribuir falha a codec.

Sem URL/usuario/senha/PIN/PUK/HAR no pedido publico ou no repositorio.
Depois da resposta do fornecedor, validar itens realmente afetados no
navegador antes de declarar resolucao. Nenhum endpoint novo sera adivinhado.
Enquanto isso, correcao definitiva de reproducao web NAO CONCLUIDA; painel
e /app existentes preservados, sem alegar funcionamento de conteudo real.

Referencias primarias verificadas:
https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS
https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Mixed_content
NEXT_GATE_STARTED=NAO.

## Retorno da falha no localhost — 2026-10-18

Mesmo diagnostico autorizado, CURRENT_GATE=NONE, sem novo Gate. Preflight no
clone independente/main/origin canonicos, HEAD510e18a9765d0aae49e4893430e0318c93b9f4fb
limpo; AGENTS, Architecture, Execution e Source Boundary consultados.
Allowlist deste registro: este documento e append-only das tres memorias.
Nao autoriza codigo funcional, reset, troca de fonte ou bypass do navegador.

Relato mais recente substitui a afirmacao anterior de localhost funcionando.
Console do usuario mostra duas requisicoes de filme HTTP com resposta404,
API HTTP com404 e CORS sem Access-Control-Allow-Origin; imagem TMDB tambem
foi bloqueada por CORS. Nao transcrever/consultar URLs ou credenciais reais.
MediaError4 e UNSUPPORTED sao eventos do browser, nao prova de codec invalido
quando a mesma tentativa retorna404. APP_VERSION1.0 no relatorio generico e
literal do reporter; BUNDLEUNKNOWN nao comprova versao antiga instalada.

Usuario informou que o fornecedor oferece apenas HTTP e que trocou o prefixo
para HTTPS, com sucesso parcial. Isso nao comprova HTTPS das midias finais.
O processo Vite na porta3000 referencia o clone ativo; leitura apenas do
modulo publico web-media confirmou uso direto da URI sem reescrita HTTPS.
Diff C160 nao altera importador, fonte, resolver ou transporte. Revisao do
catalogo confirmou validacao da geracao e preservacao de URIs; atualizacao
administrativa de configuracao incrementa versao. Nenhum defeito nesses
pontos foi reproduzido; isso nao certifica o estado real do catalogo do cliente.

Suites existentes C15814, C136player10, C16012, C105import7/details12/
orchestration9:64 testes PASS, fixtures isoladas; activation lock completo
PASS. Nao comprovam reproducao da fonte real. Solicitado teste comparativo
da mesma requisicao de filme em nova aba, sem editar protocolo ou revelar
endereco, para distinguir resposta externa de restricao ao player embutido.
Resposta pendente; correcao da reproducao real NAO CONCLUIDA.

APK1.0.32 anterior existe e seu SHA256 foi reconfirmado; nenhum APK novo ou
instalacao nesta investigacao. Usuario ainda nao testou essa versao no Android.
Sem mudanca de runtime, dados, Supabase, Vercel, fonte ou aparelho.
Sem proxy/relay/VPS/banda e sem enfraquecer TLS/CORS/licenca/parental.

Novo Console do mesmo localhost repetiu filme HTTP404 e API404/CORS, alem
de aviso de chave React duplicada nas recomendacoes. Esse aviso nao comprova
causa da resposta404 externa. Resultado de abrir a mesma requisicao em nova
aba ainda nao informado; nao interpretar repeticao do Console como resposta
ao teste comparativo. Nenhum reparo de reproducao ou deploy declarado.

### Capturas de midia e navegacao direta — 2026-10-18

Titular enviou Network do MP4: URI HTTP, status404, Content-Type text/html,
requisição de Range. Nova aba exibe erro404 em endereco HTTPS. Registrar
ambas as observacoes, sem alegar que os protocolos das duas tentativas sao
iguais nem inferir redirecionamento automatico sem cadeia de rede.
Falha externa visivel nao comprova sozinha se a URI veio corretamente da
fonte, se o catalogo esta desatualizado ou se o servidor recusa a requisicao.
Nao atribuir a codec, permissao parental ou Vercel com base nessas capturas.

Proxima fronteira e comparar a referencia oficial da playlist com a URI do
catalogo/resolver, sem adivinhar host/porta/extensao ou testar credenciais
expostas. Solicitado somente caminho local de M3U original ja baixada pelo
titular. Se fornecido, leitura de diagnostico somente em memoria, sem copiar
playlist/URLs/credenciais ao workspace, logs, docs ou rede. Relatorio deve
limitar-se a contagens/enums de correspondencia, protocolo e formato; nenhum
resultado constitui nova configuracao de fonte ou autoridade para playback.
Nenhum dado desse arquivo foi lido ate aqui; caminho ainda pendente.
Allowlist documental deste diagnostico permanece a mesma, sem novo Gate,
patch funcional, deploy, reset ou build. Reproducao real NAO CORRIGIDA.


## Localhost restabelecido por troca de fonte ? 2026-10-18

Usuario confirmou que a fonte anterior estava sem sinal ativo e que, ao
atualizar/trocar por fonte HTTP, o sistema voltou a funcionar. Confirmacao
fisica e relato do titular; nao e reproducao instrumentada pelo agente.
Investigacao localhost encerrada por restabelecimento externo, sem defeito
de runtime confirmado ou patch funcional. Comparacao com arquivo M3U deixa
de ser necessaria; nao solicitar caminho/arquivo/credenciais adicionais.
Isso nao certifica playback HTTP a partir da Vercel HTTPS, todos os itens
do catalogo ou dispositivos Android. Sem novos testes/build/APK/deploy,
backend ou alteracao de fonte pelo agente. NEXT_GATE_STARTED=NAO.

## Verificacao de Live em producao apos troca da fonte - 2026-10-18

Usuario pediu comparacao entre localhost HTTP, app nativo e web de producao.
Preflight: clone independente/main/origin canonicos, HEAD510e18a9765d0aae49e4893430e0318c93b9f4fb;
dirty somente os quatro registros deste diagnostico, de proveniencia conhecida.
CURRENT_GATE=NONE; mesma investigacao de conexao direta, sem novo Gate.
Allowlist: este documento e memorias STATUS/EVOLUTION_REPORT/ERRORS_AND_BLOCKERS
por append; helpers/resultados privados em tmp/c160-production-live-check.
Sem alteracao funcional, deploy, env, dados/fonte, Supabase, reset ou APK.

Verificar HTTP/HTTPS e headers das paginas publicas, rotas, hashes do build
e assets do player em ambos aliases corretos. Reutilizar o verificador C160
existente mudando apenas diretorio privado de saida; preservar sua evidencia
anterior. Nao tomar HTTP200/JS atual como prova de reproducao de cliente.
CUA nesta sessao nao expoe apps/browsers; solicitada tentativa em producao
com a fonte nova e somente enums WEB_LIVE_/tipo de erro sanitizado.
Nao reutilizar credenciais ou diagnostico da fonte anterior para testar a
nova. Consulta da fonte real nao sera feita com segredos de capturas.

Codigo atual contem validacao HTTP sob pagina HTTPS, em ambos builds web,
antes da montagem do video; headers e URL originais sao preservados.
MPEGTS/HLS acessam fonte diretamente. Login delegado nao e relay pelo
aparelho. Na verificacao publica anterior, dois literais de preload/import
foram resolvidos inicialmente sob a mesma base: um GET artificial teve404,
enquanto o import correto teve200/hash esperado. Nao tratar esse404 do
verificador como asset realmente ausente; usar caminhos do build oficial.

### Resultado publico e diagnostico atual da fonte nova

Verificador C160 reutilizado sem mudar assercoes, apenas pasta privada de
saida: PASS nos dois aliases, quatro rotas200,14assets JS/CSS identicos ao
build local e dois endpoints sensiveis404 em cada alias. Main continua
main-Rg770RpC.js, SHA2561a577eb6fa27c3a2fd86f371f588c3468ee7258237ee2f54e6d48526b5558785.
Requisicao HTTP publica retorna308 para HTTPS. HTTPS200 com HSTS e
Referrer-Policy no-referrer; sem CSP, COEP, CORP ou Permissions-Policy nessas
respostas. Nao ha evidencia de build antigo/asset do player faltante ou CSP
nessas paginas. Isso nao prova conexao da fonte nem autorizacao real do cliente.

Usuario forneceu diagnostico novo de producao: sessaoAUTHORIZED,
bindingREADY, catalogoREADY, comparacaoSAME; LiveFAILED, protocolo inicial
HTTPS, formatoMPEGTS, etapaMPEGTS, codigoNETWORK, statusHTTP0, MediaError0.
Nessa tentativa a validacao inicial de HTTP sob HTTPS NAO foi a fronteira
de falha: player chegou a carregar o transporte MPEGTS. Status0 nao prova
que o servidor nao respondeu nem identifica CORS/TLS/Mixed Content sozinho.
Protocolo observado e da URI inicial, nao do destino apos redirecionamento.

Primeira fronteira quebrada identificada: transporte browser-fonte.
Solicitado somente tipo de mensagem Console ou net::ERR sanitizado para
distinguir CORS, redirecionamentoHTTP, certificado/TLS ou outra falha de rede.
Nao reusar erros da fonte antiga como prova da nova. Nenhum teste de midia
autenticada pelo agente, patch, deploy ou bypass; diagnostico final pendente.


### Primeira falha de transporte confirmada pelo Console atual

Titular enviou Console da tentativa nova: apos selecionar canal, resolver
streamRef, adquirir C9 e iniciar preview, recurso inseguro foi bloqueado por
Mixed Content no contexto blob HTTPS, seguido por diagnostico LiveMPEGTS/
NETWORK/status0. Esse e o bloqueio observado do caminho da transmissao;
URI inicialHTTPS nao garante que todos os recursos/destinos sejamHTTPS.
Sem cadeia de rede completa, nao afirmar qual salto de redirect ou segmento
gerou oHTTP, nem inventar dominio/porta alternativa. Segredos e enderecos
reais nao foram coletados/consultados ou transcritos neste registro.

Mesmo Console tem CORS em leitura de imagens TMDB e certificado invalido em
outras imagens. Nao usar esses erros para classificar CORS como causa de Live:
o bloqueio confirmado na tentativa do canal e Mixed Content. Autorizacao,
binding, C9 e carga de assets chegaram aos respectivos marcos; nenhum defeito
de distribuicao Vercel identificado na verificacao publica realizada.

Verificacao diagnostica concluida nesse limite; reproducao em producao segue
falhando. Correcao desse transporte exige que o fornecedor entregueHTTPS
valido em todos os destinos/recursos da transmissao web. Alterar somente
prefixo inicial ou retirar validacao local nao remove bloqueio do navegador.
FonteHTTP pode continuar com uso direto nos ambientes ja confirmados pelo
usuario. Rejeicao a proxy/relay/VPS/banda permanece; nenhum implementado ou
novamente proposto como acao. Sem patch funcional/deploy/backend/APK/reset.
Referencias verificadas: MDN Mixed Content e CORS citadas acima.
NEXT_GATE_STARTED=NAO.
