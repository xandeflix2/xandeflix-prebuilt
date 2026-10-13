# Evidência C11 — hero, busca e navegação — 2026-10-06

Preflight registrado no plano C11_HOME_HERO_VISIBLE_FIX: baseline de 575 arquivos,
HEAD 61ec00902be5d0037adf79c68b3a8624b3a2bd6e, main e origin canônico.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO. Clone C11 independente ativo.
Sem commit, push, PR, backend ou escrita no projeto protegido Xandeflix 2.0.

Suites hero/source-first/category-preview/hero-eligibility/search-related:
PASS. O defeito de busca exact-only foi reproduzido no baseline congelado.
Matrix 603/1999 foi confirmado em metadados públicos. Browser: quatro
variações, detalhe com backdrop 1280×720 e pôster 342×513.

Home phone 390×844: hero 358×537, imagem 780×1170. TV 960×540:
altura 259,1875px, backdrop 1280×720. Categoria aquecida respondeu em
9–12ms no fixture; medição não constitui SLA nem promessa para visita fria.
Episódios em ul/li sem imagens; espera acessível; foco rubi por sombra e
preenchimento; semelhantes da fonte, até 20; botões Início em detalhes/Live.

Browser usou componentes reais em StrictMode, I/O sintético e imagens públicas
TMDB reais. Nenhuma escrita de fonte/backend. Zero erros JS nas verificações
finais. Fixtures e screenshots permanecem em tmp ignorado, sem dados privados.
Diagnóstico de imagem ausente contaminou cache público somente do browser
controlado; corrigido nesse contexto. CORS experimental em imgs causou
regressão visual e foi removido. Imagens remotas voltaram a carregar.

Typecheck, build, lock 22+27 cenários e 9 controles negativos, C9 10/10: PASS.
Java: 116 testes, zero falhas/erros. Revisão React aplicada: hooks,
cancelamento/limpeza, listas limitadas, loading acessível e foco preservado.
Bundle, APK e instalações finais estão no relatório detalhado.

Relatório: [C11_OPTIMIZATION_REPORT_20261006.md](C11_OPTIMIZATION_REPORT_20261006.md).
