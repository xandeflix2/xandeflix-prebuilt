# C97 — Servidor local recuperado — 2026-10-13

Preflight canônico registrado em [spec](../architecture/C11_LOCAL_DEV_SERVER_RECOVERY.md)
e tmp/c97-local-dev/baseline.json, 961 hashes; HEAD/origin/main preservados.

## Falha e correção

Vite original PID1100 escutava porta3000 sem responder: HTML, cliente e main
expiraram em6s em localhost/IPv4/IPv6. Reinício simples recuperou HTML/cliente,
mas main/App/Manager expiraram em15s. Perfil CPU do servidor revelou fs.watch,
FSWatcher e criação de watchers como trabalho dominante. tmp tinha73518 arquivos
visíveis ao rg na medição, incluindo perfis de navegador de testes.

Patch mínimo em vite.config.ts: watcher ignora tmp e optimizeDeps.entries aponta
somente index.html. Não apaga artefatos, não desativa HMR de src, não muda env,
plugins, dependências, build do APK, fonte, banco, autenticação ou dispositivos.

Servidor final normal, sem inspector, PID12652, porta3000, iniciou em821ms.
Quinze requisições HTTP (HTML/cliente/main/App/Manager, três endereços locais)
retornaram200. Graph real dos imports servidos:301 módulos, zero falhas HTTP.
Logs finais sem erro. Lock antes/depois PASS; promoção27/27; nenhum APK gerado.
CPU final15.92s acumulados e working set160178176 bytes após compilação inicial;
medição observacional, não SLA. Endpoints diretos: /#manager-panel.

## Limites da verificação

Nenhuma superfície de navegador habilitada em CUA; tentativa Chrome indisponível.
Entrega de módulos certificada, mas renderização física, sessão/login e dados do
gestor não foram testados. Usuário deve recarregar a aba anterior para usar novo
servidor. Nenhum bypass de login ou acesso a credenciais realizado.

Harness inicial misturou require/top-level await e foi corrigido para ESM; rg
com wildcard Windows literal foi corrigido para filtro -g. São falhas do diagnóstico,
não da aplicação. Evidências privadas: http-after-restart.json, cpu-stack.json,
http-final.json, import-graph.json e logs em tmp/c97-local-dev.

CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem commit/push/PR/backend/instalação.
