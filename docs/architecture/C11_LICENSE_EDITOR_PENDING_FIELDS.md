# C86 — Pendências do editor de licença

Demanda direta do usuário em 12/10/2026: destacar os campos que impedem o salvamento e permitir acessar cada campo pela Revisão das alterações.

## Escopo e proveniência

Workspace ativo independente C11 confirmado em `C:\Xandeflix\xandeflix-prebuilt-c11-main`, origin `xandeflix2/xandeflix-prebuilt`, main, HEAD `61ec00902be5d0037adf79c68b3a8624b3a2bd6e`. Estado dirty cumulativo preservado. Ciclo direto C86; nenhum próximo Gate iniciado. Commit/push/PR/APK não autorizados.

Allowlist: `src/debug/manager/ManagerLicenseEditor.tsx`, seu CSS, este contrato, evidência homônima, `docs/STATUS.md`, `docs/EVOLUTION_REPORT.md`, `docs/DECISIONS.md`, `docs/ERRORS_AND_BLOCKERS.md` e artefatos privados em `tmp/c86-license-editor-pending-fields/`. Artefatos de compilação previstos pelos contratos permanecem locais. Sem mudança de banco, regras de capacidade, pagamentos ou salvamento atômico.

## Aceitação

- A mesma validação que bloqueia Salvar alterações identifica os controles pendentes, com contorno visível, `aria-invalid` e associação ao aviso correspondente.
- Cada aviso corrigível é um botão acessível por clique e teclado; leva o foco ao controle e rola o modal para exibi-lo. Confirmações por checkbox também recebem destaque.
- Quando a pendência exige classificar um principal, o aviso aponta para a classificação de aparelho elegível. Mensagens sem correção possível no formulário permanecem informativas.
- Não destacar campos opcionais nem seções sem alterações. Remover o destaque imediatamente após corrigir a pendência. Nenhum foco automático durante digitação nem salvamento automático.
- Preservar os modos Vincular/Excluir, valores e regras existentes e o botão único de salvamento.
- Verificar no navegador com dados sintéticos desktop/mobile, teclado, limpeza do erro e ausência de requisições ao apenas navegar; compilar e auditar a allowlist.
