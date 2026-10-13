# C11 — Episodio selecionado/continuar e capas neon — ciclo56

2026-10-08 America/Sao_Paulo. Usuario apresentou referencia de linha de episodio
inteira destacada e Continuar assistindo enquanto incompleto; pediu depois
mesmo contorno vermelho neon dos botoes nas capas selecionadas. C55 investigacao
concluida nas primeiras fronteiras: trecho Luke falha tambem em outro app,
AirScreen nao inicia motor/nao conecta relay; sem alegar playback universal PASS.
Preflight/identidade C11-main/main/origin/HEAD61ec00902be5d0037adf79c68b3a8624b3a2bd6e
e baseline728 mantidos. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO. Spec antes do codigo.

## Escopo

- Lista de episodios compartilhada phone/tablet/Fire: destacar linha inteira
  por foco D-pad/teclado/touch e selecao atual. Preferir ultimo episodio assistido
  da serie/identidade atual como selecao inicial, sem trocar temporada/scroll.
- Ler WatchHistory existente, fingerprint da serie canonica emreadModel e
  savedPosition por episodeId. Mostrar Continuar assistindo/acao Continuar
  somente se posicao positiva e incompleta. Finalizados/nao iniciados/ID reciclado
  ou fingerprint diferente nao ganham aviso. Atualizar via subscription/sync
  nativo local existente, cleanup; nenhum novo store/campo de historico.
- Callback playEpisode original/autoridade/C9/source/resume exato permanecem.
  Selecao transitoria apenasUI, reset ao mudar serie. Um foco por episodio;
  nao tornarli um segundo alvo ou reproduzir ao tocar fora do botao.
- Capas MediaCard focadas usam mesmo outline/glow vermelho dos botoes, com
  seletor especifico sem deslocar dimensoes, zoom ou animacao extra. Rails/grid/
  relacionados/recentes e filmes/series responsivos. Nao modificar capas/cache.

Allowlist56: src/ui/pages/SeriesDetailPage.tsx; src/index.css; novo
scripts/test-c11-episode-continue-row.mjs; este contrato e evidencia
C11_EPISODE_CONTINUE_ROW_AND_NEON_CARD_FOCUS.md; item56/quatro memorias;
build/sync/APK/tsbuild/tmp ignorado. Allowlists51–55 mantidas para registros finais.
Sem backend/Git/reset/rotacao/novoGate/S23. Atualizar -r S24/tablet/Fire0.106
com assinatura/package/hash/dados auditados, Fire107 somente conectado.

Aceitacao: render real com WatchHistory real testa pausa/incompleto/conclusao,
episodio correto, fingerprint/serie diferentes, foco/selecionar e cleanup;
callback original intacto. CSSstyle real QA nos aparelhos mostra glow de card
igual ao botao, sem dimensoes mudadas e row inteira selecionada. Typecheck,
suites pertinentes/lock/build/sync/assets/certificado/Java e install-r preservado.
QA sem semear historico real nem encobrir falhas da fonte/receptor. Nao enviar
WhatsApp, avaliar/favoritar ou compartilhar automaticamente.

Emenda anterior ao ajuste do harness: scripts/test-c11-detail-tablet-tv.mjs
recebe apenas o port WatchHistory controlado exigido pela nova assinatura da
pagina real. Assertions anteriores permanecem intactas; nao relaxar criterios.

## Emenda56 — pedido posterior de D-pad em series pesquisadas

Usuario relatou episodios->hero inacessivel em algumas series no Fire107,
possivelmente desatualizado. Integra este ciclo de selecao/episodios, sem iniciar
outro Gate. Allowlist adicional antes de codigo/teste: src/ui/hooks/useDpadNavigation.ts
e scripts/test-c11-fire-dpad-rail-return.mjs. Testar primeiro o algoritmo atual.
Navegacao vertical wide deve seguir estrutura: hero->abas->temporadas (quando
presentes)->episodios em ordem, caminho inverso ate hero inteiro. Nao depender
de distancia horizontal variavel por badge Continuar/sinopse/numero temporadas.
Preservar callbacks/Enter, esquerda/menu/restauro, tabs Right/Left locais, modais,
foco unico e listas montadas; nenhum click/temporada/play automatico por setas.
Sem temporadas: abas->primeiro episodio. Vazio/carregando/desabilitado nao cria
alvo inexistente. Centralizar linha inteira ao navegar episodio; hero Fire
restaurado pelo mecanismo existente. Teste real do hook com wrappers/selecao/
colunas assimetricas, sem/varias temporadas, disabled/loading/modal/regressoes.
QA ADB direcional em serie aberta por busca no Fire conectado;107 exige
conexao/modelo/hash e install-r preservado, nao presumir atualizado por1.0.
