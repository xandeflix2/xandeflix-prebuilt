# C11 — Cast e Luke Cage: fronteiras verificadas — ciclo55

2026-10-08 America/Sao_Paulo. [Spec e emendas anteriores ao codigo](../architecture/C11_CAST_FAILURE_AND_LUKE_PLAYBACK_DIAGNOSTIC.md).
Preflight C11-main/main/origin esperado/HEAD61ec00902be5d0037adf79c68b3a8624b3a2bd6e,
baseline728; CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO. Sem Git/backend/reset,
novo parser/SDK, alteracao de URI/licenca/C9 ou fallback que apague retomada.

## Mudancas concretas

Codigos Cast reais sobrevivem sanitizador IPC/bridge/adapter/service e chegam ao
aviso/copiar/WhatsApp. LOAD_TIMEOUT, LOAD_CANCELLED e WIFI_REQUIRED distintos;
nova tentativa/IDLE/licenca nao herdam codigo anterior, C9 libera uma vez.
Bridge nao renderiza exception nativa bruta. Parser3001 informa falha de leitura
sem declarar codec impossivel ou fonte corrompida apenas pelo codigo. Campos
HTTP/Media3/checkpoint ausentes continuam UNAVAILABLE/UNKNOWN.

Cast tinha perda do User-Agent resolvido: player local usa getUserAgent(),
relay recebia somente getRequestHeaders(). Corrigida copia dos headers
autorizados mais o mesmo UA; testes verificam copia isolada e TCP/range reais.
Isso corrigiu uma diferenca concreta, mas nao resolveu o erro fisico do AirScreen.
Breadcrumbs debug-only fechados observam Range/status/offset validado e Cast
BOUND/peer/requisicao/status/bytes/capacidades de rede; sem URI/header bruto,
nonce/IP/credencial/corpo/fingerprint novo. Transporte e restricao ao receiver
escolhido/C9/lease/sockets/formatos preservados.

## Luke S01E03

S24 reproduziu minutos iniciais com FIRST_FRAME/READY (BR e7ACE); observacao
ampliada180s teve rebuffer breve e retorno READY. Tablet EC412/ZUJ reproduziu
ParserException INVALID_NAL_LENGTH ao abrir em725243ms; FireD23B/0.106 em739696ms
tambem falhou. Experimento transitorio startPositionMs=0 no tablet exibiu frame
e READY; wrapper removido, nenhuma correcao de produto reinicia emzero.

Tablet6FAA em725243ms e S24/27C0 no mesmo ponto: HTTP200 no inicio e HTTP206
para offset147250663, Content-Range solicitado/respondido MATCH, depois
INVALID_NAL_LENGTH. Inicializacao anterior do tablet em206301ms teve206/MATCH,
FIRST_FRAME/READY. Status/offset de header corretos nao provam integridade do
corpo. Usuario testou mesmo episodio em outro aplicativo e confirmou que
tambem nao passa de12min. Falha desse trecho da fonte identificada em aplicativos
independentes; nao contornar corrompendo progresso ou relaxando parser. Codigo
3001 e parser malformed: [Media3](https://developer.android.com/reference/androidx/media3/common/PlaybackException).

## AirScreen

Antes de AirScreen aberto, pickerS24 mostrou nenhum receiver. Apos usuario abrir,
AS-AFTSSS[Cast] apareceu e conectou. Luke recebeu LOAD aceito e terminou
CAST_MEDIA_ERROR; usuario copiou diagnostico BKG real desse evento em00:54:55.854Z.
Repeticao apos UA/27C0 ainda falhou. NoE87 outro filme ja comprovado localmente
(Um Natal Bem Jonas Brothers) tambem recebeu CAST_MEDIA_ERROR.

Observador nativo proprio validado por BOUND: WIFI=true, CELLULAR=false,
VPN=false; nenhum peer ACCEPTED/DENIED e nenhuma requisicao upstream nesse
ultimo teste. Usuario viu noFire "incapaz de inicializar o motor de renderizacao".
Primeira fronteira quebrada observada e inicializacao do motor no receptor,
antes de conexao ao relay; nao atribuir a HTTP401/formato especifico ou ao trecho
de Luke. QA dessa fronteira encerrada, transmissao retornada/desconectada pela
acao propria "Neste aparelho". Nao alterar AirScreen, abrir outro aplicativo,
afrouxar guard de IP ou afirmar Cast fisico resolvido. Compatibilidade desse
receptor permanece pendente de motor funcional; descoberta/conexao verificadas.

## Checks e entrega

4 grupos novos Cast, suporte8/aviso11/continuidade4/C9runtime10/VOD12 e
ordem54/antigas PASS. Typecheck/lock22+27+9/build/sync/assets6/certificado PASS;
Java148 sem falhas/erros, com sanitizer de Range e testes TCP/UA. Novo Native
patch nao muda bundleweb BKG. APK E87FDD1C76CC9D391DE467B3014C900B3A9C1BF568F6892BB4193646AA49946F,
12400179bytes, packagecom.xandeflix.prebuilt1.0, schemehttpslocalhost semdevserver,
certificadob235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d.

E87 entregueS24 em01:13:09.878UTC com760/718/5 e Fire0.106 em01:13:41.499UTC
com901/856/5; install-r/hashAPK/firstInstallTime e todos grupos iguais,
zero alteracoes em catalogo/native/preferences/WebView/other. Tablet atual27C0
758/715/5 em01:05:39.299UTC, mesmoBKG; entrega final seguinteUI56 inclui esse
native patch. FireE87 QA D-pad11 PASS: Recentes->Destaques->Lancamentos,
Ver todos->hero inteiro, semelhantes->hero->Voltar. Tablet27C0 ordem54/20cards/
Ver todos/Back PASS. Fire107 sem conexao no endereco anterior, S23 excluido.

Instalacao inicial6FAA tablet abortou antes de escrever: own app reaberto durante
auditoria; repeticao preservada756/715/5 PASS. Helper de selecao receiver nao
encontrou rota quando picker ja mudara; nenhum tap emitido, conexao real
confirmada por status/screenshot e teste. Seletor privado "Neste aparelho"
procurava apenascast-button; corrigido para cast-control button, retorno real
desconectado. Erro de quoting node-e/patch vazio/arquivo privado opcional ausente
nao alteraram produto, comandos corrigidos. QA D-pad teve erro transitorio de
avaliacao e continuou ate11 passos fisicos finais PASS; nao contado antes.
Baseline728/protegidos693/HEAD igual, zero mudancas fora da allowlist.
