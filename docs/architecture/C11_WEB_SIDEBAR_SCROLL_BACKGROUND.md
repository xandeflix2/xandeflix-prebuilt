# C147 - fundo do menu acompanha rolagem no navegador - 2026-10-17

## Pedido e preflight

Usuario confirmou recuperacao C146 ("DEU CERTO") e forneceu2 screenshots:
no topo fundo acompanha Hero, mas abaixo sidebar preserva cor enquanto
categorias ja estao no fundo neutro. C146 confirmado apenas por relato do
usuario na aba real, nao instrumentacao de pixels pelo agente.

Workspace/top-level C:\Xandeflix\xandeflix-prebuilt-c11-main, Git proprio,
origin https://github.com/xandeflix2/xandeflix-prebuilt.git, main/HEAD
bd7e10c7c069df66328309105b6b210d04c7cf2d. AGENTS/Architecture/Execution/
Activation Lock relidos; auditoria C146 PASS, dirty anterior preservado.
Baseline1173 hashes/copias em tmp/c147-web-sidebar-scroll, antes do patch.
CURRENT_GATE=NONE; ciclo local solicitado, NEXT_GATE_STARTED=NAO.
Sem autorizacao Git/backend/APK/install/reset. Fonte/catalogo/search/player,
parental, identidade, nativo e dependencias fora do escopo.

## Primeira fronteira e especificacao anterior ao codigo

CSS web de C145 usa gradiente proprio do shell, com tamanho100dvh e
background-attachment:fixed. Conteudo usa outro gradiente, limitado ao halo
da imagem e vinculado a pagina. O fundo preso ao viewport explica a cor
remanescente na faixa lateral; nao e nova falha de amostragem C146.
MDN [background-attachment](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/background-attachment)
documenta a diferenca entre fixed e local/scroll.

Patch somente CSS guardado html[data-web-validation=true] e side-nav:
- Remover gradiente independente/fixo do shell, manter fundo neutro.
- Manter header transparente, fixo e os botoes/layout/foco anteriores.
- Estender fundo da pagina immersive-background para esquerda por ::before
  absoluto ancorado na propria pagina e background:inherit. Assim reutiliza
  cores/stops/tamanho/attachment do gradiente real, sem duplicar calculos,
  listeners de scroll ou mudar paleta/hero/algoritmo. Faixa nao intercepta
  eventos e permanece fora da area de conteudo; overflow global existente
  ja recorta pintura que ultrapassa a borda esquerda do viewport.
- Na rolagem do documento, gradiente e faixa lateral deslocam-se juntos;
  abaixo do halo ambos chegam ao mesmo fundo neutro. Voltar ao topo/trocar
  Hero/rota reutiliza a cor atual. Sem cor inventada ou nova requisicao.
- Usar pagina como containing block, sem novo stacking context/z-index
  negativo que esconda o fundo. Nao alterar z-index do header/player/modais.

## Allowlist e aceitacao

src/web/web-runtime.css apenas bloco final do ambient web;
este documento e docs/evidence/C11_WEB_SIDEBAR_SCROLL_BACKGROUND.md;
docs/{STATUS,EVOLUTION_REPORT,ERRORS_AND_BLOCKERS}.md append-only;
helpers/auditoria/logs privados tmp/c147-web-sidebar-scroll e builds usuais.

Nao criar suite que espelha ajuste CSS reversivel. Auditar AST CSS e delta
contra copia previa, demais arquivos por hash; apenas2 docs novos permitidos.
Regressao dos8 testes C145,7 recuperacao C146 e paleta
existente, lock26+27+9/typecheck/build web. Build padrao para isolamento se
necessario; sem cap sync/Gradle/APK. Preservar APK C144 e HEAD/main/index.
CUA apps=[]/browsers=[]; sem contorno por CDP; smoke HTTP nao e renderizacao.
Aceitacao visual na aba: topo com cor, rolar alem do Hero deixa sidebar e
pagina neutros na mesma altura, voltar restaura gradiente. Sem exigir nova
ativacao/limpeza de dados. Relatar limites sem afirmar pixels nao medidos.
