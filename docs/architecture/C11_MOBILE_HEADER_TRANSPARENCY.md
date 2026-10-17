# C116 — cabeçalho mobile transparente

Autorização: pedido visual do usuário em 2026-10-15 para mostrar a cor do
topo da página também atrás da marca/menus do celular. Preflight: clone C11
ativo independente, main/origin canônicos, HEAD0f68f169f7728fae17c8311832b7643629e97a02;
AGENTS/Architecture/Execution/Activation Lock lidos, patches C107–C115 conhecidos
preservados por baseline privado tmp/c116-mobile-header/baseline.json.
CURRENT_GATE=NONE; CURRENT_LOCAL_CYCLE=C116; NEXT_GATE_STARTED=NAO.

## Especificação anterior ao código

Somente CSS da versão mobile (até600px, sem perfil tablet/TV/quadrado/menu
lateral): tornar background do Header transparente e borda inferior invisível
sem alterar geometria, marca, foco, cliques ou alvos. Estender ao shell atrás
do cabeçalho a variável --navigation-ambient já produzida pelo hero, numa
faixa superior limitada de96px + safe area. Não basta transparência sobre o
shell escuro. Página/hero mantêm seu gradiente e limite de halo existentes;
não colorir categorias inferiores. Sem variável disponível, usar fundo escuro.
Sem alterar menu inferior, outras telas/perfis, Android/status bar, hooks,
comportamento, fonte/catálogo/ativação/player ou demandas C114/C115.

Allowlist: src/index.css; este contrato;
docs/evidence/C11_MOBILE_HEADER_TRANSPARENCY.md;
docs/{STATUS,EVOLUTION_REPORT,ERRORS_AND_BLOCKERS}.md;
tmp/c116-mobile-header e saídas usuais ignoradas build/sync/Gradle/APK.
Sem novos testes permanentes para alteração visual reversível. Inspeção em
browser isolado com CSS/Header reais e cores sintéticas, verificar paleta,
geometria/alvos/scroll/fallback e exclusão dos outros perfis. Build/prebuild
lock26+27+9 obrigatório; APK C116 local recuperável para revisão, mesma versão
e assinatura C115. Não instalar/publicar/commitar/push/reset/backend.

Aceitação: Header transparente com cor ambiente visível atrás e sem linha;
celular mantém navegação; fallback escuro ao limpar variável; tablet/TV/menu
lateral/quadrado inalterados. Browser/build/lock/assinatura/assets/allowlist
PASS. QA de hardware não presumida; próximo Gate não iniciado.
