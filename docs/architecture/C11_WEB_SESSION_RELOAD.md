# C159 — retomar sessao ao recarregar a mesma aba — 2026-10-18

## Pedido, fronteiras comprovadas e preflight

Usuario relata que Ctrl+F5 sempre volta ao login, alem de falhas de filme,
Live, EPG e imagens. Console comprova somente enums aqui registrados:
filme termina em ERR_SSL_PROTOCOL_ERROR (MediaError4 nao prova codec);
Live inicia HTTPS mas chega a HTTP bloqueado; EPG/API sem CORS, com404;
imagens reportadas com ERR_CERT_COMMON_NAME_INVALID. Nao transcrever URLs,
IPs, usuario, senha ou tokens recebidos. Nao consultar esses enderecos.
MIDIA_WEB_COM_FONTE_ATUAL=PARCIAL; CORRECAO_NO_FORNECEDOR=NECESSARIA.
Nao proxy/relay, VPS, banda central ou bypass de HTTPS/CORS/TLS.

Clone independente C:/Xandeflix/xandeflix-prebuilt-c11-main, main,
origin https://github.com/xandeflix2/xandeflix-prebuilt.git, HEAD
55e7d7995ae1c185ed55b57a55fe8550b5524d13, arvore/index limpos.
AGENTS, Architecture, Execution, Source Boundary, C155 e Activation Lock lidos.
CURRENT_GATE=NONE; CURRENT_LOCAL_CYCLE=C159; NEXT_GATE_STARTED=NAO.
Correcao/publicacao web e Git continuam autorizados pelo pedido em curso;
GIT_COMMIT_AUTHORIZED=SIM; GIT_PUSH_AUTHORIZED=SIM; GIT_PR_AUTHORIZED=NAO.
Nao alterar equipe4, Supabase, fontes, clientes, identidades, APK ou aparelhos.

## Emenda limitada anterior ao codigo

O relato do usuario sobre login em toda recarga autoriza corrigir a
continuidade dessa sessao. Substituir SOMENTE a regra C155 "refresh exige
novo login / sessao somente em RAM" para uma recarga da mesma aba/origin:

- Primeiro acesso continua exigindo os tres dados no servidor. Nunca salvar
  PIN, PUK, chave permanente, token nativo, activation ou resposta de source.
- Prova web opaca efemera ja emitida pode ficar CIFRADA por AES-GCM na
  sessionStorage original da mesma aba, com prazo local maximo15min e AAD
  vinculado a versao/prazo. Chave AES256 nao exportavel fica em IndexedDB
  exclusiva de autenticacao desse origin, capturada antes do namespace C155.
  Banco guarda somente essa CryptoKey, sem identidade/conteudo/credencial.
- Retomar automaticamente SOMENTE quando Navigation Timing indica reload,
  antes de importar App e instalar namespace. Nova navegacao/aba nao usa
  copia do envelope. Sem prova integra/nao vencida, mostrar login normal.
- Token decifrado existe somente em RAM transitoria e exige a RPC existente
  rpc_web_session_context: validar servidor/licenca/revogacao/binding/versao
  do PIN e prazos originais15min/8h antes de instalar sessao/namespace/App.
  Cache nunca autoriza. Nenhuma identidade/chave/instalacao e criada.
- pagehide para midia e limpa RAM sem revogar a prova no servidor, permitindo
  reload. Sair, revogacao e falha de verificacao removem envelope e mantem
  logout/revogacao server-side. Timer/visibility continuam revalidando;
  retorno bfcache exige recarga/revalidacao em vez de usar RAM anterior.
- Salvar apos validacao/renovacao, IV novo. Escrita pendente nao pode restaurar
  envelope depois de Sair. IDB bloqueada/corrupta/negada nao permite fallback
  plaintext, apagar catalogo ou gerar nova identidade. Login manual valido
  continua em RAM se armazenamento da retomada falhar.
- Nao e "lembrar senha" nem login permanente. CryptoKey local nao protege
  contra perfil/XSS comprometido; nao equivale a Keystore/cookie HttpOnly.
  Fechar aba normalmente elimina sessionStorage; prazos/revogacao do servidor
  continuam obrigatorios, inclusive se o navegador restaurar estado anterior.

## Allowlist e aceitacao

- Este contrato; append em C11_EXISTING_DEVICE_WEB_LOGIN.md e
  XANDEFLIX_PREBUILT_ARCHITECTURE_CONTRACT.md; docs/VERCEL_APP.md.
- Novo src/web-production/session-resume.ts: envelope cifrado local,
  CryptoKey, prazo/validacao/reload; sem PIN/fonte/catalogo/backend.
- src/web-production/login.ts: retomar com RPC antes de App, salvar apos
  validacao, remover/revogar em Sair/falha e nao revogar em pagehide.
- Novo scripts/test-c159-web-session-resume.mjs; package.json acrescenta
  somente essa suite a site:build, preservando suites/dependencias anteriores.
- Nova docs/evidence/C11_WEB_SESSION_RELOAD.md; tres memorias append-only.
- Helpers/baselines/evidencia sintetica em tmp/c159-web-session-reload ignorado.

Lock antes/depois e site:build inteiro. Testar AES real+IDB sintetico,
nao exportabilidade, reload com servidor, falta/expiracao/adulteracao, erro de
storage/timeout, logout concorrente, ausencia de segredo em armazenamento/log,
cache sem autoridade, erro de contexto nao importa App e isolamento de conta.
Chrome proprio: login sintetico -> reload real -> RPC sintetica -> App;
Sair retorna login e remove envelope. Sem dados reais do usuario.
Auditar allowlist/prefixos/APK, publicar Git canonico e verificar aliases e
admin. Falhas da fonte continuam externas, nao solucionadas por este patch.
