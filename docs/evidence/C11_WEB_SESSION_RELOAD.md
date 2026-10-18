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
