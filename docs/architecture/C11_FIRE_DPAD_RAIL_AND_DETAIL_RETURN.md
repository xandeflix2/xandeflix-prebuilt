# C11 — D-pad entre carrosseis e retorno ao hero de detalhes — ciclo53

2026-10-08. Regressao relatada apos a entrega EC412: Fire103 nao desce de
Recentes na Home e nao sobe de Titulos semelhantes ao hero de filme.
Preflight repetido no clone C11-main: origin esperado, main, HEAD
61ec00902be5d0037adf79c68b3a8624b3a2bd6e. Baseline privado dos ciclos51/52
continua preservado. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO. Sem Git,
backend, reset, uninstall ou alteracao de catalogo/source/playback.

## Especificacao anterior ao codigo

- Navegacao vertical de cards usa a ordem dos carrosseis montados no mesmo
  main, atraves de wrappers RecentTitles/home-rails-container. Preservar o
  indice da coluna, limitar ao tamanho do destino e ignorar linhas sem cards.
  Consulta limitada aos carrosseis do main durante a tecla; sem varredura
  geometrica global, timers, prefetch ou alteracao do carregamento das capas.
- Subida no primeiro carrossel conserva Ver todos quando presente. Ao subir
  desse botao, buscar a linha anterior montada ou o hero do mesmo main.
  Nos detalhes sem Ver todos, subir diretamente para a primeira acao do hero
  atual (.detail-actions), sem selecionar o menu lateral ou outro hero.
- Foco em controles do hero de detalhes Fire usa a mesma rolagem para o inicio
  do hero completo ja adotada nos heroes Home/Filmes/Series. Manter um unico
  requestAnimationFrame, invalidacao de foco tardio e cleanup. Voltar continua
  acima do hero e acessivel por ArrowUp; modais conservam seu tratamento proprio.
- Preservar navegacao horizontal, lateral, grids, filtros, inputs, modais,
  auto-repeat, restauro do menu e layouts phone/tablet. Nenhuma refatoracao.

## Allowlist e verificacao

Somente src/ui/hooks/useDpadNavigation.ts e novo
scripts/test-c11-fire-dpad-rail-return.mjs; especificacao/evidencia deste ciclo,
item53 do relatorio e STATUS/DECISIONS/ERRORS_AND_BLOCKERS/EVOLUTION_REPORT.
Saidas usuais de build/sync/APK/tsconfig.tsbuildinfo e tmp ignorado.
Allowlists51/52 continuam validas para registrar a entrega anterior.

Testar o hook real com DOM de wrappers, coluna e linha vazia, duas direcoes,
Ver todos e subida ao hero de filme; isolamento entre mains, controles
desabilitados, horizontal/menu e rolagem completa de detalhes Fire. Reproduzir
os dois bloqueios no APK anterior e repetir com teclas ADB no Fire103 corrigido.
Executar testes relacionados, typecheck e lock de ativacao antes/depois/build.
Instalar com hashes privados completos e firstInstallTime preservados.
Fire107 atualizado somente apos conexao/identidade confirmadas; S23 excluido
por pedido explicito. Sem promessa de correcoes permanentes de fonte/capas.

Emenda anterior ao patch de isolamento: dialog de avaliacao/trailer e
player-overlay podem estar aninhados no hero. O novo restauro do hero completo
nao deve rolar o fundo ao focar esses controles; excluir esses escopos do novo
seletor/focusin. Teste real do hook com dialog filho exige zero rolagens do hero
em foco programatico. Allowlist permanece hook/teste deste ciclo. Demais
tratamentos de modal e navegador nao mudam.
