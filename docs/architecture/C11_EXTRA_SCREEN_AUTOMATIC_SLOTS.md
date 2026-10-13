# C87 — Conferência de telas adicionais cria capacidade

Demanda direta de 12/10/2026: quantidade de telas adicionais pagas deve liberar automaticamente os slots correspondentes do principal, depois de preencher a conferência e salvar. Emenda explícita substitui apenas a regra C85 que exigia aumentar a quantidade manualmente. Mantém exclusividade de edição em Licenças → Editar licença e autorização ADMIN/MASTER.

## Preflight e escopo

Workspace/top-level `C:\Xandeflix\xandeflix-prebuilt-c11-main`, origin `https://github.com/xandeflix2/xandeflix-prebuilt.git`, main, HEAD `61ec00902be5d0037adf79c68b3a8624b3a2bd6e`, dirty cumulativo conhecido preservado. AGENTS, Architecture/Execution, Source Boundary, lock, C82/C85 consultados. CURRENT_GATE=NONE, ciclo direto C87; NEXT_GATE_STARTED=NAO. Sem commit/push/PR/APK/instalação. Supabase consultado somente no projeto `cujbmyhitgomlgwfkaat`; sem alteração de contas reais, schema ou Edge.

Allowlist: este contrato/evidência homônima, docs/STATUS.md, EVOLUTION_REPORT.md, DECISIONS.md, ERRORS_AND_BLOCKERS.md; `src/debug/manager/ManagerLicenseEditor.tsx`, `AdminLicensesView.tsx`; teste SQL `supabase/tests/c11_extra_screen_capacity.sql`; artefatos privados `tmp/c87-extra-screen-automatic-slots/` e saída usual do build.

## Comportamento

- Ao marcar nova conferência, o total cumulativo válido de telas adicionais (1..96, nunca menor que o já conferido) calcula capacidade `max(capacidade atual, 4 + total adicional)`. Ex.: 1 adicional → 5 slots; 2 → 6. Não somar novamente o total a cada salvamento nem reduzir capacidade vigente.
- Mostrar a quantidade calculada no campo de aparelhos, somente leitura durante essa conferência, e resumo de vagas. Desmarcar restaura a edição manual; nenhum envio automático.
- A capacidade só persiste no Salvar alterações com principal elegível, motivo, referência e confirmação válidos. Quantidade inválida continua marcada e bloqueia; preserva salvamento único/snapshot/rollback/escopo. Não fabricar dispositivos para slots vazios.
- Telas simultâneas continuam campo independente, limitadas pela capacidade e pelo limite técnico atual de 50. Não aumentar reprodução concorrente implicitamente: o gestor pode informar 5 simultâneas se esse for o contrato aprovado.
- Slots no rascunho da mesma licença já usam a capacidade calculada. Outro principal usa sua própria licença: disponibilizar atalho para editar essa licença, informando que alterações não salvas do formulário de origem serão descartadas. Não conferir pagamento de uma conta para crescer outra.
- Após salvar, submenu Vincular dispositivo utiliza capacidade persistida e fonte do principal. Secundário não recebe árvore própria, slot duplicado é negado, códigos/chaves e fonte cifrada preservados.

## Aceitação

Browser real com fixtures: checkbox/conferência → 5 sem editar quantidade manualmente, pagamento obrigatório, capacidade 6 cumulativa sem soma duplicada, descarte ao desmarcar, principal necessário, simultaneidade independente, slots calculados, atalho correto entre licenças, desktop/mobile. SQL BEGIN/ROLLBACK: conta cheia com quatro aparelhos, edição atômica para 5, transferência de quinto para mesma fonte/slot, pagamento inválido e duplicidade negados, reenvio de total sem acumular vagas. Build/Activation Lock, regressões e auditoria de hashes/HEAD.
