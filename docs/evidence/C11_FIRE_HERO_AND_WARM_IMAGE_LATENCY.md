# C11 — FIRE_HERO_AND_WARM_IMAGE_LATENCY — evidência de 2026-10-06

Contrato: [C11_FIRE_HERO_AND_WARM_IMAGE_LATENCY](../architecture/C11_FIRE_HERO_AND_WARM_IMAGE_LATENCY.md).
Clone C11 independente, main, HEAD61ec00902be5d0037adf79c68b3a8624b3a2bd6e;
correção local explicitamente solicitada. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.
Specs precederam código. Sem Git/backend/reset/alteração de identidade.

## Implementação

Heroes Home/Filmes/Séries Fire e internos usam75vh, mínimo350/máximo620. Cache Android faz rede e validação fora da trava global; hits não esperam miss, mesma chave compartilha FutureTask. Prune ignora .part e protege arquivo recém-promovido. RAM de caminhos128/TTL5min permite reuso imediato.

## Verificação e limites

Java122/0falhas/0erros inclui concorrência/cache hit durante miss e deduplicação. Suítes JS cobrem prioridade do hero/foco e reuso. Download limita connect/read pelo orçamento restante7s (JS8s); DNS/scheduling do SO não têm teto absoluto certificado. Limites150MiB/1000/30dias/8MiB preservados. Fire físico960×540 confirmou856×405 e bitmaps horizontais decodificados nas três páginas. Comparação de código prova remoção de bloqueio; não mede SLA de rede.

Typecheck/build/lock canônico e APK final passaram. Dados detalhados de fixtures
e aparelhos em tmp/c11-phone-series-20261006 (ignorado, sem conteúdo privado).
A entrega consolidada, hash e preservação de dados estão no
[relatório completo](C11_OPTIMIZATION_REPORT_20261006.md), atualização a partir do item24.
