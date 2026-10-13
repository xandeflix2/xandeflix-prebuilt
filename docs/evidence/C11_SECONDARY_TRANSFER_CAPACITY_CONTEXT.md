# C88 — Transferência não exige principal na origem

12/10/2026. Workspace/top-level independente C11/main/origin esperado/HEAD `61ec00902be5d0037adf79c68b3a8624b3a2bd6e` confirmado. Baseline 915 arquivos, dirty anterior preservado. AGENTS/contratos/boundary/lock e regras C82/C83/C85/C87 da sessão aplicados. Skills Supabase/Postgres/verification previamente lidas reutilizadas. Sem segredos/cadastro real/Git/backend/APK alterados; NEXT_GATE_STARTED=NAO.

## Causa e correção

Consulta somente leitura confirmou XF-ZARA-9ENF PRIMARY, capacidade5, concorrência5, uma extra paga, quatro vínculos ativos. XF-86SP-MGXW na licença de origem, não classificado, capacidade1, concorrência1, uma associação e zero extras pagos. A revisão combinava conferência da origem com a transferência e exigia PRIMARY na conta que o aparelho deixaria.

Quando há destino externo e nenhum PRIMARY permanecerá na origem, o editor descarta rascunhos incompatíveis de quantidade/conferência de origem e informa isso explicitamente. Não inclui `screens` no payload nem seus bloqueios. Mantém confirmação de papel/destino/slot, snapshot, demais alterações e RPC transacional existentes. Quantidade do destino não é aumentada por esse caminho. Se PRIMARY permanece/promove na origem ou árvore KEEP_ACCOUNT retém principal, validação de capacidade continua ativa. Voltar à classificação PRIMARY restaura capacidade vigente e não reaplica pagamento abandonado.

## Verificação

- Browser com TSX real e fixtures sintéticas: origem legado/aparelho único/1vaga, conferência extra1 preenchida e bloqueada antes de classificar, destino PRIMARY com5vagas/4aparelhos. Ao selecionar SECONDARY/destino/slot5/confirmar, revisão mantém apenas cadastro/vínculo, zero campos inválidos, Salvar habilitado e uma chamada sem `screens`/`source`; capacidade/prova da origem preservadas. Destino recebe quinto aparelho, licença vazia é ocultada.
- Desktop1507×900/mobile390×844, screenshots inspecionados; retornar à classificação PRIMARY não ressuscita conferência; ausência legítima de principal continua bloqueando capacidade; principal retido mantém edição de capacidade; falha remota mantém rascunho e permite retry.
- SQL real no projeto autorizado `cujbmyhitgomlgwfkaat`, BEGIN/ROLLBACK e fixtures aleatórias: teste C87 ampliado usa exatamente `rpc_manager_save_license_edits` da origem com `devices` somente. Transfere quinto/slot5/SECONDARY/fonte do principal, sem alterar capacidade1 ou registrar pagamento da origem; identidade/token preservados. Rejeições de prova/limite/slot e crescimento cumulativo ao sexto permanecem testados.
- Marcador `C88_ATOMIC_ORIGIN_NO_PRINCIPAL_FIFTH_SLOT_SAME_SOURCE_NO_ORIGIN_CAPACITY_PAYMENT_PASS`. Consulta posterior: zero fixtures; origem real1/destino real5 preservados.
- TypeScript PASS; regressão cliente/RPC/Edge/AES/retorno C85 três grupos PASS. Build privado do Gestor com VITE_DEBUG_BUILD=true e Activation/Catalog Lock exigido pelo prebuild. Saída do Gestor explicitamente verificada; dados reais não usados para submissão no browser.
- Artefatos privados `tmp/c88-secondary-transfer-capacity-context/`: baseline, browser-report, screenshots/logs/build e auditoria de allowlist/HEAD. Compilação local; sem instalação física.

Nenhuma mudança remota necessária: RPC existente aceita edição apenas do aparelho. O gestor ainda executa Salvar no seu formulário para aplicar o vínculo real.
