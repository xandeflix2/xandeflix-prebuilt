# C82 — Edição central de telas e árvore Principal/Secundário — 2026-10-12

Pedido direto do usuário sucede C81 concluído. Confirmação do usuário: pagamento
adicional conferido manualmente por ADMIN/MASTER, quantidade adicional e referência
do comprovante auditadas. Sem gateway/preço definido, não executar cobranças.
Preflight clone C11 independente main/origin/HEAD61ec00902be5d0037adf79c68b3a8624b3a2bd6e,
dirty conhecido preservado; CURRENT_GATE=NONE. Contratos/SourceBoundary/activation
lock lidos; sem commit/push/PR/APK/instalação ou workspace histórico/protegido.

## Especificação antes do código

- EDIT não contém Adicionar ou vincular dispositivo; vínculo cadastrado só no
  submenu ATIVACAO/LINK. Cadastro novo por código/chave mantém caminho canônico.
- Capacidade/simultâneos de conta já cadastrada só editáveis em Licenças → Editar
  licença. Remover ação/modal separado de limites e campos editáveis de quantidade
  da ativação. Servidor impede crescimento por RPC legado/vínculo/reativação;
  alterações explícitas passam pelo novo endpoint auditado de edição de licença.
- EDIT contém Quantidade de aparelhos, Limite simultâneo <= quantidade, motivo,
  principal explicitamente classificado selecionado, revisão/confirmar. Redução
  abaixo dos aparelhos ativos é negada, sem desvincular/apagar usuários reais.
- Novo self-service escolhe 1 a 4 telas iniciais antes de confirmar a fonte.
  Esse aparelho é PRINCIPAL; capacidade/simultâneos iguais à escolha, max4; não
  aumentar licença já existente pela reativação/publicação de fonte. Reservar
  vagas não cria/aprova aparelhos fictícios, não contorna política de mesma fonte.
- Acima de4, Editar licença exige autorização de telas adicionais pagas e
  referência curta do comprovante já conferido, confirmação explícita do gestor;
  autorização privada/auditável por licença, sem confiar em alegação USER/cliente.
  Não registrar documentos financeiros, URLs, fonte, cartão ou credencial.
- Somente aparelho explicitamente PRIMARY pode receber secundários/capacidade
  múltipla. SECONDARY é folha; promover a PRIMARY pelo EDIT retira seu pai e
  conserva conta/licença/fonte/código/chave. Não transforma PRINCIPAL em SECONDARY
  enquanto classificado PRIMARY, nem raiz com filhos; vínculos/escopos validados
  no servidor, sem backfill de registros antigos. Legado não classificado deve
  ser explicitamente definido principal no EDIT antes de receber secundários.
- Promoção no mesmo contrato compartilha capacidade total da licença, sem criar
  novo contrato/conta automaticamente ou crédito de telas duplicado.
- C9 concorrência, cofre, importação/catalogo e senha/identidade preservados.
  Ações administrativas reais (transferir/pagar/promover) não usadas como teste.

## Allowlist

Este documento; docs/evidence/C11_LICENSE_PRINCIPAL_SCREEN_POLICY.md; docs/STATUS.md,
EVOLUTION_REPORT.md, DECISIONS.md, ERRORS_AND_BLOCKERS.md; src/debug/manager/
AdminLicensesView.tsx, ManagerLicenseEditor.tsx, ManagerPanelPage.tsx,
ManagerDeviceRegistrationFields.tsx, ManagerDeviceLinkView.tsx,
manager-activation-feedback.ts; src/control-plane/control-plane.types.ts,
client/manager-remote-control-plane-authority.ts, client/public-device-activation.service.ts;
src/ui/pages/PublicDeviceActivationPage.tsx; supabase/functions/managed-source-vault-admin/
index.ts, device-public-activation/index.ts; migration(s) CLI c11_principal_screen_policy;
supabase/tests/c11_principal_screen_policy.sql; scripts/test-c11-principal-screen-policy.mjs
e regressões C80/C78 se expectativas supersedidas pelo pedido (sem relaxar demais
asserts); tsconfig.tsbuildinfo; artefatos privados tmp/c82-principal-screen-policy.

## Aceitação

SQL transacional revertido: auth/escopo MASTER/ADMIN/USER/anon, principal protegido,
secundário folha/promoção, pagamento necessário acima4, validade de prova/quantidade,
capacidade/concorrência/redução, backdoors de limites, self inicial1/4 e rejeição5,
licença existente sem crescimento, rollback e chave/token preservados. Cliente e
Edge reais com portas sintéticas, browser edit/link/public e layouts, nenhuma
quantidade editável fora EDIT, build/lock PASS. Advisors/grants e provenance
conferidos; publicação somente projeto cujbmyhitgomlgwfkaat.
