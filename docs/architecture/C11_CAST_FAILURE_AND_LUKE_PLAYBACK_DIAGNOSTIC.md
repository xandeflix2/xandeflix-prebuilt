# C11 — Diagnostico separado de Cast e investigacao Luke Cage — ciclo55

2026-10-08 (America/Sao_Paulo). Pedido explicito: concluir ordem das categorias54,
investigar Fire103/Luke Cage S01E03 e transmissao para AirScreen; novo relato
confirmado pelo usuario no tablet: Media3 3001, checkpoint PLAYER_READY.
Preflight C11-main/main/origin esperado, HEAD61ec00902be5d0037adf79c68b3a8624b3a2bd6e,
baseline728 preservado, CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO. Sem Git,
backend administrativo, reset, rotacao de identidade ou nova fonte.

## Evidencia antes do patch

Fire103 recebeu D23B com899/856/5 arquivos privados/catalogo/nativos iguais,
mas deixou de responder no endereco anterior antes da QA54. IP atual solicitado.
S24 agora executa index-BRv8sRIt.js, em vez da entrega EC412 anteriormente
comprovada: nao presumir instalacao mais recente ainda ativa. Luke Cage S01E03
local nesse S24 teve FIRST_FRAME e READY; teste ampliado em andamento, nao
certifica tablet/Fire. Tablet3001 significa falha ao analisar container,
nao codigo de codec incompatível (3003). Referencia primaria:
https://developer.android.com/reference/androidx/media3/common/PlaybackException
Solicitado USB/IP atual do tablet para capturar causa, sem atribuir corrupcao
da fonte ou defeito do SDK apenas pelo codigo.

Inspecao revela perdas concretas: sanitizeErrorCode nativo transforma
CAST_MEDIA_ERROR/CAST_LEASE_EXPIRED em NATIVE_ERROR; bridge open transforma
rejeicoes Cast em NATIVE_ERROR, adapter perde codigo; estado ERROR de abertura
nao publica diagnostico global. Timeout LOAD e excecao LAN viram cancelamento/
falha generica. Corrigir essas fronteiras observadas antes de atribuir causa
historica do relatorio UNKNOWN. Sem adivinhar HTTP/Media3/checkpoint inexistentes.

## Patch autorizado e limites

- Allowlist fechada de codigos Cast existentes e LOAD_TIMEOUT/WIFI_REQUIRED;
  preservar codigos no terminal nativo, bridge/adaptador/estado local e
  diagnostico WhatsApp/copiar; mensagem amigavel definida por codigo.
- Distinguir timeout real de LOAD de cancelamento e LAN ausente de LOAD_FAILED,
  callback unico, revogacao/lease/sockets/C9 preservados. Nao matar player local
  por falha de handoff enquanto ele continua reproduzindo.
- Bridge nunca renderiza mensagem/exception nativa bruta na rejeicao open;
  diagnostico nao inclui URL/header/token/catalogId/titulo/serial/IP da fonte.
- Estado ERROR da abertura com codigo controlado aparece no aviso existente;
  nova tentativa/IDLE/erro de licenca nao herdam codigo anterior. Back/completion/
  progresso e lock de ativacao nao mudam.
- Mensagem parser com codigo3001 explica falha de leitura do container sem
  declarar fonte corrompida/codec impossivel; nenhum fallback, troca de URI,
  transcodificacao ou alteracao do parser sem reproduzir a causa no tablet.
- AirScreen anuncia Cast, mas interoperabilidade/formato/rede precisam teste
  fisico. MP4/M4V/WebM/HLS continuam os formatos ja aceitos no transporte local;
  nao rotular MKV/TS como MP4, nem relaxar selecao do receiver/IP/lease ou C9.
  Receptor escolhido pelo usuario; nenhum envio de WhatsApp automatico.

Allowlist55 adicional: novo src/playback/cast-failure.ts;
android/app/src/main/java/com/xandeflix/prebuilt/cast/CastFailurePolicy.java e
CastController.java; teste Java CastFailurePolicyTest.java; NativeAndroidPlayerPlugin.java
(sanitizador apenas), src/playback/native-android-player.bridge.ts,
native-android-player.adapter.ts, playback.types.ts, playback.service.ts,
native-playback-error-notice.ts, playback-support-diagnostic.ts; src/App.tsx
(assinatura ERROR para aviso apenas); novo scripts/test-c11-cast-failure-diagnostic.mjs;
este plano/evidencia/item55 e quatro memorias; saidas build/sync/APK/tsbuild/tmp.
Allowlists51–54 seguem para finalizar entrega. S23 continua excluido.

Aceitacao: codigos reais Cast atravessam native/bridge/adapter/service/aviso/
relatorio; desconhecidos/maliciosos nao vazam; timeout/cancel/rede distintos;
C9 liberado uma vez na abertura falhada e codigo nao persiste na tentativa seguinte;
parser3001 e HTTP continuam sem inventar diagnostico. Suites relevantes,
typecheck/lock antes/depois/build/Gradle/assets/certificado; install-r/hash/dados.
QA54 no aparelho conectado com ultimo bundle, fluxo Ver todos/Back; Fire103
Luke S01E03 e tablet3001 so certificados mediante conexao e evidencia real.
Se conexao indisponivel, registrar pendencia e nao declarar esses casos resolvidos.

## Emenda de observacao de retomada — 2026-10-08

Tablet USB confirmado: Luke S01E03 falha duas vezes com ParserException /
INVALID_NAL_LENGTH ao abrir em725243ms; experimento transitorio apenas de
startPositionMs=0 no mesmo fluxo autorizado exibe FIRST_FRAME/READY. Fire agora
192.168.0.106 (modelo/API/hash D23B conferidos) reproduz INVALID_NAL_LENGTH em
739696ms. Isso isola a retomada como fator observado, sem provar bytes da fonte
corrompidos ou defeito do SDK. Nao apagar historico nem reiniciar em zero como fix.

Permitir observacao debug-only na TransferListener existente do player: posicao
de bytes solicitada, status HTTP numerico valido, Content-Range com numeros
validados e resultado MATCH/MISMATCH/ABSENT/INVALID; nunca URI/headers brutos,
credenciais, corpo de video, fingerprint novo ou persistencia de stream.
Nao modifica requisicao, bytes, parser, source, auth/C9 ou fallback. Emenda
allowlist: NativePlayerActivity.java e NativePlayerActivityTest.java (teste do
sanitizador fechado). Instalar -r com auditoria privada preservada nos alvos
autorizados para reproduzir antes de decidir correcao de transporte/parser.

## Emenda de paridade da requisicao Cast — 2026-10-08

S24 BKG encontra/conecta AS-AFTSSS[Cast]; Luke S01E03 recebe aceite LOAD e termina
com erro do receptor em cerca de2s, aviso CAST_MEDIA_ERROR observado. Usuario
confirma mensagem de incapacidade de reproduzir no Fire. Inspecao concreta:
Native player usa request.getUserAgent(), mas Cast entrega apenas
getRequestHeaders() ao relay; esse mapa nao inclui o User-Agent resolvido.
Corrigir somente essa perda: relay recebe copia dos mesmos headers autorizados
mais User-Agent ja escolhido para o player local, sem inventar credencial/UA.

Instrumentar relay em RAM/debug-only por callback fechado opcional: metodo
GET/HEAD/OPTIONS, status numerico validado, Range presente (boolean), bytes
transferidos limitados a contador numerico e falha IO/OTHER; sem URL/header
bruto/corpo/erro textual/IP/nonce. Callback e testes sinteticos reais TCP em
LocalCastRelay.java/LocalCastRelayTest.java adicionados a allowlist55.
CastController.java liga callback somente debug; CastFailurePolicyTest.java
verifica paridade de UA/headers autorizados. Nao alterar formatos/mime,
discovery/receiver escolhido/allowlist LAN, C9/lease/timeout ou parser.
Nova tentativa real exige fonte isolada, sem playback tablet simultaneo.

Repeticao27C0 preservada noS24 terminou CAST_MEDIA_ERROR novamente e nao houve
evento de requisicao upstream no observador proprio. Instrumentacao adicional
fechada dentro da mesma allowlist: marcador BOUND para confirmar observador,
ACCEPTED/DENIED no listener antes do guard de IP e capacidades WIFI/CELLULAR/VPN
booleanas no controller. Nao emitir IP, endereco, nonce ou URI. Sem enfraquecer
guard; separar falta de GET, rejeicao por peer e HTTP da fonte.

Usuario confirmou que Luke S01E03 tambem nao passa de12min em outro aplicativo.
S24/27C0 reproduziu o mesmo INVALID_NAL_LENGTH em725243ms com HTTP206 e
Content-Range solicitado/respondido147250663, igual ao tablet. Nao contornar
essa falha apagando historico/voltando a0 ou relaxando parser; registrar limite
da fonte. Teste Cast seguinte usa outro filme ja reproduzido localmente para
nao confundir problema desse trecho com problema do receiver/transporte.
