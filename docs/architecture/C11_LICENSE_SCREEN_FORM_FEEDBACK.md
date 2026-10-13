# C85 — Liberação de slots no editor de licença — 2026-10-12

Pedido direto: diagnosticar e corrigir botão de quantidade/simultaneidade que
permanece desativado após conferência manual. Sucessão local de C84;
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO. Preflight workspace independente C11,
origin xandeflix2/xandeflix-prebuilt, main, HEAD
61ec00902be5d0037adf79c68b3a8624b3a2bd6e confirmado. Dirty anterior preservado;
AGENTS, Architecture/Execution, Source Boundary, lock e contratos C82/C83 lidos.
Sem Git/APK/instalação/mutação remota, alteração de preços ou política de pagamento.

## Especificação antes do código

- Botão exige principal explicitamente classificado e ativo da licença atual.
  Selecionar automaticamente apenas quando existe exatamente um principal;
  preservar escolha válida após atualização e retirar escolha que deixou de ser
  elegível. Não promover legado/secundário implicitamente nem usar outra licença.
- Mostrar motivos humanos do bloqueio: principal, quantidade válida e suficiente
  para vínculos ativos, simultaneidade compatível, motivo da alteração e requisitos
  da conferência manual quando necessária ou solicitada. Formulário e submit
  compartilham validação; impedir envio incompleto e duplicado durante operação.
- Explicar que conferência registra autorização de telas extras, sem criar slots
  automaticamente. Quantidade permitida controla capacidade; simultaneidade
  controla reprodução concorrente. Mostrar resumo da capacidade pretendida/vagas.
- Conferência opcional antes do aumento, já autorizada em C83, permanece possível.
  Referência curta/confirmada manualmente; não simular cobrança ou pagamento e não
  relaxar autoridade/validações remotas. Acima de quatro exige autorização vigente.
- Atualizações de outros campos não devem apagar seleção válida do principal.
  Falha remota deve permitir correção/retry e apresentar mensagem humana existente.

## Allowlist estrita

Este documento; docs/evidence/C11_LICENSE_SCREEN_FORM_FEEDBACK.md; docs/STATUS.md,
docs/EVOLUTION_REPORT.md, docs/DECISIONS.md, docs/ERRORS_AND_BLOCKERS.md;
src/debug/manager/ManagerLicenseEditor.tsx; tmp/c85-license-screen-form-feedback/
(fixtures, baseline, logs e auditoria privados); saída usual do build web.

## Aceitação

Browser com TSX real e autoridade sintética: único/múltiplos/nenhum principal,
sem seleção/campos incompletos, quatro aparelhos → cinco vagas com uma extra,
quantidade vs simultâneos independentes, conferência prévia, confirmação/referência,
redução/inteiros/limites, falha e retry, atualização/reclassificação do principal,
desktop/mobile sem overflow. Regressões C82/C83 e build com prebuild obrigatório;
baseline compara hashes fora da allowlist e HEAD. Nenhum cliente real alterado.

## Emenda autorizada — salvar tudo

Durante a execução o usuário confirmou unificar o salvamento de todas as alterações.
EDIT terá um único formulário e botão Salvar alterações; demais botões de salvar
cliente/aparelho/capacidade/fonte são removidos. Promoção passa a ser rascunho com
confirmação; modal de mudança de principal apenas prepara o rascunho. LINK/DELETE
e reveal de leitura continuam autônomos. Mostrar mudanças pendentes/erros por campo;
fechar abandona o rascunho. Nenhum envio apenas ao selecionar ou confirmar campos.

Uma RPC agregada reutiliza as validações auditadas existentes, na mesma transação,
com snapshot dos dados editáveis para negar sobrescrita concorrente. Promoções
precedem capacidade crescente; metadados e árvore são aplicados antes da capacidade
decrescente; fonte cifrada é substituída por último. Qualquer erro reverte todo o
lote, inclusive auditorias e comprovantes. Sem loops de RPC no cliente nem fallback
para gravação parcial. Cofre Edge prepara envelope em memória e envia apenas o
envelope para a RPC; fonte nunca entra em payload público de metadata/snapshot/log.
Manter escopo ADMIN/MASTER, identidade, C9, slots e políticas C82/C83.

Allowlist ampliada exclusivamente para: src/control-plane/control-plane.types.ts,
src/control-plane/client/manager-remote-control-plane-authority.ts,
src/debug/manager/manager-activation-feedback.ts,
supabase/functions/managed-source-vault-admin/index.ts,
migration criada por CLI c11_license_editor_atomic_save,
supabase/tests/c11_license_editor_atomic_save.sql,
scripts/test-c11-license-editor-atomic-save.mjs. Publicação autorizada pelo pedido
somente no projeto cujbmyhitgomlgwfkaat; nenhum cadastro real usado como fixture.
Testes adicionais: rollback do lote, conflito de snapshot, escopo USER/anon/ADMIN,
pagamento/capacidade/promoção/árvore/source com envelope, erro/retry/duplo clique e
único salvamento no browser. Não autoriza outro Gate, Git/APK ou cobrança real.

Pedido adicional: organizar espaçamento, hierarquia de textos e campos do EDIT.
Allowlist inclui src/debug/manager/ManagerLicenseEditor.css. Seções com títulos
claros, grid de campos curtos desktop e coluna única mobile; controles de revisão
e botão único no final em destaque. Evitar abas desnecessárias que escondam erros;
nenhum campo/remissão exigida ou ação existente removida além dos saves redundantes.

Pedido adicional: na tabela de licenças, principal e secundários em linhas próprias,
com secundários recolhidos sob controle acessível na linha principal. Buscar código
ou Local/Tipo expande os resultados encontrados automaticamente. Manter tabela
desktop e blocos somente mobile; capacidade/ações pertencem à licença e não se
duplicam nos filhos. Legados/órfãos e múltiplos principais não são ocultados. Evitar
repetir lista completa da mesma fonte em cada filho. Allowlist inclui
src/debug/manager/AdminLicensesView.tsx e AdminLicensesView.css. Aceitação inclui
toggle/teclado/busca/contagem/legado/revogado e nove larguras sem overflow.

Emendas visuais pedidas durante a verificação: títulos de campos em destaque
em todos os formulários do sistema, com rótulos/legendas em negrito e contraste,
valores dos controles com peso normal e separação entre rótulo e controle.
Aplicação comum em src/index.css, sem alterar regras de preenchimento/validação.
Remover apenas o Voltar redundante do Header na view manager-panel, preservando
o retorno próprio do painel e os demais retornos. Allowlist ampliada para
src/index.css e src/ui/components/Header.tsx. Verificar títulos/valores calculados
no browser e um único retorno no painel, inclusive standalone; lock antes/depois.
O retorno externo em paisagem/retrato tablet também é criado por AppShell:
allowlist inclui src/ui/components/AppShell.tsx para a mesma exceção manager-panel.
