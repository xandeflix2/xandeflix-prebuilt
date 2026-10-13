# C11 — Recentes e retomada — 2026-10-06

Especificação anterior ao código, pedido explícito do usuário: categoria
Recentes logo abaixo do hero Home, últimos filmes/séries assistidos, clique
abre player na posição de saída. CURRENT_GATE=NONE/NEXT_GATE_STARTED=NAO.
Mesmo preflight/proveniência/ciclo C11; sem Git, backend, reset ou novas fontes.

- Histórico exclusivamente local, máximo60 registros/64KiB, chave versionada
  própria no localStorage WebView. Somente kind/movieId/seriesId/episodeId,
  posição/duração/timestamp; nenhum título, URI, artwork URL, header ou segredo
  persistido. Erro de storage conserva RAM sem bloquear boot/playback.
- Progresso nativo sanitizado a cada5s e na pausa/saída/fim; nonce playbackId
  transitório associa evento ao item correto e rejeita sessão desconhecida.
  Resume/terminal IPC anterior mantém allowlist; progresso é evento separado.
  Cast publica posição remota pela mesma via; Live não entra no histórico.
- Gravar apenas depois de progresso >=1s ou fim; filme/série único por item,
  episódio exato mais recente da série. Ordenar por última reprodução, sem
  randomizar. Retomar posição >=0; conteúdo concluído reinicia de0.
- Home mostra até20 recentes reais disponíveis no catálogo atual; first-fold
  imediato, resolução local sob demanda dos demais IDs, um por vez/cancelável.
  Não escanear o catálogo inteiro no boot nem baixar episódios antes de clique.
  Sem histórico = seção ausente. Conteúdo removido não abre referência antiga.
- Clique chama mesmo PlaybackService/C9/resolver autorizado, com posição. Para
  série resolve entidade e usa episódio registrado; não abre detalhe antes.
  Permissão/licença/source atuais sempre revalidadas; histórico não autoriza.

Allowlist: este plano/evidência C11_RECENT_WATCHED_RESUME; acréscimos memória;
src/playback/{watch-history,playback.service,native-android-player.bridge}.ts;
src/ui/components/{RecentTitles,MediaRail}.tsx (preserveOrder opcional); HomePage.tsx; src/index.css;
native player/{NativePlayerActivity,NativeAndroidPlayerPlugin}.java;
native test player/NativeWatchProgressTest.java;
cast/CastController.java; scripts/test-c11-recent-watched.mjs;
somente resolução de novo import no harness SSR test-c11-home-hero;
saídas build/Capacitor/Gradle/APK e tmp ignorados.

Testes significativos: retorno filme/episódio e posição exatos pelo serviço
real com guard/resolver/adapters injetados, recusa de guard antes de stream;
persistência/restart, ordenação, limites, evento stale/malformado, zero URLs,
storage negado, conteúdo removido e fim reiniciando de0. Browser seção abaixo
hero e click sem página intermediária. Suites/lock/typecheck/build/Gradle,
APK/package/certificado/assets e install -r nos três alvos autorizados.
PiP/Cast físicos não homologados por mocks; não alegar precisão temporal além
da amostragem5s se o Android matar o processo antes do evento final.

Refinamento antes do patch: conclusão encerra o nonce de progresso para que
release/onPause posteriores não substituam completed=true. Novo playback do
mesmo item invalida nonce anterior. Serialização também respeita 64KiB mesmo
com IDs longos. Antes da retomada, resolver entidade atual; episódio deve
pertencer à série registrada. Testar mapa nativo de progresso somente com
nonce, posição/duração, timestamp e ended, incluindo valores negativos.

Auditoria da origem antes do refinamento: IDs canônicos M3U/Xtream contêm
dois-pontos (mov:m3u:N, ser:m3u:N, movie:N, series:N). Validação aceita esses
IDs opacos, rejeitando delimitadores de URL / ? #. Testes usam IDs com :
para evitar aprovar somente dados sintéticos incompatíveis com o importador.

Auditoria adicional: IDs M3U são sequenciais; uma nova importação pode reutilizar
um ID para outra obra. Antes de fechar, persistir também fingerprint opaco64bits
dos metadados públicos canônicos (tipo/título/ano/duração/TMDB ID), nunca título
ou URL. Exigir correspondência antes de mostrar/retomar Recentes; registro
legado sem fingerprint fica oculto. Se IDs foram reassociados, omitir até nova
reprodução, em vez de abrir outra obra na posição antiga. Não é autenticação;
C9 continua autoridade. Testar mesmo ID com título diferente e recusa antes de
guard/stream/player. Rebuild/reinstalar APK final nos três aparelhos.
