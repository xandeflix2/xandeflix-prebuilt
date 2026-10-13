# C11 — Continuidade de séries e controles do player — C68 — 2026-10-10

Spec anterior ao código. Pedido explícito: avanço automático ao fim de cada
episódio, inclusive entre temporadas; botão de próximo episódio; controles
inspirados na referência fornecida. Preflight read-only: clone independente
C11-main, origin esperado, main, HEAD61ec00902be5d0037adf79c68b3a8624b3a2bd6e.
AGENTS, Architecture/Execution, Source Boundary e activation lock lidos.
CURRENT_GATE=NONE, ciclo local autorizado pelo pedido; NEXT_GATE_STARTED=NAO.
Nenhum commit/push/PR. Baseline privado preserva todas as mudanças anteriores.

## Contrato e aceitação

1. Ordenar somente episódios da série ativa por seasonNumber/episodeNumber
   numéricos, independentemente da ordem de importação. Ignorar temporadas
   vazias; não cruzar série, não voltar ao primeiro após o último. Usar os
   índices locais segmentados; hidratar apenas a série escolhida. Não resolver
   URLs/headers de todos os episódios antecipadamente.
2. STATE_ENDED solicita o próximo; erros/buffering/Back/PiP fechado não
   solicitam avanço. Próximo manual é distinto de +10s. Guardar progresso do
   anterior; conclusão verdadeira marca concluído. Próximo começa em zero;
   seleção explícita na lista usa a retomada existente daquele episódio.
3. Transição na mesma Activity, substituindo a MediaSource após resolução
   autorizada normal, renovação C9 e source guard. Correlacionar playbackId e
   token de transição; uma solicitação por vez. Back, revogação, parada ou
   resposta atrasada invalida a transição. Falha/timeout30s fecha de forma
   controlada com aviso; não manter segundo player ou áudio escondido.
4. Contexto nativo efêmero: números/IDs/títulos da série ativa, lista de até200
   episódios ao redor do atual para seletor; hasNext calculado na série inteira.
   Sem URLs/credenciais nessa lista, sem backend/catalog upload ou novas APIs.
   Filme/live não recebem navegação de série. Cast mantém seu contrato atual;
   avanço aqui é do player local Android, não uma nova fila do receptor Cast.
5. Controller Media3 customizado: voltar/título, play/pause, ±10s, barra e tempo,
   velocidade, episódios, áudio/legendas existentes, próximo, ajustar/preencher.
   Brilho e bloqueio somente handheld. Controles de TV focáveis; setas navegam
   quando controller aberto, Center aciona item focado, media-next pede próximo.
   Controller fechado revela controles com D-pad sem seek acidental. Diálogos
   navegam normalmente e suspendem auto-hide. Preservar buffer, PiP release,
   Cast mobile, imersão, autorização, histórico e ausência de web fallback.
6. Verificar ordenação/lacunas/final/retomada/manual/duplicatas/revogação/Back
   durante async/falha com testes reais do serviço e política nativa; compilar
   layout/Java e executar suites nativas/lock. Inspecionar o layout e tocar os
   controles com D-pad em Fire1 disponível, usando fixture audiovisual local
   própria sem alterar catálogo/identidade. Device tests se indisponíveis são
   explicitamente pendentes; não afirmar playback físico por testes unitários.
7. Gerar APK standalone versionCode11/name1.0 cumulativo, verificar assinatura,
   assets/package, lock e provenance. Instalação autorizada persistente somente
   Fire1 (192.168.3.126/AFTSSS/G071EL13142513WK), update-r preservando dados se
   disponível. Não atualizar S24/tablet/Fire2 nem interromper outra aplicação.

## Allowlist estrita

- Este plano e docs/evidence/C11_SERIES_PLAYER_CONTINUITY.md.
- Append C68 em docs/{STATUS,DECISIONS,ERRORS_AND_BLOCKERS,EVOLUTION_REPORT}.md
  e docs/evidence/C11_OPTIMIZATION_REPORT_20261006.md.
- src/playback/{episode-sequence.ts,playback.service.ts,
  native-android-player.bridge.ts}; src/App.tsx (somente listener navegação).
- android/app/src/main/java/com/xandeflix/prebuilt/player/
  {NativePlayerActivity.java,NativeAndroidPlayerPlugin.java,
  EpisodeNavigationState.java,PlayerControls.java}.
- android/app/src/main/res/layout/{activity_native_player.xml,
  xandeflix_player_controls.xml}; drawable/player_control_focus.xml,
  drawable/player_controls_scrim.xml.
- scripts/test-c11-series-player-continuity.mjs;
  android/app/src/test/java/com/xandeflix/prebuilt/player/EpisodeNavigationStateTest.java.
- android/app/build.gradle (somente versionCode11); tsconfig.tsbuildinfo;
  saídas usuais ignoradas de build/sync/APK; helpers/evidência privados em
  tmp/c11-series-player-20261010.

Sem refactor geral, novas dependências/backend/env/mudanças de fonte, migração,
reset de app/dados, mudanças de identidade ou Git writes.

## Detalhe do fixture antes do teste físico

Sequência local de teste separada do catálogo comercial, com mídia de amostra
pública do repositório oficial Media3 (tag1.5.1), baixada somente em tmp.
Harness privado compila os módulos reais do serviço/bridge/read model e usa
histórico em memória e guard C9 mock; isso verifica IPC/player/D-pad, não o
backend C9 real. Produção mantém o guard autorizado normal. Sem mudar fonte,
licença ou arquivos de catálogo. Listener padrão ignora IDs de outra sessão.
Servidor ligado somente em loopback e adb reverse, encerrado ao concluir.

## Acabamento antes do patch final de UI

Build11 no Fire confirmou IPC e troca automática T1:E1→T1:E2→T2:E1,
mais botão D-pad próximo até T2:E2. Captura mostrou ícones de seek sem o
valor10 visível. Acrescentar rótulos −10s/+10s dentro das áreas de seek,
sem modificar IDs/binding/ações ou dimensões dos botões. Final versionCode12
para distinguir a rodada instalada de teste do APK entregue. Mesma allowlist
de build.gradle limitada ao versionCode. Guard/lock/provenance mantidos.

## Regressão física no seletor — antes da correção

Build11: controles/auto-next/manual-next/speed PASS, porém seleção pelo diálogo
entrou em preparação e terminou em PLAYER_START_FAILED. Não declarar seletor
concluído. replaceEpisode exige hasWindowFocus, que pode continuar false no
instante de dismiss do diálogo, embora a Activity esteja resumed. Substituir
essa pré-condição pela presença de Activity resumed ou PiP visível; manter
checks de closed/finishing/destroyed/player/cast e correlação de tokens. onPause
invalida foreground, onStop/release invalida token. Política testável inclui
foreground/PiP/background/closed; janela de diálogo não é saída do aplicativo.
Usar o mesmo versionCode12 final ainda não instalado, rerodar testes/physical.

## Regressão no fim automático — diagnóstico antes do patch

Build12 confirmou seleção por diálogo e seek ±10s. Nova rodada ao fim de
T1:E2 entrou em preparação e retornou PLAYER_START_FAILED; sucesso anterior
não certifica esta rodada. Acrescentar breadcrumbs fechados de solicitação,
entrega e rejeição da transição nativa (somente booleanos, motivo e uptime;
sem payload/URL/credenciais), dentro da allowlist já autorizada, para distinguir
atraso do bridge de invalidação de lifecycle. Corrigir somente a causa observada
e rerodar end/manual/select/Back. APK final seguinte será versionCode13 caso
precise de código adicional; registrar resultado real, sem antecipar sucesso.
