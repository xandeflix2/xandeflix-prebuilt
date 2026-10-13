# C84 — Licença vazia oculta após transferência — 2026-10-12

Pedido e especificação prévios: `docs/architecture/C11_LICENSE_EMPTY_ROWS.md`.
Preflight do clone independente C11/origin/main/HEAD
61ec00902be5d0037adf79c68b3a8624b3a2bd6e e contratos lidos. Dirty C11 preservado;
baseline SHA256 de902 arquivos. Nenhuma alteração em backend, identidade, fonte,
cadastros reais, Git ou APK. Gate apenas C84; NEXT_GATE_STARTED=NAO.

## Diagnóstico e resultado

A RPC de vínculo existente transfere license_devices para a licença de destino
e registra previousLicenses na auditoria. Não cria nova licença/conta e não apaga
a licença de origem. A tabela renderizava todas as licenças, incluindo essa origem
sem dispositivos. A origem não participa do uso do secundário após a transferência.

AdminLicensesView agora oculta por padrão lista explicitamente vazia com
activeDeviceCount zero. Aparelhos permanecem juntos na linha do principal após
refresh/reload. Filtro opcional Exibir licenças sem aparelhos permite consultar e
administrar contratos sem aparelhos; não altera banco. Payload sem informação de
dispositivos, contagem positiva inconsistente ou aparelho revogado são preservados
para evitar falso vazio. Busca/status/modo combinados; cabeçalho conta linhas exibidas.
Desktop continua tabela, mobile mantém layout existente e ações/permissões iguais.

## Verificação

- Browser com componente real, respostas sintéticas: antes/depois da transferência,
  secundário junto do principal, origem vazia oculta, reload, opt-in/opt-out,
  busca/status/modo, contagem, legado e revogado preservados. Desktop1507/mobile390
  sem overflow/erro runtime PASS. Captura mobile inspecionada.
- Regressão tabela em9 larguras1920/1507/1461/1024/800/601/600/390/360:
  colunas/seis ações, sem overflow, tabela desktop/cards mobile, Escape/foco e
  escopo ADMIN PASS (marcador histórico C80 do harness reutilizado).
- Console C78 quatro grupos PASS; TypeScript/Vite build PASS com Activation Lock
  prebuild obrigatório. Lock antes do patch também PASS, catálogo27/27 e controles
  negativos. Avisos preexistentes Vite preservados; nenhuma nova falha detectada.
- Provenance somente allowlist, HEAD preservado e git diff --check PASS.

Logs/capturas/reports privados em tmp/c84-license-empty-rows. Nenhuma consulta ou
mutação remota foi necessária. Auditoria/comprovantes/fontes/contratos existentes
permanecem no banco; esse ajuste somente remove as linhas vazias da visão padrão.
