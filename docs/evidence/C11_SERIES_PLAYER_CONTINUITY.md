# C11 — Continuidade de séries e controles do player — C68

2026-10-10. Pedido explícito do usuário e especificação anterior ao código em
[C11_SERIES_PLAYER_CONTINUITY.md](../architecture/C11_SERIES_PLAYER_CONTINUITY.md).
Clone independente C11-main; origin xandeflix2/xandeflix-prebuilt, main,
HEAD61ec00902be5d0037adf79c68b3a8624b3a2bd6e preservado. Preflight, AGENTS,
Architecture/Execution, Source Boundary e activation lock lidos.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem commit/push/PR, backend, env,
migrações ou mudança de fonte/identidade.

## Comportamento entregue

- Player Android local avança ao STATE_ENDED para o próximo episódio na ordem
  numérica das temporadas/episódios da série ativa. Ignora temporadas vazias,
  cruza temporadas e encerra após o último, sem reiniciar a série.
- Botão Próximo episódio e MEDIA_NEXT usam a mesma transição; os controles
  −10s/+10s continuam independentes. Próximo inicia em zero; seleção pelo
  diálogo respeita a posição salva do episódio escolhido.
- Resolução e autorização/C9 normais são executadas para cada troca. A mesma
  Activity substitui a MediaSource após correlação de playbackId/token.
  Back/stop/revogação invalidam respostas atrasadas; erro não dispara próximo.
  Timeout fecha o player de maneira controlada. Não há segundo player oculto.
- Controles: voltar/título Tn:En, play/pause, seek ±10s, barra/tempo,
  velocidade, lista de episódios, áudio/legendas da própria mídia,
  ajustar/preencher tela e próximo. Brilho/bloqueio somente handheld.
  D-pad navega os controles e diálogos, com contorno de foco visível.
- Lista nativa limitada a200 metadados ao redor do atual; hasNext considera
  a série completa. Não transporta URLs/credenciais dos demais episódios.
  Cast mantém o contrato anterior; esta entrega não adiciona fila ao receptor.

## Verificação automatizada

- Novo teste do serviço/bridge/sequência:8 grupos PASS, incluindo temporadas
  fora de ordem, lacunas, último, picker/retomada, autorização negada,
  duplicatas e Back durante guard/resolver/ack nativo;450 episódios com lista
  nativa limitada a200.
- Regressões de continuidade4, aviso11, hero Fire5, rails/detail Fire10 e
  wiring C9 10/10 PASS. Nenhuma expectativa existente foi relaxada.
- Gradle testDebugUnitTest:166 testes, zero falhas/erros, execução deste ciclo;
  inclui4 testes de correlação/lifecycle. assembleDebug PASS com Java21.
- TypeScript/Vite/cap sync PASS. Avisos existentes de tamanho do bundle e
  imports não bloqueantes permanecem.
- Activation lock final:22+27+9 PASS. Modelos de bridge não certificam
  fisicamente a promoção de catálogo; esse limite anterior é mantido.
- APK: assinatura/package/SDK/standalone e7 arquivos dist verificados byte a
  byte. Recursos acumulados de buffer, PiP, foco, metadados e refresh presentes.

## Conferência no Fire Stick 1

Instalação autorizada depois de o usuário encerrar a reprodução e liberar a
Home. Somente Fire1/AFTSSS recebeu este ciclo, por adb install-r. Snapshot
quiescente antes/depois:1112 arquivos privados idênticos,1066 de catálogo,
5 de estado nativo; grupos catálogo/native/prefs/webview/other preservados,
firstInstallTime preservado e APK instalado com o hash esperado.
Tablet, S24 e Fire2 não receberam esta versão.

Fixture isolada em tmp: amostra MP4 pública do repositório oficial Media3
tag1.5.1; serviço/bridge/read model reais, C9 mock e histórico em memória.
Sem mudar catálogo, fonte ou ativação. Verifica player/IPC/D-pad, não certifica
o backend C9 ou a mídia comercial. O histórico normal ignora os IDs do fixture.
Servidor loopback, listeners e portas ADB usados no teste foram encerrados.

Build13, evidência física:

| Percurso | Resultado |
| --- | --- |
| Fim T1:E1 → T1:E2 | PASS |
| Fim T1:E2 → T2:E1 | PASS |
| D-pad no botão Próximo → T2:E2 | PASS |
| Lista de episódios T2:E2 → T1:E2 | PASS |
| Fim após picker → T2:E1 sem intervenção no bridge | PASS |
| Último T2:E2 sem botão próximo; fim retorna à Main, sem wrap | PASS |
| Velocidade1,25x por D-pad | PASS |
| Menu Áudio e legendas | Abriu; troca efetiva de trilha não certificada |
| Seek por D-pad −10s/+10s | Build12:00:11→00:21→00:11; mesmo binding final |

Captura inspecionada em1920×1080: controles e rótulos de seek dentro da tela;
Cast, brilho e bloqueio handheld ausentes na TV. Toque/brilho/bloqueio/PiP em
celular/tablet não foram testados fisicamente neste ciclo.

Build11 apresentou PLAYER_START_FAILED no picker. Guarda de reposição que
dependia de hasWindowFocus foi substituída por Activity resumed/PiP visível,
mantendo checks de correlação/closed/finishing/cast. Picker passou em12 e13.
Build12 teve uma falha isolada de troca automática. Acrescentados breadcrumbs
fechados, sem payload/URL/segredos, para distinguir solicitação/entrega/rejeição.
A causa exata desse evento não foi estabelecida. Não se repetiu em13, inclusive
no percurso autônomo após picker; não afirmar eliminação definitiva de uma
falha intermitente só pela rodada positiva. Novas regressões prevalecem.

## Artefato e provenance

- Xandeflix-v1.0-build13-standalone.apk — com.xandeflix.prebuilt,
  versionName1.0/versionCode13, minSdk23/targetSdk35;11028571 bytes.
- SHA256:8A13A10BA4ED0CDCF99765475CCF9CB4B2CE4EB0F807ED77B95A8AA62F361C74.
- Certificado SHA256:b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d.
- Bundle index-DLogh0BI.js; CSS index-IWyQqsXk.css.
- Baseline privado795 arquivos;781 fora da allowlist preservados. Patch
  limitado ao plano/serviço/bridge/listener/controles/política/layout/testes,
  versionCode e registros C68. Auditoria final sem arquivos não autorizados,
  HEAD preservado. Nenhum reset ou restauração de dados sobre dados do usuário.

Relatórios privados ignorados em tmp/c11-series-player-20261010:
apk-final.json, physical-final.json, firestick-install.json, provenance-final.json,
service-tests.log, gradle13.log e lock-final13.log. Logs brutos privados não
foram incorporados ao repositório.
