# C143 - continuidade da inicializacao durante preferencias locais - 2026-10-17

## Pedido, preflight e proveniencia

Usuario reporta startup visual -> shell vazio com Lendo preferencias deste
aparelho -> startup visual com imagens. Remover a tela intermediaria sem
eliminar leitura ou protecao parental. Corrigir UI e entregar APK de teste
recuperavel para os mesmos dispositivos, sem instalar ou acessar seus dados.

Preflight read-only: clone ativo C:\Xandeflix\xandeflix-prebuilt-c11-main,
origin https://github.com/xandeflix2/xandeflix-prebuilt.git, main, HEAD
bd7e10c7c069df66328309105b6b210d04c7cf2d. Dirty C133-C142 conhecido,
auditoria C142 PASS. AGENTS/Architecture/Execution/Source Boundary/Activation
Lock lidos; hashes e copias anteriores em tmp/c143-startup-preferences.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO. Sem Git/backend/reset/install.

## Especificacao anterior ao codigo

- Iniciar parentalControl.load no effect de montagem de App, em paralelo
  com inicializacao existente, sem await na ativacao/catalogo ou mudanca de
  estados de boot. Store existente deduplica chamadas; nao modificar store.
- AppShell enquanto status loading deve retornar o StartupLoadingScreen
  existente antes do menu/cabecalho, mantendo a apresentacao visual de startup.
  Nao renderizar filhos/catalogo antes da leitura local terminar.
- Eliminar somente o fallback textual da foto. Status error continua
  bloqueando catalogo, com acesso as configuracoes conforme guardas atuais;
  ready/unconfigured preservam comportamento e politica atuais. PIN/PUK,
  regras, bloqueio de tentativas, autoridade e permissoes nao mudam.
- Nenhum timer artificial, segunda sincronizacao, rede nova, leitura de
  credenciais, migracao de dados ou refactor. Imagens continuam carregando
  pelos servicos e caches atuais. Preservar telas de erro/offline/ativacao.
- Entregar APK1.0.28/code28 de mesmo package/assinatura; somente incrementar
  as duas constantes de versao Gradle. APK anterior imutavel.

## Allowlist e aceitacao

src/App.tsx (somente effect de leitura local antecipada);
src/ui/components/AppShell.tsx (loading visual exclusivo e remocao do texto);
android/app/build.gradle (somente2 constantes);
scripts/test-c143-startup-preferences.mjs (portas sinteticas de render/lifecycle,
leitura pendente/erro/deduplicacao; sem controlar navegador por alternativa);
este documento e docs/evidence/C11_STARTUP_PREFERENCES_CONTINUITY.md;
docs/{STATUS,EVOLUTION_REPORT,ERRORS_AND_BLOCKERS}.md append-only;
helpers/logs privados tmp/c143-startup-preferences e saidas usuais de build/APK.

Reproduzir antes e testar depois a ausencia de menu/filhos durante loading,
transicao para ready/unconfigured e erro fechado; demonstrar inicio antecipado
e leitura unica concorrente usando store real com storage sintetico atrasado.
Lock antes/depois, regressao parental relevante, builds web/padrao e revisao
React; cap sync/Gradle, assinatura/package/HTTPS/assets/CSS e recursos nativos
conferidos. Auditoria inversa dos dois patches deve preservar o restante do
App/AppShell e source/catalog/search/player/parental por hashes. Sem relaxar
testes existentes. CUA se houver superficie; limites fisicos declarados.
