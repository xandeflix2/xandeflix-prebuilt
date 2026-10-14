# C100 — Duplo toque/clique para seek VOD — 2026-10-13

[Especificação anterior ao código](../architecture/C11_VOD_DOUBLE_TAP_SEEK.md).
Preflight limpo, clone ativo C11, main/origin esperado, HEADd039f8837dfcfd44374560a9e6642cb93e59c2cf;
baseline privada958 hashes. Nenhuma colisão com repositório/package protegido.

## Implementação

Player Android nativo reconhece GestureDetector na área da imagem. Clique/toque
simples confirmado reutiliza PlayerView.performClick da Media3 instalada1.5.1.
Segundo toque concluído no mesmo lado faz um único seek de10s: direita avança,
esquerda recua. Não captura botões/timebar/brilho; ponteiros múltiplos, mouse
secundário, arraste, cancelamento e segundo toque longo não fazem seek.

Política isolada valida geometria finita/lado, duração conhecida, limites e
overflow. Método real NativePlayerActivity.seekFromDoubleTap verifica movie/
series, seekable, comando Media3 e anúncio; retorna deslocamento real para feedback.
Guard de Activity bloqueia fora de foreground, pausa/release, lock, diálogo,
transição, Cast e PiP. Nenhuma alteração play/pause, D-pad, live, C9, fonte,
credenciais ou identidade. Feedback lateral breve não interativo e acessível;
callbacks/gestos cancelados em onPause/release. Interfaces funcionais próprias
evitam exigir java.util.function novo no caminho obrigatório Android API23.

## Verificação

- Gradle compilou recursos XML/Java e executou191 testes JVM/33 suites sem falhas.
- Nova NativeDoubleTapSeekTest:13 testes reais de política/Player proxy, incluindo
  direção em quatro larguras, dois toques no mesmo lado, geometria inválida,
  início/fim, Long.MAX_VALUE, posição/duração inválidas, delta parcial, movie/series,
  live/unknown/null, não-seekable, comando indisponível, anúncio, chamadas únicas,
  gestos sucessivos e preservação play/pause.
- Regressões live-player-controls/live-screen-awake/series-player-continuity/
  playback-continuity PASS. Lock antes/depois PASS, promoção27/27.
- Primeira compilação PASS; revisão de compatibilidade para interfaces próprias
  exigiu recompilação, também PASS. Nenhuma falha funcional encontrada.
- HEAD e APK18 preservados, alterações limitadas à allowlist; diff/check PASS.

Reconhecimento físico de MotionEvent/GestureDetector, hit-testing, feedback e
interação com controles precisam do próximo APK instalado. JVM não certifica
gestos de hardware; nenhum aparelho atualizado, APK gerado ou mudança enviada
ao GitHub neste ciclo. Evidências privadas em tmp/c100-vod-double-tap.

CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem Git/backend/deploy/instalação.
