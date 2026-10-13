# C11 — Abas internas e trailer em modal no tablet/TV — ciclo51

2026-10-08. Pedido explícito: página interna da série no tablet/Fire com ações
Avaliar/Favoritos/Compartilhar e, abaixo, abas Episódios/Títulos semelhantes;
filmes e séries com botão de trailer abrindo player em modal. Transmitir somente
ícone junto de Voltar no topo do tablet, ausente na página interna Fire.

Preflight read-only: workspace/top-level independente C11-main, main/origin
xandeflix2/xandeflix-prebuilt, HEAD61ec00902be5d0037adf79c68b3a8624b3a2bd6e.
AGENTS, Architecture/Execution/Source Boundary/lock lidos. Estado dirty anterior
conservado; baseline SHA256 privado antes do patch. CURRENT_GATE=NONE, ciclo
visual local autorizado; NEXT_GATE_STARTED=NAO. Git/backend/reset/uninstall,
rotação de identidade e alterações em fonte/transportes/C9 não autorizados.
Atualizações recuperáveis e QA limitada do package próprio nos alvos tablet
SM-X610/RX2X301Q3KY e Fire103/AFTSSS, Fire107/AFTSS, já autorizados na sessão.
Sem operar outros aplicativos ou fotografar telas fora do foreground próprio.

## Especificação anterior ao código

1. Preservar detalhes, hero/poster/sinopse e callbacks existentes. Ações do
   conteúdo dentro do hero, com Assistir primeiro no filme e trailer em ambos.
   Retirar duplicação Voltar/Início/Cast abaixo da sinopse não-phone. Voltar
   permanece no toolbar existente do shell; acrescentar Cast iconOnly somente
   quando tablet e rota movie-detail/series-detail. Phones mantêm layout atual.
   Reservar altura/padding do toolbar no hero para não sobrepor conteúdo;
   controles alinhados e responsivos sem dimensões rígidas que cortem sinopse.
2. Não-phone série: reutilizar SeriesPersonalActions/store/share e fingerprint
   canônico. Abas com Episódios inicialmente ativo; painel único mostra somente
   episódios ou relacionados. Temporadas/Assistir/cotas/resolver/retomada
   existentes intactos. Falha de episódios tem retry existente. Tablist/tabpanel
   identificados, roving tabindex e setas esquerda/direita com preventDefault
   para evitar duplo tratamento pelo D-pad global. Relacionados montado só na
   aba selecionada, preservando rail/cancelamento próprios.
3. Botão Assistir trailer abre dialog modal imediatamente; enriquecer só o
   título atual por serviço público TMDB existente, com chave de identidade e
   cleanup ignorando resultado tardio. Nenhuma playlist/source/credencial usada.
   Estado buscando/indisponível/erro sem substituir trailer por outro conteúdo.
   Reutilizar SeriesTrailer no modal com autoplay e geometria relativa à
   viewport, sem scrollIntoView da página nem limite do header lateral Fire.
4. PublicTrailer existente mantém inline restrito a phone. Novo modo explícito
   modal permite tablet/TV com videoId/sessionId/bounds sanitizados existentes;
   modo desconhecido falha fechado. WebView pública separada sem bridge,
   JavascriptInterface, source, arquivo local ou conteúdo inseguro. Mesmo
   origin/referrer/embed oficial; HTML não aceita URL arbitrária. Controle
   limitado play/pause no sessionId atual, sem executar JS recebido. Eventos
   playing/player-paused separados de paused do lifecycle. Limpar WebView e
   listener ao fechar/pausar app, navegar ou desmontar. Min player200×200;
   vídeo preserva proporção completa dentro do modal.
5. Dialog com Close inicial, Tab preso dentro, D-pad limitado a controles do
   modal e foco restaurado ao gatilho. Back/Escape fecha modal antes de navegar.
   Patch no handleBack somente para dialog[data-detail-modal][open]; rating
   dialog recebe marcador/classe modal-content, sem alterar store ou avaliação.
   Nenhuma mudança global no motor D-pad, player de fonte ou barras de sistema.

## Allowlist estrita

- src/ui/pages/SeriesDetailPage.tsx, MovieDetailPage.tsx: apresentação não-phone.
- src/ui/components/AppShell.tsx: Cast tablet no toolbar de detalhes.
- src/App.tsx: somente fechamento de dialog de detalhes no handleBack.
- src/ui/components/SeriesPersonalActions.tsx: marcador/classe do dialog.
- Novos src/ui/components/SeriesDetailSections.tsx, DetailTrailer.tsx.
- src/ui/components/SeriesTrailer.tsx: modo modal/autoplay/controles/cleanup.
- src/playback/public-trailer.bridge.ts: modo/control/eventos públicos tipados.
- android/app/src/main/java/com/xandeflix/prebuilt/trailer/PublicTrailerPlugin.java
  e PublicTrailerPolicy.java; teste PublicTrailerPolicyTest.java.
- src/index.css: somente seletores das novas seções/modal/toolbar/hero não-phone.
- Novo scripts/test-c11-detail-tablet-tv.mjs: testes reais de componentes/hooks,
  keyboard/cleanup/identidade/perfis, negativos de wiring; testes antigos intactos.
- Este plano; evidência C11_TABLET_TV_DETAIL_TABS_AND_TRAILER_MODAL.md; item51 no
  relatório detalhado; STATUS/DECISIONS/ERRORS_AND_BLOCKERS/EVOLUTION_REPORT.
- Saídas usuais build/sync/Gradle/APK/tsconfig.tsbuildinfo e tmp ignorado.

## Aceitação

Componentes reais: ordem ações→abas→painel, episódios inicialmente, tab/change,
retry/callback, identidade e ausência de stale update. Shell tablet portrait/
landscape tem Cast iconOnly adjacente a Voltar; Fire/desktop/phone não ganham
Cast duplicado. Trailer movie/series modal, autoplay, play/pause, erro/ausência,
Back/fechar/restauração de foco e resize/scroll sem alterar a página; close
antes de navegar, invalid session não controla player. Inline phone preservado.
Policy Java testa modo/tipos/IDs/retângulos/HTML sem privilégios/comandos fechados.
Lock antes/depois/prebuild, suites relacionadas, typecheck/build/sync/Gradle,
APK/assinatura/assets e install-r com hashes privados/firstInstallTime antes/
depois. QA física tablet/Fire em detalhes e D-pad/modal quando disponíveis;
YouTube ready não equivale a vídeo tocando, exigir evento playing/imagem para
alegar reprodução. Não prometer trailer para título sem vídeo público permitido.
Referência primária: https://developers.google.com/youtube/iframe_api_reference.

## Emenda visual — antes do patch complementar

Pedido posterior do usuário: Avaliar/Favoritos/Compartilhar devem ficar ao lado
de Assistir trailer, na mesma linha do hero não-phone. Mover a instância de
SeriesPersonalActions para detail-actions de SeriesDetailPage, preservando
fingerprint canônico/store/share/rating e identificação pública normalizada.
SeriesDetailSections passa a conter somente abas/painel; ficam abaixo do grupo
de ações. CSS exclusivo series-detail-hero-actions mantém alturas/alinhamento
e quebra de linha apenas quando a largura não comporta o grupo, sem overflow.
Phone mantém composição atual. Mesma allowlist; testes verificam composição
real da página, ordem trailer→ações→abas, identidade e ausência de duplicação.
Atualizar APK e conferir novamente o layout instalado tablet/Fire disponíveis.

Emenda posterior antes do CSS: usuário pede Voltar/Transmitir acima do campo do
hero nos detalhes de filmes/séries. page-back-row--detail passa ao fluxo normal,
com padding lateral alinhado ao conteúdo e sem posição absoluta sobre o hero.
Retirar a reserva interna de72px, usando24px no topo do hero não-phone. Toolbar
tablet mantém Cast iconOnly junto de Voltar; Fire mantém somente Voltar. Layout
phone e demais toolbars preservados. Aceitação física: bottom do toolbar menor
ou igual ao top do hero em movie/series; nenhuma sobreposição após metadata.
# Emenda anterior ao código — acabamento do hero e ações de filmes

Pedido de 2026-10-08 durante a entrega: igualar o acabamento dos detalhes ao
hero de categorias (borda suave, clipping do fundo, contorno discreto e mesma
largura útil), eliminar altura mínima que criava espaço vazio e adaptar padding
e poster ao viewport. A altura passa a acompanhar metadados/ações sem recortar
texto. Telefone conserva sua apresentação vertical já autorizada.
MovieDetailPage deve usar SeriesPersonalActions já genérico, kind=movie,
fingerprint canônico e TMDB público validado, ao lado de Assistir trailer.
Nenhum novo armazenamento/rating/share/source/playback. Allowlist51 permanece:
MovieDetailPage.tsx, CSS scoped detail-page--wide e teste existente do ciclo.
QA: um grupo de ações por filme, toolbar acima do hero, cantos arredondados,
conteúdo dentro do hero e ausência da antiga altura mínima Fire; telefone
continua com uma única instância de ações. Sem novo Gate ou Git.
