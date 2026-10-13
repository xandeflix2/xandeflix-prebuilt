# C88 — Transferência secundária sem edição de capacidade de origem

12/10/2026, demanda direta: destino principal com slot5 disponível, origem definida SECONDARY e confirmada, mas conferência pendente da origem exige promover um principal inexistente e bloqueia Salvar.

Preflight: workspace/top-level independente `C:\Xandeflix\xandeflix-prebuilt-c11-main`, origin esperado `xandeflix2/xandeflix-prebuilt`, main, HEAD `61ec00902be5d0037adf79c68b3a8624b3a2bd6e`, dirty conhecido preservado. AGENTS/contratos/SourceBoundary/lock/C82/C83/C85/C87 consultados nesta sessão, reutilizados sem reler segredos. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem Git/APK/instalação/schema/Edge/cadastro real autorizados.

Allowlist: `src/debug/manager/ManagerLicenseEditor.tsx`; teste existente `supabase/tests/c11_extra_screen_capacity.sql`; este contrato/evidência homônima, docs/STATUS.md, EVOLUTION_REPORT.md, DECISIONS.md, ERRORS_AND_BLOCKERS.md; `tmp/c88-secondary-transfer-capacity-context/` e saída usual de build/tsconfig.tsbuildinfo.

## Comportamento

- Se há transferência explícita de secundário para outra licença e nenhum aparelho da origem ficará classificado PRIMARY no rascunho, a edição de capacidade da origem não se aplica. A licença/capacidade/fonte destino permanecem independentes.
- Exibir mensagem clara na seção de capacidade: vagas/simultaneidade foram definidas na licença do principal e aqui será salvo o vínculo. Descartar rascunhos incompatíveis de quantidade/conferência da origem, com aviso explícito; não registrar pagamento na conta errada.
- Não incluir `screens` no payload nem pendências de principal/motivo/pagamento de origem nesse contexto. Validar confirmação, destino, slot e demais alterações normalmente. Nenhuma promoção implícita do secundário nem crescimento da licença destino por transferência.
- Se um PRIMARY permanece ou é promovido na origem, conservar validação normal de capacidade, sem ocultar pendências legítimas. Voltar da transferência restaura a capacidade vigente, não reaplica conferência abandonada.
- Persistência usa RPC atômica existente e escopo/snapshot; slot ocupado/limite destino insuficiente continuam negados pelo banco. Nenhuma alteração automática de cliente real.

## Aceitação

Browser reproduz exatamente legado não classificado/uma vaga: preparar pagamento/quantidade, definir secundário de destino com capacidade5, selecionar slot5 e confirmar; Salvar habilita e envia somente dispositivo, sem `screens`. Rascunho de quantidade não altera conta errada; destino insuficiente não ganha vagas. Caso com principal retido/promoção conserva pendências de capacidade. SQL rollback verifica RPC agregada de origem transfere quinto aparelho para slot5/fonte do principal sem tocar capacidade/pagamento origem. TypeScript, build do Gestor/lock, regressões e auditoria de allowlist/HEAD.
