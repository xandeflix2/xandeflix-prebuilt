# C11 — hero vertical de Filmes e Séries nos celulares — 2026-10-06

Pedido explícito: hero vertical também nas páginas de Filmes e Séries mobile;
Home já funciona assim. Usar perfil phone existente, incluindo paisagem e
excluindo tablet/Fire/desktop. Allowlist: CategoryHero.tsx, src/index.css e
shims de importação de testes se necessários; contrato/evidência/relatório e
memórias append-only. Mesmo clone/main/HEAD; CURRENT_GATE=NONE;
NEXT_GATE_STARTED=NAO; sem Git/backend/identidade/ativação.

CategoryHero solicita imagem vertical ao mesmo serviço de elegibilidade TMDB;
passa mobilePoster ao Hero, preservando preferências de pôster alternativo e
metadados do perfil Home. Reusar CSS2:3/max520px em três páginas, inclusive
placeholder com a mesma proporção. Sem esticar backdrop horizontal para gerar
pôster; sem obrigar imagem da categoria para o destaque. Tablet e Fire continuam
horizontais. Detalhes de filmes continuam fundo horizontal+pôster, e detalhe de
série phone mantém mini player conforme escolha anterior. Não aplicar esta
correção aos detalhes. Testar componente real phone/tablet/Fire, elegibilidade,
altura estável, mudança de viewport, lock/build/APK/instalação atualizada.
