# C11 — Controles do player de TV ao vivo (C73)

Pedido direto de 2026-10-11: canais/categorias/guia/favoritos no player inline
e fullscreen, por toque e D-pad. CURRENT_GATE=NONE; ciclo local autorizado;
NEXT_GATE_STARTED=NAO; Git/backend/env/instalacao em aparelhos nao autorizados.
Preflight: clone independente main, origin xandeflix2/xandeflix-prebuilt,
HEAD61ec00902be5d0037adf79c68b3a8624b3a2bd6e. AGENTS/Architecture/Execution/
Source Boundary/Activation Lock lidos. Baseline privado em tmp/c73-live-player-controls.
Preservar dirty anterior, identidade/chave/licenca/catalogo, filmes/series e selos.

## Especificacao anterior ao codigo

- Player live Android inline e fullscreen usa controles proprios: canal anterior,
  pausa/play, proximo canal; Canais, Categorias, Guia, Favorito/Favoritos, ajuste
  de tela e audio/legendas disponiveis. Indicacao AO VIVO, nome/categoria.
  Sem timeline/duracao zero, velocidade, episodios ou seek +/-10s de VOD.
  Fullscreen expande o mesmo player; Voltar fecha painel antes de sair fullscreen.
- Painel nativo acessivel por D-pad com foco vermelho, listas paginadas48,
  voltar/fechar e retorno ao botao. Categoria apenas altera lista; canal so muda
  por confirmacao. Anterior/proximo segue ordem local da categoria do canal,
  atravessando paginas e sem dar volta no limite. Mensagens claras no limite/erro.
- JS continua autoridade de resolucao/autorizacao. IPC somente previewId, acao,
  IDs e metadata de apresentacao limitada, nunca URLs/headers em eventos/contexto.
  Todas as acoes validam preview atual e selecao atual; carregamentos invalidam
  por geracao/abort. Estado de painel nao inicia sessao nem cria segundo player.
  Troca de canal preserva fullscreen solicitado, serializa stop/release/start e
  readquire C9; falha/revogacao fecha/release conforme fluxo existente.
- Favoritos locais por fonte opaca + fingerprint de canal, schema versionado,
  max200, sem URLs/credenciais/titulos persistidos. Gravar com readback; falha nao
  confirma favorito. Resolver favoritos por segmentos locais paginados somente
  quando solicitado, sem hidratar catalogo completo, nem recuperar source antiga.
- Guia utiliza LiveEpgService autorizado existente; mostra dados reais limitados
  e horarios locais, loading/erro/indisponivel sem inventar grade ou timeshift.
  Refresh ao abrir e enquanto painel aberto; abort ao trocar/sair/revogar.
- Controles principais disponiveis tambem na pagina inline, inclusive favoritos,
  anterior/proximo e fullscreen explicito. Orientacao/estado seguem C72.
- Validar TS/regras React, selecao paginada/limites/categoria/favoritos/source
  isolation/storage failure/stale action, guia e foco/back, Java e regressao
  fullscreen/Cast/PiP/awake/VOD/series. Build/lock/APK assinado/assets conferidos;
  entregar APK para teste remoto, sem afirmar QA fisica ou instalar aparelhos.

Refinamento explicito do usuario: mobile deve alcancar o ultimo canal em
categorias acima de50 (exemplo63). Paginas48 com proxima/anterior, indicador
de intervalo real, scroll/foco reposicionados apos acao explicita. Requests
abortados ao trocar categoria/desmontar; resposta velha nao pode substituir
lista atual. Nao hidratar todos os canais em RAM; nao limitar categoria a48/50.
Filtro local nao oculta os controles de acesso as paginas seguintes.
Verificar63/105 canais, volta a pagina anterior e race de categoria.

Refinamento PiP autorizado: preservar lifecycle, expansao/fechamento e comandos
existentes. Acrescentar RemoteAction silenciar/reativar audio no Live e
play/pause no VOD (filme/serie), operando exclusivamente o player autorizado
atual. Receiver dinamico privado, identificador por instancia, somente PiP;
invalidar PendingIntent e unregister ao fechar. Sem mudar C9 ou persistir mute.
Verificar estados dos icones, preservacao de volume e descarte de acao stale.

Refinamentos visuais explicitos recebidos durante verificacao: hero maior em
tablets para reduzir cortes do backdrop TMDB na Home/Filmes/Series. Regra
restrita app-shell--tablet, horizontal com proporcao16:9 e altura fluida;
enquadrar backdrop sem distorcao. Sem mudar hero de celular/TV ou metadados.
Menu Configuracoes deve usar engrenagem SVG, mesma linguagem dos icones,
aria-label/title/foco preservados. Icone visivel em todos os layouts; rótulo
apenas acessivel no botao de configuracoes. Conferir tablet portrait/landscape,
phone/TV e acesso por D-pad/Enter antes de incluir no mesmo APK final.
Refinamento subsequente: no tablet retrato, menu superior permanece no topo
durante rolagem, com fundo opaco, z-index e safe-area; nao cobrir hero/botoes
nem alterar rolagem interna Live. Allowlist CSS inclui somente essa regra.

## Allowlist estrita

docs/architecture/C11_LIVE_PLAYER_CONTROLS.md;
docs/evidence/C11_LIVE_PLAYER_CONTROLS.md;
docs/{STATUS,DECISIONS,ERRORS_AND_BLOCKERS,EVOLUTION_REPORT}.md;
src/ui/pages/LiveTvPage.tsx; src/ui/pages/LiveTvPage.css (novo);
src/index.css (somente hero tablet, menu superior tablet retrato e icone Configuracoes);
src/ui/components/Header.tsx (somente icone Configuracoes);
src/playback/native-android-player.bridge.ts;
src/playback/live-player-navigation.ts (novo);
src/playback/live-favorites.ts (novo);
android/app/src/main/java/com/xandeflix/prebuilt/player/NativeAndroidPlayerPlugin.java;
android/app/src/main/java/com/xandeflix/prebuilt/player/LivePlayerControls.java (novo);
android/app/src/main/java/com/xandeflix/prebuilt/MainActivity.java (somente teclas live);
android/app/src/main/java/com/xandeflix/prebuilt/player/MobilePipController.java;
android/app/src/main/java/com/xandeflix/prebuilt/player/MobilePipActionState.java (novo);
android/app/src/main/java/com/xandeflix/prebuilt/player/NativePlayerActivity.java (tipo PiP);
android/app/src/test/java/com/xandeflix/prebuilt/player/MobilePipActionStateTest.java (novo);
android/app/src/main/res/layout/live_preview_player.xml (novo);
android/app/src/main/res/layout/xandeflix_live_controls.xml (novo);
android/app/src/main/res/drawable/live_list_focus.xml (novo; seletor de linha);
android/app/src/test/java/com/xandeflix/prebuilt/player/LivePlayerControlsTest.java (novo);
scripts/test-c11-live-player-controls.mjs (novo);
Port de mocks novos em scripts de regressao live apenas se necessario,
preservando assertions anteriores (registrar nomes na evidencia antes de editar).
scripts/test-c11-mobile-output.mjs: aceitar CastButton com props validas,
preservando a verificacao de presenca e comportamento mobile/C9.
Saidas build/Capacitor/assets/APK/tsconfig.tsbuildinfo e helpers privados tmp/c73-live-player-controls.
