# C159 — continuidade da sessao web — 2026-10-18

Spec previa em C11_WEB_SESSION_RELOAD.md, com emenda limitada da regra C155
que exigia novo login em qualquer refresh. Aplicacao publica mantem prova
delegada efemera CIFRADA AES256-GCM na sessionStorage da aba, CryptoKey nao
exportavel em IDB de autenticacao. Nenhum PIN/PUK/chave permanente, identidade
ou resposta de fonte salvo. Somente reload da mesma aba/origin pode retomar;
RPC real existente confirma validade antes de sessao/namespace/App. Sair e
revogacao removem envelope e revogam; pagehide interrompe midia sem revogar
por reload, bfcache exige recarga. Native/C9/limites15min/8h preservados.

Preflight: clone independente main/origin canonicos, HEAD55e7d7995ae1c185ed55b57a55fe8550b5524d13,
limpo. CURRENT_GATE=NONE, ciclo localC159, NEXT_GATE_STARTED=NAO. Git/publicacao
do reparo web autorizados; PR/operacao de equipe4, Supabase, cliente, fonte,
APK ou aparelho nao executados. Credenciais recebidas em console nao foram
transcritas, consultadas nem persistidas. Apenas erros enum abaixo registrados.

Falha de filme real: ERR_SSL_PROTOCOL_ERROR no destino final, nao codec
confirmado pelo MediaError4. Live chega de HTTPS a HTTP e e bloqueado.
API/EPG sem Access-Control-Allow-Origin e resposta404. Imagens reportadas com
ERR_CERT_COMMON_NAME_INVALID; isso nao identifica todos os logos individualmente.
Essas fronteiras dependem de correcao pelo fornecedor, sem proxy/relay/VPS,
no-cors, troca especulativa de URL/extensao ou bypass TLS. Series nao foram
testadas no ultimo diagnostico; nao afirmar detalhes corrigidos.

16 testes C159 PASS: AES/IDB reais sinteticos, chave nao exportavel, prazo,
adulteracao, chave ausente/corrupta, storage negada/bloqueada/timeout, logout
concorrente, novo IV, namespace e credenciais em RAM, contexto remoto antes
de App, revogacao/falsificacao, pagehide/bfcache, Sair/heartbeat. Timeout nao
impede login manual valido em RAM. Chrome proprio passou com entry/login e
fetch/RPC reais, endpoints interceptados e credenciais APENAS sinteticas:
login->reload real ignoreCache->mesma sessao sem novo login->Sair->login->
reload com contexto negado, App bloqueado. 2LOGIN/2CONTEXT/2LOGOUT, sem rede
de cliente nem dados reais. Nao certifica login/provedor reais.

site:build final PASS: lock, tsc, painel/app Vite, C151/C154/C155/C156/C157/
C158/C159, sem alterar suites anteriores. APK C1561.0.31 hash preservado
a7012e334e87ec2eac56715b7ae89fef523e9548cd4a9db01f8b7f83b3b8deee.
Allowlist, demais arquivos rastreados, prefixos de memoria e segredos auditados.
Publicacao ainda pendente neste registro; helpers/evidencias ignorados em
tmp/c159-web-session-reload. Nenhuma nova dependencia ou chave de servidor.

## Reparo do harness e nova verificacao — 2026-10-18

Commit fc5e851795749b7f1ee84e39d33e212a4c64539d foi enviado, mas o deployment
C4MYHu9PJx5UKgcPgw53Xi7tkCVw recebeu failure; entrega em producao NAO
confirmada. Conector403 no escopo correto xandeflix2, sem CLI local nem
superficie CUA. Log remoto solicitado ao titular; causa remota ainda nao
confirmada. Nao consultar equipe4 nem credenciais privadas.

Reprodutor privado introduziu40ms na decifragem WebCrypto: teste anterior
acessava calls[0].op antes da RPC e gerava TypeError. Corrigida somente a
sincronizacao do harness C159 para aguardar condicao observavel com limite
de5s. Mesmo caso agora inclui decifragem atrasada e continua exigindo que a
App e sessao fiquem bloqueadas ate a confirmacao do servidor. Nenhuma
assertion/controle removido, nenhum prazo do produto alterado.

Suite C15916/16 e site:build completo PASS novamente, incluindo lock, tsc,
ambos Vite e C151-C158. Logs privados scheduling-repro.log,
c159-scheduling-fixed.log e site-scheduling-fixed.log. Runtime do commit
fc5e851 e APK C156 intactos; testes Chrome anteriores continuam evidencias
sinteticas desse mesmo runtime, sem certificar cliente/fonte reais.
Allowlist deste reparo: teste C159, especificacao, esta evidencia e tres
memorias append-only. Publicacao permanece pendente ate status/verificacao.

## Publicacao confirmada — 2026-10-18

Reparo 251b937185413313cce28e6babf58775883fd7a5 em origin/main. Projeto correto
xandeflix2/xandeflix-prebuilt-nm3x recebeu success/READY no deployment
https://vercel.com/xandeflix2/xandeflix-prebuilt-nm3x/kJSyT6v3GesZHA23BTQyB2caw7Nk
via status GitHub. Isso encerra o bloqueio de publicacao; nao identifica
retroativamente a causa exata do primeiro build, cujos logs nao foram lidos.

Ambos aliases https://xandeflix.vercel.app e
https://xandeflix-prebuilt-nm3x.vercel.app conferidos por leitura publica:
/ /admin /app /app/200, HTML e14assets JS/CSS identicos ao build aprovado,
DENY/nosniff, .env.local e /api/control-plane/state404. Entry contem AES-GCM
e retomada C159; main-CA-lXcaD.js SHA256
f5ef9fff5d0f9e85af99882587cba929cbce38e49dd99bdd50b569c1170041af.
TMDB_CONFIGURED=SIM. Chrome isolado remoto passou: login de3campos,
senhas mascaradas, sem identidade/ativacao/storage antes de autenticar;
captura visual revisada. Nao foi usado login nem conteudo de cliente real.
Provas privadas production-result.json e browser-remote.json em tmp C159.

Usuario precisa entrar uma vez na versao nova para formar envelope; depois
reload da mesma aba revalida sessao ainda valida sem repetir fatores. Sair,
expiracao/revogacao ou nova navegacao exigem login. Fonte parcialmente
incompativel permanece dependencia do fornecedor: TLS de midia, destinos
HTTP, API/EPG sem CORS+404 e imagens com certificado invalido. Sem relay,
bypass, backend/APK/dispositivo ou novas leituras da fonte real.
Fechamento somente nesta evidencia e tres memorias. NEXT_GATE_STARTED=NAO.
