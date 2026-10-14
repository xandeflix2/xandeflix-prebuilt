# C100 — Duplo toque/clique lateral no player VOD — 2026-10-13

Pedido do usuário: dois toques/cliques à direita avançam e à esquerda recuam em
filmes/séries. Ciclo local de implementação; CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.
Preflight workspace/top-level ativo, origin xandeflix2/xandeflix-prebuilt, main,
HEADd039f8837dfcfd44374560a9e6642cb93e59c2cf, Git limpo. AGENTS, Architecture,
Execution, Source Boundary e Activation Lock lidos. C99 publicação concluída;
este ciclo não autoriza novo commit/push, APK/instalação, banco ou outro aparelho.

## Comportamento e limites

- Player Android nativo é o runtime de vídeo existente. Reconhecer double-tap do
  Android na área da imagem, inclusive mouse primário, toque e stylus.
- Saltos simétricos10s, iguais aos botões atuais; esquerda/direita pela metade
  física do PlayerView. Ambos toques devem pertencer ao mesmo lado.
- Um seek por gesto concluído: confirmar no UP do segundo toque; ignorar arraste,
  múltiplos ponteiros, botão secundário de mouse, segundo toque longo e cancelamento.
- Toque simples confirmado mantém mostrar/ocultar controles; eventos iniciados
  em botões, timebar e brilho ficam com controles nativos, sem seek do gesto.
- Só movie/series, player ativo seekable, duração conhecida e comando Media3
  permitido. Não alterar live, D-pad, mídia/C9, fontes, headers, cast ou PiP.
- Não executar seek com controles bloqueados, diálogo, transição de episódio,
  Activity fora de foreground, PiP, Cast, anúncio ou player liberado.
- Limitar alvo entre zero/duração, sem overflow; não mudar play/pause. Feedback
  breve do deslocamento real do lado acionado; remover callbacks em pausa/release.

## Allowlist e aceitação

NativePlayerActivity.java; novas VodTouchSeekController.java e
VodSeekGesturePolicy.java; activity_native_player.xml para feedback não interativo;
novo NativeDoubleTapSeekTest.java com política real e proxy Player Media3.
Este contrato, docs/evidence/C11_VOD_DOUBLE_TAP_SEEK.md, quatro docs de memória,
tmp/c100-vod-double-tap/** e saídas usuais de testes Gradle ignoradas.
Sem dependência nova, patch TSX/webplayer ou refatoração dos controles existentes.

Lock antes do Gradle; JVM de direção/clamping/overflow/capacidade/estado de
reprodução e regressões nativas passam. Compilar XML/Java e auditar proveniência.
Preservar APK18 e HEAD. Gesto físico precisa da futura instalação de APK contendo
este patch; não declarar teste físico sem execução no aparelho.

Referências primárias consultadas:
[Android double-tap](https://developer.android.com/reference/android/view/GestureDetector.OnDoubleTapListener),
[Media3 PlayerView](https://developer.android.com/reference/androidx/media3/ui/PlayerView).
