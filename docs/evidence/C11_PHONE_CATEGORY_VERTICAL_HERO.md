# C11 — PHONE_CATEGORY_VERTICAL_HERO — evidência de 2026-10-06

Contrato: [C11_PHONE_CATEGORY_VERTICAL_HERO](../architecture/C11_PHONE_CATEGORY_VERTICAL_HERO.md).
Clone C11 independente, main, HEAD61ec00902be5d0037adf79c68b3a8624b3a2bd6e;
correção local explicitamente solicitada. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.
Specs precederam código. Sem Git/backend/reset/alteração de identidade.

## Implementação

CategoryHero usa perfil vertical de useHeroArtwork somente em celulares e mobilePoster do mesmo serviço TMDB. Reusa proporção2:3 e placeholder estável de Home. Internos de filmes continuam fundo horizontal+pôster; série phone mantém mini player.

## Verificação e limites

Browser phone390×844: Filmes/Séries358×537 e todos candidatos perfil vertical. Tablet1184×480 e Fire856×405 horizontais. S24 físico final: Home/Filmes/Séries379,43×569,14, bitmaps780×1170/780×1151/780×1170; sem overflow. Não se estica backdrop para fabricar poster.

Typecheck/build/lock canônico e APK final passaram. Dados detalhados de fixtures
e aparelhos em tmp/c11-phone-series-20261006 (ignorado, sem conteúdo privado).
A entrega consolidada, hash e preservação de dados estão no
[relatório completo](C11_OPTIMIZATION_REPORT_20261006.md), atualização a partir do item24.
