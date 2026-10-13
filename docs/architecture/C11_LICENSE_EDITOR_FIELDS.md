# C83 — Cadastro completo no editor de licença — 2026-10-12

Pedido direto atual autoriza os campos da tabela no modal EDIT, preservando os
formulários de capacidade e fonte. Sucede C82; nenhuma operação Git/APK autorizada.
Preflight do clone C11 independente main/origin/HEAD
61ec00902be5d0037adf79c68b3a8624b3a2bd6e confirmado; dirty C11 preservado.
Contratos arquitetural/execução/source boundary/lock lidos. Pasta histórica e
projeto original protegidos; publicação exclusivamente cujbmyhitgomlgwfkaat.

## Especificação prévia

- Cliente editável por ID da conta, sem substituir textos globalmente. Atualizar
  nome canônico usado nas abas; auditoria histórica imutável. ADMIN só sua carteira.
  Se houver perfil self-service, preservar validação canônica de nickname e
  unicidade, com mensagem humana; nomes de contas comerciais seguem até100.
- Exibir código, último acesso, modo, status, criação somente leitura; Local/Tipo,
  classificação de aparelho e plataforma administráveis, sem mudar código/chave,
  telemetria original ou preferências locais do app. Correção administrativa de
  plataforma/tipo persistida separadamente e prevalece nas consultas do gestor.
- Manter quantidade/simultaneidade/motivo e conferência manual acima4 no EDIT.
  Permitir registrar conferência adicional antes de aumentar capacidade. Não
  revogar comprovantes históricos nem inventar preço/cobrança automática.
- Mostrar papel, principal, fontes vinculadas por metadados opacos, contagem real
  de dispositivos na mesma fonte e slot individual. Slot inteiro entre1 e capacidade
  da licença, exclusivo por licença. Reservar slot para cada vínculo ativo;
  atribuição legada ocorre somente ao editar/classificar/vincular, não por backfill.
  O principal mantém seu slot; secundário pode trocar por um slot livre. Não há
  multiplicação de capacidade por promover aparelhos.
- Emenda C82: EDIT permite mudança explícita PRIMARY -> SECONDARY, com principal
  de destino autenticado e confirmação. Raiz com filhos deve reorganizar seus
  vínculos primeiro; continua bloqueada contra transferência parcial da árvore.
  Submenu de vínculo continua impedindo rebaixamento implícito de PRIMARY.
  Destino deve ter fonte ativa/capacidade; sua quantidade só é alterada no EDIT.
  Transferência troca conta/fonte só do aparelho selecionado e fecha sua sessão;
  não altera identidade/chave, outros aparelhos, fontes compartilhadas ou cofre.
- Não voltar a adicionar formulário de vincular/adicionar no EDIT; apenas edição
  explícita da classificação de aparelho já vinculado e dos seus dados.
- Slot exclusivo enforced pelo banco/índice e operações serializadas sob lock
  canônico. Menor capacidade não pode deixar slots fora do limite, mesmo havendo
  pouca ocupação. USER/anon sem acesso a dados privados nem mutações administrativas.

## Emenda autorizada durante C83

Novo pedido exige modal ao rebaixar PRIMARY, indicando novo principal e destino
dos filhos. Substitui somente o bloqueio absoluto de raiz com filhos acima:
modal lista filhos e oferece transferir todos para o novo principal ou manter
na conta atual sob outro PRIMARY autorizado escolhido. Sem outro principal,
essa segunda opção não pode ser confirmada. Cancelar não altera dados. Confirmar
prepara a revisão; salvar executa a operação inteira atomicamente, validando
snapshot da lista de filhos, escopos de todos, fonte ativa e capacidade, sem
autopromover filho ou aumentar limites. Conflito/lotação reverte toda a árvore.
Nenhum filho permanece apontando para um secundário. Sem plano explícito,
raiz com filhos continua rejeitada no servidor. Slots dos filhos realocados
automaticamente em vagas únicas; slot escolhido do ex-principal reservado.

## Allowlist

Este documento; docs/evidence/C11_LICENSE_EDITOR_FIELDS.md; docs/STATUS.md,
EVOLUTION_REPORT.md, DECISIONS.md, ERRORS_AND_BLOCKERS.md; src/debug/manager/
ManagerLicenseEditor.tsx, ManagerLicenseEditor.css, AdminLicensesView.tsx,
manager-activation-feedback.ts; src/control-plane/control-plane.types.ts e
client/manager-remote-control-plane-authority.ts; migração CLI
c11_license_editor_fields e correção c11_license_editor_customer_validation;
supabase/tests/c11_license_editor_fields.sql;
scripts/test-c11-license-editor-fields.mjs; tsconfig.tsbuildinfo;
artefatos privados tmp/c83-license-editor-fields.

## Aceitação

Teste SQL com fixtures revertidas: rename por ID e abas, homônimo preservado,
ADMIN/MASTER/USER, campos automáticos intactos, slots exclusivos/limite/redução,
promoção/rebaixamento explícito sem filhos, bloqueio implícito, transferência
com fonte/capacidade e credenciais preservadas. Browser: edição e dados de todas
as colunas, confirmação de papel, slots, readonly, mobile/desktop. Regressões
C82/console, lock/build, grants/advisors e provenance. Não usar clientes reais
como fixtures. Nenhum próximo Gate iniciado.
