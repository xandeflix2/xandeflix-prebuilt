# C11 — Ordem de Lancamentos e Destaques nas paginas Filmes/Series — ciclo54

2026-10-08, pedido explicito durante QA53: Filmes mostra Lancamentos primeiro,
depois Filmes em Destaque iguais aos da Home; Series inicia com Series em
Destaque. Especificacao antes do codigo. Preflight/baseline728 do ciclo51
continuam validos no clone C11-main/main/origin esperado, HEAD61ec00902be5d0037adf79c68b3a8624b3a2bd6e.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO. Sem catalogo/source/transportes/identidade,
Git/backend/reset ou novo Gate. Escopo visual local autorizado.

- Somente overview Filmes: particionar estavelmente categorias por
  isReleaseCategory existente, exibir cada Lancamentos antes da linha Destaques
  e manter a ordem original das demais abaixo dela. Nao inventar categoria
  Lancamentos se ausente, nao duplicar uma categoria da fonte. Interior da
  categoria Lancamentos conserva source-desc, reader/paginacao/hero atuais.
- Overview Series: linha Series em Destaque antes das categorias de plataforma,
  preservando a ordem canonica das demais. Destaques filmes/series usam os mesmos
  primeiros20 registros/views da Home e preserveOrder, sem novo criterio,
  persistencia, reader integral ou categoria artificial na fonte.
- Destaques com carrossel horizontal e Ver todos reutilizam colecao vertical
  existente HomeCollectionPage e route-state/history. Callback opcional
  onSelectCollection no CatalogBrowsePage e wiring nos dois casosApp; nao
  mudar Home/colecao/resolver. Categorias exclusivas nao ganham linha Destaques
  nem Lancamentos alheios; ID/kind/callbacks e paginacao48 intactos.
- Mesmo comportamento responsivo phone/tablet/Fire, sem novo CSS. Rails20,
  limites de carregamento/previews/capas e motor D-pad53 preservados.

Allowlist adicional: src/ui/pages/CatalogBrowsePage.tsx, src/App.tsx apenas dois
callbacks de navegacao, novo scripts/test-c11-browse-featured-order.mjs;
teste antigo scripts/test-c11-category-rails.mjs apenas binding MediaRail da
nova dependencia (asserts anteriores mantidos). Este plano/evidencia/item54,
quatro memorias, saidas usuais build/sync/APK/tsconfig.tsbuildinfo/tmp ignorado.
Allowlists51/52/53 permanecem para registrar e concluir a entrega em curso.

Aceitacao: componente real verifica ordem Lancamentos/Destaques/outras, mesmas
identidades/ordem da Home, ausencia de duplicatas, case sem Lancamentos/vazio,
series/plataformas e colecao exclusiva sem linhas extras; callbackVer todos,
detail/back retorna ao overview certo. Suite antiga sem relaxar asserts,
typecheck/React checklist/lock/build/assets e install-r auditado no Fire103.
QA fisica da ordem nas duas paginas e D-pad53; Fire107 somente conectado e
identidade confirmada. Samsung mantem ciclo51/52 ate entrega explicita deste
artefato; S23 excluido pelo usuario. Nenhum envio de WhatsApp automatico.
