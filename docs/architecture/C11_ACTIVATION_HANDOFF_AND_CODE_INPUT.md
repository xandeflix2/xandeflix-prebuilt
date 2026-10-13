# C74 — Codigo ID automatico, compartilhar e solicitacao de ativacao

2026-10-11. Spec anterior ao codigo, pedidos explicitos do usuario neste ciclo.
Preflight: clone independente C:/Xandeflix/xandeflix-prebuilt-c11-main, main,
origin esperado, HEAD61ec00902be5d0037adf79c68b3a8624b3a2bd6e. AGENTS,
Architecture, Execution, Source Data Boundary e Activation Lock lidos.
CURRENT_GATE=NONE; patch direto autorizado; NEXT_GATE_STARTED=NAO.
Dirty C11 anterior preservado por baseline privada. Sem commit/push/PR,
reset/instalacao fisica, rotacao de identidade/chave ou fonte/catalogo remoto.
Lock antes:22 ativacao +27 promocao +9 negativos PASS.

## Aceitacao

1. Campo Codigo ID aceita oito caracteres alfanumericos e codigo completo
colado, maiusculas automaticas, XF e separadores apresentados automaticamente.
Validacao final continua XF-XXXX-XXXX; sem gerar/regravar identidade. Prefixo
fixo fora da parte editavel evita atrapalhar apagar, selecionar e corrigir.
Usar nos campos do painel e pagina publica, inclusive novo/existente cliente.
2. Primeira ativacao mobile/tablet oferece compartilhar Codigo ID e chave
via Share existente, com copia alternativa e feedback honesto/cancelamento.
Dados somente em RAM e enviados pelo usuario pelo share sheet escolhido;
nao incluir token, URL de fonte, fonte/configuracao ou persistir texto/log.
3. TV (preferencia escolhida antes da ativacao) oferece formulario nome/apelido,
plataforma Android TV/Fire TV/Tizen/webOS e codigo de atendimento opcional.
Submit explicito envia somente metadata + prova secreta de status A1 existente;
nenhum envio automatico. Confirmar A1 PENDING, proof hash, chave registrada
ativa e hash consistente; nao obter fonte nem autorizar/recriar identidade.
4. Codigo de atendimento privado gerado para gestor ativo, exibido no painel
para ele fornecer ao cliente. Codigo nao concede privilegio; somente roteia
solicitacao nova. Ausente chega ao MASTER. ADMIN so ve solicitações dirigidas
a ele ou dispositivo de sua responsabilidade; nao atravessa cliente alheio.
MASTER ve todas. USER/anon/inativo nao listam/leem/abrem solicitacoes.
5. Tabelas privadas com RLS/revokes, RPC invoker exposta e helpers definer
restritos com search_path vazio. Pre-auth submit usa prova A1 (excecao explicita
ao auth.uid); idempotencia por activation_id + rate limit + limites de campos;
nao guardar chave/token raw nem duplicar vault. Sanitizar nome, enums, UUID.
6. Icone de tela com + para solicitacoes junto ao sino de relatos (pedido
posterior do usuario: distinguir funcoes, evitar dois sinos iguais). Tooltip
Solicitacoes de ativacao, contagem/read receipt por
gestor, pagina50/cursor, polling30s somente visivel, cleanup/timeout/epoch.
Ao clicar mensagem, abrir aba Ativacao validada, Codigo/nome/plataforma prontos.
Dados insuficientes/expirados/consumidos nao abrem formulario validado.
7. Handoff sem revelar PIN ou hash ao cliente: abrir solicitaçao valida e
registra receipt de 15min para gestor autenticado. Edge de ativacao existente
resolve hash somente server-side por RPC service_role restrita, verificando
gestor real, receipt, scope, pending, prazo e chave ativa novamente. Reutiliza
rpc_manager_complete_device_activation existente e todas suas politicas de
fonte/licenca/slots/ownership. Nao mudar regras de reveal MASTER.
8. Nenhuma notificacao/apertura/codigo de atendimento concede AUTHORIZED.
Gestor informa fonte/cliente e confirma ATIVAR; manual code+key preservado.
Mudanca do codigo, sessao/logout ou conclusao invalida handoff em RAM.
9. SQL testar allow/deny/forgery/stale/idempotencia/routing/cross-manager em
transacao rollback com fixtures sinteticas; sem criar usuarios reais. Consultar
docs/changelog Supabase e advisors; aplicar somente cujbmyhitgomlgwfkaat depois
de revisar/testar. Edge deploy somente arquivo autorizado e dependencias reais.
Testes TS/servico/browser compartilhamento simulado, D-pad, mask/paste/edit,
offline/share cancellation/retry; lock/typecheck/build/APK verificado.

## Allowlist

- Esta spec e docs/evidence/C11_ACTIVATION_HANDOFF_AND_CODE_INPUT.md.
- docs/STATUS.md, DECISIONS.md, ERRORS_AND_BLOCKERS.md, EVOLUTION_REPORT.md append.
- src/ui/activation/device-code-input.ts; src/ui/components/DeviceCodeInput.tsx
  e CSS novos; src/ui/activation/activation-share.ts novo.
- src/ui/components/ActivationHandoff.tsx e CSS novos;
  ActivationPage.tsx somente montagem; PublicDeviceActivationPage.tsx inputs.
- src/control-plane/client/activation-handoff.service.ts novo.
- src/debug/manager/ManagerActivationRequests.tsx/CSS novos;
  ManagerPanelPage.tsx somente inputs, handoff/contexto/acoes/montagem.
- src/control-plane/client/manager-remote-control-plane-authority.ts somente
  tipo/payload da solicitacao em activateSourceForDevice.
- supabase/functions/managed-source-vault-admin/index.ts somente resolver
  hash do handoff server-side antes do fluxo existente de ativacao.
- Uma migration nova CLI c11_activation_handoff; teste SQL novo correspondente.
- scripts/test-c11-activation-handoff.mjs novo; testes lock existentes intactos.
- scripts/test-c11-manager-scoped-access.mjs somente ports dos tres imports
  novos no harness (DeviceCodeInput, ManagerActivationRequests, labels/claim);
  nenhuma assertion/permissao existente removida. Falha observada: Missing port
  ManagerActivationRequests no loader isolado antigo; adaptar antes da entrega.
- scripts/test-c11-activation-key-visibility.mjs somente port inerte do novo
  filho ActivationHandoff no harness isolado. Falha observada: import novo
  tratado como servico externo bloqueado no SSR; manter assertions de chave.
- Saidas usuais build/Capacitor/tsbuildinfo/APK e helpers tmp/c74-activation-handoff
  ignorados. Nenhum .env, dependencia nova, Git ou outro recurso.
