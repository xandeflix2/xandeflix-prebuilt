# C81 — Submenu ativação e vínculo com capacidade vigente — 2026-10-12

Pedido direto do usuário: concluir C80 e depois separar Ativar dispositivo em
Ativação por Código + Chave e Vincular dispositivo cadastrado. C80 concluído,
build/lock/SQL/browser aprovados e backend publicado antes deste novo ciclo.
Preflight C11 independente main/origin/HEAD preservados; CURRENT_GATE=NONE.
Documentos canônicos/SourceBoundary/activation lock lidos; estado dirty conhecido.

## Especificação antes do código

- Submenu lateral sob Ativar dispositivo, ativação atual e notificações preservadas.
- Vincular dispositivo escolhe principal cadastrado autorizado da licença visível
  ao gestor. Abrir a mesma operação de vínculo C80 em modal dedicado somente ao
  vínculo registrado. Mostrar cliente, códigos, capacidade e simultâneos vigentes,
  aparelhos vinculados e situação de vagas. Sem código/chave de novo aparelho.
- ADMIN opera apenas clientes de seu escopo (origem e destino); MASTER global.
  Fonte e relação reais validadas transacionalmente no RPC já criado C80.
- Registro existente não aumenta capacidade/simultâneos implicitamente; limites
  readonly e verificados no servidor sob lock contra estado atual da licença.
  Sem vaga, bloquear confirmação com texto sobre ajustar contrato/licença pelo
  gestor em Licenças. Não cobrar, não ativar checkout, não assumir plano de 4 telas.
- Limite simultâneo configurado deve ser <= capacidade da licença. Validar
  cadastro configurado, vínculo e atualização explícita de limites no servidor,
  cliente e Edge. Não mudar playback C9, dados reais ou planos já cadastrados.
- UI revisa origem, destino e principal, informa efeito de usar a fonte do principal,
  mantém código/chave/token, preserva clientes/fontes de origem e exige confirmação.
- Desktop tabela C80 e mobile blocos preservados; submenu e modal responsivos,
  controles acessíveis e Escape restaura foco; chamadas não criam N+1.

## Allowlist

Este documento; docs/evidence/C11_ACTIVATION_LINK_SUBMENU.md; docs/STATUS.md,
EVOLUTION_REPORT.md, DECISIONS.md, ERRORS_AND_BLOCKERS.md; src/debug/manager/
ManagerPanelPage.tsx/css, ManagerLicenseEditor.tsx, ManagerDeviceRegistrationFields.tsx,
ManagerDeviceLinkView.tsx, manager-activation-feedback.ts; src/control-plane/client/
manager-remote-control-plane-authority.ts; supabase/functions/managed-source-vault-admin/
index.ts; migration gerada CLI c11_link_capacity_contract; testes C80 existentes
scripts/test-c11-manager-device-registration.mjs e supabase/tests/
c11_manager_device_registration.sql; tsconfig.tsbuildinfo; privados tmp/c81-link-submenu.

## Aceitação

Testes cliente/Edge e SQL rollback incluem overbooking, limite desatualizado e
simultâneos > dispositivos, além da suíte C80 completa. Browser submenu real,
notificação retorna ativação, link com principal preselecionado, bloqueio de vagas,
limites readonly, sucesso/falha, móvel sem corte. Build/lock obrigatórios PASS.
Advisors e permissões revisados; publicar somente migration/Edge do projeto
cujbmyhitgomlgwfkaat. Sem vínculo real como teste, Git, APK ou próximo Gate.

## Resultado
C81 concluído; evidência C11_ACTIVATION_LINK_SUBMENU.md registra publicação,
SQL/browser/cliente/Edge e build/lock PASS. Sem próximo Gate iniciado.
