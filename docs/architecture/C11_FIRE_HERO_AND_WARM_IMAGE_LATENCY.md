# C11 — hero Fire e espera do cache visual — 2026-10-06

Pedidos explícitos após APK FCBA4352: ampliar hero Home/Filmes/Séries no Fire,
reduzir carga visual nessas páginas e na busca. A versão FC foi instalada nos
três aparelhos com dados preservados; não é a entrega final deste novo escopo.
Mesmo clone/main/remote/HEAD; CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.

Diagnóstico anterior ao patch: height/max-height fixos nas regras TV ainda
limitam hero externo. ArtworkDiskCache.get sincroniza inclusive fetch de rede:
um miss bloqueia hits e downloads distintos. useCachedArtwork chama o plugin
novamente após pré-carga, sem RAM de caminhos positivos. Fila de duas imagens
pode ocupar ambos os slots com pôsteres antes de conhecer o backdrop do hero.
Esses mecanismos são verificáveis em código; não constituem prova exclusiva da
latência observada nem da causa do fechamento do Fire antes relatado.

Allowlist: AppShell/MediaCard/Artwork, src/index.css, useCachedArtwork/useHeroArtwork,
src/artwork/{artwork-file-cache,image-load-queue}.ts, android artwork/
{ArtworkDiskCache,ArtworkCachePlugin}.java, novo ArtworkDiskCacheConcurrencyTest,
scripts/test-c11-page-artwork-preparation.mjs; shims de importação source-first
somente. Este contrato, evidência correspondente, relatório e memórias append-only.
PlayCandidate/C9/licença/snapshot/ativação/catálogo permanecem intactos.

Hero externo exclusivo AFT: 75vh, mínimo350px, máximo620px, incluindo preparação;
usar mesma escala do hero interno já aprovado. Não alterar altura mobile/tablet.

Cache: fetch/validação fora da trava de índice/promoção; single flight por hash
via FutureTask. Hits em disco não aguardam rede; plugin resolve hits antes da fila
de downloads. Não podar arquivos .part de downloads paralelos. Limites150MiB,
1000 arquivos,8MiB por imagem e TTL30dias preservados. Orçamento total do fetch
nativo7s (connect/read limitados pelo tempo restante) casa com timeout JS8s e
evita acúmulo de requests expirados. URLs/headers/credenciais nunca em logs/docs.

RAM de caminhos locais:128 entradas, TTL5min, invalidação de arquivo quebrado;
sem persistir URL da fonte. Reuso imediato no render/IPC depois de download.
Reservar no máximo um dos dois slots visuais para o primeiro hero por até8s,
liberando após confirmação, falha/fim ou desmontagem. Capas continuam progredindo
no outro slot; busca sem hero conserva dois slots. Foco promove a imagem da fonte
correspondente na fila, sem varredura extra, API obrigatória ou download de vídeo.

Aceitação: cache hit durante miss bloqueado, downloads distintos concorrentes,
mesma chave deduplicada, promoção/prune de parciais; fila hero/foco/quota/cancel;
cache RAM/TTL/invalidação; browser alturas por perfil; Java/lock/build/C9; verificar
Fire na busca protetor e S24 controls/Cast, mantendo limites físicos honestos.
