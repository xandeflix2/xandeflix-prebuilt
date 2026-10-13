# C71 — Recuperacao da conta MASTER

2026-10-11. Spec previa em architecture/C11_MANAGER_PASSWORD_RECOVERY.md.
Clone C11 main, HEAD 61ec00902be5d0037adf79c68b3a8624b3a2bd6e, Git sem escrita.

## Diagnostico e resultado

Conta solicitada existente, email confirmado, identidade email presente,
sem ban/deleted, manager OWNER ACTIVE. OWNER equivale a MASTER na RPC.
Nao acessar/verificar senha antiga, criar nova conta, promover ADMIN ou
alterar autorizacao. Historicos sem ownership continuam somente MASTER.

Adicionado link Esqueci minha senha no login inline e pagina independente
/manager-reset-password. Pagina de pedido nao usa a sessao ADMIN existente
para alterar sua senha. Callback recovery capturado antes de SDK consumir
fragmento; getUser real confirma a identidade. Nova senha/confirmacao apenas
em memoria, updateUser seguido de signOut global e novo login. Nao afirmar
que logout invalida imediatamente JWTs ja emitidos: valem ate expiracao.
Erros de logout sao distinguidos de falha na troca da senha.

Pedido real unico de recuperacao aceito por Supabase; recovery_sent_at
registrado. Entrega na caixa de email, callback real e novo login dependem
do titular e NAO foram verificados. Nenhuma senha real digitada pelo agente,
nenhum token de recuperacao lido/registrado, nenhuma alteracao de perfil.

## Verificacao

- C71 isolado: 13/13 (Auth/session/confirmation/provider/logout, pagina real).
- C70 isolado: 8/8 (escopo, nao-escalacao, painel e ativacao publica).
- Typecheck PASS; npm build PASS, bundle index-eMhOZWZG.js.
- Lock antes e no prebuild: 22 + 27 + 9 controles negativos, PASS.
- Browser local real, perfil isolado: request-only sem campos de nova senha,
  desktop/mobile sem overflow, link expirado em navegacao de documento novo,
  PASS. Screenshots privados em tmp/c71-manager-password-recovery.
- Checklist React: labels, autocomplete, aria-live, tipos, cleanup do efeito,
  guard contra submit concorrente; sem hooks condicionais ou CSS-in-JS novo.

Primeira conferencia browser falhou porque Vite watch tentou abrir arquivo
Cookies bloqueado do perfil headless sob tmp. Servidor encerrou com EBUSY.
Restaurado servidor local com helper privado ignorando tmp/temp no watch;
porta 3000 acessivel e browser novamente PASS. Sem editar config permanente
ou encerrar processos de terceiros. Perfil headless fechado ao fim.
Servidor local sessao 26177 permanece ativo para o titular concluir o link.

Nao executar callback real, fonte, playback, dispositivo, APK ou exclusao.
Frontend construida localmente, sem publicacao/deploy. Login principal ainda
inline no painel; pagina dedicada de login foi discutida, nao implementada
neste ciclo de recuperacao. Proveniencia baseline819 e audit privados.

## Retorno do titular e correcao do diagnostico — 2026-10-11

Print real mostra otp_expired retornado pela verificacao Supabase. Logs
sanitizados mostram /recover 200 e recovery email em 18:00:40Z e 18:42:09Z,
/verify em 18:42:35Z com erro de token. last_sign_in_at ainda null. Nao foi
provado qual email/link foi clicado nem se houve scanner/expiracao/consumo.
Nao afirmar que iframe, papel MASTER ou senha anterior causaram esse erro.

Teste com SDK real inicialmente falhou por fixture CORS incompleta: faltava
x-supabase-api-version nos headers permitidos. A suspeita de captura tardia
foi retirada apos corrigir a fixture e verificar tambem o main anterior.
Nenhuma mudanca de recovery-intent/client/main permanece deste complemento.

Patch final minimo: titulo Definir nova senha no passo verificado; mensagens
orientam somente email mais recente; cooldown efemero de reenvio 60s apos
pedido aceito, sem modificar politica do provedor. 15/15 testes isolados;
build/lock PASS, bundle index-CBoU8r9D.js. Browser real + SDK + Auth totalmente
interceptado PASS: tres/quatro getUser fixture, formulario real, envio de
senha fixture, ACK, logout global e limpeza de campos; zero escrita Auth remota.
SDK inclui code_challenge/code_challenge_method de protocolo no PUT; teste
aceita esses campos e rejeita role/metadata inesperados. Browser real sem
sessao/desktop/mobile/link expirado PASS. Nova senha real e login do titular
continuam PENDENTES. Servidor local3000 permanece acessivel.

Tentativa unica de email novo apos validacao recebeu 429
over_email_send_rate_limit, sem novo envio ou troca de senha. Janela SMTP
temporaria sera respeitada; nao elevar quota, mudar template ou Auth por SQL.

### C71 — Recuperacao pronta para teste do titular (2026-10-11)

Titular informou acesso restabelecido com a senha da conta existente e pediu
finalizacao do fluxo para teste posterior. Consulta read-only confirmou
last_sign_in_at 2026-10-11 19:07:44Z, OWNER ACTIVE (MASTER); ultimo envio de
recuperacao continua 18:42:08Z. Isso confirma login, nao troca de senha pelo
fluxo de recuperacao. Nenhum novo email foi solicitado apos esse retorno.
A espera de quota/email adicional registrada antes fica encerrada.
C71 isolado reexecutado: 15/15 PASS. Pagina local /manager-reset-password HTTP
200. Build/lock e browser com SDK real + Auth interceptado PASS no fechamento
anterior; codigo funcional nao mudou depois dessa verificacao.
Implementacao local concluida, teste real de troca de senha pelo titular ainda
pendente. Para testar: Esqueci minha senha, pedido unico, email mais recente,
Definir nova senha + confirmacao (12 caracteres), salvar e entrar novamente.
Nenhum token/senha real coletado; nenhuma conta, role, fonte ou dispositivo
alterado. Sem commit/push/PR, APK ou deploy. NEXT_GATE_STARTED=NAO.
