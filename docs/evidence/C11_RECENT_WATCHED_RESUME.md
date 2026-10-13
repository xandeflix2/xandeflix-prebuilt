# C11 — Recentes e retomada — evidência

test-c11-recent-watched.mjs: PASS. Cobre persistência/recriação, ordenação,
IDs M3U com dois-pontos, limites de 60 registros/64KiB inclusive UTF-8 longo,
nonce desconhecido, eventos stale/completed/replay, quota/storage negado,
ausência de URI/header e fingerprint opaco persistido sem título público.

Serviço real com guard/resolver/adapters injetados: filme em 123456ms,
episódio exato em 65432ms, concluído em 0, removido ou episódio estranho
recusado. Negação do guard ocorre antes de resolver stream/abrir player.
Fingerprint recusa outra obra no mesmo ID antes de guard/stream/player.
NativeWatchProgressTest: PASS para allowlist nonce/números/ended/timestamp.

Browser final com componentes reais: Recentes abaixo do hero, série e
filme em ordem, clique direto nos parâmetros acima, sem página de detalhe.
Ao reassociar o ID do filme a outro título no catálogo simulado, sua capa
sumiu da faixa e a série continuou visível. Zero erros JS.

M3U usa IDs sequenciais que podem mudar em nova importação. Registros cujo
fingerprint não coincide com a entidade atual, inclusive legado sem
fingerprint, são omitidos até nova reprodução. Não há remapeamento de IDs
nem varredura integral do catálogo. Não se abre outra obra por um ID antigo.

Progresso a cada 5s e na pausa/saída/fim. Morte abrupta antes do evento final
pode perder a última amostra; nenhuma precisão superior foi prometida.
Validação física de reprodução/retomada permanece pendente. Evidência
ignorada: tmp/c11-home-hero-visible-20261006/recent-fingerprint-browser-final.json.

APK e instalações:
[C11_OPTIMIZATION_REPORT_20261006.md](C11_OPTIMIZATION_REPORT_20261006.md).
