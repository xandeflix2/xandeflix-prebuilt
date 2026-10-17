# C115 — tendências TMDB independentes da fonte

Data: 2026-10-15. Autorização: implementar a demanda e gerar APK, sem instalar.
Especificação anterior ao código: `docs/architecture/C11_STARTUP_TMDB_TRENDS.md`.

## Preflight/proveniência

Clone ativo independente `C:/Xandeflix/xandeflix-prebuilt-c11-main`, main,
origin `https://github.com/xandeflix2/xandeflix-prebuilt.git`,
HEAD `0f68f169f7728fae17c8311832b7643629e97a02`. AGENTS, Architecture,
Execution, Source Boundary, Activation Lock e C111 lidos. Baseline privado de
1.030 arquivos, com patches C107–C114 conhecidos, em
`tmp/c115-startup-trending/baseline.json`. CURRENT_GATE=NONE;
CURRENT_LOCAL_CYCLE=C115; NEXT_GATE_STARTED=NAO. Sem Git/backend/reset/install.

## Implementação

Serviço visual opcional só inicia quando a tela de carregamento está montada,
visível, online e fora de erro/offline. Consulta pública única a
trending/movie/day, pt-BR, com configuração TMDB existente. Nenhum acesso a
fonte, identidade, staging, catálogo ou autorização. Import do módulo sem I/O.
Até 20 candidatos com IDs/títulos/filenames sanitizados, excluindo adulto,
duplicado, campos ausentes e URLs externas. Sorteia seis por sessão visual.

Persistência exclusiva de metadados públicos em chave própria: versão/data,
ID, título, poster_path/backdrop_path; nenhuma credencial ou dado da fonte.
Cache fresco6h; stale de até7d pode ser mostrado durante renovação. Cache
negado/corrompido/quota não impede execução; falha segue em RAM. Assinantes
compartilham requisição, timeout4s/cooldown e cancelamento na saída. Não há
polling ou chamadas adicionais por título de tendência.

Celulares carregam somente posters verticais; tablet, TV e quase quadrados
mantêm mosaico de seis capas/progresso e fundo horizontal direto da resposta.
Fila/cache de imagens existentes, tamanhos w342/w780, duas camadas máximas,
fade6s, pausa/visibilidade/reduced-motion preservados. Label Tendências do
cinema/Em alta no TMDB, sem afirmar presença desses filmes na fonte. As
amostras não são itens de catálogo e não oferecem reprodução.

Se TMDB não responde, preserva gradiente/amostra local existente. A Home
continua sendo liberada pelo catálogo utilizável e nunca aguarda este serviço.
Nenhuma alteração em App, bootstrap, critérios/deadlines C108, orientação,
importação, search, fonte, identidade, C9, player ou código nativo.

## Verificações

| Verificação | Resultado |
| --- | --- |
| Serviço real + React/browser C115 | 7 grupos PASS |
| C111 App real, sync/progresso/ações/ordem/layout | 9 grupos PASS; inclui importação directory7 |
| C108 preparo antes da Home/skip/Back/foco/deadline | 13 casos PASS |
| Fila/cache de imagens por página | 5 grupos PASS |
| TypeScript/build Vite | PASS |
| Lock ativação/promoção/negativos | 26+27+9 PASS antes/depois/prebuild/entrega |
| Consulta TMDB real, sem fonte | HTTP200, uma requisição, seis selecionados PASS |
| Capacitor sync/Gradle assembleDebug | PASS |
| APK/assets/assinatura | 7 assets iguais ao dist, mesma assinatura C114 PASS |

C115 cobre dedup, sorteio/limites, TTL/stale7d, segurança de URLs/cache, adulto,
quota, cancelamento/late-response, timeout/cooldown/sem chave, remount; imagens
sem posters da fonte (previewEnabled=false), celular vertical, telas amplas
horizontais sem resolução por título, fade, offline/reduced-motion, Home com
TMDB pendente/falho, ausência de requisição em erro/offline e cancelamento oculto.
Browser usa transporte/imagens TMDB sintéticos interceptados, sem backend real.
Consulta pública real registrada somente como status/contagem, sem token/URL.

Screenshots isolados ilustrativos inspecionados: `trends-{tv,tablet,square,phone}.png`
em tmp/c115-startup-trending; captura após fade, sem overflow. São fixtures,
não fotografias do catálogo real nem homologação física.
Revisão React: hooks incondicionais, subscribe estável condicionado por estado
primitivo, snapshots estáveis, listeners/timers com cleanup, requisição sem
await no boot, sem biblioteca nova nem ampliação da fila/cache consolidados.

Falhas iniciais do harness corrigidas sem relaxar critérios: nome fresh
duplicado; parameter property TS incompatível com Node strip-only (campo
explícito equivalente); falta do CSS global/box-sizing na fixture; fixture
C111 emitia progresso antes da assinatura do coordenador; teste de fade não
fixava a preferência de movimento. Agora aguarda assinatura, usa CSS real e
testa tanto no-preference como reduce. Build conserva avisos anteriores
Vite de chunk/imports/Node externo e Gradle flatDir, sem falha de compilação.

## Artefato

`tmp/c115-startup-trending/Xandeflix-v1.0.19-C115.apk`

- Package com.xandeflix.prebuilt, versionCode19/name1.0.19, minSDK23/target35.
- 11.447.969 bytes, SHA-256
  `ed0f16466e2e1097fcd8d6816a93c211aca46044e2647454a48e4c1c875d69f9`.
- Assets produção HTTPS, sem dev server, certificado igual ao APK C114.
- C114 preservado byte a byte; auditoria incremental allowlist em
  `tmp/c115-startup-trending/audit.json`.

APK de teste local, não publicado no updater e não instalado. Não houve
reset/Git/backend/alteração de credenciais/novo Gate. Testes e consulta da
API não certificam tempo de primeira imagem ou Home no hardware/rede do usuário;
primeira instalação continua dependendo da internet para novas imagens.

Referências: [trending movies](https://developer.themoviedb.org/reference/trending-movies),
[imagens TMDB](https://developer.themoviedb.org/docs/image-basics).
