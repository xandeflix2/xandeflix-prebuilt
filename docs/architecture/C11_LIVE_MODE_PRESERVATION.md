# C76 — Troca Live preservando fullscreen e PiP

2026-10-11. Pedido direto do usuario: troca de canal por modal/setas e troca de
categoria devem preservar a apresentacao atual. Spec antes do codigo.
Workspace independente canonico, main/origin esperados, HEAD
61ec00902be5d0037adf79c68b3a8624b3a2bd6e; canon e boundary lidos.
CURRENT_GATE=NONE, patch direto; Git commit/push/PR nao autorizados.
Baseline privada posterior C75; dirty anterior preservado. NEXT_GATE_STARTED=NAO.

## Diagnostico e aceite

Cleanup do efeito React encerra PlayerView/Media3/PiP em toda troca e start
recria a instancia antes de reabrir fullscreen. Reutilizar updatePreview URI
na mesma instancia/id/view/controlador PiP. Antes de liberar C9 antigo, parar
e limpar apenas a midia; adquirir C9 novo antes de transmitir o novo canal.
Release/acquire continuam serializados. Categoria so altera lista/modal.
Encerrar pagina, revogacao/erro ou negacao de autorizacao encerra o player;
nao preservar transmissao sem autorizacao nem esconder erros.
Suspensao nao permite play/resume do canal antigo; referencias a candidatos
antigos removidas. Fullscreen/PiP/volume/controller preservados em troca valida.
Eventos antigos/concorrentes nao trocam canais durante handoff. Sem URL em logs.

## Allowlist e verificacao

- LiveTvPage.tsx: lifecycle de troca/autorizacao e bloqueio concorrente.
- native-android-player.bridge.ts: flag de suspensao em updatePreview.
- NativeAndroidPlayerPlugin.java: suspender somente midia, update accepted,
  preservando superficie e PiP. Seu teste unitario: modo/id e stale/inactive.
- docs desta spec/evidence, STATUS/DECISIONS/ERRORS_AND_BLOCKERS/EVOLUTION_REPORT.
- Outputs usuais build/Capacitor/tsbuildinfo/APK e tmp/c76 ignorado.

Verificar React com ports sinteticos: identidade constante, nenhuma saida de
fullscreen/PiP ou novo start durante troca; canais/setas/modal/categorias,
fila C9 sem sobreposicao e nenhuma midia ativa entre release/acquire; negacao,
unmount e cancelamento. Testes Java, suite Live/Cast/PiP existente, lock e build.
APK package/assinatura/assets. Validacao fisica pendente, sem instalacao.
