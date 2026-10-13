# C11 — linhas horizontais de categorias em Filmes e Séries — 2026-10-07

Pedido explícito: páginas de Filmes e Séries devem apresentar uma linha
horizontal por categoria, como o modelo da Home. No canto superior direito de
cada linha, Ver todos substitui as setas e abre a coleção completa em grade com
scroll vertical. Coleção exclusiva da categoria/gênero/plataforma escolhida.
Aplica-se a celular, tablet, TV/Fire e desktop, sem restrição de dispositivo.

## Preflight e proveniência

Workspace/top-level independente C:\Xandeflix\xandeflix-prebuilt-c11-main,
origin https://github.com/xandeflix2/xandeflix-prebuilt.git, main, HEAD
61ec00902be5d0037adf79c68b3a8624b3a2bd6e. AGENTS, Architecture, Execution,
Source Boundary e lock lidos. Baseline dos hashes e arquivos anteriores em
tmp/c11-category-rows-20261007, preservando dirty prévio. Lock PASS antes de
editar. CURRENT_GATE=NONE; ciclo local explícito; NEXT_GATE_STARTED=NAO.
Git/backend/reset não autorizados; APK e update-r nos três continuam dentro
dos pedidos de instalação anteriores, com identidade/dados preservados.

## Especificação anterior ao código e allowlist

- src/ui/pages/MoviesPage.tsx e SeriesPage.tsx: delegar à apresentação comum
  de categorias por tipo. Novo CatalogBrowsePage.tsx compartilha o comportamento
  necessário nos dois tipos, sem duplicar lógica. Hero e regras responsive
  existentes conservados. Overview exibe todas as categorias canônicas desse
  tipo em faixas com até20 itens; não mantém filtro por chips/grade geral.
- src/ui/components/MediaRail.tsx: onViewAll opcional. Se presente, substituir
  setas por botão focusable Ver todos com nome acessível da categoria. Touch,
  roda/trackpad e D-pad continuam navegando horizontalmente nos cards. Default
  de Home/Recentes/Semelhantes permanece; este ciclo muda as páginas solicitadas.
- AsyncCategoryRail.tsx: repassar Ver todos inclusive no cabeçalho em loading.
  Opt-in loadWhenVisible para novas páginas, com primeira dobra/antecipação
  por IntersectionObserver, fila de2 e cancelamento ao desmontar. No novo modo,
  leitor paginado existente com count:false/snapshot/signal e limite20; não
  scanear todos os conteúdos para formar uma linha. Home mantém default.
- src/App.tsx: nas views movies/series, itemId da rota identifica a categoria
  selecionada (identificador opaco, nunca URL). Ver todos navega no histórico
  existente; Voltar físico/web retorna coleção→overview e detalhe→coleção.
  Não criar roteador/dependências nem modificar boot/ativação/sync/C9.
- Novo componente de browse mantém useSegmentedBrowse entre overview e coleção,
  permitindo prefetch da página48 ao focar Ver todos. Coleção usa título real
  e ID exato, kind movies/series explícito, grade vertical/paginação automática
  existente. Gêneros/plataformas vêm apenas do catálogo da fonte: não inventar
  agrupamentos nem misturar tipos/categorias com nomes parecidos.
- Randomização estável durante a visita e ordem de Lançamentos preservadas.
  Troca de snapshot/remount substitui a seleção local; nada grava no catálogo.
  Cabeçalho/foco/scroll inicial restaurados ao mudar categoria; enriquecimento
  e chegada da próxima dobra não devem causar salto ao topo.
- src/index.css: estilo restrito ao botão Ver todos/layout novo. Manter compact
  covers, hero tablet/Fire/telefone, foco glow, barras e detalhamento atuais.
- src/ui/hooks/useDpadNavigation.ts: extensão isolada às linhas com Ver todos.
  Up no card alcança o botão da própria linha; Down no botão volta aos cards,
  Up no botão vai à linha anterior/hero. Fast paths e comportamento das linhas
  antigas permanecem. Botão precisa ser alcançável por controle físico.
- scripts/test-c11-category-rails.mjs: tipo/categoria exatos, rota/back/dedup,
  paginar além48, preview20, ordem Lançamentos, componentes reais, cancelamento.
- Este contrato, evidência correspondente, docs/STATUS.md, DECISIONS.md,
  ERRORS_AND_BLOCKERS.md, EVOLUTION_REPORT.md, relatório cumulativo item48;
  harnesses ignorados, saídas usuais web/Android/APK.

Não alterar storage/source, schema, serviços canônicos, engine, metadata TMDB,
identidade/chave, ativação, C9/Cast/PiP/Android ou regras de sync. A coleção
completa significa todos os itens daquela categoria na geração local ativa,
carregados progressivamente, sem limite final igual à faixa20.

## Aceitação

Testes/lock/typecheck/build/sync/Java PASS. Ver todos visível à direita, ausência
das setas nas faixas novas; overview sem grid geral; coleção sem carrossel de
chips, com grid vertical e loading automático. Categoria correta nos dois
tipos/plataformas; Back segue histórico, sem fechar Activity do Fire. Dados de
linha limitados e tarefas stale não atualizam UI. QA físico nos três, mesmo
package/assinatura/standalone/assets e install-r com hashes privados e
firstInstallTime preservados. Relatar limites dos testes; nenhum SLA novo.

Esclarecimento de instalação do usuário durante o ciclo: concluir somente no
Fire Stick e tablet. S24 desconectado fica fora da instalação/conferência física
deste APK; arquivo standalone disponível para atualização manual dos demais.
Steering posterior: usuário informou S24 conectado novamente. Incluído também
no update-r e QA físico deste ciclo, após confirmar serial/modelo no ADB.
O teste histórico test-c11-catalog-completeness contém regex de filter-chip
que corresponde à UI substituída e outros regex já obsoletos no baseline.
Não relaxar esses checks silenciosamente nem declarar a suite inteira PASS;
a cobertura funcional da nova apresentação ficará no teste deste ciclo,
preservando as verificações canônicas existentes de dados e o lock obrigatório.
