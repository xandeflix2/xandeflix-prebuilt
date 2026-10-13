# C79 — Licenças sem corte horizontal

Pedido autorizado em 2026-10-12: manter toda a linha de licença visível,
incluindo todos os botões de ação, nas larguras das imagens enviadas.
Refinamentos do mesmo pedido: usar a largura total disponível da tela e manter
o formato de tabela no desktop; blocos somente no mobile (até 600 px).

## Preflight e escopo

Workspace independente C11: `C:/Xandeflix/xandeflix-prebuilt-c11-main`.
Origin: `https://github.com/xandeflix2/xandeflix-prebuilt.git`; branch `main`;
HEAD `61ec00902be5d0037adf79c68b3a8624b3a2bd6e`. Estado cumulativo dirty
preservado; baseline privado SHA-256 anterior a este patch, sem arquivos .env.
AGENTS, Architecture Contract, Execution Contract e Source Data Boundary lidos.
Gate ativo: NONE; patch local C79 autorizado pelo pedido direto. Nenhum próximo
Gate, commit, push, PR, APK ou alteração remota autorizado/iniciado neste ciclo.

Allowlist: este documento; `docs/evidence/C11_LICENSE_TABLE_RESPONSIVE.md`;
`docs/STATUS.md`, `docs/EVOLUTION_REPORT.md`, `docs/DECISIONS.md`,
`docs/ERRORS_AND_BLOCKERS.md`; `src/debug/manager/AdminLicensesView.tsx`;
`src/debug/manager/AdminLicensesView.css`; `src/debug/manager/ManagerPanelPage.tsx`
(somente remover teto de largura); `tsconfig.tsbuildinfo` se recompilado.
Fixtures e evidências brutas ficam em `tmp/c79-license-layout/`, ignorado pelo Git.

## Critérios de aceitação

- Todos os campos existentes continuam presentes, sem truncamento ou perda.
- Tabela ajusta colunas/textos à largura do painel; ações quebram em linhas
  mantendo tamanho mínimo de 36 px, nomes acessíveis e handlers atuais.
- Desktop permanece tabela em qualquer largura; somente no mobile até 600 px
  cada licença vira um bloco com rótulos dos campos.
- Remover o teto interno de 1400 px do painel para ocupar toda largura disponível.
- Não exigir rolagem horizontal para consultar cliente e ações da mesma linha.
- Permissões MASTER/ADMIN, confirmação destrutiva, fontes e APIs preservadas.
- Conferir o componente real com sidebar, sete ações, textos longos e vários
  dispositivos em desktop (1461/1507 px), tablet e celular, usando dados fictícios.
- Build e lock canônico aprovados; auditoria de allowlist sem divergências.
