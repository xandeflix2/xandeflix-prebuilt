# C117 — Filmes/Séries mobile com hero abaixo do menu

Pedido visual do usuário em 2026-10-15: retirar heading Filmes/Séries e total
de conteúdos acima do hero no celular; preservar marca e ações do Header.
Preflight no clone ativo C11-main/main/origin canônicos, HEAD
0f68f169f7728fae17c8311832b7643629e97a02. AGENTS/Architecture/Execution/Lock
lidos; baseline privado tmp/c117-mobile-browse-header/baseline.json preserva
patches anteriores C107–C116. CURRENT_GATE=NONE; CURRENT_LOCAL_CYCLE=C117;
NEXT_GATE_STARTED=NAO. Sem Git/backend/install/reset autorizados.

## Especificação anterior ao CSS

Até600px, ocultar somente .page-header filho direto de .movies-page e
.series-page, incluindo categorias com hero, como já ocorre em tablet/TV/
quadrados. display:none remove título/quantitativo e espaço correspondente.
Categoria inexistente mantém aviso/heading (.category-collection-page--missing).
Marca/Home/Voltar/Configurações, transparência C116, hero/conteúdo/metadados/
botões, menu inferior/foco/navegação e dimensões intactos. Outras páginas e
perfis maiores não recebem regra nova. Sem alterar TSX/dados/contagem real,
catálogo/search/source, ativação, player ou demandas anteriores.

Allowlist: src/index.css; este contrato;
docs/evidence/C11_MOBILE_BROWSE_HEADER.md;
docs/{STATUS,EVOLUTION_REPORT,ERRORS_AND_BLOCKERS}.md;
tmp/c117-mobile-browse-header e saídas usuais ignoradas build/sync/Gradle/APK.
Inspeção isolada com Header/CSS reais e marcação de browse sintética, sem novo
teste permanente para ajuste visual reversível. Verificar ambas páginas e
larguras móveis, ausência de espaço vazio, hero/ações/Heading de outra página
e aviso de categoria ausente; build/lock26+27+9, APK/assinatura/assets/allowlist.
APK local C117 recuperável para revisar, mesma versão/assinatura C116; sem
instalação/publicação/Git ou próximo Gate. QA física não presumida.
