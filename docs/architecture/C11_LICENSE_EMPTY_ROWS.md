# C84 — Ocultar linhas sem aparelhos após vínculo — 2026-10-12

Pedido atual autoriza ajuste visual na aba Licenças: a licença de origem que ficou
sem dispositivos após transferir o secundário não deve ocupar linha vazia.
Preflight: clone independente C11, origin xandeflix2/xandeflix-prebuilt, main,
HEAD61ec00902be5d0037adf79c68b3a8624b3a2bd6e. AGENTS, contratos arquitetura/
execução/source boundary/Activation Lock lidos; dirty anterior preservado.
Gate ativo apenas C84, sem Git/APK/instalação/backend autorizado ou necessário.

## Especificação antes do código

- Ocultar por padrão licenças cuja lista de aparelhos é explicitamente vazia e
  contagem de vínculos ativos é zero. Não apagar cliente/licença/fonte/histórico.
- Manter principal e secundário na linha consolidada da licença de destino,
  após atualização normal do painel e após recarregar a página.
- Preservar linhas com aparelhos revogados/suspensos e payload legado sem lista
  de dispositivos: ausência de informação não comprova licença vazia.
- Oferecer filtro opt-in Exibir licenças sem aparelhos, para consultar/administrar
  licenças ainda não usadas ou de origem sem desfazer a limpeza padrão.
- Busca/status/modo operam em conjunto com esse filtro; contagem do cabeçalho
  corresponde às linhas exibidas. Tabela desktop/mobile e ações existentes iguais.

## Allowlist e aceitação

src/debug/manager/AdminLicensesView.tsx e AdminLicensesView.css; este documento;
docs/evidence/C11_LICENSE_EMPTY_ROWS.md; docs/STATUS.md, EVOLUTION_REPORT.md,
DECISIONS.md, ERRORS_AND_BLOCKERS.md; artefatos privados tmp/c84-license-empty-rows.
Saídas usuais build/tsconfig.tsbuildinfo. Nenhuma migration/RPC ou dado real.

Browser com componente real e fixtures: origem antes/depois de vincular,
principal/secundário juntos, linha vazia oculta, reload, opt-in/opt-out,
combinação busca/status/modo, payload legado e revogado preservados. Desktop e
mobile sem overflow; regressão tabela9 larguras; build/lock e provenance.
NEXT_GATE_STARTED=NAO.
