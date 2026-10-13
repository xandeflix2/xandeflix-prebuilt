# C11 — TABLET_HERO_WIDTH — evidência de 2026-10-06

Contrato: [C11_TABLET_HERO_WIDTH](../architecture/C11_TABLET_HERO_WIDTH.md).
Clone C11 independente, main, HEAD61ec00902be5d0037adf79c68b3a8624b3a2bd6e;
correção local explicitamente solicitada. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.
Specs precederam código. Sem Git/backend/reset/alteração de identidade.

## Implementação

Classe app-shell--tablet usa perfil Android sem Mobile/TV ou iPad. Gutter das três páginas reduzido a8px e largura usa área disponível; altura não muda.

## Verificação e limites

Doze casos browser phone/tablet/TV, retrato/paisagem quando aplicável, passaram sem overflow. SM-X610 físico: hero1269,33×480, gutter8 em Home/Filmes/Séries; antes1221,33×480 e gutter32. Ganho48px na mesma viewport. Tablet mantém imagens horizontais e layout interno anterior.

Typecheck/build/lock canônico e APK final passaram. Dados detalhados de fixtures
e aparelhos em tmp/c11-phone-series-20261006 (ignorado, sem conteúdo privado).
A entrega consolidada, hash e preservação de dados estão no
[relatório completo](C11_OPTIMIZATION_REPORT_20261006.md), atualização a partir do item24.
