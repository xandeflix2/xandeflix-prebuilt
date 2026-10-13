# C11 — Encerramento do player ao fechar PiP — 2026-10-10

Especificação anterior ao código, ciclo corretivo local C65 solicitado pelo
usuário. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; Git não autorizado.
Workspace/top-level C:/Xandeflix/xandeflix-prebuilt-c11-main, origin esperado
xandeflix2/xandeflix-prebuilt, main, HEAD 61ec00902be5d0037adf79c68b3a8624b3a2bd6e.
AGENTS, Architecture/Execution/Source Data Boundary e activation lock lidos.
Dirty anterior preservado por baseline privado antes do patch funcional.

## Problema e comportamento

O usuário relata áudio após dispensar a janela PiP, inclusive após retirar o
app dos recentes. NativePlayerActivity.onStop e o preview MainActivity
condicionam a parada a isInPictureInPictureMode=false. Fechamento pode enviar
onStop antes da mudança desse flag, mantendo o player. onDestroy tardio não
é uma condição suficiente para liberar áudio/decoder/buffer.

- PiP visível mantém o mesmo player, inclusive no estado PAUSED da Activity.
- onStop significa perda de visibilidade: sempre pausa a reprodução local,
  independentemente do flag PiP. Fullscreen encerra e libera antes de depender
  de onDestroy; fecha a Activity, salva progresso e emite terminal não-concluído.
- Preview libera ao parar depois de entrar em PiP ou ao finalizar a Activity.
  Guardar entrada em PiP até onResume resolve ambas as ordens dos callbacks.
  Retorno de PiP para fullscreen preserva o player; background comum do preview
  mantém pausa/retomada existentes. Cast remoto e mudança de configuração não
  são confundidos com dispensa PiP. Não introduzir execução em background.
- Release idempotente, remover callbacks periódicos/retentores de views do
  player fechado; listener de layout PiP removido no close. Nenhum timer deve
  reativar reprodução liberada. Progresso final salvo antes de release.
- Usar evento terminal sanitizado existente para liberar sessão C9 do preview
  encerrado; nenhum falso erro de mídia ao fechar PiP.
- Usuário informou aparelhos desconectados e pediu APK para verificação remota:
  nenhuma instalação/operação física nesta rodada. Teste físico fica pendente.

## Allowlist estrita

- Este plano; docs/evidence/C11_PIP_DISMISS_PLAYBACK_RELEASE.md.
- docs/{STATUS,DECISIONS,ERRORS_AND_BLOCKERS,EVOLUTION_REPORT}.md e
  docs/evidence/C11_OPTIMIZATION_REPORT_20261006.md: somente registro C65.
- android/app/src/main/java/com/xandeflix/prebuilt/player/
  {MobilePipLifecycle,MobilePipController,NativePlayerActivity,NativeAndroidPlayerPlugin}.java.
- android/app/src/test/java/com/xandeflix/prebuilt/player/MobilePipLifecycleTest.java.
- android/app/build.gradle: somente versionCode=7, versionName=1.0 mantido.
- Saídas build/sync usuais ignoradas, tsconfig.tsbuildinfo e helpers/evidência
  privada tmp/c11-pip-dismiss-20261010; APK build7 na raiz ignorado.

Sem TSX/CSS, dependências, manifesto, env, backend, fonte/cofre, identidade,
ativação, catálogo, novos Gates, reset, uninstall ou operações Git.

## Aceitação

Testes executáveis das sequências pause/entrada PiP/fechamento nas duas ordens
stop-mode, retorno fullscreen, stop repetido, background preview, configuração,
Cast e progresso antes de release. Regressões nativas completas, continuidade
web existente, lock obrigatório, build/sync/Gradle e verificação package/cert/
assets/APK. Proveniência final zero alterações fora da allowlist, HEAD igual.
Não afirmar teste físico, ausência de áudio real ou homologação de aparelhos
fracos a partir de testes unitários. APK disponibilizado para conferência remota.

Fonte primária: https://developer.android.com/develop/ui/views/picture-in-picture
(onPause mantém PiP; onStop é a fronteira recomendada para parar reprodução).
