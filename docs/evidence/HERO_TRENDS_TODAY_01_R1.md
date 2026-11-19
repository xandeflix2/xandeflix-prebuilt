# HERO-TRENDS-TODAY-01-R1 — adaptação à regra vigente do hero

Autorização: pedido expresso de 18/11/2026 para adaptar a nova seleção à regra atual, que não permite espaço vazio com aviso de indisponibilidade. Este ciclo complementa o seletor local de Tendências Hoje ainda não instalado. Gate anterior de verificação de reprodução permanece bloqueado; este R1 não afirma que presença no catálogo garante acesso à mídia.

## Contrato e aceitação antes do código

- Prioridade de apresentação: TMDB Tendências Hoje; se não houver título da fonte ativa, Tendências da Semana; depois TMDB Discover por ano de lançamento/primeira exibição 2026, depois 2025; por fim seleção local de títulos da fonte. Home mistura filmes e séries na ordem de cada faixa; Filmes e Séries filtram o próprio tipo.
- Somente títulos identificados no snapshot local ativo podem ser apresentados. Troca de fonte/snapshot cancela resultados antigos. Dados privados da fonte não são enviados ao TMDB.
- Enquanto uma faixa remota é consultada, manter seleção local já disponível. Falha da API ou ausência de correspondência nunca gera aviso vazio no hero. Se o catálogo ativo não contiver nenhum título, o gate de boot/catálogo permanece autoridade; não inventar mídia.
- `streamId` e presença no catálogo são elegibilidade local, não comprovação de reprodução HTTP. Sem verificador nativo seguro, não iniciar mídia em segundo plano, nem ocultar um título com base em HEAD. HTTP 403 permanece tratado no fluxo de reprodução. O bloqueio do gate de verificação continua explícito.
- Preservar navegação, D-pad, toque, parentalidade, controles, histórico, C9, fonte e player. Sem alteração Android/Supabase. Sem commit/push/PR. Build/instalação dependem de verificação final e autorização aplicável, sem distribuição automática.

## Allowlist fechada

Código: `src/catalog/daily-trending-hero.service.ts`, `src/ui/hooks/useHomeHero.ts`, `src/ui/components/HomeHero.tsx`. Testes: `scripts/test-daily-trending-hero.mjs`, `scripts/test-c11-browse-dynamic-hero.mjs`, `scripts/test-canonical-regression.mjs`. Governança: este spec, recibos aditivos, registro CANON-01 no contrato de expansão e memória STATUS/EVOLUTION/ERRORS. Qualquer arquivo adicional exige nova revisão de escopo antes de escrita.

## Casos obrigatórios

Hoje presente; Hoje vazio/Semana presente; Hoje/Semana vazios/2026 presente; 2026 vazio/2025 presente; todas as faixas remotas vazias/fonte local presente; API falha/seleção local; sem credencial/seleção local; fonte/snapshot troca durante resposta; IDs/título/ano ambíguos; pessoas/adultos fora; preservação da ordem; página por tipo. TypeScript, verificador canônico, regressão completa e lock C11 devem passar antes de qualquer APK.
