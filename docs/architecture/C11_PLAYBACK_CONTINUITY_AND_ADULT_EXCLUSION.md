# C11 — Continuidade de reprodução e exclusão de adultos — ciclo50

2026-10-08. Pedido explícito do usuário: filmes retomam o ponto salvo, Recentes
de séries retoma temporada/episódio e posição, reproduzir novamente um episódio
também retoma sua posição própria. Live abre o último canal não adulto; filmes
adultos nunca aparecem em Recentes. Emenda anterior ao teste físico: usuário
escolheu explicitamente “S24 agora” após reconectar RXGYB03FL4W/SM-S926B.
Emenda anterior à migração física: tablet SM-X610/RX2X301Q3KY conectado por
Wi-Fi após pedido e ativação de depuração pelo usuário; modelo/serial
confirmados por leitura ADB. Concluir S24 e em seguida conferir tablet via
install-r preservando dados. Fire estava fora desta rodada, com
instalações/testes cancelados pelo usuário. Emenda anterior à instalação:
em 2026-10-08 o usuário pediu explicitamente instalar a versão
atualizada nos dois Fire Sticks. Esse pedido autoriza install-r do APK final
251E nos alvos conhecidos 192.168.3.103:5555/AFTSSS e
192.168.3.107:5555/AFTSS, com validação read-only de modelo/SDK/package,
comparação privada de estado antes/depois e hash do APK instalado. Não abrir
o app, acordar os aparelhos, capturar telas nem interferir em outros apps.
Não declarar testes físicos de retomada/capas nesses alvos só por instalar.

Preflight: clone independente C11/main/origin xandeflix2/xandeflix-prebuilt,
HEAD61ec00902be5d0037adf79c68b3a8624b3a2bd6e preservado. AGENTS, Architecture,
Execution, Source Boundary e lock lidos; baseline dirty anterior preservado.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO. Sem commit/push/PR/backend, reset,
troca de fonte/credenciais, rotação de identidade/chave ou relaxamento de C9.

## Especificação anterior ao código

1. Preservar histórico Recentes v1 limitado60/64KiB e dados existentes. Adicionar
   posições locais versionadas próprias até1000 registros/256KiB, um por filme
   ou episódio. Migrar em memória posições antigas disponíveis sem apagar nada.
   Somente IDs opacos, fingerprint, posição/duração, timestamp e conclusão;
   nenhum título, URL, header, segredo ou catálogo persistido nesse registro.
2. PlaybackService consulta posição salva por tipo/ID/fingerprint e episodeId
   exato quando startPositionMs não é explicitamente informado. Opção0 continua
   permitindo reinício deliberado. Filme55min solicita3300000ms; episódioT5E3
   usa ID canônico próprio e posição própria, independentemente de outro episódio
   visto depois. Conclusão real continua reiniciando0; não arredondar para minutos
   nem descartar uma posição positiva por ser menor que1s.
   Emenda anterior ao patch: seek deliberado para0 com duração conhecida
   também substitui posição anterior; evento0 sem duração conhecida durante
   tentativa/buffering não apaga progresso válido.
   Episódio deve pertencer à série atual; C9/fonte/resolver canônicos preservados.
3. Progresso nativo continua periódico5s e na pausa/saída/fim. Journal local
   Android de até4 nonces/eventos sanitizados permite recuperar evento final
   quando JS esteve pausado. Persistir associação nonce→IDs/fingerprint em
   chave local própria até4/8KiB antes da abertura; recuperar journal antes de
   reproduzir e ao montar Recentes. Emenda anterior ao patch: o clique em
   Recentes também aguarda recuperação e usa registro mais novo da mesma
   identidade/fingerprint, incluindo último episódio, para não passar uma
   opção explícita de posição obsoleta durante a recuperação assíncrona.
   Conclusão não pode ser apagada por release
   posterior, timestamps antigos/nonce inválido não sobrescrevem posição nova.
   Não afirmar precisão além do último evento salvo se processo for morto sem
   callbacks. Posicionamento real também depende de seek suportado pela mídia.
4. Categoria/genre explícitos de adultos (Adulto/Adultos/Adults/XXX/pornografia/
   erótico/hentai e marcas inequívocas de canais adultos) determinam exclusão.
   Não tratar classificação etária18 de um filme comum como pornografia; não
   adivinhar pelo título de filme. Live também consulta grupo atual e flag
   explícita adult/isAdult em metadata; nomes inequívocos de canais adultos são
   proteção adicional. Histórico novo adulto pode guardar posição privada, mas
   não entra em Recentes. Registros legados/rebind/first-fold passam pela mesma
   verificação canônica antes de render, sem um frame de capa adulta.
5. Salvar somente último canal não adulto que iniciou reprodução efetiva
   (evento nativo isPlaying com previewId opaco), não um canal que falhou.
   Preferência local única ≤2KiB: IDs opacos/fingerprint/timestamp; sem URL ou
   título. Ao abrir Live, resolver canal no catálogo ativo com ID+fingerprint,
   inclusive se fora do first-fold, por páginas locais48 do grupo. Canal
   removido/reassociado/adulto é recusado; fallback primeiro canal não adulto
   disponível. Categoria adulta primeiro não pode autoexecutar adulto.
   Navegar grupos não troca player; só ação explícita pode tocar adulto.
   Abort/unmount/troca de snapshot não inicia preview tardio; cotas/paginação,
   geometria/fullscreen/EPG/Cast e sessão existentes preservados.

## Allowlist estrita

- src/playback/watch-history.ts: posições, associação local e recuperação.
- src/playback/playback.service.ts: consultar posição/validar vínculo de episódio.
- src/playback/native-android-player.bridge.ts: journal/preview-playing tipados.
- src/playback/content-adult-policy.ts, last-live-channel.ts: novos helpers locais.
- src/ui/recent-title-resolution.ts, components/RecentTitles.tsx: filtro adulto
  em resolução/first-fold e recuperar progresso nativo ao montar.
- src/ui/pages/LiveTvPage.tsx: seleção inicial segura/preferência após isPlaying.
- android/app/src/main/java/com/xandeflix/prebuilt/player/NativeAndroidPlayerPlugin.java:
  journal opaco bounded e evento previewPlaying; nenhum transporte novo.
- Emenda antes do patch, derivada de teste físico: PluginCall.getLong aceita
  somente Long; o JSON real de115995ms é Integer e retornava0, apesar dos
  testes antigos usarem stub que convertia Number. Corrigir exclusivamente
  leitura de startPositionMs em NativeAndroidPlayerPlugin para Number inteiro
  finito seguro, preservando ausência0 e rejeitando negativo/fração/string.
  Incluir casos Integer/Long/Double/ausente/inválido no teste nativo existente
  NativeAndroidPlayerPluginTest.java e assertion da chamada real na suite de
  continuidade. Transporte, cabeçalhos, candidatos e NativePlayerActivity
  permanecem sem mudanças; não adivinhar causa de401 nem mudar fonte.
- android/app/src/main/java/com/xandeflix/prebuilt/player/NativeWatchProgressJournal.java
  e src/test/java/com/xandeflix/prebuilt/player/NativeWatchProgressJournalTest.java.
- scripts/test-c11-playback-continuity.mjs: testes reais novos.
- scripts/test-c11-recent-watched.mjs, test-c11-home-special-collections.mjs:
  compatibilidade de import/port de hook, sem relaxar assertions existentes.
- Emenda anterior ao patch de teste: scripts/test-c11-live-screen-awake.mjs,
  corrigir exclusivamente seletor da mutação negativa de releasePreview;
  a limpeza Cast/PiP existente precede isPreviewActive. Preservar as oito
  mutações negativas e verificações de lifecycle; não alterar releasePreview.
- Este plano, evidência C11_PLAYBACK_CONTINUITY_AND_ADULT_EXCLUSION.md, relatório
  detalhado item50, STATUS/DECISIONS/ERRORS_AND_BLOCKERS/EVOLUTION_REPORT.
- Saídas usuais build/sync/Gradle/APK, inclusive tsconfig.tsbuildinfo gerado
  pelo typecheck, e helpers privados tmp ignorados.

## Aceitação e entrega

Testes significativos com WatchHistory/PlaybackService/resolver reais:
3300000ms/7200000ms, T5E3 entre10×20, alternar episódios, restart, nonce/timestamp,
conclusão, quotas/storage negado, IDs/fingerprint divergentes, episódio alheio
e C9 recusado sem stream; nenhuma URL/título/segredo nas novas persistências.
Filme adulto novo/legado/rebind fora de rail/coleção, filme comum18 preservado.
Live canal fora da página0 recuperado, adulto não substitui preferência,
grupo adulto primeiro/fallback/remoção/reassociação/abort/snapshot/retry.
Journal testa dados reais serializados, ≤4, conclusão sticky e malformados.
Lock obrigatório antes/depois/prebuild; suites relacionadas, TypeScript/build,
Gradle, APK/certificado/assets e install-r S24 e depois tablet com comparação privada
em memória/firstInstallTime. Testes físicos via app autorizado: film/episódio
seek→saída→reabertura, Recentes exato e live retorno; não reproduzir/capturar
conteúdo adulto real para testar filtro. Se S24 não conectado/desbloqueado
ou fonte indisponível, reportar físicos pendentes, sem falso PASS.
