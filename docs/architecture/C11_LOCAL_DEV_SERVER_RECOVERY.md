# C97 — Recuperação do servidor local — 2026-10-13

Pedido autorizado: restaurar acesso localhost ao painel gestor após `npm run dev`
abrir porta3000, mas apresentar página branca sem resposta HTTP.

CURRENT_GATE=NONE; ciclo local explícito; NEXT_GATE_STARTED=NAO.
Workspace ativo C:/Xandeflix/xandeflix-prebuilt-c11-main, origin esperado,
main, HEAD61ec00902be5d0037adf79c68b3a8624b3a2bd6e. AGENTS, contratos
arquitetural/execução e Source Data Boundary lidos. Dirty C11 preservado.
Git commit/push/PR não autorizados.

## Escopo e allowlist

- Diagnóstico HTTP local e inspeção somente leitura do processo Vite da porta3000.
- Reiniciar somente esse Vite identificado por PID, executável e caminho do repo;
  servidor substituto persistente no mesmo workspace/porta, logs privados.
- Allowlist de arquivos: este contrato, docs/evidence/C11_LOCAL_DEV_SERVER_RECOVERY.md,
  docs/STATUS.md, docs/EVOLUTION_REPORT.md, docs/DECISIONS.md,
  docs/ERRORS_AND_BLOCKERS.md e tmp/c97-local-dev/**.
- Cache Vite habitual pode mudar como efeito da inicialização. Sem patch funcional,
  mudança de dependências/env, banco, APK, dispositivos ou sessão do gestor.

## Emenda após diagnóstico, antes do patch

Reinício isolado insuficiente: HTML/cliente voltaram, mas main/App/Manager expiram.
Perfil CPU aponta fs.watch/criação de FSWatcher como trabalho dominante. tmp tem
73518 arquivos, principalmente artefatos de testes; não são entradas do app.
Allowlist ampliada somente para vite.config.ts: excluir tmp do watcher e definir
optimizeDeps.entries=['index.html'], evitando descoberta global de HTML de testes.
Não desativar HMR de src, não apagar artefatos/cache, não alterar build/plugin/env.
Lock canônico lido e executado antes/depois; testar respostas de módulos/imports
e confirmar consumo estabilizado. Se falhar, não declarar acesso restaurado.

## Critérios de aceitação

Página inicial, cliente Vite e entrypoint devem retornar HTTP200 dentro do timeout;
imports da aplicação e rota #manager-panel entregues sem erro de transformação.
Confirmar UI real se superfície de navegador disponível; caso contrário registrar
limitação, sem alegar login ou renderização verificados. Preservar HEAD e arquivos
fora da allowlist. Causa inicial comprovada: listener existe, mas requisições de
localhost, IPv4 e IPv6 expiram; motivo interno do travamento ainda não identificado.
