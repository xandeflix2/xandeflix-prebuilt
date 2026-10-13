# C11 — fundo imersivo conforme artwork — evidência

test-c11-artwork-palette.mjs: PASS para cores dominantes, transparência,
extremos preto/branco, contraste branco mínimo 7:1, SecurityError, amostra
24×24 e cache de 48 paletas. Hook observa somente imagem principal
carregada e limpa o tema ao trocar item ou sair da página.

Browser com JPEGs públicos reais servidos localmente confirmou o brilho
rgb(84,71,40) e a troca para rgb(28,28,28), representando arquivo same-origin
do cache nativo. Detalhe aplicou base rgb(34,29,18). Sem nova API/download
para amostragem e sem erros JS nesse teste.

Experimento de crossOrigin em imagens exibidas causou falha de carregamento
e foi integralmente removido. Browser verificou novamente imagem remota
vertical 780×1170 e detalhe Matrix com backdrop 1280×720/pôster 342×513.
Canvas bloqueado por CORS conserva fundo neutro; não quebra a imagem.
A leitura de arquivos locais do cache Android segue integrada, mas sua
observação no aparelho físico permanece pendente.

Transição de 700ms respeita reduced-motion. Paletas ficam somente em RAM.
Screenshots locais de amostragem usam imagem de fixture; não certificam
a correspondência entre essa imagem simulada e o título do detalhe.
Não usar esses screenshots como prova de metadados reais da obra.

Entrega:
[C11_OPTIMIZATION_REPORT_20261006.md](C11_OPTIMIZATION_REPORT_20261006.md).
