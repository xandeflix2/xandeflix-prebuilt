# C11 — espaçamento compacto de capas e categorias — 2026-10-06

Pedido explícito e imagem de referência: capas próximas e menor intervalo entre
linhas de categorias. Mesmo clone/branch/HEAD deste ciclo; CURRENT_GATE=NONE e
NEXT_GATE_STARTED=NAO. Patch somente CSS, sem alterar seleção, ordenação ou conteúdo.

Allowlist: src/index.css, este contrato, docs/evidence/C11_COMPACT_COVER_SPACING.md,
relatório e memórias append-only. Medida inspirada na referência: 6px entre cards
do carrossel, 8px entre colunas da grade, 12px entre linhas e 12px de margem entre
faixas, com 4px entre título e trilha. Mantém dois cards por linha em semelhantes
de séries no celular e preserve espaço vertical da indicação de foco/sombra.
Aplicar em celulares, tablets, desktop e TV; manter proporções e tamanho das capas.

Aceitação: estilos computados em phone/tablet/Fire, sem overflow da página e
sem interferir no hero, episódios ou foco d-pad. Mudança reversível de layout;
nenhum teste unitário novo é necessário.
