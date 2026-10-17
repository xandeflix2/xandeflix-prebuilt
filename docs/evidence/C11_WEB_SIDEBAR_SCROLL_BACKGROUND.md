# C147 - sidebar e pagina com o mesmo fundo durante rolagem - 2026-10-17

Spec anterior ao codigo: docs/architecture/C11_WEB_SIDEBAR_SCROLL_BACKGROUND.md.
Preflight no clone ativo c11-main/main, origin esperado, HEAD
bd7e10c7c069df66328309105b6b210d04c7cf2d. Auditoria C146 PASS antes do ciclo;
baseline1173 arquivos/copias em tmp/c147-web-sidebar-scroll. AGENTS/Architecture/
Execution/Activation Lock relidos; sem colisao ou dirty desconhecido.

## Evidencia e fronteira

Usuario confirmou C146 na aba real ("DEU CERTO") e relatou nova divergencia
ao rolar para categorias. Duas imagens mostram topo/hero com cor e sidebar
persistindo na mesma cor abaixo, com pagina ja neutra. Evidencia fisica e
relato do usuario, nao execucao de navegador pelo agente.

CSS previo de C145 tinha gradiente independente no shell,100dvh e
background-attachment:fixed; pagina usa ambient/base/bg-dark com tamanho do
halo e attachment local. Gradiente preso ao viewport explica a persistencia;
[MDN background-attachment](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/background-attachment)
documenta esse comportamento. Nao foi alterada a leitura de cor que funcionou.

## Mudanca e isolamento

Unico arquivo de producao alterado: src/web/web-runtime.css, bloco ambient
final. Shell volta a fundo neutro sem gradiente proprio. Pagina imersiva vira
containing block e seu ::before absoluto estende background:inherit para
esquerda, por tras do header transparente. Altura/cor/stops/tamanho/attachment
vinculados ao fundo original, no mesmo sistema de coordenadas da pagina.
Faixa com pointer-events:none, sem z-index negativo/novo stacking context.
Posicao e estilos do header/botoes/foco preservados. Sem scroll listener,
timer, canvas/probe, requisicao ou duplicacao de algoritmo de cores.

Seletores novos/alterados exigem html[data-web-validation=true] e side-nav.
Hook/paleta/cache recuperacao C146, CSS shared/native, Android, carregamento,
source/catalogo/search/playback/parental/ativacao intactos. Campo diagnostico
SHELL_GRADIENT agora pode ser NAO por projeto: fundo esta na pagina e na sua
faixa herdada. Nenhum APK/cap sync/Gradle/install/storage/reset/backend/Git.

## Verificacoes

- Lock antes do patch26 ativacao+27 promocao+9 negativos PASS.
-8 testes C145 e7 recuperacao C146, inalterados, PASS. Regressao original da
  paleta PASS. Nenhum teste novo que replique este ajuste CSS reversivel.
- Auditoria AST/delta: somente bloco final ambient web mudou; resto CSS e
  header exatamente iguais. Demais1173 arquivos por hash,3 memorias append,
 2 docs novos permitidos; HEAD/main/index e APK C144 preservados.
- Smoke HTTP200 do CSS atualizado em localhost3000; nao equivale a pixels.
- CUA apps=[]/browsers=[]; sem alternativa CDP. Conferencia solicitada na aba
  ativada: rolar ate Hero sair e voltar ao topo. Resultado visual pendente.

Build web/lock/typecheck e auditoria final registrados no fechamento abaixo.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.

## Fechamento tecnico

web:build PASS (lock26+27+9, tsc e Vite31.83s). Avisos de externalizacao Node,
imports dinamicos/estaticos e chunks grandes ja existentes; nao acrescentados
modulos/dependencias. Auditoria final PASS:1173 baseline/1169 preservados,
somente CSS web e3 memorias alterados,2 docs novos, sem outras mudancas.
APKC144/HEAD/main/index preservados. Logs e audit/smoke.json privados no ciclo.
Nenhuma nova suite automatizada de CSS nem build/APK nativo necessario neste
patch exclusivamente guardado web. Resultado visual da rolagem ainda pendente
do retorno solicitado ao usuario; recuperacao C146 ja confirmada por ele.

Confirmacao visual posterior C147: usuario respondeu "DEU CERTO" apos rolar
alem do Hero e voltar ao topo na aba real. Relato homologa apenas o efeito
visual solicitado; nao e medicao instrumentada pelo agente. Ciclo C147
concluido; proximo pedido de guia Live tratado em escopo local separado.
