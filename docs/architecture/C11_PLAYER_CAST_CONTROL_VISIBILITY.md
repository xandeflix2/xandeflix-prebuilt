# C11 — Cast acompanha visibilidade dos controles — 2026-10-06

Pedido explícito do usuário durante reprodução de filme/série: ícone Transmitir
somente quando controles do player estiverem ativos. CURRENT_GATE=NONE;
NEXT_GATE_STARTED=NAO; mesmo workspace/origin/main/HEAD e contratos deste ciclo.

Evidência anterior ao código: botão adicionado como overlay sempre visível em
NativePlayerActivity.onCreate. Somente PiP altera visibilidade; sair do PiP impõe
VISIBLE mesmo com controller oculto. Não há listener do controller para esse overlay.

Allowlist: android/app/src/main/java/com/xandeflix/prebuilt/player/
NativePlayerActivity.java apenas estados visuais e ControllerVisibilityListener
Media3; este contrato, docs/evidence/C11_PLAYER_CAST_CONTROL_VISIBILITY.md,
relatório e memórias append-only. PlaybackService, C9, intents, URLs, fallback,
Cast relay/licença e PiP eligibility permanecem intactos.

Botão acompanha VISIBLE/GONE do controller, inicializa a partir de sua visibilidade
atual e permanece oculto em PiP. Saída do PiP conserva estado real do controller.
Não acrescentar timer próprio nem intervir no timeout normal dos controles.
Validar API pela dependência Media3 local, compilar/testes Android e quando viável
reprodução via UI normal autorizada no S24, sem extrair fonte ou bypass de C9.
