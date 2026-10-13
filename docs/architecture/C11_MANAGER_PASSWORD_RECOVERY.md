# C11 — Recuperacao da senha do gestor (C71)

Pedido explicito de 2026-10-11: recuperar a conta MASTER existente por Supabase.
Preflight: clone C11 main, origin xandeflix2/xandeflix-prebuilt, HEAD
61ec00902be5d0037adf79c68b3a8624b3a2bd6e. AGENTS, Architecture, Execution,
Source Boundary e Activation Lock lidos. Dirty anterior preservado.
CURRENT_GATE=NONE; ciclo local autorizado, sem proximo Gate ou Git.

## Escopo e aceite anteriores ao codigo

- Preservar identidade Auth existente e papel OWNER/MASTER. Nao criar usuario,
  alterar role, escrever hash de senha por SQL ou gerar senha padrao.
- Recuperacao por Supabase Auth resetPasswordForEmail; link conclui em tela
  browser publica /manager-reset-password, fora do boot/ativacao do aparelho.
- Tela de nova senha exige getUser confirmado no servidor e mostra email da
  conta autenticada. Senha e confirmacao apenas em memoria, sem logs/storage.
- Revalidar identidade antes de updateUser; nao mudar outra conta em corrida.
  Sucesso exige resposta Auth valida, limpar campos, encerrar sessoes por
  signOut global e solicitar novo login. Erro de logout nao e sucesso silencioso.
- Mensagem generica no pedido de email para impedir enumeracao. Nao expor
  erros/tokens do provedor. Link expirado sem sessao nao abre formulario.
- Redirect usa apenas origem atual HTTP localhost/HTTPS e rota fixa. Preservar
  detectSessionInUrl e aceitar callback recovery padrao na raiz, sem copiar
  tokens para outra URL. Nao alterar configuracao Auth remota automaticamente.
- Envio unico solicitado para xandeflix2@gmail.com, somente apos pagina/testes
  locais. Resultado HTTP nao prova entrega ou alteracao da senha; usuario define
  a senha no seu navegador. Supabase pode exigir SMTP/redirect autorizado.
- Nenhuma exclusao, APK, dispositivo, fonte, role, migration ou deploy remoto.

Allowlist: este contrato; docs/evidence/C11_MANAGER_PASSWORD_RECOVERY.md;
src/debug/manager/ManagerPasswordRecovery.tsx; manager-password-recovery.ts;
src/debug/manager/ManagerPasswordRecovery.css; ManagerPanelPage.tsx (link);
src/main.tsx (rota independente); scripts/test-c11-manager-password-recovery.mjs;
scripts/test-c11-manager-scoped-access.mjs (port do novo helper);
docs/STATUS.md, docs/DECISIONS.md, docs/ERRORS_AND_BLOCKERS.md,
docs/EVOLUTION_REPORT.md (append-only); tmp/c71-manager-password-recovery e
saidas usuais dist/tsconfig.tsbuildinfo.

Teste de sessao ausente/expirada, troca de identidade, rejeicao da senha,
confirmacao divergente, falha de rede/logout, ausencia de privilegio novo,
callback na raiz e rota dedicada. Lock antes/depois, typecheck/build e C70.
Dados Auth reais permanecem inalterados ate o titular confirmar nova senha.

## Correcao solicitada apos retorno do email — 2026-10-11

Relato/print mostram otp_expired e retorno ao formulario de pedido. Teste novo
com SDK browser real e endpoints Auth interceptados (somente fixture) tambem
reproduziu callback valido ficando no pedido de email. A snapshot de intencao
em main era tardia: dependencias podem iniciar SDK e limpar fragmento antes.
Capturar apenas flags nao sensiveis no modulo independente anterior a primeira
criacao do cliente; UI continua exigindo getUser confirmado pelo servidor.
Nao persistir/copiar tokens ou transformar flag em autoridade. Acrescentar
src/integrations/supabase/recovery-intent.ts e client.ts (import somente para
captura previa), testes de callback SDK valido/recusado e snapshot precoce.
Mesmo escopo C71, sem novo Gate, sem contas, roles ou configuracao Auth remota.
Tela valida se intitula Definir nova senha; alerta de link recusado recomenda
somente email mais recente. Novo pedido unico apos correcao, se necessario,
sem afirmar causa de otp_expired (email antigo/consumo/expiracao nao provados).
Baseline adicional em tmp/c71-manager-password-recovery/baseline-callback.json.

Adjudicacao apos corrigir CORS do endpoint Auth interceptado: o callback valido
PASS tambem com main anterior a alteracao. Portanto, a suspeita de captura
tardia NAO foi confirmada e a mudanca de recovery-intent/client/main e retirada.
Erro real observado permanece otp_expired antes da tela; causa especifica
nao comprovada. Escopo final minimo: titulo Definir nova senha quando validado,
erro/pedido orientam email mais recente, reenvio bloqueado por 60s apos pedido
aceito (apenas estado efemero UI, sem substituir rate limit Supabase), testes
reais do SDK com Auth interceptado incluindo submit e ACK/logout sem qualquer
senha real ou escrita remota. Nenhum novo email antes da validacao final.
