# C11 — Buffer por conteúdo e contorno de foco nas capas (ciclo63)

2026-10-10. Pedido explícito: implementar a estratégia de buffer e tornar o
foco D-pad das capas visível com contorno neon, além da sombra. Ciclo local
autorizado, CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO. Preflight no clone C11
independente/main/origin canônico/HEAD61ec00902be5d0037adf79c68b3a8624b3a2bd6e.
AGENTS, Architecture, Execution, Source Data Boundary e Activation Lock lidos.
Capturar baseline de hashes antes de código, preservar patches anteriores.
Sem commit/push/PR, backend/env/fonte ou interferência no projeto protegido.

## Critérios anteriores ao código

- Android Media3 existente1.5.1: fullscreen e preview usam hoje os mesmos
  2500/12000/500/1000ms. Criar política local compartilhada por conteúdo/dispositivo:
  live min10000/max20000/start2500/rebuffer4000ms; filmes/séries/episódios
  min30000/max60000/start4000/rebuffer6000ms. Desconhecido usa VOD conservador.
- Alvo de bytes live16MiB/VOD24MiB em TV; live24MiB/VOD48MiB em handheld;
  aparelho low-RAM ou memoryClass<=128 usa16MiB. Falha de detecção/null usa
  perfil limitado. Bytes têm prioridade sobre duração e back-buffer0; alvo
  de alocação não é limite matemático da memória total nem garantia de segundos.
- Live adaptativo reconhecido pelo Media3 usa target-offset10s, respeitando
  janela disponível. Não impor seek/DVR a TS progressivo; fonte continua direta.
  Recuperação de buffer aproveita o Media3 existente, sem novos retries,
  requests paralelos, download persistido, proxy, transcode ou alteração de Cast.
  Não alterar credenciais/headers/candidatos/autoridade/C9/resume/histórico/erros.
- Manter método legado buildLoadControl usado por testes; chamadas reais passam
  pela política nova. Log apenas perfil/tempos/bytes sanitizados para evidência.
- MediaCard atualmente tem ring translúcido2px e sombra: imagem filha encobre
  parte do inset-shadow. Usar pseudo-elemento acima da imagem, pointer-events:none,
  borda3px rubi brilhante e linha interna clara fina com glow. Pseudo-elemento
  inset0/arredondamento herdado para não ser recortado pela fileira nem deslocar
  dimensões, manter sombra externa. :focus/:focus-visible/.is-focused equivalentes;
  sem zoom/animar, seletor MediaCard somente, sem mudar navegação/callbacks.

## Allowlist estrita

Este contrato; docs/evidence/C11_PLAYBACK_BUFFER_AND_CARD_FOCUS.md;
docs/evidence/C11_OPTIMIZATION_REPORT_20261006.md;
docs/{STATUS,DECISIONS,ERRORS_AND_BLOCKERS,EVOLUTION_REPORT}.md;
android/app/src/main/java/com/xandeflix/prebuilt/player/PlaybackBufferPolicy.java;
android/app/src/main/java/com/xandeflix/prebuilt/player/NativePlayerActivity.java;
android/app/src/main/java/com/xandeflix/prebuilt/player/NativeAndroidPlayerPlugin.java;
android/app/src/test/java/com/xandeflix/prebuilt/player/PlaybackBufferPolicyTest.java;
src/index.css; android/app/build.gradle somente code5/name1.0;
saídas ignoradas build/Capacitor/APK/tsbuild e helpers privados
tmp/c11-buffer-focus-20261010. Nenhum refactor/TSX/cache/metadados/ativação.

## Aceitação e entrega

Testar comportamento real do DefaultLoadControl com falta/reserva/rebuffer,
limiar de bytes/seek e perfis TV/handheld/low-RAM/null, integração dos dois
players e preservação do MediaItem VOD. CSS real em browser com imagens escuras/
claras, rail/grid/relacionados, foco nativo/classe e perfil phone/tablet/Fire;
dimensões/foco único/Enter/D-pad mantidos. Lock/TypeScript/build/sync/Java/assets/
certificado PASS antes de entrega. Não prometer ausência de travamentos ou SLA.

Gerar APK5/name1.0 com package/certificado anteriores. Atualização -r autorizada
no Fire1 AFTSSS/serialG071EL13142513WK/192.168.3.126:5555 disponível, sem player
ativo, com hash dos dados e firstInstallTime antes/depois. QA do foco e buffer
usando somente próprio app/stream autorizado; conteúdo real só disponível e
sem outra sessão ativa. Não desligar Wi-Fi/interromper outros apps para simular
rede; simulação determinística isolada no teste. Tablet/S24 somente se necessário
e disponíveis; Fire2/S23 excluídos. Prova de política/simulação não certifica a
fonte nem AirScreen/Tizen/webOS. Registrar QA físico indisponível com precisão.

## S24 Wi-Fi incluído pelo usuário — 2026-10-10

Usuário forneceu endereço de conexão192.168.3.111:46761 e pareamento temporário.
Conexão ADB autorizada efetiva, modeloSM-S926B e serialRXGYB03FL4W confirmados.
Usar esse transporte nos testes/atualização -r do S24, preservando hash de dados,
firstInstallTime e reprodução ativa. Não registrar código temporário em arquivos
ou usar outro aparelho. O alvo nominal/assinatura/package permanecem os mesmos.
