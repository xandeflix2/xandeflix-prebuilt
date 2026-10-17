# C119 — evidência de trailer e imagem horizontal — 2026-10-15

[Especificação anterior ao código](../architecture/C11_TRAILER_ARTWORK_AND_MINIMAL_CONTROLS.md).
Preflight no clone ativo C11-main/main/origin esperado, HEAD
0f68f169f7728fae17c8311832b7643629e97a02. Baseline1041 arquivos;
AGENTS/contratos/Source Boundary/Activation Lock lidos. Patch local solicitado,
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO. Nenhum Git/backend/env/reset/install.

## Resultado final, incluindo correção do usuário

SeriesTrailer não oferece link externo nem barra de controles abaixo do vídeo,
tanto inline quanto no modal. O usuário recusou explicitamente essa barra
durante a execução; proposta intermediária removida antes da entrega. Resta
o play inicial sobre a imagem antes de abrir o embed; depois não há controles
ou mensagens do aplicativo cobrindo o player oficial. controls=0 em iframe web
e HTML da WebView Android usa parâmetro oficial, sem hack de branding/crop.
Interação do próprio YouTube permanece sujeita ao player/plataforma; não
prometer ocultação de todas as informações/marca/recomendações do YouTube.

Ausência de trailer, metadados pendentes ou erro nativo retornam ao Artwork
horizontal TMDB do mesmo título, sem mensagem de indisponibilidade, link,
overlay escuro ou capa vertical esticada. Na ausência da própria imagem
horizontal, fundo neutro sem título/ícone visual, mantendo identificação ARIA.
Proporção16:9/min200px, resolução conservadora e cache de artwork existentes.
aria-busy indica espera sem texto sobre vídeo. Evento de erro de iframe também
aciona fallback; onLoad não certifica reprodução nem detecta todos os erros
internos de incorporação do YouTube.

Preservados isolamento da WebView pública, allowlists ID/sessão/comando,
deduplicação de bounds, pausa/ocultação fora da viewport, cleanup de listener/
WebView, dialog/Back/foco e player da fonte/C9. Produção alterada somente no
componente, CSS de trailer e parâmetro controls da política pública Java.
Sem SDK/dependência/requisição adicional ou mudança em catálogo/source/App.

## Verificações

- Novo teste browser C119:5 grupos PASS, React/SeriesTrailer/Artwork/DetailTrailer
  e CSS reais. Movie/series, loading/ausência/imagem ausente, identidade TMDB,
  ausência de barra/link/mensagem/overlay; iframe oficial após toque, controls0,
  origin/API e pausa fora de tela. Native inline via porta controlada: ready,
  sessão errada ignorada, bounds/visibilidade/dedup, erro→imagem, cleanup e evento
  tardio. Modal web/native com/sem trailer, Escape/Close e restauração do foco.
- Inspeção das capturas phone-horizontal-fallback e tablet-native-frame-no-extra-
  controls PASS. Imagem e superfície de vídeo são fixtures controladas, não
  conteúdo comercial nem evidência de vídeo do YouTube tocando.
- Detalhes tablet/TV:7 grupos PASS. Filme phone:3; série phone:2 PASS.
  Harnesses históricos inicialmente não tinham WatchProviders/perfil do shell
  e extraíam Back com dependências antigas. Bindings/extrator atualizados sem
  mudar produção. Assertions preservadas, exceto a expectativa dos botões
  externos deliberadamente substituída pelo pedido explícito de removê-los.
- Primeiro ensaio browser usava HTMLElement.click(), que não foca o gatilho.
  Usado clique real CDP e espera do cleanup; restauração de foco passou sem
  mudar o modal. Falha era do protocolo de entrada da fixture.
- PublicTrailerPolicyTest:5 testes Java21, zero falhas/erros/skips; ID/modo/
  bounds/origin/isolation/commands fechados preservados, controls0 confirmado.
- TypeScript PASS. Lock inicial e prebuild final26+27+9 PASS; npm build,
  Capacitor sync e Gradle assembleDebug PASS. Avisos anteriores Vite de imports
  Node externalizados, imports estáticos/dinâmicos e chunk grande; flatDir
  Gradle, sem falha nova. Sem relaxar lock ou instalar/atualizar dependências.
- Revisão React: mesmos effects e guardas de sessão/cleanup, menos state em
  scroll, sem hook condicional/novo fetch, ARIA e foco mantidos; CSS restrito
  ao campo de trailer. Nenhuma refatoração dos detalhes/player da fonte.

## APK local

`tmp/c119-trailer-presentation/Xandeflix-v1.0.19-C119.apk`,11.447.598 bytes.
SHA256:38a7267c8beca344fdad95d4c0f7603e150ca8662fafea651e659daffd2d1608.
Package com.xandeflix.prebuilt, versionCode19/versionName1.0.19, min23/target35.
Sete assets byte-idênticos ao dist; HTTPS localhost sem servidor externo, logging
none, mesma assinatura do C118, cujo hash foi preservado e conferido. Build de
teste local, sem publicação no updater/backend/Git. Nenhuma instalação nesta
rodada. QA física de YouTube/toque/controle remoto permanece pendente; evento
simulado ready/playing não certifica vídeo real.

## Consulta adicional: atualização de conteúdo da fonte

Usuário relatou Lançamentos sem mudança há dois dias, em todos os aparelhos
usando a mesma fonte, sem confirmar novos títulos no provedor. Investigação
read-only do código atual confirmou scheduler ligado após AUTHORIZED em App:

- SOURCE_REFRESH_INTERVAL_MS=15min após verificação bem-sucedida. O timer local
  inspeciona vencimento a cada60s; abertura autorizada, online, focus e retorno
  de visibilidade também disparam verificação quando devida. Clock persiste.
- Exige app visível/online e autorização válida. Live/detalhes/modal, sessões
  em resolução/abertura/buffering/playing/paused e Cast ativo adiam consulta.
  Não roda continuamente com app fechado/background nem interrompe playback.
- Falha permite nova tentativa após ao menos1min. checkContent=true consulta
  o conteúdo mesmo quando a configuração/sourceVersion não mudou. Digest igual
  evita parse/promoção; diferente usa staging validado e PROMOTED renova UI.
- Suites existentes automatic-source-refresh19, release-source-order3 e
  directory-orchestration9 PASS, incluindo mudança com mesma sourceVersion,
  cooldown/backoff/foreground, checkpoint e ordem/geração de Lançamentos.

Não foi consultada a fonte comercial nem medido o último clock nos aparelhos.
Portanto isto confirma a configuração/cobertura local, não a última atualização
real de cada instalação nem que o provedor publicou conteúdo. Sem evidência de
defeito novo, nenhuma alteração da rotina/import/cache foi realizada.

Referências oficiais de YouTube na especificação; scripts e evidências privadas
de auditoria/build em tmp/c119-trailer-presentation. Nenhum segredo registrado.
